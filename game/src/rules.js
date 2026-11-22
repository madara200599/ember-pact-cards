// Ember Pact — rules.js: how a trick is won, what combos pay, and how life and
// score move. One job: pure rules. No drawing, no input, no state machine —
// given two played cards and the table, it returns the outcome.

import { CHAIN_BONUS, SURGE_COST, RISING_ROUND, RISING_BONUS, PACT_BONUS_SCORE, LOSER_EMBER, DAMAGE_CAP } from './config.js';

// Effective power of a card on this table, before the rival's card is known.
//   - Surge: a cost-3 card doubles its power.
//   - Chain: playing the attuned suit (the suit of the last trick's winning card) adds +3.
//   - Rising Embers: from round 5 on, every card is +1.
export function effectivePower(card, attunedSuit, round) {
  let power = card.power;
  if (card.cost >= SURGE_COST) power *= 2;
  if (round >= RISING_ROUND) power += RISING_BONUS;
  if (attunedSuit && card.suit === attunedSuit) power += CHAIN_BONUS;
  return power;
}

// Which combos fire for this play, for the banner text and the score.
// Returns an array of { key, label } in the order they should be announced.
export function combosFor(card, rivalCard, attunedSuit, round, rivalPrevPower) {
  const combos = [];
  if (card.cost >= SURGE_COST) combos.push({ key: 'surge', label: 'SURGE! power doubled' });
  if (attunedSuit && card.suit === attunedSuit) {
    combos.push({ key: 'chain', label: `CHAIN +${CHAIN_BONUS} — attuned ${attunedSuit}` });
  }
  if (rivalPrevPower !== null && rivalPrevPower !== undefined && card.power === rivalPrevPower) {
    combos.push({ key: 'pact', label: `PACT SEALED +${PACT_BONUS_SCORE} score` });
  }
  if (round >= RISING_ROUND) combos.push({ key: 'rising', label: 'RISING EMBERS +1' });
  return combos;
}

// Resolve one trick. Returns a plain outcome object the state machine applies:
//   winner: 'player' | 'rival' | 'tie'
//   damage: life lost by the loser (0 on a tie)
//   playerScore / rivalScore: score gained this trick
//   playerEmber / rivalEmber: embers gained this trick (loser consolation + pact draw flag)
//   newAttuned: the suit the table is attuned to after this trick
export function resolveTrick(playerCard, rivalCard, attunedSuit, round, rivalPrevPower, playerPrevPower) {
  const pPower = effectivePower(playerCard, attunedSuit, round);
  const rPower = effectivePower(rivalCard, attunedSuit, round);
  const outcome = {
    playerPower: pPower,
    rivalPower: rPower,
    playerCombos: combosFor(playerCard, rivalCard, attunedSuit, round, rivalPrevPower),
    rivalCombos: combosFor(rivalCard, playerCard, attunedSuit, round, playerPrevPower),
    winner: 'tie',
    damage: 0,
    playerScore: 0,
    rivalScore: 0,
    playerEmber: 0,
    rivalEmber: 0,
    playerPactDraw: false,
    rivalPactDraw: false,
    newAttuned: attunedSuit,
  };

  if (pPower > rPower) {
    outcome.winner = 'player';
    outcome.damage = Math.min(pPower - rPower, DAMAGE_CAP);
    outcome.playerScore = pPower;
    outcome.rivalEmber = LOSER_EMBER;
    outcome.newAttuned = playerCard.suit;
  } else if (rPower > pPower) {
    outcome.winner = 'rival';
    outcome.damage = Math.min(rPower - pPower, DAMAGE_CAP);
    outcome.rivalScore = rPower;
    outcome.playerEmber = LOSER_EMBER;
    outcome.newAttuned = rivalCard.suit;
  } else {
    // A tie: no damage, both sides take 1 score for the stalemate.
    outcome.playerScore = 1;
    outcome.rivalScore = 1;
  }

  // Pact: matching the rival's previous card power seals a pact — bonus score and a card.
  if (rivalPrevPower !== null && rivalPrevPower !== undefined && playerCard.power === rivalPrevPower) {
    outcome.playerScore += PACT_BONUS_SCORE;
    outcome.playerPactDraw = true;
  }
  if (playerPrevPower !== null && playerPrevPower !== undefined && rivalCard.power === playerPrevPower) {
    outcome.rivalScore += PACT_BONUS_SCORE;
    outcome.rivalPactDraw = true;
  }
  return outcome;
}

// Can this card be played with the embers on hand?
export function canAfford(card, embers) {
  return card.cost <= embers;
}

// End-of-match winner once life hits zero or the rounds run out.
export function matchWinner(playerLife, rivalLife, playerScore, rivalScore) {
  if (playerLife <= 0 && rivalLife <= 0) return playerScore >= rivalScore ? 'player' : 'rival';
  if (playerLife <= 0) return 'rival';
  if (rivalLife <= 0) return 'player';
  return null; // match continues
}

// After the last round, the higher life wins; life tied, the higher score wins.
export function finalWinner(playerLife, rivalLife, playerScore, rivalScore) {
  if (playerLife !== rivalLife) return playerLife > rivalLife ? 'player' : 'rival';
  return playerScore >= rivalScore ? 'player' : 'rival';
}
