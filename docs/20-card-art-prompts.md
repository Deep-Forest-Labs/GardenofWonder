# Card Art Prompts

Prompts for generating card art externally (Midjourney or similar) and dropping it into the album.
Structure and slots are described in [19-card-album.md](19-card-album.md); the house style these
prompts encode is [05-art-direction.md](05-art-direction.md).

**Nothing here is required.** The album ships with procedural placeholders and works without a single
image. This exists so art can be added when it is wanted, not before.

## How art gets in

`art` on a card is a slot:

```js
art: { icon: 'sprout', tint: '#8ce99a' }   // placeholder, drawn from icons.js
art: { src: 'cards/first-light-1.png' }    // a generated illustration
```

`cardArt()` in `ui.js` renders either. **Swapping one for the other is a data edit**, no code change.

**The web build takes no binary assets** ([09-conventions.md](09-conventions.md)) — that rule stands.
Generated art belongs to the **Unity port**, which has an asset pipeline. The prompts live here so
the two stay in step; the design lab keeps its circles and icons.

## The two approaches

| | Reusable motifs | Per-set art |
| --- | --- | --- |
| Images needed | **9**, cycled across all 12 sets | **108**, nine per set |
| Generation sessions | 1 | 12 |
| Aspect | 1:1, emblem on the card face | 3:4, full-bleed |
| Feel | Clean, systematic, clearly a prototype | Much closer to Monopoly Go |
| Cost per season | Trivial | A real content pipeline |

Start with the nine. They prove the pipeline end to end at a twelfth of the effort, and if the album
turns out not to retain, nothing is wasted.

## Two rules that matter more than the prompt

**Cards render at 46px in the set grid and 96px in the reveal.** That is small. Detail is not just
wasted, it turns to mush. Push for big shapes and few of them.

**Apply the silhouette test** from [17-market-and-positioning.md](17-market-and-positioning.md):
fill the image with pure black and look at it at 64px. If you cannot tell what it is, reject it and
regenerate. This is the single best filter on output quality here.

## Consistency across a set

Generate **one** image first. When you get one you like, take its job ID or image URL and pass it as
a **style reference** (`--sref`) on every subsequent prompt in that batch. Without this, nine images
generated from nine prompts will not look like they belong together, which is the failure mode that
makes generated card art look cheap.

Keep the STYLE block below byte-identical between prompts. Change only the subject line.

---

## A. The nine reusable motifs

Each motif is a **centred emblem** on the card's tinted face — the same job the icons do now.

**They must ascend.** Motif index maps to rarity: 0–2 are Commons, 3–4 Uncommons, 5–6 Rares, 7 the
Legendary, 8 the Mythical. Card nine should feel like the prize; card one should feel like a seed
packet.

### The style block — paste this on every one

```
chunky storybook emblem, bold dark brown outline, flat saturated colour, simple bold shapes,
cosy children's picture book, warm paper palette, clean vector look, high contrast, centred,
generous negative space, plain soft cream background
--ar 1:1 --style raw --s 150
--no text, letters, words, numbers, watermark, signature, photorealism, 3d render, drop shadow,
busy background, clutter, tiny detail
```

### The nine subjects

| # | Rarity | Subject line to prepend |
| --- | --- | --- |
| 1 | Common | `a single small green seedling with two round leaves,` |
| 2 | Common | `one simple white daisy seen from the front,` |
| 3 | Common | `a terracotta plant pot, empty,` |
| 4 | Uncommon | `a single butterfly with rounded wings, wings open,` |
| 5 | Uncommon | `a small jar of honey with a wooden dipper,` |
| 6 | Rare | `a warm glowing paper lantern,` |
| 7 | Rare | `a rounded teacup with a curl of steam,` |
| 8 | Legendary | `a golden four-leaf clover, softly gleaming,` |
| 9 | Mythical | `a radiant star-shaped bloom with light rays behind it,` |

So the full prompt for card five is the subject line, then the style block, then the parameters —
one continuous prompt.

### What to accept

- Readable as a **silhouette** at 64px.
- Outline reads as **dark brown**, not black, and is thick enough to survive downscaling.
- The subject **fills most of the frame** with a little air around it — not a small object in a big
  scene.
- Nine images that look like **one family**. If one is an outlier, regenerate it against the `--sref`
  rather than accepting it.

---

## B. Per-set art — *First Light*

The first set a player meets, and therefore the right one to test with. Nine full-bleed 3:4 scenes.

The mood arc is the point: the set is **a garden waking up**, and the cards should get warmer and
brighter as rarity climbs. Cards 1–3 are cold, blue and quiet. Card 9 is the sun finally on your
face.

### The style block — paste this on every one

```
cosy storybook garden illustration, bold dark brown outlines, flat saturated colour, simple bold
shapes, children's picture book, painterly but clean, warm inviting palette, strong silhouette,
uncluttered composition, no people
--ar 3:4 --style raw --s 250
--no text, letters, words, numbers, watermark, signature, photorealism, 3d render, ui, frame,
border, faces, people, clutter
```

### The nine scenes

| # | Card | Rarity | Subject line to prepend |
| --- | --- | --- | --- |
| 1 | Dawn Chorus | Common | `two small round birds singing on a garden fence at first light, pale blue sky,` |
| 2 | Dewfall | Common | `close view of fat dew droplets on a broad green leaf, cool early morning light,` |
| 3 | The Early Row | Common | `a neat row of young seedlings in dark soil, long cool morning shadows,` |
| 4 | Frost on the Gate | Uncommon | `a wooden garden gate rimed with white frost, still blue dawn,` |
| 5 | Mist Over the Beds | Uncommon | `low white mist lying across quiet vegetable beds, soft pale light,` |
| 6 | Long Shadows | Rare | `long golden shadows stretching across a garden path at sunrise,` |
| 7 | The Watering Can | Rare | `an old metal watering can catching the first warm sunlight, dew on its handle,` |
| 8 | Sunrise Bloom | Legendary | `a single large flower opening to a golden sunrise, petals lit from behind,` |
| 9 | The First Warmth | Mythical | `warm golden sunlight flooding a whole garden at once, radiant and glowing, the moment the cold lifts,` |

### What to accept

- The **arc holds**: laid out in order, they should visibly warm from card one to card nine.
- Card nine should be **obviously the best one**. If it does not read as the prize, regenerate it.
- Each is legible at **96px** — the size it is actually seen at in the reveal.
- No text anywhere. The card name is drawn by the UI over the art; baked-in lettering will collide.

---

## Files and wiring

Export **PNG**, square-cropped for motifs and 3:4 for scenes, **512px on the long edge** — enough for
a 96px reveal on a high-density screen, and small enough that 108 of them do not become a payload
problem later.

Name them predictably, because the wiring reads the name:

```
motifs/motif-1.png … motif-9.png
first-light/first-light-1.png … first-light-9.png
```

Then it is a data edit per card. **One caveat worth knowing before generating 108 of anything:** the
`{ src }` path currently renders a *square* image at the motif's size, which suits approach A. Full
3:4 card art wants to fill the card face instead, which is a small CSS change — ask for it at the
same time as the first batch rather than after.
