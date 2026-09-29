'use strict';
/* fx.js — camera, scene transitions and the post-processing stack
   (bloom, lens chromatic aberration, flashes, light leaks, letterbox, grain). */

/* ------------------------------------------------------------ hits & shake */
function hitEnergy(t, rate = 6) {
  let e = 0;
  for (const [th, s] of HITS) { const d = t - th; if (d >= 0 && d < 3) e += s * Math.exp(-d * rate); }
  return e;
}
function shakeAt(t) {
  const e = hitEnergy(t, 7);
  if (e < 0.01) return [0, 0];
  return [e * 13 * vnoise(t * 38, 501), e * 10 * vnoise(t * 41, 502)];
}

/* ------------------------------------------------------------------ camera */
function applyCamera(c, s, lt, dur, t) {
  if (s.cam === false) return;
  const k = s.vis && s.vis.cam ? s.vis.cam(lt, dur, t) : {};
  if (k === false) return;
  const [cx, cy] = s.center;
  const push = k.push !== undefined ? k.push : 0.045;
  let z = (k.z || 1) * (1 + push * E.io2(clamp(lt / dur)));
  z *= 1 + 0.03 * hitEnergy(t, 7);
  const x = (k.x || 0) + (k.drift === 0 ? 0 : 7 * vnoise(t * 0.35, 101));
  const y = (k.y || 0) + (k.drift === 0 ? 0 : 5 * vnoise(t * 0.31, 102));
  const r = (k.r || 0) + (k.drift === 0 ? 0 : 0.004 * vnoise(t * 0.25, 103));
  c.translate(cx + x, cy + y); c.rotate(r); c.scale(z, z); c.translate(-cx, -cy);
}

/* ------------------------------------------------------------- transitions
   Each transition composites the outgoing layer A and the incoming layer B
   for p in [0,1] across a window [T - pre, T + post] around the cut T. */
const ACC_C = makeCanvas(W, H), accCtx = ACC_C.getContext('2d');
const SMALL = makeCanvas(W / 8, H / 8), smallCtx = SMALL.getContext('2d');
const FX = { chroma: 0 };   // per-frame extras requested by transitions

/** draw img scaled s about (cx,cy); n extra copies along the zoom give radial motion blur */
function zoomBlur(c, img, cx, cy, s, spread, alpha, n = 6) {
  if (alpha <= 0.003) return;
  if (spread < 0.004) {
    c.save(); c.globalAlpha = alpha;
    c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); c.drawImage(img, 0, 0);
    c.restore(); return;
  }
  resetCtx(accCtx); accCtx.clearRect(0, 0, W, H);
  for (let k = 0; k < n; k++) {
    const sk = s * (1 + spread * k / (n - 1));
    accCtx.setTransform(sk, 0, 0, sk, cx - cx * sk, cy - cy * sk);
    accCtx.globalAlpha = 1 / (k + 1);
    accCtx.drawImage(img, 0, 0);
  }
  c.save(); c.globalAlpha = alpha; c.drawImage(ACC_C, 0, 0); c.restore();
}
/** horizontal motion blur while sliding */
function slideBlur(c, img, dx, spread, alpha, n = 6) {
  if (alpha <= 0.003) return;
  resetCtx(accCtx); accCtx.clearRect(0, 0, W, H);
  for (let k = 0; k < n; k++) {
    accCtx.globalAlpha = 1 / (k + 1);
    accCtx.drawImage(img, dx + (k / (n - 1) - 0.5) * spread, 0);
  }
  c.save(); c.globalAlpha = alpha; c.drawImage(ACC_C, 0, 0); c.restore();
}
function drawAt(c, img, a = 1) { if (a > 0.003) { c.save(); c.globalAlpha = a; c.drawImage(img, 0, 0); c.restore(); } }

