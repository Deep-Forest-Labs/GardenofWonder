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

**Orchid is a trap *on throughput alone*.** At 4.89 net/s it is *worse* than Marigold's 5.45 despite
costing 47% more, because its grow time jumps from 55 s to 90 s. It's the only backwards step in the
table. **Partly answered 2026-08-14:** Orchid now carries the **Lantern** verb, doubling its
neighbours' gem chance, so it has a reason to be in the ground that has nothing to do with coins per
second. The coin curve is still backwards and still worth fixing; it is no longer the whole story.

**Aurora Bloom and Celestial Lotus are identical** at 10.00 net/s, so Celestial is a pure
convenience upgrade — bigger numbers per harvest, same rate, at 33% more capital.

Whether these are bugs or intentional texture is not recorded anywhere. They came over from the
original build. Left alone for now, noted in [11-known-issues.md](11-known-issues.md).

### Offline earnings

`DATA.offline`, plus two badges. Design in [03-systems.md](03-systems.md#offline-earnings).

| Key | Value | Effect |
| --- | --- | --- |
| `baseRate` | 0.25 | Share of passive income earned while away, before upgrades |
| `ratePerLevel` | 0.05 | Moonlight Tending, per level |
| `maxRate` | 1 | Clamp — 15 levels reaches it |
| `baseHours` | 4 | Hours at full rate before the cap |
| `hoursPerLevel` | 1 | Lantern Oil, per level |
| `maxHours` | 24 | Clamp — 20 levels reaches it |
| `trickle` | 0.1 | Share of the rate still earned past the cap |

| Badge | Base | Scale |
| --- | --- | --- |
| Moonlight Tending (`offlineRate`) | 4,000 | 1.9 |
| Lantern Oil (`offlineHours`) | 6,000 | 2.0 |

**The cap is the retention lever, so tune it before the rate.** At base, a fully automated garden
banks ~644K over 12 hours and ~805K over 24 — doubling the absence adds a quarter. Raising
`baseHours` weakens the reason to return; raising `trickle` weakens it more, because it flattens the
curve everywhere. If offline feels stingy, **raise the rate, not the cap.**

`EXPECTED_RARITY_MULT` in `game.js` is derived from the rarity table above, so a rarity retune
carries into offline income without a second edit.

### Weather and mutation tuning

A third axis, and like verbs it is deliberately **off the yield curve** — `yield === cost × 1.4`
still holds for every seed. Design in
[18-mutations-and-weather.md](18-mutations-and-weather.md).

`DATA.weather` — shares of all slots, must total 100. `slotSeconds: 60` in the web build.

| Weather | Share | Causes | Catch chance |
| --- | --- | --- | --- |
| Clear | 70% | — | — |
| Rain | 20% | Dewkissed | 25% |
| Thunderstorm | 7% | Gilded | 15% |
| Aurora | 2.5% | Prismatic | 12% |
| Wonderfall | 0.5% | Wonderstruck | 10% |

`DATA.mutations` — payout multipliers.

| Mutation | Rank | Pays | Reaches this share of harvests |
| --- | --- | --- | --- |
| Dewkissed | 1 | ×2 | ~5% |
| Gilded | 2 | ×10 | ~1% |
| Prismatic | 3 | ×25 | ~0.29% |
| Wonderstruck | 4 | ×100 | ~0.045% |

`verbTuning.beaconCatchBonus: 0.5` — each adjacent Beacon raises the catch chance by 50%. It raises
the **chance**, never the payout, which is what keeps the income share computable.

**Tune the income share, not these numbers.** Target is **20–30% of total income from mutations**;
measured today at ~20%, evenly across seeds. The share survives an economy retune, the multipliers do
not. The arithmetic to reason with is `contribution = chance × (multiplier − 1)`, which produces the
rule that matters: **a ×3 at 20% adds +40% to average income while a ×50 at 0.2% adds +10%.** Be
generous at the top of the ladder and stingy at the bottom — jackpots are cheap, frequent small
bonuses are what wreck a curve.

The suite asserts the share for a fast seed *and* a slow one and that they match. Do not tune these
by eye; run `node tools/sim-test.js`.

### The potting bench

`BENCH` in `data.js`. Mechanic and reasoning in [21-potting-bench.md](21-potting-bench.md).
**Simulation only as of 2026-08-16 — there is no surface yet.**

| Rung | Item | Value |
| --- | --- | --- |
| 1 | Petal | 10 |
| 2 | Posy | 45 |
| 3 | Bouquet | 200 |
| 4 | Flower Basket | 900 |
| 5 | Wreath | 4,000 |
| 6 | Flower Crown | 18,000 |

**These are placeholders against a Market that does not exist. The ratio is the real number** — each
rung is 4.5× the one below, so merging three beats selling them by 1.5× and the `raw < crafted <
order` chain in [14-economy-model.md](14-economy-model.md) holds at every step. A sim-test asserts
the ratio survives a retune; the absolute values do not matter until orders can pay for them.

| Key | Value | Effect |
| --- | --- | --- |
| `cols` | 6 | The bench is always 6×6; `side` decides how much is unlocked |
| `startSide` | 4 | Opens at 4×4 = 16 cells |
| `merge` | 3 | Items that must meet to combine |
| `bonusAt` | 5 | A connected run this long pays two outputs |
| `basketMax` | 60 | Harvests stop stacking up past this |

Expansion costs `round(6000 × 3.2^step)` — 6,000 for 5×5 and 19,200 for 6×6. Priced against late-game
coin inflation rather than against the seeds, because board space is the only sink that scales with
how automated the garden already is.

**Entry tier is the number to watch.** What a harvest is worth to the bench is
`seedBucket[seed] + rarityBump[rarity]`, capped at the top rung — never flat per harvest, because a
Daisy cycles 65× faster than an Eternal Crown and any flat rate recreates the gem-faucet inversion
fixed on 2026-08-15. `rarityBump` is Common +0, Rare +1, Epic +2, Legendary +3, and **the +3 is the
first thing to cut if the bench runs hot**: measured in the spike, the rarity term roughly triples
chain throughput against Commons only. The suite asserts a Daisy cannot out-feed the endgame seed by
more than 1.35×.

### Creature traits

`CREATURE_TRAITS` and `HABITAT_SLOT_LEVELS` in `data.js`. Design in
[22-creatures.md](22-creatures.md#traits-and-tending).

| Creature | Bloom | Trait | Pool | Value at ★5 |
| --- | --- | --- | --- | --- |
| Pip | Bluebell | `mutationLuck` — Coaxes the Sky | chance | +0.25 catch multiplier |
| Bumble | Lavender | `keepsakeSpeed` — Busy Hands | utility | keepsake wait ÷ 2, floored at ÷4 |
| Bramble | Rose | `packLuck` — Forager | chance | 0.02 pack chance per harvest |
| Thistle | Marigold | `gemLuck` — Rummager | chance | ×1.6 gem chance |
| Luna | Moonflower | `nightYield` — Moonlit | yield | ×1.3 at night only |
| Ember | Starlit Iris | `offlineRate` — Lantern Keeper | utility | ×1.2 offline rate, inside the cap |

**Luna is the only trait in the `yield` pool, and it is capped by the clock** — night is ~32% of the
cycle, so ×1.3 at night is ≈+10% on average. That is the shape any future yield trait should copy:
nominally large, structurally bounded by something the player does not control. Four unbounded +25%
yield traits would be 2.44× on top of mastery, verbs, rarity and mutations.

Habitat slots open at levels **1, 5, 10, 16**, so a player holds at most four tending creatures.
Moved earlier from 1 / 8 / 14 / 20 because pairs need two slots to exist and were otherwise
undiscoverable until level 8.

**Eight named pairs** in `CREATURE_PAIRS`, tuned in `PAIR_TUNING`. **None of them touches the yield
pool** — every effect is a chance, a duration, a cap or an upgrade-to-a-roll, and a sim-test asserts a
full loadout never changes the harvest multiplier. `nightbloomChance` (0.5) and `nightbloomCap` (3)
are the two to watch: upgrading Dewkissed to Gilded is a 5× jump on that harvest, so it is a coin
flip and can never reach the top tier.

**A creature arrives at one star and carries a fifth of its trait**, climbing to the listed value at
five. `CREATURE_STARS` is 5 and `trait.value` is the ceiling, so a one-star Pip is +0.05. The
duplicate that raises a star costs `count × growth^(level−1)` lifetime harvests of its own bloom —
Pip is 5 / 15 / 45 / 135 / 405 Bluebells. **That escalation is what keeps a low-tier seed worth
planting late**, which is the first answer the game has had to "why would I ever plant a Daisy again."
Placeholders; the shape is what matters.

**Traits are a third axis and stay off the yield curve** — `yield === cost × 1.4` still holds. Pip
raises the mutation **catch chance** and never a payout, so the 20–30% mutation income target stays
computable: at one tending Pip the catch multiplier is 1.25, which lifts the mutation share by
roughly a quarter of itself, not by 25% of total income.

**Two rules the suite enforces**, because breaking either is invisible until much later: no trait may
sit on an effect category a verb already owns, and no two creatures may share a trait category.

### Verb tuning

Verbs are a second axis and are deliberately **not** on the yield curve — see
[03-systems.md](03-systems.md#verbs-and-adjacency). All seven numbers live in `DATA.verbTuning` so a
balance pass is one edit.

| Key | Value | Effect |
| --- | --- | --- |
| `keeperGrowth` | 0.15 | Keeper: neighbours grow 15% faster |
| `nurseGive` | 0.20 | Nurse: neighbours pay +20% |
| `nurseCost` | 0.10 | Nurse: the nurse itself pays −10% |
| `beaconRarity` | 6 | Beacon: extra weight passed to `rollRarity()` |
| `lanternGemMult` | 2 | Lantern: gem-chance multiplier, compounding per adjacent Lantern |
| `deeprootPerNeighbour` | 0.08 | Deeproot: +8% per planted neighbour |
| `nightbellNight` | 2 | Nightbell: multiplier when harvested at night |
| `nightbellDay` | 0.5 | Nightbell: multiplier when harvested by day |
| `spreaderChance` | 0.20 | Spreader: chance to sow a free copy on harvest |

**Nightbell is deliberately near-neutral**, not a buff: night is ~32% of the cycle, so the expected
multiplier is ≈0.98. Changing either number changes what the verb *is* — push the pair apart and it
becomes a sharper timing gamble, pull them together and it stops being a decision at all.

Because every plot has exactly two neighbours, the ceilings are bounded and known: a plot can be
flanked by at most two of anything. Two Nurses is ×1.4 payout, two Keepers is ×0.7 grow time, two
Lanterns is ×4 gem chance, and Deeproot tops out at +16%. **`beaconRarity` is the one to watch** —
it is passed as `extra` to `rollRarity()`, which multiplies the non-Common weights, so 6 is already
a large lift and two Beacons is 12. Cut this first if rare harvests start feeling cheap.

### Gem drops

Derived from grow time, not set per seed: `gemChance = grow × gemChancePerGrowSecond`, clamped by
`gemChanceMax`.

| Key | Value |
| --- | --- |
| `gemChancePerGrowSecond` | 0.0005 |
| `gemChanceMax` | 0.5 |

| Seed | Grow | Gem chance | Gems/hour/plot |
| --- | --- | --- | --- |
| Daisy | 12 s | 0.60% | 1.80 |
| Lavender | 28 s | 1.40% | 1.80 |
| Orchid | 90 s | 4.50% | 1.80 |
| Aurora Bloom | 360 s | 18.00% | 1.80 |
| Eternal Crown | 780 s | 39.00% | 1.80 |

**Gems per hour is constant by construction**, so gem income tracks time played rather than seed
choice. This replaced a flat 5% default that, with explicit low values on the top five seeds, made
spamming Daisies the optimal gem strategy — the inversion that sat in
[11-known-issues.md](11-known-issues.md) since the port. Those five overrides are gone; a seed may
still set `gemChance` to opt out, and none do.

### Gem sinks

| Sink | Price | Notes |
| --- | --- | --- |
| Call Rain | 8 gems | 4 minutes, pulls unspent rolls into the window |
| Call Thunderstorm | 25 gems | as above |
| Skip a timer | `ceil(remaining / 30)`, min 1 | Falls as the plant grows |
| Gnome of Fortune | 250 gems | Cosmetic |
| Lantern Tree | 40 gems | Cosmetic |

Eight plots earn ~14 gems/hour, so a Thunderstorm call is close to two hours of income — a real
decision rather than pocket change. **Price sinks against that rate, not against the cosmetics**,
which are a one-off catalogue and will always be finished.

**Aurora and Wonderfall have no price and must not get one.** See
[03-systems.md](03-systems.md#gems-where-they-come-from-and-what-they-buy).

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

## Meadow land (added 2026-08-25)

```
cost(index) = 1,200 + 900 × (index + 1)
```

The garden's gate, restated on the second board so the rule is learned once: reach the level, then
pay the coins. Cells 0–3 start open. Cells 4–8 gate at levels **5, 8, 11 and 14** and then cost
**5,700, 6,600, 7,500, 8,400** — 28,200 to open the whole meadow.

They sit above the garden's plots (1,900–2,800) because the meadow is somewhere you travel to once
the garden is already running, and a hive on the land costs 2,200 more on top. **Every number here
is provisional** and belongs in the full retune with everything else; what is not provisional is the
*shape* — a level bar you cannot buy past, then a price.

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
| Crit chance | 99% | 94 Lucky Charm levels |

Crit chance is capped at 99% so a tap can always miss; the cap is in `Game.critChanceNow()` and
feeds both the roll and the Almanac readout. Lucky Charm itself is still uncapped, and its 1.5 cost
scale is the gentlest in the table, so the cap is what stops crit from becoming a flat multiplier.
Decor stacking used to be the other uncapped growth vector; it's cosmetic-only now and doesn't move
any of these numbers.

## Boosters

Earned from quests, level-ups, the daily and Almanac milestones; stored in `boostInv`; activated from the rail. No
ticket price.

| Booster | Duration | Effect key | Value |
| --- | --- | --- | --- |
| Bloom Burst | 30 s | `tapPower`, `critChance` | +50%, +2% |
| Seed Rush | 600 s | `growSpeed` | +30% |
| Fortune Aura | 1,800 s | `rarityWeight` | +50% |
| Golden Popups | 30 s | `globalCredits` | +25% |

Scarcity is the point. If playtesting shows they are too rare, the fallback is gem pricing at
1 gem = 5 old tickets — see [16-progression-and-quests.md](16-progression-and-quests.md).

## Almanac milestones

Paid once when distinct species harvested crosses the rung. Numbers live in
`DATA.almanacMilestones`. The last `at` must match `DATA.seeds.length`.

| Distinct species | Rep | Gems | Boost |
| --- | --- | --- | --- |
| 5 | 20 | 1 | Bloom Burst |
| 10 | 30 | 2 | Seed Rush |
| 15 | 40 | 3 | Fortune Aura |
| 19 | 50 | 5 | Golden Popups |

## Bloom Mastery — retired 2026-08-29, petals in its place

The endless ladder froze with the Garden Year's phase 1: `masteryMult()` returns 1, tiers no
longer advance, and the every-fifth-tier gem is gone. Earned tiers converted once into Saved
Seeds (`DATA.year.masteryConvert = 2` per tier, silent, on first load). `masteryYieldPerTier`,
`masteryGemEvery` and `masteryGemGrant` remain in `data.js` as dead knobs until phase 2 removes
the Almanac's frozen ladder row; nothing reads them in anger. The per-seed multiplier is now
**Rich Bloom** — see [33-year-one-economy.md](33-year-one-economy.md#petals--prices-and-effects)
for petal prices and effects, and
[03-systems.md](03-systems.md#the-garden-year--the-engine-simulation-only) for the mechanics.

Harvest payout, with petals:

```
payout = round(seed.yield × rarity.m × (1 + globalCredits) × (1 + pollination) × wonder
               × petalMult × verbMult × mutationMult × critterMult)
petalMult = 1 + petals.rich × DATA.petals.shared.rich.value      // +30% per petal, cap 5
```

Taps, flower sale prices and craft inputs are untouched — exactly the rule mastery followed.
The old ladder's numbers are preserved in
[16-progression-and-quests.md](16-progression-and-quests.md#phase-5--bloom-mastery) for the
record.

**The Year's own numbers live in [33-year-one-economy.md](33-year-one-economy.md)** — seed
unlock prices (the spread), the mint, the Tally tiers, petal pricing, Fall's plant list and
the windfall — all under `DATA.year`, `DATA.petals` and `DATA.fall`, remote-config-ready.
This document stays the reference for everything the Year did not touch.

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

## Creature food (added 2026-08-18)

A coin sink, and one the economy needed. Food runs **one clock**: a creature is *well fed* above
3h remaining (works one star up), *awake but hungry* above zero, and *asleep* at zero. Design and
the reasoning in [22-creatures.md](22-creatures.md).

| Food | Adds | Of which boost | Cost | Per boost hour | Per hour of fullness |
| --- | --- | --- | --- | --- | --- |
| Clover Nibble | 4 hours | 1h | 1,500 | 1,500 | 375 |
| Petal Cake | 8 hours | 5h | 5,000 | 1,000 | 625 |
| Honeypot | 16 hours | 13h | 12,000 | 923 | 750 |

**The two per-hour columns run in opposite directions, and both are asserted.** Per hour of *boost*
the price falls with the tier, so the dear food is the cheaper way to stay buffed. Per hour of plain
*fullness* it rises, so the cheap food stays the efficient way to simply keep a creature awake —
which is what stops the upkeep half from being a wall for a poor player.

The clock caps at **24 hours** ahead (`FOOD_CAP_HOURS`), so no single purchase buys weeks. It was
two clocks until 2026-08-20; merging them changed no tuning, because the second was only ever
expressing the gap between them.

**Why a star rather than a multiplier.** The obvious version was ×2 while fed, and it is safe for
four of the six creatures because their traits sit in the `chance` and `utility` pools. It is not
safe for two. Luna is the only trait in the `yield` pool and ×2 takes her from **+9.6% to +19.2%
average payout**, on a harvest product that is already seven multiplied terms with an endless
mastery ladder underneath. Thistle at ×2 doubles the drop rate on the **premium** currency. A star
is `(n+1)/n`, which is ×2.00 at one star and **×1.20 at five** — self-limiting exactly where a flat
multiplier is self-amplifying. `FED_STARS` in `data.js` is the one number to change.

**Prices are placeholders and flat**, like everything else here. Whether they should scale with the
creature's star is a live question — see the open questions in
[22-creatures.md](22-creatures.md).

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
