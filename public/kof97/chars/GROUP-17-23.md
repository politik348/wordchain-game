# KOF97 — character raster pipeline, keys 17–23

**Status: procedural raster preview available for all seven; final hand-painted art not complete.**

The loader is deliberately opt-in and preserves existing rendering until a valid set of three files is available for a fighter. Do not mark a character ready without checking transparency, consistent animal species, separate frames, weapon continuity, feet anchors and playtesting.

| Key | Folder | Existing roster species | Signature motion brief |
|---|---|---|---|
| 17 | chizuru | 학 | Mirror-palm projection / fast illusion step / multiple afterimages |
| 18 | kim | 수리매 | Crescent kick / rising kick / phoenix kick chain |
| 19 | chang | 하마 | Iron ball orbit / crushing ball swing / rampaging ball sequence |
| 20 | choi | 족제비 | Rotating claw strike / aerial claw dive / claw tornado |
| 21 | yamazaki | 코브라 | Snake-arm lash / counter strike / guillotine |
| 22 | mary | 보더콜리 | Spin fall / vertical arrow / grappling typhoon |
| 23 | billy | 붉은여우 | Three-section staff thrust / spinning staff / flame staff whirlwind |

Each folder requires portrait.png (full body, transparent, no official logo or text), sprites.png (transparent packed atlas), and motions.json. The latter must contain version: 1, key: roster key, status: ready, pixelsPerBody: standing body height in source pixels, frames: [{x,y,w,h,ax,ay}], actions: {idle,walk,jump,crouch,guard,hit,ko,win,evade,punch,kick,grab,special,alt,super}. Every action has at least two frame indices; idle/walk loop, attacks map to startup/active/recovery. Use manually verified crop rectangles and feet anchors, never assume generated sheets have uniform cells. Match the current roster species and costume on every frame. Portrait, sprite and metadata must be committed together. Existing fight logic and other characters remain unchanged.

## Input routing and tests

The engine records artIntent only for these seven fighters, without changing damage, timing, movement, meter or collision behavior. Normal kick and normal grab remain separate from Kim's and Mary's same-key special actions. Alternate inputs (including cancel chains) select `alt` even if the existing engine uses a different underlying attack key. Species must match the roster exactly, and each action requires at least two distinct frame indices. Run `node --test tests/kof97-group-17-23.test.cjs` from the repository root for the adapter regression test.

## Raster preview

All seven assigned folders now contain real transparent indexed PNGs and 65-frame, 15-action manifests (455 total frame slots). These are newly painted procedural pixel prototypes, not final high-resolution illustrations. Preview mode is opt-in via `?raster1723=1` on the game URL. Existing default art is unchanged until each manifest is reviewed and changed from `preview` to `ready`. Review weapon/limb clipping, species and pose fidelity before promotion. Do not treat enlarged pixel portraits as final high-resolution paintings. No other fighter IDs are changed.
