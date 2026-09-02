#!/usr/bin/env node
//
// reencode-art-video.js — remux art MP4s for web playback.
//
// Muted clips (BG, plants, idle loops): drop audio, strip metadata, faststart.
// Everything else (speech, powerup, generic talk): keep streams, strip metadata, faststart.
//
//   node tools/reencode-art-video.js              dry-run (default)
//   node tools/reencode-art-video.js --apply      write changes in place (.bak kept)
//
// Requires ffmpeg on PATH. No npm dependencies.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ART = path.join(ROOT, 'art', 'video');

/** Always muted in ui.js — safe to drop audio tracks. */
const MUTED = [
  'bg/spring.mp4',
  'bg/summer.mp4',
  'bg/fall.mp4',
  'bg/winter.mp4',
  'plant/sunflower-grow.mp4',
  'plant/sunflower-finish-loop.mp4',
  'flower/spring-idle1.mp4',
  'flower/idle-2.mp4',
  'flower/idle-3.mp4',
];

function findFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg not found on PATH');
}

function allMp4s(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) allMp4s(p, out);
    else if (name.endsWith('.mp4')) out.push(p);
  }
  return out;
}

function relArt(p) {
  return path.relative(ART, p).replace(/\\/g, '/');
}

function remux(src, { stripAudio }) {
  const tmp = `${src}.reencode.tmp.mp4`;
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-map', '0:v:0',
    '-c:v', 'copy',
    '-movflags', '+faststart',
    '-map_metadata', '-1',
  ];
  if (!stripAudio) args.push('-map', '0:a:0?', '-c:a', 'copy');
  else args.push('-an');
  args.push(tmp);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    try { fs.unlinkSync(tmp); } catch (_) {}
    throw new Error(`ffmpeg failed on ${src}\n${r.stderr || r.stdout || ''}`);
  }
  return tmp;
}

function fmtMb(n) {
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function main() {
  const apply = process.argv.includes('--apply');
  findFfmpeg();

  const mutedSet = new Set(MUTED);
  const files = allMp4s(ART).sort();
  let saved = 0;

  console.log(apply ? 'Applying remux…' : 'Dry run (pass --apply to write)…');
  console.log('');

  for (const abs of files) {
    const rel = relArt(abs);
    const stripAudio = mutedSet.has(rel);
    const before = fs.statSync(abs).size;

    if (!apply) {
      console.log(`  ${stripAudio ? '[muted]' : '[audio]'} ${rel}  ${fmtMb(before)}`);
      continue;
    }

    const tmp = remux(abs, { stripAudio });
    const after = fs.statSync(tmp).size;
    const bak = `${abs}.bak`;
    if (fs.existsSync(bak)) fs.unlinkSync(bak);
    fs.renameSync(abs, bak);
    fs.renameSync(tmp, abs);
    saved += before - after;
    console.log(`  ${rel}: ${fmtMb(before)} → ${fmtMb(after)} (${stripAudio ? 'no audio' : 'audio kept'})`);
  }

  if (apply) {
    console.log('');
    console.log(`Done. Saved ${fmtMb(saved)} total. Originals kept as *.bak (delete when happy).`);
  } else {
    console.log('');
    console.log(`${files.length} files — ${MUTED.length} muted (audio stripped), rest remuxed with audio.`);
  }
}

main();
