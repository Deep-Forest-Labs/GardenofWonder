# The motion bible

**What moves in Garden Wonder, when, how far, for how long, and why** — written for the engineers
rebuilding the feel in Unity, so that they, and the agents they brief, never need to open the
JavaScript to get it right. It describes the web build's feel exactly; translating that feel into
Unity is theirs.

It comes in two halves:

- **Half 1 — the language of feel.** Authored. The principles, the tap frame by frame, the particle
  system as a spec, the feedback ladder, reduced motion, and where the code is. Short sections,
  each one thing.
- **Half 2 — the inventory.** Generated. Every keyframe animation, every rule that plays one,
  every transition, every call into the particle system and every piece of JavaScript
  choreography, read out of the source. **Regenerate it with `node tools/export-motion.js`**;
  `node tools/export-motion.js --check` says whether it is stale. Nothing between its two markers
  is ever edited by hand — the next run overwrites it, and a hand-made table is a lie the next run
  deletes.

**This document owns motion and nothing else.** Art direction — the palette, the material recipe,
how things are drawn — stays in [05-art-direction.md](05-art-direction.md). Sound stays in
[06-audio-and-fx.md](06-audio-and-fx.md): every ladder row below names its sound, because feel is
both, but the recipes and the mixing live there. The screens, as pictures, are in
[44-screens.md](44-screens.md); the art as files is in [45-asset-inventory.md](45-asset-inventory.md).

**How to read the numbers.** Distances are CSS pixels on the 390×844 phone the game is composed
for; y grows downward, so a negative vertical speed is upward. Times are milliseconds from the
moment the finger lands (t = 0) unless a row says otherwise. A fact marked **driven** was watched
happening in the running build with `tools/probe.js`; one marked **read** was taken from the source.
Every pointer into the code is a function name plus a string you can grep for — never a line
number, which rots the day it is written (the anchor standard, [43-punch-list.md](43-punch-list.md)).
The words are the glossary's: gold, the Turn, a catch, the windfall, the tuck-in, the snowfall —
see the top of [32-the-garden-year.md](32-the-garden-year.md).

---

# Half 1 — the language of feel

## The four principles

[05-art-direction.md](05-art-direction.md) names four, and every piece of motion in the game is one
of them. Here they are with their numbers.

### 1. Squash and stretch on contact

Anything touched, or landed on, squashes wide, stretches tall, and settles — never a plain scale.
The canonical shape is the flower's head on every tap (`headSquash`), and a plant struck by a
raindrop wears the same one (`wxSquash`):

| Time | 0 ms | 112 ms (35%) | 224 ms (70%) | 320 ms |
| --- | --- | --- | --- | --- |
| Scale (x, y) | 1, 1 | **1.16, 0.84** — squashed | **0.92, 1.1** — stretched | 1, 1 |
| The head's offset | rest | 4 units down | 4 units up | rest |

(Units are the flower drawing's own, a 120 × 130 viewBox with the head anchored at (60, 56).)

A creature you pet does it the other way up (`critter-bop`, 420 ms): it hops first, stretched
(18% of its height up, scale 0.92 × 1.12, at 30%), then squashes on landing (1.1 × 0.9 at 60%).
Flat interface pieces get a uniform pop instead: the gold wallet swells to 1.18 and tips −3° at
40% of 340 ms (`walletPop`) when a tap, a harvest or a keepsake pays — Fall and Winter picks do
not pop it, and a refused replant does; a watered plant perks to 1.1 (`plantPerk`, 500 ms).

**A contact replays from the start every time.** The class is removed, the element is forced to
lay out (`void el.offsetWidth`), and the class is added back — the reflow restart. Tap five times
in half a second and the head squashes five times from zero, never once from wherever it had got
to. Every restart in the game is listed in Half 2's JavaScript choreography table.

### 2. Overshoot on entry

Things arrive past their mark and settle back. Three curves do it, and they are the house style —
the easing vocabulary in Half 2 counts every use:

| Curve | Peak | Reached at | Used for |
| --- | --- | --- | --- |
| `cubic-bezier(.34,1.56,.64,1)` | 9.8% past | 57% of the time | most pops: toasts, the head squash, the wallet, a plant perking, a creature bop, a Tally line |
| `cubic-bezier(.34,1.7,.64,1)` | 14.3% past | 54% | the loudest arrivals: the flower's press, the speech bubble, the banner |
| `cubic-bezier(.34,1.4,.64,1)` | 5.3% past | 63% | a plant growing from one stage to the next |

The shapes of arrival: a toast drops 24 px and grows from 0.8 as it fades in (400 ms); the banner
spins in from 0.3 and −14° to 1.12 and +3° at 60%, then settles (550 ms); the ladybug lands from
about 13 px above at 0.3 and −24° to 1.28 and +10°, then settles (600 ms — its `translateY(-42px)`
sits inside the 0.3 scale); a card pack drops onto its plot from 26 px above and −20° (500 ms). **Exits do not overshoot**: the banner leaves by shrinking
to 0.7 and fading, on a plain `ease`, in 400 ms, and a toast by fading up and away over 300 ms.
The one exception is the speech bubble, which leaves on its entrance curve and so dips past its
closed pose — to 0.657 against 0.7, about 150 ms in — unseen only because its opacity has already
faded; worth not copying on purpose.

**In a keyframe animation the easing restarts at every stop.** CSS applies the timing function to
each stretch between two stops, not once across the whole animation — so `headSquash`, with four
stops on the overshoot curve, overshoots three times in 320 ms, once per segment. A port that
eases the whole animation once will look soft.

### 3. Ambient idle

Nothing is perfectly still, and nothing idle asks for attention: slow loops, small amplitudes,
`ease-in-out` there and back. The talking flower alone runs seven — its glow breathes (3.2 s, scale
0.94↔1.08), its stem sways ±1.6° (3.4 s), its petals turn once every 26 s, it blinks every 5.4 s
(lids shut from 95% to 97% of the loop, about a tenth of a second), its cheeks pulse (3 s) and its
two leaves wave, −9° over 2.6 s and +9° over 2.9 s. **The periods are all different**, so the
loops never fall into step and the flower never visibly repeats.

In the garden the idle loops are invitations, each switched on by a state: a ripe plant wiggles
±2.2° (800 ms) while its plot bounces 4 px (1.05 s) under a light sweep (1.9 s); a price you can
afford pulses to 1.09 (1.4 s); an empty plot's mark bobs while a new player is learning (2.6 s).
Clouds cross the sky on long loops with **negative delays**, so each starts mid-flight rather than
all entering together. Half 2 marks every loop that runs whenever its element exists — *always on*
— and flags the ones that never stop with ∞.

### 4. Shake for impact

A shake is punctuation for **one moment landing** — never for a state that lasts, which is why no
sky shakes the screen. The whole world jitters (see `shake()` below for the maths), with power
climbing the ladder: a refusal 3–4, an Epic harvest 5, a crit 7, a Legendary harvest or a level-up
9 over 0.4 s, the Wonder 10 over 0.5 s. **Power is not the peak**: the peak also scales with the
time asked for, so the Wonder's shake opens at about 17 px and a denial's at 1.5 px. The feedback
ladder below gives every shake in the game.

## The tap, frame by frame

The core loop is a thumb on the talking flower, and everything here was **driven**: twelve runs of
`tools/probe.js` at 390×844, with every `FX` call, every sound and every vibration recorded as it
fired, the canvas drawing intercepted, and each CSS animation read back from the browser. Where a
fact could not be driven it says **read**.

**Two clocks, and the second one lags.** A finger lands and one synchronous burst of JavaScript
decides everything — the payout, the particles, the sound, the vibration — within about 2 ms.
Nothing is *drawn* in that burst. The canvas draws the coins on the next frame (about 16 ms on a
60 Hz phone, already one frame into their flight), and each CSS animation starts its own clock on
the next frame that renders. So in the tables below, the JavaScript times are from the finger, and
**the keyframe times are from the animation's own start** — which is where a port should start
them too.

### The picture: one ordinary tap

```
t (ms from the finger)  0    100  200  300  400  500  600  700  800  900  1000
                        |    |    |    |    |    |    |    |    |    |    |
decided, in one burst   #                                                   payout, combo +1, every call below
haptic                  #                                                   one 7 ms buzz (Android only)
tap sound               ######                                              two tones, gone by ~160
eyes glance             #########                                           pupils ease toward the finger
head squash             vvvvvv^^^^^^....                                    squash, stretch, settle: 320
mouth open              #################                                   snaps back to the smile at 340
gold wallet pop         ####.............                                   swell peaks at 78, rest at 340
digits roll up          ####                                                +1 has landed by ~82
floating number         +++++++++=====............................x         in by 187, half gone by 283
coins (4)               ooooooooooooooo>>>>>>>>>>>>>>>>>>>...........x      hop, pulled home, fade, gone
flower press (browser)    \\\\\___//////                                    down ~50, up ~190, still ~320
if the finger stays                                                  R      the whole tap again at 900

v squash  ^ stretch  + fading in  = over half opacity  . fading out  o ballistic  > magnet  x removed
```

One column is 20 ms. The coin lane is a median coin (0.9 s); each of the four draws its own
lifetime, so the flight ends anywhere from 750 to 1,050 ms. The press lane is the browser's timing in Chrome's
touch emulation — **the browser decides when `:active` applies**, and on-device iOS was not
measured.

### The ordinary tap, piece by piece

| When | What | The numbers | Where |
| --- | --- | --- | --- |
| 0 | **Input** | `pointerdown`, never `click`, with `preventDefault()` first — the tap latency is load-bearing. Then `Sound.resume()` (the audio unlock), the eyes, the tap; on a save's very first tap, the intro coach mark is hidden after the tap has fired. The browser still fires a `click` about 35 ms later; nothing listens for it. | `wireFlower()` — grep `holdTimer = setInterval(() => Game.tapFlower(true)` |
| 0–2 ms | **The payout** | Gold = round(tap power × (1 + tap-power boost) × (1 + all-gold boost) × (×10 on a crit — +2 per Crit Multiplier level, to 50) × (×3 in a Wonder) × (1 + 0.01 × the combo *before* this tap)); then the combo goes up by one (max 50; each Combo Coil level adds 10, to 100). Crit chance is 5% plus boosts, at most 99%. A 5% roll adds a gem. Every tap also rolls the Wonder (0.15%), a card pack (0.15%) and the three garden procs (zero until their upgrades are bought). It emits `currency`, then `wonder` if one sparked — so the Wonder's beats land before the tap's — then `tap`. | `tapFlower()` — grep `state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1)` |
| 0 | **Haptic** | `vibrate(7)`: one 7 ms buzz. iOS Safari has no vibration API, so an iPhone feels nothing. | `Game.on('tap')` — grep `FX.haptic(7)` |
| 0–160 ms | **Sound** | Two tones on the C-major pentatonic, pitched by the combo: a triangle for 110 ms at gain 0.22 and a sine a fifth above for 80 ms at gain 0.10 from +10 ms, each rising over 12 ms and decaying exponentially, stopped 50 ms after. The pitch climbs D5, E5, G5, A5, C6, D6, E6, G6, A6 over combo 1–9, then **wraps to C5 at every multiple of ten** — see the combo below. Recipes and mixing are in [06-audio-and-fx.md](06-audio-and-fx.md). | `Sound.play('tap', p.combo)` |
| 0–180 ms | **The eyes** | The pupils look toward the finger, measured across the flower button's box (110 × 141 px on the phone): sideways by `2 × clamp((x − centre)/(width/2), −1, 1)` units, and down or up by `1.6 ×` the same from a point 42% of the way down — at most ±2.2 px and ±1.7 px — eased over 180 ms. The eyes stay where they last looked; a dead-centre tap looks slightly down. | `lookAt()` — grep `flowerBtn.style.setProperty('--px'` |
| 0–320 ms | **The head** | `headSquash`, 320 ms on the house overshoot curve. Because the curve overshoots inside every segment, the real extremes are not at the stops: the squash peaks at **64 ms (1.176 × 0.824, the head 4.75 px down)**, the stretch at **176 ms (0.897 × 1.125, 5.2 px up)**, a last 1.007 settle around 280 ms, then rest. | `faceReact()` — grep `face.classList.toggle('squint', mood === 'crit')` |
| 0–340 ms | **The mouth** | Swaps, never tweens. One path in the head's units, filled `#a83250` with a 2.6-unit ink outline: idle `M-8,10 Q0,17 8,10`, a tap's open crescent `M-7,9 Q0,20 7,9 Q0,14 -7,9` (14 wide), and a 340 ms timer puts the smile back. Taps closer together than 340 ms hold it open. | `faceReact()` — grep `faceTimer = setTimeout` |
| 0–340 ms | **The gold wallet** | `walletPop`, 340 ms: swells to **1.198 and tips −3.3° at 78 ms**, dips to 0.982 at 253 ms, rests at 340 — about its own centre, so the coins' target does not move. It pops at the tap — **before** the coins arrive. | `popWallet()` — grep `c.wallet.classList.add('pop')` |
| 16–82 ms | **The digits** | The counter chases the real balance every frame, closing `min(1, 9·dt)` of the gap and snapping once it is within 0.6 (numbers abbreviate from 100,000): +1 lands in ~82 ms, +10 in ~300 ms, +70 in ~500 ms. **The number has arrived long before the coins do.** | `hudTick()` — grep `Math.min(1, dt * 9)` |
| 0–850 ms | **The floating number** | `+N` over the flower — its centre, 35% of the way down — 19 px white with the ink outline, `floatUp` (table in the particle spec below). It is in by 187 ms, 19.5 px up at 1.14 scale; the fade is front-loaded — half gone by 283 ms, 11% left at 467 ms — so it **reads for about 0.4 s**; it is removed at 850 ms, 63 px up. | `Game.on('tap')` — grep `FX.floatAt(UI.flowerBtn()` |
| 16–1,050 ms | **The coins** | **Four** coins (sixteen on a crit) from exactly the flower's centre, no spread — the `coins()` spec below. They hop, crest around 300 ms, are pulled to the gold wallet's centre (428 px away on the phone) from 240–336 ms, start fading at 562–788 ms and are gone by 750–1,050 ms. **Landing triggers nothing** — no pop, no tick, no sound: the magnet is the eye's reward, not the ledger's. | `Game.on('tap')` — grep `FX.coins(c.x, c.y, p.crit ? 16 : 4)` |
| ~16 ms | **The combo ring** | A circle 112% the size of the flower's cell (123 px on the phone), centred on the cell: a conic sweep from 9 o'clock, clockwise, of gold `#ffc93c` up to `combo / comboMax × 360°`, then a white track at 0.28, masked to a 6–7 px band with a 4 px gold glow. Its length **steps** on the next frame — it never sweeps — while its opacity, `0.3 + 0.7 × fraction`, eases over 300 ms. One tap is 7.2°. | `frame()` — grep `'--combo-op'` |
| ~50–320 ms | **The press** | While the finger is down the flower sits at scale 0.9 and 2.7 px lower (the 3 px drop sits inside the scale), on a 90 ms overshoot transition that bottoms at 0.886 and rebounds to 1.014 on release. When `:active` applies is the browser's call. | `.flower-btn:active` in `style.css` |
| 6% | **Speech** | One of five lines, 13 px on a paper bubble centred over the flower's cell, its bottom 10 px above it, springing from its tail (origin 50% 100%) out of 0.7 scale and 8 px low over 280 ms (overshoot curve), for 2.4 s. Refused while a coach mark is up, within 3.2 s of the last line's start, or in Winter's room. A tap also resets the 26 s idle clock, so the flower's idle chatter waits for a quiet garden. | `Game.on('tap')` — grep `if (Math.random() < 0.06) UI.say('tap')` |
| 900 ms | **Hold** | A finger that stays down repeats the whole tap — everything above, at the new combo pitch — every 900 ms (Quick Grip: 60 ms less per level, never under 180 ms). The interval is read once, at the press; lifting the finger, a cancelled pointer or the finger leaving the flower stops it. Each repeat measures the flower as it is — pressed, so its centre sits ~2.7 px lower. | `wireFlower()` — grep `holdTimer = setInterval` |

**An ordinary tap has no ring.** The expanding circle is the crit's alone; the only circle on an
ordinary tap is the combo ring. Inside the tap handler the order is: the float, the coins, the
wallet pop, the face, the activity clock; then the crit or ordinary block (shake, stars, ring,
buzz, sound, speech); then a gem; then the procs; then a card pack, whose 14 sparks and 80 px ring
fire on the plot it lands on.

### What a crit changes

Five percent of taps by default, paying ten times. Everything above still happens, except:

| | Ordinary | Crit |
| --- | --- | --- |
| Coins | 4 | **16** |
| Floating number | 19 px white, `floatUp` | **27 px `#ffe066`, `floatCrit`**: spins in from 0.4 and −12° to 1.5 and +6° by 170 ms, 30 px up; 1.15 and −3° at 468 ms; drifts sideways only in the last stretch; 107 px up at 850 ms. Fades from 170 ms: 0.44 left at 283 ms |
| Ring | none | `#ffe066`, 130 px, 0.5 s — radius eases out, width 6 → 1 px |
| Stars | none | 10, `#ffe066` |
| Shake | none | `shake(7)`: 0.28 s — 16 painted frames at 60 fps (the 17th step writes and removes it in the same frame), opening at 6.6 px and up to 0.6° |
| Haptic | 7 | `[12, 30, 22]` — 64 ms |
| Sound | the combo-pitched pair | `crit`: four square notes C5 E5 G5 C6, 130 ms each at gain 0.14, 45 ms apart, and 250 ms of white noise through a 2,400 Hz high-pass at gain 0.10; ignores the combo |
| Face | open crescent | a wider mouth, `M-10,8 Q0,23 10,8 Q0,15 -10,8` (20 units), and **a squint**: the eyelids stop blinking and hold at 55% of their closed height, from the top, for 340 ms |
| Speech | 6% chance | always *attempted* (not forced), so the cooldown, a coach mark or Winter can still drop it |

The squint ending restarts the 5.4 s blink from zero, so **the flower cannot blink for about five
seconds after a crit**, and a run of crits stops it blinking altogether.

### Tapping a plant

A plot answers `pointerdown` exactly as the flower does, and what a tap does depends on what is in
it:

| The plot | What happens |
| --- | --- |
| **Empty** | The seed picker opens (the `open` sound; the sheet's own slide is in Half 2's choreography). No particles on the plot. In headless Chrome the same tap's late `click` then lands on the sheet's dimming scrim and closes it again — **unverified on a phone**, filed in [11-known-issues.md](11-known-issues.md) as a hypothesis, and a pattern the port should guard. |
| **A seed chosen** in the picker | That one is a `click`. 8 soil-brown sparks (`#c99a6b`) 8 px below the plot's centre, the `plant` sound, `vibrate(10)`; the sheet closes with its `close`; next frame the plot shows the sprout with no entry tween. A **free** sowing (a Spreader's) shows an *Auto* tag for 1.1 s instead of the sound and buzz — a Plot Harvester's planting is paid, so it sounds and buzzes like a hand planting and never shows the tag (filed). |
| **Growing** (hasten) | 2% of the plant's current grow time comes off (× (1 + any grow boost + 1% per Sprinkler Network level)), and since that shortens the grow, the next tap takes 2% of the shorter one; 4 mint sparks (`#8ce99a`) 10 px below centre, `vibrate(6)` — **and no sound, no float**. The progress bar eases over 180 ms, which early in a grow is a fraction of a percent. The plot's own press: 3 px down. |
| **Ripe** | It was already asking: bouncing 4 px every 1.05 s, the plant wiggling ±2.2° every 800 ms, the ready tag popping, a light sweep crossing it. The tap harvests — the rows below — and next frame it is empty again. |

A harvest, by the rarity it rolls (**driven** for all four):

| Rarity | Coins | Floating number | Stars and ring | Shake (peak) | Haptic | Sound | After |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Common | 6 | `big`: 24 px `#b2f2bb`, 1.1 s | — | — | 12 | `harvest` | a 12% chance of a line |
| Rare | 9 | `rare`: 19 px `#a5d8ff`, 850 ms | 9 `#4dabf7`; ring 150 px, 0.6 s | 3 (2.8 px) | `[10, 20, 14]` | `rare` | a blue ring stays on the empty plot; a 12% chance of a line |
| Epic | 14 | `epic`: 19 px `#d0bfff` | 9 `#b197fc`; ring | 5 (4.7 px) | `[10, 20, 14]` | `legend` | a toast; a purple ring on the plot; a 12% chance of a line |
| Legendary | 22 | `legend`: 26 px `#ffd43b`, 850 ms | 16 `#ffd43b`; ring; **34 confetti** | 9 over 0.4 s (**12.3 px**) | `[20, 40, 20, 40, 40]` | `legend` | a toast, a forced line (which then blocks the 12% one), a gold ring and glow on the plot |

The ring left on the plot is the rarity's trace: it stays until the plot is replanted. Around the
payout float, a harvest can add more floats, each placed so they do not collide: a first discovery
(`big`, 20 px left and 28 up), a gem (`gem`, 26 right and 20 up), a reputation grant (`big`, 40
up), ladybug luck (`lucky`, 18 below — or 36 when a multiplier line shows), and the multiplier
itself (`mult`, 14 px type, 14 below).

