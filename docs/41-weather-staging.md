# The Sky Pass — weather you can feel

**Status: the owner's spec, 2026-08-30. The MOTION STAGE is built and waiting for the owner's
review; no sky has integrated yet.** Weather already carries 20–30% of all income
through mutations (a tested invariant) and its entire presentation is one flat colour fade per
state — no sound exists for any weather, nothing on the board reacts, and Wonderfall, the rarest
sky in the game, never received the Wonder veil doc 18 promised it. **This pass stages the sky
the way the Wonder Effect stages itself**, using the grammar the great games share: foreshadow →
transform in layers → legible payoff → graceful end. The 2026-08-30 audit (in the decision log)
maps every current gap with file references; [18-mutations-and-weather.md](18-mutations-and-weather.md)
remains the mechanics record.

**Owner-picked scope:** the Weather Ladder (all four skies staged), the fronts/announce layer,
the world acknowledging, the music rearrangement, and two math nudges. The mutation petal-recolour
stays filed where the film pass left it — not in this round. **The motion gate applies: no sky
ships until the owner has approved its feel on the motion stage.**

## The one rule

**Rarity buys layers.** The louder the sky's rarity, the more channels move at once — the
feedback ladder, applied to the weather. Rain moves three channels; Wonderfall moves all of them.
Nothing fires on Clear→Clear (70% of slots): silence is what makes the others events.

## The ladder, sky by sky

Every number below ships in `data.js` under `DATA.weatherStage`, remote-config-ready. Values are
starting points; **the motion stage is where they get tuned, by hand, by the owner.**

### Rain — the cosy one (3 channels)

- **Arrival (the front):** the game knows the next slot in advance (the sky is computable), so
  ~30s before rain lands, grey clouds thicken and drift in from the edge, and the flower gets a
  forecast line ("Smells like rain coming"). One channel announces; no banner, no toast.
- **Transform:** a falling-drop layer on the ambient particle system (the petal-drift pattern
  with a different draw — tens of drops, not hundreds); the sky wash deepens; **soil and cobbles
  darken wet** (the board is the world too); plants glisten, and an occasional drop lands on one
  with the house squash-and-bounce; **the flower holds a leaf over its head** — the character
  acknowledges before any UI does.
- **Audio:** a soft rain-hiss bed (looping filtered noise on a new ambience bus that respects
  both mutes); the music's pad re-instruments gently "muffled indoors" — same tune, cosier
  clothes. The Animal Crossing move: rearrangement, never replacement.
- **Math (new, data-knobbed):** **rain waters** — `DATA.weatherStage.rainGrowth = 0.10`:
  everything grows 10% faster while it rains. Stardew's most-loved rule: a gift you can see.
  Applies through the existing growth-modifier stack (the 0.3 floor already clamps the product);
  a called Rain (8 gems) inherits it, which is fine — the bought sky is the same sky.
- **End — the sunbreak (owner-added, 2026-08-30):** drops thin over ~5s, and then, when the
  next slot is Clear and it is daytime, **god rays**: two to four soft diagonal light shafts
  fade in through the parting clouds — very simple, very mild, the sun shooting through after a
  shower. They drift slowly, live ~20–40s, and fade as the soil dries (~30s — the lingering wet
  ground and the rays together are the "that happened" trace). Music re-brightens under them.
  Built as CSS light-wedge layers (screen blend, low opacity, slow drift), never particles;
  daytime only; masked near the bottom like the season tint so the iOS strip stays clean.
  `DATA.weatherStage.sunbreak = { rays, opacity, driftSpeed, duration }` — all on the motion
  stage's sliders.

### Thunderstorm — the dramatic one (5 channels)

- **Arrival:** rain's front, heavier and darker; the flower braces ("Hold onto your petals!").
- **Transform:** everything rain has, darker — plus **the flash**: a ~120ms full-screen white
  flicker that silhouettes the garden, a bolt glimpsed behind the hills, and a wind state —
  plants and clouds lean, the ambient petals/drops blow sideways. Flashes are occasional
  (seconds apart, jittered), never strobing — `flashMinGap` in data, and the accessibility
  ceiling is hard: no more than ~3 flashes in any 10s window.
