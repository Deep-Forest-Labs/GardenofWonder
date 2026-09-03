# The Year-One Economy — the retune

**Status: specification 2026-08-29; the ENGINE HALF IS BUILT — phase 1 landed the same day,
and phase 1.1 rebuilt the mint on the owner's cumulative ruling.** Every number below now
lives in `data.js` (`DATA.year`, `DATA.petals`, `DATA.fall`), `Game.credit()` is wired
through every faucet, and sim-test bill items 1–6, 8–17b and 18 are asserted in
`tools/sim-test.js` (item 7 waits for slice B; the suite stands at 1,207). **The surfaces arrived on 2026-08-29 too** — phase 2 (the ceremony, the meter, petals, unlock
prices) and phase 3's first half (the strip and Fall). Every number below is still the engine's;
**no economy knob moved when the surfaces were built**, and the three constants the surfaces added
(`seasonTint`, `seasonTintMax`, `seasonSpan` in `DATA.year`) are visual only and drive nothing but
the palette. See
[03-systems.md](03-systems.md#the-garden-year--the-engine-simulation-only) for the engine as
it exists. The numbers for
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
2. **The mint reads earnings, never balance.** Two accumulators, both written only by
   `Game.credit(amount, { cheat, refund })` and neither ever decremented:
   `state.year.coinsEarned` is this year's earnings and opens the coins gate;
   **`state.lifetimeCoins` never resets and is what sizes the mintable pool.** Every grant —
   taps, harvests, orders, jar sales, quest gold, the offline grant in `reconcile()` — routes
   through the one helper, so both count by construction and no future faucet can silently
   miss either. Spending is seed-neutral, and a sim-test asserts it (buy everything one tick
   before the Turn; the pouch must not change).
3. **Cheated grants are excluded from the mint.** The dev/cheat paths call `credit()` with
   `cheat: true` (and migrations with `refund: true`), skipping **both** accumulators — the
   pool is permanent, so a cheated coin in it would never wash out. Testers keep their
   buttons; the pacing data stays clean.
4. **Gems touch none of this.** No gem → petal path, no gem → unlock path, no per-seed gem skill.

## Unlock prices — where the spread lives

Per-plant costs are unchanged. Each seed from #3 up carries a **one-time unlock price, permanent
across Turns**, paid in gold. Found by simulation: per-plant spreads cannot wall (the ladder
self-finances in ~6 active minutes), so the spread lives here.

```
unlock(3) = 150,000
unlock(n) = 150,000 × 1.5^(n−3)      // DATA.year.unlockBase, DATA.year.unlockRatio
```

| Seed | Unlock | Seed | Unlock |
| --- | --- | --- | --- |
| 1 Daisy | free | 11 Moonflower | ~3.8M |
| 2 Tulip | free | 13 Aurora Bloom | ~8.7M |
| 3 Bluebell | 150K | 15 Nebula Orchid | ~19.5M |
| 5 Rose | ~338K | 17 Aurora Crown | ~43.8M |
| 7 Marigold | ~759K | 19 Eternal Crown | ~98.5M |
| 9 Sun Lotus | ~1.7M | | |

**The ratio was ×1.6 for one day and the full-model simulation (2026-08-29) failed it:** because
gold resets at the Turn, a 277M top unlock must be earned *inside a single year* against
~30–40M/day late income — seeds 15–19 became 5–11-day grind-years and all nineteen landed on day
~67, double the target. At **×1.5** (seed 19 ≈ 98.5M) the sim lands all nineteen at ~day 46, and
the knobs interact: **tune the unlock ratio *last*, after petal pricing** — with petals repriced
(below), ~×1.45 may be needed to hit the day-25–40 window. Phase 4's job. What survives
unchanged: first Turn on day ~2.7–3.3, the first wall reading as "six times everything I've
earned," and deliberately-long walls arriving naturally from Turn 6+ where veterans expect them.
*(Phase 1's own pacing tool lands the year-one figure **near, but not reliably inside**, this
band once its model buys the game's automation. Three runs of 370K / 409K / 312K were quoted at
first; **a 120-run sample is the honest picture — median ~355K, quartiles 309–386K, only about a
quarter inside 370–410K, with a long tail above it.** The three-run sample was too small to
characterise the spread and the claim it supported has been withdrawn. The tool also lands the
**first Turn at day ~1.75–1.9**, earlier than 2.7–3.3. The remaining gap is turn-policy
sensitivity: the tool's casual player turns when the next wall is more than ~1.2 days of income
away, and doc 33's band sits inside the measured envelope of that knob. Catalogued in the
2026-08-29 entries of [10-decision-log.md](10-decision-log.md); re-baselining against a real
playtest is phase 4's.)*
The same sim confirmed **skipping unlocks is strictly dominated** (saving for seed 10 directly
reaches it eight days *later* than climbing), so the sequence needs no enforcement.

**Levels stop gating seeds.** `unlockLevel` on seeds retires; the two-stage gate becomes
*unlock price once, afford the plant price always*. Plots, habitat slots and meadow cells keep
their lifetime-level gates. The level ladder's freed rewards are re-authored below.

## Saved Seeds — the mint

**The mint is CUMULATIVE — the owner's ruling, 2026-08-29.** The whole pool a garden will
ever mint is sized by **lifetime** earnings; a Turn draws whatever part of that pool has not
been drawn yet, and the Tally multiplies the draw on the way out without consuming it.

```
totalMintable = DATA.year.mintK × sqrt(state.lifetimeCoins)   // the pool, ever
increment     = totalMintable − state.mintedBase              // what is left to draw
pouch         = round( increment × tally )                    // tally ∈ [1.0, tallyCap]
at the Turn:    state.mintedBase += increment                 // the UN-TALLIED increment

mintK = 0.1   minSeeds = 10   minCoins = 100,000   tallyCap = 2.0   // DATA.year
```

`state.lifetimeCoins` and `state.mintedBase` are **top-level and never reset** — not by the
Turn, not by anything. `lifetimeCoins` is fed by `Game.credit()` beside `year.coinsEarned`
and skips the same cheated and refunded grants; `mintedBase` moves only at the Turn, and only
by the **un-tallied** increment, so a well-played year's fireworks are a gift rather than a
loan against its own future seeds.

**The Turn requires both gates: the un-tallied `increment` ≥ `minSeeds` AND `coinsEarned` ≥
`minCoins`.** The seeds gate reads the increment rather than the pouch because the increment
is what the Turn actually spends from the pool — gating the tallied number would let a good
year's Tally buy entry to a Turn the pool cannot pay for. The coins floor is unchanged and
still keeps a year from being cashed in the hour it started.

**`DATA.year.veterancy` is deleted.** Not capped — deleted. The phase-1 review measured that
re-attaching *any* per-turn multiplier to a split-neutral base re-arms the split at 1.3–1.4×;
a term that rewards turn count is the exploit, whatever its size.

### Why cumulative, and what it bought

The shape before this ruling was `mintK × sqrt(coinsEarnedThisYear) × (1 + veterancy ×
turnsCompleted)`, and it was **strictly profitable to split the year**: four 100K years minted
~2.6× one 400K year, veterancy compounded on top, and Fall beds laundered the doomed pre-Turn
wallet. Measured through the real engine, a player who played normally but turned at every
100K gate minted **~20× the Saved Seeds** of one who rode the year to its wall.

Cumulative kills that **by construction** rather than by tuning: the pool depends on lifetime
earnings alone, so the sum of every Turn's draw is the same number however the year is sliced.
Measured over 12 modelled days after the change (`node tools/year-sim.js 12 all`, which now
**exits zero**):

| Day 10 | lifetime coins | Saved Seeds minted | Turns |
| --- | --- | --- | --- |
| casual (rides to the wall) | ~29–35M | ~880–960 | 4–6 |
| smart (turns at every gate) | ~14–24M | ~436–553 (median ~508) | 25–28 |
| rush (daisy-only probe) | ~1.5–1.7M | ~150–170 | 9–10 |

*(Ranges over a 30-run sample. The model is stochastic and `smart` is the widest cell; earlier
editions of this table quoted three-run brackets that a larger sample falls outside — the
direction is what is robust here, not the digits. **The tool's exit code, not this table, is the
regression test.**)*

Normal play wins on both currencies, by a **median ~1.9× margin on seeds (range ~1.5–2.2×
over 30 runs)**, and the Tally graduates from garnish to the economic teacher: a maxed year mints ×2.0 where a
spam year manages ~×1.0–1.2, and the multiplier is pure upside because it never touches the
ledger. **The first Turn is unchanged** — a first year *is* the lifetime, so it still pays
~60–65 base seeds on a ~370–410K year.

*(Re-measured 2026-08-29 after the same day's Fall fixes, which corrected `year-sim`'s
`bestFallCrop` — it had been taking the last affordable crop in array order and so planted
wheat forever, which is off the 1.4×/hour curve. Handing the adversary the **better** crop
makes it a stronger opponent, and the margin **widened** rather than narrowing: the verdict
still exits zero. Earlier in the day, against the weaker adversary, the same table read
832–967 against 563–610 for a ~1.5–1.6× margin.)*

> **THE COST OF THE SHAPE, MEASURED — two consequences for phase 4's tuning chair, neither of
> them a reason to keep the old mint.** The review named the first in advance; the second was
> found while landing this patch.
>
> 1. **The lifetime seed supply is now hard-bounded at `0.1 × sqrt(lifetime coins)`**, where
>    before it grew without limit through veterancy. The shared-skill sink below — 636,378
>    Saved Seeds — needs **4.05 × 10¹³ lifetime coins**, about a million days at the measured
>    late income of ~40M/day. A year of play at that income opens a pool of ~12,000 seeds.
>    The sink is therefore not "months of headroom" any more; it is unreachable, and
>    **"every Turn affords a similar 2–5 petals forever" is false at these constants** — the
>    shipped tool measures 1 of 5 Turns in band against 4 of 7 before. The pair of exponents
>    this document says must be tuned together (petal cost 1.25/level against the pouch's
>    growth) is now genuinely mismatched. **`mintK` is the knob, and it is phase 4's** — the
>    ruling was about the mint's *shape*, and re-pricing it against the petal ladder is a
>    separate decision that wants playtest data.
> 2. **The blessing is now the largest per-Turn grant in the game, and nothing prices it.**
>    One free Rich Bloom petal per Turn is a per-turn *constant* sitting on a split-neutral
>    base — the same family the review warned about, in a currency the mint does not control.
>    Driven through the real engine: **95 Turns fill every flower's Rich Bloom ladder — all
>    318,189 Saved Seeds of it, exactly half this sink — for ~101M lifetime coins, about 2.5
>    days of play**, while the mint pays 997 seeds over the same span. It is pre-existing and
>    the old mint had it too; what changed is that the mint no longer dwarfs it. Logged as
>    the open decision in [11-known-issues.md](11-known-issues.md); `year-sim` discloses the
>    blessed column beside the bought one rather than failing on it, because the exit code
>    answers the question the owner ruled on.

**Plots 5–8 cannot be bought in year one** — `turnsCompleted ≥ 1` joins their existing level
gates, so the first year is played on four plots and **Turn 1's gift grows: Fall, and the right
to a bigger garden.** The sim demanded this too: at 9.4K for four plots that double income, year
one earned ~800K and broke the documented pacing; gated, it earns **~370–410K by the
2026-08-29 design-session model. Phase 1's shipped pacing tool puts the median nearby but lower
(~355K over 120 runs, quartiles 309–386K) with wide spread**, so treat the band as the design
target rather than a reproduced measurement until phase 4 re-baselines it against a real
playtest.

A migrated save keeps whatever plots it already opened for its
current year — nothing a player owns is ever re-locked.

First Turn pays **~60–65 base seeds on that ~370–410K first year**, times a modest first-year
tally. The blessing grants **one free petal** on a chosen flower, outside the pouch.

### The Tally

The owner's arcade-scoring beat, 2026-08-29: after the base count-up, the year's achievements
land one line at a time, each adding to a bonus that multiplies the base, **summed then capped at
`tallyCap` (×2.0)**. Lines are data (`DATA.year.tally`), each reading a **year-scoped counter in
`state.year.stats`** — never a lifetime record, never anything spendable. **A line the year
scored zero on does not appear**; the Tally only celebrates.

**Tier bonuses within a line ACCUMULATE — ratified by the phase-1 review, 2026-08-29,** because
it is arithmetic rather than taste: only the cumulative reading reproduces this document's own
worked example and reaches its own cap. 47 orders pays tier 1 and tier 2 together, +25% — which is exactly doc 32's own
"Orders filled: 47" example (doc 32 now renders that line as "+25%!", the same bonus) — a maxed year sums to +138% and genuinely hits the ×2.0
cap, and a typical mid-game year lands the quoted ~×1.35. The alternative reading
(highest-tier-only) caps out at ×1.69 and can never reach the cap this document says a maxed
year hits, so cumulative is what `projectedTally()` implements. A line whose counter is below
its first tier is not rendered and adds nothing — that is what "scored zero" means in code.

| Line | Counter | Tier 1 | Tier 2 | Tier 3 |
| --- | --- | --- | --- | --- |
| Orders filled | `stats.orders` | 10 → +10% | 25 → +15% | 50 → +25% |
| Full-bed windfalls | `stats.windfalls` | 3 → +5% | 8 → +10% | 15 → +15% |
| Species grown this year | `stats.species` | 5 → +5% | 10 → +8% | 15 → +12% |
| Legendary blooms | `stats.legendaries` | 1 → +5% | 3 → +8% | 8 → +12% |
| Best combo | `stats.bestCombo` | 50 → +3% | 80 → +5% | — |

A typical mid-game year lands ~×1.35; a maxed year hits the ×2.0 cap — and the full-model sim
verified the balance: a player who maxes the Tally every year reaches the endgame **18% faster**
than one who ignores it entirely, which is exactly the "optional but delightful" band (past ~35%
it would read as mandatory). `mintK` is the counter-knob if playtest tallies run hot — the Tally redistributes the pouch toward playing *well and
variedly*; it must never be the difference between progressing and not. The tiers rotate effect
categories deliberately: demand (orders), Fall's ritual (windfalls), breadth (species), luck
celebrated (legendaries), and the tap loop (combo). The two growth exponents that must stay matched:
petal costs compound at 1.25/level while the pouch grows with `sqrt(lifetime)`. ~~**every Turn
affords a similar 2–5 petals forever**~~ — **this no longer holds, and knowingly so.** Under
the cumulative mint the shipped tool measures 1 of 5 Turns inside the 2–5 band where the old
shape measured 4 of 7; the pouch's growth is now sublinear in lifetime earnings while petal
costs still compound at 1.25/level, so the two exponents are genuinely mismatched. These two
knobs are still the pacing dials and still tune together or not at all — **re-matching them is
phase 4's, and `mintK` is the knob.**

Sink runway, **recomputed from the shipped constants (2026-08-29, phase 1) rather than from the
design session's estimate**: maxing both shared skills on all nineteen flowers costs
**636,378 Saved Seeds** — that is the entire sink reachable in phase 1, since `buyPetal()`
refuses signatures until slice B. (A full total including signatures cannot be computed from
`data.js` at all — it carries `signatureMult` but no signature petal counts, so any total
depends on an assumption about how many petals each signature gets; doc 33's own launch-six
table gives four of the six fewer than three. The number to trust, and the one a sim-test
pins, is the 636,378 above. The
design session's ~525K and ~679K were estimates from before the values landed; a sim-test now
pins the 636K figure so the docs and the data cannot drift apart again — doc 33's own preamble
asks for exactly that.) ~~Against ~1.8K/day at the endgame faucet that is months of headroom
before any deep petal.~~ **Recomputed under the cumulative mint: the sink is unreachable, not
merely deep.** The pool is `0.1 × sqrt(lifetime)` forever, so 636,378 seeds needs
**4.05 × 10¹³ lifetime coins** — about a million days at the measured ~40M/day late income,
where a whole year of play at that income opens ~12,000 seeds. Half of the sink (the 318,189
of Rich Bloom) is meanwhile given away free by the blessing in 95 Turns; see the boxed note in
[the mint](#saved-seeds--the-mint) and the open decision in
[11-known-issues.md](11-known-issues.md). Both are `mintK`-and-petal-price questions for phase
4, not reasons to restore a splittable mint.

## Petals — prices and effects

```
petalCost(seed n, petal p) = round( 15 × 1.45^(n−1) × 1.25^(p−1) )     // shared skills
signature petals cost ×0.6 of the same formula
```

Daisy's first petal: 15 seeds. Seed 10's first: ~425. Seed 19's first: ~12K. Purchases still
migrate up the ladder — early petals on new flowers stay the best value — but the whole catalog
is priced to outlast the faucet. **The launch values (base 5, ×1.3/seed) failed the full-model
sim on both pacing checks:** turns paid 7–10 petals instead of 2–5, and the entire sink was
consumed by **day ~56, at which point Turns stop paying for anything and the prestige loop
dies.** At base 15 / ×1.45 the sim centres the 2–5 band and the sink (**636,378 seeds**, the whole shared-skill
ladder as shipped — see the recomputation above) is still uncleared at day 180 — the Turn button stays alive for months, which is the whole point.

| Skill | Petals | Effect per petal | Guardrail |
| --- | --- | --- | --- |
| **Rich Bloom** (all flowers) | 5 | +30% harvest value, additive per petal (+150% at cap) | Applied as `petalMult` at harvest and in `passiveIncomeRate()`, same commit; never edits `seed.yield` |
| **Quick Sprout** (all flowers) | 5 | −6% grow time, additive (−30% at cap) | Combined stack clamped at the 0.3 floor in `plantGrowth()`, asserted — at cap in that stack the clamp binds |
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

Year one's quest ladder keeps its 789 total and its tutorial role, **but four quests collide
with the unlock walls and must be re-keyed in slice A**: `q_peony_3` and `q_marigold_3` name
seeds genuinely unreachable in year one, and `q_lavender_3` and `q_rose_3` are marginal at the
gated ~370–410K (the sim reaches lavender only on a perfect year) — all four re-key, because a
quest that *sometimes* jams is the same bug on a timer — left
alone they are the documented strip-jam (the sell-quest failure, third time around). Re-key each
to a seeds-1–3 or verb-agnostic goal at the same reputation, the established stand-in pattern,
and hold the total at 789. **Done in phase 1:** the four are `paused: true` with stand-ins
directly under each — `q_daisy_15` (20), `q_tulip_8` (22), `q_harvest_30` (42), `q_plant_30`
(46) — and a sim-test holds the live ladder at 789. The keyed discover quests
(`q_discover_5/8/12`) stay live on purpose: `discovered` is lifetime and quests survive the
Turn, so they resolve across years rather than jamming forever — but `q_discover_5` will sit
in a slot from mid-year-one until year two's rose unlock, which is worth an eye at the first
playtest. **The playtest happened, and the eye was the owner's (2026-09-03).** It was worse than
this line predicted: `q_discover_5` was dealt about four minutes in, not mid-year, so it held a
slot for ~1.8 years of a garden's whole income. The answer was a `needSeeds` gate on all three
rungs — dealt only once the player owns `qty − 1` seeds — plus a new `q_discover_3` rung at the
Bluebell wall, which is what moved the ladder to 789. See
[16-progression-and-quests.md](16-progression-and-quests.md#gating-a-quest). The four meadow-dependent quests (`q_hive_1`, `q_honey_3/8/15`,
114 rep) stay live because the meadow stays reachable ~~from Summer's edge~~ from day one.
**Corrected 2026-08-29 while building phase 3: the meadow is not on Summer's edge.** Its only door
is the map's dive — `UI.enterMeadow()` has exactly one caller in the repo, `ui-map.js:257`, the same
correction doc 32 carries. These four are live today *because the map is*, so retiring the map
without first giving the meadow a door takes **114 rep out of a 789-rep ladder** as well as
stranding the room. The re-check this line asks for is therefore due now, not later — see
[11-known-issues.md](11-known-issues.md).

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

**The windfall rule** (`DATA.fall.windfall = 0.5`): harvesting a Fall bed whose **every
windfall-eligible plot is planted and ripe** pays **+50% on the whole bed** — all of them, so a
single-strawberry board cannot fish for it; the fill ends when its last marked plot is
collected, not when the bed empties. A plot
holding the Century Bloom stands outside the bed's count (it neither blocks nor collects the
windfall), so "all eight" means all eight *unless one of them is the fortnight plant*. One knob, one legible rule,
and it is what makes Fall an appointment rather than a chore. Fall plants gate on gold prices
only in v1 — no unlock walls inside Fall until its list grows.

**Crops are not flowers** ([32-the-garden-year.md](32-the-garden-year.md#falls-board-specified)):
no rarity, no mutations, no gem drops, never written to `discovered`; they count generic
`harvest` quest tracks.

**A measured caution on Fall's ceiling:** the sim has Fall competitive when it opens (~0.6× of
Summer's rate, windfall play ×2.75 over lazy harvesting — both as designed) but **fading to
~0.2× by the time Summer's ladder reaches its teens**, because the crop list is fixed while
Summer scales. Partly intended — Winter takes the long-clock baton at Turn ~3 — but if playtest
shows Fall dead by Turn 6, the remedy is a `DATA.fall.scale` yield knob tuned in phase 4.
**Letting crops roll rarity was considered and rejected**: it reverses "crops are not flowers"
for a tuning problem one knob can solve. `DATA.fall = { windfall, plants: […] }` is **wholly separate from
`DATA.seeds`** — appending crops to the seed array would drag them through rarity, gems,
mutations, verbs and the Almanac. `state.fall.grid` mirrors the main grid's cell shape minus the
mutation and pack fields.

**The showpiece:** one ultra-long plant, the **Century Bloom** — cost and payout enormous, grow
time **14 days**, survives every Turn (a running long timer is never killed), blooms once with
the game's loudest celebration short of a Wonder. **Ships in slice A with Fall** (owner-confirmed
2026-08-29); plantable in a Fall plot, excluded from the bed-ripeness math so it never parks the
windfall, one growing at a time. Numbers deliberately absurd and data-tagged. **Phase 1 shipped
it at cost 2M / yield 2.8M** — the 1.4× curve held on purpose so the wall never comes from a
worse ratio, the absurdity carried by scale and the fortnight; retune freely in phase 4.

Winter's list follows below — authored in slice C, 2026-09-01.

## Winter content

**Six plants, 12–48 hour clocks, `yield = cost × 1.4` throughout**, from real winter bloomers —
the flowers that actually open in snow, which is also where Holly comes from:

| Plant | Cost | Grow | Yield | Gold/hour | Notes |
| --- | --- | --- | --- | --- | --- |
| Snowdrop | 2,500 | 12 h | 3,500 | 292 | Winter's tutorial plant, and the floor |
| Winter Jasmine | 6,000 | 16 h | 8,400 | 525 | Flowers on bare twigs |
| Cyclamen | 14,000 | 20 h | 19,600 | 980 | |
| Paperwhite | 30,000 | 24 h | 42,000 | 1,750 | The one-day anchor |
| Witch Hazel | 70,000 | 36 h | 98,000 | 2,722 | |
| Camellia | 160,000 | 48 h | 224,000 | 4,667 | The two-day hold |

**PROVISIONAL, all of it** — typed from [46-the-night-shift.md](46-the-night-shift.md) verbatim and
measured before it is called final. One knob each in `DATA.winter`, remote-config-ready, exactly as
`DATA.fall` is.

**The snowfall rule** (`DATA.winter.snowfall = 0.5`): a plant that **opened while the bed was tucked
in** is *kept*, and pays **+50%** when it is collected. Fall has the windfall; Winter has the
snowfall, one bonus grammar met twice. The mechanic is in
[03-systems.md](03-systems.md) and the lifecycle in [46-the-night-shift.md](46-the-night-shift.md);
what belongs here is the pricing.

**The clock floor is 12 hours**, which is this document's own 12–48h band. "Plant at dinner, ready
at breakfast" has to still hold at the bottom rung, and an entry any shorter sits on Fall's apple
clock — the overnight anchor — and dominates it.

**Winter prices below Fall per hour at any clock the two seasons share.** The tuck's convenience is
paid for in rate: Fall runs 7,000–9,240 gold an hour across its whole list, and Winter runs 292 at
the bottom to 4,667 at the top. At these values the two share no clock length at all — Fall's
longest ordinary clock is the apple at 8h — so the constraint holds with room, and a sim-test
asserts it against every pair rather than against the values that happen to be here today.

**Guardrail one, asserted rather than hoped:** a single full kept night must not clear both Turn
gates on its own at Turns 3–6. The gates are `minCoins` 100,000 and the `minSeeds` 10 increment, and
every extra Turn pays the blessing — the one per-Turn faucet nothing prices. Winter's cost ladder is
tuned under this constraint and `tools/year-sim.js` asserts it by exit code.

**Guardrail two, the Turn vault, named and accepted:** ripe Winter crosses the Turn and pays into
the new year, so holding a ripe bed through a Turn is good play — a bounded vault of at most eight ×
top cost × 2.1 into a fresh purse. It is **accepted as cosy planning, not an exploit**, its size is a
stated tuning input, and if live play shows it distorting the Turn the ready answer is the Preserve's
grammar ([41-the-preserve.md](41-the-preserve.md)), not a clamp.

**Winter plants are outside every flower system**, Fall's precedent extended one step further: no
rarity, no mutations, no gem drops, never written to `discovered`, no pantry, no Stand — and,
unlike Fall's windfall, **no `state.year.stats` counter either**. Winter is the quiet season. They
count generic `harvest` quest tracks and nothing else, and they never enter `passiveIncomeRate()`.
`DATA.winter = { plots, snowfall, plants: […] }` is wholly separate from `DATA.seeds` for the same
reason `DATA.fall` is.

**Winter plant ids are append-only once shipped** — never renamed, never removed. The load path
drops an unknown id to an empty cell, and a season that advertises two-day holds would otherwise
silently delete a bloom somebody was saving.

**And a note for whoever builds the seed curtain** (ruled 2026-09-02, the day after Winter shipped):
the curtain is `DATA.seeds`' and it says "the same grammar in picker and Almanac" — but **Winter's
picker is not that picker.** `renderWinterPlants()` is its own panel over `DATA.winter.plants`, and
Winter plants have no unlock ladder at all: they gate on gold and nothing else, exactly as Fall's
crops do. A curtain built generically over "the picker" would hide rows behind a wall that does not
exist, and `???` on a row a player can already afford is the one thing that ruling's own law
forbids. Fall's picker is in the same position.

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
  `year { number, coinsEarned, turnsCompleted }`, **`lifetimeCoins`**, **`mintedBase`**,
  `savedSeeds`, `petals { seedId: { rich, quick, sig } }`, `seedUnlocks { seedId: true }`,
  `fall { grid, … }`, `blessed`.
- **Existing saves enter the Year mid-flight:** the current garden becomes year one in
  progress, and `coinsEarned` **starts at zero** — no lifetime coin figure exists anywhere in
  the save, so there is nothing honest to backfill from; the meter simply starts low. **A save
  that already has a `year` but no ledgers** (anything written by phase 1, the owner's own
  included) takes `lifetimeCoins` from the `year.coinsEarned` it is standing in and
  `mintedBase = 0`, so that year is drawn exactly once — the same pouch the old formula would
  have paid it at zero Turns, and never again. Nobody
  loses a seed they could plant: any seed with `discovered[id] > 0`, or whose old `unlockLevel`
  the save's level had already passed, is marked unlocked free — the grandfather pattern from
  the level-gate migration.

## The sim-test bill

The suite grows with slice A; these are the invariants, most inherited from the audit. Items
1–6, 8–17b and 18 land with slice A; item 7 lands with slice B (Storm-Kissed does not exist before
the launch six ship).

1. The never-resets partition, asserted field by field across a Turn — generated from the rule
   *everything not named in the clears column survives verbatim* — and the Turn ends by
   re-deriving every badge-derived tap field (`tap.power`, `comboMax`, crit) from the wiped
   badges.
   - **1b** — the same partition again on a Turn whose in-flight arm actually runs (auto-collect
     and pack-banking happen *before* the mint and touch the save, so a wipe inside them is
     invisible to a sweep that keeps that arm inert).
   - **1c** *(added 2026-08-30)* — **no power-up faucet is re-earnable by Turning.** Every faucet the
     data declares — the opening bag, the quest ladder, the daily, the level rungs, the Almanac — is
     seeded as already-paid, put through a real Turn, and then re-attempted; the re-attempt must be
     refused. It also asserts the shape of the curve (rich to level 8, tapering after), that every
     booster id any table hands out resolves, and that no faucet stacks copies of a long booster.
2. The Turn kills no running growth timer, in any season; ready blooms auto-collect into
   `coinsEarned` *before* the mint; a plot-parked card pack is banked into `state.packs`.
3. Mint reads earnings only; a spend-everything-then-Turn run pouches identically.
4. Cheat grants never reach `coinsEarned` **or `lifetimeCoins`** (`credit()` is the single
   tested faucet).
5. `yield = cost × 1.4` for every seed including Fall's; petals leave the curve alone.
6. Gems/hour flat across all seeds in `DATA.seeds` (Fall crops drop no gems, so the invariant is
   scoped to flowers); no petal changes any gem chance.
7. *(Slice B)* Mutation income share stays in band with Storm-Kissed at cap.
8. Quick Sprout at cap + Sprinklers + Keeper + Seed Rush is **clamped at** the 0.3 floor in
   `plantGrowth()` — the stack multiplies to 0.294 and the clamp binds, so the last petal
   delivers about three quarters of its advertised effect. Asserted as the clamp, not as a
   bound the skill sits inside (phase 4 owns which of the two it should be).
9. All open Stand slots regenerate at the Turn with `nextAt = now`, drawing flower lines from
   `seedUnlocks` only.
10. Petal effects reach `passiveIncomeRate()` (offline mirrors online).
11. Unlock prices are charged once per lifetime; the Turn never re-charges one.
12. The windfall pays only when every windfall-eligible Fall plot is planted and ripe, once per bed fill,
    and a growing Century Bloom neither blocks nor collects it.
13. Migration is idempotent and grants mastery-conversion seeds exactly once.
14. Tally lines read only `state.year.stats`; the summed bonus clamps at `tallyCap`; a
    zero-scored line contributes nothing and renders nothing.
15. `state.year.stats` counters zero at the Turn and never read lifetime records.
16. The blessing writes exactly one Rich Bloom petal, once per Turn.
17. The Turn refuses below either gate — the un-tallied `increment` against `minSeeds`, or
    `minCoins` earned — including the case where a maxed Tally would lift a short increment
    over the seeds gate; and the daisy-rush shape (many cheap Turns in one day) stays
    unprofitable against normal play. **Asserted and green since the cumulative mint landed
    (2026-08-29, phase 1.1); `node tools/year-sim.js 12 all` exits zero.**
17b. **The cumulative mint itself** (added with the ruling): `veterancy` is absent from
    `DATA.year` and turn count moves no part of the projection; the pool is
    `mintK × sqrt(lifetimeCoins)` and is unmoved by the year's own earnings or by the wallet;
    four Turns draw exactly the pool one Turn draws over the same lifetime; a drawn pool
    refuses a fresh 100K year and re-opens only after another `minSeeds` of pool is earned; a
    maxed Tally pays over the pool rather than out of it; cheats reach neither ledger; both
    migration arms land where they should; and a ledger past the pool clamps the increment at
    zero rather than going negative.
18. Plots 5–8 refuse purchase while `turnsCompleted = 0`, except on a migrated save that already
    owned them — nothing owned is ever re-locked.
