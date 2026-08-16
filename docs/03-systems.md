# Game Systems

Every formula here is taken from `game.js`. Where a system has a quirk worth knowing, it's called
out inline.

## Currencies

| Currency | Internal name | Earned from | Spent on |
| --- | --- | --- | --- |
| Coins | `credits` | Taps, harvests | Seeds, plot unlocks, badges, two cosmetic decor pieces |
| Gems | `gems` | 5% of taps, harvest drops, ticket conversion, Almanac milestones | Gnome of Fortune and Lantern Tree (cosmetic) |

A new garden starts with 100 coins and nothing else.

Gems are the premium sink: Gnome of Fortune at 250 and Lantern Tree at 40. Tickets used to exist
as a third currency for boosts; they convert to gems at 5:1 on first load of an old save.

## Tapping

Base values: 1 coin per tap, 5% crit chance, 10× crit multiplier.

```
power   = tap.power × (1 + boost.tapPower) × (1 + boost.globalCredits)
crit%   = tap.critChance + boost.critChance
critMul = tap.critMult

gain = power
if crit: gain × critMul
gain × wonderMult          // 3 while a Wonder Effect is running, otherwise 1
gain × (1 + combo × 0.01)  // combo before this tap increments it
credits += round(gain)
```

Side rolls on every tap:

- **5% chance of +1 gem**, independent of everything else.
- **0.15% chance of triggering a Wonder Effect**, subject to its cooldown.

Crit chance is capped at **99%**, so a tap can always miss. Lucky Charm has no level cap, and at 95
levels the raw value would reach 1.0 and make every tap a crit — at which point "critical" stops
meaning anything. The cap lives in `Game.critChanceNow()`, which both the roll and the Almanac read,
so the number shown is the number used. It previously clamped only the display, which hid the
situation rather than preventing it.

### The combo ring

Each tap adds 1 to `tap.combo`, capped at `tap.comboMax` (50 by default, +10 per Combo Coil badge,
hard-capped at 100). It decays by 1 every second.