- **Audio:** a low rumble bed; a crack synced to each flash; one haptic thump per flash.
- **Creatures:** shelter — tending pets duck under the nearest plant's leaves and peek out.
- **Math:** none new. Gilded ×10 already pays; the storm-crit idea is **cut** for legibility —
  one sky, one message.
- **End:** one last distant rumble, wind eases, and the rain end plays out — **including the
  sunbreak** when the next slot is Clear in daytime. The storm earning the rays is the bigger
  payoff of the two.

### Aurora — the beautiful one (6 channels)

- **Arrival:** no front — an aurora *begins*: the sky dims toward dusk over ~4s **whatever the
  hour** (the light rules bend, which is what makes it read at noon), and the first ribbon
  fades in.
- **Transform:** **actual ribbons** — two or three soft colour bands drifting slowly across the
  upper sky (layered gradients, not particles); stars brighten; every plant takes a faint
  glow rim; the wash stays but stops being the whole show.
- **Audio:** the shimmer-chord bed — the pad slowed and brightened into chimes; deliberately the
  prettiest sound in the game.
- **Creatures:** they stop and **look up**. Nothing else. That stillness is the acknowledgment.
- **The flower** gazes up too, and its aurora lines are already written.
- **Math (new, data-knobbed):** **the sky brings the night** — while an aurora hangs,
  `Game.isNight()` reports true: Nightbell wakes, Luna works. Aurora is ~2.5% of slots, so the
  shift to Nightbell's expected value is negligible and gets a sim assertion saying so.
- **End:** ribbons drift off-edge, the daylight returns over ~4s, creatures go back to work.

### Wonderfall — the Wonder-class one (all channels)

