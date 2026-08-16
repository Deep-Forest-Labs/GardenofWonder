# Creatures

**Status: built 2026-08-16.** One creature, end to end — Pip the Grove Spirit. Arrival, living in
the garden, petting, keepsakes, save, and 36 sim-test assertions.

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
- **No creature collection panel.** There is nowhere to see who has visited, who is missing, or what
  each one likes. That is the Completion surface and it is the obvious next piece.
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
