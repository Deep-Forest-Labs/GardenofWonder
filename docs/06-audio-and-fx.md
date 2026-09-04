# Audio and Game Feel

## Audio

Every sound is synthesized with the Web Audio API at the moment it plays. There are no audio files.

### Signal path

```
tone() / noise()    →  sfxBus (0.65)  →  sfxFilter    ┐
ambient music       →  musicBus (0.16) ───────────────┼→  master (0.9)  →  destination
beds, thunder, song →  ambBus (0.36)   ───────────────┘
```

Three buses, and since 2026-08-31 **three channels the player can reach**: Sound effects, Ambience
and Music, each with a level and a mute of its own. Toggling a bus ramps its gain with
`setTargetAtTime` rather than jumping, to avoid a click.

**A channel is worth `HOUSE[ch] × slider`, or nothing when muted.** The three house levels —
`sfx 0.65`, `amb 0.36`, `music 0.16` — are calibrated against each other and against every recipe's
own gain, with `BED_TRIM` and the stinger makeup downstream of the ambient one. **A slider
multiplies its house level and never replaces it.** Written as a raw bus gain it would throw the
whole calibration away, and every measurement taken against it with it. Every slider defaults to
1.0, so a player who never touches one hears exactly what they heard before the channel existed.

**0.36 is not a new number, it is the old one said once.** Ambience used to be `0.5` trimmed by
`0.72` whenever music was off — which is the default, and is how the game is actually played. The
two mutes reaching one bus was the thing being retired, not the level, so the height the sky has
been playing at is now written down as a single house level.

**A slider at zero is not a mute, and the difference is load-bearing.** Muting music calls
`stopMusic()`, because muting by bus gain alone left the scheduler building oscillator nodes every
3.2 s forever. Dragging music to zero must leave that timer running: the player is turning something
down, not switching it off, and a channel that quietly tore itself down at zero could not be dragged
back up. `setLevel()` therefore only ever touches a gain; `setSfx()`, `setAmb()` and `setMusic()`
are the switches. **The same reasoning now covers the page going away, not just the mute** — see the
lifecycle contract under Ambient music — with one difference that matters: a mute is a channel
switched off and changes `prefs`, while a pause is a page going quiet and must not, or a player who
left with music off comes back with it on.

**Muting Ambience cancels the duck; turning it down does not.** The duck is the sky leaning on the
effects, so a muted sky has nothing to lean with. A bed turned to zero is still a bed, and the
effects still belong under it.

**The flower's hummed song stays on Ambience.** It is the one *tune* on that bus and the argument
for moving it to Music is real — but music is off by default, and the Wonderfall's signature moment
would then be silent for almost every player. It is the garden singing at you, not a score.

The ambience bus opens only while something is standing on it and closes again behind the last
sound, so clear weather carries no idle gain. `sfxFilter` is the duck — see below.

### Starting audio

Browsers refuse to start an `AudioContext` without a user gesture. `Sound.init()` is therefore
bound to the first `pointerdown` on the window (`{ once: true }`), and `Sound.resume()` is called
again at the start of interactions that make noise, because iOS can suspend a context that was
already running.

**If you add an entry point that plays sound, call `Sound.resume()` first.**

### The two primitives

`tone({ freq, type, dur, gain, at, slide, bus })` — one oscillator through a gain envelope. The
envelope ramps exponentially to `gain` over 12 ms then decays to silence over `dur`. `slide` ramps
frequency to `freq × slide` across the duration, which is how the rising boost whoosh and the
falling denial buzz are made.

`noise({ dur, gain, at, hp })` — a decaying white-noise buffer through a high-pass filter. Used for
sparkle and air, layered under tonal sounds.

Everything is pitched against a **C major pentatonic scale** (`[0, 2, 4, 7, 9, 12, 14, 16, 19, 21]`
semitones from C4 at 261.63 Hz). Any combination of these notes is consonant, which is why layered
sounds never clash.

