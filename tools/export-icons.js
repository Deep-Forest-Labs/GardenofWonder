#!/usr/bin/env node
//
// export-icons.js — write every icon in the registry out as a standalone .svg.
//
//   node tools/export-icons.js            write art/exports/icons/*.svg
//   node tools/export-icons.js --check    verify the exports match icons.js, write nothing
//
// The Unity team needs the icon set as files it can open, and SVG is text — so
// this needs no exception to the no-binary-assets rule in docs/09-conventions.md.
// The exports are a MIRROR of icons.js, never a source: edit the icon in icons.js
// and run this again. docs/45-asset-inventory.md is the manifest they belong to.
//
// THE POINT OF THIS SCRIPT IS THE ASSERTION AT THE END. An icon added to icons.js
// and never exported is invisible — the export directory looks complete, the
// manifest looks complete, and one glyph is quietly missing from everything the
// Unity team builds. So the count of files written must equal the count of icons
// in the registry, and the run fails loudly when it does not.
//
// Reaching the registry is the one awkward part. `icons.js` keeps LIB private
// inside its IIFE and exposes only { get, has, hydrate }; `get()` FALLS BACK to
// the sparkle glyph for an unknown name, so there is no way to enumerate by
// probing, and a name-by-name guess would return plausible wrong art rather than
// failing. Parsing the source for keys is no better: LIB is built in two parts —
// an object literal and a later Object.assign — which is exactly the shape a
// regex misses half of. So this evaluates the real module with one anchored
// substitution that hands LIB back, and refuses to run if that anchor has moved.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'icons.js');
const OUT = path.join(ROOT, 'art', 'exports', 'icons');

const CHECK_ONLY = process.argv.includes('--check');

/* The public surface of icons.js, and the one line this script depends on. If
   the module's exports change, the substitution below stops matching and the run
   stops with a message that says what to do — rather than silently exporting
   nothing, or exporting 46 sparkles. */
const ANCHOR = 'return { get, has, hydrate };';
const PATCHED = 'return { get, has, hydrate, LIB };';

function loadRegistry() {
  const src = fs.readFileSync(SOURCE, 'utf8');
  if (!src.includes(ANCHOR)) {
    throw new Error(
      `icons.js no longer ends its IIFE with "${ANCHOR}".\n` +
      `  This script reaches the private LIB registry by rewriting that exact line in memory.\n` +
      `  Update ANCHOR/PATCHED in tools/export-icons.js to match the new public surface.`
    );
  }
  const context = vm.createContext({});
  /* No `location` in the sandbox on purpose: icons.js guards its only use with
     `typeof location !== 'undefined'`, so leaving it out takes the Node branch and
     the module's local-only "Unknown icon" warning stays quiet. */
  vm.runInContext(src.replace(ANCHOR, PATCHED) + '\n;Icons;', context, { filename: 'icons.js' });
  const Icons = vm.runInContext('Icons', context);
  if (!Icons || !Icons.LIB) throw new Error('icons.js evaluated but handed back no LIB');
  return Icons;
}

/**
 * The game injects these straight into the document, where the page supplies the
 * SVG namespace. A file on disk has no page, so it needs its own `xmlns` or it is
 * markup no viewer will draw. Width and height come from the viewBox so the file
 * has an intrinsic size when something opens it cold; nothing else is touched, so
 * an exported icon is byte-for-byte the art the game draws.
 */
