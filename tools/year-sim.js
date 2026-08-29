/* The Garden Year — headless pacing model.
   Run with:  node tools/year-sim.js [days] [strategy]
              strategy: casual (default) | rush | smart | all

   Drives the REAL game.js through simulated days of play and measures the
   year against the docs/33-year-one-economy.md targets:

     - first Turn at day ~2.7–3.3 of casual play
     - ~370–410K coins earned in year one (four plots, seeds 1–3/4)
     - 2–5 petals affordable per Turn, through Turn 12
     - cheap-Turn shapes stay UNPROFITABLE against normal play — bill item
       17's economic half. Two shapes are played: `rush` (the historical
       daisy-only probe) and `smart` (full normal play that simply turns the
       moment the gates open, dumping its doomed wallet into Fall beds first —
       the competent version of the same cadence).

   THE VERDICT CAN FAIL. When a cheap-Turn shape beats casual on lifetime
   coins or on Saved Seeds minted, the tool says so and exits non-zero. It
   failed for one day at the original spec constants — sqrt(coinsEarned) plus
   uncapped veterancy made frequent 100K Turns strictly seed-optimal — and it
   PASSES as of 2026-08-29 (phase 1.1), when the owner ruled the mint
   cumulative: the pool is 0.1*sqrt(lifetimeCoins) less what has been drawn,
   so no cadence can out-mint another. Do not "fix" this tool to pass; fix the
   data, then it passes.

   WHAT THE EXIT CODE DOES NOT COVER: the blessing. One free Rich Bloom petal
   per Turn is a per-turn CONSTANT on a now-split-neutral base, and 95 Turns
   fill every flower's Rich Bloom ladder — 318,189 Saved Seeds of value — for
   ~101M lifetime coins. The report separates blessed petals from bought ones
   and discloses this beneath the verdict; it is not failed on, because the
   blessing is a ceremony beat (docs/32) and the owner's next decision rather
   than this tool's to call. See docs/11-known-issues.md.

   The play model is deliberately simple and its knobs sit at the top.
   Calibrate the MODEL knobs to represent a person; never calibrate the
   economy here — the economy's knobs live in data.js. The absolute pacing
   numbers are sensitive to the model (especially the turn policy — the
   measured envelope brackets doc 33's band; see docs/10-decision-log.md,
   2026-08-29 build entry); the four cross-model verdicts above are not.

   Known simplification: todayKey() reads the real clock, so the daily quest
   pays at most once per run (62 rep+coins) — negligible against the totals.

   This is a tool with an exit code, not part of tools/sim-test.js: sim-test
   asserts the ENGINE's invariants; this asserts the ECONOMY's headline
   claims through a play model. */

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
   seed unlock is genuinely out of reach and only then accept the flower's
   invitation. `smart` plays identically but turns the moment the gate opens;
   `rush` is the handicapped daisy-only probe kept for the historical shape. */
const MODEL = {
  sessionsPerDay: 4,               // wake, lunch, evening, night
  sessionHours: [8, 12.5, 18, 21.5],
  sessionMinutes: 6,               // active minutes per session
  tapsPerSecond: 0.8,              // bursty casual tapping, not a held grind
  checkEverySeconds: 8,            // how often the player looks at the plots at all
  badgeWalletShare: 0.05,          // buy a badge when it costs under this share of the wallet
  /* The automation badges are in the list on purpose: without the drone,
     passiveIncomeRate() short-circuits to zero and the model measures an idle
     game with its idle half switched off — every offline gap in the run pays
     nothing, and bill item 10 (petals reach passiveIncomeRate) has no pacing
     evidence behind it. The harvesters are what the drone collects from. */
  badges: ['tapPower', 'critChance', 'comboMeter', 'autoWater', 'critMult', 'plotExpansion',
    'autoHarvest', 'offlineRate', 'offlineHours',
    'plot1Harvester', 'plot2Harvester', 'plot3Harvester', 'plot4Harvester'],
  wallReachDays: 1.2,              // the wall is "in reach" within this many days of trailing income
  minYearHours: 12                 // never turn a year younger than this (casual only)
};

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

