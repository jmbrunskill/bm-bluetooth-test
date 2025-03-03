import { Buffer } from 'buffer'
import React, { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { FlatList } from 'react-native'
import { Device } from 'react-native-ble-plx'
import { AppButton, AppText, ScreenDefaultContainer } from '../../../components/atoms'
import type { MainStackParamList } from '../../../navigation/navigators'
import { BLEService } from '../../../services'
import { BleDevice } from '../../../components/molecules'
import { cloneDeep } from '../../../utils/cloneDeep'
import { DropDown } from './DashboardScreen.styled'

type DashboardScreenProps = NativeStackScreenProps<MainStackParamList, 'DASHBOARD_SCREEN'>
type DeviceExtendedByUpdateTime = Device & { updateTimestamp: number }

const MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS = 5000

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [foundDevices, setFoundDevices] = useState<DeviceExtendedByUpdateTime[]>([])

  const addFoundDevice = (device: Device) =>
    setFoundDevices(prevState => {
      if (!isBmDevice(device)) {
        return prevState
      }
      if (!isFoundDeviceUpdateNecessary(prevState, device)) {
        return prevState
      }
      // deep clone
      const nextState = cloneDeep(prevState)
      const extendedDevice: DeviceExtendedByUpdateTime = {
        ...device,
        updateTimestamp: Date.now() + MIN_TIME_BEFORE_UPDATE_IN_MILLISECONDS
      } as DeviceExtendedByUpdateTime

      const indexToReplace = nextState.findIndex(currentDevice => currentDevice.id === device.id)
      if (indexToReplace === -1) {
        return nextState.concat(extendedDevice)
      }
      nextState[indexToReplace] = extendedDevice
      return nextState
    })

  const isFoundDeviceUpdateNecessary = (currentDevices: DeviceExtendedByUpdateTime[], updatedDevice: Device) => {
    const currentDevice = currentDevices.find(({ id }) => updatedDevice.id === id)
    if (!currentDevice) {
      return true
    }
    return currentDevice.updateTimestamp < Date.now()
  }

  const onConnectSuccess = () => {
    navigation.navigate('DEVICE_DETAILS_SCREEN')
    setIsConnecting(false)
  }

  const onConnectFail = () => {
    setIsConnecting(false)
  }

  const isBmDevice = (device: Device) => {
    if (!device.manufacturerData) {
      return false
    }
    // const manufacturerData = Buffer.from(device.manufacturerData || '', 'base64')
    // return manufacturerData.length >= 3 && manufacturerData[1] === 0x33 && manufacturerData[2] === 0x01
    const mfgId = Buffer.from(device.manufacturerData ?? '', 'base64').readInt16LE(0)
    return mfgId === 307 // Manufacturer ID for Blue Maestro
  }

  const deviceRender = (device: Device) => {
    if (!isBmDevice(device)) {
      const hex = Buffer.from(device.manufacturerData || '', 'base64').toString('hex')
      // return null
      return (
        <AppText>
          Not a BM device {hex} - {device.id}
        </AppText>
      )
    }
    return (
      <BleDevice
        onPress={pickedDevice => {
          setIsConnecting(true)
          BLEService.connectToDevice(pickedDevice.id).then(onConnectSuccess).catch(onConnectFail)
        }}
        key={device.id}
        device={device}
      />
    )
  }
  return (
    <ScreenDefaultContainer>
      {isConnecting && (
        <DropDown>
          <AppText style={{ fontSize: 30 }}>Connecting</AppText>
        </DropDown>
      )}
      <AppButton
        label="Look for devices"
        onPress={() => {
          setFoundDevices([])
          BLEService.initializeBLE().then(() => BLEService.scanDevices(addFoundDevice, null, true))
        }}
      />
      {/* <AppButton
        label="Look for devices (legacy off)"
        onPress={() => {
          setFoundDevices([])
          BLEService.initializeBLE().then(() => BLEService.scanDevices(addFoundDevice, null, false))
        }}
      /> */}
      {/* <AppButton label="Ask for permissions" onPress={BLEService.requestBluetoothPermission} />
      <AppButton label="Go to nRF test" onPress={() => navigation.navigate('DEVICE_NRF_TEST_SCREEN')} />
      <AppButton label="Call disconnect with wrong id" onPress={() => BLEService.isDeviceWithIdConnected('asd')} />
      <AppButton
        label="Connect/disconnect test"
        onPress={() => navigation.navigate('DEVICE_CONNECT_DISCONNECT_TEST_SCREEN')}
      />
      <AppButton label="On disconnect test" onPress={() => navigation.navigate('DEVICE_ON_DISCONNECT_TEST_SCREEN')} /> */}
      <FlatList
        style={{ flex: 1 }}
        data={foundDevices}
        renderItem={({ item }) => deviceRender(item)}
        keyExtractor={device => device.id}
      />
    </ScreenDefaultContainer>
  )
}
