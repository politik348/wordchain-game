import {YUT_ROUTES, YUT_NAMES, legalYutMoves, yutDestination, yutTravelNodes} from './yut-solo-engine.mjs?v=20261120yut4';

// Matches the historic 525x525 drawing coordinate system used by 모여게임즈.
export const YUT_COORDS={
 0:[495,495],1:[495,402],2:[495,309],3:[495,216],4:[495,123],5:[495,30],
 6:[402,30],7:[309,30],8:[216,30],9:[123,30],10:[30,30],
 11:[30,123],12:[30,216],13:[30,309],14:[30,402],15:[30,495],
 16:[123,495],17:[216,495],18:[309,495],19:[402,495],20:[495,495],
 21:[408,117],22:[318,205],23:[263,263],24:[210,318],25:[117,408],
 26:[117,117],27:[205,205],28:[318,318],29:[408,408]
};
const EDGE_COLORS=['#f26680','#468fce','#58ab91','#a27cd3'];
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>((n+15)*100/555).toFixed(4)+'%';
const pos=(node,dx=0,dy=0)=>{const [x,y]=YUT_COORDS[node]||YUT_COORDS[0];return `--yx:${pct(x+dx)};--yy:${pct(y+dy)};`;};
const segments=(()=>{
 const s=new Set();
 for(const route of Object.values(YUT_ROUTES))for(let j=0;j<route.length-1;j++){
  const a=route[j],b=route[j+1];if(a===0)continue;
  const key=[a,b].sort((x,y)=>x-y).join(':');s.add(key);
 }
 // Starting square is physically the same as the gateway 20.
 s.add('1:20');
 return [...s].map(key=>key.split(':').map(Number)).filter(([a,b])=>YUT_COORDS[a]&&YUT_COORDS[b]);
})();
const line=([a,b])=>{const [x1,y1]=YUT_COORDS[a], [x2,y2]=YUT_COORDS[b];return `<path d="M${x1} ${y1} L${x2} ${y2}" class="yut-road"/>`;};
const STICK_ROTATION=[-14,9,-7,13];
export function throwFaces(value){
 if(value===5)return [0,0,0,0];
 if(value===-1)return [1,0,0,0];
 return [0,1,2,3].map(i=>i<Number(value)?1:0);
}
export function renderYutThrow({roll=null,rolling=false,actor='윷을 던져보세요',showAction=false,action='roll',disabled=false,power=0}={}){
 const face=throwFaces(roll);
 const sticks=face.map((flat,i)=>`<span class="yut-wood ${flat?'flat':'round'} ${roll===-1&&i===0?'backdo':''}" style="--tilt:${STICK_ROTATION[i]}deg;--order:${i}"><i>${roll===-1&&i===0?'↶':flat?'×':'✦'}</i></span>`).join('');
 const name=roll===null?'윷 던지기':YUT_NAMES[roll]||'윷 던지기';
 const safePower=Math.max(0,Math.min(100,Math.round(Number(power)||0)));
 const lift=36+safePower*.6;
 const duration=800+safePower*4;
 const style=`--yut-power:${safePower}%;--yut-lift:${lift}px;--yut-duration:${duration}ms;`;
 const powerButton=showAction?`<button type="button" class="button button-primary yut-main-roll yut-charge-button" data-action="${escapeHtml(action)}" data-yut-hold="1" ${disabled||rolling?'disabled':''} aria-label="윷 던지기: 누르고 있는 동안 힘을 모으고 떼면 던집니다"><span class="yut-charge-label">${rolling?'🎲 윷이 날아가고 있어요':'🎲 꾹 눌렀다 놓기'}</span><span class="yut-power-meter" aria-hidden="true"><span class="yut-power-fill"></span></span><span class="yut-power-caption" aria-hidden="true">${rolling?'파워 '+safePower+'%':'POWER 0%'}</span></button>`:'';
 return `<div class="yut-throwbox ${rolling?'is-rolling':''}" style="${style}" aria-live="polite"><div class="yut-throw-title"><span>🎋 윷 던지기</span><strong>${escapeHtml(actor)}</strong></div><div class="yut-throw-stage"><div class="yut-stick-pack" aria-label="네 개의 윷가락">${sticks}</div><span class="yut-throw-result">${rolling?'던지는 중…':escapeHtml(name)}${!rolling&&roll!==null?` <small>${roll===-1?'1칸 뒤로':roll+'칸 전진'}</small>`:''}</span></div>${powerButton}${showAction?'<p class="yut-power-help">길게 눌러 파워를 조절하고 손을 떼세요. 파워는 연출용이며 윷 결과의 확률은 동일해요.</p>':''}</div>`;
}
export function renderYutRollTray({rolls=[],phase='throw',chosen=[0],action='yutRollChoice',myTurn=false}={}){
 const list=rolls.map((value,index)=>{
  const active=phase==='move'&&chosen.includes(index);
  const label=YUT_NAMES[value]||'?';
  return `<button type="button" class="yut-roll-chip ${active?'is-selected':''}" data-action="${escapeHtml(action)}" data-roll-index="${index}" aria-pressed="${active}" ${phase!=='move'||!myTurn?'disabled':''}><strong>${escapeHtml(label)}</strong><small>${value===-1?'뒤로 1칸':value+'칸'}</small></button>`;
 }).join('');
 const total=chosen.length?chosen.reduce((sum,i)=>sum+(rolls[i]||0),0):0;
 const hint=phase==='throw'?'윷/모가 나오면 계속 던집니다. 던지기를 마친 뒤 이동하세요.':myTurn?'결과를 하나 또는 여러 개 선택하고 말을 누르세요.':'상대가 말을 움직이고 있습니다.';
 return `<div class="yut-roll-tray"><div class="yut-roll-head"><strong>🎯 나온 결과 · ${rolls.length}개</strong>${phase==='move'&&myTurn?`<span>${chosen.length?'선택: '+(total===-1?'빽도':total+'칸'):'사용할 윷을 선택'}</span>`:''}</div><div class="yut-roll-chips">${list||'<span class="yut-roll-empty">아직 나온 결과가 없습니다.</span>'}</div><p>${hint}</p></div>`;
}
export function renderYutPieceStats(pieces={},labels={},me=''){
 return `<div class="yut-participant-grid">${Object.entries(pieces).map(([sid,tokens],i)=>{
  const waiting=tokens.filter(t=>!t.done&&t.node===0).length;
  const active=tokens.filter(t=>!t.done&&t.node!==0).length;
  const finished=tokens.filter(t=>t.done).length;
  return `<div class="yut-participant ${sid===me?'is-own':''}"><div><b>${['🔴','🔵','🟢','🟣'][i%4]} ${escapeHtml(labels[sid]||(sid===me?'나':'상대'))}</b><small>${sid===me?'내 말':'상대 말'} · 총 4개</small></div><div class="yut-pieces-count"><span>대기 <b>${waiting}</b></span><span>말판 <b>${active}</b></span><span>완주 <b>${finished}</b></span></div></div>`;
 }).join('')}</div>`;
}
export function renderYutBoard({pieces={},me='',turn='',steps=null,active=true,action='yutPick',routeAction='yutRoute',selected=null,lastMove=null,labels={}}={}){
 const pids=Object.keys(pieces),mine=pieces[me]||[],allowed=active&&turn===me&&Number.isInteger(steps);
 const list=allowed?legalYutMoves(mine,steps):[];
 const legalIndices=new Set(list.map(v=>v.index));
 const visual=[];
 pids.forEach((pid,pidx)=>{
  const byNode={};(pieces[pid]||[]).forEach((p,i)=>{
   if(p.done||p.node===0)return;
   (byNode[p.node]??=[]).push({p,i});
  });
  for(const [n,stack] of Object.entries(byNode)){
   stack.forEach(({i},j)=>{
    const dx=(j%3-1)*12+(pidx%2?5:-5),dy=(Math.floor(j/3)-.4)*12+(pidx>=2?7:0);
    const can=pid===me&&allowed&&legalIndices.has(i);
    const recently=lastMove?.sid===pid&&lastMove?.index===i;
    const cls=`yut-token ${can?'is-available':''} ${pid===me?'is-mine':''} ${selected===i&&pid===me?'is-previewing':''} ${recently?'just-moved':''}`;
    const style=pos(Number(n),dx,dy)+`--token-color:${EDGE_COLORS[pidx%4]};`;
    const title=`${escapeHtml(labels[pid]|| (pid===me?'내 말':'상대 말'))} ${i+1}번 · ${n}번 자리`;
    visual.push(pid===me?`<button type="button" class="${cls}" style="${style}" data-action="${escapeHtml(action)}" data-index="${i}" aria-label="${title}" title="${title}" ${!can?'disabled':''}>${i+1}</button>`:`<span class="${cls}" style="${style}" title="${title}" aria-label="${title}">${i+1}</span>`);
   });
  }
 });
 const routeBtns=[],previewLines=[];
 if(selected!==null&&allowed&&mine[selected]){
  const options=list.filter(m=>m.index===selected);
  options.forEach((m,k)=>{
   const d=yutDestination(mine[selected],steps,m.shortcut);
   const path=yutTravelNodes(mine[selected],steps,m.shortcut).map(n=>YUT_COORDS[n]||YUT_COORDS[20]);
   if(path.length>1)previewLines.push(`<polyline class="yut-preview-path ${k?'alternate':''}" points="${path.map(([x,y])=>x+','+y).join(' ')}"/>`);
   if(!d.done){
    const style=pos(d.node,m.shortcut?-14:14,m.shortcut?-15:15);
    routeBtns.push(`<button type="button" class="yut-target" style="${style}" data-action="${escapeHtml(routeAction)}" data-index="${selected}" data-shortcut="${m.shortcut?'1':'0'}" aria-label="${m.shortcut?'지름길':'바깥길'} ${steps}칸 이동 확정">${m.shortcut?'↘':'→'}</button>`);
   }else routeBtns.push(`<button type="button" class="yut-finish-preview" data-action="${escapeHtml(routeAction)}" data-index="${selected}" data-shortcut="${m.shortcut?'1':'0'}">🏁 HOME 완주 확정</button>`);
  });
 }
 const nodes=Object.entries(YUT_COORDS).filter(([n])=>n!=='0').map(([n,[x,y]])=>{
  const anchor=[5,10,15,20].includes(Number(n)),center=n==='23';
  return `<circle class="yut-point ${anchor?'big':''} ${center?'center':''}" cx="${x}" cy="${y}" r="${anchor||center?19:12}"/>`;
 }).join('');
 const onBoard=`<div class="yut-liveboard"><svg class="yut-canvas" viewBox="-15 -15 555 555" role="img" aria-label="윷놀이 말판. 말 선택 시 이동 경로 미리보기"><rect class="yut-canvas-bg" x="-12" y="-12" width="549" height="549" rx="28"/>${segments.map(line).join('')}${nodes}${previewLines.join('')}<text x="433" y="524" class="yut-home-label">HOME</text></svg>${routeBtns.join('')}${visual.join('')}</div>`;
 const reserve=mine.map((p,i)=>{
  const can=allowed&&legalIndices.has(i)&&!p.done&&p.node===0;
  const status=p.done?'도착':p.node===0?'대기':'이동 중';
  return `<button type="button" class="yut-reserve-token ${can?'is-available':''} ${selected===i?'is-previewing':''} ${p.done?'is-finished':''}" data-action="${escapeHtml(action)}" data-index="${i}" ${!can?'disabled':''} aria-label="내 ${i+1}번 말 ${status}"><span>${p.done?'✓':i+1}</span><small>${status}</small></button>`;
 }).join('');
 return `${onBoard}<div class="yut-reserve"><div class="yut-reserve-head"><strong>내 말 4개</strong><small>${allowed?'움직일 말을 선택해 경로를 확인하세요':active?'던지기를 마치면 말을 움직일 수 있어요':'대국 종료'}</small></div><div class="yut-reserve-row">${reserve}</div></div>`;
}
export function renderYutRouteChooser(mine,steps,index,action='yutRoute'){
 if(index===null||index===undefined||!Number.isInteger(steps))return '';
 const choices=legalYutMoves(mine,steps).filter(m=>m.index===index);
 if(!choices.length)return '';
 const buttons=choices.map(m=>{
  const target=yutDestination(mine[index],steps,m.shortcut);
  const label=choices.length>1?(m.shortcut?'↘ 지름길':'→ 바깥길'):'이 경로로';
  return `<button type="button" class="yut-route-option" data-action="${escapeHtml(action)}" data-index="${index}" data-shortcut="${m.shortcut?'1':'0'}">${label} 이동 확정 <small>${target.done?'🏁 완주!':target.node===20?'HOME':target.node+'번 자리'} · ${steps===-1?'빽도':steps+'칸'}</small></button>`;
 }).join('');
 return `<div class="yut-route-picker"><strong>👀 ${index+1}번 말 이동 경로 미리보기</strong><div>${buttons}</div><p>말판에 표시된 경로를 확인한 뒤 버튼을 눌러 이동을 확정하세요. 선택만으로는 움직이지 않습니다.</p></div>`;
}
