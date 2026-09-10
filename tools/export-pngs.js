#!/usr/bin/env node
//
// export-pngs.js — rasterise the SVG exports, for a consumer that cannot read SVG.
//
//   node tools/export-pngs.js               write art/exports/png/** (gitignored)
//   node tools/export-pngs.js --out DIR     write there instead
//   node tools/export-pngs.js --min-edge N  raise the long-edge floor (default 96)
//   node tools/export-pngs.js --check       every SVG has a PNG beside it; write nothing
//
// WHY THIS EXISTS AT ALL. The Unity port cannot use these files as they stand.
// Unity ships no SVG importer by default, and the one that exists tessellates at
// runtime and resists atlasing — which is the wrong trade for a game whose UI
// budget was won back by pooling and batching. So it wants sprites.
//
// WHY A BROWSER DOES IT, AND NOT A CONVERTER. The stage exports lean on CSS
// custom properties on purpose — `var(--sg)`, `var(--bloom)`, `var(--unfurl)` and
// a `<style>` block, the growth-staging rules read out of style.css — and the
// character exports select their state the same way. A converter that does not
// implement CSS renders those files stateless, and does it QUIETLY: ImageMagick
// delegates SVG to rsvg-convert and, when that is not installed, falls back to
// its own renderer and writes a confidently wrong file. There is no exit code to
// catch. The only engine guaranteed to agree with the game is the engine the game
// runs in, so this drives the same headless Chrome tools/capture-screens.js does.
//
// WHY THE OUTPUT IS GITIGNORED. docs/09-conventions.md: no binary assets in the
// game, and the three exceptions are enumerated. These are not assets this game
// ships — they are build output for another repo, generated on demand. Adding a
// fourth exception for 163 PNGs would be a convention change, and it buys
// nothing: the consumer commits them where binaries belong, which is why --out
// exists. `art/exports/**` stays text, and stays a mirror.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const EXPORTS = path.join(ROOT, 'art', 'exports');
const DEFAULT_OUT = path.join(EXPORTS, 'png');

/* Every family under art/exports/ that holds finished art. `samples` rides along
   because the hedge lives there and nowhere else. */
const FAMILIES = ['icons', 'stages', 'characters', 'samples'];

/* Everything is drawn at 3x, the density a phone layout is authored against.
   That is right for a plant on a 100x120 viewBox, and wrong for an icon on a
   24-unit one: a flat 3x lands a glyph at 72px, under the size a dock actually
   draws it, and upscaling a sprite is the one artefact atlasing cannot hide.
   So the rule is 3x, raised to the next whole multiple that clears a floor on
   the long side.

   The floor is the consumer's call, not ours — it depends on their reference
   resolution and how large they draw things. Ghostgarden's Unity canvas is
   authored at 1080 wide with icon slots up to 100 units, so it asks for 192 and
   gets icons at 8x while plants stay at 3x. The default suits a smaller layout. */
const MIN_SCALE = 3;
const DEFAULT_MIN_LONG_EDGE = 96;

function scaleFor(w, h, minLongEdge) {
  let k = MIN_SCALE;
  while (Math.max(w, h) * k < minLongEdge) k += 1;
  return k;
}

/**
 * The viewBox is the only size an exported file is guaranteed to carry — the
 * icons also have width/height, the stage and character files do not. Its origin
 * can be negative (the customer busts start at y=-18 to leave room for hat
 * brims), which the wrapper has to respect or every portrait crops at the hair.
 */
function boxOf(svg, name) {
  const m = /viewBox="([^"]+)"/.exec(svg);
  if (!m) throw new Error(`${name}: no viewBox — nothing says how big this is`);
  const parts = m[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`${name}: viewBox "${m[1]}" is not four numbers`);
  }
  const [, , w, h] = parts;
  if (!(w > 0 && h > 0)) throw new Error(`${name}: viewBox has no area`);
  return { w, h };
}

/*
 * One document per file, sized to the exact output. Width and height are forced
 * onto the <svg> in CSS rather than trusted from its attributes, so the icons'
 * intrinsic 24px does not win over the scale asked for here.
 *
 * `background: transparent` is not enough on its own — Chrome composites a white
 * page underneath unless the default background is overridden, which the caller
 * does once per session.
 */
