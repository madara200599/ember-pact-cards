// Ember Pact — audio.js: synthesized sound, no files. One job: every blip, snap
// and flourish the game plays, made with the Web Audio API alone.

export function makeSoundBank() {
  let ctx = null;
  let muted = false;
  let unlocked = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  // Call from a user gesture (click/key) so the browser allows sound.
  function unlock() {
    unlocked = true;
    ensure();
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted || !unlocked) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock,
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    // A card sliding across the table.
    slide() { tone(420, 0.12, 'sine', 0.08, 0, 620); },
    // A card flipping face-up.
    flip() { tone(880, 0.09, 'triangle', 0.12, 0, 1320); },
    // A card snapping into its slot.
    snap() { tone(240, 0.07, 'square', 0.06); tone(1200, 0.05, 'sine', 0.05, 0.02); },
    // A trick won.
    winTrick() {
      tone(523, 0.12, 'triangle', 0.12);
      tone(659, 0.12, 'triangle', 0.12, 0.09);
      tone(784, 0.2, 'triangle', 0.14, 0.18);
    },
    // A trick lost.
    loseTrick() {
      tone(330, 0.16, 'sawtooth', 0.05, 0, 220);
      tone(220, 0.22, 'sawtooth', 0.05, 0.12, 165);
    },
    // A pact sealed.
    pact() {
      tone(1046, 0.1, 'sine', 0.1);
      tone(1318, 0.14, 'sine', 0.1, 0.07);
      tone(1568, 0.2, 'sine', 0.1, 0.14);
    },
    // The win flourish: a rising arpeggio over the ember burst.
    winFanfare() {
      const notes = [523, 659, 784, 1046, 1318, 1568];
      notes.forEach((n, i) => tone(n, 0.28, 'triangle', 0.13, i * 0.11));
      tone(2093, 0.5, 'sine', 0.08, 0.7);
    },
    // The loss: a low ember dying out.
    loseDirge() {
      tone(196, 0.5, 'sine', 0.09, 0, 98);
      tone(147, 0.8, 'sine', 0.07, 0.3, 73);
    },
  };
}
