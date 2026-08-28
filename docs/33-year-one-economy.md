# The Year-One Economy — the retune

**Status: specification, 2026-08-29. Nothing here is built.** The numbers for
[32-the-garden-year.md](32-the-garden-year.md), and the economy retune the owner unblocked
("the economy is already broken"). **Every value here is provisional, lives in `data.js`, and is
remote-config-ready** — the two standing rules. Where a number came from the simulated pacing
model in the 2026-08-29 pressure test, it says so; those simulations should be re-run as
sim-tests when the values land in data.

The frozen-port seed table survives on purpose. What changes is everything around it.

## Principles, restated as constraints

1. **`yield = cost × 1.4` at Common holds for every seed, including new Fall/Winter plants.**
   The wall never comes from a worse ratio; it comes from the unlock prices below. Petal and
   verb and mutation effects all apply off the yield curve, `masteryMult`-style.
2. **The mint reads earnings, never balance.** `state.year.coinsEarned` is a
   lifetime-this-year accumulator, never decremented. **Every credit grant routes through one
   helper — `Game.credit(amount, { cheat, refund })` — which increments the accumulator unless
   flagged**, so taps, harvests, orders, jar sales, quest gold and the offline grant in
   `reconcile()` all count by construction, and no future faucet can silently miss it. Spending
   is seed-neutral, and a sim-test asserts it (buy everything one tick before the Turn; the
   pouch must not change).
3. **Cheated grants are excluded from the mint.** The dev/cheat paths call `credit()` with
   `cheat: true` (and migrations with `refund: true`), skipping `coinsEarned`. Testers keep
   their buttons; the pacing data stays clean.
4. **Gems touch none of this.** No gem → petal path, no gem → unlock path, no per-seed gem skill.

## Unlock prices — where the spread lives

Per-plant costs are unchanged. Each seed from #3 up carries a **one-time unlock price, permanent
across Turns**, paid in gold. Found by simulation: per-plant spreads cannot wall (the ladder
self-finances in ~6 active minutes), so the spread lives here.

```
unlock(3) = 150,000
unlock(n) = 150,000 × 1.6^(n−3)      // DATA.year.unlockBase, DATA.year.unlockRatio
```

| Seed | Unlock | Seed | Unlock |
| --- | --- | --- | --- |
| 1 Daisy | free | 11 Moonflower | ~6.4M |
| 2 Tulip | free | 13 Aurora Bloom | ~16.5M |
| 3 Bluebell | 150K | 15 Nebula Orchid | ~42.2M |
| 5 Rose | 384K | 17 Aurora Crown | ~108M |
| 7 Marigold | 983K | 19 Eternal Crown | ~277M |
| 9 Sun Lotus | 2.5M | | |

Simulated pacing at ×1.6 with petals compounding: **first Turn on day 2–3 of casual play (~6
sessions), ~10 Turns total, all nineteen seeds by ~day 31, averaging 1.7 unlocks per Turn.**
Sensitivity: ×1.5 compresses to ~3 weeks; ×1.8 stalls below one seed per Turn. The first wall
reads as "six times everything I've earned" on day one — impossible as a *feeling* — and breaks
inside the mobile genre's first-prestige window. Deliberately-weeks walls arrive naturally
around Turn 6+, where veterans expect them.

**Levels stop gating seeds.** `unlockLevel` on seeds retires; the two-stage gate becomes
*unlock price once, afford the plant price always*. Plots, habitat slots and meadow cells keep
their lifetime-level gates. The level ladder's freed rewards are re-authored below.

## Saved Seeds — the mint

```
base  = DATA.year.mintK × sqrt(coinsEarnedThisYear) × (1 + DATA.year.veterancy × turnsCompleted)
pouch = round( base × tally )                      // tally ∈ [1.0, DATA.year.tallyCap]
mintK = 0.1     veterancy = 0.2     minSeeds = 10     tallyCap = 2.0     // all under DATA.year
```

