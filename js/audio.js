// NES 2A03-style chiptune engine. Pure WebAudio, no deps.
// Channels: p1 = pulse lead (50% duty), p2 = pulse harmony (25% duty),
// tr = triangle bass (played one octave down), nz = noise/drums.

// ---------- note helpers ----------
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const nm = s => { const m = /^([A-G]#?)(\d)$/.exec(s); return NOTE[m[1]] + (+m[2] + 1) * 12; };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------- pattern-building helpers (all steps are 16th notes) ----------
// mel: sequential [note,len] pairs -> [step,note,len] events (null note = rest)
const mel = pairs => { let t = 0; const o = []; for (const [n, l] of pairs) { if (n) o.push([t, n, l]); t += l; } return o; };
// bars: concat per-bar (16-step) event lists with offsets
const bars = (...bs) => bs.flatMap((b, i) => b.map(([s, n, l]) => [s + 16 * i, n, l]));
// e8: array of eighth notes (null = rest), spans any number of bars (8 per bar)
const e8 = ns => ns.flatMap((n, i) => (n ? [[i * 2, n, 2]] : []));
// dr: drum string, one char per 16th: k=kick s=snare h=hat .=rest
const dr = s => [...s].flatMap((c, i) => (c === '.' ? [] : [[i, c]]));
const r8 = n => Array(8).fill(n);
const o8 = (a, b) => [a, b, a, b, a, b, a, b];

// ---------- song data ----------
const AM = r8(null).map((_, i) => ['A3', 'C4', 'E4', 'C4'][i % 4]);
const FM = ['F3', 'A3', 'C4', 'A3', 'F3', 'A3', 'C4', 'A3'];
const GM = ['G3', 'B3', 'D4', 'B3', 'G3', 'B3', 'D4', 'B3'];
const groove = (r, s) => mel([[r, 3], [null, 1], [r, 2], [s, 2], [r, 3], [null, 1], [s, 2], [r, 2]]);
const emS = [null, 'E3', null, 'G3', null, 'E3', null, 'B3'];
const gS = [null, 'G3', null, 'B3', null, 'G3', null, 'D4'];
const aS = [null, 'A3', null, 'C4', null, 'A3', null, 'E4'];
const q = (a, b) => [[a, 4], [b, 4], [a, 4], [b, 4]];

const SONGS = {
  // Brooding 80s synth-score pulse, E minor (original, John Carpenter-style):
  // relentless octave bass 8ths on i-VI-VII, sparse long-note lead.
  title: {
    tempo: 116, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: mel([[null, 8], ['E5', 6], ['D5', 2], ['B4', 12], [null, 4],
        ['C5', 6], ['B4', 2], ['A4', 8], ['F#4', 4], ['G4', 10], [null, 2]]),
        p2: e8([...o8('E3', 'E4'), ...o8('E3', 'E4'), ...o8('C3', 'C4'), ...o8('D3', 'D4')]),
        tr: e8([...r8('E2'), ...r8('E2'), ...r8('C2'), ...r8('D2')]),
        nz: dr('k.hhs.h.k.h.s.hh'.repeat(4)),
      },
      B: {
        steps: 64,
        p1: mel([[null, 4], ['G5', 8], ['F#5', 2], ['E5', 2], ['D5', 8], ['B4', 8],
        ['C5', 4], ['D5', 4], ['E5', 8], ['D5', 2], ['C5', 2], ['B4', 10], [null, 2]]),
        p2: e8([...o8('G3', 'G4'), ...o8('E3', 'E4'), ...o8('C3', 'C4'), ...o8('D3', 'D4')]),
        tr: e8([...r8('G2'), ...r8('E2'), ...r8('C2'), ...r8('D2')]),
        nz: dr('k.hhs.h.k.h.s.hh'.repeat(3) + 'k.hhs.h.k.hhs.s.'),
      },
    },
  },

  // Mid-tempo E minor pentatonic groove, grace-note ornaments (16th before the beat).
  street: {
    tempo: 120, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: mel([['E4', 4], ['G4', 1], ['A4', 3], ['B4', 4], ['A4', 1], ['G4', 3],
        ['E4', 6], ['D4', 2], ['E4', 8],
        ['G4', 4], ['A4', 1], ['B4', 3], ['D5', 4], ['B4', 4],
        ['A4', 6], ['G4', 2], ['E4', 8]]),
        p2: e8([...emS, ...emS, ...gS, ...aS]),
        tr: bars(groove('E2', 'G2'), groove('E2', 'D2'), groove('G2', 'B2'), groove('A2', 'G2')),
        nz: dr('k.h.h.s.h.k.s.h.'.repeat(4)),
      },
      B: {
        steps: 64,
        p1: mel([['B4', 4], ['D5', 1], ['E5', 3], ['D5', 4], ['B4', 4],
        ['A4', 6], ['B4', 2], ['G4', 8],
        ['E4', 4], ['G4', 4], ['A4', 2], ['G4', 2], ['D4', 4],
        ['E4', 12], [null, 4]]),
        p2: e8([...emS, ...emS, ...aS, ...emS]),
        tr: bars(groove('E2', 'G2'), groove('E2', 'D2'), groove('A2', 'G2'),
          mel([['E2', 3], [null, 1], ['E2', 2], ['G2', 2], ['E2', 8]])),
        nz: dr('k.h.h.s.h.k.s.h.'.repeat(3) + 'k.h.h.s.h.s.s.s.'),
      },
    },
  },

  // Tense: chromatic triangle bassline, sparse pulse stabs, tritone drone.
  warehouse: {
    tempo: 132, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: bars(
          mel([[null, 6], ['C5', 2], [null, 6], ['D#5', 2]]),
          mel([[null, 6], ['B4', 2], [null, 6], ['C5', 2]]),
          mel([[null, 6], ['F#4', 2], [null, 6], ['G4', 2]]),
          mel([[null, 4], ['G4', 2], [null, 2], ['F#4', 2], [null, 4], ['C5', 2]])),
        p2: mel([['G3', 16], ['F#3', 16], ['G3', 16], ['F#3', 16]]),
        tr: bars(
          mel([['C2', 2], [null, 2], ['C2', 2], ['B1', 2], ['C2', 2], [null, 2], ['C#2', 2], ['D2', 2]]),
          mel([['C2', 2], [null, 2], ['C2', 2], ['B1', 2], ['C2', 2], [null, 2], ['D#2', 2], ['D2', 2]]),
          mel([['C2', 2], [null, 2], ['C2', 2], ['B1', 2], ['C2', 2], [null, 2], ['C#2', 2], ['D2', 2]]),
          mel([['C2', 2], [null, 2], ['C2', 2], ['B1', 2], ['C2', 2], ['C#2', 2], ['D2', 2], ['D#2', 2]])),
        nz: dr('k...h...s...h.h.'.repeat(4)),
      },
      B: {
        steps: 64,
        p1: bars(
          mel([[null, 6], ['F5', 2], [null, 6], ['G#5', 2]]),
          mel([[null, 6], ['E5', 2], [null, 6], ['F5', 2]]),
          mel([[null, 2], ['G4', 2], [null, 2], ['G#4', 2], [null, 2], ['A4', 2], [null, 2], ['A#4', 2]]),
          mel([['B4', 8], ['G4', 4], ['F#4', 4]])),
        p2: mel([['C4', 16], ['B3', 16], ['F#3', 16], ['G3', 16]]),
        tr: bars(
          mel([['F2', 2], [null, 2], ['F2', 2], ['E2', 2], ['F2', 2], [null, 2], ['F#2', 2], ['G2', 2]]),
          mel([['F2', 2], [null, 2], ['F2', 2], ['E2', 2], ['F2', 2], [null, 2], ['G#2', 2], ['G2', 2]]),
          mel([['C2', 4], ['C#2', 4], ['D2', 4], ['D#2', 4]]),
          mel([['E2', 4], ['D#2', 4], ['D2', 4], ['C#2', 4]])),
        nz: dr('k...h...s...h.h.'.repeat(3) + 'k...s...s.s.s.s.'),
      },
    },
  },

  // Slow, eerie, built on the E/A# tritone. Sparse drips on p2.
  sewers: {
    tempo: 90, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: mel([['E4', 12], [null, 4], ['A#4', 12], [null, 4], ['G4', 8], ['F#4', 8], ['E4', 16]]),
        p2: bars([[10, 'E5', 1], [14, 'A#5', 1]], [], [[12, 'C#5', 1]], [[8, 'A#5', 1], [9, 'E5', 1]]),
        tr: mel([['E2', 12], [null, 4], [null, 16], ['A#2', 12], [null, 4], ['E2', 16]]),
        nz: dr('k...............' + '........h.......' + '............s...' + 'k.......h.......'),
      },
      B: {
        steps: 64,
        p1: mel([['B4', 12], [null, 4], ['F5', 12], [null, 4], ['D5', 8], ['A#4', 8], ['E4', 16]]),
        p2: bars([[6, 'B5', 1]], [[10, 'F#5', 1], [11, 'F5', 1]], [], [[4, 'A#5', 1], [12, 'E5', 1]]),
        tr: mel([['B2', 12], [null, 4], ['F2', 12], [null, 4], ['D2', 16], ['E2', 16]]),
        nz: dr('k.......h.......' + '................' + '............s...' + 'k...............'),
      },
    },
  },

  // Grand: gong-like long low triangle hits, Chinese-pentatonic (D E F# A B) fanfare.
  lair: {
    tempo: 140, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: mel([['D4', 2], ['D4', 2], ['D4', 2], ['E4', 2], ['F#4', 8],
        ['A4', 2], ['A4', 2], ['B4', 2], ['A4', 2], ['F#4', 8],
        ['B4', 4], ['A4', 2], ['F#4', 2], ['E4', 4], ['D4', 4],
        ['E4', 12], [null, 4]]),
        p2: mel([...q('A3', 'D4'), ...q('A3', 'D4'), ...q('B3', 'D4'), ...q('A3', 'C#4')]),
        tr: mel([['D2', 12], [null, 4], ['D2', 12], [null, 4], ['G2', 12], [null, 4], ['A2', 12], [null, 4]]),
        nz: dr('k...k...k...s...'.repeat(4)),
      },
      B: {
        steps: 64,
        p1: mel([['D5', 2], ['D5', 2], ['B4', 2], ['A4', 2], ['B4', 8],
        ['A4', 4], ['F#4', 2], ['A4', 2], ['B4', 4], ['D5', 4],
        ['E5', 4], ['D5', 2], ['B4', 2], ['A4', 2], ['F#4', 2], ['E4', 4],
        ['D4', 16]]),
        p2: mel([...q('B3', 'D4'), ...q('A3', 'D4'), ...q('A3', 'E4'), ...q('A3', 'D4')]),
        tr: mel([['G2', 12], [null, 4], ['D2', 12], [null, 4], ['A2', 12], [null, 4], ['D2', 16]]),
        nz: dr('k...k...k...s...'.repeat(3) + 'k...k...s.s.s...'),
      },
    },
  },

  // Fast 170bpm aggressive riff in E minor, galloping octave bass, chromatic turnaround.
  boss: {
    tempo: 170, order: ['A', 'B'],
    pats: {
      A: {
        steps: 64,
        p1: mel([['E4', 2], ['E4', 2], ['G4', 2], ['E4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['D4', 2],
        ['E4', 2], ['E4', 2], ['G4', 2], ['A4', 2], ['B4', 4], ['D5', 2], ['B4', 2],
        ['E4', 2], ['E4', 2], ['G4', 2], ['E4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['D4', 2],
        ['C5', 2], ['B4', 2], ['A4', 2], ['G4', 2], ['A4', 2], ['G4', 2], ['E4', 2], ['D4', 2]]),
        p2: e8([...r8('E3'), ...r8('E3'), ...r8('E3'), 'C3', 'C3', 'C3', 'C3', 'D3', 'D3', 'D3', 'D3']),
        tr: e8([...o8('E2', 'E3'), ...o8('E2', 'E3'), ...o8('E2', 'E3'),
          'C2', 'C3', 'C2', 'C3', 'D2', 'D3', 'D2', 'D3']),
        nz: dr('k.h.s.h.k.k.s.h.'.repeat(4)),
      },
      B: {
        steps: 64,
        p1: mel([['E5', 2], ['E5', 2], ['G5', 2], ['E5', 2], ['A5', 2], ['G5', 2], ['E5', 2], ['D5', 2],
        ['E5', 2], ['D5', 2], ['B4', 2], ['A4', 2], ['B4', 4], ['G4', 2], ['A4', 2],
        ['C5', 4], ['B4', 4], ['A#4', 4], ['A4', 4],
        ['G4', 2], ['A4', 2], ['B4', 2], ['C5', 2], ['D5', 2], ['D#5', 2], ['E5', 2], [null, 2]]),
        p2: e8([...r8('E3'), ...r8('E3'),
          'C3', 'C3', 'B2', 'B2', 'A#2', 'A#2', 'A2', 'A2', ...r8('B2')]),
        tr: e8([...o8('E2', 'E3'), ...o8('E2', 'E3'),
          'C3', 'C3', 'B2', 'B2', 'A#2', 'A#2', 'A2', 'A2', ...o8('B2', 'B3')]),
        nz: dr('k.h.s.h.k.k.s.h.'.repeat(3) + 's.s.s.s.k.k.k.k.'),
      },
    },
  },

  // 4-bar C major fanfare, non-looping.
  victory: {
    tempo: 150, loop: false, order: ['A'],
    pats: {
      A: {
        steps: 64,
        p1: mel([['C5', 2], ['C5', 2], ['C5', 2], ['E5', 2], ['G5', 8],
        ['F5', 2], ['E5', 2], ['D5', 2], ['F5', 2], ['E5', 8],
        ['C5', 2], ['E5', 2], ['G5', 2], ['C6', 2], ['A5', 4], ['G5', 4],
        ['C6', 16]]),
        p2: bars(
          e8(['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', 'E4']),
          e8(['C4', 'F4', 'A4', 'F4', 'C4', 'F4', 'A4', 'F4']),
          e8(['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'A4', 'B4']),
          [[0, 'E5', 16]]),
        tr: mel([['C2', 4], ['G2', 4], ['C2', 4], ['G2', 4],
        ['F2', 4], ['C2', 4], ['F2', 4], ['G2', 4],
        ['C2', 4], ['G2', 4], ['A2', 4], ['B2', 4],
        ['C2', 16]]),
        nz: dr('k...s...k...s...' + 'k...s...k...s...' + 'k...s...s.s.s.s.' + 'k...............'),
      },
    },
  },

  // Short descending phrase, non-looping.
  gameover: {
    tempo: 100, loop: false, order: ['A'],
    pats: {
      A: {
        steps: 32,
        p1: mel([['A4', 4], ['G4', 4], ['F4', 4], ['E4', 4],
        ['F4', 2], ['E4', 2], ['D4', 2], ['B3', 2], ['A3', 8]]),
        p2: mel([['E4', 4], ['D4', 4], ['C4', 4], ['B3', 4],
        ['D4', 2], ['C4', 2], ['B3', 2], ['G#3', 2], ['E3', 8]]),
        tr: mel([['A2', 8], ['F2', 8], ['E2', 8], ['A2', 8]]),
        nz: dr('k...............k.......s.......'),
      },
    },
  },
};

// ---------- engine ----------
let ctx = null, master = null, noiseBuf = null;
const waves = {};
let current = null; // { gain, timer, step, nextTime, spb, total, loop, byStep }

function dutyWave(d) {
  const n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * d);
  return ctx.createPeriodicWave(re, im);
}

// Pulse voice with a slight NES-style decay to 50% volume.
function pulse(t, dur, midi, duty, vol, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.setPeriodicWave(waves[duty]);
  o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.004);
  g.gain.linearRampToValueAtTime(vol * 0.55, t + Math.max(0.02, dur - 0.02));
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
}

// Triangle bass: real triangle osc, one octave down, flat NES volume (no envelope control on 2A03).
function tri(t, dur, midi, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = hz(midi);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.5, t + 0.005);
  g.gain.setValueAtTime(0.5, t + Math.max(0.01, dur - 0.03));
  g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
}

