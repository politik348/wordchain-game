/** MOYEO Rummikub v3 controls. Independent of the other Moyeo games. */
import {meldInfo,tileFromId} from './engine.mjs';
import {recommendMove} from './suggest.mjs';
import {draftFor,visibleHand,locate,canMove,moveTiles,bundleFor,setSort,snapshot,restore,reset,changedTable} from './draft.mjs';
let host=null,pointer=null,suppressClickUntil=0,hovered=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const colorName={red:'빨강',blue:'파랑',black:'검정',orange:'주황',joker:'조커'};
const context=()=>host?.getContext?.();
const active=c=>c?.r?.status==='playing'&&c.r.state.turn===c.sid;
function tile(id,d,canEdit,fromRack=false){const t=tileFromId(id);if(!t)return '';
 const label=t.joker?'조커':`${colorName[t.color]} ${t.value}`;
 const newlyPlayed=d && d.baseHand.includes(id) && !fromRack;
 const selected=d?.selectedIds?.includes(id);
 return `<button type="button" data-rk-tile="${id}" aria-label="${label}${newlyPlayed?' (이번 턴에 놓은 타일)':''}" aria-pressed="${Boolean(selected)}" class="rk-tile rk-${t.color} ${selected?'rk-picked':''} ${newlyPlayed?'rk-fresh':''}" ${canEdit?'':'disabled'} title="${label}${canEdit?' · 짧게 누르면 한 장, 길게 누르면 조합 전체 선택':''}">
  ${t.joker?'<span class="rk-joker">★</span><span class="rk-tile-foot">JOKER</span>':`<b>${t.value}</b><span class="rk-tile-foot">●</span>`}</button>`;
}
function board(r,d,canEdit,canEditOld){
 const groups=canEdit?d.groups:r.state.table;
 let markup='',visible=0;
 groups.forEach((g,group)=>{
  if(!g.length)return;visible++;
  const info=meldInfo(g),valid=info.valid,selected=Boolean(d?.selectedIds?.length)&&g.every(id=>d.selectedIds.includes(id));
  markup+=`<div class="rk-cluster ${valid?'rk-cluster-ok':'rk-cluster-bad'} ${selected?'rk-bundle-picked':''}" data-rk-group="${group}" role="group" aria-label="${group+1}번 조합 ${valid?'완성':'미완성'}">
     <div class="rk-cluster-line">${g.map(id=>tile(id,d,canEdit&&(canEditOld||d.baseHand.includes(id)))).join('')}${canEdit?'<span class="rk-join" aria-hidden="true">＋</span>':''}</div>
     <span class="rk-cluster-label">${valid?`${info.type==='run'?'연속':'같은 숫자'} · ${info.score}점`:`미완성 · ${g.length}장`}</span>
   </div>`;
 });
 const empty=groups.map((g,i)=>g.length?'':`<button type="button" data-rk-group="${i}" class="rk-empty-group" ${canEdit?'':'disabled'}>＋ 빈 조합</button>`).join('');
 const instructions=!visible?`<div class="rk-empty-message"><span>🀄</span><strong>아직 테이블에 타일이 없어요</strong><small>받침대 타일을 <b>길게 누르면 조합을 묶어</b> 올릴 수 있어요.<br>또는 <b>추천 조합</b>을 눌러보세요.</small></div>`:'';
 return `<section class="rk-playfield" data-rk-board><div class="rk-field-head"><span>게임 테이블</span><span>${visible}개 조합</span></div>
   <div class="rk-board-groups">${markup}${empty}${instructions}${canEdit?`<button class="rk-newzone" type="button" data-rk-newzone title="선택한 타일이나 조합을 여기로 옮기세요"><strong>＋</strong><span>새 조합</span></button>`:''}</div>
 </section>`;
}
function status(r,sid){const s=r.state;
 if(r.status==='finished')return s.result||'게임 종료';
 if(s.turn!==sid)return '상대방이 생각하고 있어요. 다음 차례를 기다려 주세요.';
 if(!s.opened[sid])return '먼저 내 타일로 30점 이상의 조합을 만들어야 해요.';
 return '내 차례예요! 조합을 만들거나 테이블을 재배열하세요.';
}
function selectionToolbar(d,sid,r){
 const ids=d.selectedIds;if(!ids?.length)return '';
 const loc=locate(d,ids[0]);const first=ids.length===1;
 const movable=canMove(d,ids,Boolean(r.state.opened[sid]));
 const text=first?`${colorName[tileFromId(ids[0])?.color]} ${tileFromId(ids[0])?.value||'조커'}`:`조합 전체 ${ids.length}장`;
 const sameLocation=first&&loc?.type==='group';
 return `<div class="rk-selection-tools" aria-label="선택한 타일 조작">
  <span class="rk-select-caption">선택: <b>${esc(text)}</b></span>
  ${sameLocation?`<button type="button" data-rk-action="shiftLeft" ${loc.index===0||!movable?'disabled':''} aria-label="타일을 왼쪽으로 한 칸">← 왼쪽</button><button type="button" data-rk-action="shiftRight" ${loc.index===d.groups[loc.group].length-1||!movable?'disabled':''} aria-label="타일을 오른쪽으로 한 칸">오른쪽 →</button>`:''}
  <button type="button" data-rk-action="toNew" ${!movable?'disabled':''}>＋ 새 조합</button>
  <button type="button" data-rk-action="toRack" ${!movable||ids.every(id=>locate(d,id)?.type==='rack')?'disabled':''}>받침대로</button>
  <button type="button" data-rk-action="clearSelection">선택 해제</button>
 </div>`;
}
export function renderRummikubGame(r,sid){
 const s=r.state,turn=active({r,sid}),d=turn?draftFor(r,sid):null;
 const hand=turn?d.rack:visibleHand(r,sid),groups=turn?d.groups:s.table;
 const invalid=groups.filter(g=>g.length&&!meldInfo(g).valid).length;
 const inPlay=turn?groups.flat().filter(id=>d.baseHand.includes(id)):[];
 const openingPoints=turn?groups.slice(d.baseTable.length).reduce((sum,g)=>sum+(g.length>=3&&g.every(id=>d.baseHand.includes(id))&&meldInfo(g).valid?meldInfo(g).score:0),0):0;
 const first=!s.opened[sid];
 const allTableIds=groups.flat();
 const validTurn=turn&&!invalid&&inPlay.length>0&&new Set(allTableIds).size===allTableIds.length&&d.baseTable.flat().every(id=>allTableIds.includes(id))&&(!first||openingPoints>=30)&&d.baseTable.every((g,i)=>first?JSON.stringify(g)===JSON.stringify(groups[i]):true);
 const players=r.players.map(p=>`<div class="rk-player ${s.turn===p.id?'rk-player-active':''}"><span class="rk-avatar">${p.id==='cat'?'🐱':p.id===sid?'🙂':'🎮'}</span>
   <span class="rk-player-info"><b>${esc(p.nick)}${p.id===sid?' (나)':''}</b><small>${s.opened[p.id]?'등록 완료':'30점 등록 전'}</small></span>
   <span class="rk-player-tiles">${s.counts[p.id]}<small>장</small></span></div>`).join('');
 const controls=turn?`<div class="rk-toolbar">
    <button type="button" class="rk-tool rk-recommend" data-rk-action="recommend"><span>✨</span> 추천 조합</button>
    <button type="button" class="rk-tool" data-rk-action="undo" ${!d.history.length?'disabled':''}>↶ 한 수 취소</button>
    <button type="button" class="rk-tool" data-rk-action="reset">⟲ 탁자 배치 복구</button>
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
   ${turn?selectionToolbar(d,sid,r):''}
   ${controls}
   <div class="rk-rack-panel"><div class="rk-rack-title"><div><b>내 타일 <span>${hand.length}장</span></b><small>${turn?'짧게 누르면 1장 · 길게 누르면 조합 전체 선택':'정렬 순서는 다음 차례에도 유지됩니다'}</small></div>${rackTools}</div>
      ${progress}<div class="rk-wood"><div class="rk-rack" data-rk-rack>${hand.length?hand.map(id=>tile(id,d,turn,true)).join(''):'<span class="rk-no-tiles">모든 타일을 내려놓았어요!</span>'}</div></div>
      ${turn?`<p class="rk-instructions"><b>쉬운 방법</b> ① 타일을 길게 눌러 조합 선택 → ② 테이블로 끌기 → ③ 턴 완료. <b>순서 수정</b>은 타일을 눌러 ← → 버튼으로 조정하세요. 정렬은 타일 받기 후에도 유지됩니다.</p>`:''}
      ${d?.message?`<p class="rk-success">${esc(d.message)}</p>`:''}${msg}${actionButtons}</div>
   <div class="rk-lastmove">${esc(s.lastMove||'')}</div>
   ${r.status==='finished'?`<div class="rk-end"><h3>게임 종료</h3><b>${esc(s.result||'')}</b><div>${Object.entries(s.scores||{}).map(([pid,pts])=>`<span>${esc(r.players.find(p=>p.id===pid)?.nick||pid)} ${pts>0?'+':''}${pts}점</span>`).join('')}</div></div>`:''}
 </section>`;
}
function insertAt(target,coordinate){
 const parent=target?.closest?.('[data-rk-rack],.rk-cluster-line');if(!parent)return null;
 const tiles=[...parent.querySelectorAll(':scope > [data-rk-tile]')];
 let index=tiles.length;
 for(let i=0;i<tiles.length;i++){
  const rect=tiles[i].getBoundingClientRect();
  if(coordinate.y<rect.top+rect.height/2-rect.height/3||coordinate.y<=rect.bottom&&coordinate.x<rect.left+rect.width/2){index=i;break;}
 }
 return index;
}
function dropAt(c,ids,target,x,y){
 const d=draftFor(c.r,c.sid),opened=Boolean(c.r.state.opened[c.sid]);
 if(!canMove(d,ids,opened))return false;
 const node=target?.closest?.('[data-rk-tile]');
 if(node){
  const loc=locate(d,node.dataset.rkTile);if(!loc)return false;
  if(loc.type==='group'&&!opened&&loc.group<d.baseTable.length)return false;
  const rect=node.getBoundingClientRect();
  return moveTiles(d,ids,loc.type==='rack'?'rack':loc.group,loc.index+(x>=rect.left+rect.width/2?1:0),opened);
 }
 const group=target?.closest?.('[data-rk-group]');
 if(group){const gi=Number(group.dataset.rkGroup);if(!opened&&gi<d.baseTable.length)return false;
  const at=insertAt(group,{x,y});return moveTiles(d,ids,gi,at,opened);
 }
 if(target?.closest?.('[data-rk-rack]'))return moveTiles(d,ids,'rack',insertAt(target,{x,y}),opened);
 if(target?.closest?.('[data-rk-board]')||target?.closest?.('[data-rk-newzone]'))return moveTiles(d,ids,'new',undefined,opened);
 return false;
}
async function action(name,c){const d=draftFor(c.r,c.sid),s=c.r.state,opened=Boolean(s.opened[c.sid]);
 if(name==='sortColor'||name==='sortNumber'){setSort(d,name==='sortColor'?'color':'number');host.refresh();return;}
 if(name==='undo'){if(restore(d))host.refresh();return;}
 if(name==='reset'){reset(d);host.refresh();return;}
 if(name==='clearSelection'){d.selectedIds=[];host.refresh();return;}
 if(['shiftLeft','shiftRight','toNew','toRack'].includes(name)){
  const ids=d.selectedIds;if(!ids.length||!canMove(d,ids,opened))return;
  let success=false;
  if(name==='toNew')success=moveTiles(d,ids,'new',undefined,opened);
  else if(name==='toRack')success=moveTiles(d,ids,'rack',undefined,opened);
  else if(ids.length===1){const p=locate(d,ids[0]);if(p){const to=p.type==='rack'?'rack':p.group;
   success=moveTiles(d,ids,to,name==='shiftLeft'?p.index-1:p.index+2,opened);
  }}
  if(success)host.refresh();return;
 }
 if(name==='recommend'){
   if(changedTable(d)&&!window.confirm('탁자에 아직 확정하지 않은 배치가 있어요. 추천 조합으로 바꿀까요? (받침대 정렬은 유지됩니다)'))return;
   const result=recommendMove(d.baseHand,d.baseTable,opened);
   if(!result){host.toast(opened?'지금 바로 놓을 수 있는 간단한 조합을 찾지 못했어요. 직접 재배열하거나 타일을 받아 보세요.':'현재 내 패에서 30점 이상 완성되는 조합을 찾지 못했어요. 타일을 1장 받아 보세요.');return;}
   snapshot(d);d.rack=d.rack.filter(id=>!result.used.includes(id));d.groups=result.groups;
   d.selectedIds=[];d.message=`추천 조합을 놓았어요! ${result.used.length}장 사용 · 아래의 ‘턴 완료’를 눌러 확정하세요.`;
   host.refresh();return;
 }
 if(name==='draw'){
   if(changedTable(d)&&!window.confirm('탁자에 아직 확정하지 않은 배치가 있어요. 그 배치만 취소하고 타일을 1장 받을까요? (받침대 정렬은 유지됩니다)'))return;
   // Do NOT reset the rack: on the next turn, draftFor reconstructs it from saved layout.
   await host.sendAction('rkDraw',{});return;
 }
 if(name==='submit'){
   const groups=d.groups.filter(g=>g.length);
   if(!groups.length||groups.some(g=>!meldInfo(g).valid)){host.toast('테이블의 빨간 조합을 먼저 완성해 주세요.');return;}
   const used=groups.flat(),before=d.baseTable.flat();
   if(before.some(id=>!used.includes(id))){host.toast('기존 테이블 타일도 모두 유효한 조합에 남아 있어야 해요.');return;}
   if(!d.baseHand.some(id=>used.includes(id))){host.toast('내 패에서 타일을 최소 1장 내려놓아야 해요.');return;}
   if(!opened){
     if(!d.baseTable.every((g,i)=>JSON.stringify(groups[i])===JSON.stringify(g))){host.toast('최초 등록에서는 기존 조합을 수정할 수 없어요.');return;}
     const score=groups.slice(d.baseTable.length).reduce((sum,g)=>sum+meldInfo(g).score,0);
     if(score<30){host.toast(`최초 등록에는 ${30-score}점이 더 필요해요.`);return;}
   }
   await host.sendAction('rkSubmit',{groups});return;
 }
}
function hover(target){
 const h=target?.closest?.('[data-rk-group],[data-rk-rack],[data-rk-newzone],[data-rk-board]');
 if(hovered===h)return;hovered?.classList.remove('rk-drop-over');hovered=h;hovered?.classList.add('rk-drop-over');
}
function cleanupPointer(){
 if(!pointer)return;clearTimeout(pointer.timer);pointer.ghost?.remove();pointer=null;hover(null);
}
function makeGhost(ids){const e=document.createElement('div');e.className='rk-drag-preview';e.textContent=ids.length>1?`타일 ${ids.length}장 함께 이동`:'타일 이동';document.body.appendChild(e);return e;}
export function configureRummikubUI(options){if(host)return;host=options;
 document.addEventListener('click',async e=>{
   if(Date.now()<suppressClickUntil&&e.target.closest?.('.rk-root')){e.preventDefault();return;}
   const c=context();if(!active(c)||!e.target.closest?.('.rk-root'))return;
   const d=draftFor(c.r,c.sid),opened=Boolean(c.r.state.opened[c.sid]);
   const act=e.target.closest('[data-rk-action]');if(act){await action(act.dataset.rkAction,c);return;}
   const node=e.target.closest('[data-rk-tile]');
   if(node){const id=node.dataset.rkTile,loc=locate(d,id);
    if(!loc)return;
    if(d.selectedIds.length&&canMove(d,d.selectedIds,opened)&&!d.selectedIds.includes(id)){
      if(loc.type==='group'&&!opened&&loc.group<d.baseTable.length)return;
      const rect=node.getBoundingClientRect(),at=loc.index+(e.clientX>=rect.left+rect.width/2?1:0);
      if(moveTiles(d,d.selectedIds,loc.type==='rack'?'rack':loc.group,at,opened)){host.refresh();return;}
    }
    if(!canMove(d,[id],opened))return;
    d.selectedIds=d.selectedIds.length===1&&d.selectedIds[0]===id?[]:[id];host.refresh();return;
   }
   const group=e.target.closest('[data-rk-group]');
   if(group&&d.selectedIds.length){const gi=Number(group.dataset.rkGroup);
    if((opened||gi>=d.baseTable.length)&&moveTiles(d,d.selectedIds,gi,undefined,opened))host.refresh();return;
   }
   if((e.target.closest('[data-rk-newzone]')||e.target.closest('[data-rk-board]'))&&d.selectedIds.length){
    if(moveTiles(d,d.selectedIds,'new',undefined,opened))host.refresh();return;
   }
   if(e.target.closest('[data-rk-rack]')&&d.selectedIds.length){if(moveTiles(d,d.selectedIds,'rack',undefined,opened))host.refresh();return;}
 });
 // Single pointer system for mouse / pen / touch: a short drag moves one tile,
 // a 380ms hold groups the whole visible meld, and a hold-then-drag moves it.
 document.addEventListener('pointerdown',e=>{
   if(pointer||e.button!==0)return;
   const el=e.target.closest?.('.rk-root [data-rk-tile]'),c=context();
   if(!el||!active(c)||el.disabled)return;
   const d=draftFor(c.r,c.sid),id=el.dataset.rkTile,opened=Boolean(c.r.state.opened[c.sid]);
   if(!canMove(d,[id],opened))return;
   const ids=d.selectedIds.includes(id)?[...d.selectedIds]:[id];
   pointer={pointer:e.pointerId,id,ids,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,dragging:false,held:false,ghost:null,timer:null};
   pointer.timer=setTimeout(()=>{
     if(!pointer||pointer.pointer!==e.pointerId||pointer.dragging)return;
     const selection=bundleFor(d,id,opened);if(!selection.length)return;
     pointer.ids=selection;pointer.held=true;
     d.selectedIds=[...selection];
     document.querySelectorAll('.rk-root [data-rk-tile]').forEach(n=>n.classList.toggle('rk-held',selection.includes(n.dataset.rkTile)));
   },380);
 });
 document.addEventListener('pointermove',e=>{
   const t=pointer;if(!t||t.pointer!==e.pointerId)return;
   t.x=e.clientX;t.y=e.clientY;
   const distance=Math.hypot(e.clientX-t.startX,e.clientY-t.startY);
   if(distance>9&&!t.dragging){t.dragging=true;clearTimeout(t.timer);t.ghost=makeGhost(t.ids);}
   if(t.dragging){e.preventDefault();t.ghost.style.left=`${e.clientX+11}px`;t.ghost.style.top=`${e.clientY+11}px`;
     hover(document.elementFromPoint(e.clientX,e.clientY));
   }
 },{passive:false});
 function stop(e,drop){const t=pointer;if(!t||t.pointer!==e.pointerId)return;
   const c=context(),held=t.held,dragged=t.dragging,ids=[...t.ids];
   cleanupPointer();
   if(dragged||held)suppressClickUntil=Date.now()+150;
   if(!drop||!active(c))return;
   if(dragged){const target=document.elementFromPoint(e.clientX,e.clientY);
     if(dropAt(c,ids,target,e.clientX,e.clientY))host.refresh();
     else if(held){const d=draftFor(c.r,c.sid);d.selectedIds=ids;host.refresh();}
   }else if(held){host.refresh();}
 }
 document.addEventListener('pointerup',e=>stop(e,true));
 document.addEventListener('pointercancel',e=>stop(e,false));
 document.addEventListener('contextmenu',e=>{if(e.target.closest?.('.rk-root [data-rk-tile]'))e.preventDefault();});
}