### Sound recipes

| Name | Character | Triggered by |
| --- | --- | --- |
| `tap` | Two-note ping, **pitch climbs with combo** | Every flower tap |
| `crit` | Four-note square arpeggio plus bright noise | Critical tap |
| `coin` | Two quick high square notes | Ticket bonus, cheat grant |
| `harvest` | Rising four-note triangle figure | Common harvest |
| `plant` | Soft rising sine plus low noise | Planting |
| `unlock` | Five-note ascending fanfare | Plot unlocked |
| `quest` | Three soft sine notes | Quest claimed |
| `levelup` | Seven-note triangle run plus noise (same shape as `legend`) | Level-up |
| `buy` | Two-note confirmation | Upgrade or decor bought |
| `deny` | Falling sawtooth buzz | Insufficient funds |
| `boost` | Long rising sawtooth sweep with noise | Booster activated |
| `open` / `close` | Short rising / falling sine | Sheet opened / closed |
| `rare` | Three soft sine notes | Rare harvest |
| `legend` | Seven-note triangle run plus long noise tail | **Epic and** Legendary harvests |
| `wonder` | Ten-note square run plus low sawtooth drone | Wonder Effect |

`tap` takes the current combo as its argument and indexes the scale with it, so a sustained tap
streak plays a climbing melodic run. Combo also multiplies tap payout; the pitch climb is the
audible half of that same meter.

Epic harvests deliberately reuse `legend`. There is no separate epic sound.

### The weather beds

A bed is not a recipe. It starts when a sky lands, hangs for as long as the sky does, and fades out
behind it, so the four of them live on their own bus and get their own table — along with the three
one-shots that ride the same bus, because those belong to the sky rather than to any one event. All
of it is synthesized like everything else and pitched against the same pentatonic scale; none of it
is a file.

| Name | Character | Plays |
| --- | --- | --- |
| `rain` | A wide soft hiss with a narrow band of patter over it. The body opens and closes on a slow breath, because a minute inside an unmoving hiss is fatiguing | Rain |
| `storm` | **Rain's own three bands, darker, with the patter held back — plus the roll band underneath at about half its old weight.** A storm is rain *plus* thunder; this used to be thunder minus rain. The swell rides the roll band, which is the half a phone can reproduce | Thunderstorm |
| `aurora` | Four sine voices spread wide and high, each shimmering at its own rate so the pattern never comes round, with chimes sprinkled on top rather than played in time. Deliberately the prettiest sound in the game | Aurora |
| `wonderfall` | A wider chord than the garden ever uses, a low drone borrowed from the Wonder fanfare, and a high note falling every few tenths of a second — gold you can hear landing | Wonderfall |
| `crack` | The split, then a tail rolling away in overlapping decays. A single burst reads as a door slamming, not as weather | Every storm flash |
| `rumble` | The same roll heard from further off — quiet because it is distant, not because it has been filtered into nothing | The storm leaving |
| `sing` | The flower's hummed melody, closed mouth: slow in, slow out, dark on top. Three phrases, so a sky that sings four times is not a loop | Wonderfall, three times |

`Sound.bed(id, on, level)` starts and stops one; `Sound.bedsOff(fade)` clears the bus so an
interrupted sky can hand the next one something clean.

### Measuring a bed

**A sky is heard, not seen, and an ear on a laptop speaker is the wrong instrument** — the game is
played on a handset, which gives back almost nothing under a few hundred hertz. `node
tools/bedbench.js` renders each bed offline through the real graph and prints four numbers: peak,
RMS, the RMS of everything above 300 Hz (*what a phone can reproduce*), and **swing** — the loudest
second against the quietest, in dB.

`Sound.renderBed(id, seconds, opts)` is what it drives. It swaps the module's context for an
`OfflineAudioContext`, builds through the same `BUILD[id]` the game plays and down the same chain —
bed trim × the ambient channel × master — and puts the live context back in a `finally`. Measuring
the real graph is the point: a bench that copies the constants stops measuring this file the first
time either changes. Nothing in the game calls it.