Two oddities worth keeping or fixing on purpose: the **Legendary's number (850 ms) leaves sooner
than a Common's (1.1 s)**, and on a gem tap the `+1 Gem` float starts on **exactly** the same
point as the payout — only their random drift separates them.

### The combo, exactly

- **It rises one per tap** and pays `1 + 0.01 × combo` on the next.
- **It falls one per second on a free-running clock** — `frame()` counts seconds and takes one off
  each time it passes a whole one, whenever you last tapped. A single tap's point disappears
  anywhere from 0 to 1,000 ms later (driven: 49, 498, 674 and 862 ms), and the tick lands in the
  middle of streaks. It pauses when the frame loop does. A thumb therefore has to tap more than
  once a second to build it; holding at 900 ms nets about +0.1 a second.
- **The pitch wraps every ten.** The combo after the tap picks the note, `SCALE[combo % 10]`, so
  the climb is nine notes long and returns to the bottom at 10, 20, 30… And because every combo
  cap (50, or 60–100 with Combo Coil) is a multiple of ten, **a player sitting at the cap hears the
  lowest pair on every tap** — the payoff sounds like a reset. Filed in
  [11-known-issues.md](11-known-issues.md) for the owner; the port should decide on purpose.

## The particle system, as a spec

`fx.js` is a small particle engine with a public API. Everything below is read from it, and each
paragraph is meant to be enough to rebuild the call without the source. The inventory in Half 2
repeats every signature, defaults and all, straight out of the file, so if a paragraph and that
table ever disagree, the table is right and this paragraph is stale.

### The canvas and the loop

