/**
 * BLE UI Deployment Service
 * Handles sending UI definitions to BLE devices with chunking, progress tracking, and error handling
 */

import type { Screen } from '../types';
import { BLE_LIMITS, BLE_TIMING, BLE_UART_UUIDS } from '../constants/ble';

// ============================================================================
// Types
// ============================================================================

export interface UIDeploymentPayload {
    version: string;
    screen_id: string;
    timestamp: number;
    mode: 'full' | 'delta' | 'force';
    screens: Screen[];
}

export interface ChunkHeader {
    session_id: string;
    chunk_index: number;
    total_chunks: number;
}

export interface ChunkData extends ChunkHeader {
    payload: string;
}

export interface StartSessionPayload {
    cmd: 'start';
    session_id: string;
    size: number;
    chunks: number;
}

export interface CommitPayload {
    cmd: 'commit';
    session_id: string;
}

export interface DeltaUpdatePayload {
    cmd: 'update';
    id: string;
    value: unknown;
}

export interface DeploymentProgress {
    phase: 'idle' | 'preparing' | 'starting' | 'uploading' | 'committing' | 'complete' | 'error';
    currentChunk: number;
    totalChunks: number;
    percentage: number;
    logs: DeploymentLog[];
    error?: string;
}

export interface DeploymentLog {
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
}

export interface BLEConnection {
    device: any;
    server: any;
    txCharacteristic?: any;
    rxCharacteristic?: any;
    mtu: number;
}

export type DeploymentMode = 'full' | 'delta' | 'force';

