import { useState, useEffect, useCallback } from 'react';
import './BLEMdal.css';

const BLE_UUIDS = {
    SERVICE: 'abcdef01-1234-5678-9abc-def012345678',
    RX_CHARACTERISTIC: 'abcdef02-1234-5678-9abc-def012345678',
};

const DEFAULT_MTU = 23;
const DESIRED_MTU = 247;
const FIXED_PAYLOAD_SIZE = 244; // Device firmware always negotiates MTU 247 → payload 244

function splitIntoChunks(data: Uint8Array, chunkSize: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let index = 0; index < data.length; index += chunkSize) {
        chunks.push(data.slice(index, index + chunkSize));
    }
    return chunks;
}

async function writeTestPayload(
    characteristic: BluetoothRemoteGATTCharacteristic,
    value: Uint8Array
): Promise<'with-response' | 'without-response' | 'basic'> {
    const buffer = new Uint8Array(value).buffer;

    try {
        await characteristic.writeValueWithResponse(buffer);
        return 'with-response';
    } catch {
        // Some firmwares expose write without response only.
    }

    try {
        await characteristic.writeValueWithoutResponse(buffer);
        return 'without-response';
    } catch {
        // Some browsers only implement writeValue.
    }

    await characteristic.writeValue(buffer);
    return 'basic';
}

interface BLEDevice {
    id: string;
    name: string;
    rssi: number;
    nativeDevice?: any;
}

interface BLEModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (device: BLEDevice) => void;
}

