# BIG TROUBLE IN LITTLE CHINA — NES beat-em-up. Shared spec.

Target: pixel-perfect NES look. Logical resolution **256x240**, upscaled with nearest-neighbor.
All colors MUST come from `js/palette.js` PALETTE keys. `.` = transparent pixel.

## Sprite frame format
A frame is an array of equal-length strings; each char is a PALETTE key or `.`.
Anchor = bottom-center of the grid (feet on the floor line).
Heroes/enemies: grid **32 wide x 48 tall max** (smaller is fine, e.g. 24x44 like NES Double Dragon).
Draw with strong black (`0`) outlines, 2-3 shade ramps per material, NES-era anti-detail (no noise).
Quality bar: NES Double Dragon II sprites. Readable silhouette, correct anatomy, weight in the poses.

## Files each agent owns
- `js/data/heroSprites.js` → `export const HEROES = { jack: {...}, wang: {...} }`
- `js/data/enemySprites.js` → `export const ENEMIES = { thug:{}, blade:{}, lord:{}, thunder:{}, rain:{}, lightning:{}, lopan_old:{}, lopan:{} }`
- `js/data/levels.js` → `export const LEVELS = [...]` (see below)
- `js/audio.js` → `export const Audio = {...}` (see below)
- `js/data/story.js` → `export const STORY = {...}`

## Character entry shape
```js
{
  name: 'JACK',            // display name
  frames: {
    idle:      [F, F],      // 2 frames, subtle breathing
    walk:      [F, F, F, F],// 4-frame cycle
    punch:     [F, F, F],   // windup, hit (extended fist), recover
    kick:      [F, F, F],
    jump:      [F],
    jumpkick:  [F],
    hurt:      [F],
    knockdown: [F],         // lying on ground
    special:   [F, F, F],   // optional (bosses: their signature attack)
  },
}
```
Every frameset above is REQUIRED for heroes; enemies need idle/walk/punch/hurt/knockdown minimum (bosses add `special`).

## Levels format (`js/data/levels.js`)
```js
export const LEVELS = [
  {
    id: 'street', name: 'CHINATOWN', lengthPx: 1536,   // scroll length
    floorTop: 168, floorBottom: 224,                    // walkable y band (feet)
    song: 'street',
    layers: [   // painted back→front. Each draws ONCE into an offscreen canvas.
      { width: 512,  speed: 0.25, y: 0, draw(ctx, w, h, P) {...} }, // P = PALETTE
      { width: 1536, speed: 1.0,  y: 0, draw(ctx, w, h, P) {...} }, // main ground layer, full length
    ],
  },
  ...
]
```
`draw` uses plain canvas 2D `fillRect` etc. but ONLY palette colors, pixel-aligned integer rects (this is pixel art, no gradients/curves/alpha). 4 levels: `street` (Chinatown night, neon signs, rain-slick), `warehouse` (Wing Kong Exchange), `sewers` (underworld caverns, green glow), `lair` (Lo Pan's golden temple lair).

## Audio (`js/audio.js`) — WebAudio chiptune, 2A03-style: 2 square waves, triangle bass, noise percussion.
```js
export const Audio = {
  init(),                 // create AudioContext (call on first user gesture)
  playSong(id),           // 'title','street','warehouse','sewers','lair','boss','victory','gameover' — looping
  stopSong(),
  sfx(name),              // 'punch','kick','hit','knockdown','jump','enemydown','select','dialog','thunder','pickup'
}
```
Songs are pattern-sequenced (tempo ~150-170bpm, minor pentatonic/Asian-inflected melodies for the theme). Must sound like a real NES soundtrack, not beeps.

## Story (`js/data/story.js`)
```js
export const STORY = {
  intro: [{speaker:'JACK', text:'...'}, ...],       // title crawl dialogue
  preLevel:  { street:[...], warehouse:[...], sewers:[...], lair:[...] },
  postBoss:  { street:[...], warehouse:[...], sewers:[...], lair:[...] },
  ending: [...],
  gameover: [...],
}
```
Text uppercase A-Z 0-9 .,!?'- only (bitmap font). Max 30 chars/line, max 3 lines per entry, split into multiple entries as needed. Voice: the movie — Jack's cocky trucker bravado ("IT'S ALL IN THE REFLEXES"), Wang, Gracie Law, Egg Shen, Lo Pan's menace. Plot: Miao Yin kidnapped at airport → Wing Kong Exchange → the Three Storms → underworld → defeat Lo Pan before the wedding.
