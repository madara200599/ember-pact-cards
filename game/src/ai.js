// Ember Pact — ai.js: the rival's brain. One job: choose the rival's card and the
// tell it shows beforehand, so its choices are readable and counterable.
//
// The rival is readable by design: every round it shows a tell naming the suit it
// leans toward (right about 7 times in 10), and its ember pool is on the table, so
// the player can work out which cards it can afford. The rival counters the
// player's last suit and the attuned suit, and from round 5 it plays tighter —
// it saves its big cards when it is behind and presses when it is ahead.

import { SUIT_KEYS, CHAIN_BONUS, SURGE_COST } from './config.js';
import { effectivePower, canAfford } from './rules.js';

// Pick the rival's card from its hand. `ctx` carries everything it may legally see:
// its own hand and embers, the attuned suit, the round, both life totals, and the
// player's last played card (the table is public). It never sees the player's hand.
export function chooseRivalCard(ctx, rng) {
  const { hand, embers, attunedSuit, round, playerLastCard, playerLife, rivalLife } = ctx;
  const affordable = hand.filter((c) => canAfford(c, embers));
  const pool = affordable.length ? affordable : hand.slice();
  if (pool.length === 1) return pool[0];

  const behind = rivalLife < playerLife;
  const ahead = rivalLife > playerLife;
  const tight = round >= 5; // late rounds: the rival plays to win, not to splash cards

  let best = null;
  let bestValue = -Infinity;
  for (const card of pool) {
    let value = effectivePower(card, attunedSuit, round);
    // Chase the chain: matching the attuned suit is worth more than raw power.
    if (attunedSuit && card.suit === attunedSuit) value += CHAIN_BONUS;
    // Counter the player's last card: same suit chains off what the player set.
    if (playerLastCard && card.suit === playerLastCard.suit) value += 2;
    // A Surge card is a finisher: save it when behind, spend it when ahead or late.
    if (card.cost >= SURGE_COST) {
      if (behind && round < 8) value -= 4;
      if (ahead || tight) value += 3;
    }
    // Late and tight: don't waste a big card on a trick it cannot win.
    if (tight && playerLastCard) {
      const playerGuess = effectivePower(playerLastCard, attunedSuit, round);
      if (value < playerGuess && card.power >= 7) value -= 5;
    }
    // A little noise, so the rival is readable but never a solved puzzle.
    value += rng() * 2.5;
    if (value > bestValue) { bestValue = value; best = card; }
  }
  return best;
}

// The tell: the suit the rival is leaning toward this round, shown on the table
// before the player commits. Honest 70% of the time; the other 30% it bluffs,
// and a bluff is itself a tell once the player learns to watch for it.
export function rivalTell(ctx, rng) {
  const { hand, embers, attunedSuit, round } = ctx;
  const affordable = hand.filter((c) => canAfford(c, embers));
  const pool = affordable.length ? affordable : hand.slice();
  // The rival's true lean: the suit of the card it most wants to play.
  const leanCard = chooseRivalCard(ctx, () => 0.5);
  const honest = rng() < 0.7;
  if (honest) return { suit: leanCard.suit, honest: true, round };
  const others = SUIT_KEYS.filter((s) => s !== leanCard.suit);
  return { suit: others[Math.floor(rng() * others.length)], honest: false, round };
}

// A line the rival says, for flavour on the table. Never a commercial character.
export function rivalQuip(kind, rng) {
  const lines = {
    win: ['The embers obey me.', 'Your pact falters.', 'I read your hand like smoke.'],
    lose: ['A lucky draw, nothing more.', 'The flames turn. Enjoy it.', 'Hmph. Again.'],
    tie: ['Even the fire cannot choose.', 'A stalemate suits no one.'],
    pact: ['A pact? You bargain with fire.', 'Sealed. I will remember that.'],
  };
  const pool = lines[kind] ?? lines.tie;
  return pool[Math.floor(rng() * pool.length)];
}
