# Installable App (PWA)

Garden Wonder installs to a phone's home screen and plays with no network. That is three files —
[`manifest.json`](../manifest.json), [`sw.js`](../sw.js) and the `icons/` folder — plus a small
registration block at the bottom of `index.html`. There is still no build step and no dependency.

## What it buys

- **Home screen icon**, launched fullscreen with no browser chrome (`display: standalone`).
- **Offline play.** The whole game is precached on first visit.
- **Instant launch** from cache when the network is slow or gone.

It does *not* put the game in the App Store. That is a separate wrapper (Capacitor) and a separate
decision — see [10-decision-log.md](10-decision-log.md).

## The service worker is network-first, deliberately

This is the single most important thing on this page.

The game ships without a build step, so `game.js` has the same URL forever. There is no content
hash to change. A conventional cache-first worker would therefore pin a player to whatever build
they first installed, **permanently**, and the only escape would be remembering to bump a version
constant on every single push.

So [`sw.js`](../sw.js) goes to the network **first** for every same-origin request and falls back to
the cache only when the network fails or takes longer than `NET_TIMEOUT` (4s).

| | Behaviour |
| --- | --- |
| Online | Always the current build. The cache is never consulted. |
| Offline / stalled | The last-known-good copy, and the game boots normally. |
| Forgot to bump `VERSION` | **Nothing breaks.** No player is stranded. |

That last row is the reason for the design. `VERSION` in `sw.js` controls only when stale caches get
swept up, not whether players see new code. It is a housekeeping number, not a release lever.

The one exception is the Baloo 2 webfont, which is cache-first in its own `gw-fonts` cache. It never
changes, and caching it is what keeps the offline game looking like the online one.

## It stays out of local development

`index.html` **does not register the worker on `localhost`, `127.0.0.1` or `file://`** — and
actively unregisters any worker it finds there. Local iteration is therefore exactly what it was
before: edit, reload, see the change. No stale files, no hard-refresh dance, no "why isn't my
change showing up".

To exercise the worker locally, add `?sw` to the URL:

```
http://localhost:8899/?sw
```

Load the plain URL again afterwards and it unregisters itself.

## When you add a file to the game

`CORE` in [`sw.js`](../sw.js) lists the files precached for offline play. **A new `.js` file must be
added there**, next to its new `<script>` tag in `index.html`.

Forgetting is not fatal — network-first means an online player still gets the file normally — but
that file will be missing offline, and the game will fail to boot without a network. It is the one
maintenance obligation this system creates.

## Icons

`icons/icon.svg` is the source of truth, generated in the game's own style: the `round` petal path
lifted from [`flora.js`](../flora.js), the `#2c1a10` ink outline, the sky gradient from
[`style.css`](../style.css). The PNGs are rasterised from it.

| File | Used by |
| --- | --- |
| `icons/icon.svg` | Browser tab favicon, and the manifest's scalable entry |
| `icons/icon-192.png` | Android home screen |
| `icons/icon-512.png` | Android splash, install dialog, and the `maskable` entry |
| `icons/apple-touch-icon.png` (180×180) | iOS home screen |

The artwork sits inside the maskable safe zone (a centred circle of 40% radius), so Android can crop
it to any device mask without clipping the flower.

To regenerate after an art change, rasterise the SVG and downscale:

```bash
qlmanage -t -s 512 -o icons icons/icon.svg && mv icons/icon.svg.png icons/icon-512.png
sips -z 192 192 icons/icon-512.png --out icons/icon-192.png
sips -z 180 180 icons/icon-512.png --out icons/apple-touch-icon.png
```

## How players install it

- **iOS/Safari:** Share → *Add to Home Screen*. iOS shows no prompt and never will; if this matters,
  it is an argument for the App Store wrapper, not for more PWA work.
- **Android/Chrome:** an install prompt appears on its own, or Menu → *Install app*.

## Verified

On 2026-08-18, against a live server and then a killed one:

- Manifest parses; all four icon entries serve with correct MIME types.
- 22 core files precached on install.
- **Freshness:** with a client already running the worker, editing `index.html` and `manifest.json`
  on disk and reloading served the *new* content — including the navigation request — with no
  version bump.
- **Offline:** with the server stopped, a full reload booted the game — `Game` and `Flora` live, nine
  plots rendered, HUD, scenery and the webfont all correct.
- **Dev skip:** a plain `localhost` load left zero registrations.

## The status bar style decides whether the app reaches the bottom of the screen

`apple-mobile-web-app-status-bar-style` is **`default`**. It looks like the boring choice next to
`black-translucent`, and it is the one that works.

`black-translucent` gives an installed app a window sized to the screen *minus* the status bar, then
pins it to the top of the screen. The game draws under the clock — which is what you wanted — and
the bottom of the screen is left outside the window entirely, filled by iOS with the page's
background colour. Nothing in the page can draw there: `position: fixed`, `100dvh`, `inset: 0` and a
JS-measured height all describe the *window*, and the window stops short.

Measured on an iPhone 16 Pro, via Developer tools → Screen:

| | |
| --- | --- |
| `screen` | 402 × 874 |
| `window` | 402 × 812 |
| insets (top / bottom) | 62 / 34 |

The window is short by exactly the top inset, and the 34px bottom inset was being reserved for a
home indicator that sat outside the window. With `default` the window is placed below the status
bar, reaches the bottom of the screen, and the dock sits where a dock belongs. The strip along the
top is drawn from `theme-color`, which `updateSky()` keeps on the current sky — re-inserting the
meta element, not just rewriting it, so a snapshotted value cannot leave a stale sunset above a
midnight sky.

**Changing either meta needs the app deleted and re-added to the home screen.** iOS captured the old
`black-translucent` at install and kept honouring it through force-quits; the owner confirmed a
delete-and-re-add is what picked up the change.

## Standalone is not the same viewport as the browser

Installed, the game is the only thing on screen and there is no browser chrome to absorb a mistake —
so the two layout bugs the PWA has produced both showed up as the game ending short of the home
indicator, with the lawn stopping and page background under the dock. Neither reproduced in a
desktop preview.

- `.game` is a plain fixed `inset: 0` box with **no transform** — the shake lives on `#world`
  inside it — and `--app-h` is a `min-height` floor under it, so the box is the taller of what the
  browser says and what JS measured. `inset: 0` alone was wrong (2026-08-18), `height: 100dvh` was
  still wrong (2026-08-19), and both were measured on a transformed box; the third attempt
  (2026-08-20) removes the transform and stops letting any single signal make the box *shorter*.
  `sizeViewport()` in `ui.js` maxes `innerHeight` and `clientHeight` — the window, and only the
  window. A fourth attempt the same day stretched to `screen.height` and **pushed the dock out of
  the window on a real iPhone**; the window there is genuinely shorter than the screen. See
  [08-ui-and-layout.md](08-ui-and-layout.md#mobile-specifics).
- Safe-area insets come from four `:root` variables so the notched layout can be simulated in a
  preview by overriding them. `env()` reads `0` on the desktop, which is why this class of bug keeps
  reaching a real handset before anyone sees it.
- `<body>` paints the meadow, flat `#4fae54`, so anything left uncovered reads as more lawn — and
  **nothing may draw a dark edge above the join**: the vignette fades out before the bottom, the
  meadow fades its stripes out over the last 44px, and the closed bottom sheet no longer casts its
  shadow up into the lawn. iOS fills the strip below a short web view with this same colour, so a
  flat lawn meeting it is invisible either way.

**Check a layout change against a phone with insets before shipping it.** The suite cannot see any
of this — `tools/sim-test.js` is headless and never loads a stylesheet.

**`customers.js`, then `overworld.js` and `ui-map.js`, then `meadow.js` and `ui-meadow.js`, joined `CORE`; `VERSION` is now 4, 2026-08-25.** A new script file that is not
in that list works online and fails to boot offline — the trap this document exists to prevent.
