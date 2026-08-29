import { W, H, Sprite, BgLayer, overlay, octx, flushOverlay, keys, pressed, render, camera } from './engine.js';
import { PALETTE as P } from './palette.js';
import { drawText, textWidth } from './font.js';
import { HEROES } from './data/heroSprites.js';
import { ENEMIES } from './data/enemySprites.js';
import { LEVELS } from './data/levels.js';
import { STORY } from './data/story.js';
import { PORTRAITS } from './data/portraits.js';
import { drawSplash } from './data/splash.js';
import { Audio } from './audio.js';

// ---------- tuning ----------
const GRAV = 0.18, JUMPV = 3.1;
const PUNCH_DMG = 6, KICK_DMG = 8, JK_DMG = 12, SPECIAL_DMG = 16;
const ENEMY_STATS = {
  thug:   { hp: 24, dmg: 5, speed: 0.55, reach: 24 },
  blade:  { hp: 28, dmg: 7, speed: 0.65, reach: 24 },
  lord:   { hp: 34, dmg: 7, speed: 0.55, reach: 26 },
  lightning: { hp: 90, dmg: 9, speed: 0.8, reach: 26, boss: true, title: 'LIGHTNING OF THE 3 STORMS' },
  rain:      { hp: 100, dmg: 9, speed: 0.75, reach: 28, boss: true, title: 'RAIN OF THE 3 STORMS' },
  thunder:   { hp: 120, dmg: 11, speed: 0.6, reach: 28, boss: true, title: 'THUNDER OF THE 3 STORMS' },
  lopan_old: { hp: 40, dmg: 4, speed: 0.3, reach: 20, title: 'DAVID LO PAN' },
  lopan:     { hp: 170, dmg: 11, speed: 0.7, reach: 30, boss: true, title: 'LO PAN THE SORCERER' },
};
const WAVES = {
  street: [
    { x: 90,  spawn: ['thug', 'thug'] },
    { x: 380, spawn: ['thug', 'blade'] },
    { x: 680, spawn: ['blade', 'blade', 'thug'] },
    { x: 980, spawn: ['lord', 'lord'] },
    { x: 1240, spawn: ['lightning'], boss: true },
  ],
  warehouse: [
    { x: 90,  spawn: ['thug', 'lord'] },
    { x: 420, spawn: ['lord', 'lord', 'thug'] },
    { x: 760, spawn: ['blade', 'blade', 'lord'] },
    { x: 1240, spawn: ['rain'], boss: true },
  ],
  sewers: [
    { x: 90,  spawn: ['blade', 'blade'] },
    { x: 420, spawn: ['lord', 'thug', 'thug'] },
    { x: 760, spawn: ['lord', 'lord', 'blade'] },
    { x: 1240, spawn: ['thunder'], boss: true },
  ],
  lair: [
    { x: 90,  spawn: ['lord', 'lord'] },
    { x: 400, spawn: ['lopan_old', 'thug', 'thug'] },
    { x: 760, spawn: ['lord', 'blade', 'blade'] },
    { x: 1240, spawn: ['lopan'], boss: true },
  ],
};

// procedural effect frames
const SPARK = [
  ['..W..', '.WWW.', 'WWYWW', '.WWW.', '..W..'],
  ['W...W', '.....', '..Y..', '.....', 'W...W'],
];
const DUST = [
  ['..LL..', '.GLLG.', 'G.GG.G'],
  ['.G..G.', 'G....G', '.G..G.'],
];
function landDust(f) {
  effects.push({ x: f.x - 7, y: f.y, f: 0, t: 0, frs: DUST });
  effects.push({ x: f.x + 7, y: f.y, f: 0, t: 0, frs: DUST });
}
const ORB = [
  ['...ccc...',
   '.ccWWWcc.',
   '.cWWWWWc.',
   'ccWWeWWcc',
   '.cWWWWWc.',
   '.ccWWWcc.',
   '...ccc...'],
  ['...MMM...',
   '.MMWWWMM.',
   '.MWWWWWM.',
   'MMWWeWWMM',
   '.MWWWWWM.',
   '.MMWWWMM.',
   '...MMM...'],
];
// Lightning's horizontal bolt, 14x5 zigzag
const BOLT = [
  ['..W.......W...',
   '.WcW.....WcW..',
   'Wc.cW...Wc.cW.',
   '.....WcW.....W',
   '......W.......'],
  ['......W.......',
   '.....WcW.....W',
   'Wc.cW...Wc.cW.',
   '.WcW.....WcW..',
   '..W.......W...'],
];
// Thunder's ground shockwave, 12x6 dust arc
const SHOCKWAVE = [
  ['......LLLLLL......',
   '....LLWWWWWWLL....',
   '..LLGG......GGLL..',
   '.LG............GL.',
   'LG..............GL',
   'G................G',
   'G................G',
   'GG..............GG'],
  ['..................',
   '.....LLLLLLLL.....',
   '...LLGG....GGLL...',
   '..LG..........GL..',
   '.LG....LLLL....GL.',
   'LG....G....G....GL',
   'G....G......G....G',
   'GG..G........G..GG'],
];
// boss special -> ranged attack config (h = draw height above feet)
const BOSS_SHOT = new Map([
  [ENEMIES.lopan,     { frs: ORB,       vx: 1.8, dmg: 12, h: 26, depth: 12, airMax: 20 }],
  [ENEMIES.lightning, { frs: BOLT,      vx: 2.2, dmg: 10, h: 24, depth: 12, airMax: 20 }],
  [ENEMIES.thunder,   { frs: SHOCKWAVE, vx: 1.5, dmg: 9,  h: 0,  depth: 8,  airMax: 6 }],
]);

// ---------- state ----------
let state = 'title';       // title, select, cutscene, stagecard, play, gameover, ending
let tick = 0, shake = 0, hitpause = 0;
let heroKey = 'jack';
let levelIdx = 0, camX = 0, camLock = -1;
let layers = [], waves = [], entities = [], effects = [], projectiles = [], popups = [];
let splashT = 0;
let player = null;
let score = 0, lives = 3, selIdx = 0;
let dialog = null;         // {lines:[{speaker,text}], i, chars, next: fn}
let stageTimer = 0, endTimer = 0, continueTimer = 0;
let lastHurtEnemy = null, titleFlash = 0;
let bannerText = '', bannerT = 0;
let audioStarted = false;

function level() { return LEVELS[levelIdx]; }

// ---------- entities ----------
function makeFighter(def, stats, x, y, isPlayer) {
  return {
    def, stats, x, y, air: 0, vy: 0, facing: 1,
    state: 'idle', frame: 0, ft: 0,
    hp: stats.hp, maxhp: stats.hp,
    isPlayer, combo: 0, comboT: 0, invuln: 0, dead: false,
    atkCd: 0, aiT: 0, strafe: 0, didHit: false,
    sprite: new Sprite(),
  };
}
function frames(f, name) {
  return f.def.frames[name] || (name === 'walk' ? f.def.frames.idle : f.def.frames.punch) || f.def.frames.idle;
}
function setState(f, s) { f.state = s; f.frame = 0; f.ft = 0; f.didHit = false; }

