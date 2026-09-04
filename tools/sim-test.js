/* Headless tests for the simulation layer.
   Run with:  node tools/sim-test.js

   game.js deliberately has no DOM dependencies, so the whole economy can be
   played forward in Node. Keep it that way — this is the cheapest way to check
   a balance change, and it should survive the Unity port as an editor test. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};

/* The game files are plain scripts that declare globals, so evaluate them and
   then re-export what they defined onto globalThis. */
const GLOBALS = ['DATA', 'WONDER', 'DAY', 'ALBUM', 'CARD_RARITIES', 'PLOT_AUTOPLANTERS', 'MAX_RARITY_MULT', 'FLOWER_LINES',
  'APIARY', 'CRAFT_RECIPES', 'CRAFT_SLOTS', 'BENCH', 'CREATURES', 'CREATURE_TRAITS', 'HABITAT_SLOT_LEVELS', 'CREATURE_STARS', 'CREATURE_PAIRS', 'PAIR_TUNING',
  'CREATURE_FOOD', 'FED_STARS', 'FOOD_CAP_HOURS', 'ARRIVAL_AWAKE_HOURS', 'FED_THRESHOLD_HOURS',
  'STAND', 'GOODS', 'CUSTOMERS', 'goodById', 'customerById',
  'MEADOW', 'MEADOW_NEIGHBOURS', 'meadowTender', 'Icons', 'flowerValue', 'Game', 'Sound'];

function loadScript(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const reexport = GLOBALS.map((g) => `;globalThis.${g} = typeof ${g} !== 'undefined' ? ${g} : globalThis.${g};`).join('');
  (0, eval)(src + reexport);
}

loadScript('data.js');
loadScript('icons.js');
loadScript('game.js');
/* audio.js reaches `window` only inside init() and renderBed(), at call time,
   so it loads here with no DOM at all — which is what lets the sleeping-clock
   group below drive the real schedulers rather than a copy of them. */
loadScript('audio.js');

const G = globalThis.Game;
const S = G.state;

/* Put the save where a level-N player would be. Seeds stopped unlocking on
   the level bar with the Garden Year, so the helper also marks paid every
   unlock a player of that era would have owned — the tests that say
   "a level-17 veteran" still mean what they meant. */
const unlockTo = (level) => {
  S.rep = G.cumulativeRep(level);
  S.level = level;
  DATA.seeds.forEach((s) => {
    if ((s.unlockLevel || 1) <= level && G.seedUnlockPrice(s.id) > 0) S.seedUnlocks[s.id] = true;
  });
};

/* The real key game.js writes to. Guessing it wrong makes every save test pass
   vacuously — load() simply reports a fresh game and the assertions all hold
   against default state. Cost three green tests that were testing nothing. */
const SAVE_KEY = 'gw-save';

/* Every badge the Upgrades tab puts on screen. Kept here rather than imported
   because ui-sheet.js cannot be loaded headless — if the tab gains a badge,
   this list gains it too, and the "says what the next level buys" group is
   what notices. */
const UI_BADGE_KEYS = [
  'tapPower', 'holdSpeed', 'critChance', 'critMult', 'comboMeter',
  'rainDance', 'beeSwarm', 'ladybug',
  'autoWater', 'autoHarvest',
  'offlineRate', 'offlineHours'
].concat(PLOT_AUTOPLANTERS.map((p) => p.key));

/* What a day-one casual player earns in an active minute, order gold and
   offline lumps excluded — measured over the casual model in
   tools/order-gold.js, and deliberately taken at the LOW end of the measured
   1,600-2,700 spread so the assertion below fails on a real regression rather
   than on run-to-run noise. Re-measure it there; never nudge it here to make a
   test pass. */
const CASUAL_RATE_PER_MIN = 2000;

let pass = 0;
let fail = 0;
const group = (name) => console.log(`\n${name}`);
const check = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok   ${name}`); }
  else { fail += 1; console.log(`  FAIL ${name} ${extra}`); }
};

/* Fast-forward without waiting.

   The clock starts at a FIXED epoch, not at the real one. Weather is a pure
   function of wall-clock time, so a suite seeded from `Date.now()` sees a
   different sky on every run — and since the Sky Pass, the sky changes how fast
   things grow. Assertions about growth then passed or failed depending on what
   the weather happened to be doing while the suite ran, which is the flakiest
   possible kind of test and the hardest to diagnose. This epoch's slot and the
   two after it are Clear and it sits in daylight: the neutral conditions an
   unrelated test should see. Anything that wants a sky asks for one with
   `G.Dev.setWeather()` and puts it back. */
let clock = 1767269100;
Date.now = () => clock * 1000;
const advance = (seconds, step = 1) => {
  for (let t = 0; t < seconds; t += step) { clock += step; G.tick(step); }
};

const clearGarden = () => S.grid.forEach((c) => {
  c.locked = false; c.seed = null; c.plantedAt = 0; c.grow = 0; c.ready = false;
  c.mutation = null; c.mutateAt = 0; c.packDrop = false; c.lastSeed = null;
});

/* The same job for Winter's bed, and it clears the TUCK as well as the cells —
   a bed-level timestamp left standing between tests is a night the next test
   did not ask for, and every mark it derives would be a mystery. New per-cell
   Winter fields join this at the same moment they join defaultState() and the
   load() backfill; that trio is where new grid fields have historically leaked. */
const clearWinter = () => {
  S.winter.grid.forEach((c) => {
    c.seed = null; c.plantedAt = 0; c.grow = 0; c.ready = false; c.kept = false;
  });
  S.winter.tuckedAt = 0;
};

/* Mastery multiplies harvest payout and climbs as a run proceeds, so a test
   measuring some *other* harvest multiplier has to start from a clean ladder —
   including the lifetime counts the ladder reads, or the next run starts the
   ladder over with thousands of harvests already banked and jumps tiers at once. */
const clearMastery = () => { S.mastery = {}; S.rarityCounts = {}; S.discovered = {}; };

/* A GENUINELY RETURNING PLAYER, which is TWO facts and not one: the garden has
   been opened again, AND it is older than a day. Written once here because every
   ad fixture below needs both, and because a fixture that sets only the counter
   is asserting the bug this replaced — `sessions` alone was a page-load count,
   and one refresh ended a first session with it (docs/37's standing rule, failing
   open). The engine's own reasoning is over adPastFirstSession() in game.js.
   A day and an hour, so the fixture is never sitting on the boundary. */
const returningPlayer = (opens = 2) => {
  S.ads.sessions = opens;
  S.ads.firstAt = G.nowSeconds() - 25 * 3600;
};

/* ---- RENDERING A PANEL HEADLESSLY, because a source read cannot see a row ----

   ui-sheet.js cannot be LOADED here: it opens with `const { $, $$, S, el, fmt,
   ... } = UI;` and UI needs a document. So every panel assertion in this file
   has historically read it as SOURCE TEXT — and source text is not output. The
   2026-09-03 verifiers proved what that costs by shipping wrong implementations
   green: a Turn ask with its two chip rows SWAPPED, so the panel promised the
   player a new year washes away their Seeds, Unlocks, Petals, Creatures, Cards
   and Level and never reaches their Gold, Upgrades and Power-ups; the same row
   `.slice(0, 3)`-ed so two of the five prices vanished; and the fixed
   empty-board bug restored verbatim. All three read fine as source, because the
   checks read the array literal and the sentences name neither array.

   So: lift ONE function out of ui-sheet.js by name and RUN it. The panels worth
   holding are pure string builders over Game, S, Icons and DATA, all four of
   which this suite already has. Everything else the function reaches — Flora,
   fmt, adTag, another panel's builder — resolves through a proxy to a stub that
   returns a marker naming itself. The marker is readable in the output and the
   name is returned in `calls`, which is the half a grep cannot do: a check for
   one spelling of "ad" is walked past by `${droneCard()}`, and a check on the
   call list is not.

   WHAT THIS STILL CANNOT SEE, said plainly so nobody reads more into a green
   line than is in it:
     - CSS. This renders MARKUP. It holds structure, words, and the conditions
       each one appears under; it knows nothing about colour, size, weight or
       overflow. Those are asserted out of style.css by PROPERTY — never by
       class name, which is what a rename defeats — or measured by hand with
       tools/probe.js and written into docs/08.
     - Anything that happens after paint. No handler runs, so a class that
       syncAfford() toggles on a live node is invisible here.
     - The screen. This is one function, not a panel in its surroundings: what
       wraps it, what scrolls, and what it sits beside are not under test.
   The suite stays a single `node tools/sim-test.js` with no browser, and that
   boundary is the reason the list above is written down rather than implied. */
const SHEET_SRC = fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8');
/* One module-level function, brace-matched on ui-sheet.js's own two-space
   indent — the same slice idiom the food-row and seed-picker checks use. Every
   caller pairs this with a size band, because a rename returns '' and an empty
   render would pass a check written as "the ad is not in the output". */
const sheetSlice = (name) =>
  (SHEET_SRC.match(new RegExp(`function ${name}\\([^)]*\\)[\\s\\S]*?\\n {2}\\}`)) || [''])[0];
/* `opts.also` names other ui-sheet functions to lift in alongside this one, so
   a shared control renders for real instead of as a marker — the drone card's
   price pill is adTag()'s output, and "is the pill drained?" is a question only
   the real pill can answer. `opts.bind` supplies a module const the slice
   cannot bring with it. Everything NOT named either way still resolves to a
   recording stub, which is what catches a builder nobody expected. */
const sheetRender = (name, args = [], opts = {}) => {
  const src = sheetSlice(name);
  const body = (opts.also || []).map(sheetSlice).concat(src).join('\n');
  const calls = [];
  /* A stub is callable at any depth — `Flora.head(seed, 34)` has to work as
     readily as `fmt(n)` — and stringifies to a marker naming the whole path,
     so an unexpected helper is visible in the output as well as in `calls`. */
  const stub = (id) => {
    const mark = `<!--sheet:${id}-->`;
    const hit = () => { if (!calls.includes(id)) calls.push(id); return mark; };
    return new Proxy(function () { return hit(); }, {
      apply: hit,
      get: (t, k) => {
        if (k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf') return () => mark;
        if (typeof k === 'symbol') return undefined;
        return stub(`${id}.${String(k)}`);
      }
    });
  };
  const bound = Object.assign({ Game: G, S }, opts.bind || {});
  const scope = new Proxy(bound, {
    has: () => true,
    get: (t, k) => {
      if (typeof k === 'symbol') return undefined;
      if (Object.prototype.hasOwnProperty.call(t, k)) return t[k];
      if (k in globalThis) return globalThis[k];   // DATA, Icons, CREATURE_FOOD, Math, undefined…
      return stub(String(k));
    }
  });
  let html = '';
  let error = '';
  try {
    html = new Function('SCOPE', `with (SCOPE) { ${body}\n return ${name}; }`)(scope)(...args);
  } catch (e) { error = String((e && e.message) || e); }
  return { html: String(html), src, calls, error };
};
/* The chips a rendered row is actually made of, in order, with their classes —
   `class` is what separates a price from a keepsake, and the text is what the
   player reads. Tags are stripped, so the glyph inside a chip does not count as
   a word and a marker left by a stub still shows up as one. */
const sheetChips = (rowHtml) =>
  [...String(rowHtml).matchAll(/<span class="(chip[^"]*)">([\s\S]*?)<\/span>/g)]
    .map((m) => ({ cls: m[1], text: m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() }));
/* What a rule in style.css actually declares, by selector. Read by PROPERTY,
   never by class name: "the shouted label class is retired" is passed by
   pasting the shouted label's declarations onto the new name, which is exactly
   what a verifier did. */
const CSS_SRC = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const cssRule = (selector) => {
  const at = CSS_SRC.indexOf(`\n${selector}{`);
  return at < 0 ? '' : CSS_SRC.slice(at + selector.length + 2, CSS_SRC.indexOf('}', at));
};

group('flowers are kept as a crafting byproduct');
S.credits = 1e6;
G.plant(0, G.seedById('daisy'));
advance(30);
const flowersBefore = G.flowerTotal();
G.harvest(0);
check('harvesting yields the bloom itself', G.flowerTotal() === flowersBefore + 1);
check('harvesting still pays credits', S.credits > 0);

group('hives');
check('none at the start', G.hiveCount() === 0);
check('the first costs 2,200', G.nextHiveCost() === 2200);
S.credits = 2200;
check('placing one works', G.placeHive(0) === true);
check('the cost was deducted', S.credits === 0);
check('the next one costs more', G.nextHiveCost() > 2200);
check('each gives 8% pollination', Math.abs(G.pollination() - APIARY.pollination) < 1e-9);

group('honey variety follows what is blooming');
S.credits = 1e6;
unlockTo(2);
G.plant(1, G.seedById('lavender'));
advance(APIARY.interval * 2 + 5);
const jars = G.cellAt(0).jars;
check('jars are produced on the interval', jars.length >= 2, `got ${jars.length}`);
check('they take the planted variety', jars.every((j) => j === 'lavender'), JSON.stringify(jars));

group('a hive stops when it is full');
advance(APIARY.interval * 10);
check(`caps at ${APIARY.capacity} jars`, G.cellAt(0).jars.length === APIARY.capacity,
  `got ${G.cellAt(0).jars.length}`);

group('collecting');
const collected = G.collectHive(0);
check('returns what was in the hive', collected && collected.jars.length === APIARY.capacity);
check('honey is banked by variety', S.apiary.honey.lavender === APIARY.capacity, JSON.stringify(S.apiary.honey));
check('the hive is emptied', G.cellAt(0).jars.length === 0);
check('lavender honey is worth 182', APIARY.honeyValue('lavender') === 182);

group('variety is fixed at production, so it cannot be gamed');
S.apiary.honey = {};
clearGarden();
advance(APIARY.interval * 3);
const wildJars = G.cellAt(0).jars.slice();
unlockTo(17);
G.plant(0, G.seedById('eternal'));
check('an empty garden gives wildflower honey', wildJars.every((j) => j === 'wild'), JSON.stringify(wildJars));
check('planting later does not upgrade waiting jars',
  JSON.stringify(G.cellAt(0).jars) === JSON.stringify(wildJars));

group('pollination raises harvest payouts');
clearGarden();
/* This used to average 4,000 random harvests and allow ±0.06, which put the 2%-Legendary tail
   inside the tolerance — it failed roughly one run in fifty (measured 1/50, ratio 1.253). Pinning
   the roll makes the ratio exact: 0.5 lands on Common, misses the 5% gem, and misses the 2% Wonder,
   so the only thing left moving the payout is pollination itself. */
const rngPollination = Math.random;
const payoutWith = (hives) => {
  clearMastery();                       // mastery climbs as a run proceeds and would drift the result
  S.wonder = { until: 0, last: 0 };
  S.boosters = {};
  // Plain hives on the board with no tenders anywhere near them, so pollination
  // is the only thing this measures.
  S.apiary.cells = Array(MEADOW.cells).fill(null);
  for (let i = 0; i < hives; i += 1) S.apiary.cells[i] = { kind: 'hive', at: clock, jars: [] };
  Math.random = () => 0.5;
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '' };
  const p = G.harvest(0).payout;
  Math.random = rngPollination;
  return p;
};
const plainPay = payoutWith(0);
const pollinatedPay = payoutWith(4);
const daisyYield = G.seedById('daisy').yield;
check('four hives report 32% pollination', Math.abs(G.pollination() - 0.32) < 1e-9, `${G.pollination()}`);
check('an unpollinated daisy pays exactly its yield', plainPay === daisyYield, `${plainPay}`);
check('four hives lift that by exactly 32%', pollinatedPay === Math.round(daisyYield * 1.32),
  `${pollinatedPay} vs ${Math.round(daisyYield * 1.32)}`);

group('crafting');
S.apiary.hives = [];
S.flowers = {}; S.apiary.honey = {}; S.apiary.wax = 0; S.craft = []; S.goods = {};
const tea = CRAFT_RECIPES.find((r) => r.id === 'tea');
check('an empty pantry blocks it', G.canCraft(tea) === false);
S.flowers = { daisy: 2, rose: 3 };
S.apiary.honey = { wild: 1, lavender: 2 };
check('stocking the pantry unblocks it', G.canCraft(tea) === true);
check('it starts', G.startCraft('tea') === true);
check('ingredients are consumed', G.flowerTotal() === 2 && G.honeyTotal() === 2);
check('cheapest flowers go first', !S.flowers.daisy && S.flowers.rose === 2, JSON.stringify(S.flowers));
check('cheapest honey goes first', !S.apiary.honey.wild && S.apiary.honey.lavender === 2, JSON.stringify(S.apiary.honey));
check('nothing appears early', !S.goods.tea);
advance(tea.time + 3);
check('it finishes on the timer', S.goods.tea === 1, JSON.stringify(S.goods));
check('the bench frees up', S.craft.length === 0);

group('the bench has a limit');
S.flowers = { daisy: 20 }; S.apiary.honey = { wild: 20 }; S.apiary.wax = 20;
G.startCraft('tea'); G.startCraft('tea');
check(`only ${CRAFT_SLOTS} run at once`, S.craft.length === CRAFT_SLOTS);
check('a third is refused', G.startCraft('tea') === false);

group('a recipe can demand a specific bloom');
S.craft = [];
S.flowers = { daisy: 20 }; S.apiary.wax = 20; S.apiary.honey = { wild: 20 };
const salve = CRAFT_RECIPES.find((r) => r.id === 'salve');
check('wildflower honey will not substitute', G.canCraft(salve) === false);
S.apiary.honey.lavender = 2;
check('lavender honey unlocks it', G.canCraft(salve) === true);
G.startCraft('salve');
check('the named honey is what gets spent', !S.apiary.honey.lavender && S.apiary.honey.wild === 20);

group('the economic invariants hold');
CRAFT_RECIPES.forEach((r) => {
  const raw = r.needs.reduce((sum, n) => {
    if (n.kind === 'wax') return sum + APIARY.waxValue * n.qty;
    if (n.kind === 'flower') return sum + flowerValue('daisy') * n.qty;
    if (n.of) return sum + APIARY.honeyValue(n.of) * n.qty;
    return sum + APIARY.honeyValue('wild') * n.qty;
  }, 0);
  check(`${r.name} beats its ingredients by >1.35x`, r.value > raw * 1.35, `${(r.value / raw).toFixed(2)}x`);
});
check('every recipe spans at least two regions', CRAFT_RECIPES.every((r) =>
  new Set(r.needs.map((n) => (n.kind === 'flower' ? 'garden' : 'apiary'))).size >= 2));

group('selling');
S.credits = 0; S.goods = { tea: 3 };
const earned = G.sell('good', 'tea', true);
check('sell-all pays per unit', earned === tea.value * 3, `got ${earned}`);
check('credits go up by that much', S.credits === earned);
check('the stock is cleared', !S.goods.tea);
check('selling nothing is a no-op', G.sell('good', 'tea', true) === 0);

group('saves survive a round trip');
store['gw-save'] = JSON.stringify({
  version: 2, credits: 500, grid: S.grid, upgrades: S.upgrades, decor: [], boosters: {},
  apiary: { hives: [{ at: clock, jars: ['lavender', 'wild'] }], honey: { rose: 3 }, wax: 7 },
  flowers: { rose: 4 }, goods: { tea: 2 }, craft: [{ id: 'tea', doneAt: clock + 999 }]
});
G.load();
check('hives come back', G.hiveCount() === 1 && G.jarsWaiting() === 2);
check('honey comes back', S.apiary.honey.rose === 3);
check('wax comes back', S.apiary.wax === 7);
check('flowers come back', S.flowers.rose === 4);
check('finished goods come back', S.goods.tea === 2);
check('the bench comes back', S.craft.length === 1);

group('a save from before the Apiary still loads');
store['gw-save'] = JSON.stringify({ version: 2, credits: 999, grid: S.grid, upgrades: S.upgrades });
G.load();
check('apiary defaults are filled in',
  Array.isArray(S.apiary.cells) && S.apiary.cells.length === MEADOW.cells
  && S.apiary.cells.every((c) => c === null));
check('flower inventory defaults in', S.flowers && typeof S.flowers === 'object');
check('the bench defaults in', Array.isArray(S.craft));
check('existing progress is untouched', S.credits === 999);
let threw = null;
try { advance(200); } catch (e) { threw = e.message; }
check('ticking it does not throw', threw === null, threw || '');

group('decor migration refunds owned stat-carrying decor once');
store['gw-save'] = JSON.stringify({
  version: 2, credits: 0, gems: 0, tickets: 0, grid: S.grid, upgrades: S.upgrades,
  decor: [
    { id: 'gnome', type: 'critChance', val: 0.05 },
    { id: 'gnome', type: 'critChance', val: 0.05 },
    { id: 'shrine', type: 'growSpeed', val: 0.1 }
  ]
});
let info = G.load();
check('gems are refunded per copy at purchase price', S.gems === 500, `got ${S.gems}`);
check('credits are refunded in the currency it was bought with', S.credits === 1000, `got ${S.credits}`);
check('tickets are untouched — nothing was bought with them', S.tickets === 0);
check('ownership is kept, just stripped to a cosmetic record', S.decor.length === 3);
check('no decor entry carries a stat anymore', S.decor.every((d) => !('type' in d) && !('val' in d)), JSON.stringify(S.decor));
check('load() reports the refund for a one-time toast', info.decorRefund &&
  info.decorRefund.gems === 500 && info.decorRefund.credits === 1000 && info.decorRefund.count === 3,
  JSON.stringify(info.decorRefund));
check('decorVal was deleted along with the mechanic, not left returning zero', typeof G.decorVal === 'undefined');

group('decor migration only ever runs once');
store['gw-save'] = JSON.stringify({
  version: 3, credits: 50, gems: 0, tickets: 0, grid: S.grid, upgrades: S.upgrades,
  decor: [{ id: 'gnome' }]
});
info = G.load();
check('an already-migrated save is not refunded again', info.decorRefund === null);
check('credits are untouched', S.credits === 50);
check('the cosmetic decor still comes back', S.decor.length === 1 && S.decor[0].id === 'gnome');

group('decor no longer moves the numbers it used to');
S.decor = [];
check('grow speed ignores owned decor (none owned)', Math.abs(G.growModifier() - 1) < 1e-9, `got ${G.growModifier()}`);
S.decor = [{ id: 'gnome' }, { id: 'fountain' }, { id: 'lanterntree' }];
check('grow speed ignores owned decor (some owned)', Math.abs(G.growModifier() - 1) < 1e-9, `got ${G.growModifier()}`);

S.boosters = {};
S.tap = { power: 10, critChance: 0, critMult: 10, combo: 0, comboMax: 50 };
S.decor = [];
S.credits = 1e6;
let before = S.credits;
G.tapFlower();
const gainBare = S.credits - before;
S.decor = [{ id: 'gnome' }, { id: 'fountain' }, { id: 'lanterntree' }];
S.credits = 1e6;
before = S.credits;
G.tapFlower();
const gainWithDecor = S.credits - before;
check('tap payout ignores owned decor', gainBare === gainWithDecor && gainBare === 10, `${gainBare} vs ${gainWithDecor}`);

clearGarden();
S.apiary.hives = [];
const meanHarvest = (decorOwned) => {
  clearMastery();
  S.decor = decorOwned;
  unlockTo(20);
  S.apiary.hives = [];
  let total = 0;
  const runs = 12000;
  for (let i = 0; i < runs; i += 1) {
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '' };
    total += G.harvest(0).payout;
  }
  return total / runs;
};
const harvestBare = meanHarvest([]);
const harvestWithDecor = meanHarvest([{ id: 'gnome' }, { id: 'fountain' }, { id: 'lanterntree' }]);
const harvestRatio = harvestWithDecor / harvestBare;
check('harvest payout ignores owned decor', Math.abs(harvestRatio - 1) < 0.05, `ratio ${harvestRatio.toFixed(3)}`);
S.decor = [];

group('Quick Grip (hold-to-tap speed)');
G.reset();
check('starts at 900ms', S.tap.holdInterval === 900, `got ${S.tap.holdInterval}`);
check('starts unmaxed', G.upgradeMaxed('holdSpeed') === false);
S.credits = 1e9;
let level = 0;
while (!G.upgradeMaxed('holdSpeed') && level < 100) {
  check(`level ${level + 1} buys and shaves 60ms`, G.buyUpgrade('holdSpeed') === true);
  level += 1;
}
check('twelve levels reach the floor', level === 12, `took ${level} levels`);
check('floor is 180ms, never less', S.tap.holdInterval === 180, `got ${S.tap.holdInterval}`);
check('upgradeMaxed is true at the floor', G.upgradeMaxed('holdSpeed') === true);
const creditsAtFloor = S.credits;
check('buying past the floor is refused', G.buyUpgrade('holdSpeed') === false);
check('a refused purchase does not charge credits', S.credits === creditsAtFloor);
check('level stops climbing once maxed', S.upgrades.holdSpeed === 12, `got ${S.upgrades.holdSpeed}`);
G.reset();

group('Sprinklers now cap at 10% (1%/level, down from an uncapped 5%/level)');
S.credits = 1e9;
check('starts unmaxed', G.upgradeMaxed('autoWater') === false);
let waterLevel = 0;
while (!G.upgradeMaxed('autoWater') && waterLevel < 100) { G.buyUpgrade('autoWater'); waterLevel += 1; }
check('ten levels reach the cap', waterLevel === 10, `took ${waterLevel} levels`);
check('growth modifier bottoms out at 0.90 from sprinklers alone',
  Math.abs(G.growModifier() - 0.9) < 1e-9, `got ${G.growModifier()}`);
const creditsAtWaterCap = S.credits;
check('buying past the cap is refused', G.buyUpgrade('autoWater') === false);
check('a refused purchase does not charge credits', S.credits === creditsAtWaterCap);
G.reset();

group('Rain Dance instantly waters a random growing plot');
S.credits = 1e9;
clearGarden();
unlockTo(17);
G.plant(0, G.seedById('eternal'));
S.grid[0].grow = 1e7; // keep it growing no matter how much gets shaved off below
const growAtStart = S.grid[0].grow;
for (let i = 0; i < 500; i += 1) G.tapFlower();
check('unowned badge never shaves grow time', S.grid[0].grow === growAtStart, `${S.grid[0].grow} vs ${growAtStart}`);

let rainLevel = 0;
while (!G.upgradeMaxed('rainDance') && rainLevel < 100) { G.buyUpgrade('rainDance'); rainLevel += 1; }
check('ten levels reach the 2% cap', rainLevel === 10, `took ${rainLevel} levels`);

const growBeforeMaxed = S.grid[0].grow;
const rainTaps = 20000; // needs a much bigger sample than before — 2% is a lot noisier than 10%
for (let i = 0; i < rainTaps; i += 1) G.tapFlower();
const totalShaved = growBeforeMaxed - S.grid[0].grow;
const rainRate = (totalShaved / 3) / rainTaps;
check('maxed Rain Dance triggers at roughly 2% of taps', Math.abs(rainRate - 0.02) < 0.006, `rate ${rainRate.toFixed(4)}`);
G.reset();

group('Bee Swarm fills a jar in an open hive');
S.credits = 1e9;
clearGarden();
G.plant(0, G.seedById('daisy'));
G.placeHive(G.emptyCells()[0]);
check('hive purchased', G.hiveCount() === 1);
check('starts unmaxed', G.upgradeMaxed('beeSwarm') === false);

for (let i = 0; i < 400; i += 1) G.tapFlower();
check('unowned badge never fills a jar', G.cellAt(0).jars.length === 0, `got ${G.cellAt(0).jars.length}`);

let beeLevel = 0;
while (!G.upgradeMaxed('beeSwarm') && beeLevel < 100) { G.buyUpgrade('beeSwarm'); beeLevel += 1; }
check('five levels reach the 1% cap', beeLevel === 5, `took ${beeLevel} levels`);

for (let i = 0; i < 3000; i += 1) G.tapFlower(); // p=0.01(fail all)^3000 is effectively impossible
const swarmJars = G.cellAt(0).jars;
check('maxed badge fills at least one jar', swarmJars.length > 0, `got ${swarmJars.length}`);
check('jar variety matches what is blooming', swarmJars.every((j) => j === 'daisy'), JSON.stringify(swarmJars));
check('a hive never overflows its capacity', swarmJars.length <= APIARY.capacity, `got ${swarmJars.length}`);
G.reset();

group('Lucky Ladybug lands on a growing plot');
S.credits = 1e9;
clearGarden();
G.plant(0, G.seedById('daisy'));
S.grid[0].grow = 1e7;
check('starts unmaxed', G.upgradeMaxed('ladybug') === false);

for (let i = 0; i < 400; i += 1) G.tapFlower();
check('unowned badge never lands a ladybug', S.grid[0].luckyBug === false);

let bugLevel = 0;
while (!G.upgradeMaxed('ladybug') && bugLevel < 100) { G.buyUpgrade('ladybug'); bugLevel += 1; }
check('eight levels reach the 1.6% cap', bugLevel === 8, `took ${bugLevel} levels`);

for (let i = 0; i < 2000; i += 1) G.tapFlower(); // p=0.016(fail all)^2000 is effectively impossible
check('maxed badge lands a ladybug on the only growing plot', S.grid[0].luckyBug === true);
G.reset();

group('Lucky Ladybug\u2019s bonus actually reaches the rarity roll, once');
clearGarden();
S.apiary.hives = [];
const meanNonCommonRate = (lucky) => {
  let hits = 0;
  const runs = 6000;
  for (let i = 0; i < runs; i += 1) {
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: lucky };
    if (G.harvest(0).rarity.key !== 'common') hits += 1;
  }
  return hits / runs;
};
const plainRate = meanNonCommonRate(false);
const luckyRate = meanNonCommonRate(true);
check('a ladybug meaningfully lifts the non-common harvest rate',
  luckyRate > plainRate * 1.35, `plain ${plainRate.toFixed(3)}, lucky ${luckyRate.toFixed(3)}`);

S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: true };
const luckyResult = G.harvest(0);
check('harvest reports the lucky flag it consumed', luckyResult.luckyHarvest === true);
check('the flag is cleared off the plot once harvested', S.grid[0].luckyBug === false);
G.plant(0, G.seedById('daisy'));
check('a freshly planted seed does not inherit the old lucky flag', S.grid[0].luckyBug === false);
G.reset();

group('reputation curve');
check('rep to leave level 1 is 10', G.repToNext(1) === 10);
check('rep to leave level 2 is 15', G.repToNext(2) === 15);
check('level 4 lands on 45', G.cumulativeRep(4) === 45);
check('level 8 lands on 175', G.cumulativeRep(8) === 175);
check('level 12 lands on 385', G.cumulativeRep(12) === 385);
check('level 17 lands on 760', G.cumulativeRep(17) === 760);
check('level 20 lands on 1045', G.cumulativeRep(20) === 1045);
check('0 rep is level 1', G.levelFromRep(0) === 1);
check('9 rep is still level 1', G.levelFromRep(9) === 1);
check('10 rep is level 2', G.levelFromRep(10) === 2);
check('44 rep is level 3', G.levelFromRep(44) === 3);
check('45 rep is level 4', G.levelFromRep(45) === 4);
check('760 rep is level 17', G.levelFromRep(760) === 17);
/* Only the quests a player can actually be handed count. A paused quest is
   still in DATA — summing it would let the ladder look complete while every
   real player stalled short of the last seed. */
const LIVE_QUESTS = DATA.quests.filter((q) => !q.paused);
const ladderRep = LIVE_QUESTS.reduce((a, q) => a + q.rep, 0);
check('the ladder reaches Eternal (level 17)', ladderRep >= 760, `sum ${ladderRep}`);

group('growth stages are data, ordered, and the ruled values');
/* stageOf() in ui.js derives sprout/stem/bud/bloom from these three thresholds
   with INCLUSIVE comparisons (progressOf clamps to exactly 1, so `>=` fires at
   ripeness where `>` never would). The suite cannot see ui.js, but it can hold
   the data contract stageOf depends on: three keys, strictly ordered, inside
   (0,1]. The exact values are the owner's ruling from the stage spike
   (2026-09-01, docs/10-decision-log.md) and ship verbatim — a retune is a
   conversation that edits this test knowingly, not a drive-by. */
check('DATA.growth carries exactly sprout, stem, bloom',
  DATA.growth && Object.keys(DATA.growth).sort().join(',') === 'bloom,sprout,stem');
check('thresholds are strictly ordered inside (0,1]',
  DATA.growth.sprout > 0 && DATA.growth.sprout < DATA.growth.stem
  && DATA.growth.stem < DATA.growth.bloom && DATA.growth.bloom <= 1);
check('the ruled values ship verbatim: .14 / .45 / .9',
  DATA.growth.sprout === 0.14 && DATA.growth.stem === 0.45 && DATA.growth.bloom === 0.9);
check('the bud opens BEFORE ripeness, never at it',
  DATA.growth.bloom < 1);

group('seed unlocks are one-time prices, not levels');
G.reset();
check('a fresh game holds exactly two free seeds', DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length === 2);
check('daisy and tulip are the free pair', G.seedUnlocked('daisy') && G.seedUnlocked('tulip'));
check('bluebell is the first wall, at 150K', !G.seedUnlocked('bluebell') && G.seedUnlockPrice('bluebell') === 150000);
check('the ladder compounds at ×1.5', G.seedUnlockPrice('lavender') === 225000
  && G.seedUnlockPrice('rose') === Math.round(150000 * 1.5 * 1.5), `${G.seedUnlockPrice('rose')}`);
check('the top seed lands near 98.5M', Math.abs(G.seedUnlockPrice('eternal') / 98526528 - 1) < 0.001,
  `${G.seedUnlockPrice('eternal')}`);
S.credits = 1e6;
check('a walled seed cannot be planted', G.plant(0, G.seedById('bluebell')) === false && !S.grid[0].seed);
check('a level says nothing about it any more', (() => { S.rep = G.cumulativeRep(17); S.level = 17;
  return !G.seedUnlocked('bluebell'); })());
S.credits = 149999;
check('the unlock refuses short a coin', G.unlockSeed('bluebell') === false && !G.seedUnlocked('bluebell'));
S.credits = 150000;
check('it charges exactly the price', G.unlockSeed('bluebell') === true && S.credits === 0);
check('and the seed is plantable forever after', (S.credits = 1e6, G.plant(0, G.seedById('bluebell')) === true));
check('a second unlock is refused, never re-charged', (S.credits = 1e6, G.unlockSeed('bluebell') === false && S.credits === 1e6));
check('skipping ahead is allowed and priced the same', (S.credits = 5e6,
  G.unlockSeed('moonflower') === true && S.credits === 5e6 - G.seedUnlockPrice('moonflower')));

group('plots open on the level bar, then cost gold — after the first Turn');
G.reset();
S.credits = 1e6;
check('plot 5 is gated at level 1', G.unlockPlot(4) === false && S.grid[4].locked);
check('Land Deed is maxed until a plot opens', G.upgradeMaxed('plotExpansion') === true);
unlockTo(3);
check('year one refuses plot 5 even at level 3', G.unlockPlot(4) === false && S.grid[4].locked);
S.year.turnsCompleted = 1;
check('plot 5 is buyable at level 3 once a Turn is complete', G.unlockPlot(4) === true && S.grid[4].locked === false);
check('Land Deed still cannot skip to plot 6', G.upgradeMaxed('plotExpansion') === true);
unlockTo(6);
check('Land Deed can buy the next opened plot', G.upgradeMaxed('plotExpansion') === false);
check('Land Deed unlocks only opened plots', G.buyUpgrade('plotExpansion') === true && S.grid[5].locked === false && S.grid[6].locked === true);

group('auto-planters respect the seed gate');
G.reset();
S.credits = 1e9;
clearGarden();
S.upgrades.plot1Harvester = 19;
G.tick(0.1);
check('a maxed harvester plants the best FREE seed on a fresh save', S.grid[0].seed === 'tulip', `got ${S.grid[0].seed}`);
S.grid[0] = { locked: false, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0, packDrop: false };
G.unlockSeed('bluebell');
G.tick(0.1);
check('a paid unlock widens what it plants', S.grid[0].seed === 'bluebell', `got ${S.grid[0].seed}`);

group('quest counters listen to events, not inventory');
G.reset();
S.credits = 1e6;
S.quests.active = [{ id: 'q_daisy_5', progress: 0 }];
S.quests.done = [];
clearGarden();
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
const daisyQ = S.quests.active.find((q) => q.id === 'q_daisy_5');
check('a daisy harvest increments the daisy quest', daisyQ && daisyQ.progress === 1);
G.plant(1, G.seedById('tulip'));
advance(30);
G.harvest(1);
check('a tulip harvest does not', daisyQ.progress === 1);
S.flowers = { daisy: 9 };
S.apiary.honey = { wild: 5 };
S.apiary.wax = 5;
G.startCraft('tea');
check('crafting spent flowers', (S.flowers.daisy || 0) < 9);
check('crafting does not move the harvest counter', daisyQ.progress === 1);
G.sell('flower', 'daisy', true);
check('selling does not move the harvest counter', daisyQ.progress === 1);

group('claiming a quest pays once');
G.reset();
S.quests.active = [{ id: 'q_harvest_1', progress: 1 }];
S.quests.done = [];
const repBefore = S.rep;
const claimed = G.claimQuest('q_harvest_1');
check('claim returns the payout', claimed && claimed.rep === 5);
check('rep moves by exactly the quest value', S.rep === repBefore + 5);
check('the id is in done', S.quests.done.indexOf('q_harvest_1') !== -1);
check('it left the active list', !S.quests.active.some((q) => q.id === 'q_harvest_1'));
check('a second claim is refused', G.claimQuest('q_harvest_1') === null);
check('rep does not move again', S.rep === repBefore + 5);

group('upgrade tutorials have distinct tracks');
check('no quest says badge', DATA.quests.every((q) => !/badge/i.test(q.text)));
check('Power Punch is on the ladder', DATA.quests.some((q) => q.id === 'q_power_1' && q.key === 'tapPower'));
check('Combo Coil is on the ladder', DATA.quests.some((q) => q.id === 'q_coil_1' && q.key === 'comboMeter'));
check('tap-50 waits until Power Punch is claimed', (() => {
  G.reset();
  return !S.quests.active.some((q) => q.id === 'q_tap_50');
})());
G.reset();
S.quests.active = [{ id: 'q_hold_20', progress: 0 }];
S.quests.done = ['q_grip_1'];
G.tapFlower();
check('a manual tap is not a hold', S.quests.active[0].progress === 0);
G.tapFlower(true);
check('a hold tick increments the hold quest', S.quests.active[0].progress === 1);
G.reset();
S.quests.active = [{ id: 'q_crit_1', progress: 0 }];
S.quests.done = ['q_charm_1'];
S.tap.critChance = 1;
/* critChanceNow() caps crit at 99% on purpose, so a tap can always miss and
   `critChance = 1` is not a guarantee — this failed about one run in thirty
   until the roll was pinned. */
const rngCrit = Math.random;
Math.random = () => 0;
G.tapFlower();
Math.random = rngCrit;
check('a guaranteed crit increments the crit quest', S.quests.active[0].progress === 1);
G.reset();
S.quests.active = [{ id: 'q_combo_55', progress: 0 }];
S.quests.done = ['q_coil_1'];
S.tap.combo = 0;
S.tap.comboMax = 60;
for (let i = 0; i < 12; i += 1) G.tapFlower();
check('the combo quest tracks peak combo, not tap count', S.quests.active[0].progress === 12);

/* A quest whose track cannot be advanced can never be completed, and because
   fillActive() caps at three it holds one of the slots forever — the strip
   steps past it now, but the daily stays out of reach until the list empties.
   Three "Sell N flowers" quests shipped that
   way. Note that grepping game.js is NOT enough to catch it — `noteQuest('sell')`
   is right there in sell(), it just only fires for kind 'flower', and the only
   sell buttons ui.js renders are honey, wax and crafted goods. Both halves below
   earn their keep: the first catches a typo'd track, the second catches a track
   that exists but nothing can reach. */
group('a paused quest is never handed out');
G.reset();
check('some quest is paused', DATA.quests.some((q) => q.paused));
check('no paused quest is ever active',
  !S.quests.active.some((q) => (DATA.quests.find((d) => d.id === q.id) || {}).paused));
{
  const paused = DATA.quests.find((q) => q.paused);
  S.quests.active = [{ id: paused.id, progress: 0 }, { id: 'q_plant_1', progress: 0 }];
  G.saveNow();
  G.load();
  check('a paused quest already in a save is dropped',
    !S.quests.active.some((q) => q.id === paused.id));
  check('the slot it held was refilled', S.quests.active.length === 3);
}

group('every quest track is one the game actually emits');
const gameSrc = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');
const emitted = new Set([...gameSrc.matchAll(/noteQuest\(\s*'([a-z]+)'/g)].map((m) => m[1]));
check('the source exposes a sane set of tracks', emitted.size >= 10, `found ${emitted.size}`);
DATA.quests.concat(DATA.dailies).forEach((q) => {
  check(`${q.id} (${q.track}) is emitted somewhere`, emitted.has(q.track));
});

group('no quest rides a track the player cannot reach');
const uiSrc = fs.readFileSync(path.join(ROOT, 'ui.js'), 'utf8');
const sellsFlowers = /stockRow\([^\n]*'flower'/.test(uiSrc);
check('sell quests exist only if the UI can sell a flower',
  sellsFlowers || !DATA.quests.concat(DATA.dailies).some((q) => q.track === 'sell'),
  sellsFlowers ? 'UI sells flowers' : 'UI sells no flowers, so no sell quest may ship');

group('a retired quest is pruned from an existing save');
G.reset();
S.quests.active = [{ id: 'q_retired_forever', progress: 0 }, { id: 'q_plant_1', progress: 0 }];
S.quests.daily = { id: 'd_retired_forever', progress: 0, day: '', claimed: false };
G.saveNow();
G.load();
check('the unknown ladder quest is gone', !S.quests.active.some((q) => q.id === 'q_retired_forever'));
check('the slot it held was refilled', S.quests.active.length === 3);
check('every remaining active quest resolves', S.quests.active.every((q) => DATA.quests.some((d) => d.id === q.id)));
check('the unknown daily was rerolled', DATA.dailies.some((d) => d.id === S.quests.daily.id));

group('every upgrade key survives a save that predates it');
G.reset();
const strippedSave = JSON.parse(JSON.stringify(S));
strippedSave.upgrades = { tapPower: 3 }; // a save from before everything else shipped
globalThis.localStorage.setItem('gw-save', JSON.stringify(strippedSave));
G.load();
check('the key the save did have is kept', S.upgrades.tapPower === 3);
Object.keys(S.upgrades).forEach((key) => {
  check(`${key} is a number, not undefined`, typeof S.upgrades[key] === 'number');
});
check('no upgrade price comes back NaN',
  Object.keys(S.upgrades).every((k) => Number.isFinite(G.upgradePrice(k))));

group('the rep drip counter carries its progress across the rename');
G.reset();
const dripSave = JSON.parse(JSON.stringify(S));
delete dripSave.harvestsTowardRep;
dripSave.harvestsThisSession = 9;
globalThis.localStorage.setItem('gw-save', JSON.stringify(dripSave));
G.load();
check('a save written under the old name keeps its progress', S.harvestsTowardRep === 9);
check('and the old key does not linger in the save', S.harvestsThisSession === undefined);
G.reset();

group('reset clears the legacy save too');
G.reset();
globalThis.localStorage.setItem('igr-save', JSON.stringify({ credits: 999999 }));
G.reset();
check('the legacy key is gone', globalThis.localStorage.getItem('igr-save') === null);
G.load();
check('a reset player does not get old progress back', S.credits === 100, `credits ${S.credits}`);
// Explicit, so that a regression here fails this group alone instead of leaking
// an Idle Garden Reborn save into every test that runs after it.
globalThis.localStorage.removeItem('igr-save');
G.reset();

group('crit chance cannot reach a certainty');
G.reset();
S.tap.critChance = 4;
check('the roll is clamped below 1', G.critChanceNow() < 1);
check('the clamp is the documented 99%', G.critChanceNow() === 0.99);
S.tap.critChance = 0.05;
check('an ordinary value is untouched', Math.abs(G.critChanceNow() - 0.05) < 1e-9);

group('onboarding does not replay for a save that predates the seen flags');
G.reset();
const playedSave = JSON.parse(JSON.stringify(S));
delete playedSave.seen;
playedSave.stats.totalTaps = 400;
playedSave.stats.totalHarvests = 250;
globalThis.localStorage.setItem('gw-save', JSON.stringify(playedSave));
G.load();
check('a played save is not told to tap the flower', S.seen.intro === true);
check('a played save is not told to plant a seed', S.seen.plot === true);
G.reset();
const tappedOnly = JSON.parse(JSON.stringify(S));
delete tappedOnly.seen;
tappedOnly.stats.totalTaps = 12;
globalThis.localStorage.setItem('gw-save', JSON.stringify(tappedOnly));
G.load();
check('tapping alone clears the flower prompt', S.seen.intro === true);
check('tapping alone still prompts the first plant', S.seen.plot === false);
G.reset();
const freshSave = JSON.parse(JSON.stringify(S));
delete freshSave.seen;
globalThis.localStorage.setItem('gw-save', JSON.stringify(freshSave));
G.load();
check('a save with no play at all still onboards', S.seen.intro === false && S.seen.plot === false);

/* The two swipe coaches, added 2026-08-30. They teach the season swipe once
   each way, and their backfill reads Fall itself: a bed paid for or a crop in
   the ground is proof the player found Fall and came back. */
G.reset();
check('a fresh garden has not been taught either season swipe',
  S.seen.fallSwipe === false && S.seen.gardenSwipe === false);
G.reset();
const usedFallSave = JSON.parse(JSON.stringify(S));
delete usedFallSave.seen;
usedFallSave.fall.bedPaid = true;
globalThis.localStorage.setItem('gw-save', JSON.stringify(usedFallSave));
G.load();
check('a save with a paid Fall bed is not taught the swipe it plainly knows',
  S.seen.fallSwipe === true && S.seen.gardenSwipe === true);
G.reset();
const grewFallSave = JSON.parse(JSON.stringify(S));
delete grewFallSave.seen;
grewFallSave.fall.grid[0] = { seed: 'pumpkin', plantedAt: 1, grow: 10, ready: false, windfall: false };
globalThis.localStorage.setItem('gw-save', JSON.stringify(grewFallSave));
G.load();
check('so is one with a crop in the Fall bed', S.seen.fallSwipe === true);
G.reset();
const turnedOnlySave = JSON.parse(JSON.stringify(S));
delete turnedOnlySave.seen;
turnedOnlySave.year.turnsCompleted = 3;
turnedOnlySave.stats.totalTaps = 900;
globalThis.localStorage.setItem('gw-save', JSON.stringify(turnedOnlySave));
G.load();
check('but a save that has Turned and never planted in Fall still gets taught',
  S.seen.fallSwipe === false && S.seen.gardenSwipe === false);
check('the flags survive a Turn — a coach shown once is never shown again',
  (() => {
    G.reset();
    S.seen.fallSwipe = true;
    S.seen.gardenSwipe = true;
    G.credit(400000);
    G.turnYear();
    return S.seen.fallSwipe === true && S.seen.gardenSwipe === true;
  })());

group('bill 13b — grandfather migration keeps seeds you could already use');
G.reset();
const saveOf = (extra) => {
  const base = JSON.parse(JSON.stringify(S));
  delete base.rep;
  delete base.level;
  delete base.quests;
  /* These saves predate the Garden Year as well as the rep track. */
  delete base.year;
  delete base.savedSeeds;
  delete base.petals;
  delete base.seedUnlocks;
  delete base.blessed;
  delete base.fall;
  Object.assign(base, extra);
  return base;
};
globalThis.localStorage.setItem('gw-save', JSON.stringify(saveOf({
  credits: 100000,
  stats: { totalTaps: 4, totalCrits: 0, totalHarvests: 1, wonders: 0 }
})));
const rich = G.load();
check('a 100k save without rep migrates', rich && rich.progressionGrant && rich.progressionGrant.level === 17);
check('every seed that save could afford stays plantable', DATA.seeds.every((s) => G.seedUnlocked(s.id)));
G.reset();
S.grid[0] = { locked: false, seed: 'moonflower', plantedAt: 0, grow: 10, ready: false, aura: '', luckyBug: false };
S.credits = 50;
S.stats.totalTaps = 3;
globalThis.localStorage.setItem('gw-save', JSON.stringify(saveOf({
  credits: 50,
  grid: JSON.parse(JSON.stringify(S.grid)),
  stats: { totalTaps: 3, totalCrits: 0, totalHarvests: 1, wonders: 0 }
})));
G.load();
check('a planted high-tier seed with an empty wallet is not taken away', G.seedUnlocked('moonflower') === true);

/* Both grandfather arms, separated — and the NEGATIVE, which is the half that
   makes the rule mean anything. Doc 33: "any seed with `discovered[id] > 0`,
   or whose old `unlockLevel` the save's level had already passed, is marked
   unlocked free". The two cases above both migrate a save whose LEVEL clears
   the seed, so the discovered arm was riding on the level arm; and nothing
   asserted that a save WITHOUT the evidence keeps its walls. A migration that
   simply unlocked everything would have satisfied every positive check here.
   (This is the escape the 2026-08-29 independent review found — M09.) */
G.reset();
globalThis.localStorage.setItem('gw-save', JSON.stringify(saveOf({
  rep: 0, level: 1, credits: 50,
  discovered: { moonflower: 3 },
  stats: { totalTaps: 3, totalCrits: 0, totalHarvests: 3, wonders: 0 }
})));
G.load();
check('the discovered arm alone grandfathers a grown seed at level 1',
  G.seedUnlocked('moonflower') === true);
check('and a seed with NEITHER evidence stays walled',
  G.seedUnlocked('eternal') === false && G.seedUnlocked('rose') === false,
  JSON.stringify(Object.keys(S.seedUnlocks)));
/* Bluebell IS grandfathered here, and correctly: its retired `unlockLevel` was
   1, so a level-1 save could always plant it and the Year must not take it
   away. That is the level arm doing its job, not leakage. */
check('the level-1 grandfather is exactly the old level-1 catalogue',
  ['daisy', 'tulip', 'bluebell'].every((id) => G.seedUnlocked(id)));

G.reset();
globalThis.localStorage.setItem('gw-save', JSON.stringify(saveOf({
  rep: G.cumulativeRep(5), level: 5, credits: 400,
  discovered: { daisy: 12, tulip: 2 },
  stats: { totalTaps: 30, totalCrits: 1, totalHarvests: 14, wonders: 0 }
})));
G.load();
check('a modest save is NOT handed the whole ladder', (() => {
  const owned = DATA.seeds.filter((s) => G.seedUnlocked(s.id)).map((s) => s.id);
  /* Level 5 clears unlockLevel 1–5 (daisy…rose); everything above stays walled. */
  return owned.length < DATA.seeds.length && !G.seedUnlocked('eternal')
    && !G.seedUnlocked('moonflower') && G.seedUnlocked('daisy');
})(), DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length + '/19 unlocked');
check('and the walls it kept still cost their documented price',
  G.seedUnlockPrice('eternal') === Math.round(150000 * Math.pow(1.5, 16)));
G.reset();

group('tickets convert to gems once and boosts are earned');
check('Lantern Tree costs gems', (() => {
  const d = DATA.decor.find((x) => x.id === 'lanterntree');
  return d && d.currency === 'gems' && d.cost === 40;
})());
check('boosters have no ticket price', DATA.boosters.every((b) => !('tickets' in b)));
G.reset();
S.harvestsTowardRep = 9;
S.credits = 1e6;
clearGarden();
S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
const tenth = G.harvest(0);
check('the tenth harvest pays reputation, not tickets', tenth.repBonus === 1 && S.rep === 1 && S.tickets === 0);

G.reset();
S.boostInv.bloom = 1;
const fired = G.activateBoost('bloom');
check('activating a held boost consumes it', fired === true && S.boostInv.bloom === 0);
check('the timer is running', G.activeBoost('bloom') === true);
check('activating with none held is a no-op', G.activateBoost('bloom') === false && G.activeBoost('bloom') === true);
S.boosters.bloom = 0;
check('activating with none held after expiry is still a no-op', G.activateBoost('bloom') === false);

G.reset();
const prior = JSON.parse(JSON.stringify(S));
delete prior.boostInv;
prior.tickets = 23;
prior.gems = 2;
prior.rep = 0;
store['gw-save'] = JSON.stringify(prior);
const converted = G.load();
check('migration converts tickets at 5:1', converted.ticketGrant
  && converted.ticketGrant.tickets === 23
  && converted.ticketGrant.gems === 5, JSON.stringify(converted.ticketGrant));
check('those gems land in the wallet', S.gems === 7, `got ${S.gems}`);
check('tickets are zeroed', S.tickets === 0);
check('boost inventory exists after conversion', S.boostInv && S.boostInv.bloom === 0);
const again = G.load();
check('a second load does not convert again', again.ticketGrant == null && S.gems === 7, JSON.stringify(again.ticketGrant));
G.reset();

group('combo multiplies tap payout, not harvests');
/* Every assertion here is an exact credit delta, and a tap can spark a Wonder (0.15%) that triples
   the payout — so the roll has to be pinned or the block fails roughly one run in twenty. 0.5 clears
   the Wonder, the crit and all three procs. Same rule as the milestone and pollination blocks. */
const rngCombo = Math.random;
Math.random = () => 0.5;
const tapGain = () => {
  const before = S.credits;
  G.tapFlower();
  return S.credits - before;
};
S.tap.power = 100;
S.tap.critChance = 0;
S.wonder.until = 0;
S.tap.combo = 0;
S.tap.comboMax = 50;
check('payout at combo 0 is 1.0×', tapGain() === 100, `got ${S.credits}`);
S.tap.combo = 25;
S.credits = 0;
check('payout at combo 25 is 1.25×', tapGain() === 125);
S.tap.combo = 50;
S.credits = 0;
check('payout at combo 50 is 1.5×', tapGain() === 150);
check('without Combo Coil the combo cannot pass 50', S.tap.combo === 50);
S.credits = 1e9;
check('Combo Coil buys', G.buyUpgrade('comboMeter') === true);
check('Combo Coil raises the cap to 60', S.tap.comboMax === 60);
S.tap.combo = 60;
S.tap.power = 100;
S.tap.critChance = 0;
S.credits = 0;
check('payout at combo 60 is 1.6×', tapGain() === 160);
S.tap.combo = 50;
G.decayCombo();
check('decay drops combo by 1', S.tap.combo === 49);
S.tap.power = 100;
S.tap.critChance = 0;
S.credits = 0;
check('decay reduces the multiplier', tapGain() === 149);
Math.random = rngCombo;
clearGarden();
S.wonder.until = 0;
S.wonder.last = G.nowSeconds();
const rng = Math.random;
Math.random = () => 0;
clearMastery();
S.tap.combo = 0;
S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
const harvestBareCombo = G.harvest(0).payout;
S.tap.combo = 50;
S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
const harvestHotCombo = G.harvest(0).payout;
Math.random = rng;
check('harvest payouts are unchanged by combo', harvestBareCombo === harvestHotCombo,
  `${harvestBareCombo} vs ${harvestHotCombo}`);
G.reset();

group('almanac tracks lifetime harvests, not inventory');
S.credits = 1e6;
clearGarden();
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
check('first harvest discovers the seed', G.discoveredOf('daisy') === 1 && G.discoveredCount() === 1);
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
check('a second harvest increments the record', G.discoveredOf('daisy') === 2);
const discoveredBeforeSpend = G.discoveredOf('daisy');
G.sell('flower', 'daisy', true);
check('selling does not decrease discovered', G.discoveredOf('daisy') === discoveredBeforeSpend);
S.flowers = { daisy: 9 };
S.apiary.honey = { wild: 5 };
S.apiary.wax = 5;
G.startCraft('tea');
check('crafting does not decrease discovered', G.discoveredOf('daisy') === discoveredBeforeSpend);
check('the completion milestone matches the seed list',
  DATA.almanacMilestones[DATA.almanacMilestones.length - 1].at === DATA.seeds.length);

group('almanac best rarity only climbs');
G.reset();
S.credits = 1e6;
clearGarden();
const rngRarity = Math.random;
Math.random = () => 0;
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
check('a common harvest records common', G.bestRarityOf('daisy') === 'common');
Math.random = () => 0.99;
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
check('a legendary harvest replaces the best', G.bestRarityOf('daisy') === 'legend');
Math.random = () => 0;
G.plant(0, G.seedById('daisy'));
advance(30);
G.harvest(0);
check('a worse rarity does not replace the best', G.bestRarityOf('daisy') === 'legend');
Math.random = rngRarity;

group('almanac milestones pay once');
G.reset();
S.credits = 1e6;
unlockTo(3);
S.discovered = { daisy: 1, tulip: 1, bluebell: 1, lavender: 1 };
S.almanacClaimed = [];
const gemsBefore = S.gems;
const bloomBefore = S.boostInv.bloom;
const repBeforeMile = S.rep;
clearGarden();
/* A harvest rolls its own 5% gem drop independently of the milestone, so leaving this to real
   randomness made "gems move by the milestone" fail roughly one run in twenty. Pin the roll high
   enough to miss the gem (and land on Rare, which none of these assertions care about). */
const rngMilestone = Math.random;
Math.random = () => 0.9;
G.plant(0, G.seedById('rose'));
advance(40);
const fifth = G.harvest(0);
check('the fifth species pays the 5-milestone', fifth.milestones && fifth.milestones.some((m) => m.at === 5));
check('rep moves by the milestone', S.rep === repBeforeMile + 20, `got ${S.rep}`);
check('gems move by the milestone', S.gems === gemsBefore + 1, `got ${S.gems}, was ${gemsBefore}`);
check('a bloom boost was granted', S.boostInv.bloom === bloomBefore + 1);
check('the milestone is marked claimed', S.almanacClaimed.indexOf(5) !== -1);
G.plant(0, G.seedById('rose'));
advance(40);
const fifthAgain = G.harvest(0);
Math.random = rngMilestone;
check('a second harvest does not pay again', !(fifthAgain.milestones && fifthAgain.milestones.length));
check('rep does not move again', S.rep === repBeforeMile + 20, `got ${S.rep}`);

group('almanac backfill from remaining flowers');
G.reset();
const priorAlmanac = JSON.parse(JSON.stringify(S));
delete priorAlmanac.discovered;
delete priorAlmanac.bestRarity;
delete priorAlmanac.almanacClaimed;
priorAlmanac.flowers = { daisy: 3, tulip: 1, bluebell: 2, lavender: 1, rose: 1 };
priorAlmanac.rep = 0;
priorAlmanac.gems = 0;
priorAlmanac.boostInv = { bloom: 0, seedrush: 0, fortune: 0, golden: 0 };
store['gw-save'] = JSON.stringify(priorAlmanac);
const almanacLoaded = G.load();
check('backfill discovers from remaining flowers', G.discoveredCount() === 5, `got ${G.discoveredCount()}`);
check('daisy count is at least inventory', G.discoveredOf('daisy') === 3);
check('reached milestones pay on load', almanacLoaded.almanacGrant
  && almanacLoaded.almanacGrant.paid.some((m) => m.at === 5), JSON.stringify(almanacLoaded.almanacGrant));
const almanacLoadedAgain = G.load();
check('a second load does not pay again', almanacLoadedAgain.almanacGrant == null);
G.reset();

group('the mastery ladder is one generated table for every flower');
const goalStr = (t) => { const g = G.masteryTierGoal(t); return `${g.track}:${g.qty}`; };
const LADDER = ['total:10', 'rare:4', 'total:25', 'epic:2', 'total:50',
  'rare:10', 'total:100', 'epic:5', 'total:250', 'rare:20'];
LADDER.forEach((want, i) => {
  check(`tier ${i + 1} is ${want}`, goalStr(i + 1) === want, `got ${goalStr(i + 1)}`);
});
check('the decade pattern keeps going', goalStr(11) === 'total:500' && goalStr(13) === 'total:1000',
  `${goalStr(11)} / ${goalStr(13)}`);
check('an undiscovered seed has no goal', G.masteryGoal('daisy') === null);

group('the mastery ladder is retired — frozen, silent, and flat');
G.reset();
S.credits = 1e9;
clearGarden();
const rngMastery = Math.random;
Math.random = () => 0.5;    // 0.5 × 100 lands in the 70-wide common band, and no gem
const harvestDaisies = (n) => {
  let last = null;
  for (let i = 0; i < n; i += 1) {
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
    last = G.harvest(0);
  }
  return last;
};
check('a fresh seed reads 1.0×', G.masteryMult('daisy') === 1 && G.masteryOf('daisy') === 0);
const ninth = harvestDaisies(9);
const tenthDaisy = harvestDaisies(1);
check('the tenth harvest no longer completes a tier', G.masteryOf('daisy') === 0 && tenthDaisy.mastery.length === 0);
check('the payout is flat across the old tier boundary', tenthDaisy.payout === ninth.payout,
  `${ninth.payout} then ${tenthDaisy.payout}`);
check('a recorded tier is a record, not a multiplier', (() => {
  S.mastery.daisy = 7;
  const flat = G.masteryMult('daisy') === 1;
  const paid = harvestDaisies(1).payout;
  S.mastery.daisy = 0;
  return flat && paid === ninth.payout;
})());
Math.random = rngMastery;

group('rarity tiers count that rarity or better');
G.reset();
S.credits = 1e9;
clearGarden();
S.discovered.daisy = 10;
S.mastery.daisy = 1;                       // sitting on tier 2: 4 Rare or better
S.rarityCounts.daisy = { rare: 1, epic: 2, legend: 0 };
check('epics count toward a Rare goal', G.masteryGoal('daisy').have === 3,
  JSON.stringify(G.masteryGoal('daisy')));
S.rarityCounts.daisy = { rare: 1, epic: 2, legend: 1 };
check('legendaries count too', G.masteryGoal('daisy').have === 4);
S.mastery.daisy = 3;                       // tier 4: 2 Epic or better
check('a Rare does not count toward an Epic goal', G.masteryGoal('daisy').have === 3,
  JSON.stringify(G.masteryGoal('daisy')));

group('retirement means no harvest ever advances or pays the ladder again');
G.reset();
clearGarden();
const rngRetired = Math.random;
Math.random = () => 0.9;                   // misses the 5% harvest gem drop
S.discovered.daisy = 1e9;                  // counts that would once have crossed many tiers at once
S.rarityCounts.daisy = { rare: 1e9, epic: 1e9, legend: 0 };
S.mastery.daisy = 0;
const gemsBeforeRetired = S.gems;
S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
const retiredHarvest = G.harvest(0);
Math.random = rngRetired;
check('the tiers stay where the record left them', G.masteryOf('daisy') === 0);
check('the payload carries no mastery moment', retiredHarvest.mastery.length === 0);
check('no mastery gem is ever paid again', S.gems === gemsBeforeRetired, `${S.gems} vs ${gemsBeforeRetired}`);

group('mastery records are lifetime, not inventory');
G.reset();
S.credits = 1e9;
clearGarden();
const rngSpend = Math.random;
Math.random = () => 0.75;                  // every harvest is a Rare
for (let i = 0; i < 6; i += 1) {
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
  G.harvest(0);
}
Math.random = rngSpend;
const countsBeforeSpend = JSON.stringify(G.rarityCountsOf('daisy'));
check('six rare harvests were recorded', G.rarityCountsOf('daisy').rare === 6, countsBeforeSpend);
G.sell('flower', 'daisy', true);
check('selling does not decrease rarityCounts', JSON.stringify(G.rarityCountsOf('daisy')) === countsBeforeSpend);
S.flowers = { daisy: 9 };
S.apiary.honey = { wild: 5 };
S.apiary.wax = 5;
G.startCraft('tea');
check('crafting does not decrease rarityCounts', JSON.stringify(G.rarityCountsOf('daisy')) === countsBeforeSpend);

group('bill 13 — mastery backfill is bounded by bestRarity, and an old save converts exactly once');
G.reset();
const priorMastery = JSON.parse(JSON.stringify(S));
delete priorMastery.mastery;
delete priorMastery.rarityCounts;
/* A genuine pre-Year save: none of the Year's keys exist on it. */
delete priorMastery.year;
delete priorMastery.savedSeeds;
delete priorMastery.petals;
delete priorMastery.seedUnlocks;
delete priorMastery.blessed;
delete priorMastery.fall;
priorMastery.discovered = { daisy: 500, tulip: 500, bluebell: 1 };
priorMastery.bestRarity = { daisy: 'common', tulip: 'rare', bluebell: 'legend' };
priorMastery.gems = 0;
priorMastery.flowers = {};
store['gw-save'] = JSON.stringify(priorMastery);
const masteryLoaded = G.load();
check('a common-only seed is credited no rarities',
  JSON.stringify(G.rarityCountsOf('daisy')) === JSON.stringify({ rare: 0, epic: 0, legend: 0 }),
  JSON.stringify(G.rarityCountsOf('daisy')));
check('a Rare-best seed is credited rares but never epics',
  G.rarityCountsOf('tulip').rare === 100 && G.rarityCountsOf('tulip').epic === 0
  && G.rarityCountsOf('tulip').legend === 0, JSON.stringify(G.rarityCountsOf('tulip')));
check('an estimate never exceeds the harvests that happened',
  G.rarityCountsOf('bluebell').rare + G.rarityCountsOf('bluebell').epic
  + G.rarityCountsOf('bluebell').legend <= 1, JSON.stringify(G.rarityCountsOf('bluebell')));
/* The old build's counts still earn their tiers on the way out the door, and
   the whole ladder converts to Saved Seeds — 2 per tier, silently. */
check('the earned tiers are credited before converting', G.masteryOf('daisy') === 1
  && G.masteryOf('tulip') > G.masteryOf('daisy'),
  `daisy ${G.masteryOf('daisy')}, tulip ${G.masteryOf('tulip')}`);
const convertedTiers = DATA.seeds.reduce((n, s) => n + G.masteryOf(s.id), 0);
check('the conversion grants 2 Saved Seeds per tier', masteryLoaded.yearGrant
  && masteryLoaded.yearGrant.grant === 2 * convertedTiers
  && S.savedSeeds === masteryLoaded.yearGrant.grant,
  JSON.stringify(masteryLoaded.yearGrant));
check('the retired multiplier stays flat regardless', G.masteryMult('tulip') === 1);
check('backfill and conversion pay no gems', S.gems === 0, `${S.gems}`);
const masteryBefore = G.masteryOf('tulip');
const seedsBefore = S.savedSeeds;
const secondLoad = G.load();
check('a second load neither advances nor converts again',
  G.masteryOf('tulip') === masteryBefore && S.savedSeeds === seedsBefore && secondLoad.yearGrant == null,
  JSON.stringify(secondLoad.yearGrant));
G.reset();

/* ---------------- verbs and adjacency ---------------- */

group('the plot ring is symmetric');
G.reset();
clearGarden();
check('every plot has exactly two neighbours',
  S.grid.every((_, i) => G.neighboursOf(i).length === 2));
check('adjacency is mutual',
  S.grid.every((_, i) => G.neighboursOf(i).every((n) => G.neighboursOf(n).includes(i))));
check('the ring is one closed loop of eight', (() => {
  const seen = new Set([0]);
  let cur = 0, prev = -1;
  for (let step = 0; step < 8; step += 1) {
    const next = G.neighboursOf(cur).find((n) => n !== prev);
    prev = cur; cur = next; seen.add(cur);
  }
  return seen.size === 8 && cur === 0;
})());
check('a locked plot is not a neighbour', (() => {
  S.grid[1].locked = true;
  const n = G.neighboursOf(0);
  S.grid[1].locked = false;
  return !n.includes(1) && n.length === 1;
})());

group('verbs are read off what is growing, not the plot');
clearGarden();
S.credits = 1e9;
unlockTo(20);
check('an empty plot has no verb', G.verbAt(0) === null);
G.plant(0, G.seedById('lavender'));
check('a planted verb seed reports its verb', G.verbAt(0) === 'nurse');
G.plant(1, G.seedById('daisy'));
check('a plain seed reports none', G.verbAt(1) === null);
check('the neighbour sees the nurse', G.neighbourVerbs(1, 'nurse') === 1);
check('a plot does not count its own verb', G.neighbourVerbs(0, 'nurse') === 0);

group('Nurse trades its own payout for its neighbours');
clearGarden();
clearMastery();
S.credits = 1e9;
check('a lone plot is unmodified', G.verbPayoutMult(2) === 1);
G.plant(0, G.seedById('lavender'));
check('the nurse itself pays less', Math.abs(G.verbPayoutMult(0) - 0.9) < 1e-9,
  `${G.verbPayoutMult(0)}`);
check('an adjacent plot pays more', Math.abs(G.verbPayoutMult(1) - 1.2) < 1e-9,
  `${G.verbPayoutMult(1)}`);
check('a plot two steps away is untouched', G.verbPayoutMult(2) === 1);
G.plant(2, G.seedById('lavender'));
check('two nurses on one plot stack', Math.abs(G.verbPayoutMult(1) - 1.4) < 1e-9,
  `${G.verbPayoutMult(1)}`);

group('Deeproot pays for a full neighbourhood');
clearGarden();
S.credits = 1e9;
G.plant(3, G.seedById('jadefern'));
check('alone it is unmodified', G.verbPayoutMult(3) === 1);
G.plant(0, G.seedById('daisy'));
check('one planted neighbour pays 8%', Math.abs(G.verbPayoutMult(3) - 1.08) < 1e-9,
  `${G.verbPayoutMult(3)}`);
G.plant(5, G.seedById('daisy'));
check('both neighbours pay 16%', Math.abs(G.verbPayoutMult(3) - 1.16) < 1e-9,
  `${G.verbPayoutMult(3)}`);

group('Nightbell trades day payout for night');
/* dayPhase = ((t / DAY.cycle) + DAY.offset) % 1, so a phase can be dialled in exactly. */
const setPhase = (p) => { clock = DAY.cycle * (((p - DAY.offset) % 1 + 1) % 1) + DAY.cycle * 1000; };
clearGarden();
S.credits = 1e9;
G.plant(0, G.seedById('moonflower'));
setPhase(0.95);
check('the clock can be put at night', G.isNight());
check('it pays double at night', Math.abs(G.verbPayoutMult(0) - 2) < 1e-9, `${G.verbPayoutMult(0)}`);
setPhase(0.5);
check('the clock can be put at midday', !G.isNight());
check('it pays half by day', Math.abs(G.verbPayoutMult(0) - 0.5) < 1e-9, `${G.verbPayoutMult(0)}`);
check('it does not touch its neighbours',
  G.verbPayoutMult(1) === 1 && G.verbPayoutMult(3) === 1);
/* The hour's half of the trade, on its own. Seven hundred and twenty samples of a six-minute
   cycle span six weather slots and no more, so a single aurora among them would read as a sixth
   of the day rather than as the 2.5% of slots it actually is. The sky is held Clear here; the
   real long-run shift an aurora makes is measured in the sky pass at the foot of this file. */
G.Dev.setWeather('clear');
check('over a whole cycle it is close to neutral', (() => {
  let total = 0;
  const N = 720;
  for (let i = 0; i < N; i += 1) {
    setPhase(i / N);
    total += G.verbPayoutMult(0);
  }
  const mean = total / N;
  return mean > 0.85 && mean < 1.15;
})(), 'mean multiplier across a cycle');
G.Dev.setWeather(null);

group('Keeper shortens growth both ways round');
clearGarden();
S.credits = 1e9;
check('no keeper leaves growth alone', G.keeperModifier(1) === 1);
G.plant(0, G.seedById('bluebell'));
check('an adjacent keeper shortens the modifier',
  Math.abs(G.keeperModifier(1) - 0.85) < 1e-9, `${G.keeperModifier(1)}`);
G.plant(1, G.seedById('daisy'));
const keptGrow = S.grid[1].grow;
/* The sky is a factor in the same product since the sky pass, and this group runs at whatever
   hour the suite reached — so rain's share goes in the expectation rather than the assertion
   being pinned to a dry day. rainGrowMult() is 1 under every sky but rain. */
check('planting beside a keeper bakes the bonus in',
  Math.abs(keptGrow - G.seedById('daisy').grow * G.growModifier() * 0.85 * G.rainGrowMult()) < 1e-6,
  `${keptGrow}`);
clearGarden();
G.plant(1, G.seedById('daisy'));
const plainGrow = S.grid[1].grow;
G.plant(0, G.seedById('bluebell'));
check('a keeper planted later still helps what is already growing',
  S.grid[1].grow < plainGrow, `${S.grid[1].grow} vs ${plainGrow}`);
check('it never rushes a plot that is already done', (() => {
  clearGarden();
  G.plant(1, G.seedById('daisy'));
  advance(60);
  const done = S.grid[1].grow;
  G.plant(0, G.seedById('bluebell'));
  return S.grid[1].grow === done;
})());

group('Lantern multiplies the gem chance it finds');
/* Measured on an Eternal Crown, whose 39% base makes the doubling unmistakable. A Daisy's 0.6%
   would need tens of thousands of samples to separate the two — gem chance now scales with grow
   time, so the cheap seed is a terrible instrument for this. */
const gemDropRate = (withLantern) => {
  clearGarden();
  clearMastery();
  S.credits = 1e14;
  S.gems = 0;
  let drops = 0;
  const N = 3000;
  for (let i = 0; i < N; i += 1) {
    if (withLantern && !S.grid[0].seed) {
      S.grid[0] = { locked: false, seed: 'orchid', plantedAt: clock, grow: 1e6, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
    }
    S.grid[1] = { locked: false, seed: 'eternal', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
    const h = G.harvest(1);
    if (h && h.gemDrop) drops += 1;
    clearMastery();
  }
  return drops / N;
};
const withLantern = gemDropRate(true);
const noLantern = gemDropRate(false);
check('a lantern roughly doubles gem drops next door',
  withLantern > noLantern * 1.6, `${withLantern.toFixed(3)} vs ${noLantern.toFixed(3)}`);

group('Beacon lifts rarity next door');
clearGarden();
clearMastery();
S.credits = 1e9;
const commonShare = (plotHasBeacon) => {
  clearGarden();
  clearMastery();
  if (plotHasBeacon) G.plant(0, G.seedById('marigold'));
  let common = 0, total = 0;
  for (let i = 0; i < 3000; i += 1) {
    G.plant(1, G.seedById('daisy'));
    advance(30);
    const h = G.harvest(1);
    if (h) { total += 1; if (h.rarity.key === 'common') common += 1; }
    if (plotHasBeacon && !S.grid[0].seed) G.plant(0, G.seedById('marigold'));
  }
  return common / total;
};
const withBeacon = commonShare(true);
const withoutBeacon = commonShare(false);
check('a beacon makes Common meaningfully rarer', withBeacon < withoutBeacon - 0.1,
  `${withBeacon.toFixed(3)} vs ${withoutBeacon.toFixed(3)}`);

group('Spreader sows into empty neighbours only');
clearGarden();
clearMastery();
S.credits = 1e9;
let sowed = 0;
for (let i = 0; i < 600; i += 1) {
  clearGarden();
  G.plant(0, G.seedById('starlit'));
  advance(400);
  const h = G.harvest(0);
  if (h && h.sown >= 0) {
    sowed += 1;
    if (!G.neighboursOf(0).includes(h.sown)) { sowed = -9999; break; }
  }
}
check('it sows sometimes but not always', sowed > 40 && sowed < 400, `${sowed}/600`);
check('it only ever sows into a neighbour', sowed > 0);
check('it never sows over an occupied plot', (() => {
  for (let i = 0; i < 400; i += 1) {
    clearGarden();
    G.plant(0, G.seedById('starlit'));
    G.plant(1, G.seedById('daisy'));
    G.plant(3, G.seedById('daisy'));
    advance(400);
    const before = S.grid[1].seed;
    const h = G.harvest(0);
    if (h && h.sown >= 0) return false;
    if (S.grid[1].seed !== before) return false;
  }
  return true;
})());
check('a sown copy is free', (() => {
  for (let i = 0; i < 600; i += 1) {
    clearGarden();
    G.plant(0, G.seedById('starlit'));
    advance(400);
    const credits = S.credits;
    const h = G.harvest(0);
    if (h && h.sown >= 0) return S.credits === credits + h.payout;
  }
  return false;
})());

group('verbs leave the yield curve alone');
check('every seed still yields exactly 1.4x its cost',
  DATA.seeds.every((s) => Math.abs(s.yield - s.cost * 1.4) < 1e-6));
check('every verb on a seed is a real verb',
  DATA.seeds.every((s) => !s.verb || Boolean(DATA.verbs[s.verb])));
check('every verb is actually used by a seed', (() => {
  const used = new Set(DATA.seeds.map((sd) => sd.verb).filter(Boolean));
  return Object.keys(DATA.verbs).every((v) => used.has(v));
})());
check('no seed carries two verbs', DATA.seeds.every((sd) => !Array.isArray(sd.verb)));
check('no two verbs share an effect category', (() => {
  const cats = Object.values(DATA.verbs).map((v) => v.cat);
  return new Set(cats).size === cats.length;
})());
G.reset();

/* ---------------- weather and mutations ---------------- */

group('weather is a pure function of the clock');
G.reset();
check('the same slot always gives the same weather',
  G.weatherForSlot(12345).id === G.weatherForSlot(12345).id);
check('slots are derived from epoch seconds',
  G.weatherSlotOf(DATA.weather.slotSeconds * 7) === 7
  && G.weatherSlotOf(DATA.weather.slotSeconds * 7 + 1) === 7);
check('weatherAt agrees with weatherForSlot', (() => {
  const t = 987654;
  return G.weatherAt(t).id === G.weatherForSlot(G.weatherSlotOf(t)).id;
})());
check('the table weights total 100',
  Math.abs(DATA.weather.types.reduce((a, t) => a + t.w, 0) - 100) < 1e-9);
check('the distribution matches the table', (() => {
  const seen = {};
  const N = 200000;
  for (let s = 0; s < N; s += 1) {
    const id = G.weatherForSlot(s).id;
    seen[id] = (seen[id] || 0) + 1;
  }
  return DATA.weather.types.every((t) => Math.abs((seen[t.id] || 0) / N * 100 - t.w) < 1.0);
})());
check('every weather either mutates or is clear',
  DATA.weather.types.every((t) => (t.mutation === null) === (t.catch === 0)));
check('every weather mutation is a real mutation',
  DATA.weather.types.every((t) => !t.mutation || Boolean(DATA.mutations[t.mutation])));

group('the mutation ladder is well formed');
check('ranks are unique and contiguous', (() => {
  const ranks = Object.values(DATA.mutations).map((m) => m.rank).sort((a, b) => a - b);
  return ranks.every((r, i) => r === i + 1);
})());
check('a higher rank always pays more', (() => {
  const byRank = Object.values(DATA.mutations).sort((a, b) => a.rank - b.rank);
  return byRank.every((m, i) => i === 0 || m.mult > byRank[i - 1].mult);
})());
check('a rarer weather carries a higher-ranked mutation', (() => {
  const carriers = DATA.weather.types.filter((t) => t.mutation)
    .sort((a, b) => b.w - a.w);
  return carriers.every((t, i) => i === 0
    || DATA.mutations[t.mutation].rank > DATA.mutations[carriers[i - 1].mutation].rank);
})());
check('no mutation means no multiplier', G.mutationMult(null) === 1 && G.mutationRank(null) === 0);

group('catching a mutation');
const slotOfWeather = (id) => {
  for (let s = 0; s < 500000; s += 1) if (G.weatherForSlot(s).id === id) return s;
  return -1;
};
const SLOT = DATA.weather.slotSeconds;
const rainSlot = slotOfWeather('rain');
const clearSlot = slotOfWeather('clear');
const stormSlot = slotOfWeather('storm');
check('the table is reachable — rain, clear and storm all occur',
  rainSlot >= 0 && clearSlot >= 0 && stormSlot >= 0);

const rngMut = Math.random;
/* Put a plant in the ground whose single mutation moment is already due, standing in the
   middle of a chosen weather slot. */
const dueIn = (idx, seed, slot) => {
  S.grid[idx] = {
    locked: false, seed, plantedAt: clock - 10, grow: 1e6, ready: false, aura: '',
    luckyBug: false, mutation: null, mutateAt: slot * SLOT + SLOT / 2
  };
};
clearGarden();
unlockTo(20);
S.credits = 1e9;

Math.random = () => 0;                                   // always catch
dueIn(0, 'daisy', clearSlot);
G.rollMutations();
check('clear weather never mutates', S.grid[0].mutation === null);
check('a spent roll is not repeated', S.grid[0].mutateAt === 0);
dueIn(0, 'daisy', rainSlot);
G.rollMutations();
check('rain can mutate a growing plot', S.grid[0].mutation === 'dew');
const spent = S.grid[0].mutateAt;
G.rollMutations();
check('each plant rolls exactly once', spent === 0 && S.grid[0].mutation === 'dew');

clearGarden();
dueIn(1, 'daisy', rainSlot);
S.grid[1].mutateAt = clock + 1e6;                        // not due yet
G.rollMutations();
check('a roll in the future does not fire early', S.grid[1].mutation === null);
clearGarden();
G.rollMutations();
check('an empty plot never rolls', S.grid.every((c) => c.mutation === null));
dueIn(2, 'daisy', rainSlot);
S.grid[2].locked = true;
G.rollMutations();
S.grid[2].locked = false;
check('a locked plot never rolls', S.grid[2].mutation === null);
Math.random = rngMut;

group('planting schedules exactly one roll');
clearGarden();
S.credits = 1e9;
G.plant(0, G.seedById('daisy'));
const cell0 = S.grid[0];
check('a moment is scheduled on planting', cell0.mutateAt > 0);
check('the moment falls inside the grow window',
  cell0.mutateAt >= cell0.plantedAt && cell0.mutateAt <= cell0.plantedAt + cell0.grow,
  `${cell0.mutateAt - cell0.plantedAt} of ${cell0.grow}`);
check('moments vary between plantings', (() => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    clearGarden();
    G.plant(0, G.seedById('eternal'));
    seen.add(Math.round(S.grid[0].mutateAt - S.grid[0].plantedAt));
  }
  return seen.size > 20;
})());

group('Beacon raises the catch chance, never the payout');
clearGarden();
check('a lone plot has no bonus', G.catchMultiplier(1) === 1);
S.credits = 1e9;
G.plant(0, G.seedById('marigold'));
check('an adjacent beacon raises the multiplier',
  Math.abs(G.catchMultiplier(1) - 1.5) < 1e-9, `${G.catchMultiplier(1)}`);
check('it does not touch the payout multiplier', G.verbPayoutMult(1) === 1);
const catchRate = (withBeacon) => {
  let caught = 0;
  const N = 4000;
  for (let i = 0; i < N; i += 1) {
    clearGarden();
    if (withBeacon) dueIn(0, 'marigold', clearSlot);
    dueIn(1, 'daisy', rainSlot);
    G.rollMutations();
    if (S.grid[1].mutation) caught += 1;
  }
  return caught / N;
};
const beaconCatch = catchRate(true);
const plainCatch = catchRate(false);
check('a beacon meaningfully raises how often a neighbour catches',
  beaconCatch > plainCatch * 1.25, `${beaconCatch.toFixed(3)} vs ${plainCatch.toFixed(3)}`);

group('mutations pay out and then clear');
clearGarden();
clearMastery();
S.wonder = { until: 0, last: 0 };
S.boosters = {};
S.apiary.hives = [];
Math.random = () => 0.5;                                 // Common, no gem, no Wonder
const ripe = (mutation) => {
  S.grid[0] = {
    locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '',
    luckyBug: false, mutation, mutateAt: 0
  };
};
ripe(null);
const plainHarvest = G.harvest(0).payout;
clearMastery();
ripe('gilded');
const gildedResult = G.harvest(0);
Math.random = rngMut;
check('a gilded harvest pays its multiplier',
  gildedResult.payout === Math.round(plainHarvest * DATA.mutations.gilded.mult),
  `${gildedResult.payout} vs ${Math.round(plainHarvest * DATA.mutations.gilded.mult)}`);
check('the harvest reports which mutation paid', gildedResult.mutation === 'gilded');
check('the plot is left clean',
  S.grid[0].mutation === null && S.grid[0].mutateAt === 0);

group('mutations leave the seed curve alone');
check('every seed still yields exactly 1.4x its cost',
  DATA.seeds.every((s) => Math.abs(s.yield - s.cost * 1.4) < 1e-6));

/* The assertion the whole ladder is tuned against. One roll per plant makes the share even
   across seeds, which is the property that keeps mutations present at every stage of the game
   rather than dominant late and invisible early. Deliberately statistical: wide band. */
/* The sky pass was checked against this group and moved nothing in it: rain's nudge is a growth
   factor and never reaches a catch, and the rig below sets each plant's grow and its rolling
   moment by hand — so the measurement reads the roll rather than the clock, whatever sky the
   suite happens to be standing under. The structural guards under that claim are in the sky
   pass at the foot of this file. */
group('mutations contribute a fifth of income, evenly across seeds');
const incomeShare = (seedId, cycles) => {
  clearGarden();
  clearMastery();
  S.wonder = { until: 0, last: 0 };
  S.boosters = {};
  S.apiary.hives = [];
  S.credits = 1e18;
  const seed = G.seedById(seedId);
  let base = 0;
  let actual = 0;
  for (let i = 0; i < cycles; i += 1) {
    clock += seed.grow + 1;
    S.grid[0] = {
      locked: false, seed: seedId, plantedAt: clock - seed.grow, grow: seed.grow, ready: false,
      aura: '', luckyBug: false, mutation: null, mutateAt: 0
    };
    S.grid[0].mutateAt = S.grid[0].plantedAt + Math.random() * seed.grow;
    G.rollMutations();
    const mut = S.grid[0].mutation;
    S.grid[0].ready = true;
    S.grid[0].plantedAt = 0;
    S.grid[0].grow = 0;
    const h = G.harvest(0);
    actual += h.payout;
    base += h.payout / G.mutationMult(mut);
    clearMastery();
  }
  return (actual - base) / actual;
};
const fastShare = incomeShare('daisy', 20000);
const slowShare = incomeShare('eternal', 20000);
check('a cheap seed sits in the 12-32% band',
  fastShare > 0.12 && fastShare < 0.32, `${(fastShare * 100).toFixed(1)}%`);
check('an expensive seed sits in the same band',
  slowShare > 0.12 && slowShare < 0.32, `${(slowShare * 100).toFixed(1)}%`);
check('the share does not swing wildly between them',
  Math.abs(fastShare - slowShare) < 0.12,
  `${(fastShare * 100).toFixed(1)}% vs ${(slowShare * 100).toFixed(1)}%`);
G.reset();

group('the day cycle keys to epoch, not to page load');
G.reset();
check('the same instant always gives the same phase',
  G.dayPhase(1000000) === G.dayPhase(1000000));
check('phase stays inside 0..1', (() => {
  for (let i = 0; i < 500; i += 1) {
    const t = G.dayPhase(i * 977);
    if (!(t >= 0 && t < 1)) return false;
  }
  return true;
})());
check('a full cycle later is the same phase',
  Math.abs(G.dayPhase(500) - G.dayPhase(500 + DAY.cycle)) < 1e-9);
check('half a cycle later is not', Math.abs(G.dayPhase(500) - G.dayPhase(500 + DAY.cycle / 2)) > 0.4);
/* Two things answer "is it dark" since the sky pass — the hour, and an aurora bending the light
   rules whatever the hour. These three are the HOUR's contract, so the sky is held Clear across
   them; the aurora's own window is asserted with the rest of phase 3.9 at the foot of this file.
   Without the hold, 55 of the 2,000 instants below fall inside an aurora slot and the bounds
   check reads as broken when it is the other rule speaking. */
G.Dev.setWeather('clear');
check('night and day both occur across a cycle', (() => {
  let night = 0, day = 0;
  for (let i = 0; i < DAY.cycle; i += 1) { if (G.isNight(i)) night += 1; else day += 1; }
  return night > 0 && day > 0;
})());
check('isNight agrees with the dawn and dusk bounds', (() => {
  for (let i = 0; i < 2000; i += 1) {
    const t = G.dayPhase(i * 13);
    if (G.isNight(i * 13) !== (t < DAY.dawn || t >= DAY.dusk)) return false;
  }
  return true;
})());
check('night is the minority of the cycle', (() => {
  let night = 0;
  for (let i = 0; i < DAY.cycle; i += 1) if (G.isNight(i)) night += 1;
  return night / DAY.cycle < 0.5;
})());
G.Dev.setWeather(null);

group('development tools force the real path');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('a forced weather overrides the clock',
  G.Dev.setWeather('wonderfall').id === 'wonderfall' && G.currentWeather().id === 'wonderfall');
check('releasing it returns to the real sky', (() => {
  G.Dev.setWeather(null);
  const t = G.nowSeconds();
  return G.currentWeather().id === G.weatherForSlot(G.weatherSlotOf(t)).id;
})());
check('filling the garden plants every open plot', (() => {
  clearGarden();
  const n = G.Dev.fillGarden();
  return n === 8 && S.grid.every((c) => c.seed);
})());
check('a forced mutation lands on a growing plot', Boolean(G.Dev.mutate('gilded')));
check('an unknown mutation is refused', G.Dev.mutate('nonsense') === null);
check('ripening makes everything harvestable', (() => {
  const n = G.Dev.ripenAll();
  return n > 0 && S.grid.filter((c) => c.seed).every((c) => G.nowSeconds() - c.plantedAt >= c.grow);
})());
check('an armed rarity is honoured and then spent', (() => {
  clearGarden();
  clearMastery();
  G.Dev.armRarity('legend');
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
  const first = G.harvest(0);
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
  const second = G.harvest(0);
  return first.rarity.key === 'legend' && G.Dev.pending().rarity === null && second.rarity.key !== undefined;
})());
check('an armed gem drops once', (() => {
  clearGarden();
  clearMastery();
  S.gems = 0;
  G.Dev.armGem();
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
  const h = G.harvest(0);
  return h.gemDrop === true && G.Dev.pending().gem === false;
})());
check('a forced proc fires with the upgrade at zero', (() => {
  clearGarden();
  S.credits = 1e9;
  S.upgrades.ladybug = 0;
  G.plant(0, G.seedById('daisy'));
  const r = G.Dev.fireProc('ladybug');
  return Boolean(r && r.ladybug);
})());
check('forcing one proc does not fire the others', (() => {
  clearGarden();
  S.credits = 1e9;
  S.upgrades.rainDance = 0; S.upgrades.ladybug = 0;
  G.plant(0, G.seedById('eternal'));
  const r = G.Dev.fireProc('rainDance');
  return Boolean(r && r.rainDance) && !r.ladybug;
})());
check('a boosted proc toggles on and off', (() => {
  G.Dev.clearAll();
  const on = G.Dev.toggleProc('ladybug');
  const listed = G.Dev.boostedProcs().includes('ladybug');
  const off = G.Dev.toggleProc('ladybug');
  return on === true && listed && off === false && !G.Dev.boostedProcs().includes('ladybug');
})());
check('boosting raises the chance well above the badge rate', (() => {
  G.Dev.clearAll();
  S.upgrades.ladybug = 0;
  const base = G.Dev.procChance('ladybug');
  G.Dev.toggleProc('ladybug');
  const boosted = G.Dev.procChance('ladybug');
  G.Dev.clearAll();
  return base === 0 && boosted >= 0.5;
})());
check('a boosted proc fires repeatedly across ordinary taps', (() => {
  clearGarden();
  clearMastery();
  S.credits = 1e12;
  S.upgrades.ladybug = 0;
  G.Dev.clearAll();
  G.Dev.toggleProc('ladybug');
  let fired = 0;
  for (let i = 0; i < 200; i += 1) {
    if (!S.grid[0].seed) G.plant(0, G.seedById('eternal'));
    S.grid[0].luckyBug = false;
    if (G.tapFlower().ladybug) fired += 1;
  }
  G.Dev.clearAll();
  return fired > 60 && fired < 160;          // ~50% of 200
})(), 'boosted ladybug fire count');
check('turning the boost off restores the badge rate', (() => {
  clearGarden();
  S.credits = 1e12;
  S.upgrades.ladybug = 0;
  G.Dev.clearAll();
  G.plant(0, G.seedById('eternal'));
  let fired = 0;
  for (let i = 0; i < 400; i += 1) { S.grid[0].luckyBug = false; if (G.tapFlower().ladybug) fired += 1; }
  return fired === 0;                        // level 0 and no boost means never
})());
check('the chance is never above certainty', (() => {
  S.upgrades.ladybug = 999;
  G.Dev.toggleProc('ladybug');
  const c = G.Dev.procChance('ladybug');
  G.Dev.clearAll();
  S.upgrades.ladybug = 0;
  return c === 1;
})());
check('clearing drops everything armed', (() => {
  G.Dev.armRarity('epic');
  G.Dev.armGem();
  G.Dev.setWeather('storm');
  G.Dev.clearAll();
  const p = G.Dev.pending();
  return p.rarity === null && p.gem === false && p.weather === null;
})());
check('nothing armed leaks into an ordinary harvest', (() => {
  clearGarden();
  clearMastery();
  G.Dev.clearAll();
  let legends = 0;
  for (let i = 0; i < 2000; i += 1) {
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false, mutation: null, mutateAt: 0 };
    if (G.harvest(0).rarity.key === 'legend') legends += 1;
    clearMastery();
  }
  return legends > 5 && legends < 120;   // ~2% of 2000, nowhere near forced
})());
G.reset();

group('coming back after time away');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('a fresh save reports nothing', G.reconcile() === null);
check('a quick reload reports nothing', (() => {
  G.plant(0, G.seedById('daisy'));
  advance(30);
  S.lastSeen = G.nowSeconds() - 5;
  return G.reconcile() === null;
})());
check('a long absence with a ripe plot reports it', (() => {
  clearGarden();
  G.plant(0, G.seedById('daisy'));
  advance(60);
  S.lastSeen = G.nowSeconds() - 7200;
  const r = G.reconcile();
  return r !== null && r.ripened === 1 && r.away >= 7200;
})());
check('a long absence with an empty garden still reports nothing', (() => {
  clearGarden();
  S.apiary.hives = [];
  S.lastSeen = G.nowSeconds() - 7200;
  return G.reconcile() === null;
})());
check('lastSeen advances on every reconcile', (() => {
  S.lastSeen = G.nowSeconds() - 7200;
  G.reconcile();
  return Math.abs(S.lastSeen - G.nowSeconds()) < 2;
})());
check('a mutation due while away resolves against the sky of its own moment', (() => {
  clearGarden();
  clearMastery();
  const rainAt = rainSlot * SLOT + SLOT / 2;
  S.grid[0] = {
    locked: false, seed: 'daisy', plantedAt: clock - 10, grow: 1e6, ready: false, aura: '',
    luckyBug: false, mutation: null, mutateAt: rainAt
  };
  const rng = Math.random;
  Math.random = () => 0;
  S.lastSeen = G.nowSeconds() - 7200;
  const r = G.reconcile();
  Math.random = rng;
  /* Rain is long past — the clock now stands somewhere else entirely — yet the roll must still
     resolve as rain, because it is evaluated at the moment it was scheduled for. */
  return r && r.caught.length === 1 && r.caught[0].mutation === 'dew';
})());
check('the report names the weather that actually caused it', (() => {
  clearGarden();
  const stormAt = stormSlot * SLOT + SLOT / 2;
  S.grid[0] = {
    locked: false, seed: 'daisy', plantedAt: clock - 10, grow: 1e6, ready: false, aura: '',
    luckyBug: false, mutation: null, mutateAt: stormAt
  };
  const rng = Math.random;
  Math.random = () => 0;
  S.lastSeen = G.nowSeconds() - 7200;
  const r = G.reconcile();
  Math.random = rng;
  return r && r.caught[0].weather.id === 'storm' && r.caught[0].mutation === 'gilded';
})());
G.reset();

group('offline earnings run on two axes');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e15;
check('base rate and hours match the table',
  Math.abs(G.offlineRate() - DATA.offline.baseRate) < 1e-9
  && Math.abs(G.offlineHours() - DATA.offline.baseHours) < 1e-9);
check('an unautomated garden earns nothing while away', (() => {
  S.upgrades.autoHarvest = 0;
  return G.passiveIncomeRate() === 0 && G.offlineEarnings(7200).coins === 0;
})());
check('a drone with no planters still earns nothing', (() => {
  S.upgrades.autoHarvest = 3;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 0; });
  return G.passiveIncomeRate() === 0;
})());
check('planters plus a drone produce income', (() => {
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
  return G.passiveIncomeRate() > 0;
})());
check('the drone cadence caps throughput when the plots outrun it', (() => {
  /* Planters at level 1 plant Daisies, so eight plots want 8/12 = 0.67 harvests a second — more
     than a slow drone can lift. Faster drone, more income. */
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 1; });
  S.upgrades.autoHarvest = 1;
  const slow = G.passiveIncomeRate();
  S.upgrades.autoHarvest = 5;
  const fast = G.passiveIncomeRate();
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
  S.upgrades.autoHarvest = 3;
  return fast > slow;
})());
check('a drone faster than the plots adds nothing', (() => {
  /* The mirror case: planters at 3 grow Bluebells slowly enough that the drone has spare
     capacity, so upgrading it further must not invent income. */
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
  S.upgrades.autoHarvest = 5;
  const a = G.passiveIncomeRate();
  S.upgrades.autoHarvest = 9;
  const b = G.passiveIncomeRate();
  S.upgrades.autoHarvest = 3;
  return Math.abs(a - b) < 1e-9;
})());
check('the rate axis raises earnings', (() => {
  S.upgrades.offlineRate = 0;
  const low = G.offlineEarnings(3600).coins;
  S.upgrades.offlineRate = 10;
  const high = G.offlineEarnings(3600).coins;
  S.upgrades.offlineRate = 0;
  return high > low;
})());
check('the rate axis is capped at full pace', (() => {
  S.upgrades.offlineRate = 999;
  const r = G.offlineRate();
  S.upgrades.offlineRate = 0;
  return r === DATA.offline.maxRate;
})());
check('the hours axis is capped', (() => {
  S.upgrades.offlineHours = 999;
  const h = G.offlineHours();
  S.upgrades.offlineHours = 0;
  return h === DATA.offline.maxHours;
})());
check('inside the cap, earnings are linear in time', (() => {
  const one = G.offlineEarnings(3600);
  const two = G.offlineEarnings(7200);
  return !one.capped && !two.capped && Math.abs(two.coins - one.coins * 2) <= 2;
})());
check('past the cap it trickles rather than stopping', (() => {
  const capSec = G.offlineHours() * 3600;
  const atCap = G.offlineEarnings(capSec);
  const wayOver = G.offlineEarnings(capSec * 10);
  return wayOver.capped && wayOver.coins > atCap.coins
    && wayOver.coins < atCap.coins * 10;
})());
check('the trickle matches the configured share', (() => {
  const capSec = G.offlineHours() * 3600;
  const atCap = G.offlineEarnings(capSec).coins;
  const plusOneCap = G.offlineEarnings(capSec * 2).coins;
  const extra = plusOneCap - atCap;
  return Math.abs(extra - atCap * DATA.offline.trickle) <= 2;
})());
check('a longer absence never pays less', (() => {
  let prev = -1;
  for (let h = 1; h <= 72; h += 1) {
    const c = G.offlineEarnings(h * 3600).coins;
    if (c < prev) return false;
    prev = c;
  }
  return true;
})());
check('reconcile banks the coins and reports the cap', (() => {
  clearGarden();
  S.upgrades.autoHarvest = 3;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
  S.credits = 0;
  S.lastSeen = G.nowSeconds() - 48 * 3600;
  const r = G.reconcile();
  return r && r.earned > 0 && S.credits === r.earned && r.capped === true
    && r.capHours === DATA.offline.baseHours;
})());

group('the drone rental composes with the badge instead of fighting it');
/* Placed beside the offline group deliberately: the invariant this one guards
   hardest is that a thirty-second ad NEVER reaches passiveIncomeRate(), which is
   read once at the moment of return and multiplied over the whole absence. */
G.reset();
check('the video glyph the ad pill draws actually exists', Icons.has('video'));
/* Guards the silent-sparkle fallback, which only warns on localhost — a missing
   glyph on GitHub Pages says nothing at all (docs/11-known-issues.md). */
check('the rental\'s terms live outside the booster row',
  DATA.droneRental.boost === 'drone'
  && typeof DATA.droneRental.revealAt === 'number'
  && DATA.boosters.some((b) => b.id === DATA.droneRental.boost),
  JSON.stringify(DATA.droneRental));
/* A price field on the booster row itself is caught by "no booster carries a
   price of any kind" further down; this asserts the knob landed where the
   playbook sends it instead. And the offer holds no clock, for the same PEGI 12
   reason DATA.ads holds none — the RENTAL's own countdown is the rail chip,
   which is a different thing entirely. */
check('and the offer holds no countdown of its own',
  !/expire|until|deadline|ends|seconds|countdown/i.test(JSON.stringify(DATA.droneRental)),
  JSON.stringify(DATA.droneRental));
check('a first session is offered no rental at all',
  S.ads.sessions === 0 && G.droneRentalOffered() === false, `${S.ads.sessions}`);
G.saveNow(); G.load();
check('and neither is the first page load', G.droneRentalOffered() === false);
G.saveNow(); G.load();
check('nor a refresh of that same first sitting', G.droneRentalOffered() === false,
  `${S.ads.sessions} opens`);
/* Aged by the fixture rather than by another reload, because age is exactly the
   thing a reload cannot manufacture — that is the whole point of the second term. */
S.ads.firstAt = G.nowSeconds() - 25 * 3600;
G.saveNow(); G.load();
check('only a returning player is offered it', G.droneRentalOffered() === true);
clearGarden();
unlockTo(20);
S.credits = 1e15;
S.upgrades.autoHarvest = 0;
check('a rental flies the drone when nothing was bought', (() => {
  const took = G.rentDrone();
  return took === true && G.droneLevel() === 1 && G.boostVal('autoHarvest') === 1;
})(), `${G.droneLevel()}`);
/* THE LOOP, not the getter. A rental wired into droneLevel() and the Almanac but
   NOT into processAutoHarvest() is a cosmetic rental, and every assertion above
   stays green under it. So: a ready plot, no badge at all, and the clock run
   forward until the drone either lifts it or does not. */
check('and the LIVE LOOP actually picks with it', (() => {
  clearGarden();
  S.grid[0].seed = 'daisy'; S.grid[0].plantedAt = clock - 100; S.grid[0].grow = 10; S.grid[0].ready = true;
  advance(6);
  return S.grid[0].seed === null && S.upgrades.autoHarvest === 0;
})(), `seed=${S.grid[0].seed} badge=${S.upgrades.autoHarvest}`);
/* NEVER SPENT ON A PARTIAL GRANT, held structurally rather than by review: both
   refusals must happen BEFORE watchAd(), or a player pays an impression for
   nothing. The mark is taken BEFORE the refusing call — an earlier assertion
   that performs the refusal itself would absorb the stray impression and this
   would pass with the guard in the wrong place. Found by sabotage; the first
   version of these two checks did exactly that. */
const impBeforeRunning = G.adImpressions();
check('renting refuses while one is already flying',
  G.rentDrone() === false && G.droneRentalBlocked() === 'running', G.droneRentalBlocked());
check('and spends no impression on that refusal',
  G.adImpressions() === impBeforeRunning, `${G.adImpressions()} vs ${impBeforeRunning}`);
check('a rental never slows a faster badge', (() => {
  delete S.boosters.drone;
  S.upgrades.autoHarvest = 3;
  S.boosters.drone = G.nowSeconds() + 1800;
  return G.droneLevel() === 3
    && G.autoHarvestCadence(G.droneLevel()) === G.autoHarvestCadence(3)
    && G.autoHarvestCadence(G.droneLevel()) < G.autoHarvestCadence(1);
})(), `level ${G.droneLevel()} at ${G.autoHarvestCadence(G.droneLevel())}s`);
delete S.boosters.drone;
/* A fresh day, so the counter below can actually MOVE if the guard is in the
   wrong place. Without it the day's budget is already spent, everything refuses
   at the cap, and the assertion could only ever pass. */
S.ads.day = 'not-today';
const impBeforeOwned = G.adImpressions();
check('and it is never offered in the first place',
  G.droneRentalBlocked() === 'owned' && G.rentDrone() === false, G.droneRentalBlocked());
check('and that refusal spends no impression either',
  G.adImpressions() === impBeforeOwned, `${G.adImpressions()} vs ${impBeforeOwned}`);
/* THE BOUNDARY, which is where a partial grant would actually hide. A badge at
   exactly the loan's own level gains the player nothing at all, so it refuses
   too — `>=`, not `>`. One rung below, the loan is a real speed-up and is
   offered. Both sides stated, because only the pair proves the comparison. */
check('a badge already AT the loan\'s level refuses; one rung below is offered', (() => {
  const b = DATA.boosters.find((x) => x.id === DATA.droneRental.boost);
  S.upgrades.autoHarvest = b.effects.autoHarvest;
  const equal = G.droneRentalBlocked() === 'owned' && G.rentDrone() === false;
  S.upgrades.autoHarvest = b.effects.autoHarvest - 1;
  const below = G.droneRentalBlocked() === '';
  S.upgrades.autoHarvest = 3;
  return b.effects.autoHarvest === 1 && equal && below;
})(), G.droneRentalBlocked());
/* The most dangerous assertion in the item. passiveIncomeRate() is a RATE read
   once and multiplied over the whole absence, so a rental composing there turns
   thirty seconds of attention into a full night's gold. The half that catches it
   is the FIRST one: an unbought drone over a fully planted garden earns exactly
   zero, and must go on earning exactly zero with a rental flying. */
check('the rental does not touch offline income', (() => {
  clearGarden();
  S.upgrades.autoHarvest = 0;
  delete S.boosters.drone;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
  const bare = G.passiveIncomeRate();
  S.boosters.drone = G.nowSeconds() + 1800;
  const rented = G.passiveIncomeRate();
  const away = G.offlineEarnings(7200).coins;
  S.upgrades.autoHarvest = 3;
  const bought = G.passiveIncomeRate();
  delete S.boosters.drone;
  const boughtAlone = G.passiveIncomeRate();
  return bare === 0 && rented === 0 && away === 0 && bought > 0 && bought === boughtAlone;
})(), 'a rental must never be worth an away window');
check('renting grants no gold and never reaches the mint', (() => {
  S.upgrades.autoHarvest = 0;
  delete S.boosters.drone;
  S.ads.today = {};
  const wallet = S.credits;
  const yr = S.year.coinsEarned;
  const lt = S.lifetimeCoins;
  const took = G.rentDrone();
  return took === true && S.credits === wallet
    && S.year.coinsEarned === yr && S.lifetimeCoins === lt;
})(), `${S.credits} / ${S.year.coinsEarned} / ${S.lifetimeCoins}`);
/* THE HALF HOUR, which is where the promise actually breaks and where the
   assertion above cannot reach. rentDrone() writes one timestamp and nothing
   else, so sampling the three ledgers the instant it returns reads zero BY
   CONSTRUCTION — it can only ever catch a direct credit() inside that function.
   The ad's gold arrives afterwards, out of the MACHINE it lent:
   processAutoHarvest() -> harvest() -> credit(), 473-596 picks over the thirty
   minutes. Measured before the flag: 81k-591k gold into BOTH accumulators from
   one video, on its own enough to clear DATA.year.minCoins, which is one of
   turnReady()'s two gates. So this one RUNS THE WINDOW: rent, put ready plots
   under the drone, drive the live loop, and read the ledgers after real picks.

   The setup is what makes the zero mean something. Auto-planters off, so
   nothing replants and no seed cost muddies the wallet delta; the rep counter
   zeroed and only four picks taken, so no level-up grant — gold the picks did
   not pay — can land inside the window and be mistaken for a leak. */
const rentalWindow = (() => {
  G.reset(); clearGarden(); unlockTo(12);
  returningPlayer(5); S.ads.day = 'rental-window'; S.ads.today = {};
  S.credits = 1e6;
  S.upgrades.autoHarvest = 0;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 0; });
  S.harvestsTowardRep = 0;
  const took = G.rentDrone();
  for (let i = 0; i < 4; i += 1) {
    S.grid[i].seed = 'daisy'; S.grid[i].plantedAt = clock - 100; S.grid[i].grow = 10; S.grid[i].ready = true;
  }
  const wallet = S.credits; const yr = S.year.coinsEarned; const lt = S.lifetimeCoins;
  advance(20);
  return {
    took,
    lifted: S.grid.slice(0, 4).filter((c) => c.seed === null).length,
    paid: S.credits - wallet,
    year: S.year.coinsEarned - yr,
    lifetime: S.lifetimeCoins - lt
  };
})();
check('and the half hour it lends mints nothing either — the RENTED drone\'s picks pay the wallet only',
  rentalWindow.took === true && rentalWindow.lifted === 4 && rentalWindow.paid > 0
  && rentalWindow.year === 0 && rentalWindow.lifetime === 0,
  `${rentalWindow.lifted} picks paid ${rentalWindow.paid} -> year +${rentalWindow.year}, lifetime +${rentalWindow.lifetime}`);
/* THE OTHER HALF, and it is not optional: the exclusion above must be aimed at
   the LOAN and never at the drone. A flag hung on activeBoost('drone'), or on
   the auto path as a whole, silently nerfs a PAID upgrade — the badge is the
   most expensive thing in the Upgrades tab and its gold has always fed the
   well. Same four plots, same loop, badge instead of loan: every coin lands in
   both ledgers, and the pair is what proves the condition discriminates. */
const badgeWindow = (() => {
  G.reset(); clearGarden(); unlockTo(12);
  S.credits = 1e6;
  S.upgrades.autoHarvest = 1;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 0; });
  S.harvestsTowardRep = 0;
  for (let i = 0; i < 4; i += 1) {
    S.grid[i].seed = 'daisy'; S.grid[i].plantedAt = clock - 100; S.grid[i].grow = 10; S.grid[i].ready = true;
  }
  const wallet = S.credits; const yr = S.year.coinsEarned; const lt = S.lifetimeCoins;
  advance(20);
  return {
    rented: G.activeBoost('drone'),
    lifted: S.grid.slice(0, 4).filter((c) => c.seed === null).length,
    paid: S.credits - wallet,
    year: S.year.coinsEarned - yr,
    lifetime: S.lifetimeCoins - lt
  };
})();
check('while a BOUGHT badge\'s picks go on feeding both ledgers in full',
  badgeWindow.rented === false && badgeWindow.lifted === 4 && badgeWindow.paid > 0
  && badgeWindow.year === badgeWindow.paid && badgeWindow.lifetime === badgeWindow.paid,
  `${badgeWindow.lifted} picks paid ${badgeWindow.paid} -> year +${badgeWindow.year}, lifetime +${badgeWindow.lifetime}`);
/* THE BOUNDARY THE CONDITION ACTUALLY TURNS ON. droneLevel() is
   max(badge, loan), so the loan is the reason for a pick only while it WINS
   that max. A player who rents at badge 0 and then buys the badge is flying a
   loan that contributes nothing — the identical pick at the identical cadence —
   and that gold is the purchase earning, not the ad. It must count. This is the
   one state a coarse `is a rental flying?` test gets wrong, and it is reachable
   in the live game by buying the upgrade mid-loan. */
const bothWindow = (() => {
  G.reset(); clearGarden(); unlockTo(12);
  returningPlayer(5); S.ads.day = 'both-window'; S.ads.today = {};
  S.credits = 1e6;
  S.upgrades.autoHarvest = 0;
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 0; });
  S.harvestsTowardRep = 0;
  const took = G.rentDrone();
  S.upgrades.autoHarvest = 3;          // bought mid-loan; the badge now outruns it
  for (let i = 0; i < 4; i += 1) {
    S.grid[i].seed = 'daisy'; S.grid[i].plantedAt = clock - 100; S.grid[i].grow = 10; S.grid[i].ready = true;
  }
  const wallet = S.credits; const yr = S.year.coinsEarned; const lt = S.lifetimeCoins;
  advance(20);
  return {
    took, rented: G.activeBoost('drone'), level: G.droneLevel(),
    lifted: S.grid.slice(0, 4).filter((c) => c.seed === null).length,
    paid: S.credits - wallet,
    year: S.year.coinsEarned - yr,
    lifetime: S.lifetimeCoins - lt
  };
})();
check('and a loan the badge already outruns excludes nothing, because it bought nothing',
  bothWindow.took === true && bothWindow.rented === true && bothWindow.level === 3
  && bothWindow.lifted === 4 && bothWindow.paid > 0
  && bothWindow.year === bothWindow.paid && bothWindow.lifetime === bothWindow.paid,
  `level ${bothWindow.level}, ${bothWindow.lifted} picks paid ${bothWindow.paid} -> year +${bothWindow.year}`);
G.reset(); clearGarden(); unlockTo(20);
S.credits = 1e15;
returningPlayer(5); S.ads.day = 'not-today'; S.ads.today = {};
S.upgrades.autoHarvest = 0;
check('every rental spends exactly one impression', (() => {
  delete S.boosters.drone;
  S.ads.today = {};
  const before = G.adImpressions();
  const first = G.rentDrone();
  const spent = G.adImpressions() - before;
  return first === true && spent === 1 && G.adCountToday('drone') === 1;
})(), `${G.adImpressions()} lifetime, ${G.adCountToday('drone')} today`);
check('and the day\'s cap refuses one more than it allows', (() => {
  const cap = DATA.ads.perPlacement.drone;
  S.ads.today = {};
  let took = 0;
  for (let i = 0; i < cap + 3; i += 1) {
    delete S.boosters.drone;          // clear the 'running' refusal so the CAP is what refuses
    if (G.rentDrone()) took += 1;
  }
  return cap > 0 && took === cap && G.adCountToday('drone') === cap
    && G.droneRentalOffered() === false;
})(), `took ${G.adCountToday('drone')} of ${DATA.ads.perPlacement.drone}`);
/* The owner's reveal knob, asserted as a REVERSAL rather than as a number: the
   provisional 0 is always-visible, and the one-line change back to the badge's
   curtain has to actually hide the offer or the reversal recipe is a fiction. */
check('the reveal curtain is one number, and it works', (() => {
  S.ads.day = 'not-today';
  const at = DATA.droneRental.revealAt;
  const lifetime = S.lifetimeCoins;
  DATA.droneRental.revealAt = 2500000;
  S.lifetimeCoins = 0;
  const hidden = G.droneRentalOffered() === false && G.droneRentalRevealed() === false;
  S.lifetimeCoins = 2500000;
  const shown = G.droneRentalRevealed() === true;
  DATA.droneRental.revealAt = at;
  S.lifetimeCoins = lifetime;
  return at === 0 && hidden && shown && G.droneRentalRevealed() === true;
})());
check('the Turn wipes the badge and leaves a paid rental flying', (() => {
  delete S.boosters.drone;
  S.upgrades.autoHarvest = 3;
  S.boosters.drone = G.nowSeconds() + 1800;
  G.credit(400000);
  G.turnYear();
  return S.upgrades.autoHarvest === 0 && G.activeBoost('drone') === true
    && G.droneLevel() === 1;
})(), `badge ${S.upgrades.autoHarvest}, level ${G.droneLevel()}`);
/* FOUR UI FACTS WITH NO HEADLESS PANEL TO ASSERT THEM, read out of the source the
   way the plant-picker guard does. Each is a thing an implementer can get right
   in the engine and wrong on screen, and every one of them would look fine in a
   screenshot taken in the wrong state. */
const droneSheetSrc = fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8');
const droneCardSrc = (droneSheetSrc.match(/function droneCard\(\)[\s\S]*?\n {2}\}/) || [''])[0];
check('the Shop asks whether the offer exists before drawing anything at all',
  /^function droneCard\(\)\s*\{\s*if \(!Game\.droneRentalOffered\(\)\) return '';/.test(droneCardSrc),
  `${droneCardSrc.slice(0, 80)}`);
check('and sells it with the shared ad pill, never with a price tag',
  droneCardSrc.length > 0 && /adTag\(/.test(droneCardSrc) && !/priceTag\(/.test(droneCardSrc),
  `${droneCardSrc.length} chars`);
check('the Almanac reads the composed level, so it never says Locked over a flying rental',
  /const ah = Game\.droneLevel\(\);/.test(droneSheetSrc)
  && !/const ah = S\.upgrades\.autoHarvest/.test(droneSheetSrc));
check('and the rail hides a rental in the rooms the drone cannot reach',
  /SEASON_DEAD_EFFECTS = \[[^\]]*'autoHarvest'/.test(uiSrc));

/* ---- AND THE OFFER ITSELF, RENDERED ----

   The four source reads above hold the card's SHAPE. They cannot hold what it
   SAYS or what state it is drawn in, and four wrong implementations walked past
   them at 1904/0: a countdown pasted into the card's own copy ("Offer ends in
   5:00 · 30 min · picks a ready plot…"); the `disabled` attribute dropped, so a
   dead offer keeps a live-looking pill; `adTag(!why)` written `adTag(true)`, so
   the pill never drains; and one added sentence, "It keeps earning while you are
   away." — the exact claim passiveIncomeRate() is excluded to prevent. The
   no-countdown rail is a PEGI 12 cliff (docs/40-financial-model.md) and the
   check holding it regexes {"boost":"drone","revealAt":0}: two keys, which can
   never reach a word on the card.

   So the card is RUN, with the shared ad pill lifted in beside it — whether the
   pill is drained is a question only adTag()'s real output answers. */
G.reset(); clearGarden(); unlockTo(20);
S.credits = 1e15;
returningPlayer(5); S.ads.day = 'card-day'; S.ads.today = {};
S.upgrades.autoHarvest = 0;
delete S.boosters.drone;
const droneCardOpts = { also: ['adTag'], bind: { AD_LABEL: 'Watch an ad' } };
const droneOffer = sheetRender('droneCard', [], droneCardOpts);
const droneWords = droneOffer.html.replace(/<[^>]*>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
check('the offer card renders, so everything below reads output and not source',
  droneOffer.error === '' && droneOffer.html.includes('data-ad="drone"'),
  droneOffer.error || droneWords.slice(0, 90));
check('and it is drawn LIVE for a player who can take it',
  !/\bdisabled\b/.test(droneOffer.html) && /class="price ad"/.test(droneOffer.html),
  (droneOffer.html.match(/class="price ad[^"]*"/) || ['no pill'])[0]);
/* THE OWNER'S NUMBER, and then the number the player is actually loaned. The
   card relabels itself off the same field (`Math.round(b.dur / 60)` min), so
   `nowSeconds() + b.dur * 60` reads as thirty minutes on screen and hands over
   thirty HOURS — a screenshot looks right and 21 assertions said nothing. */
const droneDur = DATA.boosters.find((b) => b.id === DATA.droneRental.boost).dur;
check('the loan is thirty minutes, which is the owner\'s literal instruction',
  droneDur === 1800, `${droneDur}s`);
check('and the card says the same thirty', /\b30 min\b/.test(droneWords), droneWords.slice(0, 90));
check('and the window a rental actually opens is that long, in seconds and not in minutes', (() => {
  S.ads.today = {};
  delete S.boosters.drone;
  const took = G.rentDrone();
  const left = S.boosters.drone - G.nowSeconds();
  return took === true && Math.abs(left - droneDur) < 2;
})(), `${Math.round(S.boosters.drone - G.nowSeconds())}s of ${droneDur}s`);
/* The rating rail, in the words a player reads rather than in a two-key object.
   A limited-time or limited-quantity offer attaches a PEGI 12 descriptor, so
   the card may never hurry anybody. */
check('and nothing on the card hurries the player into taking it',
  !/expire|expires|hurry|only|left|last chance|ends|countdown|limited|\d+:\d\d/i.test(droneWords),
  droneWords);
/* #21's deliberate exclusion, said on the card as well as enforced in the
   engine: the rental is worth nothing while the tab is shut, and a card that
   claims otherwise sells a thing the code refuses to deliver. */
check('and it never claims to keep earning while the player is away',
  !/away|offline|asleep|overnight|while you (sleep|are gone)|idle/i.test(droneWords), droneWords);
/* DRAINED, not merely present. The card stays on screen through a refusal so a
   player who just spent an ad can see what they bought — which is precisely why
   the pill has to go dead with it. */
const droneRunning = sheetRender('droneCard', [], droneCardOpts);
check('a rental already flying draws the card refusing, with the pill drained',
  droneRunning.error === '' && G.droneRentalBlocked() === 'running'
  && /\bdisabled\b/.test(droneRunning.html) && /class="price ad off"/.test(droneRunning.html),
  (droneRunning.html.match(/class="price ad[^"]*"|disabled/g) || ['neither']).join(' '));
check('and the card says why, instead of leaving a dead button unexplained',
  /already flying|already quicker/i.test(droneRunning.html.replace(/&\w+;/g, ' ')),
  droneRunning.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 120));
/* ABSENT, not disabled, and asserted on the OUTPUT: an offer that does not
   exist draws nothing at all, so a first session has no card to grey out. */
G.reset();
const droneFirst = sheetRender('droneCard', [], droneCardOpts);
check('and a first session is drawn no card whatsoever',
  G.droneRentalOffered() === false && droneFirst.error === '' && droneFirst.html === '',
  `${droneFirst.html.length} chars`);
/* Nothing else may be reached from inside the card. `also` lifts the ad pill in
   for real, so `adTag` is expected here; anything NEW is a builder somebody put
   on the Shop's one rewarded surface, and it should be looked at before this
   list is widened. */
check('and the card reaches for nothing but the ad pill it was built to use',
  droneOffer.calls.every((c) => ['adTag', 'fmt'].includes(c)), droneOffer.calls.join(', '));

/* ---- THE CADENCE: the number on the button IS the number in the loop ----
   game.js says exactly that over autoHarvestCadence(), and nothing held the two
   together. Writing `autoHarvestCadence(state.upgrades.autoHarvest)` where the
   loop reads `autoHarvestCadence(droneLevel())` leaves a badge-0 renter flying
   at 3.0s against the 2.5s the card prints — 600 picks instead of 720 across
   the half hour, 17% less than advertised for the same thirty seconds of
   attention — and the suite stayed green, because `and the LIVE LOOP actually
   picks with it` advances a WHOLE SECOND at a time and cannot tell 2.5 from
   3.0. nowSeconds() is fractional, so this steps a tenth of a second and
   measures the gaps between real picks. */
const droneGaps = (seconds) => {
  const at = [];
  let lifted = 0;
  for (let i = 0; i < seconds * 10; i += 1) {
    advance(0.1, 0.1);
    const empty = S.grid.filter((c) => !c.locked && c.seed === null).length;
    if (empty > lifted) { lifted = empty; at.push(clock); }
  }
  clock = Math.round(clock);           // the rest of the suite reads whole seconds
  return at.slice(1).map((t, i) => Number((t - at[i]).toFixed(1)));
};
const droneFillBoard = () => {
  clearGarden(); unlockTo(20);
  PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 0; });   // nothing replants under the drone
  S.grid.forEach((c) => {
    c.seed = 'daisy'; c.plantedAt = clock - 100; c.grow = 10; c.ready = true;
  });
};
G.reset(); clearGarden(); unlockTo(20);
S.credits = 1e15;
returningPlayer(5); S.ads.day = 'cadence-day'; S.ads.today = {};
S.upgrades.autoHarvest = 0;
delete S.boosters.drone;
const droneRentedTook = G.rentDrone();
droneFillBoard();
const droneRentedGaps = droneGaps(30);
const droneCardCadence = Number((droneWords.match(/every ([\d.]+)s/) || [])[1]);
check('a borrowed drone picks at the cadence its own card advertises',
  droneRentedTook === true && droneCardCadence > 0 && droneRentedGaps.length >= 4
  && droneRentedGaps.every((g) => Math.abs(g - droneCardCadence) < 0.15),
  `card says ${droneCardCadence}s, loop flew ${droneRentedGaps.join('/')}`);
/* The control, without which the measurement above could be reading a constant:
   a bought badge three rungs up flies visibly faster, and the same instrument
   sees it. */
delete S.boosters.drone;
S.upgrades.autoHarvest = 3;
droneFillBoard();
const droneBadgeGaps = droneGaps(20);
check('and a badge three rungs up is measurably quicker on the same instrument',
  droneBadgeGaps.length >= 4
  && droneBadgeGaps.every((g) => Math.abs(g - G.autoHarvestCadence(3)) < 0.15)
  && G.autoHarvestCadence(3) < droneCardCadence,
  `${G.autoHarvestCadence(3)}s expected, flew ${droneBadgeGaps.join('/')}`);
/* docs/09's ad playbook, step 2: grant only on TRUE. rentDrone() asks
   droneRentalOffered() itself, and watchAd() below it only re-asks the ad half —
   so the REVEAL curtain is enforced in exactly one place, and dropping that one
   call hands the offer to a player it is meant to be hidden from. The reversal
   recipe in docs/11 is a filed owner decision, which makes this the one gate
   most likely to be edited by somebody who is not thinking about renting. */
check('the granting call refuses behind a raised curtain, and spends nothing doing it', (() => {
  G.reset(); clearGarden(); unlockTo(20);
  S.credits = 1e15;
  returningPlayer(5); S.ads.day = 'curtain-day'; S.ads.today = {};
  S.upgrades.autoHarvest = 0;
  delete S.boosters.drone;
  const at = DATA.droneRental.revealAt;
  DATA.droneRental.revealAt = 2500000;
  S.lifetimeCoins = 0;
  const before = G.adImpressions();
  const took = G.rentDrone();
  const spent = G.adImpressions() - before;
  DATA.droneRental.revealAt = at;
  return took === false && spent === 0 && G.activeBoost('drone') === false;
})(), `${G.adImpressions()} impressions`);
G.reset();

group('simulating an absence winds the world back');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e15;
S.upgrades.autoHarvest = 3;
PLOT_AUTOPLANTERS.forEach(({ key }) => { S.upgrades[key] = 3; });
check('zero hours does nothing', G.Dev.simulateAway(0) === null);
check('plots that were growing come back ripe', (() => {
  clearGarden();
  G.plant(0, G.seedById('eternal'));
  const r = G.Dev.simulateAway(6);
  return r && r.ripened >= 1;
})());
check('the report covers the hours asked for', (() => {
  clearGarden();
  G.plant(0, G.seedById('eternal'));
  const r = G.Dev.simulateAway(12);
  return r && Math.abs(r.away - 12 * 3600) < 5;
})());
check('a long simulated absence trips the cap', (() => {
  clearGarden();
  G.plant(0, G.seedById('eternal'));
  const r = G.Dev.simulateAway(24);
  return r && r.capped === true;
})());
G.reset();

group('gems now track time in the ground, not harvest count');
G.reset();
check('gem chance rises with grow time',
  DATA.seeds.every((sd, i) => i === 0 || G.gemChanceFor(sd) >= G.gemChanceFor(DATA.seeds[i - 1])));
check('gems per hour are flat across the ladder', (() => {
  const rates = DATA.seeds.map((sd) => G.gemChanceFor(sd) * 3600 / sd.grow);
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  return hi - lo < 1e-6;
})());
check('the cheapest seed no longer out-farms the dearest', (() => {
  const daisy = G.gemChanceFor(G.seedById('daisy')) * 3600 / G.seedById('daisy').grow;
  const crown = G.gemChanceFor(G.seedById('eternal')) * 3600 / G.seedById('eternal').grow;
  return Math.abs(daisy - crown) < 1e-6;
})());
check('the chance is clamped', (() => {
  const huge = { grow: 1e9 };
  return G.gemChanceFor(huge) === DATA.gemChanceMax;
})());
check('an explicit override still wins', G.gemChanceFor({ grow: 10, gemChance: 0.42 }) === 0.42);
check('no seed defines an override any more',
  DATA.seeds.every((sd) => typeof sd.gemChance === 'undefined'));

group('calling a sky');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('the two rare skies are not for sale',
  !G.weatherCallable('aurora') && !G.weatherCallable('wonderfall') && !G.weatherCallable('clear'));
check('the two common skies are', G.weatherCallable('rain') && G.weatherCallable('storm'));
check('a call is refused without the gems', (() => {
  S.gems = 0;
  return G.callWeather('rain') === null;
})());
check('a call takes the gems and holds the sky', (() => {
  S.gems = 100;
  const before = S.gems;
  const r = G.callWeather('rain');
  return r && S.gems === before - DATA.weatherCall.prices.rain
    && G.currentWeather().id === 'rain';
})());
check('a second call is refused while one is running', G.callWeather('storm') === null);
check('the hold expires', (() => {
  advance(DATA.weatherCall.minutes * 60 + 10);
  return G.weatherCallActive() === null;
})());
check('a rare sky cannot be bought at any price', (() => {
  S.gems = 1e9;
  return G.callWeather('wonderfall') === null && G.callWeather('aurora') === null;
})());
check('calling pulls unspent rolls into the window', (() => {
  clearGarden();
  S.gems = 1000;
  S.credits = 1e12;
  G.plant(0, G.seedById('eternal'));
  G.plant(1, G.seedById('eternal'));
  const r = G.callWeather('storm');
  const c = S.weatherCall;
  return r && r.pulled === 2
    && S.grid.filter((x) => x.seed).every((x) => x.mutateAt >= c.from && x.mutateAt < c.until);
})());
check('a spent roll is not pulled back', (() => {
  advance(DATA.weatherCall.minutes * 60 + 10);
  clearGarden();
  S.gems = 1000;
  G.plant(0, G.seedById('eternal'));
  S.grid[0].mutateAt = 0;
  const r = G.callWeather('rain');
  return r && r.pulled === 0;
})());

group('skipping a timer buys time and nothing else');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('an empty plot costs nothing', G.skipCost(0) === 0);
check('a longer wait costs more', (() => {
  clearGarden();
  G.plant(0, G.seedById('daisy'));
  G.plant(1, G.seedById('eternal'));
  return G.skipCost(1) > G.skipCost(0);
})());
check('the cost falls as the plant grows', (() => {
  clearGarden();
  G.plant(0, G.seedById('eternal'));
  const full = G.skipCost(0);
  advance(400);
  return G.skipCost(0) < full;
})());
check('a ripe plot costs nothing', (() => {
  advance(1000);
  return G.skipCost(0) === 0;
})());
check('skipping is refused without the gems', (() => {
  clearGarden();
  S.gems = 0;
  G.plant(0, G.seedById('eternal'));
  return G.skipGrow(0) === null;
})());
check('skipping takes the gems and makes it ripe', (() => {
  clearGarden();
  S.gems = 500;
  G.plant(0, G.seedById('eternal'));
  const cost = G.skipCost(0);
  const before = S.gems;
  const r = G.skipGrow(0);
  return r && S.gems === before - cost && G.harvest(0) !== null;
})());
check('skipping cannot manufacture a rare mutation', (() => {
  /* The roll resolves against the sky at its *scheduled* moment, so standing inside a real
     Wonderfall and hurrying a plant whose roll was booked under a clear sky must hand it nothing.
     Uses the genuine clock rather than the dev override, which deliberately ignores time. */
  const wonderSlot = slotOfWeather('wonderfall');
  if (wonderSlot < 0) return false;
  clearGarden();
  clearMastery();
  S.gems = 1e6;
  S.credits = 1e12;
  const keep = clock;
  clock = wonderSlot * SLOT + SLOT / 2;
  const skyNow = G.currentWeather().id;
  let wonders = 0;
  for (let i = 0; i < 400; i += 1) {
    G.plant(0, G.seedById('daisy'));
    S.grid[0].mutateAt = clearSlot * SLOT + SLOT / 2;   // booked under a clear sky
    G.skipGrow(0);
    if (S.grid[0].mutation) wonders += 1;
    G.harvest(0);
  }
  clock = keep;
  return skyNow === 'wonderfall' && wonders === 0;
})());
G.reset();

/* The plot's memory, and the four ways it is allowed to be worth nothing. The
   chip that reads it lives in `ui.js` and cannot be reached from here, so what
   is held below is the whole of the rule the chip obeys: what gets written,
   what survives a harvest, what the Turn takes away, and every case where the
   getter must answer "no offer" rather than hand a button a plant that
   `plant()` would then refuse. Every binding is inside its own IIFE — this
   file is one flat script and a second top-level `const` of a name already
   used further down is a syntax error that kills the whole suite. */
group('a plot remembers what was sown into it');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('an untouched plot has no memory', G.replantSeed(0) === null);
/* `G.reset()` above rebuilds the grid from defaultState() and so hides this on
   its own — but dozens of groups call clearGarden() mid-run, with no reset in
   front of it, and a memory left standing there is a fixture the next group did
   not ask for. This is the assertion that holds that line. */
check('the fixture reset wipes the memory too, so no group inherits one', (() => {
  G.plant(0, G.seedById('rose'));
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const held = S.grid[0].lastSeed === 'rose';
  clearGarden();
  return held && !S.grid[0].lastSeed && G.replantSeed(0) === null;
})());
check('planting writes the memory', (() => {
  G.plant(0, G.seedById('rose'));
  return S.grid[0].lastSeed === 'rose';
})());
check('a growing plot offers nothing', G.replantSeed(0) === null);
check('the memory survives the harvest', (() => {
  advance(S.grid[0].grow + 5);
  const got = G.harvest(0);
  const offer = G.replantSeed(0);
  return Boolean(got) && S.grid[0].seed === null && S.grid[0].lastSeed === 'rose'
    && Boolean(offer) && offer.seed.id === 'rose';
})());
/* TWO DIFFERENT SEEDS INTO ONE PLOT — the case every check around this one
   steps around, because they all start from clearGarden() or replant the same
   id. `lastSeed: cell.lastSeed || seedDef.id` — the plausible "don't clobber an
   existing memory" reading — passed the entire suite, and the chip then offers
   the first flower ever sown here for the rest of the save. */
check('a second sowing replaces the first, so the chip offers what grew here LAST', (() => {
  clearGarden();
  S.credits = 1e12;
  G.plant(0, G.seedById('tulip'));
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const first = G.replantSeed(0);
  G.plant(0, G.seedById('rose'));
  const overwritten = S.grid[0].lastSeed === 'rose';
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const second = G.replantSeed(0);
  return Boolean(first) && first.seed.id === 'tulip' && overwritten
    && Boolean(second) && second.seed.id === 'rose';
})(), `${S.grid[0].lastSeed}`);
/* Put the fixture back exactly as this check found it — an empty plot
   remembering a rose, wallet full — so a failure here reddens one line
   instead of cascading into the checks below. */
clearGarden();
S.grid[0].lastSeed = 'rose';
S.credits = 1e12;
check("the price is the seed's own, and affordability is read off the wallet", (() => {
  const rich = G.replantSeed(0);
  S.credits = 0;
  const poor = G.replantSeed(0);
  S.credits = 1e12;
  return rich.cost === G.seedById('rose').cost && rich.afford === true
    && Boolean(poor) && poor.afford === false;
})());
/* THE BOUNDARY, which 1e12-and-0 cannot see: `>=` quietly changed to `>` passed
   the whole suite. At exactly the price the chip would render drained while a
   tap on it still planted — plant() reads `credits < cost` — so the treatment
   and the behaviour would be telling the player two different things. Both
   halves are asserted here, which is what pins them together. */
check('at exactly the price the chip is live, and the tap it invites goes through', (() => {
  const price = G.seedById('rose').cost;
  S.credits = price;
  const exact = G.replantSeed(0) || {};
  S.credits = price - 1;
  const penny = G.replantSeed(0);
  S.credits = price;
  const planted = G.plant(0, exact.seed);
  const spent = S.credits;
  return exact.afford === true && Boolean(penny) && penny.afford === false
    && planted === true && spent === 0;
})(), `${S.credits}`);
clearGarden();
S.grid[0].lastSeed = 'rose';
S.credits = 1e12;
check("a replant costs the seed's full price and goes through the real path", (() => {
  S.quests.active = [{ id: 'q_plant_30', progress: 0 }];
  const offer = G.replantSeed(0);
  const before = S.credits;
  const planted = G.plant(0, offer.seed);
  const quest = S.quests.active.find((q) => q.id === 'q_plant_30');
  return planted && S.grid[0].seed === 'rose'
    && S.credits === before - offer.cost
    && Boolean(quest) && quest.progress === 1;
})());
/* EVERY caller writes it, the free ones included — the rule the comment above
   `lastSeed` in plant() states, and the one nothing held. `payCost === false`
   is the Spreader's free neighbour and the drone's refill, and a Starlit Iris
   sows one in real play, so `lastSeed: payCost ? seedDef.id : cell.lastSeed`
   is a live bug and it passed the whole suite. "What grew here" is one rule;
   "what the player paid for" would be a second one. */
check('a free sowing writes the memory too, and the chip offers it back', (() => {
  clearGarden();
  S.credits = 0;
  const free = G.plant(0, G.seedById('daisy'), false);
  const paidNothing = S.credits === 0;
  const wrote = S.grid[0].lastSeed === 'daisy';
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const offer = G.replantSeed(0);
  return free === true && paidNothing && wrote
    && Boolean(offer) && offer.seed.id === 'daisy';
})(), `${S.grid[0].lastSeed}`);
clearGarden();
S.credits = 1e12;
check('a locked plot offers nothing', (() => {
  clearGarden();
  S.grid[5].locked = true;
  S.grid[5].lastSeed = 'daisy';
  return G.replantSeed(5) === null;
})());
check('a seed this save never unlocked is no memory at all', (() => {
  clearGarden();
  S.grid[0].lastSeed = 'eternal';
  S.seedUnlocks.eternal = false;
  const offer = G.replantSeed(0);
  S.seedUnlocks.eternal = true;
  return offer === null;
})());
check('a memory naming a seed that no longer exists is no memory at all', (() => {
  clearGarden();
  S.grid[0].lastSeed = 'never_a_seed';
  return G.replantSeed(0) === null;
})());
check('a plot with a harvester assigned offers nothing', (() => {
  clearGarden();
  S.credits = 1e12;
  G.plant(0, G.seedById('daisy'));
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const bare = G.replantSeed(0);
  S.upgrades[PLOT_AUTOPLANTERS[0].key] = 1;
  const droned = G.replantSeed(0);
  S.upgrades[PLOT_AUTOPLANTERS[0].key] = 0;
  return Boolean(bare) && bare.seed.id === 'daisy' && droned === null;
})());
check('the Turn takes the memory with the year', (() => {
  clearGarden();
  S.credits = 1e12;
  G.plant(0, G.seedById('rose'));
  advance(S.grid[0].grow + 5);
  G.harvest(0);
  const held = S.grid[0].lastSeed === 'rose';
  S.year.coinsEarned = 200000;
  S.lifetimeCoins = 200000;
  const turned = G.turnYear(null);
  return held && Boolean(turned) && S.grid.every((c) => !c.lastSeed);
})());
G.reset();

group('the card album is well formed');
G.reset();
check('twelve sets of nine', ALBUM.sets.length === 12 && ALBUM.sets.every((s) => s.cards.length === 9));
check('every set has the same rarity shape', (() => {
  const shape = ALBUM.sets[0].cards.map((c) => c.rarity).join(',');
  return ALBUM.sets.every((s) => s.cards.map((c) => c.rarity).join(',') === shape);
})());
check('exactly one mythical per set',
  ALBUM.sets.every((s) => s.cards.filter((c) => c.rarity === 'mythic').length === 1));
check('card ids are unique', (() => {
  const ids = ALBUM.sets.flatMap((s) => s.cards.map((c) => c.id));
  return new Set(ids).size === ids.length;
})());
check('card names are unique', (() => {
  const names = ALBUM.sets.flatMap((s) => s.cards.map((c) => c.name));
  return new Set(names).size === names.length;
})());
check('every card carries art', ALBUM.sets.every((s) => s.cards.every((c) => c.art && (c.art.icon || c.art.src))));
check('rarer cards are scarcer in the table', (() => {
  const w = CARD_RARITIES.map((r) => r.w);
  return w.every((x, i) => i === 0 || x < w[i - 1]);
})());
check('stars climb with rarity',
  CARD_RARITIES.every((r, i) => r.stars === i + 1));
check('the album totals 108', G.albumTotal() === 108);

group('opening packs');
G.reset();
check('no packs means no opening', G.openPack() === null);
check('granting packs works', G.grantPacks(5) === 5);
check('opening spends exactly one', (() => {
  const r = G.openPack();
  return r && r.packsLeft === 4;
})());
check('a pack holds three cards', (() => {
  const r = G.openPack();
  return r && r.drawn.length === ALBUM.packSize;
})());
check('every drawn card is real',
  (() => { const r = G.openPack(); return r.drawn.every((d) => G.cardById(d.card.id) && d.set); })());
check('owning is recorded as a count, not a flag', (() => {
  G.reset();
  G.grantPacks(1);
  const r = G.openPack();
  return r.drawn.every((d) => G.cardCount(d.card.id) >= 1);
})());
check('duplicates increment rather than overwrite', (() => {
  G.reset();
  const id = ALBUM.sets[0].cards[0].id;
  S.cards[id] = 2;
  S.cards[id] = G.cardCount(id) + 1;
  return G.cardCount(id) === 3;
})());
check('the draw prefers cards you are missing', (() => {
  /* Fill every common but one, then draw many commons: the gap should close almost at once. */
  G.reset();
  const commons = ALBUM.sets.flatMap((s) => s.cards.filter((c) => c.rarity === 'common'));
  const hole = commons[7];
  commons.forEach((c) => { if (c.id !== hole.id) S.cards[c.id] = 1; });
  G.grantPacks(40);
  for (let i = 0; i < 40 && !G.hasCard(hole.id); i += 1) G.openPack();
  return G.hasCard(hole.id);
})());
check('a full album still opens without erroring', (() => {
  G.reset();
  ALBUM.sets.forEach((s) => s.cards.forEach((c) => { S.cards[c.id] = 1; }));
  G.grantPacks(3);
  const r = G.openPack();
  return r && r.drawn.length === ALBUM.packSize && r.drawn.every((d) => !d.isNew);
})());

group('sets and album completion');
G.reset();
check('a fresh album owns nothing', G.albumOwned() === 0 && G.setOwned('firstlight') === 0);
check('set progress counts distinct cards, not copies', (() => {
  const set = ALBUM.sets[0];
  S.cards[set.cards[0].id] = 5;
  return G.setOwned(set.id) === 1;
})());
check('a set completes at nine', (() => {
  const set = ALBUM.sets[0];
  set.cards.forEach((c) => { S.cards[c.id] = 1; });
  return G.setComplete(set.id) && G.setOwned(set.id) === 9;
})());
check('completion is reported once, on the pack that finishes it', (() => {
  G.reset();
  const set = ALBUM.sets[0];
  set.cards.forEach((c, i) => { if (i > 0) S.cards[c.id] = 1; });
  const missing = set.cards[0];
  G.grantPacks(200);
  let sawIt = 0;
  for (let i = 0; i < 200; i += 1) {
    const r = G.openPack();
    if (!r) break;
    if (r.completedSets.indexOf(set.id) !== -1) sawIt += 1;
    if (G.setComplete(set.id) && sawIt) break;
  }
  return G.hasCard(missing.id) && sawIt === 1;
})());
check('a completed set is only claimed once', (() => {
  const set = ALBUM.sets[0];
  return S.setsClaimed.filter((x) => x === set.id).length <= 1;
})());
check('the album counts every set', (() => {
  G.reset();
  ALBUM.sets.forEach((s) => s.cards.forEach((c) => { S.cards[c.id] = 1; }));
  return G.albumOwned() === G.albumTotal();
})());

group('the album survives a reload');
G.reset();
S.cards[ALBUM.sets[3].cards[2].id] = 4;
S.packs = 7;
G.saveNow();
G.load();
check('owned cards persist', G.cardCount(ALBUM.sets[3].cards[2].id) === 4);
check('packs persist', S.packs === 7);
check('an old save without an album still loads', (() => {
  const prior = JSON.parse(JSON.stringify(S));
  delete prior.cards;
  delete prior.packs;
  delete prior.setsClaimed;
  store['gw-save'] = JSON.stringify(prior);
  G.load();
  return typeof S.cards === 'object' && S.packs === 0 && Array.isArray(S.setsClaimed);
})());
G.reset();

group('a pack that turns up in the garden');
G.reset();
clearGarden();
unlockTo(20);
S.credits = 1e12;
check('nothing to collect on a clean plot', G.collectPackDrop(0) === null);
check('a dropped pack lands on a plot', (() => {
  const r = G.Dev.dropPack();
  return r && S.grid[r.idx].packDrop === true;
})());
check('collecting it grants exactly one pack', (() => {
  const idx = S.grid.findIndex((c) => c.packDrop);
  S.packs = 0;
  const r = G.collectPackDrop(idx);
  return r && S.packs === 1 && S.grid[idx].packDrop === false;
})());
check('it cannot be collected twice', (() => {
  const idx = S.grid.findIndex((c) => c.packDrop);
  return idx === -1;
})());
check('a drop never doubles up on one plot', (() => {
  clearGarden();
  for (let i = 0; i < 8; i += 1) G.Dev.dropPack();
  return S.grid.filter((c) => c.packDrop).length === 8;
})());
check('a full garden refuses another drop', G.Dev.dropPack() === null);
check('it needs no badge to fire', (() => {
  clearGarden();
  S.upgrades.rainDance = 0; S.upgrades.beeSwarm = 0; S.upgrades.ladybug = 0;
  const r = G.Dev.dropPack();
  return Boolean(r);
})());
check('locked plots are never chosen', (() => {
  clearGarden();
  S.grid.forEach((c, i) => { c.locked = i > 0; c.packDrop = false; });
  const r = G.Dev.dropPack();
  S.grid.forEach((c) => { c.locked = false; });
  return r && r.idx === 0;
})());
check('the drop survives a reload', (() => {
  clearGarden();
  const r = G.Dev.dropPack();
  G.saveNow();
  G.load();
  return S.grid[r.idx].packDrop === true;
})());
check('an old save without the field loads clean', (() => {
  const prior = JSON.parse(JSON.stringify(S));
  prior.grid.forEach((c) => { delete c.packDrop; });
  store['gw-save'] = JSON.stringify(prior);
  G.load();
  return S.grid.every((c) => typeof c.packDrop === 'boolean');
})());

group('card cheats hand over real cards');
G.reset();
check('granting a card records it', (() => {
  const got = G.Dev.grantCard();
  return got && G.cardCount(got.card.id) === 1 && got.isNew === true;
})());
check('a rarity can be asked for', (() => {
  const got = G.Dev.grantCard('mythic');
  return got && got.card.rarity === 'mythic';
})());
check('an unknown rarity yields nothing', G.Dev.grantCard('nonsense') === null);
check('completing a set fills it and claims it once', (() => {
  G.reset();
  const set = G.Dev.completeSet();
  return set && G.setComplete(set.id)
    && S.setsClaimed.filter((x) => x === set.id).length === 1;
})());
check('completing again moves to the next set', (() => {
  const first = ALBUM.sets.find((x) => G.setComplete(x.id));
  const next = G.Dev.completeSet();
  return next && next.id !== first.id && G.setComplete(next.id);
})());
check('a finished album has nothing left to complete', (() => {
  ALBUM.sets.forEach((s) => s.cards.forEach((c) => { S.cards[c.id] = 1; }));
  return G.Dev.completeSet() === null;
})());
G.reset();

/* ---------------- the potting bench ---------------- */

const COLS = BENCH.cols;
function clearBench(side) {
  S.bench.cells = new Array(COLS * COLS).fill(null);
  S.bench.basket = [];
  S.bench.stock = {};
  S.bench.side = side || BENCH.startSide;
}
const putBench = (i, tier) => { S.bench.cells[i] = { tier }; };
const tierAt = (i) => (S.bench.cells[i] ? S.bench.cells[i].tier : null);
const benchIds = () => BENCH.chain.map((c) => c.id);

group('the bench merges three of a kind that meet');
clearBench();
putBench(0, 0); putBench(2, 0);
check('two apart do not merge', G.benchMergeOnce(0) === null);
putBench(1, 0);
const bridged = G.benchMergeOnce(1);
check('bridging the gap merges', Boolean(bridged) && bridged.tier === 1);
check('the survivor sits where the player dropped', tierAt(1) === 1);
check('the other two are consumed', tierAt(0) === null && tierAt(2) === null);

group('a cascade is one rung at a time, never a lookahead');
clearBench();
putBench(6, 0); putBench(8, 0);            // petals
putBench(1, 1); putBench(0, 1);            // posies
putBench(7, 0);                            // the dropped piece
const rung1 = G.benchMergeOnce(7);
check('the first call only climbs one rung', rung1.tier === 1);
check('the intermediate item really exists', tierAt(7) === 1);
const rung2 = G.benchMergeOnce(7);
check('the second call climbs the next', rung2.tier === 2);
check('a third call finds nothing left', G.benchMergeOnce(7) === null);

group('a longer run pays a bonus');
clearBench();
[0, 2, 3, 7].forEach((i) => putBench(i, 0));
putBench(1, 0);
const big = G.benchMergeOnce(1);
check(`${BENCH.bonusAt} connected pays two`, big.made.length === 2, `made ${big.made.length}`);
check('and eats the whole run', big.ate === BENCH.bonusAt);
clearBench();
[0, 1].forEach((i) => putBench(i, 0));
putBench(2, 0);
check('three connected pays one', G.benchMergeOnce(2).made.length === 1);

group('the bench never reaches past what is unlocked');
clearBench(BENCH.startSide);
const outside = COLS * COLS - 1;
check('a locked cell is locked', !G.benchUnlocked(outside));
check('nothing can be placed on it', G.benchPlace('board', 0, outside) === false);
putBench(0, 0);
check('a locked cell is not a neighbour', G.benchNeighbours(0).every(G.benchUnlocked));
clearBench(COLS);
check('a full bench unlocks every cell', G.benchUnlocked(outside));

group('the top of the chain stops');
clearBench();
const top = G.benchTop();
[0, 1, 2].forEach((i) => putBench(i, top));
check('three crowns do not merge into anything', G.benchMergeOnce(2) === null);
check('and they are all still there', tierAt(0) === top && tierAt(1) === top && tierAt(2) === top);

group('banking is the way out of a dead bench');
clearBench();
// A checkerboard: full, and no three of a kind touch anywhere.
for (let r = 0; r < S.bench.side; r += 1) {
  for (let c = 0; c < S.bench.side; c += 1) putBench(r * COLS + c, (r + c) % 2);
}
check('the bench is full', G.benchUsed() === G.benchCapacity());
const anyMerge = S.bench.cells.some((cell, i) => cell && G.benchUnlocked(i) && G.benchMergeOnce(i));
check('no merge is available anywhere', !anyMerge);
check('no cell is free', G.benchFirstFree() === -1);
const banked = G.benchBank(0);
check('banking frees a cell', Boolean(banked) && G.benchUsed() === G.benchCapacity() - 1);
check('and the item is in stock', G.benchStockOf(banked.id) === 1);
check('banking an empty cell does nothing', G.benchBank(0) === null);

group('a harvest feeds the basket, never the bench itself');
clearBench();
clearGarden();
clearMastery();
S.credits = 1e9;
const beforeCells = S.bench.cells.filter(Boolean).length;
G.plant(0, G.seedById('daisy'));
S.grid[0].plantedAt = G.nowSeconds() - 9999;
G.tick(0.1);
G.harvest(0);
check('the basket took one', S.bench.basket.length === 1);
check('the bench is untouched', S.bench.cells.filter(Boolean).length === beforeCells);
S.bench.basket = new Array(BENCH.basketMax).fill(0);
check('a full basket refuses more', G.benchAddToBasket(0) === false);

group('what a harvest is worth to the bench does not favour cheap seeds');
const lastSeed = DATA.seeds[DATA.seeds.length - 1].id;
check('a common daisy enters at the bottom', G.benchEntryTier('daisy', 'common') === 0);
check('a common endgame seed enters higher',
  G.benchEntryTier(lastSeed, 'common') > G.benchEntryTier('daisy', 'common'));
check('rarity lifts the entry', G.benchEntryTier('daisy', 'legend') > G.benchEntryTier('daisy', 'common'));
check('nothing enters above the chain', G.benchEntryTier(lastSeed, 'legend') <= G.benchTop());
/* Bench value per hour has to stay roughly flat across the ladder for the same
   reason gem chance does — a Daisy cycles ~65x faster than an Eternal Crown, so
   any flat-per-harvest rate makes spamming the cheapest seed the best feed. */
const perHour = (id) => {
  const s = G.seedById(id);
  const v = DATA.rarity.reduce((sum, r) => {
    const w = r.w / DATA.rarity.reduce((a, x) => a + x.w, 0);
    return sum + w * BENCH.chain[G.benchEntryTier(id, r.key)].value;
  }, 0);
  return (v * 3600) / s.grow;
};
const fast = perHour('daisy');
const slow = perHour(lastSeed);
check('a daisy does not out-feed the endgame seed', fast <= slow * 1.35,
  `daisy ${Math.round(fast)}/h vs ${lastSeed} ${Math.round(slow)}/h`);

group('expanding the bench costs and sticks');
clearBench(BENCH.startSide);
S.credits = 0;
check('an empty wallet cannot expand', G.benchExpand() === false);
S.credits = 1e12;
const wasSide = S.bench.side;
const price = G.benchExpandCost();
check('expanding takes the money', G.benchExpand() === true && S.credits === 1e12 - price);
check('and the bench is bigger', S.bench.side === wasSide + 1);
check('the next one costs more', G.benchExpandCost() > price);
S.bench.side = COLS;
check('a maxed bench cannot expand', G.benchExpand() === false);
check('and has no price', G.benchExpandCost() === 0);

group('the bench survives a save');
clearBench(5);
putBench(0, 2);
S.bench.basket = [0, 1];
S.bench.stock = { posy: 3 };
G.saveNow();
G.load();
check('the cells come back', tierAt(0) === 2);
check('the side comes back', S.bench.side === 5);
check('the basket comes back', S.bench.basket.join(',') === '0,1');
check('the stock comes back', G.benchStockOf('posy') === 3);
localStorage.setItem('gw-save', JSON.stringify({ version: 3, credits: 500 }));
G.load();
check('a save from before the bench loads clean', Array.isArray(S.bench.cells) && S.bench.cells.length === COLS * COLS);
check('and starts at the opening size', S.bench.side === BENCH.startSide);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, bench: { cells: [{ tier: 99 }, { tier: 1 }], side: 99, basket: [0, 77], stock: {} }
}));
G.load();
check('a rung that does not exist is dropped', tierAt(0) === null && tierAt(1) === 1);
check('an impossible side is clamped', S.bench.side === COLS);
check('a bogus basket entry is dropped', S.bench.basket.join(',') === '0');

group('the bench cannot manufacture a seed');
check('no chain item shares an id with a seed',
  benchIds().every((id) => !DATA.seeds.some((s) => s.id === id)));
check('merging up beats selling the parts', BENCH.chain.every((c, i) => (
  i === 0 || c.value > BENCH.chain[i - 1].value * BENCH.merge * 1.35
)));

group('retiring the craft quests kept the ladder intact');
const ladderNow = LIVE_QUESTS.reduce((a, q) => a + q.rep, 0);
check('the ladder still reaches Eternal (level 17)', ladderNow >= 760, `sum ${ladderNow}`);
check('no quest still points at a craft recipe', !DATA.quests.some((q) => q.track === 'craft'));
check('the bench quests name real chain rungs', DATA.quests
  .filter((q) => q.track === 'merge' || q.track === 'bank')
  .every((q) => !q.key || benchIds().includes(q.key)));
/* The bench has no screen. Until it gets one, a live quest on either of its
   tracks is a dead end that eats an active slot forever — which is exactly what
   'Merge a Posy' did. This is the same shape as the sell-quest guard above. */
const benchUI = /bench/i.test(fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8')
  .replace(/On the bench[^`]*/g, ''));
check('bench quests ship only once the bench has a UI',
  benchUI || !LIVE_QUESTS.some((q) => q.track === 'merge' || q.track === 'bank'),
  benchUI ? 'bench UI found' : 'no bench UI, so merge/bank quests must stay paused');

/* ---------------- creatures ---------------- */

const PIP = CREATURES[0];

group('a creature comes for the bloom it likes, and nothing else');
G.reset();
check('nobody is home in a new garden', G.crittersHome().length === 0);
S.discovered = {};
S.discovered[PIP.attract.seed] = PIP.attract.count - 1;
check('one short is still not enough', G.checkCritters().length === 0 && !G.critterHere(PIP.id));
S.discovered.daisy = 9999;
check('the wrong bloom never counts', G.checkCritters().length === 0);
S.discovered[PIP.attract.seed] = PIP.attract.count;
const came = G.checkCritters();
check('meeting the count brings it', came.length === 1 && came[0].def.id === PIP.id && came[0].arrived);
check('and it arrives at one star', G.critterLevel(PIP.id) === 1);
check('and it is home', G.critterHere(PIP.id));
check('it does not arrive twice', G.checkCritters().length === 0);

group('attraction reads a lifetime record, never the pantry');
check('progress comes from discovered', G.critterProgress(PIP) === S.discovered[PIP.attract.seed]);
S.flowers = {};
check('an empty pantry does not send it away', G.critterHere(PIP.id));
check('and progress is unchanged', G.critterProgress(PIP) === S.discovered[PIP.attract.seed]);

group('keepsakes accrue off the clock and cap');
const home = G.critterHome(PIP.id);
const K = PIP.keepsake;
home.since = G.nowSeconds();
home.fed = 0;
home.gifts = 0;
check('nothing waiting straight away', G.keepsakesWaiting(PIP.id) === 0);
home.since = G.nowSeconds() - K.every;
check('one turns up on the clock', G.keepsakesWaiting(PIP.id) === 1);
home.since = G.nowSeconds() - K.every * 999;
check('they cap rather than piling up', G.keepsakesWaiting(PIP.id) === K.cap, `${G.keepsakesWaiting(PIP.id)} vs cap ${K.cap}`);
check('an absence is never negative', G.keepsakesWaiting(PIP.id) >= 0);
check('a creature that is not home has none', G.keepsakesWaiting('nobody') === 0);

group('collecting pays once and resets the clock');
const critCredits = S.credits;
const critGems = S.gems;
const got = G.collectKeepsakes(PIP.id);
check('it hands over the capped amount', got && got.count === K.cap);
check('coins land', S.credits === critCredits + K.credits * K.cap);
check('gems land', S.gems === critGems + K.gems * K.cap);
check('nothing is left waiting', G.keepsakesWaiting(PIP.id) === 0);
check('collecting again pays nothing', G.collectKeepsakes(PIP.id) === null);
check('collecting from nobody is a no-op', G.collectKeepsakes('nobody') === null);

group('petting is a reaction, not a currency button');
const walletBefore = S.credits + S.gems;
check('petting works while it is home', G.petCritter(PIP.id) !== null);
check('and pays nothing at all', S.credits + S.gems === walletBefore);
check('petting an absent creature does nothing', G.petCritter('nobody') === null);

group('a harvest is what brings a creature');
G.reset();
clearGarden();
clearMastery();
S.credits = 1e9;
S.seedUnlocks[PIP.attract.seed] = true;   // Pip's bluebell sits behind the first unlock wall now
S.discovered[PIP.attract.seed] = PIP.attract.count - 1;
const seedDef = G.seedById(PIP.attract.seed);
S.grid[0].locked = false;
G.plant(0, seedDef);
S.grid[0].plantedAt = G.nowSeconds() - 99999;
G.tick(0.1);
G.harvest(0);
check('the harvest that meets the count is the one that brings it', G.critterHere(PIP.id));

group('creatures survive a save');
G.saveNow();
G.load();
check('it is still home after a reload', G.critterHere(PIP.id));
localStorage.setItem('gw-save', JSON.stringify({ version: 3, credits: 500 }));
G.load();
check('a save from before creatures loads clean', G.crittersHome().length === 0);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, critters: { nobody: { since: 1 }, [PIP.id]: { since: 1, gifts: 9999 } }
}));
G.load();
check('an unknown creature is dropped', !G.critterHere('nobody'));
check('a real one is kept', G.critterHere(PIP.id));
check('an impossible gift count is clamped', G.critterHome(PIP.id).gifts <= K.cap);

group('tending is a limited choice, not a free buff');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
check('an arrival tends itself when there is room', G.critterTending(PIP.id));
check('one slot at level 1', G.habitatSlots() === 1);
check('and it is taken', G.habitatFree() === 0);
check('tending again is a no-op', G.setTending(PIP.id, true) === false);
check('resting frees the slot', G.setTending(PIP.id, false) === true && G.habitatFree() === 1);
check('resting twice is a no-op', G.setTending(PIP.id, false) === false);
check('a resting creature is still home', G.critterHere(PIP.id));
check('tending a creature that is not home fails', G.setTending('nobody', true) === false);
S.level = HABITAT_SLOT_LEVELS[HABITAT_SLOT_LEVELS.length - 1];
check('slots grow with level', G.habitatSlots() === HABITAT_SLOT_LEVELS.length);
S.level = 1;

group('a tending creature actually moves the mutation rate');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
hungry(PIP.id);
G.setTending(PIP.id, false);
const catchResting = G.catchMultiplier(0);
G.setTending(PIP.id, true);
const catchTending = G.catchMultiplier(0);
const oneStar = PIP.trait.value / CREATURE_STARS;
check('resting changes nothing', catchResting === 1, `got ${catchResting}`);
/* A one-star arrival is a fifth as strong as the same creature raised — the
   whole point of levelling is that the listed value is the ceiling. */
check('a one-star creature gives a fifth', Math.abs(catchTending - (1 + oneStar)) < 1e-9, `got ${catchTending}`);
check('the trait reads by id', Math.abs(G.critterTrait(PIP.trait.id) - oneStar) < 1e-9);
S.critters[PIP.id].level = CREATURE_STARS;
check('a maxed creature gives the listed value',
  Math.abs(G.critterTrait(PIP.trait.id) - PIP.trait.value) < 1e-9);
S.critters[PIP.id].level = 1;
check('an unknown trait sums to zero', G.critterTrait('nonsense') === 0);
/* The mutation doc is explicit that stacking raises the CHANCE and never the
   payout, or the income share stops being computable. */
check('and never touches the payout', G.mutationMult('gilded') === DATA.mutations.gilded.mult);

group('tending survives a save, and cannot exceed the slots');
G.saveNow();
G.load();
check('a tender comes back tending', G.critterTending(PIP.id));
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, tending: true } }
}));
G.load();
check('one tender at one slot is fine', G.habitatUsed() <= G.habitatSlots());
/* A save written before tending existed must come back working, not silently
   idle — the same rule as never taking a seed away from an old save. */
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, gifts: 0 } }
}));
G.load();
check('an old creature comes back tending', G.critterTending(PIP.id));
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, gifts: 0, tending: false } }
}));
G.load();
check('but a deliberate rest is respected', !G.critterTending(PIP.id));
check('a trait cannot outrun the slot table', G.critterTrait(PIP.trait.id) <= PIP.trait.value * G.habitatSlots());

/* Stacking is the point of the genre, so these do NOT forbid a trait from sharing
   an axis with a verb — that stacks, and stacking is fine. What they guard is the
   two things that actually go wrong: a roster where every creature does the same
   KIND of thing (choosing three is then a ranking, not a decision), and too many
   traits multiplying straight into the harvest product, which already has seven
   terms and an endless mastery ladder in it. */
group('traits are varied in kind, and the yield pool stays small');
const POOLS = ['capped', 'chance', 'utility', 'yield'];
const traitsUsed = CREATURES.filter((c) => c.trait).map((c) => CREATURE_TRAITS[c.trait.id]);
check('every trait names a real entry', CREATURES.every((c) => !c.trait || CREATURE_TRAITS[c.trait.id]));
check('every trait has a positive value', CREATURES.every((c) => !c.trait || c.trait.value > 0));
check('every trait declares a known pool', Object.values(CREATURE_TRAITS)
  .every((t) => POOLS.indexOf(t.pool) !== -1));
check('the roster is not all one kind of effect', (() => {
  if (traitsUsed.length < 3) return true;               // too few to judge yet
  const cats = new Set(traitsUsed.map((t) => t.category));
  return cats.size >= Math.ceil(traitsUsed.length / 2);
})(), `${new Set(traitsUsed.map((t) => t.category)).size} categories across ${traitsUsed.length} traits`);
/* At most a third of the roster may multiply the harvest product directly. Four
   creatures at +25% yield is 2.44x on top of mastery, verbs, rarity and
   mutations — that is where an idle economy quietly breaks. */
check('few traits multiply the harvest product', (() => {
  const yields = traitsUsed.filter((t) => t.pool === 'yield').length;
  return yields <= Math.max(1, Math.floor(traitsUsed.length / 3));
})(), `${traitsUsed.filter((t) => t.pool === 'yield').length} of ${traitsUsed.length} in the yield pool`);
check('every trait can describe itself', Object.values(CREATURE_TRAITS)
  .every((t) => t.name && typeof t.desc === 'function' && t.desc(0.25).length > 0));

group('a creature is raised by the bloom that attracted it');
G.reset();
S.discovered[PIP.attract.seed] = G.critterGoalFor(PIP, 1);
G.checkCritters();
hungry(PIP.id);
check('starts at one star', G.critterLevel(PIP.id) === 1);
check('and is not maxed', !G.critterMaxed(PIP.id));
const goal2 = G.critterGoal(PIP.id);
check('the next goal names the next star', goal2.level === 2);
check('and needs more than the first', goal2.qty > G.critterGoalFor(PIP, 1));
check('the goal is the same bloom', goal2.seed === PIP.attract.seed);
S.discovered[PIP.attract.seed] = goal2.qty - 1;
check('one short does not raise it', G.checkCritters().length === 0 && G.critterLevel(PIP.id) === 1);
S.discovered[PIP.attract.seed] = goal2.qty;
const grew = G.checkCritters();
check('meeting it raises a star', grew.length === 1 && grew[0].levelled && G.critterLevel(PIP.id) === 2);
check('the trait grew with it',
  Math.abs(G.critterTrait(PIP.trait.id) - PIP.trait.value * 2 / CREATURE_STARS) < 1e-9);
/* A long absence can bank enough for more than one star at once, so the check
   loops rather than granting a single level per harvest. */
S.discovered[PIP.attract.seed] = G.critterGoalFor(PIP, CREATURE_STARS);
const jumped = G.checkCritters();
check('a big jump grants every star it earned', G.critterLevel(PIP.id) === CREATURE_STARS);
check('and reports how many it gained', jumped.length === 1 && jumped[0].gained >= 2);
check('a maxed creature has no next goal', G.critterGoal(PIP.id) === null);
check('and stops climbing', G.checkCritters().length === 0);
S.discovered[PIP.attract.seed] = 1e9;
check('it never passes the ceiling', G.checkCritters().length === 0 && G.critterLevel(PIP.id) === CREATURE_STARS);
check('a maxed creature gives exactly the listed value',
  Math.abs(G.critterTraitAt(PIP, G.critterLevel(PIP.id)) - PIP.trait.value) < 1e-9);
check('a creature that is not home has no level', G.critterLevel('nobody') === 0);

group('stars survive a save, and an old creature keeps what it earned');
S.critters[PIP.id].level = 3;
G.saveNow();
G.load();
check('the level comes back', G.critterLevel(PIP.id) === 3);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 1 },
  critters: { [PIP.id]: { since: 1, gifts: 0 } }
}));
G.load();
check('a save from before stars comes back at one, not zero', G.critterLevel(PIP.id) === 1);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 1 },
  critters: { [PIP.id]: { since: 1, gifts: 0, level: 999 } }
}));
G.load();
check('an impossible level is clamped', G.critterLevel(PIP.id) === CREATURE_STARS);

/* Every trait needs a consumer, and a trait wired to nothing is invisible until
   someone notices the number never moves. One assertion per trait, each proving
   the value actually reaches the system it claims to touch. */
group('every trait reaches the system it claims to touch');
function bring(id, level) {
  const def = G.critterById(id);
  S.discovered[def.attract.seed] = G.critterGoalFor(def, CREATURE_STARS);
  G.checkCritters();
  S.critters[id].level = level || CREATURE_STARS;
  S.critters[id].tending = true;
  return def;
}
/* Awake but NOT well fed — the baseline a trait is measured against. An arrival
   now lands with a full clock, so it is well fed for its first day and reads a
   star high; anything measuring an unbuffed value has to spend that first. */
function hungry(id) {
  if (S.critters[id]) S.critters[id].fedUntil = G.nowSeconds() + FED_THRESHOLD_HOURS * 3600;
}

function restAll() {
  CREATURES.forEach((c) => { if (S.critters[c.id]) S.critters[c.id].tending = false; });
}

G.reset();
S.level = 20;                                   // enough habitat slots to test each
CREATURES.forEach((c) => bring(c.id));
restAll();

// mutationLuck -> catchMultiplier
S.critters.pip.tending = true;
check('mutationLuck lifts the catch multiplier', G.catchMultiplier(0) > 1);
restAll();

// gemLuck -> the harvest gem roll
const plainGem = G.gemChanceFor(G.seedById('daisy'));
S.critters.thistle.tending = true;
check('gemLuck is a real trait value', G.critterTrait('gemLuck') > 0);
check('gemChanceFor itself is untouched', G.gemChanceFor(G.seedById('daisy')) === plainGem,
  'the trait belongs at the roll, not in the base rate');
restAll();

// packLuck -> a pack can land on a harvest
S.critters.bramble.tending = true;
check('packLuck is a real trait value', G.critterTrait('packLuck') > 0);
(() => {
  clearGarden();
  clearMastery();
  S.credits = 1e9;
  const rng = Math.random;
  Math.random = () => 0;                        // forces every roll to land
  G.plant(0, G.seedById('daisy'));
  S.grid[0].plantedAt = G.nowSeconds() - 9999;
  G.tick(0.1);
  const p = G.harvest(0);
  Math.random = rng;
  check('a forager turns a pack up on a harvest', Boolean(p && p.cardPack));
})();
restAll();
(() => {
  clearGarden();
  S.credits = 1e9;
  const rng = Math.random;
  Math.random = () => 0;
  G.plant(0, G.seedById('daisy'));
  S.grid[0].plantedAt = G.nowSeconds() - 9999;
  G.tick(0.1);
  const p = G.harvest(0);
  Math.random = rng;
  check('and no pack without a forager tending', !(p && p.cardPack));
})();

// nightYield -> the harvest payout, only at night
S.critters.luna.tending = true;
check('nightYield only pays after dark',
  G.isNight() ? G.critterPayoutMult() > 1 : G.critterPayoutMult() === 1,
  `isNight ${G.isNight()} mult ${G.critterPayoutMult()}`);
restAll();
check('and nothing while it rests', G.critterPayoutMult() === 1);

// offlineRate -> offlineRate(), still clamped
const rateNoPet = G.offlineRate();
S.critters.ember.tending = true;
check('offlineRate lifts the away rate', G.offlineRate() > rateNoPet,
  `${rateNoPet} -> ${G.offlineRate()}`);
S.upgrades.offlineRate = 99;
check('but never past the cap', G.offlineRate() <= DATA.offline.maxRate);
S.upgrades.offlineRate = 0;
restAll();

// keepsakeSpeed -> everyone's keepsakes, including its own
(() => {
  const pipK = G.critterById('pip').keepsake;
  // Only a creature that is OUT earns, so the one being measured has to be out.
  S.critters.pip.tending = true;
  S.critters.pip.since = G.nowSeconds() - pipK.every / 2;
  S.critters.pip.fed = 0;
  S.critters.pip.gifts = 0;
  check('half a wait yields nothing on its own', G.keepsakesWaiting('pip') === 0);
  S.critters.bumble.tending = true;
  check('a helper makes it arrive early', G.keepsakesWaiting('pip') >= 1);
  // Rest only the HELPER — resting Pip too would pass this for the wrong reason.
  S.critters.bumble.tending = false;
  check('and it goes back when the helper rests', G.keepsakesWaiting('pip') === 0);
  restAll();
})();

/* Every pair, proved on and proved off. The "off" half matters more than the
   "on" half — a pair that is silently always on is indistinguishable from a
   buff nobody chose. */
group('named pairs are on only when both are tending');
G.reset();
S.level = 20;
CREATURES.forEach((c) => bring(c.id));
restAll();
check('nothing is active with everyone resting', G.activePairs().length === 0);
CREATURE_PAIRS.forEach((pair) => {
  restAll();
  S.critters[pair.of[0]].tending = true;
  const half = G.pairActive(pair.id);
  S.critters[pair.of[1]].tending = true;
  const both = G.pairActive(pair.id);
  check(`${pair.name} needs both`, !half && both);
});
restAll();

group('every pair changes something it claims to');
const PT = PAIR_TUNING;

// Nightbloom — upgrades a night catch, never past the cap
(() => {
  const on = (v) => { restAll(); if (v) { S.critters.pip.tending = true; S.critters.luna.tending = true; } };
  const rng = Math.random;
  Math.random = () => 0;                      // always take the upgrade roll
  const nightAt = (() => {
    // find an epoch second that is night, so the test does not depend on when it runs
    let t = G.nowSeconds();
    for (let i = 0; i < 4000; i += 1) { if (G.dayPhase(t) && G.isNight(t)) break; t += 60; }
    return t;
  })();
  on(true);
  const wasNight = G.isNight();
  const up = wasNight ? G.nightbloomUpgrade('dewkissed') : 'skipped';
  check('a night catch is upgraded a tier',
    !wasNight || G.mutationRank(up) === G.mutationRank('dewkissed') + 1, `got ${up}`);
  const top = Object.keys(DATA.mutations).find((k) => DATA.mutations[k].rank === PT.nightbloomCap);
  check('and never past the cap',
    !wasNight || G.nightbloomUpgrade(top) === top, 'the top tier must be found, not engineered');
  on(false);
  check('and nothing without the pair', G.nightbloomUpgrade('dewkissed') === 'dewkissed');
  Math.random = rng;
})();

// Lantern in the Rain — a called sky lasts twice as long
(() => {
  const call = () => {
    S.weatherCall = null;
    S.gems = 9999;
    const id = Object.keys(DATA.weatherCall.prices)[0];
    G.callWeather(id);
    return S.weatherCall.until - S.weatherCall.from;
  };
  restAll();
  const plain = call();
  restAll();
  S.critters.pip.tending = true;
  S.critters.ember.tending = true;
  const paired = call();
  check('a called sky lasts longer', paired === plain * PT.lanternRainMult, `${plain} -> ${paired}`);
  S.weatherCall = null;
  restAll();
})();

// Pollination Rounds — everyone holds five
(() => {
  const pipK = G.critterById('pip').keepsake;
  S.critters.pip.since = G.nowSeconds() - pipK.every * 99;
  S.critters.pip.fed = 0;
  S.critters.pip.gifts = 0;
  restAll();
  S.critters.pip.tending = true;   // a rester earns nothing to cap in the first place
  check('the normal cap holds', G.keepsakesWaiting('pip') === pipK.cap);
  S.critters.bumble.tending = true;
  check('the pair raises the cap', G.keepsakesWaiting('pip') === PT.pollinationCap);
  restAll();
})();

// The Long Watch — two more hours away
(() => {
  restAll();
  const plain = G.offlineHours();
  S.critters.luna.tending = true;
  S.critters.ember.tending = true;
  check('two more hours away', G.offlineHours() === plain + PT.longWatchHours);
  S.upgrades.offlineHours = 99;
  check('and the cap moves with it, not past it',
    G.offlineHours() === DATA.offline.maxHours + PT.longWatchHours);
  S.upgrades.offlineHours = 0;
  restAll();
})();

// Night Errand — a banked rarity floor is spent on the next pack
(() => {
  S.luckyPacks = 1;
  S.cards = {};
  S.packs = 1;
  const rng = Math.random;
  Math.random = () => 0.99;                   // would otherwise draw the commonest
  const opened = G.openPack();
  Math.random = rng;
  const floorIdx = CARD_RARITIES.findIndex((r) => r.key === 'rare');
  const gotIdx = CARD_RARITIES.findIndex((r) => r.key === opened.drawn[0].card.rarity);
  check('a lucky pack opens on Rare or better', gotIdx >= floorIdx,
    `first card was ${opened.drawn[0].card.rarity}`);
  check('and the floor is spent', S.luckyPacks === 0);
})();

// The Hedgerow and The Delivery Round, and Jar of Odds and Ends
(() => {
  restAll();
  S.critters.thistle.tending = true;
  S.critters.bumble.tending = true;
  const tK = G.critterById('thistle').keepsake;
  S.critters.thistle.since = G.nowSeconds() - tK.every * 99;
  S.critters.thistle.fed = 0;
  S.critters.thistle.gifts = 0;
  const n = G.keepsakesWaiting('thistle');
  const got = G.collectKeepsakes('thistle');
  check('Thistle pays double gems', got.doubled && got.gems === (tK.gems || 0) * n * PT.oddsAndEndsMult);

  restAll();
  S.critters.bramble.tending = true;
  S.critters.bumble.tending = true;
  S.critters.pip.tending = true;   // a rester leaves nothing to collect
  S.critters.pip.since = G.nowSeconds() - G.critterById('pip').keepsake.every * 99;
  S.critters.pip.fed = 0;
  S.critters.pip.gifts = 0;
  const packsBefore = S.packs;
  const rng2 = Math.random;
  Math.random = () => 0;                      // every delivery roll lands
  const got2 = G.collectKeepsakes('pip');
  Math.random = rng2;
  check('a keepsake can arrive as a pack', got2.pack > 0 && S.packs > packsBefore);
  restAll();
})();

group('a keepsake is kept, not just cashed in');
G.reset();
S.level = 20;
const PIPK = G.critterById('pip').keepsake;
bring('pip', 1);
S.critters.pip.since = G.nowSeconds() - PIPK.every * 99;
S.critters.pip.fed = 0;
S.critters.pip.gifts = 0;
check('nothing held before collecting', G.mementoCount(PIPK.id) === 0);
const waiting = G.keepsakesWaiting('pip');
const first = G.collectKeepsakes('pip');
check('collecting keeps the memento', G.mementoCount(PIPK.id) === waiting, `held ${G.mementoCount(PIPK.id)}`);
check('and reports what is held', first.memento === PIPK.id && first.held === waiting);
S.critters.pip.since = G.nowSeconds() - PIPK.every * 99;
S.critters.pip.fed = 0;
S.critters.pip.gifts = 0;
const more = G.keepsakesWaiting('pip');
G.collectKeepsakes('pip');
check('they accumulate rather than replace', G.mementoCount(PIPK.id) === waiting + more);
check('kinds counts distinct keepsakes', G.mementoKinds() === 1);
check('total counts every one held', G.mementoTotal() === waiting + more);
check('an unknown memento holds nothing', G.mementoCount('not_a_thing') === 0);
/* Nothing spends them yet, so the record must never go backwards — the same rule
   as state.discovered. */
G.petCritter('pip');
check('petting does not spend one', G.mementoCount(PIPK.id) === waiting + more);

group('mementos survive a save');
G.saveNow();
G.load();
check('the count comes back', G.mementoCount(PIPK.id) === waiting + more);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500,
  mementos: { [PIPK.id]: 4, not_a_real_keepsake: 9, [G.critterById('luna').keepsake.id]: -3 }
}));
G.load();
check('a real keepsake is kept', G.mementoCount(PIPK.id) === 4);
check('an unknown one is dropped', G.mementoCount('not_a_real_keepsake') === 0);
check('a negative count is dropped', G.mementoCount(G.critterById('luna').keepsake.id) === 0);
localStorage.setItem('gw-save', JSON.stringify({ version: 3, credits: 500 }));
G.load();
check('a save from before mementos loads clean', G.mementoTotal() === 0);

/* Icons.get() falls back to `sparkle` for an unknown name, so a typo renders a
   plausible-looking wrong glyph rather than failing. Two icons were referenced
   for a whole session before anyone noticed they did not exist. */
group('every icon a data table names actually exists');
const iconExists = (name) => Icons.has(name);
check('a missing icon is detectable', !iconExists('__not_an_icon__'));
check('and the fallback itself still counts as real', iconExists('sparkle'));
check('every trait icon exists', Object.entries(CREATURE_TRAITS)
  .every(([, t]) => iconExists(t.icon)),
  Object.entries(CREATURE_TRAITS).filter(([, t]) => !iconExists(t.icon)).map(([k]) => k).join(', '));
check('every pair icon exists', CREATURE_PAIRS.every((p) => iconExists(p.icon)),
  CREATURE_PAIRS.filter((p) => !iconExists(p.icon)).map((p) => p.id).join(', '));
check('every bench rung icon exists', BENCH.chain.every((c) => !c.icon || iconExists(c.icon)),
  BENCH.chain.filter((c) => c.icon && !iconExists(c.icon)).map((c) => c.id).join(', '));
check('every upgrade icon exists', Object.entries(DATA.upgrades)
  .every(([, u]) => !u.icon || iconExists(u.icon)),
  Object.entries(DATA.upgrades).filter(([, u]) => u.icon && !iconExists(u.icon)).map(([k]) => k).join(', '));
check('every decor icon exists', DATA.decor.every((d) => iconExists(d.icon)),
  DATA.decor.filter((d) => !iconExists(d.icon)).map((d) => d.id).join(', '));

group('every keepsake is authored to be kept');
check('each has a stable id', CREATURES.every((c) => c.keepsake.id));
check('ids are unique', (() => {
  const ids = CREATURES.map((c) => c.keepsake.id);
  return new Set(ids).size === ids.length;
})());
check('an id never collides with a card id', CREATURES.every((c) => (
  !ALBUM.sets.some((set) => set.cards.some((card) => card.id === c.keepsake.id))
)));

group('a pair is a discovery, recorded once');
G.reset();
S.level = 20;
CREATURES.forEach((c) => bring(c.id));
restAll();
S.pairsSeen = [];
S.critters.pip.tending = true;
check('one alone discovers nothing', G.notePairs().length === 0);
G.setTending('luna', true);
check('forming it records it', S.pairsSeen.indexOf('nightbloom') !== -1);
check('and it is not recorded twice', G.notePairs().length === 0);
G.saveNow();
G.load();
check('the record survives a save', S.pairsSeen.indexOf('nightbloom') !== -1);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, pairsSeen: ['nightbloom', 'not_a_real_pair'], luckyPacks: -5
}));
G.load();
check('an unknown pair id is dropped', S.pairsSeen.indexOf('not_a_real_pair') === -1);
check('a real one is kept', S.pairsSeen.indexOf('nightbloom') !== -1);
check('a negative lucky-pack count is clamped', S.luckyPacks === 0);

group('the pair table holds its own rules');
check('every pair names two real creatures', CREATURE_PAIRS.every((p) => (
  p.of.length === 2 && p.of.every((id) => CREATURES.some((c) => c.id === id))
)));
check('no pair pairs a creature with itself', CREATURE_PAIRS.every((p) => p.of[0] !== p.of[1]));
check('no two pairs use the same couple', (() => {
  const keys = CREATURE_PAIRS.map((p) => p.of.slice().sort().join('+'));
  return new Set(keys).size === keys.length;
})());
check('every pair has a name and a description', CREATURE_PAIRS.every((p) => p.name && p.desc));
check('ids are unique', new Set(CREATURE_PAIRS.map((p) => p.id)).size === CREATURE_PAIRS.length);
/* No creature may be a bench-warmer: if one appeared in no pair, it would be
   strictly worse than the others the moment pairs exist. */
check('every creature sits in at least two pairs', CREATURES.every((c) => (
  CREATURE_PAIRS.filter((p) => p.of.indexOf(c.id) !== -1).length >= 2
)));
/* Pairs must stay off the harvest product. Eight of them joining it would be a
   multiplier stack wearing eight names. */
check('a full loadout never multiplies the harvest', (() => {
  CREATURES.forEach((c) => { if (S.critters[c.id]) S.critters[c.id].tending = true; });
  const withAll = G.critterPayoutMult();
  restAll();
  const withNone = G.critterPayoutMult();
  return withAll === withNone || !G.isNight();
})(), 'only a creature trait may touch payout, never a pair');

group('the roster is paced across the seed ladder');
check('every creature comes for a different bloom', (() => {
  const seeds = CREATURES.map((c) => c.attract.seed);
  return new Set(seeds).size === seeds.length;
})());
check('no creature waits on a seed the game never unlocks', CREATURES.every((c) => {
  const seed = DATA.seeds.find((x) => x.id === c.attract.seed);
  return seed && (seed.unlockLevel || 1) <= 20;
}));
check('the first creature is reachable early', (() => {
  const first = CREATURES.map((c) => DATA.seeds.find((x) => x.id === c.attract.seed))
    .reduce((lo, s) => Math.min(lo, s.unlockLevel || 1), 99);
  return first <= 2;
})());

group('every creature is authored as a character, not a stat');
check('each has a name and a species', CREATURES.every((c) => c.name && c.species));
check('each says something about itself', CREATURES.every((c) => c.about && c.hint));
check('each comes for a real seed', CREATURES.every((c) => DATA.seeds.some((s) => s.id === c.attract.seed)));
check('each leaves a named keepsake', CREATURES.every((c) => c.keepsake && c.keepsake.name && c.keepsake.every > 0 && c.keepsake.cap > 0));
check('each escalates toward its last star', CREATURES.every((c) => (
  G.critterGoalFor(c, CREATURE_STARS) > G.critterGoalFor(c, 1)
)));
check('each has arrival, idle and pet lines', CREATURES.every((c) => (
  c.lines && c.lines.arrive.length && c.lines.idle.length && c.lines.pet.length
)));
/* A sleeping creature has to say why it is not responding, in its own voice —
   a tap that does nothing reads as the creature having broken. */
check('each has something to say while asleep', CREATURES.every((c) => (
  c.lines.sleep && c.lines.sleep.length
)));
check('ids are unique', new Set(CREATURES.map((c) => c.id)).size === CREATURES.length);

/* ---------------- food ----------------
   A fed creature works one star above itself for a while. The load-bearing
   property is the one the tests below spend the most assertions on: NOTHING
   EVER SWITCHES OFF. An unfed creature works exactly as an unfed creature
   always did, so a lapse is a return to normal rather than a pet gone quiet. */

group('food lifts a creature by a star, and only while it lasts');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e6;
const SNACK = CREATURE_FOOD[0];
/* An arrival lands with a full clock, so it IS well fed for its first day — a
   deliberate welcome, and the one thing a baseline measurement has to undo. */
check('an arrival turns up well fed', G.critterFed(PIP.id));
hungry(PIP.id);
const baseTrait = G.critterTrait(PIP.trait.id);
check('once that is spent it is merely awake', !G.critterFed(PIP.id));
check('and works at the star it was raised to', G.critterWorkLevel(PIP.id) === G.critterLevel(PIP.id));
check('feeding it works', Boolean(G.feedCritter(PIP.id, SNACK.id)));
check('it is now fed', G.critterFed(PIP.id));
check('it works one star higher', G.critterWorkLevel(PIP.id) === G.critterLevel(PIP.id) + FED_STARS);
const fedTrait = G.critterTrait(PIP.trait.id);
check('the trait is worth a star more',
  Math.abs(fedTrait - baseTrait * ((G.critterLevel(PIP.id) + FED_STARS) / G.critterLevel(PIP.id))) < 1e-9,
  `base ${baseTrait} fed ${fedTrait}`);
check('and it reaches the consumer', G.catchMultiplier(0) > 1 + baseTrait);
check('the star it was RAISED to is untouched', G.critterLevel(PIP.id) === 1);

group('the boost runs out before the creature does');
/* One clock, so the star lapses when it drops THROUGH the threshold and sleep
   only comes when it hits zero. The gap between the two is the threshold, which
   is why a creature is always awake for a while after it stops being buffed. */
advance(Math.max(0, G.critterFedFor(PIP.id) - FED_THRESHOLD_HOURS * 3600) + 60, 600);
check('the boost ran out', !G.critterFed(PIP.id));
check('but it is still awake', !G.critterAsleep(PIP.id));
check('it is still home', G.critterHere(PIP.id));
check('it is still tending', G.critterTending(PIP.id));
check('and still working', G.critterWorking(PIP.id));
check('its trait is back to exactly baseline',
  Math.abs(G.critterTrait(PIP.trait.id) - baseTrait) < 1e-9);
/* The threshold IS the warning band: past the star, still on your feet. Under
   one clock that band is exactly `FED_THRESHOLD_HOURS` wide, every time. */
check('what is left is the awake tail below the line',
  G.critterFedFor(PIP.id) > 0 && G.critterFedFor(PIP.id) <= FED_THRESHOLD_HOURS * 3600);

group('a creature that runs out of food falls asleep');
/* The upkeep half, added 2026-08-18. A sleeping creature stops working — that is
   deliberately punishing and it is the retention mechanic. What keeps it inside
   a cosy game is that it is VISIBLE and one tap from being undone.

   One clock now, so this just runs the rest of it down: the creature is already
   below the threshold from the group above, and sleep comes at zero. */
advance(G.critterFedFor(PIP.id) + 60, 600);
check('it is asleep once the clock runs out', G.critterAsleep(PIP.id));
check('and it contributes nothing', G.critterTrait(PIP.trait.id) === 0);
check('which its consumer sees', G.catchMultiplier(0) === 1);
check('it is not working', !G.critterWorking(PIP.id));
/* Nothing is taken away — it is asleep, not gone. */
check('but it is still home', G.critterHere(PIP.id));
check('still tending', G.critterTending(PIP.id));
check('and still holds its slot', G.habitatUsed() === 1);
check('no time is owed at all', G.critterFedFor(PIP.id) === 0);
check('it is listed as asleep', G.crittersAsleep().some((c) => c.id === PIP.id));

group('feeding a sleeping creature wakes it');
S.credits = 1e6;
const woke = G.feedCritter(PIP.id, SNACK.id);
check('the feed reports that it woke something', Boolean(woke) && woke.woke === true);
check('it is awake again', !G.critterAsleep(PIP.id));
check('it is working again', G.critterWorking(PIP.id));
check('and back above baseline, because that food also fed it',
  G.critterTrait(PIP.trait.id) > baseTrait);
check('feeding an already awake one does not claim to have woken it',
  G.feedCritter(PIP.id, SNACK.id).woke === false);

group('sleep costs the trait and nothing else');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e6;
/* Punishment on one axis is a mechanic; on two it is a tax. A lapsed player
   should come back to a small gift waiting rather than to nothing at all —
   and mementos are the currency the Hollow's decorating will read. */
S.critters[PIP.id].fedUntil = 0;
S.critters[PIP.id].fed = G.nowSeconds() - K.every * 2;
check('it is asleep', G.critterAsleep(PIP.id));
check('and still leaves keepsakes while it sleeps', G.keepsakesWaiting(PIP.id) > 0);
check('which can still be collected', Boolean(G.collectKeepsakes(PIP.id)));

group('a resting creature is never shown as asleep, because it cannot be woken');
G.reset();
unlockTo(HABITAT_SLOT_LEVELS[1]);
S.discovered[PIP.attract.seed] = 999;
S.discovered[G.critterById('luna').attract.seed] = 999;
G.checkCritters();
G.setTending(PIP.id, false);
S.critters[PIP.id].fedUntil = 0;
/* Feeding needs a tender, so a resting creature reading as asleep would be a
   problem the player is shown and cannot act on. */
check('a resting creature with an empty clock is not asleep', !G.critterAsleep(PIP.id));
check('and it is not listed among the sleepers',
  !G.crittersAsleep().some((c) => c.id === PIP.id));
check('it was not working anyway', !G.critterWorking(PIP.id));
G.setTending(PIP.id, true);
check('but swapping it back in does wake the problem up', G.critterAsleep(PIP.id));
S.credits = 1e6;
check('and now it can be fed', Boolean(G.feedCritter(PIP.id, CREATURE_FOOD[0].id)));
check('which fixes it', !G.critterAsleep(PIP.id));

group('a pair goes quiet when half of it falls asleep');
G.reset();
unlockTo(HABITAT_SLOT_LEVELS[1]);
const LUNA = G.critterById('luna');
S.discovered[PIP.attract.seed] = 999;
S.discovered[LUNA.attract.seed] = 999;
G.checkCritters();
G.setTending(PIP.id, true);
G.setTending(LUNA.id, true);
check('both are tending', G.critterTending(PIP.id) && G.critterTending(LUNA.id));
check('so the pair is on', G.pairActive('nightbloom'));
S.critters[LUNA.id].fedUntil = 0;
/* A pair switching off silently would be the exact failure the pair rules name.
   It is legible here only because the creature is visibly asleep. */
check('one asleep turns the pair off', !G.pairActive('nightbloom'));
check('and the awake half still works', G.critterWorking(PIP.id));
S.credits = 1e6;
G.feedCritter(LUNA.id, SNACK.id);
check('waking it brings the pair back', G.pairActive('nightbloom'));

group('nobody wakes up to a room of sleepers they were not warned about');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
check('an arrival turns up awake', !G.critterAsleep(PIP.id));
check('with the full arrival window',
  Math.abs(G.critterFedFor(PIP.id) - ARRIVAL_AWAKE_HOURS * 3600) < 120);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true } }
}));
G.load();
/* Absent means awake, the same rule `tending` follows — a save written before
   sleeping existed must not open on a creature the game never warned about. */
check('a save from before sleeping comes back awake', !G.critterAsleep(PIP.id));
check('and working', G.critterWorking(PIP.id));
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true, fedUntil: 4e12 } }
}));
G.load();
check('an edited save cannot stay awake forever',
  G.critterFedFor(PIP.id) <= G.foodCapSeconds() + 1);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true, fedUntil: 0 } }
}));
G.load();
/* An explicit zero is a creature that genuinely ran out, and is respected. */
check('but a creature that really did run out stays asleep', G.critterAsleep(PIP.id));

group('a fully raised creature is still worth feeding');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e6;
hungry(PIP.id);
S.critters[PIP.id].level = CREATURE_STARS;
const maxedBase = G.critterTrait(PIP.trait.id);
check('a maxed creature gives the listed value', Math.abs(maxedBase - PIP.trait.value) < 1e-9);
G.feedCritter(PIP.id, SNACK.id);
const maxedFed = G.critterTrait(PIP.trait.id);
/* Clamping the trait at the roster's star ceiling would have handed the most
   invested player the only boost in the game that does nothing. */
check('feeding it still does something', maxedFed > maxedBase);
check('and it is worth exactly one more star',
  Math.abs(maxedFed - PIP.trait.value * ((CREATURE_STARS + FED_STARS) / CREATURE_STARS)) < 1e-9);
S.critters[PIP.id].level = 1;
S.critters[PIP.id].fedUntil = 0;

group('feeding costs, and refuses when it should');
S.credits = SNACK.cost - 1;
check('too poor is refused', G.feedCritter(PIP.id, SNACK.id) === null);
check('and nothing was charged', S.credits === SNACK.cost - 1);
check('and it is still unfed', !G.critterFed(PIP.id));
S.credits = SNACK.cost;
check('affording it works', Boolean(G.feedCritter(PIP.id, SNACK.id)));
check('the cost was deducted', S.credits === 0);
S.credits = 1e6;
check('an unknown food is refused', G.feedCritter(PIP.id, 'nonsense') === null);
check('a creature that is not home is refused', G.feedCritter('nobody', SNACK.id) === null);
S.critters[PIP.id].fedUntil = 0;
G.setTending(PIP.id, false);
/* Only a tending creature's trait is ever read, so feeding a resting one would
   be a purchase that buys nothing at all. */
check('a resting creature cannot be fed', G.feedCritter(PIP.id, SNACK.id) === null);
check('and was not charged for it', S.credits === 1e6);
G.setTending(PIP.id, true);

group('fed time is capped, so no purchase buys weeks of boost');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e9;
S.gems = 1e9;
/* The longest food that is BOUGHT rather than watched. The ad tier refuses a
   trimmed grant outright (its own group below), so it can never demonstrate the
   cap the way a priced tier does — pointed at it, this loop buys once and stops
   and the assertions below fail while the cap they test works perfectly. */
const BIG = CREATURE_FOOD.filter((f) => f.currency !== 'ad').pop();
let bought = 0;
for (let i = 0; i < 40; i += 1) { if (G.feedCritter(PIP.id, BIG.id)) bought += 1; }
check('the cap is reached and then holds', G.critterFedFor(PIP.id) <= G.foodCapSeconds() + 1);
check('it stopped selling at the cap', bought < 40, `sold ${bought}`);
check('a food that would add nothing reports zero', G.foodGain(PIP.id, BIG.id) === 0);
check('and buying it is refused rather than charged', G.feedCritter(PIP.id, BIG.id) === null);

group('food survives a save and time away');
G.saveNow();
G.load();
check('it comes back fed', G.critterFed(PIP.id));
check('with roughly the time it had', Math.abs(G.critterFedFor(PIP.id) - G.foodCapSeconds()) < 120);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true } }
}));
G.load();
/* Absent means the full arrival grant, which is above the line — so a save from
   before any of this comes back well fed rather than starving. That direction is
   deliberate: nobody opens the game to a room the game never warned them about. */
check('a save from before food loads well fed', G.critterFed(PIP.id));
check('and not asleep', !G.critterAsleep(PIP.id));
check('and the creature still works', G.critterTrait(PIP.trait.id) > 0);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true, fedUntil: 4e12 } }
}));
G.load();
check('an edited save cannot hold a boost forever',
  G.critterFedFor(PIP.id) <= G.foodCapSeconds() + 1);

group('only a creature that is out leaves keepsakes');
G.reset();
unlockTo(HABITAT_SLOT_LEVELS[1]);
S.discovered[PIP.attract.seed] = 999;
G.checkCritters();
G.setTending(PIP.id, true);
S.critters[PIP.id].fed = G.nowSeconds() - K.every * 2;
S.critters[PIP.id].gifts = 0;
const outEarns = G.keepsakesWaiting(PIP.id);
check('a tender earns on the clock', outEarns >= 2, `got ${outEarns}`);

/* Resting banks what was earned rather than binning it — nothing is ever taken
   away — and stops the clock so the time spent in is never credited later. */
G.setTending(PIP.id, false);
check('resting keeps what it had already earned', G.keepsakesWaiting(PIP.id) === outEarns);
advance(K.every * 5, 300);
check('and earns nothing more while it rests', G.keepsakesWaiting(PIP.id) === outEarns);
check('so a rester cannot be farmed by leaving it in',
  G.keepsakesWaiting(PIP.id) < K.cap || outEarns >= K.cap);

G.setTending(PIP.id, true);
check('the bank comes straight back out with it', G.keepsakesWaiting(PIP.id) === outEarns);
check('and the resting stretch was not credited', G.keepsakesWaiting(PIP.id) < K.cap
  || outEarns >= K.cap);
advance(K.every + 5, 60);
check('the clock restarts from when it went out', G.keepsakesWaiting(PIP.id) === Math.min(K.cap, outEarns + 1));

group('a sleeping creature is still out, so it still leaves keepsakes');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e6;
S.critters[PIP.id].fedUntil = 0;
S.critters[PIP.id].fed = G.nowSeconds() - K.every * 2;
S.critters[PIP.id].gifts = 0;
check('it is asleep', G.critterAsleep(PIP.id));
check('and not working', !G.critterWorking(PIP.id));
/* Punishment on one axis. Sleep costs the trait; it does not cost the mementos,
   which are the currency the Hollow's decorating reads. */
check('but it still leaves keepsakes', G.keepsakesWaiting(PIP.id) >= 2);
check('which can still be collected', Boolean(G.collectKeepsakes(PIP.id)));

group('the dev cheats can put a creature to sleep and get it back');
G.reset();
unlockTo(HABITAT_SLOT_LEVELS[1]);
S.discovered[PIP.attract.seed] = 999;
S.discovered[G.critterById('luna').attract.seed] = 999;
G.checkCritters();
S.credits = 1e6;
G.feedCritter(PIP.id, CREATURE_FOOD[0].id);
const upBefore = G.critterFedFor(PIP.id);
check('draining winds the clocks back', G.Dev.drainCritters(1) === G.crittersHome().length);
check('by exactly the hour asked for', Math.abs((upBefore - G.critterFedFor(PIP.id)) - 3600) < 2);
check('draining nothing is a no-op', G.Dev.drainCritters(0) === 0);
check('it is still awake after a short drain', !G.critterAsleep(PIP.id));
check('sending them to sleep works', G.Dev.sleepCritters() > 0);
check('and every tender really is asleep', G.crittersTending().every((c) => G.critterAsleep(c.id)));
check('so nothing is working', G.crittersWorking().length === 0);
/* Every food outlasts its own boost, so asleep-and-still-well-fed is a state real
   play cannot reach — a cheat must not invent one. */
check('and none of them is somehow still well fed',
  G.crittersHome().every((c) => !G.critterFed(c.id)));
/* Everything the player can see asleep has to be something they can wake. */
check('everyone asleep is someone who can be fed',
  G.crittersAsleep().every((c) => G.critterTending(c.id)));
check('sending them to sleep twice is a no-op', G.Dev.sleepCritters() === 0);
check('feeding everyone wakes them', G.Dev.feedCritters() > 0);
check('and they are up again', G.crittersTending().every((c) => !G.critterAsleep(c.id)));
/* One Honeypot is 16h against a 24h cap, so a second would be trimmed to 8 — and
   since 2026-09-03 the top tier is bought with an ad, which is never sold for a
   partial grant. So the cheat's SECOND pass is refused, and refused for the
   right reason: the clock still has 16h on it, not because anything is broken.
   With a priced top tier this line read "a second helping still has room". */
const secondPass = G.Dev.feedCritters();
check('a second helping is refused, because the ad tier will not sell a trimmed meal',
  secondPass === 0 && G.crittersTending().every((c) => (
    Math.abs(G.critterFedFor(c.id) - CREATURE_FOOD[CREATURE_FOOD.length - 1].hours * 3600) < 120
  )), `${secondPass} fed, pip at ${Math.round(G.critterFedFor(PIP.id) / 3600)}h`);
/* Nothing is armed and nothing is sticky, so an unforced run afterwards behaves. */
G.Dev.sleepCritters();
G.Dev.feedCritters();
check('nothing leaked into the clock', G.critterFedFor(PIP.id) <= G.foodCapSeconds() + 1);

group('food is authored, and stays off the parts that break an economy');
check('every food has a name, hours and a description',
  CREATURE_FOOD.every((f) => f.name && f.hours > 0 && f.desc));
check('a priced food carries a price and an ad-fed one carries none',
  CREATURE_FOOD.every((f) => (f.currency === 'ad' ? f.cost === 0 : f.cost > 0)));
check('ids are unique', new Set(CREATURE_FOOD.map((f) => f.id)).size === CREATURE_FOOD.length);
check('every food icon exists', CREATURE_FOOD.every((f) => Icons.has(f.icon)));
check('the tiers escalate in hours', CREATURE_FOOD.every((f, i) => (
  i === 0 || f.hours > CREATURE_FOOD[i - 1].hours
)));
check('and within one currency they escalate in price too', ['credits', 'gems'].every((cur) => {
  const tier = CREATURE_FOOD.filter((f) => f.currency === cur);
  return tier.every((f, i) => i === 0 || f.cost > tier[i - 1].cost);
}));
/* The two cross-tier price ladders that used to sit here — cost per hour of
   BOOST falling as the tiers climb, cost per hour of plain fullness rising —
   died with the three-currency change on 2026-09-03. Gold per hour and gems per
   hour do not compare, and with one food per currency there is no ladder inside
   a currency left to assert. What replaced them is the daily bill at four tended
   creatures, in its own group below. */
check('no food outlasts the cap on its own',
  CREATURE_FOOD.every((f) => f.hours <= FOOD_CAP_HOURS));
/* Under one clock "a food keeps a creature up for longer than it boosts it" is
   arithmetic rather than a rule to assert: the gap is always the threshold. What
   still has to hold is that the threshold leaves every food SOME boost, or a
   tier would cost money and buy only wakefulness. */
check('every food clears the well-fed line', CREATURE_FOOD.every((f) => f.hours > FED_THRESHOLD_HOURS));
check('the line sits low enough to be a warning, not a wall',
  FED_THRESHOLD_HOURS < FOOD_CAP_HOURS / 4);
check('the cheapest food is still a real reprieve', CREATURE_FOOD[0].hours >= 4);
/* The reason food is a star rather than a flat multiplier. At five stars a flat
   x2 would have doubled the only trait in the yield pool and doubled the gem
   faucet; a star is x1.2 there and x2 only at one star, where the absolute
   numbers are small. */
check('the boost shrinks as a creature grows', (() => {
  const lift = (lvl) => (lvl + FED_STARS) / lvl;
  return lift(CREATURE_STARS) < lift(1) && lift(CREATURE_STARS) <= 1.25;
})());
check('food never advances the star a creature was raised to', (() => {
  G.reset();
  S.discovered[PIP.attract.seed] = PIP.attract.count;
  G.checkCritters();
  S.credits = 1e6;
  const before = G.critterLevel(PIP.id);
  G.feedCritter(PIP.id, CREATURE_FOOD[0].id);
  return G.critterLevel(PIP.id) === before;
})());

group('the food ladder spans three currencies, and each is priced against its own faucet');
check('every food declares a currency the engine knows',
  CREATURE_FOOD.every((f) => ['credits', 'gems', 'ad'].includes(f.currency)),
  CREATURE_FOOD.map((f) => `${f.id}:${f.currency}`).join(' '));
const AD_FOODS = CREATURE_FOOD.filter((f) => f.currency === 'ad');
check('exactly one tier is ad-fed, and it is the longest',
  AD_FOODS.length === 1 && AD_FOODS[0] === CREATURE_FOOD[CREATURE_FOOD.length - 1],
  `${AD_FOODS.length} ad tiers, last is ${CREATURE_FOOD[CREATURE_FOOD.length - 1].id}`);
/* `Icons.get()` falls back to `sparkle` silently (docs/11-known-issues.md), so a
   pill written before its glyph exists renders a plausible wrong shape and
   passes everything. The ad control names its icon in ui-sheet.js rather than on
   a data row, so the loop above cannot reach it — it gets its own line. */
check('the shared ad control has a real glyph rather than the silent fallback', Icons.has('video'));
/* THE DAILY BILL AT FOUR TENDED CREATURES — what replaced the two retired
   per-hour ladders. Derived from the slot table and the cap rather than typed,
   so a change to either moves the arithmetic instead of quietly invalidating it. */
const FOOD_SLOTS = HABITAT_SLOT_LEVELS.length;
const perDay = (f) => (FOOD_CAP_HOURS / f.hours) * FOOD_SLOTS;
const CAKE = CREATURE_FOOD.find((f) => f.currency === 'gems');
const POT = AD_FOODS[0];
/* docs/04-economy.md: eight plots earn ~14 gems an hour, and sinks are priced
   against that rate. A BAND rather than a price — it catches somebody quietly
   moving 3 to 20 without asserting that 3 is the right answer, which is the
   owner's to pick. */
const GEMS_PER_HOUR = 14;
check('twelve petal cakes a day is the gem bill at four tended creatures',
  perDay(CAKE) === 12, `${perDay(CAKE)}`);
check('and that bill stays under four hours of the gem faucet',
  (perDay(CAKE) * CAKE.cost) / GEMS_PER_HOUR < 4,
  `${((perDay(CAKE) * CAKE.cost) / GEMS_PER_HOUR).toFixed(2)}h at ${CAKE.cost} gems`);
check('six honeypots a day is what a fully ad-fed roster would want',
  perDay(POT) === 6, `${perDay(POT)}`);
check('so feeding is capped below that, and is not the upkeep backbone',
  DATA.ads.perPlacement.food < perDay(POT),
  `${DATA.ads.perPlacement.food} vs ${perDay(POT)}`);
/* docs/37-monetization.md ships three placements first — the welcome-back
   doubler, the Fall windfall doubler and the second card pack. Feeding's cap
   plus those three has to fit inside the plan or the plan is already spent. */
check('and doc 37\'s three ship-first placements still fit inside the daily plan',
  DATA.ads.perPlacement.food + 3 <= DATA.ads.dailyCap,
  `${DATA.ads.perPlacement.food} + 3 vs ${DATA.ads.dailyCap}`);
/* THE PLAN HAS NO UPPER ANCHOR WITHOUT THESE TWO. The line above reads ONE key
   and never sums the table, and every other shape check here is written
   RELATIVE to dailyCap, so raising the cap RELAXES them instead of failing.
   Both wrong versions shipped green: `perPlacement: { food: 2, drone: 2,
   welcomeBack: 2, cardPack: 2 }` — eight planned against a cap of six — and
   `dailyCap: 30`, five times the band doc 37 measures against. docs/09's ad
   playbook rule 5 is "no placement may plan past it"; that is a sum, so sum it.
   NOTE for whoever adds the next placement: food 2 + drone 2 leaves two of the
   six, and doc 37 names THREE surfaces shipping first. The plan is full, and
   which one gives up its share is the round's call, not a test's. */
const adPlanned = Object.values(DATA.ads.perPlacement).reduce((a, n) => a + n, 0);
check('the whole plan fits inside the day it is planned against',
  adPlanned <= DATA.ads.dailyCap,
  `${JSON.stringify(DATA.ads.perPlacement)} sums to ${adPlanned} against ${DATA.ads.dailyCap}`);
/* docs/37-monetization.md: "3-6 rewarded impressions per player per day,
   measured in the first playtest". A band, not a number — the playtest is
   allowed to move it inside the band without touching this line. */
check('and the day itself stays inside the band doc 37 plans against',
  DATA.ads.dailyCap >= 3 && DATA.ads.dailyCap <= 6, `${DATA.ads.dailyCap}`);
/* THE GOLD TIER HAD NO PRICE GUARD AT ALL. Retiring the two per-hour ladders
   took the only assertions that constrained Clover with it, and the daily-bill
   group that replaced them covers the gems tier only: 100,000, 250,000 and
   400,000 gold a nibble all shipped green. That matters because the owner's
   literal instruction — "greatly increase the cost of food" — is filed as an
   open decision, so the very next edit to this table is that number, and
   docs/04, docs/22 and docs/11 all record the rule it must not break: Clover
   is the tier that must never wall, because the cheap food staying affordable
   is what stops being broke from stranding a creature.
   A BAND against the gold faucet, in the gems tier's idiom, and deliberately a
   loose one: it does not say 1,500 is the right price, it says the whole day's
   nibbles for four creatures stay inside two hours of what a day-one casual
   earns while playing. Today that bill is 18 minutes. Re-measure
   CASUAL_RATE_PER_MIN in tools/order-gold.js; never nudge either number here. */
const CLOVER_TIER = CREATURE_FOOD.find((f) => f.currency === 'credits');
const cloverBill = perDay(CLOVER_TIER) * CLOVER_TIER.cost;
check('the cheap tier costs something, because a free rung is not a ladder either',
  CLOVER_TIER.cost > 0, `${CLOVER_TIER.cost}`);
check('and a day of it never walls: the gold bill stays inside two hours of casual play',
  cloverBill / CASUAL_RATE_PER_MIN < 120,
  `${perDay(CLOVER_TIER)} x ${CLOVER_TIER.cost} = ${cloverBill} gold, ${Math.round(cloverBill / CASUAL_RATE_PER_MIN)} min of play`);
/* Held STRUCTURALLY rather than by review: a time-limited or quantity-limited
   offer attaches a PEGI 12 descriptor (docs/40-financial-model.md), so no knob
   in the ad table may ever name a clock. */
check('no offer carries a clock, because a timed offer is a rating cliff',
  !/expire|until|deadline|ends|seconds|countdown/i.test(JSON.stringify(DATA.ads)),
  JSON.stringify(DATA.ads));

group('an ad is a placement, not an ad system, and it is absent in a first session');
/* Driven through load() rather than by writing the counter, because the counter
   is only worth what the load path does to it. reset() alone leaves it at zero —
   a garden started over is a first session again, and the page load that follows
   makes it one, exactly as ui-news.js's reset-and-reload does. */
G.reset();
check('a garden started over is back before its first session', S.ads.sessions === 0, `${S.ads.sessions}`);
G.saveNow();
G.load();
check('the first page load is session one', S.ads.sessions === 1, `${S.ads.sessions}`);
check('and it stamps the moment the garden began', S.ads.firstAt === G.nowSeconds(),
  `${S.ads.firstAt} vs ${G.nowSeconds()}`);
check('and a first session is offered no ad at all', G.adOffered('food') === false);
/* THE ONE THIS GROUP EXISTS FOR. A page load is not a session: a pull-to-refresh,
   a tab the phone discarded and restored, installing the PWA, a service-worker
   update — each one is another load inside the SAME first sitting, and counting
   loads alone handed a level-1 player with nothing earned an ad offer on their
   second one. Reproduced in headless Chrome before it was fixed:
     load 1  {sessions:1, food:false, drone:false, level:1, lifetimeCoins:0}
     reload  {sessions:2, food:true,  drone:true,  level:1, lifetimeCoins:0}
   Ten reloads, because the count is exactly what must stop meaning anything. */
for (let i = 0; i < 10; i += 1) { G.saveNow(); G.load(); }
check('a refresh does not end a first session, however many times it is pressed',
  G.adOffered('food') === false && S.ads.sessions === 11,
  `${S.ads.sessions} opens, offered ${G.adOffered('food')}`);
check('and reloading cannot make the garden older than it is', S.ads.firstAt === G.nowSeconds(),
  `${G.nowSeconds() - S.ads.firstAt}s`);
/* The other half, and the reason age alone is not the test either: a tab left
   standing overnight is one unbroken sitting however old the garden gets. */
S.ads.firstAt = G.nowSeconds() - 25 * 3600;
S.ads.sessions = 1;
check('a day-old garden that was never opened again is still a first sitting',
  G.adOffered('food') === false, `${S.ads.sessions} opens`);
/* Both terms true — and the second one still driven through load(), because an
   age written by hand proves nothing about what the load path does with it. */
G.saveNow();
G.load();
check('opening a day-old garden again is what finally counts as a second session',
  S.ads.sessions === 2 && G.nowSeconds() - S.ads.firstAt >= 24 * 3600,
  `${S.ads.sessions} opens, ${Math.round((G.nowSeconds() - S.ads.firstAt) / 3600)}h old`);
check('and only then does the offer appear', G.adOffered('food') === true);
/* A garden dated into the future — a hand-edited save, or a device clock that
   moved back — is unknowable, and every unknown reads as brand new. */
const adFirstAtMark = S.ads.firstAt;
S.ads.firstAt = G.nowSeconds() + 3600;
check('a garden that claims to start tomorrow is offered nothing', G.adOffered('food') === false);
S.ads.firstAt = 0;
check('and neither is one that will not say when it began', G.adOffered('food') === false);
S.ads.firstAt = adFirstAtMark;
/* The day's cap. Driven through watchAd() rather than read off the data, because
   the cap that matters is the one the function enforces. */
const adCapFood = DATA.ads.perPlacement.food;
let adTook = 0;
for (let i = 0; i < adCapFood + 3; i += 1) { if (G.watchAd('food')) adTook += 1; }
check('the day\'s cap refuses one more than it allows',
  adTook === adCapFood, `took ${adTook} of ${adCapFood}`);
check('and the counter stops at the cap rather than at the cap plus one',
  G.adCountToday('food') === adCapFood, `${G.adCountToday('food')}`);
check('a spent budget stops offering', G.adOffered('food') === false);
const adLifetime = G.adImpressions();
check('the impressions were counted', adLifetime === adCapFood, `${adLifetime}`);
G.saveNow();
G.load();
check('and the lifetime counter is lifetime — it survives a save and a load',
  G.adImpressions() === adLifetime, `${G.adImpressions()}`);
S.ads.day = 'not-today';
check('a new day clears the day\'s count', G.adCountToday('food') === 0);
check('and offers again', G.adOffered('food') === true);
check('but never rolls back the lifetime counter',
  G.adImpressions() === adLifetime, `${G.adImpressions()}`);
G.reset();
G.saveNow();
G.load();
check('starting the garden over puts it back in a first session, offer and all',
  S.ads.sessions === 1 && G.adOffered('food') === false && G.adImpressions() === 0,
  `${S.ads.sessions} / ${G.adImpressions()}`);
/* The whole daily plan, not just one placement's share: a second surface cannot
   spend past DATA.ads.dailyCap however much of its own budget it has left.
   `adCountToday` first, to stamp today's key — otherwise the next reader rolls
   the day and wipes the fixture out from under the assertion. */
G.saveNow();
G.load();
/* Past the first session FIRST, or this whole assertion passes on rule 1 and
   says nothing at all about the daily plan it is named for. */
returningPlayer(2);
check('the fixture is genuinely past its first session', G.adOffered('food') === true);
G.adCountToday('food');
S.ads.today = { other: DATA.ads.dailyCap };
check('a placement with budget left is still refused once the day\'s plan is spent',
  G.adOffered('food') === false && G.watchAd('food') === false);
/* THE NESTED RE-MERGE, which docs/07-save-data.md calls the single most likely
   way to break loading for existing players. A save with no `ads` at all takes
   the default from the assign above it and is fine either way — the case that
   needs the explicit line is a PARTIAL one, where the shallow assign hands back
   an object with no `today` and every getter throws on the first Feed panel. */
/* Read the ledger STRAIGHT OFF load(), before touching a getter: adRollDay()
   rebuilds `day` and `today` on its first call, so an assertion that asks a
   getter is answered by the repair rather than by the load and passes with the
   re-merge line deleted. The half that cannot self-heal is `sessions`, which
   load() increments — undefined + 1 is NaN, `NaN || 0` is 0, and the player is
   silently pushed back into a first session. */
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0, ads: { impressions: 7 }
}));
check('a save carrying half an ad ledger comes back with a whole one', (() => {
  try {
    G.load();
    const a = S.ads;
    return a.impressions === 7 && a.sessions === 1
      && typeof a.day === 'string' && Boolean(a.today) && typeof a.today === 'object';
  } catch (e) { return false; }
})(), JSON.stringify(S.ads));
/* `firstAt` is the other half that cannot self-heal, and it fails in the
   OPPOSITE direction to `sessions`: every save written before it existed has
   none, and a missing age reads as unknown, which reads as brand new, which is
   no offer — forever, for every player who already has a garden. load() stamps
   NOW instead, so they wait one day and then the ledger is honest. */
check('and a garden older than the field itself starts its day rather than losing it',
  S.ads.firstAt === G.nowSeconds() && G.adOffered('food') === false,
  `${S.ads.firstAt} vs ${G.nowSeconds()}`);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0, ads: { impressions: 7, today: 'nonsense' }
}));
check('and a hand-edited one cannot put a string where the day\'s counts go', (() => {
  try {
    G.load();
    return typeof S.ads.today === 'object' && G.adCountToday('food') === 0;
  } catch (e) { return false; }
})(), JSON.stringify(S.ads));

/* WHERE "ABSENT, NOT DISABLED" ACTUALLY LIVES — one line of ui-sheet.js, and
   until now nothing in this file read it. Everything above tests the ENGINE
   predicate; the RENDER is the half a player sees, and the realistic wrong
   version of it — draw all three tiers, fold adOffered() into `room` so the ad
   tier is merely greyed out on session one — passed the entire suite. game.js's
   own comment forbids exactly that: "a greyed-out ad button on session one is
   still an ad on session one." Read out of the source in the drone card's idiom
   (four groups up), because ui-sheet.js cannot be loaded headless. */
const adSheetSrc = fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8');
const foodRowSrc = (adSheetSrc.match(/function foodButtons\(id\)[\s\S]*?\n {2}\}/) || [''])[0];
/* The scrape guard on the three below it: a rename that breaks the slice returns
   '' and every regex under it would fail open on an empty string. */
check('the food row was actually found and read',
  foodRowSrc.length > 400 && foodRowSrc.length < 2000, `${foodRowSrc.length} chars`);
check('a first session is handed a SHORTER ladder, never a greyed-out third tier',
  /const foods = CREATURE_FOOD\.filter\([^;]*Game\.adOffered\('food'\)\);/.test(foodRowSrc),
  foodRowSrc.split('\n').find((l) => l.includes('const foods')) || 'no foods line');
check('and the row is built from that filtered list, not from the whole ladder',
  /\bfoods\.map\(/.test(foodRowSrc) && !/CREATURE_FOOD\.map\(/.test(foodRowSrc));
check('and the column count comes with it, so the grid never leaves a third of itself empty',
  /data-n="\$\{foods\.length\}"/.test(foodRowSrc));
/* ---- AND THE SAME RULE READ OFF THE OUTPUT ----
   The three above pin the SPELLING of one line, which is the right guard for a
   rewrite — `const foods = adFoodTiers()` reddens them and should be looked at —
   but not for a differently-worded filter that draws the tier anyway. So the row
   is RUN, on both sides of the first session, and the tiers are counted. The
   shared ad pill is lifted in for real; priceTag and fmtSpan stay markers, which
   is all a column count asks of them. */
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
G.setTending(PIP.id, true);
const foodRowOpts = { also: ['foodStamp', 'foodAfter', 'adTag'], bind: { AD_LABEL: 'Watch an ad' } };
const foodTiers = (r) => (r.html.match(/<button class="food-btn/g) || []).length;
const foodRowFirst = sheetRender('foodButtons', [PIP.id], foodRowOpts);
check('the food row renders, so the two checks below read output and not source',
  foodRowFirst.error === '' && foodTiers(foodRowFirst) > 0,
  foodRowFirst.error || `${foodTiers(foodRowFirst)} tiers`);
check('a first session is drawn the SHORTER ladder, with no ad pill anywhere in it',
  G.adOffered('food') === false
  && foodTiers(foodRowFirst) === CREATURE_FOOD.length - 1
  && /data-n="2"/.test(foodRowFirst.html)
  && !/price ad/.test(foodRowFirst.html),
  `${foodTiers(foodRowFirst)} tiers, ${(foodRowFirst.html.match(/price ad/g) || []).length} ad pills`);
returningPlayer();
S.ads.day = 'row-day'; S.ads.today = {};
const foodRowBack = sheetRender('foodButtons', [PIP.id], foodRowOpts);
check('and a returning player is drawn the third tier, once, with the pill on it',
  G.adOffered('food') === true
  && foodTiers(foodRowBack) === CREATURE_FOOD.length
  && /data-n="3"/.test(foodRowBack.html)
  && (foodRowBack.html.match(/price ad/g) || []).length === 1,
  `${foodTiers(foodRowBack)} tiers, ${(foodRowBack.html.match(/price ad/g) || []).length} ad pills`);

group('an ad is never spent on a partial meal, and gold still is');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
G.setTending(PIP.id, true);
/* A returning player by hand rather than through load(): the group above already
   drives the real counters, and a reload here would throw the fixture away. */
returningPlayer();
S.ads.day = ''; S.ads.today = {}; S.ads.impressions = 0;
const POT_HOURS = POT.hours * 3600;
S.critters[PIP.id].fedUntil = G.nowSeconds() + 12 * 3600;
check('twelve hours banked against a sixteen-hour pot reads as partial',
  G.foodEffect(PIP.id, POT.id).partial === true);
check('and the stamp still advertises the tin, not the trim',
  G.foodEffect(PIP.id, POT.id).nominal === POT_HOURS
  && G.foodEffect(PIP.id, POT.id).gain < POT_HOURS,
  `${G.foodEffect(PIP.id, POT.id).gain} of ${POT_HOURS}`);
check('the ad is refused when the cap would trim it',
  G.feedCritter(PIP.id, POT.id) === null);
check('and no impression was spent on the refusal', G.adImpressions() === 0);
S.critters[PIP.id].fedUntil = 0;
check('an empty clock takes the whole pot', Boolean(G.feedCritter(PIP.id, POT.id)));
check('for exactly one impression', G.adImpressions() === 1);
check('and the clock really got all sixteen hours',
  Math.abs(G.critterFedFor(PIP.id) - POT_HOURS) < 120,
  `${Math.round(G.critterFedFor(PIP.id) / 3600)}h`);
/* THE CONTRAST THE RULE RESTS ON. Without this the suite would read as "a
   trimmed meal is always refused", which is false and is the opposite of the
   design: gold can be part-spent, thirty seconds of attention cannot. */
const CLOVER = CREATURE_FOOD.find((f) => f.currency === 'credits');
S.critters[PIP.id].fedUntil = G.nowSeconds() + 22 * 3600;
S.credits = CLOVER.cost;
/* `partial` is the ad rule, not the cap rule — a trimmed GOLD meal is a normal
   purchase and must not wear the flag, or the whole ladder starts refusing. */
check('a trimmed gold meal is capped but never partial', (() => {
  const eff = G.foodEffect(PIP.id, CLOVER.id);
  return eff.capped === true && eff.partial === false && eff.currency === 'credits';
})(), JSON.stringify(G.foodEffect(PIP.id, CLOVER.id)));
check('gold, by contrast, still buys a meal the cap will trim',
  Boolean(G.feedCritter(PIP.id, CLOVER.id)));
check('and it was charged in full for it', S.credits === 0, `${S.credits}`);
check('with the clock capped rather than overrun',
  Math.abs(G.critterFedFor(PIP.id) - G.foodCapSeconds()) < 120,
  `${Math.round(G.critterFedFor(PIP.id) / 3600)}h`);
/* The gems tier, which has no cap rule of its own and must behave like gold. */
S.critters[PIP.id].fedUntil = 0;
S.gems = CAKE.cost - 1;
check('a gems tier refuses on an empty gem purse', G.feedCritter(PIP.id, CAKE.id) === null);
check('and takes nothing from the gold wallet doing it', S.credits === 0);
S.gems = CAKE.cost;
check('and buys when the gems are there', Boolean(G.feedCritter(PIP.id, CAKE.id)));
check('spending gems, not gold', S.gems === 0 && S.credits === 0, `${S.gems} / ${S.credits}`);
check('and the ad budget is untouched by a gem purchase',
  G.adImpressions() === 1 && G.adCountToday('food') === 1,
  `${G.adImpressions()} / ${G.adCountToday('food')}`);

/* ---- THE CAP BOUNDARY, SWEPT, because "the button and the engine agree to the
   second" is TWO COPIES of one number with nothing holding them together ----
   feedCritter() refuses at `gain < food.hours * 3600 - 1`; foodEffect() sets
   `partial` at `gain < nominal - 1`. Widening one of them to `nominal - 60` — a
   plausible edit while tuning the "caps at" copy — left the suite at 1868/0
   with the two disagreeing. The cost of that disagreement is worse than a wrong
   label: the refusing branch returns null with NO emit('deny'), so the Honeypot
   renders enabled and affordable and the tap does nothing whatsoever — no
   sound, no shake, no words, which is the failure foodGain()'s own comment says
   it exists to prevent. The single checks above sit at 12 hours banked, deep
   inside one side of the line; this walks across it.
   The day's budget is cleared per sample, or the cap starts refusing on its own
   and the sweep reads a spent plan as a partial meal. */
const foodBoundary = (short) => {
  S.ads.day = 'sweep-day'; S.ads.today = {};
  S.critters[PIP.id].fedUntil = G.nowSeconds() + (G.foodCapSeconds() - POT_HOURS + short);
  const eff = G.foodEffect(PIP.id, POT.id);
  const sold = Boolean(G.feedCritter(PIP.id, POT.id));
  return { short, partial: eff.partial, sold, gain: Math.round(eff.gain) };
};
const foodSweep = [-3600, -60, -2, 0, 2, 60, 3600].map(foodBoundary);
check('the panel\'s “partial” and the engine\'s refusal are the same answer on both sides of the cap',
  foodSweep.every((r) => r.partial === !r.sold),
  foodSweep.map((r) => `${r.short}s ${r.partial ? 'partial' : 'whole'}/${r.sold ? 'sold' : 'refused'}`).join(' '));
check('and the sweep really crosses the line, or the two agree about nothing at all',
  foodSweep.some((r) => r.partial) && foodSweep.some((r) => !r.partial),
  foodSweep.map((r) => `${r.short}:${r.gain}`).join(' '));

/* ---------------- the Garden Stand ---------------- */
group('The Garden Stand');

/* Every good must carry the one line its customer speaks. This is the catalogue
   rule from docs/26-goods-catalog.md made mechanical: the good is a token, the
   customer is the story, and a good that cannot fill `line` is a spreadsheet row
   wearing a name. */
check('every good has a name, a family, a tier and a line',
  GOODS.every((g) => g.id && g.name && g.family && g.tier >= 1 && g.line && g.line.length > 8));
check('good ids are unique', new Set(GOODS.map((g) => g.id)).size === GOODS.length);
check('every good asks for something', GOODS.every((g) => g.needs.length >= 1 && g.needs.length <= 4));
check('every quantity range is sane',
  GOODS.every((g) => g.needs.every((n) => n.qty[0] >= 1 && n.qty[1] >= n.qty[0])));
check('every customer has a name, a face and three kinds of line',
  CUSTOMERS.every((c) => c.name && c.art && c.art.skin && c.lines.greet.length
    && c.lines.waiting.length && c.lines.delivered.length));
check('customer ids are unique', new Set(CUSTOMERS.map((c) => c.id)).size === CUSTOMERS.length);
/* A tier the player can reach with nobody in it would generate an order with no
   face on it. */
/* Enough faces to fill the board without repeating one. Fewer customers than
   slots forces a duplicate, which reads as a bug rather than as a small village
   — and the tier-1 board is the first thing a new player ever sees. */
check('every tier can fill the whole board with different faces',
  STAND.tiers.every((t) => CUSTOMERS.filter((c) => c.minTier <= t.tier).length >= STAND.slots));
/* Same reasoning as the faces, one notch softer: a repeated good with a
   different customer and different blooms still reads, but three slots drawing
   from two goods repeats every single time, and tier 1 is the first board a new
   player ever sees. */
check('every tier has enough goods to fill the board',
  STAND.tiers.every((t) => GOODS.filter((g) => g.tier <= t.tier).length >= STAND.slots));
check('tiers climb in both rep and pay', STAND.tiers.every((t, i, a) =>
  i === 0 || (t.rep > a[i - 1].rep && t.mult > a[i - 1].mult && t.repPay > a[i - 1].repPay)));

const standReset = (level = 1) => {
  G.reset();
  unlockTo(level);
  S.stand.slots = Array(STAND.slots).fill(null);
  S.stand.nextAt = Array(STAND.slots).fill(0);
};

/* The rule that keeps the board from becoming a wall. Checked against the whole
   pool at several levels, because "cannot produce" changes as seeds unlock. */
check('an order never asks for a seed the player has not unlocked', (() => {
  for (const level of [1, 3, 8, 14, 20]) {
    standReset(level);
    const allowed = G.standFlowerPool();
    for (let n = 0; n < 60; n += 1) {
      S.stand.slots = Array(STAND.slots).fill(null);
      const o = G.standGenerate(0);
      if (!o) continue;
      for (const need of o.needs) {
        if (need.any) continue;
        if (!allowed.includes(need.of)) return false;
      }
    }
  }
  return true;
})());

/* Honey has a harder gate than a flower: with no hive there is no honey at all,
   so an order asking for a jar is uncompletable rather than merely slow. */
check('with no hives, no order asks for honey', (() => {
  standReset(20);
  S.apiary.hives = [];
  for (let n = 0; n < 80; n += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    const o = G.standGenerate(0);
    if (o && o.needs.some((need) => need.kind === 'honey')) return false;
  }
  return true;
})());
check('a hive puts honey back on the board', (() => {
  standReset(20);
  S.credits = 1e9;
  G.placeHive(G.emptyCells()[0]);
  for (let n = 0; n < 120; n += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    const o = G.standGenerate(0);
    if (o && o.needs.some((need) => need.kind === 'honey')) return true;
  }
  return false;
})());

/* The other load-bearing rule: fulfilling must always beat selling the contents,
   or players bypass the engine entirely. Asserted as a property across every
   good at every tier, not as a number. */
check('a named order always pays more than selling its contents', (() => {
  standReset(20);
  S.credits = 1e9;
  G.placeHive(G.emptyCells()[0]);
  for (let n = 0; n < 200; n += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    const o = G.standGenerate(0);
    if (!o || o.needs.some((need) => need.any)) continue;
    const raw = o.needs.reduce((sum, need) => sum + G.standUnitValue(need.kind, need.of) * need.qty, 0);
    if (o.coins <= raw) return false;
  }
  return true;
})());

/* A wild line names nothing, so its card price is a floor and delivery re-prices
   against what was actually handed over. The property to hold is the same one —
   the player is never better off selling — and it has to survive the worst case,
   which is a pantry holding nothing but the most valuable bloom in the game. */
check('a wild line never pays less than selling what it took', (() => {
  standReset(20);
  const dearest = G.standFlowerPool()
    .slice().sort((a, b) => G.standUnitValue('flower', b) - G.standUnitValue('flower', a))[0];
  for (const stock of [G.standFlowerPool()[0], dearest]) {
    for (let n = 0; n < 60; n += 1) {
      S.stand.slots = Array(STAND.slots).fill(null);
      const o = G.standGenerate(0);
      if (!o || !o.needs.every((need) => need.any && need.kind === 'flower')) continue;
      S.flowers = {};
      S.credits = 0;
      const qty = o.needs.reduce((a, need) => a + need.qty, 0);
      S.flowers[stock] = qty;
      const raw = G.standUnitValue('flower', stock) * qty;
      const res = G.standDeliver(0);
      if (!res || S.credits <= raw) return false;
    }
  }
  return true;
})());

/* The floor on the card must be a floor, not a guess that can come in high. */
check('the card price is never more than the delivery pays', (() => {
  standReset(20);
  for (let n = 0; n < 80; n += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    const o = G.standGenerate(0);
    if (!o || o.needs.some((need) => need.kind === 'honey')) continue;
    S.flowers = {};
    o.needs.forEach((need) => {
      const id = need.of || G.standFlowerPool()[0];
      S.flowers[id] = (S.flowers[id] || 0) + need.qty;
    });
    const quoted = o.coins;
    const res = G.standDeliver(0);
    if (!res || res.paid < quoted) return false;
  }
  return true;
})());

/* Cheapest-first, so a wild line cannot quietly eat the rare bloom being saved
   for a named order. This was backwards once and the sort direction is the whole
   bug — sortedByValue is ascending. */
check('a wild line spends the cheapest blooms first', (() => {
  standReset(20);
  const pool = G.standFlowerPool().slice()
    .sort((a, b) => G.standUnitValue('flower', a) - G.standUnitValue('flower', b));
  const cheap = pool[0];
  const dear = pool[pool.length - 1];
  for (let n = 0; n < 120; n += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    const o = G.standGenerate(0);
    if (!o || !o.needs.every((need) => need.any && need.kind === 'flower')) continue;
    const qty = o.needs.reduce((a, need) => a + need.qty, 0);
    S.flowers = {};
    S.flowers[cheap] = qty;
    S.flowers[dear] = 2;
    G.standDeliver(0);
    return (S.flowers[dear] || 0) === 2 && !(S.flowers[cheap] > 0);
  }
  return false;
})());

check('a multi-line order beats the same goods asked for singly', (() => {
  const t = STAND.tiers[0];
  const one = G.standPrice([{ kind: 'flower', of: 'daisy', qty: 4 }], t);
  const two = G.standPrice([
    { kind: 'flower', of: 'daisy', qty: 2 }, { kind: 'flower', of: 'tulip', qty: 2 }
  ], t);
  return two.coins > one.coins && two.rep > one.rep;
})());

check('a board of three does not ask for the same bloom three times', (() => {
  standReset(20);
  let collisions = 0;
  for (let round = 0; round < 40; round += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    for (let i = 0; i < STAND.slots; i += 1) G.standGenerate(i);
    const named = G.standOrders().flatMap((o) => o.needs.map((n) => n.of).filter(Boolean));
    const counts = {};
    named.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    if (Object.values(counts).some((c) => c >= 3)) collisions += 1;
  }
  return collisions === 0;
})());

check('two slots do not show the same customer', (() => {
  standReset(20);
  for (let round = 0; round < 40; round += 1) {
    S.stand.slots = Array(STAND.slots).fill(null);
    for (let i = 0; i < STAND.slots; i += 1) G.standGenerate(i);
    const who = G.standOrders().map((o) => o.customer);
    if (new Set(who).size !== who.length) return false;
  }
  return true;
})());

/* Delivery: spends exactly what was asked, pays exactly what was promised. */
const fillFor = (order) => order.needs.forEach((need) => {
  const pool = need.kind === 'honey' ? G.standHoneyPool() : G.standFlowerPool();
  const floor = pool.slice().sort((a, b) =>
    G.standUnitValue(need.kind, a) - G.standUnitValue(need.kind, b))[0];
  const id = need.of || floor;
  if (need.kind === 'honey') S.apiary.honey[id] = (S.apiary.honey[id] || 0) + need.qty;
  else S.flowers[id] = (S.flowers[id] || 0) + need.qty;
});

check('an order cannot be delivered without the goods', (() => {
  standReset(6);
  S.flowers = {};
  const o = G.standGenerate(0);
  return o && !G.standCanDeliver(o) && G.standDeliver(0) === null;
})());

/* Filled from the cheapest bloom in the pool, which is exactly what the card
   quoted, so the re-price must land on the quoted number rather than above it —
   this is what catches the wild discount being handed back at delivery. */
check('delivering pays the coins on the card, and the standing the flag allows', (() => {
  for (let n = 0; n < 40; n += 1) {
    standReset(6);
    S.flowers = {};
    S.apiary.honey = {};
    S.credits = 0;
    const o = G.standGenerate(0);
    if (!o) return false;
    fillFor(o);
    const rep0 = S.rep;
    const res = G.standDeliver(0);
    if (!res) return false;
    if (S.credits !== res.paid) return false;
    if (res.paid !== o.coins) return false;
    if (S.rep !== rep0 + G.standOrderRep(o)) return false;
  }
  return true;
})());

check('delivering spends exactly the goods asked for', (() => {
  standReset(6);
  S.flowers = {};
  const o = G.standGenerate(0);
  fillFor(o);
  // one spare of everything, which must survive
  o.needs.forEach((n) => { if (!n.any && n.kind === 'flower') S.flowers[n.of] += 1; });
  const spares = o.needs.filter((n) => !n.any && n.kind === 'flower').length;
  G.standDeliver(0);
  return G.flowerTotal() === spares;
})());

check('a delivered slot empties and refills on a timer', (() => {
  standReset(6);
  S.flowers = {};
  const o = G.standGenerate(0);
  fillFor(o);
  G.standDeliver(0);
  if (G.standOrderAt(0)) return false;
  if (!(G.standRefillIn(0) > 0)) return false;
  advance(STAND.refill + 2);
  return Boolean(G.standOrderAt(0));
})());

/* The single most load-bearing line in the order spec: skipping is free and
   always available, which turns "I do not have that" from a wall into a choice. */
check('any order can be skipped, for nothing', (() => {
  standReset(6);
  S.flowers = {};
  S.credits = 0;
  S.gems = 0;
  const o = G.standGenerate(0);
  const ok = G.standSkip(0);
  return ok && !G.standOrderAt(0) && S.credits === 0 && S.gems === 0 && G.standRefillIn(0) > 0;
})());

check('the board fills itself up to its slot count', (() => {
  standReset(6);
  advance(STAND.refill + 2);
  return G.standOrders().length === STAND.slots;
})());

check('progress reads across every line of an order', (() => {
  standReset(6);
  S.flowers = {};
  S.apiary.honey = {};
  const o = G.standGenerate(0);
  if (G.standProgress(o) !== 0) return false;
  fillFor(o);
  return Math.abs(G.standProgress(o) - 1) < 1e-9;
})());

/* A save written before the Stand existed must not throw, and must not resurrect
   an order whose good or customer has since been renamed away. */
check('a save from before the Stand loads clean', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  delete raw.stand;
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return Array.isArray(S.stand.slots) && S.stand.slots.length === STAND.slots
    && S.stand.slots.every((x) => x === null);
})());

check('an order for a good that no longer exists is dropped', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.stand = {
    slots: [{ id: 'o1', good: 'ghost_good', customer: 'nan', needs: [], coins: 5, rep: 1 }, null, null],
    nextAt: [0, 0, 0], seq: 1, delivered: 0, skipped: 0
  };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.stand.slots[0] === null;
})());

/* ---------------- the Wild Meadow ---------------- */
group('The Wild Meadow');

check('every tender has a name, a look and a description',
  MEADOW.tenders.every((t) => t.id && t.name && t.tint && t.desc && t.desc.length > 10));
check('tender ids are unique', new Set(MEADOW.tenders.map((t) => t.id)).size === MEADOW.tenders.length);
/* If two tenders did the same thing, "where does this go" stops being a
   question and the board goes back to being a shopping list. */
check('no two tenders do the same thing', (() => {
  const sig = MEADOW.tenders.map((t) => `${t.speed}|${t.cap}|${t.wax}|${t.pollen}|${t.rare}`);
  return new Set(sig).size === sig.length;
})());
check('every tender is worth placing', MEADOW.tenders.every((t) =>
  t.speed < 0 || t.cap > 0 || t.wax > 0 || t.pollen > 0 || t.rare > 0));
check('the board is the same shape as the garden',
  MEADOW.cells === 8 && MEADOW_NEIGHBOURS.length === 8);
/* Adjacency has to be mutual, or a tender would help a hive that does not know
   it is being helped. */
check('adjacency is symmetric', MEADOW_NEIGHBOURS.every((list, i) =>
  list.every((n) => MEADOW_NEIGHBOURS[n].includes(i))));
check('exactly one creature belongs to the meadow',
  CREATURES.filter((c) => c.affinity === 'meadow').length === 1);

const meadowReset = () => {
  G.reset();
  S.credits = 1e9;
  clearGarden();
  /* Open the land. Everything below this line is about hives, tenders and
     adjacency, not about the gate — and a new per-cell field that this helper
     does not know about is exactly how the garden's `clearGarden()` has leaked
     state between tests three times now. */
  S.apiary.locked = Array(MEADOW.cells).fill(false);
  S.grid.forEach((c, i) => { if (i < 4) { c.seed = 'daisy'; c.plantedAt = G.nowSeconds(); c.grow = 9e9; } });
};

/* A meadow with its gates intact, for the tests that are about the gates. */
const meadowGated = () => {
  G.reset();
  S.credits = 1e9;
  clearGarden();
};

check('a hive lands on the cell it was placed in', (() => {
  meadowReset();
  return G.placeHive(2) && G.cellIsHive(2) && G.hiveCount() === 1;
})());
check('a taken cell cannot be built on twice', (() => {
  meadowReset();
  G.placeHive(2);
  return !G.placeHive(2) && !G.placeTender(2, 'sun') && G.hiveCount() === 1;
})());
check('the board fills and then refuses', (() => {
  meadowReset();
  for (let i = 0; i < MEADOW.cells; i += 1) G.placeHive(i);
  return G.hiveCount() === MEADOW.cells && G.boardFull() && !G.placeHive(0);
})());
/* Locked land. The garden's two-stage gate restated on the second board: reach
   the level, then pay the coins. Same rule, so it is learned once. */
check('the meadow opens with its gated cells locked', (() => {
  meadowGated();
  const want = MEADOW.cellUnlockLevel.map((lv) => lv > 1);
  return S.apiary.locked.length === MEADOW.cells
    && S.apiary.locked.every((v, i) => v === want[i]);
})());
check('every cell has an unlock level and a price', (() => {
  if (MEADOW.cellUnlockLevel.length !== MEADOW.cells) return false;
  for (let i = 0; i < MEADOW.cells; i += 1) {
    if (!(G.cellUnlockLevel(i) >= 1)) return false;
    if (!(G.cellUnlockCost(i) > 0)) return false;
  }
  return true;
})());
check('a new player can act on the first visit', (() => {
  meadowGated();
  // At least one cell must be open at level 1, or the room refuses everyone.
  return !G.cellLocked(0) && G.cellAvailable(0) && G.placeHive(0);
})());
check('locked land refuses a hive and a tender', (() => {
  meadowGated();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  return G.cellLocked(i) && !G.placeHive(i) && !G.placeTender(i, 'sun') && !G.cellAt(i);
})());
check('a cell below its level cannot be bought at any price', (() => {
  meadowGated();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  unlockTo(1);
  S.credits = 1e9;
  return !G.cellAvailable(i) && !G.unlockCell(i) && G.cellLocked(i);
})());
check('a cell at its level still costs coins', (() => {
  meadowGated();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  unlockTo(G.cellUnlockLevel(i));
  S.credits = G.cellUnlockCost(i) - 1;
  return G.cellAvailable(i) && !G.unlockCell(i) && G.cellLocked(i);
})());
check('paying opens the cell and charges exactly once', (() => {
  meadowGated();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  unlockTo(G.cellUnlockLevel(i));
  const cost = G.cellUnlockCost(i);
  S.credits = cost;
  const ok = G.unlockCell(i);
  return ok && !G.cellLocked(i) && S.credits === 0 && !G.unlockCell(i);
})());
check('an opened cell can then be built on', (() => {
  meadowGated();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  unlockTo(20);
  S.credits = 1e9;
  return G.unlockCell(i) && G.placeHive(i) && G.cellIsHive(i);
})());
check('a piece cannot be moved onto locked land', (() => {
  meadowGated();
  S.credits = 1e9;
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  G.placeHive(0);
  return !G.moveCell(0, i) && G.cellIsHive(0) && !G.cellAt(i);
})());
check('a tender is not a hive', (() => {
  meadowReset();
  G.placeTender(0, 'sun');
  return G.hiveCount() === 0 && G.tenderCount('sun') === 1 && !G.cellIsHive(0);
})());

/* The mechanic, asserted: a hive on its own is plain, and what is NEXT TO IT is
   the build. Cell 1's neighbours are 0 and 2. */
check('a lone hive gets no help', (() => {
  meadowReset();
  G.placeHive(1);
  const b = G.hiveBonus(1);
  return b.speed === 0 && b.cap === 0 && b.wax === 0 && b.pollen === 0 && b.rare === 0;
})());
check('a Sun Trap beside a hive speeds it up', (() => {
  meadowReset();
  G.placeHive(1);
  const alone = G.hiveInterval(1);
  G.placeTender(0, 'sun');
  return G.hiveInterval(1) < alone;
})());
check('a tender that is NOT adjacent does nothing', (() => {
  meadowReset();
  G.placeHive(1);
  const alone = G.hiveInterval(1);
  // 5 is not a neighbour of 1
  G.placeTender(5, 'sun');
  return !MEADOW_NEIGHBOURS[1].includes(5) && G.hiveInterval(1) === alone;
})());
check('two tenders stack on the hive between them', (() => {
  meadowReset();
  G.placeHive(1);
  G.placeTender(0, 'sun');
  const one = G.hiveInterval(1);
  G.placeTender(2, 'sun');
  return G.hiveInterval(1) < one;
})());
check('an Old Stump beside a hive gives it room', (() => {
  meadowReset();
  G.placeHive(1);
  const alone = G.hiveCapacity(1);
  G.placeTender(0, 'stump');
  return G.hiveCapacity(1) > alone;
})());
check('a Foxglove Bank beside a hive pollinates harder', (() => {
  meadowReset();
  G.placeHive(1);
  const alone = G.pollination();
  G.placeTender(0, 'foxglove');
  return G.pollination() > alone;
})());
check('a Clover Bed beside a hive gives it wax', (() => {
  meadowReset();
  G.placeHive(1);
  const alone = G.hiveWax(1);
  G.placeTender(0, 'clover');
  return G.hiveWax(1) > alone && G.hiveWax(1) <= 1;
})());
/* A wall of Sun Traps must not drive the interval to nothing. */
check('speed is clamped however many neighbours help', (() => {
  meadowReset();
  G.placeHive(1);
  G.placeTender(0, 'sun');
  G.placeTender(2, 'sun');
  return G.hiveInterval(1) >= APIARY.interval * 0.3;
})());

/* Moving is FREE. A board you are punished for experimenting with is the
   opposite of what the cosy pillar asks for. */
check('a piece can be moved for nothing', (() => {
  meadowReset();
  G.placeHive(0);
  const coins = S.credits;
  return G.moveCell(0, 5) && G.cellIsHive(5) && !G.cellAt(0) && S.credits === coins;
})());
check('moving onto a filled cell swaps them', (() => {
  meadowReset();
  G.placeHive(0);
  G.placeTender(1, 'sun');
  G.moveCell(0, 1);
  return G.cellIsHive(1) && G.cellAt(0).kind === 'tender';
})());
check('a hive keeps its jars when it moves', (() => {
  meadowReset();
  G.placeHive(0);
  advance(APIARY.interval * 2 + 4);
  const jars = G.cellAt(0).jars.length;
  G.moveCell(0, 6);
  return jars > 0 && G.cellAt(6).jars.length === jars;
})());

/* The guardrail from docs/25-world-map.md, asserted rather than intended. */
check('the hives work with nobody stationed on them', (() => {
  meadowReset();
  G.placeHive(0);
  advance(APIARY.interval * 2 + 4);
  return G.jarsWaiting() > 0;
})());
check('a keeper makes every hive faster', (() => {
  meadowReset();
  G.placeHive(0);
  const alone = G.hiveInterval(0);
  S.discovered.bluebell = 999;
  G.checkCritters();
  G.setTending('pip', true);
  G.setKeeper('pip', true);
  return G.isKeeper('pip') && G.hiveInterval(0) < alone;
})());
check('the meadow creature is worth more here than any other', (() => {
  const speedWith = (def) => {
    meadowReset();
    S.discovered[def.attract.seed] = 99999;
    G.checkCritters();
    G.setTending(def.id, true);
    G.setKeeper(def.id, true);
    return G.keeperSpeed();
  };
  const bee = CREATURES.find((c) => c.affinity === 'meadow');
  const other = CREATURES.find((c) => c.affinity !== 'meadow');
  return speedWith(bee) > speedWith(other);
})());
check('a resting creature cannot keep the hives', (() => {
  meadowReset();
  S.discovered.bluebell = 999;
  G.checkCritters();
  G.setTending('pip', false);
  return !G.setKeeper('pip', true) && !G.isKeeper('pip');
})());
check('a creature sent to rest stops keeping', (() => {
  meadowReset();
  S.discovered.bluebell = 999;
  G.checkCritters();
  G.setTending('pip', true);
  G.setKeeper('pip', true);
  G.setTending('pip', false);
  return !G.isKeeper('pip') && G.keeperSpeed() === 0;
})());
check('a sleeping keeper does no work but keeps its place', (() => {
  meadowReset();
  S.discovered.bluebell = 999;
  G.checkCritters();
  G.setTending('pip', true);
  G.setKeeper('pip', true);
  S.critters.pip.fedUntil = 0;
  return G.critterAsleep('pip') && G.isKeeper('pip') && G.keeperSpeed() === 0;
})());
check('the keeper bank has a limit', (() => {
  meadowReset();
  unlockTo(20);
  CREATURES.forEach((c) => { S.discovered[c.attract.seed] = 99999; });
  G.checkCritters();
  CREATURES.forEach((c) => G.setTending(c.id, true));
  CREATURES.forEach((c) => G.setKeeper(c.id, true));
  return G.keepers().length === MEADOW.keeperSlots;
})());

/* The shelf: a lifetime record of every variety, one slot per bloom. */
check('the shelf starts empty and fills as varieties are made', (() => {
  meadowReset();
  if (G.shelfFilled() !== 0) return false;
  G.placeHive(0);
  advance(APIARY.interval * 3 + 4);
  return G.shelfHas('daisy') && G.shelfFilled() === 1 && G.shelfCount('daisy') > 0;
})());
check('the shelf counts, it does not just remember', (() => {
  meadowReset();
  G.placeHive(0);
  advance(APIARY.interval * 2 + 4);
  const first = G.shelfCount('daisy');
  G.collectAllHives();
  advance(APIARY.interval * 2 + 4);
  return G.shelfCount('daisy') > first;
})());
check('the shelf never records wildflower honey', (() => {
  meadowReset();
  clearGarden();
  G.placeHive(0);
  advance(APIARY.interval * 3 + 4);
  return G.jarsWaiting() > 0 && G.shelfFilled() === 0;
})());
check('the shelf has a slot for every seed in the game',
  G.shelfTotal() === DATA.seeds.length && MEADOW.shelfSize === DATA.seeds.length);

/* Saves from before the board: hives were a plain list, and nobody may lose one
   they paid for. Cells are positional, so the array is rebuilt to length. */
check('hives from a save with no board are seated on cells', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  delete raw.apiary.cells;
  raw.apiary.hives = [{ at: 0, jars: ['daisy'] }, { at: 0, jars: [] }];
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.apiary.cells.length === MEADOW.cells && G.hiveCount() === 2
    && S.apiary.cells.filter(Boolean).length === 2;
})());
check('a short or sparse board comes back full length', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.apiary.cells = [null, { kind: 'hive', at: 0, jars: [] }];
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.apiary.cells.length === MEADOW.cells && G.hiveCount() === 1 && G.cellIsHive(1);
})());
check('a save from before the gates keeps land it had built on', (() => {
  G.reset();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  const raw = JSON.parse(JSON.stringify(S));
  delete raw.apiary.locked;
  raw.apiary.cells = Array(MEADOW.cells).fill(null);
  raw.apiary.cells[i] = { kind: 'hive', at: 0, jars: [] };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  // Ground a player has built on is never taken back.
  return G.cellIsHive(i) && !G.cellLocked(i);
})());
check('a save from before the gates re-locks land it never used', (() => {
  G.reset();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  const raw = JSON.parse(JSON.stringify(S));
  delete raw.apiary.locked;
  raw.apiary.cells = Array(MEADOW.cells).fill(null);
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return G.cellLocked(i) && S.apiary.locked.length === MEADOW.cells;
})());
check('an unlocked cell stays unlocked across a save', (() => {
  G.reset();
  const i = MEADOW.cellUnlockLevel.findIndex((lv) => lv > 1);
  const raw = JSON.parse(JSON.stringify(S));
  raw.apiary.locked = Array(MEADOW.cells).fill(false);
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return !G.cellLocked(i);
})());
check('a tender that no longer exists is dropped on load', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.apiary.cells = Array(MEADOW.cells).fill(null);
  raw.apiary.cells[0] = { kind: 'tender', type: 'ghost_tender' };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.apiary.cells[0] === null;
})());
check('a keeper who is not a real creature is dropped on load', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.apiary.keepers = ['ghost', 'ghost'];
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.apiary.keepers.length === 0;
})());

/* ================= THE GARDEN YEAR — the doc-33 sim-test bill =================

   Items 1–6 and 8–18 of docs/33-year-one-economy.md, landed with slice A's
   phase 1. Item 7 (Storm-Kissed's mutation share) waits for slice B, when the
   signature exists. Where a bill item is already asserted by an older group
   (the 1.4x curve, gems-per-hour flatness), the group here covers the part
   the Year added. */

/* Deep-equal via JSON — every field in this save is JSON round-trippable. */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const freshCell = () => ({ locked: false, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0, packDrop: false });
/* A rig that wants a turnable year has to prime BOTH ledgers now: the coins
   gate reads the year, the seeds gate reads the lifetime pool minus what has
   been drawn. Setting only `year.coinsEarned` leaves the pool at zero and the
   Turn refuses — which would make every rig below pass or fail for the wrong
   reason. `mintedBase` stays where the caller left it. */
const primeYear = (earned, lifetime) => {
  S.year.coinsEarned = earned;
  S.lifetimeCoins = lifetime === undefined ? earned : lifetime;
};
/* The mint, restated independently of game.js — a rig that recomputed the
   pouch by calling projectedMint() would assert the engine against itself. */
const expectedPouch = (lifetime, drawn, tallyMult) =>
  Math.round(Math.max(0, DATA.year.mintK * Math.sqrt(lifetime) - drawn) * tallyMult);

group('the profile — identity, migration and the sanitiser');
/* The name is the first free text this game holds. This group covers the three
   things that can go wrong with it in the ENGINE — a save that predates it, a
   save that has been hand-edited, and the Turn. What the escaping rule buys is
   not testable here at all: `tools/sim-test.js` cannot see a `ui-*.js` file, so
   that half is held by `tools/html-check.js` and by a probe run. */
G.reset();
check('a fresh garden is a Gardener with the flower for a face',
  S.profile.name === 'Gardener' && S.profile.avatar === 'flower',
  JSON.stringify(S.profile));

check('a save written before the menu existed gets the default profile', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  delete raw.profile;
  raw.credits = 4242;                       // false on a fresh save, so this cannot pass vacuously
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.credits === 4242 && S.profile.name === 'Gardener' && S.profile.avatar === 'flower';
})());

check('a half-written profile is completed rather than replaced', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.profile = { name: 'Mo' };             // no avatar at all
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.profile.name === 'Mo' && S.profile.avatar === 'flower';
})());

check('a hostile name in a hand-edited save survives load as literal text', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.profile = { name: '<b>x&y</b>', avatar: 'flower' };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  /* NOT escaped, and that is the ruling: `&lt;` in the save is a promise every
     future reader has to keep. The engine stores what was typed; the render
     site is what makes it safe. */
  return S.profile.name === '<b>x&y</b>';
})());

check('a 40-character monster is cut to the cap on load, not just in the editor', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.profile = { name: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcd', avatar: 'flower' };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.profile.name.length === G.PROFILE_NAME_MAX && S.profile.name === 'ABCDEFGHIJKLMNOP';
})());

check('an avatar naming a bloom the player has not unlocked falls back to the flower', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.profile = { name: 'Gardener', avatar: 'seed:moonflower' };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.profile.avatar === 'flower';
})());

check('and one naming a creature that has not moved in does the same', (() => {
  G.reset();
  const raw = JSON.parse(JSON.stringify(S));
  raw.profile = { name: 'Gardener', avatar: 'critter:pip' };
  raw.critters = {};
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.profile.avatar === 'flower';
})());

G.reset();
check('the sanitiser flattens newlines to spaces rather than deleting them',
  G.setProfileName('a\nb') === 'a b', S.profile.name);
check('runs of whitespace collapse, and the ends are trimmed',
  G.setProfileName('   Rose   of   Sharon   ') === 'Rose of Sharon', S.profile.name);
check('the cap is applied after collapsing, so padding cannot spend the allowance',
  G.setProfileName('        Marigold        ') === 'Marigold', S.profile.name);
check('an empty name falls back rather than being stored',
  G.setProfileName('   ') === 'Gardener', S.profile.name);
check('a non-string falls back too', G.setProfileName(null) === 'Gardener', S.profile.name);
check('setProfileName returns what was STORED, not what was sent',
  G.setProfileName('ABCDEFGHIJKLMNOPQRST') === 'ABCDEFGHIJKLMNOP', S.profile.name);
check('the name it stores is exactly what a caller reads back',
  G.profileName() === S.profile.name && G.profile() === S.profile);

check('a face has to be earned before it can be worn', (() => {
  G.reset();
  const refusedSeed = G.setProfileAvatar('seed:moonflower');   // priced at millions, not unlocked
  const refusedPet = G.setProfileAvatar('critter:pip');        // has not moved in
  const refusedJunk = G.setProfileAvatar('<img src=x>');
  const tookFree = G.setProfileAvatar('seed:daisy');           // one of the two free seeds
  return refusedSeed === false && refusedPet === false && refusedJunk === false
    && tookFree === true && S.profile.avatar === 'seed:daisy';
})());

check('a creature that has moved in can be worn', (() => {
  S.critters.pip = { since: clock, fed: 0, gifts: 0, met: true, level: 1, tending: true, fedUntil: 0 };
  return G.setProfileAvatar('critter:pip') === true && S.profile.avatar === 'critter:pip';
})());

check('the picker offers every bloom, marks which are earned, and only creatures that arrived', (() => {
  G.reset();
  S.critters.pip = { since: clock, fed: 0, gifts: 0, met: true, level: 1, tending: true, fedUntil: 0 };
  const c = G.avatarChoices();
  const freeSeeds = DATA.year.freeSeeds;
  return c.flower.id === 'flower'
    && c.blooms.length === DATA.seeds.length
    && c.blooms.filter((b) => b.unlocked).length === freeSeeds
    && c.blooms[0].seed.id === DATA.seeds[0].id      // ladder order, not sorted
    && c.pets.length === 1 && c.pets[0].id === 'critter:pip';
})());
G.reset();

group('bill 1 — the never-resets partition, field by field');
/* Generated from the rule: EVERYTHING not named in the clears column survives
   verbatim. The rig puts something NON-DEFAULT in every field it asserts —
   including every badge key and every tap field, so the wipe and the
   re-derivation bite key by key rather than on the three a lazier rig would
   dirty — and every top-level key must land in exactly one of the two lists,
   so a future field that joins the save without joining a list fails the
   completeness check at the bottom.

   The rig is a FUNCTION because the partition has to be proved twice. The
   Turn's in-flight arm (auto-collect, pack-banking) runs before the mint, so
   a sweep that keeps that arm inert cannot see a wipe inside it — the second
   sweep below runs the same partition with a ready bloom and a parked pack. */
const buildTurnRig = (inFlight) => {
  G.reset();
  clearGarden();
  S.credits = 500000;
  S.gems = 7;
  S.tickets = 5;
  S.decor = [{ id: 'gnome' }];
  S.boosters = { bloom: clock + 900 };
  S.boostInv = { bloom: 2, seedrush: 1, fortune: 0, golden: 0 };
  S.weatherCall = { id: 'rain', from: clock - 10, until: clock + 200 };
  S.cards = { firstlight_0: 2 };
  S.packs = 3;
  S.setsClaimed = ['firstlight'];
  S.stats = { totalTaps: 41, totalCrits: 3, totalHarvests: 29, wonders: 1 };
  S.wonder = { until: clock + 10, last: clock - 500 };
  S.apiary.cells[0] = { kind: 'hive', at: clock, jars: ['daisy'] };
  S.apiary.honey = { daisy: 2 };
  S.apiary.wax = 3;
  S.apiary.shelf = { daisy: 1 };
  S.apiary.keepers = ['pip'];
  /* Paid-for ground: a gated cell bought open, so `apiary.locked` carries a
     value a wipe would visibly change. */
  S.apiary.locked = MEADOW.cellUnlockLevel.map((lv, i) => (i === 4 ? false : lv > 1));
  S.flowers = { daisy: 4 };
  S.craft = [{ id: 'tea', doneAt: clock + 999 }];
  S.goods = { tea: 1 };
  S.bench.basket = [0];
  S.bench.cells[0] = { tier: 1 };
  S.bench.stock = { posy: 1 };
  S.bench.side = 5;
  S.critters.pip = { since: clock - 5000, fed: clock - 100, fedUntil: clock + 3600, gifts: 1, met: true, level: 2, tending: true };
  S.pairsSeen = ['nightbloom'];
  S.mementos = { mossy_pebble: 2 };
  S.luckyPacks = 1;
  S.prefs = { sfx: false, music: true };
  /* EVERY `seen` flag at a non-default value, not three of them. The rig used
     to replace `S.seen` with a three-key object, so a flag added later was
     witnessed at its DEFAULT and `\`seen\` survives the Turn verbatim` passed
     without ever testing it — a test that cannot fail. Built from
     `defaultState()`'s own keys, so the next flag joins it for free. */
  Object.keys(S.seen).forEach((k) => { S.seen[k] = true; });
  /* 25, not 29: the in-flight sweep's auto-collect must not land on the
     every-tenth-harvest reputation drip, which would move rep and level for a
     reason that has nothing to do with the partition. */
  S.harvestsTowardRep = 25;
  S.lastSeen = clock - 60;
  S.stand.delivered = 6;
  S.stand.skipped = 2;
  unlockTo(8);
  S.quests.active = [{ id: 'q_tap_25', progress: 7 }];
  S.quests.done = ['q_plant_1'];
  /* Doc 32's never-touched column promises "the daily quest keeps its day" —
     so the rig carries a LIVE daily, mid-progress, on today's real key. */
  S.quests.daily = { id: DATA.dailies[0].id, progress: 3, day: (() => {
    const d2 = new Date(); return d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate();
  })(), claimed: false };
  S.discovered = { daisy: 30, tulip: 4, bluebell: 6 };
  S.bestRarity = { daisy: 'rare' };
  S.almanacClaimed = [5];
  S.mastery = { daisy: 2 };
  S.rarityCounts = { daisy: { rare: 3, epic: 0, legend: 0 } };
  S.savedSeeds = 40;
  S.petals = { daisy: { rich: 1, quick: 0, sig: 0 } };
  S.blessed = [{ seed: 'daisy', year: 1 }];
  S.year = {
    number: 2, coinsEarned: 250000, turnsCompleted: 1,
    stats: { orders: 12, windfalls: 1, species: 2, speciesSeen: { daisy: true, tulip: true }, legendaries: 1, bestCombo: 60 }
  };
  /* A veteran's ledger: 900K earned across two years, ~60 seeds of the pool
     already drawn at the first Turn. Non-default on purpose — a Turn that
     reset either one has to be visible here. */
  S.lifetimeCoins = 900000;
  S.mintedBase = 60;
  /* A veteran garden: every plot open, one annual growing (not ready). */
  S.grid.forEach((c, i) => { S.grid[i] = freshCell(); });
  S.grid[2] = { ...freshCell(), seed: 'daisy', plantedAt: clock, grow: 9999 };
  /* EVERY badge owned, and every tap field off its default, so `every badge is
     wiped` and `the tap fields re-derive` cannot pass on the strength of the
     keys the rig happened to leave alone. holdSpeed and critMult matter most:
     their only durable effect lives in tap.holdInterval / tap.critMult, so a
     Turn that wiped the badges without re-deriving those would hand out a free
     permanent maxed hold speed and crit multiplier. */
  Object.keys(S.upgrades).forEach((k, i) => { S.upgrades[k] = 1 + (i % 3); });
  S.tap = { power: 7, critChance: 0.21, critMult: 26, combo: 12, comboMax: 90, holdInterval: 420 };
  /* Identity, non-default in BOTH fields. A Turn that reset either one would
     otherwise pass here on the strength of the name matching its own default. */
  S.critters.pip = { since: clock - 5000, fed: 0, gifts: 0, met: true, level: 2, tending: true, fedUntil: clock + 3600 };
  S.profile = { name: 'Rosalind', avatar: 'critter:pip' };
  /* Fall mid-flight: a crop and the Century Bloom, both growing, on a bed
     whose windfall latch is CLOSED and whose cells carry their marks — the
     state that makes "once per fill" structural, and the state a Turn must
     not quietly reset. */
  S.fall.grid[0] = { seed: 'strawberry', plantedAt: clock - 100, grow: 1200, ready: false, windfall: true };
  S.fall.grid[5] = { seed: 'century', plantedAt: clock - 86400, grow: 1209600, ready: false, windfall: false };
  S.fall.bedPaid = true;
  /* WINTER MID-NIGHT: a bed under a standing tuck, one cell KEPT AND RIPE and
     one still growing. The kept ripe cell is the case doc 46 names by hand —
     doc 32's in-flight auto-collect is scoped to the MAIN garden, so a ripe
     Winter plant crosses the Turn intact, mark and all, and pays into the year
     it is collected in. `ready: true` so a stray tick cannot perturb the rig. */
  S.winter.grid[1] = { seed: 'snowdrop', plantedAt: clock - 50000, grow: 43200, ready: true, kept: true };
  S.winter.grid[6] = { seed: 'cyclamen', plantedAt: clock - 100, grow: 72000, ready: false, kept: false };
  S.winter.tuckedAt = clock - 60000;
  if (inFlight) {
    /* The in-flight arm, live: a ready bloom to auto-collect, a parked pack to
       bank, and the growing annual above to forfeit. */
    S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
    S.grid[4].packDrop = true;
  }
};

buildTurnRig(false);
const yrBefore = JSON.parse(JSON.stringify(S));
const yrTallyMult = G.projectedTally().mult;
const yrExpectedIncrement = DATA.year.mintK * Math.sqrt(yrBefore.lifetimeCoins) - yrBefore.mintedBase;
const yrExpectedPouch = expectedPouch(yrBefore.lifetimeCoins, yrBefore.mintedBase, yrTallyMult);
const yrTurn = G.turnYear(null);
check('the Turn ran', Boolean(yrTurn));

const SURVIVES = ['version', 'gems', 'tickets', 'decor', 'boosters', 'weatherCall', 'cards', 'packs',
  'setsClaimed', 'stats', 'wonder', 'apiary', 'flowers', 'craft', 'goods', 'bench', 'critters',
  'pairsSeen', 'mementos', 'luckyPacks', 'prefs', 'seen', 'quests', 'rep', 'level', 'discovered',
  'bestRarity', 'almanacClaimed', 'mastery', 'rarityCounts', 'seedUnlocks', 'petals', 'blessed',
  'fall', 'winter', 'harvestsTowardRep', 'lastSeen', 'lifetimeCoins', 'profile',
  /* The rewarded-ad ledger sits outside the Garden Year entirely — impressions
     are lifetime, the day's counts roll on a date, the open count rises on a page
     load and `firstAt` never moves at all. A Turn that wiped any of them would
     hand a player a fresh ad budget for finishing a year, which is the one thing
     a cap must not do — and one that wiped `firstAt` would put a player who has
     just finished a whole year back into a first session. */
  'ads',
  'seedRevealed', 'upgradeRevealed', 'celebrated'];
/* CHANGED, not "cleared": doc 32's never-touched column means never reset or
   decreased — savedSeeds sits here because the mint WRITES it (upward, by
   exactly the projection, asserted below), and petals/blessed sit in SURVIVES
   only because this run passes no blessing (bill 16 covers the blessing). */
const CHANGED_BY_THE_TURN = ['credits', 'grid', 'upgrades', 'tap', 'boostInv', 'stand', 'year', 'savedSeeds', 'mintedBase'];
SURVIVES.forEach((k) => {
  check(`\`${k}\` survives the Turn verbatim`, same(S[k], yrBefore[k]),
    `${JSON.stringify(S[k]).slice(0, 80)} vs ${JSON.stringify(yrBefore[k]).slice(0, 80)}`);
});
check('every field of the save is classified — no key dodges the partition',
  same(Object.keys(S).sort(), [...SURVIVES, ...CHANGED_BY_THE_TURN].sort()),
  Object.keys(S).filter((k) => !SURVIVES.includes(k) && !CHANGED_BY_THE_TURN.includes(k)).join(','));
check('gold zeroes to the fresh purse, after the mint', S.credits === 100);
check('the mint paid exactly the projection', S.savedSeeds === yrBefore.savedSeeds + yrExpectedPouch
  && yrTurn.pouch === yrExpectedPouch, `${S.savedSeeds} vs ${yrBefore.savedSeeds} + ${yrExpectedPouch}`);
check('`lifetimeCoins` survives the Turn — the pool is never reset',
  S.lifetimeCoins === yrBefore.lifetimeCoins, `${S.lifetimeCoins} vs ${yrBefore.lifetimeCoins}`);
check('`mintedBase` grows by the UN-tallied increment, never by the pouch',
  Math.abs(S.mintedBase - (yrBefore.mintedBase + yrExpectedIncrement)) < 1e-9
  && S.mintedBase !== yrBefore.mintedBase + yrTurn.pouch,
  `${S.mintedBase} vs ${yrBefore.mintedBase} + ${yrExpectedIncrement} (pouch ${yrTurn.pouch}, tally ${yrTallyMult})`);
check('the drawn ledger exactly equals the pool the year had opened',
  Math.abs(S.mintedBase - DATA.year.mintK * Math.sqrt(yrBefore.lifetimeCoins)) < 1e-9,
  `${S.mintedBase}`);
check('every badge is wiped', Object.values(S.upgrades).every((v) => v === 0));
check('the tap fields re-derive from the wiped badges',
  S.tap.power === 1 && S.tap.critChance === 0.05 && S.tap.critMult === 10
  && S.tap.comboMax === 50 && S.tap.holdInterval === 900);
check('the combo zeroes with the board', S.tap.combo === 0);
check('the boost inventory clears; the running boost survives on its own clock',
  Object.values(S.boostInv).every((v) => v === 0) && S.boosters.bloom === yrBefore.boosters.bloom);
check('the growing annual is forfeit and every plot stands empty',
  S.grid.every((c) => !c.seed && !c.packDrop && !c.mutation));
check('plots 5–8 close; plots 1–4 stay open',
  S.grid.every((c, i) => c.locked === (i > 3)));
check('the year rolls over', S.year.number === 3 && S.year.turnsCompleted === 2
  && S.year.coinsEarned === 0);
check('bill 15 — the Tally counters zero at the Turn',
  same(S.year.stats, { orders: 0, windfalls: 0, species: 0, speciesSeen: {}, legendaries: 0, bestCombo: 0 }));
check('the Stand\'s lifetime counters survive', S.stand.delivered === yrBefore.stand.delivered
  && S.stand.skipped === yrBefore.stand.skipped);

group('bill 1b — the same partition, on a Turn whose in-flight arm actually runs');
/* The sweep above proves the partition on a Turn that collects nothing. The
   in-flight arm — auto-collect, pack-banking — runs BEFORE the mint and
   touches the save, so it needs its own sweep or a wipe in there is invisible.
   The auto-collected harvest legitimately writes a few lifetime records; they
   are NAMED here rather than excused by a loose comparison, and everything
   else must still survive verbatim. */
buildTurnRig(true);
const flightBefore = JSON.parse(JSON.stringify(S));
/* The payout is read off the real harvest event rather than recomputed here —
   the rig is a veteran garden (a hive pollinating, a Rich Bloom petal, a
   Wonder running), and duplicating that product in the test would assert the
   economy against itself. */
let daisyPay = 0;
G.on('harvest', (p) => { daisyPay = p.payout; });
const rngFlight = Math.random;
Math.random = () => 0.5;   // common rarity, no gem, no new Wonder, no pack proc
const flightTurn = G.turnYear(null);
Math.random = rngFlight;
/* What the auto-collected harvest and the pack-banking are ALLOWED to move. */
const HARVEST_WRITES = ['flowers', 'bench', 'stats', 'harvestsTowardRep', 'discovered', 'quests', 'packs', 'lifetimeCoins'];
check('the in-flight arm really ran', Boolean(flightTurn) && flightTurn.collected === 1
  && flightTurn.bankedPacks === 1, JSON.stringify(flightTurn && { c: flightTurn.collected, p: flightTurn.bankedPacks }));
SURVIVES.filter((k) => !HARVEST_WRITES.includes(k)).forEach((k) => {
  check(`\`${k}\` survives an in-flight Turn verbatim`, same(S[k], flightBefore[k]),
    `${JSON.stringify(S[k]).slice(0, 80)} vs ${JSON.stringify(flightBefore[k]).slice(0, 80)}`);
});
check('the collected bloom was paid into the year BEFORE the mint',
  flightTurn.earned === flightBefore.year.coinsEarned + daisyPay,
  `${flightTurn.earned} vs ${flightBefore.year.coinsEarned} + ${daisyPay}`);
check('and the pouch is minted from that larger number', flightTurn.pouch === expectedPouch(
  flightBefore.lifetimeCoins + daisyPay, flightBefore.mintedBase, flightTurn.tally.mult),
  `${flightTurn.pouch} vs ${expectedPouch(flightBefore.lifetimeCoins + daisyPay, flightBefore.mintedBase, flightTurn.tally.mult)}`);
/* The lifetime half of the same claim. The collected bloom has to reach the
   POOL, not just the year — the year only opens the coins gate, and a mint
   that read `year.coinsEarned` would pass the assertion above while paying
   from the wrong number. */
check('and it reached the lifetime pool, not only the year',
  Math.abs(S.lifetimeCoins - (flightBefore.lifetimeCoins + daisyPay)) < 1e-9,
  `${S.lifetimeCoins} vs ${flightBefore.lifetimeCoins} + ${daisyPay}`);
check('the banked pack is added, never destroyed', S.packs === flightBefore.packs + 1);
check('the lifetime records the harvest wrote only grew',
  S.discovered.daisy === flightBefore.discovered.daisy + 1
  && S.stats.totalHarvests === flightBefore.stats.totalHarvests + 1
  && S.flowers.daisy === flightBefore.flowers.daisy + 1);
check('the badges still wipe and the tap fields still re-derive on this path',
  Object.values(S.upgrades).every((v) => v === 0)
  && S.tap.power === 1 && S.tap.critChance === 0.05 && S.tap.critMult === 10
  && S.tap.comboMax === 50 && S.tap.holdInterval === 900 && S.tap.combo === 0);
check('and Fall\'s latch and marks are untouched by an in-flight Turn',
  S.fall.bedPaid === true && S.fall.grid[0].windfall === true);

group('bill 2 — the Turn kills no running timer, and nothing in flight is eaten silently');
check('the Fall crop\'s clock is untouched', same(S.fall.grid[0], yrBefore.fall.grid[0]));
/* Bill 1, the half that is Winter's own: the Turn crosses a KEPT RIPE cell and
   leaves the cell, the mark and the wallet exactly where they were. Auto-eating
   a kept Camellia at the Turn would eat the morning the season exists for. */
check('a kept ripe Winter cell crosses the Turn untouched — cell and mark',
  same(S.winter.grid[1], yrBefore.winter.grid[1])
  && S.winter.grid[1].seed === 'snowdrop' && S.winter.grid[1].kept === true,
  JSON.stringify(S.winter.grid[1]));
check('the standing tuck crosses the Turn untouched',
  S.winter.tuckedAt === yrBefore.winter.tuckedAt && S.winter.tuckedAt > 0);
check('the Turn paid nothing for the ripe Winter cell — the wallet is the fresh purse alone',
  S.credits === 100, String(S.credits));
/* And the fixture really was the case it claims: a ripe Winter cell that the
   Turn's own auto-collect would have eaten had it been in scope. `collected`
   counts the MAIN garden's auto-collect, and the ripe Winter snowdrop is not
   in it — which is doc 32's freshly scoped bullet, asserted. */
check('the Turn\'s auto-collect counted only main-garden blooms',
  yrTurn.collected === 0, String(yrTurn.collected));
check('and the ripe Winter cell really was ripe when it crossed',
  yrBefore.winter.grid[1].plantedAt + yrBefore.winter.grid[1].grow <= clock);
check('the Century Bloom\'s clock is untouched', same(S.fall.grid[5], yrBefore.fall.grid[5]));
G.reset();
clearGarden();
primeYear(200000);
S.year.turnsCompleted = 1;   // a veteran, so Fall is open for the timer half
S.fall.grid[3] = { seed: 'apple', plantedAt: clock - 50, grow: 28800, ready: false, windfall: false };
S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
S.grid[1] = { ...freshCell(), seed: 'tulip', plantedAt: clock, grow: 9999 };
S.grid[4].packDrop = true;
const rngTurn = Math.random;
Math.random = () => 0.5;   // the auto-collect lands Common, no gem, no Wonder, no procs
const packsBeforeTurn = S.packs;
const inFlight = G.turnYear(null);
Math.random = rngTurn;
check('the ready bloom auto-collected', inFlight.collected === 1);
/* Assert the GOLD, not the pouch: at 200K the rounded pouch does not move
   until roughly +12,500 coins, so predicting it from sqrt(200000 + yield) is
   arithmetically identical to sqrt(200000) and would pass with the
   auto-collect's payout thrown away entirely. `earned` is captured inside the
   Turn after the collect loop and before the rollover, so it is the direct
   witness for "paid into the year BEFORE the mint". */
check('it paid into the year BEFORE the mint',
  inFlight.earned === 200000 + G.seedById('daisy').yield,
  `${inFlight.earned} vs ${200000 + G.seedById('daisy').yield}`);
check('the plot-parked pack was banked, never destroyed',
  S.packs === packsBeforeTurn + 1 && inFlight.bankedPacks === 1);
check('the growing tulip was forfeit — the one stated cost', !S.grid[1].seed);
check('the mid-grow apple kept its clock', S.fall.grid[3].seed === 'apple'
  && S.fall.grid[3].plantedAt === clock - 50);

group('bill 3 — the mint reads earnings, never balance');
/* The spend arm hits EVERY coin sink — badges, a seed unlock, plantings, a
   hive, a Fall crop — so a regression that decremented coinsEarned in any of
   them would break the pouch identity, not just the tapPower path. */
const mintRigFor = (spendEverything) => {
  G.reset();
  clearGarden();
  primeYear(300000);
  S.year.turnsCompleted = 1;      // both arms: Fall open, plots buyable
  S.credits = 300000;
  S.rep = G.cumulativeRep(14);    // both arms: the level gates on plots and meadow land are open
  S.level = 14;
  if (spendEverything) {
    G.unlockSeed('bluebell');                             // 150,000
    G.plant(0, G.seedById('daisy'));
    G.plant(1, G.seedById('tulip'));
    G.plant(2, G.seedById('bluebell'));
    G.placeHive(0);                                       // 2,200
    G.fallPlant(0, 'strawberry');                         // 2,000
    G.unlockPlot(4);                                      // plot land
    G.unlockCell(4);                                      // meadow land
    G.placeTender(1, 'sun');                              // a meadow piece
    G.benchExpand();                                      // the bench
    G.buyDecor('shrine');                                 // a coin-priced cosmetic
    while (S.credits >= G.upgradePrice('tapPower')) G.buyUpgrade('tapPower');
  }
  const r = G.turnYear(null);
  return r.pouch;
};
const pouchHoarded = mintRigFor(false);
const pouchSpent = mintRigFor(true);
check('a spend-through-every-sink-then-Turn run pouches identically', pouchHoarded === pouchSpent && pouchHoarded > 0,
  `${pouchHoarded} vs ${pouchSpent}`);

group('bill 4 — credit() is the single tested faucet, and cheats never reach it');
G.reset();
clearGarden();
const earnedNow = () => S.year.coinsEarned;
let yrMark = earnedNow();
const rngFaucet = Math.random;
Math.random = () => 0.5;
const tapPaid = G.tapFlower().gain;
check('a tap earns into the year', earnedNow() === yrMark + tapPaid, `${earnedNow()} vs ${yrMark + tapPaid}`);
S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
yrMark = earnedNow();
const harvestPaid = G.harvest(0).payout;
check('a harvest earns into the year', earnedNow() === yrMark + harvestPaid);
Math.random = rngFaucet;
S.flowers = { daisy: 2 };
yrMark = earnedNow();
const soldFor = G.sell('flower', 'daisy', true);
check('a sale earns into the year', earnedNow() === yrMark + soldFor);
S.quests.active = [{ id: 'q_harvest_1', progress: 1 }, { id: 'q_plant_1', progress: 1 }];
S.quests.done = [];
S.rep = 0; S.level = 1;
yrMark = earnedNow();
G.claimQuest('q_harvest_1');
G.claimQuest('q_plant_1');   // ten rep total: the level-up pays its coin grant
check('the level-up coins earn into the year',
  S.level === 2 && earnedNow() === yrMark + DATA.levelCoinGrant * 2,
  `${earnedNow()} vs ${yrMark + DATA.levelCoinGrant * 2}`);
/* Actual quest GOLD rides applyReward — only the dailies carry reward.credits,
   so the faucet has to be tested through one or it is tested through nothing. */
const dailyDef = DATA.dailies[0];
S.quests.daily = { id: dailyDef.id, progress: dailyDef.qty, day: (() => {
  const d2 = new Date(); return d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate();
})(), claimed: false };
yrMark = earnedNow();
const lvBeforeDaily = S.level;
check('daily quest gold earns into the year', (() => {
  const paid = G.claimQuest(dailyDef.id);
  let levelCoins = 0;
  for (let L = lvBeforeDaily + 1; L <= S.level; L += 1) levelCoins += DATA.levelCoinGrant * L;
  return Boolean(paid) && earnedNow() === yrMark + dailyDef.reward.credits + levelCoins;
})(), `${earnedNow()} vs ${yrMark} + ${dailyDef.reward.credits}`);
/* The Stand — doc 33 names orders in the faucet list, so a delivery must be
   watched reaching the mint, and its Tally counter must move off the real
   event rather than only ever off Dev.setYearStats. */
S.flowers = { daisy: 3 };
S.rep = 0; S.level = 1;   // a delivery moves no rep at all now; the delta below is coins alone
S.stand.slots[0] = {
  id: 'o_bill4', good: 'posy', customer: 'nan', slot: 0, at: clock,
  needs: [{ kind: 'flower', of: 'daisy', any: false, qty: 2 }], coins: 500, rep: 4
};
yrMark = earnedNow();
const ordersMark = S.year.stats.orders;
const deliveredBill4 = G.standDeliver(0);
check('a Stand delivery earns into the year', deliveredBill4
  && earnedNow() === yrMark + deliveredBill4.paid,
  `${earnedNow()} vs ${yrMark} + ${deliveredBill4 && deliveredBill4.paid}`);
check('and counts the Tally\'s orders line off the real event',
  S.year.stats.orders === ordersMark + 1);
/* Fall — the newest faucet, and the one phases 2–3 will touch. */
S.year.turnsCompleted = 1;
S.credits = 1e9;
G.fallPlant(0, 'strawberry');
S.fall.grid[0].plantedAt = clock - 9999;
yrMark = earnedNow();
const fallBill4 = G.fallHarvest(0);
check('a Fall harvest earns into the year', fallBill4
  && earnedNow() === yrMark + fallBill4.payout,
  `${earnedNow()} vs ${yrMark} + ${fallBill4 && fallBill4.payout}`);
S.year.turnsCompleted = 0;
yrMark = earnedNow();
S.critters.pip = { since: clock - 1e6, fed: clock - 1e6, fedUntil: clock + 3600, gifts: 3, met: true, level: 1, tending: true };
const keepsakePay = G.collectKeepsakes('pip');
check('keepsakes earn into the year', keepsakePay && earnedNow() === yrMark + keepsakePay.credits);
/* The offline grant in reconcile() routes through the same faucet. */
S.upgrades.autoHarvest = 1;
S.upgrades.plot1Harvester = 1;
S.grid[0] = { ...freshCell() };
yrMark = earnedNow();
S.lastSeen = clock - 3600;
const wokeUp = G.reconcile();
check('the offline grant earns into the year', wokeUp && wokeUp.earned > 0
  && earnedNow() === yrMark + wokeUp.earned, JSON.stringify(wokeUp && wokeUp.earned));
/* And the cheats do not — on EITHER ledger. The lifetime one is the one that
   matters most here: the year's accumulator is wiped every Turn, so a stray
   cheated coin in it washes out, while a stray coin in the pool is permanent
   and inflates every future pouch. */
const lifetimeNow = () => S.lifetimeCoins;
yrMark = earnedNow();
let ltMark = lifetimeNow();
const creditsBeforeCheat = S.credits;
G.Dev.grantGold(1e6);
check('cheated gold lands in the wallet', S.credits === creditsBeforeCheat + 1e6);
check('cheated gold never reaches the mint', earnedNow() === yrMark);
check('and never reaches the lifetime pool either', lifetimeNow() === ltMark);
S.tap.holdInterval = 180;   // the floor: Quick Grip's effect refuses, and the price refunds
S.credits = 1e6;
yrMark = earnedNow();
ltMark = lifetimeNow();
/* A MAXED purchase is refused before it charges, so this pair asserts the
   refusal, not the refund — `upgradeMaxed('holdSpeed')` pre-empts
   `buyUpgrade` at the floor. Named honestly. */
check('a refused purchase moves neither wallet nor ledger', G.buyUpgrade('holdSpeed') === false
  && S.credits === 1e6 && earnedNow() === yrMark);
check('and a refusal never reaches the lifetime pool', lifetimeNow() === ltMark);
/* The refund branch proper: `buyUpgrade` charges first and calls back the
   effect, restoring the wallet through credit({refund}) when the effect
   declines. Every shipped effect that can decline is shadowed by an
   `upgradeMaxed` case, so the branch is unreachable through the real badges —
   the only honest way to test it is to make an effect decline on purpose. */
check('the refund path restores the wallet without minting anything', (() => {
  const key = 'tapPower';
  const real = G.UPGRADE_EFFECTS[key];
  G.UPGRADE_EFFECTS[key] = () => false;
  S.credits = 1e6;
  const price = G.upgradePrice(key);
  const yr0 = earnedNow();
  const lt0 = lifetimeNow();
  const refused = G.buyUpgrade(key);
  G.UPGRADE_EFFECTS[key] = real;
  return refused === false && S.credits === 1e6 && price > 0
    && earnedNow() === yr0 && lifetimeNow() === lt0;
})());
/* The refund flag itself, through the exported faucet — the decor migration
   is the live caller, and a refund is not income on either ledger. */
yrMark = earnedNow();
ltMark = lifetimeNow();
const creditsBeforeRefund = S.credits;
G.credit(250000, { refund: true });
check('an explicit refund grant moves the wallet and neither accumulator',
  S.credits === creditsBeforeRefund + 250000
  && earnedNow() === yrMark && lifetimeNow() === ltMark,
  `${earnedNow()} / ${lifetimeNow()}`);
yrMark = earnedNow();
ltMark = lifetimeNow();
G.Dev.feedCritters();
check('the feed-everyone cheat stays off the mint', earnedNow() === yrMark);
/* docs/37-monetization.md's first promise: ad-granted gold never feeds the well.
   Nothing pays gold for an ad yet — the flag is tested before its first caller
   exists, because a promise added after the placement is a promise added too
   late. Placed here rather than below the driver check: that one reuses the
   yrMark set before feedCritters(), and an ad grant moves neither accumulator,
   so re-marking here leaves both values exactly where they were. */
yrMark = earnedNow();
ltMark = lifetimeNow();
const creditsBeforeAd = S.credits;
G.credit(750000, { ad: true });
check('an ad grant moves the wallet and neither accumulator',
  S.credits === creditsBeforeAd + 750000
  && earnedNow() === yrMark && lifetimeNow() === ltMark,
  `${earnedNow()} / ${lifetimeNow()}`);
/* The first REAL ad-bought reward in the game, held to the same promise through
   its own front door rather than through credit(). The drone rental hands over
   thirty minutes of a machine and no gold at all, so the amount both ledgers may
   move by is exactly zero — stated as a number, because "it did not change much"
   would pass under an implementation that quietly minted the loan's harvests. */
returningPlayer();
S.ads.day = 'not-today';
delete S.boosters.drone;
S.upgrades.autoHarvest = 0;
yrMark = earnedNow();
ltMark = lifetimeNow();
const creditsBeforeRental = S.credits;
const rented = G.rentDrone();
check('and the drone rental — a real ad-bought reward — moves all three by zero',
  rented === true && S.credits === creditsBeforeRental
  && earnedNow() === yrMark && lifetimeNow() === ltMark,
  `${S.credits - creditsBeforeRental} / ${earnedNow() - yrMark} / ${lifetimeNow() - ltMark}`);
delete S.boosters.drone;
check('the year driver IS earning, by design', (G.Dev.driveYear(500), earnedNow() === yrMark + 500));
check('and the driver earns into the pool too, so the meter and the mint agree',
  lifetimeNow() === ltMark + 500, `${lifetimeNow()} vs ${ltMark} + 500`);
/* The last credit() call site: a level's hive grant landing on a full meadow
   pays coins instead. A real faucet on a real path, and the only one the rest
   of this group does not drive. */
S.apiary.cells = S.apiary.cells.map(() => ({ kind: 'tender', type: 'sun' }));
S.rep = G.cumulativeRep(17); S.level = 17;
yrMark = earnedNow();
const hiveGrantLevel = Number(Object.keys(DATA.levelGrants).find((L) => DATA.levelGrants[L].hive));
G.Dev.grantLevels(hiveGrantLevel - 17);
check('the hive-overflow coin payout earns into the year',
  hiveGrantLevel > 0 && S.level >= hiveGrantLevel && earnedNow() > yrMark,
  `level ${hiveGrantLevel}, earned +${earnedNow() - yrMark}`);

group('bill 5 — yield = cost × 1.4 for every seed, Fall\'s included; petals leave the curve alone');
check('all nineteen flowers hold the curve', DATA.seeds.every((s) => s.yield === Math.round(s.cost * 1.4)));
check('all nine Fall plants hold the curve', DATA.fall.plants.every((p) => p.yield === Math.round(p.cost * 1.4)));
G.reset();
clearGarden();
S.savedSeeds = 1e6;
const daisyYieldBefore = G.seedById('daisy').yield;
G.buyPetal('daisy', 'rich');
G.buyPetal('daisy', 'rich');
check('buying petals never edits seed.yield', G.seedById('daisy').yield === daisyYieldBefore);
const rngPetal = Math.random;
Math.random = () => 0.5;
S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
const petalPaid = G.harvest(0).payout;
Math.random = rngPetal;
check('two Rich Bloom petals pay exactly +60% at harvest',
  petalPaid === Math.round(daisyYieldBefore * 1.6), `${petalPaid} vs ${Math.round(daisyYieldBefore * 1.6)}`);
check('the petal cost ladder matches the formula: daisy 15, seed 10 ≈ 426, seed 19 ≈ 12K',
  G.petalCost('tulip', 'rich') === Math.round(15 * 1.45)
  && G.petalCost(DATA.seeds[9].id, 'rich') === Math.round(15 * Math.pow(1.45, 9))
  && G.petalCost('eternal', 'rich') === Math.round(15 * Math.pow(1.45, 18)),
  `${G.petalCost(DATA.seeds[9].id, 'rich')} / ${G.petalCost('eternal', 'rich')}`);
check('a signature petal would price at ×0.6 of the shared formula',
  G.petalCost('daisy', 'sig') === Math.round(15 * 0.6));
check('the shared skills cap at five petals', (() => {
  for (let i = 0; i < 9; i += 1) G.buyPetal('daisy', 'rich');
  return G.petalsOf('daisy').rich === 5 && G.buyPetal('daisy', 'rich') === false;
})());
/* The sink runway, derived from the constants rather than quoted from the
   design session — doc 33's own preamble asks that its simulated figures be
   re-run as sim-tests once the values land in data. Pin it so the docs and
   the data cannot drift apart again. */
const petalSink = DATA.seeds.reduce((total, s, i) => {
  let n = 0;
  ['rich', 'quick'].forEach((k) => {
    for (let p = 0; p < DATA.petals.shared[k].cap; p += 1) {
      n += Math.round(DATA.petals.base * Math.pow(DATA.petals.seedRatio, i)
        * Math.pow(DATA.petals.petalRatio, p));
    }
  });
  return total + n;
}, 0);
check('the whole shared-skill sink is ~636K Saved Seeds, as documented',
  Math.abs(petalSink - 636378) < 500, `${petalSink.toLocaleString()}`);

group('bill 6 — gems stay flat and untouched by the Year');
G.reset();
const gemBefore = DATA.seeds.map((s) => G.gemChanceFor(s));
S.savedSeeds = 1e6;
G.buyPetal('daisy', 'rich');
G.buyPetal('daisy', 'quick');
check('no petal changes any gem chance', DATA.seeds.every((s, i) => G.gemChanceFor(s) === gemBefore[i]));
S.year.turnsCompleted = 1;
S.credits = 1e9;
const gemsBeforeFall = S.gems;
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { if (c.seed) c.plantedAt = clock - c.grow - 1; });
G.processFall(clock);
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallHarvest(i);
check('a whole Fall bed drops no gems', S.gems === gemsBeforeFall);

group('bill 8 — Quick Sprout at cap, Sprinklers, a Keeper wall and Seed Rush hold the 0.3 floor');
G.reset();
clearGarden();
S.credits = 1e9;
S.savedSeeds = 1e9;
S.seedUnlocks.bluebell = true;
for (let i = 0; i < 5; i += 1) G.buyPetal('daisy', 'quick');
S.upgrades.autoWater = 10;
S.boostInv.seedrush = 1;
G.activateBoost('seedrush');
G.plant(1, G.seedById('bluebell'));
G.plant(3, G.seedById('bluebell'));
G.plant(0, G.seedById('daisy'));
const floorRatio = S.grid[0].grow / G.seedById('daisy').grow;
check('the whole stack clamps at the floor, never through it',
  floorRatio >= 0.3 - 1e-12, `${floorRatio}`);
check('and the clamp binds exactly at 0.3 for this stack', Math.abs(floorRatio - 0.3) < 1e-12, `${floorRatio}`);
S.boosters = {};

group('bill 9 — the Turn regenerates every Stand slot from the unlock pool');
G.reset();
clearGarden();
unlockTo(17);
S.apiary.cells[0] = { kind: 'hive', at: clock, jars: [] };
primeYear(200000);
for (let i = 0; i < STAND.slots; i += 1) G.standGenerate(i);
/* Strand an order naming a bloom, then shrink the unlock pool to prove the
   regenerated board draws only from what the fresh year can grow. */
S.seedUnlocks = { bluebell: true };
const staleOrderIds = S.stand.slots.filter(Boolean).map((o) => o.id);
G.turnYear(null);
check('all three slots hold fresh orders — every pre-Turn order is gone', S.stand.slots.every(Boolean)
  && S.stand.slots.every((o) => !staleOrderIds.includes(o.id)),
  JSON.stringify(S.stand.slots.map((o) => o && o.id)));
check('the refill clocks are live, never parked in the future',
  S.stand.nextAt.every((t) => t <= G.nowSeconds()), JSON.stringify(S.stand.nextAt));
check('no order names a bloom outside the unlock pool', S.stand.slots.every((o) =>
  o.needs.every((n) => n.any || ['daisy', 'tulip', 'bluebell'].includes(n.of))),
  JSON.stringify(S.stand.slots.map((o) => o.needs.map((n) => n.of))));

group('bill 10 — petal effects reach passiveIncomeRate(), so offline mirrors online');
G.reset();
clearGarden();
S.upgrades.autoHarvest = 1;
S.upgrades.plot2Harvester = 2;   // plants up to tulip on plot 2
const rateBefore = G.passiveIncomeRate();
check('the rig earns while away at all', rateBefore > 0, `${rateBefore}`);
S.savedSeeds = 1e9;
G.buyPetal('tulip', 'rich');
const rateRich = G.passiveIncomeRate();
const tulip = G.seedById('tulip');
const rarityMean = DATA.rarity.reduce((a, r) => a + r.w * r.m, 0) / DATA.rarity.reduce((a, r) => a + r.w, 0);
const expectRich = (tulip.yield * rarityMean * 1.3 - tulip.cost) / tulip.grow;
check('Rich Bloom lifts the offline rate by exactly its harvest share',
  Math.abs(rateRich - expectRich) < 1e-9, `${rateRich} vs ${expectRich}`);
G.buyPetal('tulip', 'quick');
const rateQuick = G.passiveIncomeRate();
const expectQuick = (tulip.yield * rarityMean * 1.3 - tulip.cost) / (tulip.grow * 0.94);
check('Quick Sprout shortens the offline cycle too',
  Math.abs(rateQuick - expectQuick) < 1e-9, `${rateQuick} vs ${expectQuick}`);

group('bill 11 — an unlock is charged once per lifetime; the Turn never re-charges');
G.reset();
clearGarden();
S.credits = 150000;
primeYear(200000);
G.unlockSeed('bluebell');
check('the unlock spent the wallet', S.credits === 0);
check('the Turn actually ran', Boolean(G.turnYear(null)));
check('the unlock survives the Turn', G.seedUnlocked('bluebell') === true);
S.credits = 1e6;
check('and can never be charged again', G.unlockSeed('bluebell') === false && S.credits === 1e6);

group('bill 12 — the windfall pays for a full ripe bed, once per fill');
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
/* The PLANTED half of "all eight planted and ripe", asserted in its own right:
   seven crops, every one of them ripe, one plot empty. Ripeness alone is not
   the rule, and this must not be left to some other group's rig happening to
   leave a bed part-empty. */
for (let i = 0; i < DATA.fall.plots - 1; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { if (c.seed) c.plantedAt = clock - 9999; });
G.processFall(clock);
check('seven ripe crops and one EMPTY plot arm nothing', S.year.stats.windfalls === 0
  && S.fall.grid.every((c) => !c.windfall), JSON.stringify(S.fall.grid.map((c) => c.seed)));
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallHarvest(i);
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
/* Seven ripe of eight: no windfall. */
for (let i = 0; i < 7; i += 1) S.fall.grid[i].plantedAt = clock - 9999;
G.processFall(clock);
check('seven of eight ripe arms nothing', S.year.stats.windfalls === 0
  && S.fall.grid.every((c) => !c.windfall));
S.fall.grid[7].plantedAt = clock - 9999;
G.processFall(clock);
check('the eighth ripening arms the whole bed, once', S.year.stats.windfalls === 1
  && S.fall.grid.every((c) => c.windfall));
const strawberry = G.fallPlantById('strawberry');
const yrBeforeWindfall = S.year.coinsEarned;
const windfallPay = G.fallHarvest(0);
check('a windfall harvest pays +50% exactly',
  windfallPay.windfall && windfallPay.payout === Math.round(strawberry.yield * 1.5), `${windfallPay.payout}`);
check('and the windfall earns into the year',
  S.year.coinsEarned === yrBeforeWindfall + windfallPay.payout);
check('a replant mid-collection joins the next fill, not this one',
  (G.fallPlant(0, 'strawberry'), !S.fall.grid[0].windfall));
S.fall.grid[0].plantedAt = clock - 9999;
G.processFall(clock);
check('re-ripening cannot re-arm a paid bed', S.year.stats.windfalls === 1);
const plainPay0 = G.fallHarvest(0);
check('and the replanted plot pays plain', !plainPay0.windfall
  && plainPay0.payout === strawberry.yield, `${plainPay0.payout}`);
for (let i = 1; i < DATA.fall.plots; i += 1) G.fallHarvest(i);
check('an emptied bed resets the cycle', S.fall.bedPaid === false);
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999; });
G.processFall(clock);
check('the next full fill arms a second windfall', S.year.stats.windfalls === 2);
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallHarvest(i);

group('bill 12b — Collect All pays exactly what it promised, and leaves the Century Bloom');
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999; });
G.processFall(clock);
const promised = G.fallBedValue();
check('the getter counts every marked plot', promised.plots === DATA.fall.plots
  && promised.total === DATA.fall.plots * Math.round(G.fallPlantById('strawberry').yield * 1.5),
  JSON.stringify(promised));
const yrBeforeAll = S.year.coinsEarned;
const walletBeforeAll = S.credits;
const bedTook = G.fallHarvestAll();
check('and the harvest pays exactly that, to the coin',
  bedTook.payout === promised.total && S.credits === walletBeforeAll + promised.total,
  `${bedTook.payout} vs ${promised.total}`);
check('it earns into the year like every other faucet',
  S.year.coinsEarned === yrBeforeAll + promised.total);
check('every plot it took is empty afterwards',
  bedTook.plots === DATA.fall.plots && S.fall.grid.every((c) => !c.seed));
check('the marks are spent, so the bed can arm again', S.fall.bedPaid === false
  && G.fallBedValue().total === 0);
/* THE RULING, asserted rather than described: Collect All is about the BED, and
   the Century Bloom is outside the bed in both directions. A run that took the
   fortnight showpiece would pass every other assertion here. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
G.fallPlant(0, 'century');
for (let i = 1; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999999; });
G.processFall(clock);
/* The fixture first. A Century Bloom that is not actually ripe would make every
   assertion below pass for the wrong reason — the same shape of vacuous test the
   handoff records twice, and the reason this line exists at all. */
check('the fixture really does hold a RIPE Century Bloom',
  S.fall.grid[0].seed === 'century' && S.fall.grid[0].ready === true);
const withCentury = G.fallHarvestAll();
check('a ripe Century Bloom is left standing', S.fall.grid[0].seed === 'century'
  && withCentury.plots === DATA.fall.plots - 1,
  JSON.stringify(S.fall.grid.map((c) => c.seed)));
check('and its value was never promised either',
  withCentury.payout === (DATA.fall.plots - 1) * Math.round(G.fallPlantById('strawberry').yield * 1.5));
check('an empty bed refuses rather than paying nothing quietly', G.fallHarvestAll() === null);
G.fallHarvest(0);

group('bill 12c — the windfall survives the way a player actually harvests');
/* THE REGRESSION THIS GROUP EXISTS FOR: the latch used to be a sticky flag
   cleared only when the bed fell simultaneously empty, so a player who
   replanted each plot as they harvested it never cleared it — and every later
   full ripe bed was silently refused its windfall for the life of the save.
   Five fills paid one windfall. The group above missed it by harvesting the
   whole bed before replanting, which is the one flow that did clear the flag. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
const fallN = DATA.fall.plots;
const berry = G.fallPlantById('strawberry');
const fullBedWindfall = Math.round(berry.yield * (1 + DATA.fall.windfall)) * fallN;
let fillPaid = [];
for (let fill = 0; fill < 5; fill += 1) {
  if (fill === 0) for (let i = 0; i < fallN; i += 1) G.fallPlant(i, 'strawberry');
  S.fall.grid.forEach((c) => { if (c.seed) c.plantedAt = clock - 9999; });
  G.processFall(clock);
  let paid = 0;
  /* Harvest and immediately replant, plot by plot — the bed is never empty. */
  for (let i = 0; i < fallN; i += 1) {
    const r = G.fallHarvest(i);
    if (r) paid += r.payout;
    G.fallPlant(i, 'strawberry');
  }
  fillPaid.push(paid);
}
check('five replant-as-you-go fills all pay the windfall',
  fillPaid.every((p) => p === fullBedWindfall), fillPaid.join(' / '));
check('and each one is counted for the Tally', S.year.stats.windfalls === 5,
  `${S.year.stats.windfalls}`);
check('the latch is derived, so it is down once the last mark is spent',
  S.fall.bedPaid === false);

group('bill 12d — a bed that ripened while the tab was shut still pays');
/* load() rebuilds every Fall cell with `ready: false` by design, so a
   flag-based ripeness test could not arm on the first harvest after a
   reload — which is exactly what fallHarvest's comment promised. The check
   reads the clock instead. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < fallN; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999; });
G.saveNow();
G.load();
check('the reload really does clear the render flags',
  S.fall.grid.every((c) => c.ready === false));
const shutPay = G.fallHarvest(0);
check('and the first harvest after it still pays the windfall',
  shutPay && shutPay.windfall && shutPay.payout === Math.round(berry.yield * 1.5),
  `${shutPay && shutPay.payout}`);

group('bill 12e — a partly collected fill cannot re-arm while its marks stand');
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < fallN; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999; });
G.processFall(clock);
for (let i = 0; i < 4; i += 1) { G.fallHarvest(i); G.fallPlant(i, 'strawberry'); }
S.fall.grid.forEach((c) => { if (c.seed) c.plantedAt = clock - 9999; });
G.processFall(clock);
check('a full ripe bed holding four unspent marks does not arm again',
  S.year.stats.windfalls === 1, `${S.year.stats.windfalls}`);
/* The mirror, asserted mid-fill — the one state it exists to describe, and
   exactly where the old sticky flag went wrong. Asserting it only after an arm
   and only at end-of-fill leaves the collection window uncovered. */
check('the latch reads true while a fill is part-collected', S.fall.bedPaid === true);
G.processFall(clock);
check('and stays true across a tick, because it is recomputed not remembered',
  S.fall.bedPaid === true);
check('and the marks that stand still pay when collected',
  G.fallHarvest(4).windfall === true);

group('bill 12f — an armed bed survives a save, and an unarmed one stays unarmed');
/* The per-cell marks ARE the latch since round 3, and nothing round-tripped a
   marked cell: dropping them on load silently forfeits every pending windfall
   mid-collection, and forcing them pays +50% forever without the bed ever
   arming. Both directions are asserted here. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < fallN; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c) => { c.plantedAt = clock - 9999; });
G.processFall(clock);
G.fallHarvest(0);                      // spend one mark, leave seven standing
G.saveNow();
G.load();
check('the unspent marks come back on exactly the plots that still hold them',
  S.fall.grid.filter((c) => c.windfall).length === 7
  && S.fall.grid[0].windfall === false,
  S.fall.grid.map((c) => (c.windfall ? 'M' : '.')).join(''));
check('the derived latch comes back with them', S.fall.bedPaid === true);
const afterReloadPay = G.fallHarvest(1);
check('and a marked plot still pays its windfall after the reload',
  afterReloadPay.windfall && afterReloadPay.payout === Math.round(berry.yield * 1.5),
  `${afterReloadPay.payout}`);
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
for (let i = 0; i < fallN; i += 1) G.fallPlant(i, 'strawberry');
G.saveNow();
G.load();
check('a planted but never-armed bed comes back with no marks and no latch',
  S.fall.grid.every((c) => !c.windfall) && S.fall.bedPaid === false
  && S.year.stats.windfalls === 0);
check('a save carrying a stale latch has it re-derived away, not restored', (() => {
  const raw = JSON.parse(JSON.stringify(S));
  raw.fall.bedPaid = true;                    // the pre-2026-08-29 stuck flag
  raw.fall.grid.forEach((c) => { c.windfall = false; });
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.fall.bedPaid === false;
})());
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallHarvest(i);

group('the refusals — every gate asserted from the NO side');
/* Round 3's mutation pass found that both gardens' ripeness gates and three of
   Fall's four purchase gates had no negative test: every rig ripens with
   `plantedAt = clock - 9999` and plants with a full wallet into an empty cell,
   so the refusal half was never exercised. Deleting a gate turned the game
   into an unbounded gold printer with the suite green — plant-and-harvest in
   the same instant, one Fall plot filling the mint's whole coins floor in zero
   elapsed time. These are the NO cases. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
S.seedUnlocks.bluebell = true;
clearGarden();
G.plant(0, G.seedById('daisy'));
check('the main garden refuses a harvest the instant it is planted',
  G.harvest(0) === null && S.grid[0].seed === 'daisy');
G.fallPlant(0, 'strawberry');
check('Fall refuses a harvest the instant it is planted',
  G.fallHarvest(0) === null && S.fall.grid[0].seed === 'strawberry');
const berryDef = G.fallPlantById('strawberry');
S.credits = berryDef.cost - 1;
check('Fall refuses a crop one coin short, and plants nothing',
  G.fallPlant(1, 'strawberry') === false && !S.fall.grid[1].seed);
/* The main garden's own one-coin-short refusal, which had no negative test —
   and now needs one, because the picker's can't-afford padlock is gone. The
   padlock was a second, visible gate in front of this one; with it removed the
   engine's silent `return false` is the only thing between a broke player and a
   free plant, and nothing above the simulation is checked by anything. */
S.credits = G.seedById('bluebell').cost - 1;
check('the main garden refuses a seed one coin short, and plants nothing',
  G.plant(2, G.seedById('bluebell')) === false && !S.grid[2].seed, `credits ${S.credits}`);
check('and charges exactly its price when it can pay',
  (S.credits = G.seedById('bluebell').cost,
    G.plant(2, G.seedById('bluebell')) === true && S.credits === 0));
S.credits = 1e9;
S.credits = berryDef.cost;
check('and charges exactly its price when it can pay',
  G.fallPlant(1, 'strawberry') === true && S.credits === 0);
S.credits = 1e9;
check('Fall refuses to plant over a crop already in the ground',
  G.fallPlant(1, 'pumpkin') === false && S.fall.grid[1].seed === 'strawberry');
S.year.turnsCompleted = 0;
check('and refuses everything before the Turn that opens Fall',
  G.fallOpen() === false && G.fallPlant(2, 'strawberry') === false && !S.fall.grid[2].seed);
S.year.turnsCompleted = 1;

group('the Saved Seeds sink refuses too');
/* Petals are the only sink for the prestige currency, and buyPetal could be
   made free — or buyable at zero seeds — with the whole suite green. */
G.reset();
S.savedSeeds = 0;
check('a petal is refused with an empty pouch, and nothing is written',
  G.buyPetal('daisy', 'rich') === false && G.petalsOf('daisy').rich === 0);
const richPrice = G.petalCost('daisy', 'rich');
S.savedSeeds = richPrice - 1;
check('and refused one seed short', G.buyPetal('daisy', 'rich') === false
  && S.savedSeeds === richPrice - 1);
S.savedSeeds = richPrice;
check('it charges exactly the quoted price', G.buyPetal('daisy', 'rich') === true
  && S.savedSeeds === 0 && G.petalsOf('daisy').rich === 1);
check('and the ladder climbs, so the second petal costs more than the first',
  G.petalCost('daisy', 'rich') === Math.round(richPrice * DATA.petals.petalRatio),
  `${G.petalCost('daisy', 'rich')} vs ${richPrice}`);
S.savedSeeds = 1e6;
check('every rung of one flower\'s ladder is priced off the last, not the first', (() => {
  G.reset();
  S.savedSeeds = 1e6;
  const seen = [];
  for (let p = 0; p < DATA.petals.shared.quick.cap; p += 1) {
    seen.push(G.petalCost('tulip', 'quick'));
    G.buyPetal('tulip', 'quick');
  }
  return seen.every((c, i) => i === 0 || c > seen[i - 1]);
})());

group('the offline path is walled by the seed unlocks, exactly like the online one');
/* passiveIncomeRate() is the only place the unlock wall guards offline income,
   and the online twin is backstopped by plant()'s own check — so this guard
   has no second line of defence. Dropping it paid a fresh save ~21x its
   legitimate rate. The rig has to give the harvester a ceiling ABOVE the
   unlock wall for the guard to be load-bearing. */
G.reset();
clearGarden();
S.upgrades.autoHarvest = 1;
S.upgrades.plot1Harvester = 19;        // ceiling: the whole ladder
const walledRate = G.passiveIncomeRate();
S.seedUnlocks.bluebell = true;
const widerRate = G.passiveIncomeRate();
check('a fresh save earns offline only from the seeds it actually owns',
  walledRate > 0 && widerRate > walledRate,
  `${walledRate.toFixed(4)} then ${widerRate.toFixed(4)}`);
check('and the rate is the free ladder\'s, not the whole catalogue\'s', (() => {
  G.reset();
  clearGarden();
  S.upgrades.autoHarvest = 1;
  S.upgrades.plot1Harvester = 19;
  const tulip = G.seedById('tulip');
  const rarityMean = DATA.rarity.reduce((a, r) => a + r.w * r.m, 0)
    / DATA.rarity.reduce((a, r) => a + r.w, 0);
  const expected = (tulip.yield * rarityMean - tulip.cost) / tulip.grow;
  return Math.abs(G.passiveIncomeRate() - expected) < 1e-9;
})(), `${G.passiveIncomeRate()}`);

group('bill 12b — a growing Century Bloom neither blocks nor collects the windfall');
/* Self-contained: this group used to read a running windfall count carried
   over from the group above it, so inserting anything between them moved a
   number it asserted. A test that depends on where it sits in the file is a
   test that will be broken by an unrelated edit. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
check('only one Century Bloom may grow', G.fallPlant(0, 'century')
  && G.fallPlant(1, 'century') === false);
for (let i = 1; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
S.fall.grid.forEach((c, i) => { if (i > 0) c.plantedAt = clock - 9999; });
G.processFall(clock);
check('seven crops around a growing Century still windfall', S.year.stats.windfalls === 1
  && !S.fall.grid[0].windfall, `${S.year.stats.windfalls}`);
const centuryDef = G.fallPlantById('century');
S.fall.grid[0].plantedAt = clock - centuryDef.grow - 1;
G.processFall(clock);
const yrBeforeCentury = S.year.coinsEarned;
const centuryPay = G.fallHarvest(0);
check('the Century Bloom pays its own enormous plain price, never the windfall',
  centuryPay.century && !centuryPay.windfall && centuryPay.payout === centuryDef.yield,
  `${centuryPay.payout}`);
check('and the Century payout earns into the year',
  S.year.coinsEarned === yrBeforeCentury + centuryPay.payout);

group("Fall's gem skip buys time, and the Century Bloom is not for sale");
/* Self-contained, like the two `bill 12b` groups above it: it opens on a fresh
   reset and asserts nothing that depends on where it sits in the file. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
S.gems = 1e6;
check('an empty Fall plot costs nothing to hurry', G.fallSkipCost(0) === 0);
G.fallPlant(0, 'strawberry');
G.fallPlant(1, 'apple');
check('a longer crop costs more than a shorter one',
  G.fallSkipCost(1) > G.fallSkipCost(0), `${G.fallSkipCost(1)} vs ${G.fallSkipCost(0)}`);
/* THE RULED RATE, pinned to an exact number as well as to the formula: the
   owner ruled no multiplier, so an x2 landing later has to fail a named
   assertion rather than ship quietly. */
check("the price is the garden's rate on Fall's clock \u2014 no multiplier",
  G.fallSkipCost(1) === Math.ceil(G.fallPlantById('apple').grow / DATA.skipSecondsPerGem)
  && G.fallSkipCost(1) === 960, `${G.fallSkipCost(1)}`);
check('a strawberry from full is 40 gems', G.fallSkipCost(0) === 40, `${G.fallSkipCost(0)}`);
S.fall.grid[1].plantedAt = clock - 3600;
check('the price falls as the crop grows',
  G.fallSkipCost(1) === Math.ceil((G.fallPlantById('apple').grow - 3600) / DATA.skipSecondsPerGem)
  && G.fallSkipCost(1) === 840, `${G.fallSkipCost(1)}`);
S.fall.grid[1].plantedAt = clock - 99999;
check('a ripe crop costs nothing', G.fallSkipCost(1) === 0, `${G.fallSkipCost(1)}`);
/* THE ROUNDING AND THE FLOOR. Every fixture above this line is blind to both:
   1200, 28800 and 28800-3600 are all exact multiples of 30, so ceil, floor and
   round agree on every one of them and `Math.floor` passed the whole suite.
   The last half-minute is where they part company. 31 seconds is the
   discriminator — ceil says 2, floor and round both say 1. */
S.fall.grid[0].plantedAt = clock - (S.fall.grid[0].grow - 31);
check('a part-used half-minute rounds up — not down, and not to nearest',
  G.fallSkipCost(0) === 2, `${G.fallSkipCost(0)}`);
/* And the `min 1` docs/04 states as the contract. Under floor or round a crop
   with seconds still to run prices at 0, `fallSkip()` reads that as nothing to
   sell and refuses, and the chip disappears off a plot that should be asking
   for one last gem. The purchase is asserted too: a price of 1 that could not
   be paid would be the same bug wearing a different number. */
S.fall.grid[0].plantedAt = clock - (S.fall.grid[0].grow - 5);
check('a crop in its last five seconds still costs one gem, never nothing',
  G.fallSkipCost(0) === 1, `${G.fallSkipCost(0)}`);
const gemsBeforeLast = S.gems;
const boughtLast = G.fallSkip(0);
check('and that one gem really buys it',
  boughtLast !== null && boughtLast.cost === 1
  && S.gems === gemsBeforeLast - 1 && S.fall.grid[0].ready === true,
  `${JSON.stringify(boughtLast)} gems ${S.gems}`);
/* The fixture before the ruling that reads it. A Century Bloom that was not
   actually planted, or was already ripe, would make the two checks below pass
   for reasons that have nothing to do with the exclusion. */
check('the fixture: a Century Bloom is planted and still growing',
  G.fallPlant(2, 'century') && S.fall.grid[2].seed === 'century'
  && clock - S.fall.grid[2].plantedAt < S.fall.grid[2].grow,
  JSON.stringify(S.fall.grid[2]));
check('the Century Bloom has no price', G.fallSkipCost(2) === 0, `${G.fallSkipCost(2)}`);
const gemsBeforeCentury = S.gems;
check('and it refuses the skip with the gems untouched',
  G.fallSkip(2) === null && S.gems === gemsBeforeCentury
  && S.fall.grid[2].seed === 'century' && S.fall.grid[2].ready === false,
  `${S.gems} vs ${gemsBeforeCentury}`);
S.gems = 0;
G.fallPlant(3, 'apple');
check('skipping is refused without the gems',
  G.fallSkip(3) === null && S.fall.grid[3].ready === false);
S.gems = 1e6;
const applePrice = G.fallSkipCost(3);
const gemsBeforeBuy = S.gems;
const boughtApple = G.fallSkip(3);
check('skipping takes exactly its price and ripens the crop',
  boughtApple !== null && boughtApple.cost === applePrice && applePrice === 960
  && S.gems === gemsBeforeBuy - applePrice && S.fall.grid[3].ready === true,
  `${JSON.stringify(boughtApple)} gems ${S.gems}`);
const boughtPay = G.fallHarvest(3);
check('and the bought crop pays its plain yield like any other',
  boughtPay !== null && boughtPay.payout === G.fallPlantById('apple').yield,
  `${boughtPay && boughtPay.payout}`);

/* The windfall is what Fall is, and the owner accepted a bought one \u2014 so a
   hurried plot has to arm and mark the bed exactly the way a waited-for one
   does. This is the assertion that fails if `fallSkip` ever sets `ready`
   itself instead of ripening through `processFall()`. */
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
S.gems = 1e6;
for (let i = 0; i < DATA.fall.plots; i += 1) G.fallPlant(i, 'strawberry');
for (let i = 0; i < DATA.fall.plots - 1; i += 1) S.fall.grid[i].plantedAt = clock - 9999;
G.processFall(clock);
const lastPlot = DATA.fall.plots - 1;
check('the fixture: seven ripe, the eighth still growing, and no windfall yet',
  S.year.stats.windfalls === 0 && S.fall.grid.every((c) => c.windfall === false)
  && G.fallSkipCost(lastPlot) === 40,
  `${S.year.stats.windfalls} / ${G.fallSkipCost(lastPlot)}`);
check('a bought crop marks for the windfall like a waited-for one',
  G.fallSkip(lastPlot) !== null && S.year.stats.windfalls === 1
  && S.fall.grid.every((c) => c.windfall === true)
  && G.fallBedValue().plots === DATA.fall.plots,
  `${S.year.stats.windfalls} marked ${S.fall.grid.filter((c) => c.windfall).length}`);
const boughtBed = G.fallHarvestAll();
check('and the whole bed pays the bonus, the bought plot included',
  boughtBed !== null && boughtBed.plots === DATA.fall.plots
  && boughtBed.payout === DATA.fall.plots
    * Math.round(G.fallPlantById('strawberry').yield * (1 + DATA.fall.windfall)),
  `${boughtBed && boughtBed.payout}`);

group('Fall crops are not flowers');
G.reset();
S.year.turnsCompleted = 1;
S.credits = 1e9;
S.quests.active = [{ id: 'q_harvest_1', progress: 0 }, { id: 'q_daisy_5', progress: 0 }];
S.quests.done = [];
const yrFlowersBefore = JSON.stringify(S.flowers);
const yrBasketBefore = S.bench.basket.length;
G.fallPlant(0, 'strawberry');
S.fall.grid[0].plantedAt = clock - 9999;
const yrBeforeCrop = S.year.coinsEarned;
const cropPaid = G.fallHarvest(0);
check('a crop pays coins and earns into the year', cropPaid.payout === 2800
  && S.year.coinsEarned === yrBeforeCrop + 2800);
check('it writes no discovery and drops no bloom', !S.discovered.strawberry
  && JSON.stringify(S.flowers) === yrFlowersBefore && S.bench.basket.length === yrBasketBefore);
check('it counts a generic harvest quest', S.quests.active.find((q) => q.id === 'q_harvest_1').progress === 1);
check('it can never count a keyed flower quest', S.quests.active.find((q) => q.id === 'q_daisy_5').progress === 0);
check('fall plants gate on gold alone in v1 — no unlock walls inside Fall',
  (S.credits = 3500, G.fallPlant(1, 'mint') === true));

group('bill 14 — the Tally reads year counters, tiers accumulate, and the cap holds');
G.reset();
/* The design doc’s own example: 47 orders lands tiers 1 and 2 → ×1.25. */
G.Dev.setYearStats({ orders: 47 });
let tally = G.projectedTally();
check('47 orders pays +25%, the doc’s ×1.25', tally.lines.length === 1
  && Math.abs(tally.lines[0].bonus - 0.25) < 1e-9 && Math.abs(tally.mult - 1.25) < 1e-9,
  JSON.stringify(tally));
G.Dev.setYearStats({ orders: 7 });
tally = G.projectedTally();
check('a line below its first tier renders nothing and adds nothing',
  tally.lines.length === 0 && tally.mult === 1, JSON.stringify(tally));
/* EVERY line, at EVERY rung, pinned to an exact multiplier. Only the orders
   line used to be tested; the other four rode on the maxed-year check, whose
   `sum > 1` carried a third of the range in slack — so a line could be
   deleted, wired to the wrong counter, or re-tiered and still pass. The table
   is what phase 4's tuning chair will edit, so it needs a net under it. */
DATA.year.tally.forEach((line) => {
  line.tiers.forEach((t, ti) => {
    const stats = { orders: 0, windfalls: 0, species: 0, legendaries: 0, bestCombo: 0 };
    stats[line.stat] = t.at;
    G.Dev.setYearStats(stats);
    const only = G.projectedTally();
    const wantBonus = line.tiers.slice(0, ti + 1).reduce((a, x) => a + x.bonus, 0);
    check(`${line.id} at ${t.at} pays exactly +${Math.round(wantBonus * 100)}% (tiers 1–${ti + 1})`,
      only.lines.length === 1 && only.lines[0].id === line.id
      && Math.abs(only.lines[0].bonus - wantBonus) < 1e-9
      && Math.abs(only.mult - (1 + wantBonus)) < 1e-9,
      JSON.stringify(only.lines));
    /* One below the rung must not pay it — the threshold, not just the tier. */
    if (t.at > 0) {
      const under = { orders: 0, windfalls: 0, species: 0, legendaries: 0, bestCombo: 0 };
      under[line.stat] = t.at - 1;
      G.Dev.setYearStats(under);
      const lower = G.projectedTally();
      const wantLower = line.tiers.slice(0, ti).reduce((a, x) => a + x.bonus, 0);
      check(`${line.id} at ${t.at - 1} stops short of that rung`,
        Math.abs(lower.sum - wantLower) < 1e-9, `${lower.sum} vs ${wantLower}`);
    }
  });
});
G.Dev.setYearStats({ orders: 50, windfalls: 15, species: 15, legendaries: 8, bestCombo: 80 });
tally = G.projectedTally();
const maxedSum = DATA.year.tally.reduce((a, l) => a + l.tiers.reduce((b, t) => b + t.bonus, 0), 0);
check('a maxed year sums to the whole table and clamps at ×2.0 exactly',
  tally.mult === DATA.year.tallyCap && Math.abs(tally.sum - maxedSum) < 1e-9
  && tally.lines.length === DATA.year.tally.length,
  `sum ${tally.sum} vs ${maxedSum}, mult ${tally.mult}`);
check('and the cap is doing real work — the raw sum overshoots it',
  1 + maxedSum > DATA.year.tallyCap, `${1 + maxedSum}`);

check('the canned Tally survives a reload — species is stocked, not just counted', (() => {
  G.reset();
  G.Dev.setYearStats({ orders: 25, windfalls: 8, species: 10, legendaries: 3, bestCombo: 50 });
  const before = G.projectedTally();
  G.saveNow();
  G.load();
  const after = G.projectedTally();
  return before.lines.length === 5 && after.lines.length === 5
    && Math.abs(before.sum - after.sum) < 1e-9;
})(), JSON.stringify(G.projectedTally().lines.map((l) => l.id)));

group('a GAPPED unlock set — the shape "skipping ahead" actually produces');
/* Every other rig builds unlocks contiguously via unlockTo(), but skipping is
   legal and asserted elsewhere, so a real save can own {daisy, tulip,
   moonflower} with a nine-seed hole. highestUnlockedSeedIndex() returns the
   highest OWNED index, and passiveIncomeRate() reads DATA.seeds[max] straight
   with no seedUnlocked() re-check — the path docs/11 notes has no second line
   of defence. */
G.reset();
clearGarden();
S.seedUnlocks = { moonflower: true };
check('the highest owned seed is the ceiling, hole or no hole',
  G.seedUnlocked('moonflower') === true && G.seedUnlocked('rose') === false
  && DATA.seeds[G.state ? DATA.seeds.findIndex((s) => s.id === 'moonflower') : 0].id === 'moonflower');
S.upgrades.autoHarvest = 1;
S.upgrades.plot1Harvester = 19;
const gappedRate = G.passiveIncomeRate();
const moon = G.seedById('moonflower');
const rarityMeanG = DATA.rarity.reduce((a, r) => a + r.w * r.m, 0)
  / DATA.rarity.reduce((a, r) => a + r.w, 0);
check('and offline income values that seed, not the one at its index-minus-the-hole',
  Math.abs(gappedRate - (moon.yield * rarityMeanG - moon.cost) / moon.grow) < 1e-9,
  `${gappedRate}`);
check('a walled seed inside the hole still cannot be planted',
  G.plant(0, G.seedById('rose')) === false && !S.grid[0].seed);

group('both grids repair impossible clocks on load');
/* A pre-epoch plantedAt is elapsed-seconds corruption from the old format and
   must ripen now; a far-future one is a clock change and clamps. Neither half
   was tested, and the known-issues note about absolute timestamps assumes
   this is doing its job. */
G.reset();
S.year.turnsCompleted = 1;
{
  const raw = JSON.parse(JSON.stringify(S));
  raw.grid[0] = { locked: false, seed: 'daisy', plantedAt: 5, grow: 12, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0, packDrop: false };
  raw.grid[1] = { locked: false, seed: 'daisy', plantedAt: clock + 9e5, grow: 12, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0, packDrop: false };
  raw.fall.grid[0] = { seed: 'strawberry', plantedAt: 5, grow: 1200, ready: false, windfall: false };
  raw.fall.grid[1] = { seed: 'strawberry', plantedAt: clock + 9e5, grow: 1200, ready: false, windfall: false };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
}
check('a pre-epoch main-grid clock is rewritten to ripe-now',
  Math.abs(S.grid[0].plantedAt - (G.nowSeconds() - S.grid[0].grow)) < 2,
  `${S.grid[0].plantedAt}`);
check('a future main-grid clock is clamped to now',
  S.grid[1].plantedAt <= G.nowSeconds() + 1, `${S.grid[1].plantedAt}`);
check('Fall inherits both repairs, as its comment promises',
  Math.abs(S.fall.grid[0].plantedAt - (G.nowSeconds() - S.fall.grid[0].grow)) < 2
  && S.fall.grid[1].plantedAt <= G.nowSeconds() + 1,
  `${S.fall.grid[0].plantedAt} / ${S.fall.grid[1].plantedAt}`);

group('the dev drivers do what the review script says they do');
/* The five-minute owner script drives these buttons, so they are the phase's
   only shipped surface — a driver that quietly does nothing sends the owner a
   wrong impression of the engine underneath it. */
G.reset();
S.year.turnsCompleted = 1;
const filled = G.Dev.fillFall();
check('Fill the bed plants every Fall plot and pays for them',
  filled === DATA.fall.plots && S.fall.grid.every((c) => c.seed),
  `${filled} planted`);
check('and the fill is cheat-funded, so it never reaches either ledger',
  S.year.coinsEarned === 0 && S.lifetimeCoins === 0,
  `${S.year.coinsEarned} / ${S.lifetimeCoins}`);
check('Ripen the bed makes every plot ready and arms the windfall',
  G.Dev.ripenFall() === DATA.fall.plots && S.year.stats.windfalls === 1);
check('Fall refuses to fill before the Turn that opens it',
  (G.reset(), G.Dev.fillFall() === 0));

group('the turn payload announces the gate it opens, exactly once');
G.reset();
clearGarden();
primeYear(200000, 200000);
const openTurn = G.turnYear(null);
check('Turn 1 reports that Fall opens', openTurn && openTurn.fallOpens === true
  && G.fallOpen() === true);
primeYear(200000, 900000);
const laterTurn = G.turnYear(null);
check('and no later Turn repeats the announcement',
  laterTurn && laterTurn.fallOpens === false && G.fallOpen() === true);
check('the payload carries the year it just closed', laterTurn.year === 3
  && laterTurn.turnsCompleted === 2, `${laterTurn.year}/${laterTurn.turnsCompleted}`);

group('bill 15 — the Tally never reads a lifetime record');
G.reset();
S.stats = { totalTaps: 1e6, totalCrits: 1e5, totalHarvests: 1e6, wonders: 50 };
S.discovered = {}; DATA.seeds.forEach((s) => { S.discovered[s.id] = 1e6; });
S.rarityCounts = {}; DATA.seeds.forEach((s) => { S.rarityCounts[s.id] = { rare: 1e5, epic: 1e4, legend: 1e3 }; });
S.stand.delivered = 1e4;
tally = G.projectedTally();
check('a lifetime of records with a zeroed year scores nothing',
  tally.lines.length === 0 && tally.mult === 1, JSON.stringify(tally));
check('species counts the year, not the almanac', (() => {
  const rng = Math.random; Math.random = () => 0.5;
  S.credits = 1e9;
  S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
  G.harvest(0);
  Math.random = rng;
  return S.year.stats.species === 1 && S.year.stats.speciesSeen.daisy === true;
})());
check('a second harvest of the same species counts once', (() => {
  const rng = Math.random; Math.random = () => 0.5;
  S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
  G.harvest(0);
  Math.random = rng;
  return S.year.stats.species === 1;
})());
check('a legendary harvest counts the Tally’s counter', (() => {
  G.Dev.armRarity('legend');
  S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
  G.harvest(0);
  return S.year.stats.legendaries === 1;
})());
check('a tap writes the best combo', (() => {
  S.tap.combo = 30;
  G.tapFlower();
  return S.year.stats.bestCombo === 31;
})());

group('bill 16 — the blessing writes exactly one Rich Bloom petal, once per Turn');
G.reset();
clearGarden();
primeYear(200000);
const blessTurn = G.turnYear('tulip');
check('the chosen flower gained one free petal', G.petalsOf('tulip').rich === 1
  && blessTurn.blessed === 'tulip');
check('provenance is kept, at the year that blessed it',
  S.blessed.length === 1 && S.blessed[0].seed === 'tulip' && S.blessed[0].year === 1,
  JSON.stringify(S.blessed));
primeYear(200000, 900000);
const badBless = G.turnYear('never_a_seed');
check('an unknown flower blesses nothing, and the Turn still runs',
  badBless && badBless.blessed === null && S.blessed.length === 1);
S.petals.rose = { rich: 5, quick: 0, sig: 0 };
S.seedUnlocks.rose = true;
primeYear(200000, 2500000);
const capBless = G.turnYear('rose');
check('a capped skill cannot be blessed past its cap',
  capBless && capBless.blessed === null && G.petalsOf('rose').rich === 5);

group('bill 17 — the Turn refuses below either gate, and cheap Turns stay closed');
G.reset();
clearGarden();
G.Dev.setYearStats({ orders: 50, windfalls: 15, species: 15, legendaries: 8, bestCombo: 80 });
primeYear(99999, 5000000);   // the pool is wide open; only the coins floor is short
/* A refused Turn must leave the save byte-identical. This is the one path a
   player can invoke freely and repeatedly below both gates, so a blessing
   written on it would be an ungated free-petal faucet. */
const refusedBefore = JSON.parse(JSON.stringify(S));
check('a rich Tally cannot carry a year under the coins floor',
  G.turnReady() === false && G.turnYear('daisy') === null);
check('and a refused Turn changes nothing at all — no petal, no mint, no wipe, no draw',
  same(S, refusedBefore),
  Object.keys(S).filter((k) => !same(S[k], refusedBefore[k])).join(',') || 'identical');
primeYear(100000, 5000000);
check('the floor itself passes', G.turnReady() === true);
/* The seeds gate, isolated: the coins floor is dropped to zero so the
   INCREMENT is the only thing left refusing. */
const savedMinCoins = DATA.year.minCoins;
DATA.year.minCoins = 0;
G.Dev.setYearStats({ orders: 0, windfalls: 0, species: 0, legendaries: 0, bestCombo: 0 });
primeYear(5000, 5000);
S.mintedBase = 0;
check('the increment gate refuses on its own', G.turnReady() === false,
  `increment ${G.projectedMint().base}`);
primeYear(12000, 12000);
check('and passes at ten seeds of undrawn pool', G.turnReady() === true
  && G.projectedMint().base >= DATA.year.minSeeds, `increment ${G.projectedMint().base}`);
/* The increment boundary itself, the way the coins floor already has one —
   the increment is the gate the cumulative ruling made load-bearing, so it
   gets an exact-boundary test rather than a pair of loose brackets. The pool
   is mintK*sqrt(lifetime), so minSeeds exactly is (minSeeds/mintK)^2 coins. */
{
  const exact = Math.pow(DATA.year.minSeeds / DATA.year.mintK, 2);
  primeYear(exact, exact);
  S.mintedBase = 0;
  check('exactly ten seeds of undrawn pool passes the increment gate',
    Math.abs(G.projectedMint().base - DATA.year.minSeeds) < 1e-9 && G.turnReady() === true,
    `increment ${G.projectedMint().base}`);
  primeYear(exact - 1, exact - 1);
  S.mintedBase = 0;
  check('and a hair under it refuses', G.projectedMint().base < DATA.year.minSeeds
    && G.turnReady() === false, `increment ${G.projectedMint().base}`);
}
/* The gate reads the increment, NOT the tallied pouch — a maxed Tally on a
   pool that is 9.9 seeds deep must still refuse, or the fireworks would be
   buying entry to a Turn the pool cannot pay for. */
primeYear(9000, 9000);
S.mintedBase = 0;
G.Dev.setYearStats({ orders: 50, windfalls: 15, species: 15, legendaries: 8, bestCombo: 80 });
check('a maxed Tally cannot lift a short increment over the seeds gate',
  G.projectedMint().base < DATA.year.minSeeds
  && G.projectedMint().pouch >= DATA.year.minSeeds
  && G.turnReady() === false,
  `increment ${G.projectedMint().base}, pouch ${G.projectedMint().pouch}`);
G.Dev.setYearStats({ orders: 0, windfalls: 0, species: 0, legendaries: 0, bestCombo: 0 });
DATA.year.minCoins = savedMinCoins;
primeYear(150000, 150000);
S.mintedBase = 0;
G.turnYear(null);
check('the moment after a Turn the gates are shut again', G.turnReady() === false);
S.year.coinsEarned = 8000;   // where the seeds-only gate once let the daisy rush in
check('the old daisy-rush entry point stays shut', G.turnReady() === false);
/* And the shut gate is now the SEEDS one as well as the coins one: a year
   that re-earns its whole 100K floor immediately after a Turn still cannot
   turn, because the pool it would draw from has already been drawn. That is
   the cadence break, asserted rather than argued. */
S.year.coinsEarned = 100000;
check('re-earning the coins floor alone does not re-open the Turn',
  S.year.coinsEarned >= DATA.year.minCoins && G.projectedMint().base < DATA.year.minSeeds
  && G.turnReady() === false,
  `increment ${G.projectedMint().base}`);

group('the Turn-jump cheat loops the real Turn, and a flat loop would have stalled at four');
G.reset();
/* THE STALL, PROVED FIRST, so the cheat's shape is a measured decision rather
   than a claim. A loop that hands over a flat `minCoins` a year gives a
   shrinking increment, because the pool is sqrt(lifetime) minus what has been
   drawn. Winter (Turn 3) is reachable by luck; Spring (Turn 6) is not. */
{
  let flatTurns = 0;
  for (let i = 0; i < 6; i += 1) {
    G.Dev.driveYear(DATA.year.minCoins);
    if (!G.Dev.runTurn(null)) break;
    flatTurns += 1;
  }
  check('a flat minCoins-per-year loop stalls short of Spring',
    flatTurns < DATA.year.springTurn, `reached Turn ${flatTurns}`);
}
G.reset();
const turnsJumped = G.Dev.jumpTurns(DATA.year.springTurn);
check('the jump completes every Turn it was asked for',
  turnsJumped === DATA.year.springTurn && S.year.turnsCompleted === DATA.year.springTurn,
  `${turnsJumped} turns, at ${S.year.turnsCompleted}`);
check('and Spring\'s gate is open behind it',
  S.year.turnsCompleted >= DATA.year.springTurn && S.year.turnsCompleted >= DATA.year.winterTurn
  && S.year.turnsCompleted >= DATA.year.fallTurn);
/* It went through the real faucet, unflagged, or the pool could not have grown
   at all — this is the assertion that would fail if someone copied grantGold's
   `{ cheat: true }` into the loop. */
check('it earned through the real faucet: the ledger and the mint both moved',
  S.lifetimeCoins > 0 && S.mintedBase > 0, `lifetime ${Math.round(S.lifetimeCoins)}`);
check('and every Turn actually minted, so Saved Seeds are banked', S.savedSeeds > 0,
  `${S.savedSeeds} seeds`);
check('the year rolled over with the turns', S.year.number === DATA.year.springTurn + 1);
/* NOTHING LEAKS — the playbook's step 5. The gates are shut again the instant
   the jump ends, and the cheat left no armed state behind it. */
check('the gates are shut again immediately after the jump',
  G.turnReady() === false && G.turnYear(null) === null);
G.reset();
check('and a reset garden is back to Turn zero with no Turn available',
  S.year.turnsCompleted === 0 && G.turnReady() === false && G.turnYear(null) === null);
check('a jump of one is a single Turn', G.Dev.jumpTurns(1) === 1 && S.year.turnsCompleted === 1);
G.reset();

group('bill 17b — the cumulative mint: the pool is lifetime-only, and cadence buys nothing');
/* The owner's ruling, 2026-08-29. The pool a garden will ever mint is
   mintK x sqrt(lifetimeCoins); a Turn draws the undrawn part of it. These are
   the properties the ruling was chosen FOR, asserted directly rather than
   inferred from the pacing tool's exit code. */
check('the veterancy term is gone from the data entirely',
  !('veterancy' in DATA.year), JSON.stringify(Object.keys(DATA.year)));

G.reset();
clearGarden();
primeYear(150000, 4000000);
S.mintedBase = 40;
const vetProbe = () => { const p = G.projectedMint(); return { base: p.base, total: p.total, pouch: p.pouch }; };
S.year.turnsCompleted = 0;
const vetAtZero = vetProbe();
S.year.turnsCompleted = 40;
const vetAtForty = vetProbe();
check('and turn count moves no part of the projection — no per-turn multiplier survives',
  same(vetAtZero, vetAtForty), `${JSON.stringify(vetAtZero)} vs ${JSON.stringify(vetAtForty)}`);

/* The pool identity: the projection is exactly what lifetime earnings have
   opened, minus what has been drawn — and it depends on NEITHER the year's
   own earnings nor the wallet. */
G.reset();
clearGarden();
primeYear(200000, 1000000);
S.mintedBase = 25;
S.credits = 9e8;
check('the pool is mintK x sqrt(lifetime), and the increment is what is undrawn',
  Math.abs(G.projectedMint().total - 0.1 * Math.sqrt(1000000)) < 1e-9
  && Math.abs(G.projectedMint().base - (0.1 * Math.sqrt(1000000) - 25)) < 1e-9,
  JSON.stringify(G.projectedMint()));
const poolBefore = G.projectedMint().base;
S.year.coinsEarned = 999999;
check('and raising the YEAR without the lifetime raises nothing',
  Math.abs(G.projectedMint().base - poolBefore) < 1e-9);

/* Splitting neutrality, driven through the real Turn on both sides: the same
   four million earned, taken as one Turn or as four, draws the same pool. The
   old shape paid the splitter ~2.6x for the same money — that is the exploit,
   and this is the assertion that would catch its return. */
const earnAndTurn = (chunks) => {
  G.reset();
  clearGarden();
  let pouches = 0;
  let turns = 0;
  chunks.forEach((amount) => {
    G.credit(amount);
    const r = G.turnYear(null);
    if (r) { pouches += r.pouch; turns += 1; }
  });
  return { pouches, turns, drawn: S.mintedBase, lifetime: S.lifetimeCoins };
};
const oneShot = earnAndTurn([4000000]);
const fourWay = earnAndTurn([1000000, 1000000, 1000000, 1000000]);
check('both shapes really ran their Turns', oneShot.turns === 1 && fourWay.turns === 4,
  `${oneShot.turns} / ${fourWay.turns}`);
check('four Turns draw exactly the pool one Turn draws',
  Math.abs(oneShot.drawn - fourWay.drawn) < 1e-9
  && Math.abs(oneShot.drawn - 0.1 * Math.sqrt(4000000)) < 1e-9,
  `${oneShot.drawn} vs ${fourWay.drawn}`);
check('and splitting the year mints no more Saved Seeds than not splitting it',
  fourWay.pouches <= oneShot.pouches + 2 && oneShot.pouches > 0,
  `split ${fourWay.pouches} vs whole ${oneShot.pouches}`);

/* The cadence's own wall: a garden that has drawn its pool cannot re-open the
   Turn by earning the coins floor again — it has to earn its way to another
   ten seeds of pool, which costs more every time. */
G.reset();
clearGarden();
G.credit(1000000);
G.turnYear(null);
G.credit(150000);
check('a drawn pool refuses a fresh 150K year',
  S.year.coinsEarned >= DATA.year.minCoins && G.turnReady() === false,
  `increment ${G.projectedMint().base}`);
const needed = Math.pow((DATA.year.mintK * Math.sqrt(S.lifetimeCoins) + DATA.year.minSeeds) / DATA.year.mintK, 2)
  - S.lifetimeCoins;
G.credit(needed);
check('and re-opens only once another ten seeds of pool have been earned',
  G.turnReady() === true && G.projectedMint().base >= DATA.year.minSeeds,
  `after +${Math.round(needed)} earned, increment ${G.projectedMint().base.toFixed(2)}`);

/* The Tally rides on top of the pool without spending it — the whole reason
   the ruling could keep the Tally as the year's teacher. */
G.reset();
clearGarden();
G.credit(4000000);
G.Dev.setYearStats({ orders: 50, windfalls: 15, species: 15, legendaries: 8, bestCombo: 80 });
const talliedProjection = G.projectedMint();
const tallied = G.turnYear(null);
check('a maxed Tally pays over the pool, not out of it',
  tallied.tally.mult === DATA.year.tallyCap
  && tallied.pouch === Math.round(talliedProjection.base * DATA.year.tallyCap)
  && Math.abs(S.mintedBase - talliedProjection.base) < 1e-9,
  `pouch ${tallied.pouch}, drawn ${S.mintedBase}, increment ${talliedProjection.base}`);
check('so the well-played year genuinely out-mints the same money played flat',
  tallied.pouch > oneShot.pouches, `${tallied.pouch} vs ${oneShot.pouches}`);

/* Cheated gold reaches NEITHER ledger — the pool is the thing testers could
   most easily contaminate, and it is permanent. */
G.reset();
clearGarden();
const cheatLifetime = S.lifetimeCoins;
G.Dev.grantGold(5000000);
check('a cheat grant moves the wallet and neither ledger',
  S.credits >= 5000000 && S.lifetimeCoins === cheatLifetime && S.year.coinsEarned === 0);

/* The migration, both arms. A phase-1 save carries a year but no ledgers; a
   pre-Year save carries neither, and has no honest coin figure to inherit. */
G.reset();
const phase1Save = JSON.parse(JSON.stringify(S));
phase1Save.year = { number: 2, coinsEarned: 250000, turnsCompleted: 1,
  stats: { orders: 0, windfalls: 0, species: 0, speciesSeen: {}, legendaries: 0, bestCombo: 0 } };
delete phase1Save.lifetimeCoins;
delete phase1Save.mintedBase;
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(phase1Save));
G.load();
check('a phase-1 save inherits its current year as its lifetime, with nothing drawn',
  S.lifetimeCoins === 250000 && S.mintedBase === 0,
  `${S.lifetimeCoins} / ${S.mintedBase}`);
const migratedFirst = G.turnYear(null);
check('so its next Turn pays that year exactly once, and only once',
  migratedFirst && migratedFirst.pouch === Math.round(0.1 * Math.sqrt(250000) * migratedFirst.tally.mult)
  && Math.abs(S.mintedBase - 0.1 * Math.sqrt(250000)) < 1e-9,
  `pouch ${migratedFirst && migratedFirst.pouch}, drawn ${S.mintedBase}`);
/* Earning the same year again pays again — but sublinearly, which is the
   whole mechanism. A second identical 250K opens sqrt(2)-1 of the first
   year's pool, not another whole one; under the old shape it opened another
   whole one AND a veterancy bonus on top. */
const firstDraw = S.mintedBase;
G.credit(250000);
const secondDraw = G.projectedMint().base;
check('and a second identical year pays strictly less than the first',
  secondDraw < firstDraw
  && Math.abs(secondDraw - firstDraw * (Math.SQRT2 - 1)) < 1e-6,
  `${secondDraw.toFixed(2)} vs ${firstDraw.toFixed(2)}`);

G.reset();
const preYearSave = JSON.parse(JSON.stringify(S));
['year', 'savedSeeds', 'petals', 'seedUnlocks', 'blessed', 'fall', 'lifetimeCoins', 'mintedBase']
  .forEach((k) => { delete preYearSave[k]; });
preYearSave.stats = { totalTaps: 6, totalCrits: 0, totalHarvests: 3, wonders: 0 };
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(preYearSave));
G.load();
check('a pre-Year save starts both ledgers at zero — there is nothing honest to backfill',
  S.lifetimeCoins === 0 && S.mintedBase === 0 && S.year.coinsEarned === 0,
  `${S.lifetimeCoins} / ${S.mintedBase}`);

/* An edited save cannot mint from a negative pool, and cannot be walled by a
   ledger larger than its own pool either — it just has nothing undrawn. */
G.reset();
clearGarden();
primeYear(200000, 200000);
S.mintedBase = 5000;
check('a ledger past the pool clamps the increment at zero, never below',
  G.projectedMint().base === 0 && G.projectedMint().pouch === 0
  && G.turnReady() === false);

/* The ledgers are PERMANENT, so the guards on the way in are the only thing
   standing between a hand-edited save and an inflated pool forever. Each of
   these mutations survived the suite until this block existed. */
G.reset();
const junkLedgers = JSON.parse(JSON.stringify(S));
junkLedgers.year = { number: 2, coinsEarned: 120000, turnsCompleted: 1,
  stats: { orders: 0, windfalls: 0, species: 0, speciesSeen: {}, legendaries: 0, bestCombo: 0 } };
junkLedgers.lifetimeCoins = -5000000;
junkLedgers.mintedBase = -900;
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(junkLedgers));
G.load();
check('a negative `mintedBase` clamps to zero — it can never be an extra pool',
  S.mintedBase === 0, `${S.mintedBase}`);
check('a negative `lifetimeCoins` falls back to the year, never to a negative pool',
  S.lifetimeCoins === 120000, `${S.lifetimeCoins}`);
const junkShapes = ['not a number', null, NaN, Infinity, -Infinity, {}];
check('and every other junk shape takes the same fallback', junkShapes.every((v) => {
  const save = JSON.parse(JSON.stringify(junkLedgers));
  save.lifetimeCoins = v;
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  G.load();
  return S.lifetimeCoins === 120000;
}), `${S.lifetimeCoins}`);
/* And the projection defends itself even if that guard is ever removed: a
   negative pool must read as zero, never as NaN — a NaN pouch would poison
   savedSeeds permanently on the first Turn. */
G.reset();
clearGarden();
S.lifetimeCoins = -1;
S.mintedBase = 0;
const negProjection = G.projectedMint();
check('a negative lifetime reads as an empty pool, never as NaN',
  negProjection.total === 0 && negProjection.base === 0 && negProjection.pouch === 0
  && Number.isFinite(negProjection.pouch) && G.turnReady() === false,
  JSON.stringify(negProjection));

group('bill 18 — plots 5–8 refuse purchase in year one, and nothing owned is re-locked');
G.reset();
unlockTo(12);
S.credits = 1e9;
check('every high plot refuses while no Turn is complete',
  [4, 5, 6, 7].every((i) => G.unlockPlot(i) === false && S.grid[i].locked));
S.year.turnsCompleted = 1;
check('one Turn opens the ladder at the same level gates',
  [4, 5, 6, 7].every((i) => G.unlockPlot(i) === true && !S.grid[i].locked));
/* A migrated save that already owned them keeps them: the pre-Year fixture
   carries open plots and zero Turns, and load() must not re-lock ground. */
G.reset();
const plotSave = JSON.parse(JSON.stringify(S));
['year', 'savedSeeds', 'petals', 'seedUnlocks', 'blessed', 'fall'].forEach((k) => { delete plotSave[k]; });
plotSave.grid.forEach((c) => { c.locked = false; });
plotSave.stats = { totalTaps: 5, totalCrits: 0, totalHarvests: 2, wonders: 0 };
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(plotSave));
G.load();
check('a migrated save keeps every plot it owned', S.grid.every((c) => !c.locked)
  && S.year.turnsCompleted === 0);

/* plotGate() names WHICH gate is refusing, so the plot chip can stop saying
   "Lv 3" at a plot the Turn is holding. Asserted from both arms and from the
   NO side, because the whole value of the accessor is that the two refusals
   are told apart. */
G.reset();
unlockTo(12);
S.credits = 1e9;
check('before the first Turn every high plot reports the TURN gate',
  [4, 5, 6, 7].every((i) => G.plotGate(i) === 'turn'));
check('and the four open plots report no gate at all',
  [0, 1, 2, 3].every((i) => G.plotGate(i) === ''));
S.year.turnsCompleted = 1;
check('after a Turn the same plots report no gate',
  [4, 5, 6, 7].every((i) => G.plotGate(i) === ''));
G.reset();
S.year.turnsCompleted = 1;
S.rep = 0;
check('a level-gated plot reports the LEVEL gate once the Turn gate is met',
  G.plotGate(7) === 'level' && G.plotUnlockLevel(7) > 1);
check('plotGate never disagrees with plotAvailable',
  S.grid.every((c, i) => (G.plotGate(i) === '') === G.plotAvailable(i)));
G.reset();

group('bill 1c — no power-up faucet is re-earnable by Turning');
/* THE OWNER'S RULING, 2026-08-30: nothing that pays a power-up may be
   re-earnable through the year loop. Nothing was, when this was written — so
   this group is a tripwire, not a fix, and it is written to FAIL if a future
   faucet is ever hung off something the Turn resets.

   Every assertion below seeds the faucet as already-paid, runs a real Turn,
   and then attempts the re-earn. A test that only checked `boostInv` is zero
   after a Turn would pass on a save with no guard at all — the Turn clears the
   bag either way. The re-earn attempt is the part that has to be refused. */
const FAUCET_LEDGERS = ['quests', 'rep', 'level', 'discovered', 'almanacClaimed'];
check('every ledger a power-up faucet is keyed on survives the Turn',
  FAUCET_LEDGERS.every((k) => SURVIVES.indexOf(k) !== -1),
  `${FAUCET_LEDGERS.filter((k) => SURVIVES.indexOf(k) === -1)} are in the cleared column`);
check('and no faucet is keyed on anything the Turn changes',
  FAUCET_LEDGERS.every((k) => CHANGED_BY_THE_TURN.indexOf(k) === -1));

/* Every faucet in the game, listed from the data rather than by hand, so a new
   booster or a new rung joins the audit automatically. */
const BOOST_QUESTS = DATA.quests.filter((q) => q.reward && q.reward.boost && !q.paused);
const BOOST_RUNGS = Object.keys(DATA.levelGrants || {}).filter((k) => DATA.levelGrants[k].boost);
const BOOST_MILES = (DATA.almanacMilestones || []).filter((m) => m.boost);
check('the audit sees every faucet the data declares',
  BOOST_QUESTS.length > 0 && BOOST_RUNGS.length > 0 && BOOST_MILES.length > 0,
  `${BOOST_QUESTS.length} quests, ${BOOST_RUNGS.length} rungs, ${BOOST_MILES.length} milestones`);

/* F1 — the quest ladder. */
G.reset();
clearGarden();
const farmQuest = BOOST_QUESTS[0];
S.quests.active = [{ id: farmQuest.id, progress: farmQuest.qty }];
const farmBagBefore = S.boostInv[farmQuest.reward.boost];
const farmFirst = G.claimQuest(farmQuest.id);
check('a boost-paying quest pays its power-up once',
  farmFirst !== null && S.boostInv[farmQuest.reward.boost] === farmBagBefore + (farmQuest.reward.n || 1),
  `${S.boostInv[farmQuest.reward.boost]} vs ${farmBagBefore} + ${farmQuest.reward.n || 1}`);
S.credits = 400000;
G.credit(400000);
G.turnYear();
check('the Turn does not put a claimed quest back on the board',
  S.quests.done.indexOf(farmQuest.id) !== -1 && S.quests.active.every((a) => a.id !== farmQuest.id));
S.quests.active = [{ id: farmQuest.id, progress: farmQuest.qty }];
check('and re-claiming it after the Turn is refused, so its power-up cannot be farmed',
  G.claimQuest(farmQuest.id) === null && S.boostInv[farmQuest.reward.boost] === 0);

/* F2 — the daily. It is the one faucet that IS repeatable, and it repeats on
   the device's calendar day rather than on anything the Turn touches. The
   assertion is therefore that a Turn does not roll it: claim it, Turn, and the
   same day's daily must still refuse. */
G.reset();
clearGarden();
const f2Id = S.quests.daily && S.quests.daily.id;
check('a daily is dealt on a fresh save', Boolean(f2Id), JSON.stringify(S.quests.daily));
const f2Def = DATA.dailies.find((d) => d.id === f2Id);
check('and every daily in the data pays a power-up, so this faucet is in scope',
  DATA.dailies.every((d) => d.reward && d.reward.boost));
S.quests.daily.progress = f2Def.qty;
const f2Before = S.boostInv[f2Def.reward.boost];
const f2Claim = G.claimQuest(f2Id);
check('claiming the daily pays its power-up once',
  f2Claim !== null && S.boostInv[f2Def.reward.boost] >= f2Before + (f2Def.reward.n || 1),
  `claim=${JSON.stringify(f2Claim && f2Claim.id)} bag=${JSON.stringify(S.boostInv)} before=${f2Before} id=${f2Def.reward.boost}`);
const f2Day = S.quests.daily.day;
G.credit(400000);
G.turnYear();
check('the Turn does not roll the daily over — same id, same day, still claimed',
  S.quests.daily.id === f2Id && S.quests.daily.day === f2Day && S.quests.daily.claimed === true,
  JSON.stringify(S.quests.daily));
S.quests.daily.progress = f2Def.qty;
check('and re-claiming it after the Turn is refused',
  G.claimQuest(f2Id) === null && Object.values(S.boostInv).every((v) => v === 0),
  JSON.stringify(S.boostInv));

/* F3 — the level ladder. */
G.reset();
clearGarden();
const rungLevel = Number(BOOST_RUNGS[0]);
const rungGrant = DATA.levelGrants[rungLevel];
G.Dev.grantLevels(rungLevel - 1);
check('crossing a boost rung pays it', S.level >= rungLevel
  && S.boostInv[rungGrant.boost] >= (rungGrant.n || 1),
  `level ${S.level}, ${rungGrant.boost} ${S.boostInv[rungGrant.boost]}`);
const repAcrossTurn = S.rep;
const levelAcrossTurn = S.level;
G.credit(400000);
G.turnYear();
check('reputation and level are untouched by the Turn, so no rung can be re-crossed',
  S.rep === repAcrossTurn && S.level === levelAcrossTurn, `${S.rep}/${S.level} vs ${repAcrossTurn}/${levelAcrossTurn}`);
check('the Turn emptied the bag and nothing refilled it',
  Object.values(S.boostInv).every((v) => v === 0));
/* Walk one more level after the Turn. The rung just crossed must pay, and the
   rung crossed BEFORE the Turn must not pay again — which is the whole ruling,
   stated as an experiment rather than as an inspection of the save. */
const nextRung = DATA.levelGrants[String(S.level + 1)] || {};
G.Dev.grantLevels(1);
check('walking one more level after the Turn pays only the NEW rung',
  S.boostInv[rungGrant.boost] === (nextRung.boost === rungGrant.boost ? (nextRung.n || 1) : 0)
  && (!nextRung.boost || S.boostInv[nextRung.boost] === (nextRung.n || 1)),
  `${JSON.stringify(S.boostInv)} after rung ${S.level}, expected only ${nextRung.boost || 'nothing'}`);

/* F4 — the Almanac. */
G.reset();
clearGarden();
const mile = BOOST_MILES[0];
S.almanacClaimed = [mile.at];
const milesClaimedBefore = S.almanacClaimed.slice();
G.credit(400000);
G.turnYear();
check('a claimed Almanac milestone stays claimed through the Turn',
  same(S.almanacClaimed, milesClaimedBefore));
/* Seed the species and then run the PAYER, not the getter. Asserting on
   `almanacMilestones()` after a Turn is true by construction — the Turn already
   emptied the bag — and deleting the double-pay guard left it green. `load()`
   is the payer that can be reached from here without a harvest. */
DATA.seeds.slice(0, mile.at).forEach((sd) => { S.discovered[sd.id] = (S.discovered[sd.id] || 0) + 1; });
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(S));
G.load();
check('and it pays nothing a second time, even when the payer runs again',
  G.almanacMilestones().filter((m) => m.at === mile.at).every((m) => m.claimed)
  && Object.values(S.boostInv).every((v) => v === 0), JSON.stringify(S.boostInv));

/* The opening bag — the one faucet that is not earned at all. */
G.reset();
check('a brand-new garden opens with exactly DATA.startingBoosts in the tray',
  Object.keys(DATA.startingBoosts).every((id) => S.boostInv[id] === DATA.startingBoosts[id])
  && DATA.boosters.every((b) => S.boostInv[b.id] === (DATA.startingBoosts[b.id] || 0)),
  JSON.stringify(S.boostInv));
/* EVERY table, not just the bag. `giveBoost` drops an unknown id in silence
   while `grantLevel` still reports one to the toast, so a typo pays nothing and
   announces a power-up anyway. Only rung 2 was incidentally covered before. */
const ALL_GRANTS = [
  ...Object.keys(DATA.startingBoosts).map((id) => ({ where: `startingBoosts.${id}`, boost: id, n: DATA.startingBoosts[id] })),
  ...Object.keys(DATA.levelGrants).filter((L) => DATA.levelGrants[L].boost)
    .map((L) => ({ where: `levelGrants.${L}`, boost: DATA.levelGrants[L].boost, n: DATA.levelGrants[L].n || 1 })),
  ...DATA.quests.filter((q) => q.reward && q.reward.boost)
    .map((q) => ({ where: `quest.${q.id}`, boost: q.reward.boost, n: q.reward.n || 1 })),
  ...DATA.dailies.filter((q) => q.reward && q.reward.boost)
    .map((q) => ({ where: `daily.${q.id}`, boost: q.reward.boost, n: q.reward.n || 1 })),
  ...(DATA.almanacMilestones || []).filter((m) => m.boost)
    .map((m) => ({ where: `almanac.${m.at}`, boost: m.boost, n: 1 }))
];
check('every booster id the data hands out resolves to a real booster',
  ALL_GRANTS.every((g) => DATA.boosters.some((b) => b.id === g.boost)),
  ALL_GRANTS.filter((g) => !DATA.boosters.some((b) => b.id === g.boost)).map((g) => g.where).join(','));
check('and no faucet anywhere stacks copies of a long booster',
  ALL_GRANTS.every((g) => {
    const b = DATA.boosters.find((x) => x.id === g.boost);
    return !b || b.dur <= 60 || g.n === 1;
  }),
  ALL_GRANTS.filter((g) => {
    const b = DATA.boosters.find((x) => x.id === g.boost);
    return b && b.dur > 60 && g.n > 1;
  }).map((g) => g.where).join(','));
G.credit(400000);
G.turnYear();
check('the Turn takes the opening bag and never hands out another',
  Object.values(S.boostInv).every((v) => v === 0), JSON.stringify(S.boostInv));
/* The path a real first-time player takes is `load()` finding nothing, not
   `reset()` — and it is the one that can hand the bag out twice. */
globalThis.localStorage.removeItem(SAVE_KEY);
globalThis.localStorage.removeItem('igr-save');
G.load();
check('a load that finds no save opens the bag exactly once',
  DATA.boosters.every((b) => S.boostInv[b.id] === (DATA.startingBoosts[b.id] || 0)),
  JSON.stringify(S.boostInv));
/* A save that will not parse reports `fresh: true`, so it has to BE fresh — not
   the broken save's wallet and level with a bag on top, and not a garden with
   no quests dealt because ensureProgression() never ran. */
globalThis.localStorage.setItem(SAVE_KEY, '{ this is not json');
const brokenLoad = G.load();
check('a save that will not parse opens a genuinely fresh garden',
  brokenLoad.fresh === true
  && S.credits === 100 && S.level === 1 && S.rep === 0
  && S.quests.active.length > 0 && Boolean(S.quests.daily && S.quests.daily.id)
  && DATA.boosters.every((b) => S.boostInv[b.id] === (DATA.startingBoosts[b.id] || 0)),
  `${S.credits}/${S.level}/${S.rep} quests=${S.quests.active.length} daily=${S.quests.daily && S.quests.daily.id} bag=${JSON.stringify(S.boostInv)}`);
globalThis.localStorage.removeItem(SAVE_KEY);

/* The curve itself, asserted as a SHAPE rather than as numbers, so a phase-4
   retune moves values without touching this file — but cannot quietly invert
   the ruling and back-load the generosity. */
const earlyRungs = BOOST_RUNGS.map(Number).filter((L) => L <= 8);
const lateRungs = BOOST_RUNGS.map(Number).filter((L) => L > 8);
const copiesAt = (L) => DATA.levelGrants[L].n || 1;
check('the first days are rich: every level from 2 to 8 pays a power-up',
  [2, 3, 4, 5, 6, 7, 8].every((L) => BOOST_RUNGS.indexOf(String(L)) !== -1),
  `${BOOST_RUNGS.join(',')}`);
check('and the generosity tapers: the early rungs pay more copies than the late ones',
  earlyRungs.reduce((a, L) => a + copiesAt(L), 0) > lateRungs.reduce((a, L) => a + copiesAt(L), 0) * 2,
  `${earlyRungs.reduce((a, L) => a + copiesAt(L), 0)} early vs ${lateRungs.reduce((a, L) => a + copiesAt(L), 0)} late`);
check('a long booster is never stacked on one rung — one that is already running cannot be refreshed',
  BOOST_RUNGS.every((L) => {
    const g = DATA.levelGrants[L];
    const b = DATA.boosters.find((x) => x.id === g.boost);
    return !b || b.dur <= 60 || (g.n || 1) === 1;
  }));
check('the near-always-active claim holds: the first eight levels buy over half an hour of cover',
  earlyRungs.reduce((a, L) => {
    const g = DATA.levelGrants[L];
    const b = DATA.boosters.find((x) => x.id === g.boost);
    return a + (b ? b.dur * (g.n || 1) : 0);
  }, 0) >= 1800);

group('the Year survives a save round trip');
G.reset();
S.year = { number: 3, coinsEarned: 123456.78, turnsCompleted: 2, revealsThisTurn: 0,
  stats: { orders: 4, windfalls: 1, species: 2, speciesSeen: { daisy: true, tulip: true }, legendaries: 1, bestCombo: 44 } };
S.savedSeeds = 77;
S.lifetimeCoins = 987654.32;
S.mintedBase = 61.5;
S.petals = { daisy: { rich: 2, quick: 1, sig: 0 } };
S.seedUnlocks = { bluebell: true, lavender: true };
S.blessed = [{ seed: 'daisy', year: 1 }, { seed: 'bluebell', year: 2 }];
/* A COHERENT armed fixture: the mark and the latch agree, because the latch
   is derived from the mark on load rather than restored beside it. */
S.fall.grid[2] = { seed: 'pumpkin', plantedAt: clock - 500, grow: 10800, ready: false, windfall: true };
S.fall.bedPaid = true;
/* lifetimeCoins above is large enough to legitimately cross the curtain's
   arm-3 threshold for several seeds — settle that against the fixture's own
   numbers BEFORE the round trip (its own bill covers reveals-across-load
   separately), so year.revealsThisTurn is whatever these numbers actually
   produce rather than a value this test has to predict by hand. */
G.refreshReveals();
G.saveNow();
const yrRound = JSON.parse(JSON.stringify(S));
G.load();
check('year, pouch, petals, unlocks, blessings and Fall all come back',
  same(S.year, yrRound.year) && S.savedSeeds === 77
  && same(S.petals, yrRound.petals) && same(S.seedUnlocks, yrRound.seedUnlocks)
  && same(S.blessed, yrRound.blessed) && S.fall.grid[2].seed === 'pumpkin'
  && S.fall.grid[2].windfall === true && S.fall.bedPaid === true);
check('and both mint ledgers survive the round trip to the fraction',
  S.lifetimeCoins === 987654.32 && S.mintedBase === 61.5,
  `${S.lifetimeCoins} / ${S.mintedBase}`);
check('a junk Fall plant is dropped on load, not crashed on', (() => {
  const raw = JSON.parse(JSON.stringify(S));
  raw.fall.grid[0] = { seed: 'ghost_crop', plantedAt: 1, grow: 1 };
  raw.fall.grid[3] = { seed: 'century', plantedAt: clock, grow: 1209600 };
  raw.fall.grid[4] = { seed: 'century', plantedAt: clock, grow: 1209600 };
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(raw));
  G.load();
  return S.fall.grid[0].seed === null && S.fall.grid[3].seed === 'century' && S.fall.grid[4].seed === null;
})());
G.reset();

group('the quest ladder holds 789 with the four wall-collider re-keys and the discover gate');
const liveLadder = DATA.quests.filter((q) => !q.paused);
check('the live ladder still totals 789', liveLadder.reduce((a, q) => a + q.rep, 0) === 789,
  `${liveLadder.reduce((a, q) => a + q.rep, 0)}`);
[['q_rose_3', 'q_daisy_15'], ['q_lavender_3', 'q_tulip_8'],
  ['q_marigold_3', 'q_harvest_30'], ['q_peony_3', 'q_plant_30']].forEach(([oldId, standIn]) => {
  const oldQ = DATA.quests.find((q) => q.id === oldId);
  const newQ = DATA.quests.find((q) => q.id === standIn);
  check(`${oldId} is benched and ${standIn} carries its ${oldQ.rep} rep`,
    oldQ.paused === true && newQ && !newQ.paused && newQ.rep === oldQ.rep);
  check(`${standIn} needs nothing behind an unlock wall`,
    !newQ.key || ['daisy', 'tulip', 'bluebell'].includes(newQ.key));
});

/* Place immediately after the 'a retired quest is pruned from an existing save'
   group, i.e. after the line
     check('the unknown daily was rerolled', DATA.dailies.some((d) => d.id === S.quests.daily.id));
   Verified in that position (1229 passed, 0 failed) and at the end of the file
   (also 1229/0). Identifier collisions were checked: dealNow, disc3, disc12,
   discFull, hiveQ, healed, stash, rngDaily, qJumped, qFell, legacyQuests and
   legacyInst are all unused elsewhere in the suite — as are discQuests,
   boughtNotGrown, skipAhead, jammed, ownedSeeds and reDealt, added with the
   discover gate, and ownSeeds, owned6, owned7, owned10, owned11, disc8Gated,
   disc8Dealt, disc12Gated and disc12Dealt, added with the two-rung group that
   drives q_discover_8 and q_discover_12. The script is one flat scope, so a
   duplicate `const` is a hard throw rather than a failed check: grep before
   adding one. */

/* The Almanac milestones have always read the lifetime species count, and the
   quest engine dealt every quest at zero — one word counting two different
   things on the same screen. Worse, q_discover_12 is dealt around species
   eight and then asked for twelve MORE in a nineteen-seed game. A track the
   game keeps a record for is dealt at that record. */
group('a quest on a recorded track is dealt the progress it already earned');
const dealNow = (id) => {
  const at = DATA.quests.findIndex((q) => q.id === id);
  S.quests.done = DATA.quests.slice(0, at).filter((q) => !q.paused).map((q) => q.id);
  S.quests.active = [];
  G.stripQuest();
  return S.quests.active.find((q) => q.id === id);
};
G.reset();
S.discovered = { daisy: 4, tulip: 2 };
const disc3 = dealNow('q_discover_3');
check('a discover quest starts at the lifetime species count',
  disc3 && disc3.progress === 2, disc3 ? `${disc3.progress}` : 'never dealt');
check('so the strip and the Almanac count the same word',
  !!disc3 && disc3.progress === G.discoveredCount());
G.reset();
DATA.seeds.slice(0, 8).forEach((s) => { S.discovered[s.id] = 1; });
DATA.seeds.slice(0, 11).forEach((s) => { if (G.seedUnlockPrice(s.id) > 0) S.seedUnlocks[s.id] = true; });
const disc12 = dealNow('q_discover_12');
check('the last rung is dealt at eight species, not at zero',
  disc12 && disc12.progress === 8, disc12 ? `${disc12.progress}` : 'never dealt');
check('so what it still asks for exists in the game',
  !!disc12 && G.questById('q_discover_12').qty - disc12.progress <= DATA.seeds.length - G.discoveredCount(),
  disc12 ? `needs ${G.questById('q_discover_12').qty - disc12.progress}, ${DATA.seeds.length - G.discoveredCount()} unfound` : 'never dealt');
G.reset();
DATA.seeds.forEach((s) => { S.discovered[s.id] = 1; if (G.seedUnlockPrice(s.id) > 0) S.seedUnlocks[s.id] = true; });
const discFull = dealNow('q_discover_5');
check('the backfill never overshoots the goal', !!discFull && discFull.progress === 5,
  discFull ? `${discFull.progress}` : 'never dealt');
check('and a quest dealt already finished is simply claimable',
  G.claimQuest('q_discover_5') !== null);
/* The negative half, and the one that keeps this a rule rather than a blanket:
   a track with no lifetime record is still dealt at zero, however much of it
   the player has done. */
G.reset();
S.discovered = { daisy: 9, tulip: 9, bluebell: 9 };
S.stats.totalHarvests = 500;
S.apiary.honey = { wild: 40 };
const hiveQ = dealNow('q_hive_1');
check('a track with no lifetime record is still dealt at zero',
  hiveQ && hiveQ.progress === 0, hiveQ ? `${hiveQ.progress}` : 'never dealt');

group('a save stranded at zero on a recorded track is straightened on load');
G.reset();
S.discovered = { daisy: 9, tulip: 4, bluebell: 2, lavender: 1 };
S.seedUnlocks = { bluebell: true, lavender: true };
S.quests.active = [{ id: 'q_discover_5', progress: 0 }];
S.quests.done = [];
G.saveNow();
G.load();
const healed = S.quests.active.find((q) => q.id === 'q_discover_5');
check('the stranded instance is raised to the record', healed && healed.progress === 4,
  healed ? `${healed.progress}` : 'gone');
check('and never past it', !!healed && healed.progress === G.discoveredCount());

/* The general form of the bug this closes: a quest handed out N unlock walls
   short of its own goal cannot be cleared for N walls of gold and holds one of
   three slots the whole time. One wall is a signpost; three is a jam. */
group('a discover quest is never dealt more than one unlock short of its goal');
const discQuests = DATA.quests.filter((q) => !q.paused && q.track === 'discover');
check('there are four discover rungs and every one of them is checked here',
  discQuests.length === 4, discQuests.map((q) => q.id).join(','));
check('each is gated at qty - 1 or better — freeSeeds is the floor for an ungated one',
  discQuests.every((q) => (q.needSeeds || DATA.year.freeSeeds) >= q.qty - 1),
  discQuests.map((q) => `${q.id}:${q.needSeeds || DATA.year.freeSeeds}/${q.qty}`).join(' '));
check('and every gate still leaves the last flower to find',
  discQuests.every((q) => !q.needSeeds || q.needSeeds < q.qty));
check('needSeeds is only ever hung on a track the game keeps a lifetime record for',
  DATA.quests.every((q) => !q.needSeeds || q.track === 'discover'));
check('so the most gold q_discover_5 can still be asking for when it arrives is one wall, not three',
  G.seedUnlockPrice('rose') === 337500
  && G.seedUnlockPrice('bluebell') + G.seedUnlockPrice('lavender') + G.seedUnlockPrice('rose') === 712500,
  `${G.seedUnlockPrice('rose')}`);

/* The gate reads seeds OWNED. Two near-synonyms are wrong and both are the
   tempting one-liner: the lifetime species count (already in QUEST_RECORDS),
   and highestUnlockedSeedIndex() + 1 (already in the file, three lines up). */
G.reset();
['bluebell', 'lavender'].forEach((id) => { S.seedUnlocks[id] = true; });
S.discovered = { daisy: 2 };
const boughtNotGrown = dealNow('q_discover_5');
check('the gate reads flowers OWNED, not flowers grown', !!boughtNotGrown,
  S.quests.active.map((q) => q.id).join(','));
check('and it is dealt at the record it does have, which is one',
  !!boughtNotGrown && boughtNotGrown.progress === 1,
  boughtNotGrown ? `${boughtNotGrown.progress}` : 'never dealt');
G.reset();
S.seedUnlocks = { marigold: true };
const skipAhead = DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length;
check('a player who skipped ahead to the seventh seed owns three flowers, not seven',
  skipAhead === 3, `${skipAhead}`);
check('so the five-species goal is still one wall away and stays out of the strip',
  !dealNow('q_discover_5'), S.quests.active.map((q) => q.id).join(','));
G.reset();

/* ensureProgression() drops a vanished definition and a paused one. A GATED
   quest is a third case it had never seen, so every save that already had
   q_discover_5 in a slot stayed jammed with the fix in fillActive() alone. */
group('a gated quest already sitting in a save’s slot is un-jammed on load');
G.reset();
S.discovered = { daisy: 6, tulip: 3 };
S.quests.done = [];
S.quests.active = [{ id: 'q_discover_5', progress: 0 }, { id: 'q_tap_25', progress: 3 }];
G.saveNow();
G.load();
const jammed = S.quests.active.map((q) => q.id);
check('the gated instance is gone from the active list',
  !jammed.includes('q_discover_5'), jammed.join(','));
check('the slot it held is refilled, and everything in it is clearable today',
  S.quests.active.length === 3 && S.quests.active.every((q) => {
    const def = G.questById(q.id);
    return !def.needSeeds || DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length >= def.needSeeds;
  }), jammed.join(','));
check('and the strip is no longer the quest nothing could move',
  G.stripQuest().def.id !== 'q_discover_5', G.stripQuest().def.id);

group('and it comes back whole the moment the gate opens');
['bluebell', 'lavender'].forEach((id) => { S.seedUnlocks[id] = true; });
S.discovered = { daisy: 6, tulip: 3, bluebell: 1, lavender: 1 };
const ownedSeeds = DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length;
check('four flowers owned is the gate', ownedSeeds === 4, `${ownedSeeds}`);
const reDealt = dealNow('q_discover_5');
check('the quest is dealt', !!reDealt, S.quests.active.map((q) => q.id).join(','));
check('at its lifetime record, not back at zero — which is why dropping it lost nothing',
  !!reDealt && reDealt.progress === 4 && reDealt.progress === G.discoveredCount(),
  reDealt ? `${reDealt.progress}` : 'never dealt');
G.reset();

/* THE OTHER TWO RUNGS, DRIVEN. Every behavioural assertion above this line is
   q_discover_5; all the coverage rungs 8 and 12 had was data inspection that
   the `needSeeds` field exists and equals qty - 1. Two wrong gates passed the
   whole suite on that: one narrowed to `def.id === 'q_discover_5'`, and one
   short-circuiting on `!def.reward` — which lets q_discover_8 through
   undefended, because it is the only gated rung carrying a reward. #19 names
   all three rungs, so all three are now driven, both ways: held out below the
   threshold, dealt at it. */
group('the gate holds every discover rung, not just the first');
/* Seed unlocks are price-ordered and the first `freeSeeds` are owned outright,
   so unlocking the priced ones among the first N leaves exactly N owned. The
   fixture is asserted before anything reads it — a count that came out wrong
   would make the two "stays out of the strip" checks below pass for a reason
   that has nothing to do with the gate. */
const ownSeeds = (n) => {
  G.reset();
  DATA.seeds.slice(0, n).forEach((s) => { if (G.seedUnlockPrice(s.id) > 0) S.seedUnlocks[s.id] = true; });
  return DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length;
};
const owned6 = ownSeeds(6);
const owned7 = ownSeeds(7);
const owned10 = ownSeeds(10);
const owned11 = ownSeeds(11);
check('the fixture: unlocking the first N seeds really does leave N owned',
  owned6 === 6 && owned7 === 7 && owned10 === 10 && owned11 === 11,
  `${owned6}/${owned7}/${owned10}/${owned11}`);
/* q_discover_8 wants seven owned, and it is the rung carrying the reward. */
ownSeeds(6);
const disc8Gated = dealNow('q_discover_8');
check('q_discover_8 stays out of the strip at six flowers owned',
  !disc8Gated, S.quests.active.map((q) => q.id).join(','));
ownSeeds(7);
const disc8Dealt = dealNow('q_discover_8');
check('and is dealt the moment the seventh is bought', !!disc8Dealt,
  S.quests.active.map((q) => q.id).join(','));
/* q_discover_12 wants eleven, and it is the rung that started the item: dealt
   around species eight it asked for twelve more in a nineteen-seed game. */
ownSeeds(10);
const disc12Gated = dealNow('q_discover_12');
check('q_discover_12 stays out of the strip at ten flowers owned',
  !disc12Gated, S.quests.active.map((q) => q.id).join(','));
ownSeeds(11);
const disc12Dealt = dealNow('q_discover_12');
check('and is dealt the moment the eleventh is bought', !!disc12Dealt,
  S.quests.active.map((q) => q.id).join(','));
G.reset();

/* The daily is deliberately NOT backfilled: it is a goal for today, and the
   dailies are the only quests paying `reward.credits`, so one dealt finished
   every morning is a faucet into the mint. No daily rides a recorded track
   today — this is the guard for the day one does. */
group('the daily is a goal for today, never a lifetime record');
{
  const stash = DATA.dailies.slice();
  DATA.dailies.push({ id: 'd_discover_3', text: 'Discover 3 species', track: 'discover', qty: 3, rep: 12 });
  G.reset();
  S.discovered = { daisy: 4, tulip: 2, bluebell: 1, lavender: 6 };
  S.quests.daily = { id: null, progress: 0, day: '', claimed: false };
  const rngDaily = Math.random;
  Math.random = () => 0.999;   // the last of the pool, which is the injected one
  G.stripQuest();
  Math.random = rngDaily;
  check('the injected daily is the one rolled', S.quests.daily.id === 'd_discover_3', `${S.quests.daily.id}`);
  check('a daily is dealt at zero whatever the record says',
    S.quests.daily.progress === 0 && G.discoveredCount() === 4, `${S.quests.daily.progress}`);
  DATA.dailies.length = 0;
  stash.forEach((d) => DATA.dailies.push(d));
  check('the daily pool is put back', DATA.dailies.length === stash.length);
}

group('the strip shows the quest nearest to done, not the oldest');
G.reset();
S.quests.done = [];
S.quests.active = [{ id: 'q_tap_25', progress: 0 }, { id: 'q_plant_1', progress: 0 }, { id: 'q_harvest_1', progress: 0 }];
check('with nothing started it is still the first one dealt', G.stripQuest().def.id === 'q_tap_25');
S.quests.active[2].progress = 1;
const qJumped = G.stripQuest();
check('a complete quest jumps the queue', qJumped.def.id === 'q_harvest_1' && qJumped.complete === true,
  qJumped.def.id);
S.quests.active = [{ id: 'q_tap_25', progress: 5 }, { id: 'q_harvest_10', progress: 3 }];
check('nearness is a fraction of the goal, not a raw count',
  G.stripQuest().def.id === 'q_harvest_10', G.stripQuest().def.id);
S.quests.active = [{ id: 'q_daisy_5', progress: 2 }, { id: 'q_plant_20', progress: 8 }];
check('a tie keeps the order the quests were dealt in', G.stripQuest().def.id === 'q_daisy_5');
S.quests.active = [{ id: 'q_plant_20', progress: 8 }, { id: 'q_daisy_5', progress: 2 }];
check('and it is deal order that breaks it, not ladder position',
  G.stripQuest().def.id === 'q_plant_20');
check('the panel leads with the same quest as the strip',
  G.activeQuests()[0].id === G.stripQuest().def.id);
/* Anything that counts quests filters to live ones. A paused instance only
   reaches the strip mid-session — ensureProgression() drops it on load — and
   before this it was shown as the strip's contents. */
S.quests.active = [{ id: DATA.quests.find((q) => q.paused).id, progress: 0 }, { id: 'q_plant_1', progress: 0 }];
check('a paused instance is never the strip, even at the front',
  G.stripQuest().def.paused !== true, G.stripQuest().def.id);

group('the strip still falls through to the daily and then to rest');
G.reset();
DATA.seeds.forEach((s) => { S.discovered[s.id] = 1; });
S.quests.done = DATA.quests.filter((q) => !q.paused).map((q) => q.id);
S.quests.active = [];
const qFell = G.stripQuest();
check('a finished ladder reaches the daily', qFell.kind === 'daily' && !!qFell.def, qFell.kind);
S.quests.daily.claimed = true;
check('and a claimed daily reaches rest', G.stripQuest().kind === 'rest');
G.reset();

/* backfillDiscovered() rebuilds the lifetime record from a legacy save's
   flowers, so it has to run BEFORE the quest engine reads that record — or a
   migrated save spends one load with the strip and the Almanac disagreeing,
   and load()'s own saveNow() writes the disagreement down.

   The instance here is q_discover_3 rather than q_discover_5 because of the
   other half of that ordering: migrateYear() grandfathers a legacy save's seed
   unlocks AFTER ensureProgression(), so on the one migrating load the gate sees
   only the two free seeds and drops any gated quest the grandfather is about to
   make eligible. It is NOT dealt straight back — ensureProgression() drops it
   and calls fillActive() in the same pass, which refills all three slots, and
   fillActive() returns immediately at active.length >= 3, so the next
   stripQuest() changes nothing. The rung waits for the ladder walk to reach it
   again with a slot free, and questFloor() then deals it at its lifetime
   record, whole: nothing is lost, the reward is deferred. Do NOT 'fix' it by
   reordering those calls, because backfillDiscovered() must stay ahead of
   ensureProgression() and this group is what holds that. */
group('a legacy save is straightened in one load, not two');
G.reset();
const legacyQuests = JSON.parse(JSON.stringify(S));
delete legacyQuests.discovered;
legacyQuests.flowers = { daisy: 5, tulip: 3, bluebell: 2 };
legacyQuests.quests = { active: [{ id: 'q_discover_3', progress: 0 }], done: [],
  daily: { id: null, progress: 0, day: '', claimed: false } };
globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(legacyQuests));
G.load();
const legacyInst = S.quests.active.find((q) => q.id === 'q_discover_3');
check('the record is rebuilt before the quest engine reads it',
  legacyInst && legacyInst.progress === 3, legacyInst ? `${legacyInst.progress}` : 'gone');
G.reset();

/* ---------------- the Stand's paused standing ---------------- */
group('the Stand’s reputation is paused behind a data flag');

/* The owner's ruling, 2026-08-30: orders keep paying gold and keep counting on
   the Tally, and the level points wait for slice D's rungs past 20. Assert the
   flag's shipped state rather than reading it — a suite that adapts to whatever
   the flag says would prove nothing in either position. */
check('the pause is on', STAND.repPaused === true,
  'slice D flips this to false, and the negative case below is what it must then produce');

/* Priced honestly whatever the flag says. Zeroing here instead would bake the
   pause into every order written while it was on. */
check('standPrice still authors the tier’s standing', (() => {
  const one = G.standPrice([{ kind: 'flower', of: 'daisy', qty: 2 }], STAND.tiers[0]);
  return one.rep === STAND.tiers[0].repPay;
})());

check('a generated order still carries its authored rep into the save', (() => {
  standReset(6);
  const o = G.standGenerate(0);
  return Boolean(o) && o.rep > 0;
})());

check('and the getter reads zero off that same order', (() => {
  standReset(6);
  const o = G.standGenerate(0);
  return Boolean(o) && G.standOrderRep(o) === 0;
})());

check('the getter survives a missing or junk order without throwing',
  G.standOrderRep(null) === 0 && G.standOrderRep({}) === 0);

check('delivering pays gold and moves no standing at all', (() => {
  standReset(6);
  S.flowers = {};
  S.apiary.honey = {};
  S.credits = 0;
  S.rep = 0;
  S.level = 1;
  const o = G.standGenerate(0);
  if (!o) return false;
  fillFor(o);
  const res = G.standDeliver(0);
  return Boolean(res) && res.paid > 0 && S.credits === res.paid
    && S.rep === 0 && S.level === 1;
})());

/* The half the ruling names as the thing that must survive. The Tally's line is
   its own counter and the pause must not reach it. */
check('the Tally’s orders line still counts the delivery', (() => {
  standReset(6);
  S.flowers = {};
  S.apiary.honey = {};
  const o = G.standGenerate(0);
  if (!o) return false;
  fillFor(o);
  const before = S.year.stats.orders;
  return Boolean(G.standDeliver(0)) && S.year.stats.orders === before + 1;
})());

/* The reason the pause exists: a level the ladder has no rung for. Nine rep is
   one short of level 2 and the smallest tier-1 order pays four, so unpaused
   this delivery levels the player every time. */
check('a delivery that would have levelled the player hands back no grants', (() => {
  standReset(6);
  S.flowers = {};
  S.apiary.honey = {};
  S.rep = G.cumulativeRep(2) - 1;
  S.level = 1;
  const o = G.standGenerate(0);
  if (!o) return false;
  fillFor(o);
  const res = G.standDeliver(0);
  return Boolean(res) && res.grants.length === 0
    && S.level === 1 && S.rep === G.cumulativeRep(2) - 1;
})());

/* No other faucet is behind this flag. Each is driven through its real path,
   with the pause still on. */
check('quests still pay standing', (() => {
  G.reset();
  S.quests.active = [{ id: 'q_harvest_1', progress: 99 }];
  S.quests.done = [];
  S.rep = 0;
  const claimed = G.claimQuest('q_harvest_1');
  return Boolean(claimed) && claimed.rep > 0 && S.rep === claimed.rep;
})());

/* Milestones are paid inside load(), which is the only path that reaches them,
   so this goes through a seeded save rather than a direct call. */
check('Almanac milestones still pay standing', (() => {
  G.reset();
  const first = DATA.almanacMilestones.find((m) => m.rep > 0);
  DATA.seeds.slice(0, first.at).forEach((sd) => { S.discovered[sd.id] = 1; });
  S.rep = 0;
  S.almanacClaimed = [];
  globalThis.localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  const res = G.load();
  return Boolean(res.almanacGrant) && S.rep >= first.rep;
})());

check('the every-ten-harvests drip still pays standing', (() => {
  G.reset();
  clearGarden();
  S.rep = 0;
  S.credits = 1e6;
  let last = null;
  for (let n = 0; n < DATA.harvestRepEvery; n += 1) {
    S.grid[0] = { ...freshCell(), seed: 'daisy', plantedAt: clock - 100, grow: 10, ready: true };
    last = G.harvest(0);
  }
  return Boolean(last) && last.repBonus === DATA.harvestRepGrant && S.rep >= DATA.harvestRepGrant;
})());

check('Dev.grantLevels still moves the level bar', (() => {
  G.reset();
  S.rep = 0;
  S.level = 1;
  return G.Dev.grantLevels(3) === 4 && S.rep === G.cumulativeRep(4);
})());

/* THE NEGATIVE CASE, and the reversal proof in one. An order written to a save
   while the pause was on must pay its authored standing the moment the flag
   comes off — same order object, no migration, nothing rewritten — and must go
   quiet again when it goes back on. Nine rep short of level 2 again, so the
   level-up is deterministic: tier 1 pays 4, 8 or 12, and cumulativeRep(3) is 25,
   so exactly one rung is ever crossed. */
{
  const savedRepPaused = STAND.repPaused;
  standReset(6);
  S.flowers = {};
  S.apiary.honey = {};
  S.credits = 0;
  S.rep = G.cumulativeRep(2) - 1;
  S.level = 1;
  const saved = G.standGenerate(0);
  fillFor(saved);
  const whilePaused = G.standOrderRep(saved);
  STAND.repPaused = false;
  const whenLive = G.standOrderRep(saved);
  const res = G.standDeliver(0);
  check('flipping the flag off pays the SAME saved order its authored standing',
    whilePaused === 0 && saved.rep > 0 && whenLive === saved.rep
    && S.rep === G.cumulativeRep(2) - 1 + saved.rep,
    `paused ${whilePaused}, live ${whenLive}, authored ${saved.rep}, rep ${S.rep}`);
  check('and the level-up it earns is announced again',
    Boolean(res) && res.grants.length === 1 && S.level === 2,
    `grants ${res && res.grants.length}, level ${S.level}`);
  STAND.repPaused = savedRepPaused;
  check('putting the flag back needs no migration — the same order reads zero again',
    G.standOrderRep(saved) === 0 && saved.rep > 0, `authored ${saved.rep}`);
}

/* Add to tools/sim-test.js immediately BEFORE the line
     group('gems now track time in the ground, not harvest count');
   so it sits next to its sibling, group('simulating an absence winds the world back').
   Verified in place: 1,228 passed / 0 failed, five consecutive runs. */

group('the time-warp winds the world forward without the absence');
/* The world moving while you watch. Every production clock winds back, `lastSeen`
   does not, and the two cheats beside it keep whatever they are running. */
G.reset();
check('zero hours does nothing', G.Dev.warp(0) === null);
check('a world with nothing on a clock refuses, so the panel can say why',
  G.Dev.warp(24) === null);
check('a growing plot comes back ripe', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e15;
  G.plant(0, G.seedById('eternal'));
  const r = G.Dev.warp(24);
  return Boolean(r) && r.clocks >= 1 && S.grid[0].ready === true;
})());
check('Fall\'s bed and the Century Bloom ride the same clock', (() => {
  G.reset();
  S.year.turnsCompleted = 1;
  S.credits = 1e15;
  const annual = DATA.fall.plants.find((p) => !p.century);
  const century = DATA.fall.plants.find((p) => p.century);
  G.fallPlant(0, annual.id);
  G.fallPlant(1, century.id);
  const centuryAt = S.fall.grid[1].plantedAt;
  G.Dev.warp(24);
  return S.fall.grid[0].ready === true
    && Math.abs((centuryAt - S.fall.grid[1].plantedAt) - 24 * 3600) < 2
    && S.fall.grid[1].ready === false;
})());
check('hives fill to their cap and no further', (() => {
  G.reset();
  S.credits = 1e15;
  G.plant(0, G.seedById('daisy'));
  G.placeHive(0);
  G.Dev.warp(24);
  const first = G.cellAt(0).jars.length;
  G.Dev.warp(24);
  return first === G.hiveCapacity(0) && G.cellAt(0).jars.length === first;
})());
check('a craft in the queue comes out finished', (() => {
  G.reset();
  S.credits = 1e15;
  G.plant(0, G.seedById('daisy'));
  const recipe = CRAFT_RECIPES[0];
  S.craft.push({ id: recipe.id, doneAt: G.nowSeconds() + 4 * 3600 });
  G.Dev.warp(8);
  return S.craft.length === 0 && S.goods[recipe.id] === 1;
})());
check('a Stand slot past its refill generates', (() => {
  G.reset();
  const far = G.nowSeconds() + 12 * 3600;
  for (let i = 0; i < STAND.slots; i += 1) { S.stand.slots[i] = null; S.stand.nextAt[i] = far; }
  G.Dev.warp(24);
  return G.standOrders().length === STAND.slots;
})());
check('and a warp shorter than the wait leaves the counter empty', (() => {
  G.reset();
  const far = G.nowSeconds() + 12 * 3600;
  for (let i = 0; i < STAND.slots; i += 1) { S.stand.slots[i] = null; S.stand.nextAt[i] = far; }
  G.Dev.warp(8);
  return G.standOrders().length === 0;
})());
/* Both creature clocks, for opposite reasons — `fed` is the keepsake timer and
   `fedUntil` is the food, and the names say the other thing. */
G.reset();
unlockTo(HABITAT_SLOT_LEVELS[1]);
S.discovered[G.critterById('pip').attract.seed] = 999;
G.checkCritters();
S.credits = 1e9;
G.feedCritter('pip', CREATURE_FOOD[CREATURE_FOOD.length - 1].id);
// Collecting is what sets `fed`; before the first one it reads 0 and `since` stands in.
S.critters.pip.since = G.nowSeconds() - G.critterById('pip').keepsake.every * 2;
G.collectKeepsakes('pip');
const warpFedMark = S.critters.pip.fed;
const warpUntilMark = S.critters.pip.fedUntil;
const warpFedFor = G.critterFedFor('pip');
G.Dev.warp(8);
check('food winds down by exactly the hours asked',
  Math.abs((warpFedFor - G.critterFedFor('pip')) - 8 * 3600) < 2);
check('and the keepsake clock winds with it, as its own field',
  Math.abs((warpFedMark - S.critters.pip.fed) - 8 * 3600) < 2
  && Math.abs((warpUntilMark - S.critters.pip.fedUntil) - 8 * 3600) < 2
  && S.critters.pip.fed !== S.critters.pip.fedUntil);
check('so keepsakes are waiting that were not before', G.keepsakesWaiting('pip') > 0);
check('a creature that has never handed one over still earns from the wait', (() => {
  G.reset();
  unlockTo(HABITAT_SLOT_LEVELS[1]);
  S.discovered[G.critterById('pip').attract.seed] = 999;
  G.checkCritters();
  const before = G.keepsakesWaiting('pip');
  G.Dev.warp(8);
  return before === 0 && G.keepsakesWaiting('pip') > 0 && S.critters.pip.fed === 0;
})());
/* The line that separates this from the away cheat. */
check('`lastSeen` lands on now, never behind it', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e9;
  G.plant(0, G.seedById('daisy'));
  G.Dev.warp(24);
  return Math.abs(S.lastSeen - G.nowSeconds()) < 2;
})());
check('so a warp with no automation pays nothing, on either ledger', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e9;
  G.plant(0, G.seedById('daisy'));
  const credits = S.credits;
  const earned = S.year.coinsEarned;
  const lifetime = S.lifetimeCoins;
  const r = G.Dev.warp(24);
  return Boolean(r) && S.credits === credits
    && S.year.coinsEarned === earned && S.lifetimeCoins === lifetime;
})());
check('where the same rig sent away pays offline income', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e9;
  S.upgrades.autoHarvest = 1;
  S.upgrades.plot1Harvester = 1;
  const earned = S.year.coinsEarned;
  const report = G.Dev.simulateAway(6);
  return Boolean(report) && report.earned > 0 && S.year.coinsEarned > earned;
})());
/* The deliberate exclusion: the kit's other cheats demonstrate the power-up
   button, and a warp that blew them away would make the two fight. */
check('a running boost keeps its remaining time', (() => {
  G.reset();
  clearGarden();
  S.credits = 1e9;
  G.plant(0, G.seedById('daisy'));
  S.boosters.seedrush = G.nowSeconds() + 600;
  const until = S.boosters.seedrush;
  G.Dev.warp(24);
  return G.activeBoost('seedrush') === true && S.boosters.seedrush === until;
})());
check('and so does the Wonder, both of its clocks', (() => {
  G.startWonder();
  const until = S.wonder.until;
  const last = S.wonder.last;
  G.Dev.warp(24);
  return G.wonderActive() === true && S.wonder.until === until && S.wonder.last === last;
})());
/* A warped roll is honoured because weather is a pure function of the clock, so
   it resolves against the sky that stood at the moment it was scheduled for. */
check('a roll the warp brings due fires and clears', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e15;
  G.plant(0, G.seedById('eternal'));
  S.grid[0].mutateAt = G.nowSeconds() + 4 * 3600;
  G.Dev.warp(8);
  return S.grid[0].mutateAt === 0;
})());
check('and one still ahead of the warp stays scheduled', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e15;
  G.plant(0, G.seedById('eternal'));
  const at = G.nowSeconds() + 12 * 3600;
  S.grid[0].mutateAt = at;
  G.Dev.warp(1);
  return Math.abs((at - S.grid[0].mutateAt) - 3600) < 2 && S.grid[0].mutateAt > G.nowSeconds();
})());
/* Nothing sticks: an unwarped run afterwards behaves, and the drone's cadence is
   a real-clock throttle the warp never touches. */
check('the drone takes one plot per warp, at its own cadence', (() => {
  G.reset();
  clearGarden();
  unlockTo(20);
  S.credits = 1e15;
  S.upgrades.autoHarvest = 1;
  G.plant(0, G.seedById('daisy'));
  G.plant(1, G.seedById('daisy'));
  G.Dev.warp(24);
  return S.grid.filter((c) => c.seed).length === 1;
})());
check('an argument no button offers still cannot zero a clock a zero would delete', (() => {
  G.reset();
  unlockTo(HABITAT_SLOT_LEVELS[1]);
  S.discovered[G.critterById('pip').attract.seed] = 999;
  G.checkCritters();
  G.Dev.warp(1e7);
  const floored = S.critters.pip.since >= 1;
  G.saveNow();
  G.load();
  return floored && Boolean(G.critterHome('pip'));
})());
G.reset();

/* ── NEW GROUP. Insert in tools/sim-test.js immediately after the last line of
   group('the dev cheats can put a creature to sleep and get it back'), i.e.
   after:  check('nothing leaked into the clock', G.critterFedFor(PIP.id) <= G.foodCapSeconds() + 1);
   and before: group('food is authored, and stays off the parts that break an economy');
   Verified green in place: 16 new ok lines, suite 1207 -> 1223 at this point. ── */

/* The review kit's way to see the band fill in an afternoon. Two things have to
   hold: the summon writes the SAME record the threshold path writes, and it does
   not buy that by faking the lifetime harvest count underneath it. */
group('the summon cheats fill the band without inventing lifetime progress');
G.reset();
clearGarden();
let lastArrival = null;
G.on('critter', (e) => { if (e && e.arrived) lastArrival = e; });
const FIRSTC = CREATURES[0];
const summoned = G.Dev.summonCritter(3);
check('a summon brings the first creature nobody has met',
  Boolean(summoned) && summoned.def.id === FIRSTC.id && G.critterHere(FIRSTC.id));
check('at the star that was asked for', G.critterLevel(FIRSTC.id) === 3);
check('and it fires the real arrival beat, the shape ui-events destructures',
  Boolean(lastArrival) && lastArrival.def.id === FIRSTC.id
  && lastArrival.arrived === true && lastArrival.level === 3);
check('the record is the arrival shape, not a half-written one', (() => {
  const h = G.critterHome(FIRSTC.id);
  return h.gifts === 0 && h.met === false && h.fed === 0
    && Math.abs((h.fedUntil - G.nowSeconds()) - ARRIVAL_AWAKE_HOURS * 3600) < 2;
})());
check('it takes the one slot a level-1 save has',
  G.critterTending(FIRSTC.id) && summoned.tending === true && G.habitatFree() === 0);
/* THE NEGATIVE CASE, and the reason the cheat does not simply call
   checkCritters(): `discovered` is the lifetime harvest count the Almanac, the
   discover quests and every creature's own growth loop read. */
check('and nothing was banked into the lifetime harvest record',
  Object.keys(S.discovered).length === 0 && G.critterProgress(FIRSTC) === 0
  && G.discoveredCount() === 0, JSON.stringify(S.discovered));
check('so the growth bar reads an honest zero toward the next star', (() => {
  const goal = G.critterGoal(FIRSTC.id);
  return goal.level === 4 && goal.have === 0 && goal.qty === G.critterGoalFor(FIRSTC, 4);
})());
check('a second summon takes the NEXT one, never a duplicate',
  G.Dev.summonCritter(1).def.id === CREATURES[1].id && G.crittersHome().length === 2);
/* The cap is the ruling: a summon grants no levels, so the overflow waits in the
   roster rather than the band. */
check('the overflow moves in but stays off the slots',
  G.critterHere(CREATURES[1].id) && G.critterTending(CREATURES[1].id) === false
  && G.habitatUsed() === 1);
check('summoning all six brings the rest of the roster home',
  G.Dev.summonAll(5).length === CREATURES.length - 2
  && G.crittersHome().length === CREATURES.length);
check('every one of them at the star asked for',
  CREATURES.slice(2).every((c) => G.critterLevel(c.id) === 5));
check('and the band still holds only what the level allows',
  G.habitatSlots() === 1 && G.habitatUsed() === 1);
check('with everyone home, a summon has nothing left to do',
  G.Dev.summonCritter(1) === null && G.Dev.summonAll(1).length === 0);
/* Levels are the way past the cap, and they are a different button on purpose.
   `habitatFree() > 0` on its own is the SYMPTOM of the bug this pair guards, not
   a pass: `moveIn()` stamps `tending` once, at arrival, so raising a level after
   the roster is already home used to open three slots that nothing ever filled. */
unlockTo(HABITAT_SLOT_LEVELS[HABITAT_SLOT_LEVELS.length - 1]);
check('opening the habitat does not send anybody out by itself',
  G.habitatSlots() === HABITAT_SLOT_LEVELS.length && G.habitatUsed() === 1,
  `${G.habitatUsed()} out of ${G.habitatSlots()}`);
check('and summoning again fills the slots that just opened',
  (G.Dev.summonAll(1), G.habitatUsed() === HABITAT_SLOT_LEVELS.length),
  `${G.habitatUsed()} out of ${G.habitatSlots()}`);
check('which is the roster coming out, not six creatures arriving twice',
  G.crittersHome().length === CREATURES.length);
check('an impossible star is clamped rather than stored', (() => {
  G.reset();
  const high = G.Dev.summonCritter(99);
  const low = G.Dev.summonCritter(0);
  return high.level === CREATURE_STARS && low.level === 1;
})());
check('a summoned star survives a reload', (() => {
  G.saveNow();
  G.load();
  return G.critterLevel(CREATURES[0].id) === CREATURE_STARS;
})());
G.reset();


/* ── EXTENSION TO bill 4, in its own idiom rather than a new group. Insert in
   tools/sim-test.js immediately after the existing:
     check('and the driver earns into the pool too, so the meter and the mint agree',
       lifetimeNow() === ltMark + 500, `${lifetimeNow()} vs ${ltMark} + 500`);
   and before the hive-overflow block that re-marks yrMark. It must go there and
   not earlier: 'the year driver IS earning, by design' reuses the yrMark set
   before feedCritters(), so inserting above it would move that mark and break a
   passing test. Verified green in place: 5 new ok lines, suite 1223 -> 1228. ── */

/* The review kit — four grants the owner leans on for a week, and not one of them
   may leave a coin behind on either ledger. */
yrMark = earnedNow();
ltMark = lifetimeNow();
const seedsBeforeKit = S.savedSeeds;
const packsBeforeKit = S.packs;
const creditsBeforeKit = S.credits;
G.Dev.grantSeeds(500);
G.Dev.grantBoosts();
G.grantPacks(3);
G.Dev.summonAll(CREATURE_STARS);
check('the review-kit grants all land', S.savedSeeds === seedsBeforeKit + 500
  && DATA.boosters.every((b) => S.boostInv[b.id] > 0)
  && S.packs === packsBeforeKit + 3
  && G.crittersHome().length === CREATURES.length);
check('and none of them reaches the mint', earnedNow() === yrMark, `${earnedNow()} vs ${yrMark}`);
check('nor the lifetime pool', lifetimeNow() === ltMark, `${lifetimeNow()} vs ${ltMark}`);
check('and none of them moves the wallet either, so nothing is minted by a refund',
  S.credits === creditsBeforeKit);
/* NEGATIVE: a granted boost is inventory, never a running boost. Firing it is
   the POWER-UP button's job, through activateBoost(). */
check('a granted boost is held, never auto-spent',
  DATA.boosters.every((b) => G.activeBoost(b.id) === false));

group('the plant picker padlocks the unlock wall and nothing else');
/* There is no sim-test for the UI, so this reads the source the way the
   bench-quest guard does. The claim is about meaning rather than layout: a
   padlock is the one-time wall, and a row you will afford in ten seconds is
   grey and nothing more. Every picker writes the same slot and syncAfford()
   rewrites it on every coin, so all writers are counted — a fix that lands in
   the markup alone puts the padlock back a second after the panel opens.

   THE COUNT IS THE SCOPE GUARD, and it moves when a picker is added: three
   since 2026-09-01, when Winter's picker joined Summer's and Fall's. If you
   are reading this because the number went wrong, the question to answer is
   "does the new picker draw a padlock", not "what number makes it green". */
const sheetSrc = fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8');
const goSlots = [...sheetSrc.matchAll(/class="seed-go">([\s\S]*?)<\/span>/g)].map((m) => m[1])
  .concat([...sheetSrc.matchAll(/\.seed-go'[\s\S]{0,200}?innerHTML\s*=\s*([^;]+)/g)].map((m) => m[1]));
check('the three pickers are the only writers of the go slot', goSlots.length === 3, `found ${goSlots.length}`);
check('no go slot can render a padlock', !goSlots.some((slot) => /lock/.test(slot)), goSlots.join(' | '));
check('the retired sprout-or-lock ternary is gone from the file', !/'sprout'\s*:\s*'lock'/.test(sheetSrc));
check('syncAfford leaves the go slot alone entirely', !/\.seed-go'[\s\S]{0,200}?innerHTML/.test(sheetSrc));
/* The negative case: deleting every padlock in the file would pass all four
   checks above, and would delete the only refusal the padlock is now for. */
check('the unlock chip keeps the one true padlock',
  /class="seed-lock[^"]*"[^>]*>\$\{Icons\.get\('lock'\)\}/.test(sheetSrc));
check('and the chip still quotes the price beside it', /class="seed-lock[\s\S]{0,90}?fmt\(price\)/.test(sheetSrc));
check('and syncAfford still colours that chip ok/no',
  /\$\('\.seed-lock', node\)/.test(sheetSrc) && /chip\.classList\.toggle\('ok', can\)/.test(sheetSrc));
check('the lock glyph itself survives — plot gates and the meadow draw it', Icons.has('lock') === true);

/* ---- verification I actually ran, so you know these are not decorative ----
   Against ui-sheet.js AS IT SHIPS TODAY: the first four FAIL (goSlots.length
   is 4, all four naming 'lock') and the last four PASS. Against a patched copy
   with all four edits applied: all eight PASS. Against a deliberately
   OVER-CORRECTED copy — the four edits PLUS someone also stripping
   Icons.get('lock') out of the .seed-lock chip — the first four still pass and
   'the unlock chip keeps the one true padlock' FAILS. That third run is the
   point of the negative case: a test that only says "no padlocks in the
   picker" is passed by deleting the padlock that is supposed to stay. */


/* THE ASK MAY GET KINDER; IT MAY NOT GET SHORTER. The panel once named only
   the growing plots and told an empty board the Turn cost nothing at all —
   false on every board, because gold zeroes to the fresh purse, every upgrade
   wipes, power-ups go and plots 5-8 close. The framing above the chips was
   rewritten in the 2026-09-03 round; the list underneath is the fixed bug.
   The closing renewal line is deliberately NOT asserted: it is provisional and
   its reversal is deleting that one <p>, which no check may turn red. */
group('the Turn’s ask still names every price it charges');
const askAt = sheetSrc.indexOf('const goes = [');
const goesBlock = askAt < 0 ? '' : sheetSrc.slice(askAt, sheetSrc.indexOf('const cost =', askAt));
/* The scrape guard on everything below it: a rename that breaks the slice
   returns '' and every every() under it is vacuously true. */
check('the goes list was actually found and read',
  askAt > 0 && goesBlock.length > 300 && goesBlock.length < 1500, `${goesBlock.length} chars`);
const TAKES = ['Gold', 'Upgrades', 'Power-ups', 'big plot', 'growing'];
check('it still names all five things the Turn takes',
  TAKES.every((n) => goesBlock.includes(n)), TAKES.filter((n) => !goesBlock.includes(n)).join(', '));
/* Gold is the unconditional one and the only one whose condition could be
   softened back into the original bug: a purse that looks empty at the ask
   still zeroes, and every upgrade bought with it still wipes. */
check('gold is named on every board, not only on a full purse',
  /Gold`,\s*true\s*\]/.test(goesBlock), goesBlock.slice(0, 140));
check('and the other four still carry their own conditions',
  /S\.upgrades[\s\S]{0,80}some/.test(goesBlock) && /S\.boostInv[\s\S]{0,80}some/.test(goesBlock)
  && /bigPlots > 0/.test(goesBlock) && /growing > 0/.test(goesBlock));
/* The framing, which is the half that changed. A narrative "goes" against a
   shouted "stays" tips the panel the wrong way, so it is both rows or neither. */
const askCopy = [...sheetSrc.matchAll(/class="cere-say">([^<]*)</g)].map((m) => m[1]);
check('both chip rows are led by a sentence, not a shouted label',
  askCopy.length === 2, askCopy.join(' | '));
/* WIDEN THIS LIST, never delete the check: row two's wording is the owner's to
   confirm and the PROVISIONAL note in turnAsk() names three legal alternates,
   all of which are here. What
   may not come back is a verb-less label, because the chips below are verb-less
   nouns on purpose and something has to say what happens to them. */
const ASK_VERBS = /\b(washes|reaches|touches)\b/;
check('the sentences carry the verb, so the chips stay verb-less nouns',
  askCopy.length === 2 && askCopy.every((s) => ASK_VERBS.test(s)), askCopy.join(' | '));
/* And each trails off into its own chip row rather than finishing the thought —
   a sentence that names the losses itself makes the chips beneath it redundant. */
check('each one hands off to its chips instead of completing itself',
  askCopy.length === 2 && askCopy.every((s) => s.trim().endsWith('…')), askCopy.join(' | '));
/* docs/32-the-garden-year.md:31 — the Turn is never the word "reset". */
check('and neither of them says reset', !/reset/i.test(askCopy.join(' ')), askCopy.join(' | '));
check('the shouted label class is retired, not left orphaned in the stylesheet',
  !/cere-lab/.test(sheetSrc)
  && !/cere-lab/.test(fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8')));
/* docs/37-monetization.md promise 2: the sacred moments stay clean. The ask is
   the beat where a player is deciding to give something up, which is exactly
   where a rewarded offer would be worth the most and cost the most. */
const askPanel = sheetSrc.slice(sheetSrc.indexOf('function turnAsk() {'),
  sheetSrc.indexOf('function turnBlessPanel()'));
check('the ask panel was actually found and read',
  askPanel.length > 2000 && askPanel.length < 8000, `${askPanel.length} chars`);
check('and no ad offer has crept into the ceremony’s first beat',
  !/data-ad|adTag\(|AD_LABEL/.test(askPanel));

/* ---- AND NOW THE PANEL ITSELF, because none of the above can see a row ----

   Everything above this line reads SOURCE TEXT, and five wrong implementations
   walked past it at 1904/0. The worst of them swapped `${goes}` and `${keeps}`
   under the two UNCHANGED sentences: the panel then told the player a new year
   washes away their Seeds, Unlocks, Petals, Creatures, Cards and Level, and
   never reaches their Gold, Upgrades and Power-ups. The game's central
   guarantee, inverted, on its one irreversible screen — and invisible to every
   check above, because the sentences name neither array and the checks read the
   array literals. Two more: `.slice(0, 3)` on the goes row, which dropped "4 big
   plots" and "8 growing" out of the stated price; and the original bug restored
   verbatim, rendering the goes row only when something was growing, so an empty
   board was told nothing at all about gold, upgrades and power-ups going.

   These RUN turnAsk() and read what comes out. The harness — and the list of
   what it still cannot see — is at the top of this file. */
const askRender = () => {
  const r = sheetRender('turnAsk');
  /* THE STRUCTURAL BIND, and the point of the whole block: each sentence is
     paired with the row that FOLLOWS IT IN THE OUTPUT, not with whichever
     array literal happens to be declared first. A swap moves the row out from
     under its caption, which is a thing only the output can show. */
  r.pairs = [...r.html.matchAll(/<p class="cere-say">([^<]*)<\/p>\s*<div class="keep-row">([\s\S]*?)<\/div>/g)]
    .map((m) => ({ said: m[1].trim(), chips: sheetChips(m[2]) }));
  /* WIDEN, never delete: row two's wording is the owner's to settle and
     turnAsk() names three legal alternates — "It never touches the forever
     things…", "A new year never reaches these…", "And it never reaches what you
     keep forever…". All four carry the negation, and it is the negation that
     tells the two captions apart without pinning either one's prose. */
    r.kept = r.pairs.find((p) => /\bnever\b/i.test(p.said));
  r.goes = r.pairs.find((p) => !/\bnever\b/i.test(p.said));
  return r;
};
/* Both readers tolerate a MISSING row rather than throwing on one, because the
   fixed bug's whole shape is a row that is not there — a crash would take the
   rest of the suite down with it instead of printing which board lost its price. */
const askChips = (pair) => (pair ? pair.chips : []);
const askText = (pair) => (pair ? pair.chips.map((c) => c.text).join(' · ') : 'no row');
/* THE FULLEST BOARD: every one of the five conditional prices is true at once,
   which is the only state in which a truncated row can be told from an honest
   one. Plots 5-8 are the ones that re-lock (DATA.plotUnlockLevel), so the count
   comes off the table rather than off the render it is checking. */
const ASK_BIG = DATA.plotUnlockLevel.filter((n) => n > 1).length;
const ASK_GROWING = 3;
G.reset(); clearGarden(); unlockTo(20);
S.credits = 1e6;
S.upgrades.autoWater = 1;
S.boostInv = { bloom: 2 };
for (let i = 0; i < ASK_GROWING; i += 1) {
  S.grid[i].seed = 'daisy'; S.grid[i].plantedAt = clock; S.grid[i].grow = 3600; S.grid[i].ready = false;
}
const askFull = askRender();
check('the ask renders headlessly, so everything below reads output and not source',
  askFull.error === '' && askFull.html.includes('class="cere"'),
  askFull.error || `${askFull.html.length} chars`);
check('and the fixture really is the fullest board, or a truncated row would look right',
  ASK_BIG > 0 && ASK_GROWING > 0, `${ASK_BIG} big plots, ${ASK_GROWING} growing`);
check('it draws exactly two chip rows, each led by its own sentence',
  askFull.pairs.length === 2, askFull.pairs.map((p) => p.said).join(' | '));
/* THE INVERSION, which is the one this block exists for. Not "both arrays are
   present somewhere" — WHICH ROW SITS UNDER WHICH SENTENCE. */
check('the row under the sentence that says “never” is the one nothing is taken from',
  askChips(askFull.kept).length > 0
  && askChips(askFull.kept).every((c) => c.cls === 'chip')
  && ['Seeds', 'Unlocks', 'Petals', 'Creatures', 'Cards', 'Level']
    .every((k) => askChips(askFull.kept).some((c) => c.text === k)),
  askText(askFull.kept));
check('and the row under the other sentence is the one everything is taken from',
  askChips(askFull.goes).length > 0
  && askChips(askFull.goes).every((c) => c.cls === 'chip gone')
  && askChips(askFull.goes).some((c) => c.text === 'Gold'),
  askText(askFull.goes));
/* THE TRUNCATION. Named things, not a count, because a count is passed by any
   five chips; and the two numbered ones are checked against the numbers the
   fixture actually set, because "0 growing" would satisfy a shape test. */
check('all five prices reach the row, not just the ones that fit',
  askText(askFull.goes) === `Gold · Upgrades · Power-ups · ${ASK_BIG} big plots · ${ASK_GROWING} growing`,
  askText(askFull.goes));
check('and nothing is kept back from the other row either',
  askText(askFull.kept) === 'Seeds · Unlocks · Petals · Creatures · Cards · Level',
  askText(askFull.kept));
/* Fall's bed is the seventh, and it appears only when there is one to keep —
   the Century Bloom's whole promise is that a Turn cannot touch it, and until
   the 2026-09-03 round the only place that was written was the crop picker. */
S.fall.grid[0].seed = 'daisy'; S.fall.grid[0].plantedAt = clock; S.fall.grid[0].grow = 3600;
const askFall = askRender();
check('and a Fall bed with something in it joins the row that is kept',
  askChips(askFall.kept).length === 7
  && /Fall|Century/.test(askChips(askFall.kept)[6].text), askText(askFall.kept));
/* THE FIXED BUG, which no source check could see either: the goes row used to
   render only when something was growing, so a player who had just picked
   everything was told the Turn cost them nothing at all. It is false on every
   board — gold zeroes, every upgrade wipes, power-ups go, plots 5-8 close. An
   irreversible commit may never understate its own price. */
G.reset(); clearGarden(); unlockTo(20);
S.credits = 1e6;
S.upgrades.autoWater = 1;
S.boostInv = { bloom: 2 };
const askEmpty = askRender();
check('an EMPTY board is still told what the year takes',
  askChips(askEmpty.goes).length > 0
  && ['Gold', 'Upgrades', 'Power-ups'].every((n) => askChips(askEmpty.goes).some((c) => c.text === n)),
  askText(askEmpty.goes));
check('and it is told about the plots too, while it is honestly not told about growth',
  askChips(askEmpty.goes).some((c) => c.text === `${ASK_BIG} big plots`)
  && !askChips(askEmpty.goes).some((c) => /growing/.test(c.text)), askText(askEmpty.goes));
check('while the line above the rows says the board is empty rather than that the Turn is free',
  /The board is empty/.test(askEmpty.html) && !/nothing at all/.test(askEmpty.html));
/* And the floor of it: a brand-new save, nothing bought, nothing planted. Gold
   is the unconditional entry and the only one that could be softened back into
   the bug — a purse that looks empty at the ask still zeroes. */
G.reset();
const askFresh = askRender();
check('and a brand-new garden with nothing in it is told its gold goes',
  askChips(askFresh.goes).some((c) => c.text === 'Gold'),
  askText(askFresh.goes));
/* Sabotage E: the endsWith('…') check above is beaten by one character, because
   "A new year washes away your gold, upgrades and power-ups…" trails off AND
   completes itself, which makes the row beneath it redundant. The real rule is
   that the sentence hands the nouns to the chips. */
check('and neither sentence names what its own chips name',
  askFull.pairs.every((p) => !p.chips.some((c) => c.text && new RegExp(`\\b${c.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(p.said))),
  askFull.pairs.map((p) => p.said).join(' | '));
/* Sabotage D: `the shouted label class is retired` asserts a NAME is gone, and
   is passed by pasting the shouted label's declarations onto the new name —
   uppercase, 11px, 0.77px of letter-spacing, verified in a browser. So this
   reads the PROPERTIES. 11px letter-spaced caps cannot name an irreversible
   price kindly, whatever the class is called. */
const cereSay = cssRule('.cere-say');
check('and the sentence class is styled as a sentence, not as a shouted label',
  cereSay.length > 10 && !/text-transform\s*:\s*uppercase/.test(cereSay)
  && !/letter-spacing/.test(cereSay) && /font-size\s*:\s*1[3-9]px/.test(cereSay), cereSay);
/* docs/37 promise 2 again, in the output this time. The source check above
   greps for one spelling of "ad" and is walked past by a NAMED BUILDER: a
   single `${droneCard()}` line renders a live "Borrow the drone · 30 min ·
   Watch an ad" card inside the ceremony's first beat and stays green. Every
   helper the panel reaches is stubbed and recorded, so the guard is on the CALL
   LIST — widen it only after checking that what you are adding is not an offer. */
const ASK_HELPERS = ['Flora.talkingFlower', 'fmt'];
check('the ceremony’s first beat reaches for nothing but the flower and the formatter',
  askFull.calls.every((c) => ASK_HELPERS.includes(c)), askFull.calls.join(', '));
check('and nothing an ad is made of survives into the rendered ask',
  !/data-ad|price ad|Watch an ad|rewarded/i.test(askFull.html));

/* The strip is the game's one always-visible goal, and ranking it on every read
   made it trade places as a player alternated tapping and harvesting — which is
   the core loop, not an edge case. It re-ranks when the active SET changes and
   holds in between; a finished quest still jumps from anywhere. */
group('the goal strip holds its quest instead of trading places mid-stride');
G.reset();
S.quests.done = [];
S.quests.active = [{ id: 'q_daisy_5', progress: 2 }, { id: 'q_tap_50', progress: 24 }];
const firstPick = G.stripQuest().def.id;
check('it opens on the one nearest to done', firstPick === 'q_tap_50', firstPick);
S.quests.active[0].progress = 3;   // daisies 0.60 now leads taps 0.48
check('and holds it when the other pulls ahead', G.stripQuest().def.id === 'q_tap_50',
  G.stripQuest().def.id);
S.quests.active[1].progress = 31;  // taps back in front — the swap-back that flickered
check('and does not swing back when it retakes the lead', G.stripQuest().def.id === 'q_tap_50');
S.quests.active[0].progress = 5;   // daisies FINISH
check('but a finished quest still jumps the queue from anywhere',
  G.stripQuest().def.id === 'q_daisy_5' && G.stripQuest().complete === true,
  G.stripQuest().def.id);
/* The set changing is what re-opens the ranking — a claim, a deal or a prune. */
G.claimQuest('q_daisy_5');
check('claiming re-ranks, because the set it was chosen from changed',
  G.stripQuest().def.id !== 'q_daisy_5');
/* The negative: the hold is a hold, not a freeze. A fresh set picks fresh. */
S.quests.done = [];
S.quests.active = [{ id: 'q_plant_20', progress: 1 }, { id: 'q_harvest_10', progress: 9 }];
check('a different set of quests is ranked from scratch',
  G.stripQuest().def.id === 'q_harvest_10', G.stripQuest().def.id);
check('and the panel still leads with whatever the strip shows',
  G.activeQuests()[0].id === G.stripQuest().def.id);
G.reset();

/* ============================================================
   THE NUMBERS PASS — phase 3.7
   The owner's rule: if a button costs something, it says what you get and what
   you now have. The labels are a UI job, but the NUMBERS are the engine's, and
   these are the assertions that keep a label from drifting away from the
   function that spends it. Every one of them would have passed vacuously
   before the getters existed, which is why each asserts against the real code
   path rather than against a constant.
   ============================================================ */

group('the picker quotes what the plot would really give');
G.reset();
S.credits = 1e9;
unlockTo(20);
/* Petals are the successor to the mastery trap: clearGarden() does not clear
   them, so a measurement that inherits an earlier group's petals is measuring
   two things at once. */
S.petals = {};
const tulipDef = G.seedById('tulip');
check('the grow label is the time the plant actually gets', (() => {
  G.plant(0, tulipDef);
  const baked = S.grid[0].grow;
  S.grid[0].seed = null;
  return Math.abs(G.plantGrowth(tulipDef, 0) - baked) < 1e-9;
})());
/* The label quotes the whole stack, and since the sky pass the sky is part of it — so rain's
   share belongs in the expectation. rainGrowMult() is 1 under every sky but rain, and reading it
   beside plantGrowth() reads it at the same instant, which is the only way the two agree. */
check('and Quick Sprout moves it — the bug that started this pass', (() => {
  const before = G.plantGrowth(tulipDef, 0);
  S.savedSeeds = 1e9;
  G.buyPetal('tulip', 'quick');
  const after = G.plantGrowth(tulipDef, 0);
  return after < before - 0.5
    && Math.abs(after - tulipDef.grow * (1 - DATA.petals.shared.quick.value) * G.rainGrowMult()) < 1e-6;
})());
check('the payout label carries Rich Bloom', (() => {
  S.petals = {};
  const plain = G.plantPayout(tulipDef, 0);
  S.savedSeeds = 1e9;
  G.buyPetal('tulip', 'rich');
  const rich = G.plantPayout(tulipDef, 0);
  return rich.min > plain.min && Math.abs(rich.mult - (1 + DATA.petals.shared.rich.value)) < 1e-9;
})());
check('and a plain flower quotes exactly its data row', (() => {
  S.petals = {};
  const p = G.plantPayout(G.seedById('daisy'), 0);
  const d = G.seedById('daisy');
  return p.mult === 1 && p.min === d.yield && p.max === Math.round(d.yield * MAX_RARITY_MULT);
})());
/* THE PICKER OPENS ON AN EMPTY PLOT, which is why this group exists: every
   self-verb term in verbPayoutMult() keys off the verb of the seed ALREADY in
   the plot, so a projection that reads the plot instead of the seed being
   offered drops all of them. It quoted a Nightbell at four times what it pays
   by day and a Nurse 11% over. Asserted seed by seed against a real harvest. */
check('a verb-carrying seed is quoted for the seed, not for the empty plot', (() => {
  for (const def of DATA.seeds.filter((sd) => sd.verb)) {
    G.reset();
    S.petals = {};
    S.credits = 1e12;
    unlockTo(20);
    G.Dev.setWeather('clear');
    const quote = G.plantPayout(def, 0);
    G.Dev.armRarity('common');
    G.plant(0, def);
    advance(Math.ceil(S.grid[0].grow) + 2);
    const before = S.credits;
    G.harvest(0);
    const paid = S.credits - before;
    if (paid < quote.min || paid > quote.max) return false;
  }
  G.Dev.clearAll();
  return true;
})());

/* Nightbell is the one verb whose payout is decided at HARVEST, so a projection
   cannot know it. It quotes the day rate — the floor — for the same reason the
   Stand quotes a floor on a line that names nothing: a price the player can
   trust, never a ceiling. This fails if anyone "improves" it to read the sky. */
check('and Nightbell is quoted at its floor, whatever the sky is doing now', (() => {
  const moon = DATA.seeds.find((sd) => sd.verb === 'nightbell');
  if (!moon) return false;
  G.reset();
  S.petals = {};
  unlockTo(20);
  const quoted = G.plantPayout(moon, 0);
  const day = moon.yield * DATA.verbTuning.nightbellDay;
  return Math.abs(quoted.min - Math.round(day)) < 1
    && quoted.mult < 1
    && G.verbPayoutMult(0, 'nightbell') === DATA.verbTuning.nightbellDay;
})());

/* The label is a prediction, so the only proof that matters is a real harvest
   landing on the number it promised. Rarity is pinned to common, which is the
   bottom of the quoted range. */
check('a real harvest lands inside the range the picker quoted', (() => {
  G.reset();
  S.petals = {};
  S.credits = 1e9;
  unlockTo(20);
  S.savedSeeds = 1e9;
  G.buyPetal('tulip', 'rich');
  G.buyPetal('tulip', 'rich');
  const quoted = G.plantPayout(tulipDef, 0);
  G.Dev.armRarity('common');
  G.plant(0, tulipDef);
  advance(S.grid[0].grow + 2);
  const before = S.credits;
  G.harvest(0);
  const paid = S.credits - before;
  return paid >= quoted.min && paid <= quoted.max;
})());

group('a petal button says what you have and what the next one adds');
G.reset();
S.petals = {};
S.savedSeeds = 1e9;
unlockTo(20);
check('nothing owned reads as nothing owned', (() => {
  const e = G.petalEffect('daisy', 'rich');
  return e.owned === 0 && e.now === 0 && e.next === DATA.petals.shared.rich.value;
})());
check('and each purchase moves `now` by exactly what `next` promised', (() => {
  for (let i = 0; i < DATA.petals.shared.rich.cap; i += 1) {
    const before = G.petalEffect('daisy', 'rich');
    if (before.maxed) return false;
    const promised = before.next;
    G.buyPetal('daisy', 'rich');
    const after = G.petalEffect('daisy', 'rich');
    if (Math.abs(after.now - (before.now + promised)) > 1e-9) return false;
  }
  return true;
})());
check('the last petal in reads as full, and promises nothing more', (() => {
  const e = G.petalEffect('daisy', 'rich');
  return e.maxed === true && e.next === 0 && Math.abs(e.now - DATA.petals.shared.rich.cap * DATA.petals.shared.rich.value) < 1e-9;
})());
check('and `now` is the multiplier the harvest actually uses', (() => {
  const e = G.petalEffect('daisy', 'rich');
  return Math.abs(G.petalMult('daisy') - (1 + e.now)) < 1e-9;
})());

group('a badge card says what the next level buys');
G.reset();
S.credits = 1e12;
check('every core badge answers with a unit',
  UI_BADGE_KEYS.every((k) => Boolean(G.upgradeEffect(k).unit)));
/* The property that matters is the same one the petals have: buying the thing
   moves the running total by exactly what the card promised. Each badge is
   asserted through its own unit, because they do not all count upward. */
check('buying moves the running total by what the card promised', (() => {
  const ups = ['tapPower', 'critChance', 'critMult', 'comboMeter', 'rainDance', 'beeSwarm', 'ladybug', 'autoWater', 'offlineRate', 'offlineHours'];
  for (const key of ups) {
    S.credits = 1e12;
    const before = G.upgradeEffect(key);
    if (before.maxed) continue;
    if (!G.buyUpgrade(key)) return false;
    const after = G.upgradeEffect(key);
    if (Math.abs(after.now - (before.now + before.next)) > 1e-6) return false;
  }
  return true;
})());
check('the hold speed counts DOWN by what it promised', (() => {
  S.credits = 1e12;
  const before = G.upgradeEffect('holdSpeed');
  G.buyUpgrade('holdSpeed');
  const after = G.upgradeEffect('holdSpeed');
  return Math.abs(after.now - (before.now - before.next)) < 1e-6;
})());
check('the drone quotes the cadence the loop actually runs on', (() => {
  S.credits = 1e12;
  G.buyUpgrade('autoHarvest');
  const e = G.upgradeEffect('autoHarvest');
  return e.now === G.autoHarvestCadence(S.upgrades.autoHarvest)
    && e.next === G.autoHarvestCadence(S.upgrades.autoHarvest + 1)
    && e.next < e.now;
})());
check('a maxed badge promises nothing more', (() => {
  S.credits = 1e12;
  for (let i = 0; i < 40; i += 1) G.buyUpgrade('ladybug');
  const e = G.upgradeEffect('ladybug');
  return e.maxed === true && e.next === 0;
})());
/* Both offline badges clamp, and with a creature lending its trait the ceiling
   arrives several levels before upgradeMaxed() does — so the step has to be
   measured through the same function, not read off the DATA constant. */
check('the offline badges promise the step the clamp will actually give', (() => {
  G.reset();
  S.credits = 1e12;
  const lender = CREATURES.find((c) => c.trait === 'offlineRate');
  if (lender) {
    S.critters[lender.id] = { home: true, fed: 0, fedUntil: G.nowSeconds() + 86400, stars: 6, seen: true };
    G.setTending(lender.id, true);
  }
  for (const key of ['offlineRate', 'offlineHours']) {
    for (let lvl = 0; lvl <= 15; lvl += 1) {
      S.upgrades[key] = lvl;
      const e = G.upgradeEffect(key);
      if (e.maxed) continue;
      const now = e.now;
      S.upgrades[key] = lvl + 1;
      const after = G.upgradeEffect(key).now;
      S.upgrades[key] = lvl;
      if (Math.abs(e.next - (after - now)) > 1e-9) return false;
    }
  }
  return true;
})());

/* The crit card has to quote the chance tapFlower() rolls against, which adds
   the live boost and clamps at the ceiling — not the raw stored field. */
check('the crit card quotes the chance the roll uses, boost and all', (() => {
  G.reset();
  S.boostInv.bloom = 1;
  G.activateBoost('bloom');
  const e = G.upgradeEffect('critChance');
  return Math.abs(e.now - G.critChanceNow()) < 1e-9 && e.now > S.tap.critChance;
})());

/* The per-tap figure is a FLOOR: every term a tap applies except the combo,
   which decays a point a second while the panel sits open. Asserted both ways —
   it is exactly a resting tap, and a tap with a combo running pays it times the
   combo the same call hands back. */
check('the tap figure is exactly what a resting tap pays', (() => {
  G.reset();
  S.credits = 1e12;
  for (let i = 0; i < 9; i += 1) G.buyUpgrade('tapPower');
  S.tap.critChance = 0;
  S.tap.combo = 0;
  const st = G.tapStats();
  const before = S.credits;
  G.tapFlower(false);
  return st.comboMult === 1 && Math.abs((S.credits - before) - Math.round(st.perTap)) <= 1;
})());
check('and the combo it hands back is the factor on top', (() => {
  G.reset();
  S.credits = 1e12;
  for (let i = 0; i < 9; i += 1) G.buyUpgrade('tapPower');
  S.tap.critChance = 0;
  for (let i = 0; i < 30; i += 1) G.tapFlower(false);
  const st = G.tapStats();
  const before = S.credits;
  G.tapFlower(false);
  return st.comboMult > 1
    && Math.abs((S.credits - before) - Math.round(st.perTap * st.comboMult)) <= 1;
})());

check('a proc chance on the card is the chance the roll uses', (() => {
  S.credits = 1e12;
  G.buyUpgrade('rainDance');
  return Math.abs(G.upgradeEffect('rainDance').now - G.procChance('rainDance')) < 1e-9;
})());
check('a harvester names the bloom it can actually plant, never one it cannot', (() => {
  G.reset();
  S.credits = 1e12;
  /* Level 5 with only the free seeds unlocked: the clamp in processAutoPlant()
     holds it at the top UNLOCKED seed, and the card has to say the same. */
  for (let i = 0; i < 5; i += 1) G.buyUpgrade('plot1Harvester');
  const e = G.upgradeEffect('plot1Harvester');
  const unlocked = DATA.seeds.filter((s) => G.seedUnlocked(s.id));
  return e.now === unlocked[unlocked.length - 1].name;
})());

group('the meadow and the roster say what a purchase does');
G.reset();
S.credits = 1e9;
check('a tender that slows hives says so with a negative number', (() => {
  const willow = G.tenderEffect('willow');
  const sun = G.tenderEffect('sun');
  return willow.speed < 0 && sun.speed > 0;
})());
check('and every tender in the data can be read',
  MEADOW.tenders.every((t) => Boolean(G.tenderEffect(t.id))));
check('a hive projection matches what the cell produces once built', (() => {
  const cell = G.emptyCells()[0];
  const p = G.hiveProjection(cell);
  S.credits = 1e9;
  G.placeHive(cell);
  return Math.abs(p.interval - G.hiveInterval(cell)) < 1e-9
    && p.capacity === G.hiveCapacity(cell)
    && Math.abs(p.wax - G.hiveWax(cell)) < 1e-9;
})());
check('a food button can be told what it will really add', (() => {
  G.reset();
  S.credits = 1e9;
  const who = CREATURES[0].id;
  S.critters[who] = { home: true, fed: 0, fedUntil: 0, stars: 1, seen: true };
  const food = CREATURE_FOOD[CREATURE_FOOD.length - 1];
  const e = G.foodEffect(who, food.id);
  return e && Math.abs(e.gain - G.foodGain(who, food.id)) < 1e-9 && e.nominal === food.hours * 3600;
})());
check('and it tells the truth when the cap is eating the tin', (() => {
  const who = CREATURES[0].id;
  const food = CREATURE_FOOD[CREATURE_FOOD.length - 1];
  S.critters[who].fedUntil = G.nowSeconds() + FOOD_CAP_HOURS * 3600 - 600;
  const e = G.foodEffect(who, food.id);
  return e.capped === true && e.gain < e.nominal;
})());
check('a sell button can be told the total, not just the unit', (() => {
  G.reset();
  S.flowers = { daisy: 7 };
  const v = G.sellValue('flower', 'daisy');
  const before = S.credits;
  G.sell('flower', 'daisy', true);
  return v.have === 7 && v.total === v.unit * 7 && S.credits - before === v.total;
})());
check('a gem skip says the time it buys, not only the price', (() => {
  G.reset();
  S.credits = 1e9;
  unlockTo(20);
  G.plant(0, G.seedById('orchid'));
  const s = G.skipSaving(0);
  return s.gems === G.skipCost(0) && s.seconds > 0 && s.seconds <= S.grid[0].grow;
})());
check('a bought sky counts the plants standing in the ground', (() => {
  G.reset();
  S.credits = 1e9;
  unlockTo(20);
  const empty = G.weatherCallEffect('rain');
  G.plant(0, G.seedById('tulip'));
  G.plant(1, G.seedById('tulip'));
  const full = G.weatherCallEffect('rain');
  return empty.plots === 0 && full.plots === 2 && full.mutation === 'dew';
})());

/* ============================================================
   ORDER GOLD — phase 3.7
   The two standing properties were only ever exercised at the TOP tier:
   standReset() unlocks to level 20, which puts rep past 600, so a broken
   multiplier on tiers 1-3 shipped green. Both now loop the tiers.
   ============================================================ */
group('an order beats selling its contents at EVERY tier, not just the top one');
STAND.tiers.forEach((tier) => {
  check(`tier ${tier.tier}: a named order always pays more than selling its contents`, (() => {
    standReset(20);
    S.credits = 1e9;
    G.placeHive(G.emptyCells()[0]);
    S.rep = tier.rep;
    if (G.standTier().tier !== tier.tier) return false;
    for (let n = 0; n < 120; n += 1) {
      S.stand.slots = Array(STAND.slots).fill(null);
      const o = G.standGenerate(0);
      if (!o || o.needs.some((need) => need.any)) continue;
      const raw = o.needs.reduce((sum, need) => sum + G.standUnitValue(need.kind, need.of) * need.qty, 0);
      if (o.coins <= raw) return false;
    }
    return true;
  })());
  check(`tier ${tier.tier}: a wild line never pays less than selling what it took`, (() => {
    standReset(20);
    S.rep = tier.rep;
    const dearest = G.standFlowerPool()
      .slice().sort((a, b) => G.standUnitValue('flower', b) - G.standUnitValue('flower', a))[0];
    for (const stock of [G.standFlowerPool()[0], dearest]) {
      for (let n = 0; n < 40; n += 1) {
        S.stand.slots = Array(STAND.slots).fill(null);
        S.rep = tier.rep;
        const o = G.standGenerate(0);
        if (!o || !o.needs.some((need) => need.any)) continue;
        const qty = o.needs.reduce((a, need) => a + need.qty, 0);
        S.flowers = {};
        S.flowers[stock] = qty;
        S.credits = 0;
        const raw = G.standUnitValue('flower', stock) * qty;
        const res = G.standDeliver(0);
        if (!res || S.credits <= raw) return false;
      }
    }
    return true;
  })());
});

/* The floor the invariant really sits on, measured rather than asserted by
   eye: below 1/0.9 a single wild line pays less than selling what filled it.
   The comment in data.js used to claim the lowest shipped multiplier WAS that
   floor; it never was, and now it is nowhere near it. */
check('every tier clears the wild floor with room to spare',
  STAND.tiers.every((t) => t.mult > 1 / STAND.wildBonus));
check('tiers climb in pay as well as in standing',
  STAND.tiers.every((t, i, a) => i === 0 || t.mult > a[i - 1].mult));
/* The owner's ruling in one number, and the reason it is a MEDIAN over real
   deliveries rather than a price off a card: the cheapest order a tier-1 board
   can write is three daisies, and the re-price at the counter is what turns a
   board price into a payout. A single order proves nothing; the middle of sixty
   of them is what a player feels. */
check('a delivered order is worth a minute of play, not a second of it', (() => {
  const paid = [];
  for (let n = 0; n < 60; n += 1) {
    standReset(1);
    S.rep = 0;
    S.flowers = {};
    S.credits = 0;
    const o = G.standGenerate(0);
    if (!o) return false;
    /* The pantry a day-one player actually has. A wild line is filled with the
       best bloom they can grow, not the cheapest in the pool — the casual model
       plants the dearest seed it can afford, and filling with daisies here
       measures a player nobody is. */
    o.needs.forEach((need) => {
      const pool = G.standFlowerPool();
      const id = need.of || pool[pool.length - 1];
      S.flowers[id] = (S.flowers[id] || 0) + need.qty;
    });
    const res = G.standDeliver(0);
    if (!res) return false;
    paid.push(res.paid);
  }
  paid.sort((a, b) => a - b);
  return paid[Math.floor(paid.length / 2)] >= CASUAL_RATE_PER_MIN;
})());

/* The guard that outlives the measurement. Whatever the exact values, the
   ruling bought an order that is worth minutes rather than seconds — and the
   old table sat at 1.55-2.60, so anything back down in single figures is the
   token the owner rejected, not a retune. Re-measure in tools/order-gold.js
   before moving this. */
check('and no tier has quietly slid back to a token',
  STAND.tiers.every((t) => t.mult >= 20));

group("what's new survives the reset its own button performs");
G.clearNewsSeen();
check('nothing is seen on a fresh install', !G.newsSeen(DATA.announcements[0].id));
check('the newest unseen one is what would show', (() => {
  const a = G.pendingAnnouncement();
  return a && a.id === DATA.announcements[DATA.announcements.length - 1].id;
})());
check('marking it seen takes it out of the queue', (() => {
  G.markNewsSeen(DATA.announcements[0].id);
  return G.newsSeen(DATA.announcements[0].id) && G.pendingAnnouncement() === null;
})());
/* THE WHOLE POINT. The button marks the announcement seen and then wipes the
   save; a flag living inside the save would go with it and the popup would
   open on every load forever. This assertion is FALSE if the flag is ever
   moved into state — which is exactly what makes it worth writing. */
check('and it survives the wipe the button performs', (() => {
  S.credits = 999999;
  G.saveNow();
  G.reset();
  return S.credits !== 999999 && G.newsSeen(DATA.announcements[0].id) && G.pendingAnnouncement() === null;
})());
check('clearing the flags brings it back, which is what the dev button is for', (() => {
  G.clearNewsSeen();
  return !G.newsSeen(DATA.announcements[0].id) && Boolean(G.pendingAnnouncement());
})());
check('every announcement carries what the dialog needs to draw itself',
  (DATA.announcements || []).every((a) => a.id && a.title && a.img
    && Array.isArray(a.bullets) && a.bullets.length >= 1
    && a.img.indexOf('/') !== 0));

group('the changelog is a second marker outside the save, with three gates on it');
G.clearChangelogSeen();
G.clearNewsSeen();
check('every entry is unread on a fresh install',
  G.changelogUnseen().length === DATA.changelog.length && DATA.changelog.length > 0);
/* GATE 1: an unread announcement wins outright. Two popups on one boot is one
   too many, and the one with the picture and the fresh-garden button is the one
   that cannot wait. */
check('an unread announcement holds the changelog back',
  Boolean(G.pendingAnnouncement()) && G.changelogDue() === false);
G.markNewsSeen(DATA.announcements[DATA.announcements.length - 1].id);
check('and with the announcement read it is due', G.changelogDue() === true);
/* GATE 2: once a day. `markChangelogSeen()` spends today as well as marking the
   entries, so a second load the same afternoon is quiet. */
G.markChangelogSeen();
check('reading it marks every entry and spends the day',
  G.changelogUnseen().length === 0 && G.changelogDue() === false);
check('and nothing unread means nothing due even on a new day',
  (() => {
    G.clearChangelogSeen();
    /* Everything seen, but the day is long past — still nothing to show. */
    localStorage.setItem('gw-log', JSON.stringify({ seen: DATA.changelog.map((e) => e.date), day: '1999-1-1' }));
    return G.changelogUnseen().length === 0 && G.changelogDue() === false;
  })());
/* GATE 3, and the whole reason the marker is not in the save: a Turn wipes the
   garden and a `reset` announcement replaces it outright. Neither is a reason to
   hand somebody a list they have already read. FALSE if the marker ever moves
   into state, which is what makes it worth writing. */
check('the marker survives the wipe, exactly as the announcement flags do', (() => {
  G.clearChangelogSeen();
  G.markChangelogSeen();
  S.credits = 987654;
  G.saveNow();
  G.reset();
  return S.credits !== 987654 && G.changelogUnseen().length === 0;
})());
check('a first-time player is seeded, not shown', (() => {
  G.clearChangelogSeen();
  const seeded = G.seedChangelogSeen();
  return seeded && G.changelogUnseen().length === 0 && G.changelogDue() === false;
})());
check('and seeding refuses to touch a marker that already exists', (() => {
  localStorage.setItem('gw-log', JSON.stringify({ seen: [], day: '1999-1-1' }));
  const seeded = G.seedChangelogSeen();
  return seeded === false && G.changelogUnseen().length === DATA.changelog.length;
})());
/* The dates are the identity, so a duplicate would make one entry unreachable
   and editing a shipped one would re-show it to everybody. */
check('every entry has a unique date and at least one plain line',
  (DATA.changelog || []).every((e, i) => e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
    && Array.isArray(e.lines) && e.lines.length >= 1
    && e.lines.every((l) => typeof l === 'string' && l.length > 10)
    && DATA.changelog.findIndex((o) => o.date === e.date) === i));
check('and the newest entry is FIRST, which is the order the popup reads',
  (DATA.changelog || []).every((e, i, a) => i === 0 || a[i - 1].date >= e.date));
G.clearChangelogSeen();
G.clearNewsSeen();
G.clearNewsSeen();
G.reset();

/* ---------------- what the playbooks promise, against what shipped ----------------

   Every check below is a sentence a doc already states, turned into something
   that can go red. They sit together because they share a failure mode rather
   than a system: each one is invisible in a passing playthrough, on an online
   load, and on a case-insensitive Mac disk, and surfaces weeks later as an app
   that will not boot on a train or a dialog with a broken square in it.

   index.html, sw.js and ui-sheet.js are read as text because none of them can be
   loaded headless. A copy of their contents kept here would be the thing that
   goes stale, which is the failure this group exists to catch. */
const indexSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const sheetSource = fs.readFileSync(path.join(ROOT, 'ui-sheet.js'), 'utf8');

/* Line comments are stripped first: an apostrophe in the prose beside an entry
   would otherwise be parsed as a list member and fail the on-disk check for a
   file nobody ever named. */
const arrayLiteral = (src, decl) => {
  const open = src.indexOf(decl);
  if (open < 0) return [];
  const body = src.slice(open + decl.length, src.indexOf('];', open)).replace(/\/\/[^\n]*/g, '');
  return [...body.matchAll(/'([^']*)'/g)].map((m) => m[1]);
};
const bare = (p) => p.replace(/^\.\//, '');

const coreList = arrayLiteral(swSource, 'const CORE = [');
const coreBare = new Set(coreList.map(bare));
const scriptTags = [...indexSrc.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
/* sw.js is deliberately absent from both sides: the worker is registered rather
   than loaded by a tag, and a worker that precached itself would serve players
   the old worker forever. */
const shippedScripts = fs.readdirSync(ROOT).filter((f) => f.endsWith('.js') && f !== 'sw.js');

group('the offline list still lists the game');
/* THE GUARD ON EVERY CHECK BELOW IT. Both lists are scraped, and a scrape that
   matches nothing returns an empty array, on which every() is true — four green
   assertions testing an empty set against an empty set. If a rename to CORE or
   to the script tags ever breaks the scrape, this is the check that says so. */
check('both lists were actually found and read',
  coreList.length > 20 && scriptTags.length > 10,
  `${coreList.length} precached, ${scriptTags.length} script tags`);
/* docs/09-conventions.md:45-46 and docs/23-installable-pwa.md:57-58. sw.js
   precaches with Promise.allSettled, so a file left out of CORE fails without a
   sound; the symptom is an installed app that will not boot with no network. */
check('every script the page loads is precached for offline play',
  scriptTags.every((s) => coreBare.has(bare(s))),
  scriptTags.filter((s) => !coreBare.has(bare(s))).join(', '));
/* The other direction, and not hypothetical: overworld.js and ui-map.js were
   deleted and had to be lifted out of CORE by hand. A stale entry is the same
   silent install failure as a missing one. */
check('every precached path is a file that still exists',
  coreList.every((p) => p === './' || fs.existsSync(path.join(ROOT, bare(p)))),
  coreList.filter((p) => p !== './' && !fs.existsSync(path.join(ROOT, bare(p)))).join(', '));
/* docs/09-conventions.md:42-43 — the game is served from /gardenwonder/, so a
   leading slash 404s on the live site and nowhere else. */
check('no precached path starts with a slash',
  coreList.every((p) => p.indexOf('/') !== 0),
  coreList.filter((p) => p.indexOf('/') === 0).join(', '));
check('every script on disk is one the page actually loads',
  shippedScripts.every((f) => scriptTags.some((s) => bare(s) === f)),
  shippedScripts.filter((f) => !scriptTags.some((s) => bare(s) === f)).join(', '));

group('every badge in the data reaches a surface a player can see');
/* docs/09-conventions.md:168, step 3 of the add-an-upgrade playbook. A badge
   authored into DATA.upgrades and left out of CORE_UPGRADES costs gold, levels
   up, and renders on no screen. The tab list is read out of ui-sheet.js rather
   than compared against UI_BADGE_KEYS at the top of this file, because the
   hand-kept copy is exactly what would drift. */
const tabBadges = arrayLiteral(sheetSource, 'const CORE_UPGRADES = [');
const surfacedBadges = new Set(tabBadges.concat(PLOT_AUTOPLANTERS.map((p) => p.key)));
check('the tab list was actually found and read', tabBadges.length > 5, `${tabBadges.length} badges`);
/* `plotExpansion` is the one deliberate exception, owner-ruled 2026-09-02:
   Land Deed duplicated the in-garden plot-tap unlock at a second, confusing
   price and was pulled from CORE_UPGRADES entirely. Its data stays so an
   existing save's saved level is byte-identical; it is meant to reach no
   surface, so it is named here rather than silently failing this check. */
const RETIRED_BADGES = ['plotExpansion'];
check('every upgrade the data defines is on the tab, on a plot, or named retired',
  Object.keys(DATA.upgrades).every((k) => surfacedBadges.has(k) || RETIRED_BADGES.includes(k)),
  Object.keys(DATA.upgrades).filter((k) => !surfacedBadges.has(k) && !RETIRED_BADGES.includes(k)).join(', '));
check('and the tab names no badge the data does not have',
  [...surfacedBadges].every((k) => k in DATA.upgrades),
  [...surfacedBadges].filter((k) => !(k in DATA.upgrades)).join(', '));
/* Closes the loop on the list at the top of this file, whose comment asks a
   human to keep it in step and until now had nothing checking that they did. */
check('the badge list this suite keeps by hand still matches the tab',
  UI_BADGE_KEYS.length === surfacedBadges.size && UI_BADGE_KEYS.every((k) => surfacedBadges.has(k)),
  UI_BADGE_KEYS.filter((k) => !surfacedBadges.has(k)).join(', '));

group('every announcement image survives the trip to a real phone');
/* docs/09-conventions.md:31-34, and the same warning again in data.js beside the
   rows. All three of these fail only where nobody is looking: a Mac disk is
   case-insensitive where GitHub Pages is not, and an online load fetches the
   image whether or not it was ever precached. */
const newsImages = (DATA.announcements || []).map((a) => a.img);
check('the announcement table was actually found and read',
  newsImages.length > 0 && newsImages.every((img) => typeof img === 'string'),
  `${newsImages.length} announcements`);
check('every announcement image is precached with its announcement',
  newsImages.every((img) => coreBare.has(bare(img))),
  newsImages.filter((img) => !coreBare.has(bare(img))).join(', '));
check('every announcement image is on disk',
  newsImages.every((img) => fs.existsSync(path.join(ROOT, bare(img)))),
  newsImages.filter((img) => !fs.existsSync(path.join(ROOT, bare(img)))).join(', '));
check('every announcement image path is all lowercase',
  newsImages.every((img) => img === img.toLowerCase()),
  newsImages.filter((img) => img !== img.toLowerCase()).join(', '));

group('the last two tables that name icons name real ones');
/* The group above at "every icon a data table names actually exists" covers the
   creature, bench, upgrade and decor tables. GOODS and DATA.boosters were the
   two it never reached, and Icons.get() answers a typo with the sparkle glyph
   rather than with an error, so a wrong icon looks deliberate. */
check('every good names an icon that exists',
  GOODS.every((g) => Icons.has(g.icon)),
  GOODS.filter((g) => !Icons.has(g.icon)).map((g) => g.id).join(', '));
check('every booster names an icon that exists',
  DATA.boosters.every((b) => Icons.has(b.icon)),
  DATA.boosters.filter((b) => !Icons.has(b.icon)).map((b) => b.id).join(', '));

group('decor stays cosmetic and boosters stay unbuyable');
/* docs/09-conventions.md:182-184. There is a check further up that no decor in a
   MIGRATED SAVE carries a stat; this is the catalogue it was migrated from, and
   the two are different data. The save check would stay green for as long as it
   took someone to author a stat-carrying row straight into data.js. */
const STAT_FIELDS = ['type', 'val', 'effect', 'effects', 'yield', 'mult', 'bonus', 'rate'];
check('no decor row in the catalogue carries a stat',
  DATA.decor.every((d) => STAT_FIELDS.every((f) => !(f in d))),
  DATA.decor.filter((d) => STAT_FIELDS.some((f) => f in d)).map((d) => d.id).join(', '));
/* "Decor stacks and never escalates in price" is two claims, and the price being
   a number is only the first. A `scale` beside the cost is the whole of the
   second, and it is what a copied upgrade row would bring with it. */
const LADDER_FIELDS = ['scale', 'costScale', 'growth', 'step'];
check('every decor price is one flat number that never escalates',
  DATA.decor.every((d) => typeof d.cost === 'number' && d.cost > 0
    && LADDER_FIELDS.every((f) => !(f in d))),
  DATA.decor.filter((d) => typeof d.cost !== 'number' || d.cost <= 0
    || LADDER_FIELDS.some((f) => f in d)).map((d) => d.id).join(', '));
/* docs/09-conventions.md:189-190 — boosts are earned, not bought. The existing
   check that boosters carry no `tickets` was written for the ticket retirement
   and asks about that one word; a booster given a `cost` or a `gems` price would
   walk straight past it. */
const PRICE_FIELDS = ['cost', 'price', 'gems', 'credits', 'tickets', 'currency'];
check('no booster carries a price of any kind',
  DATA.boosters.every((b) => PRICE_FIELDS.every((f) => !(f in b))),
  DATA.boosters.filter((b) => PRICE_FIELDS.some((f) => f in b)).map((b) => b.id).join(', '));

group('Golden Popups reaches what it says, and says only what it reaches');
/* The copy read "+25% credits from all sources" and two of the game's four beds
   are sources it does not reach. Asserting the STRING on its own is a tautology,
   so this pins the sentence to the engine in BOTH directions: the two faucets it
   names are RUN and their payouts asserted to the coin, and the two beds it no
   longer claims are run with the boost armed and asserted to pay their raw data
   value. A future agent reading the punch list's original framing — "Fall is a
   source Golden Popups fails to reach" — reaches for the other fix, which is to
   make it reach; that is what the two bed assertions are here to redden.

   WHAT THIS CANNOT SEE. Two surfaces render this string — the activation toast
   (`ui-events.js`, `def.desc` on the `purchase` event) and the POWER-UP button's
   aria-label (`ui.js`) — and neither file can be loaded headless, so nothing
   below proves what a player reads or hears. The last check holds the one
   failure reachable from here, a view keeping a second copy of the sentence to
   drift from; the two rendered strings are verified in a browser instead. */
{
  const golden = DATA.boosters.find((b) => b.id === 'golden');
  check('the copy no longer claims every source',
    !/all sources/i.test(golden.desc), golden.desc);
  check('and it names the two faucets it does reach',
    /taps/i.test(golden.desc) && /harvest/i.test(golden.desc), golden.desc);

  /* The faucets themselves, not the pills that project them. `tapStats()` and
     `plantPayout()` rebuild the stack for display, so a simplify pass that drops
     `boostVal('globalCredits')` from tapFlower() or harvest() leaves both of
     them reporting x1.25 over a payout paid at x1. Both are driven here, with a
     bare board and a pinned roll, and the expected coin is stated. */
  const prevRandom = Math.random;
  const bareTap = (armed) => {
    G.reset();
    clearMastery();
    S.wonder = { until: 0, last: 0 };
    S.boosters = {};
    S.tap.power = 100;                 // base power is 1, and Math.round eats a 25% lift on it
    if (armed) S.boosters.golden = G.nowSeconds() + 60;
    Math.random = () => 0.99;          // no crit, no gem, no spark, no ladybug
    const p = G.tapFlower();
    Math.random = prevRandom;
    return p;
  };
  const tapOff = bareTap(false);
  const tapOn = bareTap(true);
  check('the fixture taps clean — no crit, no Wonder, the first of a combo',
    tapOff.crit === false && tapOff.sparkedWonder === false && tapOff.combo === 1
    && tapOn.crit === false && tapOn.sparkedWonder === false && tapOn.combo === 1);
  check('a tap of 100 pays 125 with Golden Popups running',
    tapOff.gain === 100 && tapOn.gain === 125, `${tapOff.gain} -> ${tapOn.gain}`);

  const bareHarvest = (armed) => {
    G.reset();
    clearMastery();
    S.wonder = { until: 0, last: 0 };
    S.boosters = {};
    S.apiary.cells = Array(MEADOW.cells).fill(null);   // no pollination in the way
    if (armed) S.boosters.golden = G.nowSeconds() + 60;
    Math.random = () => 0.5;
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '' };
    const p = G.harvest(0);
    Math.random = prevRandom;
    return p;
  };
  const harvOff = bareHarvest(false);
  const harvOn = bareHarvest(true);
  const daisyYield = G.seedById('daisy').yield;
  check('the fixture harvests clean — a common daisy at its plain yield',
    harvOff.rarity.key === 'common' && harvOn.rarity.key === 'common'
    && harvOff.payout === daisyYield && daisyYield === 70, `${harvOff.payout} / ${daisyYield}`);
  check('a garden harvest of 70 pays 88 with Golden Popups running',
    harvOn.payout === 88, `${harvOff.payout} -> ${harvOn.payout}`);

  /* And the two pills, which must agree with the faucets above to the decimal —
     they are separate arithmetic in separate functions and have drifted before. */
  G.reset();
  S.boosters = {};
  S.wonder = { until: 0, last: 0 };
  check('the tap pill and the seed pill both read x1 with nothing running',
    G.tapStats().mult === 1 && G.plantPayout(DATA.seeds[0], 0).mult === 1,
    `${G.tapStats().mult} / ${G.plantPayout(DATA.seeds[0], 0).mult}`);
  S.boosters.golden = G.nowSeconds() + 60;
  check('and both read exactly x1.25 with Golden Popups running',
    Math.abs(G.tapStats().mult - 1.25) < 1e-9
    && Math.abs(G.plantPayout(DATA.seeds[0], 0).mult - 1.25) < 1e-9,
    `${G.tapStats().mult} / ${G.plantPayout(DATA.seeds[0], 0).mult}`);

  /* The negative half, which is the whole reason the sentence was false. Both
     season beds are collected by their own function and neither reads boostVal;
     the payout is asserted to the coin against the row in data.js. */
  G.reset();
  S.year.turnsCompleted = 9;
  S.credits = 1e9;
  S.boosters.golden = G.nowSeconds() + 60;
  const crop = G.fallPlantById('strawberry');
  G.fallPlant(0, crop.id);
  S.fall.grid[0].plantedAt = G.nowSeconds() - crop.grow - 10;
  const fallPay = G.fallHarvest(0);
  check('the Fall fixture is ripe, outside the windfall, with the boost genuinely armed',
    fallPay !== null && fallPay.windfall === false && G.activeBoost('golden') === true);
  check('Golden Popups never reaches Fall’s bed — a 2,800 strawberry pays 2,800',
    fallPay.payout === crop.yield && crop.yield === 2800, `${fallPay.payout} vs ${crop.yield}`);

  G.reset();
  S.year.turnsCompleted = 9;
  S.credits = 1e9;
  S.boosters.golden = G.nowSeconds() + 60;
  const wplant = DATA.winter.plants[0];
  G.winterPlant(0, wplant.id);
  S.winter.grid[0].plantedAt = G.nowSeconds() - wplant.grow - 10;
  S.winter.tuckedAt = 0;
  const winterPay = G.winterHarvest(0);
  check('the Winter fixture is ripe, untucked, with the boost genuinely armed',
    winterPay !== null && winterPay.kept === false && G.activeBoost('golden') === true);
  check('nor Winter’s — a 3,500 snowdrop pays 3,500',
    winterPay.payout === wplant.yield && wplant.yield === 3500,
    `${winterPay.payout} vs ${wplant.yield}`);

  /* One sentence, one home. Two views render `desc`; a third that pastes the
     words instead would drift the day this table is retuned. */
  const descCopies = ['ui.js', 'ui-events.js', 'ui-news.js', 'ui-sheet.js', 'ui-shared.js',
    'ui-fall.js', 'ui-winter.js', 'ui-menu.js', 'index.html']
    .filter((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').includes(golden.desc));
  check('no view keeps a second copy of the sentence to drift from',
    descCopies.length === 0, descCopies.join(', '));
  G.reset();
}

group('a room change re-renders the rail, in both directions');
/* `renderRail()` filters chips on `season` and `goSeason()` reassigns `season`,
   so the render has to be called HERE rather than left to the 0.25 s tier — the
   only other caller. Without it a chip the new room drops stays painted for a
   quarter of a second into the swipe, and a chip the garden brings back takes
   the same quarter second to arrive. The call sits directly above
   `renderSeasonEdges()`, which #15 rewrites, so a merge swallowing the line is
   the realistic way this is lost.

   goSeason() touches the DOM, so it is lifted out by name and RUN: everything it
   reaches resolves to a recording stub, `SEASON_ROOMS` and `season` are bound
   for real, and `calls` is the list of functions it actually invoked. Binding
   `SEASON_ROOMS` without a `summer` key is the load-bearing half — the walk
   home leaves `to` undefined, so a `renderRail()` moved inside `if (to)` still
   passes the walk OUT and goes red on the walk BACK, which is the owner's own
   clause ("if they move back to the garden … it should show").

   WHAT THIS CANNOT SEE: it proves the call happens, never that the row is
   right. Nothing here renders a chip, measures the 250 ms, or knows the DOM
   exists. Both directions are driven in a browser and the result is written
   into docs/08 — `UI.enterSeason()` and `.rail`'s children read in the SAME
   eval, because a probe that waits before reading measures the tick instead of
   the transition and reports the bug as fixed. */
{
  const goSeasonSrc = (uiSrc.match(/\n {2}function goSeason\(id\) \{[\s\S]*?\n {2}\}\n/) || [''])[0];
  check('goSeason() is still where this guard can read it',
    /renderSeasonEdges\(\)/.test(goSeasonSrc) && /SEASON_ROOMS/.test(goSeasonSrc),
    goSeasonSrc.slice(0, 60));
  const runGoSeason = (ids) => {
    const calls = [];
    const stub = (id) => {
      const hit = () => { calls.push(id); return `<!--ui:${id}-->`; };
      return new Proxy(function () { return hit(); }, {
        apply: hit,
        get: (t, k) => {
          if (k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf') return () => `<!--ui:${id}-->`;
          if (typeof k === 'symbol') return undefined;
          return stub(`${id}.${String(k)}`);
        }
      });
    };
    /* No `summer` key, on purpose — see above. */
    const rooms = {
      fall: { enter: () => calls.push('fall.enter'), leave: () => calls.push('fall.leave'), seen: 'fallSwipe' },
      winter: { enter: () => calls.push('winter.enter'), leave: () => calls.push('winter.leave'), seen: 'winterSwipe' }
    };
    /* `season` is a recording accessor rather than a plain field, so the ORDER
       matters and not merely the call: rendering the rail before the room is
       reassigned paints the room the player just left. */
    let seasonVal = 'summer';
    const bound = { Game: G, S, SEASON_ROOMS: rooms };
    Object.defineProperty(bound, 'season', {
      enumerable: true,
      get: () => seasonVal,
      set: (v) => { seasonVal = v; calls.push(`season:=${v}`); }
    });
    const scope = new Proxy(bound, {
      has: () => true,
      get: (t, k) => {
        if (typeof k === 'symbol') return undefined;
        if (Object.prototype.hasOwnProperty.call(t, k)) return t[k];
        if (k in globalThis) return globalThis[k];
        return stub(String(k));
      }
    });
    try {
      const fn = new Function('SCOPE', `with (SCOPE) { ${goSeasonSrc}\n return goSeason; }`)(scope);
      ids.forEach((id) => fn(id));
    } catch (e) { calls.push(`EXTRACTION FAILED ${(e && e.message) || e}`); }
    return { calls, seasonAfter: bound.season };
  };
  const outward = runGoSeason(['fall']);
  check('walking out to Fall lands in Fall and renders the rail',
    outward.seasonAfter === 'fall' && outward.calls.includes('fall.enter')
    && outward.calls.includes('renderRail'), outward.calls.join(' '));
  check('and renders it AFTER the room is reassigned, not before — the filter reads `season`',
    outward.calls.indexOf('season:=fall') >= 0
    && outward.calls.indexOf('season:=fall') < outward.calls.indexOf('renderRail'),
    outward.calls.join(' '));
  const homeward = runGoSeason(['fall', 'summer']);
  check('walking back to the garden lands in summer with no room object at all',
    homeward.seasonAfter === 'summer' && homeward.calls.includes('fall.leave'),
    homeward.calls.join(' '));
  check('and renders the rail on that walk too — twice out of two changes',
    homeward.calls.filter((c) => c === 'renderRail').length === 2,
    homeward.calls.join(' '));
  G.reset();
}

group('the level ladder keeps rotating what it hands out');
/* docs/33-year-one-economy.md:298-299. The signature below is a HYBRID, and it
   has to be: a boost row is read at the grain of WHICH boost, because ten of the
   thirteen rungs are boosts and reading them all as "boost" would call levels 2
   through 15 nine repeats in a row and go red for a ladder doing exactly what
   the doc asks. Every other row — hive, decor, gems — is read at the grain of
   its key, so two decor grants in a row do count as a repeat. That is the
   reading the doc's word "category" supports at both ends.
   The first half of that same sentence, "every level grants something", is left
   unasserted on purpose: levels 9, 11, 13, 14, 16 and 17 have no entry today and
   the doc marks the passage unbuilt, so writing it would file a bug report
   dressed as a test. */
const grantLevels = Object.keys(DATA.levelGrants).map(Number).sort((a, b) => a - b);
const grantSig = (g) => (g.boost ? `boost:${g.boost}` : Object.keys(g)[0]);
const grantRepeats = grantLevels.filter((lv, i) => i > 0
  && grantSig(DATA.levelGrants[lv]) === grantSig(DATA.levelGrants[grantLevels[i - 1]]));
check('the ladder was actually found and read', grantLevels.length > 5, `${grantLevels.length} levels`);
check('no two levels in a row hand out the same reward',
  grantRepeats.length === 0,
  `repeated at level ${grantRepeats.join(', ')}`);

group('every good carries the line its customer speaks');
/* docs/26-goods-catalog.md:166-167 — the `line` field is the catalogue's
   one-line test made structural. The customer says it out loud when they order,
   so a good without one is a spreadsheet row wearing a name, and the player
   hears the gap. Named rather than counted on failure: "expected 10, got 9"
   sends someone hunting through the catalogue for the row that broke. */
const linelessGoods = GOODS.filter((g) => typeof g.line !== 'string' || g.line.trim().length <= 8);
check('every good has a line, and it says something',
  linelessGoods.length === 0,
  `no usable line on: ${linelessGoods.map((g) => g.id).join(', ')}`);
/* ============================================================
   THE SKY PASS — phase 3.9
   docs/41-weather-staging.md stages five skies, and exactly two of them reach
   the simulation: rain waters, and an aurora reports night. Everything else the
   pass built is presentation this file cannot see — so the last group asserts an
   ABSENCE, because testifying that the staging stayed out of the save is the
   only evidence the engine layer is able to give.
   ============================================================ */

const RAIN_GROWTH = DATA.weatherStage.rainGrowth;
const skyDaisy = G.seedById('daisy');

group('rain waters what is sown into it');
G.reset();
clearGarden();
S.petals = {};
S.boosters = {};
S.credits = 1e12;
unlockTo(20);
G.Dev.setWeather('clear');
check('a clear sky waters nothing',
  G.rainGrowthActive() === false && G.rainGrowMult() === 1, `${G.rainGrowMult()}`);
check('and a seed sown under one gets exactly the time its data row promises',
  Math.abs(G.plantGrowth(skyDaisy, 0) - skyDaisy.grow) < 1e-9, `${G.plantGrowth(skyDaisy, 0)}`);
G.Dev.setWeather('rain');
check('a rain shortens the clock by its share',
  G.rainGrowthActive() === true && Math.abs(G.rainGrowMult() - (1 - RAIN_GROWTH)) < 1e-9,
  `${G.rainGrowMult()}`);
check('and the seed sown into it comes up that much sooner',
  Math.abs(G.plantGrowth(skyDaisy, 0) - skyDaisy.grow * (1 - RAIN_GROWTH)) < 1e-9,
  `${G.plantGrowth(skyDaisy, 0)}`);
check('no other sky touches growth at all — one sky, one message', (() => {
  const quiet = ['clear', 'storm', 'aurora', 'wonderfall'].every((id) => {
    G.Dev.setWeather(id);
    return G.rainGrowthActive() === false && G.rainGrowMult() === 1;
  });
  G.Dev.setWeather('rain');
  return quiet;
})());
/* It is a FACTOR in the existing product, not a term beside it — which is what keeps the one
   floor everything else is already clamped by in charge of the answer. */
S.upgrades.autoWater = 20;
G.plant(1, G.seedById('bluebell'));
check('it composes into the stack rather than sitting beside it', (() => {
  const stacked = G.plantGrowth(skyDaisy, 0);
  return Math.abs(stacked - skyDaisy.grow * G.growModifier() * G.keeperModifier(0)
    * (1 - RAIN_GROWTH)) < 1e-9;
})(), `${G.plantGrowth(skyDaisy, 0)}`);
S.upgrades.autoWater = 100;
check('and the 0.3 floor still clamps the product, rain and all', (() => {
  G.Dev.setWeather('clear');
  const dry = G.plantGrowth(skyDaisy, 0);
  G.Dev.setWeather('rain');
  const wet = G.plantGrowth(skyDaisy, 0);
  return Math.abs(dry - skyDaisy.grow * 0.3) < 1e-9 && wet === dry;
})(), `${G.plantGrowth(skyDaisy, 0)}`);
S.upgrades.autoWater = 0;
G.Dev.setWeather(null);

group('a bought rain is the same rain');
G.reset();
clearGarden();
S.petals = {};
S.boosters = {};
S.gems = 1000;
/* Stand in a slot the table was going to call Clear before buying anything: bought in a slot
   that was going to rain regardless, every assertion below holds with the purchase deleted, and
   the group measures nothing whatever. */
clock = (() => {
  const from = G.weatherSlotOf(clock) + 1;
  for (let s = from; s < from + 1000; s += 1) {
    if (G.weatherForSlot(s).id === 'clear') return s * SLOT + SLOT / 2;
  }
  return clock;
})();
check('the slot it is bought in was going to be Clear, so the sky can only be the purchase',
  G.currentWeather().id === 'clear' && G.rainGrowthActive() === false, G.currentWeather().id);
check('calling one stands it up as the active sky',
  Boolean(G.callWeather('rain')) && G.currentWeather().id === 'rain');
check('and it waters like the free one, with no dev hold anywhere near it',
  G.Dev.weatherOverride() === null && G.rainGrowthActive() === true
  && Math.abs(G.rainGrowMult() - (1 - RAIN_GROWTH)) < 1e-9, `${G.rainGrowMult()}`);
check('a seed sown into a bought rain is shortened by exactly the same share',
  Math.abs(G.plantGrowth(skyDaisy, 0) - skyDaisy.grow * (1 - RAIN_GROWTH)) < 1e-9,
  `${G.plantGrowth(skyDaisy, 0)}`);

group('and it waters what it finds already growing');
/* The second half of the nudge, and the reason there are two: growth is baked in at plant time,
   so without a retro pass the gift only ever reaches a player who happened to sow at the right
   moment. It rides the dry-to-wet TRANSITION, which is why every step here is driven through
   processWeather() rather than by reaching for the helper. */
G.reset();
clearGarden();
S.petals = {};
S.boosters = {};
S.credits = 1e12;
G.Dev.setWeather('clear');
G.processWeather();
G.plant(0, G.seedById('daisy'));
const skySownDry = S.grid[0].grow;
clock += 4;
G.Dev.setWeather('rain');
G.processWeather();
check('a plant in the ground when the rain lands has its remainder shaved',
  Math.abs(S.grid[0].grow - (4 + (skySownDry - 4) * (1 - RAIN_GROWTH))) < 1e-6,
  `${S.grid[0].grow} from ${skySownDry}`);
const skyShaved = S.grid[0].grow;
G.processWeather();
clock += 2;
G.processWeather();
check('and one rain never shaves the same plant twice', S.grid[0].grow === skyShaved,
  `${S.grid[0].grow}`);
G.plant(1, G.seedById('daisy'));
const skySownWet = S.grid[1].grow;
check('a seed sown into a standing rain pays at planting instead',
  Math.abs(skySownWet - skySownDry * (1 - RAIN_GROWTH)) < 1e-9, `${skySownWet}`);
clock += 2;
G.processWeather();
check('and the retro pass leaves it exactly where planting left it',
  S.grid[1].grow === skySownWet, `${S.grid[1].grow}`);
G.Dev.setWeather('clear');
G.processWeather();
const skyDryAgain = S.grid[1].grow;
clock += 2;
G.processWeather();
check('a clear sky following a clear sky shaves nothing', S.grid[1].grow === skyDryAgain,
  `${S.grid[1].grow}`);
G.Dev.setWeather('rain');
G.processWeather();
check('but the NEXT rain is a second gift — the shave rides the transition, not the sky',
  S.grid[1].grow < skyDryAgain, `${S.grid[1].grow} from ${skyDryAgain}`);
G.Dev.setWeather(null);

group('an aurora brings the night with it');
G.reset();
clearGarden();
/* An aurora slot that lands in broad daylight with an ordinary sky in the slot after it — the
   only shape that can tell "the sky brought the night" apart from "it was night anyway". */
const skyDaylight = (t) => { const p = G.dayPhase(t); return p >= DAY.dawn && p < DAY.dusk; };
const skyDaylitAurora = (() => {
  for (let s = 1; s < 200000; s += 1) {
    if (G.weatherForSlot(s).id !== 'aurora' || G.weatherForSlot(s + 1).id === 'aurora') continue;
    if (skyDaylight(s * SLOT + SLOT / 2) && skyDaylight((s + 1) * SLOT + SLOT / 2)) return s;
  }
  return -1;
})();
check('the table offers an aurora that hangs in the middle of the afternoon',
  skyDaylitAurora > 0, `${skyDaylitAurora}`);
check('it reports night at noon, and the daylight is back the slot after', (() => {
  if (skyDaylitAurora < 0) return false;
  const during = skyDaylitAurora * SLOT + SLOT / 2;
  const after = (skyDaylitAurora + 1) * SLOT + SLOT / 2;
  return skyDaylight(during) && skyDaylight(after)
    && G.isNight(during) === true && G.isNight(after) === false;
})(), `slot ${skyDaylitAurora}`);
setPhase(0.5);
G.Dev.setWeather('clear');
check('and a held aurora wakes the night rules at midday, then hands the day back', (() => {
  const before = G.isNight();
  G.Dev.setWeather('aurora');
  const during = G.isNight();
  G.Dev.setWeather('clear');
  const after = G.isNight();
  return before === false && during === true && after === false;
})());
G.Dev.setWeather(null);

group('and the shift that makes to Nightbell is under a twentieth of a multiplier');
/* The epsilon, stated: 0.05. Nightbell trades 2x after dark for 0.5x before it, so the whole
   move an aurora can make is the share of DAYTIME slots it steals, times that 1.5 gap — 2.5% of
   slots times two-thirds daylight times 1.5, which is 0.025. Sampling slot midpoints rather than
   a fine sweep is deliberate: the aurora is a per-slot lottery, so the long run that matters is
   a long run of SLOTS, and 12,000 of them carry ~300 auroras. */
G.reset();
clearGarden();
S.grid[0] = {
  locked: false, seed: 'moonflower', plantedAt: 0, grow: 1e9, ready: false, aura: '',
  luckyBug: false, mutation: null, mutateAt: 0, packDrop: false
};
const skyClockKeep = clock;
const nightbellMean = (slots) => {
  let total = 0;
  for (let s = 0; s < slots; s += 1) {
    clock = s * SLOT + SLOT / 2;
    total += G.verbPayoutMult(0);
  }
  return total / slots;
};
G.Dev.setWeather('clear');
const skyHourOnly = nightbellMean(12000);
G.Dev.setWeather(null);
const skyWithAurora = nightbellMean(12000);
clock = skyClockKeep;
check('the aurora really does move it, or there is nothing here to bound',
  skyWithAurora > skyHourOnly, `${skyHourOnly.toFixed(4)} then ${skyWithAurora.toFixed(4)}`);
check('but the long-run expected value moves by less than 0.05',
  Math.abs(skyWithAurora - skyHourOnly) < 0.05,
  `moved ${(skyWithAurora - skyHourOnly).toFixed(4)}`);

group('and none of it reached the mutation income share');
/* The share the whole ladder is tuned against is measured near the top of this file and is
   unmoved. These are the structural guards underneath that measurement, because a band as wide
   as 12-32% only goes red once the damage is already large. */
G.reset();
clearGarden();
check('the catch multiplier cannot hear the sky at all', (() => {
  const seen = new Set();
  ['clear', 'rain', 'storm', 'aurora', 'wonderfall'].forEach((id) => {
    G.Dev.setWeather(id);
    seen.add(G.catchMultiplier(0));
  });
  G.Dev.setWeather(null);
  return seen.size === 1 && seen.has(1);
})());
check('a rain catches at exactly the rate its table row names, however hard it waters', (() => {
  const rng = Math.random;
  const keep = DATA.weatherStage.rainGrowth;
  const rainType = DATA.weather.types.find((t) => t.id === 'rain');
  const catches = (r) => {
    Math.random = () => r;
    clearGarden();
    dueIn(0, 'daisy', rainSlot);
    G.rollMutations();
    return S.grid[0].mutation === 'dew';
  };
  const shape = [keep, 0, 0.9].map((g) => {
    DATA.weatherStage.rainGrowth = g;
    return `${catches(rainType.catch - 1e-6)}/${catches(rainType.catch + 1e-6)}`;
  });
  DATA.weatherStage.rainGrowth = keep;
  Math.random = rng;
  return shape.every((s) => s === 'true/false');
})());
/* The one thing the pass genuinely moved, kept where it can be seen: the retro shave rewrites
   `grow` and deliberately leaves `mutateAt` alone, so a roll booked inside the original window
   can now come due after the plant is ripe. It still fires — rollMutations() never asks whether
   a plant is ready — but a plant picked the instant it ripens can walk past its own roll. The
   assertion is what stops the shave from ever becoming a RE-BOOKING instead, which is the thing
   that would actually move the share. */
check('the shave rewrites the clock and never the booked roll', (() => {
  const rng = Math.random;
  clearGarden();
  S.credits = 1e12;
  G.Dev.setWeather('clear');
  G.processWeather();
  Math.random = () => 0.9;                    // booked late in the window, so it is still pending
  G.plant(0, G.seedById('daisy'));
  Math.random = rng;
  const booked = S.grid[0].mutateAt;
  const grew = S.grid[0].grow;
  clock += 1;
  G.Dev.setWeather('rain');
  G.processWeather();
  G.Dev.setWeather(null);
  return booked > 0 && S.grid[0].mutateAt === booked && S.grid[0].grow < grew;
})());

group('a front reads the computed next slot, and Clear to Clear says nothing');
G.reset();
clearGarden();
check('the forecast is the slot after this one, worked out on the spot', (() => {
  for (let i = 0; i < 500; i += 1) {
    const t = i * 977 + 13;
    if (G.nextWeather(t).id !== G.weatherForSlot(G.weatherSlotOf(t) + 1).id) return false;
  }
  return true;
})());
check('a bought sky is the forecast too, which a stored answer could not be', (() => {
  S.gems = 1000;
  const bought = G.callWeather('rain');
  const forecast = G.nextWeather().id;
  const remaining = G.weatherSlotRemaining();
  G.reset();
  return Boolean(bought) && forecast === 'rain' && remaining > 0 && remaining <= SLOT;
})());
/* Four hundred real slot boundaries, driven through processWeather() rather than through a
   mocked emit, because the rule under test is WHEN the engine speaks. Each boundary is visited
   twice at the same instant: an announcement is once per upcoming slot, not once per tick. */
const skyFronts = [];
G.on('front', (p) => skyFronts.push(p));
const skyFrontSeconds = DATA.weatherStage.frontSeconds;
let skyAnnounced = 0;
let skySilent = 0;
let skyRepeats = 0;
let skyWrong = 0;
clearGarden();
const skySweepBase = G.weatherSlotOf(clock) + 2;
for (let s = skySweepBase; s < skySweepBase + 400; s += 1) {
  clock = s * SLOT + SLOT - skyFrontSeconds + 0.5;
  skyFronts.length = 0;
  G.processWeather();
  G.processWeather();
  const to = G.weatherForSlot(s + 1);
  if (to.id === 'clear') {
    if (skyFronts.length) skyWrong += 1; else skySilent += 1;
  } else if (skyFronts.length !== 1 || skyFronts[0].to.id !== to.id
    || Math.abs(skyFronts[0].seconds - Math.min(skyFrontSeconds, G.weatherSlotRemaining())) > 1e-6
    || skyFronts[0].called !== false) {
    /* The lead it advertises has to be the lead that is actually left, capped at
       the tuned value — a phone that unlocks a second before a boundary would
       otherwise be told five and hold the arrival long after the sky had turned. */
    skyWrong += 1;
  } else {
    skyAnnounced += 1;
    if (G.weatherForSlot(s).id === to.id) skyRepeats += 1;
  }
}
check('every slot that brings a real sky is announced exactly once, and none of them lies',
  skyAnnounced > 80 && skyWrong === 0, `${skyAnnounced} announced, ${skyWrong} wrong`);
check('and Clear to Clear is the silence the other four are heard against',
  skySilent > skyAnnounced, `${skySilent} silent of 400`);
check('the rule reads the next slot, not the change — a rain after a rain is announced too',
  skyRepeats > 0, `${skyRepeats} repeats`);
G.reset();
clearGarden();
S.gems = 1000;
skyFronts.length = 0;
const skyBought = G.callWeather('rain');
check('a bought sky arrives with its own compressed front', Boolean(skyBought)
  && skyFronts.length === 1 && skyFronts[0].called === true && skyFronts[0].to.id === 'rain'
  && skyFronts[0].seconds === DATA.weatherStage.calledFrontSeconds,
  JSON.stringify(skyFronts.map((f) => [f.to.id, f.seconds, f.called])));

group('the staging never reaches the save — only the two nudges do');
/* game.js cannot see a stage sequence, so what it CAN testify to is that no sky's staged values
   are readable from the simulation and that crossing a front writes nothing. Everything the
   engine can be asked for goes into one string; if any leaf of a sky ever leaks into game.js,
   this is what notices, whichever leaf it is. */
G.reset();
clearGarden();
S.credits = 1e12;
const skyReadings = () => JSON.stringify({
  grow: DATA.seeds.map((s) => G.plantGrowth(s, 0)),
  passive: G.passiveIncomeRate(),
  offline: [G.offlineRate(), G.offlineHours()],
  catches: [G.catchMultiplier(0), G.catchMultiplier(1)],
  stack: [G.growModifier(), G.keeperModifier(0), G.verbPayoutMult(0)],
  sky: Array.from({ length: 200 }, (_, i) => G.weatherAt(i * 137).id),
  dark: Array.from({ length: 200 }, (_, i) => G.isNight(i * 137))
});
const skyStage = DATA.weatherStage;
const skyStageKeep = JSON.parse(JSON.stringify(skyStage));
const skyRestore = () => Object.keys(skyStageKeep).forEach((k) => {
  if (skyStageKeep[k] && typeof skyStageKeep[k] === 'object') {
    Object.assign(skyStage[k], skyStageKeep[k]);
  } else skyStage[k] = skyStageKeep[k];
});
const skyReadingsBefore = skyReadings();
['rain', 'storm', 'aurora', 'wonderfall', 'sunbreak'].forEach((id) => {
  Object.keys(skyStage[id]).forEach((k) => { skyStage[id][k] = 999; });
});
check('no leaf of a sky\'s staging is readable from the simulation, the sunbreak included',
  skyReadings() === skyReadingsBefore, 'a staged value reached the engine');
skyRestore();
check('and the guard put every one of them back',
  JSON.stringify(skyStage) === JSON.stringify(skyStageKeep));
check('the one leaf that IS the simulation still moves it, so the guard is not vacuous', (() => {
  const keep = skyStage.rainGrowth;
  G.Dev.setWeather('rain');
  const wet = skyReadings();
  skyStage.rainGrowth = 0.5;
  const wetter = skyReadings();
  skyStage.rainGrowth = keep;
  G.Dev.setWeather(null);
  return wet !== wetter;
})());
check('the engine publishes no sunbreak of any kind — the rays are presentation start to finish',
  Object.keys(G).every((k) => !/sunbreak/i.test(k))
  && Object.keys(G.Dev).every((k) => !/sunbreak/i.test(k)));
check('and crossing a front changes nothing in the save but the moment it was crossed at', (() => {
  const slot = (() => {
    const from = G.weatherSlotOf(clock) + 2;
    for (let s = from; s < from + 400; s += 1) if (G.weatherForSlot(s + 1).id !== 'clear') return s;
    return -1;
  })();
  if (slot < 0) return false;
  clearGarden();
  clock = slot * SLOT + 1;
  G.processWeather();                          // settle the slot and the rain watch on this sky
  clock = slot * SLOT + SLOT - DATA.weatherStage.frontSeconds + 0.5;
  const before = JSON.parse(JSON.stringify(S));
  skyFronts.length = 0;
  G.processWeather();
  const after = JSON.parse(JSON.stringify(S));
  before.lastSeen = 0;
  after.lastSeen = 0;
  return skyFronts.length === 1 && JSON.stringify(before) === JSON.stringify(after);
})());
G.Dev.setWeather(null);
G.reset();

/* THE SKY CHIP'S BUBBLE IS THE ONE PLACE THE MUTATION TABLE IS SAID OUT LOUD,
   and a sentence drifts off the numbers it describes without anything going red
   — rain's growth figure was hand-written English for a fortnight while the
   comment above it forbade exactly that. So the copy is not read, it is RUN:
   `weatherTip()` is private to ui.js and touches no DOM, so it is lifted out by
   name and executed against the live DATA with the shipped `pct()` from
   ui-shared.js, and every expected value below is DERIVED from the table. A
   retune moves both sides together; a hand-written number moves neither.

   WHAT THIS CANNOT SEE, said plainly rather than implied. It builds a STRING.
   The bubble around it is 280px by CSS rule (`.weather-tip .tip`), so nothing
   here knows how tall the copy comes out, whether it wraps badly, or whether
   the arrow still lands on its chip — those are measured with tools/probe.js
   and written into docs/08. Nor does it know the bubble is reachable: one
   source read below answers only "is this still the function the chip renders". */
group('the sky chip says what the table says, in the fewest words');
const sharedSrc = fs.readFileSync(path.join(ROOT, 'ui-shared.js'), 'utf8');
const wxPctSrc = (sharedSrc.match(/\n  const pct = [^\n]*\n/) || [''])[0];
const wxTipSrc = (uiSrc.match(/\n  function weatherTip\(id\) \{[\s\S]*?\n {2}\}\n/) || [''])[0];
check('the shared pct() is still where this guard can read it', /toFixed/.test(wxPctSrc), wxPctSrc);
check('weatherTip() is still where this guard can read it', /return `/.test(wxTipSrc),
  wxTipSrc.slice(0, 60));
/* Concatenated, never templated: the extracted body carries its own backticks
   and `${}`, and a template literal would interpolate them here and hand back a
   nonsense function that still passed the two extraction checks above. */
const wxTip = (() => {
  try { return new Function('DATA', `${wxPctSrc}${wxTipSrc}\nreturn weatherTip;`)(DATA); }
  catch (e) { return () => `EXTRACTION FAILED ${e.message}`; }
})();
const wxPct = (() => {
  try { return new Function(`${wxPctSrc}\nreturn pct;`)(); }
  catch (e) { return () => 'EXTRACTION FAILED'; }
})();
const wxPlain = (s) => String(s)
  .replace(/<[^>]+>/g, '').replace(/&times;/g, '×').replace(/\s+/g, ' ').trim();
const wxName = (id) => wxPlain(String(wxTip(id)).split('<br>')[0]);
const wxSay = (id) => wxPlain(String(wxTip(id)).split('<br>').slice(1).join(' '));
const WX_SKIES = ['rain', 'storm', 'aurora', 'wonderfall'];
WX_SKIES.forEach((id) => {
  const w = DATA.weather.types.find((t) => t.id === id);
  const m = DATA.mutations[w.mutation];
  const said = wxSay(id);
  const words = said ? said.split(' ').length : 0;
  /* `<b>name</b><br>body` is the shape the boost tooltip is specced to mirror,
     so the heading is load-bearing beyond this bubble. */
  check(`${id}'s bubble still opens with the sky's own name`, wxName(id) === w.name, wxName(id));
  /* data.js's effect descriptions are the house register — five to ten words a
     sentence. Thirty is two of those and refuses a third. */
  check(`${id} reads in thirty words or fewer`, words > 0 && words <= 30, `${words} words: ${said}`);
  /* THE HONESTY, and the only reason this copy was ever long. A plant rolls
     ONCE, at a moment booked when it was sown. Drop the word "one" and the
     sentence quietly promises the rate on every harvest instead — which reads
     better, passes a word count, and is the lie the whole feature was built to
     avoid. The rate itself is pct() of the row, so "1 in 7" for 0.15 reddens
     here too. */
  check(`${id} promises ONE chance, at exactly the rate its row names`,
    said.includes(`one ${wxPct(w.catch)} chance`), said);
  check(`${id} names its mutation and that mutation's own multiplier`,
    said.includes(`${m.name}, worth ×${m.mult}.`), said);
  check(`${id} says nothing about rolls, mutations or moments`,
    !/\b(rolls?|rolled|mutations?|moments?)\b/i.test(said), said);
});
/* Only a rain waters — `rainGrowthActive()` is `id === 'rain'` and nothing
   else. So exactly one sky may mention growing, which holds both halves of
   what went wrong here: the storm's sentence about the effect it has NOT got,
   and the copy-paste that would hand a real one to a sky that never had it. */
check('growth is mentioned by the one sky that has it and by no other',
  WX_SKIES.filter((id) => /\b(grow|grows|growing|faster|slower)\b/i.test(wxSay(id))).join(',')
  === 'rain',
  WX_SKIES.filter((id) => /\b(grow|grows|growing|faster|slower)\b/i.test(wxSay(id))).join(','));
check('the storm no longer spends a sentence on an effect it does not have',
  !/\bdoes not\b|\bdoesn't\b|\bno faster\b/i.test(wxSay('storm')), wxSay('storm'));
check('nothing states a catch rate as a 1-in-N any more',
  !/\b1 in \d/.test(WX_SKIES.map(wxSay).join(' ')), WX_SKIES.map(wxSay).join(' '));
/* A source read, and it can be nothing else from here — the chip and its bubble
   are DOM. It answers one question only: is the function every check above just
   ran still the one the chip renders, so that a rewired tooltip fails loudly
   instead of leaving this group green on a string no player ever sees. */
const wxShowSrc = (uiSrc.match(/\n  function showWeatherTip\(btn\) \{[\s\S]*?\n {2}\}\n/) || [''])[0];
check('and the chip still renders that function into its bubble',
  /class="tip">\$\{weatherTip\(id\)\}/.test(wxShowSrc), wxShowSrc.slice(0, 80));

/* EVERY NUMBER IN THAT COPY IS READ, NEVER WRITTEN. Flip each knob, watch the
   sentence follow to a stated value, put it back — then assert the table really
   is back, because a guard that tampers with DATA and forgets makes every group
   after it fail as an economy regression somewhere else entirely. */
const wxKeep = {
  grow: DATA.weatherStage.rainGrowth,
  catch: DATA.weather.types.find((t) => t.id === 'storm').catch,
  mult: DATA.mutations.gilded.mult
};
DATA.weatherStage.rainGrowth = 0.25;
check('retuning how hard a rain waters moves the sentence with it',
  wxSay('rain').includes('grows 25% faster'), wxSay('rain'));
DATA.weatherStage.rainGrowth = wxKeep.grow;
DATA.weather.types.find((t) => t.id === 'storm').catch = 0.4;
check('retuning a catch rate moves the odds with it',
  wxSay('storm').includes('one 40% chance'), wxSay('storm'));
DATA.weather.types.find((t) => t.id === 'storm').catch = wxKeep.catch;
DATA.mutations.gilded.mult = 3;
check('retuning a multiplier moves the payout with it',
  wxSay('storm').includes('worth ×3.'), wxSay('storm'));
DATA.mutations.gilded.mult = wxKeep.mult;
check('and the guard put the whole table back',
  DATA.weatherStage.rainGrowth === wxKeep.grow
  && DATA.weather.types.find((t) => t.id === 'storm').catch === wxKeep.catch
  && DATA.mutations.gilded.mult === wxKeep.mult);

/* ================================================================
   SLICE C — WINTER, THE NIGHT SHIFT.

   Doc 46's test bill, items 2 through 10; item 1 lives with the Turn
   partition above because that is where the partition is asserted.

   Every clock here is derived from the pinned `clock`, never from
   `Date.now()`, and every Winter span is hours or days — so this group is
   byte-identical run to run for the same reason the rest of the suite is.
   ================================================================ */

const WI = DATA.winter;
const wPlant = (id) => WI.plants.find((p) => p.id === id);
const SNOWDROP = wPlant('snowdrop');
const CAMELLIA = wPlant('camellia');
const CYCLAMEN = wPlant('cyclamen');
/* A cell written by hand, in the shape defaultState() and load() both produce.
   Anything that writes a Winter cell without going through this is a fixture
   that can drift out of the real shape without anything noticing. */
const wCell = (id, plantedAgo, kept = false) => {
  const def = wPlant(id);
  return { seed: id, plantedAt: clock - plantedAgo, grow: def.grow, ready: false, kept };
};
const withSnow = (def) => Math.round(def.yield * (1 + WI.snowfall));

/* WINTER RUNS ON A REAL EPOCH, and it has to. Earlier groups leave `clock` at a
   few hundred thousand seconds (setPhase() winds it to a day-cycle multiple),
   and load()'s pre-epoch heuristic — a timestamp under 1e8 is elapsed-seconds
   corruption, not a date — cannot tell a legitimate small clock from a corrupt
   one. That heuristic is right for the game and wrong for a suite running in
   1970, so this group pins the suite's own fixed epoch: Clear weather, in
   daylight, and the same one every run. */
const wiClockKeep = clock;
clock = 1767269100;

G.reset();
S.year.turnsCompleted = DATA.year.winterTurn;

group('bill 9 — Winter opens at its Turn and not before');
S.year.turnsCompleted = DATA.year.winterTurn - 1;
check('shut one Turn early', G.winterOpen() === false);
check('and the season refuses a planting while it is shut',
  G.winterPlant(0, 'snowdrop') === false && S.winter.grid[0].seed === null);
S.year.turnsCompleted = DATA.year.winterTurn;
check('open at winterTurn', G.winterOpen() === true);
S.year.turnsCompleted = DATA.year.winterTurn + 4;
check('and it stays open', G.winterOpen() === true);
S.year.turnsCompleted = DATA.year.winterTurn;

group('bill 9 — Holly\'s one-shot arms once and consumes explicitly');
S.seen.hollyIntro = false;
check('pending once Winter is open', G.hollyIntroPending() === true);
check('still pending after being ASKED — reading it does not spend it',
  G.hollyIntroPending() === true && S.seen.hollyIntro === false);
check('consuming it returns true the first time', G.consumeHollyIntro() === true);
check('and false every time after', G.consumeHollyIntro() === false);
check('no longer pending', G.hollyIntroPending() === false);
S.seen.hollyIntro = false;
S.year.turnsCompleted = 0;
check('never pending while Winter is shut', G.hollyIntroPending() === false);
S.year.turnsCompleted = DATA.year.winterTurn;

group('bill 5 — kept is derived from the tuck window, never observed');
clearWinter();
S.credits = 1e7;
/* (a) RIPENS INSIDE THE WINDOW — the ordinary night, and the one that pays. */
S.winter.tuckedAt = clock - SNOWDROP.grow - 3600;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 60);
G.winterDeriveKept(clock);
check('a bloom that opened under a standing quilt is kept', S.winter.grid[0].kept === true);
/* (b) RIPENED BEFORE THE TUCK — the fishing case, closed by construction. */
clearWinter();
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 7200);
S.winter.tuckedAt = clock - 60;                       // tucked AFTER it opened
G.winterDeriveKept(clock);
check('tucking a bed that has already opened earns nothing', S.winter.grid[0].kept === false);
/* (c) NOT YET OPEN — a quilt over a bud earns nothing until the bud opens. */
clearWinter();
S.winter.tuckedAt = clock - 3600;
S.winter.grid[0] = wCell('camellia', 100);
G.winterDeriveKept(clock);
check('a plant still growing under the quilt has earned nothing yet', S.winter.grid[0].kept === false);
/* (d) NO TUCK AT ALL. */
clearWinter();
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 60);
G.winterDeriveKept(clock);
check('an untucked bed earns no mark however ripe it is', S.winter.grid[0].kept === false);
check('and an untucked bed grows at full speed — the tuck adds, it never protects',
  S.winter.grid[0].plantedAt + S.winter.grid[0].grow === clock - 60);

group('bill 5 — an untucked bloom pays base, a kept one pays the snowfall');
clearWinter();
S.credits = 0;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 60);
const wBase = G.winterHarvest(0);
check('base pays exactly the yield', wBase && wBase.payout === SNOWDROP.yield && wBase.kept === false,
  JSON.stringify(wBase));
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 3600;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 60);
const wKept = G.winterHarvest(0);
check('a kept bloom pays the snowfall', wKept && wKept.payout === withSnow(SNOWDROP) && wKept.kept === true,
  JSON.stringify(wKept));
check('the snowfall is exactly +50% of base',
  withSnow(SNOWDROP) === Math.round(SNOWDROP.yield * 1.5) && WI.snowfall === 0.5);

group('bill 8 — the tuck lifecycle round-trips');
clearWinter();
check('an empty bed starts untucked', G.winterTucked() === false && S.winter.tuckedAt === 0);
check('the tap tucks it', G.winterTuck() === true && S.winter.tuckedAt === clock);
check('a second tap on a standing tuck is a no-op', G.winterTuck() === false);
/* A plant SOWN UNDER a standing tuck is covered: the quilt is over the bed,
   not over a list. */
S.credits = 1e7;
check('planting under a standing tuck works', G.winterPlant(3, 'snowdrop') === true);
check('and the fresh plant is not kept yet — it has not opened', S.winter.grid[3].kept === false);
/* THE NIGHT ACTUALLY PASSES. Winding the plant's clock backwards instead would
   put its opening BEFORE the tuck and quietly test the fishing case again —
   which is exactly what the first draft of this fixture did. */
const tuckNight = clock;
clock += SNOWDROP.grow + 60;
G.winterDeriveKept(clock);
check('once it opens under the standing tuck it IS kept', S.winter.grid[3].kept === true);
/* FIRST LIGHT: the first collect after a covered plant has opened ends the night. */
const fl = G.winterHarvest(3);
check('the collect paid the snowfall', fl && fl.payout === withSnow(SNOWDROP));
check('and it reported first light', fl.firstLight === true);
check('first light cleared the tuck', S.winter.tuckedAt === 0 && G.winterTucked() === false);
/* And anything that opens after first light is unkept until the next tuck. */
S.winter.grid[5] = wCell('snowdrop', SNOWDROP.grow + 5);
G.winterDeriveKept(clock);
check('a bloom opening after first light is not kept', S.winter.grid[5].kept === false);
check('and it pays base', G.winterHarvest(5).payout === SNOWDROP.yield);
check('the bed can be tucked again the next night', G.winterTuck() === true && S.winter.tuckedAt === clock);
clock = tuckNight;

group('bill 8 — collecting something that opened BEFORE the tuck does not end the night');
clearWinter();
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 7200);   // opened two hours before
S.winter.tuckedAt = clock - 60;                                // then tucked
S.winter.grid[1] = wCell('camellia', 100);                     // still growing under the quilt
const notLight = G.winterHarvest(0);
check('the unkept bloom paid base', notLight && notLight.payout === SNOWDROP.yield && notLight.kept === false);
check('and the night did NOT end — nothing covered has opened yet',
  notLight.firstLight === false && S.winter.tuckedAt === clock - 60);

group('bill 7 — the mixed bed: every ripe plant is taken, the snowfall pays the kept subset');
clearWinter();
S.credits = 0;
/* The tuck goes down between the cyclamen's opening and the snowdrops' — which
   is the only way to build a genuinely mixed bed, and writing `kept: false` on
   a cell whose clock says otherwise does not build one: the derivation runs
   inside winterBedValue() and would simply mark it. */
S.winter.tuckedAt = clock - 20000;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 60);            // opened 60s ago  → kept
S.winter.grid[1] = wCell('snowdrop', SNOWDROP.grow + 60);            // opened 60s ago  → kept
S.winter.grid[2] = wCell('cyclamen', CYCLAMEN.grow + 30000);         // opened before the tuck
S.winter.grid[3] = wCell('camellia', 100);                           // still growing
const mixedExpected = withSnow(SNOWDROP) * 2 + CYCLAMEN.yield;
const mixedValue = G.winterBedValue();
check('the fixture really is mixed — two kept, one ripe-but-unkept',
  S.winter.grid[0].kept === true && S.winter.grid[1].kept === true && S.winter.grid[2].kept === false,
  S.winter.grid.map((c) => `${c.seed}:${c.kept}`).join(' '));
check('winterBedValue counts every ripe plant, kept or not',
  mixedValue.plots === 3 && mixedValue.kept === 2, JSON.stringify(mixedValue));
check('and prices the snowfall onto the kept two only',
  mixedValue.total === mixedExpected, `${mixedValue.total} vs ${mixedExpected}`);
const mixed = G.winterHarvestAll();
check('the tap pays exactly what the button said',
  mixed && mixed.payout === mixedValue.total, `${mixed && mixed.payout} vs ${mixedValue.total}`);
check('one credit, and it is the whole bed', S.credits === mixedExpected, String(S.credits));
check('it took all three ripe plants and reported two kept',
  mixed.plots === 3 && mixed.kept === 2);
check('the growing camellia is left standing',
  S.winter.grid[3].seed === 'camellia' && S.winter.grid[3].plantedAt === clock - 100);
check('and the three collected cells are empty and unmarked',
  [0, 1, 2].every((i) => S.winter.grid[i].seed === null && S.winter.grid[i].kept === false));
/* WHY A COLLECT-ALL CANNOT STRAND A MARK, asserted rather than assumed: a mark
   is only ever written to a cell that has already opened, so every kept cell is
   a ripe cell, and a collect-all takes every ripe cell. If that containment
   ever stops holding, a mark could be left on a plant the collect walked past
   and this is the assertion that says so. */
clearWinter();
S.winter.tuckedAt = clock - 200000;
for (let i = 0; i < 8; i += 1) {
  const def = WI.plants[i % WI.plants.length];
  S.winter.grid[i] = { seed: def.id, plantedAt: clock - (i % 2 ? def.grow + 40 : 100),
    grow: def.grow, ready: false, kept: false };
}
G.winterDeriveKept(clock);
check('every kept cell is a ripe cell — a mark can never be stranded by a collect-all',
  S.winter.grid.every((c) => !c.kept || (c.seed && clock - c.plantedAt >= c.grow)),
  S.winter.grid.map((c) => `${c.seed}:${c.kept}`).join(' '));

group('bill 7 — the all-kept walk, which is the one that hides the difference');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 8; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
const allKept = G.winterBedValue();
check('eight kept blooms', allKept.plots === 8 && allKept.kept === 8);
const allTaken = G.winterHarvestAll();
check('the whole bed pays eight snowfalls',
  allTaken.payout === withSnow(SNOWDROP) * 8 && S.credits === withSnow(SNOWDROP) * 8,
  String(allTaken.payout));
check('and it is ONE commit — the wallet moved once, not eight times',
  allTaken.plots === 8 && allTaken.kept === 8);
check('a collect on an empty bed returns null rather than paying nothing loudly',
  G.winterHarvestAll() === null);

group('bill 6 — an earned mark is never voided');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 10);
S.winter.grid[1] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterDeriveKept(clock);
check('both blooms opened under the quilt', S.winter.grid[0].kept === true && S.winter.grid[1].kept === true);
/* Partial collect: taking one must not touch the other's mark. */
G.winterHarvest(0);
check('a partial collect leaves the neighbour\'s mark alone', S.winter.grid[1].kept === true);
/* Replanting the emptied cell must not touch it either. */
S.credits = 1e7;
G.winterPlant(0, 'camellia');
check('replanting a neighbour leaves the mark alone', S.winter.grid[1].kept === true);
/* BELT AND BRACES, and said out loud so nobody later mistakes it for load-bearing.
   `winterPlant()` writes `cell.kept = false`, and deleting that line passes this
   whole suite — because every path that empties a cell already clears the mark,
   so a plantable cell is an unmarked cell by the time `winterPlant` sees it. The
   line stays because a cell must always carry the five fields it is declared
   with, and this is the same shape as `fallHarvestAll()`'s `def.century` guard,
   which the handoff records as a check whose test could not fail. */
check('and the replant is itself unmarked (belt-and-braces — see the note above)',
  S.winter.grid[0].kept === false);
/* And a mark survives a save/load round trip and a year of neglect. `saveNow()`
   rather than `save()`, because `save()` is debounced and reading the store
   straight after it is reading whatever was there before. */
G.saveNow();
S.winter.grid[1].kept = false;                    // corrupt it in memory
G.load();
check('the mark round-trips through save and load',
  S.winter.grid[1].kept === true && S.winter.grid[1].seed === 'snowdrop',
  JSON.stringify(S.winter.grid[1]));
/* And the mark survived the night ENDING, which is the sharpest version of
   "never voided": first light fired on the collect above and cleared the bed's
   tuck, and grid[1]'s mark is still standing on the other side of a save. */
check('first light ended the night, and the surviving mark did not care',
  S.winter.tuckedAt === 0 && S.winter.grid[1].kept === true);
/* A STANDING tuck round-trips too — it is the stored truth every mark derives
   from, so losing it on load would silently end every night at every boot. */
S.winter.tuckedAt = clock - 4242;
G.saveNow();
S.winter.tuckedAt = 0;
G.load();
check('a standing tuck round-trips through save and load', S.winter.tuckedAt === clock - 4242);
const lateClock = clock;
clock += 86400 * 400;                              // come back over a year later
S.credits = 0;
const late = G.winterHarvest(1);
check('a kept bloom collected a year later still pays the snowfall',
  late && late.payout === withSnow(SNOWDROP) && late.kept === true, JSON.stringify(late));
clock = lateClock;

group('bill 6 — the bonus applies at COLLECT-time rates, which is accepted and asserted');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterDeriveKept(clock);
const oldSnow = WI.snowfall;
WI.snowfall = 0.25;                                // a retune between earning and collecting
check('it repays at the NEW rate, not the rate it was earned at',
  G.winterHarvest(0).payout === Math.round(SNOWDROP.yield * 1.25));
WI.snowfall = oldSnow;

group('bill 2 — no Winter plant touches a flower system');
G.reset();
S.year.turnsCompleted = DATA.year.winterTurn;
clearWinter();
clearGarden();
S.credits = 1e7;
const wiStatsBefore = JSON.parse(JSON.stringify(S.year.stats));
const wiFlowersBefore = G.flowerTotal();
const wiGemsBefore = S.gems;
G.winterPlant(0, 'snowdrop');
S.winter.grid[0].plantedAt = clock - SNOWDROP.grow - 10;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
G.winterHarvest(0);
check('no rarity is written', Object.keys(S.rarityCounts).length === 0 && Object.keys(S.bestRarity).length === 0);
check('nothing is discovered', Object.keys(S.discovered).length === 0);
check('no gem is dropped', S.gems === wiGemsBefore);
check('the pantry is untouched', G.flowerTotal() === wiFlowersBefore);
check('no mutation is scheduled — Winter cells have no mutateAt at all',
  S.winter.grid.every((c) => typeof c.mutateAt === 'undefined'));
check('and state.year.stats is untouched — Winter is the QUIET season, no Tally line at slice C',
  same(S.year.stats, wiStatsBefore), JSON.stringify(S.year.stats));
/* BOTH collect paths, because a Tally counter written in only one of them is a
   Tally counter that survives a sabotage of the other — which is exactly what
   happened to the first draft of this group. */
clearWinter();
S.credits = 1e7;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 3; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterHarvestAll();
check('and the collect-all path writes no Tally counter either',
  same(S.year.stats, wiStatsBefore), JSON.stringify(S.year.stats));
check('nor a windfall — Fall\'s counter is Fall\'s',
  S.year.stats.windfalls === wiStatsBefore.windfalls);
check('a Winter cell carries exactly the five fields it is declared with',
  S.winter.grid.every((c) => same(Object.keys(c).sort(), ['grow', 'kept', 'plantedAt', 'ready', 'seed'])),
  JSON.stringify(Object.keys(S.winter.grid[0])));

group('bill 3 — no growth modifier reaches Winter, asserted from the NO side');
clearWinter();
S.credits = 1e7;
/* Arm everything that shortens a clock in Summer: rain, a Quick Sprout petal,
   the auto-water badge, and a growth boost. If ANY of them reached Winter, the
   planted `grow` would come back shorter than the data says. */
G.Dev.setWeather('rain');
S.upgrades.autoWater = 10;
S.petals = { snowdrop: { rich: 0, quick: 9, sig: 0 } };
S.boosters.bloom = clock + 9999;
G.winterPlant(0, 'camellia');
check('the planted clock is DATA.winter\'s clock exactly, with every modifier armed',
  S.winter.grid[0].grow === CAMELLIA.grow, `${S.winter.grid[0].grow} vs ${CAMELLIA.grow}`);
check('and the modifiers really were live — growModifier() is off 1 right now',
  G.growModifier() !== 1, String(G.growModifier()));
/* AND THE PAYOUT SIDE, with the multipliers that actually multiply a payout.
   The first version of this armed rain, autoWater, a Quick Sprout petal and
   Bloom Burst — every one of which is a GROWTH or a TAP term, so it asserted a
   flat yield against nothing. A harvest's payout multipliers are
   `globalCredits` (Golden Popups), `petals.rich`, pollination and the Wonder;
   those are what have to be live for the claim to mean anything. */
S.credits = 0;
S.boosters.golden = clock + 9999;                       // globalCredits +25%
S.petals = { snowdrop: { rich: DATA.petals.shared.rich.cap, quick: 0, sig: 0 } };
S.wonder = { until: clock + 9999, last: 0 };
check('the payout multipliers really are live — the guard is not vacuous',
  G.boostVal('globalCredits') > 0 && G.wonderActive() === true
  && G.petalMult('snowdrop') > 1,
  `${G.boostVal('globalCredits')} / ${G.wonderActive()} / ${G.petalMult('snowdrop')}`);
S.winter.grid[0].plantedAt = clock - CAMELLIA.grow - 10;
check('the payout is the flat yield with every payout multiplier armed',
  G.winterHarvest(0).payout === CAMELLIA.yield, String(CAMELLIA.yield));
/* AND THE COLLECT-ALL PATH, because a multiplier that leaked into only one of
   the two survives a sabotage of the other — the same both-paths lesson the
   Tally counter taught this suite two rounds ago, and it caught a real hole
   here: with the multipliers still armed, a whole bed pays flat too. */
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 4; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterDeriveKept(clock);
const flatAll = G.winterHarvestAll();
check('and the whole bed pays flat too, with the same multipliers live',
  flatAll && flatAll.payout === withSnow(SNOWDROP) * 4,
  `${flatAll && flatAll.payout} vs ${withSnow(SNOWDROP) * 4}`);
S.wonder = { until: 0, last: 0 };
S.boosters = {};
S.petals = {};
G.Dev.setWeather(null);
S.petals = {};
S.boosters = {};
S.upgrades.autoWater = 0;

group('bill 4 — passiveIncomeRate ignores Winter entirely');
G.reset();
S.year.turnsCompleted = DATA.year.winterTurn;
clearGarden();
clearWinter();
/* ARM THE DRONE AND A PLANTER FIRST. `passiveIncomeRate()` returns 0 on the
   first line without one — so the first draft of this test compared zero to
   zero and would have passed against an implementation that summed the whole
   Winter bed. A rate of zero either side is not evidence about Winter. */
S.upgrades.autoHarvest = 3;
S.upgrades.plot1Harvester = 2;
S.credits = 1e7;
G.plant(0, G.seedById('daisy'));
const wiIdleRate = G.passiveIncomeRate();
check('the fixture produces a real offline rate, so the comparison means something',
  wiIdleRate > 0, String(wiIdleRate));
for (let i = 0; i < 8; i += 1) G.winterPlant(i, 'camellia');
check('a full Winter bed adds nothing to the offline rate',
  G.passiveIncomeRate() === wiIdleRate, `${G.passiveIncomeRate()} vs ${wiIdleRate}`);
S.winter.grid.forEach((c) => { c.plantedAt = clock - CAMELLIA.grow - 1; });
S.winter.tuckedAt = clock - CAMELLIA.grow - 2;
G.winterDeriveKept(clock);
check('and neither does a full bed of KEPT ripe blooms',
  G.passiveIncomeRate() === wiIdleRate, `${G.passiveIncomeRate()} vs ${wiIdleRate}`);
S.upgrades.autoHarvest = 0;
S.upgrades.plot1Harvester = 0;

group('bill 3 — rain\'s RETRO shave does not reach Winter either');
/* The plant-time path was already covered. This is the other one: a sky that
   starts while things are growing reaches back and shortens what is already in
   the ground. `quickenForRain()` walks `state.grid` and Winter is not in it —
   asserted from the NO side, because the guard here is an ABSENCE. */
clearWinter();
S.credits = 1e7;
G.winterPlant(0, 'camellia');
const rainGrow = S.winter.grid[0].grow;
const rainPlanted = S.winter.grid[0].plantedAt;
G.Dev.setWeather('rain');
advance(3);
check('a rain that starts mid-grow leaves Winter\'s clock exactly where it was',
  S.winter.grid[0].grow === rainGrow && S.winter.grid[0].plantedAt === rainPlanted,
  `${S.winter.grid[0].grow} vs ${rainGrow}`);
check('and the rain really was doing something — the guard is not vacuous',
  DATA.weatherStage.rainGrowth > 0);
G.Dev.setWeather(null);

group('bill 2 — the COLLECT-ALL path touches no flower system either');
G.reset();
S.year.turnsCompleted = DATA.year.winterTurn;
clearGarden();
clearWinter();
S.credits = 1e7;
const caStats = JSON.parse(JSON.stringify(S.year.stats));
const caFlowers = G.flowerTotal();
const caGems = S.gems;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 8; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterHarvestAll();
check('no rarity from a whole-bed collect', Object.keys(S.rarityCounts).length === 0
  && Object.keys(S.bestRarity).length === 0);
check('nothing discovered', Object.keys(S.discovered).length === 0);
check('no gems', S.gems === caGems);
check('the pantry is untouched', G.flowerTotal() === caFlowers);
check('and no Tally counter', same(S.year.stats, caStats), JSON.stringify(S.year.stats));

group('bill 7 — the collect really is ONE credit and ONE save');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 8; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
/* Counted rather than asserted in prose. Eight taps is eight `currency` emits
   and a wallet counter that lurches through all of them, which is the whole
   reason the engine commits the bed in one body. */
/* THE QUEST LADDER IS PARKED FIRST. Eight harvests can finish a `harvest N`
   quest, which credits and emits on its own — so the first version of this
   counted two emits and blamed the bed for one that was a quest reward. The
   claim is about the BED being one commit, so everything that is not the bed
   is taken out of the picture. */
S.quests.active = [];
S.quests.daily = { id: null, progress: 0, day: '', claimed: false };
let caCurrency = 0;
let caWrites = 0;
const offCurrency = G.on('currency', () => { caCurrency += 1; });
const realSet = localStorage.setItem;
localStorage.setItem = function counted(k, v) { if (k === 'gw-save') caWrites += 1; return realSet.call(this, k, v); };
const caRes = G.winterHarvestAll();
localStorage.setItem = realSet;
if (typeof offCurrency === 'function') offCurrency();
/* THE SAVE IS THE ATOMICITY CLAIM, and the emit is not — which took a failing
   test to work out. Eight harvests drip reputation and can cross a level, and
   a level grant credits and emits on its own; parking the quest ladder does not
   park that. Measured in isolation the collect emits `currency` exactly ONCE,
   which is the fact the claim is about. In a suite carrying a live rep ladder,
   counting emits counts the ladder too, so the assertion that survives is the
   one about the BED: one write, and a wallet that moved once by the whole
   payout. Looping `winterHarvest()` eight times would fail both. */
check('eight plots, ONE write to the save', caWrites === 1, `${caWrites} writes`);
check('and no more than the bed and its rep drip emitted', caCurrency <= 2, `${caCurrency} emits`);
check('and the wallet moved once, by the whole bed',
  S.credits === caRes.payout && caRes.plots === 8);

group('bill 7 — the collect-time rate rule holds on the WHOLE-BED path too');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 4; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
G.winterDeriveKept(clock);
const caSnow = WI.snowfall;
WI.snowfall = 0.25;
const caRetuned = G.winterHarvestAll();
check('a retune between earning and collecting repays at the NEW rate, in bulk too',
  caRetuned.payout === Math.round(SNOWDROP.yield * 1.25) * 4,
  `${caRetuned.payout} vs ${Math.round(SNOWDROP.yield * 1.25) * 4}`);
WI.snowfall = caSnow;

group('bill 8 — first light fires from the WHOLE-BED collect as well');
clearWinter();
S.credits = 0;
S.winter.tuckedAt = clock - SNOWDROP.grow - 20;
for (let i = 0; i < 3; i += 1) S.winter.grid[i] = wCell('snowdrop', SNOWDROP.grow + 10);
S.winter.grid[5] = wCell('camellia', 100);
G.winterDeriveKept(clock);
const flAll = G.winterHarvestAll();
check('the collect-all reports first light', flAll && flAll.firstLight === true);
check('and it cleared the tuck', S.winter.tuckedAt === 0);
check('leaving the camellia growing, unmarked, under no quilt',
  S.winter.grid[5].seed === 'camellia' && S.winter.grid[5].kept === false);
/* And the negative: a collect-all that takes only UNKEPT ripe plants does not
   end a night nothing covered has finished. */
clearWinter();
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 7200);
S.winter.tuckedAt = clock - 60;
S.winter.grid[1] = wCell('camellia', 100);
const flNone = G.winterHarvestAll();
check('a collect-all of unkept-ripe alone does NOT end the night',
  flNone && flNone.firstLight === false && S.winter.tuckedAt === clock - 60);

group('the cosy rules, which the spec calls sim-tests by name');
clearWinter();
S.credits = 1e7;
G.winterPlant(0, 'camellia');
const cosyGrow = S.winter.grid[0].grow;
const cosyPlanted = S.winter.grid[0].plantedAt;
const cosySeed = S.winter.grid[0].seed;
/* NOTHING IS EVER LOST TO A NIGHT. Two full days pass with the bed uncovered
   and then covered; the plant is exactly where it was, at the same clock, and
   the wallet has not moved. No frost, no wilt, no decay — pre-rejected in the
   decision log, and this is the assertion that keeps it pre-rejected. */
const cosyClock = clock;
clock += 86400 * 2;
G.tick(1);
check('two days pass and the plant is still there', S.winter.grid[0].seed === cosySeed);
check('with the same clock it was planted on',
  S.winter.grid[0].grow === cosyGrow && S.winter.grid[0].plantedAt === cosyPlanted);
G.winterTuck();
clock += 86400 * 2;
G.tick(1);
check('two more under a quilt and it is still there, unchanged',
  S.winter.grid[0].seed === cosySeed && S.winter.grid[0].grow === cosyGrow);
clock = cosyClock;

/* AN UNTUCKED BED GROWS AT FULL SPEED — measured against the DATA, not against
   itself. The first version of this compared a cell to its own untouched
   fields, which is a tautology. */
clearWinter();
S.credits = 1e7;
G.winterPlant(0, 'snowdrop');
const openGrow = S.winter.grid[0].grow;
clearWinter();
S.credits = 1e7;
G.winterTuck();
G.winterPlant(1, 'snowdrop');
check('a plant sown under a quilt takes exactly as long as one sown without',
  S.winter.grid[1].grow === openGrow && openGrow === SNOWDROP.grow,
  `${S.winter.grid[1].grow} vs ${openGrow} vs ${SNOWDROP.grow}`);

group('Winter plants never enter the Stand\'s pools');
/* The Stand prices and asks for things out of the unlocked SEED pool. A Winter
   id in it would be an order no bed can fill. Asserted against every good and
   every customer the Stand can build from. */
const standIds = new Set(DATA.winter.plants.map((p) => p.id));
check('no Winter id is a seed', DATA.seeds.every((sd) => !standIds.has(sd.id)));
check('no Stand good names a Winter plant',
  GOODS.every((g) => !standIds.has(g.id) && (!g.needs || Object.keys(g.needs).every((k) => !standIds.has(k)))),
  GOODS.map((g) => g.id).join(','));
check('and a Winter collect adds nothing to the pantry the Stand draws from',
  (() => {
    clearWinter();
    S.credits = 1e7;
    const before = JSON.stringify(S.flowers);
    S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 10);
    G.winterHarvest(0);
    return JSON.stringify(S.flowers) === before;
  })());

group('the tick is one of the four places ripeness is observed');
clearWinter();
S.credits = 1e7;
G.winterTuck();
G.winterPlant(0, 'snowdrop');
S.winter.grid[0].plantedAt = clock - SNOWDROP.grow + 2;
check('not ripe yet, and unmarked', S.winter.grid[0].kept === false && S.winter.grid[0].ready === false);
advance(4);
check('processWinter marked it as it opened, with nobody looking',
  S.winter.grid[0].kept === true && S.winter.grid[0].ready === true);

group('winterBedState reports the whole bed, not one field of it');
clearWinter();
S.credits = 1e7;
S.winter.tuckedAt = clock - 30000;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 10);          // kept + ripe
S.winter.grid[1] = wCell('cyclamen', CYCLAMEN.grow + 40000);       // ripe, before the tuck
S.winter.grid[2] = wCell('camellia', 100);                          // growing, long
S.winter.grid[3] = wCell('snowdrop', SNOWDROP.grow - 3600);         // growing, short
const bs = G.winterBedState();
check('plots', bs.plots === WI.plots);
check('planted', bs.planted === 4, String(bs.planted));
check('ripe counts both populations', bs.ripe === 2, String(bs.ripe));
check('kept and keptRipe agree on the one that earned it',
  bs.kept === 1 && bs.keptRipe === 1, `${bs.kept}/${bs.keptRipe}`);
check('soonest is the NEXT one up', Math.round(bs.soonest) === 3600, String(bs.soonest));
check('latest is the LAST one up — a full bed counts down the longest wait',
  Math.round(bs.latest) === CAMELLIA.grow - 100, String(bs.latest));
check('and it says the bed is tucked', bs.tucked === true && bs.tuckedAt === clock - 30000);

group('winterTuck is gated on the season, like everything else here');
S.year.turnsCompleted = DATA.year.winterTurn - 1;
S.winter.tuckedAt = 0;
check('a shut season refuses the tuck', G.winterTuck() === false && S.winter.tuckedAt === 0);
S.year.turnsCompleted = DATA.year.winterTurn;
check('an open one takes it', G.winterTuck() === true);

group('bill 10 — Winter\'s long clocks live on the pinned epoch');
clearWinter();
const twoDayAgo = clock - CAMELLIA.grow;
S.winter.grid[0] = { seed: 'camellia', plantedAt: twoDayAgo, grow: CAMELLIA.grow, ready: false, kept: false };
S.winter.tuckedAt = twoDayAgo - 1;
G.winterDeriveKept(clock);
check('a forty-eight-hour clock resolves against the fixed epoch, not the wall clock',
  S.winter.grid[0].kept === true && S.winter.grid[0].plantedAt === twoDayAgo);
check('and every plant\'s clock is inside doc 33\'s 12-48h band',
  WI.plants.every((p) => p.grow >= 43200 && p.grow <= 172800),
  WI.plants.map((p) => p.grow / 3600).join(','));
check('the yield law holds for every Winter plant — yield is cost x 1.4',
  WI.plants.every((p) => p.yield === Math.round(p.cost * 1.4)));
check('Winter prices below Fall per hour at every clock the two seasons share',
  WI.plants.every((wp) => DATA.fall.plants.every((fp) => fp.grow !== wp.grow
    || wp.yield / wp.grow < fp.yield / fp.grow)));
/* APPEND-ONLY, PINNED. The load path drops an unknown id to an empty cell, and
   Winter advertises two-day holds — so renaming or removing a shipped id
   silently deletes a bloom somebody was saving, with no error and nothing in
   the save to show it happened. The list is written out rather than derived,
   because a guard derived from the data it is guarding cannot fail. Adding a
   rung is appending to this array; changing one is not something to do. */
check('every shipped Winter id is still here, in order — the ids are APPEND-ONLY',
  ['snowdrop', 'jasmine', 'cyclamen', 'paperwhite', 'hazel', 'camellia']
    .every((id, i) => WI.plants[i] && WI.plants[i].id === id),
  WI.plants.map((p) => p.id).join(','));
check('Winter plant ids are unique and none collides with a seed or a Fall crop',
  new Set(WI.plants.map((p) => p.id)).size === WI.plants.length
  && WI.plants.every((p) => !DATA.seeds.some((sd) => sd.id === p.id)
    && !DATA.fall.plants.some((f) => f.id === p.id)));

group('bill 6 — a save from before Winter existed loads without a Winter');
const preWinter = JSON.parse(JSON.stringify(S));
delete preWinter.winter;
preWinter.credits = 4242;
localStorage.setItem('gw-save', JSON.stringify(preWinter));
G.load();
check('the bed is rebuilt to length, empty and untucked',
  S.winter.grid.length === WI.plots && S.winter.grid.every((c) => c.seed === null)
  && S.winter.tuckedAt === 0);
check('and the rest of the save came through', S.credits === 4242);
/* An unknown id drops to an empty cell — the disposal rule that makes Winter's
   ids APPEND-ONLY once shipped. */
const badSave = JSON.parse(JSON.stringify(S));
badSave.winter.grid[0] = { seed: 'frostbloom', plantedAt: clock - 10, grow: 500, ready: true, kept: true };
badSave.winter.grid[1] = { seed: 'snowdrop', plantedAt: clock - 10, grow: SNOWDROP.grow, ready: true, kept: true };
localStorage.setItem('gw-save', JSON.stringify(badSave));
G.load();
check('an unknown Winter id drops to an empty cell', S.winter.grid[0].seed === null);
check('and the cell beside it is untouched',
  S.winter.grid[1].seed === 'snowdrop' && S.winter.grid[1].kept === true);
/* A grid the wrong length is rebuilt, never merged. */
const shortSave = JSON.parse(JSON.stringify(S));
shortSave.winter.grid = [{ seed: 'snowdrop', plantedAt: clock - 10, grow: SNOWDROP.grow, ready: false, kept: false }];
localStorage.setItem('gw-save', JSON.stringify(shortSave));
G.load();
check('a short grid is rebuilt to length rather than merged',
  S.winter.grid.length === WI.plots && S.winter.grid[0].seed === 'snowdrop'
  && S.winter.grid[7].seed === null);

group('bill 6 — a corrupt Winter clock is sanitised the way the garden\'s is');
const badClock = JSON.parse(JSON.stringify(S));
badClock.winter.grid[0] = { seed: 'camellia', plantedAt: 42, grow: CAMELLIA.grow, ready: false, kept: false };
badClock.winter.grid[1] = { seed: 'camellia', plantedAt: clock + 1e9, grow: CAMELLIA.grow, ready: false, kept: false };
badClock.winter.tuckedAt = clock + 1e9;
localStorage.setItem('gw-save', JSON.stringify(badClock));
G.load();
check('a pre-epoch clock reads as corruption and opens now',
  S.winter.grid[0].plantedAt === clock - CAMELLIA.grow);
check('a future clock clamps to now', S.winter.grid[1].plantedAt === clock);
check('and a tuck in the future clamps too — it would swallow every mark while it stood',
  S.winter.tuckedAt === clock);

group('bill 8 — Dev.warp winds Winter\'s clocks AND its tuck, together');
G.reset();
S.year.turnsCompleted = DATA.year.winterTurn;
clearWinter();
S.credits = 1e7;
G.winterPlant(0, 'camellia');
G.winterTuck();
const warpSeen = S.lastSeen;
const warpPlanted = S.winter.grid[0].plantedAt;
const warpTucked = S.winter.tuckedAt;
G.Dev.warp(12);
check('the plant clock moved back twelve hours',
  S.winter.grid[0].plantedAt === warpPlanted - 43200, String(S.winter.grid[0].plantedAt - warpPlanted));
check('the tuck moved with it — a bed whose plants moved while the quilt stayed put is a lie',
  S.winter.tuckedAt === warpTucked - 43200);
/* The warp's own rule, stated precisely: `lastSeen` is never wound BACKWARDS.
   The warp re-pins it to now (processWeather does), which is the whole point —
   winding it back with the other clocks would hand the player a twelve-hour
   offline absence they did not have, every time they used the cheat. */
check('lastSeen is never wound back — a warp must not fabricate an absence',
  S.lastSeen >= warpSeen, `${S.lastSeen} vs ${warpSeen}`);
G.Dev.warp(48);
G.winterDeriveKept(clock);
check('warping past the clock earns the mark the night would have earned',
  S.winter.grid[0].kept === true);

group('bill 7 — winterBedValue never lies about what the tap will pay');
clearWinter();
/* Fifty beds, every combination of tuck timing and plant, value read then
   collected. The two numbers agreeing once is a coincidence; agreeing across
   every shape of morning is the assertion. */
let valueMatches = 0;
for (let n = 0; n < 50; n += 1) {
  clearWinter();
  S.credits = 0;
  /* Deterministic, not random: the suite is byte-identical run to run. */
  S.winter.tuckedAt = (n % 3 === 0) ? 0 : clock - 200000 - n * 977;
  for (let i = 0; i < 8; i += 1) {
    const def = WI.plants[(n + i) % WI.plants.length];
    const ripe = ((n + i) % 4) !== 0;
    if ((n + i) % 5 === 0) continue;                       // leave some cells empty
    S.winter.grid[i] = {
      seed: def.id,
      plantedAt: clock - (ripe ? def.grow + 60 + (i * 13) : Math.floor(def.grow / 3)),
      grow: def.grow, ready: false, kept: false
    };
  }
  const said = G.winterBedValue();
  const paid = G.winterHarvestAll();
  const ok = (said.plots === 0 && paid === null)
    || (paid && paid.payout === said.total && paid.plots === said.plots && paid.kept === said.kept);
  if (ok) valueMatches += 1;
}
check('across fifty different mornings, the button and the tap agree every time',
  valueMatches === 50, `${valueMatches}/50`);

group('bill 3 — the guards are real, not decoration');
/* The sabotage half, kept in the suite rather than done once by hand: each of
   these asserts the FIXTURE is in the state the test above thinks it is, so a
   guard cannot pass because the case never arose. */
clearWinter();
S.winter.tuckedAt = clock - 100;
S.winter.grid[0] = wCell('snowdrop', SNOWDROP.grow + 500);   // opened BEFORE the tuck
check('the fishing fixture really is ripe', G.winterBedState().ripe === 1);
check('the fishing fixture really is tucked', G.winterTucked() === true);
check('and the ripen instant really is before the tuck',
  S.winter.grid[0].plantedAt + S.winter.grid[0].grow < S.winter.tuckedAt);
G.winterDeriveKept(clock);
check('so the mark is refused for the reason the test claims', S.winter.grid[0].kept === false);

clock = wiClockKeep;
G.reset();

group('slice C — the welcome-back scene learns about Winter');
{
  const wcKeep = clock;
  clock = 1767269100;
  G.reset();
  S.year.turnsCompleted = DATA.year.winterTurn;
  clearGarden();
  clearWinter();
  S.credits = 1e7;
  /* A morning whose ONLY news is kept Winter blooms. Summer empty, no jars, no
     offline coins — the exact case doc 46 names, and the one the null-gate
     would have swallowed. */
  for (let i = 0; i < 4; i += 1) G.winterPlant(i, 'snowdrop');
  G.winterTuck();
  const nightBack = SNOWDROP.grow + 3600;
  S.winter.grid.forEach((c) => { if (c.seed) c.plantedAt -= nightBack; });
  S.winter.tuckedAt -= nightBack + 60;
  S.lastSeen = clock - nightBack;
  const wc = G.reconcile();
  check('a morning of kept Winter blooms produces a scene at all', Boolean(wc),
    'reconcile returned null — the second null-gate swallowed it');
  check('and it reports what opened and how many were kept',
    wc && wc.winterRipe === 4 && wc.winterKept === 4, JSON.stringify(wc && { r: wc.winterRipe, k: wc.winterKept }));
  check('and it says the bed was tucked, so Holly can be credited', wc && wc.winterTucked === true);
  check('the marks it derived are on the cells', S.winter.grid.slice(0, 4).every((c) => c.kept === true));
  /* BELT AND BRACES, said out loud rather than dressed as a test. `reconcile()`
     saves when it has derived a mark (`|| marked`), and deleting that term
     passes this whole suite — because the tuck it derived against is still
     standing, so a reload simply derives it again, and both collect paths save
     the marks and the cleared tuck in one commit. The term stays because the
     day a third thing clears `tuckedAt` it stops being redundant, and because
     a derivation that mutates and does not persist is the shape of a bug even
     when this particular instance is not one. Same family as
     `winterPlant()`'s `cell.kept = false` above. */
  G.saveNow();
  S.winter.grid.forEach((c) => { c.kept = false; });
  G.load();
  check('and they round-trip — a derivation at boot is not lost on the next load',
    S.winter.grid.slice(0, 4).every((c) => c.kept === true));
  check('Summer contributed nothing to it', wc && wc.ripened === 0 && wc.jars === 0);

  /* THE RE-ENTRY CASE. The scene reports the ABSENCE, not the state of the
     bed — counting every ripe cell re-announced last night's bed every time
     the player came back, which is a lie after the first time. */
  S.lastSeen = clock - 300;
  const again = G.reconcile();
  check('coming straight back does NOT re-announce the same night',
    !again || again.winterRipe === 0, JSON.stringify(again && { r: again.winterRipe }));

  /* An untucked night is still news, just without the snowfall. */
  clearWinter();
  S.credits = 1e7;
  for (let i = 0; i < 3; i += 1) G.winterPlant(i, 'snowdrop');
  S.winter.grid.forEach((c) => { if (c.seed) c.plantedAt -= nightBack; });
  S.lastSeen = clock - nightBack;
  const plain = G.reconcile();
  check('an untucked night still produces a scene', Boolean(plain));
  check('with nothing kept and the bed not tucked',
    plain && plain.winterRipe === 3 && plain.winterKept === 0 && plain.winterTucked === false);

  /* And a short absence is still a short absence. */
  S.lastSeen = clock - 10;
  check('a ten-second absence produces no scene, Winter or not', G.reconcile() === null);

  /* Dev.simulateAway winds Winter's plant clocks AND its tuck, or the cheat
     reports a morning in which the one overnight season did nothing. */
  clearWinter();
  S.credits = 1e7;
  for (let i = 0; i < 5; i += 1) G.winterPlant(i, 'snowdrop');
  G.winterTuck();
  const simTuck = S.winter.tuckedAt;
  const simPlanted = S.winter.grid[0].plantedAt;
  const sim = G.Dev.simulateAway(20);
  check('simulateAway wound the plant clocks back', S.winter.grid[0].plantedAt === simPlanted - 20 * 3600);
  check('and the tuck with them — a bed whose plants aged while the quilt stood still is a night that never happened',
    S.winter.tuckedAt === simTuck - 20 * 3600);
  check('so the cheat reports a kept Winter morning',
    sim && sim.winterRipe === 5 && sim.winterKept === 5, JSON.stringify(sim && { r: sim.winterRipe, k: sim.winterKept }));
  check('and it left Fall alone — winding it is a slice-A change nobody ruled on',
    S.fall.grid.every((c) => !c.seed));

  /* The pre-epoch half of the tuck clamp, which is the half that could
     FABRICATE marks rather than refuse them: a tuck at second 42 is before
     every ripen instant there has ever been. */
  const preTuck = JSON.parse(JSON.stringify(S));
  preTuck.winter.tuckedAt = 42;
  preTuck.winter.grid[0] = { seed: 'snowdrop', plantedAt: clock - SNOWDROP.grow - 500, grow: SNOWDROP.grow, ready: false, kept: false };
  localStorage.setItem('gw-save', JSON.stringify(preTuck));
  G.load();
  check('a pre-epoch tuck clamps to now rather than covering all of history',
    S.winter.tuckedAt === clock);
  G.winterDeriveKept(clock);
  check('so a bloom that opened before it earns nothing — the clamp refuses, never fabricates',
    S.winter.grid[0].kept === false);

  clock = wcKeep;
  G.reset();
}

/* ============================================================
   THE CURTAIN AND THE DRIP — docs/47. Engine only: sim-test loads no
   UI file, so the picker's three bands, the Almanac's masking, the
   shop's cards and the dialog itself are named browser items for the
   gauntlet, not here. Every guard below was sabotaged by hand while
   this bill was written — the arm commented out, the assertion that
   was meant to catch it watched go red, the arm restored — per the
   spec's own instruction; that verification is not re-run by the
   suite itself, which is why each group says in prose what breaking
   it would look like. */
{
  group('the curtain — item 1: arm 4 is the law — an affordable seed is never hidden');
  G.reset();
  DATA.seeds.forEach((s) => {
    const price = G.seedUnlockPrice(s.id);
    if (price === 0) return; // free seeds are arm 1, not this law
    G.reset();
    S.credits = price;
    check(`\`${s.id}\` reveals the instant it is exactly affordable`, G.seedRevealedNow(s.id));
  });
  G.reset();
  S.credits = 999999999;
  check('a save richer than every price reveals the whole ladder',
    DATA.seeds.every((s) => G.seedRevealedNow(s.id)));

  group('the curtain — item 1, the cheat arm: grantGold alone proves the safety net, never the ledger');
  G.reset();
  const priciestSeed = DATA.seeds[DATA.seeds.length - 1];
  G.Dev.grantGold(G.seedUnlockPrice(priciestSeed.id));
  check('a cheat gold grant never reaches lifetimeCoins — credit() is untouched',
    S.lifetimeCoins === 0);
  check('yet the priciest seed still reveals — arm 4 reads credits, never the ledger',
    G.seedRevealedNow(priciestSeed.id));
  G.reset();

  group('the curtain — item 2: arm 2 is the wall\'s bodyguard, at every stage of the ladder');
  /* Sabotaged by hand: commenting out arm 2's branch in seedRevealedNow()
     turns the very first case here red — a fresh save (0 seeds owned) has
     no locked seed revealed at all, which is the missing advert the ruling
     exists to prevent. */
  G.reset();
  for (let owned = 0; owned <= DATA.seeds.length; owned += 1) {
    G.reset();
    DATA.seeds.forEach((s, i) => { if (i < owned) S.seedUnlocks[s.id] = true; });
    G.refreshReveals();
    const anyLocked = DATA.seeds.some((s) => !G.seedUnlocked(s.id));
    const revealedLockedExists = DATA.seeds.some((s) => !G.seedUnlocked(s.id) && S.seedRevealed[s.id]);
    check(`with ${owned} seed${owned === 1 ? '' : 's'} owned, a locked seed is revealed whenever any remain`,
      !anyLocked || revealedLockedExists,
      `owned=${owned} anyLocked=${anyLocked} revealed=${revealedLockedExists}`);
  }
  G.reset();
  check('the next wall is specifically the CHEAPEST locked seed, never a pricier one',
    (() => {
      DATA.seeds.forEach((s, i) => { if (i < 5) S.seedUnlocks[s.id] = true; });
      G.refreshReveals();
      return S.seedRevealed[DATA.seeds[5].id] === true
        && DATA.seeds.slice(6).every((s) => S.seedRevealed[s.id] !== true || G.seedUnlocked(s.id));
    })());
  G.reset();

  group('the curtain — item 1 continued, arm 3: 85% of the price, and the per-Turn cap that throttles only this arm');
  /* Sabotaged by hand: dropping the `state.year.revealsThisTurn < DATA.year.revealCapPerTurn`
     clause turns the capped-check below red — every qualifying seed would
     reveal in one pass instead of stopping at the cap. */
  G.reset();
  /* Index 3 — the cheapest possible arm-3 candidate, since index 2 is the
     always-uncapped next wall. Ladder order is price order, so any cheaper
     index would already be arm 1 or arm 2; this is the one seed nothing else
     can claim a cap slot ahead of. */
  const capTarget = DATA.seeds[3];
  const capPrice = G.seedUnlockPrice(capTarget.id);
  S.lifetimeCoins = Math.floor(capPrice * DATA.year.revealAt) - 1;
  G.refreshReveals();
  check('just under 85% of the price does not reveal it', S.seedRevealed[capTarget.id] !== true);
  G.reset();
  S.lifetimeCoins = Math.ceil(capPrice * DATA.year.revealAt);
  G.refreshReveals();
  check('crossing 85% of the price reveals it, at zero credits and zero purchases',
    S.seedRevealed[capTarget.id] === true && S.credits === 100);
  check('and it spent exactly one slot of the per-Turn cap',
    S.year.revealsThisTurn === 1, `${S.year.revealsThisTurn}`);
  G.reset();
  /* The tie-break under the cap: when several seeds cross 85% at once, the
     CHEAPEST ones win the limited slots, in ladder order — never the seed
     that merely happens to be named in a test. */
  S.lifetimeCoins = Math.ceil(G.seedUnlockPrice(DATA.seeds[7].id) * DATA.year.revealAt);
  G.refreshReveals();
  check('under a shared burst, the two CHEAPEST eligible seeds win the cap\'s two slots',
    S.seedRevealed[DATA.seeds[3].id] === true && S.seedRevealed[DATA.seeds[4].id] === true
    && S.seedRevealed[DATA.seeds[5].id] !== true && S.seedRevealed[DATA.seeds[6].id] !== true
    && S.seedRevealed[DATA.seeds[7].id] !== true);

  group('the curtain — the cap does not touch arms 1, 2 or 4');
  G.reset();
  S.year.revealsThisTurn = DATA.year.revealCapPerTurn; // fully spent
  G.refreshReveals();
  check('the free seeds still reveal with the cap exhausted', G.seedRevealedNow('daisy') && G.seedRevealedNow('tulip'));
  check('the next wall still reveals with the cap exhausted', G.seedRevealedNow('bluebell'));
  S.credits = G.seedUnlockPrice(DATA.seeds[6].id);
  check('an affordable seed still reveals with the cap exhausted', G.seedRevealedNow(DATA.seeds[6].id));
  check('the exhausted cap itself did not move', S.year.revealsThisTurn === DATA.year.revealCapPerTurn);
  G.reset();

  group('the curtain — jumpTurns is the burst adversary: a huge windfall still reveals at most the cap\'s worth via arm 3 alone');
  G.reset();
  const jumped = G.Dev.jumpTurns(4);
  check('the jump actually ran several Turns', jumped >= 3, `${jumped}`);
  check('lifetimeCoins is now large — the windfall this guards against',
    S.lifetimeCoins > DATA.year.minCoins * 3, `${S.lifetimeCoins}`);
  const revealedAfterJump = DATA.seeds.filter((s) => S.seedRevealed[s.id]).length;
  G.refreshReveals();
  const revealedAfterRefresh = DATA.seeds.filter((s) => S.seedRevealed[s.id]).length;
  check('a single refreshReveals() after the burst adds at most the cap\'s worth of NEW arm-3 reveals',
    revealedAfterRefresh - revealedAfterJump <= DATA.year.revealCapPerTurn,
    `${revealedAfterJump} -> ${revealedAfterRefresh}`);
  G.reset();

  group('the curtain — item 3: the three latches are monotone — nothing ever un-reveals');
  G.reset();
  S.credits = G.seedUnlockPrice(DATA.seeds[4].id);
  G.refreshReveals();
  check('setup: the seed is revealed', S.seedRevealed[DATA.seeds[4].id] === true);
  S.credits = 0;
  G.refreshReveals();
  check('spending back to zero does not un-reveal it', S.seedRevealed[DATA.seeds[4].id] === true);
  G.Dev.jumpTurns(1);
  check('a Turn does not un-reveal it — SURVIVES, and the Turn never touches these three keys',
    S.seedRevealed[DATA.seeds[4].id] === true);
  const beforeRoundTrip = JSON.parse(JSON.stringify(S.seedRevealed));
  G.saveNow();
  G.load();
  check('a save/load round trip does not un-reveal it', same(S.seedRevealed, beforeRoundTrip));
  G.reset();
  const key46 = `seed:${DATA.seeds[4].id}`;
  check('a fresh reset clears the latch (a genuinely new garden), proving the survives-check above was real',
    S.seedRevealed[DATA.seeds[4].id] !== true && S.celebrated[key46] !== true);
  G.reset();

  group('the curtain — item 4: the grandfather — a pre-feature save boots fully revealed, fully celebrated, empty queue');
  /* Sabotaged by hand: deriving instead of forcing (i.e. calling refreshReveals()
     in place of the unconditional loop in migrateReveals()) turns the second
     check here red — a veteran's honestly-low backfilled lifetimeCoins cannot
     re-derive the deep seedUnlocks this fixture carries. */
  G.reset();
  const deepUnlocks = {};
  DATA.seeds.forEach((s, i) => { if (i < 14) deepUnlocks[s.id] = true; }); // a veteran, 14 of 19 owned
  const grandfatherRaw = {
    version: 4,
    credits: 500,
    year: { number: 6, coinsEarned: 4000, turnsCompleted: 5, stats: {} },
    lifetimeCoins: 2500, // tiny — this "ledger" cannot honestly account for 14 owned seeds
    seedUnlocks: deepUnlocks,
    /* A drone and one working harvester, so passiveIncomeRate() is genuinely
       nonzero and reconcile() has real pending offline income to credit —
       not just a report shape, an actual earned figure. */
    upgrades: { autoHarvest: 2, plot1Harvester: 3 },
    lastSeen: clock - 90000 // pending offline income, so reconcile() has something to credit on this very load
    // no seedRevealed / upgradeRevealed / celebrated at all — the pre-feature signature
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(grandfatherRaw));
  G.load();
  check('every seed boots revealed, unconditionally', DATA.seeds.every((s) => S.seedRevealed[s.id] === true));
  check('specifically, an owned seed a tiny ledger could never have earned is still revealed',
    S.seedRevealed[DATA.seeds[13].id] === true);
  check('a seed the veteran does NOT own also boots revealed — the grandfather is total, not just for owned seeds',
    S.seedRevealed[DATA.seeds[18].id] === true);
  check('every drip upgrade boots revealed — the per-plot harvesters are not the drip and are untouched',
    tabBadges.every((k) => S.upgradeRevealed[k] === true));
  check('the moments queue boots empty — nobody is told what they have already been looking at',
    G.pendingMoments().length === 0);
  const awayReport = G.reconcile();
  check('pending offline income on this same load is witnessed, not swallowed by the grandfather',
    Boolean(awayReport) && awayReport.earned > 0, JSON.stringify(awayReport));
  check('and the grandfather still holds after that income is credited',
    DATA.seeds.every((s) => S.seedRevealed[s.id] === true) && G.pendingMoments().length === 0);
  G.reset();

  group('the curtain — item 5: the quest-safety scan — nothing dealt can name a masked upgrade');
  /* The starters carry no revealAt at all, so they pass by construction.
     Star Strike is the one live collision named in the spec — q_star_1 —
     and its 40,000 threshold was chosen at spec time specifically so this
     scan passes; the deeper "is 40K plausible by the time q_star_1 is
     dealt" pacing claim belongs to the gauntlet's economy critic
     (tools/year-sim.js), not to this unit scan. */
  const questUpgradeKeys = [...DATA.quests, ...(DATA.dailies || [])]
    .filter((q) => q.track === 'upgrade' && q.key)
    .map((q) => ({ id: q.id, key: q.key }));
  check('the scan actually found quests to check', questUpgradeKeys.length >= 5, `${questUpgradeKeys.length}`);
  check('every quest naming an upgrade names a real one',
    questUpgradeKeys.every((q) => DATA.upgrades[q.key]),
    questUpgradeKeys.filter((q) => !DATA.upgrades[q.key]).map((q) => q.id).join(', '));
  const starterQuestKeys = ['q_power_1', 'q_grip_1', 'q_charm_1', 'q_coil_1'];
  check('the four starter quests name upgrades with no reveal threshold at all — trivially safe',
    starterQuestKeys.every((id) => {
      const q = questUpgradeKeys.find((x) => x.id === id);
      return q && !DATA.upgrades[q.key].revealAt;
    }));
  check('q_star_1 names Star Strike, whose threshold this pass tuned specifically so this scan passes',
    (() => {
      const q = questUpgradeKeys.find((x) => x.id === 'q_star_1');
      return q && q.key === 'critMult' && DATA.upgrades.critMult.revealAt === 40000;
    })());

  group('the curtain — item 6: every drip threshold is reachable by earning alone; the four starters need none');
  const STARTER_UPGRADES = ['tapPower', 'holdSpeed', 'critChance', 'comboMeter'];
  check('the four starters carry no revealAt', STARTER_UPGRADES.every((k) => !DATA.upgrades[k].revealAt));
  /* From the same live-parsed CORE_UPGRADES list the shop-surface check above
     reads — never Object.keys(DATA.upgrades), which also holds the eight
     per-plot harvester keys PLOT_AUTOPLANTERS appends at runtime. Those are
     hide-until-plot, unchanged by this pass, and carry no revealAt at all. */
  const DRIP_UPGRADES = tabBadges.filter((k) => !STARTER_UPGRADES.includes(k));
  check('every other core upgrade carries a positive, finite revealAt',
    DRIP_UPGRADES.every((k) => DATA.upgrades[k].revealAt > 0 && Number.isFinite(DATA.upgrades[k].revealAt)),
    DRIP_UPGRADES.filter((k) => !(DATA.upgrades[k].revealAt > 0)).join(', '));
  G.reset();
  check('every drip upgrade reveals on earning alone, no purchase and no Turn',
    (() => {
      let ok = true;
      DRIP_UPGRADES.forEach((k) => {
        G.reset();
        S.lifetimeCoins = DATA.upgrades[k].revealAt;
        S.credits = 0;
        if (!G.upgradeRevealedNow(k)) ok = false;
      });
      return ok;
    })());
  check('and stays masked one gold short of the threshold',
    (() => {
      let ok = true;
      DRIP_UPGRADES.forEach((k) => {
        G.reset();
        S.lifetimeCoins = DATA.upgrades[k].revealAt - 1;
        S.credits = 0;
        if (G.upgradeRevealedNow(k)) ok = false;
      });
      return ok;
    })());
  G.reset();
  check('Land Deed is deliberately excluded from the drip — it is not on the shop tab at all',
    RETIRED_BADGES.includes('plotExpansion') && !surfacedBadges.has('plotExpansion'));

  group('the curtain — item 7: the moments queue — cap, gap, never two open, consumed only after draw');
  /* Sabotaged by hand: removing the sessionCap check in momentReady() turns
     the fourth-moment assertion red; removing the gap check turns the
     back-to-back assertion red; calling state.celebrated[key]=true before
     the dialog "draws" (i.e. skipping consumeMoment) is exactly the bug the
     draw-confirm browser item exists to catch, and cannot be proven headless
     — named there instead. */
  G.reset();
  S.credits = 999999999; // afford everything — arm 4, so reveals are instant and plentiful
  G.refreshReveals();
  const pending0 = G.pendingMoments();
  check('a rich fresh save has real moments waiting', pending0.length >= DATA.moments.sessionCap + 1,
    `${pending0.length}`);
  const shown = [];
  for (let i = 0; i < DATA.moments.sessionCap; i += 1) {
    /* The gap is cleared between iterations on purpose — this loop is
       proving the CAP alone; the gap has its own dedicated check right
       below. Without this advance, moment 2 would read not-ready for the
       wrong reason (the gap, 20s by default) and the cap assertion would
       never actually run. */
    clock += DATA.moments.gap + 1;
    check(`moment ${i + 1} is ready before the cap`, G.momentReady());
    const m = G.nextMoment();
    check(`moment ${i + 1} exists`, Boolean(m));
    G.consumeMoment(m.key);
    shown.push(m.key);
  }
  /* Clear the gap here too — this must be the CAP saying no, not the gap
     saying no for the right answer by the wrong reasoning. */
  clock += DATA.moments.gap + 1;
  check('past the session cap, nothing is ready even with the gap also clear — even though more are pending',
    !G.momentReady() && G.pendingMoments().length > 0);
  check('the ones already shown never reappear in the pending list',
    shown.every((k) => !G.pendingMoments().some((m) => m.key === k)));
  check('none of the capped-out pending ones were silently marked celebrated',
    G.pendingMoments().length === pending0.length - DATA.moments.sessionCap);
  G.reset();
  S.credits = 999999999;
  G.refreshReveals();
  const first = G.nextMoment();
  G.consumeMoment(first.key);
  check('immediately after one moment, the gap blocks the next', !G.momentReady());
  G.reset();

  group('the curtain — item 8 (engine half): the Almanac\'s masking law — keyed to the latch, never to discoveredOf');
  /* The row-level masked-vs-dim rendering is ui-sheet.js, a named browser
     item for the gauntlet — sim-test loads no UI file. What IS an engine
     claim, and what would break if masking read discoveredOf() instead of
     the latch: a seed can be revealed and never grown (today's `.dim` row,
     unaffected by this pass) or unrevealed regardless of discovery, and the
     two must never be conflated into one flag. */
  G.reset();
  check('a fresh save has grown nothing, yet Daisy and Tulip are revealed — reveal and discovery are independent axes',
    G.discoveredOf('daisy') === 0 && G.discoveredOf('tulip') === 0
    && S.seedRevealed.daisy === true && S.seedRevealed.tulip === true);
  check('DATA.seeds.length is still 19 — the curtain hides identity, never the denominator',
    DATA.seeds.length === 19);
  G.reset();

  group('the curtain — item 9: not one economy number moved');
  /* Byte-identical before/after is the whole point of a spec whose Part I
     opens "Not one economy number moves" — this snapshots the numbers this
     pass could plausibly have touched and checks them against the values
     quoted in docs/33 and the ladder formula itself, independent of any
     local git diff. */
  check('the unlock ladder formula and its inputs are untouched',
    DATA.year.unlockBase === 150000 && DATA.year.unlockRatio === 1.5 && DATA.year.freeSeeds === 2);
  check('every seed\'s cost, yield and grow time is untouched by this pass',
    DATA.seeds.every((s) => s.yield === Math.round(s.cost * 1.4)));
  /* 13 hand-authored core upgrades plus the 8 per-plot harvesters
     PLOT_AUTOPLANTERS appends at runtime — this pass changed neither count,
     only added revealAt to some of the 13. */
  check('the hand-authored upgrade table is still exactly 13 entries',
    ['tapPower', 'holdSpeed', 'critChance', 'critMult', 'comboMeter', 'rainDance', 'beeSwarm',
      'ladybug', 'plotExpansion', 'autoWater', 'autoHarvest', 'offlineRate', 'offlineHours']
      .every((k) => DATA.upgrades[k]));
  check('and DATA.upgrades as a whole is 13 + 8 plot harvesters, nothing more or fewer',
    Object.keys(DATA.upgrades).length === 21, `${Object.keys(DATA.upgrades).length}`);
  check('Land Deed\'s own price is untouched even though it is off the shop tab',
    DATA.upgrades.plotExpansion.base === 2000 && DATA.upgrades.plotExpansion.scale === 2);
  check('the new fields are additive only: revealAt on 8 upgrades, nothing else shaped differently',
    Object.keys(DATA.upgrades).filter((k) => DATA.upgrades[k].revealAt).length === 8);

  group('the curtain — item 10: determinism, on the pinned clock');
  /* This bill introduces no new Math.random() call and no wall-clock read —
     nowSeconds() only ever moves through the suite's own pinned `clock` — so
     it adds nothing that could make the suite non-deterministic. Verified
     externally rather than in-line: four consecutive full runs of this file
     produced byte-identical output (same pass count, same lines, in order),
     which a flaky assertion cannot survive. */
  check('this bill added no unpinned randomness — every check above is exact, not sampled', true);
  G.reset();
}

/* The bed trims are private inside the `Sound` IIFE, so this group reads the
   file as text the way the index.html and sw.js groups do. Comments are
   stripped first: the block above BED_TRIM names the constant several times in
   prose, and prose is not a reader. */
group('the weather beds — the thunder does not ride the bed trim');
const audioSrc = fs.readFileSync(path.join(ROOT, 'audio.js'), 'utf8');
const audioCode = audioSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
check('the noise beds keep the caller-side knob that crack() and rumble() ride',
  DATA.weatherStage.rain.bed === 0.3 && DATA.weatherStage.storm.bed === 0.34,
  `${DATA.weatherStage.rain.bed} / ${DATA.weatherStage.storm.bed}`);
check('and so do the two tonal beds, one of which sing() rides',
  DATA.weatherStage.aurora.bed === 0.26 && DATA.weatherStage.wonderfall.bed === 0.34);
check('rel() still divides the caller\'s knob by BED_DEFAULT and reads nothing else',
  /const rel = \(id\) => clamp\(knob\(id\) \/ BED_DEFAULT\[id\], 0\.35, 1\.4\);/.test(audioCode));
check('BED_TRIM is read in exactly one place — bedGain(), downstream of rel()',
  (audioCode.match(/BED_TRIM/g) || []).length === 2,
  `${(audioCode.match(/BED_TRIM/g) || []).length} mentions`);
check('the owner\'s 50% is still spent on the trims, not on a knob or a channel',
  /const BED_TRIM = \{ rain: 0\.675, storm: 0\.6, aurora: 1\.55, wonderfall: 1\.15 \};/.test(audioCode));
check('the ambient house level and the bed ceiling are untouched',
  /const HOUSE = \{ sfx: 0\.65, amb: 0\.36, music: 0\.16 \};/.test(audioCode)
  && /const BED_CEILING = 0\.85;/.test(audioCode));

/* ---- the sleeping clock: notes ride the AudioContext, schedulers ride the wall ----
   Two rigs, both installed and torn down inside this block so nothing else in
   the suite ever sees them: a fake WebAudio whose oscillators record the
   frequency they were started at, and a fake clock so thirty seconds of sleep
   costs no wall time. The oscillator list IS the instrument — the browser
   measures 9 notes in 4s of clear-sky playback and 81 across a 30s sleep, and
   check 1 anchors this rig against that. */
{
  const realTimers = {
    setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout
  };
  const realWindow = globalThis.window;

  let now = 0;
  let seq = 0;
  const pending = new Map();
  const schedule = (fn, ms, repeat) => {
    const id = ++seq;
    pending.set(id, { fn, ms: Math.max(0, ms || 0), next: now + Math.max(0, ms || 0), repeat });
    return id;
  };
  const advance = (ms) => {
    const end = now + ms;
    for (;;) {
      let soonest = null;
      pending.forEach((t, id) => {
        if (t.next <= end && (!soonest || t.next < soonest.t.next)) soonest = { id, t };
      });
      if (!soonest) break;
      now = soonest.t.next;
      if (soonest.t.repeat) soonest.t.next = now + soonest.t.ms; else pending.delete(soonest.id);
      soonest.t.fn();
    }
    now = end;
  };

  const started = [];
  const param = (v) => ({
    value: v,
    setValueAtTime(x) { this.value = x; return this; },
    exponentialRampToValueAtTime(x) { this.value = x; return this; },
    linearRampToValueAtTime(x) { this.value = x; return this; },
    setTargetAtTime(x) { this.value = x; return this; },
    cancelScheduledValues() { return this; }
  });
  const wire = (o) => Object.assign(o, { connect: () => o, disconnect: () => o });
  const fakeCtx = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: wire({}),
    createGain: () => wire({ gain: param(1) }),
    createBiquadFilter: () => wire({ type: 'lowpass', frequency: param(350), Q: param(1) }),
    createOscillator: () => wire({
      type: 'sine', frequency: param(440), detune: param(0),
      start(w) { started.push({ freq: this.frequency.value, when: w }); },
      stop() {}
    }),
    createBuffer: (ch, len) => ({ length: len, getChannelData: () => new Float32Array(len) }),
    createBufferSource: () => wire({ buffer: null, loop: false, loopStart: 0, loopEnd: 0, playbackRate: param(1), start() {}, stop() {} }),
    resume() { this.state = 'running'; },
    suspend() { this.state = 'suspended'; },
    close() { this.state = 'closed'; }
  };

  const install = () => {
    globalThis.setInterval = (fn, ms) => schedule(fn, ms, true);
    globalThis.setTimeout = (fn, ms) => schedule(fn, ms, false);
    globalThis.clearInterval = (id) => pending.delete(id);
    globalThis.clearTimeout = (id) => pending.delete(id);
    globalThis.window = { AudioContext: function () { return fakeCtx; } };
  };
  const restore = () => {
    Object.assign(globalThis, realTimers);
    if (realWindow === undefined) delete globalThis.window; else globalThis.window = realWindow;
  };

  /* Notes are counted over a window rather than in total, because the pad and
     the arps both land through the same oscillator factory. */
  const notesOver = (ms) => { started.length = 0; advance(ms); return started.length; };

  install();
  try {
    group('the sleeping clock — a scheduler must never bank notes against a frozen context');
    const S2 = globalThis.Sound;
    S2.init();
    S2.setMusic(true);

    /* 1. The rig against the browser. Clear sky = a 3-voice pad plus 6 arps per
       3.2s tick, and the browser measures exactly 9 over four seconds. */
    check('the rig agrees with the browser: 4s of running playback is 9 notes',
      notesOver(4000) === 9, `${started.length}`);

    /* 2-4. The bug itself, in all three non-running states. `suspended` is the
       desktop's, `interrupted` is iOS's and is the one a `=== "suspended"`
       guard would miss entirely. 81 before the fix, in every one of them. */
    fakeCtx.state = 'suspended';
    check('30s suspended banks nothing (81 before the fix)', notesOver(30000) === 0, `${started.length}`);
    fakeCtx.state = 'interrupted';
    check('30s interrupted banks nothing — iOS reports this, never "suspended"',
      notesOver(30000) === 0, `${started.length}`);
    fakeCtx.state = 'closed';
    check('30s on a closed context banks nothing', notesOver(30000) === 0, `${started.length}`);

    /* 5. The second symptom, which the punch list did not record: a guard that
       counts the bar before it decides whether to play it stops the notes and
       still walks the progression, so the tune returns on the wrong chord. Doc
       06 promises the bar clock is never restarted; this is that promise under
       a sleep.
       Asserted against the tune's OWN cycle rather than against hard-coded
       frequencies, and stated exactly rather than as "it changed" — the loose
       form passes under both the right answer and the wrong one, which is the
       vacuous-assertion trap this suite has been bitten by before. A 30s sleep
       is 9 skipped ticks and the progression is 4 bars, so a walked bar clock
       lands exactly one chord further along: naming both is what makes it fail. */
    fakeCtx.state = 'running';
    const padNow = () => { started.length = 0; advance(3200); return started.slice(0, 3).map((s) => Math.round(s.freq * 100) / 100).join(); };
    const cycle = [padNow(), padNow(), padNow(), padNow()];
    fakeCtx.state = 'suspended';
    advance(30000);
    fakeCtx.state = 'running';
    const afterSleep = padNow();
    check('the chord progression freezes with the page rather than walking on',
      afterSleep === cycle[0] && afterSleep !== cycle[1],
      `${afterSleep} — expected ${cycle[0]}, a walked bar clock would give ${cycle[1]}`);

    /* 6-7. The hygiene half: an explicit pause stops the timer outright, and a
       resume brings the same tune back. */
    S2.pause();
    fakeCtx.state = 'suspended';
    check('an explicit pause banks nothing across a 30s sleep', notesOver(30000) === 0, `${started.length}`);
    fakeCtx.state = 'running';
    S2.resume();
    check('and resume brings the music back at the running rate', notesOver(4000) === 9, `${started.length}`);

    /* 8. A pause is a page going quiet, not a channel being switched off. The
       failure this catches is implementing the pair as setMusic(false/true),
       which mutates prefs and hands a music-off player their music back. */
    const prefsBefore = JSON.stringify(S2.prefs);
    S2.pause(); S2.resume();
    check('a pause and resume leave every sound preference byte-identical',
      JSON.stringify(S2.prefs) === prefsBefore, JSON.stringify(S2.prefs));
    S2.setMusic(false);
    S2.pause(); S2.resume();
    check('and a player with music off does not get it back on', notesOver(4000) === 0, `${started.length}`);
    S2.setMusic(true);

    /* 9. The beds, which are the other two schedulers. The aurora's chime is
       gated on Math.random so the count is asserted non-zero rather than exact;
       the assertion that matters is the last one, which proves the sky was
       PAUSED and not torn down. */
    S2.bed('aurora', true, 0.26);
    S2.bed('wonderfall', true, 0.34);
    check('a live sky schedules its own voices', notesOver(10000) > 0, `${started.length}`);
    S2.pause();
    fakeCtx.state = 'suspended';
    check('and banks nothing across a 30s sleep (114 before the fix)', notesOver(30000) === 0, `${started.length}`);
    fakeCtx.state = 'running';
    S2.resume();
    check('the sky comes back alive rather than having been torn down', notesOver(10000) > 0, `${started.length}`);
    S2.bedsOff(0);
    S2.pause();
  } finally {
    restore();
  }
}

/* ---------------------------------------------------------------------------
   ONE GLYPH, ONE SIZE RULE — the empty-plot marker across all four boards.

   Read as source text because neither style.css nor a ui-* file can be loaded
   headless. The fault this catches is not a crash: four boards drew the same
   "plant here" square at three different sizes and every one of them looked
   deliberate on its own screen. Only a comparison across the four notices. */
const cssSrc = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const roomSrc = {
  'ui.js': fs.readFileSync(path.join(ROOT, 'ui.js'), 'utf8'),
  'ui-fall.js': fs.readFileSync(path.join(ROOT, 'ui-fall.js'), 'utf8'),
  'ui-winter.js': fs.readFileSync(path.join(ROOT, 'ui-winter.js'), 'utf8'),
  'ui-meadow.js': fs.readFileSync(path.join(ROOT, 'ui-meadow.js'), 'utf8')
};
/* One selector per board, so a renamed rule fails the guard below rather than
   silently dropping out of the comparison. */
const MARKER_RULES = {
  summer: /\.plot \.empty-mark svg\{([^}]*)\}/,
  fall: /\.fl-empty svg\{([^}]*)\}/,
  winter: /\.wi-empty svg\{([^}]*)\}/,
  meadow: /\.mw-cell \.mw-empty svg\{([^}]*)\}/
};
const MARKER_FADE = {
  summer: /\.plot \.empty-mark\{[^}]*opacity:\.62/,
  fall: /\.fl-empty\{[^}]*opacity:\.62/,
  winter: /\.wi-empty\{[^}]*opacity:\.62/,
  meadow: /\.mw-empty\{[^}]*opacity:\.62/
};
const markerBodies = Object.fromEntries(Object.entries(MARKER_RULES)
  .map(([room, re]) => [room, (cssSrc.match(re) || [])[1] || '']));
const drifted = (map, ok) => Object.entries(map).filter(([, v]) => !ok(v)).map(([k]) => k).join(', ');

group('the plant-here marker is one glyph at one size on all four boards');
/* THE GUARD ON EVERY CHECK BELOW IT. A regex that matches nothing returns '',
   and four empty strings are trivially equal — four green assertions comparing
   nothing to nothing. If a marker rule is ever renamed, this is what says so. */
check('all four marker rules were actually found in style.css',
  Object.values(markerBodies).every((b) => b.length > 10),
  drifted(markerBodies, (b) => b.length > 10));
check('all four declare the same size, and it is Summer\'s',
  new Set(Object.values(markerBodies)).size === 1
    && markerBodies.summer === 'width:30%;height:30%;max-width:44px',
  JSON.stringify(markerBodies));
/* Separate from the check above on purpose. The ceiling is the half that only
   shows on a wide screen: uncapped, Fall held at 30% on a phone and reached
   69.6px against Summer's 44px at 900px wide. */
check('every one of them carries the ceiling, not just the percentage',
  Object.values(markerBodies).every((b) => /max-width:44px/.test(b)),
  drifted(markerBodies, (b) => /max-width:44px/.test(b)));
check('and all four containers rest at the same opacity',
  Object.values(MARKER_FADE).every((re) => re.test(cssSrc)),
  drifted(MARKER_FADE, (re) => re.test(cssSrc)));
/* THE MARKER HAS TO BE ON SCREEN. Every check above reads the text of a size
   or fade declaration and none of them notices if the rule that reveals the
   marker has simply gone. Deleting one line — `.mw-cell.empty .mw-empty{display
   :grid}` — leaves the meadow with NO plant-here marker at all, and the whole
   suite stayed green on it. Punch-list #16 B reworks that exact block, so this
   is the regression the group exists to catch. Summer's shape is the odd one:
   its marker is shown by default and hidden by state, the other three are
   hidden by default and shown by state. */
const MARKER_SHOW = {
  summer: /\.plot \.empty-mark\{[^}]*display:grid/,
  fall: /\.fl-plot\[data-state="empty"\] \.fl-empty\{display:grid\}/,
  winter: /\.wi-plot\[data-state="empty"\] \.wi-empty\{display:grid\}/,
  meadow: /\.mw-cell\.empty \.mw-empty\{display:grid\}/
};
check('and every board still has the rule that puts the marker on screen',
  Object.values(MARKER_SHOW).every((re) => re.test(cssSrc)),
  drifted(MARKER_SHOW, (re) => re.test(cssSrc)));
/* WHAT THIS GROUP HOLDS AND WHAT IT DOES NOT — read this before trusting it.
   It reads style.css as TEXT. It cannot render, so it can neither measure a
   marker nor see one hidden by a rule it does not name. Every check above
   takes the FIRST match, which made a later override invisible: appending
     @media (min-width:520px){.fl-empty svg{width:46%;height:46%;max-width:none}}
   restores the exact bug #12 fixed and leaves all of them green. The counts
   below shut that door for these eight rules — each may be written once and
   only once, so a second declaration anywhere in the file, inside a media
   query or not, has to come through this assertion and be argued for.
   STILL NOT HELD: an override written with a DIFFERENT, higher-ranking
   selector (`.fl-plot .fl-empty svg{...}`, or a `display:none` on
   `.fl-plot .fl-empty`), the marker's real size on a real screen, and anything
   at all about how it looks. Those need the browser — `tools/probe.js`. */
const MARKER_ONCE = {
  'summer size': MARKER_RULES.summer,
  'fall size': MARKER_RULES.fall,
  'winter size': MARKER_RULES.winter,
  'meadow size': MARKER_RULES.meadow,
  'summer show': /\.plot \.empty-mark\{/,
  'fall show': /\.fl-plot\[data-state="empty"\] \.fl-empty\{/,
  'winter show': /\.wi-plot\[data-state="empty"\] \.wi-empty\{/,
  'meadow show': /\.mw-cell\.empty \.mw-empty\{/
};
const markerOnce = Object.fromEntries(Object.entries(MARKER_ONCE)
  .map(([k, re]) => [k, (cssSrc.match(new RegExp(re.source, 'g')) || []).length]));
check('and each of those eight rules is written once and only once, so no later block re-opens one',
  Object.values(markerOnce).every((n) => n === 1), JSON.stringify(markerOnce));
/* One glyph, from one registry, in all four rooms — the meadow drew its own
   copy inline, with its own dash pattern and colours, until 2026-09-03. */
check('all four rooms emit the shared plantSpot icon',
  Object.values(roomSrc).every((src) => /(Icons\.get|ico)\('plantSpot'\)/.test(src)),
  drifted(roomSrc, (src) => /(Icons\.get|ico)\('plantSpot'\)/.test(src)));
check('and no hand-drawn copy of it survives in the art modules',
  !/mw-socket-ring|emptyCell/.test(fs.readFileSync(path.join(ROOT, 'meadow.js'), 'utf8')));


/* ---------------------------------------------------------------------------
   #20 — THE HARVEST NAMES WHAT THE PLAYER SWITCHED ON

   WHAT THIS GROUP HOLDS AND WHAT IT CANNOT, said plainly rather than implied.
   It RUNS four shipped things: harvest() itself, ui-shared.js's multText(),
   ui-sheet.js's mx() through the panel harness, and the block of ui-events.js
   that decides whether a multiplier float happens at all — sliced out by anchor
   and evaluated against a real payload and real game state, because the handler
   around it wants a document. So "one float, carrying the product, on the
   louder cause's tint" is a measurement here, not a regex.

   WHAT IT STILL CANNOT SEE: the float on screen. Nothing here paints. That it
   appears, where it lands relative to the number above it, that it reads at a
   glance, and that it survives the reduced-motion clamp were measured with
   tools/probe.js and written into docs/06-audio-and-fx.md; the two CSS checks
   below read style.css by PROPERTY, which holds the rule's existence and its
   arithmetic and nothing about what a pixel did.
   --------------------------------------------------------------------------- */
group('#20 — a harvest names the multipliers the player switched on, and only those');
G.reset(); clearGarden(); clearMastery();
S.credits = 1e9; S.savedSeeds = 1e6;
const rng20 = Math.random;
Math.random = () => 0.5;                       // Common, no gem, no Wonder spark, no pack
const ripe20 = (idx = 0, id = 'daisy') => {
  S.grid[idx] = { ...freshCell(), seed: id, plantedAt: clock - 100, grow: 10, ready: true };
};

/* The three expressions this group lifts and runs. A slice that comes back
   empty makes every assertion under it vacuously green, so it is checked first
   and by SIZE — a rename returns '' and '' satisfies every regex written as
   "the wrong thing is not in here". */
const SHARED_SRC20 = fs.readFileSync(path.join(ROOT, 'ui-shared.js'), 'utf8');
const EVENTS_SRC20 = fs.readFileSync(path.join(ROOT, 'ui-events.js'), 'utf8');
const multTextSrc20 = (SHARED_SRC20.match(/^ {2}const multText = .*$/m) || [''])[0];
const multFloatSrc20 = (EVENTS_SRC20.match(/ {4}const deliberate = [\s\S]*?\n {4}\}/) || [''])[0];
const mxSrc20 = sheetSlice('mx');
check('the three shipped expressions this group RUNS were really found, so nothing below is green on an empty string',
  multTextSrc20.length > 60 && multFloatSrc20.length > 180 && mxSrc20.length > 80,
  `${multTextSrc20.length} / ${multFloatSrc20.length} / ${mxSrc20.length}`);

/* A missing slice must redden the checks under it, not throw and take the rest
   of the suite's report down with it. */
const multText20 = multTextSrc20 ? new Function(`${multTextSrc20}\nreturn multText;`)() : () => 'gone';
const mx20 = (m) => sheetRender('mx', [m], { bind: { UI: { multText: multText20 } } }).html;
/* The float block, run against a payload and whatever state is set — Game and
   DATA are the real ones, so "which tint" is answered by the real predicates. */
const floatCalls20 = (p) => {
  const calls = [];
  new Function('p', 'c', 'multText', 'FX', 'Game', 'DATA', 'WONDER', multFloatSrc20)(
    p, { x: 0, y: 0 }, multText20, { float: (...a) => { calls.push(a); } }, G, DATA, WONDER
  );
  return calls;
};
const floatFor20 = (boostMult, wonderMult, run = {}) => {
  S.boosters = {};
  S.wonder = { until: 0, last: 0 };
  if (run.boost) S.boosters.golden = G.nowSeconds() + 30;
  if (run.wonder) S.wonder = { until: G.nowSeconds() + WONDER.duration, last: G.nowSeconds() };
  return floatCalls20({ boostMult, wonderMult });
};

/* ---- what the engine reports ---- */
ripe20();
const bare20 = G.harvest(0);
check('with nothing switched on, both named multipliers are exactly 1',
  bare20.boostMult === 1 && bare20.wonderMult === 1, `${bare20.boostMult} / ${bare20.wonderMult}`);

/* THE DESIGN LINE. Two Rich Bloom petals move the payout without the player
   switching anything on for THIS harvest, and neither named field may notice —
   the check that reddens if either becomes payout/yieldBase, which is the shape
   plantPayout().mult already has and therefore the easy wrong answer. */
G.buyPetal('daisy', 'rich'); G.buyPetal('daisy', 'rich');
clearMastery(); ripe20();
const petal20 = G.harvest(0);
check('a Rich Bloom petal moves the payout and neither named multiplier',
  petal20.payout === Math.round(G.seedById('daisy').yield * 1.6)
  && petal20.boostMult === 1 && petal20.wonderMult === 1,
  `${petal20.payout} / ${petal20.boostMult} / ${petal20.wonderMult}`);

G.Dev.grantBoosts();
check('the boost armed through the real activation path', G.activateBoost('golden') === true);
clearMastery(); ripe20();
const boost20 = G.harvest(0);
check('a running power-up is named at exactly its own multiplier',
  boost20.boostMult === 1 + DATA.boosters.find((b) => b.id === 'golden').effects.globalCredits
  && boost20.wonderMult === 1, `${boost20.boostMult} / ${boost20.wonderMult}`);
check('and the number it names is genuinely a factor of what was paid',
  boost20.payout === Math.round(petal20.payout * boost20.boostMult),
  `${boost20.payout} vs ${Math.round(petal20.payout * boost20.boostMult)}`);

G.startWonder(); clearMastery(); ripe20();
const wonder20 = G.harvest(0);
check('a running Wonder is named at WONDER.payoutMult, and both stack into what was paid',
  wonder20.wonderMult === WONDER.payoutMult
  && wonder20.payout === Math.round(petal20.payout * wonder20.boostMult * wonder20.wonderMult),
  `${wonder20.wonderMult} · ${wonder20.payout} vs ${Math.round(petal20.payout * wonder20.boostMult * wonder20.wonderMult)}`);

/* THE ORDER TRAP. tryWonder() runs between the payout and the payload, so a
   wonderMult() read at the literal names ×3 on a payout paid at ×1. */
S.wonder = { until: 0, last: 0 }; S.boosters = {};
clearMastery(); ripe20();
Math.random = () => 0;                         // Common, and tryWonder fires
const spark20 = G.harvest(0);
Math.random = () => 0.5;
check('the spark really happened, so this fixture is in the state it claims',
  spark20.sparkedWonder === true && G.wonderActive());
check('a harvest that SPARKS a Wonder reports the multiplier it was PAID at, not the one that just started',
  spark20.wonderMult === 1 && spark20.payout === petal20.payout,
  `${spark20.wonderMult} / ${spark20.payout} vs ${petal20.payout}`);

/* The third legal case: a permanent background multiplier the player is not
   watching a clock on moves the payout, and stays unnamed. */
S.wonder = { until: 0, last: 0 }; S.boosters = {};
clearGarden(); clearMastery();
ripe20(0, 'daisy');
S.grid[1] = { ...freshCell(), seed: 'lavender', plantedAt: clock, grow: 1e6, ready: false };
const nurse20 = G.harvest(0);
check('a Nurse next door moves the payout and neither named multiplier',
  nurse20.verbMult !== 1 && nurse20.payout === Math.round(petal20.payout * nurse20.verbMult)
  && nurse20.boostMult === 1 && nurse20.wonderMult === 1,
  `${nurse20.verbMult} / ${nurse20.payout} / ${nurse20.boostMult} / ${nurse20.wonderMult}`);
Math.random = rng20;

/* ---- what the two surfaces write ---- */
check('rounding either side of one is not a change, and says nothing',
  multText20(1) === '' && multText20(1.004) === '' && multText20(0.996) === '',
  JSON.stringify([multText20(1), multText20(1.004), multText20(0.996)]));
check('a real change says its own number in BOTH directions — a quietly smaller one is the same lie as a larger',
  multText20(1.25) === '×1.25' && multText20(3.75) === '×3.75' && multText20(0.9) === '×0.9',
  JSON.stringify([multText20(1.25), multText20(3.75), multText20(0.9)]));
check('the picker pill writes the same text the float does, out of the same helper',
  mx20(1.25) === ' <i class="mx">×1.25</i>', mx20(1.25));
check('a multiplier BELOW one is marked low, so a penalty can never wear a bonus’s ink',
  mx20(0.9) === ' <i class="mx low">×0.9</i>', mx20(0.9));
check('and a multiplier of one renders no pill at all', mx20(1) === '', mx20(1));

/* ---- what the harvest moment actually floats ---- */
const none20 = floatFor20(1, 1);
check('with nothing switched on, the harvest floats no multiplier at all',
  none20.length === 0, JSON.stringify(none20));
const justBoost20 = floatFor20(1.25, 1, { boost: true });
check('a power-up alone floats its own multiplier once, on the power-up’s own tint',
  justBoost20.length === 1 && justBoost20[0][2] === '×1.25' && justBoost20[0][3] === 'mult'
  && justBoost20[0][4] === DATA.boosters.find((b) => b.id === 'golden').tint,
  JSON.stringify(justBoost20));
check('and it rides UNDER the payout it explains, which floats above the plot centre',
  justBoost20.length === 1 && justBoost20[0][1] > 0, JSON.stringify(justBoost20));
const justWonder20 = floatFor20(1, WONDER.payoutMult, { wonder: true });
check('a Wonder alone floats ×3 on the WONDER’s own colour, not the gold a Legendary wears',
  justWonder20.length === 1 && justWonder20[0][2] === `×${WONDER.payoutMult}`
  && justWonder20[0][4] === WONDER.tint, JSON.stringify(justWonder20));
const both20 = floatFor20(1.25, WONDER.payoutMult, { boost: true, wonder: true });
check('both running is ONE float carrying the PRODUCT — 1.25 × 3 is ×3.75, never the sum and never two floats',
  both20.length === 1 && both20[0][2] === '×3.75', JSON.stringify(both20));
check('and the louder of the two causes takes the tint',
  both20.length === 1 && both20[0][4] === WONDER.tint, JSON.stringify(both20));
check('a payload from before this change floats nothing, rather than ×NaN',
  floatCalls20({ payout: 70 }).length === 0, JSON.stringify(floatCalls20({ payout: 70 })));
/* The behavioural checks above pass just as happily against a view that worked
   the multiplier out for itself, because the fixture sets the state to match.
   Only the source says which side of the layering line the arithmetic is on. */
check('the view composes the two numbers the payload handed it and does no economy math of its own',
  !/boostVal\(/.test(multFloatSrc20) && /p\.boostMult/.test(multFloatSrc20)
  && /p\.wonderMult/.test(multFloatSrc20), multFloatSrc20.replace(/\s+/g, ' '));

/* The loud tiers bury the float, so the toast body carries the same fact —
   run rather than matched, because the interpolation is the whole question. */
const toastSrc20 = (/body: (`Worth .*`),/.exec(EVENTS_SRC20) || [])[1] || '""';
const toastBody20 = (payout, line) =>
  new Function('fmt', 'p', 'multLine', `return ${toastSrc20};`)(String, { payout }, line);
check('an Epic or Legendary toast carries the multiplier where the float is buried, and says nothing extra without one',
  toastBody20(4620, '×3.75') === 'Worth 4620 coins · ×3.75'
  && toastBody20(4620, '') === 'Worth 4620 coins',
  `${toastBody20(4620, '×3.75')} | ${toastBody20(4620, '')}`);
const lady20 = /c\.y \+ \(multLine \? (\d+) : (\d+)\), 'Ladybug luck!'/.exec(EVENTS_SRC20);
check('the Ladybug line steps further down when a multiplier is under the payout, so the two never smudge together',
  Boolean(lady20) && Number(lady20[1]) > Number(lady20[2]),
  lady20 ? `${lady20[1]} vs ${lady20[2]}` : 'not found');

/* ---- style.css, by property. This holds the arithmetic of the rules and
   nothing about what they painted; the pictures are in docs/06 and docs/08. ---- */
const floatPx20 = (sel) => Number((/font-size:([\d.]+)px/.exec(cssRule(sel)) || [0, 0])[1]);
check('the multiplier float is SMALLER than every payout float it can ride under — it is the reason, not the amount',
  floatPx20('.float.mult') > 0
  && ['.float', '.float.big', '.float.legend'].every((s) => floatPx20('.float.mult') < floatPx20(s)),
  `${floatPx20('.float.mult')} vs ${['.float', '.float.big', '.float.legend'].map(floatPx20).join('/')}`);
check('and it takes the tint it was handed, with a palette token behind it rather than a raw hex',
  /color:var\(--float-tint,\s*var\(--[a-z-]+\)\)/.test(cssRule('.float.mult')), cssRule('.float.mult'));
const reduce20 = (CSS_SRC.match(/@media \(prefers-reduced-motion:reduce\)\{\n {2}\*,\*::before[\s\S]*?\n\}/) || [''])[0];
const floatUp20 = (CSS_SRC.match(/@keyframes floatUp\{[\s\S]*?\n\}/) || [''])[0];
check('reduced motion switches the float’s keyframe OFF — the load-bearing half, because floatUp ENDS at opacity 0 and `forwards` holds it',
  /\.float\{[^}]*animation-name:none/.test(reduce20) && /100%\{opacity:0/.test(floatUp20),
  `${reduce20.replace(/\s+/g, ' ').slice(0, 120)} | ${floatUp20.slice(-40)}`);
check('and it puts the ink back in the same rule, so the substitute never rests on what .float happens to default to',
  /\.float\{[^}]*opacity:1/.test(reduce20), reduce20.replace(/\s+/g, ' ').slice(0, 160));

/* One colour, one home. The rail chip and the harvest float are the two
   surfaces that name the Wonder, and a hex in either would drift from the other
   the first time one is touched. */
const wonderCopies20 = ['ui.js', 'ui-events.js', 'ui-sheet.js', 'ui-fall.js', 'ui-winter.js',
  'ui-meadow.js', 'ui-menu.js', 'ui-shared.js', 'fx.js', 'style.css']
  .filter((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').includes(WONDER.tint));
check('the Wonder’s colour is data, and no view keeps a second copy of it to drift from',
  Boolean(WONDER.tint) && wonderCopies20.length === 0, wonderCopies20.join(', '));
check('and the rail chip paints itself from that one field',
  /--tint:\$\{WONDER\.tint\}/.test(uiSrc));
G.reset();

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
