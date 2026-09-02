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
2. **#12 · The plant-here marker is a different size in all three rooms** — Summer 30% capped at
   44px, Fall 46% uncapped, and the meadow hand-draws its own copy at 34% (see `#16`). **One glyph,
   one size rule**, all three at once.
3. **#17 · The weather tooltips are 4-10x longer than any other effect text** — one function, and
   the house register is already written in `data.js`. Also closes a hard-coded number that can
   drift from its knob. **Read the item**: the length exists to keep a promise honest, so keep that.
4. **#11 · A chip that does nothing in this room should not be in this room** — **RULED by the
   owner**: no economy change, Fall stays outside boosts, and the chips hide there. Last night's
   round already wrote this reasoning into a comment but shipped it only under a short-screen media
   query. Applies to all three chip kinds, and one booster's copy is false.
5. **#15 · Retire the season tabs and push the band buttons to the edges** — do this before `#10`:
   it widens the centre gap from 177px to ~253px and probably retires `#10`'s open question outright.
   **Read the item first**: the tabs are what the swipe-teaching coach marks point at, and they carry
   a working ready-notification.
6. **#9 · A running power-up cannot say what it is doing** — the tooltip mechanism is built and
   reusable, so this is mostly wiring. **Do `#11` first**: both edit `renderRail()`, and there is no
   point making a chip tappable in a room where it is about to stop being shown.
7. **#10 · The Collect All button is too small and too quiet** — a follow-up on last night's `#7`.
   **Do `#15` first and re-measure**: the clearance that caps it at 132px is about to change, and the
   open question may answer itself.
8. **#16 · The meadow's art is off-style and its board does not match** — **not one job, and not one
   round**: the marker folds into `#12` tonight, the board is a bounded next step, and the background
   is its own session that should start with a `meadow-spike.html` for the owner to judge.

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

### #15 · POLISH · Retire the season tabs and push the band buttons to the edges · cosmetic · reported 2026-09-01

**What the owner asked for.** "Let's remove the tabs for Spring and Fall. Now that we show the user
how to swipe left and right, let's go ahead and take them off and move the Upgrade and Power Up
buttons to the edge of the screen because it's a little too crowded at the bottom. We might also make
a note that if a player has something ready on one of the other gardens, we could slide the tab in or
show some type of notification to get their attention to move over."

**One correction to the premise, and it is load-bearing: the tabs ARE how the swipe is taught.** The
two coach marks that teach it are anchored to the tab nodes —
`el.seasonEdges.querySelector('.s-edge.l[data-season="summer"]')` and the matching right-hand one at
`ui.js:1266` and `ui.js:1271`. Both bail out with `hideCoach()` when the node is missing, so removing
the tabs **does not break anything visibly — it silently deletes both lessons.** *"Swipe left for
Fall"* and *"Swipe right for the garden"* simply stop appearing, and a player who has not learned the
gesture yet never will. The whole `.season-edges` block was written as the answer to exactly this:
*"How a player finds out sideways exists. The horizontal answer to the burrow door: a labelled thing
you can tap, beside a gesture that does the same"* (`style.css:4682`), and the burrow door it names —
the meadow's invisible gesture — is a filed known issue for this reason
(`11-known-issues.md`, *"The meadow's only door is a gesture nobody can see"*).

**So this is buildable exactly as asked, and the coach marks need a new anchor in the same commit.**
That is the work, not a reason to refuse it. They can hang off the board's edge or the screen edge
instead of a tab; the `.coach` machinery places against any measured node.

**And the notification the owner wants to add already exists — on the tab being removed.**
`seasonWaiting(id)` (`ui.js:1074`) is live and returns true when Fall has a ripe crop or an unspent
windfall mark, and `renderSeasonEdges()` renders it as `<span class="s-dot">` — a red 16px dot on the
tab (`style.css:4713`). **Removing the tabs deletes a working feature.** The owner's idea is
therefore not "build a notification" but "re-home the one we have", which is a much smaller job — and
their "slide the tab in" instinct is a good fit, because the dot's only job is to make the tab worth
looking at. Note `seasonWaiting()` is hard-coded to Fall (`if (id !== 'fall')`), so it will need
widening the day another season is built.

