# The Garden Year

**Status: the design, decided 2026-08-29. Nothing here is built.** This is the master document for
the game's new shape — the seasonal world, the Turn (prestige), Saved Seeds, flower mastery, and
how orders, creatures and every existing system sit inside it. Numbers live in
**[33-year-one-economy.md](33-year-one-economy.md)**; every one of them ships in `data.js`,
remote-config-ready. The pitch that sold it is the *Garden Year* artifact; the pressure test that
shaped it is [31-per-seed-prestige.md](31-per-seed-prestige.md); the option space it came from is
[30-prestige-directions.md](30-prestige-directions.md).

**The sentence:** *you don't walk a map — you swipe through the year, and turning it is the
prestige.*

## The world: one swipe wide

The world map is **replaced by the year**. Four gardens sit on one horizontal strip, in the order
of the year, and the player swipes between them:

```
   SPRING   ←   SUMMER   →   FALL   →   WINTER
 (turn ~6)      (home)     (turn 1)   (turn ~3)
                   ↓
               THE HOLLOW
```

- **Horizontal is time.** Swiping left/right moves through the seasons. Locked seasons show as
  hedge gates with something drifting behind them — a gate is a promise, and every early turn
  keeps one.
- **Vertical stays altitude.** Swipe down from Summer to the Hollow, exactly as today. The
  vertical ladder survives; only the map altitude above it retires.
