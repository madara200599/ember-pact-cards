// Ember Pact — deck.js: what a card is, how the deck is built, shuffled and drawn.
// One job: cards and the draw pile. It knows nothing about turns or scoring.

import { SUIT_KEYS } from './config.js';

// A card: { id, suit, power, cost, name }.
// Cost follows power so every card is a real choice: strong cards are expensive.
//   power 1-3 -> cost 1, power 4-6 -> cost 2, power 7-9 -> cost 3 (Surge cards).
export function cardCost(power) {
  if (power <= 3) return 1;
  if (power <= 6) return 2;
  return 3;
}

const CARD_NAMES = {
  ember: ['Spark', 'Kindle', 'Flare', 'Bonfire', 'Wildfire', 'Inferno', 'Phoenix', 'Sunfall', 'Doomflame'],
  tide: ['Drip', 'Stream', 'Current', 'Wave', 'Surge', 'Deluge', 'Maelstrom', 'Tsunami', 'Abyss'],
  thorn: ['Seed', 'Sprout', 'Bramble', 'Vine', 'Thicket', 'Grove', 'Overgrowth', 'Ancient', 'Worldroot'],
  gale: ['Breeze', 'Gust', 'Draft', 'Squall', 'Tempest', 'Cyclone', 'Hurricane', 'Skybreak', 'Stormking'],
};

let nextId = 1;

export function makeCard(suit, power) {
  return {
    id: nextId++,
    suit,
    power,
    cost: cardCost(power),
    name: CARD_NAMES[suit][power - 1],
  };
}

// A full 36-card deck: every suit holds powers 1 through 9, exactly once each.
export function buildDeck() {
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (let power = 1; power <= 9; power++) deck.push(makeCard(suit, power));
  }
  return deck;
}

// Fisher-Yates shuffle. Pass a rng so screenshot presets can be deterministic.
export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Small deterministic rng (mulberry32) for seeded play and screenshot presets.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draw pile: holds the shuffled deck and hands cards out one at a time.
export function makeDrawPile(rng) {
  const pile = shuffle(buildDeck(), rng);
  return {
    remaining() { return pile.length; },
    draw() { return pile.pop() ?? null; },
    drawMany(n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        const c = pile.pop();
        if (!c) break;
        out.push(c);
      }
      return out;
    },
  };
}