**Measured, at 390×844** — the numbers say the crowding is real and quantify what the move buys:

| | left | right |
| --- | --- | --- |
| Season tab | 0 → 38 | 352 → 390 |
| Band button | `.fpill` 44 → 111 | `.fround` 288 → 346 |
| Daylight between them | 6px | 6px |

The band buttons are inset **34px** (`style.css:1317`, `1326`) for one reason: to clear the tabs —
`index.html:172` says so. Take the tabs away and both can move 38px outward, which widens the gap
between them from **177px to about 253px**.

**Related — this materially unblocks `#10`.** The Collect All's 132px cap is derived from exactly
this clearance. With the buttons at the edges, a centred pill could be about **233px** wide and still
keep 10px of daylight either side — nearly double. **That very likely retires `#10`'s open question
entirely**, because the room can be found without hiding the POWER-UP button in Fall. Do `#15` first
and re-measure before deciding anything about `#10`.

Also related:
- **The tabs carry the gate copy.** A locked tab reads `Turn 3` or `Soon` beside a padlock
  (`ui.js:1094`), which is how a player learns Winter and Spring exist and when they open, without
  swiping into a gate screen. With Spring and Winter both unbuilt, removing that may well be an
  improvement — fewer locks in the player's face — but it is a real thing being removed, not just
  chrome.
- **`.in-fall .coach:not(.season){display:none}` becomes dead.** That carve-out exists solely so the
  summer-tab coach survives in Fall (`style.css:3975`); with no tab to point at, the `.season` class
  and its exception have no job.
- **`.season-edges` positions itself absolutely against `.ui` for a recorded reason** — it is *not* a
  grid item, because an item with a definite row and an auto column forced an implicit second column
  and squashed the whole interface (`style.css:4685`). If the container goes, make sure nothing
  moves into the grid to replace it.

**Fix sketch.** Stop rendering `.s-edge` buttons (keep `goSeason()`, `stepSeason()` and the swipe —
they are untouched), re-anchor the two teaching coach marks to something that still exists, and move
the ready dot to whatever replaces the tab. Change `.fpill{left:34px}` → the edge margin and
`.fround{right:34px}` likewise. **What it might break:** `.s-edge` is in the `noSwipe` list
(`ui.js:708`) and buttons moved to the very edge become the new gesture-edge neighbours — check a
swipe that starts on or beside them still reads as a season swipe rather than a button press, since
`.fpill`/`.fround` are also in `noSwipe`. Check `env(safe-area-inset-*)` on a real phone: the
recorded trap is that it is always 0 on the desktop, so a button flush to the edge looks right in the
preview and sits under the home indicator or the curve on hardware — **keep a margin rather than
going to 0**. Landscape and the ~640px short viewport both need a look. Run
`node tools/style-check.js`.

**The owner's note, recorded as the follow-on it is.** "Slide the tab in when another garden has
something ready" is the right shape and it is a *separate* item once this lands — it needs
`seasonWaiting()` widened beyond Fall, a slide-in animation, and a rule for when the tab retreats
again. Filed here rather than as its own number because it is contingent on this one; split it out
the moment this ships.

**Open question.** With the tabs gone, is a first-time player expected to learn the swipe from the
coach marks alone, or should something permanent hint at sideways — a peeked edge, a chevron? The
owner's "slide the tab in" idea answers it for a garden with something *ready*, but not for an empty
Fall on the day it opens.

---

### #16 · POLISH · The meadow's art is off-style, and its board does not match the garden's · annoying · reported 2026-09-01

