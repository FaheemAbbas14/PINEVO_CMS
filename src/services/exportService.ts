import JSZip from 'jszip';
import type { CMSState, CanvasComponent, ProjectType, Screen } from '../types';
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

export interface BLEZipStartPacket {
  cmd: 'zip_start';
  fileName: string;
  selectedType: DeployUIType;
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

function createExportPayload(state: CMSState): ExportPayload {
  const componentCount = state.screens.reduce((total, screen) => total + screen.components.length, 0);

  return {
    meta: {
      app: 'PINEVO CMS',
      version: 1,
      exportedAt: new Date().toISOString(),
      screenCount: state.screens.length,
      componentCount,
    },
    state,
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
    bytes[index] = binary.charCodeAt(index);
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

function collectEmbeddedAssets(screens: Screen[]): EmbeddedAssetRegistry {
  const references = new Map<string, string>();
  const assets: EmbeddedAsset[] = [];
  const usedNames = new Set<string>();
  let counter = 1;

  const addAsset = (rawValue: string | undefined, kind: 'image' | 'audio') => {
    if (!rawValue || !rawValue.startsWith('data:')) {
      return;
    }

    if (references.has(rawValue)) {
      return;
    }

    const parsed = parseDataUrl(rawValue);
    if (!parsed) {
      return;
    }

    const extension = mimeTypeToExtension(parsed.mimeType);
    let fileName = `${kind}_${counter}.${extension}`;
    while (usedNames.has(fileName.toLowerCase())) {
      counter += 1;
      fileName = `${kind}_${counter}.${extension}`;
    }

    usedNames.add(fileName.toLowerCase());
    const relativePath = `assets/${fileName}`;
    references.set(rawValue, relativePath);
    assets.push({ relativePath, bytes: parsed.bytes });
    counter += 1;
  };

  screens.forEach((screen) => {
    screen.components.forEach((component) => {
      addAsset(component.imageUrl, 'image');
      addAsset(component.audioUrl, 'audio');
      addAsset(component.buttonSound, 'audio');
    });
  });

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

function renderFirmwareComponent(
  component: CanvasComponent,
  index: number,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  if (component.type === 'text') {
    return buildTag('label', [
      ['x', component.x],
      ['y', component.y],
      ['font', component.fontSize || 14],
      ['color', component.color || '#1a1a2e'],
      ['font_src', ''],
      ['text', component.text || ''],
    ]);
  }

  if (component.type === 'button') {
    const target = component.goToScreen ? targetByScreenId.get(component.goToScreen) || '' : '';
    const derivedKey = extractNumericKey(component.text);
    const normalizedKey = derivedKey || String(index + 1);
    return buildTag('button', [
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['bg_color', component.bgColor || '#4f46e5'],
      ['text_color', component.color || '#ffffff'],
      ['font', component.fontSize || 14],
      ['font_src', ''],
      ['tag', normalizedKey],
      ['key', normalizedKey],
      ['label', component.text || 'Button'],
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
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['src', resolveAssetReference(component.imageUrl, embeddedAssetRefs)],
      ['fit', 'cover'],
    ]);
  }

  if (component.type === 'text_input') {
    return buildTag('input', [
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['bg_color', component.bgColor || '#ffffff'],
      ['text_color', component.color || '#1a1a2e'],
      ['font', component.fontSize || 14],
      ['font_src', ''],
      ['text', component.text || ''],
      ['placeholder', component.placeholder || ''],
      ['border_radius', component.borderRadius || 8],
    ]);
  }

  if (component.type === 'audio') {
    return buildTag('audio', [
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['src', resolveAssetReference(component.audioUrl, embeddedAssetRefs)],
      ['label', component.text || 'Audio'],
      ['autoplay', false],
      ['loop', false],
    ]);
  }

  if (component.type === 'api') {
    return buildTag('api', [
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['method', component.httpMethod || 'GET'],
      ['url', component.apiUrl || ''],
      ['headers', component.headers || ''],
      ['body', component.requestBody || ''],
      ['trigger', 'tap'],
    ]);
  }

  if (component.type === 'command') {
    return buildTag('command', [
      ['x', component.x],
      ['y', component.y],
      ['width', component.width],
      ['height', component.height],
      ['value', component.command || ''],
      ['trigger', 'tap'],
    ]);
  }

  return '';
}

function renderHardwareMappings(screen: Screen, targetByScreenId: Map<string, string>) {
  const configured = Object.entries(screen.hardwareButtons || {}).filter(([, config]) => config);
  if (configured.length === 0) {
    return '';
  }

  return configured
    .map(([buttonId, config]) => {
      const target = config?.goToScreen ? targetByScreenId.get(config.goToScreen) || '' : '';
      return buildTag('hardware_button', [
        ['key', buttonId],
        ['target', target],
        ['input_action', config?.inputAction || ''],
        ['command', config?.command || ''],
      ]);
    })
    .join('\n');
}

function generateScreenHtml(
  state: CMSState,
  screen: Screen,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  const canvasSize = getCanvasSize(state.project?.type);
  const screenName = sanitizeIdentifier(screen.name);
  const components = screen.components
    .map((component, index) => renderFirmwareComponent(component, index, targetByScreenId, embeddedAssetRefs))
    .filter(Boolean)
    .join('\n');
  const hardwareMappings = renderHardwareMappings(screen, targetByScreenId);
  const sections = [components, hardwareMappings].filter(Boolean).join('\n');

  return `<screen name="${escapeAttr(screenName)}" bg_color="#ffffff" width="${escapeAttr(canvasSize.width)}" height="${escapeAttr(canvasSize.height)}" font_src="" bg_image_src="" id="${escapeAttr(screen.id)}">\n${sections}\n</screen>\n`;
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
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function createDeployConfig(selectedType: DeployUIType): UIDeployConfig {
  const selectedRoot = selectedType === 'html' ? 'ui/html' : 'ui/json';
  const activeEntryPath = selectedType === 'html' ? 'ui/html/index.html' : 'ui/json/project.json';

  return {
    selectedType,
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
  screen: Screen,
  targetByScreenId: Map<string, string>,
  embeddedAssetRefs: Map<string, string>
) {
  const canvasSize = getCanvasSize(state.project?.type);
  const components = screen.components.map((component) => ({
    ...component,
    imageUrl: resolveAssetReference(component.imageUrl, embeddedAssetRefs),
    audioUrl: resolveAssetReference(component.audioUrl, embeddedAssetRefs),
    buttonSound: resolveAssetReference(component.buttonSound, embeddedAssetRefs),
  }));

  return JSON.stringify(
    {
      project: state.project,
      screen: {
        ...screen,
        components,
        target: targetByScreenId.get(screen.id) || sanitizeIdentifier(screen.name),
      },
      canvas: canvasSize,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export async function generateJsonScreensExport(state: CMSState): Promise<JsonExportBundle> {
  const zip = new JSZip();
  const jsonFolder = zip.folder('json');
  const screenFileNames = buildScreenFileMap(state.screens, 'json');
  const targetByScreenId = new Map(state.screens.map((screen) => [screen.id, sanitizeIdentifier(screen.name)]));
  const assetRegistry = collectEmbeddedAssets(state.screens);

  if (!jsonFolder) {
    throw new Error('Failed to create json export folder.');
  }

  jsonFolder.file('project.json', generateJsonExport(state));

  state.screens.forEach((screen) => {
    const fileName = screenFileNames.get(screen.id);
    if (!fileName) {
      return;
    }

    jsonFolder.file(fileName, generateScreenJsonExport(state, screen, targetByScreenId, assetRegistry.references));
  });

  assetRegistry.assets.forEach((asset) => {
    jsonFolder.file(asset.relativePath, asset.bytes);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    fileName: getExportFileName(state, 'json'),
  };
}

export async function generateHtmlExport(state: CMSState): Promise<HtmlExportBundle> {
  const zip = new JSZip();
  const uiFolder = zip.folder('ui');
  const screenFileNames = buildScreenFileMap(state.screens, 'html');
  const targetByScreenId = new Map(state.screens.map((screen) => [screen.id, sanitizeIdentifier(screen.name)]));
  const assetRegistry = collectEmbeddedAssets(state.screens);

  if (!uiFolder) {
    throw new Error('Failed to create ui export folder.');
  }

  uiFolder.file('index.html', generateIndexHtml(state, screenFileNames));
  uiFolder.file('project.json', generateJsonExport(state));

  state.screens.forEach((screen) => {
    const fileName = screenFileNames.get(screen.id);
    if (!fileName) {
      return;
    }

    uiFolder.file(fileName, generateScreenHtml(state, screen, targetByScreenId, assetRegistry.references));
  });

  assetRegistry.assets.forEach((asset) => {
    uiFolder.file(asset.relativePath, asset.bytes);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    fileName: getExportFileName(state, 'html'),
  };
}

export async function generateBLEDeploymentBundle(
  state: CMSState,
  selectedType: DeployUIType = 'html',
  chunkSize = 244
): Promise<UIDeploymentBundle> {
  const zip = new JSZip();
  const configFolder = zip.folder('config');
  const targetByScreenId = new Map(state.screens.map((screen) => [screen.id, sanitizeIdentifier(screen.name)]));
  const assetRegistry = collectEmbeddedAssets(state.screens);
  const fileEntries: UIDeployManifest['files'] = [];

  const selectedFolderPath = selectedType === 'html' ? 'ui/html' : 'ui/json';
  const selectedFolder = zip.folder(selectedFolderPath);
  const screenFileNames = buildScreenFileMap(state.screens, selectedType);
  const config = createDeployConfig(selectedType);

  if (!selectedFolder || !configFolder) {
    throw new Error('Failed to create deployment zip folders.');
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
    addTextFile('ui/html/project.json', generateJsonExport(state));
  } else {
    addTextFile('ui/json/project.json', generateJsonExport(state));
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
        generateScreenJsonExport(state, screen, targetByScreenId, assetRegistry.references)
      );
    }
  });

  assetRegistry.assets.forEach((asset) => {
    addBinaryFile(`${selectedFolderPath}/${asset.relativePath}`, asset.bytes);
  });

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
  const safeChunkSize = Math.max(1, chunkSize);

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
