#!/usr/bin/env node
//
// stage-parity.js — did the blooms move?
//
// Written for the Growth Stages pass (docs/10-decision-log.md, 2026-09-01 ruling).
// The owner's one aesthetic instruction is that the ripe blooms stay exactly as
// they are, so every push that touches flora.js or the stage rules has to prove
// the board it did not mean to change. This drives tools/probe.js through two
// deterministic boards — one all-ripe, one at staggered growth — and diffs the
// pixels of a before-arm against an after-arm, so the parity claim can be
// re-derived by anyone instead of trusted.
//
// Usage:
//   node tools/stage-parity.js shoot LABEL        writes .probe/stage-LABEL-{ripe,grow}.png
//   node tools/stage-parity.js diff A B           diffs both boards of two labels
//   node tools/stage-parity.js diff a.png b.png   diffs two PNG files directly
//
//   node tools/stage-parity.js shoot before
//   ...change flora.js or the stage rules...
//   node tools/stage-parity.js shoot after
//   node tools/stage-parity.js diff before after  exits 0 only on zero differing pixels
//
// The two boards between them plant all eleven shape families: the ripe board
// takes the eight fast seeds (daisy through orchid), the growing board the slow
// half of the ladder, on the staggered fractions capture-screens.js composed for
// the summer-garden scene.
//
// ---
//
// Determinism is the whole job, and every line of the freeze sequence is there
// because something varies without it: weather is a hash of epoch time (pinned
// clear, then startWeather() after the hold drains), the day cycle is six
// minutes (pinned through DAY.offset, the knob both readers go through), clouds
// are randomised at boot (removed), the What's New sheet covers a fresh boot
// (dismissed), toasts and FX particles ride wall-clock timers (a long settle
// before the freeze), and growth itself advances between eval and shutter — so
// the frame loop and every interval are stopped and the bars and stages are
// then written explicitly, the same values in both arms. Animations are pinned
// at one currentTime, not merely paused, or the ripe wiggle photographs
// mid-beat in one arm and at rest in the other.

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '.probe');

const RIPE_SEEDS = ['daisy', 'tulip', 'bluebell', 'lavender', 'rose', 'peony', 'marigold', 'orchid'];
const GROW_SEEDS = ['sunlotus', 'jadefern', 'moonflower', 'starlit', 'aurora', 'celestial', 'nebula', 'eternal'];
/* The summer-garden scene's staggered fractions, reused verbatim. */
const GROW_FRACTIONS = [0.12, 0.5, 0.88, 1.05, 0.3, 0.78, 0.95, 0.2];

function boardSteps(name, seeds, fractions) {
  const unlocks = seeds.filter((id) => !['daisy', 'tulip'].includes(id));
  const steps = [
    'wait:600',
    "eval:(document.getElementById('newsOk')||{click(){}}).click()||'news-ok'",
    'wait:400',
    "eval:Game.Dev.setWeather('clear').id",
    'eval:Game.Dev.grantLevels(11)',
    /* Plots 5-8 are held by the Turn before the level, so the board earns a year
       and turns it — the same road capture-screens.js drives. */
    'eval:Game.Dev.driveYear(160000)',
    'eval:Game.Dev.runTurn().turnsCompleted',
    'eval:Game.Dev.grantGold(2000000000)',
    /* Rain and storm hold their layers for eight seconds after ending; the same
       wait lets the level-up toasts and confetti die before anything is frozen. */
    'wait:9200',
    'eval:UI.startWeather()',
    'wait:700',
    'eval:JSON.stringify([4,5,6,7].map(i=>Game.unlockPlot(i)))',
    `eval:JSON.stringify(${JSON.stringify(unlocks)}.map(id=>Game.unlockSeed(id)))`,
    `eval:JSON.stringify(${JSON.stringify(seeds)}.map((id,i)=>Game.plant(i,Game.seedById(id))))`,
    `eval:JSON.stringify((()=>{const f=${JSON.stringify(fractions)};const t=Date.now()/1000;Game.state.grid.forEach((c,i)=>{if(c.seed)c.plantedAt=t-c.grow*f[i];});return Game.state.grid.map(c=>c.seed?Math.round(Game.progressOf(c)*100):null);})())`,
    /* Let the engine mark stages, bars and readiness, and let planting FX decay. */
    'wait:3000',
    /* Stop time: keep the rAF callback (the loop reschedules itself and a stub
       that drops it kills any later restart), then kill every timer. */
    "eval:(()=>{window.__rafQ=[];window.__origRaf=window.requestAnimationFrame;window.requestAnimationFrame=(cb)=>{window.__rafQ.push(cb);return 0};for(let i=1;i<100000;i++){cancelAnimationFrame(i)}for(let i=1;i<20000;i++){clearInterval(i);clearTimeout(i)}return 'time-stopped'})()",
    "eval:document.querySelectorAll('.cloud').forEach(n=>n.remove())||'clouds-gone'",
    /* The ambient petals are canvas particles at boot-random positions; with the
       frame loop stopped the canvas holds its last frame, so wipe it. */
    "eval:(()=>{const c=document.getElementById('fx');const x=c.getContext('2d');x.save();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.restore();return 'fx-wiped'})()",
    "eval:document.getElementById('speech').classList.remove('show')||'speech-hidden'",
    'eval:DAY.offset = ((0.32 - (Date.now() / 1000) / DAY.cycle) % 1 + 1) % 1; UI.updateSky(); DAY.offset',
    /* The loop is stopped, so the bars and stages are written by hand — the same
       strings in both arms, however many milliseconds each arm took to get here. */
    `eval:JSON.stringify((()=>{const f=${JSON.stringify(fractions)};const stage=(p)=>p<0.25?1:p<0.7?2:3;const plots=[...document.querySelectorAll('#garden .plot')];return plots.map((el)=>{const i=+el.dataset.idx;if(f[i]==null)return null;const p=Math.min(1,f[i]);el.dataset.stage=stage(p);const bar=el.querySelector('.bar i');if(bar)bar.style.width=(p*100).toFixed(1)+'%';return el.dataset.stage;});})())`,
    'wait:800',
    /* Transitions are FINISHED, not pinned: pinning one mid-flight freezes it
       part-way from wherever the boot happened to start it — the sun hangs at a
       different height every run. Only looping animations take the fixed clock. */
    "eval:(()=>{let n=0;document.getAnimations().forEach(a=>{try{if(typeof CSSTransition!=='undefined'&&a instanceof CSSTransition){a.finish()}else{a.currentTime=1500;a.pause()}n++}catch(e){try{a.currentTime=1500;a.pause();n++}catch(_){}}});return n+' animations settled'})()",
    'wait:200',
    `shot:${name}`,
  ];
  return steps;
}

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
    throw new Error(`unexpected PNG: depth ${depth}, colour type ${colour}, interlace ${interlace}`);
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

