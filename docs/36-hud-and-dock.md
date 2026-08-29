# The Big Five — the HUD and Dock Update

**Status: the owner's spec, 2026-08-30. Not built.** The bottom of the screen rebuilds around
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
| 3 | **GARDEN** — centre, raised, largest | Returns to Summer and closes any open sheet, from anywhere | The pedestal reads as *play* at a glance. *(The sketch writes both MAP and GARDEN on this button — the owner's verbal spec says Garden; whether the word MAP survives on it, or the map returns here later, is an open question flagged to the owner)* |
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
  moves to Cards); the rail's boost chips (job moves to the power-up button); the dock's
  **World** button (the map stays reachable by the swipe-down gesture, which stays live —
  **map and meadow are explicitly on hold by the owner's call, untouched and unretired**).
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
