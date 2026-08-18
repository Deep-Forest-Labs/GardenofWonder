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
      version: 3,
      credits: 100,
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
      apiary: { hives: [], honey: {}, wax: 0 },
      flowers: {},
      craft: [],
      goods: {},
      bench: { cells: Array(BENCH.cols * BENCH.cols).fill(null), side: BENCH.startSide, basket: [], stock: {} },
      critters: {},
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
    state.credits += refund.credits;
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
      state.apiary.hives = Array.isArray(state.apiary.hives) ? state.apiary.hives : [];
      state.apiary.honey = state.apiary.honey && typeof state.apiary.honey === 'object' ? state.apiary.honey : {};
      state.apiary.wax = Number(state.apiary.wax) || 0;
      state.flowers = parsed.flowers && typeof parsed.flowers === 'object' ? parsed.flowers : {};
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
            // Clamped to the cap so an edited save cannot hold a boost forever.
            fedUntil: Math.max(0, Math.min(nowSeconds() + FOOD_CAP_HOURS * 3600,
              Number(r.fedUntil) || 0)),
            /* Absent means AWAKE, not asleep. A save written before sleeping
               existed must not open on a room of creatures the game never
               warned anyone about — the same rule `tending` follows. */
            awakeUntil: r.awakeUntil === undefined
              ? nowSeconds() + ARRIVAL_AWAKE_HOURS * 3600
              : Math.max(0, Math.min(nowSeconds() + FOOD_CAP_HOURS * 3600,
                Number(r.awakeUntil) || 0)),
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
      state.version = 3;
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
      let progressionGrant = null;
      if (!Object.prototype.hasOwnProperty.call(parsed, 'rep')) {
        progressionGrant = migrateProgression();
      }
      ensureProgression();
      backfillDiscovered();
      const almanacGrant = grantAlmanacMilestones();
      // Silent by design: a backfilled tier grants its yield but has no moment to celebrate.
      const masteryBackfill = backfillMastery();
      if (migrated || decorRefund || progressionGrant || ticketGrant
        || almanacGrant.paid.length || masteryBackfill.changed) saveNow();
      return {
        migrated, fresh: false, decorRefund, progressionGrant, ticketGrant,
        almanacGrant: almanacGrant.paid.length ? almanacGrant : null
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
      const grow = seed.grow * growModifier() * keeperModifier(idx);
      if (grow <= 0) return;
      const gross = seed.yield * EXPECTED_RARITY_MULT * yieldBonus
        * masteryMult(seed.id) * verbPayoutMult(idx);
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
      state.credits += earned.coins;
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

  function seedUnlockLevel(id) {
    const s = typeof id === 'string' ? seedById(id) : id;
    return (s && s.unlockLevel) || 1;
  }
  function seedUnlocked(id) {
    return seedUnlockLevel(id) <= levelFromRep(state.rep);
  }
  function highestUnlockedSeedIndex() {
    const lv = levelFromRep(state.rep);
    let max = -1;
    DATA.seeds.forEach((s, i) => { if ((s.unlockLevel || 1) <= lv) max = i; });
    return max;
  }

  function plotUnlockLevel(idx) {
    const table = DATA.plotUnlockLevel || [];
    return table[idx] || 1;
  }
  function plotAvailable(idx) {
    return levelFromRep(state.rep) >= plotUnlockLevel(idx);
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function questById(id) {
    return DATA.quests.find((q) => q.id === id) || DATA.dailies.find((q) => q.id === id) || null;
  }

  function rollDaily(excludeId) {
    const pool = DATA.dailies.filter((q) => q.id !== excludeId);
    const pick = (pool.length ? pool : DATA.dailies)[Math.floor(Math.random() * (pool.length || DATA.dailies.length))];
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
    // Drop instances whose definition no longer exists. A retired quest left in
    // `active` can never be claimed, so it holds one of the three slots forever
    // and jams stripQuest(), which always shows active[0].
    state.quests.active = state.quests.active.filter((q) => q && questById(q.id));
    const daily = state.quests.daily;
    if (daily.id && !questById(daily.id) && !daily.claimed) daily.id = null; // forces a reroll below
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
    if (reward.credits) state.credits += reward.credits;
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
  const masteryMult = (id) => 1 + (DATA.masteryYieldPerTier || 0) * masteryOf(id);

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
    // Counts are recorded before the ladder is walked, so one harvest can cross
    // more than one tier.
    const mastery = advanceMastery(seedId, true);
    return {
      first,
      count: state.discovered[seedId],
      best: state.bestRarity[seedId],
      milestones: granted.paid,
      levelGrants: granted.levelGrants,
      mastery
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
    const granted = [];
    DATA.seeds.forEach((s) => {
      const tiers = advanceMastery(s.id, false);
      if (tiers.length) granted.push({ id: s.id, tiers: tiers.length });
    });
    return { changed: changed || granted.length > 0, granted };
  }
  function grantLevel(level) {
    const coins = (DATA.levelCoinGrant || 20) * level;
    state.credits += coins;
    const grant = (DATA.levelGrants && DATA.levelGrants[level]) || {};
    const out = { level, coins, seed: null, plot: null, hive: false, decor: null, gems: 0, boost: null };
    const seed = DATA.seeds.find((s) => s.unlockLevel === level);
    if (seed) out.seed = seed;
    const plotIdx = (DATA.plotUnlockLevel || []).findIndex((lv, i) => i > 3 && lv === level);
    if (plotIdx >= 0) out.plot = plotIdx;
    if (grant.hive) {
      if (hiveCount() < APIARY.maxHives) {
        state.apiary.hives.push({ at: nowSeconds(), jars: [] });
        out.hive = true;
      } else {
        const extra = APIARY.hiveCost(0);
        state.credits += extra;
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
    const openHives = [];
    state.apiary.hives.forEach((h, i) => { if (h.jars.length < APIARY.capacity) openHives.push(i); });
    if (!openHives.length) return null;
    const i = openHives[Math.floor(Math.random() * openHives.length)];
    const variety = sampleBloom(bloomPool());
    state.apiary.hives[i].jars.push(variety);
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
    state.credits += rounded;
    state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1);
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
      grow: seedDef.grow * growModifier() * keeperModifier(idx),
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
    // Read before recordHarvest: the harvest that completes a tier is paid at the old rate.
    const mastered = masteryMult(sdef.id);
    const payout = Math.round(
      yieldBase * yieldBonus * (1 + pollination()) * wonderMult() * mastered * verbMult * mutMult
      * critterPayoutMult()
    );

    state.credits += payout;
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

  /* ---------------- apiary ---------------- */
  const hiveCount = () => state.apiary.hives.length;
  const pollination = () => hiveCount() * APIARY.pollination;
  const nextHiveCost = () => APIARY.hiveCost(hiveCount());
  const hivesFull = () => hiveCount() >= APIARY.maxHives;

  function buyHive() {
    if (hivesFull()) return false;
    const cost = nextHiveCost();
    if (state.credits < cost) { emit('deny', { reason: 'credits', need: cost }); return false; }
    state.credits -= cost;
    state.apiary.hives.push({ at: nowSeconds(), jars: [] });
    save();
    emit('currency');
    emit('purchase', { kind: 'hive', cost });
    emit('panels');
    noteQuest('hive', null, 1);
    return true;
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

  function produceHoney(now) {
    if (!hiveCount()) return;
    const pool = bloomPool();
    let produced = 0;
    state.apiary.hives.forEach((h) => {
      if (typeof h.at !== 'number' || h.at > now) h.at = now;
      if (!Array.isArray(h.jars)) h.jars = [];
      while (h.jars.length < APIARY.capacity && now - h.at >= APIARY.interval) {
        h.at += APIARY.interval;
        h.jars.push(sampleBloom(pool));
        produced += 1;
      }
      // A full hive stops the clock rather than banking jars it cannot hold.
      if (h.jars.length >= APIARY.capacity) h.at = now;
    });
    if (produced) {
      save();
      emit('panels');
      emit('honey', { produced });
      noteQuest('honey', null, produced);
    }
  }

  function collectHive(i) {
    const h = state.apiary.hives[i];
    if (!h || !h.jars.length) return null;
    const jars = h.jars.slice();
    let wax = 0;
    jars.forEach((type) => {
      state.apiary.honey[type] = (state.apiary.honey[type] || 0) + 1;
      if (Math.random() < APIARY.waxChance) wax += 1;
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
    state.apiary.hives.forEach((h, i) => { if (h.jars.length) { const r = collectHive(i); if (r) out.push(r); } });
    return out;
  }

  const honeyTotal = () => Object.values(state.apiary.honey).reduce((a, b) => a + b, 0);
  const flowerTotal = () => Object.values(state.flowers).reduce((a, b) => a + b, 0);
  const jarsWaiting = () => state.apiary.hives.reduce((a, h) => a + h.jars.length, 0);

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
      home.tending = false;
      save();
      emit('panels');
      return true;
    }
    if (home.tending) return false;
    if (habitatFree() <= 0) return false;
    home.tending = true;
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

  const critterFedUntil = (id) => (state.critters[id] ? state.critters[id].fedUntil || 0 : 0);
  const critterFed = (id) => critterFedUntil(id) > nowSeconds();
  const critterFedFor = (id) => Math.max(0, critterFedUntil(id) - nowSeconds());

  const critterAwakeUntil = (id) => (state.critters[id] ? state.critters[id].awakeUntil || 0 : 0);
  const critterAsleep = (id) => critterHere(id) && critterAwakeUntil(id) <= nowSeconds();
  const critterAwakeFor = (id) => Math.max(0, critterAwakeUntil(id) - nowSeconds());
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

  /** Seconds a given food would actually add to each clock, after the caps.
      Zero on both means the button should be dead rather than the purchase
      failing — a buy that quietly does nothing reads as a broken feature. */
  function foodGain(id, foodId) {
    const food = foodById(foodId);
    if (!food || !critterHere(id)) return 0;
    const now = nowSeconds();
    const cap = now + foodCapSeconds();
    const fedFrom = Math.max(now, critterFedUntil(id));
    const wakeFrom = Math.max(now, critterAwakeUntil(id));
    const fed = Math.max(0, Math.min(cap, fedFrom + food.hours * 3600) - fedFrom);
    const awake = Math.max(0, Math.min(cap, wakeFrom + food.awake * 3600) - wakeFrom);
    return Math.max(fed, awake);
  }

  function feedCritter(id, foodId) {
    const def = critterById(id);
    const food = foodById(foodId);
    if (!def || !food || !critterHere(id)) return null;
    // Only a tending creature's trait is ever read, so feeding a resting one
    // would be a purchase that buys nothing. A SLEEPING one is a different
    // case entirely — waking it up is the whole point.
    if (!critterTending(id)) return null;
    if (foodGain(id, foodId) <= 0) return null;
    if (state.credits < food.cost) {
      emit('deny', { reason: 'credits', need: food.cost });
      return null;
    }
    const now = nowSeconds();
    const cap = now + foodCapSeconds();
    const woke = critterAsleep(id);
    state.credits -= food.cost;
    state.critters[id].fedUntil =
      Math.min(cap, Math.max(now, critterFedUntil(id)) + food.hours * 3600);
    state.critters[id].awakeUntil =
      Math.min(cap, Math.max(now, critterAwakeUntil(id)) + food.awake * 3600);
    save();
    emit('currency');
    emit('purchase', { kind: 'food', key: foodId, cost: food.cost, def: food });
    emit('critter', { def, fed: true, woke, food, until: critterFedUntil(id) });
    emit('panels');
    return { def, food, woke, until: critterFedUntil(id), awakeUntil: critterAwakeUntil(id) };
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
          fedUntil: 0, awakeUntil: nowSeconds() + ARRIVAL_AWAKE_HOURS * 3600
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
    state.credits += credits;
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
    state.credits += total;
    save();
    emit('currency');
    emit('panels');
    emit('sell', { kind, key, qty, total });
    if (kind === 'flower') noteQuest('sell', key, qty);
    return total;
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
    if (ok === false) { state.credits += cost; return false; }
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
      state.apiary.hives.forEach((h) => { h.at -= back; });
      state.lastSeen = nowSeconds() - back;
      const report = reconcile();
      emit('panels');
      return report;
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
    seedById, activeBoost, boostVal, growModifier, rollRarity,
    plotUnlockCost, upgradePrice, upgradeMaxed, decorCount,
    tapFlower, decayCombo, plant, unlockPlot, hasten, harvest, critChanceNow,
    buyUpgrade, buyDecor, activateBoost,
    hiveCount, pollination, nextHiveCost, hivesFull, buyHive,
    collectHive, collectAllHives, jarsWaiting, honeyTotal, flowerTotal,
    canCraft, startCraft, sell,
    critterById, critterHome, critterHere, crittersHome, critterProgress, critterReady,
    habitatSlots, habitatUsed, habitatFree, critterTending, crittersTending, setTending, critterTrait,
    critterLevel, critterMaxed, critterGoal, critterGoalFor, critterTraitAt, critterPayoutMult,
    foodById, critterFed, critterFedFor, critterWorkLevel, foodGain, feedCritter, foodCapSeconds,
    critterAsleep, critterAwakeFor, crittersAsleep, critterWorking, crittersWorking,
    pairById, pairActive, activePairs, notePairs, nightbloomUpgrade,
    mementoCount, mementoKinds, mementoTotal,
    checkCritters, keepsakesWaiting, settleCritters, collectKeepsakes, petCritter,
    benchDef, benchTop, benchUnlocked, benchFirstFree, benchEntryTier, benchNeighbours,
    benchGroup, benchMergeOnce, benchAddToBasket, benchPlace, benchBank,
    benchExpand, benchExpandCost, benchUsed, benchCapacity, benchStockOf,
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
