# Economy and Balance

Every number here lives in `data.js` and is reproduced exactly. The derived columns were computed
from those values rather than estimated.

This economy is a faithful port of *Idle Garden Reborn*. It was carried over deliberately and
unchanged so that the visual rebuild couldn't be blamed for a balance regression, and so that
migrated saves would behave identically. **Treat changes here as a separate project from changes
to feel or presentation.**

## The one invariant worth protecting

Every seed yields **exactly 1.4× its cost** at Common rarity. All nineteen of them, with no
exceptions or rounding drift.

Combined with the rarity table, whose expected multiplier is **1.58×**, the expected return on any
seed is **2.212× its cost**. A seed is never a bad purchase, and no seed is a better *multiplier*
than any other — tiers differ only in throughput and absolute size.

If you add a seed, keep the 1.4 ratio. If you deliberately break it, say so in the decision log,
because it's the rule the whole progression rests on.

## Seeds

Nineteen tiers. "Net/s" is `(yield − cost) / growTime` at Common rarity with no bonuses — the
honest measure of a seed's throughput. "Max" is a Legendary roll at 8×.

| # | Seed | Cost | Grow | Yield | Net/s | Max payout |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Daisy | 50 | 12 s | 70 | 1.67 | 560 |
| 2 | Tulip | 110 | 18 s | 154 | 2.44 | 1,232 |
| 3 | Bluebell | 180 | 24 s | 252 | 3.00 | 2,016 |
| 4 | Lavender | 260 | 28 s | 364 | 3.71 | 2,912 |
| 5 | Rose | 350 | 32 s | 490 | 4.38 | 3,920 |
| 6 | Peony | 500 | 42 s | 700 | 4.76 | 5,600 |
| 7 | Marigold | 750 | 55 s | 1,050 | 5.45 | 8,400 |
| 8 | Orchid | 1,100 | 90 s | 1,540 | 4.89 | 12,320 |
| 9 | Sun Lotus | 2,200 | 140 s | 3,080 | 6.29 | 24,640 |
| 10 | Jade Fern | 3,200 | 180 s | 4,480 | 7.11 | 35,840 |
| 11 | Moonflower | 4,500 | 220 s | 6,300 | 8.18 | 50,400 |
| 12 | Starlit Iris | 6,500 | 280 s | 9,100 | 9.29 | 72,800 |
| 13 | Aurora Bloom | 9,000 | 360 s | 12,600 | 10.00 | 100,800 |
| 14 | Celestial Lotus | 12,000 | 480 s | 16,800 | 10.00 | 134,400 |
| 15 | Nebula Orchid | 20,000 | 540 s | 28,000 | 14.81 | 224,000 |
| 16 | Solstice Lily | 35,000 | 600 s | 49,000 | 23.33 | 392,000 |
| 17 | Aurora Crown | 52,000 | 660 s | 72,800 | 31.52 | 582,400 |
| 18 | Mythic Starflower | 75,000 | 720 s | 105,000 | 41.67 | 840,000 |
| 19 | Eternal Crown | 100,000 | 780 s | 140,000 | 51.28 | 1,120,000 |

### Two things to notice in that curve

**Orchid is a trap.** At 4.89 net/s it is *worse* than Marigold's 5.45 despite costing 47% more,
because its grow time jumps from 55 s to 90 s. It's the only backwards step in the table.

**Aurora Bloom and Celestial Lotus are identical** at 10.00 net/s, so Celestial is a pure
convenience upgrade — bigger numbers per harvest, same rate, at 33% more capital.

Whether these are bugs or intentional texture is not recorded anywhere. They came over from the
original build. Left alone for now, noted in [11-known-issues.md](11-known-issues.md).

### Premium drop chances

Only the top five seeds define their own drop rates. Every other seed uses the default 5% gem
chance.

| Seed | Gem chance |
| --- | --- |
| Nebula Orchid | 0.8% |
| Solstice Lily | 1.0% |
| Aurora Crown | 1.2% |
| Mythic Starflower | 1.5% |
| Eternal Crown | 2.0% |
| *(all others)* | 5.0% *(default)* |

Read that table twice: the endgame seeds have a **lower** gem chance than a Daisy. Explicitly
defining `gemChance` overrides the generous 5% fallback, so the best gem farm in the game is
spamming the cheapest, fastest seed. Almost certainly not the intent, but it is the current
behaviour and migrated saves depend on it.

## Rarity

| Rarity | Weight | Chance | Multiplier |
| --- | --- | --- | --- |
| Common | 70 | 70.0% | 1× |
| Rare | 20 | 20.0% | 2× |
| Epic | 8 | 8.0% | 4× |
| Legendary | 2 | 2.0% | 8× |