**Swing is the number that found the Thunderstorm bug.** The old storm measured a respectable
3.0 dB whole-bed and **0.59 dB across the band a phone can actually play**, because its only
modulation rode a sub-190 Hz band the speaker throws away — so on the only device anyone plays this
on it was literally constant. "Overbearing" and "constant, steady" were a measurement, not an
impression. A bed under about 1 dB of phone swing does not breathe, and a minute inside it is
fatiguing however quiet it measures.

| Bed | peak | rms | phone rms | swing | phone swing |
| --- | --- | --- | --- | --- | --- |
| **Rain, before 2026-09-03** | 0.106 | 0.0207 | 0.0220 | 3.05 dB | 2.68 dB |
| Rain | 0.049 | 0.0103 | 0.0110 | 2.95 dB | 2.63 dB |
| **Storm, before 2026-08-31** | 0.083 | 0.0177 | **0.0156** | 3.03 dB | **0.59 dB** |
| Storm | 0.049 | 0.0101 | 0.0109 | 2.48 dB | 2.20 dB |
| Aurora | 0.047 | 0.0120 | 0.0123 | 8.48 dB | 8.78 dB |
| Wonderfall | 0.036 | 0.0101 | 0.0112 | 6.22 dB | 7.35 dB |

Three runs each, 20-second window. **RMS is the comparator; peak moves run to run**, because the
shared noise buffer is regenerated per render.

**The two noise beds were halved on 2026-09-03, at the owner's request** — "reduce the background
rain/wind noise by 50%" — which is exactly −6.02 dB and lands them at half their old rms on the
nose. So rain and storm are now the **quietest things on the bus** on a phone, below the Wonderfall
and well below the aurora; the weather sits behind the garden rather than over it. The storm still
sits a hair under the rain on every column, which is the relationship the 2026-08-31 pass
established, and halving both preserved it exactly. **The invariant that makes this checkable: a
linear bed gain scales every sample, so swing — a ratio — cannot move.** The phone-swing column is
therefore the proof the beds still breathe, and it held at 2.6 and 2.2 dB. Aurora and Wonderfall
came back byte-identical, which is the regression latch on a change that could have touched all four.

**The level is the caller's.** `ui-weather.js` reads it out of `DATA.weatherStage.<sky>.bed` and
passes it in, because `audio.js` knows nothing about the game and the knob has to stay where a
remote config can reach it. What `audio.js` owns is the calibration: filtered noise and a stack of
held sines are wildly different loudnesses at the same number, so each bed is trimmed to land in
the same place — under the game's loudest one-shot, a little above the pad. **For the two tonal beds
that is all `BED_TRIM` is; for the two noise beds it is that calibration plus the deliberate 6 dB
cut of 2026-09-03.**

**Which knob to reach for, because there are two and only one of them is honest.** The caller's knob
is what `crack()`, `rumble()` and `sing()` ride, through `rel()`. `BED_TRIM` sits *downstream* of it
and `rel()` never reads it — so **loudness is retuned in `BED_TRIM` and the thunder never moves**,
while halving `DATA.weatherStage.storm.bed` would have taken every thunderclap down with the hiss.
That is why the owner's 50% was spent on the trim.

There is a hard ceiling too, and it is not a tuning value: it is the point past which a level
dragged to its end stops being something anyone would hold a phone to. Since the halving it can no
longer engage for rain or storm at any legal knob — it would need a knob above 1, and `knob()`
clamps to 1 — so the rail now exists for the two tonal beds alone.

### Ducking under the rain

While it rains, everything else in the game gets a little further away. `Sound.duck(true)` closes a
lowpass filter sitting between the effects bus and master — wide open at 18 kHz, down to 950 Hz
when the rain lands, eased across about a third of a second — so taps, harvests and purchases go
soft-edged for as long as the sky lasts and come back when it clears.

