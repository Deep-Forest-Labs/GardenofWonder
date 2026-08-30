# The Preserve — what last year's harvest becomes

**Owner's ruling, 2026-08-30. Specced, not built.** Reasoning in the phase-3.7 entries in
[10-decision-log.md](10-decision-log.md); the measurement that produced it is below.

## The rule, in one line

> **An order is filled from what you grew this year.** Everything still in the pantry when the year
> turns is *preserved* — kept, craftable, sellable, and no longer something a customer will take.

## Why: the pantry was a bank, and it never emptied

The Turn throws away all three orders and writes new ones. It does not touch `state.flowers`.
Nothing else in the game empties that bag either, so it grows for the life of a save.

The result, measured against the live build across ten simulated days:

| | |
| --- | --- |
| Order gold a Turn-heavy player earns **in the first sixty seconds of a fresh year** | **30.0%** of all of it — 401 deliveries of 1,304 |
| The same figure for a player who Turns four times | 5.7% |
| Lifetime gold, Turn-heavy vs normal play, pantry carrying | 68.1M vs 46.6M — **the Turn-heavy player wins** |
| The same, with last year's flowers unable to fill orders | 32.4M vs 38.2M — **normal play wins** |
| Turns the Turn-heavy player bothers to make, once the catapult is gone | **53 → 35** |

The owner found it by playing: *"when I come back to the game after a turn, I have those orders that
I can turn in, and it catapults me far through the new season."* The Stand was built to be the
demand side that consumes what the garden produces ([13-order-system.md](13-order-system.md)). A
stockpile that survives every Turn turns it into a cupboard you withdraw from instead.

## What it will feel like, including the part to sign off

**This is the change worth looking at before building.** It is not only an exploit patch — it moves
the feel of orders for everyone.

- **The first board of a new year becomes a to-do list rather than a payout.** You Turn, three
  customers walk up, and you have nothing to give them. You plant. That is the intent — an order
  stops being *check the cupboard* and becomes *go and grow that* — but it is a real change to the
  first minute of every year, and skipping is free precisely so it never walls.
- **Normal play loses order income too.** Not just the exploit case: measured across the runs, a
  four-Turn player's order gold falls by about two thirds. The bank closes for everybody.
- **Nothing a player grew is destroyed.** That is the whole reason this is a Preserve and not a
  wipe. The blooms move somewhere they are still worth something.
- **Crafting finally has a reason to exist.** It has been a system with no pressure on it. The
  Preserve is its supply.

## The shape

### Saved state

```js
state.preserve = { flowers: {}, honey: {} }
```

Same shape as `state.flowers` and `state.apiary.honey` — id to count. New nested field, so it needs
its own line in `defaultState()` **and** in the `load()` re-merge list, and it must be classified in
the Turn partition (see [07-save-data.md](07-save-data.md) and the trap about `load()` not
deep-merging). It **survives** the Turn.

### The move

Inside `turnYear()`, in the clears block, after the auto-collect and before the mint is irrelevant —
what matters is that it happens **after** the ready-bloom auto-harvest, so a bloom that ripened
during the ceremony is banked into the year first and preserved second:

```
for every id in state.flowers      → state.preserve.flowers[id] += count
for every id in state.apiary.honey → state.preserve.honey[id]   += count
state.flowers = {}
state.apiary.honey = {}
```

Additive, never replacing: year three's pressed daisies join year two's.

### What reads which bag

| Reader | Fresh | Preserve |
| --- | --- | --- |
| `standCanDeliver` / `standTakeNeed` — filling an order | ✓ | **✗ — this is the whole change** |
| `standFlowerPool` / `standHoneyPool` — what an order may ASK for | *(reads seed unlocks, not stock — unchanged)* | — |
| `haveFor` / `spend` — crafting | ✓ | ✓ |
| `sell` / `sellValue` | ✓ | ✓ |
| `flowerTotal` / `honeyTotal` | see below | see below |

