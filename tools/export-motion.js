#!/usr/bin/env node
//
// export-motion.js — write the motion inventory into docs/50-motion-bible.md.
//
//   node tools/export-motion.js            rewrite the generated half of doc 50
//   node tools/export-motion.js --check    exit 1 if that half no longer matches the code
//   node tools/export-motion.js --css FILE --doc FILE
//                                          read another stylesheet and write another doc —
//                                          how a scratch edit is proved to move the table
//                                          without touching the real ones
//
// docs/05-art-direction.md once gave the game's number of keyframe animations. By the time
// anyone counted again it was out by more than seventy, and nothing had gone red, because a
// number written into a paragraph by hand has nothing holding it. This holds it. The
// inventory in doc 50 is READ OUT OF THE SOURCE on every run: every @keyframes in style.css,
// every rule that plays one, every transition, every reduced-motion rule that answers them,
// every FX call in the JavaScript, and every piece of requestAnimationFrame / reflow-restart
// choreography. Only the block between the two markers is written; the prose around it is
// authored and is left exactly as it was found.
//
// THE POINT OF THIS SCRIPT IS THAT IT REFUSES. A generated document that lies is worse than
// a blank one (docs/45 learned it the hard way, when a scan that read one file reported four
// live icons as unused), so nothing is written unless:
//   - the @keyframes it parsed agree in number with a plain scan for the at-rule;
//   - no keyframe name is declared twice (the later body would win silently);
//   - every keyframe is played by something — a rule in style.css, or its name where the
//     JavaScript sets an animation;
//   - every rule that plays a keyframe names one that exists;
//   - every FX call in the game names a function fx.js actually exports;
//   - every rule the browser would drop is a known, filed one — and every known one is
//     still there (KNOWN_DROPPED, below).
//
// It is a small CSS reader, not a parser, in the same spirit as tools/style-check.js: it
// blanks comments, steps over strings, walks blocks with a brace counter, and reads
// declarations out of them. It refuses CSS nesting rather than guessing at it. And it drops
// what a browser drops: a stray `}` or `;` with no block to belong to is folded by the CSS
// parser into the NEXT rule's selector, which kills that rule without a word — which is how
// the flower's rain pose went missing for three weeks while every table said it played.
//
// THE REDUCED-MOTION COLUMN IS WORKED OUT, NOT WRITTEN DOWN. style.css carries a global
// clamp — every animation runs once for .001ms and every transition takes .08s, all
// !important — and answers individual pieces of motion in reduced-motion blocks spread
// through the file, some above the clamp and most below it. For each rule that plays a keyframe this script asks the cascade
// the same question a browser does: is there a reduced-motion rule whose selector covers
// this one, and does it win (importance, then specificity, then source order)? A cancel that
// LOSES is reported as such, because a media query adds no specificity and a cancel placed
// above, or written less specifically than, the rule it cancels does nothing — the failure
// the meadow's clouds shipped with. Where nothing answers a rule, the clamp does, and the
// column says what the player then sees: the element's own style, or — when the animation
// fills forwards — its END FRAME, flagged when that frame is invisible. That is the whole
// floating-number bug (docs/HANDOFF.md, "The global reduced-motion clamp had silently
// deleted every floating number in the game") written as a check. "Covers" is decided
// syntactically and conservatively: a reduced-motion selector covers a rule when its own
// compounds are a subset of the rule's, aligned from the element outward.
//
// No dependencies, no build step — the same rules as the rest of the repo.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

/* Anything unrecognised is an error, like tools/probe.js: a typo'd `-check` that quietly
   ran the writer instead would rewrite the doc it was meant to inspect. */
const FLAGS = new Set(['--check', '--css', '--doc']);
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (a === '--css' || a === '--doc') { i += 1; continue; }
  if (!FLAGS.has(a)) {
    console.error(`\nexport-motion: unknown argument ${a}\n`);
    process.exit(2);
  }
}

function argPath(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) {
    console.error(`\nexport-motion: ${flag} needs a file path after it\n`);
    process.exit(2);
  }
  return path.resolve(process.cwd(), v);
}

const CHECK_ONLY = process.argv.includes('--check');
const CSS_FILE = argPath('--css') || path.join(ROOT, 'style.css');
const DOC_FILE = argPath('--doc') || path.join(ROOT, 'docs', '50-motion-bible.md');
const FX_FILE = path.join(ROOT, 'fx.js');

const MARK_START = '<!-- BEGIN MOTION INVENTORY — generated by tools/export-motion.js, do not edit by hand -->';
const MARK_END = '<!-- END MOTION INVENTORY -->';

// ---------------------------------------------------------------- reading CSS

function skipString(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q) j += s[j] === '\\' ? 2 : 1;
  return Math.min(s.length, j + 1);
}

/* Comments are blanked rather than removed, so every offset still lands on the line it
   came from. Strings are stepped over whole: a `/*` inside a url() string is not a
   comment, and a `{` inside a content string is not a block. The comments matter more
   here than anywhere — this stylesheet's comments quote `animation:` declarations in
   order to warn about them. */
function maskCssComments(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out += css.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (css[i] === '"' || css[i] === "'") {
      const stop = skipString(css, i);
      out += css.slice(i, stop);
      i = stop;
    } else {
      out += css[i];
      i += 1;
    }
  }
  return out;
}

