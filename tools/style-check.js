#!/usr/bin/env node
//
// style-check.js — hold style.css to the rules in docs/05-art-direction.md.
//
// The Garden Standard audit of 2026-08-26 found that every rule in the art
// direction was already agreed with and none of them held. They did not fail
// because anyone disagreed; they failed because nothing noticed. This notices.
//
// No dependencies, in keeping with the rest of the project. It is a small
// CSS reader rather than a parser: it masks comments, strings and url() so a
// `#` or a `;` inside one cannot be mistaken for a value, then walks blocks
// with a brace stack and reads declarations out of them.
//
// Usage:
//   node tools/style-check.js              report, and fail on new debt
//   node tools/style-check.js --strict     fail on ALL debt, including the baseline
//   node tools/style-check.js --update-baseline   re-record the counts after a sweep
//   node tools/style-check.js --quiet      counts only, no per-line listing
//
// Five checks, and only three of them can fail a build:
//
//   hex     a raw hex colour outside :root                     FAILS
//   lip     a box-shadow lip that is translucent               FAILS
//   var     an undeclared custom property with NO fallback      FAILS
//   varSoft an undeclared custom property WITH a fallback       reports
//   radius  a corner radius outside the documented ladder      reports
//   border  how many distinct border widths exist              counts only
//
// Radius and border only report because the geometry sweep is deliberately
// deferred (docs/11-known-issues.md) — this measures it so the sweep can be
// scoped, and refuses to be the thing that decides to do it.
//
// `varSoft` reports for a different reason. `var(--x)` with no fallback drops
// the whole declaration at computed-value time and shows nothing, which is the
// bug this check exists for. `var(--x, 12px)` draws the fallback — which is how
// a knob is written BEFORE the data that feeds it lands, and failing on that
// would fire on correct work in progress. Reported so it cannot hide, not
// gated so it cannot be worked around.
//
// The baseline is the point. A check that fails on the first run and every run
// after it gets switched off within a week. `tools/style-check.json` records
// the debt that already existed, so the check passes today and fails the moment
// anyone adds to it — a ratchet, not a verdict on the past.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CSS = path.join(ROOT, 'style.css');
const BASELINE = path.join(__dirname, 'style-check.json');

// Custom properties are also declared from JavaScript — `setProperty('--p', …)`
// and `style="--p:42%"` in a template literal — so the undeclared-variable
// check has to read these too or it invents violations for every live one.
// Read every script the game loads rather than a hand-kept list: `--dx` and
// `--dy` live in hollow.js, and a list is exactly the thing that goes stale and
// then reports a live variable as missing.
function jsSources() {
  return fs.readdirSync(ROOT)
    .filter((f) => (f.endsWith('.js') && f !== 'sw.js') || f === 'index.html')
    .sort();
}

// docs/05-art-direction.md: "Border radii of 12, 18 and 26 px", plus the pill
// and the circle. `0` and `inherit` are not inventions.
const ALLOWED_RADII = new Set(['0', '12px', '18px', '26px', '50%', '999px', 'inherit']);

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const QUIET = args.includes('--quiet');
const UPDATE = args.includes('--update-baseline');

// ---------------------------------------------------------------- masking

// Replace a span with spaces rather than removing it, so every offset and
// every line number still points at the real file.
function blank(chars, from, to) {
  for (let i = from; i < to && i < chars.length; i++) {
    if (chars[i] !== '\n') chars[i] = ' ';
  }
}

function mask(src) {
  const chars = src.split('');
  for (let i = 0; i < chars.length; i++) {
    const two = src.slice(i, i + 2);
    if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? chars.length : end + 2;
      blank(chars, i, stop);
      i = stop - 1;
    } else if (chars[i] === '"' || chars[i] === "'") {
      const quote = chars[i];
      let j = i + 1;
      while (j < chars.length && chars[j] !== quote && chars[j] !== '\n') {
        if (chars[j] === '\\') j++;
        j++;
      }
      blank(chars, i, j + 1);
      i = j;
    } else if (src.slice(i, i + 4).toLowerCase() === 'url(') {
      const end = src.indexOf(')', i);
      const stop = end === -1 ? chars.length : end;
      blank(chars, i + 4, stop);
      i = stop;
    }
  }
  return chars.join('');
}

function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };
}

// ---------------------------------------------------------------- reading