**Crafting spends the Preserve first.** Older stock goes first, and it leaves this year's blooms
free for the customers who are actually asking for them. That ordering is a kindness, not an
optimisation, and it is worth a test.

**`flowerTotal()` and `honeyTotal()` need splitting deliberately**, because they are read by quests,
the Almanac and the craft panel and each wants a different answer. Give the engine three getters
rather than overloading one: fresh, preserved, and both. Anything that means *"can you make this
right now"* takes both; anything that means *"what can a customer have"* takes fresh.

## Honey is the other half, and it is unmeasured

`state.apiary.honey` survives the Turn exactly as flowers do, and four goods are honey goods — Honey
Jar, Honey Flight, Get-Well Basket, Door Wreath. **The same hole exists there.**

It does not appear in any measurement above, because the casual model never builds a hive, so
`standHoneyPool()` is empty and honey goods are filtered off the board entirely. A real player with
a hive would see it.

**Spec it with the same rule.** Leaving honey out means the fix is half-done and the catapult simply
moves to jars. But be honest in the handoff that the honey half ships unmeasured — the play model
would have to learn to build a hive before it could be measured, which is its own small job.

## Does the Preserve become the next unbounded bank?

It grows forever unless something eats it, and today crafting is the only sink — three recipes, two
slots. That is thin. **This is accepted for now and recorded rather than solved**, on two grounds:

- The Preserve's only outputs are crafted goods and gold at `flowerValue`. An order pays 30–225×
  the unit value at current multipliers, so a pile of preserved flowers is worth **roughly a
  hundredth** of the same pile fresh. It is a stock of raw material, not a stock of orders.
- If it grows uncomfortably large, the answer is more crafting, which is a thing the game wants
  anyway — not a cap on the Preserve.

Revisit if the Market or the bench ever gives crafting real throughput.

## The name

**The Preserve**, holding **pressed flowers** and **kept jars**. Garden-native, and the vocabulary is
already in the game: Petal Perfume's own description reads *"Pressed petals set in beeswax."* It
also carries the reason a customer says no — they want something fresh.

Naming is the owner's to overturn; nothing in the engine depends on it.

## Where it lives on screen

**The Apothecary panel**, under the recipes — the Preserve is crafting's larder, and that is where
someone goes when they want to spend it. No new dock button; the dock is capped at five
([15-navigation-and-ia.md](15-navigation-and-ia.md)).

One line of copy has to do real work at the moment of the Turn, because that is when a player will
wonder where their flowers went. The ceremony's Spring beat should say it plainly: *your blooms were
pressed and put away — they keep, and they're what you craft with.*

## Migration

**None, deliberately.** Existing saves keep their pantry fresh; it presses at their next Turn like
anyone else's. Nobody loses anything, and there is no retro-pressing to get wrong.

## The test bill

1. An order **cannot** be filled from the Preserve — the property the whole change buys. Must be
   false before the change, or it is testing nothing.
2. The Turn moves fresh flowers and jars into the Preserve, additively, and empties both fresh bags.
3. A bloom that ripens **during** the ceremony is harvested into the year first, then preserved.
4. The Preserve survives the Turn — its line in the partition sweep (bill item 1).
5. Crafting spends preserved stock before fresh stock, and can span both to fill one recipe.
6. `sell` pays the same per unit from either bag.
7. A fresh save has an empty Preserve, and a save written before this shipped loads with one.
8. Immediately after a Turn, a board of three orders is unfillable from an empty fresh pantry — and
   every one of them can still be skipped for nothing.

## What this is not

- **Not a nerf to order gold.** The multipliers ruled on 2026-08-30 stay. This changes *what fills*
  an order, not what one pays.
- **Not a change to what an order may ask for.** The anti-frustration rule still reads seed unlocks.
- **Not a cap, a decay or an expiry.** Preserved stock never rots. A player who kept it, keeps it.
