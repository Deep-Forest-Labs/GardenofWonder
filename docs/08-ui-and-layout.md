# UI and Layout

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
│  boost tray                 │  rail         (row 3, auto — hidden if short)
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
│   Upgrades  Apiary Craft Shop │ dock       (row 5, auto)
└─────────────────────────────┘
```

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

### Navigating between the garden and the Hollow

**Swipe up in the garden to go down; swipe down in the Hollow to come back.** Both drag the world
past you in the direction a scroll would. The burrow mouth stays as the discoverable entrance.

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
| `settings` | Settings | Gear button in HUD | none |
| `dev` | Developer tools | Unlabelled hit area beside the gem wallet | none |
| `welcome` | While you were away | Opens itself on load after a real absence | none |
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

### The Almanac seed row

The `bonuses` panel lists all nineteen seeds. A grown row is two lines; an ungrown row is one.

```
🌼  Daisy                       LEGENDARY   ×512
    Tier 13 · 512 / 1,000 total  ▓▓▓▓▓░░░    +60%
```

The top line is three columns and no sentence — bloom and name, best rarity, lifetime count. The
name flexes and ellipsises; rarity and count are fixed width so the columns line up down the list.
The rarity label is tinted per tier (`.r-rare` / `.r-epic` / `.r-legend`); Common stays grey.

The second line is the **current mastery goal only**, never the rest of the ladder: tier number,
progress against the goal, a thin bar, and the yield earned so far. A gem pip sits beside the goal
text when the tier being climbed is a fifth one, so the reward is visible before it lands. Ungrown
rows keep the bloom and name, show a dash in both columns, dim to 45%, and get no second line —
the first harvest starts the climb toward tier 1.

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
| `locked` | Padlock and coin price, or "Lv *n*" if the level has not opened it yet; pulses when affordable (`data-afford="1"`) |
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

**Weather** sets `data-weather` on `.game` and `--weather-tint`, painted as an overlay on
`.scenery::after` rather than by replacing the sky — so the day/night cycle keeps running underneath.
Rain and Thunderstorm `multiply`; Aurora and Wonderfall `screen`. Opacity is per-weather and tops out
at .52 for a storm, which reads as overcast without hiding the garden.

**Cue discipline.** The sky is the only cue for ordinary weather; a banner four times an hour would
be noise. Aurora and Wonderfall get a line from the flower, and Wonderfall alone gets a banner.
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

Two wallet pills — coins and gems — plus round buttons for the Almanac and Settings. A
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

## Status rail — the boost tray

Between the quest strip and the stage. This is where boosters live now that they're out of the dock (navigation
phase 1, [15-navigation-and-ia.md](15-navigation-and-ia.md)): each booster in `DATA.boosters`
renders as a countdown chip while active, or a tappable `data-boost` chip while you hold at least
one and it is idle. Neither → nothing renders for it, so the tray never shows an empty slot as an
upsell. A Wonder countdown is prepended when active so it always leads.

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

**Coach marks** are absolutely positioned tooltips above their target, repositioned on resize and
every 0.6 s. Suppressed while a sheet is open. The flower will not speak while one is visible.

## Dock attention dots

Each dock button carries a dot shown when something in that shop is affordable and that shop isn't
already open. Recomputed every 0.6 s in `updateDockDots()`. This is the primary discovery mechanism
— it's how a player learns a shop is worth opening without being nagged.

Upgrades and Shop show a dot when something in them is affordable, Apiary when jars are waiting,
Craft when something is ready to make or collect. Boosters have no dock dot — the buy chip itself,
appearing in the rail only when affordable, is the affordance.

The same idea is the intended basis for **contextual upgrade affordances** in
[15-navigation-and-ia.md](15-navigation-and-ia.md): once upgrades live on the objects they upgrade,
a small corner dot on the object replaces the dock dot. Reuse this pattern rather than inventing a
second one.

## Responsive breakpoints

| Condition | Change |
| --- | --- |
| `max-height: 700px` | Dock, wallets and round buttons shrink |
| `max-height: 600px` | Rail hidden |
| `min-width: 600px` and `min-height: 760px` | Horizontal padding added so the garden doesn't sprawl on tablets |
| Landscape, `max-height: 560px` | Rail hidden, sheet grows to 94dvh, dock compressed |

## Accessibility

Present:

- Every interactive element is a real `<button>`.
- `aria-label` on icon-only controls, `aria-hidden` on decorative scenery, canvas and SVG.
- `aria-live="polite"` on the rail and toast container.
- `role="tab"` with `aria-selected` on sheet tabs; `aria-pressed` on settings toggles.
- `aria-hidden` toggled on the sheet as it opens and closes.
- Full `prefers-reduced-motion` support.
- Minimum 44 px tap targets.
- Sound effects and music independently disableable.

Missing, and worth knowing before claiming accessibility:

- **No keyboard navigation or visible focus styles.** Buttons are focusable by default but nothing
  is styled for it, and the game is unplayable without a pointer.
- **No screen-reader narration of the garden.** A blind player gets no plot states.
- **Colour is the only channel for rarity.** No shape or text differentiation.
- Contrast has not been formally audited.

## The vertical ladder

Since 2026-08-25 the game is three places stacked on one axis, with one rule:

```
   THE MAP        swipe DOWN from the garden
   THE GARDEN     you start here
   THE HOLLOW     swipe UP from the garden
```

**Down pulls the camera back, up goes in.** From the map, swiping up dives to the garden; from the
Hollow, swiping down comes back up. One gesture, one metaphor, and no dock slot spent on
navigation.

The garden's swipe still **only starts on the background** — plots and the flower act on
`pointerdown` and would fire on the way out, and making them wait for `pointerup` would cost the tap
latency the core loop is built on. On the map a drag is a pan, so only a gesture that moved less
than 12px counts as a tap; otherwise panning across the world would keep opening whatever it
finished over.

`.in-map` hides the stage, dock, rail and quest strip, exactly as `.in-hollow` does — and both hide
coach marks, because a coach mark points at something in the garden that is now covered.

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
