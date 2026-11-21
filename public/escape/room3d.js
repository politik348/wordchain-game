/* MOYEO Escape Room — original dependency-free WebGL 3D diorama renderer.
   Fixed-point exploration: drag to look, click projected objects to investigate. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const palette={
 foyer:{back:'#3a4566',side:'#323b5a',floor:'#4a3b4e',sky:[.075,.087,.16,1]},
 study:{back:'#42374f',side:'#342b44',floor:'#392f45',sky:[.08,.065,.13,1]},
 greenhouse:{back:'#2f5b63',side:'#31505b',floor:'#3e5b59',sky:[.045,.12,.16,1]},
 tower:{back:'#3d3d63',side:'#343656',floor:'#343047',sky:[.065,.068,.15,1]}
};
const spotLocations={
 foyer:{invitation:[-3.3,2.0,-4.65],catbed:[-4.5,.25,1.9],crescent:[-.4,4.1,-4.8],note:[-3.3,2.0,-4.65],paw:[2.3,2.18,-4.65],cabinet:[3.45,.87,-3.48],rug:[-1.2,.16,1.55],study:[-4.25,1.7,-4.55],greenhouse:[5.0,1.6,-4.55],tower:[.0,2.15,-4.8],cat:[4.85,.7,1.5]},
 study:{portrait:[-.5,3.55,-4.65],cat:[4.65,.2,1.2],books:[-4.65,2.0,-4.25],sheet:[2.25,3.6,-4.6],piano:[2.95,1.1,-1.9],desk:[-.85,.98,1.0],portrait:[-.5,3.55,-4.65],greenhouse:[5.05,2.0,-4.45]},
 greenhouse:{record:[-4.8,3.05,-4.5],water:[-3.8,1.05,-2.6],beam:[1.05,4.42,-4.5],flower:[0,1.62,-1.5],pot:[3.5,.9,.2],shutter:[2.8,5.05,-4.3],recipe:[-4.8,3.05,-4.5],valves:[-3.8,1.05,-2.6],moonflower:[.0,1.62,-1.5],collar:[3.5,.9,.2],window:[1.05,4.42,-4.5],tower:[5.0,2.1,-4.5]},
 tower:{pin:[5.15,.3,1.3],keeper:[-4.2,2.1,-4.58],pedestal:[-3.45,.96,-1.8],clock:[-.2,3.5,-4.65],journal:[-4.2,2.1,-4.58],portal:[4.3,2.15,-4.65],hall:[4.9,.8,.9]}
};
let gl,ctx2d,prog,buf,atPos,atColor,uMatrix,webglReady=false,canvas,container,room='foyer',spots=[],yaw=0,pitch=0,zoom=1,viewMatrix,projMatrix,mvp,vertices=[],colors=[],drag=null,resizeObserver,available=true;
const rad=x=>x*Math.PI/180;
function rgb(hex){const c=hex.replace('#','');return [parseInt(c.slice(0,2),16)/255,parseInt(c.slice(2,4),16)/255,parseInt(c.slice(4,6),16)/255]}
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const light=norm([-.4,.8,.68]);
function shade(color,normal,boost=1){let b=(.68+.31*Math.max(0,normal[0]*light[0]+normal[1]*light[1]+normal[2]*light[2]))*boost;return rgb(color).map(x=>Math.min(1,x*b));}
function tri(a,b,c,color,normal,boost){const clr=shade(color,normal,boost);for(const p of [a,b,c]){vertices.push(...p);colors.push(...clr)}}
function face(a,b,c,d,col,n,bright=1){tri(a,b,c,col,n,bright);tri(a,c,d,col,n,bright)}
function box(x,y,z,w,h,d,c,bright=1){let x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
 face([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],c,[0,0,1],bright);
 face([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],c,[0,0,-1],bright);
 face([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],c,[-1,0,0],bright);
 face([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],c,[1,0,0],bright);
 face([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],c,[0,1,0],bright);
 face([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],c,[0,-1,0],bright);
}
function disc(x,y,z,r,c,sides=24,bright=1){let a=[x,y,z];for(let i=0;i<sides;i++){let u=i*Math.PI*2/sides,v=(i+1)*Math.PI*2/sides;tri(a,[x+Math.cos(u)*r,y+Math.sin(u)*r,z],[x+Math.cos(v)*r,y+Math.sin(v)*r,z],c,[0,0,1],bright)}}
function ring(x,y,z,r,width,c,segments=40,bright=1){for(let i=0;i<segments;i++){let a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;let p=q=>[x+Math.cos(q)*r,y+Math.sin(q)*r,z],pi=q=>[x+Math.cos(q)*(r-width),y+Math.sin(q)*(r-width),z];face(p(a),p(b),pi(b),pi(a),c,[0,0,1],bright)}}
function sphere(x,y,z,r,c,segs=9,rings=6,scale=[1,1,1],bright=1){for(let i=0;i<rings;i++){let a=Math.PI*i/rings,b=Math.PI*(i+1)/rings;for(let j=0;j<segs;j++){let c0=2*Math.PI*j/segs,c1=2*Math.PI*(j+1)/segs;let p=(t,u)=>[x+r*Math.sin(t)*Math.cos(u)*scale[0],y+r*Math.cos(t)*scale[1],z+r*Math.sin(t)*Math.sin(u)*scale[2]];let v0=p(a,c0),v1=p(b,c0),v2=p(b,c1),v3=p(a,c1);let n=norm([Math.sin((a+b)/2)*Math.cos((c0+c1)/2),Math.cos((a+b)/2),Math.sin((a+b)/2)*Math.sin((c0+c1)/2)]);face(v0,v1,v2,v3,c,n,bright)}}}
function pole(x,y,z,h,r,color){box(x,y+h/2,z,r,h,r,color)}
function frame(x,y,z,w,h,color='#d5ad77',t=.14){box(x,y+h/2,z,w,t,.16,color);box(x,y-h/2,z,w,t,.16,color);box(x-w/2,y,z,t,h,.16,color);box(x+w/2,y,z,t,h,.16,color)}
function door(x,y,z,w,h,color='#51455d',bright=1){box(x,y+h/2,z,w,h,.22,'#ac886e',bright);box(x,y+h/2,z+.15,w-.30,h-.25,.18,color,bright);box(x,y+1.08,z+.26,w-.55,1.25,.07,'#635374');box(x+w*.32,y+1.25,z+.30,.13,.13,.09,'#f6d29a',1.6);box(x,y+h-.22,z+.31,w-.55,.10,.10,'#b99276')}
function chandelier(){pole(0,4.65,-1.65,.5,.07,'#ddbf96');sphere(0,4.2,-1.65,.19,'#f7c978',8,5,[1,1,1],1.8);for(let a=0;a<6;a++){let theta=a*2*Math.PI/6,x=Math.cos(theta)*.9,z=-1.65+Math.sin(theta)*.65;box(x,4.06,z,.10,.14,.10,'#d5b789');sphere(x,3.92,z,.17,'#ffe5a6',7,4,[.8,1.1,.8],1.7)}}
function rug(x,z,w,d,color){box(x,.08,z,w,.08,d,color);for(let xx=-2;xx<=2;xx++)box(x+xx*w/6,.145,z,.045,.01,d*.8,'#b69783',.9)}
function windows(){for(const xx of [-2.1,2.15]){box(xx,3.55,-5.14,1.45,2,.13,'#9ac4be',1.5);frame(xx,3.55,-5.02,1.52,2.08,'#dbc3a2',.15);box(xx,3.55,-4.95,.12,1.95,.12,'#cba88b');box(xx,3.55,-4.95,1.45,.12,.12,'#cba88b')}}
function cat(x,y,z){sphere(x,y+.40,z,.39,'#f4dac4',11,8,[.92,1,1]);sphere(x,y+.80,z,.28,'#f5e6d0',11,7);sphere(x-.21,y+1.03,z,.14,'#eed2c4',6,4,[.65,1.35,.7]);sphere(x+.21,y+1.03,z,.14,'#eed2c4',6,4,[.65,1.35,.7]);sphere(x-.11,y+.85,z+.23,.055,'#3d3a55');sphere(x+.12,y+.85,z+.23,.055,'#3d3a55');sphere(x,y+.71,z+.28,.04,'#d68c95');sphere(x+.38,y+.30,z-.04,.13,'#f2d9c8',8,5,[1,2,1]);box(x,y+.21,z+.34,.4,.12,.1,'#d0a57d')}
function base(which){const p=palette[which];
 // Segmented open-front diorama surfaces allow the Canvas software renderer
 // to depth-sort them correctly on devices without WebGL.
 for(let i=0;i<12;i++)for(let j=0;j<12;j++){
   const xa=-6.45+i*12.9/12,xb=-6.45+(i+1)*12.9/12;
   const za=-5.3+j*9.65/12,zb=-5.3+(j+1)*9.65/12;
   face([xa,-.04,zb],[xb,-.04,zb],[xb,-.04,za],[xa,-.04,za],p.floor,[0,1,0],1);
 }
 for(let i=0;i<12;i++)for(let j=0;j<6;j++){
   const xa=-6.45+i*12.9/12,xb=-6.45+(i+1)*12.9/12,ya=j*6.05/6,yb=(j+1)*6.05/6;
   face([xa,ya,-5.32],[xb,ya,-5.32],[xb,yb,-5.32],[xa,yb,-5.32],p.back,[0,0,1],1.06);
 }
 for(let side of [-1,1])for(let i=0;i<12;i++)for(let j=0;j<6;j++){
   const za=-5.32+i*9.67/12,zb=-5.32+(i+1)*9.67/12,ya=j*6.05/6,yb=(j+1)*6.05/6;
   face([side*6.45,ya,za],[side*6.45,ya,zb],[side*6.45,yb,zb],[side*6.45,yb,za],p.side,[-side,0,0],1.2);
 }
 for(let i=0;i<15;i++)box(-6+i*.86,.025,-.5,.025,.025,9.8,'#977a81',.53);
 for(let i=0;i<9;i++)box(0,.025,-5+i*1.11,12.85,.028,.024,'#927482',.55);
 box(0,.55,-5.08,12.6,.18,.22,'#c0a08b',.90);
 box(0,5.68,-5.06,12.7,.21,.24,'#d0af92',.83);
 for(let z=-4.5;z<4;z+=2){box(-6.35,2.5,z,.08,4.1,.13,'#7a6477',.9);box(6.35,2.5,z,.08,4.1,.13,'#7a6477',.9)}
}

function foyer(){base('foyer');chandelier();rug(-.1,1.2,5.8,2.7,'#734f67');
 door(0,0,-5.05,2.15,4.0,'#51405d',1.12);ring(0,3.4,-4.73,.32,.08,'#dcb579');
 door(-4.27,0,-5.05,1.55,3.45,'#6a4b65');door(4.35,0,-5.05,1.55,3.45,'#31546a');
 box(-3.28,2.07,-4.91,1.07,.78,.17,'#b99571');box(-3.28,2.07,-4.77,.79,.54,.07,'#e5cfaa',1.6);box(-3.28,2.11,-4.66,.51,.09,.02,'#805c5e');
 box(2.32,2.18,-4.86,1.17,1.25,.25,'#b78a62');for(let i=0;i<4;i++)disc(1.94+(i%2)*.75,2.4-Math.floor(i/2)*.48,-4.69,.15,i===0?'#f7d58f':'#7c7ba3',12,1.4);
 box(3.47,.92,-3.55,1.8,1.8,1.17,'#6e4d56');box(3.47,1.88,-3.55,1.92,.13,1.30,'#c19775');box(3.47,.87,-2.9,1.35,.07,.07,'#b58c72');
 cat(4.84,0,1.24);
 sphere(-.4,4.1,-5.0,.36,'#a79bba',9,7,[1,.8,.22]);
}
function study(){base('study');chandelier();rug(.3,1.2,6,3.6,'#5b3d58');
 for(const x of [-5.35,-4.25,-3.15]){box(x,2.36,-4.6,1.03,4.5,.80,'#5a3947');for(const y of [1.07,2.20,3.33,4.45])box(x,y,-4.1,1,.09,.82,'#ad8264');for(let i=0;i<5;i++){let xx=x-.38+i*.19;box(xx,1.4+((i+Math.floor(x))%3)*1.1,-3.87,.14,.62,.30,['#9c6b70','#597a89','#aa8867','#9b93b3','#6d8a7b'][i]);}};
 box(-.55,3.6,-4.93,1.6,1.7,.22,'#ad8368');box(-.55,3.6,-4.79,1.25,1.38,.06,'#aab0ab');sphere(-.6,3.66,-4.66,.39,'#e3d6c3',9,7,[.75,1,.18]);
 box(2.26,3.50,-4.89,2.35,1.08,.11,'#b48d6d');box(2.26,3.5,-4.79,2.06,.82,.08,'#e4d5b6',1.35);for(let i=0;i<5;i++)box(1.53+i*.29,3.46+(i%2)*.10,-4.69,.25,.05,.01,'#69556a');
 box(-.75,.86,1.15,2.55,1.6,1.42,'#735465');box(-.75,1.68,1.15,2.84,.20,1.62,'#bf8c72');box(-.75,.94,1.89,1.95,.22,.08,'#c19b7b');
 box(2.95,1.10,-1.9,3.10,1.8,1.56,'#363445');box(2.95,2.10,-1.85,3.32,.16,1.68,'#71516b');box(2.95,1.88,-.97,3.05,.19,.47,'#ecdcb5');for(let i=0;i<16;i++)box(1.56+i*.182,1.91,-.70,.16,.06,.27,'#e8dfd0',1.33);for(let i=0;i<10;i++)box(1.6+i*.28,1.96,-.63,.10,.07,.18,'#393442');
 door(5.0,0,-5.06,1.65,3.8,'#385d63');
 box(0,5.5,-4.99,8,.14,.20,'#bc8d71');
}
function greenhouse(){base('greenhouse');
 for(let i=-5;i<=5;i+=2){box(i,3.1,-5.03,.12,5.2,.22,'#89bcaa',1.3);box(i,.1,-3.6,1.0,.2,1.8,'#48715c')}
 for(let y of [1.7,3.4,5.4])box(0,y,-5.0,12,.10,.20,'#89bcaa',1.2);
 windows();rug(0,.2,3.7,3.7,'#536453');
 // Rain glass side lattice and moon-lit glasshouse structure.
 for(let z=-4.2;z<=3.2;z+=1.45){box(-6.25,3.2,z,.15,5.2,.15,'#83aca7');box(6.25,3.2,z,.15,5.2,.15,'#83aca7');}
 box(-4.78,3.05,-4.87,1.75,1.32,.12,'#9c8a6d');box(-4.78,3.05,-4.76,1.46,1.09,.05,'#d6c99d',1.45);
 box(-3.8,.75,-2.8,2.2,1.4,1.5,'#52788b');for(const [x,c] of [[-4.23,'#5789ac'],[-3.6,'#e0c26a'],[-2.97,'#cb707a']]){disc(x,1.12,-1.98,.22,c,18,1.6);box(x,1.10,-1.94,.06,.40,.07,'#e7e2cc')}
 box(0,.68,-1.62,2.6,1.2,2.2,'#6a6b75');box(0,1.35,-1.62,2.85,.2,2.45,'#c9a47f');pole(0,1.36,-1.7,.9,.17,'#60856b');
 sphere(0,2.4,-1.7,.37,'#e5cb96',10,7,[1,.5,.5],1.5);for(let i=0;i<8;i++){const a=2*Math.PI*i/8;sphere(Math.cos(a)*.51,2.38+Math.sin(a)*.53,-1.7,.39,'#ddd5ed',9,5,[.62,1,.48],1.5)}
 sphere(0,2.39,-1.39,.18,'#ffd79d',10,7,[1,1,.45],1.8);
 box(3.55,.72,.22,1.5,.87,1.5,'#bdaba7');box(3.55,1.25,.22,1.85,.12,1.8,'#d2c3ab');sphere(3.55,1.64,.15,.43,'#648f72',10,7,[1,.84,1]);
 for(let i=0;i<7;i++){const x=-5.05+i*1.65;const z=-4.2+(i%2)*.5;pole(x,0,z,.8,.13,'#527b5c');sphere(x,1.03,z,.52,'#4d8f76',8,5,[1,1.18,1]);sphere(x-.22,1.28,z+.20,.21,'#9abf85',7,4,[1,.6,.6]);}
 door(5.0,0,-5.03,1.5,3.9,'#4b6480');
}
function tower(){base('tower');rug(0,.4,6.5,3.6,'#565078');
 for(let x=-5.5;x<5.7;x+=1.5){box(x,3.1,-5.02,.28,5.7,.28,'#93829b');box(x,6.06,-4.9,.38,.40,.60,'#c3a88b')}
 disc(-.25,3.48,-4.84,1.66,'#8b7180',48);disc(-.25,3.48,-4.72,1.46,'#e6d2ac',48,1.55);ring(-.25,3.48,-4.67,1.48,.22,'#c39066',48,1.5);
 for(let i=0;i<12;i++){const a=i*Math.PI*2/12;box(-.25+Math.sin(a)*1.17,3.48+Math.cos(a)*1.17,-4.60,.11,.21,.08,'#6e5762')}
 box(-.25,3.83,-4.51,.13,1.1,.11,'#57415c');box(.22,3.48,-4.47,1.02,.12,.12,'#584863');sphere(-.25,3.48,-4.40,.13,'#c48e6c',8,5);
 for(let i=0;i<4;i++){let x=-4.9+i*.9;box(x,1.06,-1.78,.5,.24,.55,'#bc926f');pole(x,.9,-1.78,.9,.14,'#9f817a');sphere(x,2,-1.78,.18,'#e7ca91',9,6,[1,.5,1],1.5)}
 box(-3.4,.65,-1.9,2.05,1.3,1.45,'#78708a');box(-3.4,1.39,-1.9,2.4,.20,1.7,'#c9ae9b');for(let x of [-4,-3.4,-2.8])disc(x,1.5,-1.01,.24,'#e1bc78',16,1.5);
 box(-4.2,2.1,-4.9,1.35,.91,.13,'#a18471');box(-4.2,2.1,-4.73,1.07,.65,.07,'#dfcaab',1.5);
 door(4.36,0,-5.05,2.1,4.3,'#706984');ring(4.34,3.35,-4.69,.28,.09,'#e8cb99');
 box(5.15,.3,1.3,.95,.6,.9,'#67576a');
}
const artists={foyer,study,greenhouse,tower};
function buildScene(){vertices=[];colors=[];artists[room]();if(!gl)return;let a=new Float32Array(vertices),c=new Float32Array(colors);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,a.byteLength+c.byteLength,gl.STATIC_DRAW);gl.bufferSubData(gl.ARRAY_BUFFER,0,a);gl.bufferSubData(gl.ARRAY_BUFFER,a.byteLength,c);gl.enableVertexAttribArray(atPos);gl.vertexAttribPointer(atPos,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(atColor);gl.vertexAttribPointer(atColor,3,gl.FLOAT,false,0,a.byteLength)}
function perspective(fov,aspect,n,f){let t=1/Math.tan(fov/2);return [t/aspect,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]}
function lookAt(eye,center,up){let z=norm(eye.map((x,i)=>x-center[i])),x=norm([up[1]*z[2]-up[2]*z[1],up[2]*z[0]-up[0]*z[2],up[0]*z[1]-up[1]*z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]}
function multiply(a,b){let o=[];for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function transform(m,v){let p=[...v,1],r=[];for(let i=0;i<4;i++)r[i]=m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]*p[3];return r}
function camera(){let target=[0,2.35,-1.3],dist=11.0/zoom;return [Math.sin(yaw)*dist,3.7+Math.sin(pitch)*6,target[2]+Math.cos(yaw)*dist]}
function size(){if(!canvas)return false;const w=canvas.clientWidth,h=canvas.clientHeight,scale=Math.min(2,devicePixelRatio||1);if(w<=0||h<=0)return false;const nextW=Math.max(1,Math.round(w*scale)),nextH=Math.max(1,Math.round(h*scale));if(canvas.width===nextW&&canvas.height===nextH)return false;canvas.width=nextW;canvas.height=nextH;if(gl)gl.viewport(0,0,canvas.width,canvas.height);return true}
function paint2D(){
 const ctx=ctx2d;if(!ctx)return;const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);
 const sky=palette[room].sky;ctx.fillStyle=`rgb(${Math.round(sky[0]*255)},${Math.round(sky[1]*255)},${Math.round(sky[2]*255)})`;ctx.fillRect(0,0,W,H);
 const polys=[];
 for(let i=0;i<vertices.length;i+=9){
   let pts=[],dep=0,clipped=false;
   for(let k=0;k<3;k++){
     const v=[vertices[i+k*3],vertices[i+k*3+1],vertices[i+k*3+2]],q=transform(mvp,v),view=transform(viewMatrix,v);
     if(q[3]<=.01){clipped=true;break;}
     pts.push([(q[0]/q[3]+1)*W/2,(1-q[1]/q[3])*H/2]);dep+=-view[2];
   }
   if(clipped)continue;
   if(pts.every(p=>p[0]<0)||pts.every(p=>p[0]>W)||pts.every(p=>p[1]<0)||pts.every(p=>p[1]>H))continue;
   const r=Math.min(255,Math.round(colors[i]*255)),g=Math.min(255,Math.round(colors[i+1]*255)),b=Math.min(255,Math.round(colors[i+2]*255));
   polys.push([dep,pts,`rgb(${r},${g},${b})`]);
 }
 polys.sort((a,b)=>b[0]-a[0]);
 for(let j=0;j<polys.length;j++){const p=polys[j];ctx.beginPath();ctx.moveTo(...p[1][0]);ctx.lineTo(...p[1][1]);ctx.lineTo(...p[1][2]);ctx.closePath();ctx.fillStyle=p[2];ctx.fill();ctx.lineWidth=.8;ctx.strokeStyle=p[2];ctx.stroke();}
}
function redraw(){if(!webglReady||!canvas)return;if(canvas.width===0||canvas.clientWidth===0)return;projMatrix=perspective(rad(43),canvas.width/canvas.height,.05,100);viewMatrix=lookAt(camera(),[0,2.35,-1.3],[0,1,0]);mvp=multiply(projMatrix,viewMatrix);
 if(gl){const p=palette[room];gl.clearColor(...p.sky);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(uMatrix,false,new Float32Array(mvp));gl.drawArrays(gl.TRIANGLES,0,vertices.length/3);}else paint2D();
 positionSpots();
}
function positionSpots(){if(!canvas||!webglReady)return;const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;for(const el of document.querySelectorAll('#hotspots .hotspot')){let p=(spotLocations[room]||{})[el.dataset.object];if(!p){el.style.display='';continue;}let q=transform(mvp,p),xx=q[0]/q[3],yy=q[1]/q[3],x=(xx+1)*50,y=(1-yy)*50;el.style.left=x+'%';el.style.top=y+'%';el.style.display=q[3]<=0||x<2||x>98||y<3||y>96?'none':'';}}
function shader(type,src){let sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
function init(){container=$('sceneCanvas');canvas=$('room3d');if(!canvas||!container)return false;try{gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true})||canvas.getContext('experimental-webgl',{alpha:false,antialias:true});if(!gl)throw Error('WebGL unavailable');let vs=shader(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec3 color;uniform mat4 mvp;varying vec3 vColor;void main(){gl_Position=mvp*vec4(position,1.0);vColor=color;}');let fs=shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec3 vColor;void main(){gl_FragColor=vec4(vColor,1.0);}');prog=gl.createProgram();gl.attachShader(prog,vs);gl.attachShader(prog,fs);gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);atPos=gl.getAttribLocation(prog,'position');atColor=gl.getAttribLocation(prog,'color');uMatrix=gl.getUniformLocation(prog,'mvp');buf=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);webglReady=true;canvas.classList.remove('hidden');buildScene();size();redraw();}catch(e){
   console.info('WebGL is unavailable; using the built-in software 3D renderer.',e.message);
   gl=null;
   if(window.innerWidth<=600){available=false;canvas.classList.add('hidden');container.classList.add('fallback-2d');return false;}
   try{ctx2d=canvas.getContext('2d',{alpha:false});if(!ctx2d)throw Error('Canvas unavailable');webglReady=true;buildScene();size();redraw();canvas.classList.remove('hidden');}
   catch(error){available=false;console.warn('3D renderer unavailable; reverting to illustrated room.',error);canvas.classList.add('hidden');container.classList.add('fallback-2d');return false;}
 }
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw=Math.max(-.75,Math.min(.75,drag.yaw+(drag.x-e.clientX)/Math.max(250,canvas.clientWidth)*2));pitch=Math.max(-.32,Math.min(.35,drag.pitch+(e.clientY-drag.y)/Math.max(250,canvas.clientHeight)*.7));redraw();});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.82,Math.min(1.38,zoom+(e.deltaY<0?.07:-.07)));redraw();},{passive:false});
 for(const btn of document.querySelectorAll('[data-camera]'))btn.addEventListener('click',()=>{const k=btn.dataset.camera;if(k==='left')yaw=Math.max(-.75,yaw-.21);if(k==='right')yaw=Math.min(.75,yaw+.21);if(k==='reset'){yaw=0;pitch=0;zoom=1}if(k==='in')zoom=Math.min(1.38,zoom+.10);if(k==='out')zoom=Math.max(.82,zoom-.10);redraw()});
 window.addEventListener('resize',()=>{size();redraw()});if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(()=>{size();redraw()});resizeObserver.observe(canvas)}
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();webglReady=false;canvas.classList.add('hidden');container.classList.add('fallback-2d');});
 return true;
}
window.Moyeo3D={init,setRoom(next){if(!webglReady)return;const changed=next!==room;room=next;if(changed){yaw=0;pitch=0;zoom=1;buildScene()}const resized=size();if(changed||resized||!mvp)redraw();else positionSpots()},refresh(){if(!webglReady)return;if(size()||!mvp)redraw();else positionSpots()},supported(){return webglReady;},mode(){return gl?'webgl':ctx2d?'software-3d':'2d-illustration';}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();