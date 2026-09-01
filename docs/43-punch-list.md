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

1. **#10 · The Collect All button is too small and too quiet** — a follow-up on last night's `#7`.
   **Read the item before touching the width**: 132px is a documented clearance, not a taste, and
   growing it means solving the band-button collision underneath it first.
2. **#9 · A running power-up cannot say what it is doing** — the weather chip beside it now can, and
   the whole tooltip mechanism is built and reusable. Mostly wiring plus one copy function.
3. **#11 · "Credits from all sources" does not reach Fall** — found while investigating `#10`.
   Small, but it is a doc and a booster contradicting the code, so it wants the owner's ruling
   before anyone changes a number.

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

**Open question.** Should UPGRADE and POWER-UP hide in Fall? It is the cheapest way to give this
button real room, and `#11` suggests neither does anything there — but it changes what Fall's screen
is, so it is the owner's call rather than a fix agent's.

---

### #11 · BUG · "Credits from all sources" does not reach Fall · cosmetic · found while investigating #10, 2026-09-01

**Not something the owner reported** — found while measuring `#10`'s clearance problem.

**The contradiction.** Golden Popups is described as **"+25% credits from all sources"** in its own
data (`data.js:325`) and in the boosters table at `03-systems.md:651`. Fall's harvest is a source it
does not reach: `fallHarvest()` and `fallHarvestAll()` (`game.js:3812`) both compute
`Math.round(def.yield * (1 + FALL().windfall))` and hand it straight to `credit()`, and `credit()`
(`game.js:121`) is a plain add with no multiplier in it. Every other payout path applies
`boostVal('globalCredits')` at its own call site — `game.js:1240`, `1574`, `2248`, `2429`, `4810` —
and Fall is the one that does not.

**Repro.** Spend Golden Popups, then harvest a ripe Fall crop. The payout is the plain yield.
Confirmed by reading both paths; not yet driven live.

**It may be deliberate, which is why this is filed as a question.** Fall's bed sits outside every
*growth* modifier by design, and that is recorded — no rain, no petal, no Keeper reaches it
(`11-known-issues.md`, the Sky Pass section). But that reasoning is about **growth**, and this is a
**payout** multiplier. Nothing found says a payout boost should stop at Fall's fence, and the
booster's own copy says the opposite.

**Related.** `#10` — if boosts genuinely do nothing in Fall, that is the argument for hiding the
band's POWER-UP button there and giving the Collect All its room. If this is a bug and gets fixed,
that argument evaporates and Golden Popups before a Collect All becomes a real piece of play. **So
this wants ruling before `#10` decides the layout.**

**Fix sketch.** Two honest options and they are opposite. **Either** apply
`(1 + boostVal('globalCredits'))` in `fallHarvest()` and `fallHarvestAll()`, which makes the copy
true and gives power-ups a job in Fall — and then re-measure, because a +25% on a 2.8M Century Bloom
is not the same size of gift as +25% on a Daisy. **Or** rule that Fall is outside boosts entirely,
and fix the *copy* in `data.js` and `03-systems.md` so nothing claims "all sources". Whichever way,
`03-systems.md:496` already discusses what a running boost does across the Turn and will need
re-reading. **What it might break:** the first option moves Fall's income share, and Fall's yields
are tuned at `cost x 1.4`; anything that multiplies them wants a sim-test and a look at
`33-year-one-economy.md`. The second option is free.

**Open question for the owner.** Should a power-up's payout bonus reach Fall's bed, or is Fall
deliberately outside every boost? Nothing found in the docs answers it either way.

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
