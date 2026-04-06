# PINEVO CMS

PINEVO CMS is a React and TypeScript editor for building PIN Evo and Flex device screen flows. The app lets you create projects, manage multiple screens, place UI components on the device canvas, configure hardware-button behavior, preview interactions, and export the result.

## Multi-Language Support

See [MULTI_LANGUAGE_SUPPORT.md](MULTI_LANGUAGE_SUPPORT.md) for details on how to use and manage translations in the CMS.

## Development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Available scripts:

```bash
npm run dev
npm run build
npm run lint
npm run test:run
```

## Export Options

Use the Export button in the top bar to choose the output format.


- Export and deployment format availability is configurable through feature flags in `src/config/project.ts`:
	- `enableHtmlUiFormat`
	- `enableJsonUiFormat`
	Disabled formats are hidden/blocked in Export and BLE deployment.
- The active UI format is also shown in the top bar so you can immediately see whether the project is currently set to HTML or JSON for export/deployment.
- Exported `Home` screens also get an embedded runtime label (`UI: HTML` or `UI: JSON`) so firmware can display which UI format is currently being rendered.
- HTML and JSON hardware button exports now use the same configured key set, including non-digit keys such as `backspace`, `enter`, or `call` when present.
- BLE deployment image asset conversion is configurable via `EXPORT_CONFIG.deploymentImageFormat` in `src/config/project.ts`:
	- `'auto'` (default): Opaque images are exported as `.jpg`, images with transparency as `.png`.
	- `'raw'`: All raster images are converted to raw uncompressed RGBA format for embedded use (much larger, but direct pixel data).
	- Logging of image sizes before and after conversion is included in both modes.
	- To change the mode, set `deploymentImageFormat: 'raw'` or `'auto'` in `EXPORT_CONFIG`.
## Main Features

- Multi-screen project editor for PIN Evo and Flex layouts
- Drag-and-drop canvas component placement
- Property editor for text, image, button, API, audio, and command components
- Preview mode for screen-to-screen interaction testing
- Hardware-button configuration per screen
- BLE deployment workflow scaffolding
- BLE modal can connect to custom config service UUID `abcdef01-1234-5678-9abc-def012345678` and send a dummy test payload to RX characteristic UUID `abcdef02-1234-5678-9abc-def012345678` when Deploy to Device is clicked
- BLE modal currently uses a fixed 244-byte payload chunk strategy (targeting MTU 247 links)

## Stack

- React 19
- TypeScript 5
- Vite 8
- Vitest with Testing Library
