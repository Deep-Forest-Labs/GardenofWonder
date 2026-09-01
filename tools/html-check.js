#!/usr/bin/env node
//
// html-check.js — hold the escaping ruling in docs/11-known-issues.md.
//
// THE RULING: player-supplied text never enters a template literal. A field
// that can hold free text gets an empty labelled node from the template and is
// filled with `.textContent` in one pass afterwards; attribute cases go through
// `setAttribute` or `.value`. No `esc()` helper is written, because a blanket
// escape needs 468 hand-judged opt-outs across the six `ui-*.js` files and each
// mistake is a silent visual break rather than a crash.
//
// The ruling was written on 2026-08-30, BEFORE there was any free text to
// protect. This check was specified in the same entry, in the shape of
// `tools/style-check.js`: no dependencies, a small text reader, and a
// `html-check.json` baseline that ratchets rather than judges. It passes green
// on an empty field list, which is the only way a check written before its
// feature lives long enough to meet it.
//
// `tools/sim-test.js` cannot hold this. It loads `data.js`, `icons.js` and
// `game.js` and contains no reference to `document` — and `game.js` staying
// DOM-free is what makes that suite cheap and what is meant to survive the
// Unity port. So this reads the files instead.
//
// Usage:
//   node tools/html-check.js               report, and fail on new debt
//   node tools/html-check.js --strict      fail on ALL debt, including the baseline
//   node tools/html-check.js --update-baseline   re-record after a sweep
//
// One rule today, and it is the one the ruling asked for:
//
//   text   an accessor for a free-text state field inside a template literal
//
// FIELDS below is the named list. `state.profile.name` is its first entry, added
// with the menu on 2026-08-31. Anything else that can hold what a player typed
// joins it on the day it ships, not later.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = path.join(__dirname, 'html-check.json');

const STRICT = process.argv.includes('--strict');
const UPDATE = process.argv.includes('--update-baseline');

/* Every way the game reaches a free-text field, as a source-text pattern. The
   accessors are listed rather than the field, because `state.profile.name`,
   `S.profile.name` and `Game.profileName()` are the same fact spelled three
   ways and a check that knew only one would pass while the other two shipped
   the bug. Add every spelling when you add a field. */
const FIELDS = [
  {
    field: 'state.profile.name',
    why: 'the player\'s own name — the first free text this game holds',
    accessors: [
      /\bprofileName\s*\(\s*\)/,
      /\bprofile\s*\(\s*\)\s*\.\s*name\b/,
      /\b(?:state|S)\s*\.\s*profile\s*\.\s*name\b/,
    ],
  },
];

/* Which files the ruling governs. `game.js` is excluded on purpose: it never
   touches the DOM, so a template literal there is a string for something else
   to decide about. `index.html` is included because a template in an inline
   script is the same hazard wearing a different extension. */
function sources() {
  return fs.readdirSync(ROOT)
    .filter((f) => (/^ui-.*\.js$/.test(f) || f === 'ui.js' || f === 'index.html'))
    .sort();
}

/* A template literal is found by walking the file character by character rather
   than by regular expression, because the thing being looked for is NESTING:
   `${a ? `<b>${name}</b>` : ''}` puts the accessor two levels down, and the
   whole point of the span is to cover it.

   A backtick alone cannot tell you which way the nesting went — the first
   backtick inside a template opens a NEW template (it can only appear inside a
   `${}`), it does not close the outer one. Counting them as a single depth is
   what makes a nested case read as a closed span and slip through silently; it
   did, and this walker went red only after being sabotaged three ways. So it
   keeps a mode stack instead: `tpl` frames and `expr` frames, with a brace
   counter on each expression so an object literal inside one cannot end it.

   Quotes, comments and escapes are skipped in both modes, so a backtick inside
   any of them cannot open a phantom template — the same failure this codebase
   already records for a backtick inside an HTML comment. */
