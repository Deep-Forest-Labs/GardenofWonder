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
2. **#8 · The gem skip chip counts down every second on eight plots** — the cheapest fix on the
   list: delete half a template string. Note it **reverses a logged decision**, so it owes a new
   decision-log entry and an amendment to a `docs/11` item.
3. **#4 · The app icon is a yellow faceless flower, not the hero** — very high value for the
   effort: rewrite one SVG from a function that already exists, run three documented shell
   commands. It shares no file with anything else here, so it can run alongside the audio work
   rather than behind it.
4. **#6 · Fall's board sits 23px high and its flower is 73% the size** — the season swipe is the
   game's signature move and it visibly jumps. Both causes measured and named; one `style.css` fix
   plus a glow element.
5. **#7 · Fall's windfall needs a Collect All and its pill moved above the board** — **pair this
   with #6**: the 46px margin causing #6's offset exists only to hold the pill this item moves, so
   two sessions solving them apart will fight over the same space. Needs a new getter and an atomic
   harvest-all in `game.js`.
6. **#5 · No cheat jumps ahead Turns** — the owner cannot reach the season gates to test them.
   Dev-panel only, touches no player surface. **Read the item first**: it will not show anyone a
   Spring garden, because there is not one.
7. **#1 · The Thunderstorm's bed has no rain in it and never moves** — a flat mid-low roar for a
   minute. Contained to `audio.js` and one `data.js` knob, no layout, no new surface.
8. **#2 · A standing sky pays the player and nothing on screen says so** — a chip and a timer in
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

### #5 · POLISH · No cheat jumps ahead Turns, so the season gates cannot be reached · annoying · reported 2026-08-31

**What the owner asked for.** "Add some new cheats that allow players to get to different states in
the game… we're trying to test all the different seasons or turns in the game. I want to be able to
get to spring and winter, so we need to be able to cheat and get to different turns or jump ahead
turns."

**Repro.** Developer tools → *The Garden Year* has one Turn button: *Run the Turn*. Reaching Turn 6
means driving a year's earnings and running the ceremony six separate times.

**Read this before building it: Spring and Winter are not there to be tested.** `ui.js:867` declares
the season table with `built: false` on both, and `seasonReady()` is `built && turned`. So a cheat
that lands the owner on Turn 6 opens the *gate*, and behind the gate is the gate — the plate simply
changes its line from "Opens at Turn 6" to **"Still growing in"** (`showGate()`, `ui.js:912`). That
string exists precisely for this case. Spring and Winter are slices C and E in
`32-the-garden-year.md` and no garden has been written for either. **The cheat is still worth
building** — it reaches the Turn ceremony repeatedly, the plot gate at `plotTurnGate`, Fall opening
at Turn 1, the seed unlock ladder, and the gate copy flipping, which is real testable content — but
it will not show anyone a Spring garden, because there is not one.

**The likely cause — nothing is broken, the cheat was never written.** `Game.Dev` (`game.js:4024`)
has `driveYear(coins)`, `projectTurn()` and `runTurn(blessedId)`, and the panel wires them at
`ui-sheet.js:2281`. Everything needed for a jump exists; nothing loops it.

**The trap, and it is arithmetic — a naive loop stalls at Turn 4, two Turns short of Spring.** The
Turn has two gates (`turnReady()`, `game.js:3686`): this year's `coinsEarned >= minCoins` (100,000)
**and** the un-tallied mint increment `>= minSeeds` (10). The mint is cumulative —
`0.1 x sqrt(lifetimeCoins)` minus what has already been drawn (`projectedMint()`, `game.js:3674`) —
so each Turn needs `sqrt(lifetime)` to have risen by another 100, and a loop that credits a flat
`minCoins` per year gives a shrinking increment:

| Turn | increment on a flat 100K/year | |
| --- | --- | --- |
| 1 | 31.6 | ok |
| 2 | 13.1 | ok |
| 3 | 10.1 | ok — Winter's gate, and it clears by 0.1 |
| 4 | **8.5** | **stalls, `turnYear()` returns `null`** |

**Winter is reachable by luck and Spring is not**, and the failure is silent: `turnYear()` returns
`null` and a loop that ignores the return value reports success having done nothing. The fix is to
credit **until `turnReady()` is true** rather than a fixed amount — which needs about 719K lifetime
coins to reach Turn 6, and about 160K in the sixth year alone.

