/* Garden Stand order gold — is a delivery worth a minute of your time?
   Run with:  node tools/order-gold.js [days] [seeds] [--ledger]

   The owner's rule for the Stand, from docs/13-order-system.md's premise and
   ruled in plain words: a delivered order should pay ROUGHLY ONE TO TWO
   MINUTES of the player's current earning rate, at EVERY tier. Not "a lot",
   not "more than selling" — a specific, measurable span of the player's own
   time. This tool measures it against the real game.js rather than the eye,
   and it is meant to be re-run after every change to STAND.tiers[].mult in
   data.js so the person tuning can watch the numbers move.

   The play model is tools/year-sim.js's `casual` model, verbatim: four
   sessions a day, six active minutes each, bursty tapping, replant on sight,
   deliver whatever the Stand will take. Calibrate the MODEL knobs to
   represent a person; never calibrate the economy here — the economy's knobs
   live in data.js.

   HOW ORDER GOLD IS SEPARATED FROM OTHER GOLD. Every coin the garden honestly
   earns lands in state.lifetimeCoins (game.js credit(), line 102), so the
   earnings stream is sampled as the lifetimeCoins delta across each active
   second. standDeliver() is wrapped: the lifetimeCoins delta ACROSS THE CALL
   is the order's gold — the payout plus anything a level-up riding on the
   delivery paid — and that amount is subtracted out of the second it landed
   in. The baseline therefore never chases its own tail, and the seconds-of-
   earning figure divides the order's own `paid` (what the counter handed
   over) by the rate the rest of the garden was running at.

   WHAT "EARNING RATE" MEANS HERE — coins per ACTIVE minute, over a trailing
   300-active-second window (five minutes of play, about one session), and
   deliberately EXCLUDING:
     - order payouts, per above;
     - offline income. The drone's overnight pile is credited inside
       G.reconcile() between sessions, so it never lands in an active second
       and never enters the window. Attributing sixteen sleeping hours to six
       minutes of play would inflate the rate a hundredfold and make every
       order look worthless. The offline share of lifetime coins is disclosed
       under the table so the tuner can see how much income the band's
       definition is standing outside of.
   The window is cleared at a Turn: the year reset takes the garden back to
   four plots and one flower, so pre-Turn seconds describe a different economy
   than the one the next order is being judged against. A delivery is only
   measured once 60 active seconds of history exist; earlier ones are counted
   and reported as warmup rather than measured.

   THE STANDING INVARIANT, checked per delivery: the payout must exceed what
   selling the contents would have paid. tools/sim-test.js asserts this
   property on a synthetic board; here it is checked against what ACTUALLY
   crossed the counter — the pantry and the honey shelf are snapshotted either
   side of standDeliver() and the vanished stock is priced at flowerValue() /
   APIARY.honeyValue(), which are exactly the numbers sell() pays. Any
   violation prints a FAIL line and is never truncated out of the report.

   FORCED TIERS. STAND.repPaused is true in data.js, so orders pay no standing
   and a casual run climbs on quest rep alone — tiers 3 (rep 220) and 4 (rep
   600) may never arrive organically. When a tier gets no organic deliveries,
   the run is replayed with state.rep pinned to that tier's threshold from day
   MEASURE.forceFromDay onward, and every row it produces is labelled FORCED.
   Pinning writes state.rep and state.level directly rather than going through
   addRep() (which is not exported anyway): the forced player gets the TIER and
   nothing else — no level grants, no free hive, no boosts. That makes the
   forced baseline slightly poorer than a real player at that standing, which
   biases forced seconds-of-earning slightly HIGH. A tier that produces no rows
   even forced prints a loud NOT REACHED line; it never silently prints
   nothing.

   DETERMINISM. Math.random is replaced for the whole run by a seeded
   mulberry32, the clock starts at a fixed epoch, and the report pools several
   independent seeds. Pinning to a single constant the way tools/sim-test.js
   does would make one order board, not a distribution, and the medians here
   are a distribution's headline; running unpinned would make the tool unable
   to tell a tuning change from noise. Seeded-and-pooled is both: the same
   data.js gives the same answer twice, and the medians sit on hundreds of
   deliveries. The one drift left is year-sim's: todayKey() reads the real
   calendar, so the daily quest pays at most once per run.

   WHAT THE VERDICT DOES NOT COVER. It judges the SIZE of the payout against
   the player's own rate, nothing else — not whether the board offers the
   right goods, not the refill cadence, not standing (paused), and not whether
   one to two minutes is the right band. The band is the owner's ruling; this
   tool only says whether the data currently honours it. A tier reading TOO LOW
   or TOO HIGH is an instruction to change STAND.tiers[].mult in data.js and
   run this again — never to change the measurement here.

   THE EXIT CODE IS THE INVARIANT'S, NOT THE BAND'S. Only a delivery that pays
   less than its contents would fetch on the sell button exits non-zero: that
   is a broken engine. Being outside the 60–120s band is a tuning reading, and
   this tool is the instrument that reports it, not the gate that blocks on
   it — the mult that closes the gap is the owner's number to pick. */

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

