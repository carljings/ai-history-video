'use strict';
/* core.js — shared engine for "The History of AI" (120 s @ 1920x1080).
   Every frame is a pure function of time t (seconds), so frames can be rendered
   independently, in any order, by several browsers in parallel. */

const W = 1920, H = 1080, DURATION = 120;
const TAU = Math.PI * 2;
const VCX = 1360, VCY = 520;            // centre of the right-hand visual area

/* ------------------------------------------------------------------ math */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (a, b, x) => clamp((x - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const E = {
  in2: t => t * t,
  out2: t => 1 - (1 - t) * (1 - t),
  in3: t => t * t * t,
  out3: t => 1 - Math.pow(1 - t, 3),
  io2: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  io3: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out5: t => 1 - Math.pow(1 - t, 5),
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
/** integer hash -> [0,1) */
function hash(i, seed = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** seeded PRNG (mulberry32) */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** smooth 1-D value noise in [-1,1] */
function vnoise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return lerp(hash(i, seed), hash(i + 1, seed), smooth(f)) * 2 - 1;
}
/** piecewise-smooth curve through [t, value] keyframes */
function curve(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (t <= K[i][0]) {
      const [t0, v0] = K[i - 1], [t1, v1] = K[i];
      return lerp(v0, v1, smooth((t - t0) / (t1 - t0)));
    }
  }
  return K[K.length - 1][1];
}

/* ---------------------------------------------------------------- colour */
const WHITE = [255, 255, 255];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`;
const mixc = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t), lerp(p[2], q[2], t)];

/* ---------------------------------------------------------------- canvas */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const LAYER = makeCanvas(W, H), lctx = LAYER.getContext('2d');
function resetCtx(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.shadowColor = 'rgba(0,0,0,0)';
  c.letterSpacing = '0px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.lineCap = 'butt'; c.lineJoin = 'miter'; c.setLineDash([]); c.lineWidth = 1;
}

/* ------------------------------------------------------------------ text */
const F = {
  sans: 'Space Grotesk', body: 'Inter', serif: 'Playfair Display', mono: 'JetBrains Mono',
  crt: 'VT323', type: 'Special Elite', sym: 'DejaVu Sans', emoji: 'Noto Color Emoji',
};
const font = (w, s, fam = F.sans, italic = false) => `${italic ? 'italic ' : ''}${w} ${s}px "${fam}"`;

/** fillText with styling in one call; compensates letterSpacing's trailing gap */
function text(c, str, x, y, { f, color = '#fff', align = 'left', base = 'alphabetic', sp = 0, alpha = 1 } = {}) {
  if (alpha <= 0.002) return;
  if (f) c.font = f;
  c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.letterSpacing = sp + 'px';
  const ga = c.globalAlpha; c.globalAlpha = ga * clamp(alpha);
  c.fillText(str, x + (align === 'center' ? sp / 2 : align === 'right' ? sp : 0), y);
  c.globalAlpha = ga;
}
function wrapLines(c, str, maxW) {
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (cur && c.measureText(test).width > maxW) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
/** word-by-word reveal: each word rises and fades in with a stagger (left aligned) */
function drawWords(c, lines, x, y, lh, t0, t, { stagger = 0.035, dur = 0.55, rise = 16, alpha = 1 } = {}) {
  let k = 0;
  const ga = c.globalAlpha;
  lines.forEach((line, li) => {
    let cx = x;
    for (const w of line.split(' ')) {
      const p = E.out3(prog(t0 + k * stagger, t0 + k * stagger + dur, t));
      if (p > 0) { c.globalAlpha = ga * alpha * p; c.fillText(w, cx, y + li * lh + (1 - p) * rise); }
      cx += c.measureText(w + ' ').width;
      k++;
    }
  });
  c.globalAlpha = ga;
}
/** typewriter schedule: times at which each character of `str` appears */
function typeTimes(str, t0, cps, seed = 1) {
  const out = [];
  let t = t0;
  for (let i = 0; i < str.length; i++) {
    out.push(t);
    const ch = str[i];
    let d = (1 / cps) * (0.65 + 0.7 * hash(i, seed));
    if (ch === ',') d += 0.06;
    if (ch === '.' || ch === '?' || ch === '!') d += 0.1;
    t += d;
  }
  out.end = t;
  return out;
}
const countTyped = (times, t) => { let n = 0; while (n < times.length && times[n] <= t) n++; return n; };

/* ----------------------------------------------------------- audio events */
const AUDIO = [];
function sfx(t, type, o = {}) { AUDIO.push(Object.assign({ t: Math.round(t * 1000) / 1000, type }, o)); }
/** typing clicks, thinned so fast bursts don't become a buzz */
function sfxTyping(times, str, type, minGap = 0.05, vel = 1) {
  let last = -1;
  times.forEach((tt, i) => {
    if (str[i] === ' ' || tt - last < minGap) return;
    sfx(tt, type, { v: vel * (0.75 + 0.25 * hash(i, 77)) });
    last = tt;
  });
}

/* --------------------------------------------------------------- sprites */
const _sprites = new Map();
function glowSprite(col, hot = true) {
  const q = col.map(v => (v >> 3) << 3), key = q.join(',') + (hot ? 'h' : 's');
  let s = _sprites.get(key);
  if (!s) {
    s = makeCanvas(64, 64);
    const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (hot) {
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.1, rgba(mixc(q, WHITE, 0.55), 0.95));
      gr.addColorStop(0.3, rgba(q, 0.4));
      gr.addColorStop(0.6, rgba(q, 0.1));
    } else {
      gr.addColorStop(0, rgba(q, 1));
      gr.addColorStop(0.45, rgba(q, 0.55));
      gr.addColorStop(0.75, rgba(q, 0.15));
    }
    gr.addColorStop(1, rgba(q, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _sprites.set(key, s);
  }
  return s;
}
function glow(c, x, y, r, col, a = 1, hot = true) {
  if (a <= 0.003 || r <= 0) return;
  const ga = c.globalAlpha;
  c.globalAlpha = ga * Math.min(1, a);
  c.drawImage(glowSprite(col, hot), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = ga;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

/* =============================================================== timeline */
const SCENES = [
  { id: 'intro', t0: 0, t1: 8, cam: false },
  { id: 'y1943', t0: 8, t1: 14, year: 1943, chapter: 'THE DREAM', title: 'The first artificial neuron',
    sub: 'Warren McCulloch & Walter Pitts describe brain cells as simple logic switches.' },
  { id: 'y1950', t0: 14, t1: 20, year: 1950, chapter: 'THE QUESTION', title: '“Can machines think?”',
    sub: 'Alan Turing proposes the Imitation Game — later known as the Turing Test.' },
  { id: 'y1956', t0: 20, t1: 26, year: 1956, chapter: 'THE BIRTH', title: 'A new field gets its name',
    sub: 'A summer workshop at Dartmouth College launches AI as a field of research.' },
  { id: 'y1958', t0: 26, t1: 32, year: 1958, chapter: 'EARLY OPTIMISM', title: 'The Perceptron',
    sub: 'Frank Rosenblatt unveils the perceptron, a neural network that learns from examples.' },
  { id: 'y1966', t0: 32, t1: 38, year: 1966, chapter: 'EARLY OPTIMISM', title: 'ELIZA, the first chatbot',
    sub: 'Joseph Weizenbaum’s MIT program plays therapist — and people confide in it.' },
  { id: 'y1974', t0: 38, t1: 46, year: 1974, chapter: 'WINTER', title: 'The first AI winter',
    sub: 'Big promises meet slow computers. Funding freezes for years.' },
  { id: 'y1986', t0: 46, t1: 54, year: 1986, chapter: 'THE REVIVAL', title: 'Backpropagation',
    sub: 'Rumelhart, Hinton & Williams teach multi-layer networks to learn from their mistakes.' },
  { id: 'y1997', t0: 54, t1: 62, year: 1997, chapter: 'MAN VS. MACHINE', title: 'Deep Blue beats Kasparov',
    sub: 'Searching 200 million positions a second, IBM’s machine defeats the world chess champion.' },
  { id: 'y2012', t0: 62, t1: 70, year: 2012, chapter: 'THE DEEP LEARNING BIG BANG', title: 'Deep learning takes off',
    sub: 'AlexNet, trained on gaming GPUs, crushes the ImageNet image-recognition challenge.' },
  { id: 'y2016', t0: 70, t1: 78, year: 2016, chapter: 'SUPERHUMAN', title: 'AlphaGo’s Move 37',
    sub: 'DeepMind’s AlphaGo beats Go legend Lee Sedol 4–1, with moves no human would play.' },
  { id: 'y2017', t0: 78, t1: 86, year: 2017, chapter: 'ATTENTION', title: 'Attention is all you need',
    sub: 'Google researchers unveil the Transformer — the “T” in GPT and the engine of modern AI.' },
  { id: 'y2020', t0: 86, t1: 92, year: 2020, chapter: 'SCALE', title: 'Bigger is different',
    sub: 'GPT-3’s 175 billion parameters learn to write, translate and code from a few examples.' },
  { id: 'y2022', t0: 92, t1: 100, year: 2022, chapter: 'THE GENERATIVE ERA', title: 'AI goes mainstream',
    sub: 'ChatGPT reaches 100 million users in two months. Generative AI is everywhere.' },
  { id: 'y2024', t0: 100, t1: 106, year: 2024, chapter: 'RECOGNITION', title: 'Nobel Prizes for AI',
    sub: 'Hopfield & Hinton win in Physics; Hassabis & Jumper share Chemistry for AlphaFold.' },
  { id: 'y2025', t0: 106, t1: 112, year: 2025, chapter: 'REASONING', title: 'Machines that reason',
    sub: 'AI reaches gold-medal level at the Math Olympiad, and agents start doing real work.' },
  { id: 'finale', t0: 112, t1: 120, cam: false },
];
const YEARS = SCENES.filter(s => s.year);
function yearIndex(t) {
  for (let i = YEARS.length - 1; i >= 0; i--) if (t >= YEARS[i].t0 - 0.2) return i;
  return 0;
}

/* ---------------------------------------------------------------- palette */
const PAL = [
  { t: 0,   bg: [2, 3, 9],    ga: [30, 60, 150],  gb: [80, 40, 150],  acc: [140, 190, 255] },
  { t: 8,   bg: [11, 7, 4],   ga: [255, 150, 60], gb: [140, 70, 20],  acc: [255, 184, 108] },
  { t: 26,  bg: [3, 10, 10],  ga: [60, 220, 170], gb: [40, 90, 160],  acc: [110, 240, 205] },
  { t: 32,  bg: [2, 9, 5],    ga: [60, 255, 120], gb: [30, 90, 60],   acc: [120, 255, 160] },
  { t: 38,  bg: [6, 9, 15],   ga: [140, 185, 255], gb: [200, 220, 255], acc: [185, 215, 255] },
  { t: 46,  bg: [9, 3, 19],   ga: [255, 40, 180], gb: [40, 200, 255], acc: [255, 100, 210] },
  { t: 54,  bg: [8, 7, 5],    ga: [230, 180, 90], gb: [90, 70, 40],   acc: [240, 200, 125] },
  { t: 62,  bg: [2, 6, 16],   ga: [40, 120, 255], gb: [0, 200, 255],  acc: [95, 175, 255] },
  { t: 70,  bg: [3, 10, 10],  ga: [40, 200, 180], gb: [200, 150, 80], acc: [90, 235, 215] },
  { t: 78,  bg: [8, 4, 17],   ga: [150, 80, 255], gb: [60, 160, 255], acc: [190, 150, 255] },
  { t: 86,  bg: [3, 5, 14],   ga: [60, 110, 255], gb: [255, 120, 60], acc: [130, 180, 255] },
  { t: 92,  bg: [7, 4, 15],   ga: [255, 80, 160], gb: [40, 220, 200], acc: [120, 255, 225] },
  { t: 100, bg: [10, 8, 3],   ga: [255, 200, 90], gb: [180, 120, 40], acc: [255, 214, 125] },
  { t: 106, bg: [3, 7, 13],   ga: [80, 200, 255], gb: [160, 120, 255], acc: [140, 220, 255] },
  { t: 112, bg: [2, 3, 9],    ga: [60, 110, 255], gb: [140, 90, 255], acc: [170, 205, 255] },
];
function paletteAt(t) {
  let { bg, ga, gb, acc } = PAL[0];
  for (let i = 1; i < PAL.length; i++) {
    const w = smooth(prog(PAL[i].t - 0.6, PAL[i].t + 0.6, t));
    if (w <= 0) break;
    bg = mixc(bg, PAL[i].bg, w); ga = mixc(ga, PAL[i].ga, w); gb = mixc(gb, PAL[i].gb, w); acc = mixc(acc, PAL[i].acc, w);
  }
  return { bg, ga, gb, acc };
}

/* ------------------------------------------------------------- background */
function drawBackground(c, t, P) {
  c.fillStyle = rgba(P.bg, 1);
  c.fillRect(0, 0, W, H);
  const k = curve([[0, 0.3], [2, 1], [118, 1], [120, 0.4]], t);
  const g1x = 1250 + 180 * Math.sin(t * 0.11), g1y = 430 + 90 * Math.cos(t * 0.13);
  let g = c.createRadialGradient(g1x, g1y, 0, g1x, g1y, 1050);
  g.addColorStop(0, rgba(P.ga, 0.17 * k)); g.addColorStop(0.45, rgba(P.ga, 0.05 * k)); g.addColorStop(1, rgba(P.ga, 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const g2x = 280 + 140 * Math.cos(t * 0.09), g2y = 880 + 70 * Math.sin(t * 0.15);
  g = c.createRadialGradient(g2x, g2y, 0, g2x, g2y, 950);
  g.addColorStop(0, rgba(P.gb, 0.11 * k)); g.addColorStop(1, rgba(P.gb, 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

/* ------------------------------------- "neural dust": the growing network */
const DUST_N = 340;
const DUST = (() => {
  const r = rng(7);
  return Array.from({ length: DUST_N }, () => ({
    x: r() * (W + 200) - 100, y: r() * (H + 200) - 100, z: 0.3 + 0.7 * r(),
    vx: (r() - 0.5) * 16, vy: (r() - 0.5) * 10, ph: r() * TAU, sz: r(),
  }));
})();
const GROWTH = [[0, 0.22], [8, 0.16], [20, 0.28], [32, 0.4], [38, 0.42], [46, 0.3], [54, 0.3], [62, 0.55], [70, 0.7], [86, 0.85], [100, 1.0], [120, 1.0]];
const LINKS = [[0, 0], [8, 0.22], [37.6, 0.4], [39.4, 0], [45.6, 0], [47, 0.45], [53, 0.45], [53.6, 0.05], [62, 0.6], [100, 1], [111.5, 1], [113, 0]];
const SNOW = [[0, 0], [38.2, 0], [39.6, 1], [45.3, 1], [46.4, 0], [120, 0]];
const SNOW_CUM = (() => {
  const a = new Float32Array(12002);
  let s = 0;
  for (let i = 0; i <= 12001; i++) { a[i] = s; s += curve(SNOW, i / 100) / 100; }
  return a;
})();
function snowCum(t) {
  const x = clamp(t * 100, 0, 12000), i = Math.floor(x);
  return lerp(SNOW_CUM[i], SNOW_CUM[i + 1], x - i);
}
const snowAmt = t => curve(SNOW, t);

function drawDust(c, t, P, amount) {
  if (amount <= 0) return;
  const n = curve(GROWTH, t) * DUST_N, link = curve(LINKS, t) * amount;
  const snow = snowAmt(t), fall = snowCum(t);
  const col = mixc(P.acc, WHITE, 0.3 + 0.55 * snow);
  const pts = [];
  for (let i = 0; i < DUST_N; i++) {
    const vis = clamp(n - i);
    if (vis <= 0) break;
    const d = DUST[i];
    let x = d.x + d.vx * t * d.z + 40 * vnoise(t * 0.08 + i * 3.1, 11) + Math.sin(t * 1.1 + d.ph) * 16 * snow;
    let y = d.y + d.vy * t * d.z + 30 * vnoise(t * 0.07 + i * 1.7, 23) + fall * 150 * (0.35 + d.z);
    x = (((x + 100) % (W + 200)) + (W + 200)) % (W + 200) - 100;
    y = (((y + 100) % (H + 200)) + (H + 200)) % (H + 200) - 100;
    const tw = 0.65 + 0.35 * Math.sin(t * (1 + d.sz * 2) + d.ph);
    pts.push([x, y, d.z, vis * tw]);
  }
  if (link > 0.01) {
    const D = 150, D2 = D * D, NB = 6, buckets = Array.from({ length: NB }, () => []);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = p[0] - q[0], dy = p[1] - q[1], d2 = dx * dx + dy * dy;
        if (d2 < D2) {
          const a = (1 - Math.sqrt(d2) / D) * Math.min(p[3], q[3]);
          buckets[Math.min(NB - 1, (a * NB) | 0)].push(p, q);
        }
      }
    }
    c.lineWidth = 1;
    for (let b = 0; b < NB; b++) {
      const L = buckets[b];
      if (!L.length) continue;
      c.strokeStyle = rgba(col, link * 0.2 * (b + 0.5) / NB);
      c.beginPath();
      for (let k = 0; k < L.length; k += 2) { c.moveTo(L[k][0], L[k][1]); c.lineTo(L[k + 1][0], L[k + 1][1]); }
      c.stroke();
    }
  }
  c.globalCompositeOperation = 'lighter';
  for (const p of pts) glow(c, p[0], p[1], (4 + p[2] * 7) * (1 + snow * 0.7), col, p[3] * (0.3 + 0.45 * p[2]) * amount);
  c.globalCompositeOperation = 'source-over';
}

/* -------------------------------------------------------------------- HUD */
let DIGIT_W = 118;
function initHUD() {
  const c = lctx;
  c.font = font(700, 196);
  DIGIT_W = Math.max(...'0123456789'.split('').map(d => c.measureText(d).width)) + 4;
  for (const s of YEARS) {
    c.font = font(700, 54); c.letterSpacing = '-1px';
    s._title = wrapLines(c, s.title, 700);
    c.font = font(400, 28, F.body); c.letterSpacing = '0px';
    s._sub = wrapLines(c, s.sub, 630);
  }
  resetCtx(c);
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
function scramble(str, p, seed) {
  const n = str.length, front = p * (n + 6);
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = str[i];
    if (ch === ' ' || i < front - 6) out += ch;
    else if (i < front) out += GLYPHS[(hash(i * 31 + Math.floor(front * 4), seed) * GLYPHS.length) | 0];
    else out += ' ';
  }
  return out;
}

function hudVisibility(t) { return E.out2(prog(7.7, 8.6, t)) * (1 - E.in2(prog(111.2, 112.0, t))); }

function drawHUD(c, t, P) {
  const vis = hudVisibility(t);
  if (vis <= 0) return;
  const k = yearIndex(t), s = YEARS[k], lt = t - s.t0, dur = s.t1 - s.t0;
  const out = 1 - E.in2(prog(dur - 0.42, dur - 0.04, lt));
  const acc = mixc(P.acc, WHITE, 0.1);

  // chapter label
  const lp = prog(0.05, 0.75, lt);
  if (lp > 0) {
    c.strokeStyle = rgba(acc, 0.9 * vis * out); c.lineWidth = 2;
    c.beginPath(); c.moveTo(124, 314); c.lineTo(124 + 40 * E.out3(prog(0, 0.5, lt)), 314); c.stroke();
    text(c, scramble(s.chapter, lp, k + 3), 182, 322, { f: font(600, 19, F.mono), color: rgba(acc, 1), sp: 7, alpha: vis * out });
  }
  drawYear(c, t, vis, P, k);

  // title + subtitle
  c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = font(700, 54); c.letterSpacing = '-1px';
  c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 18;
  drawWords(c, s._title, 120, 596, 62, s.t0 + 0.22, t, { alpha: vis * out, stagger: 0.05, rise: 22 });
  c.font = font(400, 28, F.body); c.letterSpacing = '0px';
  c.fillStyle = 'rgba(236,240,248,1)';
  const sy = 596 + (s._title.length - 1) * 62 + 58;
  drawWords(c, s._sub, 122, sy, 41, s.t0 + 0.55, t, { alpha: 0.82 * vis * out, stagger: 0.018, rise: 12 });
  c.shadowBlur = 0;

  drawTimeline(c, t, vis, P, k);
}

function drawYear(c, t, vis, P, k) {
  const s = YEARS[k], prev = k > 0 ? YEARS[k - 1].year : 1900;
  const a = String(prev), b = String(s.year), x0 = 112, y = 505, DH = 205;
  c.save();
  c.font = font(700, 196); c.letterSpacing = '0px';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const val = (j, tt) => {
    const da = +a[j], db = +b[j], steps = (db - da + 10) % 10;
    const st = s.t0 - 0.25 + (3 - j) * 0.07;
    return da + steps * E.io3(prog(st, st + 0.75 + steps * 0.025, tt));
  };
  // soft glow, drawn unclipped (shadow-only: the glyph itself lands off-canvas); dims while a digit rolls
  c.shadowColor = rgba(P.acc, 0.5 * vis); c.shadowBlur = 45; c.shadowOffsetX = 10000; c.fillStyle = '#000';
  for (let j = 0; j < 4; j++) {
    const v = val(j, t), settle = Math.pow(1 - Math.sin(Math.PI * (v - Math.floor(v + 1e-6))), 2);
    if (settle < 0.02) continue;
    c.globalAlpha = settle;
    c.fillText(String(((Math.round(v) % 10) + 10) % 10), x0 + j * DIGIT_W + DIGIT_W / 2 - 10000, y);
  }
  c.globalAlpha = 1; c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = 0;
  const grad = c.createLinearGradient(0, y - 145, 0, y + 5);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, rgba(mixc(P.acc, WHITE, 0.2), 1));
  c.fillStyle = grad;
  for (let j = 0; j < 4; j++) {
    const v = val(j, t), speed = Math.abs(val(j, t + 0.01) - val(j, t - 0.01)) / 0.02;
    const cx = x0 + j * DIGIT_W + DIGIT_W / 2;
    c.save();
    c.beginPath(); c.rect(cx - DIGIT_W / 2 - 6, y - 168, DIGIT_W + 12, 196); c.clip();
    const draw = (off, al) => {
      const base = Math.floor(v + 1e-6), f = v - base;
      c.globalAlpha = vis * al;
      c.fillText(String(((base % 10) + 10) % 10), cx, y - f * DH + off);
      if (f > 0.002) c.fillText(String((base + 1) % 10), cx, y - f * DH + DH + off);
    };
    const blur = Math.min(46, speed * 5);
    if (blur > 2) { draw(-blur / 2, 0.35); draw(blur / 2, 0.35); draw(0, 0.55); } else draw(0, 1);
    c.restore();
  }
  c.restore();
}

const TL = { x0: 124, x1: 1796, y: 992, y0: 1940, y1: 2026 };
const tlx = yr => TL.x0 + ((yr - TL.y0) / (TL.y1 - TL.y0)) * (TL.x1 - TL.x0);
function timelineYear(t, k) {
  const s = YEARS[k], prev = k > 0 ? YEARS[k - 1].year : 1940;
  return lerp(prev, s.year, E.io3(prog(s.t0 - 0.1, s.t0 + 0.9, t)));
}
function drawTimeline(c, t, vis, P, k) {
  const yr = timelineYear(t, k), y = TL.y, acc = P.acc;
  c.save();
  c.globalAlpha = vis;
  // AI winters
  for (const [a, b] of [[1974, 1980], [1987, 1993]]) {
    c.fillStyle = 'rgba(170,200,255,0.10)';
    c.fillRect(tlx(a), y - 7, tlx(b) - tlx(a), 14);
    text(c, 'AI WINTER', (tlx(a) + tlx(b)) / 2, y - 14, { f: font(600, 10, F.mono), color: 'rgba(190,215,255,0.5)', align: 'center', sp: 2 });
  }
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(TL.x0, y); c.lineTo(TL.x1, y); c.stroke();
  for (let d = 1940; d <= 2020; d += 10) {
    const x = tlx(d);
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y + 5); c.stroke();
    text(c, String(d), x, y + 30, { f: font(500, 13, F.mono), color: 'rgba(255,255,255,0.38)', align: 'center', sp: 1 });
  }
  const mx = tlx(yr);
  const g = c.createLinearGradient(TL.x0, 0, mx + 1, 0);
  g.addColorStop(0, rgba(acc, 0.15)); g.addColorStop(1, rgba(mixc(acc, WHITE, 0.4), 1));
  c.strokeStyle = g; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(TL.x0, y); c.lineTo(mx, y); c.stroke();
  for (const s of YEARS) {
    const x = tlx(s.year);
    c.beginPath(); c.arc(x, y, 3.5, 0, TAU);
    if (s.year <= yr + 0.01) { c.fillStyle = rgba(mixc(acc, WHITE, 0.3), 1); c.fill(); }
    else { c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.2; c.stroke(); }
  }
  c.globalCompositeOperation = 'lighter';
  glow(c, mx, y, 30, acc, 0.9);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#fff'; c.beginPath(); c.arc(mx, y, 4.5, 0, TAU); c.fill();
  c.restore();
}

/* ------------------------------------------------------------------- post */
const BLOOM_A = makeCanvas(W / 4, H / 4), bA = BLOOM_A.getContext('2d');
const BLOOM_B = makeCanvas(W / 4, H / 4), bB = BLOOM_B.getContext('2d');
const BLOOM_C = makeCanvas(W / 8, H / 8), bC = BLOOM_C.getContext('2d');
function bloom(c, amount) {
  if (amount <= 0) return;
  bA.globalCompositeOperation = 'copy';
  bA.filter = 'brightness(0.95) contrast(1.9)';
  bA.drawImage(canvas, 0, 0, W / 4, H / 4);
  bB.globalCompositeOperation = 'copy'; bB.filter = 'blur(3px)';
  bB.drawImage(BLOOM_A, 0, 0);
  bC.globalCompositeOperation = 'copy'; bC.filter = 'blur(7px)';
  bC.drawImage(BLOOM_A, 0, 0, W / 8, H / 8);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.globalAlpha = 0.42 * amount; c.drawImage(BLOOM_B, 0, 0, W, H);
  c.globalAlpha = 0.5 * amount; c.drawImage(BLOOM_C, 0, 0, W, H);
  c.restore();
}

const VIGNETTE = (() => {
  const v = makeCanvas(W, H), g = v.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.72)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return v;
})();

const GRAIN = Array.from({ length: 4 }, (_, k) => {
  const s = makeCanvas(256, 256), g = s.getContext('2d'), id = g.createImageData(256, 256), r = rng(900 + k);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (r() + r() + r() - 1.5) * 120;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return s;
});
function grain(c, t) {
  const f = Math.floor(t * 30), tile = GRAIN[f % 4];
  c.save();
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.085;
  const pat = c.createPattern(tile, 'repeat');
  c.translate(-((hash(f, 5) * 256) | 0), -((hash(f, 6) * 256) | 0));
  c.fillStyle = pat; c.fillRect(0, 0, W + 256, H + 256);
  c.restore();
}

// [time, strength, colour] of full-frame light flashes (synced to musical hits)
const FLASHES = [
  [4.0, 0.2, [170, 205, 255]], [20.0, 0.22, [255, 214, 160]], [62.0, 0.3, [140, 195, 255]], [74.0, 0.16, [150, 255, 235]],
  [92.0, 0.26, [255, 220, 250]], [114.0, 0.32, [190, 215, 255]],
];
function flashes(c, t) {
  for (const [ft, a, col] of FLASHES) {
    const d = t - ft;
    if (d < -0.06 || d > 1.2) continue;
    const k = d < 0 ? (d + 0.06) / 0.06 : Math.exp(-d * 4.5);
    const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1150);
    g.addColorStop(0, rgba(col, a * k)); g.addColorStop(1, rgba(col, a * k * 0.25));
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  }
}

// 1987: the expert-system bubble bursts — the whole picture collapses like an old CRT switching off
const CRT_TMP = makeCanvas(W, H), crtCtx = CRT_TMP.getContext('2d');
const CRT_T0 = 53.1;
function crtOff(c, t) {
  const a = prog(CRT_T0, CRT_T0 + 0.45, t), b = prog(CRT_T0 + 0.4, CRT_T0 + 0.75, t);
  if (a <= 0 || t > 54.0) return;
  crtCtx.globalCompositeOperation = 'copy'; crtCtx.drawImage(canvas, 0, 0);
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const sy = lerp(1, 0.004, E.in3(a)), sx = Math.max(0.002, lerp(1, 0, E.in2(b)));
  c.translate(W / 2, H / 2); c.scale(sx, sy);
  c.filter = `brightness(${1 + 2.5 * a})`;
  c.drawImage(CRT_TMP, -W / 2, -H / 2);
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  const dotA = Math.sin(Math.PI * prog(CRT_T0 + 0.3, CRT_T0 + 0.9, t));
  glow(c, W / 2, H / 2, 60 + 200 * (1 - b), [200, 220, 255], dotA);
  c.restore();
}

function post(c, t, P) {
  crtOff(c, t);
  bloom(c, 1);
  flashes(c, t);
  c.drawImage(VIGNETTE, 0, 0);
  grain(c, t);
  // power-on after the CRT collapse, and the fade to black at the very end
  let black = t >= 53.9 && t < 54.4 ? 1 - prog(53.95, 54.4, t) : 0;
  black = Math.max(black, prog(119.4, 119.95, t));
  if (black > 0) { c.fillStyle = `rgba(0,0,0,${black.toFixed(3)})`; c.fillRect(0, 0, W, H); }
}
