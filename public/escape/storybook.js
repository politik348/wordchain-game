/* MOYEO EP.01 — illustrated 2.5D rooms. Existing 3D is the fallback when assets are absent. */
(() => {
  'use strict';
  const scene=document.getElementById('sceneCanvas');
  if(!scene)return;
  const isTaste=location.pathname.startsWith('/taste/escape/');
  const prefix=isTaste?'/taste/escape/':'/escape/';
  const sources={
    foyer:'foyer-scene.avif',
    study:'study-scene.avif',
    greenhouse:'greenhouse-scene.avif',
    tower:'tower-scene.avif'
  };
  // Screen percentages match the painted prop locations, not the old WebGL coordinates.
  // All original puzzle IDs, progression flags, and actions remain unchanged.
  const spotPositions={
    foyer:{invitation:[29.1,48.8],catbed:[9.6,83],rug:[47.9,89.5],cabinet:[73.6,63.8],crescent:[49.6,36.9],study:[18,62],cat:[92.8,84.1]},
    study:{books:[23,38],portrait:[49.5,20],piano:[88,63],desk:[31,66],greenhouse:[94,34],cat:[76,82]},
    greenhouse:{record:[90,40],water:[12,70],beam:[72,44],flower:[91,76],shutter:[55,12],pot:[73,76],tower:[97,16]},
    tower:{pedestal:[19,79],clock:[51,27],keeper:[39,76],pin:[70,55],portal:[91,37],hall:[91,79]}
  };
  const loaded=new Map();
  const art=document.createElement('div');
  art.className='storybook-layer';
  art.setAttribute('aria-hidden','true');
  scene.appendChild(art);
  const css=[
    '#sceneCanvas.storybook-ready .room-3d,#sceneCanvas.storybook-ready .scene-artwork{visibility:hidden!important}',
    '#sceneCanvas .storybook-layer{display:none;position:absolute;inset:0;z-index:1;background-repeat:no-repeat;background-size:100% 100%;background-position:center;transform-origin:50% 50%;pointer-events:none}',
    '#sceneCanvas.storybook-ready .storybook-layer{display:block;transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transition:transform .46s cubic-bezier(.22,.61,.36,1)}',
    '#sceneCanvas.storybook-ready .hotspot-layer{transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transform-origin:center;transition:transform .46s cubic-bezier(.22,.61,.36,1);z-index:4}',
    '#sceneCanvas.storybook-ready .hotspot{opacity:1!important;visibility:visible!important}',
    '#sceneCanvas.storybook-ready .camera-controls{z-index:5}',
    '#sceneCanvas.storybook-ready{cursor:default;touch-action:pan-y}',
    '#sceneCanvas.storybook-ready:active{cursor:default}',
    '@media(max-width:600px){#sceneCanvas.storybook-ready{aspect-ratio:1200/650!important;min-height:220px}#sceneCanvas.storybook-ready .scene-floorcaption{display:none}}',
    '@media(prefers-reduced-motion:reduce){#sceneCanvas.storybook-ready .storybook-layer,#sceneCanvas.storybook-ready .hotspot-layer{transition:none!important}}'
  ];
  for(const [room,spots] of Object.entries(spotPositions)){
    for(const [object,[x,y]] of Object.entries(spots)){
      css.push('#sceneCanvas.storybook-ready[data-room="'+room+'"] .hotspot[data-object="'+object+'"]{left:'+x+'%!important;top:'+y+'%!important;display:grid!important;}');
    }
  }
  const style=document.createElement('style');
  style.textContent=css.join('\n');
  document.head.appendChild(style);

  let pan=0,zoom=1.025,drag=null,lastRoom=null,focusTimer=null;
  const cancelFocus=()=>{if(focusTimer!==null){clearTimeout(focusTimer);focusTimer=null;}};
  function focusSolvedProp(id){
    if(!active()||!spotPositions[lastRoom]?.[id])return;
    cancelFocus();
    const beforePan=pan,beforeZoom=zoom;
    const [x]=spotPositions[lastRoom][id];
    pan=clamp((50-x)*.18,-8,8);
    zoom=clamp(zoom+.065,1.025,1.16);
    update();
    focusTimer=setTimeout(()=>{
      pan=beforePan;zoom=beforeZoom;focusTimer=null;update();
    },1450);
  }
  window.MoyeoEscapeCamera={focusSolvedProp};
  const active=()=>scene.classList.contains('storybook-ready');
  const update=()=>{
    scene.style.setProperty('--storybook-pan',pan.toFixed(2)+'%');
    scene.style.setProperty('--storybook-zoom',zoom.toFixed(3));
  };
  function refresh(){
    const room=scene.dataset.room||'foyer';
    if(room!==lastRoom){cancelFocus();lastRoom=room;pan=0;zoom=1.025;drag=null;update();}
    const src=loaded.get(room);
    if(src){
      art.style.backgroundImage='url("'+src+'")';
      scene.classList.add('storybook-ready');
      scene.setAttribute('aria-label','탐험할 일러스트 방');
    }else{
      scene.classList.remove('storybook-ready');
      scene.setAttribute('aria-label','탐험할 3D 방');
    }
  }
  new MutationObserver(refresh).observe(scene,{attributes:true,attributeFilter:['data-room']});
  for(const [room,name] of Object.entries(sources)){
    const src=prefix+name;
    const img=new Image();
    img.decoding='async';
    img.onload=()=>{loaded.set(room,src);refresh();};
    img.onerror=()=>{loaded.delete(room);refresh();}; // A missing picture never blocks gameplay.
    img.src=src;
  }
  update();refresh();

  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  for(const control of document.querySelectorAll('[data-camera]')){
    control.addEventListener('click',event=>{
      if(!active())return;
      const direction=control.dataset.camera;
      if(direction==='discover')return; // Existing exploration-reveal handler stays active.
      cancelFocus();
      event.preventDefault();
      event.stopImmediatePropagation(); // Prevent hidden WebGL scene from rotating underneath.
      if(direction==='left')pan=clamp(pan+3.5,-8,8);
      if(direction==='right')pan=clamp(pan-3.5,-8,8);
      if(direction==='reset'){pan=0;zoom=1.025;}
      if(direction==='in')zoom=clamp(zoom+.045,1.025,1.20);
      if(direction==='out')zoom=clamp(zoom-.045,1.025,1.20);
      update();
    },true);
  }
  scene.addEventListener('wheel',event=>{
    if(!active())return;
    cancelFocus();
    event.preventDefault();
    event.stopImmediatePropagation();
    zoom=clamp(zoom+(event.deltaY<0?.032:-.032),1.025,1.20);
    update();
  },{capture:true,passive:false});

  // Dragging the empty background pans the 2.5D illustrated scene; puzzle taps still work.
  scene.addEventListener('pointerdown',event=>{
    if(!active()||event.target.closest('.hotspot,.camera-controls'))return;
    if(event.button!==0&&event.pointerType==='mouse')return;
    cancelFocus();
    drag={id:event.pointerId,x:event.clientX,pan};
    if(scene.setPointerCapture)scene.setPointerCapture(event.pointerId);
  });
  scene.addEventListener('pointermove',event=>{
    if(!active()||!drag||drag.id!==event.pointerId)return;
    pan=clamp(drag.pan+((event.clientX-drag.x)/Math.max(200,scene.clientWidth))*38,-8,8);
    update();
  });
  scene.addEventListener('pointerup',event=>{
    if(drag?.id===event.pointerId){drag=null;try{scene.releasePointerCapture(event.pointerId);}catch{}}
  });
  scene.addEventListener('pointercancel',()=>{drag=null;});
})();