First Turn pays **~61 base seeds on a typical ~370K-coin first year** (the pacing sim's figure —
an earlier draft misquoted the coin total), times a modest first-year tally. The blessing grants
**one free petal** on a chosen flower, outside the pouch.

### The Tally

The owner's arcade-scoring beat, 2026-08-29: after the base count-up, the year's achievements
land one line at a time, each adding to a bonus that multiplies the base, **summed then capped at
`tallyCap` (×2.0)**. Lines are data (`DATA.year.tally`), each reading a **year-scoped counter in
`state.year.stats`** — never a lifetime record, never anything spendable. **A line the year
scored zero on does not appear**; the Tally only celebrates.

| Line | Counter | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- | --- |
| Orders filled | `stats.orders` | 10 → +10% | 25 → +15% | 50 → +25% |
| Full-bed windfalls | `stats.windfalls` | 3 → +5% | 8 → +10% | 15 → +15% |
| Species grown this year | `stats.species` | 5 → +5% | 10 → +8% | 15 → +12% |
| Legendary blooms | `stats.legendaries` | 1 → +5% | 3 → +8% | 8 → +12% |
| Best combo | `stats.bestCombo` | 50 → +3% | 80 → +5% | — |

A typical mid-game year lands ~×1.35; a maxed year hits the ×2.0 cap. `mintK` is the counter-knob
if playtest tallies run hot — the Tally redistributes the pouch toward playing *well and
variedly*; it must never be the difference between progressing and not. The tiers rotate effect
categories deliberately: demand (orders), Fall's ritual (windfalls), breadth (species), luck
celebrated (legendaries), and the tap loop (combo). The two growth exponents that must stay matched:
petal costs compound at 1.25/level while the pouch grows ~1.2–1.26/cycle, so **every Turn affords
a similar 2–5 petals forever**, spread across a widening catalog. These two knobs are the pacing
dials; tune them together or not at all.

Sink runway (simulated): maxing every shared skill to petal 12-equivalent across the catalog
costs ~525K seeds against ~1.8K/day at the endgame faucet — months of headroom before any deep
petal, with `L20+` catalogs effectively aspirational. The sink stays ahead of the faucet without
any petal being individually out of reach.

## Petals — prices and effects

```
petalCost(seed n, petal p) = round( 5 × 1.3^(n−1) × 1.25^(p−1) )     // shared skills
signature petals cost ×0.6 of the same formula
```

Daisy's first petal: 5 seeds. Seed 10's first: ~53. Seed 19's first: ~561. Purchases naturally
migrate up the ladder — fresh high-tier flowers have cheap early petals on expensive bases.

| Skill | Petals | Effect per petal | Guardrail |
| --- | --- | --- | --- |
| **Rich Bloom** (all flowers) | 5 | +30% harvest value, additive per petal (+150% at cap) | Applied as `petalMult` at harvest and in `passiveIncomeRate()`, same commit; never edits `seed.yield` |
| **Quick Sprout** (all flowers) | 5 | −6% grow time, additive (−30% at cap) | Total stack with Sprinklers + Keeper + Seed Rush asserted above the 0.3 floor |
| **Signature** (per flower) | 1–3 | Authored, below | Chance skills are countdowns with data caps; no gem skill exists |

### The launch six signatures

Written to the one-line test, each a countdown or a bounded effect, none in the gem pool:

| Flower | Signature | Petal 1 → 2 → 3 |
| --- | --- | --- |
| Daisy | **Lucky Petals** — a card pack blooms on a countdown | every 12th harvest → 10th → 8th |
| Tulip | **Second Bloom** — a free instant regrow on a countdown | every 15th → 12th → 10th |
| Bluebell | **Pip's Favourite** — Pip's arrival/star counts advance faster | +25% → +50% credit per harvest |
| Rose | **Thorned Charm** — crit chance while a rose is planted | +2% → +4% (data-capped) |
| Lavender | **Sweet Air** — hive jars arrive faster while lavender blooms | ×0.92 → ×0.85 interval |
| Moonflower | **Storm-Kissed** — mutation *catch* countdown during weather | pity: a catch within 8 exposed harvests → 6 (cap honours the 20–30% share band) |

