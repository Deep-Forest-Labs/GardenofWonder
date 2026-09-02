#!/usr/bin/env node
//
// capture-screens.js — drive the live build through every key screen and write
// the gallery's PNGs to docs/screens/.
//
// The tool is the deliverable. The PNGs in docs/screens/ are just its latest run,
// and docs/44-screens.md is written against them, so a screen that changes is one
// command away from being true again:
//
//   node tools/capture-screens.js              every screen
//   node tools/capture-screens.js summer-garden fall-bed    only these
//   node tools/capture-screens.js --list       what it would capture
//
// It shares no code with tools/probe.js on purpose — probe is the interactive
// instrument a session reaches for, this is the unattended one — but it speaks the
// same step grammar, so a recipe worked out with probe pastes straight into SCENES.
//
// No dependencies and no build step, in keeping with the rest of the project. It
// drives Chrome over the DevTools Protocol using the WebSocket client built into
// Node 22, and quantises its own PNGs with `zlib` alone.
//
// THE RULE THAT MAKES THIS WORK: a screen that needs progress is DRIVEN to that
// state before the shutter, never assumed. A screenshot of the wrong state is
// silent — it exits 0 and looks plausible — so every scene below says what it is
// driving and the run asserts the state it expects before it captures.

'use strict';

const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screens');

const SIZE = { width: 390, height: 844 };   // the phone the game is designed for
const SCALE = 2;                            // 2x, so the gallery is crisp on a retina screen
const BUDGET = 300 * 1024;                  // per-image ceiling; see quantise()

/* Chrome's screenshots are 8-bit truecolour and run 500-900KB at this size, which
   is not a thing to commit weekly. The art is flat fills and thick outlines, so an
   adaptive 256-colour palette is visually indistinguishable and about a quarter of
   the bytes — these are the palette sizes tried, in order, first one under BUDGET wins. */
const PALETTE_LADDER = [256, 192, 128, 96, 64];

/* The day/night sky is a pure function of epoch time on a SIX-MINUTE cycle, so an
   unpinned gallery is a different sky in every shot — a blue garden, an orange one two
   scenes later, and a purple dusk for whatever ran at the wrong moment. Worse than
   ugly, it is not reproducible: regenerate an hour later and every picture changes.
   0.45 sits between the two daytime keys in ui-scenery.js's SKY_KEYS — sun high, no
   stars, the sky this game is thought of as having. */
const DAYLIGHT = 0.45;

// ---------------------------------------------------------------- PNG

/* A minimal PNG reader and palette writer. Only what this tool needs: Chrome
   hands back 8-bit truecolour with no interlacing, and we hand back an 8-bit
   palette image. Anything else is refused loudly rather than mangled quietly. */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

/** Decode to a flat RGB pixel buffer, undoing PNG's per-row filters. */
function pngDecode(buf) {
  const chunks = [];
  let p = 8;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    chunks.push({ type: buf.toString('ascii', p + 4, p + 8), data: buf.slice(p + 8, p + 8 + len) });
    p += 12 + len;
  }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth = ihdr[8];
  const colour = ihdr[9];
  const interlace = ihdr[12];
  if (depth !== 8 || (colour !== 2 && colour !== 6) || interlace !== 0) {
    throw new Error(`unexpected PNG from Chrome: depth ${depth}, colour type ${colour}, interlace ${interlace}`);
  }
  const bpp = colour === 2 ? 3 : 4;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const px = Buffer.alloc(stride * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[o++];
    const line = raw.slice(o, o + stride);
    o += stride;
    const cur = px.slice(y * stride, (y + 1) * stride);
    const prev = y ? px.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const q = a + b - c;
        const pa = Math.abs(q - a);
        const pb = Math.abs(q - b);
        const pc = Math.abs(q - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 255;
    }
  }
  return { width, height, bpp, px };
}

/*
 * Median cut, split by the widest LUMA-weighted axis rather than the widest raw
 * one. The game's palette is saturated — a box wide in blue and narrow in green
 * splits on blue if you measure in raw units, and the eye never sees the
 * difference, so the greens (which are most of the screen) go under-served.
 */
function medianCut(px, bpp, maxColours) {
  const hist = new Map();
  for (let i = 0; i < px.length; i += bpp) {
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  const entries = [...hist.entries()].map(([k, n]) => ({ r: (k >> 16) & 255, g: (k >> 8) & 255, b: k & 255, n }));
  const extent = (box) => {
    let rmin = 255, rmax = 0, gmin = 255, gmax = 0, bmin = 255, bmax = 0, total = 0;
    for (const e of box) {
      if (e.r < rmin) rmin = e.r;
      if (e.r > rmax) rmax = e.r;
      if (e.g < gmin) gmin = e.g;
      if (e.g > gmax) gmax = e.g;
      if (e.b < bmin) bmin = e.b;
      if (e.b > bmax) bmax = e.b;
      total += e.n;
    }
    return { r: (rmax - rmin) * 0.299, g: (gmax - gmin) * 0.587, b: (bmax - bmin) * 0.114, total };
  };

  let boxes = [entries];
  while (boxes.length < maxColours) {
    let pick = -1;
    let best = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length < 2) continue;
      const e = extent(boxes[i]);
      // Population matters as well as spread, or a handful of stray pixels take a slot.
      const score = (e.r + e.g + e.b) * Math.sqrt(e.total);
      if (score > best) { best = score; pick = i; }
    }
    if (pick === -1) break;
    const box = boxes[pick];
    const e = extent(box);
    const axis = e.r >= e.g && e.r >= e.b ? 'r' : e.g >= e.b ? 'g' : 'b';
    box.sort((x, y) => x[axis] - y[axis]);
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < box.length; i++) {
      acc += box[i].n;
      if (acc >= e.total / 2) { cut = Math.max(1, Math.min(box.length - 1, i + 1)); break; }
    }
    boxes.splice(pick, 1, box.slice(0, cut), box.slice(cut));
  }

  return boxes.filter((b) => b.length).map((box) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (const e of box) { r += e.r * e.n; g += e.g * e.n; b += e.b * e.n; n += e.n; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

/* Nearest palette entry per pixel, no dithering. Dithering is the obvious next
   knob and it is deliberately not turned: the error diffusion it sprinkles over
   every flat fill costs more bytes than the extra colours would, and it makes a
   screenshot of flat art look noisy next to the game. Measured on the summer
   garden: no dither 164KB, half-strength 264KB, full 472KB. */
function mapToPalette(px, bpp, width, height, palette) {
  const indices = Buffer.alloc(width * height);
  const cache = new Map();
  for (let i = 0, j = 0; j < indices.length; i += bpp, j++) {
    const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
    let hit = cache.get(key);
    if (hit === undefined) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let k = 0; k < palette.length; k++) {
        const p = palette[k];
        const dr = px[i] - p[0], dg = px[i + 1] - p[1], db = px[i + 2] - p[2];
        const d = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;
        if (d < bestDist) { bestDist = d; bestIdx = k; }
      }
      hit = bestIdx;
      cache.set(key, hit);
    }
    indices[j] = hit;
  }
  return indices;
}

