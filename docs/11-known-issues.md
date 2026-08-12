# Known Issues and Rough Edges

Things that are wrong, unfinished, or surprising, recorded so nobody rediscovers them from scratch.
Nothing here is a crash — the game is stable. These are correctness, balance and polish gaps.

If you fix one, delete it from this file in the same commit.

## Balance

### The combo does nothing

`tap.combo` drives the ring fill and the tap sound's pitch. It does **not** multiply payout.

That makes the **Combo Coil badge a dead purchase** — 2,500 coins escalating at 2× for a longer
musical run. A player reasonably assumes a "combo" affects earnings.

Inherited from *Idle Garden Reborn*, which worked the same way. Either wire it into payout or rename
it honestly. Wiring it in is a significant balance change, since taps would gain a multiplier that
climbs to 50–100.

*Where:* `game.js` `tapFlower()`, `ui.js` frame loop.

### Endgame seeds are worse gem farms than a Daisy

Harvest gem chance is `seed.gemChance` if defined, otherwise a flat **5%**. Only the top five seeds
define one — at 0.8% to 2%. So the optimal gem strategy is spamming the cheapest, fastest seed,
which is backwards.

Almost certainly the default was meant as a fallback for cheap seeds and got applied broadly. Fixing
it means either lowering the default or giving every seed an explicit value.

*Where:* `game.js` `harvest()`, `data.js` seed definitions.

### Orchid is a throughput trap

Orchid at 4.89 net coins/second is worse than Marigold at 5.45, despite costing 47% more, because
grow time jumps 55 s → 90 s. It's the only backwards step in nineteen tiers.

### Aurora Bloom and Celestial Lotus have identical throughput

Both 10.00 net/s. Celestial costs 33% more for the same rate — purely a convenience upgrade. Not
necessarily wrong, but not obviously intentional either.

### Crit chance is uncapped

Nothing clamps it. Above 100% every tap crits. The Almanac clamps the *display* to 99%, which hides
the situation rather than preventing it.

*Where:* `game.js` `tapFlower()`, `ui.js` `renderBonuses()`.

## Correctness

### Reset doesn't clear the legacy save

`Game.reset()` removes `gw-save` but leaves `igr-save` untouched, so a player who resets gets their
old *Idle Garden Reborn* progress re-imported on the next load. Confusing if you wanted a clean
start; arguably a safety net. Currently undocumented in the UI either way.

*Where:* `game.js` `reset()`.

### Cheat buttons ship to players

Settings contains "Grant 50 Gems & Tickets", "Grant 1,000,000 Gold", and "Summon a Wonder Effect".
These were development/testing affordances and are live on the public site. Unlike reset, they have
no confirmation.

Decide deliberately: keep them as a toy, or gate them behind something.

*Where:* `ui.js` `renderSettings()`.

### `harvestsThisSession` is not per session

It's saved and never reset, making it a lifetime counter. The name will mislead. Behaviour is
reasonable — progress toward the 10-harvest ticket bonus surviving a reload is what a player would
want — so this is a naming problem.

### Absolute timestamps are trivially exploitable

Growth, boosters and the Wonder all use wall-clock epoch seconds. Moving the system clock forward
completes every plot and expires every booster. No anti-cheat exists.

Fine for a single-player local game. It would matter if leaderboards were ever added.

## Dead code

- **`Flora.sprout()`** is exported and never called. Growth stage 1 uses CSS scaling of the full
  plant instead. Either use it for early stages or delete it.
- **`Icons.get('seed')`** is unused — `plantSpot` replaced it for empty plots.
- **`Icons.get('mute')`** is unused; the settings toggle uses `sound` in both states.
- **`--scene-tint`** is declared in `:root` and, as far as I can tell, never read.

## Accessibility

- **No keyboard support and no focus styles.** Buttons are focusable but nothing is styled, and the
  game can't be played without a pointer.
- **No screen-reader narration of the garden.** Plot states are invisible to assistive tech.
- **Rarity is communicated by colour alone** — no shape or text alternative.
- **Contrast is unaudited.** White outlined text over bright scenery is the likeliest problem.

## Platform

### Safari blocks localStorage on `file://`

Saves silently don't persist when the game is opened directly as a file in Safari. `setItem` is
wrapped in try/catch so it degrades to a non-persistent session rather than crashing. Chrome is
fine. Documented in the README; serving over HTTP avoids it.

### Pages deployments share a localStorage origin

Everything under `jonishua.github.io` shares storage. Not a problem today, but a second game
published to the same account would need a distinct key prefix.

### Haptics are absent on iOS Safari

`navigator.vibrate` is unimplemented. Calls are wrapped in try/catch. iPhone players get no
haptic feedback and there's no alternative.

### Ambient music scheduler never stops

`startMusic()` sets a 3.2 s interval that is never cleared. Muting takes the bus gain to zero but
the scheduler keeps creating oscillator nodes. Harmless in practice — they're short and
garbage-collected — but it's needless work while muted.

## Structural

### `ui.js` is doing too much

Around 1,300 lines covering DOM construction, seven sheet panels, input, HUD, rail, toasts, banners,
coach marks, scenery, day/night and the frame loop. The natural split points are the sheet panels,
the scenery/sky code, and the event wiring.

### Sheet panels use `innerHTML` with interpolation

All interpolated content currently comes from `data.js` and is trusted, so there's no live
vulnerability. But there's no escaping helper, so the first time player-supplied text reaches a
panel it will be an injection. Add escaping before adding any naming or text-entry feature.

### No automated tests

Verification is manual, per the checklist in [09-conventions.md](09-conventions.md). `game.js` has
no DOM dependencies and would be straightforward to test headlessly if that ever seems worth it.
