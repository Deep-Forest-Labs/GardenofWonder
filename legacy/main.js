/* Idle Garden Reborn (Web) – PPP currencies, crits, boosters, central flower */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const PLOT_AUTOPLANTERS = Array.from({ length: 8 }, (_, i) => {
  const base = Math.round(3000 * Math.pow(1.3, i));
  return {
    key: `plot${i + 1}Harvester`,
    idx: i,
    name: `Plot ${i + 1} Harvester`,
    base,
    scale: 2.3,
    desc: `Assign a harvester to plot ${i + 1} to auto-plant higher tier seeds.`
  };
});

// --- DATA -----------------------------------------------------------------
const DATA = {
  rarity: [
    { key: 'common', w: 70, m: 1, a: '' },
    { key: 'rare', w: 20, m: 2, a: 'rare' },
    { key: 'epic', w: 8, m: 4, a: 'epic' },
    { key: 'legend', w: 2, m: 8, a: 'legend' }
  ],
  seeds: [
    { id: 'daisy', name: 'Daisy', cost: 50, grow: 12, yield: 70, spr: '🌼', desc: 'Swift starter bloom; perfect for keeping early plots busy.' },
    { id: 'tulip', name: 'Tulip', cost: 110, grow: 18, yield: 154, spr: '🌷', desc: 'Reliable mid-tier earner with a splash of spring color.' },
    { id: 'bluebell', name: 'Bluebell', cost: 180, grow: 24, yield: 252, spr: '🪻', desc: 'Shaded blossom that rewards patient gardeners.' },
    { id: 'lavender', name: 'Lavender', cost: 260, grow: 28, yield: 364, spr: '💜', desc: 'Calming scent draws in gentle critters and steady credits.' },
    { id: 'rose', name: 'Rose', cost: 350, grow: 32, yield: 490, spr: '🌹', desc: 'Classic bloom with a hint of thorny rarity potential.' },
    { id: 'peony', name: 'Peony', cost: 500, grow: 42, yield: 700, spr: '🌺', desc: 'Bursting petals deliver hearty, reliable payouts.' },
    { id: 'marigold', name: 'Marigold', cost: 750, grow: 55, yield: 1050, spr: '🌻', desc: 'Sun-kissed bloom that loves booster synergies.' },
    { id: 'orchid', name: 'Orchid', cost: 1100, grow: 90, yield: 1540, spr: '🪷', desc: 'Elegant slow-grower with strong harvest multipliers.' },
    { id: 'sunlotus', name: 'Sun Lotus', cost: 2200, grow: 140, yield: 3080, spr: '🌞', desc: 'Radiant lotus that charges the garden with light.' },
    { id: 'jadefern', name: 'Jade Fern', cost: 3200, grow: 180, yield: 4480, spr: '🌿', desc: 'Ancient frond storing rich nutrients for big hauls.' },
    { id: 'moonflower', name: 'Moonflower', cost: 4500, grow: 220, yield: 6300, spr: '🌙', desc: 'Night-blooming marvel with stellar rarity chances.' },
    { id: 'starlit', name: 'Starlit Iris', cost: 6500, grow: 280, yield: 9100, spr: '✨', desc: 'Nebula-touched petals shimmer with crit energy.' },
    { id: 'aurora', name: 'Aurora Bloom', cost: 9000, grow: 360, yield: 12600, spr: '🌌', desc: 'Polar blossoms that pulse with global credit bonuses.' },
    { id: 'celestial', name: 'Celestial Lotus', cost: 12000, grow: 480, yield: 16800, spr: '🪐', desc: 'Garden apex flower drawing cosmic fortune to every plot.' },
    { id: 'nebula', name: 'Nebula Orchid', cost: 20000, grow: 540, yield: 28000, spr: '🌠', desc: 'Starlit bloom humming with distant stardust dividends.', gemChance: 0.008, ticketChance: 0.003 },
    { id: 'solstice', name: 'Solstice Lily', cost: 35000, grow: 600, yield: 49000, spr: '☀️', desc: 'Radiant petals channel sunflare surges and rare tickets.', gemChance: 0.01, ticketChance: 0.004 },
    { id: 'auroracrown', name: 'Aurora Crown', cost: 52000, grow: 660, yield: 72800, spr: '🌈', desc: 'Auroral halo weaves shimmering rewards across the garden.', gemChance: 0.012, ticketChance: 0.005 },
    { id: 'mythicstar', name: 'Mythic Starflower', cost: 75000, grow: 720, yield: 105000, spr: '🌟', desc: 'Legend-touched bloom whispering of premium windfalls.', gemChance: 0.015, ticketChance: 0.006 },
    { id: 'eternal', name: 'Eternal Crown', cost: 100000, grow: 780, yield: 140000, spr: '💫', desc: 'Limitless petals with a rare promise of gems and tickets.', gemChance: 0.02, ticketChance: 0.008 }
  ],
  upgrades: {
    tapPower: { name: 'Tap Power +1', base: 100, scale: 2, desc: 'Increase base tap payout by +1 credit per tap.' },
    critChance: { name: '+1% Crit', base: 500, scale: 1.5, desc: 'Raise tap critical hit chance by +1%.' },
    critMult: { name: '+2x Crit Mult', base: 1000, scale: 2, desc: 'Boost tap crit multiplier by +2x (up to 50x).' },
    comboMeter: { name: 'Tap Combo Boost', base: 2500, scale: 2, desc: 'Extend combo cap by +10 taps.' },
    plotExpansion: { name: 'Plot Expansion +2', base: 2000, scale: 2, desc: 'Unlock two additional garden plots.' },
    autoWater: { name: 'Sprinkler Network', base: 2500, scale: 2.2, desc: 'Increase grow speed by 5% per level for all plants.' },
    autoHarvest: { name: 'Drone Harvester', base: 4500, scale: 2.4, desc: 'Automatically harvest a ready plot on a timer.' }
  },
  decor: [
    { id: 'gnome', name: 'Gnome of Fortune', currency: 'gems', cost: 250, type: 'critChance', val: 0.05, spr: '🧙', desc: '+5% tap crit chance from the lucky gnome.' },
    { id: 'shrine', name: 'Butterfly Shrine', currency: 'credits', cost: 1000, type: 'growSpeed', val: 0.1, spr: '🦋', desc: '+10% plant growth speed with calming butterflies.' },
    { id: 'fountain', name: 'Crystal Fountain', currency: 'credits', cost: 5000, type: 'tapYield', val: 0.1, spr: '⛲', desc: '+10% tap earnings from shimmering waters.' },
    { id: 'lanterntree', name: 'Lantern Tree', currency: 'tickets', cost: 200, type: 'critMult', val: 0.01, spr: '🏮', desc: '+1% tap crit multiplier each level from glowing lanterns.' }
  ],
  boosters: [
    { id: 'bloom', name: 'Bloom Burst', tickets: 25, dur: 30, effects: { tapPower: 0.5, critChance: 0.02 }, desc: '+50% tap power and +2% crit chance for 30s.' },
    { id: 'seedrush', name: 'Seed Rush', tickets: 20, dur: 600, effects: { growSpeed: 0.3 }, desc: '+30% growth speed for ten minutes.' },
    { id: 'fortune', name: 'Fortune Aura', tickets: 40, dur: 1800, effects: { rarityWeight: 0.5 }, desc: '+50% rarity odds for harvests during the aura.' },
    { id: 'golden', name: 'Golden Popups', tickets: 30, dur: 30, effects: { globalCredits: 0.25 }, desc: '+25% credits from all sources for 30s.' }
  ]
};