/* Best by coins per plot-hour, not last-affordable-in-array-order. Wheat is
   listed after apple in data.js and is deliberately off the 1.4x-per-hour
   curve (2,000/plot-hour against apple's 2,400), so an array-order pick made
   the model plant wheat in all eight plots forever the moment the wallet
   passed 20,000 — never planting the crop doc 33 calls the overnight anchor,
   and understating Fall's ceiling for both the casual player and the
   turn-spam adversary that parks its doomed wallet there. */
function bestFallCrop() {
  let pick = null;
  let bestRate = -Infinity;
  DATA.fall.plants.forEach((p) => {
    if (p.century || S.credits < p.cost) return;
    const rate = (p.yield - p.cost) / p.grow;
    if (rate > bestRate) { bestRate = rate; pick = p; }
  });
  return pick;
}

function playFall() {
  if (!G.fallOpen()) return;
  S.fall.grid.forEach((cell, i) => {
    if (cell.seed && cell.ready) G.fallHarvest(i);
  });
  S.fall.grid.forEach((cell, i) => {
    if (cell.seed) return;
    const pick = bestFallCrop();
    if (pick) G.fallPlant(i, pick.id);
  });
}

/* The blessing goes to the cheapest flower whose Rich Bloom still has room —
   always blessing Daisy wastes every blessing once it caps. */
function blessTarget() {
  for (const s of DATA.seeds) {
    if (G.seedUnlocked(s.id) && G.petalsOf(s.id).rich < DATA.petals.shared.rich.cap) return s.id;
  }
  return null;
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

function playSessionSecond(strategy, results) {
  G.tick(1);
  // taps: floor(x) certain taps plus one roll at the true fractional remainder
  const whole = Math.floor(MODEL.tapsPerSecond);
  for (let t = 0; t < whole; t += 1) G.tapFlower(true);
  if (Math.random() < MODEL.tapsPerSecond - whole) G.tapFlower(true);
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
    playFall();
    // badges, when cheap against the wallet
    MODEL.badges.forEach((key) => {
      if (G.upgradeMaxed(key)) return;
      if (G.upgradePrice(key) < S.credits * MODEL.badgeWalletShare) G.buyUpgrade(key);
    });
    // plots 5–8, once a Turn has opened them
    S.grid.forEach((cell, i) => {
      if (cell.locked && G.plotAvailable(i) && S.credits >= G.plotUnlockCost(i) * 4) G.unlockPlot(i);
    });
    // the next unlock, the moment the wallet reaches it
    const price = nextUnlockPrice();
    if (price !== Infinity && S.credits >= price) {
      const seed = DATA.seeds.find((s) => !G.seedUnlocked(s.id));
      if (G.unlockSeed(seed.id)) results.diary.push(`day ${dayNow().toFixed(2)}: unlocked ${seed.name} for ${price.toLocaleString()}`);
    }
  }
}

function maybeTurn(strategy, results) {
  if (!G.turnReady()) return;
  const yearAgeHours = (clock - results.yearStart) / 3600;
  if (strategy === 'casual') {
    const wall = nextUnlockPrice();
    if (yearAgeHours < MODEL.minYearHours) return;
    /* Ride the year until the next wall sits more than a day's income away.
       Before a full day exists, extrapolate from what today has earned. */
    const lifetime = results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned;
    const income = results.trailingIncome || lifetime / Math.max(0.3, dayNow());
    if (wall !== Infinity && S.credits + income * MODEL.wallReachDays >= wall) return;
  }
  if (strategy === 'smart') {
    /* The rational pre-Turn move: gold is about to zero, Fall beds survive
       the Turn — convert the doomed wallet into growing crops. */
    playFall();
  }
  const turnNo = S.year.turnsCompleted + 1;
  const r = G.turnYear(blessTarget());
  if (!r) return;
  const petals = buyPetals();
  results.turns.push({
    turn: turnNo,
    day: dayNow(),
    earned: Math.round(r.earned),
    pouch: r.pouch,
    tallyMult: r.tally.mult,
    petals,
    blessed: r.blessed ? 1 : 0,
    seedsLeft: S.savedSeeds
  });
  results.yearStart = clock;
}

