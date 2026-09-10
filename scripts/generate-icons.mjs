import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const site = new URL('../site/', import.meta.url);
await mkdir(new URL('assets/icons/', site), { recursive: true });

const variants = [
  {
    source: 'assets/favicon.svg',
    outputs: [
      ['apple-touch-icon.png', 180],
      ['assets/icons/apple-touch-icon-152x152.png', 152],
      ['assets/icons/apple-touch-icon-167x167.png', 167],
      ['assets/icons/android-chrome-192x192.png', 192],
      ['assets/icons/android-chrome-512x512.png', 512],
    ],
  },
  {
    source: 'assets/icon-maskable.svg',
    outputs: [
      ['assets/icons/android-chrome-maskable-192x192.png', 192],
      ['assets/icons/android-chrome-maskable-512x512.png', 512],
    ],
  },
];

for (const { source, outputs } of variants) {
  // Rasterize at 512px, then preserve the SVG's crisp pixel edges at every size.
  const input = await readFile(new URL(source, site));
  const raster = await sharp(input, { density: 1152 }).png().toBuffer();

  for (const [filename, size] of outputs) {
    await sharp(raster)
      .resize(size, size, { kernel: 'nearest' })
      .removeAlpha()
      .png({ compressionLevel: 9 })
      .toFile(fileURLToPath(new URL(filename, site)));
    console.log(`${filename}: ${size}x${size}`);
  }
}
