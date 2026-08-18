# The Potting Bench

**Status: simulation built 2026-08-16, no surface yet.** The rules, the state and the save all
exist and are covered by `tools/sim-test.js`. The panel and the dock swap are the next commit, so
today the bench runs invisibly — harvests fill its basket and nothing shows it.

Prototyped first as a standalone feel spike at `tools/merge-spike.html`, which is still the fastest
way to try the mechanic and is where the timings below were settled.

**Parked, not rejected — 2026-08-16.** The habitat direction (creatures, the Hollow) arrived before
this got a surface, and the handoff briefly read as though merge had been dropped. **It has not
been.** The owner is explicit that garden → bench → market and the order system are still wanted, and
that what is missing is the right way to fold them in. The simulation below is built and covered by
the suite; it is waiting on a panel and a decision, not on a reprieve.

## What it is

A merge board fed by the garden. A harvest drops one chain item into a **basket**; the player places
it on the bench; three of a kind that end up orthogonally connected merge into the rung above.

It replaces the Apothecary. The two do the same job — turn garden output into goods the Market will
want — and the timed craft bench is the strictly worse version of it: pick a recipe, wait, collect.
Merging is the same transformation done with your hands.

## Why the garden is the point

Every shipped merge game gates its board behind a generator — an energy bar, a timer, a paid tap —
and that generator is the most complained-about part of the genre. Players do not quit merge games
because merging is boring; they quit because the board was full and the energy was gone.

Garden Wonder already has a generator that people enjoy for its own sake. **The garden is the
bench's generator**, which is a position nothing else in the category holds.

## The rule that protects the seed economy

**The bench never outputs a seed or a flower.** Flowers are the input; the chain is a separate
category of thing. A sim-test asserts no chain id collides with a seed id.

Break this and the bench becomes a way to manufacture expensive seeds out of cheap ones, which
routes around the coin sink *and* the level ladder — levels 2–17 grant one seed each, and that is
the entire reward structure of progression.

## The Bloom chain

Six rungs. Each is a distinct silhouette at thumbnail size — teardrop, cluster, cone, handle, ring,
crown — because two items distinguishable only by texture are the same item on a phone.

| Rung | Item | Value | Petals in it |
| --- | --- | --- | --- |
| 1 | Petal | 10 | 1 |
| 2 | Posy | 45 | 3 |
| 3 | Bouquet | 200 | 9 |
| 4 | Flower Basket | 900 | 27 |
| 5 | Wreath | 4,000 | 81 |
| 6 | Flower Crown | 18,000 | 243 |

**The values are placeholders against a Market that does not exist yet.** The *ratio* is the part
that matters: each rung is 4.5× the one below, so merging three beats selling them by 1.5× and the
`raw < crafted < order` chain in [14-economy-model.md](14-economy-model.md) holds at every step. A
sim-test asserts the ratio survives retuning.

## Entry tier — the inversion this design already had once

**What a harvest is worth to the bench scales with the seed, not flat per harvest.**

```
entryTier = seedBucket[seed] + rarityBump[rarity]     capped at the top rung

seedBucket   seeds 1–4 → 0   5–8 → 1   9–12 → 2   13–16 → 3   17–19 → 4
rarityBump   Common +0   Rare +1   Epic +2   Legendary +3
```

A Daisy cycles about 65× faster than an Eternal Crown, so **any** flat per-harvest rate makes
spamming the cheapest seed the best way to feed the bench. That is precisely the gem-faucet
inversion fixed on 2026-08-15 by deriving gem chance from grow time, arriving in a new system. A
sim-test asserts a Daisy cannot out-feed the endgame seed by more than 1.35×.

The rarity term is the good part: the 70/20/8/2 roll that already happens on every harvest now
decides where the bloom lands on the chain, so a Legendary is worth watching rather than being a
number that flashes. Measured in the spike, rarity entry roughly **triples** chain throughput
against Commons only — so `+3` for Legendary is the first number to cut if the bench runs hot.

## Merge rules

- **Merge-3**, orthogonally connected, not stack-on-drop. Merge-3 chews through surplus about 1.6×
  faster than merge-2, which matters when the generator never stops.
- **A run of 5 pays two outputs.** Patience is worth something.
- **Only the item the player just moved can start a merge.** Cascades follow from that one move, so
  the player is always the cause and nothing on the bench ever merges by itself.
- **The survivor sits where the player dropped**, because the group is walked breadth-first from
  the moved cell.

