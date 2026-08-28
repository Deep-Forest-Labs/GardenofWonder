/* The Garden Year — headless pacing model.
   Run with:  node tools/year-sim.js [days] [strategy]
              strategy: casual (default) | rush | both

   Drives the REAL game.js through simulated days of play and measures the
   year against the docs/33-year-one-economy.md targets:

     - first Turn at day ~2.7–3.3 of casual play
     - ~370–410K coins earned in year one (four plots, seeds 1–3/4)
     - 2–5 petals affordable per Turn, through Turn 12
     - the daisy-rush shape (turn the moment the gates open, farm daisies)
       stays UNPROFITABLE against normal play — bill item 17's other half

   The play model is deliberately simple and its knobs sit at the top: a
   casual player in a few sessions a day, tapping, replanting, delivering
   orders, buying unlocks when the wallet reaches them, and turning the year
   when the next wall is out of reach. Calibrate the MODEL knobs to represent
   a person; never calibrate the economy here — the economy's knobs live in
   data.js and their tuning belongs to phase 4 with the owner.

   Known simplification: todayKey() reads the real clock, so the daily quest
   pays at most once per run (62 rep+coins) — negligible against the totals.

   This is a tool, not part of tools/sim-test.js: it asserts nothing by
   itself. The numbers it prints are judged by a person (or a critic agent)
   against the targets above. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};

const GLOBALS = ['DATA', 'WONDER', 'DAY', 'ALBUM', 'CARD_RARITIES', 'PLOT_AUTOPLANTERS', 'MAX_RARITY_MULT', 'FLOWER_LINES',
  'APIARY', 'CRAFT_RECIPES', 'CRAFT_SLOTS', 'BENCH', 'CREATURES', 'CREATURE_TRAITS', 'HABITAT_SLOT_LEVELS', 'CREATURE_STARS', 'CREATURE_PAIRS', 'PAIR_TUNING',
  'CREATURE_FOOD', 'FED_STARS', 'FOOD_CAP_HOURS', 'ARRIVAL_AWAKE_HOURS', 'FED_THRESHOLD_HOURS',
  'STAND', 'GOODS', 'CUSTOMERS', 'goodById', 'customerById',
  'MEADOW', 'MEADOW_NEIGHBOURS', 'meadowTender', 'Icons', 'flowerValue', 'Game'];

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

/* ---- the clock ---- */
let clock = Date.now() / 1000;
const dayZero = clock;
Date.now = () => clock * 1000;
const dayNow = () => (clock - dayZero) / 86400;

/* ---- the play model's knobs ----
   The casual player the doc-33 model describes rides each year to its WALL:
   the meter's gate opens at minCoins, but they keep playing until the next
   seed unlock is genuinely out of reach — a day's income away — and only
   then accept the flower's invitation. A player who turns the moment the
   gate opens is the `rush` strategy, reported separately. */
const MODEL = {
  sessionsPerDay: 4,               // wake, lunch, evening, night
  sessionHours: [8, 12.5, 18, 21.5],
  sessionMinutes: 6,               // active minutes per session
  tapsPerSecond: 0.8,              // bursty casual tapping, not a held grind
  checkEverySeconds: 8,            // how often the player looks at the plots at all
  badgeWalletShare: 0.05,          // buy a badge when it costs under this share of the wallet
  badges: ['tapPower', 'critChance', 'comboMeter', 'autoWater', 'critMult'],
  wallReachDays: 1.2,              // the wall is "in reach" within this many days of trailing income
  minYearHours: 12                 // never turn a year younger than this (casual only)
};

/* ---- bookkeeping ---- */
const log = [];
const note = (s) => log.push(s);

function nextUnlockPrice() {
  for (const s of DATA.seeds) {
    if (!G.seedUnlocked(s.id)) return G.seedUnlockPrice(s.id);
  }
  return Infinity;
}

function bestPlantable() {
  let pick = null;
  DATA.seeds.forEach((s) => {
    if (G.seedUnlocked(s.id) && S.credits >= s.cost) pick = s;
  });
  return pick;
}

/* Spend the pouch the way a person does after a Turn: cheapest useful petal
   first, across every unlocked flower, both shared skills. */
