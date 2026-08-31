# The Sky Pass — weather you can feel

**Status: the owner's spec, 2026-08-30. Not built.** Weather already carries 20–30% of all income
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
- **End:** drops thin over ~5s, soil dries over ~30s (the lingering wet ground is the "that
  happened" trace), music re-brightens.

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
- **End:** one last distant rumble, wind eases, the rain end plays out.

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
   front → transform → linger → end — on a garden mock at 390×844, repeatable at will. A
   reduced-motion toggle shows each sky's quiet version.
2. **Knobs on the stage.** Sliders for the values the feel depends on: drop count, wind lean,
   flash interval and brightness, ribbon speed, veil opacity, bed volumes, front duration. The
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
