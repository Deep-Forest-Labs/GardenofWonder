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

The mastery goal line is replaced by **two petal tracks**: name, pips, price. The pips are the game's
existing level vocabulary in the seed's own green, so a player reads "3 of 5" without a fraction; the
price is the ordinary `.price` family in three states they already know — green affordable, drained
short, grey `MAX`. Only the price chip is the button, so a mis-tap on the row cannot spend seeds.

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

### The year meter — the third pill (2026-08-29, phase 2)

**The meter is the pill.** `.wallet.meter` is a third wallet whose own body fills as the year does
(`.meter-fill`, an absolutely-positioned child at `z-index:-1` under `isolation:isolate`), so it
costs the HUD no more width than a third wallet and needs no second row for a bar. It is a real
`<button>`; the other two wallets are `div`s.

**It carries no number, and that is a measured decision, not a preference.** The column is 360px
inside `.ui`'s padding, three round buttons take 132 of it at 40px, and three *numbered* wallets need
~245px of the 220px left — so `.wallets` (which is `flex-wrap: wrap`) wraps, and it wraps and unwraps
**as the numbers grow**, which is the one thing a HUD must never do. Both numbers — the banked pouch
and the year's increment — live one tap away in the projection instead. The alternative that buys
both (the album star leaves the HUD for the Almanac) is a navigation change and is parked for the
owner in [35-morning-review.md](35-morning-review.md).

**The HUD tightens below 430px of width**, the same values the `max-height:700px` block already
uses: wallet padding 4/9 at 14px, 19px icons, 40px round buttons, and 7px of padding on the
numberless meter. Without it the pills wrap on every phone, with or without a number on the meter.
The 40px round buttons are a **measured** cost — see Accessibility below — and the fix that restores
44px is one fewer button in the HUD.

**Where it still wraps, and why that is where the line was drawn.** Measured at the composition
width, 390px: the three pills reach 222px at the worst realistic numbers ("880.2K" coins, "1,163"
gems), the round buttons 132px, and 222 + 8 + 132 = 362 of the 370 available — one row, with 8px
spare. At **375px** (an SE) the same numbers need 362 of 355 and the wallets wrap to two rows. That
is left as graceful degradation rather than chased: shaving the last seven pixels means padding and
gaps so tight that any future string re-breaks it, and the wrap only appears on the narrowest phone
at roughly a million coins *and* four figures of gems. One fewer round button removes the whole
problem.

**The fill shows the binding gate.** The Turn needs *both* the un-tallied increment ≥ `minSeeds` and
the year's earnings ≥ `minCoins`, so the bar is `min(seeds, coins)` — a bar that showed only one
would sit full while the other held the ceremony shut. Recomputed on the 0.6s slow tick, never per
frame: `projectedMint()` walks the whole Tally table. At full it takes `affordPulse`, the same breath
every affordable price wears.

**Tapping it.** Full → the ceremony opens (doc 32's re-invite: declining costs nothing and the
ceremony reopens from here forever). Short of full → `.year-pop`, a coach-mark-shaped card anchored
under the pill, with the increment, the banked pouch and **both gates drawn as tracks** so *why can't
I turn yet* is answerable without a wiki. Its tail is positioned from a measurement, because the pill
moves as the coin number grows. It shows the **un-tallied** increment and never the tallied pouch —
quoting the multiplier here would spoil the only piece of theatre the Turn has.

### The rest of the HUD

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
- Minimum 44 px tap targets **everywhere except the HUD row on phones narrower
  than 430px**, where the three round buttons and the wallet pills are 40px.
  That is a measured trade, not an oversight: with the year meter beside them
  the three pills reach 222px at realistic numbers, three 44px buttons are
  144px, and 222 + 8 + 144 is 374px of the 370px a 390px phone has. The choice
  was a 40px control or a HUD that wraps and unwraps as the player gets richer,
  and a layout that changes shape as you earn is the worse of the two. **One
  fewer round button restores 44px with room to spare** — see
  [35-morning-review.md](35-morning-review.md) §1. The quest strip is also
  under 44px and always has been.
- Sound effects and music independently disableable.

Missing, and worth knowing before claiming accessibility:

- **No keyboard navigation or visible focus styles.** Buttons are focusable by default but nothing
  is styled for it, and the game is unplayable without a pointer.
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

**Fall's board keeps the yard's padding even though its creatures do not follow it.** Both boards are
then the same size, which is what sharing the grammar means; the empty strip below Fall's board is
simply ground.

**The bed chip's pulse lives on a pseudo-element.** `affordPulse` animates `transform`, and the chip
is centred with `translateX(-50%)` — a running animation outranks that declaration and would throw
the centring away. Same collision as a state modifier that writes `box-shadow` and eats the lip.

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
