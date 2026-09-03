# The Record Shelf — songs on Side A, charms on Side B

**Status: the spec, 2026-09-02 — ruled by the owner and pressure-tested before filing** (two
adversarial critics; five blockers folded in, among them three record grants that veteran saves
could never have earned and a charm that touched two banned tables — the reasoning and rejected
alternatives are in the 2026-09-02 record-shelf entry in [10-decision-log.md](10-decision-log.md),
filed with this spec). Where this spec is silent, the builder asks the owner. Every number ships
in `data.js`, remote-config-ready; PROVISIONAL numbers are tuning's to retune. Track files arrive
from the owner; **doc 48, the music-direction commissioning bible, is the music session's
deliverable** (this sentence becomes a link when it lands) — until it exists, the delivery
numbers in The Audio Machine below are normative.

**The sentence: *find a record, keep the song forever, and wear any charm with any tune.***

## What a record is

A collectible with two faces, equipped independently once found — the owner's own decouple, the
design's spine:

- **Side A — the song.** An audio track the player can put on. The synthesized house tune stays
  the default and keeps its weather rearrangements; a record is the player's chosen override.
- **Side B — the charm.** A small, categorical, permanent effect. One charm slot at v1. **The
  charm works with music muted, always** — power never coerces audio-on; the mirror rule holds
  (a song never requires its charm). Charm state never reads audio prefs or the audio module.
