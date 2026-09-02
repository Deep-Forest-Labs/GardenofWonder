/* play-model.js — the casual player, in ONE place.

   WHY THIS FILE EXISTS. `tools/year-sim.js` and `tools/order-gold.js` each
   carried a private copy of the same play model, and docs/11 has been carrying
   "seed the referee, then use it" as a standing item ever since. The copies had
   already drifted: order-gold's was stripped of every explanatory comment,
   including the load-bearing one about wheat sitting off the 1.4x/plot-hour
   curve, which is exactly the note that stops the model planting wheat in
   eight plots forever. Two tools measuring the economy against two different
   people is two tools that cannot be compared, and docs/46 names a THIRD copy
   — Winter's arm — as the thing this extraction exists to prevent.

   WHAT IS SHARED AND WHAT IS NOT. The knobs and the seven decision functions
   are identical between the two tools and live here whole. The three genuine
   divergences are HOOKS rather than branches, because a shared model with a
   `if (tool === 'order-gold')` in it is two models again:

     onDeliver(i, order)        order-gold instruments every delivery
     onActiveSecond(delta)      order-gold's per-active-second rate window
     onTurn(results)            order-gold clears that window at the Turn
     lifetimeOf(results)        the trailing-income source: year-sim sums its
                                own turn records, order-gold reads lifetimeCoins
     diary(line)                year-sim keeps an unlock diary, order-gold does not

   NO ECONOMY LIVES HERE. These knobs represent a PERSON; the economy's knobs
   are in data.js. Calibrate this to a player and never to a target. */

'use strict';

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
  minYearHours: 12,                // never turn a year younger than this (casual only)

  /* WINTER'S ARM. A player who has met the season tucks the bed in when their
     LAST session of the day ends and collects at the first session of the
     next — which is the ritual the season is built around, not an optimal
     policy. `winterArm: false` is the paired baseline the measurement runs
     against, and it is the whole point of having a knob here: the same person,
     with and without the night shift. */
  winterArm: true,
  winterTuckSession: 3             // index into sessionHours — the night one
};

/* A seeded PRNG, so a verdict is a verdict rather than a coin flip.
   Recorded in docs/11: five runs of identical code returned OK, OK, OK, FAIL,
   FAIL. mulberry32 — small, fast, and good enough for a play model that only
   needs "did this person tap this second". */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bind the model to a harness.
 *
 * @param {object} env
 *   G, S            the loaded Game and its state
 *   DATA, STAND     the data globals
 *   now()           the harness clock, in seconds
 *   dayNow()        days elapsed since the run began
 *   hooks           the five above, all optional
 */