One full-window `<canvas>` (`#fx`) drawn in CSS pixels at a device-pixel ratio capped at 2 — an
uncapped 3× phone would triple the fill cost for nothing visible. It sits inside the world, so
**the screen shake moves it with everything else**, and it stacks **above** the heads-up display
and the dock (z-index 40 against the interface's 20) and **below** the dimming scrim, an open
sheet, the toasts and the banner (45, 50, 60, 70): coins fly over the gold wallet and land on top
of it, and a sheet slid up covers them. It ignores the pointer. (**Driven**: the canvas's parent is
`#world`, its z-index 40, the interface's 20, the sheet's 50.)

Nothing runs on its own clock. `FX.step(dt)` is called once per frame by the game's single
`requestAnimationFrame` loop (`frame()` in `ui.js`), which clamps `dt` to 0.1 s; `step()` clamps it
again to **0.05 s**, so a hitch slows every particle down rather than teleporting it. Each frame
clears the canvas and draws, in this order: the ambient petals, the weather, then the particle
pool. The pool is walked newest-first, so **the oldest particle paints on top**.

### What every particle shares

A particle is born with a lifetime (`max`, seconds) and a position at the point that paid, and
every frame it ages by `dt`. With `k = life / max`:

- **It dies at `k = 1`.**
- **It fades over its last quarter**: full opacity until `k = 0.75`, then linearly to nothing at
  `k = 1`. (The ring is the one exception — it fades from its first frame.)
- **It moves by semi-implicit Euler**: velocity picks up gravity first (`vy += g·dt`), then drag if
  it has any, then position picks up velocity. Speeds are in px/s, gravity in px/s².
- **It spins** if it has a spin: `rot += spin·dt`.

Every range below is a uniform random draw, made once per particle at birth.

### `coins(x, y, n = 8, opts = {})`

The one that sells the economy: gold visibly flies into the wallet.

- **Count** `n`; **capped at 3** under reduced motion. `opts.color` tints it (default `#ffc93c`);
  `opts.magnet: false` switches the wallet pull off.
- **Launch**: `vx` in [−140, 140], `vy` in [−380, −180] (upward), gravity **900**, radius in
  [6, 10], lifetime in [0.75, 1.05] s, spin in [−8, 8] rad/s from a random angle.
- **The arc**: an ordinary ballistic hop. Its apex comes 200–422 ms after launch at 18–80 px
  above the spawn point (median 312 ms and 44 px; 211–411 ms and 20–76 px for nine coins in
  ten), spreading ±40 px or so sideways.
- **The magnet**: once `k` passes **0.32** — 240 to 336 ms after launch, around the crest (about
  two coins in three are still rising when it takes them) —
  gravity and velocity stop applying, and each frame the coin moves a fraction **`0.24·m`** of the
  remaining distance toward the target, where `m = min(1, (k − 0.32) / 0.55)` ramps from 0 to 1.
  The target is the centre of the gold wallet's on-screen box, used directly as a canvas point
  and **re-measured every frame** while any particle is alive, before that frame's shake is
  written (registered once at boot with `FX.setMagnet('coin', walletElement)`; with no target,
  coins simply keep falling and fade, and a wallet with no layout would pull them to (0, 0)).
- **That fraction is per frame, not per second, so the landing depends on the frame rate.**
  Simulated with `fx.js`'s own constants over 20,000 coins, from the flower's centre (195, 426)
  to the wallet's (45, 25) on the phone: at 60 fps the median coin is 31 px short when it starts
  to fade and 1 px short when it dies — it lands as it vanishes, which is the tuned feel. At
  30 fps it dies 22 px short and visibly misses; at 120 fps it is already home (3 px) before it
  fades and sits on the wallet. The 60 fps curve is the one to keep; a frame-rate-free form of it
  is `1 − (1 − 0.24·m)^(60·dt)`.
- **The look**: a flipping coin — born at a random angle in [0, 2π), and the whole drawing is
  squashed horizontally by `max(0.18, |cos rot|)` (no rotation is applied; the spin only drives the
  squash, and keeps running under the magnet). A filled disc of radius `r` in the coin colour with a 2 px ink
  (`#2c1a10`) outline, and a highlight disc of radius `0.36r` at (−0.22r, −0.22r) in `#fff3bf`.

### `sparks(x, y, n = 10, color = '#ffe066')`

A radial pop. **Capped at 4** under reduced motion. Angle anywhere in the full circle, speed
[90, 340], gravity **260**, radius [2, 4.5], lifetime [0.4, 0.8] s. Drawn as a filled disc that
shrinks to 40% of its radius (`r·(1 − 0.6k)`). No outline, no spin.

### `stars(x, y, n = 6, color = '#fff3bf')`

A slower, floatier burst for anything rare. **Not capped under reduced motion.** Angle anywhere,
speed [50, 200] with an extra −60 px/s upward on `vy`, gravity **120**, radius [5, 11], lifetime
[0.6, 1.1] s, born at a random angle in [0, 2π) and spinning at [−6, 6] rad/s. Drawn as a filled
five-pointed star — outer radius `r·(1 − 0.35k)`, inner radius 0.45 of that, rotated by its angle
— with no outline.

### `confetti(x, y, n = 26)`

The celebration. **Capped at 8** under reduced motion. Launched upward in a cone — angle in
[−0.85π, −0.15π], i.e. within 63° either side of straight up — at speed [220, 560], gravity
**780**, and **drag 0.985 on both velocities every frame** (per frame again, not per second: at
60 fps that is about 40% of the speed left after a second). Pieces are [6, 12] × [8, 16] px, live
[1.1, 1.9] s, spin [−12, 12] rad/s, and take one of seven colours at random: `#ff6b6b`, `#ffd43b`,
`#69db7c`, `#4dabf7`, `#b197fc`, `#ff8fab`, `#ffffff`. Each is drawn as a filled rectangle rotated
by `rot` whose height is `h·|cos(1.7·rot)|` — the paper flips edge-on as it tumbles.

### `ring(x, y, color = '#ffffff', max = 0.5, size = 90)`

The accent under most events: one expanding circle outline. Radius `size·(1 − (1 − k)³)` — a
cubic ease-out, so it snaps out and settles — line width `5·(1 − k) + 1` px (6 → 1), and opacity
`1 − k` from the first frame. `max` is its lifetime in seconds. **Not capped** under reduced motion.

### `rainbowBurst(x, y)`

The Wonder's opening: `confetti(x, y, 40)`, `stars(x, y, 14, '#ffffff')` and
`ring(x, y, '#ffd6f5', 0.8, 220)` in one call.

### `float(x, y, text, kind = '', tint = '')` and `floatAt(el, text, kind = '')`

The floating number, and the one effect that is not on the canvas: it needs the game's font and
its outlined type. `float()` appends a plain-text element — never markup, so never an icon or a
pill — to a layer `FX.init()` creates itself (`div.float-layer`, absolute, inset 0, z-index 44,
no pointer events, overflow hidden) as a child of the game box, **outside the shaken world and
above everything in it**. It is centred on (x, y) by `translate(−50%, −50%)`, given a
sideways drift `--dx`, a random whole number of pixels in [−16, 16], and a colour `--float-tint`
when one is passed. It is **removed by a timer after 850 ms, or 1,100 ms for `big`** — whatever the
animation is doing. `floatAt()` floats over an element's box: its horizontal centre, 35% of the
way down, with no tint.

The motion is CSS (`.float`, keyframe `floatUp`, 850 ms `cubic-bezier(.2,.8,.3,1)`, fill forwards).
The vertical column is the `translateY` in the keyframe, as a share of the float's own box —
Baloo 2 at normal line height makes that box 30 px tall at 19 px (43 px at 27 px) — so **−50% is
centred on the point** and the float starts there:

| Stop | Time | Opacity | translateY (of its own height) | Drift | Scale |
| --- | --- | --- | --- | --- | --- |
| 0% | 0 ms | 0 | −50% (centred) | 0 | 0.6 |
| 22% | 187 ms | 1 | −115% (centre 19.5 px up) | `dx/3` | 1.14 |
| 100% | 850 ms | 0 | −260% (centre 63 px up) | `dx` | 0.95 |

Base type is 19 px, weight 800, white, with a 2 px ink outline made of eight text shadows at
(±2, 0), (0, ±2) and (±2, ±2). The
kinds change size, colour, or — for `crit` — the whole motion:

| Kind | Size | Colour | Motion |
| --- | --- | --- | --- |
| (none) | 19px | white | floatUp |
| `crit` | 27px | `#ffe066` | **floatCrit**: 0% centred (−50%), scale 0.4, −12°, invisible → 20% (170 ms) −120%, scale 1.5, +6°, opaque → 55% (468 ms) −165%, scale 1.15, −3° (no opacity stop) → 100% −300% with the full drift, scale 1, 0°, invisible |
| `big` | 24px | `#b2f2bb` | floatUp over 1.1 s |
| `legend` | 26px | `#ffd43b` | floatUp |
| `epic` | 19px | `#d0bfff` | floatUp |
| `rare` | 19px | `#a5d8ff` | floatUp |
| `gem` | 19px | `#8ce0ff` | floatUp |
| `ticket` | 19px | `#ffc9de` | floatUp |
| `water` | 19px | `#74c0fc` | floatUp |
| `bee` | 19px | `#ffc93c` | floatUp |
| `lucky` | 19px | `#fa5252` | floatUp |
| `mult` | 14px | the tint passed in, else `#ffd43b` | floatUp |
| `good` | 19px | white — no rule of its own | floatUp |

### `shake(power = 6, time = 0.28)`

Impact punctuation. **Off entirely** under reduced motion. A new shake never adds to a running
one: the amount and the time left each become the larger of the two. Every frame while time
remains, `f = timeLeft / 0.28` and `a = power·f`, and the world is offset by a fresh random `x` and
`y` in [−a, a] px and a random rotation in [−0.09a, 0.09a] degrees — **white-noise jitter, not a
wave**, decaying linearly to zero. It is written at the end of `step()`, after the particles, as one
inline transform on the world element (`translate3d(x, y, 0) rotate(r)`); on the frame the time
runs out the power resets and that inline value is **removed, not zeroed**, in the same frame, so
the stylesheet's resting transform takes the element back. Everything in the world shakes — the
scenery, the garden, the heads-up display, the canvas, and the scrim, sheet, menu, toasts and
banner too. Only the floating numbers and the What's New / moments dialog sit outside it.

**`power` is only the peak for the default 0.28 s.** The divisor is always 0.28, not the time
asked for, so a shorter shake opens weaker and a longer one harder. **Driven**, the largest offset
on the first frame at 60 fps over 400 tries each: the denial's `shake(3, 0.16)` peaks at **1.5 px**,
a crit's `shake(7)` at **6.6 px**, the level-up's `shake(9, 0.4)` at **12.3 px** and the Wonder's
`shake(10, 0.5)` at **17.3 px** — exactly `power × (time − one frame) / 0.28`.

### `haptic(pattern)`

`navigator.vibrate(pattern)` behind a guard: a number is milliseconds of vibration, an array
alternates vibrate and pause. It fails silently where the platform has none — iOS Safari among
them — and `fx.js` does not gate it on reduced motion (the weather's own haptics are gated in
`ui-weather.js`). Every pattern in use is in the ladder below.

### `weather(kind, opts)`, `weatherOff(seconds)` and `splashAt(x, y)`

The sky's particles are a **standing pool, not a spawner**: seeded once at the size asked for, with
every drop that leaves the bottom recycled at the top, so the cost is the count and never a
function of how long the sky has stood.

- `weather(kind, { count, speed, wind })` sets the sky. `'rain'` and `'storm'` draw as streaks;
  any other kind (`'gold'`, Wonderfall's) draws as falling coins. The pool is
  `round(count)` clamped to **96**, and **zero under reduced motion**. `speed` defaults to 900 px/s
  and `wind` to 0.12. A call ramps the share of the pool in play up to full over **1.6 s**.
- `weatherOff(seconds)` ramps that share back down over the seconds given (1.6 s by default): a drop
  that leaves the bottom is parked instead of recycled, so the shower thins out rather than
  stopping, and the layer clears itself at zero. `weather(null)` clears at once.
- **A drop**: horizontal position anywhere across the screen ±40 px, depth `z` in [0.5, 1]. A sky
  arriving from clear parks the whole pool and releases drops at the top as the share ramps up,
  so rain starts falling from the top; only a real window resize with a sky already standing
  re-seeds the drops down the whole height. Rain and storm fall at `speed·z` with a
  sideways drift of `wind·speed·z·0.55` plus a gentle sway, and draw as a round-capped streak
  from where the drop was 0.022–0.034 s ago to where it is, `0.9 + 1.5z` px wide, at opacity
  `skin·(0.34 + 0.66z)·(0.4 + 0.6·share)` — rain `#dfeeff` at 0.62, storm `#cfe4fb` at 0.74. Gold
  falls slower (210 px/s × [0.72, 1.3]) and sways wider, spins and squashes like a coin — radius
  [3.2, 6], `#ffc93c` with a 1.6 px ink outline and a `#fff3bf` highlight — and **has no wallet
  magnet on purpose**: it is light falling out of the sky, and gold that landed in the counter
  would promise a payout Wonderfall does not make.
- `splashAt(x, y)` is a drop landing on a plant: an ellipse ring (radius 26 px — 52 wide, 0.42
  as tall — cubic ease-out, 0.42 s, `#e8f5ff`) and three droplets thrown upward (speed [60, 150],
  gravity 620, 0.28–0.46 s). **Off** under reduced motion, and refused once more than 64 splash
  particles are alive.

### The ambient petals

Always there, behind everything else on the canvas: `round(min(18, width / 34))` petals — eleven
on a 390 px phone — and **none under reduced motion**. Each is an ellipse `r × 0.55r` with `r` in
[3.5, 7], pink `#ffc8dd` or cream `#fff0b8`, falling at [12, 30] px/s with a sideways sway of
`sin(t·s)·18` px/s, turning at up to 1.2 rad/s, drawn at 55% opacity, and wrapping at the edges. A
window resize only re-seeds them when the size really changed, because iOS fires `resize` when the
address bar collapses and every petal used to teleport.

### Caps and budgets

The particle pool has **no global cap** — every call adds to it — so the caps that exist are per
call and apply only under reduced motion: coins 3, sparks 4, confetti 8. **Stars and rings are
never capped**, and neither is the floating-text layer. The standing layers carry hard ceilings: 96
drops, 64 splash particles, 18 petals. The canvas's pixel ratio is capped at 2 and every step at
0.05 s.

## The feedback ladder

**The rule, from [06-audio-and-fx.md](06-audio-and-fx.md): rewards are stacked so their intensity is
legible without reading a number.** A Legendary must feel unmistakably bigger than a Rare, a sky
earns its layers by how rarely it comes, and a new event is placed on the ladder deliberately rather
than given maximum juice. Doc 06 owns the ladder as a design contract; this section carries it over
and extends it to every moment of feel the game has, for the port.

### The ladder as doc 06 writes it

Carried over verbatim. **The Shake column is the power passed to `shake()`**; the peak it produces
also depends on the time (see `shake()` above), so a Legendary's 9 opens at 12.3 px.

| Event | Coins | Extra particles | Shake | Sound | Toast | Speech |
| --- | --- | --- | --- | --- | --- | --- |
| Tap | 4 | — | — | `tap` | — | 6% |
| Crit tap | 16 | 10 stars + ring | 7 | `crit` | — | yes |
| Common harvest | 6 | — | — | `harvest` | — | 12% |
| Rare harvest | 9 | 9 stars + ring | 3 | `rare` | **no** | — |
| Epic harvest | 14 | 9 stars + ring | 5 | `legend` | yes | — |
| Legendary harvest | 22 | 16 stars + ring + confetti | 9 | `legend` | yes | forced |
| Plot unlock | — | 22 confetti + ring | — | `unlock` | yes | forced |
| Quest claim | 9 | 9 stars + ring | — | `quest` | — | — |
| First discover | — | float text | — | — | yes (common/rare only) | — |
| Almanac milestone | 9 | 9 stars + ring | — | `quest` | yes | — |
| Mastery tier | — | 9 stars + ring + 2 float texts | — | `quest` | first or gem tier only | — |
| Level-up | — | 34 confetti + ring | 9 | `levelup` | yes | — |
| Fall's bed arms | — | ring + 12 sparks | — | `crit` | — | attempted |
| Fall's Collect All | 20 | 22 confetti + ring | 7 | `levelup` | yes | — |
| Hurry with gems (garden or Fall) | — | 12 blue sparks + the price as a `rare` float | — (4 when refused) | `buy` (`deny` when refused) | — | Summer says `broke` when refused; Fall floats *Not enough gems* on the plot |
| Wonder Effect | — | rainbow burst + 5 confetti waves | 10 | `wonder` | banner | forced |
| Rain (3 channels) | — | 74 drops + splashes on plants | — | `rain` bed, rain dress, effects ducked | — | forecast line, then arrival |
| Thunderstorm (5) | — | 70 faster, wind-blown drops + the flash | — | `storm` bed and dress, a `crack` per flash, one `rumble` leaving | — | forecast line, then arrival |
| Aurora (6) | — | none — every channel is CSS | — | `aurora` bed and dress | — | forced |
| Wonderfall (all) | — | 26 gold coins, no magnet | — | `wonderfall` bed and dress, `sing` three times | banner | forced |
| Sunbreak | — | none — light wedges, never particles | — | sunbreak dress | — | yes |

And the Turn's celebration, also verbatim from doc 06:

| Beat | Sound | FX |
| --- | --- | --- |
| The Turn commits | `levelup` | — |
| Each Tally line lands | `coin` | `FX.haptic(8)` |
| The total | `legend` | `FX.confetti` + `FX.ring` (seed green) + `FX.shake(7)` + `FX.haptic([14,50,14])` |
| A petal bought | `buy` | `FX.floatAt(+1)`, `FX.haptic(10)` |
| A seed unlocked | `buy` | `FX.haptic([12,40,12])` and a toast |

### Where the code disagrees with it

Ten cells, found by reading every handler and **driven** unless marked. Doc 06's tables are the
design contract, so they are left as the owner wrote them; each disagreement is filed in
[11-known-issues.md](11-known-issues.md) for the owner to rule which side is right. Until then,
**the code column is what the web build does**, and what the port should match to look the same.

| Row | Doc 06 says | The code does |
| --- | --- | --- |
| Crit tap — Speech | yes | *attempted*: an unforced line, dropped by the 3.2 s cooldown or while a coach mark is painted (it was, on a fresh save) |
| Rare harvest — Speech | — | the same 12% unforced line every harvest ends with |
| Epic harvest — Speech | — | the same 12% line |
| First discover | float text; toast for common and rare | both are skipped when the same harvest also crosses an Almanac milestone — the milestone's toast speaks instead |
| Mastery tier | a live rung | **never plays**: the engine retired the mastery ladder (`recordHarvest()` returns `mastery: []`); the handler is still wired |
| Level-up — Extra particles | 34 confetti + ring | 34 confetti and **no ring**; and it raises a banner ("Level N!", 2 s) beside the toast, which the table has no column for |
| Fall's bed arms — Speech | attempted | **forced, and heard**: the one speech bubble now moves to whichever flower is on screen; refused only while a coach mark is painted |
| Hurry with gems — refusals | Summer says `broke`; Fall floats *Not enough gems* | a third, in the garden: a plant whose catch moment falls under a catch sky is refused with `deny`, shake 4, `vibrate(4)` and a float naming the sky ("Not in the rain — a catch is for waiting out.") |
| Aurora — Speech | forced | only the forecast line is forced; the arrival line is not |
| The Turn — a petal bought | `FX.floatAt(+1)` | `FX.float(x, y, '+1', 'good')` at the button's centre, measured **before** the purchase (see the corner trap below) |

### The ladder, extended

Every other moment of feel, from reading every `Game.on(` in the ui files and every `FX`, `Sound`,
toast, banner and speech call made directly by UI code — the seasons, the Turn's other steps,
creatures, the meadow and the dialogs fire theirs without the event bus. **Driven** in the running
build unless the row says **read**. Haptics are Android-only: iOS Safari has no vibration API.

| Moment | Coins | Particles and floats | Shake | Sound | Haptic | Toast · banner · speech |
| --- | --- | --- | --- | --- | --- | --- |
| **On the flower and the plots** | | | | | | |
| A gem on a tap (5%) | — | `+1 Gem` float (`gem`) on the payout's own point; the gem wallet pops | — | — | — | — |
| Rain Dance (a tap proc) | — | a cloud pops over a plot, 12 drops fall in it; at 560 ms: 6 sparks `#74c0fc`, the soil flashes, the plant perks, `N.Ns faster!` (`water`) | — | `rainDance` | — | — |
| Bee Swarm (a tap proc) | — | a bee flies in to the flower and out (950 ms); at 430 ms: 5 sparks `#ffc93c`, `+1 Honey` (`bee`) | — | `beeSwarm` | — | — |
| Ladybug (a tap proc) | — | the badge drops onto the plot (600 ms, then idles); 6 sparks `#fa5252`; `Lucky spot!` (`lucky`) | — | `ladybug` | — | — |
| A card pack drops on a plot | — | 14 sparks `#ffe066`; ring `#ffe066` 0.55 s, 80 px; the badge lands and bobs | — | `rare` | 10 | — |
| A card pack collected | — | 16 sparks `#ffe066`; ring white 0.5 s, 90 px; `Card pack!` (`epic`) | — | `quest` | 16 | toast *A pack of cards*; an unforced greeting |
| Planted by hand (the picker, a replant chip, a Plot Harvester) | — | 8 sparks `#c99a6b`, 8 px below the plot's centre | — | `plant` (then the picker's `close`) | 10 | — |
| Sown free (a Spreader's seed) | — | the same 8 sparks; the *Auto* tag shows 1.1 s | — | — | — | — |
| A verb flower planted | — | its neighbours get a dashed ring and the plot a solid one in the verb's tint, fading over 1.6 s | — | — | — | — |
| Hasten (a growing plant) | — | 4 sparks `#8ce99a`, 10 px below centre | — | — | 6 | — |
| A locked plot tapped | — | a float: *After your first Turn*, *After Turn N* or *Level N*; or *Need N* and the refusal row | — | — | — | — |
| A gem on a harvest | — | `+1 Gem` (`gem`) 26 px right, 20 up; the gem wallet pops | — | — | — | — |
| Reputation (every 10th harvest) · **read** | — | `+N Reputation` (`big`) 40 px up | — | — | — | — |
| Ladybug luck (a marked plot picked) | — | 8 sparks `#fa5252`; `Ladybug luck!` (`lucky`) 18 px below, or 36 under a multiplier | — | — | — | — |
| The multiplier (any harvest) | — | `×1.25`… (`mult`, 14 px) 14 px below the payout, in the Wonder's `#ff6bd6` or the power-up's tint | — | — | — | at Epic and Legendary the toast adds ` · ×M` |
| **Buying, and being refused** | | | | | | |
| A power-up switched on | — | 12 sparks `#ffe066`; ring white 0.45 s, 70 px, at the power button | — | `boost` | 14 | toast *Name active!*, 2.4 s |
| An upgrade or decoration bought | — | 12 sparks `#ffe066` and a white ring — **fired from the top-left corner** (below) | — | `buy` | 14 | — |
| A sky called with gems | — | the same sparks and ring, **from the corner** | — | the sky's own rows follow | — | — |
| A refusal from the engine (the bus's `deny`) | — | — | 3 over 0.16 s (**1.5 px**) | `deny` | 20 | an unforced `broke` line |
| A refusal the UI makes itself (a gem skip, a replant, a craft, a room's power-up) | — | sometimes a float saying why | 3–4 | `deny` | 4 or — | sometimes `broke` |
| **The seasons** | | | | | | |
| A Fall plot picked — windfall-marked / plain | 10 / 5 | `+N` (`crit` / plain) | — | `crit` / `coin` | `[10, 40, 10]` / — | — |
| A growing Fall crop tapped | — | *Gems finish it* (or *Growing all fortnight* for the Century Bloom) | — | — | 4 | — |
| A Fall crop or Winter bloom planted from the picker | — | — | — | `buy` then `close` | 8 | — |
| Holly's introduction (first Winter visit) | — | — | — | `open` on entering | — | four forced lines, 2.9 s apart, retried every 0.9 s while something covers her |
| **The tuck-in** | — | ring `#dbe8f2` 0.5 s, 130 px, at the bed; every growing plot shows its quilt at once, breathing; one set of Zs | — | `open` | 12 | Holly's forced `hollyTuck` line |
| The tuck-in refused | — | — | — (or 3) | `deny` | 4 | — |
| **The snowfall** — a kept bloom picked | 10 | `+N` (`crit`) | — | `crit` | `[10, 40, 10]` | on the first light of a morning, Holly's forced line at +900 ms |
| **The snowfall** — Winter's Collect All with blooms kept | 20 | ring `#eaf4fb` 0.6 s, 150 px; 22 confetti; `+N` (`crit`) | 7 | `levelup` | `[20, 40, 20, 40, 40]` | toast *The whole bed · +N* (snow icon) |
| Winter's Collect All, nothing kept | 20 | ring `#ffc93c`; 14 confetti; `+N` | 4 | `coin` | `[20, 40, 20, 40, 40]` | toast `+N` |
| A growing Winter bloom tapped | — | *Opens in* + the time left (*Opens in 10h 41m*) | — | — | 4 | — |
| **Catches** — a sky leaves a mark on a plant | | | | | | |
| Dewkissed (rain, rank 1) | — | 12 sparks `#8fd6ff`; ring `#cfeeff` 90 px; the name (`rare`) | — | `rare` | 8 | — |
| Gilded (storm, rank 2) | — | 18 sparks `#ffc93c`; ring `#ffe9a8` 120 px; the name (`epic`) | — | `rare` | 16 | — |
| Prismatic (aurora, rank 3) | — | 24 sparks `#c9b6ff`; ring `#e7dcff` 150 px; 26 confetti; the name (`legend`) | 6 | `legend` | 24 | banner *Prismatic / Your Tulip changed* |
| Wonderstruck (Wonderfall, rank 4) | — | 30 sparks `#ff8fd0`; ring `#ffd4ec` 180 px; 26 confetti; the name (`legend`) | 8 | `legend` | 32 | banner |
| **Creatures** | | | | | | |
| A creature moves in | — | 26 confetti and 10 stars in its glow, on whichever board is showing; it hops in (0.5 s, overshoot) | — | `quest` | `[14, 40, 18]` | banner *Name has moved in*; its own forced line at +900 ms |
| A creature grows a star | — | 6 + 2 × level stars; 30 confetti at the last star | — | `quest` | `[10, 26, 14]` | banner *Name grew to ★★★*; a line at +800 ms |
| A pair formed, the first time | — | 24 confetti; ring `#8ce99a` 0.5 s, 130 px | — | `quest` | `[12, 34, 16]` | banner (3 s) |
| Keepsakes collected (a creature tapped) | — | 14 sparks in its glow, 5 stars; `×N Keepsake` (`good`); the creature bops | — | `quest` | — | toast; its forced gift line |
| Petting (the creature panel) | — | 10 sparks in its glow; the reply bubble and the portrait pop | — | `tap` | 8 | the reply lands in the panel, not the bubble |
| Feeding | — | 12 sparks and 5 stars — **from the corner** | — | `buy`, then `quest` | 14, then 10 | toast *Name is well fed* |
| Sending one out or resting it (the Hollow) | — | out: 12 sparks in its glow and a ring `#8ce99a` 0.4 s, 60 px; rest: 6 sparks `#cbb69c` | — | `tap` | — | — |
| **The meadow** | | | | | | |
| Land cleared (`cellUnlock`) | — | 22 confetti; ring `#8ce99a` 0.6 s, 120 px, on the cell | — | `unlock` | `[15, 30, 15]` | toast *Land cleared!* |
| Honey jars collected (a hive tapped) | up to 12 | 12 sparks `#ffc94a` | — | **silent** — `collect` has no recipe (below) | 8 | — |
| Every hive collected (the meadow's dock) | 14 | 8 stars `#ffe066` | — | **silent** | 10 | — |
| **The Wonder, the skies** | | | | | | |
| The Wonder ends | — | the veil fades over 0.6 s; the bob, warp and halo stop dead | — | — | — | banner *Wonder over* (1.5 s) |
| A sky ends | — | the drops thin over 5 s | — | the bed stops; a storm leaves with `rumble` | — | — |
| **The Turn and the cards** | | | | | | |
| The blessing and the Turn's other steps | — | — | — | `open` / `tap` / `close` (turnDone plays `close` twice) | — | — |
| A card revealed from a pack, by stars | — | 6 + 5 × stars sparks in the set's tint; at 3★ a white ring; at 4–5★ 26 confetti | 4–5 at 4–5★ | `coin` / `rare` / `legend` | 6 × stars | banner *Set complete* for each set finished |
| **Reveals and dialogs** | | | | | | |
| A reveal — the ??? curtain lifts or an upgrade drips in | — | no motion on the row; the moments dialog rises (0.28 s, slight overshoot) | — | `open`; *Got it!* `buy` | — | the dialog *Seed revealed.* |
| What's New, the changelog | — | the same card rise | — | `open`; `buy` on dismiss | — | — |
| Rooms, sheets, the menu, a chip's tooltip | — | the sheet and drawer slide (see the sequences below) | — | `open` / `close` | — | — |
| Idle, and the boot greeting · **read** | — | — | — | — | — | an unforced line after 26 s untouched; a forced greeting at +700 ms |
| **Records** ([49-the-record-shelf.md](49-the-record-shelf.md)) | | | | | | |
| A record found, a song played, a charm worn | **not built** — no record code exists yet. A find is specified to ride the moments dialog above | | | | | |

**The corner trap, again.** The upgrade, decoration, sky, feed, craft, sell, deliver and drone
handlers in the sheet measure their button *after* the engine call — and that call's `panels`
event has already re-rendered the sheet and detached the button, so their sparks and ring fire
from (0, 0), the top-left corner of the screen. **Driven** for upgrade, decoration, sky and feed;
read for the rest. The petal handler measures first for exactly this reason. Filed in
[11-known-issues.md](11-known-issues.md).

**Silent where it should sound.** Collecting honey calls `Sound.play('collect')`, and `audio.js`
has no `collect` recipe, so both meadow collections are silent. Filed.

**Doubled cues.** Placing a hive or a tender plays `buy` twice (once from the bus, once from the
handler) with two haptics, feeding plays `buy` and `quest` together, and finishing the Turn plays
`close` twice.

**What the bus carries.** Twenty-four subscriptions: twenty-one in `ui-events.js`, one in
`ui-menu.js`, two in `ui-weather.js`. Five are plumbing, not feel — `currency`, `grid`, `turn`, and
`panels` in two files — and `mastery` is wired but never emitted. The engine also emits events nobody
subscribes to (`ready`, `fallHarvest`, `winterTuck`, `seedUnlock`, `petal` and more): the seasons,
the meadow and the sheet fire their feel directly from UI code instead.

## The sequences

Motion that is several beats long rather than one call. Times are from the start of the sequence;
every beat was **driven** unless the row says **read**.

| Sequence | The beats | Under reduced motion |
| --- | --- | --- |
| **The sheet** — opening, closing, dragging | Opens by sliding up from 102% of its own height over **340 ms** on `cubic-bezier(.22,1,.28,1)` — a hard ease-out that never overshoots — while the dimming scrim fades in over 300 ms from the next frame. Closes on the same curve; the scrim is hidden by a timer at +340 ms. Dragging the grip follows the finger 1:1 (down only, no rubber band, no fling); let go past 110 px and it closes, otherwise it springs back on the same 340 ms curve. Changing panel inside an open sheet is an instant re-render. | Every transition is 80 ms, but the scrim's 340 ms timer is not shortened, so an invisible scrim swallows taps for ~260 ms after a close (**read**) |
| **The menu drawer** | Slides in from the right, 340 ms, same curve; drag right past 90 px to close. A row tap closes the drawer and opens its panel, so the sheet rises as the drawer leaves. | Opens and closes instantly (`transition:none !important`), timer 0 |
| **Toasts** | Drop in over 400 ms on the house overshoot — from 24 px above at 0.8 scale, landing 2 px past rest at ~267 ms. Hold 3 s (a power-up's 2.4 s, boot notices 3.6 s), then leave over 300 ms to 14 px up at 0.94 and fade; removed at +320 ms. **At most two**: a third evicts the oldest instantly, with no exit. | There, then gone in 80 ms |
| **The banner** | Spins in over 550 ms — 0.3 scale and −14° to 1.12 and +3° at 60%, overshooting to 1.145 on the way — while a rainbow slides across it every 2.4 s. Holds 2.2 s by default (the Wonder 2.6 s, a level-up 2 s, a pair 3 s, *Wonder over* 1.5 s), then shrinks to 0.7 and fades over 400 ms. **A banner shown while another is up is cut short by the older one's timers** (driven: 1.6 s instead of 2.6 s) — filed. | Appears and vanishes; the rainbow holds still |
| **The speech bubble** | Springs up from 0.7 scale, 8 px low, over 280 ms (the loudest overshoot curve; opacity 220 ms), holds 2.4 s, then reverses on the same curve — so **the exit dips past its closed pose** (0.695 against 0.7), the one exit in the game that overshoots. Refused while a coach mark is up and, unless forced, within 3.2 s of the last line. One bubble, moved to whichever flower is on screen. | 80 ms each way |
| **Coach marks** | No entrance or exit: shown and hidden outright, placed by a tier that runs every 0.6 s, so a move jumps. The arrow bobs 6 px every 0.9 s; the swipe glyph drags 8 px every 1.5 s. | Still |
| **Changing season or room** | **There is no transition.** Summer, Fall, Winter, the Hollow, the meadow and a locked season's gate are all **one-frame cuts**: a class on the game and a layer shown or hidden, the new board measured on the next frame, the `open` sound. The swipe is judged on release — more than 70 px, more horizontal than vertical — and the world never follows the finger. Past the last season: `shake(3)`. | The same cut |
| **A plant growing** | Every frame the plant's progress picks a stage — sprout until 14%, stem until 45%, bud until 90%, then bloom — and each change is a transition on the plant's own parts: stem and leaves grow over 600 ms on a 5% overshoot, the seedling fades out over 450 ms, the bud fades in. **The bloom unfurls** — the head grows from the bud's 0.22 to 1 over 900 ms (2% overshoot) while petals, core and ring fade in over 500 ms from 120 ms — landing 10% of the grow before ripe (1.2 s on a Daisy). A new plant appears already at its stage. Ripe then starts four loops at once: the plot bounces 4 px every 1.05 s, the plant wiggles ±2.2° every 800 ms, the `!` pops every 900 ms and a light sweeps the soil every 1.9 s. | Each stage snaps in 80 ms; the ripe loops stop, the gold ring and the `!` stay |
| **The Wonder** | Starts: banner, `wonder` sound, `shake(10, 0.5)` (17 px), a rainbow burst at the flower and five waves of 20 confetti 220 ms apart across the screen at 35% height, the face says *wow*. For 20 s: a rainbow veil fades to 0.62 over 600 ms and slides (5 s loop), the scenery's colour warps (7 s), the garden bobs ±1.1° (1.6 s), a rainbow halo spins (3.6 s). Ends: the veil fades over 600 ms but **the bob, warp and halo stop dead**, snapping the board back from wherever it was. | The veil and halo hold still; one confetti wave of 8 each; no shake |
| **The Turn** | The dock button's water rises (600 ms per step) and, when ready, breathes a gold ring (1.4 s) under a glint that crosses in the last 1.08 s of every 9 s. The ceremony's sheet slides up; each step inside is an instant re-render. After the blessing, **the Tally**: the base counts up over 1.1 s (ease-out cubic, 40 ms steps), the first line lands 260 ms later and one more every 430 ms (each slides 26 px in over 300 ms with a `coin` and `vibrate(8)`), and 430 ms after the last, the total: `legend`, `[14, 50, 14]`, 26 confetti, a green ring, `shake(7)`. **The total lands at 1,100 + 260 + 430 × lines ms.** On a Turn that opens a season, the gate's hedges swing open once (900 ms). | Everything lands at once — and every line's sound and buzz stack within a few ms |
| **Reveals and dialogs** | The ??? curtain and the upgrade drip have **no motion by design**: a newly revealed row simply appears, wearing a static gold fill until its moment is shown. The moments dialog, What's New and the changelog share one card: the dim is on at once, and the card rises from 14 px low at 0.96 over 280 ms, overshooting 0.16%. *Got it!* closes it instantly; the next moment is tried 300 ms later, at most three a session, twenty seconds apart. | The card is in place from the first frame |
| **A rain or storm** | Five seconds of **front**: a band of clouds slides in from the left and fades up over the whole 5 s while a darkening wash half-commits. **Arrival**: the drops start (1.6 s ramp), the wash deepens (3.6 s), the ground darkens (3.2 s rain, 2.4 s storm), wet plants take a breathing rim, a storm leans the plants and crouches the creatures; a drop lands on a random plant 1.4 s in and every 2.2–5.6 s after (the plant squashes, 320 ms). **The storm's flash**: first at 900 ms, then every 3.4–7.4 s, never more than three in ten seconds — a 120 ms double flicker of white with a bolt. **End**: the drops thin over 5 s, the clouds part over 7 s, the ground dries over **30 s** — the wet trace outlives the sky. By day a sunbreak follows 5 s later. | No drops, no flashes of white (a 700 ms tint pulse instead, half as often), the front pinned in place; the ground still darkens over 1.2 s and dries over 30 s |
| **An aurora** | No front. The sky dims to 0.62 over 4 s and the stars rise; one ribbon fades in after 1.2 s, then all three drift, each on its own 17.5–28.75 s loop. Plants and the flower take a glow; creatures and the flower look up. Leaving, the ribbons slide off over 4 s. | One ribbon, still |
| **Wonderfall** | A bloom of light (1.15 s) and a buzz; at 2.2 s the gold starts falling (26 coins, no magnet) and the flower sings — again at 10.4 s and 16.2 s — while a rainbow veil slides, the scenery warps and every ripe plant bobs together. Leaving: the gold thins over 5 s, the veil lifts over 2 s, ripe plants settle over 900 ms. | The veil on one stripe, the warp held, the mouth held open; the song still plays |
| **The sunbreak** | Only by day, 5 s after a rain or storm ends into a clear hour: the layer rises to full by 4.2 s, holds, and falls to 0.06 by 30 s, while three soft shafts sweep across (a 90 s loop) and breathe (22 s) — starting mid-journey. Then a 2.8 s fade. | One faint shaft, still |
| **Day and night** | A 360 s cycle. Every 0.6 s the sky's colours are recomputed between seven keys and written; the sun or moon's position slides between writes over 1.6 s and the stars' opacity fades over 1.6 s. **The sky's gradient itself never transitions** — a gradient cannot interpolate — so it steps every 0.6 s by too little to see. | The same, with 80 ms transitions |
| **Creatures** | Arriving, a creature hops in over 500 ms on the house overshoot (0.6 → 1.027 → 1). Idle, it floats (3.6 s), tilts now and then (5.2 s), blinks (5.9 s), glows (2.8 s), sheds three motes (3.4 s), flaps and wags. Tapped, it hops and lands (`critter-bop`, 420 ms). Asleep: no tilt or blink, a slow breath (3.6 s) and three Zs rising 27 px (4.8 s, staggered). | Still; asleep reads by the shut eyes and three Zs held at 0.8 |
| **The Hollow and the meadow** | The Hollow's six wisps drift (7.5–11 s), its light shaft breathes (9 s), ten dust motes fall (11–20 s). The meadow's clouds cross (56–86 s), 89 grass blades, 9 wild flowers and 13 fronds sway on three periods (5.2 / 6.4 / 7.6 s), and bees loop behind the board. **The meadow's own talking flower sways as a whole too**, because it shares the wild flowers' class — driven, filed. | Still — and the Hollow's lights rest brighter than any moving frame (below) |
| **Fall's bed, Winter's bed** | Fall: when the bed is armed the board wears a gold ring, Collect All pulses and carries the Turn button's glint on the same 9 s clock. Winter: the tuck-in shows every quilt at once; kept blooms wear a frost rim and one glint crosses the whole bed every 3.4 s. | Halos still; the glints become a still gloss (Fall) or go (Winter) |

## Reduced motion

**The rule: a state must never depend on a keyframe having run.** Visibility belongs to the base
style — `display`, a class, the `hidden` attribute — and motion is the flourish on top. Where a
state is carried *by* motion, reduced motion needs a **static substitute**, not merely a shorter
duration. The check is not "does it calm down"; it is "does every state that animates still read
when it does not". This section is the one most likely to save the port a bug: every failure below
has already shipped once in the web build.

### How the web build does it

1. **One global clamp**, in `style.css`: every animation on every element and pseudo-element runs
   once for 0.001 ms and every transition takes 80 ms, all `!important`. So a looping animation
   snaps to the element's own style; a one-shot that **fills forwards holds its end frame** —
   invisible, if that frame is `opacity:0`; and a transition is a very fast fade, not a cut.
   **Delays are not clamped**, and neither is anything drawn by JavaScript.
2. **Named cancels and substitutes**, in nineteen reduced-motion blocks. Two rules bite here. A
   cancel must come **after** the rule it cancels and be **at least as specific**, because a media
   query adds no specificity. And a substitute whose substance is a duration must itself say
   `!important`, or the clamp flattens it too.
3. **Four JavaScript readers.** `fx.js` reads the preference **once, at boot** — a mid-session
   toggle changes the CSS but not the particles until a reload — while the weather, the Turn's
   Tally and the menu drawer read it live.
4. **The particle system** caps coins at 3, sparks at 4 and confetti at 8 per call, switches the
   shake, the petals, the weather drops and the splashes off, and leaves stars, rings and floats'
   timers alone. **Haptics are not gated**, except the weather's.
5. **Nothing waits for an animation to end.** No code listens for `animationend` or
   `transitionend`: every lifetime is a timer, so the clamp can change what is visible but never
   stall a sequence. Keep that in the port — an animation event must never be what ends a state.

### The static substitutes

| The state | Moving, it reads as | Still, it reads as |
| --- | --- | --- |
| **The Turn is ready** | a gold ring breathing on the dock button, and a glint every 9 s | a solid 5 px gold ring and a still gold wash; the attention dot stays hidden |
| **Every number the garden pays** | the float rises and fades | held still at full ink where it appeared, taken away by the same timer — `.float` **and `.float.crit` by name**, because a kind with its own keyframe outranks a bare `.float` (the kill-list) |
| **A creature is asleep** | three Zs drifting up, the body breathing | three Zs standing at 0.8 opacity, no breath, the eyes shut |
| **Winter's bed is tucked in** | quilts, a breathing plant, drifting Zs | the quilts, and the Zs at 0.8 |
| **A bloom was kept overnight** | the frost rim, and a glint across the bed | the frost rim — the glint is removed, not frozen |
| **Lightning** | a 120 ms double flicker of white and a bolt, up to three per 10 s | a 700 ms soft tint pulse (≤ 0.24 opacity), asked 2.2 times less often, no buzz; the crack still sounds |
| **It is raining** | 70–74 streaks, splashes on the plants | no particles — the ground darkens over 1.2 s and dries over 30 s, because the drying *is* the trace |
| **Wet plants, a storm's wind** | a breathing rim; plants swaying, creatures peeking | the rim, the lean and the crouch, held |
| **An aurora, the sunbreak, Wonderfall** | drifting ribbons, sweeping shafts, a sliding veil and a singing flower | one still ribbon; one faint still shaft; the veil on one stripe and the mouth held open |
| **The Tally** | a 1.1 s count, lines 430 ms apart | the final numbers at once |
| **A card pack, a ladybug, a keepsake, a new reveal** | dropping in, bobbing, idling | simply there — each is shown by `display` or a class, never by its keyframe |
| **A catch on a plot, the Wonder** | a pulsing wash; a sliding veil, a bobbing board, a spinning halo | the wash held at 0.3; the veil and the halo held still |
| **Something is affordable, something is unread** | a pulse; a popping dot | the colour alone; a solid dot |
| **Fall's Collect All** | pulsing halos and a travelling glint | still halos and a still gloss |

### Where the web build still falls short

**Driven** unless marked, and every one a shape the port should not copy. The defects among them
are filed in [11-known-issues.md](11-known-issues.md).

1. **The adjacency flash never shows.** Its substitute (`verbLinkCalm`) has no `!important`
   duration, so the clamp flattens it to 0.001 ms and it holds its last frame, `opacity:0` — the
   one ⚠ in Half 2. The Sky Pass's own quiet block warns about exactly this; this rule is older.
2. **A ripe plot wears a still white band over its right half.** The soil's light sweep is parked
   off the plot *only by its keyframe*; the clamp returns it to its base position, on the plot.
3. **The meadow's "a hive is affordable here" disappears** — the only difference from an ordinary
   empty cell was a pulse.
4. **The Year panel's ready ring has no substitute** (the dock button has one; the panel's words
   still say it).
5. **Four quiet fades are 80 ms steps**, because their durations lack `!important`: the aurora's
   exit, a front's arrival and parting, the sky's wash (a tint jump of up to 0.68 opacity), the
   sunbreak's ending.
6. **Cancels that lose on specificity**, which the clamp alone rescues: the wet glint and the storm
   lean on unripe plants, the float and the hop of a creature with a gift — and the Hollow's
   wings and tails, which have no cancel at all. Half 2 marks each *loses the cascade*. **A port
   without an identical clamp would animate all of them.**
7. **A cancel written above its rule**: the Hollow's loadout dim still fades, over 80 ms.
8. **A delay survives the clamp**: the aurora's first ribbon still waits 1.2 s.
9. **The procs vanish** — the Rain Dance cloud and drops, the bee, a creature's motes. Their float,
   sparks and sound still say what happened, so no state is lost.
10. **Some still poses are brighter than any moving frame**: the Hollow's dust, shaft and glow and
    the flower's glow rest at full opacity. A still pose should be chosen, not inherited.
11. **The reduced Tally stacks its sounds**: every line's `coin` and buzz within a few ms.
12. **The sheet's scrim lingers** 340 ms after an 80 ms close (**read**).

### Testing it

`node tools/probe.js media:reduce page:index.html …` — the preference must be on **before** the
page boots, because `fx.js` reads it once. Float every kind into the live layer in one `eval:` and
read each one's computed `opacity` and `animation-name` as a table, then the same with the
preference off, so a fix cannot quietly delete a real animation. Enumerate the stylesheet's rules
in the browser against the source to catch a rule the parser dropped — that is how the rain pose in
Half 2 was found — and A/B a screenshot with a suspect pseudo-element hidden to catch a still band.

## Where the code is

Every pointer is a function and a string to grep for, per the anchor standard; each was checked
against the source when this was written. The generated half has one for every call and rule.

| Section | File | Function | Grep |
| --- | --- | --- | --- |
| The four principles | `style.css` | the keyframes | `@keyframes headSquash` |
| The four principles | `style.css` | the wallet pop | `@keyframes walletPop` |
| The four principles | `style.css` | the ripe loops | `@keyframes plantWiggle` |
| The tap | `ui.js` | `wireFlower()` | `holdTimer = setInterval(() => Game.tapFlower(true)` |
| The tap | `ui.js` | `lookAt()` | `flowerBtn.style.setProperty('--px'` |
| The tap | `game.js` | `tapFlower()` | `state.tap.combo = Math.min(state.tap.comboMax, state.tap.combo + 1)` |
| The tap | `ui-events.js` | `Game.on('tap')` | `FX.coins(c.x, c.y, p.crit ? 16 : 4)` |
| The tap | `ui.js` | `faceReact()` | `face.classList.toggle('squint', mood === 'crit')` |
| The tap | `ui.js` | `popWallet()` | `c.wallet.classList.add('pop')` |
| The tap | `ui.js` | `hudTick()` | `Math.min(1, dt * 9)` |
| The tap | `ui.js` | `frame()` | `'--combo-op'` |
| The tap | `ui.js` | `frame()` | `comboAcc -= 1` |
| The tap | `audio.js` | `RECIPES.tap` | `dur: 0.11, gain: 0.22` |
| The tap | `ui.js` | `onPlotTap()` | `if (cell.ready) { Game.harvest(idx); return; }` |
| The tap | `ui.js` | `onPlotTap()` | `FX.sparks(c.x, c.y + 10, 4, '#8ce99a')` |
| The tap | `ui-events.js` | `Game.on('harvest')` | `rk === 'legend' ? 22 : rk === 'epic' ? 14` |
| The tap | `style.css` | `.flower-btn:active` | `.flower-btn:active{transform:scale(.9) translateY(3px)}` |
| The particle system | `fx.js` | `coins()` | `vy: rnd(-380, -180)` |
| The particle system | `fx.js` | `step()` | `p.magnet === 'coin' && coinTarget && k > 0.32` |
| The particle system | `fx.js` | `step()` | `dt = Math.min(dt, 0.05)` |
| The particle system | `fx.js` | `confetti()` | `drag: 0.985` |
| The particle system | `fx.js` | `shake()` | `const f = Math.max(0, shakeT / 0.28)` |
| The particle system | `fx.js` | `float()` | `kind === 'big' ? 1100 : 850` |
| The particle system | `fx.js` | `weather()` | `const WX_MAX = 96` |
| The particle system | `fx.js` | `seedAmbient()` | `Math.round(Math.min(18, W / 34))` |
| The particle system | `ui.js` | `boot()` | `FX.setMagnet('coin', el.walletCredits)` |
| The particle system | `style.css` | the float kinds | `@keyframes floatCrit` |
| The feedback ladder | `ui-events.js` | `Game.on('windfall')` | `UI.say('windfall', true)` |
| The feedback ladder | `ui-fall.js` | `collectAll()` | `FX.coins(c.x, c.y, 20)` |
| The feedback ladder | `ui-winter.js` | `onTuck()` | `FX.ring(c.x, c.y, '#dbe8f2', 0.5, 130)` |
| The feedback ladder | `ui-winter.js` | `collectAll()` | `res.kept ? '#eaf4fb' : '#ffc93c'` |
| The feedback ladder | `ui-events.js` | `Game.on('mutate')` | `FX.sparks(c.x, c.y, 6 + rank * 6, md.tint)` |
| The feedback ladder | `ui-sheet.js` | `celebrateTurn()` | `FX.ring(c.x, c.y, '#7bd88f', 0.5, 90)` |
| The feedback ladder | `ui-sheet.js` | `landLine()` | `turnAt(calm() ? 0 : TURN_LINE_MS, landLine)` |
| The feedback ladder | `ui-sheet.js` | `celebrateCard()` | `FX.sparks(c.x, c.y, 6 + r.stars * 5, item.set.tint)` |
| The feedback ladder | `ui-sheet.js` | the sheet's click handler | `const buy = e.target.closest('[data-buy]')` |
| The feedback ladder | `ui-meadow.js` | `tapCell()` | `FX.sparks(ctr.x, ctr.y, 12, '#ffc94a')` |
| The feedback ladder | `ui-weather.js` | `arriveRain()` | `count: num(K, 'drops', 74)` |
| The feedback ladder | `ui-weather.js` | `flash()` | `quiet() ? 720 : 120` |
| The feedback ladder | `ui-news.js` | `showMoment()` | `momentEntry = entry;` |
| Reduced motion | `style.css` | the global clamp | `*,*::before,*::after{animation-duration:.001ms !important` |
| Reduced motion | `style.css` | the float kill-list | `.float,.float.crit{animation-name:none;opacity:1}` |
| Reduced motion | `style.css` | the Turn button's substitute | `0 0 0 5px var(--coin)` |
| Reduced motion | `style.css` | the sleeping Zs | `.cr-z{animation:none;opacity:.8}` |
| Reduced motion | `style.css` | the storm's tint pulse | `animation:wxFlashPulse 700ms ease-out` |
| Reduced motion | `style.css` | `the adjacency flash (broken)` | `animation:verbLinkCalm 1.6s linear forwards` |
| Reduced motion | `fx.js` | `init()` | `reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches` |
| Reduced motion | `ui-weather.js` | `quiet()` | `const quietMq = window.matchMedia('(prefers-reduced-motion: reduce)')` |
| Reduced motion | `ui-sheet.js` | `calm()` | `const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches` |
| Reduced motion | `ui-menu.js` | `closeMenu()` | `}, calm() ? 0 : 340);` |
| The sequences | `ui-sheet.js` | `openSheet()` | `setPageFill('#ffeecd')` |
| The sequences | `ui-sheet.js` | the drag-to-dismiss | `if (dy > 110) closeSheet();` |
| The sequences | `ui.js` | `toast()` | `el.toasts.children.length > 2` |
| The sequences | `ui.js` | `showBanner()` | `el.banner.classList.remove('show', 'out')` |
| The sequences | `ui.js` | `sayText()` | `speechEl.classList.remove('show'), 2400` |
| The sequences | `ui.js` | `goSeason()` | `const SEASON_ROOMS = {` |
| The sequences | `ui.js` | `renderPlots()` | `v.root.dataset.stage = st` |
| The sequences | `ui-weather.js` | the sky's hold | `const HOLD = { rain: 8000` |
| The sequences | `ui-weather.js` | `sunbreak()` | `const FADE = 3000;` |
| The sequences | `ui-scenery.js` | `updateSky()` | `const SKY_KEYS = [` |
| The sequences | `ui-news.js` | `dismiss()` | `setTimeout(tryMoment, 300)` |
| The sequences | `ui.js` | `renderCritters()` | `requestAnimationFrame(() => node.classList.add('here'))` |
| Half 2 | `tools/export-motion.js` | `build()` | `KNOWN_DROPPED` |

---

# Half 2 — the inventory

Generated by `node tools/export-motion.js` from `style.css`, `fx.js` and every other script in the
repository root; each table says how its columns are worked out. **What it cannot hold:** timing
the JavaScript hard-codes against the stylesheet (the float's 850 ms removal against `floatUp`'s
0.85 s), two classes that sit on one element and fight over `animation` (in a storm, the plants'
lean replaces their wet glint — filed), and any browser other than the one its rules model.

<!-- BEGIN MOTION INVENTORY — generated by tools/export-motion.js, do not edit by hand -->

_Read out of `style.css` and the JavaScript on this run: **103 keyframes**, played by **120 uses in 115 rules**; **105 rules that set a transition** (119 transitions, plus longhand overrides); **203 calls into `FX`** across 8 files; and **32 pieces of JavaScript choreography**. Every keyframe is played by something and every rule plays a keyframe that exists — the run refuses to write this block otherwise, except for 2 rules the browser drops, known and filed, which leave 1 keyframe that never plays. **1 ⚠ mark** below is a reduced-motion answer that is wrong whatever the element._

### What the browser drops

Rules that are in `style.css` and not in the game: the browser reads past them without a word,
so nothing below lists them as playing. Each is filed in [11-known-issues.md](11-known-issues.md) — "The flower's rain pose never plays";
fixing one is a change to the game, and the run then asks for its entry to be removed.

| Rule | Why the browser drops it | What it would have done |
| --- | --- | --- |
| `50%` | `50%` is not a selector: a keyframe stop left behind when `@keyframes wxUmbrellaTilt` was deleted (commit 0215097, 2026-08-31) | `transform:translateY(-2px) rotate(-1deg) scale(1.02)` |
| `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .tf-leaf-r` | a stray `}` before it is folded into its selector: the `}` that closed the orphaned stop above, so the flower's rain pose goes with it | `animation:wxLeafHold 2.8s ease-in-out infinite`<br>`transform:translate(-17px,-80px) rotate(31deg) scale(1.35)`<br>`transition:transform .55s cubic-bezier(.34,1.56,.64,1)` |

### The keyframes, and every rule that plays one

One row per rule that plays a keyframe, keyframes in alphabetical order. **Animates** is every
property the keyframe touches and the stops it sets them at. **Runs** is the iteration count,
then direction, fill and delay when they are not the default. **Switched on by** is read off
the selector: the ancestor state or place the element has to be inside, and the classes or
attributes on the element itself — *always on* means no state is needed, ∞ marks the ones
that also never stop, and *stopped where* names a rule that switches the animation off (or
swaps it) in some state. `(from .x)` means a value this rule inherits from the rule it
extends, and `↳` lines are rules that adjust it with a longhand. **Reduced motion** is
worked out from the cascade, as a browser does: a reduced-motion rule that names the same
element answers it only if it wins — `!important` first, then specificity (the `a-b-c`
triples: ids, classes, elements), then source order. Where nothing answers, the global clamp
does: one run of 0.001 ms, then the element's own style, or its end frame if it fills forwards.

| Keyframe | Animates | Duration | Easing | Runs | Played by | Switched on by | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.quest-strip.ready` | self `.ready` | clamp: one .001ms run, then its own style |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.plot[data-afford="1"] .lock-cost` | ancestor `.plot[data-afford="1"]`<br>stopped where `.plot[data-gated="1"] .lock-cost` | clamp: one .001ms run, then its own style |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.seed-lock.ok` | self `.ok` | clamp: one .001ms run, then its own style |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.mw-cell.locked.can .mw-lock-cost` | ancestor `.mw-cell.locked.can`<br>stopped where `.mw-cell.locked.gated .mw-lock-cost` | cancelled by `.mw-cell.locked.can .mw-lock-cost` |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.fl-chip.armed::before` | self `.armed` | cancelled by `.fl-chip.armed::before` |
| `affordPulse` | `transform` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.fl-collect::before` | always on ∞ | cancelled by `.fl-collect::before` |
| `bannerIn` | `opacity` `transform` at 0 60 100% | `.55s` | `cubic-bezier(.34,1.7,.64,1)` | ×1 | `.banner .bg` | ancestor `.banner`<br>swapped for `bannerOut` where `.banner.out .bg` | clamp: one .001ms run, then its own style |
| `bannerOut` | `opacity` `transform` at 100% | `.4s` | `ease` | ×1 · fill forwards | `.banner.out .bg` | ancestor `.banner.out` | clamp: holds its end frame, which **hides it** (`opacity:0`) |
| `barFlash` | `box-shadow` at 0 35 100% | `.6s` | `ease-out` | ×1 | `.plot .bar i.flash` | ancestor `.plot .bar`, self `.flash` | clamp: one .001ms run, then its own style |
| `beeFlight` | `opacity` `transform` at 0 10 38 50 62 74 100% | `.95s` | `cubic-bezier(.45,0,.35,1)` | ×1 · fill both | `.bee-fly` | always on | clamp: holds its end frame, which **hides it** (`opacity:0`) |
| `blink` | `transform` at 0 92 95 97 100% | `5.4s` | `ease` | ∞ | `.tf-lid` | on by default<br>stopped where `.flower-btn.happy .tf-lid`<br>stopped where `.flower-btn.squint .tf-lid`<br>stopped where `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-lid, #game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-lid` | clamp: one .001ms run, then its own style |
| `cheekPulse` | `opacity` at 0 50 100% | `3s` | `ease-in-out` | ∞ | `.tf-cheek` | on by default<br>stopped where `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-cheek, #game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-cheek` | clamp: one .001ms run, then its own style |
| `cloudPop` | `opacity` `transform` at 0 32 74 100% | `.9s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 · fill forwards | `.rain-cloud` | always on | clamp: holds its end frame, which **hides it** (`opacity:0`) |
| `coachBob` | `transform` at 0 50 100% | `.9s` | `ease-in-out` | ∞ | `.coach .arrow` | ancestor `.coach`<br>swapped for `coachBobX` where `.coach.side-l .arrow, .coach.side-r .arrow`<br>stopped where `.weather-tip .arrow` | clamp: one .001ms run, then its own style |
| `coachBob` | `transform` at 0 50 100% | `.9s` | `ease-in-out` | ∞ | `.hollow-exit i` | ancestor `.hollow-exit`<br>swapped for `barFlash` where `.plot .bar i.flash`<br>swapped for `hl-nudge` where `.mw-exit i`<br>swapped for `wiSweep` where `.wi-glint i` | cancelled by `.hollow-exit i` |
| `coachBobX` | `transform` at 0 50 100% | `.9s` | `ease-in-out` | ∞ | `.coach.side-l .arrow`<br>`.coach.side-r .arrow` | ancestor `.coach.side-l`<br>ancestor `.coach.side-r` | clamp: one .001ms run, then its own style |
| `coachDrag` | `transform` at 0 70 100% | `1.5s` | `ease-in-out` | ∞ | `.c-swipe`<br>↳ `.c-swipe.right` sets `direction reverse` | always on ∞ | clamp: one .001ms run, then its own style |
| `cp-hover` | `transform` at 0 50 100% | `4.4s` | `ease-in-out` | ∞ | `.sheet-art svg` | ancestor `.sheet-art`<br>stopped where `.sheet-art.asleep svg`<br>stopped where `.sheet-art.guest svg`<br>swapped for `wiBreathe` where `.wi-plot.tucked .wi-slot svg` | cancelled by `.sheet-art svg` |
| `cpSaid` | `opacity` `transform` at 0 100% | `.38s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.cp-said.pop` | self `.pop` | cancelled by `.cp-said.pop` |
| `cr-breathe` | `transform` at 0 50 100% | `3.6s` | `ease-in-out` | ∞ | `.asleep .critter-svg` | ancestor `.asleep`<br>swapped for `critter-bop` where `.critter.bop .critter-svg`<br>swapped for `critter-float` where `.critter.has-gift .critter-svg`<br>swapped for `critter-bop` where `.cp-face.bop .critter-svg`<br>stopped where `.critter-face.asleep .critter-svg`<br>stopped where `.pair-row .critter-svg`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .critter-svg, #game[data-weather="aurora"][data-wx-phase="linger"] .critter-svg` | cancelled by `.asleep .critter-svg` |
| `cr-zfloat` | `opacity` `transform` at 0 14 32 56 80 100% | `4.8s` | `ease-in-out` | ∞ · delay `calc(var(--i) * -1.6s)` | `.cr-z` | on by default<br>stopped where `.cp-face .cr-z` | cancelled by `.cr-z`, which also declares `opacity:.8` |
| `critter-blink` | `transform` at 0 92 95 100% | `5.9s` | `ease` | ∞ | `.critter .cr-eye`<br>`.hollow-pet .cr-eye` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.critter-row .cr-eye`<br>stopped where `.asleep .cr-eye`<br>stopped where `.cp-face .cr-eye`<br>stopped where `.pair-row .cr-eye` | `.critter .cr-eye`: cancelled by `.critter .cr-eye`<br>`.hollow-pet .cr-eye`: cancelled by `.hollow-pet .cr-eye` |
| `critter-bop` | `transform` at 0 30 60 100% | `.42s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.critter.bop .critter-svg` | ancestor `.critter.bop`<br>swapped for `critter-float` where `.critter.has-gift .critter-svg`<br>stopped where `.critter-face.asleep .critter-svg`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .critter-svg, #game[data-weather="aurora"][data-wx-phase="linger"] .critter-svg` | `.critter-svg`'s cancel loses the cascade here (0-1-0 against 0-3-0)<br>clamp: one .001ms run, then its own style |
| `critter-bop` | `transform` at 0 30 60 100% | `.42s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.cp-face.bop .critter-svg` | ancestor `.cp-face.bop`<br>stopped where `.critter-face.asleep .critter-svg`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .critter-svg, #game[data-weather="aurora"][data-wx-phase="linger"] .critter-svg` | cancelled by `.cp-face.bop .critter-svg` |
| `critter-float` | `transform` at 0 50 100% | `3.6s` | `ease-in-out` | ∞ | `.critter-svg` | on by default<br>swapped for `critter-bop` where `.critter.bop .critter-svg`<br>stopped where `.critter-row .critter-svg`<br>swapped for `cr-breathe` where `.asleep .critter-svg`<br>swapped for `critter-bop` where `.cp-face.bop .critter-svg`<br>stopped where `.critter-face.asleep .critter-svg`<br>stopped where `.pair-row .critter-svg`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .critter-svg, #game[data-weather="aurora"][data-wx-phase="linger"] .critter-svg` | cancelled by `.critter-svg` |
| `critter-float` | `transform` at 0 50 100% | `1.9s` | `ease-in-out` | ∞ | `.critter.has-gift .critter-svg` | ancestor `.critter.has-gift`<br>swapped for `critter-bop` where `.cp-face.bop .critter-svg`<br>stopped where `.critter-face.asleep .critter-svg`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .critter-svg, #game[data-weather="aurora"][data-wx-phase="linger"] .critter-svg` | `.critter-svg`'s cancel loses the cascade here (0-1-0 against 0-3-0)<br>clamp: one .001ms run, then its own style |
| `critter-gift-bob` | `transform` at 0 50 100% | `1.5s` | `ease-in-out` | ∞ | `.critter-gift` | always on ∞ | cancelled by `.critter-gift` |
| `critter-glow` | `opacity` `transform` at 0 50 100% | `2.8s` | `ease-in-out` | ∞ | `.critter .cr-glow`<br>`.hollow-pet .cr-glow` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.critter-row .cr-glow`<br>stopped where `.asleep .cr-glow`<br>stopped where `.cp-face .cr-glow`<br>stopped where `.pair-row .cr-glow` | `.critter .cr-glow`: cancelled by `.critter .cr-glow`<br>`.hollow-pet .cr-glow`: cancelled by `.hollow-pet .cr-glow` |
| `critter-mote` | `opacity` `transform` at 0 25 100% | `3.4s` | `ease-out` | ∞ · delay `calc(var(--i) * 1.1s)` | `.cr-mote` | always on ∞ | cancelled by `.cr-mote` |
| `critter-tail` | `transform` at 0 50 100% | `3.1s` | `ease-in-out` | ∞ | `.critter .cr-tail`<br>`.hollow-pet .cr-tail` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.asleep .cr-tail`<br>stopped where `.pair-row .cr-tail` | `.critter .cr-tail`: cancelled by `.critter .cr-tail`<br>`.hollow-pet .cr-tail`: clamp: one .001ms run, then its own style |
| `critter-tilt` | `transform` at 0 44 52 60 68 76 100% | `5.2s` | `ease-in-out` | ∞ | `.critter .cr-body`<br>`.hollow-pet .cr-body` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.critter-row .cr-body`<br>stopped where `.asleep .cr-body`<br>stopped where `.cp-face .cr-body`<br>stopped where `.pair-row .cr-body`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-body, #game[data-weather="aurora"][data-wx-phase="linger"] .cr-body` | `.critter .cr-body`: cancelled by `.critter .cr-body`<br>`.hollow-pet .cr-body`: cancelled by `.hollow-pet .cr-body` |
| `critter-tilt` | `transform` at 0 44 52 60 68 76 100% | `5.2s` | `ease-in-out` | ∞ | `.critter .cr-sprout`<br>`.hollow-pet .cr-sprout` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.critter-row .cr-sprout`<br>stopped where `.asleep .cr-sprout`<br>stopped where `.cp-face .cr-sprout`<br>stopped where `.pair-row .cr-sprout`<br>stopped where `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-sprout, #game[data-weather="aurora"][data-wx-phase="linger"] .cr-sprout` | `.critter .cr-sprout`: cancelled by `.critter .cr-sprout`<br>`.hollow-pet .cr-sprout`: cancelled by `.hollow-pet .cr-sprout` |
| `critter-wing` | `transform` at 0 50 100% | `0.9s` | `ease-in-out` | ∞ | `.critter .cr-wings`<br>`.hollow-pet .cr-wings` | ancestor `.critter`<br>ancestor `.hollow-pet`<br>stopped where `.asleep .cr-wings`<br>stopped where `.pair-row .cr-wings` | `.critter .cr-wings`: cancelled by `.critter .cr-wings`<br>`.hollow-pet .cr-wings`: clamp: one .001ms run, then its own style |
| `drift` | `transform` at 0 100% | `var(--dur)` | `linear` | ∞ · delay `var(--delay)` | `.cloud` | always on ∞ | hidden — `.cloud` declares `display:none` |
| `emptyBob` | `transform` at 0 50 100% | `2.6s` | `ease-in-out` | ∞ | `#game.onboard .plot[data-state="empty"] .empty-mark` | ancestor `#game.onboard .plot[data-state="empty"]` | clamp: one .001ms run, then its own style |
| `floatCrit` | `opacity` `transform` at 0 20 55 100% | `.85s` (from `.float`) | `cubic-bezier(.2,.8,.3,1)` (from `.float`) | ×1 · fill forwards (from `.float`) | `.float.crit` | self `.crit` | cancelled by `.float.crit`, which also declares `opacity:1` |
| `floatUp` | `opacity` `transform` at 0 22 100% | `.85s` | `cubic-bezier(.2,.8,.3,1)` | ×1 · fill forwards | `.float`<br>↳ `.float.big` sets `duration 1.1s` | on by default<br>swapped for `floatCrit` where `.float.crit` | cancelled by `.float`, which also declares `opacity:1` |
| `gateDrift` | `transform` at 0 100% | `11s` | `linear` | ∞ | `.g-leaf` | always on ∞ | cancelled by `.g-leaf` |
| `gateL` | `transform` at 0 100% | `.9s` | `cubic-bezier(.22,1,.28,1)` | ×1 · fill both | `.gate-scene .hedge.l` | ancestor `.gate-scene`, self `.l`<br>swapped for `gateR` where `.gate-scene .hedge.r`<br>stopped where `.gate-scene.shut .hedge.l`<br>stopped where `.gate-scene.shut .hedge.r` | clamp: holds its end frame |
| `gateR` | `transform` at 0 100% | `.9s` | `cubic-bezier(.22,1,.28,1)` | ×1 · fill both | `.gate-scene .hedge.r` | ancestor `.gate-scene`, self `.r`<br>stopped where `.gate-scene.shut .hedge.l`<br>stopped where `.gate-scene.shut .hedge.r` | clamp: holds its end frame |
| `glowPulse` | `opacity` `transform` at 0 50 100% | `3.2s` | `ease-in-out` | ∞ | `.flower-glow` | always on ∞ | clamp: one .001ms run, then its own style |
| `haloSpin` | `transform` at 100% | `3.6s` | `linear` | ∞ | `.wonder .garden::after` | ancestor `.wonder` | clamp: one .001ms run, then its own style |
| `headSquash` | `transform` at 0 35 70 100% | `.32s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.flower-btn.bounce .tf-head` | ancestor `.flower-btn.bounce`<br>swapped for `wxHum` where `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-head, #game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-head` | clamp: one .001ms run, then its own style |
| `hl-breathe` | `opacity` at 0 50 100% | `9s` | `ease-in-out` | ∞ | `.hl-shaft` | always on ∞ | cancelled by `.hl-shaft` |
| `hl-drift` | `opacity` `transform` at 0 25 50 75 100% | `var(--dur,7s)` | `ease-in-out` | ∞ · delay `var(--delay,0s)` | `.hl-wisp` | always on ∞ | cancelled by `.hl-wisp` |
| `hl-fall` | `opacity` `transform` at 0 15 85 100% | `var(--dur,11s)` | `linear` | ∞ · delay `var(--delay,0s)` | `.hl-dust` | always on ∞ | cancelled by `.hl-dust` |
| `hl-nudge` | `transform` at 0 50 100% | `2.4s` | `ease-in-out` | ∞ | `.mw-exit i` | ancestor `.mw-exit`<br>swapped for `barFlash` where `.plot .bar i.flash`<br>swapped for `wiSweep` where `.wi-glint i` | cancelled by `.mw-exit i` |
| `hl-pulse` | `opacity` at 0 50 100% | `4.5s` | `ease-in-out` | ∞ | `.hl-glow` | always on ∞ | cancelled by `.hl-glow` |
| `jarPop` | `transform` at 0 100% | `.3s` | `ease-out` | ×1 | `.jar.on` | self `.on` | clamp: one .001ms run, then its own style |
| `leafWaveL` | `transform` at 0 50 100% | `2.6s` | `ease-in-out` | ∞ | `.tf-leaf-l` | always on ∞ | clamp: one .001ms run, then its own style |
| `leafWaveR` | `transform` at 0 50 100% | `2.9s` | `ease-in-out` | ∞ | `.tf-leaf-r` | always on ∞ | clamp: one .001ms run, then its own style |
| `luckyIdle` | `transform` at 0 50 100% | `2.4s` | `ease-in-out` | ∞ | `.plot .lucky-badge.show` | ancestor `.plot`, self `.show`<br>swapped for `luckyLand` where `.plot .lucky-badge.land` | clamp: one .001ms run, then its own style |
| `luckyLand` | `opacity` `transform` at 0 60 100% | `.6s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.plot .lucky-badge.land` | ancestor `.plot`, self `.land` | clamp: one .001ms run, then its own style |
| `mutPulse` | `opacity` at 0 50 100% | `2.6s` | `ease-in-out` | ∞ | `.plot[data-mutation]::before` | self `[data-mutation]` | cancelled by `.plot[data-mutation]::before`, which also declares `opacity:.3` |
| `mutShimmer` | `filter` at 0 50 100% | `2.2s` | `ease-in-out` | ∞ | `.plot[data-mutation="prismatic"] .plant`<br>`.plot[data-mutation="wonderstruck"] .plant` | ancestor `.plot[data-mutation="prismatic"]`<br>ancestor `.plot[data-mutation="wonderstruck"]`<br>swapped for `plantWiggle` where `.plot[data-state="ready"] .plant`<br>swapped for `wxRipeBob` where `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"] .plant, #game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"] .plant`<br>swapped for `wxRipeSettle` where `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"] .plant` | `.plot[data-mutation="prismatic"] .plant`: cancelled by `.plot[data-mutation="prismatic"] .plant`<br>`.plot[data-mutation="wonderstruck"] .plant`: cancelled by `.plot[data-mutation="wonderstruck"] .plant` |
| `mwBee` | `transform` at 0 20 42 60 80 100% | `var(--dur,9s)` | `linear` | ∞ · delay `calc(var(--i,0) * -1.7s)` | `.mw-bee` | always on ∞ | cancelled by `.mw-bee` |
| `mwDrift` | `transform` at 0 100% | `var(--dur,58s)` | `linear` | ∞ · delay `var(--delay,0s)` | `.mw-cloud` | always on ∞ | cancelled by `.mw-cloud` |
| `mwInvite` | `opacity` at 0 50 100% | `2.6s` | `ease-in-out` | ∞ | `.mw-cell.empty.can .mw-empty` | ancestor `.mw-cell.empty.can` | cancelled by `.mw-cell.empty.can .mw-empty` |
| `mwReady` | `transform` at 0 25 75 100% | `2.2s` | `ease-in-out` | ∞ | `.mw-cell.ready .mw-cell-obj` | ancestor `.mw-cell.ready` | cancelled by `.mw-cell.ready .mw-cell-obj` |
| `mwSway` | `transform` at 0 50 100% | `5.2s` | `ease-in-out` | ∞ · delay `calc(var(--i,0) * -.6s)` | `.mw-blade` | always on ∞ | cancelled by `.mw-blade` |
| `mwSway` | `transform` at 0 50 100% | `6.4s` | `ease-in-out` | ∞ · delay `calc(var(--i,0) * -.9s)` | `.mw-flower` | always on ∞ | cancelled by `.mw-flower` |
| `mwSway` | `transform` at 0 50 100% | `7.6s` | `ease-in-out` | ∞ · delay `calc(var(--i,0) * -.5s)` | `.mw-frond` | always on ∞ | cancelled by `.mw-frond` |
| `mythicPulse` | `filter` at 0 50 100% | `1.6s` | `ease-in-out` | ∞ | `.pack-reveal.is-new.r-mythic .pack-card` | ancestor `.pack-reveal.is-new.r-mythic` | cancelled by `.pack-reveal.is-new.r-mythic .pack-card` |
| `on-pop` | `transform` at 0 60 100% | `.3s` | `ease` | ×1 | `.on-said.pop` | self `.pop` | clamp: one .001ms run, then its own style |
| `packBob` | `transform` at 0 50 100% | `1.9s` | `ease-in-out` | ∞ · delay `.5s` | `.plot.has-pack .pack-drop` | ancestor `.plot.has-pack` | cancelled by `.plot.has-pack .pack-drop`, which also declares `transform:translateX(-50%) scale(1)` |
| `packIn` | `opacity` `transform` at 0 100% | `.42s` | `cubic-bezier(.2,1.5,.4,1)` | ×1 · fill both | `.pack-card` | on by default<br>swapped for `mythicPulse` where `.pack-reveal.is-new.r-mythic .pack-card` | cancelled by `.pack-card` |
| `packLand` | `opacity` `transform` at 0 100% | `.5s` | `cubic-bezier(.2,1.6,.4,1)` | ×1 · fill both | `.plot.has-pack .pack-drop` | ancestor `.plot.has-pack` | cancelled by `.plot.has-pack .pack-drop`, which also declares `transform:translateX(-50%) scale(1)` |
| `petalSpin` | `transform` at 0 100% | `26s` | `linear` | ∞ | `.tf-petals` | always on ∞ | clamp: one .001ms run, then its own style |
| `plantPerk` | `transform` at 0 45 100% | `.5s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.plot .plant-slot.perk` | ancestor `.plot`, self `.perk` | clamp: one .001ms run, then its own style |
| `plantWiggle` | `transform` at 0 50 100% | `.8s` | `ease-in-out` | ∞ | `.plot[data-state="ready"] .plant` | ancestor `.plot[data-state="ready"]`<br>swapped for `wxRipeBob` where `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"] .plant, #game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"] .plant`<br>swapped for `wxRipeSettle` where `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"] .plant` | clamp: one .001ms run, then its own style |
| `plantWiggle` | `transform` at 0 50 100% | `.8s` | `ease-in-out` | ∞ | `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-glint` | ancestor `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"])`<br>swapped for `wxGlint` where `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"]) .wx-glint` | cancelled by `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-glint` |
| `plantWiggle` | `transform` at 0 50 100% | `.8s` | `ease-in-out` | ∞ | `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-lean` | ancestor `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"])`<br>swapped for `wxLean` where `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"]) .wx-lean` | cancelled by `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-lean` |
| `rainbowSlide` | `background-position` at 0 100% | `2.4s` | `linear` | ∞ | `.banner .bg` | ancestor `.banner`<br>swapped for `bannerOut` where `.banner.out .bg` | clamp: one .001ms run, then its own style |
| `rainFall` | `opacity` `transform` at 0 14 80 100% | `var(--dur,.5s)` | `linear` | ×1 · fill both · delay `var(--delay,0s)` | `.rain-drop` | always on | clamp: holds its end frame, which **hides it** (`opacity:0`) |
| `readyBob` | `transform` at 0 50 100% | `1.5s` | `ease-in-out` | ∞ | `.fl-ready` | always on ∞ | cancelled by `.fl-ready` |
| `readyBob` | `transform` at 0 50 100% | `1.6s` | `ease-in-out` | ∞ | `.wi-ready` | always on ∞ | cancelled by `.wi-ready` |
| `readyBounce` | `transform` at 0 50 100% | `1.05s` | `ease-in-out` | ∞ | `.plot[data-state="ready"]` | self `[data-state="ready"]` | clamp: one .001ms run, then its own style |
| `stemSway` | `transform` at 0 50 100% | `3.4s` | `ease-in-out` | ∞ | `.tf-stemwrap` | always on ∞ | clamp: one .001ms run, then its own style |
| `sweep` | `transform` at 0 100% | `1.9s` | `linear` | ∞ | `.plot[data-state="ready"] .plot-inner::before` | ancestor `.plot[data-state="ready"]` | clamp: one .001ms run, then its own style |
| `tagPop` | `transform` at 0 50 100% | `.9s` | `cubic-bezier(.34,1.56,.64,1)` | ∞ | `.plot[data-state="ready"] .ready-pop` | ancestor `.plot[data-state="ready"]` | clamp: one .001ms run, then its own style |
| `tagPop` | `transform` at 0 50 100% | `1.1s` | `ease-in-out` | ∞ | `.dock-dot` | always on ∞ | clamp: one .001ms run, then its own style |
| `tlineIn` | `opacity` `transform` at 0 100% | `.3s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.tline.just` | self `.just` | clamp: one .001ms run, then its own style |
| `toastIn` | `opacity` `transform` at 0 100% | `.4s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.toast` | always on | clamp: one .001ms run, then its own style |
| `turnFull` | `box-shadow` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.dock-btn.turn.ready` | self `.turn.ready` | cancelled by `.dock-btn.turn.ready`, which also declares `box-shadow:0 5px 0 var(--ink-2), 0 9px 14px rgba(44,26,16,.22), 0 0 0 5px var(--coin)` |
| `turnShine` | `transform` at 0 88 100% | `var(--turn-shine,9s)` | `linear` | ∞ | `.dock-btn.turn.ready .turn-fill::after` | ancestor `.dock-btn.turn.ready` | cancelled by `.dock-btn.turn.ready .turn-fill::after`, which also declares `top:0` `bottom:0` `left:0` `width:auto` `right:0` `transform:none` `background:linear-gradient(180deg,rgba(255,201,60,.3),rgba(255,201,60,.14))` |
| `turnShine` | `transform` at 0 88 100% | `var(--turn-shine,9s)` | `linear` | ∞ | `.fl-collect .fc-shine::after` | ancestor `.fl-collect` | cancelled by `.fl-collect .fc-shine::after`, which also declares `top:0` `bottom:0` `left:0` `right:0` `width:auto` `transform:none` `background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,0) 62%)` |
| `twinkle` | `filter` at 0 100% | `4s` | `ease-in-out` | ∞ · alternate | `.stars` | on by default<br>stopped where `#game[data-weather="wonderfall"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .stars` | clamp: one .001ms run, then its own style |
| `verbLink` | `opacity` `transform` at 0 18 32 70 100% | `1.6s` | `ease-out` | ×1 · fill forwards | `.plot.verb-source::after`<br>`.plot.verb-linked::after` | self `.verb-source`<br>self `.verb-linked` | `.plot.verb-source::after`: replaced by `verbLinkCalm` under `.plot.verb-source::after`<br>`.plot.verb-linked::after`: replaced by `verbLinkCalm` under `.plot.verb-linked::after` |
| `verbLinkCalm` | `opacity` at 0 10 70 100% — declared inside `(prefers-reduced-motion:reduce)` | `1.6s` | `linear` | ×1 · fill forwards | `.plot.verb-source::after`<br>`.plot.verb-linked::after` | reduced motion — self `.verb-source`<br>reduced motion — self `.verb-linked` | ⚠ reduced-motion substitute, but **the clamp collapses it to .001ms** — it never visibly plays, and it then holds `opacity:0` |
| `walletPop` | `transform` at 0 40 100% | `.34s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.wallet.pop` | self `.pop` | clamp: one .001ms run, then its own style |
| `wetFlash` | `filter` at 0 30 100% | `.8s` | `ease-out` | ×1 | `.plot-inner.watered` | self `.watered` | clamp: one .001ms run, then its own style |
| `wiBreathe` | `transform` at 0 50 100% | `3.6s` | `ease-in-out` | ∞ | `.wi-plot.tucked .wi-slot svg` | ancestor `.wi-plot.tucked .wi-slot` | cancelled by `.wi-plot.tucked .wi-slot svg` |
| `wiSweep` | `transform` at 0 55 100% | `3.4s` | `ease-in-out` | ∞ | `.wi-glint i` | ancestor `.wi-glint`<br>swapped for `barFlash` where `.plot .bar i.flash` | clamp: one .001ms run, then its own style |
| `wiZfloat` | `opacity` `transform` at 0 14 32 56 80 100% | `4.8s` | `ease-in-out` | ∞ · delay `calc(var(--i) * -1.6s)` | `.wi-z` | always on ∞ | cancelled by `.wi-z`, which also declares `opacity:.8` |
| `wonderBob` | `transform` at 0 50 100% | `1.6s` | `ease-in-out` | ∞ | `.wonder .garden` | ancestor `.wonder` | clamp: one .001ms run, then its own style |
| `wonderShift` | `background-position` at 0 100% | `5s` | `linear` | ∞ | `.wonder .wonder-veil` | ancestor `.wonder` | clamp: one .001ms run, then its own style |
| `wonderWarp` | `filter` at 0 50 100% | `7s` | `ease-in-out` | ∞ | `.wonder .scenery` | ancestor `.wonder` | clamp: one .001ms run, then its own style |
| `wxBolt` | `opacity` at 0 12 40 56 100% | `120ms` | `linear` | ×1 | `#game[data-weather="storm"][data-wx-flash="1"] .wx-bolt` | ancestor `#game[data-weather="storm"][data-wx-flash="1"]` | cancelled by `#game[data-weather="storm"][data-wx-flash="1"] .wx-bolt`, which also declares `opacity:0` |
| `wxCloudDrift` | `transform` at 0 100% | `var(--dur,10s)` | `ease-in-out` | ∞ · alternate · delay `var(--delay,0s)` | `.wx-front-cloud` | on by default<br>stopped where `#game:not([data-weather="rain"]):not([data-weather="storm"]) .wx-front-cloud` | cancelled by `#game .wx-front-cloud` |
| `wxFlash` | `opacity` at 0 10 34 52 100% | `120ms` | `linear` | ×1 | `#game[data-wx-flash="1"] .wx-flash` | ancestor `#game[data-wx-flash="1"]` | replaced by `wxFlashPulse` under `#game[data-wx-flash="1"] .wx-flash` |
| `wxFlashPulse` | `opacity` at 0 22 100% — declared inside `(prefers-reduced-motion:reduce)` | `700ms` | `ease-out` | ×1 | `#game[data-wx-flash="1"] .wx-flash` | reduced motion — ancestor `#game[data-wx-flash="1"]` | reduced-motion substitute — its `700ms` is `!important` and outlives the clamp |
| `wxFlashUnder` | `opacity` at 0 10 34 52 100% | `120ms` | `linear` | ×1 | `#game[data-wx-flash="1"] .wx-flash-under` | ancestor `#game[data-wx-flash="1"]` | cancelled by `#game[data-wx-flash="1"] .wx-flash-under`, which also declares `opacity:0` |
| `wxGlint` | `filter` at 0 50 100% | `3.4s` | `ease-in-out` | ∞ | `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-glint` | ancestor `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"])` | cancelled by `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-glint` |
| `wxGlint` | `filter` at 0 50 100% | `3.4s` | `ease-in-out` | ∞ | `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"]) .wx-glint` | ancestor `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"])` | `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-glint`'s cancel loses the cascade here (1-3-0 against 1-5-0)<br>clamp: one .001ms run, then its own style |
| `wxHum` | `transform` at 0 50 100% | `var(--wx-wonderfall-bob-period,1.6s)` | `ease-in-out` | ∞ | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-head`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-head` | ancestor `#game[data-weather="wonderfall"][data-wx-phase="transform"]`<br>ancestor `#game[data-weather="wonderfall"][data-wx-phase="linger"]` | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-head`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-head`, which also declares `transform:translate(60px,54px)`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-head`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-head`, which also declares `transform:translate(60px,54px)` |
| `wxLeafHold` | `transform` at 0 50 100% | — | — | — | **never plays** — its only rule, `#game:is([data-weather="rain"],[data-weather="storm"]):is([data-wx-phase="transform"],[data-wx-phase="linger"]) .tf-leaf-r`, is dropped by the browser (see *What the browser drops*) | — | — |
| `wxLean` | `transform` at 0 50 100% | `2.2s` | `ease-in-out` | ∞ | `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-lean` | ancestor `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"])` | cancelled by `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-lean` |
| `wxLean` | `transform` at 0 50 100% | `2.2s` | `ease-in-out` | ∞ | `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"]) .wx-lean` | ancestor `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .plot:not([data-state="ready"])` | `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-lean`'s cancel loses the cascade here (1-3-0 against 1-5-0)<br>clamp: one .001ms run, then its own style |
| `wxPeek` | `transform` at 0 46 62 100% | `4.4s` | `ease-in-out` | ∞ | `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-shelter` | ancestor `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"])` | cancelled by `#game[data-weather="storm"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .wx-shelter` |
| `wxRayPhase` | `opacity` at 0 34 58 100% | `calc(11s / max(.05, var(--wx-sunbreak-drift-speed,.5)))` | `ease-in-out` | ∞ | `.wx-ray`<br>↳ `.wx-ray:nth-child(1)` sets `delay -26s,-1s`<br>↳ `.wx-ray:nth-child(2)` sets `delay -45s,-7s`<br>↳ `.wx-ray:nth-child(3)` sets `delay -64s,-13s`<br>↳ `.wx-ray:nth-child(4)` sets `delay -35s,-17s` | on by default<br>stopped where `#game:not([data-sunbreak="1"]):not([data-sunbreak="fade"]) .wx-ray` | cancelled by `#game .wx-ray`, which also declares `transform:rotate(var(--a,17deg)) translateX(calc(var(--vw,1vw) * 26))` |
| `wxRaySweep` | `transform` at 0 100% | `calc(45s / max(.05, var(--wx-sunbreak-drift-speed,.5)))` | `linear` | ∞ | `.wx-ray`<br>↳ `.wx-ray:nth-child(1)` sets `delay -26s,-1s`<br>↳ `.wx-ray:nth-child(2)` sets `delay -45s,-7s`<br>↳ `.wx-ray:nth-child(3)` sets `delay -64s,-13s`<br>↳ `.wx-ray:nth-child(4)` sets `delay -35s,-17s` | on by default<br>stopped where `#game:not([data-sunbreak="1"]):not([data-sunbreak="fade"]) .wx-ray` | cancelled by `#game .wx-ray`, which also declares `transform:rotate(var(--a,17deg)) translateX(calc(var(--vw,1vw) * 26))` |
| `wxRibbonDrift` | `transform` at 0 50 100% | `calc(2.8s / var(--wx-aurora-ribbon-speed,.16))` | `ease-in-out` | ∞ · alternate · delay `calc(var(--i) * -9s)` | `#game[data-weather="aurora"] .wx-ribbon`<br>↳ `#game[data-weather="aurora"] .wx-ribbon:nth-child(2)` sets `duration calc(3.7s / var(--wx-aurora-ribbon-speed,.16))`<br>↳ `#game[data-weather="aurora"] .wx-ribbon:nth-child(3)` sets `duration calc(4.6s / var(--wx-aurora-ribbon-speed,.16))` | ancestor `#game[data-weather="aurora"]` | cancelled by `#game[data-weather="aurora"] .wx-ribbon`, which also declares `transform:skewY(-2deg)` |
| `wxRipeBob` | `transform` at 0 50 100% | `var(--wx-wonderfall-bob-period,1.6s)` | `ease-in-out` | ∞ | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"] .plant`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"] .plant` | ancestor `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"]`<br>ancestor `#game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"]`<br>swapped for `wxRipeSettle` where `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"] .plant` | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"] .plant`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="transform"] .plot[data-state="ready"] .plant`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"] .plant`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="linger"] .plot[data-state="ready"] .plant` |
| `wxRipeSettle` | `transform` at 0 100% | `.9s` | `ease-out` | ×1 | `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"] .plant` | ancestor `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"]` | cancelled by `#game[data-weather="wonderfall"][data-wx-phase="end"] .plot[data-state="ready"] .plant` |
| `wxSing` | `transform` at 0 25 50 75 100% | `var(--wx-wonderfall-bob-period,1.6s)` | `ease-in-out` | ∞ | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-mouth`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-mouth` | ancestor `#game[data-weather="wonderfall"][data-wx-phase="transform"]`<br>ancestor `#game[data-weather="wonderfall"][data-wx-phase="linger"]` | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-mouth`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="transform"] .tf-mouth`, which also declares `transform:translate(0,1px) scale(1.1,1.4)`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-mouth`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="linger"] .tf-mouth`, which also declares `transform:translate(0,1px) scale(1.1,1.4)` |
| `wxSquash` | `transform` at 0 35 70 100% | `.32s` | `cubic-bezier(.34,1.56,.64,1)` | ×1 | `.wx-splashed` | always on | cancelled by `#game .wx-splashed` |
| `wxSunbreakLife` | `opacity` at 0 14 62 100% | `var(--wx-sunbreak-duration,30s)` | `ease-in-out` | ×1 · fill forwards | `#game[data-sunbreak="1"] .wx-sunbreak` | ancestor `#game[data-sunbreak="1"]`<br>stopped where `#game[data-wx-night="1"][data-sunbreak="1"] .wx-sunbreak` | cancelled by `#game[data-sunbreak="1"] .wx-sunbreak` |
| `wxTakeover` | `opacity` `transform` at 0 20 100% | `1.15s` | `cubic-bezier(.22,.9,.3,1)` | ×1 | `#game.wx-cue .wx-takeover` | ancestor `#game.wx-cue` | cancelled by `#game.wx-cue .wx-takeover`, which also declares `opacity:.3` |
| `wxVeilShift` | `transform` at 0 100% | `calc(5s / 3)` | `linear` | ∞ | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .wx-veil::before`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .wx-veil::before` | ancestor `#game[data-weather="wonderfall"][data-wx-phase="transform"]`<br>ancestor `#game[data-weather="wonderfall"][data-wx-phase="linger"]` | `#game[data-weather="wonderfall"][data-wx-phase="transform"] .wx-veil::before`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="transform"] .wx-veil::before`, which also declares `transform:translate3d(-11.2%,0,0)`<br>`#game[data-weather="wonderfall"][data-wx-phase="linger"] .wx-veil::before`: cancelled by `#game[data-weather="wonderfall"][data-wx-phase="linger"] .wx-veil::before`, which also declares `transform:translate3d(-11.2%,0,0)` |
| `wxWonderWarp` | `filter` at 0 50 100% | `7s` | `ease-in-out` | ∞ | `#game[data-weather="wonderfall"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .scenery-warp` | ancestor `#game[data-weather="wonderfall"]:is([data-wx-phase="transform"],[data-wx-phase="linger"])` | cancelled by `#game[data-weather="wonderfall"]:is([data-wx-phase="transform"],[data-wx-phase="linger"]) .scenery-warp`, which also declares `filter:saturate(calc(1 + var(--wx-warp) * .5))` |
| `yrFull` | `box-shadow` at 0 50 100% | `1.4s` | `ease-in-out` | ∞ | `.yr-meter.ready` | self `.ready` | clamp: one .001ms run, then its own style |