PLOT_AUTOPLANTERS.forEach((cfg) => {
  DATA.upgrades[cfg.key] = {
    name: cfg.name,
    base: cfg.base,
    scale: cfg.scale,
    desc: cfg.desc
  };
});

const MAX_RARITY_MULT = Math.max(...DATA.rarity.map((r) => r.m));

// --- STATE ----------------------------------------------------------------
const defaultState = () => {
  const upgrades = {
    tapPower: 0,
    critChance: 0,
    critMult: 0,
    comboMeter: 0,
    plotExpansion: 0,
    autoWater: 0,
    autoHarvest: 0
  };
  PLOT_AUTOPLANTERS.forEach(({ key }) => {
    upgrades[key] = 0;
  });
  return {
    version: 1,
    credits: 100,
    tickets: 0,
    gems: 0,
    tap: { power: 1, critChance: 0.05, critMult: 10, combo: 0, comboMax: 50 },
    grid: Array(8)
      .fill(0)
      .map((_, i) => ({ locked: i > 3, seed: null, plantedAt: 0, grow: 0, ready: false, aura: '' })),
    upgrades,
    decor: [],
    boosters: {},
    harvestsThisSession: 0,
    stats: { totalTaps: 0, totalCrits: 0, totalHarvests: 0 }
  };
};

const state = defaultState();

function save() {
  localStorage.setItem('igr-save', JSON.stringify(state));
}

const nowSeconds = () => Date.now() / 1000;

function load() {
  const s = localStorage.getItem('igr-save');
  if (!s) return;
  try {
    const parsed = JSON.parse(s);
    Object.assign(state, defaultState(), parsed);
    lastAutoHarvest = 0;
    if (typeof state.upgrades.plot1Gardener === 'number') {
      state.upgrades.plot1Harvester = state.upgrades.plot1Harvester || state.upgrades.plot1Gardener;
      delete state.upgrades.plot1Gardener;
    }
    PLOT_AUTOPLANTERS.forEach(({ key }) => {
      if (typeof state.upgrades[key] !== 'number') state.upgrades[key] = 0;
    });
    const now = nowSeconds();
    state.grid.forEach((cell) => {
      if (!cell) return;
      if (!cell.seed) {
        cell.plantedAt = 0;
        cell.ready = false;
        return;
      }
      if (typeof cell.grow !== 'number' || cell.grow <= 0) {
        cell.grow = 1;
      }
      if (typeof cell.plantedAt !== 'number' || cell.plantedAt <= 0 || cell.plantedAt < 1e8) {
        cell.plantedAt = now - cell.grow;
      } else if (cell.plantedAt > now + 1e5) {
        cell.plantedAt = now;
      }
    });
  } catch (err) {
    console.warn('Save load failed', err);
  }
}

// --- UTILS ---------------------------------------------------------------
function seedById(id) {
  return DATA.seeds.find((s) => s.id === id);
}

function rollRarity(extra) {
  const pool = DATA.rarity.map((r, i) => ({ ...r, w: i > 0 ? r.w * (1 + extra) : r.w }));
  const tot = pool.reduce((a, b) => a + b.w, 0);
  let t = Math.random() * tot;
  for (const r of pool) {
    t -= r.w;
    if (t <= 0) return r;
  }
  return pool[0];
}

