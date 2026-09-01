# The Punch List — the working queue of bugs and polish

**This is the day's working queue, fed by the owner playing the game.** Items arrive as they are
noticed, get a number, and get investigated far enough that a fix agent starts warm rather than
cold. Nothing here is fixed by the keeper of this file — the list becomes the brief for a separate
fix round.

The permanent record is [11-known-issues.md](11-known-issues.md). This file is the short-lived half:
a fixed item is pruned to the graveyard at the bottom with its commit, and anything that turns out
to be long-lived — accepted, deferred, or a decision rather than a defect — graduates into
`11-known-issues.md` and leaves here. **The repo is the source of truth; where this file and the
code disagree, this file is stale.**

Severity is `blocker` (cannot play past it), `annoying` (the player notices and minds), or
`cosmetic` (the player might notice).

---

## Tonight's round

1. **#13 · Halve the rain and storm beds** — one number each, and the instrument to prove it already
   exists. **Read the item**: the obvious knob also halves the thunder, and there is a knob that
   does not.
2. **#12 · Fall's empty-plot marker is 1.5x Summer's** — three CSS declarations, measured, and the
   owner asked for it by name.
3. **#11 · A chip that does nothing in this room should not be in this room** — **RULED by the
   owner**: no economy change, Fall stays outside boosts, and the chips hide there. Last night's
   round already wrote this reasoning into a comment but shipped it only under a short-screen media
   query. Applies to all three chip kinds, and one booster's copy is false.
4. **#9 · A running power-up cannot say what it is doing** — the tooltip mechanism is built and
   reusable, so this is mostly wiring. **Do `#11` first**: both edit `renderRail()`, and there is no
   point making a chip tappable in a room where it is about to stop being shown.
5. **#10 · The Collect All button is too small and too quiet** — a follow-up on last night's `#7`.
   **Still gated on an owner decision**: 132px is a documented clearance, and `#11`'s ruling frees at
   most half the strip.

---

## Items

### #9 · POLISH · A running power-up cannot say what it is doing · annoying · reported 2026-09-01

**What the owner asked for.** "Tapping on a power up at the top, once it's been activated, should
also show a tooltip exactly how we do weather effects to show what the power up does, so a player
can tap and see what it's doing."

**Repro.** Spend a power-up from the round button in the band. It appears as a countdown chip in the
rail under the quest bar. Tap it — nothing happens. Tap the weather chip sitting immediately to its
left and a tooltip opens. **Two chips in the same row, one explains itself and one does not.**

**The likely cause — the boost chips were never converted.** `renderRail()` (`ui.js:648`) builds
booster and Wonder chips as `<div class="chip timed">`, exactly as it did before last night. Only
`weatherChip()` (`ui.js:580`) emits a `<button>` carrying `data-wx`, and the delegated listener at
`ui.js:885` matches `[data-wx]` alone.

**The good news: the mechanism is built and it was built to be reused.** `showWeatherTip()`
(`ui.js:620`) already solves every hard part — it places the bubble in viewport coordinates, clamps
it to `.ui`'s measured box rather than the window (so it cannot sail into the grey on a desktop),
slides the arrow with `--ax` to stay on the chip, toggles closed on a second tap, and lives **outside**
the rail so the once-a-second rebuild cannot eat it. None of that needs rethinking; it needs
generalising.

**And the copy already exists.** `DATA.boosters[].desc` is written as player-facing prose —
*"+50% tap power and +2% crit chance for 30s."* — and `renderPowerUp()` already assembles
`Use ${def.name}. ${def.desc}` for the button's `aria-label` (`ui.js:718`). A `boostTip()` is
`<b>name</b><br>desc`, not a writing job.

**The traps.**
- **The identity key is weather-specific.** `el.wxTip.dataset.wx` holds the id, and the
  close-when-gone guard at `ui.js:677` queries ``[data-wx="..."]``. Generalising means one shared
  attribute — `data-tip` — used by all chip kinds, or a boost chip's tooltip is never cleaned up.
- **A boost expires on its own clock, and the weather chip never did.** This is the sharper case and
  the reason the guard matters more here than it did for `#2`: a player can have the tooltip open at
  the instant the boost runs out, and the chip vanishes underneath it. The guard already handles
  this shape — it just has to cover the new attribute.
