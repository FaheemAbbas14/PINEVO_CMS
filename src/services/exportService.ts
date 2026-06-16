// Helper to collect all used font family/size pairs in the project
function getFontKey(family: string | undefined, size: number | undefined) {
  const fontFileMap: Record<string, string> = {
    'Carlito-Regular': 'carlito-regular',
    'Carlito-Bold': 'carlito-bold',
    'Carlito-Italic': 'carlito-italic',
    'Carlito-BoldItalic': 'carlito-bolditalic',
    'Carlito-Bold-Italic': 'carlito-bolditalic',
    'Carlito-Bold Italic': 'carlito-bolditalic',
  };
  const base = fontFileMap[family || 'Carlito-Regular'] || (family ? family.toLowerCase().replaceAll(' ', '-') : 'carlito-regular');
  return `${base}_${size || 14}`;
}
function collectUsedFontFiles(screens: Screen[]): string[] {
  const usedFonts = new Set<string>();
  for (const screen of screens) {
    for (const component of screen.components) {
      let family = component.fontFamily;
      if ((component.type === 'text' || component.type === 'text_input' || component.type === 'button') && !family) {
        family = 'Carlito-Regular';
      }
      let size = component.fontSize || 14;
      if (component.type === 'text' || component.type === 'text_input' || component.type === 'button') {
        usedFonts.add(`${family}_${size}`);
      }
    }
  }
  const fontFileMap: Record<string, string> = {
    'Carlito-Regular': 'carlito-regular',
    'Carlito-Bold': 'carlito-bold',
    'Carlito-Italic': 'carlito-italic',
    'Carlito-BoldItalic': 'carlito-bolditalic',
    'Carlito-Bold-Italic': 'carlito-bolditalic',
    'Carlito-Bold Italic': 'carlito-bolditalic',
  };
  const files: string[] = [];
  for (const fontKey of usedFonts) {
    const [family, size] = fontKey.split('_');
    const base = fontFileMap[family] || family.toLowerCase().replaceAll(' ', '-');
    files.push(`${base}_${size}.c`);
  }
  return files;
}
import JSZip from 'jszip';

import { getPersistedLanguageCodes, loadLanguageFromProject } from '../locales/persistLanguage';

// Dynamically get all language codes from localStorage
function getAllPersistedLanguageCodes(): string[] {
  return getPersistedLanguageCodes();
}

function getAllPersistedLanguages(): Record<string, any> {
  const langs: Record<string, any> = {};
  getAllPersistedLanguageCodes().forEach(lang => {
    langs[lang] = loadLanguageFromProject(lang);
  });
  return langs;
}
import type { CMSState, CanvasComponent, HardwareButtonConfig, ProjectType, Screen } from '../types';
import { BLE_CONFIG, FEATURE_FLAGS, EXPORT_CONFIG } from '../config/project';
import {
  FLEX_CANVAS_HEIGHT,
  FLEX_CANVAS_WIDTH,
  PIN_EVO_CANVAS_HEIGHT,
  PIN_EVO_CANVAS_WIDTH,
} from '../types';

type ExportFormat = 'json' | 'html';
export type DeployUIType = 'html' | 'json';

interface ExportPayload {
  meta: {
    app: 'PINEVO CMS';
    version: 1;
    exportedAt: string;
    screenCount: number;
    componentCount: number;
  };
  state: CMSState;
}

interface HtmlExportBundle {
  blob: Blob;
  fileName: string;
}

interface JsonExportBundle {
  blob: Blob;
  fileName: string;
}

export interface UIDeployConfig {
  selectedType: DeployUIType;
  ackEnabled: boolean;
  targetLfsDirectory: string;
  activeEntryPath: string;
  storage: {
    backend: 'lfs';
    basePath: string;
  };
  paths: {
    selectedRoot: string;
    selectedAssetsRoot: string;
  };
}

export interface UIDeployManifest {
  version: 1;
  generatedAt: string;
  projectName: string;
  files: Array<{
    path: string;
    size: number;
    type: 'text' | 'binary';
  }>;
}

export interface UIDeploymentBundle {
  blob: Blob;
  fileName: string;
  bytes: Uint8Array;
  chunks: Uint8Array[];
  chunkSize: number;
  config: UIDeployConfig;
  manifest: UIDeployManifest;
}

interface BLEDeploymentOptions {
  ackEnabled?: boolean;
  maxPacketBytes?: number;
}

export interface BLEZipStartPacket {
  cmd: 'zip_start';
  fileName: string;
  selectedType: DeployUIType;
  protocolAckEnabled: boolean;
  targetLfsDirectory: string;
  activeEntryPath: string;
  totalBytes: number;
  totalChunks: number;
  chunkSize: number;
}

export interface BLEZipChunkPacket {
  cmd: 'zip_chunk';
  index: number;
  totalChunks: number;
  payloadBase64: string;
}

export interface BLEZipCommitPacket {
  cmd: 'zip_commit';
  fileName: string;
}

export interface BLEZipDeploymentPackets {
  start: BLEZipStartPacket;
  chunks: BLEZipChunkPacket[];
  commit: BLEZipCommitPacket;
}

interface EmbeddedAsset {
  relativePath: string;
  bytes: Uint8Array;
}

interface EmbeddedAssetRegistry {
  references: Map<string, string>;
  assets: EmbeddedAsset[];
}

interface EmbeddedAssetCollectionOptions {
  rawDeploymentImages?: boolean;
  alphaBackgroundColor?: string;
}

interface ImageConversionTarget {
  width: number;
  height: number;
}

function parseHexColorToRgb(color: string | undefined) {
  const fallback = { r: 255, g: 255, b: 255 };
  if (!color) {
    return fallback;
  }

  const normalized = color.trim().toLowerCase();
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('');
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  const fullHex = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (fullHex) {
    const value = fullHex[1];
    return {
      r: Number.parseInt(value.slice(0, 2), 16),
      g: Number.parseInt(value.slice(2, 4), 16),
      b: Number.parseInt(value.slice(4, 6), 16),
    };
  }

  return fallback;
}

