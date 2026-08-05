
# Idle Garden Reborn — GDD (Tap + Grow Edition, PPP Currencies)

## Overview
Hybrid idle + clicker garden. One **central tap flower** is always tappable (active income), surrounded by passive **seed plots** that grow over time (idle income). Economy uses **the same currencies as Party, Party, Party**: **Credits**, **Tickets**, and **Gems**.

**Genre:** Idle / Clicker / Hybrid Incremental  
**Platform:** Web (mobile-first, iPhone 16 portrait)  
**Stack:** HTML + CSS + JavaScript (no engine)  
**Camera:** Static top-down

---

## Core Loop
1. **Tap Central Flower → Earn Credits (and occasional crits).**  
2. **Plant Seeds in Surrounding Plots → Grow → Harvest Credits (+chance for Tickets/Gems).**  
3. **Spend Credits on Upgrades/Seeds/Decor; Spend Tickets on Boosters/Events; Spend Gems on Premium/Skips.**  
4. **Repeat with better multipliers, more plots, and faster growth.**

---

## Layout
```
[P] [P] [P]
[P] [F] [P]
[P] [P] [P]
```
- **F = Central Flower** (infinite tap target).  
- **P = Plots** (idle growth). Start with 4 unlocked; expand to 8+.

---

## Currencies (PPP-Aligned)

| Currency | What | Earned From | Primary Sinks |
|---|---|---|---|
| **Credits** | Soft currency; base economy unit | Taps, Harvests, Quests | Seeds, plot unlocks, tap/idle upgrades, basic decor |
| **Tickets** | Session/event currency | Crit drops (rare), harvest milestones, dailies | **Boosters**, limited-time **Events**, **Chest pulls** (seeds/decor shards), **Mini-bursts** |
| **Gems** | Premium currency | Rare crits, legendary harvests, achievements | Premium decor/skins, time-skips, high-tier upgrades |

**Notes**
- Tickets are *not* premium: they’re time-/play-gated and power burst–oriented.  
- Gems are premium/rare; avoid P2W—tie to cosmetics, convenience, and small global bonuses.

---

## Tap System (Central Flower)

| Stat | Default | Notes |
|---|---:|---|
| **Tap Power** | 1 Credit/tap | +1 per Tap Power level |
| **Crit Chance** | 5% | Additive increases via upgrades & decor |
| **Crit Multiplier** | ×10 | Upgradable; caps at ×50 |
| **Soft Tap Cap** | ~10 taps/sec | Buffer queue smooths bursts |

**Crit Rewards**
- On crit: award `Credits × Crit Multiplier` + small chance to drop **1 Ticket** (3%) and **1 Gem** (0.3%).  
- Visuals: burst particles + bounce + gold number popup.

---

## Plots & Seeds (Idle)

**Plot States:** Locked → Empty → Growing → Ready → (Auto-Harvest if enabled).

| Seed | Cost (Credits) | Grow Time | Base Yield (Credits) | Legendary Drop | Emoji |
|---|---:|---:|---:|---|:--:|
| **Daisy** | 50 | 15s | 40 | — | 🌼 |
| **Rose** | 250 | 30s | 200 | 0.5% = 1 Gem | 🌹 |
| **Orchid** | 1,000 | 90s | 900 | 1.0% = 1–2 Gems | 🪷 |
| **Sun Lotus** | 2,500 | 5m | 3,000 | 2.0% = 2–3 Gems | 🌻 |

- **Cosmic Bloom Tier (Late Game):** Extends the seed catalog to 100,000 credits with built-in premium drop rolls.

| Seed | Cost (Credits) | Grow Time | Base Yield (Credits) | Gem Drop | Ticket Drop | Emoji |
|---|---:|---:|---:|---:|---:|:--:|
| **Nebula Orchid** | 20,000 | 9m | 28,000 | 0.8% | 0.3% | 🌠 |
| **Solstice Lily** | 35,000 | 10m | 49,000 | 1.0% | 0.4% | ☀️ |
| **Aurora Crown** | 52,000 | 11m | 72,800 | 1.2% | 0.5% | 🌈 |
| **Mythic Starflower** | 75,000 | 12m | 105,000 | 1.5% | 0.6% | 🌟 |
| **Eternal Crown** | 100,000 | 13m | 140,000 | 2.0% | 0.8% | 💫 |

- **Rarity on Harvest** (time-independent): Common 70% ×1, Rare 20% ×2, Epic 8% ×4, Legendary 2% ×8.  
- **Tickets from Harvests:** milestone rule: every **N ready harvests** (per session) yields **+3 Tickets** (N defaults to 10; tuneable).  
- **Decay:** If auto-harvest is off and a plant sits >2× grow time, yield −20% (keeps flow snappy).

---

## Upgrades