function formatChance(val) {
  if (!val) return '';
  const pct = val * 100;
  if (pct >= 1) return `${Math.round(pct)}%`;
  if (pct >= 0.1) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(2)}%`;
}

function seedDropSummary(seed) {
  const parts = [];
  if (seed.gemChance) parts.push(`${formatChance(seed.gemChance)} 💎`);
  if (seed.ticketChance) parts.push(`${formatChance(seed.ticketChance)} 🎟️`);
  return parts.join(' / ');
}

function activeBoost(id) {
  return state.boosters[id] && state.boosters[id] > Date.now() / 1000;
}

function boostVal(key) {
  let v = 0;
  for (const b of DATA.boosters) {
    if (activeBoost(b.id) && b.effects[key]) v += b.effects[key];
  }
  return v;
}

function decorVal(key) {
  let v = 0;
  for (const d of state.decor) {
    if (d.type === key) v += d.val;
  }
  return v;
}

function growModifier() {
  const bonus = decorVal('growSpeed') + boostVal('growSpeed') + state.upgrades.autoWater * 0.05;
  return Math.max(0.3, 1 - bonus);
}

function plantSeedInPlot(idx, seedDef, payCost = true) {
  if (!seedDef) return false;
  const cell = state.grid[idx];
  if (!cell || cell.locked) return false;
  if (payCost && state.credits < seedDef.cost) return false;
  if (payCost) state.credits -= seedDef.cost;
  state.grid[idx] = {
    ...cell,
    seed: seedDef.id,
    plantedAt: nowSeconds(),
    grow: seedDef.grow * growModifier(),
    aura: ''
  };
  return true;
}

let lastAutoHarvest = 0;

function processAutomation(now) {
  const level = state.upgrades.autoHarvest;
  if (!level) return;
  const cadence = Math.max(0.7, 3 - level * 0.5);
  if (now - lastAutoHarvest < cadence) return;
  const target = state.grid.findIndex((cell) => !cell.locked && cell.seed && cell.ready);
  if (target === -1) return;
  lastAutoHarvest = now;
  harvest(target);
}

function spawnAutoPlantPopup(idx, message) {
  const plotEl = document.querySelector(`.plot[data-idx="${idx}"]`);
  if (!plotEl) return;
  plotEl.classList.add('planting');
  const label = plotEl.querySelector('.auto-label');
  if (label) {
    label.textContent = message;
    label.classList.add('show');
    setTimeout(() => label.classList.remove('show'), 1200);
  }
}

function processPlotHarvesters() {
  let planted = false;
  PLOT_AUTOPLANTERS.forEach(({ key, idx }) => {
    const level = state.upgrades[key];
    if (!level) return;
    const cell = state.grid[idx];
    if (!cell || cell.locked || cell.seed) return;
    const maxSeedIndex = Math.min(level - 1, DATA.seeds.length - 1);
    let chosen = null;
    for (let i = maxSeedIndex; i >= 0; i -= 1) {
      const seedDef = DATA.seeds[i];
      if (state.credits >= seedDef.cost) {
        chosen = seedDef;
        break;
      }
    }
    if (!chosen) return;
    if (!plantSeedInPlot(idx, chosen)) return;
    planted = true;
    spawnAutoPlantPopup(idx, 'Auto');
  });
  if (planted) save();
}

function plotUnlockCost(idx) {
  return 400 + 300 * (idx + 1);
}

function unlockNextPlots(count) {
  const targets = [];
  for (let i = 0; i < state.grid.length && targets.length < count; i += 1) {
    if (state.grid[i].locked) targets.push(i);
  }
  targets.forEach((idx) => {
    state.grid[idx].locked = false;
  });
  return targets.length;
}

function spawnSparkle(el, rarity) {
  if (!el) return;
  const glyph = rarity === 'legend' ? '🌟' : rarity === 'epic' ? '💫' : '✨';
  const spark = document.createElement('div');
  spark.className = `sparkle ${rarity}`;
  spark.textContent = glyph;
  el.appendChild(spark);
  setTimeout(() => spark.remove(), 800);
}

function removeExpiredBoosters() {
  const now = Date.now() / 1000;
  for (const [id, until] of Object.entries(state.boosters)) {
    if (until <= now) delete state.boosters[id];
  }
}

// --- UI HOOKS ------------------------------------------------------------
const creditsEl = $('#credits');
const ticketsEl = $('#tickets');
const gemsEl = $('#gems');
const flowerEl = $('#flower');
const comboEl = $('#comboMeter');
const bonusesDlg = $('#bonuses');
const bonusListEl = $('#bonusList');
const btnBonuses = $('#btnBonuses');
const decorStatusEl = $('#decorStatus');
const boosterStatusEl = $('#boosterStatus');
const toastStackEl = $('#toastStack');
const seedSortSelect = $('#seedSort');
let currentSeedSort = 'tier';

function refreshTop() {
  creditsEl.textContent = state.credits.toLocaleString();
  ticketsEl.textContent = state.tickets.toLocaleString();
  gemsEl.textContent = state.gems.toLocaleString();
}

function buildPlots() {
  const cells = $$('.cell[data-kind="plot"]');
  cells.forEach((cell, i) => {
    if (!cell.firstChild) {
      const btn = document.importNode($('#tpl-plot').content, true).firstElementChild;
      btn.dataset.idx = i;
      cell.appendChild(btn);
      btn.addEventListener('click', onPlotTap);
    }
  });
}

function renderPlot(i) {
  const cellEl = $(`.plot[data-idx="${i}"]`);
  const cell = state.grid[i];
  if (!cellEl || !cell) return;
  const spr = cellEl.querySelector('.spr');
  const bar = cellEl.querySelector('.bar span');
  const halo = cellEl.querySelector('.halo');
  const lock = cellEl.querySelector('.lock');
  const cost = lock ? lock.querySelector('.cost') : null;
  cellEl.classList.toggle('locked', Boolean(cell.locked));
  if (cell.locked) {
    if (spr) spr.textContent = 'Unlock?';
    if (bar) bar.style.width = '0%';
    if (cost) cost.textContent = ` ${plotUnlockCost(i).toLocaleString()}💰`;
    cell.ready = false;
    halo.className = 'halo';
    return;
  }
  if (cost) cost.textContent = '';
  if (cell.seed) {
    const sdef = seedById(cell.seed);
    if (!sdef) {
      spr.textContent = '❓';
      bar.style.width = '0%';
      cellEl.classList.remove('ready');
      cell.ready = false;
      halo.className = 'halo';
      return;
    }
    spr.textContent = sdef.spr;
    const elapsed = Math.max(0, nowSeconds() - cell.plantedAt);
    const duration = cell.grow > 0 ? cell.grow : 1;
    const pct = Math.min(1, Math.max(0, elapsed / duration));
    bar.style.width = (pct * 100).toFixed(1) + '%';
    const ready = pct >= 1;
    cellEl.classList.toggle('ready', ready);
    cell.ready = ready;
  } else {
    spr.textContent = '';
    bar.style.width = '0%';
    cell.ready = false;
    cellEl.classList.remove('ready');
  }
  halo.className = 'halo ' + (cell.aura || '');
}

function renderAll() {
  refreshTop();
  for (let i = 0; i < state.grid.length; i += 1) renderPlot(i);
  renderCombo();
  renderBoosters();
  renderDecorStatus();
  renderBoosterStatus();
}

function renderCombo() {
  const max = state.tap.comboMax;
  const pct = Math.min(1, state.tap.combo / max);
  comboEl.style.background = `conic-gradient(#0006 ${pct * 360}deg, #0001 0)`;
}

