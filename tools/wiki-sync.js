#!/usr/bin/env node
'use strict';

/*
 * wiki-sync.js — mirror docs/ onto the project's GitHub wiki.
 *
 *   node tools/wiki-sync.js              generate, verify, commit, push
 *   node tools/wiki-sync.js --dry-run    generate and verify only; touch no git state
 *   node tools/wiki-sync.js --no-push    commit the wiki clone but do not push
 *
 * docs/ is the source of truth. The wiki is a read-only window onto it, regenerated
 * wholesale every run: every page is deleted and rewritten, so an edit made on the wiki
 * is gone the next time this script runs. Nothing is ever merged back.
 *
 * The one job that is easy to get wrong: GitHub wiki URLs carry no `.md` extension, so
 * every internal link has to be rewritten or it 404s silently. See rewriteTarget().
 *
 * No dependencies, no build step — the same rules as the rest of the repo.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------- configuration

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const WIKI_URL = 'https://github.com/Deep-Forest-Labs/GardenofWonder.wiki.git';
const PAGES = 'https://deep-forest-labs.github.io/GardenofWonder';
const BLOB = 'https://github.com/Deep-Forest-Labs/GardenofWonder/blob/main';
const TREE = 'https://github.com/Deep-Forest-Labs/GardenofWonder/tree/main';

// The clone lives outside the repository so it can never be committed into it.
const WIKI_DIR = process.env.WIKI_DIR || path.join(path.dirname(REPO_ROOT), 'GardenofWonder.wiki');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const NO_PUSH = argv.includes('--no-push') || DRY_RUN;

const FOOTER =
  'Mirrored from `docs/` in the main repo — the repo is the source of truth. ' +
  'Edit there, never here; the sync overwrites this wiki. ' +
  'Regenerate: `node tools/wiki-sync.js`';

// ---------------------------------------------------------------- small helpers

const say = (...a) => console.log(...a);
const warn = (...a) => console.log('  !', ...a);

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function today() {
  // Local date, YYYY-MM-DD — used only in the commit message.
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** GitHub's heading-anchor algorithm, near enough: lowercase, drop punctuation, spaces to hyphens. */
function slug(heading) {
  return heading
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/ /g, '-');
}

// ---------------------------------------------------------------- link rewriting

/*
 * Every link target in docs/ falls into one of these buckets. Anything that matches none
 * of them is left alone and reported at the end, so a new shape of link can never be
 * silently mangled — it shows up as a warning instead.
 */