function encodePalettePng(width, height, indices, palette) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 3;   // colour type: palette
  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach((c, i) => { plte[i * 3] = c[0]; plte[i * 3 + 1] = c[1]; plte[i * 3 + 2] = c[2]; });

  /* Only filters 0 (none) and 2 (up) are worth trying on palette INDICES —
     the others do arithmetic on index numbers, which are labels, not
     quantities, and the differences they produce are noise. */
  const out = Buffer.alloc((width + 1) * height);
  let q = 0;
  for (let y = 0; y < height; y++) {
    const cur = indices.slice(y * width, (y + 1) * width);
    const prev = y ? indices.slice((y - 1) * width, y * width) : Buffer.alloc(width);
    let none = 0;
    let up = 0;
    for (let i = 0; i < width; i++) {
      const a = cur[i];
      const b = (cur[i] - prev[i]) & 255;
      none += a < 128 ? a : 256 - a;
      up += b < 128 ? b : 256 - b;
    }
    if (none <= up) {
      out[q++] = 0;
      cur.copy(out, q);
      q += width;
    } else {
      out[q++] = 2;
      for (let i = 0; i < width; i++) out[q + i] = (cur[i] - prev[i]) & 255;
      q += width;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('PLTE', plte),
    pngChunk('IDAT', zlib.deflateSync(out, { level: 9, memLevel: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Chrome's PNG in, a palette PNG under BUDGET out. Steps down PALETTE_LADDER
 * until one fits, and reports which rung it landed on so a screen that is
 * quietly getting more expensive shows up in the run's own output.
 */
function quantise(sourcePng) {
  const { width, height, bpp, px } = pngDecode(sourcePng);
  const distinct = new Set();
  for (let i = 0; i < px.length && distinct.size <= 256; i += bpp) {
    distinct.add((px[i] << 16) | (px[i + 1] << 8) | px[i + 2]);
  }
  // An image that already fits in 256 colours quantises losslessly; say so.
  const lossless = distinct.size <= 256;

  let last = null;
  for (const colours of PALETTE_LADDER) {
    const palette = medianCut(px, bpp, colours);
    const indices = mapToPalette(px, bpp, width, height, palette);
    last = { png: encodePalettePng(width, height, indices, palette), colours: palette.length, lossless };
    if (last.png.length <= BUDGET) return last;
  }
  return last;   // over budget; the caller reports it rather than shipping a lie
}

// ---------------------------------------------------------------- the browser

function findChrome() {
  const candidates = [
    process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('No Chrome found. Set CHROME to a Chrome or Chromium binary and try again.');
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404).end(); return; }
        res.writeHead(200, {
          'content-type': MIME[path.extname(file)] || 'application/octet-stream',
          'cache-control': 'no-store',
        });
        res.end(body);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined) {
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message));
        else entry.resolve(msg.result);
        return;
      }
      const handlers = this.listeners.get(msg.method);
      if (handlers) for (const h of handlers) h(msg.params);
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error(`cannot reach ${url}`)), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(method, handler) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(handler);
  }

  once(method) {
    return new Promise((resolve) => {
      const handler = (params) => {
        const list = this.listeners.get(method);
        list.splice(list.indexOf(handler), 1);
        resolve(params);
      };
      this.on(method, handler);
    });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- the driver

/*
 * The step grammar is tools/probe.js's, so a recipe worked out interactively
 * pastes straight into a scene:
 *
 *   eval:EXPR        evaluate in the page
 *   wait:MS          let timers and animations run
 *   tap:SELECTOR     a real touch on the element's centre
 *   tap:SELECTOR*N   N of them, ~40ms apart
 *   drag:SEL:DX,DY   a real one-finger drag from SEL's centre
 *   drag:@X,Y:DX,DY  the same, from a viewport point (the lawn, not an element)
 *   media:reduce     prefers-reduced-motion on (media:normal turns it off)
 *
 * `tap:` on anything below the fold silently misses, so anything that must
 * simply HAPPEN is driven with eval and .click(); tap is kept for the cases
 * where reaching it with a thumb is the point.
 */
async function runStep(ctx, step) {
  const sep = step.indexOf(':');
  if (sep === -1) throw new Error(`step "${step}" is missing its ":"`);
  const kind = step.slice(0, sep);
  const rest = step.slice(sep + 1);

  switch (kind) {
    case 'wait':
      await sleep(Number(rest));
      return;

    case 'eval': {
      const { exceptionDetails } = await ctx.call('Runtime.evaluate', {
        expression: rest, returnByValue: true, awaitPromise: true,
      });
      if (exceptionDetails) {
        throw new Error(`eval threw: ${exceptionDetails.text} — ${rest}`);
      }
      return;
    }

    case 'media':
      if (rest !== 'reduce' && rest !== 'normal') throw new Error(`media wants reduce|normal, got "${rest}"`);
      await ctx.call('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: rest === 'reduce' ? 'reduce' : 'no-preference' }],
      });
      return;

    case 'tap': {
      const m = /^(.*?)(?:\*(\d+))?$/.exec(rest);
      const selector = m[1];
      const times = m[2] ? +m[2] : 1;
      const point = await ctx.centreOf(selector);
      if (!point) throw new Error(`tap: nothing matches "${selector}"`);
      for (let i = 0; i < times; i++) {
        const touch = [{ x: point.x, y: point.y, radiusX: 8, radiusY: 8, force: 1 }];
        await ctx.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch });
        await ctx.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(40);
      }
      return;
    }

    /* MOUSE, not touch, and deliberately. A dispatched touch-drag on a page with
       no `touch-action:none` is read as a pan and answered with `pointercancel`
       after the first move, so the gesture dies in automation on a screen where
       it works perfectly in the hand. See docs/24-remote-sessions.md. */
    case 'drag': {
      const at = rest.lastIndexOf(':');
      const delta = at === -1 ? null : /^(-?\d+),(-?\d+)$/.exec(rest.slice(at + 1));
      if (!delta) throw new Error(`drag wants SELECTOR:DX,DY, got "${rest}"`);
      const selector = rest.slice(0, at);
      const dx = +delta[1];
      const dy = +delta[2];
      const atPoint = /^@(-?\d+),(-?\d+)$/.exec(selector);
      const point = atPoint ? { x: +atPoint[1], y: +atPoint[2] } : await ctx.centreOf(selector);
      if (!point) throw new Error(`drag: nothing matches "${selector}"`);
      const mouse = (type, x, y) => ctx.call('Input.dispatchMouseEvent', {
        type, x, y, button: 'left', clickCount: 1, buttons: type === 'mouseReleased' ? 0 : 1,
      });
      await mouse('mousePressed', point.x, point.y);
      for (let i = 1; i <= 8; i++) {
        await mouse('mouseMoved', point.x + (dx * i) / 8, point.y + (dy * i) / 8);
        await sleep(16);
      }
      await mouse('mouseReleased', point.x + dx, point.y + dy);
      return;
    }

    default:
      throw new Error(`unknown step "${kind}" in "${step}"`);
  }
}

/** Poll an expression until it is truthy. Returns false on timeout rather than throwing. */
async function waitFor(ctx, expression, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { result } = await ctx.call('Runtime.evaluate', { expression, returnByValue: true });
    if (result.value) return true;
    if (Date.now() >= deadline) return false;
    await sleep(200);
  }
}

/*
 * The sky is the one thing that makes this gallery irreproducible, and it took a
 * while to see why. Weather is a hash of epoch time, so roughly a third of runs boot
 * straight into rain, a storm, an aurora or a Wonderfall — and boot()'s startWeather()
 * ARRIVES that sky immediately, with no front, because it is already here.
 *
 * Asking for clear does not undo that in the same frame. It ends the sky, and ending
 * one is a sequence: the layers hold for HOLD[standing] — eight seconds for rain and
 * storm — and rain or storm ending into clear DAYLIGHT hands over to a thirty-second
 * sunbreak on its own timer, on purpose, because the rays are supposed to outlive the
 * cloud. Screenshot any of that and you get a dark storm sky over a "clear" garden.
 *
 * So: ask for clear, then wait for the layers to actually report clear rather than
 * guessing at a delay, then call startWeather() — the one public entry point that runs
 * sunbreakOff() — to take down any rays the handover started. A sky that was already
 * clear falls straight through and costs nothing.
 */
async function settleSky(ctx, scene) {
  if (scene.weather === null) return;   // the scene drives its own sky

  const want = scene.weather === undefined ? 'clear' : scene.weather;
  await runStep(ctx, `eval:Game.Dev.setWeather(${JSON.stringify(want)})`);
  if (want !== 'clear') return;         // a scene that WANTS weather times its own arrival

  const quiet = await waitFor(ctx, 'UI.wxHoldsSky() === false', 12000);
  if (!quiet) {
    throw new Error('the sky never went clear — a weather layer is stuck, and every shot would wear it');
  }
  await runStep(ctx, 'eval:UI.startWeather()');
  await sleep(250);
}