**Related.**
- **The dev-cheat playbook forbids the shortcut.** `09-conventions.md` says a cheat must "force the
  real code path", so this loops `turnYear()`; it does **not** write `state.year.turnsCompleted`
  directly. Writing that field would open Fall, the plot gates and both season gates while Saved
  Seeds, `mintedBase` and `year.number` all disagree with it — a garden in a state no player can
  ever be in, which is worse than no cheat.
- **A Turn wipes the garden, and six Turns wipe it six times.** `turnYear()` clears upgrades,
  `boostInv` and the tap ladder, and regenerates every Stand slot (`game.js:3760`). That is correct
  — it is a prestige — but the owner should expect to land on a bare Turn-6 garden with Saved Seeds
  banked, not a loaded one.
- **The ceremony will NOT fire six times.** Worth stating, because it is the obvious fear:
  `Game.on('turn')` in `ui-events.js:497` only calls `renderSeasonEdges()`. The five-beat ceremony
  is a sheet the player opens from the dock, so an engine-side loop runs silently. No suppression
  needed.
- **The gate copy is the one thing a jump makes newly visible.** `showGate()` picks between
  "Opens at Turn N" and "Still growing in" on `seasonTurned()`, and the second branch has never been
  reachable in normal play. Look at it while you are there.

**Fix sketch.** `Game.Dev.jumpTurns(n)`: loop n times, and in each pass credit through the real
`credit()` in a small loop until `turnReady()` is true, then call `turnYear(blessId)` with the same
"cheapest flower whose Rich Bloom has room" pick the panel already uses (`ui-sheet.js:2411`). Bail
out and return the count actually completed if `turnYear()` returns `null`, so a stall reports
itself rather than lying. Then a dev row — *+1 Turn*, *+3 Turns (Winter)*, *+6 Turns (Spring)* — with
each button's label naming the season it opens, and a sim-test asserting a jump to 6 leaves
`turnsCompleted === 6` and that nothing leaks into an unforced run, per the playbook's step 5.
**What it might break:** `credit()` is the mint's single faucet and cheat grants normally carry
`{ cheat: true }` so they never reach it (`data.js:349`) — this cheat must deliberately **omit** that
flag, exactly as `driveYear()` does, or the pool never grows and the loop spins forever. Cap the
inner credit loop. `saveNow()` runs once per Turn, so six jumps are six writes.

**Open question, already answered by the code but worth the owner hearing it.** Reaching Turn 6
shows a locked plate, not a Spring garden. If what is actually wanted is *Spring and Winter to
exist*, that is slices C and E of the build plan, not a cheat — and it is a much bigger ask than
this item.

---

### #6 · BUG · Fall's board sits 23px high and its flower is three-quarters the size · annoying · reported 2026-08-31

**What the owner saw.** "The gardens need to be perfectly lined up in terms of placement when
scrolling through the different seasons. If I'm on the main garden and I swipe to go to fall, I
notice that the garden is higher on the screen… Another example of visual fidelity is that the
flower in the center is not the same size as the flower in the garden. The fall flower isn't the
same size; it's like a smaller version of it."

**Repro.** Turn once so Fall opens, then swipe from the garden to Fall and watch the board jump.
Driven headlessly and measured:

```
node tools/probe.js wait:900 tap:#newsOk wait:600 \
  'eval:(()=>{Game.Dev.driveYear(400000);Game.Dev.runTurn("daisy");return Game.fallOpen();})()' \
  'tap:[data-season="fall"]' wait:1400 shot:fall
```

**Measured, both at 390×844.** Two separate faults, both confirmed:

| | Summer | Fall | |
| --- | --- | --- | --- |
| Frame (`.garden-frame` / `.fall-frame`) | top 157, h 507 | top 157, h 507 | identical |
| Board | top **226**, 370×370 | top **203**, 370×370 | **23px high** |
| Centre cell | 110×110 | 110×110 | identical |
| The flower's rendered `<svg>` | **130 × 166** | **95 × 103** | **73% the width** |