const FRAME_T = { idle: 18, walk: 7, punch: 5, kick: 6, special: 7, hurt: 18, knockdown: 60 };

function animate(f) {
  const fs = frames(f, f.state);
  const t = FRAME_T[f.state] || 8;
  f.ft++;
  if (f.ft >= t) {
    f.ft = 0; f.frame++;
    if (f.frame >= fs.length) {
      if (['punch', 'kick', 'special'].includes(f.state)) { setState(f, 'idle'); f.atkCd = f.isPlayer ? 6 : 40 + Math.random() * 50; }
      else if (f.state === 'hurt') setState(f, 'idle');
      else if (f.state === 'knockdown') { f.frame = fs.length - 1; f.kdT = (f.kdT || 0) + 1; if (f.kdT > 1) { getUp(f); } }
      else f.frame = 0;
    }
  }
}
function getUp(f) {
  f.kdT = 0;
  if (f.hp <= 0) { f.dying = 40; return; }
  setState(f, 'idle'); f.invuln = 70;
}

function hitFighter(target, attacker, dmg, knockdown) {
  if (target.invuln > 0 || target.state === 'knockdown' || target.dying) return false;
  target.hp -= dmg;
  target.facing = attacker.x < target.x ? -1 : 1;
  const push = attacker.x < target.x ? 1 : -1;
  effects.push({ x: target.x + push * -6, y: target.y - (target.sprite.h ? target.sprite.h * 0.6 : 24) - target.air, f: 0, t: 0 });
  score += target.isPlayer ? 0 : 10;
  hitpause = 3;
  if (!target.isPlayer) lastHurtEnemy = target;
  target.combo++;
  if (knockdown || target.combo >= 3 || target.hp <= 0) {
    target.combo = 0;
    setState(target, 'knockdown');
    target.kdT = 0;
    target.x += push * 18;
    target.air = 6; target.vy = 1.2;
    shake = 6;
    Audio.sfx('knockdown');
    if (target.hp <= 0) {
      if (!target.isPlayer) {
        const pts = target.stats.boss ? 1000 : 100;
        score += pts;
        popups.push({ x: target.x, y: target.y - 34, txt: '+' + pts, t: 0 });
        Audio.sfx('enemydown');
      }
    }
  } else {
    setState(target, 'hurt');
    target.x += push * 5;
    Audio.sfx('hit');
  }
  return true;
}

function tryAttackHit(f, dmg, reach, knockdown) {
  if (f.didHit) return;
  f.didHit = true;
  const targets = f.isPlayer ? entities : [player];
  for (const t of targets) {
    if (!t || t.dead || t.dying) continue;
    if (Math.abs(t.y - f.y) > 13) continue;
    const dx = (t.x - f.x) * f.facing;
    if (dx > 2 && dx < reach) {
      if (hitFighter(t, f, dmg, knockdown)) Audio.sfx(f.state === 'kick' ? 'kick' : 'punch');
    }
  }
}

// ---------- player ----------
function updatePlayer(pl) {
  if (pl.invuln > 0) pl.invuln--;
  if (pl.dying) return;
  const lv = level();
  const atk = pressed.KeyZ || pressed.KeyJ;
  const kick = pressed.KeyX || pressed.KeyK;
  const jump = pressed.KeyC || pressed.Space;

  if (pl.air > 0 || pl.vy > 0) { // airborne
    pl.vy -= GRAV; pl.air += pl.vy;
    if (pl.air <= 0) { pl.air = 0; pl.vy = 0; if (pl.state === 'jump' || pl.state === 'jumpkick') setState(pl, 'idle'); else if (pl.state === 'knockdown') landDust(pl); }
    if ((atk || kick) && pl.state === 'jump') { setState(pl, 'jumpkick'); tryAttackHit(pl, JK_DMG, 30, true); }
    if (pl.state === 'jumpkick') tryAttackHit(pl, JK_DMG, 30, true);
    // air drift
    if (keys.ArrowLeft || keys.KeyA) pl.x -= 1.1;
    if (keys.ArrowRight || keys.KeyD) pl.x += 1.1;
  } else if (['idle', 'walk'].includes(pl.state)) {
    let mx = 0, my = 0;
    if (keys.ArrowLeft || keys.KeyA) mx = -1;
    if (keys.ArrowRight || keys.KeyD) mx = 1;
    if (keys.ArrowUp || keys.KeyW) my = -1;
    if (keys.ArrowDown || keys.KeyS) my = 1;
    if (mx) pl.facing = mx;
    pl.x += mx * 1.3; pl.y += my * 0.8;
    setStateIf(pl, mx || my ? 'walk' : 'idle');
    if (atk && pl.atkCd <= 0) {
      // haymaker special on 3rd rapid press? keep: punch; Down+punch = special
      if ((keys.ArrowDown || keys.KeyS) && pl.def.frames.special) setState(pl, 'special');
      else setState(pl, 'punch');
    } else if (kick && pl.atkCd <= 0) setState(pl, 'kick');
    else if (jump) { setState(pl, 'jump'); pl.vy = JUMPV; pl.air = 0.01; Audio.sfx('jump'); }
  }
  if (pl.atkCd > 0) pl.atkCd--;
  // active attack frames
  if (pl.state === 'punch' && pl.frame === 1) tryAttackHit(pl, PUNCH_DMG, 26, false);
  if (pl.state === 'kick' && pl.frame === 1) tryAttackHit(pl, KICK_DMG, 30, false);
  if (pl.state === 'special' && pl.frame === 1) tryAttackHit(pl, SPECIAL_DMG, 30, true);

  // clamp to floor band and camera
  pl.y = Math.max(lv.floorTop, Math.min(lv.floorBottom, pl.y));
  const maxX = camLock >= 0 ? camLock + W - 12 : lv.lengthPx - 8;
  pl.x = Math.max(camX + 8, Math.min(maxX, pl.x));
  animate(pl);

  if (pl.hp <= 0 && pl.state !== 'knockdown' && !pl.dying) { setState(pl, 'knockdown'); }
}
function setStateIf(f, s) { if (f.state !== s) setState(f, s); }