export interface DeploymentOptions {
    mode: DeploymentMode;
    compress: boolean;
    compressThreshold: number;
    chunkDelay: number;
    debugMode: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: DeploymentOptions = {
    mode: 'full',
    compress: true,
    compressThreshold: 512,
    chunkDelay: BLE_TIMING.DEFAULT_CHUNK_DELAY_MS,
    debugMode: false,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
    return `ui_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Minify JSON by removing whitespace
 */
export function minifyJSON(obj: unknown): string {
    return JSON.stringify(obj);
}

/**
 * Compress data using gzip (if available)
 * Returns base64 encoded string
 */
export async function compressData(data: string): Promise<{ data: string; compressed: boolean }> {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);

    // Check if compression would actually help
    if (typeof CompressionStream === 'undefined') {
        return { data, compressed: false };
    }

    try {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(uint8Array);
        writer.close();

        const compressedStream = cs.readable;
        const compressed = await new Response(compressedStream).arrayBuffer();
        const compressedUint8 = new Uint8Array(compressed);

        // Convert to base64
        let binary = '';
        const bytes = new Uint8Array(compressedUint8);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        return { data: base64, compressed: true };
    } catch {
        return { data, compressed: false };
    }
}

/**
 * Split payload into chunks
 */
export function createChunks(
    payload: string,
    sessionId: string,
    maxChunkSize: number
): ChunkData[] {
    const chunks: ChunkData[] = [];
    const totalChunks = Math.ceil(payload.length / maxChunkSize);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * maxChunkSize;
        const end = Math.min(start + maxChunkSize, payload.length);
        chunks.push({
            session_id: sessionId,
            chunk_index: i,
            total_chunks: totalChunks,
            payload: payload.substring(start, end),
        });
    }

    return chunks;
}

/**
 * Convert chunk to JSON string for BLE transmission
 */
export function chunkToJSON(chunk: ChunkData): string {
    return JSON.stringify(chunk);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate UI schema
 */
export function validateSchema(screens: Screen[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!screens || screens.length === 0) {
        errors.push('No screens defined');
        return { valid: false, errors };
    }

    for (const screen of screens) {
        if (!screen.id) {
            errors.push('Screen missing ID');
        }
        if (!screen.name) {
            errors.push('Screen missing name');
        }
        if (!screen.components) {
            errors.push(`Screen "${screen.name}" missing components array`);
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Check if deployment can proceed
 */
export function canDeploy(
    connection: BLEConnection | null,
    screens: Screen[]
): { valid: boolean; reason?: string } {
    if (!connection) {
        return { valid: false, reason: 'No BLE device connected' };
    }

    if (!connection.server.connected) {
        return { valid: false, reason: 'BLE device disconnected' };
    }

    const validation = validateSchema(screens);
    if (!validation.valid) {
        return { valid: false, reason: validation.errors.join(', ') };
    }

    return { valid: true };
}

// ============================================================================
// BLE UI Deployment Service
// ============================================================================

export class BLEUIDeploymentService {
    private connection: BLEConnection | null = null;
    private options: DeploymentOptions;
    private abortController: AbortController | null = null;

    constructor(options: Partial<DeploymentOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Connect to BLE device and get characteristics
     */
    async connect(
        device: any,
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<BLEConnection> {
        this.log(onProgress, 'info', 'Connecting to BLE device...');

        try {
            const server = await device.gatt.connect();

            // Try to get UART service
            let txCharacteristic: any;
            let rxCharacteristic: any;

            try {
                const service = await server.getPrimaryService(BLE_UART_UUIDS.TX_SERVICE);
                txCharacteristic = await service.getCharacteristic(BLE_UART_UUIDS.TX_CHARACTERISTIC);
                rxCharacteristic = await service.getCharacteristic(BLE_UART_UUIDS.RX_CHARACTERISTIC);
            } catch (e) {
                // Service not found, will use fallback
                this.log(onProgress, 'warn', 'UART service not found, using default');
            }

            const mtu = server.device?.platformMTU || BLE_LIMITS.DEFAULT_MTU;

            this.connection = {
                device,
                server,
                txCharacteristic,
                rxCharacteristic,
                mtu,
            };

            this.log(onProgress, 'info', `Connected with MTU: ${mtu}`);
            return this.connection;
        } catch (error: any) {
            this.log(onProgress, 'error', `Connection failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Set existing connection directly
     */
    setConnection(connection: BLEConnection): void {
        this.connection = connection;
    }

    /**
     * Disconnect from BLE device
     */
    async disconnect(): Promise<void> {
        if (this.connection?.server?.connected) {
            this.connection.server.device?.gatt?.disconnect();
        }
        this.connection = null;
    }

    /**
     * Deploy UI to device
     */
    async deployUI(
        screens: Screen[],
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<void> {
        const progress: DeploymentProgress = {
            phase: 'preparing',
            currentChunk: 0,
            totalChunks: 0,
            percentage: 0,
            logs: [],
        };

        // Validation
        const canDeployResult = canDeploy(this.connection, screens);
        if (!canDeployResult.valid) {
            progress.phase = 'error';
            progress.error = canDeployResult.reason;
            onProgress?.(progress);
            throw new Error(canDeployResult.reason);
        }

        this.abortController = new AbortController();

        try {
            // Phase 1: Prepare payload
            this.log(onProgress, 'info', 'Preparing UI payload...');
            progress.phase = 'preparing';

            const payload = this.preparePayload(screens);
            const minified = minifyJSON(payload);

            // Optionally compress
            let payloadData = minified;
            let isCompressed = false;

            if (this.options.compress && minified.length > this.options.compressThreshold) {
                const compressed = await compressData(minified);
                payloadData = compressed.data;
                isCompressed = compressed.compressed;
                this.log(
                    onProgress,
                    'info',
                    `Payload ${isCompressed ? 'compressed' : 'not compressed'}: ${payloadData.length} bytes`
                );
            }

            // Phase 2: Create chunks
            const sessionId = generateSessionId();
            const maxChunkSize = this.connection!.mtu - BLE_LIMITS.MTU_RESERVED_BYTES;
            const chunks = createChunks(payloadData, sessionId, maxChunkSize);

            progress.totalChunks = chunks.length;
            this.log(
                onProgress,
                'info',
                `Created ${chunks.length} chunks (session: ${sessionId})`
            );

            if (this.options.debugMode) {
                this.log(onProgress, 'debug', `MTU: ${this.connection!.mtu}, Chunk size: ${maxChunkSize}`);
            }

            // Phase 3: Start session
            progress.phase = 'starting';
            await this.sendStartSession(sessionId, payloadData.length, chunks.length, onProgress);

            // Phase 4: Upload chunks
            progress.phase = 'uploading';
            await this.uploadChunks(chunks, progress, onProgress);

            // Phase 5: Commit
            progress.phase = 'committing';
            await this.sendCommit(sessionId, onProgress);

            // Complete
            progress.phase = 'complete';
            progress.percentage = 100;
            this.log(onProgress, 'info', 'Deployment complete!');
            onProgress?.(progress);
        } catch (error: any) {
            progress.phase = 'error';
            progress.error = error.message;
            this.log(onProgress, 'error', `Deployment failed: ${error.message}`);
            onProgress?.(progress);
            throw error;
        }
    }

    /**
     * Deploy delta update (single component change)
     */
    async deployDelta(
        componentId: string,
        value: unknown,
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<void> {
        const progress: DeploymentProgress = {
            phase: 'uploading',
            currentChunk: 1,
            totalChunks: 1,
            percentage: 0,
            logs: [],
        };

        if (!this.connection?.server.connected) {
            progress.phase = 'error';
            progress.error = 'No BLE device connected';
            onProgress?.(progress);
            throw new Error('No BLE device connected');
        }

        try {
            const delta: DeltaUpdatePayload = {
                cmd: 'update',
                id: componentId,
                value,
            };

            const json = JSON.stringify(delta);
            await this.writeData(json);

            progress.phase = 'complete';
            progress.percentage = 100;
            this.log(onProgress, 'info', `Delta update sent for component: ${componentId}`);
            onProgress?.(progress);
        } catch (error: any) {
            progress.phase = 'error';
            progress.error = error.message;
            onProgress?.(progress);
            throw error;
        }
    }

    /**
     * Stop current deployment
     */
    stop(): void {
        this.abortController?.abort();
        this.log(undefined, 'warn', 'Deployment stopped by user');
    }

    // Private methods

    private preparePayload(screens: Screen[]): UIDeploymentPayload {
        return {
            version: '1.0.0',
            screen_id: screens[0]?.id || 'default',
            timestamp: Date.now(),
            mode: this.options.mode,
            screens,
        };
    }

    private async sendStartSession(
        sessionId: string,
        size: number,
        totalChunks: number,
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<void> {
        const startPayload: StartSessionPayload = {
            cmd: 'start',
            session_id: sessionId,
            size,
            chunks: totalChunks,
        };

        const json = JSON.stringify(startPayload);
        await this.writeData(json);
        this.log(onProgress, 'info', `Session started: ${totalChunks} chunks, ${size} bytes`);
    }

    private async uploadChunks(
        chunks: ChunkData[],
        progress: DeploymentProgress,
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<void> {
        for (let i = 0; i < chunks.length; i++) {
            if (this.abortController?.signal.aborted) {
                throw new Error('Deployment aborted');
            }

            const chunk = chunks[i];
            const json = chunkToJSON(chunk);

            await this.writeData(json);

            progress.currentChunk = i + 1;
            progress.percentage = Math.round((i + 1) / chunks.length * 100);
            this.log(onProgress, 'info', `Chunk ${i + 1}/${chunks.length} sent`);

            if (this.options.debugMode) {
                this.log(onProgress, 'debug', `Chunk size: ${json.length} bytes`);
            }

            // Throttle to avoid BLE overflow
            if (i < chunks.length - 1) {
                await this.delay(this.options.chunkDelay);
            }
        }
    }

    private async sendCommit(
        sessionId: string,
        onProgress?: (progress: DeploymentProgress) => void
    ): Promise<void> {
        const commitPayload: CommitPayload = {
            cmd: 'commit',
            session_id: sessionId,
        };

        const json = JSON.stringify(commitPayload);
        await this.writeData(json);
        this.log(onProgress, 'info', 'Commit sent');
    }

    private async writeData(data: string): Promise<void> {
        if (!this.connection?.txCharacteristic) {
            throw new Error('No TX characteristic available');
        }

        const encoder = new TextEncoder();
        const value = encoder.encode(data);

        await this.connection.txCharacteristic.writeValueWithResponse(value);
    }

    private log(
        onProgress: ((progress: DeploymentProgress) => void) | undefined,
        level: DeploymentLog['level'],
        message: string
    ): void {
        const log: DeploymentLog = {
            timestamp: Date.now(),
            level,
            message,
        };

        console[level](`[BLE UI Deploy] ${message}`);
        onProgress?.({
            phase: 'uploading',
            currentChunk: 0,
            totalChunks: 0,
            percentage: 0,
            logs: [log],
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.connection?.server.connected ?? false;
    }

    /**
     * Update options
     */
    setOptions(options: Partial<DeploymentOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get current MTU
     */
    getMTU(): number {
        return this.connection?.mtu ?? 0;
    }
}

// ============================================================================
// Default Export
// ============================================================================

export const bleUIDeploymentService = new BLEUIDeploymentService();