// Walk the masked CSS with a brace stack. Yields one record per declaration,
// carrying the selector stack it was found under so `:root` can be recognised.
function declarations(masked) {
  const out = [];
  const stack = [];
  let buf = '';
  let bufAt = 0;

  const take = () => {
    const text = buf.trim();
    const at = bufAt + (buf.length - buf.trimStart().length);
    buf = '';
    return { text, at };
  };

  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (buf === '') bufAt = i;
    if (ch === '{') {
      stack.push(take().text);
      buf = '';
    } else if (ch === '}') {
      const { text, at } = take();
      if (text) pushDecl(out, stack, text, at);
      stack.pop();
      buf = '';
    } else if (ch === ';') {
      const { text, at } = take();
      if (text && stack.length) pushDecl(out, stack, text, at);
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

function pushDecl(out, stack, text, at) {
  const colon = text.indexOf(':');
  if (colon === -1) return;
  // A `:` also starts a pseudo-class, so anything that never got a value is a
  // stray selector rather than a declaration.
  const prop = text.slice(0, colon).trim();
  const value = text.slice(colon + 1).trim();
  if (!prop || !value || /\s/.test(prop.replace(/^--/, ''))) return;
  out.push({
    prop: prop.toLowerCase(),
    rawProp: prop,
    value,
    at: at + colon + 1,
    selectors: stack.slice(),
  });
}

const isRoot = (d) => d.selectors.some((s) => /(^|[,\s])::?root\b/.test(s));

// Split on commas that are not inside parentheses — one box-shadow value is
// several shadows, and `rgba(…)` is full of commas that are not separators.
function splitTop(value, sep) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// ---------------------------------------------------------------- checks

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const TRANSLUCENT = /\b(?:rgba|hsla)\s*\(|\brgb\s*\([^)]*\/|\bhsl\s*\([^)]*\//i;
const LENGTH = /^[-+]?(?:\d*\.\d+|\d+)(px|em|rem|%|vh|vw|vmin|vmax)?$/;

function checkHex(decls, lineAt) {
  const found = [];
  for (const d of decls) {
    if (isRoot(d)) continue;
    // A hex assigned to a custom property is a token definition, not a raw
    // colour — doc 05 blesses component-local tokens (the --mw-stone-* pattern).
    if (d.rawProp.startsWith('--')) continue;
    let m;
    HEX.lastIndex = 0;
    while ((m = HEX.exec(d.value))) {
      found.push({ line: lineAt(d.at + m.index), value: m[0], prop: d.prop, where: d.selectors[d.selectors.length - 1] });
    }
  }
  return found;
}

function checkLocalTokens(decls, lineAt) {
  const found = [];
  for (const d of decls) {
    if (isRoot(d) || !d.rawProp.startsWith('--')) continue;
    if (!HEX.test(d.value)) { HEX.lastIndex = 0; continue; }
    HEX.lastIndex = 0;
    found.push({ line: lineAt(d.at), value: d.rawProp, prop: d.prop, where: d.selectors[d.selectors.length - 1] });
  }
  return found;
}

// docs/05: "Search the diff for `0 3px 0 rgba(` before you push." A lip is an
// object's own extruded SIDE WALL, so it is the shadow with a vertical offset
// and no blur. Three things are deliberately not lips and are not flagged:
// an `inset` shadow (the recipe's lit top and shaded bottom edge), a ring
// (`0 0 0 3px rgba(…)`, which doc 05 blesses for rarity and state), and a
// blurred contact shadow (which is meant to be translucent).
function checkLips(decls, lineAt) {
  const found = [];
  for (const d of decls) {
    if (!/^(-webkit-)?box-shadow$/.test(d.prop)) continue;
    for (const layer of splitTop(d.value, ',')) {
      if (/\binset\b/i.test(layer)) continue;
      if (/^\s*(none|inherit|initial|unset|var\()/i.test(layer)) continue;
      if (!TRANSLUCENT.test(layer)) continue;
      const lengths = layer.replace(/\b(?:rgba|hsla|rgb|hsl|var|calc)\s*\([^)]*\)/gi, ' ')
        .trim().split(/\s+/).filter((t) => LENGTH.test(t));
      // Two lengths means blur defaults to 0; three or more means blur is stated.
      const blur = lengths.length >= 3 ? lengths[2] : '0';
      const y = lengths.length >= 2 ? lengths[1] : '0';
      if (parseFloat(blur) !== 0) continue;
      if (parseFloat(y) === 0) continue;
      found.push({ line: lineAt(d.at), value: layer, prop: d.prop, where: d.selectors[d.selectors.length - 1] });
    }
  }
  return found;
}

function checkRadii(decls, lineAt) {
  const found = [];
  for (const d of decls) {
    if (!/^border(-\w+)?-radius$/.test(d.prop) && d.prop !== 'border-radius') continue;
    if (/var\(|calc\(/i.test(d.value)) continue;
    for (const corner of splitTop(d.value, '/')) {
      for (const token of new Set(corner.split(/\s+/).filter(Boolean))) {
        const norm = token === '0px' || token === '0%' ? '0' : token;
        if (ALLOWED_RADII.has(norm)) continue;
        found.push({ line: lineAt(d.at), value: token, prop: d.prop, where: d.selectors[d.selectors.length - 1] });
      }
    }
  }
  return found;
}

function checkBorders(decls, lineAt) {
  const found = [];
  for (const d of decls) {
    if (!/^border(-(top|right|bottom|left))?(-width)?$/.test(d.prop)) continue;
    if (/^(none|0)$/.test(d.value)) continue;
    for (const token of d.value.split(/\s+/)) {
      if (/^\d*\.?\d+px$/.test(token)) {
        found.push({ line: lineAt(d.at), value: token, prop: d.prop, where: d.selectors[d.selectors.length - 1] });
        break;
      }
    }
  }
  return found;
}

function checkVars(decls, lineAt, jsDeclared) {
  const declared = new Set(jsDeclared);
  for (const d of decls) if (d.rawProp.startsWith('--')) declared.add(d.rawProp);

  const found = [];
  const seen = new Set();
  for (const d of decls) {
    const re = /var\(\s*(--[\w-]+)/g;
    let m;
    while ((m = re.exec(d.value))) {
      const name = m[1];
      if (declared.has(name)) continue;
      const line = lineAt(d.at + m.index);
      const key = `${name}@${line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const hasFallback = /var\(\s*--[\w-]+\s*,/.test(d.value.slice(m.index));
      found.push({ line, value: name, prop: d.prop, where: d.selectors[d.selectors.length - 1], hasFallback });
    }
  }
  return found;
}

// A custom property set from JavaScript is declared, even though style.css
// never names it. Missing this is how the check invents violations for --p.
function jsDeclaredProps() {
  const names = new Set();
  for (const file of jsSources()) {
    const full = path.join(ROOT, file);
    const src = fs.readFileSync(full, 'utf8');
    for (const m of src.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) names.add(m[1]);
    for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) names.add(m[1]);
  }
  return names;
}

// ---------------------------------------------------------------- report

const FATAL = ['hex', 'lip', 'var'];

const TITLES = {
  hex: 'Raw hex colours outside :root  — use a token (docs/05, Palette)',
  lip: 'Translucent box-shadow lips  — a lip is opaque (docs/05, the house material)',
  var: 'Custom properties used with NO fallback and never declared  — the --ink-soft class of bug',
  varSoft: 'Custom properties never declared, but written with a fallback  — reported, not enforced',
  radius: 'Corner radii outside 12 / 18 / 26 / 999px / 50%  — reported, not enforced',
  border: 'Border widths  — counted, not enforced (the geometry sweep is deferred)',
};

function tally(found) {
  const counts = new Map();
  for (const f of found) counts.set(f.value, (counts.get(f.value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function main() {
  const src = fs.readFileSync(CSS, 'utf8');
  const masked = mask(src);
  const lineAt = lineIndex(src);
  const decls = declarations(masked);

  const undeclared = checkVars(decls, lineAt, jsDeclaredProps());
  const results = {
    hex: checkHex(decls, lineAt),
    lip: checkLips(decls, lineAt),
    var: undeclared.filter((f) => !f.hasFallback),
    varSoft: undeclared.filter((f) => f.hasFallback),
    radius: checkRadii(decls, lineAt),
    border: checkBorders(decls, lineAt),
  };
  const localTokens = checkLocalTokens(decls, lineAt);

  const baseline = fs.existsSync(BASELINE)
    ? JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
    : {};

  if (UPDATE) {
    const next = {};
    for (const key of FATAL) next[key] = results[key].length;
    fs.writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`baseline written to ${path.relative(ROOT, BASELINE)}:`);
    for (const key of FATAL) console.log(`  ${key.padEnd(7)} ${next[key]}`);
    return 0;
  }

  let failed = false;
  for (const key of ['hex', 'lip', 'var', 'varSoft', 'radius', 'border']) {
    const found = results[key];
    const distinct = tally(found);
    const cap = STRICT ? 0 : (baseline[key] ?? 0);
    const gate = FATAL.includes(key);
    const over = gate && found.length > cap;
    if (over) failed = true;

    const status = !gate
      ? ''
      : over
        ? `  ← ${found.length - cap} MORE THAN THE BASELINE OF ${cap}`
        : found.length === 0
          ? '  ← clean'
          : `  ← at or under the baseline of ${cap}`;

    console.log(`\n${TITLES[key]}`);
    console.log(`${found.length} occurrence${found.length === 1 ? '' : 's'}, ${distinct.length} distinct${status}`);

    if (key === 'border' || (key === 'varSoft' && found.length > 12) || QUIET) {
      for (const [value, n] of distinct) console.log(`    ${String(n).padStart(4)} ×  ${value}`);
      continue;
    }
    if (!found.length) continue;
    for (const f of found.slice(0, STRICT || over ? found.length : 40)) {
      const note = f.hasFallback ? '  (has a fallback)' : '';
      console.log(`    style.css:${String(f.line).padEnd(5)} ${f.value}${note}   in ${f.where || '?'} { ${f.prop} }`);
    }
    if (!STRICT && !over && found.length > 40) console.log(`    … and ${found.length - 40} more`);
  }

  if (localTokens.length) {
    console.log('\nComponent-local colour tokens (allowed — the --mw-stone-* pattern)');
    console.log(`${localTokens.length} declared outside :root`);
  }

  console.log('');
  if (failed) {
    console.log('FAILED — the style guide is a rule again, and this change breaks it.');
    console.log('Fix it, or if the new value is deliberate, add it to docs/05-art-direction.md');
    console.log('with the reason and re-record with --update-baseline.');
  } else {
    console.log('OK — no new drift off docs/05-art-direction.md.');
  }
  return failed ? 1 : 0;
}

process.exit(main());