Tap payout is multiplied by `1 + combo × 0.01`, using the combo **before** the tap increments it.
Combo 0 is 1.0×, combo 50 is 1.5×, combo 100 is 2.0×. The multiplier uses the absolute combo, not
the fraction of the cap, so Combo Coil actually raises the ceiling. Harvests ignore combo.
Decay is 1 per second on purpose — see
[16-progression-and-quests.md](16-progression-and-quests.md#phase-3--make-the-combo-pay).

### Hold-to-tap

Holding the flower down repeats `tapFlower(true)` on a fixed cadence for as long as the pointer
stays down — it is an input method, not a separate payout path. The initial press is a normal tap
(`held` is false); only the interval repeats count as hold ticks for quests. Every rolled effect
(crit, gem drop, Wonder spark) and the combo counter behave exactly as they do for a
manual tap, because it's the same function call.

`tap.holdInterval` starts at 900ms and is shortened by the Quick Grip badge, 60ms per level, down
to a hard floor of 180ms (`HOLD_INTERVAL_MIN` in `game.js`) — roughly a fast manual tap cadence.
The floor exists so holding can never out-earn active tapping; it only ever catches up to it. The
interval is read once when the hold starts, so buying a level mid-hold takes effect on the next
press, not immediately.

### Tap-triggered garden procs

Three badges each add an independent slot-machine roll to `tapFlower()` — every tap (manual or a
hold-tick) is a separate chance for each of them to fire. All three share the same shape:
`level × PROC_CHANCE_PER_LEVEL` chance (0.2%/level, `game.js`), gated on owning at least one level,
capped at a badge-specific level. None of them can fire before the badge is bought, and none of
them can crowd out the others — they're checked independently in the same call.

The 0.2%/level rate is deliberately tiny — see
[the decision log](./10-decision-log.md#tap-triggered-garden-procs-rain-dance-bee-swarm-lucky-ladybug)
for why these were dropped from an earlier `1%/level` pass. Levelling one of these badges barely
moves the needle; the payoff is meant to come from the rare moment it fires, not from the climb
toward it.

| Badge | Chance | Cap | Effect | Dud condition |
| --- | --- | --- | --- | --- |
| Rain Dance | `level × 0.2%` | 2% (10 levels) | Instantly shaves 3s off one random growing plot's remaining grow time | No unlocked, seeded, not-yet-ready plot exists |
| Bee Swarm | `level × 0.2%` | 1% (5 levels) | Adds one jar to a random hive with room, using the same "variety fixed at production" rule as natural honey (see Apiary) | No hives, or all hives are full |
| Lucky Ladybug | `level × 0.2%` | 1.6% (8 levels) | Flags one random growing plot; that plot's *next* harvest gets `rollRarity`'s `extra` bumped by +1.0 (roughly doubling the non-common odds for that one harvest), then the flag clears | No unflagged growing plot exists (falls back to any growing plot rather than doing nothing, so a trigger is never fully wasted while any plot qualifies) |

A "dud" (chance rolled true but no eligible target) simply does nothing — no refund, no reroll, no
UI feedback. That's deliberate: a slot machine that fakes a win when the reels don't line up would
undercut the whole point of an honest, readable trigger rate.

Each proc has a dedicated animation in `ui-events.js` (`triggerRainFX`, `triggerBeeFX`,
`triggerLadybugFX`) so a rare trigger reads as a clear, celebratory event rather than a number
quietly changing:

- **Rain Dance** — a three-beat sequence on the targeted plot: a cloud pops in above the plot
  (`.rain-cloud`, ~0–900ms), 12 staggered drops fall and are clipped to the soil art
  (`.rain-drop`, inside `.plot-inner`), then at +560ms a delayed payoff lands together: a
  brightness "wet" flash on the soil, a glow flash on the progress bar, a small scale-bounce on the
  plant, a light-blue spark burst, and a "`Xs` faster!" floater. All the ephemeral pieces are
  rebuilt from scratch on every trigger (old nodes removed first) so a retrigger on the same plot —
  possible at high Quick Grip tap speeds — always restarts cleanly instead of looking like a dud.
- **Bee Swarm** — a bee sprite (reuses the `bee` icon) flies in to the talking flower from above,
  hovers with a little buzz-wobble, then flies off downward (toward where the Apiary lives in the
  dock), fading out. A delayed "+1 Honey" floater and amber spark burst land at +430ms, timed to
  when the bee is "delivering."
- **Lucky Ladybug** — the ladybug drops onto the targeted plot with a bouncy landing animation and
  stays there as a small persistent badge (`.lucky-badge`, synced every frame from
  `cell.luckyBug` in `renderPlots()`) so the player can see which plot is charged up while it
  grows. The badge is removed when the flag is consumed at harvest, where a red spark burst adds a
  extra flourish on top of the existing "Ladybug luck!" floater.

## Plots and growth

Eight plots, laid out around the flower as a 3×3 grid with the flower in the centre cell. Four
start unlocked. The other four become **buyable** at levels 3, 6, 9 and 12, then cost gold:

```
plot unlock cost (index i) = 400 + 300 × (i + 1)
```

So plots 5–8 cost 1,900, 2,200, 2,500 and 2,800 once the matching level has opened them. A locked
plot whose level has not arrived shows "Lv *n*" instead of a price. The Land Deed badge still
unlocks two at a time, but only plots the current level has already opened — at level 1 it reads
Maxed. It maxes for real once every plot is open.

### Growth time

```
growModifier = max(0.3, 1 − (boost.growSpeed + sprinklerLevels × 0.01))
actualGrowTime = seed.grow × growModifier
```

Sprinklers cap at 10 levels (10%) — see the badge cap table in
[04-economy.md](04-economy.md). The 0.3 floor is a defensive backstop left over from when
Sprinklers alone could reach it (see [10-decision-log.md](10-decision-log.md)); with the current
caps, only Seed Rush's +30% plus a maxed Sprinkler Network (+10%) is reachable in practice, well
short of the floor.

Grow time is **baked in at planting**. Buying sprinklers does not speed up something already in
the ground, and the seed picker shows times that already include your current bonuses.

### Impatient tapping

Tapping a plant that is still growing calls `hasten()`, which shaves time off the remainder:

```
shaved = 0.02 × totalGrowTime × (1 + boost.growSpeed + sprinklerLevels × 0.01)
```

Roughly 2% of the total per tap, scaled up by the same bonuses that speed growth generally. There
is no cooldown, so a determined player can tap a plant to maturity. That's intentional — it gives
idle plots something to do with active attention.

### Visual growth stages

`ui.js` maps progress to three stages, used by CSS to scale the plant:

| Progress | Stage | Appearance |
| --- | --- | --- |
| 0 – 25% | 1 | Stem and leaves only, head hidden |
| 25 – 70% | 2 | Small head, petals part-scaled |
| 70 – 100% | 3 | Full bloom |

## Harvesting

A plot is ready when elapsed time reaches its grow time. Tapping a ready plot harvests it.

```
rarity  = weighted roll
payout  = round(seed.yield × rarity.mult × (1 + boost.globalCredits) × wonderMult)
```

### Rarity

| Rarity | Weight | Chance | Payout multiplier |
| --- | --- | --- | --- |
| Common | 70 | 70% | 1× |
| Rare | 20 | 20% | 2× |
| Epic | 8 | 8% | 4× |
| Legendary | 2 | 2% | 8× |

Fortune Aura and anything else supplying `rarityWeight` multiplies the three non-common weights by
`(1 + bonus)`, leaving Common's 70 untouched. At Fortune Aura's +50% the weights become 70/30/12/3,
so Common falls to about 60.9% and Legendary rises to about 2.6%. A Lucky Ladybug flag (see
[Tap-triggered garden procs](#tap-triggered-garden-procs)) adds a further +1.0 to this same `extra`
term for that one harvest only, stacking with any active boost.

After a harvest the plot keeps an `aura` attribute naming the rarity it produced, which CSS uses to
tint the empty soil until something new is planted.

### Harvest drops

- **Every 10th harvest pays +1 reputation.** The counter is `harvestsThisSession`, which despite the
  name is saved and never reset, so progress toward the next bonus survives reloads.
- **Gems**: `seed.gemChance` if the seed defines one, otherwise a flat 5%. Counter-intuitively the
  late-game seeds define *lower* gem chances (0.8% – 2%) than the 5% default, so common seeds are
  the better gem farm.
- **2% chance of triggering a Wonder Effect**, subject to cooldown.

## The card album

**Built 2026-08-15.** Full design in [19-card-album.md](19-card-album.md). Content in `ALBUM`
(`data.js`), state and drawing in `game.js`, three panels in `ui-sheet.js`.

**Deliberately independent of the garden.** No card is earned by growing anything in particular —
packs come from play, and what is inside them owes nothing to what is planted. A coupled album would
dictate what the player plants and turn the garden from a place to arrange into a checklist.

12 sets × 9 cards = 108, in one season. Every set is three Common, two Uncommon, two Rare, one
Legendary and one Mythical. `state.cards` holds **counts, not flags**, so duplicates are
representable for the dust sink that has yet to be built.

**Card art is a slot** — `{ icon, tint }` composes a placeholder from the existing icon vocabulary,
`{ src }` would carry a real illustration. Nine motifs are cycled across all twelve sets, because the
feature is the album rather than the illustration.

Packs hold three cards, drawn by rarity and then **biased toward what the player is missing**. The
opening reveals one card at a time with rarity telegraphed before the name is legible.

**Packs turn up in the garden.** A fourth tap roll, `rollCardPack()`, drops a pack onto an unlocked
plot at a flat 0.0015 per tap — **always on, with no badge behind it**, because it is the album's
only in-game source. It sits on the plot until tapped, the Lucky Ladybug shape, and `collectPackDrop()`
hands over the pack. `cell.packDrop` is a new per-cell field and needs its own backfill.

That is how the album touches the garden **without being coupled to it**: the garden is where packs
turn up, never what decides their contents.

Not yet built: duplicates and dust, seasons, completion rewards.

## Gems: where they come from and what they buy

**Reworked 2026-08-15.** The standing rule, which every future gem or IAP proposal is tested
against:

> **Gems buy chances, choices and looks. Never outcomes.**
> Skipping a timer is the one deliberate exception, at an expensive rate — it is farm-game
> convention and it buys *time*, not a better result.

### The faucet

`gemChanceFor(seed)` derives the drop chance from **grow time**: `grow × 0.0005`, clamped at 50%.
A Daisy is 0.6%, an Eternal Crown 39% — and because a Daisy cycles 65× more often, **gems per hour
come out flat at ~1.8 per plot whatever is planted.**

That replaces a flat 5% default which, combined with explicit low values on the top five seeds, made
the cheapest seed the best gem farm in the game. Gems now track *time played*, not seed choice, and
nobody is punished for growing what they like. A seed may still set an explicit `gemChance` to
override; none currently do.

### Calling a sky

Gems buy Rain (8) or Thunderstorm (25) for four minutes. The purchase does two things: it holds that
weather, and it **pulls every unspent mutation roll in the ground into the window**. Without the
second part the purchase is nearly a no-op, since a roll is a single instant and most fall outside
four minutes.

**Aurora and Wonderfall are not for sale at any price.** The rarest skies have to find you — a ×100
behind a paywall is a jackpot you can buy, and if gems ever cost money that is both pay-to-win and
gambling-shaped. A sim-test asserts they stay unbuyable.

Only one call runs at a time.

### Skipping a timer

`skipCost(idx)` is `ceil(remaining / 30)` gems, minimum 1 — so it falls as a plant grows and a ripe
plot is free. The cost shows on the plant itself, always visible, which is the farm-game convention
and teaches the option without hiding it behind a gesture.

**A skip buys time and nothing else.** The mutation roll still resolves against the weather standing
at its *originally scheduled* moment — computable because weather is deterministic — so hurrying a
plant can neither gain nor lose a mutation. That closes the exploit where a player waits for a
Wonderfall and skip-grows the whole garden into it.

Implementation note: the skip **backdates `plantedAt`** rather than shrinking `grow`. A plant skipped
the instant it went in has zero elapsed seconds, and any positive grow left it permanently one tick
short of ripe.

## Weather and mutations

**Built 2026-08-15.** Full design and reasoning in
[18-mutations-and-weather.md](18-mutations-and-weather.md); numbers in
[04-economy.md](04-economy.md#weather-and-mutation-tuning). Tables in `DATA.weather` and
`DATA.mutations`, simulation in the weather section of `game.js`.

**Weather is a pure function of the clock.** `slot = floor(epochSeconds / 60)`, and the weather for a
slot is a deterministic hash of the slot number — no stored state, no scheduler. Everyone sees the
same sky at the same moment, and any past slot stays computable, which is what will let time away be
reconciled later. `game.js` owns the clock and exposes `weatherAt(t)` / `currentWeather()`;
`ui-scenery.js` paints. The no-DOM rule is unchanged.

Clear 70% · Rain 20% · Thunderstorm 7% · Aurora 2.5% · Wonderfall 0.5%.

**Every plant rolls for a mutation exactly once.** `plant()` picks a moment inside the grow window
(`plantedAt + random() × grow`) and stores it on the cell as `mutateAt`. `rollMutations()`, driven
from `tick()`, fires any roll whose moment has passed, against the weather standing at that moment,
then zeroes `mutateAt` so it can never fire twice. Only unlocked, growing, unharvested plots roll.

| Mutation | From | Pays | Share of harvests |
| --- | --- | --- | --- |
| Dewkissed | Rain, 25% | ×2 | ~5% |
| Gilded | Thunderstorm, 15% | ×10 | ~1% |
| Prismatic | Aurora, 12% | ×25 | ~0.3% |
| Wonderstruck | Wonderfall, 10% | ×100 | ~0.045% |

**Weather rarity gates mutation rarity** — the top tier needs a rare sky *and* a roll inside it, two
gates rather than one absurd probability.

An adjacent **Beacon** raises a plot's catch chance by 50% (`catchMultiplier()`). Stacking raises the
chance, **never the payout**, so the income share stays computable however much agency is added.

**Mutations are a third axis, off the yield curve.** `yield === cost × 1.4` still holds for every
seed. The multiplier is applied at harvest alongside rarity, mastery, pollination and the Wonder, and
the mutation is captured before the plot is cleared.

Measured contribution: **~20% of income, evenly across seeds** — Daisy 20.4%, Marigold 20.9%, Eternal
Crown 19.2%. That evenness is deliberate and is asserted by the suite; an earlier per-slot exposure
model produced a 65× spread and was cut. See the spec.

## Coming back after time away

**Built 2026-08-15.** `Game.reconcile()` in `game.js`, `renderWelcome()` in `ui-sheet.js`, called once on
load.

**Nothing needs replaying.** Growth, honey, crafts and booster expiry all run off absolute
timestamps, and `rollMutations()` evaluates each plant against the weather at **its own scheduled
moment**. So a mutation that came due while the tab was shut resolves against the sky that was
actually standing then, hours later, with the current sky irrelevant. Reconciliation is O(plots),
not O(slots).

What `reconcile()` adds is the **report**: time away, blooms that ripened, mutations that landed and
the weather that caused each, and honey waiting.

It returns `null` — and the scene never opens — when:

- the player was away **less than two minutes** (a reload is just a reload), or
- **nothing happened** worth saying, or
- the player has not planted yet, so the coach mark owns the screen.

**The scene is a short account, not a receipt.** *"A spell of thunderstorm passed. Your Marigold came
back Gilded"* is a garden that lived without you; *"+4,213 coins"* is a bank statement. The
distinction is the whole point and is the Neko Atsume lesson recorded in
[17-market-and-positioning.md](17-market-and-positioning.md#offline-progress).

### Offline earnings

**Built 2026-08-15.** Two axes, `DATA.offline`, badges `offlineRate` (Moonlight Tending) and
`offlineHours` (Lantern Oil).

- **Rate** — share of passive income earned while away. Base **25%**, +5%/level, clamped at 100%.
- **Duration** — how long full rate lasts. Base **4h**, +1h/level, clamped at 24h.
- **Past the cap it trickles at 10% of the rate**, never zero.

Two separate tracks on purpose: it turns "how the game treats you while away" into a chain of
nameable unlocks rather than a wall, and both badges max exactly when their value does.

**What counts as passive income.** `passiveIncomeRate()` returns coins per second the garden makes on
its own:

- A plot contributes only if it has an **auto-planter**, and only if the **drone** exists to pick it.
  An unautomated garden earns nothing while away — honest, and it makes automation matter.
- Each contributing plot is valued at its planter's seed choice, `(expected gross − seed cost) /
  grow time`, with rarity at its expected 1.58×, plus pollination, boosts, mastery and verbs.
- **The drone's cadence caps the total**, because it can only lift one plot at a time. A drone faster
  than the plots adds nothing; plots faster than the drone are throttled by it. Both directions are
  asserted.

`EXPECTED_RARITY_MULT` is derived from `DATA.rarity` rather than hardcoded, so retuning rarity
carries through automatically.

**The cap is stated, never hidden.** The welcome-back scene says the lantern burned out, for how
long, and which badge extends it. Hidden caps read as theft; stated caps read as rules — see
[17-market-and-positioning.md](17-market-and-positioning.md#offline-progress).

The shape it produces, at base with a fully automated garden: **12h away banks ~644K, 24h banks
~805K.** Doubling an absence adds a quarter, which is the incentive to return doing its work.

**Simulating an absence.** `Game.Dev.simulateAway(hours)` winds the *world* back — plot planting
times, mutation moments, hive clocks — rather than winding `lastSeen` forward, so plots genuinely
mature and rolls genuinely come due, and the report is produced by the same `reconcile()` a real
absence runs.

## The day cycle

**Moved onto epoch time 2026-08-15.** Constants in `DAY` (`data.js`), phase in `game.js`, painting in
`ui-scenery.js`.

```
phase = ((epochSeconds / DAY.cycle) + DAY.offset) % 1
```

A 360-second cycle, unchanged. What changed is the reference point: it used to key to `bootAt` —
page load — so the phase restarted on every reload and "is it night" was a per-session accident.
Keying to epoch makes it a **shared fact the simulation can answer**, via `Game.isNight()`, and that
is what a night-blooming verb would need.

`DAY.dawn` (0.14) and `DAY.dusk` (0.82) are read off the star values in `ui-scenery.js`'s `SKY_KEYS`, so
"night" means the part of the cycle where stars are actually visible. Night is the minority of the
cycle, and a sim-test asserts it.

**`DAY.offset` no longer means "every session opens at midday"** — it cannot, now that sessions do
not set the phase. It is just a global shift, and the 2026-08-01 decision it came from is superseded.

## Development tools

**Built 2026-08-15.** `Game.Dev` in `game.js`, `renderDev()` in `ui-sheet.js`, reached from an unlabelled
44 px hit area beside the gem wallet (`#btnDev`).

**The rule that makes it worth having: every cheat forces an outcome through the *real* code path**
rather than faking an effect. An armed rarity is consumed inside `harvest()`; a forced proc sets a
flag that `rollRainDance()` and friends check before their level and chance gates, then takes an
actual tap; a forced mutation writes the cell and emits the same `mutate` event weather does. So a
cheat exercises the feature it claims to test, and the animation seen is the one players get.

| Group | What it does |
| --- | --- |
| Hold the weather | Sticky override on `weatherAt()`, until released |
| Mutate a growing plot | Applies a tier now and fires the celebration |
| Arm the next harvest | Forces a rarity or a gem drop, **consumed once** |
| Cards | Grant packs, a card, a mythical, a completed set, or drop a pack in the garden |
| Boost a tap proc | **Sticky toggle.** Holds Rain Dance, Bee Swarm or Lucky Ladybug at a 50% chance per tap, bypassing the badge level entirely |
| Trigger now | Wonder Effect, one-shot |
| Garden | Fill plots, ripen everything, add a hive |
| Give | Gold, gems, levels |

**The proc buttons are toggles, not one-shots.** A single forced fire meant reopening the panel for
every look at an animation; held at 50% per tap you can leave the sheet closed and just tap. The
boost is **additive on top of the badge rate and bypasses the level gate**, because testing Bee Swarm
should not require buying Bee Swarm first — `procChance()` is the one place that decides, and it
clamps at certainty.

The weather hold and the proc boosts are sticky; everything else is one-shot. `clearAll()` drops the
lot, and the panel lists whatever is currently armed at the top so a boost left on is never a
mystery. A sim-test asserts
that **nothing armed leaks into an ordinary harvest** — the failure that would quietly corrupt every
balance reading taken afterwards.

Cheats that cannot apply — mutating with nothing in the ground, a bee swarm with no hive — say so
with a deny sound and a toast rather than failing silently.

## Verbs and adjacency

**Built 2026-08-14.** A verb is what a flower *does*, as distinct from what it pays. Six of the
nineteen seeds carry one. Definitions in `DATA.verbs`, numbers in `DATA.verbTuning`, simulation in
the verbs section of `game.js`.

### The ring

The eight plots surround the flower in a 3×3 with the centre occupied:

```
0 1 2
3 . 4
5 6 7
```

Sharing an edge therefore makes **one closed loop** — `0-1-2-4-7-6-5-3-0` — and **every plot has
exactly two neighbours.** That symmetry is the reason verbs need no per-plot balancing: no plot is
better positioned than any other. `PLOT_NEIGHBOURS` in `game.js` is the table; `neighboursOf(idx)`
filters out locked plots, so a verb only reaches the garden the player actually owns.

### The six verbs

| Verb | Seed | Effect | Category |
| --- | --- | --- | --- |
| **Keeper** | Bluebell | Neighbours grow 15% faster | speed |
| **Nurse** | Lavender | Neighbours pay +20%; this plot pays −10% | yield |
| **Beacon** | Marigold | Neighbours roll rarity with +6 extra weight | rarity |
| **Lantern** | Orchid | Neighbours' gem chance ×2 | drops |
| **Deeproot** | Jade Fern | Pays +8% per *planted* neighbour | density |
| **Nightbell** | Moonflower | Pays ×2 if harvested at night, ×0.5 by day | time |
| **Spreader** | Starlit Iris | 20% chance on harvest to sow a free copy into an empty neighbour | propagation |

**Nightbell is the only verb that reads the clock**, and the only one that is roughly *neutral* on
average — night is about 32% of the cycle, so ×2 night against ×0.5 day averages ≈0.98. It does not
make a flower pay more; it makes *when you pick it* a decision. That is why it needed the day cycle
moved onto epoch time first.

**No two verbs share an effect category.** That is the whole point — a player choosing between two
flowers that both say "+30%" is choosing nothing. A sim-test asserts the categories stay distinct.

### The invariant they must not break

`yield === cost × 1.4` still holds for **every** seed, verbs included, and a sim-test asserts it.
Verbs are a **second axis**, applied as multipliers at harvest the same way rarity, mastery,
pollination and the Wonder already are. Keeping them off the yield curve is what lets the economy
stay tunable — and it is why a verb can be added to any seed without a rebalance.

### Timing rules that matter

**Verbs are read off what is growing, not off the plot.** An empty plot has no verb. `verbAt(idx)`
returns null unless something with a verb is in the ground.

**Harvest reads the neighbourhood before clearing the plot**, because clearing it changes what the
neighbours see. Beacon, Lantern and the payout multiplier are all captured first.

**Keeper works in both directions.** Growth time is baked in at plant time (`grow = seed.grow ×
growModifier() × keeperModifier(idx)`), so a plot planted *next to* an existing Keeper gets the
bonus for free. A Keeper planted *afterwards* calls `quickenNeighbours()`, which shaves its share
off the remaining time of anything already growing. Without that second path the verb would only
pay out when the player happened to plant in the right order, which is a rule nobody would ever
discover.

**Spreader plants through the normal `plant()` path** with `payCost = false`, so a sown copy is free,
fires the usual `plant` event, and counts for quests exactly like any other planting.

### No new saved state

Verbs are derived entirely from the seed id already in `state.grid[i].seed`. **Nothing was added to
the save**, so there is no migration and no backfill — see
[07-save-data.md](07-save-data.md). Retuning a verb is a `data.js` edit that applies to every
existing save immediately.

### Surface

The plant picker shows a tinted **verb chip** next to the name and a bordered **verb note** under
the description. On planting a verb flower, the source plot flashes a solid ring and its two
neighbours flash dashed rings in the verb's colour, then fade after 1.6 s — adjacency is invisible
until something points at it, and a permanent indicator would clutter a board whose readability is
the point. See [08-ui-and-layout.md](08-ui-and-layout.md).

## Automation

### Harvest Drone

One badge, escalating speed:

```
cadence = max(0.7, 3 − level × 0.5)   seconds
```

Level 1 collects every 2.5 s, level 5 every 0.7 s (the floor). It takes the lowest-indexed ready
plot, so with several ripe at once it works left to right.

### Per-plot harvesters

Eight separate badges, one per plot, that keep their plot planted. Cost for plot *n*:

```
base  = round(3000 × 1.3^(n−1))     scale 2.3 per level
```

So plot 1's harvester starts at 3,000 and plot 8's at 18,825.

A harvester at level *L* may plant any of the first *L* seeds in tier order, further capped by
the highest seed the garden level has unlocked. It picks the **most expensive one it can currently
afford**, checking downward from that ceiling. This means a high-level harvester quietly spends
your coin balance on premium seeds — which is the intended behaviour, but it's the reason a big
balance can drain while you're in a menu.

Harvesters only appear in the Upgrades tab for plots you've already unlocked.

## Reputation and quests

Reputation is the only progression number. Level is a display of it. Quests in `DATA.quests` pay
into `state.rep`; the Market will later pay into the same field. Counters live on the active quest
instance and increment from game events — they never read `state.flowers`. Full spec in
[16-progression-and-quests.md](16-progression-and-quests.md).

## Boosters

Earned inventory in `state.boostInv`, timed once activated, and stackable across different
boosters. Activating one that's already running is a no-op — the rail hides the hold-chip while
that boost's countdown is up, so you cannot spend a second copy to refresh. No shop panel and no
purchase path. A held booster surfaces as a chip in the status rail, tap to consume one. See
[15-navigation-and-ia.md](15-navigation-and-ia.md) and
[16-progression-and-quests.md](16-progression-and-quests.md).

| Booster | Duration | Effect |
| --- | --- | --- |
| Bloom Burst | 30 s | +50% tap power, +2% crit chance |
| Seed Rush | 10 min | +30% growth speed |
| Fortune Aura | 30 min | +50% rarity weights |
| Golden Popups | 30 s | +25% credits from all sources |

Expiry is checked each tick and removal emits `panels` so open shop cards update themselves.

## Decor

Purely cosmetic since navigation phase 1 — see [15-navigation-and-ia.md](15-navigation-and-ia.md).
Lives in the Shop tab, bought with `Game.buyDecor(id)`. Permanent and repeatable — buying a second
gnome is a second copy in `state.decor`, tracked only for `Game.decorCount(id)` display.

| Piece | Cost |
| --- | --- |
| Gnome of Fortune | 250 gems |
| Butterfly Shrine | 1,000 coins |
| Crystal Fountain | 5,000 coins |
| Lantern Tree | 40 gems |

Prices are flat — the tenth costs the same as the first. No effect on any formula on this page;
decor doesn't appear in any of them anymore.

Saves from before this change had decor carrying real stat bonuses. `Game.load()` refunds each
owned copy at its purchase price the first time such a save loads — see
[07-save-data.md](07-save-data.md) for the migration mechanics.

## The Wonder Effect

A rare, brief, garden-wide transformation. Configured in `data.js` under `WONDER`.

| Property | Value |
| --- | --- |
| Duration | 20 s |
| Payout multiplier | 3× on taps *and* harvests |
| Growth multiplier | 3× |
| Chance per harvest | 2% |
| Chance per tap | 0.15% |
| Cooldown | 90 s |

The cooldown is measured from the *start* of the last Wonder, so the true minimum gap between one
ending and the next starting is 70 seconds.

Growth acceleration is applied in `tick()` by subtracting extra time from every immature plot each
frame — `dt × (growMult − 1)` — rather than by scaling a rate. This is why it correctly affects
plants that were already in the ground when the Wonder began.

While active: the `wonder` class goes on `#game` driving a rainbow halo and hue-shift, a banner
appears, the rail shows a countdown chip, confetti fires in five waves, and the flower pulls a
`wow` face.

The Wonder can also be summoned on demand from Settings, which bypasses both the roll and the
cooldown.

## Talking flower

The face lives in `flora.js` as SVG with named parts, and `ui.js` animates it:

- **Blinking** is a pure CSS animation on the eyelid rectangles.
- **Pupils track the pointer** via `lookAt()`, which writes `--px`/`--py`. On touch this happens on
  tap; on desktop it follows the mouse continuously.
- **Mouth shapes** swap between four SVG paths — idle, open, crit, and wow — reverting after 340 ms.
- **Squash-and-stretch** on every tap by re-triggering a `bounce` class.

Dialogue is drawn from nine mood buckets in `FLOWER_LINES`: `greet`, `tap`, `crit`, `harvest`,
`legend`, `idle`, `broke`, `unlock`, `wonder`.

Speech is deliberately sparse. A bubble is suppressed if another spoke less than 3.2 s ago
(unless forced), and is suppressed entirely while a coach mark is on screen so the two never
overlap. Ordinary taps only speak 6% of the time and harvests 12%; milestone moments —
greeting, Legendary, unlock, Wonder — always speak. Bubbles clear after 2.4 s.

If the player does nothing for 26 seconds the flower makes an idle remark, but never while a
sheet is open.

## The Apiary — prototype, slated for rework

> **Decided 2026-08-14: this system is being folded into garden adjacency and will lose its dock
> tab.** Bees become a plot-adjacency effect — a flower attracts them, they lift neighbouring plots,
> honey becomes an occasional drop rather than a parallel production chain. The Apiary was built as
> an explicit throwaway to give the garden's output a consumer, because nothing in the game wanted
> anything; once plants have their own verbs and orders exist, that job is absorbed and a second
> economy just competes with the one that matters. Reasoning in
> [10-decision-log.md](10-decision-log.md); the target shape is in
> [17-market-and-positioning.md](17-market-and-positioning.md#why-plant-this-flower).
>
> The description below is **what is built today**, and stays accurate until the rework lands.

The first piece of the meta-layer described in [12-meta-layer-design.md](12-meta-layer-design.md).
Lives in the `apiary` dock tab. Data in `APIARY` (`data.js`), simulation in the apiary section of
`game.js`, tests in `tools/sim-test.js`.

Up to **4 hives**, costing `2500 × 2^owned` credits. Each produces one jar every **90 seconds** and
holds **5** before the bees stop; a full hive freezes its own clock rather than banking jars it
cannot hold, so the timer restarts from the moment you collect. Because production is derived from
elapsed time, offline accrual works for free and is naturally bounded by capacity.

Each hive adds **+8% to every harvest payout** — pollination, applied in `harvest()`.

### Honey variety follows what is blooming

The load-bearing rule. When a jar is produced, its variety is sampled from the seeds *currently in
the ground*. Lavender planted means lavender honey, worth `seed.yield × 0.5`. An empty garden gives
Wildflower honey, worth a flat 40.

Sampling happens at **production** time, not collection time, and this matters: sampling on
collection would let a player keep an empty garden, plant one Eternal Crown, and collect a full hive
of the most valuable honey without ever growing it. Fixing variety when the jar is made means the
bloom had to actually be standing in the garden while the bees worked.

Collecting also yields **beeswax**, at a 50% chance per jar.

## The Potting Bench — simulation built, no surface yet

**Built 2026-08-16**, simulation only. Full design in [21-potting-bench.md](21-potting-bench.md),
numbers in [04-economy.md](04-economy.md#the-potting-bench), state in
[07-save-data.md](07-save-data.md). Content in `BENCH` (`data.js`), logic in the potting bench
section of `game.js`.

**This is what replaces the Apothecary.** Both turn garden output into goods the Market will want,
and a timed craft bench is the strictly worse version of merging.

A harvest drops one chain item into a **basket**; the player places it on a fixed 6×6 bench; **three
of a kind that end up orthogonally connected merge into the rung above.** Six rungs: Petal, Posy,
Bouquet, Flower Basket, Wreath, Flower Crown.

Four rules carry the design:

- **The bench never outputs a seed or a flower.** Flowers are the input, the chain is a separate
  category, and a sim-test asserts no chain id collides with a seed id. Otherwise the bench becomes
  a way to manufacture expensive seeds from cheap ones and routes around the level ladder.
- **Entry tier scales with the seed**, `seedBucket + rarityBump`, never flat per harvest — a Daisy
  cycles 65× faster than an Eternal Crown, so a flat rate recreates the gem-faucet inversion exactly.
  The rarity roll that already happens now decides where a bloom lands on the chain.
- **`benchMergeOnce()` performs exactly one merge and returns.** A cascade is that called again with
  a beat between rungs, and each rung is *slower* than the last. The bench must never look ahead and
  resolve six petals straight to a Bouquet.
- **Harvests land in the basket, never on the bench**, so an absence can never hand the player a
  board that filled itself.

**Banking is the escape hatch, not a convenience.** A full bench with no three alike adjacent has no
legal move at all — spatial merging can genuinely deadlock, and a checkerboard reaches it in about
forty harvests on a 4×4. Dragging an item off into `state.bench.stock` unsticks it, and is the
gesture a Market customer will eventually collect from.

The bench is always 6×6 with padlocks on locked cells — the same language the garden uses for plots
5–8 — opening at 4×4 and expanding for coins.

**There is no surface for any of this yet.** Craft is still the third dock tab; the bench fills its
basket invisibly. The panel and the dock swap are the next commit.

## The Apothecary — prototype, slated for rework

> **Decided 2026-08-14: folded down alongside the Apiary and losing its dock tab.** Same reasoning —
> it exists to consume the garden's output, and orders plus per-plant verbs do that job better. What
> survives of crafting, if anything, is an open question that waits on the garden's verbs being
> settled. See [10-decision-log.md](10-decision-log.md).
>
> The description below is **what is built today**.

The crafting tier, in the `craft` dock tab. Recipes in `CRAFT_RECIPES` (`data.js`).

Harvesting now also banks **the flower itself** into `state.flowers`, on top of the credits it
already paid. Flowers are a byproduct, so crafting is additive income rather than a competing use
of the garden.

A **two-slot bench** runs timed crafts. Three recipes ship:

| Recipe | Needs | Time | Sells for |
| --- | --- | --- | --- |
| Flower Tea | 3 flowers + 1 honey | 60s | 250 |
| Lavender Salve | 2 *lavender* honey + 1 wax + 2 flowers | 120s | 1,200 |
| Petal Perfume | 5 flowers + 2 wax | 180s | 700 |

Every recipe draws on at least two regions — the rule that stops regions from being parallel
faucets. Lavender Salve goes further and names a specific honey, which is the clearest expression
of the whole design: to make it, you must choose to plant lavender.

Generic ingredient requirements consume **cheapest first**, so valuable stock survives for direct
sale.

Crafted goods currently **sell for credits**, standing in for the order board that does not exist
yet. Orders are meant to pay well above these prices — see
[13-order-system.md](13-order-system.md).

All values here are provisional. See [14-economy-model.md](14-economy-model.md).

## The Almanac — collection track

Lifetime discovery, not inventory. `harvest()` increments `state.discovered[seedId]` and may
raise `state.bestRarity[seedId]`; selling and crafting never touch either. Distinct species
count is `discoveredCount()` — a seed with a count of 1 and a seed with a count of 400 both
count as one.

Milestones at 5, 10, 15 and 19 distinct species auto-pay from `DATA.almanacMilestones`
(reputation, gems, a boost) and record the `at` value in `state.almanacClaimed` so each rung
pays once. A save with leftover flowers backfills `discovered` on load and grants any
already-reached unclaimed rungs. Numbers and the UI are in
[16-progression-and-quests.md](16-progression-and-quests.md#phase-4--the-almanac-as-a-completion-goal).

## Bloom Mastery

Every grown seed carries its own endless ladder, generated rather than authored. The goal repeats
every four tiers — total harvests, Rare-or-better, total, Epic-or-better — and each track walks a
1 / 2.5 / 5 decade pattern forever, so tier 1 is 10 total and tier 10 is 20 Rare-or-better.
`masteryTierGoal(tier)` is the pure formula; `masteryGoal(id)` is the per-seed getter the Almanac
row reads.

Progress comes from two lifetime records and never from inventory. Totals use
`state.discovered[id]`; rarity tracks sum `state.rarityCounts[id]`, which holds rare, epic and
legend counts per seed. **Rarity goals count that rarity or better**, matching `questMatches()` —
an Epic advances a Rare goal. Legendary is deliberately not a tier: at 2% it would stall a
sequential ladder behind a coin flip.

Each completed tier permanently adds **+5% to that seed's harvest yield**, added and not
compounded, and nothing else — no reputation, and a gem only on every fifth tier. Tiers auto-pay
the moment the count crosses, like Almanac milestones; there is no claim tap, because nineteen
endless ladders would become an inbox of unclaimed gifts. A single harvest can cross more than one
tier, so `advanceMastery()` loops, and the harvest that completes a tier is paid at the **old**
multiplier — `masteryMult()` is read before `recordHarvest()` runs. Taps, flower sale prices and
craft inputs are untouched.

One `mastery` event fires per harvest that paid anything, listing every tier crossed. Old saves
never recorded `rarityCounts`, so `backfillMastery()` estimates it from the drop-table weights in
`DATA.rarity`, clamped by `bestRarity` so a rarity the player has provably never hit is never
credited, and capped so the estimate never exceeds the harvests that actually happened. Backfilled
tiers grant their yield but pay no gems and fire no toasts — the gem belongs to a moment of
completion, and a backfill has none.

Numbers are in [04-economy.md](04-economy.md#bloom-mastery), the surface in
[08-ui-and-layout.md](08-ui-and-layout.md#the-almanac-seed-row), the reasoning in
[16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery).

## Onboarding

Two coach marks, tracked by `state.seen`:

1. `intro` — "Tap the flower!" pointing at the flower, until the first tap.
2. `plot` — "Plant a seed here" pointing at the first empty plot, until the first planting.

Both are one-shot and persist as seen. They hide whenever a sheet is open and reposition on
resize.

Two rules keep them from outstaying their welcome:

**The flags are backfilled on load.** `state.seen` is merged defaults-first, so a save written
before one of these keys existed reads back `false` and replays onboarding over a garden the player
has plainly already used. `load()` therefore infers `intro` from `stats.totalTaps ||
stats.totalHarvests` and `plot` from `stats.totalHarvests` or any occupied plot. **Any new `seen`
flag needs its own backfill line**, the same way every new badge key does — see
[07-save-data.md](07-save-data.md).

**Opening a sheet calls `hideCoach()`, not just `hidden = true`.** `refreshCoach()` skips
`showCoach()` when `coachTarget` already matches the element it would point at, so leaving the
target set while hiding the node meant the next tick revealed the *old* bubble — stale text, stale
position — instead of building a fresh one. Clearing the target is what makes the re-show correct.

Note that visibility is polled from the 0.6 s slow tick, so it inherits the frame loop's fate: when
`requestAnimationFrame` is suspended — a backgrounded tab, an unfocused automation window — the
bubble freezes on screen along with everything else until the loop resumes. Both actions call
`hideCoach()` synchronously, so this only ever delays *showing* the next mark, never hiding the
finished one.

## Settings

Sound effects (on by default) and ambient music (**off** by default) each toggle independently and
persist.

Settings also contains three developer affordances that ship to players: grant 50 gems,
summon a Wonder Effect, and reset the save. Reset is two-step — the first tap arms it,
and it disarms itself after 4 seconds. The two grant buttons have no such guard. See
[11-known-issues.md](11-known-issues.md).
