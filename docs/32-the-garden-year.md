# The Garden Year

**Status: the design, decided 2026-08-29. Phase 1 (the engine), phase 2 (the ceremony) and the
first half of phase 3 (the strip and Fall) are BUILT and gauntleted — see
[34-build-plan.md](34-build-plan.md).** Live now: the year-meter pill and its projection, the Turn
ceremony's five beats with the arcade Tally, the blessing, petal tracks on the Almanac, unlock
prices in the plant picker, the season tint, the horizontal season strip with its edge tabs, the
locked-season gates, and Fall's board with all eight crops, the windfall and the Century Bloom.
**Still unbuilt in slice A:** the map's retirement and the Stand's dock entry, which are blocked on
re-homing the Wild Meadow — the map is its only door, contrary to the sentence in *The world: one
swipe wide* below. Winter and Spring have gates and no gardens; they are slices C and E.
This is the master document for
the game's new shape — the seasonal world, the Turn (prestige), Saved Seeds, flower mastery, and
how orders, creatures and every existing system sit inside it. Numbers live in
**[33-year-one-economy.md](33-year-one-economy.md)**; every one of them ships in `data.js`,
remote-config-ready. The pitch that sold it is the *Garden Year* artifact; the pressure test that
shaped it is [31-per-seed-prestige.md](31-per-seed-prestige.md); the option space it came from is
[30-prestige-directions.md](30-prestige-directions.md).

**The sentence:** *you don't walk a map — you swipe through the year, and turning it is the
prestige.*

## The plain-English glossary — read this first

**Owner-requested, 2026-08-30: every conversation about the Year uses these words, simply.**
Agents talking to the owner lead with the feel and keep the math in the docs.

| Word | What it means, plainly |
| --- | --- |
| **The Year** | One playthrough of your garden, spring to the Turn |
| **The Turn** | The prestige moment: end the year, cash it in, start fresh with permanent bonuses. Never the word "reset" |
| **Gold** | The year's money. Spend it freely — it goes away at the Turn |
| **Upgrades** | The in-year shop: harder taps, faster growth, automation. Bought with gold, wiped at the Turn and rebought — the rebuild is the ritual. Once called badges, and players never see that word |
| **Power-ups** | The short surges — Bloom Burst, Seed Rush, Fortune Aura, Golden Popups, and the borrowed Harvest Drone. Never bought with money or gems, and never re-earnable by Turning. Four are earned by playing; the drone is *lent* for half an hour in exchange for a rewarded video, which is the owner's frame of paying-accelerates-never-gates and is still earning it, not buying it |
| **Saved Seeds** | The forever money. You only get them at the Turn; they buy petals; you never lose them |
| **The well** | Everything you've *ever* earned feeds one deep well of Saved Seeds. Each Turn scoops out what's new. Turn often = small scoops, wait = one big scoop — same total either way, so there's no wrong rhythm |
| **The meter** | Fills as your year grows; pulses when a Turn is ready. Lives in the dock's Turn button |
| **The Tally** | The arcade scoreboard at the Turn — bonus lines for orders filled, windfalls, species grown — multiplies your scoop, up to double |
| **The blessing** | The one flower you pick each Turn; it gets a free petal |
| **Petals** | Permanent upgrades on each flower: worth more, grows faster, plus one special skill each. Bought with Saved Seeds |
| **Unlock price** | The one-time gold price to open a new seed. Paid once, yours forever |
| **The ??? rows** | Things the garden hasn't shown you yet — seeds today, records too. The next seed to save for always shows its price; the rest reveal themselves as you grow, each with a little celebration |
| **Records** | Collectibles you find through play — each one a song for the garden and a charm to wear. Found by doing, never bought with money |
| **Songs** | Side A of a record: put on any song you've found. The garden's own tune plays when no record is on |
| **Charms** | Side B of a record: a small permanent perk. Wear any charm you've found with any song — and every charm works with the music off |
| **The seasons** | Gardens at different speeds. Summer is seconds, Fall is hours, Winter is days, Spring is the long game |
| **Sprout, stem, bud, bloom** | The four looks a growing flower wears, like Animal Crossing. The bud holds until almost ready, in the flower's own colours, and opens just before the pick |
| **The windfall** | Fall's bonus for harvesting the whole bed at once — the dinner appointment |
| **The tuck-in** | Winter's bedtime ritual: one free tap puts the bed under quilts for the night. It only ever adds — nothing is lost to a night, ever |
| **The snowfall** | Winter's bonus: a plant that ripens while tucked in pays extra in the morning. Fall has the windfall, Winter has the snowfall |
| **Holly** | Winter's hero flower — the winter rose, who keeps the garden while you sleep and insists she didn't do it for you |
| **The Century Bloom** | The fourteen-day showpiece plant. Survives every Turn |
| **Signatures** | Each flower's one special petal skill (arrives in a later phase) |

