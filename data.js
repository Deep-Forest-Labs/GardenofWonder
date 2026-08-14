/* Garden Wonder — content tables.
   Economy values are carried over unchanged from Idle Garden Reborn;
   the `art` block on each seed only drives the procedural SVG. */

const PLOT_AUTOPLANTERS = Array.from({ length: 8 }, (_, i) => {
  const base = Math.round(3000 * Math.pow(1.3, i));
  return {
    key: `plot${i + 1}Harvester`,
    idx: i,
    name: `Plot ${i + 1} Harvester`,
    short: `Harvester ${i + 1}`,
    base,
    scale: 2.3,
    icon: 'hand',
    desc: `Assign a harvester to plot ${i + 1} to auto-plant higher tier seeds.`
  };
});

const DATA = {
  rarity: [
    { key: 'common', w: 70, m: 1, a: '', label: 'Common' },
    { key: 'rare', w: 20, m: 2, a: 'rare', label: 'Rare' },
    { key: 'epic', w: 8, m: 4, a: 'epic', label: 'Epic' },
    { key: 'legend', w: 2, m: 8, a: 'legend', label: 'Legendary' }
  ],

  seeds: [
    {
      id: 'daisy', name: 'Daisy', cost: 50, grow: 12, yield: 70, spr: '🌼', unlockLevel: 1,
      desc: 'Swift starter bloom; perfect for keeping early plots busy.',
      art: { shape: 'round', petals: 12, c1: '#ffffff', c2: '#ffeef6', core: '#ffd23f', leaf: '#57c15b' }
    },
    {
      id: 'tulip', name: 'Tulip', cost: 110, grow: 18, yield: 154, spr: '🌷', unlockLevel: 1,
      desc: 'Reliable mid-tier earner with a splash of spring color.',
      art: { shape: 'tulip', petals: 3, c1: '#ff5d8f', c2: '#ff9dbd', core: '#ffd23f', leaf: '#4bb257' }
    },
    {
      id: 'bluebell', name: 'Bluebell', cost: 180, grow: 24, yield: 252, spr: '🪻', unlockLevel: 1,
      desc: 'Shaded blossom that rewards patient gardeners.',
      art: { shape: 'bell', petals: 5, c1: '#6f7bff', c2: '#a5adff', core: '#eceeff', leaf: '#43a95a' }
    },
    {
      id: 'lavender', name: 'Lavender', cost: 260, grow: 28, yield: 364, spr: '💜', unlockLevel: 2,
      desc: 'Calming scent draws in gentle critters and steady credits.',
      art: { shape: 'spike', petals: 8, c1: '#a06cd5', c2: '#cba3f0', core: '#efe0ff', leaf: '#57a06a' }
    },
    {
      id: 'rose', name: 'Rose', cost: 350, grow: 32, yield: 490, spr: '🌹', unlockLevel: 3,
      desc: 'Classic bloom with a hint of thorny rarity potential.',
      art: { shape: 'rose', petals: 8, c1: '#e03131', c2: '#ff7a7a', core: '#b02525', leaf: '#3f9950' }
    },
    {
      id: 'peony', name: 'Peony', cost: 500, grow: 42, yield: 700, spr: '🌺', unlockLevel: 4,
      desc: 'Bursting petals deliver hearty, reliable payouts.',
      art: { shape: 'round', petals: 15, c1: '#ff4f9a', c2: '#ff93c4', core: '#ffe066', leaf: '#46ad5c' }
    },
    {
      id: 'marigold', name: 'Marigold', cost: 750, grow: 55, yield: 1050, spr: '🌻', unlockLevel: 5,
      desc: 'Sun-kissed bloom that loves booster synergies.',
      art: { shape: 'point', petals: 16, c1: '#ff9f1c', c2: '#ffc857', core: '#8a5a2b', leaf: '#4faa4f' }
    },
    {
      id: 'orchid', name: 'Orchid', cost: 1100, grow: 90, yield: 1540, spr: '🪷', unlockLevel: 6,
      desc: 'Elegant slow-grower with strong harvest multipliers.',
      art: { shape: 'lotus', petals: 8, c1: '#ff8fd0', c2: '#ffd4ec', core: '#ffe066', leaf: '#46ad7c' }
    },
    {
      id: 'sunlotus', name: 'Sun Lotus', cost: 2200, grow: 140, yield: 3080, spr: '🌞', unlockLevel: 7,
      desc: 'Radiant lotus that charges the garden with light.',
      art: { shape: 'sun', petals: 12, c1: '#ffc93c', c2: '#fff3b0', core: '#ff8f1f', leaf: '#5cb85c', glow: '#ffd85e' }
    },
    {
      id: 'jadefern', name: 'Jade Fern', cost: 3200, grow: 180, yield: 4480, spr: '🌿', unlockLevel: 8,
      desc: 'Ancient frond storing rich nutrients for big hauls.',
      art: { shape: 'fern', petals: 6, c1: '#43aa5a', c2: '#8ce99a', core: '#2f7d3f', leaf: '#2f7d3f' }
    },
    {
      id: 'moonflower', name: 'Moonflower', cost: 4500, grow: 220, yield: 6300, spr: '🌙', unlockLevel: 9,
      desc: 'Night-blooming marvel with stellar rarity chances.',
      art: { shape: 'lotus', petals: 7, c1: '#b9dcff', c2: '#ffffff', core: '#7aa8ff', leaf: '#4a8fa8', glow: '#a9d8ff' }
    },
    {
      id: 'starlit', name: 'Starlit Iris', cost: 6500, grow: 280, yield: 9100, spr: '✨', unlockLevel: 10,
      desc: 'Nebula-touched petals shimmer with crit energy.',
      art: { shape: 'star', petals: 6, c1: '#b197fc', c2: '#e7dcff', core: '#ffe066', leaf: '#5c8bd6', glow: '#c9b6ff' }
    },
    {
      id: 'aurora', name: 'Aurora Bloom', cost: 9000, grow: 360, yield: 12600, spr: '🌌', unlockLevel: 11,
      desc: 'Polar blossoms that pulse with global credit bonuses.',
      art: { shape: 'lotus', petals: 10, c1: '#3bc9db', c2: '#a5f3fc', core: '#b197fc', leaf: '#2f9e9e', glow: '#7ef0ff' }
    },
    {
      id: 'celestial', name: 'Celestial Lotus', cost: 12000, grow: 480, yield: 16800, spr: '🪐', unlockLevel: 12,
      desc: 'Garden apex flower drawing cosmic fortune to every plot.',
      art: { shape: 'orb', petals: 10, c1: '#4c6ef5', c2: '#93a9ff', core: '#ffd43b', leaf: '#3f6fa8', ring: true, glow: '#8aa6ff' }
    },
    {
      id: 'nebula', name: 'Nebula Orchid', cost: 20000, grow: 540, yield: 28000, spr: '🌠', unlockLevel: 13,
      desc: 'Starlit bloom humming with distant stardust dividends.',
      gemChance: 0.008,
      art: { shape: 'star', petals: 8, c1: '#d6336c', c2: '#f9a3c1', core: '#845ef7', leaf: '#7048b6', glow: '#ff7ab8' }
    },
    {
      id: 'solstice', name: 'Solstice Lily', cost: 35000, grow: 600, yield: 49000, spr: '☀️', unlockLevel: 14,
      desc: 'Radiant petals channel sunflare surges and rare gems.',
      gemChance: 0.01,
      art: { shape: 'sun', petals: 14, c1: '#ff922b', c2: '#ffdfae', core: '#fff3bf', leaf: '#59a83f', glow: '#ffb454' }
    },
    {
      id: 'auroracrown', name: 'Aurora Crown', cost: 52000, grow: 660, yield: 72800, spr: '🌈', unlockLevel: 15,
      desc: 'Auroral halo weaves shimmering rewards across the garden.',
      gemChance: 0.012,
      art: { shape: 'point', petals: 12, c1: '#7ce0ff', c2: '#ffe6a7', core: '#ff8fd0', leaf: '#48b39a', rainbow: true, glow: '#b7f5ff' }
    },
    {
      id: 'mythicstar', name: 'Mythic Starflower', cost: 75000, grow: 720, yield: 105000, spr: '🌟', unlockLevel: 16,
      desc: 'Legend-touched bloom whispering of premium windfalls.',
      gemChance: 0.015,
      art: { shape: 'star', petals: 5, c1: '#ffd43b', c2: '#fff6cc', core: '#ff922b', leaf: '#7a9a3f', glow: '#ffe066' }
    },
    {
      id: 'eternal', name: 'Eternal Crown', cost: 100000, grow: 780, yield: 140000, spr: '💫', unlockLevel: 17,
      desc: 'Limitless petals with a rare promise of gems.',
      gemChance: 0.02,
      art: { shape: 'lotus', petals: 12, c1: '#ffcf5c', c2: '#fffdf0', core: '#ff9f1c', leaf: '#c9a227', ring: true, glow: '#fff0b0' }
    }
  ],

  upgrades: {
    tapPower:      { name: 'Tap Power +1',      short: 'Power Punch',   base: 100,  scale: 2,   icon: 'fist',  desc: 'Increase base tap payout by +1 credit per tap.' },
    holdSpeed:     { name: 'Quick Grip',        short: 'Quick Grip',    base: 150,  scale: 1.9, icon: 'clock', desc: 'Hold the flower instead of tapping it — each level speeds up the hold, up to a full rapid-tap pace.' },
    critChance:    { name: '+1% Crit',          short: 'Lucky Charm',   base: 500,  scale: 1.5, icon: 'clover', desc: 'Raise tap critical hit chance by +1%.' },
    critMult:      { name: '+2x Crit Mult',     short: 'Star Strike',   base: 1000, scale: 2,   icon: 'star',  desc: 'Boost tap crit multiplier by +2x (up to 50x).' },
    comboMeter:    { name: 'Tap Combo Boost',   short: 'Combo Coil',    base: 2500, scale: 2,   icon: 'flame', desc: 'Extend combo cap by +10 taps.' },
    rainDance:     { name: 'Rain Dance',        short: 'Rain Dance',    base: 250,  scale: 1.8, icon: 'sprout', desc: 'A rare chance on every tap to instantly water a random growing plot, shaving 3s off its remaining time (up to 2%).' },
    beeSwarm:      { name: 'Bee Swarm',         short: 'Bee Swarm',     base: 2000, scale: 2,   icon: 'bee',   desc: 'A rare chance on every tap to send a wild swarm to fill a jar in a hive with room (up to 1%).' },
    ladybug:       { name: 'Lucky Ladybug',     short: 'Lucky Ladybug', base: 800,  scale: 1.9, icon: 'ladybug', desc: 'A rare chance on every tap to land a ladybug on a growing plot, boosting its rarity odds when harvested (up to 1.6%).' },
    plotExpansion: { name: 'Plot Expansion +2', short: 'Land Deed',     base: 2000, scale: 2,   icon: 'grid',  desc: 'Unlock two garden plots your reputation has already opened.' },
    autoWater:     { name: 'Sprinkler Network', short: 'Sprinklers',    base: 400,  scale: 1.7, icon: 'drop',  desc: 'Increase grow speed by 1% per level for all plants (up to 10%).' },
    autoHarvest:   { name: 'Drone Harvester',   short: 'Harvest Drone', base: 4500, scale: 2.4, icon: 'drone', desc: 'Automatically harvest a ready plot on a timer.' }
  },

  /* Purely cosmetic — no gameplay effect. See docs/15-navigation-and-ia.md for why. */
  decor: [
    { id: 'gnome',      name: 'Gnome of Fortune',  currency: 'gems',    cost: 250,  spr: '🧙', icon: 'gnome',   desc: 'A cheerful garden gnome. Purely for luck of the decorative kind.' },
    { id: 'shrine',     name: 'Butterfly Shrine',  currency: 'credits', cost: 1000, spr: '🦋', icon: 'butterfly', desc: 'Butterflies drift lazily around the little shrine.' },
    { id: 'fountain',   name: 'Crystal Fountain',  currency: 'credits', cost: 5000, spr: '⛲', icon: 'fountain', desc: 'Water trickles prettily. Doesn\u2019t do anything, and that\u2019s fine.' },
    { id: 'lanterntree', name: 'Lantern Tree',     currency: 'gems',    cost: 40,   spr: '🏮', icon: 'lantern',  desc: 'Glows warm at dusk. A nice spot for the flower to nap.' }
  ],

  boosters: [
    { id: 'bloom',    name: 'Bloom Burst',   dur: 30,   icon: 'bolt',    tint: '#ff6b9d', effects: { tapPower: 0.5, critChance: 0.02 }, desc: '+50% tap power and +2% crit chance for 30s.' },
    { id: 'seedrush', name: 'Seed Rush',     dur: 600,  icon: 'sprout',  tint: '#51cf66', effects: { growSpeed: 0.3 },                  desc: '+30% growth speed for ten minutes.' },
    { id: 'fortune',  name: 'Fortune Aura',  dur: 1800, icon: 'clover',  tint: '#9775fa', effects: { rarityWeight: 0.5 },               desc: '+50% rarity odds for harvests during the aura.' },
    { id: 'golden',   name: 'Golden Popups', dur: 30,   icon: 'coin',    tint: '#ffc93c', effects: { globalCredits: 0.25 },             desc: '+25% credits from all sources for 30s.' }
  ],

  /* Indices 0–3 start open. The rest become buyable at these levels, then cost gold. */
  plotUnlockLevel: [1, 1, 1, 1, 3, 6, 9, 12],

  levelCoinGrant: 20,
  harvestRepEvery: 10,
  harvestRepGrant: 1,
  levelGrants: {
    3: { boost: 'bloom' },
    6: { boost: 'seedrush' },
    9: { boost: 'golden' },
    12: { boost: 'fortune' },
    15: { boost: 'bloom' },
    18: { hive: 1 },
    19: { decor: 'shrine' },
    20: { gems: 5 }
  },

  /* Collection milestones. `at` is distinct species harvested, not inventory.
     The last rung is DATA.seeds.length; bump it if you add a seed. */
  almanacMilestones: [
    { at: 5,  rep: 20, gems: 1, boost: 'bloom' },
    { at: 10, rep: 30, gems: 2, boost: 'seedrush' },
    { at: 15, rep: 40, gems: 3, boost: 'fortune' },
    { at: 19, rep: 50, gems: 5, boost: 'golden' }
  ],

  /* Bloom Mastery. The ladder itself is generated in game.js — nineteen flowers
     times an endless ladder cannot live here as data. These are the payouts.
     Anything a tier pays is multiplied by nineteen flowers and never stops, so
     masteryGemEvery is a ceiling and not a dial. */
  masteryYieldPerTier: 0.05,
  masteryGemEvery: 5,
  masteryGemGrant: 1,

  quests: [
    { id: 'q_tap_25',      text: 'Tap 25 times',            track: 'tap',     qty: 25,  rep: 5 },
    { id: 'q_plant_1',     text: 'Plant a seed',            track: 'plant',   qty: 1,   rep: 5 },
    { id: 'q_harvest_1',   text: 'Harvest a bloom',         track: 'harvest', qty: 1,   rep: 5 },
    { id: 'q_daisy_5',     text: 'Harvest 5 daisies',       track: 'harvest', key: 'daisy',    qty: 5,  rep: 8 },
    { id: 'q_power_1',     text: 'Buy Power Punch',         track: 'upgrade', key: 'tapPower', qty: 1,  rep: 8 },
    { id: 'q_tap_50',      text: 'Tap 50 times',            track: 'tap',     qty: 50,  rep: 10, after: 'q_power_1' },
    { id: 'q_tulip_3',     text: 'Harvest 3 tulips',        track: 'harvest', key: 'tulip',    qty: 3,  rep: 10 },
    { id: 'q_grip_1',      text: 'Buy Quick Grip',          track: 'upgrade', key: 'holdSpeed', qty: 1, rep: 12 },
    { id: 'q_hold_20',     text: 'Hold the flower 20 times', track: 'hold',   qty: 20,  rep: 12, after: 'q_grip_1' },
    { id: 'q_plant_8',     text: 'Plant 8 seeds',           track: 'plant',   qty: 8,   rep: 12 },
    { id: 'q_sell_5',      text: 'Sell 5 flowers',          track: 'sell',    qty: 5,   rep: 12 },
    { id: 'q_hive_1',      text: 'Build a hive',            track: 'hive',    qty: 1,   rep: 14, reward: { boost: 'seedrush' } },
    { id: 'q_honey_3',     text: 'Fill 3 honey jars',       track: 'honey',   qty: 3,   rep: 16 },
    { id: 'q_harvest_10',  text: 'Harvest 10 blooms',       track: 'harvest', qty: 10,  rep: 16 },
    { id: 'q_tea',         text: 'Craft Flower Tea',        track: 'craft',   key: 'tea',      qty: 1,  rep: 18, reward: { boost: 'golden' } },
    { id: 'q_charm_1',     text: 'Buy Lucky Charm',         track: 'upgrade', key: 'critChance', qty: 1, rep: 20 },
    { id: 'q_crit_1',      text: 'Land a crit',             track: 'crit',    qty: 1,   rep: 20, after: 'q_charm_1' },
    { id: 'q_rose_3',      text: 'Harvest 3 roses',         track: 'harvest', key: 'rose',     qty: 3,  rep: 20 },
    { id: 'q_lavender_3',  text: 'Harvest 3 lavender',      track: 'harvest', key: 'lavender', qty: 3,  rep: 22 },
    { id: 'q_rare',        text: 'Harvest a Rare bloom',    track: 'rarity',  key: 'rare',     qty: 1,  rep: 24, reward: { boost: 'fortune' } },
    { id: 'q_star_1',      text: 'Buy Star Strike',         track: 'upgrade', key: 'critMult', qty: 1,  rep: 24 },
    { id: 'q_perfume',     text: 'Craft Petal Perfume',     track: 'craft',   key: 'perfume',  qty: 1,  rep: 32 },
    { id: 'q_honey_8',     text: 'Fill 8 honey jars',       track: 'honey',   qty: 8,   rep: 36 },
    { id: 'q_epic',        text: 'Harvest an Epic bloom',   track: 'rarity',  key: 'epic',     qty: 1,  rep: 40, reward: { boost: 'fortune' } },
    { id: 'q_coil_1',      text: 'Buy Combo Coil',          track: 'upgrade', key: 'comboMeter', qty: 1, rep: 28 },
    { id: 'q_combo_55',    text: 'Reach combo 55',          track: 'combo',   qty: 55,  rep: 30, after: 'q_coil_1', reward: { boost: 'bloom' } },
    { id: 'q_harvest_25',  text: 'Harvest 25 blooms',       track: 'harvest', qty: 25,  rep: 42 },
    { id: 'q_plant_20',    text: 'Plant 20 seeds',          track: 'plant',   qty: 20,  rep: 44 },
    { id: 'q_peony_3',     text: 'Harvest 3 peonies',       track: 'harvest', key: 'peony',    qty: 3,  rep: 46 },
    { id: 'q_craft_2',     text: 'Craft 2 goods',           track: 'craft',   qty: 2,   rep: 48 },
    { id: 'q_marigold_3',  text: 'Harvest 3 marigolds',     track: 'harvest', key: 'marigold', qty: 3,  rep: 42 },
    { id: 'q_harvest_40',  text: 'Harvest 40 blooms',       track: 'harvest', qty: 40,  rep: 46 },
    { id: 'q_sell_10',     text: 'Sell 10 flowers',         track: 'sell',    qty: 10,  rep: 50 }
  ],

  dailies: [
    { id: 'd_harvest_10', text: 'Harvest 10 blooms', track: 'harvest', qty: 10,  rep: 12, reward: { credits: 50, boost: 'seedrush' } },
    { id: 'd_plant_6',    text: 'Plant 6 seeds',     track: 'plant',   qty: 6,   rep: 12, reward: { credits: 50, boost: 'seedrush' } },
    { id: 'd_tap_100',    text: 'Tap 100 times',     track: 'tap',     qty: 100, rep: 12, reward: { credits: 40, boost: 'bloom' } },
    { id: 'd_sell_3',     text: 'Sell 3 flowers',    track: 'sell',    qty: 3,   rep: 12, reward: { credits: 50, boost: 'golden' } }
  ]
};

