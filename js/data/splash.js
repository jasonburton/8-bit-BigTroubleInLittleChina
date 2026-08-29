// Full-screen intro splash: the Pork Chop Express head-on in rain-slicked
// Chinatown, 1986. Pure fillRect pixel art, palette keys only, integer coords.
// drawSplash(ctx, P, tick) — tick animates rain, lightning, neon, wipers, smoke.
import { drawText, textWidth } from '../font.js';

export function drawSplash(ctx, P, tick) {
  const r = (x, y, w, h, c) => { ctx.fillStyle = P[c]; ctx.fillRect(x, y, w, h); };
  const phase = tick % 210;
  const flash = phase < 12 ? phase : -1; // lightning strike frames
  const bright = flash >= 0 && flash < 7;

  // ---- sky: storm night, brightens violently during the strike ----
  r(0, 0, 256, 240, '0');
  r(0, 18, 256, 58, bright ? 'p' : 'b');
  r(0, 76, 256, 32, bright ? 'P' : 'b');
  r(0, 108, 256, 26, bright ? 'p' : 'b');
  if (flash >= 7) { r(0, 60, 256, 74, 'p'); }
  // ragged storm clouds
  for (let i = 0; i < 12; i++) {
    const cx = (i * 53 + 11) % 246, cy = 4 + (i * 17) % 34;
    r(cx, cy, 26 + (i * 13) % 42, 5 + (i * 7) % 9, i % 2 ? '0' : '1');
    r(cx + 6, cy + 3, 18 + (i * 9) % 30, 4, '0');
  }

  // ---- lightning bolt behind the skyline ----
  if (flash >= 0) {
    const seed = ((tick / 210) | 0) % 3;
    let bx = [52, 198, 150][seed];
    for (let y = 2; y < 126; y += 5) {
      bx += (((y * 7 + seed * 13) % 3) - 1) * 5;
      if (flash < 6) { r(bx - 2, y, 7, 3, 'C'); r(bx, y, 3, 6, 'W'); }
      else r(bx, y, 2, 6, 'C');
      if (y === 47 && flash < 5) { // forked branch
        let fx = bx;
        for (let fy = 47; fy < 96; fy += 5) { fx += seed ? -4 : 4; r(fx, fy, 2, 5, 'C'); }
      }
    }
  }

  // ---- storm glow on the horizon, dithered into the sky ----
  if (!bright) {
    r(0, 122, 256, 10, 'p');
    for (let y = 115; y < 122; y++) for (let x = (y & 1); x < 256; x += 2 + (121 - y)) r(x, y, 1, 1, 'p');
  }

  // ---- skyline silhouette (baseline 132) ----
  for (let i = 0; i < 14; i++) {
    const bx = i * 19 - 4, bw = 15 + (i * 7) % 10, bh = 26 + (i * 31) % 50;
    r(bx, 132 - bh, bw, bh, flash >= 0 ? '0' : (i % 3 ? '1' : '0'));
    if (flash < 0) // sparse lit windows, killed by the flash silhouette
      for (let wy = 138 - bh; wy < 126; wy += 6)
        for (let wx = bx + 2; wx < bx + bw - 2; wx += 5)
          if ((wx * 7 + wy * 13 + i) % 7 === 0) r(wx, wy, 2, 2, (wx + wy) % 3 ? 'y' : 'o');
  }
  // pagoda tower silhouette, left
  for (let t = 0; t < 4; t++) { const hw = 8 + t * 5; r(30 - hw, 58 + t * 12, hw * 2, 4, '0'); r(30 - hw + 3, 62 + t * 12, hw * 2 - 6, 8, '0'); }
  r(28, 50, 4, 8, '0');

  // ---- distant street + foreground asphalt ----
  r(0, 132, 256, 40, '1');
  r(0, 170, 256, 2, 'D');
  r(0, 172, 256, 68, 'D');
  for (let i = 0; i < 9; i++) r((i * 47 + 9) % 230, 178 + (i * 29) % 56, 18 + (i * 11) % 22, 3, '1'); // patched tar
  // curb glints
  r(0, 132, 256, 1, 'D');

  // ---- neon signs flanking the street ----
  const nOnL = ((tick >> 5) & 1) === 0, nOnR = !nOnL;
  // left vertical sign (magenta)
  r(12, 66, 20, 66, '0');
  r(13, 67, 18, 64, nOnL ? 'm' : '1');
  for (let j = 0; j < 5; j++) { r(16, 71 + j * 12, 12, 7, nOnL ? 'M' : 'D'); r(18, 73 + j * 12, 8, 3, nOnL ? 'm' : '1'); }
  if (nOnL) { r(11, 66, 1, 66, 'M'); r(32, 66, 1, 66, 'M'); }
  // right vertical sign (cyan)
  r(226, 76, 18, 56, '0');
  r(227, 77, 16, 54, nOnR ? 'b' : '1');
  for (let j = 0; j < 4; j++) { r(230, 81 + j * 12, 10, 7, nOnR ? 'c' : 'D'); r(232, 83 + j * 12, 6, 3, nOnR ? 'b' : '1'); }
  if (nOnR) { r(225, 76, 1, 56, 'c'); r(244, 76, 1, 56, 'c'); }
  // small red horizontal sign, mid-left rooftop
  r(40, 96, 26, 10, '0'); r(41, 97, 24, 8, (tick >> 4) & 1 ? 'r' : '1');
  if ((tick >> 4) & 1) for (let k = 0; k < 4; k++) r(43 + k * 6, 99, 4, 4, 'R');

  // ---- distant parked cars + steam, filling the left street ----
  for (const [px, pw] of [[6, 34], [44, 30]]) {
    r(px, 158, pw, 8, '0');
    r(px + 6, 152, pw - 12, 6, '1');
    r(px + pw - 4, 162, 3, 2, 'r');            // taillight
    r(px + 2, 166, pw - 4, 2, '0');
  }
  const st = (tick >> 4) & 1;
  r(30, 144 - st * 3, 2, 5, 'G'); r(35, 137 + st * 2, 2, 5, 'D'); r(32, 128 - st * 2, 2, 4, '1'); // manhole steam

  // ---- trailer (three-quarter, receding right, kept in shadow) ----
  r(154, 90, 74, 72, '0');
  r(156, 92, 70, 66, 'g');
  r(156, 92, 70, 2, 'E');                      // dim top edge
  for (let x = 162; x < 224; x += 8) r(x, 98, 2, 58, '0'); // ribs
  r(156, 92, 70, 1, bright ? 'C' : 'E');       // rain glint on trailer top
  for (let i = 0; i < 4; i++) r(160 + i * 17, 94, 3, 2, 'y'); // dim marker lights
  r(156, 156, 70, 6, '0');                     // skirt shadow

  // ---- exhaust stack + smoke (rises from behind the left fender) ----
  r(64, 96, 8, 58, '0');
  r(65, 97, 6, 56, 'D');
  r(66, 97, 2, 56, 'G');
  r(63, 92, 10, 4, '1');
  const sp = (tick >> 3) & 3;
  r(65 + [0, 2, 1, 3][sp], 82 - sp * 2, 4, 4, 'D');
  r(68 - [0, 2, 1, 3][sp], 70 - sp * 3, 5, 5, '1');

  // ---- CAB: head-on, the bright focal center ----
  // fenders
  r(56, 152, 22, 46, '0'); r(58, 154, 18, 42, 'g'); r(58, 154, 18, 2, 'E');
  r(158, 152, 22, 46, '0'); r(160, 154, 18, 42, 'g'); r(160, 154, 18, 2, 'E');
  // roof + marker lights
  r(72, 104, 92, 14, '0');
  r(74, 106, 88, 10, 'g');
  r(74, 106, 88, 3, 'E');
  r(74, 106, 88, 1, bright ? 'C' : 'e');       // wet roof glint
  for (let i = 0; i < 5; i++) { r(86 + i * 15, 109, 5, 4, 'y'); r(87 + i * 15, 110, 3, 2, 'O'); }
  // A-pillars + windshield
  r(72, 116, 92, 30, '0');
  r(74, 118, 8, 26, 'g');
  r(154, 118, 8, 26, 'g');
  r(82, 118, 34, 24, 'b'); r(120, 118, 34, 24, 'b');   // two panes
  r(116, 118, 4, 24, '0');                              // divider
  // reflections in the glass (lightning floods it)
  if (bright) { r(84, 119, 30, 10, 'c'); r(122, 119, 30, 10, 'c'); r(88, 120, 8, 20, 'C'); r(140, 120, 8, 20, 'C'); }
  else {
    r(86, 120, 3, 20, 'B'); r(92, 120, 2, 20, 'B');     // streaky city light
    r(134, 120, 3, 20, 'B'); r(141, 120, 2, 20, 'B');
    r(103, 119, 10, 3, 'c'); r(124, 119, 10, 3, 'c');   // top sheen
  }
  // wipers mid-swipe
  const wp = (tick >> 4) & 1;
  r(96 - wp * 6, 128 + wp * 4, 2, 12 - wp * 4, '0');
  r(136 + wp * 6, 128 + wp * 4, 2, 12 - wp * 4, '0');
  // mirrors
  r(62, 118, 10, 3, '0'); r(60, 120, 8, 14, '0'); r(62, 122, 4, 10, 'L');
  r(164, 118, 10, 3, '0'); r(168, 120, 8, 14, '0'); r(170, 122, 4, 10, 'L');
  // cowl + hood
  r(72, 146, 92, 8, '0');
  r(74, 147, 88, 6, 'E');
  r(74, 147, 88, 1, 'e');
  r(70, 154, 96, 12, '0');
  r(72, 155, 92, 10, 'E');
  r(72, 155, 92, 2, 'e');
  r(114, 152, 8, 4, 'L'); r(116, 150, 4, 3, 'W');       // hood ornament
  // grille: chrome frame, dark teeth, glinting bars
  r(76, 166, 84, 32, '0');
  r(78, 168, 80, 28, 'L');
  r(82, 172, 72, 20, '1');
  for (let x = 84; x < 152; x += 6) { r(x, 172, 2, 20, 'L'); r(x, 172, 2, 3, 'W'); }
  r(78, 168, 80, 1, 'W');                               // chrome lip glint
  // headlights blazing on the fenders
  for (const hx of [58, 160]) {
    r(hx, 162, 18, 16, '0');
    r(hx + 1, 163, 16, 14, 'Y');
    r(hx + 3, 165, 12, 10, 'x');
    r(hx + 5, 167, 8, 6, 'W');
    // bloom halo dither, two rings
    r(hx - 2, 168, 2, 4, 'y'); r(hx + 18, 168, 2, 4, 'y');
    r(hx + 4, 160, 10, 2, 'y'); r(hx + 4, 178, 10, 2, 'y');
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      r(hx + 9 + Math.round(Math.cos(a) * 12), 170 + Math.round(Math.sin(a) * 9), 2, 1, 'x');
      r(hx + 9 + Math.round(Math.cos(a + 0.4) * 15), 170 + Math.round(Math.sin(a + 0.4) * 11), 1, 1, 'y');
    }
  }
  // bumper: full-width chrome slab
  r(52, 196, 132, 14, '0');
  r(54, 197, 128, 8, 'L');
  r(54, 197, 128, 1, 'W');
  r(54, 203, 128, 2, 'G');
  r(110, 198, 16, 6, 'D'); r(112, 199, 12, 4, 'x');     // plate lamp
  r(54, 205, 128, 5, 'D');
  // tires + ground shadow
  r(60, 208, 20, 8, '0'); r(64, 210, 4, 4, 'D');
  r(156, 208, 20, 8, '0'); r(168, 210, 4, 4, 'D');
  r(52, 214, 176, 4, '0');

  // ---- headlight cones washing the wet street ----
  for (const [cx, dir] of [[67, -1], [169, 1]]) {
    for (let y = 180; y < 236; y++) {
      const t = (y - 180) / 56;
      const spread = Math.round(26 * t);
      const cxx = cx + dir * Math.round(30 * t);
      const lx = cxx - 8 - spread, wdt = 16 + spread * 2;
      r(lx, y, wdt, 1, 'y');                            // cone body
      for (let x = lx + ((y & 1) ? 0 : 1); x < lx + wdt; x += 2) r(x, y, 1, 1, 'x'); // glow dither
      if (t < 0.3) r(lx + 4, y, wdt - 8, 1, 'x');       // hot near the lamp
    }
  }

  // ---- neon + city reflections on the wet asphalt ----
  for (let y = 176; y < 236; y += 3) {
    const j = (y * 7 + tick) % 3 - 1;
    r(19 + j, y, 3, 2, (y & 4) ? 'm' : 'M');            // magenta smear, left
    r(233 - j, y, 3, 2, (y & 4) ? 'b' : 'c');           // cyan smear, right
    if (y > 188) r(196 + j, y, 3, 1, 'g');              // trailer green
  }
  // puddle shimmer lines
  for (let i = 0; i < 10; i++) {
    const px = (i * 61 + ((tick >> 3) & 3) * 5) % 240, py = 176 + (i * 23) % 58;
    r(px, py, 8 + (i * 5) % 10, 1, bright ? 'C' : (i % 3 ? '1' : 'c'));
  }

  // ---- rain, in front of everything ----
  for (let i = 0; i < 80; i++) {
    const spd = 5 + (i % 3);
    const y = ((i * 61 + 13) + tick * spd) % 250 - 5;
    const x = (((i * 97 + 31) - (y >> 1)) % 256 + 256) % 256;
    r(x + 1, y, 1, 2, bright ? 'C' : ((i & 7) ? 'c' : 'C'));
    r(x, y + 2, 1, 2, bright ? 'c' : 'b');
  }

  // ---- poster vignette + title plate ----
  r(0, 0, 256, 3, '0'); r(0, 237, 256, 3, '0');
  r(0, 0, 3, 240, '0'); r(253, 0, 3, 240, '0');
  const plw = textWidth('SAN FRANCISCO 1986') + 10;
  const plx = (256 - plw) >> 1;
  r(plx - 2, 220, plw + 4, 16, '0');
  r(plx - 1, 221, plw + 2, 1, 'Y'); r(plx - 1, 234, plw + 2, 1, 'Y');
  r(plx - 1, 221, 1, 14, 'Y'); r(plx + plw, 221, 1, 14, 'Y');
  drawText(ctx, 'SAN FRANCISCO 1986', plx + 5, 225, P['x']);
}