- **`.chip.timed` is styled as a div.** Turning it into a `<button>` needs the usual reset
  (`background:none;border:0;padding` as authored, `touch-action:manipulation`) or it inherits UA
  button styling and the ring countdown inside it shifts. The rail is already in `noSwipe`
  (`ui.js:708`), so no gesture work is needed.
- **The Wonder chip is the third kind in that row.** The owner named power-ups; the Wonder is a
  different thing wearing the same chip. Leaving it as the one silent chip of three re-creates
  exactly the inconsistency this item exists to close. Cheap to include — recommend including it.

**Fix sketch.** Rename the tooltip's hook from `data-wx` to a generic `data-tip` carrying a kind and
an id (`data-tip="boost:bloom"`), and split the body builder into `weatherTip()` / `boostTip()` /
`wonderTip()` behind one `tipFor(key)`. Emit all three chip kinds as `<button>`s. Point the listener,
the outside-click dismiss (`ui.js:896`) and the close-when-gone guard at the new attribute.
**What it might break:** the rail's `dataset.sig` is the whole row's markup, so adding attributes
changes the signature — harmless, but confirm the once-a-second rebuild still short-circuits when
nothing has actually changed. The weather chip is deliberately **first** in the row so the one
tappable chip never needs scrolling to (`ui.js:665`); with every chip tappable that comment is no
longer the reason, and the ordering should be re-justified or rewritten rather than left lying.
`06-audio-and-fx.md` — `showWeatherTip()` plays `open`; three chips opening tooltips is more of that
sound than one was.

**No open question.** The pattern to copy is in the file.

---

### #10 · POLISH · The Collect All button is too small and too quiet for what it celebrates · annoying · reported 2026-09-01

**What the owner saw.** "The 'Collect All' button, when you have all eight crops filled up in the
Fall, should be a little bit wider and a little bit larger and a little more celebratory, maybe with
a shine or something on it. It felt a little underwhelming and kind of hard to see on the page."

**Repro.** Fill and ripen Fall's bed (Developer tools → *Fill the bed*, *Ripen the bed*) and look at
the button below the board.

**Read this before changing the width — 132px is a clearance, not a taste.** `.fl-collect`
(`style.css:4646`) is capped at `max-width:132px` and the comment above it records why: the band's
two buttons are in the same strip — **UPGRADE 34px in from the left, POWER-UP 34px in from the
right — and neither is hidden in Fall.** A full-width pill overlapped both on a 667-tall phone.
132px centred is what leaves at least 10px of daylight either side at every viewport this game
supports, and it is why the label wraps to two lines. **So "wider" is not a number to raise; it is a
collision to solve first.** Raising it without touching the band reproduces the exact bug that
number was written to fix.

**The way out is probably that the band has nothing to do in Fall** — see `#11`. None of the four
power-ups reaches Fall's bed: `fallHarvestAll()` (`game.js:3812`) and `fallHarvest()` pay
`def.yield x 1.5` with no `boostVal('globalCredits')` anywhere in the path, and growth boosts do not
reach Fall either (recorded in `11-known-issues.md`, the Sky Pass section). Upgrades are Summer's
shop. If that is right, hiding `.fpill` and `.fround` under `.in-fall` frees the whole strip and the
button can be as wide as it deserves — but that is a design decision about what Fall's chrome is, so
it belongs to the owner, and `#11` may change the premise.

**On "a shine" — the house already has one, twice.** `@keyframes sweep` (`style.css:968`) is the
ready-plot shine, a 100deg band at an 8deg tilt; `@keyframes turnShine` (`style.css:1284`) is the
same band on the Turn button, parked off the edge until the meter is ready. **The Turn button is the
right precedent**: it is the game's other "you earned this" moment and it already wears this exact
treatment. Reuse it rather than inventing a third shine.

**What the button has today**, so nobody adds a second copy of it: a gold gradient
(`#ffe98a` → `--coin`), a 3px ink border, the standard `0 4px 0` lip, and a pulsing halo on a
`::before` running `affordPulse`. The halo is already there — it is evidently not carrying the
moment on its own.

