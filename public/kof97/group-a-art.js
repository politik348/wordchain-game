/* KOF97 group A: keys 10–16 only. Final raster assets are optional;
   draft sheets must never silently replace the current combat renderer. */
(function(root){
'use strict';
const base=root.KOFArt;
if(!base||root.KOFGroupA)return;
const profiles=Object.freeze({
10:{slug:'10-ralf',name:'랄프 존스',height:230,color:'#ffb05a',fx:'barrage',moves:{flurry:[5,29,44,38,105],upper:[9,20,40,135,94],super:[12,35,60,268,130]}},
11:{slug:'11-clark',name:'클락 스틸',height:235,color:'#a8ceff',fx:'grapple',moves:{grab:[7,11,39,145,84],upper:[8,19,39,137,90],super:[14,31,61,285,82]}},
12:{slug:'12-athena',name:'아사미야 아테나',height:210,color:'#ec7aff',fx:'psycho',moves:{shot:[9,10,31,101,60],upper:[6,18,36,129,86],super:[15,32,56,255,147]}},
13:{slug:'13-kensou',name:'시이 켄수',height:204,color:'#74dfff',fx:'dragon',moves:{shot:[10,11,33,105,60],upper:[6,17,35,131,85],super:[12,34,55,252,140]}},
14:{slug:'14-chin',name:'친 겐사이',height:180,color:'#ffb34d',fx:'gourd',moves:{long:[11,19,35,103,200],upper:[9,20,40,126,90],super:[16,34,58,257,151]}},
15:{slug:'15-mai',name:'시라누이 마이',height:215,color:'#ff8052',fx:'fan',moves:{shot:[9,10,32,100,60],upper:[7,19,38,125,92],super:[12,31,54,248,155]}},
16:{slug:'16-king',name:'킹',height:222,color:'#c59bff',fx:'kick',moves:{shot:[10,11,32,107,60],upper:[7,18,38,130,100],super:[12,32,57,259,149]}}
});
const required=['idle','walk','jump','crouch','guard','hit','ko','win','evade','punch','kick','grab','special','alt','super'];
const registry=new URL('./assets/group-a/manifest.json',document.currentScript.src);
const cache=new Map(),clamp=t=>Math.max(0,Math.min(1,t)),get=d=>profiles[d?.key]||null;
function load(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('image unavailable'));im.src=url.href;});}
function validFrame(f,im){return Array.isArray(f)&&f.length===6&&f.every(Number.isFinite)&&f[0]>=0&&f[1]>=0&&f[2]>0&&f[3]>0&&f[0]+f[2]<=im.naturalWidth&&f[1]+f[3]<=im.naturalHeight&&f[4]>=0&&f[4]<=f[2]&&f[5]>=0&&f[5]<=f[3]}
function validAtlas(p,im){return p.spriteEnabled===true&&p.draft!==true&&Number.isFinite(p.pixelsPerBody)&&p.pixelsPerBody>0&&required.every(a=>Array.isArray(p.frames?.[a])&&p.frames[a].length>=2&&p.frames[a].every(f=>validFrame(f,im)));}
async function init(){
const r=await fetch(registry);if(!r.ok)throw Error('registry unavailable');const data=await r.json();if(data.schema!==1)throw Error('schema');
await Promise.all(Object.entries(data.characters||{}).map(async ([key,p])=>{key=Number(key);const pr=profiles[key];if(!pr||p.slug!==pr.slug)return;
const entry={portrait:null,atlas:null,frames:null,pixelsPerBody:0};cache.set(key,entry);
const dir=new URL(pr.slug+'/',registry);
if(p.portraitEnabled===true&&typeof p.portrait==='string'){try{const im=await load(new URL(p.portrait,dir));if(im.naturalHeight>=768){entry.portrait=im;for(const el of document.querySelectorAll('.team-art img'))if(el.alt===pr.name)el.src=im.src;}}catch(e){console.warn('Group A portrait unavailable',key)}}
if(p.spriteEnabled===true&&p.draft!==true&&typeof p.atlas==='string'){try{const im=await load(new URL(p.atlas,dir));if(!validAtlas(p,im))throw Error('invalid atlas');Object.assign(entry,{atlas:im,frames:p.frames,pixelsPerBody:p.pixelsPerBody});}catch(e){console.warn('Group A combat atlas unavailable',key)}}
}));return [...cache.keys()];
}
function pose(d,f,frame,state,win){if(!f)return ['idle',(frame%48)/48];if(f.hp<=0)return ['ko',state==='outro'?clamp((115-(root.KOFDelay??115))/32):1];if(win)return ['win',(frame%60)/60];if(f.evade)return ['evade',clamp(1-f.evade/18)];if(f.stun)return ['hit',clamp(1-f.stun/20)];if(f.attack){const q=f.attack,k=q.key;const a=k==='super'?'super':q.artIntent==='alt'?'alt':q.artIntent==='special'?'special':['kick','mk','hk'].includes(k)?'kick':k==='grab'?'grab':['punch','medium','heavy'].includes(k)?'punch':k===d.kind?'special':'alt';const t=q.t<q.start?.32*q.t/Math.max(1,q.start):q.t<=q.end?.32+.40*(q.t-q.start)/Math.max(1,q.end-q.start):.72+.28*(q.t-q.end)/Math.max(1,q.total-q.end);return[a,clamp(t)];}if(f.y<449)return ['jump',clamp((f.vy+13)/26)];if(f.guard)return ['guard',.5];if(f.crouch)return ['crouch',.5];return f.moving?['walk',(frame%28)/28]:['idle',(frame%48)/48];}
function draw(c,d,x,y,face,f,scale,frame,state,win){const p=get(d),e=p&&cache.get(d.key);if(!e?.atlas)return false;const [a,t]=pose(d,f,frame,state,win),seq=e.frames[a],r=seq[Math.min(seq.length-1,Math.floor(t*seq.length))],z=p.height/e.pixelsPerBody*scale;c.save();try{c.translate(x,y);c.scale(face,1);c.imageSmoothingEnabled=true;c.drawImage(e.atlas,r[0],r[1],r[2],r[3],-r[4]*z,-r[5]*z,r[2]*z,r[3]*z);}finally{c.restore()}return true;}
function effects(c,f,frame){const p=get(f.d),a=f.attack;if(!p||!a)return;const special=a.key==='super'||a.artIntent==='special'||a.artIntent==='alt'||!['punch','medium','heavy','kick','mk','hk','grab'].includes(a.key);if(!special||a.t<a.start||a.t>a.end)return;const sup=a.key==='super',t=clamp((a.t-a.start)/Math.max(1,a.end-a.start)),boost=sup?1.4:1;c.save();try{c.translate(f.x,f.y);c.scale(f.face,1);c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowBlur=sup?15:6;c.shadowColor=p.color;c.globalAlpha=.85;c.lineWidth=sup?5:3;
const arc=(x,y,r,start,end)=>{c.beginPath();c.arc(x,y,r,start,end);c.stroke()};
if(p.fx==='barrage'){for(let j=0;j<4;j++){let x=52+j*13,y=-112+Math.sin(frame*.8+j*2)*20;c.beginPath();c.moveTo(x-28,y);c.lineTo(x+22*boost,y);c.stroke()}}
else if(p.fx==='grapple'){for(let j=0;j<3;j++)arc(35,-95,34+j*12*boost,-1.9+t*1.8,1.4+t*1.8);}
else if(p.fx==='psycho'){for(let j=0;j<(sup?5:2);j++){let ang=frame*.19+j*Math.PI*2/(sup?5:2),x=38+Math.cos(ang)*55*boost,y=-100+Math.sin(ang)*50*boost;arc(x,y,8+j%2*5,0,Math.PI*2);}}
else if(p.fx==='dragon'){for(let j=0;j<3;j++)arc(45,-95,24+j*11*boost,-1.7+t*1.3,1.4+t*1.3);}
else if(p.fx==='gourd'){for(let j=0;j<5;j++){const x=36+j*13;c.beginPath();c.moveTo(x,-60);c.quadraticCurveTo(x-13,-98-j*3,x+8,-120-(sup?18:0));c.stroke();}}
else if(p.fx==='fan'){for(let j=0;j<4;j++)arc(40,-108,35+j*12*boost,-1.3+t*1.5,.8+t*1.5);}
else if(p.fx==='kick'){for(let j=0;j<3;j++)arc(43,-95,40+j*10*boost,-2.1+t*1.8,.3+t*1.8);}
}finally{c.restore()}}
const ready=init().catch(e=>{console.warn('Group A registry unavailable',e);return[]});
root.KOFArt={...base,draw(...args){return draw(...args)||base.draw(...args)},portrait(d){return cache.get(d?.key)?.portrait?.src||base.portrait(d)},preload(list){return Promise.all([base.preload(list),ready]);}};
root.KOFGroupA=Object.freeze({profiles,get,pose,draw,validAtlas,ready,timing:(d,k)=>get(d)?.moves[k]||null,effects,projectileColor:d=>get(d)?.color||null,hasPortrait:key=>!!cache.get(key)?.portrait,hasAtlas:key=>!!cache.get(key)?.atlas});
})(window);