// ---------- enemy AI ----------
function updateEnemy(e) {
  if (e.invuln > 0) e.invuln--;
  if (e.dying) { e.dying--; if (e.dying <= 0) { e.dead = true; e.sprite.hide(); } return; }
  if (e.air > 0 || e.vy > 0) { e.vy -= GRAV; e.air += e.vy; if (e.air <= 0) { e.air = 0; e.vy = 0; if (e.state === 'knockdown') landDust(e); } }
  const lv = level();
  if (['hurt', 'knockdown'].includes(e.state)) { animate(e); return; }
  if (e.atkCd > 0) e.atkCd--;
  e.aiT--;
  const dx = player.x - e.x, dy = player.y - e.y;
  const adx = Math.abs(dx);
  e.facing = dx < 0 ? -1 : 1;
  const inReach = adx < e.stats.reach && Math.abs(dy) < 10;

  if (['punch', 'special'].includes(e.state)) {
    if (e.state === 'punch' && e.frame === 1) tryAttackHit(e, e.stats.dmg, e.stats.reach + 2, false);
    if (e.state === 'special' && e.frame === 1) {
      tryAttackHit(e, e.stats.dmg + 4, e.stats.reach + 8, true);
      const shot = BOSS_SHOT.get(e.def);
      if (shot && !e.didShoot) {
        e.didShoot = true;
        projectiles.push({ x: e.x + e.facing * 12, y: e.y, h: shot.h, vx: e.facing * shot.vx,
          dmg: shot.dmg, depth: shot.depth, airMax: shot.airMax, frs: shot.frs, f: 0, t: 0, spr: new Sprite() });
        Audio.sfx('thunder');
      }
    }
    animate(e); return;
  }
  e.didShoot = false;

  if (inReach && e.atkCd <= 0 && !player.dying && player.state !== 'knockdown') {
    const useSpecial = e.stats.boss && e.def.frames.special && e.hp < e.maxhp * 0.6 && Math.random() < 0.35;
    setState(e, useSpecial ? 'special' : 'punch');
    if (e.def === ENEMIES.thunder && useSpecial) shake = 8;
  } else {
    // approach: close y first-ish, keep slight offset so they don't stack
    if (e.aiT <= 0) { e.aiT = 30 + Math.random() * 40; e.strafe = (Math.random() - 0.5) * 1.2; e.side = Math.random() < 0.5 ? -1 : 1; }
    const wantX = player.x + (adx < 60 ? e.side * (e.stats.reach - 6) : 0);
    const mx = Math.sign(wantX - e.x), my = Math.sign(dy + e.strafe * 8);
    e.x += mx * e.stats.speed;
    e.y += my * e.stats.speed * 0.7;
    e.y = Math.max(lv.floorTop, Math.min(lv.floorBottom, e.y));
    setStateIf(e, (mx || my) ? 'walk' : 'idle');
  }
  animate(e);
}

// ---------- per-stage enemy recolors ----------
const RECOLOR = { // levelIdx -> type -> palette char map (skin/outline untouched)
  1: { thug: { E: 'B', g: 'b' }, blade: { R: 'P', r: 'p' }, lord: { '1': 'm' } },
  2: { thug: { E: 'P', g: 'p' }, blade: { R: 'Y', r: 'y' }, lord: { '1': 'g' } },
  3: { thug: { E: 'R', g: 'r' }, blade: { R: 'c', r: 'b' }, lord: { '1': 'b' } },
};
function recolorFrames(framesObj, map) {
  const out = {};
  for (const k in framesObj)
    out[k] = framesObj[k].map(fr => fr.map(row => row.replace(/./g, ch => map[ch] || ch)));
  return out;
}
const recolorCache = {}; // (type+stage) -> def, so frameTexture caching stays effective
function enemyDef(type) {
  const map = RECOLOR[levelIdx] && RECOLOR[levelIdx][type];
  if (!map) return ENEMIES[type];
  const key = type + ':' + levelIdx;
  if (!recolorCache[key]) recolorCache[key] = { ...ENEMIES[type], frames: recolorFrames(ENEMIES[type].frames, map) };
  return recolorCache[key];
}

// ---------- waves / camera ----------
function updateWaves() {
  const active = entities.filter(e => !e.dead);
  if (camLock >= 0 && active.length === 0) {
    camLock = -1;
    if (waves.length === 0) { // level cleared
      const id = level().id;
      startDialog(STORY.postBoss[id], () => {
        if (levelIdx >= LEVELS.length - 1) startEnding();
        else { levelIdx++; startStage(); }
      });
      return;
    }
  }
  if (camLock < 0 && waves.length && player.x > waves[0].x) {
    const w = waves.shift();
    camLock = Math.min(camX, level().lengthPx - W);
    for (let i = 0; i < w.spawn.length; i++) {
      const type = w.spawn[i];
      const def = enemyDef(type), stats = ENEMY_STATS[type];
      const side = i % 2 === 0 ? 1 : -1;
      const ex = side > 0 ? camLock + W + 16 + i * 8 : camLock - 16 - i * 8;
      const ey = level().floorTop + 8 + (i * 23) % (level().floorBottom - level().floorTop - 8);
      const e = makeFighter(def, stats, ex, ey, false);
      entities.push(e);
      if (stats.title) { bannerText = stats.title; bannerT = 140; }
      if (stats.boss) { e.isBoss = true; Audio.playSong('boss'); }
    }
  }
  // camera follow
  const targetCam = Math.max(0, Math.min(player.x - 108, level().lengthPx - W));
  if (camLock < 0) camX = Math.max(camX, targetCam); // forward-only like DD
  else camX = camLock;
}

// ---------- drawing ----------
function zFor(y) { return (y - 100) / 100; }

function drawWorld() {
  for (let i = 0; i < layers.length; i++) layers[i].update(camX, -5 + i);
  const all = [player, ...entities].filter(e => e && !e.dead);
  for (const f of all) {
    const fs = frames(f, f.state);
    const fr = fs[Math.min(f.frame, fs.length - 1)];
    f.sprite.setFrame(fr);
    const flicker = (f.invuln > 0 || f.dying) && (tick & 2);
    if (flicker) { f.sprite.hide(); continue; }
    f.sprite.place(f.x - camX, f.y - f.air, f.facing < 0, zFor(f.y));
  }
  for (const fx of effects) {
    if (!fx.spr) fx.spr = new Sprite();
    fx.spr.setFrame((fx.frs || SPARK)[fx.f % 2]);
    fx.spr.place(fx.x - camX, fx.y, false, 3);
  }
  for (const pr of projectiles) {
    pr.spr.setFrame((pr.frs || ORB)[pr.f % 2]);
    pr.spr.place(pr.x - camX, pr.y - pr.h, pr.vx < 0, 3);
  }
}