function buyPetals() {
  let bought = 0;
  for (;;) {
    let best = null;
    DATA.seeds.forEach((s) => {
      if (!G.seedUnlocked(s.id)) return;
      ['rich', 'quick'].forEach((skill) => {
        if (G.petalsOf(s.id)[skill] >= DATA.petals.shared[skill].cap) return;
        const cost = G.petalCost(s.id, skill);
        if (!best || cost < best.cost) best = { id: s.id, skill, cost };
      });
    });
    if (!best || S.savedSeeds < best.cost) break;
    if (!G.buyPetal(best.id, best.skill)) break;
    bought += 1;
  }
  return bought;
}

function claimQuests() {
  const claimable = S.quests.active.filter((q) => {
    const def = G.questById(q.id);
    return def && q.progress >= def.qty;
  });
  claimable.forEach((q) => G.claimQuest(q.id));
  const d = S.quests.daily;
  const ddef = d && d.id ? G.questById(d.id) : null;
  if (ddef && !d.claimed && d.progress >= ddef.qty) G.claimQuest(d.id);
}

function playSessionSecond(strategy) {
  G.tick(1);
  // taps
  for (let t = 0; t < MODEL.tapsPerSecond; t += 1) G.tapFlower(true);
  if (Math.random() < MODEL.tapsPerSecond % 1) G.tapFlower(true);
  // A person checks the beds every so often, not every second.
  if (Math.floor(clock) % MODEL.checkEverySeconds !== 0) return;
  // harvest everything ready, replant
  S.grid.forEach((cell, i) => {
    if (cell.locked || !cell.seed || !cell.ready) return;
    G.harvest(i);
  });
  S.grid.forEach((cell, i) => {
    if (cell.locked || cell.seed) return;
    const pick = strategy === 'rush' ? (S.credits >= DATA.seeds[0].cost ? DATA.seeds[0] : null) : bestPlantable();
    if (pick) G.plant(i, pick);
  });
  // deliver what the stand will take
  for (let i = 0; i < STAND.slots; i += 1) {
    const o = G.standOrderAt(i);
    if (o && G.standCanDeliver(o)) G.standDeliver(i);
  }
  claimQuests();
  if (strategy !== 'rush') {
    // badges, when cheap against the wallet
    MODEL.badges.forEach((key) => {
      if (G.upgradeMaxed(key)) return;
      if (G.upgradePrice(key) < S.credits * MODEL.badgeWalletShare) G.buyUpgrade(key);
    });
    // the next unlock, the moment the wallet reaches it
    const price = nextUnlockPrice();
    if (price !== Infinity && S.credits >= price) {
      const seed = DATA.seeds.find((s) => !G.seedUnlocked(s.id));
      if (G.unlockSeed(seed.id)) note(`  day ${dayNow().toFixed(2)}: unlocked ${seed.name} for ${price.toLocaleString()}`);
    }
  }
}

function maybeTurn(strategy, results) {
  if (!G.turnReady()) return;
  const yearAgeHours = results.yearStart === undefined ? Infinity : (clock - results.yearStart) / 3600;
  if (strategy === 'casual') {
    const wall = nextUnlockPrice();
    if (yearAgeHours < MODEL.minYearHours) return;
    /* Ride the year until the next wall sits more than a day's income away.
       Before a full day exists, extrapolate from what today has earned. */
    const lifetime = results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned;
    const income = results.trailingIncome || lifetime / Math.max(0.3, dayNow());
    if (wall !== Infinity && S.credits + income * MODEL.wallReachDays >= wall) return;
  }
  const before = S.year.coinsEarned;
  const turnNo = S.year.turnsCompleted + 1;
  const r = G.turnYear('daisy');
  if (!r) return;
  const petals = buyPetals();
  results.turns.push({
    turn: turnNo,
    day: dayNow(),
    earned: Math.round(before),
    pouch: r.pouch,
    tallyMult: r.tally.mult,
    petals,
    seedsLeft: S.savedSeeds
  });
  results.yearStart = clock;
  note(`  day ${dayNow().toFixed(2)}: TURN ${turnNo} — year earned ${Math.round(before).toLocaleString()}, pouch ${r.pouch} (tally x${r.tally.mult.toFixed(2)}), bought ${petals} petals`);
}

