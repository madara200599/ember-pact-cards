[![Ember Pact](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/madara200599/ember-pact-cards/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/madara200599/ember-pact-cards/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Pact — an original card duel

A complete, original card game that plays offline in a desktop browser from its
own static files. No libraries, no network requests, no build step.

## The game

You are an emberkeeper duelling a rival — Vex the Cinder — for the pact. Each
round you both play one card from a hand of five onto the table. The stronger
card takes the trick, deals damage equal to the difference (capped at 8, so no
single trick ends the match), and earns renown.
First to burn the rival's 20 life to zero wins; if ten rounds pass, the higher
life wins, then the higher renown.

**Four suits, told apart by colour and shape:** Ember (red flame), Tide (blue
drop), Thorn (green leaf), Gale (gold swirl). Every card has a power (1–9) and
an ember cost (1–3); strong cards cost more, and your ember pool refills only
two a round — so every hand is a decision about what to spend and what to save.

**Combos, more than one way to combine cards:**

- **Chain** — play the attuned suit (the suit of the last trick's winner) for +3.
- **Surge** — a cost-3 card doubles its power.
- **Pact** — match the rival's previous card power to seal a pact: +2 renown and a fresh card.
- **Rising Embers** — from round 5, every card is +1.

**A readable, counterable rival.** Before you commit, the table shows a tell
naming the suit the rival leans toward (honest about 7 times in 10), and its
ember pool is on display, so you can work out what it can afford. The rival
counters your last suit, chases chains, saves its Surge cards when behind and
presses when ahead — and it plays tighter from round 5.

**Feel.** Cards slide from the deck, flip face-up on the table and snap into
their slots; a trick win lands with sparks, a match win with an ember-burst
flourish and a rising arpeggio. Sounds are synthesized live with WebAudio —
no audio files.

## How to play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and click to begin. Click a card you can afford to play
it, or press 1–5. `M` mutes the sound. Play again from the win or loss screen
with a click.

## Structure

The game's own source is split into files with one clear job each under
`game/src/`:

- `config.js` — suits, colours, table geometry, rule numbers
- `deck.js` — cards, the 36-card deck, shuffle and draw
- `rules.js` — trick resolution, combos, scoring and damage
- `ai.js` — the rival's brain: card choice, tells and quips
- `state.js` — the match state machine (title → deal → choose → reveal → resolve → won/lost)
- `render.js` — the canvas table, cards, HUD, title/win/loss screens
- `animate.js` — slide/flip/snap tweens and ember particles
- `audio.js` — synthesized WebAudio sounds
- `input.js` — mouse and keyboard
- `shots.js` — deterministic screenshot presets (`?shot=title|play|combo|win|loss`)
- `main.js` — the boot: canvas, frame loop, wiring

`main.ts` at the repo root hands the game in with the vendored make.fun
library (`vendor/makefun-game.ts`, copied unchanged from the kit).

## Screenshots

Four real renders of the game's own code, in `screenshots/`: the title screen,
a mid-play table, the signature Surge + Chain combo resolving, and the win
screen. The loss screen is reachable in play (lose a match) and is covered by
the `?shot=loss` preset.

---

Entered via referral code r7k9dyj1