function lineCounter(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
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

/** The first of `stops` at bracket depth 0 from `i`, stepping over strings. */
function scanTo(s, i, end, stops) {
  let depth = 0;
  while (i < end) {
    const c = s[i];
    if (c === '"' || c === "'") { i = skipString(s, i); continue; }
    if (c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') depth -= 1;
    else if (depth === 0 && stops.includes(c)) return i;
    i += 1;
  }
  return end;
}

/** The `}` that closes the `{` at `open`. */
function closeOf(s, open, end, lineAt) {
  let depth = 0;
  for (let i = open; i < end; i += 1) {
    const c = s[i];
    if (c === '"' || c === "'") { i = skipString(s, i) - 1; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`style.css: the block opened at line ${lineAt(open)} never closes`);
}

/** Split on a separator at bracket depth 0 — the comma inside :not(a,b) or cubic-bezier() is not one. */
function splitTop(text, sep) {
  const out = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"' || c === "'") { i = skipString(text, i) - 1; continue; }
    if (c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') depth -= 1;
    else if (depth === 0 && c === sep) {
      out.push(text.slice(from, i));
      from = i + 1;
    }
  }
  out.push(text.slice(from));
  return out.map((x) => x.trim()).filter(Boolean);
}

/** Whitespace-separated words at bracket depth 0 — `var(--dur, .5s)` is one word. */
function words(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') depth -= 1;
    if (depth === 0 && /\s/.test(c)) {
      if (cur) out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** The text with every quoted string blanked — so a `{` or `;` inside `content:"{"` is not structure. */
function blankStrings(t) {
  let out = '';
  for (let i = 0; i < t.length; i += 1) {
    if (t[i] === '"' || t[i] === "'") {
      const j = skipString(t, i);
      out += ' '.repeat(j - i);
      i = j - 1;
    } else {
      out += t[i];
    }
  }
  return out;
}

function parseDecls(css, start, end, lineAt) {
  const out = [];
  for (const part of splitTop(css.slice(start, end), ';')) {
    if (blankStrings(part).includes('{')) {
      throw new Error(
        `style.css: a block nested inside a rule at line ${lineAt(start)}. This reader does not ` +
        'understand CSS nesting — teach it before trusting any table it writes.'
      );
    }
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    const raw = part.slice(0, colon).trim();
    const prop = raw.startsWith('--') ? raw : raw.toLowerCase();
    let value = part.slice(colon + 1).replace(/\s+/g, ' ').trim();
    let important = false;
    const imp = /\s*!\s*important\s*$/i.exec(value);
    if (imp) {
      important = true;
      value = value.slice(0, imp.index).trim();
    }
    out.push({ prop, value, important });
  }
  return out;
}

const stopKey = (k) => {
  const t = k.trim().toLowerCase();
  if (t === 'from') return 0;
  if (t === 'to') return 100;
  const m = /^(-?\d*\.?\d+)%$/.exec(t);
  return m ? Number(m[1]) : NaN;
};

function parseStops(css, start, end, lineAt, name) {
  const stops = [];
  let i = start;
  while (i < end) {
    while (i < end && /\s/.test(css[i])) i += 1;
    if (i >= end) break;
    const at = scanTo(css, i, end, '{;}');
    if (at >= end || css[at] !== '{') {
      throw new Error(`style.css: @keyframes ${name} has text outside a stop at line ${lineAt(i)}`);
    }
    const keys = splitTop(css.slice(i, at), ',').map(stopKey);
    if (keys.some((k) => Number.isNaN(k))) {
      throw new Error(`style.css: @keyframes ${name} has a stop that is not a percentage at line ${lineAt(i)}`);
    }
    const close = closeOf(css, at, end, lineAt);
    stops.push({ keys, decls: parseDecls(css, at + 1, close, lineAt) });
    i = close + 1;
  }
  return stops;
}

const REDUCE = /prefers-reduced-motion\s*:\s*reduce/i;

/* A browser drops a rule it cannot read, silently, and so must this: a table that lists a
   rule the browser threw away is exactly the lie this script exists to refuse. Two shapes
   are caught — a selector that is not one (a keyframe stop such as `50%` left outside its
   @keyframes), and a stray `}` or `;` with no block to belong to, which the CSS parser
   folds into the NEXT rule's selector and so drops that rule too, however valid it looks. */
/* A pseudo-class a browser does not know drops the whole rule, exactly as a stray brace does
   (a typo'd `:hoverr` is dropped in Chrome). Vendor pseudo-elements are the one exception:
   each engine keeps its own and drops the others', so they are kept here and carry no motion. */
const KNOWN_PSEUDO = new Set([
  'active', 'hover', 'focus', 'focus-visible', 'focus-within', 'visited', 'link', 'target',
  'not', 'is', 'where', 'has', 'root', 'empty', 'checked', 'disabled', 'enabled', 'default',
  'first-child', 'last-child', 'only-child', 'nth-child', 'nth-last-child', 'first-of-type',
  'last-of-type', 'only-of-type', 'nth-of-type', 'nth-last-of-type', 'placeholder-shown',
  'invalid', 'valid', 'required', 'optional', 'read-only', 'read-write', 'indeterminate',
  'lang', 'dir', 'scope', 'host', 'before', 'after', 'first-line', 'first-letter',
  'placeholder', 'selection', 'backdrop', 'marker',
]);
function validSelector(s) {
  const b = blankStrings(s);
  if (!s || /[{};]/.test(b) || /^\d/.test(s) || /^[+-]?(\d+\.?\d*|\.\d+)%$/.test(s)) return false;
  for (const m of b.matchAll(/::?(-?[A-Za-z][\w-]*)/g)) {
    const name = m[1].toLowerCase();
    if (name.startsWith('-webkit-') || name.startsWith('-moz-')) continue;
    if (!KNOWN_PSEUDO.has(name)) return false;
  }
  return true;
}

function parseStylesheet(src) {
  const css = maskCssComments(src);
  const lineAt = lineCounter(css);
  const rules = [];
  const keyframes = [];
  const dropped = [];
  let order = 0;

  const walk = (start, end, media) => {
    let i = start;
    let poison = null;
    while (i < end) {
      while (i < end && /\s/.test(css[i])) i += 1;
      if (i >= end) break;
      const at = scanTo(css, i, end, '{;}');
      if (at >= end) {
        if (css.slice(i, end).trim()) throw new Error(`style.css: unterminated text at line ${lineAt(i)}`);
        break;
      }
      if (css[at] !== '{') {
        const bare = css.slice(i, at).trim();
        if (!(css[at] === ';' && bare.startsWith('@'))) {
          poison = poison || { token: css[at], line: lineAt(at) };
        }
        i = at + 1;
        continue;
      }
      const prelude = css.slice(i, at).replace(/\s+/g, ' ').trim();
      const close = closeOf(css, at, end, lineAt);
      const badSelector = !prelude.startsWith('@') && splitTop(prelude, ',').find((s) => !validSelector(s));
      if (poison || badSelector) {
        let decls = [];
        try { decls = parseDecls(css, at + 1, close, lineAt); } catch (e) { decls = []; }
        dropped.push({
          prelude, decls, line: lineAt(i), media: media.slice(),
          why: poison
            ? `a stray \`${poison.token}\` before it is folded into its selector`
            : `\`${badSelector}\` is not a selector`,
          strayLine: poison ? poison.line : null,
        });
        poison = null;
        i = close + 1;
        continue;
      }
      if (prelude.startsWith('@')) {
        const kf = /^@(?:-webkit-)?keyframes\s+([A-Za-z0-9_-]+)$/.exec(prelude);
        if (kf) {
          keyframes.push({
            name: kf[1], stops: parseStops(css, at + 1, close, lineAt, kf[1]),
            media: media.slice(), order: order++, line: lineAt(i),
          });
        } else if (/^@(media|supports|container|layer)\b/i.test(prelude)) {
          walk(at + 1, close, media.concat(prelude));
        } else if (!/^@(font-face|page|property|counter-style)\b/i.test(prelude)) {
          throw new Error(`style.css: an at-rule this reader does not know, "${prelude}", at line ${lineAt(i)}`);
        }
      } else {
        rules.push({
          selectorText: prelude, selectors: splitTop(prelude, ','),
          decls: parseDecls(css, at + 1, close, lineAt),
          media: media.slice(), reduce: media.some((m) => REDUCE.test(m)),
          order: order++, line: lineAt(i),
        });
      }
      i = close + 1;
    }
  };
  walk(0, css.length, []);
  return { css, rules, keyframes, dropped, lineAt };
}

/* Rules the browser drops that are KNOWN and FILED. Any other dropped rule stops the run,
   like every other lie; these are reported in the inventory as exactly what they are,
   because mending them changes the game and that is not this tool's to do. Each entry
   must still match the stylesheet: the day the defect is fixed the entry is stale, and the
   run stops until it is removed here and in docs/11. */
/* Keyed by the dropped rule's whole text, selector and declarations, so another stray `50%`
   stop somewhere else is a new defect and not this one wearing its provenance. */
const dropKey = (d) => `${d.prelude} {${d.decls.map((x) => `${x.prop}:${x.value}${x.important ? ' !important' : ''}`).join('; ')}}`;
const KNOWN_DROPPED = new Map([
  ['50% {transform:translateY(-2px) rotate(-1deg) scale(1.02)}',
    'a keyframe stop left behind when `@keyframes wxUmbrellaTilt` was deleted (commit 0215097, 2026-08-31)'],
  ['#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .tf-leaf-r ' +
    '{animation:wxLeafHold 2.8s ease-in-out infinite; transform:translate(-17px,-80px) rotate(31deg) scale(1.35); ' +
    'transition:transform .55s cubic-bezier(.34,1.56,.64,1)}',
    "the `}` that closed the orphaned stop above, so the flower's rain pose goes with it"],
]);
const KNOWN_DROPPED_FILED = '[11-known-issues.md](11-known-issues.md) — "The flower\'s rain pose never plays"';

// ---------------------------------------------------------------- selectors

function bracketEnd(s, i) {
  const open = s[i];
  const close = open === '(' ? ')' : ']';
  let depth = 0;
  for (let j = i; j < s.length; j += 1) {
    if (s[j] === '"' || s[j] === "'") { j = skipString(s, j) - 1; continue; }
    if (s[j] === open) depth += 1;
    else if (s[j] === close) {
      depth -= 1;
      if (depth === 0) return j;
    }
  }
  return s.length - 1;
}

/** A complex selector as compounds, each carrying the combinator that precedes it. */
function compounds(sel) {
  const out = [];
  let cur = '';
  let pending = null;
  const flush = () => {
    if (!cur) return;
    out.push({ text: cur, comb: out.length ? (pending || ' ') : null });
    cur = '';
    pending = null;
  };
  for (let i = 0; i < sel.length; i += 1) {
    const c = sel[i];
    if (c === '(' || c === '[') {
      const j = bracketEnd(sel, i);
      cur += sel.slice(i, j + 1);
      i = j;
      continue;
    }
    if (/\s/.test(c)) { flush(); continue; }
    if (c === '>' || c === '+' || c === '~') { flush(); pending = c; continue; }
    cur += c;
  }
  flush();
  return out;
}

/** The simple selectors of one compound: `.a.b:not(.c)::after` → ['.a', '.b', ':not(.c)', '::after']. */
function simples(compound) {
  const out = [];
  let i = 0;
  while (i < compound.length) {
    const c = compound[i];
    let j = i + 1;
    if (c === '[') {
      j = bracketEnd(compound, i) + 1;
    } else if (c === ':') {
      if (compound[j] === ':') j += 1;
      while (j < compound.length && /[\w-]/.test(compound[j])) j += 1;
      if (compound[j] === '(') j = bracketEnd(compound, j) + 1;
    } else if (c === '*') {
      j = i + 1;
    } else {
      while (j < compound.length && /[\w-]/.test(compound[j])) j += 1;
    }
    out.push(compound.slice(i, j));
    i = j;
  }
  return out;
}

const LEGACY_PSEUDO_ELEMENTS = new Set([':before', ':after', ':first-line', ':first-letter']);

function cmpSpec(a, b) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function specificity(sel) {
  let a = 0;
  let b = 0;
  let c = 0;
  for (const { text } of compounds(sel)) {
    for (const s of simples(text)) {
      if (s[0] === '#') a += 1;
      else if (s[0] === '.' || s[0] === '[') b += 1;
      else if (s.startsWith('::') || LEGACY_PSEUDO_ELEMENTS.has(s.toLowerCase())) c += 1;
      else if (s[0] === ':') {
        const m = /^:([\w-]+)(?:\(([\s\S]*)\))?$/.exec(s);
        const name = m ? m[1].toLowerCase() : '';
        if (name === 'where') continue;
        if (name === 'not' || name === 'is' || name === 'has' || name === 'matches') {
          const best = splitTop(m[2] || '', ',').map(specificity).sort(cmpSpec).pop() || [0, 0, 0];
          a += best[0];
          b += best[1];
          c += best[2];
        } else {
          b += 1;
        }
      } else if (s !== '*') {
        c += 1;
      }
    }
  }
  return [a, b, c];
}

const specText = (s) => s.join('-');

/* Sorting by code unit, never by locale: a Czech machine sorts "ch" after "h", and a tool
   whose output moves with the reader's language setting reports a stale doc that is not. */
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** Simple selectors that are states rather than names: everything past a compound's first. */
function isPseudoElement(s) {
  return s.startsWith('::') || LEGACY_PSEUDO_ELEMENTS.has(s.toLowerCase());
}

/* What SWITCHES a piece of motion on, read off its selector: every ancestor compound (the
   place or state the element has to be inside), and every simple selector on the element
   itself past its own first name (a state class, an attribute, a pseudo-class). A rule
   with neither runs whenever the element exists. */
function gateOf(sel) {
  const cs = compounds(sel);
  if (!cs.length) return { ancestors: '', self: [], always: true };
  const subject = simples(cs[cs.length - 1].text);
  const self = subject.slice(1).filter((s) => !isPseudoElement(s));
  const ancestors = cs.slice(0, -1).map((x, i) => (i && x.comb !== ' ' ? `${x.comb} ` : '') + x.text).join(' ');
  return { ancestors, self, always: !ancestors && !self.length };
}

/* Does every element that `u` matches also match `r`? Answered conservatively from the
   syntax: aligned from the element outward, each of r's compounds must be a subset of the
   compound it lines up with in u, and a descendant combinator in r may skip ancestors of
   u where a child/sibling combinator may not. `*` in r matches anything. */
/* Every piece of the game lives inside `#game` (index.html's `<div class="game" id="game">`),
   so an ancestor compound that names only the game box — or the page itself — holds for
   every element, and a reduced-motion rule written `#game .x` answers a rule written `.x`.
   The research missed six such cancels before this line existed. (`.bee-fly` alone is
   appended to the body instead, and nothing addresses it through `#game`.) */
const UNIVERSAL_ANCESTOR = /^(?:#game|\.game|#game\.game|\.game#game|html|body|:root)$/;

function covers(r, u) {
  const all = compounds(r);
  /* Only a DESCENDANT hop from the game box is free: `#game > .x` still asks for a child. */
  const rc = all.filter((x, i) => i === all.length - 1 || !UNIVERSAL_ANCESTOR.test(x.text) || all[i + 1].comb !== ' ')
    .map((x, i) => ({ ...x, comb: i === 0 ? null : x.comb, set: simples(x.text).filter((t) => t !== '*') }));
  const uc = compounds(u).map((x) => ({ ...x, set: simples(x.text) }));
  const subset = (a, b) => a.every((s) => b.includes(s));
  if (!rc.length || !uc.length) return false;
  const rs = rc[rc.length - 1];
  const us = uc[uc.length - 1];
  if (!subset(rs.set, us.set)) return false;
  // A pseudo-element is a different box: r must name the same one.
  const pe = (set) => set.filter(isPseudoElement).join('');
  if (pe(rs.set) !== pe(us.set)) return false;
  let ui = uc.length - 1;
  for (let ri = rc.length - 2; ri >= 0; ri -= 1) {
    const comb = rc[ri + 1].comb;
    if (comb === ' ') {
      let found = false;
      for (let k = ui - 1; k >= 0; k -= 1) {
        if (subset(rc[ri].set, uc[k].set)) { ui = k; found = true; break; }
      }
      if (!found) return false;
    } else {
      if (ui - 1 < 0 || uc[ui].comb !== comb || !subset(rc[ri].set, uc[ui - 1].set)) return false;
      ui -= 1;
    }
  }
  return true;
}

/* `.float.crit` extends `.float`: same ancestors, and the element compound adds to it.
   Used to find the shorthand a name-only rule rides on, and the rule a longhand modifies. */
function extendsSel(u, base) {
  const uc = compounds(u);
  const bc = compounds(base);
  if (uc.length !== bc.length || u === base) return false;
  for (let i = 0; i < uc.length - 1; i += 1) {
    if (uc[i].text !== bc[i].text || uc[i].comb !== bc[i].comb) return false;
  }
  if (uc[uc.length - 1].comb !== bc[bc.length - 1].comb) return false;
  const us = simples(uc[uc.length - 1].text);
  const bs = simples(bc[bc.length - 1].text);
  return bs.every((s) => us.includes(s)) && us.length > bs.length;
}

// ---------------------------------------------------------------- animations

const TIMING_KEYWORDS = new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']);
const DIRECTIONS = new Set(['normal', 'reverse', 'alternate', 'alternate-reverse']);
const FILLS = new Set(['forwards', 'backwards', 'both']);
const PLAYS = new Set(['running', 'paused']);
const CSS_WIDE = new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer']);

const isTime = (t) => /^[-+]?(\d+\.?\d*|\.\d+)(ms|s)$/i.test(t);
const isNumber = (t) => /^(\d+\.?\d*|\.\d+)$/.test(t);
const isComputed = (t) => /^(var|calc|min|max|clamp)\(/i.test(t);
const isTiming = (t) => TIMING_KEYWORDS.has(t.toLowerCase()) || /^(cubic-bezier|steps|linear)\(/i.test(t);

const FIELDS = ['name', 'duration', 'timing', 'delay', 'iterations', 'direction', 'fill', 'play'];

function parseAnimationItem(text) {
  const item = {};
  const idents = [];
  for (const tok of words(text)) {
    const low = tok.toLowerCase();
    if (isTime(tok) || isComputed(tok)) {
      /* The first time is the duration and the second the delay. A var() or calc()
         cannot be typed from the outside, so it takes the next time slot — which is how
         every one in this stylesheet is written (`rainFall var(--dur,.5s) linear
         var(--delay,0s) both`). */
      if (!('duration' in item)) item.duration = tok;
      else if (!('delay' in item)) item.delay = tok;
      else throw new Error(`three time values in the animation "${text}"`);
    } else if (isTiming(tok)) item.timing = tok;
    else if (low === 'infinite' || isNumber(tok)) item.iterations = low;
    else if (DIRECTIONS.has(low) && !('direction' in item)) item.direction = low;
    else if (FILLS.has(low) && !('fill' in item)) item.fill = low;
    else if (PLAYS.has(low)) item.play = low;
    else idents.push(tok);
  }
  const named = idents.filter((x) => x.toLowerCase() !== 'none');
  if (named.length > 1) throw new Error(`two names in the animation "${text}"`);
  if (named.length) {
    item.name = named[0];
    if (idents.length > 1 && !('fill' in item)) item.fill = 'none';
  } else if (idents.length) {
    item.name = 'none';
  }
  return item;
}

const LONGHAND = {
  'animation-name': 'name',
  'animation-duration': 'duration',
  'animation-timing-function': 'timing',
  'animation-delay': 'delay',
  'animation-iteration-count': 'iterations',
  'animation-direction': 'direction',
  'animation-fill-mode': 'fill',
  'animation-play-state': 'play',
};

/* One rule's animation, as the cascade inside that rule leaves it: a shorthand resets
   every field of every item, a later longhand overrides one field of each, and a longhand
   list shorter than the item list repeats. `importantFields` remembers which fields were
   set with !important, because that is how a reduced-motion duration survives the clamp. */
function ruleAnimation(rule) {
  let items = null;
  let fromShorthand = false;
  const longhandOnly = [];
  const importantFields = new Set();
  for (const d of rule.decls) {
    const prop = d.prop.replace(/^-webkit-/, '');
    if (prop === 'animation') {
      if (CSS_WIDE.has(d.value.toLowerCase())) { items = [{ name: d.value.toLowerCase() }]; fromShorthand = true; continue; }
      items = splitTop(d.value, ',').map(parseAnimationItem);
      fromShorthand = true;
      importantFields.clear();
      if (d.important) FIELDS.forEach((f) => importantFields.add(f));
    } else if (LONGHAND[prop]) {
      const field = LONGHAND[prop];
      const values = splitTop(d.value, ',');
      if (d.important) importantFields.add(field);
      if (!items) {
        if (field !== 'name') { longhandOnly.push({ field, value: d.value, important: d.important }); continue; }
        items = values.map(() => ({}));
      }
      items.forEach((it, k) => {
        const v = values[k % values.length];
        it[field] = field === 'direction' || field === 'fill' || field === 'play' || field === 'iterations' ? v.toLowerCase() : v;
      });
    }
  }
  return { items, fromShorthand, longhandOnly, importantFields };
}

// ---------------------------------------------------------------- transitions

function parseTransitionItem(text) {
  const item = {};
  if (/^none$/i.test(text.trim())) return { none: true };
  for (const tok of words(text)) {
    if (isTime(tok) || isComputed(tok)) {
      if (!('duration' in item)) item.duration = tok;
      else if (!('delay' in item)) item.delay = tok;
      else throw new Error(`three time values in the transition "${text}"`);
    } else if (isTiming(tok)) item.timing = tok;
    else if (tok.toLowerCase() === 'allow-discrete' || tok.toLowerCase() === 'normal') continue;
    else item.property = tok;
  }
  return item;
}

const TRANSITION_LONGHAND = {
  'transition-property': 'property',
  'transition-duration': 'duration',
  'transition-timing-function': 'timing',
  'transition-delay': 'delay',
};

/* Importance is per property, not per rule: `transition-duration:1.2s !important` beats the
   clamp and a rule's plain `transition:` alike, and a rule that sets only a duration does not
   compete with one that sets only the property list. */
function ruleTransition(rule) {
  let items = null;
  const longhands = [];
  let important = false;
  const fields = {};
  for (const d of rule.decls) {
    const prop = d.prop.replace(/^-webkit-/, '');
    if (prop === 'transition') {
      items = splitTop(d.value, ',').map(parseTransitionItem);
      important = d.important;
      for (const f of ['property', 'duration', 'timing', 'delay']) fields[f] = { important: d.important, shorthand: true };
    } else if (TRANSITION_LONGHAND[prop]) {
      longhands.push({ field: TRANSITION_LONGHAND[prop], value: d.value, important: d.important });
      fields[TRANSITION_LONGHAND[prop]] = { important: d.important, value: d.value };
    }
  }
  if (!items && !longhands.length) return null;
  return { items, longhands, important, fields };
}

// ---------------------------------------------------------------- keyframe frames

function frameAt(kf, pct) {
  const decls = {};
  for (const s of kf.stops) {
    if (s.keys.includes(pct)) for (const d of s.decls) decls[d.prop] = d.value;
  }
  return Object.keys(decls).length ? decls : null;
}

/** Why a frame would hide its element, or null. */
function invisibleIn(frame) {
  if (!frame) return null;
  if (frame.opacity !== undefined && /^0*\.?0*$/.test(frame.opacity.trim())) return 'opacity:0';
  if (frame.visibility === 'hidden') return 'visibility:hidden';
  if (frame.transform && /\bscale\(\s*0\s*[,)]/.test(frame.transform)) return `transform:${frame.transform}`;
  return null;
}

function propsOf(kf) {
  const set = new Set();
  for (const s of kf.stops) for (const d of s.decls) set.add(d.prop);
  return [...set].sort();
}

function stopsOf(kf) {
  const set = new Set();
  for (const s of kf.stops) for (const k of s.keys) set.add(k);
  return [...set].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- reading JavaScript

function skipJsString(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length && s[j] !== q && s[j] !== '\n') j += s[j] === '\\' ? 2 : 1;
  return Math.min(s.length, j + 1);
}

function skipRegex(s, i) {
  let j = i + 1;
  let inClass = false;
  while (j < s.length && s[j] !== '\n') {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '[') inClass = true;
    else if (c === ']') inClass = false;
    else if (c === '/' && !inClass) {
      j += 1;
      while (j < s.length && /[a-z]/i.test(s[j])) j += 1;
      return j;
    }
    j += 1;
  }
  return j;
}

/* Comments blanked, strings and template literals kept, so a pattern search sees code
   and never prose. A comment in this codebase is often the most accurate description of
   a call there is — "`FX.shake()` writes a transform" — which is exactly why it must not
   be counted as one. Template literals keep a mode stack, because a `//` inside
   `https://` is text and a backtick inside a `${}` opens a new template, not a close. */
function maskJsComments(src) {
  let out = '';
  const stack = [];
  let prev = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const top = stack[stack.length - 1];
    if (top && top.mode === 'tpl') {
      if (c === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { stack.pop(); out += c; i += 1; prev = '`'; continue; }
      if (c === '$' && src[i + 1] === '{') { stack.push({ mode: 'expr', depth: 0 }); out += '${'; i += 2; prev = '{'; continue; }
      out += c;
      i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const e = src.indexOf('\n', i);
      const stop = e === -1 ? n : e;
      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      const stop = e === -1 ? n : e + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      const j = skipJsString(src, i);
      out += src.slice(i, j);
      i = j;
      prev = c;
      continue;
    }
    if (c === '`') { stack.push({ mode: 'tpl' }); out += c; i += 1; continue; }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev))) {
      const j = skipRegex(src, i);
      out += src.slice(i, j);
      i = j;
      prev = '/';
      continue;
    }
    if (top && top.mode === 'expr') {
      if (c === '{') top.depth += 1;
      else if (c === '}') {
        if (top.depth === 0) { stack.pop(); out += c; i += 1; prev = '}'; continue; }
        top.depth -= 1;
      }
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i += 1;
  }
  return out;
}

/** The argument text of the call whose `(` is at `open`. */
function argsAt(code, open) {
  let depth = 0;
  for (let j = open; j < code.length; j += 1) {
    const c = code[j];
    if (c === '"' || c === "'") { j = skipJsString(code, j) - 1; continue; }
    if (c === '`') {
      // Step over a template literal, nested ${} and all.
      let k = j + 1;
      let d = 0;
      while (k < code.length) {
        if (code[k] === '\\') { k += 2; continue; }
        if (d === 0 && code[k] === '`') break;
        if (code[k] === '$' && code[k + 1] === '{') { d += 1; k += 2; continue; }
        if (d > 0 && code[k] === '}') d -= 1;
        k += 1;
      }
      j = k;
      continue;
    }
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') {
      depth -= 1;
      if (depth === 0) return code.slice(open + 1, j).replace(/\s+/g, ' ').trim();
    }
  }
  return code.slice(open + 1, Math.min(code.length, open + 80)).replace(/\s+/g, ' ').trim() + '…';
}

const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with', 'return', 'else', 'do', 'try', 'function']);

/* Which function a line belongs to, read the way a person scans this codebase: upward, to
   the nearest line indented LESS than the one before, until one of them names something.
   Anonymous callbacks on the way up are kept as a note — "inside setTimeout" is part of
   the answer when the motion is a delayed beat. The house style (two-space indent, one
   statement a line, IIFE modules) is what makes this reliable; tools/sim-test.js holds the
   style, and the cross-check against graft in doc 50's decision-log entry is what proved it. */
function nameAt(lines, idx, col) {
  const indent = (l) => l.length - l.trimStart().length;
  const named = (text) => {
    const t = text.trim();
    let m;
    if ((m = /^(?:async\s+)?function\s*\*?\s*([\w$]+)\s*\(/.exec(t))) return `${m[1]}()`;
    if ((m = /Game\.on\(\s*(['"])([^'"]+)\1/.exec(t))) return `Game.on('${m[2]}')`;
    if ((m = /^(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/.exec(t))) return `${m[1]}()`;
    if ((m = /^((?:UI|FX|Game|Sound|Dev|G)\.[\w$.]+)\s*=\s*(?:async\s*)?(?:function\b|\(|[\w$]+\s*=>)/.exec(t))) return `${m[1]}()`;
    if ((m = /^(?:get\s+|set\s+|async\s+)?([\w$]+)\s*:\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[\w$]+\s*=>)/.exec(t))) return `${m[1]}()`;
    if ((m = /^(?:get\s+|set\s+|async\s+)?([\w$]+)\s*\([^)]*\)\s*\{\s*$/.exec(t)) && !KEYWORDS.has(m[1])) return `${m[1]}()`;
    return null;
  };
  const noteOf = (text, j) => {
    let m;
    if ((m = /([\w$.]+(?:\([^()]*\))?)\.addEventListener\(\s*(['"])([^'"]+)\2/.exec(text))) return `${m[1]} on '${m[3]}'`;
    if ((m = /addEventListener\(\s*(['"])([^'"]+)\1/.exec(text))) return `on '${m[2]}'`;
    if (/\bsetTimeout\(/.test(text)) return 'setTimeout';
    if (/\bsetInterval\(/.test(text)) return 'setInterval';
    if (/\brequestAnimationFrame\(/.test(text)) return 'requestAnimationFrame';
    /* A delegated handler branches on what was pressed: `const craft =
       e.target.closest('[data-craft]'); if (craft) {`. The selector is the branch's
       name, and the one grep-able thing about it. */
    if ((m = /closest\(\s*(['"])([^'"]+)\1/.exec(text))) return m[2];
    if ((m = /^\s*(?:\}\s*else\s+)?if\s*\(\s*([\w$]+)/.exec(text))) {
      const id = m[1].replace(/\$/g, '\\$');
      const decl = new RegExp(`\\b(?:const|let)\\s+${id}\\s*=.*closest\\(\\s*(['"])([^'"]+)\\1`);
      for (let k = j - 1; k >= Math.max(0, j - 8); k -= 1) {
        const d = decl.exec(lines[k]);
        if (d) return d[2];
      }
    }
    return null;
  };
  const notes = [];
  // The call's own line may open its function too: `Game.on('grid', () => UI.buildGarden());`
  const before = lines[idx].slice(0, col);
  const own = named(before);
  if (own && !/^\s*(?:if|for|while)\b/.test(before)) return { name: own, notes };
  const ownNote = noteOf(before, idx);
  if (ownNote) notes.push(ownNote);
  let limit = indent(lines[idx]);
  for (let j = idx - 1; j >= 0; j -= 1) {
    const l = lines[j];
    if (!l.trim()) continue;
    const ind = indent(l);
    if (ind >= limit) continue;
    const n = named(l);
    if (n) return { name: n, notes };
    const note = noteOf(l, j);
    if (note && !notes.includes(note)) notes.push(note);
    limit = ind;
    if (ind === 0) break;
  }
  return { name: '(module level)', notes };
}

function readJs(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const code = maskJsComments(src);
  return { file, src, code, lines: code.split('\n') };
}

function jsFiles() {
  return fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).sort();
}

function lineColAt(code, offset) {
  const before = code.slice(0, offset);
  const idx = before.split('\n').length - 1;
  return { idx, col: offset - (before.lastIndexOf('\n') + 1) };
}

/* fx.js's public surface is the one object literal its IIFE returns. Reached by an anchor,
   like tools/export-icons.js reaches the icon registry: if the literal moves or changes
   shape the run stops, rather than reporting every FX call as unknown or none of them. */
function fxApi() {
  const src = fs.readFileSync(FX_FILE, 'utf8');
  const code = maskJsComments(src);
  const m = /\n {2}return \{([\s\S]*?)\n {2}\};\n\}\)\(\);/.exec(code);
  if (!m) {
    throw new Error(
      'fx.js no longer ends its IIFE with a two-space-indented `return { … };` followed by `})();`.\n' +
      '  This script reads the public FX surface from that literal. Update fxApi() in\n' +
      '  tools/export-motion.js to match the new shape.'
    );
  }
  const api = new Map();
  let literal = m[1];
  for (let prev = ''; prev !== literal;) {
    prev = literal;
    literal = literal.replace(/\{[^{}]*\}/g, '<body>');
  }
  for (const part of splitTop(literal, ',')) {
    const g = /^get\s+([\w$]+)\s*\(/.exec(part);
    if (g) { api.set(g[1], { kind: 'readout' }); continue; }
    const name = part.trim();
    if (!/^[\w$]+$/.test(name)) throw new Error(`fx.js: an export this script cannot read: "${part.trim()}"`);
    const fn = new RegExp(`\\n {2}function ${name}\\(([^)]*)\\)\\s*\\{`).exec(code);
    if (!fn) throw new Error(`fx.js exports ${name} but has no two-space-indented \`function ${name}(\` for it`);
    const bodyStart = fn.index + fn[0].length;
    const bodyEnd = code.indexOf('\n  }\n', bodyStart);
    const body = code.slice(bodyStart, bodyEnd === -1 ? code.length : bodyEnd);
    api.set(name, { kind: 'function', signature: `${name}(${fn[1].replace(/\s+/g, ' ').trim()})`, body });
  }
  /* What reduced motion does to each call, read from its body — and one call deep, because
     weather() is zeroed inside its helper wxWant() and rainbowBurst() inherits confetti()'s
     cap. A column that read only the literal body said "no check" for both. */
  const own = (body) => {
    const cap = /if \(reduced\) n = Math\.min\(n, (\d+)\);/.exec(body);
    if (cap) return `capped at ${cap[1]}`;
    if (/if \(reduced\) return;/.test(body)) return 'off';
    if (/\breduced\b/.test(body)) return 'reads the preference';
    return null;
  };
  const helpers = new Map();
  for (const m of code.matchAll(/\n {2}const ([\w$]+) = \([^)]*\) => ([^\n]*(?:\n {4}[^\n]*)*)/g)) helpers.set(m[1], m[2]);
  for (const [name, v] of api) {
    if (v.kind !== 'function') continue;
    const parts = [];
    const mine = own(v.body);
    if (mine) parts.push(mine);
    for (const [h, hb] of helpers) {
      if (new RegExp(`\\b${h}\\(`).test(v.body) && /\breduced\b/.test(hb)) parts.push(`zero through \`${h}()\``);
    }
    for (const [callee, cv] of api) {
      if (callee === name || cv.kind !== 'function' || !new RegExp(`(^|[^.\\w])${callee}\\(`).test(v.body)) continue;
      const theirs = own(cv.body);
      if (theirs) parts.push(`its \`${callee}()\` ${theirs}`);
    }
    v.reduced = parts.length ? parts.join('; ') : 'no check in fx.js';
  }
  return api;
}

// ---------------------------------------------------------------- building the inventory

/* A code span that survives its own content: a call written with a template literal
   carries backticks, and swapping them for a look-alike would break the grep the span
   exists to give. So the fence grows — two backticks and a space around one — which is
   how Markdown spells it. */
const code = (t) => {
  const s = String(t);
  const runs = s.match(/`+/g);
  if (!runs) return `\`${s}\``;
  const fence = '`'.repeat(Math.max(...runs.map((r) => r.length)) + 1);
  return `${fence} ${s} ${fence}`;
};
const cell = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const mediaLabel = (m) => m.replace(/^@media\s*/i, '').trim();
/* The function, then the way in from outermost to innermost: `(module level) › el.sheetBody
   on 'click' › [data-craft]` is a delegated handler's craft branch. */
const whereText = (w) => [code(w.name), ...w.notes.slice().reverse().map(code)].join(' › ');

function describeGate(sel, media) {
  const g = gateOf(sel);
  const parts = [];
  if (g.ancestors) parts.push(`ancestor ${code(g.ancestors)}`);
  if (g.self.length) parts.push(`self ${code(g.self.join(''))}`);
  const place = media.filter((m) => !REDUCE.test(m)).map(mediaLabel);
  if (place.length) parts.push(`only ${place.map(code).join(' and ')}`);
  return parts.length ? parts.join(', ') : 'always on';
}

function build() {
  const problems = [];
  const cssText = fs.readFileSync(CSS_FILE, 'utf8');
  const sheet = parseStylesheet(cssText);
  const { rules, keyframes } = sheet;

  /* The assertion the tool exists for, part one: a plain scan and the structured read
     must agree on how many keyframes there are. A @keyframes the walker failed to see —
     inside an at-rule it does not descend into, say — would drop out of every table
     below without a word. */
  const plain = (sheet.css.match(/@(?:-webkit-)?keyframes\s+[A-Za-z0-9_-]+\s*\{/g) || []).length;
  if (plain !== keyframes.length) {
    problems.push(`a plain scan finds ${plain} @keyframes but the reader parsed ${keyframes.length} — something is hiding one`);
  }
  /* The same name twice in the same context: the later body wins silently. (A name
     redeclared inside a media query is a deliberate variant for that query, not a clash.) */
  const byName = new Map();
  const seenIn = new Map();
  for (const kf of keyframes) {
    const ctx = `${kf.media.join(' | ')}::${kf.name}`;
    if (seenIn.has(ctx)) problems.push(`@keyframes ${kf.name} is declared twice (lines ${seenIn.get(ctx).line} and ${kf.line}) — the later body wins silently`);
    seenIn.set(ctx, kf);
    if (!byName.has(kf.name) || !kf.media.length) byName.set(kf.name, kf);
  }

  /* Every rule the browser drops must be one already known and filed, and every known
     one must still be there — a fix that lands without clearing its entry would leave the
     inventory reporting a defect the game no longer has. */
  const dropped = sheet.dropped;
  for (const d of dropped) {
    if (!KNOWN_DROPPED.has(dropKey(d))) {
      problems.push(`the browser drops the rule "${d.prelude}" at line ${d.line}: ${d.why}${d.strayLine ? ` (the stray token is on line ${d.strayLine})` : ''}. Fix style.css, or file it in docs/11 and add it to KNOWN_DROPPED`);
    }
  }
  for (const known of KNOWN_DROPPED.keys()) {
    if (!dropped.some((d) => dropKey(d) === known)) {
      problems.push(`KNOWN_DROPPED names "${known.split(' {')[0]}", which the browser no longer drops — the defect is fixed; remove the entry here and its docs/11 entry`);
    }
  }
  /* A keyframe whose only rule is one of those known drops never plays. It is reported as
     such rather than refused, for the same reason the drop itself is. */
  const playedByDropped = new Map();
  for (const d of dropped) {
    const a = ruleAnimation({ decls: d.decls });
    for (const it of a.items || []) {
      if (it.name && byName.has(it.name)) playedByDropped.set(it.name, d);
    }
  }

  // ---- the global clamp ----
  let clamp = null;
  for (const r of rules) {
    if (!r.reduce) continue;
    if (!r.selectors.some((s) => /^\*(::?[\w-]+)?$/.test(s))) continue;
    const d = r.decls.find((x) => x.prop === 'animation-duration' && x.important);
    if (d) {
      const t = r.decls.find((x) => x.prop === 'transition-duration' && x.important);
      const it = r.decls.find((x) => x.prop === 'animation-iteration-count' && x.important);
      clamp = { duration: d.value, transition: t ? t.value : null, iterations: it ? it.value : null, rule: r };
    }
  }

  // ---- every rule's animation ----
  const anim = new Map(rules.map((r) => [r, ruleAnimation(r)]));
  const shorthandRules = rules.filter((r) => anim.get(r).fromShorthand);

  /* A rule that names a keyframe without a shorthand (`.float.crit{animation-name:floatCrit}`)
     rides on the shorthand of the rule it extends, and the cascade gives it that rule's
     duration and easing. Found by selector, never assumed. */
  function baseFor(rule, sel) {
    const cands = shorthandRules.filter((b) => b !== rule && b.reduce === rule.reduce &&
      b.selectors.some((bs) => extendsSel(sel, bs)));
    return cands.length ? cands[cands.length - 1] : null;
  }

  const uses = [];
  const modifiers = [];
  for (const r of rules) {
    const a = anim.get(r);
    if (a.longhandOnly.length && !(clamp && r === clamp.rule)) modifiers.push({ rule: r, longhands: a.longhandOnly });
    if (!a.items) continue;
    a.items.forEach((item, k) => {
      if (!item.name) return;
      const inherited = {};
      let base = null;
      if (!a.fromShorthand) {
        base = baseFor(r, r.selectors[0]);
        if (base) {
          const bi = anim.get(base).items[k] || anim.get(base).items[0];
          for (const f of FIELDS) if (!(f in item) && f in bi && f !== 'name') inherited[f] = bi[f];
        }
      }
      uses.push({ rule: r, item, index: k, inherited, base, important: a.importantFields });
    });
  }

  // ---- every JS file, fx.js included: its shake is choreography too ----
  const js = jsFiles().map(readJs);

  // ---- who plays each keyframe ----
  const cssUsers = new Map();
  for (const u of uses) {
    const n = u.item.name;
    if (n === 'none' || CSS_WIDE.has(n.toLowerCase())) continue;
    if (!byName.has(n)) {
      problems.push(`${u.rule.selectorText} (line ${u.rule.line}) plays "${n}", and no @keyframes has that name`);
      continue;
    }
    if (!cssUsers.has(n)) cssUsers.set(n, []);
    cssUsers.get(n).push(u);
  }
  /* A keyframe the JavaScript plays has to be NAMED where an animation is set — an inline
     `animation:` in a template, `style.animation(Name) =`, or `setProperty('animation…')`.
     A bare word match is not evidence: the first version of this check let an orphan
     through because its name was an ordinary English word in a line of player copy. */
  const jsUsers = new Map();
  for (const kf of keyframes) {
    if (cssUsers.has(kf.name)) continue;
    const n = kf.name.replace(/-/g, '\\-');
    const res = [
      new RegExp(`style\\s*=\\s*["'][^"']*animation(?:-name)?\\s*:[^;"']*(^|[^\\w-])${n}(?![\\w-])`),
      new RegExp(`\\.cssText\\s*=[^;\\n]*animation(?:-name)?\\s*:[^;\\n]*(^|[^\\w-])${n}(?![\\w-])`),
      new RegExp(`\\.style\\.animation(?:Name)?\\s*=[^;\\n]*(^|[^\\w-])${n}(?![\\w-])`),
      new RegExp(`setProperty\\(\\s*(['"])animation(?:-name)?\\1\\s*,[^)]*(^|[^\\w-])${n}(?![\\w-])`),
    ];
    const found = js.filter((f) => res.some((re) => re.test(f.code))).map((f) => f.file);
    if (found.length) jsUsers.set(kf.name, found);
    else if (playedByDropped.has(kf.name) && KNOWN_DROPPED.has(dropKey(playedByDropped.get(kf.name)))) continue;
    else problems.push(`@keyframes ${kf.name} (line ${kf.line}) is played by nothing — no rule in style.css and no animation set in the JavaScript names it`);
  }
  /* Stop here if the links are broken. Every table below assumes each keyframe has a
     player and each player a keyframe, and half a table is the lie this script refuses. */
  if (problems.length) return { problems, block: null, counts: null };

  // ---- the reduced-motion answer for one use ----
  const reduceRules = rules.filter((r) => r.reduce && r !== (clamp && clamp.rule));
  const wins = (q, qImportant, u, uImportant, qSel, uSel) => {
    if (qImportant !== uImportant) return qImportant;
    const c = cmpSpec(specificity(qSel), specificity(uSel));
    return c > 0 || (c === 0 && q.order > u.order);
  };

  const hiddenBy = (value) => /^0*\.?0*$/.test(String(value).trim());

  /* What a player with the preference on sees once the clamp has had its way: one run of
     .001ms, then either the element's own style or — when the animation fills forwards —
     its end frame. "Hidden" is said plainly and is not itself an alarm: a bee flying off
     or a banner leaving SHOULD end hidden. It is an alarm on anything that carries a
     state, which the authored half of doc 50 names. The ⚠ is kept for the two shapes
     that are wrong whatever the element: a reduced-motion substitute the clamp flattens
     before it can play, and an element whose own style hides it that only the keyframe
     ever showed. */
  function clampAnswer(item, inherited, kf, rule) {
    if (!clamp) return 'untouched — no reduced-motion clamp';
    const get = (f) => (f in item ? item[f] : inherited[f]);
    const fill = get('fill') || 'none';
    const dir = get('direction') || 'normal';
    const endPct = dir === 'reverse' || dir === 'alternate-reverse' ? 0 : 100;
    if (fill === 'forwards' || fill === 'both') {
      const frame = frameAt(kf, endPct);
      if (!frame) return 'clamp: one .001ms run, ends on its own style';
      const hidden = invisibleIn(frame);
      return hidden ? `clamp: holds its end frame, which **hides it** (${code(hidden)})` : 'clamp: holds its end frame';
    }
    const selfOpacity = rule.decls.find((d) => d.prop === 'opacity');
    const reveals = kf.stops.some((s) => s.decls.some((d) => d.prop === 'opacity' && !hiddenBy(d.value)));
    if (selfOpacity && hiddenBy(selfOpacity.value) && reveals) {
      return 'clamp: one .001ms run, then its own `opacity:0` — **only the keyframe ever showed it** ⚠';
    }
    return 'clamp: one .001ms run, then its own style';
  }

  /** The covering selector a reduced-motion rule matches this one with — its most specific, as a browser takes it. */
  function coverOf(q, uSel) {
    const hits = q.selectors.filter((s) => covers(s, uSel));
    if (!hits.length) return null;
    return hits.sort((a, b) => cmpSpec(specificity(a), specificity(b))).pop();
  }

  function reducedFor(u) {
    const { rule, item, inherited } = u;
    const kf = byName.get(item.name);
    if (rule.reduce) {
      const dur = item.duration || inherited.duration;
      if (u.important.has('duration')) return `reduced-motion substitute — its ${code(dur)} is \`!important\` and outlives the clamp`;
      if (!clamp) return 'reduced-motion substitute';
      const frame = kf ? frameAt(kf, 100) : null;
      const fill = item.fill || inherited.fill || 'none';
      const hidden = (fill === 'forwards' || fill === 'both') ? invisibleIn(frame) : null;
      return `⚠ reduced-motion substitute, but **the clamp collapses it to ${clamp.duration}** — it never visibly plays` +
        (hidden ? `, and it then holds ${code(hidden)}` : '');
    }
    /* Each selector of the rule is answered on its own — a cancel written for
       `.critter .cr-tail` says nothing about `.hollow-pet .cr-tail` beside it. */
    const per = rule.selectors.map((sel) => [sel, reducedForSelector(u, sel, kf)]);
    const distinct = [...new Set(per.map((x) => x[1]))];
    return distinct.length === 1 ? distinct[0] : per.map(([sel, a]) => `${code(sel)}: ${a}`).join('<br>');
  }

  function reducedForSelector(u, uSel, kf) {
    const { rule, item, inherited } = u;
    /* Every reduced-motion rule that covers this one gets a say, and the cascade picks:
       importance, then specificity, then source order — a media query adds nothing. */
    const cands = [];
    const statics = [];
    let hiddenRule = null;
    for (const q of reduceRules) {
      const qSel = coverOf(q, uSel);
      if (!qSel) continue;
      const qa = anim.get(q);
      if (qa.items && qa.items.some((x) => x.name)) {
        const qi = qa.items[u.index] || qa.items[0];
        const win = wins(q, qa.importantFields.has('name'), rule, u.important.has('name'), qSel, uSel);
        cands.push({ q, qSel, uSel, name: qi.name, win });
      }
      for (const d of q.decls) {
        if (/^(-webkit-)?(animation|transition)/.test(d.prop)) continue;
        if (d.prop === 'display' && d.value === 'none') hiddenRule = qSel;
        statics.push({ qSel, text: `${d.prop}:${d.value}` });
      }
    }
    const answers = [];
    if (hiddenRule) return `hidden — ${code(hiddenRule)} declares \`display:none\``;
    const winners = cands.filter((c) => c.win).sort((a, b) =>
      cmpSpec(specificity(a.qSel), specificity(b.qSel)) || a.q.order - b.q.order);
    /* "Declares", not "sets": whether each of those properties then wins is a cascade of
       its own against every other rule on the element, which this table does not claim. */
    const staticText = (sel) => {
      const own = statics.filter((s) => s.qSel === sel).map((s) => code(s.text));
      return own.length ? `, which also declares ${own.join(' ')}` : '';
    };
    if (winners.length) {
      const w = winners[winners.length - 1];
      answers.push(w.name === 'none'
        ? `cancelled by ${code(w.qSel)}${staticText(w.qSel)}`
        : `replaced by ${code(w.name)} under ${code(w.qSel)}${staticText(w.qSel)}`);
    } else {
      for (const c of cands) {
        answers.push(`${code(c.qSel)}'s cancel loses the cascade here (${specText(specificity(c.qSel))} against ${specText(specificity(c.uSel))})${staticText(c.qSel)}`);
      }
      const shown = new Set(cands.map((c) => c.qSel));
      for (const st of statics) {
        if (shown.has(st.qSel)) continue;
        shown.add(st.qSel);
        answers.push(`${code(st.qSel)} declares ${statics.filter((x) => x.qSel === st.qSel).map((x) => code(x.text)).join(' ')}`);
      }
      if (kf) answers.push(clampAnswer(item, inherited, kf, rule));
    }
    return [...new Set(answers)].join('<br>');
  }

  /* The other half of "switched on by": rules outside reduced motion that switch this
     animation OFF, or swap it for another, in some state — `animation:none` on
     `.flower-btn.squint .tf-lid` (a crit stops the blink), or a `:not()` gate such as
     `#game:not([data-sunbreak="1"]) .wx-ray`, the house pattern for keeping motion off
     until its moment. A rule counts where it wins the cascade against this one. */
  const switchRules = rules.filter((r) => !r.reduce && anim.get(r).items && anim.get(r).items.some((x) => x.name));
  const subjectOf = (sel) => {
    const cs = compounds(sel);
    const sub = simples(cs[cs.length - 1].text);
    return `${sub[0]}|${sub.filter(isPseudoElement).join('')}`;
  };
  function switchesFor(u) {
    const out = [];
    for (const r of switchRules) {
      if (r === u.rule) continue;
      const ra = anim.get(r);
      const ri = ra.items[u.index] || ra.items[0];
      if (!ri.name || ri.name === u.item.name) continue;
      for (const uSel of u.rule.selectors) {
        const hits = r.selectors.filter((rs) => (covers(rs, uSel) || covers(uSel, rs) || subjectOf(rs) === subjectOf(uSel)) &&
          wins(r, ra.importantFields.has('name'), u.rule, u.important.has('name'), rs, uSel));
        if (!hits.length) continue;
        out.push({ rSel: hits.join(', '), name: ri.name, everywhere: hits.some((h) => covers(h, uSel)) });
        break;
      }
    }
    return out;
  }
  const switchText = (sw) => sw.map((x) => (x.everywhere
    ? `**overridden everywhere by ${code(x.rSel)}** (${x.name === 'none' ? 'no animation' : code(x.name)})`
    : x.name === 'none' ? `stopped where ${code(x.rSel)}` : `swapped for ${code(x.name)} where ${code(x.rSel)}`));

  // ---- table: keyframes ----
  const kfRows = [];
  const sortedKf = [...keyframes].sort((a, b) => byText(a.name.toLowerCase(), b.name.toLowerCase()));
  let useCount = 0;
  for (const kf of sortedKf) {
    const animates = `${propsOf(kf).map(code).join(' ')} at ${stopsOf(kf).join(' ')}%` +
      (kf.media.length ? ` — declared inside ${kf.media.map((m) => code(mediaLabel(m))).join(' ')}` : '');
    const users = cssUsers.get(kf.name) || [];
    if (!users.length) {
      if (jsUsers.has(kf.name)) {
        kfRows.push(`| ${code(kf.name)} | ${cell(animates)} | — | — | — | played from the JavaScript: ${jsUsers.get(kf.name).map(code).join(', ')} | — | — |`);
      } else {
        const d = playedByDropped.get(kf.name);
        kfRows.push(`| ${code(kf.name)} | ${cell(animates)} | — | — | — | ${cell(`**never plays** — its only rule, ${code(d.prelude)}, is dropped by the browser (see *What the browser drops*)`)} | — | — |`);
      }
      continue;
    }
    for (const u of users) {
      useCount += 1;
      const it = u.item;
      const val = (f) => (f in it ? it[f] : f in u.inherited ? u.inherited[f] : null);
      const from = (f) => (!(f in it) && f in u.inherited ? ` (from ${code(u.base.selectors[0])})` : '');
      const dur = `${code(val('duration') || '0s')}${from('duration')}`;
      const timing = `${code(val('timing') || 'ease')}${from('timing')}`;
      const runs = [];
      const iter = val('iterations') || '1';
      runs.push(iter === 'infinite' ? '∞' : `×${iter}`);
      const dir = val('direction');
      if (dir && dir !== 'normal') runs.push(dir);
      const fill = val('fill');
      if (fill && fill !== 'none') runs.push(`fill ${fill}${from('fill')}`);
      const delay = val('delay');
      if (delay && !/^[-+]?0+(\.0+)?m?s$/.test(delay)) runs.push(`delay ${code(delay)}`);
      const play = val('play');
      if (play && play !== 'running') runs.push(play);
      const mods = modifiers.filter((m) => m.rule.reduce === u.rule.reduce &&
        m.rule.selectors.some((ms) => u.rule.selectors.some((us) => extendsSel(ms, us) || ms === us)));
      const modText = mods.map((m) => `${code(m.rule.selectors[0])} sets ${m.longhands.map((l) => code(`${l.field} ${l.value}`)).join(' ')}`);
      const played = u.rule.selectors.map(code).join('<br>') + (modText.length ? `<br>↳ ${modText.join('<br>↳ ')}` : '');
      const sw = u.rule.reduce ? [] : switchesFor(u);
      const gates = [...new Set(u.rule.selectors.map((s) => describeGate(s, u.rule.media)))]
        .map((g) => (u.rule.reduce ? `reduced motion — ${g}` : sw.length && g === 'always on' ? 'on by default' : g))
        .concat(switchText(sw)).join('<br>');
      const flag = !u.rule.reduce && !sw.length && iter === 'infinite' && u.rule.selectors.some((s) => gateOf(s).always) &&
        !u.rule.media.some((m) => !REDUCE.test(m)) ? ' ∞' : '';
      kfRows.push(`| ${code(kf.name)} | ${cell(animates)} | ${cell(dur)} | ${cell(timing)} | ${cell(runs.join(' · '))} | ${cell(played)} | ${cell(gates + flag)} | ${cell(reducedFor(u))} |`);
    }
  }

  // ---- table: longhand-only rules ----
  const modRows = modifiers.map((m) => {
    const ctx = m.rule.reduce ? 'reduced motion only' : [...new Set(m.rule.selectors.map((s) => describeGate(s, m.rule.media)))].join('<br>');
    return `| ${cell(m.rule.selectors.map(code).join('<br>'))} | ${cell(m.longhands.map((l) => code(`animation-${l.field === 'timing' ? 'timing-function' : l.field === 'iterations' ? 'iteration-count' : l.field === 'fill' ? 'fill-mode' : l.field === 'play' ? 'play-state' : l.field}: ${l.value}${l.important ? ' !important' : ''}`)).join('<br>'))} | ${cell(ctx)} |`;
  });

  // ---- table: transitions ----
  const trRows = [];
  let transitionItems = 0;
  const describeTransition = (t) => {
    const bits = [];
    if (t.items) {
      bits.push(t.items.every((i) => i.none) ? 'transition:none'
        : `transition:${t.items.map((i) => `${i.property || 'all'} ${i.duration || '0s'}`).join(', ')}`);
    }
    for (const l of t.longhands) bits.push(`transition-${l.field === 'timing' ? 'timing-function' : l.field}:${l.value}${l.important ? ' !important' : ''}`);
    return bits.map(code).join(' ');
  };
  /* Several properties on one timing are one fact, not three: `left top background` at
     1.6s linear reads as one row, and only a genuinely mixed list is spelled out per property. */
  const column = (values, mixed) => {
    if (!values.length) return '—';
    return mixed ? values.map(code).join('<br>') : code(values[0]);
  };
  /* What a transition becomes under reduced motion, property by property: the list of
     properties from the winning rule that sets it, and the duration from the clamp unless
     an `!important` duration outranks it. A rule that is a narrower case of this one (the
     end phase of a sky, say) is reported as "where …". */
  function transitionReduced(r, t) {
    const notes = [];
    let props = null;
    let propsBy = null;
    let dur = null;
    let durBy = null;
    for (const q of reduceRules) {
      const qt = ruleTransition(q);
      if (!qt) continue;
      const uSel = r.selectors.find((us) => coverOf(q, us));
      if (uSel) {
        const qSel = coverOf(q, uSel);
        const turnsOff = qt.items && qt.items.every((i) => i.none);
        for (const f of ['property', 'duration']) {
          const theirs = qt.fields[f];
          if (!theirs || (turnsOff && f === 'duration')) continue;
          const mine = t.fields[f];
          if (mine && !wins(q, theirs.important, r, mine.important, qSel, uSel)) {
            notes.push(`${code(qSel)}'s ${f} loses the cascade here (${specText(specificity(qSel))} against ${specText(specificity(uSel))}${q.order < r.order ? ', and it comes first' : ''})`);
            continue;
          }
          if (f === 'property') {
            props = qt.items && qt.items.every((i) => i.none) ? 'none'
              : theirs.value || (qt.items || []).map((i) => i.property || 'all').join(', ');
            propsBy = qSel;
          } else if (theirs.important || !clamp) {
            dur = theirs.value || (qt.items || []).map((i) => i.duration || '0s').join(', ');
            durBy = qSel;
          } else {
            notes.push(`${code(qSel)} asks for ${code(theirs.value || (qt.items || []).map((i) => i.duration).join(', '))}, but without \`!important\` the clamp still makes it ${clamp.transition}`);
          }
        }
        continue;
      }
      const narrower = q.selectors.find((qs) => r.selectors.some((us) => covers(us, qs)));
      if (narrower && qt.fields.duration && qt.fields.duration.important) {
        notes.push(`where ${code(narrower)}: ${code(qt.fields.duration.value || '')} (\`!important\`)`);
      }
    }
    if (props === 'none') return [`transitions off — ${code(propsBy)}`, ...notes].join('<br>');
    const what = props ? `${code(props)} only (${code(propsBy)})` : 'the same properties';
    const over = dur ? `over ${code(dur)} (${code(durBy)}, \`!important\`)`
      : clamp && clamp.transition ? `over ${clamp.transition} (the clamp)` : 'unchanged';
    return [`${what} ${over}`, ...notes].join('<br>');
  }

  for (const r of rules) {
    if (clamp && r === clamp.rule) continue;
    const t = ruleTransition(r);
    if (!t) continue;
    const off = t.items && t.items.every((i) => i.none);
    const props = [];
    const durs = [];
    const timings = [];
    const delays = [];
    if (t.items && !off) {
      for (const it of t.items) {
        transitionItems += 1;
        props.push(it.property || 'all');
        durs.push(it.duration || '0s');
        timings.push(it.timing || 'ease');
        delays.push(it.delay || '0s');
      }
    }
    for (const l of t.longhands) {
      const v = `${l.value}${l.important ? ' !important' : ''} (longhand)`;
      if (l.field === 'property') props.push(v);
      if (l.field === 'duration') durs.push(v);
      if (l.field === 'timing') timings.push(v);
      if (l.field === 'delay') delays.push(v);
    }
    const noDelay = delays.every((d) => /^[-+]?0+(\.0+)?m?s$/.test(d));
    const mixed = [durs, timings, noDelay ? [] : delays].some((v) => new Set(v).size > 1);
    const propCell = off ? '**none** — transitions off' : props.map(code).join(mixed ? '<br>' : ' ') || '—';
    const delayCell = noDelay ? '—' : column(delays, mixed);
    let reduced;
    if (off) {
      reduced = '—';
    } else if (r.reduce) {
      const imp = t.fields.duration && t.fields.duration.important;
      reduced = imp ? 'reduced-motion rule — its duration is `!important` and outlives the clamp'
        : `reduced-motion rule${clamp && clamp.transition ? `, but the clamp still makes it ${clamp.transition}` : ''}`;
    } else if (true) {
      reduced = transitionReduced(r, t);
    } else {
      const ans = [];
      for (const q of reduceRules) {
        const qt = ruleTransition(q);
        if (!qt) continue;
        const uSel = r.selectors.find((us) => coverOf(q, us));
        if (!uSel) continue;
        const qSel = coverOf(q, uSel);
        /* The same cascade question as the keyframes: a reduced-motion rule written
           above, or less specifically than, the transition it answers does nothing. */
        if (wins(q, qt.important, r, t.important, qSel, uSel)) {
          ans.push(`${code(qSel)} sets ${describeTransition(qt)}`);
        } else {
          ans.push(`${code(qSel)}'s ${describeTransition(qt)} loses the cascade here (${specText(specificity(qSel))} against ${specText(specificity(uSel))}, ${q.order < r.order ? 'and it comes first' : 'on specificity'})`);
          if (clamp && clamp.transition) ans.push(`clamp: ${clamp.transition}`);
        }
      }
      if (!ans.length) ans.push(clamp && clamp.transition ? `clamp: ${clamp.transition}` : 'untouched');
      reduced = ans.join('<br>');
    }
    const gates = [...new Set(r.selectors.map((s) => describeGate(s, r.media)))]
      .map((g) => (r.reduce ? `reduced motion — ${g}` : g)).join('<br>');
    trRows.push(`| ${cell(r.selectors.map(code).join('<br>'))} | ${cell(propCell)} | ${cell(off ? '—' : column(durs, mixed))} | ${cell(off ? '—' : column(timings, mixed))} | ${cell(off ? '—' : delayCell)} | ${cell(gates)} | ${cell(reduced)} |`);
  }

  // ---- the easing vocabulary ----
  const easings = new Map();
  const tally = (e, kind) => {
    const key = e.replace(/\s+/g, '');
    if (!easings.has(key)) easings.set(key, { anim: 0, trans: 0 });
    easings.get(key)[kind] += 1;
  };
  for (const u of uses) {
    if (u.item.name === 'none') continue;
    tally(u.item.timing || u.inherited.timing || 'ease', 'anim');
  }
  for (const r of rules) {
    const t = ruleTransition(r);
    if (t && t.items) for (const it of t.items) if (!it.none) tally(it.timing || 'ease', 'trans');
  }
  const easeRows = [...easings].sort((a, b) => (b[1].anim + b[1].trans) - (a[1].anim + a[1].trans) || byText(a[0], b[0]))
    .map(([e, n]) => `| ${code(e)} | ${n.anim} | ${n.trans} |`);

  // ---- JavaScript: the FX surface and every call into it ----
  const api = fxApi();
  const apiRows = [...api].filter(([, v]) => v.kind === 'function')
    .map(([name, v]) => `| ${code(name)} | ${code(v.signature)} | ${v.reduced} |`);
  const fxRows = [];
  for (const f of js) {
    const re = /\bFX(?:\?\.|\.|\[\s*(['"]))([A-Za-z_$][\w$]*)\1?\]?(\s*\()?/g;
    let m;
    while ((m = re.exec(f.code))) {
      const member = m[2];
      if (!api.has(member)) {
        const { idx } = lineColAt(f.code, m.index);
        problems.push(`${f.file}:${idx + 1} reaches FX.${member}, which fx.js does not export`);
        continue;
      }
      if (m[3] && api.get(member).kind !== 'function') {
        const { idx } = lineColAt(f.code, m.index);
        problems.push(`${f.file}:${idx + 1} calls FX.${member}(), which is a readout, not a function — it throws`);
        continue;
      }
      /* centerOf() is a layout read, not motion — it is where most calls get their x and y. */
      if (!m[3] || member === 'centerOf') continue;
      const open = m.index + m[0].length - 1;
      const { idx, col } = lineColAt(f.code, m.index);
      const where = nameAt(f.lines, idx, col);
      fxRows.push({ file: f.file, where, call: `${f.code.slice(m.index, open).replace(/\s+/g, '')}(${argsAt(f.code, open)})`, member });
    }
  }

  // ---- JavaScript: choreography that is not a particle ----
  const CHOREO = [
    [/\brequestAnimationFrame\(/g, 'requestAnimationFrame'],
    [/\bvoid\s+[\w$.[\]()]+\.offsetWidth\b/g, 'reflow restart'],
    [/\.style\.transform\s*=(?!=)/g, 'inline transform'],
    [/\.style\.transition\s*=(?!=)/g, 'inline transition'],
    [/\.style\.animation(?:Name)?\s*=(?!=)/g, 'inline animation'],
    [/\bgetAnimations\(/g, 'getAnimations'],
    [/\.animate\(/g, 'Web Animations'],
    [/animation(?:-[a-z]+)*\s*:/g, 'inline animation style'],
  ];
  const choreoRows = [];
  for (const f of js) {
    for (const [re, mech] of CHOREO) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(f.code))) {
        const { idx, col } = lineColAt(f.code, m.index);
        const where = nameAt(f.lines, idx, col);
        let stmt = f.lines[idx].trim();
        if (stmt.length > 110) stmt = `${stmt.slice(0, 107)}…`;
        let joins = '';
        if (mech === 'reflow restart') {
          const added = (l) => [...new Set([...(l || '').matchAll(/classList\.add\(\s*(['"])([\w-]+)\1/g)].map((x) => x[2]))];
          const classes = [idx, idx + 1, idx - 1].map((k) => added(f.lines[k])).find((c) => c.length) || [];
          /* The class is known; the element is not. So every rule that plays a keyframe
             under that class is listed with its selector, and the reader picks the one
             whose element this is — rather than the tool guessing and being wrong. */
          const played = [];
          for (const c of classes) {
            for (const u of uses) {
              if (u.rule.reduce || u.item.name === 'none') continue;
              const sel = u.rule.selectors.find((s) => compounds(s).some((cp) => simples(cp.text).includes(`.${c}`)));
              if (sel) played.push(`${code(u.item.name)} on ${code(sel)}`);
            }
          }
          if (classes.length) joins = ` → restarts ${classes.map((c) => code(`.${c}`)).join(' ')}${played.length ? ` — ${[...new Set(played)].join(', ')}` : ''}`;
        }
        choreoRows.push({ file: f.file, where, mech, text: `${code(stmt)}${joins}`, idx });
      }
    }
  }
  choreoRows.sort((a, b) => byText(a.file, b.file) || a.idx - b.idx || byText(a.mech, b.mech));

  // ---- JavaScript: the motion variables it writes ----
  const motionVars = new Map();
  const noteVars = (text, where) => {
    for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!motionVars.has(m[1])) motionVars.set(m[1], new Set());
      motionVars.get(m[1]).add(where);
    }
  };
  for (const kf of keyframes) for (const s of kf.stops) for (const d of s.decls) noteVars(d.value, `@keyframes ${kf.name}`);
  for (const r of rules) {
    for (const d of r.decls) {
      if (/^(-webkit-)?(animation|transition)/.test(d.prop)) noteVars(d.value, r.selectors[0]);
    }
  }
  const varRows = [];
  for (const [v, readers] of [...motionVars].sort((a, b) => byText(a[0], b[0]))) {
    const writers = [];
    for (const f of js) {
      const vv = v.replace(/-/g, '\\-');
      const re = new RegExp(`setProperty\\(\\s*(['"\`])${vv}\\1|style="[^"]*${vv}\\s*:|style='[^']*${vv}\\s*:`, 'g');
      let m;
      while ((m = re.exec(f.code))) {
        const { idx, col } = lineColAt(f.code, m.index);
        writers.push(`${code(f.file)} ${code(nameAt(f.lines, idx, col).name)}`);
      }
    }
    if (!writers.length) continue;
    varRows.push(`| ${code(v)} | ${[...readers].sort().map(code).join('<br>')} | ${[...new Set(writers)].join('<br>')} |`);
  }

  // ---- assemble ----
  const fxByFile = new Map();
  for (const r of fxRows) fxByFile.set(r.file, (fxByFile.get(r.file) || 0) + 1);
  const ruleCount = new Set(uses.filter((u) => u.item.name !== 'none').map((u) => u.rule)).size;
  const transitionRules = trRows.length;
  const warnings = kfRows.concat(modRows).join('\n').split('⚠').length - 1;

  const neverPlays = keyframes.filter((kf) => !cssUsers.has(kf.name) && !jsUsers.has(kf.name)).length;
  const out = [];
  out.push(MARK_START);
  out.push('');
  out.push(
    `_Read out of \`style.css\` and the JavaScript on this run: **${keyframes.length} keyframes**, played by ` +
    `**${useCount} uses in ${ruleCount} rules**; **${transitionRules} rules that set a transition** ` +
    `(${transitionItems} transitions, plus longhand overrides); **${fxRows.length} calls into \`FX\`** across ` +
    `${fxByFile.size} files; and **${choreoRows.length} pieces of JavaScript choreography**. ` +
    `Every keyframe is played by something and every rule plays a keyframe that exists — the run ` +
    `refuses to write this block otherwise` +
    (dropped.length ? `, except for ${dropped.length} rule${dropped.length === 1 ? '' : 's'} the browser drops, known and filed, ` +
      `which leave ${neverPlays} keyframe${neverPlays === 1 ? '' : 's'} that never play${neverPlays === 1 ? 's' : ''}` : '') +
    `. ${warnings ? `**${warnings} ⚠ mark${warnings === 1 ? '' : 's'}** below ${warnings === 1 ? 'is a' : 'are'} ` +
    `reduced-motion answer${warnings === 1 ? '' : 's'} that ${warnings === 1 ? 'is' : 'are'} wrong whatever the element.` : 'No reduced-motion answer carries a ⚠ mark.'}_`
  );
  out.push('');
  if (dropped.length) {
    out.push('### What the browser drops');
    out.push('');
    out.push('Rules that are in `style.css` and not in the game: the browser reads past them without a word,');
    out.push('so nothing below lists them as playing. Each is filed in ' + KNOWN_DROPPED_FILED + ';');
    out.push('fixing one is a change to the game, and the run then asks for its entry to be removed.');
    out.push('');
    out.push('| Rule | Why the browser drops it | What it would have done |');
    out.push('| --- | --- | --- |');
    for (const d of dropped) {
      const would = d.decls.filter((x) => /^(-webkit-)?(animation|transition|transform|opacity)/.test(x.prop))
        .map((x) => code(`${x.prop}:${x.value}`)).join('<br>') || '—';
      out.push(`| ${cell(code(d.prelude))} | ${cell(`${d.why}: ${KNOWN_DROPPED.get(dropKey(d))}`)} | ${cell(would)} |`);
    }
    out.push('');
  }
  out.push('### The keyframes, and every rule that plays one');
  out.push('');
  out.push('One row per rule that plays a keyframe, keyframes in alphabetical order. **Animates** is every');
  out.push('property the keyframe touches and the stops it sets them at. **Runs** is the iteration count,');
  out.push('then direction, fill and delay when they are not the default. **Switched on by** is read off');
  out.push('the selector: the ancestor state or place the element has to be inside, and the classes or');
  out.push('attributes on the element itself — *always on* means no state is needed, ∞ marks the ones');
  out.push('that also never stop, and *stopped where* names a rule that switches the animation off (or');
  out.push('swaps it) in some state. `(from .x)` means a value this rule inherits from the rule it');
  out.push('extends, and `↳` lines are rules that adjust it with a longhand. **Reduced motion** is');
  out.push('worked out from the cascade, as a browser does: a reduced-motion rule that names the same');
  out.push('element answers it only if it wins — `!important` first, then specificity (the `a-b-c`');
  out.push('triples: ids, classes, elements), then source order. Where nothing answers, the global clamp');
  out.push('does: one run of 0.001 ms, then the element\'s own style, or its end frame if it fills forwards.');
  out.push('');
  out.push('| Keyframe | Animates | Duration | Easing | Runs | Played by | Switched on by | Reduced motion |');
  out.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  out.push(...kfRows);
  out.push('');
  if (modRows.length) {
    out.push('### Rules that adjust an animation without naming one');
    out.push('');
    out.push('A longhand on its own changes whatever animation the element already has — a stagger, a');
    out.push('slower variant, a paused state. The keyframe table above lists each beside the rule it');
    out.push('extends when the two selectors line up.');
    out.push('');
    out.push('| Rule | Sets | Switched on by |');
    out.push('| --- | --- | --- |');
    out.push(...modRows);
    out.push('');
  }
  out.push('### Transitions');
  out.push('');
  out.push('Every rule that sets `transition` or one of its longhands, in stylesheet order. A row that');
  out.push('sets only a longhand (a duration, say) retimes whatever transition the element already has.');
  out.push('');
  out.push('| Rule | Properties | Duration | Easing | Delay | Switched on by | Reduced motion |');
  out.push('| --- | --- | --- | --- | --- | --- | --- |');
  out.push(...trRows);
  out.push('');
  out.push('### The easing vocabulary');
  out.push('');
  out.push('Every timing function in the stylesheet and how often it is used — the house curves are the');
  out.push('ones at the top.');
  out.push('');
  out.push('| Easing | Animations | Transitions |');
  out.push('| --- | --- | --- |');
  out.push(...easeRows);
  out.push('');
  out.push('### The `FX` calls, as `fx.js` exports them');
  out.push('');
  out.push('The signature is copied out of `fx.js`, defaults and all. **Under reduced motion** is read');
  out.push('from the same function body — a cap on the count, an early return, or nothing.');
  out.push('');
  out.push('| Call | Signature | Under reduced motion |');
  out.push('| --- | --- | --- |');
  out.push(...apiRows);
  out.push('');
  out.push('### Every call into `FX`');
  out.push('');
  out.push('Where each one is, as a function name and the call itself — both grep-able, per the anchor');
  out.push('standard. *in setTimeout* means the call is a delayed beat; *on \'x\'* means it runs from an');
  out.push('event listener inside the named function.');
  out.push('');
  out.push('| File | Where | Call |');
  out.push('| --- | --- | --- |');
  for (const r of fxRows.sort((a, b) => byText(a.file, b.file))) {
    out.push(`| ${code(r.file)} | ${cell(whereText(r.where))} | ${cell(code(r.call))} |`);
  }
  out.push('');
  out.push('### JavaScript choreography');
  out.push('');
  out.push('Motion the stylesheet cannot start by itself: a class added on the next frame so a');
  out.push('transition has a start state, a class removed and re-added around a forced reflow so a');
  out.push('keyframe replays, a transform written straight from a finger, an inline animation style.');
  out.push('Some `requestAnimationFrame` rows only measure a room on the frame after it appears. For a');
  out.push('reflow restart the class is known and the element is not, so every rule that plays a keyframe');
  out.push('under that class is listed — the one that replays is whichever matches the element.');
  out.push('');
  out.push('| File | Where | Mechanism | Statement |');
  out.push('| --- | --- | --- | --- |');
  for (const r of choreoRows) {
    out.push(`| ${code(r.file)} | ${cell(whereText(r.where))} | ${r.mech} | ${cell(r.text)} |`);
  }
  out.push('');
  if (varRows.length) {
    out.push('### Motion variables the JavaScript writes');
    out.push('');
    out.push('Custom properties that a keyframe, an animation or a transition reads and that the');
    out.push('JavaScript sets per element — a randomised flight path, a per-drop delay, a live duration —');
    out.push('through `setProperty()` or an inline `style="…"`. A name is shared across unrelated elements');
    out.push('(`--dur` is several different clocks), so a writer listed here writes the name for *some* of');
    out.push('its readers, not necessarily all; the stylesheet also sets many of these per element.');
    out.push('');
    out.push('| Variable | Read by | Written by |');
    out.push('| --- | --- | --- |');
    out.push(...varRows);
    out.push('');
  }
  out.push(MARK_END);

  return {
    problems,
    block: out.join('\n'),
    counts: {
      keyframes: keyframes.length, plain, uses: useCount, rules: ruleCount,
      transitionRules, transitionItems, fx: fxRows.length, fxFiles: fxByFile.size,
      choreo: choreoRows.length, vars: varRows.length, warnings, clamp: Boolean(clamp),
      dropped: dropped.length, neverPlays,
    },
  };
}

function main() {
  const { problems, block, counts } = build();
  if (problems.length) {
    console.error(`\nexport-motion — ${problems.length} problem(s), nothing written:\n`);
    for (const p of problems) console.error(`  ! ${p}`);
    console.error('');
    return 1;
  }
  if (!fs.existsSync(DOC_FILE)) {
    console.error(`\nexport-motion — ${path.relative(ROOT, DOC_FILE)} does not exist; nothing written.\n`);
    return 1;
  }
  const doc = fs.readFileSync(DOC_FILE, 'utf8');
  /* Exactly one block. A second copy — or prose that quotes the BEGIN marker — would make
     the first occurrence the one rewritten, and everything between it and the real block
     would be deleted as if it were generated. */
  if (doc.split(MARK_START).length !== 2 || doc.split(MARK_END).length !== 2) {
    console.error(`\nexport-motion — ${path.relative(ROOT, DOC_FILE)} must hold exactly one BEGIN and one END marker; nothing written.\n`);
    return 1;
  }
  const a = doc.indexOf(MARK_START);
  const b = doc.indexOf(MARK_END);
  if (a === -1 || b === -1 || b < a) {
    console.error(
      `\nexport-motion — ${path.relative(ROOT, DOC_FILE)} has no generated block.\n` +
      `  Add these two lines where the inventory belongs and run again:\n` +
      `    ${MARK_START}\n    ${MARK_END}\n`
    );
    return 1;
  }
  const current = doc.slice(a, b + MARK_END.length);
  const summary =
    `${counts.keyframes} keyframes (a plain scan agrees at ${counts.plain}), ${counts.uses} uses in ${counts.rules} rules, ` +
    `${counts.transitionRules} transition rules, ${counts.fx} FX calls in ${counts.fxFiles} files, ` +
    `${counts.choreo} choreography sites, ${counts.vars} JS-written motion variables, ${counts.warnings} ⚠, ` +
    `${counts.dropped} rules the browser drops (known), ${counts.neverPlays} keyframe(s) that never play`;
  if (CHECK_ONLY) {
    if (current !== block) {
      const was = current.split('\n');
      const now = block.split('\n');
      let k = 0;
      while (k < was.length && was[k] === now[k]) k += 1;
      const docLine = doc.slice(0, a).split('\n').length + k;
      const again = ['node tools/export-motion.js', argPath('--css') && `--css ${CSS_FILE}`, argPath('--doc') && `--doc ${DOC_FILE}`]
        .filter(Boolean).join(' ');
      console.error(
        `\nexport-motion --check — the inventory in ${DOC_FILE} is stale, first at line ${docLine}:\n` +
        `    doc:  ${(was[k] || '(end)').slice(0, 160)}\n    code: ${(now[k] || '(end)').slice(0, 160)}\n` +
        `  Run: ${again}\n`
      );
      return 1;
    }
    console.log(`\nexport-motion --check — the inventory matches the code: ${summary}\n`);
    return 0;
  }
  fs.writeFileSync(DOC_FILE, doc.slice(0, a) + block + doc.slice(b + MARK_END.length));
  console.log(`\nexport-motion — ${path.relative(ROOT, DOC_FILE)} rewritten: ${summary}\n`);
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`\nexport-motion failed: ${err.message}\n`);
  process.exit(2);
}