It is a real node on the bus rather than a change to each recipe, which is what makes it free: a
sound written a year from now sits under the rain without knowing the rain exists. Only Rain and
the storm duck. The aurora and Wonderfall do not, because those two are meant to be the loudest
thing that has happened all session.

**The 2026-09-03 halving did not touch the duck, and could not have.** The duck is a filter cutoff,
not a gain, so no bed value reaches it and its depth is unchanged — but the sky it makes room for is
now 6 dB quieter, so the effects sit relatively closer under it than they did. If that ever reads as
a fault — taps sounding muffled for no visible reason — **the knob is `DUCK_HZ` (audio.js), and the
bed trim is emphatically not it.**

### Ambient music

Off by default. A four-bar chord progression — `[0,4,7]`, `[-3,2,5]`, `[-5,0,4]`, `[-1,2,7]` —
scheduled on a 3.2 s `setInterval`. Each bar lays down a 3.4 s sine pad an octave down, plus a
six-note triangle arpeggio drawn from the same chord.

`setMusic(true)` starts it and `setMusic(false)` stops it via `stopMusic()`, which clears the
interval and nulls the handle so `startMusic()`'s re-entry guard stays honest. Muting used to take
the bus gain to zero and leave the scheduler running, quietly building oscillator nodes every 3.2 s
for as long as the tab stayed open. Notes already scheduled are untouched and fade out with the bus,
so stopping is silent.

**There are three recurring timers outside the frame loop, not one** — the music's 3.2 s step, the
aurora's 1.5 s chime and Wonderfall's 0.42 s drizzle — and they have been three since the beds
shipped. **The lifecycle contract that governs all three:** notes are written against the
AudioContext clock (`tone()` computes `ctx.currentTime + at`) while the schedulers that write them
run on the wall clock. A frozen page stops the first and not the second, so a scheduler left running
banks a note every tick against a clock that is not moving and fires the whole pile on one sample
when the context comes back — measured at 81 notes inside 2.45 s after thirty seconds asleep,
scaling linearly with the absence. So a recurring timer in `audio.js` **stops while the page is
away, AND checks `ctx.state` itself.** Both, because they answer different failures: the stop is
`Sound.pause()` / `Sound.resume()`, wired from a third `visibilitychange` listener in `ui.js`, and
it is hygiene; the guard is the fix, because `visibilitychange` is not guaranteed on every sleep
path and a future timer that forgets to register is still covered. The test is `!== 'running'` and
never `=== 'suspended'` — **iOS reports `interrupted`**, and only a gesture lifts it.

A pause preserves `bar`, every live bed and every preference. That is the same promise the bar clock
paragraph below already makes, and a sleep was quietly breaking it: with the guard written below the
bar counter the notes stop and the progression still walks, so the tune returns on the wrong chord.
A bed's recurring voices are declared as a `pulses` list on its record rather than scheduled inside
its builder, so the pause can stop and restart them without tearing down the drones and the noise
loop underneath — those are `BufferSource`s and a suspended context does not disturb them.

**Every sky rearranges that music rather than replacing it.** The progression, the bar clock and the
timer are the same ones running in clear weather; what changes is the dress — how open the filter
is, what the pad is made of, how many notes the arpeggio has, how far apart they fall and which
octave they sit in. Rain closes the top down and thins the arpeggio, as if you were hearing the
tune from indoors. The storm goes darker and slower still. The aurora holds each chord for two bars
and lifts the arpeggio two octaves, which is what makes it read as light rather than as a melody.
The sunbreak brightens. Wonderfall is the one dress that is genuinely its own.

`Sound.arrange(id)` cross-fades between them over about half a second. Both arrangements stay live
and only their output levels move, so the handover is a change of clothes rather than a cut — and
**the bar clock is never restarted**, which is the whole point. The tune you were half-listening to
keeps its place and the sky is something that happened to it. That is the Animal Crossing move, and
it is the reason weather never feels like a different game has started. A new dress also picks up
the chord already playing straight away, or the handover falls into the gap before the next
downbeat and the sky arrives to silence.