**Related.**
- **`#7` shipped it and this is the follow-up**, not a re-report.
- **The absolute positioning is load-bearing.** `.fl-collect` is `position:absolute` against
  `.fl-wrap` specifically so appearing and disappearing can never move the board — it lands in a
  `place-items:center` grid and a new row there would slide the board up at the instant the player is
  looking at it. That was `#6`'s whole fault; **do not turn this back into a flow element to make it
  bigger.**
- **The halo rides a pseudo-element on purpose.** `affordPulse` writes `transform`, and the button's
  own `transform:translateX(-50%)` is its centring — putting the animation on the button throws the
  centring away. Same shape as the recorded `box-shadow` lip trap. Any new shine goes on a
  pseudo-element too.
- **It is in `noSwipe`** and must stay there, or a tap that drifts leaves the season instead of
  collecting.

**Fix sketch.** Settle the band question first (hide `.fpill`/`.fround` in Fall, or accept the
132px). Then: raise the type, put the value on its own line at a larger size, and add the
`turnShine` band on a second pseudo-element — `::before` is taken by the halo, so `::after` with
`overflow:hidden` on the button and the band parked off-edge between passes. Keep the absolute
centring and the `translateX(-50%)` in every `transform` you write, including `:active`.
**What it might break:** `.fl-collect:active` already restates the full transform for exactly this
reason — keep that. Growing the button downward moves it toward the dock; re-check the ~640px short
viewport from the conventions checklist and landscape. Run `node tools/style-check.js` — a new
gradient, radius or border width is what it ratchets on. And reduced motion: a shine that is the
*only* thing marking the button as special fails the recorded rule that a visual state must never
depend on a keyframe having run, so the size and colour have to carry it with motion off.

**Open question, narrowed by `#11`'s ruling on 2026-09-01.** The owner has ruled that a power-up
doing nothing in a room should not be *shown* there. That settles the rail chip; it does not settle
this button, and the two are different — hiding a chip removes information, hiding a button removes
an action, and a boost spent in Fall still runs when the player swipes home. **UPGRADE is out of
scope either way**: the shop works fine from Fall, so the ruling does not touch it, and it is the
button 34px in from the LEFT. So the most this item can currently assume is half the strip. If the
owner wants the full width, they have to say the POWER-UP button hides too.

---

### #11 · POLISH · A chip that does nothing in this room should not be in this room · annoying · found while investigating #10, 2026-09-01 · RULED 2026-09-01

**Found while measuring `#10`'s clearance problem**, filed as a question, and answered by the owner
the same day.

**The finding.** Golden Popups is described as **"+25% credits from all sources"** in its own data
(`data.js:325`) and in the boosters table at `03-systems.md:651`, and Fall's harvest is a source it
does not reach. `fallHarvest()` and `fallHarvestAll()` (`game.js:3812`) compute
`Math.round(def.yield * (1 + FALL().windfall))` and hand it straight to `credit()`, which
(`game.js:121`) is a plain add. Every other payout path applies `boostVal('globalCredits')` at its
own call site — `game.js:1240`, `1574`, `2248`, `2429`, `4810`. Fall is the only one that does not.

**THE OWNER'S RULING, 2026-09-01.** *"If a user scrolls to fall or winter or wherever else that you
can't use power-ups, then we just hide the power-up that's in effect on that garden. Obviously, if
they move back to the garden where the power-up is in effect, it should show."*

**So Fall stays outside boosts, and the fix is display, not economy.** Nothing about the payout
changes; no number moves; `33-year-one-economy.md` is untouched. What changes is that a running
power-up's chip stops being shown in a room where it is doing nothing, and comes back when the
player swipes home. The booster copy still has to stop saying "all sources" — that half is a real
correction and it lands in `data.js` and `03-systems.md:651`.

**Last night's fix round already reached this conclusion and only half-applied it.** The comment at
`style.css:4613` says it outright: *"The rail loses the tie-break because a booster and the Wonder
Effect act on the GARDEN: there is nothing in Fall for them to do and nothing there to tap… Swipe
back and it is there."* But it is written as a **space** tie-break and shipped inside
`@media (max-height:700px)`, so on any phone taller than 700px the useless chip is still sitting
there. **The owner's ruling promotes that from a short-screen compromise to a rule that holds at
every height**, and the media query can go.