function templateSpans(text) {
  const spans = [];
  const stack = [];      // 'tpl' | 'expr', innermost last
  const braces = [];     // brace depth for each 'expr' frame
  let start = 0;
  let i = 0;
  const n = text.length;
  const mode = () => (stack.length ? stack[stack.length - 1] : 'code');

  const skipString = (q) => {
    i += 1;
    while (i < n && text[i] !== q) { if (text[i] === '\\') i += 1; i += 1; }
    i += 1;
  };

  while (i < n) {
    const c = text[i];
    const next = text[i + 1];
    const m = mode();

    if (c === '\\') { i += 2; continue; }

    if (m === 'tpl') {
      if (c === '`') {
        stack.pop();
        if (!stack.length) spans.push([start, i + 1]);
        i += 1;
        continue;
      }
      if (c === '$' && next === '{') { stack.push('expr'); braces.push(0); i += 2; continue; }
      i += 1;
      continue;
    }

    // 'code' and 'expr' share their skipping; only their terminators differ.
    if (c === '/' && next === '/') { while (i < n && text[i] !== '\n') i += 1; continue; }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '\'' || c === '"') { skipString(c); continue; }
    if (c === '`') {
      if (!stack.length) start = i;
      stack.push('tpl');
      i += 1;
      continue;
    }
    if (m === 'expr') {
      if (c === '{') { braces[braces.length - 1] += 1; i += 1; continue; }
      if (c === '}') {
        if (braces[braces.length - 1] === 0) { stack.pop(); braces.pop(); i += 1; continue; }
        braces[braces.length - 1] -= 1;
        i += 1;
        continue;
      }
    }
    i += 1;
  }
  /* An unterminated template means the walker lost its place — report the tail
     rather than dropping it, so a parse failure surfaces as a finding instead
     of as silence. */
  if (stack.length) spans.push([start, n]);
  return spans;
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

function scan() {
  const found = [];
  for (const file of sources()) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const spans = templateSpans(text);
    if (!spans.length) continue;
    for (const [a, b] of spans) {
      const chunk = text.slice(a, b);
      for (const f of FIELDS) {
        for (const re of f.accessors) {
          const m = re.exec(chunk);
          if (!m) continue;
          found.push({
            file,
            line: lineOf(text, a + m.index),
            field: f.field,
            snippet: chunk.slice(Math.max(0, m.index - 24), m.index + 40).replace(/\s+/g, ' ').trim(),
          });
        }
      }
    }
  }
  return found;
}

function main() {
  const found = scan();
  const baseline = (() => {
    try { return JSON.parse(fs.readFileSync(BASELINE, 'utf8')); } catch (e) { return { text: 0 }; }
  })();

  if (UPDATE) {
    fs.writeFileSync(BASELINE, `${JSON.stringify({ text: found.length }, null, 2)}\n`);
    console.log(`baseline written to ${path.relative(ROOT, BASELINE)}: text ${found.length}`);
    return 0;
  }

  const cap = STRICT ? 0 : (baseline.text ?? 0);
  const over = found.length > cap;

  console.log('\nFree-text state fields watched (docs/11-known-issues.md, the escaping ruling)');
  for (const f of FIELDS) console.log(`  ${f.field.padEnd(22)} ${f.why}`);
  console.log(`  ${String(FIELDS.length)} field${FIELDS.length === 1 ? '' : 's'}, across ${sources().length} files`);

  console.log('\nAccessors reached from inside a template literal  — the ruling forbids this');
  console.log(`${found.length} occurrence${found.length === 1 ? '' : 's'}${
    over ? `  ← ${found.length - cap} MORE THAN THE BASELINE OF ${cap}` : found.length ? `  ← at or under the baseline of ${cap}` : '  ← clean'}`);
  for (const f of found) {
    console.log(`    ${f.file}:${String(f.line).padEnd(5)} ${f.field}   …${f.snippet}…`);
  }

  console.log('');
  if (over) {
    console.log('FAILED — player text has reached a template literal.');
    console.log('The fix is never an escape function. Give the template an empty labelled node');
    console.log('  <span class="…" data-pname></span>');
    console.log('and fill it with .textContent after the panel is written; use setAttribute or');
    console.log('.value for an attribute. See docs/11-known-issues.md and paintName() in ui-menu.js.');
    return 1;
  }
  console.log('OK — no player text inside a template literal.');
  return 0;
}

process.exit(main());