### Rules that adjust an animation without naming one

A longhand on its own changes whatever animation the element already has — a stagger, a
slower variant, a paused state. The keyframe table above lists each beside the rule it
extends when the two selectors line up.

| Rule | Sets | Switched on by |
| --- | --- | --- |
| `.float.big` | `animation-duration: 1.1s` | self `.big` |
| `.c-swipe.right` | `animation-direction: reverse` | self `.right` |
| `#game[data-weather="storm"] .wx-front-cloud` | `animation-duration: calc(var(--dur,10s) * max(.15, 1 - var(--wx-storm-wind,.42) * .9))` | ancestor `#game[data-weather="storm"]` |
| `.wx-ray:nth-child(1)` | `animation-delay: -26s,-1s` | self `:nth-child(1)` |
| `.wx-ray:nth-child(2)` | `animation-delay: -45s,-7s` | self `:nth-child(2)` |
| `.wx-ray:nth-child(3)` | `animation-delay: -64s,-13s` | self `:nth-child(3)` |
| `.wx-ray:nth-child(4)` | `animation-delay: -35s,-17s` | self `:nth-child(4)` |
| `#game[data-weather="aurora"] .wx-ribbon:nth-child(2)` | `animation-duration: calc(3.7s / var(--wx-aurora-ribbon-speed,.16))` | ancestor `#game[data-weather="aurora"]`, self `:nth-child(2)` |
| `#game[data-weather="aurora"] .wx-ribbon:nth-child(3)` | `animation-duration: calc(4.6s / var(--wx-aurora-ribbon-speed,.16))` | ancestor `#game[data-weather="aurora"]`, self `:nth-child(3)` |

