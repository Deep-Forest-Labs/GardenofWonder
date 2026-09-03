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


/* ============ THE CARD ALBUM ============
   A parallel meta, deliberately independent of the garden — no card is earned by growing anything
   in particular. See docs/19-card-album.md.

   Card art is a *slot*, not a commitment: `{ icon, tint }` draws a procedural placeholder from the
   existing icon vocabulary, and `{ src }` would point at a real illustration instead. The web build
   is the design lab and takes no binary assets, so placeholders live here and finished art belongs
   to the Unity port. Swapping one for the other is a data edit. */

const CARD_RARITIES = [
  { key: 'common',   stars: 1, w: 46, label: 'Common' },
  { key: 'uncommon', stars: 2, w: 27, label: 'Uncommon' },
  { key: 'rare',     stars: 3, w: 17, label: 'Rare' },
  { key: 'legend',   stars: 4, w: 8,  label: 'Legendary' },
  { key: 'mythic',   stars: 5, w: 2,  label: 'Mythical' }
];

/* Nine per set: three common, two uncommon, two rare, one legendary, one mythical. The shape is
   fixed so a new set is only names and a tint. */
const SET_SHAPE = ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'legend', 'mythic'];

/* Nine reusable motifs, cycled across every set. Placeholder art on purpose — the feature is the
   album, not the illustration. */
const CARD_MOTIFS = [
  { icon: 'sprout',    tint: '#8ce99a' },
  { icon: 'petal',     tint: '#ffc9de' },
  { icon: 'sparkle',   tint: '#c9b6ff' },
  { icon: 'lantern',   tint: '#ffd6a5' },
  { icon: 'butterfly', tint: '#a5d8ff' },
  { icon: 'hive',      tint: '#ffe066' },
  { icon: 'teacup',    tint: '#d8b4a0' },
  { icon: 'clover',    tint: '#b2f2bb' },
  { icon: 'star',      tint: '#ffd43b' }
];

const ALBUM_SETS = [
  { id: 'firstlight', name: 'First Light',     tint: '#ffe3bf', cards: ['Dawn Chorus', 'Dewfall', 'The Early Row', 'Frost on the Gate', 'Mist Over the Beds', 'Long Shadows', 'The Watering Can', 'Sunrise Bloom', 'The First Warmth'] },
  { id: 'harvestmoon', name: 'Harvest Moon',   tint: '#ffd6a5', cards: ['Full Moon', 'The Late Crop', 'Lantern Path', 'Moths at the Window', 'Cider Press', 'The Long Table', 'Autumn Wreath', 'Moonlit Furrow', 'The Harvest Song'] },
  { id: 'goodneighbours', name: 'Good Neighbours', tint: '#b2f2bb', cards: ['Over the Fence', 'Borrowed Shears', 'The Spare Seedling', 'Jam for the Postman', 'A Cutting to Share', 'The Shared Wall', 'Left on the Step', 'Village Show', 'The Kindest Gardener'] },
  { id: 'smallvisitors', name: 'Small Visitors', tint: '#a5d8ff', cards: ['Bumblebee', 'Ladybird', 'Garden Snail', 'The Bold Robin', 'Hedgehog at Dusk', 'Dragonfly', 'The Fox Who Waits', 'Barn Owl', 'The Rare Moth'] },
  { id: 'weatherwatch', name: 'Weather Watch',  tint: '#c5f6fa', cards: ['Soft Rain', 'Sun After Rain', 'The Still Morning', 'Thunder Far Off', 'Petrichor', 'Hailstones', 'The Green Sky', 'Aurora', 'The Wonderfall'] },
  { id: 'toolshed', name: 'The Tool Shed',      tint: '#e9d8c4', cards: ['Trowel', 'Twine', 'The Good Gloves', 'Terracotta Pots', 'Seed Tins', 'The Wheelbarrow', 'Grandfather\u2019s Spade', 'The Brass Tap', 'The Lost Key'] },
  { id: 'nightgarden', name: 'The Night Garden', tint: '#c9b6ff', cards: ['Evening Primrose', 'Moonflower', 'Night Scent', 'The Owl\u2019s Round', 'Glow Worms', 'Stars Through Leaves', 'The Sleeping Hive', 'Midnight Bloom', 'What Blooms Once'] },
  { id: 'sweetthings', name: 'Sweet Things',    tint: '#ffc9de', cards: ['Honeycomb', 'Elderflower Cordial', 'Windfall Apples', 'Bramble Jam', 'The Cake on the Sill', 'Sugared Petals', 'Rosehip Syrup', 'The Secret Recipe', 'First Honey'] },
  { id: 'ledger', name: 'The Gardener\u2019s Ledger', tint: '#d8cfc0', cards: ['Seed Packets', 'Pressed Flowers', 'The Margin Note', 'A Bad Year', 'The Good Year', 'Sketch of a Bee', 'Weather Notes', 'The Last Page', 'What Was Planted First'] },
  { id: 'wildedge', name: 'The Wild Edge',      tint: '#8ce99a', cards: ['Nettles', 'The Unmown Corner', 'Bindweed', 'Seedheads', 'Where the Fence Ends', 'The Old Hedge', 'Foxgloves', 'The Path Nobody Cut', 'What Grew Back'] },
  { id: 'keeping', name: 'Keeping',             tint: '#ffe066', cards: ['Dried Bunches', 'The Cold Frame', 'Wrapped in Newspaper', 'Root Cellar', 'Labelled Jars', 'The Saved Seed', 'Overwintering', 'The Long Wait', 'Come Spring'] },
  { id: 'openquestion', name: 'The Open Question', tint: '#ffd43b', cards: ['A Gate You Did Not Build', 'Footprints in the Beds', 'The Bell Nobody Rang', 'Someone Has Been Weeding', 'A Note, Unsigned', 'The Locked Greenhouse', 'What the Flower Won\u2019t Say', 'The Ninth Row', 'Not Yet'] }
];

const ALBUM = {
  season: 'The Long Season',
  packSize: 3,
  sets: ALBUM_SETS.map((set) => ({
    id: set.id,
    name: set.name,
    tint: set.tint,
    cards: set.cards.map((name, i) => ({
      id: `${set.id}_${i}`,
      name,
      rarity: SET_SHAPE[i],
      art: CARD_MOTIFS[i]
    }))
  }))
};

