# Prestige Directions — five systems, priced

**Status: analysis, 2026-08-26 — partly superseded 2026-08-29.** The owner chose a concrete
mechanism three days later: **per-seed permanent upgrade trees**, which is idea 2 (Seed Saving)
arrived at independently in authored rather than generated form, on idea 1's chassis. The current
design is now **[32-the-garden-year.md](32-the-garden-year.md)** (via
[31-per-seed-prestige.md](31-per-seed-prestige.md)); this document remains the record of the
option space and the two structural problems, both of which doc 31 inherits and resolves. Doc 32
supersedes two of this document's mechanisms: the season-aging growth slowdown is now visual only,
and the lifetime-vs-season level split is retired — nothing re-locks.

The original framing: the owner's pivot — focus on **the garden as
is**, and design a real incremental-idle prestige system — restart (or restart halfway), earn a
currency, spend it on permanent points that make the next run faster. Rethinking coins, upgrades,
and possibly the level system is on the table.

**Naming what this pivot is:** this is **direction D from
[29-direction-and-odds.md](29-direction-and-odds.md) — the incremental-depth reposition — executed.**
It was priced at 35% base / 10% breakout, second-best of the four, with a channel that demonstrably
converts (Magic Research: ~$400K in twelve months from essentially two posts on
r/incremental_games). Focusing on the garden **parks the map, the Stand, the meadow and the bench**
— parks, not deletes; ideas 3 and 5 below show where they come back. The Shared Sky
(direction C) is not abandoned either: it and prestige are both *"the world has a clock and you play
against it"*, and they compose.

Doc 17's prestige section ([17-market-and-positioning.md](17-market-and-positioning.md#prestige))
stands and is assumed throughout: sublinear payout on lifetime earnings, **never the word "reset"**,
seasonal framing, permaslot-style authorship, offer it when progress slows to 10–20% of peak.

---

## Two structural problems, found before the ideas

Any of the five ideas dies on these if they are not solved first. Both are solvable.

### 1. The economy is bounded, and a bounded economy cannot prestige

Measured from `data.js`, not estimated: seed costs span **2,000× over 19 tiers — ×1.53 per tier**
— and once badges cap, endgame income is **flat at ~1.48M coins/hour forever** (Eternal Crown,
51.28 net/s × 8 plots).

Cookie Clicker and AdCap prestige works because income and costs are *exponential*: a run
decelerates smoothly, and lifetime earnings grow superlinearly across runs, so each prestige pays
more than the last. Garden Wonder's curve **flattens into a wall instead of decelerating**, and
lifetime earnings past the wall grow *linearly*. Consequences:

- The "prestige when progress slows to 10–20% of peak" heuristic never fires — progress goes from
  fine to zero.
- A prestige currency priced on lifetime earnings pays **the same amount per hour forever**, so run
  two feels identical to run nine. The loop stalls on arrival.

**Two ways out**, and the recommendation uses the second:

- **(a) Reshape the economy to exponential** — steepen tier ratios, uncap badges behind softcaps.
  The genre-standard fix; it works, and it drags every number in the game with it.
- **(b) Make the *season* decelerate instead of the *costs*.** The run slows because the season
  ages, not because the numbers ran out — see idea 1. This is cheaper, it is cosy-native, and it
  makes prestige timing *legible in the art* rather than in a derivative.

Either way the retune (audit item 5) is now **downstream of this document**, which is the order the
audit predicted.

### 2. The one-number rule meets prestige, and one of them must bend

Reputation is the spine: one track, earned never spent, level as its display, levels 2–17 granting
the seed ladder. **If reputation never resets, nothing re-locks, and a "fresh start" starts with all
nineteen seeds unlocked** — no ladder to reclimb, which is the entire pleasure of a prestige run.
If reputation resets instead, the Stand's payouts, the land gates and the whole meta lose their
floor, and "earned never spent, never lost" — the rule that made it trustworthy — breaks.

**Recommended resolution: split what the number displays, not the number.**

- **Lifetime reputation** never resets. It remains the meta-track — gating land, creatures kept,
  permanent features, and (idea 3) later gardens. The Stand keeps paying into it untouched.
- **The season's level** is derived from *reputation earned this season* and is what gates the
  seed ladder. Turning the year starts the season count at zero; lifetime keeps climbing.

One field added, no second currency, quests and the Stand unchanged. The level pip becomes "level
this season," which is also what makes level-ups grantable again — the audit's "no vertebrae past
17" problem dissolves, because the ladder is *reclimbed*, not extended.

### What never resets, proposed as a standing rule

