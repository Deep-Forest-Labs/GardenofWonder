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
      boostInv: { bloom: 0, seedrush: 0, fortune: 0, golden: 0 },
      harvestsThisSession: 0,
      stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0, wonders: 0 },
      wonder: { until: 0, last: 0 },
      apiary: { hives: [], honey: {}, wax: 0 },
      flowers: {},
      craft: [],
      goods: {},
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

  /** Payout multiplier a plot earns from its own verb and its neighbours'. */
  function verbPayoutMult(idx) {
    const t = VT();
    let m = 1 + neighbourVerbs(idx, 'nurse') * t.nurseGive;
    const own = verbAt(idx);
    if (own === 'nurse') m *= (1 - t.nurseCost);
    if (own === 'deeproot') m *= 1 + plantedNeighbours(idx) * t.deeprootPerNeighbour;
    return m;
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
    noteQuest('honey', variety, 1);
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

  const comboMult = () => 1 + state.tap.combo * 0.01;

  /* ---------------- actions ---------------- */
  function tapFlower(held) {
    const power = state.tap.power * (1 + boostVal('tapPower')) * (1 + boostVal('globalCredits'));
    const critChance = state.tap.critChance + boostVal('critChance');
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
    save();
    emit('currency');
    const payload = {
      gain: rounded, crit: isCrit, combo: state.tap.combo, gemDrop, sparkedWonder: sparked,
      rainDance, beeSwarm, ladybug, held: Boolean(held)
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
      aura: ''
    };
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
    const r = rollRarity(
      boostVal('rarityWeight')
      + (luckyHarvest ? LADYBUG_RARITY_BONUS : 0)
      + beacons * VT().beaconRarity
    );
    const yieldBase = sdef.yield * r.m;
    const yieldBonus = 1 + boostVal('globalCredits');
    // Read before recordHarvest: the harvest that completes a tier is paid at the old rate.
    const mastered = masteryMult(sdef.id);
    const payout = Math.round(
      yieldBase * yieldBonus * (1 + pollination()) * wonderMult() * mastered * verbMult
    );

    state.credits += payout;
    // The bloom itself is kept as a crafting ingredient, on top of the credits.
    state.flowers[sdef.id] = (state.flowers[sdef.id] || 0) + 1;
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
    const baseGem = typeof sdef.gemChance === 'number' ? sdef.gemChance : 0.05;
    const gemChance = baseGem * (lanterns ? Math.pow(VT().lanternGemMult, lanterns) : 1);
    let gemDrop = false;
    if (Math.random() < gemChance) { state.gems += 1; gemDrop = true; }

    state.grid[idx] = { ...cell, seed: null, plantedAt: 0, grow: 0, ready: false, aura: r.a, luckyBug: false };
    const sown = sdef.verb === 'spreader' ? trySpread(idx, sdef) : -1;
    const sparked = tryWonder(WONDER.harvestChance);
    save();
    emit('currency');
    const payload = {
      idx, payout, rarity: r, seed: sdef, gemDrop, repBonus, sparkedWonder: sparked, luckyHarvest,
      firstDiscover: almanac.first, discovered: almanac.count, bestRarity: almanac.best,
      milestones: almanac.milestones, mastery: almanac.mastery,
      verbMult, beacons, lanterns, sown
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
    if (almanac.first) noteQuest('discover', sdef.id, 1);
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
    autoHarvest: () => { state.upgrades.autoHarvest += 1; return true; }
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

  return {
    state, on, emit, load, save, saveNow, reset, nowSeconds,
    seedById, activeBoost, boostVal, growModifier, rollRarity,
    plotUnlockCost, upgradePrice, upgradeMaxed, decorCount,
    tapFlower, decayCombo, plant, unlockPlot, hasten, harvest,
    buyUpgrade, buyDecor, activateBoost,
    hiveCount, pollination, nextHiveCost, hivesFull, buyHive,
    collectHive, collectAllHives, jarsWaiting, honeyTotal, flowerTotal,
    canCraft, startCraft, sell,
    tick, progressOf, remainingOf,
    wonderActive, wonderMult, startWonder, comboMult,
    UPGRADE_EFFECTS,
    repToNext, cumulativeRep, levelFromRep, repIntoLevel,
    seedUnlocked, seedUnlockLevel, plotAvailable, plotUnlockLevel,
    claimQuest, stripQuest, questById,
    discoveredCount, discoveredOf, bestRarityOf, almanacMilestones,
    masteryOf, masteryMult, masteryGoal, masteryTierGoal, rarityCountsOf,
    neighboursOf, verbAt, neighbourVerbs, plantedNeighbours, verbPayoutMult, keeperModifier
  };
})();