function run(strategy, days) {
  G.reset();
  clock = dayZero;
  const results = { strategy, turns: [], yearStart: clock, cumEarned: 0, snapshots: [], diary: [] };
  const cumEarnedNow = () => results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned;

  let lifetimeAtDayStart = 0;
  for (let day = 0; day < days; day += 1) {
    for (let s = 0; s < MODEL.sessionsPerDay; s += 1) {
      clock = dayZero + day * 86400 + MODEL.sessionHours[s] * 3600;
      G.reconcile();
      const seconds = MODEL.sessionMinutes * 60;
      for (let t = 0; t < seconds; t += 1) {
        clock += 1;
        playSessionSecond(strategy, results);
        maybeTurn(strategy, results);
      }
    }
    results.trailingIncome = Math.max(1, cumEarnedNow() - lifetimeAtDayStart);
    lifetimeAtDayStart = cumEarnedNow();
    /* Petals owned are split, because the blessing is a PER-TURN grant and
       lumping it in with bought petals hides exactly the thing a cadence
       strategy is farming. */
    const blessedSoFar = results.turns.reduce((a, t) => a + t.blessed, 0);
    const owned = DATA.seeds.reduce((a, s) => {
      const p = G.petalsOf(s.id);
      return a + p.rich + p.quick;
    }, 0);
    results.snapshots.push({
      day: day + 1,
      cumEarned: Math.round(cumEarnedNow()),
      savedSeedsMinted: results.turns.reduce((a, t) => a + t.pouch, 0),
      petalsOwned: owned,
      petalsBlessed: blessedSoFar,
      petalsBought: owned - blessedSoFar,
      turns: results.turns.length
    });
  }
  results.cumEarned = Math.round(cumEarnedNow());
  return results;
}

/* ---- report ---- */
const days = Number(process.argv[2]) || 14;
const strategy = process.argv[3] || 'all';

const report = (r) => {
  console.log(`\n=== ${r.strategy}, ${days} days ===`);
  r.diary.forEach((line) => console.log(`  ${line}`));
  r.turns.forEach((t) => {
    console.log(`  Turn ${t.turn}: day ${t.day.toFixed(2)} · year earned ${t.earned.toLocaleString()} · pouch ${t.pouch} (x${t.tallyMult.toFixed(2)}) · ${t.petals} petals bought · ${t.seedsLeft} seeds left`);
  });
  const last = r.snapshots[r.snapshots.length - 1];
  console.log(`  end of day ${last.day}: lifetime earned ${last.cumEarned.toLocaleString()}, ${last.savedSeedsMinted} seeds minted, ${last.petalsOwned} petals owned (${last.petalsBought} bought + ${last.petalsBlessed} blessed), ${last.turns} turns`);

  if (r.strategy === 'casual') {
    const t1 = r.turns[0];
    console.log('\n  — against the doc-33 targets (model-sensitive; see the header) —');
    console.log(`  first Turn day 2.7–3.3:   ${t1 ? t1.day.toFixed(2) : 'never'} ${t1 && t1.day >= 2.7 && t1.day <= 3.3 ? 'OK' : 'CHECK'}`);
    console.log(`  year one 370–410K:        ${t1 ? t1.earned.toLocaleString() : '-'} ${t1 && t1.earned >= 370000 && t1.earned <= 410000 ? 'OK' : 'CHECK'}`);
    /* Doc 33 makes this claim in its own voice — "every Turn affords a similar
       2–5 petals forever" — and it is the only live signal on the pair of
       exponents that document says must be tuned together. It gets the same
       OK/CHECK treatment as the two above; a majority of Turns in band is the
       bar, because the count is lumpy by nature. */
    const early = r.turns.slice(0, 12);
    const inBand = early.filter((t) => t.petals >= 2 && t.petals <= 5).length;
    const ok = early.length && inBand / early.length >= 0.5;
    console.log(`  2–5 petals per Turn:      ${early.map((t) => t.petals).join(',')} (${inBand}/${early.length} in band) ${ok ? 'OK' : 'CHECK'}`);
    if (early.length < 12) {
      console.log(`  note: casual completed ${early.length} Turns in ${days} days — doc 33's "through Turn 12" needs a longer run to exercise.`);
    }
  }
  return r;
};

