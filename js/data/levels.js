// BIG TROUBLE IN LITTLE CHINA — level backgrounds.
// Each layer's draw() paints ONCE into an offscreen canvas (w x h) using only
// integer fillRects and PALETTE colors (passed as P). Layers back→front; the
// main (speed 1.0) layer leaves sky/alley gaps transparent so parallax shows.
// Main layers rotate 3-4 distinct modules by segment index (deterministic).

const px = (c, P, k, x, y, w = 1, h = 1) => {
  c.fillStyle = P[k];
  c.fillRect(x | 0, y | 0, w | 0, h | 0);
};

// deterministic pseudo-random so backgrounds are stable
const lcg = (seed) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

// ---- shared motifs ----------------------------------------------------------

// blocky 3x5 letters (only what the signs need)
const FONT = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  L: ['100', '100', '100', '100', '111'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '101', '110', '101', '101'],
  N: ['101', '111', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  W: ['101', '101', '101', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
};
function text(c, P, k, str, x, y, s) {
  for (let i = 0; i < str.length; i++) {
    const g = FONT[str[i]];
    if (!g) continue;
    for (let r = 0; r < 5; r++)
      for (let q = 0; q < 3; q++)
        if (g[r][q] === '1') px(c, P, k, x + i * 4 * s + q * s, y + r * s, s, s);
  }
}

// pseudo-hanzi glyph blocks, 6x6, for sign lettering
const GLYPHS = [
  [[0, 0, 6, 1], [2, 1, 1, 4], [0, 5, 6, 1]],
  [[0, 0, 1, 6], [2, 0, 4, 1], [2, 3, 3, 1], [2, 5, 4, 1]],
  [[0, 0, 6, 1], [0, 2, 6, 1], [1, 3, 1, 3], [4, 3, 1, 3]],
  [[2, 0, 1, 2], [0, 2, 6, 1], [0, 4, 2, 2], [4, 4, 2, 2]],
  [[0, 0, 2, 2], [4, 0, 2, 2], [0, 3, 6, 1], [2, 4, 1, 2]],
];
function glyph(c, P, k, x, y, i) {
  for (const [gx, gy, gw, gh] of GLYPHS[((i % 5) + 5) % 5])
    px(c, P, k, x + gx, y + gy, gw, gh);
}

function lantern(c, P, x, y) {
  px(c, P, 'y', x + 1, y, 2, 1);      // cap
  px(c, P, 'R', x, y + 1, 4, 4);      // paper body
  px(c, P, 'r', x, y + 4, 4, 1);      // shade
  px(c, P, 'Y', x + 1, y + 2, 1, 1);  // glow dot
  px(c, P, 'r', x + 1, y + 5, 1, 2);  // tassel
}

function neon(c, P, x, y, k, n) {     // vertical sign, n glowing glyph cells
  px(c, P, '0', x - 1, y - 1, 10, n * 8 + 3);
  px(c, P, '1', x, y, 8, n * 8 + 1);
  for (let i = 0; i < n; i++) glyph(c, P, k, x + 1, y + 1 + i * 8, i + (x >> 3));
  px(c, P, 'W', x + 2, y + 2, 1, 1);  // glint
}

function win(c, P, x, y, k) {         // tenement window, k = pane color
  px(c, P, '0', x, y, 8, 10);
  px(c, P, k, x + 1, y + 1, 6, 8);
  px(c, P, '0', x + 3, y + 1, 1, 8);
  px(c, P, '0', x + 1, y + 4, 6, 1);
}

function crate(c, P, x, y, s) {       // wooden crate, side s
  px(c, P, 'n', x, y, s, s);
  px(c, P, 'N', x + 1, y + 1, s - 2, s - 2);
  px(c, P, 'y', x + 1, y + 1, s - 2, 1);            // top catch-light
  px(c, P, 'n', x + 1, y + ((s / 3) | 0), s - 2, 1); // plank lines
  px(c, P, 'n', x + 1, y + ((2 * s / 3) | 0), s - 2, 1);
  px(c, P, 'q', x + ((s / 2) | 0), y + 1, 1, s - 2); // vertical seam
}

function chain(c, P, x, y0, y1) {     // hanging chain with hook
  for (let y = y0; y < y1; y += 4) px(c, P, ((y - y0) / 4) % 2 ? 'L' : 'G', x, y, 2, 3);
  px(c, P, 'G', x - 2, y1, 6, 2);
  px(c, P, 'G', x - 2, y1 + 2, 2, 3);
  px(c, P, 'L', x + 3, y1 + 2, 1, 2);
}

function flame3(c, P, x, y) {         // literal 3-pixel torch flame
  px(c, P, 'Y', x, y, 1, 1);
  px(c, P, 'o', x, y + 1, 1, 1);
  px(c, P, 'R', x, y + 2, 1, 1);
}

function torch(c, P, x, y) {          // wall torch (main layers)
  px(c, P, 'D', x, y + 4, 2, 6);
  px(c, P, 'n', x - 1, y + 3, 4, 2);
  px(c, P, 'R', x - 1, y + 1, 4, 3);
  px(c, P, 'o', x, y - 1, 2, 3);
  px(c, P, 'Y', x, y - 2, 1, 2);
}

function torchGlow(c, P, x, y) {      // stepped light pool behind a torch at (x,y)
  px(c, P, 'o', x - 8, y - 6, 20, 14);
  px(c, P, 'o', x - 5, y - 10, 14, 22);
  px(c, P, 'Y', x - 3, y - 4, 10, 9);
  px(c, P, 'Y', x - 1, y - 7, 6, 15);
}

function pool(c, P, x, y, w) {        // coherent eerie glow puddle
  px(c, P, 'g', x + 2, y - 1, w - 4, 1);
  px(c, P, 'g', x, y, w, 5);
  px(c, P, 'g', x + 2, y + 5, w - 4, 1);
  px(c, P, 'E', x + 3, y + 1, w - 6, 3);
  px(c, P, 'e', x + 5, y + 1, w - 10, 1);          // surface highlight
  px(c, P, 'e', x + ((w / 2) | 0) - 1, y - 2, 2, 1); // bubble glint
}

function bones(c, P, x, y) {          // bone pile; skull is outlined + shaded so it
  px(c, P, 'G', x, y + 3, 12, 2);     // never reads as a bare white square
  px(c, P, 'L', x + 2, y + 2, 7, 2);
  px(c, P, 'L', x + 1, y, 1, 3);      // rib stubs
  px(c, P, 'L', x + 4, y - 1, 1, 4);
  px(c, P, 'G', x + 6, y, 1, 3);
  px(c, P, '0', x + 8, y - 1, 7, 6);  // skull outline
  px(c, P, 'L', x + 9, y, 5, 3);      // cranium
  px(c, P, 'W', x + 9, y, 2, 2);      // small catch-light only
  px(c, P, '0', x + 12, y + 1, 1, 1); // eye socket
  px(c, P, 'G', x + 9, y + 3, 5, 1);  // jaw in shadow
}

function cage(c, P, x, y) {           // hanging cage silhouette (far layers)
  px(c, P, '1', x + 5, y - 6, 1, 6);
  px(c, P, 'D', x, y, 11, 2);         // lit top bar so it reads against the dark
  px(c, P, '1', x, y + 1, 11, 1);
  for (let i = 0; i < 4; i++) px(c, P, '1', x + i * 3, y + 2, 1, 10);
  px(c, P, '0', x + 4, y + 5, 3, 5);  // sinner inside
  px(c, P, '1', x, y + 12, 11, 2);
  px(c, P, 'D', x, y + 12, 11, 1);
}

function buddha(c, P, x, y) {         // golden seated statue silhouette, base at y
  px(c, P, 'y', x + 21, y - 62, 6, 4);   // topknot
  px(c, P, 'y', x + 18, y - 58, 12, 12); // head
  px(c, P, 'Y', x + 18, y - 58, 2, 12);
  px(c, P, 'y', x + 12, y - 46, 24, 6);  // shoulders
  px(c, P, 'y', x + 10, y - 40, 28, 24); // torso
  px(c, P, 'Y', x + 10, y - 40, 2, 24);
  px(c, P, 'y', x + 4, y - 20, 10, 14);  // arms
  px(c, P, 'y', x + 34, y - 20, 10, 14);
  px(c, P, 'y', x, y - 8, 48, 8);        // folded lap
  px(c, P, 'Y', x, y - 8, 48, 1);
  px(c, P, '1', x + 20, y - 34, 8, 1);   // hands shadow
}

function banner(c, P, x, y, k1, k2) { // hanging silk banner
  px(c, P, k1, x, y, 12, 46);
  px(c, P, k2, x, y, 2, 46);
  px(c, P, k2, x, y + 42, 12, 4);
  px(c, P, 'y', x + 3, y + 8, 6, 6);   // gold emblem
  px(c, P, 'Y', x + 4, y + 9, 2, 2);
  px(c, P, k1, x + 2, y + 46, 8, 3);   // taper
  px(c, P, 'Y', x + 5, y + 49, 2, 3);  // tassel
}

function pillar(c, P, x) {            // grand red pillar with gold caps
  px(c, P, 'Y', x - 3, 50, 18, 5);
  px(c, P, 'y', x - 3, 55, 18, 2);
  px(c, P, 'R', x, 57, 12, 101);
  px(c, P, 'r', x + 9, 57, 3, 101);
  px(c, P, 'o', x + 2, 57, 1, 101);
  px(c, P, 'y', x - 2, 158, 16, 3);
  px(c, P, 'Y', x - 3, 161, 18, 5);
  px(c, P, 'y', x - 3, 166, 18, 2);
}

function candles(c, P, x, n) {        // wall-mounted candle shelf (kept above y<150
  px(c, P, 'D', x - 2, 143, n * 8 + 4, 4);       // so it never crosses sprite heads)
  px(c, P, '1', x - 2, 147, n * 8 + 4, 1);
  px(c, P, 'D', x + 2, 148, 2, 2);               // brackets
  px(c, P, 'D', x + n * 8 - 4, 148, 2, 2);
  for (let i = 0; i < n; i++) {
    const cx = x + i * 8;
    px(c, P, 'x', cx, 137, 2, 6);
    px(c, P, 'o', cx, 136, 1, 1);
    px(c, P, 'Y', cx, 134, 1, 2);
  }
}

function bigWheel(c, P, x, y) {       // 18px semi-truck wheel, top-left at (x,y)
  px(c, P, '0', x + 4, y, 10, 2);
  px(c, P, '0', x + 2, y + 2, 14, 2);
  px(c, P, '0', x, y + 4, 18, 10);
  px(c, P, '0', x + 2, y + 14, 14, 2);
  px(c, P, '0', x + 4, y + 16, 10, 2);
  px(c, P, 'D', x + 5, y + 5, 8, 8);  // rim
  px(c, P, 'G', x + 6, y + 6, 6, 6);  // hub
  px(c, P, 'L', x + 8, y + 8, 2, 2);  // hubcap glint
}

function truck(c, P, x) {             // the Pork Chop Express — big rig, ground at y=166,
  // ---- trailer ----                // cab roof 112px above the wheels (~2.6x character)
  px(c, P, '0', x, 52, 192, 100);
  px(c, P, 'L', x + 2, 54, 188, 96);           // silver box
  px(c, P, 'W', x + 2, 54, 188, 3);            // roof catchlight
  for (let i = x + 8; i < x + 186; i += 8) px(c, P, 'G', i, 58, 1, 88); // corrugation
  px(c, P, 'G', x + 2, 138, 188, 12);          // lower shade
  px(c, P, 'D', x + 2, 147, 188, 3);
  px(c, P, 'L', x + 38, 62, 116, 46);          // painted sign panel
  px(c, P, 'G', x + 38, 107, 116, 1);
  text(c, P, 'R', 'PORK CHOP', x + 43, 66, 3);
  text(c, P, 'r', 'EXPRESS', x + 55, 88, 3);
  px(c, P, 'R', x + 2, 140, 3, 4);             // tail light
  px(c, P, 'D', x + 10, 152, 176, 6);          // under-frame
  px(c, P, '1', x + 10, 158, 176, 2);
  px(c, P, 'G', x + 150, 158, 3, 6);           // landing gear leg
  bigWheel(c, P, x + 16, 148); bigWheel(c, P, x + 40, 148); // trailer tandem
  // ---- chrome exhaust stacks in the cab gap ----
  px(c, P, 'L', x + 195, 46, 4, 106);
  px(c, P, 'G', x + 198, 46, 1, 106);
  px(c, P, 'W', x + 194, 44, 6, 2);
  px(c, P, 'L', x + 203, 52, 3, 100);
  px(c, P, 'G', x + 205, 52, 1, 100);
  px(c, P, 'W', x + 202, 50, 5, 2);
  px(c, P, 'G', x + 193, 38, 3, 2);            // idling smoke
  px(c, P, 'D', x + 198, 34, 4, 3);
  px(c, P, 'G', x + 205, 40, 2, 2);
  // ---- green cab ----
  px(c, P, '0', x + 206, 52, 58, 102);
  px(c, P, 'E', x + 208, 54, 54, 98);
  px(c, P, 'e', x + 208, 54, 54, 1);           // roof highlight
  px(c, P, 'g', x + 208, 118, 54, 34);         // lower shade
  px(c, P, 'g', x + 208, 55, 3, 63);           // back-edge shade
  px(c, P, 'Y', x + 208, 112, 54, 3);          // gold pinstripe
  px(c, P, '0', x + 232, 62, 2, 90);           // door seam
  px(c, P, 'L', x + 236, 106, 5, 2);           // door handle
  px(c, P, '0', x + 234, 62, 22, 24);          // side window
  px(c, P, 'C', x + 236, 64, 18, 20);
  px(c, P, 'c', x + 236, 74, 18, 10);
  px(c, P, '0', x + 244, 64, 2, 20);           // window divider
  px(c, P, '0', x + 256, 62, 2, 34);           // windshield pillar
  px(c, P, 'C', x + 258, 64, 4, 30);           // windshield sliver
  // ---- hood ----
  px(c, P, '0', x + 262, 102, 32, 52);
  px(c, P, 'E', x + 262, 104, 30, 46);
  px(c, P, 'e', x + 262, 104, 30, 1);
  px(c, P, 'g', x + 262, 132, 30, 18);
  px(c, P, 'Y', x + 286, 110, 6, 6);           // headlight
  px(c, P, 'x', x + 288, 112, 2, 2);
  // ---- grille + bumper ----
  px(c, P, '0', x + 294, 106, 10, 46);
  px(c, P, 'L', x + 295, 107, 8, 44);
  for (let gy = 110; gy < 150; gy += 4) px(c, P, 'G', x + 295, gy, 8, 1);
  px(c, P, 'L', x + 288, 150, 18, 8);          // chrome bumper
  px(c, P, 'W', x + 288, 150, 18, 2);
  px(c, P, '0', x + 288, 158, 18, 2);
  // ---- cab wheels + fuel tank ----
  px(c, P, 'L', x + 255, 140, 14, 8);          // fuel tank
  px(c, P, 'G', x + 255, 145, 14, 3);
  bigWheel(c, P, x + 212, 148); bigWheel(c, P, x + 236, 148);
  bigWheel(c, P, x + 270, 148);
}

function hydrant(c, P, x) {
  px(c, P, 'Y', x + 2, 151, 3, 2);
  px(c, P, 'R', x + 1, 153, 5, 10);
  px(c, P, 'r', x + 5, 153, 1, 10);
  px(c, P, 'r', x - 1, 156, 2, 3);
  px(c, P, 'r', x + 6, 156, 2, 3);
  px(c, P, 'r', x, 163, 7, 3);
  px(c, P, '0', x, 166, 7, 1);
}

// ---- levels -----------------------------------------------------------------

export const LEVELS = [
  {
    id: 'street', name: 'CHINATOWN', lengthPx: 1792,
    floorTop: 168, floorBottom: 224,
    song: 'street',
    layers: [
      // far: night sky + distant SF skyline
      {
        width: 512, speed: 0.25, y: 0,
        draw(c, w, h, P) {
          const r = lcg(101);
          px(c, P, '0', 0, 0, w, h);
          px(c, P, '1', 0, 52, w, 8);
          px(c, P, 'b', 0, 60, w, 108);
          for (let i = 0; i < 60; i++) px(c, P, i % 5 ? 'L' : 'W', r() * w, 36 + r() * 52, 1, 1);
          // upper sky band (just below HUD): dim stars + thin drifting cloud slivers
          const r2 = lcg(707); // separate stream so existing layout stays identical
          for (let i = 0; i < 26; i++) px(c, P, r2() < 0.3 ? 'G' : 'D', r2() * w, 33 + r2() * 26, 1, 1);
          for (const [cx, cy, cw] of [[24, 38, 22], [140, 50, 30], [258, 35, 18], [330, 57, 26], [470, 44, 20]]) {
            px(c, P, 'D', cx, cy, cw, 1);
            px(c, P, 'D', cx + 4, cy + 1, cw - 8, 1);
          }
          // star clusters up in the HUD-adjacent band
          for (const [sx, sy] of [[60, 44], [168, 62], [296, 38], [452, 55]]) {
            px(c, P, 'W', sx, sy, 1, 1);
            px(c, P, 'L', sx + 3, sy + 2, 1, 1);
            px(c, P, 'L', sx - 2, sy + 3, 1, 1);
            px(c, P, 'L', sx + 1, sy + 5, 1, 1);
            px(c, P, 'W', sx + 5, sy - 1, 1, 1);
          }
          // thin crescent moon
          const mx = 396, my = 40;
          px(c, P, 'W', mx + 3, my, 5, 2);
          px(c, P, 'W', mx + 1, my + 2, 2, 2);
          px(c, P, 'W', mx, my + 4, 2, 6);
          px(c, P, 'W', mx + 1, my + 10, 2, 2);
          px(c, P, 'W', mx + 3, my + 12, 5, 2);
          // extended skyline: taller distant tower silhouettes (behind the near row)
          for (const [tx, tt, tw] of [[8, 48, 12], [92, 56, 9], [188, 44, 14], [270, 58, 10], [364, 50, 12], [484, 46, 13]]) {
            px(c, P, '1', tx, tt, tw, 168 - tt);
            px(c, P, 'D', tx, tt, tw, 1);
            if (tw > 10) px(c, P, '1', tx + 3, tt - 4, tw - 6, 4);
            px(c, P, r2() < 0.5 ? 'y' : 'c', tx + 2 + ((r2() * (tw - 4)) | 0), tt + 3 + ((r2() * 12) | 0), 1, 1);
          }
          // extra antenna masts + a small high water tower, red beacons
          px(c, P, 'R', 194, 33, 1, 2);
          px(c, P, '1', 194, 35, 1, 9);
          px(c, P, '1', 192, 38, 5, 1);
          px(c, P, 'R', 490, 33, 1, 2);
          px(c, P, '1', 490, 35, 1, 11);
          px(c, P, '1', 488, 39, 5, 1);
          px(c, P, 'R', 369, 37, 1, 1);
          px(c, P, '1', 368, 38, 4, 2);
          px(c, P, '1', 366, 40, 8, 6);
          px(c, P, '1', 367, 46, 1, 4);
          px(c, P, '1', 373, 46, 1, 4);
          let x = 0;
          while (x < w) {
            const bw = 18 + ((r() * 26) | 0);
            const top = 100 + ((r() * 46) | 0);
            px(c, P, '1', x, top, bw, 168 - top);
            if (r() < 0.5) px(c, P, '1', x + 2, top - 4, 4, 4);
            const lit = 2 + ((r() * 4) | 0);
            for (let i = 0; i < lit; i++)
              px(c, P, r() < 0.3 ? 'c' : 'y', x + 2 + r() * (bw - 4), top + 3 + r() * (160 - top), 1, 1);
            x += bw + 2;
          }
          // pointed tower on the skyline
          px(c, P, '1', 120, 96, 8, 72);
          px(c, P, '1', 122, 84, 4, 12);
          px(c, P, '1', 123, 76, 2, 8);
          px(c, P, 'R', 123, 74, 1, 1);
          // antenna masts (blinking beacons) and a water tower silhouette
          px(c, P, '1', 70, 64, 1, 104);
          px(c, P, '1', 68, 70, 5, 1);
          px(c, P, '1', 69, 78, 3, 1);
          px(c, P, 'R', 70, 62, 1, 2);
          px(c, P, '1', 340, 68, 1, 100);
          px(c, P, '1', 338, 74, 5, 1);
          px(c, P, 'R', 340, 66, 1, 2);
          px(c, P, '1', 225, 100, 21, 68);       // plinth building
          px(c, P, '1', 227, 64, 17, 12);        // tank
          px(c, P, '1', 230, 60, 11, 4);
          px(c, P, '1', 234, 57, 5, 3);
          px(c, P, '1', 229, 76, 2, 24);         // legs
          px(c, P, '1', 240, 76, 2, 24);
          px(c, P, '0', 0, 168, w, h - 168);
        },
      },
      // mid: closer rooftop silhouettes, water towers
      {
        width: 896, speed: 0.55, y: 0,
        draw(c, w, h, P) {
          const r = lcg(202);
          let x = 0;
          while (x < w) {
            const bw = 40 + ((r() * 40) | 0);
            const top = 118 + ((r() * 26) | 0);
            px(c, P, '1', x, top, bw, 168 - top);
            px(c, P, 'D', x, top, bw, 2);
            if (r() < 0.6) {
              px(c, P, '1', x + 6, top - 10, 10, 10);
              px(c, P, 'D', x + 6, top - 10, 10, 1);
              px(c, P, '1', x + 10, top - 13, 2, 3);
            }
            if (r() < 0.5) px(c, P, '1', x + bw - 10, top - 6, 3, 6);
            const nw = 1 + ((r() * 3) | 0);
            for (let i = 0; i < nw; i++)
              px(c, P, 'o', x + 3 + r() * (bw - 6), top + 4 + r() * 20, 2, 3);
            x += bw;
          }
          px(c, P, '1', 0, 166, w, 2);
          px(c, P, '0', 0, 168, w, h - 168);
        },
      },
      // main: rainy neon street — restaurant / herbal shop / arcade storefronts
      // rotate by storefront index, with dumpster-alley gaps every 4th segment
      {
        width: 1792, speed: 1.0, y: 0,
        draw(c, w, h, P) {
          const r = lcg(303);
          const signs = [];
          const signCols = ['M', 'R', 'c', 'Y'];
          const wallCols = ['D', '1', 'q', 'n'];
          let x = 0, bi = 0, si = 0;
          while (x < w) {
            // ALLEY GAP: dumpster + fire escape, parallax skyline shows above
            if (bi % 4 === 3 && x < w - 220) {
              for (let fy = 84; fy <= 124; fy += 20) {       // fire escape decks
                px(c, P, 'D', x + 1, fy, 20, 2);
                px(c, P, '1', x + 1, fy + 2, 20, 1);
                px(c, P, 'D', x + 1, fy - 7, 20, 1);         // handrail
                for (let rx = x + 1; rx <= x + 19; rx += 6) px(c, P, 'D', rx, fy - 7, 1, 7);
              }
              px(c, P, 'D', x + 14, 126, 1, 20);             // drop ladder
              px(c, P, 'D', x + 19, 126, 1, 20);
              for (let ly = 128; ly < 146; ly += 4) px(c, P, 'D', x + 15, ly, 4, 1);
              px(c, P, '0', x + 24, 145, 28, 15);            // dumpster
              px(c, P, 'g', x + 25, 146, 26, 13);
              px(c, P, 'E', x + 25, 146, 26, 1);             // lid rim light
              px(c, P, '1', x + 25, 152, 26, 2);             // lid seam
              glyph(c, P, 'e', x + 30, 154, bi);             // stenciled glyph
              px(c, P, '0', x + 27, 158, 4, 2);              // casters
              px(c, P, '0', x + 45, 158, 4, 2);
              px(c, P, '1', x + 55, 151, 8, 9);              // trash bags
              px(c, P, 'D', x + 56, 152, 3, 2);
              x += 68; bi++;
              continue;
            }
            let bw = 126 + ((r() * 40) | 0);
            if (x + bw > w - 90) bw = w - x;                 // last facade meets the edge
            const top = 58 + ((r() * 26) | 0);
            px(c, P, wallCols[bi % 4], x, top, bw, 160 - top);
            px(c, P, '0', x, top, 1, 160 - top);
            // pagoda roof, two tiers with upturned gold ends
            px(c, P, 'r', x - 5, top - 4, bw + 10, 5);
            px(c, P, 'R', x - 5, top - 5, bw + 10, 2);
            px(c, P, 'Y', x - 6, top - 3, 2, 3);
            px(c, P, 'Y', x + bw + 4, top - 3, 2, 3);
            px(c, P, 'r', x + 14, top - 11, bw - 28, 4);
            px(c, P, 'R', x + 14, top - 12, bw - 28, 2);
            px(c, P, 'Y', x + 13, top - 10, 2, 3);
            px(c, P, 'Y', x + bw - 15, top - 10, 2, 3);
            // tenement windows
            for (let wy = top + 10; wy < 128; wy += 15)
              for (let wx = x + 8; wx < x + bw - 14; wx += 17) {
                const q = r();
                win(c, P, wx, wy, q < 0.4 ? 'x' : q < 0.6 ? 'o' : '1');
              }
            const m = si % 3;
            if (m === 0) {
              // RESTAURANT: red awning, roast ducks hanging in the lit glass, round window
              px(c, P, '1', x + 2, 132, bw - 4, 28);
              for (let ax = x + 2; ax + 8 <= x + bw - 2; ax += 8) {
                px(c, P, 'R', ax, 132, 4, 6);
                px(c, P, 'W', ax + 4, 132, 4, 6);
              }
              const ww = bw - 62;
              px(c, P, 'x', x + 8, 142, ww, 16);             // lit window
              px(c, P, '0', x + 8, 142, ww, 1);
              px(c, P, '0', x + 8, 144, ww, 1);              // duck rail
              for (let dx = x + 12; dx + 7 < x + 8 + ww; dx += 12) {
                px(c, P, 'q', dx + 2, 143, 1, 3);            // hook
                px(c, P, 'n', dx, 146, 5, 7);                // duck body
                px(c, P, 'q', dx, 146, 1, 7);
                px(c, P, 'q', dx + 1, 153, 3, 1);
                px(c, P, 'o', dx + 3, 147, 1, 3);            // lacquer shine
              }
              const ox = x + bw - 48;                        // round window
              px(c, P, '0', ox, 138, 14, 14);
              px(c, P, 'x', ox + 2, 140, 10, 10);
              px(c, P, '0', ox, 138, 2, 2); px(c, P, '0', ox + 12, 138, 2, 2);
              px(c, P, '0', ox, 150, 2, 2); px(c, P, '0', ox + 12, 150, 2, 2);
              px(c, P, '0', ox + 6, 140, 2, 10);             // mullions
              px(c, P, '0', ox + 2, 144, 10, 2);
            } else if (m === 1) {
              // HERBAL SHOP: green awning, wooden shelf grid stacked with remedy jars
              px(c, P, '1', x + 2, 132, bw - 4, 28);
              for (let ax = x + 2; ax + 8 <= x + bw - 2; ax += 8) {
                px(c, P, 'E', ax, 132, 4, 6);
                px(c, P, 'x', ax + 4, 132, 4, 6);
              }
              const sw = bw - 42;
              px(c, P, '0', x + 8, 140, sw, 20);             // shelf case
              px(c, P, 'n', x + 9, 141, sw - 2, 18);
              px(c, P, '0', x + 9, 146, sw - 2, 1);          // shelves
              px(c, P, '0', x + 9, 152, sw - 2, 1);
              for (let gx = x + 20; gx < x + 6 + sw; gx += 12) px(c, P, '0', gx, 141, 1, 18);
              const jars = ['o', 'y', 'E', 'M'];
              for (let ry = 0; ry < 3; ry++)
                for (let jx = x + 11; jx + 4 < x + 7 + sw; jx += 6) {
                  px(c, P, jars[(jx + ry) % 4], jx, 142 + ry * 6, 3, 3);
                  px(c, P, 'x', jx, 141 + ry * 6, 3, 1);     // cork lids
                }
              px(c, P, 'x', x + bw - 32, 140, 10, 12);       // hanging glyph shingle
              px(c, P, '0', x + bw - 32, 140, 10, 1);
              glyph(c, P, 'q', x + bw - 30, 143, si);
            } else {
              // ARCADE / THEATER: bulb marquee, dark entry with glowing coin-ops
              const mw = 60, mx = x + (((bw - mw) / 2) | 0);
              px(c, P, '0', mx - 2, 114, mw + 4, 20);
              px(c, P, 'Y', mx - 2, 114, mw + 4, 2);
              px(c, P, 'Y', mx - 2, 132, mw + 4, 2);
              for (let i = 0; i < 10; i++) {                 // chasing bulbs
                px(c, P, i % 2 ? 'W' : 'o', mx - 2 + i * 6, 114, 2, 2);
                px(c, P, i % 2 ? 'o' : 'W', mx - 2 + i * 6, 132, 2, 2);
              }
              text(c, P, si % 2 ? 'M' : 'R', si % 2 ? 'ARCADE' : 'DRAGON', mx + 7, 119, 2);
              // Wang's restaurant: subtitle above the DRAGON marquee
              if (!(si % 2)) text(c, P, 'x', 'BLACK POOL', mx + 10, 107, 1);
              signs.push([mx + 28, 'Y']);
              px(c, P, '0', x + 6, 136, bw - 30, 24);        // dark entry
              px(c, P, '1', x + 8, 138, bw - 34, 22);
              for (let cx = x + 12; cx + 14 < x + bw - 26; cx += 18) {
                px(c, P, '0', cx, 138, 12, 22);              // cabinet
                px(c, P, 'D', cx + 1, 139, 10, 20);
                px(c, P, 'c', cx + 3, 141, 6, 5);            // glowing screen
                px(c, P, 'C', cx + 3, 141, 6, 1);
                px(c, P, '1', cx + 3, 148, 6, 3);            // control panel
                px(c, P, 'M', cx + 4, 152, 1, 1);            // buttons
                px(c, P, 'c', cx + 7, 152, 1, 1);
              }
            }
            // door (shared by all storefronts)
            px(c, P, 'D', x + bw - 22, 142, 12, 18);
            px(c, P, '1', x + bw - 20, 144, 8, 16);
            px(c, P, 'Y', x + bw - 13, 151, 1, 2);
            // vertical neon sign (arcades have the marquee instead)
            if (m !== 2) {
              const k = signCols[bi % 4];
              const sx = x + 10 + ((r() * 10) | 0);
              neon(c, P, sx, top + 12, k, top > 78 ? 3 : 4);
              signs.push([sx, k]);
            }
            x += bw;
            bi++; si++;
          }
          // strings of red lanterns across the street
          for (let lx = 90; lx < w - 160; lx += 300) {
            px(c, P, 'D', lx, 66, 130, 1);
            for (let i = 0; i < 6; i++) lantern(c, P, lx + 8 + i * 22, 67);
          }
          // sidewalk between buildings and floorTop
          px(c, P, 'G', 0, 160, w, 8);
          px(c, P, 'L', 0, 160, w, 1);
          px(c, P, 'D', 0, 167, w, 1);
          for (let jx = 0; jx < w; jx += 32) px(c, P, 'D', jx, 161, 1, 6);
          // wet asphalt: 3 value bands lighter toward floorBottom + seams
          px(c, P, '1', 0, 168, w, 28);
          px(c, P, 'D', 0, 196, w, 24);
          px(c, P, 'G', 0, 220, w, 4);
          px(c, P, '0', 0, 224, w, h - 224);
          px(c, P, 'D', 0, 181, w, 1);                    // asphalt seams
          for (let sx = 0; sx < w; sx += 128) px(c, P, 'D', sx, 168, 1, 13);
          px(c, P, '1', 0, 208, w, 1);
          for (let sx = 64; sx < w; sx += 128) px(c, P, '1', sx, 196, 1, 24);
          // crosswalk stubs
          for (let cwx = 430; cwx < w - 60; cwx += 620)
            for (let i = 0; i < 5; i++) px(c, P, 'L', cwx + i * 10, 170, 5, 8);
          // manhole covers
          for (let mx = 140; mx < w; mx += 420) {
            px(c, P, 'G', mx - 1, 205, 18, 6);
            px(c, P, 'D', mx, 206, 16, 4);
            px(c, P, '1', mx + 2, 207, 12, 2);
          }
          // neon reflections in the rain-slick street
          for (const [sx, k] of signs) {
            for (let i = 0; i < 5; i++) {
              const rx = sx - 2 + ((r() * 10) | 0);
              const ry = 170 + ((r() * 42) | 0);
              px(c, P, i === 0 ? k : i % 2 ? 'L' : 'D', rx, ry, 1, 3 + ((r() * 3) | 0));
            }
          }
          truck(c, P, 8);                            // Pork Chop Express at the start
          for (let hx = 380; hx < w; hx += 560) hydrant(c, P, hx);
          // rain
          for (let i = 0; i < 110; i++)
            px(c, P, r() < 0.25 ? 'C' : 'c', r() * w, 42 + r() * 172, 1, 3);
        },
      },
    ],
  },

  {
    id: 'warehouse', name: 'WING KONG EXCHANGE', lengthPx: 1536,
    floorTop: 168, floorBottom: 224,
    song: 'warehouse',
    layers: [
      // far: brown back wall, dark night windows with moonlit slivers
      {
        width: 512, speed: 0.25, y: 0,
        draw(c, w, h, P) {
          const r = lcg(404);
          px(c, P, 'q', 0, 0, w, h);
          for (let y = 46; y < 164; y += 8) px(c, P, '1', 0, y, w, 1);   // mortar
          for (let x = 20; x < w; x += 64) {                             // columns
            px(c, P, 'D', x, 40, 10, 128);
            px(c, P, '0', x + 8, 40, 2, 128);
          }
          for (let x = 44; x < w; x += 128) {                            // high windows
            px(c, P, '0', x - 2, 50, 32, 26);
            px(c, P, 'b', x, 52, 28, 22);          // dark night glass
            px(c, P, 'C', x, 52, 28, 1);           // moonlit slivers
            px(c, P, 'C', x, 53, 1, 21);
            px(c, P, '0', x + 13, 52, 2, 22);
            px(c, P, '0', x, 62, 28, 2);
            px(c, P, 'c', x + 22, 54, 3, 2);       // moon glint pane
          }
          px(c, P, '0', 0, 40, w, 2);                                    // roof girder
          for (let x = 0; x < w; x += 32) px(c, P, '0', x, 44, 16, 1);
          for (let i = 0; i < 50; i++) px(c, P, '0', r() * w, 70 + r() * 90, 2, 1); // grime
          px(c, P, '1', 0, 164, w, h - 164);
        },
      },
      // mid: mezzanine catwalk
      {
        width: 768, speed: 0.55, y: 0,
        draw(c, w, h, P) {
          const r = lcg(505);
          for (let x = 30; x < w; x += 96) {         // support columns
            px(c, P, 'D', x, 96, 8, 72);
            px(c, P, '1', x + 6, 96, 2, 72);
            px(c, P, 'G', x, 96, 1, 72);
          }
          px(c, P, 'D', 0, 96, w, 8);                // deck
          px(c, P, 'G', 0, 96, w, 2);
          px(c, P, '1', 0, 102, w, 2);
          px(c, P, 'G', 0, 84, w, 2);                // railing
          for (let x = 0; x < w; x += 12) px(c, P, 'G', x, 86, 1, 10);
          for (let x = 50; x < w; x += 140) chain(c, P, x, 104, 120 + ((r() * 20) | 0));
          for (let x = 70; x < w; x += 180) {        // pallets up top
            px(c, P, '1', x, 84, 20, 12);
            px(c, P, 'D', x, 84, 20, 1);
          }
        },
      },
      // main: brick pillars framing bays that rotate crate stacks / lit office / loading dock
      {
        width: 1536, speed: 1.0, y: 0,
        draw(c, w, h, P) {
          const r = lcg(606);
          // steel ceiling girder
          px(c, P, 'D', 0, 40, w, 8);
          px(c, P, 'G', 0, 40, w, 1);
          px(c, P, '1', 0, 46, w, 2);
          for (let x = 6; x < w; x += 24) px(c, P, '1', x, 42, 2, 2);
          // hanging work lamps
          for (let x = 36; x < w; x += 176) {
            px(c, P, 'D', x, 48, 2, 8);
            px(c, P, 'y', x - 4, 56, 10, 3);
            px(c, P, 'x', x - 1, 59, 4, 3);
          }
          // painted company boards on the wall
          for (const bx of [325, 1093]) {
            if (bx + 84 > w) continue;
            px(c, P, '0', bx - 3, 57, 86, 17);
            px(c, P, 'n', bx - 2, 58, 84, 15);
            px(c, P, 'y', bx - 2, 58, 84, 1);
            text(c, P, 'Y', 'WING KONG', bx + 4, 61, 2);
          }
          // brick support pillars
          for (let x = 64; x < w; x += 192) {
            px(c, P, 'N', x, 48, 26, 120);
            px(c, P, 'n', x + 22, 48, 4, 120);
            px(c, P, '0', x, 48, 1, 120);
            px(c, P, '0', x + 25, 48, 1, 120);
            for (let y = 48; y < 168; y += 8) {
              px(c, P, 'q', x + 1, y, 24, 1);
              px(c, P, 'q', x + (((y / 8) | 0) % 2 ? 6 : 14), y + 1, 1, 7);
            }
            px(c, P, 'D', x - 2, 48, 30, 4);
            if ((((x - 64) / 192) | 0) % 3 === 1) {  // pasted notice on some pillars
              px(c, P, 'x', x + 7, 96, 12, 14);
              px(c, P, '0', x + 7, 96, 12, 1);
              glyph(c, P, 'r', x + 10, 100, ((x - 64) / 192) | 0);
            }
          }
          // hanging chain hooks
          for (let x = 100; x < w; x += 176) chain(c, P, x + ((r() * 60) | 0), 48, 74 + ((r() * 44) | 0));
          // bays between the pillars rotate by bay index
          let bay = 0;
          for (let x = 100; x + 150 < w; x += 192, bay++) {
            const m = bay % 3;
            if (m === 0) {
              // CRATE BAY (taller stack every other one)
              crate(c, P, x + 10, 148, 20);
              crate(c, P, x + 30, 148, 20);
              crate(c, P, x + 20, 128, 20);
              if (bay % 2 === 0) crate(c, P, x + 52, 152, 16);
              else crate(c, P, x + 20, 108, 20);
            } else if (m === 1) {
              // OFFICE BAY: corrugated partition, lit window, desk lamp inside
              px(c, P, '0', x + 8, 106, 76, 62);
              px(c, P, 'D', x + 10, 108, 72, 60);
              px(c, P, 'G', x + 10, 108, 72, 2);
              for (let vx = x + 18; vx < x + 80; vx += 10) px(c, P, '1', vx, 112, 1, 56);
              px(c, P, '0', x + 16, 116, 30, 22);            // window frame
              px(c, P, 'x', x + 18, 118, 26, 18);            // lit glass
              px(c, P, 'o', x + 18, 128, 26, 8);             // warm lower glow
              px(c, P, '0', x + 30, 118, 2, 18);             // mullion
              px(c, P, '1', x + 20, 130, 9, 2);              // desk silhouette
              px(c, P, '1', x + 26, 124, 2, 6);              // lamp arm
              px(c, P, '1', x + 23, 122, 8, 2);              // lamp shade
              px(c, P, 'Y', x + 24, 124, 6, 1);              // bulb line
              px(c, P, '0', x + 52, 126, 20, 42);            // door
              px(c, P, '1', x + 54, 128, 16, 40);
              px(c, P, 'L', x + 66, 148, 3, 2);              // handle
              px(c, P, 'x', x + 14, 168, 34, 2);             // light spill on the floor
              px(c, P, 'x', x + 20, 170, 22, 1);
            } else {
              // LOADING DOCK: roll-up door with hazard-striped jambs
              px(c, P, '1', x + 6, 92, 92, 76);
              px(c, P, 'D', x + 6, 92, 92, 10);              // header
              text(c, P, 'Y', 'DOCK', x + 44, 94, 1);
              px(c, P, 'G', x + 14, 104, 76, 60);            // roll-up slats
              px(c, P, 'L', x + 14, 104, 76, 2);
              for (let gy = 110; gy < 164; gy += 6) px(c, P, 'D', x + 14, gy, 76, 1);
              px(c, P, 'D', x + 48, 156, 10, 4);             // pull handle
              for (let sy = 102; sy < 162; sy += 8) {        // hazard jambs
                px(c, P, 'Y', x + 8, sy, 4, 4);
                px(c, P, '0', x + 8, sy + 4, 4, 4);
                px(c, P, '0', x + 92, sy, 4, 4);
                px(c, P, 'Y', x + 92, sy + 4, 4, 4);
              }
            }
          }
          crate(c, P, w - 76, 148, 20);              // last bay closes with crates
          crate(c, P, w - 56, 148, 20);
          crate(c, P, w - 66, 128, 20);
          // concrete floor, lighter toward floorBottom, with slab seams
          px(c, P, 'D', 0, 168, w, 32);
          px(c, P, 'G', 0, 200, w, 21);
          px(c, P, 'L', 0, 221, w, 3);
          px(c, P, '1', 0, 224, w, h - 224);
          for (let x = 0; x < w; x += 96) px(c, P, '1', x, 168, 1, 56); // seams
          px(c, P, '1', 0, 180, w, 1);
          px(c, P, '1', 0, 196, w, 1);
          px(c, P, '1', 0, 210, w, 1);
          for (let x = 0; x < w; x += 16) px(c, P, 'y', x, 168, 8, 2);  // worn hazard stripe
          // drain grates
          for (let x = 120; x < w; x += 260) {
            px(c, P, '1', x, 206, 26, 8);
            px(c, P, 'G', x, 206, 26, 1);
            for (let gx = x + 3; gx < x + 24; gx += 5) px(c, P, '0', gx, 208, 2, 5);
          }
          // oil stains
          for (let i = 0; i < 24; i++) px(c, P, '1', r() * w, 172 + r() * 44, 4 + r() * 8, 2);
        },
      },
    ],
  },

  {
    id: 'sewers', name: 'THE UNDERWORLD', lengthPx: 1792,
    floorTop: 168, floorBottom: 224,
    song: 'sewers',
    layers: [
      // far: cavern wall one value step up from void, cages, torch embers, fungus shelves
      {
        width: 512, speed: 0.25, y: 0,
        draw(c, w, h, P) {
          const r = lcg(707);
          px(c, P, '0', 0, 0, w, h);
          px(c, P, '1', 0, 96, w, 72);               // back rock wall
          for (let i = 0; i < 46; i++)               // strata high up
            px(c, P, '1', r() * w, 52 + r() * 44, 4 + r() * 8, 3 + r() * 4);
          for (let i = 0; i < 40; i++)               // mid-value wall texture
            px(c, P, 'D', r() * w, 100 + r() * 60, 3 + r() * 6, 2 + r() * 2);
          for (let i = 0; i < 12; i++)               // faint catch-lights
            px(c, P, 'G', r() * w, 108 + r() * 48, 2 + r() * 3, 1);
          for (let x = 60; x < w; x += 150) cage(c, P, x, 58 + ((r() * 14) | 0)); // sinners
          for (let x = 30; x < w; x += 110) {        // distant torches with ember halos
            px(c, P, 'D', x, 130, 1, 4);
            px(c, P, 'r', x - 1, 126, 3, 4);
            flame3(c, P, x, 126);
          }
          for (let x = 84; x < w; x += 130) {        // luminescent fungus shelves
            px(c, P, 'g', x - 2, 112, 10, 2);
            px(c, P, 'E', x, 111, 6, 2);
            px(c, P, 'e', x + 2, 110, 2, 1);
          }
          px(c, P, '1', 0, 166, w, h - 166);
          for (let i = 0; i < 30; i++)               // green haze at the ground
            px(c, P, 'g', r() * w, 154 + r() * 10, 3 + r() * 6, 1);
          for (let i = 0; i < 10; i++)
            px(c, P, 'E', r() * w, 156 + r() * 8, 2, 1);
        },
      },
      // mid: rim-lit stalactites, glowing service pipe with drips, fungus up high
      {
        width: 768, speed: 0.5, y: 0,
        draw(c, w, h, P) {
          const r = lcg(808);
          px(c, P, 'D', 0, 40, w, 14);
          px(c, P, 'G', 0, 52, w, 2);                // lit ceiling under-edge
          for (let x = 0; x < w; x += 10 + ((r() * 14) | 0)) {
            const len = 8 + ((r() * 26) | 0);
            px(c, P, 'D', x, 54, 5, len);
            px(c, P, 'D', x + 1, 54 + len, 3, 4);
            px(c, P, 'D', x + 2, 58 + len, 1, 3);
            px(c, P, 'G', x, 54, 1, len);            // rim light
            px(c, P, 'G', x + 2, 59 + len, 1, 2);    // lit tip
          }
          // glowing service pipe bolted below the stalactite line
          px(c, P, 'g', 0, 92, w, 4);
          px(c, P, 'E', 0, 92, w, 1);
          for (let x = 20; x < w; x += 64) px(c, P, 'g', x, 88, 3, 4);   // hangers
          for (let x = 36; x < w; x += 96) {         // glow windows + falling drips
            px(c, P, 'e', x, 93, 4, 2);
            px(c, P, 'e', x + 1, 97, 1, 3);
            px(c, P, 'e', x + 1, 104 + ((r() * 8) | 0), 1, 2);
          }
          for (let x = 54; x < w; x += 120) {        // fungus clusters up high
            const fy = 62 + ((r() * 16) | 0);
            px(c, P, 'g', x - 2, fy + 2, 12, 3);
            px(c, P, 'E', x, fy + 1, 8, 3);
            px(c, P, 'e', x + 2, fy, 4, 2);
            px(c, P, 'e', x + 9, fy + 3, 2, 1);
          }
          for (let x = 30; x < w; x += 120) {        // outcrops with mossy rims
            px(c, P, 'D', x, 140, 26, 28);
            px(c, P, 'G', x + 3, 140, 8, 2);
            px(c, P, 'G', x + 15, 144, 6, 2);
            px(c, P, 'E', x + 6, 139, 6, 1);
            px(c, P, 'e', x + 8, 138, 2, 1);
          }
        },
      },
      // main: sections rotate torch-lit rock pillar / bricked gate / collapsed rubble
      {
        width: 1792, speed: 1.0, y: 0,
        draw(c, w, h, P) {
          const r = lcg(909);
          // ceiling rock with jagged under-edge
          px(c, P, '1', 0, 40, w, 10);
          for (let x = 0; x < w; x += 14) px(c, P, '1', x, 50, 7, 3 + ((r() * 5) | 0));
          for (let x = 7; x < w; x += 28) px(c, P, 'D', x, 50, 3, 1);   // lit jag tips
          // dripping pipe along the ceiling
          px(c, P, 'G', 0, 54, w, 4);
          px(c, P, 'L', 0, 54, w, 1);
          px(c, P, 'D', 0, 57, w, 1);
          for (let x = 24; x < w; x += 48) px(c, P, 'D', x, 52, 3, 3);
          for (let x = 64; x < w; x += 128) px(c, P, 'L', x, 52, 3, 8); // flanges
          for (let i = 0; i < 16; i++) px(c, P, 'c', r() * w, 60 + r() * 92, 1, 3); // drips
          // hanging roots
          for (let rx = 90; rx < w; rx += 170) {
            px(c, P, 'n', rx, 59, 1, 8);
            px(c, P, 'n', rx + 1, 67, 1, 6);
            px(c, P, 'n', rx, 73, 1, 5);
            px(c, P, 'N', rx + 1, 78, 1, 3);
            px(c, P, 'n', rx + 13, 59, 1, 6);
            px(c, P, 'n', rx + 12, 65, 1, 4);
          }
          // alternating cavern sections
          let sec = 0;
          for (let x = 40; x < w - 40; x += 224, sec++) {
            const m = sec % 3;
            if (m === 0) {
              // ROCK PILLAR, torch-lit with a stepped light pool
              const pw = 24 + ((r() * 12) | 0);
              px(c, P, '1', x, 56, pw, 112);
              px(c, P, '0', x, 56, 2, 112);
              px(c, P, '0', x + pw - 2, 56, 2, 112);
              px(c, P, '1', x - 2, 60, pw + 4, 8);
              px(c, P, '1', x - 4, 150, pw + 8, 18);
              for (let i = 0; i < 8; i++)
                px(c, P, 'D', x + 2 + r() * (pw - 8), 60 + r() * 100, 3 + r() * 5, 2 + r() * 3);
              px(c, P, 'e', x + 3, 152, 2, 1);
              const tx = x + ((pw / 2) | 0);
              torchGlow(c, P, tx, 86);
              torch(c, P, tx, 84);
              px(c, P, 'o', tx - 10, 168, 24, 3);    // torch light on the floor
              px(c, P, 'o', tx - 6, 171, 16, 2);
              px(c, P, 'Y', tx - 4, 169, 12, 1);
            } else if (m === 1) {
              // BRICK-LINED SECTION with a barred gate, torch beside it
              const gx = x + 2;
              px(c, P, '1', gx - 3, 70, 64, 98);
              px(c, P, 'N', gx, 72, 58, 96);
              px(c, P, 'q', gx + 54, 72, 4, 96);
              for (let y = 72; y < 168; y += 6) {
                px(c, P, 'q', gx, y, 58, 1);
                px(c, P, 'q', gx + (((y / 6) | 0) % 2 ? 12 : 26), y + 1, 1, 5);
                px(c, P, 'q', gx + (((y / 6) | 0) % 2 ? 40 : 48), y + 1, 1, 5);
              }
              px(c, P, 'D', gx - 2, 70, 62, 3);      // capstone
              px(c, P, 'G', gx - 2, 70, 62, 1);
              px(c, P, 'D', gx + 12, 108, 34, 8);    // arch lintel
              px(c, P, 'G', gx + 14, 108, 30, 1);
              px(c, P, '0', gx + 14, 116, 30, 52);   // gateway dark
              for (let bx = gx + 17; bx < gx + 43; bx += 5) px(c, P, 'G', bx, 118, 2, 50);
              px(c, P, 'D', gx + 14, 140, 30, 2);    // crossbar
              px(c, P, 'g', gx + 6, 74, 2, 12);      // slime weeping down the bricks
              px(c, P, 'g', gx + 48, 78, 2, 16);
              px(c, P, 'E', gx + 6, 74, 1, 5);
              px(c, P, 'e', gx + 48, 78, 1, 3);
              torchGlow(c, P, gx + 66, 92);
              torch(c, P, gx + 66, 90);
              px(c, P, 'o', gx + 56, 168, 22, 3);
              px(c, P, 'Y', gx + 60, 169, 12, 1);
            } else {
              // COLLAPSED SECTION: rubble slope, snapped timber, fungus glints
              const cx = x + 4;
              px(c, P, '1', cx + 12, 46, 44, 14);    // broken ceiling maw
              px(c, P, '1', cx + 20, 128, 22, 10);   // stepped rubble mound
              px(c, P, 'D', cx + 10, 136, 40, 12);
              px(c, P, '1', cx + 2, 146, 58, 22);
              px(c, P, 'D', cx, 156, 62, 12);
              px(c, P, 'G', cx + 22, 128, 7, 1);     // rim light on the rocks
              px(c, P, 'G', cx + 12, 136, 9, 1);
              px(c, P, 'G', cx + 4, 146, 10, 1);
              px(c, P, 'G', cx + 34, 150, 8, 1);
              px(c, P, '0', cx + 16, 140, 6, 4);     // dark voids between rocks
              px(c, P, '0', cx + 36, 152, 7, 4);
              px(c, P, 'n', cx + 44, 118, 4, 16);    // snapped timber
              px(c, P, 'n', cx + 48, 108, 4, 12);
              px(c, P, 'N', cx + 44, 118, 1, 16);
              px(c, P, 'e', cx + 24, 127, 3, 1);     // fungus glints
              px(c, P, 'E', cx + 8, 145, 4, 2);
              px(c, P, 'e', cx + 9, 144, 2, 1);
              px(c, P, 'E', cx + 40, 155, 3, 2);
            }
          }
          // stone floor: bands lighter toward floorBottom, tile seams, water channel
          px(c, P, 'D', 0, 168, w, 32);
          px(c, P, 'G', 0, 200, w, 17);
          for (let x = 0; x < w; x += 32) px(c, P, '1', x, 168, 1, 49); // tile seams
          px(c, P, '1', 0, 185, w, 1);
          px(c, P, '1', 0, 200, w, 1);
          px(c, P, '1', 0, 217, w, 1);              // channel edge line
          px(c, P, 'b', 0, 218, w, 6);              // water channel
          for (let x = 12; x < w; x += 40) px(c, P, 'c', x, 220, 6, 1); // ripples
          px(c, P, '0', 0, 224, w, h - 224);
          for (let i = 0; i < 40; i++)               // rubble
            px(c, P, '1', r() * w, 170 + r() * 40, 2 + r() * 4, 1 + r() * 2);
          for (let i = 0; i < 8; i++)                // drip splashes
            px(c, P, 'c', r() * w, 174 + r() * 30, 2, 1);
          // eerie glow pools (coherent puddles with highlights)
          for (let x = 70; x < w - 120; x += 196)
            pool(c, P, x + ((r() * 30) | 0), 192 + ((r() * 14) | 0), 34 + ((r() * 16) | 0));
          // bone piles
          for (let i = 0; i < 5; i++) bones(c, P, 130 + i * 330 + ((r() * 60) | 0), 196 + ((r() * 10) | 0));
        },
      },
    ],
  },

  {
    id: 'lair', name: "LO PAN'S LAIR", lengthPx: 1536,
    floorTop: 168, floorBottom: 224,
    song: 'lair',
    layers: [
      // far: dark hall, giant golden statues
      {
        width: 512, speed: 0.25, y: 0,
        draw(c, w, h, P) {
          const r = lcg(111);
          px(c, P, '0', 0, 0, w, h);
          px(c, P, '1', 0, 100, w, 8);
          px(c, P, 'm', 0, 108, w, 60);              // deep red glow
          for (let x = 16; x < w; x += 96) {         // distant colonnade
            px(c, P, 'r', x, 108, 8, 60);
            px(c, P, 'y', x - 1, 104, 10, 4);
          }
          buddha(c, P, 90, 168);
          buddha(c, P, 300, 168);
          buddha(c, P, 440, 168);
          for (let i = 0; i < 26; i++)               // incense embers
            px(c, P, i % 3 ? 'x' : 'Y', r() * w, 96 + r() * 60, 1, 1);
          px(c, P, '1', 0, 166, w, 2);
        },
      },
      // mid: inner colonnade with hanging lanterns
      {
        width: 768, speed: 0.5, y: 0,
        draw(c, w, h, P) {
          const r = lcg(222);
          for (let x = 24; x < w; x += 80) {
            px(c, P, 'r', x, 74, 10, 94);
            px(c, P, 'm', x + 8, 74, 2, 94);
            px(c, P, 'y', x - 2, 70, 14, 4);
            px(c, P, 'Y', x - 2, 70, 14, 1);
            px(c, P, 'y', x - 2, 164, 14, 4);
          }
          for (let x = 64; x < w; x += 160) {        // lanterns
            px(c, P, '1', x + 2, 60, 1, 8);
            px(c, P, 'y', x, 68, 6, 2);
            px(c, P, 'R', x - 1, 70, 8, 7);
            px(c, P, 'Y', x + 2, 72, 2, 2);
            px(c, P, 'r', x - 1, 77, 8, 1);
            px(c, P, 'y', x + 2, 78, 2, 2);
          }
          for (let i = 0; i < 20; i++) px(c, P, 'D', r() * w, 60 + r() * 40, 2, 1); // smoke
        },
      },
      // main: red pillars framing bays that rotate banner / gong / warrior niche / treasure
      {
        width: 1536, speed: 1.0, y: 0,
        draw(c, w, h, P) {
          const r = lcg(333);
          // ornate gold trim band along the top
          px(c, P, 'y', 0, 40, w, 10);
          px(c, P, 'Y', 0, 40, w, 2);
          for (let x = 0; x < w; x += 12) {
            px(c, P, 'Y', x + 3, 44, 4, 4);
            px(c, P, 'r', x + 9, 43, 2, 5);
          }
          px(c, P, 'r', 0, 50, w, 2);
          px(c, P, '0', 0, 52, w, 1);
          // grand red pillars with gold caps (the hero color of the scene)
          for (let x = 24; x < w; x += 128) pillar(c, P, x);
          // bay contents between the pillars rotate by bay index
          let bay = 0;
          for (let x = 24; x + 148 <= w; x += 128, bay++) {
            const m = bay % 4;
            if (m === 0) {
              // BANNER BAY with a candle shelf
              banner(c, P, x + 58, 56, bay % 8 ? 'M' : 'R', bay % 8 ? 'm' : 'r');
              candles(c, P, x + 84, 4);
            } else if (m === 1) {
              // CEREMONIAL GONG on a lacquered stand
              const gx = x + 42;
              px(c, P, 'n', gx, 80, 4, 88);          // posts
              px(c, P, 'n', gx + 56, 80, 4, 88);
              px(c, P, 'N', gx, 80, 1, 88);
              px(c, P, 'N', gx + 56, 80, 1, 88);
              px(c, P, 'n', gx - 6, 72, 72, 6);      // crossbeam
              px(c, P, 'N', gx - 6, 72, 72, 1);
              px(c, P, 'y', gx - 8, 70, 6, 8);       // gold finials
              px(c, P, 'y', gx + 62, 70, 6, 8);
              px(c, P, '0', gx + 18, 78, 1, 14);     // hanging ropes
              px(c, P, '0', gx + 41, 78, 1, 14);
              px(c, P, 'y', gx + 14, 96, 32, 40);    // stepped bronze disc
              px(c, P, 'y', gx + 18, 92, 24, 48);
              px(c, P, 'y', gx + 8, 102, 44, 28);
              px(c, P, 'Y', gx + 16, 98, 28, 36);
              px(c, P, 'Y', gx + 20, 94, 20, 44);
              px(c, P, 'Y', gx + 10, 104, 40, 24);
              px(c, P, 'x', gx + 24, 108, 12, 12);   // boss
              px(c, P, 'W', gx + 26, 110, 3, 3);     // glint
              px(c, P, 'y', gx + 24, 132, 12, 4);    // lower shade
              px(c, P, 'n', gx + 62, 148, 3, 20);    // mallet against the post
              px(c, P, 'N', gx + 60, 144, 7, 6);
            } else if (m === 2) {
              // TERRACOTTA WARRIOR in a niche
              const nx = x + 46;
              px(c, P, 'y', nx - 4, 82, 56, 4);      // gold cornice
              px(c, P, 'Y', nx - 4, 82, 56, 1);
              px(c, P, 'm', nx - 2, 86, 52, 82);     // maroon surround
              px(c, P, '0', nx + 4, 90, 40, 78);     // recess
              px(c, P, '1', nx + 6, 92, 36, 76);
              px(c, P, 'D', nx + 10, 156, 28, 12);   // plinth
              px(c, P, 'G', nx + 10, 156, 28, 2);
              px(c, P, 's', nx + 20, 106, 8, 3);     // topknot + brow
              px(c, P, 'T', nx + 20, 109, 8, 8);     // head
              px(c, P, 's', nx + 26, 109, 2, 8);
              px(c, P, 's', nx + 14, 117, 20, 6);    // shoulders
              px(c, P, 'T', nx + 14, 117, 3, 6);
              px(c, P, 's', nx + 16, 123, 16, 16);   // armor torso
              px(c, P, 'T', nx + 16, 123, 2, 16);
              px(c, P, 'q', nx + 16, 128, 16, 1);    // armor bands
              px(c, P, 'q', nx + 16, 133, 16, 1);
              px(c, P, 's', nx + 12, 121, 4, 14);    // arms
              px(c, P, 's', nx + 32, 121, 4, 14);
              px(c, P, 'T', nx + 12, 121, 1, 14);
              px(c, P, 'q', nx + 18, 139, 5, 17);    // legs
              px(c, P, 'q', nx + 25, 139, 5, 17);
              px(c, P, 's', nx + 18, 139, 1, 17);
            } else {
              // TREASURE CORNER: thrown-open chest, coin mound, jade vase
              const tx = x + 44;
              px(c, P, '0', tx - 1, 147, 24, 21);
              px(c, P, 'n', tx, 148, 22, 20);        // chest
              px(c, P, 'N', tx, 148, 22, 4);
              px(c, P, 'N', tx - 2, 142, 26, 5);     // lid thrown back
              px(c, P, 'y', tx, 158, 22, 2);         // strap
              px(c, P, 'Y', tx + 9, 155, 4, 5);      // hasp
              px(c, P, 'Y', tx + 2, 149, 18, 2);     // gold heaped inside
              px(c, P, 'x', tx + 6, 148, 8, 1);
              px(c, P, 'y', tx + 20, 154, 40, 14);   // spilled coin mound
              px(c, P, 'y', tx + 28, 148, 22, 8);
              px(c, P, 'Y', tx + 30, 150, 16, 4);
              px(c, P, 'Y', tx + 24, 156, 30, 3);
              for (let i = 0; i < 9; i++)            // loose coins
                px(c, P, i % 3 ? 'Y' : 'x', tx + 22 + ((i * 11) % 36), 149 + ((i * 5) % 16), 2, 1);
              px(c, P, 'W', tx + 36, 151, 1, 1);     // single sparkle
              px(c, P, 'g', tx + 58, 146, 10, 22);   // jade vase
              px(c, P, 'E', tx + 60, 148, 2, 18);
              px(c, P, 'g', tx + 60, 142, 6, 4);
              px(c, P, 'e', tx + 61, 143, 1, 2);
            }
          }
          // dark jade checker floor with thin gold seam lines every 32px
          for (let y = 168; y < 224; y += 8)
            for (let x = 0; x < w; x += 8) {
              const a = (((x / 8) | 0) + ((y / 8) | 0)) % 2;
              px(c, P, a ? 'g' : '1', x, y, 8, 8);
            }
          for (let x = 0; x < w; x += 32) px(c, P, 'y', x, 168, 1, 56);
          px(c, P, 'y', 0, 168, w, 1);
          px(c, P, 'y', 0, 200, w, 1);
          px(c, P, '0', 0, 224, w, h - 224);
          // inlaid gold medallions
          for (let x = 96; x < w; x += 384) {
            px(c, P, 'y', x, 188, 12, 8);
            px(c, P, 'Y', x + 3, 190, 6, 4);
            px(c, P, '1', x, 188, 12, 1);
          }
        },
      },
    ],
  },
];
