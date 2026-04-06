# Multi-Language Support in PINEVO CMS

## Overview
PINEVO CMS supports multi-language UI projects. You can manage translations for all user-facing text, export language files, and deploy them to firmware for runtime language switching.

## How It Works
- **Translation Keys:** All UI text uses translation keys (e.g., `welcome`, `ok`, `submit`).
- **Language Files:** Each language has a JSON file (e.g., `en.json`, `da.json`) with key-value pairs.
- **CMS UI:** Users can add/edit translations for each language using the translation editor.
- **Export:** All language files are included in the deployment bundle.
- **Firmware:** Loads the selected language file and looks up translation keys at runtime.

## Adding/Editing Translations
1. Open the translation editor in the CMS.
2. Add new keys or edit existing ones for each language.
3. Ensure all keys are present in all language files for full coverage.

## Using Translations in UI
- Assign a translation key to each UI component (e.g., button label uses `ok`).
- The CMS will display the correct text based on the selected language.

## Export and Deployment
- When exporting, the CMS bundles all language files (e.g., `ui/lang/en.json`, `ui/lang/da.json`).
- Firmware loads the correct file based on user/device language setting.

## Firmware Integration
- Firmware parses the JSON language file into a key-value map.
- For each UI component, it looks up the translation key and displays the localized string.
- If a key is missing, firmware can fall back to English or show the key itself.

## Adding New Strings
- Add a new translation key in the CMS translation editor.
- Provide translations for all languages.
- The new string will be available after the next deployment.

## Example
**en.json:**
```
{
  "welcome": "Welcome",
  "ok": "OK",
  "submit": "Submit"
}
```
**da.json:**
```
{
  "welcome": "Velkommen",
  "ok": "OK",
  "submit": "Indsend"
}
```
**UI Schema:**
```
{
  "type": "button",
  "labelKey": "submit"
}
```

## Best Practices
- Always use translation keys for all user-facing text.
- Keep language files in sync.
- Validate that all keys exist in all language files before deployment.
- Use the CMS preview to check UI in all supported languages.
