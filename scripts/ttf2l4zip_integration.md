// Add this script to your deployment pipeline to ensure fonts are always exported in L4 format for firmware use.
// You can call this script from your build or deploy scripts (e.g., npm run build or npm run deploy)
// Example: add "node scripts/ttf2l4zip.js" to your deploy/build process

// If you want to automate this, add the following to your package.json scripts section:
// "export-fonts-l4": "node scripts/ttf2l4zip.js"
// Then call: npm run export-fonts-l4

// To fully automate, add this to your deploy script:
// "deploy": "npm run build && npm run export-fonts-l4 && ...other steps..."

// This ensures that every deployment/export includes the L4 font zip for firmware.
