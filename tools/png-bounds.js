#!/usr/bin/env node
/* PNG opaque bounds without deps — node tools/png-bounds.js art/images/soil-spring.png */
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(file) {
  const buf = fs.readFileSync(file);
  let pos = 8;
  let w = 0; let h = 0; let depth = 0; let color = 0;
  const idats = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); pos += 4;
    const type = buf.toString('ascii', pos, pos + 4); pos += 4;
    const data = buf.subarray(pos, pos + len); pos += len; pos += 4;
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      color = data[9];
    } else if (type === 'IDAT') idats.push(data);
    else if (type === 'IEND') break;
  }
  if (depth !== 8 || color !== 6) throw new Error(`unsupported ${depth}/${color}`);
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = 1 + w * bpp;
  const out = Buffer.alloc(w * h * 4);
  let rawOff = 0; let outOff = 0;
  const prev = Buffer.alloc(w * bpp);
  const row = Buffer.alloc(w * bpp);
  for (let y = 0; y < h; y += 1) {
    const filter = raw[rawOff]; rawOff += 1;
    for (let x = 0; x < w * bpp; x += 1) {
      const v = raw[rawOff + x];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let val;
      switch (filter) {
        case 0: val = v; break;
        case 1: val = (v + a) & 255; break;
        case 2: val = (v + b) & 255; break;
        case 3: val = (v + ((a + b) >> 1)) & 255; break;
        case 4: val = (v + paeth(a, b, c)) & 255; break;
        default: throw new Error('bad filter ' + filter);
      }
      row[x] = val;
    }
    row.copy(out, outOff);
    row.copy(prev);
    rawOff += w * bpp;
    outOff += w * bpp;
  }
  return { w, h, data: out };
}

function bounds(data, w, h, alphaMin = 8) {
  let minX = w; let minY = h; let maxX = 0; let maxY = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > alphaMin) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    minX, minY, maxX, maxY,
    top: (minY / h * 100),
    left: (minX / w * 100),
    right: ((w - 1 - maxX) / w * 100),
    bottom: ((h - 1 - maxY) / h * 100),
  };
}

const files = process.argv.slice(2);
if (!files.length) {
  const dir = path.join(__dirname, '..', 'art', 'images');
  files.push(...fs.readdirSync(dir).filter((n) => /^soil-|^planter-/.test(n)).map((n) => path.join(dir, n)));
}
for (const file of files) {
  const { w, h, data } = decodePng(file);
  const b = bounds(data, w, h);
  console.log(`${path.basename(file)} ${w}x${h}  top ${b.top.toFixed(1)}%  left ${b.left.toFixed(1)}%  right ${b.right.toFixed(1)}%  bottom ${b.bottom.toFixed(1)}%`);
}
