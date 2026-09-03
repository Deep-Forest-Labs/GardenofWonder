# Music Direction — the records, and how to write one

**Status: a commissioning document, 2026-09-02 — the brief the garden hands to any musician who
writes a record for it, and the delivery rules every track is checked against.** The records
feature itself is specified in [49-the-record-shelf.md](49-the-record-shelf.md), ruled by the
owner the same day: where the shelf lives, how each record is found, what a record's two sides
are. This document is the music half of it — what a record must sound like and how a finished
track arrives — and its delivery specification supersedes the interim numbers in doc 49's audio
section. What the shelf rules and the music leans on is cited where it is leaned on; what the
owner has flagged for veto at the spike — the mock-up pass the owner reviews before anything is
built — is marked *owner may veto*, and the handful of things still open are marked
**PROVISIONAL**. The build that adds the
first file logs the audio-file exception in [09-conventions.md](09-conventions.md) — this
document describes the files; it does not grant them. Its companion is
[06-audio-and-fx.md](06-audio-and-fx.md), the sonic world every track sits inside; the world's
words are the glossary in [32-the-garden-year.md](32-the-garden-year.md); Holly is in
[46-the-night-shift.md](46-the-night-shift.md). Its two readers are a musician who has never seen
the game and an owner who is not a musician, so every musical word is glossed on first use.

**The sentence:** *music for a garden you are half-watching — the record is the last thing you
hear, and you should not notice it end.*

## 1. The sonic identity

The place first. Garden Wonder is a single-screen idle garden on a phone: tap a talking flower for
coins, plant seeds in eight plots, harvest, swipe through a **Year** of four seasons — Summer in
seconds, Fall in hours, Winter in days, Spring the long game — and **Turn** the year to start
again. Under the garden is **the Hollow**, where the creatures who moved in live; villagers queue
at **the Stand** with orders; **the Almanac** is the collection track. It is played a few minutes
at a time, half-watched, on a phone speaker.

A **record** is a collectible found through play, with two faces the player wears independently:
**Side A is the song** — the track this document commissions; **Side B is the charm**, a small
permanent effect that is doc 49's business and works with the music off. One song each, rarity
Common → Rare → Epic → Legendary, five in the first version. **Music is off by default.** A player
who switches it on with no record on hears the game's own house tune, and a player who never touches
Music hears no music at all — only the flower's hum at Wonderfall, which lives on Ambience; putting
a record on is what switches Music on for a player who never had it on (doc 49). The house tune
stays the default for everyone who never puts one on.

**Warm, sparse and unhurried.** Warm means rounded tones with soft beginnings — a felt piano (a
piano with a strip of cloth laid between hammers and strings, so every note begins soft), a music
box wound slowly, a celesta played gently (a small keyboard of struck metal plates: bells with the
edges taken off). Sparse means air between the notes, room for the garden's own sounds. Unhurried
is a number: **60 to 90 beats a minute** (a beat is the pulse you tap a foot to; the tempo is how
many of them fit in a minute; 60 is a resting heart, 90 an easy walk). The house tune sits at 75
and the first record sits beside it.

