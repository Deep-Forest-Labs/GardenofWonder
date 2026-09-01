#!/usr/bin/env node
//
// skybench.js — what does each sky cost to draw?
//
// Written for the performance pass that answered the owner's iPhone 16 frame dip
// (docs/11-known-issues.md, Performance). It drives `tools/probe.js`, holds every sky
// in turn on a full board, and reports what one frame costs under each — so a change
// can be measured rather than argued about.
//
// Usage:
//   node tools/skybench.js [label] [--reps N] [--frames N]
//
//   node tools/skybench.js before
//   node tools/skybench.js after --reps 4
//
// It writes .probe/skybench-LABEL.json beside the screenshots, so a before and an
// after can be diffed later without re-running either.
//
// ---------------------------------------------------------------------------
// READ THIS BEFORE QUOTING A NUMBER FROM IT.
//
// The bench runs Chrome headless with `--disable-gpu`, which is probe.js's setting and
// not negotiable there — so every pixel is rasterised in software, on the CPU. That
// makes it a good instrument and a bad simulator:
//
//   * GOOD at RANKING. Blends, masks and animated filters are exactly the work software
//     rasterisation charges full price for, and they are exactly the costs under
//     investigation. A sky that is dearer here is dearer on a phone.
//   * BAD at absolute numbers. A frame costing 40 ms here is not a frame costing 40 ms
//     on an A18, which has a GPU. Never quote a bench millisecond as a device
//     millisecond. The device number comes from the in-game readout — the dev sheet's
//     "Frame rate" row — read on the handset.
//   * BLIND to anything that only happens under a finger. It never taps, so the screen
//     shake and everything else on the tap path are absent from these numbers.
//
// It also runs with the frame limiter OFF (`--disable-frame-rate-limit`,
// `--disable-gpu-vsync`). With vsync on, every frame time is a multiple of 16.7 ms and
// the only signal is how many were missed; with it off, the interval IS the cost of the
// frame, which is a continuous number and about ten times less noisy.
//
// AND IT TURNS PAINTING ON (`paint:on`). This is not optional and it is the thing most
// easily got wrong: a headless page nobody is looking at composites lazily, so the bench
// happily reported 2 ms a frame for a sky running full-screen blends. A screencast makes
// Chrome produce real frames, which is the only way the numbers are about paint at all.
// If a future edit drops that step, every row goes fast and every row stays wrong.
// ---------------------------------------------------------------------------

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.probe');

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i === -1 ? dflt : Number(args[i + 1]);
};
const LABEL = (args[0] && !args[0].startsWith('--')) ? args[0] : 'run';
const REPS = flag('reps', 3);
const MS = flag('frames', 6000);   // sampling window per sky, in milliseconds

/* Clear is in the list on purpose and is the most important row in the table: it is the
   floor every other sky is measured against, and 70% of slots are clear. The sunbreak
   is a sky in this sense too — it outlives the rain that earned it. */
const SKIES = ['clear', 'rain', 'storm', 'aurora', 'wonderfall'];

/* A full board, because half the sky's cost is per-plant: the glisten, the storm's lean
   and Wonderfall's bob are all one animated layer per plant. Plots 5-8 are behind the
   first Turn as well as behind levels, hence the year drive. */
/* The board the skies are measured on, as ONE evaluation so it can loop.

   Two things it has to get right, both learned the hard way:

   The What's New sheet opens over the garden on a fresh save, and its backdrop blur is
   far dearer than any sky — a bench that leaves it up measures the dialog. That is the
   probe trap about screens needing progress wearing a different hat, and it cost this
   pass a whole baseline before anyone looked at the screenshot.

   Plots 5-8 are held by the first Turn as well as by levels, and driving the year does
   not always land on the first ask. So it asks until the gate opens rather than
   assuming one Turn did it: half a sky's cost is per-plant — the glisten, the storm's
   lean, Wonderfall's bob are each one animated layer per plant — and a bench that
   quietly settles for four plots misses all of it. */
const SETUP = [
  'tap:#newsOk',
  'wait:700',
  'paint:on',
  'eval:(async () => {'
  + ' const wait = (ms) => new Promise((r) => setTimeout(r, ms));'
  + ' Game.Dev.grantGold(1e8); Game.Dev.grantLevels(40);'
  + " for (let i = 0; i < 5 && Game.plotGate(4) !== ''; i += 1) {"
  + ' Game.Dev.driveYear(600000); Game.Dev.runTurn(null); await wait(400);'
  + ' Game.Dev.grantGold(1e8); Game.Dev.grantLevels(40); }'
  + ' const opened = [4, 5, 6, 7].map((i) => Game.unlockPlot(i)).filter(Boolean).length;'
  + ' Game.Dev.grantGold(1e8);'
  + ' const filled = Game.Dev.fillGarden(); Game.Dev.summonAll(3); await wait(1400);'
  + ' return JSON.stringify({ opened, filled,'
  + " plants: document.querySelectorAll('.plant').length,"
  + " critters: document.querySelectorAll('.critter').length }); })()",
];

