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
      plotExpansion: 0, autoWater: 0, autoHarvest: 0
    };
    PLOT_AUTOPLANTERS.forEach(({ key }) => { upgrades[key] = 0; });
    return {
      version: 3,
      credits: 100,
      tickets: 0,
      gems: 0,
      tap: { power: 1, critChance: 0.05, critMult: 10, combo: 0, comboMax: 50, holdInterval: 900 },
      grid: Array(8).fill(0).map((_, i) => ({ locked: i > 3, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '', luckyBug: false })),
      upgrades,
      decor: [],
      boosters: {},
      harvestsThisSession: 0,
      stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
      wonder: { until: 0, last: 0 },
      apiary: { hives: [], honey: {}, wax: 0 },
      flowers: {},
      craft: [],
      goods: {},
      prefs: { sfx: true, music: false },
      seen: { intro: false, plot: false, apiary: false }
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
    if (!raw) return { migrated: false, fresh: true };
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
      state.apiary = Object.assign(d.apiary, parsed.apiary || {});
      state.apiary.hives = Array.isArray(state.apiary.hives) ? state.apiary.hives : [];
      state.apiary.honey = state.apiary.honey && typeof state.apiary.honey === 'object' ? state.apiary.honey : {};
      state.apiary.wax = Number(state.apiary.wax) || 0;
      state.flowers = parsed.flowers && typeof parsed.flowers === 'object' ? parsed.flowers : {};
      state.craft = Array.isArray(parsed.craft) ? parsed.craft : [];
      state.goods = parsed.goods && typeof parsed.goods === 'object' ? parsed.goods : {};
      const decorRefund = migrateDecor(parsed.version || 1);
      state.version = 3;
      lastAutoHarvest = 0;

      if (typeof state.upgrades.plot1Gardener === 'number') {
        state.upgrades.plot1Harvester = state.upgrades.plot1Harvester || state.upgrades.plot1Gardener;
        delete state.upgrades.plot1Gardener;
      }
      PLOT_AUTOPLANTERS.forEach(({ key }) => {
        if (typeof state.upgrades[key] !== 'number') state.upgrades[key] = 0;
      });
      // A save from before these badges existed won't have them — state.upgrades
      // is replaced wholesale by the parsed save above, so each new key needs
      // the same manual backfill as the harvester keys.
      ['holdSpeed', 'rainDance', 'beeSwarm', 'ladybug'].forEach((key) => {
        if (typeof state.upgrades[key] !== 'number') state.upgrades[key] = 0;
      });

      const now = nowSeconds();
      state.grid.forEach((cell) => {
        if (!cell) return;
        if (typeof cell.luckyBug !== 'boolean') cell.luckyBug = false;
        if (!cell.seed) { cell.plantedAt = 0; cell.ready = false; return; }
        if (typeof cell.grow !== 'number' || cell.grow <= 0) cell.grow = 1;
        if (typeof cell.plantedAt !== 'number' || cell.plantedAt <= 0 || cell.plantedAt < 1e8) {
          cell.plantedAt = now - cell.grow;
        } else if (cell.plantedAt > now + 1e5) {
          cell.plantedAt = now;
        }
      });
      if (migrated || decorRefund) saveNow();
      return { migrated, fresh: false, decorRefund };
    } catch (err) {
      console.warn('Save load failed', err);
      return { migrated: false, fresh: true };
    }
  }

  function reset() {
    localStorage.removeItem(SAVE_KEY);
    Object.assign(state, defaultState());
    lastAutoHarvest = 0;
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

  /** Unlocked, seeded, not-yet-ready plots — eligible targets for a garden proc. */
  function growingPlotIndices() {
    const idxs = [];
    state.grid.forEach((c, i) => { if (!c.locked && c.seed && !c.ready) idxs.push(i); });
    return idxs;
  }

  function rollRainDance() {
    const lvl = state.upgrades.rainDance;
    if (!lvl || Math.random() >= lvl * PROC_CHANCE_PER_LEVEL) return null;
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
    const lvl = state.upgrades.beeSwarm;
    if (!lvl || Math.random() >= lvl * PROC_CHANCE_PER_LEVEL) return null;
    const openHives = [];
    state.apiary.hives.forEach((h, i) => { if (h.jars.length < APIARY.capacity) openHives.push(i); });
    if (!openHives.length) return null;
    const i = openHives[Math.floor(Math.random() * openHives.length)];
    const variety = sampleBloom(bloomPool());
    state.apiary.hives[i].jars.push(variety);
    return { hive: i, variety };
  }

  function rollLadybug() {
    const lvl = state.upgrades.ladybug;
    if (!lvl || Math.random() >= lvl * PROC_CHANCE_PER_LEVEL) return null;
    const idxs = growingPlotIndices();
    if (!idxs.length) return null;
    // Prefer a plot that isn't already lucky, so triggers don't pile onto one spot.
    const fresh = idxs.filter((i) => !state.grid[i].luckyBug);
    const pool = fresh.length ? fresh : idxs;
    const idx = pool[Math.floor(Math.random() * pool.length)];
    state.grid[idx].luckyBug = true;
    return { idx };
  }

  /* ---------------- actions ---------------- */
  function tapFlower() {
    const power = state.tap.power * (1 + boostVal('tapPower')) * (1 + boostVal('globalCredits'));
    const critChance = state.tap.critChance + boostVal('critChance');
    const critMultiplier = state.tap.critMult;
    const isCrit = Math.random() < critChance;
    let gain = power;
    if (isCrit) {
      gain *= critMultiplier;
      state.stats.totalCrits += 1;
      if (Math.random() < 0.03) state.tickets += 1;
    }
    let gemDrop = false;
    if (Math.random() < 0.05) { state.gems += 1; gemDrop = true; }
    gain *= wonderMult();
    state.stats.totalTaps += 1;
    const rounded = Math.round(gain);
    state.credits += rounded;
    state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1);
    const sparked = tryWonder(WONDER.tapChance);
    const rainDance = rollRainDance();
    const beeSwarm = rollBeeSwarm();
    const ladybug = rollLadybug();
    save();
    emit('currency');
    const payload = {
      gain: rounded, crit: isCrit, combo: state.tap.combo, gemDrop, sparkedWonder: sparked,
      rainDance, beeSwarm, ladybug
    };
    emit('tap', payload);
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
    if (payCost && state.credits < seedDef.cost) return false;
    if (payCost) state.credits -= seedDef.cost;
    state.grid[idx] = {
      ...cell,
      seed: seedDef.id,
      plantedAt: nowSeconds(),
      grow: seedDef.grow * growModifier(),
      aura: ''
    };
    save();
    emit('currency');
    emit('plant', { idx, seed: seedDef, auto: !payCost });
    return true;
  }

  function unlockPlot(idx) {
    const cell = state.grid[idx];
    if (!cell || !cell.locked) return false;
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
    return true;
  }

  function unlockNextPlots(count) {
    const targets = [];
    for (let i = 0; i < state.grid.length && targets.length < count; i += 1) {
      if (state.grid[i].locked) targets.push(i);
    }
    targets.forEach((idx) => { state.grid[idx].locked = false; });
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
    const r = rollRarity(boostVal('rarityWeight') + (luckyHarvest ? LADYBUG_RARITY_BONUS : 0));
    const yieldBase = sdef.yield * r.m;
    const yieldBonus = 1 + boostVal('globalCredits');
    const payout = Math.round(yieldBase * yieldBonus * (1 + pollination()) * wonderMult());

    state.credits += payout;
    // The bloom itself is kept as a crafting ingredient, on top of the credits.
    state.flowers[sdef.id] = (state.flowers[sdef.id] || 0) + 1;
    state.harvestsThisSession += 1;
    state.stats.totalHarvests += 1;
    let ticketBonus = 0;
    if (state.harvestsThisSession % 10 === 0) { state.tickets += 3; ticketBonus = 3; }
    const gemChance = typeof sdef.gemChance === 'number' ? sdef.gemChance : 0.05;
    let gemDrop = false;
    if (Math.random() < gemChance) { state.gems += 1; gemDrop = true; }
    let ticketDrop = false;
    if (typeof sdef.ticketChance === 'number' && Math.random() < sdef.ticketChance) {
      state.tickets += 1;
      ticketDrop = true;
    }

    state.grid[idx] = { ...cell, seed: null, plantedAt: 0, grow: 0, ready: false, aura: r.a, luckyBug: false };
    const sparked = tryWonder(WONDER.harvestChance);
    save();
    emit('currency');
    const payload = {
      idx, payout, rarity: r, seed: sdef, gemDrop, ticketDrop, ticketBonus, sparkedWonder: sparked, luckyHarvest
    };
    emit('harvest', payload);
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
    if (produced) { save(); emit('panels'); emit('honey', { produced }); }
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
    autoHarvest: () => { state.upgrades.autoHarvest += 1; return true; }
  };
  PLOT_AUTOPLANTERS.forEach(({ key }) => {
    UPGRADE_EFFECTS[key] = () => { state.upgrades[key] += 1; return true; };
  });

  const upgradeMaxed = (key) => {
    if (key === 'plotExpansion') return state.grid.every((c) => !c.locked);
    if (key === 'holdSpeed') return state.tap.holdInterval <= HOLD_INTERVAL_MIN;
    if (key === 'autoWater') return state.upgrades.autoWater >= AUTO_WATER_MAX_LEVEL;
    if (key === 'rainDance') return state.upgrades.rainDance >= RAIN_DANCE_MAX_LEVEL;
    if (key === 'beeSwarm') return state.upgrades.beeSwarm >= BEE_SWARM_MAX_LEVEL;
    if (key === 'ladybug') return state.upgrades.ladybug >= LADYBUG_MAX_LEVEL;
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
    return true;
  }

  function buyDecor(id) {
    const d = DATA.decor.find((x) => x.id === id);
    if (!d) return false;
    const pot = d.currency === 'gems' ? state.gems : d.currency === 'tickets' ? state.tickets : state.credits;
    if (pot < d.cost) { emit('deny', { reason: d.currency, need: d.cost }); return false; }
    if (d.currency === 'gems') state.gems -= d.cost;
    else if (d.currency === 'tickets') state.tickets -= d.cost;
    else state.credits -= d.cost;
    state.decor.push({ id: d.id });
    save();
    emit('currency');
    emit('purchase', { kind: 'decor', key: id, def: d });
    emit('panels');
    return true;
  }

  function buyBooster(id) {
    const b = DATA.boosters.find((x) => x.id === id);
    if (!b) return false;
    if (state.tickets < b.tickets) { emit('deny', { reason: 'tickets', need: b.tickets }); return false; }
    state.tickets -= b.tickets;
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
      const maxSeedIndex = Math.min(level - 1, DATA.seeds.length - 1);
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

  return {
    state, on, emit, load, save, saveNow, reset, nowSeconds,
    seedById, activeBoost, boostVal, growModifier, rollRarity,
    plotUnlockCost, upgradePrice, upgradeMaxed, decorCount,
    tapFlower, decayCombo, plant, unlockPlot, hasten, harvest,
    buyUpgrade, buyDecor, buyBooster,
    hiveCount, pollination, nextHiveCost, hivesFull, buyHive,
    collectHive, collectAllHives, jarsWaiting, honeyTotal, flowerTotal,
    canCraft, startCraft, sell,
    tick, progressOf, remainingOf,
    wonderActive, wonderMult, startWonder,
    UPGRADE_EFFECTS
  };
})();