Expected multiplier **1.58×**. With Fortune Aura's +50% applied to the three non-common weights,
the distribution becomes 60.87 / 26.09 / 10.43 / 2.61 percent and the expected multiplier rises to
**1.7565×** — an 11% payout increase, for 40 tickets over 30 minutes.

## Plot unlocks

```
cost(index) = 400 + 300 × (index + 1)
```

Indices 0–3 start unlocked. Plots 5–8 become buyable at levels 3, 6, 9 and 12, then cost
**1,900, 2,200, 2,500, 2,800**. Total cost to open the whole garden by hand: 9,400 coins.

The Land Deed badge is the bulk alternative — 2,000 for the first two *opened* plots, then 4,000
for the next two — but it cannot skip a plot the level bar has not opened yet. At level 1 it
reads Maxed. Once every plot is open it maxes for good, and it is still the only badge that can.

## Badge prices

All badges are bought with coins. Price is `round(base × scale^level)`, so the first purchase
costs exactly `base`.

| Badge | In-game name | Base | Scale | First six levels |
| --- | --- | --- | --- | --- |
| `tapPower` | Power Punch | 100 | 2.0 | 100, 200, 400, 800, 1.6K, 3.2K |
| `holdSpeed` | Quick Grip | 150 | 1.9 | 150, 285, 542, 1.03K, 1.95K, 3.71K |
| `critChance` | Lucky Charm | 500 | 1.5 | 500, 750, 1,125, 1,688, 2,531, 3,797 |
| `critMult` | Star Strike | 1,000 | 2.0 | 1K, 2K, 4K, 8K, 16K, 32K |
| `comboMeter` | Combo Coil | 2,500 | 2.0 | 2.5K, 5K, 10K, 20K, 40K, 80K |
| `rainDance` | Rain Dance | 250 | 1.8 | 250, 450, 810, 1.46K, 2.62K, 4.72K |
| `beeSwarm` | Bee Swarm | 2,000 | 2.0 | 2K, 4K, 8K, 16K, 32K |
| `ladybug` | Lucky Ladybug | 800 | 1.9 | 800, 1.52K, 2.89K, 5.49K, 10.4K, 19.8K |
| `plotExpansion` | Land Deed | 2,000 | 2.0 | 2K, 4K, 8K, 16K, 32K, 64K |
| `autoWater` | Sprinklers | 400 | 1.7 | 400, 680, 1.16K, 1.97K, 3.34K, 5.68K |
| `autoHarvest` | Harvest Drone | 4,500 | 2.4 | 4.5K, 10.8K, 25.9K, 62.2K, 149.3K, 358.3K |

Lucky Charm's 1.5 scale is by far the gentlest, which makes crit chance the cheapest stat to push
deep. Power Punch's flat +1 per level becomes irrelevant quickly since it's additive against
multiplicative bonuses.

Rain Dance, Bee Swarm and Lucky Ladybug are priced to be fully maxed for a moderate mid-game sum —
111K, 62K and 150K coins respectively to hit their caps — rather than the "always technically
buyable, practically endless" shape most other badges use. Sprinklers was repriced the same way:
it used to cost 2,500 base at scale 2.2 for an uncapped +5%/level (practically capped by the 0.3
growth floor around level 14, ~2.4M coins in). At the new +1%/level, 10-level cap, the old price
would have made the full 10% cost roughly 5.5M coins — a bad deal for a much smaller effect — so it
was repriced to 400 base at scale 1.7 (114K coins to fully max). See
[10-decision-log.md](10-decision-log.md).

The three proc badges' trigger chances were later cut again — from `1%/level` to `0.2%/level` — to
make them feel like rare, volatile slot-machine moments instead of a steady growth lever (see the
decision log entry linked above). Their prices were deliberately **not** re-cut to match: buying
one now costs the same 62K–150K coins for a fifth of the old expected value, which is a genuinely
worse deal on paper. That's accepted on purpose — these three are the game's only "buy a chance at
a fun moment" badges rather than "buy a guaranteed number," so their value isn't meant to be judged
purely by coins-per-percent the way the rest of the upgrade list is. If playtesting shows players
resent the price at the new rate, repricing them down is the first lever to pull.

### Per-plot harvesters

Eight badges, `plot1Harvester` through `plot8Harvester`, generated in `data.js` rather than written
out. Base is `round(3000 × 1.3^(n−1))`, scale 2.3 for all of them.

| Plot | Base | Lv 2 | Lv 3 | Lv 4 |
| --- | --- | --- | --- | --- |
| 1 | 3,000 | 6,900 | 15,870 | 36,501 |
| 2 | 3,900 | 8,970 | 20,631 | 47,451 |
| 3 | 5,070 | 11,661 | 26,820 | 61,687 |
| 4 | 6,591 | 15,159 | 34,866 | 80,193 |
| 5 | 8,568 | 19,706 | 45,325 | 104,247 |
| 6 | 11,139 | 25,620 | 58,925 | 135,528 |
| 7 | 14,480 | 33,304 | 76,599 | 176,178 |
| 8 | 18,825 | 43,298 | 99,584 | 229,044 |