const TRANS = {
  cut: { pre: 0.001, post: 0.001, fn(c, A, B, p) { c.drawImage(p < 0.5 ? A : B, 0, 0); } },
  fade: {
    pre: 0.4, post: 0.4,
    fn(c, A, B, p) { drawAt(c, A, 1 - E.io2(p)); drawAt(c, B, E.io2(p)); },
  },
  zoom: {   // zoom-through: the old picture rushes past the camera, the new one flies in from the distance
    pre: 0.45, post: 0.55,
    fn(c, A, B, p, o) {
      const pa = E.in3(clamp(p / 0.48)), pb = E.out3(clamp((p - 0.4) / 0.6));
      if (pa < 1) zoomBlur(c, A, o.cx, o.cy, 1 + 2.4 * pa, 0.25 * pa, 1 - E.in2(pa));
      if (pb > 0) zoomBlur(c, B, o.cx, o.cy, lerp(0.3, 1, pb), 0.3 * (1 - pb), clamp(pb * 1.6));
      FX.chroma += 10 * Math.sin(Math.PI * p);
    },
  },
  whip: {   // whip pan with horizontal motion blur
    pre: 0.35, post: 0.4,
    fn(c, A, B, p, o) {
      const pa = E.in3(clamp(p / 0.5)), pb = E.out3(clamp((p - 0.5) / 0.5));
      if (pa < 1) slideBlur(c, A, -W * 0.9 * pa, 420 * pa, 1 - E.in2(pa));
      if (p > 0.5) slideBlur(c, B, W * 0.9 * (1 - pb), 420 * (1 - pb), clamp(pb * 1.5));
      FX.chroma += 8 * Math.sin(Math.PI * p);
    },
  },
  glitch: {   // digital glitch: slices jump sideways, colour channels split
    pre: 0.3, post: 0.35,
    fn(c, A, B, p, o) {
      const g = Math.pow(Math.sin(Math.PI * p), 0.6), f = Math.floor((o.t) * 30);
      const main = p < 0.5 ? A : B, other = p < 0.5 ? B : A;
      resetCtx(accCtx); accCtx.clearRect(0, 0, W, H);
      accCtx.drawImage(main, 0, 0);
      const n = 16;
      for (let i = 0; i < n; i++) {
        if (hash(i, f * 7) < 0.65 - 0.5 * g) continue;
        const y = hash(i, f * 7 + 1) * H, h = 6 + hash(i, f * 7 + 2) * 70 * g, dx = (hash(i, f * 7 + 3) - 0.5) * 260 * g;
        const src = hash(i, f * 7 + 4) < 0.3 ? other : main;
        accCtx.clearRect(0, y, W, h);
        accCtx.drawImage(src, 0, y, W, h, dx, y, W, h);
      }
      c.drawImage(ACC_C, 0, 0);
      FX.chroma += 26 * g;
    },
  },
  pixel: {   // pixelate out, then back in
    pre: 0.4, post: 0.45,
    fn(c, A, B, p) {
      const src = p < 0.5 ? A : B, q = Math.sin(Math.PI * p);
      const size = Math.max(1, Math.round(1 + 55 * Math.pow(q, 1.4)));
      if (size <= 1) { c.drawImage(src, 0, 0); return; }
      const w = Math.max(2, Math.round(W / size)), h = Math.max(2, Math.round(H / size));
      smallCtx.globalCompositeOperation = 'copy';
      smallCtx.imageSmoothingEnabled = true;
      smallCtx.drawImage(src, 0, 0, w, h);
      c.save(); c.imageSmoothingEnabled = false;
      c.drawImage(SMALL, 0, 0, w, h, 0, 0, W, H);
      c.restore();
    },
  },
  iris: {   // a ring of light opens onto the new scene
    pre: 0.3, post: 0.6,
    fn(c, A, B, p, o) {
      const q = E.io3(p), R = q * 1500;
      zoomBlur(c, A, o.cx, o.cy, 1 + 0.15 * q, 0, 1 - E.in3(q));
      if (R > 1) {
        c.save(); c.beginPath(); c.arc(o.cx, o.cy, R, 0, TAU); c.clip();
        zoomBlur(c, B, o.cx, o.cy, lerp(1.25, 1, E.out3(p)), 0, 1);
        c.restore();
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = rgba(o.acc, 0.8 * (1 - q)); c.lineWidth = 3 + 30 * (1 - q);
        c.shadowColor = rgba(o.acc, 1); c.shadowBlur = 40;
        c.beginPath(); c.arc(o.cx, o.cy, R, 0, TAU); c.stroke();
        c.restore();
      }
    },
  },
  flash: {   // hard cut hidden inside a burst of light
    pre: 0.25, post: 0.5,
    fn(c, A, B, p, o) {
      const cut = 0.25 / 0.75;
      if (p < cut) zoomBlur(c, A, o.cx, o.cy, 1 + 0.08 * E.in2(p / cut), 0.04 * p / cut, 1);
      else zoomBlur(c, B, o.cx, o.cy, lerp(1.1, 1, E.out3((p - cut) / (1 - cut))), 0.05 * (1 - (p - cut) / (1 - cut)), 1);
    },
  },
  shatter: {   // the old picture breaks into shards that fly at the camera
    pre: 0.2, post: 1.0,
    fn(c, A, B, p, o) {
      const q = clamp((p - 0.1) / 0.9), COLS = 16, ROWS = 9, tw = W / COLS, th = H / ROWS;
      zoomBlur(c, B, o.cx, o.cy, lerp(1.2, 1, E.out3(q)), 0, E.out2(clamp(q * 1.4)));
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        const id = j * COLS + i, d = clamp((q - hash(id, 91) * 0.25) / 0.75);
        const e = E.in2(d);
        if (e >= 1) continue;
        const x = i * tw + tw / 2, y = j * th + th / 2, dx = x - o.cx, dy = y - o.cy, L = Math.hypot(dx, dy) + 1;
        const sp = 900 + 900 * hash(id, 92), s = 1 + e * (1.5 + 2 * hash(id, 93));
        c.save();
        c.globalAlpha = 1 - e;
        c.translate(x + (dx / L) * sp * e, y + (dy / L) * sp * e + 500 * e * e);
        c.rotate((hash(id, 94) - 0.5) * 3 * e); c.scale(s, s);
        c.drawImage(A, i * tw, j * th, tw, th, -tw / 2, -th / 2, tw, th);
        if (e > 0.02) { c.strokeStyle = rgba([220, 235, 255], 0.5 * (1 - e)); c.lineWidth = 1.5 / s; c.strokeRect(-tw / 2, -th / 2, tw, th); }
        c.restore();
      }
    },
  },
  crt: {   // the post pass collapses the whole picture; here we only switch layers in the dark
    pre: 0.95, post: 0.5,
    fn(c, A, B, p) { c.drawImage(p < 0.95 / 1.45 ? A : B, 0, 0); },
  },
};