function drawHUD() {
  octx.fillStyle = P['0']; octx.fillRect(0, 0, W, 32);
  octx.fillStyle = P['r']; octx.fillRect(0, 31, W, 1);
  drawText(octx, '1UP', 8, 2, P['R']);
  drawText(octx, 'STAGE ' + (levelIdx + 1), 104, 2, P['L']);
  drawText(octx, 'SCORE ' + String(score).padStart(6, '0'), 152, 2, P['W']);
  // player
  drawText(octx, player.def.name, 8, 12, P['W']);
  drawBar(8, 21, 64, player.hp / player.maxhp, P['Y'], P['r']);
  drawText(octx, 'x' + lives, 76, 12, P['W']);
  // enemy bar
  const foe = (lastHurtEnemy && !lastHurtEnemy.dead && !lastHurtEnemy.dying) ? lastHurtEnemy
    : entities.find(e => e.isBoss && !e.dead);
  if (foe) {
    drawText(octx, foe.def.name, 152, 12, P['M']);
    drawBar(152, 21, 64, Math.max(0, foe.hp / foe.maxhp), P['R'], P['1']);
  }
  // GO arrow, DD-style at mid height on the right edge, on a black chip for contrast
  if (camLock < 0 && waves.length && (tick & 16)) {
    octx.fillStyle = P['0']; octx.fillRect(221, 111, 30, 16);
    octx.fillStyle = P['W']; // 1px border, corners skipped (rounded chip)
    octx.fillRect(222, 111, 28, 1); octx.fillRect(222, 126, 28, 1);
    octx.fillRect(221, 112, 1, 14); octx.fillRect(250, 112, 1, 14);
    drawText(octx, 'GO', 226, 116, P['R']); drawArrow(242, 116);
  }
  // boss entrance banner
  if (bannerT > 0) {
    bannerT--;
    octx.fillStyle = P['0']; octx.fillRect(0, 104, W, 20);
    octx.fillStyle = P['R']; octx.fillRect(0, 104, W, 1); octx.fillRect(0, 123, W, 1);
    drawText(octx, bannerText, (W - textWidth(bannerText)) / 2, 111, (tick & 8) ? P['W'] : P['Y']);
  }
}
function drawArrow(x, y) {
  octx.fillStyle = P['R'];
  for (let i = 0; i < 4; i++) octx.fillRect(x + i, y + i, 1, 7 - 2 * i);
}
function drawBar(x, y, w, pct, col, bg) {
  octx.fillStyle = P['0']; octx.fillRect(x - 1, y - 1, w + 2, 6);
  octx.fillStyle = bg; octx.fillRect(x, y, w, 4);
  octx.fillStyle = col; octx.fillRect(x, y, Math.max(0, Math.round(w * pct)), 4);
}

// ---------- dialog ----------
function drawPortrait(rows, x, y, s = 1) {
  for (let j = 0; j < 24; j++) {
    const r = rows[j];
    for (let i = 0; i < 24; i++) {
      const ch = r[i];
      if (ch !== '.') { octx.fillStyle = P[ch]; octx.fillRect(x + i * s, y + j * s, s, s); }
    }
  }
}
// intro/ending cutscenes have no level layers: paint a night skyline instead of void
function drawCutsceneBackdrop() {
  octx.fillStyle = P['b']; octx.fillRect(0, 0, W, 150);
  octx.fillStyle = P['0']; octx.fillRect(0, 150, W, H - 150);
  octx.fillStyle = P['C'];
  for (let i = 0; i < 14; i++) octx.fillRect((i * 43) % 250 + 3, (i * 29) % 80 + 8, 1, 1);
  octx.fillStyle = P['x']; // moon
  octx.fillRect(194, 26, 16, 8); octx.fillRect(196, 24, 12, 12); octx.fillRect(198, 22, 8, 16);
  drawSkyline(150);
}
function startDialog(lines, next) {
  if (QUICK) { dialog = null; next(); return; }
  state = 'cutscene';
  dialog = { lines: lines || [], i: 0, chars: 0, next };
  if (!dialog.lines.length) { dialog = null; next(); }
}
function updateDialog() {
  const cur = dialog.lines[dialog.i];
  if (dialog.chars < cur.text.length) {
    dialog.chars += 0.5;
    if ((tick & 3) === 0) Audio.sfx('dialog');
  }
  if (pressed.KeyZ || pressed.Enter || pressed.Space || pressed.KeyJ) {
    if (dialog.chars < cur.text.length) dialog.chars = cur.text.length;
    else {
      dialog.i++;
      dialog.chars = 0;
      Audio.sfx('select');
      if (dialog.i >= dialog.lines.length) { const n = dialog.next; dialog = null; n(); return; }
    }
  }
  // draw box
  const cur2 = dialog.lines[Math.min(dialog.i, dialog.lines.length - 1)];
  if (!layers.length) drawCutsceneBackdrop();
  octx.fillStyle = P['0']; octx.fillRect(12, 164, W - 24, 64);
  octx.fillStyle = P['W'];
  octx.fillRect(14, 166, W - 28, 1); octx.fillRect(14, 225, W - 28, 1);
  octx.fillRect(14, 166, 1, 60); octx.fillRect(W - 15, 166, 1, 60);
  const port = PORTRAITS[cur2.speaker];
  let tx = 22;
  if (port) { // speaker portrait in a gold frame, text shifted right
    octx.fillStyle = P['Y']; octx.fillRect(17, 170, 28, 28);
    octx.fillStyle = P['D']; octx.fillRect(19, 172, 24, 24);
    drawPortrait(port, 19, 172);
    tx = 52;
  }
  drawText(octx, cur2.speaker + ':', tx, 172, P['Y']);
  drawText(octx, cur2.text.slice(0, Math.floor(dialog.chars)), tx, 184, P['W']);
  if (dialog.chars >= cur2.text.length && (tick & 16)) drawText(octx, '-', W - 30, 218, P['Y']);
}

// ---------- stages / flow ----------
function buildLevel() {
  for (const l of layers) l.dispose();
  layers = level().layers.map(ld => new BgLayer(ld, P));
}
function startStage() {
  const lv = level();
  camX = 0; camLock = -1;
  for (const e of entities) e.sprite.dispose();
  entities = []; effects.forEach(f => f.spr && f.spr.dispose()); effects = [];
  projectiles.forEach(p => p.spr.dispose()); projectiles = []; popups = [];
  waves = WAVES[lv.id].map(w => ({ ...w, spawn: [...w.spawn] }));
  buildLevel();
  if (player) player.sprite.dispose();
  player = makeFighter(HEROES[heroKey], { hp: 60 }, 40, lv.floorTop + 30, true);
  player.hp = player.maxhp = 60;
  player.invuln = 60;
  lastHurtEnemy = null; bannerT = 0;
  Audio.stopSong();
  startDialog(STORY.preLevel[lv.id], () => {
    state = 'stagecard'; stageTimer = QUICK ? 20 : 110;
  });
}
function startEnding() {
  state = 'cutscene';
  Audio.playSong('victory');
  startDialog(STORY.ending, () => { state = 'ending'; endTimer = 0; });
}
function died() {
  lives--;
  if (lives <= 0) {
    Audio.playSong('gameover');
    startDialog(STORY.gameover, () => { state = 'gameover'; continueTimer = 60 * 10; });
  } else {
    player.hp = player.maxhp; player.invuln = 120; setState(player, 'idle'); player.dying = 0;
  }
}