Signature authoring rules: declare a pool (the creature-trait discipline), never touch mutation
*payouts*, never touch gems, and the countdown's pity counter is visible on the card.

## Reputation and the ladder past 17

Orders become the perennial rep faucet ([13-order-system.md](13-order-system.md) tiers stand:
0 / 50 / 150 / 400 / 1000 lifetime rep). `repToNext(level) = 10 + 5×(level−1)` survives v1. The
ladder re-authors levels 18–40, one grant each, rotating categories per the no-two-adjacent rule
— packs, boosts, a new Stand customer, habitat slot five (~level 24), cosmetic decor, a meadow
cell, gem pinches. Sketch lives here until built; the rule that matters: **every level grants
something, and no two adjacent levels grant the same category.**

Year one's quest ladder keeps its 777 total and its tutorial role, **but four quests collide
with the unlock walls and must be re-keyed in slice A**: `q_lavender_3`, `q_rose_3`, `q_peony_3`
and `q_marigold_3` name seeds behind 240K–983K unlocks, unreachable in a ~370K first year — left
alone they are the documented strip-jam (the sell-quest failure, third time around). Re-key each
to a seeds-1–3 or verb-agnostic goal at the same reputation, the established stand-in pattern,
and hold the total at 777. The four meadow-dependent quests (`q_hive_1`, `q_honey_3/8/15`,
114 rep) stay live because the meadow stays reachable from Summer's edge from day one — re-check
the moment the meadow's entry point moves.

## Fall content

Eight plants at launch, hour-class clocks, `yield = cost × 1.4` throughout, from the doc-26
cottage list — beds and trees, never field rows:

| Plant | Cost | Grow | Yield | Notes |
| --- | --- | --- | --- | --- |
| Strawberry | 2,000 | 20 min | 2,800 | The Fall tutorial plant |
| Mint | 3,500 | 35 min | 4,900 | |
| Chamomile | 5,500 | 50 min | 7,700 | |
| Bramble Berry | 9,000 | 1.5 h | 12,600 | The hedge Bramble shops at |
| Pumpkin | 16,000 | 3 h | 22,400 | |
| Elderflower | 28,000 | 5 h | 39,200 | |
| Apple (tree) | 48,000 | 8 h | 67,200 | The overnight anchor |
| Wheat (one patch) | 20,000 | 4 h | 28,000 | The entire grain concession |

**The windfall rule** (`DATA.fall.windfall = 0.5`): harvesting a Fall bed whose **all eight
plots are planted and ripe** pays **+50% on the whole bed** — all eight, so a single-strawberry
board cannot fish for it; the fill-cycle resets when the bed empties. One knob, one legible rule,
and it is what makes Fall an appointment rather than a chore. Fall plants gate on gold prices
only in v1 — no unlock walls inside Fall until its list grows.