**Major and pentatonic-leaning, in or around C — the house palette is the white keys.** *Major* is
the bright, settled family of keys; *pentatonic* is a five-note scale, here C, D, E, G and A, the
notes a child finds first on a piano. It matters because **the taps and the harvest runs the game
already makes are pitched on those five notes**, from middle C (the C in the middle of a piano
keyboard) upward, and they land on top of whatever is playing; the runs that are not — the
plot-unlock fanfare touches F, the bee swarm's buzz alternates D and F, and the seven-note run that
celebrates a big find is a G-major arpeggio (a chord played one note at a time) with a B in it —
still stay on the white keys. So every track is in C major or in one of the *modes* — the moods you
get by starting the same seven white notes elsewhere: A minor (the sadder, colder end), F Lydian
(the brightest, slightly floating end — in passing only: its held B sits a semitone under the taps'
C, see the Almanac's brief), G Mixolydian (folk-bright, a little rustic), D Dorian (cool and even).
No black notes as harmony (the chords held under a tune), no key changes: off the white keys the
taps sound wrong.

**Instrumental only.** The garden has exactly one voice — the Summer flower hums three short
phrases across the start of Wonderfall, the rare golden sky that is the game's biggest moment —
and a second voice would be a second creature claiming
to be the garden: no singing, no words, no wordless line. **No percussion-forward passages.**
Drums say *now*; nothing here is ever *now* except a tap, whose streak already climbs its own
melody.

**Nothing that demands attention.** No build to a peak, no big chord, no sudden silence used for
effect, no hook that begs to be hummed. A track that asks to be listened to has misread the room;
one that can be forgotten and found again, still going, has understood it. Each record is a
**loop** — it joins its own beginning without a seam — and may play for an hour, so write a tune
that can go round forever because it never arrived anywhere.

## 2. How a track sits under the game

**Music is the quietest thing in the game, by design.** Three channels the player can reach —
Sound effects, Ambience, Music — each with a level and a mute; house levels 0.65, 0.36 and 0.16,
and a player's slider multiplies the house level and never replaces it. A record is delivered at
the loudness target in section 4, not turned down, and the game turns it down: do not turn it
down in the file, or the slider has nothing left, and do not write louder to compensate, because
a loud, squashed file only sounds worse turned down. Over it, the taps arrive whenever the thumb
says so and the beds hang as long as a sky does:

| Over the record | Channel | What it is | Where it sits |
| --- | --- | --- | --- |
| The taps | Effects | A two-note ping that climbs the five notes as a streak grows | From the octave above middle C (an octave is the distance from one C to the next) to the A a sixth over the next; short, bright, constant while the thumb is down |
| The runs | Effects | Harvests, unlocks, claims and fanfares: short rising runs on the white keys, mostly the five notes | From middle C to about two octaves and a fifth over |
| Rain | Ambience | A wide soft hiss with a narrow band of patter, breathing on a slow cycle | Broad; the patter near the top of the voice range |
| The storm | Ambience | Rain's bands, darker, plus a low roll underneath | The roll between about 160 and 620 Hz (hertz: cycles a second, how pitch is measured) — from the E just below middle C to a little over an octave above it, the band a melody's lower half lives in — and a quieter layer under 190 Hz that the phone does not pass |
| The aurora | Ambience | Three high held tones over one low anchor an octave below middle C, spread wide, each shimmering at its own rate, with chimes sprinkled from two octaves over middle C upward, each with a quieter shadow an octave below it — deliberately the prettiest sound in the game | The anchor an octave under middle C; the three tones from the E above middle C to the G an octave and a fifth up; the chimes above everything |
| Wonderfall | Ambience | A wider chord than the garden ever uses, a low drone (one note held throughout), a high note falling every few tenths of a second | Everywhere; meant to be the loudest thing that has happened all day |
| The flower's song | Ambience | Three seven-note hummed phrases, each sung once, spaced across the sky's first twenty seconds | An octave above middle C, climbing to the C — in the third phrase, the D — two octaves above it; the one voice, and it takes the melody when it sings |

**So a record keeps a steady, even harmony that any of C, D, E, G or A can land on at any moment.**
The white keys nearly guarantee it, with one care: F and B are white keys and welcome in a melody,
but a held F or B in the octave above middle C, where the chimes ring, rubs against them — F against
E, B against C, a semitone apart (the smallest step on the keyboard, one key to the next) — so let
them pass rather than sit. The house tune itself holds an F in its second chord, and gets away with
it because the held F is an octave below middle C and the figure's F above is a passing note of half
a second. And under a find's own fanfare, the G-major run, a held C or E at the top can rub for a
moment — a second reason to let top notes pass. Whatever chord you hold should sound fine with an E,
a G or a C rung over it.

**The register left free** (register: how high or low a sound sits). Melodies sit roughly between
the C below middle C and two octaves above it. The taps share that top octave and climb a sixth past
it — a streak runs from the octave above middle C to the A above the next — which is why top notes
pass rather than sit; above the taps, the aurora's chimes. Below, no sub-bass (the very lowest
notes, felt more than heard): the phone speaker gives back almost nothing under a few hundred hertz,
and the storm keeps a quiet layer down there that the phone does not pass. The storm's audible roll
sits across middle C, in the melody's own lower band — so under a storm it is the melody, not the
floor, that shares the room; keep the floor sparse for the phone's sake and the lower melody sparse
for the storm's, which is one more reason for the octave-up doubling section 4 asks for. **A low
note in this game is a matter of overtones, not of fundamentals** (the note itself, the lowest tone
in it): the fainter, higher tones that give an instrument its colour are all the speaker will pass
on. A low string with grain is heard; a pure low tone is not.