**What the owner said.** "I really dislike the background and look and feel of the meadow where you
place the bees. I don't think our art style does well with long, stringy vines or grass textures. I
think it looks good at the top part of the meadow, but not at the bottom where the stone is. The tree
to the right, maybe the willow shade or whatever it is, looks really bad as well. Can we give the
meadow a nicer update to the background that's more in line with our garden with rolling hills? We've
got the fence. You could still have cobblestone… Also, we need to have and make sure that the grid
for the flowers and the honey hives match our garden. Also, the plus symbols with a little square
around them are the same type of work we're doing for fall… I think we're close, but it just needs a
fresh pass on it."

**Repro.** `node tools/probe.js wait:900 tap:#newsOk wait:500 'eval:UI.enterMeadow()' wait:1600 shot:meadow`
— the swipe is gated, so drive it through `UI.enterMeadow()` rather than a drag.

**This is three separable jobs and they are very different sizes.** Splitting them is the most useful
thing this entry does; a single "make the meadow nicer" brief produces something arbitrary.

**A · The named art faults, all in `meadow.js`.**

| The owner's words | What it is | Where |
| --- | --- | --- |
| "long, stringy vines or grass textures" | `grassBand()` — up to `w/11` individual bezier blades with seed-head ellipses, drawn twice as a back and front band | `meadow.js:85` |
| "the bottom where the stone is" | `wall()` — a dry-stone wall in three uneven courses plus a coping row, with the blades pushing through it | `meadow.js:188` |
| "the tree to the right… looks really bad" | `willow()` — thirteen hanging `mw-frond` strokes under a lumpy leaf blob on a `#8a5a33` trunk | `meadow.js:165` |
| "looks good at the top part" | `sky()` and `clouds()` — leave these alone | `meadow.js:57`, `65` |

The blades and the fronds are the same idiom — long thin strokes — and they are the two things named.
The wall's own comment argues for it (*"what a meadow has instead of a painted fence… nobody built
this last summer"*), which was a defensible call and the owner has now overruled it: they want the
garden's fence language, with cobblestone allowed to stay.

**B · The board does not match the garden's, and this is the concrete half.** The garden's plots are
brown soil in a wooden planter with a grass fringe on the rim (`.garden` / `.plot`, `style.css:518`);
the meadow's are stone setts in a tan frame (`.mw-board` / `.mw-cell`, `style.css:4140`), with locked
cells in grey cobble against the garden's grey slab. Fall's board was already brought into line with
Summer's this week (`#6`), so **the meadow is the third of three and the only one still out of
family.**

**C · The plant-here marker is a third independent copy of one glyph.** This is the piece that pairs
directly with `#12`:

| Room | How it is drawn | Size |
| --- | --- | --- |
| Summer | `Icons.get('plantSpot')` | 30% of the cell, capped 44px |
| Fall | `Icons.get('plantSpot')` | 46%, no cap — `#12` |
| **Meadow** | **hand-drawn inline in `meadow.js:269`** — its own `rect rx=11` + dashed ring + plus path | 34% |

The meadow does not use the shared icon at all; it re-draws it, with its own dash pattern
(`6 5.4`), its own stroke width and its own colours. **Fixing `#12` by matching Fall's numbers to
Summer's leaves a third set of numbers here.** Do all three at once and make the meadow call
`Icons.get('plantSpot')` like the others, so there is one glyph and one size rule.

**The structural fact that decides how much A costs.** The garden's world is **CSS layers** —
`.hills-far`, `.hills-mid`, `.hills-near` and `.fence` are `<div class="layer">` elements in
`index.html:51-67`, styled in `style.css:234-272`, with `ui-scenery.js` driving the sky gradient,
building the clouds as DOM and tinting everything for weather. The meadow's world is **one generated
SVG** from `Meadow.scene()` (`meadow.js:411`). So "give it the garden's rolling hills and fence" is
not copy-paste — it is either re-authoring those shapes as SVG paths inside the meadow scene, or
letting the meadow use the garden's CSS layers and drawing only its own furniture. **That choice is
the first decision of this job**, and the second route is much the better one if it works, because it
makes the two rooms share a world instead of imitating one.

