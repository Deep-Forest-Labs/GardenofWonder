#!/usr/bin/env node
//
// probe.js — drive Garden Wonder in a headless browser and take screenshots.
//
// Written for remote sessions (see docs/24-remote-sessions.md), where nobody can
// open the game and look at it. Serves the repo, opens it at phone size, runs a
// short script of taps and waits, writes PNGs, and reports console errors.
//
// No dependencies, in keeping with the rest of the project. It talks to Chrome
// over the DevTools Protocol using the WebSocket client built into Node 22.
//
// Usage:
//   node tools/probe.js [steps...]
//
// Steps run in order. Anything unrecognised is an error rather than a no-op,
// so a typo fails loudly instead of quietly skipping a tap.
//
//   shot:NAME          screenshot to .probe/NAME.png
//   tap:SELECTOR       tap the first match, as a real touch event
//   tap:SELECTOR*25    tap it 25 times, ~40ms apart
//   wait:MS            wait, letting timers and animations run
//   eval:EXPR          evaluate EXPR and print the result
//   size:WxH           re-emulate at a new viewport (default 390x844)
//   page:PATH          navigate elsewhere in the repo (default index.html)
//
// Examples:
//   node tools/probe.js shot:boot
//   node tools/probe.js 'tap:.flower*30' wait:600 shot:combo 'eval:UI.state.coins'
//   node tools/probe.js size:430x932 shot:large
//
// Exits non-zero if the page threw an uncaught error, so it is usable in a
// check-before-you-commit loop.

const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.probe');
const DEFAULT_SIZE = { width: 390, height: 844 };

// Chrome lives in a different place on every machine. Check the ones we know
// about, and let CHROME override when it is somewhere else entirely.
function findChrome() {
  const candidates = [
    process.env.CHROME,
    ...expandGlob('/opt/pw-browsers/chromium-*/chrome-linux/chrome'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(
    'No Chrome found. Set CHROME to a Chrome or Chromium binary and try again.'
  );
}

function expandGlob(pattern) {
  const star = pattern.indexOf('*');
  if (star === -1) return [pattern];
  const dir = pattern.slice(0, pattern.lastIndexOf('/', star));
  const rest = pattern.slice(pattern.indexOf('/', star) + 1);
  const prefix = pattern.slice(dir.length + 1, star);
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => n.startsWith(prefix))
    .map((n) => path.join(dir, n, rest));
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
      // Never serve outside the repo, however creative the request is.
      if (!file.startsWith(ROOT)) {
        res.writeHead(403).end();
        return;
      }
      fs.readFile(file, (err, body) => {
        if (err) {
          res.writeHead(404).end();
          return;
        }
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

// A very small DevTools Protocol client. Commands are promises keyed by id;
// events go to listeners registered by name.
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
      if (handlers) for (const h of handlers) h(msg.params, msg.sessionId);
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error(`cannot reach ${url}`)), {
        once: true,
      });
    });
    return new CDP(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject })
    );
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

function parseSteps(argv) {
  const steps = [];
  for (const arg of argv) {
    const sep = arg.indexOf(':');
    if (sep === -1) throw new Error(`step "${arg}" is missing its ":"`);
    const kind = arg.slice(0, sep);
    const rest = arg.slice(sep + 1);
    switch (kind) {
      case 'shot':
        steps.push({ kind, name: rest });
        break;
      case 'wait':
        steps.push({ kind, ms: Number(rest) });
        break;
      case 'eval':
        steps.push({ kind, expr: rest });
        break;
      case 'page':
        steps.push({ kind, path: rest });
        break;
      case 'size': {
        const m = /^(\d+)x(\d+)$/.exec(rest);
        if (!m) throw new Error(`size step wants WxH, got "${rest}"`);
        steps.push({ kind, width: +m[1], height: +m[2] });
        break;
      }
      case 'tap': {
        const m = /^(.*?)(?:\*(\d+))?$/.exec(rest);
        steps.push({ kind, selector: m[1], times: m[2] ? +m[2] : 1 });
        break;
      }
      default:
        throw new Error(`unknown step "${kind}" in "${arg}"`);
    }
  }
  return steps;
}

