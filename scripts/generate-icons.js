// Generates PWA PNG icons from public/favicon.svg
// Run via: node scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const svgPath = resolve(root, 'public/favicon.svg');
const svg = readFileSync(svgPath);

const BG = '#232136'; // rose pine moon base, matches manifest theme

async function render(name, size, { bg = null, padding = 0 } = {}) {
  const inner = size - padding * 2;
  const rendered = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();
  const base = bg
    ? sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: bg
        }
      }).png()
    : sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).png();

  await base
    .composite([{ input: rendered, top: padding, left: padding }])
    .toFile(resolve(root, 'public', name));
  console.log(`  ✓ ${name}  (${size}x${size})`);
}

console.log('Generating PWA icons…');
await render('pwa-192.png', 192);
await render('pwa-512.png', 512);
await render('pwa-512-maskable.png', 512, { bg: BG, padding: 64 });
await render('apple-touch-icon.png', 180, { bg: BG, padding: 10 });
console.log('Done.');