// ---------- title & select ----------
// dense city skyline with lit windows; buildings rise from baseY
function drawSkyline(baseY) {
  for (let i = 0; i < 16; i++) {
    const bx = i * 16, bw = 12 + (i * 7) % 12, bh = 22 + (i * 13) % 38;
    octx.fillStyle = (i % 3) ? P['1'] : P['D'];
    octx.fillRect(bx, baseY - bh, bw, bh);
    for (let wy = baseY - bh + 3; wy < baseY - 4; wy += 5)
      for (let wx = bx + 2; wx < bx + bw - 2; wx += 4)
        if ((wx * 7 + wy * 13 + i) % 5 === 0) {
          octx.fillStyle = ((wx + wy) % 3) ? P['Y'] : P['o'];
          octx.fillRect(wx, wy, 2, 2);
        }
  }
  octx.fillStyle = P['1']; octx.fillRect(0, baseY, W, 2);
}
// blinking neon sign block
function drawNeon(x, y, w, h, on, edge, fill) {
  octx.fillStyle = P['0']; octx.fillRect(x - 1, y - 1, w + 2, h + 2);
  octx.fillStyle = P[on ? edge : 'D'];
  octx.fillRect(x, y, w, 1); octx.fillRect(x, y + h - 1, w, 1);
  octx.fillRect(x, y, 1, h); octx.fillRect(x + w - 1, y, 1, h);
  octx.fillStyle = P[on ? fill : '1'];
  for (let j = y + 3; j < y + h - 3; j += 4) octx.fillRect(x + 2, j, w - 4, 2);
}
// red/gold tiered pagoda roof + columns framing the screen
function drawPagoda() {
  for (let t = 0; t < 5; t++) {
    const hw = 36 + t * 22, y = 4 + t * 4;
    octx.fillStyle = P['r']; octx.fillRect(128 - hw, y, hw * 2, 4);
    octx.fillStyle = P['R']; octx.fillRect(128 - hw, y, hw * 2, 1);
  }
  octx.fillStyle = P['Y']; octx.fillRect(4, 24, 248, 1);           // gold eave
  octx.fillStyle = P['R'];                                         // upturned tips
  octx.fillRect(0, 14, 4, 10); octx.fillRect(252, 14, 4, 10);
  octx.fillStyle = P['Y'];
  octx.fillRect(0, 12, 3, 2); octx.fillRect(253, 12, 3, 2);
  octx.fillRect(126, 0, 4, 4);                                     // finial
  octx.fillStyle = P['r']; octx.fillRect(4, 25, 8, 159); octx.fillRect(244, 25, 8, 159); // columns
  octx.fillStyle = P['R']; octx.fillRect(6, 25, 2, 159); octx.fillRect(246, 25, 2, 159);
  octx.fillStyle = P['Y']; octx.fillRect(2, 184, 12, 4); octx.fillRect(242, 184, 12, 4); // bases
  octx.fillStyle = P['y']; octx.fillRect(2, 188, 12, 4); octx.fillRect(242, 188, 12, 4);
}
// the Pork Chop Express rolling right; y = ground line, wheels animate with tick
function drawTruck(x, y) {
  octx.fillStyle = P['G']; octx.fillRect(x + 42, y - 27, 2, 7);    // exhaust stack
  if (tick & 8) { octx.fillStyle = P['G']; octx.fillRect(x + 41 - (tick % 8), y - 31, 2, 2); }
  octx.fillStyle = P['0']; octx.fillRect(x - 1, y - 25, 42, 18);   // trailer
  octx.fillStyle = P['g']; octx.fillRect(x, y - 24, 40, 16);
  octx.fillStyle = P['E']; octx.fillRect(x, y - 24, 40, 3);
  octx.fillStyle = P['e']; octx.fillRect(x + 3, y - 18, 34, 2);    // stripe
  octx.fillStyle = P['0']; octx.fillRect(x + 40, y - 21, 17, 14);  // cab
  octx.fillStyle = P['E']; octx.fillRect(x + 41, y - 20, 15, 13);
  octx.fillStyle = P['g']; octx.fillRect(x + 41, y - 10, 15, 3);
  octx.fillStyle = P['c']; octx.fillRect(x + 49, y - 18, 6, 5);    // windshield
  octx.fillStyle = P['L']; octx.fillRect(x + 55, y - 12, 2, 6);    // grille
  octx.fillStyle = P['Y']; octx.fillRect(x + 55, y - 8, 2, 2);     // headlight
  const ph = (tick >> 2) & 3;                                      // rolling wheel hubs
  const hx = [1, 2, 1, 0][ph], hy = [0, 1, 2, 1][ph];
  for (const wx of [x + 4, x + 14, x + 44]) {
    octx.fillStyle = P['0']; octx.fillRect(wx, y - 8, 8, 8);
    octx.fillStyle = P['D']; octx.fillRect(wx + 1, y - 7, 6, 6);
    octx.fillStyle = P['L']; octx.fillRect(wx + 2 + hx, y - 6 + hy, 2, 2);
  }
}
// chunky slab logotype glyphs, 5x7 (rows are 5-bit ints, MSB = left), scaled 3x by drawLogo
const LOGO = {
  'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x1B],
  'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
  'C': [0x0F, 0x18, 0x10, 0x10, 0x10, 0x18, 0x0F],
  'E': [0x1F, 0x18, 0x10, 0x1E, 0x10, 0x18, 0x1F],
  'G': [0x0F, 0x18, 0x10, 0x17, 0x11, 0x19, 0x0F],
  'H': [0x1B, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x1B],
  'I': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x1F],
  'L': [0x18, 0x10, 0x10, 0x10, 0x10, 0x11, 0x1F],
  'N': [0x1B, 0x19, 0x1D, 0x15, 0x17, 0x13, 0x1B],
  'O': [0x0E, 0x1B, 0x11, 0x11, 0x11, 0x1B, 0x0E],
  'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x1B],
  'T': [0x1F, 0x15, 0x04, 0x04, 0x04, 0x04, 0x0E],
  'U': [0x1B, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
};
// block letters: s px stroke, 1px darker dropshadow, beveled highlight row on top edges
function drawLogo(text, x, y, s, col, hi, sh) {
  let cx = x;
  for (const ch of text) {
    const g = LOGO[ch];
    if (!g) { cx += 6 * s; continue; }
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (0x10 >> c)) {
      octx.fillStyle = P[sh]; octx.fillRect(cx + c * s + 1, y + r * s + 1, s, s);
    }
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (0x10 >> c)) {
      octx.fillStyle = P[col]; octx.fillRect(cx + c * s, y + r * s, s, s);
      if (r === 0 || !(g[r - 1] & (0x10 >> c))) { octx.fillStyle = P[hi]; octx.fillRect(cx + c * s, y + r * s, s, 1); }
    }
    cx += 6 * s;
  }
}
function logoWidth(text, s) { return text.length * 6 * s - s; }
// gold S-curve serpent flourish, ~40x14, head at right
function drawDragon(x, y) {
  for (let i = 0; i < 33; i++) {
    const cy = 7 - Math.round(Math.sin((i * Math.PI * 2) / 33) * 4);
    octx.fillStyle = P['y']; octx.fillRect(x + i, y + cy - 1, 1, 3);
    octx.fillStyle = P['Y']; octx.fillRect(x + i, y + cy - 1, 1, 2);
    if (i % 5 === 2) { octx.fillStyle = P['x']; octx.fillRect(x + i, y + cy - 2, 1, 1); } // dorsal spikes
  }
  octx.fillStyle = P['Y']; octx.fillRect(x + 33, y + 4, 5, 4);    // head
  octx.fillStyle = P['x']; octx.fillRect(x + 33, y + 4, 5, 1);
  octx.fillStyle = P['0']; octx.fillRect(x + 36, y + 5, 1, 1);    // eye
  octx.fillStyle = P['Y']; octx.fillRect(x + 34, y + 2, 1, 2); octx.fillRect(x + 37, y + 2, 1, 2); // horns
  octx.fillStyle = P['R']; octx.fillRect(x + 38, y + 6, 2, 1);    // tongue
  octx.fillStyle = P['y']; octx.fillRect(x - 2, y + 7, 2, 1);     // tail tip
}
// parked car silhouette, x = left, y = ground line, ~34x12
function drawParkedCar(x, y) {
  octx.fillStyle = P['0']; octx.fillRect(x, y - 9, 34, 7);
  octx.fillStyle = P['D']; octx.fillRect(x + 1, y - 8, 32, 5);
  octx.fillRect(x + 8, y - 12, 17, 4);                             // cabin
  octx.fillStyle = P['1']; octx.fillRect(x + 10, y - 11, 5, 3); octx.fillRect(x + 18, y - 11, 5, 3); // windows
  octx.fillStyle = P['G']; octx.fillRect(x + 8, y - 12, 17, 1);    // roof glint
  octx.fillStyle = P['0']; octx.fillRect(x + 5, y - 3, 6, 3); octx.fillRect(x + 23, y - 3, 6, 3); // wheels
  octx.fillStyle = P['G']; octx.fillRect(x + 7, y - 3, 2, 1); octx.fillRect(x + 25, y - 3, 2, 1); // hubcaps
}
function drawTitle() {
  octx.fillStyle = P['b']; octx.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 18; i++) if (((tick >> 4) + i) % 5) { octx.fillStyle = P['C']; octx.fillRect((i * 41) % 250 + 2, (i * 17) % 90 + 4, 1, 1); }
  drawSkyline(150);
  // neon signs on the skyline
  drawNeon(24, 104, 14, 44, ((tick >> 5) & 1) === 0, 'M', 'm');
  drawNeon(218, 112, 14, 36, ((tick >> 5) & 1) === 1, 'c', 'b');
  // lightning flash
  if (titleFlash > 0) {
    octx.fillStyle = P['W'];
    let lx = 40 + (titleFlash * 31) % 170;
    for (let y = 8; y < 70; y += 3) { octx.fillRect(lx, y, 2, 3); lx += (y % 2 ? 2 : -3); }
    titleFlash--;
  } else if (Math.random() < 0.006) { titleFlash = 12; Audio.sfx('thunder'); }
  // street at the bottom: sidewalk band, asphalt, lane dashes
  octx.fillStyle = P['1']; octx.fillRect(0, 152, W, 40);
  // fence line along the back of the sidewalk
  octx.fillStyle = P['D'];
  octx.fillRect(0, 155, W, 1); octx.fillRect(0, 165, W, 1);
  for (let x = 1; x < W; x += 7) octx.fillRect(x, 156, 2, 10);
  // parked car silhouettes
  drawParkedCar(14, 191); drawParkedCar(60, 191); drawParkedCar(200, 191);
  // manhole with rising steam wisps (2-frame)
  octx.fillStyle = P['D']; octx.fillRect(168, 188, 12, 3);
  octx.fillStyle = P['0']; octx.fillRect(170, 189, 2, 1); octx.fillRect(174, 189, 2, 1);
  octx.fillStyle = P['G'];
  if ((tick >> 4) & 1) {
    octx.fillRect(172, 182, 2, 4); octx.fillRect(175, 176, 2, 4); octx.fillRect(171, 170, 2, 4);
  } else {
    octx.fillRect(174, 181, 2, 4); octx.fillRect(171, 175, 2, 4); octx.fillRect(175, 169, 2, 4);
  }
  octx.fillStyle = P['G']; octx.fillRect(0, 192, W, 2);
  octx.fillStyle = P['D']; octx.fillRect(0, 194, W, 38);
  octx.fillStyle = P['Y'];
  for (let x = 4; x < W; x += 24) octx.fillRect(x, 212, 10, 2);
  octx.fillStyle = P['1']; octx.fillRect(0, 232, W, 8);
  // the Pork Chop Express rolls across
  drawTruck(((tick >> 0) % (W + 160)) - 110, 230);
  // pagoda frame over everything
  drawPagoda();
  // hand-built slab logotype with gold dragon flourish
  const t1 = 'BIG TROUBLE', t3 = 'LITTLE CHINA';
  drawLogo(t1, Math.floor((W - logoWidth(t1, 3)) / 2), 34, 3, 'R', 'O', 'm');
  drawText(octx, 'IN', (W - textWidth('IN')) / 2, 59, P['Y']);
  drawLogo(t3, Math.floor((W - logoWidth(t3, 3)) / 2), 69, 3, 'Y', 'x', 'y');
  drawDragon(108, 94);
  if ((tick % 48) < 32) drawText(octx, 'PRESS ENTER', (W - textWidth('PRESS ENTER')) / 2, 176, P['W']);
  drawText(octx, '1986 PORK CHOP EXPRESS', (W - textWidth('1986 PORK CHOP EXPRESS')) / 2, 233, P['G']);
  if (pressed.Enter || pressed.KeyZ || pressed.Space) { state = 'select'; Audio.sfx('select'); }
}

