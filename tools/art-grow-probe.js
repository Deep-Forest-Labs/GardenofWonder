#!/usr/bin/env node
/* Reproduce art plant grow resets — plant plots, tap flower, log video time jumps. */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.mp4': 'video/mp4',
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

async function main() {
  const server = await serve();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.evaluate(() => {
    const ok = document.querySelector('#newsOk');
    if (ok) ok.click();
  });
  await page.waitForTimeout(600);

  await page.waitForTimeout(300);

  await page.evaluate(() => {
    window.__growResets = [];
    window.__growSamples = [];
    window.__syncLog = [];
    window.__setArtLog = [];
    window.__lastT = new WeakMap();
    window.__lastGrid = null;
    window.__slotGens = new WeakMap();

    const _sync = UI.syncArtPlant;
    UI.syncArtPlant = function (slot, cell, state) {
      const mode = state === 'ready' ? 'ready' : 'grow';
      window.__syncLog.push({
        at: performance.now(),
        mode,
        seed: cell && cell.seed,
        plantedAt: cell && cell.plantedAt,
        grow: cell && cell.grow,
        ready: cell && cell.ready,
        slotEmpty: !slot || !slot.querySelector('.art-plant-grow'),
      });
      return _sync.call(this, slot, cell, state);
    };

    window.__growIv = setInterval(() => {
      document.querySelectorAll('.plot .plant-slot').forEach((slot) => {
        const gen = (window.__slotGens.get(slot) || 0) + (slot.querySelector('.art-plant-grow') ? 0 : 1);
        if (slot.querySelector('.art-plant-grow') && !window.__slotGens.has(slot)) {
          window.__slotGens.set(slot, 1);
        }
      });
      document.querySelectorAll('.art-plant-src').forEach((v, i) => {
        const t = v.currentTime;
        const prev = window.__lastT.get(v);
        if (prev !== undefined && prev > 1 && t < 0.2) {
          window.__growResets.push({
            kind: 'time-jump-back', at: performance.now(), plot: i, from: prev, to: t,
            loop: v.loop, paused: v.paused, ended: v.ended,
          });
        }
        window.__lastT.set(v, t);
        const canvas = v.parentElement && v.parentElement.querySelector('.art-plant-layer');
        let px = null;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const d = ctx.getImageData(canvas.width >> 1, (canvas.height * 0.7) | 0, 1, 1).data;
            px = `${d[0]},${d[1]},${d[2]},${d[3]}`;
          }
        }
        window.__growSamples.push({ at: performance.now(), plot: i, t, loop: v.loop, px });
      });
    }, 50);
  });

  await page.evaluate(() => {
    Game.Dev.grantGold(500000);
    Game.Dev.grantLevels(30);
    Game.state.upgrades.autoHarvest = 0;
    const now = Date.now() / 1000;
    const daisy = Game.seedById('daisy');
    [0, 1, 2, 3, 5, 6, 7].forEach((idx) => {
      const c = Game.state.grid[idx];
      if (c.locked) c.locked = false;
      if (!c.seed) Game.plant(idx, daisy, false);
      const cell = Game.state.grid[idx];
      cell.grow = 120;
      cell.plantedAt = now;
      cell.ready = false;
    });
  });
  await page.waitForTimeout(200);

  const flower = page.locator('#flowerBtn');
  for (let i = 0; i < 120; i += 1) {
    await flower.tap({ force: true });
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(400);

  const report = await page.evaluate(() => {
    clearInterval(window.__growIv);
    const videos = [...document.querySelectorAll('.art-plant-src')].map((v, i) => ({
      plot: i,
      currentTime: v.currentTime,
      duration: v.duration,
      loop: v.loop,
      paused: v.paused,
      ended: v.ended,
      artSrc: v.dataset.artSrc || '',
    }));
    const domRebuilds = window.__growResets.filter((r) => r.kind === 'grid-change').length;
    const jumps = window.__growResets.filter((r) => r.kind === 'time-jump-back');
    const sampleCount = window.__growSamples.length;
    const reloads = window.__syncLog.filter((e, i, a) => {
      if (i === 0) return true;
      const p = a[i - 1];
      return e.mode !== p.mode || e.seed !== p.seed || e.plantedAt !== p.plantedAt;
    });
    const plot0 = window.__growSamples.filter((s) => s.plot === 0);
    const pxJumps = [];
    for (let i = 1; i < plot0.length; i += 1) {
      const a = plot0[i - 1]; const b = plot0[i];
      if (a.t > 1 && b.t < 0.3 && b.t + 0.5 < a.t) {
        pxJumps.push({ fromT: a.t, toT: b.t, fromPx: a.px, toPx: b.px, at: b.at });
      }
    }
    return {
      videos,
      jumpCount: jumps.length,
      jumps: jumps.slice(0, 30),
      pxJumps: pxJumps.slice(0, 20),
      syncCalls: window.__syncLog.length,
      syncReloads: reloads.length,
      syncSample: window.__syncLog.slice(0, 15),
      syncModeFlips: window.__syncLog.filter((e, i) => i > 0 && e.mode !== window.__syncLog[i - 1].mode).length,
      sampleCount,
      growing: Game.state.grid.filter((c) => c.seed && !c.ready).length,
      wonderActive: Game.wonderActive && Game.wonderActive(),
    };
  });

  await browser.close();
  server.close();

  console.log(JSON.stringify(report, null, 2));
  if (errors.length) {
    console.error('page errors:', errors);
    process.exit(1);
  }
  if (report.jumpCount > 0 || (report.pxJumps && report.pxJumps.length > 0)) {
    console.error(`\nFAIL: ${report.jumpCount} time jump(s), ${(report.pxJumps || []).length} visual reset(s). syncCalls=${report.syncCalls} reloads=${report.syncReloads}`);
    process.exit(1);
  }
  console.log('\nOK: no grow video time jumps detected.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