**Apply it to all three chip kinds, because all three fail the same test in Fall.**

| Chip | Does it reach Fall's bed? | |
| --- | --- | --- |
| The four boosters | No — no `boostVal` in either Fall harvest path, and growth boosts do not reach Fall either (`11-known-issues.md`, Sky Pass section) | hide |
| The Wonder Effect | No — `wonderMult()` (`game.js:2103`) is not called anywhere in Fall's payout | hide |
| The sky | No — rain does not water Fall's bed, and **Fall's cells carry no mutation at all** (nothing in `ui-fall.js` or Fall's cell shape references one) | hide |

The sky chip is the one worth pausing on: it shipped last night with a tooltip whose first sentence
is *"Every plant rolls for a mutation once, at a moment of its own while it grows"* — **which is
false of everything on Fall's board.** Hiding it in Fall is the same ruling and it also stops a
tooltip lying.

**Related.**
- **`#10`** — this was gating it. See the fix sketch for what it does and does not unblock.
- **`#9`** — if the boost chips become tappable there, they must be tappable only where they are
  shown; the two items touch the same `renderRail()`.

**Fix sketch.** Filter in `renderRail()` (`ui.js:648`) on the room rather than hiding with CSS, and
delete the `@media (max-height:700px)` block at `style.css:4625`. **The rail's box is already
reserved and this is why it is safe**: `.rail{min-height:33px}` (`style.css:506`) exists precisely so
the track never collapses — a logged decision, because a board that changes size when a chip appears
is the layout moving under the player. So an empty rail in Fall keeps its row, `.stage` does not
grow, and `#6`'s alignment holds. That also makes the JS filter *cleaner* than the `visibility:hidden`
workaround it replaces. **What it might break:** the sig-cache at `ui.js:672` keys on the markup, so
the row rebuilds correctly on a season change only if `renderRail()` actually runs then — check that
`goSeason()` triggers it, or the chips linger until the next tick. `#9`'s tooltip close-when-gone
guard has to fire on a season change too, or a tooltip is left floating over Fall.

**The copy fix, which is separate and unconditional.** `data.js:325` and `03-systems.md:651` both say
"+25% credits from all sources". Whatever happens to the chips, that sentence is false and should say
what it means — the garden's sources.

**Open question — still the owner's, and NOT settled by this ruling.** Should the band's **POWER-UP
button** also hide in Fall? It is a different kind of thing: hiding a *chip* removes information
that is irrelevant here, which costs the player nothing, while hiding the *button* removes an action
— and spending a boost in Fall is not useless so much as badly timed, since it keeps running when
the player swipes home. `#10` wants that room, so the answer matters. Note that UPGRADE does not fall
under the ruling either way: the shop works fine from Fall.

---

### #12 · BUG · Fall's empty-plot marker is half again the size of Summer's · cosmetic · reported 2026-09-01

**What the owner saw.** "The boxes, the dotted outline boxes with the plus sign in the center that
you tap to choose a crop or plant a seed, are different sizes… The main garden has the ones I really
like: the smaller outlines with the plus in the center. The fall garden has much larger ones that are
more prominent… Please match the original garden ones." Two screenshots attached, and they show
exactly what the ruler says.

**Repro.** Look at an empty plot in the garden, swipe to Fall, look at an empty plot there.

**Measured live at 390×844, both boards.** The tiles are identical, so nothing here is a knock-on
from layout — it is the marker itself:

| | Summer `.empty-mark` | Fall `.fl-empty` |
| --- | --- | --- |
| Tile | 110 × 110 | 110 × 110 |
| Marker `<svg>` | **32 × 32** | **48 × 48** — exactly 1.5× |
| Declared size | `width:30%;height:30%` | `width:46%;height:46%` |
| Ceiling | `max-width:44px` | **none** |
| Opacity | `.62` | `.85` |
| Extra | — | `filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))` |

**The likely cause — it is three declarations, and it looks unconsidered.** Both markers draw the
same glyph: `Icons.get('plantSpot')`, from `ui.js:42` and `ui-fall.js:68`. Only the CSS differs —
Summer at `style.css:902`, Fall at `style.css:4502`. Worth noting for whoever picks this up: nearly
every deliberate number in this file carries a comment explaining itself (`.fl-collect`'s width has a
whole paragraph); `.fl-empty` has none. The 46% reads as a value typed while building Fall's board
rather than a decision anyone made.

**The gap widens on bigger screens, which is the part the screenshots cannot show.** Summer's
`max-width:44px` caps its marker; Fall has no cap and keeps scaling with the tile. At 390px it is
32 against 48. At the 560px column cap the tile is ~172px, where Summer holds at 44 and Fall reaches
~79 — **nearly double.** So matching Summer means carrying the ceiling across too, not only the
percentage.

**Related.** Nothing in `docs/` specifies either number; `08-ui-and-layout.md` does not describe the
empty marker at either size, so no document goes stale. `#6` and `#7` were the other two
Summer-versus-Fall consistency items and both are fixed — this is the third of the same family and
suggests a sweep is worth doing once rather than a fault at a time.

**Fix sketch.** Give `.fl-empty svg` Summer's numbers: `width:30%; height:30%; max-width:44px`, and
take `.fl-empty`'s opacity from `.85` to `.62`. Drop the `drop-shadow` — Summer's has none, and
"consistent" is what was asked for. **What it might break:** Fall's soil is a darker gradient than
Summer's (`#7e5e42 → #453221` against Summer's lighter plot), so a marker that reads comfortably at
.62 on Summer's soil may go faint on Fall's. That is the neighbouring case to the recorded trap that
a dark contact shadow on a dark surface is not a contact shadow — **look at it after the change
rather than trusting the numbers matching.** If it genuinely does not read, keep the size and cap
identical and lift only the opacity, with a comment saying why the two differ. Run
`node tools/style-check.js`. Check the ~640px short viewport and a wide one, since the ceiling is the
half that only shows up there.