async function captureScene(ctx, scene) {
  /* Every scene starts from a pristine garden. reset() empties the save and
     rebuilds state in memory; the navigate that follows is what puts a freshly
     booted UI on top of it. Doing it in the other order would leave the previous
     scene's rooms, sheets and toasts on screen over a state that no longer
     matches them. reset() does NOT clear the announcement's seen-flag.

     But a SCENE can, and one does: the menu's badge dot means "there is an
     announcement you have not read", so photographing it means clearing the
     flag. Marking every announcement read once per RUN was therefore not enough
     — everything after that scene booted with the dialog over it and four Turn
     screens failed on taps that landed on its scrim. Re-marking here costs one
     evaluate per scene and makes the guard robust against any scene that touches
     the flag, rather than against the ones that happened to exist. */
  await ctx.call('Runtime.evaluate', { expression: 'Game.reset()', returnByValue: true });
  await ctx.call('Runtime.evaluate', {
    expression: '(DATA.announcements || []).forEach((a) => Game.markNewsSeen(a.id))',
    returnByValue: true,
  });
  await ctx.goto('index.html');

  /* Weather is a pure function of epoch time, so an unpinned sky makes this
     gallery different on every run — rain over one week's summer garden and sun
     over the next. Pin it unless the scene is ABOUT the sky. The hold is sticky
     and reset() clears it, so it has to be set here, after the navigate. */
  /* Move the whole cycle rather than stubbing the getter. `DAY.offset` is the knob
     data.js already documents as "only shifts the global phase", and both readers go
     through it — the sky ui-scenery.js paints AND the private dayPhase() that
     Game.isNight() resolves against. Stubbing Game.dayPhase would pin the picture and
     leave the simulation thinking it was midnight, which is the kind of half-pinned
     state that puts a moonlit Hollow behind a midday garden. DAY is module data, so a
     navigate resets it and every scene re-pins.
     A scene may set daylight to null to let the real clock through. */
  if (scene.daylight !== null) {
    const phase = scene.daylight === undefined ? DAYLIGHT : scene.daylight;
    await runStep(ctx, `eval:DAY.offset = ((${phase} - (Date.now() / 1000) / DAY.cycle) % 1 + 1) % 1; UI.updateSky();`);
  }

  await settleSky(ctx, scene);

  for (const step of scene.steps) await runStep(ctx, step);

  /* The assertion that makes the gallery trustworthy. A screen driven to the
     wrong state photographs perfectly and exits 0, so every scene states what
     must be true at the shutter and the run stops if it is not. */
  if (scene.expect) {
    const { result, exceptionDetails } = await ctx.call('Runtime.evaluate', {
      expression: scene.expect, returnByValue: true,
    });
    if (exceptionDetails) throw new Error(`expect threw: ${exceptionDetails.text} — ${scene.expect}`);
    if (!result.value) throw new Error(`expect was false: ${scene.expect}`);
  }

  const { data } = await ctx.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
}

// ---------------------------------------------------------------- the screens

/*
 * The table this whole tool exists to run. Each scene says what it drives, what it
 * asserts, and who owns it — and the gallery page in docs/44-screens.md is written
 * from these same fields, so a screen and its caption cannot drift apart.
 *
 *   slug     the file name, and the anchor on the gallery page
 *   group    the gallery's section heading
 *   line     the one plain sentence under the picture
 *   doc/file the document and the source file that own this screen
 *   weather  the sky to pin, or null to let the scene set its own
 *   steps    probe.js grammar — see runStep()
 *   expect   asserted immediately before the shutter; a false one fails the run
 *
 * Every scene starts from a pristine garden, so the steps have to build the state
 * they photograph. That is the point: a screen that needs progress is DRIVEN there.
 */
