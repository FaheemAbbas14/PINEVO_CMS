import JSZip from 'jszip';

export async function addFontsFolderToZip(zip: JSZip, fontsDir: string, targetFolder: string) {
  // Dynamically import fs/promises for Node.js file access
  const fs = await import('fs/promises');
  const path = await import('path');
  try {
    const files = await fs.readdir(fontsDir);
    for (const file of files) {
      if (file.endsWith('.c')) {
        const filePath = path.join(fontsDir, file);
        const data = await fs.readFile(filePath);
        zip.folder(targetFolder)?.file(file, data);
      }
    }
  } catch (err) {
    // Ignore if folder doesn't exist
  }
}