**No open question.** The owner named which of the two is right.

---

### #13 · POLISH · The rain and storm beds are twice as loud as the owner wants · annoying · reported 2026-09-01

**What the owner asked for.** "Reduce the background rain/wind noise that we moved to the ambient
track by 50%."

**Read as rain and storm, not the whole channel.** Those are the two *noise* beds — filtered hiss,
which is what "rain/wind noise" describes. The aurora and the Wonderfall are tonal pads, and the
flower's hummed song and the thunder ride the same bus. Halving the channel would take all of them
down. If the owner did mean everything on the ambient track, that is `HOUSE.amb` instead
(`audio.js:23`) and it is the same size of change — one number — so this is a note, not a blocker.

**Where they stand today**, measured with `node tools/bedbench.js`, which renders the real graph
offline through `Sound.renderBed()` rather than a copy of its constants:

| bed | rms | phone rms | phone swing |
| --- | --- | --- | --- |
| **rain** | 0.02063 | 0.02200 | 2.92 dB |
| **storm** | 0.02034 | 0.02179 | 2.19 dB |
| aurora | 0.01195 | 0.01229 | 8.78 dB |
| wonderfall | 0.01005 | 0.01118 | 7.35 dB |

Rain and storm sit at roughly **1.7x the aurora and 2x the Wonderfall**, which is consistent with
them being the two the owner notices. A 50% amplitude cut is **−6.02 dB** and lands them near 0.0103
rms — level with the Wonderfall and a little under the aurora, i.e. the quietest things on the bus.
That is the predicted outcome, not an objection; it is here so the fix round knows what it should
measure afterwards.

**THE TRAP: the obvious knob takes the thunder with it.** `DATA.weatherStage.storm.bed` (0.34) is
the tempting place to halve, and it is the wrong one. `rel(id)` (`audio.js:422`) is
`knob(id) / BED_DEFAULT[id]`, and **`crack()` and `rumble()` both scale their gain by
`rel('storm')`** — so halving the storm's bed knob halves every thunderclap along with the hiss, and
the owner asked for neither. The same shape applies to `sing()`, which scales by `rel('wonderfall')`.

