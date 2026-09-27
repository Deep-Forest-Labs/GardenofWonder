# Volume One — the script

**Status: DRAFT SCRIPT FOR THE WRITER'S PASS, 2026-09-27 — not shipping text.** Every player-facing
line of volume one, in the chunks the narrative engine reads, so the engine can be built against it now
and the words swapped when the human pass lands. Written from [55-the-story-bible.md](55-the-story-bible.md), which is the *why* — the
premise, the cast, the rules, the delivery. This document is the *what*: the words, in order, tagged.
The owner ruled on 2026-09-26 that the shipped words must pass as human; this is the desk's draft for
that pass, not the pass itself (doc 55 §9 question 11).

**The engine reads it (2026-09-27).** `node tools/story-import.js` parses this file into
`DATA.story.script` in `data.js`; the words ship to the web lab behind `DATA.story.draft: true` so the
machine can be judged, and the human pass is an edit here and a re-run — see *How to read this file*.

**Who it is written for.** Women roughly **35–55**, the premise's audience and the lane's core (Gossip
Harbor's players are 79% female, average age 32 — doc 55 §1). So: adult worries — money, family, an
ex, starting again, a friend who talks too much — and no slang that dates it. Mara is mid-thirties, dry
and capable. The humour is the gentle, slightly corny kind this lane's games actually run on.

**How it is written — the lane's own grammar,** measured from the owner's recording of a Gossip Harbor
scene (doc 55 §6, described in words; the recording stays on his machine):

- **A line is one breath: six to fifteen words.** Never a paragraph. Nobody narrates.
- **Two faces trade lines.** Mood lives in the portrait's expression tag, not in stage directions.
- **A dash is an interruption, and only that.** Trailing off is three dots. CAPS for one stressed word,
  rarely.
- **A scene ends on Mara's private thought** — the cloud bubble — unless the rules say silence.
- **Nobody says the theme.** People talk about the kettle, the ladder, the show. The feelings sit under it.

---

## How to read this file — the format the engine parses

```
### ch2 — Someone Has Been Weeding          ← a chapter: id, then its title (shown on the rail)
@level ~4                                   ← placeholder; the spec places it (doc 55 §4)
@teaser Someone's been in the meadow.       ← what the rail shows from below, before it plays
@change villager:theo                       ← the visible change (doc 55 §4)

#### ch2.s1 · room: meadow · faces: mara, theo     ← a scene: id, the room blurred behind, the two portraits
MARA [surprised]: Somebody's weeded these.         ← SPEAKER [expression]: line
THEO [neutral]: Me.
MARA (think) [dry]: A talker, then.               ← (think) = the cloud bubble
@card Next morning                                 ← the full-screen title card between scenes
```

- **Speakers:** `MARA`, `POPPY`, `HOLLY`, `DELPHINE`, `THEO`, `JULIAN`, `ISOLDE` (the Baroness), `BRAM`,
  `MARIGOLD`, `HOLLIS`, `WREN`, `NOTE` (Gran's handwriting — no portrait).
- **Modes:** none = spoken bubble · `(think)` = Mara's cloud · `(bubble)` = Poppy's speech bubble in the
  garden, outside a scene · `(chip)` = a reply button; `A | B` means two chips that lead to the same next
  line · `(strip)` = the quest strip.
- **Expressions** (one portrait each, swapped per line): `neutral`, `happy`, `laugh`, `soft`, `sad`,
  `worried`, `cross`, `surprised`, `sly`, `dry`, `tired`, `curious`. Poppy adds `sleepy` and `proud`.
- **`?met:holly`** after a line means it plays only once Holly has been met (Winter is Turn-gated, so
  she can never be assumed).
- **Only Mara hears Poppy.** When a villager shares a scene, Poppy's lines are still drawn; the villager
  simply never answers them. Villagers hear a hum (doc 55 §5).
- **`[FALL HERO]` and `[SPRING HERO]`** are the two season heroes, not yet designed, named or voiced
  (the 2026-09-27 hero ruling). Where the story touches them, the beat is one sentence and there is no
  dialogue; their pass writes it.
- **Placeholder levels.** Every `@level` is the bible's placeholder; the reputation curve is being
  rebalanced, and the spec places them.
- **`order:<villager>-<good>`** in an `@change` is a scripted order the Stand deals once the chapter has
  been seen — `order:delphine-handful` names the good by its id in `GOODS`; `order:marigold-entry` means
  any good `standGoodsAt(tier)` allows. Added 2026-09-27 for the engine (it replaced Chapter I's prose
  *"first order: Delphine, Garden Handful"*, which no parser could read without a name table).
- **`#### ch1.turnask`** marks the ceremony's re-voiced ask line as its own chunk, so the importer never
  has to guess which fence under `ch1.ask` is which. Added 2026-09-27, the same night.

**The engine reads this file through `node tools/story-import.js`**, which parses every chunk above into
`DATA.story.script` in `data.js` and **refuses** — exits non-zero, naming the line — on any fenced chunk,
table row or list item it does not understand. The writer's pass is therefore an edit here and a re-run
there. The words are the desk's draft behind `DATA.story.draft: true` (doc 55 §9 question 11): the flag
prints nothing to a player, and the pass flips one word when the human words land.

---

## Chapter I — The Seed Tin

```
### ch1 — The Seed Tin
@level 1 → closes on the first Turn (a latch: Turns completed ≥ 1, scene not yet seen)
@teaser Gran left you a garden. And a tin.
@change strip:open · counter:1 (shutters up) · order:delphine-handful (her first order, the Garden Handful)
```

### ch1.open — the seed (the flower's bubble, before any scene)

```
(strip): Gran's garden is yours — if it lives through one Year.
(strip): Plant the seed from Gran's tin.
  — the centre cell is soil; one tap plants it; sprout, stem, bud (it holds too long), bloom —
POPPY (bubble) [surprised]: ...Oh. Hello.
POPPY (bubble) [curious]: Are you my mama?
MARA (chip): ...I'm Mara. | No, sweetheart. I'm Mara.
POPPY (bubble) [happy]: Mara. Mara-Mara. I'm Poppy.
MARA (chip): Who told you that?
POPPY (bubble) [curious]: Nobody. I just know it.
MARA (chip): Join the club.
```

### ch1.hum — the first sliver

```
  — Poppy hums: Sound.sing(), her own three phrases —
POPPY (bubble) [soft]: Somebody used to sing me that.
MARA (chip): Who?
POPPY (bubble) [curious]: Don't know. Before.
```

### ch1.teach — one line as each kind of tutorial step begins

The tutorial is being re-cut (the quest chain moves to the Almanac, 2026-09-26), so these key to the
*kind* of step. Poppy's ordinary tap lines stay silent while this run plays.

```
POPPY (bubble) [curious]: All that ground and nothing in it. Look — the dirt's waking up.
  step:tap      POPPY (bubble) [happy]: Every tap's a coin. I counted.
  step:plant    POPPY (bubble) [curious]: Pointy end down. I think.
  step:harvest  POPPY (bubble) [happy]: That one smells like Tuesday.
  step:upgrade  POPPY (bubble) [proud]: Look at that. You're getting good at this.
```

### ch1.ask — the Stand

```
POPPY (bubble) [curious]: Mara? Who were all the people?
MARA (chip): What people?
POPPY (bubble) [sad]: The ones who rang the bell at the Stand. Nobody rings it now.
MARA (chip): Then we'll open it.
(strip): Keep the garden through its Year.
```

**The Turn's ask, re-voiced** (replaces the shipped *"The year's turning. Save your seeds?"* — doc 55 §9
question 17, the owner's call; code and doc 32 change together):

```
#### ch1.turnask · the ceremony's ask line
POPPY (bubble) [curious]: The Year's turning. Shall we keep it?
```

### ch1.s1 — the act break

Plays once the ceremony sheet has shut. Fall's coach mark waits until it is dismissed.

```
#### ch1.s1 · room: garden · faces: mara, delphine
@card The Year is kept
NOTE: A garden's Year isn't a calendar's. If it's still growing, it's yours.
NOTE: Ring the bell. And don't sell it — not even to family. — O.
  — the bell; the shutters go up; the quest strip folds away; the order strip unrolls, one face on it —
DELPHINE [happy]: You've opened! I'm Delphine, next door. Surprise me — I'm not fussy.
DELPHINE [sly]: I'm very fussy.
POPPY [surprised]: A person! Mara, a person!
DELPHINE [curious]: Who are you talking to, love?
MARA [dry]: ...The garden.
DELPHINE [laugh]: Well. It's humming back.
MARA (think) [dry]: Not even family. Noted.
```

### ch1 — alternates for the human pass

**Chapter I above is doc 55 §7, word for word** — the scene spike builds from it verbatim, so it is not
changed here. Four alternates the desk would take, for the writer to weigh:

- **Dashes only for interruptions.** Three of §7's dashes are not interruptions: *"yours — if it lives"*,
  *"Look — the dirt's waking up"*, *"don't sell it — not even to family"*. Alternates: *"yours, if it
  lives"*, *"Look, the dirt's waking up"*, *"And don't sell it. Not even to family."*
- **Delphine's first line is two breaths.** Alternate: *"You've opened! I'm Delphine, next door."* then
  *"Surprise me. I'm not fussy."*
- **One stressed word:** *"A person! Mara, a PERSON!"*
- **One more tutorial line,** for any later step: *"We're a team now. I decided."*

---

## Chapter II — Someone Has Been Weeding

```
### ch2 — Someone Has Been Weeding
@level ~4 (never before ch1 is seen)
@teaser Someone's been in the meadow.
@change villager:theo
```

```
#### ch2.s1 · room: meadow · faces: mara, theo
MARA [surprised]: Somebody's weeded these.
THEO [neutral]: Me.
MARA [surprised]: Oh! Hi. Sorry, who are you?
THEO [neutral]: Theo. Grounds.
MARA [curious]: Gran had a groundskeeper?
THEO [neutral]: Twenty-two years.
MARA [worried]: I can't pay you. I should say that now.
THEO [neutral]: Didn't ask.
MARA [curious]: So why are you still here?
THEO [soft]: Someone had to do the meadow.
POPPY [curious]: He smells like the tin.
MARA (think) [dry]: A talker, then.
```

```
@card Later
#### ch2.s2 · room: garden · faces: mara, theo
THEO [neutral]: Planted it, then.
MARA [surprised]: You know about the tin?
THEO [neutral]: Kept it for her. After.
MARA [curious]: Kept it from who?
THEO [neutral]: ...
THEO [neutral]: There's a door at the back of the glasshouse.
MARA [curious]: Locked?
THEO [neutral]: Locked. She had the key.
MARA [dry]: And you don't.
THEO [neutral]: I don't.
POPPY [happy]: I like him. He's quiet like a plant.
MARA (think) [tired]: Twenty-two years and not ONE key.
```

---

## Chapter III — Over the Fence

```
### ch3 — Over the Fence
@level ~8
@teaser Delphine's coming over. With cake.
@change counter:2 (the sign repainted — Gran's name back over the counter)
```

```
#### ch3.s1 · room: stand · faces: mara, delphine
DELPHINE [happy]: I brought cake. It's shop cake. Don't tell anyone.
MARA [laugh]: Your secret's safe.
DELPHINE [sly]: Did you know your gran won the show? Eleven years running.
MARA [surprised]: Eleven?
DELPHINE [sly]: Then one year she just... didn't enter. Never again.
MARA [curious]: Why?
DELPHINE [worried]: Nobody knows. And believe me, I asked.
DELPHINE [soft]: She always smelled lovely, your gran. Nobody could ever say of what.
MARA [soft]: Oranges. Something green.
DELPHINE [curious]: See, I'd have said honey.
POPPY [curious]: It was both.
MARA (think) [curious]: Eleven wins. Then nothing.
```

```
@card That afternoon
#### ch3.s2 · room: stand · faces: mara, delphine
  — Theo on a ladder behind them; Gran's name going back up over the counter —
DELPHINE [happy]: Oh, the sign! Look at that. Like she never left.
MARA [soft]: Theo found the old paint.
DELPHINE [sly]: Theo found something, did he. Theo doesn't find anything.
DELPHINE [curious]: So. Do you have kids, Mara? Sorry. I always ask.
MARA [neutral]: No. No kids.
DELPHINE [neutral]: Right.
DELPHINE [happy]: Anyway! Has anyone told you about the show?
MARA [dry]: You just did.
DELPHINE [laugh]: I'll tell you again. With detail.
MARA (think) [neutral]: Said that well.
```

```
#### ch3.after · the flower's bubble, next quiet moment
POPPY (bubble) [curious]: She stopped the year the door got locked.
MARA (chip): How do you know that?
POPPY (bubble) [worried]: ...I don't.
```

---

## Chapter IV — The Village Show

```
### ch4 — The Village Show
@level ~14
@teaser The Village Show is on. Gran's classes are open.
@change counter:3 (the show's first ribbon) · order:marigold-entry (a good standGoodsAt(tier) allows)
@note Bram's warning about the city lives in his after-ch4 lines, so the show's result plays in person.
@change-if-built perfumery:open (the still room unlocked — becomes the headline once it exists)
```

```
#### ch4.s1 · room: stand · faces: mara, marigold
MARIGOLD [neutral]: Miss Vance. You will be entering, I assume.
MARA [surprised]: Entering what?
MARIGOLD [cross]: The show. Your grandmother's classes have been empty since she stopped.
MARIGOLD [neutral]: Blooms. Arrangements. And the scent class, if you dare.
MARA [curious]: There's a scent class?
MARIGOLD [dry]: There was. Your grandmother won it so often we closed it.
MARA [laugh]: That's a compliment. I think.
MARIGOLD [neutral]: It was a complaint. Entries by Saturday.
POPPY [happy]: We're entering! We're entering, right?
MARA (think) [worried]: I have never made a perfume in my life.
```

```
@card Friday night
#### ch4.s2 · room: stand · faces: mara, hollis
HOLLIS [neutral]: Aye. Heard you need wax.
MARA [surprised]: How did you hear that?
HOLLIS [dry]: Village. Your gran's bees made this. Kept it back.
MARA [soft]: You kept her wax? All this time?
HOLLIS [neutral]: Bees don't waste. Learned that off them.
HOLLIS [soft]: Petals, honey, wax. That's how she started. Rest you'll learn.
MARA [curious]: What do I call it?
POPPY [proud]: Tuesday. It smells like Tuesday.
MARA [laugh]: Tuesday it is.
HOLLIS [surprised]: Tuesday? ...Your gran named hers after weather. Fair enough.
MARA (think) [dry]: Named by a flower. Very professional.
```

```
@card Show day
#### ch4.s3 · room: stand · faces: mara, marigold
MARIGOLD [neutral]: Miss Vance. The results.
MARIGOLD [neutral]: Blooms: first. A Radiant. We have not seen one in years.
MARA [surprised]: FIRST?
MARIGOLD [neutral]: Scent: second. "Tuesday." An unusual name.
MARA [dry]: It was named by committee.
MARIGOLD [neutral]: Your ribbon. Do pin it straight.
MARA [happy]: Thank you. Really.
MARIGOLD [curious]: One question. Where did the seed come from?
MARA [neutral]: My grandmother.
MARIGOLD [curious]: Naturally. And where did she get it?
MARA [neutral]: ...
MARA (think) [worried]: That's the second person who's asked.
```

```
#### ch4.after
POPPY (bubble) [proud]: Ribbons are for winning. Gran had a whole drawer.
MARA (chip): How do you know about a drawer?
POPPY (bubble) [curious]: Somebody opened it every year. Just to look.
```

---

## Chapter V — The Cousin

```
### ch5 — The Cousin
@level ~22
@teaser Family's coming.
@change villager:julian · audio: Poppy's hum cut mid-phrase in ch5.s2
```

```
#### ch5.s1 · room: stand · faces: mara, julian
JULIAN [happy]: Mars! Don't look at me like that.
MARA [cross]: Julian. What are you doing here?
JULIAN [sly]: Buying flowers. Like a normal person.
MARA [dry]: You've never bought a flower in your life.
JULIAN [laugh]: Then it's a big day for me.
JULIAN [neutral]: Congratulations. On keeping it. I mean that.
MARA [curious]: You lost a whole garden and you mean that?
JULIAN [tired]: Gran made her choice. Fair enough, honestly.
JULIAN [sly]: So. Did she leave you anything else? A tin, maybe?
MARA [neutral]: Why would you ask that?
JULIAN [happy]: No reason! Family curiosity.
MARA (think) [cross]: Not even to family. Thanks, Gran.
```

```
@card That night
#### ch5.s2 · room: garden · faces: mara, poppy
  — Poppy's hum plays; Mara joins it; halfway through a phrase, both stop —
POPPY [sleepy]: You stopped.
MARA [tired]: Long day.
POPPY [curious]: You knew the tune.
MARA [neutral]: Everyone knows that tune.
POPPY [curious]: Nobody knows that tune. I asked the bees.
MARA [soft]: Go to sleep, Poppy.
POPPY [sleepy]: You were doing the middle bit wrong, by the way.
MARA [laugh]: Goodnight.
MARA (think) [soft]: Gran sang it. In the kitchen. I was five.
```

```
#### ch5.after
POPPY (bubble) [curious]: The man who sings it wrong came here once. Before.
MARA (chip): Julian?
POPPY (bubble) [curious]: Older than him. He sang it all wrong.
```

---

## Chapter VI — The Baroness Pays a Call

```
### ch6 — The Baroness Pays a Call
@level ~50
@teaser You can hear her car from the road.
@change villager:isolde · counter:4 (window boxes full)
```

```
#### ch6.s1 · room: stand · faces: mara, isolde
ISOLDE [happy]: Mara Vance. At last. I've heard SO much.
MARA [curious]: I'm sorry, have we—
ISOLDE [soft]: Isolde Ferrand. The village calls me the Baroness. I let them.
ISOLDE [happy]: Tuesday. Second place. I bought a bottle from the judges' table.
MARA [surprised]: You're the one who bought it?
ISOLDE [sly]: I buy everything that surprises me. It's a short list.
ISOLDE [neutral]: My house makes perfume. In the city. Since 1911.
ISOLDE [happy]: Come to the Scent Prize. As my guest.
MARA [dry]: I don't really own a dress for that.
ISOLDE [laugh]: Then we'll find you one. Say yes.
ISOLDE [curious]: And that little flower in the middle. Is she for sale?
MARA (think) [neutral]: She said "she."
```

```
@card A week later
#### ch6.s2 · room: stand · faces: mara, wren
WREN [curious]: Your counter smells of money today. Who came?
MARA [neutral]: Isolde Ferrand.
WREN [neutral]: ...
MARA [curious]: You know her.
WREN [neutral]: Everyone on the road knows her.
MARA [curious]: And?
WREN [dry]: And nothing. Lovely woman. She's also never lost.
MARA [worried]: She's invited me to the Scent Prize.
WREN [neutral]: Then go. Keep your eyes open.
WREN [soft]: One more thing. I hear things on the road.
WREN [neutral]: Your cousin owes House Ferrand.
MARA (think) [cross]: Of course he does.
```

```
#### ch6.after
POPPY (bubble) [dry]: She had a garden once too, you know. She sold it.
```

---

## Chapter VII — What the Flower Won't Say

```
### ch7 — What the Flower Won't Say
@level ~80
@teaser Poppy's remembering something.
@change counter:5 (a child's night-light on the counter, lit — nothing announces it)
```

```
#### ch7.s1 · room: garden · faces: mara, poppy
POPPY [curious]: Mara. I remember a kitchen.
MARA [soft]: What kind of kitchen?
POPPY [curious]: Oranges. Warm milk. A radio that only did one station.
MARA [surprised]: That's... specific.
POPPY [soft]: And hands. Somebody's hands, very close up.
POPPY [curious]: And a wall with flowers painted on it. Halfway.
MARA [curious]: Why halfway?
POPPY [worried]: Somebody stopped.
MARA [neutral]: That's not your kitchen, Poppy.
POPPY [dry]: I know. I'm a flower. I've checked.
MARA (think) [worried]: Gran's kitchen had a radio like that.
```

**Beat 4. Silence is the rule: no thought bubble, nobody names what the room was** (doc 55 §4, §5).

```
@card That evening
#### ch7.s2 · room: stand · faces: mara, theo
THEO [neutral]: Cleared the east wing.
MARA [neutral]: And?
THEO [neutral]: One room. Flowers on the wall. Half done.
MARA [neutral]: ...
THEO [soft]: Found this. Still works.
  — Theo sets a small night-light on the counter; it glows —
MARA [neutral]: ...
THEO [neutral]: I'll leave it here.
```

```
#### ch7.after
POPPY (bubble) [soft]: There was a baby in that room. Not me. Before me.
```

---

## Chapter VIII — Not Yet

```
### ch8 — Not Yet
@level ~110
@teaser The Scent Prize.
@change counter:6 (Gran's music box) · record-if-built: gran-lullaby (song-only)
```

```
@card The Scent Prize
#### ch8.s0 · room: stand (a city backdrop is new art — flagged; the Stand blurred until then) · faces: mara, isolde
ISOLDE [happy]: You came! And the dress. Delphine?
MARA [dry]: Delphine.
ISOLDE [laugh]: Brave woman.
ISOLDE [neutral]: I'll be quick. I don't like asking twice.
ISOLDE [soft]: Sell her to me. She'd have the finest glasshouse in Europe.
MARA [neutral]: She has a glasshouse.
ISOLDE [sly]: With a roof?
MARA [dry]: Mostly.
ISOLDE [neutral]: Julian's debt, gone. Your roof, done. Think about it.
MARA [neutral]: I don't need to.
ISOLDE [curious]: ...Who's that? The little table, by the door.
MARA (think) [curious]: She's stopped looking at me.
```

```
@card The morning after the Scent Prize
#### ch8.s1 · room: stand · faces: mara, julian
JULIAN [tired]: She'll write. She always writes after.
MARA [neutral]: She already has.
JULIAN [worried]: How much?
MARA [dry]: Everything you owe. And a new roof for the glasshouse.
JULIAN [sad]: That's... a lot of roof.
MARA [neutral]: I said no. Twice now.
JULIAN [surprised]: You said no? To HER?
MARA [neutral]: I said no.
JULIAN [soft]: Good. Don't tell her I said that.
JULIAN [curious]: Did you see the little house? Last table, by the door?
MARA [curious]: I took their card. Why?
JULIAN [worried]: Isolde couldn't stop looking at it.
MARA (think) [curious]: Neither could I.
```

```
@card That night
#### ch8.s2 · room: garden · faces: mara, poppy
  — a board lifted under the counter: Gran's music box, where the tin used to hide; Mara sets it out,
    and the little house's card beside it —
MARA [soft]: Look what was under the floor. Where the tin was.
POPPY [surprised]: Wait. Bring that closer.
MARA [curious]: It's just a sample. From the Prize.
POPPY [surprised]: That one's Gran's.
MARA [soft]: Gran's gone, Poppy.
POPPY [worried]: Somebody made it. This year. Not before.
POPPY [soft]: She's got grey in her hair now.
MARA [surprised]: Who has?
POPPY [soft]: The girl from the room.
MARA [worried]: Where is she?
POPPY [sad]: I don't know. Not yet.
@card End of Volume One
```

---

## Between chapters — memory slivers

**Poppy's bubble, one line, no art. In order, never skipped, one a day at most** (doc 55 §4, §6). Each
is bound to a level in its window; the spec places them. Numbers are ids.

| id | window | line |
| --- | --- | --- |
| m01 | after ch1 | There are more seeds in the tin. They've got labels. Frost. Leaves. Thaw. *(plants Holly, `[FALL HERO]` and `[SPRING HERO]` — one seed each; the hero pass may reword)* |
| m02 | ch1–ch2 | Someone used to cut the roses on Sundays. |
| m03 | ch2–ch3 | The bees know me. That's odd, isn't it? |
| m04 | ch2–ch3 | Too much rose and it's a funeral. Somebody said that. |
| m05 | ch3–ch4 | Vanilla goes in last. Always last. |
| m06 | ch3–ch4 | Somebody wrote tiny numbers on all the labels. |
| m07 | ch4–ch5 | Rain on glass sounds like clapping. |
| m08 | ch4–ch5 | I know how to count to twelve in French. Who taught me that? |
| m09 | ch5–ch6 | There was a cat. Grey. It didn't like anyone. |
| m10 | ch5–ch6 | I dreamt about a blue door. |
| m11 | ch5–ch6 | Somebody burnt the toast. Every single morning. |
| m12 | ch5–ch6 | I remember snow. I've never seen snow. |
| m13 | ch6–ch7 | Somebody said "clever girl." Not you. You don't say clever. |
| m14 | ch6–ch7 | A train. Somebody waving. I don't know who was on it. |
| m15 | ch6–ch7 | There was a blanket with ducks on. Yellow ducks. |
| m16 | ch6–ch7 | There was a swing. It squeaked on the way back. |
| m17 | ch7–ch8 | Somebody kept buttons in a biscuit tin. Hundreds. |
| m18 | ch7–ch8 | She wrote letters and never sent them. A whole box. |
| m19 | ch7–ch8 | Somebody's still waiting for a letter. I think. |
| m20 | ch7–ch8 | The little one smelled of warm milk. And rain, somehow. |

---

## Between chapters — story lines

**Texture, one bound to almost every level with no chapter. When several are owed, only the newest
plays; two a day at most** (doc 55 §6). Poppy's voice ages by window: toddler (to ch2), child (ch3–ch5),
wry (ch6 on). The spec binds each to a level in its window.

**ch1 → ch2**
- Delphine waved at you. I waved back.
- Is the Stand ours? All of it?

**ch2 → ch3**
- Theo talks to the meadow. More than to you.
- The bell sounds different for new people. Higher.
- Can I have a ribbon? For nothing? Just to have.

**ch3 → ch4**
- Delphine says hello to me every time. She doesn't know she does it.
- The sign's so shiny. People keep stopping to look.
- Miss Marigold straightened a pot. Our pot. Without asking.
- Is Theo married? Delphine wants to know. Not me. Delphine.
- I'm getting bigger. Look. No, properly look.

**ch4 → ch5**
- Tuesday's sold out. Delphine bought four. She says they're presents.
- Old Hollis nodded at me. He doesn't nod.
- Bram gave me a crumb. I can't eat crumbs.
- Everyone keeps saying "the Vance girl." They mean you.
- The ribbon's crooked. Miss Marigold will hate that.
- Wren smelled everything at the Stand. Even the till. Is that normal?
- Can we make a perfume called Wednesday? For balance.

**ch5 → ch6**
- Julian came back. He bought the cheapest thing again.
- Julian was nice today. He forgot to show off.
- Somebody drove past very slowly. Twice.
- Delphine thinks Julian's handsome. I think his shoes are too pointy.
- Theo fixed the gate.
- Wren says my smell is "impossible." I think that's good?
- Do you think I'll be tall? Holly says I won't. `?met:holly`
- Bram's selling poppy-seed buns now. I'm choosing not to be offended.
- Julian asked what I'm worth. To the bees. As a joke.
- I don't think it was a joke.
- Old Hollis says Gran's bees remember everything. So do I. Sort of.
- You laughed at Bram today. Out loud.
- Delphine brought a man to look at me. I didn't like his glasses.
- The letters from the city have a gold stamp on the back.
- I like the show more than the garden. Don't tell the garden.
- Wren left a little bottle on the counter. It smelled like a library.
- Theo says the glasshouse roof leaks "a bit." It leaks a LOT.
- Julian fell asleep in the meadow. Theo put a sack over him.
- Holly says hello. She didn't. But she thought it. `?met:holly`
- Miss Marigold smiled at something. I missed it. Delphine saw.
- I'm not little anymore, you know. I'm medium.
- Did Gran ever lose? At anything?

**ch6 → ch7**
- Why would Isolde send US flowers?
- Delphine is VERY excited about the dress. More than you.
- Wren keeps saying "be careful" and then changing the subject.
- A man in a grey coat bought nothing and asked a lot.
- Julian says sorry now, in advance. For things he hasn't done yet.
- Theo oiled the glasshouse door. It still squeaks. He's furious.
- The gold stamp letters. You keep the gold stamp ones in a drawer.
- I'm told I'm "a very rare specimen." I'm told a lot of things.
- Bram's buns are getting worse.
- You've started talking to me when Delphine's here. She thinks it's sweet.
- Old Hollis said Gran cried in the glasshouse once. Then he said nothing else.
- Isolde sends the postman a birthday card. Every year.
- The city smells like wet stone and money, Wren says.
- Julian brought his own lunch today.
- Tuesday's on a shelf in the city. A real shop.
- Holly says the city's overrated. Holly's never been anywhere. `?met:holly`
- Delphine's started wearing Tuesday. The whole lane smells of it.
- I dreamt about the kitchen again. The radio was on.
- Has somebody been in the east wing?
- Mara, what did you want to be? When you were small?
- Fine. Don't tell me. I'll find out. I find things out.
- The bees are louder near the east wing. I don't know why.

**ch7 → ch8**
- The little light's still on. Theo checks the bulb every morning.
- Julian doesn't joke about the light. Not once.
- Isolde's letters have got shorter. That's a bad sign, Wren says.
- The Scent Prize is in the city. I can't come. I've got roots.
- You'll tell me everything? Every single thing?
- Delphine's lending you earrings. She says it's "non-negotiable."
- Wren says the Prize is mostly speeches. Wear flat shoes.
- Theo said good luck.
- Somebody new has been asking about Gran. In the city.
- Julian's paid Bram back. For the buns. From ages ago.
- Miss Marigold says we're "a credit to the village." Then she sniffed.
- Tuesday's in a magazine. Delphine's framed the page. The WHOLE page.
- I've been thinking about the girl in the room. A lot.
- Holly says I think too much. Holly's a rose. What does she know. `?met:holly`
- Isolde sent a car to "take measurements." Theo sent it away.
- Old Hollis showed me a bee up close. It had fuzzy knees.
- The music box. Did Gran have a music box?
- I can smell rain in the city from here. Is that possible?
- Delphine wants a picture of me for the Stand. I'm not ready.
- Wren found an old Prize list. Gran's name, over and over.
- Are the bees nervous? They sound nervous.
- I'm not scared. Are you scared?

**after ch8 — waiting for volume two**
- I keep smelling her card. It hasn't changed.
- Grey hair. Somewhere with wet stone. That's all I've got.
- Wren's asking around. Quietly. Wren's good at quietly.
- Isolde hasn't written. Wren says that's worse.
- Julian keeps saying "soon." Soon what?
- The little light and the music box. They look nice together.
- I think she's looking for us too. I don't know how I know.
- Not yet. But soon. Probably. Maybe.

---

## The villagers

`greet`, `waiting` and `delivered` lines feed the order strip and the Stand sheet exactly as `CUSTOMERS`
does today (`data.js`). **New villagers arrive with their chapter**; **chapter-keyed lines** join an
existing villager's pools once that chapter has been seen — a new data shape, since `lines` are fixed
arrays today (doc 55 §6).

### Delphine — arrives at ch1

- **greet:** Morning! Don't tell anyone I'm here. I'm meant to be at Pilates. · I've got ten minutes and SO much to say. · Oh, it smells gorgeous in here. As usual.
- **waiting:** No rush. I'll just stand here being nosy. · Is that new? Don't answer. I know it's new. · I'll wait. I'm brilliant at waiting. Ask anyone.
- **delivered:** You're a genius. I'm telling everyone. · Perfect. Well, nearly. No, perfect. · Right, that's going on the good table.
- **after ch2:** Have you met Theo? Properly? He said four words to me once. Years ago.
- **after ch4:** Tuesday! Four bottles. They're presents. Mostly.
- **after ch5:** Your cousin's lovely. Hide your handbag.
- **after ch6:** A DRESS. For the city. I'm coming shopping, don't argue.
- **after ch8:** You said no to HER? I'm telling everyone. Quietly.

### Theo — arrives at ch2

- **greet:** Morning. · Brought the barrow back. · Meadow's looking better.
- **waiting:** No hurry. · I'll wait. · Weeds aren't going anywhere.
- **delivered:** That'll do. · Good. Thanks. · She'd have liked that.
- **after ch3:** Sign's holding up.
- **after ch4:** Hollis says you've got the nose. High praise, from him.
- **after ch5:** Your cousin was in the meadow again. Asleep.
- **after ch7:** Checked the bulb. · Morning. Light's still on.

### Julian — arrives at ch5

- **greet:** Mars! Don't look at me like that. · Just passing. Honestly. · I come bearing no gifts, sadly.
- **waiting:** Lovely place. What's it worth? Joking. JOKING. · Take your time. I've got nowhere to be. Literally. · I'll pay you back. For this. Eventually.
- **delivered:** You're too good to me, you know that? · Brilliant. Don't tell Mum I was here. · Right. That's one thing I haven't ruined.
- **after ch6:** Isolde says to tell you hello. She made me write it down.
- **after ch7:** Nice light. I won't ask.
- **after ch8:** Brought my own lunch. Don't make a thing of it. · I owe you one. A big one.

### Isolde, the Baroness — arrives at ch6

- **greet:** Mara. You look like someone who's been working. · I was passing. I'm never passing, but I was. · Show me what you're proudest of.
- **waiting:** Take your time. Quality takes time. · Is that honey I can smell? Local? · What's that one? No, don't tell me. Let me guess.
- **delivered:** Exquisite. Truly. · My driver will collect the rest. · Your grandmother would have bought that one.
- **after ch6 (before the Prize):** You haven't answered me, Mara. I'm patient. For a while. · Have you found a dress? Delphine is not a stylist.
- **after ch8:** You turned me down. Nobody turns me down. · Who was that little house by the door? You'd tell me. Wouldn't you?

### Existing villagers — chapter-keyed lines

- **Bram, after ch4:** Heard about Tuesday! Can I sell it with buns? · Folk from the city were asking about your seed. Just so you know. · I told them I sell buns. Which is true.
- **Miss Marigold, after ch4:** Second place. Acceptable. For a first attempt. · I shall be watching the scent class. Closely.
- **Old Hollis, after ch4:** Wax holding up? · Bees are busy. Good sign.
- **Wren** (existing customer, minTier 3 — becomes the travelling perfumer): **greet:** Three villages over, they told me about you. *(shipped)* · Can I smell it? Sorry. Occupational hazard. **delivered:** Now that's worth carrying. *(shipped)* · That one's going to follow me for days. **after ch6:** Careful with Isolde. That's all. I'm done.

---

## The welcome-back board

**After three or more days away: one line from the villager who arrived most recently — nothing more**
(doc 55 §6). Never guilt: nobody asks where you were, and Poppy never suffers for it (ruled 2026-09-26);
Poppy's own hello is her ordinary `greet`.

- **Delphine:** THERE you are. I've got so much to tell you. · Don't worry, I kept an eye on things. Both eyes.
- **Theo:** Watered the lot. · Morning. Meadow's fine.
- **Julian:** Mars! I thought you'd moved to the city without me. · I minded the Stand. Well. I stood near it.
- **Isolde:** Mara. I've missed you. I don't say that often. · The city's been dull. I blame you.
- **Wren:** Back? Good. I brought you a new smell from the road.

---

## Poppy's voice — the lines that change in `FLOWER_LINES`

The rest of her mood buckets stay as shipped (doc 55 §5). These are the replacements, for the next fix
round:

| Bucket | Shipped line | Becomes |
| --- | --- | --- |
| greet | Well hello, gardener! | Mara! You're here! |
| greet | You came back! | Oh good. It's you. |
| greet | The soil missed you. | Morning, Mara. The soil says hi. |
| greet | Ready to grow something? | Ready? I'm ready. I was born ready. |
| tap | Ooh, do that again! | Ooh, a coin! |
| tap | Keep it coming! | Coins, coins, coins. |
| tap | Tickles! | Ha! Got one. |
| harvest | The basket runneth over! | Look how full it is! |
| idle | Tap me if you get bored. | I'm bored. Are you bored? |
| broke | Tap me for pocket change! | Coins, please. Lots. |
| tap | More petals, please! | Another one! |
| tap | That is the spirit! | Shiny! |

**At a Turn after the first — flavour, never story** (one per stage):

- toddler: I'm bigger! Look! No, LOOK.
- child: I think I'm taller this Year. Don't measure.
- wry: Another Year. I'm aging beautifully, thank you.

---

## Holly — the three lines that change (ruled 2026-09-27)

| Shipped | Becomes |
| --- | --- |
| It's not cold. He is just soft. | It's not cold. She is just soft. |
| He gets a tutorial. I get a season. | She gets a tutorial. I get a season. |
| He would not last a night out here. | She would not last a night out here. |

---

## The human-pass brief — for the writer who makes these words ship

**What this is.** A complete draft in the right shape, so the engine can be built now. The words are
the desk's. Your job is to make every one of them sound like a person wrote it, because one did.

### Load-bearing lines — keep the content, change every word if you like

These carry the plot, the mystery or the thread. Their *information* must survive; their wording is yours.

- **ch1:** the question and the answer (*mama*; *"I'm Mara"*); Poppy naming herself; the hum and *"Somebody
  used to sing me that"*; *"Then we'll open it"*; Gran's note, especially **not even to family**.
- **ch2:** Theo kept the tin for Gran; the locked door at the back of the glasshouse, and nobody has the key.
- **ch3:** Gran won eleven years and stopped; nobody could name how she smelled; **the practised answer**
  and Mara's thought after it — the whole of beat 2 (it must stay small); *"the year the tin got locked."*
- **ch4:** the scent class was closed because Gran kept winning; Hollis kept her wax; the first perfume is
  called Tuesday; a Radiant wins; Marigold asks where the seed came from; Bram's warning about the city.
- **ch5:** Julian lost the garden and asks about the tin; **the lullaby, stopped mid-bar** — beat 3;
  *"the man who sings it wrong."*
- **ch6:** Isolde's house makes perfume; the invitation to the Scent Prize; *"is she for sale?"*; Julian
  owes House Ferrand.
- **ch7:** the memories come as smells — oranges, warm milk, a radio, a wall painted halfway; **Theo and
  the night-light, in silence** — beat 4. No thought bubble. Nobody names the room.
- **ch8:** the offer and the no; the little house by the door; **"That one's Gran's… grey in her hair…
  not yet"** — volume two's hook.
- **Every memory sliver (m01–m20)**, in order. They are the mystery's clues; each can be reworded, none
  can be dropped without replacing its clue.

### Texture — cut, replace or rewrite freely

The ~90 story lines, the villagers' greet/waiting/delivered pools, the chapter-keyed villager lines, the
welcome-back board, and Poppy's re-voiced shop lines. If a line doesn't make you smile or wince, cut it.

### Voice notes — five lines each

**Mara.** Mid-thirties, dry, capable, a little tired. Answers questions with shorter questions. Jokes to
change the subject. Never says how she feels; her thoughts do, barely. Kind to Poppy without ever
calling herself anything.

**Poppy.** Grows up across the volume: toddler (ch1–2) asks and repeats; child (ch3–5) has opinions and
bad facts; wry (ch6–8) notices adult things and says them flat. Never cute on purpose. Never sad for long.
Talks about smells before she talks about feelings.

**Delphine.** Talks in runs, then corrects herself. Gossip as love. Buys too much of everything. Divorced,
and funny about it exactly once. Never pries twice.

**Theo.** Two to six words. Says what he did, not why. Kindness is always a thing he fixed. Loyal to Gran
past the point of sense. Never flirts; the reader does it for him.

**Julian.** Charming first, honest second, sorry third. Calls her "Mars." Money jokes that are not jokes.
Better than he lets anyone see. Never the villain.

**Isolde, the Baroness.** Warm, precise, generous — and always one step ahead. Compliments with a hook in
them. Says your name a lot. Wants things the way collectors want things. Never cruel, never crude.

**Wren.** A nose: talks in smells. Direct, curious, a traveller who doesn't stay. Warns once and then
drops it. Knows the trade's gossip and won't say how.

**Bram.** Jokes, buns, trades. Plays the fool and isn't one. The warning comes after the joke.

**Miss Marigold.** Clipped, formal, "Miss Vance." Compliments disguised as complaints. Standards.

**Old Hollis.** Bees, wax, silence. Three words where others use ten. Remembers Gran young and won't
tell it all.

**Holly** (unchanged, doc 46). Deadpan, superior, secretly devoted; her sass aims at her sister, never
at Mara.

### The ten lines the desk is least sure of

1. **ch1 chip — "No, sweetheart. I'm Mara."** The one Mara line that sounds like a mother. It is the
   bible's, and it gives the player a warmer tone to choose; it may still be one step too close.
2. **ch6.s1 — Mara's thought: "She said 'she.'"** The best clue in the chapter if it lands, invisible if
   it doesn't. Test it on someone who hasn't read the bible.
3. **ch5.s2 — "Gran sang it. In the kitchen. I was five."** Mara's thoughts rarely give facts; this one
   gives a memory. It is about Gran, not the wound, so it stays inside the rules — but it is the most
   open Mara gets.
4. **ch7.s2 — the whole scene.** Eight lines, four of them silence. It is right on paper; it needs the
   scene system's timing to work, and a writer may want one more beat of Theo.
5. **m15 — the blanket with yellow ducks.** The one baby object left among the slivers. Keep one; this
   is the one the desk kept.
6. **ch8.s0 — "Sell her to me. She'd have the finest glasshouse in Europe."** Isolde must want to *own*
   Poppy, never harm her. This line does that; any rewrite must too.
7. **"Hide your handbag."** (Delphine, after ch5) British-leaning. The game's voice leans that way
   (Nan, Old Hollis, "love"); the owner should decide how far.
8. **"The man who sings it wrong came here once. Before."** A volume-two hook (Julian's father) that
   volume one never pays. Fine for a sliver; a writer should know it is a promise.
9. **Poppy's welcome-free absence.** The board now carries only the villager's line. If Poppy's
   silence on return feels cold in play, give her a `greet` line that is glad, never pining.
10. **"The yellow one."** Holly's shipped lines call Poppy yellow. Poppies read red to most players; the
    art decides. A yellow poppy exists (the Welsh poppy), so the line can stand if she is drawn yellow.

---

## The count, and what the critic changed

About **3,300 words** of player-facing text against doc 55 §8's budget of ~4,200. It came in short on
purpose: the lane's lines are shorter than the bible estimated, and the critic cut repetition rather than
adding. Chapter I ~190 (doc 55 §7, verbatim); chapters II–VIII ~1,650 across sixteen scenes and their
bubbles; memory slivers ~190; story lines ~830; villagers ~500; welcome-back ~90; changed shipped lines
~120.

**One independent critic read the whole draft** against doc 55 §4, §5, §7 and the shipped voices, and
everything it found was fixed once:

- **Rule breaks:** two story lines implied Poppy was bottled (cut — no character flower is ever a scent);
  Mara's *"Never quite got round to it"* gave a reason for her childlessness (now *"No. No kids."*); a
  Poppy line on the welcome-back board had her counting the days (the board carries the villager only,
  per doc 55 §6); four slivers stacked grief (three became plain domestic memories — toast, a swing,
  buttons in a biscuit tin); two more slang-risk tap lines; a remark on Mara's looks from the fashion
  house; "the Year" capitalised in the Turn's ask; "last spring" (a season word) gone.
- **Machine tells:** one comic shape used by everyone — *"X. Well. Smaller X."* six times, *"Twice."* as
  a punchline three times, *"That's a lot of X"* four times, *"I noticed"* six times — cut to one each;
  balanced epigrams rewritten plainly; about a third of the story lines stripped of their tag endings.
- **Voice:** toddler Poppy lost a teenager's *"Like,"*; Miss Marigold lost her contractions; Old Hollis
  got his *"Aye"*; Wren got the road back; Delphine lost a real year.
- **Story:** the Scent Prize now plays on screen (ch8.s0); the music box is found, not just placed; the
  night-light scene ends on Theo, with no word from Mara; the show's results arrive in person from Miss
  Marigold and Bram's warning moves to his own lines; *"the tin got locked"* became *the door*; one
  eleven, not four; Holly's lines wait until she has been met.

**The three scenes the critic named as landing hardest:** ch3.s2 (Delphine's question, the practised
answer, *"Said that well."*), ch7.s2 (the night-light), and ch8.s2 (*"She's got grey in her hair now."*).
Weakest before the fix: ch6.s2 (Wren) and ch4.s3 (the show) — both rewritten.

**Still owed, and not this document's to invent:** `[FALL HERO]` and `[SPRING HERO]`'s own lines
(`[FALL HERO]` meets Mara when Fall's board first opens, `[SPRING HERO]` when Spring's does — their pass
writes them); the perfumery's lines (its own spec — doc 55 §9 questions 18–21); a city backdrop for
ch8.s0 (new art); Old Hollis's shipped *"Patience is the whole trade, lad."* now that the lead is a woman
(the next fix round: *"…trade, lass."*); and the human pass over all of it.
