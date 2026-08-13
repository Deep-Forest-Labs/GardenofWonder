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
const GLOBALS = ['DATA', 'WONDER', 'PLOT_AUTOPLANTERS', 'MAX_RARITY_MULT', 'FLOWER_LINES',
  'APIARY', 'CRAFT_RECIPES', 'CRAFT_SLOTS', 'flowerValue', 'Game'];

function loadScript(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const reexport = GLOBALS.map((g) => `;globalThis.${g} = typeof ${g} !== 'undefined' ? ${g} : globalThis.${g};`).join('');
  (0, eval)(src + reexport);
}

loadScript('data.js');
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
});

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
const meanPayout = (hives) => {
  S.apiary.hives = Array.from({ length: hives }, () => ({ at: clock, jars: [] }));
  let total = 0;
  const runs = 4000;
  for (let i = 0; i < runs; i += 1) {
    S.grid[0] = { locked: false, seed: 'daisy', plantedAt: 0, grow: 0, ready: true, aura: '' };
    total += G.harvest(0).payout;
  }
  return total / runs;
};
const ratio = meanPayout(4) / meanPayout(0);
check('four hives lift yield by about 32%', Math.abs(ratio - 1.32) < 0.06, `ratio ${ratio.toFixed(3)}`);

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
  S.decor = decorOwned;
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
const ladderRep = DATA.quests.reduce((a, q) => a + q.rep, 0);
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
G.tapFlower();
check('a guaranteed crit increments the crit quest', S.quests.active[0].progress === 1);
G.reset();
S.quests.active = [{ id: 'q_combo_55', progress: 0 }];
S.quests.done = ['q_coil_1'];
S.tap.combo = 0;
S.tap.comboMax = 60;
for (let i = 0; i < 12; i += 1) G.tapFlower();
check('the combo quest tracks peak combo, not tap count', S.quests.active[0].progress === 12);

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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