**The weather coat — ruled in doc 49, owner may veto at the spike.** When it rains, the house tune
puts on a coat: a lowpass filter (a tone control that shaves the bright notes and lets the low ones
through) closes to about 900 Hz and its rising figure (a short repeating shape of notes) thins, so
you hear it *from indoors* — what a shut door does to a tune in the next room; the storm closes it
to about 620 Hz, and the taps go soft-edged under the rain too. **A record wears the same coat in
its cheapest form: one filter, driven by the standing sky at the house tune's own values, and
nothing else** — a file cannot be thinned or slowed the way the live tune can, and it is never
restarted. Those values were tuned for a chord of pure tones — sine waves, the plainest sound there
is, with no overtones at all; if a recorded felt piano goes thin under the 900 Hz coat on the
handset, that is a question for the owner at the veto, not a value the build changes on its own.
**Write as though the coat will happen:** listen to the finished loop through a lowpass at 900 Hz
and confirm the tune still reads; a music-box line with nothing under it disappears indoors, so
where the tune is carrying the room, give it a shadow an octave down (the same notes played an
octave lower, quieter).

**Dynamics: even, small, never a peak.** The house measures its beds by how much they *breathe* —
the loudest second against the quietest, in decibels (the unit loudness is counted in) — and under
about 1 dB a sound is fatiguing however quiet it measures, while one that swells to a peak asks to
be listened to. A record breathes through phrasing (how a line is shaped and where it breathes) and
voicing (which notes of a chord sit where, and how many) — a bar (the group the pulse is counted in
— four beats in four-four, three in three-four) with fewer notes, a chord held longer — never
through level; section 4 carries the number, and the phone is the gate.

## 3. The five briefs