PLOT_AUTOPLANTERS.forEach((cfg) => {
  DATA.upgrades[cfg.key] = {
    name: cfg.name,
    short: cfg.short,
    base: cfg.base,
    scale: cfg.scale,
    icon: cfg.icon,
    desc: cfg.desc
  };
});

const MAX_RARITY_MULT = Math.max(...DATA.rarity.map((r) => r.m));

/* ---------------------------------------------------------------------------
   Apiary + Apothecary — prototype of the meta-layer resource loop.
   See docs/12-meta-layer-design.md. Every number here is provisional: the point
   of the prototype is to find out whether the loop is fun, not to be balanced.

   Timings are deliberately compressed to match the existing garden, where a
   Daisy matures in 12s. The mobile-scale values live in docs/14-economy-model.md.
--------------------------------------------------------------------------- */

const APIARY = {
  maxHives: 4,
  interval: 90,        // seconds per jar
  capacity: 5,         // jars a hive holds before the bees stop working
  pollination: 0.08,   // garden yield bonus per hive
  waxChance: 0.5,      // chance of a wax comb alongside each jar
  hiveCost: (owned) => Math.round(2500 * Math.pow(2, owned)),

  // A jar's worth follows the bloom it came from — this is what makes the
  // garden's *contents* matter to the Apiary, not just its throughput.
  honeyValue: (seedId) => {
    const s = DATA.seeds.find((x) => x.id === seedId);
    return s ? Math.round(s.yield * 0.5) : 40;
  },
  honeyName: (seedId) => {
    const s = DATA.seeds.find((x) => x.id === seedId);
    return s ? `${s.name} Honey` : 'Wildflower Honey';
  },
  wildHoney: 'wild',
  waxValue: 60
};