A harvester's level is also its seed ceiling: level *L* may plant any of the first *L* seeds and
picks the priciest it can afford. Reaching Eternal Crown on a single plot means level 19, which
at scale 2.3 is an astronomically large number — the seed ceiling is effectively unreachable by
design, and harvesters are meant to be levelled only a handful of times.

## Caps and floors

| Thing | Limit | Reached at |
| --- | --- | --- |
| Crit multiplier | 50× | 20 Star Strike levels |
| Combo cap | 100 | 5 Combo Coil levels |
| Hold-to-tap interval | 180 ms | 12 Quick Grip levels |
| Sprinkler grow bonus | 10% | 10 Sprinkler levels |
| Rain Dance trigger chance | 2% | 10 Rain Dance levels |
| Bee Swarm trigger chance | 1% | 5 Bee Swarm levels |
| Lucky Ladybug trigger chance | 1.6% | 8 Lucky Ladybug levels |
| Growth modifier (defensive floor, rarely reachable now) | 0.3 (70% faster) | — |
| Drone cadence | 0.7 s | 5 Harvest Drone levels |
| Crit chance | *(none)* | — |

Crit chance has no cap — above 100% makes every tap a crit. Decor stacking used to be the other
uncapped growth vector; it's cosmetic-only now and doesn't move any of these numbers.

## Boosters

Earned from quests, level-ups and the daily; stored in `boostInv`; activated from the rail. No
ticket price.

| Booster | Duration | Effect key | Value |
| --- | --- | --- | --- |
| Bloom Burst | 30 s | `tapPower`, `critChance` | +50%, +2% |
| Seed Rush | 600 s | `growSpeed` | +30% |
| Fortune Aura | 1,800 s | `rarityWeight` | +50% |
| Golden Popups | 30 s | `globalCredits` | +25% |

Scarcity is the point. If playtesting shows they are too rare, the fallback is gem pricing at
1 gem = 5 old tickets — see [16-progression-and-quests.md](16-progression-and-quests.md).

## Decor

**Purely cosmetic as of navigation phase 1** — see [15-navigation-and-ia.md](15-navigation-and-ia.md).
Decor used to duplicate four badge stats; that mechanic is gone, `decorVal()` has been deleted, and
existing owners were refunded at purchase price on their first load after the change (schema v3,
in `Game.load()`).

| Piece | Currency | Cost |
| --- | --- | --- |
| Gnome of Fortune | gems | 250 |
| Butterfly Shrine | coins | 1,000 |
| Crystal Fountain | coins | 5,000 |
| Lantern Tree | gems | 40 |

**Prices never escalate.** The fiftieth Butterfly Shrine still costs 1,000 coins. It lives in the
Shop tab and is a pure currency sink with no effect on the simulation.

## Where the effect keys are read

Useful when adding content — these strings are the entire vocabulary connecting decor and boosters
to the simulation:

| Key | Applies to | How |
| --- | --- | --- |
| `tapYield` | Taps (full), harvests (×0.3) | Multiplies payout |
| `tapPower` | Taps | Multiplies payout |
| `globalCredits` | Taps and harvests | Multiplies payout |
| `critChance` | Taps | Added to crit chance |
| `critMult` | Taps | Multiplies crit multiplier |
| `growSpeed` | Planting and hastening | Reduces grow time |
| `rarityWeight` | Harvests | Scales non-common weights |

`boostVal(key)` sums every active source of a key. Adding a new key means also adding the place
that reads it — nothing happens automatically. Decor no longer contributes to any of these keys.

## Progression sketch

Rough shape of a playthrough, assuming a player who taps a bit and reinvests:

1. **Opening** — 100 coins buys a Daisy. Tap while it grows. First Power Punch at 100.
2. **First minutes** — Daisies and Tulips cycle through four plots. Lucky Charm becomes affordable.
3. **First automation** — Plot 1 Harvester at 3,000 turns one plot self-sustaining. Harvest Drone
   at 4,500 removes the collection chore.
4. **Expansion** — Land Deed at 2,000 opens plots 5 and 6, then 4,000 for 7 and 8.
5. **Mid-game** — Sprinklers compress grow times; harvesters on every plot. The game largely runs
   itself and tapping becomes optional.
6. **Late game** — Badge levels push toward the growth floor and high crit chance (decor no longer
   contributes, since navigation phase 1). Seeds move to the Nebula Orchid tier and above, where
   net/s jumps sharply.

There is no ending, no prestige, and no soft wall. The curve simply flattens once badges cap out
the modifiers.
