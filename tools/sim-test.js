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
  'CREATURE_FOOD', 'FED_STARS', 'FOOD_CAP_HOURS', 'ARRIVAL_AWAKE_HOURS', 'Icons', 'flowerValue', 'Game'];

function loadScript(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const reexport = GLOBALS.map((g) => `;globalThis.${g} = typeof ${g} !== 'undefined' ? ${g} : globalThis.${g};`).join('');
  (0, eval)(src + reexport);
}

loadScript('data.js');
loadScript('icons.js');
loadScript('game.js');

const G = globalThis.Game;
const S = G.state;

const unlockTo = (level) => {
  S.rep = G.cumulativeRep(level);
  S.level = level;
};

let pass = 0;
let fail = 0;
const group = (name) => console.log(`\n${name}`);
const check = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok   ${name}`); }
  else { fail += 1; console.log(`  FAIL ${name} ${extra}`); }
};

/* Fast-forward without waiting. */
let clock = Date.now() / 1000;
Date.now = () => clock * 1000;
const advance = (seconds, step = 1) => {
  for (let t = 0; t < seconds; t += step) { clock += step; G.tick(step); }
};

const clearGarden = () => S.grid.forEach((c) => {
  c.locked = false; c.seed = null; c.plantedAt = 0; c.grow = 0; c.ready = false;
  c.mutation = null; c.mutateAt = 0; c.packDrop = false;
});

/* Mastery multiplies harvest payout and climbs as a run proceeds, so a test
   measuring some *other* harvest multiplier has to start from a clean ladder —
   including the lifetime counts the ladder reads, or the next run starts the
   ladder over with thousands of harvests already banked and jumps tiers at once. */
const clearMastery = () => { S.mastery = {}; S.rarityCounts = {}; S.discovered = {}; };

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
check('the first costs 2,500', G.nextHiveCost() === 2500);
S.credits = 2500;
check('buying one works', G.buyHive() === true);
check('the cost was deducted', S.credits === 0);
check('the next one costs double', G.nextHiveCost() === 5000);
check('each gives 8% pollination', Math.abs(G.pollination() - APIARY.pollination) < 1e-9);

group('honey variety follows what is blooming');
S.credits = 1e6;
unlockTo(2);
G.plant(1, G.seedById('lavender'));
advance(APIARY.interval * 2 + 5);
const jars = S.apiary.hives[0].jars;
check('jars are produced on the interval', jars.length >= 2, `got ${jars.length}`);
check('they take the planted variety', jars.every((j) => j === 'lavender'), JSON.stringify(jars));

group('a hive stops when it is full');
advance(APIARY.interval * 10);
check(`caps at ${APIARY.capacity} jars`, S.apiary.hives[0].jars.length === APIARY.capacity,
  `got ${S.apiary.hives[0].jars.length}`);

group('collecting');
const collected = G.collectHive(0);
check('returns what was in the hive', collected && collected.jars.length === APIARY.capacity);
check('honey is banked by variety', S.apiary.honey.lavender === APIARY.capacity, JSON.stringify(S.apiary.honey));
check('the hive is emptied', S.apiary.hives[0].jars.length === 0);
check('lavender honey is worth 182', APIARY.honeyValue('lavender') === 182);

group('variety is fixed at production, so it cannot be gamed');
S.apiary.honey = {};
clearGarden();
advance(APIARY.interval * 3);
const wildJars = S.apiary.hives[0].jars.slice();
unlockTo(17);
G.plant(0, G.seedById('eternal'));
check('an empty garden gives wildflower honey', wildJars.every((j) => j === 'wild'), JSON.stringify(wildJars));
check('planting later does not upgrade waiting jars',
  JSON.stringify(S.apiary.hives[0].jars) === JSON.stringify(wildJars));

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
  S.apiary.hives = Array.from({ length: hives }, () => ({ at: clock, jars: [] }));
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
check('apiary defaults are filled in', Array.isArray(S.apiary.hives) && S.apiary.hives.length === 0);
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
G.buyHive();
check('hive purchased', G.hiveCount() === 1);
check('starts unmaxed', G.upgradeMaxed('beeSwarm') === false);

for (let i = 0; i < 400; i += 1) G.tapFlower();
check('unowned badge never fills a jar', S.apiary.hives[0].jars.length === 0, `got ${S.apiary.hives[0].jars.length}`);

let beeLevel = 0;
while (!G.upgradeMaxed('beeSwarm') && beeLevel < 100) { G.buyUpgrade('beeSwarm'); beeLevel += 1; }
check('five levels reach the 1% cap', beeLevel === 5, `took ${beeLevel} levels`);

for (let i = 0; i < 3000; i += 1) G.tapFlower(); // p=0.01(fail all)^3000 is effectively impossible
const swarmJars = S.apiary.hives[0].jars;
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

group('seed unlocks follow the level');
G.reset();
check('level 1 unlocks exactly three seeds', DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length === 3);
check('daisy is plantable at level 1', G.seedUnlocked('daisy') === true);
check('lavender is not', G.seedUnlocked('lavender') === false);
S.credits = 1e6;
check('a gated seed cannot be planted', G.plant(0, G.seedById('lavender')) === false && !S.grid[0].seed);
unlockTo(17);
check('level 17 unlocks all nineteen', DATA.seeds.filter((s) => G.seedUnlocked(s.id)).length === 19);
check('eternal is plantable at 17', G.plant(0, G.seedById('eternal')) === true);

group('plots open on the level bar, then cost gold');
G.reset();
S.credits = 1e6;
check('plot 5 is gated at level 1', G.unlockPlot(4) === false && S.grid[4].locked);
check('Land Deed is maxed until a plot opens', G.upgradeMaxed('plotExpansion') === true);
unlockTo(3);
check('plot 5 is buyable at level 3', G.unlockPlot(4) === true && S.grid[4].locked === false);
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
check('a maxed harvester still plants an unlocked seed', S.grid[0].seed === 'bluebell', `got ${S.grid[0].seed}`);

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
   fillActive() caps at three and stripQuest() always shows active[0], it holds
   a slot forever and jams the strip. Three "Sell N flowers" quests shipped that
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

group('grandfather migration keeps seeds you could already use');
G.reset();
const saveOf = (extra) => {
  const base = JSON.parse(JSON.stringify(S));
  delete base.rep;
  delete base.level;
  delete base.quests;
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
G.reset();

group('tickets convert to gems once and boosts are earned');
check('Lantern Tree costs gems', (() => {
  const d = DATA.decor.find((x) => x.id === 'lanterntree');
  return d && d.currency === 'gems' && d.cost === 40;
})());
check('boosters have no ticket price', DATA.boosters.every((b) => !('tickets' in b)));
G.reset();
S.harvestsThisSession = 9;
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
S.rep = G.cumulativeRep(3);
S.level = 3;
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

group('mastery tiers pay themselves and lift that seed only');
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
check('a fresh seed starts at 1.0×', G.masteryMult('daisy') === 1 && G.masteryOf('daisy') === 0);
const ninth = harvestDaisies(9);
check('nine harvests do not reach tier 1', G.masteryOf('daisy') === 0 && ninth.mastery.length === 0);
check('the goal reads back as tier 1 of 10 total', JSON.stringify(G.masteryGoal('daisy'))
  === JSON.stringify({ tier: 1, track: 'total', qty: 10, have: 9 }), JSON.stringify(G.masteryGoal('daisy')));
const tenthDaisy = harvestDaisies(1);
check('the tenth harvest completes tier 1', G.masteryOf('daisy') === 1 && tenthDaisy.mastery.length === 1);
check('the completing harvest was paid at the old rate', tenthDaisy.payout === ninth.payout,
  `${ninth.payout} then ${tenthDaisy.payout}`);
check('the tier moved the multiplier', Math.abs(G.masteryMult('daisy') - 1.05) < 1e-9,
  `${G.masteryMult('daisy')}`);
const eleventh = harvestDaisies(1);
check('the next harvest is paid at the new rate',
  eleventh.payout === Math.round(ninth.payout * 1.05), `${ninth.payout} then ${eleventh.payout}`);
check('a tier pays once and does not re-pay', eleventh.mastery.length === 0 && G.masteryOf('daisy') === 1);
check('another seed is untouched', G.masteryOf('tulip') === 0 && G.masteryMult('tulip') === 1);
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

group('one harvest can cross more than one tier');
G.reset();
S.credits = 1e9;
clearGarden();
S.discovered.daisy = 24;
S.rarityCounts.daisy = { rare: 3, epic: 0, legend: 0 };
S.mastery.daisy = 0;
const rngCross = Math.random;
Math.random = () => 0.75;                  // a Rare: 70 common / 20 rare on the table
S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
const crossing = G.harvest(0);
Math.random = rngCross;
check('the roll was a Rare', crossing.rarity.key === 'rare', crossing.rarity.key);
check('it paid tiers 1, 2 and 3 at once', crossing.mastery.map((t) => t.tier).join(',') === '1,2,3',
  JSON.stringify(crossing.mastery.map((t) => t.tier)));
check('the multiplier moved by all three', Math.abs(G.masteryMult('daisy') - 1.15) < 1e-9,
  `${G.masteryMult('daisy')}`);

group('gems land on every fifth tier and nowhere else');
G.reset();
clearGarden();
const gemTiers = [];
for (let t = 1; t <= 12; t += 1) {
  G.state.mastery.daisy = t - 1;
  G.state.discovered.daisy = 1e9;
  G.state.rarityCounts.daisy = { rare: 1e9, epic: 1e9, legend: 0 };
  const gemsBefore = S.gems;
  S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '', luckyBug: false };
  const res = G.harvest(0);
  const tierPaid = res.mastery.find((x) => x.tier === t);
  if (tierPaid && tierPaid.gems > 0) gemTiers.push(t);
  check(`tier ${t} gem grant matches the rule`,
    (t % DATA.masteryGemEvery === 0) === Boolean(tierPaid && tierPaid.gems > 0)
    && (!tierPaid || S.gems >= gemsBefore));
}
check('only tiers 5 and 10 paid a gem', gemTiers.join(',') === '5,10', gemTiers.join(','));

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

group('mastery backfill is bounded by bestRarity and pays no gems');
G.reset();
const priorMastery = JSON.parse(JSON.stringify(S));
delete priorMastery.mastery;
delete priorMastery.rarityCounts;
priorMastery.discovered = { daisy: 500, tulip: 500, bluebell: 1 };
priorMastery.bestRarity = { daisy: 'common', tulip: 'rare', bluebell: 'legend' };
priorMastery.gems = 0;
priorMastery.flowers = {};
store['gw-save'] = JSON.stringify(priorMastery);
G.load();
check('a common-only seed is credited no rarities',
  JSON.stringify(G.rarityCountsOf('daisy')) === JSON.stringify({ rare: 0, epic: 0, legend: 0 }),
  JSON.stringify(G.rarityCountsOf('daisy')));
check('a Rare-best seed is credited rares but never epics',
  G.rarityCountsOf('tulip').rare === 100 && G.rarityCountsOf('tulip').epic === 0
  && G.rarityCountsOf('tulip').legend === 0, JSON.stringify(G.rarityCountsOf('tulip')));
check('an estimate never exceeds the harvests that happened',
  G.rarityCountsOf('bluebell').rare + G.rarityCountsOf('bluebell').epic
  + G.rarityCountsOf('bluebell').legend <= 1, JSON.stringify(G.rarityCountsOf('bluebell')));
check('backfilled tiers still grant the yield', G.masteryOf('daisy') > 0 && G.masteryMult('daisy') > 1,
  `${G.masteryOf('daisy')} tiers`);
check('a common-only seed stalls on its first rarity tier', G.masteryOf('daisy') === 1,
  `${G.masteryOf('daisy')} tiers`);
check('rarity credit carries a Rare-best seed further', G.masteryOf('tulip') > G.masteryOf('daisy'),
  `${G.masteryOf('tulip')} vs ${G.masteryOf('daisy')}`);
check('backfill pays no gems', S.gems === 0, `${S.gems}`);
const masteryBefore = G.masteryOf('tulip');
G.load();
check('a second load does not advance again', G.masteryOf('tulip') === masteryBefore);
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

group('Keeper shortens growth both ways round');
clearGarden();
S.credits = 1e9;
check('no keeper leaves growth alone', G.keeperModifier(1) === 1);
G.plant(0, G.seedById('bluebell'));
check('an adjacent keeper shortens the modifier',
  Math.abs(G.keeperModifier(1) - 0.85) < 1e-9, `${G.keeperModifier(1)}`);
G.plant(1, G.seedById('daisy'));
const keptGrow = S.grid[1].grow;
check('planting beside a keeper bakes the bonus in',
  Math.abs(keptGrow - G.seedById('daisy').grow * G.growModifier() * 0.85) < 1e-6, `${keptGrow}`);
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
const baseTrait = G.critterTrait(PIP.trait.id);
check('a creature starts unfed', !G.critterFed(PIP.id));
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
/* Every food's awake clock outlasts its boost, so the first thing to lapse is
   only the star — the creature is still up and still working. */
advance(SNACK.hours * 3600 + 60, 600);
check('the boost ran out', !G.critterFed(PIP.id));
check('but it is still awake', !G.critterAsleep(PIP.id));
check('it is still home', G.critterHere(PIP.id));
check('it is still tending', G.critterTending(PIP.id));
check('and still working', G.critterWorking(PIP.id));
check('its trait is back to exactly baseline',
  Math.abs(G.critterTrait(PIP.trait.id) - baseTrait) < 1e-9);
check('no boost time is owed', G.critterFedFor(PIP.id) === 0);

group('a creature that runs out of food falls asleep');
/* The upkeep half, added 2026-08-18. A sleeping creature stops working — that is
   deliberately punishing and it is the retention mechanic. What keeps it inside
   a cosy game is that it is VISIBLE and one tap from being undone.

   Set up from a food's own window rather than from the arrival grant, which is
   already at the cap — a brand-new creature cannot be starved into sleeping
   inside one food's worth of time, and that is deliberate. */
S.critters[PIP.id].awakeUntil = G.nowSeconds() + SNACK.awake * 3600;
advance(SNACK.awake * 3600 + 60, 600);
check('it is asleep once the awake clock runs out', G.critterAsleep(PIP.id));
check('and it contributes nothing', G.critterTrait(PIP.trait.id) === 0);
check('which its consumer sees', G.catchMultiplier(0) === 1);
check('it is not working', !G.critterWorking(PIP.id));
/* Nothing is taken away — it is asleep, not gone. */
check('but it is still home', G.critterHere(PIP.id));
check('still tending', G.critterTending(PIP.id));
check('and still holds its slot', G.habitatUsed() === 1);
check('no awake time is owed', G.critterAwakeFor(PIP.id) === 0);
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
S.critters[PIP.id].awakeUntil = 0;
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
S.critters[PIP.id].awakeUntil = 0;
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
S.critters[LUNA.id].awakeUntil = 0;
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
  Math.abs(G.critterAwakeFor(PIP.id) - ARRIVAL_AWAKE_HOURS * 3600) < 120);
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
  critters: { [PIP.id]: { since: 1, level: 1, tending: true, awakeUntil: 4e12 } }
}));
G.load();
check('an edited save cannot stay awake forever',
  G.critterAwakeFor(PIP.id) <= G.foodCapSeconds() + 1);
localStorage.setItem('gw-save', JSON.stringify({
  version: 3, credits: 500, level: 1, rep: 0,
  discovered: { [PIP.attract.seed]: 99 },
  critters: { [PIP.id]: { since: 1, level: 1, tending: true, awakeUntil: 0 } }
}));
G.load();
/* An explicit zero is a creature that genuinely ran out, and is respected. */
check('but a creature that really did run out stays asleep', G.critterAsleep(PIP.id));

group('a fully raised creature is still worth feeding');
G.reset();
S.discovered[PIP.attract.seed] = PIP.attract.count;
G.checkCritters();
S.credits = 1e6;
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
const BIG = CREATURE_FOOD[CREATURE_FOOD.length - 1];
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
check('a save from before food loads unfed', !G.critterFed(PIP.id));
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
S.critters[PIP.id].awakeUntil = 0;
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
const upBefore = G.critterAwakeFor(PIP.id);
check('draining winds the clocks back', G.Dev.drainCritters(1) === G.crittersHome().length);
check('by exactly the hour asked for', Math.abs((upBefore - G.critterAwakeFor(PIP.id)) - 3600) < 2);
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
/* One Honeypot is 16h up and 12h fed against a 24h cap, so a second still has
   room. It is the third that has nothing left to give. */
check('a second helping still has room', G.Dev.feedCritters() > 0);
check('and then the cap refuses another', G.Dev.feedCritters() === 0);
/* Nothing is armed and nothing is sticky, so an unforced run afterwards behaves. */
G.Dev.sleepCritters();
G.Dev.feedCritters();
check('nothing leaked into the clocks', G.critterAwakeFor(PIP.id) <= G.foodCapSeconds() + 1);

group('food is authored, and stays off the parts that break an economy');
check('every food has a name, hours and a cost',
  CREATURE_FOOD.every((f) => f.name && f.hours > 0 && f.cost > 0 && f.desc));
check('ids are unique', new Set(CREATURE_FOOD.map((f) => f.id)).size === CREATURE_FOOD.length);
check('every food icon exists', CREATURE_FOOD.every((f) => Icons.has(f.icon)));
check('the tiers escalate in both hours and cost', CREATURE_FOOD.every((f, i) => (
  i === 0 || (f.hours > CREATURE_FOOD[i - 1].hours && f.cost > CREATURE_FOOD[i - 1].cost)
)));
/* A longer stretch has to be the cheaper way to buy it, or the tiers above the
   first are a worse deal wearing a bigger number. */
check('a longer stretch costs less per hour', CREATURE_FOOD.every((f, i) => (
  i === 0 || f.cost / f.hours < CREATURE_FOOD[i - 1].cost / CREATURE_FOOD[i - 1].hours
)));
check('no food outlasts the cap on its own',
  CREATURE_FOOD.every((f) => f.hours <= FOOD_CAP_HOURS && f.awake <= FOOD_CAP_HOURS));
/* The cheap food has to be "keep them going" and the dear one "keep them going
   AND strong". If a boost ever outlasted the awake clock, a creature could be
   asleep and well fed at the same time, which means nothing. */
check('every food keeps a creature up for longer than it boosts it',
  CREATURE_FOOD.every((f) => f.awake > f.hours));
check('the awake ladder escalates too', CREATURE_FOOD.every((f, i) => (
  i === 0 || f.awake > CREATURE_FOOD[i - 1].awake
)));
check('the cheapest food is still a real reprieve', CREATURE_FOOD[0].awake >= 4);
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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