/* The bench and the handset read the same numbers out of the same code: `UI.perf` is
   the instrument in both, and `sample()` is the entry that starts it WITHOUT showing
   the overlay, so a bench run and a look-parity screenshot can share a session. */
const sample = (label) =>
  `eval:(async () => { UI.perf.sample(${JSON.stringify(label)});`
  + ` await new Promise((r) => setTimeout(r, ${MS}));`
  + ' const r = UI.perf.report(); UI.perf.stop(); return JSON.stringify(r); })()';

const steps = [...SETUP];
for (let rep = 0; rep < REPS; rep += 1) {
  for (const sky of SKIES) {
    steps.push(`eval:Game.Dev.setWeather(${sky === 'clear' ? "''" : `'${sky}'`}).id`);
    /* Long enough for the slowest arrival to be over: rain and the storm announce for
       `frontSeconds`, an aurora dusks for `duskSeconds`, and Wonderfall's cue runs
       2.2 s before the veil. What is being measured is a sky being HELD. */
    steps.push('wait:9000');
    steps.push(sample(`${sky}|${rep}`));
  }
  /* The sunbreak is not a sky the engine can be told to hold — it rides the end of a
     rain, in daylight, and lives on its own timer. Drive it the way the game does. */
  steps.push("eval:Game.Dev.setWeather('rain').id");
  steps.push('wait:9000');
  steps.push("eval:Game.Dev.setWeather('').id");
  steps.push('wait:7000');
  steps.push(sample(`sunbreak|${rep}`));
  steps.push("eval:Game.Dev.setWeather('').id");
  steps.push('wait:2000');
}
steps.push('shot:skybench-' + LABEL);

const child = spawn('node', [path.join(ROOT, 'tools/probe.js'), ...steps], {
  cwd: ROOT,
  env: {
    ...process.env,
    PROBE_FLAGS: '--disable-frame-rate-limit --disable-gpu-vsync',
  },
});

let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => process.stderr.write(d));

child.on('close', (code) => {
  const rows = [];
  for (const line of log.split('\n')) {
    const m = /-> "(\{\\"label[\s\S]*)"$/.exec(line.trim());
    if (!m) continue;
    try { rows.push(JSON.parse(JSON.parse(`"${m[1]}"`))); } catch { /* not a report */ }
  }
  if (!rows.length) {
    console.log(log);
    console.error('skybench: no reports came back — the run above is the whole story.');
    process.exit(code || 1);
  }

  const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
  const by = {};
  for (const r of rows) (by[r.label.split('|')[0]] = by[r.label.split('|')[0]] || []).push(r);

  const order = [...SKIES, 'sunbreak'];
  /* p50 is the headline because it is robust: a run picks up occasional stalls that
     belong to the machine rather than to the sky, and one of them moves a mean and
     moves nothing else. The mean is printed beside it anyway, because the GAP between
     them is itself the finding — a sky whose median is fine and whose mean is four
     times that is not slow, it is stalling. */
  const floor = by.clear ? med(by.clear.map((r) => r.interval.p50)) : 0;
  const table = [];
  console.log('\nsky           reps  p50     p95     mean    js p50  rest p50  vs clear');
  for (const sky of order) {
    const g = by[sky];
    if (!g) continue;
    const p50 = med(g.map((r) => r.interval.p50));
    const row = {
      sky,
      reps: g.length,
      frameP50: p50,
      frameP95: med(g.map((r) => r.interval.p95)),
      frameMean: med(g.map((r) => r.interval.mean)),
      jsP50: med(g.map((r) => r.js.p50)),
      restP50: med(g.map((r) => r.rest.p50)),
      vsClear: floor ? +(p50 / floor).toFixed(2) : null,
      settleWorst: med(g.map((r) => r.settle.worst)),
      frames: med(g.map((r) => r.n)),
    };
    table.push(row);
    console.log(
      sky.padEnd(13) + String(row.reps).padEnd(6)
      + String(row.frameP50).padEnd(8) + String(row.frameP95).padEnd(8)
      + String(row.frameMean).padEnd(8) + String(row.jsP50).padEnd(8)
      + String(row.restP50).padEnd(10)
      + (row.vsClear === null ? '' : '×' + row.vsClear)
    );
  }
  console.log('\nMilliseconds per frame, software rasterisation, frame limiter off.');
  console.log('RANKING is the output. Absolute numbers are NOT device numbers — read the');
  console.log('header, and take the device figure off the dev sheet on the handset.');
  console.log('`js` is our own script; `rest` is style, layout, paint, blend and composite.');

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `skybench-${LABEL}.json`);
  fs.writeFileSync(file, JSON.stringify({ label: LABEL, reps: REPS, ms: MS, table, rows }, null, 1));
  console.log(`\nwrote ${path.relative(ROOT, file)}`);
  process.exit(code);
});