/* ---- the clock ----
   A fixed epoch rather than year-sim's Date.now(), so two runs a week apart
   compare. The weather wheel and the day/night phase are derived from absolute
   time, and a wandering start would quietly move them under the tuner. */
const EPOCH = Date.UTC(2026, 0, 5) / 1000;
let clock = EPOCH;
Date.now = () => clock * 1000;
const dayNow = () => (clock - EPOCH) / 86400;

/* ---- the dice ---- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- the play model's knobs — tools/year-sim.js `casual`, unchanged ---- */
const MODEL = {
  sessionsPerDay: 4,
  sessionHours: [8, 12.5, 18, 21.5],
  sessionMinutes: 6,
  tapsPerSecond: 0.8,
  checkEverySeconds: 8,
  badgeWalletShare: 0.05,
  badges: ['tapPower', 'critChance', 'comboMeter', 'autoWater', 'critMult', 'plotExpansion',
    'autoHarvest', 'offlineRate', 'offlineHours',
    'plot1Harvester', 'plot2Harvester', 'plot3Harvester', 'plot4Harvester'],
  wallReachDays: 1.2,
  minYearHours: 12
};

/* ---- the measurement's knobs ---- */
const MEASURE = {
  seeds: 5,               // independent runs pooled per tier
  windowSeconds: 300,     // trailing active seconds the rate is read over
  minWindowSeconds: 60,   // below this the window is warmup, not a rate
  bandLow: 60,            // the owner's band, in seconds of earning
  bandHigh: 120,
  forceFromDay: 3,        // where a forced tier is pinned, in days of play
  ledgerRows: 40,         // per-delivery rows printed without --ledger
  thinSample: 30          // below this many rows a median is indicative, not evidence
};

/* ---- the play model (year-sim's casual shape) ---- */
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

function blessTarget() {
  for (const s of DATA.seeds) {
    if (G.seedUnlocked(s.id) && G.petalsOf(s.id).rich < DATA.petals.shared.rich.cap) return s.id;
  }
  return null;
}

function buyPetals() {
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
  }
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

/* ---- the rate window ----
   A plain ring of per-active-second earnings with the order gold already taken
   out. Kept as a running sum because it is read on every delivery. */
function makeRate() {
  return { win: [], sum: 0 };
}
function pushEarn(rate, n) {
  rate.win.push(n);
  rate.sum += n;
  if (rate.win.length > MEASURE.windowSeconds) rate.sum -= rate.win.shift();
}
function clearRate(rate) {
  rate.win.length = 0;
  rate.sum = 0;
}
function ratePerSecond(rate) {
  if (rate.win.length < MEASURE.minWindowSeconds) return null;
  return rate.sum / rate.win.length;
}

/* ---- what actually crossed the counter ----
   Priced at flowerValue() / APIARY.honeyValue(), which are the same units
   sell() pays, so "would selling have paid more?" is a fair question and not
   an apples-to-pears one. The snapshot brackets standDeliver() alone, so a
   harvest landing in the same simulated second cannot pollute the diff. */
