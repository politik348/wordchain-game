# New Face / rivals raster-art handoff (keys 24–29)

Status: adapter and registry only. Production raster assets have NOT been committed. Keep `enabled: false` until each character has a consistent, transparent, validated portrait and battle atlas.

| Key | Fighter | Existing species | Art direction | Existing moves |
|---|---|---|---|---|
| 24 | 나나카세 야시로 | 회색늑대 | red jacket / pale pants / heavy broad stance | 미사일 마이트 배시; 제트 카운터; 파이널 임팩트 |
| 25 | 셸미 | 스라소니 | magenta jacket / eye-covering hair / flexible grappler | 셸미 스파이럴; 셸미 휩; 셸미 플래시 |
| 26 | 크리스 | 다람쥐 | blue shirt / light trousers / small agile silhouette | 슬라이드 터치; 헌팅 에어; 체인 슬라이드 터치 |
| 27 | 야가미 이오리 | 흑늑대 | red swept fringe / dark jacket / white shirt tails / red trousers | 어둠쫓기; 귀신태우기; 팔치녀 |
| 28 | 야부키 신고 | 진돗개 | blue school uniform / white headband / gloves | 황물기 미완성; 신고 킥; 버닝 신고 |
| 29 | ’94 쿄 | 호랑이 | black school uniform / white headband / gold buttons / distinct silhouette | 어둠쫓기; 귀신태우기; 대사치 |

## Required production files

For each slug, under `public/kof97/assets/characters/<slug>/`: `portrait.png` (minimum 768 px height, recommended 1080+); `battle.png` (RGBA, no text, no background). Use the exact character appearance in every frame. 

Registry `assets/newface-rivals.json` describes exact source rectangles and foot/ground pivot: `[x,y,width,height,anchorX,anchorY]`. Preserve constant source scale across all poses. Provide idle (6), walk (8), jump (6), crouch (3), guard (3), hit (5), KO (6), win (6), evade (6), punch (6), kick (6), special (10+), alt (10+), super (16+) distinct authored frames. The runtime requires at least two valid frames for every action, but that is only a technical minimum, not the art acceptance target.

Only register keys 24–29. No edits to the original Kyo (0), awakened variants, or other groups. No game balancing/input changes. Existing procedural rendering remains the fallback if any asset is missing or invalid. Verify both facings, floor pivots, attack startup/active/recovery, selection thumbnails and actual battle playback before enabling an entry.