- **Rarity (common → rare → epic → legendary, the garden's four rungs) maps to the SONG's
  elaborateness and the find's ceremony — never to charm size.** A legendary with the biggest
  charm becomes the mandatory Side B and deletes the choice the decouple bought.

**Player-facing words: records, songs, charms.** Never "buff", never "mystery box". The
charm/"Lucky Charm" collision is real on two written surfaces — the shop card's short name and
the quest strip's "Buy Lucky Charm" — so the spike shows a charm card beside both and the owner
judges the wording in situ.

## Where records live — two doors, one shelf

The Almanac already runs two doors (the HUD book and the menu row — an open question in the log
that this spec makes a deliberate pattern):

1. **The gramophone, in the Hollow.** The Decorate stub becomes real: the gramophone is the
   room's first furniture, priced **in the ruled 2026-08-18 shape — keepsakes from TWO different
   creatures** (`DATA.records.gramophonePrice = { kinds: 2, each: 1 }`, PROVISIONAL), so
   furnishing the Hollow rewards roster breadth. This is the game's first memento SINK ever:
   `state.mementos` is a per-keepsake-id map, the named readers today are `mementoTotal`'s
   "...keepsakes kept" line, the per-kind held counts, and the suite's memento checks — each is
   re-verified against the decrement, and game.js's "nothing spends these yet" comment plus
   docs/22's twin sentences are rewritten in the same commit. The buy is once-ever, confirmed
   (the unlockAsk pattern), refund-free.
2. **The menu row.** A live row in the drawer: **id `records`**, label "Records", a **new
   `vinyl` glyph in icons.js** (named `vinyl`, not `record` — the reserved row's id is already
   `record` and the grep collision is not worth it), tint from the existing palette per the ROWS
   comment. **The reserved "Garden Record" row is relabelled "Garden Journal"** (its id `record`
   stays so nothing breaks) — two "records" cannot share one menu; the rename is the design
   desk's call, owner may veto at the spike. **No badge dot at v1**: the find was already
   celebrated by the moments dialog; if playtesters miss new records, the dot (joining
   `updateDot()`'s same-condition law) is the ready answer.

Before the gramophone is bought, the menu row still opens the shelf; the shelf's header shows
the gramophone as the next thing to want, advert-style, with its keepsake price.

## The shelf

A new sheet mode (`openSheet('records')`, registered per doc 09's add-a-sheet playbook: render
and titles maps, delegated `data-*` handlers, its own `syncAfford` branch — no existing kind
reads mementos, so the gramophone ask gets its own; the sheet covers the dock and carries its
own close). The equipped record spins at the top (Side A and Side B named); found records are
cards with name, rarity colour, song title and charm line; unfound records are **silhouetted
slots with `???` and one directional hint each** — doc 47's grammar *reapplied, not imported*:
the shelf writes its own masked-card CSS (the seed picker and Almanac maskings are two
independent implementations already, and the gauntlet caught them disagreeing once) and its own
silhouette — a flat-ink disc, `mysteryBloom`'s recipe but never its five-petal art, which would
be a lie on a record. If the shelf lands in a new `ui-*.js` file, index.html's script list and
`sw.js` CORE gain it with a VERSION bump, same commit.

**Equipping a song turns the music channel on** — a deliberate, player-initiated act is consent
to hear it: `prefs.music` flips true on equip with a toast saying so; mute and sliders respected
forever after. Ruled at spec time; owner may veto at the spike.

## The five v1 records — sources, songs, charms

All PROVISIONAL in charm sizing; the rules are not. Sources are **named, deterministic gifts**
(the K.K. lesson — a named thing at a rhythm, never a loot roll), each celebrated through the
moments dialog.

| Record | Rarity | Condition | Charm (candidate — `category` field unique per record) |
| --- | --- | --- | --- |
| The First Record | Common | First shelf open (via a `Game` API, latched by its own found flag — never at garden birth, where `birthCelebrate()` would swallow the moment) | *garden-ambience*: fireflies drift through the garden at night — and "night" here is the six-minute cycle's night, roughly every few minutes, not a daily beat; new FX work, with a reduced-motion static form |
| Pip's Record | Common | Any creature reaching full stars — Pip's is first | *boost-duration*: power-ups run a little longer (verified unsold; Pip keeps the party going) |
| The Almanac Record | Common | The 10-species Almanac milestone | *sky-ambience*: sunbreaks linger longer after rain (pure charm; zero economy — flagged: the duration is an owner-feel value, shown at the spike) |
| The Counter Record | Rare | Stand tier 3 | *stand-cadence*: the Stand's open slots refill a little sooner — applied at the WRITE sites through `charmEffect` (flat seconds off `STAND.refill`), so equipping mid-countdown does not retro-shorten; stated so nobody "fixes" it at read time |
| Holly's Record | Legendary | The first kept night in Winter | *daily-faucet*: one free power-up charge per local day (the daily quest's day-latch precedent; `state.recordDay` latches the grant; **must pass bill 1c** — nothing farmable by Turning) — dressed with the keepsake ribbon in the welcome-back telling |

**Grants are condition-latched sweeps, never edge-fired** — the pressure test's biggest catch:
a maxed creature never levels again, a claimed milestone never re-fires, and no stand-tier
event exists, so edge triggers would permanently lock out exactly the veteran playtest saves.
An **owed-records sweep** (`condition true && !state.records[id]` → grant through the moments
path) runs at load and after the relevant events. Winter's kept mark has **no emit** — the
builder adds the hook where `winterDeriveKept` first marks a cell, and a load-time derivation
on an old save must grant once and *queue* the moment, never show a dialog mid-boot. The test
bill's wording is exact: **each record grants at most once, whenever its condition first
holds — including on a save that crossed the condition before records existed.**

**The charm rules, each a sim-test:** no charm touches yield, growth stacks, gems, mutation
catch or payout, offline rate or hours, rarity weights, combo build or cap (combo feeds tap
yield AND the Tally's bestCombo arm — a combo charm died in the pressure test for exactly
this), or anything in the banned tables; every charm carries a `category` field in
`DATA.records` and no two records share one; chance-shaped charms are countdowns; all effects
flow through **one modifier function** (`Game.charmEffect(kind)`, the masteryMult pattern)
whose kind whitelist refuses unknown or banned axes by construction.

## Never sold, never rolled

**A record with a charm is never sold for money, ever** — a permanent charm is the forever-money
back door doc 37's first promise forbids; the golden seed's earn-or-buy shape does not transfer
(its payout is year-scoped; a charm never resets). Cosmetic-only records (song, no charm) may
join the decor-pack lane someday, as its own ruling. No record ever appears in a paid `???`
slot or a paid random pack, and no acquisition is missable or RNG-only.

## The audio machine

- **Files**: `art/music/`, one per record — **the fifth deliberate binary exception in doc 09's
  own numbering** — opus or m4a at ~96–128 kbps, **hard cap 2MB per file**, delivered by the
  owner (provenance is not a repo topic). Recorded in 09-conventions same commit. Normative
  until doc 48 exists: seamless loops of 60–120s, consistent loudness around −16 to −18 LUFS,
  and a **per-track gain trim in `DATA.records[].gain`** so a mastered file sits at the house
  tune's level through `HOUSE.music` — a full-scale file would otherwise be several times
  louder than the synth it replaces.
- **The service worker must not touch music.** `sw.js` intercepts every same-origin GET and
  copies `res.ok` responses into the versioned cache — iOS media Range requests (206) would hit
  its unhandled paths, and 10MB of tracks would sweep through the app cache on every VERSION
  bump. The fetch handler gains an explicit exemption (`/art/music/` → return, the browser
  handles media natively); that exemption is WHY the lazy-load claim holds. **Never in CORE.**
- **Playback**: one persistent media element created lazily inside audio.js's IIFE (a second
  `createMediaElementSource` on the same element throws — src swaps only), routed
  **element → trackFilter (lowpass) → trackGain → musicBus** so sliders and mute reach it —
  and the trackFilter is driven by the standing weather's ARRANGE `lp` value, a deliberate NEW
  behaviour ruled here: the record wears the sky's dress the way the house tune does, in its
  cheapest form (one filter, no per-dress chains). Owner may veto at the spike (the
  alternative: records play undressed under weather).
