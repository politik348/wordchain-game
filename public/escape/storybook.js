/* MOYEO EP.01 — illustrated 2.5D rooms. Existing 3D is the fallback when assets are absent. */
(() => {
  'use strict';
  const scene=document.getElementById('sceneCanvas');
  if(!scene)return;
  const isTaste=location.pathname.startsWith('/taste/escape/');
  const prefix=isTaste?'/taste/escape/':'/escape/';
  const sources={
    foyer:'foyer-scene-integrated.avif',
    study:'study-scene.avif',
    greenhouse:'greenhouse-scene.avif',
    tower:'tower-scene.avif'
  };
  // Screen percentages match the painted prop locations, not the old WebGL coordinates.
  // All original puzzle IDs, progression flags, and actions remain unchanged.
  // Manual anchors measured against the four 1382×749 AVIF paintings.
  // The dots sit at the actual part to operate: door handle, drawer grip,
  // bell, lamp, leaf, glass cover, control wheel, or notebook—not the object center.
  // Illustration dimensions match the 1200:650 scene aspect ratio.
  // Single authoritative map for the integrated 1672x941 foyer painting.
  // All IDs remain unchanged so saved progress and existing actions survive.
  const foyerArtTargets=Object.freeze({
    invitation:[18.0,41.0], catbed:[16.0,79.2], rug:[54.0,87.3],
    cabinet:[81.0,67.0], crescent:[34.1,33.1],
    study:[20.9,54.1], cat:[75.4,22.2],
    'foyer-bell':[83.7,51.8], 'foyer-main-door':[55.1,54.2],
    'foyer-vase':[5.4,50.5], 'foyer-chandelier':[50.7,8.5],
    'foyer-sconce':[42.1,32.7], 'foyer-banner':[76.1,13.7],
    'foyer-window':[8.5,31.0], 'foyer-wall-plaque':[21.6,30.1],
    'foyer-moon-painting':[29.8,44.8],
    'foyer-cat-banner-emblem':[75.8,23.5],
    'foyer-four-lights':[76.0,42.5], 'foyer-armillary':[94.2,43.8],
    'foyer-counter-ledger':[89.8,50.8],
    'foyer-counter-pen':[88.7,55.3],
    'foyer-counter-base':[86.6,70.4],
    'foyer-side-table-drawer':[7.6,64.5],
    'foyer-side-table-shelf':[4.1,77.8],
    'foyer-floor-lantern':[8.9,55.1],
    'foyer-right-sconce':[67.5,32.8],
    'foyer-right-portrait':[97.5,27.7],
    'foyer-door-crest':[54.2,22.7],
    'foyer-blue-door-plaque':[91.7,22.6]
  });
  const spotPositions={
    foyer:{},
    study:{
      books:[28.8,30.5],portrait:[95.1,22.7],piano:[88.7,57.7],
      desk:[35,76.4], // desk drawer's brass fitting
      greenhouse:[94,34],cat:[76,82],
      'study-globe':[56.8,52.2],
      'study-ladder':[41.3,45.6],
      'study-bouquet':[78.1,47.6],
      'study-candles':[89.6,23.5],
      'study-rug':[61.5,86]
    },
    greenhouse:{
      record:[94,36.1],water:[53.5,50.8],beam:[41.5,25.4],
      flower:[92.3,71.1],shutter:[51.3,11],pot:[92.8,85],
      tower:[97,16],
      'green-fountain':[50.1,67.5],
      'green-teacup':[21.5,62.8],
      'green-vines':[31.4,10.5],
      'green-chair':[27,69.4],
      'green-planter':[79.6,73.6]
    },
    tower:{
      pedestal:[69.1,69.5],clock:[52.9,13.7],
      keeper:[30.6,77.1],pin:[70.3,58.2],
      portal:[91,35],hall:[91.5,72],
      'tower-globe':[13.7,58.7],
      'tower-scroll':[19.5,82.5],
      'tower-banner':[18.1,26.5],
      'tower-stairs':[92.4,54.2],
      'tower-lantern':[23.4,71.5]
    }
  };
  // Objects not painted in a room are not falsely pinned to unrelated scenery.
  // Miro remains accessible via the persistent sidebar dialog card, and is
  // visible in the 3D fallback; only the unpainted on-picture cat marker hides.
  const unpaintedHotspots={
    foyer:new Set(['cat']),
    study:new Set(['greenhouse','cat']),
    greenhouse:new Set(['tower']),
    tower:new Set([])
  };
  // Every newly audited detail already has an artwork-relative hit point.
  // Keep the camera/marker coordinates in sync with its actual pictured part.
  for(const [room,entries] of Object.entries(window.MoyeoExtraProps||{})){
    if(!spotPositions[room]||!Array.isArray(entries))continue;
    for(const row of entries){
      if(row.length>=6)spotPositions[room][row[0]]=[row[2],row[3]];
    }
  }
  // The original extra-props positions still serve as SVG/3D fallbacks.
  // This unified map overrides ALL foyer targets in the high-resolution view.
  Object.assign(spotPositions.foyer,foyerArtTargets);
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
    // The actual bed occupies the left corner of the generated scene.
    // Its whole cushion remains an invisible, forgiving click target.
    '#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot[data-object="catbed"]{width:17%!important;height:20%!important;min-width:0!important;min-height:0!important;}',
    '#sceneCanvas.storybook-ready .camera-controls{z-index:5}',
    '#sceneCanvas.storybook-ready{cursor:default;touch-action:pan-y}',
    '#sceneCanvas.storybook-ready:active{cursor:default}',
    '@media(max-width:600px){#sceneCanvas.storybook-ready{aspect-ratio:1200/650!important;min-height:220px}#sceneCanvas.storybook-ready .scene-floorcaption{display:none}}',
    '@media(prefers-reduced-motion:reduce){#sceneCanvas.storybook-ready .storybook-layer,#sceneCanvas.storybook-ready .hotspot-layer{transition:none!important}}'
  ];
  for(const [room,spots] of Object.entries(spotPositions)){
    for(const [object,[x,y]] of Object.entries(spots)){
      if(unpaintedHotspots[room]?.has(object)){
        css.push('#sceneCanvas.storybook-ready[data-room="'+room+'"] .hotspot[data-object="'+object+'"]{display:none!important;}');
        continue;
      }
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
