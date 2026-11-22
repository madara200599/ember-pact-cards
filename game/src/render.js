// Ember Pact — render.js: everything the player sees. One job: draw the table,
// the cards, the HUD and the screens on the canvas, and lay the cards out so
// they slide, flip and snap into place. It never changes the match — it reads it.

import { VIEW_W, VIEW_H, SUITS, CARD_W, CARD_H, CARD_R, MAX_ROUNDS, SLIDE_MS, FLIP_MS } from './config.js';

const TAU = Math.PI * 2;

// ---------- small canvas helpers ----------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, weight = 700, align = 'center') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------- suit glyphs: colour AND shape, never text alone ----------

function drawGlyph(ctx, glyph, cx, cy, s, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = s * 0.09;
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.55, -s * 0.35, s * 0.75, s * 0.1, s * 0.5, s * 0.55);
    ctx.bezierCurveTo(s * 0.3, s * 0.95, -s * 0.3, s * 0.95, -s * 0.5, s * 0.55);
    ctx.bezierCurveTo(-s * 0.75, s * 0.1, -s * 0.55, -s * 0.35, 0, -s);
    ctx.fill();
    ctx.fillStyle = '#ffd866';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.bezierCurveTo(s * 0.3, s * 0.15, s * 0.28, s * 0.45, 0, s * 0.6);
    ctx.bezierCurveTo(-s * 0.28, s * 0.45, -s * 0.3, s * 0.15, 0, -s * 0.2);
    ctx.fill();
  } else if (glyph === 'drop') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.1, s * 0.62, s * 0.55, 0, s * 0.75);
    ctx.bezierCurveTo(-s * 0.62, s * 0.55, -s * 0.7, -s * 0.1, 0, -s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, s * 0.1, s * 0.13, s * 0.26, 0.4, 0, TAU);
    ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.85, -s * 0.5, s * 0.8, s * 0.5, 0, s * 0.9);
    ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.85, -s * 0.5, 0, -s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.quadraticCurveTo(s * 0.08, 0, 0, s * 0.75);
    ctx.stroke();
  } else { // swirl
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 4.4; a += 0.12) {
      const r = (a / (Math.PI * 4.4)) * s * 0.85;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.9 - s * 0.1;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.15, -s * 0.1, s * 0.12, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- cards ----------

export function drawCardFace(ctx, card, x, y, w, h, scale = 1) {
  const suit = SUITS[card.suit];
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Card body: warm paper with a suit-coloured frame.
  roundRect(ctx, 0, 0, w, h, CARD_R);
  ctx.fillStyle = '#f7efdd';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = suit.colour;
  ctx.stroke();
  roundRect(ctx, 5, 5, w - 10, h - 10, CARD_R - 4);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = suit.dark;
  ctx.stroke();
  // Power: big, top-left and bottom-right.
  text(ctx, String(card.power), 16, 26, 34, suit.dark, 800, 'left');
  drawGlyph(ctx, suit.glyph, 30, 58, 11, suit.colour);
  ctx.save();
  ctx.translate(w, h);
  ctx.rotate(Math.PI);
  text(ctx, String(card.power), 16, 26, 34, suit.dark, 800, 'left');
  ctx.restore();
  // Centre glyph, large.
  drawGlyph(ctx, suit.glyph, w / 2, h / 2 - 8, 30, suit.colour);
  // Name under the glyph.
  text(ctx, card.name.toUpperCase(), w / 2, h - 42, 15, '#3a2c1c', 700);
  text(ctx, suit.name, w / 2, h - 22, 12, suit.dark, 700);
  // Cost: ember pips along the bottom edge.
  for (let i = 0; i < card.cost; i++) {
    const px = w / 2 + (i - (card.cost - 1) / 2) * 20;
    ctx.fillStyle = '#c33';
    ctx.beginPath();
    ctx.arc(px, h - 8, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(px - 1.5, h - 9.5, 2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCardBack(ctx, x, y, w, h, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  roundRect(ctx, 0, 0, w, h, CARD_R);
  ctx.fillStyle = '#5a1f1f';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#c9a227';
  ctx.stroke();
  roundRect(ctx, 8, 8, w - 16, h - 16, CARD_R - 5);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(201,162,39,0.7)';
  ctx.stroke();
  drawGlyph(ctx, 'flame', w / 2, h / 2, 34, '#c9a227');
  text(ctx, 'EMBER', w / 2, h - 30, 13, '#c9a227', 700);
  text(ctx, 'PACT', w / 2, h - 14, 13, '#c9a227', 700);
  ctx.restore();
}

// Draw one hand entry with its motion pose: flip squashes the card edge-on mid-turn.
export function drawHandCard(ctx, entry, x, y, rot, scale, flip, faceUp, affordable, hovered, selected) {
  const w = CARD_W;
  const h = CARD_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  if (hovered) ctx.translate(0, -26);
  if (selected) ctx.translate(0, -40);
  // Edge-on at the middle of a flip, full width when settled face-up or face-down:
  // the squash follows |cos(flip * pi)|, and the face shown flips at the midpoint.
  const squash = Math.max(0.06, Math.abs(Math.cos(flip * Math.PI)));
  ctx.scale(squash, 1);
  const showFace = flip >= 0.5;
  if (showFace && faceUp) drawCardFace(ctx, entry.card, -w / 2, -h / 2, w, h, 1);
  else drawCardBack(ctx, -w / 2, -h / 2, w, h, 1);
  ctx.restore();
  if (!affordable && faceUp) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, rot, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- table, HUD, screens ----------

function drawTable(ctx) {
  const g = ctx.createRadialGradient(640, 380, 80, 640, 400, 760);
  g.addColorStop(0, '#2c5d3f');
  g.addColorStop(0.6, '#1d4530');
  g.addColorStop(1, '#10291c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  roundRect(ctx, 14, 14, VIEW_W - 28, VIEW_H - 28, 26);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,162,39,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(640, 400, 330, 190, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(640, 400, 250, 130, 0, 0, TAU);
  ctx.stroke();
}

function drawHearts(ctx, x, y, life, max = 20) {
  const shown = Math.max(0, Math.min(max, life));
  for (let i = 0; i < max; i++) {
    const hx = x + i * 13;
    ctx.fillStyle = i < shown ? '#e5484d' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(hx, y, 5, 0, TAU);
    ctx.fill();
  }
}

function drawEmberPips(ctx, x, y, embers) {
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i < embers ? '#ff8a3c' : 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(x + i * 18, y, i < embers ? 7 : 5, 0, TAU);
    ctx.fill();
  }
}

function drawHud(ctx, match) {
  // Top bar: rival.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 24, 24, VIEW_W - 48, 64, 12);
  ctx.fill();
  text(ctx, match.rivalName.toUpperCase(), 44, 46, 20, '#ffd866', 800, 'left');
  text(ctx, 'RIVAL', 44, 68, 11, '#c9a227', 700, 'left');
  drawHearts(ctx, 340, 42, match.rivalLife);
  text(ctx, `LIFE ${Math.max(0, match.rivalLife)}`, 340, 68, 12, '#fff', 700, 'left');
  text(ctx, `RENOWN ${match.rivalScore}`, 700, 46, 18, '#fff', 800, 'left');
  text(ctx, 'EMBERS', 700, 68, 11, '#c9a227', 700, 'left');
  drawEmberPips(ctx, 780, 66, match.rivalEmbers);
  text(ctx, `ROUND ${match.round} / ${MAX_ROUNDS}`, 1180, 46, 18, '#fff', 800, 'right');
  if (match.round >= 5) text(ctx, 'RISING EMBERS +1', 1180, 68, 11, '#ff8a7a', 700, 'right');

  // Bottom bar: player.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 24, VIEW_H - 88, VIEW_W - 48, 64, 12);
  ctx.fill();
  text(ctx, 'YOU — MADARA', 44, VIEW_H - 66, 20, '#ffd866', 800, 'left');
  text(ctx, 'EMBERKEEPER', 44, VIEW_H - 44, 11, '#c9a227', 700, 'left');
  drawHearts(ctx, 340, VIEW_H - 66, match.playerLife);
  text(ctx, `LIFE ${Math.max(0, match.playerLife)}`, 340, VIEW_H - 44, 12, '#fff', 700, 'left');
  text(ctx, `RENOWN ${match.playerScore}`, 700, VIEW_H - 66, 18, '#fff', 800, 'left');
  text(ctx, 'EMBERS', 700, VIEW_H - 44, 11, '#c9a227', 700, 'left');
  drawEmberPips(ctx, 780, VIEW_H - 46, match.playerEmbers);

  // Attuned suit + tell, stacked on the left under the top bar, clear of both hands.
  if (match.attunedSuit) {
    const suit = SUITS[match.attunedSuit];
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 44, 104, 320, 34, 10);
    ctx.fill();
    drawGlyph(ctx, suit.glyph, 68, 121, 11, suit.light);
    text(ctx, `ATTUNED: ${suit.name.toUpperCase()}  (+3 CHAIN)`, 88, 122, 14, suit.light, 700, 'left');
  }
  if (match.tell && (match.phase === 'choose' || match.phase === 'dealing')) {
    const suit = SUITS[match.tell.suit];
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, 44, 146, 320, 30, 10);
    ctx.fill();
    drawGlyph(ctx, suit.glyph, 68, 161, 10, suit.light);
    text(ctx, `TELL: ${match.rivalName.split(' ')[0]} leans ${suit.name.toUpperCase()}…`, 88, 162, 14, '#ffe9b0', 700, 'left');
  }
  // Log lines, bottom-left above the player bar.
  match.log.forEach((line, i) => {
    ctx.globalAlpha = 1 - i * 0.18;
    text(ctx, line, 44, VIEW_H - 116 - i * 20, 13, '#e8e0c8', 400, 'left');
  });
  ctx.globalAlpha = 1;
  // Rival quip, right side under the top bar, clear of the rival hand.
  if (match.quip) text(ctx, `“${match.quip}”`, 1236, 122, 15, '#d8cdb2', 400, 'right');
}

function drawOutcomeBanner(ctx, match, now) {
  const o = match.lastOutcome;
  if (!o || (match.phase !== 'resolve' && match.phase !== 'roundEnd')) return;
  const inPhase = now - match.phaseAt;
  // A frozen screenshot preset holds the banner at full strength.
  const frozen = match.debug && match.debug.frozen;
  const alpha = frozen ? 1 : inPhase < 200 ? inPhase / 200 : inPhase > 900 ? Math.max(0, 1 - (inPhase - 900) / 200) : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  const winnerText = o.winner === 'player' ? 'YOU WIN THE TRICK' : o.winner === 'rival' ? `${match.rivalName.toUpperCase()} WINS THE TRICK` : 'TIED TRICK';
  const colour = o.winner === 'player' ? '#ffd866' : o.winner === 'rival' ? '#ff8a7a' : '#e8e0c8';
  text(ctx, winnerText, 640, 232, 30, colour, 800);
  if (o.damage > 0) {
    const target = o.winner === 'player' ? 'RIVAL' : 'YOU';
    text(ctx, `−${o.damage} LIFE  •  +${o.winner === 'player' ? o.playerScore : o.rivalScore} RENOWN`, 640, 266, 18, '#fff', 700);
    void target;
  }
  const comboLines = o.playerCombos.map((c) => c.label);
  comboLines.forEach((line, i) => text(ctx, line, 640, 294 + i * 20, 15, '#ffd866', 700));
  ctx.restore();
}

function drawTitleScreen(ctx, match, now) {
  drawTable(ctx);
  // A fan of the four suits behind the title.
  const fan = [
    { suit: 'ember', rot: -0.5, x: 480 },
    { suit: 'tide', rot: -0.17, x: 580 },
    { suit: 'thorn', rot: 0.17, x: 680 },
    { suit: 'gale', rot: 0.5, x: 780 },
  ];
  for (const f of fan) {
    ctx.save();
    ctx.translate(f.x, 330);
    ctx.rotate(f.rot);
    ctx.globalAlpha = 0.95;
    const card = { suit: f.suit, power: 7, cost: 3, name: SUITS[f.suit].name };
    drawCardFace(ctx, card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 1);
    ctx.restore();
  }
  const bob = Math.sin(now / 600) * 6;
  text(ctx, 'EMBER PACT', 640, 180 + bob, 84, '#ffd866', 800);
  text(ctx, 'A DUEL OF CARDS, EMBERS AND READING YOUR RIVAL', 640, 232, 18, '#e8e0c8', 700);
  text(ctx, 'Play a card each round. Chain the attuned suit, seal pacts,', 640, 470, 17, '#fff', 400);
  text(ctx, 'and burn the rival’s life to zero before yours runs out.', 640, 496, 17, '#fff', 400);
  text(ctx, '4 suits • ember costs • combos • 10 rounds • first to break the other wins', 640, 528, 14, '#c9a227', 700);
  const pulse = 0.65 + Math.sin(now / 350) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK ANYWHERE TO BEGIN', 640, 600, 24, '#ffd866', 800);
  ctx.globalAlpha = 1;
  text(ctx, 'Mouse to play • M to mute • an original game, made for make.fun', 640, 660, 13, '#9fb8a4', 400);
}

function drawEndScreen(ctx, match, won) {
  ctx.fillStyle = won ? 'rgba(20,40,20,0.82)' : 'rgba(30,10,10,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (won) {
    text(ctx, '★  THE PACT IS YOURS  ★', 640, 220, 56, '#ffd866', 800);
    text(ctx, `${match.rivalName} bows to the emberkeeper.`, 640, 290, 20, '#fff', 400);
  } else {
    text(ctx, 'THE EMBERS FADE', 640, 220, 56, '#ff8a7a', 800);
    text(ctx, `${match.rivalName} keeps the pact — this time.`, 640, 290, 20, '#fff', 400);
  }
  text(ctx, `FINAL RENOWN   YOU ${match.playerScore}  —  ${match.rivalScore} ${match.rivalName.toUpperCase()}`, 640, 350, 20, '#fff', 700);
  text(ctx, `LIFE LEFT   YOU ${Math.max(0, match.playerLife)}  —  ${Math.max(0, match.rivalLife)} ${match.rivalName.toUpperCase()}`, 640, 388, 20, '#fff', 700);
  text(ctx, `ROUNDS PLAYED: ${match.round} / ${MAX_ROUNDS}`, 640, 426, 16, '#c9a227', 700);
  const pulse = 0.65 + Math.sin(Date.now() / 350) * 0.35;
  ctx.globalAlpha = pulse;
  text(ctx, '▶  CLICK TO PLAY AGAIN', 640, 520, 24, '#ffd866', 800);
  ctx.globalAlpha = 1;
  text(ctx, 'EMBER PACT — an original card duel', 640, 580, 14, '#9fb8a4', 400);
}

// ---------- hand layout ----------

// Where a hand card belongs on the table. Player hand fans along the bottom,
// rival hand fans along the top, face down.
export function handSlot(hand, index, isPlayer) {
  const n = hand.length;
  const cx = 640;
  const spread = Math.min(150, (n - 1) * 24);
  const x = cx + (n === 1 ? 0 : (index / (n - 1) - 0.5) * 2 * spread);
  const rot = (n === 1 ? 0 : (index / (n - 1) - 0.5)) * 0.22;
  const y = isPlayer ? 600 + Math.abs(index - (n - 1) / 2) * 6 : 150 - Math.abs(index - (n - 1) / 2) * 6;
  return { x, y, rot };
}

// Move every hand card toward its slot; flip player cards up once dealt.
export function layoutHands(match, now) {
  const place = (hand, isPlayer) => {
    hand.forEach((entry, i) => {
      const slot = handSlot(hand, i, isPlayer);
      const m = entry.motion;
      if (now < entry.dealtAt) return;
      if (m.tx !== slot.x || m.ty !== slot.y) m.glideTo(slot.x, slot.y, slot.rot, now, SLIDE_MS);
      if (isPlayer) m.flipTo(1, now, FLIP_MS);
    });
  };
  place(match.playerHand, true);
  place(match.rivalHand, false);
  // Table cards glide to their slots and flip face-up.
  if (match.tablePlayer) {
    const m = match.tablePlayer.motion;
    if (m.tx !== 540 || m.ty !== 420) m.glideTo(540, 420, -0.06, now, SLIDE_MS);
    m.flipTo(1, now, FLIP_MS);
  }
  if (match.tableRival) {
    const m = match.tableRival.motion;
    if (m.tx !== 740 || m.ty !== 420) m.glideTo(740, 420, 0.06, now, SLIDE_MS);
    m.flipTo(1, now, FLIP_MS);
  }
}

// ---------- main draw ----------

export function drawMatch(ctx, match, now, dt) {
  drawTable(ctx);
  if (match.phase === 'title') {
    drawTitleScreen(ctx, match, now);
    return;
  }
  layoutHands(match, now);
  match.particles.update(dt);
  drawHud(ctx, match);

  // Rival hand (face down, smaller so it clears the top bar).
  match.rivalHand.forEach((entry) => {
    const p = entry.motion.pose(now);
    drawHandCard(ctx, entry, p.x, p.y, p.rot, p.scale * 0.7, p.flip, false, true, false, false);
  });
  // Table cards.
  for (const entry of [match.tablePlayer, match.tableRival]) {
    if (!entry) continue;
    const p = entry.motion.pose(now);
    drawHandCard(ctx, entry, p.x, p.y, p.rot, p.scale, p.flip, true, true, false, false);
  }
  // Player hand (face up, on top).
  match.playerHand.forEach((entry) => {
    const p = entry.motion.pose(now);
    const affordable = entry.card.cost <= match.playerEmbers;
    const hovered = match.hoverCard === entry;
    const selected = match.selectedCard === entry;
    const clickable = match.phase === 'choose' && affordable;
    drawHandCard(ctx, entry, p.x, p.y, p.rot, p.scale, p.flip, true, clickable ? affordable : true, hovered, selected);
  });

  drawOutcomeBanner(ctx, match, now);

  // Particles over everything.
  for (const p of match.particles.list()) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // End screens over the table.
  if (match.phase === 'won') drawEndScreen(ctx, match, true);
  if (match.phase === 'lost') drawEndScreen(ctx, match, false);
}
