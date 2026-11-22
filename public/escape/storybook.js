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
  // Manual anchors measured against the four 1382×749 AVIF paintings.
  // The dots sit at the actual part to operate: door handle, drawer grip,
  // bell, lamp, leaf, glass cover, control wheel, or notebook—not the object center.
  // Illustration dimensions match the 1200:650 scene aspect ratio.
  const spotPositions={
    foyer:{
      invitation:[69.1,57.5],catbed:[19.5,85],rug:[48.5,91],
      cabinet:[76.1,69.8],crescent:[49.7,35.7],
      study:[24.9,59.1], // LEFT PURPLE DOOR: brass handle, not panel center
      cat:[93.3,82.6],
      'foyer-bell':[77.4,56.9], // bell on reception counter
      'foyer-main-door':[55.6,58.2], // CENTRAL DOOR: right-side handle
      'foyer-vase':[4.3,65.5],
      'foyer-chandelier':[49.8,10.8],
      'foyer-sconce':[8.1,32.9],
      'foyer-banner':[64.9,27.6],
      'foyer-window':[2.5,44]
    },
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
  // Some storyline objects are absent from the paintings. Study/greenhouse exits
  // remain available via room navigation and Next Room; Miro via her dialog card.
  // Cat bed is visibly rendered as a foreground prop OVER the AVIF.
  const unpaintedHotspots={
    foyer:new Set([]),
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
  const loaded=new Map();
  const art=document.createElement('div');
  art.className='storybook-layer';
  art.setAttribute('aria-hidden','true');
  scene.appendChild(art);
  // Painted foreground cat bed, paired with the hotspot on the same image layer.
  // It follows every pan/zoom of the high-resolution AVIF background.
  const bed=document.createElement('div');
  bed.className='storybook-catbed-art';
  bed.setAttribute('aria-hidden','true');
  bed.innerHTML=[
    '<svg viewBox="0 0 300 206" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">',
    '<defs>',
      '<linearGradient id="miroBedFrame" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dbaf90"/><stop offset=".44" stop-color="#a36e7d"/><stop offset="1" stop-color="#554264"/></linearGradient>',
      '<linearGradient id="miroBedCushion" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f5ded1"/><stop offset=".53" stop-color="#baa0b6"/><stop offset="1" stop-color="#7e688e"/></linearGradient>',
      '<linearGradient id="miroBedFront" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d7a58d"/><stop offset="1" stop-color="#6c4c65"/></linearGradient>',
      '<filter id="miroBedShadow" x="-30%" y="-60%" width="160%" height="230%"><feGaussianBlur stdDeviation="10"/></filter>',
    '</defs>',
    '<ellipse cx="154" cy="180" rx="133" ry="17" fill="#12162b" opacity=".66" filter="url(#miroBedShadow)"/>',
    '<path d="M38 94 Q31 53 67 40 Q94 22 150 25 Q218 20 253 49 Q271 68 261 106 L253 149 Q149 187 48 145 Z" fill="url(#miroBedFrame)" stroke="#ecd2a8" stroke-width="6" stroke-linejoin="round"/>',
    '<path d="M51 96 Q51 62 87 51 Q150 37 218 55 Q247 64 251 94 L243 130 Q148 158 60 130 Z" fill="#4d3c62" stroke="#c08d89" stroke-width="5"/>',
    '<ellipse cx="150" cy="112" rx="111" ry="52" fill="#3f3455" opacity=".7"/>',
    '<path d="M55 111 Q48 81 99 75 Q135 64 153 78 Q178 65 221 79 Q249 91 246 115 Q215 145 155 139 Q85 150 55 111 Z" fill="url(#miroBedCushion)" stroke="#ebd2ba" stroke-width="5"/>',
    '<path d="M87 101 Q119 83 154 96 Q181 80 210 99" fill="none" stroke="#fff0d8" stroke-width="5" stroke-linecap="round" opacity=".66"/>',
    '<path d="M31 109 Q54 133 143 139 Q232 140 273 111 L265 155 Q231 185 150 185 Q64 184 38 157 Z" fill="url(#miroBedFront)" stroke="#d9ae94" stroke-width="6" stroke-linejoin="round"/>',
    '<path d="M57 151 Q147 169 248 150" fill="none" stroke="#f0caa1" stroke-width="4" stroke-linecap="round" opacity=".76"/>',
    '<rect x="115" y="153" width="73" height="23" rx="6" fill="#c7a077" stroke="#f0d3a7" stroke-width="3"/>',
    '<text x="151" y="169" text-anchor="middle" font-size="15" font-weight="bold" fill="#50384f" font-family="Georgia,serif" letter-spacing="1.5">MIRO</text>',
    '</svg>'
  ].join('');
  art.appendChild(bed);
  const css=[
    '#sceneCanvas.storybook-ready .room-3d,#sceneCanvas.storybook-ready .scene-artwork{visibility:hidden!important}',
    '#sceneCanvas .storybook-layer{display:none;position:absolute;inset:0;z-index:1;background-repeat:no-repeat;background-size:100% 100%;background-position:center;transform-origin:50% 50%;pointer-events:none}',
    '#sceneCanvas.storybook-ready .storybook-layer{display:block;transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transition:transform .46s cubic-bezier(.22,.61,.36,1)}',
    '#sceneCanvas.storybook-ready .hotspot-layer{transform:translateX(var(--storybook-pan,0%)) scale(var(--storybook-zoom,1.025));transform-origin:center;transition:transform .46s cubic-bezier(.22,.61,.36,1);z-index:4}',
    '#sceneCanvas.storybook-ready .hotspot{opacity:1!important;visibility:visible!important}',
    // Invisible clickable area spans the entire cushion. Other room props
    // still use the same small neutral investigation dots.
    '#sceneCanvas.storybook-ready[data-room="foyer"] .hotspot[data-object="catbed"]{width:18%!important;height:24%!important;min-width:0!important;min-height:0!important;}',
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
