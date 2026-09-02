/* The Garden Year — headless pacing model.
   Run with:  node tools/year-sim.js [days] [strategy]
              strategy: casual | rush | smart | winter | all (default)

   SEEDED since 2026-09-01, and the play model is shared with
   `tools/order-gold.js` in `tools/play-model.js`. Five runs of identical code
   used to return OK, OK, OK, FAIL, FAIL; the verdict is a verdict now.

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
/* A FIXED EPOCH, for the same reason tools/sim-test.js has one: weather is a
   pure function of the clock and the sky changes how fast things grow, so a
   run seeded from the wall clock measures a different world every time. */
let clock = 1767269100;
const DEFAULT_SEED = 20260901;
const dayZero = clock;
Date.now = () => clock * 1000;
const dayNow = () => (clock - dayZero) / 86400;

/* ---- the play model ----
   SHARED, in `tools/play-model.js`. This file and `tools/order-gold.js` each
   carried a private copy of the same casual player, and docs/11 has carried
   "seed the referee, then use it" as a standing item ever since. The copies had
   already drifted — order-gold's was stripped of every explanatory comment,
   including the wheat note that stops the model planting wheat in eight plots
   forever — and docs/46 named a THIRD copy, Winter's arm, as the thing this
   extraction exists to prevent. Calibrate the MODEL knobs to represent a
   person; never calibrate the economy there. */
const PlayModel = require('./play-model');
const { MODEL, mulberry32 } = PlayModel;

let model = null;
function bindModel(results) {
  model = PlayModel.makeModel({
    G, S, DATA, STAND,
    now: () => clock,
    dayNow,
    hooks: {
      diary: (line) => results.diary.push(line),
      /* Each collect, with the trailing daily income standing at the moment it
         landed. That pairing is the metric doc 46 asks for and it cannot be
         reconstructed afterwards. */
      onWinterCollect: (res) => {
        (results.winterCollects || (results.winterCollects = [])).push({
          day: dayNow(), payout: res.payout, plots: res.plots, kept: res.kept,
          trailing: results.trailingIncome || 0
        });
      }
    }
  });
  return model;
}