function formatTime(sec) {
  return `${Math.ceil(sec)}s`;
}

function renderBoosters() {
  const list = $('#panel-boosters');
  list.querySelectorAll('.timer').forEach((el) => el.remove());
  const now = Date.now() / 1000;
  DATA.boosters.forEach((b) => {
    const btn = list.querySelector(`[data-booster="${b.id}"]`);
    if (!btn) return;
    btn.disabled = state.tickets < b.tickets && !activeBoost(b.id);
    btn.classList.toggle('active', activeBoost(b.id));
    const until = state.boosters[b.id];
    if (until && until > now) {
      let badge = btn.querySelector('.timer');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'timer';
        btn.appendChild(badge);
      }
      badge.textContent = formatTime(until - now);
    }
  });
}

function renderDecorStatus() {
  if (!decorStatusEl) return;
  decorStatusEl.innerHTML = '';
  if (!state.decor.length) {
    return;
  }
  const counts = state.decor.reduce((acc, d) => {
    acc[d.id] = (acc[d.id] || 0) + 1;
    return acc;
  }, {});
  Object.entries(counts).forEach(([id, count]) => {
    const def = DATA.decor.find((d) => d.id === id);
    if (!def) return;
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `<span class="icon">${def.spr}</span><span>x${count}</span>`;
    decorStatusEl.appendChild(chip);
  });
}

function renderBoosterStatus() {
  if (!boosterStatusEl) return;
  boosterStatusEl.innerHTML = '';
  const now = Date.now() / 1000;
  const active = DATA.boosters.filter((b) => activeBoost(b.id));
  if (!active.length) return;
  active.forEach((b) => {
    const remaining = Math.max(0, state.boosters[b.id] - now);
    const pct = Math.max(0, Math.min(1, remaining / b.dur));
    const chip = document.createElement('div');
    chip.className = 'chip booster';
    chip.innerHTML = `<span class="icon">⚡</span><span>${b.name}</span><span class="timerRing" style="background:conic-gradient(var(--acc) ${pct * 360}deg,#d6dbe7 0);"></span><span class="timerValue">${Math.ceil(remaining)}</span>`;
    boosterStatusEl.appendChild(chip);
  });
}

function pushToast({ title, body, kind = 'epic', duration = 4 }) {
  if (!toastStackEl) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.innerHTML = `
    <div class="title">${title}</div>
    <div class="body">${body}</div>
    <div class="toast-progress"><span></span></div>
  `;
  toastStackEl.appendChild(toast);
  const progress = toast.querySelector('.toast-progress span');
  progress.style.transition = `transform ${duration}s linear`;
  requestAnimationFrame(() => {
    progress.style.transform = 'scaleX(0)';
  });
  setTimeout(() => {
    toast.classList.add('fade');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  }, duration * 1000);
}

function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatSignedPercent(value, digits = 1) {
  const pct = value * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
}