const DATA = {
  rarity: [
    { key: 'common', w: 70, m: 1, a: '', label: 'Common' },
    { key: 'rare', w: 20, m: 2, a: 'rare', label: 'Rare' },
    { key: 'epic', w: 8, m: 4, a: 'epic', label: 'Epic' },
    { key: 'legend', w: 2, m: 8, a: 'legend', label: 'Legendary' }
  ],

  /* Verbs are what a flower *does*, as opposed to what it pays. They are a second axis, kept
     deliberately free of the yield curve so `yield === cost * 1.4` still holds for every seed.
     No two verbs share an effect category — that is the point of them. */
  verbs: {
    keeper:   { name: 'Keeper',   cat: 'speed',       tint: '#6f7bff', desc: 'Neighbouring plots grow 15% faster.' },
    nurse:    { name: 'Nurse',    cat: 'yield',       tint: '#a06cd5', desc: 'Neighbouring plots pay 20% more. This one pays 10% less.' },
    beacon:   { name: 'Beacon',   cat: 'rarity',      tint: '#ff9f1c', desc: 'Neighbouring plots roll for rarity more generously.' },
    lantern:  { name: 'Lantern',  cat: 'drops',       tint: '#ff8fd0', desc: 'Neighbouring plots are twice as likely to drop a gem.' },
    deeproot: { name: 'Deeproot', cat: 'density',     tint: '#8fd6ff', desc: 'Pays 8% more for every neighbouring plot that is planted.' },
    nightbell:{ name: 'Nightbell',cat: 'time',        tint: '#7aa8ff', desc: 'Pays double if harvested at night, half by day.' },
    spreader: { name: 'Spreader', cat: 'propagation', tint: '#ffd23f', desc: 'On harvest, may sow a free copy of itself in an empty neighbour.' }
  },

  /* Tuning for the verbs above. One place, so a balance pass is one edit. */
  verbTuning: {
    keeperGrowth: 0.15,
    nurseGive: 0.20,
    nurseCost: 0.10,
    beaconRarity: 6,
    lanternGemMult: 2,
    deeprootPerNeighbour: 0.08,
    nightbellNight: 2,
    nightbellDay: 0.5,
    spreaderChance: 0.20,
    beaconCatchBonus: 0.5   // each adjacent Beacon raises this plot's mutation catch chance
  },

  /* How much of the garden's passive work survives an absence, and for how long. Two axes on
     purpose: rate and duration are separate upgrade tracks, which turns "how the game treats you
     while away" into a chain of nameable unlocks rather than a wall. */
  /* Gems are earned per unit of *time in the ground*, not per harvest. A flat per-harvest rate
     made a Daisy the best gem farm in the game, because it cycles 65x more often than an Eternal
     Crown — the inversion recorded in docs/11-known-issues.md. Chance = grow seconds x this, so
     gems/hour is roughly constant whatever the player plants. A seed may still set an explicit
     `gemChance` to override. */
  /* Gems buy chances, choices and looks — never outcomes. Calling a sky buys a *chance* at a
     mutation for what is already in the ground; the two rare skies are deliberately not for sale,
     so the game's biggest moment can never be purchased. Skipping buys time and nothing else. */
  weatherCall: {
    minutes: 4,
    prices: { rain: 8, storm: 25 }
  },
  skipSecondsPerGem: 30,

  /* A pack that turns up in the garden. Always on rather than behind a badge, because it is the
     album's only in-game source and a new player has to be able to find one. Same slot-machine
     shape as the three tap procs, and tuned to land roughly as often as they do. */
  packDropChance: 0.0015,

  gemChancePerGrowSecond: 0.0005,
  gemChanceMax: 0.5,

  offline: {
    baseRate: 0.25,
    ratePerLevel: 0.05,
    maxRate: 1,
    baseHours: 4,
    hoursPerLevel: 1,
    maxHours: 24,
    trickle: 0.1
  },

  /* Weather is derived from wall-clock epoch time, never from a running timer, so every player
     sees the same sky at the same moment and past weather stays computable. Weights are shares
     of all slots and must total 100. */
  weather: {
    slotSeconds: 60,
    types: [
      { id: 'clear',      name: 'Clear',        w: 70,  mutation: null,           catch: 0,    tint: '' },
      { id: 'rain',       name: 'Rain',         w: 20,  mutation: 'dew',          catch: 0.25, tint: '#7fa8c9' },
      { id: 'storm',      name: 'Thunderstorm', w: 7,   mutation: 'gilded',       catch: 0.15, tint: '#4d5b78' },
      { id: 'aurora',     name: 'Aurora',       w: 2.5, mutation: 'prismatic',    catch: 0.12, tint: '#5fe0e8' },
      { id: 'wonderfall', name: 'Wonderfall',   w: 0.5, mutation: 'wonderstruck', catch: 0.10, tint: '#ffb3f0' }
    ]
  },

  /* What a sky is made of, as leaves rather than numbers buried in code, so the feel can be
     retuned without a build. Every value here was set by hand by the owner on the motion stage in
     tools/sky-spike.html and copied across unchanged — they are chosen, not derived, so a number
     that looks arbitrary is. `frontSeconds` is how far ahead the forecast announces; `rainGrowth`
     is the one entry the simulation reads. See docs/41-weather-staging.md. */
  weatherStage: {
    frontSeconds: 5,
    calledFrontSeconds: 5,
    rainGrowth: 0.1,
    rain: { drops: 74, dropSpeed: 900, wind: 0.12, wash: 0.46,
            wetness: 0.34, bed: 0.3, linger: 30 },
    storm: { drops: 70, dropSpeed: 1150, wind: 0.42, wash: 0.68, wetness: 0.46,
             flashMinGap: 3.4, flashJitter: 4, flashBright: 0.72, bed: 0.34 },
    aurora: { ribbons: 3, ribbonSpeed: 0.16, ribbonOpacity: 0.42, dusk: 0.62,
              duskSeconds: 4, rimGlow: 0.5, starBoost: 0.85, bed: 0.26 },
    wonderfall: { veil: 0.3, drizzle: 26, bob: 0.5, bobPeriod: 1.6, bed: 0.34 },
    sunbreak: { rays: 3, opacity: 0.28, driftSpeed: 0.5, phase: 0.75, duration: 30 },
  },

  /* A plant holds at most one mutation and only ever upgrades to a higher rank. `mult` multiplies
     harvest payout. Tune against the measured income share, never by eye — see
     docs/18-mutations-and-weather.md. */
  mutations: {
    dew:          { name: 'Dewkissed',    rank: 1, mult: 2,   tint: '#8fd6ff', glow: '#cfeeff' },
    gilded:       { name: 'Gilded',       rank: 2, mult: 10,  tint: '#ffc93c', glow: '#ffe9a8' },
    prismatic:    { name: 'Prismatic',    rank: 3, mult: 25,  tint: '#c9b6ff', glow: '#e7dcff' },
    wonderstruck: { name: 'Wonderstruck', rank: 4, mult: 100, tint: '#ff8fd0', glow: '#ffd4ec' }
  },

  /* Where a growing plant changes its look: sprout until .14 of the grow, stem
     until .45, then the closed bud — which holds until the flower opens at .9,
     a little before it is ready, so the opening is its own beat ahead of the
     ripe wiggle. Ruled by the owner on the stage spike's sliders, 2026-09-01;
     these are the approved values verbatim (docs/10-decision-log.md). Purely
     visual: nothing here changes how fast anything grows. */
  growth: { sprout: 0.14, stem: 0.45, bloom: 0.9 },

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
      id: 'bluebell', verb: 'keeper', name: 'Bluebell', cost: 180, grow: 24, yield: 252, spr: '🪻', unlockLevel: 1,
      desc: 'Shaded blossom that rewards patient gardeners.',
      art: { shape: 'bell', petals: 5, c1: '#6f7bff', c2: '#a5adff', core: '#eceeff', leaf: '#43a95a' }
    },
    {
      id: 'lavender', verb: 'nurse', name: 'Lavender', cost: 260, grow: 28, yield: 364, spr: '💜', unlockLevel: 2,
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
      id: 'marigold', verb: 'beacon', name: 'Marigold', cost: 750, grow: 55, yield: 1050, spr: '🌻', unlockLevel: 5,
      desc: 'Sun-kissed bloom that loves booster synergies.',
      art: { shape: 'point', petals: 16, c1: '#ff9f1c', c2: '#ffc857', core: '#8a5a2b', leaf: '#4faa4f' }
    },
    {
      id: 'orchid', verb: 'lantern', name: 'Orchid', cost: 1100, grow: 90, yield: 1540, spr: '🪷', unlockLevel: 6,
      desc: 'Elegant slow-grower with strong harvest multipliers.',
      art: { shape: 'lotus', petals: 8, c1: '#ff8fd0', c2: '#ffd4ec', core: '#ffe066', leaf: '#46ad7c' }
    },
    {
      id: 'sunlotus', name: 'Sun Lotus', cost: 2200, grow: 140, yield: 3080, spr: '🌞', unlockLevel: 7,
      desc: 'Radiant lotus that charges the garden with light.',
      art: { shape: 'sun', petals: 12, c1: '#ffc93c', c2: '#fff3b0', core: '#ff8f1f', leaf: '#5cb85c', glow: '#ffd85e' }
    },
    {
      id: 'jadefern', verb: 'deeproot', name: 'Jade Fern', cost: 3200, grow: 180, yield: 4480, spr: '🌿', unlockLevel: 8,
      desc: 'Ancient frond storing rich nutrients for big hauls.',
      art: { shape: 'fern', petals: 6, c1: '#43aa5a', c2: '#8ce99a', core: '#2f7d3f', leaf: '#2f7d3f' }
    },
    {
      id: 'moonflower', verb: 'nightbell', name: 'Moonflower', cost: 4500, grow: 220, yield: 6300, spr: '🌙', unlockLevel: 9,
      desc: 'Night-blooming marvel with stellar rarity chances.',
      art: { shape: 'lotus', petals: 7, c1: '#b9dcff', c2: '#ffffff', core: '#7aa8ff', leaf: '#4a8fa8', glow: '#a9d8ff' }
    },
    {
      id: 'starlit', verb: 'spreader', name: 'Starlit Iris', cost: 6500, grow: 280, yield: 9100, spr: '✨', unlockLevel: 10,
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
      art: { shape: 'star', petals: 8, c1: '#d6336c', c2: '#f9a3c1', core: '#845ef7', leaf: '#7048b6', glow: '#ff7ab8' }
    },
    {
      id: 'solstice', name: 'Solstice Lily', cost: 35000, grow: 600, yield: 49000, spr: '☀️', unlockLevel: 14,
      desc: 'Radiant petals channel sunflare surges and rare gems.',
      art: { shape: 'sun', petals: 14, c1: '#ff922b', c2: '#ffdfae', core: '#fff3bf', leaf: '#59a83f', glow: '#ffb454' }
    },
    {
      id: 'auroracrown', name: 'Aurora Crown', cost: 52000, grow: 660, yield: 72800, spr: '🌈', unlockLevel: 15,
      desc: 'Auroral halo weaves shimmering rewards across the garden.',
      art: { shape: 'point', petals: 12, c1: '#7ce0ff', c2: '#ffe6a7', core: '#ff8fd0', leaf: '#48b39a', rainbow: true, glow: '#b7f5ff' }
    },
    {
      id: 'mythicstar', name: 'Mythic Starflower', cost: 75000, grow: 720, yield: 105000, spr: '🌟', unlockLevel: 16,
      desc: 'Legend-touched bloom whispering of premium windfalls.',
      art: { shape: 'star', petals: 5, c1: '#ffd43b', c2: '#fff6cc', core: '#ff922b', leaf: '#7a9a3f', glow: '#ffe066' }
    },
    {
      id: 'eternal', name: 'Eternal Crown', cost: 100000, grow: 780, yield: 140000, spr: '💫', unlockLevel: 17,
      desc: 'Limitless petals with a rare promise of gems.',
      art: { shape: 'lotus', petals: 12, c1: '#ffcf5c', c2: '#fffdf0', core: '#ff9f1c', leaf: '#c9a227', ring: true, glow: '#fff0b0' }
    }
  ],

  /* revealAt (docs/47, PROVISIONAL — phase 4 owns the retune) is lifetime
     gold, earnings-only, never a purchase or a Turn: absent means always
     visible, which is why the four starters carry no field at all.
     `plotExpansion` (Land Deed) deliberately carries none either — the owner
     removed it from the shop 2026-09-02 (it only ever unlocked plots the
     in-garden tap already unlocks, at a second, confusing price) and
     CORE_UPGRADES in ui-sheet.js no longer renders it. The entry stays here,
     untouched, so an existing save's saved level and every other number are
     byte-identical; it is simply never drawn. */
  upgrades: {
    tapPower:      { name: 'Tap Power +1',      short: 'Power Punch',   base: 100,  scale: 2,   icon: 'fist',  desc: 'Increase base tap payout by +1 credit per tap.' },
    holdSpeed:     { name: 'Quick Grip',        short: 'Quick Grip',    base: 150,  scale: 1.9, icon: 'clock', desc: 'Hold the flower instead of tapping it — each level speeds up the hold, up to a full rapid-tap pace.' },
    critChance:    { name: '+1% Crit',          short: 'Lucky Charm',   base: 500,  scale: 1.5, icon: 'clover', desc: 'Raise tap critical hit chance by +1%.' },
    critMult:      { name: '+2x Crit Mult',     short: 'Star Strike',   base: 1000, scale: 2,   icon: 'star',  desc: 'Boost tap crit multiplier by +2x (up to 50x).', revealAt: 40000 },
    comboMeter:    { name: 'Tap Combo Boost',   short: 'Combo Coil',    base: 2500, scale: 2,   icon: 'flame', desc: 'Extend combo cap by +10 taps.' },
    rainDance:     { name: 'Rain Dance',        short: 'Rain Dance',    base: 250,  scale: 1.8, icon: 'sprout', desc: 'A rare chance on every tap to instantly water a random growing plot, shaving 3s off its remaining time (up to 2%).', revealAt: 4000 },
    beeSwarm:      { name: 'Bee Swarm',         short: 'Bee Swarm',     base: 2000, scale: 2,   icon: 'bee',   desc: 'A rare chance on every tap to send a wild swarm to fill a jar in a hive with room (up to 1%).', revealAt: 20000 },
    ladybug:       { name: 'Lucky Ladybug',     short: 'Lucky Ladybug', base: 800,  scale: 1.9, icon: 'ladybug', desc: 'A rare chance on every tap to land a ladybug on a growing plot, boosting its rarity odds when harvested (up to 1.6%).', revealAt: 120000 },
    plotExpansion: { name: 'Plot Expansion +2', short: 'Land Deed',     base: 2000, scale: 2,   icon: 'grid',  desc: 'Unlock two garden plots your reputation has already opened.' },
    autoWater:     { name: 'Sprinkler Network', short: 'Sprinklers',    base: 400,  scale: 1.7, icon: 'drop',  desc: 'Increase grow speed by 1% per level for all plants (up to 10%).', revealAt: 300000 },
    autoHarvest:   { name: 'Drone Harvester',   short: 'Harvest Drone', base: 4500, scale: 2.4, icon: 'drone', desc: 'Automatically harvest a ready plot on a timer.', revealAt: 2500000 },
    offlineRate:   { name: 'Moonlight Tending', short: 'Moonlight',     base: 4000, scale: 1.9, icon: 'sparkle', desc: 'More of the garden\u2019s work carries on while you are away.', revealAt: 600000 },
    offlineHours:  { name: 'Lantern Oil',       short: 'Lantern Oil',   base: 6000, scale: 2.0, icon: 'lantern', desc: 'Keeps the lantern lit longer, so the garden works at full pace for more of your absence.', revealAt: 1200000 }
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

  /* THE OPENING BAG — what a brand-new garden starts with in the power-up seat.
     A player learns the seat exists by having something in it; an empty one on
     day one teaches nothing and the button reads as decoration. Handed out once,
     at the moment a save is created (and by the Settings reset, which costs
     everything) — never by the Turn, which clears the bag and never refills it.
     Short boosters, deliberately: a boost already running cannot be refreshed,
     so a bag of half-hour auras is a bag the first session cannot spend. Seed
     Rush is the one long one, because the first thing a new garden does is wait
     for a daisy. Provisional; deep tuning is phase 4's. */
  startingBoosts: { bloom: 2, golden: 1, seedrush: 1 },

  /* Indices 0–3 start open. The rest become buyable at these levels, then cost gold.
     Since the Garden Year they also wait for the first Turn — see year.plotTurnGate. */
  plotUnlockLevel: [1, 1, 1, 1, 3, 6, 9, 12],

  /* ---------------- THE GARDEN YEAR ----------------
     The prestige loop. Design in docs/32-the-garden-year.md, every number
     justified in docs/33-year-one-economy.md. All of it remote-config-ready.

     The mint reads state.year.coinsEarned — a lifetime-this-year accumulator
     that spending never decrements — through Game.credit(), the single faucet.
     Cheat grants carry { cheat: true } and never reach it. */
  year: {
    /* Which Turn opens each season's gate. Fall is Turn 1's gift. */
    fallTurn: 1,
    winterTurn: 3,
    springTurn: 6,

    /* One-time seed unlock prices, permanent across Turns — the whole spread
       lives here since per-plant spreads cannot wall while 1.4x holds.
       unlock(seed n) = unlockBase x unlockRatio^(n - freeSeeds - 1); the first
       freeSeeds seeds are free. The ratio was x1.6 for a day and the full sim
       failed it — see docs/33. Tune the ratio LAST, after petal pricing. */
    unlockBase: 150000,
    unlockRatio: 1.5,
    freeSeeds: 2,

    /* The mint, CUMULATIVE — the owner's ruling, 2026-08-29. The whole pool a
       garden will ever mint is mintK x sqrt(state.lifetimeCoins); a Turn draws
       the part of it that has not been drawn yet (state.mintedBase), and the
       Tally multiplies that increment on the way out without consuming it. The
       pool depends on lifetime earnings alone, so no cadence can out-mint
       another and splitting a year buys nothing. There is deliberately no
       per-turn multiplier here: any factor on turn count re-arms the split.
       mintK is the counter-knob if playtest tallies run hot. */
    mintK: 0.1,

    /* The Turn's two gates: the un-tallied INCREMENT >= minSeeds AND this
       year's coinsEarned >= minCoins. The coins floor keeps a year from being
       cashed in the hour it started — the seeds-only gate was reached at ~8K
       coins and enabled a daisy petal rush 36% faster than intended play — and
       the increment floor is what thins the cadence as the pool is drawn
       down. */
    minSeeds: 10,
    minCoins: 100000,

    /* Plots 5–8 refuse purchase until this many Turns are complete, so year
       one is played on four plots and Turn 1's gift is Fall AND a bigger
       garden. A migrated save keeps whatever plots it already owned. */
    plotTurnGate: 1,

    /* The curtain and the drip, docs/47. `revealAt` is arm 3's threshold: a
       locked seed reveals once lifetime gold clears this fraction of its
       unlock price (the next wall reveals unconditionally through arm 2, and
       an affordable seed reveals unconditionally through arm 4 — this number
       governs only the proactive "you're getting close" arm). `revealCapPerTurn`
       throttles that same arm alone, so a big offline windfall cannot un-mask
       a whole column of the ladder in one sitting — owner-ruled, 2026-09-02. */
    revealAt: 0.85,
    revealCapPerTurn: 2,

    /* Old Bloom Mastery's one-time conversion: Saved Seeds per ladder tier. */
    masteryConvert: 2,

    /* The Tally. Each line reads a year-scoped counter in state.year.stats —
       never a lifetime record, never anything spendable. Tier bonuses within a
       line ACCUMULATE (47 orders pays tiers 1 and 2 together: +25%, the x1.25
       in the design doc's own example), lines sum, and the multiplier clamps
       at tallyCap. A line that scored no bonus does not appear — the Tally
       only celebrates. */
    tallyCap: 2.0,
    /* PURELY VISUAL, and deliberately filed beside the year's other knobs so
       nobody hunts for it: how far Summer's palette ripens toward autumn as the
       meter fills. One overlay on the scenery, composed like the weather tint —
       no state, nothing derived from it. The weather tint tops out at .52 for a
       full storm; a season is a mood and a storm is an event, so this stays
       under it. Tuning is phase 4's. */
    seasonTint: '#ffb066',
    seasonTintMax: 0.38,
    /* And how much of a year's earnings it takes to ripen fully. The Turn's
       gates are both met about a quarter of the way through year one, so the
       meter's own fill makes a poor season clock — the garden would finish
       ripening on day one. Doc 33 targets 370-410K for year one; this is the
       middle of that, and like the two above it is visual only. */
    seasonSpan: 390000,
    /* How often the ready Turn button throws its glint, in seconds. Also
       visual, and a knob rather than a constant because the whole point is that
       it can be turned down without touching CSS: the breath says "something
       here", the glint says "look now", and one that came round too often would
       be the constant noise the ruling forbids. The sweep crosses the button in
       the last eighth of the cycle, so a longer interval is also a statelier
       one. */
    turnShineEvery: 9,
    tally: [
      { id: 'orders',      label: 'Orders filled',           stat: 'orders',      tiers: [{ at: 10, bonus: 0.10 }, { at: 25, bonus: 0.15 }, { at: 50, bonus: 0.25 }] },
      { id: 'windfalls',   label: 'Full-bed windfalls',      stat: 'windfalls',   tiers: [{ at: 3,  bonus: 0.05 }, { at: 8,  bonus: 0.10 }, { at: 15, bonus: 0.15 }] },
      { id: 'species',     label: 'Species grown this year', stat: 'species',     tiers: [{ at: 5,  bonus: 0.05 }, { at: 10, bonus: 0.08 }, { at: 15, bonus: 0.12 }] },
      { id: 'legendaries', label: 'Legendary blooms',        stat: 'legendaries', tiers: [{ at: 1,  bonus: 0.05 }, { at: 3,  bonus: 0.08 }, { at: 8,  bonus: 0.12 }] },
      { id: 'combo',       label: 'Best combo',              stat: 'bestCombo',   tiers: [{ at: 50, bonus: 0.03 }, { at: 80, bonus: 0.05 }] }
    ]
  },

  /* Flower mastery — petals, bought with Saved Seeds on the Almanac's rows.
     petalCost(seed n, petal p) = base x seedRatio^(n-1) x petalRatio^(p-1),
     signatures x signatureMult. The launch values (base 5, x1.3/seed) failed
     the full sim on both pacing checks.

     THE "2–5 PETALS EVERY TURN FOREVER" PAIRING NO LONGER HOLDS, and the
     comment that described it has been removed rather than left to mislead:
     it balanced petal costs compounding at 1.25/level against a pouch growing
     ~1.2–1.26 per cycle, and the cumulative mint (2026-08-29) deleted that
     growth curve — the lifetime pool is mintK x sqrt(lifetimeCoins) and each
     Turn draws only what is undrawn, so late pouches thin rather than grow.
     Re-pairing the exponents against the cumulative mint is phase 4's chair;
     see docs/33-year-one-economy.md and the ruling entry in the decision log. */
  petals: {
    base: 15,
    seedRatio: 1.45,
    petalRatio: 1.25,
    signatureMult: 0.6,
    /* The two shared skills on every flower, deliberately boring so there is
       never a wrong way to spend. Effects are additive per petal and apply as
       a multiplier off the yield curve — seed.yield is never edited.

       `desc` is the plain sentence a player reads BEFORE buying anything, and
       `{v}` is where the panel writes `value` back in. The number is written
       once, here, and interpolated — a hand-typed "+30%" in the prose would be
       the first copy of a value this file otherwise keeps in exactly one place,
       and every upgrade desc that quotes a number is exactly such a copy,
       correct only until someone retunes it. */
    shared: {
      rich:  { name: 'Rich Bloom',   cap: 5, value: 0.30, desc: '+{v} gold on this flower\u2019s harvests, per petal.' },
      quick: { name: 'Quick Sprout', cap: 5, value: 0.06, desc: 'Grows {v} faster, per petal.' }
    }
  },

  /* Fall — the hour-class garden behind Turn 1's gate. Crops are NOT flowers:
     no rarity, no mutations, no gems, never written to `discovered`; they
     count generic harvest quest tracks and that is all. Kept wholly separate
     from DATA.seeds so nothing drags them through the flower systems.
     yield = cost x 1.4 holds for every plant here too.

     The windfall is Fall's juice: harvesting a bed whose every plot is
     planted and ripe pays +50% on the whole bed, once per fill — and the
     fill ends when its last marked plot is collected, NOT when the bed falls
     empty. That distinction is the whole of the 2026-08-29 latch fix: a
     player who replants each plot as they harvest it never empties the bed,
     and the old rule left the latch stuck for the life of the save. The
     Century Bloom is the
     showpiece: numbers deliberately absurd, excluded from the bed-ripeness
     math, one growing at a time, and it survives every Turn. */
  fall: {
    plots: 8,
    windfall: 0.5,
    plants: [
      { id: 'strawberry',   name: 'Strawberry',    cost: 2000,    grow: 1200,    yield: 2800 },
      { id: 'mint',         name: 'Mint',          cost: 3500,    grow: 2100,    yield: 4900 },
      { id: 'chamomile',    name: 'Chamomile',     cost: 5500,    grow: 3000,    yield: 7700 },
      { id: 'brambleberry', name: 'Bramble Berry', cost: 9000,    grow: 5400,    yield: 12600 },
      { id: 'pumpkin',      name: 'Pumpkin',       cost: 16000,   grow: 10800,   yield: 22400 },
      { id: 'elderflower',  name: 'Elderflower',   cost: 28000,   grow: 18000,   yield: 39200 },
      { id: 'apple',        name: 'Apple',         cost: 48000,   grow: 28800,   yield: 67200 },
      { id: 'wheat',        name: 'Wheat',         cost: 20000,   grow: 14400,   yield: 28000 },
      { id: 'century',      name: 'Century Bloom', cost: 2000000, grow: 1209600, yield: 2800000, century: true }
    ]
  },

  /* WINTER — the night shift. Opens at Turn 3 (`year.winterTurn`).

     A season is a speed and a rule. Winter's speed is half a day to two days;
     Winter's rule is that the night pays extra when the garden was kept. Tuck
     the bed in, and what ripens under the quilt wears the snowfall.

     Every number here is a knob and every one of them is PROVISIONAL — typed
     from the spec (46-the-night-shift.md) verbatim, measured before it is
     called final. `yield` is `cost * 1.4`, the same law every seed and every
     Fall crop lives under.

     THE CLOCK FLOOR IS 12 HOURS, which is doc 33's own band and not a taste:
     "plant at dinner, ready at breakfast" has to still hold at the bottom
     rung, and an entry any shorter sits on Fall's apple clock and dominates
     it. Winter prices BELOW Fall per hour at any clock the two seasons share,
     because the tuck's convenience is paid for in rate. At these values they
     share none — Fall's longest ordinary clock is the apple at 8h. */
  winter: {
    plots: 8,
    snowfall: 0.5,
    plants: [
      { id: 'snowdrop',   name: 'Snowdrop',       cost: 2500,   grow: 43200,  yield: 3500 },
      { id: 'jasmine',    name: 'Winter Jasmine', cost: 6000,   grow: 57600,  yield: 8400 },
      { id: 'cyclamen',   name: 'Cyclamen',       cost: 14000,  grow: 72000,  yield: 19600 },
      { id: 'paperwhite', name: 'Paperwhite',     cost: 30000,  grow: 86400,  yield: 42000 },
      { id: 'hazel',      name: 'Witch Hazel',    cost: 70000,  grow: 129600, yield: 98000 },
      { id: 'camellia',   name: 'Camellia',       cost: 160000, grow: 172800, yield: 224000 }
    ]
  },

  levelCoinGrant: 20,
  harvestRepEvery: 10,
  harvestRepGrant: 1,
  /* THE POWER-UP CURVE, reshaped 2026-08-30 on the owner's ruling: a new
     player's first days are RICH with power-ups and near-always-active, and the
     generosity tapers as the rest of the game opens up. Rungs 2-8 are the first
     days (levels 2-8 are 10, 25, 45, 70, 100, 135 and 175 lifetime reputation,
     which is roughly the first two sessions); 10, 12 and 15 are the taper; after
     15 the faucet is done and the game has quests, the Almanac and the Stand
     instead. `n` is the number of copies, and it is the density knob — turn the
     early rungs down here rather than deleting them, so the shape stays legible.
     The long boosters are spaced on purpose: one cannot be refreshed while it
     runs, so Fortune Aura's half hour and Seed Rush's ten minutes are what make
     the first session near-always-active, and the 30-second pair is what makes
     it feel busy. NONE of this is re-earnable by Turning — the ladder is keyed
     on lifetime reputation, which the Turn never touches. Provisional values;
     deep tuning is phase 4's. */
  levelGrants: {
    2: { boost: 'bloom', n: 2 },
    3: { boost: 'golden', n: 2 },
    4: { boost: 'seedrush', n: 1 },
    5: { boost: 'bloom', n: 2 },
    6: { boost: 'fortune', n: 1 },
    7: { boost: 'golden', n: 2 },
    8: { boost: 'seedrush', n: 1 },
    10: { boost: 'bloom', n: 1 },
    12: { boost: 'fortune', n: 1 },
    15: { boost: 'golden', n: 1 },
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

  /* `paused: true` benches a quest without deleting it. The potting bench is
     built in game.js but has no UI at all, so nothing a player can do reaches
     the `merge` or `bank` tracks — these three could be handed out, could never
     be finished, and held one of the three active slots forever. They stay here
     with their tuning intact; drop the flag the day the bench gets a screen.

     Each one has a live stand-in directly under it at the same rep and the same
     rung, because the ladder is what carries a player to level 17 and benching
     98 rep out of it would strand them three levels short of the Eternal Crown.

     THE GARDEN YEAR benches four more the same way (docs/33-year-one-economy.md):
     seed unlock prices replaced level gates, and a year earns ~370–410K, so
     q_peony_3 and q_marigold_3 name seeds genuinely unreachable in year one
     while q_lavender_3 and q_rose_3 are marginal — a quest that *sometimes*
     jams is the same bug on a timer. Each has a seeds-1–3 or verb-agnostic
     stand-in directly under it at the same rep, holding the ladder at 777.
     Their keys stay honest goals from year two on; unbench them only if the
     unlock walls ever move below them. */
  quests: [
    { id: 'q_tap_25',      text: 'Tap 25 times',            track: 'tap',     qty: 25,  rep: 5 },
    { id: 'q_plant_1',     text: 'Plant a seed',            track: 'plant',   qty: 1,   rep: 5 },
    { id: 'q_harvest_1',   text: 'Harvest a bloom',         track: 'harvest', qty: 1,   rep: 5,  reward: { boost: 'golden', n: 2 } },
    { id: 'q_daisy_5',     text: 'Harvest 5 daisies',       track: 'harvest', key: 'daisy',    qty: 5,  rep: 8,  reward: { boost: 'bloom', n: 2 } },
    { id: 'q_power_1',     text: 'Buy Power Punch',         track: 'upgrade', key: 'tapPower', qty: 1,  rep: 8 },
    { id: 'q_tap_50',      text: 'Tap 50 times',            track: 'tap',     qty: 50,  rep: 10, after: 'q_power_1' },
    { id: 'q_tulip_3',     text: 'Harvest 3 tulips',        track: 'harvest', key: 'tulip',    qty: 3,  rep: 10 },
    { id: 'q_grip_1',      text: 'Buy Quick Grip',          track: 'upgrade', key: 'holdSpeed', qty: 1, rep: 12 },
    { id: 'q_hold_20',     text: 'Hold the flower 20 times', track: 'hold',   qty: 20,  rep: 12, after: 'q_grip_1' },
    { id: 'q_plant_8',     text: 'Plant 8 seeds',           track: 'plant',   qty: 8,   rep: 12 },
    { id: 'q_discover_5',  text: 'Discover 5 species',      track: 'discover', qty: 5,  rep: 12 },
    { id: 'q_hive_1',      text: 'Build a hive',            track: 'hive',    qty: 1,   rep: 14, reward: { boost: 'seedrush' } },
    { id: 'q_honey_3',     text: 'Fill 3 honey jars',       track: 'honey',   qty: 3,   rep: 16 },
    { id: 'q_harvest_10',  text: 'Harvest 10 blooms',       track: 'harvest', qty: 10,  rep: 16 },
    { id: 'q_tea',         text: 'Merge a Posy',            track: 'merge',   key: 'posy',     qty: 1,  rep: 18, reward: { boost: 'golden' }, paused: true },
    { id: 'q_discover_8',  text: 'Discover 8 species',      track: 'discover', qty: 8,  rep: 18, reward: { boost: 'golden' } },
    { id: 'q_charm_1',     text: 'Buy Lucky Charm',         track: 'upgrade', key: 'critChance', qty: 1, rep: 20 },
    { id: 'q_crit_1',      text: 'Land a crit',             track: 'crit',    qty: 1,   rep: 20, after: 'q_charm_1' },
    { id: 'q_rose_3',      text: 'Harvest 3 roses',         track: 'harvest', key: 'rose',     qty: 3,  rep: 20, paused: true },
    { id: 'q_daisy_15',    text: 'Harvest 15 daisies',      track: 'harvest', key: 'daisy',    qty: 15, rep: 20 },
    { id: 'q_lavender_3',  text: 'Harvest 3 lavender',      track: 'harvest', key: 'lavender', qty: 3,  rep: 22, paused: true },
    { id: 'q_tulip_8',     text: 'Harvest 8 tulips',        track: 'harvest', key: 'tulip',    qty: 8,  rep: 22 },
    { id: 'q_rare',        text: 'Harvest a Rare bloom',    track: 'rarity',  key: 'rare',     qty: 1,  rep: 24, reward: { boost: 'fortune' } },
    { id: 'q_star_1',      text: 'Buy Star Strike',         track: 'upgrade', key: 'critMult', qty: 1,  rep: 24 },
    { id: 'q_perfume',     text: 'Merge a Bouquet',         track: 'merge',   key: 'bouquet',  qty: 1,  rep: 32, paused: true },
    { id: 'q_hold_60',     text: 'Hold the flower 60 times', track: 'hold',   qty: 60,  rep: 32 },
    { id: 'q_honey_8',     text: 'Fill 8 honey jars',       track: 'honey',   qty: 8,   rep: 36 },
    { id: 'q_epic',        text: 'Harvest an Epic bloom',   track: 'rarity',  key: 'epic',     qty: 1,  rep: 40, reward: { boost: 'fortune' } },
    { id: 'q_coil_1',      text: 'Buy Combo Coil',          track: 'upgrade', key: 'comboMeter', qty: 1, rep: 28 },
    { id: 'q_combo_55',    text: 'Reach combo 55',          track: 'combo',   qty: 55,  rep: 30, after: 'q_coil_1', reward: { boost: 'bloom' } },
    { id: 'q_harvest_25',  text: 'Harvest 25 blooms',       track: 'harvest', qty: 25,  rep: 42 },
    { id: 'q_plant_20',    text: 'Plant 20 seeds',          track: 'plant',   qty: 20,  rep: 44 },
    { id: 'q_peony_3',     text: 'Harvest 3 peonies',       track: 'harvest', key: 'peony',    qty: 3,  rep: 46, paused: true },
    { id: 'q_plant_30',    text: 'Plant 30 seeds',          track: 'plant',   qty: 30,  rep: 46 },
    { id: 'q_craft_2',     text: 'Bank 5 bench goods',      track: 'bank',    qty: 5,   rep: 48, paused: true },
    { id: 'q_honey_15',    text: 'Fill 15 honey jars',      track: 'honey',   qty: 15,  rep: 48 },
    { id: 'q_marigold_3',  text: 'Harvest 3 marigolds',     track: 'harvest', key: 'marigold', qty: 3,  rep: 42, paused: true },
    { id: 'q_harvest_30',  text: 'Harvest 30 blooms',       track: 'harvest', qty: 30,  rep: 42 },
    { id: 'q_harvest_40',  text: 'Harvest 40 blooms',       track: 'harvest', qty: 40,  rep: 46 },
    { id: 'q_discover_12', text: 'Discover 12 species',     track: 'discover', qty: 12, rep: 50 }
  ],

  dailies: [
    { id: 'd_harvest_10', text: 'Harvest 10 blooms', track: 'harvest', qty: 10,  rep: 12, reward: { credits: 50, boost: 'seedrush' } },
    { id: 'd_plant_6',    text: 'Plant 6 seeds',     track: 'plant',   qty: 6,   rep: 12, reward: { credits: 50, boost: 'seedrush' } },
    { id: 'd_tap_100',    text: 'Tap 100 times',     track: 'tap',     qty: 100, rep: 12, reward: { credits: 40, boost: 'bloom' } }
  ],

  /* WHAT'S NEW. One row per build worth announcing, newest LAST — the game
     shows the last one the player has not seen and never shows it twice.
     `reset` sends the player into a fresh garden when they close it, which is
     how a playtest group starts a new build together; the dialog says so
     itself, so the flag and the sentence can never drift apart.

     The seen-flag lives OUTSIDE the save (Game.newsSeen), because a flag
     stored inside it would be erased by the very reset this button performs
     and the popup would open forever.

     `img` is owner-supplied art and the only raster in the game — the
     exception is written down in docs/09-conventions.md, and anything added
     here has to join the CORE list in sw.js or an installed app shows a
     broken square. */
  /* THE CHANGELOG — the What's New popup's little sibling. No art, no reset,
     never more than once a day: a short list of what changed since a player last
     looked, in the plain words of the glossary at the top of doc 32. Newest
     FIRST here, unlike `announcements`, because this list is read top-down.

     `date` is the identity as well as the label — the seen-marker records dates,
     so an entry's date must never be edited after it ships.

     AGENTS.md's definition of done says a change a player can see adds its line
     here in the same commit. One sentence, no version numbers, no file names:
     write what it feels like to play, not what was done. */
  changelog: [
    {
      date: '2026-09-03',
      lines: [
        'Put the game down and come back, and the music carries on quietly from where it left off instead of arriving all at once.',
        'Rain and thunderstorms are half as loud now — the weather sits behind the garden instead of over it, and the thunder is as loud as it ever was.'
      ]
    },
    {
      date: '2026-09-02',
      lines: [
        'Seeds and upgrades you haven’t grown into yet now wait behind a silhouette instead of showing everything at once — grow enough and each one reveals itself with a small celebration.'
      ]
    },
    {
      date: '2026-09-01',
      lines: [
        'Flowers grow up properly now — a sprout, then a stem, then a closed bud in the flower’s own colours, opening just before it’s ready to pick.',
        'Winter opens at Turn 3: tuck the bed in at night, and what opens under the quilt pays extra at first light.',
        'Meet Holly, the winter rose. She keeps the garden while you sleep, and she will insist she didn’t do it for you.'
      ]
    },
    {
      date: '2026-08-31',
      lines: [
        'Sound now has three sliders — effects, ambience and music — each with its own mute, in Settings.',
        'A thunderstorm sounds like rain again, and it breathes instead of sitting on one note.',
        'The app icon on your home screen is the flower that talks to you.',
        'Fall has a Collect All button when the whole bed is ready, with the bonus applied in one go.',
        'Fall\u2019s garden lines up with your summer garden when you swipe between them.',
        'The gem chip on a growing plant shows its price and no longer counts down at you.',
        'When a sky is doing something, it now says so \u2014 tap the chip beside your quest bar to find out what.'
      ]
    }
  ],

  announcements: [
    {
      id: 'garden-year',
      img: 'art/announcements/garden-year.png',
      title: 'The Garden Year',
      bullets: [
        'Your garden runs a year now, and you finish it with the Turn — the gold goes, and Saved Seeds stay with you for good.',
        'Saved Seeds buy petals. Every flower can be made worth more, and quicker to grow, forever.',
        'Seasons garden at different speeds: summer is seconds, Fall is hours. More open as you Turn.',
        'A new bar along the bottom — Orders & Quests, Cards, your Garden, the Turn and the Shop.'
      ],
      reset: true
    }
  ],

  /* The moments dialog, docs/47 — the knobs for the reveal-celebration queue.
     PROVISIONAL, phase 4's to retune. `gap` is the minimum seconds between
     two moments popping in the same session; `sessionCap` is how many can pop
     in one session at all. Entries themselves are never authored here — they
     are generated at runtime from DATA.seeds and DATA.upgrades, so this stays
     two numbers and nothing else. */
  moments: { gap: 20, sessionCap: 3 }
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

/* The potting bench — harvested blooms arrive as chain items and are merged
   upward. Nothing on this chain is a seed or a flower, so the bench can never
   manufacture one and the seed ladder stays the only way to get a bloom.

   Values are placeholders against the Market, which does not exist yet. The
   ratio between rungs is the part that matters: each is 4.5x the one below, so
   merging three beats selling them by 1.5x and the raw < crafted rule in
   docs/14-economy-model.md holds at every step. */
const BENCH = {
  cols: 6,
  startSide: 4,
  merge: 3,
  bonusAt: 5,
  basketMax: 60,
  chain: [
    { id: 'petal',   name: 'Petal',         value: 10 },
    { id: 'posy',    name: 'Posy',          value: 45 },
    { id: 'bouquet', name: 'Bouquet',       value: 200 },
    { id: 'basket',  name: 'Flower Basket', value: 900 },
    { id: 'wreath',  name: 'Wreath',        value: 4000 },
    { id: 'crown',   name: 'Flower Crown',  value: 18000 }
  ],
  /* What a harvest is worth to the bench scales with the seed, not flat per
     harvest. A Daisy cycles 65x faster than an Eternal Crown, so any flat rate
     would make spamming the cheapest seed the best way to feed the bench — the
     same inversion the gem faucet had before it was derived from grow time. */
  seedBucket: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4],
  rarityBump: { common: 0, rare: 1, epic: 2, legend: 3 }
};

/* Creatures that come to live in the garden.

   The rule that makes this worth building: a creature is a *character* first and
   a mechanic a distant second. If a grove spirit is "+5% growth" with a face on
   it, this is the badge list wearing a costume. Its keepsake is a small joke
   about who it is, and `attract` is the honest answer to "why plant this
   flower" — Pip comes for bluebells and for nothing else.

   `attract.seed` counts LIFETIME harvests via state.discovered, never the
   pantry, so it can never go backwards when flowers are spent. */
/* What a tending creature does for the garden.

   Two hard constraints, both already enforced elsewhere and both easy to break
   by accident:

   1. `pool` says what a trait stacks INTO, and that is the number that matters.
      `capped` lands on a stat with a ceiling (crit, growth, combo) and is free.
      `chance` is self-limiting, because contribution is chance x (mult - 1).
      `utility` sits off the yield curve entirely. `yield` multiplies straight
      into the harvest product, which already has seven terms and an endless
      mastery ladder in it — those must stay few and small. Stacking is the point
      of the genre; the yield pool is the only one that compounds dangerously.
   2. Traits must differ in KIND, not avoid the axes verbs use. Stacking with a
      verb is fine and good. What kills a loadout is six creatures that all add a
      percentage, because then choosing three is a ranking rather than a decision.

   A trait is a small nudge on purpose. The creature is the reward; the trait is
   why you think about which one is out. */
const CREATURE_TRAITS = {
  mutationLuck: {
    name: 'Coaxes the Sky',
    category: 'weather',
    pool: 'chance',
    icon: 'sparkle',
    desc: (v) => `Plants are ${Math.round(v * 100)}% more likely to catch the weather`,
    /* Shown on an unmet creature's row, where the value is not known yet. */
    maxDesc: (v) => `Up to ${Math.round(v * 100)}% more likely to catch the weather`
  },
  gemLuck: {
    name: 'Rummager',
    category: 'drops',
    pool: 'chance',
    icon: 'gem',
    desc: (v) => `Harvests are ${Math.round(v * 100)}% more likely to turn up a gem`,
    maxDesc: (v) => `Up to ${Math.round(v * 100)}% more likely to turn up a gem`
  },
  packLuck: {
    name: 'Forager',
    category: 'finds',
    pool: 'chance',
    icon: 'cards',
    desc: (v) => `${(v * 100).toFixed(1)}% chance a harvest turns up a card pack`,
    maxDesc: (v) => `Up to a ${(v * 100).toFixed(1)}% chance of finding a card pack`
  },
  nightYield: {
    name: 'Moonlit',
    category: 'time',
    pool: 'yield',
    icon: 'moon',
    desc: (v) => `Harvests at night pay ${Math.round(v * 100)}% more`,
    maxDesc: (v) => `Night harvests pay up to ${Math.round(v * 100)}% more`
  },
  offlineRate: {
    name: 'Lantern Keeper',
    category: 'offline',
    pool: 'utility',
    icon: 'lantern',
    desc: (v) => `The garden earns ${Math.round(v * 100)}% more while you are away`,
    maxDesc: (v) => `Up to ${Math.round(v * 100)}% more while you are away`
  },
  keepsakeSpeed: {
    name: 'Busy Hands',
    category: 'keepsakes',
    pool: 'utility',
    icon: 'gift',
    desc: (v) => `Every creature leaves keepsakes ${Math.round(v * 100)}% faster`,
    maxDesc: (v) => `Keepsakes arrive up to ${Math.round(v * 100)}% faster, for everyone`
  }
};

/* How many creatures can tend at once. More attracted than slots is the whole
   point — the choice is what makes them strategy rather than a checklist. */
const HABITAT_SLOT_LEVELS = [1, 5, 10, 16];

/* Stars a creature can reach. A creature arrives at one star with a fifth of its
   trait and grows to full — the point of a pet is that you raise it, and one that
   arrives finished has nothing left to ask for.

   The duplicate that raises it comes from the SAME bloom that attracted it, at an
   escalating count. That is the whole reason this is worth building: it keeps a
   low-tier seed worth planting forever, which is the first real answer this game
   has had to "why would I ever plant a Daisy again." */
const CREATURE_STARS = 5;

/* Named pairs. Two specific creatures tending together unlock a third thing that
   neither does alone — Cookie Clicker ships 36 of these and each is one row.

   Four rules, and the first two are the load-bearing ones:

   1. NOTHING here touches the yield pool. Every effect is a chance, a duration, a
      cap or an upgrade-to-a-roll. Eight pairs quietly joining the harvest product
      would be a multiplier stack wearing eight names.
   2. Categorical, never "+X% more". "A mutation at night comes in one tier higher"
      is a different thing happening; "+15% mutation chance" is Pip again, louder,
      and that is what turns a loadout into a ranking.
   3. Every creature sits in at least two pairs, so no creature is ever strictly a
      bench-warmer. Asserted.
   4. Binary. Both out and it is on — a bonus you cannot tell is active is not a
      bonus, and scaling it with stars would make it unreadable. */
const CREATURE_PAIRS = [
  {
    id: 'nightbloom', name: 'Nightbloom', of: ['pip', 'luna'], icon: 'moon',
    desc: 'A mutation caught after dark has a 50% chance to come in one tier higher.'
  },
  {
    id: 'lanternrain', name: 'Lantern in the Rain', of: ['pip', 'ember'], icon: 'lantern',
    desc: 'A sky you call with gems lasts twice as long.'
  },
  {
    id: 'pollination', name: 'Pollination Rounds', of: ['pip', 'bumble'], icon: 'hive',
    desc: 'Every creature holds five keepsakes instead of three.'
  },
  {
    id: 'longwatch', name: 'The Long Watch', of: ['luna', 'ember'], icon: 'moon',
    desc: 'The garden earns at full rate for two more hours while you are away.'
  },
  {
    id: 'nighterrand', name: 'Night Errand', of: ['luna', 'bramble'], icon: 'cards',
    desc: 'A pack found after dark is guaranteed a Rare card or better.'
  },
  {
    id: 'hedgerow', name: 'The Hedgerow', of: ['thistle', 'bramble'], icon: 'gem',
    desc: 'A foraged pack turns up with gems tucked inside it.'
  },
  {
    id: 'oddsandends', name: 'Jar of Odds and Ends', of: ['thistle', 'bumble'], icon: 'gem',
    desc: 'Thistle\u2019s keepsakes pay double gems.'
  },
  {
    id: 'deliveryround', name: 'The Delivery Round', of: ['bramble', 'bumble'], icon: 'gift',
    desc: 'A keepsake you collect may turn out to be a card pack instead.'
  }
];

/* Tuning for the pairs above, in one place so a balance pass is one edit.

   `nightbloomChance` and `nightbloomCap` are the two to watch. Upgrading Dewkissed
   to Gilded is a 5x jump on that harvest, so it is a coin flip rather than a
   certainty — and it can never produce the top tier, because the game's biggest
   moment should be found rather than engineered. */
const PAIR_TUNING = {
  nightbloomChance: 0.5,
  nightbloomCap: 3,        // may not upgrade past Prismatic
  lanternRainMult: 2,
  pollinationCap: 5,
  longWatchHours: 2,
  hedgerowGems: 3,
  oddsAndEndsMult: 2,
  deliveryChance: 0.2
};

/* Food, and the ONE clock it runs.

   A creature has a single fullness clock. Where it stands decides everything:

     above FED_THRESHOLD_HOURS  ->  WELL FED. Works one star above itself.
     above zero                 ->  awake and working, but hungry.
     zero                       ->  ASLEEP. Contributes nothing at all.

   IT WAS TWO CLOCKS UNTIL 2026-08-20, and collapsing them lost nothing. Every
   food's awake window already outlasted its boost by roughly a fixed margin, so
   the second clock was carrying one number — that margin — at the cost of a
   second bar, a second timestamp and a second thing to keep in sync. As one
   clock the old invariant "a food always keeps a creature up longer than it
   boosts it" stops being a rule anyone has to assert and becomes arithmetic.

   THE THRESHOLD IS A WARNING LINE, NOT A TARGET. It sits low on the bar (3h of
   24, an eighth of the way up) so a creature is well fed for most of its meal
   and the band underneath is the strip where the buff has lapsed and sleep is
   coming. Set high instead, it would be a wall: at three quarters of the bar NO
   single food reaches it, and the buff would only ever exist by stacking.

   THE PRESENTATION IS THE MECHANIC. A pet that is *asleep* is not a pet that was
   taken away — it is obviously reversible, it says what to do about it, and it
   is charming rather than punishing. That is what makes an upkeep timer
   survivable inside a cosy game, and it is why the sleeping art is not
   decoration on this feature but the load-bearing part of it. It also settles
   what would otherwise break the pair rules: a pair switching off is fine as
   long as you can SEE why, and a visibly sleeping creature is exactly that.

   A STAR RATHER THAN A FLAT MULTIPLIER for the boost, because a flat one is
   self-amplifying and this is self-limiting. `critterTraitAt()` already scales a
   trait by star, so a fed creature simply computes one higher: x2.00 at one
   star, x1.20 at five. A flat x2 would have doubled the only trait in the
   `yield` pool (Luna, +9.6% -> +19.2% average payout) and doubled the gem faucet
   (Thistle), which are the two places an idle economy quietly breaks. */
const FED_STARS = 1;

/* Hours of fullness remaining above which a creature is WELL FED. Chosen to
   reproduce the tuning the two-clock version already had: Clover kept its token
   1h of boost, Petal Cake and Honeypot came out a shade more generous. */
const FED_THRESHOLD_HOURS = 3;

/* The clock is capped and the panel says so openly - a stated cap reads as a
   rule, a hidden one reads as theft. Without it a single large purchase buys
   weeks and the loop it exists to create stops existing. */
const FOOD_CAP_HOURS = 24;

/* What an arriving creature gets free, and what a save written before this
   existed comes back with. Nobody should meet their first pet and watch it fall
   asleep before they have learned that food exists, and a returning player must
   never open the game to a room of sleepers it never warned them about. */
const ARRIVAL_AWAKE_HOURS = 24;

/* Prices are placeholders like every other number in the economy, and flat
   rather than scaling - see docs/04-economy.md.

   `hours` is the tighter of the two ladders the owner chose (4 / 8 / 16 rather
   than 8 / 16 / 24): a daily player has to feed on their first check-in, and a
   twice-daily player stays comfortably ahead. If this ever reads as a chore
   rather than a habit, THIS is the dial - raise `hours`, never the prices. */
const CREATURE_FOOD = [
  {
    id: 'clover', name: 'Clover Nibble', hours: 4, cost: 1500, icon: 'clover',
    desc: 'A mouthful of something green. Enough to get anyone up and about.'
  },
  {
    id: 'petalcake', name: 'Petal Cake', hours: 8, cost: 5000, icon: 'petal',
    desc: 'Pressed from the garden. Sweeter than it looks and stickier than it should be.'
  },
  {
    id: 'honeypot', name: 'Honeypot', hours: 16, cost: 12000, icon: 'honey',
    desc: 'The whole pot. Nobody is going to be hungry for a good while.'
  }
];

const CREATURES = [
  {
    id: 'pip',
    name: 'Pip',
    species: 'Grove Spirit',
    attract: { seed: 'bluebell', count: 5, growth: 3 },
    hint: 'Bluebells, apparently. Only bluebells.',
    about: 'Rattles its head when it is thinking. It is almost never thinking.',
    trait: { id: 'mutationLuck', value: 0.25 },
    /* Keepsakes accrue on a slow clock and cap, so an absence is a small gift
       waiting rather than a pile of homework. */
    keepsake: { id: 'mossy_pebble', name: 'Mossy Pebble', every: 900, cap: 3, gems: 1, credits: 250 },
    art: {
      body: 'pebble',
      skin: '#f4fdf5',
      shade: '#c9e8d5',
      accent: '#69db7c',
      cheek: '#ff9ec4',
      glow: '#b6f2c8'
    },
    lines: {
      arrive: ['...oh! Hello.', 'It tilts its head at you.', 'Something small has moved in.'],
      idle: ['It rattles softly.', 'It is watching a bee.', 'It has found a nice spot.', 'It sways with nothing in particular.'],
      pet: ['It wobbles happily.', 'It makes a tiny sound.', 'It leans into your finger.', 'It rattles, delighted.'],
      gift: ['It left you something.', 'A small offering appears.', 'It seems very pleased with itself.'],
      sleep: ['It is fast asleep.', 'A very small snore.', 'It does not stir at all.', 'Whatever it was thinking about, it is not thinking about it now.']
    }
  },
  {
    id: 'thistle',
    name: 'Thistle',
    species: 'Hedgepig',
    attract: { seed: 'marigold', count: 6, growth: 3 },
    hint: 'Sleeps under the marigolds. Refuses to explain why.',
    about: 'Digs constantly and remembers nothing about where.',
    trait: { id: 'gemLuck', value: 0.6 },
    keepsake: { id: 'bent_nail', name: 'Bent Nail', every: 1200, cap: 3, gems: 1, credits: 400 },
    art: {
      body: 'bean', crown: 'spines',
      skin: '#f7e2c8', shade: '#d9b78f', accent: '#a4713f', cheek: '#ff9ec4', glow: '#ffd8a8'
    },
    lines: {
      arrive: ['It does not look up.', 'Something is snuffling about.', 'A small round shape arrives.'],
      idle: ['It is digging again.', 'It has forgotten what it buried.', 'It snuffles at a root.', 'It is asleep, probably.'],
      pet: ['It uncurls a little.', 'It huffs approvingly.', 'It leans on your finger.', 'It sneezes.'],
      gift: ['It presents something it found.', 'It has been digging.', 'It looks extremely proud.'],
      sleep: ['Curled into a ball, fast asleep.', 'He snores like a much larger animal.', 'Whatever he buried will have to wait.', 'Not even a little.']
    }
  },
  {
    id: 'bramble',
    name: 'Bramble',
    species: 'Hedgefox',
    attract: { seed: 'rose', count: 8, growth: 3 },
    hint: 'Comes for the roses. Stays for the company, it says.',
    about: 'Brings you things. Not all of them are hers.',
    trait: { id: 'packLuck', value: 0.02 },
    keepsake: { id: 'lost_button', name: 'Someone Else\u2019s Button', every: 1500, cap: 3, gems: 2, credits: 600 },
    art: {
      body: 'bean', crown: 'ears', tail: true,
      skin: '#ffb27a', shade: '#e08b4e', accent: '#c96a2e', accent2: '#ffd9b8',
      cheek: '#ff8fb0', glow: '#ffd8a8'
    },
    lines: {
      arrive: ['She was already here, apparently.', 'A red shape settles by the fence.', 'She pretends not to have arrived.'],
      idle: ['She is watching the gate.', 'She has hidden something.', 'She yawns enormously.', 'She is pretending to sleep.'],
      pet: ['She permits it.', 'She thumps her tail once.', 'She leans, then pretends she did not.'],
      gift: ['She drops something at your feet.', 'She found this. Somewhere.', 'She is very pleased with herself.'],
      sleep: ['Asleep on a heap of her findings.', 'One ear twitches. That is all.', 'She is not getting up.', 'She has taken everything with her into the dream.']
    }
  },
  {
    id: 'luna',
    name: 'Luna',
    species: 'Moonmoth',
    attract: { seed: 'moonflower', count: 6, growth: 3 },
    hint: 'Only ever seen near moonflowers, and only after dark.',
    about: 'Navigates by something that is not the moon.',
    trait: { id: 'nightYield', value: 0.3 },
    keepsake: { id: 'wing_dust', name: 'Wing Dust', every: 1500, cap: 3, gems: 2, credits: 700 },
    art: {
      body: 'pebble', crown: 'antennae', wings: 'moth',
      skin: '#e8e0ff', shade: '#bfb0e8', accent: '#b197fc', wingFill: '#cbb9ff',
      cheek: '#ffa8d8', glow: '#c9b6ff'
    },
    lines: {
      arrive: ['She circles once, then settles.', 'Something pale drifts in.', 'She arrives on no wind at all.'],
      idle: ['She is following a light that is not there.', 'Her wings are very still.', 'She drifts a little.', 'She prefers the dark side of the fence.'],
      pet: ['Her wings shiver.', 'She dusts your finger.', 'She holds very still, then lifts.'],
      gift: ['She has left a little dust.', 'Something shimmers where she sat.', 'A small silver thing.'],
      sleep: ['Wings folded, fast asleep.', 'She is dreaming about a lamp.', 'Not even the moon is waking her.', 'Very still, for once.']
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'Lampfly',
    attract: { seed: 'starlit', count: 5, growth: 3 },
    hint: 'Drawn to starlit iris. Keeps the night shift.',
    about: 'Insists on carrying the light, badly.',
    trait: { id: 'offlineRate', value: 0.2 },
    keepsake: { id: 'warm_pebble', name: 'Warm Pebble', every: 1800, cap: 3, gems: 2, credits: 900 },
    art: {
      body: 'pebble', crown: 'antennae', wings: 'buzz',
      skin: '#fff3c4', shade: '#f5cf6a', accent: '#ffb703', wingFill: '#fff0b3',
      cheek: '#ff9ec4', glow: '#ffe066', speckles: false
    },
    lines: {
      arrive: ['A small light bobs over the fence.', 'He arrives, glowing faintly.', 'Something warm settles in.'],
      idle: ['He is on watch.', 'He dims, then remembers.', 'He is guarding something invisible.', 'He hums.'],
      pet: ['He glows brighter.', 'He bobs happily.', 'He warms your finger.'],
      gift: ['He left something warm.', 'Still warm, in fact.', 'He is very proud of this one.'],
      sleep: ['Dimmed right down, asleep.', 'Barely glowing now.', 'The lantern is out.', 'He will light up again after something to eat.']
    }
  },
  {
    id: 'bumble',
    name: 'Bumble',
    species: 'Gardenbee',
    /* Every place gets one creature who belongs there, and a Gardenbee belongs in
       the meadow. Doubling her keeper bonus is the item-as-key device from
       docs/17-market-and-positioning.md pointed at a character instead of a
       shop SKU: you do not want "a keeper", you want Bumble on the hives. */
    affinity: 'meadow',
    attract: { seed: 'lavender', count: 7, growth: 3 },
    hint: 'Lavender. Obviously lavender. What else would it be.',
    about: 'Helps everyone else and never once sits down.',
    trait: { id: 'keepsakeSpeed', value: 1 },
    keepsake: { id: 'honey_thimble', name: 'Thimble of Honey', every: 1200, cap: 3, gems: 1, credits: 500 },
    art: {
      body: 'bean', crown: 'antennae', wings: 'buzz', stripes: true,
      skin: '#ffe066', shade: '#e6b800', accent: '#3d2a1c', stripe: '#4a3520',
      wingFill: '#fffbe6', cheek: '#ff9ec4', glow: '#ffe9a8', speckles: false
    },
    lines: {
      arrive: ['She is already busy.', 'A round yellow blur arrives.', 'She does not stop to say hello.'],
      idle: ['She is helping. Somehow.', 'She has not stopped all day.', 'She checks on the others.', 'She is reorganising something.'],
      pet: ['She buzzes, briefly.', 'She allows exactly one pat.', 'She is far too busy for this.'],
      gift: ['She left a little honey.', 'She made time for this.', 'It is still warm.'],
      sleep: ['Even she has stopped.', 'Fast asleep, mid-errand.', 'The busiest one, out cold.', 'Nothing is getting done.']
    }
  }
];

/* Wonder Effect — a rare garden-wide transformation. */
/* The day cycle. Phase is derived from epoch time rather than page load, so "is it night" is a
   shared fact the simulation can answer — see docs/03-systems.md. `offset` only shifts the global
   phase; it no longer means "every session opens at midday", because sessions no longer set it.
   dawn/dusk are read off the SKY_KEYS star values in ui.js. */
const DAY = {
  cycle: 360,
  offset: 0.46,
  dawn: 0.14,
  dusk: 0.82
};

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

  /* HOLLY — Winter's hero, and the game's second voice. Deadpan, superior,
     secretly devoted. FOUR BUCKETS, small on purpose: weather chatter stays
     the Summer flower's job and the rule of the season lives on the chip, so
     none of these is ever load-bearing.

     HER SASS AIMS AT THE SUMMER FLOWER AND NEVER AT THE PLAYER — the 2026-09-01
     character ruling, and it is the whole reason a second voice exists: doc 17's
     tonal table says flat positivity reads as a system, and a two-character
     rivalry one swipe apart is the thread that fixes it. "The yellow one" is
     the rivalry in three words and needs no lore to land. No royalty
     vocabulary: "ice princess" survives as attitude, not as a title.

     `hollyIntro` is a SCRIPTED RUN, not a random pick — ui-winter.js walks it
     in order and consumes the one-shot only after the last line has drawn. */
  hollyIntro: [
    'Oh. You\u2019re here.',
    'It\u2019s fine. I was awake anyway.',
    'Tuck the bed in when you go.',
    'Don\u2019t tell the yellow one I helped.'
  ],
  hollyTuck: [
    'Goodnight, then.',
    'I\u2019ll watch them. Obviously.',
    'Go on. They\u2019re asleep.',
    'Some of us don\u2019t get a night off.'
  ],
  hollyMorning: [
    'They came up under the quilt.',
    'They did the work. I supervised.',
    'Still here. Still cold. Still better.',
    'They managed without an audience.'
  ],
  hollyIdle: [
    'It\u2019s not cold. He is just soft.',
    'He gets a tutorial. I get a season.',
    'Nothing is happening. That is winter.',
    'Snow is weather with better manners.',
    'He would not last a night out here.'
  ],
  unlock: ['New ground to grow on!', 'More room for flowers!', 'Ooh, fresh soil!'],
  rain: ['Rain! The garden loves this.', 'Mmm, petrichor.', 'Drink up, everyone.'],
  storm: ['Thunder! Hold onto your petals.', 'Ooh, that one was close.', 'What a sky.'],
  aurora: ['Look up — the sky has colours!', 'I have only seen this twice.', 'The whole garden is glowing.'],
  wonderfall: ['The sky is doing something wonderful.', 'Oh my. Oh MY.', 'Remember this one.'],
  /* The forecast. The sky is computable, so the flower gets to know first — one line before a
     real sky lands, and one when the sun comes back through. Never for a Clear slot: the silence
     is what makes the rest of these events. */
  rainFront: ['Smells like rain coming', 'Grey out west. Ooh.', 'Something wet this way comes.'],
  stormFront: ['Hold onto your petals!', 'That sky means it.', 'Everyone under a leaf, please.'],
  auroraFront: ['Wait — the light is going odd.', 'Is it dusk? It is not dusk.', 'Ooh. Something is starting.'],
  wonderfallFront: ['The sky is winding up for something.', 'Look up. Any moment now.', 'I have a very good feeling.'],
  sunbreak: ['There\u2019s the sun', 'Told you it would pass.', 'Look at that light coming through.'],
  mutation: ['Something changed out there!', 'That bloom looks different...', 'Well, would you look at that.'],
  wonder: ['WONDERRRR!', 'Everything is upside-down lovely!', 'Grab it all!'],
  /* Fall's bed arming — the payoff of the season's one rule. Phase 4 owns the
     meter-state lines; this one belongs to Fall and ships with it. */
  windfall: ['The whole bed at once!', 'Every last one, ready together.', 'Now THAT is a harvest.']
};

/* ---------------- the Garden Stand ----------------

   The order queue, as a place on the world map where customers walk up and
   wait. Design in docs/25-world-map.md, catalogue in docs/26-goods-catalog.md,
   engine spec in docs/13-order-system.md.

   The load-bearing idea, from every survivor in this market: nobody cares what
   the good IS. Gossip Harbor grosses nine figures a month selling chowder. The
   customer is the story and the good is a token, which is why every good here
   carries the ONE LINE its customer speaks — a good that cannot fill `line` has
   no business in the catalogue. */

const STAND = {
  slots: 3,                 // three reads at a glance on a phone; six later, off rep
  refill: 100,              // seconds an empty slot takes to fill, delivered or skipped
  varietyBonus: 0.14,       // per line item beyond the first — the thumb on the scale
  wildBonus: 0.9,           // an "any flowers" line pays less; it asks for nothing in particular

  /* The standing faucet shipped in slice A and the rungs it feeds did not: a
     three-line tier-4 order pays more standing than the largest quest in the
     game, and DATA.levelGrants stops at 20. Orders keep their gold and keep
     counting on the Tally; the standing waits for slice D. Read only through
     Game.standOrderRep() — an order still authors its rep into the save, so
     turning this off pays every board already sitting in a save. */
  repPaused: true,

  /* WHAT A DELIVERED ORDER IS WORTH, and the one number in this file the owner
     ruled on from playing rather than from a spreadsheet: a filled order should
     pay roughly ONE TO TWO MINUTES of what the player is currently earning.
     At the old 1.55-2.60 it paid between a fifth of a second and four seconds —
     "so small... almost feels pretty pointless", and the measurement agreed by a
     factor of twenty-five to a hundred.

     Measured with tools/order-gold.js across the casual model, in seconds of the
     player's own earning rate with order gold and offline lumps taken out of the
     anchor. Medians at these values: tier 1 ~100s, tier 2 ~100s, tier 3 ~70s,
     tier 4 ~85s. Re-measure there rather than adjusting by eye.

     Orders must always beat selling their contents, or the whole engine is
     optional — and the real floor for that is mult > 1 / wildBonus, i.e. 1.12,
     not the lowest number in this table as the note here used to claim. Raising
     these can never endanger it; only lowering one below 1.12 can. Both halves
     are asserted per tier in tools/sim-test.js, which until this pass only ever
     exercised the top one.

     The spread INSIDE a tier is far wider than the spread between tiers, and no
     multiplier can close it — see docs/11-known-issues.md. */
  tiers: [
    { tier: 1, rep: 0,    mult: 30,  repPay: 4 },
    { tier: 2, rep: 60,   mult: 200, repPay: 7 },
    { tier: 3, rep: 220,  mult: 210, repPay: 11 },
    { tier: 4, rep: 600,  mult: 225, repPay: 16 }
  ]
};

/* A good is a shape an order takes, not an item in a bag. A Bouquet is "three
   roses and two bluebells, wrapped" — there is no bouquet object anywhere, which
   is exactly why the Stand can launch with no crafting system under it. Anything
   with a `chain` is a bench rung and arrives when the bench gets its surface. */
const GOODS = [
  {
    id: 'posy', name: 'Posy', family: 'florist', tier: 1, icon: 'petal',
    line: 'Just a little something for the table.',
    needs: [{ pool: 'flower', qty: [2, 3] }]
  },
  {
    id: 'handful', name: 'Garden Handful', family: 'florist', tier: 1, icon: 'petal',
    line: "A handful of whatever's blooming — surprise me.",
    needs: [{ pool: 'flower', any: true, qty: [3, 5] }]
  },
  {
    id: 'buttonhole', name: 'Buttonhole', family: 'florist', tier: 1, icon: 'petal',
    line: 'One good bloom, for my coat.',
    needs: [{ pool: 'flower', qty: [1, 2] }]
  },
  {
    id: 'jar', name: 'Honey Jar', family: 'honey', tier: 2, icon: 'honey',
    line: 'One jar, and mind which flowers it came from.',
    needs: [{ pool: 'honey', qty: [1, 2] }]
  },
  {
    id: 'bouquet', name: 'Bouquet', family: 'florist', tier: 2, icon: 'petal',
    line: 'Something bright for the front window.',
    needs: [{ pool: 'flower', qty: [2, 4] }, { pool: 'flower', qty: [2, 3] }]
  },
  {
    id: 'sickbed', name: 'Get-Well Basket', family: 'florist', tier: 3, icon: 'gift',
    line: "He's been poorly. Flowers and honey, I think.",
    needs: [{ pool: 'flower', qty: [3, 4] }, { pool: 'honey', qty: [1, 2] }]
  },
  {
    id: 'flight', name: 'Honey Flight', family: 'honey', tier: 3, icon: 'honey',
    line: 'Two different jars. I want to taste them side by side.',
    needs: [{ pool: 'honey', qty: [1, 2] }, { pool: 'honey', qty: [1, 2] }]
  },
  {
    id: 'bridal', name: 'Bridal Bouquet', family: 'florist', tier: 3, icon: 'petal',
    line: "She's getting married on Saturday. No pressure.",
    needs: [{ pool: 'flower', qty: [3, 4] }, { pool: 'flower', qty: [2, 3] }, { pool: 'flower', qty: [2, 3] }]
  },
  {
    id: 'wreath', name: 'Door Wreath', family: 'florist', tier: 4, icon: 'clover',
    line: 'For the door. Everyone will see it, so make it good.',
    needs: [{ pool: 'flower', qty: [4, 6] }, { pool: 'flower', qty: [3, 5] }, { pool: 'honey', qty: [1, 1] }]
  },
  {
    id: 'grand', name: 'The Village Show', family: 'florist', tier: 4, icon: 'star',
    line: 'The judges are coming. I am putting my name on this.',
    needs: [{ pool: 'flower', qty: [4, 6] }, { pool: 'flower', qty: [4, 5] }, { pool: 'flower', qty: [3, 4] }]
  }
];

/* Recurring customers with names, faces and opinions are what turn "submit 3
   lavender" into a small relationship — the Gossip Harbor lesson. Portrait specs
   are read by customers.js, which knows nothing about the game. */
const CUSTOMERS = [
  {
    id: 'nan', name: 'Nan Bramble', minTier: 1,
    art: { skin: '#f4d0b0', hair: '#e8e4dd', style: 'bun', clothes: '#8fb8e8', accent: '#ffd6e8', hat: null },
    lines: {
      greet: ['My knees are bad but my eyes are fine.', 'You always did have the good soil.'],
      waiting: ['No rush, dear. I have all afternoon.', 'I will just sit here, shall I.'],
      delivered: ['Oh, that IS lovely.', 'You are a treasure. Do not argue.']
    }
  },
  {
    id: 'tobin', name: 'Tobin', minTier: 1,
    art: { skin: '#e8b990', hair: '#7a4a28', style: 'mop', clothes: '#ffd23f', accent: '#57c15b', hat: null },
    lines: {
      greet: ['I saved up ALL my coins.', "It's for my mum. Don't tell her."],
      waiting: ['Is it ready is it ready is it ready', 'I can wait. I am very patient.'],
      delivered: ['WOW. She is going to cry!', 'Best one ever. I mean it.']
    }
  },
  {
    id: 'marigold', name: 'Miss Marigold', minTier: 1,
    art: { skin: '#f0c9a8', hair: '#c96b3f', style: 'braid', clothes: '#a06cd5', accent: '#fff7e1', hat: null },
    lines: {
      greet: ['I have a very particular idea in mind.', 'Let us see if you can manage it.'],
      waiting: ['Standards, that is all I ask.', 'I am not impatient. I am punctual.'],
      delivered: ['Hm. Yes. That will do nicely.', 'I shall recommend you. Sparingly.']
    }
  },
  {
    id: 'bram', name: 'Bram the Baker', minTier: 2,
    art: { skin: '#c98a5e', hair: '#fdfdfa', style: 'cap', clothes: '#7fb3e8', accent: '#fff7e1', hat: null },
    lines: {
      greet: ['Flour on everything. Ignore it.', 'Trade you. I have got buns.'],
      waiting: ['My oven is on, so — soonish?', 'Take your time. The dough is proving.'],
      delivered: ['That smells better than my kitchen.', 'Beautiful. Now come and eat something.']
    }
  },
  {
    id: 'wren', name: 'Wren', minTier: 3,
    art: { skin: '#a9714b', hair: '#241a14', style: 'short', clothes: '#4bb257', accent: '#ffc94a', hat: null },
    lines: {
      greet: ['Three villages over, they told me about you.', 'I travel light. This is worth the weight.'],
      waiting: ['I am not going anywhere. Not yet.', 'The road will wait an hour.'],
      delivered: ['Now that is worth carrying.', 'I will tell them you are the real thing.']
    }
  },
  {
    id: 'hollis', name: 'Old Hollis', minTier: 3,
    art: { skin: '#e3c4a0', hair: '#f2f0ea', style: 'beard', clothes: '#8a6a45', accent: '#ffd23f', hat: '#e0be8c' },
    lines: {
      greet: ['Bees told me you were busy.', 'I kept hives before you kept anything.'],
      waiting: ['Patience is the whole trade, lad.', 'A hive taught me waiting.'],
      delivered: ['Aye. That is done properly.', 'The bees chose well.']
    }
  }
];

const goodById = (id) => GOODS.find((g) => g.id === id) || null;
const customerById = (id) => CUSTOMERS.find((c) => c.id === id) || null;

/* ---------------- the Wild Meadow ----------------

   Design in docs/25-world-map.md. The meadow is a producer AND an amplifier —
   honey follows what blooms in the garden, and pollination lifts every harvest
   there. That dependence on another place is what stops it being a second
   faucet, and it is why the Apiary came back as a place after being demoted.

   The rule this data exists to serve: buying a hive should be a CHOICE, not a
   purchase. Each spot on the bank does something different, so hive number two
   asks "where?" rather than "yes?". Deliberately NOT adjacency — that is the
   garden's mechanic, and copying it here would make the meadow a second garden. */

const MEADOW = {
  cells: 8,                // the ring around the flower, same shape as the garden
  keeperSlots: 2,
  keeperSpeedPerStar: 0.04,
  affinityMult: 2,
  swarmChance: 0.02,
  shelfSize: 19,

  /* Land is bought exactly the way the garden's plots are — a level gate you
     have to reach, and then a coin price — so the two boards teach one rule
     rather than two. The table mirrors the shape of DATA.plotUnlockLevel and
     the gates sit later, because the meadow is somewhere you travel to once the
     garden is already running. Every number here is provisional. */
  cellUnlockLevel: [1, 1, 1, 1, 5, 8, 11, 14],
  cellUnlockCost: (idx) => 1200 + 900 * (idx + 1),

  /* The board is the SAME GRAMMAR as the garden — a frame floating in the scene,
     the talking flower in the middle, eight cells around it — and a DIFFERENT
     VERB. Garden cells are temporary: plant, grow, harvest, empty, over and over.
     Meadow cells are permanent: you place a thing once and it stays. Farming
     against building, on one board shape, which is how the two places stay
     distinct while the game stays legible. See docs/25-world-map.md. */

  hive: {
    name: 'Hive', tint: '#e8c07a',
    desc: 'Bees work whatever is blooming in the garden.',
    line: 'Bees work whatever is blooming in the garden.',
    cost: (owned) => Math.round(2200 * Math.pow(1.9, owned))
  },

  /* Tenders make nothing on their own. They improve the hives they TOUCH, which
     is what turns eight cells into a layout puzzle rather than a shopping list —
     eight hives is maximum raw output with no multipliers, two hives ringed by
     tenders is few-but-excellent, and everything between is a real build.

     Adjacency is orthogonal, exactly like the garden's, so the rule a player
     already learned there carries over without being taught twice. */
  tenders: [
    {
      id: 'sun', name: 'Sun Trap', tint: '#ffd23f',
      desc: 'A stone that holds the afternoon. Neighbouring hives work faster.',
      speed: -0.22, cap: 0, wax: 0, pollen: 0, rare: 0,
      cost: (owned) => Math.round(1800 * Math.pow(1.8, owned))
    },
    {
      id: 'clover', name: 'Clover Bed', tint: '#8ce99a',
      desc: 'Knee-deep clover. Neighbouring hives leave more wax.',
      speed: 0, cap: 0, wax: 0.4, pollen: 0, rare: 0,
      cost: (owned) => Math.round(1500 * Math.pow(1.8, owned))
    },
    {
      id: 'stump', name: 'Old Stump', tint: '#c99a68',
      desc: 'Room to spare. Neighbouring hives hold more before they stop.',
      speed: 0, cap: 3, wax: 0, pollen: 0, rare: 0,
      cost: (owned) => Math.round(2000 * Math.pow(1.8, owned))
    },
    {
      id: 'willow', name: 'Willow Shade', tint: '#a06cd5',
      desc: 'Cool and quiet. Neighbouring hives come back with the strange stuff.',
      speed: 0.1, cap: 0, wax: 0, pollen: 0, rare: 0.45,
      cost: (owned) => Math.round(3200 * Math.pow(1.8, owned))
    },
    {
      id: 'foxglove', name: 'Foxglove Bank', tint: '#ff8fa3',
      desc: 'Spires the bees can see from the garden. Neighbouring hives pollinate harder.',
      speed: 0.06, cap: 0, wax: 0, pollen: 0.05, rare: 0,
      cost: (owned) => Math.round(2600 * Math.pow(1.8, owned))
    }
  ]
};

/* The garden's own adjacency table, reused rather than re-derived — the ring is
   the same eight cells around a centre, so the rule is the same rule. */
const MEADOW_NEIGHBOURS = [[1, 3], [0, 2], [1, 4], [0, 5], [2, 7], [3, 6], [5, 7], [6, 4]];

const meadowTender = (id) => MEADOW.tenders.find((t) => t.id === id) || null;
