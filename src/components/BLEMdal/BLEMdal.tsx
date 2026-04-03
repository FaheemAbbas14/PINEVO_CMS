import { useState, useEffect, useCallback } from 'react';
import './BLEMdal.css';
import { useCMS } from '../../context/AppContext';
import {
    createBLEZipDeploymentPackets,
    generateBLEDeploymentBundle,
    type DeployUIType,
} from '../../services/exportService';

const BLE_UUIDS = {
    SERVICE: 'abcdef01-1234-5678-9abc-def012345678',
    RX_CHARACTERISTIC: 'abcdef02-1234-5678-9abc-def012345678',
    ACK_CHARACTERISTIC: 'abcdef03-1234-5678-9abc-def012345678',
};

const BLE_PACKET_CHUNK_SIZE = 120; // Keep base64+JSON packet size safely below BLE payload limit.
const ACK_TIMEOUT_MS = 8000;
const COMMIT_ACK_TIMEOUT_MS = 30000;
const ACK_RETRY_COUNT = 2;

type AckMatcher = (ack: any) => boolean;

function isAckTimeoutError(error: unknown, label: string): boolean {
    return error instanceof Error && error.message.includes(`Timeout waiting for ${label} ACK`);
}

function decodeAckPayload(value: DataView | null): any | null {
    if (!value) {
        return null;
    }

    try {
        const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        const text = new TextDecoder().decode(bytes).replace(/\0/g, '').trim();

        if (!text) {
            return null;
        }

        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function sendPacketWithAck(
    characteristic: BluetoothRemoteGATTCharacteristic,
    packet: unknown,
    waitForAck: (matcher: AckMatcher, label: string, timeoutMs?: number) => Promise<any>,
    matcher: AckMatcher,
    label: string,
    timeoutMs: number,
    addLog: (level: DeploymentLogEntry['level'], message: string) => void,
    retries = ACK_RETRY_COUNT
): Promise<{ mode: 'with-response'; ack: any }> {
    const packetBytes = new TextEncoder().encode(JSON.stringify(packet));
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
        try {
            const mode = await writeTestPayload(characteristic, packetBytes);
            const ack = await waitForAck(matcher, label, timeoutMs);
            return { mode, ack };
        } catch (error) {
            lastError = error;
            if (attempt <= retries) {
                addLog('warn', `${label} ACK wait failed (attempt ${attempt}/${retries + 1}), retrying...`);
            }
        }
    }

    throw lastError instanceof Error ? lastError : new Error(`Failed sending ${label}`);
}

function isAckSuccessful(ack: any): boolean {
    const cmd = String(ack?.cmd || '').toLowerCase();
    const status = String(ack?.status || ack?.result || '').toLowerCase();

    if (cmd === 'zip_nack' || cmd === 'nack') {
        return false;
    }

    if (status === 'error' || status === 'nack' || status === 'failed') {
        return false;
    }

    if (ack?.ok === false) {
        return false;
    }

    return true;
}

function downloadBundle(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
}

async function setupAckNotifications(
    service: BluetoothRemoteGATTService,
    writeCharacteristic: BluetoothRemoteGATTCharacteristic
): Promise<{
    waitForAck: (matcher: AckMatcher, label: string, timeoutMs?: number) => Promise<any>;
    cleanup: () => Promise<void>;
}> {
    let notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

    try {
        notifyCharacteristic = await service.getCharacteristic(BLE_UUIDS.ACK_CHARACTERISTIC);
    } catch {
        // Fallback handled below.
    }

    if (!notifyCharacteristic && (writeCharacteristic.properties.notify || writeCharacteristic.properties.indicate)) {
        notifyCharacteristic = writeCharacteristic;
    }

    if (!notifyCharacteristic) {
        throw new Error('ACK characteristic not found. Firmware ACK flow requires a notify/indicate characteristic.');
    }

    await notifyCharacteristic.startNotifications();

    const waiters: Array<{
        matcher: AckMatcher;
        resolve: (ack: any) => void;
        reject: (reason: Error) => void;
        timerId: ReturnType<typeof setTimeout>;
    }> = [];

    const onAck = (event: Event) => {
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        const ack = decodeAckPayload(target.value);

        if (!ack) {
            return;
        }

        for (let index = 0; index < waiters.length; index += 1) {
            const waiter = waiters[index];
            if (waiter.matcher(ack)) {
                clearTimeout(waiter.timerId);
                waiters.splice(index, 1);
                waiter.resolve(ack);
                break;
            }
        }
    };

    notifyCharacteristic.addEventListener('characteristicvaluechanged', onAck);

    return {
        waitForAck: (matcher: AckMatcher, label: string, timeoutMs = ACK_TIMEOUT_MS) => new Promise((resolve, reject) => {
            const timerId = setTimeout(() => {
                const waiterIndex = waiters.findIndex((item) => item.timerId === timerId);
                if (waiterIndex >= 0) {
                    waiters.splice(waiterIndex, 1);
                }
                reject(new Error(`Timeout waiting for ${label} ACK (${timeoutMs}ms)`));
            }, timeoutMs);

            waiters.push({ matcher, resolve, reject, timerId });
        }),
        cleanup: async () => {
            notifyCharacteristic?.removeEventListener('characteristicvaluechanged', onAck);
            waiters.forEach((waiter) => {
                clearTimeout(waiter.timerId);
                waiter.reject(new Error('ACK listener stopped before response was received'));
            });
            waiters.length = 0;

            try {
                if (notifyCharacteristic && notifyCharacteristic.properties.notify) {
                    await notifyCharacteristic.stopNotifications();
                }
            } catch {
                // Ignore cleanup notification errors.
            }
        },
    };
}

async function writeTestPayload(
    characteristic: BluetoothRemoteGATTCharacteristic,
    value: Uint8Array
): Promise<'with-response'> {
    const buffer = new Uint8Array(value).buffer;

    if (typeof characteristic.writeValueWithResponse !== 'function') {
        throw new Error('Characteristic does not support write-with-response. Sequential delivery requires ACK-based writes.');
    }

    await characteristic.writeValueWithResponse(buffer);
    return 'with-response';
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
    selectedDeployType?: DeployUIType;
    onDeployTypeChange?: (type: DeployUIType) => void;
}

interface DeploymentLogEntry {
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
}

export default function BLEMdal({
    isOpen,
    onClose,
    onConnect,
    selectedDeployType = 'html',
    onDeployTypeChange,
}: BLEModalProps) {
    const { state } = useCMS();
    const [isScanning, setIsScanning] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [devices, setDevices] = useState<BLEDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
    const [writeCharacteristic, setWriteCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [bluetoothSupported, setBluetoothSupported] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploySuccess, setDeploySuccess] = useState(false);
    const [deployType, setDeployType] = useState<DeployUIType>(selectedDeployType);
    const [deployPhase, setDeployPhase] = useState<'idle' | 'preparing' | 'starting' | 'uploading' | 'committing' | 'complete'>('idle');
    const [deployCurrentChunk, setDeployCurrentChunk] = useState(0);
    const [deployTotalChunks, setDeployTotalChunks] = useState(0);

    const addLog = useCallback((level: DeploymentLogEntry['level'], message: string) => {
        const consoleMethod = level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log';
        console[consoleMethod](`[BLE Deploy] ${message}`);
    }, []);

    const handleDeployTypeChange = useCallback((nextType: DeployUIType) => {
        setDeployType(nextType);
        onDeployTypeChange?.(nextType);
    }, [onDeployTypeChange]);

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
            setDeployType(selectedDeployType);
            setDeployPhase('idle');
            setDeployCurrentChunk(0);
            setDeployTotalChunks(0);
        }
    }, [isOpen, selectedDeployType]);

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

            console.log('[BLE] Connected');

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
    }, [connectedDevice]);

    const handleDownloadZip = useCallback(async () => {
        if (!state.project) {
            setError('No project loaded. Create or open a project before downloading ZIP.');
            return;
        }

        if (!state.screens.length) {
            setError('No screens available to export.');
            return;
        }

        try {
            setError(null);
            const bundle = await generateBLEDeploymentBundle(state, deployType, BLE_PACKET_CHUNK_SIZE);
            downloadBundle(bundle.blob, bundle.fileName);
            addLog('info', `Deployment zip downloaded: ${bundle.fileName}`);
        } catch (err: any) {
            setError(`ZIP download failed: ${err.message || err.name}`);
            addLog('error', `ZIP download failed: ${err.message || err.name}`);
        }
    }, [addLog, deployType, state]);

    const handleDeploy = useCallback(async () => {
        if (!connectedDevice?.nativeDevice?.gatt) {
            setError('Device is not connected. Reconnect and try again.');
            return;
        }

        if (!state.project) {
            setError('No project loaded. Create or open a project before deployment.');
            return;
        }

        if (!state.screens.length) {
            setError('No screens available to deploy.');
            return;
        }

        setIsDeploying(true);
        setDeploySuccess(false);
        setError(null);
        setDeployPhase('preparing');
        setDeployCurrentChunk(0);
        setDeployTotalChunks(0);
        let ackChannel: Awaited<ReturnType<typeof setupAckNotifications>> | null = null;
        let protocolAckEnabled = false;

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

            const service = await server.getPrimaryService(BLE_UUIDS.SERVICE);
            try {
                ackChannel = await setupAckNotifications(service, characteristic);
                protocolAckEnabled = true;
                addLog('info', 'Protocol ACK channel enabled');
            } catch (ackSetupError: any) {
                protocolAckEnabled = false;
                addLog('warn', `Protocol ACK unavailable (${ackSetupError?.message || 'unknown'}), using GATT sequential mode`);
            }

            addLog('info', `Preparing ${deployType.toUpperCase()} deployment bundle from current CMS state...`);
            const bundle = await generateBLEDeploymentBundle(state, deployType, BLE_PACKET_CHUNK_SIZE);
            const packets = createBLEZipDeploymentPackets(bundle);
            setDeployTotalChunks(packets.chunks.length);

            addLog('info', `Bundle file=${bundle.fileName}, bytes=${bundle.bytes.byteLength}, chunks=${packets.chunks.length}`);
            addLog('info', `Device target type=${packets.start.selectedType}, lfs_dir=${packets.start.targetLfsDirectory}`);

            setDeployPhase('starting');
            if (protocolAckEnabled && ackChannel) {
                try {
                    const startResponse = await sendPacketWithAck(
                        characteristic,
                        packets.start,
                        ackChannel.waitForAck,
                        (ack) => {
                            const cmd = String(ack?.cmd || '').toLowerCase();
                            const packet = String(ack?.packet || ack?.type || '').toLowerCase();
                            return cmd === 'zip_start_ack' || ((cmd === 'zip_ack' || cmd === 'ack') && (packet === 'zip_start' || packet === 'start' || packet === ''));
                        },
                        'zip_start',
                        ACK_TIMEOUT_MS,
                        addLog,
                        0
                    );

                    const startAck = startResponse.ack;
                    if (!isAckSuccessful(startAck)) {
                        throw new Error(`Device rejected zip_start: ${JSON.stringify(startAck)}`);
                    }
                    addLog('debug', `Start packet sent (${startResponse.mode}), ack=ok`);
                } catch (startAckError) {
                    if (isAckTimeoutError(startAckError, 'zip_start')) {
                        protocolAckEnabled = false;
                        addLog('warn', 'zip_start ACK timeout, falling back to GATT sequential mode');
                    } else {
                        throw startAckError;
                    }
                }
            } else {
                const startPacketBytes = new TextEncoder().encode(JSON.stringify(packets.start));
                const mode = await writeTestPayload(characteristic, startPacketBytes);
                addLog('debug', `Start packet sent (${mode}), no protocol ACK mode`);
            }

            setDeployPhase('uploading');
            for (let index = 0; index < packets.chunks.length; index += 1) {
                const chunkPacket = packets.chunks[index];
                const expectedIndex = index;
                if (protocolAckEnabled && ackChannel) {
                    try {
                        const chunkResponse = await sendPacketWithAck(
                            characteristic,
                            chunkPacket,
                            ackChannel.waitForAck,
                            (ack) => {
                                const cmd = String(ack?.cmd || '').toLowerCase();
                                const packet = String(ack?.packet || ack?.type || '').toLowerCase();
                                const ackIndex = typeof ack?.index === 'number' ? ack.index : typeof ack?.chunk_index === 'number' ? ack.chunk_index : -1;

                                if (cmd === 'zip_chunk_ack' && ackIndex === expectedIndex) {
                                    return true;
                                }

                                if ((cmd === 'zip_ack' || cmd === 'ack') && (packet === 'zip_chunk' || packet === 'chunk' || packet === '') && ackIndex === expectedIndex) {
                                    return true;
                                }

                                return false;
                            },
                            `zip_chunk[${index}]`,
                            ACK_TIMEOUT_MS,
                            addLog
                        );

                        const chunkAck = chunkResponse.ack;

                        if (!isAckSuccessful(chunkAck)) {
                            throw new Error(`Device rejected chunk ${index + 1}: ${JSON.stringify(chunkAck)}`);
                        }
                    } catch (chunkAckError) {
                        if (isAckTimeoutError(chunkAckError, `zip_chunk[${index}]`)) {
                            protocolAckEnabled = false;
                            addLog('warn', `Chunk ${index + 1} ACK timeout, switching to GATT sequential mode`);
                        } else {
                            throw chunkAckError;
                        }
                    }
                } else {
                    const chunkPacketBytes = new TextEncoder().encode(JSON.stringify(chunkPacket));
                    await writeTestPayload(characteristic, chunkPacketBytes);
                }

                setDeployCurrentChunk(index + 1);

                if ((index + 1) % 10 === 0 || index === packets.chunks.length - 1) {
                    addLog('info', `Chunk ${index + 1}/${packets.chunks.length} sent and ACKed`);
                }

                if (index < packets.chunks.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 15));
                }
            }

            setDeployPhase('committing');
            if (protocolAckEnabled && ackChannel) {
                try {
                    const commitResponse = await sendPacketWithAck(
                        characteristic,
                        packets.commit,
                        ackChannel.waitForAck,
                        (ack) => {
                            const cmd = String(ack?.cmd || '').toLowerCase();
                            const packet = String(ack?.packet || ack?.type || '').toLowerCase();
                            return cmd === 'zip_commit_ack' || ((cmd === 'zip_ack' || cmd === 'ack') && (packet === 'zip_commit' || packet === 'commit' || packet === ''));
                        },
                        'zip_commit',
                        COMMIT_ACK_TIMEOUT_MS,
                        addLog,
                        0
                    );

                    const commitAck = commitResponse.ack;

                    if (!isAckSuccessful(commitAck)) {
                        throw new Error(`Device rejected zip_commit: ${JSON.stringify(commitAck)}`);
                    }

                    addLog('info', `Commit packet sent (${commitResponse.mode}), commit ACK received, deploy completed.`);
                } catch (commitAckError) {
                    if (isAckTimeoutError(commitAckError, 'zip_commit')) {
                        const commitPacketBytes = new TextEncoder().encode(JSON.stringify(packets.commit));
                        const mode = await writeTestPayload(characteristic, commitPacketBytes);
                        addLog('warn', `zip_commit ACK timeout, continuing in GATT sequential mode (${mode})`);
                    } else {
                        throw commitAckError;
                    }
                }
            } else {
                const commitPacketBytes = new TextEncoder().encode(JSON.stringify(packets.commit));
                const mode = await writeTestPayload(characteristic, commitPacketBytes);
                addLog('info', `Commit packet sent (${mode}), no protocol ACK mode.`);
            }
            setDeployPhase('complete');

            // Give the peripheral a short window to flush final logs/state before disconnect.
            await new Promise((resolve) => setTimeout(resolve, 250));

            setIsDeploying(false);
            setDeploySuccess(true);

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error('[BLE] Deploy error:', err);
            setIsDeploying(false);
            setDeploySuccess(false);
            setError(`Deploy failed: ${err.message || err.name}`);
            addLog('error', `Deploy failed: ${err.message || err.name}`);
            setDeployPhase('idle');
        } finally {
            if (ackChannel) {
                await ackChannel.cleanup();
            }
        }
    }, [addLog, connectedDevice, deployType, onClose, state, writeCharacteristic]);

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
                            <div className="ble-deployment-options">
                                <div className="ble-option-group">
                                    <label htmlFor="ble-ui-type">UI Type</label>
                                    <select
                                        id="ble-ui-type"
                                        value={deployType}
                                        onChange={(event) => handleDeployTypeChange(event.target.value as DeployUIType)}
                                        disabled={isDeploying}
                                    >
                                        <option value="html">HTML</option>
                                        <option value="json">JSON</option>
                                    </select>
                                </div>
                            </div>

                            {isDeploying && (
                                <div className="ble-deployment-progress">
                                    <div className="ble-progress-header">
                                        <span className="ble-progress-phase">{deployPhase}</span>
                                        <span className="ble-progress-percent">
                                            {deployTotalChunks > 0 ? Math.round((deployCurrentChunk / deployTotalChunks) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="ble-progress-bar">
                                        <div
                                            className="ble-progress-fill"
                                            style={{
                                                width: `${deployTotalChunks > 0 ? Math.round((deployCurrentChunk / deployTotalChunks) * 100) : 0}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="ble-progress-chunks">
                                        {deployTotalChunks > 0
                                            ? `Chunk ${deployCurrentChunk}/${deployTotalChunks}`
                                            : 'Waiting to start'}
                                    </div>
                                </div>
                            )}

                            <div className="ble-connected-actions">
                                <button
                                    className={`ble-deploy-btn ${isDeploying ? 'deploying' : ''} ${deploySuccess ? 'success' : ''}`}
                                    onClick={handleDeploy}
                                    disabled={isDeploying || deploySuccess}
                                >
                                    {isDeploying ? (
                                        <>
                                            <span className="ble-spinner"></span>
                                            Deploying {deployType.toUpperCase()} bundle...
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
                                    className="ble-download-btn"
                                    onClick={() => {
                                        void handleDownloadZip();
                                    }}
                                    disabled={isDeploying}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download ZIP
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
