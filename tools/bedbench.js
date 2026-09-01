#!/usr/bin/env node
//
// bedbench.js — measure the weather beds, because this one is heard, not seen.
//
// A screenshot proves nothing about a sky's sound, and an ear on a laptop
// speaker proves less: the game is played on a handset, which gives back almost
// nothing under a few hundred hertz. So the beds are rendered offline through
// the REAL graph and reported as numbers.
//
// It drives `Sound.renderBed()` in a headless browser through tools/probe.js's
// own Chrome plumbing. `renderBed` swaps the module's audio context for an
// OfflineAudioContext and builds through the same `BUILD[id]` the game plays, so
// this measures `audio.js` rather than a copy of its constants.
//
// Usage:
//   node tools/bedbench.js                 every bed, 20 seconds each
//   node tools/bedbench.js rain storm      just those
//   node tools/bedbench.js --seconds 40    a longer window
//   node tools/bedbench.js --runs 3        repeat, because the noise buffer is
//                                          random per render and the PEAK moves
//                                          with it (RMS does not)
//
// The four columns:
//
//   peak        loudest sample at the speaker, after bed trim x ambient x master
//   rms         average level over the window — the honest loudness comparator
//   phone rms   the same, highpassed at 300Hz: what a handset can reproduce
//   swing       loudest second against the quietest, in dB
//
// SWING IS THE ONE THAT FOUND THE BUG. The old storm measured 2.93dB whole-bed
// and 0.66dB across the band a phone can actually play, because its only
// modulation rode a sub band the speaker throws away. A bed that does not
// breathe is fatiguing within a minute, and the number says so before anyone
// has to sit through one.

const path = require('node:path');
const { spawn } = require('node:child_process');

const args = process.argv.slice(2);
const num = (flag, dflt) => {
  const i = args.indexOf(flag);
  if (i < 0) return dflt;
  const v = Number(args[i + 1]);
  args.splice(i, 2);
  return Number.isFinite(v) ? v : dflt;
};
const seconds = num('--seconds', 20);
const runs = num('--runs', 1);
const ids = args.filter((a) => !a.startsWith('-'));

// The measurement itself, as one expression for probe.js's `eval:` step.
const script = `(async()=>{
  Sound.init();
  const ids = ${JSON.stringify(ids)}.length ? ${JSON.stringify(ids)} : ['rain','storm','aurora','wonderfall'];
  const out = [];
  for (const id of ids) {
    const whole = await Sound.renderBed(id, ${seconds});
    const phone = await Sound.renderBed(id, ${seconds}, { phoneHz: 300 });
    if (!whole || !phone) continue;
    out.push({ id, peak: whole.peak, rms: whole.rms, swing: whole.swingDb,
      phoneRms: phone.rms, phoneSwing: phone.swingDb });
  }
  return JSON.stringify(out);
})()`;

function once() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [path.join(__dirname, 'probe.js'), 'wait:900', `eval:${script}`], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'inherit']
    });
    let buf = '';
    p.stdout.on('data', (d) => { buf += d; });
    p.on('close', () => {
      // probe.js prints `  eval <expr> -> "<json>"`; the payload is the last
      // quoted JSON on that line.
      const m = buf.match(/-> "((?:[^"\\]|\\.)*)"/);
      if (!m) return reject(new Error(`no result from probe:\n${buf}`));
      try {
        resolve(JSON.parse(JSON.parse(`"${m[1]}"`)));
      } catch (e) {
        reject(new Error(`could not parse: ${m[1]}`));
      }
    });
  });
}

const f = (n, d) => n.toFixed(d).padStart(d + 3);

(async () => {
  const rows = new Map();
  for (let r = 0; r < runs; r += 1) {
    const got = await once();
    got.forEach((row) => {
      if (!rows.has(row.id)) rows.set(row.id, []);
      rows.get(row.id).push(row);
    });
  }
  const avg = (list, k) => list.reduce((a, b) => a + b[k], 0) / list.length;

  console.log(`\nBed levels at the speaker — ${seconds}s window, ${runs} run${runs === 1 ? '' : 's'}`);
  console.log('bed            peak      rms   phone rms    swing   phone swing');
  console.log('------------------------------------------------------------------');
  rows.forEach((list, id) => {
    console.log(`${id.padEnd(12)} ${f(avg(list, 'peak'), 4)}  ${f(avg(list, 'rms'), 5)}     `
      + `${f(avg(list, 'phoneRms'), 5)}  ${f(avg(list, 'swing'), 2)} dB     `
      + `${f(avg(list, 'phoneSwing'), 2)} dB`);
  });
  console.log('\nRMS is the comparator; peak moves with the random noise buffer each render.');
  console.log('A bed whose PHONE SWING is under about 1 dB does not breathe, and a minute');
  console.log('inside it is fatiguing however quiet it measures.\n');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