### Transitions

Every rule that sets `transition` or one of its longhands, in stylesheet order. A row that
sets only a longhand (a duration, say) retimes whatever transition the element already has.

| Rule | Properties | Duration | Easing | Delay | Switched on by | Reduced motion |
| --- | --- | --- | --- | --- | --- | --- |
| `.sky` | `background` | `1.6s` | `linear` | — | always on | the same properties over .08s (the clamp) |
| `.celestial` | `left` `top` `background` | `1.6s` | `linear` | — | always on | the same properties over .08s (the clamp) |
| `.stars` | `opacity` | `1.6s` | `linear` | — | always on | the same properties over .08s (the clamp) |
| `.wonder-veil` | `opacity` | `.6s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wallet` | `transform` | `.12s` | `cubic-bezier(.34,1.56,.64,1)` | — | always on | the same properties over .08s (the clamp) |
| `.round-btn` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.plot` | `transform`<br>`box-shadow`<br>`filter` | `.1s`<br>`.1s`<br>`.25s` | `ease`<br>`ease`<br>`ease` | — | always on | the same properties over .08s (the clamp) |
| `.scenery::after` | `opacity` `background` | `var(--weather-fade)` | `ease` | — | always on | transitions off — `.scenery::after` |
| `.season-tint` | `opacity` | `1.4s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.scenery::after` | **none** — transitions off | — | — | — | reduced motion — always on | — |
| `.plot .f-stemwrap`<br>`.plot .f-head`<br>`.plot .f-leaves`<br>`.plot .f-petals` | `transform` | `.6s` | `cubic-bezier(.34,1.4,.64,1)` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.plot .f-sprout`<br>`.plot .f-bud` | `opacity` | `.45s` | `ease` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.plot .f-bud-body` | `transform` | `.6s` | `cubic-bezier(.34,1.4,.64,1)` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.plot .f-petals` | `transform`<br>`opacity` | `.6s`<br>`.5s` | `cubic-bezier(.34,1.4,.64,1)`<br>`ease` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.plot .f-core`<br>`.plot .f-ring` | `opacity` | `.5s` | `ease` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.plot[data-stage="bloom"] .f-head` | `transform` | `var(--unfurl,.9s)` | `cubic-bezier(.3,1.25,.5,1)` | — | ancestor `.plot[data-stage="bloom"]` | the same properties over .08s (the clamp) |
| `.plot[data-stage="bloom"] .f-petals`<br>`.plot[data-stage="bloom"] .f-core`<br>`.plot[data-stage="bloom"] .f-ring` | `transform`<br>`opacity` | `.6s`<br>`.5s` | `cubic-bezier(.34,1.4,.64,1)`<br>`ease` | `0s`<br>`.12s` | ancestor `.plot[data-stage="bloom"]` | the same properties over .08s (the clamp) |
| `.plot[data-stage="bloom"] .f-bud` | `opacity` | `.55s` | `ease` | `.1s` | ancestor `.plot[data-stage="bloom"]` | the same properties over .08s (the clamp) |
| `.plot .bar i` | `width` | `.18s` | `linear` | — | ancestor `.plot .bar` | the same properties over .08s (the clamp) |
| `.plot .auto-tag` | `opacity` `transform` | `.2s` | `ease` | — | ancestor `.plot` | the same properties over .08s (the clamp) |
| `.combo-ring` | `opacity` | `.3s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.flower-btn` | `transform` | `.09s` | `cubic-bezier(.34,1.7,.64,1)` | — | always on | the same properties over .08s (the clamp) |
| `.tf-pupil`<br>`.tf-shine` | `transform` | `.18s` | `ease-out` | — | always on | the same properties over .08s (the clamp) |
| `.speech` | `opacity`<br>`transform` | `.22s`<br>`.28s` | `ease`<br>`cubic-bezier(.34,1.7,.64,1)` | — | always on | the same properties over .08s (the clamp) |
| `.dock-btn` | `transform`<br>`box-shadow`<br>`background` | `.08s`<br>`.08s`<br>`.2s` | `ease`<br>`ease`<br>`ease` | — | always on | the same properties over .08s (the clamp) |
| `.turn-fill::before` | `height` | `.6s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.fpill`<br>`.fround` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.yr-meter > i` | `height` | `.6s` | `ease` | — | ancestor `.yr-meter` | the same properties over .08s (the clamp) |
| `.yr-gate .track i` | `width` | `.3s` | `ease` | — | ancestor `.yr-gate .track` | the same properties over .08s (the clamp) |
| `.scrim` | `opacity` | `.3s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.sheet` | `transform`<br>`box-shadow` | `.34s`<br>`.34s` | `cubic-bezier(.22,1,.28,1)`<br>`ease` | — | always on | the same properties over .08s (the clamp) |
| `.sheet.dragging` | **none** — transitions off | — | — | — | self `.dragging` | — |
| `.tab` | `transform`<br>`box-shadow`<br>`background` | `.08s`<br>`.08s`<br>`.18s` | `ease`<br>`ease`<br>`ease` | — | always on | the same properties over .08s (the clamp) |
| `.card` | `transform`<br>`box-shadow`<br>`filter` | `.09s`<br>`.09s`<br>`.2s` | `ease`<br>`ease`<br>`ease` | — | always on | the same properties over .08s (the clamp) |
| `.seed-row` | `transform` `box-shadow` | `.09s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.toggle` | `background` | `.2s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.toggle i` | `transform` | `.22s` | `cubic-bezier(.34,1.56,.64,1)` | — | ancestor `.toggle` | the same properties over .08s (the clamp) |
| `.big-btn` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.bless-tile` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.drawer` | `transform`<br>`box-shadow` | `.34s`<br>`.34s` | `cubic-bezier(.22,1,.28,1)`<br>`ease` | — | always on | transitions off — `.drawer` |
| `.drawer.dragging` | **none** — transitions off | — | — | — | self `.dragging` | — |
| `.avatar` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.pencil` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.save-btn` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.dr-row` | `transform` `box-shadow` | `.09s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.pick-cell` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.toast` | `opacity` `transform` | `.3s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wide-btn` | `transform` `box-shadow` | `.09s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.mini` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.critter` | `transform`<br>`opacity` | `.5s`<br>`.3s` | `cubic-bezier(.34,1.56,.64,1)`<br>`ease-out` | — | always on | the same properties over .08s (the clamp) |
| `.in-loadout .hollow-pet` | **none** — transitions off | — | — | — | reduced motion — ancestor `.in-loadout` | — |
| `.sheet-art` | `opacity` | `.16s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.sheet:not(.open) .sheet-art` | `opacity`<br>`visibility` | `.14s`<br>`0s` | `ease`<br>`ease` | `0s`<br>`.14s` | ancestor `.sheet:not(.open)` | the same properties over .08s (the clamp) |
| `.cp-bar i` | `width` | `.4s` | `cubic-bezier(.22,1,.28,1)` | — | ancestor `.cp-bar` | the same properties over .08s (the clamp) |
| `.cp-fuel-bar i` | `width` | `.4s` | `cubic-bezier(.22,1,.28,1)` | — | ancestor `.cp-fuel-bar` | the same properties over .08s (the clamp) |
| `.food-btn` | `transform` `box-shadow` | `.08s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.in-loadout .hollow-pet` | `opacity` `filter` | `.2s` | `ease` | — | ancestor `.in-loadout` | the same properties over .08s (the clamp)<br>`.in-loadout .hollow-pet`'s property loses the cascade here (0-2-0 against 0-2-0, and it comes first) |
| `.on-bar i` | `width` | `.25s` | `ease` | — | ancestor `.on-bar` | the same properties over .08s (the clamp) |
| `.mw-cell` | `transform` `box-shadow` | `.1s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.mw-keeper` | `transform` | `.12s` | `cubic-bezier(.34,1.56,.64,1)` | — | always on | the same properties over .08s (the clamp) |
| `.shelf-bar i` | `width` | `.3s` | `ease` | — | ancestor `.shelf-bar` | the same properties over .08s (the clamp) |
| `.fl-plot` | `transform` `box-shadow` | `.1s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wi-plot` | `transform` `box-shadow` | `.1s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.news-card` | `transform` | `.28s` | `cubic-bezier(.34,1.4,.64,1)` | — | always on | transitions off — `.news-card` |
| `.news-card` | **none** — transitions off | — | — | — | reduced motion — always on | — |
| `.wx-front` | `opacity`<br>`transform` | `2.4s`<br>`2.4s` | `linear`<br>`ease-out` | — | always on | `opacity` only (`#game .wx-front`) over .08s (the clamp) |
| `#game:is([data-weather="rain"],[data-weather="storm"]) .wx-front` | — | `var(--wx-front-dur, var(--wx-front-seconds, 30s)) (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])` | `opacity` only (`#game .wx-front`) over .08s (the clamp) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-front` | — | `7s (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"]` | `opacity` only (`#game .wx-front`) over .08s (the clamp) |
| `.wx-wash` | `opacity` | `3.6s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `#game[data-weather="rain"][data-wx-phase="front"] .wx-wash` | — | `var(--wx-front-dur, var(--wx-front-seconds, 30s)) (longhand)` | — | — | ancestor `#game[data-weather="rain"][data-wx-phase="front"]` | the same properties over .08s (the clamp) |
| `#game[data-weather="storm"][data-wx-phase="front"] .wx-wash` | — | `var(--wx-front-dur, var(--wx-front-seconds, 30s)) (longhand)` | — | — | ancestor `#game[data-weather="storm"][data-wx-phase="front"]` | the same properties over .08s (the clamp) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-wash` | — | `6.5s (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"]` | the same properties over .08s (the clamp) |
| `.wx-ground` | `opacity` | `var(--wx-rain-linger, 30s)` | `linear` | — | always on | the same properties over `1.2s` (`#game .wx-ground`, `!important`)<br>where `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-ground`: `var(--wx-rain-linger, 30s)` (`!important`) |
| `#game[data-weather="rain"] .wx-ground` | — | `3.2s (longhand)` | — | — | ancestor `#game[data-weather="rain"]` | the same properties over `1.2s` (`#game .wx-ground`, `!important`) |
| `#game[data-weather="storm"] .wx-ground` | — | `2.4s (longhand)` | — | — | ancestor `#game[data-weather="storm"]` | the same properties over `1.2s` (`#game .wx-ground`, `!important`) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="front"] .wx-ground` | — | `1.2s (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="front"]` | the same properties over `1.2s` (`#game .wx-ground`, `!important`) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-ground` | — | `var(--wx-rain-linger, 30s) (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"]` | the same properties over `var(--wx-rain-linger, 30s)` (`#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-ground`, `!important`) |
| `.wx-wet` | `filter` | `var(--wx-rain-linger, 30s)` | `linear` | — | always on | the same properties over `1.2s` (`#game .wx-wet`, `!important`)<br>where `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-wet`: `var(--wx-rain-linger, 30s)` (`!important`) |
| `#game[data-weather="rain"] .wx-wet` | — | `3.2s (longhand)` | — | — | ancestor `#game[data-weather="rain"]` | the same properties over `1.2s` (`#game .wx-wet`, `!important`) |
| `#game[data-weather="storm"] .wx-wet` | — | `2.4s (longhand)` | — | — | ancestor `#game[data-weather="storm"]` | the same properties over `1.2s` (`#game .wx-wet`, `!important`) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="front"] .wx-wet` | — | `1.2s (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="front"]` | the same properties over `1.2s` (`#game .wx-wet`, `!important`) |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-wet` | — | `var(--wx-rain-linger, 30s) (longhand)` | — | — | ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"]` | the same properties over `var(--wx-rain-linger, 30s)` (`#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-wet`, `!important`) |
| `.wx-glint` | `filter` | `2.4s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wx-lean` | `transform` | `1.6s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wx-shelter` | `transform` | `.55s` | `cubic-bezier(.34,1.56,.64,1)` | — | always on | the same properties over .08s (the clamp) |
| `.wx-sunbreak` | `opacity` | `2.8s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `.wx-dusk` | `opacity` | `var(--wx-aurora-dusk-seconds,4s)` | `ease` | — | always on | transitions off — `#game .wx-dusk` |
| `#game[data-weather="aurora"][data-wx-night="1"] .stars` | `opacity` | `var(--wx-aurora-dusk-seconds,4s)` | `linear` | — | ancestor `#game[data-weather="aurora"][data-wx-night="1"]` | transitions off — `#game[data-weather="aurora"][data-wx-night="1"] .stars` |
| `.wx-ribbon` | `opacity` | `1.6s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `#game[data-weather="aurora"][data-wx-phase="front"] .wx-ribbon` | `opacity` | `2.6s` | `ease` | `1.2s` | ancestor `#game[data-weather="aurora"][data-wx-phase="front"]` | the same properties over .08s (the clamp) |
| `#game[data-weather="aurora"][data-wx-phase="end"] .wx-ribbon` | `opacity`<br>`translate` | `3.2s`<br>`4s` | `ease`<br>`ease-in` | `.8s`<br>`0s` | ancestor `#game[data-weather="aurora"][data-wx-phase="end"]` | `opacity` only (`#game[data-weather="aurora"][data-wx-phase="end"] .wx-ribbon`) over .08s (the clamp)<br>`#game[data-weather="aurora"][data-wx-phase="end"] .wx-ribbon` asks for `1.2s`, but without `!important` the clamp still makes it .08s |
| `#game[data-weather="aurora"] .plant`<br>`#game[data-weather="aurora"] .talker`<br>`#game[data-weather="aurora"] .wx-lit` | `filter` | `1.4s` | `ease` | — | ancestor `#game[data-weather="aurora"]` | the same properties over .08s (the clamp) |
| `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-body`<br>`#game[data-weather="aurora"][data-wx-phase="transform"] .cr-sprout`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-body`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-sprout` | `transform` | `.7s` | `ease` | — | ancestor `#game[data-weather="aurora"][data-wx-phase="transform"]`<br>ancestor `#game[data-weather="aurora"][data-wx-phase="linger"]` | transitions off — `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-body` |
| `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-eyes`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-eyes` | `transform` | `.7s` | `ease` | — | ancestor `#game[data-weather="aurora"][data-wx-phase="transform"]`<br>ancestor `#game[data-weather="aurora"][data-wx-phase="linger"]` | transitions off — `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-eyes` |
| `#game[data-weather="aurora"] .tf-head` | `transform` | `.9s` | `ease` | — | ancestor `#game[data-weather="aurora"]` | transitions off — `#game[data-weather="aurora"] .tf-head` |
| `.wx-veil` | `opacity` | `2s` | `ease` | — | always on | the same properties over .08s (the clamp) |
| `#game .wx-front` | `opacity (longhand)` | — | — | — | reduced motion — ancestor `#game` | reduced-motion rule, but the clamp still makes it .08s |
| `#game .wx-ground`<br>`#game .wx-wet` | — | `1.2s !important (longhand)` | — | — | reduced motion — ancestor `#game` | reduced-motion rule — its duration is `!important` and outlives the clamp |
| `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-ground`<br>`#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"] .wx-wet` | — | `var(--wx-rain-linger, 30s) !important (longhand)` | — | — | reduced motion — ancestor `#game:is([data-weather="rain"],[data-weather="storm"])[data-wx-phase="end"]` | reduced-motion rule — its duration is `!important` and outlives the clamp |
| `#game .wx-dusk`<br>`#game[data-weather="aurora"][data-wx-night="1"] .stars` | **none** — transitions off | — | — | — | reduced motion — ancestor `#game`<br>reduced motion — ancestor `#game[data-weather="aurora"][data-wx-night="1"]` | — |
| `#game[data-weather="aurora"][data-wx-phase="end"] .wx-ribbon` | `opacity` | `1.2s` | `ease` | — | reduced motion — ancestor `#game[data-weather="aurora"][data-wx-phase="end"]` | reduced-motion rule, but the clamp still makes it .08s |
| `#game[data-weather="aurora"][data-wx-phase="transform"] .cr-body`<br>`#game[data-weather="aurora"][data-wx-phase="transform"] .cr-sprout`<br>`#game[data-weather="aurora"][data-wx-phase="transform"] .cr-eyes`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-body`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-sprout`<br>`#game[data-weather="aurora"][data-wx-phase="linger"] .cr-eyes`<br>`#game[data-weather="aurora"] .tf-head` | **none** — transitions off | — | — | — | reduced motion — ancestor `#game[data-weather="aurora"][data-wx-phase="transform"]`<br>reduced motion — ancestor `#game[data-weather="aurora"][data-wx-phase="linger"]`<br>reduced motion — ancestor `#game[data-weather="aurora"]` | — |
| `#game .wx-takeover` | `opacity` | `.5s`<br>`.5s !important (longhand)` | `ease` | — | reduced motion — ancestor `#game` | reduced-motion rule — its duration is `!important` and outlives the clamp |
| `.drawer` | **none** — transitions off | — | — | — | reduced motion — always on | — |
| `.drawer-scrim` | **none** — transitions off | — | — | — | reduced motion — always on | — |

