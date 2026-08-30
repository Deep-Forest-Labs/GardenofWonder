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
| Creatures | Summons the next creature nobody has met, or all six, at a chosen star. Header shows how many are home and how many of the band's slots are open |
| Creature food clocks | Drain 1h / 4h / 24h, send everyone to sleep, feed everyone. Header shows how many tenders are down |
| Wind the world forward | Warps every production clock 1 / 8 / 24 hours — plants, Fall's bed and the Century Bloom, jars, crafts, orders, food and keepsakes — then catches the world up through one real `tick(0)`. No welcome sheet, no offline income |
| Simulate an absence | Winds the world back 3 / 6 / 12 / 24 hours and opens the real welcome-back scene |
| Give | Gold, gems, levels, one of every power-up |

**The proc buttons are toggles, not one-shots.** A single forced fire meant reopening the panel for
every look at an animation; held at 50% per tap you can leave the sheet closed and just tap. The
boost is **additive on top of the badge rate and bypasses the level gate**, because testing Bee Swarm
should not require buying Bee Swarm first — `procChance()` is the one place that decides, and it
clamps at certainty.

**The creature cheats wind the clocks *back* rather than the world forward**, which is the real
mechanism and not an imitation of it: sleeping is derived from `fedUntil` against now. There is one
fullness clock, not two — `awakeUntil` was absorbed into `fedUntil` on 2026-08-20 — and where a
creature stands on it decides everything, so winding it is the whole simulation. **Feed everyone** goes through the
real `feedCritter()` purchase path rather than writing the clocks. Without these, testing a
four-hour awake window means waiting four hours. See
[22-creatures.md](22-creatures.md#testing-it-without-waiting-four-hours).

**The summon writes the arrival record and nothing else.** `Dev.summonCritter()` goes through
`moveIn()` — the same function the threshold path uses — and fires the same `critter` arrival event,
so the celebration is the one a player gets. It deliberately does **not** touch `state.discovered`:
that is a lifetime harvest count, and faking it to trip `checkCritters()` would move the Almanac, the
discover quests, the creature's growth loop and its attract line all at once. The consequence is
visible and correct — a creature summoned at ★3 shows an empty bar toward ★4, because it genuinely
has not earned anything yet. **Summoning grants no levels**, so on a fresh save only one of the six
can be out at a time; the row header says so, and the way past it is *Give → +5 levels*.

**The time-warp is the away cheat minus the away.** Same mechanism — clocks wind *back* — but
`state.lastSeen` is the one clock it will not touch, because moving `lastSeen` is precisely what
turns an advance into an absence, and `reconcile()` pays `offlineEarnings(away)` off exactly that
gap. `tick(0)` afterwards re-pins `lastSeen` to now through `processWeather()`, so a warp
structurally cannot pay offline income; the payouts it causes are real harvests the player then
takes, and Fall's windfall pays through `fallHarvest()` as always. **A running boost
(`state.boosters`) and the Wonder (`state.wonder.until` / `.last`) keep their remaining time on
purpose** — the rest of the review kit exists to demonstrate the power-up button, and a warp that
blew a boost away would make the two cheats fight. A **called sky** (`state.weatherCall`) is
excluded for the same reason it is a purchase, with one accepted consequence recorded in
[11-known-issues.md](11-known-issues.md).

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

## Creatures

**Built 2026-08-16.** Full design in [22-creatures.md](22-creatures.md). Content in `CREATURES`
(`data.js`), art in `critters.js`, simulation in the creatures section of `game.js`, the yard in
`ui.js`.

**A creature comes to live in the garden because of what you chose to grow.** Pip the Grove Spirit
arrives after five lifetime Bluebell harvests, then lives on the lawn, reacts when tapped, and leaves
keepsakes on a slow clock.

- **Attraction reads `state.discovered`**, the lifetime record, never the spendable pantry — so
  spending a bloom can never send a creature away.
- **Keepsakes accrue off an absolute timestamp and cap**, so an absence is a small gift waiting
  rather than a pile of homework. `settleCritters()` on boot stops a full creature banking time it
  can never use.
- **Petting pays nothing.** A creature you tap for currency is a button; one that just reacts is a
  pet.
- **A creature is a character first and a mechanic a distant second** — a sim-test asserts every one
  has a name, a species, a hint, a line about itself and three moods of dialogue.

**Six creatures**, each on a different bloom, spread across seed unlock levels 1 to 10: Pip
(Bluebell), Bumble (Lavender), Bramble (Rose), Thistle (Marigold), Luna (Moonflower) and Ember
(Starlit Iris). Roster and traits in [22-creatures.md](22-creatures.md#the-roster).

**A creature is raised, not found.** It arrives at one star carrying a fifth of its trait and grows to
five, and **the duplicate that raises it comes from the same bloom that attracted it** at an
escalating count — Pip needs 5 / 15 / 45 / 135 / 405 lifetime Bluebells. That is what gives a low-tier
seed a reason to stay in the ground after its coins stop mattering. Stars show as stars, the Almanac
row carries a bar to the next one, and the creature's glow brightens as it grows.

**Eight named pairs.** Two specific creatures tending together unlock a third thing neither does
alone — Nightbloom (Pip + Luna) upgrades a mutation caught after dark, The Long Watch (Luna + Ember)
adds two hours away, and six more. **This is what stops a loadout being a ranking**: a trio lights up
to three pairs at once, and two deliberate "perfect trios" reward opposite play patterns — night-and-
away versus finds-and-gems. **No pair touches the yield pool**, asserted. Listed in the Almanac's
Companions block, with unformed ones showing both portraits and a hidden effect.

**Creatures carry a trait, and only a few tend at once.** Habitat slots open at levels 1, 8, 14 and
20; every creature that has moved in stays visible in the garden, but only a *tending* one applies its
trait, and a tending creature wears a leaf badge. Having more creatures than slots is what makes the
roster strategy rather than a checklist. Pip's trait, **Coaxes the Sky**, raises the mutation catch
chance by 25% through `catchMultiplier()` — the chance, never the payout. Toggle it in the Almanac's
**The Habitat** block.

**A trait must never sit on an effect category a verb already owns**, and no two creatures may share a
trait category. Both are asserted, because a collision would quietly cancel a verb out and nothing
would look wrong.

This is the first piece of the habitat direction, and it is the most direct answer the project has
found to *why plant this flower*: Pip comes for bluebells and for nothing else.

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

## Bloom Mastery — retired into petals

**The ladder froze with the Garden Year's phase 1 (2026-08-29).** Two permanent per-seed yield
ladders on one flower is the exact stacking failure the trait-pool discipline exists to prevent,
so the endless +5%-per-tier ladder retired when petals arrived: `masteryMult()` now returns 1,
no harvest ever advances a tier or pays a mastery gem again, and the `mastery` event never
fires. The live per-seed multiplier is `petalMult()` — see
[the Garden Year engine](#the-garden-year--the-engine-simulation-only) below.

What stays, deliberately: `state.mastery` keeps the tiers a save had earned as a lifetime
record, and the two counts the ladder read — `state.discovered` and `state.rarityCounts` —
keep recording exactly as before, because creatures, the Almanac and quests read them.
`masteryTierGoal()` / `masteryGoal()` still answer, frozen, for the Almanac row until phase 2
replaces that row with petals. `backfillMastery()` survives as the `rarityCounts` estimator
for old saves (clamped by `bestRarity`, never exceeding recorded harvests, no gems), because
the one-time mastery conversion needs honest counts to read.

**The conversion:** a save from before the Year converts its tiers once, on first load —
`round(DATA.year.masteryConvert × totalTiers)` Saved Seeds, silent, keyed on the missing
`year` key. See [07-save-data.md](07-save-data.md#the-garden-year-added-2026-08-29).

The retired design is preserved in
[16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery) for the
record; the sim-suite trap about mastery perturbing harvest measurements died with the
multiplier.

## The Garden Year — the engine (simulation only)

**Phase 1 of [34-build-plan.md](34-build-plan.md), built 2026-08-29 — the whole prestige
simulation with no UI beyond Developer tools.** The design is
[32-the-garden-year.md](32-the-garden-year.md), every number
[33-year-one-economy.md](33-year-one-economy.md); this section is what exists in `game.js`.
The live game is **visually** unchanged while the year accrues silently underneath it — no new
surface, no new art. It is not *behaviourally* identical, and the difference is documented
rather than glossed: a migrated save loses the retired Bloom Mastery multiplier (an accepted
regression, logged 2026-08-29), plots 5–8 refuse purchase until the first Turn, and a fresh
save cannot pass Tulip because the unlock rows arrive in phase 2. All three are listed in
[11-known-issues.md](11-known-issues.md#the-garden-year--phase-1s-deliberate-seams-2026-08-29).

**`Game.credit(amount, {cheat, refund})` is the single credit faucet.** Every grant —
taps, harvests, orders, sales, keepsakes, quest gold, level coins, the offline grant in
`reconcile()` — routes through it, so **both** earnings accumulators count by construction:
`state.year.coinsEarned` (this year, zeroed at the Turn, opens the coins gate) and
`state.lifetimeCoins` (never reset, sizes the mintable pool). `cheat: true` (the dev gold
buttons) and `refund: true` (migrations, failed purchases) skip both together. **A raw
`state.credits +=` anywhere is a bug** — sim-test bill item 4 hunts them.

**Seed unlocks:** seeds 3+ carry a one-time gold price, `DATA.year.unlockBase ×
unlockRatio^(n−3)` (150K at ×1.5), permanent across Turns, stored in `state.seedUnlocks`.
`unlockSeed(id)` charges once and can never charge again; skipping ahead is legal (the sim
proved it dominated). Levels stopped gating seeds; `unlockLevel` stays in the data only for
migrations. **The plant picker sells them from 2026-08-29 (phase 2)** — a locked row wears the
price and asks before it charges; see
[08-ui-and-layout.md](08-ui-and-layout.md#the-locked-row-and-the-unlock-price-2026-08-29-phase-2).
Plots 5–8 additionally refuse purchase until
`turnsCompleted >= DATA.year.plotTurnGate` — year one is played on four plots, and migrated
saves keep whatever they owned. **`plotGate(idx)` says which of the two gates is refusing** —
`'turn'`, `'level'` or `''` — so the plot chip can stop reporting a level at a plot the Turn is
holding. It is read-only and re-reads the same two conditions `plotAvailable()` does; the sim
asserts the two never disagree.

**Petals:** `state.petals[seedId] = { rich, quick, sig }`, bought with Saved Seeds via
`buyPetal(id, skill)` at `DATA.petals` prices. Rich Bloom multiplies harvests through
`petalMult()` — applied in `harvest()` **and** `passiveIncomeRate()`, the masteryMult
pattern, never touching `seed.yield`. Quick Sprout shortens growth through
`petalGrowMult()`, baked in at plant time like every growth bonus. `plantGrowth()` is the
one place the whole growth stack (sprinklers, boosts, Keepers, Quick Sprout) combines, and
it clamps the product at the 0.3 floor. Signatures wait for slice B; `buyPetal` refuses
`sig` until then.

**The Tally and the mint:** `state.year.stats` carries the year-scoped counters — orders,
windfalls, species (with a `speciesSeen` map so each flower counts once), legendaries,
bestCombo — written where the events happen and never read from lifetime records.
`projectedTally()` walks `DATA.year.tally`: tier bonuses within a line **accumulate**
(47 orders pays tiers 1 and 2 together, +25% — the doc's own ×1.25 example), lines sum,
and the multiplier clamps at `tallyCap`. A line that scored no bonus is not returned at
all.

**The mint is cumulative** (the owner's ruling, 2026-08-29; the shape before it was
`sqrt(coinsEarnedThisYear)` times a per-turn veterancy multiplier, which made splitting the
year strictly profitable). `projectedMint()` returns `total = mintK × sqrt(lifetimeCoins)` —
the whole pool the garden will ever mint — and `base`, the undrawn part of it,
`max(0, total − mintedBase)`; the pouch is `round(base × tally)`. `turnYear()` then adds the
**un-tallied** `base` to `state.mintedBase`, so the Tally is a gift rather than a loan and the
sum of every Turn's draw can never exceed the pool. **`DATA.year.veterancy` is deleted** —
turn count moves no part of the projection, because any per-turn term re-arms the split.
`turnReady()` demands both gates: the un-tallied increment ≥ `minSeeds` AND
`coinsEarned ≥ minCoins`. Neither ledger is ever reset, by the Turn or anything else; a save
from before the ruling inherits `lifetimeCoins` from the year it is standing in (see
[07-save-data.md](07-save-data.md#the-ledger-migration--phase-1-saves-added-2026-08-29-phase-11)).

**`turnYear(blessedId)` is atomic** — collect, bank, mint, bless, clear, roll over,
`saveNow()`, in one commit. In-flight rules first: ready blooms auto-collect through the
real `harvest()` (paid into the year before the mint), plot-parked packs bank into
`state.packs`, and a growing annual is forfeit — the one stated cost. The blessing writes
one free Rich Bloom petal (below cap, real flowers only) and records
`{ seed, year }` in `state.blessed`. The clears are exactly doc 32's table: the main
grid empties, plots 5–8 close, gold zeroes to the fresh purse, every badge wipes with the
tap fields re-derived immediately, the combo and boost inventory zero, the Stand's slots
all regenerate against the fresh year (`nextAt = now`, pool = `seedUnlocks`), and
`state.year` rolls over. Everything else survives verbatim — sim-test bill item 1 asserts
that field by field and fails if a future save field dodges classification.

**Fall, as simulation:** `state.fall.grid` is eight cells (`DATA.fall.plots`) of
`{ seed, plantedAt, grow, ready, windfall }` — the main grid's shape minus the mutation
and pack fields. `fallPlant` / `processFall` / `fallHarvest` run the board; crops pay
`yield` flat — no rarity, no mutations, no gems, no `discovered`, no pantry, no bench —
and count only generic `harvest` quest tracks. **The windfall** arms the moment every
non-Century plot stands planted and ripe — ripeness read from `plantedAt`/`grow`, never
from the cached `ready` flag, because `load()` rebuilds every Fall cell with `ready`
false and a bed that completed while the tab was shut still has to pay. Each cell is
marked, `stats.windfalls` counts one, and each marked harvest pays ×1.5.

**The once-per-fill latch is derived from those marks, not from a flag.** A fill is
"still being collected" exactly while some plot carries an unspent mark; the moment the
last one is spent the bed is free to arm again. `state.fall.bedPaid` is the saved mirror
of that derivation, recomputed on every arm and every Fall harvest. It used to be a
sticky flag cleared only when the bed fell simultaneously empty — which a player who
replants each plot as they harvest it never does, so the flag stuck and every later bed
was silently refused its windfall for the life of the save (found and fixed 2026-08-29;
five consecutive full beds paid one windfall).

The **Century Bloom** is data-flagged `century: true`: one growing at a
time, excluded from the bed math (it neither blocks nor collects a windfall), and like
every running long timer it survives the Turn untouched. Fall opens at
`turnsCompleted >= DATA.year.fallTurn`; nothing renders until phase 3.

**Developer drivers** (the phase-1 review surface): the dev sheet's Garden Year rows show
the live projection — year, earnings against the floor, base × tally → pouch, gate status
— with Earn +25K/+100K/+400K (`Dev.driveYear`, real earnings), a canned mid-game Tally
(`Dev.setYearStats`), Run the Turn (`Dev.runTurn`, blessing Daisy), Saved Seeds and petal
purchases through the real `buyPetal`, **Unlock the next seed** (`Game.unlockSeed` through the
real charge path, so the gold wall can be paid and felt), and Fill/Ripen/Harvest the Fall bed.
`Dev.grantGold`
is the cheat faucet — wallet only, never the meter — and the Settings gold button routes
through it.

`tools/year-sim.js` drives whole simulated days of casual play through the real `game.js`
and reports against doc 33's pacing targets; `tools/sim-test.js` carries the 18-item bill
(item 7 waits for slice B).

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

## The Garden Stand — orders

**Built 2026-08-25.** The demand side: a queue of customers who walk up wanting something, which
is the first system in the game that *consumes* what everything else produces. Design in
[13-order-system.md](13-order-system.md), catalogue in [26-goods-catalog.md](26-goods-catalog.md),
its place in the world in [25-world-map.md](25-world-map.md).

**Three slots.** Each holds an order or a refill timer (`STAND.refill`, 100s). Delivered or
skipped, a slot empties and refills on an absolute timestamp, so time away counts for free.

**An order is a good, a customer and some line items.** A *good* is a shape an order takes, not an
item in a bag — a Bouquet is "three roses and two bluebells", and no bouquet object exists
anywhere. That is what lets the Stand run with no crafting system under it.

| Field | Notes |
| --- | --- |
| `good` | Which good from `GOODS`; carries the name, icon and the one line its customer speaks |
| `customer` | Which face from `CUSTOMERS`; never two of the same on one board |
| `needs` | 1–3 line items, each `{ kind, of, any, qty }` — `of` is a specific bloom or honey |
| `coins`, `rep` | Priced at generation; `coins` is a **floor**, see below |

**Generation obeys two rules, and both are sim-test invariants.**

1. **Never ask for what the player cannot produce.** Flower lines draw only from unlocked seeds;
   honey lines only exist once a hive does. An order for a bloom you cannot unlock is a wall, not
   a goal.
2. **Delivering always beats selling the contents.** `STAND.tiers[].mult` starts at 1.55, and the
   suite asserts the property rather than the number.

Generation also steers away from blooms the other slots already want, biases toward blooms the
player has actually grown (75% of the time, never a hard filter or a new seed would never be
asked for), and gives every slot a different face.

**A wild line cannot be priced when it is written.** "A handful of whatever's blooming" names
nothing, and the player might hand over daisies or Eternals. So the card quotes the **floor** — the
cheapest bloom that could legally fill it — and `standDeliver()` re-prices against what actually
crossed the counter, paying the larger. The wild discount (`STAND.wildBonus`, 0.9) applies to both
sides, or quoting a floor would hand it straight back and "any" would become the best line in the
game. Wild lines spend **cheapest-first**, so they can never eat the rare bloom being saved for a
named order.

**Skipping is free and always available.** No gems, no cost, just the same refill timer. This is
the single most load-bearing rule in the order spec: it turns "I do not have that" from a wall into
a choice, and a stuck board is an uninstall.

**Reputation is PAUSED here, behind `STAND.repPaused`** (owner's ruling, 2026-08-30). Orders keep
paying gold and keep counting the Tally's `orders` line; the standing waits for slice D's rungs
past level 20, because a three-line tier-4 order pays more standing than the largest quest in the
game and `DATA.levelGrants` stops at 20.

The pause is a **read**, not a rewrite. An order still authors its `rep` at generation and still
carries it in the save; `Game.standOrderRep(order)` returns `0` while the flag is on, and
`standDeliver()` plus all three card displays read that getter instead of the field. Turning the
flag off therefore pays every order already sitting on a board, with no migration and nothing
touched in the save. While it is on, the star chip is **omitted from the card**, never drawn as
★0 — a card must never promise standing it will not pay.

`standDeliver()` still emits its own `levelup` when it grants one — `addRep()` returns the grants
but does not announce them, and every caller has to. With the pause on it hands back an empty
list, so nothing fires.

### The surface

Two sheet modes. **`stand`** is the queue: one row per slot, and the customer's face is the biggest
thing on the row. **`order`** is one customer, standing on the sheet through the same `.sheet-art`
breakout a creature uses.

**Mood is carried on the face, not in a label.** `Customers.draw()` always emits all three
expressions and CSS picks one, the same contract the sleeping creatures use — so a customer whose
order you can already fill is *smiling at you from the queue* before you read a word. Every bloom
asked for is drawn with the real `Flora.head()`, never named in prose.

## The Wild Meadow

**Built 2026-08-25, rebuilt as a board the same day.** The Apiary, promoted from a dock tab to a
place you travel into. It is a **producer and an amplifier** — honey follows what blooms in the
garden, and pollination lifts every harvest there.

**It uses the garden's grammar and a different verb** — see
[25-world-map.md](25-world-map.md#share-the-grammar-never-share-the-verb). A square board floating
in the scene, the talking flower in the middle, **eight cells** around it, keepers at the bottom,
its own dock. Garden cells are planted and emptied; meadow cells are **placed and permanent**.

**It is the quiet place.** Nothing flashes or counts down and the only motion is drift. The flower
in the middle pays coins exactly as it does in the garden — the same loop, not a second one.

**The material says the verb, 2026-08-25.** The board is a light warm-stone terrace and its cells
are dark **cobbles**, where the garden is a wooden planter holding dark soil. Soil is dug and
cleared; a cobbled floor is laid once and left. Skinning the two boards differently is also what
separates the meadow from the green world it stands in — see
[05-art-direction.md](05-art-direction.md#the-material-recipe--why-the-garden-looks-finished-and-the-meadow-does-not).

### The season strip — Fall (2026-08-29, phase 3)

**Horizontal is time.** Four gardens in the order of the year — SPRING ← SUMMER → FALL → WINTER —
and the player swipes between them. Summer is home and the app opens there. The gesture mirrors the
vertical one rule for rule: it starts only on the background, needs ~70px, and must be clearly
horizontal (`dx > dy`) or a diagonal would navigate. Swiping *left* drags the world left, bringing
the season on the right into view.

**A season is reachable when its Turn has passed AND its garden exists.** `DATA.year.fallTurn`,
`winterTurn` and `springTurn` are the turns; Winter and Spring are slices C and E and are not built,
so their gate says which of the two is holding it — *"Opens at Turn 3"* when the turn is the gate,
*"Still growing in"* once it has passed. "Opens at Turn 3" shown to a player on Turn 5 would be a
lie, and this is the cheapest way not to tell it.

**Fall's board is the garden's construction in a different material** — same 3×3, same talking
flower in the middle paying what it pays everywhere, same lip ladder, same grass fringe — a woven
trug on damp autumn earth instead of a soil planter, because Fall's verb is *fill it and carry the
whole thing in*. All eight plots open the moment Fall unlocks; Fall never sells you its own beds.

**The bed pays together.** `Game.checkFallWindfall()` marks every eligible plot when they are all
planted and ripe, and `fallHarvest()` pays `yield × 1.5` on each marked one. **The surface reads the
marks, not the clock** — that distinction is the whole rule. A bed that is planted and ripe is not
necessarily a bed that will pay: the latch refuses to mark again while any mark is unspent, so a
player replanting as they harvest has a board full of ripe crops of which only the marked ones owe
+50%. Every marked plot wears a gold ring, and the chip counts them. Reading the clock alone told
both halves of the lie — it promised a windfall to a replanted plot that could never be marked, and
it dropped the promise off the plots that were about to keep it. The chip's states: *fill all eight for +50%* → *5 / 8 planted* →
*one more in 4m* → *the whole bed — +50%*, pulsing, with the board itself taking a gold rim. **The
chip is the only thing standing between a player and harvesting at seven of eight**, which is why it
is on the board rather than in a panel, and why the near-miss state names a **wait** rather than a
count: a count is a status, a wait is an appointment.

**The Century Bloom stands outside the bed in both directions** — it neither blocks the windfall nor
collects it — so it gets a body colour of its own (violet earth) and its own block in the crop
picker. Two million gold in a list of two-thousand-gold strawberries is either scrolled past or
tapped by accident.

**Fall's edge tab carries the dock's attention dot** when anything in Fall is ripe or still owed a
windfall — an appointment needs a bell, and the dot is the pattern the dock already uses to teach
that a room is worth opening. *(Still missing, and named in
[11-known-issues.md](11-known-issues.md): Fall does not appear in the welcome-back report, so a bed
that ripened overnight is announced by the dot and nothing else.)*

**Crops are not flowers and are not drawn like flowers**: a berry on a stem, a gourd, an ear of
wheat, never a radial bloom. Their rows carry three stat pills where a seed row carries five — no
verb chip, no rarity, no gem pill — and the shorter row is itself the tell.

### Locked land

**The garden's gate, restated (2026-08-25).** Cells 0–3 are open from the first visit; the rest sit
behind a level and then a price, and a locked cell shows the same two-stage chip a locked plot does
— `Lv 8` until you reach it, then the coin cost. `Game.cellUnlockLevel` / `cellAvailable` /
`cellLocked` / `unlockCell` mirror `plotUnlockLevel` / `plotAvailable` / `unlockPlot` line for line,
deliberately: one rule learned once carries across both boards.

Locked land refuses a hive, refuses a tender, and refuses to be the destination of a move. Numbers
are in [04-economy.md](04-economy.md#meadow-land-added-2026-08-25) and the saved field is in
[07-save-data.md](07-save-data.md#meadow-land-added-2026-08-25).

**Buying it fires `cellUnlock`, not the garden's `unlock`.** That handler centres its confetti on a
plot node, and in the meadow the garden is `display:none` — a 0×0 rect, which is the documented way
to fire a celebration from the top-left corner of the screen.

### Hives and tenders

A cell holds a **hive** or a **tender**. Hives make honey. Tenders make nothing at all and improve
only the hives they **touch**, using the garden's own adjacency table (`MEADOW_NEIGHBOURS` is
`PLOT_NEIGHBOURS`), so the rule a player learned there is not taught twice.

| Tender | Does, to neighbouring hives |
| --- | --- |
| Sun Trap | Jars arrive faster (interval ×0.78) |
| Clover Bed | +40% wax |
| Old Stump | +3 jars before the bees stop |
| Willow Shade | Slightly slower, but re-rolls toward rarer blooms |
| Foxglove Bank | +5% pollination each |

**That is the whole build decision.** Eight hives is maximum raw output with no multipliers; two
hives ringed by tenders is few-but-excellent; everything between is a real choice. Sim-tests assert
that no two tenders do the same thing, that a non-adjacent tender does nothing, that two stack, and
that speed is clamped so a wall of Sun Traps can never drive the interval to zero.

**Moving is free.** Buying a piece costs; rearranging it never does — a board you are punished for
experimenting with is the opposite of the cosy pillar. Two filled cells swap. It is a *mode* on the
dock rather than a drag, because a drag would fight the swipe out to the map.

### Keepers

Up to `MEADOW.keeperSlots` (2) creatures stand at the bottom and speed **every** hive by 4% per
star — doubled for a creature whose `affinity` is `'meadow'`. Bumble is the Gardenbee and the only
one, which is *item-as-key* pointed at a character: you do not want "a keeper", you want Bumble.

A keeper must already be tending, keeps working the garden too, stops keeping the moment it rests,
and **a sleeping keeper holds its place and does no work**. **The guardrail, asserted rather than
intended: the hives work with nobody stationed on them.**

### The Honey Shelf

`state.apiary.shelf` is a **lifetime count per bloom** — one slot per seed, filled the first time
that variety is produced. Wildflower honey is never recorded, because a jar with no bloom behind it
is not a variety.

The cheapest Completion track the project has, and the clearest answer yet to *why plant this
flower*: **you plant moonflower because the moonflower jar slot is empty.** Jars are tinted from
the bloom but **mixed toward amber** — Daisy's petals are pure white, and a white jar is
indistinguishable from an empty slot.

### The swarm

`MEADOW.swarmChance` (2% per jar produced) fills **every** hive at once. Rare, free, purely a gift.
