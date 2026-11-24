/* Dedicated raster-art adapter: roster keys 24–29 only. No balance or input changes. */
(function(root){
'use strict';
const base=root.KOFArt;
if(!base||root.KOFNewfaceRivals)return;
const allowed=new Set([24,25,26,27,28,29]), assets=new Map();
const registryURL=new URL('./assets/newface-rivals.json',document.currentScript.src);
const clamp=t=>Math.max(0,Math.min(1,t));
const load=url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url;});
const has=(d)=>d&&allowed.has(d.key);
const required=['idle','walk','jump','crouch','guard','hit','ko','win','evade','punch','kick','special','alt','super'];
function validFrame(f,im){
 return Array.isArray(f)&&f.length===6&&f.every(Number.isFinite)&&f.slice(0,4).every(Number.isInteger)&&f[0]>=0&&f[1]>=0&&f[2]>0&&f[3]>0&&f[0]+f[2]<=im.naturalWidth&&f[1]+f[3]<=im.naturalHeight&&f[4]>=0&&f[4]<=f[2]&&f[5]>=0&&f[5]<=f[3];
}
function select(d,f,frame,state,win){
 if(!f)return ['idle',(frame%48)/48];
 if(f.hp<=0)return ['ko',state==='outro'?clamp((115-(root.KOFDelay??115))/32):1];
 if(win)return ['win',(frame%60)/60];
 if(f.evade)return ['evade',clamp(1-f.evade/18)];
 if(f.stun)return ['hit',clamp(1-f.stun/20)];
 if(f.attack){const a=f.attack,k=a.key;let group=k==='super'?'super':k===d.kind?'special':['kick','mk','hk'].includes(k)?'kick':['punch','medium','heavy'].includes(k)?'punch':'alt';
 const t=a.t<a.start?.5*a.t/Math.max(1,a.start):a.t<=a.end?.5+.15*(a.t-a.start)/Math.max(1,a.end-a.start):.65+.35*(a.t-a.end)/Math.max(1,a.total-a.end);
 return [group,clamp(t)];}
 if(f.y<449)return ['jump',clamp((f.vy+13)/26)];
 if(f.guard)return ['guard',.5];
 if(f.crouch)return ['crouch',.5];
 return f.moving?['walk',(frame%28)/28]:['idle',(frame%48)/48];
}
async function init(){
 const res=await fetch(registryURL);if(!res.ok)throw Error('registry '+res.status);
 const data=await res.json();if(data.schema!==1)throw Error('unsupported registry schema');
 await Promise.all(Object.entries(data.characters||{}).map(async ([id,p])=>{
 const key=Number(id);if(!allowed.has(key)||p.enabled!==true)return;
 try{
 const [portrait,atlas]=await Promise.all([load(new URL(p.portrait,registryURL)),load(new URL(p.atlas,registryURL))]);
 if(portrait.naturalHeight<768||!Number.isFinite(p.displayHeight)||p.displayHeight<100||p.displayHeight>300)throw Error('invalid image dimensions');
 if(!required.every(a=>Array.isArray(p.frames?.[a])&&p.frames[a].length>=2&&p.frames[a].every(f=>validFrame(f,atlas))))throw Error('missing/invalid frames');
 assets.set(key,{...p,portrait,atlas});
 for(const im of document.querySelectorAll('.team-art img'))if(im.alt===p.name)im.src=portrait.src;
 }catch(err){console.warn('KOF raster art unavailable for key '+key,err);}
 }));
}
const ready=init().catch(err=>console.warn('KOF newface/rivals art registry unavailable',err));
function draw(c,d,x,y,face,f,scale,frame,state,win){
 const a=has(d)&&assets.get(d.key);
 if(!a)return base.draw(c,d,x,y,face,f,scale,frame,state,win);
 const [action,t]=select(d,f,frame,state,win),seq=a.frames[action];
 if(!seq?.length)return base.draw(c,d,x,y,face,f,scale,frame,state,win);
 const rect=seq[Math.min(seq.length-1,Math.floor(t*seq.length))];
 const [sx,sy,sw,sh,ax,ay]=rect;
 // All frames use a shared source-pixel scale, so changing bounds cannot resize a fighter.
 const reference=a.frames.idle[0][3],ratio=a.displayHeight/reference*scale;
 c.save();c.translate(x,y);c.scale(face,1);c.imageSmoothingEnabled=true;
 c.drawImage(a.atlas,sx,sy,sw,sh,-ax*ratio,-ay*ratio,sw*ratio,sh*ratio);c.restore();return true;
}
root.KOFArt={...base,draw,portrait:d=>has(d)&&assets.has(d.key)?assets.get(d.key).portrait.src:base.portrait(d),
 preload:list=>Promise.all([base.preload(list),ready])};
root.KOFNewfaceRivals=Object.freeze({ready,hasAsset:key=>allowed.has(key)&&assets.has(key),select});
})(window);