function describeDecor() {
  if (!state.decor.length) return ['None equipped'];
  const counts = state.decor.reduce((acc, d) => {
    acc[d.id] = (acc[d.id] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([id, count]) => {
    const def = DATA.decor.find((d) => d.id === id);
    if (!def) return `${count}x Unknown Relic`;
    return `${count}x ${def.name}`;
  });
}

function gatherBonusSections() {
  const sections = [];
  const tapBase = state.tap.power;
  const tapMult = (1 + decorVal('tapYield')) * (1 + boostVal('tapPower')) * (1 + boostVal('globalCredits'));
  const tapEffective = tapBase * tapMult;
  const critChanceBase = state.tap.critChance;
  const critChanceTotal = critChanceBase + decorVal('critChance') + boostVal('critChance');
  const critMultTotal = state.tap.critMult * (1 + decorVal('critMult'));
  const growBonus = Math.max(0, 1 - growModifier());
  const rarityBonus = boostVal('rarityWeight');
  const harvestBonus = decorVal('tapYield') * 0.3 + boostVal('globalCredits');
  const autoHarvestLevel = state.upgrades.autoHarvest;
  const autoHarvestCadence = autoHarvestLevel ? Math.max(0.7, 3 - autoHarvestLevel * 0.5) : null;
  const autoplanterRows = PLOT_AUTOPLANTERS.map(({ key, name }) => {
    const level = state.upgrades[key];
    if (level) {
      const seedDef = DATA.seeds[Math.min(level - 1, DATA.seeds.length - 1)];
      return {
        label: `${name} L${level}`,
        value: `Plants up to ${seedDef.name}`,
        desc: 'Keeps its plot seeded based on your coin stash'
      };
    }
    return {
      label: name,
      value: 'Locked',
      desc: 'Hire this harvester to auto-plant its plot'
    };
  });
  sections.push({
    title: 'Tap Offense',
    rows: [
      {
        label: 'Tap Power',
        value: `${tapBase.toFixed(0)} ➜ ${tapEffective.toFixed(1)} per tap`,
        desc: `Bonuses: ${formatSignedPercent(tapMult - 1)} from decor/boosters`
      },
      {
        label: 'Crit Chance',
        value: formatPercent(Math.min(critChanceTotal, 0.99)),
        desc: `Base ${formatPercent(critChanceBase)} + bonuses`
      },
      {
        label: 'Crit Multiplier',
        value: `${critMultTotal.toFixed(1)}x`,
        desc: 'Damage spike when critting'
      },
      {
        label: 'Combo Cap',
        value: `${state.tap.comboMax}`,
        desc: 'Max stacks before combo decay'
      }
    ]
  });

  sections.push({
    title: 'Garden Mastery',
    rows: [
      {
        label: 'Grow Speed Bonus',
        value: `${formatSignedPercent(growBonus)}`,
        desc: 'Sprinklers, decor, and boosters accelerating crops'
      },
      {
        label: 'Rarity Aura',
        value: formatSignedPercent(rarityBonus),
        desc: 'Chance for Rare/Epic/Legend harvests'
      },
      {
        label: 'Harvest Yield Bonus',
        value: formatSignedPercent(harvestBonus),
        desc: 'Extra credits from decor and global boosts'
      }
    ]
  });

  const boosterRows = [];
  const now = Date.now() / 1000;
  DATA.boosters.forEach((b) => {
    if (activeBoost(b.id)) {
      const remaining = Math.max(0, state.boosters[b.id] - now);
      boosterRows.push({
        label: b.name,
        value: `${Math.ceil(remaining)}s`,
        desc: b.desc
      });
    }
  });
  sections.push({
    title: 'Active Boosters',
    rows: boosterRows.length
      ? boosterRows
      : [
          {
            label: 'None active',
            value: '—',
            desc: 'Buy boosters with tickets to trigger temporary buffs'
          }
        ]
  });

  const decorRows = describeDecor().map((line) => ({ label: line, value: ' ', desc: '' }));
  sections.push({
    title: 'Decor Relics',
    rows: decorRows.length
      ? decorRows
      : [
          {
            label: 'None placed',
            value: '—',
            desc: 'Purchase decor to unlock passive bonuses'
          }
        ]
  });

  sections.push({
    title: 'Automation',
    rows: [
      autoHarvestLevel
        ? {
            label: `Drone Harvester L${autoHarvestLevel}`,
            value: `${autoHarvestCadence?.toFixed(1)}s cadence`,
            desc: 'Swoops harvest-ready crops automatically'
          }
        : {
            label: 'Drone Harvester',
            value: 'Locked',
            desc: 'Purchase the upgrade to enable auto-harvest'
          },
      ...autoplanterRows
    ]
  });

  sections.push({
    title: 'Drops & Rewards',
    rows: [
      {
        label: 'Ticket Drops',
        value: '3% on crits',
        desc: 'Plus +3 tickets every 10 harvests'
      },
      {
        label: 'Gem Chance',
        value: formatPercent(0.05),
        desc: 'Per tap and per harvest'
      }
    ]
  });

  return sections;
}

function renderBonusesPanel() {
  if (!bonusListEl) return;
  const sections = gatherBonusSections();
  const html = sections
    .map(
      (section) => `
      <section class="stats-section">
        <h4>${section.title}</h4>
        ${section.rows
          .map(
            (row) => `
          <div class="stat-row">
            <div class="stat-label">${row.label}</div>
            <div class="stat-value">${row.value}</div>
            ${row.desc ? `<div class="stat-desc">${row.desc}</div>` : ''}
          </div>
        `
          )
          .join('')}
      </section>
    `
    )
    .join('');
  bonusListEl.innerHTML = html;
}

function sortedSeeds() {
  const seedsCopy = [...DATA.seeds];
  if (currentSeedSort === 'costAsc') {
    seedsCopy.sort((a, b) => a.cost - b.cost);
  } else if (currentSeedSort === 'costDesc') {
    seedsCopy.sort((a, b) => b.cost - a.cost);
  }
  return seedsCopy;
}

// --- INTERACTION ---------------------------------------------------------
function onPlotTap(e) {
  const idx = Number(e.currentTarget.dataset.idx);
  const cell = state.grid[idx];
  if (cell.locked) {
    const cost = plotUnlockCost(idx);
    const plotEl = $(`.plot[data-idx="${idx}"]`);
    if (state.credits >= cost) {
      state.credits -= cost;
      cell.locked = false;
      save();
      renderAll();
      if (plotEl) {
        const pop = document.createElement('div');
        pop.className = 'popup';
        pop.textContent = 'Unlocked!';
        plotEl.appendChild(pop);
        setTimeout(() => pop.remove(), 700);
      }
    } else if (plotEl) {
      const pop = document.createElement('div');
      pop.className = 'popup';
      pop.textContent = `${cost.toLocaleString()}💰`;
      plotEl.appendChild(pop);
      setTimeout(() => pop.remove(), 650);
    }
    return;
  }
  if (!cell.seed) {
    openSeedPicker(idx);
    return;
  }
  if (cell.ready) {
    harvest(idx);
    return;
  }
  // manual haste tap: trim remaining grow time by 2%
  const now = nowSeconds();
  const elapsed = Math.max(0, now - cell.plantedAt);
  const remain = Math.max(0, cell.grow - elapsed);
  const hasteFactor = 1 + boostVal('growSpeed') + state.upgrades.autoWater * 0.05;
  const shaved = 0.02 * cell.grow * hasteFactor;
  const newRemain = Math.max(0, remain - shaved);
  cell.grow = elapsed + newRemain;
}

function openSeedPicker(idx) {
  const dlg = $('#seedPicker');
  const list = $('#seedPickerList');
  if (dlg) dlg.dataset.idx = idx;
  list.innerHTML = '';
  sortedSeeds().forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    const profit = s.yield - s.cost;
    const bonusDrops = seedDropSummary(s);
    const minHarvest = s.yield;
    const maxHarvest = Math.round(s.yield * MAX_RARITY_MULT);
    b.innerHTML = `
      <h4>${s.spr} ${s.name}</h4>
      <div class="meta">💰 ${s.cost.toLocaleString()} · ⏱️ ${s.grow}s</div>
      <div class="meta">Harvest: ${minHarvest.toLocaleString()} - ${maxHarvest.toLocaleString()} 💰</div>
      <div class="meta">Net +${profit.toLocaleString()} 💰 (base)</div>
      ${bonusDrops ? `<div class="meta">Bonus Drops: ${bonusDrops}</div>` : ''}
      <p class="meta seed-desc">${s.desc}</p>
    `;
    b.onclick = () => {
      if (!plantSeedInPlot(idx, s)) return;
      const label = document.querySelector(`.plot[data-idx="${idx}"] .auto-label`);
      if (label) label.textContent = '';
      save();
      renderAll();
      dlg.close();
    };
    list.appendChild(b);
  });
  dlg.showModal();
}

