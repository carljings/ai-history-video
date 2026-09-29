'use strict';
/* scenes3.js — Act III (2009–2017): ImageNet, Watson, AlexNet, GANs, AlphaGo, the Transformer. */

/* ============================================= 2009 ImageNet: a wall of images */
VIS.y2009 = (() => {
  const TILES = [
    ['🐱', '虎斑猫', 'tabby cat'], ['🐶', '金毛犬', 'golden retriever'], ['🚗', '跑车', 'sports car'], ['🌋', '火山', 'volcano'],
    ['🍓', '草莓', 'strawberry'], ['🦜', '金刚鹦鹉', 'macaw'], ['🐠', '热带鱼', 'tropical fish'], ['🌻', '向日葵', 'sunflower'],
    ['🍄', '蘑菇', 'mushroom'], ['🎸', '吉他', 'guitar'], ['🐘', '大象', 'elephant'], ['🦋', '蝴蝶', 'butterfly'],
    ['⛵', '帆船', 'sailboat'], ['🏠', '房屋', 'house'], ['🍎', '苹果', 'apple'], ['🐢', '乌龟', 'turtle'],
    ['🦊', '狐狸', 'fox'], ['🚲', '自行车', 'bicycle'], ['🍕', '披萨', 'pizza'], ['🌵', '仙人掌', 'cactus'],
    ['🐧', '企鹅', 'penguin'], ['🦒', '长颈鹿', 'giraffe'], ['☕', '浓缩咖啡', 'espresso'], ['🎃', '南瓜灯', "jack-o'-lantern"],
    ['🦉', '猫头鹰', 'owl'], ['🐝', '蜜蜂', 'bee'], ['🌂', '雨伞', 'umbrella'], ['🦀', '螃蟹', 'crab'],
    ['⌚', '手表', 'watch'], ['🐙', '章鱼', 'octopus'], ['🚀', '火箭', 'rocket'], ['🐸', '青蛙', 'frog'],
  ];
  const GW = 150, GH = 84, TS = 24, FX = 75, FY = 42;   // wall size in tiles, pre-rendered tile size, focus tile
  const FOCUS = [VCX, 505];
  let sprites = [], wall = null;
  const tileOf = (x, y) => (x === FX && y === FY ? 0 : (hash(x * 131 + y * 7, 9) * TILES.length) | 0);
  function prep() {
    const r = rng(2009);
    sprites = TILES.map(([emo], k) => {
      const S = 128, cv = makeCanvas(S, S), g = cv.getContext('2d');
      const h1 = [[120, 170, 220], [90, 140, 90], [200, 160, 110], [60, 70, 90], [230, 200, 150], [70, 120, 170], [160, 110, 150]][k % 7];
      const gr = g.createLinearGradient(0, 0, 0, S);
      gr.addColorStop(0, rgba(mixc(h1, WHITE, 0.35), 1)); gr.addColorStop(0.6, rgba(h1, 1)); gr.addColorStop(1, rgba(mixc(h1, [20, 20, 20], 0.5), 1));
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.font = `${84 + r() * 14}px "${F.emoji}"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.translate(S / 2 + (r() - 0.5) * 16, S / 2 + 6 + (r() - 0.5) * 10); g.rotate((r() - 0.5) * 0.3);
      g.fillText(emo, 0, 0); g.restore();
      const vg = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)');
      g.fillStyle = vg; g.fillRect(0, 0, S, S);
      const small = makeCanvas(TS, TS), s = small.getContext('2d');
      s.imageSmoothingQuality = 'high'; s.drawImage(cv, 1, 1, TS - 2, TS - 2);
      return { cv, small };
    });
    wall = makeCanvas(GW * TS, GH * TS);
    const w = wall.getContext('2d');
    w.fillStyle = '#05070c'; w.fillRect(0, 0, GW * TS, GH * TS);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) w.drawImage(sprites[tileOf(x, y)].small, x * TS, y * TS);
  }
  const ZA = 0.6, ZB = 6.4;
  const sizeAt = lt => 560 * Math.pow(12.8 / 560, E.io2(prog(ZA, ZB, lt)));
  const LABELS = (() => { const r = rng(91), out = []; for (let i = 0; i < 16; i++) out.push({ dx: Math.round((r() - 0.5) * 30), dy: Math.round((r() - 0.5) * 16), t: 1.6 + i * 0.26 }); return out; })();
  function audio(t0) {
    sfx(t0 + ZA, 'swell');
    LABELS.forEach(L => sfx(t0 + L.t, 'dot', { v: 0.35 }));
  }
  function cam() { return { push: 0, drift: 0 }; }
  function draw(c, lt) {
    const s = sizeAt(lt), rot = 0.06 * (1 - E.io2(prog(ZA, ZB, lt)));
    const inP = E.out2(prog(0, 0.4, lt));
    c.save();
    c.globalAlpha = inP;
    c.translate(FOCUS[0], FOCUS[1]); c.rotate(rot); c.translate(-FOCUS[0], -FOCUS[1]);
    const ox = FOCUS[0] - (FX + 0.5) * s, oy = FOCUS[1] - (FY + 0.5) * s;   // screen position of wall origin
    if (s <= TS * 1.5) {
      c.imageSmoothingQuality = 'high';
      c.drawImage(wall, ox, oy, GW * s, GH * s);
    } else {
      const gap = Math.max(1, s * 0.05);
      const x0 = Math.max(0, Math.floor((-ox - 200) / s)), x1 = Math.min(GW - 1, Math.ceil((W - ox + 200) / s));
      const y0 = Math.max(0, Math.floor((-oy - 200) / s)), y1 = Math.min(GH - 1, Math.ceil((H - oy + 200) / s));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const sp = sprites[tileOf(x, y)];
        c.drawImage(s > 60 ? sp.cv : sp.small, ox + x * s + gap / 2, oy + y * s + gap / 2, s - gap, s - gap);
      }
    }
    // annotation boxes, the way crowd workers labelled the data
    const box = (x, y, sz, zh, en, a, col) => {
      if (a <= 0.01) return;
      c.save(); c.globalAlpha = inP * a;
      c.strokeStyle = rgba(col, 1); c.lineWidth = Math.max(2, sz * 0.02);
      c.strokeRect(x + sz * 0.1, y + sz * 0.1, sz * 0.8, sz * 0.8);
      c.font = font(700, 18, F.zh); c.letterSpacing = '1px';
      const label = zh + '  ' + en, tw = c.measureText(label).width + 20;
      c.fillStyle = rgba(col, 1); c.fillRect(x + sz * 0.1 - c.lineWidth / 2, y + sz * 0.1 - 30, tw, 30);
      text(c, label, x + sz * 0.1 + 9, y + sz * 0.1 - 9, { color: '#0b1020', sp: 1 });
      c.restore();
    };
    box(ox + FX * s, oy + FY * s, s, TILES[0][1], TILES[0][2], 1 - prog(1.8, 2.4, lt), [255, 214, 90]);
    LABELS.forEach((L, i) => {
      const a = prog(L.t, L.t + 0.15, lt) * (1 - prog(L.t + 0.9, L.t + 1.2, lt));
      if (a <= 0) return;
      const tx = FX + L.dx, ty = FY + L.dy, T = TILES[tileOf(tx, ty)];
      const sx = ox + tx * s, sy = oy + ty * s;
      if (sx < 820 || sx > W - 60 || sy < 120 || sy > H - 180) return;
      box(sx, sy, Math.max(s, 40), T[1], T[2], a, i % 2 ? [120, 220, 255] : [255, 150, 200]);
    });
    c.restore();
    // scrim for the chapter text
    let g = c.createLinearGradient(0, 0, 1000, 0);
    g.addColorStop(0, 'rgba(3,5,12,0.92)'); g.addColorStop(0.7, 'rgba(3,5,12,0.55)'); g.addColorStop(1, 'rgba(3,5,12,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1000, H);
    g = c.createLinearGradient(0, 860, 0, H);
    g.addColorStop(0, 'rgba(3,5,12,0)'); g.addColorStop(1, 'rgba(3,5,12,0.9)');
    c.fillStyle = g; c.fillRect(0, 860, W, H - 860);
    // counters
    const k = E.out3(prog(ZA + 0.5, ZB, lt)), ca = E.out3(prog(1.0, 1.6, lt));
    const px = 1780;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.95)'; c.shadowBlur = 18;
    c.fillStyle = 'rgba(4,8,18,0.72)'; c.globalAlpha = ca; roundRect(c, px - 470, 128, 500, 150, 14); c.fill(); c.globalAlpha = 1;
    text(c, Math.round(14197122 * k).toLocaleString('en-US'), px, 196, { f: font(700, 54, F.sans), color: '#ffffff', align: 'right', alpha: ca });
    text(c, '张标注图片  LABELED IMAGES', px, 226, { f: font(700, 17, F.zh), color: 'rgb(160,205,255)', align: 'right', sp: 2, alpha: ca });
    text(c, `${Math.round(21841 * k).toLocaleString('en-US')} 个类别 · 167 个国家的众包标注者`, px, 258, { f: font(400, 16, F.zh), color: 'rgba(210,225,255,0.8)', align: 'right', sp: 1, alpha: ca });
    c.restore();
  }
  return { prep, audio, cam, draw };
})();

/* ============================================ 2011 Watson on the quiz board */
VIS.y2011 = (() => {
  const BLUE = [40, 70, 220], GOLD = [255, 204, 90], CY_ = [120, 200, 255], GREEN = [120, 255, 170];
  const CATS = [['AI 历史', 'AI HISTORY'], ['计算机', 'COMPUTERS'], ['语言', 'LANGUAGE'], ['科学', 'SCIENCE'], ['游戏', 'GAMES'], ['机器人', 'ROBOTS']];
  const BX = 965, BY = 215, TW = 130, TH = 72, GAP = 8, HH = 70;
  const PICK = [0, 3], OPEN = 1.9, AV = 2.7, BUZZ = 3.8, SCORE = 4.9;
  const ANS = [['Alan Turing', '阿兰·图灵', 0.97], ['John McCarthy', '约翰·麦卡锡', 0.02], ['Ada Lovelace', '艾达·洛芙莱斯', 0.01]];
  const SCORES = [['沃森', 'WATSON', 77147, true], ['肯·詹宁斯', 'KEN JENNINGS', 24000], ['布拉德·拉特', 'BRAD RUTTER', 21600]];
  const tileRect = (col, row) => [BX + col * (TW + GAP), BY + HH + GAP + row * (TH + GAP), TW, TH];
  function audio(t0) {
    for (let i = 0; i < 6; i++) sfx(t0 + 0.2 + i * 0.12, 'flip', { v: 0.5 });
    sfx(t0 + OPEN, 'whoosh', { dur: 0.6 });
    sfx(t0 + BUZZ, 'buzz');
    sfx(t0 + BUZZ + 0.4, 'chime');
    for (let i = 0; i < 3; i++) sfx(t0 + SCORE + i * 0.18, 'coin', { v: 0.7 });
  }
  function draw(c, lt) {
    const open = E.io3(prog(OPEN, OPEN + 0.6, lt)), shrink = E.io3(prog(AV - 0.3, AV + 0.3, lt));
    // board
    const ba = 1 - prog(OPEN, OPEN + 0.4, lt);
    if (ba > 0) {
      CATS.forEach(([zh, en], col) => {
        const p = E.out3(prog(0.1 + col * 0.06, 0.5 + col * 0.06, lt));
        const x = BX + col * (TW + GAP);
        c.save(); c.globalAlpha = ba * p;
        c.fillStyle = rgba([20, 30, 120], 0.95); c.fillRect(x, BY, TW, HH);
        text(c, zh, x + TW / 2, BY + 32, { f: font(700, 18, F.zh), color: '#fff', align: 'center', sp: 1 });
        text(c, en, x + TW / 2, BY + 54, { f: font(700, 11, F.mono), color: 'rgba(220,230,255,0.8)', align: 'center', sp: 1 });
        c.restore();
        for (let row = 0; row < 5; row++) {
          const [tx, ty] = tileRect(col, row), q = E.out3(prog(0.2 + (col + row) * 0.07, 0.6 + (col + row) * 0.07, lt));
          if (q <= 0) continue;
          const flip = Math.abs(Math.cos((1 - q) * Math.PI));
          const picked = col === PICK[0] && row === PICK[1];
          c.save(); c.globalAlpha = ba;
          c.translate(tx + TW / 2, ty + TH / 2); c.scale(1, Math.max(0.02, flip));
          const g = c.createLinearGradient(0, -TH / 2, 0, TH / 2);
          g.addColorStop(0, rgba(picked && lt > OPEN - 0.5 ? [80, 120, 255] : [40, 60, 210], 1)); g.addColorStop(1, rgba([16, 26, 120], 1));
          c.fillStyle = g; c.fillRect(-TW / 2, -TH / 2, TW, TH);
          if (q > 0.5) text(c, '$' + (row + 1) * 200, 0, 12, { f: font(800, 30, F.body), color: rgba(GOLD, 1), align: 'center' });
          c.restore();
        }
      });
    }
    // the chosen clue fills the board, then slides up
    if (open > 0) {
      const [tx, ty] = tileRect(...PICK);
      const full = [BX, BY, 6 * TW + 5 * GAP, HH + 5 * (TH + GAP)], small = [BX, BY - 20, 6 * TW + 5 * GAP, 250];
      const tgt = [0, 1, 2, 3].map(i => lerp(full[i], small[i], shrink));
      const r = [0, 1, 2, 3].map(i => lerp([tx, ty, TW, TH][i], tgt[i], open));
      c.save();
      const g = c.createLinearGradient(0, r[1], 0, r[1] + r[3]);
      g.addColorStop(0, '#2c46e0'); g.addColorStop(1, '#101a78');
      c.fillStyle = g; c.fillRect(r[0], r[1], r[2], r[3]);
      c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 2; c.strokeRect(r[0], r[1], r[2], r[3]);
      const ta = E.out3(prog(OPEN + 0.4, OPEN + 0.8, lt));
      const cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
      c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
      text(c, 'AI 历史 · $800', cx, r[1] + 40, { f: font(700, 16, F.zh), color: rgba(GOLD, 1), align: 'center', sp: 3, alpha: ta });
      text(c, '他在 1950 年发问：“机器能思考吗？”', cx, cy + 6, { f: font(700, 34, F.zh), color: '#ffffff', align: 'center', sp: 2, alpha: ta });
      text(c, 'IN 1950 HE ASKED, “CAN MACHINES THINK?”', cx, cy + 48, { f: font(700, 20, F.body), color: 'rgba(235,240,255,0.9)', align: 'center', sp: 2, alpha: ta });
      c.restore();
    }
    // Watson's avatar and its top-3 answers
    const aa = E.out3(prog(AV, AV + 0.5, lt));
    if (aa > 0) {
      const ax = 1085, ay = 590, buzz = lt > BUZZ ? Math.exp(-(lt - BUZZ) * 3) : 0, conf = prog(AV + 0.3, BUZZ, lt);
      const col = mixc(CY_, GREEN, clamp(conf * 1.2 - 0.2));
      c.save(); c.globalAlpha = aa;
      c.globalCompositeOperation = 'lighter';
      glow(c, ax, ay, 150 + 60 * buzz, col, 0.35 + 0.5 * buzz, false);
      c.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const rr = 50 + (i % 5) * 9, sp = (0.6 + hash(i, 3) * 1.6) * (1 + 2 * (1 - conf)), a0 = hash(i, 4) * TAU + lt * sp * (i % 2 ? 1 : -1);
        c.strokeStyle = rgba(mixc(col, WHITE, hash(i, 5) * 0.5), 0.55); c.lineWidth = 2 + hash(i, 6) * 2;
        c.beginPath(); c.arc(ax, ay, rr, a0, a0 + 0.5 + hash(i, 7) * 0.9); c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
      const cg = c.createRadialGradient(ax - 10, ay - 12, 4, ax, ay, 40);
      cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.4, rgba(col, 1)); cg.addColorStop(1, rgba(mixc(col, [0, 0, 60], 0.6), 1));
      c.fillStyle = cg; c.beginPath(); c.arc(ax, ay, 36, 0, TAU); c.fill();
      c.restore();
      text(c, 'IBM WATSON', ax, ay + 110, { f: font(700, 14, F.mono), color: rgba(CY_, 1), align: 'center', sp: 4, alpha: aa });
      // answer panel
      const px = 1210, py = 520;
      c.save(); c.globalAlpha = aa;
      c.fillStyle = 'rgba(8,14,50,0.85)'; roundRect(c, px, py, 560, 170, 12); c.fill();
      c.strokeStyle = rgba(CY_, 0.4); c.lineWidth = 1.5; c.stroke();
      text(c, '候选答案与置信度  TOP 3 ANSWERS', px + 20, py + 30, { f: font(700, 14, F.zh), color: rgba(CY_, 1), sp: 2 });
      ANS.forEach(([en, zh, p], i) => {
        const y = py + 66 + i * 36, v = p * E.out3(prog(AV + 0.4 + i * 0.1, BUZZ, lt)), top = i === 0;
        text(c, `${zh} ${en}`, px + 20, y + 6, { f: font(top ? 700 : 400, 17, F.zh), color: top ? '#fff' : 'rgba(210,225,255,0.7)' });
        c.fillStyle = 'rgba(120,160,255,0.15)'; c.fillRect(px + 280, y - 6, 200, 12);
        c.fillStyle = rgba(top ? (lt > BUZZ ? GREEN : CY_) : CY_, 0.9); c.fillRect(px + 280, y - 6, 200 * v, 12);
        text(c, Math.round(v * 100) + '%', px + 540, y + 6, { f: font(700, 15, F.mono), color: '#fff', align: 'right' });
      });
      c.restore();
      const bz = E.outBack(prog(BUZZ, BUZZ + 0.35, lt));
      if (bz > 0) {
        c.save(); c.translate(px + 280, py + 206); c.scale(clamp(bz, 0, 1.2), clamp(bz, 0, 1.2));
        text(c, '“谁是阿兰·图灵？”  WHO IS ALAN TURING?', 0, 0, { f: font(700, 22, F.zh), color: rgba(GREEN, 1), align: 'center', sp: 1 });
        c.restore();
      }
    }
    // final scores after two games
    const sa = E.out3(prog(SCORE, SCORE + 0.5, lt));
    if (sa > 0) {
      SCORES.forEach(([zh, en, v, win], i) => {
        const x = 1080 + i * 250, y = 800, p = E.out3(prog(SCORE + i * 0.18, SCORE + 1.2 + i * 0.18, lt));
        c.save(); c.globalAlpha = sa;
        c.fillStyle = win ? 'rgba(30,50,170,0.95)' : 'rgba(14,20,70,0.9)'; roundRect(c, x - 112, y - 50, 224, 104, 12); c.fill();
        c.strokeStyle = win ? rgba(GOLD, 0.9) : 'rgba(150,170,255,0.3)'; c.lineWidth = 2; c.stroke();
        text(c, '$' + Math.round(v * p).toLocaleString('en-US'), x, y + 4, { f: font(800, 32, F.body), color: win ? rgba(GOLD, 1) : '#dfe6ff', align: 'center' });
        text(c, zh + ' ' + en, x, y + 36, { f: font(700, 13, F.zh), color: 'rgba(220,230,255,0.85)', align: 'center', sp: 1 });
        c.restore();
      });
      text(c, '两场比赛总奖金 · TWO-GAME TOTAL · FEB 2011', 1330, 890, { f: font(600, 13, F.mono), color: 'rgba(200,215,255,0.6)', align: 'center', sp: 2, alpha: sa });
    }
  }
  return { audio, draw };
})();

/* ============================================= 2012 AlexNet / ImageNet */
VIS.y2012 = (() => {
  const B = [95, 175, 255], BH = [170, 225, 255];
  const LAYERS = [[905, 1, 20, 235, 0], [1080, 6, 12, 170, 15], [1285, 10, 8, 125, 10], [1462, 14, 5, 86, 6.5]];
  const SK = 0.62, RISE = -0.22, CY = 505;
  const SCORES = [['虎斑猫 tabby cat', 0.92], ['虎猫 tiger cat', 0.06], ['埃及猫 Egyptian cat', 0.02]];
  const BARS = [[2010, 28.2], [2011, 25.8], [2012, 16.4], [2013, 11.7], [2014, 6.7], [2015, 3.6]];
  const WAVE0 = 0.8, WSTEP = 0.55, CHART = 5.0;
  let CAT = [];
  function prep() {
    const big = makeCanvas(96, 96), g = big.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `84px "${F.emoji}"`;
    g.fillText('🐱', 48, 52);
    const sm = makeCanvas(20, 20), s = sm.getContext('2d');
    s.imageSmoothingQuality = 'high'; s.drawImage(big, 0, 0, 20, 20);
    const d = s.getImageData(0, 0, 20, 20).data;
    CAT = [];
    for (let i = 0; i < 400; i++) CAT.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3] / 255]);
  }
  function audio(t0) {
    for (let l = 0; l < 5; l++) sfx(t0 + WAVE0 + l * WSTEP, 'blip', { f: 440 * Math.pow(1.335, l), v: 0.6 });
    sfx(t0 + WAVE0 + 5 * WSTEP, 'chime');
    BARS.forEach((_, i) => sfx(t0 + CHART + 0.35 + i * 0.13, 'dot', { v: 0.5 }));
    sfx(t0 + CHART + 0.35 + 2 * 0.13, 'impactS', { v: 0.8 });
  }
  const lit = (l, lt) => E.out2(prog(WAVE0 + l * WSTEP, WAVE0 + l * WSTEP + 0.35, lt));
  function slab(c, x, y, size, n, fill) {
    c.save();
    c.transform(SK, RISE, 0, 1, x, y);
    const cs = size / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const col = fill(i, j); if (col) { c.fillStyle = col; c.fillRect(i * cs + 0.6, j * cs + 0.6, cs - 1.2, cs - 1.2); } }
    c.strokeStyle = 'rgba(150,200,255,0.5)'; c.lineWidth = 1.2; c.strokeRect(0, 0, size, size);
    c.restore();
  }
  function drawNet(c, lt, A) {
    c.save(); c.globalAlpha = A;
    LAYERS.forEach(([x0, m, n, size, step], l) => {
      const L = lit(l, lt), y0 = CY - size / 2;
      const fly = 1 - E.out3(prog(0.05 + l * 0.12, 0.6 + l * 0.12, lt));
      for (let k = m - 1; k >= 0; k--) {
        slab(c, x0 + k * step + fly * 200, y0 - k * step * 0.35 - fly * 60, size, n, (i, j) => {
          if (l === 0) { const p = CAT[j * 20 + i]; return p[3] > 0.05 ? rgba(p, (0.35 + 0.65 * L) * p[3]) : 'rgba(40,60,90,0.25)'; }
          const v = hash(i * 97 + j * 13 + k * 7, l * 31 + 5), fl = 0.75 + 0.25 * Math.sin(lt * 9 + i + j * 2 + k);
          const a = 0.08 + L * Math.pow(v, 2.2) * 0.95 * fl;
          return rgba(mixc(B, BH, v), a);
        });
      }
      if (l < 3 && L > 0) {
        const nx = LAYERS[l + 1], s0 = size, s1 = nx[3], tIn = lit(l + 1, lt);
        const u = ((lt * 1.3 + l * 0.37) % 1) * (s0 * 0.7), v = (0.25 + 0.5 * ((Math.floor(lt * 1.3 + l * 0.37) * 0.37) % 1)) * s0;
        const px = x0 + SK * u, py = y0 + RISE * u + v, pw = s0 / n * 3;
        const tx = nx[0] + SK * (u / s0 * s1), ty = CY - s1 / 2 + RISE * (u / s0 * s1) + (v / s0) * s1;
        c.strokeStyle = rgba(BH, 0.5 * L * (1 - 0.5 * tIn)); c.lineWidth = 1;
        c.beginPath();
        for (const [dx, dy] of [[0, 0], [pw, 0], [0, pw], [pw, pw]]) { c.moveTo(px + SK * dx, py + RISE * dx + dy); c.lineTo(tx, ty); }
        c.stroke();
        c.strokeStyle = rgba(BH, 0.9 * L); c.strokeRect(px, py, pw * SK + 1, pw);
      }
    });
    const Lf = lit(4, lt);
    for (let i = 0; i < 14; i++) {
      const y = CY - 170 + i * 26, v = hash(i, 88);
      c.fillStyle = rgba(mixc(B, BH, v), 0.2 + Lf * v * 0.8);
      c.beginPath(); c.arc(1618, y, 6, 0, TAU); c.fill();
    }
    const Lo = E.out3(prog(WAVE0 + 5 * WSTEP - 0.1, WAVE0 + 5 * WSTEP + 0.5, lt));
    SCORES.forEach(([name, p], i) => {
      const y = CY - 60 + i * 62, top = i === 0;
      text(c, name, 1645, y, { f: font(top ? 700 : 400, top ? 21 : 16, F.zh), color: top ? '#fff' : 'rgba(210,225,255,0.7)', alpha: Lo });
      c.fillStyle = 'rgba(120,170,255,0.15)'; c.fillRect(1645, y + 11, 165, 7);
      c.fillStyle = rgba(top ? BH : B, 1); c.globalAlpha = A * Lo; c.fillRect(1645, y + 11, 165 * p * Lo, 7); c.globalAlpha = A;
      text(c, `${Math.round(p * 100 * Lo)}%`, 1810, y + 30, { f: font(600, 14, F.mono), color: top ? rgba(BH, 1) : 'rgba(210,225,255,0.6)', align: 'right', alpha: Lo });
    });
    biLabel(c, 'AlexNet · 8 层 · 6000 万参数 · 2 块 GPU', 'ALEXNET', VCX, 206, { col: rgba(BH, 1), alpha: 0.9 * E.out3(prog(0.1, 0.6, lt)), zs: 17, es: 12 });
    text(c, '输入 INPUT', 905 + 73, CY + 162, { f: font(700, 13, F.zh), color: 'rgba(190,215,255,0.6)', align: 'center', sp: 2 });
    text(c, '卷积层逐层提取特征 →', 1290, CY + 162, { f: font(700, 13, F.zh), color: 'rgba(190,215,255,0.6)', align: 'center', sp: 2 });
    c.restore();
  }
  function drawChart(c, lt, A) {
    c.save(); c.globalAlpha = A;
    const X0 = 990, Y0 = 800, HT = 500, BW = 86, GAPB = 46, yOf = v => Y0 - (v / 30) * HT;
    biLabel(c, 'ImageNet 挑战赛 · 前五错误率', 'TOP-5 ERROR', VCX, 206, { col: rgba(BH, 1), zs: 17, es: 12 });
    c.strokeStyle = 'rgba(160,200,255,0.12)'; c.lineWidth = 1; c.beginPath();
    for (let v = 0; v <= 30; v += 10) { c.moveTo(970, yOf(v)); c.lineTo(1780, yOf(v)); }
    c.stroke();
    for (let v = 10; v <= 30; v += 10) text(c, v + '%', 962, yOf(v) + 5, { f: font(500, 13, F.mono), color: 'rgba(190,215,255,0.45)', align: 'right' });
    const dx = X0 + 2 * (BW + GAPB) - GAPB / 2;
    c.setLineDash([5, 6]); c.strokeStyle = 'rgba(190,215,255,0.35)';
    c.beginPath(); c.moveTo(dx, 250); c.lineTo(dx, Y0); c.stroke(); c.setLineDash([]);
    text(c, '传统方法', dx - 16, 266, { f: font(700, 14, F.zh), color: 'rgba(190,215,255,0.6)', align: 'right', sp: 2 });
    text(c, '深度学习', dx + 16, 266, { f: font(700, 14, F.zh), color: rgba(BH, 1), sp: 2 });
    BARS.forEach(([yr, v], i) => {
      const p = E.out3(prog(CHART + 0.35 + i * 0.13, CHART + 0.95 + i * 0.13, lt));
      const x = X0 + i * (BW + GAPB), h = (v / 30) * HT * p, deep = yr >= 2012;
      const g = c.createLinearGradient(0, Y0 - h, 0, Y0);
      if (yr === 2012) { g.addColorStop(0, '#bfe4ff'); g.addColorStop(1, '#2f7dff'); }
      else if (deep) { g.addColorStop(0, 'rgba(90,160,255,0.95)'); g.addColorStop(1, 'rgba(40,90,220,0.9)'); }
      else { g.addColorStop(0, 'rgba(160,175,200,0.6)'); g.addColorStop(1, 'rgba(110,120,140,0.5)'); }
      c.fillStyle = g; c.fillRect(x, Y0 - h, BW, h);
      if (yr === 2012 && p > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x + BW / 2, Y0 - h, 90, B, 0.6 * p); c.restore(); }
      text(c, v.toFixed(1) + '%', x + BW / 2, Y0 - h - 14, { f: font(700, 21, F.sans), color: deep ? '#fff' : 'rgba(220,230,245,0.75)', align: 'center', alpha: p });
      text(c, String(yr), x + BW / 2, Y0 + 30, { f: font(500, 15, F.mono), color: yr === 2012 ? rgba(BH, 1) : 'rgba(200,215,240,0.6)', align: 'center', sp: 1, alpha: A });
    });
    const an = E.out3(prog(CHART + 1.3, CHART + 1.8, lt));
    const ax = X0 + 2 * (BW + GAPB) + BW / 2, ay = yOf(16.4) - 62;
    text(c, 'AlexNet', ax, ay - 8, { f: font(700, 24, F.sans), color: rgba(BH, 1), align: 'center', alpha: an });
    const hu = E.out3(prog(CHART + 1.9, CHART + 2.4, lt)), hy = yOf(5.1);
    if (hu > 0) {
      c.setLineDash([8, 7]); c.strokeStyle = rgba([255, 214, 125], 0.85 * hu); c.lineWidth = 2;
      c.beginPath(); c.moveTo(975, hy); c.lineTo(975 + 800 * hu, hy); c.stroke(); c.setLineDash([]);
      text(c, '人类 HUMAN ≈ 5%', 1778, hy - 12, { f: font(700, 15, F.zh), color: 'rgb(255,214,125)', align: 'right', sp: 2, alpha: hu });
      text(c, 'ResNet', X0 + 5 * (BW + GAPB) + BW / 2, Y0 - (3.6 / 30) * HT - 44, { f: font(600, 15, F.sans), color: rgba(BH, 1), align: 'center', alpha: hu });
    }
    c.restore();
  }
  function draw(c, lt) {
    const na = E.out3(prog(0, 0.5, lt)) * (1 - E.io2(prog(CHART - 0.2, CHART + 0.4, lt)));
    if (na > 0) drawNet(c, lt, na);
    const ca = E.out3(prog(CHART, CHART + 0.6, lt));
    if (ca > 0) drawChart(c, lt, ca);
  }
  return { prep, audio, draw };
})();

/* ================================================ 2014 GANs: forger vs detective */
VIS.y2014 = (() => {
  const RED = [255, 90, 110], CY_ = [90, 210, 255], GREEN = [120, 255, 170], PINK = [255, 130, 175];
  const GX = 1000, DX = 1720, IY = 520, IS = 340;
  const ROUNDS = [[0.9, 2014, 34, 0.55], [2.5, 2015, 17, 0.38], [4.1, 2016, 8, 0.2], [5.7, 2017, 4, 0.08], [7.3, 2018, 1, 0]];
  let face = null;
  const SMALL_ = makeCanvas(IS, IS), sg = SMALL_.getContext('2d');
  const NZ = [];
  function portrait(S) {
    const cv = makeCanvas(S, S), g = cv.getContext('2d');
    let gr = g.createLinearGradient(0, 0, S, S);
    gr.addColorStop(0, '#2a5a6e'); gr.addColorStop(1, '#3a2450');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const cx = S * 0.5;
    // shoulders
    gr = g.createLinearGradient(0, S * 0.75, 0, S);
    gr.addColorStop(0, '#5a3040'); gr.addColorStop(1, '#2a1420');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, S * 1.02, S * 0.42, S * 0.24, 0, 0, TAU); g.fill();
    // neck
    g.fillStyle = '#c98e70'; g.fillRect(cx - S * 0.07, S * 0.6, S * 0.14, S * 0.2);
    g.fillStyle = 'rgba(80,40,30,0.35)'; g.fillRect(cx - S * 0.07, S * 0.6, S * 0.14, S * 0.06);
    // hair behind
    g.fillStyle = '#2b1a14'; g.beginPath(); g.ellipse(cx, S * 0.4, S * 0.25, S * 0.3, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(cx - S * 0.17, S * 0.58, S * 0.09, S * 0.2, 0.15, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(cx + S * 0.17, S * 0.58, S * 0.09, S * 0.2, -0.15, 0, TAU); g.fill();
    // face
    gr = g.createRadialGradient(cx - S * 0.06, S * 0.4, S * 0.02, cx, S * 0.46, S * 0.26);
    gr.addColorStop(0, '#f3c7a6'); gr.addColorStop(0.6, '#e0a585'); gr.addColorStop(1, '#b8785c');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, S * 0.46, S * 0.185, S * 0.235, 0, 0, TAU); g.fill();
    // fringe
    g.fillStyle = '#2b1a14'; g.beginPath();
    g.moveTo(cx - S * 0.2, S * 0.4); g.quadraticCurveTo(cx - S * 0.12, S * 0.2, cx + S * 0.05, S * 0.23);
    g.quadraticCurveTo(cx + S * 0.2, S * 0.26, cx + S * 0.2, S * 0.42); g.quadraticCurveTo(cx + S * 0.1, S * 0.28, cx - S * 0.02, S * 0.3);
    g.quadraticCurveTo(cx - S * 0.12, S * 0.3, cx - S * 0.2, S * 0.4); g.fill();
    // eyes
    for (const sd of [-1, 1]) {
      const ex = cx + sd * S * 0.078, ey = S * 0.445;
      g.fillStyle = '#f7efe8'; g.beginPath(); g.ellipse(ex, ey, S * 0.036, S * 0.016, 0, 0, TAU); g.fill();
      g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(ex + S * 0.004, ey, S * 0.014, 0, TAU); g.fill();
      g.fillStyle = '#140a06'; g.beginPath(); g.arc(ex + S * 0.004, ey, S * 0.006, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - S * 0.002, ey - S * 0.005, S * 0.0035, 0, TAU); g.fill();
      g.strokeStyle = '#3a2016'; g.lineWidth = S * 0.006; g.beginPath(); g.ellipse(ex, ey + S * 0.002, S * 0.038, S * 0.018, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.strokeStyle = '#2b1a14'; g.lineWidth = S * 0.01; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ex - S * 0.04, ey - S * 0.035); g.quadraticCurveTo(ex, ey - S * 0.05, ex + S * 0.042, ey - S * 0.036); g.stroke();
    }
    // nose
    g.strokeStyle = 'rgba(140,80,60,0.6)'; g.lineWidth = S * 0.006;
    g.beginPath(); g.moveTo(cx + S * 0.01, S * 0.47); g.quadraticCurveTo(cx + S * 0.03, S * 0.52, cx + S * 0.01, S * 0.535); g.stroke();
    g.fillStyle = 'rgba(120,60,45,0.4)'; g.beginPath(); g.ellipse(cx - S * 0.015, S * 0.54, S * 0.012, S * 0.006, 0, 0, TAU); g.ellipse(cx + S * 0.02, S * 0.54, S * 0.012, S * 0.006, 0, 0, TAU); g.fill();
    // lips
    g.fillStyle = '#b8565c'; g.beginPath();
    g.moveTo(cx - S * 0.05, S * 0.598); g.quadraticCurveTo(cx, S * 0.578, cx + S * 0.05, S * 0.598);
    g.quadraticCurveTo(cx, S * 0.628, cx - S * 0.05, S * 0.598); g.fill();
    g.strokeStyle = 'rgba(90,30,30,0.6)'; g.lineWidth = S * 0.004; g.beginPath(); g.moveTo(cx - S * 0.048, S * 0.598); g.quadraticCurveTo(cx, S * 0.603, cx + S * 0.048, S * 0.598); g.stroke();
    // cheeks and shading
    for (const sd of [-1, 1]) { gr = g.createRadialGradient(cx + sd * S * 0.1, S * 0.53, 0, cx + sd * S * 0.1, S * 0.53, S * 0.06); gr.addColorStop(0, 'rgba(230,110,110,0.25)'); gr.addColorStop(1, 'rgba(230,110,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
    gr = g.createLinearGradient(cx - S * 0.2, 0, cx + S * 0.2, 0);
    gr.addColorStop(0, 'rgba(255,230,210,0.08)'); gr.addColorStop(1, 'rgba(40,10,30,0.3)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const out = makeCanvas(S, S), o = out.getContext('2d');
    o.filter = 'blur(1.2px)'; o.drawImage(cv, 0, 0);
    return out;
  }
  function prep() {
    face = portrait(IS);
    const r = rng(2014);
    for (let k = 0; k < 3; k++) {
      const n = makeCanvas(IS / 2, IS / 2), g = n.getContext('2d'), id = g.createImageData(IS / 2, IS / 2);
      for (let i = 0; i < id.data.length; i += 4) { id.data[i] = r() * 255; id.data[i + 1] = r() * 255; id.data[i + 2] = r() * 255; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      NZ.push(n);
    }
  }
  function audio(t0) {
    ROUNDS.forEach(([rt], i) => {
      sfx(t0 + rt, 'whoosh', { dur: 0.5 });
      sfx(t0 + rt + 1.15, i < 4 ? 'stampNo' : 'chime', { v: 0.9 });
    });
  }
  function roundAt(lt) { let k = -1; ROUNDS.forEach(([rt], i) => { if (lt >= rt + 0.5) k = i; }); return k; }
  function drawImage_(c, k, lt) {
    const [, , px, nz] = ROUNDS[Math.max(0, k)];
    if (k < 0) {
      c.save(); c.imageSmoothingEnabled = false; c.drawImage(NZ[mod(Math.floor(lt * 20), 3)], VCX - IS / 2, IY - IS / 2, IS, IS); c.restore();
      return;
    }
    sg.globalCompositeOperation = 'copy';
    const n = Math.max(1, Math.round(IS / px));
    sg.imageSmoothingEnabled = true;
    sg.drawImage(face, 0, 0, n, n);
    c.save();
    c.imageSmoothingEnabled = px <= 1;
    c.drawImage(SMALL_, 0, 0, n, n, VCX - IS / 2, IY - IS / 2, IS, IS);
    if (nz > 0) { c.globalAlpha = nz; c.imageSmoothingEnabled = false; c.drawImage(NZ[mod(Math.floor(lt * 20), 3)], VCX - IS / 2, IY - IS / 2, IS, IS); }
    c.restore();
  }
  function box(c, x, label, en, col, a, pulse) {
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(12,6,18,0.9)'; c.strokeStyle = rgba(col, 0.6 + 0.4 * pulse); c.lineWidth = 2;
    roundRect(c, x - 90, IY - 130, 180, 260, 16); c.fill(); c.stroke();
    c.globalCompositeOperation = 'lighter'; glow(c, x, IY - 20, 120, col, 0.2 + 0.5 * pulse, false); c.globalCompositeOperation = 'source-over';
    // a tiny network glyph
    const L = [[x - 50, 3], [x, 4], [x + 50, 2]];
    const P = L.map(([lx, n]) => Array.from({ length: n }, (_, i) => [lx, IY - 30 + (i - (n - 1) / 2) * 30]));
    c.strokeStyle = rgba(col, 0.4); c.lineWidth = 1; c.beginPath();
    for (let l = 0; l < 2; l++) for (const p of P[l]) for (const q of P[l + 1]) { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }
    c.stroke();
    for (const layer of P) for (const [px, py] of layer) { c.fillStyle = rgba(mixc(col, WHITE, pulse * 0.6), 1); c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fill(); }
    text(c, label, x, IY + 78, { f: font(700, 22, F.zh), color: '#fff', align: 'center', sp: 2 });
    text(c, en, x, IY + 104, { f: font(700, 12, F.mono), color: rgba(col, 1), align: 'center', sp: 2 });
    c.restore();
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.6, lt)), k = roundAt(lt);
    let gp = 0, dp = 0;
    ROUNDS.forEach(([rt]) => { gp = Math.max(gp, Math.sin(Math.PI * prog(rt, rt + 0.5, lt))); dp = Math.max(dp, Math.sin(Math.PI * prog(rt + 0.55, rt + 1.15, lt))); });
    biLabel(c, '生成对抗网络 GAN', 'GENERATOR vs DISCRIMINATOR', VCX, 200, { col: rgba(PINK, 1), alpha: inP, zs: 20, es: 13 });
    // noise feeding the generator
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const u = (lt * 0.9 + hash(i, 1)) % 1, y = IY + (hash(i, 2) - 0.5) * 220;
      glow(c, lerp(880, GX - 90, u), y + Math.sin(u * 8 + i) * 12, 6, mixc(PINK, CY_, hash(i, 3)), inP * 0.8 * Math.sin(Math.PI * u));
    }
    // generated samples fly to the canvas; verdict beams fly to the discriminator
    ROUNDS.forEach(([rt]) => {
      const p = prog(rt, rt + 0.5, lt);
      if (p > 0 && p < 1) for (let j = 0; j < 12; j++) glow(c, lerp(GX + 90, VCX - IS / 2, E.io2(clamp(p * 1.2 - j * 0.02))), IY + (j - 6) * 16, 10, PINK, 0.9);
      const q = prog(rt + 0.55, rt + 1.1, lt);
      if (q > 0 && q < 1) for (let j = 0; j < 12; j++) glow(c, lerp(VCX + IS / 2, DX - 90, E.io2(clamp(q * 1.2 - j * 0.02))), IY + (j - 6) * 16, 10, CY_, 0.9);
    });
    c.restore();
    box(c, GX, '生成器 G', 'GENERATOR · 造假', PINK, inP, gp);
    box(c, DX, '鉴别器 D', 'DISCRIMINATOR · 鉴别', CY_, inP, dp);
    // the image
    c.save(); c.globalAlpha = inP;
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30;
    c.fillStyle = '#000'; c.fillRect(VCX - IS / 2, IY - IS / 2, IS, IS);
    c.restore();
    c.save(); c.globalAlpha = inP; drawImage_(c, k, lt); c.restore();
    c.strokeStyle = rgba(PINK, 0.5 * inP); c.lineWidth = 2; c.strokeRect(VCX - IS / 2, IY - IS / 2, IS, IS);
    // discriminator scan line
    ROUNDS.forEach(([rt]) => {
      const q = prog(rt + 0.55, rt + 1.1, lt);
      if (q > 0 && q < 1) {
        const y = IY - IS / 2 + q * IS;
        c.save(); c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba(CY_, 0.5); c.fillRect(VCX - IS / 2, y - 2, IS, 4);
        glow(c, VCX, y, 200, CY_, 0.25, false);
        c.restore();
      }
    });
    // verdict stamp
    ROUNDS.forEach(([rt, yr], i) => {
      const a = prog(rt + 1.15, rt + 1.3, lt) * (1 - prog(rt + 1.6 + (i === 4 ? 9 : 0), rt + 1.75 + (i === 4 ? 9 : 0), lt));
      if (a <= 0) return;
      const last = i === 4, sc = lerp(2.2, 1, E.out3(prog(rt + 1.15, rt + 1.3, lt)));
      c.save(); c.translate(VCX, IY + 20); c.rotate(-0.18); c.scale(sc, sc); c.globalAlpha = a;
      c.strokeStyle = rgba(last ? GREEN : RED, 1); c.lineWidth = 5;
      roundRect(c, -120, -44, 240, 88, 10); c.stroke();
      text(c, last ? '真的？' : '假的！', 0, 4, { f: font(700, 40, F.zh), color: rgba(last ? GREEN : RED, 1), align: 'center', sp: 4 });
      text(c, last ? 'REAL?' : 'FAKE', 0, 32, { f: font(800, 16, F.mono), color: rgba(last ? GREEN : RED, 1), align: 'center', sp: 6 });
      c.restore();
    });
    // year of progress under the image
    if (k >= 0) {
      const yr = ROUNDS[k][1];
      text(c, `${yr}`, VCX, IY + IS / 2 + 44, { f: font(700, 26, F.mono), color: '#fff', align: 'center', sp: 4, alpha: inP });
      const labels = ['模糊的色块', '依稀有了轮廓', '五官出现', '越来越像', '难辨真假'];
      text(c, labels[k], VCX, IY + IS / 2 + 78, { f: font(400, 18, F.zh), color: rgba(PINK, 1), align: 'center', sp: 2, alpha: inP });
    }
    const fa = E.out3(prog(8.6, 9.1, lt));
    text(c, '鉴别器：50% · 已无法分辨', DX, IY - 150, { f: font(700, 16, F.zh), color: rgba(GREEN, 1), align: 'center', alpha: fa });
  }
  return { prep, audio, draw };
})();

/* ===================================================== 2016 AlphaGo */
VIS.y2016 = (() => {
  const BS = 600, M = 30, SP = (BS - 2 * M) / 18, X0 = VCX - BS / 2, Y0 = 515 - BS / 2;
  const BLACK = [[15, 3], [16, 15], [2, 13], [13, 16], [9, 3], [2, 6], [9, 15], [14, 13], [10, 10], [16, 12], [7, 14], [11, 15], [4, 12], [6, 11], [3, 7], [16, 6], [5, 14], [12, 12]];
  const WHITE_ = [[3, 15], [3, 3], [5, 16], [15, 9], [15, 5], [5, 2], [12, 2], [4, 9], [6, 6], [13, 4], [2, 10], [8, 8], [12, 6], [10, 4], [7, 3], [14, 11], [8, 17], [11, 8]];
  const SEQ = BLACK.flatMap((b, i) => [[...b, 1], [...WHITE_[i], 0]]);
  const MOVE37 = [14, 8], HEAT = 3.9, T37 = 5.5, SCORE = 7.4;
  const CANDS = [[16, 9, 0.14], [13, 9, 0.11], [15, 11, 0.08], [9, 6, 0.06], [4, 5, 0.05], [10, 13, 0.04], [17, 10, 0.03], [7, 9, 0.03]];
  const stoneT = k => 0.5 + k / 11.5;
  const pos = (col, row) => [X0 + M + col * SP, Y0 + M + row * SP];
  let wood = null, sB = null, sW = null;
  function prep() {
    wood = makeCanvas(BS, BS);
    const g = wood.getContext('2d'), r = rng(2016);
    let gr = g.createLinearGradient(0, 0, BS, BS);
    gr.addColorStop(0, '#e4b870'); gr.addColorStop(1, '#c78f46');
    g.fillStyle = gr; g.fillRect(0, 0, BS, BS);
    for (let i = 0; i < 90; i++) {
      const y0 = r() * BS;
      g.strokeStyle = `rgba(120,70,20,${(0.03 + r() * 0.06).toFixed(3)})`; g.lineWidth = 1 + r() * 2.5;
      g.beginPath();
      for (let x = 0; x <= BS; x += 20) { const y = y0 + Math.sin(x * 0.01 + i) * 8 + Math.sin(x * 0.037 + i * 2) * 3; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(40,25,10,0.85)'; g.lineWidth = 1.3;
    for (let i = 0; i < 19; i++) { const p = M + i * SP; g.beginPath(); g.moveTo(M, p); g.lineTo(BS - M, p); g.moveTo(p, M); g.lineTo(p, BS - M); g.stroke(); }
    g.fillStyle = 'rgba(40,25,10,0.95)';
    for (const a of [3, 9, 15]) for (const b of [3, 9, 15]) { g.beginPath(); g.arc(M + a * SP, M + b * SP, 4, 0, TAU); g.fill(); }
    const mk = black => {
      const s = makeCanvas(40, 40), q = s.getContext('2d'), rg = q.createRadialGradient(15, 13, 2, 20, 20, 16);
      if (black) { rg.addColorStop(0, '#6a6a6a'); rg.addColorStop(0.3, '#1d1d1d'); rg.addColorStop(1, '#050505'); }
      else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.55, '#ece8df'); rg.addColorStop(1, '#b9b2a6'); }
      q.fillStyle = rg; q.beginPath(); q.arc(20, 20, 14.5, 0, TAU); q.fill();
      return s;
    };
    sB = mk(true); sW = mk(false);
  }
  function audio(t0) {
    SEQ.forEach((_, k) => sfx(t0 + stoneT(k) + 0.1, 'stone', { v: 0.55 + 0.3 * hash(k, 16) }));
    sfx(t0 + HEAT, 'shimmer', { dur: 1.2 });
    sfx(t0 + T37 + 0.2, 'stone', { v: 1.3 }); hit(t0 + T37 + 0.2, 0.7);
  }
  function stone(c, col, row, black, t0, lt, big = false) {
    const p = prog(t0, t0 + (big ? 0.2 : 0.1), lt);
    if (p <= 0) return;
    const [x, y] = pos(col, row), sc = lerp(big ? 2.4 : 1.5, 1, E.in2(p)), sz = 30 * sc;
    c.globalAlpha = Math.min(1, p * 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(x + 3, y + 4, 14.5, 13, 0, 0, TAU); c.fill();
    c.drawImage(black ? sB : sW, x - sz * 0.667, y - sz * 0.667 - (sc - 1) * 20, sz * 1.333, sz * 1.333);
    c.globalAlpha = 1;
  }
  function draw(c, lt) {
    const inP = E.out3(prog(0, 0.7, lt));
    c.save();
    c.globalAlpha = inP;
    // a slow 3-D tilt of the board
    const tilt = lerp(0.82, 0.96, E.io2(prog(0, 10, lt)));
    c.translate(VCX, 515); c.rotate(lerp(-0.07, -0.02, lt / 10)); c.scale(1, tilt); c.translate(-VCX, -515);
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    c.drawImage(wood, X0, Y0); c.shadowBlur = 0; c.shadowOffsetY = 0;
    SEQ.forEach(([col, row, b], k) => stone(c, col, row, b, stoneT(k), lt));
    // AlphaGo's policy network: where would a human play?
    const ha = prog(HEAT, HEAT + 0.4, lt) * (1 - prog(T37 - 0.2, T37 + 0.1, lt));
    if (ha > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      CANDS.forEach(([cx, cy, p], i) => {
        const [x, y] = pos(cx, cy), a = ha * E.out3(prog(HEAT + i * 0.06, HEAT + 0.3 + i * 0.06, lt));
        glow(c, x, y, 20 + p * 380, [255, 150, 60], a * 0.8, false);
      });
      const [mx, my] = pos(...MOVE37), blink = 0.5 + 0.5 * Math.sin(lt * 14);
      glow(c, mx, my, 26, [90, 235, 215], ha * (0.4 + 0.6 * blink));
      c.restore();
      CANDS.slice(0, 3).forEach(([cx, cy, p]) => { const [x, y] = pos(cx, cy); text(c, Math.round(p * 100) + '%', x, y - 22, { f: font(700, 15, F.mono), color: '#ffe0b0', align: 'center', alpha: ha }); });
    }
    const sl = E.out2(prog(T37 + 0.05, T37 + 0.5, lt));
    const [mx, my] = pos(...MOVE37);
    if (sl > 0) {
      const g = c.createRadialGradient(mx, my, 40, mx, my, 260);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,10,12,${(0.55 * sl).toFixed(3)})`);
      c.fillStyle = g; c.fillRect(X0, Y0, BS, BS);
    }
    stone(c, MOVE37[0], MOVE37[1], true, T37, lt, true);
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++) {
      const d = lt - T37 - 0.15 - k * 0.22;
      if (d > 0 && d < 1.1) { c.strokeStyle = rgba([90, 235, 215], (1 - d / 1.1) * 0.95); c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 16 + d * 240, 0, TAU); c.stroke(); }
    }
    if (lt > T37) glow(c, mx, my, 70, [90, 235, 215], 0.8 * Math.exp(-(lt - T37) * 0.8) + 0.35);
    c.globalCompositeOperation = 'source-over';
    c.restore();
    const smy = 515 + (my - 515) * tilt;
    const hl = E.out3(prog(HEAT + 0.3, HEAT + 0.7, lt)) * (1 - prog(T37 - 0.2, T37, lt));
    text(c, '策略网络：人类最可能下在哪里？', VCX, 878, { f: font(700, 22, F.zh), color: '#ffe0b0', align: 'center', sp: 2, alpha: hl });
    const la = E.out3(prog(T37 + 0.3, T37 + 0.7, lt));
    if (la > 0) {
      const ex = mx + 150 * la, ey = smy - 140 * la;
      c.strokeStyle = 'rgba(160,255,240,0.9)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(mx + 14, smy - 14); c.lineTo(ex, ey); c.lineTo(ex + 20, ey); c.stroke();
      c.fillStyle = 'rgba(2,20,20,0.85)'; roundRect(c, ex + 22, ey - 50, 250, 84, 10); c.globalAlpha = la; c.fill(); c.globalAlpha = 1;
      text(c, '第 37 手', ex + 38, ey - 12, { f: font(700, 30, F.zh), color: '#dffff9', sp: 2, alpha: la });
      text(c, '人类下出的概率：1/10,000', ex + 40, ey + 18, { f: font(700, 14, F.zh), color: 'rgb(110,235,215)', sp: 1, alpha: la });
    }
    text(c, 'ALPHAGO  vs  李世石 LEE SEDOL  ·  第二局  ·  首尔  ·  2016.3.10', VCX, 190, { f: font(700, 15, F.zh), color: 'rgb(140,235,220)', align: 'center', sp: 2, alpha: 0.85 * inP });
    const sc = E.out3(prog(SCORE, SCORE + 0.5, lt));
    if (sc > 0) text(c, 'ALPHAGO   4 – 1   李世石', VCX, 878, { f: font(800, 36, F.body), color: '#dffff9', align: 'center', sp: 2, alpha: sc });
  }
  return { prep, audio, draw };
})();