**The slate is doc 49's, by name and rarity:** The First Record, Pip's Record and The Almanac Record
(Common), The Counter Record (Rare), Holly's Record (Legendary); no Epic in the first version. Their
ids are PROVISIONAL until the build writes the data rows. **Rarity is the song's elaborateness and
beauty and the find's ceremony — never anything else:** a Legendary record is the more elaborate and
beautiful song and its find the bigger moment — never louder, and never longer than the cap. **Every
find is celebrated through the moments dialog** (doc 49, on doc 47's machinery); if the dialog's
arrival wants sound and particles, the proposal is the feedback ladder's own rungs from
[06-audio-and-fx.md](06-audio-and-fx.md) — the quest-claim rung for The First Record and Pip's; the
Almanac's find rides its milestone, which already plays that rung, so nothing plays twice; the
Epic-harvest rung for the Rare; the Legendary rung for Holly's — placed on the ladder deliberately,
PROVISIONAL. **A record is never heard under a fanfare.** The find's celebration finishes on its
own; the song plays only when the player puts the record on from the shelf, and whatever was playing
keeps its place until then — so the fanfare is long over before the first note, never the other way
round. Loops are 60–90 s in whole bars.

### 1. The First Record — the garden's own lullaby

**For:** the first record anyone finds — granted the first time the shelf is opened (doc 49) —
so it is the first song anyone who puts a record on hears.
**Mood:** the house tune, played by hands. The game already hums a four-chord tune to itself —
each chord held softly as three pure tones an octave below middle C, and a light six-note figure
climbing through the chord's notes from the octave above middle C up two octaves — and this is
that tune as a musician would play it, with the small unevenness of touch a wound-up box does not
have. It should feel like finding that the garden had been humming all along. **Palette:** felt
piano or a soft celesta carrying the chords and, in its upper hand, the melody — the flower's
phrases belong to the same instrument as the harmony, so they sound hummed rather than
announced; a music box or a plucked figure for the rising line; one warm low string or reed (a
clarinet or a bassoon, say) under it if the chords want a floor. Two or three instruments at
most, and no held tone that never moves.

**Tempo, key and loop:** about 75 beats a minute in four-four, in C major — the white keys from C.
The chords are the house tune's own bones, one to a bar, 3.2 seconds each: C major; D minor with A
as its lowest note (A–D–F); C major with G as its lowest; G major with B as its lowest — so the bass
(the lowest line) walks C, A, G, B — in musicians' shorthand I – ii – I – V, the numerals being each
chord's place on the scale. Voice the second chord as the house does, with its held F below middle C
— the house's own figure only touches F above middle C in passing — so the chimes never meet a held
F. The loop is a whole number of four-bar rounds: 20, 24 or 28 bars (64.0, 76.8 or 89.6 s).

**The melody:** the Summer flower's hummed song is three seven-note phrases on the five notes, an
octave above middle C — seven even notes about a third of a second apart, the last held about a
second, each phrase climbing to the C, and in the third the D, two octaves above middle C:
E G A G C A G · C E G C A G E · G A C D C A G. **The record's melody is that song, never stated in
full.** Quote its openings, its turns, the shapes of its endings; let a phrase start and drift
elsewhere; let the listener almost recognise it. The whole phrase belongs to the flower, which
hums it during Wonderfall — and when it sings over this record, the two should sound like one
tune from two rooms.

**Never:** a drum; a chord the house tune does not have; a key change; a countermelody (a second
tune running against the first) that competes with the taps; a final cadence — the pair of
chords that says *the end*, which this tune must never say; anything sadder than the house tune.
It stands nearest the house tune, which is the default, so it has no opinion. **Rarity and
ceremony:** Common; found on the first opening of the shelf and celebrated the way every find is;
the quest-claim rung PROVISIONALLY — on screen, nine stars and a ring, and three soft notes.

### 2. Pip's Record — a tune from a small thing that is almost never thinking

**For:** the creature record — Pip's, the Grove Spirit who lives in the Hollow under the garden;
found when any creature reaches full stars, and Pip's is the first (doc 49).
**Mood:** Pip is a small pale pebble of a creature that sways with nothing in particular, watches
a bee, wants bluebells and only bluebells, and — this is the whole joke — *rattles its head when
it is thinking, and it is almost never thinking.* The tune is small, light and content, a swaying
little figure that goes round and gets nowhere and is pleased about it, and now and then, on no
schedule, it stops mid-phrase as if it has just thought of something: the harmony holds, there is
a tiny dry rattle — seeds in a pod, a shake of a very small head — and then the figure carries on
exactly where it left off, having decided nothing. It is told with a straight face — warm and
daft, never cartoonish — and the rattle is a creature being itself, not a punchline. **Palette:**
a thumb piano (a handful of plucked metal tines on a small wooden box, pebble-toned and rounded)
or a small plucked instrument for the figure, a soft marimba (a wooden keyboard struck with soft
mallets) or a low music box to answer it; felt piano or a plucked nylon string for the harmony;
for the rattle, one dry, quiet, unpitched shake — a seed pod, a rustle — one bar at most, quieter
than the tune. It is the only percussion-like sound on the shelf, and it is an event, never a
beat.

**Tempo, key and loop:** 80–90 beats a minute in four-four (four beats to a bar), in C major; the
figure can live almost entirely on C D E G A, and a little two-note bell-shape — a bluebell —
may be the thing it keeps coming back to. 60–90 s in whole bars — at 84 a bar is 2.857 s and 28
bars is 80.0 s (in two-four halve the bar and double the count). **The thinking comes three
times a loop, eight to fourteen bars apart, spaced unevenly and counted across the join — none
the same, none dividing the loop's length (section 4), so at 28 bars that leaves one spacing, 8,
9 and 11 — and never in the first or last two bars.** Never two, because two gaps in a loop this
short come out equal, and equal is a clock; more than three and the rattle is a rhythm.

**Never:** a rhythm you could nod to, or the rattle becoming a shaker part; a drum standing in
for the rattle; a comic slide, a boing or a wobble; a silence — the harmony always holds under the
thought; a tune that reacts to the thought, or comes back changed by it — it decided nothing;
anything cleverer than Pip. **Alternate, in one line, if the owner ever swaps the slot:** Thistle,
who *snores like a much larger animal* — a tiny digging tune with one absurdly low note in it now
and then, the strongest joke in the roster; not Bumble, who never once sits down, because a busy
tune breaks *nothing demands attention*. **Rarity and ceremony:** Common; the quest-claim rung
PROVISIONALLY — nine stars, a ring, three soft notes.

### 3. The Almanac Record — the collector's quiet pride

**For:** the collection record — found at the ten-species Almanac milestone (doc 49), for the
player who fills in the Almanac and likes a full set.
**Mood:** tidy, orderly, patient: a figure that fills in the way a set does — a phrase stated
with a note missing, then again with the note found, then complete, and on to the next page.
Page-turn calm, the pleasure of a thing in its right place with no fuss made. It is proud the way
a well-kept shelf is proud, which is to say it would never say so. **Palette:** celesta or a
bright music box for the filling-in figure; felt piano for the chords under it; a soft plucked
bass keeping the floor; a glass tone may mark a page turn, short and never held — if it comes
more than once, space the turns unevenly as section 4 asks, and never at the join. Nothing blown.

**Tempo, key and loop:** 66–74 beats a minute, four-four, in **C major.** A Lydian touch — an F
chord with the B left in it, the white keys' own floating colour, as if pleased — is welcome once
a phrase, and never held: a held B sits a semitone under the taps' C, and a floating chord under a
tap streak is the one thing the white keys cannot forgive. 60–90 s in whole bars — at 72 a bar is
3.333 s and 24 bars is 80.0 s. **The figure reaches *complete* once in the loop, quietly — no held
note, no lift — somewhere in the middle, so it passes; never twice, and never at the join,** where
a set completing would teach the ear where the loop is (section 4). Let the join fall on an
ordinary bar.

**Never:** a triumphant chord when the set completes — the milestones pay on crossing, and the
crossing is the moment; a melody on top of the figure, or one more memorable than it; a hurrying
tempo; a bell above the register; any percussion. A set completing is calm, not fast. **Rarity
and ceremony:** Common; the find rides the milestone, whose own celebration stands — the record's
dialog follows it, and no second rung plays.

### 4. The Counter Record — the Stand's village counter

**For:** the order counter's record — found at the Stand's third tier (doc 49), for the player
who fills bouquets and honeys for the queue.
**Mood:** warm bustle at garden pace: market day in a village of six — Nan Bramble's bad knees
and good eyes, the coins Tobin saved for his mum, Miss Marigold's very particular idea, Bram the
Baker's flour on everything, Wren from three villages over, Old Hollis and his bees. It swings
gently and never hurries, a small village with all the time in the world that would still like
its order, please. Friendliness here is a kind of patience. **Palette:** plucked and blown — a
nylon-strung pluck or a small harp, a wooden flute or a soft pipe, a light mallet instrument (a
small wooden or metal keyboard struck with soft sticks) doubling the tune (playing the same line
alongside it), a plucked bass on the floor. **A plucked bass note on the strong beats — the first
beat of each bar — is the only pulse allowed: the pluck is the market's footsteps.**

**Tempo, key and loop:** 84–90 beats a minute in three-four (three beats to a bar, a lilt) or a
light six-eight (two long beats a bar, each split in three, a skip). **G Mixolydian or plain C
major.** G Mixolydian is the white keys started from G: a bright scale with its last step
softened, a folk tune that never quite closes the door behind it — right for a counter where the
next face is always arriving. 60–90 s in whole bars — in three-four at 90 a bar is 2.0 s and 40
bars is 80.0 s; in six-eight the tempo counts the two long beats and the ledger's beats per bar is
2 — at 90 a bar is 1.333 s and 60 bars is 80.0 s. Write the beats per bar in the ledger either
way.

**Never:** drums forward, or a drum kit at all; an oom-pah — the bass thumping on the beat and
chords bouncing between, no squeezebox, no tuba; a chorus that lifts; anything that would make a
player look up from the plots to see what the fuss is — the queue is three faces, not a fair. **The
bustle is in the counterpoint — two or three lines talking over one another — not in the volume.**
**Rarity and ceremony:** Rare; the Epic-harvest rung PROVISIONALLY — nine stars, a ring, a shake of
five (the screen itself shakes, out of ten), the seven-note run with its long tail of air, and a
toast (a small message that slides in) — one rung up, because the Rare-harvest rung is deliberately
quieter and carries no toast, and a record find is rarer than a Rare harvest.

### 5. Holly's Record — the winter rose's night watch

**For:** Winter's record, the shelf's rarest — found on the first kept night in Winter (doc 49),
for whoever has seen what the morning brings.
**Mood:** Holly is the winter rose — a real flower that blooms in snow — who keeps the garden
overnight and insists she didn't do it for you: deadpan, superior, secretly devoted, her sass
aimed at the Summer flower and never at the player. The record is her night watch: a dark
cold-frame under snow, one lit window, a garden asleep under quilts, and someone awake who would
rather you did not notice. Deadpan elegance, secretly tender, and **the most beautiful thing on
the shelf** — because rarity is the song's beauty and nothing else. **Palette:** music box or
celesta, wound slowly — it should sound as if it could stop between notes and chooses not to;
felt piano for the harmony, sparse and low; bowed glass (a wet finger drawn round a glass rim) or
one low held string for a floor; and a lot of air — the rests (the silences between notes) as
long as the notes. **Cold instruments, warm playing:** if a note needs to hold, a string or a
glass holds it and then lets go; no held tone that never moves.

**Tempo, key and loop:** 60–66 beats a minute, four-four, a slow walk in snow. **A minor — the same
white keys as the garden's C, heard from the colder end**, with A as home and C as somewhere the
tune used to live. It shares every note with the taps, so a tap streak through it is a small
brightness in a cold room, which is exactly Holly. No black notes; no modulation (a move to another
key — she does not change her mind); no sentimental swell. 80–90 s in whole bars — a narrower window
than the others', so the slowest tune on the shelf has room to go round before it comes back, and
she stays under the same cap as everyone — at 63 a bar is 3.810 s and 21 bars is 80.0 s, the
ledger's worked row; at 60, 4.000 s and 22 bars is 88.0 s. The loop earns its repeats by never quite
repeating — a note dropped, a chord revoiced — never by adding anything.

**Never:** a peak; a swell; a modulation; a melody that turns sweet; anything that could be
called *magical* — the ice in her lives in palette and shape, never in sparkle; and never a held
voice above the C two octaves over middle C, because the aurora's chimes fall there — and the
aurora's three held tones sit from the E above middle C to the G an octave and a fifth over it,
with its anchor an octave under middle C, which is her own room, so keep her sparse enough to
share it. She is not sad. She is cold, and staying
up anyway. **Rarity and ceremony:** Legendary — the Legendary rung PROVISIONALLY: sixteen stars,
a ring, confetti, a shake of nine, the seven-note run with its tail, a toast — and a line of
Holly's for the dialog, if doc 46 gives her one for it: the rung's own speech is the Summer
flower's and does not draw in Winter's room. All of it is over before the player can put her on.
**The fanfare ends before the record starts; the record is the last thing you hear, not the
fanfare** — it is the prize.

## 4. The delivery specification — for every track

**A seamless loop: no intro, no outro, no final cadence, no fade at either end.** A fade-in is an
arrival, an ending is an event, and neither belongs in a garden nobody is watching; a fade is a
cadence in disguise. The file starts on a downbeat (the first beat of a bar) already in motion
and ends trimmed to the bar.

**Sixty to ninety seconds a loop — under a minute and a half — a whole number of bars at the
stated tempo.** *Under a minute and a half* is the owner's word, so ninety seconds is the line a
loop stays beneath, never a target; a musician can weigh the reasons too: at the shipped rate a
90 s loop is about 1.4 MB, and past a minute and a half a loop stops being a tune that never
arrives and starts being a piece. Whole bars, because a loop point between beats is a limp
every time round. The arithmetic: **seconds = bars × beats per bar × 60 ÷ tempo**; the ledger has
a worked row each.

**What the seam must survive.** The join is where a loop is heard as a loop; each fault below is one
way it gets heard. The check: loop the finished master — the full-quality file the shipped one is
cut from — three times, eyes closed, and count the joins: none.

| Fault | What it sounds like | The rule |
| --- | --- | --- |
| A cut tail | The last chord's ring is chopped at the file's end and missing from the start | The ring of the last bar is already sounding at the head of the first, so bar one sounds like bar twenty-five arrived |
| A cold head | Bar one is dry because nothing came before it | The same rule: bar one already carries what came before it, as if cut from the middle of a longer performance |
| A held low note across the join | A string still sounding at the end and silent at the start | Either it sounds at both ends or it stops a beat early |
| Tempo drift | The performance is a hair slower by the end, so the downbeat stumbles | The join lands within a few milliseconds of the bar |
| A click | Any break in the sound at the cut | Heard loud, on headphones, the join is silent |
| A tell | A distinctive event — Pip's rattle, a page turn — that recurs at even spacing, or sits in the first or last bars, so the ear learns to count to the join | Keep it out of the first and last two bars; space repeats unevenly, no two the same number of bars apart and none a divisor of the loop's length; an event that happens once a loop is a tell by nature, so make it small enough to pass unnoticed — no held tone, no register change — or drop it |

**Loudness −16 to −18 LUFS integrated, aim −17; true peak at or under −2 dBTP on the master, so that
the decoded shipped file — where the number is checked — sits at or under −1 dBTP; loudness range
between about 2 and 6 LU; stereo, mono-compatible — delivered at the target, because turning it down
is the garden's business.** In plain words: LUFS is a loudness measure that listens the way an ear
does, averaged over the whole loop; true peak is the tallest instant once the file is sound again,
and the decibel of margin is what encoding eats, because a compressed file overshoots its master by
a decibel or more at the shipped rate — if the decoded file reads above −1 dBTP, the master is
lowered and the file re-cut, never accepted as is; LU is how far the quiet parts sit from the loud,
on a measure that discounts rests — under about two the loop is flat, over six there is a peak in
it, and a loop that measures higher on rests alone, with no swell, is discussed rather than failed.
It is this document's measure of breathing; the house's own breathing figure (section 2) is a
different measure, kept for the beds, and is not what the ledger reads. **Everything the phone can
hear should sit close to the whole:** measure everything above 300 Hz as well as the whole file —
the band the house measures its beds in — and listen to the two side by side; if the phone-band
reading falls well short of the whole, the mix leans on a bottom the phone throws away, and the fix
is in the writing — a doubling an octave up — never in brightness. **The phone speaker is one
speaker:** lead and low end in the centre, air on the sides; folded to mono — left and right summed
at half level and written to both channels — and measured against the stereo file, no instrument
disappears and the loudness differs by no more than about one decibel — 1 LU, the unit a difference
between two loudness readings is counted in. Listen to the fold before calling it finished.

**Five tracks at one loudness need one level in the game, not five.** The music channel's house
level was calibrated against the house tune, and a full-scale file (one whose loudest instant
reaches the top of what a file can hold) through it would be several times louder than the tune
it replaces, so the build carries a trim for record files (doc 49's per-track field). Delivered at
−17, every record takes the same trim, set once against the house
tune's own level measured through the game's graph under a clear sky — the arrangement at full
level, no coat; the per-track field exists for the day a track arrives off target, and
is normally the same number in every row. That is what the ledger's loudness column is for.

**The musician delivers the lossless master and the ledger row; the shipped file is cut on the
game's side, and its cutter owns the seam check on it and the ledger's measured column.** Masters
are WAV, 24-bit, at 44.1 or 48 kHz (bit depth and sample rate: how finely loudness and time are
recorded — the two standard settings), cut to exactly the ledger's bars, kept outside the repository
— a master is neither text nor small, and it is the reference the shipped file is cut from. The
shipped file is **AAC in an .m4a at 128 kbps (kilobits a second: how much room the sound is given) —
160 if the ear asks for it, and a 90 s loop is then about 1.8 MB — with 2 MB the hard ceiling** (a
megabyte here is a million bytes, so the ceiling is a number and not an argument). An .m4a plays on
every handset the game is played on without a question; a better codec (the way a file's sound is
packed) at the same size exists and ships only once the playback build proves it on those handsets.
**An AAC file carries the encoder's own run-in at its head — a few hundredths of a second — and a
part-frame of padding at its tail.** A well-formed .m4a records both, and a decoder that honours the
record hands back exactly the master's samples; one that does not hands back the master plus that
silence. So the master is trimmed to exactly the ledger's bars, nothing extra; the shipped file is
written so the record is present, and its cutter writes the run-in the shipped file carries into the
ledger row, in samples; and the build loops around it — doc 49 names its two routes, and the second,
which decodes the file once and loops from the first downbeat for exactly the ledger's length (the
run-in is where the loop starts; bars × beats per bar × 60 ÷ tempo, in samples at the file's rate,
is how long it runs), is the one the padding cannot fool. The shipped file's own check: decode it,
loop from its first downbeat at the ledger's seconds, on headphones, three times, no join.

**One file per record, named `art/music/<record-id>.m4a` — lowercase, relative, in the one folder
the service worker will be told to leave alone.** Under `art/music/`, the fifth folder exception
beside doc 09's four (two of them its neighbours under `art/`), because doc 49 keys the worker's
media exemption on `art/music/` itself — its sibling `art/` folders are precached, so a file
anywhere else is cached like a script. The id matches the record's data row (PROVISIONAL ids:
`first`, `pip`, `almanac`, `counter`, `holly`), so nothing in the build ever translates one name
into another.