// red paper lantern, x,y = top-left, 8x16
function drawLantern(x, y) {
  octx.fillStyle = P['y']; octx.fillRect(x + 2, y, 4, 2);
  octx.fillStyle = P['0']; octx.fillRect(x, y + 2, 8, 10);
  octx.fillStyle = P['R']; octx.fillRect(x + 1, y + 3, 6, 8);
  octx.fillStyle = P['o']; octx.fillRect(x + 2, y + 4, 2, 6);
  octx.fillStyle = P['Y']; octx.fillRect(x + 3, y + 6, 2, 2);
  octx.fillStyle = P['y']; octx.fillRect(x + 2, y + 12, 4, 2);
  octx.fillStyle = P['Y']; octx.fillRect(x + 3, y + 14, 2, 2);
}
let selectSprites = null;
function drawSelect() {
  // dark red paneled hall with gold trim
  octx.fillStyle = P['m']; octx.fillRect(0, 0, W, H);
  octx.fillStyle = P['0'];
  octx.fillRect(0, 34, W, 2); octx.fillRect(0, 168, W, 2);
  octx.fillStyle = P['r'];
  for (let x = 14; x < W - 40; x += 48) octx.fillRect(x, 42, 36, 120);
  // gold trim border
  octx.fillStyle = P['Y'];
  octx.fillRect(3, 3, W - 6, 2); octx.fillRect(3, H - 5, W - 6, 2);
  octx.fillRect(3, 3, 2, H - 6); octx.fillRect(W - 5, 3, 2, H - 6);
  octx.fillStyle = P['y'];
  octx.fillRect(7, 7, W - 14, 1); octx.fillRect(7, H - 8, W - 14, 1);
  octx.fillRect(7, 7, 1, H - 14); octx.fillRect(W - 8, 7, 1, H - 14);
  drawLantern(30, 46); drawLantern(218, 46);
  drawText(octx, 'CHOOSE YOUR HERO', (W - textWidth('CHOOSE YOUR HERO', 1)) / 2 + 1, 21, P['0']);
  drawText(octx, 'CHOOSE YOUR HERO', (W - textWidth('CHOOSE YOUR HERO', 1)) / 2, 20, P['Y']);
  if (!selectSprites) {
    selectSprites = [new Sprite(), new Sprite()];
  }
  const opts = ['jack', 'wang'];
  for (let i = 0; i < 2; i++) {
    const hd = HEROES[opts[i]];
    const x = 88 + i * 84;
    // gold-framed portrait bust plaque on the alcove back wall, above the hero
    octx.fillStyle = P['y']; octx.fillRect(x - 27, 33, 54, 54);
    octx.fillStyle = P['Y']; octx.fillRect(x - 26, 34, 52, 52);
    octx.fillStyle = P['0']; octx.fillRect(x - 24, 36, 48, 48);
    if (PORTRAITS[hd.name]) drawPortrait(PORTRAITS[hd.name], x - 24, 36, 2);
    // dark alcove with spotlight wedge behind the hero (sprites render in front at z 9.5)
    octx.fillStyle = P['0']; octx.fillRect(x - 20, 86, 40, 56);
    octx.fillStyle = P['D'];
    for (let j = 0; j < 52; j++) { const hw = 3 + ((j * 14 / 52) | 0); octx.fillRect(x - hw, 88 + j, hw * 2, 1); }
    // platform under the hero (feet at y=140)
    octx.fillStyle = P['0']; octx.fillRect(x - 24, 139, 48, 10);
    octx.fillStyle = P['L']; octx.fillRect(x - 23, 140, 46, 2);
    octx.fillStyle = P['G']; octx.fillRect(x - 23, 142, 46, 3);
    octx.fillStyle = P['D']; octx.fillRect(x - 23, 145, 46, 3);
    selectSprites[i].setFrame(hd.frames.idle[(tick >> 5) & 1]);
    selectSprites[i].place(x, 140, false, 9.5); // in front of the overlay fill
    drawText(octx, hd.name, x - textWidth(hd.name) / 2, 156, selIdx === i ? P['R'] : P['G']);
    if (selIdx === i) { // big gold selection frame with red corner ticks (encloses the bust too)
      octx.fillStyle = P['Y'];
      octx.fillRect(x - 31, 29, 62, 2); octx.fillRect(x - 31, 150, 62, 2);
      octx.fillRect(x - 31, 29, 2, 123); octx.fillRect(x + 29, 29, 2, 123);
      octx.fillStyle = P['R'];
      octx.fillRect(x - 31, 29, 6, 2); octx.fillRect(x + 25, 29, 6, 2);
      octx.fillRect(x - 31, 150, 6, 2); octx.fillRect(x + 25, 150, 6, 2);
    }
  }
  // boxed hero descriptions
  octx.fillStyle = P['0']; octx.fillRect(28, 178, 200, 34);
  octx.fillStyle = P['Y'];
  octx.fillRect(28, 178, 200, 1); octx.fillRect(28, 211, 200, 1);
  octx.fillRect(28, 178, 1, 34); octx.fillRect(227, 178, 1, 34);
  drawText(octx, 'JACK  ALL BRAWN AND MOUTH', 40, 186, selIdx === 0 ? P['W'] : P['G']);
  drawText(octx, 'WANG  MASTER OF KUNG FU', 40, 198, selIdx === 1 ? P['W'] : P['G']);
  if (pressed.ArrowLeft || pressed.ArrowRight || pressed.KeyA || pressed.KeyD) { selIdx = 1 - selIdx; Audio.sfx('select'); }
  if (pressed.Enter || pressed.KeyZ || pressed.Space) {
    heroKey = ['jack', 'wang'][selIdx];
    selectSprites.forEach(s => s.dispose()); selectSprites = null;
    Audio.sfx('pickup');
    state = 'splash'; splashT = 0;
  }
}

