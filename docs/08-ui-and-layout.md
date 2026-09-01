# UI and Layout

## This is a phone game, and the layout says so

**The game is composed at phone size and a desktop window shows that same phone column, centred.**
`.ui` is `max-width: 560px; margin: 0 auto` — that one line is what keeps the garden looking
deliberate on a laptop instead of stretched. The scenery behind it is full-bleed and bleeds out to
the window edges; only the *interface* is capped.

**A place layer sits OUTSIDE `.ui` and inherits none of this.** `.hollow` is inside `.ui` and gets
it for free; `.meadow-layer` and `.map-layer` are siblings of `.ui` at `#world` level, because they
have to paint under it. So **every room built as a layer must re-state the column itself** — the
same cap, the same padding, the same rows. The meadow shipped without it and was the only screen in
the game whose dock ran the full width of a desktop window; next to the garden it read as a
different, worse game. `.mw-ui` is the worked example.

The same rule governs the art: **a room's scene must be drawn at the size the room actually
measures.** The meadow's backdrop was composed at 390×844 and rendered with
`preserveAspectRatio="slice"`, so a 1440-wide window scaled every blade of grass by nearly four.
See [05-art-direction.md](05-art-direction.md#draw-the-scene-at-the-size-the-room-really-is).

## The layout contract

One screen, never scrolling, never zooming. The garden owns as much of it as possible. Anything
that isn't the garden either sits in a fixed band at the top or bottom, or slides over the top as a
sheet the player asked for.

```
┌─────────────────────────────┐
│  wallets          book gear │  hud          (row 1, auto)
├─────────────────────────────┤
│  ⑦ ▓▓▓  Harvest 3 roses     │  quest strip  (row 2, auto — always visible)
├─────────────────────────────┤
│  boost countdowns           │  rail         (row 3, reserved — hidden if short)
├─────────────────────────────┤
│                             │
│      ┌───┬───┬───┐          │
│      │ P │ P │ P │          │  stage        (row 4, 1fr)
│      ├───┼───┼───┤          │
│      │ P │ 🌸│ P │          │
│      ├───┼───┼───┤          │
│      │ P │ P │ P │          │
│      └───┴───┴───┘          │
│                             │
├─────────────────────────────┤
│  [UP]   pets pets   [PWR]   │  the band     (in the stage's own yard)
├─────────────────────────────┤
│ Orders Cards (GARDEN) Turn Shop │ dock   (row 5, auto — the centre rises)
└─────────────────────────────┘
```

**The band costs the layout nothing.** `.stage` already reserves a yard along its bottom for the
creatures (`--yard-h`, 108px at 390×844, 91px at 700); the two floating controls move into the two
ends of that same strip. The board measures 370×370 before and after. Both are inset 34px from the
column so they clear the 38px season edge tabs, which keep the screen edges they have always had.

**The pedestal rises out of the dock without making the dock taller.** `.dock.five` pins
`grid-template-rows` to the dock's own height with `align-items:end`, and gives every button that
exact height; only `.dock-btn.home` is taller (74px at 844, 64 at ≤700) and overflows upward. Row 5
never changes height, so nothing in the `.ui` grid is re-measured — which is the rule that stops a
fifth button wrapping onto a second row.

The stage is the only flexible row. Everything else is content-sized, so the garden absorbs
whatever space is left.

### Why the rows are pinned

`hud`, `quest-strip`, `rail`, `stage` and `dock` each declare an explicit `grid-row`. This looks
redundant and isn't.

The rail is `display: none` below 600 px of height. With implicit row placement, removing it shifts
the stage and dock up a track, leaving a spare track at the bottom that the dock stretches into —
producing enormous dock buttons that ate a third of the screen. Explicit rows keep every element
where it belongs regardless of what's hidden. This was a real bug; don't undo it. The quest strip
is pinned to row 2 and stays visible when the rail hides.

Grid tracks also use `minmax(0, 1fr)` rather than `1fr`, because `1fr` has an automatic minimum of
`auto` and lets content push a track wider than its share.

### Square garden

CSS can't express "square, fitting the smaller dimension of a flexible parent" here, so
`sizeGarden()` measures the stage and writes explicit pixel dimensions, with a 150 px floor. It's
driven by a `ResizeObserver` on the stage plus `resize` and `orientationchange` listeners
(orientation change is deferred 250 ms because iOS reports stale dimensions immediately after
rotating).

The garden itself is a 3×3 grid; the centre cell holds the flower, the other eight are plots.

## Mobile specifics

From the viewport meta tag: `viewport-fit=cover` for edge-to-edge under notches,
`maximum-scale=1, user-scalable=no` to stop accidental pinch-zoom mid-tap.

- **`apple-mobile-web-app-status-bar-style` is `default`, and must stay that way.**
  `black-translucent` is what a full-bleed design wants and it is a trap on iOS: it hands an
  installed app a window the height of the screen *minus* the status bar and then pins that window
  to the **top**, so the game drew under the clock and left a dead strip along the bottom that no
  CSS can reach. Measured on an iPhone 16 Pro through the dev panel's screen report: screen 874,
  window 812, insets 62/34 — the window was short by exactly the top inset, and the 34px bottom
  inset was being reserved for a home indicator that was not even inside the window. `default` puts
  the window *below* the status bar, where it reaches the bottom of the screen. The cost is the
  status bar strip, which is drawn from `theme-color`; `updateSky()` writes the current sky colour
  there on every tick so the strip tracks dawn, day and night rather than sitting sky-blue at
  midnight. `setThemeColor()` **re-inserts the meta element** rather than only rewriting its
  `content`, because a browser that snapshotted the value at launch otherwise keeps showing that
  snapshot — a stale sunset over a midnight sky. It skips changes under two units per channel, since
  it runs every 0.6s. **Three rounds of layout work went into fixing this from inside the page and none of
  them could have worked.**

- **Safe-area insets are read through four `:root` variables**, not `env()` at each call site:
  `--sat`, `--sar`, `--sab`, `--sal`, each `env(safe-area-inset-*, 0px)`. Nothing else in the
  stylesheet may call `env()` directly. The reason is testing: `env()` cannot be simulated in a
  desktop browser, so the notched-phone layout was unverifiable without an installed build on a real
  handset — and that blind spot shipped the dead band under the dock twice. With the indirection,
  overriding four numbers on `:root` puts the real inset layout on screen in the preview.
- **`dvh`, not `vh`**, so the layout doesn't jump when mobile browser chrome slides away.
- **`.game` is an untransformed fixed box, and the shake moved into `.world`.** `.game` is
  `position: fixed; inset: 0` with **no transform**; `#world` is the element inside it that carries
  `translate3d(var(--shake-x), var(--shake-y), 0) rotate(var(--shake-r))` and wraps everything else.
  A transform makes an element its own containing block, and *that* is the shape of box WebKit has
  now sized short of the home indicator twice — first with `inset: 0` alone, then with
  `height: 100dvh` (2026-08-18). Both attempts were made while `.game` was transformed, so the
  common factor was never tested until 2026-08-20. Nothing depends on `.game` being the transformed
  ancestor: the only `position: fixed` descendant in the stylesheet, `.bee-fly`, is appended to
  `document.body` and sits outside the game entirely.
- **`--app-h` is a floor, not the height, and it is the window and only the window.** `.game` reads
  it as `min-height: var(--app-h, 0px)`, so the box is the taller of what the browser says
  (`inset: 0`) and what JS measured — a stale, late or missing measurement can then only fail by
  doing nothing, where the older `height: var(--app-h)` made a bad measurement authoritative.
  `sizeViewport()` in `ui.js` maxes `window.innerHeight` and
  `document.documentElement.clientHeight`, which are two readings of the same window. Measured on
  boot, again at 80/250/600/1200 ms, on `resize`, on `pageshow`, on becoming visible, and twice
  around `orientationchange` (iOS reports the pre-rotation height on the event itself). Deliberately
  *not* `visualViewport.height`, which shrinks for the keyboard and for pinch-zoom.
- **Never stretch the game past the window.** For a few hours on 2026-08-20 `sizeViewport()` also
  consulted `screen`, on the theory that an installed app's window *is* the screen so a short
  `innerHeight` had to be WebKit under-reporting. On a real iPhone it pushed the dock off the bottom
  of the window, where nobody could tap it. **The window really is shorter than the screen there**,
  iOS paints the strip below it, and no CSS reaches into ground the window does not own —
  `innerHeight` was right the whole time. A band of lawn under the dock is a blemish; a dock nobody
  can tap is a dead app. The strip is dealt with by making it invisible instead (see the page
  background and the two rules under it).
- **The dock stops `--bottom-gap` short of the physical bottom**, defined as
  `max(10px, calc(var(--sab) - 12px))`. Spending the whole bottom inset put 42px of dead lawn under
  the dock on a notched phone; the full inset is sized for a swipe-up gesture area, and a row of
  buttons nobody swipes from does not need all of it. The floor keeps a margin on a phone with no
  inset at all. `.ui`, `.hollow-dock` and `.hollow-count` all key off it, so the garden and the
  Hollow sit at the same height. The bottom **sheet** still pads by the full `--sab`, because its
  content scrolls right up to the edge.
- **The page background is `--page-fill`, and it tracks the bottom of the screen.** iOS paints any
  strip below a short window with the page's background colour, so the page has to be whatever the
  bottom of the screen is showing: the lawn normally, `--paper-2` while a sheet is open (set in
  `openSheet`/`closeSheet`, the reset delayed 340ms so it does not flip green under a sheet still
  sliding away). With the status bar style fixed there should be no strip left to paint — this is
  the belt to that brace, and it costs two lines.
- **The page background is the meadow, and deliberately flat** — `#4fae54`, no stripes. Anything a
  browser leaves uncovered is always at the *bottom* of the screen, which is where the game draws
  lawn, so a strip the game fails to reach reads as more lawn rather than as the page showing
  through; iOS also fills the strip below a short web view with this colour. It carried the mown
  stripes until 2026-08-20, which was worse than useless: a `repeating-linear-gradient` starts from
  its own box, so the page's stripes could never line up with `.meadow`'s and the mismatch drew the
  join as a line. `.meadow::after` now **fades its stripes out over the last 44px** instead, so flat
  meets flat and there is nothing to see. This is the safety net under the `--app-h` measurement,
  not a substitute for it. Note the manifest's `background_color` is separately the sky blue,
  because that one is the launch splash.
- **Nothing may paint a dark edge along the bottom of `.game`.** Two things did, and between them
  they are what made a short box read as a *cut* rather than as lawn — the colours already matched,
  it was the darkening above the join that drew the line. Both are fixed; check this rule before
  adding any full-bleed overlay or bottom-anchored shadow.
- **The bottom sheet only casts its shadow when open** — `box-shadow` moved from `.sheet` to
  `.sheet.open`, with `box-shadow` added to the transition so it fades in with the slide. Parked, the
  sheet sits just below the game's bottom edge, and `0 -8px 30px` from there painted a dark band up
  across the lawn that `.game` then clipped square. Measured: with the sheet's shadow suppressed, the
  pixels above and below a deliberately short game box are *identical*.
- **The vignette stops before the lawn does** — `.vignette` is masked with
  `linear-gradient(180deg, #000 0 74%, transparent 92%)`. It is what made a short box read as a
  *cut* rather than as lawn: the page behind the game is flat meadow green, so a darkened game edge
  meeting an undarkened page drew a hard horizontal line across the bottom of the screen. With the
  fade, any strip the game fails to reach meets lawn of the same value and the join disappears into
  the mown stripes.
- **`touch-action: manipulation`** on buttons removes the 300 ms double-tap delay.
- **`-webkit-tap-highlight-color: transparent`** kills the grey flash on tap.
- **`overscroll-behavior: none`** and `overflow: hidden` on the body prevent rubber-banding.
- **`user-select: none`** everywhere, since the whole screen is a tap target.

### Navigating between the garden and its two rooms

**Re-ruled by the owner from live play, 2026-08-30 (phase 3.8), and this is the second rewrite.**
Phase 3.5 read the gesture as a *pointer* — the Hollow is under the garden, so point the finger down
to go there — and in the hand it came out backwards.

**The finger drags the world, it does not point at the destination.** Pull the world up and you
descend; push it down and you rise. So:

**Swipe UP in the garden to go down to the Hollow; swipe DOWN to go out to the Wild Meadow.** A
room's own exit is the opposite of the swipe that got you there, so the Hollow leaves downward and
the meadow leaves upward, and both exit pills' marks point the way their swipe goes.

This is the rule [22-creatures.md](22-creatures.md) argued for when the Hollow was designed —
*"dragging down pulls the world down past you, which is the direction every scroll already uses"* —
and it is the half of the phase-3.5a option that was rejected then and is now reinstated.

**There is no longer a labelled door for either room.** The burrow mouth is gone (the owner's call at
the phase-3.5 gate): the gesture is what a player is meant to learn, and two labelled mouths on the
lawn were competing with it — as well as occupying the foot of the yard the floating pair now needs.
The Hollow can afford that, because its creatures are standing in the garden whether or not you ever
swipe. **The meadow cannot**, so the flower names it once, on the first idle line after the tutorial
(`seen.meadow`). That one line is the whole of the meadow's discoverability and it is filed as a risk
in [11-known-issues.md](11-known-issues.md).

Two rules keep the gestures from fighting the game:

- **A swipe only counts if it starts on the background.** Plots, the flower, the docks, the rail,
  the quest strip, the HUD, the sheet and the creatures all act on `pointerdown` and have already
  fired by the time a drag is recognisable — so a swipe begun on one would plant, harvest or open a
  panel on its way out. Waiting for `pointerup` instead would cost the tap latency the core loop is
  built on. The exclusion list lives next to the handler in `ui.js`.
- **It must be vertical and clearly so** (`dy > 70` and `dy > dx`), so a diagonal drag does nothing.

Worth knowing for the installed app: **do not require a swipe to start at the very bottom edge**,
which is the iOS home gesture.

### The sheet's breakout art

`#sheetArt` sits **inside `.sheet` but positioned above its top edge**, so whoever a panel is about
stands on it rather than being filed inside it. It is on the sheet and not in `.sheet-body`, which
means it rides the open/close transform and then holds still while the body scrolls. `.sheet` is
`overflow: visible` and the art carries `z-index: 1`, so it paints over the sheet's own background
and border — that overlap is the whole effect and anything that clips the sheet would kill it.

Only the creature panel uses it so far; `renderSheet()` clears it for every other mode.

**It is hidden whenever `.sheet` lacks `.open`, in CSS.** The art rides the sheet's transform, and a
closed sheet parks just below the bottom edge — so the art, which sits *above* the sheet's top edge,
ended up just above the screen's bottom edge with a creature's head over the dock. Keeping the rule
declarative means no close path, drag-dismiss included, can forget it.

### Input uses pointer events

`pointerdown`, not `click`, on the flower and plots — `click` waits for release and makes rapid
tapping feel laggy. Handlers call `preventDefault()` with `{ passive: false }` to suppress
synthesized mouse events and text selection.

The consequence is that dragging off a plot still counts as a press. Acceptable for a game with no
drag gestures on the board.

## The bottom sheet

All shopping happens in one sheet that slides up from the bottom, holding eight panels:

| Mode | Title | Opened from | Tabs |
| --- | --- | --- | --- |
| `upgrades` | Upgrades | Dock | shared shop strip |
| `apiary` | Apiary | Dock | shared shop strip |
| `craft` | Apothecary | Dock | shared shop strip |
| `shop` | Shop | Dock | shared shop strip |
| `seeds` | Choose a seed | Tapping an empty plot | Sort: tier / balanced / cheapest / priciest |
| `quests` | Quests | Tapping the quest strip | none |
| `bonuses` | Garden Almanac | Book button in HUD | none |
| `settings` | Settings | Menu drawer → Settings row | none |
| `dev` | Developer tools | Unlabelled hit area beside the gem wallet | none |
| `welcome` | While you were away | Opens itself on load after a real absence | none |
| `turn` | *(per beat)* | The year-meter pill when the meter is full | none |
| `album` | *(season name)* | Star button in HUD | none |
| `cardset` | *(set name)* | Tapping a set tile | none |
| `pack` | Opening a pack | Opening a pack from the album | none |

The four dock modes share a tab strip — the `TABS` array in `ui-sheet.js`, with `SHOP_TABS` deciding which
modes display it — so a player can move between them without closing. `seeds` carries the target
plot index in `sheetArg`. Boosters have no sheet panel at all; see "Status rail" below.

> **This structure is phase 1 of a larger change.** Apiary and Craft are still dock tabs — they
> move to the world map in phase 2. See [15-navigation-and-ia.md](15-navigation-and-ia.md) for the
> full build order before making changes here.

Behaviour:

- Tapping the dock button of the **already-open** panel closes the sheet, so the dock toggles.
- A scrim fades in behind and closes the sheet on tap.
- The grip at the top is draggable; **dragging down more than 110 px dismisses**. Anything less
  springs back. Uses pointer capture so a fast flick doesn't lose the pointer.
- Re-rendering preserves `scrollTop` unless the mode changed, so buying an upgrade doesn't jump you
  back to the top of a long list.

## The side drawer — the menu (2026-08-31)

**Drawn in `tools/menu-spike.html` first, approved at the gate, then built.** `.drawer` in
`style.css`, `ui-menu.js` for the behaviour, `#menu` in `index.html`.

**A drawer is a third surface class, and the game now has three.** The distinction is worth being
exact about, because calling this a sheet is the mistake that would break it:

| Surface | Comes from | Holds | Dismissed by |
| --- | --- | --- | --- |
| **The bottom sheet** (`.sheet`) | the bottom | one panel at a time, from a mode map | drag down 110px, scrim tap, close button |
| **The What's New dialog** (`#news`) | nowhere — it is simply there | one announcement | its own button, and nothing else |
| **The drawer** (proposed) | the right edge | a menu — a scrolling column of rows | drag right, scrim tap, the hamburger again |

Rules it inherits, and the one it adds:

- **It obeys the column, and it has to say so itself.** `min(86%, 332px)`, pinned to the column's
  right edge with `right: max(0px, calc((100% - 560px) / 2))`. **It is a SIBLING of `.ui`, not a
  child** — a child would be painted over by the FX float layer at `z-index: 40` and by the sheet
  at 50 — which puts it in exactly the position `.sheet` and `.meadow-layer` are in: outside the
  cap, inheriting nothing, obliged to re-state it. `.sheet` does that with `max-width` +
  `margin: 0 auto` because it spans the column; a drawer is pinned to one *edge* of it, so it says
  the same thing as an offset. **This was got wrong first and caught by measuring**: without the
  offset the menu flew out to the corner of a desktop window while looking perfect on a phone —
  the meadow's own bug, on a new surface, exactly as the trap predicts.
- **It pays the FULL safe-area inset, top and bottom.** `--bottom-gap` is `max(10px, calc(var(--sab)
  - 12px))` and it is right for the dock, which is a row of buttons nobody swipes from. A panel
  that reaches both edges of the screen takes `var(--sat)` and `var(--sab)` whole, the way
  `.news-card` does. `env()` is still never called directly — the four `:root` variables only.
- **It shares the sheet's scrim and z-order** — scrim 45, surface 50 — and the same two-property
  dance: `hidden` off first, `.show` on the next frame, and `hidden` back only after the slide.
- **NEW: it is a column of rows, so no row may depend on the drawer's height.** The sheet's panels
  are laid out against a fixed height; a menu scrolls, and a row that centres itself against the
  panel is a row that moves when the list grows. `.dr-rows` scrolls; the footer sits under it and
  does not.
- **A wide row takes the plain gradient, not the plot's blemish radials.** `.dr-row` is
  `.seed-row`'s material verbatim — two-stop gradient, 3px ink, a 4px opaque lip, the matching
  contact shadow. The five-layer recipe's two blemishes are positioned and sized in *percentages of
  the box*, so a 9% dirt mark that is a speck on a 100px plot is a 39px grey blob across a 300px
  row. That is the scale trap written in CSS, and it is why every wide card in this game is a
  two-stop gradient. (The class is `.dr-row`, never `.seed-row` — that one is the plant picker's
  button and reusing it collapses the columns.)
- **Its state lives in a module local, never in the DOM**, exactly as `sheetMode` does. A `panels`
  emit rebuilds markup from scratch and anything held in an attribute vanishes mid-interaction.
- **Reduced motion gets a real version, not a fast one.** The global clamp collapses every
  transition to 80ms, which on a full-height panel is a flinch rather than a calm arrival, so the
  drawer names `transition: none` for itself in a block at the very end of the file. Nothing about
  its state is carried by movement in the first place — the badge dot is a solid disc in its base
  style, the scrim's dim is a plain opacity, the rows never animate — so there is no state needing a
  static substitute, which is the check docs/05 asks for, answered rather than assumed. The close
  path's 340ms wait also goes to zero, or an invisible scrim eats taps for a third of a second
  after an instant close.

**The strip of garden down the left is load-bearing.** 332px of 390 leaves 58px of the game
visible (50px at 360 wide, 45px at 320). Full-bleed would make this a screen rather than a drawer,
and **the visible strip is the second dismissal** — measured, not assumed: `elementFromPoint` in
that strip returns the scrim.

**There are TWO dismissals, not three.** Drag the grip right past 90px, or tap the garden beside it.
The spike's third — tap the hamburger again — **is not reachable with a thumb**, because an open
drawer covers the button that opened it; that was measured after the build and the spike's note was
corrected in place. The toggle is still wired, because the button stays focusable and Enter on it
fires a click without hit-testing, but it is not a dismissal a player will find. Two is what every
drawer of this shape has, and it is why the strip is not negotiable.

### What is in it

Rows are `icon left · label · optional badge`, in the house's card material — the cream five-layer
recipe, a 3px opaque `var(--ink-2)` lip, and the icon in the round tinted badge `.seed-art`
already uses (a **saturated** tint under the white veil, never a pale one — four pale tints under
that veil produce four identical white discs, which is `.set-ring`'s named failure reached from
the other direction).

Ours, in order: **Shop · Almanac · What's New · Settings.** Then three reserved rows in the
drained `--paper-dim` family, marked *Soon* and non-interactive: **Friends · Daily Gift · Garden
Record.** Three is a cap, not a coincidence — past three the menu advertises more game than
exists.

**Settings moves off the HUD and into the drawer.** The gear button becomes the hamburger; every
one of Settings' controls stays reachable, one tap deeper. Nothing else in the HUD moves.

**The audio rows are the first form controls in the game.** Three channels — Sound effects,
Ambience, Music — each a two-line row: name, note and mute switch on the first line, a level on the
second. The level is a real `<input type="range">`, and it stays native on purpose: keyboard
support and the slider role come with the element, and a slider rebuilt from divs would have to
reproduce both, including the `setPointerCapture` retarget the native control already does to
itself correctly. It is fully restyled — `::-webkit-slider-runnable-track`,
`::-webkit-slider-thumb` and the Firefox pair, none of which inherits from the others — because a
system control in a hand-drawn garden reads as something that got left in. The filled half of the
track is one gradient stop driven by a `--lvl` custom property the input handler writes, so the
paint follows the thumb without rebuilding the row.

A muted row wears the drained `--paper-dim` family the locked seed row wears, and **keeps its
slider position**: the mute is a switch, not a level, which is the whole reason there are two
controls rather than one.

Ranges report through `input`, not `click`, so `ui-sheet.js` carries a second delegated listener on
`#sheetBody` for `[data-level]`. The save is written on `change` — the end of the drag — while the
level follows the thumb, so hearing a slider never costs eight writes.

**Coach marks are hidden under it twice, and both are needed.** `.drawer.open ~ .coach` stops the
mark being *painted* — the drawer precedes the coach in the DOM, the same route
`.sheet.open ~ .coach` uses — and `refreshCoach()` names the drawer in its guard so a hidden target
is never *measured*. The CSS half exists because `refreshCoach()` runs on the 0.6s slow tick: with
the JS guard alone, "Tap the flower!" sat on top of the menu for up to half a second after it
opened, which is exactly long enough to photograph.

**The profile header is the drawer's own, and it appears nowhere else.** A round avatar, the
player's name and a pencil. The avatar is generated from what the player owns — a bloom through
`Flora.head` or a creature through `Critters.draw` — never uploaded. The name is the first
player-typed text in this game and is governed by the escaping rule in
[11-known-issues.md](11-known-issues.md): it renders through `textContent`, never inside a
template literal, at every site. `paintName()` in `ui-menu.js` is the only place it reaches the DOM
in the rows view and the field's `.value` is the only place in the edit view;
`node tools/html-check.js` fails the build if a third appears.

## The What's New dialog (2026-08-30)

**The one thing on screen that is not a sheet.** An announcement is a card in the middle of the
screen with its own scrim, `#news` in `index.html`, drawn by `ui-news.js`. It is not a sheet panel
because it cannot be dragged away and it cannot be closed by tapping the scrim: its single "Got it!"
button is the only way out, and on an announcement marked `reset` that button hands the player a
fresh garden.

| Rule | Why |
| --- | --- |
| **Never fullscreen.** `width: min(340px, 100% - 40px)`, centred, `max-height` inside `--sat`/`--sab` | The owner asked for a mobile-game popup, and the house has one. A full-bleed takeover was rejected in the same ruling |
| **`z-index: 90`** — above the banner (70), the coach mark (65) and the toasts (60) | It is the first thing a player sees on a new build; nothing may land on top of it |
| **Its own scrim**, not `#scrim` | The sheet's scrim belongs to a thing you can dismiss by tapping it. This one must not be dismissible |
| **Nothing fades in.** The card and the scrim are opaque in their base style; `.show` moves the card 14px and nothing else | A frame that never arrives — a stopped animation clock, a transition that never starts — must not be able to trap a player behind a modal with an invisible button. Visibility belongs to the base style; motion is the flourish on top |
| **The art is framed, never laid out.** `aspect-ratio: 4/3`, `object-fit: cover`, both dimensions stated on the `<img>` | The art is owner-supplied and portrait (1152×1728). Given its own aspect it is taller than the phone. Stating both dimensions is the raster version of the `width:auto` SVG trap |
| **`.news[hidden]{display:none}` sits beside `.news{display:grid}`** | `[hidden]` loses to any later rule that sets `display`; the attribute selector's specificity is what saves it |

**It goes first and alone on boot.** `boot()` calls `UI.maybeAnnounce()` before the away report and
before the flower's greeting, and both stand down while it is up — the welcome sheet takes its turn
from `UI.afterNews()` if the announcement did not send the player back to the start.

### The plant picker row

A `seeds` row is a shelf item, not a table row. Left to right: a circular art badge tinted from the
seed's own bloom, then name plus verb chip, then the stat pills, then the trait note if the seed
carries a verb, then the green go button.

```
( ෆ )  Bluebell  KEEPER
       ( 180 ) ( 24s ) ( 252–2,016 )              ( ↑ )
       [ Neighbouring plots grow 15% faster. ]
```

**Everything in the row has to be decision-relevant, and the trait note is the most decision-relevant
thing in it.** The flavour line was cut on 2026-08-26 and now lives only in the Almanac — the two
were saying the same thing in two registers, and the prose was the half that could not be acted on.
A row is roughly a third shorter for it, which is the point: the garden screen is calm because it
shows nine objects and one number, and the picker should read as a shelf of nine objects rather than
a table of fifty-six facts.

The row carries the full card material — 3px ink, `0 4px 0 var(--ink-2)`, and since 2026-08-26 the
`0 8px 14px rgba(44,26,16,.24)` contact shadow the plot has, so rows sit *above* the paper rather
than on it. The press collapses the lip and tightens the shadow together.

**The go button never becomes a padlock (2026-08-30, phase 3.6).** `.seed-go` draws the sprout in
every state; when the seed costs more than the player holds, the row is `[disabled]` and the disc
drains onto the `--paper-dim` family, restating its own lip. **In this picker a padlock means the
one-time unlock wall and nothing else** — a refusal that clears itself in ten seconds is grey, and
grey is the whole message. The two states were one glyph until the owner read a bare padlock as
*more locked* than a chip reading 150K, which is exactly backwards. The same rule governs Fall's
crop picker, which shares this row and has no unlock wall at all. Note that `syncAfford()` must
leave the slot alone: it rewrites the row on every `currency` emit, so a fix in the markup alone
grows the padlock back a second after the panel opens.

#### The locked row, and the unlock price (2026-08-29, phase 2)

A seed that has not been unlocked wears its **one-time gold price** where every other row wears its
go button, so the eye finds the answer in the same place down the whole list. The row is
`.seed-row.locked`:

- **Drained, never illegible.** It takes the `--paper-dim` family every other "not now" state in the
  game wears, and it restates its own lip (`0 4px 0 var(--paper-dim-edge)`) — a `box-shadow`
  modifier that forgets to is how the lip gets deleted in exactly the states a player is looking at.
  The art desaturates to `.35`, the stat pills drain, and **the numbers stay readable**: the row is
  an advert for the thing you are saving 150K for.
- The price chip is `.seed-lock`, the documented pill recipe at 2.5px/`0 2px 0`. `.ok` is the house
  green and pulses with `affordPulse`; `.no` is drained. `syncAfford()` keeps both honest between
  renders, so the chip flips the moment a harvest lands.
- It replaced a `.seed-row.gated` that read **"Level N"** from the retired `unlockLevel` — the wrong
  refusal since the Garden Year priced seeds in gold — and greyed the row to `opacity(.72)`.

**Tapping it asks first.** `.unlock-ask` replaces the whole panel — bloom at 100px, the question,
the price and the permanence in one sentence, `Not yet` / the green price. It is the whole panel
rather than a card floating over the list because a `panels` event rebuilds the sheet body from
scratch, and a floating card would vanish mid-question; the pending seed lives in a module local in
`ui-sheet.js` for the same reason. The sort pills hide while the question is up. **An unlock is
one-time, permanent and unrefundable, and the game has no undo** — one extra tap on the happy path
is the trade. On success the row keeps its place, lights `.fresh` gold for 2.2s, and a toast says
*yours for good — unlocks survive every Turn*, which is the one fact a player cannot see.

### The Turn ceremony — sheet mode `turn` (2026-08-29, phase 2)

Five beats on one sheet: the ask, the blessing, the Tally's three moments, the spring return.
`.sheet.cere-sheet` is `min(94dvh, 800px)` — **one height across every beat**, because a sheet that
resized between the ask and the Tally would jump under the player's thumb. The body is a flex column
that centres its content; the picker alone opts out with `.cere.top`, since with every flower
unlocked its grid is seven rows.

**The flower stands inside the body, not in `#sheetArt`.** A sheet this tall has no room above its
own top edge, so the breakout art clips off the screen. `.cere-flower` is the ceremony's own.

**It renders from a step variable, never from what is in the DOM.** Any `panels` emit rebuilds
`#sheetBody` from scratch, so a ceremony that animated out of its markup would restart its fireworks
every time an unrelated purchase fired. The pack reveal is the precedent. The corollary: **only the
newest Tally line carries the entrance animation** (`.tline.just`) — on `.tline` it would replay the
whole list at every landing and the Tally would jitter instead of stack.

**From the commit until the total lands, the sheet cannot be dismissed.** `turnYear()` is atomic and
has already happened by then; a stray scrim tap would cost the player the only celebration it has,
with nothing to undo. The guard is a single early return in `closeSheet()` — every dismissal path
(button, scrim, drag) goes through it — plus `.sheet.no-exit`, which hides the close button and dims
the grip. All three come back at the spring return.

**The plate is the garden's four value tiers indoors:** ink outline, a dark body with the board's own
grain, cream pills for every counter, the house green for every bonus, `.outlined` for the big
numbers. That is why an arcade scoreboard can be this loud without leaving the style.

**The cosy rule is enforced twice.** The engine never emits a line the year scored zero on, so no
`×1.00` row can render — and **a year that scored nothing shows no multiplier at all**, because a
Tally ending on a bare "×1.00" is that same failure row wearing a different hat. It shows the pouch
and celebrates that.

**The blessing picker filters capped flowers.** `turnYear()` accepts a flower already at its Rich
Bloom cap, writes nothing and completes anyway — so showing one would let a player lose the largest
per-Turn grant in the game with no undo. The picker is a grid of blooms with their Rich Bloom pips
and nothing else, because the only decision is *which flower*. There is no skip button; the only
no-blessing path is the every-flower-capped state, which has its own panel and its own line of
writing. A dashed slot for a future price is **not** drawn — the reserved-cost idea from the spike
survives as layout headroom only.

### The Almanac petal rows (2026-08-29, phase 2)

The mastery goal line is replaced by **two petal tracks**: name, pips, price, and — since
2026-08-30 — the skill's one-line meaning. The pips are the game's
existing level vocabulary in the seed's own green, so a player reads "3 of 5" without a fraction; the
price is the ordinary `.price` family in three states they already know — green affordable, drained
short, grey `MAX`. Only the price chip is the button, so a mis-tap on the row cannot spend seeds.

**A skill says what it is before it says what it is worth.** A track with no pips used to read
`next +30%` and nothing else — a number with no noun attached, on the one surface a player meets
before they have ever bought a petal. Every track now carries its plain sentence: *"+30% gold on this
flower's harvests, per petal."* / *"Grows 6% faster, per petal."* The sentence is authored in
`DATA.petals.shared[skill].desc` with a `{v}` token where the panel writes `value` back in, so the
percentage in the prose can never disagree with the effect. Every other hand-typed number in
`DATA.upgrades` and `DATA.verbs` was checked against the code on 2026-08-30 and all of them still
match — the point is that they are copies, and a copy only has to be right until someone retunes.

**At zero pips the sentence replaces the value line**, because `petalValue()` collapses there to the
same number the sentence already carries. From one pip on both are drawn: the value line reports what
you have and what one more buys, the sentence says what the skill is.

`petalTrack()` in `ui-sheet.js` renders **both** surfaces — these rows and the Turn panel's petal
cards — so this is one edit, not two. `.pd` takes `grid-column:1 / -1` to escape the track's four
columns, and the token is `.seed-desc`'s: 11px, weight 600, `--ink-soft`.

**They appear only after the first Turn, and only on a discovered flower.** Doc 32's year one is
"nothing, unexplained — the mystery is the tutorial", so there is no teaser and no locked track; the
pips arriving the morning after Turn 1 *is* the tutorial. An undiscovered row keeps its two-line dim
form. **The signature (third) skill is slice B and is deliberately not stubbed** — a row that
advertises an unbuilt thing is the quest-strip trap wearing a different hat.

### The Almanac seed row

The `bonuses` panel lists all nineteen seeds. A grown row is three lines; an ungrown row is two.

```
🌼  Daisy                       LEGENDARY   ×512
    Swift starter bloom; perfect for keeping early plots busy.
    Tier 13 · 512 / 1,000 total  ▓▓▓▓▓░░░    +60%
```

The top line is three columns and no sentence — bloom and name, best rarity, lifetime count. The
name flexes and ellipsises; rarity and count are fixed width so the columns line up down the list.
The rarity label is tinted per tier (`.r-rare` / `.r-epic` / `.r-legend`); Common stays grey.

The middle line is `.seed-desc` — the seed's flavour text, which lives **here and nowhere else**.
It moved out of the plant picker on 2026-08-26: a line that carries no decision is weight on a
screen where every row is a decision, and the Almanac is the reference page where a player has come
to read rather than to choose. Ungrown rows keep it, since the name and the bloom are already shown
and the copy spoils nothing.

The last line is the **current mastery goal only**, never the rest of the ladder: tier number,
progress against the goal, a thin bar, and the yield earned so far. A gem pip sits beside the goal
text when the tier being climbed is a fifth one, so the reward is visible before it lands. Ungrown
rows show a dash in both columns, dim to 45%, and get no goal line — the first harvest starts the
climb toward tier 1.

`ui.js` reads `Game.masteryGoal(id)`, `Game.masteryOf(id)` and `Game.masteryMult(id)` and does no
ladder arithmetic of its own. Track labels are UI copy, in `MASTERY_TRACK`: `Rare+` and `Epic+`,
where the plus carries "or better".

**The row classes are `almanac-row*`, not `seed-row*`.** `.seed-row` is already the plant picker's
button, and reusing it wraps every Almanac row in a card treatment with the columns collapsed onto
one overflowing line.

### Keeping the sheet live

Two update paths, deliberately different in cost:

- **`renderSheet()`** rebuilds the panel's HTML. Triggered by the `panels` event — purchases,
  unlocks, booster expiry.
- **`syncAfford()`** only toggles affordability classes and price colours on existing nodes.
  Triggered by the `currency` event, which fires on every single tap.

Rebuilding the whole panel on every tap would be visibly janky. If you add a panel, make sure the
frequently-changing parts are reachable by `syncAfford`.

## Plot visual states

Driven by `data-state` on each plot button:

| State | Appearance |
| --- | --- |
| `locked` | Padlock and coin price; pulses when affordable (`data-afford="1"`). When a gate refuses the purchase the chip names **which** gate — `Turn 1` while the Garden Year holds plots 5–8, `Lv n` when the level is the binding one. `Game.plotGate(idx)` answers that, so the UI never has to re-derive the rule, and the deny float says the sentence (*After your first Turn*) that the chip only marks |
| `empty` | Dashed plant-spot marker; bobs only during first-plant onboarding |
| `grow` | Plant at its growth stage, progress bar beneath |
| `ready` | Full bloom, bouncing `!` badge, sweep shine |

Plots also carry `data-stage` (1–3) for growth and `data-aura` (rarity name) tinting the soil after
a harvest.

### The developer hit area

`#btnDev` sits **absolutely positioned at `left: 100%` of `.wallets`** — immediately right of the gem
wallet, 44 px wide, `opacity: 0`, and `tabindex="-1"`.

Absolute rather than a flex sibling for a concrete reason: in flow it wrapped onto its own row and
made the wallets three rows tall, pushing the HUD down. Out of flow it cannot affect layout at all.

44 px because that is the touch minimum — an invisible control still has to be hittable on a phone.
Out of the tab order so a keyboard user never lands on something with no visible state.

### Mutation and weather visuals

**Mutated plots** carry `data-mutation` plus `--mut` / `--mut-glow` set inline from
`DATA.mutations`. The treatment escalates with rank: every tier gets a tinted border, an outer glow
and a slow pulse; **Prismatic and Wonderstruck also get a moving shimmer** the lower two don't. The
mutation stays visible from the moment it lands until harvest — that permanence *is* the mechanic,
and it is what separates a mutation from a rarity roll revealed at the end.

Written through the `renderPlots()` cache like every other plot property, so an unchanged mutation
touches no DOM.

**Weather** sets `data-weather` on `.game`, plus `data-wx-phase`, `data-sunbreak`, `data-wx-flash`
and `data-wx-night` since the Sky Pass. The sky itself is `.wx-wash`, a gradient inside the `.wx`
layer — an overlay over the living sky rather than a repaint of it, so the day/night cycle keeps
running underneath. It tops out at `--wx-storm-wash`, 0.68 for a storm, which reads as overcast
without hiding the garden. The flat `.scenery::after` fade that used to carry this is retired: its
four per-sky opacities are zero, because two tints over one sky darkened every sky twice.

**`.wx` carries no `z-index`, and nothing may give it one.** A positioned element with a z-index is
a stacking context, and a stacking context is an isolated blending group — every multiply, screen
and overlay inside would then blend against transparency instead of against the sky, which looks
plausible and is wrong. DOM order alone places it.

**Cue discipline.** Every real sky now speaks twice: a forecast line a few seconds before it lands,
and its arrival line when it does. **Wonderfall alone gets a banner** — that ruling stands, and a
banner four times an hour would still be noise. Rarity buys the interruption: only the aurora and
Wonderfall talk over the speech cooldown. The ladder is in
[06-audio-and-fx.md](06-audio-and-fx.md#the-feedback-ladder).
Catching a mutation is celebrated per rank — sparks and a float for the lower two, plus shake,
confetti and a banner for the top two. Both honour reduced motion.

### The adjacency flash

Two transient classes, added on planting a flower that carries a verb and removed after 1.6 s:

| Class | Appearance |
| --- | --- |
| `verb-source` | Solid ring in the verb's colour, with a dark outer shadow — the flower you just planted |
| `verb-linked` | Dashed ring in the same colour — the two plots it affects |

Both read `--verb`, set inline from `DATA.verbs[id].tint`, and animate through `verbLink` — scale up,
hold, fade to nothing. Reduced motion swaps to `verbLinkCalm`, which does the same fade with no
scaling.

**Why it is transient.** Adjacency is invisible until something points at it, so it has to be shown
at the moment the choice is made. But a permanent link indicator on all eight plots would clutter a
board whose readability at arm's length is the single hardest-won property of this layout. Showing
it on plant and fading it out is the compromise: taught at the decision point, gone by the time you
are looking at the garden again.

**Testing note.** An automated tab without OS focus can freeze CSS animation clocks entirely, so the
flash may screenshot as invisible even though it fired. Verify by asserting the classes and the
`--verb` value, or seek the animation manually — see "Traps in this codebase" in
[HANDOFF.md](HANDOFF.md).

## HUD

### The year meter is the dock's Turn button (2026-08-30, phase 3.5)

**Superseding the third-pill design of phase 2.** `.wallet.meter`, `.meter-fill` and `.year-pop` are
gone; their whole job moved down to the dock.

**The button's body is the meter.** `.dock-btn.turn` carries `.turn-fill`, an absolutely-positioned
child at `z-index:-1` under `isolation:isolate` — the pill's own trick, one row lower. **The fill
rises from the bottom rather than wiping across.** The pill it replaces was **39px wide** (the one
wallet with no number in it), so it never had room to say much; a dock button has 56px of height to
travel, and rising is the truer picture anyway — the pouch fills.

**It shows the binding gate,** unchanged: `yearProgress()` returns `min(seeds, coins)`, because the
Turn needs *both* the un-tallied increment ≥ `minSeeds` and the year's earnings ≥ `minCoins`, and a
bar tracking one would sit full while the other held the ceremony shut. Still recomputed on the 0.6s
slow tick, never per frame — `projectedMint()` walks the whole Tally table.

**Ready** takes `turnFull`, the 1.4s gold breath the full pill used to wear. Worth being exact about
what that borrows: this ring is worn by **exactly one thing in the game** and has only ever meant
*the Turn is ready*, so the meaning travels with it intact. The attention dot is suppressed while it
breathes — a dot on a button that is already pulsing is noise.

**And since 2026-08-30, ready also throws a glint** (`turnShine` on `.turn-fill::after`). The breath
says *something here*; a Turn is the player taking hold of the season itself, and the ruling was that
it has to say *look now*. It is the ready plot's own `sweep` — same 100° band, same 8° tilt — but
**parked off the button for seven eighths of its cycle** and crossing in the last eighth, so it lands
as a moment rather than as the constant travel a plot can afford at 1.9s. Gold rather than the plot's
white, because gold is already the only thing on this button that means *the Turn is ready*. The
interval is `DATA.year.turnShineEvery` (9s), written to `--turn-shine` once at boot — a longer
interval is also a statelier sweep, since the travel is a fraction of the cycle.

**The clip belongs to `.turn-fill`, never to the button** — `overflow:hidden` on `.dock-btn.turn`
eats the pouch chip hanging 9px above it.

**Reduced motion holds the ring on solid and the glint still.** This is a repair as much as an
addition: the breath is an animation, the global clamp runs it once for `.001ms` and drops it, and
the attention dot is hidden on the assumption that the button is breathing — so a player with the
preference on had **no ready signal on the Turn button at all**. The block sits at the very end of
`style.css`, because a media query adds no specificity and has to come after every rule it cancels.

**The fill is `--year-p` on `.turn-fill`, not a height.** `.turn-fill` is only the clip box and is
pinned `inset:0`; the water is `.turn-fill::before` rising from the bottom. `ui.js` wrote a `height`
onto the clip box for a day and a half, which shrank the box from the top and left the waterline at
`0%` — **the dock's meter had never once painted.** Fixed 2026-08-30.

**`.seedchip` is the pouch, promoted.** Saved Seeds have always had a number — in the projection, in
the Almanac's seed-row header, in the ceremony — but never on an always-visible surface. The chip
rides above the button from the first Turn onward, and **never in year one**, where doc 32's rule is
that the meter fills with no numbers on it at all.

**Tapping it opens the Year panel** (sheet mode `year`), which is the projection card with room to
breathe: the pouch, both gates as tracks with the binding one marked, the ceremony's own button when
a Turn is ready, and petal spending as a card per flower. That is one tap further from the ceremony
than the pill was, and it buys a button that is useful for the other fifty weeks of the year.

**Year one is a locked panel, and it is never directionless.** The owner's rule (2026-08-30):
*something mysterious with no direction feels broken.* So before the first Turn the panel shows a
padlocked meter, **one** track — the gold, because gold is the half a player can push on directly —
with no numbers on it, and the flower saying what to do about it. No pouch, no seed gate, no petals.
**And the moment the Turn is ready the lock comes off and the ceremony's button appears**, which is
the door out of the mystery; the ceremony's ask is where the explaining has always happened. Shipping
without that door was a real bug in this build: full meter, breathing dock button, and a panel still
saying *keep going*.

### The HUD's round buttons are 44px again (2026-08-30)

The `max-width:430px` block used to shave every round button to 40px — under the touch minimum —
because three wallets (222px) plus three 44px buttons (144px) plus the gap came to 374px of the 370
available. It said in prose that the real fix was one fewer HUD button and that the call was the
owner's. **The owner made it.** The meter pill moved into the Turn button and the album star moved to
Cards, so the HUD is two wallets and two round buttons: about 234px of the 340 available at 360px
wide, with the worst realistic numbers in it. The block now compresses the wallets only.

### The rest of the HUD

Two wallet pills — coins and gems — plus round buttons for the Almanac and Settings. **The
developer dot** is still an unlabelled 44px strip, `position:absolute; left:100%` on `.wallets`, so
it costs the row no width; with the meter pill retired it now sits in clear space rather than under
the first round button. A
quest strip sits between the HUD and the rail: level pip with a reputation ring, a thick bar for
the current quest's progress (task name and count drawn on top of the fill), and a reward chip.
Tapping it opens the quest panel; tapping a completed quest claims it. See
[16-progression-and-quests.md](16-progression-and-quests.md).

Counters **animate toward their target** rather than snapping, lerping at `dt × 9` and locking on
when within 0.6 to avoid asymptotic crawl. Combined with the coin magnet, earnings appear to fly up
and land in the wallet.

`popWallet(name)` triggers a scale-pop on a wallet when it gains something, re-triggered via the
remove/reflow/re-add pattern.

Numbers are abbreviated above 100,000: `100000` stays as-is up to that point, then `K`, `M`, `B`,
`T` with trailing zeros trimmed.

The Almanac panel (`bonuses`) opens with a collection header — `N / 19 discovered` on a bar, then
the four milestone rungs — followed by the seed list in the two-line row described above, then the
stats that used to be the whole page.

## Status rail — the countdown strip

**The rail lost its shop and kept its clock (2026-08-30, phase 3.5).** Spending a boost is the band's
POWER-UP button now; what renders here is the countdown of whatever is already **running**, plus the
Wonder, which is prepended so it always leads. The `.chip.buyable` state is retired.

It is `:empty{display:none}`, so most of the time it costs nothing — but note that its two 6px
gutters are billed whether or not track 3 has height, because the `.ui` grid has five explicit
tracks. Deleting the track outright would buy the stage back 6px, not 12; keeping the rail as the
clock is worth more than 6px.

Decor no longer appears here — it's cosmetic now, with no gameplay state worth surfacing in a
glanceable HUD row.

Rebuilt every 0.25 s, but the generated HTML is compared against a stored signature first and only
written when it differs — otherwise a countdown that only changes once a second would thrash the
DOM four times as often as needed.

Hidden entirely below 600 px height and in short landscape.

## Toasts, banners, coach marks

**Toasts** appear top-centre, capped at **two** with the oldest evicted, default 3 s. Positioned to
clear the rail. Reserved for genuinely notable events — Epic and Legendary harvests, unlocks,
booster activation, migration. Rare harvests deliberately don't qualify.

**Banners** are the full-screen centred announcement, used only for Wonder start and end. They
overshoot on entry and scale away.

**Coach marks** are absolutely positioned tooltips above their target — or **beside it when the
target is a season tab** (`side-l` / `side-r`, arrow pointing sideways into the tab). A side mark
**looks for a gap** rather than only pushing upward: it tries the tab's midpoint, then just above and
just below each of the three things that can be in the way (the UPGRADE pill, the POWER-UP button and
Fall's bed chip), taking the candidate nearest the midpoint that clears them all and still lands on
the tab. Beside a tall tab there is usually room *below* the chip as well as above it, which is where
it sits in Fall at 390×844 and 390×812. When no gap exists at all it **flips back to the stacked
shape** rather than pointing a sideways arrow at nothing; that is what happens in Fall at 390×667. They are suppressed while a sheet, a gate, the Hollow or the meadow is
up. Repositioned on resize and every 0.6 s. The flower will not speak while one is visible.

## Dock attention dots

Each dock button carries a dot shown when there is something worth opening it for, and hidden while
that panel is already up. Recomputed every 0.6 s in `updateDockDots()`. This is the primary
discovery mechanism — it's how a player learns a panel is worth opening without being nagged.

**Re-pointed for the Big Five (2026-08-30):**

| Button | Dot when |
| --- | --- |
| Orders & Quests | An order you can fill, **or** a quest you can claim (`Game.stripQuest().complete`, the same call the strip uses, so the two can never disagree) |
| Cards | `state.packs > 0` — an unopened pack. **New**: nothing has ever badged the pack count before |
| Turn | The Turn is ready. Suppressed while the button is breathing, since that says it louder |
| Shop | Affordable decor **or** something brewable — Craft has no button of its own now, so its dot folds in here |
| **UPGRADE** (the band's pill) | An affordable upgrade. **The first time the dot rule has reached a control that is not a dock button** |

**One dot lost its home and is not silently re-pointed:** the World button used to badge *jars
waiting in the meadow*, and the meadow has no button any more. Recorded in
[11-known-issues.md](11-known-issues.md) rather than folded into an unrelated dot.

The same idea is the intended basis for **contextual upgrade affordances** in
[15-navigation-and-ia.md](15-navigation-and-ia.md): once upgrades live on the objects they upgrade,
a small corner dot on the object replaces the dock dot. Reuse this pattern rather than inventing a
second one.

## Responsive breakpoints

| Condition | Change |
| --- | --- |
| `max-height: 700px` | Dock row 56→50px, pedestal 74→64, creature lift 6→4, wallets compress. **Round buttons stay 44px** |
| `max-height: 600px` | Rail hidden |
| `max-width: 430px` | Wallet padding and icons compress. **No longer touches the round buttons** — see the HUD section |
| `min-width: 600px` and `min-height: 760px` | Horizontal padding added so the garden doesn't sprawl on tablets |
| Landscape, `max-height: 560px` | Rail hidden, sheet grows to 94dvh, dock compressed |

## Accessibility

Present:

- Every interactive element is a real `<button>`.
- `aria-label` on icon-only controls, `aria-hidden` on decorative scenery, canvas and SVG.
- `aria-live="polite"` on the rail and toast container.
- `role="tab"` with `aria-selected` on sheet tabs; `aria-pressed` on settings toggles.
- The three audio levels are native `<input type="range">` controls with their own
  `aria-label`, so they are keyboard-operable and announced as sliders.
- `aria-hidden` toggled on the sheet as it opens and closes.
- Full `prefers-reduced-motion` support.
- **Minimum 44 px tap targets everywhere in the HUD, at every size** (fixed
  2026-08-30). The `max-width:430px` and `max-height:700px` blocks compress the
  wallet pills only; both used to shave the round buttons to 40px and both have
  stopped. That exception existed because three wallets and three 44px buttons
  came to 374px of the 370 a 390px phone has, and **one fewer round button was
  the named fix** — retiring the meter pill and the album star in phase 3.5 is
  that fix, twice over. The quest strip is still under 44px and always has been.
- Sound effects and music independently disableable.

Missing, and worth knowing before claiming accessibility:

- **No keyboard navigation.** Every button takes a `:focus-visible` ring as of 2026-08-30 — 3px of
  `var(--ink)` at 3px offset, written as an `outline` and never a `box-shadow`, because every
  surface in this game carries its lip in `box-shadow` and a ring written that way would delete the
  lip off every button at once. `:focus-visible` and not `:focus`, so a thumb tap leaves nothing
  behind. But there are still no key handlers, and the game is unplayable without a pointer.
  `.dev-btn`, `.mw-cell` and `.mw-keeper` each set their own `outline` in a state rule that
  outranks the ring.
- **No screen-reader narration of the garden.** A blind player gets no plot states.
- **Colour is the only channel for rarity.** No shape or text differentiation.
- Contrast has not been formally audited.

## The horizontal strip — the seasons (2026-08-29, phase 3)

```
   SPRING   <-   SUMMER   ->   FALL   ->   WINTER
 (turn ~6)       (home)      (turn 1)    (turn ~3)
                    |
                THE HOLLOW
```

**A season is not a place layer.** The Hollow, the meadow and the map are rooms you leave the garden
to visit — they are siblings of `.ui`, they hide its chrome, and each has to re-state the 560px
column. A season is *the same room in a different month*: `.stage` swaps `.garden-frame` for
`.fall-frame`, the scenery swaps behind it, and **the HUD, the quest strip, the rail and the dock
never move**. Nothing in Fall re-states the column because nothing in Fall leaves `.ui`.

| Piece | Where it lives | Why |
| --- | --- | --- |
| `.fall-layer` (the scene) | a sibling of `.ui` inside `#world`, `z-index: 2` | above the CSS scenery, below `.ui`, so the HUD stays up and the dock stays tappable |
| `.fall-frame` / `.fl-board` | inside `.stage`, beside `.garden-frame` | one board swaps for another in the same square the garden already sizes |
| `.fl-chip` | absolute inside `.fl-wrap`, `top:-46px` | Fall's one rule, standing over the board it describes — anchored to the board's own box so it tracks it at every viewport |
| `.fl-collect` | absolute inside `.fl-wrap`, `bottom:-58px`, max 132px wide | the payoff button, in the strip the chip left — narrow so it clears UPGRADE and POWER-UP, which are NOT hidden in Fall |
| `.gate-layer` | a sibling of `.ui`, `z-index: 3` | a locked season is a screen, and `.in-gate` hides the stage, dock, rail and quest strip exactly as `.in-map` does |
| `.season-edges` | **absolutely positioned against `.ui`**, not a grid item | see below |

**The season edges are absolute, and that is load-bearing.** They were a grid item at `grid-row: 4`
with an auto column for one build, and an explicitly-placed item with a definite row forces the next
auto-placed item (`.stage`) into an **implicit second column** — which halved the interface, squashed
the dock into a corner and stacked both tabs on the left. Absolute against `.ui`, clear of the dock
by `calc(var(--bottom-gap) + 104px)`, they can never touch the row layout.

**They sit low, over the lawn, not centred.** Centred vertically they land *on the board*, and the
board is the thing this game is. Low also puts them in the same band as the burrow door, so all the
ways out of the garden read as one family. A locked edge wears the drained paper and the turn that
opens it, so **a gate is a promise you can read from Summer** without walking to it.

**The vertical ladder hangs off Summer only.** Swipe up and swipe down do nothing in Fall or at a
gate — the Hollow is under the *garden*, not under the year, which is doc 32's diagram. It also
prevents a desync: the map dives back "to the garden", and Summer's board has to be the one in the
stage when it does. For the same reason the dock's **World** button comes home before it opens the
map, and the ceremony's last beat returns the player to Summer — a Turn opened from Fall would
otherwise end with the player looking at a bed the Turn did not touch while their garden was rebuilt
behind them.

**ONE SQUARE FOR BOTH SEASONS, from one function** (2026-08-31). `UI.boardSide()` measures `.stage`
and subtracts the yard's *reservation* — `.stage`'s own bottom padding — and both `sizeGarden()` and
Fall's `sizeBoard()` call it. Each season used to measure its own room, and that is where the
misalignment lived: Summer sized itself against the stage minus the **measured** creature yard, Fall
against its frame minus a chip strip, and Fall hides the creatures, so measuring the node returns
zero there. Reading the reservation instead of the node gives a number that is the same in both
seasons by construction. Measured at 390×844, 375×667 and 390×640, Summer's garden and Fall's board
now agree on top, left, width and height to the pixel at all three.

**Nothing is reserved out of that square any more, and nothing may be.** `.fl-wrap` is exactly the
board's box: the pill above it and Collect All below it are both absolutely positioned and take no
space in the layout, so neither can move the board — including at the moment Collect All appears,
which is precisely when the player is looking at it.

**The 23px offset was a margin halved.** `.fl-wrap` carried `margin-bottom:46px` to reserve the
chip's row, and a margin on one side of a `place-items:center` child shifts that child by **half of
it**. Equal margins on both sides look like the fix and are not: a grid falls back to
start-alignment the moment an item overflows its track, so on a short screen the same trick pushed
the board down by a whole strip instead of half of one. No margin at all is the only version that
holds at every height.

**The bed chip moved back above the board on 2026-08-31, on the owner's word** — a reversal of the
move below it made the day before, and the three failures that caused that move are answered rather
than reintroduced. It sat 2px inside the board and across the stubble fringe because it was anchored
4px clear; at `top:-46px` there is 5px of air between the chip and the fringe (which occupies -10px
to +2px) at every viewport. The notched-phone case, where the board filled the frame and pushed the
chip off the top of it, cannot recur: the board is now the same square Summer's is, and the chip
hangs outside it.

**The rail stands down in Fall below 700px, and keeps its box while it does.** With both boards the
same size, on a 667-tall phone the chip's row and the status rail's row are the same 48px of band
and there is no arrangement in which both fit. `visibility:hidden`, never `display:none` — hiding
the row would give its height back to `.stage` in Fall only, and a taller stage in one season is
exactly the misalignment this round removes. The rail loses the tie-break because a booster and the
Wonder Effect act on the **garden**: there is nothing in Fall for them to do and nothing there to
tap. Swipe back and they are there.

**Collect All is narrow because the band is not hidden in Fall.** `.fpill` (UPGRADE) and `.fround`
(POWER-UP) are hidden in the Hollow, the meadow and at a gate, but not in Fall, and they sit 34px in
from each edge of the same strip. A full-width pill overlapped both on a 667-tall phone. At 132px,
centred, it keeps at least 24px of daylight either side at every supported viewport — which is why
its label is two lines rather than one.

**The bed chip's pulse lives on a pseudo-element.** `affordPulse` animates `transform`, and the chip
is centred with `translateX(-50%)` — a running animation outranks that declaration and would throw
the centring away. Same collision as a state modifier that writes `box-shadow` and eats the lip.
Still true after the move: the chip is still centred with a transform, and the pulse is still on
`::before`.

**Its four states are unchanged** — filling, all-in-waiting, `.close` (one more, soft yellow),
`.armed` (gold with the pulse) — and so is the armed bed's gold rim, which is a rule on
`.fl-board.armed` and has nothing to do with the chip.

## The vertical ladder

**Rebuilt 2026-08-30 (phase 3.5), and re-pointed 2026-08-30 (phase 3.8).** The axis is three places
again, but they are three *rooms* now rather than three altitudes:

```
   THE WILD MEADOW   swipe DOWN from the garden    (out along the lane)
   THE GARDEN        you start here
   THE HOLLOW        swipe UP from the garden      (under the roots)
```

**The finger moves the world, not a pointer**, and a room leaves by the opposite swipe. Phase 3.5's
rule read the gesture the other way — *down goes under, up goes out* — which is correct as a picture
and wrong in the hand; the owner caught it from live play. No dock slot is spent on navigation
either way.

The garden's swipe still **only starts on the background** — plots and the flower act on
`pointerdown` and would fire on the way out, and making them wait for `pointerup` would cost the tap
latency the core loop is built on. On the map a drag is a pan, so only a gesture that moved less
than 12px counts as a tap; otherwise panning across the world would keep opening whatever it
finished over.

`.in-meadow` hides the stage, dock, rail and quest strip, exactly as `.in-hollow` does. **Only
`.in-meadow` hides coach marks in CSS** — `.in-hollow` never had that rule and the claim that it did
was wrong until 2026-08-30. Both rooms are now named in `refreshCoach()`'s own guard instead, which
is the stronger place for it: a hidden target measures 0×0 and parks the bubble in the top-left
corner over the wallets, so the mark has to be *not shown*, not merely not painted.

**`.in-fall` narrows rather than blankets.** `.in-fall .coach:not(.season){display:none}` — the two
season marks point at the season tabs, which are drawn in Fall and have a real rect; every other mark
points into the garden and would still land in the corner.

## The HUD is always up

**Decided 2026-08-25.** The wallets, the Almanac and Settings show in **every** place — garden,
Hollow, meadow, map. You should always be able to see what you have and reach your settings
whatever room you are standing in.

**Why it was not, and why the obvious fix does not work.** `.ui` is `z-index: 20`, which makes it a
**stacking context** — so nothing inside it, including `.hud`, can ever paint above a sibling layer
with a higher z-index. Raising the HUD's own z-index does nothing. The place layers had to go
**under** `.ui` instead:

| Layer | z-index |
| --- | --- |
| `.hollow` (inside `.ui`) | 5 |
| `.hud` (inside `.ui`) | 6 |
| `.meadow-layer` | 12 |
| `.map-layer` | 14 |
| `.ui` | 20 |
| `.fx-canvas` | 40 |
| `.scrim` / `.sheet` | 45 / 50 |

`.ui` then covers the whole screen above the map and the meadow, so while either is open it takes
`pointer-events: none` and the HUD takes `auto` — everything else in `.ui` is already hidden by
`.in-map` / `.in-meadow`.

**Anything a place puts along its own top edge must clear the HUD** — roughly 62px plus `--sat`.
Both the Hollow's exit hint and the meadow's status strip collided with the wallets before they
were moved down.

## A room's nodes are built once, not every tick

The meadow's hives and keepers were rebuilt from `innerHTML` on every slow tick and then given
their real geometry by `place()` on the *next* frame — so every 0.6s each one drew for exactly one
frame at its natural size. On a phone that reads as pets flashing in and out.

**Build the nodes once, keep them, and update in place**, the same rule `renderPlots()` follows and
the same shape the Hollow's `petEls` map already uses. Anything positioned by a post-layout pass
must never be recreated on a timer.