### A cascade is a drum roll, never a lookahead

`benchMergeOnce()` performs **exactly one** merge and returns. A cascade is that called again with a
beat in between, and the caller owns the timing. The bench must never look at six petals and resolve
them straight to a Bouquet — that throws away the two moments the player earned.

Timings settled in the spike, for the UI commit to carry:

| | Value |
| --- | --- |
| Dropped item sits visible before anything merges | 150 ms |
| Pause after the first rung | 300 ms |
| Growth per rung | ×1.32, capped at 900 ms |
| Pop scale per rung | 1.22 → 1.55 |

Each rung takes **longer** than the one below it. A cascade should build like a drum roll; a flat
one blurs into a single event.

## The bench is a fixed 6×6 that never changes size

Cells outside the unlocked square show a padlock — the same language the garden already uses for
plots 5–8. Starts at **4×4** and expands to 5×5 and 6×6 for coins.

A grid that physically grows resizes every item on it, and the board jumping around under a
half-finished drag is the bug the spike found first.

**Board space is the tension, and it is a coin sink the late game badly needs.**

## Two things the spike found that the design would not have

**Spatial merging can deadlock.** A full bench with no three alike adjacent has *no legal move at
all* — a checkerboard of petals and posies reaches that in about forty harvests on a 4×4. Stacking
never had this problem because you could always drop onto a match.

**The escape hatch is banking.** Dragging a bench item off into the basket puts it into
`state.bench.stock`. It unsticks the board, and it is the same gesture a customer at the fence will
eventually collect from — items on the bench are work in progress, banked items are finished stock.
A sim-test builds the deadlock and asserts banking is the way out.

**Harvests land in the basket, never on the bench.** An idle generator running overnight straight
onto a merge board hands the player a full board on open, which is the worst feeling the genre has.
The basket caps at 60.

## Quests

Retiring the Apothecary took three quests with it, worth **98 of the ladder's 777 reputation** — and
`tools/sim-test.js` asserts the ladder reaches level 17, where Eternal Crown unlocks. Dropping them
would also have jammed the quest strip on an uncompletable goal, exactly as the retired sell quests
once did ([16-progression-and-quests.md](16-progression-and-quests.md)).

So they were **repointed, not removed**, keeping their ids and their reputation:

| id | Was | Is now |
| --- | --- | --- |
| `q_tea` | Craft Flower Tea | Merge a Posy — `merge`/`posy` |
| `q_perfume` | Craft Petal Perfume | Merge a Bouquet — `merge`/`bouquet` |
| `q_craft_2` | Craft 2 goods | Bank 5 bench goods — `bank` |

Ids are kept deliberately, against the "never reuse an id" rule in that document. A new id would
orphan any instance sitting in a player's `quests.active`, and an orphaned active quest is the jam
this change exists to avoid. Two new tracks are wired: **`merge`** (keyed by chain id) and **`bank`**.

## State

```js
bench: {
  cells: Array(36),     // null | { tier }
  side: 4,              // unlocked square, side length
  basket: [],           // tier numbers waiting to be placed
  stock: {}             // chain id -> count, banked
}
```

`state.bench` is a nested object, so it gets its **own re-merge in `load()`** — the trap in
[07-save-data.md](07-save-data.md). The backfill is defensive on every field: a rung that no longer
exists is dropped, a `side` outside 1..6 is clamped, and a bogus basket entry is discarded. Three
sim-tests cover a save written before the bench existed and a save containing junk.

## What is not built

- **The panel and the dock swap.** The bench has no surface at all yet. Craft is still the third
  dock tab.
- **Selling or delivering stock.** Banked goods sit in `state.bench.stock` and nothing consumes
  them until the Market ships.
- **Other biomes.** The Bloom chain is the only one. The Tidepool, Hollow and Nightfield chains
  sketched during design are not in `data.js`.
- **Craft's removal.** `CRAFT_RECIPES`, `startCraft()` and `state.craft` are untouched so existing
  saves keep parsing. Only the quests moved.

## Open questions

- Does bench stock sell for coins before the Market exists, or does it just accumulate? Accumulating
  is honest but gives the bench no payoff for weeks.
- Is 6×6 enough once eight plots are automated? The spike says a 4×4 fills in about forty harvests,
  and a fully automated garden does far more than that per hour.
- Should a mutation enter the bench as a gold variant on a parallel chain, as designed, or is that a
  second chain too many for one season?
- Does merging unlock land (the EverMerge move) or does reputation, as the locked design says?