// ---------- debug/QA boot params: ?stage=1..4&hero=wang&x=1200&wave=4&quick ----------
const q = new URLSearchParams(location.search);
const QUICK = q.has('quick');
if (q.has('stage')) {
  heroKey = q.get('hero') === 'wang' ? 'wang' : 'jack';
  levelIdx = Math.max(0, Math.min(LEVELS.length - 1, (q.get('stage') | 0) - 1));
  startStage();
  if (q.has('wave')) waves = waves.slice(q.get('wave') | 0);
  if (q.has('x')) {
    player.x = q.get('x') | 0;
    camX = Math.max(0, Math.min(player.x - 108, level().lengthPx - W));
  }
  // QA handle, only exists with debug boot params
  window.__dbg = { get entities() { return entities; }, get projectiles() { return projectiles; }, get player() { return player; }, get popups() { return popups; } };
  window.__step = n => { for (let i = 0; i < (n | 0); i++) loopOnce(); }; // headless frame-stepper for QA

}

// ---------- presentation dressing ----------
// street level rain: ~40 diagonal streaks + floor splashes, positions derived from tick (no allocs)
function drawRain(ctx) {
  const lv = level();
  for (let i = 0; i < 40; i++) {
    const sp = 4 + (i % 3);
    const y = ((i * 61 + 7) + tick * sp) % 252 - 6;
    const x = (((i * 89 + 31) - (y >> 1)) % W + W) % W;
    ctx.fillStyle = (i & 7) === 0 ? P['C'] : P['c'];
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillRect(x, y + 1, 1, 2);
  }
  ctx.fillStyle = P['C'];
  for (let i = 0; i < 8; i++) {
    const t = (tick + i * 9) % 26;
    if (t < 5) {
      const cyc = ((tick + i * 9) / 26) | 0;
      const sx = (i * 67 + cyc * 41) % W;
      const sy = lv.floorTop + (i * 37 + cyc * 17) % (lv.floorBottom - lv.floorTop);
      const s = t >> 1;
      ctx.fillRect(sx - s, sy, 1, 1); ctx.fillRect(sx + s, sy, 1, 1);
    }
  }
}
// thin gold border frame with corner blocks, for full-screen text cards
function drawGoldFrame() {
  octx.fillStyle = P['Y'];
  octx.fillRect(8, 8, W - 16, 1); octx.fillRect(8, H - 9, W - 16, 1);
  octx.fillRect(8, 8, 1, H - 16); octx.fillRect(W - 9, 8, 1, H - 16);
  octx.fillStyle = P['y'];
  octx.fillRect(6, 6, 5, 5); octx.fillRect(W - 11, 6, 5, 5);
  octx.fillRect(6, H - 11, 5, 5); octx.fillRect(W - 11, H - 11, 5, 5);
  octx.fillStyle = P['Y'];
  octx.fillRect(7, 7, 3, 3); octx.fillRect(W - 10, 7, 3, 3);
  octx.fillRect(7, H - 10, 3, 3); octx.fillRect(W - 10, H - 10, 3, 3);
}
// Pork Chop Express grille motif, x,y = top-left, 20x15
function drawGrille(x, y) {
  octx.fillStyle = P['0']; octx.fillRect(x - 1, y - 1, 22, 16);
  octx.fillStyle = P['E']; octx.fillRect(x, y, 20, 3);
  octx.fillStyle = P['L'];
  for (let j = 0; j < 4; j++) octx.fillRect(x + 2, y + 4 + j * 2, 16, 1);
  octx.fillStyle = P['Y']; octx.fillRect(x, y + 10, 3, 3); octx.fillRect(x + 17, y + 10, 3, 3);
  octx.fillStyle = P['G']; octx.fillRect(x + 4, y + 12, 12, 2);
}