Creatures, the Hollow and everything in it · lifetime Almanac records (discovered, best rarity) ·
cards and packs · gems · mementos and decorations · lifetime reputation. **Resets:** coins, planted
plots, badges (they are the pacing), plot unlocks above the starting four, boost inventory, season
level. **Bloom Mastery resets** and is the strongest argument yet for the audit's cap: a bounded
ladder can convert to a permanent bonus at season's end; an endless one can only be confiscated.

A creature or a card taken away at the turn of a season is the one mistake this audience will not
forgive twice. Sim-test material, all of it.

---

## The five ideas

Probabilities use the same thresholds as [29-direction-and-odds.md](29-direction-and-odds.md):
**base** = $3–5K/month sustained; **breakout** = >$20K/month. All are conditional on competent
execution in the garden-only scope, and all assume the two problems above are solved as recommended.

### 1. The Turning Year — the season ages, and turning it is the prestige

**The chassis. The genre-standard full prestige, with one mechanic that makes it this game's own.**

A run is a **year**. It opens in spring; as it ages the light warms, the palette shifts, and —
the load-bearing part — **growth slows as the season ripens into autumn**. Late-autumn growth at,
say, 40% is the smooth deceleration the bounded economy cannot produce on its own (problem 1b),
and it is *visible in the sky and the leaves* rather than in a spreadsheet: the game literally
looks like it is time to turn the year. Turning it clears the garden — because that is what gardens
do — pays the prestige currency, and spring returns at full speed with the permanent bonuses
applied.

- **Currency:** earned on the turn, sublinear on the season's harvest value (square root — the doc
  17 guidance for a frequent event; a year should turn every few days early on, stretching later).
- **Spend:** a permanent upgrade bed — see the naming below — bought between seasons.
- **Cosy compliance:** the slowdown is on one axis (growth), visible, and reversible by the turn —
  it passes the same test the sleeping face passes. The turn is **invited, never forced**: autumn
  makes it obviously right, and a player who wants to sit in a slow golden garden may.
- **Weakness:** it is the proven shape, which means it is the *expected* shape — on its own it
  differentiates nothing. That is what idea 2 is for.

**The naming does design work: the permanent upgrades are Perennials.** Plants that come back every
year. The prestige tree is literally a bed at the edge of the garden where perennials survive the
turning of the year — the metaphor explains persistence, placement and pruning without a tutorial
sentence.

| Base | Breakout |
| --- | --- |
| **40%** | **12%** |

### 2. Seed Saving — the prestige currency is a seed you bred

**The differentiator. Instead of abstract points, the thing that survives the year is an heirloom.**

At the turn of the year you **save seeds** from what you actually grew: the game mints one (later
more) **Heirloom Seed** — a hybrid whose properties are *inherited from your season*. Grew mostly
moonflower under storms? The heirloom leans night-yield and mutation-catch. Ran a Nurse/Beacon
adjacency garden? It inherits a weakened copy of a verb. Next spring it is plantable from plot one:
a seed that does not exist in anyone else's game, because it is a record of how you played.

- This is **seed saving**, a real and beloved gardening practice — the fantasy writes itself, and
  it is the breeding system the owner already wants
  ([HANDOFF.md](HANDOFF.md), flower breeding, "the second half of the direction") arriving as the
  prestige payout rather than as a separate feature.
- It converts the permanent-upgrade *tree* into a permanent-upgrade *lineage* — your heirloom bed
  fills with your own cultivars, which is a collection, which is the audience's #1 motivation.
- It composes with idea 1: the Turning Year is *when*, Seed Saving is *what you get*.
- **Weakness, stated honestly:** generated-content currency is far harder to balance than points —
  inherited properties multiply against verbs, mutations, mastery and creatures, and the sim-test
  suite would need to grow a whole property-budget harness (the `pool` discipline from creature
  traits, applied to generated seeds). Higher variance in both directions; this is where the
  breakout upside lives.

| Base | Breakout |
| --- | --- |
| **35%** | **15%** |

### 3. The Gardens Ladder — each prestige climbs to a new garden

**The Egg Inc shape: prestige as ascent, not repetition.** Doc 25 already records what it proves —
Egg Inc's "many farms" are *sequential*, never parallel. Turning the year does not replay the same
garden; it moves you to the **next** one — the Dooryard, then the Walled Garden, then the Hillside —
each with a fresh climb, higher numbers, one new rule, and its own signature bloom.