if (strategy === 'all') {
  const casual = report(run('casual', days));
  const rush = report(run('rush', days));
  const smart = report(run('smart', days));
  console.log('\n=== bill item 17\'s economic half: do cheap-Turn shapes lose to normal play? ===');
  const day = Math.min(days, 10);
  const rows = [casual, rush, smart].map((r) => ({ r, s: r.snapshots[day - 1] }));
  rows.forEach(({ r, s }) => {
    console.log(`  day ${day}  ${r.strategy.padEnd(6)}: earned ${s.cumEarned.toLocaleString().padStart(11)} · minted ${String(s.savedSeedsMinted).padStart(6)} seeds · ${String(s.petalsBought).padStart(3)} petals bought + ${String(s.petalsBlessed).padStart(3)} blessed · ${s.turns} turns`);
  });
  const c = rows[0].s;
  const beats = rows.slice(1).filter(({ r, s }) => {
    const wins = [];
    if (s.cumEarned > c.cumEarned) wins.push('lifetime coins');
    if (s.savedSeedsMinted > c.savedSeedsMinted) wins.push('Saved Seeds minted');
    if (wins.length) console.log(`  ${r.strategy} BEATS casual on: ${wins.join(', ')}`);
    return wins.length;
  });
  if (beats.length) {
    console.log('  VERDICT: FAIL — a cheap-Turn cadence is profitable against normal play.');
    console.log('  The cumulative mint is supposed to make this impossible by construction, so');
    console.log('  this is a REGRESSION, not the old known exploit: something is paying per Turn');
    console.log('  again. Check that mintedBase moves by the un-tallied increment, that the pool');
    console.log('  reads lifetimeCoins, and that no per-turn multiplier has come back.');
    const goldToo = rows.slice(1).some(({ s }) => s.cumEarned > c.cumEarned);
    console.log(goldToo
      ? '  It wins on GOLD as well as seeds — the strongest form of the break.'
      : '  It is a SEEDS-ONLY break: normal play out-earns it in gold.');
    console.log('  The dials are minCoins / minSeeds / mintK in DATA.year — the owner\'s call.');
    process.exitCode = 1;
  } else {
    console.log('  VERDICT: OK — every cheap-Turn shape loses to normal play on gold and on');
    console.log('  Saved Seeds minted, which are the two currencies the mint controls.');
  }
  /* The blessing is NOT one of them, and this verdict does not cover it. One
     free Rich Bloom petal per Turn is a per-Turn CONSTANT sitting on top of a
     mint that is now split-neutral by construction, so it is the one term a
     cadence can still farm — and the blessed column above is where it shows.
     Reported rather than failed on: the exit code answers the question the
     owner ruled on, and the blessing is a ceremony beat (docs/32, beat 3), so
     changing it is the owner's next decision, not this tool's verdict. The
     arithmetic is in docs/11-known-issues.md. */
  const blessRows = rows.map(({ r, s }) => `${r.strategy} ${s.petalsBlessed}`).join(' · ');
  console.log(`\n  DISCLOSURE — free petals from the blessing, which no gate prices: ${blessRows}.`);
  console.log('  The blessing pays one Rich Bloom petal PER TURN regardless of earnings, so it is');
  console.log('  the term a cadence still farms. 95 Turns fill every flower\'s Rich Bloom ladder');
  console.log('  (318,189 Saved Seeds of value) for ~101M lifetime coins. See docs/11-known-issues.md.');
} else {
  report(run(strategy, days));
}
