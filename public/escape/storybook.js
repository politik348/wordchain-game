/* EP01 illustrated mode; activated after the artwork loads. */
(() => {
 'use strict';
 const scene=document.getElementById('sceneCanvas');if(!scene)return;
 const src=location.pathname.startsWith('/taste/escape/')?'/taste/escape/foyer-scene.avif':'/escape/foyer-scene.avif';
 const image=new Image(); image.decoding='async';
 image.onload=()=>{
   const art=document.createElement('div');
   art.className='storybook-layer';art.setAttribute('aria-hidden','true');
   art.style.backgroundImage='url("'+src+'")';scene.appendChild(art);
   const style=document.createElement('style');
   const spots={invitation:[29.1,48.8],catbed:[9.6,83.0],rug:[47.9,89.5],cabinet:[73.6,63.8],crescent:[49.6,36.9],study:[21.4,54.8],cat:[92.8,84.1]};
   const selectors=Object.entries(spots).map(([key,[x,y]])=> '#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot[data-object="'+key+'"]{left:'+x+'%!important;top:'+y+'%!important;display:grid!important;}').join('\n');
   style.textContent=[
      '#sceneCanvas.storybook-ready[data-room="foyer"] .room-3d,#sceneCanvas.storybook-ready[data-room="foyer"] .scene-artwork{visibility:hidden!important}',
      '#sceneCanvas .storybook-layer{display:none;position:absolute;inset:0;z-index:1;background-repeat:no-repeat;background-size:100% 100%;background-position:center;transform-origin:center center;pointer-events:none;}',
      '#sceneCanvas.storybook-ready[data-room="foyer"] .storybook-layer{display:block;transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transition:transform .46s cubic-bezier(.22,.61,.36,1);}',
      '#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot-layer{transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transform-origin:center;transition:transform .46s cubic-bezier(.22,.61,.36,1);z-index:4;}',
      '#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot{opacity:1!important;visibility:visible!important}',
      '#sceneCanvas.storybook-ready[data-room="foyer"] .camera-controls{z-index:5}',
      '@media(max-width:600px){#sceneCanvas.storybook-ready[data-room="foyer"]{aspect-ratio:1200/650!important;min-height:220px}#sceneCanvas.storybook-ready[data-room="foyer"] .scene-floorcaption{display:none}}',
      '@media(prefers-reduced-motion:reduce){#sceneCanvas.storybook-ready[data-room="foyer"] .storybook-layer,#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot-layer{transition:none!important}}',
      selectors
   ].join('\n');
   document.head.appendChild(style);
   scene.classList.add('storybook-ready');
 };
 image.onerror=()=>{/* Existing 3D remains intact until this image is uploaded. */};
 image.src=src;
 let pan=0,zoom=1.025;
 const update=()=>{scene.style.setProperty('--storybook-pan',pan+'%');scene.style.setProperty('--storybook-zoom',zoom.toFixed(3));};
 for(const control of document.querySelectorAll('[data-camera]')){
   control.addEventListener('click',event=>{
     if(!scene.classList.contains('storybook-ready')||scene.dataset.room!=='foyer')return;
     const direction=control.dataset.camera;if(direction==='discover')return;
     event.preventDefault();event.stopImmediatePropagation();
     if(direction==='left')pan=Math.min(7,pan+3.5);
     if(direction==='right')pan=Math.max(-7,pan-3.5);
     if(direction==='reset'){pan=0;zoom=1.025}
     if(direction==='in')zoom=Math.min(1.19,zoom+.045);
     if(direction==='out')zoom=Math.max(1.025,zoom-.045);
     update();
   },true);
 }
 scene.addEventListener('wheel',event=>{
   if(!scene.classList.contains('storybook-ready')||scene.dataset.room!=='foyer')return;
   event.preventDefault();event.stopImmediatePropagation();
   zoom=Math.max(1.025,Math.min(1.19,zoom+(event.deltaY<0?.03:-.03)));update();
 },{capture:true,passive:false});
})();
