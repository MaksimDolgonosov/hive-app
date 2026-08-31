/**
 * Generates all app icon assets from assets/images/Icon-2.png
 * (Icon Composer export, 1024×1024, full-bleed).
 * Run: node scripts/generate-app-icons.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../assets/images');
const SOURCE = path.join(OUT_DIR, 'Icon-2.png');

// Matches the orange tone in Icon-2.png for Android adaptive background layer.
const ANDROID_BACKGROUND = '#F5A623';

async function writeSolidBackground(outPath, size, color) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toFile(outPath);
}

async function writeMonochrome(outPath, size) {
  const { data, info } = await sharp(SOURCE)
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += info.channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const isForeground = luminance > 40 && pixels[i + 3] > 16;
    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = isForeground ? 255 : 0;
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const outputs = [
    { name: 'icon.png', size: 1024 },
    { name: 'splash-icon.png', size: 512 },
    { name: 'android-icon-foreground.png', size: 1024 },
    { name: 'favicon.png', size: 48 },
  ];

  for (const { name, size } of outputs) {
    const outPath = path.join(OUT_DIR, name);
    await sharp(SOURCE).resize(size, size).png().toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }

  await writeSolidBackground(path.join(OUT_DIR, 'android-icon-background.png'), 1024, ANDROID_BACKGROUND);
  console.log(`Wrote ${path.join(OUT_DIR, 'android-icon-background.png')}`);

  await writeMonochrome(path.join(OUT_DIR, 'android-icon-monochrome.png'), 1024);
  console.log(`Wrote ${path.join(OUT_DIR, 'android-icon-monochrome.png')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
