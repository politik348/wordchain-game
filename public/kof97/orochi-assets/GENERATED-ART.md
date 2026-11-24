# Orochi group — generated artwork import

Only roster keys 30–35. Six full-resolution 1086×1448 WebP portraits; three 1280×1280 (8×8, 160 px cells) draft combat atlases; one rejected Chris sheet archived for review. Original animal roster metadata unchanged; generated portrait design species differ for some characters. No claims of final arcade-quality motion. Approximate frame mappings reuse poses for upper/grab/evade where dedicated sprites are absent. IDs 32–34 retain their existing vector combat atlases until matching sheets exist. Orochi matte alpha was reduced. Existing SVG files retained. Verify on deployed browser: selection portraits, each action, left/right facing, KO, super, alpha fringes, foot anchoring, hitbox alignment and performance.

## Combat QA update

Open `/kof97/?orochiDebug=1`, select training mode, and choose one of keys 30–35. Green rectangles show hurtboxes, red active attack/projectile rectangles, amber consumed hit windows. Labels show the active move and simulation frame. Compare visible limbs/effects with the rectangles on both sides of the stage. Projectile sizes and collision geometry are aligned in code; sprite-by-sprite visual calibration is still required.

Run `node --test test/kof97-orochi-combat.test.mjs test/kof97-orochi-engine.test.mjs` from the repository root. The engine test extracts the actual combat functions from the game and runs all 18 special/alternate/super moves, plus projectile immunity/clash, attack phase monotonicity, and sustained guard. This is not a live browser playtest or final balance certification.

The latest generated human-form draft sheets do not match the animal portraits, and are not registered or uploaded as combat assets. IDs 32–34 continue to use the existing SVG atlases; no misleading final-art claim is made. Existing roster metadata differs from some registered artwork and was not changed.
