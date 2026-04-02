# PINEVO CMS

PINEVO CMS is a React and TypeScript editor for building PIN Evo and Flex device screen flows. The app lets you create projects, manage multiple screens, place UI components on the device canvas, configure hardware-button behavior, preview interactions, and export the result.

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

- HTML export downloads a single zip archive. Inside it, the `ui/` folder contains `index.html`, one HTML file per screen, and `project.json` for the full exported state.
- Embedded media assets (for example uploaded data-URL images/audio) are extracted into `assets/` inside the export folder and references in exported screen files are rewritten to those asset paths.
- Each exported screen file now uses a firmware-friendly tag format, for example `<screen>`, `<label>`, `<button>`, `<image>`, `<input>`, `<audio>`, `<api>`, and `<command>`, including attributes like `font_src`, `src`, `target`, and layout coordinates.
- Per-screen export file names preserve the original screen names (for example `Home.html`, `Result.html`, `Home.json`, `Result.json`).
- JSON export downloads a zip archive with a `json/` folder containing `project.json` plus one JSON file per screen.
- JSON per-screen exports also include `json/assets/` so screen JSON files reference packaged assets and do not break on device.
- Open Project accepts both the saved project format and the wrapped JSON export format.

## Main Features

- Multi-screen project editor for PIN Evo and Flex layouts
- Drag-and-drop canvas component placement
- Property editor for text, image, button, API, audio, and command components
- Preview mode for screen-to-screen interaction testing
- Hardware-button configuration per screen
- BLE deployment workflow scaffolding
- BLE modal can connect to custom config service UUID `abcdef01-1234-5678-9abc-def012345678` and send a dummy test payload to RX characteristic UUID `abcdef02-1234-5678-9abc-def012345678` when Deploy to Device is clicked

## Stack

- React 19
- TypeScript 5
- Vite 8
- Vitest with Testing Library