### The easing vocabulary

Every timing function in the stylesheet and how often it is used — the house curves are the
ones at the top.

| Easing | Animations | Transitions |
| --- | --- | --- |
| `ease` | 4 | 88 |
| `ease-in-out` | 69 | 0 |
| `linear` | 19 | 10 |
| `cubic-bezier(.34,1.56,.64,1)` | 12 | 5 |
| `ease-out` | 7 | 3 |
| `cubic-bezier(.22,1,.28,1)` | 2 | 4 |
| `cubic-bezier(.34,1.4,.64,1)` | 0 | 5 |
| `cubic-bezier(.34,1.7,.64,1)` | 1 | 2 |
| `cubic-bezier(.2,.8,.3,1)` | 2 | 0 |
| `cubic-bezier(.2,1.5,.4,1)` | 1 | 0 |
| `cubic-bezier(.2,1.6,.4,1)` | 1 | 0 |
| `cubic-bezier(.22,.9,.3,1)` | 1 | 0 |
| `cubic-bezier(.3,1.25,.5,1)` | 0 | 1 |
| `cubic-bezier(.45,0,.35,1)` | 1 | 0 |
| `ease-in` | 0 | 1 |

### The `FX` calls, as `fx.js` exports them

The signature is copied out of `fx.js`, defaults and all. **Under reduced motion** is read
from the same function body — a cap on the count, an early return, or nothing.