### Tap Upgrades (Credits unless stated)
| Upgrade | Effect | Cost Curve |
|---|---|---|
| **Tap Power** | +1 Credit/tap | 100, 200, 400, 800… (×2) |
| **Crit Chance** | +1% (additive) | 500, 750, 1,125… (×1.5) |
| **Crit Multiplier** | +2× (max ×50) | 1,000, 2,000, 4,000… (×2) |
| **Tap Combo Meter** | +1% Credits per 10 taps (max +50%) | 2,500, 5,000… |

### Idle Upgrades
| Upgrade | Effect | Cost |
|---|---|---:|
| **Auto-Harvest** | Harvests ready plots (each frame) | 5,000 Credits |
| **Global Fertilizer** | −10% grow time (stacks additively) | 750 Credits each |
| **Plot Expansion** | Unlocks +2 plots | 2,000 → 4,000 → 8,000 Credits |
| **Seed Mastery** | +10% yield for one seed type | 1,500 Credits/seed |

### Premium / Tickets Upgrades
| Upgrade | Currency | Effect | Cost |
|---|---|---|---:|
| **Gem Booster** | Gems | +0.1% Gem drop on crit (cap +1%) | 300 Gems/level |
| **Ticket Booster** | Tickets | +10% Ticket gain from sources | 50 Tickets/level |
| **Time Skip** | Gems | Instantly completes one growing plant | 15 Gems |

---

## Boosters & Events (Ticket Sinks)

| Ticket Spend | Duration | Effect |
|---|---:|---|
| **Bloom Burst** (25 Tickets) | 30s | +50% Tap Power & +2% Crit Chance |
| **Seed Rush** (20 Tickets) | 10m | −30% grow time on all plots |
| **Fortune Aura** (40 Tickets) | 30m | +50% Rare/Epic/Legend weights on harvest |
| **Golden Popups** (30 Tickets) | 30s | +25% Credits from all sources |

**Event Chest (50 Tickets):** one pull → random rewards (seeds/decor shards, 1–3 Gems, Credits). Pity timer ensures at least one **Epic** item per 5 pulls.

---

## Decorations (AoE Buffs)

| Decor | Currency | Effect | Radius |
|---|---|---|---:|
| **Gnome of Fortune** | 250 Gems | +5% Crit Chance to central flower | 2 |
| **Butterfly Shrine** | 1,000 Credits | −10% grow time (plots) | 3 |
| **Crystal Fountain** | 5,000 Credits | +10% Tap Power & +3% Harvest Yield | 3 |
| **Lantern Tree** | 200 Tickets | +1% Crit Multiplier (global, stacks to +10%) | 3 |

- Effects stack additively; radius measured in tiles.  
- Place anywhere with snap-to-grid; preview ring shows influence area.

---

## Economy Targets & Pacing

**Early Game (0–10 min)**  
- 80% income from tapping; plots teach planting loop.  
- Player reaches Crit Chance 8–10% and buys first Fertilizer.  
- First Ticket booster triggered within 5–7 min (via crits + milestone).

**Mid Game (10–45 min)**  
- 60% tap / 40% idle split; 6–8 plots active.  
- First decor purchased (Butterfly Shrine) and one Event Chest pull.  
- Typical crit frequency ~12–15%; multiplier ~×16–×20.

**Session Bonus Goals**  
- Encourage chaining boosters (Seed Rush → Bloom Burst) for satisfying spikes.  
- Tickets pace the bursts; Gems punctuate with premium choices.

---

## UI (Mobile)
- **Top Bar:** Credits • Tickets • Gems • Settings  
- **Center:** Central Flower (big tappable target, combo meter ring)  
- **Surround:** Plots with progress bars; ready states pulse gently  
- **Bottom Tabs:** Seeds • Upgrades • Decorations • Boosters (Ticket icon)  
- **Popups:** Crit numbers, loot toasts, chest results

---

## Technical Notes
- All numbers data-driven in JS (seed list, upgrade tables, drop rates).  
- `requestAnimationFrame` loop handles tap buffer, growth, auto-harvest, and booster timers.  
- Saves to localStorage; boosters persist through reload if time remains.  
- Haptics (mobile): short vibrate on crit (where supported).

---

## Tuning Knobs (for live balance)
- **Crit Chance & Multiplier curves**  
- **Ticket drop chance** on crit and milestone N  
- **Booster strengths/durations**  
- **Seed grow times & yields**  
- **Decor costs & radius sizes**

---

## Next Implementation Steps
1. Add **Tickets** currency and UI to the existing prototype.  
2. Implement **crit drops** for Tickets/Gems + harvest milestone Ticket grants.  
3. Create **Boosters tab** and timers; wire Ticket spends.  
4. Add **Lantern Tree** and Ticket/Gem Booster upgrades.  
5. Rebalance seed yields and upgrade costs to hit early/mid targets.