/* Harvesting a plot now also yields the flower itself, as a byproduct. */
const flowerValue = (seedId) => {
  const s = DATA.seeds.find((x) => x.id === seedId);
  return s ? Math.round(s.yield * 0.25) : 10;
};

/* Recipes must draw on at least two regions — that rule is what stops the
   regions from being parallel faucets. Lavender Salve goes further and demands
   a specific bloom, so the garden has to be planted deliberately. */
const CRAFT_RECIPES = [
  {
    id: 'tea', name: 'Flower Tea', icon: 'teacup', time: 60, value: 250,
    needs: [{ kind: 'flower', qty: 3 }, { kind: 'honey', qty: 1 }],
    desc: 'Three petals steeped with a spoon of any honey.'
  },
  {
    id: 'perfume', name: 'Petal Perfume', icon: 'perfume', time: 180, value: 700,
    needs: [{ kind: 'flower', qty: 5 }, { kind: 'wax', qty: 2 }],
    desc: 'Pressed petals set in beeswax. Slow, but it keeps.'
  },
  {
    id: 'salve', name: 'Lavender Salve', icon: 'salve', time: 120, value: 1200,
    needs: [{ kind: 'honey', of: 'lavender', qty: 2 }, { kind: 'wax', qty: 1 }, { kind: 'flower', qty: 2 }],
    desc: 'Needs true lavender honey — keep lavender in the ground.'
  }
];

