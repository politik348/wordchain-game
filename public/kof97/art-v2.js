/* KOF97 animal edition — scalable original procedural concept art; not hand-painted arcade sprites. */
(()=>{'use strict';const profiles=[["tiger","#db9450","#f0e0bb","#292b34","#33313b","#493224","school","whiteband"],["cheetah","#e0b76b","#f2dcb1","#22242e","#b6c4cd","#f7d36a","sleeveless","spikes"],["bear","#966d50","#d4b699","#dcd9c9","#30363d","#332927","gi","headband"],["lion","#d9a561","#f5ddb5","#bf343b","#395b91","#b47b31","vest","cap"],["wolf","#a9acb6","#e3dce0","#e7e1d5","#e5e2d8","#dfb668","gi","ponytail"],["kangaroo","#ba8966","#e6c5a1","#b87232","#e5aa38","#49382f","shorts","headband"],["leopard","#cf9e59","#f3deac","#de8f32","#de8f32","#322a28","gi","tuft"],["panther","#404552","#858a98","#e6dfd4","#3e485a","#1e202a","vest","ponytail"],["cat","#d5bca3","#f0ddc7","#e8e6df","#536992","#68472d","gi","braid"],["fox","#adb7c7","#e9e3df","#435845","#435845","#3d76b2","military","ponytail"],["bear","#935d3f","#d7ae89","#52624a","#34433c","#2c282b","military","redband"],["gorilla","#575a65","#9b8c80","#34495c","#35485d","#2c2b31","military","cap"],["rabbit","#e2d2df","#f4e6ed","#b62d53","#d6d4df","#6e50a1","dress","hairband"],["panda","#e3ddd0","#f0e9d9","#395995","#e5d9c1","#24242b","tunic","tuft"],["redpanda","#bb7546","#f0cfb1","#a48c54","#5b5b65","#f2e3d3","tunic","beard"],["fox","#d98b55","#f5d9b8","#b93141","#ba3041","#573530","ninja","ponytail"],["leopard","#c2a16b","#e9d2ac","#e1e0da","#67527e","#dcb66c","vest","short"],["crane","#e6e3dc","#f8efe1","#e5e5df","#ba3345","#272939","robe","ponytail"],["hawk","#a18b67","#eee7db","#e5e8e2","#e5e8e2","#393130","gi","tuft"],["hippo","#8d839e","#bbaec5","#e0dcd1","#dcd8ce","#302e34","prison","chain"],["weasel","#b79063","#e8cfad","#8d7f59","#776948","#4b382a","prison","hat"],["cobra","#89925a","#d7d0aa","#282935","#30323a","#b5a071","suit","slick"],["dog","#42454f","#eee2d6","#ad3445","#345577","#dbbf70","vest","short"],["fox","#d5874d","#f3d6ae","#355484","#344f75","#8d522b","vest","redband"],["wolf","#adb0b9","#e5dbd5","#bd3141","#e8e1d5","#dfd0c3","jacket","short"],["lynx","#d1a47a","#f1dcc5","#a34470","#514758","#af5140","jacket","fringe"],["squirrel","#be8c63","#f1d4b7","#e5e1d8","#4a6f9e","#50372b","tunic","tuft"],["wolf","#454953","#a4a0ae","#292633","#a73443","#a42b43","jacket","fringe"],["dog","#d4af82","#f3dfbd","#304f88","#e1ddd2","#4b332c","school","whiteband"],["tiger","#db9450","#f0e0bb","#292b34","#33313b","#493224","school","whiteband"],["wolf","#454953","#aaa5b4","#3f294d","#a73443","#b02750","jacket","fringe"],["fox","#aab5c5","#e9e3df","#435845","#435845","#a42b43","military","ponytail"],["wolf","#adb0b9","#e5dbd5","#a4a3a2","#e7e1d5","#dfd0c3","jacket","short"],["lynx","#d1a47a","#f1dcc5","#733d9b","#514758","#af5140","jacket","fringe"],["squirrel","#be8c63","#f1d4b7","#4a2a63","#784a97","#50372b","tunic","tuft"],["snake","#e1e1d9","#f8f3e7","#dedbd6","#d9dbe2","#e3e4eb","orochi","long"]];const buildArt=function buildArt(profiles) {
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const C={
 idle:6,walk:8,crouch:4,guard:4,jump:5,punch:6,kick:6,special:8,upper:6,grab:6,hit:5,ko:6,win:6,evade:6
 };
 const P=(x,y)=>[x,y];
 const fmt=n=>Number(n.toFixed(2));
 function svg(d,action='idle',t=0,portrait=false){
  const [animal,fur,cream,top,pants,hair,style,access]=profiles[d.key];
  const heavy=['gorilla','bear','hippo'].includes(animal),slim=['rabbit','weasel','fox','crane','squirrel'].includes(animal);
  const broad=heavy?1.3:slim?.83:1, tall=animal==='hippo'? .92:animal==='weasel'?.86:animal==='crane'?1.05:1;
  const grad=(id,col,lo='#1a1726',hi='#fff2d7')=>`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".83" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="${hi}"/><stop offset=".18" stop-color="${col}"/><stop offset=".58" stop-color="${col}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`;
  const path=(v,f,st='#29232e',w=1.6)=>`<path d="${v}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ell=(x,y,rx,ry,f,st='#29232e',w=1.4)=>`<ellipse cx="${fmt(x)}" cy="${fmt(y)}" rx="${fmt(rx)}" ry="${fmt(ry)}" fill="${f}" stroke="${st}" stroke-width="${w}"/>`;
  const line=(v,col,w=1.2)=>path(v,'none',col,w);
  const pl=(pts,f,st='#29232e',w=1.6)=>path('M'+pts.map(p=>p.map(fmt).join(' ')).join(' L')+' Z',f,st,w);
  const grp=(v,inside)=>`<g transform="${v}">${inside}</g>`;
  const tone=id=>`url(#${id})`;
  function limb(a,b,r1,r2,fill){let dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;const q=(p,r,k)=>[fmt(p[0]+nx*r*k),fmt(p[1]+ny*r*k)].join(' ');return path(`M${q(a,r1,1)} Q${q(a,r1*1.05,1)} ${q(b,r2,1)} Q${fmt(b[0]+dx/l*r2*.58)} ${fmt(b[1]+dy/l*r2*.58)} ${q(b,r2,-1)} L${q(a,r1,-1)} Q${fmt(a[0]-dx/l*r1*.45)} ${fmt(a[1]-dy/l*r1*.45)} ${q(a,r1,1)} Z`,fill)+line(`M${q(a,r1*.68,-1)} Q${q([(a[0]+b[0])/2,(a[1]+b[1])/2],r2*.8,-1)} ${q(b,r2*.45,-1)}`,'#fff2d450',1.8)}
  let wave=Math.sin(t*Math.PI*2),burst=Math.sin(Math.PI*clamp(t)),strike=action==='special'?Math.sin(Math.PI*clamp(t*1.15)):burst;
  let crouch=action==='crouch'||action==='guard'?24*burst+13:action==='grab'?8*burst:0;
  let shift=action==='walk'?wave*2:action==='hit'?-13*burst:action==='punch'?13*burst:action==='special'?10*strike:0;
  let hipY=-91+crouch+(action==='idle'?wave*1.7:0),shY=-157+crouch,headY=-188+crouch;
  let f1=P(-27,0),f2=P(30,0),k1=P(-26,-44+crouch*.4),k2=P(27,-44+crouch*.4);
  if(action==='walk'){f1=P(-25+wave*27,-Math.max(0,wave)*15);f2=P(25-wave*27,-Math.max(0,-wave)*15);k1=P(-19+wave*16,-47);k2=P(18-wave*16,-47)}
  if(action==='jump'){f1=P(-26,-22-12*burst);f2=P(33,-9-34*burst);k1=P(-31,-52);k2=P(43,-64-8*burst)}
  if(action==='kick'){f2=P(30+burst*99,-burst*108);k2=P(25+burst*43,-44-burst*35);f1=P(-24,0);shift=-8*burst}
  if(action==='evade'){crouch=30*burst;hipY+=crouch;shY+=crouch;headY+=crouch;shift=-9*burst}
  if(action==='ko'){shift=-13*burst}
  let backS=P(-21*broad+shift,shY),frontS=P(22*broad+shift,shY+4),backE=P(-39*broad+shift,shY+28),frontE=P(39*broad+shift,shY+25),backH=P(-5+shift,shY+15),frontH=P(53*broad+shift,shY+4);
  if(action==='guard'||action==='crouch'){backE=P(-18+shift,shY+31);backH=P(15+shift,shY-9);frontE=P(32+shift,shY+24);frontH=P(34+shift,shY-7)}
  if(action==='punch'||action==='special'||action==='grab'){let extension=burst*(action==='special'&&d.kind==='long'?115:action==='grab'?55:70);frontE=P(39*broad+shift+extension*.55,shY+17-10*burst);frontH=P(53*broad+shift+extension,shY+4-12*burst);if(action==='special'||action==='grab'){backE=P(5+shift+extension*.3,shY+30);backH=P(30+shift+extension*.76,shY+18)}}
  if(action==='upper'){frontE=P(41+shift,shY-12-20*burst);frontH=P(31+shift,shY-9-70*burst)}
  if(action==='hit'){frontH=P(31,shY+37);backH=P(-38,shY+25)}
  if(action==='win'){frontE=P(30,shY-12);frontH=P(29,shY-52-10*burst)}
  if(action==='idle'){frontH[1]+=wave*3;backH[1]-=wave*2}
  const waist=P(shift,hipY),body=`M${fmt(-30*broad+shift)} ${fmt(shY-4)} Q${fmt(-8*broad+shift)} ${fmt(shY-17)} ${fmt(24*broad+shift)} ${fmt(shY-6)} Q${fmt(39*broad+shift)} ${fmt(shY+15)} ${fmt(24*broad+shift)} ${fmt(hipY-11)} L${fmt(27*broad+shift)} ${fmt(hipY+5)} Q${fmt(0+shift)} ${fmt(hipY+13)} ${fmt(-25*broad+shift)} ${fmt(hipY+3)} L${fmt(-21*broad+shift)} ${fmt(hipY-22)} Q${fmt(-40*broad+shift)} ${fmt(shY+13)} ${fmt(-30*broad+shift)} ${fmt(shY-4)} Z`;
  let s='';
  if(['tiger','cheetah','leopard','panther','lion','wolf','fox','cat','kangaroo','redpanda','weasel','lynx','squirrel','dog'].includes(animal)){
   let thick=['fox','squirrel','redpanda','wolf','dog'].includes(animal),tail=`M${fmt(-17*broad+shift)} ${fmt(hipY)} C-70 ${fmt(hipY+18)} -83 ${fmt(hipY-10)} -68 ${fmt(hipY-47+wave*8)}`;
   s+=line(tail,'#26232c',thick?24:12)+line(tail,tone('fur'),thick?20:9)+line(`M-72 ${fmt(hipY-23+wave*5)} Q-77 ${fmt(hipY-37+wave*6)} -68 ${fmt(hipY-47+wave*8)}`,cream,thick?12:4);
  }
  const bareLeg=['shorts','ninja','dress','orochi'].includes(style);
  function leg(h,k,f,front){let r=(heavy?16:slim?11:13);let fill=bareLeg?tone('fur'):tone('pants');let sock=style==='gi'||style==='prison'||style==='robe'?'#e0d8c8':'#31323e';let a=limb(h,k,r,r*.84,fill)+limb(k,P(f[0],f[1]-9),r*.8,r*.53,fill);
   a+=line(`M${fmt(k[0]-5)} ${fmt(k[1]-4)} q6 4 12 1`,'#201d2b77',1.5);
   if(bareLeg&&style!=='orochi')a+=limb(h,P(mix(h[0],k[0],.45),mix(h[1],k[1],.45)),r*1.12,r,tone('pants'));
   a+=path(`M${fmt(f[0]-10)} ${fmt(f[1]-14)} Q${fmt(f[0]+6)} ${fmt(f[1]-14)} ${fmt(f[0]+10)} ${fmt(f[1]-8)} Q${fmt(f[0]+24)} ${fmt(f[1]-6)} ${fmt(f[0]+22)} ${fmt(f[1]+1)} L${fmt(f[0]-11)} ${fmt(f[1]+1)} Z`,bareLeg&&style!=='ninja'?tone('fur'):sock);
   a+=line(`M${fmt(f[0]-9)} ${fmt(f[1]-1)} L${fmt(f[0]+20)} ${fmt(f[1]-1)}`,'#29232e',2);return a
  }
  s+=grp('opacity(1)',leg(P(-13*broad+shift,hipY),k1,f1,false)).replace('transform="opacity(1)"','opacity=".87"');
  s+=leg(P(13*broad+shift,hipY),k2,f2,true);
  const sleeveless=['sleeveless','vest','shorts','ninja','orochi'].includes(style);
  function arm(a,b,c,back){let rr=heavy?13:slim?8.5:11;let z=limb(a,b,rr,rr*.8,sleeveless?tone('fur'):tone('top'))+limb(b,c,rr*.85,rr*.57,tone('fur'));
   if(['military','school','jacket','vest','ninja'].includes(style))z+=limb(P(mix(b[0],c[0],.65),mix(b[1],c[1],.65)),c,rr*.73,rr*.61,tone('dark'));
   let hw=heavy?14:10,hh=heavy?12:9;z+=ell(c[0],c[1],hw,hh,tone('fur'));z+=path(`M${fmt(c[0]-hw*.35)} ${fmt(c[1]-hh*.7)} q${fmt(hw*.8)} -4 ${fmt(hw*1.05)} 4 l-1 7 q-6 5 -13 1 Z`,tone('cream'),'#29232e',1);
   for(let j=0;j<3;j++)z+=line(`M${fmt(c[0]-4+j*4)} ${fmt(c[1]-5)} l1 5`,'#544039',.9);
   return back?`<g opacity=".85">${z}</g>`:z
  }
  s+=arm(backS,backE,backH,true);
  s+=path(body,style==='orochi'?tone('fur'):tone('top'),'#22212c',2);
  let x=shift,sy=shY,hy=hipY;
  if(['gi','robe','ninja'].includes(style)){
   s+=pl([[x-24*broad,sy-6],[x-5,sy+25],[x+17,sy-6],[x+13,sy+16],[x-4,sy+47],[x-13,sy+22]],tone('cream'));
   s+=line(`M${fmt(x-22)} ${fmt(sy-4)} L${fmt(x+10)} ${fmt(hy-7)}`,'#474555',2.5);
   s+=line(`M${fmt(x+20)} ${fmt(sy-4)} L${fmt(x-3)} ${fmt(hy-12)}`,'#ede1cd',2.2);
  }else if(style==='military'){s+=pl([[x-17,sy+13],[x+1,sy+13],[x+1,sy+31],[x-17,sy+31]],tone('dark'));s+=pl([[x+8,sy+13],[x+25,sy+13],[x+25,sy+31],[x+8,sy+31]],tone('dark'));s+=line(`M${fmt(x)} ${fmt(sy+2)} L${fmt(x)} ${fmt(hy+3)}`,'#c9c3a1',1.7);s+=line(`M${fmt(x-22)} ${fmt(sy+8)} L${fmt(x-8)} ${fmt(sy+8)} M${fmt(x+12)} ${fmt(sy+8)} L${fmt(x+24)} ${fmt(sy+8)}`,'#e7d4b0',2)}
  else if(style==='orochi'){s+=line(`M${fmt(x-26)} ${fmt(sy+12)} Q${fmt(x-9)} ${fmt(sy+1)} ${fmt(x)} ${fmt(sy+17)} Q${fmt(x+14)} ${fmt(sy+1)} ${fmt(x+25)} ${fmt(sy+12)} M${fmt(x)} ${fmt(sy+17)} v39`,'#493c50',3);s+=ell(x,sy+29,7,7,'#332b48');}
  else if(['jacket','school','vest','suit'].includes(style)){
   s+=pl([[x-15,sy-5],[x,sy+26],[x+17,sy-5],[x+12,sy+30],[x,sy+43],[x-10,sy+25]],tone('cream'));
   s+=line(`M${fmt(x)} ${fmt(sy+26)} L${fmt(x+4)} ${fmt(hy+3)}`,'#2d2832',2);
   for(let i=0;i<3;i++)s+=ell(x+5,sy+33+i*8,1.7,1.7,'#e5bc75',null,0);
  }else if(style==='dress'){s+=pl([[x-24,hy-7],[x+23,hy-7],[x+37,hy+25],[x-32,hy+25]],tone('top'));s+=line(`M${fmt(x-29)} ${fmt(hy+21)} H${fmt(x+34)}`,'#f8e4c5',4)}
  else if(style==='prison'){s+=line(`M${fmt(x)} ${fmt(sy+3)} V${fmt(hy+3)}`,'#a9a1ac',2);for(let j=0;j<3;j++)s+=line(`M${fmt(x-23)} ${fmt(sy+17+j*12)} h42`,'#817e8650',2)}
  else{s+=line(`M${fmt(x-22)} ${fmt(sy+13)} Q${fmt(x-10)} ${fmt(sy+21)} ${fmt(x)} ${fmt(sy+12)} M${fmt(x+5)} ${fmt(sy+12)} Q${fmt(x+18)} ${fmt(sy+21)} ${fmt(x+25)} ${fmt(sy+13)}`,'#302a3455',1.8)}
  s+=line(`M${fmt(x-24*broad)} ${fmt(hy-14)} Q${fmt(x)} ${fmt(hy-9)} ${fmt(x+22*broad)} ${fmt(hy-14)}`,'#f8dfb540',2);
  s+=pl([[x-25*broad,hy-2],[x+25*broad,hy-2],[x+23*broad,hy+6],[x-24*broad,hy+6]],tone('dark'));
  s+=ell(x+5,hy+2,5,4,'#c8a86c','#42384a',1);
  if(style==='gi'||style==='robe'||style==='ninja'){s+=pl([[x,hy],[x-10,hy+26],[x-4,hy+31],[x+4,hy+2]],tone('dark'));s+=pl([[x+3,hy],[x+11,hy+24],[x+20,hy+23],[x+8,hy+1]],tone('dark'))}
  s+=arm(frontS,frontE,frontH,false);
  if(d.key===19){s+=line(`M${fmt(frontH[0])} ${fmt(frontH[1])} Q${fmt(frontH[0]+26)} ${fmt(frontH[1]+35)} ${fmt(frontH[0]+35)} ${fmt(frontH[1]+49)}`,'#b5b4bd',5);s+=ell(frontH[0]+35,frontH[1]+55,22,22,tone('steel'));s+=ell(frontH[0]+28,frontH[1]+47,8,6,'#e6e8ec44',null,0)}
  if(d.key===23)s+=limb(P(frontH[0]-30,frontH[1]+57),P(frontH[0]+27+burst*25,frontH[1]-67),3.8,3.8,'#b1322c');
  if(d.key===20){for(let j=0;j<3;j++)s+=pl([[frontH[0]+5,frontH[1]-8+j*5],[frontH[0]+33,frontH[1]-12+j*5],[frontH[0]+9,frontH[1]-2+j*5]],tone('steel'))}
  if(d.key===15){s+=path(`M${fmt(frontH[0])} ${fmt(frontH[1])} l12 -29 q20 -5 29 13 Z`,'#e6d7c3','#493b49',1.5);for(let i=0;i<5;i++)s+=line(`M${fmt(frontH[0])} ${fmt(frontH[1])} L${fmt(frontH[0]+12+i*7)} ${fmt(frontH[1]-29+i*3)}`,'#a33845',1)}
  // Head, detailed species-specific silhouettes and markings.
  let h='',hr=heavy?23:slim?18:20,hh=heavy?25:23;
  const e=(...a)=>ell(...a),furG=tone('fur'),creamG=tone('cream'),hairG=tone('hair');
  if(animal==='lion'){for(let i=0;i<12;i++){let a=i*Math.PI/6;h+=pl([[Math.cos(a)*17,Math.sin(a)*19],[Math.cos(a-.22)*31,Math.sin(a-.22)*34],[Math.cos(a+.24)*26,Math.sin(a+.24)*33]],hairG)}h+=e(0,2,27,30,hairG)}
  if(animal==='rabbit'||animal==='kangaroo'){for(let j=0;j<2;j++){h+=grp(`translate(${-11+j*17} -15) rotate(${j?12:-19})`,e(0,-19,6.4,23,furG)+e(0,-19,3.1,18,'#c98e9c',null,0))}}
  else if(['wolf','fox','cat','tiger','cheetah','leopard','panther','lynx','weasel','dog','squirrel','redpanda'].includes(animal)){
   for(let j of [-1,1]){let a=j*hr*.76;if(['tiger','cheetah','leopard','panther','redpanda'].includes(animal)){h+=e(a,-17,8.5,8.5,furG)+e(a,-17,4.8,5,'#c2a4a0')}else if(animal==='dog'){h+=grp(`translate(${a} -12) rotate(${j*18})`,e(0,6,6,16,furG))}else{h+=pl([[a-7,-12],[a,-35],[a+9,-14]],furG)+pl([[a-3,-15],[a,-28],[a+5,-15]],'#c397a0',null,0);if(animal==='lynx')h+=pl([[a-2,-31],[a,-40],[a+2,-31]],hairG)}}
  }else if(heavy){h+=e(-hr+2,-14,8.5,8.2,furG)+e(hr-3,-14,8,8,furG)}
  if(animal==='cobra')h+=path('M-18 -20 Q-43 -20 -40 13 Q-30 37 -8 20 L18 20 Q39 33 42 5 Q41 -18 20 -20 Z',furG)+path('M-20 -13 Q-32 2 -23 17 M20 -13 Q34 2 23 17','none','#d9bd74',3);
  h+=e(0,0,hr,hh,furG);
  if(animal==='panda'){h+=e(-15,-17,8,8,'#33333f')+e(13,-17,8,8,'#33333f')+e(-9,-3,8,10,'#373640')+e(10,-3,8,10,'#373640')}
  if(animal==='dog'||animal==='wolf'||animal==='fox'||animal==='redpanda')h+=path('M-19 0 Q-13 11 -9 19 Q2 28 17 15 L22 7 Q8 5 2 -4 Q-6 5 -19 0 Z',creamG,null,0);
  if(animal==='hawk'||animal==='crane'){h+=path('M-18 -12 Q-4 -26 8 -18 Q12 -9 15 -4 L29 2 L19 12 L10 9 Q4 24 -9 20 Z',creamG);h+=path('M12 -3 Q31 -3 39 6 L29 16 L20 9 L12 9 Z',animal==='crane'?'#ca9461':'#dca546');h+=line('M23 7 L32 8','#654b33',1.5);}
  else if(animal==='cobra'||animal==='snake'){h+=path('M-8 0 Q15 -7 27 1 Q36 11 22 18 Q5 22 -6 13 Z',creamG);h+=e(24,3,2.8,2.2,'#332b38',null,0)+line('M4 12 Q17 15 28 10','#6b5c56',1.8);for(let j=0;j<4;j++)h+=line(`M${-15+j*7} ${-12+j%2*5} l5 4 l-5 4`,'#d0bc9070',1)}
  else{
   const muzzle=animal==='hippo'?24:heavy?17:['wolf','fox','dog','kangaroo','weasel'].includes(animal)?18:14;
   h+=path(`M-9 4 Q4 -3 13 2 Q${muzzle+12} 2 ${muzzle+8} 13 Q${muzzle} 22 -3 18 Q-12 15 -9 4 Z`,creamG);
   if(animal==='hippo'){h+=e(11,7,3,2.5,'#453b47')+e(23,7,3,2.5,'#453b47')}else{h+=path(`M${muzzle-1} 3 q9 -3 10 4 q-2 6 -9 6 l-4 -6 Z`,'#2d2730');}
   h+=line(`M${muzzle+5} 13 Q${muzzle-2} 18 3 15`,'#50404a',1.5);
   if(['cat','tiger','cheetah','leopard','panther','lynx','rabbit'].includes(animal))for(let j=0;j<3;j++)h+=line(`M3 ${10+j*2} L${-16-j*2} ${7+j*4}`,'#e4d8c5',.75);
  }
  if(animal==='tiger')for(let j=0;j<3;j++){h+=pl([[-hr+1,-15+j*8],[-4,-11+j*8],[-hr+3,-7+j*8]],'#3a2d30',null,0);h+=pl([[hr-3,-18+j*7],[5,-14+j*7],[hr-1,-9+j*7]],'#3a2d30',null,0)}
  if(['cheetah','leopard','lynx'].includes(animal))for(let j=0;j<12;j++)h+=e(-15+(j*13)%32,-15+(j*7)%25,1.6+j%2*.4,1.3,'#524039',null,0);
  h+=path('M1 -7 Q10 -12 18 -8 L15 -1 L6 0 Z','#faf0d9','#2c2933',1.2)+e(12,-5,2.8,3.2,d.key===27||d.key===30||d.key===35?'#b1374d':'#7e4d34','#241e26',.8)+e(12,-6,1.0,1.2,'#fff9eb',null,0);
  h+=line('M0 -9 L17 -11','#342b35',2.2);
  if(access==='cap'||access==='hat'){h+=path('M-21 -15 Q-21 -32 4 -30 Q23 -29 24 -14 L37 -9 L13 -9 Z',d.key===3?'#c73d3d':tone('dark'));h+=line('M-8 -26 Q5 -30 17 -22','#eee1cd',3)}
  else if(access==='whiteband'||access==='headband'||access==='redband'){h+=path('M-22 -18 Q0 -26 22 -18 L22 -12 Q0 -18 -22 -12 Z',access==='redband'?'#bf333e':'#eae0d5');h+=path('M-20 -17 Q-34 -28 -43 -24 L-34 -17 L-49 -8 L-20 -13 Z',access==='redband'?'#bf333e':'#eae0d5')}
  if(access==='spikes'){h+=path('M-18 -17 L-17 -42 L-6 -35 L-3 -47 L5 -35 L15 -45 L21 -16 Z',hairG)}
  else if(access==='fringe'){h+=path('M-23 -17 Q-24 -34 3 -34 Q24 -33 25 -15 L18 5 L11 -13 L3 5 L-4 -15 L-10 -7 L-16 -18 Z',hairG)}
  else if(!['cap','hat','chain','beard'].includes(access)&&!['hawk','crane','cobra','snake'].includes(animal)){h+=path('M-19 -17 Q-22 -29 -7 -31 L-1 -26 L7 -32 L15 -26 L24 -18 L12 -11 L5 -20 L-4 -15 L-11 -22 Z',hairG)}
  if(['ponytail','braid','long'].includes(access))h=path('M-12 -15 Q-34 -14 -38 7 Q-39 28 -50 37 Q-22 31 -18 7 Z',hairG)+h;
  if(access==='beard')h+=path('M-15 10 Q-6 26 7 28 L18 17 L10 31 L-4 33 Z',hairG);
  if(access==='hairband')h+=line('M-19 -19 Q0 -31 20 -18','#e3ba64',3.5);
  s+=grp(`translate(${fmt(shift+4)} ${fmt(headY)})`,h);
  if(d.key===29)s+=line(`M${fmt(x-16)} ${fmt(sy+10)} L${fmt(x+14)} ${fmt(sy+12)}`,'#e9e3ce',3);
  let transform=`scale(1 ${tall})`;
  if(action==='ko')transform=`translate(${fmt(-12*burst)} 0) rotate(${fmt(-87*clamp(t*1.35))}) scale(1 ${tall})`;
  if(action==='hit')transform=`rotate(${fmt(-11*burst)}) scale(1 ${tall})`;
  if(action==='evade')transform=`rotate(${fmt(-22*burst)}) scale(1 ${tall})`;
  const vb=portrait?'-115 -252 230 270':'-180 -252 360 270',dims=portrait?'width="920" height="1080"':'width="720" height="540"';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${dims} viewBox="${vb}"><defs>${grad('fur',fur,'#38303c')}${grad('cream',cream,'#91808b')}${grad('top',top,'#252230')}${grad('pants',pants,'#272633')}${grad('hair',hair,'#261e2a')}${grad('dark','#3d3947','#191722','#a69aa6')}${grad('steel','#777e8c','#252935','#f1edee')}</defs><g transform="${transform}">${s}</g></svg>`;
 }
 return {svg,counts:C};
};const art=buildArt(profiles),cache=new Map(),limit=160;const uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);function get(d,a,i){let key=d.key+':'+a+':'+i;if(cache.has(key)){let im=cache.get(key);cache.delete(key);cache.set(key,im);return im}let im=new Image();im.src=uri(art.svg(d,a,i/Math.max(1,art.counts[a]-1)));cache.set(key,im);while(cache.size>limit)cache.delete(cache.keys().next().value);return im}const ready=i=>i&&i.complete&&i.naturalWidth>0;function wait(im){return ready(im)?Promise.resolve():new Promise(resolve=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',resolve,{once:true});if(im.complete)resolve()})}function select(f,frame,state,win){let a='idle',t=(frame%48)/48;if(!f)return [a,Math.floor(t*art.counts[a])];if(f.hp<=0){a='ko';t=state==='outro'?Math.min(1,(115-(window.KOFDelay||115))/32):1}else if(win){a='win';t=(frame%60)/60}else if(f.evade){a='evade';t=1-f.evade/18}else if(f.stun){a='hit';t=1-Math.min(1,f.stun/20)}else if(f.attack){let k=f.attack.key;a=['kick','mk','hk'].includes(k)?'kick':k==='upper'?'upper':k==='grab'?'grab':['shot','charge','long','dash','spin','flurry','electric','super'].includes(k)?'special':'punch';let q=f.attack;t=q.t<q.start?.5*q.t/Math.max(1,q.start):q.t<=q.end?.5+.08*(q.t-q.start)/Math.max(1,q.end-q.start):.58+.42*(q.t-q.end)/Math.max(1,q.total-q.end)}else if(f.y<449){a='jump';t=Math.max(0,Math.min(1,(f.vy+13)/26))}else if(f.guard){a='guard';t=.5}else if(f.crouch){a='crouch';t=.5}else if(f.moving){a='walk';t=(frame%28)/28}return[a,Math.min(art.counts[a]-1,Math.max(0,Math.round(t*(art.counts[a]-1))))]}function draw(c,d,x,y,face,f,scale,frame,state,win){let [a,i]=select(f,frame,state,win),im=get(d,a,i);if(!ready(im))im=get(d,'idle',0);if(!ready(im))return false;c.save();c.translate(x,y);c.scale(face*scale,scale);c.imageSmoothingEnabled=true;c.drawImage(im,-180,-252,360,270);c.restore();return true}function preload(list){return Promise.all(list.filter(Boolean).flatMap(d=>['idle','walk','punch','kick','guard','special','jump','hit','ko','win','crouch','upper','grab','evade'].map(a=>wait(get(d,a,Math.floor(art.counts[a]/2)))).concat(wait(get(d,'idle',0)))))}window.KOFArt={draw,preload,counts:art.counts,portrait:d=>uri(art.svg(d,'idle',.22,true)),frameSVG:art.svg};})();