/** Browser UI for existing Moyeo Games; all CSS and events prefixed rk-. */
import {COLORS, meldInfo, tileFromId} from './engine.mjs';
const drafts=new Map();
let host=null,dragged=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const sortByNumber=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?99:x.value)-(y.joker?99:y.value)||COLORS.indexOf(x.color)-COLORS.indexOf(y.color);};
const sortByColor=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?9:COLORS.indexOf(x.color))-(y.joker?9:COLORS.indexOf(y.color))||x.value-y.value;};
function draftFor(r){
 const s=r.state;const key=`${r.id}:${s.matchId}:${s.turnNumber}:${s.turn}`;
 if(!drafts.has(key)){
   // Avoid reusing a stale draft if the same synthetic room ID is reused for a new match.
   if(drafts.size>40)drafts.clear();
   drafts.set(key,{rack:[...s.hand],groups:s.table.map(g=>[...g]),selected:null,history:[],baseHand:[...s.hand],baseTable:clone(s.table)});
 }
 return drafts.get(key);
}
const current=()=>host?.getContext?.();
const editing=c=>c?.r?.status==='playing'&&c.r.state.turn===c.sid;
function snapshot(d){d.history.push({rack:[...d.rack],groups:clone(d.groups)});if(d.history.length>45)d.history.shift();}
function reset(d){d.rack=[...d.baseHand];d.groups=clone(d.baseTable);d.selected=null;d.history=[];}
function findTile(d,id){const ix=d.rack.indexOf(id);if(ix>=0)return {type:'rack',ix};for(let gi=0;gi<d.groups.length;gi++){const at=d.groups[gi].indexOf(id);if(at>=0)return {type:'group',gi,ix:at};}return null;}
function moveTile(d,id,target,idx){const src=findTile(d,id);if(!src)return false;snapshot(d);
 if(src.type==='rack')d.rack.splice(src.ix,1);else d.groups[src.gi].splice(src.ix,1);
 if(target==='rack')d.rack.splice(Math.max(0,Math.min(d.rack.length,idx??d.rack.length)),0,id);
 else {
  const gi=Number(target);
  if(!Number.isInteger(gi)||gi<0||gi>=d.groups.length){d.history.pop();return false;}
  const dest=d.groups[gi];let pos=idx??dest.length;
  if(src.type==='group'&&src.gi===gi&&src.ix<pos)pos--;
  dest.splice(Math.max(0,Math.min(dest.length,pos)),0,id);
 }
 d.selected=null;return true;
}
function tileHtml(id,d,enabled){const t=tileFromId(id);if(!t)return '';
 const label=t.joker?'조커':`${({red:'빨간',blue:'파란',black:'검정',orange:'주황'})[t.color]} ${t.value}`;
 return `<button type="button" class="rk-tile rk-${t.color} ${d?.selected===id?'rk-selected':''}" data-rk-tile="${id}" draggable="${enabled?'true':'false'}" aria-label="${label}" aria-pressed="${d?.selected===id?'true':'false'}" ${enabled?'':'disabled'}>${t.joker?'<span class="rk-joker-icon">✳</span><small>JOKER</small>':`<strong>${t.value}</strong><small>●</small>`}</button>`;
}
function tableHtml(r,d,enabled){const groups=enabled?d.groups:r.state.table;
 const html=groups.map((g,gi)=>{
   const info=meldInfo(g),bad=g.length>0&&!info.valid;
   return `<div class="rk-meld ${bad?'rk-invalid':''}" data-rk-group="${gi}" role="group" aria-label="${gi+1}번 조합">
      <div class="rk-meld-head">${gi+1}번 조합 <span>${g.length?info.valid?`${info.type==='run'?'연속':'묶음'} · ${info.score}점`:'조합 미완성':'여기로 타일 놓기'}</span></div>
      <div class="rk-tiles">${g.length?g.map(id=>tileHtml(id,d,enabled)).join(''):`<div class="rk-empty-slot">${enabled?'선택한 타일을 놓으세요':'빈 조합'}</div>`}</div></div>`;
 }).join('');
 return html||'<div class="rk-board-empty">테이블이 비어 있어요. 내 패로 조합을 만들어보세요!</div>';
}
function progressText(r,sid){const s=r.state;if(r.status==='finished')return s.result||'게임 종료';
 if(s.turn===sid)return s.opened[sid]?'내 차례 · 타일을 내려놓거나 테이블을 재배열하세요.':'내 차례 · 내 패로 30점 이상 등록해야 합니다.';
 return '상대 플레이어의 차례입니다.';
}
export function renderRummikubGame(r,sid){
 const s=r.state,active=editing({r,sid}),d=active?draftFor(r):null;
 const hand=active?d.rack:s.hand;
 const newIds=active?d.groups.flat().filter(id=>d.baseHand.includes(id)):[];
 const currentGroups=active?d.groups:s.table;
 const bad=currentGroups.filter(g=>g.length&&(!meldInfo(g).valid||g.length<3)).length;
 const opened=Boolean(s.opened[sid]);
 const scoreNew=currentGroups.reduce((n,g)=>n+(g.length>=3&&meldInfo(g).valid&&g.every(id=>d?.baseHand.includes(id))?meldInfo(g).score:0),0);
 const players=r.players.map(p=>{
   const id=p.id,n=p.nick;return `<div class="rk-person ${s.turn===id?'rk-person-turn':''}"><span class="rk-person-icon">${id==='cat'?'🐱':id===sid?'🙂':'🎮'}</span><div><b>${esc(n)}</b><small>${s.opened[id]?'30점 등록 완료':'최초 등록 전'}</small></div><span class="rk-person-count">${s.counts[id]}장</span></div>`;
 }).join('');
 const controls=active?`<div class="rk-controlbar">
    <button type="button" class="rk-ctl rk-main" data-rk-action="new">＋ 새 조합</button>
    <button type="button" class="rk-ctl" data-rk-action="undo">↶ 되돌리기</button>
    <button type="button" class="rk-ctl" data-rk-action="reset">처음 상태</button>
   </div>`:'';
 const rackControls=active?`<div class="rk-rack-tools"><button type="button" class="rk-ctl" data-rk-action="sortNumber">숫자순</button><button type="button" class="rk-ctl" data-rk-action="sortColor">색상순</button></div>`:'';
 const actions=active?`<div class="rk-actions"><button class="rk-ctl rk-submit" type="button" data-rk-action="submit" ${bad||!newIds.length?'disabled':''}>✓ 이대로 턴 완료 (${newIds.length}장)</button><button class="rk-ctl rk-draw" type="button" data-rk-action="draw">＋ 타일 1장 받기 · 턴 종료</button></div>`:'';
 const time=s.deadline?`<span class="time-badge" data-deadline="${s.deadline}">${Math.max(0,Math.ceil((s.deadline-Date.now())/1000))}초</span>`:'';
 return `<section class="rk-root" aria-label="루미큐브 게임">
   <header class="rk-top"><div><span class="rk-kicker">MOYEO TILE CLUB</span><h2>루미큐브 <span class="rk-spark">✳</span></h2><p>${esc(progressText(r,sid))}</p></div><div class="rk-top-stats"><span class="rk-stat">남은 타일 <b>${s.remaining}</b>장</span>${r.status==='playing'?time:''}</div></header>
   <div class="rk-players">${players}</div>
   <div class="rk-table-label"><b>게임 테이블</b><small>모든 타일은 유효한 묶음 또는 연속 숫자여야 해요</small></div>
   <div class="rk-board" id="rkBoard">${tableHtml(r,d,active)}
       ${active?`<button class="rk-new-meld" data-rk-action="new" type="button">＋ 여기에 새 조합 만들기</button>`:''}
   </div>
   ${controls}
   <div class="rk-rack-header"><div><b>내 타일 <span>${hand.length}장</span></b><small>${opened?'등록 완료 · 테이블 자유 재배열 가능':`최초 등록 ${Math.min(scoreNew,30)}/30점 · 이전 테이블 이동 불가`}</small></div>${rackControls}</div>
   <div class="rk-rack" data-rk-rack="1" aria-label="내 타일 받침대">${hand.map(id=>tileHtml(id,d,active)).join('')||'<p class="rk-no-tiles">내 타일을 모두 내려놓았습니다.</p>'}</div>
   ${active?'<p class="rk-help">타일을 눌러 선택한 뒤 조합이나 다른 타일을 누르세요. PC에서는 드래그도 가능합니다. 제출 전에 조합 오류를 확인할 수 있어요.</p>':''}
   ${actions}
   ${bad?`<p class="rk-warning">${bad}개 조합이 완성되지 않았습니다. 턴 완료 전에 수정하세요.</p>`:''}
   <div class="rk-last">${esc(s.lastMove||'')}</div>
   ${r.status==='finished'?`<div class="rk-finished"><h3>게임 종료!</h3><strong>${esc(s.result||'')}</strong><div class="rk-results">${Object.entries(s.scores||{}).map(([pid,pts])=>`<span>${esc(r.players.find(p=>p.id===pid)?.nick||pid)}: ${pts>0?'+':''}${pts}점</span>`).join('')}</div></div>`:''}
   </section>`;
}
function placeSelected(c,idx,at){const d=draftFor(c.r);if(!d.selected)return;const id=d.selected;
 moveTile(d,id,idx,at);host.refresh();}
