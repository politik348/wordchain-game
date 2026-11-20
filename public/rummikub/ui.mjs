/** Easy-to-use Rummikub game controls. Scoped to rk-* to avoid other Moyeo games. */
import {COLORS, meldInfo, tileFromId} from './engine.mjs';
import {recommendMove} from './suggest.mjs';
const drafts=new Map();
let host=null,dragged=null,touchDrag=null,suppressClickUntil=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const colorName={red:'빨강',blue:'파랑',black:'검정',orange:'주황',joker:'조커'};
const byNumber=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?99:x.value)-(y.joker?99:y.value)||COLORS.indexOf(x.color)-COLORS.indexOf(y.color);};
const byColor=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?9:COLORS.indexOf(x.color))-(y.joker?9:COLORS.indexOf(y.color))||x.value-y.value;};
const context=()=>host?.getContext?.();
const active=c=>c?.r?.status==='playing'&&c.r.state.turn===c.sid;
function draftFor(r){
 const s=r.state,key=`${r.id}:${s.matchId}:${s.turnNumber}:${s.turn}`;
 if(!drafts.has(key)){
   if(drafts.size>45)drafts.clear();
   drafts.set(key,{rack:[...s.hand],groups:s.table.map(g=>[...g]),baseHand:[...s.hand],baseTable:clone(s.table),selected:null,history:[],message:''});
 }
 return drafts.get(key);
}
function remember(d){d.history.push({rack:[...d.rack],groups:clone(d.groups)});if(d.history.length>50)d.history.shift();}
function reset(d){d.rack=[...d.baseHand];d.groups=clone(d.baseTable);d.history=[];d.selected=null;d.message='턴 시작 상태로 복구했어요.';}
function locate(d,id){const i=d.rack.indexOf(id);if(i>=0)return {type:'rack',index:i};for(let group=0;group<d.groups.length;group++){const index=d.groups[group].indexOf(id);if(index>=0)return {type:'group',group,index};}return null;}
function move(d,id,to,index){
 const origin=locate(d,id);if(!origin)return false;
 if(to!=='rack'&&(!Number.isInteger(Number(to))||Number(to)<0||Number(to)>=d.groups.length))return false;
 const group=to==='rack'?null:Number(to);
 remember(d);
 if(origin.type==='rack')d.rack.splice(origin.index,1);else d.groups[origin.group].splice(origin.index,1);
 const dest=group===null?d.rack:d.groups[group];
 let at=index??dest.length;
 if(origin.type==='rack'&&group===null&&origin.index<at)at--;
 if(origin.type==='group'&&group===origin.group&&origin.index<at)at--;
 dest.splice(Math.max(0,Math.min(dest.length,at)),0,id);
 d.selected=null;d.message='';return true;
}
function addGroup(d,id=null){
 if(id&&locate(d,id)){
   remember(d);const src=locate(d,id);
   if(src.type==='rack')d.rack.splice(src.index,1);else d.groups[src.group].splice(src.index,1);
   d.groups.push([id]);
 }else{remember(d);d.groups.push([]);}
 d.selected=null;d.message='';return d.groups.length-1;
}
function tile(id,d,canEdit,fromRack=false){const t=tileFromId(id);if(!t)return '';
 const label=t.joker?'조커':`${colorName[t.color]} ${t.value}`;
 const newlyPlayed=d && d.baseHand.includes(id) && !fromRack;
 return `<button type="button" data-rk-tile="${id}" ${canEdit?'draggable="true"':''} aria-label="${label}${newlyPlayed?' (이번 턴에 놓은 타일)':''}" aria-pressed="${d?.selected===id}" class="rk-tile rk-${t.color} ${d?.selected===id?'rk-picked':''} ${newlyPlayed?'rk-fresh':''}" ${canEdit?'':'disabled'} title="${label}${canEdit?' · 눌러서 선택하거나 끌어 이동':''}">
  ${t.joker?'<span class="rk-joker">★</span><span class="rk-tile-foot">JOKER</span>':`<b>${t.value}</b><span class="rk-tile-foot">${t.color==='orange'?'●':'●'}</span>`}</button>`;
}
function board(r,d,canEdit,canEditOld){
 const groups=canEdit?d.groups:r.state.table;
 const visible=groups.filter(g=>g.length);
 let markup='';
 groups.forEach((g,group)=>{
  if(!g.length)return;
  const info=meldInfo(g),valid=info.valid;
  markup+=`<div class="rk-cluster ${valid?'rk-cluster-ok':'rk-cluster-bad'}" data-rk-group="${group}" role="group" aria-label="${group+1}번 조합 ${valid?'완성':'미완성'}">
     <div class="rk-cluster-line">${g.map(id=>tile(id,d,canEdit&&(canEditOld||d.baseHand.includes(id)))).join('')}${canEdit?'<span class="rk-join" aria-hidden="true">＋</span>':''}</div>
     <span class="rk-cluster-label">${valid?`${info.type==='run'?'연속':'같은 숫자'} · ${info.score}점`:`미완성 · ${g.length}장`}</span>
   </div>`;
 });
 const empty=groups.filter(g=>!g.length).map((g,gi)=>`<button type="button" data-rk-group="${groups.indexOf(g)}" class="rk-empty-group" ${canEdit?'':'disabled'}>＋ 빈 조합</button>`).join('');
 const instructions=!visible.length?`<div class="rk-empty-message"><span>🀄</span><strong>아직 테이블에 타일이 없어요</strong><small>아래 타일을 끌어올리거나 <b>추천 조합</b> 버튼을 눌러보세요.</small></div>`:'';
 return `<section class="rk-playfield" data-rk-board><div class="rk-field-head"><span>게임 테이블</span><span>${visible.length}개 조합</span></div>
   <div class="rk-board-groups">${markup}${empty}${instructions}${canEdit?`<button class="rk-newzone" type="button" data-rk-newzone title="선택한 타일을 여기에 놓으세요"><strong>＋</strong><span>새 조합</span></button>`:''}</div>
 </section>`;
}
function status(r,sid){const s=r.state;
 if(r.status==='finished')return s.result||'게임 종료';
 if(s.turn!==sid)return '상대방이 생각하고 있어요. 다음 차례를 기다려 주세요.';
 if(!s.opened[sid])return '먼저 내 타일로 30점 이상의 조합을 만들어야 해요.';
 return '내 차례예요! 조합을 만들거나 테이블을 재배열하세요.';
}
export function renderRummikubGame(r,sid){
 const s=r.state,turn=active({r,sid}),d=turn?draftFor(r):null;
 const hand=turn?d.rack:s.hand;
 const groups=turn?d.groups:s.table;
 const invalid=groups.filter(g=>g.length&&!meldInfo(g).valid).length;
 const inPlay=turn?groups.flat().filter(id=>d.baseHand.includes(id)):[];
 const openingPoints=turn?groups.slice(d.baseTable.length).reduce((sum,g)=>sum+(g.length>=3&&g.every(id=>d.baseHand.includes(id))&&meldInfo(g).valid?meldInfo(g).score:0),0):0;
 const first=!s.opened[sid];
 const validTurn=turn && !invalid && inPlay.length>0 && (!first||openingPoints>=30) &&
   d.baseTable.every((g,i)=>first?JSON.stringify(g)===JSON.stringify(groups[i]):true);
 const players=r.players.map(p=>`<div class="rk-player ${s.turn===p.id?'rk-player-active':''}"><span class="rk-avatar">${p.id==='cat'?'🐱':p.id===sid?'🙂':'🎮'}</span>
   <span class="rk-player-info"><b>${esc(p.nick)}${p.id===sid?' (나)':''}</b><small>${s.opened[p.id]?'등록 완료':'30점 등록 전'}</small></span>
   <span class="rk-player-tiles">${s.counts[p.id]}<small>장</small></span></div>`).join('');
 const controls=turn?`<div class="rk-toolbar">
    <button type="button" class="rk-tool rk-recommend" data-rk-action="recommend"><span>✨</span> 추천 조합</button>
    <button type="button" class="rk-tool" data-rk-action="undo" ${!d.history.length?'disabled':''}>↶ 한 수 취소</button>
    <button type="button" class="rk-tool" data-rk-action="reset">⟲ 전체 복구</button>
  </div>`:'';
 const rackTools=turn?`<div class="rk-sort-buttons"><button type="button" class="rk-sort" data-rk-action="sortColor" title="색깔별로 모으고 숫자 순서로 정렬"><b>789</b><small>연속 정렬</small></button>
  <button type="button" class="rk-sort" data-rk-action="sortNumber" title="같은 숫자를 나란히 정렬"><b>777</b><small>숫자 정렬</small></button></div>`:'';
 const progress=first?`<div class="rk-registration"><div class="rk-progress-caption"><strong>최초 등록 30점</strong><span>${Math.min(30,openingPoints)} / 30</span></div><div class="rk-progress-bg"><i style="width:${Math.min(100,Math.max(0,openingPoints/30*100))}%"></i></div></div>`:'';
 const actionButtons=turn?`<div class="rk-footer-actions"><button class="rk-action rk-draw" type="button" data-rk-action="draw">타일 1장 받기 <span>＋</span></button>
    <button class="rk-action rk-submit" data-rk-action="submit" type="button" ${!validTurn?'disabled':''}>${validTurn?'✓ 턴 완료':'턴 완료'} <span>${inPlay.length?`(${inPlay.length}장)`:'→'}</span></button></div>`:'';
 const msg=invalid?`<p class="rk-warn">${invalid}개 조합이 미완성이에요. 빨간 표시를 확인하고 고쳐 주세요.</p>`:first&&turn&&inPlay.length&&openingPoints<30?`<p class="rk-hint">현재 ${openingPoints}점 · 최초 등록에는 ${30-openingPoints}점이 더 필요해요.</p>`:'';
 return `<section class="rk-root" aria-label="루미큐브 게임" data-rk-root>
   <header class="rk-titlebar"><div><span class="rk-eyebrow">MOYEO GAMES · NUMBER TILES</span><h2>루미큐브 <span aria-hidden="true">✦</span></h2></div><div class="rk-top-right"><span>타일 더미 <b>${s.remaining}</b>장</span>${r.status==='playing'&&s.deadline?`<strong class="rk-clock time-badge" data-deadline="${s.deadline}">${Math.max(0,Math.ceil((s.deadline-Date.now())/1000))}초</strong>`:''}</div></header>
   <div class="rk-playerbar">${players}</div>
   <div class="rk-status ${turn?'rk-status-mine':''}"><span>${turn?'내 차례':'알림'}</span><strong>${esc(status(r,sid))}</strong></div>
   ${board(r,d,turn,!first)}
   ${controls}
   <div class="rk-rack-panel"><div class="rk-rack-title"><div><b>내 타일 <span>${hand.length}장</span></b><small>${turn?'타일을 눌러 선택 → 테이블을 누르거나 끌어서 이동':'내 차례가 되면 움직일 수 있어요'}</small></div>${rackTools}</div>
      ${progress}<div class="rk-wood"><div class="rk-rack" data-rk-rack>${hand.length?hand.map(id=>tile(id,d,turn,true)).join(''):'<span class="rk-no-tiles">모든 타일을 내려놓았어요!</span>'}</div></div>
      ${turn?`<p class="rk-instructions"><b>쉬운 방법</b> ① <em>추천 조합</em> 클릭 → ② 확인 → ③ <em>턴 완료</em>. 직접 하려면 타일을 끌어 게임 테이블에 놓으세요.</p>`:''}
      ${d?.message?`<p class="rk-success">${esc(d.message)}</p>`:''}${msg}${actionButtons}</div>
   <div class="rk-lastmove">${esc(s.lastMove||'')}</div>
   ${r.status==='finished'?`<div class="rk-end"><h3>게임 종료</h3><b>${esc(s.result||'')}</b><div>${Object.entries(s.scores||{}).map(([pid,pts])=>`<span>${esc(r.players.find(p=>p.id===pid)?.nick||pid)} ${pts>0?'+':''}${pts}점</span>`).join('')}</div></div>`:''}
 </section>`;
}
function dropAt(c,id,target,x){
 const d=draftFor(c.r);
 if(!locate(d,id))return false;
 const forbiddenGroup=gi=>!c.r.state.opened[c.sid] && gi<d.baseTable.length;
 const tileTarget=target?.closest?.('[data-rk-tile]');
 if(tileTarget && tileTarget.dataset.rkTile!==id){
   const loc=locate(d,tileTarget.dataset.rkTile);if(!loc || (loc.type==='group'&&forbiddenGroup(loc.group)))return false;
   const bounds=tileTarget.getBoundingClientRect();
   const at=loc.index+(x>bounds.left+bounds.width/2?1:0);
   return move(d,id,loc.type==='rack'?'rack':loc.group,at);
 }
 const group=target?.closest?.('[data-rk-group]');
 if(group){const gi=Number(group.dataset.rkGroup);return forbiddenGroup(gi)?false:move(d,id,gi);}
 if(target?.closest?.('[data-rk-rack]'))return move(d,id,'rack');
 if(target?.closest?.('[data-rk-board]')||target?.closest?.('[data-rk-newzone]')){addGroup(d,id);return true;}
 return false;
}
async function action(name,c){const d=draftFor(c.r),s=c.r.state;
 if(name==='new'){addGroup(d,d.selected);host.refresh();return;}
 if(name==='sortColor'||name==='sortNumber'){remember(d);d.rack.sort(name==='sortColor'?byColor:byNumber);d.message='내 타일을 정렬했어요.';host.refresh();return;}
 if(name==='undo'){const prev=d.history.pop();if(prev){d.rack=prev.rack;d.groups=prev.groups;d.selected=null;d.message='이전 배치로 돌아갔어요.';}host.refresh();return;}
 if(name==='reset'){reset(d);host.refresh();return;}
 if(name==='recommend'){
   const dirty=JSON.stringify(d.rack)!==JSON.stringify(d.baseHand)||JSON.stringify(d.groups)!==JSON.stringify(d.baseTable);
   if(dirty&&!window.confirm('기존에 움직인 타일을 추천 조합으로 바꿀까요? 한 수 취소로 되돌릴 수 있어요.'))return;
   const result=recommendMove(d.baseHand,d.baseTable,Boolean(s.opened[c.sid]));
   if(!result){host.toast(s.opened[c.sid]?'지금 바로 놓을 수 있는 간단한 조합을 찾지 못했어요. 직접 재배열하거나 타일을 받아 보세요.':'현재 내 패에서 30점 이상 완성되는 조합을 찾지 못했어요. 타일을 1장 받아 보세요.');return;}
   remember(d);d.rack=d.baseHand.filter(id=>!result.used.includes(id));d.groups=result.groups;
   d.selected=null;d.message=`추천 조합을 놓았어요! ${result.used.length}장 사용 · 아래의 ‘턴 완료’를 눌러 확정하세요.`;
   host.refresh();return;
 }
 if(name==='draw'){
   const dirty=JSON.stringify(d.rack)!==JSON.stringify(d.baseHand)||JSON.stringify(d.groups.filter(g=>g.length))!==JSON.stringify(d.baseTable);
   if(dirty&&!window.confirm('현재 타일 배치는 취소되고 타일을 1장 받습니다. 계속할까요?'))return;
   const ok=await host.sendAction('rkDraw',{});if(ok)reset(d);return;
 }
 if(name==='submit'){
   const groups=d.groups.filter(g=>g.length);
   if(!groups.length||groups.some(g=>!meldInfo(g).valid)){host.toast('테이블의 빨간 조합을 먼저 완성해 주세요.');return;}
   const used=groups.flat(),before=d.baseTable.flat();
   if(before.some(id=>!used.includes(id))){host.toast('기존 테이블 타일도 모두 유효한 조합에 남아 있어야 해요.');return;}
   if(!d.baseHand.some(id=>used.includes(id))){host.toast('내 패에서 타일을 최소 1장 내려놓아야 해요.');return;}
   if(!s.opened[c.sid]){
     if(!d.baseTable.every((g,i)=>JSON.stringify(groups[i])===JSON.stringify(g))){host.toast('최초 등록에서는 기존 조합을 수정할 수 없어요.');return;}
     const score=groups.slice(d.baseTable.length).reduce((sum,g)=>sum+meldInfo(g).score,0);
     if(score<30){host.toast(`최초 등록에는 ${30-score}점이 더 필요해요.`);return;}
   }
   await host.sendAction('rkSubmit',{groups});return;
 }
}
export function configureRummikubUI(options){if(host)return;host=options;
 document.addEventListener('click',async e=>{
   if(Date.now()<suppressClickUntil&&e.target.closest?.('.rk-root')){e.preventDefault();return;}
   const c=context();if(!active(c)||!e.target.closest?.('.rk-root'))return;
   const d=draftFor(c.r);
   const act=e.target.closest('[data-rk-action]');if(act){await action(act.dataset.rkAction,c);return;}
   const tileTarget=e.target.closest('[data-rk-tile]');
   if(tileTarget){
     const id=tileTarget.dataset.rkTile;
     if(d.selected===id){d.selected=null;host.refresh();return;}
     if(d.selected){const loc=locate(d,id);if(loc&&(loc.type==='rack'||c.r.state.opened[c.sid]||loc.group>=d.baseTable.length)&&move(d,d.selected,loc.type==='rack'?'rack':loc.group,loc.index)){host.refresh();return;}}
     d.selected=id;host.refresh();return;
   }
   const g=e.target.closest('[data-rk-group]');
   if(g){const gi=Number(g.dataset.rkGroup);if(d.selected && (c.r.state.opened[c.sid]||gi>=d.baseTable.length) && move(d,d.selected,gi))host.refresh();return;}
   if(e.target.closest('[data-rk-newzone]')||(d.selected&&e.target.closest('[data-rk-board]'))){addGroup(d,d.selected);host.refresh();return;}
   if(e.target.closest('[data-rk-rack]')&&d.selected){if(move(d,d.selected,'rack'))host.refresh();return;}
 });
 document.addEventListener('dragstart',e=>{
   const c=context(),el=e.target.closest?.('.rk-root [data-rk-tile]');
   if(!active(c)||!el)return;dragged=el.dataset.rkTile;
   e.dataTransfer?.setData('text/plain',dragged);if(e.dataTransfer)e.dataTransfer.effectAllowed='move';
 });
 document.addEventListener('dragover',e=>{
   if(!dragged||!e.target.closest?.('.rk-root'))return;
   e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';
 });
 document.addEventListener('drop',e=>{
   const id=dragged;dragged=null;const c=context();if(!active(c)||!id||!e.target.closest?.('.rk-root'))return;
   e.preventDefault();if(dropAt(c,id,e.target,e.clientX))host.refresh();
 });
 document.addEventListener('dragend',()=>{dragged=null;});
 // Native HTML5 drag/drop is not dependable on mobile. Use pointer events for
 // touch and pen so players can drag directly from the wooden rack to the table.
 document.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'||touchDrag)return;
   const el=e.target.closest?.('.rk-root [data-rk-tile]'),c=context();
   if(!el||!active(c))return;
   touchDrag={id:el.dataset.rkTile,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,dragging:false,ghost:null};
 });
 document.addEventListener('pointermove',e=>{
   const t=touchDrag;if(!t||t.pointer!==e.pointerId)return;
   if(!t.dragging&&Math.hypot(e.clientX-t.startX,e.clientY-t.startY)>9){
     t.dragging=true;const src=document.querySelector(`.rk-root [data-rk-tile="${t.id}"]`);
     if(src){t.ghost=src.cloneNode(true);t.ghost.classList.add('rk-ghost');t.ghost.removeAttribute('data-rk-tile');document.body.appendChild(t.ghost);}
   }
   if(t.dragging){e.preventDefault();if(t.ghost){t.ghost.style.left=`${e.clientX-19}px`;t.ghost.style.top=`${e.clientY-26}px`;}}
 });
 function stopTouch(e,drop){const t=touchDrag;if(!t||t.pointer!==e.pointerId)return;
   touchDrag=null;t.ghost?.remove();
   if(!t.dragging)return;
   suppressClickUntil=Date.now()+450;
   const c=context();if(drop&&active(c)){
     const target=document.elementFromPoint(e.clientX,e.clientY);
     if(dropAt(c,t.id,target,e.clientX))host.refresh();
   }
 }
 document.addEventListener('pointerup',e=>stopTouch(e,true));
 document.addEventListener('pointercancel',e=>stopTouch(e,false));
}