**The record tracks are files, not recipes, and their brief is
[48-music-direction.md](48-music-direction.md)** (2026-09-02). The collectible-records feature —
a shelf of songs found through play, each one a record the player can put on — is specified in
[49-the-record-shelf.md](49-the-record-shelf.md), and nothing in this file changes until it is
built: the tune above stays the default for every player with no record on, music stays off by
default, and a record's track is a lazily loaded file under `art/music/` that the service worker
leaves alone and that never joins `CORE` — the fifth binary exception, to be logged in
[09-conventions.md](09-conventions.md) by the build that adds the first file. Doc 48 is the
commissioning bible: the sonic identity a track must sit inside so that the chimes and beds above
layer over it, the five briefs, and the delivery specification. Its first rule is the one the tune
above was built on — everything on the white keys, so the pentatonic taps never clash.

## Visual effects

`fx.js` owns one full-screen `<canvas>` plus a DOM layer for floating text. The canvas sits behind
the interface and ignores pointer events.

The canvas is sized to `devicePixelRatio` capped at 2 — uncapped DPR on a 3× phone triples fill
cost for no visible benefit.

**A resize only re-seeds the pools when the window really changed size.** iOS fires `resize` when
the URL bar collapses, and the old `resize()` rebuilt both particle pools every time — so every
raindrop on screen teleported the moment the player scrolled. The backing store is re-applied
either way; only a real dimension change reseeds, which is an orientation change and nothing else.

**The screen shake writes a transform, not custom properties.** It used to set `--shake-x/y/r` on
`#game`, which makes every element under it re-resolve its inherited custom properties — measured at
2.5–3.4 ms a frame against 0.004 ms for the same transform written straight onto `.world`, and the
Sky Pass made it dearer still by adding a subtree that reads ninety-odd `var(--wx-*)`. It runs for
0.28 s on every crit tap, which in a tapper is most of the time the thumb is down. `style.css`'s
`--shake-*` defaults stay exactly where they are — they are the resting transform, and the inline
value is *removed* rather than zeroed so the stylesheet takes the element back.

**`FX.step` only measures the wallet when a coin could use it.** `targetPoint('coin')` is a layout
read and it sat above the particle loop unconditionally, so every frame in the game forced a flush
for a magnet that exists for about a second after a harvest. It is not cached across frames on
purpose: the wallet lives inside `.world`, which the shake moves, and a stale point would drag the
coins off target for the length of a shake.

`FX.partCount` and `FX.canvasInfo` are readouts for the frame-rate instrument, the same shape
`FX.weatherCount` already was — pure reports of this file's own state, so "fx.js knows nothing about
the game" still holds.

### Particle types

| Type | Behaviour | Used for |
| --- | --- | --- |
| `coin` | Arcs up under gravity, spins with a squash, then **flies to the coin wallet** | Taps, harvests |
| `spark` | Radial burst, shrinks as it fades | Planting, hastening, purchases |
| `star` | Five-pointed, slow float with spin | Rare and better harvests, crits |
| `confetti` | Rectangles tumbling with drag, flipping through zero width | Legendary, unlocks, Wonder |
| `ring` | Expanding circle outline on an ease-out | Impact accent on most events |

The coin magnet is the detail that sells the economy: after 32% of its life a coin lerps toward the
live screen position of the coin counter, so earnings visibly land in the wallet. Registered via
`FX.setMagnet('coin', walletElement)`.

### Ambient petals

Independent of the particle pool, seeded at init and on resize. Count is `min(18, width / 34)` and
zero under reduced motion. They drift down with a sine sway, wrap at the edges, and are drawn at
55% alpha so they never compete with gameplay.

### The weather layer