function diffPair(fileA, fileB) {
  const a = pngDecode(fs.readFileSync(fileA));
  const b = pngDecode(fs.readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) {
    return { size: `${a.width}x${a.height} vs ${b.width}x${b.height}`, pixels: Infinity, worst: 255 };
  }
  const bppMin = Math.min(a.bpp, b.bpp);
  let pixels = 0;
  let worst = 0;
  for (let i = 0; i < a.width * a.height; i++) {
    let differs = false;
    for (let c = 0; c < bppMin; c++) {
      const d = Math.abs(a.px[i * a.bpp + c] - b.px[i * b.bpp + c]);
      if (d > 0) differs = true;
      if (d > worst) worst = d;
    }
    if (differs) pixels++;
  }
  return { total: a.width * a.height, pixels, worst };
}

function shoot(label) {
  const boards = [
    { name: `stage-${label}-ripe`, seeds: RIPE_SEEDS, fractions: [1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05] },
    { name: `stage-${label}-grow`, seeds: GROW_SEEDS, fractions: GROW_FRACTIONS },
  ];
  for (const board of boards) {
    console.log(`— shooting ${board.name}`);
    const res = spawnSync('node', [path.join(__dirname, 'probe.js'), ...boardSteps(board.name, board.seeds, board.fractions)], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    if (res.status !== 0) {
      console.error(`probe failed on ${board.name}`);
      process.exit(res.status || 1);
    }
  }
  console.log(`wrote .probe/stage-${label}-ripe.png and .probe/stage-${label}-grow.png`);
}

function resolvePair(a, b) {
  if (a.endsWith('.png') || b.endsWith('.png')) return [[a, b, path.basename(a)]];
  return ['ripe', 'grow'].map((board) => [
    path.join(OUT, `stage-${a}-${board}.png`),
    path.join(OUT, `stage-${b}-${board}.png`),
    board,
  ]);
}

function main() {
  const [mode, a, b] = process.argv.slice(2);
  if (mode === 'shoot' && a) return shoot(a);
  if (mode === 'diff' && a && b) {
    const allowIdx = process.argv.indexOf('--allow');
    const allow = allowIdx === -1 ? 0 : Number(process.argv[allowIdx + 1]);
    let bad = false;
    for (const [fileA, fileB, name] of resolvePair(a, b)) {
      const r = diffPair(fileA, fileB);
      if (r.size) {
        console.log(`${name.padEnd(6)} SIZE MISMATCH ${r.size}`);
        bad = true;
        continue;
      }
      const pct = ((r.pixels / r.total) * 100).toFixed(4);
      console.log(`${name.padEnd(6)} ${String(r.pixels).padStart(8)} differing pixels of ${r.total} (${pct}%), worst channel delta ${r.worst}`);
      if (r.pixels > allow) bad = true;
    }
    process.exit(bad ? 1 : 0);
  }
  console.error('usage: node tools/stage-parity.js shoot LABEL | diff A B [--allow N]');
  process.exit(2);
}

main();