function standalone(markup, name) {
  const vb = /viewBox="([^"]+)"/.exec(markup);
  if (!vb) throw new Error(`${name}: no viewBox — an icon without one cannot scale`);
  const parts = vb[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`${name}: viewBox "${vb[1]}" is not four numbers`);
  }
  const [, , w, h] = parts;
  const out = markup.replace(
    /^<svg /,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `
  );
  if (out === markup) throw new Error(`${name}: markup does not start with <svg`);
  return `${out.trim()}\n`;
}

/* Self-contained means self-contained: nothing that reaches out of the file for
   anything. A CSS custom property is the easy one to write by accident — it works
   perfectly inside the game, where style.css declares it, and paints nothing at
   all in a file opened on its own. */
const EXTERNAL_REFS = [
  [/<use\b/, '<use> element'],
  [/<image\b/, '<image> element'],
  [/\bxlink:href=/, 'xlink:href'],
  [/\bhref=/, 'href'],
  [/url\(\s*['"]?(?!#)/, 'url() pointing outside the file'],
  [/var\(\s*--/, 'CSS custom property'],
  [/@import/, '@import'],
];

/* The stage exports carry the game's growth-staging rules, which speak in custom
   properties on purpose — so for THOSE files the blunt no-var() rule above is
   replaced by the real question: does every var() resolve inside the file? It
   does when the property is declared somewhere in the file (`--sg:` in a stage
   rule, `--glow:` in the root's own style attribute) or the call carries a
   fallback. Anything else still reaches out, and still fails. */
function unresolvedVars(svg) {
  const bad = new Set();
  for (const m of svg.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g)) {
    const hasFallback = m[2] === ',';
    const declared = svg.includes(`${m[1]}:`);
    if (!hasFallback && !declared) bad.add(m[1]);
  }
  return [...bad];
}

const SELF_CONTAINED_WITH_VARS = EXTERNAL_REFS.filter(([, what]) => what !== 'CSS custom property');

// ---------------------------------------------------------------- the samples

/*
 * ONE representative file per art class that can be exported faithfully. The icon set
 * above is the only art in the game that ships as files; everything else is drawing
 * code, and docs/45-asset-inventory.md is the table that says what exists. These
 * samples exist so the Unity team can open the house style rather than read about it.
 *
 * Not everything is here, and that is deliberate. A class earns a sample when its draw
 * function returns complete markup for a FIXED viewBox. The two big backdrops —
 * `Fall.scene()` and `Meadow.scene()` — are composed against a measured screen size, so
 * any file would be one arbitrary window and the recipe is the honest deliverable
 * instead; docs/45 carries it. Rarity and mutation treatments have no draw function at
 * all: they are CSS on the plot around an unchanged flower.
 *
 * Every sample needs one small, stated fix, and every fix stays INSIDE the file:
 *
 *   - flora.js emits `fill="url(#gp-daisy)"` and defines those gradients separately, in
 *     a hidden <svg> that injectDefs() appends to the document. Exported raw, all
 *     nineteen blooms paint as hollow outlines. Rather than restate the gradients here —
 *     a copy that would drift the first time the palette moved — this runs the game's own
 *     injectDefs() against a tiny DOM stub and keeps what it built.
 *   - critters.js and customers.js draw EVERY state at once and let CSS pick one, so a
 *     raw export shows a creature with its eyes open, its sleeping eyes on top, and its
 *     Zs floating. The one rule that selects a state is inlined as a <style>.
 *   - the Talking Flower's eyelids are full-height rects that style.css collapses with
 *     `transform: scaleY(0)`. Without that line the character exports asleep.
 */
const SAMPLES_OUT = path.join(ROOT, 'art', 'exports', 'samples');

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

/** Load a list of the project's plain scripts into one fresh sandbox. */
function sandbox(files, extraGlobals = {}) {
  const context = vm.createContext({ ...extraGlobals });
  for (const f of files) vm.runInContext(read(f), context, { filename: f });
  return (expr) => vm.runInContext(expr, context);
}

/**
 * flora.js keeps its gradients in a hidden <svg> that injectDefs() builds and appends to
 * the document. This is the smallest stub that lets that real function run, so the
 * exported gradients are the game's own rather than a copy of them.
 */
function floraDefs(run) {
  let built = '';
  const stub = {
    getElementById: () => null,
    createElementNS: () => ({
      setAttribute() {},
      style: {},
      set innerHTML(v) { built = v; },
      get innerHTML() { return built; },
    }),
    body: { appendChild() {} },
  };
  run.context.document = stub;
  run('Flora.injectDefs()');
  if (!built.startsWith('<defs>')) throw new Error('flora injectDefs() built no <defs> — the stub no longer fits it');
  return built;
}

/** Put `extra` (defs and/or a style rule) immediately after the opening <svg> tag. */
function withInternals(raw, extra) {
  /* flora.js indents its template literals, so the markup arrives with a leading newline. */
  const markup = raw.trim();
  const close = markup.indexOf('>');
  if (!markup.startsWith('<svg') || close === -1) throw new Error('not an <svg> document');
  const open = markup.slice(0, close + 1).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return `${open}${extra}${markup.slice(close + 1)}\n`;
}

function buildSamples() {
  const out = [];

  // ---- flora.js: the blooms, a whole plant, and the Talking Flower ----
  {
    const context = vm.createContext({});
    vm.runInContext(read('data.js'), context, { filename: 'data.js' });
    vm.runInContext(read('flora.js'), context, { filename: 'flora.js' });
    const run = (expr) => vm.runInContext(expr, context);
    run.context = context;
    const defs = floraDefs(run);
    const seed = (id) => `DATA.seeds.find((s) => s.id === ${JSON.stringify(id)})`;

    out.push({
      name: 'bloom-daisy',
      what: 'One flower head. All 19 come out of the same generator — the seed row is the whole input.',
      svg: withInternals(run(`Flora.head(${seed('daisy')}, 100)`), defs),
    });
    out.push({
      name: 'plant-rose',
      what: 'A whole plant at full growth. Since the Growth Stages pass the markup also carries the hidden sprout and bud groups, so the shipped stage rules are baked in and the bloom stage selected — the per-stage set lives in art/exports/stages/.',
      svg: withInternals(run(`Flora.plant(${seed('rose')})`), `${defs}<style>${stageCss()}</style>`)
        .replace('class="plant', 'class="plant stage-bloom'),
      /* rose carries no glow, so the halo rule stays out of this file on purpose */
    });
    out.push({
      name: 'talking-flower',
      what: 'The character in the centre cell. Its eyelids are full-height rects that CSS collapses, so the rule that opens its eyes is inlined here.',
      svg: withInternals(run('Flora.talkingFlower()'), `${defs}<style>.tf-lid{transform:scaleY(0)}</style>`),
    });
  }

  // ---- critters.js: a creature, awake ----
  {
    const run = sandbox(['data.js', 'critters.js']);
    out.push({
      name: 'creature-pip',
      what: 'A garden spirit. One body plus a vocabulary of features — crown, wings, tail, stripes, palette — makes all six.',
      svg: withInternals(
        run('Critters.draw(CREATURES[0])'),
        '<style>.cr-eyes-shut,.cr-zzz{display:none}</style>'
      ),
    });
  }

  // ---- customers.js: a villager, neutral ----
  {
    const run = sandbox(['data.js', 'customers.js']);
    out.push({
      name: 'customer-nan',
      what: 'A villager at the Stand. Every face draws all three expressions and CSS picks one; this is the neutral one.',
      svg: withInternals(
        run('Customers.draw(CUSTOMERS[0])'),
        '<style>.cu-eyes-happy,.cu-mouth-happy,.cu-eyes-wait,.cu-mouth-wait{display:none}</style>'
      ),
    });
  }

  // ---- ui-scenery.js: the shared hedge ----
  {
    /* The only exportable thing in any ui-* file, and it needs exactly one stub: the
       module destructures `el` off the shared UI global at load. */
    const run = sandbox(['ui-scenery.js'], { UI: { el: {} } });
    out.push({
      name: 'hedge',
      what: 'The hedge silhouette, drawn once and reused by the season gates and the Turn ceremony.',
      svg: withInternals(run('UI.hedge(false)'), ''),
    });
  }

  return out;
}

function writeSamples() {
  let samples;
  try {
    samples = buildSamples();
  } catch (err) {
    /* A sample that cannot be built is a finding, not a crash: the icons are the
       deliverable this script guarantees, and they are already on disk by now. */
    console.error(`  ! samples not written — ${err.message}`);
    return null;
  }

  const problems = [];
  for (const s of samples) {
    if (!/viewBox="/.test(s.svg)) problems.push(`${s.name}: no viewBox`);
    for (const [re, what] of SELF_CONTAINED_WITH_VARS) {
      /* url(#…) is fine here and only here: these files carry their own <defs>, so a
         reference into the same document resolves. Anything reaching OUT still fails. */
      if (re.test(s.svg)) problems.push(`${s.name}: not self-contained — ${what}`);
    }
    for (const v of unresolvedVars(s.svg)) problems.push(`${s.name}: var(${v}) resolves nowhere in the file`);
  }
  if (problems.length) {
    console.error(`  ! samples not written:`);
    for (const p of problems) console.error(`      ${p}`);
    return null;
  }

  fs.rmSync(SAMPLES_OUT, { recursive: true, force: true });
  fs.mkdirSync(SAMPLES_OUT, { recursive: true });
  for (const s of samples) fs.writeFileSync(path.join(SAMPLES_OUT, `${s.name}.svg`), s.svg);
  return samples;
}

// ---------------------------------------------------------------- the stages

/*
 * Every species at every growth stage, for the Unity team — the Growth Stages
 * pass's commissioned deliverable ("the team needs to see every state,
 * exported", docs/10-decision-log.md, 2026-09-01). In the game a stage is CSS:
 * `Flora.plant()` draws bloom, sprout and bud together and `.plot[data-stage]`
 * rules choose one. A raw export therefore shows every state at once, exactly
 * like the creatures' eyes.
 *
 * The fix stays inside each file, and it is NOT a hand copy: the growth-staging
 * block is read out of style.css itself on every run, its `.plot[data-stage=X]`
 * selectors rewritten to a `.stage-X` class carried on the exported <svg> root.
 * If the block moves or loses its anchors, this refuses to run rather than
 * writing 76 confidently wrong files.
 */
const STAGES_OUT = path.join(ROOT, 'art', 'exports', 'stages');
const STAGE_WORDS = ['sprout', 'stem', 'bud', 'bloom'];

function stageCss() {
  const css = read('style.css');
  const start = css.indexOf('/* growth staging');
  const end = css.indexOf('/* progress bar */');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('style.css growth-staging anchors moved — stage exports would be a guess');
  }
  let block = css
    .slice(start, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\.plot\[data-stage="(\w+)"\]/g, '.stage-$1')
    .replace(/\.plant \./g, '.')
    .replace(/\.plot \./g, '.')
    .replace(/\n{2,}/g, '\n')
    .trim();
  for (const word of STAGE_WORDS) {
    if (!block.includes(`.stage-${word}`)) {
      throw new Error(`style.css growth-staging block carries no .stage-${word} rule after rewrite`);
    }
  }
  if (/\.plot|\.plant|data-stage/.test(block)) {
    throw new Error('stage-rule rewrite left a game-DOM selector behind — the pattern no longer fits');
  }
  return block;
}

/* The glow halo lives just above the staging block and is part of how a glowing
   species looks at every stage, so it rides along — extracted, not copied. Only
   glowing species get it: a non-glow file declaring var(--glow) nowhere would
   carry an unresolvable reference, and the self-containment check rightly
   refuses that. */
function glowRule() {
  const m = /\.plant\.has-glow\{[^}]*\}/.exec(read('style.css'));
  if (!m) throw new Error('style.css .plant.has-glow rule not found — the glow halo would silently drop from the exports');
  return m[0].replace('.plant.has-glow', '.has-glow');
}

function writeStageExports() {
  let run, defs, style;
  try {
    const context = vm.createContext({});
    vm.runInContext(read('data.js'), context, { filename: 'data.js' });
    vm.runInContext(read('flora.js'), context, { filename: 'flora.js' });
    run = (expr) => vm.runInContext(expr, context);
    run.context = context;
    defs = floraDefs(run);
    style = (glowing) => `<style>${glowing ? glowRule() + '\n' : ''}${stageCss()}</style>`;
  } catch (err) {
    console.error(`  ! stage exports not written — ${err.message}`);
    return null;
  }
  const seedExpr = (id) => `DATA.seeds.find((s) => s.id === ${JSON.stringify(id)})`;

  const files = [];
  const problems = [];
  for (const seed of run('DATA.seeds.map((s) => s.id)')) {
    for (const stage of STAGE_WORDS) {
      const plantMarkup = run(`Flora.plant(${seedExpr(seed)})`);
      const raw = withInternals(plantMarkup, defs + style(plantMarkup.includes('has-glow')));
      const svg = raw.replace('class="plant', `class="plant stage-${stage}`);
      const name = `plant-${seed}-${stage}`;
      if (!svg.includes(`stage-${stage}`)) problems.push(`${name}: stage class not applied`);
      if (!/viewBox="/.test(svg)) problems.push(`${name}: no viewBox`);
      for (const [re, what] of SELF_CONTAINED_WITH_VARS) {
        if (re.test(svg)) problems.push(`${name}: not self-contained — ${what}`);
      }
      for (const v of unresolvedVars(svg)) problems.push(`${name}: var(${v}) resolves nowhere in the file`);
      files.push({ name, svg });
    }
  }
  if (problems.length) {
    console.error(`  ! stage exports not written:`);
    for (const p of problems) console.error(`      ${p}`);
    return null;
  }

  fs.rmSync(STAGES_OUT, { recursive: true, force: true });
  fs.mkdirSync(STAGES_OUT, { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(STAGES_OUT, `${f.name}.svg`), f.svg);

  /* The count assertion, same shape as the icons': measured from the directory. */
  const written = fs.readdirSync(STAGES_OUT).filter((f) => f.endsWith('.svg')).length;
  const expected = run('DATA.seeds.length') * STAGE_WORDS.length;
  if (written !== expected) {
    throw new Error(`stage exports: ${expected} expected (species × 4) but ${written} written`);
  }
  return files;
}