| Call | Signature | Under reduced motion |
| --- | --- | --- |
| `init` | `init()` | reads the preference |
| `step` | `step(dt)` | no check in fx.js |
| `coins` | `coins(x, y, n = 8, opts = {})` | capped at 3 |
| `sparks` | `sparks(x, y, n = 10, color = '#ffe066')` | capped at 4 |
| `stars` | `stars(x, y, n = 6, color = '#fff3bf')` | no check in fx.js |
| `confetti` | `confetti(x, y, n = 26)` | capped at 8 |
| `ring` | `ring(x, y, color = '#ffffff', max = 0.5, size = 90)` | no check in fx.js |
| `rainbowBurst` | `rainbowBurst(x, y)` | its `confetti()` capped at 8 |
| `float` | `float(x, y, text, kind = '', tint = '')` | no check in fx.js |
| `floatAt` | `floatAt(el, text, kind = '')` | no check in fx.js |
| `shake` | `shake(power = 6, time = 0.28)` | off |
| `haptic` | `haptic(pattern)` | no check in fx.js |
| `setMagnet` | `setMagnet(name, el)` | no check in fx.js |
| `centerOf` | `centerOf(el)` | no check in fx.js |
| `weather` | `weather(kind, opts = {})` | zero through `wxWant()` |
| `weatherOff` | `weatherOff(seconds)` | no check in fx.js |
| `splashAt` | `splashAt(x, y)` | off |

### Every call into `FX`

Where each one is, as a function name and the call itself — both grep-able, per the anchor
standard. *in setTimeout* means the call is a delayed beat; *on 'x'* means it runs from an
event listener inside the named function.