function noiseHit(t, dur, hpFreq, vol, dest) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf;
  f.type = 'highpass'; f.frequency.value = hpFreq;
  g.gain.setValueAtTime(vol, t);
  g.gain.linearRampToValueAtTime(0, t + dur);
  s.connect(f).connect(g).connect(dest);
  s.start(t); s.stop(t + dur + 0.02);
}

function drum(t, type, dest) {
  if (type === 'k') { // kick: quick pitch-dropping triangle thump
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    g.gain.setValueAtTime(0.55, t);
    g.gain.linearRampToValueAtTime(0, t + 0.13);
    o.connect(g).connect(dest);
    o.start(t); o.stop(t + 0.15);
  } else if (type === 's') { // snare: medium noise burst
    noiseHit(t, 0.11, 1200, 0.28, dest);
  } else { // 'h' closed hat: very short highpassed burst
    noiseHit(t, 0.035, 7000, 0.16, dest);
  }
}

function playNote(ch, n, len, c) {
  const t = c.nextTime, d = len * c.spb;
  if (ch === 'nz') drum(t, n, c.gain);
  else if (ch === 'tr') tri(t, d, nm(n) - 12, c.gain);
  else if (ch === 'p1') pulse(t, d, nm(n), 'd50', 0.2, c.gain);
  else pulse(t, d, nm(n), 'd25', 0.12, c.gain);
}