**Cause 1, the 23px — an odd margin halved by a centring grid.** `.fl-wrap` carries
`margin-bottom:46px` (`style.css:4110`). Both frames are `display:grid; place-items:center` over the
same 507px box, so a bottom margin on the centred child shifts it up by **half of it — exactly the
23px measured**. The margin is not stray: it reserves the room for the *"Fill all 8 for +50%"* chip,
`#fallChip`, which measures 6px below the board's bottom edge. Delete the margin and the board lines
up but the chip lands on the lawn or under the dock.

**Cause 2, the flower — a specificity collision, not a chosen size.** `Flora.talkingFlower()` returns
`<svg class="talker">`, and `.talker` is sized `width:118%; height:118%` (`style.css:1040`). In Fall
the same SVG is wrapped by `.fl-flower`, and `.fl-flower svg{width:100%;height:auto}`
(`style.css:4103`) is specificity (0,1,1) against `.talker`'s (0,1,0) — so **the later, more specific
rule silently wins and the 118% overscale never applies**. On top of that `.fl-flower` is itself
`width:86%` of the cell (`style.css:4102`). The two compound: `0.86 × 1.00` in Fall against
`1.00 × 1.18` in Summer, which is the 95 against 130 on the ruler. Nobody chose 73%; it fell out.

**Related.**
- **Fall's flower has no glow.** `.flower-glow` — the pulsing radial halo at `style.css:1017` — is a
  sibling element built into Summer's flower cell. `ui-fall.js:50` builds only the button, so Fall's
  centre has no halo at all. That is the same complaint as the size and belongs in the same fix.
- **Most of what differs between the two boards is deliberate.** Fall's planter is a darker gradient
  with a crosshatch weave at ±52° against Summer's single 96° pass, and its stubble fringe is
  `#7d8b40` rather than `var(--grass-d)`. Both carry the same 4px ink border, the same 26px radius
  and the same `0 9px 0` lip. **"Same visual fidelity" should mean the two faults above, not
  repainting Fall as Summer** — a season is allowed its own palette. Worth the owner confirming.
- Touches the recorded trap that a `box-shadow` state modifier deletes the base lip — `.fl-board.armed`
  already restates its whole stack for that reason (`style.css:4006`). Don't undo that while in here.

**Pair this with `#7`.** That item moves the chip out from under the board, which is the only
reason the 46px margin exists — but it also adds a Collect All button below. Same geometry,
same session.

**Fix sketch.** For the offset: make `.fl-wrap`'s box equal the board so the two frames centre the
same content box, and hang the chip off it without adding height — `.fl-wrap` is already
`position:relative`, so absolutely positioning `.fl-chip` below the board and dropping the
`margin-bottom` is the smallest change that keeps the chip where it looks right. For the flower:
raise `.talker`'s sizing above `.fl-flower svg`, or better, give Fall's flower the same
cell-filling button Summer uses (`width:100%;height:100%`) and let one rule own the 118% for both —
then add the glow element. **What it might break:** the chip is measured or positioned by
`ui-fall.js`, so check there before moving it; the 46px was also doing the work of keeping the chip
clear of the dock on a short viewport, so re-check the ~640px case from the conventions checklist.
Growing Fall's flower by a third puts it closer to the four `.fl-plot` cells around it — confirm it
does not overlap what it sits between, since `.fl-flower-cell` is `overflow:visible`. Run
`node tools/style-check.js`; this is a `style.css` change.

**Open question.** Should the two boards match beyond position and flower size — same planter
colour and weave — or is Fall's darker autumn planter deliberate? Read here as deliberate, and left
alone.

---

### #7 · POLISH · Fall's windfall has no payoff moment, and its pill is under the board · cosmetic · reported 2026-08-31

*Severity understates this one. Nothing is broken — it is a feature the owner asked for, and its
value is that it is the payoff of Fall's only rule. Ordered high in the round on that basis.*

**What the owner asked for.** "The button that says that has the star, and it says 'Eight still pay'
or 'Pays 50%'. I think we should have that be a 'Collect All' button once it's got its bonus applied…
A player can still tap each one exactly how it is and have seven still pay plus 50%, but they could
hit a 'Collect All' for X value. They then have something that says '50% bonus applied'… a way for
the player to feel like, 'Boom! They completed a challenge.'… I also think we should move that little
bonus pill above the garden and have it as a pill that's just informative… We could add that collect
all button below it once it's available."