### How it all runs together

```
                    PLAY THE YEAR
         tap · plant · harvest · fill orders
                        │
                        ▼   gold grows, the meter fills
              ┌──────────────────┐
              │     THE TURN     │   bless one flower,
              │                  │   the Tally scores your year
              └──────────────────┘
        gold goes ──────┼────── Saved Seeds arrive
                        ▼
              SPEND SEEDS ON PETALS
           every flower permanently better
                        │
                        ▼
           next year starts faster — new
           seeds and new seasons in reach
                        │
                        └────────► back to playing
```

One loop, one conversion, two wallets. Everything else in this document is detail on that
picture.

## The world: one swipe wide

The world map is **replaced by the year**. Four gardens sit on one horizontal strip, in the order
of the year, and the player swipes between them:

```
   SPRING   ←   SUMMER   →   FALL   →   WINTER
 (turn ~6)      (home)     (turn 1)   (turn ~3)
                   ↓
               THE HOLLOW
```

- **Horizontal is time.** Swiping left/right moves through the seasons — the strip ships in
  slice A, mirroring the vertical gesture's rules (starts on the background, `dx > dy`, ~70px).
  Locked seasons show as hedge gates with something drifting behind them (a static backdrop, a
  padlock chip and one drifting particle — non-interactive); a gate is a promise, and every early
  turn keeps one. Gate turns are data: `DATA.year.fallTurn = 1` (load-bearing in slice A),
  `winterTurn = 3`, `springTurn = 6` (remote-config knobs).
- **Vertical is two rooms, one either side of the garden (rebuilt 2026-08-30, phase 3.5).** The old
  rule — *up goes in, down pulls the camera back* — was the map's altitude metaphor and retired with
  it. Re-pointed 2026-08-30 (phase 3.8): **swipe UP to go down to the Hollow, swipe DOWN to go out to the
  Wild Meadow**, and a room leaves by the opposite swipe. Neither has a labelled door any more; the
  gesture is the thing to learn, and the meadow's only teacher is one line from the flower.