function stockOf() {
  return { flowers: Object.assign({}, S.flowers), honey: Object.assign({}, S.apiary.honey) };
}
function spentValue(before, after) {
  let total = 0;
  Object.keys(before.flowers).forEach((id) => {
    const gone = (before.flowers[id] || 0) - (after.flowers[id] || 0);
    if (gone > 0) total += gone * flowerValue(id);
  });
  Object.keys(before.honey).forEach((id) => {
    const gone = (before.honey[id] || 0) - (after.honey[id] || 0);
    if (gone > 0) total += gone * APIARY.honeyValue(id);
  });
  return total;
}

function deliverInstrumented(slot, run) {
  const order = G.standOrderAt(slot);
  if (!order || !G.standCanDeliver(order)) return 0;
  const tier = G.standTierAt(S.rep).tier;
  const before = stockOf();
  const lifeBefore = S.lifetimeCoins;
  const result = G.standDeliver(slot);
  if (!result) return 0;
  const gold = S.lifetimeCoins - lifeBefore;
  const worth = spentValue(before, stockOf());
  const rps = ratePerSecond(run.rate);
  const row = {
    day: dayNow(),
    tier,
    good: order.good,
    paid: result.paid,
    gold,
    worth,
    ratePerMin: rps === null ? null : rps * 60,
    secs: rps === null || rps <= 0 ? null : result.paid / rps,
    forced: run.forcedTier !== null
  };
  run.rows.push(row);
  if (rps === null) run.warmup += 1;
  else if (rps <= 0) run.dead += 1;
  if (gold > result.paid) run.grantGold += gold - result.paid;
  // The standing invariant. Never truncated out of the report.
  if (!(result.paid > worth)) run.fails.push(row);
  return gold;
}

function playSessionSecond(run) {
  const lifeBefore = S.lifetimeCoins;
  let orderGold = 0;
  G.tick(1);
  const whole = Math.floor(MODEL.tapsPerSecond);
  for (let t = 0; t < whole; t += 1) G.tapFlower(true);
  if (Math.random() < MODEL.tapsPerSecond - whole) G.tapFlower(true);
  if (Math.floor(clock) % MODEL.checkEverySeconds === 0) {
    S.grid.forEach((cell, i) => {
      if (cell.locked || !cell.seed || !cell.ready) return;
      G.harvest(i);
    });
    S.grid.forEach((cell, i) => {
      if (cell.locked || cell.seed) return;
      const pick = bestPlantable();
      if (pick) G.plant(i, pick);
    });
    for (let i = 0; i < STAND.slots; i += 1) orderGold += deliverInstrumented(i, run);
    claimQuests();
    playFall();
    MODEL.badges.forEach((key) => {
      if (G.upgradeMaxed(key)) return;
      if (G.upgradePrice(key) < S.credits * MODEL.badgeWalletShare) G.buyUpgrade(key);
    });
    S.grid.forEach((cell, i) => {
      if (cell.locked && G.plotAvailable(i) && S.credits >= G.plotUnlockCost(i) * 4) G.unlockPlot(i);
    });
    const price = nextUnlockPrice();
    if (price !== Infinity && S.credits >= price) {
      const seed = DATA.seeds.find((s) => !G.seedUnlocked(s.id));
      G.unlockSeed(seed.id);
    }
  }
  pushEarn(run.rate, S.lifetimeCoins - lifeBefore - orderGold);
}

function maybeTurn(run) {
  if (!G.turnReady()) return;
  const yearAgeHours = (clock - run.yearStart) / 3600;
  if (yearAgeHours < MODEL.minYearHours) return;
  const wall = nextUnlockPrice();
  const income = run.trailingIncome || S.lifetimeCoins / Math.max(0.3, dayNow());
  if (wall !== Infinity && S.credits + income * MODEL.wallReachDays >= wall) return;
  if (!G.turnYear(blessTarget())) return;
  buyPetals();
  run.turns += 1;
  run.yearStart = clock;
  // A Turn takes the garden back to four plots: the seconds before it describe
  // an economy the next order is not being judged against.
  clearRate(run.rate);
}