function rewriteTarget(target, ctx) {
  // External, mail, and bare same-page anchors pass through untouched.
  if (/^(https?:|mailto:|#)/.test(target)) return target;

  const hashAt = target.indexOf('#');
  let filePart = hashAt === -1 ? target : target.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : target.slice(hashAt);

  filePart = filePart.replace(/^\.\//, '');
  if (filePart === '') return target;

  // The pitch is a standalone HTML page. A wiki cannot render it; link the live copy.
  if (/garden-year-pitch\.html$/.test(filePart)) {
    ctx.external++;
    return `${PAGES}/docs/garden-year-pitch.html`;
  }

  // docs/legacy/ is excluded from the mirror — send readers to the repo instead.
  if (filePart === 'legacy' || filePart === 'legacy/' || filePart.startsWith('legacy/')) {
    ctx.external++;
    const rest = filePart.replace(/^legacy\/?/, '');
    return rest ? `${BLOB}/docs/legacy/${rest}` : `${TREE}/docs/legacy`;
  }

  // Anything reaching out of docs/ into the repository proper.
  if (filePart.startsWith('../')) {
    ctx.external++;
    const rel = filePart.slice(3).replace(/\/$/, '');
    // The spikes are worth more running than as source, and so is the old build:
    // docs/README.md calls ../legacy/ "the playable previous build", so link the live copy.
    if (/^tools\/[a-z0-9-]+-spike\.html$/.test(rel)) return `${PAGES}/${rel}`;
    if (rel === 'legacy') return `${PAGES}/legacy/`;
    // A trailing slash in the original means a directory.
    if (filePart.endsWith('/')) return `${TREE}/${rel}`;
    return `${BLOB}/${rel}${hash}`;
  }

  // A sibling document: this is the rewrite that matters. `03-systems.md` -> `03-systems`.
  if (filePart.endsWith('.md')) {
    const page = filePart.slice(0, -3);
    ctx.internal.push({ page, hash: hash.slice(1), from: ctx.file });
    return page + hash;
  }

  ctx.unhandled.push({ target, from: ctx.file });
  return target;
}

/**
 * Rewrite every inline link in a markdown document, skipping fenced code blocks and
 * inline code spans so a documented example is never rewritten into a real link.
 */
function rewriteLinks(markdown, ctx) {
  let fence = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence;
        return line;
      }
      if (fence) return line;
      // Odd indices are code spans; leave them alone.
      return line
        .split(/(`+[^`]*`+)/g)
        .map((part, i) =>
          i % 2
            ? part
            : part.replace(/\]\(([^)\s]+)\)/g, (_m, t) => `](${rewriteTarget(t, ctx)})`)
        )
        .join('');
    })
    .join('\n');
}

// ---------------------------------------------------------------- the index copy

/*
 * One line per document, written for two Unity engineers who have never seen the project.
 * Status matters more than subject matter — say plainly whether a thing is built.
 *
 * Every docs/*.md must appear here. The run fails loudly if one does not, so adding a
 * document to docs/ without describing it here is caught rather than quietly dropped.
 */
const DESC = {
  'HANDOFF.md': 'Where the project stands, what is already decided, and what to do next. Its **Traps in this codebase** section is the highest-value page in the whole mirror.',
  '01-overview.md': 'What the game is and what it is trying to feel like. Five minutes, and everything else makes more sense.',
  '32-the-garden-year.md': 'The master design — the seasonal world, the Turn (prestige), Saved Seeds and petals. **Read the plain-English glossary at the top first:** every word this project uses, defined in one table.',
  '09-conventions.md': 'The house rules and the playbooks. Written for the web build, but the layering rules behind them are the ones worth carrying into Unity.',

  '03-systems.md': 'How every mechanic actually behaves. The largest document here and the one you will live in.',
  '04-economy.md': 'Every number the game runs on, and where each one is earned or spent.',
  '07-save-data.md': 'The shape of saved state — what persists, what migrates, and what the Turn does and does not wipe.',
  '33-year-one-economy.md': "The Year's numbers: unlock prices, the Saved Seeds mint, petal costs and effects, Fall's plants and migration.",
  '06-audio-and-fx.md': 'Sound, particles and game feel. All audio is synthesized at runtime — there are no audio files to port.',
  '05-art-direction.md': 'How everything is drawn, styled and animated. All art is inline SVG and CSS; the only binary files in the project are the home-screen icons.',

  '34-build-plan.md': 'The phases, the review gates, and the critic gauntlet every phase runs. Phase 1 is built and reviewed.',
  '11-known-issues.md': 'Everything known to be broken or unfinished, including what was knowingly left behind.',

  '02-architecture.md': 'The module map — which file owns what, and the layering rules between them.',
  '08-ui-and-layout.md': 'Layout, the sheet, and accessibility.',
  '10-decision-log.md': 'Why everything is the way it is, newest first — the reasoning and the rejected alternatives, not the diff.',
  '12-meta-layer-design.md': 'The multi-region cozy world: five regions, the resource graph, and the currency policy. Design, not built.',
  '13-order-system.md': 'The Market — the engine that drives the whole resource graph.',
  '14-economy-model.md': 'Authoring resources and recipes, and how the tuning numbers hang together.',
  '15-navigation-and-ia.md': 'The dock, tabs, menus, and where each feature lives.',
  '16-progression-and-quests.md': 'Quests, levels, reputation, boosts and the Almanac. Phases 1–5 built, phase 6 specified.',
  '17-market-and-positioning.md': 'Who this game is for and what it competes with. Research, not the game — and doc 38 corrects four of its numbers.',
  '18-mutations-and-weather.md': 'Mutations and weather. Specified; the sky half shipped separately as 41-weather-staging.',
  '19-card-album.md': 'Card packs, sets, seasons and the album — a parallel meta, deliberately independent of the garden.',
  '20-card-art-prompts.md': 'The prompts and style rules for generating card art outside the project, and how it gets wired in.',
  '21-potting-bench.md': 'The merge bench: the chain, the entry tier, cascade timing, the deadlock, and what replaced the Apothecary.',
  '22-creatures.md': 'Creatures, attraction, keepsakes and the critter yard — the habitat direction.',
  '23-installable-pwa.md': 'The manifest, the service worker, the icons and offline play. Web-specific; a Unity build replaces all of it.',
  '24-remote-sessions.md': 'Working on the game from a phone: the clone-and-push loop, the probe, and why a remote session works on a branch.',
  '25-world-map.md': 'The world map — what belongs on it and in what order, and why it is not ten gardens. Research and design, not built.',
  '26-goods-catalog.md': 'Goods, crops and order families: six families, three production shapes, and the rollout. Design, not built.',
  '27-design-audit.md': 'The honest state of the design as a whole — what is strong, redundant, missing, or should be cut.',
  '28-the-loop.md': "What a session is and what the player's job is once the loop automates. Proposal, not built.",
  '29-direction-and-odds.md': 'Four directions for what game this is, with the odds on each and what the distribution channels reward. Analysis, not the game.',
  '30-prestige-directions.md': 'Five priced prestige options and why a bounded economy cannot prestige. The option space doc 32 came from.',
  '31-per-seed-prestige.md': 'The per-seed prestige design, pressure-tested: the currency formula, the wall size, and the 25 invariants it touches. The thinking that became doc 32.',
  '35-morning-review.md': 'Every call the unattended overnight run made alone, with what changing each one costs. Read beside the turn and fall spikes.',
  '36-hud-and-dock.md': 'The dock, the bottom half of the HUD, and the Turn button — the Big Five spec. Owner-specced, not built.',
  '37-monetization.md': 'Ads and purchases: the two promises, the ship-first placements, and the never-sell table with reasons. Plan, nothing built.',
  '38-market-refresh.md': 'The lane as it stands now — fourteen competitors, the coded complaint pile, the positioning map, and the four numbers doc 17 quotes that do not hold.',
  '39-growth-and-launch.md': 'A dated launch calendar from September 2026 to June 2027, the Reddit playbook and the ASO correction. Plan, owner picking.',
  '40-financial-model.md': 'What any of this earns: three scenarios, the install volume each needs, the cost side, and the kill/scale signals.',
  '41-the-preserve.md': "What last year's harvest becomes at the Turn — craftable, but no longer a thing a customer will take. Owner-ruled, specced, not built.",
  '41-weather-staging.md': 'The Sky Pass — the Weather Ladder, the fronts, and the motion gate. Built 2026-08-31.',
  '42-overnight-housekeeping.md': 'What the overnight round of 2026-08-30 did, and the four things it filed rather than decided.',
  'README.md': 'The docs folder’s own index, mirrored exactly as written. This Home page is a reordering of it for the Unity team.',
};

/** The curated groups. Order is deliberate: the first three answer "what do I build?". */
const GROUP_1 = ['HANDOFF.md', '01-overview.md', '32-the-garden-year.md', '09-conventions.md'];
const GROUP_2 = [
  '03-systems.md',
  '04-economy.md',
  '07-save-data.md',
  '33-year-one-economy.md',
  '06-audio-and-fx.md',
  '05-art-direction.md',
];
const GROUP_3 = ['34-build-plan.md', '11-known-issues.md'];

/** Short titles for the narrow sidebar. */
const SHORT = {
  'HANDOFF.md': 'Handoff — start here',
  '01-overview.md': '01 · Overview',
  '32-the-garden-year.md': '32 · The Garden Year',
  '09-conventions.md': '09 · Conventions',
  '03-systems.md': '03 · Systems',
  '04-economy.md': '04 · Economy',
  '07-save-data.md': '07 · Save data',
  '33-year-one-economy.md': '33 · Year-one economy',
  '06-audio-and-fx.md': '06 · Audio and FX',
  '05-art-direction.md': '05 · Art direction',
  '34-build-plan.md': '34 · Build plan',
  '11-known-issues.md': '11 · Known issues',

  '02-architecture.md': '02 · Architecture',
  '08-ui-and-layout.md': '08 · UI and layout',
  '10-decision-log.md': '10 · Decision log',
  '12-meta-layer-design.md': '12 · Meta-layer design',
  '13-order-system.md': '13 · Order system',
  '14-economy-model.md': '14 · Economy model',
  '15-navigation-and-ia.md': '15 · Navigation and IA',
  '16-progression-and-quests.md': '16 · Progression',
  '17-market-and-positioning.md': '17 · Market research',
  '18-mutations-and-weather.md': '18 · Mutations, weather',
  '19-card-album.md': '19 · Card album',
  '20-card-art-prompts.md': '20 · Card art prompts',
  '21-potting-bench.md': '21 · Potting bench',
  '22-creatures.md': '22 · Creatures',
  '23-installable-pwa.md': '23 · Installable PWA',
  '24-remote-sessions.md': '24 · Remote sessions',
  '25-world-map.md': '25 · World map',
  '26-goods-catalog.md': '26 · Goods catalog',
  '27-design-audit.md': '27 · Design audit',
  '28-the-loop.md': '28 · The loop',
  '29-direction-and-odds.md': '29 · Direction and odds',
  '30-prestige-directions.md': '30 · Prestige options',
  '31-per-seed-prestige.md': '31 · Per-seed prestige',
  '35-morning-review.md': '35 · Morning review',
  '36-hud-and-dock.md': '36 · HUD and dock',
  '37-monetization.md': '37 · Monetization',
  '38-market-refresh.md': '38 · Market refresh',
  '39-growth-and-launch.md': '39 · Growth and launch',
  '40-financial-model.md': '40 · Financial model',
  '41-the-preserve.md': '41 · The Preserve',
  '41-weather-staging.md': '41 · Weather staging',
  '42-overnight-housekeeping.md': '42 · Housekeeping',
  'README.md': 'The docs index',
};

/** The spikes, in the order they are worth opening. */
const SPIKES = [
  ['turn-spike.html', 'Twenty-one annotated phone screens of the Turn — the meter, the ceremony beat by beat, the Almanac, and the unlock walls.'],
  ['fall-spike.html', 'Twelve phone frames of Fall: the sideways season swipe, the locked hedge gate, and the eight-crop bed paying its bonus when you clear it whole.'],
  ['dock-spike.html', 'Sixteen true-size phone mockups of the five-button dock — what each button opens, with rulers proving it fits.'],
  ['sky-spike.html', 'Rain, storm, aurora and Wonderfall play as whole sequences on a phone-sized garden, with sliders that tune every value live.'],
  ['map-spike.html', 'The phone-sized world map: swipe up to dive into the garden, down to pull back over locked land for sale.'],
  ['merge-spike.html', 'Drag flowers onto the bench — three alike merge up a six-tier chain, cascading one rung at a time.'],
  ['hollow-spike.html', 'The underground Hollow at true phone size: sun and moon light, six creature nooks, and how much screen the dock eats.'],
  ['customer-spike.html', 'Six villager faces built from data rows, flipped between neutral, waiting and delivered, and silhouette-tested.'],
  ['hollow-spike-v1.html', 'The first pass at the Hollow, kept for comparison — superseded by hollow-spike above.'],
];

function link(file, extraAnchor) {
  const page = file.replace(/\.md$/, '');
  return `[${page}](${page}${extraAnchor || ''})`;
}

function buildHome(allDocs) {
  const curated = new Set([...GROUP_1, ...GROUP_2, ...GROUP_3]);
  const rest = allDocs.filter((d) => !curated.has(d)).sort();

  const bullet = (f, anchor) => `- **${link(f, anchor)}** — ${DESC[f] || '_(no description yet — add one to `DESC` in `tools/wiki-sync.js`)_'}`;

  const out = [];
  out.push('# Garden Wonder — design documentation');
  out.push('');
  out.push('The design docs for **Garden Wonder**, a cozy mobile idle game, mirrored here so you can');
  out.push('read them in a browser without cloning anything.');
  out.push('');
  out.push('> **This wiki is generated.** `docs/` in the [main repository](' + TREE + '/docs) is the source of');
  out.push('> truth. Every page here is overwritten wholesale each time the sync runs, so an edit made on the');
  out.push('> wiki will disappear. Found something wrong? Change it in `docs/` and the fix arrives here on the');
  out.push('> next run.');
  out.push('');
  out.push('**New here?** Read [01-overview](01-overview) for what the game is, then the plain-English');
  out.push('glossary at the top of [32-the-garden-year](32-the-garden-year#the-plain-english-glossary--read-this-first).');
  out.push('Between them they explain every word the rest of these documents use.');
  out.push('');
  out.push('---');
  out.push('');

  out.push('## 1. Start here');
  out.push('');
  out.push(bullet('HANDOFF.md'));
  out.push(`  Jump straight to [Traps in this codebase](HANDOFF#traps-in-this-codebase).`);
  out.push(bullet('01-overview.md'));
  out.push(bullet('32-the-garden-year.md'));
  out.push(`  Jump straight to [the glossary](32-the-garden-year#the-plain-english-glossary--read-this-first).`);
  out.push(bullet('09-conventions.md'));
  out.push('');

  out.push('## 2. What the Unity build needs');
  out.push('');
  out.push('The documents that describe behaviour and numbers rather than the web implementation.');
  out.push('');
  out.push(bullet('03-systems.md'));
  out.push(bullet('04-economy.md'));
  out.push(bullet('07-save-data.md'));
  out.push(bullet('33-year-one-economy.md'));
  out.push('- **[12-meta-layer-design → What the Unity engineer needs](12-meta-layer-design#what-the-unity-engineer-needs)** — the section written for you specifically: what the port has to carry across, and what it does not.');
  out.push(bullet('06-audio-and-fx.md'));
  out.push(bullet('05-art-direction.md'));
  out.push('');

  out.push('## 3. The build plan and open work');
  out.push('');
  out.push(bullet('34-build-plan.md'));
  out.push(bullet('11-known-issues.md'));
  out.push('');

  out.push('## 4. Design history and research');
  out.push('');
  out.push('Everything else, newest thinking generally at the higher numbers. Much of this is analysis or');
  out.push('proposal rather than a description of the built game — each line says which.');
  out.push('');
  for (const f of rest) out.push(bullet(f));
  out.push('');

  out.push('## 5. Playable references');
  out.push('');
  out.push('These are live pages — open them on a phone if you can, the game is designed for one.');
  out.push('');
  out.push(`- **[The game itself](${PAGES}/)** — the current build, playable now.`);
  out.push(`- **[The Garden Year pitch](${PAGES}/docs/garden-year-pitch.html)** — the deck that sold the Year. A standalone page; it cannot render on a wiki, so this links the live copy.`);
  out.push('');
  out.push('The spikes are standalone prototypes, each built to answer one question before the code was written:');
  out.push('');
  for (const [file, desc] of SPIKES) {
    out.push(`- **[${file.replace(/\.html$/, '')}](${PAGES}/tools/${file})** — ${desc}`);
  }
  out.push('');
  out.push('---');
  out.push('');
  out.push(
    `_${allDocs.length} documents mirrored. \`docs/legacy/\` is deliberately excluded: it holds the design ` +
      `documents for Idle Garden Reborn, the build that preceded this one, and it does not describe the ` +
      `game as it is now. It stays in the repo at [docs/legacy/](${TREE}/docs/legacy)._`
  );
  out.push('');

  return out.join('\n');
}

function buildSidebar(allDocs) {
  const curated = new Set([...GROUP_1, ...GROUP_2, ...GROUP_3]);
  const rest = allDocs.filter((d) => !curated.has(d)).sort();
  const short = (f) => SHORT[f] || f.replace(/\.md$/, '').replace(/^(\d+)-/, '$1 · ').replace(/-/g, ' ');

  const out = [];
  out.push('### [Home](Home)');
  out.push('');
  out.push('**Start here**');
  for (const f of GROUP_1) out.push(`- [${short(f)}](${f.replace(/\.md$/, '')})`);
  out.push('');
  out.push('**The Unity build**');
  for (const f of GROUP_2) out.push(`- [${short(f)}](${f.replace(/\.md$/, '')})`);
  out.push('- [12 · Unity notes](12-meta-layer-design#what-the-unity-engineer-needs)');
  out.push('');
  out.push('**Build plan and open work**');
  for (const f of GROUP_3) out.push(`- [${short(f)}](${f.replace(/\.md$/, '')})`);
  out.push('');
  out.push('**Design history and research**');
  for (const f of rest) out.push(`- [${short(f)}](${f.replace(/\.md$/, '')})`);
  out.push('');
  out.push('**Playable**');
  out.push(`- [The game](${PAGES}/)`);
  out.push(`- [The pitch](${PAGES}/docs/garden-year-pitch.html)`);
  for (const [file] of SPIKES) {
    out.push(`- [${file.replace(/\.html$/, '')}](${PAGES}/tools/${file})`);
  }
  out.push('');
  return out.join('\n');
}

// ---------------------------------------------------------------- the sync itself

function ensureClone() {
  if (fs.existsSync(path.join(WIKI_DIR, '.git'))) {
    say(`  wiki clone: ${WIKI_DIR}`);
    git(WIKI_DIR, 'remote', 'set-url', 'origin', WIKI_URL);
    git(WIKI_DIR, 'fetch', 'origin');
    const branch = git(WIKI_DIR, 'rev-parse', '--abbrev-ref', 'HEAD');
    git(WIKI_DIR, 'reset', '--hard', `origin/${branch}`);
    return branch;
  }
  say(`  cloning the wiki into ${WIKI_DIR}`);
  try {
    execFileSync('git', ['clone', WIKI_URL, WIKI_DIR], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error('\nCould not clone the wiki repository.\n');
    console.error('A GitHub wiki does not exist as a git repo until someone creates its first page.');
    console.error('Open https://github.com/Deep-Forest-Labs/GardenofWonder/wiki, click "Create the first');
    console.error('page", save the default Home as-is, then run this again. The sync overwrites that Home.\n');
    process.exit(1);
  }
  return git(WIKI_DIR, 'rev-parse', '--abbrev-ref', 'HEAD');
}

function main() {
  say(`\nwiki-sync — mirroring docs/ to the GardenofWonder wiki${DRY_RUN ? '  (dry run)' : ''}\n`);

  const allFiles = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const empty = allFiles.filter((f) => fs.statSync(path.join(DOCS_DIR, f)).size === 0);
  const docs = allFiles.filter((f) => !empty.includes(f));
  for (const f of empty) warn(`skipped (file is empty): ${f}`);

  // A document with no description would ship as an unlabelled line on Home. Fail instead.
  const undescribed = docs.filter((f) => !DESC[f]);
  if (undescribed.length) {
    console.error(`\nThese documents have no description in tools/wiki-sync.js:\n`);
    for (const f of undescribed) console.error(`  ${f}`);
    console.error(`\nAdd a line for each to DESC, then run again.\n`);
    process.exit(1);
  }

  const branch = DRY_RUN && !fs.existsSync(path.join(WIKI_DIR, '.git')) ? null : ensureClone();

  if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR, { recursive: true });

  // Wholesale overwrite: drop every existing page so a renamed doc leaves no ghost behind.
  for (const f of fs.readdirSync(WIKI_DIR)) {
    if (f === '.git') continue;
    fs.rmSync(path.join(WIKI_DIR, f), { recursive: true, force: true });
  }

  const ctx = { internal: [], unhandled: [], external: 0, file: null };
  const anchors = {};

  for (const f of docs) {
    ctx.file = f;
    const src = fs.readFileSync(path.join(DOCS_DIR, f), 'utf8');
    fs.writeFileSync(path.join(WIKI_DIR, f), rewriteLinks(src, ctx));

    // Collect the anchors this page offers, for the link check below.
    const set = new Set();
    let fence = false;
    for (const line of src.split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; }
      if (fence) continue;
      const m = /^#{1,6}\s+(.*)$/.exec(line);
      if (!m) continue;
      let s = slug(m[1]);
      const base = s;
      let n = 1;
      while (set.has(s)) s = `${base}-${n++}`;
      set.add(s);
    }
    anchors[f.replace(/\.md$/, '')] = set;
  }

  const home = buildHome(docs);
  const sidebar = buildSidebar(docs);
  fs.writeFileSync(path.join(WIKI_DIR, 'Home.md'), home);
  fs.writeFileSync(path.join(WIKI_DIR, '_Sidebar.md'), sidebar);
  fs.writeFileSync(path.join(WIKI_DIR, '_Footer.md'), FOOTER + '\n');
  anchors['Home'] = new Set();

  say(`  ${docs.length} documents copied, plus Home, _Sidebar and _Footer`);
  say(`  ${ctx.internal.length} internal links rewritten, ${ctx.external} pointed back at the repo`);

  // ---- link check: every internal target must resolve to a page that exists ----
  const pages = new Set(
    fs.readdirSync(WIKI_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
  );

  // Re-scan the generated pages, so we check what actually shipped rather than what we intended.
  const dead = [];
  const badAnchors = [];
  let checked = 0;
  for (const f of fs.readdirSync(WIKI_DIR).filter((x) => x.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(WIKI_DIR, f), 'utf8');
    let fence = false;
    text.split('\n').forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
      if (fence) return;
      line.split(/(`+[^`]*`+)/g).forEach((part, k) => {
        if (k % 2) return;
        const re = /\]\(([^)\s]+)\)/g;
        let m;
        while ((m = re.exec(part))) {
          const t = m[1];
          if (/^(https?:|mailto:)/.test(t)) continue;
          checked++;
          const hashAt = t.indexOf('#');
          const page = hashAt === -1 ? t : t.slice(0, hashAt);
          const anchor = hashAt === -1 ? '' : t.slice(hashAt + 1);
          const target = page === '' ? f.replace(/\.md$/, '') : page;
          if (!pages.has(target)) dead.push(`${f}:${i + 1}  ->  ${t}`);
          else if (anchor && anchors[target] && anchors[target].size && !anchors[target].has(anchor)) {
            badAnchors.push(`${f}:${i + 1}  ->  ${t}`);
          }
        }
      });
    });
  }

  say(`\n  link check: ${checked} internal links checked`);
  if (dead.length) {
    warn(`${dead.length} point at a page that does not exist:`);
    dead.slice(0, 20).forEach((d) => say(`      ${d}`));
  } else {
    say('  every internal link resolves to a page in this wiki');
  }
  if (badAnchors.length) {
    warn(`${badAnchors.length} anchor(s) do not match a heading (pre-existing in docs/, left as written):`);
    [...new Set(badAnchors)].slice(0, 10).forEach((d) => say(`      ${d}`));
  }
  if (ctx.unhandled.length) {
    warn(`${ctx.unhandled.length} link target(s) matched no rule and were left alone:`);
    [...new Set(ctx.unhandled.map((u) => u.target))].slice(0, 10).forEach((d) => say(`      ${d}`));
  }

  if (dead.length) {
    console.error('\nDead internal links — not pushing. Fix the rewrite rules and run again.\n');
    process.exit(1);
  }

  if (DRY_RUN) {
    say(`\n  dry run: nothing committed. Generated pages are in ${WIKI_DIR}\n`);
    return;
  }

  // ---- commit and push ----
  git(WIKI_DIR, 'add', '-A');
  const dirty = git(WIKI_DIR, 'status', '--porcelain');
  if (!dirty) {
    say('\n  wiki already matches docs/ — nothing to push\n');
    return;
  }
  git(WIKI_DIR, 'commit', '-m', `Mirror docs/ to the wiki — ${today()}`);
  if (NO_PUSH) {
    say('\n  committed; --no-push, so nothing was sent\n');
    return;
  }
  git(WIKI_DIR, 'push', 'origin', branch);
  say(`\n  pushed to ${branch}. https://github.com/Deep-Forest-Labs/GardenofWonder/wiki\n`);
}

main();