function run(strategy, days) {
  // fresh state
  G.reset();
  clock = dayZero;
  const results = { strategy, turns: [], yearStart: clock, cumEarned: 0, snapshots: [] };
  const cumEarnedNow = () => results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned;

  let lifetimeAtDayStart = 0;
  for (let day = 0; day < days; day += 1) {
    for (let s = 0; s < MODEL.sessionsPerDay; s += 1) {
      clock = dayZero + day * 86400 + MODEL.sessionHours[s] * 3600;
      G.reconcile();
      const seconds = MODEL.sessionMinutes * 60;
      for (let t = 0; t < seconds; t += 1) {
        clock += 1;
        playSessionSecond(strategy);
        maybeTurn(strategy, results);
      }
    }
    results.trailingIncome = Math.max(1, cumEarnedNow() - lifetimeAtDayStart);
    lifetimeAtDayStart = cumEarnedNow();
    results.snapshots.push({
      day: day + 1,
      cumEarned: Math.round(cumEarnedNow()),
      savedSeedsMinted: results.turns.reduce((a, t) => a + t.pouch, 0),
      petalsOwned: DATA.seeds.reduce((a, s) => {
        const p = G.petalsOf(s.id);
        return a + p.rich + p.quick;
      }, 0),
      turns: results.turns.length
    });
  }
  results.cumEarned = Math.round(cumEarnedNow());
  return results;
}

/* ---- report ---- */
const days = Number(process.argv[2]) || 14;
const strategy = process.argv[3] || 'both';

const report = (r) => {
  console.log(`\n=== ${r.strategy}, ${days} days ===`);
  log.length = 0;
  r.turns.forEach((t) => {
    console.log(`  Turn ${t.turn}: day ${t.day.toFixed(2)} · year earned ${t.earned.toLocaleString()} · pouch ${t.pouch} (x${t.tallyMult.toFixed(2)}) · ${t.petals} petals bought · ${t.seedsLeft} seeds left`);
  });
  const last = r.snapshots[r.snapshots.length - 1];
  console.log(`  end of day ${last.day}: lifetime earned ${last.cumEarned.toLocaleString()}, ${last.savedSeedsMinted} seeds minted, ${last.petalsOwned} petals owned, ${last.turns} turns`);

  if (r.strategy === 'casual') {
    const t1 = r.turns[0];
    console.log('\n  — against the doc-33 targets —');
    console.log(`  first Turn day 2.7–3.3:   ${t1 ? t1.day.toFixed(2) : 'never'} ${t1 && t1.day >= 2.7 && t1.day <= 3.3 ? 'OK' : 'CHECK'}`);
    console.log(`  year one 370–410K:        ${t1 ? t1.earned.toLocaleString() : '-'} ${t1 && t1.earned >= 370000 && t1.earned <= 410000 ? 'OK' : 'CHECK'}`);
    const early = r.turns.slice(0, 12);
    const inBand = early.filter((t) => t.petals >= 2 && t.petals <= 5).length;
    console.log(`  2–5 petals per Turn:      ${early.map((t) => t.petals).join(',')} (${inBand}/${early.length} in band)`);
  }
  return r;
};

if (strategy === 'both') {
  const casual = report(run('casual', days));
  const rush = report(run('rush', days));
  console.log('\n=== the daisy-rush verdict (bill item 17\'s shape) ===');
  const day = Math.min(days, 10);
  const c = casual.snapshots[day - 1];
  const ru = rush.snapshots[day - 1];
  console.log(`  day ${day}  casual: earned ${c.cumEarned.toLocaleString()}, minted ${c.savedSeedsMinted}, petals ${c.petalsOwned}`);
  console.log(`  day ${day}  rush:   earned ${ru.cumEarned.toLocaleString()}, minted ${ru.savedSeedsMinted}, petals ${ru.petalsOwned}`);
  const unprofitable = ru.cumEarned <= c.cumEarned && ru.petalsOwned <= c.petalsOwned;
  console.log(`  rush stays unprofitable: ${unprofitable ? 'YES' : 'NO — the exploit is back, stop and look'}`);
} else {
  report(run(strategy, days));
}
