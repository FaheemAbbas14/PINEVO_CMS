// Web Bluetooth API Type Definitions
// Based on W3C Web Bluetooth Specification

interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer | null;
}

interface BluetoothRemoteGATTServer {
    device: BluetoothDevice;
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
    readonly properties: BluetoothCharacteristicProperties;
    readonly value: DataView | null;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
    removeEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
}

interface BluetoothCharacteristicProperties {
    readonly broadcast?: boolean;
    readonly read?: boolean;
    readonly writeWithoutResponse?: boolean;
    readonly write?: boolean;
    readonly notify?: boolean;
    readonly indicate?: boolean;
    readonly authenticatedSignedWrites?: boolean;
    readonly reliableWrite?: boolean;
    readonly writableAuxiliaries?: boolean;
}

interface BluetoothRequestDeviceOptions {
    filters?: BluetoothLEScanFilter[];
    acceptAllDevices?: boolean;
    optionalServices?: BluetoothServiceUUID[];
}

interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
}

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

interface Navigator {
    bluetooth?: Bluetooth;
}

interface Bluetooth {
    requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    getAvailability(): Promise<boolean>;
    getDevices(): Promise<BluetoothDevice[]>;
    onavailabilitychanged?: EventListener;
}
