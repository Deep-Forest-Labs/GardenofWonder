# Audio and Game Feel

## Audio

Every sound is synthesized with the Web Audio API at the moment it plays. There are no audio files.

### Signal path

```
tone() / noise()  →  sfxBus (0.65)  ┐
                                     ├→  master (0.9)  →  destination
ambient music     →  musicBus (0.16)┘
```

Two buses so effects and music mute independently. Toggling a bus ramps its gain with
`setTargetAtTime` rather than jumping, to avoid a click.

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

### Ambient music

Off by default. A four-bar chord progression — `[0,4,7]`, `[-3,2,5]`, `[-5,0,4]`, `[-1,2,7]` —
scheduled on a 3.2 s `setInterval`. Each bar lays down a 3.4 s sine pad an octave down, plus a
six-note triangle arpeggio drawn from the same chord.

It's the only recurring timer outside the frame loop. It starts on demand and is never stopped —
muting only takes the bus to zero, so the scheduler keeps running. Harmless, but worth knowing.

## Visual effects

`fx.js` owns one full-screen `<canvas>` plus a DOM layer for floating text. The canvas sits behind
the interface and ignores pointer events.

The canvas is sized to `devicePixelRatio` capped at 2 — uncapped DPR on a 3× phone triples fill
cost for no visible benefit.

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

### Floating text

DOM, not canvas, because it needs the game font and outlined text style. `float(x, y, text, kind)`
appends an absolutely positioned element with a random horizontal drift, then removes it after
850 ms (1,100 ms for `big`). Kinds: `crit`, `big`, `gem`, and the rarity names.

### Screen shake

`FX.shake(power, time)` sets shake amount and remaining time, taking the **maximum** of current and
requested rather than adding, so simultaneous triggers don't compound into nausea. Each frame it
writes random offsets into `--shake-x/y/r` on `#game`, decaying to zero. Rotation is 9% of
translation magnitude. Fully disabled under reduced motion.

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
| Wonder Effect | — | rainbow burst + 5 confetti waves | 10 | `wonder` | banner | forced |

Rare harvests deliberately get no toast. At 20% frequency they generated constant notification
noise; stars and floating text carry the moment instead. Toasts are also capped at two on screen
at once, oldest evicted.

Mastery tiers follow the same reasoning one step further. Early tiers land every ten or so
harvests of a seed, which across eight plots is a toast every twenty seconds — so a tier only
toasts when it is genuinely rare: a seed's **first** tier, or a **gem-paying** fifth tier. Every
other tier gets the full Rare-tier juice on the plot itself — stars, ring, the `quest` sound, and
two floating texts naming the flower, the tier, and the new yield — and no toast. A gem tier does
not escalate to Epic or Legendary juice; the gem is in the toast body, not in more confetti.

This ladder is a design contract. If you add an event, place it on the ladder deliberately rather
than giving it maximum juice.
