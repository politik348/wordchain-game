/* Scoped raster asset adapter for KOF97 fighter keys 17–23 only.
   Missing or invalid art never replaces existing artwork. No combat rules changed. */
(function () {
  'use strict';
  const original = window.KOFArt;
  if (!original || window.KOFGroup1723) return;
  const base = new URL('./chars/', document.currentScript.src);
  const profiles = Object.freeze({
    17:{slug:'chizuru',name:'카구라 치즈루',species:'학',primary:'dash',alternate:'upper',moves:['천신의 리','신속의 축사','삼뢰의 포진'],height:225},
    18:{slug:'kim',name:'김갑환',species:'수리매',primary:'kick',alternate:'upper',moves:['반월참','비연참','봉황각'],height:225},
    19:{slug:'chang',name:'장거한',species:'하마',primary:'spin',alternate:'dash',moves:['철구대회전','철구분쇄격','철구대폭주'],height:240},
    20:{slug:'choi',name:'최번개',species:'족제비',primary:'dash',alternate:'upper',moves:['회전비원참','비상공열참','초절용권진공참'],height:165},
    21:{slug:'yamazaki',name:'야마자키 류지',species:'코브라',primary:'long',alternate:'dash',moves:['뱀술사','배로 갚기','길로틴'],height:232},
    22:{slug:'mary',name:'블루 마리',species:'보더콜리',primary:'grab',alternate:'upper',moves:['스핀 폴','버티컬 애로','M. 타이푼'],height:215},
    23:{slug:'billy',name:'빌리 칸',species:'붉은여우',primary:'long',alternate:'upper',moves:['삼절곤 중단치기','선풍곤','초화염선풍곤'],height:225}
  });
  const required=['idle','walk','jump','crouch','guard','hit','ko','win','evade','punch','kick','grab','special','alt','super'];
  const cache=new Map();
  const clamp=t=>Math.max(0,Math.min(1,t));
  function image(url){
    return new Promise((resolve,reject)=>{
      const im=new Image();
      im.onload=()=>resolve(im);im.onerror=reject;im.src=url.href;
    });
  }
  function valid(m,im){
    if(!m||m.version!==1||!m.frames||!m.actions)return false;
    return required.every(a=>Array.isArray(m.actions[a])&&m.actions[a].length>=2&&m.actions[a].every(i=>Number.isInteger(i)&&i>=0&&i<m.frames.length))&&
      m.frames.every(f=>f&&[f.x,f.y,f.w,f.h,f.ax,f.ay].every(Number.isFinite)&&f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=im.naturalWidth&&f.y+f.h<=im.naturalHeight&&f.ax>=0&&f.ax<=f.w&&f.ay>=0&&f.ay<=f.h)&&
      Number.isFinite(m.pixelsPerBody)&&m.pixelsPerBody>0;
  }
  function load(d){
    const p=profiles[d?.key];
    if(!p)return null;
    if(cache.has(d.key))return cache.get(d.key);
    const entry={ready:false,promise:null};
    cache.set(d.key,entry);
    const dir=new URL(p.slug+'/',base);
    entry.promise=(async()=>{
      try{
        const response=await fetch(new URL('motions.json',dir));
        if(!response.ok)return false;
        const m=await response.json();
        if(m.key!==d.key||m.status!=='ready')return false;
        const [atlas,portrait]=await Promise.all([image(new URL('sprites.png',dir)),image(new URL('portrait.png',dir))]);
        if(!valid(m,atlas))return false;
        Object.assign(entry,{ready:true,m,atlas,portrait});
        // Refresh only the existing portrait of this exact fighter.
        document.querySelectorAll('img').forEach(im=>{
          if(im.alt===d.name&&im.src===original.portrait(d))im.src=portrait.src;
        });
        return true;
      }catch{return false;}
    })();
    return entry;
  }
  function pose(d,f,frame,state,win){
    const p=profiles[d.key];
    let a='idle',t=(frame%48)/48;
    if(!f)return [a,t];
    if(f.hp<=0){a='ko';t=state==='outro'?clamp((115-(window.KOFDelay||115))/32):1;}
    else if(win){a='win';t=(frame%60)/60;}
    else if(f.evade){a='evade';t=1-f.evade/18;}
    else if(f.stun){a='hit';t=1-clamp(f.stun/24);}
    else if(f.attack){
      const q=f.attack,k=q.key;
      a=k==='super'?'super':k===p.alternate?'alt':k===p.primary?'special':
        ['kick','mk','hk'].includes(k)?'kick':k==='grab'?'grab':'punch';
      t=q.t<q.start?.32*q.t/Math.max(1,q.start):q.t<=q.end?.32+.40*(q.t-q.start)/Math.max(1,q.end-q.start):.72+.28*(q.t-q.end)/Math.max(1,q.total-q.end);
    }else if(f.y<449){a='jump';t=clamp((f.vy+15)/30);}
    else if(f.guard){a='guard';t=.65;}
    else if(f.crouch){a='crouch';t=.75;}
    else if(f.moving){a='walk';t=(frame%24)/24;}
    return [a,clamp(t)];
  }
  function draw(c,d,x,y,face,f,scale,frame,state,win){
    const e=load(d);if(!e?.ready)return false;
    const [a,t]=pose(d,f,frame,state,win),list=e.m.actions[a];
    const r=e.m.frames[list[Math.min(list.length-1,Math.floor(t*list.length))]];
    const z=profiles[d.key].height/e.m.pixelsPerBody*scale;
    c.save();
    try{
      c.translate(x,y);c.scale(face,1);c.imageSmoothingEnabled=false;
      c.drawImage(e.atlas,r.x,r.y,r.w,r.h,-r.ax*z,-r.ay*z,r.w*z,r.h*z);
    }finally{c.restore();}
    return true;
  }
  window.KOFGroup1723=Object.freeze({profiles,pose,draw,load,ready:key=>!!cache.get(key)?.ready});
  window.KOFArt={...original,
    draw(...args){return draw(...args)||original.draw(...args);},
    portrait(d){const e=load(d);return e?.ready?e.portrait.src:original.portrait(d);},
    preload(list){return Promise.all([original.preload(list),...list.map(d=>load(d)?.promise).filter(Boolean)]);}
  };
})();