- **Summer is home.** The app opens there. It is the garden that exists today, unchanged.
- **Art ships as a background swap** (owner's call, 2026-08-29): same board grammar, four
  backdrops. Real per-season art arrives after the feel is proven — the same MVP-first sequencing
  that built the map. The meadow already proved one board re-skinned with a new rule reads as a
  new place.

**Migration note for the built map:** the house rule stands — *a tab leaves when its home exists,
and not before.* The map, `overworld.js` and the World button stay live until the year strip
ships, then retire together. The Stand's re-entry is below.

## The four seasons

**The one rule, above every other rule in this document: a season is a speed and a rule — never a
re-skin.** Four boards that differ only in palette are four clones, which is the decay pattern
every page of research warns about. Each season is a different **clock class** and a different
**twist**:

| Season | Clock | Twist | Opens |
| --- | --- | --- | --- |
| **Summer** | Seconds–minutes | The garden as built: tapping, combos, verbs, mutations, creatures. The high-touch place | From the first tap |
| **Fall** | Hours | **The bed pays together** — harvesting a fully ripe bed pays a windfall bonus, so Fall is planted in the morning and popped at dinner. Home of the cottage crops and orchard trees ([26-goods-catalog.md](26-goods-catalog.md)) | **Turn 1** |
| **Winter** | A day or more | **The night shift** — long clocks that ripen while the app is closed (plants already grow on timestamps; Winter's clocks are simply sized to sleep). Tuck it in at night, collect in the morning. No automation required | **~Turn 3** |
| **Spring** | The meta | **The nursery** — where Saved Seeds are spent in ceremony, where heirloom lines and breeding live later, where creatures hatch one day. The garden *about* the other three | **~Turn 6** |

Fall and Winter get their own small seed lists on their own clocks
([33-year-one-economy.md](33-year-one-economy.md#fall-content)); their plants are not Summer seeds
re-priced. Crops never enter the flower garden — the standing rule from doc 26 holds, and Fall is
where those beds were always going to live.

**Fall and Winter beds never clear automatically.** The Turn is a main-garden event (below). Lean
confirmed as a default, revisit after one playtest.

## The Turn — prestige

### The trigger: the year-meter

A meter, visible from the first session, fills as the year is played. **The meter is the pouch:**
it shows the Saved Seeds the year has grown so far, and it doubles as the season's visual clock —
as it fills, Summer's palette ripens toward autumn. The Turn unlocks at a small minimum
(`YEAR.minSeeds`) and is **invited, never forced**: the calendar never turns it for you, the
meter never stops you from playing on, and the word "reset" appears nowhere in the game.

This supersedes doc 30's growth-slowdown mechanic: the deceleration that makes turning attractive
comes from the seed-unlock walls ([33-year-one-economy.md](33-year-one-economy.md#unlock-prices)),
and the season-aging is **visual only**. Simpler, and nothing punishes a player who lingers.

### The ceremony

Five beats, about a minute, one decision:

1. **The meter fills.** The garden golds; the flower starts mentioning the harvest moon.
2. **The flower asks.** *"The year's turning. Save your seeds?"* Declining is free and final for
   as long as the player likes.
3. **Bless one flower.** The single choice in the ceremony: the blessed flower keeps **one free
   petal**, forever. (Turn 1 scripts this beat as the tutorial for petals.)
4. **The seeds are counted.** A count-up from the year's whole earnings — the ceremony's
   fireworks. Sublinear mint, veterancy bonus; formula in doc 33.
5. **The gate opens.** Spring returns to Summer — and on the early turns, a hedge gate lifts:
   Fall at turn 1, Winter around turn 3, Spring around turn 6. **The reset pays in places first
   and numbers second**, which is the whole reason this design beats a plain prestige.

### What the Turn clears, and what it never touches

Owner-decided 2026-08-29: **the Turn clears the fast annuals in the main garden only.**

| Clears (the year's things) | Never touched (the forever things) |
| --- | --- |
| Summer's planted plots | **Any running long timer, anywhere** — Winter sleepers, a mid-grow Century Bloom. A reset that eats a two-week plant is the one unforgivable version of this |
| Gold (after the pouch is minted) | Saved Seeds, petals, seed **unlocks** (one-time prices stay paid) |
| Badges — Power Punch through Combo Coil, rebought each year; the rebuild is the ritual | Creatures, stars, the Hollow and everything in it; food clocks run on real time throughout |
| Plots 5–8 (gold rebuy; lifetime level gates are long met) | Lifetime reputation and level; the Almanac's lifetime records (`discovered`, `bestRarity`) |
| Boost inventory | Cards, packs, gems, mementos, decorations |
| The Stand's three open slots (regenerated, so no order names a bloom the new year can't grow yet) | Fall / Winter / Spring gardens and their contents |

Every row of this table is a sim-test. The Turn is a **new, selective path** — the Settings reset
(`gw-save` wipe) is not a prestige and must never be reused as one
([07-save-data.md](07-save-data.md)).

## Saved Seeds — the two-wallet rule

**Gold is the year's money; Saved Seeds are the forever money.** Neither buys the other's things,
so no purchase ever competes with the player's future:

- **Gold** — earned all year; buys badges, plots, plants and seed unlocks; zeroed at the Turn
  *after* minting.
- **Saved Seeds** — minted **once, at the Turn, from the whole year's earnings** (never from the
  leftover balance — the hoarding failure is quantified in
  [31-per-seed-prestige.md](31-per-seed-prestige.md#surgery-1--the-prestige-currency-lifetime-earned-not-leftover-balance));
  buy petals and nothing else; never reset, never expire.

Spending gold is provably seed-neutral: the mint reads a lifetime-this-year counter that no
purchase can decrease. **Gems stay entirely out of the loop** — gems never buy petals, seeds, or
anything permanent-power, per the standing gems-buy-chances-choices-looks rule. Cheated gold (the
live cheat buttons) is **excluded from the mint** — friend-testers keep their buttons without
contaminating the pacing data.

## Flower mastery — petals

Every flower gets a **card in the Almanac** — which is also the audit's five-collections-into-one
consolidation finally landing with a purpose: the Almanac row becomes the one place a flower's
whole story lives (species, best rarity, lifetime count, honey, creature, petals). Saved Seeds buy
**petals** on the card.

### The shape of a card

- **Two shared skills on every flower**, deliberately boring: **Rich Bloom** (worth more per
  harvest) and **Quick Sprout** (grows back faster). Five petals each. They exist so there is
  never a wrong way to spend.
- **One signature skill each** — the personality slot, one to three petals, hand-authored.
  **Six ship at launch**; every other flower launches with the shared pair alone and gains its
  signature in a content wave. Launch six in doc 33.
- **Chance skills are countdowns, never percentages.** "A card pack blooms every 12th harvest →
  next petal: every 10th," with the live counter on the card. Same math underneath, legible on
  the surface, and cappable in data.
- **Everything maxes eventually.** A card is a garden to fill, not an exam to pass; a
  completionist can genuinely finish one.

### The four discipline rules (all sim-tested)

1. **Petal effects apply as a multiplier at harvest time and in `passiveIncomeRate()` in the same
   commit** — the `masteryMult` pattern. `seed.yield` is never edited; the 1.4× invariant holds.
2. **No per-seed gem skill, ever.** Flat gems-per-hour is a constructed invariant; a per-seed gem
   axis is the exact override mechanism the 2026-08-15 fix deleted, on the premium currency.
3. **Mutation-touching signatures respect the catch/payout split and carry a data cap** (the
   Luna pattern: nominally large, structurally bounded), so the tested 20–30% mutation income
   band survives petals at cap.
4. **Quick Sprout's total is bounded well inside the 0.3 growth-modifier floor** when stacked
   with Sprinklers, Keepers and Seed Rush.

### Old Bloom Mastery retires

The endless +5%-per-tier ladder is **superseded by petals** — two permanent per-seed yield
ladders on one flower is the exact stacking failure the trait-pool discipline exists to prevent,
and the audit already ruled mastery should be bounded. Its lifetime harvest and rarity counts
**stay** (creatures, Almanac and quests read them). Migration: existing mastery tiers convert to
a one-time Saved Seeds grant (doc 33), toastless, the backfill pattern.

## Orders — the Stand in the Year

**Kept, owner-confirmed 2026-08-29 — and promoted.** The Stand's simulation is built, tested and
already pays reputation; in the Year it becomes load-bearing:

- **Orders are the perennial reputation engine.** The quest ladder is year-one's tutorial; from
  the first Turn onward, **orders are where reputation comes from**, exactly the role
  [13-order-system.md](13-order-system.md) always assigned them. The level curve was aligned to
  order tiers from the start; the Year finally cashes that in.
- **The demand comes to the garden.** The Stand's entry is an **order strip** — up to three
  customer faces above the plots, mood carried on the face, tap to open the full Stand sheet.
  This is the demand-on-top-of-supply lesson from [28-the-loop.md](28-the-loop.md), which
  survives the prestige pivot even though the merge-centre plan is parked. The strip renders in
  every season; the customers want what the whole year grows.
- **The catalog follows the year.** Flower lines draw from unlocked seeds (unlocks are permanent,
  so the pool only widens); Fall produce joins when Fall opens; honeys when the meadow has a
  hive. The two anti-frustration invariants stand unchanged: never ask for the unproducible, and
  delivering always beats selling.
- **The Turn regenerates the three open slots** so no standing order names a bloom the fresh year
  cannot yet afford to plant — the audit's cheap guard, one line in the turn path.

## Progression — one track, and the split-level idea retires

**Doc 30's lifetime-vs-season level split is superseded.** It existed because seeds were going to
re-lock each year; the unlock-price model made that unnecessary — **nothing re-locks**, so
nothing needs a second ladder. What remains is the spine as it always was, extended:

- **One reputation number, lifetime, earned never spent, level as its display.** Quests (year
  one), orders (every year), the daily and Almanac milestones all pay into it.
- **The ladder is re-authored past 20** — levels resume granting things: packs, boosts, new
  customers, habitat slot five, cosmetics (doc 33 sketches the rungs). The audit's "no vertebrae
  past 17" problem is closed by orders feeding an extended ladder, not by resetting it.
- **The re-climb inside a year needs no level system.** Its arc is economic — gold from zero,
  badges rebought, affordability climbing the seed list fast (a veteran blasting to their best
  seed in minutes is the fun, exactly as in every comparable), and the next unlock wall waiting
  at the end. Habitat slots, meadow cells and plot *availability* keep their lifetime level
  gates; only the plots' gold price is repaid each year.

## What the Year does not touch

Stated so the blast radius is knowable: **creatures** (attraction reads lifetime counts, which
never reset — progress simply continues across years), the **Hollow**, **keepsakes and
mementos**, the **meadow and hives** (Summer's edge, unchanged), the **card album** (packs keep
dropping; the Daisy signature adds a source; no card is ever lost), **weather and mutations**
(the epoch clock runs over every season — and the Shared Sky direction from
[29-direction-and-odds.md](29-direction-and-odds.md) composes with the Year whenever it is
picked up), **gems**, and the **daily quest**.

## How it is introduced

One new thing per turn, never a wall of trees:

1. **Year one: nothing.** No mastery UI exists. The meter fills, unexplained. The mystery is the
   tutorial.
2. **Turn one: one choice.** The full ceremony, the blessing, the gate. No shop, no tree.
3. **The morning after:** the pouch appears; Almanac rows sprout petal pips; two skills per
   flower to look at.
4. **Turn two onward:** turn → pouch → petals → replant, as ritual. Signatures reveal as flowers
   earn petals.

## Build staging

Each slice ships and is judged before the next starts, per the house pattern:

| Slice | Contents | Proves |
| --- | --- | --- |
| **A — the Turn** | Year-meter, ceremony, mint, the never-resets partition under sim-test, petals (shared skills only) on Almanac rows, unlock prices on seeds 3+, **Fall** at background-swap art with its first plant list and the windfall rule | Does turning the year feel like a gift or a loss — the whole design in one question |
| **B — the signatures** | The launch six signatures, countdown framing, the blessing tutorial polish | Do petals make individual flowers feel *owned* |
| **C — Winter** | The night-shift garden, morning-check session shape, welcome-back scene extension | Does the overnight ritual form |
| **D — orders return** | The order strip over the garden, order-driven rep past level 17, extended ladder rungs | Does demand pull planting across seasons |
| **E — Spring** | The nursery surface; ceremony moves home; breeding/heirloom design begins in earnest | The long game |

The economy retune ships **inside slice A** — it is not a later pass
([33-year-one-economy.md](33-year-one-economy.md)).

## Open questions

- **Fall's windfall rule** — bed-completion bonus as specced, or per-plant streaks? Decide in
  slice A playtest; the rule is one `data.js` knob either way.
- **The Harvest Drone and per-plot harvesters** — parked for their own conversation
  (owner-standing). Nothing in slices A–D depends on it; Winter is deliberately designed to need
  no automation.
- **Does the Century Bloom exist in slice A or C?** It is Winter-flavoured but it is also the
  best screenshot in the design. Lean: ship one ultra-long showpiece plant with Fall in slice A.
- **Spring's v1 scope** — nursery-as-ceremony-home only, or the first breeding mechanics? Not
  needed until slice E; do not design it now.