// Export payload includes all component IDs for firmware
function createExportPayload(state: CMSState): ExportPayload {
  const componentCount = state.screens.reduce((total, screen) => total + screen.components.length, 0);
  const screens = state.screens.map(normalizeScreenHardwareButtons);
  // IDs are included in each component object
  return {
    meta: {
      app: 'PINEVO CMS',
      version: 1,
      exportedAt: new Date().toISOString(),
      screenCount: screens.length,
      componentCount,
    },
    state: {
      ...state,
      screens,
    },
  };
}

function normalizeHardwareButtonConfig(config: HardwareButtonConfig | undefined): HardwareButtonConfig | undefined {
  if (!config) {
    return undefined;
  }

  if (config.goToScreen) {
    return {
      ...config,
      inputAction: undefined,
    };
  }

  if (config.inputAction) {
    return {
      ...config,
      goToScreen: undefined,
    };
  }

  return {
    ...config,
  };
}

function normalizeScreenHardwareButtons(screen: Screen): Screen {
  if (!screen.hardwareButtons) {
    return screen;
  }

  const hardwareButtons = Object.fromEntries(
    Object.entries(screen.hardwareButtons).map(([buttonId, config]) => [buttonId, normalizeHardwareButtonConfig(config)])
  );

  return {
    ...screen,
    hardwareButtons,
  };
}

function getCanvasSize(projectType: ProjectType | undefined) {
  if (projectType === 'flex') {
    return { width: FLEX_CANVAS_WIDTH, height: FLEX_CANVAS_HEIGHT };
  }

  return { width: PIN_EVO_CANVAS_WIDTH, height: PIN_EVO_CANVAS_HEIGHT };
}

function sanitizeFileSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '') || 'pinevo_export';
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeAssetUrl(value: string | undefined) {
  if (!value) {
    return '';
  }

  if (value.startsWith('data:') || value.startsWith('./') || value.startsWith('../') || value.startsWith('/')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (['http:', 'https:', 'file:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return '';
  }

  return '';
}

function mimeTypeToExtension(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('svg')) return 'svg';
  if (normalized.includes('mp3') || normalized.includes('mpeg')) return 'mp3';
  if (normalized.includes('wav')) return 'wav';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('aac')) return 'aac';
  if (normalized.includes('mp4')) return 'mp4';
  return 'bin';
}

function decodeBase64(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) || 0;
  }
  return bytes;
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!match) {
    return null;
  }

  const mimeType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';

  try {
    const bytes = isBase64
      ? decodeBase64(payload)
      : new TextEncoder().encode(decodeURIComponent(payload));
    return { mimeType, bytes };
  } catch {
    return null;
  }
}

async function bytesToBlob(bytes: Uint8Array, mimeType: string) {
  const clonedBytes = Uint8Array.from(bytes);
  return new Blob([clonedBytes], { type: mimeType });
}

