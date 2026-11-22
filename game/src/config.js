// Ember Pact — game constants: suits, colours, table geometry and rule numbers.
// One job: every tunable value lives here so the rest of the game reads, never guesses.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// The four suits. Each is told apart by BOTH colour and drawn shape, never by text alone.
export const SUITS = {
  ember: { key: 'ember', name: 'Ember', colour: '#e5484d', dark: '#8f1d22', light: '#ff8a7a', glyph: 'flame' },
  tide:  { key: 'tide',  name: 'Tide',  colour: '#3e8fd9', dark: '#174a75', light: '#8ec8f5', glyph: 'drop' },
  thorn: { key: 'thorn', name: 'Thorn', colour: '#46a758', dark: '#1e5c2e', light: '#8ed79b', glyph: 'leaf' },
  gale:  { key: 'gale',  name: 'Gale',  colour: '#f0a500', dark: '#7a5200', light: '#ffd866', glyph: 'swirl' },
};
export const SUIT_KEYS = ['ember', 'tide', 'thorn', 'gale'];

// Card geometry (logical pixels on the 1280x800 table).
export const CARD_W = 118;
export const CARD_H = 168;
export const CARD_R = 12;

// Match rules.
export const START_LIFE = 20;
export const MAX_ROUNDS = 10;
export const HAND_SIZE = 5;
export const START_EMBERS = 3;
export const EMBERS_PER_ROUND = 2;
export const MAX_EMBERS = 7;
export const CHAIN_BONUS = 3;      // same suit as the attuned suit
export const SURGE_COST = 3;        // a cost-3 card doubles its power
export const PACT_BONUS_SCORE = 2;  // power matches the rival's previous card
export const LOSER_EMBER = 1;       // consolation ember for losing a trick
export const RISING_ROUND = 5;      // from this round on, every card is +1 power
export const RISING_BONUS = 1;
export const DAMAGE_CAP = 8;        // one trick can never take more than 8 life

// Animation timings (ms).
export const DEAL_STAGGER_MS = 90;
export const FLIP_MS = 320;
export const SLIDE_MS = 420;
export const RESOLVE_MS = 1100;
export const FLOURISH_MS = 2400;

// Opponent names and flavour. Original characters, invented for this game.
export const RIVAL_NAMES = ['Vex the Cinder', 'Marlowe Ash', 'Sister Cinder', 'Old Fenwick'];