- **Arrival:** the existing banner and forced flower line stay — joined by a soft takeover cue
  (the Wonder fanfare's gentler cousin) and a haptic.
- **Transform:** **the veil it was always owed** — the Wonder Effect's rainbow veil and breathing
  saturation, at reduced opacity so it reads as weather, not the ×3 event; **ripe plants bob in
  rhythm**; a gold drizzle from the sky (coin-particle rain, no wallet magnet — it's light, not
  money); and **the talking flower sings** — a small hummed pentatonic melody over the bed, the
  singing flowers of Wonder come home.
- **Audio:** the takeover school — this is the one sky whose music is its own.
- **Math:** untouched. Wonderstruck ×100 was always worthy of this.
- **End:** the veil lifts over ~2s, the flower's "Remember this one" line is right where it
  belongs, and any caught Wonderstruck keeps its glow as the residue.

### Called skies arrive like weather

Paying gems for Rain or a Thunderstorm plays a compressed front (~5s) instead of flipping a
switch. You bought a sky; it should arrive like one.

## The four supports, specced

1. **Fronts and forecast lines** — as laded above: fronts only when the *incoming* slot is a
   real sky (never Clear→Clear), one channel per announcement, forecast-flavoured
   `FLOWER_LINES` variants for each. The flower's line for a front is allowed to pre-empt the
   speech cooldown for Aurora and Wonderfall only (rarity buys interruption).
2. **The world acknowledges** — creature reactions per sky (shelter / look up / dance in
   Wonderfall's rhythm), wet ground on both boards' materials, the flower's per-sky poses.
   Drawn in the `critters.js`/`flora.js` contract so spikes and live screens share one source.
3. **The music rearranges** — per-weather arrangement of the existing pad + arpeggio (same
   progression, different instrument dress), an ambience-bed bus with its own lifecycle tied to
   the weather event, a gentle lowpass on SFX during rain, and Wonderfall's takeover. All
   synthesized; no binary assets.
4. **The math nudges** — `rainGrowth` and aurora-brings-night as above; storm-crits cut.

## The constraints (scouted in advance — do not rediscover these)

- **The iOS status-bar strip** is painted from the sky colour *without* the weather tint folded
  in. Any heavier sky recolour must join that multiply or the notch area desyncs — the exact
  class of join bug doc 08 spent four rounds on.
- **Reduced motion is honoured by the sequence, not just the CSS** — every sky needs an honest
  quiet version: static wet ground, a single dimmed aurora band, no flashes (a brief tint pulse
  instead), no bobbing. The Turn ceremony set this precedent; follow it.
- **Flash safety:** the storm flash respects a hard photosensitivity ceiling (above), and
  reduced-motion disables it entirely.
- **Particle budget:** the ambient envelope is ~18 today; a rain layer lives in the tens. The
  DPR-2 canvas cap stays.
- **Audio starts on a user gesture** — beds must begin from `Sound.resume()`-guarded entry
  points, and the ambience bus obeys both existing mutes.
- **Compositing order stands:** weather is a tint *over* the living day/night sky, never a
  replacement, and the season tint sits under it. The ribbons and veil are additional layers,
  not sky rewrites.
- **Mutation share stays in band:** the staging pass may not move the 20–30% income share —
  `rainGrowth` touches growth, not catches; the suite's share assertions must stay green, plus
  new assertions for `rainGrowth` in the modifier stack and aurora's `isNight()` window.

## THE MOTION GATE — the owner approves every sky before it ships

**Owner-required: get it right the first time.** The wireframe gate's sibling, for motion:

1. **The builder's first deliverable is `tools/sky-spike.html`** — a motion stage, loading the
   real `audio.js` and a copy of the fx patterns (spikes may lean on the real modules where they
   are DOM-light; note any divergence). One button per sky plays its **entire sequence** —
   front → transform → linger → end, **the sunbreak included on Rain's and the Storm's ends** —
   on a garden mock at 390×844, repeatable at will. A reduced-motion toggle shows each sky's
   quiet version (the sunbreak's is a single static faint ray, or nothing).
2. **Knobs on the stage.** Sliders for the values the feel depends on: drop count, wind lean,
   flash interval and brightness, ribbon speed, veil opacity, bed volumes, front duration, and
   the sunbreak's ray count, opacity, drift and duration. The
   owner fiddles until each sky feels right **and the spike displays the current values as a
   copyable block** — those numbers go into `data.js` verbatim. The owner tunes; the builder
   transcribes.
3. **Push, then stop.** One sky at a time is fine to review; nothing integrates until its sky is
   approved. The owner's annotations and chosen values are the spec from that moment.
4. **Then the build**, faithful to the approved motions, followed by the standard gauntlet —
   visual critic against the approved spike first, docs 05/06 second, the reduced-motion check,
   the suite's new assertions, and probe screenshots of each sky (drive the weather with the
   existing dev holds; the probe trap about screens-needing-progress applies).

## Sim-test additions

1. `rainGrowth` applies only while rain (or a called rain) is the active sky, composes into the
   existing growth stack, and the 0.3 floor still clamps the product.
2. Aurora's night window: `isNight()` true under an active aurora, false again after; Nightbell's
   long-run expected value shifts by less than a stated epsilon.
3. The mutation income share assertions stay green, untouched by the pass.
4. Fronts derive from the *computed next slot* and never fire on Clear→Clear.
5. No stage sequence writes game state (staging is presentation; the one exception is the two
   math nudges, which live in the engine, not the stage).

---

## As built: the motion stage (2026-08-30)

`tools/sky-spike.html` is up. Open it beside the garden and press a button.

**What is real on it.** It loads the repository's own `data.js`, `flora.js`, `critters.js` and
`audio.js`, so the plants, the flower, the creatures and every one-shot sound are the game's, not a
flattering copy. The scenery, the board and the dock are copied from `style.css` at 390×844 with an
iPhone 16 Pro's insets on, because a sky judged at the wrong proportions is not judged.

**Three deliberate divergences**, each noted in the file's header:

1. **The particle canvas is frame-local.** It mirrors `fx.js` — the same pool shape, the same
   `rnd`/`easeOut`, the same DPR-2 cap, the same clamped `step(dt)` — but sizes itself to the frame
   rather than to the window, because the stage is one element on a tuning page.
2. **The beds own their own `AudioContext`.** `Sound` exports `{ init, resume, play, setSfx,
   setMusic, prefs }` and no context, no bus and no handle on its pad, so the spike cannot reach in
   to add a third bus or re-instrument the music. The bed module is written the way it will be
   written *into* `audio.js` — an ambience bus beside sfx and music, gains ramped with
   `setTargetAtTime` — so the build is a transcription rather than a rewrite.
3. **Reduced motion is a toggle, not a media query.** The owner has to be able to see the quiet
   version of every sky on demand. The rules are the same rules either way.

**Six buttons, each playing a whole sequence.** Rain, Thunderstorm, Aurora, Wonderfall, called
Rain (the compressed front) and the Sunbreak on its own — front, transform, linger, end, with the
sunbreak riding the ends of Rain and the Storm when the hour is daytime. A phase strip re-enters a
phase without replaying the front; the button still plays the whole thing, because the whole thing
is what gets approved.

**The flash ceiling is enforced on the stage.** Wind the flash-gap slider down to 0.2s and the
gate refuses everything past three flashes in any ten seconds, and says how many it held back.

**The strip join is visible.** The band above the frame is painted from the same value the game
writes into `theme-color`, computed from the weather layers themselves. A toggle switches the join
off, which puts the notch desync on screen where it can be argued about instead of discovered on a
handset a week later.

### Knobs the spec did not name, added because the feel depends on them

The spec's list is all present. Six more earned a slider while the layers were being drawn, and
they are in the copyable block with the rest:

| Knob | What it does | Default |
| --- | --- | --- |
| `rain.wash` / `storm.wash` | how far the sky wash commits — the sky's own depth, separate from the wet ground | 0.46 / 0.68 |
| `aurora.rimGlow` | how strongly every plant takes its glow rim | 0.5 |
| `aurora.starBoost` | how far the stars brighten under the dusk | 0.85 |
| `wonderfall.bobPeriod` | the ripe-plant bob's period, so "in rhythm" can be put on the 3.2s bar | 1.6s |
| `stageHoldSeconds` | **stage only** — how long the stage sits in the transform. Never reaches `data.js`. | 18 |

`rain.wash` and `storm.wash` deliberately start higher than the live `.scenery::after` opacities
(0.30 / 0.52): the spike's wash is its own gradient layer rather than a flat tint, so the numbers
are not comparable and the live values are not the thing to match. **Whatever the owner lands on is
the number.**

### What the owner decides

The spec's values are starting points and every one of them is a slider. The three worth looking at
first, because they are where the current defaults are least confident:

- **Wonderfall's veil at 0.30.** It is deliberately far under the Wonder Effect's 0.62 so it reads
  as weather and not the ×3 event, and at 0.30 it is very quiet indeed. This is the one number that
  decides whether the rarest sky in the game announces itself.
- **The wet ground at 0.34 / 0.46.** It darkens the board as well as the lawn, which is the "the
  board is the world too" line made real — and it darkens the plants standing in it by the same
  amount.
- **The sunbreak at three rays, 0.28.** Very simple, very mild was the brief; check it against
  "did anyone notice".

One known tension, not a bug: everything that tints the frame is masked out over the last 44px, so
the very bottom of the lawn stays bright under a dark sky. That mask is load-bearing — iOS paints
the strip below a short window with the flat lawn colour, and a tint running to the edge draws the
join three rounds of layout work went into hiding.

## How to review it — one sky at a time

Open `tools/sky-spike.html`. Press **Sound** once (a browser will not make a noise until the page
has been tapped), leave **Music** on so you can hear the sky change the tune, and press a sky.
**Let it run all the way through the first time** — the shape is the thing being approved, not the
still. After that, the little FRONT / TRANSFORM / LINGER / END pills drop you back into whichever
part you are tuning without sitting through the announcement again. Every slider is live: move it
while the rain is falling and the rain changes under your hand.

**Rain — the cosy one.** Thirty seconds of clouds thickening and the flower saying it can smell
rain, then it lands: drops fall, the sky deepens, the soil and the lawn go dark and wet, the plants
pick up a sheen, and the flower puts a leaf over its head. It sits there for a while, then the drops
thin out over five seconds and the sun breaks through. The sliders that decide how it feels are
**Drops** and **Fall speed** (how heavy the weather is), **Sky wash** (how much light it takes out
of the day) and **Wet ground** (how much of that reaches the board — this one also darkens the
flowers standing in it, so it is the one to watch). **Drying** is how long the ground stays dark
afterwards; that lingering wet is the "that happened" trace.

**Thunderstorm — the dramatic one.** Everything Rain does, darker and heavier, plus the flash, a
bolt behind the hills, a wind that leans the plants and the clouds sideways, and the pets ducking
under the nearest leaves to peek out. It closes with one last distant rumble and then earns the same
sunbreak Rain does. **Flash gap**, **Flash jitter** and **Flash bright** are the whole character of
it — wind the gap down as far as you like and the stage will refuse anything past three flashes in
ten seconds and tell you how many it held back, because that ceiling is not negotiable. **Wind lean**
is how hard it is blowing.

**Aurora — the beautiful one.** No warning at all: an aurora simply begins. The sky goes down to
dusk over four seconds *whatever the time of day* — that bending of the light rules is what makes it
read at noon — and the ribbons fade in, the stars come up, every plant takes a faint glow, and the
creatures stop what they are doing and look up. Nothing else moves; that stillness is the point.
**Ribbons** (two or three, there is no fourth), **Ribbon drift**, **Ribbon alpha** and **Dusk depth**
are the four that matter. Push **Dusk depth** and the whole garden changes hour; push **Ribbon
alpha** and it becomes a light show. Try it with the **Hour** slider at midday, which is where it has
to work.

**Wonderfall — the rarest sky in the game.** The banner, the forced line, a soft takeover cue and a
haptic; then the rainbow veil comes over the garden, the ripe flowers start bobbing on the beat, gold
drizzles out of the sky, and the flower sings. **Veil** is the one number that decides whether this
sky announces itself. It starts at 0.30 against the Wonder Effect's 0.62 — deliberately far under, so
it reads as weather rather than the ×3 event — and at 0.30 it is very quiet indeed. That is the first
thing to judge. **Ripe bob** and **Bob period** decide whether the bobbing looks like dancing or
twitching; **Gold drizzle** is how much falls.

**The sunbreak — your addition, and it has its own button.** Two to four soft diagonal shafts fading
in through the parting clouds after a shower, drifting slowly, then fading as the ground dries. It
rides the end of Rain and the end of the Storm, and the Storm earning it is the bigger of the two.
**Daytime only** — put the **Hour** slider into the night and press it, and nothing happens, which is
correct. **Rays**, **Opacity**, **Drift** and **Duration** are all of it. It is meant to be very
simple and very mild, so the question to ask is whether anyone would notice it at all.

**Called Rain** is the same rain arriving in five seconds instead of thirty — what a bought sky
should feel like. **Reduced motion** shows the honest quiet version of whichever sky you press: no
drops, a still wet ground, one dim ribbon, a slow tint pulse instead of the flash, no bobbing, and a
single faint ray for the sunbreak. Worth a pass through all five.

**Join the strip** is on by default. The band above the phone is the strip iOS paints above an
installed app, and it takes its colour from the sky. Switch the toggle off during a storm and watch
it stop matching — that is the bug this pass has to avoid, made visible.

When a sky feels right, press **Copy**. That block is what goes into `data.js` word for word.