**Every track carries a ledger row, delivered with the file, and the row is the loop.** Bars, beats
per bar and tempo are the definition, and the build derives the loop's length from them in samples
at the file's rate; the seconds column is that arithmetic written out, for reading, never for
looping. The shipped file is trimmed to exactly the row, so a decoder that honours the record loops
it whole at the row's length; one that does not is why the second route exists. The rows below are
worked examples with the delivery targets in the last column, overwritten on delivery with what was
made and measured; the run-in column is empty until the shipped file is cut.

| id | Key or mode | Tempo | Beats per bar | Bars | Seconds | Run-in (samples) | Loudness: LUFS / dBTP decoded / LU (the LU figure advisory) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `first` | C major | 75 | 4 | 24 | 76.800 | — | −17 / −1 / 2–6 |
| `pip` | C major | 84 | 4 | 28 | 80.000 | — | −17 / −1 / 2–6 |
| `almanac` | C major | 72 | 4 | 24 | 80.000 | — | −17 / −1 / 2–6 |
| `counter` | G Mixolydian | 90 | 3 | 40 | 80.000 | — | −17 / −1 / 2–6 |
| `holly` | A minor | 63 | 4 | 21 | 80.000 | — | −17 / −1 / 2–6 |

**Lazy, never core, never load-bearing.** A record's file is never in the `CORE` precache — the
files kept for offline play, in [23-installable-pwa.md](23-installable-pwa.md) — and doc 49 rules
that the fetch handler will leave `art/music/` to the browser, which is what makes the lazy claim
true. Played through the media element, a record arrives in the browser's own pieces, which is
one more reason the worker must not touch it — its cache cannot hold a partial response; the
buffer route fetches the whole file once. Neither affects the seam, which is the decoder's
business. Five records would weigh about three times everything else in the precache, for players
who have never switched music on. A file is fetched the first time its record is put on, and the
house tune covers the wait. **A missing or failed file never breaks anything:** if the file does
not arrive or will not play, the shelf falls back to the house tune the way the reveal art falls
back to the seed's own bloom.

