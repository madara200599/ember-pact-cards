// Ember Pact — main.js: the boot. One job: set up the canvas, own the frame
// loop, and wire the match, the renderer, the input and the sounds together.

import { VIEW_W, VIEW_H } from './config.js';
import { makeMatch } from './state.js';
import { drawMatch } from './render.js';
import { attachInput } from './input.js';
import { makeSoundBank } from './audio.js';
import { applyShotPreset } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// Fixed logical size; CSS scales the canvas to the window.
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const shot = params.get('shot');

const match = makeMatch(seed);
const sounds = makeSoundBank();
const nowFn = () => performance.now();

if (shot) applyShotPreset(match, shot, nowFn());

// Announce phase changes for screen readers, and play the end flourishes.
let lastPhase = match.phase;
function onPhaseChange() {
  if (match.phase === lastPhase) return;
  const prev = lastPhase;
  lastPhase = match.phase;
  const messages = {
    choose: `Round ${match.round}. Your move. Life ${match.playerLife}, renown ${match.playerScore}.`,
    won: 'You won the pact.',
    lost: 'The embers fade. You lost.',
  };
  if (messages[match.phase]) statusEl.textContent = messages[match.phase];
  if (match.phase === 'won' && prev !== 'won') sounds.winFanfare();
  if (match.phase === 'lost' && prev !== 'lost') sounds.loseDirge();
  if (match.phase === 'resolve' && match.lastOutcome) {
    if (match.lastOutcome.winner === 'player') sounds.winTrick();
    else if (match.lastOutcome.winner === 'rival') sounds.loseTrick();
    if (match.lastOutcome.playerPactDraw) sounds.pact();
  }
}

attachInput(canvas, match, sounds, nowFn);

// A debug handle for play-testing: the test driver reads the match through it.
// It changes nothing about the game itself.
window.__emberPact = { match, sounds };

let last = nowFn();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  match.update(now);
  onPhaseChange();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawMatch(ctx, match, now, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
