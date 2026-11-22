// Ember Pact — shots.js: screenshot presets. One job: put the match into a
// deterministic, photogenic state for `?shot=title|play|combo|win|loss&seed=N`,
// so the maker's screenshots are real renders of the game's own code.
// Normal play (no ?shot) never touches this file's presets.

import { handSlot } from './render.js';
import { makeCard } from './deck.js';
import { resolveTrick } from './rules.js';
import { makeCardMotion } from './animate.js';

function fastForwardDeal(match, now) {
  // The deal animation is done: every card sits in its slot, face up for the player.
  match.playerHand.forEach((entry, i) => {
    const slot = handSlot(match.playerHand, i, true);
    entry.motion.x = slot.x; entry.motion.y = slot.y; entry.motion.rot = slot.rot;
    entry.motion.tx = slot.x; entry.motion.ty = slot.y;
    entry.motion.flip = 1; entry.motion.tflip = null;
    entry.dealtAt = 0;
  });
  match.rivalHand.forEach((entry, i) => {
    const slot = handSlot(match.rivalHand, i, false);
    entry.motion.x = slot.x; entry.motion.y = slot.y; entry.motion.rot = slot.rot;
    entry.motion.tx = slot.x; entry.motion.ty = slot.y;
    entry.dealtAt = 0;
  });
}

function tableCard(match, card, x, y, rot) {
  // A real motion object, already sitting in its table slot, face up.
  const motion = makeCardMotion(x, y, rot);
  motion.tx = x; motion.ty = y; motion.trot = rot;
  motion.flip = 1; motion.tflip = null;
  return { card, motion };
}

export function applyShotPreset(match, shot, now) {
  if (shot === 'title') return; // the title screen is the match's natural start

  if (shot === 'play') {
    // Mid-play, round 3: full hands, a tell on the table, scores on the board.
    match.start(now);
    match.round = 3;
    match.playerLife = 17; match.rivalLife = 15;
    match.playerScore = 12; match.rivalScore = 9;
    match.playerEmbers = 5; match.rivalEmbers = 4;
    match.attunedSuit = 'thorn';
    match.phase = 'choose';
    match.phaseAt = now;
    match.log = [
      'Your move — click a card you can afford.',
      'Round 3 — the pact deepens.',
      'You take the trick — 4 damage, +8 renown.',
    ];
    fastForwardDeal(match, now);
    return;
  }

  if (shot === 'combo') {
    // The signature moment: a Surge + Chain combo resolving for huge damage.
    match.start(now);
    match.round = 6;
    match.playerLife = 14; match.rivalLife = 9;
    match.playerScore = 34; match.rivalScore = 22;
    match.playerEmbers = 2; match.rivalEmbers = 3;
    match.attunedSuit = 'ember';
    const playerCard = makeCard('ember', 9); // Surge: 9 -> 18, Chain +3, Rising +1 = 22
    const rivalCard = makeCard('tide', 2);
    const outcome = resolveTrick(playerCard, rivalCard, 'ember', 6, 5, 4);
    match.lastOutcome = outcome;
    match.playerScore += outcome.playerScore;
    match.rivalLife -= outcome.damage;
    match.tablePlayer = tableCard(match, playerCard, 540, 420, -0.06);
    match.tableRival = tableCard(match, rivalCard, 740, 420, 0.06);
    match.lastPlayerCard = playerCard;
    match.lastRivalCard = rivalCard;
    match.phase = 'resolve';
    match.phaseAt = now - 500; // banner fully visible
    match.debug.frozen = true; // hold the moment for the screenshot
    match.log = ['SURGE! power doubled', 'CHAIN +3 — attuned ember', `You take the trick — ${outcome.damage} damage, +${outcome.playerScore} renown.`];
    match.particles.burst(640, 420, 40, '#ffd866');
    fastForwardDeal(match, now);
    return;
  }

  if (shot === 'win') {
    match.start(now);
    match.round = 7;
    match.playerLife = 11; match.rivalLife = 0;
    match.playerScore = 48; match.rivalScore = 31;
    match.playerEmbers = 4; match.rivalEmbers = 1;
    match.endMatch('player', now);
    fastForwardDeal(match, now);
    return;
  }

  if (shot === 'loss') {
    match.start(now);
    match.round = 8;
    match.playerLife = 0; match.rivalLife = 6;
    match.playerScore = 29; match.rivalScore = 44;
    match.playerEmbers = 1; match.rivalEmbers = 5;
    match.endMatch('rival', now);
    fastForwardDeal(match, now);
  }
}