function page(svg, width, height) {
  return `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:transparent}
  body{width:${width}px;height:${height}px;overflow:hidden}
  svg{display:block;width:${width}px;height:${height}px}
</style>
${svg}`;
}

// ---------------------------------------------------------------- the browser

/* Same search tools/capture-screens.js uses, and the same escape hatch. */
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

/* The DevTools client, same shape as capture-screens.js's — Node's built-in
   WebSocket, request ids in a map, events fanned out to listeners. Kept local
   rather than shared: these two tools are the only callers, and a tools/lib for
   two files buys less than it costs. */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === undefined) return;
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(msg.error.message));
      else entry.resolve(msg.result);
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
}

/* Chrome will not honour Page.setDocumentContent on about:blank in every build,
   and a file:// document cannot be reached from a page served over http. One
   throwaway origin serving a blank page sidesteps both, and costs nothing. */
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
      res.end('<!doctype html><title>export-pngs</title>');
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// ---------------------------------------------------------------- the work

function discover() {
  const jobs = [];
  for (const family of FAMILIES) {
    const dir = path.join(EXPORTS, family);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) {
      jobs.push({ family, name: file.slice(0, -4), src: path.join(dir, file) });
    }
  }
  return jobs;
}

async function rasterise(jobs, outRoot, minLongEdge) {
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-pngs-'));
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

  const written = [];
  const problems = [];
  let cdp;
  try {
    cdp = await CDP.connect(wsUrl);
    const { targetId } = await cdp.send('Target.createTarget', { url: origin });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    /* Alpha 0. Without this every sprite ships with a white card behind it. */
    await cdp.send('Emulation.setDefaultBackgroundColorOverride',
      { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId);
    const { frameTree } = await cdp.send('Page.getFrameTree', {}, sessionId);
    const frameId = frameTree.frame.id;

    for (const job of jobs) {
      const svg = fs.readFileSync(job.src, 'utf8');
      let box;
      try {
        box = boxOf(svg, job.name);
      } catch (err) {
        problems.push(err.message);
        continue;
      }
      const scale = scaleFor(box.w, box.h, minLongEdge);
      const width = Math.round(box.w * scale);
      const height = Math.round(box.h * scale);

      await cdp.send('Emulation.setDeviceMetricsOverride',
        { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
      await cdp.send('Page.setDocumentContent', { frameId, html: page(svg, width, height) }, sessionId);

      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      }, sessionId);

      const buf = Buffer.from(shot.data, 'base64');
      /* An 8-byte signature is a cheap way to catch a screenshot that came back
         as something other than a PNG, which is what a failed override looks
         like. A fully transparent image is the OTHER failure — art that painted
         nothing — and it is worth catching here rather than in Unity. */
      if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) {
        problems.push(`${job.name}: Chrome returned something that is not a PNG`);
        continue;
      }
      const dir = path.join(outRoot, job.family);
      fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, `${job.name}.png`);
      fs.writeFileSync(dest, buf);
      written.push({ ...job, dest, width, height, scale, bytes: buf.length });
    }
  } finally {
    if (cdp) try { cdp.ws.close(); } catch { /* closing a dead socket is not a failure */ }
    /* Wait for the process to actually go before clearing its profile. kill() only
       posts the signal, and Chrome writes on the way out — removing the directory
       underneath it raced to ENOTEMPTY often enough to fail a whole run after
       every sprite had already been written. */
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill();
    await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
    server.close();
    /* And a profile left in the system temp directory is litter, not a failure —
       the sprites are on disk by now, and reporting this as the run's outcome
       would bury the result that matters. */
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* left for the OS to sweep */
    }
  }

  return { written, problems };
}

// ---------------------------------------------------------------- entry

/* Paths inside the repo read better relative; --out usually points somewhere else
   entirely, and "../../../tmp/sprites" is a worse answer than the real path. */
