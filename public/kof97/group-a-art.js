/* KOF97 group A: keys 10–16 only. Final raster assets are optional;
   draft sheets can be enabled explicitly for available poses; missing actions retain the existing renderer. */
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
const registry=new URL('./assets/group-a/manifest.json?v=2',document.currentScript.src);
const cache=new Map(),clamp=t=>Math.max(0,Math.min(1,t)),get=d=>profiles[d?.key]||null;
function load(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('image unavailable'));im.src=url.href;});}
function validFrame(f,im){return Array.isArray(f)&&f.length===6&&f.every(Number.isFinite)&&f[0]>=0&&f[1]>=0&&f[2]>0&&f[3]>0&&f[0]+f[2]<=im.naturalWidth&&f[1]+f[3]<=im.naturalHeight&&f[4]>=0&&f[4]<=f[2]&&f[5]>=0&&f[5]<=f[3]}
function validAtlas(p,im){return p.spriteEnabled===true&&p.draft!==true&&Number.isFinite(p.pixelsPerBody)&&p.pixelsPerBody>0&&required.every(a=>Array.isArray(p.frames?.[a])&&p.frames[a].length>=2&&p.frames[a].every(f=>validFrame(f,im)));}
function validPreview(p,im){return p.previewEnabled===true&&p.draft===true&&Number.isFinite(p.pixelsPerBody)&&p.pixelsPerBody>0&&Object.keys(p.frames||{}).length>0&&Object.entries(p.frames).every(([a,seq])=>required.includes(a)&&Array.isArray(seq)&&seq.length>0&&seq.every(f=>validFrame(f,im)));}
async function init(){
const r=await fetch(registry);if(!r.ok)throw Error('registry unavailable');const data=await r.json();if(data.schema!==1)throw Error('schema');
await Promise.all(Object.entries(data.characters||{}).map(async ([key,p])=>{key=Number(key);const pr=profiles[key];if(!pr||p.slug!==pr.slug)return;
const entry={portrait:null,atlas:null,frames:null,pixelsPerBody:0};cache.set(key,entry);
const dir=new URL(pr.slug+'/',registry);
if(p.portraitEnabled===true&&typeof p.portrait==='string'){try{const im=await load(new URL(p.portrait,dir));if(im.naturalHeight>=768){entry.portrait=im;for(const el of document.querySelectorAll('.team-art img'))if(el.alt===pr.name)el.src=im.src;}}catch(e){console.warn('Group A portrait unavailable',key)}}
if((p.spriteEnabled===true&&p.draft!==true||p.previewEnabled===true&&p.draft===true)&&typeof p.atlas==='string'){try{const im=await load(new URL(p.atlas,dir));if(!validAtlas(p,im)&&!validPreview(p,im))throw Error('invalid atlas');Object.assign(entry,{atlas:im,frames:p.frames,pixelsPerBody:p.pixelsPerBody,draft:p.draft===true});}catch(e){console.warn('Group A combat atlas unavailable',key)}}
}));return [...cache.keys()];
}
function pose(d,f,frame,state,win){if(!f)return ['idle',(frame%48)/48];if(f.hp<=0)return ['ko',state==='outro'?clamp((115-(root.KOFDelay??115))/32):1];if(win)return ['win',(frame%60)/60];if(f.evade)return ['evade',clamp(1-f.evade/18)];if(f.stun)return ['hit',clamp(1-f.stun/20)];if(f.attack){const q=f.attack,k=q.key;const a=k==='super'?'super':q.artIntent==='alt'?'alt':q.artIntent==='special'?'special':['kick','mk','hk'].includes(k)?'kick':k==='grab'?'grab':['punch','medium','heavy'].includes(k)?'punch':k===d.kind?'special':'alt';const t=q.t<q.start?.32*q.t/Math.max(1,q.start):q.t<=q.end?.32+.40*(q.t-q.start)/Math.max(1,q.end-q.start):.72+.28*(q.t-q.end)/Math.max(1,q.total-q.end);return[a,clamp(t)];}if(f.y<449)return ['jump',clamp((f.vy+13)/26)];if(f.guard)return ['guard',.5];if(f.crouch)return ['crouch',.5];return f.moving?['walk',(frame%28)/28]:['idle',(frame%48)/48];}
// Preview-only motion: reuse drawn poses without falsely marking them as final frames.
function previewMotion(d,a,t,seqs){
 const pick=(...names)=>names.find(n=>seqs[n]?.length);
 const direct=seqs[a]?.length?a:null;
 let use=direct,angle=0,dx=0,dy=0,sx=1,sy=1;
 const wave=Math.sin(t*Math.PI*2),pulse=Math.sin(t*Math.PI);
 if(a==='idle'){use=pick('idle');sy=1+wave*.012;}
 else if(a==='walk'){use=pick('walk','idle');dx=wave*3;dy=-Math.abs(wave)*3;angle=wave*.025;}
 else if(a==='hit'){use=pick('guard','idle');angle=-.16*pulse;dx=-9*pulse;sy=1-.03*pulse;}
 else if(a==='ko'){use=pick('idle','crouch');angle=-Math.min(1,t*1.4)*Math.PI/2;dx=-Math.min(1,t*1.4)*20;}
 else if(a==='evade'){use=pick('crouch','guard','idle');angle=Math.sin(t*Math.PI*2)*.17;sy=1-.09*pulse;}
 else if(a==='grab'){use=pick('special','punch','idle');dx=6*pulse;}
 else if(a==='alt'){use=d.key===16?pick('kick','special','idle'):d.key===11?pick('special','punch','idle'):d.key===14?pick('punch','special','idle'):d.key===15?pick('special','kick','idle'):d.key===10?pick('punch','special','idle'):pick('special','punch','idle');dx=5*pulse;angle=-.035*pulse;}
 else if(a==='super'){use=pick('special','kick','punch','idle');dx=7*pulse;sy=1+.025*pulse;}
 else if(!use)use=pick('idle');
 return{use,angle,dx,dy,sx,sy};
}
function draw(c,d,x,y,face,f,scale,frame,state,win){
 const p=get(d),e=p&&cache.get(d.key);if(!e?.atlas)return false;
 const [a,t]=pose(d,f,frame,state,win),v=e.draft?previewMotion(d,a,t,e.frames):{use:a,angle:0,dx:0,dy:0,sx:1,sy:1};const seq=e.frames[v.use];if(!seq?.length)return false;
 // In three-pose attack previews the active drawing is held across the hit window.
 let i=Math.min(seq.length-1,Math.floor(t*seq.length));if(e.draft&&seq.length===3&&f?.attack){const q=f.attack;i=q.t<q.start?0:q.t<=q.end?1:2;}
 const r=seq[i],z=p.height/e.pixelsPerBody*scale;
 c.save();try{c.translate(x,y);c.scale(face,1);c.translate(v.dx,v.dy);c.rotate(v.angle);c.scale(v.sx,v.sy);c.imageSmoothingEnabled=true;c.drawImage(e.atlas,r[0],r[1],r[2],r[3],-r[4]*z,-r[5]*z,r[2]*z,r[3]*z);}finally{c.restore()}return true;
}
function projectile(c,s,frame){
 const p=get(s.owner?.d),k=s.owner?.d?.key;if(!p||![12,13,15,16].includes(k))return false;
 const pr=s.a?.orochi?.projectile;if(!pr)return false;const rx=pr.radiusX,ry=pr.radiusY;
 c.save();try{c.translate(s.x,s.y);c.scale(s.v<0?-1:1,1);c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=12;
 const ellipse=(x,y,a,b,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,a,b,0,0,Math.PI*2);c.fill()};
 if(k===12){ellipse(-rx*.6,0,rx*1.25,ry*.73,'#a64fe166');ellipse(0,0,rx,ry,p.color);ellipse(0,0,rx*.56,ry*.56,'#fff3ff');c.strokeStyle='#ffffffb0';c.lineWidth=2;c.beginPath();c.arc(0,0,rx*.85,frame*.22,frame*.22+Math.PI*1.4);c.stroke();}
 else if(k===13){ellipse(-rx*.8,0,rx*1.2,ry*.58,'#47b8ff66');ellipse(0,0,rx,ry,'#58d9ff');ellipse(rx*.17,0,rx*.55,ry*.5,'#efffff');c.strokeStyle='#d4f8ff';c.lineWidth=3;c.beginPath();c.ellipse(0,0,rx*.91,ry*.84,0,-1.2,1.2);c.stroke();}
 else if(k===15){c.rotate(Math.sin(frame*.35)*.55);c.shadowBlur=8;c.fillStyle='#fff2ce';c.beginPath();c.moveTo(-rx*.65,0);c.arc(-rx*.65,0,rx*1.58,-.68,.68);c.closePath();c.fill();c.strokeStyle='#bd3042';c.lineWidth=2.5;c.stroke();for(let j=-3;j<=3;j++){c.beginPath();c.moveTo(-rx*.65,0);c.lineTo(-rx*.65+Math.cos(j*.19)*rx*1.52,Math.sin(j*.19)*rx*1.52);c.stroke();}}
 else {c.fillStyle=p.color;c.beginPath();c.ellipse(0,0,rx,ry,0,-1.4,1.4);c.quadraticCurveTo(rx*.05,0,rx*Math.cos(-1.4),ry*Math.sin(-1.4));c.closePath();c.fill();c.strokeStyle='#f6e7ff';c.lineWidth=3;c.stroke();}
 }finally{c.restore()}return true;
}
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
root.KOFGroupA=Object.freeze({profiles,get,pose,draw,previewMotion,projectile,validAtlas,validPreview,ready,timing:(d,k)=>get(d)?.moves[k]||null,effects,projectileColor:d=>get(d)?.color||null,hasPortrait:key=>!!cache.get(key)?.portrait,hasAtlas:key=>!!cache.get(key)?.atlas});
})(window);
