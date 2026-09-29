'use strict';
/* main.js — composites background, scene layers, HUD and post effects for time t. */

for (const s of SCENES) s.vis = VIS[s.id];

// scene cross-fade: fades in slightly before its start, out just after its end
const envelope = (lt, dur) => E.out2(prog(-0.3, 0.35, lt)) * (1 - E.in2(prog(dur - 0.45, dur + 0.05, lt)));
const dustAmount = t => curve([[0, 0.55], [7, 0.55], [8.5, 1], [111, 1], [113, 0.2], [120, 0]], t);

function renderFrame(t) {
  resetCtx(ctx);
  const P = paletteAt(t);
  drawBackground(ctx, t, P);
  drawDust(ctx, t, P, dustAmount(t));
  for (const s of SCENES) {
    const lt = t - s.t0, dur = s.t1 - s.t0;
    if (lt < -0.3 || lt > dur + 0.05) continue;
    const A = s.cam === false ? 1 : envelope(lt, dur);
    if (A <= 0.001) continue;
    resetCtx(lctx);
    lctx.clearRect(0, 0, W, H);
    if (s.cam !== false) {
      const z = 1 + 0.035 * clamp(lt / dur);
      lctx.translate(VCX, VCY); lctx.scale(z, z); lctx.translate(-VCX, -VCY);
    }
    s.vis.draw(lctx, lt, dur, t, P);
    resetCtx(ctx);
    ctx.globalAlpha = A;
    ctx.drawImage(LAYER, 0, 0);
    ctx.globalAlpha = 1;
  }
  resetCtx(ctx);
  drawHUD(ctx, t, P);
  resetCtx(ctx);
  post(ctx, t, P);
}

async function init() {
  const fams = [
    font(700, 40), font(400, 40), font(400, 20, F.body), font(700, 20, F.body), font(400, 20, F.serif), font(400, 20, F.serif, true),
    font(500, 20, F.mono), font(400, 20, F.crt), font(400, 20, F.type),
  ];
  await Promise.all(fams.map(f => document.fonts.load(f)));
  await document.fonts.ready;
  initHUD();
  for (const s of SCENES) if (s.vis.prep) { s.vis.prep(); resetCtx(lctx); }
  for (const s of SCENES) if (s.vis.audio) s.vis.audio(s.t0);
  AUDIO.sort((a, b) => a.t - b.t);
  window.__ready = true;

  if (/[?&]play\b/.test(location.search)) {
    // real-time preview in a normal browser tab (with the soundtrack if present)
    const audio = new Audio('soundtrack.m4a');
    let start = null;
    const loop = now => {
      if (start === null) start = now;
      const t = ((now - start) / 1000) % DURATION;
      renderFrame(t);
      requestAnimationFrame(loop);
    };
    addEventListener('click', () => { audio.currentTime = 0; audio.play(); start = null; }, { once: false });
    requestAnimationFrame(loop);
  }
}

window.renderToDataURL = (t, type = 'image/jpeg', q = 0.95) => { renderFrame(t); return canvas.toDataURL(type, q); };
window.getAudioEvents = () => AUDIO;
init().catch(e => { console.error('init failed', e); window.__initError = String(e && e.stack || e); });
