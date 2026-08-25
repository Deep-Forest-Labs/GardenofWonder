# The Goods Catalog and Cottage Crops

**Status: partly built, 2026-08-25.** The **Florist** and **Honey Jars** families ship with the
Garden Stand — as order-shapes and producer output, needing no crafting system. The other four
families are design until the Potting Bench gets its surface. Mechanic in
[03-systems.md](03-systems.md#the-garden-stand--orders). This documents the two
recommendations the owner adopted from the research in [25-world-map.md](25-world-map.md):
**build the botanical catalog deep** (goods, chains, characterful customers) and **admit cottage
crops** as inputs. The third recommendation — a barn with generic animals — was **rejected**;
animal produce stays with the creatures ([22-creatures.md](22-creatures.md)), and that closes the
chickens question opened 2026-08-14 and re-raised 2026-08-25.

Companions: [13-order-system.md](13-order-system.md) is the demand side that consumes everything
here. [21-potting-bench.md](21-potting-bench.md) is the crafting engine.
[14-economy-model.md](14-economy-model.md) owns pricing structure; every number below is a
placeholder tier, not a price — the economy retune stays deferred, and **every value ships in
`data.js`, remote-config-ready**, per the standing rule.

## The rule every good must pass

> **Can a customer ask for it in one line, and does the player smile?**

"A dozen eggs" passes. "A jar of moonflower honey — for sleep" passes better, because only this
game can sell it. Nobody in the comparables cares about the noun — Gossip Harbor sells chowder at
$100M a month — the customer is the story and the good is a token. A good that needs a sentence of
explanation, or that could appear unchanged in any farm game, should be renamed or cut.

The corollary from the same research: **the captivation lives in the queue, not the list.**
Recurring customers with names, portraits and wants are what turn "3 lavender" into a small
relationship. Writing them is order-system work ([13-order-system.md](13-order-system.md#character-and-story));
this catalog exists to give them things worth asking for.

## How goods get made — three production shapes, no new systems

| Shape | Goods | Engine |
| --- | --- | --- |
| **Order-shape** (no item exists) | Bouquets, posies — "3 roses and 2 bluebells, wrapped" | An order template over raw flowers. **Zero crafting code**; this is why the Florist is the Stand's launch family. |
| **Producer** | Honeys, beeswax | The hives, already built. Honey follows what blooms — the rule survives from the Apiary. |
| **Merge chain** | Everything else — teas, preserves, apothecary, bakery | The Potting Bench. One chain per family, seeded by a generator fed with that family's inputs. This is the 2026-08-16 decision ("a timed craft bench is the worse version of merging") applied to the whole catalog, and it is the Gossip Harbor shape exactly: board rungs feeding customer orders. |

The old prototype `CRAFT_RECIPES` (two-slot timed bench) is superseded by this and should be
retired when the bench ships its surface — it was always marked a throwaway.

## The families

Six families. Each is one merge chain (or simpler), each has a distinct input signature so no two
families compete for the same harvest, and the family is the unit orders draw from. Tier is the
price band, T1 cheapest; the crafted-beats-ingredients ≥1.35× invariant in `tools/sim-test.js`
applies to every rung.

### 1. The Florist — *flowers only* — **built, ships with the Stand**

As shipped in `GOODS`. Every one is an **order-shape** — no item exists anywhere, which is why the
Stand needed no crafting system under it.

| Good | Asks for | Tier |
| --- | --- | --- |
| Buttonhole | 1 named bloom ×1–2 | T1 |
| Posy | 1 named bloom ×2–3 | T1 |
| Garden Handful | *any* blooms ×3–5 | T1 |
| Bouquet | 2 named blooms | T2 |
| Get-Well Basket | 1 named bloom + 1 named honey | T3 |
| Bridal Bouquet | 3 named blooms | T3 |
| Door Wreath | 2 named blooms + 1 named honey | T4 |
| The Village Show | 3 named blooms, larger counts | T4 |

**Two tier-1 goods was not enough.** Three slots drawing from two goods repeats on every board, and
tier 1 is the first thing a new player sees — hence the Buttonhole, and a sim-test asserting every
tier fields at least `STAND.slots` goods *and* customers.

Still design, arriving with the bench: Dried Wreath, Flower Crown (the merge chain's existing top
rung) and Seed Packet.

### 2. The Honey Jars — *hives + what blooms* — **built, ships with the Stand**

Honey of each bloom (Bluebell, Lavender, Rose, Moonflower…), T2; Beeswax T1 (input to the
Chandler goods in the Apothecary). A named honey in an order is the whole point — "wildflower
honey" is filler, "moonflower honey, for sleep" is the game, and `APIARY.wildHoney` is deliberately
excluded from order generation for exactly that reason. Shipped goods: **Honey Jar** (T2, 1 named
honey) and **Honey Flight** (T3, two different jars side by side).

**A honey line only exists once a hive does** — with no hive it is uncompletable rather than merely
slow, which is a harder gate than an unplanted flower. Asserted in both directions.

### 3. The Tea Shelf — *flowers + herbs* — with the Herb Row

Lavender Tea, Rose Tea, Chamomile Tea (T2); Moonflower Tea (T3 — its flower only opens at night,
so the tea carries a *time* identity); Garden Blend (T3, multi-flower). Honey-sweetened variants
sit a tier up and consume family 2.

### 4. Preserves & Sweets — *berries + fruit + honey* — with the Orchard

Bramble Jam, Strawberry Jam (T2); Rosehip Syrup (T2 — rosehips come from roses, no new crop);
Elderflower Cordial (T3); Candied Petals (T2); Apple Butter (T3); Honey Cake (T4, consumes honey
and grain). The card album's *Sweet Things* set already names most of these — the fiction got
here first, and card names and good names should stay in agreement.

### 5. The Apothecary — *flowers + wax* — the premium shelf

Lavender Salve (T3); Rose Perfume (T4); Beeswax Candle (T2); Pressed-Flower Soap (T3); Moonflower
Balm (T4). Top of the price ladder, longest chains, the natural home of premium daily orders.

### 6. The Bakery — *grain + orchard + honey* — **last, and only after crops prove out**

Honey Biscuits (T2); Lavender Shortbread (T3); Apple Pie (T4). The most *familiar* family — it
exists because one grain was admitted, and it should arrive last precisely because it is the least
differentiated. If cut entirely, nothing upstream breaks.

## The cottage crops

**"Crops yes" in the game's voice.** Strawberries, mint and apples read *cottage garden*;
wheat-to-the-horizon reads industrial farm and drags the game onto Hay Day's field. Presentation
rule: crops grow in beds, hedges, patches and trees — never in field rows that imply machinery.

| Crop | Where it grows | Clock | Feeds |
| --- | --- | --- | --- |
| Strawberry | Berry bed | Fast | Preserves |
| Bramble Berry | Berry hedge | Fast | Preserves — and yes, the name is shared with the creature; the hedge is where she shops |
| Mint | Herb Row | Fast | Tea |
| Chamomile | Herb Row | Fast | Tea |
| Apple | Orchard tree | Overnight | Preserves, Bakery |
| Elderflower | Orchard hedge | Long | Cordial |
| Pumpkin | Patch | Long | Preserves (seasonal orders) |
| Wheat | One small golden patch | Medium | Bakery only |

**Crops are not seeds and do not enter the flower garden.** The nineteen-seed ladder, its verbs,
mutations and creatures stay flowers-only — crops live in their own places on the map (the Orchard
biome hosts the trees and patches; the Herb Row is a small bed that can sit beside the main
garden) and use the plant-wait-harvest loop without the flower systems. This keeps the blast
radius near zero: no seed-model change, no new interactions with verbs or attraction. Crops enter
the currency sheet as **one raw tier entry ("garden produce, by variety")** — the
[12-meta-layer-design.md](12-meta-layer-design.md) currency policy is amended rather than grown by
eight rows.

## Rollout, tied to the map phases

| Map phase ([25-world-map.md](25-world-map.md)) | Catalog that unlocks |
| --- | --- |
| B — the Garden Stand | **Florist order-shapes + named honeys.** No crafting needed; the Stand launches on what is already built. |
| C — the Potting Shed surface | Tea Shelf and the Flower Crown/Wreath rungs — first merge-made goods in orders. |
| D — the Orchard | Preserves & Sweets, and the crops that feed them. |
| D (later biome) — Herb Row / Meadow | Full Tea Shelf; Apothecary as wax supply scales. |
| Last | Bakery, if wanted. |

At every step the anti-frustration rule from [13-order-system.md](13-order-system.md) is the
gate: **never generate an order for a family the player cannot yet produce.**

## Data shape

Goods are rows, orders reference families and rungs through pools, everything remote-config-ready:

```jsonc
// good
{ "id": "moonflower_tea", "name": "Moonflower Tea", "family": "tea", "tier": 3,
  "chain": { "rung": 3 },                    // bench rung, absent for order-shapes
  "inputs": ["moonflower", "chamomile"],     // display + generation weighting
  "line": "For sleep." }                     // the one-line ask, written once, used everywhere

// crop
{ "id": "apple", "name": "Apple", "bed": "orchard_tree", "grow": 28800, "yield": 3 }
```

The `line` field is the one-line test made structural: a good with no good `line` has no business
in the catalog, and the customer speaks it when they ask.

## What was decided against, so it stays decided

- **A barn, chickens, eggs, livestock of any kind.** Rejected 2026-08-25 after being cut
  2026-08-14. The creatures are this game's animals; if orders ever want animal produce, it comes
  from creature keepsakes/produce, and only if playtests show players missing it.
- **Wheat-and-corn as a landscape.** One small wheat patch for the Bakery is the entire grain
  concession.
- **A second timed-craft system beside the bench.** One crafting engine. The prototype Craft tab
  retires when the bench surfaces.