Rain, the storm's heavier rain and Wonderfall's gold drizzle all share one layer, built in the
ambient petals' pattern rather than as a spawner. The pool is seeded once at the size that was
asked for and every drop leaving the bottom comes back in at the top, so the budget is the count
and never a function of how long the sky has been standing. Ninety-six is the ceiling whatever the
data asks for.

`FX.weather(kind, opts)` sets the kind and its count, speed and wind; `FX.weatherOff(seconds)` ends
it. Ending is a thinning, not a stop: the share of the pool in play ramps down over the seconds
asked for, and the drops still falling reach the ground and are not replaced — which is what a
shower stopping actually looks like. The layer is zero under reduced motion and the wet ground
carries the sky instead.

Rain and the storm draw as streaks whose length is their own speed, so the storm's faster,
wind-blown drops are visibly harder without a second pool to keep in step. **Gold drizzle has no
wallet magnet, and that is deliberate.** The magnet is the thing that makes a coin read as money;
this is light falling out of the sky, and gold that visibly landed in the counter would promise a
payout Wonderfall does not make.

`FX.splashAt(x, y)` is a ring and three droplets where a drop lands. It only ever lands on a plant,
never on bare soil, because the squash it sets off is the plant's.

### Floating text

DOM, not canvas, because it needs the game font and outlined text style.
`float(x, y, text, kind, tint)` appends an absolutely positioned element with a random horizontal
drift, then removes it after 850 ms (1,100 ms for `big`). Kinds: `crit`, `big`, `gem`, `ticket`,
`water`, `bee`, `lucky`, `good`, `mult`, and the four rarity names. The optional `tint` is a colour
in and a colour out — it writes `--float-tint` on the element and nothing in `fx.js` knows what the
colour means, the same shape `sparks(x, y, n, tint)` and `ring(x, y, tint, …)` already have.

A float is **plain text**: the helper writes `textContent`, so it cannot carry a pill, an icon or
any markup, and it never should. Two floats is how a second fact is said.

**Naming the multipliers at the harvest.** Eight multipliers reach a harvest payout — rarity, a
power-up, pollination, the Wonder, petals, a verb, a mutation and a creature — and a floating number
that named all of them would be worse than one that names none. **Only the two the player
deliberately switched on are said: a power-up and the Wonder.** Rarity has a whole language of its
own already (colour, stars, a sound, a toast), and petals, verbs, hives and creatures are permanent
background nobody is watching a clock on. A power-up and a Wonder are the two things a player spent
and is watching a countdown for, which is exactly why the silence about them was the one that got
noticed.

The two numbers arrive on the `harvest` payload as `boostMult` and `wonderMult` — `game.js` never
touches the DOM and `ui-events.js` does no economy math, so the payload is how the number crosses.
The view multiplies them and floats **one** smaller line carrying the product (`×3.75`), tinted by
the louder cause: `WONDER.tint` when a Wonder is running, otherwise the power-up's own `tint`. One
float rather than two, because two would put four floats on the busiest moment in the game and set
the power-up's `×1.25` in competition with the Wonder's `×3` for the same fourteen pixels; the rail
carries the itemisation one glance away. The threshold for "this is a change rather than rounding"
is `UI.multText()`, shared with the seed picker's pill so the two surfaces can never disagree.

**Floats hold still under reduced motion, and this was broken for every float in the game.** The
global clamp runs an animation once for `.001ms`, and `floatUp` **ends at `opacity: 0`** with
`animation-fill-mode: forwards` holding that last keyframe — so with the preference on, every number
the garden has ever paid appeared for a microsecond and then sat there invisible. Measured live: the
same node reads `opacity: 1` with `.float{animation-name:none;opacity:1}` in the reduced-motion block
and `opacity: 0` with `animation-name` forced back to `floatUp`. It now holds still at full ink in
the base `translate(-50%,-50%)` position and its own `setTimeout` takes it away on schedule.

