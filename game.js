/* Garden Wonder — simulation layer.
   All economy math is a faithful port of Idle Garden Reborn; the only addition
   is the Wonder Effect, which layers a temporary multiplier on top. */

const Game = (() => {
  const SAVE_KEY = 'gw-save';
  const LEGACY_KEY = 'igr-save';

  const listeners = {};
  const on = (evt, fn) => ((listeners[evt] = listeners[evt] || []).push(fn), fn);
  const emit = (evt, payload) => (listeners[evt] || []).forEach((fn) => fn(payload));

  const nowSeconds = () => Date.now() / 1000;

  const defaultState = () => {
    const upgrades = {
      tapPower: 0, holdSpeed: 0, critChance: 0, critMult: 0, comboMeter: 0,
      rainDance: 0, beeSwarm: 0, ladybug: 0,
      plotExpansion: 0, autoWater: 0, autoHarvest: 0, offlineRate: 0, offlineHours: 0
    };
    PLOT_AUTOPLANTERS.forEach(({ key }) => { upgrades[key] = 0; });
    return {
      version: 4,
      credits: 100,
      /* The Garden Year. `coinsEarned` is the mint's whole input: a
         lifetime-this-year accumulator written only by credit(), never
         decremented, zeroed at the Turn. `stats` are the Tally's counters —
         year-scoped, never lifetime, never spendable. */
      year: {
        number: 1,
        coinsEarned: 0,
        turnsCompleted: 0,
        stats: { orders: 0, windfalls: 0, species: 0, speciesSeen: {}, legendaries: 0, bestCombo: 0 }
      },
      savedSeeds: 0,
      petals: {},
      seedUnlocks: {},
      blessed: [],
      fall: {
        grid: Array(DATA.fall.plots).fill(0).map(() => ({ seed: null, plantedAt: 0, grow: 0, ready: false, windfall: false })),
        bedPaid: false
      },
      tickets: 0,
      gems: 0,
      tap: { power: 1, critChance: 0.05, critMult: 10, combo: 0, comboMax: 50, holdInterval: 900 },
      grid: Array(8).fill(0).map((_, i) => ({ locked: i > 3, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '', luckyBug: false, mutation: null, mutateAt: 0, packDrop: false })),
      upgrades,
      decor: [],
      boosters: {},
      boostInv: { bloom: 0, seedrush: 0, fortune: 0, golden: 0 },
      harvestsThisSession: 0,
      lastSeen: 0,
      weatherCall: null,
      cards: {},
      packs: 0,
      setsClaimed: [],
      stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
      wonder: { until: 0, last: 0 },
      apiary: { cells: Array(MEADOW.cells).fill(null), locked: MEADOW.cellUnlockLevel.map((lv) => lv > 1),
        honey: {}, wax: 0, shelf: {}, keepers: [] },
      flowers: {},
      craft: [],
      goods: {},
      bench: { cells: Array(BENCH.cols * BENCH.cols).fill(null), side: BENCH.startSide, basket: [], stock: {} },
      critters: {},
      stand: { slots: Array(STAND.slots).fill(null), nextAt: Array(STAND.slots).fill(0), seq: 0, delivered: 0, skipped: 0 },
      pairsSeen: [],
      mementos: {},
      luckyPacks: 0,
      prefs: { sfx: true, music: false },
      seen: { intro: false, plot: false, apiary: false },
      quests: { active: [], done: [], daily: { id: null, progress: 0, day: '', claimed: false } },
      rep: 0,
      level: 1,
      discovered: {},
      bestRarity: {},
      almanacClaimed: [],
      mastery: {},
      rarityCounts: {}
    };
  };

  const state = defaultState();
  let lastAutoHarvest = 0;

  /* The single credit faucet. Every grant routes through here so the year's
     earnings accumulator counts by construction and no future faucet can
     silently miss it. `cheat` (the dev buttons) and `refund` (migrations,
     failed purchases) skip the accumulator: testers keep their buttons, the
     pacing data stays clean, and a refund was never income. Spending stays a
     plain subtraction — the mint reads earnings, never balance. */
  function credit(amount, opts) {
    const n = Math.max(0, amount || 0);
    state.credits += n;
    if (!opts || (!opts.cheat && !opts.refund)) state.year.coinsEarned += n;
    return n;
  }

  /* ---------------- save / load ---------------- */
  let saveQueued = false;
  function save() {
    if (saveQueued) return;
    saveQueued = true;
    setTimeout(() => {
      saveQueued = false;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
    }, 250);
  }
  function saveNow() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }

  /** True for a save that was written but never actually played. */
  function isPristine(save) {
    if (!save) return true;
    const st = save.stats || {};
    return (
      (save.credits === 100 || save.credits === undefined) &&
      !st.totalTaps && !st.totalHarvests &&
      !(save.decor || []).length &&
      !(save.grid || []).some((c) => c && (c.seed || !c.locked && false))
    );
  }

  /** Decor lost its stat bonuses in schema v3. Refund what each owned copy cost,
      in the currency it was bought with, and strip it down to a cosmetic record. */
  function migrateDecor(fromVersion) {
    const owned = Array.isArray(state.decor) ? state.decor : [];
    if (fromVersion >= 3 || !owned.length) return null;
    const refund = { credits: 0, gems: 0, tickets: 0 };
    let count = 0;
    owned.forEach((d) => {
      const def = DATA.decor.find((x) => x.id === d.id);
      if (!def) return;
      refund[def.currency] += def.cost;
      count += 1;
    });
    state.decor = owned.map((d) => ({ id: d.id }));
    if (!count) return null;
    credit(refund.credits, { refund: true });
    state.gems += refund.gems;
    state.tickets += refund.tickets;
    return { ...refund, count };
  }

  function migrateTickets(parsed) {
    if (Object.prototype.hasOwnProperty.call(parsed, 'boostInv')) return null;
    const tickets = Math.max(0, Math.round(Number(state.tickets) || 0));
    state.tickets = 0;
    if (!tickets) return null;
    const gems = Math.round(tickets / 5);
    state.gems += gems;
    return { tickets, gems };
  }

  /** A save from before the Garden Year enters it mid-flight, exactly once —
      keyed on the missing `year` key, the boostInv pattern. Two rules:
      nobody loses a seed they could already plant (discovered, or passed its
      old level gate, is grandfathered free), and old Bloom Mastery tiers
      convert to a one-time Saved Seeds grant, silently. `coinsEarned` starts
      at zero on purpose: no lifetime coin figure exists anywhere in the save,
      so there is nothing honest to backfill from. Runs after the backfills so
      the counts it reads are the repaired ones. */
  function migrateYear(parsed) {
    if (parsed.year && typeof parsed.year === 'object') return null;
    const lv = levelFromRep(state.rep);
    DATA.seeds.forEach((s, i) => {
      if (i < YEAR().freeSeeds) return;
      if ((state.discovered[s.id] || 0) > 0 || (s.unlockLevel || 1) <= lv) {
        state.seedUnlocks[s.id] = true;
      }
    });
    /* Credit the tiers the recorded counts had already earned before
       converting — an old save stalled mid-ladder gets its honest total. */
    DATA.seeds.forEach((s) => advanceMastery(s.id, false));
    const tiers = DATA.seeds.reduce((n, s) => n + masteryOf(s.id), 0);
    const grant = Math.round((YEAR().masteryConvert || 0) * tiers);
    state.savedSeeds += grant;
    return { grant, tiers, unlocked: Object.keys(state.seedUnlocks).length };
  }

  function load() {
    let raw = localStorage.getItem(SAVE_KEY);
    let migrated = false;
    const legacy = localStorage.getItem(LEGACY_KEY);
    // An untouched Wonder save should never shadow real progress from the old build.
    if (raw && legacy) {
      try {
        if (isPristine(JSON.parse(raw)) && !isPristine(JSON.parse(legacy))) raw = null;
      } catch (e) { raw = null; }
    }
    if (!raw && legacy) { raw = legacy; migrated = true; }
    if (!raw) {
      ensureProgression();
      return { migrated: false, fresh: true };
    }
    try {
      const parsed = JSON.parse(raw);
      Object.assign(state, defaultState(), parsed);
      // fill nested defaults that a legacy save won't have
      const d = defaultState();
      state.tap = Object.assign(d.tap, parsed.tap || {});
      state.stats = Object.assign(d.stats, parsed.stats || {});
      state.wonder = Object.assign(d.wonder, parsed.wonder || {});
      state.prefs = Object.assign(d.prefs, parsed.prefs || {});
      state.seen = Object.assign(d.seen, parsed.seen || {});
      // Merged defaults-first, so a save written before one of these keys
      // existed comes back false and replays onboarding over a garden the
      // player has plainly already used. Backfill from the evidence the save
      // does carry. Any future `seen` flag needs its own line here.
      if (!state.seen.intro && (state.stats.totalTaps || state.stats.totalHarvests)) state.seen.intro = true;
      if (!state.seen.plot && (state.stats.totalHarvests || (parsed.grid || []).some((c) => c && c.seed))) state.seen.plot = true;
      state.apiary = Object.assign(d.apiary, parsed.apiary || {});
      state.quests = Object.assign(d.quests, parsed.quests && typeof parsed.quests === 'object' ? parsed.quests : {});
      if (!Array.isArray(state.quests.active)) state.quests.active = [];
      if (!Array.isArray(state.quests.done)) state.quests.done = [];
      state.quests.daily = Object.assign(
        { id: null, progress: 0, day: '', claimed: false },
        state.quests.daily && typeof state.quests.daily === 'object' ? state.quests.daily : {}
      );
      if (typeof state.rep !== 'number' || !(state.rep >= 0)) state.rep = 0;
      state.boostInv = Object.assign(d.boostInv, parsed.boostInv && typeof parsed.boostInv === 'object' ? parsed.boostInv : {});
      DATA.boosters.forEach((b) => {
        if (typeof state.boostInv[b.id] !== 'number' || state.boostInv[b.id] < 0) state.boostInv[b.id] = 0;
      });
      state.apiary.honey = state.apiary.honey && typeof state.apiary.honey === 'object' ? state.apiary.honey : {};
      state.apiary.wax = Number(state.apiary.wax) || 0;
      state.apiary.shelf = state.apiary.shelf && typeof state.apiary.shelf === 'object' ? state.apiary.shelf : {};
      state.apiary.keepers = Array.isArray(state.apiary.keepers) ? state.apiary.keepers : [];
      /* The board replaced a plain list of hives on 2026-08-25. A save from
         before it carries `hives`; seat each one on a cell in order so nobody
         loses a hive they paid for. Cells are positional, so the array is
         rebuilt to length rather than merged — a short or sparse one indexes to
         `undefined` everywhere downstream. */
      {
        const old = Array.isArray(parsed.apiary && parsed.apiary.hives) ? parsed.apiary.hives : null;
        const src = Array.isArray(state.apiary.cells) ? state.apiary.cells : [];
        const out = Array.from({ length: MEADOW.cells }, (_, i) => {
          const c = src[i];
          if (!c || !c.kind) return null;
          if (c.kind === 'tender') return meadowTender(c.type) ? c : null;
          return { kind: 'hive', at: Number(c.at) || nowSeconds(), jars: Array.isArray(c.jars) ? c.jars : [] };
        });
        if (old && old.length && !out.some(Boolean)) {
          old.slice(0, MEADOW.cells).forEach((h, i) => {
            out[i] = { kind: 'hive', at: Number(h.at) || nowSeconds(), jars: Array.isArray(h.jars) ? h.jars : [] };
          });
        }
        state.apiary.cells = out;
        delete state.apiary.hives;

        /* Locked land is rebuilt to length the same way. A cell that already
           holds something is never re-locked — taking back ground a player has
           built on is the one migration that is always wrong. Empty land from a
           save that predates the gates does go back behind them. */
        const lockSrc = Array.isArray(parsed.apiary && parsed.apiary.locked)
          ? parsed.apiary.locked : null;
        state.apiary.locked = Array.from({ length: MEADOW.cells }, (_, i) => {
          if (out[i]) return false;
          return lockSrc ? !!lockSrc[i] : (MEADOW.cellUnlockLevel[i] || 1) > 1;
        });
      }
      /* A keeper who is no longer a real creature, or is resting, is dropped —
         the getter filters anyway, but a stale id would sit in the save forever. */
      state.apiary.keepers = state.apiary.keepers
        .filter((id, i, a) => critterById(id) && a.indexOf(id) === i)
        .slice(0, MEADOW.keeperSlots);
      state.flowers = parsed.flowers && typeof parsed.flowers === 'object' ? parsed.flowers : {};
      /* The Stand's arrays are fixed-length and indexed by slot, so a save from
         before it existed — or from a build with a different slot count — has to
         be resized rather than merged. An order referencing a good or customer
         that no longer exists is dropped, and the slot simply refills. */
      state.stand = Object.assign(d.stand, parsed.stand && typeof parsed.stand === 'object' ? parsed.stand : {});
      state.stand.slots = Array.from({ length: STAND.slots }, (_, i) => {
        const o = Array.isArray(state.stand.slots) ? state.stand.slots[i] : null;
        if (!o || !goodById(o.good) || !customerById(o.customer) || !Array.isArray(o.needs)) return null;
        o.slot = i;
        return o;
      });
      state.stand.nextAt = Array.from({ length: STAND.slots },
        (_, i) => (Array.isArray(state.stand.nextAt) ? Number(state.stand.nextAt[i]) || 0 : 0));
      state.stand.seq = Number(state.stand.seq) || 0;
      state.craft = Array.isArray(parsed.craft) ? parsed.craft : [];
      state.goods = parsed.goods && typeof parsed.goods === 'object' ? parsed.goods : {};
      /* A count per keepsake, not a boolean, because anything that eventually
         spends or crafts them needs quantities — the same rule the card album
         follows. Unknown ids are dropped so a retired creature cannot leave a
         ghost behind. */
      state.mementos = {};
      {
        const m = parsed.mementos && typeof parsed.mementos === 'object' ? parsed.mementos : {};
        CREATURES.forEach((def) => {
          const n = Math.max(0, Math.floor(Number(m[def.keepsake.id]) || 0));
          if (n > 0) state.mementos[def.keepsake.id] = n;
        });
      }
      state.pairsSeen = (Array.isArray(parsed.pairsSeen) ? parsed.pairsSeen : [])
        .filter((id) => CREATURE_PAIRS.some((p) => p.id === id));
      state.luckyPacks = Math.max(0, Number(parsed.luckyPacks) || 0);
      {
        const c = parsed.critters && typeof parsed.critters === 'object' ? parsed.critters : {};
        state.critters = {};
        CREATURES.forEach((def) => {
          const r = c[def.id];
          if (!r || !r.since) return;
          state.critters[def.id] = {
            since: Number(r.since) || nowSeconds(),
            // `fed` is the keepsake clock — when this creature last handed one
            // over. Food is `fedUntil`, and the two are unrelated despite the
            // names; writing food into `fed` would reset every keepsake timer.
            fed: Number(r.fed) || 0,
            /* ONE fullness clock, clamped to the cap so an edited save cannot
               hold a boost forever.

               Migrating from the two-clock save: `awakeUntil` was always the
               longer of the pair, so the surviving clock takes whichever is
               bigger and the old field is dropped. And absent still means AWAKE
               with the full arrival grant — a save from before any of this must
               not open on a room of creatures the game never warned about,
               which is the same rule `tending` follows. */
            fedUntil: (r.fedUntil === undefined && r.awakeUntil === undefined)
              ? nowSeconds() + ARRIVAL_AWAKE_HOURS * 3600
              : Math.max(0, Math.min(nowSeconds() + FOOD_CAP_HOURS * 3600,
                Math.max(Number(r.fedUntil) || 0, Number(r.awakeUntil) || 0))),
            gifts: Math.max(0, Math.min(def.keepsake.cap, Number(r.gifts) || 0)),
            met: r.met !== false,
            // A save from before stars existed is a creature the player already
            // earned, so it comes back at one star rather than at zero.
            level: Math.max(1, Math.min(CREATURE_STARS, Number(r.level) || 1)),
            // Absent means "written before tending existed", not "switched off".
            // A returning player should find their creature working, not idle
            // with no explanation; the slot trim below caps it either way.
            tending: r.tending === undefined ? true : Boolean(r.tending)
          };
        });
        // A save can carry more tenders than the current level allows — the slot
        // table can shrink in a balance pass, and a save can be edited. Drop the
        // overflow rather than handing out effects the game no longer grants.
        let room = HABITAT_SLOT_LEVELS.filter((lv) => (Number(parsed.level) || 1) >= lv).length;
        CREATURES.forEach((def) => {
          const rec = state.critters[def.id];
          if (!rec || !rec.tending) return;
          if (room > 0) room -= 1; else rec.tending = false;
        });
      }
      // Nested objects are replaced wholesale by the parsed save, so the bench
      // needs its own re-merge or a save written before it existed reads back
      // undefined and every lookup below throws.
      {
        const b = parsed.bench && typeof parsed.bench === 'object' ? parsed.bench : {};
        const size = BENCH.cols * BENCH.cols;
        const cells = Array.isArray(b.cells) ? b.cells.slice(0, size) : [];
        while (cells.length < size) cells.push(null);
        state.bench = {
          cells: cells.map((c) => (c && benchDef(c.tier) ? { tier: c.tier } : null)),
          side: Math.min(BENCH.cols, Math.max(1, Number(b.side) || BENCH.startSide)),
          basket: (Array.isArray(b.basket) ? b.basket : [])
            .filter((t) => benchDef(t)).slice(0, BENCH.basketMax),
          stock: b.stock && typeof b.stock === 'object' ? b.stock : {}
        };
      }
      state.discovered = Object.assign(
        {},
        d.discovered,
        parsed.discovered && typeof parsed.discovered === 'object' ? parsed.discovered : {}
      );
      state.bestRarity = Object.assign(
        {},
        d.bestRarity,
        parsed.bestRarity && typeof parsed.bestRarity === 'object' ? parsed.bestRarity : {}
      );
      state.almanacClaimed = Array.isArray(parsed.almanacClaimed) ? parsed.almanacClaimed.slice() : [];
      state.mastery = Object.assign(
        {},
        d.mastery,
        parsed.mastery && typeof parsed.mastery === 'object' ? parsed.mastery : {}
      );
      state.rarityCounts = Object.assign(
        {},
        d.rarityCounts,
        parsed.rarityCounts && typeof parsed.rarityCounts === 'object' ? parsed.rarityCounts : {}
      );
      const decorRefund = migrateDecor(parsed.version || 1);
      const ticketGrant = migrateTickets(parsed);
      state.version = 4;
      lastAutoHarvest = 0;

      if (typeof state.upgrades.plot1Gardener === 'number') {
        state.upgrades.plot1Harvester = state.upgrades.plot1Harvester || state.upgrades.plot1Gardener;
        delete state.upgrades.plot1Gardener;
      }
      // state.upgrades is replaced wholesale by the parsed save above, so every
      // key the game expects has to be restored here or it reads back undefined
      // and upgradePrice() yields NaN. Derived from defaultState() rather than
      // hand-listed: the old list had drifted and was missing every badge that
      // shipped in v1 (tapPower, critChance, critMult, comboMeter,
      // plotExpansion, autoWater, autoHarvest), and a new badge needed a line
      // here that was easy to forget. Declaring it in defaultState() is now
      // enough — offlineRate and offlineHours are covered without a line here.
      Object.keys(d.upgrades).forEach((key) => {
        if (typeof state.upgrades[key] !== 'number') state.upgrades[key] = 0;
      });

      /* Nested objects are replaced wholesale by load(), so these need their own re-merge. */
      if (!state.cards || typeof state.cards !== 'object') state.cards = {};
      if (typeof state.packs !== 'number') state.packs = 0;
      if (!Array.isArray(state.setsClaimed)) state.setsClaimed = [];

      /* The Garden Year's nested state, each field rebuilt defensively —
         a save from before the Year has none of it and comes back on the
         defaults, then migrateYear() below grandfathers what it had earned. */
      {
        const y = parsed.year && typeof parsed.year === 'object' ? parsed.year : {};
        const ys = y.stats && typeof y.stats === 'object' ? y.stats : {};
        const count = (v) => Math.max(0, Math.round(Number(v) || 0));
        const speciesSeen = {};
        if (ys.speciesSeen && typeof ys.speciesSeen === 'object') {
          DATA.seeds.forEach((s) => { if (ys.speciesSeen[s.id]) speciesSeen[s.id] = true; });
        }
        state.year = {
          number: Math.max(1, count(y.number) || 1),
          coinsEarned: Math.max(0, Number(y.coinsEarned) || 0),
          turnsCompleted: count(y.turnsCompleted),
          stats: {
            orders: count(ys.orders),
            windfalls: count(ys.windfalls),
            species: Object.keys(speciesSeen).length,
            speciesSeen,
            legendaries: count(ys.legendaries),
            bestCombo: count(ys.bestCombo)
          }
        };
        state.savedSeeds = Math.max(0, Number(parsed.savedSeeds) || 0);
        state.petals = {};
        const pp = parsed.petals && typeof parsed.petals === 'object' ? parsed.petals : {};
        DATA.seeds.forEach((s) => {
          const r = pp[s.id];
          if (!r || typeof r !== 'object') return;
          const rec = {
            rich: Math.min(DATA.petals.shared.rich.cap, count(r.rich)),
            quick: Math.min(DATA.petals.shared.quick.cap, count(r.quick)),
            sig: count(r.sig)
          };
          if (rec.rich || rec.quick || rec.sig) state.petals[s.id] = rec;
        });
        state.seedUnlocks = {};
        const su = parsed.seedUnlocks && typeof parsed.seedUnlocks === 'object' ? parsed.seedUnlocks : {};
        DATA.seeds.forEach((s) => { if (su[s.id]) state.seedUnlocks[s.id] = true; });
        state.blessed = (Array.isArray(parsed.blessed) ? parsed.blessed : [])
          .filter((b) => b && DATA.seeds.some((s) => s.id === b.seed))
          .map((b) => ({ seed: b.seed, year: Math.max(1, count(b.year) || 1) }));
        /* Fall's grid is positional, so it is rebuilt to length like every
           positional array in this save. A plant id that no longer exists is
           dropped; a second Century Bloom (an edited save) is dropped too. */
        const f = parsed.fall && typeof parsed.fall === 'object' ? parsed.fall : {};
        const fg = Array.isArray(f.grid) ? f.grid : [];
        let centuries = 0;
        state.fall = {
          grid: Array.from({ length: DATA.fall.plots }, (_, i) => {
            const c = fg[i];
            const def = c && c.seed ? DATA.fall.plants.find((p) => p.id === c.seed) : null;
            if (!def) return { seed: null, plantedAt: 0, grow: 0, ready: false, windfall: false };
            if (def.century && ++centuries > 1) {
              return { seed: null, plantedAt: 0, grow: 0, ready: false, windfall: false };
            }
            return {
              seed: def.id,
              plantedAt: Number(c.plantedAt) || 0,
              grow: Number(c.grow) > 0 ? Number(c.grow) : def.grow,
              ready: false,
              windfall: Boolean(c.windfall)
            };
          }),
          bedPaid: Boolean(f.bedPaid)
        };
      }

      const now = nowSeconds();
      state.grid.forEach((cell) => {
        if (!cell) return;
        if (typeof cell.luckyBug !== 'boolean') cell.luckyBug = false;
        if (typeof cell.mutation === 'undefined') cell.mutation = null;
        if (typeof cell.mutateAt !== 'number') cell.mutateAt = 0;
        if (typeof cell.packDrop !== 'boolean') cell.packDrop = false;
        if (!cell.seed) { cell.plantedAt = 0; cell.ready = false; return; }
        if (typeof cell.grow !== 'number' || cell.grow <= 0) cell.grow = 1;
        if (typeof cell.plantedAt !== 'number' || cell.plantedAt <= 0 || cell.plantedAt < 1e8) {
          cell.plantedAt = now - cell.grow;
        } else if (cell.plantedAt > now + 1e5) {
          cell.plantedAt = now;
        }
      });
      /* Fall's clocks get the main grid's sanitisation rules: a pre-epoch
         timestamp reads as elapsed-seconds corruption and ripens now, a
         future one is a clock change and clamps. */
      state.fall.grid.forEach((cell) => {
        if (!cell.seed) return;
        if (typeof cell.grow !== 'number' || cell.grow <= 0) cell.grow = 1;
        if (typeof cell.plantedAt !== 'number' || cell.plantedAt <= 0 || cell.plantedAt < 1e8) {
          cell.plantedAt = now - cell.grow;
        } else if (cell.plantedAt > now + 1e5) {
          cell.plantedAt = now;
        }
      });
      let progressionGrant = null;
      if (!Object.prototype.hasOwnProperty.call(parsed, 'rep')) {
        progressionGrant = migrateProgression();
      }
      ensureProgression();
      backfillDiscovered();
      const almanacGrant = grantAlmanacMilestones();
      // Silent by design: a backfilled record has no moment to celebrate.
      const masteryBackfill = backfillMastery();
      // After the backfills, which give a legacy save the honest counts the
      // grandfather rules and the mastery conversion read.
      const yearGrant = migrateYear(parsed);
      if (migrated || decorRefund || progressionGrant || ticketGrant
        || almanacGrant.paid.length || masteryBackfill.changed || yearGrant) saveNow();
      return {
        migrated, fresh: false, decorRefund, progressionGrant, ticketGrant,
        almanacGrant: almanacGrant.paid.length ? almanacGrant : null,
        yearGrant
      };
    } catch (err) {
      console.warn('Save load failed', err);
      return { migrated: false, fresh: true };
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    // Without this the next load() re-imports the old Idle Garden Reborn save
    // and the player who asked for a clean start gets their old progress back.
    localStorage.removeItem(LEGACY_KEY);
    Object.assign(state, defaultState());
    lastAutoHarvest = 0;
    ensureProgression();
    emit('grid');
    emit('panels');
    emit('currency');
  }

  /* ---------------- lookups ---------------- */
  const seedById = (id) => DATA.seeds.find((s) => s.id === id);
  const activeBoost = (id) => Boolean(state.boosters[id]) && state.boosters[id] > nowSeconds();

  function boostVal(key) {
    let v = 0;
    for (const b of DATA.boosters) if (activeBoost(b.id) && b.effects[key]) v += b.effects[key];
    return v;
  }

  function growModifier() {
    const bonus = boostVal('growSpeed') + state.upgrades.autoWater * 0.01;
    return Math.max(0.3, 1 - bonus);
  }

  const plotUnlockCost = (idx) => 400 + 300 * (idx + 1);
  const upgradePrice = (key) =>
    Math.round(DATA.upgrades[key].base * Math.pow(DATA.upgrades[key].scale, state.upgrades[key]));

  function rollRarity(extra) {
    const pool = DATA.rarity.map((r, i) => ({ ...r, w: i > 0 ? r.w * (1 + extra) : r.w }));
    const tot = pool.reduce((a, b) => a + b.w, 0);
    let t = Math.random() * tot;
    for (const r of pool) { t -= r.w; if (t <= 0) return r; }
    return pool[0];
  }

  /* ---------------- verbs and adjacency ---------------- */

  /* The eight plots ring the flower in a 3x3 with the centre occupied:
       0 1 2
       3 . 4
       5 6 7
     Sharing an edge therefore makes one closed loop, 0-1-2-4-7-6-5-3-0, and every plot has
     exactly two neighbours. That symmetry is why verbs need no per-plot balancing. */
  const PLOT_NEIGHBOURS = [[1, 3], [0, 2], [1, 4], [0, 5], [2, 7], [3, 6], [5, 7], [6, 4]];

  const VT = () => DATA.verbTuning;

  /** Unlocked neighbours of a plot. Locked plots are not part of the garden yet. */
  function neighboursOf(idx) {
    const list = PLOT_NEIGHBOURS[idx] || [];
    return list.filter((n) => state.grid[n] && !state.grid[n].locked);
  }

  /** The verb of whatever is growing in a plot, or null. Empty plots have no verb. */
  function verbAt(idx) {
    const cell = state.grid[idx];
    if (!cell || cell.locked || !cell.seed) return null;
    const sdef = seedById(cell.seed);
    return sdef && sdef.verb ? sdef.verb : null;
  }

  /** How many neighbours of a plot are currently growing a given verb. */
  function neighbourVerbs(idx, verbId) {
    return neighboursOf(idx).reduce((n, i) => n + (verbAt(i) === verbId ? 1 : 0), 0);
  }

  /** Neighbours holding anything at all — Deeproot's density read. */
  function plantedNeighbours(idx) {
    return neighboursOf(idx).reduce((n, i) => n + (state.grid[i].seed ? 1 : 0), 0);
  }

  /** Growth multiplier contributed by adjacent Keepers, baked in at plant time. */
  function keeperModifier(idx) {
    return Math.max(0.3, 1 - neighbourVerbs(idx, 'keeper') * VT().keeperGrowth);
  }

  /** Payout multiplier contributed by tending creatures. Kept apart from
      verbPayoutMult so a creature and a verb never get mistaken for each other in
      a balance pass, and so the yield pool stays countable in one place. */
  function critterPayoutMult() {
    return isNight() ? 1 + critterTrait('nightYield') : 1;
  }

  /** Payout multiplier a plot earns from its own verb and its neighbours'. */
  function verbPayoutMult(idx) {
    const t = VT();
    let m = 1 + neighbourVerbs(idx, 'nurse') * t.nurseGive;
    const own = verbAt(idx);
    if (own === 'nurse') m *= (1 - t.nurseCost);
    if (own === 'deeproot') m *= 1 + plantedNeighbours(idx) * t.deeprootPerNeighbour;
    /* Read at harvest, not at planting — the decision Nightbell creates is *when to pick it*,
       which only means something if the clock is checked at the moment you pick. */
    if (own === 'nightbell') m *= isNight() ? t.nightbellNight : t.nightbellDay;
    return m;
  }

  /* ---------------- weather and mutations ---------------- */

  /* Weather is a pure function of wall-clock time. Nothing is stored and nothing schedules it, so
     every player sees the same sky at the same moment and any past slot stays computable — which
     is what lets time away be reconciled later. */
  const weatherSlotOf = (seconds) => Math.floor(seconds / DATA.weather.slotSeconds);

  /** Deterministic [0,1) from a slot number. Math.imul keeps this exact in 32-bit. */
  function slotNoise(slot) {
    let h = Math.imul(slot | 0, 2654435761);
    h ^= h >>> 15;
    h = Math.imul(h, 2246822519);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489917);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function weatherForSlot(slot) {
    const types = DATA.weather.types;
    const total = types.reduce((a, t) => a + t.w, 0);
    let t = slotNoise(slot) * total;
    for (const w of types) { t -= w.w; if (t <= 0) return w; }
    return types[0];
  }

  const weatherAt = (seconds) => {
    const call = state.weatherCall;
    if (call && call.id && seconds >= call.from && seconds < call.until) {
      const t = DATA.weather.types.find((w) => w.id === call.id);
      if (t) return t;
    }
    if (dev.weather) {
      const forced = DATA.weather.types.find((t) => t.id === dev.weather);
      if (forced) return forced;
    }
    return weatherForSlot(weatherSlotOf(seconds));
  };
  const currentWeather = () => weatherAt(nowSeconds());

  /* The day cycle keys to epoch time for the same reason weather does: a phase derived from page
     boot restarts on every reload, so "is it night" could never mean anything the simulation could
     act on. Same 6-minute cycle, now shared and answerable. */
  const dayPhase = (seconds) => (((seconds === undefined ? nowSeconds() : seconds) / DAY.cycle) + DAY.offset) % 1;
  const isNight = (seconds) => {
    const t = dayPhase(seconds);
    return t < DAY.dawn || t >= DAY.dusk;
  };

  /** Nightbloom. A mutation caught after dark may come in one tier higher — a coin
      flip rather than a certainty, because Dewkissed to Gilded is a 5x jump on that
      harvest. Capped below the top tier: the game's biggest moment should be found,
      never engineered, which is the same principle that keeps Wonderfall unpriced. */
  function nightbloomUpgrade(id) {
    if (!id || !pairActive('nightbloom') || !isNight()) return id;
    if (Math.random() >= PAIR_TUNING.nightbloomChance) return id;
    const rank = mutationRank(id);
    if (rank >= PAIR_TUNING.nightbloomCap) return id;
    const next = Object.keys(DATA.mutations).find((k) => DATA.mutations[k].rank === rank + 1);
    return next || id;
  }

  const mutationDef = (id) => (id ? DATA.mutations[id] : null) || null;
  const mutationRank = (id) => (mutationDef(id) ? mutationDef(id).rank : 0);
  const mutationMult = (id) => (mutationDef(id) ? mutationDef(id).mult : 1);

  /** Adjacent Beacons make a plot more likely to catch. Stacking raises the chance, never the
      payout, so the income share stays computable however much agency is added later. */
  /* The one place both mutation roll paths go through, so a creature tending the
     garden lifts the catch chance everywhere without a second consumer to keep
     in sync. Raises the CHANCE and never the payout — the income share stays
     computable, per docs/18-mutations-and-weather.md. */
  function catchMultiplier(idx) {
    return 1 + neighbourVerbs(idx, 'beacon') * VT().beaconCatchBonus
      + critterTrait('mutationLuck');
  }

  /* Every plant gets exactly ONE mutation roll, at a moment chosen when it is sown, against the
     weather standing at that moment. One roll per cycle rather than one per slot lived through:
     rolling per slot made exposure proportional to grow time, which measured out at a 65x spread
     between an Eternal Crown and a Daisy — dominant late and invisible early. A slow seed is
     already rewarded, because the same multiplier lands on a far bigger yield. */
  const mutationMoment = (plantedAt, grow) => plantedAt + Math.random() * grow;

  /** Roll any plant whose moment has arrived. Returns what caught, for the UI to celebrate. */
  function rollMutations() {
    const now = nowSeconds();
    const caught = [];
    state.grid.forEach((cell, idx) => {
      if (cell.locked || !cell.seed || !cell.mutateAt || now < cell.mutateAt) return;
      const w = weatherAt(cell.mutateAt);
      cell.mutateAt = 0;
      if (!w.mutation) return;
      if (Math.random() >= w.catch * catchMultiplier(idx)) return;
      cell.mutation = nightbloomUpgrade(w.mutation);
      caught.push({
        idx, mutation: cell.mutation, weather: w, seed: seedById(cell.seed),
        upgraded: cell.mutation !== w.mutation
      });
    });
    return caught;
  }

  let lastWeatherSlot = null;

  function processWeather() {
    const slot = weatherSlotOf(nowSeconds());
    if (lastWeatherSlot !== slot) {
      const first = lastWeatherSlot === null;
      lastWeatherSlot = slot;
      if (!first) emit('weather', { weather: weatherForSlot(slot) });
    }
    const caught = rollMutations();
    state.lastSeen = nowSeconds();
    if (caught.length) {
      save();
      emit('mutate', { caught });
    }
  }

  /* Below this, a reload is just a reload and the player is told nothing. */
  const WELCOME_MIN_AWAY = 120;

  /* Derived from the rarity table rather than hardcoded, so retuning rarity carries through to
     offline income automatically. Currently 1.58. */
  const OFFLINE_RATE_MAX = Math.ceil(
    (DATA.offline.maxRate - DATA.offline.baseRate) / DATA.offline.ratePerLevel
  );
  const OFFLINE_HOURS_MAX = Math.ceil(
    (DATA.offline.maxHours - DATA.offline.baseHours) / DATA.offline.hoursPerLevel
  );

  const EXPECTED_RARITY_MULT = (() => {
    const total = DATA.rarity.reduce((a, r) => a + r.w, 0);
    return DATA.rarity.reduce((a, r) => a + (r.w / total) * r.m, 0);
  })();

  /* Proportional to grow time, so gems accrue with time in the ground rather than with harvest
     count — a Daisy cycles 65x faster than an Eternal Crown and used to out-farm it for gems. */
  function gemChanceFor(seed) {
    if (!seed) return 0;
    if (typeof seed.gemChance === 'number') return seed.gemChance;
    return Math.min(DATA.gemChanceMax, seed.grow * DATA.gemChancePerGrowSecond);
  }

  const weatherCallPrice = (id) => DATA.weatherCall.prices[id] || 0;
  const weatherCallable = (id) => Object.prototype.hasOwnProperty.call(DATA.weatherCall.prices, id);
  const weatherCallActive = () => {
    const c = state.weatherCall;
    return c && c.id && nowSeconds() < c.until ? c : null;
  };

  /* Buying a sky does two things: it holds that weather for a few minutes, and it pulls every
     unspent mutation roll in the ground into the window. Without the second part the purchase is
     mostly a no-op, because a roll is a single instant and most of them fall outside four minutes.
     Only the common skies are callable — the rare ones stay unbuyable on purpose. */
  function callWeather(id) {
    if (!weatherCallable(id)) return null;
    if (weatherCallActive()) return null;
    const price = weatherCallPrice(id);
    if (state.gems < price) return null;
    state.gems -= price;
    const from = nowSeconds();
    const until = from + DATA.weatherCall.minutes * 60
      * (pairActive('lanternrain') ? PAIR_TUNING.lanternRainMult : 1);
    state.weatherCall = { id, from, until };
    let pulled = 0;
    state.grid.forEach((cell) => {
      if (cell.locked || !cell.seed || !cell.mutateAt) return;
      cell.mutateAt = from + Math.random() * (until - from);
      pulled += 1;
    });
    save();
    emit('currency');
    emit('weather', { weather: currentWeather() });
    emit('panels');
    return { id, until, pulled, price };
  }

  const skipCost = (idx) => {
    const cell = state.grid[idx];
    if (!cell || cell.locked || !cell.seed) return 0;
    const remain = Math.max(0, cell.grow - (nowSeconds() - cell.plantedAt));
    if (remain <= 0) return 0;
    return Math.max(1, Math.ceil(remain / DATA.skipSecondsPerGem));
  };

  /* A skip buys time and nothing else. The roll still resolves against the weather standing at the
     moment it was originally scheduled for — computable because weather is deterministic — so
     hurrying a plant can neither gain nor lose you a mutation. */
  function skipGrow(idx) {
    const cell = state.grid[idx];
    const cost = skipCost(idx);
    if (!cost || state.gems < cost) return null;
    state.gems -= cost;
    if (cell.mutateAt) {
      const w = weatherAt(cell.mutateAt);
      cell.mutateAt = 0;
      if (w.mutation && Math.random() < w.catch * catchMultiplier(idx)) {
        cell.mutation = nightbloomUpgrade(w.mutation);
        emit('mutate', {
          caught: [{
            idx, mutation: cell.mutation, weather: w, seed: seedById(cell.seed),
            upgraded: cell.mutation !== w.mutation
          }]
        });
      }
    }
    /* Backdate the planting rather than shrinking the grow time: a plant skipped the instant it
       went in has zero elapsed seconds, and any positive grow left it permanently one tick short
       of ripe. This also keeps `grow` intact so the progress bar still reads full. */
    cell.plantedAt = nowSeconds() - cell.grow;
    save();
    emit('currency');
    return { idx, cost };
  }

  const offlineRate = () => Math.min(
    DATA.offline.maxRate,
    (DATA.offline.baseRate + state.upgrades.offlineRate * DATA.offline.ratePerLevel)
      * (1 + critterTrait('offlineRate'))
  );
  const offlineHours = () => Math.min(
    DATA.offline.maxHours + (pairActive('longwatch') ? PAIR_TUNING.longWatchHours : 0),
    DATA.offline.baseHours + state.upgrades.offlineHours * DATA.offline.hoursPerLevel
      + (pairActive('longwatch') ? PAIR_TUNING.longWatchHours : 0)
  );

  /* What the garden actually produces on its own, in coins per second.
     A plot counts only if it has an auto-planter, and only if the drone exists to pick it —
     an unautomated garden earns nothing while away, which is honest and makes automation matter.
     The drone's cadence caps the total, because it can only lift one plot at a time. */
  function passiveIncomeRate() {
    const droneLevel = state.upgrades.autoHarvest;
    if (!droneLevel) return 0;
    const droneCapacity = 1 / Math.max(0.7, 3 - droneLevel * 0.5);

    const yieldBonus = (1 + boostVal('globalCredits')) * (1 + pollination());
    let cycles = 0;
    let weightedNet = 0;
    PLOT_AUTOPLANTERS.forEach(({ key, idx }) => {
      const level = state.upgrades[key];
      const cell = state.grid[idx];
      if (!level || !cell || cell.locked) return;
      const maxSeedIndex = Math.min(level - 1, highestUnlockedSeedIndex(), DATA.seeds.length - 1);
      if (maxSeedIndex < 0) return;
      const seed = DATA.seeds[maxSeedIndex];
      const grow = plantGrowth(seed, idx);
      if (grow <= 0) return;
      const gross = seed.yield * EXPECTED_RARITY_MULT * yieldBonus
        * petalMult(seed.id) * verbPayoutMult(idx);
      const perCycle = Math.max(0, gross - seed.cost);
      const rate = 1 / grow;
      cycles += rate;
      weightedNet += rate * perCycle;
    });
    if (cycles <= 0) return 0;
    const avgNet = weightedNet / cycles;
    return Math.min(cycles, droneCapacity) * avgNet;
  }

  /* Full rate up to the cap, then a deliberate trickle rather than nothing. A hard zero reads as
     punishment; a trickle reads as a rule, and it is the cap that gives returning a point. */
  function offlineEarnings(seconds) {
    const rate = passiveIncomeRate();
    if (rate <= 0 || seconds <= 0) return { coins: 0, capped: false, paidSeconds: 0, rate };
    const capSeconds = offlineHours() * 3600;
    const full = Math.min(seconds, capSeconds);
    const over = Math.max(0, seconds - capSeconds);
    const coins = Math.floor(rate * offlineRate() * (full + over * DATA.offline.trickle));
    return { coins, capped: over > 0, paidSeconds: full, overSeconds: over, rate };
  }

  /* Reconcile time away and report what happened, for the welcome-back scene.
     Mutations need no catch-up pass: rollMutations() evaluates each plant against the weather at
     its own scheduled moment, so a roll that came due while the tab was shut resolves against the
     sky that was actually standing then, not the one standing now. */
  function reconcile() {
    const now = nowSeconds();
    const since = state.lastSeen || 0;
    const away = since ? Math.max(0, now - since) : 0;

    const caught = rollMutations();
    const ripe = [];
    state.grid.forEach((cell, idx) => {
      if (cell.locked || !cell.seed) return;
      if (now - cell.plantedAt >= cell.grow) ripe.push(idx);
    });
    const jars = jarsWaiting();

    const earned = away >= WELCOME_MIN_AWAY ? offlineEarnings(away) : { coins: 0, capped: false };
    if (earned.coins > 0) {
      credit(earned.coins);
      emit('currency');
    }

    state.lastSeen = now;
    if (caught.length || earned.coins > 0) save();

    if (away < WELCOME_MIN_AWAY) return null;
    if (!ripe.length && !caught.length && !jars && !earned.coins) return null;
    return {
      away, caught, ripened: ripe.length, jars, weather: currentWeather(),
      earned: earned.coins, capped: earned.capped,
      capHours: offlineHours(), rate: offlineRate()
    };
  }

  /* ---------------- the card album ---------------- */

  const CARD_INDEX = (() => {
    const map = {};
    ALBUM.sets.forEach((set) => set.cards.forEach((card) => { map[card.id] = { card, set }; }));
    return map;
  })();

  const cardById = (id) => (CARD_INDEX[id] ? CARD_INDEX[id].card : null);
  const setOfCard = (id) => (CARD_INDEX[id] ? CARD_INDEX[id].set : null);
  const rarityDef = (key) => CARD_RARITIES.find((r) => r.key === key) || CARD_RARITIES[0];

  /* Cards are owned *instances*, not booleans — duplicates have to be representable for a dust
     sink or any future gifting to exist at all. `state.cards[id]` is a count. */
  const cardCount = (id) => state.cards[id] || 0;
  const hasCard = (id) => cardCount(id) > 0;
  const setOwned = (setId) => {
    const set = ALBUM.sets.find((x) => x.id === setId);
    return set ? set.cards.reduce((n, c) => n + (hasCard(c.id) ? 1 : 0), 0) : 0;
  };
  const setComplete = (setId) => setOwned(setId) === 9;
  const albumOwned = () => ALBUM.sets.reduce((n, s) => n + setOwned(s.id), 0);
  const albumTotal = () => ALBUM.sets.length * 9;

  /* Weighted by rarity, then biased toward cards the player is missing — an album that keeps
     handing back duplicates nobody can yet spend is the fastest way to make collecting a chore. */
  const RARITY_FLOOR = 'rare';

  function drawCard(floor) {
    const min = floor ? CARD_RARITIES.findIndex((r) => r.key === floor) : 0;
    const pool0 = min > 0 ? CARD_RARITIES.slice(min) : CARD_RARITIES;
    const total = pool0.reduce((a, r) => a + r.w, 0);
    let t = Math.random() * total;
    let rarity = pool0[0];
    for (const r of pool0) { t -= r.w; if (t <= 0) { rarity = r; break; } }
    const pool = [];
    ALBUM.sets.forEach((set) => set.cards.forEach((c) => { if (c.rarity === rarity.key) pool.push(c); }));
    if (!pool.length) return null;
    const missing = pool.filter((c) => !hasCard(c.id));
    const from = missing.length ? missing : pool;
    return from[Math.floor(Math.random() * from.length)];
  }

  /** Open a pack. Returns what came out, each marked new or duplicate. */
  function openPack() {
    if (state.packs <= 0) return null;
    state.packs -= 1;
    // A pack the fox found after dark spends one banked rarity floor on its first
    // card. Banked rather than tagged, because packs are a count, not instances.
    const lucky = state.luckyPacks > 0;
    if (lucky) state.luckyPacks -= 1;
    const drawn = [];
    const completedSets = [];
    for (let i = 0; i < ALBUM.packSize; i += 1) {
      const card = drawCard(lucky && i === 0 ? RARITY_FLOOR : null);
      if (!card) continue;
      const set = setOfCard(card.id);
      const wasComplete = setComplete(set.id);
      const isNew = !hasCard(card.id);
      state.cards[card.id] = cardCount(card.id) + 1;
      if (isNew && !wasComplete && setComplete(set.id)) completedSets.push(set.id);
      drawn.push({ card, set, isNew, copies: cardCount(card.id) });
    }
    completedSets.forEach((id) => {
      if (state.setsClaimed.indexOf(id) === -1) state.setsClaimed.push(id);
    });
    save();
    emit('panels');
    return { drawn, completedSets, packsLeft: state.packs };
  }

  function grantPacks(n) {
    const add = Math.max(0, Math.floor(n));
    if (!add) return 0;
    state.packs += add;
    save();
    emit('panels');
    emit('packs', { granted: add, total: state.packs });
    return state.packs;
  }

  /* ---------------- reputation, levels, quests ---------------- */
  const RARITY_RANK = { common: 0, rare: 1, epic: 2, legend: 3 };

  function repToNext(level) {
    return 10 + 5 * (level - 1);
  }
  function cumulativeRep(level) {
    if (level <= 1) return 0;
    const n = level - 1;
    return 10 * n + 5 * n * (n - 1) / 2;
  }
  function levelFromRep(rep) {
    let level = 1;
    let need = 0;
    const r = Math.max(0, Number(rep) || 0);
    while (level < 1000) {
      const step = repToNext(level);
      if (r < need + step) return level;
      need += step;
      level += 1;
    }
    return level;
  }
  function repIntoLevel(rep) {
    const lv = levelFromRep(rep);
    return Math.max(0, (Number(rep) || 0) - cumulativeRep(lv));
  }

  /* Kept for migrations and the seed picker's interim label. Retired as a
     gate since the Garden Year: levels stop gating seeds, one-time unlock
     prices gate them instead — see seedUnlocked() below. */
  function seedUnlockLevel(id) {
    const s = typeof id === 'string' ? seedById(id) : id;
    return (s && s.unlockLevel) || 1;
  }

  /* ---------------- seed unlocks — where the spread lives ----------------

     Each seed from #3 up carries a one-time gold unlock price, permanent
     across Turns. This is the wall the whole prestige loop is timed against:
     per-plant spreads cannot wall while yield = 1.4x cost holds, so the
     spread lives here. Skipping ahead is allowed — the sim showed it is
     strictly dominated, so the sequence needs no enforcement. */
  const YEAR = () => DATA.year;
  const seedIndexOf = (id) => DATA.seeds.findIndex((s) => s.id === id);

  function seedUnlockPrice(id) {
    const i = seedIndexOf(id);
    if (i < YEAR().freeSeeds) return 0;
    return Math.round(YEAR().unlockBase * Math.pow(YEAR().unlockRatio, i - YEAR().freeSeeds));
  }
  function seedUnlocked(id) {
    const i = seedIndexOf(id);
    if (i < 0) return false;
    if (i < YEAR().freeSeeds) return true;
    return state.seedUnlocks[id] === true;
  }
  function unlockSeed(id) {
    if (seedIndexOf(id) < 0 || seedUnlocked(id)) return false;
    const price = seedUnlockPrice(id);
    if (state.credits < price) {
      emit('deny', { reason: 'credits', need: price });
      return false;
    }
    state.credits -= price;
    state.seedUnlocks[id] = true;
    save();
    emit('currency');
    emit('seedUnlock', { id, price });
    emit('panels');
    return true;
  }
  function highestUnlockedSeedIndex() {
    let max = -1;
    DATA.seeds.forEach((s, i) => { if (seedUnlocked(s.id)) max = i; });
    return max;
  }

  function plotUnlockLevel(idx) {
    const table = DATA.plotUnlockLevel || [];
    return table[idx] || 1;
  }
  /* Plots 5–8 also wait for the first Turn, so year one is played on four
     plots and Turn 1's gift is Fall AND a bigger garden. Owned plots are
     never re-locked by this — the gate only refuses a purchase. */
  function plotAvailable(idx) {
    if (plotUnlockLevel(idx) > 1 && state.year.turnsCompleted < YEAR().plotTurnGate) return false;
    return levelFromRep(state.rep) >= plotUnlockLevel(idx);
  }

  /* ---------------- flower mastery — petals ----------------

     Saved Seeds buy petals on a flower's Almanac card. Two shared skills on
     every flower (Rich Bloom, Quick Sprout), a signature slot that ships with
     slice B. Effects apply as a multiplier off the yield curve, the
     masteryMult pattern — seed.yield is never edited, and there is no gem
     skill and never will be. */
  const PETALS = () => DATA.petals;

  function petalsOf(id) {
    const p = state.petals[id];
    return {
      rich: (p && p.rich) || 0,
      quick: (p && p.quick) || 0,
      sig: (p && p.sig) || 0
    };
  }

  /** Price of the NEXT petal of a skill on a flower. */
  function petalCost(id, skill) {
    const i = seedIndexOf(id);
    if (i < 0) return 0;
    const owned = petalsOf(id)[skill] || 0;
    return Math.round(
      PETALS().base
      * Math.pow(PETALS().seedRatio, i)
      * Math.pow(PETALS().petalRatio, owned)
      * (skill === 'sig' ? PETALS().signatureMult : 1)
    );
  }

  function buyPetal(id, skill) {
    /* Signatures arrive with slice B — nothing to buy on that track yet. */
    if (skill !== 'rich' && skill !== 'quick') return false;
    if (seedIndexOf(id) < 0) return false;
    if (petalsOf(id)[skill] >= PETALS().shared[skill].cap) return false;
    const cost = petalCost(id, skill);
    if (state.savedSeeds < cost) {
      emit('deny', { reason: 'seeds', need: cost });
      return false;
    }
    state.savedSeeds -= cost;
    if (!state.petals[id]) state.petals[id] = { rich: 0, quick: 0, sig: 0 };
    state.petals[id][skill] += 1;
    save();
    emit('currency');
    emit('petal', { id, skill, count: state.petals[id][skill], cost });
    emit('panels');
    return true;
  }

  /** Rich Bloom: applied at harvest and in passiveIncomeRate(), same commit. */
  const petalMult = (id) => 1 + petalsOf(id).rich * PETALS().shared.rich.value;
  /** Quick Sprout: baked in at plant time, like every growth bonus. */
  const petalGrowMult = (id) => Math.max(0, 1 - petalsOf(id).quick * PETALS().shared.quick.value);

  /* The whole growth stack in one place — sprinklers and boosts, Keepers,
     Quick Sprout — clamped so the combined modifier can never fall through
     the 0.3 floor however the pieces are tuned. Both the planting path and
     passiveIncomeRate() read this, so offline always mirrors online. */
  function plantGrowth(seedDef, idx) {
    return seedDef.grow
      * Math.max(0.3, growModifier() * keeperModifier(idx) * petalGrowMult(seedDef.id));
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function questById(id) {
    return DATA.quests.find((q) => q.id === id) || DATA.dailies.find((q) => q.id === id) || null;
  }

  /* A quest whose feature is not finished. It keeps its definition — so a save
     that already completed it still resolves the id, and its tuning survives —
     but it is never handed out and never occupies an active slot. See the note
     over DATA.quests for which ones are benched and why. */
  function questPaused(def) {
    return !!(def && def.paused);
  }

  function rollDaily(excludeId) {
    const pool = DATA.dailies.filter((q) => q.id !== excludeId && !questPaused(q));
    const back = DATA.dailies.filter((q) => !questPaused(q));
    const use = pool.length ? pool : (back.length ? back : DATA.dailies);
    const pick = use[Math.floor(Math.random() * use.length)];
    state.quests.daily = { id: pick.id, progress: 0, day: todayKey(), claimed: false };
  }
  function refreshDaily() {
    const day = todayKey();
    const cur = state.quests.daily;
    if (cur && cur.id && cur.day === day) return;
    rollDaily(cur && cur.id);
  }
  function fillActive() {
    const done = new Set(state.quests.done);
    const have = new Set(state.quests.active.map((q) => q.id));
    DATA.quests.forEach((def) => {
      if (state.quests.active.length >= 3) return;
      if (questPaused(def)) return;
      if (done.has(def.id) || have.has(def.id)) return;
      if (def.after && !done.has(def.after)) return;
      state.quests.active.push({ id: def.id, progress: 0 });
      have.add(def.id);
    });
  }
  function ensureProgression() {
    if (!state.quests || typeof state.quests !== 'object') {
      state.quests = { active: [], done: [], daily: { id: null, progress: 0, day: '', claimed: false } };
    }
    if (!Array.isArray(state.quests.active)) state.quests.active = [];
    if (!Array.isArray(state.quests.done)) state.quests.done = [];
    if (!state.quests.daily || typeof state.quests.daily !== 'object') {
      state.quests.daily = { id: null, progress: 0, day: '', claimed: false };
    }
    if (typeof state.rep !== 'number' || !(state.rep >= 0)) state.rep = 0;
    // Drop instances whose definition no longer exists, and instances of a quest
    // that has since been paused. Either one can never be claimed, so it holds
    // one of the three slots forever and jams stripQuest(), which always shows
    // active[0] — that is what stranded players on 'Merge a Posy'.
    state.quests.active = state.quests.active.filter((q) => {
      const def = q && questById(q.id);
      return !!def && !questPaused(def);
    });
    const daily = state.quests.daily;
    const ddef = daily.id ? questById(daily.id) : null;
    if (daily.id && !daily.claimed && (!ddef || questPaused(ddef))) daily.id = null; // forces a reroll below
    state.level = levelFromRep(state.rep);
    refreshDaily();
    fillActive();
  }

  function migrateProgression() {
    let best = 1;
    const consider = (id) => {
      const lv = seedUnlockLevel(id);
      if (lv > best) best = lv;
    };
    for (let i = DATA.seeds.length - 1; i >= 0; i -= 1) {
      if (state.credits >= DATA.seeds[i].cost) { consider(DATA.seeds[i].id); break; }
    }
    (state.grid || []).forEach((c) => { if (c && c.seed) consider(c.seed); });
    Object.keys(state.flowers || {}).forEach((id) => {
      if (state.flowers[id] > 0) consider(id);
    });
    (state.grid || []).forEach((c, i) => {
      if (!c || !c.locked) return;
      if (state.credits >= plotUnlockCost(i)) {
        const lv = plotUnlockLevel(i);
        if (lv > best) best = lv;
      }
    });
    state.rep = cumulativeRep(best);
    state.level = best;
    return { level: best };
  }

  function questMatches(def, track, key) {
    if (!def || def.track !== track) return false;
    if (track === 'rarity') return (RARITY_RANK[key] || 0) >= (RARITY_RANK[def.key] || 0);
    if (def.key && def.key !== key) return false;
    return true;
  }
  function bumpInst(inst, def, n) {
    if (!inst || !def || inst.progress >= def.qty) return false;
    const next = def.track === 'combo'
      ? Math.min(def.qty, Math.max(inst.progress, n))
      : Math.min(def.qty, inst.progress + n);
    if (next === inst.progress) return false;
    inst.progress = next;
    return true;
  }
  function noteQuest(track, key, n) {
    if (!n) return;
    refreshDaily();
    let changed = false;
    state.quests.active.forEach((inst) => {
      const def = questById(inst.id);
      if (questMatches(def, track, key)) changed = bumpInst(inst, def, n) || changed;
    });
    const daily = state.quests.daily;
    if (daily && daily.id && !daily.claimed) {
      const def = questById(daily.id);
      if (questMatches(def, track, key)) changed = bumpInst(daily, def, n) || changed;
    }
    if (changed) save();
  }

  function applyReward(reward) {
    if (!reward) return;
    if (reward.credits) credit(reward.credits);
    if (reward.gems) state.gems += reward.gems;
    if (reward.boost) giveBoost(reward.boost);
  }
  function giveBoost(id, n) {
    const count = n || 1;
    if (!id || count < 1) return;
    if (!DATA.boosters.some((b) => b.id === id)) return;
    if (!state.boostInv || typeof state.boostInv !== 'object') {
      state.boostInv = { bloom: 0, seedrush: 0, fortune: 0, golden: 0 };
    }
    state.boostInv[id] = (state.boostInv[id] || 0) + count;
  }
  function addRep(n) {
    if (!(n > 0)) return [];
    const before = levelFromRep(state.rep);
    state.rep += n;
    const after = levelFromRep(state.rep);
    state.level = after;
    const grants = [];
    for (let L = before + 1; L <= after; L += 1) grants.push(grantLevel(L));
    return grants;
  }

  function discoveredCount() {
    return DATA.seeds.reduce((n, s) => n + ((state.discovered[s.id] || 0) > 0 ? 1 : 0), 0);
  }
  function discoveredOf(id) {
    return state.discovered[id] || 0;
  }
  function bestRarityOf(id) {
    return state.bestRarity[id] || null;
  }
  function almanacMilestones() {
    const found = discoveredCount();
    return (DATA.almanacMilestones || []).map((m) => ({
      at: m.at,
      rep: m.rep || 0,
      gems: m.gems || 0,
      boost: m.boost || null,
      claimed: state.almanacClaimed.indexOf(m.at) !== -1,
      reached: found >= m.at
    }));
  }
  function backfillDiscovered() {
    if (!state.discovered || typeof state.discovered !== 'object') state.discovered = {};
    if (!state.bestRarity || typeof state.bestRarity !== 'object') state.bestRarity = {};
    if (!Array.isArray(state.almanacClaimed)) state.almanacClaimed = [];
    Object.keys(state.flowers || {}).forEach((id) => {
      const have = Number(state.flowers[id]) || 0;
      if (have <= 0) return;
      if (!DATA.seeds.some((s) => s.id === id)) return;
      state.discovered[id] = Math.max(Number(state.discovered[id]) || 0, have);
    });
  }
  function grantAlmanacMilestones() {
    const found = discoveredCount();
    const paid = [];
    let levelGrants = [];
    (DATA.almanacMilestones || []).forEach((m) => {
      if (found < m.at) return;
      if (state.almanacClaimed.indexOf(m.at) !== -1) return;
      state.almanacClaimed.push(m.at);
      if (m.rep) levelGrants = levelGrants.concat(addRep(m.rep));
      if (m.gems) state.gems += m.gems;
      if (m.boost) giveBoost(m.boost);
      paid.push({ at: m.at, rep: m.rep || 0, gems: m.gems || 0, boost: m.boost || null });
    });
    return { paid, levelGrants };
  }
  /* ---------------- bloom mastery ---------------- */

  const emptyRarityCount = () => ({ rare: 0, epic: 0, legend: 0 });

  function rarityCountsOf(id) {
    const c = state.rarityCounts[id];
    if (!c || typeof c !== 'object') return emptyRarityCount();
    return {
      rare: Number(c.rare) || 0,
      epic: Number(c.epic) || 0,
      legend: Number(c.legend) || 0
    };
  }

  function decadeQty(steps, i) {
    return steps[i % steps.length] * Math.pow(10, Math.floor(i / steps.length));
  }

  /** The goal for a 1-based tier number, identical for every flower. */
  function masteryTierGoal(tier) {
    const cycle = (tier - 1) % 4;
    if (cycle === 0 || cycle === 2) {
      return { track: 'total', qty: decadeQty([10, 25, 50], Math.floor((tier - 1) / 2)) };
    }
    if (cycle === 1) {
      return { track: 'rare', qty: decadeQty([4, 10, 20], Math.floor((tier - 1) / 4)) };
    }
    return { track: 'epic', qty: decadeQty([2, 5, 10], Math.floor((tier - 1) / 4)) };
  }

  /** Rarity tracks count that rarity or better, matching questMatches(). */
  function masteryHave(id, track) {
    const c = rarityCountsOf(id);
    if (track === 'rare') return c.rare + c.epic + c.legend;
    if (track === 'epic') return c.epic + c.legend;
    return state.discovered[id] || 0;
  }

  const masteryOf = (id) => state.mastery[id] || 0;
  /* Old Bloom Mastery retired into petals with the Garden Year. The tiers a
     save had earned converted once into Saved Seeds (migrateYear) and the
     ladder froze: it no longer climbs, pays no gems, and multiplies nothing.
     The recorded tiers stay as a lifetime record; petalMult() is the live
     per-seed multiplier now. */
  const masteryMult = () => 1;

  function masteryGoal(id) {
    if (!((state.discovered[id] || 0) > 0)) return null;
    const tier = masteryOf(id) + 1;
    const goal = masteryTierGoal(tier);
    return { tier, track: goal.track, qty: goal.qty, have: masteryHave(id, goal.track) };
  }

  /** Advance as far as the recorded counts allow. `payGems` is false for backfill. */
  function advanceMastery(id, payGems) {
    const paid = [];
    const every = DATA.masteryGemEvery || 0;
    for (;;) {
      const tier = masteryOf(id) + 1;
      const goal = masteryTierGoal(tier);
      if (masteryHave(id, goal.track) < goal.qty) break;
      state.mastery[id] = tier;
      let gems = 0;
      if (payGems && every && tier % every === 0) {
        gems = DATA.masteryGemGrant || 0;
        state.gems += gems;
      }
      paid.push({ tier, track: goal.track, qty: goal.qty, gems });
    }
    return paid;
  }

  function recordHarvest(seedId, rarityKey) {
    const first = !((state.discovered[seedId] || 0) > 0);
    state.discovered[seedId] = (state.discovered[seedId] || 0) + 1;
    const prev = state.bestRarity[seedId];
    if (prev == null || (RARITY_RANK[rarityKey] || 0) > (RARITY_RANK[prev] || 0)) {
      state.bestRarity[seedId] = rarityKey;
    }
    if (rarityKey === 'rare' || rarityKey === 'epic' || rarityKey === 'legend') {
      const c = rarityCountsOf(seedId);
      c[rarityKey] += 1;
      state.rarityCounts[seedId] = c;
    }
    const granted = grantAlmanacMilestones();
    return {
      first,
      count: state.discovered[seedId],
      best: state.bestRarity[seedId],
      milestones: granted.paid,
      levelGrants: granted.levelGrants,
      // The mastery ladder is retired — nothing advances it any more.
      mastery: []
    };
  }

  /* rarityCounts was never recorded before mastery shipped, so an old save would
     stall on the first Rare tier forever. Estimate from the drop table, but never
     credit a rarity the player has provably never hit. */
  function backfillMastery() {
    if (!state.mastery || typeof state.mastery !== 'object') state.mastery = {};
    if (!state.rarityCounts || typeof state.rarityCounts !== 'object') state.rarityCounts = {};
    const totalWeight = DATA.rarity.reduce((n, r) => n + r.w, 0);
    const share = {};
    DATA.rarity.forEach((r) => { share[r.key] = totalWeight ? r.w / totalWeight : 0; });
    let changed = false;
    DATA.seeds.forEach((s) => {
      const id = s.id;
      const total = state.discovered[id] || 0;
      const existing = state.rarityCounts[id];
      if (total <= 0 || (existing && typeof existing === 'object')) {
        if (existing && typeof existing === 'object') state.rarityCounts[id] = rarityCountsOf(id);
        return;
      }
      const bestRank = RARITY_RANK[state.bestRarity[id]] || 0;
      const c = emptyRarityCount();
      // Rarest first: bestRarity proves those happened, so they get the budget.
      let budget = total;
      ['legend', 'epic', 'rare'].forEach((key) => {
        if (RARITY_RANK[key] > bestRank) return;
        // They demonstrably reached this tier at least once, so never round it to zero.
        const want = Math.max(1, Math.round(total * (share[key] || 0)));
        c[key] = Math.max(0, Math.min(want, budget));
        budget -= c[key];
      });
      state.rarityCounts[id] = c;
      changed = true;
    });
    /* The ladder itself no longer advances here — the estimate exists so
       creatures, the Almanac and the one-time mastery conversion in
       migrateYear() have honest counts to read. */
    return { changed, granted: [] };
  }
  function grantLevel(level) {
    const coins = (DATA.levelCoinGrant || 20) * level;
    credit(coins);
    const grant = (DATA.levelGrants && DATA.levelGrants[level]) || {};
    // `seed` stays in the shape but is never filled: levels stopped unlocking
    // seeds when the Garden Year's one-time prices took the gate over, and a
    // level-up toast announcing a seed it did not unlock would be a lie.
    const out = { level, coins, seed: null, plot: null, hive: false, decor: null, gems: 0, boost: null };
    const plotIdx = (DATA.plotUnlockLevel || []).findIndex((lv, i) => i > 3 && lv === level);
    if (plotIdx >= 0) out.plot = plotIdx;
    if (grant.hive) {
      const free = emptyCells();
      if (free.length) {
        state.apiary.cells[free[0]] = { kind: 'hive', at: nowSeconds(), jars: [] };
        out.hive = true;
      } else {
        const extra = MEADOW.hive.cost(0);
        credit(extra);
        out.coins += extra;
      }
    }
    if (grant.decor) {
      state.decor.push({ id: grant.decor });
      out.decor = grant.decor;
    }
    if (grant.gems) {
      state.gems += grant.gems;
      out.gems = grant.gems;
    }
    if (grant.boost) {
      giveBoost(grant.boost);
      out.boost = grant.boost;
    }
    return out;
  }

  function claimQuest(id) {
    refreshDaily();
    const def = questById(id);
    if (!def) return null;
    const isDaily = DATA.dailies.some((q) => q.id === id);
    if (isDaily) {
      const inst = state.quests.daily;
      if (!inst || inst.id !== id || inst.claimed || inst.progress < def.qty) return null;
      inst.claimed = true;
    } else {
      const inst = state.quests.active.find((q) => q.id === id);
      if (!inst || inst.progress < def.qty) return null;
      if (state.quests.done.indexOf(id) !== -1) return null;
      state.quests.done.push(id);
      state.quests.active = state.quests.active.filter((q) => q.id !== id);
      fillActive();
    }
    const grants = addRep(def.rep);
    applyReward(def.reward);
    save();
    emit('currency');
    emit('panels');
    const payload = { id, def, rep: def.rep, grants };
    emit('quest', payload);
    if (grants.length) emit('levelup', { from: grants[0].level - 1, to: state.level, grants });
    return payload;
  }

  function stripQuest() {
    refreshDaily();
    fillActive();
    const inst = state.quests.active[0];
    if (inst) {
      const def = questById(inst.id);
      if (def) return { kind: 'ladder', inst, def, complete: inst.progress >= def.qty };
    }
    const d = state.quests.daily;
    const ddef = d && d.id ? questById(d.id) : null;
    if (ddef && !d.claimed) {
      return { kind: 'daily', inst: d, def: ddef, complete: d.progress >= ddef.qty };
    }
    return { kind: 'rest', inst: null, def: null, complete: false };
  }

  /* ---------------- Wonder Effect ---------------- */
  const wonderActive = () => state.wonder.until > nowSeconds();
  const wonderMult = () => (wonderActive() ? WONDER.payoutMult : 1);

  function tryWonder(chance) {
    const now = nowSeconds();
    if (wonderActive()) return false;
    if (now - state.wonder.last < WONDER.cooldown) return false;
    if (Math.random() >= chance) return false;
    startWonder();
    return true;
  }

  function startWonder() {
    const now = nowSeconds();
    state.wonder.until = now + WONDER.duration;
    state.wonder.last = now;
    state.stats.wonders = (state.stats.wonders || 0) + 1;
    save();
    emit('wonder', { active: true });
  }

  /* ---------------- tap-triggered garden procs ----------------
     Independent slot-machine rolls on every tap (including hold-ticks — a
     hold is just a repeated tap). Each is gated on owning at least one level
     of its badge, so an unbought badge can never fire. */
  const RAIN_DANCE_SHAVE = 3;   // seconds shaved off the chosen plot's remaining grow time
  const LADYBUG_RARITY_BONUS = 1; // added to rollRarity's `extra` for that one harvest
  // Deliberately tiny — these are slot-machine rolls, not efficient growth levers. Levelling a
  // badge only nudges its odds by a fifth of a percent; the moment it fires is what's meant to
  // feel big, not the climb toward it. See docs/10-decision-log.md.
  const PROC_CHANCE_PER_LEVEL = 0.002;

  /* Development overrides. Every one of these forces an outcome through the *real* code path
     rather than faking an effect, so a cheat exercises the feature it claims to test. Each is
     consumed once and cleared, except `weather`, which is sticky until reset. */
  const dev = { rarity: null, gem: false, weather: null, procs: {}, boost: {} };
  /* Dev-only, deliberately not in data.js: this is a testing affordance, not a tunable, and it
     must never reach remote config. Additive so a boosted proc fires often enough to watch even
     with its badge at level zero. */
  const DEV_PROC_BOOST = 0.5;
  const devTake = (key) => {
    const v = dev[key];
    if (key !== 'weather') dev[key] = key === 'gem' ? false : null;
    return v;
  };
  const devProc = (key) => {
    if (!dev.procs[key]) return false;
    dev.procs[key] = false;
    return true;
  };

  /* The badge level and the dev boost meet here, so a boosted proc bypasses the level gate as
     well as the rate — testing Bee Swarm should not require buying Bee Swarm first. */
  function procChance(key) {
    const base = (state.upgrades[key] || 0) * PROC_CHANCE_PER_LEVEL;
    return Math.min(1, base + (dev.boost[key] ? DEV_PROC_BOOST : 0));
  }

  /** Unlocked, seeded, not-yet-ready plots — eligible targets for a garden proc. */
  function growingPlotIndices() {
    const idxs = [];
    state.grid.forEach((c, i) => { if (!c.locked && c.seed && !c.ready) idxs.push(i); });
    return idxs;
  }

  function rollRainDance() {
    const forced = devProc('rainDance');
    if (!forced && Math.random() >= procChance('rainDance')) return null;
    const idxs = growingPlotIndices();
    if (!idxs.length) return null;
    const idx = idxs[Math.floor(Math.random() * idxs.length)];
    const cell = state.grid[idx];
    const elapsed = Math.max(0, nowSeconds() - cell.plantedAt);
    const remain = Math.max(0, cell.grow - elapsed);
    const shaved = Math.min(RAIN_DANCE_SHAVE, remain);
    cell.grow = elapsed + Math.max(0, remain - shaved);
    return { idx, shaved };
  }

  function rollBeeSwarm() {
    const forced = devProc('beeSwarm');
    if (!forced && Math.random() >= procChance('beeSwarm')) return null;
    const openHives = hiveCells().filter((i) => state.apiary.cells[i].jars.length < hiveCapacity(i));
    if (!openHives.length) return null;
    const i = openHives[Math.floor(Math.random() * openHives.length)];
    const variety = sampleBloom(bloomPool());
    state.apiary.cells[i].jars.push(variety);
    noteShelf(variety);
    noteQuest('honey', variety, 1);
    return { hive: i, variety };
  }

  /* A pack lands on a plot and waits to be collected — the Lucky Ladybug shape, because "something
     turned up in your garden, go and get it" is a better beat than a number appearing in a wallet.
     Unlike the three badge procs this is always on: it is the album's only in-game source, so a
     player who has bought nothing still has to be able to find one. */
  function rollCardPack(chance) {
    const forced = devProc('cardPack');
    const odds = chance === undefined ? DATA.packDropChance : chance;
    if (!forced && (odds <= 0 || Math.random() >= odds)) return null;
    const open = [];
    state.grid.forEach((cell, i) => { if (!cell.locked && !cell.packDrop) open.push(i); });
    if (!open.length) return null;
    const idx = open[Math.floor(Math.random() * open.length)];
    state.grid[idx].packDrop = true;
    return { idx };
  }

  /** Collect a pack sitting on a plot. Returns the plot, or null if there was nothing there. */
  function collectPackDrop(idx) {
    const cell = state.grid[idx];
    if (!cell || !cell.packDrop) return null;
    cell.packDrop = false;
    state.packs += 1;
    save();
    emit('panels');
    emit('packs', { granted: 1, total: state.packs });
    return { idx, packs: state.packs };
  }

  function rollLadybug() {
    const forced = devProc('ladybug');
    if (!forced && Math.random() >= procChance('ladybug')) return null;
    const idxs = growingPlotIndices();
    if (!idxs.length) return null;
    // Prefer a plot that isn't already lucky, so triggers don't pile onto one spot.
    const fresh = idxs.filter((i) => !state.grid[i].luckyBug);
    const pool = fresh.length ? fresh : idxs;
    const idx = pool[Math.floor(Math.random() * pool.length)];
    state.grid[idx].luckyBug = true;
    return { idx };
  }

  const comboMult = () => 1 + state.tap.combo * 0.01;

  /* ---------------- actions ---------------- */
  /* Lucky Charm has no level cap, so crit chance could pass 100% and make every
     tap a crit — at which point "critical" means nothing. The Almanac was already
     clamping the number it displayed to 99%, which hid that rather than
     preventing it. One source for both now, so the shown number is the real one. */
  const CRIT_CHANCE_MAX = 0.99;
  function critChanceNow() {
    return Math.min(CRIT_CHANCE_MAX, state.tap.critChance + boostVal('critChance'));
  }

  function tapFlower(held) {
    const power = state.tap.power * (1 + boostVal('tapPower')) * (1 + boostVal('globalCredits'));
    const critChance = critChanceNow();
    const critMultiplier = state.tap.critMult;
    const isCrit = Math.random() < critChance;
    let gain = power;
    if (isCrit) {
      gain *= critMultiplier;
      state.stats.totalCrits += 1;
    }
    let gemDrop = false;
    if (Math.random() < 0.05) { state.gems += 1; gemDrop = true; }
    gain *= wonderMult();
    gain *= comboMult();
    state.stats.totalTaps += 1;
    const rounded = Math.round(gain);
    credit(rounded);
    state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1);
    if (state.tap.combo > state.year.stats.bestCombo) state.year.stats.bestCombo = state.tap.combo;
    const sparked = tryWonder(WONDER.tapChance);
    const rainDance = rollRainDance();
    const beeSwarm = rollBeeSwarm();
    const ladybug = rollLadybug();
    const cardPack = rollCardPack();
    save();
    emit('currency');
    const payload = {
      gain: rounded, crit: isCrit, combo: state.tap.combo, gemDrop, sparkedWonder: sparked,
      rainDance, beeSwarm, ladybug, cardPack, held: Boolean(held)
    };
    emit('tap', payload);
    noteQuest('tap', null, 1);
    if (held) noteQuest('hold', null, 1);
    if (isCrit) noteQuest('crit', null, 1);
    noteQuest('combo', null, state.tap.combo);
    return payload;
  }

  function decayCombo() {
    if (state.tap.combo <= 0) return false;
    state.tap.combo = Math.max(0, state.tap.combo - 1);
    return true;
  }

  function plant(idx, seedDef, payCost = true) {
    if (!seedDef) return false;
    const cell = state.grid[idx];
    if (!cell || cell.locked || cell.seed) return false;
    if (!seedUnlocked(seedDef.id)) return false;
    if (payCost && state.credits < seedDef.cost) return false;
    if (payCost) state.credits -= seedDef.cost;
    state.grid[idx] = {
      ...cell,
      seed: seedDef.id,
      plantedAt: nowSeconds(),
      grow: plantGrowth(seedDef, idx),
      aura: '',
      mutation: null,
      mutateAt: 0
    };
    const cellNow = state.grid[idx];
    cellNow.mutateAt = mutationMoment(cellNow.plantedAt, cellNow.grow);
    /* A Keeper planted next to something already growing has to help it too, or the verb would
       only ever pay out when the player happened to plant in the right order. */
    const quickened = seedDef.verb === 'keeper' ? quickenNeighbours(idx) : [];
    save();
    emit('currency');
    emit('plant', { idx, seed: seedDef, auto: !payCost, verb: seedDef.verb || null, quickened });
    noteQuest('plant', seedDef.id, 1);
    return true;
  }

  /** A Spreader may sow itself, free, into one empty neighbour. Returns the plot, or -1. */
  function trySpread(idx, sdef) {
    if (Math.random() >= VT().spreaderChance) return -1;
    const open = neighboursOf(idx).filter((n) => !state.grid[n].seed);
    if (!open.length) return -1;
    const target = open[Math.floor(Math.random() * open.length)];
    return plant(target, sdef, false) ? target : -1;
  }

  /** Shave a Keeper's share off neighbours that were already growing when it went in. */
  function quickenNeighbours(idx) {
    const touched = [];
    neighboursOf(idx).forEach((n) => {
      const cell = state.grid[n];
      if (!cell.seed || cell.ready) return;
      const elapsed = Math.max(0, nowSeconds() - cell.plantedAt);
      const remain = Math.max(0, cell.grow - elapsed);
      if (remain <= 0) return;
      cell.grow = elapsed + remain * (1 - VT().keeperGrowth);
      touched.push(n);
    });
    return touched;
  }

  function unlockPlot(idx) {
    const cell = state.grid[idx];
    if (!cell || !cell.locked) return false;
    if (!plotAvailable(idx)) {
      emit('deny', { reason: 'level', need: plotUnlockLevel(idx), idx });
      return false;
    }
    const cost = plotUnlockCost(idx);
    if (state.credits < cost) {
      emit('deny', { reason: 'credits', need: cost, idx });
      return false;
    }
    state.credits -= cost;
    cell.locked = false;
    save();
    emit('currency');
    emit('unlock', { idx, cost });
    emit('panels');
    noteQuest('plot', idx, 1);
    return true;
  }

  function unlockNextPlots(count) {
    const targets = [];
    for (let i = 0; i < state.grid.length && targets.length < count; i += 1) {
      if (state.grid[i].locked && plotAvailable(i)) targets.push(i);
    }
    targets.forEach((idx) => {
      state.grid[idx].locked = false;
      noteQuest('plot', idx, 1);
    });
    return targets.length;
  }

  /** Impatient tap on a growing plant: shave 2% off the remaining time. */
  function hasten(idx) {
    const cell = state.grid[idx];
    if (!cell || !cell.seed || cell.ready) return 0;
    const elapsed = Math.max(0, nowSeconds() - cell.plantedAt);
    const remain = Math.max(0, cell.grow - elapsed);
    const hasteFactor = 1 + boostVal('growSpeed') + state.upgrades.autoWater * 0.01;
    const shaved = 0.02 * cell.grow * hasteFactor;
    cell.grow = elapsed + Math.max(0, remain - shaved);
    return shaved;
  }

  function harvest(idx) {
    const cell = state.grid[idx];
    if (!cell || !cell.seed) return null;
    const sdef = seedById(cell.seed);
    const now = nowSeconds();
    if (!sdef || now - cell.plantedAt < cell.grow) return null;

    const luckyHarvest = Boolean(cell.luckyBug);
    /* Verbs are read before the plot is cleared, because clearing it changes its neighbourhood. */
    const beacons = neighbourVerbs(idx, 'beacon');
    const lanterns = neighbourVerbs(idx, 'lantern');
    const verbMult = verbPayoutMult(idx);
    const mutation = cell.mutation || null;
    const mutMult = mutationMult(mutation);
    const forcedRarity = devTake('rarity');
    const r = forcedRarity
      ? DATA.rarity.find((x) => x.key === forcedRarity)
      : rollRarity(
        boostVal('rarityWeight')
        + (luckyHarvest ? LADYBUG_RARITY_BONUS : 0)
        + beacons * VT().beaconRarity
      );
    const yieldBase = sdef.yield * r.m;
    const yieldBonus = 1 + boostVal('globalCredits');
    /* Petals multiply here and in passiveIncomeRate(), never seed.yield —
       the masteryMult pattern, inherited when the old ladder retired. */
    const payout = Math.round(
      yieldBase * yieldBonus * (1 + pollination()) * wonderMult() * petalMult(sdef.id) * verbMult * mutMult
      * critterPayoutMult()
    );

    credit(payout);
    if (r.key === 'legend') state.year.stats.legendaries += 1;
    noteYearSpecies(sdef.id);
    // The bloom itself is kept as a crafting ingredient, on top of the credits.
    state.flowers[sdef.id] = (state.flowers[sdef.id] || 0) + 1;
    // ...and lands in the bench basket, never straight onto the bench, so an
    // absence can never hand the player a board that filled itself.
    const benchTier = benchEntryTier(sdef.id, r.key);
    const benchGot = benchAddToBasket(benchTier);
    state.harvestsThisSession += 1;
    state.stats.totalHarvests += 1;
    const almanac = recordHarvest(sdef.id, r.key);
    let repBonus = 0;
    let levelGrants = almanac.levelGrants.slice();
    const every = DATA.harvestRepEvery || 10;
    if (state.harvestsThisSession % every === 0) {
      repBonus = DATA.harvestRepGrant || 1;
      levelGrants = levelGrants.concat(addRep(repBonus));
    }
    const baseGem = gemChanceFor(sdef);
    const gemChance = baseGem
      * (lanterns ? Math.pow(VT().lanternGemMult, lanterns) : 1)
      * (1 + critterTrait('gemLuck'));
    let gemDrop = false;
    if (devTake('gem') || Math.random() < gemChance) { state.gems += 1; gemDrop = true; }

    state.grid[idx] = { ...cell, seed: null, plantedAt: 0, grow: 0, ready: false, aura: r.a, luckyBug: false, mutation: null, mutateAt: 0 };
    const sown = sdef.verb === 'spreader' ? trySpread(idx, sdef) : -1;
    const sparked = tryWonder(WONDER.harvestChance);
    save();
    emit('currency');
    const payload = {
      idx, payout, rarity: r, seed: sdef, gemDrop, repBonus, sparkedWonder: sparked, luckyHarvest,
      firstDiscover: almanac.first, discovered: almanac.count, bestRarity: almanac.best,
      milestones: almanac.milestones, mastery: almanac.mastery,
      verbMult, beacons, lanterns, sown, mutation, mutMult,
      benchTier: benchGot ? benchTier : -1
    };
    emit('harvest', payload);
    if (almanac.milestones.length) {
      emit('almanac', { found: discoveredCount(), seed: sdef, milestones: almanac.milestones });
    }
    if (almanac.mastery.length) {
      emit('mastery', {
        idx,
        seed: sdef,
        tiers: almanac.mastery,
        tier: almanac.mastery[almanac.mastery.length - 1].tier,
        gems: almanac.mastery.reduce((n, t) => n + t.gems, 0),
        first: almanac.mastery[0].tier === 1,
        mult: masteryMult(sdef.id)
      });
    }
    if (levelGrants.length) {
      emit('levelup', { from: levelGrants[0].level - 1, to: state.level, grants: levelGrants });
    }
    noteQuest('harvest', sdef.id, 1);
    noteQuest('rarity', r.key, 1);
    // A forager turns a pack up on a harvest. Same roll and same landing spot as
    // the tap proc, so the album still only ever *receives* from the garden — it
    // never lets the garden decide what is inside. The plot was cleared above, so
    // this can land on the one just picked.
    const foragerOdds = critterTrait('packLuck');
    const foraged = foragerOdds > 0 ? rollCardPack(foragerOdds) : null;
    if (foraged) {
      payload.cardPack = foraged;
      // Night Errand banks a rarity floor rather than tagging the pack itself,
      // because state.packs is a count and always has been.
      if (pairActive('nighterrand') && isNight()) {
        state.luckyPacks += 1;
        payload.luckyPack = true;
      }
      if (pairActive('hedgerow')) {
        state.gems += PAIR_TUNING.hedgerowGems;
        payload.hedgerowGems = PAIR_TUNING.hedgerowGems;
      }
    }
    if (almanac.first) noteQuest('discover', sdef.id, 1);
    // After recordHarvest, so the bloom that meets the threshold is the one
    // that brings the creature rather than the one after it.
    checkCritters();
    return payload;
  }

  /* ---------------- the Wild Meadow ---------------- */

  /* A board of eight cells around the flower, same shape as the garden and a
     different verb: these pieces are PLACED, not planted, and they stay. A cell
     holds a hive or a tender, and a tender improves only the hives it touches. */

  const cells = () => state.apiary.cells;
  const cellAt = (i) => (state.apiary.cells[i] || null);
  const cellIsHive = (i) => { const c = cellAt(i); return Boolean(c && c.kind === 'hive'); };
  const hiveCells = () => state.apiary.cells.map((c, i) => (c && c.kind === 'hive' ? i : -1)).filter((i) => i >= 0);
  const hiveCount = () => hiveCells().length;
  const tenderCount = (id) => state.apiary.cells.filter((c) => c && c.kind === 'tender' && (!id || c.type === id)).length;
  const emptyCells = () => state.apiary.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const boardFull = () => !emptyCells().length;

  const nextHiveCost = () => MEADOW.hive.cost(hiveCount());

  /* ---- locked land ----
     The garden's two-stage gate, restated: reach the level, then pay the coins.
     `plotUnlockLevel` / `plotAvailable` / `unlockPlot` are the models. */
  const cellUnlockLevel = (idx) => (MEADOW.cellUnlockLevel || [])[idx] || 1;
  const cellUnlockCost = (idx) => Math.round(MEADOW.cellUnlockCost(idx));
  const cellAvailable = (idx) => levelFromRep(state.rep) >= cellUnlockLevel(idx);
  const cellLocked = (idx) => !!(state.apiary.locked || [])[idx];

  function unlockCell(idx) {
    if (idx < 0 || idx >= MEADOW.cells || !cellLocked(idx)) return false;
    if (!cellAvailable(idx)) {
      emit('deny', { reason: 'level', need: cellUnlockLevel(idx), idx });
      return false;
    }
    const cost = cellUnlockCost(idx);
    if (state.credits < cost) {
      emit('deny', { reason: 'credits', need: cost, idx });
      return false;
    }
    state.credits -= cost;
    state.apiary.locked[idx] = false;
    save();
    emit('currency');
    /* Its own event, not the garden's `unlock`: that handler centres its
       confetti on a plot node, and in the meadow the garden is display:none —
       which is the documented way to fire a celebration from the top-left
       corner of the screen. */
    emit('cellUnlock', { idx, cost });
    emit('panels');
    return true;
  }
  const nextTenderCost = (id) => {
    const t = meadowTender(id);
    return t ? t.cost(tenderCount(id)) : 0;
  };
  const hivesFull = () => boardFull();

  const meadowNeighbours = (i) => MEADOW_NEIGHBOURS[i] || [];

  /* Everything a hive's neighbours are doing for it, summed. This is the whole
     mechanic: a hive on its own is plain, and what is next to it is the build. */
  function hiveBonus(i) {
    const out = { speed: 0, cap: 0, wax: 0, pollen: 0, rare: 0 };
    meadowNeighbours(i).forEach((n) => {
      const c = cellAt(n);
      if (!c || c.kind !== 'tender') return;
      const t = meadowTender(c.type);
      if (!t) return;
      out.speed += t.speed;
      out.cap += t.cap;
      out.wax += t.wax;
      out.pollen += t.pollen;
      out.rare += t.rare;
    });
    return out;
  }

  function pollination() {
    return hiveCells().reduce((n, i) => n + APIARY.pollination + hiveBonus(i).pollen, 0);
  }

  /* ---- keepers: creatures stationed on the meadow ----
     Scoped to this one place on purpose. A keeper is a creature that is already
     OUT — it keeps working the garden as well — so the scarcity is the slot
     count. The guardrail from docs/25-world-map.md: the meadow works with nobody
     stationed. A keeper makes it better, never possible. */
  const keeperSlots = () => MEADOW.keeperSlots;
  const keepers = () => (state.apiary.keepers || []).filter((id) => critterTending(id));
  const isKeeper = (id) => keepers().includes(id);
  const keepersFree = () => Math.max(0, keeperSlots() - keepers().length);

  function setKeeper(id, on) {
    if (!Array.isArray(state.apiary.keepers)) state.apiary.keepers = [];
    const at = state.apiary.keepers.indexOf(id);
    if (!on) {
      if (at < 0) return false;
      state.apiary.keepers.splice(at, 1);
      save();
      emit('panels');
      return true;
    }
    if (at >= 0) return false;
    if (!critterTending(id) || !keepersFree()) return false;
    state.apiary.keepers.push(id);
    save();
    emit('panels');
    return true;
  }

  function keeperSpeed() {
    let bonus = 0;
    keepers().forEach((id) => {
      const def = critterById(id);
      if (!def || critterAsleep(id)) return;
      const mult = def.affinity === 'meadow' ? MEADOW.affinityMult : 1;
      bonus += critterWorkLevel(id) * MEADOW.keeperSpeedPerStar * mult;
    });
    return bonus;
  }

  /* Neighbours change the interval; keepers change it again on top. Clamped so a
     wall of Sun Traps can never drive it to nothing. */
  const hiveInterval = (i) => {
    const b = hiveBonus(i);
    const base = APIARY.interval * Math.max(0.35, 1 + b.speed);
    return Math.max(5, base / (1 + keeperSpeed()));
  };
  const hiveCapacity = (i) => APIARY.capacity + hiveBonus(i).cap;
  const hiveWax = (i) => Math.min(0.95, APIARY.waxChance + hiveBonus(i).wax);

  function placeHive(i) {
    if (cellAt(i) || i < 0 || i >= MEADOW.cells || cellLocked(i)) return false;
    const cost = nextHiveCost();
    if (state.credits < cost) { emit('deny', { reason: 'credits', need: cost }); return false; }
    state.credits -= cost;
    state.apiary.cells[i] = { kind: 'hive', at: nowSeconds(), jars: [] };
    save();
    emit('currency');
    emit('purchase', { kind: 'hive', cost, cell: i });
    emit('panels');
    noteQuest('hive', null, 1);
    return true;
  }

  function placeTender(i, id) {
    const t = meadowTender(id);
    if (!t || cellAt(i) || i < 0 || i >= MEADOW.cells || cellLocked(i)) return false;
    const cost = nextTenderCost(id);
    if (state.credits < cost) { emit('deny', { reason: 'credits', need: cost }); return false; }
    state.credits -= cost;
    state.apiary.cells[i] = { kind: 'tender', type: id };
    save();
    emit('currency');
    emit('purchase', { kind: 'tender', cost, cell: i, type: id });
    emit('panels');
    return true;
  }

  /* Moving is FREE. What costs money is buying the piece; a board you cannot
     rearrange is a puzzle you are punished for experimenting with, which is the
     opposite of what the cosy pillar asks for. Two filled cells swap. */
  function moveCell(from, to) {
    if (from === to || from < 0 || to < 0 || from >= MEADOW.cells || to >= MEADOW.cells) return false;
    if (cellLocked(from) || cellLocked(to)) return false;
    const a2 = cellAt(from);
    if (!a2) return false;
    const b2 = cellAt(to);
    state.apiary.cells[to] = a2;
    state.apiary.cells[from] = b2;
    save();
    emit('panels');
    return true;
  }

  /* ---- the honey shelf ---- */
  const shelfCount = (seedId) => (state.apiary.shelf || {})[seedId] || 0;
  const shelfHas = (seedId) => shelfCount(seedId) > 0;
  const shelfFilled = () => DATA.seeds.filter((sd) => shelfHas(sd.id)).length;
  const shelfTotal = () => DATA.seeds.length;

  function noteShelf(type) {
    if (!type || type === APIARY.wildHoney) return false;
    if (!state.apiary.shelf || typeof state.apiary.shelf !== 'object') state.apiary.shelf = {};
    const first = !state.apiary.shelf[type];
    state.apiary.shelf[type] = (state.apiary.shelf[type] || 0) + 1;
    if (first) emit('shelf', { seed: type, filled: shelfFilled(), total: shelfTotal() });
    return first;
  }

  /** Seeds currently in the ground — the pool a new jar draws its variety from. */
  function bloomPool() {
    const pool = [];
    state.grid.forEach((c) => { if (c && !c.locked && c.seed) pool.push(c.seed); });
    return pool;
  }

  /* Variety is decided when the jar is produced, not when it is collected.
     Sampling at collection time would let a player plant one expensive bloom,
     collect a full hive of it, and skip the cost of actually growing a garden. */
  function sampleBloom(pool) {
    if (!pool.length) return APIARY.wildHoney;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* Under the Willow's bees "come back with the strange stuff" — a spot with
     `rare` re-rolls and keeps the less common bloom, which is the only way the
     garden's contents can bias a jar beyond simple presence. */
  /* A hive beside Willow Shade "comes back with the strange stuff" — it re-rolls
     and keeps the better bloom, which is the only way a neighbour can bias what
     ends up in the jar rather than just how fast it arrives. */
  function sampleFor(i, pool) {
    const rare = hiveBonus(i).rare;
    const first = sampleBloom(pool);
    if (!rare || Math.random() >= rare) return first;
    const second = sampleBloom(pool);
    return APIARY.honeyValue(second) > APIARY.honeyValue(first) ? second : first;
  }

  function produceHoney(now) {
    if (!hiveCount()) return;
    const pool = bloomPool();
    let produced = 0;
    let swarm = false;
    hiveCells().forEach((i) => {
      const h = state.apiary.cells[i];
      if (typeof h.at !== 'number' || h.at > now) h.at = now;
      if (!Array.isArray(h.jars)) h.jars = [];
      const cap = hiveCapacity(i);
      const step = hiveInterval(i);
      while (h.jars.length < cap && now - h.at >= step) {
        h.at += step;
        const type = sampleFor(i, pool);
        h.jars.push(type);
        noteShelf(type);
        produced += 1;
        if (Math.random() < MEADOW.swarmChance) swarm = true;
      }
      // A full hive stops the clock rather than banking jars it cannot hold.
      if (h.jars.length >= cap) h.at = now;
    });

    /* The meadow's small Wonder: the whole board fills at once. Rare, free, and
       purely a gift — nothing is lost if the player never sees it happen. */
    if (swarm) {
      let extra = 0;
      hiveCells().forEach((i) => {
        const h = state.apiary.cells[i];
        const cap = hiveCapacity(i);
        while (h.jars.length < cap) {
          const type = sampleFor(i, pool);
          h.jars.push(type);
          noteShelf(type);
          extra += 1;
        }
        h.at = now;
      });
      produced += extra;
      if (extra) emit('swarm', { jars: extra });
    }

    if (produced) {
      save();
      emit('panels');
      emit('honey', { produced });
      noteQuest('honey', null, produced);
    }
  }

  function collectHive(i) {
    const h = cellAt(i);
    if (!h || h.kind !== 'hive' || !h.jars.length) return null;
    const jars = h.jars.slice();
    const waxChance = hiveWax(i);
    let wax = 0;
    jars.forEach((type) => {
      state.apiary.honey[type] = (state.apiary.honey[type] || 0) + 1;
      if (Math.random() < waxChance) wax += 1;
    });
    state.apiary.wax += wax;
    h.jars = [];
    h.at = nowSeconds();
    save();
    emit('currency');
    emit('panels');
    const payload = { i, jars, wax };
    emit('collect', payload);
    if (wax) noteQuest('wax', null, wax);
    return payload;
  }

  function collectAllHives() {
    const out = [];
    hiveCells().forEach((i) => { const r = collectHive(i); if (r) out.push(r); });
    return out;
  }

  const honeyTotal = () => Object.values(state.apiary.honey).reduce((a, b) => a + b, 0);
  const flowerTotal = () => Object.values(state.flowers).reduce((a, b) => a + b, 0);
  const jarsWaiting = () => hiveCells().reduce((a, i) => a + state.apiary.cells[i].jars.length, 0);

  /* ---------------- creatures ----------------

     A creature arrives because of what you chose to grow, then lives in the
     garden and leaves you things. Keepsakes accrue off an absolute timestamp,
     so time away counts for free and nothing needs replaying — the same shape
     the hives already use. See docs/22-creatures.md. */

  const critterById = (id) => CREATURES.find((c) => c.id === id) || null;
  const critterHome = (id) => state.critters[id] || null;
  const critterHere = (id) => Boolean(state.critters[id]);
  const crittersHome = () => CREATURES.filter((c) => critterHere(c.id));

  /* ---- tending ----
     Every creature that has moved in stays in the garden and stays visible; only
     a few tend at a time. Nothing is ever taken away, which is what keeps this
     cosy, but the slot limit is what makes "which one is out" a decision. */

  const habitatSlots = () => HABITAT_SLOT_LEVELS.filter((lv) => state.level >= lv).length;
  const critterTending = (id) => Boolean(state.critters[id] && state.critters[id].tending);
  const crittersTending = () => CREATURES.filter((c) => critterTending(c.id));
  const habitatUsed = () => crittersTending().length;
  const habitatFree = () => Math.max(0, habitatSlots() - habitatUsed());

  function setTending(id, on) {
    const home = critterHome(id);
    if (!home) return false;
    if (!on) {
      if (!home.tending) return false;
      /* Bank what it earned before it goes in, so resting never costs anything,
         and stamp the clock so the time it spends in is never credited later. */
      home.gifts = keepsakesWaiting(id);
      home.fed = nowSeconds();
      home.tending = false;
      save();
      emit('panels');
      return true;
    }
    if (home.tending) return false;
    if (habitatFree() <= 0) return false;
    home.tending = true;
    // Earning starts now, not from whenever this one last worked.
    home.fed = nowSeconds();
    save();
    notePairs();
    emit('panels');
    return true;
  }

  /* ---- named pairs ----
     Two specific creatures tending together unlock a third thing neither does
     alone. Binary on purpose: a bonus you cannot tell is active is not a bonus. */

  const pairById = (id) => CREATURE_PAIRS.find((p) => p.id === id) || null;
  /* Both tending AND both awake. A pair going quiet because someone fell asleep
     is fine precisely because you can see it — a sleeping creature says why. */
  const pairActive = (id) => {
    const p = pairById(id);
    return Boolean(p) && p.of.every((c) => critterWorking(c));
  };
  const activePairs = () => CREATURE_PAIRS.filter((p) => pairActive(p.id));

  /** Called wherever tending changes, so a first forming is a moment rather than
      a number quietly appearing in a panel. */
  function notePairs() {
    const found = [];
    activePairs().forEach((p) => {
      if (state.pairsSeen.indexOf(p.id) !== -1) return;
      state.pairsSeen.push(p.id);
      found.push(p);
    });
    if (found.length) {
      save();
      found.forEach((p) => emit('pair', { pair: p, first: true }));
    }
    return found;
  }

  /** Summed value of one trait across every creature currently tending. Reading
      by trait id rather than by creature is what makes a new creature a data
      row: add the row, and any consumer already asking for that trait sees it. */
  /** `trait.value` is the value at full stars, so a creature contributes its share
      of that. A one-star arrival is a fifth as strong as the same creature raised. */
  /** The ceiling is one star above the roster's, not the roster's, because a
      fed five-star creature has to be worth feeding — clamping here would hand
      the most invested player the only boost in the game that does nothing. */
  function critterTraitAt(def, level) {
    if (!def || !def.trait) return 0;
    const top = CREATURE_STARS + FED_STARS;
    return (def.trait.value || 0) * (Math.max(1, Math.min(top, level)) / CREATURE_STARS);
  }

  function critterTrait(traitId) {
    return crittersWorking().reduce((n, def) => (
      def.trait && def.trait.id === traitId ? n + critterTraitAt(def, critterWorkLevel(def.id)) : n
    ), 0);
  }

  /** Lifetime harvests of the bloom this creature comes for. Reads `discovered`,
      never `flowers`, so spending a bloom can never send it away again. */
  function critterProgress(def) {
    if (!def || !def.attract || !def.attract.seed) return 0;
    return state.discovered[def.attract.seed] || 0;
  }

  const critterLevel = (id) => (state.critters[id] ? state.critters[id].level || 1 : 0);
  const critterMaxed = (id) => critterLevel(id) >= CREATURE_STARS;

  /* ---- food ----
     A fed creature works one star above itself until the clock runs out, and an
     unfed one works exactly as it always did. Derived from an absolute
     timestamp, the same shape keepsakes and hives use, so time away needs no
     replaying and nothing has to tick. */

  const foodById = (id) => CREATURE_FOOD.find((f) => f.id === id) || null;
  const foodCapSeconds = () => FOOD_CAP_HOURS * 3600;
  const fedThresholdSeconds = () => FED_THRESHOLD_HOURS * 3600;

  /* ONE clock. Where it stands decides everything: above the threshold a
     creature is well fed and works a star up, above zero it is awake and
     working but hungry, at zero it is asleep. Two clocks used to carry this and
     the second one was only ever expressing the gap between them. */
  const critterFedUntil = (id) => (state.critters[id] ? state.critters[id].fedUntil || 0 : 0);
  const critterFedFor = (id) => Math.max(0, critterFedUntil(id) - nowSeconds());
  const critterFed = (id) => critterFedFor(id) > fedThresholdSeconds();

  /* Only a TENDING creature can be asleep. A resting one contributes nothing
     either way, and it cannot be fed — so letting it read as asleep would show
     the player a problem with no way to act on it, which is the one thing an
     upkeep mechanic must never do. A rested creature swapped back in with an
     empty clock does wake up needing food, and the Feed panel says so. */
  const critterAsleep = (id) => critterTending(id) && critterFedFor(id) <= 0;
  const crittersAsleep = () => CREATURES.filter((c) => critterAsleep(c.id));

  /** Tending AND awake. Every trait and every pair reads this rather than
      `critterTending()`, because a sleeping creature is not working — that is
      the whole of the upkeep mechanic, and it lives in one predicate so a new
      consumer cannot forget it. */
  const critterWorking = (id) => critterTending(id) && !critterAsleep(id);
  const crittersWorking = () => CREATURES.filter((c) => critterWorking(c.id));

  /** The star a creature is *working* at, which is what every trait reads.
      `critterLevel()` stays the star it has actually been raised to, because
      that is what growth counts against and food must never advance it. */
  const critterWorkLevel = (id) => critterLevel(id) + (critterFed(id) ? FED_STARS : 0);

  /** Seconds a given food would actually add, after the cap. Zero means the
      button should be dead rather than the purchase failing — a buy that quietly
      does nothing reads as a broken feature. */
  function foodGain(id, foodId) {
    const food = foodById(foodId);
    if (!food || !critterHere(id)) return 0;
    const from = Math.max(nowSeconds(), critterFedUntil(id));
    return Math.max(0, Math.min(nowSeconds() + foodCapSeconds(), from + food.hours * 3600) - from);
  }

  function feedCritter(id, foodId) {
    const def = critterById(id);
    const food = foodById(foodId);
    if (!def || !food || !critterHere(id)) return null;
    // Only a tending creature's trait is ever read, so feeding a resting one
    // would be a purchase that buys nothing. A SLEEPING one is the opposite
    // case entirely — waking it up is the whole point.
    if (!critterTending(id)) return null;
    const gain = foodGain(id, foodId);
    if (gain <= 0) return null;
    if (state.credits < food.cost) {
      emit('deny', { reason: 'credits', need: food.cost });
      return null;
    }
    const woke = critterAsleep(id);
    state.credits -= food.cost;
    state.critters[id].fedUntil = Math.max(nowSeconds(), critterFedUntil(id)) + gain;
    save();
    emit('currency');
    emit('purchase', { kind: 'food', key: foodId, cost: food.cost, def: food });
    emit('critter', { def, fed: true, woke, food, until: critterFedUntil(id) });
    emit('panels');
    return { def, food, woke, gain, until: critterFedUntil(id) };
  }

  /** Lifetime harvests needed to reach `level`. The same bloom raises the creature
      that attracted it, at an escalating count, so a low-tier seed keeps a reason
      to be in the ground long after its coins stop mattering. */
  function critterGoalFor(def, level) {
    if (!def || !def.attract) return Infinity;
    const base = def.attract.count || 1;
    const growth = def.attract.growth || 3;
    return Math.round(base * Math.pow(growth, Math.max(0, level - 1)));
  }

  /** What the creature is currently climbing toward, or null once it is maxed. */
  function critterGoal(id) {
    const def = critterById(id);
    if (!def) return null;
    const level = critterLevel(id);
    if (level >= CREATURE_STARS) return null;
    return {
      level: level + 1,
      qty: critterGoalFor(def, level + 1),
      have: critterProgress(def),
      seed: def.attract.seed
    };
  }

  const critterReady = (def) => critterProgress(def) >= critterGoalFor(def, 1);

  /** Called after a harvest. Handles both a creature turning up for the first time
      and a duplicate turning up to raise one that is already home — the same
      threshold machinery, escalating. Returns what happened. */
  function checkCritters() {
    const events = [];
    CREATURES.forEach((def) => {
      if (!critterHere(def.id)) {
        if (!critterReady(def)) return;
        // Tend automatically when there is room: a first creature that did nothing
        // until the player found a toggle would read as broken.
        state.critters[def.id] = {
          since: nowSeconds(), fed: 0, gifts: 0, met: false, level: 1, tending: habitatFree() > 0,
          // A generous free window, so nobody meets their first creature and
          // watches it fall asleep before they know food exists.
          fedUntil: nowSeconds() + ARRIVAL_AWAKE_HOURS * 3600
        };
        events.push({ def, arrived: true, level: 1 });
        return;
      }
      // Loop, because a long absence can bank enough for more than one star.
      let grew = 0;
      while (critterLevel(def.id) < CREATURE_STARS
        && critterProgress(def) >= critterGoalFor(def, critterLevel(def.id) + 1)) {
        state.critters[def.id].level = critterLevel(def.id) + 1;
        grew += 1;
      }
      if (grew) events.push({ def, levelled: true, level: critterLevel(def.id), gained: grew });
    });
    if (events.length) {
      save();
      events.forEach((e) => emit('critter', e));
    }
    return events;
  }

  /** Keepsakes waiting, derived from elapsed time rather than a running timer. */
  function keepsakesWaiting(id) {
    const def = critterById(id);
    const home = critterHome(id);
    if (!def || !home) return 0;
    const k = def.keepsake;
    const cap = pairActive('pollination') ? Math.max(k.cap, PAIR_TUNING.pollinationCap) : k.cap;
    /* Only a creature that is OUT leaves anything. A rester keeps whatever it had
       banked when it went in and stops earning — which is what makes the loadout
       decide memento income, and why the roster has to be rotated to collect
       every kind. Nothing is lost: the bank is handed back the moment it is sent
       out again. See docs/22-creatures.md. */
    if (!home.tending) return Math.max(0, Math.min(cap, home.gifts));
    const since = home.fed || home.since;
    // Floored at a quarter of the authored wait, so no stack of helpers can turn
    // keepsakes into a tap-to-print button.
    const every = Math.max(k.every / 4, k.every / (1 + critterTrait('keepsakeSpeed')));
    const earned = Math.floor((nowSeconds() - since) / every);
    return Math.max(0, Math.min(cap, home.gifts + earned));
  }

  /** Roll the clock forward without paying out, so a capped creature stops
      banking time it can never turn into a keepsake. */
  function settleCritters() {
    CREATURES.forEach((def) => {
      const home = critterHome(def.id);
      if (!home) return;
      const waiting = keepsakesWaiting(def.id);
      if (waiting !== home.gifts) {
        home.gifts = waiting;
        home.fed = nowSeconds();
      }
    });
  }

  function collectKeepsakes(id) {
    const def = critterById(id);
    const home = critterHome(id);
    if (!def || !home) return null;
    const n = keepsakesWaiting(id);
    if (n <= 0) return null;
    const k = def.keepsake;
    const credits = (k.credits || 0) * n;
    const doubled = id === 'thistle' && pairActive('oddsandends');
    const gems = (k.gems || 0) * n * (doubled ? PAIR_TUNING.oddsAndEndsMult : 1);
    credit(credits);
    state.gems += gems;
    // The keepsake itself is kept, not just cashed in. Nothing spends these yet;
    // they are a lifetime record so a future craft or display has something real
    // to read — see docs/22-creatures.md.
    state.mementos[k.id] = (state.mementos[k.id] || 0) + n;
    // The Delivery Round: what you picked up turns out to be a pack instead.
    let pack = 0;
    if (pairActive('deliveryround')) {
      for (let i = 0; i < n; i += 1) {
        if (Math.random() < PAIR_TUNING.deliveryChance) pack += 1;
      }
      state.packs += pack;
    }
    home.gifts = 0;
    home.fed = nowSeconds();
    home.met = true;
    save();
    emit('currency');
    emit('critter', { def, collected: n, credits, gems, pack });
    return { def, count: n, credits, gems, pack, doubled, name: k.name, memento: k.id, held: state.mementos[k.id] };
  }

  /** Tapping a creature is not a currency button — it just reacts. */
  const mementoCount = (id) => state.mementos[id] || 0;
  const mementoKinds = () => CREATURES.filter((c) => mementoCount(c.keepsake.id) > 0).length;
  const mementoTotal = () => CREATURES.reduce((n, c) => n + mementoCount(c.keepsake.id), 0);

  function petCritter(id) {
    const def = critterById(id);
    if (!def || !critterHere(id)) return null;
    const home = state.critters[id];
    home.met = true;
    emit('critter', { def, petted: true });
    return def;
  }

  /* ---------------- the potting bench ----------------

     A harvest drops one chain item into the basket; the player places it, and
     three of a kind that end up orthogonally connected merge into the rung
     above. The bench never produces a seed or a flower, so it cannot route
     around the seed ladder — see docs/21-potting-bench.md. */

  const benchDef = (tier) => BENCH.chain[tier] || null;
  const benchTop = () => BENCH.chain.length - 1;
  const benchUnlocked = (i) =>
    Math.floor(i / BENCH.cols) < state.bench.side && (i % BENCH.cols) < state.bench.side;
  const benchFirstFree = () => state.bench.cells.findIndex((c, i) => !c && benchUnlocked(i));

  /** Where a harvest lands on the chain. Scales with the seed so a fast cheap
      seed cannot out-feed a slow expensive one, and with rarity so the roll
      that already happens is worth watching. */
  function benchEntryTier(seedId, rarityKey) {
    const idx = DATA.seeds.findIndex((s) => s.id === seedId);
    const bucket = BENCH.seedBucket[idx] || 0;
    const bump = BENCH.rarityBump[rarityKey] || 0;
    return Math.min(benchTop(), bucket + bump);
  }

  function benchNeighbours(i) {
    const r = Math.floor(i / BENCH.cols);
    const c = i % BENCH.cols;
    const out = [];
    if (r > 0) out.push(i - BENCH.cols);
    if (r < BENCH.cols - 1) out.push(i + BENCH.cols);
    if (c > 0) out.push(i - 1);
    if (c < BENCH.cols - 1) out.push(i + 1);
    return out.filter(benchUnlocked);
  }

  /** Connected run of the same rung, breadth-first from `start`, so the item
      the player just moved is always first and is always the one that survives. */
  function benchGroup(start) {
    const seed = state.bench.cells[start];
    if (!seed) return [];
    const seen = new Set([start]);
    const queue = [start];
    const out = [];
    while (queue.length) {
      const i = queue.shift();
      out.push(i);
      benchNeighbours(i).forEach((n) => {
        const c = state.bench.cells[n];
        if (!seen.has(n) && c && c.tier === seed.tier) { seen.add(n); queue.push(n); }
      });
    }
    return out;
  }

  /** Exactly one merge, never a lookahead. A cascade is this called again, and
      the caller is what puts a beat between the rungs. */
  function benchMergeOnce(idx) {
    const here = state.bench.cells[idx];
    if (!here || here.tier >= benchTop()) return null;
    const group = benchGroup(idx);
    if (group.length < BENCH.merge) return null;

    const big = group.length >= BENCH.bonusAt;
    const eaten = group.slice(0, big ? BENCH.bonusAt : BENCH.merge);
    eaten.forEach((i) => { state.bench.cells[i] = null; });

    const tier = here.tier + 1;
    const made = [idx];
    state.bench.cells[idx] = { tier };
    if (big) {
      const spare = eaten.find((i) => i !== idx && !state.bench.cells[i]);
      if (spare !== undefined) { state.bench.cells[spare] = { tier }; made.push(spare); }
    }
    noteQuest('merge', BENCH.chain[tier].id, made.length);
    save();
    return { tier, at: idx, made, ate: eaten.length };
  }

  function benchAddToBasket(tier) {
    if (!benchDef(tier)) return false;
    if (state.bench.basket.length >= BENCH.basketMax) return false;
    state.bench.basket.push(tier);
    return true;
  }

  /** Move a basket item or a bench item onto an empty unlocked cell. Merging is
      never done here — the caller resolves it a rung at a time. */
  function benchPlace(from, srcIdx, dstIdx) {
    const b = state.bench;
    if (!benchUnlocked(dstIdx) || b.cells[dstIdx]) return false;
    if (from === 'basket') {
      const tier = b.basket[srcIdx];
      if (!benchDef(tier)) return false;
      b.basket.splice(srcIdx, 1);
      b.cells[dstIdx] = { tier };
    } else {
      const it = b.cells[srcIdx];
      if (!it || srcIdx === dstIdx) return false;
      b.cells[srcIdx] = null;
      b.cells[dstIdx] = it;
    }
    save();
    return true;
  }

  /** Pull an item off the bench into stock. This is the escape hatch: a full
      bench with no three alike adjacent has no other legal move at all. */
  function benchBank(idx) {
    const it = state.bench.cells[idx];
    if (!it) return null;
    const def = benchDef(it.tier);
    state.bench.cells[idx] = null;
    state.bench.stock[def.id] = (state.bench.stock[def.id] || 0) + 1;
    noteQuest('bank', def.id, 1);
    save();
    return def;
  }

  function benchExpandCost() {
    const step = state.bench.side - BENCH.startSide;
    return state.bench.side >= BENCH.cols ? 0 : Math.round(6000 * Math.pow(3.2, step));
  }

  function benchExpand() {
    if (state.bench.side >= BENCH.cols) return false;
    const cost = benchExpandCost();
    if (state.credits < cost) return false;
    state.credits -= cost;
    state.bench.side += 1;
    save();
    emit('panels');
    return true;
  }

  const benchUsed = () => state.bench.cells.filter((c, i) => c && benchUnlocked(i)).length;
  const benchCapacity = () => state.bench.side * state.bench.side;
  const benchStockOf = (id) => state.bench.stock[id] || 0;

  /* ---------------- apothecary ---------------- */

  /** Cheapest-first, so the valuable stock survives for direct sale. */
  function sortedByValue(bag, valueOf) {
    return Object.keys(bag).filter((k) => bag[k] > 0).sort((a, b) => valueOf(a) - valueOf(b));
  }

  function haveFor(need) {
    if (need.kind === 'wax') return state.apiary.wax >= need.qty;
    if (need.kind === 'flower') return flowerTotal() >= need.qty;
    if (need.of) return (state.apiary.honey[need.of] || 0) >= need.qty;
    return honeyTotal() >= need.qty;
  }

  const canCraft = (r) => Boolean(r) && r.needs.every(haveFor) && state.craft.length < CRAFT_SLOTS;

  function spend(need) {
    let left = need.qty;
    if (need.kind === 'wax') { state.apiary.wax -= need.qty; return; }
    if (need.kind === 'flower') {
      for (const id of sortedByValue(state.flowers, flowerValue)) {
        const take = Math.min(left, state.flowers[id]);
        state.flowers[id] -= take;
        if (!state.flowers[id]) delete state.flowers[id];
        left -= take;
        if (!left) break;
      }
      return;
    }
    if (need.of) {
      state.apiary.honey[need.of] -= need.qty;
      if (!state.apiary.honey[need.of]) delete state.apiary.honey[need.of];
      return;
    }
    for (const id of sortedByValue(state.apiary.honey, APIARY.honeyValue)) {
      const take = Math.min(left, state.apiary.honey[id]);
      state.apiary.honey[id] -= take;
      if (!state.apiary.honey[id]) delete state.apiary.honey[id];
      left -= take;
      if (!left) break;
    }
  }

  function startCraft(id) {
    const r = CRAFT_RECIPES.find((x) => x.id === id);
    if (!canCraft(r)) return false;
    r.needs.forEach(spend);
    state.craft.push({ id, doneAt: nowSeconds() + r.time });
    save();
    emit('currency');
    emit('panels');
    emit('craft', { id, def: r });
    return true;
  }

  function processCraft(now) {
    if (!state.craft.length) return;
    const done = state.craft.filter((c) => c.doneAt <= now);
    if (!done.length) return;
    state.craft = state.craft.filter((c) => c.doneAt > now);
    done.forEach((c) => { state.goods[c.id] = (state.goods[c.id] || 0) + 1; });
    save();
    emit('currency');
    emit('panels');
    emit('crafted', { items: done.map((c) => c.id) });
    done.forEach((c) => noteQuest('craft', c.id, 1));
  }

  /* Selling stands in for the order board until the Market exists. Orders are
     meant to pay well above these prices — see docs/13-order-system.md. */
  function sell(kind, key, all) {
    let unit = 0;
    let have = 0;
    if (kind === 'honey') { unit = APIARY.honeyValue(key); have = state.apiary.honey[key] || 0; }
    else if (kind === 'wax') { unit = APIARY.waxValue; have = state.apiary.wax; }
    else if (kind === 'flower') { unit = flowerValue(key); have = state.flowers[key] || 0; }
    else { const r = CRAFT_RECIPES.find((x) => x.id === key); unit = r ? r.value : 0; have = state.goods[key] || 0; }
    if (!have || !unit) return 0;

    const qty = all ? have : 1;
    if (kind === 'honey') { state.apiary.honey[key] -= qty; if (!state.apiary.honey[key]) delete state.apiary.honey[key]; }
    else if (kind === 'wax') state.apiary.wax -= qty;
    else if (kind === 'flower') { state.flowers[key] -= qty; if (!state.flowers[key]) delete state.flowers[key]; }
    else { state.goods[key] -= qty; if (!state.goods[key]) delete state.goods[key]; }

    const total = unit * qty;
    credit(total);
    save();
    emit('currency');
    emit('panels');
    emit('sell', { kind, key, qty, total });
    if (kind === 'flower') noteQuest('sell', key, qty);
    return total;
  }

  /* ---------------- the Garden Stand ---------------- */

  /* The order queue. Demand, which is the one thing this game has never had —
     every system so far produces, and nothing wanted any of it.

     Two rules from docs/13-order-system.md are load-bearing and both are
     asserted in tools/sim-test.js: an order NEVER asks for something the player
     cannot currently produce, and delivering ALWAYS beats selling the contents.
     Break either and the board becomes a wall instead of a goal. */

  const standTierDefs = () => STAND.tiers;
  const standTierAt = (rep) => {
    let out = STAND.tiers[0];
    STAND.tiers.forEach((t) => { if (rep >= t.rep) out = t; });
    return out;
  };
  const standTier = () => standTierAt(state.rep);

  /* What the player can actually grow right now. Keyed off seed unlocks rather
     than the pantry: an order for a bloom you own none of is a goal, an order
     for a bloom you cannot unlock is a wall. */
  const standFlowerPool = () => DATA.seeds.filter((sd) => seedUnlocked(sd.id)).map((sd) => sd.id);

  /* Honey needs a hive to exist at all, and a named jar needs a bloom that can
     fill it. `wildHoney` is deliberately excluded — "Wildflower Honey" as an
     order line reads as filler, and a named jar is the entire point. */
  const standHoneyPool = () => (hiveCount() > 0 ? standFlowerPool() : []);

  function standPoolFor(kind) {
    return kind === 'honey' ? standHoneyPool() : standFlowerPool();
  }

  /* A good is offerable only if every one of its lines can be filled from a
     distinct member of its pool. This is the anti-frustration rule in one
     function, and everything upstream of it just filters. */
  function standGoodOffered(good) {
    if (!good) return false;
    const want = {};
    good.needs.forEach((n) => {
      const kind = n.pool === 'honey' ? 'honey' : 'flower';
      want[kind] = (want[kind] || 0) + (n.any ? 0 : 1);
      if (n.any) want[kind] = Math.max(want[kind], 1);
    });
    return Object.keys(want).every((kind) => standPoolFor(kind).length >= want[kind]);
  }

  const standGoodsAt = (tier) => GOODS.filter((g) => g.tier <= tier && standGoodOffered(g));

  const standUnitValue = (kind, of) =>
    (kind === 'honey' ? APIARY.honeyValue(of) : flowerValue(of));

  /* A wild line ("a handful of whatever's blooming") names nothing, so it cannot
     be priced at generation time — the player might hand over daisies or
     Eternals. The card therefore quotes the FLOOR: the cheapest bloom they could
     legally fill it with. standDeliver() then re-prices against what was really
     spent and pays the larger of the two, so a wild line can be generous but
     never a swindle, and dumping expensive blooms into one gains nothing because
     the multiplier is identical either way. */
  function standFloorUnit(kind) {
    const pool = standPoolFor(kind);
    if (!pool.length) return standUnitValue(kind, null);
    return Math.min(...pool.map((id) => standUnitValue(kind, id)));
  }

  /* Reward maths. `varietyBonus` is the thumb on the scale that makes a
     multi-line order worth more than the sum of its parts — the reason an order
     spanning several blooms is the interesting one to fill. */
  function standPrice(needs, tierDef) {
    let base = 0;
    needs.forEach((n) => {
      const unit = n.any ? standFloorUnit(n.kind) : standUnitValue(n.kind, n.of);
      base += unit * n.qty * (n.any ? STAND.wildBonus : 1);
    });
    const variety = 1 + STAND.varietyBonus * Math.max(0, needs.length - 1);
    return {
      coins: Math.max(1, Math.round(base * tierDef.mult * variety)),
      rep: Math.max(1, Math.round(tierDef.repPay * needs.length))
    };
  }

  /* Deliberately biased toward blooms the player has actually grown, so the
     board reads as "someone noticed your garden" rather than a random quota.
     Never a hard filter, or a new seed would never be asked for. */
  function standPickFrom(pool, taken) {
    const free = pool.filter((id) => !taken.includes(id));
    const from = free.length ? free : pool;
    const known = from.filter((id) => (state.discovered[id] || 0) > 0);
    const bag = known.length && Math.random() < 0.75 ? known : from;
    return bag[Math.floor(Math.random() * bag.length)];
  }

  function standRoll(range) {
    const lo = range[0];
    const hi = range[1];
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function standBuildOrder(good, tierDef, avoid) {
    const taken = [];
    const needs = [];
    for (const n of good.needs) {
      const kind = n.pool === 'honey' ? 'honey' : 'flower';
      const pool = standPoolFor(kind);
      if (!pool.length) return null;
      if (n.any) {
        needs.push({ kind, of: null, any: true, qty: standRoll(n.qty) });
      } else {
        // Steer off blooms the other slots are already asking for, so the board
        // does not demand the same thing three times.
        const shy = pool.filter((id) => !avoid.includes(id) && !taken.includes(id));
        const of = shy.length ? standPickFrom(shy, []) : standPickFrom(pool, taken);
        taken.push(of);
        needs.push({ kind, of, any: false, qty: standRoll(n.qty) });
      }
    }
    const pay = standPrice(needs, tierDef);
    state.stand.seq += 1;
    return {
      id: 'o' + state.stand.seq,
      good: good.id,
      customer: standPickCustomer(tierDef.tier),
      needs,
      coins: pay.coins,
      rep: pay.rep,
      at: nowSeconds()
    };
  }

  function standPickCustomer(tier) {
    const eligible = CUSTOMERS.filter((c) => c.minTier <= tier);
    const here = standOrders().map((o) => o.customer);
    const free = eligible.filter((c) => !here.includes(c.id));
    const bag = free.length ? free : eligible;
    return bag[Math.floor(Math.random() * bag.length)].id;
  }

  function standGenerate(slot) {
    const tierDef = standTier();
    const pool = standGoodsAt(tierDef.tier);
    if (!pool.length) return null;
    // Bias toward the top of what is unlocked, so the board grows up with the
    // player instead of staying full of posies forever.
    const here = standOrders().map((o) => o.good);
    const fresh = pool.filter((g) => !here.includes(g.id));
    const bag = fresh.length ? fresh : pool;
    const good = bag[Math.floor(Math.random() * bag.length)];
    const avoid = standOrders().flatMap((o) => o.needs.map((n) => n.of).filter(Boolean));
    const order = standBuildOrder(good, tierDef, avoid);
    if (order) {
      order.slot = slot;
      state.stand.slots[slot] = order;
      state.stand.nextAt[slot] = 0;
    }
    return order;
  }

  const standOrders = () => state.stand.slots.filter(Boolean);
  const standOrderAt = (slot) => state.stand.slots[slot] || null;

  const standHave = (need) => (need.kind === 'honey'
    ? (need.any ? honeyTotal() : (state.apiary.honey[need.of] || 0))
    : (need.any ? flowerTotal() : (state.flowers[need.of] || 0)));

  const standNeedMet = (need) => standHave(need) >= need.qty;
  const standCanDeliver = (order) => Boolean(order) && order.needs.every(standNeedMet);

  /* Progress across the whole order, for a bar that means something at a glance. */
  function standProgress(order) {
    if (!order) return 0;
    let want = 0;
    let got = 0;
    order.needs.forEach((n) => {
      want += n.qty;
      got += Math.min(n.qty, standHave(n));
    });
    return want ? got / want : 0;
  }

  /* Returns the raw value of what it actually spent, so delivery can re-price a
     wild line against reality. */
  function standTakeNeed(need) {
    let spent = 0;
    if (need.kind === 'honey') {
      if (!need.any) {
        state.apiary.honey[need.of] -= need.qty;
        if (!state.apiary.honey[need.of]) delete state.apiary.honey[need.of];
        return APIARY.honeyValue(need.of) * need.qty;
      }
      let left = need.qty;
      // sortedByValue is ascending, so this spends the cheapest first — an "any"
      // line must never quietly eat the rare jar being saved for a named order.
      for (const id of sortedByValue(state.apiary.honey, APIARY.honeyValue)) {
        if (left <= 0) break;
        const take = Math.min(left, state.apiary.honey[id]);
        state.apiary.honey[id] -= take;
        if (!state.apiary.honey[id]) delete state.apiary.honey[id];
        left -= take;
        spent += APIARY.honeyValue(id) * take;
      }
      return spent;
    }
    if (!need.any) {
      state.flowers[need.of] -= need.qty;
      if (!state.flowers[need.of]) delete state.flowers[need.of];
      return flowerValue(need.of) * need.qty;
    }
    let left = need.qty;
    for (const id of sortedByValue(state.flowers, flowerValue)) {
      if (left <= 0) break;
      const take = Math.min(left, state.flowers[id]);
      state.flowers[id] -= take;
      if (!state.flowers[id]) delete state.flowers[id];
      left -= take;
      spent += flowerValue(id) * take;
    }
    return spent;
  }

  function standDeliver(slot) {
    const order = standOrderAt(slot);
    if (!standCanDeliver(order)) return null;
    const tierDef = standTierAt(state.rep);
    let spent = 0;
    order.needs.forEach((need) => {
      // The wild discount has to survive the re-price, or quoting a floor would
      // hand it straight back and "any" would become the best line in the game.
      spent += standTakeNeed(need) * (need.any ? STAND.wildBonus : 1);
    });
    // Re-price against what was really handed over, and pay the better of the
    // two. The card's number is a floor the player can trust, never a ceiling.
    const variety = 1 + STAND.varietyBonus * Math.max(0, order.needs.length - 1);
    const worth = Math.round(spent * tierDef.mult * variety);
    const paid = Math.max(order.coins, worth);
    order.paid = paid;
    credit(paid);
    state.year.stats.orders += 1;
    /* addRep() hands back the level grants but does not announce them — every
       caller emits its own, and a delivery that levelled you up in silence would
       lose the biggest moment in the game. */
    const grants = addRep(order.rep);
    if (grants.length) emit('levelup', { from: grants[0].level - 1, to: state.level, grants });
    state.stand.slots[slot] = null;
    state.stand.nextAt[slot] = nowSeconds() + STAND.refill;
    state.stand.delivered += 1;
    noteQuest('order', order.good, 1);
    save();
    emit('currency');
    emit('panels');
    emit('order', { order, grants, paid });
    return { order, grants, paid };
  }

  /* Skipping is free and always available. Township's rule, and the single most
     load-bearing line in the order spec: it turns "I do not have that" from a
     wall into a choice. Never price the refresh. */
  function standSkip(slot) {
    const order = standOrderAt(slot);
    if (!order) return false;
    state.stand.slots[slot] = null;
    state.stand.nextAt[slot] = nowSeconds() + STAND.refill;
    state.stand.skipped += 1;
    save();
    emit('panels');
    emit('orderSkip', { order });
    return true;
  }

  const standRefillIn = (slot) =>
    (state.stand.slots[slot] ? 0 : Math.max(0, (state.stand.nextAt[slot] || 0) - nowSeconds()));

  /* Derived from an absolute timestamp, like every other clock in this game, so
     time away counts for free and nothing has to be replayed. */
  function processStand() {
    const now = nowSeconds();
    let changed = false;
    for (let i = 0; i < STAND.slots; i += 1) {
      if (state.stand.slots[i]) continue;
      if (!state.stand.nextAt[i]) { state.stand.nextAt[i] = now; }
      if (state.stand.nextAt[i] <= now && standGenerate(i)) changed = true;
    }
    if (changed) emit('panels');
    return changed;
  }

  /* ---------------- Fall — the hour-class garden ----------------

     Opens at Turn 1. The garden's own grammar — eight plots, the flower in
     the middle — on a different clock class and a different twist: the bed
     pays together. Crops are NOT flowers: no rarity, no mutations, no gems,
     no `discovered`, no pantry, no bench. The windfall is Fall's juice.

     Phase 1 ships this as pure simulation; the board renders in phase 3. */

  const FALL = () => DATA.fall;
  const fallPlantById = (id) => FALL().plants.find((p) => p.id === id) || null;
  const fallOpen = () => state.year.turnsCompleted >= YEAR().fallTurn;
  const fallCell = (i) => state.fall.grid[i] || null;
  const fallCellIsCentury = (c) => {
    const d = c && c.seed ? fallPlantById(c.seed) : null;
    return Boolean(d && d.century);
  };
  const fallCenturyGrowing = () => state.fall.grid.some(fallCellIsCentury);

  /* The bed, for windfall purposes: every plot except one holding a Century
     Bloom. A 14-day plant must not park the windfall, so it neither blocks
     nor collects it. */
  const fallBedCells = () => state.fall.grid.filter((c) => !fallCellIsCentury(c));

  function fallPlant(idx, plantId) {
    if (!fallOpen()) return false;
    const def = fallPlantById(plantId);
    const cell = fallCell(idx);
    if (!def || !cell || cell.seed) return false;
    /* One Century Bloom at a time — it is a showpiece, not a strategy. */
    if (def.century && fallCenturyGrowing()) return false;
    if (state.credits < def.cost) {
      emit('deny', { reason: 'credits', need: def.cost });
      return false;
    }
    state.credits -= def.cost;
    cell.seed = def.id;
    cell.plantedAt = nowSeconds();
    cell.grow = def.grow;
    cell.ready = false;
    cell.windfall = false;
    save();
    emit('currency');
    emit('fallPlant', { idx, plant: def });
    return true;
  }

  /** Arm the windfall the moment the whole bed stands planted and ripe.
      Marks land per-cell so a plot replanted mid-collection joins the next
      fill, not this one — and `bedPaid` holds until the bed empties, which is
      what makes the windfall once per fill. */
  function checkFallWindfall() {
    if (state.fall.bedPaid) return false;
    const bed = fallBedCells();
    if (!bed.length || !bed.every((c) => c.seed && c.ready)) return false;
    bed.forEach((c) => { c.windfall = true; });
    state.fall.bedPaid = true;
    state.year.stats.windfalls += 1;
    save();
    emit('windfall', { plots: bed.length });
    return true;
  }

  function processFall(now) {
    let ripened = false;
    state.fall.grid.forEach((cell, i) => {
      if (!cell.seed) { cell.ready = false; return; }
      const was = cell.ready;
      cell.ready = now - cell.plantedAt >= cell.grow;
      if (cell.ready && !was) { ripened = true; emit('fallReady', { idx: i }); }
    });
    if (ripened) checkFallWindfall();
  }

  function fallHarvest(idx) {
    const cell = fallCell(idx);
    if (!cell || !cell.seed) return null;
    const def = fallPlantById(cell.seed);
    if (!def || nowSeconds() - cell.plantedAt < cell.grow) return null;
    cell.ready = true;
    /* A bed that completed while the tab was shut still pays — arm before paying. */
    checkFallWindfall();
    const windfall = Boolean(cell.windfall) && !def.century;
    const payout = Math.round(def.yield * (windfall ? 1 + FALL().windfall : 1));
    credit(payout);
    cell.seed = null;
    cell.plantedAt = 0;
    cell.grow = 0;
    cell.ready = false;
    cell.windfall = false;
    /* The fill-cycle resets when the bed empties. */
    if (fallBedCells().every((c) => !c.seed)) state.fall.bedPaid = false;
    save();
    emit('currency');
    const payload = { idx, payout, plant: def, windfall, century: Boolean(def.century) };
    emit('fallHarvest', payload);
    /* Crops count generic harvest tracks and nothing else — a keyed quest
       names a flower, and a crop id can never match one. */
    noteQuest('harvest', def.id, 1);
    return payload;
  }

  /* ---------------- the Turn — prestige ----------------

     The year's whole earnings mint Saved Seeds, once, at the Turn. Invited
     never forced: two gates decide when the invitation stands, and nothing
     ever turns the year for you. Design in docs/32-the-garden-year.md,
     numbers in docs/33-year-one-economy.md. */

  /** Species-this-year counter for the Tally. Year-scoped on purpose — the
      Tally must never read a lifetime record. */
  function noteYearSpecies(seedId) {
    const s = state.year.stats;
    if (s.speciesSeen[seedId]) return;
    s.speciesSeen[seedId] = true;
    s.species += 1;
  }

  /** The Tally: each line reads one year-scoped counter, tier bonuses within
      a line accumulate, lines sum, and the multiplier clamps at tallyCap. A
      line that scored no bonus is not returned at all — the Tally only
      celebrates, so there is no "×1.00, you failed" row to render. */
  function projectedTally() {
    const s = state.year.stats;
    const lines = [];
    let sum = 0;
    (YEAR().tally || []).forEach((line) => {
      const count = Math.max(0, Number(s[line.stat]) || 0);
      let bonus = 0;
      let tier = 0;
      (line.tiers || []).forEach((t) => { if (count >= t.at) { bonus += t.bonus; tier += 1; } });
      if (!tier) return;
      lines.push({ id: line.id, label: line.label, count, bonus, tier });
      sum += bonus;
    });
    return { lines, sum, mult: Math.min(YEAR().tallyCap, 1 + sum) };
  }

  /** What the Turn would mint right now. Reads the earnings accumulator and
      nothing else — never the balance, so spending is provably seed-neutral. */
  function projectedMint() {
    const tally = projectedTally();
    const base = YEAR().mintK * Math.sqrt(Math.max(0, state.year.coinsEarned))
      * (1 + YEAR().veterancy * state.year.turnsCompleted);
    return { base, tally, pouch: Math.round(base * tally.mult) };
  }

  /** Both gates: projected mint AND a coins floor. The floor is what keeps
      many-cheap-Turns-a-day unprofitable. */
  function turnReady() {
    return projectedMint().pouch >= YEAR().minSeeds
      && state.year.coinsEarned >= YEAR().minCoins;
  }

  /** The Turn, atomic: collect, bank, mint, bless, clear, roll over, save —
      in one commit, so a Turn can never half-happen. Everything not cleared
      here survives verbatim; that rule generates sim-test bill item 1. */
  function turnYear(blessedId) {
    if (!turnReady()) return null;
    const now = nowSeconds();

    /* In-flight rules, so nothing is ever silently eaten. A ready bloom is
       auto-collected through the real harvest path and paid into the year
       BEFORE the mint; an unopened pack is banked; a growing annual is the
       one thing the Turn takes, and the ask says so before it happens. */
    let collected = 0;
    state.grid.forEach((cell, idx) => {
      if (cell.locked || !cell.seed) return;
      if (now - cell.plantedAt >= cell.grow && harvest(idx)) collected += 1;
    });
    let bankedPacks = 0;
    state.grid.forEach((cell) => {
      if (!cell.packDrop) return;
      cell.packDrop = false;
      state.packs += 1;
      bankedPacks += 1;
    });

    /* The mint. */
    const minted = projectedMint();
    state.savedSeeds += minted.pouch;

    /* The blessing: one free Rich Bloom petal on a chosen flower, written
       like any bought petal, recorded for provenance. */
    let blessed = null;
    if (blessedId && seedIndexOf(blessedId) >= 0
      && petalsOf(blessedId).rich < PETALS().shared.rich.cap) {
      if (!state.petals[blessedId]) state.petals[blessedId] = { rich: 0, quick: 0, sig: 0 };
      state.petals[blessedId].rich += 1;
      state.blessed.push({ seed: blessedId, year: state.year.number });
      blessed = blessedId;
    }

    /* The clears — the fast annuals in the main garden only. Fall, Winter
       and every running long timer anywhere are never touched. Plots 5–8
       close for the gold rebuy; a still-locked plot just stays locked. */
    state.grid.forEach((cell, idx) => {
      state.grid[idx] = {
        locked: cell.locked || plotUnlockLevel(idx) > 1,
        seed: null, plantedAt: 0, grow: 0, ready: false, aura: '',
        luckyBug: false, mutation: null, mutateAt: 0, packDrop: false
      };
    });

    const d = defaultState();
    /* Gold zeroes to the fresh-game purse — after the mint, which read
       earnings and so never cared what was left in the wallet. */
    state.credits = d.credits;
    /* Every badge resets; the rebuild is the ritual. The tap fields those
       badges had written are re-derived immediately after the wipe, and the
       combo zeroes with the board. An active boost or called sky is left to
       expire on its own clock; the held inventory clears. */
    Object.keys(state.upgrades).forEach((k) => { state.upgrades[k] = 0; });
    state.tap.power = d.tap.power;
    state.tap.critChance = d.tap.critChance;
    state.tap.critMult = d.tap.critMult;
    state.tap.comboMax = d.tap.comboMax;
    state.tap.holdInterval = d.tap.holdInterval;
    state.tap.combo = 0;
    DATA.boosters.forEach((b) => { state.boostInv[b.id] = 0; });
    lastAutoHarvest = 0;

    /* The year rolls over before the Stand refills, so the fresh slots are
       generated against the new year's truth. */
    state.year.number += 1;
    state.year.turnsCompleted += 1;
    state.year.coinsEarned = 0;
    state.year.stats = d.year.stats;

    /* Every slot regenerates so no standing order names a bloom the fresh
       year cannot yet grow — the pool reads seedUnlocks, which survive. */
    for (let i = 0; i < STAND.slots; i += 1) {
      state.stand.slots[i] = null;
      state.stand.nextAt[i] = now;
      standGenerate(i);
    }

    saveNow();
    emit('currency');
    emit('grid');
    emit('panels');
    const payload = {
      pouch: minted.pouch,
      base: minted.base,
      tally: minted.tally,
      blessed,
      collected,
      bankedPacks,
      year: state.year.number,
      turnsCompleted: state.year.turnsCompleted,
      fallOpens: state.year.turnsCompleted === YEAR().fallTurn
    };
    emit('turn', payload);
    return payload;
  }

  /* ---------------- shop ---------------- */
  const HOLD_INTERVAL_MIN = 180; // floor, ms — never faster than a fast manual tap
  const HOLD_INTERVAL_STEP = 60; // ms shaved off per level
  const AUTO_WATER_MAX_LEVEL = 10;  // 1%/level, so this caps growth speed at +10%
  const RAIN_DANCE_MAX_LEVEL = 10;  // 1%/level, caps trigger chance at 10%
  const BEE_SWARM_MAX_LEVEL = 5;    // a free jar is worth more than a grow-time shave, so a lower cap
  const LADYBUG_MAX_LEVEL = 8;      // 1%/level, caps trigger chance at 8%

  /** Simple "own it, level it, cap it" shape shared by the tap-triggered proc badges. */
  const cappedUpgrade = (key, max) => () => {
    if (state.upgrades[key] >= max) return false;
    state.upgrades[key] += 1;
    return true;
  };

  const UPGRADE_EFFECTS = {
    tapPower: () => { state.upgrades.tapPower += 1; state.tap.power += 1; return true; },
    holdSpeed: () => {
      if (state.tap.holdInterval <= HOLD_INTERVAL_MIN) return false;
      state.upgrades.holdSpeed += 1;
      state.tap.holdInterval = Math.max(HOLD_INTERVAL_MIN, state.tap.holdInterval - HOLD_INTERVAL_STEP);
      return true;
    },
    critChance: () => { state.upgrades.critChance += 1; state.tap.critChance += 0.01; return true; },
    critMult: () => { state.upgrades.critMult += 1; state.tap.critMult = Math.min(50, state.tap.critMult + 2); return true; },
    comboMeter: () => { state.upgrades.comboMeter += 1; state.tap.comboMax = Math.min(100, state.tap.comboMax + 10); return true; },
    rainDance: cappedUpgrade('rainDance', RAIN_DANCE_MAX_LEVEL),
    beeSwarm: cappedUpgrade('beeSwarm', BEE_SWARM_MAX_LEVEL),
    ladybug: cappedUpgrade('ladybug', LADYBUG_MAX_LEVEL),
    plotExpansion: () => {
      const unlocked = unlockNextPlots(2);
      if (unlocked > 0) { state.upgrades.plotExpansion += 1; return true; }
      return false;
    },
    autoWater: cappedUpgrade('autoWater', AUTO_WATER_MAX_LEVEL),
    autoHarvest: () => { state.upgrades.autoHarvest += 1; return true; },
    offlineRate: cappedUpgrade('offlineRate', OFFLINE_RATE_MAX),
    offlineHours: cappedUpgrade('offlineHours', OFFLINE_HOURS_MAX)
  };
  PLOT_AUTOPLANTERS.forEach(({ key }) => {
    UPGRADE_EFFECTS[key] = () => { state.upgrades[key] += 1; return true; };
  });

  const upgradeMaxed = (key) => {
    if (key === 'plotExpansion') return !state.grid.some((c, i) => c.locked && plotAvailable(i));
    if (key === 'holdSpeed') return state.tap.holdInterval <= HOLD_INTERVAL_MIN;
    if (key === 'autoWater') return state.upgrades.autoWater >= AUTO_WATER_MAX_LEVEL;
    if (key === 'rainDance') return state.upgrades.rainDance >= RAIN_DANCE_MAX_LEVEL;
    if (key === 'beeSwarm') return state.upgrades.beeSwarm >= BEE_SWARM_MAX_LEVEL;
    if (key === 'ladybug') return state.upgrades.ladybug >= LADYBUG_MAX_LEVEL;
    if (key === 'offlineRate') return state.upgrades.offlineRate >= OFFLINE_RATE_MAX;
    if (key === 'offlineHours') return state.upgrades.offlineHours >= OFFLINE_HOURS_MAX;
    return false;
  };

  function buyUpgrade(key) {
    if (upgradeMaxed(key)) return false;
    const cost = upgradePrice(key);
    if (state.credits < cost) { emit('deny', { reason: 'credits', need: cost }); return false; }
    state.credits -= cost;
    const ok = UPGRADE_EFFECTS[key]();
    if (ok === false) { credit(cost, { refund: true }); return false; }
    save();
    emit('currency');
    emit('purchase', { kind: 'upgrade', key, cost });
    emit('panels');
    if (key === 'plotExpansion') emit('grid');
    noteQuest('upgrade', key, 1);
    return true;
  }

  function buyDecor(id) {
    const d = DATA.decor.find((x) => x.id === id);
    if (!d) return false;
    const pot = d.currency === 'gems' ? state.gems : state.credits;
    if (pot < d.cost) { emit('deny', { reason: d.currency, need: d.cost }); return false; }
    if (d.currency === 'gems') state.gems -= d.cost;
    else state.credits -= d.cost;
    state.decor.push({ id: d.id });
    save();
    emit('currency');
    emit('purchase', { kind: 'decor', key: id, def: d });
    emit('panels');
    return true;
  }

  function activateBoost(id) {
    const b = DATA.boosters.find((x) => x.id === id);
    if (!b) return false;
    if (activeBoost(b.id)) return false;
    const held = (state.boostInv && state.boostInv[id]) || 0;
    if (held < 1) return false;
    state.boostInv[id] = held - 1;
    state.boosters[b.id] = nowSeconds() + b.dur;
    save();
    emit('currency');
    emit('purchase', { kind: 'booster', key: id, def: b });
    emit('panels');
    return true;
  }

  const decorCount = (id) => state.decor.filter((d) => d.id === id).length;

  /* ---------------- automation + tick ---------------- */
  function processAutoHarvest(now) {
    const level = state.upgrades.autoHarvest;
    if (!level) return;
    const cadence = Math.max(0.7, 3 - level * 0.5);
    if (now - lastAutoHarvest < cadence) return;
    const target = state.grid.findIndex((cell) => !cell.locked && cell.seed && cell.ready);
    if (target === -1) return;
    lastAutoHarvest = now;
    harvest(target);
  }

  function processAutoPlant() {
    PLOT_AUTOPLANTERS.forEach(({ key, idx }) => {
      const level = state.upgrades[key];
      if (!level) return;
      const cell = state.grid[idx];
      if (!cell || cell.locked || cell.seed) return;
      const maxSeedIndex = Math.min(level - 1, highestUnlockedSeedIndex(), DATA.seeds.length - 1);
      let chosen = null;
      for (let i = maxSeedIndex; i >= 0; i -= 1) {
        if (state.credits >= DATA.seeds[i].cost) { chosen = DATA.seeds[i]; break; }
      }
      if (chosen) plant(idx, chosen, true);
    });
  }

  function removeExpiredBoosters() {
    const now = nowSeconds();
    let changed = false;
    for (const [id, until] of Object.entries(state.boosters)) {
      if (until <= now) { delete state.boosters[id]; changed = true; }
    }
    if (changed) emit('panels');
  }

  let wonderWasActive = false;
  function tick(dt) {
    const now = nowSeconds();
    removeExpiredBoosters();
    processWeather();

    const wa = wonderActive();
    if (wonderWasActive && !wa) emit('wonder', { active: false });
    wonderWasActive = wa;

    // Wonder accelerates everything still in the ground.
    if (wa) {
      state.grid.forEach((cell) => {
        if (!cell.seed || cell.ready) return;
        const elapsed = Math.max(0, now - cell.plantedAt);
        const remain = Math.max(0, cell.grow - elapsed);
        if (remain <= 0) return;
        cell.grow = elapsed + Math.max(0, remain - dt * (WONDER.growMult - 1));
      });
    }

    // readiness flags
    state.grid.forEach((cell, i) => {
      if (cell.locked || !cell.seed) { cell.ready = false; return; }
      const wasReady = cell.ready;
      cell.ready = now - cell.plantedAt >= cell.grow;
      if (cell.ready && !wasReady) emit('ready', { idx: i });
    });

    processAutoHarvest(now);
    processAutoPlant();
    produceHoney(now);
    processCraft(now);
    processStand();
    processFall(now);
    refreshDaily();
  }

  function progressOf(cell) {
    if (!cell || !cell.seed) return 0;
    const duration = cell.grow > 0 ? cell.grow : 1;
    return Math.min(1, Math.max(0, (nowSeconds() - cell.plantedAt) / duration));
  }

  function remainingOf(cell) {
    if (!cell || !cell.seed) return 0;
    return Math.max(0, cell.grow - (nowSeconds() - cell.plantedAt));
  }

  ensureProgression();

  /* ---------------- development tools ---------------- */

  const Dev = {
    /* Weather is sticky so the sky can be held while animations are inspected. */
    setWeather(id) {
      dev.weather = id || null;
      emit('weather', { weather: currentWeather() });
      return currentWeather();
    },
    weatherOverride: () => dev.weather,

    /** Drop a mutation onto a growing plot and fire the real celebration. */
    mutate(id) {
      if (!DATA.mutations[id]) return null;
      const idx = state.grid.findIndex((c) => !c.locked && c.seed && !c.ready);
      if (idx === -1) return null;
      state.grid[idx].mutation = id;
      state.grid[idx].mutateAt = 0;
      save();
      const caught = [{ idx, mutation: id, weather: currentWeather(), seed: seedById(state.grid[idx].seed) }];
      emit('mutate', { caught });
      return caught[0];
    },

    /** Arm the next harvest. Consumed by harvest() itself, so the whole payout path runs. */
    armRarity(key) { dev.rarity = key; return key; },
    armGem() { dev.gem = true; return true; },

    /** Hold a proc at a high rate so it can be watched across many ordinary taps. */
    toggleProc(key) {
      dev.boost[key] = !dev.boost[key];
      return dev.boost[key];
    },
    boostedProcs: () => Object.keys(dev.boost).filter((k) => dev.boost[k]),
    procChance,

    /** Force a tap proc once, then take a real tap so it fires through tapFlower(). */
    fireProc(key) {
      dev.procs[key] = true;
      const r = tapFlower();
      dev.procs[key] = false;
      return r;
    },

    /** Fill every open plot with the priciest seed the player can actually plant. */
    fillGarden() {
      let n = 0;
      state.grid.forEach((cell, idx) => {
        if (cell.locked || cell.seed) return;
        const pick = DATA.seeds.filter((sd) => seedUnlocked(sd.id)).pop();
        if (pick && plant(idx, pick, false)) n += 1;
      });
      return n;
    },

    /** Bring everything in the ground to ripe, so harvest animations can be inspected. */
    ripenAll() {
      let n = 0;
      state.grid.forEach((cell) => {
        if (cell.locked || !cell.seed || cell.ready) return;
        cell.plantedAt = nowSeconds() - cell.grow - 1;
        n += 1;
      });
      save();
      emit('panels');
      return n;
    },

    grantLevels(n) {
      const grants = addRep(cumulativeRep(state.level + n) - state.rep);
      save();
      emit('currency');
      if (grants.length) emit('levelup', { from: grants[0].level - 1, to: state.level, grants });
      return state.level;
    },

    /* Wind the world back by n hours rather than winding `lastSeen` forward, so plots really do
       mature, mutation moments really do come due, and hives really do fill — the report is then
       produced by the same reconcile() a genuine absence would run. */
    simulateAway(hours) {
      const back = Math.max(0, hours) * 3600;
      if (!back) return null;
      state.grid.forEach((cell) => {
        if (cell.locked || !cell.seed) return;
        cell.plantedAt -= back;
        if (cell.mutateAt) cell.mutateAt -= back;
      });
      hiveCells().forEach((i) => { state.apiary.cells[i].at -= back; });
      state.lastSeen = nowSeconds() - back;
      const report = reconcile();
      emit('panels');
      return report;
    },

    /* Wind the creature clocks BACK rather than the world forward, so a four-hour
       awake window can be watched running out without waiting four hours. This is
       the real mechanism — sleeping is derived from `fedUntil` against now, so
       moving it is exactly what the passage of time does. */
    drainCritters(hours) {
      const back = Math.max(0, Number(hours) || 0) * 3600;
      if (!back) return 0;
      let n = 0;
      CREATURES.forEach((def) => {
        const home = critterHome(def.id);
        if (!home) return;
        home.fedUntil = Math.max(0, (home.fedUntil || 0) - back);
        n += 1;
      });
      if (n) { save(); emit('panels'); }
      return n;
    },

    /** Empty everyone's clocks this instant. Reads the clock rather than
        `critterAsleep()`, which is about tenders — a rested creature still gets
        drained, so swapping it in shows it needing food. */
    sleepCritters() {
      let n = 0;
      CREATURES.forEach((def) => {
        const home = critterHome(def.id);
        if (!home || !home.fedUntil) return;
        home.fedUntil = 0;
        n += 1;
      });
      if (n) { save(); emit('panels'); }
      return n;
    },

    /** The way back: buy the best food for everyone tending, through the real
        purchase path rather than by writing the clocks, so the wake-up beat and
        the spend are the ones a player gets. */
    feedCritters() {
      const food = CREATURE_FOOD[CREATURE_FOOD.length - 1];
      let n = 0;
      CREATURES.forEach((def) => {
        if (!critterTending(def.id)) return;
        credit(food.cost, { cheat: true });
        if (feedCritter(def.id, food.id)) n += 1;
        else state.credits -= food.cost;
      });
      return n;
    },

    /** Drop a pack onto a plot so the collect beat can be inspected without waiting on the roll. */
    dropPack() {
      dev.procs.cardPack = true;
      const r = rollCardPack();
      dev.procs.cardPack = false;
      if (r) { save(); emit('panels'); }
      return r;
    },

    /** Hand over a card. `rarity` narrows it; otherwise anything still missing. */
    grantCard(rarity) {
      const pool = [];
      ALBUM.sets.forEach((set) => set.cards.forEach((c) => {
        if (rarity && c.rarity !== rarity) return;
        pool.push(c);
      }));
      if (!pool.length) return null;
      const missing = pool.filter((c) => !hasCard(c.id));
      const from = missing.length ? missing : pool;
      const card = from[Math.floor(Math.random() * from.length)];
      const set = setOfCard(card.id);
      const wasComplete = setComplete(set.id);
      const isNew = !hasCard(card.id);
      state.cards[card.id] = cardCount(card.id) + 1;
      const completed = isNew && !wasComplete && setComplete(set.id);
      if (completed && state.setsClaimed.indexOf(set.id) === -1) state.setsClaimed.push(set.id);
      save();
      emit('panels');
      return { card, set, isNew, copies: cardCount(card.id), completedSet: completed };
    },

    /** Fill the first unfinished set, to reach the completion beat directly. */
    completeSet() {
      const set = ALBUM.sets.find((x) => !setComplete(x.id));
      if (!set) return null;
      set.cards.forEach((c) => { if (!hasCard(c.id)) state.cards[c.id] = 1; });
      if (state.setsClaimed.indexOf(set.id) === -1) state.setsClaimed.push(set.id);
      save();
      emit('panels');
      return set;
    },

    /* ---- the Garden Year's drivers ----
       Every one forces the real path: grants go through credit(), the Turn
       runs turnYear(), petals are bought with buyPetal(). The one deliberate
       split: grantGold is a CHEAT (gold only, the meter does not move) while
       driveYear simulates legitimate earning (gold AND the meter), which is
       how a whole year is driven in five minutes without contaminating what
       "cheated gold never reaches the mint" is protecting. */

    /** The cheat buttons' faucet. Flagged, so the pouch never sees it. */
    grantGold(n) {
      credit(Math.max(0, Math.round(Number(n) || 0)), { cheat: true });
      save();
      emit('currency');
      return state.credits;
    },

    /** Simulate the year having EARNED this much — the meter driver. */
    driveYear(coins) {
      credit(Math.max(0, Math.round(Number(coins) || 0)));
      save();
      emit('currency');
      return state.year.coinsEarned;
    },

    /** Write the Tally's counters directly, to inspect lines and tiers. */
    setYearStats(stats) {
      const s = state.year.stats;
      ['orders', 'windfalls', 'species', 'legendaries', 'bestCombo'].forEach((k) => {
        if (stats && typeof stats[k] === 'number') s[k] = Math.max(0, Math.round(stats[k]));
      });
      save();
      return { ...s };
    },

    /** The whole projection at a glance, gates included. */
    projectTurn() {
      const p = projectedMint();
      return {
        ...p,
        ready: turnReady(),
        coinsEarned: state.year.coinsEarned,
        minSeeds: YEAR().minSeeds,
        minCoins: YEAR().minCoins,
        turnsCompleted: state.year.turnsCompleted
      };
    },

    /** Run the Turn through the one real path. */
    runTurn(blessedId) {
      const r = turnYear(blessedId);
      if (r) emit('panels');
      return r;
    },

    /** Saved Seeds for petal testing, outside the mint on purpose. */
    grantSeeds(n) {
      state.savedSeeds += Math.max(0, Math.round(Number(n) || 0));
      save();
      emit('currency');
      emit('panels');
      return state.savedSeeds;
    },

    /** Wind Fall's clocks back so the bed ripens now — the ripenAll shape. */
    ripenFall() {
      let n = 0;
      state.fall.grid.forEach((cell) => {
        if (!cell.seed || cell.ready) return;
        cell.plantedAt = nowSeconds() - cell.grow - 1;
        n += 1;
      });
      if (n) {
        processFall(nowSeconds());
        save();
        emit('panels');
      }
      return n;
    },

    /** Fill Fall's open plots with the cheapest crop, paid for, so the
        windfall cycle can be driven end to end. */
    fillFall() {
      if (!fallOpen()) return 0;
      const cheapest = FALL().plants.filter((p) => !p.century)
        .reduce((a, b) => (a.cost <= b.cost ? a : b));
      let n = 0;
      state.fall.grid.forEach((cell, idx) => {
        if (cell.seed) return;
        credit(cheapest.cost, { cheat: true });
        if (fallPlant(idx, cheapest.id)) n += 1;
        else state.credits -= cheapest.cost;
      });
      return n;
    },

    clearAll() {
      dev.rarity = null;
      dev.gem = false;
      dev.weather = null;
      dev.procs = {};
      dev.boost = {};
      emit('weather', { weather: currentWeather() });
    },

    pending: () => ({ rarity: dev.rarity, gem: dev.gem, weather: dev.weather, boost: Object.keys(dev.boost).filter((k) => dev.boost[k]) })
  };

  return {
    state, on, emit, load, save, saveNow, reset, nowSeconds,
    credit,
    seedUnlockPrice, unlockSeed,
    petalsOf, petalCost, buyPetal, petalMult, petalGrowMult,
    fallOpen, fallPlantById, fallCell, fallCenturyGrowing, fallPlant, fallHarvest,
    processFall, checkFallWindfall,
    projectedTally, projectedMint, turnReady, turnYear,
    seedById, activeBoost, boostVal, growModifier, rollRarity,
    plotUnlockCost, upgradePrice, upgradeMaxed, decorCount,
    tapFlower, decayCombo, plant, unlockPlot, hasten, harvest, critChanceNow,
    buyUpgrade, buyDecor, activateBoost,
    hiveCount, pollination, nextHiveCost, nextTenderCost, hivesFull,
    cellUnlockLevel, cellUnlockCost, cellAvailable, cellLocked, unlockCell,
    cells, cellAt, cellIsHive, hiveCells, tenderCount, emptyCells, boardFull,
    meadowNeighbours, hiveBonus, placeHive, placeTender, moveCell,
    hiveInterval, hiveCapacity, hiveWax,
    keeperSlots, keepers, isKeeper, keepersFree, setKeeper, keeperSpeed,
    shelfCount, shelfHas, shelfFilled, shelfTotal,
    collectHive, collectAllHives, jarsWaiting, honeyTotal, flowerTotal,
    canCraft, startCraft, sell,
    critterById, critterHome, critterHere, crittersHome, critterProgress, critterReady,
    habitatSlots, habitatUsed, habitatFree, critterTending, crittersTending, setTending, critterTrait,
    critterLevel, critterMaxed, critterGoal, critterGoalFor, critterTraitAt, critterPayoutMult,
    foodById, critterFed, critterFedFor, critterWorkLevel, foodGain, feedCritter, foodCapSeconds,
    critterAsleep, crittersAsleep, critterWorking, crittersWorking, fedThresholdSeconds,
    pairById, pairActive, activePairs, notePairs, nightbloomUpgrade,
    mementoCount, mementoKinds, mementoTotal,
    checkCritters, keepsakesWaiting, settleCritters, collectKeepsakes, petCritter,
    benchDef, benchTop, benchUnlocked, benchFirstFree, benchEntryTier, benchNeighbours,
    benchGroup, benchMergeOnce, benchAddToBasket, benchPlace, benchBank,
    benchExpand, benchExpandCost, benchUsed, benchCapacity, benchStockOf,
    standTier, standTierAt, standTierDefs, standOrders, standOrderAt, standGoodsAt, standGoodOffered,
    standFlowerPool, standHoneyPool, standHave, standNeedMet, standCanDeliver, standProgress,
    standPrice, standUnitValue, standFloorUnit, standGenerate, standDeliver, standSkip, standRefillIn, processStand,
    tick, progressOf, remainingOf,
    wonderActive, wonderMult, startWonder, comboMult,
    UPGRADE_EFFECTS,
    repToNext, cumulativeRep, levelFromRep, repIntoLevel,
    seedUnlocked, seedUnlockLevel, plotAvailable, plotUnlockLevel,
    claimQuest, stripQuest, questById,
    discoveredCount, discoveredOf, bestRarityOf, almanacMilestones,
    masteryOf, masteryMult, masteryGoal, masteryTierGoal, rarityCountsOf,
    neighboursOf, verbAt, neighbourVerbs, plantedNeighbours, verbPayoutMult, keeperModifier,
    weatherSlotOf, weatherForSlot, weatherAt, currentWeather, rollMutations, processWeather,
    mutationDef, mutationRank, mutationMult, catchMultiplier,
    dayPhase, isNight, reconcile, gemChanceFor,
    cardById, setOfCard, rarityDef, cardCount, hasCard, setOwned, setComplete,
    albumOwned, albumTotal, openPack, grantPacks, collectPackDrop,
    callWeather, weatherCallPrice, weatherCallable, weatherCallActive, skipCost, skipGrow, offlineRate, offlineHours, passiveIncomeRate, offlineEarnings, Dev
  };
})();