const CRAFT_SLOTS = 2;

/* Wonder Effect — a rare garden-wide transformation. */
const WONDER = {
  duration: 20,
  payoutMult: 3,
  growMult: 3,
  harvestChance: 0.02,
  tapChance: 0.0015,
  cooldown: 90,
  lines: [
    'The garden is dreaming!',
    'Everything is blooming at once!',
    'Reality is going wonderful!',
    'Hold on to your watering can!'
  ]
};

/* Things the Talking Flower says. */
const FLOWER_LINES = {
  greet: ['Well hello, gardener!', 'You came back!', 'The soil missed you.', 'Ready to grow something?'],
  tap: ['Ooh, do that again!', 'Tickles!', 'Keep it coming!', 'That is the spirit!', 'More petals, please!'],
  crit: ['WOW! Critical bloom!', 'Sparkles everywhere!', 'That one shook the roots!', 'Magnificent!'],
  harvest: ['Beautiful harvest!', 'Look at that haul!', 'The basket runneth over!', 'Fresh from the soil!'],
  legend: ['A LEGENDARY bloom!', 'I have never seen such petals!', 'Legendary! Frame it!'],
  idle: ['Psst... the plots are lonely.', 'Try planting something new.', 'Tap me if you get bored.', 'Nice weather for growing.'],
  broke: ['Save up a few coins first!', 'Not enough in the pouch.', 'Tap me for pocket change!'],
  unlock: ['New ground to grow on!', 'More room for flowers!', 'Ooh, fresh soil!'],
  wonder: ['WONDERRRR!', 'Everything is upside-down lovely!', 'Grab it all!']
};
