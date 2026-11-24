/* Animal Edition fan-game combat profiles. Not SNK's measured frame data.
 * Only roster keys 30–35; normal attacks and other roster members retain existing engine behavior.
 */
(function(root){
'use strict';
const move=(key,frame,boxes,extra={})=>({key,frame,boxes,...extra});
const M={
30:{special:move('shot',[11,12,36,105,70],[],{projectile:{speed:8,offsetY:-42,radiusX:30,radiusY:25,life:95},label:'어둠쫓기',art:'special'}),alt:move('dash',[7,25,41,42,105],[[7,10,8,-145,95,110],[15,18,12,-125,112,108],[23,25,14,-145,110,120]],{lunge:5,stun:15,label:'규화',art:'upper'}),super:move('super',[12,38,61,66,145],[[12,14,8,-145,130,120],[21,23,6,-155,145,130],[30,33,6,-150,145,125],[36,38,6,-145,155,125]],{lunge:4,stun:20,label:'팔치녀',art:'super'})},
31:{special:move('upper',[5,17,33,135,92],[[5,11,4,-215,88,180],[12,17,12,-160,83,120]],{single:true,label:'문 슬래셔',art:'upper'}),alt:move('dash',[8,20,36,120,115],[[8,20,8,-135,114,120]],{lunge:8,single:true,label:'그랜드 세이버',art:'special'}),super:move('super',[10,29,52,120,170],[[10,15,10,-195,155,165],[24,29,15,-150,165,135]],{lunge:5,stun:22,label:'V 슬래셔',art:'super'})},
32:{special:move('grab',[8,11,39,152,88],[[8,11,0,-140,76,120]],{grab:true,grounded:true,single:true,stun:34,push:10,label:'춤추는 대지',art:'grab'}),alt:move('upper',[13,23,45,138,155],[[13,23,0,-48,155,48]],{grounded:true,single:true,stun:22,push:7,label:'포효하는 대지',art:'special'}),super:move('super',[13,29,62,280,95],[[13,29,0,-150,90,138]],{grab:true,grounded:true,single:true,stun:44,push:13,label:'암흑지옥극락떨구기',art:'super'})},
33:{special:move('electric',[11,25,44,65,155],[[11,13,65,-210,135,205],[20,25,85,-210,125,205]],{stun:16,label:'무월의 뇌운',art:'special'}),alt:move('electric',[8,21,38,115,118],[[8,21,5,-165,145,125]],{single:true,label:'뇌신의 채찍',art:'upper'}),super:move('super',[15,37,61,86,175],[[15,19,25,-215,175,210],[24,28,35,-215,180,210],[33,37,45,-215,190,210]],{stun:21,label:'암흑뇌광권',art:'super'})},
34:{special:move('shot',[9,10,30,112,64],[],{projectile:{speed:9,offsetY:-82,radiusX:26,radiusY:35,life:100},label:'태양을 쏘는 화염',art:'special'}),alt:move('upper',[7,21,38,132,100],[[7,15,3,-215,95,170],[16,21,7,-160,100,125]],{single:true,launch:-8,label:'거울을 찢는 화염',art:'upper'}),super:move('super',[12,35,57,90,182],[[12,16,10,-155,160,145],[23,27,35,-175,175,165],[31,35,40,-190,185,180]],{stun:20,label:'암흑 대사치',art:'super'})},
35:{special:move('shot',[13,14,36,122,65],[],{projectile:{speed:10,offsetY:-105,radiusX:35,radiusY:45,life:110},label:'해제',art:'special'}),alt:move('dash',[12,23,41,140,108],[[12,23,0,-180,150,160]],{single:true,stun:20,label:'화란강',art:'upper'}),super:move('super',[20,40,74,150,215],[[20,23,-180,-250,540,250],[34,40,-180,-250,540,250]],{stun:28,push:8,label:'혼',art:'super'})}
};
const get=(d,intent)=>M[d?.key]?.[intent]||null;
const rect=(f,x,y,w,h)=>({l:f.x+(f.face===-1?-x-w:x),r:f.x+(f.face===-1?-x:x+w),t:f.y+y,b:f.y+y+h});
const hurt=f=>({l:f.x-(f.d?.key===32?36:27),r:f.x+(f.d?.key===32?36:27),t:f.y-(f.crouch?105:190),b:f.y-3});
const overlap=(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t;
function hit(f,o,a,floor){
 const m=a.orochi;if(!m||m.projectile||o.inv>0||o.hp<=0||(m.grounded&&o.y<floor-12))return false;
 if(m.single&&a.hitWindows?.length)return false;
 for(let i=0;i<m.boxes.length;i++){
  const [s,e,x,y,w,h]=m.boxes[i];if(a.t<s||a.t>e||a.hitWindows?.includes(i))continue;
  if(overlap(rect(f,x,y,w,h),hurt(o))){(a.hitWindows??=[]).push(i);return true;}
 }
 return false;
}
function projectileHit(s,o){const p=s.a.orochi?.projectile;if(!p)return null;return overlap({l:s.x-p.radiusX,r:s.x+p.radiusX,t:s.y-p.radiusY,b:s.y+p.radiusY},hurt(o));}
root.KOFOrochiCombat=Object.freeze({get,hit,projectileHit,hurt,rect,overlap});
})(typeof window==='undefined'?globalThis:window);
