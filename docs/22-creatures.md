# Creatures

**Status: built 2026-08-16.** One creature, end to end — Pip the Grove Spirit. Arrival, living in
the garden, petting, keepsakes, **traits and tending**, a habitat block in the Almanac, save, and 58
sim-test assertions.

This is the first step of the **habitat direction** agreed 2026-08-16. Reasoning in
[10-decision-log.md](10-decision-log.md).

## The reframe this belongs to

Everything before this thought in **production chains** — garden makes flowers, bench makes goods,
market consumes goods. That is Township, and it is not what this audience wants. The research in
[17-market-and-positioning.md](17-market-and-positioning.md#who-this-game-is-for) says the likely
audience is **69% female with Completion and Fantasy as the top two motivations**, and neither of
those is "optimise a supply chain."

**The garden is a place that becomes alive because of what you plant.** The reward for playing is
that your garden gets more inhabited, not that a number gets bigger.

The owner's diagnosis is what started it: the world had a *place* and a *character*, but no
*inhabitants* — nothing lived there except the talking flower.

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
keepsake: { name: 'Mossy Pebble', every: 900, cap: 3, gems: 1, credits: 250 }
```

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
HABITAT_SLOT_LEVELS = [1, 8, 14, 20]   // slots = how many of these the level has passed
```

**Only tending creatures stand in the yard.** Four is the most the lawn holds before it reads as
clutter, so a resting creature leaves the screen — but it is still home, still in the Almanac roster,
and still one tap from coming back. Nothing is ever taken away, which is what keeps this cosy; having
more creatures than slots is what makes "which three are out" a decision, and that decision is the
strategy layer.

A tending creature wears a leaf badge, so the state is legible from the garden itself.

**Where resting creatures live is an open design space and a good one.** The owner's instinct is a
farmhouse or den you can visit — see them lounging, feed them, and swap the loadout there instead of
in a list. That is the Neko Atsume yard applied to the bench half of the roster, and it is the natural
home for feeding, naming and any relationship mechanic later.

### Pip's trait

| Trait | Category | Effect |
| --- | --- | --- |
| `mutationLuck` — *Coaxes the Sky* | chance | Plants are **25% more likely** to catch the weather |

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

## Where they live

On the lawn **below the garden board, never on a plot** — a creature standing on a plot reads as
something to harvest. `#critterYard` is absolutely positioned over the bottom of the stage, so it
overlays the lawn rather than adding a row that pushes the whole stage down past the dock. Creatures
take fixed spots along it and keep them between renders.

**No permanent name label.** The arrival banner names it and the toast names it; a tag stapled under
every creature is clutter, and Neko Atsume reveals names on interaction for the same reason.

## Art

`critters.js`, the same contract as `flora.js` — parameters in, SVG out, knows nothing about the
game. A creature is a palette and a feature list, so a new one is a data row rather than a drawing.

Pip is **original work in the kodama archetype**, not a copy of one. The game ships commercially, so
the silhouette language is borrowed and the design is not: a sprout instead of a bare head, moss
speckles, blush, and a saturated storybook palette.

Three rules learned while drawing it:

- **The sprout must clear the body.** Tucked lower, the crown swallows it and the creature reads as a
  generic ghost. The sprout is the entire reason it reads as *garden* spirit.
- **Blush stays well inside the silhouette.** A cheek that crosses the outline reads as a rendering
  fault.
- **Blush and an eye highlight are what keep a pale spirit friendly.** This game is storybook-bright,
  never haunted — see [05-art-direction.md](05-art-direction.md).

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
