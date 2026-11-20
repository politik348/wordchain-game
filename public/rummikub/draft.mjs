/** Local, per-player Rummikub rack layout and uncommitted board state.
 * Server remains authoritative about tiles and turns; layouts are presentation only.
 */
import {COLORS, meldInfo, tileFromId} from './engine.mjs';
const drafts=new Map(),layouts=new Map();
const clone=v=>JSON.parse(JSON.stringify(v));
export const byNumber=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?99:x.value)-(y.joker?99:y.value)||COLORS.indexOf(x.color)-COLORS.indexOf(y.color);};
export const byColor=(a,b)=>{const x=tileFromId(a),y=tileFromId(b);return (x.joker?9:COLORS.indexOf(x.color))-(y.joker?9:COLORS.indexOf(y.color))||x.value-y.value;};
const ownerKey=(r,sid)=>`${r.id}:${r.state.matchId}:${sid}`;
const storageKey=owner=>`moyeo-rummikub-layout-v3:${owner}`;
function getLayout(owner){
 if(layouts.has(owner))return layouts.get(owner);
 try {
  if(typeof sessionStorage==='undefined')return null;
  const data=JSON.parse(sessionStorage.getItem(storageKey(owner))||'null');
  if(!data||!['manual','color','number'].includes(data.mode)||!Array.isArray(data.order)||data.order.length>106||!data.order.every(x=>typeof x==='string'))return null;
  layouts.set(owner,data);return data;
 } catch{return null;}
}
function saveLayout(owner,value){
 if(value)layouts.set(owner,value);else layouts.delete(owner);
 try{if(typeof sessionStorage!=='undefined'){
  if(value)sessionStorage.setItem(storageKey(owner),JSON.stringify(value));
  else sessionStorage.removeItem(storageKey(owner));
 }}catch{/* storage may be disabled: the in-memory fallback still works */}
}
const turnKey=(r,sid)=>`${ownerKey(r,sid)}:${r.state.turnNumber}:${r.state.turn}`;
function trimMaps(){if(drafts.size>65)for(const key of [...drafts.keys()].slice(0,20))drafts.delete(key);if(layouts.size>65)for(const key of [...layouts.keys()].slice(0,20))layouts.delete(key);}
function layout(hand,record){
 if(!record)return [...hand];
 if(record.mode==='color')return [...hand].sort(byColor);
 if(record.mode==='number')return [...hand].sort(byNumber);
 const have=new Set(hand),ordered=record.order.filter(id=>have.has(id));
 const known=new Set(ordered);
 return [...ordered,...hand.filter(id=>!known.has(id))];
}
export function visibleHand(r,sid){return layout(r.state.hand,getLayout(ownerKey(r,sid)));}
export function draftFor(r,sid){
 const k=turnKey(r,sid);
 if(!drafts.has(k)){
  trimMaps();
  const s=r.state;
  drafts.set(k,{owner:ownerKey(r,sid),rack:visibleHand(r,sid),groups:clone(s.table),baseHand:[...s.hand],baseTable:clone(s.table),selectedIds:[],history:[],message:''});
 }
 return drafts.get(k);
}
function persist(d,mode=null){
 const prior=getLayout(d.owner);
 const effective=mode||prior?.mode||'manual';
 // Retain the relative positions of tiles temporarily placed on the table.
 const previous=prior?.order||d.baseHand;
 const current=[...d.rack];const inCurrent=new Set(current);
 const merged=[...current,...previous.filter(id=>d.baseHand.includes(id)&&!inCurrent.has(id))];
 saveLayout(d.owner,{mode:effective,order:merged});
}
export function setSort(d,mode){
 if(!['color','number'].includes(mode))return false;
 snapshot(d);d.rack.sort(mode==='color'?byColor:byNumber);d.selectedIds=[];
 persist(d,mode);d.message=mode==='color'?'789 순서로 정렬했어요. 타일을 받아도 정렬이 유지됩니다.':'777 순서로 정렬했어요. 타일을 받아도 정렬이 유지됩니다.';
 return true;
}
export function snapshot(d){d.history.push({rack:[...d.rack],groups:clone(d.groups),layout:getLayout(d.owner)?clone(getLayout(d.owner)):null});if(d.history.length>60)d.history.shift();}
export function restore(d){
 const p=d.history.pop();if(!p)return false;
 d.rack=p.rack;d.groups=p.groups;d.selectedIds=[];d.message='이전 배치로 돌아갔어요.';
 saveLayout(d.owner,p.layout);return true;
}
export function reset(d){
 d.groups=clone(d.baseTable);const record=getLayout(d.owner);
 d.rack=layout(d.baseHand,record);d.selectedIds=[];d.history=[];
 d.message='탁자에 아직 확정하지 않은 배치만 복구했어요. 받침대 정렬은 유지됩니다.';
}
export function changedTable(d){return JSON.stringify(d.groups.filter(g=>g.length))!==JSON.stringify(d.baseTable);}
export function locate(d,id){const i=d.rack.indexOf(id);if(i>=0)return {type:'rack',index:i};for(let group=0;group<d.groups.length;group++){const index=d.groups[group].indexOf(id);if(index>=0)return {type:'group',group,index};}return null;}
export function canMove(d,ids,opened){
 if(!ids?.length||new Set(ids).size!==ids.length)return false;
 return ids.every(id=>{const loc=locate(d,id);return loc&&(loc.type==='rack'||opened||loc.group>=d.baseTable.length);});
}
/** index is an insertion boundary in the PRE-move destination. */
export function moveTiles(d,ids,to,index,opened=true){
 if(!canMove(d,ids,opened))return false;
 const isNew=to==='new';const isRack=to==='rack';
 if(!isNew&&!isRack&&(!Number.isInteger(to)||to<0||to>=d.groups.length))return false;
 if(isNew&&d.groups.length>=40)return false;
 const from=ids.map(id=>locate(d,id)),removed=new Set(ids);
 const destination=isRack?d.rack:isNew?null:d.groups[to];
 let at=Number.isInteger(index)?index:destination?.length??0;
 if(destination){
  const indices=from.filter(p=>isRack?p.type==='rack':p.type==='group'&&p.group===to).map(p=>p.index);
  at-=indices.filter(i=>i<at).length;
 }
 const prevRack=[...d.rack],prevGroups=clone(d.groups);
 d.rack=d.rack.filter(id=>!removed.has(id));
 d.groups=d.groups.map(g=>g.filter(id=>!removed.has(id)));
 if(isNew)d.groups.push([...ids]);
 else {
  const dest=isRack?d.rack:d.groups[to];
  dest.splice(Math.max(0,Math.min(at,dest.length)),0,...ids);
 }
 if(JSON.stringify(prevRack)===JSON.stringify(d.rack)&&JSON.stringify(prevGroups)===JSON.stringify(d.groups))return false;
 d.history.push({rack:prevRack,groups:prevGroups,layout:getLayout(d.owner)?clone(getLayout(d.owner)):null});if(d.history.length>60)d.history.shift();
 if(isRack)persist(d,'manual');
 d.selectedIds=[];d.message='';return true;
}
/** A long press selects a whole table combination or the best complete rack combination.
 * Rack search prefers a visible contiguous run/group, avoiding surprise picks.
 */
export function bundleFor(d,id,opened){
 const loc=locate(d,id);if(!loc||!canMove(d,[id],opened))return [];
 if(loc.type==='group')return [...d.groups[loc.group]];
 const rack=d.rack;let best=[id];let bestScore=-1;
 for(let start=0;start<=loc.index;start++){
  for(let end=Math.max(loc.index+1,start+3);end<=Math.min(rack.length,start+13);end++){
   const sample=rack.slice(start,end);if(!sample.includes(id)||!meldInfo(sample).valid)continue;
   const score=sample.length*100-(loc.index-start);
   if(score>bestScore){best=[...sample];bestScore=score;}
  }
 }
 return best;
}
export function clearLocalRummikub(){drafts.clear();layouts.clear();}