function harvest(idx) {
  const cell = state.grid[idx];
  const sdef = seedById(cell.seed);
  const now = nowSeconds();
  if (!sdef || now - cell.plantedAt < cell.grow) return;
  const r = rollRarity(boostVal('rarityWeight'));
  const yieldBase = sdef.yield * r.m;
  const yieldDecor = 1 + decorVal('tapYield') * 0.3 + boostVal('globalCredits');
  const payout = Math.round(yieldBase * yieldDecor);
  state.credits += payout;
  state.harvestsThisSession += 1;
  state.stats.totalHarvests += 1;
  if (state.harvestsThisSession % 10 === 0) state.tickets += 3;
  const gemChance = typeof sdef.gemChance === 'number' ? sdef.gemChance : 0.05;
  if (Math.random() < gemChance) state.gems += 1;
  if (typeof sdef.ticketChance === 'number' && Math.random() < sdef.ticketChance) state.tickets += 1;
  const el = $(`.plot[data-idx="${idx}"]`);
  const pop = document.createElement('div');
  pop.className = 'popup';
  pop.textContent = `+${payout}`;
  el.appendChild(pop);
  setTimeout(() => pop.remove(), 800);
  if (r.key !== 'common') {
    spawnSparkle(el, r.a || r.key);
    const valueText = `Worth ${payout.toLocaleString()} 💰`;
    if (r.key === 'legend' || r.key === 'legendary') {
      pushToast({ title: 'Legendary Bloom!', body: `${sdef.spr} ${sdef.name} delivered a legendary harvest! ${valueText}`, kind: 'legendary' });
    } else if (r.key === 'epic') {
      pushToast({ title: 'Epic Bloom!', body: `${sdef.spr} ${sdef.name} bloomed with epic rewards! ${valueText}`, kind: 'epic' });
    }
  }
  state.grid[idx] = { ...cell, seed: null, plantedAt: 0, grow: 0, ready: false, aura: r.a };
  const label = el ? el.querySelector('.auto-label') : null;
  if (label) label.textContent = '';
  save();
  renderAll();
}