| File | Where | Call |
| --- | --- | --- |
| `ui-events.js` | `Game.on('wonder')` | `FX.shake(10, 0.5)` |
| `ui-events.js` | `Game.on('wonder')` | `FX.haptic([30, 40, 30, 40, 60])` |
| `ui-events.js` | `Game.on('wonder')` | `FX.rainbowBurst(c.x, c.y)` |
| `ui-events.js` | `Game.on('wonder')` › `setTimeout` | `FX.confetti(Math.random() * window.innerWidth, window.innerHeight * 0.35, 20)` |
| `ui-events.js` | `triggerRainFX()` › `setTimeout` | `FX.sparks(pc.x, pc.y, 6, '#74c0fc')` |
| `ui-events.js` | `triggerRainFX()` › `setTimeout` | `` FX.floatAt(v.root, `${shaved.toFixed(1)}s faster!`, 'water') `` |
| `ui-events.js` | `triggerBeeFX()` › `setTimeout` | `FX.sparks(c.x, c.y - 6, 5, '#ffc93c')` |
| `ui-events.js` | `triggerBeeFX()` › `setTimeout` | `FX.floatAt(UI.flowerBtn(), '+1 Honey', 'bee')` |
| `ui-events.js` | `triggerLadybugFX()` | `FX.sparks(pc.x, pc.y - 6, 6, '#fa5252')` |
| `ui-events.js` | `triggerLadybugFX()` | `FX.floatAt(v.root, 'Lucky spot!', 'lucky')` |
| `ui-events.js` | `Game.on('quest')` | `FX.coins(c.x, c.y, 9)` |
| `ui-events.js` | `Game.on('quest')` | `FX.stars(c.x, c.y, 9, '#4dabf7')` |
| `ui-events.js` | `Game.on('quest')` | `FX.ring(c.x, c.y, '#4dabf7', 0.5, 120)` |
| `ui-events.js` | `Game.on('quest')` | `FX.haptic([12, 30, 22])` |
| `ui-events.js` | `Game.on('levelup')` | `FX.confetti(c.x, c.y, 34)` |
| `ui-events.js` | `Game.on('levelup')` | `FX.shake(9, 0.4)` |
| `ui-events.js` | `Game.on('levelup')` | `FX.haptic([20, 40, 20, 40, 40])` |
| `ui-events.js` | `Game.on('tap')` | `` FX.floatAt(UI.flowerBtn(), `+${fmt(p.gain)}`, p.crit ? 'crit' : '') `` |
| `ui-events.js` | `Game.on('tap')` | `FX.coins(c.x, c.y, p.crit ? 16 : 4)` |
| `ui-events.js` | `Game.on('tap')` | `FX.shake(7)` |
| `ui-events.js` | `Game.on('tap')` | `FX.stars(c.x, c.y, 10, '#ffe066')` |
| `ui-events.js` | `Game.on('tap')` | `FX.ring(c.x, c.y, '#ffe066', 0.5, 130)` |
| `ui-events.js` | `Game.on('tap')` | `FX.haptic([12, 30, 22])` |
| `ui-events.js` | `Game.on('tap')` | `FX.haptic(7)` |
| `ui-events.js` | `Game.on('tap')` | `FX.floatAt(UI.flowerBtn(), '+1 Gem', 'gem')` |
| `ui-events.js` | `Game.on('tap')` | `FX.sparks(c.x, c.y, 14, '#ffe066')` |
| `ui-events.js` | `Game.on('tap')` | `FX.ring(c.x, c.y, '#ffe066', 0.55, 80)` |
| `ui-events.js` | `Game.on('tap')` | `FX.haptic(10)` |
| `ui-events.js` | `Game.on('mutate')` | `FX.sparks(c.x, c.y, 6 + rank * 6, md.tint)` |
| `ui-events.js` | `Game.on('mutate')` | `FX.ring(c.x, c.y, md.glow, 0.5, 60 + rank * 30)` |
| `ui-events.js` | `Game.on('mutate')` | `FX.float(c.x, c.y - 10, md.name, rank >= 3 ? 'legend' : rank === 2 ? 'epic' : 'rare')` |
| `ui-events.js` | `Game.on('mutate')` | `FX.shake(rank * 2)` |
| `ui-events.js` | `Game.on('mutate')` | `FX.confetti(c.x, c.y)` |
| `ui-events.js` | `Game.on('mutate')` | `FX.haptic(rank * 8)` |
| `ui-events.js` | `Game.on('plant')` | `FX.sparks(c.x, c.y + 8, 8, '#c99a6b')` |
| `ui-events.js` | `Game.on('plant')` | `FX.haptic(10)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.coins(c.x, c.y, rk === 'legend' ? 22 : rk === 'epic' ? 14 : rk === 'rare' ? 9 : 6)` |
| `ui-events.js` | `Game.on('harvest')` | `` FX.float(c.x, c.y - 6, `+${fmt(p.payout)}`, rk === 'common' ? 'big' : rk) `` |
| `ui-events.js` | `Game.on('harvest')` | `FX.float(c.x, c.y + 14, multLine, 'mult', p.wonderMult > 1 ? WONDER.tint : boostTint)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.haptic(12)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.stars(c.x, c.y, rk === 'legend' ? 16 : 9, tint)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.ring(c.x, c.y, tint, 0.6, 150)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.confetti(c.x, c.y, 34)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.shake(9, 0.4)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.haptic([20, 40, 20, 40, 40])` |
| `ui-events.js` | `Game.on('harvest')` | `FX.shake(rk === 'epic' ? 5 : 3)` |
| `ui-events.js` | `Game.on('harvest')` | `FX.haptic([10, 20, 14])` |
| `ui-events.js` | `Game.on('harvest')` | `FX.float(c.x + 26, c.y - 20, '+1 Gem', 'gem')` |
| `ui-events.js` | `Game.on('harvest')` | `` FX.float(c.x, c.y - 40, `+${p.repBonus} Reputation`, 'big') `` |
| `ui-events.js` | `Game.on('harvest')` | `FX.sparks(c.x, c.y, 8, '#fa5252')` |
| `ui-events.js` | `Game.on('harvest')` | `FX.float(c.x, c.y + (multLine ? 36 : 18), 'Ladybug luck!', 'lucky')` |
| `ui-events.js` | `Game.on('harvest')` | `` FX.float(c.x - 20, c.y - 28, `${p.seed.name} discovered!`, 'big') `` |
| `ui-events.js` | `Game.on('critter')` | `FX.confetti(c.x, c.y, 26)` |
| `ui-events.js` | `Game.on('critter')` | `FX.stars(c.x, c.y, 10, def.art.glow)` |
| `ui-events.js` | `Game.on('critter')` | `FX.haptic([14, 40, 18])` |
| `ui-events.js` | `Game.on('critter')` | `FX.stars(c.x, c.y, 6 + level * 2, def.art.glow)` |
| `ui-events.js` | `Game.on('critter')` | `FX.confetti(c.x, c.y, 30)` |
| `ui-events.js` | `Game.on('critter')` | `FX.haptic([10, 26, 14])` |
| `ui-events.js` | `Game.on('pair')` | `FX.confetti(c.x, c.y, 24)` |
| `ui-events.js` | `Game.on('pair')` | `FX.ring(c.x, c.y, '#8ce99a', 0.5, 130)` |
| `ui-events.js` | `Game.on('pair')` | `FX.haptic([12, 34, 16])` |
| `ui-events.js` | `Game.on('almanac')` | `FX.coins(c.x, c.y, 9)` |
| `ui-events.js` | `Game.on('almanac')` | `FX.stars(c.x, c.y, 9, '#51cf66')` |
| `ui-events.js` | `Game.on('almanac')` | `FX.ring(c.x, c.y, '#51cf66', 0.5, 120)` |
| `ui-events.js` | `Game.on('almanac')` | `FX.haptic([12, 30, 22])` |
| `ui-events.js` | `Game.on('mastery')` | `FX.stars(c.x, c.y, 9, '#ffd43b')` |
| `ui-events.js` | `Game.on('mastery')` | `FX.ring(c.x, c.y, '#ffd43b', 0.5, 110)` |
| `ui-events.js` | `Game.on('mastery')` | `FX.haptic([12, 30, 22])` |
| `ui-events.js` | `Game.on('mastery')` | `` FX.float(c.x, c.y - 52, `${seed.name} Tier ${tier}`, 'big') `` |
| `ui-events.js` | `Game.on('mastery')` | `FX.float(c.x, c.y - 34, signed(mult - 1), 'gem')` |
| `ui-events.js` | `Game.on('unlock')` | `FX.confetti(c.x, c.y, 22)` |
| `ui-events.js` | `Game.on('unlock')` | `FX.ring(c.x, c.y, '#8ce99a', 0.6, 120)` |
| `ui-events.js` | `Game.on('unlock')` | `FX.haptic([15, 30, 15])` |
| `ui-events.js` | `Game.on('purchase')` | `FX.haptic(14)` |
| `ui-events.js` | `Game.on('cellUnlock')` | `FX.confetti(c.x, c.y, 22)` |
| `ui-events.js` | `Game.on('cellUnlock')` | `FX.ring(c.x, c.y, '#8ce99a', 0.6, 120)` |
| `ui-events.js` | `Game.on('cellUnlock')` | `FX.haptic([15, 30, 15])` |
| `ui-events.js` | `Game.on('deny')` | `FX.shake(3, 0.16)` |
| `ui-events.js` | `Game.on('deny')` | `FX.haptic(20)` |
| `ui-events.js` | `Game.on('windfall')` | `FX.ring(c.x, c.y, '#ffc93c', 0.55, 120)` |
| `ui-events.js` | `Game.on('windfall')` | `FX.sparks(c.x, c.y, 12, '#ffc93c')` |
| `ui-events.js` | `Game.on('windfall')` | `FX.haptic([10, 40, 10])` |
| `ui-fall.js` | `onCellTap()` | `FX.float(p.x, p.y, def.century ? 'Growing all fortnight' : 'Gems finish it', '')` |
| `ui-fall.js` | `onCellTap()` | `FX.haptic(4)` |
| `ui-fall.js` | `onCellTap()` | `FX.coins(p.x, p.y, res.windfall ? 10 : 5)` |
| `ui-fall.js` | `onCellTap()` | `` FX.float(p.x, p.y - 8, `+${fmt(res.payout)}`, res.windfall ? 'crit' : '') `` |
| `ui-fall.js` | `onCellTap()` | `FX.haptic([10, 40, 10])` |
| `ui-fall.js` | `onSkipTap()` | `FX.shake(4)` |
| `ui-fall.js` | `onSkipTap()` | `FX.float(p.x, p.y, 'Not enough gems', '')` |
| `ui-fall.js` | `onSkipTap()` | `FX.haptic(4)` |
| `ui-fall.js` | `onSkipTap()` | `FX.sparks(p.x, p.y, 12, '#8ce0ff')` |
| `ui-fall.js` | `onSkipTap()` | `` FX.float(p.x, p.y - 8, `-${fmt(r.cost)}`, 'rare') `` |
| `ui-fall.js` | `onSkipTap()` | `FX.haptic(12)` |
| `ui-fall.js` | `collectAll()` | `FX.shake(4)` |
| `ui-fall.js` | `collectAll()` | `FX.ring(c.x, c.y, '#ffc93c', 0.6, 150)` |
| `ui-fall.js` | `collectAll()` | `FX.confetti(c.x, c.y, 22)` |
| `ui-fall.js` | `collectAll()` | `FX.coins(c.x, c.y, 20)` |
| `ui-fall.js` | `collectAll()` | `` FX.float(c.x, c.y - 10, `+${fmt(res.payout)}`, 'crit') `` |
| `ui-fall.js` | `collectAll()` | `FX.shake(7)` |
| `ui-fall.js` | `collectAll()` | `FX.haptic([20, 40, 20, 40, 40])` |
| `ui-hollow.js` | `tendTap()` | `FX.sparks(c.x, c.y, 6, '#cbb69c')` |
| `ui-hollow.js` | `tendTap()` | `FX.sparks(c.x, c.y, 12, def.art.glow)` |
| `ui-hollow.js` | `tendTap()` | `FX.ring(c.x, c.y, '#8ce99a', 0.4, 60)` |
| `ui-meadow.js` | `tapCell()` | `` FX.float(p.x, p.y, `Level ${Game.cellUnlockLevel(i)}`, '') `` |
| `ui-meadow.js` | `tapCell()` | `` FX.float(p.x, p.y, `Need ${fmt(Game.cellUnlockCost(i))}`, '') `` |
| `ui-meadow.js` | `tapCell()` | `FX.haptic(8)` |
| `ui-meadow.js` | `tapCell()` | `FX.coins(ctr.x, ctr.y, Math.min(12, got.jars.length + 2))` |
| `ui-meadow.js` | `tapCell()` | `FX.sparks(ctr.x, ctr.y, 12, '#ffc94a')` |
| `ui-meadow.js` | `tapCell()` | `FX.haptic(8)` |
| `ui-meadow.js` | `dockTap()` | `FX.coins(ctr.x, ctr.y, 14)` |
| `ui-meadow.js` | `dockTap()` | `FX.stars(ctr.x, ctr.y, 8, '#ffe066')` |
| `ui-meadow.js` | `dockTap()` | `FX.haptic(10)` |
| `ui-sheet.js` | `landLine()` | `FX.haptic(8)` |
| `ui-sheet.js` | `celebrateTurn()` | `FX.haptic([14, 50, 14])` |
| `ui-sheet.js` | `celebrateTurn()` | `FX.confetti(c.x, c.y)` |
| `ui-sheet.js` | `celebrateTurn()` | `FX.ring(c.x, c.y, '#7bd88f', 0.5, 90)` |
| `ui-sheet.js` | `celebrateTurn()` | `FX.shake(7)` |
| `ui-sheet.js` | `celebrateCard()` | `FX.sparks(c.x, c.y, 6 + r.stars * 5, item.set.tint)` |
| `ui-sheet.js` | `celebrateCard()` | `FX.confetti(c.x, c.y)` |
| `ui-sheet.js` | `celebrateCard()` | `FX.shake(r.stars)` |
| `ui-sheet.js` | `celebrateCard()` | `FX.ring(c.x, c.y, '#ffffff', 0.5, 90)` |
| `ui-sheet.js` | `celebrateCard()` | `FX.haptic(r.stars * 6)` |
| `ui-sheet.js` | `handleDev()` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-pet]` | `FX.sparks(c.x, c.y, 10, def.art.glow)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-pet]` | `FX.haptic(8)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-feed]` | `FX.sparks(c.x, c.y, 12, got.def.art.glow)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-feed]` | `FX.stars(c.x, c.y, 5, '#ffe066')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-feed]` | `FX.haptic(10)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-deliver]` | `FX.stars(c.x, c.y, 8, '#ffe066')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-deliver]` | `FX.sparks(c.x, c.y, 16, who ? who.art.accent : '#ffd6e8')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-deliver]` | `FX.coins(c.x, c.y, 10)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-deliver]` | `FX.haptic(14)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-build]` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-build]` | `FX.haptic(12)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-craft]` | `FX.sparks(c.x, c.y, 10, '#8ce0ff')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-craft]` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-sell]` | `FX.coins(c.x, c.y, 8)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-sell]` | `` FX.float(c.x, c.y - 6, `+${fmt(total)}`, 'big') `` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-ad]` | `FX.sparks(c.x, c.y, 12, '#b197fc')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-ad]` | `FX.ring(c.x, c.y, '#ffffff', 0.45, 70)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-ad]` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-buy]` | `FX.sparks(c.x, c.y, 12, '#ffe066')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-buy]` | `FX.ring(c.x, c.y, '#ffffff', 0.45, 70)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-buy]` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-unlockgo]` | `FX.haptic([12, 40, 12])` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-crop]` | `FX.haptic(8)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-crop]` | `FX.shake(3)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-winter-plant]` | `FX.haptic(8)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-winter-plant]` | `FX.shake(3)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-plant]` | `FX.shake(4)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-petal]` | `FX.haptic(10)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-petal]` | `FX.float(at.x, at.y, '+1', 'good')` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-petal]` | `FX.shake(3)` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-act]` | `FX.shake(4)` |
| `ui-weather.js` | `buzz()` | `FX.haptic(pattern)` |
| `ui-weather.js` | `dropLands()` | `FX.splashAt(r.left + r.width / 2, r.top + r.height * 0.3)` |
| `ui-weather.js` | `arriveRain()` | `FX.weather(id, { count: num(K, 'drops', 74), speed: num(K, 'dropSpeed', 900), wind: num(K, 'wind', 0.12) })` |
| `ui-weather.js` | `arriveWonderfall()` | `FX.weather('gold', { count: num(WS().wonderfall, 'drizzle', 26) })` |
| `ui-weather.js` | `endSky()` | `FX.weather(null)` |
| `ui-weather.js` | `endSky()` | `FX.weatherOff(THIN)` |
| `ui-weather.js` | `resetSky()` | `FX.weather(null)` |
| `ui-winter.js` | `onCellTap()` | `` FX.float(p.x, p.y, `Opens in ${span(c.plantedAt + c.grow - now)}`, '') `` |
| `ui-winter.js` | `onCellTap()` | `FX.haptic(4)` |
| `ui-winter.js` | `onCellTap()` | `FX.coins(p.x, p.y, res.kept ? 10 : 5)` |
| `ui-winter.js` | `onCellTap()` | `` FX.float(p.x, p.y - 8, `+${fmt(res.payout)}`, res.kept ? 'crit' : '') `` |
| `ui-winter.js` | `onCellTap()` | `FX.haptic([10, 40, 10])` |
| `ui-winter.js` | `onTuck()` | `FX.haptic(4)` |
| `ui-winter.js` | `onTuck()` | `FX.shake(3)` |
| `ui-winter.js` | `onTuck()` | `FX.ring(c.x, c.y, '#dbe8f2', 0.5, 130)` |
| `ui-winter.js` | `onTuck()` | `FX.haptic(12)` |
| `ui-winter.js` | `collectAll()` | `FX.shake(4)` |
| `ui-winter.js` | `collectAll()` | `FX.ring(c.x, c.y, res.kept ? '#eaf4fb' : '#ffc93c', 0.6, 150)` |
| `ui-winter.js` | `collectAll()` | `FX.confetti(c.x, c.y, res.kept ? 22 : 14)` |
| `ui-winter.js` | `collectAll()` | `FX.coins(c.x, c.y, 20)` |
| `ui-winter.js` | `collectAll()` | `` FX.float(c.x, c.y - 10, `+${fmt(res.payout)}`, res.kept ? 'crit' : '') `` |
| `ui-winter.js` | `collectAll()` | `FX.shake(res.kept ? 7 : 4)` |
| `ui-winter.js` | `collectAll()` | `FX.haptic([20, 40, 20, 40, 40])` |
| `ui.js` | `onSkipTap()` | `FX.shake(4)` |
| `ui.js` | `onSkipTap()` | `FX.float(c.x, c.y - 8, skipHoldLine(st.sky), '')` |
| `ui.js` | `onSkipTap()` | `FX.haptic(4)` |
| `ui.js` | `onSkipTap()` | `FX.shake(4)` |
| `ui.js` | `onSkipTap()` | `FX.sparks(c.x, c.y, 12, '#8ce0ff')` |
| `ui.js` | `onSkipTap()` | `` FX.float(c.x, c.y - 8, `-${fmt(cost)}`, 'rare') `` |
| `ui.js` | `onSkipTap()` | `FX.haptic(12)` |
| `ui.js` | `onReplantTap()` | `FX.shake(4)` |
| `ui.js` | `onPackTap()` | `FX.sparks(c.x, c.y, 16, '#ffe066')` |
| `ui.js` | `onPackTap()` | `FX.ring(c.x, c.y, '#ffffff', 0.5, 90)` |
| `ui.js` | `onPackTap()` | `FX.float(c.x, c.y - 10, 'Card pack!', 'epic')` |
| `ui.js` | `onPackTap()` | `FX.haptic(16)` |
| `ui.js` | `(module level)` › `el.btnPower on 'click'` | `FX.shake(3)` |
| `ui.js` | `(module level)` › `el.btnPower on 'click'` | `FX.sparks(c.x, c.y, 12, '#ffe066')` |
| `ui.js` | `(module level)` › `el.btnPower on 'click'` | `FX.ring(c.x, c.y, '#ffffff', 0.45, 70)` |
| `ui.js` | `stepSeason()` | `FX.shake(3)` |
| `ui.js` | `onPlotTap()` | `` FX.float(c.x, c.y, gate === 'turn' ? (DATA.year.plotTurnGate === 1 ? 'After your first Turn' : `After Turn ${DATA.year.plotTurnGate}`) : `Level ${Game.plotUnlockLevel(idx)}`, '') `` |
| `ui.js` | `onPlotTap()` | `` FX.float(c.x, c.y, `Need ${fmt(Game.plotUnlockCost(idx))}`, '') `` |
| `ui.js` | `onPlotTap()` | `FX.sparks(c.x, c.y + 10, 4, '#8ce99a')` |
| `ui.js` | `onPlotTap()` | `FX.haptic(6)` |
| `ui.js` | `tapCritter()` | `FX.sparks(c.x, c.y, 14, def.art.glow)` |
| `ui.js` | `tapCritter()` | `FX.stars(c.x, c.y, 5, def.art.accent)` |
| `ui.js` | `tapCritter()` | `` FX.float(c.x, c.y - 18, `×${got.count} ${got.name}`, 'good') `` |
| `ui.js` | `frame()` | `FX.step(dt)` |
| `ui.js` | `boot()` | `FX.init()` |
| `ui.js` | `boot()` | `FX.setMagnet('coin', el.walletCredits)` |

### JavaScript choreography

Motion the stylesheet cannot start by itself: a class added on the next frame so a
transition has a start state, a class removed and re-added around a forced reflow so a
keyframe replays, a transform written straight from a finger, an inline animation style.
Some `requestAnimationFrame` rows only measure a room on the frame after it appears. For a
reflow restart the class is known and the element is not, so every rule that plays a keyframe
under that class is listed — the one that replays is whichever matches the element.

| File | Where | Mechanism | Statement |
| --- | --- | --- | --- |
| `fx.js` | `step()` | inline transform | `` worldEl.style.transform = `translate3d(${rnd(-a, a).toFixed(2)}px,${ `` |
| `ui-events.js` | `triggerRainFX()` › `setTimeout` | reflow restart | `v.inner.classList.remove('watered'); void v.inner.offsetWidth; v.inner.classList.add('watered');` → restarts `.watered` — `wetFlash` on `.plot-inner.watered` |
| `ui-events.js` | `triggerRainFX()` › `setTimeout` | reflow restart | `v.bar.classList.remove('flash'); void v.bar.offsetWidth; v.bar.classList.add('flash');` → restarts `.flash` — `barFlash` on `.plot .bar i.flash` |
| `ui-events.js` | `triggerRainFX()` › `setTimeout` | reflow restart | `v.slot.classList.remove('perk'); void v.slot.offsetWidth; v.slot.classList.add('perk');` → restarts `.perk` — `plantPerk` on `.plot .plant-slot.perk` |
| `ui-events.js` | `triggerLadybugFX()` | reflow restart | `v.lucky.classList.remove('land'); void v.lucky.offsetWidth; v.lucky.classList.add('land');` → restarts `.land` — `luckyLand` on `.plot .lucky-badge.land` |
| `ui-fall.js` | `enter()` | requestAnimationFrame | `requestAnimationFrame(sizeBoard);` |
| `ui-hollow.js` | `enter()` | requestAnimationFrame | `requestAnimationFrame(place);` |
| `ui-meadow.js` | `render()` | requestAnimationFrame | `requestAnimationFrame(sizeBoard);` |
| `ui-meadow.js` | `enter()` | requestAnimationFrame | `requestAnimationFrame(sizeBoard);` |
| `ui-menu.js` | `renderHead()` | requestAnimationFrame | `requestAnimationFrame(() => { field.focus(); field.select(); });` |
| `ui-menu.js` | `openMenu()` | requestAnimationFrame | `requestAnimationFrame(() => {` |
| `ui-menu.js` | `closeMenu()` | inline transform | `node.style.transform = '';` |
| `ui-menu.js` | `onMove()` | inline transform | `` node.style.transform = `translateX(${dx}px)`; `` |
| `ui-menu.js` | `onUp()` | inline transform | `node.style.transform = '';` |
| `ui-news.js` | `show()` | requestAnimationFrame | `requestAnimationFrame(() => node.classList.add('show'));` |
| `ui-news.js` | `showLog()` | requestAnimationFrame | `requestAnimationFrame(() => node.classList.add('show'));` |
| `ui-news.js` | `showMoment()` | requestAnimationFrame | `requestAnimationFrame(() => node.classList.add('show'));` |
| `ui-sheet.js` | `openSheet()` | requestAnimationFrame | `requestAnimationFrame(() => el.scrim.classList.add('show'));` |
| `ui-sheet.js` | `closeSheet()` | inline transform | `el.sheet.style.transform = '';` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-pet]` | reflow restart | `said.classList.remove('pop'); void said.offsetWidth; said.classList.add('pop');` → restarts `.pop` — `walletPop` on `.wallet.pop`, `cpSaid` on `.cp-said.pop`, `on-pop` on `.on-said.pop` |
| `ui-sheet.js` | `(module level)` › `el.sheetBody on 'click'` › `[data-pet]` | reflow restart | `if (face) { face.classList.remove('bop'); void face.offsetWidth; face.classList.add('bop'); }` → restarts `.bop` — `critter-bop` on `.critter.bop .critter-svg`, `critter-bop` on `.cp-face.bop .critter-svg` |
| `ui-sheet.js` | `onMove()` | inline transform | `` el.sheet.style.transform = `translateY(${dy}px)`; `` |
| `ui-sheet.js` | `onUp()` | inline transform | `el.sheet.style.transform = '';` |
| `ui-winter.js` | `enter()` | requestAnimationFrame | `requestAnimationFrame(sizeBoard);` |
| `ui.js` | `faceReact()` | reflow restart | `void face.offsetWidth;` → restarts `.bounce` — `headSquash` on `.flower-btn.bounce .tf-head` |
| `ui.js` | `popWallet()` | reflow restart | `void c.wallet.offsetWidth;` → restarts `.pop` — `walletPop` on `.wallet.pop`, `cpSaid` on `.cp-said.pop`, `on-pop` on `.on-said.pop` |
| `ui.js` | `showGate()` | inline animation style | `<div class="g-leaf" style="left:22%;animation-delay:-3s">${Icons.get('leaf')}</div>` |
| `ui.js` | `showGate()` | inline animation style | `<div class="g-leaf" style="left:68%;animation-delay:-8s">${Icons.get('leaf')}</div>` |
| `ui.js` | `renderCritters()` | requestAnimationFrame | `requestAnimationFrame(() => node.classList.add('here'));` |
| `ui.js` | `tapCritter()` | reflow restart | `if (node) { node.classList.remove('bop'); void node.offsetWidth; node.classList.add('bop'); }` → restarts `.bop` — `critter-bop` on `.critter.bop .critter-svg`, `critter-bop` on `.cp-face.bop .critter-svg` |
| `ui.js` | `frame()` | requestAnimationFrame | `requestAnimationFrame(frame);` |
| `ui.js` | `boot()` | requestAnimationFrame | `requestAnimationFrame((t) => { last = t; frame(t); });` |

### Motion variables the JavaScript writes

Custom properties that a keyframe, an animation or a transition reads and that the
JavaScript sets per element — a randomised flight path, a per-drop delay, a live duration —
through `setProperty()` or an inline `style="…"`. A name is shared across unrelated elements
(`--dur` is several different clocks), so a writer listed here writes the name for *some* of
its readers, not necessarily all; the stylesheet also sets many of these per element.

| Variable | Read by | Written by |
| --- | --- | --- |
| `--delay` | `.cloud`<br>`.hl-dust`<br>`.hl-wisp`<br>`.mw-cloud`<br>`.rain-drop`<br>`.wx-front-cloud` | `hollow.js` `wisp()`<br>`hollow.js` `scene()`<br>`meadow.js` `clouds()`<br>`ui-events.js` `triggerRainFX()`<br>`ui-scenery.js` `make()` |
| `--dur` | `#game[data-weather="storm"] .wx-front-cloud`<br>`.cloud`<br>`.hl-dust`<br>`.hl-wisp`<br>`.mw-bee`<br>`.mw-cloud`<br>`.rain-drop`<br>`.wx-front-cloud` | `hollow.js` `wisp()`<br>`hollow.js` `scene()`<br>`meadow.js` `clouds()`<br>`ui-events.js` `triggerRainFX()`<br>`ui-meadow.js` `render()`<br>`ui-scenery.js` `make()` |
| `--dx` | `@keyframes floatCrit`<br>`@keyframes floatUp`<br>`@keyframes hl-drift`<br>`@keyframes hl-fall` | `fx.js` `float()`<br>`hollow.js` `wisp()`<br>`hollow.js` `scene()` |
| `--dy` | `@keyframes hl-drift` | `hollow.js` `wisp()` |
| `--ex` | `@keyframes beeFlight` | `ui-events.js` `triggerBeeFX()` |
| `--ey` | `@keyframes beeFlight` | `ui-events.js` `triggerBeeFX()` |
| `--fall` | `@keyframes rainFall` | `ui-events.js` `triggerRainFX()` |
| `--i` | `#game[data-weather="aurora"] .wx-ribbon`<br>`.cr-mote`<br>`.cr-z`<br>`.mw-bee`<br>`.mw-blade`<br>`.mw-flower`<br>`.mw-frond`<br>`.wi-z`<br>`@keyframes critter-mote` | `critters.js` `zGlyph()`<br>`critters.js` `motes()`<br>`customers.js` `hearts()`<br>`flora.js` `radialPetals()`<br>`flora.js` `customHead()`<br>`flora.js` `talkingFlower()`<br>`meadow.js` `grassBand()`<br>`meadow.js` `wildflowers()`<br>`meadow.js` `willow()`<br>`ui-meadow.js` `render()`<br>`winter.js` `zGlyph()` |
| `--mut-glow` | `@keyframes mutShimmer` | `ui.js` `renderPlots()` |
| `--turn-shine` | `.dock-btn.turn.ready .turn-fill::after`<br>`.fl-collect .fc-shine::after` | `ui-fall.js` `init()`<br>`ui.js` `boot()` |
| `--wx-front-dur` | `#game:is([data-weather="rain"],[data-weather="storm"]) .wx-front`<br>`#game[data-weather="rain"][data-wx-phase="front"] .wx-wash`<br>`#game[data-weather="storm"][data-wx-phase="front"] .wx-wash` | `ui-weather.js` `openFront()` |
| `--xx` | `@keyframes beeFlight` | `ui-events.js` `triggerBeeFX()` |
| `--xy` | `@keyframes beeFlight` | `ui-events.js` `triggerBeeFX()` |

<!-- END MOTION INVENTORY -->
