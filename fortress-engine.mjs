(function engine(root){
'use strict';
const W=2400,H=500,VIEW_W=960,G=.28,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const w=(name,damage,radius,spread=[0],effect='',speed=1)=>({name,damage,radius,spread,effect,speed});
const t=(name,hp,move,angles,weapons,desc,color,shape)=>({name,hp,move,angles,weapons,desc,color,shape});
const TANKS={
cannon:t('캐논',100,65,[10,85],[w('분쇄탄',28,50),w('빨콩',38,30,[0],'red')],'지형 파괴와 직격 공격','#e6a63b','cannon'),
catapult:t('캐터펄트',110,53,[25,85],[w('바위탄',35,35),w('산탄',19,25,[-6,0,6])],'높은 포물선과 산탄','#7d9850','catapult'),
missile:t('미사일',95,85,[10,80],[w('로켓탄',35,35),w('3연발',23,27,[-4,0,4])],'이동력과 연속 공격','#438ad5','missile'),
laser:t('레이저',90,76,[5,80],[w('광탄',40,23,[0],'',1.12),w('관통광',51,19,[0],'',1.15)],'빠른 탄속, 좁고 강한 공격','#a06cdb','laser'),
venom:t('베놈',98,71,[10,85],[w('독침탄',29,28,[0],'poison'),w('맹독탄',24,45,[0],'poison')],'두 차례 지속 독 피해','#70b645','venom'),
flame:t('플레임',102,64,[10,82],[w('화염탄',32,33,[0],'burn'),w('불꽃비',18,27,[-5,0,5],'burn')],'화상 지속 피해','#e55a2b','flame'),
frost:t('프로스트',105,58,[15,85],[w('빙결탄',30,30,[0],'freeze'),w('눈보라탄',22,42,[0],'freeze')],'상대 이동력과 조준 범위 감소','#65c9ed','frost'),
seeker:t('시커',90,80,[10,80],[w('추적탄',31,25,[0],'homing'),w('쌍발 유도탄',20,24,[-5,5],'homing')],'비행 중 제한적으로 적 추적','#d57b39','seeker'),
mortar:t('모타르',116,44,[35,85],[w('박격포탄',36,43),w('중력탄',44,55)],'높은 각도와 넓은 지형 파괴','#87959f','mortar'),
thunder:t('썬더',94,72,[10,85],[w('전격탄',34,29,[0],'shock'),w('연쇄 번개탄',26,37,[0],'shock')],'명중 시 행동 지연 증가','#e1c64b','thunder'),
guardian:t('가디언',132,45,[12,80],[w('방패포탄',30,31),w('충격탄',38,38)],'높은 체력과 기본 방어력','#5297a6','guardian'),
scout:t('스카우트',84,115,[8,85],[w('속사탄',29,25,[0],'',1.13),w('쌍발탄',23,24,[-3,3])],'높은 기동력, 짧은 행동 지연','#ec8eaf','scout'),
super:t('슈퍼탱크',125,88,[8,85],[w('별빛탄',46,39),w('슈퍼노바',30,35,[-6,0,6],'homing')],'5% 희귀 추첨 · 강력한 화력','#ffcb55','super')
};
const MAPS={valley:'초록 협곡',desert:'황혼 사막',moon:'달빛 고원',islands:'하늘 섬',pirate:'하늘 해적선',mine:'황혼의 수정 광산'};
function rng(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function terrain(map,random){let phase=random()*3;return Array.from({length:W},(_,x)=>{let y;if(map==='desert')y=330+39*Math.sin(x/115+phase)+22*Math.sin(x/43);else if(map==='pirate')y=315+42*Math.cos(x/150+phase)+14*Math.cos(x/46);else if(map==='mine')y=310+45*Math.sin(x/85+phase)+18*Math.cos(x/32);else if(map==='moon')y=325+55*Math.cos(x/130+phase)+25*Math.sin(x/32);else if(map==='islands'){if(x<32||x>W-32||(x>W/2-100&&x<W/2+100))return H+80;y=300+28*Math.sin(x/75+phase)+14*Math.cos(x/31);}else y=325+65*Math.sin(x/155+phase)+22*Math.cos(x/57);return Math.round(clamp(y,200,420));});}
const ordinary=Object.keys(TANKS).filter(k=>k!=='super');
function pick(r){return r()<.05?'super':ordinary[Math.floor(r()*ordinary.length)];}
// Each column holds solid vertical intervals, not just a height. Ordinary
// ground uses the compact implicit [ground[x],H] interval.
function column(s,x){x=Math.round(x);if(x<0||x>=W)return [];return s.bands?.[x]??(s.ground[x]<H?[s.ground[x],H]:[]);}
function setColumn(s,x,b){if(x<0||x>=W)return;s.bands??={};s.ground[x]=b.length?b[0]:H+80;if(!b.length||b.length===2&&b[1]===H)delete s.bands[x];else s.bands[x]=b;}
function cutColumn(s,x,lo,hi){let b=column(s,x),out=[];for(let j=0;j<b.length;j+=2){let a=b[j],z=b[j+1];if(z<=lo||a>=hi){out.push(a,z);continue;}if(a<lo)out.push(a,lo);if(z>hi)out.push(hi,z);}setColumn(s,x,out);}
function solid(s,x,y){if(y<0||y>=H)return false;x=Math.round(x);if(x<0||x>=W)return false;let b=s.bands?.[x];if(!b)return y>=s.ground[x];for(let j=0;j<b.length;j+=2)if(y>=b[j]&&y<b[j+1])return true;return false;}
function support(s,x,y){const b=column(s,x);for(let j=0;j<b.length;j+=2){if(b[j]>=y-5)return b[j];if(y>=b[j]&&y<b[j+1]&&y-b[j]<12)return b[j];}return H+80;}
function shapeTerrain(s){let map=s.map;
// Distinct destructible silhouettes, with clear starting zones for eight tanks.
for(let x=0;x<W;x++){let top=s.ground[x];if(top>=H)continue;
 if(map==='islands'){let thick=42+Math.round(8*Math.cos(x/53));setColumn(s,x,[top,Math.min(H,top+thick)]);}
 else if(map==='pirate'&&(x<820||x>1580)){setColumn(s,x,[top,Math.min(H,top+66)]);}
 else if(map==='moon'&&((x>750&&x<900)||(x>1500&&x<1650))){setColumn(s,x,[top,top+45,Math.min(H-10,top+110),H]);}
 else if(map==='mine'&&x>850&&x<1550){setColumn(s,x,[top,Math.min(H-55,top+38),H-40,H]);}
 else if(map==='valley'&&x>1050&&x<1350){setColumn(s,x,[top,Math.min(H-45,top+45),H-35,H]);}
 else if(map==='desert'&&x>1060&&x<1340){setColumn(s,x,[top,Math.min(H,top+36)]);}
}
if(map==='islands'||map==='pirate'){for(let x=1060;x<1340;x++){let top=365+Math.round(12*Math.cos((x-1200)/70));setColumn(s,x,[top,top+26]);}}
s.terrainRev=1;
}
function create(opts={}){const seed=Number(opts.seed??Date.now())>>>0,r=rng(seed),map=MAPS[opts.map]?opts.map:'valley',ground=terrain(map,r),size=clamp(Math.trunc(Number(opts.size)||1),1,4);let tanks=[];for(let team=0;team<2;team++)for(let j=0;j<size;j++){let choice=j===0?(team?opts.enemy:opts.tank):'random',type=opts.lineup?.[team*size+j]|| (choice==='random'||!TANKS[choice]?pick(r):choice);let x=Math.round((team?1950:450)+(j-(size-1)/2)*76);let spec=TANKS[type];tanks.push({type,team,x,y:ground[x],hp:spec.hp,angle:45,power:56,dir:team?-1:1,weapon:0,move:spec.move,items:{double:1,heal:1,teleport:1,powerup:1,shield:1,wind:1},double:false,boost:false,shield:0,poison:0,burn:0,freeze:0,shock:0,delay:0});}let s={seed,map,ground,bands:{},pillars:[{x:1200,width:72,top:-280,bottom:H,kind:'fire'}],hazards:[],terrainRev:0,tanks,size,turn:0,round:1,wind:Math.round((r()*2-1)*12),nonce:0,phase:'aim',winner:null,last:null,log:['전투 시작!'],shots:[],timer:opts.timer||30,collapse:opts.collapse!==false};shapeTerrain(s);return s;}
function randomTurn(s){return rng((s.seed+Math.imul(s.nonce+1,2654435761))>>>0);}
function surface(s,x){return x<0||x>=W?H+80:s.ground[Math.round(clamp(x,0,W-1))];}
function slope(s,x,y){let a=y===undefined?surface(s,x-14):support(s,x-14,y-28),b=y===undefined?surface(s,x+14):support(s,x+14,y-28);if(a>=H&&b>=H){a=surface(s,x-14);b=surface(s,x+14);}if(a>=H||b>=H)return 0;return clamp(Math.atan2(b-a,28)*180/Math.PI,-30,30);}
function actualAngle(s,t,angle=t.angle,dir=t.dir){return clamp(angle-dir*slope(s,t.x,t.y),-15,89);}
function chargePower(ms,max=100){return clamp(Math.round(12+(max-12)*clamp(ms/1400,0,1)),12,max);}
function move(s,dir,steps=4){if(s.phase!=='aim')return false;let t=s.tanks[s.turn];t.dir=dir<0?-1:1;let moved=false;for(let j=0;j<steps&&t.move>0;j++){let nx=t.x+t.dir,ny=support(s,nx,t.y-5);if(nx<18||nx>W-18||ny>=H||Math.abs(ny-t.y)>5)break;if(s.tanks.some(p=>p!==t&&p.hp>0&&Math.abs(p.x-nx)<27&&Math.abs(p.y-ny)<30))break;t.x=nx;t.y=ny;t.move--;moved=true;}return moved;}
function aim(s,angle,power,dir,weapon){if(s.phase!=='aim')return;let t=s.tanks[s.turn],a=TANKS[t.type].angles;t.angle=clamp(Number(angle)||0,a[0],a[1]);t.power=clamp(Number(power)||0,12,t.frozenTurn?65:100);if(dir===1||dir===-1)t.dir=dir;if(weapon===0||weapon===1)t.weapon=weapon;}
function weaponPhysics(t,weapon){let spec=TANKS[t.type].weapons[weapon];let wind=t.type==='laser'?.32:t.type==='scout'?.7:t.type==='mortar'?1.24:t.type==='catapult'?1.15:1,gravity=t.type==='laser'?.85:t.type==='mortar'?1.12:t.type==='catapult'?1.05:1;return {...spec,wind,gravity};}
function trace(s,t,angle,power,dir,weapon){let spec=weaponPhysics(t,weapon),a=actualAngle(s,t,angle,dir)*Math.PI/180,speed=(3.2+power*.24)*(spec.speed||1),x=t.x+dir*Math.cos(a)*22,y=t.y-18-Math.sin(a)*22,vx=dir*Math.cos(a)*speed,vy=-Math.sin(a)*speed;let points=[[x,y]],hit=null,boostAt=-1;let o=s.tanks.filter(p=>p.team!==t.team&&p.hp>0).sort((p,q)=>Math.abs(p.x-t.x)-Math.abs(q.x-t.x))[0];for(let i=0;i<800;i++){if(spec.effect==='homing'&&o&&i>10&&i<120&&vy>0){let dx=o.x-x,dy=o.y-13-y,d=Math.hypot(dx,dy)||1;vx+=clamp(dx/d*.18,-.18,.18);vy+=clamp(dy/d*.09,-.09,.09);}vx+=s.wind*.0035*spec.wind;vy+=G*spec.gravity;let ox=x,oy=y;x+=vx;y+=vy;let count=Math.max(1,Math.ceil(Math.hypot(vx,vy)/7));for(let j=1;j<=count;j++){let px=ox+(x-ox)*j/count,py=oy+(y-oy)*j/count;
if(boostAt<0&&(s.pillars||[]).some(p=>Math.abs(px-p.x)<=p.width/2&&py>=p.top&&py<=p.bottom)){boostAt=points.length;vx*=1.08;vy*=1.08;}
if(px<0||px>=W||py>H+65||py< -1800)continue;let target=s.tanks.findIndex(p=>p.hp>0&&(p!==t||i>8)&&Math.hypot(px-p.x,py-(p.y-13))<16);if(target>=0||solid(s,px,py)){const p=s.tanks[target];let crown=!!p&&vy>0&&py<p.y-18&&Math.abs(px-p.x)<10;hit={x:px,y:py,target,crown,enhanced:boostAt>=0};x=px;y=py;break;}}points.push([x,y]);if(hit||x<0||x>=W||y>H+65||y< -1800)break;}return {points,hit,boostAt,delay:0};}
function plan(s,angle,power,dir,weapon){let t=s.tanks[s.turn],spec=TANKS[t.type].weapons[weapon];return spec.spread.map(d=>trace(s,t,angle+d,power,dir,weapon));}
function shotSpec(t,hit){const spec={...TANKS[t.type].weapons[t.weapon]};if(t.boost)spec.damage*=1.35;if(hit?.enhanced){spec.damage*=1.25;spec.radius=Math.round(spec.radius*1.12);}return spec;}
function flightDuration(paths){return Math.max(0,...paths.map(p=>(p.delay||0)+p.points.length))*12;}
function fire(s){if(s.phase!=='aim')return [];let t=s.tanks[s.turn],shots=plan(s,t.angle,t.power,t.dir,t.weapon),scratch={...s,ground:s.ground.slice(),bands:{...s.bands},tanks:s.tanks.map(p=>({...p})),hazards:(s.hazards||[]).slice()},sim=scratch.tanks[s.turn];
applyWave(scratch,shots,sim,true);
if(t.double&&sim.hp>0&&scratch.tanks.some(p=>p.team!==sim.team&&p.hp>0)){
 let delay=Math.ceil(flightDuration(shots)/12)+20,second=plan(scratch,sim.angle,sim.power,sim.dir,sim.weapon);for(let sh of second)sh.delay=delay;applyWave(scratch,second,sim,true);shots.push(...second);
}
s.shots=shots;s.phase='flight';return shots;}
function damage(p,n){p.hp=Math.max(0,p.hp-Math.max(0,Math.round(n*(p.shield?.55:1)*(p.type==='guardian'?.88:1))));}
function blastTerrain(s,hit,radius){for(let i=Math.max(0,Math.floor(hit.x-radius));i<Math.min(W,Math.ceil(hit.x+radius));i++){let span=Math.sqrt(Math.max(0,radius**2-(i-hit.x)**2));cutColumn(s,i,Math.floor(hit.y-span),Math.ceil(hit.y+span));}s.terrainRev=(s.terrainRev||0)+1;}
function hitDamage(spec,hit,p,j){let d=Math.hypot(p.x-hit.x,p.y-13-hit.y);if(j===hit.target)return spec.damage*(hit.crown?(spec.effect==='red'?1.50:1.28):1.12);return Math.round(spec.damage*Math.max(0,1-d/(spec.radius+18))*.82);}
function impact(s,hit,spec){if(!hit)return [];let {x,y,target}=hit,events=[];blastTerrain(s,hit,spec.radius);
for(let j=0;j<s.tanks.length;j++){let p=s.tanks[j];if(p.hp<=0)continue;let dmg=hitDamage(spec,hit,p,j);if(dmg<=0)continue;let hp=p.hp;damage(p,dmg);events.push({unit:j,x:p.x,y:p.y,damage:hp-p.hp,direct:j===target,crown:j===target&&hit.crown});if(dmg>=8){if(spec.effect==='poison')p.poison=Math.max(p.poison,2);if(spec.effect==='burn')p.burn=Math.max(p.burn,2);if(spec.effect==='freeze')p.freeze=Math.max(p.freeze,1);if(spec.effect==='shock')p.delay+=40;}}
if(['poison','burn'].includes(spec.effect)){s.hazards??=[];s.hazards.push({x,y,r:spec.radius,kind:spec.effect,expires:s.round+4});s.hazards=s.hazards.slice(-12);}
return events;}
function settle(s){let events=[];for(let j=0;j<s.tanks.length;j++){let p=s.tanks[j];if(p.hp<=0)continue;let y=support(s,p.x,p.y),oldY=p.y,hp=p.hp;if(y>=H||p.x<0||p.x>=W){p.hp=0;p.y=H+30;events.push({unit:j,x:p.x,y:oldY,toY:p.y,damage:hp,bungee:true});}else{let fall=y-p.y;if(fall>45)damage(p,(fall-45)*.22);p.y=y;if(fall>8)events.push({unit:j,x:p.x,y:oldY,toY:y,damage:hp-p.hp,fall:true});}}return events;}
function applyWave(s,shots,t,annotate=false){for(let sh of shots){if(!sh.hit)continue;let spec=shotSpec(t,sh.hit),events=impact(s,sh.hit,spec);if(annotate){sh.events=events;sh.radius=spec.radius;sh.effect=spec.effect;}}let falls=settle(s);if(annotate&&falls.length&&shots.length){let last=shots.reduce((a,b)=>a.points.length>b.points.length?a:b);last.events=(last.events||[]).concat(falls);}return falls;}
function victory(s){let a=s.tanks.some(p=>p.team===0&&p.hp>0),b=s.tanks.some(p=>p.team===1&&p.hp>0);if(a&&b)return false;s.phase='over';s.winner=a?0:b?1:-1;s.shots=[];return true;}
function next(s){let prev=s.tanks[s.turn];prev.delay+=prev.type==='scout'?70:100; if(prev.shield)prev.shield--;s.round++;s.nonce++;let r=randomTurn(s);s.wind=Math.round((r()*2-1)*12);if(s.collapse&&s.round>=12){let edge=Math.min(290,Math.floor((s.round-11)*5));for(let x=0;x<W;x++){if(x<edge||x>=W-edge)setColumn(s,x,[]);else if(s.ground[x]<H){let b=column(s,x),out=[],d=s.round%3===0?3:1;for(let j=0;j<b.length;j+=2)if(b[j]+d<b[j+1])out.push(b[j]+d,b[j+1]);setColumn(s,x,out);}}s.terrainRev++;settle(s);if(s.round%3===0)s.log.unshift('전장 붕괴 · 양쪽 가장자리가 무너집니다.');}if(s.round>=160&&!victory(s)){let hp=[0,0];s.tanks.forEach(p=>hp[p.team]+=p.hp);s.phase='over';s.winner=hp[0]===hp[1]?-1:hp[0]>hp[1]?0:1;return;}if(victory(s))return;let targetTeam=1-prev.team;for(let tries=0;tries<s.tanks.length;tries++){let pool=s.tanks.map((p,i)=>({p,i})).filter(({p})=>p.hp>0).sort((a,b)=>a.p.delay-b.p.delay||(a.p.team===targetTeam?0:1)-(b.p.team===targetTeam?0:1)||a.i-b.i);if(!pool.length){victory(s);return;}let {p,i}=pool[0];s.turn=i;s.hazards=(s.hazards||[]).filter(h=>h.expires>=s.round);for(let h of s.hazards){if(Math.hypot(h.x-p.x,h.y-p.y)<h.r+15){if(h.kind==='poison')p.poison=Math.max(p.poison,1);else p.burn=Math.max(p.burn,1);}}if(p.poison){damage(p,9);p.poison--;s.log.unshift('독 피해 −9');}if(p.burn){damage(p,7);p.burn--;s.log.unshift('화상 피해 −7');}if(victory(s))return;if(p.hp<=0)continue;p.frozenTurn=!!p.freeze;p.move=p.freeze?Math.floor(TANKS[p.type].move*.25):TANKS[p.type].move;if(p.freeze){p.freeze--;p.power=Math.min(p.power,65);s.log.unshift('빙결 · 이동력 감소');}break;}s.phase='aim';s.shots=[];s.log=s.log.slice(0,10);}
function finish(s){if(s.phase!=='flight')return;let t=s.tanks[s.turn],spec=TANKS[t.type].weapons[t.weapon],before=s.tanks.map(p=>p.hp),groups=new Map();for(let sh of s.shots){let key=sh.delay||0;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(sh);}for(let group of groups.values())applyWave(s,group,t);let diff=before.map((hp,i)=>hp-s.tanks[i].hp);let combo=s.shots.some(sh=>sh.delay>0);s.last={turn:s.turn,damage:diff};s.log.unshift(TANKS[t.type].name+' '+spec.name+(combo?' DOUBLE':'')+' · 총 피해 '+diff.reduce((a,b)=>a+b,0));if(s.shots.some(sh=>sh.events?.some(v=>v.bungee)))s.log.unshift('BUNGEE! 발판 붕괴');t.boost=false;t.double=false;if(victory(s))return;t.delay+=(t.weapon?25:0)+(combo?55:0);next(s);}
function item(s,key){if(s.phase!=='aim')return false;let t=s.tanks[s.turn];if(!t.items[key])return false;if(key==='heal'){if(t.hp===TANKS[t.type].hp)return false;t.hp=Math.min(TANKS[t.type].hp,t.hp+26);}else if(key==='double')t.double=true;else if(key==='powerup')t.boost=true;else if(key==='shield')t.shield=2;else if(key==='wind')s.wind=0;else if(key==='teleport'){let direction=t.dir,found=false;for(let d=145;d>=45;d-=5){let x=t.x+direction*d,y=surface(s,x);if(x>30&&x<W-30&&y<H-15&&!s.tanks.some(p=>p!==t&&p.hp>0&&Math.abs(p.x-x)<35)){t.x=x;t.y=y;found=true;break;}}if(!found)return false;}else return false;t.items[key]--;t.delay+=10;return true;}
function skip(s){if(s.phase==='aim'){s.tanks[s.turn].double=false;s.log.unshift(`${TANKS[s.tanks[s.turn].type].name} 턴 종료`);next(s);}}
function chooseAI(s,level='normal'){let t=s.tanks[s.turn],en=s.tanks.filter(p=>p.team!==t.team&&p.hp>0),o=en.slice().sort((a,b)=>Math.abs(a.x-t.x)-Math.abs(b.x-t.x))[0],dir=o.x>=t.x?1:-1,range=TANKS[t.type].angles,step=level==='hard'?3:level==='normal'?5:8,best={score:-Infinity,angle:45,power:55,dir,weapon:0};for(let weapon=0;weapon<2;weapon++)for(let a=range[0];a<=range[1];a+=step)for(let p=12;p<=(t.frozenTurn?65:100);p+=step){let shots=plan(s,a,p,dir,weapon),spec=TANKS[t.type].weapons[weapon],score=0;for(let sh of shots){if(!sh.hit){score-=30;continue;}let h=sh.hit,actual=shotSpec(t,h),d=Math.min(...en.map(o=>Math.hypot(h.x-o.x,h.y-o.y+13)));score-=d*.045;for(let j=0;j<s.tanks.length;j++){let p=s.tanks[j];if(p.hp<=0)continue;let dmg=hitDamage(actual,h,p,j);score+=dmg*(p.team===t.team?-1.8:1);}}if(score>best.score)best={score,angle:a,power:p,dir,weapon};}let r=randomTurn(s),err=level==='hard'?0:level==='normal'?2:5;best.angle=clamp(best.angle+Math.round((r()*2-1)*err),range[0],range[1]);best.power=clamp(best.power+Math.round((r()*2-1)*err),12,t.frozenTurn?65:100);return best;}
root.FortressEngine={W,H,VIEW_W,slope,actualAngle,chargePower,column,solid,support,cutColumn,blastTerrain,flightDuration,TANKS,MAPS,create,move,aim,fire,finish,item,skip,chooseAI,trace,plan,surface,pick};
})(globalThis);

export default globalThis.FortressEngine;
