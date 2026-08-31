# The Punch List — the working queue of bugs and polish

**This is the day's working queue, fed by the owner playing the game.** Items arrive as they are
noticed, get a number, and get investigated far enough that a fix agent starts warm rather than
cold. Nothing here is fixed by the keeper of this file — the list becomes the brief for a separate
fix round.

The permanent record is [11-known-issues.md](11-known-issues.md). This file is the short-lived half:
a fixed item is pruned to the graveyard at the bottom with its commit, and anything that turns out
to be long-lived — accepted, deferred, or a decision rather than a defect — graduates into
`11-known-issues.md` and leaves here. **The repo is the source of truth; where this file and the
code disagree, this file is stale.**

Severity is `blocker` (cannot play past it), `annoying` (the player notices and minds), or
`cosmetic` (the player might notice).

---

## Tonight's round

1. **#3 · Split the sound into three channels — effects, ambient, music, each with a slider and a
   mute** — do this one FIRST. The three buses already exist; only the settings conflate them. It
   also moves every bed's level, so tuning #1 before it would be tuning a number that is about to
   change. **Bigger than when it was filed**: the owner ruled sliders in, and a range input would be
   the first form control in the entire game.
2. **#4 · The app icon is a yellow faceless flower, not the hero** — the cheapest item on the list
   and the highest value for the effort: rewrite one SVG from a function that already exists, run
   three documented shell commands. It shares no file with anything else here, so it can run
   alongside the audio work rather than behind it.
3. **#1 · The Thunderstorm's bed has no rain in it and never moves** — a flat mid-low roar for a
   minute. Contained to `audio.js` and one `data.js` knob, no layout, no new surface.
4. **#2 · A standing sky pays the player and nothing on screen says so** — a chip and a timer in
   the rail, tap for what it does. Real work: a new tappable surface where the rail has never had
   one, and it brushes a standing ruling (see the item).

---

## Items

### #1 · POLISH · The Thunderstorm's bed is a featureless drone, not rain · annoying · reported 2026-08-31

**What the owner saw.** "The background sound for the storm is a little overbearing… the constant,
steady sound is a little too much… It does need to sound like it's raining, but I think it's just a
little overbearing and really jarring. Some simple light rain noises that are more cozy would fit
much better for this with a nice little track."

**Repro.** Settings → Developer tools → hold the weather on Thunderstorm, then sit in it for a
minute. Or `node tools/probe.js` after driving the sky there — but this one is heard, not seen, so
a screenshot proves nothing and the ear is the instrument.

**The likely cause — and it is not the volume.** Two separate things, both in
`audio.js`.

*It has no rain in it at all.* `BUILD.rain` (`audio.js:419`) is two bands: a body
of noise highpassed at 220 Hz and lowpassed at 1250 Hz, plus a narrow 2200 Hz bandpass tap that is
the patter — the part the ear reads as *drops*. `BUILD.storm` (`audio.js:444`) is
two bands as well, but both are low: a sub lowpassed at 190 Hz, and a "roll" band between 160 Hz and
620 Hz. **There is nothing above 620 Hz in a storm.** No patter, no hiss, no drops. A storm plays
only its own bed — `arriveRain()` in `ui-weather.js:241` calls `bed(id, …)`
with the one id — so the rain bed is never underneath it. What the owner is describing as "not
sounding like rain" is exactly that: it is a band-limited roar with the rain removed.

*The half you can hear never moves.* Rain breathes — `lfo(0.07, 380, body.frequency)` walks its
filter, so the hiss opens and closes. The storm's only motion is `lfo(0.05, 0.4, deepG.gain)`, and
that rides the **sub** band, which the file's own comment says a phone speaker "cannot reproduce…
at all". The roll band — the one a phone actually plays — is pinned at `rollG.gain.value = 0.6`
with no modulation whatsoever. So on the only device anyone plays this on, the storm is literally
constant.

**Measured, because "too loud" was the obvious theory and it is wrong.** `Sound`'s builders are
private and the ambience bus cannot be reached from the page, so the two graphs were rebuilt in an
`OfflineAudioContext` from the same constants and rendered for 20 seconds at the real in-game gain
chain (`bedGain × ambLevel(music off) × master`). Peak and RMS at the speaker, and the swing is the
loudest second against the quietest across the 20 s:

| Bed / band | peak | RMS | swing over 20 s |
| --- | --- | --- | --- |
| Rain, whole bed | 0.090 | 0.0199 | 2.74 dB |
| — rain body (220–1250 Hz) | 0.095 | 0.0204 | 2.74 dB |
| — rain patter (2200 Hz) | 0.019 | 0.0045 | 0.15 dB |
| **Storm, whole bed** | **0.069** | **0.0168** | 2.93 dB |
| — storm sub (<190 Hz) | 0.089 | 0.0147 | 7.56 dB |
| — **storm roll (160–620 Hz)** | 0.061 | 0.0154 | **0.66 dB** |

**The storm measures quieter than the rain.** `BED_TRIM` (`audio.js:369`) is doing
its job — both land near the 0.10 peak its comment promises. So **turning it down produces a quieter
featureless drone, not a cosier rain**, and the knob the owner offered as an option is the one thing
that will not help. The 0.66 dB on the roll band is the finding: that is the "constant, steady"
the owner heard, measured.

**On "a different music track".** `prefs = { sfx: true, music: false }` (`audio.js:12`)
— **music is off by default.** The storm's arrangement (`ARRANGE.storm`,
`audio.js:286`) is a pad at `lp: 620` with `arpOct: 0`, an arpeggio sitting at the
bass octave where rain's sits an octave up — dark on dark, and it would compound the problem if it
were audible. But unless the owner turned Music on in Settings, **they have never heard it**, and
the thing they are calling the storm's track is the bed. Both want the same treatment either way.

**Related — do `#3` first.** Splitting the sound into three channels retires `MUSIC_OFF_TRIM`, which lifts every bed by about 2.9 dB for a player with music off. Tuning this storm before that lands means tuning it twice.

The storm's two one-shots — `crack()` and `rumble()` — are separate from the bed, sit
on the `stinger` bus, and are not part of this complaint. Don't let a bed rewrite quietly change
them: `rel('storm')` scales both off the bed's level knob, so **moving `DATA.weatherStage.storm.bed`
moves the thunder too**. The flash ceiling in `ui-weather.js:120` is
photosensitivity and is untouchable regardless.

**Fix sketch.** Give the storm the rain's two upper bands and keep a reduced version of its weight —
a storm is rain *plus* thunder, and right now it is thunder minus rain. Concretely: build the storm
from the rain graph (air + body + patter, patter a touch softer and the body a little darker) with
the roll band underneath at a lower gain than 0.6, and move the swell LFO onto `rollG.gain` so the
audible half breathes the way rain's does. Then re-measure against the table above rather than
trusting the ear on a Mac speaker. **What it might break:** `BED_TRIM.storm` (1.9) is calibrated for
an all-low graph and will be wrong the moment high bands are added — the whole bed will jump. It has
to be re-derived, and `rel('storm')` carries any level change straight into the thunder. A second
trap: `loopNoise()` is one shared 4-second buffer, so the rain and storm beds running the same
source through different filters is fine, but two taps off one source is a fixed relationship — the
patter cannot be given its own independent rhythm without a second buffer, which the file
deliberately avoided for a phone hitch.

**Open question.** Whether the storm should keep any low weight at all once it sounds like rain, or
become "cosy rain plus the thunder cracks". The owner's words lean cosy; the sketch above keeps a
little weight so a storm still reads as different from a rain. A fix round can build one and let the
owner hear it rather than deciding on paper.

---

### #2 · POLISH · A standing sky pays the player and nothing on screen says so · annoying · reported 2026-08-31

**What the owner saw.** "When a weather effect happens, we should place a buff and a timer under the
quest bar, exactly how we do the power-ups. If it's thunderstorming or the Aurora of Beryllis, they
could see that they're getting some benefit from it… they could tap on whatever the power-up or buff
is active, and it does a quick tooltip that they can close. It explains what the weather is doing or
the modifier it's adding to the game."

**Repro.** Not a defect to reproduce — it is a missing surface. Confirmed absent: nothing in the
game draws a weather readout of any kind. `grep` for a weather chip, pill or badge across the `js`,
`html` and `css` returns nothing, and the rail (`ui.js:556`) renders boosters and the
Wonder Effect only.

**What a sky is actually worth**, so a tooltip can be true. Every value below is live in
`data.js` and read by `game.js`:

| Sky | What it does, right now | Where |
| --- | --- | --- |
| Clear | Nothing. `mutation: null`, `catch: 0` | `data.js:162` |
| Rain | Dewkissed **×2** at a 25% catch, **and grows 10% faster** | `rainGrowMult()`, `game.js:818` |
| Thunderstorm | Gilded **×10** at a 15% catch. **No growth nudge** — `rainGrowthActive()` tests `id === 'rain'` exactly | `game.js:817` |
| Aurora | Prismatic **×25** at a 12% catch, **and the garden counts as night** whatever the hour — so Nightbell and Luna wake and Nightbloom's tier bump can fire | `isNight()`, `game.js:827` |
| Wonderfall | Wonderstruck **×100** at a 10% catch | `data.js:166` |

The owner's instinct is right on the numbers: a Thunderstorm is a ×10 and an Aurora is a ×25 plus a
free night, and today the player's only clue is that the screen got darker.

**The trap in the copy, and it is the hard part.** A plant gets **exactly one** mutation roll, at a
moment chosen randomly inside its grow window when it is sown (`mutationMoment()`,
`game.js:865`), resolved against whatever sky stands *at that moment*
(`rollMutations()`, `game.js:870`). So a storm standing now only pays the plants
whose booked moment happens to land inside it. **A chip reading "Gilded ×10" promises a per-harvest
multiplier the game does not give**, and a player who harvests through a whole storm with nothing to
show will read it as broken. The wording has to be about the chance, not the payout.

**The engineering traps.** Three, all real:

- **`renderRail()` rewrites `el.rail.innerHTML` wholesale** whenever its signature changes, and the
  signature contains the countdown, so it changes about once a second. **Any tooltip anchored to a
  chip inside the rail is destroyed on the next tick.** The tooltip has to live outside the rail, or
  the rail has to stop rebuilding the node the tooltip hangs off.
- **The rail has no listener at all** — no click handler anywhere in `ui.js`, `ui-events.js` or
  `ui-shared.js` touches `el.rail`. Its chips are `<div>`s, not buttons. A tappable chip is a new
  interactive surface, and it needs a real button and a real `aria-label`, not a click on a div.
- **The rail is already in `noSwipe`** (`ui.js:708`), so a tap target there will not
  fight the vertical ladder gesture. That one is good news; keep it that way.

