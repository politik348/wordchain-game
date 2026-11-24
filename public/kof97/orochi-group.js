/* Animal Edition: scoped visual and move layer for roster keys 30–35.
 * Generated art is not bundled; existing vector art remains the fallback.
 */
(function(root){
'use strict';
const profiles=Object.freeze({
  30:{slug:'wild-iori',color:'#ff3e6f',core:'#ffe3ed',type:'claw',moves:{dash:[6,20,36,126,105],upper:[7,19,39,132,91],super:[12,35,58,260,150]}},
  31:{slug:'wild-leona',color:'#68a8ff',core:'#e8f8ff',type:'crescent',moves:{dash:[7,18,33,124,108],upper:[5,18,34,140,95],super:[10,29,52,250,170]}},
  32:{slug:'orochi-yashiro',color:'#d5a77a',core:'#fff1c9',type:'earth',moves:{grab:[8,11,39,152,88],upper:[11,21,42,142,108],super:[13,29,62,280,95]}},
  33:{slug:'orochi-shermie',color:'#c09aff',core:'#f5efff',type:'lightning',moves:{electric:[9,28,45,42,132],upper:[8,22,40,132,112],super:[15,37,61,260,175]}},
  34:{slug:'orochi-chris',color:'#a43cff',core:'#fbe4ff',type:'flame',moves:{shot:[9,10,30,112,64],upper:[7,21,38,132,100],super:[12,35,57,260,182]}},
  35:{slug:'orochi',color:'#f0f6ff',core:'#ffffff',type:'divine',moves:{shot:[13,14,36,122,65],dash:[12,23,41,140,108],super:[20,40,74,310,215]}}
});
const get=d=>profiles[d?.key]||null;
const timing=(d,k)=>get(d)?.moves[k]||null;
const clamp=x=>Math.max(0,Math.min(1,x));
const atlas=new Map();
function register(d,asset){
 const p=get(d);if(!p||!asset?.portrait||!asset?.src||!asset?.frames||!Number.isInteger(asset.columns)||asset.columns<1||!Number.isInteger(asset.width)||asset.width<1||!Number.isInteger(asset.height)||asset.height<1)return false;
 const im=new Image(),portrait=new Image();im.src=asset.src;portrait.src=asset.portrait;atlas.set(d.key,{...asset,im,portrait});return true;
}
function ready(im){return !!(im&&im.complete&&im.naturalWidth>0);}
function portrait(d){const a=atlas.get(d.key);return ready(a?.portrait)?a.portrait.src:null;}
function choose(f,frame,win){
 if(!f)return ['idle',(frame%40)/40];
 if(f.hp<=0)return ['ko',1];
 if(win)return ['win',(frame%60)/60];
 if(f.stun)return ['hit',clamp(1-f.stun/32)];
 if(f.evade)return ['evade',clamp(1-f.evade/18)];
 if(f.attack){const a=f.attack,k=a.key;const group=k==='super'?'super':k==='upper'?'upper':k==='grab'?'grab':['dash','shot','charge','electric','long','spin','flurry'].includes(k)?'special':['kick','mk','hk'].includes(k)?'kick':'punch';return [group,clamp(a.t/Math.max(1,a.total))];}
 if(f.y<449)return ['jump',clamp((f.vy+13)/26)];
 if(f.guard)return ['guard',.5];
 if(f.crouch)return ['crouch',.5];
 return f.moving?['walk',(frame%28)/28]:['idle',(frame%40)/40];
}
function draw(c,d,x,y,face,f,scale,frame,win){
 const a=atlas.get(d.key);if(!ready(a?.im))return false;
 const [group,t]=choose(f,frame,win),seq=a.frames[group]||a.frames.idle;
 if(!Array.isArray(seq)||!seq.length)return false;
 const i=seq[Math.min(seq.length-1,Math.floor(t*seq.length))],sx=(i%a.columns)*a.width,sy=Math.floor(i/a.columns)*a.height;
 if(!Number.isInteger(i)||i<0||sx+a.width>a.im.naturalWidth||sy+a.height>a.im.naturalHeight)return false;
 const size=260*scale,wide=size*a.width/a.height;
 c.save();c.translate(x,y);c.scale(face,1);c.imageSmoothingEnabled=true;c.drawImage(a.im,sx,sy,a.width,a.height,-wide*.5,-size*(a.anchorY??.93),wide,size);c.restore();return true;
}
function arc(c,x,y,r,a,b){c.beginPath();c.arc(x,y,r,a,b);c.stroke();}
function effects(c,f,frame,layer){
 const p=get(f?.d);if(!p||f.hp<=0)return;
 const a=f.attack,active=a&&a.t>=a.start&&a.t<=a.end,superMove=a?.key==='super',special=a&&['dash','upper','grab','shot','electric','super'].includes(a.key);
 const phase=a?clamp((a.t-a.start)/Math.max(1,a.end-a.start)):0;
 c.save();c.translate(f.x,f.y);c.scale(f.face||1,1);c.globalCompositeOperation='lighter';
 c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=8;c.lineCap='round';
 if(layer==='back'){
   c.globalAlpha=.18+.06*Math.sin(frame*.13);c.lineWidth=2;
   const radius=p.type==='divine'?76:48;
   c.beginPath();c.ellipse(0,-3,radius,10,0,0,Math.PI*2);c.stroke();
   for(let i=0;i<5;i++){const t=frame*.035+i*1.26;c.globalAlpha=.12+.12*(1+Math.sin(t));c.beginPath();c.ellipse(Math.cos(t)*radius,-35-((frame+i*19)%100),3,10,Math.sin(t)*.25,0,Math.PI*2);c.fill();}
   if(p.type==='divine'){c.globalAlpha=.21;c.lineWidth=2;arc(c,0,-151,69,0,Math.PI*2);arc(c,0,-151,57,frame*.012,frame*.012+4.8);}
 }else if(active&&special){
   c.globalAlpha=.8*(.65+.35*Math.sin(Math.PI*phase));c.lineWidth=superMove?6:3;
   if(p.type==='claw'){for(let i=0;i<(superMove?5:3);i++)arc(c,26+i*8,-102+i*8,53+i*8,-1.6+phase*.8,0.8+phase*.8);}
   else if(p.type==='crescent'){for(let i=0;i<2;i++){arc(c,44,-97,56+i*9,-1.9+phase*1.7,1.1+phase*1.7);if(superMove)arc(c,48,-97,72+i*8,.1-phase*1.2,2.8-phase*1.2);}}
   else if(p.type==='earth'){for(let i=0;i<6;i++){let x=12+i*15;c.beginPath();c.moveTo(x,0);c.lineTo(x-6,-14-i%3*12);c.lineTo(x+9,-5);c.stroke();}c.beginPath();c.ellipse(37,0,44+phase*65,9+phase*7,0,0,Math.PI*2);c.stroke();}
   else if(p.type==='lightning'){for(let j=0;j<(superMove?5:3);j++){c.beginPath();c.moveTo(32+j*9,-160);for(let i=1;i<=6;i++)c.lineTo(32+j*12+Math.sin(i*6.7+frame*.9+j)*18,-160+i*24);c.stroke();}}
   else if(p.type==='flame'){for(let j=0;j<4;j++){const x=37+j*17;c.beginPath();c.moveTo(x,0);c.quadraticCurveTo(x-20,-35,x+2,-65-(superMove?35:0)*Math.sin(phase*Math.PI));c.quadraticCurveTo(x+16,-32,x+5,0);c.fill();}}
   else {c.lineWidth=superMove?5:3;for(let j=0;j<3;j++)arc(c,40,-100,(superMove?42:24)+j*18+phase*25,0,Math.PI*2);c.globalAlpha=.35;c.fillStyle=p.core;c.fillRect(36,-160,superMove?145:45,5);}
 }
 c.restore();
}
root.KOFOrochiGroup=Object.freeze({get,timing,register,portrait,draw,effects,projectileColor:d=>get(d)?.color||null});
})(window);