async function main() {
  const steps = parseSteps(process.argv.slice(2));
  if (!steps.some((s) => s.kind === 'shot')) steps.push({ kind: 'shot', name: 'probe' });

  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;

  const chrome = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=0',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-dev-shm-usage',
    '--user-data-dir=' + fs.mkdtempSync('/tmp/probe-'),
    'about:blank',
  ]);

  // Chrome prints its debugging endpoint to stderr, mixed in with noise.
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(
      () => reject(new Error('Chrome did not report a debugging endpoint')),
      20000
    );
    chrome.stderr.on('data', (chunk) => {
      buf += chunk;
      const m = /ws:\/\/[^\s]+/.exec(buf);
      if (m) {
        clearTimeout(timer);
        resolve(m[0]);
      }
    });
  });

  const cdp = await CDP.connect(wsUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });

  const problems = [];
  cdp.on('Runtime.exceptionThrown', (p) => {
    const d = p.exceptionDetails;
    problems.push(d.exception?.description || d.text);
  });
  cdp.on('Runtime.consoleAPICalled', (p) => {
    if (p.type !== 'error') return;
    problems.push(p.args.map((a) => a.value ?? a.description ?? '?').join(' '));
  });

  const call = (method, params) => cdp.send(method, params, sessionId);

  await call('Page.enable');
  await call('Runtime.enable');

  let size = { ...DEFAULT_SIZE };
  const emulate = () =>
    call('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: size.width,
      screenHeight: size.height,
    });
  await emulate();
  await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const goto = async (rel) => {
    const loaded = cdp.once('Page.loadEventFired');
    await call('Page.navigate', { url: `${origin}/${rel}` });
    await loaded;
    // The game boots on load and settles over a frame or two.
    await new Promise((r) => setTimeout(r, 800));
  };
  await goto('index.html');

  const shots = [];
  for (const step of steps) {
    switch (step.kind) {
      case 'page':
        await goto(step.path);
        break;

      case 'size':
        size = { width: step.width, height: step.height };
        await emulate();
        break;

      case 'wait':
        await new Promise((r) => setTimeout(r, step.ms));
        break;

      case 'eval': {
        const { result, exceptionDetails } = await call('Runtime.evaluate', {
          expression: step.expr,
          returnByValue: true,
          awaitPromise: true,
        });
        if (exceptionDetails) {
          console.log(`  eval ${step.expr} -> threw: ${exceptionDetails.text}`);
        } else {
          console.log(`  eval ${step.expr} -> ${JSON.stringify(result.value)}`);
        }
        break;
      }

      case 'tap': {
        // Find the element once, then tap its centre repeatedly. Touch events
        // rather than synthetic clicks, because the game listens for touch.
        const { result } = await call('Runtime.evaluate', {
          expression: `(() => {
            const el = document.querySelector(${JSON.stringify(step.selector)});
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          })()`,
          returnByValue: true,
        });
        if (!result.value) {
          throw new Error(`tap: nothing matches "${step.selector}"`);
        }
        const { x, y } = result.value;
        for (let i = 0; i < step.times; i++) {
          const point = [{ x, y, radiusX: 8, radiusY: 8, force: 1 }];
          await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point });
          await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await new Promise((r) => setTimeout(r, 40));
        }
        console.log(`  tap ${step.selector} x${step.times}`);
        break;
      }

      case 'shot': {
        const { data } = await call('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        const file = path.join(OUT, `${step.name}.png`);
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        shots.push(file);
        console.log(`  shot ${path.relative(ROOT, file)}`);
        break;
      }
    }
  }

  cdp.ws.close();
  chrome.kill();
  server.close();

  if (problems.length) {
    console.log(`\n${problems.length} console error(s):`);
    for (const p of problems.slice(0, 10)) console.log(`  ! ${p}`);
  } else {
    console.log('\nno console errors');
  }
  console.log(`${shots.length} screenshot(s) in .probe/`);

  process.exit(problems.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`probe failed: ${err.message}`);
  process.exit(2);
});
