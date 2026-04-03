import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import type { CMSState } from '../types';
import {
  createBLEZipDeploymentPackets,
  generateBLEDeploymentBundle,
  generateHtmlExport,
  generateJsonExport,
  generateJsonScreensExport,
  getExportFileName,
} from '../services/exportService';

const sampleState: CMSState = {
  project: {
    id: 'project-1',
    name: 'Warehouse Flow',
    type: 'flex',
  },
  screens: [
    {
      id: 'screen-1',
      name: 'Home',
      hardwareButtons: {
        enter: { goToScreen: 'screen-2' },
        backspace: { inputAction: 'text' },
      },
      components: [
        {
          id: 'label-1',
          type: 'text',
          x: 250,
          y: 48,
          width: 120,
          height: 40,
          text: 'Courier',
          color: '#5a2299',
          fontSize: 31,
        },
        {
          id: 'image-1',
          type: 'image',
          x: 12,
          y: 10,
          width: 80,
          height: 36,
          imageUrl: 'https://example.com/logo.png',
        },
        {
          id: 'button-1',
          type: 'button',
          x: 10,
          y: 20,
          width: 120,
          height: 40,
          text: 'Continue',
          color: '#ffffff',
          bgColor: '#0f766e',
          fontSize: 16,
          borderRadius: 8,
          goToScreen: 'screen-2',
          function: 'goto_screen',
        },
        {
          id: 'input-1',
          type: 'text_input',
          x: 30,
          y: 100,
          width: 200,
          height: 42,
          text: '',
          placeholder: 'PIN',
          color: '#111827',
          bgColor: '#ffffff',
          fontSize: 14,
          borderRadius: 8,
        },
      ],
    },
    {
      id: 'screen-2',
      name: 'Result',
      components: [
        {
          id: 'text-1',
          type: 'text',
          x: 24,
          y: 32,
          width: 160,
          height: 32,
          text: 'Done',
          color: '#111827',
          fontSize: 18,
        },
      ],
    },
  ],
  activeScreenId: 'screen-1',
  selectedComponentId: null,
  sandboxMode: false,
  previewMode: false,
  sandboxConfig: {
    carrier: 'PINEVO',
    servicePoint: 'A-17',
    shipmentId: 'SHIP-1',
    shipmentType: 'first_mile',
    allocationType: 'soft',
    expiry: '2026-04-01T12:00',
  },
};