### Screen shake

`FX.shake(power, time)` sets shake amount and remaining time, taking the **maximum** of current and
requested rather than adding, so simultaneous triggers don't compound into nausea. Each frame it
writes random offsets into `--shake-x/y/r` on `#game`, decaying to zero. Rotation is 9% of
translation magnitude. Fully disabled under reduced motion.

### The flash ceiling

The storm asks for a lightning flash every few seconds, jittered so it never falls into a rhythm.
It does not get one every time it asks. A gate sits between the storm and the screen and allows
**no more than three flashes in any ten-second window, whatever the data says** — the storm only
ever asks, and the gate answers.

The reason it is a hard limit rather than a tuned one is that photosensitivity is not a knob.
Every other number in the sky lives in `data.js` where a remote config can move it, and this is
precisely the kind of number that eventually gets moved by someone chasing drama.

Under reduced motion the flicker is off entirely and a slow tint pulse stands in — roughly seven
hundred milliseconds of soft colour instead of a hundred and twenty of white — and the storm asks
for it a little over twice as rarely. A dead channel would have been worse than either: with no
substitute at all, a player with the preference on gets a thunderstorm that never announces itself.

Each flash also picks a fresh position for the bolt behind the hills. A bolt that strikes the same
spot twice reads as a decal rather than as weather.

### Haptics

`FX.haptic(pattern)` wraps `navigator.vibrate`, accepting a number or a pattern array, wrapped in a
try/catch because some browsers expose it and then throw. Silently absent on iOS Safari.

| Event | Pattern |
| --- | --- |
| Tap | `7` |
| Hasten | `6` |
| Plant | `10` |
| Common harvest | `12` |
| Purchase | `14` |
| Denial | `20` |
| Crit | `[12, 30, 22]` |
| Rare / Epic | `[10, 20, 14]` |
| Unlock | `[15, 30, 15]` |
| Legendary | `[20, 40, 20, 40, 40]` |
| Wonder | `[30, 40, 30, 40, 60]` |
| Storm flash | `[12, 30, 22]` |
| Wonderfall arrives | `[18, 40, 18, 40, 30]` |

The flash deliberately reuses the crit's pattern. It is the same shape of moment — short, bright
and unasked for — and giving it a thump of its own would have said it was a bigger one.

## The feedback ladder

The single most useful thing to understand before adding an event: rewards are stacked so their
intensity is legible without reading a number. A Legendary harvest must feel unmistakably bigger
than a Rare one.

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

**The multiplier float is a MODIFIER on the four harvest rows, not a rung of its own.** It adds no
sound, no shake, no haptic, no particle and no toast — one extra text node, at 14px against the
payout's 19–26px, whenever a power-up or a Wonder is running. It is deliberately a *passenger* at
Epic and Legendary: a forced Legendary with both multipliers up buries the payout float itself under
22 coins, 16 stars, a ring, 34 confetti and a discovery float, and the multiplier disappears into
noise that already exists rather than adding to it. The fact rides the **toast body** at those tiers
instead — `Worth 4,620 coins · ×3.75` — which is the one surface still legible there. It earns its
keep at Common, which is 60%+ of harvests and the quiet one. Escalating it to survive the loud tiers
(bigger, longer, its own sound) is the change to refuse.

**Fall's two beats are one rung apart on purpose.** The bed *arming* is a promise — the board goes
gold and says so from across the room — and it gets a crit's worth of noise. Collect All is the
promise being *kept*, and it is the biggest single moment the season has, so it takes the level-up's
sound and confetti and adds the toast that names the bonus. Collecting plot by plot still pays
exactly the same, so the difference between them is genuinely a difference of occasion rather than
of reward.

**One celebration, not eight.** `Game.fallHarvestAll()` commits the whole bed in one go precisely so
this can be a single beat: eight taps would be eight coin bursts, eight floats, eight `crit` sounds
and a coin counter lurching through eight `currency` emits, which is noise where the payoff should
be.