function show(p) {
  const rel = path.relative(ROOT, p);
  return rel && !rel.startsWith('..') ? rel : p;
}

/* The long-edge floor a consumer needs depends on its reference resolution, so
   it is an argument rather than a constant. Ghostgarden passes 192. */
function argMinEdge(argv) {
  const i = argv.indexOf('--min-edge');
  if (i === -1) return DEFAULT_MIN_LONG_EDGE;
  const n = Number(argv[i + 1]);
  if (!Number.isInteger(n) || n < 1) throw new Error('--min-edge needs a positive whole number');
  return n;
}

function argOut(argv) {
  const i = argv.indexOf('--out');
  if (i === -1) return DEFAULT_OUT;
  const dir = argv[i + 1];
  if (!dir || dir.startsWith('--')) throw new Error('--out needs a directory');
  return path.resolve(dir);
}

async function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes('--check');
  const outRoot = argOut(argv);
  const minLongEdge = argMinEdge(argv);

  const jobs = discover();
  if (!jobs.length) {
    console.error('\nexport-pngs — no SVGs under art/exports/. Run: node tools/export-icons.js\n');
    return 1;
  }

  if (check) {
    /* Presence, not bytes. Two Chrome builds do not agree byte-for-byte on the
       same page, so a content compare would fail on an upgrade and teach
       everyone to ignore it. What can go stale in a way that matters is a file
       with no sprite beside it, or a sprite whose SVG has been renamed away. */
    const missing = [];
    for (const job of jobs) {
      if (!fs.existsSync(path.join(outRoot, job.family, `${job.name}.png`))) missing.push(job);
    }
    const known = new Set(jobs.map((j) => `${j.family}/${j.name}`));
    const orphans = [];
    for (const family of FAMILIES) {
      const dir = path.join(outRoot, family);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) {
        if (!known.has(`${family}/${f.slice(0, -4)}`)) orphans.push(`${family}/${f}`);
      }
    }
    if (missing.length || orphans.length) {
      console.error(`\nexport-pngs --check — ${show(outRoot)}/ does not match art/exports/:\n`);
      for (const m of missing) console.error(`  missing  ${m.family}/${m.name}.png`);
      for (const o of orphans) console.error(`  orphan   ${o}  (no such SVG)`);
      console.error(`\nRun: node tools/export-pngs.js\n`);
      return 1;
    }
    console.log(`\nexport-pngs --check — all ${jobs.length} SVGs have a sprite\n`);
    return 0;
  }

  const { written, problems } = await rasterise(jobs, outRoot, minLongEdge);

  if (problems.length) {
    console.error(`\nexport-pngs — ${problems.length} problem(s):\n`);
    for (const p of problems) console.error(`  ! ${p}`);
    console.error('');
    return 1;
  }

  /* The assertion, same shape as export-icons.js's: every SVG got a sprite. A
     family that silently exported nothing is the failure this catches. */
  if (written.length !== jobs.length) {
    console.error(
      `\nexport-pngs — ${jobs.length} SVGs but ${written.length} sprites written.\n` +
      `  A missing sprite is art missing from the Unity build, silently.\n`
    );
    return 1;
  }

  const bytes = written.reduce((a, f) => a + f.bytes, 0);
  console.log(`\nexport-pngs — ${written.length} sprites, ${(bytes / 1024 / 1024).toFixed(1)}MB, in ${show(outRoot)}/`);
  for (const family of FAMILIES) {
    const group = written.filter((w) => w.family === family);
    if (!group.length) continue;
    const scales = [...new Set(group.map((g) => `${g.scale}x`))].sort().join(' / ');
    const sizes = [...new Set(group.map((g) => `${g.width}x${g.height}`))].sort();
    console.log(
      `  ${String(group.length).padStart(3)} ${family.padEnd(11)} ${scales}` +
      `  ${sizes.length > 3 ? `${sizes.length} sizes` : sizes.join(', ')}`
    );
  }
  console.log(`  SVG count and sprite count agree at ${jobs.length}`);
  console.log('');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`\nexport-pngs failed: ${err.message}\n`);
    process.exit(2);
  }
);