**Crops are not flowers** ([32-the-garden-year.md](32-the-garden-year.md#falls-board-specified)):
no rarity, no mutations, no gem drops, never written to `discovered`; they count generic
`harvest` quest tracks. `DATA.fall = { windfall, plants: […] }` is **wholly separate from
`DATA.seeds`** — appending crops to the seed array would drag them through rarity, gems,
mutations, verbs and the Almanac. `state.fall.grid` mirrors the main grid's cell shape minus the
mutation and pack fields.

**The showpiece:** one ultra-long plant, the **Century Bloom** — cost and payout enormous, grow
time **14 days**, survives every Turn (a running long timer is never killed), blooms once with
the game's loudest celebration short of a Wonder. **Ships in slice A with Fall** (owner-confirmed
2026-08-29); plantable in a Fall plot, excluded from the bed-ripeness math so it never parks the
windfall, one growing at a time. Numbers deliberately absurd and data-tagged.

Winter's list (5–6 plants, 12–48 h clocks) follows in slice C; do not author it now.

## Badges

Unchanged in v1 — they reset at the Turn and are rebought, which re-prices them *in effect*
(they are now bought once per year, not once per lifetime). Watch list for the first playtest:
Lucky Charm's 1.5 scale (cheap crit-stacking inside a short year), Harvest Drone / harvesters
(parked — their own conversation), and the three proc badges' value inside a 2-day year.
Re-price only on playtest evidence, and log it.

## Migration

- **Old Bloom Mastery retires.** `state.mastery` tiers convert once:
  `grant = round(2 × totalTiersAcrossAllSeeds)` Saved Seeds, silent, on first load of the Year
  build. `rarityCounts`, `discovered`, `bestRarity` all stay — creatures and the Almanac read
  them.
- **New state** (all in `defaultState()` **and** the nested re-merge list in `load()`, and every
  new `data.js` global in the sim-test GLOBALS whitelist — the two documented save traps):
  `year { number, coinsEarned, turnsCompleted }`, `savedSeeds`, `petals { seedId: { rich,
  quick, sig } }`, `seedUnlocks { seedId: true }`, `fall { grid, … }`, `blessed`.
- **Existing saves enter the Year mid-flight:** the current garden becomes year one in
  progress, and `coinsEarned` **starts at zero** — no lifetime coin figure exists anywhere in
  the save, so there is nothing honest to backfill from; the meter simply starts low. Nobody
  loses a seed they could plant: any seed with `discovered[id] > 0`, or whose old `unlockLevel`
  the save's level had already passed, is marked unlocked free — the grandfather pattern from
  the level-gate migration.

## The sim-test bill

The suite grows with slice A; these are the invariants, most inherited from the audit. Items
1–6 and 8–16 land with slice A; item 7 lands with slice B (Storm-Kissed does not exist before
the launch six ship).

1. The never-resets partition, asserted field by field across a Turn — generated from the rule
   *everything not named in the clears column survives verbatim* — and the Turn ends by
   re-deriving every badge-derived tap field (`tap.power`, `comboMax`, crit) from the wiped
   badges.
2. The Turn kills no running growth timer, in any season; ready blooms auto-collect into
   `coinsEarned` *before* the mint; a plot-parked card pack is banked into `state.packs`.
3. Mint reads `coinsEarned` only; a spend-everything-then-Turn run pouches identically.
4. Cheat grants never reach `coinsEarned` (`credit()` is the single tested faucet).
5. `yield = cost × 1.4` for every seed including Fall's; petals leave the curve alone.
6. Gems/hour flat across all seeds in `DATA.seeds` (Fall crops drop no gems, so the invariant is
   scoped to flowers); no petal changes any gem chance.
7. *(Slice B)* Mutation income share stays in band with Storm-Kissed at cap.
8. Quick Sprout at cap + Sprinklers + Keeper + Seed Rush stays above the 0.3 floor.
9. All open Stand slots regenerate at the Turn with `nextAt = now`, drawing flower lines from
   `seedUnlocks` only.
10. Petal effects reach `passiveIncomeRate()` (offline mirrors online).
11. Unlock prices are charged once per lifetime; the Turn never re-charges one.
12. The windfall pays only when all eight Fall plots are planted and ripe, once per bed fill,
    and a growing Century Bloom neither blocks nor collects it.
13. Migration is idempotent and grants mastery-conversion seeds exactly once.
14. Tally lines read only `state.year.stats`; the summed bonus clamps at `tallyCap`; a
    zero-scored line contributes nothing and renders nothing.
15. `state.year.stats` counters zero at the Turn and never read lifetime records.
16. The blessing writes exactly one Rich Bloom petal, once per Turn.