**Related — this brushes a standing ruling, and a fix agent must read it before starting.**
[18-mutations-and-weather.md](18-mutations-and-weather.md#open-questions), answered 2026-08-31:
*can the player see the forecast?* **No — the flower speaks it, it is never displayed**, because
"the moment planting is scheduled against a readout the garden stops being a place and becomes an
optimisation problem." The owner is asking for something different: a badge for the sky **standing
now**, not the one coming. That is a status light, not a timetable, and it does not reopen the
ruling — **but the timer is where the two touch.** A countdown to the end of the current sky is also
a countdown to when the next one starts, and paired with the flower's spoken forecast it rebuilds
most of the panel that was ruled out. Worth the owner's word before it ships.

Also related: `weatherSlotRemaining()` (`game.js:800`) already returns the seconds
left, so the timer needs no new engine work — but a **called** sky (bought with
`Game.callWeather()`) and a **held** sky (Developer tools) both outlast their slot, and
`weatherSlotRemaining()` measures the *slot*, not the sky. A chip that trusts it will count down to
zero and then keep going while the storm stands.

**Fix sketch.** A fifth chip class in `renderRail()`, tinted from `DATA.weather.types[].tint` (the
tints are already there and unused by the rail), shown when `Game.currentWeather().id !== 'clear'`,
with the same ring-and-countdown shape the boosters use so it reads as one family. Make it a
`<button>`; hang the tooltip off `.coach`'s existing arrow-and-`.tip` markup
(`style.css:2157`) rather than inventing a second callout style, and render it
outside `.rail` so the per-second rebuild cannot eat it. Copy comes from the table above, written as
a chance rather than a promise. **What it might break:** the rail is the row that *hides on short
screens* (the 640 px viewport case in the conventions checklist, and the reason the grid rows are
pinned — see the 2026-08-01 entry in [10-decision-log.md](10-decision-log.md)), so a weather chip
must not be the only place a sky is announced. `.coach` is positioned against a target's measured
box and has two recorded traps of its own — a hidden target measures 0×0, and a coach mark over the
garden gets covered by an open sheet — so check both. And the ceiling on rail width: with two
boosters and a Wonder running, a fifth chip is the one that overflows.

**Open question.** Whether the chip carries a countdown at all, given the forecast ruling above. A
tinted chip with no timer says "the sky is doing something" without saying when it stops; a timer
turns it into a small clock the player can plant against. The owner's call.

---

### #3 · POLISH · Effects, ambient and music are three buses behind two switches · annoying · reported 2026-08-31 · scope raised 2026-08-31

**What the owner asked for.** "Create three different settings for the sound… sound effects,
ambient, music. We can separate the things on those different channels. The wind effect that's going
behind the rain would obviously be on ambient, and we could turn that down very low. Eventually, we
can have different sounds on the ambient track that would be like birds, wind, leaves rustling…
Let's go ahead and separate those three styles of tracks moving forward." Then, asked switches or sliders:
**"Actually, I think we should have sliders and an on and off to mute them."** So every
channel gets a level *and* a mute — decided 2026-08-31, and the open question below is closed.

**Repro.** Settings shows two switches: *Sound effects* and *Ambient music*
(`renderSettings()`, `ui-sheet.js:1953`). There is no way to reach the sky's sound on its own.

**The likely cause, and it is smaller than it looks: the buses are already right, the switches are
not.** `audio.js` builds three separate buses and `06-audio-and-fx.md:10` already documents them as
"three buses so effects, music and the sky mute independently":

| Bus | What rides it |
| --- | --- |
| `sfxBus` (0.65) → `sfxFilter` | every `RECIPES` sound through `play()` |
| `musicBus` | the `ARRANGE` chains — the pad and arpeggio, per sky |
| `ambBus` (0.5) | the four weather beds, the flower's hummed song (`sing()`), and thunder via the `stinger` makeup gain |

**What conflates them is one function.** `ambLevel()` (`audio.js:561`) reads *both* preferences:
effects-off silences the ambience outright, and music-off trims it to `MUSIC_OFF_TRIM` (0.72). The
comment above it at `audio.js:15` is a deliberate argument for that — "a bed is the world making a
sound rather than a tune, so the effects mute governs it outright" — and a third channel **retires
that reasoning rather than extending it**. Whoever does this should read it and then delete it; it
is not a trap, it is a decision being overturned on purpose.

So the work is: a third `prefs` key, `ambLevel()` reading only that key, `MUSIC_OFF_TRIM` gone, a
third row in `renderSettings()`, and a third branch where `ui-sheet.js:2767` currently reads
`if (k === 'sfx') … else …` — a two-way branch that silently sends any third key to `setMusic`.

**This moves #1's numbers, which is why it goes first.** The owner plays with music off, so today
every bed is multiplied by `0.5 × 0.72 = 0.36`. Give ambient its own level and the natural default
is the untrimmed `0.5` — **about 2.9 dB louder on every sky, including the storm the owner just
called overbearing.** Tune `#1` after this lands, or tune it twice.

**Related.**
- **`#1`** — same file, and the storm's bed level is the shared number. Do `#3` first.
- **The duck crosses the channels.** `duck()` (`audio.js:108` in `06-audio-and-fx.md`) drops
  `sfxFilter` to 950 Hz while rain stands, so **ambient ducks effects**. That link must survive the
  split, and it raises a real question: should the duck still fire for a player who turned ambient
  off? Today it cannot happen, because ambient-off means effects-off. After the split it can.
- **The save needs no migration for the new key, but does for the old ones.**
  `state.prefs = Object.assign(d.prefs, parsed.prefs || {})` (`game.js:219`) merges onto the default
  object, so a new key in `defaultState().prefs` is backfilled correctly for every existing save —
  the nested-object trap in `09-conventions.md` does **not** bite here. What does bite: an existing
  player with `sfx: false` deliberately silenced the beds too, and a fresh `amb: true` default hands
  them a garden that suddenly makes noise. Derive the new key from the old prefs on first load
  rather than defaulting it flat.
- **`sing()` is the ambiguous one.** The flower's hummed melody during a Wonderfall is on `ambBus`
  today, and it is the one thing on that bus that is a *tune*. It is either the exception that stays
  on ambient or the one thing that moves to music. Pick deliberately and write it down.

**Fix sketch — three levels and three mutes.** Per channel, a saved level (0–1) and a saved mute
boolean; the mute preserves the slider's position, which is the whole reason for having both. A bus
gain becomes `house × level × (muted ? 0 : 1)`.

**The sliders must MULTIPLY the house levels, never replace them.** Those three numbers are
calibrated against each other and against every recipe's own gain — `sfxBus` 0.65 (`audio.js:43`),
`musicBus` 0.16 (`audio.js:87`), `ambBus` `AMB_LEVEL` 0.5 (`audio.js:14`), with `BED_TRIM` and the
`stinger` makeup gain sitting downstream of the last one. A slider written as a raw bus gain throws
all of that away, and every measurement in `#1` with it. Default each slider to 1.0 = the house level
exactly as it stands today, so a player who never touches one hears what they hear now.

**A slider at zero is not a mute, and this one is load-bearing.** `setMusic(false)` calls
`stopMusic()` on purpose — the comment at `audio.js:83` records that muting by bus gain alone left
the scheduler building oscillator nodes every 3.2 s forever. So the **mute** must stop the scheduler
and the **slider** must not, and dragging music to zero has to leave the timer running. Keep the two
independent; do not make zero imply muted.

**A range input would be the first form control in the game.** There is no `<input>` of any kind in
`index.html` or in any `ui-*` file — the game is buttons and gestures end to end — so this brings a
whole new surface with it:

- **It needs full custom styling** or it reads as a system control in a hand-drawn game:
  `::-webkit-slider-thumb`, `::-webkit-slider-runnable-track` and the Firefox pair, none of which
  inherit. `tools/sky-spike.html` has working range markup to crib the mechanics from, but its
  styling is bench styling, not the game's.
- **Run `node tools/style-check.js`.** New colours, radii and border widths on a brand-new control
  are precisely what it ratchets on, and a slider is several of each.
- **The sheet's drag-to-dismiss will NOT fight it.** That handler is bound to `el.sheetGrip` alone
  (`ui-sheet.js:2911`), not to the sheet body, and `.sheet` is already in `noSwipe` (`ui.js:708`),
  so the world swipe is out of the way too. Both were worth checking; both are clear.
- **Keep the native element.** A range input carries keyboard support and its role for free, and a
  slider rebuilt from divs loses both — `08-ui-and-layout.md` owns that promise. Note the recorded
  trap that `setPointerCapture` retargets every later pointer event to the capturing element: the
  native control does that to itself correctly, and a hand-rolled one would have to reproduce it.

**The rest of the split.** `ambLevel()` (`audio.js:561`) reduces to the ambient channel's own level
and mute; `MUSIC_OFF_TRIM` and the argument above it at `audio.js:15` are deleted, deliberately;
`setAmb()` joins `setSfx()`/`setMusic()`; and the settings handler at `ui-sheet.js:2767` stops being
a two-way `if (k === 'sfx') … else …` that would silently route a third key to `setMusic`. Three rows
in `renderSettings()`, and rename the existing *Ambient music* label — it will mean music only.

**What it might break.** `play()` returns early on `!prefs.sfx` *and* the bus gain is zeroed, so
effects are gated twice and the beds a third time — check all three read the right key. `openAmb()`
and `rampAmb()` both call `ambLevel()`, so a stale read leaves the bus open at the wrong height
behind a thunder crack. `06-audio-and-fx.md` documents the current mute behaviour in prose at lines
15–25 and the bus diagram at lines 10–12; both go false in the same commit.

**Not in scope tonight: the nature bed.** Birds, wind and rustling leaves are what the owner wants
the ambient channel *for*, and they are the reason to build the switch — but they are new content
with their own tuning, and a fix round that builds both will ship a channel nobody has heard on its
own. Ship the split, let the owner sit in a clear garden with the switch, then write the bed. When
it comes: `BUILD` is a table keyed by id and `loopNoise()` already shares one 4-second buffer, so a
`BUILD.nature` costs almost nothing structurally — but a bed that plays under *clear* skies is the
first one that never stops, and `ambTarget()` is written on the assumption that clear weather
carries no idle gain.

**Open question — CLOSED 2026-08-31.** ~~Three on/off switches, or three sliders?~~ **Both: a
slider per channel plus a mute**, the owner's call. What is left is a smaller decision the fix round
can make and write down — whether the six values share one saved shape
(`prefs.audio.{sfx,amb,music}.{level,muted}`) or sit as six flat keys. The nested form reads better
and costs nothing: `state.prefs` is merged onto the default object at `game.js:219`, so either shape
backfills correctly for every existing save.

---

### #4 · POLISH · The app icon is a yellow faceless flower, not the hero · annoying · reported 2026-08-31

**What the owner asked for.** "I added `01-flower-hero.png` into the art folder. I want to update our
App icon to look more like our Hero Flower and not just a random flower."

**Repro.** Add the game to a home screen, or look at `icons/icon-512.png`. Confirmed by eye against a
live screenshot of the garden (`.probe/garden-flower.png`).

**The gap, named.** The icon and the game's flower are not the same character:

| | The icon today | The talking flower in the game |
| --- | --- | --- |
| Petals | Yellow, layered rose-like bloom on an orange centre | Eight pink petals in a ring, `#ffb3d1` → `#ff5d95` |
| Face | **None** | A `#ffe9a8` disc with two eyes, pink blush and a smile |
| Stem | A short green stub | A `#4bb257` stem with two waving leaves |

**The face is the whole thing.** The owner's hero art and the What's New illustration
(`art/announcements/garden-year.png`) both lead with a pink flower that is *looking at you*; the icon
is a botanical drawing of a different plant. That is why it reads as "a random flower".

**The likely cause — nothing is broken, the icon simply predates the character.** `icons/icon.svg`
was authored on 2026-08-18 from the generic `round` petal path in `flora.js`, which is the shape used
for *planted seeds*, not for the hero. The hero has its own function and always has.

**The source to build from already exists.** `Flora.talkingFlower()` (`flora.js:205`) is the exact
SVG: eight copies of one petal path at `rotate(i × 45)`, a face circle at `r=26` fill `#ffe9a8`, two
eyes, `#ff9ec1` cheeks, the mouth path, a stem and two leaves, all on the `#2c1a10` ink. The two
gradients it references are at `flora.js:266` — `gp-talker` (`#ffb3d1` → `#ff5d95`) and `gface`. An
icon can be assembled from those numbers directly; no new art is needed.

**The trap that will bite a copy-paste, and it is silent.** `.tf-lid` is a `#ffd98a` rect drawn
across each eye at full size in the markup, and it is collapsed to nothing **by CSS**
(`style.css:1054`, `transform:scaleY(0)` with a blink keyframe). `icon.svg` is a standalone file with
no stylesheet, so pasting the markup verbatim produces **a flower with both eyes shut behind two
yellow blocks** — and it will look deliberate rather than broken. Drop the lids. This is the recorded
"a visual state must never depend on a keyframe having run" trap wearing new clothes.

**Related.**
- **The pipeline is documented and unchanged.** `23-installable-pwa.md:71` — `icons/icon.svg` is the
  source of truth and the three PNGs are rasterised from it with `qlmanage` and `sips`, commands
  given at lines 88–92. All four files ship; `icon.svg` is also the browser tab favicon, so it must
  be self-contained — inline both gradients rather than referencing the game's `flora-defs`.
- **The maskable safe zone is the real design constraint.** Doc 23 promises the artwork sits inside
  a centred circle of 40% radius so Android can crop to any mask. A face large enough to read at
  40 px *plus* a stem and leaves will not both fit — the stem is what gives. Whatever is decided,
  the doc's promise has to end up true or be rewritten.
- **Check it at 40 px, not at 512.** Same principle as the "check the bloom at 22 px" rule in
  `09-conventions.md` for Almanac art. Two eyes and a mouth at icon size is a tighter test than the
  petals are.
- **`art/01-flower-hero.png` must not become the icon.** Two reasons. It is a photoreal 3D render
  and the game's art direction is flat ink outline — doc 05 is the moat, and an icon that promises
  a render the game never delivers is a worse first impression than a plain icon. And the raster
  exception in `09-conventions.md` is explicitly `art/announcements/` **only**, "no other folder
  inherits this". As unloaded reference art next to the announcements folder it is fine and no rule
  is broken; wiring it into the game or adding it to `CORE` in `sw.js` would break one.

**Fix sketch.** Rewrite `icons/icon.svg` as the talking flower on the existing sky-and-turf
background: keep the `#7ec8f2` → `#e9f8ff` sky gradient and the turf path already in the file, swap
the yellow bloom for the eight-petal pink ring with the face, sized so the face clears the 40%
maskable circle. Inline `gp-talker` and `gface`. Then run the three documented commands to
regenerate the 512, 192 and 180. **What it might break:** nothing in the running game — `icons/` is
packaging and nothing loads it — but all four files are precached in `CORE` in `sw.js`, so an
installed app keeps the *old* icon until the worker updates; note that rather than chasing it.
`manifest.json` needs no edit, since the filenames do not change. `theme_color` and
`background_color` are both `#7ec8f2`, the sky the icon opens on, so keeping that sky keeps the
splash consistent.

**No open question.** The owner named the target and the source art for it is already in the repo.

---

## Fixed and pruned

*Nothing yet.*