async function handleAction(action,c){const d=draftFor(c.r);const s=c.r.state;
 if(action==='new'){snapshot(d);d.groups.push([]);if(d.selected){const id=d.selected;d.history.pop();moveTile(d,id,d.groups.length-1);}host.refresh();return;}
 if(action==='sortNumber'||action==='sortColor'){snapshot(d);d.rack.sort(action==='sortNumber'?sortByNumber:sortByColor);host.refresh();return;}
 if(action==='undo'){const step=d.history.pop();if(step){d.rack=step.rack;d.groups=step.groups;d.selected=null;host.refresh();}return;}
 if(action==='reset'){reset(d);host.refresh();return;}
 if(action==='draw'){
   if(d.groups.some((g,i)=>JSON.stringify(g)!==JSON.stringify(d.baseTable[i]||[]))) {
     if(!window.confirm('지금까지 이동한 타일은 모두 취소됩니다. 타일 1장을 받을까요?'))return;
   }
   const ok=await host.sendAction('rkDraw',{});
   if(ok)reset(d);return;
 }
 if(action==='submit'){
   const groups=d.groups.filter(g=>g.length);
   if(!groups.length||groups.some(g=>!meldInfo(g).valid)){host.toast('유효하지 않은 타일 조합이 남아 있습니다.');return;}
   const used=groups.flat(); const before=d.baseTable.flat();
   if(before.some(id=>!used.includes(id))){host.toast('테이블의 기존 타일은 모두 사용해야 합니다.');return;}
   if(!d.baseHand.some(id=>used.includes(id))){host.toast('내 패에서 1개 이상 내야 합니다.');return;}
   if(!s.opened[c.sid]) {
     const prev=d.baseTable;
     if(!prev.every((g,i)=>JSON.stringify(groups[i])===JSON.stringify(g))){host.toast('최초 등록은 기존 테이블을 조작할 수 없습니다.');return;}
     const fresh=groups.slice(prev.length);
     const score=fresh.reduce((n,g)=>n+meldInfo(g).score,0);
     if(score<30){host.toast(`최초 등록에 ${30-score}점이 더 필요합니다.`);return;}
   }
   await host.sendAction('rkSubmit',{groups});return;
 }
}
export function configureRummikubUI(options){if(host)return;host=options;
 document.addEventListener('click',async e=>{
   const c=current();if(!c||!e.target.closest('.rk-root')||!editing(c))return;
   const d=draftFor(c.r),tile=e.target.closest('[data-rk-tile]');
   if(tile){const id=tile.dataset.rkTile;if(d.selected===id){d.selected=null;host.refresh();return;}
     if(d.selected){const src=findTile(d,id);if(src){moveTile(d,d.selected,src.type==='rack'?'rack':String(src.gi),src.ix);host.refresh();return;}}
     d.selected=id;host.refresh();return;
   }
   const action=e.target.closest('[data-rk-action]');if(action){await handleAction(action.dataset.rkAction,c);return;}
   const g=e.target.closest('[data-rk-group]');if(g){placeSelected(c,Number(g.dataset.rkGroup));return;}
   if(e.target.closest('[data-rk-rack]'))placeSelected(c,'rack');
 });
 document.addEventListener('dragstart',e=>{const c=current(),tile=e.target.closest?.('[data-rk-tile]');if(!editing(c)||!tile)return;dragged=tile.dataset.rkTile;e.dataTransfer?.setData('text/plain',dragged);e.dataTransfer.effectAllowed='move';});
 document.addEventListener('dragover',e=>{if(dragged&&e.target.closest?.('.rk-root'))e.preventDefault();});
 document.addEventListener('drop',e=>{const c=current();if(!dragged||!editing(c))return;
   const target=e.target.closest?.('[data-rk-tile],[data-rk-group],[data-rk-rack]');if(!target)return;
   e.preventDefault();const d=draftFor(c.r),id=dragged;dragged=null;
   if(target.hasAttribute('data-rk-tile')){const loc=findTile(d,target.dataset.rkTile);if(!loc)return;moveTile(d,id,loc.type==='rack'?'rack':String(loc.gi),loc.ix);}
   else if(target.hasAttribute('data-rk-group'))moveTile(d,id,target.dataset.rkGroup);
   else moveTile(d,id,'rack');host.refresh();
 });
 document.addEventListener('dragend',()=>{dragged=null;});
}