describe('exportService', () => {
  it('builds a wrapped JSON export with full state', () => {
    const output = generateJsonExport(sampleState);
    const parsed = JSON.parse(output);

    expect(parsed.meta.app).toBe('PINEVO CMS');
    expect(parsed.meta.screenCount).toBe(2);
    expect(parsed.state.project.name).toBe('Warehouse Flow');
    expect(parsed.state.sandboxConfig.carrier).toBe('PINEVO');
    expect(parsed.state.screens[0].hardwareButtons.enter.goToScreen).toBe('screen-2');
  });

  it('builds a single zip export containing ui html files for all screens', async () => {
    const output = await generateHtmlExport(sampleState);
    const zip = await JSZip.loadAsync(output.blob);
    const screenHtml = await zip.file('ui/Home.html')?.async('string');
    const indexHtml = await zip.file('ui/index.html')?.async('string');
    const projectJson = await zip.file('ui/project.json')?.async('string');

    expect(output.fileName).toBe('warehouse_flow_ui.zip');
    expect(indexHtml).toContain('All project screens are packaged in this ui folder.');
    expect(screenHtml).toContain('<screen name="home"');
    expect(screenHtml).toContain('<label x=');
    expect(screenHtml).toContain('text="Courier"');
    expect(screenHtml).toContain('target="result"');
    expect(screenHtml).toContain('<image x="12" y="10" width="80" height="36" src="https://example.com/logo.png"');
    expect(screenHtml).toContain('font_src=""');
    expect(screenHtml).not.toContain('<section class="canvas-shell">');
    expect(projectJson).toContain('"screenCount": 2');
  });

  it('escapes project names in exported screen html', async () => {
    const output = await generateHtmlExport({
      ...sampleState,
      screens: [
        {
          ...sampleState.screens[0],
          components: sampleState.screens[0].components.map((component) => {
            if (component.type === 'button') {
              return {
                ...component,
                text: '<img src=x onerror=alert(1)>',
              };
            }

            return component;
          }),
        },
        sampleState.screens[1],
      ],
      project: {
        id: sampleState.project!.id,
        type: sampleState.project!.type,
        name: '<img src=x onerror=alert(1)>',
      },
    });
    const zip = await JSZip.loadAsync(output.blob);
    const screenHtml = await zip.file('ui/Home.html')?.async('string');

    expect(screenHtml).toContain('label="&lt;img src=x onerror=alert(1)&gt;"');
    expect(screenHtml).not.toContain('label="<img src=x onerror=alert(1)>"');
  });

  it('generates readable file names', () => {
    expect(getExportFileName(sampleState, 'json')).toBe('warehouse_flow_screens_json.zip');
    expect(getExportFileName(sampleState, 'html')).toBe('warehouse_flow_ui.zip');
  });

  it('builds json export zip with one json file per screen using original names', async () => {
    const output = await generateJsonScreensExport(sampleState);
    const zip = await JSZip.loadAsync(output.blob);
    const homeJson = await zip.file('json/Home.json')?.async('string');
    const resultJson = await zip.file('json/Result.json')?.async('string');

    expect(output.fileName).toBe('warehouse_flow_screens_json.zip');
    expect(homeJson).toContain('"name": "Home"');
    expect(resultJson).toContain('"name": "Result"');
  });

  it('exports embedded assets in both html and json bundles', async () => {
    const withEmbeddedAssets: CMSState = {
      ...sampleState,
      screens: [
        {
          ...sampleState.screens[0],
          components: sampleState.screens[0].components.map((component) => {
            if (component.type === 'image') {
              return {
                ...component,
                imageUrl: 'data:image/png;base64,iVBORw0KGgo=',
              };
            }

            if (component.type === 'button') {
              return {
                ...component,
                buttonSound: 'data:audio/wav;base64,UklGRg==',
              };
            }

            return component;
          }),
        },
        sampleState.screens[1],
      ],
    };

    const htmlBundle = await generateHtmlExport(withEmbeddedAssets);
    const htmlZip = await JSZip.loadAsync(htmlBundle.blob);
    const htmlScreen = await htmlZip.file('ui/Home.html')?.async('string');

    const jsonBundle = await generateJsonScreensExport(withEmbeddedAssets);
    const jsonZip = await JSZip.loadAsync(jsonBundle.blob);
    const jsonScreen = await jsonZip.file('json/Home.json')?.async('string');

    expect(htmlZip.file('ui/assets/image_1.png')).toBeTruthy();
    expect(htmlZip.file('ui/assets/audio_2.wav')).toBeTruthy();
    expect(htmlScreen).toContain('src="assets/image_1.png"');
    expect(htmlScreen).toContain('audio_src="assets/audio_2.wav"');

    expect(jsonZip.file('json/assets/image_1.png')).toBeTruthy();
    expect(jsonZip.file('json/assets/audio_2.wav')).toBeTruthy();
    expect(jsonScreen).toContain('"imageUrl": "assets/image_1.png"');
    expect(jsonScreen).toContain('"buttonSound": "assets/audio_2.wav"');
  });

  it('builds deploy bundle with selected type only and 244-byte chunks', async () => {
    const deployment = await generateBLEDeploymentBundle(sampleState, 'json', 244);
    const zip = await JSZip.loadAsync(deployment.blob);
    const configRaw = await zip.file('config/ui_config.json')?.async('string');
    const manifestRaw = await zip.file('config/manifest.json')?.async('string');

    expect(configRaw).toBeTruthy();
    expect(manifestRaw).toBeTruthy();
    expect(zip.file('ui/json/project.json')).toBeTruthy();
    expect(zip.file('ui/json/Home.json')).toBeTruthy();
    expect(zip.file('ui/html/index.html')).toBeFalsy();
    expect(zip.file('ui/html/Home.html')).toBeFalsy();
    expect(zip.file('ui/html/project.json')).toBeFalsy();

    const config = JSON.parse(configRaw || '{}');
    const manifest = JSON.parse(manifestRaw || '{}');

    expect(config.selectedType).toBe('json');
    expect(config.ackEnabled).toBe(true);
    expect(config.targetLfsDirectory).toBe('/lfs/ui/json');
    expect(config.activeEntryPath).toBe('ui/json/Home.json');
    expect(config.storage.backend).toBe('lfs');
    expect(config.paths.selectedRoot).toBe('ui/json');
    expect(config.paths.selectedAssetsRoot).toBe('ui/json/assets');
    expect(manifest.files.some((entry: { path: string }) => entry.path === 'ui/html/index.html')).toBe(false);
    expect(manifest.files.some((entry: { path: string }) => entry.path === 'ui/json/project.json')).toBe(true);

    expect(deployment.fileName).toBe('warehouse_flow_deploy_bundle.zip');
    expect(deployment.chunkSize).toBe(244);
    expect(deployment.chunks.length).toBeGreaterThan(0);
    expect(deployment.chunks.every((chunk) => chunk.length <= 244)).toBe(true);
  });

  it('creates BLE start/chunk/commit packets from deploy bundle', async () => {
    const deployment = await generateBLEDeploymentBundle(sampleState, 'html', 244);
    const packets = createBLEZipDeploymentPackets(deployment);

    expect(packets.start.cmd).toBe('zip_start');
    expect(packets.start.fileName).toBe('warehouse_flow_deploy_bundle.zip');
    expect(packets.start.selectedType).toBe('html');
    expect(packets.start.protocolAckEnabled).toBe(true);
    expect(packets.start.targetLfsDirectory).toBe('/lfs/ui/html');
    expect(packets.start.activeEntryPath).toBe('ui/html/Home.html');
    expect(packets.start.totalChunks).toBe(deployment.chunks.length);

    expect(packets.chunks.length).toBe(deployment.chunks.length);
    expect(packets.chunks[0].cmd).toBe('zip_chunk');
    expect(typeof packets.chunks[0].payloadBase64).toBe('string');
    expect(packets.chunks[0].payloadBase64.length).toBeGreaterThan(0);

    expect(packets.commit.cmd).toBe('zip_commit');
    expect(packets.commit.fileName).toBe('warehouse_flow_deploy_bundle.zip');
  });
});