// --- CENTRAL FLOWER (TAP) -----------------------------------------------
function handleFlowerTap(event) {
  if (event) event.preventDefault();
  let power = state.tap.power * (1 + decorVal('tapYield')) * (1 + boostVal('tapPower')) * (1 + boostVal('globalCredits'));
  const critChance = state.tap.critChance + decorVal('critChance') + boostVal('critChance');
  const critMultiplier = state.tap.critMult * (1 + decorVal('critMult'));
  const isCrit = Math.random() < critChance;
  let gain = power;
  if (isCrit) {
    gain *= critMultiplier;
    state.stats.totalCrits += 1;
    if (Math.random() < 0.03) state.tickets += 1;
  }
  if (Math.random() < 0.05) state.gems += 1;
  state.stats.totalTaps += 1;
  state.credits += Math.round(gain);
  state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1);
  const p = document.createElement('div');
  p.className = 'popup' + (isCrit ? ' crit' : '');
  p.textContent = '+' + Math.round(gain);
  flowerEl.appendChild(p);
  setTimeout(() => p.remove(), 500);
  save();
  refreshTop();
  renderCombo();
}

flowerEl.addEventListener('click', handleFlowerTap);
flowerEl.addEventListener(
  'touchstart',
  (event) => {
    handleFlowerTap(event);
  },
  { passive: false }
);

setInterval(() => {
  state.tap.combo = Math.max(0, state.tap.combo - 1);
  renderCombo();
}, 1000);

// --- PANELS --------------------------------------------------------------
function buildPanels() {
  const pu = $('#panel-upgrades');
  pu.innerHTML = '';
  const compendiumCard = document.createElement('button');
  compendiumCard.type = 'button';
  compendiumCard.className = 'card compendium-card';
  compendiumCard.innerHTML = `<h4>📖 Seed Almanac</h4><div class="toggle">Tap to view all blooms and their stats</div>`;
  const compendiumBody = document.createElement('div');
  compendiumBody.className = 'compendium-body';
  DATA.seeds.forEach((s) => {
    const profit = s.yield - s.cost;
    const bonusDrops = seedDropSummary(s);
    const minHarvest = s.yield;
    const maxHarvest = Math.round(s.yield * MAX_RARITY_MULT);
    const item = document.createElement('div');
    item.className = 'seed-card';
    item.innerHTML = `
      <h5>${s.spr} ${s.name}</h5>
      <div class="stat-line"><span>Cost</span><span>${s.cost.toLocaleString()} 💰</span></div>
      <div class="stat-line"><span>Grow</span><span>${s.grow}s</span></div>
      <div class="stat-line"><span>Harvest</span><span>${minHarvest.toLocaleString()} - ${maxHarvest.toLocaleString()} 💰</span></div>
      <div class="stat-line"><span>Net</span><span>+${profit.toLocaleString()} 💰</span></div>
      ${bonusDrops ? `<div class="stat-line"><span>Bonus Drops</span><span>${bonusDrops}</span></div>` : ''}
      <p class="desc">${s.desc}</p>
    `;
    compendiumBody.appendChild(item);
  });
  compendiumCard.addEventListener('click', () => {
    const open = compendiumBody.classList.toggle('open');
    compendiumCard.classList.toggle('open', open);
  });
  pu.appendChild(compendiumCard);
  pu.appendChild(compendiumBody);
  const ups = [
    {
      key: 'tapPower',
      label: DATA.upgrades.tapPower.name,
      price: () => DATA.upgrades.tapPower.base * Math.pow(DATA.upgrades.tapPower.scale, state.upgrades.tapPower),
      apply: () => {
        state.upgrades.tapPower += 1;
        state.tap.power += 1;
        return true;
      }
    },
    {
      key: 'critChance',
      label: DATA.upgrades.critChance.name,
      price: () => DATA.upgrades.critChance.base * Math.pow(DATA.upgrades.critChance.scale, state.upgrades.critChance),
      apply: () => {
        state.upgrades.critChance += 1;
        state.tap.critChance += 0.01;
        return true;
      }
    },
    {
      key: 'critMult',
      label: DATA.upgrades.critMult.name,
      price: () => DATA.upgrades.critMult.base * Math.pow(DATA.upgrades.critMult.scale, state.upgrades.critMult),
      apply: () => {
        state.upgrades.critMult += 1;
        state.tap.critMult = Math.min(50, state.tap.critMult + 2);
        return true;
      }
    },
    {
      key: 'comboMeter',
      label: DATA.upgrades.comboMeter.name,
      price: () => DATA.upgrades.comboMeter.base * Math.pow(DATA.upgrades.comboMeter.scale, state.upgrades.comboMeter),
      apply: () => {
        state.upgrades.comboMeter += 1;
        state.tap.comboMax = Math.min(100, state.tap.comboMax + 10);
        return true;
      }
    },
    {
      key: 'plotExpansion',
      label: DATA.upgrades.plotExpansion.name,
      price: () => DATA.upgrades.plotExpansion.base * Math.pow(DATA.upgrades.plotExpansion.scale, state.upgrades.plotExpansion),
      apply: () => {
        const unlocked = unlockNextPlots(2);
        if (unlocked > 0) {
          state.upgrades.plotExpansion += 1;
          return true;
        }
        return false;
      },
      disabled: () => state.grid.every((c) => !c.locked)
    },
    {
      key: 'autoWater',
      label: DATA.upgrades.autoWater.name,
      price: () => DATA.upgrades.autoWater.base * Math.pow(DATA.upgrades.autoWater.scale, state.upgrades.autoWater),
      apply: () => {
        state.upgrades.autoWater += 1;
        return true;
      }
    },
    {
      key: 'autoHarvest',
      label: DATA.upgrades.autoHarvest.name,
      price: () => DATA.upgrades.autoHarvest.base * Math.pow(DATA.upgrades.autoHarvest.scale, state.upgrades.autoHarvest),
      apply: () => {
        state.upgrades.autoHarvest += 1;
        return true;
      }
    }
  ];
  PLOT_AUTOPLANTERS.forEach(({ key }) => {
    ups.push({
      key,
      label: DATA.upgrades[key].name,
      price: () => DATA.upgrades[key].base * Math.pow(DATA.upgrades[key].scale, state.upgrades[key]),
      apply: () => {
        state.upgrades[key] += 1;
        return true;
      }
    });
  });
  ups.forEach((u) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card buy';
    const desc = DATA.upgrades[u.key]?.desc;
    btn.innerHTML = `<h4>${u.label}</h4><div class="meta">💰 ${Math.round(u.price()).toLocaleString()}</div>${desc ? `<div class="meta">${desc}</div>` : ''}`;
    btn.onclick = () => {
      if (u.disabled && u.disabled()) return;
      const cost = Math.round(u.price());
      if (state.credits < cost) return;
      state.credits -= cost;
      const result = u.apply();
      if (result === false) {
        state.credits += cost;
        return;
      }
      save();
      renderAll();
      buildPanels();
    };
    if (u.disabled && u.disabled()) btn.disabled = true;
    pu.appendChild(btn);
  });

  const pd = $('#panel-decor');
  pd.innerHTML = '';
  DATA.decor.forEach((d) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card buy';
    btn.innerHTML = `<h4>${d.spr} ${d.name}</h4><div class="meta">${d.cost} ${d.currency === 'gems' ? '💎' : d.currency === 'tickets' ? '🎟️' : '💰'}</div><div class="meta">${d.desc}</div>`;
    btn.onclick = () => {
      if (d.currency === 'gems') {
        if (state.gems < d.cost) return;
        state.gems -= d.cost;
      } else if (d.currency === 'tickets') {
        if (state.tickets < d.cost) return;
        state.tickets -= d.cost;
      } else {
        if (state.credits < d.cost) return;
        state.credits -= d.cost;
      }
      state.decor.push(d);
      save();
      renderAll();
    };
    pd.appendChild(btn);
  });

  const pb = $('#panel-boosters');
  pb.innerHTML = '';
  DATA.boosters.forEach((b) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.booster = b.id;
    btn.className = 'card buy';
    btn.innerHTML = `<h4>${b.name}</h4><div class="meta">${b.tickets} 🎟️ · ${b.dur}s</div><div class="meta">${b.desc}</div>`;
    btn.onclick = () => {
      if (state.tickets < b.tickets) return;
      state.tickets -= b.tickets;
      state.boosters[b.id] = Date.now() / 1000 + b.dur;
      save();
      renderAll();
    };
    pb.appendChild(btn);
  });
}