async function decodeRasterImage(bytes: Uint8Array, mimeType: string): Promise<HTMLImageElement | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return null;
  }

  const blob = await bytesToBlob(bytes, mimeType);
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = 'async';
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to decode image asset'));
    });
    image.src = objectUrl;
    return await loaded;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function normalizeDeploymentImageAsset(
  parsed: { mimeType: string; bytes: Uint8Array },
  target?: ImageConversionTarget,
  alphaBackgroundColor?: string
) {
  if (!parsed.mimeType.toLowerCase().startsWith('image/')) {
    return {
      extension: mimeTypeToExtension(parsed.mimeType),
      bytes: parsed.bytes,
    };
  }

  // Skip vector and animated formats to avoid changing rendering semantics.
  const normalizedMime = parsed.mimeType.toLowerCase();
  if (
    normalizedMime.includes('svg')
    || normalizedMime.includes('gif')
  ) {
    return {
      extension: mimeTypeToExtension(parsed.mimeType),
      bytes: parsed.bytes,
    };
  }

  const image = await decodeRasterImage(parsed.bytes, parsed.mimeType);
  if (!image) {
    return {
      extension: mimeTypeToExtension(parsed.mimeType),
      bytes: parsed.bytes,
    };
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const width = Math.max(1, Math.floor(target?.width || sourceWidth));
  const height = Math.max(1, Math.floor(target?.height || sourceHeight));
  if (!width || !height || typeof document === 'undefined') {
    return {
      extension: mimeTypeToExtension(parsed.mimeType),
      bytes: parsed.bytes,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return {
      extension: mimeTypeToExtension(parsed.mimeType),
      bytes: parsed.bytes,
    };
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  // Extract RGBA8888 pixel data
  const rgba = context.getImageData(0, 0, width, height).data;
  const background = parseHexColorToRgb(alphaBackgroundColor);
  // Convert to RGB565LE (2 bytes per pixel), row-major order.
  const rgb565 = new Uint8Array(width * height * 2);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 2) {
    const alpha = rgba[i + 3] / 255;
    const invAlpha = 1 - alpha;
    const r = Math.round((rgba[i] * alpha) + (background.r * invAlpha));
    const g = Math.round((rgba[i + 1] * alpha) + (background.g * invAlpha));
    const b = Math.round((rgba[i + 2] * alpha) + (background.b * invAlpha));
    // Pack RGB into 16-bit RGB565, then write little-endian bytes.
    const value = ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | (b >> 3);
    rgb565[j] = value & 0xFF;
    rgb565[j + 1] = (value >> 8) & 0xFF;
  }

  const expectedByteSize = width * height * 2;
  if (rgb565.byteLength !== expectedByteSize) {
    throw new Error(
      `RGB565 conversion size mismatch: expected ${expectedByteSize}, got ${rgb565.byteLength} (width=${width}, height=${height})`
    );
  }

  return {
    extension: 'rgb565',
    bytes: rgb565,
  };
}



async function collectEmbeddedAssets(
  screens: Screen[],
  options: EmbeddedAssetCollectionOptions = {}
): Promise<EmbeddedAssetRegistry> {
  const references = new Map<string, string>();
  const assets: EmbeddedAsset[] = [];
  const usedNames = new Set<string>();
  const assetFingerprintToPath = new Map<string, string>();
  let counter = 1;

  // Determine image conversion mode: 'raw' or 'auto' (JPEG/PNG)

  const deploymentImageFormat = EXPORT_CONFIG.deploymentImageFormat as 'raw' | 'auto';
  const useRaw = (options.rawDeploymentImages === true) || deploymentImageFormat === 'raw';
  // Print selected image format in console
  console.log(`[Deploy] Selected deployment image format: ${deploymentImageFormat === 'raw' ? 'RAW (RGB565LE .rgb565)' : 'AUTO (keep PNG/JPEG)'}`);


  const addAsset = async (
    rawValue: string | undefined,
    kind: 'image' | 'audio',
    target?: ImageConversionTarget
  ) => {
    if (!rawValue?.startsWith('data:')) {
      return;
    }

    const referenceKey = kind === 'image'
      ? `${rawValue}|${Math.max(1, Math.floor(target?.width || 0))}x${Math.max(1, Math.floor(target?.height || 0))}`
      : rawValue;

    if (references.has(referenceKey)) {
      return;
    }

    const parsed = parseDataUrl(rawValue);
    if (!parsed) {
      return;
    }

    let normalizedAsset;
    if (kind === 'image') {
      if (useRaw) {
        normalizedAsset = await normalizeDeploymentImageAsset(parsed, target, options.alphaBackgroundColor);
        const originalKb = (parsed.bytes.byteLength / 1024).toFixed(2);
        const convertedKb = (normalizedAsset.bytes.byteLength / 1024).toFixed(2);
        const sizeSuffix = target ? ` ${Math.max(1, Math.floor(target.width))}x${Math.max(1, Math.floor(target.height))}` : '';
        console.log(
          `[Deploy] Image asset${sizeSuffix}: original=${parsed.mimeType} ${originalKb} KB → RGB565LE ${convertedKb} KB (alpha bg=${options.alphaBackgroundColor || '#ffffff'})`
        );
      } else {
        normalizedAsset = {
          extension: mimeTypeToExtension(parsed.mimeType),
          bytes: parsed.bytes,
        };
        const originalKb = (parsed.bytes.byteLength / 1024).toFixed(2);
        const convertedKb = (normalizedAsset.bytes.byteLength / 1024).toFixed(2);
        console.log(
          `[Deploy] Image asset: original=${parsed.mimeType} ${originalKb} KB → ${normalizedAsset.extension.toUpperCase()} ${convertedKb} KB`
        );
      }
    } else {
      normalizedAsset = {
        extension: mimeTypeToExtension(parsed.mimeType),
        bytes: parsed.bytes,
      };
    }

    const extension = normalizedAsset.extension;
    const fingerprint = `${kind}:${extension}:${normalizedAsset.bytes.byteLength}:${fnv1a32(normalizedAsset.bytes)}`;
    const existingPath = assetFingerprintToPath.get(fingerprint);
    if (existingPath) {
      references.set(referenceKey, existingPath);
      if (kind === 'image') {
        const width = Math.max(1, Math.floor(target?.width || 1));
        const height = Math.max(1, Math.floor(target?.height || 1));
        console.log(
          `[Deploy] Reused image asset: path=${existingPath}, width=${width}, height=${height}, bytes=${normalizedAsset.bytes.byteLength}`
        );
      }
      return;
    }

    let fileName = `${kind}_${counter}.${extension}`;
    while (usedNames.has(fileName.toLowerCase())) {
      counter += 1;
      fileName = `${kind}_${counter}.${extension}`;
    }

    usedNames.add(fileName.toLowerCase());
    const relativePath = `assets/${fileName}`;
    assetFingerprintToPath.set(fingerprint, relativePath);
    references.set(referenceKey, relativePath);
    assets.push({ relativePath, bytes: normalizedAsset.bytes });
    if (kind === 'image') {
      const width = Math.max(1, Math.floor(target?.width || 1));
      const height = Math.max(1, Math.floor(target?.height || 1));
      console.log(
        `[Deploy] Packed image asset: path=${relativePath}, width=${width}, height=${height}, bytes=${normalizedAsset.bytes.byteLength}`
      );
    }
    counter += 1;
  };

  for (const screen of screens) {
    await addAsset(screen.screenAudioUrl, 'audio');
    for (const component of screen.components) {
      await addAsset(component.imageUrl, 'image', {
        width: component.width,
        height: component.height,
      });
      await addAsset(component.audioUrl, 'audio');
      await addAsset(component.buttonSound, 'audio');
    }
  }

  return { references, assets };
}

function sanitizeOriginalNameForFile(value: string, fallback: string) {
  const normalized = value
    .trim()
    .replaceAll(/[<>:"/\\|?*]/g, '_')
    .replaceAll(/[\u0000-\u001f]/g, '')
    .replaceAll(/\s+/g, ' ');

  return normalized || fallback;
}

function buildScreenFileMap(screens: Screen[], extension: 'html' | 'json') {
  const usedNames = new Set<string>();
  const fileMap = new Map<string, string>();

  screens.forEach((screen, index) => {
    const fallback = `Screen ${index + 1}`;
    const baseName = sanitizeOriginalNameForFile(screen.name, fallback);
    let candidate = `${baseName}.${extension}`;
    let suffix = 2;

    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${baseName} (${suffix}).${extension}`;
      suffix += 1;
    }

    usedNames.add(candidate.toLowerCase());
    fileMap.set(screen.id, candidate);
  });

  return fileMap;
}

function escapeAttr(value: string | number | boolean | undefined) {
  return escapeHtml(String(value ?? ''));
}

function sanitizeIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '') || 'screen';
}

function buildScreenTargetMap(screens: Screen[]) {
  const usedTargets = new Set<string>();
  const targetByScreenId = new Map<string, string>();

  screens.forEach((screen, index) => {
    const explicitTarget = (screen as Screen & { target?: string }).target;
    const fallback = `screen_${index + 1}`;
    const baseTarget = sanitizeIdentifier(explicitTarget || screen.name || fallback);

    let candidate = baseTarget;
    let suffix = 2;
    while (usedTargets.has(candidate)) {
      candidate = `${baseTarget}_${suffix}`;
      suffix += 1;
    }

    usedTargets.add(candidate);
    targetByScreenId.set(screen.id, candidate);
  });

  return targetByScreenId;
}

function extractNumericKey(label: string | undefined) {
  if (!label) {
    return '';
  }

  const keyPattern = /\[(\d+)\]|\b(\d+)\b/;
  const match = keyPattern.exec(label);
  return match?.[1] || match?.[2] || '';
}

function buildTag(name: string, attributes: Array<[string, string | number | boolean | undefined]>) {
  const serializedAttributes = attributes
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(' ');

  return `  <${name} ${serializedAttributes}/>`;
}

function resolveAssetReference(value: string | undefined, embeddedAssetRefs: Map<string, string>) {
  const safeValue = sanitizeAssetUrl(value);
  if (!safeValue) {
    return '';
  }

  return embeddedAssetRefs.get(safeValue) || safeValue;
}

function resolveImageAssetReference(
  value: string | undefined,
  embeddedAssetRefs: Map<string, string>,
  width: number,
  height: number
) {
  const safeValue = sanitizeAssetUrl(value);
  if (!safeValue) {
    return '';
  }

  const imageKey = `${safeValue}|${Math.max(1, Math.floor(width || 0))}x${Math.max(1, Math.floor(height || 0))}`;
  return embeddedAssetRefs.get(imageKey) || embeddedAssetRefs.get(safeValue) || safeValue;
}

function normalizeExportInputAction(action: string | undefined) {
  if (!action) {
    return '';
  }

  // Firmware JSON flow expects startscanner (without underscore).
  if (action === 'start_scanner') {
    return 'startscanner';
  }

  return action;
}

function isHomeScreen(screen: Screen, targetByScreenId: Map<string, string>) {
  const target = targetByScreenId.get(screen.id) || sanitizeIdentifier(screen.name);
  return target === 'home';
}

function resolveScreenBackgroundColor(state: CMSState, screen: Screen): string {
  return screen.backgroundColor || state.project?.defaultCanvasBgColor || '#ffffff';
}

function resolveScreenAction(screen: Screen, embeddedAssetRefs: Map<string, string>) {
  const fn = screen.screenFunction || 'none';
  return {
    function: fn,
    api_call: fn === 'api_call' ? (screen.screenApiCall || '') : '',
    command: fn === 'run_command' ? (screen.screenCommand || '') : '',
    audio_src: fn === 'play_audio' ? resolveAssetReference(screen.screenAudioUrl, embeddedAssetRefs) : '',
  };
}


function createRuntimeUiTypeIndicatorComponent(format: DeployUIType, canvasSize: { width: number; height: number }, id?: string) {
  return {
    id: id || `ui_type_indicator_${format}`,
    type: 'label',
    x: Math.max(8, canvasSize.width - 110),
    y: 8,
    font: getFontKey('Carlito-Regular', 12),
    color: '#64748b',
    text: `UI: ${format.toUpperCase()}`,
    labelKey: undefined,
    labelMode: undefined,
  };
}

// Always include the component ID in firmware JSON export
function buildFirmwareJsonComponent(
  component: CanvasComponent,
  index: number,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  const fontKey = (component.type === 'text' || component.type === 'text_input' || component.type === 'button')
    ? getFontKey(component.fontFamily, component.fontSize)
    : undefined;

  // All types include displayId (fallback to id)
  const base = { id: component.displayId || component.id };

  if (component.type === 'text') {
    return {
      ...base,
      type: 'label',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      font: fontKey,
      color: component.color || '#1a1a2e',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      border_radius: Number(component.borderRadius ?? 0),
      text: component.text || '',
      text_align: component.textAlign || 'left',
      visible: component.visible !== false,
      labelKey: component.labelKey,
      labelMode: component.labelMode,
    };
  }

  if (component.type === 'button') {
    const target = component.goToScreen ? targetByScreenId.get(component.goToScreen) || '' : '';
    const derivedKey = extractNumericKey(component.text);
    const normalizedKey = derivedKey || String(index + 1);
    return {
      ...base,
      type: 'button',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      bg_color: component.bgColor || '#4f46e5',
      text_color: component.color || '#ffffff',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      font: fontKey,
      border_radius: Number(component.borderRadius ?? 0),
      text_align: component.textAlign || 'center',
      visible: component.visible !== false,
      tag: normalizedKey,
      key: normalizedKey,
      label: component.text || 'Button',
      labelKey: component.labelKey,
      labelMode: component.labelMode,
      target,
      flat: true,
      function: component.function || 'none',
      api_call: component.apiCall || '',
      command: component.command || '',
      audio_src: resolveAssetReference(component.buttonSound, embeddedAssetRefs),
    };
  }

  if (component.type === 'image') {
    return {
      ...base,
      type: 'image',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      border_radius: Number(component.borderRadius ?? 0),
      src: resolveImageAssetReference(component.imageUrl, embeddedAssetRefs, component.width, component.height),
      fit: 'cover',
    };
  }

  if (component.type === 'view') {
    return {
      ...base,
      type: 'view',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      bg_color: component.bgColor || '#e5e7eb',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      border_radius: Number(component.borderRadius ?? 0),
      visible: component.visible !== false,
    };
  }

  if (component.type === 'text_input') {
    return {
      ...base,
      type: 'input',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      bg_color: component.bgColor || '#ffffff',
      border_color: component.borderColor || '#e5e7eb',
      border_width: Number(component.borderWidth ?? 1),
      text_color: component.color || '#1a1a2e',
      font: fontKey,
      text: component.text || '',
      placeholder: component.placeholder || '',
      border_radius: component.borderRadius ?? 8,
      text_align: component.textAlign || 'center',
      visible: component.visible !== false,
      inputBorderStyle: component.inputBorderStyle || 'rounded',
      labelKey: component.labelKey,
      labelMode: component.labelMode,
      placeholderKey: component.placeholderKey,
      placeholderMode: component.placeholderMode,
      inputType: component.inputType || 'text',
      maxLength: Number(component.maxLength || 0),
      maxLengthAction: component.maxLengthAction || 'none',
      maxLengthGoToScreen: component.maxLengthGoToScreen ? (targetByScreenId.get(component.maxLengthGoToScreen) || '') : '',
      maxLengthApiCall: component.maxLengthApiCall || '',
      maxLengthCommand: component.maxLengthCommand || '',
      maxLengthAudio: resolveAssetReference(component.maxLengthAudio, embeddedAssetRefs),
    };
  }

  if (component.type === 'audio') {
    return {
      ...base,
      type: 'audio',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      border_radius: Number(component.borderRadius ?? 5),
      src: resolveAssetReference(component.audioUrl, embeddedAssetRefs),
      label: component.text || 'Audio',
      visible: component.visible !== false,
      autoplay: false,
      loop: false,
    };
  }

  if (component.type === 'api') {
    return {
      ...base,
      type: 'api',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      border_color: component.borderColor || '#bae6fd',
      border_width: Number(component.borderWidth ?? 1),
      border_radius: Number(component.borderRadius ?? 8),
      method: component.httpMethod || 'GET',
      url: component.apiUrl || '',
      headers: component.headers || '',
      body: component.requestBody || '',
      visible: component.visible !== false,
      trigger: 'tap',
    };
  }

  if (component.type === 'command') {
    return {
      ...base,
      type: 'command',
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      width_mode: component.widthMode || 'fixed',
      height_mode: component.heightMode || 'fixed',
      border_color: component.borderColor || '#000000',
      border_width: Number(component.borderWidth ?? 0),
      border_radius: Number(component.borderRadius ?? 8),
      value: component.command || '',
      visible: component.visible !== false,
      trigger: 'tap',
    };
  }

  return {
    ...base,
    type: component.type,
    x: component.x,
    y: component.y,
    width: component.width,
    height: component.height,
  };
}

function renderFirmwareComponent(
  component: CanvasComponent,
  index: number,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  // Default font logic: if fontFamily is empty, set to first font in dropdown
  // Helper to get the font key in the format carlito-regular_22
  const fontKey = (component.type === 'text' || component.type === 'text_input' || component.type === 'button')
    ? getFontKey(component.fontFamily, component.fontSize)
    : undefined;

  // Always include id attribute for all components, prefer displayId if present
  const idAttr: [string, string | number | boolean | undefined] = ['id', component.displayId || component.id];

  if (component.type === 'text') {
    const hasLabelKey = !!component.labelKey;
    return buildTag('label', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['font', fontKey],
      ['color', component.color || '#1a1a2e'],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 0)],
      ['text_align', component.textAlign || 'left'],
      ['visible', component.visible !== false],
      ['text', hasLabelKey ? '' : (component.text || '')],
      ['data-label-key', component.labelKey],
      // 'data-label-mode' removed
    ]);
  }

  if (component.type === 'button') {
    const target = component.goToScreen ? targetByScreenId.get(component.goToScreen) || '' : '';
    const derivedKey = extractNumericKey(component.text);
    const normalizedKey = derivedKey || String(index + 1);
    return buildTag('button', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['bg_color', component.bgColor || '#4f46e5'],
      ['text_color', component.color || '#ffffff'],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 0)],
      ['font', fontKey],
      ['text_align', component.textAlign || 'center'],
      ['visible', component.visible !== false],
      ['tag', normalizedKey],
      ['key', normalizedKey],
      ['label', component.text || 'Button'],
      ['data-label-key', component.labelKey],
      ['target', target],
      ['flat', true],
      ['function', component.function || 'none'],
      ['api_call', component.apiCall || ''],
      ['command', component.command || ''],
      ['audio_src', resolveAssetReference(component.buttonSound, embeddedAssetRefs)],
    ]);
  }

  if (component.type === 'image') {
    return buildTag('image', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['visible', component.visible !== false],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 0)],
      ['src', resolveImageAssetReference(component.imageUrl, embeddedAssetRefs, component.width, component.height)],
      ['fit', 'cover'],
    ]);
  }

  if (component.type === 'view') {
    return buildTag('view', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['bg_color', component.bgColor || '#e5e7eb'],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 0)],
      ['visible', component.visible !== false],
    ]);
  }

  if (component.type === 'text_input') {
    const hasLabelKey = !!component.labelKey;
    return buildTag('input', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['bg_color', component.bgColor || '#ffffff'],
      ['border_color', component.borderColor || '#e5e7eb'],
      ['border_width', Number(component.borderWidth ?? 1)],
      ['text_color', component.color || '#1a1a2e'],
      ['font', fontKey],
      ['text_align', component.textAlign || 'center'],
      ['visible', component.visible !== false],
      ['text', hasLabelKey ? '' : (component.text || '')],
      ['placeholder', component.placeholder || ''],
      ['border_radius', component.borderRadius ?? 8],
      ['data-input-border-style', component.inputBorderStyle || 'rounded'],
      ['data-label-key', component.labelKey],
      // 'data-label-mode' removed
      ['data-placeholder-key', component.placeholderKey],
      ['data-placeholder-mode', component.placeholderMode],
      ['data-input-type', component.inputType || 'text'],
      ['data-max-length', Number(component.maxLength || 0)],
      ['data-max-length-action', component.maxLengthAction || 'none'],
      ['data-max-length-target', component.maxLengthGoToScreen ? (targetByScreenId.get(component.maxLengthGoToScreen) || '') : ''],
      ['data-max-length-api-call', component.maxLengthApiCall || ''],
      ['data-max-length-command', component.maxLengthCommand || ''],
      ['data-max-length-audio-src', resolveAssetReference(component.maxLengthAudio, embeddedAssetRefs)],
    ]);
  }

  if (component.type === 'audio') {
    return buildTag('audio', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['visible', component.visible !== false],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 5)],
      ['src', resolveAssetReference(component.audioUrl, embeddedAssetRefs)],
      ['label', component.text || 'Audio'],
      ['autoplay', false],
      ['loop', false],
    ]);
  }

  if (component.type === 'api') {
    return buildTag('api', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['visible', component.visible !== false],
      ['border_color', component.borderColor || '#bae6fd'],
      ['border_width', Number(component.borderWidth ?? 1)],
      ['border_radius', Number(component.borderRadius ?? 8)],
      ['method', component.httpMethod || 'GET'],
      ['url', component.apiUrl || ''],
      ['headers', component.headers || ''],
      ['body', component.requestBody || ''],
      ['trigger', 'tap'],
    ]);
  }

  if (component.type === 'command') {
    return buildTag('command', [
      idAttr,
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['width_mode', component.widthMode || 'fixed'],
      ['height_mode', component.heightMode || 'fixed'],
      ['visible', component.visible !== false],
      ['border_color', component.borderColor || '#000000'],
      ['border_width', Number(component.borderWidth ?? 0)],
      ['border_radius', Number(component.borderRadius ?? 8)],
      ['value', component.command || ''],
      ['trigger', 'tap'],
    ]);
  }

  return '';
}

function generateScreenHtml(
  state: CMSState,
  screen: Screen,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  const canvasSize = getCanvasSize(state.project?.type);
  const normalizedScreen = normalizeScreenHardwareButtons(screen);
  const screenName = sanitizeIdentifier(normalizedScreen.name);
  const bgColor = resolveScreenBackgroundColor(state, normalizedScreen);
  const screenAction = resolveScreenAction(normalizedScreen, embeddedAssetRefs);
  const components = normalizedScreen.components
    .map((component, index) => renderFirmwareComponent(component, index, targetByScreenId, embeddedAssetRefs))
    .filter(Boolean);
  // Removed automatic UI: HTML label injection for home screen
  const hardwareMappings = (() => {
    const configured = Object.entries(normalizedScreen.hardwareButtons || {}).filter(([, config]) => config);
    if (configured.length === 0) {
      return '';
    }
    return configured
      .map(([buttonId, rawConfig]) => {
        const config = normalizeHardwareButtonConfig(rawConfig);
        const target = config?.goToScreen ? targetByScreenId.get(config.goToScreen) || '' : '';
        return buildTag('hardware_button', [
          ['key', buttonId],
          ['target', target],
          ['input_action', normalizeExportInputAction(config?.inputAction)],
          ['command', config?.command || ''],
        ]);
      })
      .join('\n');
  })();
  const sections = [components.join('\n'), hardwareMappings].filter(Boolean).join('\n');

  // Remove font_name/font_src from screen tag in HTML export
  return `<screen name="${escapeAttr(screenName)}" bg_color="${escapeAttr(bgColor)}" width="${escapeAttr(canvasSize.width)}" height="${escapeAttr(canvasSize.height)}" bg_image_src="" id="${escapeAttr(normalizedScreen.id)}" function="${escapeAttr(screenAction.function)}" api_call="${escapeAttr(screenAction.api_call)}" command="${escapeAttr(screenAction.command)}" audio_src="${escapeAttr(screenAction.audio_src)}">\n${sections}\n</screen>\n`;
}

function generateIndexHtml(state: CMSState, screenFileNames: Map<string, string>) {
  const links = state.screens.map((screen, index) => {
    const fileName = screenFileNames.get(screen.id) || `Screen ${index + 1}.html`;
    return `<li><a href="./${escapeHtml(fileName)}">${escapeHtml(screen.name)}</a></li>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(state.project?.name || 'PINEVO CMS Export')} - UI</title>
  <style>
    body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #f3f4f6; color: #111827; }
    .panel { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 18px; padding: 24px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); }
    h1 { margin-top: 0; }
    ol { padding-left: 20px; }
    li + li { margin-top: 10px; }
    a { color: #1d4ed8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>${escapeHtml(state.project?.name || 'PINEVO CMS Export')}</h1>
    <p>Open any exported screen below. All project screens are packaged in this ui folder.</p>
    <ol>${links}</ol>
  </div>
</body>
</html>`;
}

export function getExportFileName(state: CMSState, format: ExportFormat) {
  const baseName = sanitizeFileSegment(state.project?.name || 'pinevo_screens');
  return format === 'html' ? `${baseName}_ui.zip` : `${baseName}_screens_json.zip`;
}

export function generateJsonExport(state: CMSState) {
  return JSON.stringify(createExportPayload(state), null, 2);
}

function splitBinaryIntoChunks(data: Uint8Array, chunkSize: number) {
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < data.length; index += chunkSize) {
    chunks.push(data.slice(index, index + chunkSize));
  }
  return chunks;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

function fnv1a32(bytes: Uint8Array) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function base64LengthForBinarySize(binarySize: number) {
  return 4 * Math.ceil(binarySize / 3);
}

function estimateZipChunkPacketBytes(chunkBinarySize: number, totalChunks: number) {
  const payloadBase64 = 'A'.repeat(base64LengthForBinarySize(chunkBinarySize));
  const probePacket: BLEZipChunkPacket = {
    cmd: 'zip_chunk',
    index: Math.max(0, totalChunks - 1),
    totalChunks,
    payloadBase64,
  };

  return new TextEncoder().encode(JSON.stringify(probePacket)).length;
}

function resolveSafeChunkSize(
  totalBytes: number,
  requestedChunkSize: number,
  maxPacketBytes?: number
) {
  const initial = Math.max(1, requestedChunkSize);

  if (!Number.isFinite(maxPacketBytes) || !maxPacketBytes || maxPacketBytes <= 0) {
    return initial;
  }

  let low = 1;
  let high = initial;
  let best = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const totalChunks = Math.max(1, Math.ceil(totalBytes / mid));
    const packetBytes = estimateZipChunkPacketBytes(mid, totalChunks);

    if (packetBytes <= maxPacketBytes) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

function resolveHomeLandingEntryPath(
  state: CMSState,
  selectedType: DeployUIType,
  screenFileNames: Map<string, string>
) {
  const homeScreen = state.screens.find((screen) => screen.name.trim().toLowerCase() === 'home');
  const selectedRoot = selectedType === 'html' ? 'ui/html' : 'ui/json';
  const firstScreenFile = state.screens[0] ? screenFileNames.get(state.screens[0].id) : undefined;
  const defaultEntryPath = selectedType === 'html'
    ? `${selectedRoot}/index.html`
    : `${selectedRoot}/${firstScreenFile || 'screen_1.json'}`;

  if (!homeScreen) {
    return defaultEntryPath;
  }

  const homeFileName = screenFileNames.get(homeScreen.id);
  if (!homeFileName) {
    return defaultEntryPath;
  }

  return `${selectedRoot}/${homeFileName}`;
}

function createDeployConfig(selectedType: DeployUIType, activeEntryPath: string, ackEnabled: boolean): UIDeployConfig {
  const selectedRoot = selectedType === 'html' ? 'ui/html' : 'ui/json';

  return {
    selectedType,
    ackEnabled,
    targetLfsDirectory: `/lfs/ui/${selectedType}`,
    activeEntryPath,
    storage: {
      backend: 'lfs',
      basePath: '/lfs/ui',
    },
    paths: {
      selectedRoot,
      selectedAssetsRoot: `${selectedRoot}/assets`,
    },
  };
}

function createDeployFileName(state: CMSState) {
  const baseName = sanitizeFileSegment(state.project?.name || 'pinevo_screens');
  return `${baseName}_deploy_bundle.zip`;
}

function generateScreenJsonExport(
  state: CMSState,
  canvasSize: { width: number; height: number },
  screen: Screen,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  const normalizedScreen = normalizeScreenHardwareButtons(screen);
  const screenAction = resolveScreenAction(normalizedScreen, embeddedAssetRefs);
  const components = normalizedScreen.components.map((component, index) =>
    buildFirmwareJsonComponent(component, index, targetByScreenId, embeddedAssetRefs)
  );
  if (isHomeScreen(normalizedScreen, targetByScreenId)) {
    components.push(createRuntimeUiTypeIndicatorComponent('json', canvasSize, `ui_type_indicator_${screen.id}`));
  }

  const hardwareButtons =
    Object.entries(normalizedScreen.hardwareButtons || {})
      .map(([buttonId, config]) => {
        const normalized = normalizeHardwareButtonConfig(config);
        return {
          key: buttonId,
          target: normalized?.goToScreen ? targetByScreenId.get(normalized.goToScreen) || '' : '',
          input_action: normalizeExportInputAction(normalized?.inputAction),
          command: normalized?.command || '',
        };
      });

  const screenTarget = targetByScreenId.get(normalizedScreen.id) || sanitizeIdentifier(normalizedScreen.name);
  const bgColor = resolveScreenBackgroundColor(state, normalizedScreen);

  // Remove font_name/font_src from screen tag in JSON export
  return JSON.stringify(
    {
      screen: {
        name: screenTarget,
        bg_color: bgColor,
        function: screenAction.function,
        api_call: screenAction.api_call,
        command: screenAction.command,
        audio_src: screenAction.audio_src,
        width: canvasSize.width,
        height: canvasSize.height,
        bg_image_src: '',
        id: normalizedScreen.id,
        components,
        hardware_buttons: hardwareButtons,
      },
    },
    null,
    2
  );
}

export async function generateJsonScreensExport(state: CMSState): Promise<JsonExportBundle> {
  const zip = new JSZip();
  const jsonFolder = zip.folder('ui/json');
  const canvasSize = getCanvasSize(state.project?.type);
  const targetByScreenId = buildScreenTargetMap(state.screens);
  const assetRegistry = await collectEmbeddedAssets(state.screens);

  if (!jsonFolder) {
    throw new Error('Failed to create json export folder.');
  }


  // Add all language files from persisted storage
  const allLangs = getAllPersistedLanguages();
  Object.entries(allLangs).forEach(([lang, data]) => {
    jsonFolder.file(`languages/${lang}.json`, JSON.stringify(data, null, 2));
  });

  // Add config with supported languages
  const config = {
    ...EXPORT_CONFIG,
    supportedLanguages: Object.keys(allLangs),
  };
  jsonFolder.file('config.json', JSON.stringify(config, null, 2));

  state.screens.forEach((screen) => {
    const target = targetByScreenId.get(screen.id);
    const fileName = target ? `${target}.json` : undefined;
    if (!fileName) {
      return;
    }

    jsonFolder.file(fileName, generateScreenJsonExport(state, canvasSize, screen, targetByScreenId, assetRegistry.references));
  });

  if (EXPORT_CONFIG.includeAssetsInExport) {
    assetRegistry.assets.forEach((asset) => {
      jsonFolder.file(asset.relativePath, asset.bytes);
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    fileName: getExportFileName(state, 'json'),
  };
}

export async function generateHtmlExport(state: CMSState): Promise<HtmlExportBundle> {
  const zip = new JSZip();
  const uiFolder = zip.folder('ui/html');
  const screenFileNames = buildScreenFileMap(state.screens, 'html');
  const targetByScreenId = buildScreenTargetMap(state.screens);
  const assetRegistry = await collectEmbeddedAssets(state.screens);
  // Only include fonts if enabled in config
  if (EXPORT_CONFIG.includeFontsInExport) {
    try {
      const fontFiles = collectUsedFontFiles(state.screens);
      console.log('[Export] Including font files:', fontFiles);
      for (const file of fontFiles) {
        const response = await fetch(`/fonts/${file}`);
        if (response.ok) {
          const data = await response.arrayBuffer();
          zip.folder('ui/html/fonts')?.file(file, data);
        }
      }
    } catch {
      // Ignore if fetch fails (explicitly ignored for linter)
    }
  }

  if (!uiFolder) {
    throw new Error('Failed to create ui export folder.');
  }

  // Add all language files from persisted storage
  const langFolder = uiFolder.folder('lang');
  if (!langFolder) {
    throw new Error('Failed to create lang export folder.');
  }
  const allLangs = getAllPersistedLanguages();
  Object.entries(allLangs).forEach(([lang, data]) => {
    langFolder.file(`${lang}.json`, JSON.stringify(data, null, 2));
  });

  // Add config with supported languages
  const config = {
    ...EXPORT_CONFIG,
    supportedLanguages: Object.keys(allLangs),
  };
  uiFolder.file('config.json', JSON.stringify(config, null, 2));

  uiFolder.file('index.html', generateIndexHtml(state, screenFileNames));
  uiFolder.file('project.json', generateJsonExport(state));

  state.screens.forEach((screen) => {
    const fileName = screenFileNames.get(screen.id);
    if (!fileName) {
      return;
    }

    uiFolder.file(fileName, generateScreenHtml(state, screen, targetByScreenId, assetRegistry.references));
  });

  if (EXPORT_CONFIG.includeAssetsInExport) {
    assetRegistry.assets.forEach((asset) => {
      uiFolder.file(asset.relativePath, asset.bytes);
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    fileName: getExportFileName(state, 'html'),
  };
}

export async function generateBLEDeploymentBundle(
  state: CMSState,
  selectedType: DeployUIType = 'html',
  chunkSize = 244,
  options: BLEDeploymentOptions = {}
): Promise<UIDeploymentBundle> {
  if (selectedType === 'html' && !FEATURE_FLAGS.enableHtmlUiFormat) {
    throw new Error('HTML deployment is disabled in configuration.');
  }

  if (selectedType === 'json' && !FEATURE_FLAGS.enableJsonUiFormat) {
    throw new Error('JSON deployment is disabled in configuration.');
  }

  const zip = new JSZip();
  const configFolder = zip.folder('config');

  // Only include fonts if enabled in config
  if (EXPORT_CONFIG.includeFontsInExport) {
    try {
      const fontFiles = collectUsedFontFiles(state.screens);
      console.log('[BLE Deploy] Including font files:', fontFiles);
      for (const file of fontFiles) {
        const response = await fetch(`/fonts/${file}`);
        if (response.ok) {
          const data = await response.arrayBuffer();
          zip.folder('ui/html/fonts')?.file(file, data);
        }
      }
    } catch {
      // Ignore if fetch fails (explicitly ignored for linter)
    }
  }
  const canvasSize = getCanvasSize(state.project?.type);
  const targetByScreenId = buildScreenTargetMap(state.screens);
  // Only use rawDeploymentImages if EXPORT_CONFIG.deploymentImageFormat is 'raw'
  const assetRegistry = await collectEmbeddedAssets(state.screens, {
    rawDeploymentImages: (EXPORT_CONFIG.deploymentImageFormat as string) === 'raw',
    alphaBackgroundColor: state.project?.defaultCanvasBgColor || '#ffffff',
  });
  const fileEntries: UIDeployManifest['files'] = [];

  const selectedFolderPath = selectedType === 'html' ? 'ui/html' : 'ui/json';
  const selectedFolder = zip.folder(selectedFolderPath);
  const screenFileNames = selectedType === 'html'
    ? buildScreenFileMap(state.screens, 'html')
    : new Map(state.screens.map((screen) => {
      const target = targetByScreenId.get(screen.id) || sanitizeIdentifier(screen.name);
      return [screen.id, `${target}.json`];
    }));
  const activeEntryPath = resolveHomeLandingEntryPath(state, selectedType, screenFileNames);
  const ackEnabled = options.ackEnabled ?? BLE_CONFIG.waitForAckOnChunks;
  const config = createDeployConfig(selectedType, activeEntryPath, ackEnabled);

  if (!selectedFolder || !configFolder) {
    throw new Error('Failed to create deployment zip folders.');
  }
  // Add all language files to ui/lang/ from persisted storage
  const langFolder2 = zip.folder('ui/lang');
  if (langFolder2) {
    const allLangs = getAllPersistedLanguages();
    Object.entries(allLangs).forEach(([lang, data]) => {
      langFolder2.file(`${lang}.json`, JSON.stringify(data, null, 2));
    });
  }

  const addTextFile = (path: string, content: string) => {
    zip.file(path, content);
    fileEntries.push({
      path,
      size: new TextEncoder().encode(content).length,
      type: 'text',
    });
  };

  const addBinaryFile = (path: string, content: Uint8Array) => {
    zip.file(path, content);
    fileEntries.push({
      path,
      size: content.byteLength,
      type: 'binary',
    });
  };

  if (selectedType === 'html') {
    addTextFile('ui/html/index.html', generateIndexHtml(state, screenFileNames));
  }

  state.screens.forEach((screen) => {
    const fileName = screenFileNames.get(screen.id);
    if (!fileName) {
      return;
    }

    if (selectedType === 'html') {
      addTextFile(
        `ui/html/${fileName}`,
        generateScreenHtml(state, screen, targetByScreenId, assetRegistry.references)
      );
    } else {
      addTextFile(
        `ui/json/${fileName}`,
        generateScreenJsonExport(canvasSize, screen, targetByScreenId, assetRegistry.references)
      );
    }
  });

  if (EXPORT_CONFIG.includeAssetsInExport) {
    assetRegistry.assets.forEach((asset) => {
      addBinaryFile(`${selectedFolderPath}/${asset.relativePath}`, asset.bytes);
    });
  }

  addTextFile('config/ui_config.json', JSON.stringify(config, null, 2));

  const manifest: UIDeployManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectName: state.project?.name || 'PINEVO CMS Export',
    files: fileEntries,
  };
  addTextFile('config/manifest.json', JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const safeChunkSize = resolveSafeChunkSize(bytes.byteLength, chunkSize, options.maxPacketBytes);

  return {
    blob,
    fileName: createDeployFileName(state),
    bytes,
    chunks: splitBinaryIntoChunks(bytes, safeChunkSize),
    chunkSize: safeChunkSize,
    config,
    manifest,
  };
}

export function createBLEZipDeploymentPackets(bundle: UIDeploymentBundle): BLEZipDeploymentPackets {
  return {
    start: {
      cmd: 'zip_start',
      fileName: bundle.fileName,
      selectedType: bundle.config.selectedType,
      protocolAckEnabled: bundle.config.ackEnabled,
      targetLfsDirectory: bundle.config.targetLfsDirectory,
      activeEntryPath: bundle.config.activeEntryPath,
      totalBytes: bundle.bytes.byteLength,
      totalChunks: bundle.chunks.length,
      chunkSize: bundle.chunkSize,
    },
    chunks: bundle.chunks.map((chunk, index) => ({
      cmd: 'zip_chunk',
      index,
      totalChunks: bundle.chunks.length,
      payloadBase64: bytesToBase64(chunk),
    })),
    commit: {
      cmd: 'zip_commit',
      fileName: bundle.fileName,
    },
  };
}

