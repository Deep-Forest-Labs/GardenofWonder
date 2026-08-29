# The Big Five — the HUD and Dock Update

**Status: the owner's spec, 2026-08-30. THE SPIKE IS APPROVED WITH ANNOTATIONS and the build is
under way — `tools/dock-spike.html` carries the annotated version. See "The owner's annotations"
below; where they and the body of this document disagree, the annotations win.** The bottom of the screen rebuilds around
**five main dock buttons plus a floating pair** — the shape the big mobile games converge on
(Monopoly Go, Clash Royale), and the owner's direct design. This is a mini-phase between the
Surface run and phase 4; the wireframe gate applies in full (the owner is reviewing, and has a
reference screenshot the spike will be compared against).

**What this supersedes:** the dock plans in [15-navigation-and-ia.md](15-navigation-and-ia.md)
(third supersession — the centre-pedestal idea survives, but the pedestal is **Garden**, not
World), the morning review's §1 meter-pill question (**dissolved** — the meter moves into the
Turn button, so the pill retires and the HUD narrow-width squeeze goes with it), and the boost
tray in the rail (replaced by the floating power-up button).

## The five, left to right

| # | Button | Opens | Badge / state |
| --- | --- | --- | --- |
| 1 | **Orders & Quests** | One panel: the Stand's order queue (the existing sheet content re-homed) above the quest list | The fillable-order dot; a claimable-quest count |
| 2 | **Cards** | The album, the sets, and pack-opening | Unopened pack count. **The album star leaves the top HUD** |
| 3 | **GARDEN** — centre, raised, largest | Returns to Summer and closes any open sheet, from anywhere | The pedestal reads as *play* at a glance. **Ruled 2026-08-30: Garden only — and the map is REMOVED in this phase, not parked** (see the order-of-work rule below) |
| 4 | **Turn** | The Year panel: the pouch, **petal spending** (each flower's card), and the ceremony's CTA when the Turn is ready | **The button body IS the year-meter** — it fills as the year grows and pulses when both gates pass. The fill reads the *binding* gate (the lower of the two ratios), so "why can't I turn" is one glance |
| 5 | **Shop** | The existing shop sheet; the future home of the iOS/Android store | None yet |

## The band above the dock — the owner's sketch, 2026-08-30

The owner's drawing settles this band's whole composition: **one row between the garden and the
dock, reading left to right — [ UPGRADE ] · the tending creatures · [ POWER-UP ].**

- **Left — Upgrades.** Opens the badges sheet (Power Punch, Quick Grip, Lucky Charm, the whole
  in-year shop). The old dock's Upgrades button, relocated and always one tap away.
- **Middle — the creatures.** The three round marks in the sketch are **the pets**: the tending
  creatures stand in this band, bookended by the two buttons. This is where the yard already
  lives (the `.stage` padding row), so the creatures keep standing where they stand and keep
  their tap behavior (collect, or open the panel) — the sketch names their home rather than
  moving them. The spike must show the band with 1, 3 and 4 creatures tending, and the
  two-buttons-only state before any creature arrives.
- **Right — Power-up.** Shows **one random held boost** (Bloom Burst, Seed Rush…). Tap uses it;
  another random held boost fills the slot. Count badge for the inventory. When nothing is held
  it follows the standing rule — hidden, never a dead button (the spike may argue for a quiet
  empty state instead; that is a gate question).

**The sketch, transcribed** (the reference the spike is judged against): the garden fills the
frame's top; below it one band holding a rounded UPGRADE button, three circles (the creatures),
and a round POWER-UP button; below that the dock of five — ORDERS/QUESTS · CARDS · a taller
centre button drawn with both words **MAP / GARDEN** · TURN · SHOP — the centre visibly raised
above the row.

## What moves, what retires, what stays

- **Retires:** the meter pill (job moves to the Turn button); the album star in the HUD (job
  moves to Cards); the rail's boost chips (job moves to the power-up button); and — **ruled
  2026-08-30 — the map itself**: the World button, `overworld.js`, the camera and the
  swipe-down gesture all go. **Order-of-work rule: the Wild Meadow gets its new door first** —
  the burrow door's twin at the foot of the garden
  ([35-morning-review.md](35-morning-review.md) §4), verified end to end — and only then does
  the map come out. Never a push where the meadow has no door. The Stand's queue re-homes into
  the Orders & Quests button in the same phase.
- **Stays:** the top HUD's wallets, the Almanac book (the species/petal *record* — the Turn
  panel is where petals are *bought*), the gear, the quest strip for now (it is the one
  always-visible goal; whether the Orders & Quests badge replaces it long-term is a gate
  question, not tonight's).
- **Rooms keep their own docks.** The Hollow (and the parked meadow) are places with per-place
  docks; the Big Five is the garden-and-seasons dock. It rides along the season strip —
  Summer and Fall share it.
- **Sheets open above the dock** so the Garden button is always visible as the way home; if the
  sheet heights cannot clear the dock on short phones, the spike says so and proposes the
  compromise.

**Every function on the current dock must land somewhere named** — the spike's first frame
includes the full old-home → new-home mapping, so nothing falls off the edge silently. The
blessing picker, the ceremony, and every phase-2 surface keep working throughout; this phase
moves entries, never behavior. **No economy knob or rule moves.**

## The gate questions the spike must answer

1. Dock heights and reachability at 360–390px wide and ≤700px tall — the Big Five plus the
   floating pair plus the quest strip, measured, not asserted.
2. The Turn button's fill: legible at dock size? Pulse state vs. filling state vs. year-one
   mystery state (no numbers in year one — doc 32's rule follows the meter wherever it goes).
3. The Orders & Quests panel: one list or two tabs?
4. The power-up button's empty state: hidden or quiet slot?
5. Does the quest strip survive, shrink, or fold into badge-only?

## Acceptance

The wireframe gate (spike → owner approves against their reference screenshot → build), then
the standard gauntlet with the visual critic judging against the approved spike first and
[05-art-direction.md](05-art-direction.md) second. The five-minute script for this phase is a
navigation lap: every panel from its button, back via Garden, the Turn button through empty →
filling → ready → ceremony, one power-up used and the slot refilling.


---

## The spike — `tools/dock-spike.html`, 2026-08-30

The wireframe gate's deliverable, pushed before a line of UI code. Sixteen frames at a real
390&times;844 with an iPhone 16 Pro's insets on, using the metrics the running game reports rather
than the numbers this document asserts. Static: no `data.js`, no `game.js`.

**Read frame 1 first.** It is the old-home &rarr; new-home mapping for every function on today's
dock, HUD, rail, quest strip and gestures, plus everything the world map was the only door to.
Nothing falls off the edge silently, and three things nearly did.

| # | Frame | What it settles |
| --- | --- | --- |
| 1 | The mapping table | Every current function, and where it lands |
| 2 | Summer, the whole new bottom | The Big Five and the band, at the size they ship |
| 3 | The band at 0 / 1 / 3 / 4 creatures | The two-buttons-only state, and the four-creature ceiling |
| 4 | Where the two doors go | The corners vs. a centred pair — the sketch cannot settle this |
| 5 | The Turn button in every state | Year one, filling, the pouch chip, ready-and-breathing |
| 6 | Orders &amp; Quests | One list, two headings, above the dock |
| 7 | Cards | The album, and the pack count the HUD never badged |
| 8 | The Year panel, Turn ready | The pouch, both gates, the ceremony's button, petal cards |
| 9 | The Year panel in year one | The mystery, kept |
| 10 | Shop, and Upgrades from the band | And the tab pills that are now Craft's only home |
| 11 | The power-up, loaded and empty | The eligible pool, and the empty-state proposal |
| 12 | The meadow's door | The burrow door's twin, built first |
| 13 | 360px wide, measured | The HUD wins its 44px touch targets back |
| 14 | 700px tall, measured | The band is full: 90px of content in 91px of yard |
| 15 | The Hollow, unchanged | Rooms keep their own docks |
| 16 | The five gate questions | Answered in one place |

### The five gate questions, answered

1. **Does it fit?** Measured, yes, on frames that are really 360 wide and really 700 tall. **The
   band costs the layout nothing** — it lives in the yard `.stage` already reserves for creatures
   (108px at 390&times;844, 91px at 700), so the board is 370&times;370 before and after. The
   pedestal is taller than the dock row and `align-items:end`, so it rises without making row 5
   taller. At 700 the band is *full*: a 50px button over a 40px door at each edge is 90 of the 91,
   and the buttons tuck 3&ndash;7px under the board's lip. It works and there is nothing spare.
2. **Is the Turn button's fill legible?** Yes at 74&times;56, rising from the bottom rather than
   wiping across — a 74px button is too narrow for a horizontal wipe. Ready is the game's existing
   1.4s gold breath. **Year one is not a different button, it is a different panel.**
3. **Orders &amp; Quests: one list or two tabs?** One list, two headings. The badge counts two
   different things and tabs would hide half of what the player came in for.
4. **The power-up's empty state?** **A quiet drained slot, recommended and arguable.** The locked
   season edge is the precedent: drained paper is how this game says *a promise you can read*.
   Hidden costs the sketch its symmetry in the first session and teaches a new player nothing about
   where boosts come from.
5. **Does the quest strip survive?** Unchanged. It is the one always-visible goal; a count is not a
   goal. Revisit when orders return in slice D.

### Three questions this document did not ask, which the mapping turned up

- **The Apothecary has no named home.** Doc 36 lists five buttons and a floating pair and never
  mentions Craft. It does not fall off the edge — the three shop panels share a tab pill row, so
  Shop &rarr; Craft is two taps — but it goes from a top-level button to a tab inside another shop,
  and that demotion should be the owner's, not a side effect.
- **The land parcels die with the map.** The only thing the map held with no new home. They were a
  promise about land in a game that will no longer have a map of land. Recommended: let them go,
  deliberately; [25-world-map.md](25-world-map.md) owns them.
- **May the Turn panel exist at all in year one?** Doc 32's mystery rule says the meter fills
  unexplained, and a Turn button in the dock is a door a player will push in the first minute.
  Proposed: in year one the panel *is* the mystery — the meter drawn large, the flower's existing
  line, and nothing else. The explanation still arrives where it always did, in the ceremony's ask.

### Two things already broken, found while mapping and not fixed here

Both are recorded in [11-known-issues.md](11-known-issues.md).

- The `stores` sheet (the honey and beeswax pantry) is written, registered in both the title and
  render maps, and **opened by nothing** — a repo-wide search finds no caller.
- A card cell in the album renders as a `<button data-card>` and **no handler reads it**. The Cards
  button is about to send far more traffic there.

### What the build then does, in order

1. **The meadow's door first**, on its own, verified end to end. Never a push where the meadow has
   no door.
2. The Big Five and the band. The meter pill retires into the Turn button, the album star into
   Cards, the rail's *buyable* chips into the power-up button — the rail keeps its countdowns and
   the Wonder chip, and stays `:empty{display:none}` the rest of the time.
3. The four panels, each stopping above the dock so the Garden button is the visible way home.
4. **Then** the map's removal — the World button, `ui-map.js`, `overworld.js` and the swipe-down.


---

## The owner's annotations, 2026-08-30 — these supersede the body above

Given against the spike. **Verbatim intent, folded into the spike before any UI code.**

1. **A panel may cover the dock.** "The slide-ups can overlay the menu since there's a close button
   on each one." **This supersedes "Sheets open above the dock" above** — the sheet does not move at
   all, and the Garden button is not a second way home while a panel is open. Zero lines of CSS.
2. **No door graphics for the Hollow or the meadow.** The vertical swipe is the way to a room, and
   learning it is the point: **down goes under to the Hollow, up goes out to the Wild Meadow.** The
   Hollow's direction therefore flips — the old *up goes in, down pulls back to the map* rule dies
   with the map, and the Hollow is underground. The meadow's only teacher is a one-time line from
   the flower; **this is the phase's one real discoverability risk and it is named in
   [11-known-issues.md](11-known-issues.md).**
3. **The season tabs stay exactly as they ship** — both edges, locked and persistent, drained paper
   with the Turn that opens them. They are what teaches sideways. **The band's two buttons sit
   *inside* them**: inset 34px from the column, which clears a 38px tab by 6px.
4. **The order rows are redesigned to a stated hierarchy** — who is asking, what they asked for, and
   then, biggest of all, **the things you owe them**. The count no longer sits on top of the bloom:
   the token is a 52px tile with the art on top and the count in its own band underneath.
5. **The power-up's empty state is the quiet drained slot.** "It's okay to have an empty POWER-UP
   frame — we just have it as the drained version, and there's nothing there yet."
6. **Year one is locked, mysterious, and never directionless.** "Something can be mysterious and fun,
   but something that's mysterious and fun with no direction feels broken." The Turn panel in year
   one shows a padlocked meter and **one track — the gold** — with no numbers on it, and the flower
   says what to do about it. The pouch, the petals and the second gate all still wait for the first
   Turn.