- **The API contract**: `Sound.playTrack(url, {loop}) → Promise` (rejection = the caller falls
  back to the house tune with a quiet toast — a missing or still-pressing track is never an
  error); an internal `trackActive` flag consulted by `setMusic`/`startMusic` so the scheduler
  and a record are mutually exclusive (today `setMusic(true)` unconditionally restarts the
  house tune); **mute PAUSES the element** — a muted media element otherwise plays silently
  forever, burning battery and seizing the iOS lock screen with silence; and a
  `visibilitychange` resume hook (none exists for audio today — after iOS backgrounds the tab,
  the element stays paused while sfx self-heal), owned by audio.js or wired from ui.js's
  existing handlers. audio.js keeps its knows-nothing-about-the-game contract: callers pass
  urls and ids.
- **iOS is the platform of record**: gesture unlock, backgrounding, loop-seam clicks on
  compressed audio — the gauntlet's phone listening item covers looping on the handset, playback
  inside the installed PWA (media through this origin has never been tried), and the lock
  screen showing nothing while muted. If the file's loop flag clicks at the seam, the
  WebAudio-buffer route (decode once, loop sample-accurately) is the fallback, memory cost
  weighed.
- **The build does not wait on music**: engine, spike and surface all proceed; the shelf ships
  its cards with songs marked "still being pressed" (playing the house tune) until each track
  file lands, starting with the First Record's.

## The gramophone in the room

The flag is a new top-level key (`state.gramophone`); `hollow.js` keeps its
knows-nothing-about-the-game contract, so the owned state reaches the art as an opt on
`Hollow.scene()` (or as a DOM overlay placed like the pets); and **the purchase invalidates the
scene cache** (`sceneSky`) so the furniture appears the moment it is bought — `syncScene()`
only redraws on sky changes today.

## Save, partition, and plumbing — doc 47's checklist, copied and extended