- **The strategic beauty:** the parked map places are the later rungs. The Orchard, the Night
  Garden, the Meadow — designed as biomes, they slot in as prestige tiers, so the garden-only focus
  *parks nothing permanently*; it re-sequences the map from geography into progression. The
  not-a-clone bar transfers intact: each rung must differ by clock or rule, not by sprite.
- **Weakness:** the content bill. Even Egg Inc reskins lightly, and every rung needs its own
  identity to avoid being the AdVenture Capitalist trap laid vertically. For two people this is the
  most expensive idea per prestige tier, and rung authoring never ends.

| Base | Breakout |
| --- | --- |
| **30%** | **10%** |

### 4. Fallow Beds — restart halfway, one bed at a time

**The owner's "restart halfway" taken literally: prestige per plot, not per garden.** Let a bed **go
fallow** — clear it, rest it, and it comes back with **richer soil**: a permanent multiplier on that
plot. Crop rotation as a mechanic; the garden is never all-reset, and there is always one bed in
its early fun phase.

- Continuous micro-prestige; no big-bang loss moment at all, which is the most cosy-compatible
  shape here.
- **Weakness, and it is disqualifying for the spine:** partial resets never produce the *fresh
  start* — the compressed, accelerating replay of the early game that is most of why prestige
  retains. Eight small resets are texture, not structure. **Right as a mid-run layer inside idea 1**
  (fallowing during the year banks bonus heirloom value at the turn); wrong as the system.

| Base | Breakout |
| --- | --- |
| **25%** | **6%** |

### 5. The Compost Heap — sacrifice as a continuous prestige layer

**No reset anywhere: a second-order currency you feed by choosing not to sell.** Throw harvests on
the heap instead of banking them; compost buys permanent soil bonuses. The Realm Grinder/Swarm
sacrifice shape, and the first mechanic in the game where a harvest has **two mutually exclusive
uses** — which is a real decision, something the audit found the game short of.

- Thematically perfect, mechanically honest, and the natural sink for the parked bench later
  (goods compost for more than raws).
- **Weakness:** as the *sole* prestige it misses the point entirely — no fresh start, no re-climb,
  just a slower second wallet. It is a companion system: the thing that gives a mid-season lull a
  job, inside idea 1's chassis.

| Base | Breakout |
| --- | --- |
| **20%** | **5%** |

---

## Recommendation

**Build 1 + 2 as one system. Hold 3 as the long-run ceiling. Fold 4 and 5 in later as texture.
Reject 4 and 5 as spines.**

**The Turning Year is the chassis** — full prestige, season-aging as the decelerator, Perennials as
the permanent bed, the split-level resolution to the reputation problem, and the never-resets list
above held by sim-tests. **Seed Saving is what makes it this game's own** — the heirloom lineage as
the prestige payout, scoped v1 to *one* heirloom per year with properties drawn from a small
audited budget, exactly the way creature traits are pool-audited today. **The Gardens Ladder is
where it goes when the year outgrows one garden** — and it is how the map comes back.

Combined, priced as one direction: **base ~45%, breakout ~15%** — the highest base odds of anything
priced so far, because it is the proven genre spine (tenure is idle's whole advantage, and prestige
is tenure's engine) plus a differentiator no comparable has, on an audience reachable for free.

**The honest cost — and the owner has already accepted it, 2026-08-26:** the economy retune stops
being deferrable, and the owner's ruling is direct: *"we can retune the economy. The economy is
already broken."* Problem 1 means prestige cannot be bolted onto the frozen port even with the
season-aging trick — the badge caps, the 1.5-scale Lucky Charm, and the harvester price walls all
assume a game that ends at level 17. **The retune is part of this work.** The deferral's original
condition — "an economy is tuned against the systems that consume it" — is now satisfied in the
only way that matters: the consuming system is the prestige loop itself, and it is being designed
first.

## Open questions for the owner

1. **How long is year one?** The genre answer is 2–4 days to the first turn, shrinking toward
   hours with Perennials. The cosy answer might be slower. This is the single most important tuning
   target and it should be decided as a *feeling* ("the first turn should land on the second
   evening") before any curve is fit to it.
2. **Do plots stay bought?** The list above resets plots 5–8 for the re-climb. The gentler version
   keeps them. Recommend: reset, but let a Perennial buy them back permanently — that is what a
   permanent tree is for.
3. **Does the heirloom seed occupy a plot slot, or a new heirloom bed?** A ninth, visually
   distinct bed is the cleaner answer and gives the prestige a *place* on screen.
4. **Does the Turning Year sync with the Shared Sky?** They compose — a year turned during
   Wonderfall could pay a visible bonus — but per-player seasons must never become a global clock,
   or the player loses authorship of the turn.