// ---------------------------------------------------------------- the manifest

/*
 * The manifest table in docs/45-asset-inventory.md is generated, because the one
 * column that matters — where each icon is actually used — is the column that goes
 * stale fastest. Only the table between the two markers is written; the prose around
 * it is authored, and is left exactly as it was found.
 */
const MANIFEST_DOC = path.join(ROOT, 'docs', '45-asset-inventory.md');
const MARK_START = '<!-- BEGIN ICON MANIFEST — generated by tools/export-icons.js, do not edit by hand -->';
const MARK_END = '<!-- END ICON MANIFEST -->';
const LIVE_ICONS = 'https://deep-forest-labs.github.io/GardenofWonder/art/exports/icons';

/* Every file that could name an icon. tools/ is excluded on purpose — the spikes are
   standalone prototypes carrying their own frozen copies of the icon set, and counting
   those as usage would report a retired glyph as live. legacy/ likewise. */
function usageSources() {
  return fs
    .readdirSync(ROOT)
    .filter((f) => (f.endsWith('.js') || f === 'index.html') && f !== 'icons.js')
    .sort();
}

/**
 * An icon is asked for in four different shapes, and a scan that knows only the
 * obvious one under-reports badly:
 *
 *   Icons.get('coin')      the direct call
 *   ico('coin')            the short helper, still used in ui-meadow.js
 *   data-icon="coin"       markup hydrated later by Icons.hydrate()
 *   icon: 'coin'           a table row — in data.js, or in a ui-*.js file that keeps
 *                          its own table (the menu's ROWS) — reached at runtime through
 *                          the DYNAMIC form Icons.get(d.icon), which names no icon at
 *                          the call site, so the row is the only evidence there is
 *
 * Matching the bare quoted name instead would be worse than useless: 'grid' is a game
 * event, 'star' and 'leaf' are ordinary words in this codebase, and the column would
 * fill up with sites that never draw an icon.
 */
