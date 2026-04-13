/**
 * Central configuration file for the PINEVO CMS project.
 * Contains all constants, feature flags, and tunable parameters used across the app.
 */

// ============================================================================
// App Metadata
// ============================================================================

export const APP_CONFIG = {
    name: 'PINEVO CMS',
    version: 1,
} as const;

// ============================================================================
// BLE Configuration
// ============================================================================

export const BLE_CONFIG = {
    // Feature flag: enable protocol-level ACK waiting for zip_* packets.
    // When true, the modal waits for zip_start_ack, zip_chunk_ack, zip_commit_ack.
    // When false, packets are sent without waiting for ACK (faster but less reliable).
    waitForAckOnChunks: true,

    // UUIDs for the CMS zip deployment flow
    cms: {
        SERVICE: 'abcdef01-1234-5678-9abc-def012345678',
        RX_CHARACTERISTIC: 'abcdef02-1234-5678-9abc-def012345678',
        ACK_CHARACTERISTIC: 'abcdef03-1234-5678-9abc-def012345678',
    },

    // UUIDs for the Nordic UART-style BLE transport
    uart: {
        TX_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        TX_CHARACTERISTIC: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        RX_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        RX_CHARACTERISTIC: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
    },

    // Timing values for BLE operations
    timing: {
        // How long to wait for normal zip_start/zip_chunk ACK responses.
        ackTimeoutMs: 8000,
        // Longer timeout for the final commit/status phase.
        commitAckTimeoutMs: 120000,
        // Number of resend attempts before failing an ACK-based packet.
        ackRetryCount: 2,
        // Small pause between chunk writes to reduce BLE buffer pressure.
        interChunkDelayMs: 15,
        // Delay before closing the deployment dialog after completion.
        deployDialogCloseDelayMs: 250,
        // Default chunk delay used by the legacy BLE deployment service.
        defaultChunkDelayMs: 50,
    },

    // Payload sizing and transport limits
    limits: {
        // JSON packet payload size used by the modal deploy flow.
        modalPacketChunkSize: 120,
        // Fallback MTU when the browser/device does not report one.
        defaultMtu: 20,
        // Bytes reserved for JSON/protocol overhead when deriving chunk size.
        mtuReservedBytes: 20,
    },
} as const;

// ============================================================================
// Export/Deployment Configuration
// ============================================================================

export const EXPORT_CONFIG = {
        // PNG upload constraints for image assets
        pngUpload: {
            maxWidth: 320, // update as needed
            maxHeight: 240, // update as needed
            maxFileSize: 100 * 1024, // 100 KB, update as needed
            allowedFormats: ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'webp'],
        },
    // App name embedded in export metadata.
    appName: 'PINEVO CMS',
    // Export metadata version.
    metaVersion: 1,
    // LFS storage backend path prefix.
    lfsDeploy: {
        backend: 'lfs',
        basePath: '/lfs/ui',
    },
    // Deployment image conversion mode: 'raw' (uncompressed RGBA) or 'auto' (JPEG/PNG based on transparency)
    deploymentImageFormat: 'auto', // 'raw' | 'auto'
    // Folder paths for selected UI types.
    ui: {
        html: 'ui/html',
        json: 'ui/json',
    },
    // Deployment packet command names.
    commands: {
        zipStart: 'zip_start',
        zipChunk: 'zip_chunk',
        zipCommit: 'zip_commit',
        zipCommitStatus: 'zip_commit_status',
    },
} as const;

// ============================================================================
// Canvas/UI Configuration
// ============================================================================

export const CANVAS_CONFIG = {
    // Default zoom/scale level on app load.
    defaultZoomLevel: 1,
    // Zoom increment on ctrl+scroll.
    zoomIncrementPerScroll: 10,
} as const;

// ============================================================================
// UI Timing
// ============================================================================

export const UI_TIMING = {
    // Toast notification display duration in milliseconds.
    toastDisplayMs: 3000,
    // Modal transition and animation duration.
    transition: {
        fast: 150,
        normal: 250,
        slow: 500,
    },
} as const;

// ============================================================================
// Storage & File Configuration
// ============================================================================

export const STORAGE_CONFIG = {
    // Filename suffixes for various export types.
    exportFileNames: {
        html: '_ui.zip',
        json: '_screens_json.zip',
        deployment: '_deploy_bundle.zip',
    },
    // Fallback project name when none is provided.
    defaultProjectName: 'pinevo_project',
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
    // Enable BLE deployment workflow.
    enableBleDeployment: true,
    // Enable protocol-level ACK waiting.
    enableProtocolAck: false,
    // Enable HTML UI export/deployment format.
    enableHtmlUiFormat: true,
    // Enable JSON UI export/deployment format.
    enableJsonUiFormat: false,
    // Enable sandbox mode for testing.
    enableSandboxMode: true,
    // Enable preview mode for screen interactions.
    enablePreviewMode: true,
} as const;