**Fall speaks in a toast, not in a speech bubble.** `UI.say()` writes into `#speech`, which lives in
the garden's flower cell — and `.in-fall .garden-frame{display:none}` hides it. A line spoken in
Fall goes into a hidden node. The `windfall` beat still calls `say()` and has always been silent
there; Collect All does not, and the toast carries the sentence instead.

Rare harvests deliberately get no toast. At 20% frequency they generated constant notification
noise; stars and floating text carry the moment instead. Toasts are also capped at two on screen
at once, oldest evicted.

Mastery tiers follow the same reasoning one step further. Early tiers land every ten or so
harvests of a seed, which across eight plots is a toast every twenty seconds — so a tier only
toasts when it is genuinely rare: a seed's **first** tier, or a **gem-paying** fifth tier. Every
other tier gets the full Rare-tier juice on the plot itself — stars, ring, the `quest` sound, and
two floating texts naming the flower, the tier, and the new yield — and no toast. A gem tier does
not escalate to Epic or Legendary juice; the gem is in the toast body, not in more confetti.

**Rarity buys layers** is the sky's version of the same contract. Rain moves three channels, the
storm five, the aurora six, and Wonderfall moves all of them. Seven slots in ten are clear, and
clear giving way to clear moves nothing at all — that silence is the thing that makes the rest
events. A sky earns its place here the way an event does, by how rarely a player sees it.

**No sky shakes the screen.** Shake is the game's punctuation for a single moment landing, and a
sky that lasts a minute punctuating itself every few seconds would be exhausting rather than
dramatic. The storm's flash and its haptic thump carry the impact instead, under the ceiling above.

**The sunbreak is a payoff, not an event.** Nothing rolls it, it is not one of the five skies, and
it moves no number: it is what the garden looks like after the rain, and it only happens when the
next slot is clear and it is daytime. The shafts cross the sky on a slow sweep while fading in and
out on a shorter clock of their own, so they never settle into a loop, and they deliberately outlive
the sky that earned them. The storm earning them is the bigger of the two payoffs, which is the
right way round — you sat through the loud one.

**Reduced motion is honoured by the sequence, not only by the CSS.** Every sky has an honest quiet
version rather than a missing one: the front still arrives, it just stops drifting; the ground still
darkens and still dries slowly afterwards, because the drying is the trace the rain leaves; one
ribbon holds still where three would drift; the veil hangs without shimmering; and the flash becomes
the tint pulse. The particle layer goes to zero, weather haptics sit out, and the flower does not
sing — the mouth that would be moving is held still, so the sound would be coming from nowhere.
What must never happen is a channel that simply disappears. A sky that reads as nothing at all is
worse than one that reads quietly.

This ladder is a design contract. If you add an event, place it on the ladder deliberately rather
than giving it maximum juice.

## The Turn's celebration (2026-08-29, phase 2)

The ceremony's ladder, placed but deliberately **not tuned** — where the Tally sits on the
celebration ladder is phase 4's, per [34-build-plan.md](34-build-plan.md).

| Beat | Sound | FX |
| --- | --- | --- |
| The Turn commits | `levelup` | — |
| Each Tally line lands | `coin` | `FX.haptic(8)` |
| The total | `legend` | `FX.confetti` + `FX.ring` (seed green) + `FX.shake(7)` + `FX.haptic([14,50,14])` |
| A petal bought | `buy` | `FX.floatAt(+1)`, `FX.haptic(10)` |
| A seed unlocked | `buy` | `FX.haptic([12,40,12])` and a toast |

**Reduced motion is honoured by the sequence, not only by the CSS.** With `prefers-reduced-motion`
the base count-up does not roll — it lands on its final value — and the lines land with no delay
between them, so the whole Tally resolves at once instead of over three seconds. The line entrance
(`.tline.just`) is a CSS animation and is already covered by the global reduced-motion block.
