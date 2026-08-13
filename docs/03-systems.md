# Game Systems

Every formula here is taken from `game.js`. Where a system has a quirk worth knowing, it's called
out inline.

## Currencies

| Currency | Internal name | Earned from | Spent on |
| --- | --- | --- | --- |
| Coins | `credits` | Taps, harvests | Seeds, plot unlocks, badges, two cosmetic decor pieces |
| Tickets | `tickets` | Every 10th harvest, lucky crits, rare seed drops | Boosters, Lantern Tree (cosmetic) decor |
| Gems | `gems` | 5% of taps, harvest drops | Gnome of Fortune (cosmetic) decor |

A new garden starts with 100 coins and nothing else.

Gems are the least-used currency: the Gnome of Fortune at 250 gems is currently their only sink.

## Tapping

Base values: 1 coin per tap, 5% crit chance, 10× crit multiplier.

```
power   = tap.power × (1 + boost.tapPower) × (1 + boost.globalCredits)
crit%   = tap.critChance + boost.critChance
critMul = tap.critMult

gain = power
if crit: gain × critMul
gain × wonderMult          // 3 while a Wonder Effect is running, otherwise 1
credits += round(gain)
```

Side rolls on every tap:

- **5% chance of +1 gem**, independent of everything else.
- **On a crit only, a further 3% chance of +1 ticket.**
- **0.15% chance of triggering a Wonder Effect**, subject to its cooldown.

Crit chance is uncapped in the simulation. The Almanac clamps its *display* to 99%, but nothing
prevents the real value exceeding 1.0, at which point every tap crits. Reaching that takes 95
levels of Lucky Charm.

### The combo ring

Each tap adds 1 to `tap.combo`, capped at `tap.comboMax` (50 by default, +10 per Combo Coil badge,
hard-capped at 100). It decays by 1 every second.

**The combo does not affect payout.** It drives two things only: how full the ring around the
flower appears, and which note of the pentatonic scale the tap sound plays. This is inherited
behaviour — the previous build worked the same way — but it means the Combo Coil badge at 2,500
coins buys nothing but a longer musical run and a fuller ring. See
[11-known-issues.md](11-known-issues.md).

### Hold-to-tap

Holding the flower down repeats `tapFlower(true)` on a fixed cadence for as long as the pointer
stays down — it is an input method, not a separate payout path. The initial press is a normal tap
(`held` is false); only the interval repeats count as hold ticks for quests. Every rolled effect
(crit, gem drop, ticket, Wonder spark) and the combo counter behave exactly as they do for a
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

Each proc has a dedicated animation in `ui.js` (`triggerRainFX`, `triggerBeeFX`,
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

- **Every 10th harvest pays +3 tickets.** The counter is `harvestsThisSession`, which despite the
  name is saved and never reset, so progress toward the next bonus survives reloads.
- **Gems**: `seed.gemChance` if the seed defines one, otherwise a flat 5%. Counter-intuitively the
  late-game seeds define *lower* gem chances (0.8% – 2%) than the 5% default, so common seeds are
  the better gem farm.
- **Tickets**: only the six highest seeds define `ticketChance`, from 0.3% to 0.8%.
- **2% chance of triggering a Wonder Effect**, subject to cooldown.

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

Bought with tickets, timed, and stackable across different boosters. Buying one that's already
running **replaces** its expiry rather than extending it. No shop panel — a booster surfaces as a
chip in the status rail, tap to buy-and-activate. See
[15-navigation-and-ia.md](15-navigation-and-ia.md).

| Booster | Cost | Duration | Effect |
| --- | --- | --- | --- |
| Bloom Burst | 25 | 30 s | +50% tap power, +2% crit chance |
| Seed Rush | 20 | 10 min | +30% growth speed |
| Fortune Aura | 40 | 30 min | +50% rarity weights |
| Golden Popups | 30 | 30 s | +25% credits from all sources |

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
| Lantern Tree | 200 tickets |

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

## The Apiary — prototype

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

## The Apothecary — prototype

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

## Onboarding

Two coach marks, tracked by `state.seen`:

1. `intro` — "Tap the flower!" pointing at the flower, until the first tap.
2. `plot` — "Plant a seed here" pointing at the first empty plot, until the first planting.

Both are one-shot and persist as seen. They hide whenever a sheet is open and reposition on
resize.

## Settings

Sound effects (on by default) and ambient music (**off** by default) each toggle independently and
persist.

Settings also contains three developer affordances that ship to players: grant 50 gems and
tickets, summon a Wonder Effect, and reset the save. Reset is two-step — the first tap arms it,
and it disarms itself after 4 seconds. The two grant buttons have no such guard. See
[11-known-issues.md](11-known-issues.md).