**The owner's read of the mechanic is correct.** Picking the bed plot by plot still pays +50% on
every plot, because the promise is a per-cell mark rather than a live clock reading — `checkFallWindfall()`
marks every eligible cell once per fill and refuses to mark again while any mark is unspent
(`game.js:3579`). That is why the chip can honestly say "**7** still pay **+50%**". A Collect All is
therefore a *convenience and a celebration*, not a new payout rule, and nothing in the economy moves.

**What exists today.** `#fallChip` (`renderBedChip()`, `ui-fall.js:168`) is a **`<div>`, not a
button** — six states of pure text, from "Fill all 8 for +50%" through "One more in 4m" to "The whole
bed — +50%". It sits below the board and nothing can be tapped. Harvesting is one tap per cell
(`ui-fall.js:279`), each firing its own coin burst, float, `crit` sound and haptic. Eight of those in
a row is eight small pops where the owner wants one big one.

**Do this together with `#6`, or do this one first.** The two are the same piece of geometry. `#6`'s
23px board offset is caused by `.fl-wrap{margin-bottom:46px}` (`style.css:4110`), and that margin
exists for **exactly one reason: to reserve the room under the board for this chip.** Move the pill
above the board and the margin has no job left — which fixes `#6` for free — but adding a Collect All
button below re-creates the need for room underneath. Two sessions solving these separately will
fight each other over the same 46px.

**The traps.**
- **A button that appears only when armed will shift the board at the moment of triumph.** It lands
  in a `place-items:center` grid, so a new row below grows the wrap and slides the board up — a jump
  at the exact instant the player is looking at it. Reserve the row, or position the button
  absolutely against `.fl-wrap`, which is already `position:relative`.
- **The total must come from `game.js`, not be summed in the UI.** `09-conventions.md` is explicit:
  the `ui-*` files never do economy math. The label needs the value *before* the tap, so the existing
  dev cheat's approach — sum `r.payout` after harvesting (`ui-sheet.js:2455`) — cannot be copied.
  This needs a real getter, `Game.fallBedValue()` or similar, returning the marked plots' total with
  the windfall applied.
- **Harvest-all belongs in `game.js` and should be atomic.** Looping `Game.fallHarvest(i)` eight
  times fires eight `credit()` calls, eight saves and eight `currency` emits. `turnYear()` is the
  house pattern for "one commit, never half-happens" (`game.js:3691`); a `Game.fallHarvestAll()`
  should follow it and return one payload the UI celebrates once.
- **One celebration, not eight.** Eight stacked coin bursts, floats and `crit` sounds is noise, and
  the toast cap is two (`ui.js`). Place the new beat deliberately on the ladder in
  `06-audio-and-fx.md` — this is the biggest moment Fall has, so it should read above an ordinary
  windfall plot, and it needs its own entry rather than eight copies of the old one.
- **A new tappable thing in Fall must join `noSwipe`** (`ui.js:708`) or a tap that drifts a few
  pixels is read as a season swipe and the player leaves Fall instead of collecting. `.fpill` and
  `.fround` are already listed; the new button has to be too.
- **The Century Bloom is outside the bed in both directions** (`game.js:3532`): it does not block the
  windfall and it does not collect it. The existing dev cheat loops all eight cells and *would* take
  a ripe Century Bloom. Collect All must decide this deliberately — see the open question.

**Fix sketch.** Split the one chip into two things. Above the board: the informative pill, keeping
all six of `renderBedChip()`'s states verbatim — it is already good copy and it is the whole rule as
one object. Below the board: a real `<button>` shown only while `bedState().marked > 0`, reading
`Collect all — +{value} (50% bonus applied)`, wired to a new atomic `Game.fallHarvestAll()`. Drop
`.fl-wrap`'s `margin-bottom` and let the pill above and the button below balance the board, which
settles `#6`'s offset in the same pass. **What it might break:** `renderBedChip()` writes through a
`dataset.sig` cache and toggles `.fl-board.armed`; splitting the element means two signatures, and
the `armed` toggle must keep firing or the board stops announcing itself across the room. The chip's
`armed` and `close` classes carry styling that will need re-homing. Run
`node tools/style-check.js`, and add sim-test coverage for `fallHarvestAll()` — at minimum that it
pays exactly what `fallBedValue()` promised, and that it leaves the Century Bloom alone if that is
the ruling.

