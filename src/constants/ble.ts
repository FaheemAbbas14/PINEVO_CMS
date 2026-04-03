// UUIDs used by the CMS zip deployment flow in the BLE modal.
export const BLE_CMS_UUIDS = {
    // Primary custom BLE service exposed by the device firmware.
    SERVICE: 'abcdef01-1234-5678-9abc-def012345678',
    // Write characteristic used to send zip_start/zip_chunk/zip_commit packets.
    RX_CHARACTERISTIC: 'abcdef02-1234-5678-9abc-def012345678',
    // Notify characteristic used to receive ACK and deployment status messages.
    ACK_CHARACTERISTIC: 'abcdef03-1234-5678-9abc-def012345678',
} as const;

// UUIDs for the Nordic UART-style BLE transport used by the older deployment service.
export const BLE_UART_UUIDS = {
    // UART service that groups TX/RX characteristics.
    TX_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    // Write characteristic for sending data to the peripheral.
    TX_CHARACTERISTIC: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    // Same UART service reused when resolving the RX notify characteristic.
    RX_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    // Notify characteristic for receiving data back from the peripheral.
    RX_CHARACTERISTIC: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
} as const;

// Timing values that control BLE retries, pacing, and modal behavior.
export const BLE_TIMING = {
    // Default time to wait for zip_start/zip_chunk ACK messages.
    ACK_TIMEOUT_MS: 8000,
    // Longer timeout for the final commit/status phase on device.
    COMMIT_ACK_TIMEOUT_MS: 30000,
    // Number of resend attempts before failing an ACK-based packet send.
    ACK_RETRY_COUNT: 2,
    // Small pause between chunk writes to reduce BLE buffer pressure.
    INTER_CHUNK_DELAY_MS: 15,
    // Short delay before closing the deployment dialog after completion.
    DEPLOY_DIALOG_CLOSE_DELAY_MS: 2*60*1000, // 2 minutes
    // Default delay used by the legacy BLE deployment service between chunks.
    DEFAULT_CHUNK_DELAY_MS: 50,
} as const;

// Size limits and fallback transport assumptions for BLE payload handling.
export const BLE_LIMITS = {
    // JSON packet payload size used by the modal deploy flow.
    MODAL_PACKET_CHUNK_SIZE: 120,
    // Fallback MTU when the browser/device does not report one.
    DEFAULT_MTU: 20,
    // Bytes reserved for JSON/protocol overhead when deriving chunk size from MTU.
    MTU_RESERVED_BYTES: 20,
} as const;