// Schedule-ahead sequencer: ~0.1s lookahead on a 25ms interval, 16th-note grid.
function tick() {
  const c = current;
  if (!c || !c.timer) return;
  while (c.nextTime < ctx.currentTime + 0.1) {
    for (const ev of c.byStep[c.step]) playNote(ev[0], ev[1], ev[2], c);
    c.step++; c.nextTime += c.spb;
    if (c.step >= c.total) {
      if (c.loop) c.step = 0;
      else { clearInterval(c.timer); c.timer = 0; return; }
    }
  }
}

export const Audio = {
  init() {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.25;
      master.connect(ctx.destination);
      waves.d50 = dutyWave(0.5);
      waves.d25 = dutyWave(0.25);
      waves.d125 = dutyWave(0.125);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
  },

  playSong(id) {
    if (!ctx) return;
    this.stopSong();
    const song = SONGS[id];
    if (!song) return;
    const spb = 60 / song.tempo / 4; // seconds per 16th
    let total = 0;
    for (const k of song.order) total += song.pats[k].steps;
    const byStep = Array.from({ length: total }, () => []);
    let off = 0;
    for (const k of song.order) {
      const p = song.pats[k];
      for (const ch of ['p1', 'p2', 'tr']) {
        for (const [s, n, l] of p[ch] || []) byStep[off + s].push([ch, n, l]);
      }
      for (const [s, dtype] of p.nz || []) byStep[off + s].push(['nz', dtype]);
      off += p.steps;
    }
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(master);
    current = {
      gain, byStep, spb, total,
      loop: song.loop !== false,
      step: 0,
      nextTime: ctx.currentTime + 0.05,
      timer: 0,
    };
    current.timer = setInterval(tick, 25);
    tick();
  },

  stopSong() {
    if (!current) return;
    if (current.timer) clearInterval(current.timer);
    try { current.gain.disconnect(); } catch (e) { /* already gone */ }
    current = null;
  },

  sfx(name) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const blip = (f0, f1, dur, vol) => { // square sweep
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.setPeriodicWave(waves.d50);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    };
    const arpNotes = (midis, step, vol) => {
      midis.forEach((m, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.setPeriodicWave(waves.d25);
        o.frequency.value = hz(m);
        const t0 = t + i * step;
        g.gain.setValueAtTime(vol, t0);
        g.gain.linearRampToValueAtTime(0, t0 + step * 1.4);
        o.connect(g).connect(master);
        o.start(t0); o.stop(t0 + step * 1.5);
      });
    };
    switch (name) {
      case 'punch': blip(300, 150, 0.08, 0.3); break;
      case 'kick': blip(220, 100, 0.09, 0.3); break;
      case 'hit':
        noiseHit(t, 0.08, 800, 0.3, master);
        blip(110, 80, 0.08, 0.25);
        break;
      case 'knockdown':
        blip(400, 55, 0.25, 0.28);
        drum(t + 0.18, 'k', master);
        break;
      case 'jump': blip(200, 620, 0.12, 0.22); break;
      case 'enemydown': arpNotes([69, 64, 60, 57], 0.06, 0.22); break; // A4 E4 C4 A3 down
      case 'select': arpNotes([72, 79], 0.05, 0.25); break;            // C5 G5
      case 'dialog': blip(800, 780, 0.02, 0.08); break;
      case 'thunder': {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noiseBuf; s.loop = true;
        f.type = 'lowpass';
        f.frequency.setValueAtTime(500, t);
        f.frequency.exponentialRampToValueAtTime(60, t + 1.2);
        g.gain.setValueAtTime(0.4, t);
        g.gain.linearRampToValueAtTime(0, t + 1.3);
        s.connect(f).connect(g).connect(master);
        s.start(t); s.stop(t + 1.35);
        break;
      }
      case 'pickup': arpNotes([72, 76, 79, 84], 0.045, 0.22); break;   // C5 E5 G5 C6 up
    }
  },
};