**Recommend a spike, because this is the house practice for exactly this.** `tools/` holds eleven
`*-spike.html` benches — `fall-spike`, `hollow-spike`, `dock-spike`, `menu-spike`, `sky-spike` — and
**there is no `meadow-spike.html`**, which may be why this room is the one that drifted. An art pass
judged by eye needs the owner's eye on it before it lands in `style.css`, and a bench is how every
other room got that.

**Related.**
- **`#12`** — fold C into it as a three-room sweep rather than fixing Fall alone.
- **`#15`** — also moves furniture at the bottom of the screen; different room, but both are the
  "bottom of the screen is crowded" complaint.
- **The meadow's door is a filed known issue** (`11-known-issues.md`, *"The meadow's only door is a
  gesture nobody can see"*). Not this item, but anyone spending a session in this room should know
  the room is hard to reach at all.
- `05-art-direction.md` owns the standard this is being measured against, and
  `tools/style-check.js` enforces the part a script can hold.

**Fix sketch.** Split it: **C tonight**, folded into `#12`. **B next**, since it is bounded — bring
`.mw-board` and `.mw-cell` onto `.garden` and `.plot`'s material, borders, radii and lip. **A as its
own session**, starting with `tools/meadow-spike.html` carrying the current scene beside a
garden-language version — rolling hills, the fence, garden clouds, cobblestone kept as ground rather
than as a wall — for the owner to pick from. **What it might break:** `Meadow.scene()` is composed
against a fixed `VIEW` and a `HORIZON` constant with the willow and wall positioned against them
(`meadow.js:37`), so removing a layer shifts everything keyed to that horizon. The `mw-blade`,
`mw-frond` and `mw-flower` classes carry CSS animations that become dead selectors — grep and remove
them rather than leaving them. `.mw-jar-badge` is a recorded trap (`[hidden]` losing to a later
`display:grid`); do not disturb it. Run `node tools/style-check.js`, and check reduced motion — the
blades and fronds are what most of this room's motion currently is.

**Open question.** Should the meadow use the garden's actual CSS scenery layers, or keep its own SVG
scene re-authored in the garden's language? The first is less code and guarantees they can never
drift again; the second keeps the room able to differ. The owner asked for "in line with our garden",
which points at the first.

---

### #17 · POLISH · The weather tooltips are four to ten times longer than any other effect text · annoying · reported 2026-09-01

**What the owner said.** "The description for rain and other weather effects is a little too long and
confusing. Is there any way we can tighten it up and make it sound more normal and descriptive
without sounding so technical?… it might be worth saying something like 'everything in the garden
grows 10% faster' versus how it sounds right now." Screenshot of the Rain bubble attached.

**Repro.** Tap the sky chip in the rail during any weather.

**Measured against the game's own house style.** Every other effect description in the game lives in
`data.js` and runs five to ten words. These run forty-two to fifty-four:

| | words |
| --- | --- |
| Verb — Keeper: *"Neighbouring plots grow 15% faster."* | 5 |
| Booster — Golden Popups | 9 |
| Verb — Lantern: *"Neighbouring plots are twice as likely to drop a gem."* | 10 |
| **Weather — Wonderfall** | **42** |
| **Weather — Thunderstorm** | **45** |
| **Weather — Rain** | **49** |
| **Weather — Aurora** | **54** |

**So the target register is not something to invent — it is already written, in `data.js`.** Subject,
verb, percentage, full stop. The owner's own example — *"everything in the garden grows 10% faster"* —
is exactly a verb description.

**What makes it read as technical**, in `weatherTip()` (`ui.js:601`):

1. **"rolls for a mutation"** — dice language, and **the player never sees the word "mutation"
   anywhere else in the game.** The celebration floats the mutation's *name* and the banner says
   *"Your bloom changed"* (`ui-events.js:261`). This tooltip is the only place that names the
   mechanic instead of the thing.
2. **"at a moment of its own while it grows"** and **"If that moment lands under Rain"** — two clauses
   describing the *implementation* (one booked roll per plant) rather than anything the player does
   or sees.
