# Big Trouble in Little China — 8-bit NES Brawler

A NES-style side-scrolling beat-em-up in the spirit of Double Dragon, based on the
*Big Trouble in Little China* (1986) storyline. Built with Three.js at a true
256x240 logical resolution with an NES palette, upscaled with nearest-neighbor.

Play as Jack Burton or Wang Chi. Fight the Lords of Death through 4 stages —
Chinatown, the Wing Kong Exchange, the underworld, and Lo Pan's lair — with the
Three Storms as bosses and Lo Pan waiting at the end. Chiptune soundtrack,
cutscenes, the works. It's all in the reflexes.

## Run it

Requires Node (for `npm install`) and Python 3.

```bash
npm install
python3 server.py
```

Then open http://localhost:8130

(`server.py` is a no-cache static server on port 8130 — any static file server
works, but a caching one can serve stale art after you edit sprites.)

## Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move |
| Z or J | Punch (confirm in menus/dialog) |
| X or K | Kick |
| C or Space | Jump (attack mid-air = jump kick) |
| Down + punch | Special attack |
| Enter | Start / pause |

## Debug URL parameters

Jump anywhere for testing: `http://localhost:8130/?stage=3&quick&wave=3&x=1200`

- `stage=1..4` — boot straight into a stage
- `hero=wang` — play Wang (default Jack)
- `quick` — skip dialogs, splash, and long stage cards
- `wave=K` — skip the first K enemy waves (boss waves trigger at x>1240)
- `x=N` — start the player at world position N

With `?stage=` set, `window.__dbg` (live game state) and `window.__step(n)`
(manual frame stepper, useful when the tab is hidden and rAF is paused) are
exposed for headless QA.

## Project layout

- `js/engine.js` — Three.js pixel renderer, input, sprite/background plumbing
- `js/main.js` — game states, combat, AI, waves, HUD, cutscenes
- `js/audio.js` — WebAudio chiptune engine (2A03-style: 2 squares, triangle, noise)
- `js/data/` — all art and story as data: sprites are text grids of palette
  characters (see `SPEC.md`), levels are procedural canvas painters
- `SPEC.md` — the shared spec the art was built against
