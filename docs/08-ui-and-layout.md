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

- **Safe-area insets** are respected on every fixed edge via `env(safe-area-inset-*)`.
- **`dvh`, not `vh`**, so the layout doesn't jump when mobile browser chrome slides away.
- **`touch-action: manipulation`** on buttons removes the 300 ms double-tap delay.
- **`-webkit-tap-highlight-color: transparent`** kills the grey flash on tap.
- **`overscroll-behavior: none`** and `overflow: hidden` on the body prevent rubber-banding.
- **`user-select: none`** everywhere, since the whole screen is a tap target.

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

The four dock modes share a tab strip — the `TABS` array in `ui.js`, with `SHOP_TABS` deciding which
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
