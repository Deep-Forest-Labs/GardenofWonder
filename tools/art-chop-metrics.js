#!/usr/bin/env node
/* Measure opaque bounds of art chops — run: node tools/art-chop-metrics.js */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'art', 'images');

function readPngSize(buf) {
  if (buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not png');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

async function loadPng(file) {
  const pngjs = await import('pngjs').catch(() => null);
  if (!pngjs) {
    console.error('pngjs not installed — using rough header-only size');
    const buf = fs.readFileSync(file);
    const { w, h } = readPngSize(buf);
    return { w, h, data: null };
  }
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new pngjs.PNG())
      .on('parsed', function () { resolve({ w: this.width, h: this.height, data: this.data }); })
      .on('error', reject);
  });
}

function bounds(data, w, h, alphaMin = 8) {
  let minX = w; let minY = h; let maxX = 0; let maxY = 0; let n = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > alphaMin) {
        n += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!n) return null;
  return {
    minX, minY, maxX, maxY,
    pct: {
      top: (minY / h * 100).toFixed(1),
      left: (minX / w * 100).toFixed(1),
      right: ((w - 1 - maxX) / w * 100).toFixed(1),
      bottom: ((h - 1 - maxY) / h * 100).toFixed(1)
    }
  };
}

(async () => {
  const names = fs.readdirSync(ROOT).filter((n) => n.endsWith('.png'));
  for (const name of names.sort()) {
    const file = path.join(ROOT, name);
    try {
      const img = await loadPng(file);
      if (!img.data) {
        console.log(`${name}: ${img.w}x${img.h} (install pngjs for bounds)`);
        continue;
      }
      const b = bounds(img.data, img.w, img.h);
      console.log(`${name}: ${img.w}x${img.h} opaque inset top ${b.pct.top}% left ${b.pct.left}% right ${b.pct.right}% bottom ${b.pct.bottom}%`);
    } catch (e) {
      console.log(`${name}: error ${e.message}`);
    }
  }
})();
