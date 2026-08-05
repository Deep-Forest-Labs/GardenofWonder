# Overview

## What the game is

Garden Wonder is a mobile-first idle/clicker hybrid. The screen is a garden: a talking flower in
the centre, eight plots around it, and storybook scenery behind.

Two income streams run at once:

- **Active** — tapping the flower pays coins immediately, with a chance of a critical hit.
- **Idle** — seeds planted in plots mature on a timer and pay out on harvest, multiplied by a
  rarity roll.

Coins buy seeds, plot unlocks, and badges. Badges make taps stronger, growth faster, and
eventually automate both planting and harvesting, which is where the idle half of the genre
takes over.

## Design pillars

**Cosy, not demanding.** Nothing punishes you for leaving. There are no timers you can fail, no
lives, no defeat state. The worst outcome of walking away is that a plot sits ripe.

**Every tap answers.** No input is silent. A tap produces a coin arc, a floating number, a face
reaction, a sound whose pitch climbs with your combo, and a haptic tick. This is the single most
important feel requirement in the project.

**Chunky and readable at arm's length.** Thick dark outlines, high-contrast fills, big shapes.
Every element must survive being viewed on a phone at a glance. If a bloom becomes visual mush
at 22 pixels wide, its art is wrong.

**One screen.** The garden never scrolls and never gets covered except by a sheet the player
deliberately opened. Shops slide up from the bottom and can be flung away.

**A character to keep you company.** The talking flower blinks, tracks the pointer, reacts to
crits, and comments on what you do. It is the difference between a spreadsheet and a place.

## Aesthetic reference

The visual target is modern Nintendo side-scrolling platformers — specifically *Super Mario Bros.
Wonder*. Concretely, this project borrows six things from that reference:

1. **A talking flower companion** that reacts and comments.
2. **The Wonder Effect** — a rare, brief, garden-wide transformation that breaks the normal rules.
3. **A badge system** as the framing for upgrades, rather than a list of stat lines.
4. **A bright storybook palette** with warm paper tones and saturated nature colours.
5. **Bouncy squash-and-stretch motion** on everything that responds to touch.
6. **Confetti and coin bursts** as the reward language.

## Current scope

Built and working:

- Tapping with crits, a combo ring, and gem drops.
- Eight plots, nineteen seeds, four-tier rarity harvests.
- Fifteen upgrade types, four stacking decor pieces, four timed boosters.
- Full automation: eight per-plot harvesters plus a harvest drone.
- The Wonder Effect.
- A talking flower with nine dialogue moods.
- Six-minute day/night cycle with parallax scenery.
- Synthesized sound effects and ambient music.
- Canvas particles, screen shake, floating text, haptics.
- Save with automatic migration from the previous build.
- Two coach marks for first-run onboarding.

Deliberately absent: no accounts, no server, no analytics, no monetisation, no ads, no
notifications. The game is entirely local to the browser.

## Platform assumptions

Portrait phones are the design target; the layout is tuned for roughly 390×844 and adapts down to
short screens and across to landscape. It runs fine on desktop but is not designed for it.

Because it is a static site with relative paths only, it works from `file://`, from any static
host, and from GitHub Pages with no configuration. The one caveat is that Safari restricts
`localStorage` on `file://`, so saves need an actual server there.
