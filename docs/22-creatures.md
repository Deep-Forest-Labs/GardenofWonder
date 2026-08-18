# Creatures

**Status: built 2026-08-16.** Six creatures, arrival, living in the garden, petting, keepsakes,
traits and tending, stars and growth, **eight named pairs**, a habitat and companions block in the
Almanac, save, and 131 sim-test assertions.

This is the first step of the **habitat direction** agreed 2026-08-16. Reasoning in
[10-decision-log.md](10-decision-log.md).

## The reframe this belongs to

Everything before this thought in **production chains** — garden makes flowers, bench makes goods,
market consumes goods. What creatures add is a second frame beside it: **the garden is a place that
becomes alive because of what you plant**, and part of the reward for playing is that it gets more
inhabited rather than only that a number gets bigger.

The owner's diagnosis is what started it: the world had a *place* and a *character*, but no
*inhabitants* — nothing lived there except the talking flower.

### The production chain is not cancelled — clarified by the owner 2026-08-16

An earlier version of this section said the chain "is not what this audience wants" and implied it had
been abandoned. **That overstated it and the owner corrected it.** The garden → bench → market chain
and the order system are still wanted; **what is missing is the right way to fold them in**, not the
appetite for them. Read the parked status of the Potting Bench and the Market as *unsolved*, never as
*rejected* — see [21-potting-bench.md](21-potting-bench.md) and
[13-order-system.md](13-order-system.md), both of which remain live designs.

