# Garden Wonder

A cozy tap-and-grow idle garden for phones. Plant seeds, tend a 3×3 planter box, and keep a
talking flower company while your harvesters do the boring parts.

Everything is drawn with CSS and inline SVG, and every sound is synthesized with the Web Audio
API — there are no image or audio files anywhere in this repo.

## Play it

Open `index.html` in a browser. That's it, no build step and no dependencies.

For the best experience, view it at phone width. On a desktop browser, open dev tools and
switch on device emulation (`Cmd`/`Ctrl` + `Shift` + `M`).

If your browser blocks local storage on `file://` URLs (Safari does), serve the folder instead:

```bash
python3 -m http.server 8899
# then open http://127.0.0.1:8899
```

## How it plays

- **Tap the flower** for coins. Taps build a combo that multiplies payout (+1% per combo), and crits pay out a multiple of the base.
- **Tap a plot** to plant a seed. Tap a growing plant to shave a little time off it, and tap a
  finished one to harvest.
- **Harvests roll a rarity** — Common, Rare, Epic or Legendary — multiplying the payout up to 8×.
- **Badges** upgrade your taps, growth speed and automation. **Decor** is cosmetic. **Boosts** are
  short surges you earn from quests, levels and the Almanac, then tap on the tray to activate.
- **The Almanac** tracks every species you have ever grown, best rarity included, and pays
  milestones at 5, 10, 15 and 19.
- **Harvesters** keep a single plot planted on their own, always choosing the best seed you can
  currently afford. The **Harvest Drone** collects ready plots for you.
- **The Wonder Effect** fires at random: for 20 seconds the garden goes rainbow, everything pays
  triple and plants grow three times faster.

Two currencies: coins from taps and harvests, and gems for premium decor.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | Markup shell — HUD, garden stage, dock and bottom sheet |
| `style.css` | The whole design system: palette, parallax scenery, day/night, animations |
| `data.js` | Content tables — seeds, upgrades, decor, boosts, Wonder config, flower dialogue |
| `flora.js` | Procedural SVG flower generator, including the Talking Flower |
| `icons.js` | Hand-drawn outlined icon set |
| `audio.js` | Web Audio synth for sound effects and ambient music |
| `fx.js` | Canvas particles, screen shake, floating numbers, haptics |
| `game.js` | Simulation: state, save/load, economy, automation |
| `ui-shared.js` | The scope the UI files share — `$`, `el`, the formatting helpers |
| `ui-scenery.js` | The sky ramp, day/night interpolation, clouds and the weather tint |
| `ui-sheet.js` | The bottom sheet and every panel that opens over the garden |
| `ui-events.js` | Every `Game.on(...)` subscription — feedback for what the simulation reports |
| `ui.js` | The garden, the talking flower, HUD, rail, input, the frame loop and boot |
| `legacy/` | The previous build (*Idle Garden Reborn*), kept for reference |
| `docs/` | Full design and technical documentation |

Scripts load in that order as plain `<script>` tags — no modules, so it works over `file://`.

## Working on it

Start with [`docs/`](docs/). It documents the game as actually built — architecture, every
mechanic and formula, the balance tables, the art and audio systems, the save format, and
playbooks for common changes.

If you're about to write code, read [`docs/09-conventions.md`](docs/09-conventions.md) first. The
short version: no build step, no dependencies, no binary assets, and `game.js` never touches the
DOM.

## Saves

Progress is stored in `localStorage` under `gw-save` and written automatically.

The first time you launch, any progress from the older *Idle Garden Reborn* build (`igr-save`)
is imported, and the old save is left untouched. Settings has a reset button if you want to
start clean.

## Accessibility notes

- Respects `prefers-reduced-motion`: particles thin out and animations are cut.
- Sound effects and music can each be toggled off; music is off by default.
- All tap targets are at least 44 px.