function run(strategy, days, opts = {}) {
  /* SEEDED, and this is the whole reason docs/11 kept the item open: five runs
     of identical code returned OK, OK, OK, FAIL, FAIL, so the verdict was a
     coin flip rather than a verdict. Every arm gets the same stream, so a
     paired comparison — Winter on against Winter off — differs by the arm and
     by nothing else. */
  Math.random = mulberry32(opts.seed === undefined ? DEFAULT_SEED : opts.seed);
  MODEL.winterArm = opts.winter !== false;
  G.reset();
  clock = dayZero;
  const results = { strategy, turns: [], yearStart: clock, cumEarned: 0, snapshots: [], diary: [] };
  bindModel(results);
  const cumEarnedNow = () => results.turns.reduce((a, t) => a + t.earned, 0) + S.year.coinsEarned;

  let lifetimeAtDayStart = 0;
  for (let day = 0; day < days; day += 1) {
    for (let s = 0; s < MODEL.sessionsPerDay; s += 1) {
      clock = dayZero + day * 86400 + MODEL.sessionHours[s] * 3600;
      G.reconcile();
      const seconds = MODEL.sessionMinutes * 60;
      for (let t = 0; t < seconds; t += 1) {
        clock += 1;
        model.playSessionSecond(strategy, results, { nightSession: s === MODEL.winterTuckSession });
        model.maybeTurn(strategy, results);
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

/* ================================================================
   WINTER — the pacing measurement, and guardrail one.

   PAIRED AND SEEDED. Two runs of the same person on the same random stream,
   differing only in whether they play the night shift, so the delta is the
   season and nothing else. The metric doc 46 asks for is a kept night's payout
   as a share of the casual player's trailing daily income — and Winter's
   payouts are excluded from any per-active-minute rate for the reason
   order-gold's preamble gives about offline income.

   GUARDRAIL ONE IS AN EXIT CODE, not a hope: a single full kept night must not
   clear both Turn gates on its own at Turns 3–6. The gates are
   `DATA.year.minCoins` and the `minSeeds` increment, and every extra Turn pays
   the blessing — the one per-Turn faucet nothing prices. This is the assertion
   that keeps the cost ladder honest when somebody retunes it.
   ================================================================ */
function winterMeasurement() {
  const withWinter = run('casual', days, { winter: true });
  const without = run('casual', days, { winter: false });

  const lastOf = (r) => r.snapshots[r.snapshots.length - 1];
  const a = lastOf(withWinter);
  const b = lastOf(without);

  console.log(`\n=== Winter — the night shift, measured (${days} days, seeded, paired) ===`);
  console.log(`  with Winter:    lifetime ${a.cumEarned.toLocaleString().padStart(13)} · ${String(a.turns).padStart(2)} turns · ${String(a.savedSeedsMinted).padStart(5)} seeds minted`);
  console.log(`  without Winter: lifetime ${b.cumEarned.toLocaleString().padStart(13)} · ${String(b.turns).padStart(2)} turns · ${String(b.savedSeedsMinted).padStart(5)} seeds minted`);
  const lift = b.cumEarned > 0 ? (a.cumEarned / b.cumEarned - 1) * 100 : 0;
  console.log(`  Winter's lift on lifetime coins: ${lift >= 0 ? '+' : ''}${lift.toFixed(1)}% over ${days} days`);
  /* A LIFT ON LIFETIME TOTALS IS NOT THE METRIC, and it is printed with its
     caveats rather than quietly. It moves with the run length — +1.4% at ten
     days, +2.6% at twelve, -16.2% at thirty — and the sign flip is not noise:
     the arm that plays Winter TURNS LESS OFTEN. The casual model rides each
     year to its wall, Winter's income pushes that wall further out, and the
     Turn is where the compounding lives (petals, and the blessing nothing
     prices). Winter buys gold and spends Turns.

     Whether that is a cost at all is the owner's question, not this tool's:
     the capital Winter parks is capital that would otherwise be IDLE while the
     player is asleep, and a model that charges Winter the full opportunity cost
     of a wallet the player is not awake to cycle is being unfair to it. Which
     is exactly why docs/46 names a per-morning metric instead. */
  if (a.turns !== b.turns) {
    console.log(`  ...and it TURNED ${a.turns} times against ${b.turns}. Winter buys gold and spends Turns:`);
    console.log('  the casual model rides each year to its wall, and Winter\'s income pushes the');
    console.log('  wall further out. The Turn is where the compounding is. Reported, not judged —');
    console.log('  the capital Winter parks is capital a sleeping player was not cycling anyway.');
  }
  console.log('  (this figure moves with the run length; the metric below is docs/46\'s own.)');

  /* DOC 46'S NAMED METRIC: a kept night's payout as a share of the casual
     player's trailing daily income. Measured per collect, from the pairing the
     model recorded as each one landed — and it is the number that says whether
     the morning FEELS worth coming back for, which a lift on lifetime totals
     does not.

     Winter's payouts are excluded from any per-active-minute rate elsewhere for
     the reason order-gold's preamble gives about offline income; here they are
     the subject, measured against a DAILY figure rather than a per-minute one,
     which is the comparison that does not inflate. */
  const cols = (withWinter.winterCollects || []).filter((c) => c.trailing > 0 && c.kept > 0);
  console.log('\n  THE METRIC — a kept morning as a share of that day\'s income:');
  if (!cols.length) {
    console.log('    NOT MEASURED — this run collected no kept Winter morning against a settled');
    console.log('    daily income. Run more days, or the arm is not being played.');
  } else {
    const shares = cols.map((c) => c.payout / c.trailing).sort((x, y) => x - y);
    const med = shares[shares.length >> 1];
    const lo = shares[0];
    const hi = shares[shares.length - 1];
    console.log(`    ${cols.length} kept mornings · median ${(med * 100).toFixed(1)}% of a day's income`);
    console.log(`    spread ${(lo * 100).toFixed(1)}% to ${(hi * 100).toFixed(1)}%`);
    /* Reported, not judged. The band is the owner's to set at measurement, and
       doc 46 says so in as many words — the tool's job is to make the number
       exist and keep existing. */
    console.log('    Reported rather than judged: docs/46 sets the target band at measurement,');
    console.log('    and that is the owner\'s call. What this line is for is that the number');
    console.log('    keeps existing, and moves when the ladder does.');
  }

  /* A FULL KEPT NIGHT, priced from the data rather than from a run: eight
     plots of one plant, every one of them kept. Every rung is checked, because
     the guardrail is about the LADDER and not about the rung a run happened to
     reach. */
  console.log('\n  a full kept night, per rung — net of what the bed cost to sow:');
  const gate = DATA.year;
  const rungs = DATA.winter.plants.map((p) => {
    const gross = Math.round(p.yield * (1 + DATA.winter.snowfall)) * DATA.winter.plots;
    const cost = p.cost * DATA.winter.plots;
    return { p, gross, net: gross - cost };
  });
  rungs.forEach(({ p, gross, net }) => {
    console.log(`    ${p.name.padEnd(15)} ${String(Math.round(p.grow / 3600)).padStart(2)}h  gross ${gross.toLocaleString().padStart(10)} · net ${net.toLocaleString().padStart(10)}`);
  });

  /* THE ASSERTION, and getting it right took a correction worth keeping. Both
     gates, from one night, WITH NOTHING ELSE PLAYED — measured against the
     ledgers as they actually stand at Turns 3-6 rather than against a zero
     baseline. The mint is CUMULATIVE (`mintK*sqrt(lifetime) - mintedBase`), so
     pricing a night's net as `mintK*sqrt(net)` treats every night as the
     player's first and overstates the seed side by an order of magnitude. The
     honest question is the INCREMENT: at the lifetime this player has actually
     reached, what does one more night's net mint? */
  const gateTurns = withWinter.turns.filter((t) => t.turn >= 3 && t.turn <= 6);
  console.log(`\n  gates: minCoins ${gate.minCoins.toLocaleString()} · minSeeds ${gate.minSeeds}`);
  if (!gateTurns.length) {
    console.log('  GUARDRAIL ONE: NOT MEASURED — this run reached no Turn between 3 and 6.');
    console.log('  Run more days. A guardrail nothing exercised is not a guardrail.');
    process.exitCode = 1;
  } else {
    const breaches = [];
    gateTurns.forEach((t) => {
      rungs.forEach(({ p, net }) => {
        if (net < gate.minCoins) return;                       // the coin gate alone
        const minted = gate.mintK * Math.sqrt(t.lifetime + net) - t.mintedBase;
        const already = gate.mintK * Math.sqrt(t.lifetime) - t.mintedBase;
        const increment = minted - already;
        if (increment >= gate.minSeeds) breaches.push({ turn: t.turn, p, net, increment });
      });
    });
    const worst = {};
    gateTurns.forEach((t) => {
      rungs.forEach(({ p, net }) => {
        const inc = gate.mintK * Math.sqrt(t.lifetime + net) - gate.mintK * Math.sqrt(t.lifetime);
        const k = `${t.turn}|${p.id}`;
        worst[k] = { turn: t.turn, name: p.name, net, inc, clearsCoins: net >= gate.minCoins };
      });
    });
    console.log(`  measured at this run's Turns ${gateTurns.map((t) => t.turn).join(', ')} — lifetime ${
      gateTurns.map((t) => Math.round(t.lifetime / 1000) + 'K').join(', ')}`);
    const topRung = rungs[rungs.length - 1];
    gateTurns.forEach((t) => {
      const inc = gate.mintK * Math.sqrt(t.lifetime + topRung.net) - gate.mintK * Math.sqrt(t.lifetime);
      console.log(`    Turn ${t.turn}: the richest night (8 ${topRung.p.name}, net ${
        topRung.net.toLocaleString()}) clears the coin gate ${
        topRung.net >= gate.minCoins ? 'YES' : 'no'} · mints ${inc.toFixed(2)} seeds against a gate of ${gate.minSeeds}`);
    });
    if (breaches.length) {
      console.log(`\n  GUARDRAIL ONE: FAIL — a single full kept night clears BOTH Turn gates:`);
      breaches.slice(0, 6).forEach(({ turn, p, net, increment }) => {
        console.log(`    Turn ${turn}, 8 ${p.name}: net ${net.toLocaleString()} mints ${increment.toFixed(2)} seeds (gate ${gate.minSeeds})`);
      });
      console.log('  One night should not be a whole Turn. Every extra Turn also pays the blessing,');
      console.log('  which nothing prices — so this compounds. The dial is DATA.winter\'s cost ladder');
      console.log('  (raise the costs, which lowers the net) or DATA.year.minCoins / minSeeds, and');
      console.log('  the second of those is outside this slice. See docs/33 and docs/46.');
      process.exitCode = 1;
    } else {
      console.log('\n  GUARDRAIL ONE: OK — at every Turn between 3 and 6 this run reached, no rung\'s');
      console.log('  single full kept night clears both gates. The coin gate falls to the top rungs');
      console.log('  on its own, which is expected and is why the SEED gate is the binding one:');
      console.log('  the mint is cumulative, so a night is worth less the further in the player is.');
    }
  }

  /* THE NUMBER THAT ACTUALLY MATTERS, and it is a threshold rather than a
     verdict. A pass above depends entirely on how rich this model's player is
     by Turn 3 — the mint is cumulative, so the same night is worth fewer seeds
     the further in they are. Solving `mintK*(sqrt(L+net) - sqrt(L)) = minSeeds`
     for L gives the lifetime BELOW WHICH the richest kept night clears both
     gates on its own. A player poorer than that at Turn 3 breaks the guardrail
     however green the assertion above is, so this line is reported every run
     whether it passes or not. */
  {
    const top = rungs[rungs.length - 1];
    const k = gate.minSeeds / gate.mintK;                    // sqrt(L+net) - sqrt(L)
    const threshold = k * k >= top.net ? 0 : Math.pow((top.net - k * k) / (2 * k), 2);
    const reached = withWinter.turns.filter((t) => t.turn >= 3 && t.turn <= 6).map((t) => t.lifetime);
    const lowest = reached.length ? Math.min(...reached) : null;
    console.log(`\n  THE THRESHOLD, reported every run: below a lifetime of ${
      Math.round(threshold).toLocaleString()} gold, the richest kept night`);
    console.log(`  (8 ${top.p.name}, net ${top.net.toLocaleString()}) clears BOTH gates on its own.`);
    if (lowest !== null) {
      const margin = ((lowest / threshold - 1) * 100);
      console.log(`  This model's poorest Turn-3-to-6 player sits at ${Math.round(lowest).toLocaleString()} — ${
        margin >= 0 ? '+' : ''}${margin.toFixed(1)}% ${margin >= 0 ? 'above' : 'BELOW'} it.`);
      if (margin >= 0 && margin < 25) {
        console.log('  THAT IS A THIN MARGIN. The guardrail passes on this model and would not pass');
        console.log('  on a player who reached Turn 3 poorer — and this model runs hot against');
        console.log('  doc 33\'s own year-one target. Treat the pass as measured, not as safe:');
        console.log('  raising the top rung\'s cost lowers its net and widens the margin, and every');
        console.log('  number in DATA.winter is provisional until the owner rules on them.');
      }
    }
  }

  /* GUARDRAIL TWO IS REPORTED, NOT FAILED ON: the owner has already accepted
     the Turn vault as cosy planning. Reporting its size is what keeps the
     acceptance honest. */
  const top = DATA.winter.plants.reduce((x, y) => (x.cost > y.cost ? x : y));
  const vault = Math.round(top.yield * (1 + DATA.winter.snowfall)) * DATA.winter.plots;
  console.log(`\n  GUARDRAIL TWO (accepted, reported): a ripe bed held through a Turn carries at most`);
  console.log(`  ${vault.toLocaleString()} gold into a fresh purse — eight ${top.name} kept, at ${
    (vault / gate.minCoins).toFixed(1)}x the coin gate. Ruled cosy planning, not an exploit.`);
  return { withWinter, without };
}

/* `--no-winter` runs every arm with the night shift switched off, which is how
   a verdict is attributed: if bill 17 fails both ways, it is not Winter's. */
const winterOff = process.argv.includes('--no-winter');
const armOpts = { winter: !winterOff };

if (strategy === 'winter') {
  winterMeasurement();
} else if (strategy === 'all') {
  const casual = report(run('casual', days, armOpts));
  const rush = report(run('rush', days, armOpts));
  const smart = report(run('smart', days, armOpts));
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
  winterMeasurement();
} else {
  report(run(strategy, days, armOpts));
}