/* forcedTier: null for organic play, or a STAND.tiers entry to pin from
   MEASURE.forceFromDay onward. Pinning writes rep and level directly — see the
   header on why the forced player gets the tier and nothing else. */
function run(seed, days, forcedTier) {
  Math.random = mulberry32(seed);
  clock = EPOCH;
  G.reset();
  const state = {
    seed,
    forcedTier: forcedTier ? forcedTier.tier : null,
    rows: [],
    fails: [],
    rate: makeRate(),
    turns: 0,
    yearStart: clock,
    warmup: 0,
    dead: 0,
    grantGold: 0,
    offline: 0,
    trailingIncome: 0,
    repEnd: 0
  };

  let lifeAtDayStart = 0;
  for (let day = 0; day < days; day += 1) {
    for (let s = 0; s < MODEL.sessionsPerDay; s += 1) {
      clock = EPOCH + day * 86400 + MODEL.sessionHours[s] * 3600;
      const lifeBefore = S.lifetimeCoins;
      G.reconcile();
      state.offline += S.lifetimeCoins - lifeBefore;
      if (forcedTier && day >= forceDay && S.rep < forcedTier.rep) {
        S.rep = forcedTier.rep;
        S.level = G.levelFromRep(S.rep);
        // The pinning moment credits level-adjacent nothing, but the board and
        // the garden both change shape under it — start the rate fresh.
        clearRate(state.rate);
      }
      const seconds = MODEL.sessionMinutes * 60;
      for (let t = 0; t < seconds; t += 1) {
        clock += 1;
        playSessionSecond(state);
        maybeTurn(state);
      }
    }
    state.trailingIncome = Math.max(1, S.lifetimeCoins - lifeAtDayStart);
    lifeAtDayStart = S.lifetimeCoins;
  }
  state.lifetime = S.lifetimeCoins;
  state.repEnd = S.rep;
  return state;
}