// ---------- main loop ----------
function loop() {
  requestAnimationFrame(loop);
  loopOnce();
}
function loopOnce() {
  tick++;
  octx.clearRect(0, 0, W, H);

  if (!audioStarted && (pressed.Enter || pressed.KeyZ || pressed.Space)) {
    audioStarted = true; Audio.init(); Audio.playSong('title');
  }

  if (state === 'title') drawTitle();
  else if (state === 'select') drawSelect();
  else if (state === 'splash') {
    drawSplash(octx, P, tick);
    splashT++;
    if (splashT > (QUICK ? 1 : 240) || pressed.Enter || pressed.KeyZ) {
      startDialog(STORY.intro, () => { levelIdx = 0; score = 0; lives = 3; startStage(); });
    }
  }
  else if (state === 'cutscene') {
    if (layers.length) { for (let i = 0; i < layers.length; i++) layers[i].update(camX, -5 + i); }
    else { octx.fillStyle = P['0']; octx.fillRect(0, 0, W, H); }
    if (dialog) updateDialog();
  }
  else if (state === 'stagecard') {
    octx.fillStyle = P['0']; octx.fillRect(0, 0, W, H);
    drawGoldFrame();
    drawLantern(60, 96); drawLantern(188, 96);
    const lv = level();
    drawText(octx, 'STAGE ' + (levelIdx + 1), (W - textWidth('STAGE 1')) / 2, 100, P['R']);
    drawText(octx, lv.name, (W - textWidth(lv.name)) / 2, 116, P['W']);
    stageTimer--;
    if (stageTimer <= 0) { state = 'play'; Audio.playSong(lv.song); }
  }
  else if (state === 'play') {
    if (hitpause > 0) { hitpause--; }
    else {
      updatePlayer(player);
      for (const e of entities) if (!e.dead) updateEnemy(e);
      // player death handling
      if (player.hp <= 0 && player.state === 'knockdown' && player.kdT > 0 && !player.dying) { player.dying = 1; }
      if (player.dying) { player.dying++; if (player.dying > 80) died(); }
      // effects
      for (const fx of effects) { fx.t++; if (fx.t > 4) { fx.f++; fx.t = 0; } }
      effects = effects.filter(fx => { const alive = fx.f < 2; if (!alive && fx.spr) fx.spr.dispose(); return alive; });
      for (const pu of popups) pu.t++;
      popups = popups.filter(pu => pu.t < 40);
      for (const pr of projectiles) {
        pr.x += pr.vx; pr.t++; if (pr.t > 6) { pr.f++; pr.t = 0; }
        if (!player.dying && player.invuln <= 0 && Math.abs(pr.y - player.y) < (pr.depth || 12) && Math.abs(pr.x - player.x) < 8 && player.air < (pr.airMax || 20)) {
          hitFighter(player, { x: pr.x - pr.vx, state: 'punch' }, pr.dmg || 12, true); pr.done = true;
        }
        if (pr.x < camX - 20 || pr.x > camX + W + 20) pr.done = true;
      }
      projectiles = projectiles.filter(pr => { if (pr.done) pr.spr.dispose(); return !pr.done; });
      // enemy death countdown lives in updateEnemy (dying-- there); no second counter here
      updateWaves();
    }
    drawWorld();
    if (level().id === 'street') drawRain(octx);
    drawHUD();
    // floating score popups: rise 12px over 40 ticks, gold then fading
    for (const pu of popups) {
      const col = pu.t < 26 ? P['Y'] : P['y'];
      const px = Math.round(pu.x - camX - textWidth(pu.txt) / 2);
      const py = Math.round(pu.y - (pu.t * 12) / 40);
      drawText(octx, pu.txt, px, py, col);
      // the bitmap font has no '+': draw it by hand in the leading cell
      octx.fillStyle = col;
      octx.fillRect(px, py + 3, 5, 1); octx.fillRect(px + 2, py + 1, 1, 5);
    }
    if (pressed.Enter) { state = 'pause'; }
  }
  else if (state === 'pause') {
    drawWorld(); drawHUD();
    drawText(octx, 'PAUSE', (W - textWidth('PAUSE')) / 2, 120, (tick & 16) ? P['W'] : P['R']);
    if (pressed.Enter) state = 'play';
  }
  else if (state === 'gameover') {
    octx.fillStyle = P['0']; octx.fillRect(0, 0, W, H);
    drawGoldFrame();
    drawGrille(118, 166);
    drawText(octx, 'GAME OVER', (W - textWidth('GAME OVER', 2)) / 2, 90, P['R'], 2);
    const secs = Math.ceil(continueTimer / 60);
    drawText(octx, 'CONTINUE? ' + secs, (W - textWidth('CONTINUE? 9')) / 2, 130, P['W']);
    drawText(octx, 'PRESS ENTER', (W - textWidth('PRESS ENTER')) / 2, 146, (tick & 16) ? P['Y'] : P['y']);
    continueTimer--;
    if (pressed.Enter || pressed.KeyZ) { lives = 3; startStage(); }
    else if (continueTimer <= 0) { state = 'title'; Audio.playSong('title'); }
  }
  else if (state === 'ending') {
    octx.fillStyle = P['0']; octx.fillRect(0, 0, W, H);
    drawGoldFrame();
    drawLantern(56, 78); drawLantern(192, 78);
    drawGrille(118, 166);
    endTimer++;
    drawText(octx, 'THE END', (W - textWidth('THE END', 2)) / 2, 80, P['Y'], 2);
    drawText(octx, 'JACK BURTON WILL RETURN', (W - textWidth('JACK BURTON WILL RETURN')) / 2, 120, P['W']);
    drawText(octx, 'FINAL SCORE ' + score, (W - textWidth('FINAL SCORE ' + score)) / 2, 140, P['L']);
    if (endTimer > 240 && (pressed.Enter || pressed.KeyZ)) { state = 'title'; Audio.playSong('title'); }
  }

  // screen shake
  if (shake > 0) { shake--; camera.position.x = (Math.random() * 4 - 2) | 0; camera.position.y = (Math.random() * 2 - 1) | 0; }
  else { camera.position.x = 0; camera.position.y = 0; }

  flushOverlay();
  render();
  for (const k in pressed) pressed[k] = false;
}
loop();
