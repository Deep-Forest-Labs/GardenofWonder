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
chance and has no ticket chance at all.

| Seed | Gem chance | Ticket chance |
| --- | --- | --- |
| Nebula Orchid | 0.8% | 0.3% |
| Solstice Lily | 1.0% | 0.4% |
| Aurora Crown | 1.2% | 0.5% |
| Mythic Starflower | 1.5% | 0.6% |
| Eternal Crown | 2.0% | 0.8% |
| *(all others)* | 5.0% *(default)* | none |

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

Indices 0–3 start unlocked, so only the last four prices are ever charged: **1,900, 2,200, 2,500,
2,800**. Total cost to open the whole garden by hand: 9,400 coins.

The Land Deed badge is the alternative — 2,000 for the first two plots, then 4,000 for the next
two. That's 6,000 for all four versus 9,400 individually, so Land Deed is the better deal, and it
is the only badge that can max out.

## Badge prices

All badges are bought with coins. Price is `round(base × scale^level)`, so the first purchase
costs exactly `base`.

| Badge | In-game name | Base | Scale | First six levels |
| --- | --- | --- | --- | --- |
| `tapPower` | Power Punch | 100 | 2.0 | 100, 200, 400, 800, 1.6K, 3.2K |
| `critChance` | Lucky Charm | 500 | 1.5 | 500, 750, 1,125, 1,688, 2,531, 3,797 |
| `critMult` | Star Strike | 1,000 | 2.0 | 1K, 2K, 4K, 8K, 16K, 32K |
| `comboMeter` | Combo Coil | 2,500 | 2.0 | 2.5K, 5K, 10K, 20K, 40K, 80K |
| `plotExpansion` | Land Deed | 2,000 | 2.0 | 2K, 4K, 8K, 16K, 32K, 64K |
| `autoWater` | Sprinklers | 2,500 | 2.2 | 2.5K, 5.5K, 12.1K, 26.6K, 58.6K, 128.8K |
| `autoHarvest` | Harvest Drone | 4,500 | 2.4 | 4.5K, 10.8K, 25.9K, 62.2K, 149.3K, 358.3K |

Lucky Charm's 1.5 scale is by far the gentlest, which makes crit chance the cheapest stat to push
deep. Power Punch's flat +1 per level becomes irrelevant quickly since it's additive against
multiplicative bonuses.

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
| Growth modifier | 0.3 (70% faster) | 14 Sprinkler levels |
| Drone cadence | 0.7 s | 5 Harvest Drone levels |
| Crit chance | *(none)* | — |
| Decor stacking | *(none)* | — |

Two of those have no cap. Crit chance above 100% makes every tap a crit; unlimited decor stacking
combined with flat pricing is the only genuinely unbounded growth vector in the game.

## Boosters

| Booster | Tickets | Duration | Effect key | Value |
| --- | --- | --- | --- | --- |
| Bloom Burst | 25 | 30 s | `tapPower`, `critChance` | +50%, +2% |
| Seed Rush | 20 | 600 s | `growSpeed` | +30% |
| Fortune Aura | 40 | 1,800 s | `rarityWeight` | +50% |
| Golden Popups | 30 | 30 s | `globalCredits` | +25% |

Value per ticket-second varies wildly: Fortune Aura gives 45 ticket-seconds per ticket, Bloom Burst
1.2. The short boosters are priced as burst tools for an active session, the long ones as
set-and-forget.

## Decor

| Piece | Currency | Cost | Effect key | Value |
| --- | --- | --- | --- | --- |
| Gnome of Fortune | gems | 250 | `critChance` | +5% |
| Butterfly Shrine | coins | 1,000 | `growSpeed` | +10% |
| Crystal Fountain | coins | 5,000 | `tapYield` | +10% |
| Lantern Tree | tickets | 200 | `critMult` | +1% |

**Prices never escalate.** The fiftieth Butterfly Shrine still costs 1,000 coins. Since badges
scale at 2.0–2.4×, decor overtakes them completely in the late game, and it's the reason a mature
save can hit the growth floor and 100% crit chance.

Lantern Tree is poor value at +1% of a multiplier for 200 tickets — five of them equal a single
Fortune Aura in cost and give +5% crit multiplier permanently, which is worth far less than 30
minutes of +50% rarity.

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

`decorVal(key)` and `boostVal(key)` sum every source of a key. Adding a new key means also adding
the place that reads it — nothing happens automatically.

## Progression sketch

Rough shape of a playthrough, assuming a player who taps a bit and reinvests:

1. **Opening** — 100 coins buys a Daisy. Tap while it grows. First Power Punch at 100.
2. **First minutes** — Daisies and Tulips cycle through four plots. Lucky Charm becomes affordable.
3. **First automation** — Plot 1 Harvester at 3,000 turns one plot self-sustaining. Harvest Drone
   at 4,500 removes the collection chore.
4. **Expansion** — Land Deed at 2,000 opens plots 5 and 6, then 4,000 for 7 and 8.
5. **Mid-game** — Sprinklers compress grow times; harvesters on every plot. The game largely runs
   itself and tapping becomes optional.
6. **Late game** — Decor stacking pushes toward the growth floor and 100% crit. Seeds move to the
   Nebula Orchid tier and above, where net/s jumps sharply.

There is no ending, no prestige, and no soft wall. The curve simply flattens once decor caps out
the modifiers.