- **Summer is home.** The app opens there. It is the garden that exists today, unchanged.
- **Art ships as a background swap** (owner's call, 2026-08-29): same board grammar, four
  backdrops. Real per-season art arrives after the feel is proven — the same MVP-first sequencing
  that built the map. The meadow already proved one board re-skinned with a new rule reads as a
  new place.

**THE MAP IS GONE, 2026-08-30.** `overworld.js`, `ui-map.js`, the `.map-layer`, the camera, the
World dock button and the swipe-down pull-back are all deleted. The house rule was honoured — *a tab
leaves when its home exists, and not before* — and it was honoured in three separate pushes, in this
order:

1. **The meadow's way in first.** `UI.enterMeadow()` had exactly one caller in the whole repo (the
   map's dive) and the meadow's only exit returned to the map, so retiring the map first would have
   stranded a built room and 114 of the ladder's 789 reputation with it. The swipe shipped, and the
   meadow's exit came home, while the map was still there.
2. **Then the Big Five**, which is where the World button went.
3. **Then the deletion.**

Everything the map was the only door to has a new one: **the Stand** is the Orders & Quests button,
**the Wild Meadow** is the swipe down, **the Hollow** is the swipe up, **the garden** is the GARDEN
button. **The locked land parcels are the one thing that had nowhere to go, and they went with the
map deliberately** — a promise about land, drawn on a screen that no longer exists. See
[25-world-map.md](25-world-map.md), which is now a design record rather than a spec.

## The four seasons

**The one rule, above every other rule in this document: a season is a speed and a rule — never a
re-skin.** Four boards that differ only in palette are four clones, which is the decay pattern
every page of research warns about. Each season is a different **clock class** and a different
**twist**:

| Season | Clock | Twist | Opens |
| --- | --- | --- | --- |
| **Summer** | Seconds–minutes | The garden as built: tapping, combos, verbs, mutations, creatures. The high-touch place | From the first tap |
| **Fall** | Hours | **The bed pays together** — harvesting a fully ripe bed pays a windfall bonus, so Fall is planted in the morning and popped at dinner. Home of the cottage crops and orchard trees ([26-goods-catalog.md](26-goods-catalog.md)) | **Turn 1** |
| **Winter** | A day or more | **The night shift** — long clocks that ripen while the app is closed (plants already grow on timestamps; Winter's clocks are simply sized to sleep). Tuck it in at night, collect in the morning. No automation required. **Specified 2026-09-01: [46-the-night-shift.md](46-the-night-shift.md)** — the tuck-in, the snowfall, and Holly | **~Turn 3** |
| **Spring** | The meta | **The nursery** — where Saved Seeds are spent in ceremony, where heirloom lines and breeding live later, where creatures hatch one day. The garden *about* the other three | **~Turn 6** |

Fall and Winter get their own small seed lists on their own clocks
([33-year-one-economy.md](33-year-one-economy.md#fall-content)); their plants are not Summer seeds
re-priced. Crops never enter the flower garden — the standing rule from doc 26 holds, and Fall is
where those beds were always going to live.

**Fall and Winter beds never clear automatically.** The Turn is a main-garden event (below). Lean
confirmed as a default, revisit after one playtest.

### Fall's board, specified

- **The garden's own grammar:** a board of **eight plots with the talking flower in the middle**,
  paying exactly what it pays everywhere — the meadow's rule, kept (`UI.flowerBtn()` returns
  whichever flower is on screen).
- **All eight plots open the moment Fall unlocks.** Fall is Turn 1's gift; making its plots
  bought again would tax the reward.
- **The whole board is one bed.** The **windfall** (+50%, `DATA.fall.windfall`) pays when the
  harvest lands on a board whose **all eight plots are planted and ripe** — all eight, so a
  single-strawberry board cannot fish for bonuses. **The fill ends when its last marked plot is
  collected** — not when the bed happens to fall empty, so a player who replants each plot as
  they harvest it still gets the next bed's windfall (see the 2026-08-29 fix in
  [10-decision-log.md](10-decision-log.md)).
- **Crops are not flowers:** Fall plants roll **no rarity, no mutations, drop no gems and never
  write `discovered`** — the windfall is Fall's juice, and every flower system stays a flower
  system. They do count generic `harvest` quest tracks.
- **The Century Bloom ships with Fall** (owner-confirmed 2026-08-29): plantable in a Fall plot,
  **excluded from the bed-ripeness math** (a 14-day plant must not park the windfall), one
  growing at a time, and it survives every Turn like any running long timer.

## The Turn — prestige

### The trigger: the year-meter

A meter, visible from the first session, fills as the year is played. **The meter is the pouch:**
it shows the Saved Seeds the year has grown so far, and it doubles as the season's visual clock —
as it fills, Summer's palette ripens toward autumn (one `--season-tint` overlay on the scenery,
composed like the weather tint — purely visual, no state). The Turn unlocks behind two small gates —
projected mint ≥ `DATA.year.minSeeds` **and** the year has earned `DATA.year.minCoins` (the
coins floor is what keeps many-cheap-Turns-a-day unprofitable) — and is **invited, never
forced**: the calendar never turns it for you, the
meter never stops you from playing on, and the word "reset" appears nowhere in the game.

**Where the meter lives:** a third HUD pill beside the two wallets — the HUD is up in every room,
which is what makes the meter visible in every season. Before the first Turn it is the mystery
meter; afterwards the pill shows the banked Saved Seeds, with the current year's projection
revealed on tap. Tapping the pill when the meter is full is also the **re-invite**: declining the
flower's offer costs nothing and the ceremony reopens from here whenever the player likes.

This supersedes doc 30's growth-slowdown mechanic: the deceleration that makes turning attractive
comes from the seed-unlock walls ([33-year-one-economy.md](33-year-one-economy.md#unlock-prices--where-the-spread-lives)),
and the season-aging is **visual only**. Simpler, and nothing punishes a player who lingers.

### The ceremony

Five beats, about a minute, one decision:

1. **The meter fills.** The garden golds; the flower starts mentioning the harvest moon
   (3–4 meter-state lines in `FLOWER_LINES` ship with slice A).
2. **The flower asks.** *"The year's turning. Save your seeds?"* Declining is free — the
   ceremony reopens from the meter pill whenever the player likes.

   The ask names the year's whole price before it charges it — gold, upgrades, power-ups, the big
   plots and whatever is still growing — and then names the forever things it never reaches.
   **Both rows are led by a sentence, not a label** (2026-09-03): *"A new year washes away
   your…"* and *"It never reaches the forever things…"*, with the chips beneath staying verb-less
   nouns because the sentence carries the verb, and a quiet closing line under both — *"And a new
   year always brings in new life."* The register is the compost line's, not a form heading's.
   **The list may get kinder; it may never get shorter** — an irreversible commit may not
   understate its own price, which is the bug the earlier bluntness fixed. Row two's wording and
   the closing line's placement are provisional and the owner's to settle; the type treatment is
   in [08-ui-and-layout.md](08-ui-and-layout.md).
3. **Bless one flower.** The single choice in the ceremony: pick any flower, and its **free
   petal lands on Rich Bloom**, written into `state.petals` like any bought petal. One blessing
   per Turn, any flower, repeatable across years; `state.blessed` keeps the list for provenance
   and ceremony copy. (Turn 1 scripts this beat as the tutorial for petals.)
4. **The Tally.** The ceremony's fireworks, owner-designed 2026-08-29: an **arcade end-of-year
   score**. The base count-up rolls from **the increment — the part of the garden's lifetime
   mintable pool that this Turn is drawing** (the cumulative mint, doc 33; the owner's ruling,
   2026-08-29). It is *not* the year's earnings: the pool is sized by lifetime coins and the
   ledger remembers what has already been drawn, which is what makes turning often worth
   nothing. Then the year's achievements slam in one line at a time, each raising the
   multiplier:

   > *Orders filled: 47 → +25%!*
   > *Full-bed windfalls: 12 → +15%!*
   > *Species grown this year: 9 → +5%!*
   > *Legendary blooms: 4 → +13%!*
   > *Best combo: 85 → +8%!*
   >
   > *…the year scored ×1.66.*

   Every line reads a **year-scoped counter** in `state.year.stats` (never lifetime, never
   spendable), the bonuses **add** and the sum multiplies the base, **capped at ×2.0**
   (`DATA.year.tallyCap`), and the lines are data (`DATA.year.tally`). **The cosy rule: a line
   the year scored zero on simply does not appear.** The Tally only celebrates — there is no
   "×1.00, you failed" row, ever. Tiers and bonuses in doc 33.

   **The multiplier is pure gift.** The ledger moves by the *un-tallied* increment, so a
   well-played year is never charged for its own fireworks — which is why the Tally became the
   economic teacher when the mint went cumulative: full years out-score spam years, and the
   difference is not borrowed back later.

   *(The bonuses above were corrected on 2026-08-29 to the numbers `projectedTally()` actually
   produces at those counts. As first written, four of the five disagreed with doc 33's tier
   table and the species line — "9 → +8%" — was unreachable under any reading, since nine
   species sits between the 5-species and 10-species rungs. The one line that was always right,
   "47 orders → ×1.25", is the worked example that settles the cumulative tier-reading: 47
   clears both the 10 and 25 rungs, and only adding them reaches ×1.25. Phase 2 builds the
   ceremony from this block, so it now matches the engine line for line.)*
5. **The gate opens.** Spring returns to Summer — and on the early turns, a hedge gate lifts:
   Fall at turn 1, Winter around turn 3, Spring around turn 6. **The reset pays in places first
   and numbers second**, which is the whole reason this design beats a plain prestige.

**The surface and the commit:** the ceremony is a sheet mode (`turn`), built on the welcome-back
scene's pattern, driven by **one atomic `Game.turnYear(blessedId)`** that tallies, mints, clears
and saves in a single commit — a Turn can never half-happen.

### What the Turn clears, and what it never touches

Owner-decided 2026-08-29: **the Turn clears the fast annuals in the main garden only.**

| Clears (the year's things) | Never touched (the forever things) |
| --- | --- |
| Summer's planted plots — see the in-flight rules below | **Any running long timer, anywhere** — Winter sleepers, a mid-grow Century Bloom. A reset that eats a two-week plant is the one unforgivable version of this |
| Gold — zeroed to `defaultState`'s 100 starting coins, after the mint | Saved Seeds, petals, seed **unlocks** (one-time prices stay paid), and the mint's two ledgers — `lifetimeCoins` (never written except by `credit()`) and `mintedBase` (only ever grows, at the Turn, by the un-tallied increment) |
| **Every key in `state.upgrades`** — the tap upgrades, the three procs, Sprinklers, Land Deed, the drone and all eight harvesters. The rebuild is the ritual, and `tap.power` / `comboMax` / crit fields are **re-derived immediately after the wipe** | Creatures, stars, the Hollow and everything in it; food clocks run on real time throughout |
| Plots 5–8 close (gold rebuy from Turn 1 on — **they cannot be bought at all in year one**, so Turn 1's gift is Fall *and* the right to a bigger garden; migrated saves keep what they owned) | Lifetime reputation and level; the Almanac's lifetime records (`discovered`, `bestRarity`, `rarityCounts`) |
| Boost inventory; the combo zeroes with the board; an *active* boost or called sky simply expires on its own clock | Cards, packs, gems, mementos, decorations |
| The Stand's open slots (all of them) regenerate with `nextAt = now`, drawing flower lines from `seedUnlocks` only — no order may name a bloom the fresh year cannot yet grow | Fall / Winter / Spring gardens and their contents; `quests.active` keep their progress; the daily quest keeps its day |
| `state.year` rolls over: `coinsEarned` and `stats` zero, `number` increments | Everything not named in the clears column survives verbatim — that is the rule sim-test 1 is generated from |

**In-flight things at the moment of the Turn**, so nothing is ever silently eaten:

- A **ready, unharvested bloom in the main garden** is auto-collected — paid into the year
  *before* the mint, so
  turning never costs a harvest. **This bullet is scoped to the main garden and to nothing else**
  (stated 2026-09-01, built in slice C): a ripe crop in Fall and a ripe bloom in Winter — kept or
  not — cross the Turn intact and pay into the year they are collected in. Auto-eating a kept
  Camellia at the Turn would eat the morning the season exists for.
- An **unopened card pack on a plot** is banked into `state.packs`. Packs are never touched by
  the Turn, so they cannot be destroyed by it either.
- A **growing Summer annual** — including a caught mutation on it — is forfeit with the plot,
  and the flower's ask says so in one line ("the beds still growing will go to the compost").
  This is the one thing the Turn takes, it is stated before it happens, and waiting costs
  nothing.

Every row of this table is a sim-test. The Turn is a **new, selective path** — the Settings reset
(`gw-save` wipe) is not a prestige and must never be reused as one
([07-save-data.md](07-save-data.md)).

*Reading the right column precisely: "never touched" means never reset or decreased. The Turn
necessarily WRITES three of the listed fields upward — the mint adds to Saved Seeds, and the
blessing adds one petal and one `state.blessed` record — and the sim-test partition accounts for
that: `savedSeeds` sits with the changed-by-the-Turn fields (asserted to grow by exactly the
projection), while petals and blessings are asserted through the blessing's own bill item.*

### What last year's harvest becomes (ruled 2026-08-30, not built)

The partition above has a hole the owner found by playing: the pantry survives the Turn, so a fresh
board of orders can be filled from last year's blooms before anything is planted. The ruling is that
everything still in the pantry at the Turn is **preserved** — pressed flowers and kept jars, which
craft and sell but which no customer will take. Spec, measurement and test bill in
[41-the-preserve.md](41-the-preserve.md).

## Saved Seeds — the two-wallet rule

**Gold is the year's money; Saved Seeds are the forever money.** Neither buys the other's things,
so no purchase ever competes with the player's future:

- **Gold** — earned all year; buys upgrades, plots, plants and seed unlocks; zeroed at the Turn
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
4. **The whole growth stack is clamped at the 0.3 growth-modifier floor**, in one place —
   `plantGrowth()` — so no combination of Quick Sprout, Sprinklers, Keepers and Seed Rush can
   fall through it. *(Corrected 2026-08-29: this rule used to say Quick Sprout was sized to sit
   "well inside" the floor. It is not — at cap in that full stack the product reaches 0.294 and
   the clamp binds, which means the last petal delivers about three quarters of its advertised
   effect. Phase 4 owns the choice between resizing the skill and accepting the clamp; a
   sim-test pins the clamp either way.)*

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
  hive. *(Corrected 2026-09-01: the Stand's pools today know only flowers and honey — "Fall
  produce joins" is slice D's unbuilt future, not a shipped behaviour, and Winter's plants stay
  out of the pools at slice C per [46-the-night-shift.md](46-the-night-shift.md).)* The two
  anti-frustration invariants stand unchanged: never ask for the unproducible, and delivering
  always beats selling.
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
| **A — the Turn** | Year-meter pill, ceremony with **the Tally**, mint, the never-resets partition under sim-test, petals (shared skills only) on Almanac rows, unlock prices on seeds 3+, the seed-picker's unlock rows, the season strip, the map's retirement, the Stand's dock entry, **Fall** at background-swap art with its plant list, the windfall rule and the **Century Bloom** | Does turning the year feel like a gift or a loss — the whole design in one question |
| **B — the signatures** | The launch six signatures, countdown framing, the blessing tutorial polish | Do petals make individual flowers feel *owned* |
| **C — Winter** | The night-shift garden, morning-check session shape, welcome-back scene extension | Does the overnight ritual form *(engine shipped 2026-09-01; see [46-the-night-shift.md](46-the-night-shift.md))* |
| **D — orders return** | The order strip over the garden, order-driven rep past level 17, extended ladder rungs | Does demand pull planting across seasons |
| **E — Spring** | The nursery surface; ceremony moves home; breeding/heirloom design begins in earnest | The long game |

The economy retune ships **inside slice A** — it is not a later pass
([33-year-one-economy.md](33-year-one-economy.md)).

## Open questions

- **The Harvest Drone and per-plot harvesters** — parked for their own conversation
  (owner-standing). They reset with the badges each year; nothing else in slices A–D depends on
  them, and Winter is deliberately designed to need no automation.
- **Spring's v1 scope** — nursery-as-ceremony-home only, or the first breeding mechanics? Not
  needed until slice E; do not design it now.
- **Notifications** — Fall's dinner windfall and Winter's morning check imply reminders, but no
  push mechanism exists and none ships in v1: the windfall itself is the appointment. Park push
  for its own conversation alongside the Unity shell.

**Closed 2026-08-29 by the owner:** the Century Bloom ships in slice A with Fall, and the
windfall is the bed-completion bonus — with the streak appetite landing as **the Tally** instead,
where it multiplies the whole year rather than one bed.