// --- NAV ---------------------------------------------------------------
$$('.dock-btn').forEach((b) =>
  b.addEventListener('click', () => {
    $$('.dock-btn').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.dataset.tab;
    $$('.panel').forEach((p) => p.classList.remove('active'));
    $(`#panel-${tab}`).classList.add('active');
  })
);

// --- SETTINGS -----------------------------------------------------------
$('#btnSettings').onclick = () => $('#settings').showModal();
$('#resetBtn').onclick = () => {
  localStorage.removeItem('igr-save');
  Object.assign(state, defaultState());
  lastAutoHarvest = 0;
  buildPanels();
  renderAll();
};
const cheatBtn = $('#cheatBtn');
if (cheatBtn) {
  cheatBtn.onclick = () => {
    state.gems += 50;
    state.tickets += 50;
    save();
    renderAll();
  };
}

if (btnBonuses && bonusesDlg) {
  btnBonuses.onclick = () => {
    renderBonusesPanel();
    bonusesDlg.showModal();
  };
}

if (seedSortSelect) {
  seedSortSelect.addEventListener('change', (e) => {
    currentSeedSort = e.target.value;
    const dlg = document.querySelector('#seedPicker[open]');
    if (dlg && typeof dlg.dataset.idx !== 'undefined') {
      openSeedPicker(Number(dlg.dataset.idx));
    }
  });
}

$$('.dialog-close').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dlg = btn.closest('dialog');
    if (dlg) dlg.close();
  });
});

// --- LOOP ---------------------------------------------------------------
function tick() {
  removeExpiredBoosters();
  const now = nowSeconds();
  processAutomation(now);
  processPlotHarvesters();
  renderAll();
  requestAnimationFrame(tick);
}

// --- INIT ---------------------------------------------------------------
load();
buildPlots();
buildPanels();
renderAll();
requestAnimationFrame(tick);