const SCENES = [
  {
    slug: 'summer-garden',
    group: 'The garden',
    title: 'The summer garden, mid-year',
    line:
      'The core loop with a year behind it: eight plots planted at staggered stages, creatures tending, and the talking flower waiting for a tap.',
    doc: '08-ui-and-layout.md',
    file: 'ui.js',
    steps: [
      'tap:#flowerBtn',
      'eval:Game.Dev.grantLevels(11)',
      'eval:Game.Dev.driveYear(160000)',
      'eval:Game.Dev.runTurn().turnsCompleted',
      'wait:600',
      'eval:document.querySelector(".s-edge.r").click()',
      'wait:1200',
      'eval:document.querySelector(".s-edge.l").click()',
      'wait:1200',
      'eval:Game.Dev.driveYear(45000)',
      'eval:Game.Dev.grantGold(1220000)',
      'eval:JSON.stringify(["bluebell","lavender","rose","peony"].map(id=>Game.unlockSeed(id)))',
      'eval:JSON.stringify([4,5,6,7].map(i=>Game.unlockPlot(i)))',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.Dev.summonAll(2).length',
      'wait:6500',
      'eval:JSON.stringify((()=>{const ids=["daisy","tulip","rose","bluebell","lavender","peony","tulip","daisy"];return ids.map((id,i)=>Game.plant(i,Game.seedById(id)));})())',
      'wait:1500',
      'eval:JSON.stringify((()=>{const f=[0.12,0.5,0.88,1.05,0.3,0.78,0.95,0.2];const t=Date.now()/1000;Game.state.grid.forEach((c,i)=>{if(c.seed)c.plantedAt=t-c.grow*f[i];});return Game.state.grid.map(c=>c.seed?Math.round(Game.progressOf(c)*100):null);})())',
      'wait:400',
    ],
    expect: 'Game.state.grid.filter((c) => c.seed).length === 8',
  },
  {
    slug: 'big-five-dock',
    group: 'The garden',
    title: 'The Big Five dock, in situ',
    line:
      'The five buttons the whole game navigates from — Orders & Quests, Cards, Garden, Turn and Shop — carrying their live counts and dots.',
    doc: '36-hud-and-dock.md',
    file: 'index.html',
    steps: [
      'tap:#flowerBtn',
      'eval:Game.Dev.grantLevels(11)',
      'eval:Game.Dev.driveYear(160000)',
      'eval:Game.Dev.runTurn().turnsCompleted',
      'wait:600',
      'eval:document.querySelector(".s-edge.r").click()',
      'wait:1200',
      'eval:document.querySelector(".s-edge.l").click()',
      'wait:1200',
      'eval:Game.Dev.driveYear(45000)',
      'eval:Game.Dev.grantGold(1220000)',
      'eval:JSON.stringify(["bluebell","lavender","rose","peony"].map(id=>Game.unlockSeed(id)))',
      'eval:JSON.stringify([4,5,6,7].map(i=>Game.unlockPlot(i)))',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.grantPacks(3)',
      'eval:Game.Dev.summonAll(2).length',
      'wait:6500',
      'eval:JSON.stringify((()=>{const ids=["daisy","tulip","rose","bluebell","lavender","peony","tulip","daisy"];return ids.map((id,i)=>Game.plant(i,Game.seedById(id)));})())',
      'wait:1500',
      'eval:JSON.stringify((()=>{const f=[0.12,0.5,0.88,1.05,0.3,0.78,0.95,0.2];const t=Date.now()/1000;Game.state.grid.forEach((c,i)=>{if(c.seed)c.plantedAt=t-c.grow*f[i];});return Game.state.grid.map(c=>c.seed?Math.round(Game.progressOf(c)*100):null);})())',
      'wait:400',
    ],
    expect: 'document.querySelectorAll(\'#dock .dock-btn\').length === 5',
  },
  {
    slug: 'welcome-back',
    group: 'The garden',
    title: 'The welcome-back report',
    line:
      'What a returning player is shown first: what the garden banked while they were away, and what is standing ready.',
    doc: '03-systems.md',
    file: 'ui-sheet.js',
    steps: [
      'tap:#flowerBtn',
      'eval:Game.Dev.grantLevels(11)',
      'eval:Game.Dev.grantGold(400000)',
      'eval:Game.Dev.armRarity("common")',
      'eval:JSON.stringify([Game.plant(0,Game.seedById("daisy")),Game.Dev.ripenAll(),Boolean(Game.harvest(0))])',
      'eval:JSON.stringify(["autoHarvest","plot1Harvester","plot2Harvester","plot3Harvester","plot4Harvester"].map(k=>Game.buyUpgrade(k)))',
      'wait:3500',
      'eval:Game.Dev.armRarity("common")',
      'eval:JSON.stringify((()=>{const r=Game.Dev.simulateAway(9);UI.setAwayReport(r);return r&&{ripened:r.ripened,earned:r.earned,capped:r.capped};})())',
      'eval:UI.openSheet("welcome")',
      'wait:1500',
    ],
    expect: 'UI.sheetMode() === \'welcome\' && document.getElementById(\'sheetBody\').textContent.trim().length > 40',
  },
  {
    slug: 'the-menu',
    group: 'The garden',
    title: 'The menu',
    line:
      'The hamburger opens a drawer off the right edge: your face and your name, then everywhere else. Four rows built, three reserved and drained.',
    doc: '08-ui-and-layout.md',
    file: 'ui-menu.js',
    steps: [
      'eval:JSON.stringify(Game.state.critters.pip=({since:Game.nowSeconds(),fed:0,gifts:0,met:true,level:2,tending:true,fedUntil:0}))',
      'eval:JSON.stringify(Game.state.critters.thistle=({since:Game.nowSeconds(),fed:0,gifts:0,met:true,level:1,tending:true,fedUntil:0}))',
      'eval:JSON.stringify([Game.state.year.number=3,Game.setProfileName("Rosalind"),Game.setProfileAvatar("critter:pip")])',
      /* The dot and the row badge both read pendingAnnouncement(), so this scene
         un-marks the announcement to photograph the state a player actually
         meets. Nothing here puts it back — captureScene() re-marks it before
         every scene, which is what stops this one leaking a modal over the rest
         of the gallery. */
      'eval:JSON.stringify([Game.clearNewsSeen(),UI.updateMenuDot()])',
      'eval:UI.openMenu()',
      'wait:900',
    ],
    expect: 'UI.menuOpen() === true && document.querySelectorAll(\'#menuBody .dr-row\').length === 7'
      + ' && document.querySelector(\'.dr-name b\').textContent === \'Rosalind\''
      + ' && document.getElementById(\'menuDot\').hidden === false',
  },
  {
    slug: 'the-avatar-picker',
    group: 'The garden',
    title: 'Your garden is your face',
    line:
      'Every portrait is drawn by the game from something the player earned — unlocked blooms, then creatures that have moved in. No uploads, no photographs, ever.',
    doc: '03-systems.md',
    file: 'ui-menu.js',
    steps: [
      'eval:JSON.stringify(Game.state.critters.pip=({since:Game.nowSeconds(),fed:0,gifts:0,met:true,level:2,tending:true,fedUntil:0}))',
      'eval:JSON.stringify(Game.state.critters.thistle=({since:Game.nowSeconds(),fed:0,gifts:0,met:true,level:1,tending:true,fedUntil:0}))',
      'eval:JSON.stringify([\'bluebell\',\'lavender\',\'rose\',\'marigold\'].map(id=>Game.state.seedUnlocks[id]=true))',
      'eval:JSON.stringify([Game.setProfileName("Rosalind"),Game.setProfileAvatar("critter:pip")])',
      'eval:UI.openMenu()',
      'wait:600',
      /* .click() rather than tap:, and for a reason worth knowing: a tap is
         delivered at the element's centre, and for the first 340ms the drawer is
         still sliding in from translateX(102%) — so the avatar's centre is off
         the right of the viewport, where events are not delivered. The scene
         failed intermittently on exactly that. `turn-ask` uses .click() for the
         same class of reason; it still drives the real handler. */
      'eval:document.querySelector(\'.avatar\').click()',
      'wait:900',
    ],
    /* Asserted against the data rather than against a count, so a twentieth seed
       moves the picture without breaking the gallery: the flower, every bloom,
       and every creature that has moved in — with exactly the un-unlocked blooms
       drained, and exactly one face worn. */
    expect: 'document.querySelectorAll(\'.pick-cell\').length'
      + ' === 1 + DATA.seeds.length + Object.keys(Game.state.critters).length'
      + ' && document.querySelectorAll(\'.pick-cell.locked\').length'
      + ' === DATA.seeds.filter(function (s) { return !Game.seedUnlocked(s.id); }).length'
      + ' && document.querySelectorAll(\'.pick-cell.on\').length === 1',
  },
  {
    slug: 'whats-new',
    group: 'The garden',
    title: 'The What\'s New announcement',
    line:
      'One announcement, once, on the way in — a piece of owner-supplied art, a few plain lines, and a single button.',
    doc: '08-ui-and-layout.md',
    file: 'ui-news.js',
    steps: [
      'wait:600',
      'eval:UI.previewAnnouncement()',
      'wait:1500',
    ],
    expect: 'UI.newsOpen() === true',
  },
  {
    slug: 'fall-bed',
    group: 'The seasons',
    title: 'Fall — the bed part-filled',
    line:
      'Fall\'s woven trug with five of its eight plots planted at mixed stages, and the chip counting the fill toward the windfall.',
    doc: '32-the-garden-year.md',
    file: 'ui-fall.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 1',
      'eval:Game.Dev.grantGold(500000)',
      'eval:[[0,\'strawberry\'],[2,\'mint\'],[3,\'pumpkin\'],[5,\'wheat\'],[7,\'apple\']].forEach(function(a){Game.fallPlant(a[0],a[1])})',
      'eval:(function(){var g=Game.state.fall.grid;g[0].plantedAt-=g[0].grow+5;g[2].plantedAt-=g[2].grow*0.75;g[3].plantedAt-=g[3].grow*0.62;g[5].plantedAt-=g[5].grow*0.3;Game.processFall(Game.nowSeconds())})()',
      'eval:UI.enterSeason(\'fall\')',
      'wait:1500',
    ],
    expect: 'UI.fallOpen() === true && Game.state.fall.grid.filter((c) => c.seed).length === 5',
  },
  {
    slug: 'fall-armed',
    group: 'The seasons',
    title: 'Fall — the bed armed for the windfall',
    line:
      'Every crop ripe at once, and the trug takes a gold rim: clear the whole bed in one go and the windfall pays a bonus on top.',
    doc: '32-the-garden-year.md',
    file: 'ui-fall.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 1',
      'eval:Game.Dev.grantGold(500000)',
      'eval:[\'strawberry\',\'mint\',\'chamomile\',\'brambleberry\',\'pumpkin\',\'elderflower\',\'apple\',\'wheat\'].forEach(function(p,i){Game.fallPlant(i,p)})',
      'eval:Game.Dev.ripenFall()',
      'eval:UI.enterSeason(\'fall\')',
      'wait:1500',
    ],
    expect: '!!document.querySelector(\'.fl-board.armed\')',
  },
  {
    /* WAS `season-gate-winter`, retired 2026-09-01: slice C made Winter
       reachable, so the only locked season left to photograph is Spring — and
       a gallery that keeps a picture of a gate that no longer locks is a
       gallery telling the Unity team something untrue. */
    slug: 'season-gate-spring',
    group: 'The seasons',
    title: 'A locked season — the Spring gate',
    line:
      'A season you have not reached yet is a hedge with a lock on it, naming the Turn that opens it.',
    doc: '32-the-garden-year.md',
    file: 'ui.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 1',
      'eval:UI.enterSeason(\'spring\')',
      'wait:1200',
    ],
    expect: 'document.getElementById(\'game\').classList.contains(\'in-gate\') && document.querySelector(\'.g-name\').textContent.trim() === \'SPRING\'',
  },
  {
    slug: 'winter-bed',
    group: 'The seasons',
    title: 'Winter — the bed, before the night',
    line:
      'Winter\'s cold frame on frozen earth, with Holly in the middle and the chip naming the one rule: tuck the bed in, and what opens under the quilt pays extra.',
    doc: '46-the-night-shift.md',
    file: 'ui-winter.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 3',
      'eval:Game.Dev.grantGold(500000)',
      'eval:[0,1,2,4,6].forEach(function(i){Game.winterPlant(i,\'snowdrop\')})',
      'eval:(function(){var g=Game.state.winter.grid;g[0].plantedAt-=g[0].grow*0.7;g[2].plantedAt-=g[2].grow*0.4;Game.processWinter(Game.nowSeconds())})()',
      'eval:UI.enterSeason(\'winter\')',
      'wait:1500',
    ],
    expect: 'UI.winterOpen() === true && Game.state.winter.grid.filter((c) => c.seed).length === 5',
  },
  {
    slug: 'winter-tucked',
    group: 'The seasons',
    title: 'Winter — tucked in for the night',
    line:
      'One tap puts quilts over the bed and the plants asleep. Nothing is ever lost to a night: the tuck only adds.',
    doc: '46-the-night-shift.md',
    file: 'ui-winter.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 3',
      'eval:Game.Dev.grantGold(500000)',
      'eval:Game.Dev.fillWinter()',
      'eval:Game.winterTuck()',
      'eval:UI.enterSeason(\'winter\')',
      'wait:1500',
    ],
    expect: 'Game.winterTucked() === true && Game.state.winter.grid.filter((c) => c.seed).length === 8',
  },
  {
    slug: 'winter-morning',
    group: 'The seasons',
    title: 'Winter — the morning, and the snowfall',
    line:
      'Every bloom that opened under the quilt wears a frost rim, and Collect All names what the night is worth.',
    doc: '46-the-night-shift.md',
    file: 'ui-winter.js',
    steps: [
      'wait:600',
      'eval:Game.state.year.turnsCompleted = 3',
      'eval:Game.Dev.grantGold(500000)',
      'eval:Game.Dev.fillWinter()',
      'eval:Game.winterTuck()',
      'eval:Game.Dev.nightWinter()',
      'eval:UI.enterSeason(\'winter\')',
      'wait:1500',
    ],
    expect: 'Game.winterBedValue().kept === 8',
  },
  {
    slug: 'turn-ask',
    group: 'The Turn',
    title: 'The Turn — the ask',
    line:
      'Beat one. The year is over: what turning pays, what it takes away, and what it never touches.',
    doc: '32-the-garden-year.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.driveYear(400000)',
      'eval:[Game.unlockSeed(\'bluebell\'),Game.unlockSeed(\'lavender\')].join(\',\')',
      'eval:[\'tapPower\',\'tapPower\',\'tapPower\',\'critChance\',\'comboMeter\',\'autoWater\'].forEach(Game.buyUpgrade)',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.setYearStats({orders:26,windfalls:0,species:0,legendaries:3,bestCombo:62})',
      'wait:1200',
      'tap:.dock-btn.turn',
      'wait:800',
      'eval:document.querySelector(\'[data-act=openTurn]\').click()',
      'wait:900',
    ],
    expect: 'UI.sheetMode() === \'turn\'',
  },
  {
    slug: 'turn-blessing',
    group: 'The Turn',
    title: 'The Turn — the blessing',
    line:
      'Beat two. One flower is blessed for the year ahead, and the choice is the only thing carried across the reset.',
    doc: '32-the-garden-year.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.driveYear(400000)',
      'eval:[Game.unlockSeed(\'bluebell\'),Game.unlockSeed(\'lavender\')].join(\',\')',
      'eval:[\'tapPower\',\'tapPower\',\'tapPower\',\'critChance\',\'comboMeter\',\'autoWater\'].forEach(Game.buyUpgrade)',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.setYearStats({orders:26,windfalls:0,species:0,legendaries:3,bestCombo:62})',
      'wait:1200',
      'tap:.dock-btn.turn',
      'wait:800',
      'eval:document.querySelector(\'[data-act=openTurn]\').click()',
      'wait:900',
      'eval:document.querySelector(\'[data-act=turnBless]\').click()',
      'wait:700',
      'eval:document.querySelector(\'[data-bless=bluebell]\').click()',
      'wait:500',
    ],
    expect: '!!document.querySelector(\'[data-bless]\')',
  },
  {
    slug: 'turn-tally',
    group: 'The Turn',
    title: 'The Turn — the Tally, mid-roll',
    line:
      'Beat three, caught while it is still counting: the year totted up into the Saved Seeds that survive it.',
    doc: '32-the-garden-year.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.driveYear(400000)',
      'eval:[Game.unlockSeed(\'bluebell\'),Game.unlockSeed(\'lavender\')].join(\',\')',
      'eval:[\'tapPower\',\'tapPower\',\'tapPower\',\'critChance\',\'comboMeter\',\'autoWater\'].forEach(Game.buyUpgrade)',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.setYearStats({orders:26,windfalls:0,species:0,legendaries:3,bestCombo:62})',
      'wait:1200',
      'tap:.dock-btn.turn',
      'wait:800',
      'eval:document.querySelector(\'[data-act=openTurn]\').click()',
      'wait:900',
      'eval:document.querySelector(\'[data-act=turnBless]\').click()',
      'wait:700',
      'eval:document.querySelector(\'[data-bless=bluebell]\').click()',
      'wait:500',
      'eval:document.querySelector(\'[data-act=turnGo]\').click()',
      'wait:200',
    ],
    expect: '/counting/i.test(document.getElementById(\'sheetBody\').textContent)',
  },
  {
    slug: 'turn-spring',
    group: 'The Turn',
    title: 'The Turn — the spring return',
    line:
      'Beat four. The hedges open on a new year, and this first Turn is the one that unlocks Fall.',
    doc: '32-the-garden-year.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.driveYear(400000)',
      'eval:[Game.unlockSeed(\'bluebell\'),Game.unlockSeed(\'lavender\')].join(\',\')',
      'eval:[\'tapPower\',\'tapPower\',\'tapPower\',\'critChance\',\'comboMeter\',\'autoWater\'].forEach(Game.buyUpgrade)',
      'eval:Game.Dev.grantBoosts()',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.setYearStats({orders:26,windfalls:0,species:0,legendaries:3,bestCombo:62})',
      'wait:1200',
      'tap:.dock-btn.turn',
      'wait:800',
      'eval:document.querySelector(\'[data-act=openTurn]\').click()',
      'wait:900',
      'eval:document.querySelector(\'[data-act=turnBless]\').click()',
      'wait:700',
      'eval:document.querySelector(\'[data-bless=bluebell]\').click()',
      'wait:500',
      'eval:document.querySelector(\'[data-act=turnGo]\').click()',
      'wait:4200',
      'eval:document.querySelector(\'[data-act=turnSpring]\').click()',
      'wait:1800',
    ],
    expect: 'Game.state.year.turnsCompleted >= 1',
  },
  {
    slug: 'the-hollow',
    group: 'The other places',
    title: 'The Hollow',
    line:
      'The warm room under the garden where every creature that has moved in actually lives — one of them asleep, which is what makes the upkeep read as cosy rather than as a chore.',
    doc: '22-creatures.md',
    file: 'ui-hollow.js',
    steps: [
      'eval:Game.Dev.grantLevels(15)',
      'wait:3200',
      'eval:Game.Dev.grantGold(60000)',
      'eval:Game.Dev.summonAll(3).length',
      'wait:7000',
      'eval:Game.Dev.warp(4)',
      'eval:Game.state.critters.luna.fedUntil = 0',
      'eval:UI.enterHollow()',
      'wait:2500',
    ],
    expect: 'UI.hollowOpen() === true',
  },
  {
    slug: 'the-wild-meadow',
    group: 'The other places',
    title: 'The Wild Meadow',
    line:
      'The second place: eight cobbled cells holding hives and keepers, worked by the creatures you are not using in the garden.',
    doc: '25-world-map.md',
    file: 'ui-meadow.js',
    steps: [
      'eval:Game.Dev.grantLevels(15)',
      'wait:3200',
      'eval:Game.Dev.grantGold(300000)',
      'eval:Game.Dev.summonAll(3).length',
      'wait:7000',
      'eval:[4,5,6,7].map(i=>Game.unlockCell(i))',
      'eval:[0,2,5,7].map(i=>Game.placeHive(i))',
      'eval:[[1,\'sun\'],[3,\'clover\'],[4,\'foxglove\'],[6,\'stump\']].map(a=>Game.placeTender(a[0],a[1]))',
      'eval:Game.setTending(\'luna\',false)',
      'eval:Game.setTending(\'bumble\',true)',
      'eval:Game.setKeeper(\'bumble\',true)',
      'eval:Game.setKeeper(\'pip\',true)',
      'eval:Game.Dev.warp(0.05)',
      'wait:3500',
      'eval:UI.enterMeadow()',
      'wait:3000',
    ],
    expect: 'UI.meadowOpen() === true',
  },
  {
    slug: 'plant-picker',
    group: 'The panels',
    title: 'The plant picker — a locked unlock price',
    line:
      'Seeds no longer gate on level: past the free two, every flower carries a price, and the picker shows exactly what the next one costs.',
    doc: '33-year-one-economy.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:(()=>{Game.Dev.grantGold(400000);Game.unlockSeed(\'bluebell\');return \'credits \'+Game.state.credits})()',
      'wait:600',
      'eval:UI.openSheet(\'seeds\',0)',
      'wait:1800',
      'eval:(()=>{const b=document.getElementById(\'sheetBody\');b.scrollTop=240;return b.scrollTop})()',
      'wait:700',
    ],
    expect: 'UI.sheetMode() === \'seeds\'',
  },
  {
    slug: 'upgrades',
    group: 'The panels',
    title: 'The Upgrades sheet',
    line:
      'What coins buy inside a year — harder taps, faster growth, automation — with some bought, one affordable and the rest out of reach.',
    doc: '04-economy.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:(()=>{Game.Dev.grantGold(11000);[\'tapPower\',\'tapPower\',\'tapPower\',\'tapPower\',\'holdSpeed\',\'holdSpeed\',\'holdSpeed\',\'critChance\',\'critChance\',\'autoWater\',\'autoWater\',\'autoWater\',\'ladybug\',\'rainDance\',\'rainDance\',\'comboMeter\'].forEach(k=>Game.buyUpgrade(k));return \'credits \'+Game.state.credits})()',
      'wait:1500',
      'eval:UI.openSheet(\'upgrades\')',
      'wait:1800',
      'eval:(()=>[...document.querySelectorAll(\'#sheetBody .card\')].map(c=>c.querySelector(\'.card-title\').textContent+\':\'+(c.classList.contains(\'affordable\')?\'GREEN\':\'grey\')).join(\' | \'))()',
    ],
    expect: 'UI.sheetMode() === \'upgrades\'',
  },
  {
    slug: 'almanac',
    group: 'The panels',
    title: 'The Almanac — petal tracks',
    line:
      'Every flower ever grown, and the permanent petal ladders that Saved Seeds buy — the part of the game that outlives a year.',
    doc: '16-progression-and-quests.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:(()=>{Game.Dev.grantGold(500000);[\'bluebell\',\'lavender\'].forEach(id=>Game.unlockSeed(id));return DATA.seeds.filter(s=>Game.seedUnlocked(s.id)).map(s=>s.id).join(\',\')})()',
      'eval:(()=>{let n=0;const U=DATA.seeds.filter(s=>Game.seedUnlocked(s.id));for(let r=0;r<4;r++){for(let p=0;p<4;p++){const s=U[(r*4+p)%U.length];if(Game.state.grid[p].seed)Game.harvest(p);Game.plant(p,s,false);}Game.Dev.ripenAll();for(let p=0;p<4;p++)if(Game.harvest(p))n++;}return n+\' harvests\'})()',
      'wait:6000',
      'eval:(()=>{Game.Dev.grantSeeds(600);[[\'daisy\',\'rich\',4],[\'daisy\',\'quick\',3],[\'tulip\',\'rich\',3],[\'tulip\',\'quick\',1],[\'bluebell\',\'rich\',2],[\'lavender\',\'rich\',1]].forEach(b=>{for(let i=0;i<b[2];i++)Game.buyPetal(b[0],b[1])});return \'pouch \'+Game.state.savedSeeds})()',
      'wait:800',
      'eval:UI.openSheet(\'bonuses\')',
      'wait:1800',
      'eval:(()=>{const b=document.getElementById(\'sheetBody\');b.scrollTop=300;return b.scrollTop})()',
      'wait:700',
    ],
    expect: 'UI.sheetMode() === \'bonuses\'',
  },
  {
    slug: 'cards-album',
    group: 'The panels',
    title: 'The Cards album',
    line:
      'The parallel meta: twelve sets to fill, deliberately independent of the garden, with a pack waiting to be opened.',
    doc: '19-card-album.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.completeSet();Game.Dev.completeSet();ALBUM.sets.forEach((s,i)=>{const n=[0,0,2,4,1,2,5,3,6,2,1,0][i];s.cards.slice(0,n).forEach(c=>{Game.state.cards[c.id]=1})});Game.save();Game.emit(\'panels\');Game.albumOwned()+\'/\'+Game.albumTotal()',
      'eval:Game.grantPacks(2)',
      'eval:UI.openSheet(\'album\')',
      'wait:900',
    ],
    expect: 'UI.sheetMode() === \'album\'',
  },
  {
    slug: 'cards-set',
    group: 'The panels',
    title: 'The Cards album — one set',
    line:
      'Inside a set: nine cards across five rarity rungs, the owned ones lit and the missing ones still ghosts.',
    doc: '19-card-album.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:[\'smallvisitors_0\',\'smallvisitors_1\',\'smallvisitors_3\',\'smallvisitors_5\',\'smallvisitors_7\'].forEach(id=>{Game.state.cards[id]=1});Game.state.cards.smallvisitors_0=3;Game.save();Game.emit(\'panels\');Game.setOwned(\'smallvisitors\')',
      'eval:UI.openSheet(\'cardset\',\'smallvisitors\')',
      'wait:800',
    ],
    expect: 'UI.sheetMode() === \'cardset\'',
  },
  {
    slug: 'cards-pack',
    group: 'The panels',
    title: 'A pack reveal',
    line:
      'The moment a pack opens. The roll is pinned here so this picture is the same every run; in the game it is not.',
    doc: '19-card-album.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.grantPacks(3)',
      'eval:Game.state.luckyPacks=1',
      'eval:UI.openSheet(\'album\')',
      'wait:400',
      'eval:(()=>{const r=Math.random;let i=0;const q=[0.99,0,0.5,0,0.5,0];Math.random=()=>(i<q.length?q[i++]:r());document.querySelector(\'[data-act=openPack]\').click();Math.random=r;return 1})()',
      'wait:1600',
    ],
    expect: '!!document.querySelector(\'.pack-reveal\')',
  },
  {
    slug: 'the-stand',
    group: 'The panels',
    title: 'The Stand — the orders queue',
    line:
      'The Market: villagers at the counter, each wanting something the garden can grow, shown here at tier 3.',
    doc: '13-order-system.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.grantGold(500000)',
      'eval:Game.Dev.grantLevels(8)',
      'wait:5000',
      'eval:DATA.seeds.slice(2,5).map(s=>Game.unlockSeed(s.id)).join(\',\')',
      'wait:2500',
      'eval:(()=>{const u=DATA.seeds.filter(s=>Game.seedUnlocked(s.id));let n=0;for(let r=0;r<3;r++){Game.state.grid.forEach((c,i)=>{if(!c.locked&&!c.seed)Game.plant(i,u[(i+r)%u.length],false)});Game.Dev.ripenAll();Game.state.grid.forEach((c,i)=>{if(c.seed){Game.harvest(i);n+=1}})}return n})()',
      'wait:4000',
      'eval:Game.state.stand.slots=[null,null,null];Game.state.stand.nextAt=[0,0,0];Game.processStand()',
      'eval:UI.openSheet(\'stand\')',
      'wait:900',
    ],
    expect: 'UI.sheetMode() === \'stand\'',
  },
  {
    slug: 'the-shop',
    group: 'The panels',
    title: 'The Shop',
    line:
      'Where gems go: decor that changes nothing but how the garden looks, and the called skies.',
    doc: '03-systems.md',
    file: 'ui-sheet.js',
    steps: [
      'eval:Game.Dev.grantGold(20000)',
      'eval:Game.state.gems+=400;Game.save();Game.emit(\'currency\');Game.state.gems',
      'eval:Game.Dev.fillGarden()',
      'eval:UI.openSheet(\'shop\')',
      'wait:800',
    ],
    expect: 'UI.sheetMode() === \'shop\'',
  },
  {
    slug: 'weather-rain',
    group: 'The weather',
    title: 'Rain',
    line:
      'The common sky, and the only one that changes the simulation: rain grows things faster and can leave a Dewkissed bloom behind.',
    doc: '41-weather-staging.md',
    weather: null,
    file: 'ui-weather.js',
    steps: [
      'eval:Object.assign(Game.state.seen,{intro:true,plot:true,meadow:true}).intro',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.ripenAll()',
      'eval:Game.state.grid.forEach(c=>{c.mutateAt=0})',
      'wait:1200',
      'eval:Game.Dev.setWeather(\'rain\').id',
      'wait:10000',
      'eval:document.querySelectorAll(\'#speech\').forEach(n=>n.classList.remove(\'show\'))',
    ],
    expect: 'Game.currentWeather().id === \'rain\' && UI.wxHoldsSky() === true',
  },
  {
    slug: 'weather-storm',
    group: 'The weather',
    title: 'Thunderstorm',
    line:
      'Rarer and heavier: a near-navy sky, slanted drops and lightning, with a Gilded bloom as the prize.',
    doc: '41-weather-staging.md',
    weather: null,
    file: 'ui-weather.js',
    steps: [
      'eval:Object.assign(Game.state.seen,{intro:true,plot:true,meadow:true}).intro',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.ripenAll()',
      'eval:Game.state.grid.forEach(c=>{c.mutateAt=0})',
      'wait:1200',
      'eval:Game.Dev.setWeather(\'storm\').id',
      'wait:10000',
      'eval:document.querySelectorAll(\'#speech\').forEach(n=>n.classList.remove(\'show\'))',
    ],
    expect: 'Game.currentWeather().id === \'storm\' && UI.wxHoldsSky() === true',
  },
  {
    slug: 'weather-aurora',
    group: 'The weather',
    title: 'Aurora',
    line:
      'Rare enough to be an event. It bends the light rules and reads as night at any hour, which is how Prismatic blooms happen at noon.',
    doc: '41-weather-staging.md',
    weather: null,
    file: 'ui-weather.js',
    steps: [
      'eval:Object.assign(Game.state.seen,{intro:true,plot:true,meadow:true}).intro',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.ripenAll()',
      'eval:Game.state.grid.forEach(c=>{c.mutateAt=0})',
      'wait:1200',
      'eval:Game.Dev.setWeather(\'aurora\').id',
      'wait:13000',
      'eval:document.querySelectorAll(\'#speech\').forEach(n=>n.classList.remove(\'show\'))',
    ],
    expect: 'Game.currentWeather().id === \'aurora\' && UI.wxHoldsSky() === true',
  },
  {
    slug: 'weather-wonderfall',
    group: 'The weather',
    title: 'Wonderfall',
    line:
      'The rarest sky in the game at one slot in two hundred: gold drizzle over a lifted, saturated world, and a Wonderstruck bloom if you catch one.',
    doc: '41-weather-staging.md',
    weather: null,
    file: 'ui-weather.js',
    steps: [
      'eval:Object.assign(Game.state.seen,{intro:true,plot:true,meadow:true}).intro',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.ripenAll()',
      'eval:Game.state.grid.forEach(c=>{c.mutateAt=0})',
      'wait:1200',
      'eval:Game.Dev.setWeather(\'wonderfall\').id',
      'wait:13000',
      'eval:document.querySelectorAll(\'#speech\').forEach(n=>n.classList.remove(\'show\'))',
      'eval:document.getElementById(\'banner\').classList.remove(\'show\',\'out\')',
    ],
    expect: 'Game.currentWeather().id === \'wonderfall\' && UI.wxHoldsSky() === true',
  },
  {
    slug: 'weather-sunbreak',
    group: 'The weather',
    title: 'The sunbreak',
    line:
      'Not a sky of its own but the reward for sitting through one: rain or a storm ending into daylight puts shafts of sun across the garden.',
    doc: '41-weather-staging.md',
    weather: null,
    file: 'ui-weather.js',
    steps: [
      'eval:Object.assign(Game.state.seen,{intro:true,plot:true,meadow:true}).intro',
      'eval:Game.Dev.fillGarden()',
      'eval:Game.Dev.ripenAll()',
      'eval:Game.state.grid.forEach(c=>{c.mutateAt=0})',
      'wait:1200',
      'eval:Game.Dev.setWeather(\'rain\').id',
      'wait:14000',
      'eval:Game.Dev.setWeather(\'clear\').id',
      'wait:10000',
      'eval:document.querySelectorAll(\'#speech\').forEach(n=>n.classList.remove(\'show\'))',
    ],
    expect: 'document.getElementById(\'game\').dataset.sunbreak === \'1\'',
  },];

