// Ember Pact — animate.js: the tween engine behind card slide, flip and snap.
// One job: move numbers over time with easing. It knows nothing about cards —
// the renderer asks it where a card should be right now.

export function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
export function easeOutBack(t) {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}
export function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
export function lerp(a, b, t) { return a + (b - a) * t; }

// A single tween: from `from` to `to` over `duration` ms, starting at `startMs`.
// `ease` shapes the motion; `onDone` fires once, the first update past the end.
export function makeTween({ from, to, duration, startMs, ease = easeOutCubic, onDone = null }) {
  return {
    from, to, duration, startMs, ease, onDone,
    done: false,
    value(now) {
      const t = clamp01((now - this.startMs) / this.duration);
      const v = lerp(this.from, this.to, this.ease(t));
      if (t >= 1 && !this.done) {
        this.done = true;
        if (this.onDone) this.onDone();
      }
      return v;
    },
  };
}

// A card's on-screen motion: position, rotation, scale and face-up flip (0..1,
// where 0.5 is edge-on). The renderer reads these each frame; the state machine
// writes them when a card is dealt, played, flipped or snapped home.
export function makeCardMotion(x, y, rot = 0) {
  return {
    x, y, rot, scale: 1, flip: 1, // flip 1 = face up, 0 = face down
    tx: null, ty: null, trot: null, tscale: null, tflip: null,
    startMs: 0, duration: 0, ease: easeOutCubic, moving: false,
    // Start gliding toward a target. Call once; value() is read every frame.
    glideTo(x, y, rot, now, duration, ease = easeOutCubic) {
      this.tx = x; this.ty = y; this.trot = rot;
      this.startMs = now; this.duration = duration; this.ease = ease; this.moving = true;
      this.fromX = this.x; this.fromY = this.y; this.fromRot = this.rot;
    },
    // Flip the card face-up (to 1) or face-down (to 0) over `duration` ms.
    // A repeat call for the same target is a no-op, so per-frame layout calls
    // cannot restart a flip that is already running.
    flipTo(faceUp, now, duration) {
      const target = faceUp ? 1 : 0;
      if (this.tflip === target) return;
      this.tflip = target;
      this.flipStart = this.flip;
      this.flipStartMs = now;
      this.flipDuration = duration;
    },
    // Where the card is right now. Advances the glide and the flip.
    pose(now) {
      if (this.moving) {
        const t = clamp01((now - this.startMs) / this.duration);
        const e = this.ease(t);
        this.x = lerp(this.fromX, this.tx, e);
        this.y = lerp(this.fromY, this.ty, e);
        this.rot = lerp(this.fromRot, this.trot, e);
        if (t >= 1) this.moving = false;
      }
      if (this.tflip !== null && this.tflip !== undefined) {
        const t = clamp01((now - this.flipStartMs) / this.flipDuration);
        this.flip = lerp(this.flipStart, this.tflip, easeInOutCubic(t));
        if (t >= 1) this.tflip = null;
      }
      return { x: this.x, y: this.y, rot: this.rot, scale: this.scale, flip: this.flip };
    },
  };
}

// Ember particles for the win flourish and the trick-resolution sparks.
export function makeParticles() {
  const parts = [];
  return {
    burst(x, y, n, colour) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 260;
        parts.push({
          x, y,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 120,
          life: 0.7 + Math.random() * 0.9, age: 0,
          size: 2 + Math.random() * 5, colour,
        });
      }
    },
    update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        p.vy += 320 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    list() { return parts; },
    clear() { parts.length = 0; },
  };
}