**The knob that does only what was asked is `BED_TRIM`.** `bedGain(id)` is
`min(knob(id) x BED_TRIM[id], BED_CEILING)` (`audio.js:421`), and `BED_TRIM` sits **downstream of
`knob`** — `rel()` never reads it. So halving `BED_TRIM.rain` (1.35 → 0.675) and `BED_TRIM.storm`
(1.2 → 0.6) halves exactly the two beds and touches nothing else. `BED_CEILING` (0.85) is nowhere
near binding: the current products are 0.405 and 0.408, and halved they are ~0.203 and ~0.204.

**Related.**
- **`#1` re-derived `BED_TRIM.storm` last night** — 1.9 → 1.2 — as part of putting rain back into the
  storm, and the point of that work was that the number is *measured*. Changing it again is fine, but
  it is a deliberate loudness change layered on a calibration, so **re-run `bedbench.js` and record
  the new figures** rather than leaving the doc quoting the old ones.
- **The ambient slider is not the place either.** `#3` shipped `ambVol`, and dropping its default to
  0.5 would work — but it halves the whole channel (same over-reach as `HOUSE.amb`) and it makes the
  slider's own maximum louder than the owner wants, so a player who nudges it up gets today's level
  back. The default should stay 1.0 = the intended sound.
- `06-audio-and-fx.md` carries the beds' table and the bus diagram; both quote levels.

**Fix sketch.** Halve `BED_TRIM.rain` and `BED_TRIM.storm` in `audio.js:412`, leaving `BED_DEFAULT`,
`DATA.weatherStage.*.bed`, `HOUSE.amb` and every slider alone. Re-run `node tools/bedbench.js` and
put the new rms figures into `06-audio-and-fx.md` in the same commit. **What it might break:** the
comment above `BED_TRIM` explains the trims as a *calibration* that lands each bed near a common
loudness — after this they are a calibration plus a deliberate 6 dB cut on two of four, so the
comment has to say that or it becomes false. Check the phone-swing column has not moved: the breath
is a proportion of the level, so it should hold at ~2-3 dB, and a bed that stops breathing at low
volume is the exact fault `#1` was filed for. Also check the duck still reads — `duck()` drops the
effects bus to 950 Hz while rain stands, and a rain half as loud ducking the same amount may now be
quieter than the thing it is ducking.

**No open question**, beyond the reading noted at the top: rain and storm, not the whole bus.

---

## Fixed and pruned

Last night's round, all eight. Do not re-report these.

- **#1 · The Thunderstorm's bed was a featureless drone** — rain's upper bands added to the storm,
  breath moved onto the audible half, `BED_TRIM` re-derived. `3f4de68`, with the measuring
  instrument that proves it.
- **#2 · A standing sky said nothing about what it was doing** — a tinted, tappable chip in the rail
  with a tooltip. **Shipped deliberately WITHOUT a countdown** (a countdown to this sky's end is a
  countdown to the next one's start, which rebuilds the forecast panel ruled out on 2026-08-31); the
  owner can reopen that. `abb55f1`, changelog line in `49ecf22`. The tooltip built here is what `#9`
  now reuses.
- **#3 · Effects, ambient and music were three buses behind two switches** — three channels, each
  with a slider and a mute. `b196d3c`.
- **#4 · The app icon was a yellow faceless flower** — rebuilt from `Flora.talkingFlower()`, eyelids
  dropped. `e6a0540`.
- **#5 · No cheat jumped ahead Turns** — a Turn-jump that credits until `turnReady()` rather than a
  flat amount, so it does not stall at Turn 4. `9297273`. *(Spring and Winter are still unbuilt —
  the cheat reaches the gate, not a garden. Slices C and E.)*
- **#6 · Fall's board sat 23px high with a 73% flower** — `d4687c3`.
- **#7 · Fall's windfall had no payoff moment** — pill moved above the board, an atomic
  `Game.fallHarvestAll()`, and the Collect All button. Same commit as `#6`, `d4687c3`. **`#10` is the
  follow-up on how it looks, not a re-report.**
- **#8 · The gem skip chip counted down every second** — countdown removed from the visible label,
  kept in the `aria-label`, and the reversal logged. `ef19afc`.