What the research in [17-market-and-positioning.md](17-market-and-positioning.md#who-this-game-is-for)
actually supports is narrower and worth keeping straight: the likely audience is **69% female with
Completion and Fantasy as the top two motivations**, so a supply chain cannot be the *only* thing the
game asks you to care about. It is an argument about emphasis, not a reason to delete a system.

## The rule that makes this worth building

**A creature is a character first and a mechanic a distant second.**

If a grove spirit is "+5% growth" with a face drawn on it, this is the badge list wearing a costume,
and it fails for exactly the reason the AdVenture Capitalist trap describes. A sim-test asserts every
creature has a name, a species, a line about itself, a hint, a named keepsake, and arrival, idle and
pet dialogue — so a stat-only creature cannot be added without the suite noticing.

## Why this answers "why plant this flower"

The longest-running open question in the project. Verbs made flowers *behave* differently, mutations
made any flower *exciting*, orders would make a flower *wanted*. None of them made you want a
specific bloom.

**Pip comes for bluebells and for nothing else.** That is desire rather than a quota, and it costs a
data row.

## Attraction

```js
attract: { seed: 'bluebell', count: 5 }
```

Progress reads **`state.discovered`** — the lifetime harvest record — and never `state.flowers`.
Flowers are spendable, so an attraction keyed to the pantry would let a creature *leave* when the
player crafts, which is the same class of bug that once jammed the quest strip. Two sim-tests cover
it: an empty pantry does not send a creature away, and the wrong bloom never counts.

`checkCritters()` runs at the end of `harvest()`, **after `recordHarvest()`**, so the bloom that
meets the threshold is the one that brings the creature rather than the one after it.

Arrival is a moment, not a notification: confetti, the flower pulling a `wow` face, a banner, and
then the creature introducing itself **in its own voice** through `UI.sayText()` rather than the
flower's `FLOWER_LINES`.

## Keepsakes

```js
keepsake: { id: 'mossy_pebble', name: 'Mossy Pebble', every: 900, cap: 3, gems: 1, credits: 250 }
```

**The keepsake is kept, not just cashed in.** `state.mementos` holds a lifetime count per keepsake id
— nothing spends them yet, but a name that evaporates on collection is decoration, and any future
craft, display or trade needs quantities to read. Counts, not booleans, for the same reason the card
album stores counts.

**Ids are stable and separate from the display name**, so renaming *Someone Else's Button* can never
orphan a save. A sim-test asserts they are unique and never collide with a card id.

| Creature | Keepsake | Every | Cap | Pays |
| --- | --- | --- | --- | --- |
| Pip | Mossy Pebble | 15 min | 3 | 1 gem + 250 |
| Thistle | Bent Nail | 20 min | 3 | 1 gem + 400 |
| Bumble | Thimble of Honey | 20 min | 3 | 1 gem + 500 |
| Bramble | Someone Else's Button | 25 min | 3 | 2 gems + 600 |
| Luna | Wing Dust | 25 min | 3 | 2 gems + 700 |
| Ember | Warm Pebble | 30 min | 3 | 2 gems + 900 |

**Each is a small joke about its creature** — this is the Neko Atsume memento device recorded in
[17-market-and-positioning.md](17-market-and-positioning.md). Bramble brings you things, not all of
them hers, so hers is *Someone Else's Button*. Thistle digs constantly and forgets what he buried, so
his is a *Bent Nail*. That is the whole reason they are named rather than being "+250 coins".

**The coins and gems are the placeholder, not the memento.** Eventually the object should be the
reward and the currency should shrink or go — held mementos are the thing a craft or a display shelf
would read.

Derived from **elapsed time against an absolute timestamp**, the same shape the hives already use, so
time away counts for free and nothing needs replaying.

**They cap.** Three waiting is a small gift; thirty is homework, and homework is what the cosy pillar
exists to prevent. `settleCritters()` runs once on boot and rolls a capped creature's clock forward
without paying out, so a creature that has been full for a week is not silently banking time it can
never turn into anything.

**Petting pays nothing at all**, and a sim-test asserts it. A creature you tap for currency is a
button; a creature that just reacts is a pet. The keepsake is the reward and the tap is the
relationship.

## Traits and tending

**Added 2026-08-16.** Creatures carry stats, because the owner wanted the roster to feel like pets
with attributes rather than a gallery — swappable, and worth thinking about.

**Depth is fine; RPG *framing* is the trap.**
[17-market-and-positioning.md](17-market-and-positioning.md#what-to-avoid-entirely) says idle RPG has
the worst install rate in mobile at 2.0 per 1,000 impressions. That is about how the game is
*marketed*, not whether there is strategy underneath. Loadouts, yes. "RPG" on the store page, no.

### Retraction: traits may share an axis with a verb

**An earlier version of this section said a trait must not share an effect category with a verb,
because the two would "cancel out". That was wrong and is retracted.** They stack, and stacking is
the pleasure of the genre — this project's own market doc cites Cookie Clicker's 36 synergy pairs
approvingly. The rule was imported from the wrong place: *verbs* may not share a category because a
plot picks **one** verb, so two identical verbs would make that choice meaningless. A loadout picks
**three of N**, which is a different problem.

### What actually constrains a trait: the pool it stacks into

Harvest payout is already seven multiplied terms —
`yield × rarity × (1+globalCredits) × (1+pollination) × wonder × mastery × verb × mutation` — and the
mastery ladder never ends. That product is where an idle economy quietly breaks, and it is the same
reasoning that kept mutations as chance-not-payout in
[18-mutations-and-weather.md](18-mutations-and-weather.md).

So every trait declares a `pool`:

| Pool | What it touches | Stack freely? |
| --- | --- | --- |
| `capped` | A stat with a ceiling — crit chance, growth floor, combo cap | **Yes.** The cap holds it |
| `chance` | A roll — mutation catch, gem drop, double harvest | **Yes.** `chance × (mult−1)` stays small |
| `utility` | Off the yield curve — keepsake speed, offline rate, information | **Yes** |
| `yield` | Multiplies the harvest product directly | **Sparingly.** Four at +25% is 2.44× on top of everything else |

Two sim-tests replace the retracted rule, and they guard what actually goes wrong:

- **The roster may not be all one kind of effect.** Six creatures that all add a percentage make
  choosing three a ranking rather than a decision. Once three or more traits exist, at least half must
  be distinct categories.
- **At most a third of the roster may sit in the `yield` pool.**

### The slot limit is the whole mechanic

```js
HABITAT_SLOT_LEVELS = [1, 5, 10, 16]   // slots = how many of these the level has passed
```

**Moved earlier on 2026-08-16, from 1 / 8 / 14 / 20.** Pairs are the most interesting thing in the
system and they need two slots to exist at all — at the old spacing a player could not form a single
pair until level 8, or hold two until 14. Discovering the mechanic late is the same as not having it.

**Only tending creatures stand in the yard.** Four is the most the lawn holds before it reads as
clutter, so a resting creature leaves the screen — but it is still home, still in the Almanac roster,
and still one tap from coming back. Nothing is ever taken away, which is what keeps this cosy; having
more creatures than slots is what makes "which three are out" a decision, and that decision is the
strategy layer.

A tending creature wears a leaf badge, so the state is legible from the garden itself, and **its glow
brightens with its star** — how grown a creature is reads off the art rather than only out of a panel.

**Stars are shown as stars, never as the word "level."** Five pips under the name say everything at a
glance, and the Almanac row carries a progress bar to the next one.

**Where resting creatures live: the Hollow.** Agreed 2026-08-16 and drawn as an art spike at
`tools/hollow-spike.html` — a warm burrow *under* the garden, reached through a crack in the roots.
Chosen over a shed interior or a fenced paddock because it is the only option that is both an
interior — walls, alcoves, somewhere to put a memento — **and** continuous with the garden, which the
locked navigation in [15-navigation-and-ia.md](15-navigation-and-ia.md) requires: you go *down*, not
away.

**`tools/hollow-spike-v1.html` is a frozen reference**, kept as a live file rather than a screenshot
so the wisps, the breathing light and the night palette can be compared honestly against any later
pass. Do not edit it.

**Warm earth, never stone.** Night cools only the light coming through the crack; the walls stay
ochre. A cold palette on the earth turns the room into a cellar, which is the failure this design is
most exposed to.

Three drawing lessons, all found by looking rather than by a test:

- **A jagged outline drawn the obvious way is a mountain.** In SVG a smaller `y` is higher, so the
  first two attempts at the crack produced upward peaks. A hole seen from below only reads when it is
  a bright irregular gap with dark earth teeth hanging *down* into it.
- **An even-width stroke is a wire, not a root.** A root has to be fat where it leaves the soil and
  thin where it ends.
- **Reuse a shape that already works before inventing one.** A plank shelf for mementos read as a
  wire strung across the wall; a small carved alcove — the burrow mouth at a smaller size — reads
  immediately.

**The spike is now full-screen portrait, 390 × 844**, because a square canvas was hiding the real
composition problem — the room has to fill a phone. What that settled:

- **A vertical tower of burrows reads well.** Five staggered rather than gridded, because earth is dug
  where it lets you, plus a floor spot and a memento cubby. Six creatures visible in one chamber.
- **The bottom 96px belong to the Hollow's own dock**, so the floor sits *above* it rather than
  disappearing under it. Reserving that strip changes the composition and had to be designed in, not
  added later.
- **The Hollow has different verbs from the garden** — Feed, Pet, Loadout, Decorate. A per-place dock
  is a small evolution of "places on the map, systems in the dock" in
  [15-navigation-and-ia.md](15-navigation-and-ia.md), and it also sidesteps the five-tab cap, because
  places no longer compete for slots.
- **Arch burrows, not circles.** A round mouth read as a sticker sitting on the moss; the arch
  encloses a creature. Moss **drips over the lip** — drawn behind the band so only the rounded bottom
  shows, because narrow shapes drawn in front read as table legs.
- **Vines run beside a burrow, never across one**, and have to hang from something. A vine crossing a
  burrow mouth reads as growing through somebody's front door, and one starting in mid-air reads as a
  mistake.

Agreed but not yet designed: **chambers rather than a continuous strip** — swipe between rooms of
three or four, which is more legible one-handed than scrubbing along a wall, gives each room its own
character, and is the natural unit for the decoration the owner wants later. **One level first**; a
second is a progression reward once the roster needs it, since an empty second floor is worse than
none. Entry is **a visible burrow mouth in the garden to teach it, and a swipe down as the fast
path** — swipe alone is undiscoverable, and swipe-down also fights the sheet drag and browser refresh.

**Wired into the game 2026-08-16.** A **burrow mouth** in the garden, bottom left, opens it; the exit
chip or a swipe up closes it. `hollow.js` draws the room and knows nothing about the game;
`ui-hollow.js` places real creatures into `Hollow.SPOTS` and owns the screen.

- **Every creature that has moved in lives down here**, up to six per chamber. The garden yard shows
  only the ones tending — the **leaf badge** in the Hollow is what says which, and the gem badge says
  who has a keepsake waiting. Tapping one pets it or collects, through the same `UI.tapCritter()` the
  garden uses, so there is one code path for the whole interaction.
- **The Hollow has its own dock** — Feed, Pet, Loadout, Decorate. **Feed and Decorate are honest
  about not existing** rather than doing something token: the buttons are there because the shape of
  the screen depends on them, and they say so when tapped.
- **The garden's dock, rail and quest strip hide while the Hollow is up**, via `.in-hollow` on
  `#game`. The frame loop redraws the Hollow instead of the garden yard while it is open.
- **The sky follows `Game.isNight()`**, so the room is lit by whichever light is actually outside.

### Five things only a real device showed

All five came from playing it on a phone, and four are the kind a screenshot hides.

- **Rebuilding is what breaks motion.** `renderTenants()` wiped and rebuilt every creature node on the
  0.6s tick, so every float, tilt and glow restarted constantly — which reads as a hitch at the end of
  the loop, not as a rebuild. The scene was redrawn on every entry too, which restarted the wisps and
  made the lights cut off harshly instead of fading. **Nodes are now built once and only their badges
  change**, and the scene is only redrawn when the sky actually changes.
- **A percentage of the container is not a position in the art.** The scene is drawn with
  `preserveAspectRatio="slice"`, so on any screen that is not exactly 390×844 it is cropped — and the
  overlaid creatures drifted off their burrows. `Hollow.SPOTS` are now the scene's **own coordinates**,
  mapped through the SVG's `getScreenCTM()`. Measured at 0px offset on every creature.
- **Swipe down to go up.** Dragging down pulls the world down past you, which is the direction every
  scroll already uses. Swiping up to rise reads backwards the moment you try it.
- **The dock has to be the garden's dock.** It was styled from scratch and felt like a different game;
  it now reuses `.dock` / `.dock-btn` / `.dock-ico`, so it matches by construction rather than by
  someone remembering to keep two rules in step. **Watch the hide rule**: `.in-hollow .dock` then
  swallowed the Hollow's own dock, so the garden's is hidden by `#dock` instead.
- **Idle animation was scoped to `.critter`**, so creatures in the Hollow floated but never tilted or
  blinked — noticeably less alive than the same creature upstairs. Every idle rule now covers
  `.hollow-pet` too.

Two placements also had to move: the tending count sat over the crack, where the art is busy enough to
swallow small white text, and the garden's leftmost creature spot sat under the burrow door.

### The loadout is chosen in the room, 2026-08-18

**Pet and Loadout are modes, and a tap on a creature spends whichever is armed.** Loadout used to
open the Almanac, which meant choosing the pets standing in front of you by leaving the room and
reading a book about them. Now the dock button arms the mode, the armed button lights up, and
tapping a creature sends it out or lets it rest.

- **The room already had the display for this.** The leaf badge said who was tending before any of
  this was built; loadout mode adds a ring around it and steps a resting creature back to half
  opacity and low saturation. Nobody leaves — that is what keeps the slot limit cosy rather than
  punitive.
- **No toast for entering a mode.** The count line reads `3 of 3 tending · tap to swap` and the
  dimming carries the rest. Toasts are for notable moments and the cap is two.
- **The Almanac's Habitat block keeps its toggles.** It is still where an *unmet* creature and its
  harvest progress live, and the Hollow can only show creatures that are already home. Two surfaces
  onto one `Game.setTending()`, which is the same discipline `UI.tapCritter()` already follows.
- **Nothing was added to the save.** Mode is a UI local, reset to Pet on exit.

**A celebration cannot be centred on a hidden element.** Forming a pair from inside the Hollow fired
its confetti and ring from the top-left corner, because both the `pair` and `critter` handlers were
centred on `#garden` — and `.in-hollow` sets `display:none` on `.stage`, so `#garden` measures a
0×0 rect. Both now go through one `critterStage()` helper that picks whichever screen is up. This
was invisible until the Hollow became a place where the loadout can change; an automated harvest
could always have brought a creature while the room was open.

Still not built: chambers and sideways paging, a second level, feeding, and decorating.

### Stars — a creature is raised, not found

```js
CREATURE_STARS = 5
attract: { seed: 'bluebell', count: 5, growth: 3 }
```

A creature **arrives at one star with a fifth of its trait** and grows to full. `trait.value` in
`data.js` is the value at five stars, and `critterTraitAt()` scales it — so a one-star Pip gives 5%
and a five-star Pip gives the listed 25%.

This exists because a creature that arrives finished has nothing left to ask for — the same problem
Bloom Mastery was invented to solve for flowers. The point of a pet is that you raise it.

**The duplicate that raises it comes from the same bloom that attracted it**, at an escalating count:
`count × growth^(level−1)`, so Pip needs 5 / 15 / 45 / 135 / 405 lifetime Bluebell harvests. In
fiction, a second Pip turns up and merges in.

**This is the payoff, and it is bigger than the levelling itself:** a low-tier seed now has a reason
to be in the ground long after its coins stop mattering. It is the first real answer this project has
had to *"why would I ever plant a Daisy again."*

Arrival and growth run through **one** `checkCritters()`, and the growth check **loops** — a long
absence can bank enough for more than one star at once, and granting a single level per harvest would
silently swallow the rest.

Numbers are placeholders. The shape — arrives weak, escalating cost per star, capped at five — is the
part to keep.

### The roster

Six creatures, each on a different bloom and a different axis. Values are at ★5; a creature carries a
fifth of that at ★1.

| Creature | Comes for | Trait | Pool | At ★5 |
| --- | --- | --- | --- | --- |
| **Pip** — Grove Spirit | Bluebell (Lv 1) | *Coaxes the Sky* | chance | +25% mutation catch chance |
| **Bumble** — Gardenbee | Lavender (Lv 2) | *Busy Hands* | utility | Every creature's keepsakes arrive 100% faster |
| **Bramble** — Hedgefox | Rose (Lv 3) | *Forager* | chance | 2% chance a harvest turns up a card pack |
| **Thistle** — Hedgepig | Marigold (Lv 5) | *Rummager* | chance | +60% gem drop chance on harvest |
| **Luna** — Moonmoth | Moonflower (Lv 9) | *Moonlit* | yield | Night harvests pay +30% |
| **Ember** — Lampfly | Starlit Iris (Lv 10) | *Lantern Keeper* | utility | +20% offline earning rate |

**Six distinct categories and only one in the `yield` pool**, both asserted. Three properties worth
keeping as the roster grows:

- **Every creature is on a different bloom**, and they are spread across seed unlock levels 1 to 10,
  so creatures arrive gradually rather than all at once.
- **Bumble buffs the other creatures**, which makes the loadout self-referential and immediately more
  interesting than six parallel percentages.
- **Luna is the only yield multiplier and it is structurally capped** — night is roughly 32% of the
  clock, so +30% at night is about +10% on average, and the cap is something the player does not
  control. That is the shape to copy for any future `yield` trait.

Where each one lands:

| Trait | Consumer |
| --- | --- |
| `mutationLuck` | `catchMultiplier()` — the choke point both mutation roll paths use |
| `gemLuck` | the gem roll inside `harvest()`, alongside the Lantern verb. **Not** `gemChanceFor()`, which stays the base rate |
| `packLuck` | `rollCardPack(chance)` from `harvest()` — the same landing spot as the tap proc, so the album still only *receives* from the garden |
| `nightYield` | `critterPayoutMult()`, kept apart from `verbPayoutMult()` so a creature and a verb are never confused in a balance pass |
| `offlineRate` | `offlineRate()`, inside the existing `maxRate` clamp so a creature can never push past the cap |
| `keepsakeSpeed` | `keepsakesWaiting()`, floored at a quarter of the authored wait so no stack of helpers turns keepsakes into a print button |

A sim-test asserts each of these six actually moves its consumer. **A trait wired to nothing is
invisible until someone notices the number never changes**, which is the kind of bug that survives for
months.

Wired into **`catchMultiplier()`**, which is the single choke point both mutation roll paths already
go through, so there is no second consumer to keep in sync. It raises the **chance and never the
payout**, which is the rule that keeps the mutation income share computable — see
[18-mutations-and-weather.md](18-mutations-and-weather.md#tune-the-income-share-not-the-multipliers).

`critterTrait(id)` sums a trait across every tending creature. Consumers ask **by trait id, not by
creature**, which is what makes a new creature a data row: add the row and any existing consumer
already sees it.

### Two migration rules worth keeping

- **An arrival tends itself if there is room.** A first creature that did nothing until the player
  found a toggle would read as broken.
- **An absent `tending` field means "tend it", not "switched off".** A save written before traits
  existed must come back working; a returning player finding their creature idle with no explanation
  is the same class of harm as taking a seed away. A *deliberate* rest is still respected, and the
  slot trim caps both cases.

## Named pairs

Two specific creatures tending together unlock a third thing neither does alone. Cookie Clicker ships
36 of these; this game starts with eight, and each is one row of `CREATURE_PAIRS`.

**This is what stops a loadout being a ranking.** With six creatures and three slots there are 20
trios, and without pairs the answer is fixed — pick the three biggest numbers. With pairs, a trio
forms up to **three** at once, and the best answer depends on how you play.

| Pair | Both tending | Effect |
| --- | --- | --- |
| **Nightbloom** | Pip + Luna | A mutation caught after dark has a 50% chance to come in one tier higher |
| **Lantern in the Rain** | Pip + Ember | A sky called with gems lasts twice as long |
| **Pollination Rounds** | Pip + Bumble | Every creature holds five keepsakes instead of three |
| **The Long Watch** | Luna + Ember | Two more hours at full rate while away |
| **Night Errand** | Luna + Bramble | A pack found after dark is guaranteed a Rare or better |
| **The Hedgerow** | Thistle + Bramble | A foraged pack turns up with gems in it |
| **Jar of Odds and Ends** | Thistle + Bumble | Thistle's keepsakes pay double gems |
| **The Delivery Round** | Bramble + Bumble | A collected keepsake may turn out to be a card pack |

### Two perfect trios, on purpose

- **Pip + Luna + Ember** lights all three of Nightbloom, Lantern in the Rain and The Long Watch — a
  *night-and-away* build, for someone who checks in twice a day.
- **Thistle + Bramble + Bumble** lights The Hedgerow, Jar of Odds and Ends and The Delivery Round — a
  *finds-and-gems* build, for someone who plays actively.

Neither dominates. They reward **different lives**, which is the property worth protecting as the
roster grows.

### The four rules

1. **No pair touches the `yield` pool.** Every effect is a chance, a duration, a cap or an
   upgrade-to-a-roll. Eight pairs quietly joining the harvest product would be a multiplier stack
   wearing eight names. A sim-test asserts a full loadout never changes `critterPayoutMult()`.
2. **Categorical, never "+X% more."** "A mutation at night comes in one tier higher" is a different
   thing happening; "+15% mutation chance" is Pip again, louder.
3. **Every creature sits in at least two pairs**, asserted — otherwise a creature that appeared in
   none would be strictly worse than the rest the moment pairs existed.
4. **Binary.** Both out and it is on. A bonus you cannot tell is active is not a bonus, and scaling
   it with stars would make it unreadable.

### Nightbloom is the one to watch

Upgrading Dewkissed (×2) to Gilded (×10) is a **5× jump on that harvest**, so it is deliberately a
coin flip rather than a certainty, and `nightbloomCap` stops it ever producing the top tier — **the
game's biggest moment should be found, not engineered**, the same principle that keeps Wonderfall
unpriced in [03-systems.md](03-systems.md#gems-where-they-come-from-and-what-they-buy). Both numbers
live in `PAIR_TUNING`. If the economy runs hot, this is the first dial.

### Where each pair lands

Two are worth knowing because they are not where you would guess:

- **Night Errand banks a rarity floor** in `state.luckyPacks` rather than tagging the pack, because
  `state.packs` is a count and always has been. `openPack()` spends one floor on its first card.
- **Nightbloom is applied at both mutation roll sites** — the live one and the skip path. Applying it
  at one would make it silently inconsistent.

### Discovery

The Almanac's **Companions** block lists all eight. A pair you have formed is named with its effect;
one you have not shows **both portraits with the effect hidden** — a locked thing you can see is a
goal, a missing one is nothing. `state.pairsSeen` records the first forming, which fires a banner
once and never again.

## Where they live

On the lawn **below the garden board, never on a plot** — a creature standing on a plot reads as
something to harvest.

**The yard's height is reserved as `padding-bottom` on `.stage`, and `sizeGarden()` subtracts it.**
This is not cosmetic: the board sizes itself to the stage, so on a taller viewport it grew *down over*
the yard and put a creature on top of a plot. Reserving the strip is what keeps them separate at every
screen size. Creatures take fixed spots along the yard and keep them between renders.

**No permanent name label.** The arrival banner names it and the toast names it; a tag stapled under
every creature is clutter, and Neko Atsume reveals names on interaction for the same reason.

## Art

`critters.js`, the same contract as `flora.js` — parameters in, SVG out, knows nothing about the
game. A creature is a palette and a feature list, so a new one is a data row rather than a drawing.

Pip is **original work in the kodama archetype**, not a copy of one. The game ships commercially, so
the silhouette language is borrowed and the design is not: a sprout instead of a bare head, moss
speckles, blush, and a saturated storybook palette.

**One body, a vocabulary of features.** `crown` is `sprout | spines | ears | antennae`, plus optional
`wings` (`moth` broad, `buzz` small), `tail`, `stripes` and a palette. Six creatures come out of that
and a seventh is a data row. Only ever **one crown** per creature — two turns the silhouette to mush
at thumbnail size, which is the whole test in
[05-art-direction.md](05-art-direction.md).

Five rules learned while drawing them:

- **The sprout must clear the body.** Tucked lower, the crown swallows it and the creature reads as a
  generic ghost. The sprout is the entire reason it reads as *garden* spirit.
- **Blush stays well inside the silhouette.** A cheek that crosses the outline reads as a rendering
  fault.
- **Blush and an eye highlight are what keep a pale spirit friendly.** This game is storybook-bright,
  never haunted — see [05-art-direction.md](05-art-direction.md).
- **Wings must clear the body by a wide margin.** Tucked in behind it they read as small nubs and a
  moth stops being a moth.
- **No shading band.** An `inset()` clip drew a hard horizontal seam across every creature, most
  obvious on a light body. The house style is flat fills inside one thick outline, so the band was
  off-style as well as an artifact. Stripes use a real `<clipPath>` with a unique id — an inline
  `clip-path: path()` silently did nothing, which left the bee with no stripes at all.

Motion is all CSS: a slow float, an irregular head-tilt every few seconds, a blink, a pulsing glow,
and drifting spores. The tilt is the personality and it is worth protecting.

**Presence comes from a class toggle, never from a keyframe finishing** — the trap already recorded
for the pack badge. An element that only exists once an animation has run is untappable anywhere the
animation does not play.

## State

```js
critters: {
  pip: { since, fed, gifts, met }
}
```

Nested, so it gets its **own re-merge in `load()`**. The backfill drops any creature id that is no
longer in `CREATURES` and clamps `gifts` to the creature's cap, so shortening the roster or retuning
a cap cannot brick a save. Three sim-tests cover a save from before creatures existed, an unknown
creature id, and an impossible gift count.

## What is not built

- **Only one creature.** The roster is a data array and a second entry needs no code.
- **The collection surface is a start, not finished.** The Almanac now has a **The Habitat** block
  listing every creature — met ones with their about line, trait and a Tending toggle; unmet ones as
  a greyscale silhouette with their hint and harvest progress. It is not yet a proper Completion
  screen with keepsake records or a roster count.
- **Keepsakes pay coins and gems**, which is a placeholder. They should eventually pay something
  expressive rather than currency — see the memento device in
  [17-market-and-positioning.md](17-market-and-positioning.md).
- **No interaction with weather, night or verbs.** A moth that only comes at night is one `attract`
  field away, and `Game.isNight()` already exists.

## Open questions

- Do creatures ever leave? Leaning **no** — losing one is punitive and the cosy pillar argues
  against it.
- Should a creature do something mechanical at all, or stay purely a character? The rule above says
  character first; it does not say character *only*.
- Does the roster become the collection spine in place of the card album? Two collections split the
  pull of both — see the decision log.
- How many creatures per bloom? One-to-one is legible but caps the roster at 19.
