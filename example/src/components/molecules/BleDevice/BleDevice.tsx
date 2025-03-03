import { Buffer } from 'buffer'
import React from 'react'
import { Device } from 'react-native-ble-plx'
import { Container } from './BleDevice.styled'
import { DeviceProperty } from './DeviceProperty/DeviceProperty'

export type BleDeviceProps = {
  onPress: (device: Device) => void
  device: Device
}

interface ParsedData {
  battery?: number
  logIntevalSec?: number
  storedLogCount?: number
  currentTemp?: number
  currentHumidity?: number
}

const parseData = (rawScanRecord: Buffer) => {
  if (rawScanRecord.length < 16) {
    return null
  }
  const version = rawScanRecord.readUInt8(7)
  // console.log('version:', version)
  if (version !== 23) {
    // Unsupported version
    return null
  }

  const battery = rawScanRecord.readUInt8(8)

  const logIntevalSec = rawScanRecord.readUInt16BE(9)

  const storedLogCount = rawScanRecord.readUInt16BE(11)

  const currentTemp = rawScanRecord.readUInt16BE(13) / 10.0

  const currentHumidity = rawScanRecord.readUInt16BE(15) / 10.0

  return { battery, logIntevalSec, storedLogCount, currentTemp, currentHumidity }
}

export function BleDevice({ device, onPress }: BleDeviceProps) {
  // const isConnectableInfoValueIsUnavailable = typeof device.isConnectable !== 'boolean'
  // const isConnectableValue = device.isConnectable ? 'ture' : 'false'
  // const parsedIsConnectable = isConnectableInfoValueIsUnavailable ? '-' : isConnectableValue
  const rawBuffer = Buffer.from(device.rawScanRecord, 'base64')
  const manufBuffer = Buffer.from(device.manufacturerData ?? '', 'base64')
  if (device.name?.includes('CB')) {
    console.log('device:', device.name)
    console.log('rawScanRecord:', rawBuffer.toString('hex'))
    console.log('parsed', parseData(rawBuffer))
  }
  let data = parseData(rawBuffer)

  return (
    <Container onPress={() => onPress(device)}>
      <DeviceProperty name="name" value={device.name} />
      {/* <DeviceProperty name="localName" value={device.localName} /> */}
      <DeviceProperty name="id" value={device.id} />
      {/* <DeviceProperty name="manufacturerData" value={manufBuffer.toString('hex')} /> */}
      {/* <DeviceProperty name="Version" value={manufBuffer.readUInt8(0).toString()} /> */}
      {/* <DeviceProperty name="rawScanRecord" value={rawBuffer.toString('hex')} /> */}
      <DeviceProperty name="Temperature" value={data?.currentTemp} />
      <DeviceProperty name="Humidity" value={data?.currentHumidity} />
      <DeviceProperty name="Battery" value={data?.battery} />
      <DeviceProperty name="Log Interval" value={data?.logIntevalSec} />
      <DeviceProperty name="Stored Log Count" value={data?.storedLogCount} />
      {/* <DeviceProperty name="isConnectable" value={parsedIsConnectable} /> */}
      {/* <DeviceProperty name="mtu" value={device.mtu.toString()} /> */}
      {/* <DeviceProperty name="rssi" value={device.rssi} /> */}
    </Container>
  )
}