// ---------------------------------------------------------------- the gallery page

/* The images are referenced by their ABSOLUTE live URL rather than a relative path.
   The page has to work in three places at once — in the repo, on the wiki (which
   mirrors docs/*.md but not docs/screens/, so a relative path there resolves to
   nothing), and in whatever a Unity engineer forwards it into. One absolute URL
   works in all three; a relative one works in exactly one. */
const LIVE = 'https://deep-forest-labs.github.io/GardenofWonder/docs/screens';

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Write docs/44-screens.md from the same SCENES table that drove the captures, so
 * the page and the pictures cannot disagree about what a screen is. Full runs only —
 * regenerating one screen must not rewrite the page down to one section.
 */
function writeGalleryDoc() {
  const out = [];
  out.push('# The screens');
  out.push('');
  out.push(`Every key screen of the live build, at true phone size. **Captured ${today()}** from the`);
  out.push('build as it stood; regenerate the whole gallery with:');
  out.push('');
  out.push('```bash');
  out.push('node tools/capture-screens.js');
  out.push('```');
  out.push('');
  out.push('That drives the real game headlessly through every state below and rewrites both the images');
  out.push('and this page. Nothing here is hand-made, and nothing here should be hand-edited — the next');
  out.push('run silently overwrites it. If a screen looks wrong, the game changed: run the command.');
  out.push('');
  out.push(`Shot at ${SIZE.width}x${SIZE.height} at ${SCALE}x, the phone this game is designed for. Each screen is`);
  out.push('**driven into its state first and photographed second**, and the run asserts that state before');
  out.push('the shutter fires — a screen photographed in the wrong state looks perfectly plausible, and is');
  out.push('the one failure this gallery exists to prevent.');
  out.push('');
  out.push('Images are linked by absolute URL, so this page renders identically in the repo, on the wiki,');
  out.push('and for anyone you forward it to.');
  out.push('');
  out.push('---');
  out.push('');

  let group = null;
  for (const scene of SCENES) {
    if (scene.group !== group) {
      group = scene.group;
      out.push(`## ${group}`);
      out.push('');
    }
    out.push(`### ${scene.title}`);
    out.push('');
    out.push(`[![${scene.title}](${LIVE}/${scene.slug}.png)](${LIVE}/${scene.slug}.png)`);
    out.push('');
    out.push(scene.line);
    out.push('');
    out.push(`Owned by [${scene.doc}](${scene.doc}) · drawn by [${scene.file}](../${scene.file})`);
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push(`_${SCENES.length} screens. The scene table that produced them — what each one drives, and what it`);
  out.push('asserts before capturing — is the top of [`tools/capture-screens.js`](../tools/capture-screens.js).');
  out.push('Add a screen there and it appears here on the next run._');
  out.push('');

  fs.writeFileSync(path.join(ROOT, 'docs', '44-screens.md'), out.join('\n'));
}

// ---------------------------------------------------------------- the run

/**
 * The gallery page links every screen to the doc and the source file that own it,
 * and those links are written from this table rather than by hand — so a typo here
 * ships as a dead link on the wiki, where wiki-sync's own link check would catch the
 * doc half and nothing would catch the file half. Cheaper to fail before Chrome starts.
 */
function validateScenes() {
  const problems = [];
  const seen = new Set();
  for (const s of SCENES) {
    if (seen.has(s.slug)) problems.push(`duplicate slug "${s.slug}" — the second would overwrite the first`);
    seen.add(s.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) problems.push(`slug "${s.slug}" is not lowercase-kebab (GitHub Pages is case-sensitive)`);
    if (!fs.existsSync(path.join(ROOT, 'docs', s.doc))) problems.push(`${s.slug}: docs/${s.doc} does not exist`);
    if (!fs.existsSync(path.join(ROOT, s.file))) problems.push(`${s.slug}: ${s.file} does not exist`);
    if (!s.line || !s.title || !s.group) problems.push(`${s.slug}: missing title, line or group`);
  }
  if (problems.length) {
    console.error(`\ncapture-screens — the scene table is wrong, nothing captured:\n`);
    for (const p of problems) console.error(`  ! ${p}`);
    console.error('');
    return false;
  }
  return true;
}

async function main() {
  const argv = process.argv.slice(2);
  const listOnly = argv.includes('--list');
  const wanted = argv.filter((a) => !a.startsWith('--'));

  if (!validateScenes()) return 2;

  const unknown = wanted.filter((w) => !SCENES.some((s) => s.slug === w));
  if (unknown.length) {
    console.error(`\nNo such screen: ${unknown.join(', ')}`);
    console.error(`Run with --list to see the ${SCENES.length} screens this tool captures.\n`);
    process.exit(2);
  }
  const scenes = wanted.length ? SCENES.filter((s) => wanted.includes(s.slug)) : SCENES;

  if (listOnly) {
    console.log(`\n${SCENES.length} screens:\n`);
    for (const s of SCENES) console.log(`  ${s.slug.padEnd(26)} ${s.title}`);
    console.log('');
    return 0;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;

  const userDataDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'capture-screens-'));
  const chrome = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=0',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-dev-shm-usage',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ]);

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not report a debugging endpoint')), 20000);
    chrome.stderr.on('data', (chunk) => {
      buf += chunk;
      const m = /ws:\/\/[^\s]+/.exec(buf);
      if (m) { clearTimeout(timer); resolve(m[0]); }
    });
  });

  const cdp = await CDP.connect(wsUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  /* probe.js's caveat applies here too: this listens for thrown exceptions and
     console.error only, so every console.warn in the game is invisible — including
     "Save load failed", the one that matters most. A clean report means no errors,
     not no problems. */
  const problems = [];
  cdp.on('Runtime.exceptionThrown', (p) => {
    problems.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text);
  });
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type !== 'error') return;
    problems.push(p.args.map((a) => a.value ?? a.description ?? '?').join(' '));
  });

  const call = (method, params) => cdp.send(method, params, sessionId);
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width: SIZE.width,
    height: SIZE.height,
    deviceScaleFactor: SCALE,
    mobile: true,
    screenWidth: SIZE.width,
    screenHeight: SIZE.height,
  });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const ctx = {
    call,
    async goto(rel) {
      const loaded = cdp.once('Page.loadEventFired');
      await call('Page.navigate', { url: `${origin}/${rel}` });
      await loaded;
      await sleep(900);   // the game boots on load and settles over a frame or two
    },
    async centreOf(selector) {
      const { result } = await call('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        })()`,
        returnByValue: true,
      });
      return result.value;
    },
  };

  /* A first boot puts the What's New announcement over the whole screen, and it
     would otherwise be in front of every screenshot in the gallery. Mark every
     announcement read once, here, then reload into a game with nothing in front
     of it. The seen-flag lives outside the save on purpose, so Game.reset()
     between scenes cannot undo this. The announcement still gets its own
     screenshot — through UI.previewAnnouncement(), which shows it without
     marking or resetting anything. */
  await ctx.goto('index.html');
  await call('Runtime.evaluate', {
    expression: '(DATA.announcements || []).forEach((a) => Game.markNewsSeen(a.id))',
    returnByValue: true,
  });

  console.log(`\ncapture-screens — ${scenes.length} screen${scenes.length === 1 ? '' : 's'} at ${SIZE.width}x${SIZE.height} @${SCALE}x\n`);

  const results = [];
  for (const scene of scenes) {
    process.stdout.write(`  ${scene.slug.padEnd(26)}`);
    try {
      const shot = await captureScene(ctx, scene);
      const { png, colours, lossless } = quantise(shot);
      const file = path.join(OUT, `${scene.slug}.png`);
      fs.writeFileSync(file, png);
      const kb = png.length / 1024;
      const over = png.length > BUDGET;
      results.push({ scene, bytes: png.length, over, ok: true });
      console.log(
        `${kb.toFixed(0).padStart(4)}KB  ${String(colours).padStart(3)} colours` +
        `${lossless ? '  (lossless)' : ''}${over ? '   OVER BUDGET' : ''}`
      );
    } catch (err) {
      results.push({ scene, ok: false, error: err.message });
      console.log(`FAILED — ${err.message}`);
    }
  }

  cdp.ws.close();
  chrome.kill();
  server.close();
  /* Chrome is still flushing its profile as it goes down, so this races it and the
     race is not worth waiting on — it is a temp directory either way. */
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* the OS will get it */ }

  const failed = results.filter((r) => !r.ok);

  /* Full runs only. Regenerating one screen must not rewrite the page down to one
     section — and a partial run is exactly when someone is iterating on a recipe. */
  if (!wanted.length && !failed.length) {
    writeGalleryDoc();
    console.log('  docs/44-screens.md rewritten from the scene table');
  } else if (!wanted.length) {
    console.log('  docs/44-screens.md NOT rewritten — a screen failed, so the page would be wrong');
  }

  const over = results.filter((r) => r.ok && r.over);
  const total = results.filter((r) => r.ok).reduce((a, r) => a + r.bytes, 0);

  console.log(`\n  ${results.length - failed.length}/${results.length} captured, ${(total / 1024 / 1024).toFixed(2)}MB total, in ${path.relative(ROOT, OUT)}/`);

  if (failed.length) {
    console.log(`\n${failed.length} screen(s) failed:`);
    for (const f of failed) console.log(`  ! ${f.scene.slug}: ${f.error}`);
  }
  if (over.length) {
    console.log(`\n${over.length} screen(s) over the ${(BUDGET / 1024).toFixed(0)}KB budget even at ${PALETTE_LADDER[PALETTE_LADDER.length - 1]} colours:`);
    for (const o of over) console.log(`  ! ${o.scene.slug}: ${(o.bytes / 1024).toFixed(0)}KB`);
  }
  if (problems.length) {
    console.log(`\n${problems.length} console error(s) — a screenshot taken over a thrown error is not to be trusted:`);
    for (const p of problems.slice(0, 10)) console.log(`  ! ${p}`);
  } else {
    console.log('  no console errors');
  }
  console.log('');

  return failed.length || over.length || problems.length ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(`\ncapture-screens failed: ${err.message}\n`);
  process.exit(2);
});