/* ---- statistics ---- */
function median(xs) {
  if (!xs.length) return 0;
  const a = xs.slice().sort((x, y) => x - y);
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
function pct(xs, p) {
  if (!xs.length) return 0;
  const a = xs.slice().sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}
const fmt = (n) => Math.round(n).toLocaleString();
const secs = (n) => `${n.toFixed(1)}s`;

function verdictFor(med) {
  if (med < MEASURE.bandLow) return 'TOO LOW';
  if (med > MEASURE.bandHigh) return 'TOO HIGH';
  return 'OK';
}

/* ---- the report ---- */
const days = Number(process.argv[2]) || 14;
const seedCount = Number(process.argv[3]) || MEASURE.seeds;
const fullLedger = process.argv.includes('--ledger');
/* Clamped so a short run still forces: pinning on a day the run never reaches
   would print NOT REACHED for a tier the tool was asked to measure. */
const forceDay = Math.min(MEASURE.forceFromDay, Math.max(0, Math.floor(days / 2)));

const organic = [];
for (let i = 0; i < seedCount; i += 1) organic.push(run(1000 + i, days, null));

const measured = (rows) => rows.filter((r) => r.secs !== null);
const rowsFor = (runs, tier) => runs.flatMap((r) => r.rows.filter((row) => row.tier === tier));

/* Any tier the casual run never stood at gets a forced replay. Rows from a
   forced run at OTHER tiers are dropped: the run is identical to the organic
   one up to the pinning day, so keeping them would double-count. */
const forcedRuns = {};
STAND.tiers.forEach((t) => {
  if (rowsFor(organic, t.tier).length) return;
  forcedRuns[t.tier] = [];
  for (let i = 0; i < seedCount; i += 1) forcedRuns[t.tier].push(run(1000 + i, days, t));
});

const totalRows = organic.reduce((a, r) => a + r.rows.length, 0);
const lifetime = mean(organic.map((r) => r.lifetime));
const offline = mean(organic.map((r) => r.offline));

console.log(`\n=== Garden Stand order gold — ${days} days x ${seedCount} seeds, casual model ===`);
console.log(`  target band: a delivery pays ${MEASURE.bandLow}–${MEASURE.bandHigh} seconds of the player's own earning rate.`);
console.log(`  baseline: coins per ACTIVE minute over a trailing ${MEASURE.windowSeconds}s window, order gold and offline income removed.`);
console.log(`  organic deliveries: ${totalRows} across ${seedCount} seeds · rep at end of run: ${organic.map((r) => r.repEnd).join(', ')}`);
console.log(`  STAND.tiers mult: ${STAND.tiers.map((t) => `t${t.tier}=${t.mult}`).join(' ')} · repPaused=${STAND.repPaused}`);

/* ---- the per-delivery ledger ----
   Every delivery is recorded; --ledger prints all of them for all seeds. The
   default view is evenly spaced across one seed's run rather than its first
   rows, because the first rows are all day zero and the thing a tuner needs to
   see is how the span moves as the garden's income compounds. */
const ledger = fullLedger ? organic.flatMap((r) => r.rows) : organic[0].rows;
const step = Math.max(1, Math.ceil(ledger.length / MEASURE.ledgerRows));
const shown = fullLedger ? ledger : ledger.filter((row, i) => i % step === 0);
console.log(`\n--- every delivery${fullLedger ? '' : ` (seed ${organic[0].seed}, every ${step}${step === 1 ? '' : 'th'} of ${ledger.length})`} ---`);
shown.forEach((row) => {
  const rate = row.ratePerMin === null ? 'warmup' : `${fmt(row.ratePerMin)}/min`;
  const span = row.secs === null ? '   —   ' : secs(row.secs).padStart(7);
  console.log(`  day ${row.day.toFixed(2).padStart(5)}  t${row.tier}  ${row.good.padEnd(10)} paid ${fmt(row.paid).padStart(9)} · sell ${fmt(row.worth).padStart(9)} · rate ${rate.padStart(12)} · ${span}`);
});
if (!fullLedger && ledger.length > shown.length) {
  console.log(`  … ${ledger.length - shown.length} rows skipped. Re-run with --ledger for every delivery of every seed.`);
}

/* ---- the table ---- */
console.log('\n--- seconds of earning, per tier ---');
console.log('  tier  n      median      mean       min       max   verdict');
const verdicts = [];
STAND.tiers.forEach((t) => {
  const forced = forcedRuns[t.tier];
  const rows = forced ? rowsFor(forced, t.tier) : rowsFor(organic, t.tier);
  const good = measured(rows);
  const label = forced ? `t${t.tier} FORCED` : `t${t.tier} organic`;
  if (!good.length) {
    verdicts.push(`t${t.tier} NOT REACHED`);
    console.log(`  ${label.padEnd(11)} NOT REACHED — no deliveries at this tier, organic or forced.`);
    console.log(`  ${' '.repeat(11)} rep ${t.rep} was never stood at, or the board offered no tier-${t.tier} good the`);
    console.log(`  ${' '.repeat(11)} player could fill. This tier's mult is UNMEASURED and must not be tuned blind.`);
    return;
  }
  const xs = good.map((r) => r.secs);
  const med = median(xs);
  verdicts.push(`t${t.tier} ${verdictFor(med)}`);
  console.log(`  ${label.padEnd(11)} ${String(good.length).padStart(4)}  ${secs(med).padStart(8)}  ${secs(mean(xs)).padStart(8)}  ${secs(Math.min(...xs)).padStart(8)}  ${secs(Math.max(...xs)).padStart(8)}   ${verdictFor(med)}`);
  if (forced) {
    console.log(`  ${' '.repeat(11)} FORCED: rep pinned to ${t.rep} from day ${forceDay} of each seed. Not organic play — see the header.`);
  }
  const goods = {};
  good.forEach((r) => { goods[r.good] = (goods[r.good] || 0) + 1; });
  /* The mean sits far above the median and the max is absurd on purpose: a
     payout is priced off the blooms actually handed over, and an Eternal is
     worth orders of magnitude more than a daisy. The quartiles are the honest
     shape of "what a delivery usually feels like"; the mean is not. */
  const band = good.filter((r) => r.secs >= MEASURE.bandLow && r.secs <= MEASURE.bandHigh).length;
  console.log(`  ${' '.repeat(11)} p25 ${secs(pct(xs, 0.25))} · p75 ${secs(pct(xs, 0.75))} · ${band}/${good.length} (${Math.round(100 * band / good.length)}%) land inside the band`);
  console.log(`  ${' '.repeat(11)} median pay ${fmt(median(good.map((r) => r.paid)))} · goods seen: ${Object.keys(goods).map((k) => `${k} x${goods[k]}`).join(', ')}`);
  /* A mult that would land the median in the band, if the payout scaled
     linearly with it. It does not exactly — max(order.coins, reprice) means a
     card priced at a lower tier can win — but it is the right first guess. */
  const want = med > 0 ? t.mult * (MEASURE.bandLow + MEASURE.bandHigh) / 2 / med : 0;
  console.log(`  ${' '.repeat(11)} mult ${t.mult} → a 90s median would want roughly ${want.toFixed(1)} (linear guess; re-run to confirm).`);
  if (good.length < MEASURE.thinSample) {
    console.log(`  ${' '.repeat(11)} THIN SAMPLE (${good.length} rows) — the player stands at this tier only briefly. Indicative, not evidence.`);
  }
});

/* ---- the standing invariant ---- */
const allRuns = organic.concat(Object.keys(forcedRuns).flatMap((k) => forcedRuns[k]));
const fails = allRuns.flatMap((r) => r.fails);
console.log('\n--- invariant: a delivery must beat selling its contents ---');
if (!fails.length) {
  const checked = allRuns.reduce((a, r) => a + r.rows.length, 0);
  const worst = allRuns.flatMap((r) => r.rows).reduce((a, r) => Math.min(a, r.worth ? r.paid / r.worth : Infinity), Infinity);
  console.log(`  OK — ${checked} deliveries checked, every one paid more than its contents were worth.`);
  console.log(`  thinnest margin seen: paid = ${worst.toFixed(2)}x the sell value of what crossed the counter.`);
} else {
  fails.forEach((f) => {
    console.log(`  FAIL — day ${f.day.toFixed(2)} t${f.tier} ${f.good}: paid ${fmt(f.paid)} for contents worth ${fmt(f.worth)} sold.`);
  });
  console.log(`  ${fails.length} violations. STAND.tiers[].mult has gone below the floor that guarantees`);
  console.log('  the board is worth using at all — see docs/13-order-system.md.');
  process.exitCode = 1;
}

/* ---- what the band's definition is standing outside of ---- */
const warmup = organic.reduce((a, r) => a + r.warmup, 0);
const dead = organic.reduce((a, r) => a + r.dead, 0);
const grantGold = organic.reduce((a, r) => a + r.grantGold, 0);
console.log('\n--- disclosure ---');
console.log(`  VERDICT against the ${MEASURE.bandLow}–${MEASURE.bandHigh}s band: ${verdicts.join(' · ')}`);
console.log(`  offline income is ${(100 * offline / Math.max(1, lifetime)).toFixed(1)}% of lifetime coins (${fmt(offline)} of ${fmt(lifetime)}, mean per seed) and is NOT in the rate.`);
console.log('  Beds that matured overnight ARE in it: the player harvests them in the first active');
console.log('  seconds of a session, so the window opens on a spike every morning by construction.');
console.log(`  ${warmup} deliveries landed before ${MEASURE.minWindowSeconds}s of window existed and are counted as warmup, not measured. ${dead} landed against a zero rate.`);
console.log(`  ${fmt(grantGold)} coins arrived as level grants riding on deliveries; removed from the baseline, not from the payout.`);
console.log(`  turns completed: ${organic.map((r) => r.turns).join(', ')} · a Turn clears the rate window.`);
console.log('  This measures payout SIZE against the player\'s own rate. It says nothing about');
console.log('  refill cadence, the goods mix, or standing (paused). Tune STAND.tiers[].mult, re-run.\n');