3. **"about a 1 in 4 chance"** where the rest of the game uses percentages — and it is also **less
   accurate**. `Math.round(1 / w.catch)` turns the storm's 0.15 into "1 in 7", which is 14.3%, and
   the aurora's 0.12 into "1 in 8", which is 12.5%. **Percentages are both more natural and exactly
   right.**
4. **"a tenth faster"** — the owner's named example, and worse than a wording problem; see below.
5. **The storm's line is about what does not happen**: *"It does not change how fast anything
   grows."* Nothing else in the game spends a sentence on an effect it does not have.

**"A tenth faster" is hard-coded, and it can drift.** The `extra` table (`ui.js:605`) holds four
hand-written English strings, and rain's spells out `DATA.weatherStage.rainGrowth` (0.1) in words
rather than reading it. Retune that knob and the tooltip still says "a tenth". The comment directly
above the function insists the odds and multipliers are *"read from the data rather than written out,
because a tooltip that drifts from the table it describes is worse than no tooltip"* — **this one
line does not follow its own rule.** Writing it as
`${Math.round(DATA.weatherStage.rainGrowth * 100)}% faster` answers the owner and closes the drift in
the same edit.

**THE CONSTRAINT THAT MUST SURVIVE THE CUT, and it is why the copy got long.** The comment at
`ui.js:587` is emphatic: *"THE COPY IS ABOUT A CHANCE, NEVER A PAYOUT… A chip reading 'Gilded x10'
promises a per-harvest multiplier the game does not give, and a player who harvests through a whole
storm with nothing to show reads it as broken."* That is real — a plant rolls **once**, at a moment
booked when it was sown, against whatever sky stands *then*. **Shortening must not become
"Gilded x10".** Lose the lecture, keep the honesty.

**Fix sketch.** Two short sentences, house register, every number still interpolated from `DATA`. A
*shape*, not final copy — the wording is the fix round's to write and the owner's to approve:

> **Rain**
> A plant caught out in the rain has a **25%** chance of turning **Dewkissed**, worth **x2**.
> Everything in the garden grows **10% faster** while it lasts.

That keeps the chance framing — a plant is *caught out in it*, which is true and promises nothing
about every harvest — drops "mutation", "rolls" and "moment" entirely, uses percentages, and lands
near twenty words. Same treatment for the other three. The aurora's *"the garden counts as night…
so the night-lovers wake"* is the line worth keeping most of, because it is already plain. **The
storm's "it does not change how fast anything grows" should simply go** — say what a storm does and
stop.

**What it might break.** The bubble is sized by its content, and `showWeatherTip()` clamps it to
`.ui`'s measured box and slides the arrow with `--ax` (`ui.js:620`) — shorter copy changes the width
and so the clamp, so check a chip near either screen edge at 390px. Keep every number derived:
`w.catch`, `m.mult`, and now `rainGrowth`. `18-mutations-and-weather.md` owns the mechanic these
sentences describe. If `#9` lands first, `boostTip()` should be written in this same register rather
than the one being replaced.

**Open question — a small vocabulary decision worth making once.** What does the game call a mutation
*to the player*? Today the banner says a bloom "changed", the float says "Dewkissed", and only this
tooltip says "mutation". Pick one word, put it in the glossary at the top of
`32-the-garden-year.md` — which has no entry for it — and this copy, the Almanac's, and every future
one write themselves.

---

## Fixed and pruned

Last night's round, all eight, plus #14 — retired mid-day by the Growth Stages pass. Do not
re-report these.

- **#14 · A growing plant's bud sat down and to the right of its stem** — never fix-rounded, by the
  owner's ruling: the Growth Stages pass rewrote the whole stage block, and the faulty
  `transform-origin` died with the numeric stage rules it lived in. Gone by construction, ripe board
  pixel-diffed to zero against the pre-pass baseline. `db43231`, 2026-09-01. The transform-origin
  corollary trap the item proposed is recorded with the pass.

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