function scanUsage(names) {
  const known = new Set(names);
  const usage = new Map(names.map((n) => [n, { files: new Set(), tables: new Map() }]));
  const add = (name, file) => { if (known.has(name)) usage.get(name).files.add(file); };

  for (const file of usageSources()) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of text.matchAll(/Icons\.get\(\s*(['"])([A-Za-z0-9_]+)\1\s*\)/g)) add(m[2], file);
    for (const m of text.matchAll(/\bico\(\s*(['"])([A-Za-z0-9_]+)\1\s*\)/g)) add(m[2], file);
    for (const m of text.matchAll(/data-icon\s*=\s*["']([A-Za-z0-9_]+)["']/g)) add(m[1], file);
  }

  /* Rows are attributed to the table that holds them, because "used by
     DATA.upgrades" tells the Unity team something that "used in data.js" does not.
     `data.js` is where almost all of them are; the exception is a ui file with a
     table of its own, and the menu's ROWS is the first — an icon named only there
     read as an orphan until this loop stopped being data.js-only. */
  for (const file of ['data.js', ...usageSources().filter((f) => /^ui-.*\.js$/.test(f))]) {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = /\bicon:\s*(['"])([A-Za-z0-9_]+)\1/.exec(lines[i]);
      if (!m || !known.has(m[2])) continue;
      let table = file;
      for (let j = i; j >= 0; j--) {
        const t = /^ {2}([a-zA-Z0-9_]+):\s*[[{]/.exec(lines[j]);
        const c = /^ *const\s+([A-Za-z0-9_]+)\s*=/.exec(lines[j]);
        if (t) { table = `DATA.${t[1]}`; break; }
        if (c) { table = file === 'data.js' ? c[1] : `${file} ${c[1]}`; break; }
      }
      const tables = usage.get(m[2]).tables;
      tables.set(table, (tables.get(table) || 0) + 1);
    }
  }

  return usage;
}

function describeUsage(entry) {
  const parts = [...entry.files].sort().map((f) => `\`${f}\``);
  for (const [table, n] of [...entry.tables].sort()) {
    parts.push(`\`${table}\`${n > 1 ? ` ×${n}` : ''}`);
  }
  /* An orphan is a real finding, not an error — it is either a glyph waiting for the
     feature that will use it, or dead weight the Unity team should not port. Say so
     rather than leaving the cell blank. */
  return parts.length ? parts.join(', ') : '**not referenced anywhere**';
}

function viewBoxOf(svg) {
  const m = /viewBox="([^"]+)"/.exec(svg);
  return m ? m[1] : '?';
}

/** Rewrite only the table between the markers, leaving the authored prose alone. */
function writeManifest(files) {
  if (!fs.existsSync(MANIFEST_DOC)) {
    console.log(`  (docs/45-asset-inventory.md does not exist yet — manifest not written)`);
    return null;
  }
  const doc = fs.readFileSync(MANIFEST_DOC, 'utf8');
  const a = doc.indexOf(MARK_START);
  const b = doc.indexOf(MARK_END);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(
      `docs/45-asset-inventory.md has no generated-manifest block.\n` +
      `  Add these two lines where the table belongs and run again:\n` +
      `    ${MARK_START}\n    ${MARK_END}`
    );
  }

  const usage = scanUsage(files.map((f) => f.name));
  const rows = [];
  rows.push(MARK_START);
  rows.push('');
  rows.push('| Icon | Name | viewBox | Used by |');
  rows.push('| --- | --- | --- | --- |');
  for (const f of files) {
    rows.push(
      `| <img src="${LIVE_ICONS}/${f.name}.svg" width="26" height="26" alt="${f.name}"> ` +
      `| \`${f.name}\` | \`${viewBoxOf(f.svg)}\` | ${describeUsage(usage.get(f.name))} |`
    );
  }
  const orphans = files.filter((f) => !usage.get(f.name).files.size && !usage.get(f.name).tables.size);
  rows.push('');
  rows.push(
    `_${files.length} icons, all exported to [\`art/exports/icons/\`](../art/exports/icons). ` +
    (orphans.length
      ? `${orphans.length} of them (${orphans.map((o) => `\`${o.name}\``).join(', ')}) ${orphans.length === 1 ? 'is' : 'are'} drawn by no code in the game today — either a glyph waiting for its feature, or dead weight not worth porting._`
      : `Every one of them is referenced by the game._`)
  );
  rows.push('');
  rows.push(MARK_END);

  fs.writeFileSync(MANIFEST_DOC, doc.slice(0, a) + rows.join('\n') + doc.slice(b + MARK_END.length));
  return { rows: files.length, orphans: orphans.map((o) => o.name) };
}

function main() {
  const Icons = loadRegistry();
  const names = Object.keys(Icons.LIB).sort();
  if (!names.length) throw new Error('the icon registry is empty');

  const files = [];
  const problems = [];

  for (const name of names) {
    /* has() is the exact test; get() is the one that falls back. Asking both means
       a name that somehow reached this list without being a real icon is caught
       here rather than shipping as a duplicate sparkle. */
    if (!Icons.has(name)) { problems.push(`${name}: in LIB but Icons.has() says no`); continue; }
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) { problems.push(`${name}: not a plain filename-safe name`); continue; }

    let svg;
    try {
      svg = standalone(Icons.get(name), name);
    } catch (err) {
      problems.push(err.message);
      continue;
    }
    for (const [re, what] of EXTERNAL_REFS) {
      if (re.test(svg)) problems.push(`${name}: not self-contained — ${what}`);
    }
    files.push({ name, svg, file: path.join(OUT, `${name}.svg`) });
  }

  if (problems.length) {
    console.error(`\nexport-icons — ${problems.length} problem(s), nothing written:\n`);
    for (const p of problems) console.error(`  ! ${p}`);
    console.error('');
    return 1;
  }

  if (CHECK_ONLY) {
    const missing = files.filter((f) => !fs.existsSync(f.file));
    const stale = files.filter((f) => fs.existsSync(f.file) && fs.readFileSync(f.file, 'utf8') !== f.svg);
    const extra = fs.existsSync(OUT)
      ? fs.readdirSync(OUT).filter((f) => f.endsWith('.svg') && !names.includes(f.slice(0, -4)))
      : [];
    if (missing.length || stale.length || extra.length) {
      console.error(`\nexport-icons --check — art/exports/icons/ does not match icons.js:\n`);
      for (const f of missing) console.error(`  missing  ${f.name}.svg`);
      for (const f of stale) console.error(`  stale    ${f.name}.svg`);
      for (const f of extra) console.error(`  orphan   ${f}  (no such icon in the registry)`);
      console.error(`\nRun: node tools/export-icons.js\n`);
      return 1;
    }
    console.log(`\nexport-icons --check — all ${files.length} exports match icons.js\n`);
    return 0;
  }

  /* Wholesale: clear the directory first, so an icon RENAMED in icons.js leaves no
     ghost .svg behind for the manifest to link and the Unity team to import. */
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of files) fs.writeFileSync(f.file, f.svg);

  /* The assertion this whole script exists for. Counted from the directory rather
     than from the loop, so it measures what actually landed on disk. */
  const written = fs.readdirSync(OUT).filter((f) => f.endsWith('.svg'));
  const registry = Object.keys(Icons.LIB).length;
  if (written.length !== registry) {
    console.error(
      `\nexport-icons — the registry holds ${registry} icons but ${written.length} files were written.\n` +
      `  An icon in icons.js with no .svg beside it is a glyph missing from the Unity build\n` +
      `  and from the manifest in docs/45-asset-inventory.md, silently.\n`
    );
    return 1;
  }

  const samples = writeSamples();
  const stages = writeStageExports();
  const manifest = writeManifest(files);

  const bytes = files.reduce((a, f) => a + Buffer.byteLength(f.svg), 0);
  console.log(`\nexport-icons — ${written.length} icons, ${(bytes / 1024).toFixed(1)}KB, in ${path.relative(ROOT, OUT)}/`);
  console.log(`  registry count and export count agree at ${registry}`);
  if (samples) {
    console.log(`  ${samples.length} art samples in ${path.relative(ROOT, SAMPLES_OUT)}/ — ${samples.map((x) => x.name).join(', ')}`);
  }
  if (stages) {
    console.log(`  ${stages.length} stage exports in ${path.relative(ROOT, STAGES_OUT)}/ — every species at sprout, stem, bud and bloom, stage rules read out of style.css`);
  }
  if (manifest) {
    console.log(
      `  manifest table in docs/45-asset-inventory.md rewritten — ${manifest.rows} rows` +
      (manifest.orphans.length ? `, ${manifest.orphans.length} referenced by nothing: ${manifest.orphans.join(', ')}` : '')
    );
  }
  console.log('');
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`\nexport-icons failed: ${err.message}\n`);
  process.exit(2);
}