function makeModel(env) {
  const { G, S, DATA, STAND } = env;
  const now = env.now;
  const dayNow = env.dayNow;
  const h = env.hooks || {};
  /* Read Math.random LIVE, never captured: order-gold reassigns it to a seeded
     stream inside run(), which is after this factory has been called. Capturing
     it here would hand every run the unseeded original and silently undo the
     seeding this extraction exists to add. */
  const random = env.random || (() => Math.random());
  const diary = h.diary || (() => {});
  const deliver = h.onDeliver || ((i) => {
    const o = G.standOrderAt(i);
    if (o && G.standCanDeliver(o)) G.standDeliver(i);
    return 0;
  });
  const onActiveSecond = h.onActiveSecond || (() => {});
  const onTurn = h.onTurn || (() => {});
  /* THE FIFTH DIVERGENCE, and it only showed up when the extraction was run:
     year-sim's `results.turns` is an ARRAY of turn records and order-gold's is
     a COUNTER. Both are right for their own report, so recording a turn is a
     hook rather than a shape this file insists on. */
  const recordTurn = h.recordTurn || ((results, record) => { results.turns.push(record); });
  const lifetimeOf = h.lifetimeOf
    || ((results) => results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned);

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

  /* Winter's counterpart, and the same shape by design so the two seasons are
     comparable: best by coins per plot-hour among what the wallet can afford.
     The SNOWFALL IS NOT IN THE RATE — a plant is picked on its base, because a
     player choosing what to sow is not doing bonus arithmetic, and pricing the
     kept case in would make the model plant for a bonus it has not earned yet. */
  function bestWinterPlant() {
    let pick = null;
    let bestRate = -Infinity;
    DATA.winter.plants.forEach((p) => {
      if (S.credits < p.cost) return;
      const rate = (p.yield - p.cost) / p.grow;
      if (rate > bestRate) { bestRate = rate; pick = p; }
    });
    return pick;
  }

  /* THE RITUAL, not an optimal policy, and the difference is measurable.

     The first draft filled every empty Winter plot on every eight-second check
     with the best rung the wallet could afford — and it made the casual arm
     8% POORER, because Winter's per-hour rate is far below Summer's by design
     (the tuck's convenience is paid for in rate) and a greedy refill parks the
     whole wallet in the slowest season in the game. That is not a finding about
     the economy; it is a model that does not represent a person.

     What a person does: COLLECT whenever they look, and SOW AND TUCK once, on
     the way out at the end of the day. Two taps a day apart is the season's
     own sentence, and modelling it any other way measures a player nobody is. */
  function playWinter(isNightSession) {
    if (!MODEL.winterArm || !G.winterOpen()) return 0;
    const res = G.winterHarvestAll();
    const paid = res ? res.payout : 0;
    if (!isNightSession) return paid;
    S.winter.grid.forEach((cell, i) => {
      if (cell.seed) return;
      const pick = bestWinterPlant();
      if (pick) G.winterPlant(i, pick.id);
    });
    if (!G.winterTucked()) G.winterTuck();
    return paid;
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

  function playSessionSecond(strategy, results, ctx) {
    const lifeBefore = S.lifetimeCoins;
    let orderGold = 0;
    let winterGold = 0;
    G.tick(1);
    // taps: floor(x) certain taps plus one roll at the true fractional remainder
    const whole = Math.floor(MODEL.tapsPerSecond);
    for (let t = 0; t < whole; t += 1) G.tapFlower(true);
    if (random() < MODEL.tapsPerSecond - whole) G.tapFlower(true);
    // A person checks the beds every so often, not every second.
    if (Math.floor(now()) % MODEL.checkEverySeconds === 0) {
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
      for (let i = 0; i < STAND.slots; i += 1) orderGold += deliver(i);
      claimQuests();
      if (strategy !== 'rush') {
        playFall();
        winterGold = playWinter(ctx && ctx.nightSession);
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
          if (G.unlockSeed(seed.id)) diary(`day ${dayNow().toFixed(2)}: unlocked ${seed.name} for ${price.toLocaleString()}`);
        }
      }
    }
    /* THE ACTIVE-RATE DELTA, with order gold AND Winter's payout taken out.
       Order gold is excluded because the rate is what the player earns on their
       own; Winter's is excluded for the reason order-gold's own preamble gives
       about offline income — a whole night's payout attributed to the one
       active second of the morning collect is exactly that inflation, and
       Winter is offline income wearing a different name. */
    onActiveSecond(S.lifetimeCoins - lifeBefore - orderGold - winterGold, orderGold);
  }

  function maybeTurn(strategy, results) {
    if (!G.turnReady()) return;
    const yearAgeHours = (now() - results.yearStart) / 3600;
    if (strategy === 'casual') {
      const wall = nextUnlockPrice();
      if (yearAgeHours < MODEL.minYearHours) return;
      /* Ride the year until the next wall sits more than a day's income away.
         Before a full day exists, extrapolate from what today has earned. */
      const lifetime = lifetimeOf(results);
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
    recordTurn(results, {
      turn: turnNo,
      day: dayNow(),
      earned: Math.round(r.earned),
      pouch: r.pouch,
      tallyMult: r.tally.mult,
      petals,
      blessed: r.blessed ? 1 : 0,
      seedsLeft: S.savedSeeds,
      /* The mint's two ledgers AT the moment of the Turn. Winter's guardrail is
         about what one night is worth against the gates as they actually stand
         at Turns 3-6, and the mint is CUMULATIVE — pricing a night against a
         zero baseline overstates it by an order of magnitude. */
      lifetime: S.lifetimeCoins,
      mintedBase: S.mintedBase
    });
    results.yearStart = now();
    onTurn(results);
  }

  return {
    MODEL,
    nextUnlockPrice, bestPlantable, bestFallCrop, bestWinterPlant,
    playFall, playWinter, blessTarget, buyPetals, claimQuests,
    playSessionSecond, maybeTurn
  };
}

module.exports = { MODEL, makeModel, mulberry32 };