**Open question for the owner.** Should Collect All take a ripe Century Bloom too? It is deliberately
outside the bed — it neither blocks nor collects the windfall — so the consistent answer is that
Collect All leaves it standing and the player picks the showpiece themselves. That is the reading
recorded here unless the owner says otherwise.

---

### #8 · POLISH · The gem skip chip counts down every second on eight plots · annoying · reported 2026-08-31

**What the owner saw.** "On each flower in the garden, in the top right corner, there's a gem icon
that allows the player to tap the gem to speed up the time and immediately collect their harvest.
Remove the timer that spawns that shows how many seconds are counting down. Just show the gem and
how much it costs. The reason why it's a little distracting" *(message ends there; the ask is
unambiguous and needs no clarification)*.

**Repro.** Plant anything and watch the chip in a plot's top-right corner. It reads
`💎 3 · 13m`, and inside the last minute before ripeness the wait re-renders **every second** — on
up to eight plots at once, at exactly the moment the player is watching the board.

**The likely cause — display only, one string.** `renderPlots()` builds the label as
`` `${fmt(skipGems)} · ${skipWait(skipLeft)}` `` (`ui.js:172`). Dropping the ` · ${skipWait(...)}`
half leaves the gem glyph and the price, which is exactly what was asked for. `skipWait()`
(`ui.js:128`) renders minutes above 60s and **seconds below it**, which is where the per-second churn
comes from. The price itself is far calmer: `skipCost()` is `ceil(remaining / skipSecondsPerGem)`
with `skipSecondsPerGem: 30` (`data.js:136`), so it steps once every thirty seconds rather than
every one.

**Related — this reverses a logged decision, and the fix must say so.** The wait was added
deliberately on 2026-08-30, in the sweep that put a real number on every surface: *"A gem skip named
a price and never the wait it deleted"* (`10-decision-log.md`, the phase-3.8 entry). `Game.skipSaving()`
was written for this one label — its own comment at `game.js:4599` says `skipCost()` "derived the
second number and threw it away, so the chip could only ever say a price." **The owner is overruling
that from live play**, on a cost the sweep did not weigh: one chip explaining itself is informative,
eight ticking at once is noise. That is a legitimate reversal, but it is a reversal — it needs its
own dated entry in `10-decision-log.md` recording that the owner overruled it and why, not a silent
deletion that leaves the old entry standing and contradicting the game.

Also related:
- **It part-fixes a filed known issue.** `11-known-issues.md:311` — *"In landscape the gem skip chip
  hangs off its plot… the wait it now carries makes it worse."* Removing the wait removes the "makes
  it worse" half. The chip still overflows in landscape on its own (a 34px chip on a 31px tile), and
  landscape is still unsupported, so **amend that entry rather than deleting it**.
- **The CSS comment above `.skip-chip` becomes false.** `style.css:590` reads *"The price and the
  wait are one fact, so they never wrap apart"*, justifying `white-space:nowrap` and the `max-width`
  clamp. With the wait gone that reasoning no longer holds. The clamp is probably still worth keeping
  for the landscape overflow above — but the comment has to be rewritten to say the true reason, per
  the house rule that comments explain why.

**Fix sketch.** Delete the wait from the visible label at `ui.js:172`. **Keep it in the
`aria-label`** at `ui.js:176` — "Finish now for 3 gems, saving 13 minutes" is the accessible
description of what the button does, it is spoken on demand rather than flickering on screen, and
the owner's complaint is about visual noise. That also keeps `Game.skipSaving()` alive and in use,
which avoids the recorded trap about removing a method from `Game` and leaving a `ui-*` caller
behind. While in there, the render cache can relax: `c.skipLeft` (`ui.js:166`) exists to detect the
countdown changing and no longer needs to be part of the key, so the outer branch stops firing once
a second per plot — a small win for the every-frame budget the perf rules in `09-conventions.md`
care about. **What it might break:** very little — the `data-skip` attribute driving
`.plot[data-skip] .skip-chip{display:inline-flex}` and the affordability tint at
`style.css:587` is set in the same block, so keep that write when trimming the cache. Verify at
390×844 with several plots growing and at least one inside its final minute, which is the state that
shows the churn.

**No open question.** The ask is specific and the reversal is the owner's to make.

---

## Fixed and pruned

*Nothing yet.*