**The acceptance test — the owner's ear is the gate, as the motion gate is for animation.** A
track is accepted when the owner has played the garden with it on for **five minutes, on the
phone speaker and on headphones, through a tap streak and a rain,** and did not notice it end.
Why each clause is there: five minutes is three to five times round the loop, long enough for a
seam to show and a hook to wear out; the phone speaker is the instrument the game is played on;
headphones are where a bad join, a stereo trick or an over-loud peak show up; a tap streak lays
the climbing chimes over the harmony and finds any held note that rubs; a rain puts the bed over
the track and closes the coat on it. *Did not notice it end* is the whole brief.

## 5. What doc 49 decides, and what stays open

The shelf's spec rules most of what a musician might wonder about; this document leans on it
where it must and invents nothing. Three rows below the music does not depend on at all — where
the shelf lives, the charm, and whether putting a record on switches Music on — and they are
here so nobody goes looking for a dependency that is not there. What the owner has flagged for
veto at the spike, and the few things still open, are marked.

| Question | Where it stands |
| --- | --- |
| Where the shelf lives | Ruled in doc 49: the gramophone in the Hollow, and a Records row in the menu |
| How each record is found | Ruled in doc 49, one named condition each — the *For* line of every brief. Section 3 proposes ceremony sounds; it does not set the finds |
| A record's other side | Ruled in doc 49: Side B is a charm, small and permanent, and it works with the music off. Rarity is the song's beauty and the find's ceremony, never the charm's size |
| The player-facing words | Ruled in doc 49: *records*, *songs*, *charms*. This document says *record* and *song* |
| Whether putting a record on switches Music on | Ruled in doc 49, owner may veto at the spike: it does, with a toast |
| Whether a record takes the weather's coat | Ruled in doc 49, owner may veto at the spike: it does, as one filter at the house tune's own values. If a recorded piano goes thin under the 900 Hz coat on the handset, that is a question for the owner at the veto (section 2) |
| The five records | Ruled in doc 49 by name, rarity and find. Their ids, and the worked ledger rows, are PROVISIONAL until the data rows exist |
| The ceremony of the find | The moments dialog is ruled (doc 49); whether it carries the record's art is the build's. The rung sounds proposed in section 3 are borrowed from doc 06's ladder and PROVISIONAL. The rule kept here: a record is never heard under a fanfare — the song plays only when the player puts it on |
| The loop cap | The owner's word: under a minute and a half, so ninety seconds is the line a loop stays beneath. The wider window doc 49 carried until this document landed is retired |
| The shipped codec | AAC in an .m4a, ruled here; a better codec at the same size only once the playback build proves it on the handsets |

**What it hands the playback build:** the loop rule and the ledger, which is the loop; the
loudness targets and the one trim they make possible; the never-core rule, the folder the worker
will be told to leave alone, and the fallback; the coat as one filter on the music channel at the
house tune's values; the find's celebration, placed on the ladder deliberately if it takes a
sound, and no song before the player puts the record on; the acceptance test, which only the
owner's ear can pass; and the fifth binary exception — the first for audio — logged with the
first file.

**What it hands the musician:** section 1 for the room, section 2 for the weather, one brief, and
section 4. Before writing, play the garden at
<https://deep-forest-labs.github.io/GardenofWonder/> on a phone with Music on for five minutes —
the house tune, the taps and a rain are all there, and no description here beats hearing them.
Where a brief is silent, ask the owner rather than guess — the owner answers as a gardener, and
that is the right answer. The rest is the musician's.
