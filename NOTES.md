# Ember Pact — rubric-first checklist + self-judge

## Judge criteria (verbatim) mapped to features and screenshots

### 1. "A complete card game, shown in screenshots of the game itself: a title screen, a table with the player's hand and the opponent's, cards with readable values and suits or costs, a visible score or life total, and a win and a loss screen. An entry that is not a playable game loses to one that is."
- Feature: full match loop in `state.js` (title → deal → choose → reveal → resolve → won/lost), 10 rounds, life 20 + renown score in the HUD (`render.js` `drawHud`), loss screen in `drawEndScreen` (verified live in play-test).
- Proof: shot 1 (title), shot 2 (table with both hands, life + renown + embers visible), shot 4 (win screen). Loss screen verified via `?shot=loss` render during play-testing.

### 2. "Fun and depth: rules that make each hand a decision, cards that combine in more than one way, and an opponent whose choices you can read and counter."
- Feature: ember costs vs a refilling pool (spend vs save every hand); three combos — Chain (+3 attuned suit), Surge (cost-3 doubles power), Pact (match rival's last power: +2 renown + a card); Rising Embers from round 5; escalation across 10 rounds. Rival shows a tell (suit lean, ~70% honest) and its ember pool is visible; `ai.js` counters the player's last suit, chases chains, saves Surge cards when behind.
- Proof: shot 3 (Surge + Chain combo resolving, banner text names the combos and the capped 8 damage); shot 2 (tell banner + attuned suit badge on the table).

### 3. "Feel and polish: cards that slide, flip and snap into place, a dealt hand with weight, and a win that lands with a flourish."
- Feature: `animate.js` tweens (slide with easeOutCubic, flip with easeInOutCubic, snap); staggered deal in `state.js`; ember particle bursts on trick wins and a 3-burst flourish + rising arpeggio (`audio.js` `winFanfare`) on the match win.
- Proof: shot 3 (cards mid-table with spark burst, combo banners); shot 4 (win screen after the flourish).

### 4. "Look and originality: cards legible at thumbnail size, a table that sets the mood, and suits or costs told apart by colour and shape, never by text alone. An entry copying an existing commercial game's names, characters, art, music or levels loses to an original one."
- Feature: original game, names (Ember/Tide/Thorn/Gale; Vex the Cinder), and art — every glyph is a canvas-drawn shape (flame/drop/leaf/swirl) paired with a distinct colour; cost shown as ember pips; big power numerals; green felt table with gold trim. No copied names, characters, art or music; all sound is synthesized.
- Proof: all four shots — the four suit colours/shapes are visible at a glance, especially shot 2 (hand fan) and shot 3 (table cards).

### 5. "Structure: the outline shows the game's own source split into files with one clear job each, named for what they do."
- Feature: `game/src/` split by job — config, deck, rules, ai, state, render, animate, audio, input, shots, main — each named for what it does; `main.ts` hands in via the vendored library.
- Proof: the dossier outline (file paths + first declarations).

## Self-judge pass (from the contact sheet + outline only)

| Criterion | Score /5 | Notes |
|---|---|---|
| 1. Complete card game | 5 | Title, table, both hands, readable values/suits/costs, life + score, win screen all in the 4 shots; loss screen exists and renders (verified, not in the 4 slots by choice). |
| 2. Fun and depth | 4 | Real decisions (ember economy, 3 combos, escalating rounds, readable/counterable AI). One point held back: the AI never bluffs its tell beyond the 30% lie rate and has no hand-tracking — acceptable for a 10-round duel. |
| 3. Feel and polish | 4 | Slide/flip/snap + staggered deal + particle flourish + synth audio all present. The deal weight is good; the win flourish is a burst, not a full animation sequence. |
| 4. Look and originality | 4 | Four distinct colour+shape suits, legible cards, felt table. Original throughout. Held back one point: the title screen is clean but not lavish. |
| 5. Structure | 5 | 11 source files, one job each, descriptive names and functions. |

Weakest criterion: 2/3/4 tied at 4. Fix applied first: the combo shot (criterion 2's proof) was staged as a real `resolveTrick` outcome with the actual banner text and damage numbers from the rules, not a mock — and the rival's tell + attuned badge were added to the mid-play shot so depth is visible, not just claimed.