/* -------------------------------------------------------------------- post */
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

/* lens chromatic aberration: red is magnified, blue shrunk, about the frame centre */
const CA_R = makeCanvas(W, H), caR = CA_R.getContext('2d');
const CA_B = makeCanvas(W, H), caB = CA_B.getContext('2d');
function chroma(c, px) {
  if (px < 0.8) return;
  px = Math.min(px, 40);
  tctx.globalCompositeOperation = 'copy'; tctx.drawImage(canvas, 0, 0);
  for (const [g, col] of [[caR, '#ff0000'], [caB, '#0000ff']]) {
    g.globalCompositeOperation = 'copy'; g.drawImage(TMP, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H);
  }
  c.save();
  c.globalCompositeOperation = 'multiply'; c.fillStyle = '#00ff00'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighter';
  const k = px / (W / 2);
  c.setTransform(1 + k, 0, 0, 1 + k, -W / 2 * k, -H / 2 * k); c.drawImage(CA_R, 0, 0);
  c.setTransform(1 - k, 0, 0, 1 - k, W / 2 * k, H / 2 * k); c.drawImage(CA_B, 0, 0);
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

// full-frame light flashes [time, strength, colour]; scenes and transitions add to this list
const FLASHES = [];
function flash(t, a, col) { FLASHES.push([t, a, col]); }
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

// light leaks: warm film-burn glows that sweep across the frame [time, colour A, colour B, direction]
const LEAKS = [];
function leak(t, ca, cb, dir = 1) { LEAKS.push([t, ca, cb, dir]); }
function leaks(c, t) {
  for (const [lt0, ca, cb, dir] of LEAKS) {
    const d = t - lt0;
    if (d < -0.5 || d > 1.6) continue;
    const e = Math.sin(Math.PI * clamp((d + 0.5) / 2.1)), u = (d + 0.5) / 2.1;
    const x = dir > 0 ? lerp(-300, W + 300, u) : lerp(W + 300, -300, u);
    c.save(); c.globalCompositeOperation = 'screen';
    let g = c.createRadialGradient(x, H * 0.35, 0, x, H * 0.35, 900);
    g.addColorStop(0, rgba(ca, 0.45 * e)); g.addColorStop(1, rgba(ca, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(x - dir * 380, H * 0.8, 0, x - dir * 380, H * 0.8, 700);
    g.addColorStop(0, rgba(cb, 0.35 * e)); g.addColorStop(1, rgba(cb, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
  }
}

// cinematic letterbox bars (2.39:1) for the intro, act cards and the finale's warp
const LB_H = 138;
let LB_KEYS = null;
function letterboxAt(t) {
  if (!LB_KEYS) {
    const K = [[0, 1], [ST('intro') + 5.9, 1], [ST('intro') + 6.3, 0]];
    for (const s of SCENES) if (s.kind === 'act') K.push([s.t0 - 0.45, 0], [s.t0 - 0.05, 1], [s.t1 - 0.25, 1], [s.t1 + 0.35, 0]);
    K.push([ST('finale') - 0.4, 0], [ST('finale'), 1], [ST('finale') + 3.8, 1], [ST('finale') + 4.3, 0], [DURATION, 0]);
    K.sort((a, b) => a[0] - b[0]);
    LB_KEYS = K;
  }
  return curve(LB_KEYS, t);
}
function letterbox(c, t) {
  const k = letterboxAt(t);
  if (k <= 0.001) return;
  const h = LB_H * E.io2(k);
  c.fillStyle = '#000';
  c.fillRect(0, 0, W, h); c.fillRect(0, H - h, W, h);
}

// 1987: the expert-system bubble bursts — the whole picture collapses like an old CRT switching off
function crtOff(c, t) {
  const a = prog(CRT_T0, CRT_T0 + 0.45, t), b = prog(CRT_T0 + 0.4, CRT_T0 + 0.75, t);
  if (a <= 0 || t > CRT_T0 + 0.9) return;
  tctx.globalCompositeOperation = 'copy'; tctx.drawImage(canvas, 0, 0);
  c.save();
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const sy = lerp(1, 0.004, E.in3(a)), sx = Math.max(0.002, lerp(1, 0, E.in2(b)));
  c.translate(W / 2, H / 2); c.scale(sx, sy);
  c.filter = `brightness(${1 + 2.5 * a})`;
  c.drawImage(TMP, -W / 2, -H / 2);
  c.restore();
  c.save(); c.globalCompositeOperation = 'lighter';
  const dotA = Math.sin(Math.PI * prog(CRT_T0 + 0.3, CRT_T0 + 0.9, t));
  glow(c, W / 2, H / 2, 60 + 200 * (1 - b), [200, 220, 255], dotA);
  c.restore();
}

function post(c, t, P) {
  crtOff(c, t);
  bloom(c, 1);
  chroma(c, FX.chroma + 16 * hitEnergy(t, 5) + (letterboxAt(t) > 0.5 ? 2.5 : 0));
  flashes(c, t);
  leaks(c, t);
  c.drawImage(VIGNETTE, 0, 0);
  letterbox(c, t);
  grain(c, t);
  // fade in, power-on after the CRT collapse, and the fade to black at the very end
  let black = 1 - prog(0.1, 0.9, t);
  if (t >= CRT_T0 + 0.8 && t < CRT_T0 + 1.4) black = Math.max(black, 1 - prog(CRT_T0 + 0.85, CRT_T0 + 1.4, t));
  black = Math.max(black, prog(DURATION - 1.2, DURATION - 0.05, t));
  if (black > 0) { c.fillStyle = `rgba(0,0,0,${black.toFixed(3)})`; c.fillRect(0, 0, W, H); }
}
