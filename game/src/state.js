// Ember Pact — state.js: the match state machine. One job: own the match —
// hands, life, score, embers, rounds, the table — and move it through its phases.
// It calls rules.js to score tricks and ai.js to play the rival; it never draws.

import {
  START_LIFE, MAX_ROUNDS, HAND_SIZE, START_EMBERS, EMBERS_PER_ROUND, MAX_EMBERS,
  RIVAL_NAMES, SLIDE_MS, FLIP_MS, RESOLVE_MS,
} from './config.js';
import { makeDrawPile, mulberry32 } from './deck.js';
import { resolveTrick, matchWinner, finalWinner, canAfford } from './rules.js';
import { chooseRivalCard, rivalTell, rivalQuip } from './ai.js';
import { makeCardMotion, makeParticles } from './animate.js';

export const PHASES = ['title', 'dealing', 'choose', 'reveal', 'resolve', 'roundEnd', 'won', 'lost'];

export function makeMatch(seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed);
  const rivalName = RIVAL_NAMES[Math.floor(rng() * RIVAL_NAMES.length)];
  const pile = makeDrawPile(rng);
  const particles = makeParticles();

  const match = {
    seed, rng, rivalName,
    phase: 'title',
    round: 1,
    playerLife: START_LIFE,
    rivalLife: START_LIFE,
    playerScore: 0,
    rivalScore: 0,
    playerEmbers: START_EMBERS,
    rivalEmbers: START_EMBERS,
    playerHand: [],
    rivalHand: [],
    attunedSuit: null,
    tablePlayer: null,   // { card, motion }
    tableRival: null,
    lastOutcome: null,
    lastPlayerCard: null,
    lastRivalCard: null,
    tell: null,
    quip: '',
    log: [],
    phaseAt: 0,
    phaseMs: 0,
    hoverCard: null,
    selectedCard: null,
    winner: null,
    particles,
    // Debug/preset hook: tests and screenshot presets drive the match through this.
    debug: { forced: null },
  };

  function stamp(now) { match.phaseAt = now; }
  function say(text) {
    match.log.unshift(text);
    if (match.log.length > 5) match.log.length = 5;
  }

  function dealHand(hand, count, fromX, fromY, now) {
    const drawn = pile.drawMany(count);
    for (const card of drawn) {
      const motion = makeCardMotion(fromX, fromY, 0);
      motion.flip = 0;
      hand.push({ card, motion, dealtAt: now + hand.length * 90 });
    }
    return drawn.length;
  }

  match.start = function start(now) {
    match.phase = 'dealing';
    stamp(now);
    dealHand(match.playerHand, HAND_SIZE, 640, 880, now);
    dealHand(match.rivalHand, HAND_SIZE, 640, -120, now);
    match.tell = rivalTell({
      hand: match.rivalHand.map((h) => h.card),
      embers: match.rivalEmbers, attunedSuit: match.attunedSuit, round: match.round,
    }, rng);
    say(`Round 1 — ${rivalName} takes the table.`);
    say(`Tell: the rival leans ${match.tell.suit}.`);
  };

  // The player commits a card. Returns false if the card cannot be played.
  match.playCard = function playCard(handEntry, now) {
    if (match.phase !== 'choose' || !handEntry) return false;
    if (!canAfford(handEntry.card, match.playerEmbers)) return false;
    match.playerEmbers -= handEntry.card.cost;
    match.playerHand = match.playerHand.filter((h) => h !== handEntry);
    match.tablePlayer = handEntry;
    match.selectedCard = null;
    match.hoverCard = null;
    // The rival answers at once, face down; both flip together.
    const rivalCard = chooseRivalCard({
      hand: match.rivalHand.map((h) => h.card),
      embers: match.rivalEmbers,
      attunedSuit: match.attunedSuit,
      round: match.round,
      playerLastCard: match.lastPlayerCard,
      playerLife: match.playerLife,
      rivalLife: match.rivalLife,
    }, rng);
    match.rivalEmbers -= rivalCard.cost;
    const rivalEntry = match.rivalHand.find((h) => h.card === rivalCard);
    match.rivalHand = match.rivalHand.filter((h) => h !== rivalEntry);
    match.tableRival = rivalEntry;
    match.phase = 'reveal';
    stamp(now);
    return true;
  };

  // Advance the machine. Called every frame with the current time.
  // Screenshot presets freeze the match at the photographed moment.
  match.update = function update(now) {
    if (match.debug.frozen) return;
    const inPhase = now - match.phaseAt;
    if (match.phase === 'dealing' && inPhase > HAND_SIZE * 90 + SLIDE_MS) {
      match.phase = 'choose';
      stamp(now);
      say('Your move — click a card you can afford.');
    } else if (match.phase === 'reveal' && inPhase > FLIP_MS + 260) {
      match.phase = 'resolve';
      stamp(now);
      const outcome = resolveTrick(
        match.tablePlayer.card, match.tableRival.card, match.attunedSuit, match.round,
        match.lastRivalCard ? match.lastRivalCard.power : null,
        match.lastPlayerCard ? match.lastPlayerCard.power : null,
      );
      match.lastOutcome = outcome;
      match.playerScore += outcome.playerScore;
      match.rivalScore += outcome.rivalScore;
      match.playerEmbers = Math.min(MAX_EMBERS, match.playerEmbers + outcome.playerEmber);
      match.rivalEmbers = Math.min(MAX_EMBERS, match.rivalEmbers + outcome.rivalEmber);
      if (outcome.winner === 'player') {
        match.rivalLife -= outcome.damage;
        match.quip = rivalQuip('lose', rng);
        say(`You take the trick — ${outcome.damage} damage, +${outcome.playerScore} renown.`);
      } else if (outcome.winner === 'rival') {
        match.playerLife -= outcome.damage;
        match.quip = rivalQuip('win', rng);
        say(`${match.rivalName} takes the trick — ${outcome.damage} damage, +${outcome.rivalScore} renown.`);
      } else {
        match.quip = rivalQuip('tie', rng);
        say('A tied trick — the fire cannot choose.');
      }
      if (outcome.playerPactDraw) {
        say('PACT SEALED — bonus renown and a fresh card.');
        match.quip = rivalQuip('pact', rng);
      }
      match.attunedSuit = outcome.newAttuned;
      match.lastPlayerCard = match.tablePlayer.card;
      match.lastRivalCard = match.tableRival.card;
      // Sparks where the trick was decided.
      const cx = 640, cy = 420;
      particles.burst(cx, cy, 26, outcome.winner === 'player' ? '#ffd866' : '#e5484d');
    } else if (match.phase === 'resolve' && inPhase > RESOLVE_MS) {
      match.phase = 'roundEnd';
      stamp(now);
      // Sweep the table, draw up, and check whether the match is over.
      match.tablePlayer = null;
      match.tableRival = null;
      const over = matchWinner(match.playerLife, match.rivalLife, match.playerScore, match.rivalScore);
      if (over) { match.endMatch(over, now); return; }
      if (match.round >= MAX_ROUNDS) {
        match.endMatch(finalWinner(match.playerLife, match.rivalLife, match.playerScore, match.rivalScore), now);
        return;
      }
      match.round += 1;
      match.playerEmbers = Math.min(MAX_EMBERS, match.playerEmbers + EMBERS_PER_ROUND);
      match.rivalEmbers = Math.min(MAX_EMBERS, match.rivalEmbers + EMBERS_PER_ROUND);
      const pDraw = pile.drawMany(match.lastOutcome.playerPactDraw ? 2 : 1);
      const rDraw = pile.drawMany(match.lastOutcome.rivalPactDraw ? 2 : 1);
      for (const card of pDraw) {
        const motion = makeCardMotion(640, 880, 0);
        motion.flip = 0;
        match.playerHand.push({ card, motion, dealtAt: now + match.playerHand.length * 90 });
      }
      for (const card of rDraw) {
        const motion = makeCardMotion(640, -120, 0);
        motion.flip = 0;
        match.rivalHand.push({ card, motion, dealtAt: now + match.rivalHand.length * 90 });
      }
      match.tell = rivalTell({
        hand: match.rivalHand.map((h) => h.card),
        embers: match.rivalEmbers, attunedSuit: match.attunedSuit, round: match.round,
      }, rng);
      say(`Round ${match.round} — the pact deepens.`);
      if (match.round === 5) say('RISING EMBERS — every card is +1 from here.');
    } else if (match.phase === 'roundEnd' && inPhase > 420) {
      match.phase = 'choose';
      stamp(now);
      say('Your move — click a card you can afford.');
    }
  };

  match.endMatch = function endMatch(winner, now) {
    match.winner = winner;
    match.phase = winner === 'player' ? 'won' : 'lost';
    stamp(now);
    if (winner === 'player') {
      say('THE PACT IS YOURS.');
      particles.burst(640, 300, 90, '#ffd866');
      particles.burst(420, 360, 60, '#e5484d');
      particles.burst(860, 360, 60, '#3e8fd9');
    } else {
      say('THE EMBERS FADE.');
    }
  };

  // A fresh match with the same seed rules, for the Play Again button.
  match.rematch = function rematch(now) {
    const fresh = makeMatch((Math.random() * 1e9) | 0);
    Object.assign(match, fresh, { phase: 'title', phaseAt: now });
  };

  return match;
}