export default function BLEMdal({ isOpen, onClose, onConnect }: BLEModalProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [devices, setDevices] = useState<BLEDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
    const [writeCharacteristic, setWriteCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [bluetoothSupported, setBluetoothSupported] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploySuccess, setDeploySuccess] = useState(false);
    const [agreedMtu, setAgreedMtu] = useState(DEFAULT_MTU);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setDevices([]);
            setConnectedDevice(null);
            setWriteCharacteristic(null);
            setError(null);
            setIsScanning(false);
            setIsConnecting(false);
            setIsDeploying(false);
            setDeploySuccess(false);
            setAgreedMtu(DEFAULT_MTU);
        }
    }, [isOpen]);

    // Check Web Bluetooth support
    useEffect(() => {
        setBluetoothSupported('bluetooth' in navigator);
    }, []);

    const startScan = useCallback(async () => {
        const bluetooth = navigator.bluetooth;

        if (!bluetoothSupported || !bluetooth) {
            setError('Web Bluetooth is not supported. Please use Chrome, Edge, or Opera on desktop.');
            return;
        }

        setError(null);
        setIsScanning(true);
        setDevices([]);

        console.log('[BLE] Starting device scan...');

        try {
            // Request a device - this opens the system picker
            const device = await bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', BLE_UUIDS.SERVICE],
            });

            if (!device) {
                setError('No device selected.');
                setIsScanning(false);
                return;
            }

            console.log('[BLE] Device selected:', device.name, device.id);

            const deviceInfo: BLEDevice = {
                id: device.id,
                name: device.name || 'Unknown Device',
                rssi: 0,
                nativeDevice: device
            };

            setDevices([deviceInfo]);
            setIsScanning(false);

        } catch (err: any) {
            console.error('[BLE] Scan error:', err);
            setIsScanning(false);

            if (err.name === 'NotFoundError' || err.message?.includes('No device')) {
                setError('No device selected. Please select a BLE device and try again.');
            } else if (err.name === 'SecurityError') {
                setError('Bluetooth permission denied. Please allow Bluetooth access.');
            } else if (err.name === 'AbortError') {
                setError('Scan was cancelled.');
            } else {
                setError(`Error: ${err.message || err.name}`);
            }
        }
    }, [bluetoothSupported]);

    const handleConnect = useCallback(async (device: BLEDevice) => {
        if (!device.nativeDevice) {
            setError('Device not found.');
            return;
        }

        if (isConnecting) {
            return;
        }

        setError(null);
        setIsConnecting(true);

        console.log('[BLE] Connecting to:', device.name);

        try {
            // Connect via GATT
            const gatt = device.nativeDevice.gatt;
            if (!gatt) {
                setError('GATT not supported on this device.');
                return;
            }

            const server = await gatt.connect();
            console.log('[BLE] Connected:', server.device.name);

            // Device handles MTU negotiation automatically; use fixed payload size
            setAgreedMtu(DESIRED_MTU);
            console.log(`[BLE] Connected, using fixed payload size=${FIXED_PAYLOAD_SIZE} bytes`);

            setConnectedDevice(device);
            setWriteCharacteristic(null);
            onConnect(device);

        } catch (err: any) {
            console.error('[BLE] Connect error:', err);
            setError(`Connection failed: ${err.message || err.name}`);
        } finally {
            setIsConnecting(false);
        }
    }, [isConnecting, onConnect]);

    const handleDisconnect = useCallback(async () => {
        if (connectedDevice?.nativeDevice?.gatt) {
            try {
                connectedDevice.nativeDevice.gatt.disconnect();
            } catch (err) {
                console.log('[BLE] Disconnect error:', err);
            }
        }
        setConnectedDevice(null);
        setWriteCharacteristic(null);
        setAgreedMtu(DEFAULT_MTU);
    }, [connectedDevice]);

    const handleDeploy = useCallback(async () => {
        if (!connectedDevice?.nativeDevice?.gatt) {
            setError('Device is not connected. Reconnect and try again.');
            return;
        }

        setIsDeploying(true);
        setDeploySuccess(false);
        setError(null);

        try {
            const gatt = connectedDevice.nativeDevice.gatt;
            const server = gatt.connected ? gatt : await gatt.connect();

            let characteristic = writeCharacteristic;
            if (!characteristic) {
                const service = await server.getPrimaryService(BLE_UUIDS.SERVICE);
                characteristic = await service.getCharacteristic(BLE_UUIDS.RX_CHARACTERISTIC);
                setWriteCharacteristic(characteristic);
            }

            if (!characteristic) {
                throw new Error('No writable BLE characteristic available');
            }

            const chunkSize = FIXED_PAYLOAD_SIZE; // Always use 244 bytes

            // Build payload to produce exactly 3 chunks: 2 full @ 244 bytes + 1 partial
            // With 247 MTU: chunk_size = 244 bytes, so 3 chunks = 488 + remainder
            const chunk3Size = 25; // 3rd chunk: 25 bytes (can be 1-244)
            const totalLength = chunkSize * 2 + chunk3Size; // 244 * 2 + 25 = 513 bytes

            const header = `PINEVO_3CHUNKS|mtu=247|chunk=${chunkSize}|total=${totalLength}|`;
            const fillerLength = Math.max(0, totalLength - header.length);
            const payload = `${header}${'='.repeat(fillerLength)}`;

            const encoded = new TextEncoder().encode(payload);
            const chunks = splitIntoChunks(encoded, chunkSize);

            console.log(`[BLE] Building 3-chunk test for MTU=247 (payload_size=${chunkSize}, total_bytes=${encoded.byteLength})`);
            for (let i = 0; i < chunks.length; i += 1) {
                console.log(`[BLE]   Chunk ${i + 1}: ${chunks[i].length} bytes`);
            }

            let mode: 'with-response' | 'without-response' | 'basic' = 'basic';
            for (let index = 0; index < chunks.length; index += 1) {
                mode = await writeTestPayload(characteristic, chunks[index]);
                if (index < chunks.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 15));
                }
            }

            console.log(`[BLE] Test payload sent (${mode}), chunks=${chunks.length}:`, payload);

            if (connectedDevice.nativeDevice?.gatt?.connected) {
                connectedDevice.nativeDevice.gatt.disconnect();
                console.log('[BLE] Disconnected after deployment completion');
            }

            setIsDeploying(false);
            setDeploySuccess(true);
            setConnectedDevice(null);
            setWriteCharacteristic(null);

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error('[BLE] Deploy error:', err);
            setIsDeploying(false);
            setDeploySuccess(false);
            setError(`Deploy failed: ${err.message || err.name}`);
        }
    }, [agreedMtu, connectedDevice, onClose, writeCharacteristic]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="ble-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ble-modal-title"
        >
            <div className="ble-modal">
                <div className="ble-modal-header">
                    <h2 id="ble-modal-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M12 2C8.5 2 5.5 3.5 3.5 6" />
                            <path d="M3.5 6c0 0 1 2.5 3.5 4" />
                            <path d="M7 10c0 0 2 2.5 5 2.5s5-2.5 5-2.5" />
                            <path d="M12 12.5c3 0 6 2 6 4.5" />
                            <circle cx="12" cy="17" r="3" />
                            <path d="M9 17l2-4" />
                            <path d="M15 17l-2-4" />
                        </svg>
                        BLE Device Connection
                    </h2>
                    <button
                        className="ble-modal-close"
                        onClick={onClose}
                        aria-label="Close BLE modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="ble-modal-body">
                    {!bluetoothSupported && (
                        <div className="ble-warning" role="alert">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>Web Bluetooth is not supported. Please use Chrome, Edge, or Opera on desktop.</span>
                        </div>
                    )}

                    {error && (
                        <div className="ble-error" role="alert">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {connectedDevice ? (
                        <div className="ble-connected">
                            <div className="ble-connected-status">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span>Connected to {connectedDevice.name}</span>
                            </div>
                            <div className="ble-connected-actions">
                                <button
                                    className={`ble-deploy-btn ${isDeploying ? 'deploying' : ''} ${deploySuccess ? 'success' : ''}`}
                                    onClick={handleDeploy}
                                    disabled={isDeploying || deploySuccess}
                                >
                                    {isDeploying ? (
                                        <>
                                            <span className="ble-spinner"></span>
                                            Sending test payload...
                                        </>
                                    ) : deploySuccess ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Deployed Successfully
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                            Deploy to Device
                                        </>
                                    )}
                                </button>
                                <button
                                    className="ble-disconnect-btn"
                                    onClick={handleDisconnect}
                                    disabled={isDeploying}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                        <line x1="12" y1="2" x2="12" y2="12" />
                                    </svg>
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="ble-devices-header">
                                <span className="ble-devices-count">
                                    {isScanning ? 'Scanning...' : `${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
                                </span>
                            </div>

                            <div className="ble-devices-list" role="listbox" aria-label="Available BLE devices">
                                {devices.length === 0 && !isScanning && (
                                    <div className="ble-empty-state">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                            <path d="M12 2C8.5 2 5.5 3.5 3.5 6" />
                                            <path d="M3.5 6c0 0 1 2.5 3.5 4" />
                                            <path d="M7 10c0 0 2 2.5 5 2.5s5-2.5 5-2.5" />
                                            <path d="M12 12.5c3 0 6 2 6 4.5" />
                                            <circle cx="12" cy="17" r="3" />
                                            <path d="M9 17l2-4" />
                                            <path d="M15 17l-2-4" />
                                        </svg>
                                        <p>No devices found</p>
                                        <span>Click Scan to search for BLE devices</span>
                                    </div>
                                )}

                                {devices.map((device) => (
                                    <button
                                        key={device.id}
                                        className="ble-device-item"
                                        onClick={() => handleConnect(device)}
                                        disabled={isConnecting}
                                        role="option"
                                    >
                                        <div className="ble-device-info">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2C8.5 2 5.5 3.5 3.5 6" />
                                                <path d="M3.5 6c0 0 1 2.5 3.5 4" />
                                                <path d="M7 10c0 0 2 2.5 5 2.5s5-2.5 5-2.5" />
                                                <path d="M12 12.5c3 0 6 2 6 4.5" />
                                            </svg>
                                            <div>
                                                <span className="ble-device-name">{device.name}</span>
                                                <span className="ble-device-id">{device.id}</span>
                                            </div>
                                        </div>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ble-connect-icon">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                ))}
                            </div>

                            <button
                                className={`ble-scan-btn ${isScanning ? 'scanning' : ''}`}
                                onClick={startScan}
                                disabled={isScanning || isConnecting || !bluetoothSupported}
                            >
                                {isScanning ? (
                                    <>
                                        <span className="ble-spinner"></span>
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                                        </svg>
                                        Scan for Devices
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
