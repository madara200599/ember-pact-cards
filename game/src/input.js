// Ember Pact — input.js: mouse and keyboard. One job: turn pointer and key
// events into game actions — hover a card, play a card, start, rematch, mute.
// It knows the hand layout (from render.js) so it can hit-test cards.

import { VIEW_W, VIEW_H, CARD_W, CARD_H } from './config.js';
import { handSlot } from './render.js';
import { canAfford } from './rules.js';

// The canvas is scaled to the window; translate a client point into logical pixels.
function toLogical(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * VIEW_W,
    y: ((clientY - r.top) / r.height) * VIEW_H,
  };
}

// Is the point inside this hand card's (possibly rotated) rectangle?
function hitCard(px, py, slot) {
  const dx = px - slot.x;
  const dy = py - slot.y;
  const c = Math.cos(-slot.rot);
  const s = Math.sin(-slot.rot);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= CARD_W / 2 + 6 && Math.abs(ly) <= CARD_H / 2 + 6;
}

// Topmost (rightmost on overlap) player hand card under the point, or null.
function cardAt(match, px, py) {
  for (let i = match.playerHand.length - 1; i >= 0; i--) {
    const slot = handSlot(match.playerHand, i, true);
    if (hitCard(px, py, slot)) return match.playerHand[i];
  }
  return null;
}

export function attachInput(canvas, match, sounds, nowFn) {
  function onMove(event) {
    const { x, y } = toLogical(canvas, event.clientX, event.clientY);
    match.hoverCard = match.phase === 'choose' ? cardAt(match, x, y) : null;
  }

  function onClick(event) {
    sounds.unlock();
    const now = nowFn();
    const { x, y } = toLogical(canvas, event.clientX, event.clientY);
    if (match.phase === 'title') {
      sounds.slide();
      match.start(now);
      return;
    }
    if (match.phase === 'won' || match.phase === 'lost') {
      match.rematch(now);
      return;
    }
    if (match.phase !== 'choose') return;
    const entry = cardAt(match, x, y);
    if (!entry) return;
    if (!canAfford(entry.card, match.playerEmbers)) {
      // A shake of the head: the card is too expensive for the embers on hand.
      sounds.loseTrick();
      return;
    }
    if (match.playCard(entry, now)) {
      sounds.slide();
      setTimeout(() => sounds.flip(), 260);
      setTimeout(() => sounds.snap(), 480);
    }
  }

  function onKey(event) {
    if (event.key === 'm' || event.key === 'M') {
      const muted = sounds.toggleMute();
      match.log.unshift(muted ? 'Sound off (M to turn back on).' : 'Sound on.');
    }
    if ((event.key === 'Enter' || event.key === ' ') && match.phase === 'title') {
      sounds.unlock();
      match.start(nowFn());
    }
    // Number keys 1-5 play the matching card in hand.
    if (match.phase === 'choose' && /^[1-9]$/.test(event.key)) {
      const entry = match.playerHand[Number(event.key) - 1];
      if (entry && canAfford(entry.card, match.playerEmbers)) {
        sounds.unlock();
        if (match.playCard(entry, nowFn())) {
          sounds.slide();
          setTimeout(() => sounds.flip(), 260);
        }
      }
    }
  }

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
}