New top-level keys: `state.records` (found flags), `state.recordSong`, `state.recordCharm`,
`state.gramophone`, `state.recordDay` (Holly's day latch). Each: `defaultState()`, individual
`load()` re-merge with unknown ids dropped, **SURVIVES** (bill 1's completeness check enforces
it), never `HARVEST_WRITES`, doc 07 rows same commit. **Plus the catch the pressure test
found: `load()` rebuilds `state.celebrated` from a whitelist that knows only `seed:` and
`upgrade:` namespaces — it gains the `record:` namespace, or every record's find celebration
replays on every reload**; a test asserts a celebrated find stays celebrated across save/load.
The moments machinery: `pendingMoments()` gains a records loop, `ui-news.js` a
`recordMoment()` builder beside its seed/upgrade twins (the kind ternary becomes a map) — two
files, three edits, not a registration. No v1 record can be pending at garden birth
(`birthCelebrate()` would swallow it); the source assertions keep it that way.

## Coordination — checked 2026-09-02, re-verify at kickoff

**The curtain pass has landed** (gauntlet closed, owner's live playtest committed) — the moments
machinery, `state.celebrated` and the `???` grammar are on main; the dependency is met.
**Tonight's fix round DOES touch this spec's files**: `#23` rewrites audio.js's three music
schedulers ("do this first" in the round) — **rebase `Sound.playTrack` on the post-#23
scheduler shape**; `#21` adds an icon to icons.js and re-runs the exporter; `#12` touches glyph
sizing rules. `tools/capture-screens.js`'s **the-menu scene asserts exactly 7 drawer rows and
its caption says "Four rows built, three reserved"** — the new row makes 8: the expect and
caption are edited and the gallery rephotographed (a loud failure otherwise, which is the tool
working); the-hollow's scene re-shoots if the gramophone enters its frame. Winter landed;
Holly's hook is added, not found. `git fetch` and the decision log's top at kickoff, as ever.

## The test bill (asserted, sabotaged, then believed)

1. Records, equips, gramophone and day-latch survive `turnYear()` verbatim — SURVIVES,
   completeness green, none in `HARVEST_WRITES`.
2. `charmEffect` refuses unknown and banned kinds by construction (NO-side assert); every
   charm's `category` unique; chance charms countdown-shaped.
3. Charms never read audio state; every charm effect identical with music muted.
4. **Grants: at most once, whenever the condition first holds** — including a fixture save
   that crossed each condition before records existed (the owed sweep), and a load-time Winter
   derivation that grants without a mid-boot dialog.
5. The gramophone charge: once-ever, confirmed, refund-free, two different creatures'
   keepsakes; the named memento readers stay truthful after the first decrement in the game's
   history.
6. Holly's daily charge passes bill 1c: not farmable by Turning, one per local day, latch
   survives save/load.
7. A celebrated record find never replays across save/load (the `record:` namespace in the
   celebrated re-merge).
8. Fallbacks: equipping with the track missing resolves to the house tune, no throw;
   un-equipping restores the house tune and its dresses; `setMusic(true)` with a record
   equipped resumes the record, not the scheduler.
9. Suite byte-identical across runs; **not one economy number moves** (the snapshot diff
   guard, reused).

**Named browser items**: the shelf's three card states and its own masked CSS; both doors
opening one panel; the equip flow; music flipping on at equip with the toast; mute pausing the
element (lock screen empty); backgrounding and returning resumes; the loop seam on the
handset and in the installed PWA; the trackFilter dressing under rain; fireflies' reduced-
motion form; the vinyl icon at row size and in the exporter manifest.

## The gates, in order

1. **The wireframe spike** — `tools/records-spike.html`, then STOP for the owner: the shelf
   (equipped header, found cards, `???` slots with hints), the gramophone in the Hollow with
   its two-keepsake ask, the menu with the Records row, vinyl icon and the renamed Garden
   Journal beside it, the equip flow, the find-moment, and **every charm's player-facing line**
   — the owner rules on charm copy here, plus the four veto-flagged rulings: the Journal
   rename, equip-flips-music-on, the record wearing the sky's dress, and no badge dot at v1.
2. **Engine**: state, the owed sweep, `charmEffect`, the test bill green — live game unchanged.
3. **The audio machine**, behind the same flag: playTrack contract, the sw exemption, gain
   trims — verified on the handset before the surface ships.
4. **The surface**, faithful to the spike; the icon exported (`node tools/export-icons.js`,
   same commit); capture scenes edited and regenerated.
5. **The gauntlet** (doc 34): invariants, visual fidelity, the grammar critic (a record card
   reads as this game's object; charm copy glossary-plain), **the phone listening item**,
   reduced motion, scope. Then the owner's verdict and the five-minute phone script.

## Docs made true in the same commit

Doc 32's glossary gains three rows (drafted in the decision-log entry — records, songs, charms)
and **widens "The ??? rows" to cover more than seeds**; doc 30's never-resets list names
records, songs and charms; doc 07 the five keys; doc 09 the fifth exception; doc 22 the
record-gift line and the rewritten nothing-spends-mementos sentences; doc 45's authored Part 2
gains the `art/music/` class; doc 46 a line for Holly's hook; the wiki-sync DESC/title rows for
this doc; the changelog line when the surface ships; HANDOFF; wiki-sync last.