/* ================================================== 2017 Transformer */
VIS.y2017 = (() => {
  const TOK = ['The', 'animal', 'didn’t', 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
  const W1 = [0.03, 0.6, 0.02, 0.03, 0.04, 0.08, 0.02, 0.1, 0.02, 0.02, 0.04];
  const W2 = [0.03, 0.07, 0.02, 0.03, 0.06, 0.6, 0.02, 0.09, 0.02, 0.02, 0.06];
  const XL = 1150, XR = 1580, Y0 = 262, DY = 46, IT = 7, SWITCH = 3.6, STACK = 6.0;
  const V = [190, 150, 255], CY_ = [100, 220, 255];
  const yOf = i => Y0 + i * DY;
  function audio(t0) {
    sfx(t0 + 1.5, 'ping'); sfx(t0 + SWITCH, 'ping', { f: 1.25 });
    for (let i = 0; i < 12; i++) sfx(t0 + STACK + 0.3 + i * 0.22, 'blip', { f: 300 * Math.pow(1.08, i), v: 0.35 });
  }
  function curveTo(c, x1, y1, x2, y2) { c.moveTo(x1, y1); c.bezierCurveTo(x1 + 170, y1, x2 - 170, y2, x2, y2); }
  function drawAttention(c, lt, A) {
    const inP = E.out3(prog(0, 0.6, lt)) * A;
    const mesh = E.out3(prog(0.4, 1.3, lt)) * (1 - 0.8 * E.out3(prog(1.5, 2.2, lt)));
    const focus = E.out3(prog(1.5, 2.2, lt)), sw = E.io3(prog(SWITCH, SWITCH + 0.8, lt));
    biLabel(c, '自注意力：每个词都看向其他所有词', 'SELF-ATTENTION', VCX + 5, 200, { col: rgba(V, 1), alpha: 0.9 * inP, zs: 18, es: 12 });
    if (mesh > 0.01) {
      c.strokeStyle = rgba(V, 0.09 * mesh * A); c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < TOK.length; i++) for (let j = 0; j < TOK.length; j++) curveTo(c, XL + 14, yOf(i) - 8, XR - 14, yOf(j) - 8);
      c.stroke();
    }
    if (focus > 0) {
      for (let j = 0; j < TOK.length; j++) {
        const w = lerp(W1[j], W2[j], sw);
        const g = c.createLinearGradient(XL, 0, XR, 0);
        g.addColorStop(0, rgba(V, (0.15 + 0.85 * w) * focus * A)); g.addColorStop(1, rgba(CY_, (0.15 + 0.85 * w) * focus * A));
        c.strokeStyle = g; c.lineWidth = 1 + w * 18; c.lineCap = 'round';
        c.beginPath(); curveTo(c, XL + 14, yOf(IT) - 8, XR - 14, yOf(j) - 8); c.stroke();
      }
    }
    for (let i = 0; i < TOK.length; i++) {
      const a = inP * E.out3(prog(0.15 + i * 0.03, 0.5 + i * 0.03, lt));
      for (const side of [0, 1]) {
        let word = TOK[i], alt = null;
        if (i === TOK.length - 1) { word = 'tired'; alt = 'wide'; }
        const x = side ? XR : XL, y = yOf(i), align = side ? 'left' : 'right';
        const w = side ? lerp(W1[i], W2[i], sw) : 0;
        c.font = font(500, 27); c.letterSpacing = '0px';
        if (side === 0 && i === IT && focus > 0) {
          const tw = c.measureText('it').width;
          c.fillStyle = rgba(V, 0.35 * focus * A); roundRect(c, x - tw - 14, y - 30, tw + 28, 40, 10); c.fill();
        }
        if (side === 1 && w > 0.3 && focus > 0) {
          const tw = c.measureText(i === 1 ? 'animal' : 'street').width, k = focus * clamp((w - 0.3) / 0.3);
          c.fillStyle = rgba(CY_, 0.25 * k * A); roundRect(c, x - 14, y - 30, tw + 28, 40, 10); c.fill();
          c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x + tw / 2, y - 10, 90, CY_, 0.35 * k * A); c.restore();
        }
        const col = (side === 0 && i === IT) ? '#ffffff' : `rgba(235,235,255,${(0.55 + (side ? w : 0) * 0.45).toFixed(3)})`;
        if (alt) {
          const p = E.io3(prog(SWITCH - 0.1, SWITCH + 0.3, lt));
          if (p < 1) text(c, word, x, y - p * 22, { f: font(500, 27), color: col, align, alpha: a * (1 - p) });
          if (p > 0) text(c, alt, x, y + (1 - p) * 22, { f: font(500, 27), color: '#ffe9a8', align, alpha: a * p });
        } else text(c, word, x, y, { f: font(500, 27), color: col, align, alpha: a });
      }
    }
    const cap = (zh, en, k) => {
      if (k <= 0) return;
      text(c, zh, VCX + 5, 800, { f: font(700, 28, F.zh), color: '#efe8ff', align: 'center', sp: 2, alpha: k * A });
      text(c, en, VCX + 5, 840, { f: font(400, 20, F.zh), color: 'rgba(225,215,255,0.75)', align: 'center', sp: 1, alpha: k * A });
    };
    cap('“它” → 动物（因为动物才会累）', '这只动物没有过马路，因为它太累了。', focus * (1 - prog(SWITCH - 0.1, SWITCH + 0.2, lt)));
    cap('“它” → 马路（因为马路才会宽）', '这只动物没有过马路，因为它太宽了。', prog(SWITCH + 0.3, SWITCH + 0.7, lt));
  }
  function drawStack(c, lt) {
    const a = E.out3(prog(STACK, STACK + 0.6, lt));
    if (a <= 0) return;
    const n = Math.min(12, Math.floor(prog(STACK + 0.3, STACK + 2.9, lt) * 12 + 0.001));
    const base = 800, gap = lerp(44, 36, prog(STACK, STACK + 3, lt)), w = 420, d = 150;
    biLabel(c, 'Transformer：把注意力层一层层堆叠起来', 'STACKED LAYERS', VCX, 200, { col: rgba(V, 1), alpha: a, zs: 18, es: 12 });
    for (let k = 0; k <= n; k++) {
      const p = k < n ? 1 : prog(STACK + 0.3 + n * 0.22, STACK + 0.3 + (n + 1) * 0.22, lt);
      if (p <= 0) continue;
      const y = base - k * gap - (1 - E.out3(p)) * 60;
      c.save(); c.globalAlpha = a * E.out3(p);
      const q = [[VCX - w / 2, y], [VCX + w / 2 - 60, y], [VCX + w / 2 + d * 0.5 - 60, y - d * 0.25], [VCX - w / 2 + d * 0.5, y - d * 0.25]];
      c.beginPath(); q.forEach(([x, yy], i) => (i ? c.lineTo(x, yy) : c.moveTo(x, yy))); c.closePath();
      const g = c.createLinearGradient(VCX - w / 2, y, VCX + w / 2, y - d * 0.25);
      g.addColorStop(0, rgba(V, 0.28)); g.addColorStop(1, rgba(CY_, 0.18));
      c.fillStyle = g; c.fill();
      c.strokeStyle = rgba(mixc(V, WHITE, 0.4), 0.8); c.lineWidth = 1.5; c.stroke();
      c.restore();
    }
    // tokens rising through the stack as light
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 30; i++) {
      const u = (lt * 0.5 + hash(i, 5)) % 1, y = base - u * (n * gap + 60) - 10;
      glow(c, VCX - 120 + hash(i, 6) * 240 + d * 0.25 * hash(i, 7), y - d * 0.12, 9, mixc(V, CY_, hash(i, 8)), a * Math.sin(Math.PI * u));
    }
    c.restore();
    text(c, `${n} 层`, VCX + w / 2 + 70, base - n * gap / 2, { f: font(700, 34, F.zh), color: '#fff', align: 'left', alpha: a });
    const ga = E.out3(prog(STACK + 3.0, STACK + 3.5, lt));
    text(c, '→ GPT-3 堆了 96 层', VCX + w / 2 + 70, base - n * gap / 2 + 40, { f: font(400, 18, F.zh), color: rgba(CY_, 1), alpha: ga });
    text(c, '它就是 GPT 里的 “T”', VCX, 880, { f: font(700, 24, F.zh), color: '#efe8ff', align: 'center', sp: 3, alpha: ga });
  }
  function draw(c, lt) {
    const A = 1 - E.io2(prog(STACK - 0.4, STACK + 0.2, lt));
    if (A > 0) drawAttention(c, lt, A);
    drawStack(c, lt);
    text(c, 'VASWANI ET AL.  ·  “ATTENTION IS ALL YOU NEED”  ·  2017', VCX + 5, 920, { f: font(500, 12, F.mono), color: 'rgba(210,200,255,0.5)', align: 'center', sp: 2, alpha: E.out3(prog(0, 0.6, lt)) * A });
  }
  return { audio, draw };
})();
