// Three.js pixel-perfect NES renderer: 256x240 logical, nearest-neighbor upscale.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const W = 256, H = 240;

export const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(W, H, false);
document.body.appendChild(renderer.domElement);

function fit() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  renderer.domElement.style.width = W * s + 'px';
  renderer.domElement.style.height = H * s + 'px';
}
addEventListener('resize', fit); fit();

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
// y-down 2D coords: (0,0) top-left, like canvas.
export const camera = new THREE.OrthographicCamera(0, W, 0, -H, -1000, 1000);
camera.position.z = 10;

// A quad whose local coords are top-left anchored, y-down.
const quadGeo = new THREE.PlaneGeometry(1, 1);
quadGeo.translate(0.5, -0.5, 0);

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Render a sprite frame (array of strings, palette chars) to a texture. Cached per frame array.
const frameCache = new Map();
export function frameTexture(rows) {
  if (frameCache.has(rows)) return frameCache.get(rows);
  const h = rows.length, w = rows[0].length;
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch !== '.' && PALETTE[ch]) { ctx.fillStyle = PALETTE[ch]; ctx.fillRect(x, y, 1, 1); }
  }
  const entry = { tex: canvasTexture(c), w, h };
  frameCache.set(rows, entry);
  return entry;
}

// Sprite mesh anchored at bottom-center of its frame.
export class Sprite {
  constructor() {
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.01 });
    this.mesh = new THREE.Mesh(quadGeo, this.mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.w = 0; this.h = 0;
  }
  setFrame(rows) {
    const f = frameTexture(rows);
    this.mat.map = f.tex; this.mat.needsUpdate = true;
    this.w = f.w; this.h = f.h;
  }
  // x,y = feet position in screen coords; flip mirrors horizontally.
  place(x, y, flip, z) {
    const m = this.mesh;
    m.visible = true;
    m.scale.set(flip ? -this.w : this.w, this.h, 1);
    m.position.set(Math.round(x) + (flip ? this.w / 2 : -this.w / 2), -(Math.round(y) - this.h), z);
  }
  hide() { this.mesh.visible = false; }
  set opacity(v) { this.mat.opacity = v; }
  dispose() { scene.remove(this.mesh); this.mat.dispose(); }
}

// Full-screen scrolling background layer using texture wrap.
export class BgLayer {
  constructor(layerDef, P) {
    const c = makeCanvas(layerDef.width, H);
    layerDef.draw(c.getContext('2d'), layerDef.width, H, P);
    this.tex = canvasTexture(c);
    this.tex.wrapS = THREE.RepeatWrapping;
    this.tex.repeat.x = W / layerDef.width;
    this.speed = layerDef.speed;
    this.width = layerDef.width;
    const mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true });
    this.mesh = new THREE.Mesh(quadGeo, mat);
    this.mesh.scale.set(W, H, 1);
    scene.add(this.mesh);
  }
  update(camX, z) {
    this.tex.offset.x = (camX * this.speed) / this.width;
    this.mesh.position.set(0, 0, z);
  }
  dispose() { scene.remove(this.mesh); this.mesh.material.dispose(); this.tex.dispose(); }
}

// HUD/overlay: a full-screen canvas redrawn each frame, glued in front of everything.
export const overlay = makeCanvas(W, H);
export const octx = overlay.getContext('2d');
const overlayTex = canvasTexture(overlay);
{
  const mat = new THREE.MeshBasicMaterial({ map: overlayTex, transparent: true });
  const m = new THREE.Mesh(quadGeo, mat);
  m.scale.set(W, H, 1);
  m.position.set(0, 0, 9);
  scene.add(m);
}
export function flushOverlay() { overlayTex.needsUpdate = true; }

// Input
export const keys = {};
export const pressed = {}; // edge-triggered, cleared each frame by game loop
function codeOf(e) { // some synthesized events lack e.code — derive it from e.key
  if (e.code) return e.code;
  const k = e.key;
  if (k === ' ') return 'Space';
  if (k && k.length === 1 && /[a-z]/i.test(k)) return 'Key' + k.toUpperCase();
  return k; // 'Enter', 'ArrowLeft', ...
}
addEventListener('keydown', e => {
  const c = codeOf(e);
  if (!e.repeat) pressed[c] = true;
  keys[c] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(c)) e.preventDefault();
});
addEventListener('keyup', e => { keys[codeOf(e)] = false; });

export function render() { renderer.render(scene, camera); }
