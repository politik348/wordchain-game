/** 가면단 v2.0: server-authoritative role engine, no client-side secret role assignments. */
import { randomInt } from 'node:crypto';

export const MAFIA_ROLES = Object.freeze({
  '마피아':{team:'mafia',emoji:'🗡️',description:'매일 밤 시민 1명을 지목해 제거합니다. 동료 마피아와 스파이를 알 수 있습니다.',ability:'밤 습격'},
  '스파이':{team:'mafia',emoji:'🕶️',description:'마피아 편입니다. 매일 밤 한 사람의 정확한 직업을 알아냅니다.',ability:'비밀 정보 수집'},
  '경찰':{team:'town',emoji:'🔎',description:'밤마다 한 사람이 마피아 팀인지 조사합니다.',ability:'정체 수사'},
  '의사':{team:'town',emoji:'🩺',description:'매일 밤 한 사람을 치료해 야간 공격을 막습니다. 본인 치료도 가능합니다.',ability:'치료'},
  '군인':{team:'town',emoji:'🛡️',description:'첫 번째 야간 공격을 자동으로 막습니다. 한 판에 한 번만 발동합니다.',ability:'방탄 조끼'},
  '정치인':{team:'town',emoji:'🗳️',description:'낮에 하는 투표가 항상 2표로 집계됩니다.',ability:'2표 행사'},
  '기자':{team:'town',emoji:'📰',description:'두 번째 밤부터 단 한 번, 선택한 사람의 직업을 다음 날 모두에게 공개합니다.',ability:'특종 보도'},
  '경호원':{team:'town',emoji:'🛡️',description:'밤에 한 명을 지킵니다. 공격받으면 그 사람 대신 자신이 희생됩니다.',ability:'대신 보호'},
  '사립탐정':{team:'town',emoji:'🕵️',description:'밤에 한 사람을 따라가 그 사람이 누구에게 능력을 사용했는지 알아냅니다.',ability:'미행'},
  '자경단원':{team:'town',emoji:'🎯',description:'한 판에 한 번 밤에 직접 공격할 수 있습니다. 아군도 맞힐 수 있으니 신중히 사용하세요.',ability:'일회성 사격'},
  '영매':{team:'town',emoji:'🔮',description:'두 번째 밤부터 사망한 사람 한 명의 정확한 직업을 확인합니다.',ability:'영혼의 목소리'},
  '시민':{team:'town',emoji:'🏡',description:'낮에 토론과 투표로 마피아를 찾아냅니다.',ability:'토론과 투표'},
});
const team=r=>MAFIA_ROLES[r]?.team||'town';
const fail=(code,message)=>{throw Object.assign(new Error(message),{status:code});};
const rand=a=>a[randomInt(a.length)];
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const aliveWithRole=(s,role)=>s.alive.filter(id=>s.roles[id]===role);
const townTargets=(s)=>s.alive.filter(id=>team(s.roles[id])!=='mafia');
const compactHistory=(s,text)=>{s.history.push({text});s.history=s.history.slice(-45);};
const nicks=(players,id)=>players.find(p=>p.id===id)?.nick||'플레이어';
const mafiaAlive=s=>s.alive.filter(id=>s.roles[id]==='마피아').length;
const factionAlive=s=>s.alive.filter(id=>team(s.roles[id])==='mafia').length;
const deadline=(seconds)=>Date.now()+seconds*1000;

export function generateMafiaRoles(playerCount,mode='special'){
 if(!Number.isInteger(playerCount)||playerCount<4||playerCount>12)fail(400,'가면단은 4~12명이 플레이합니다.');
 const mafia=playerCount>=12?3:playerCount>=8?2:1;
 const roles=Array(mafia).fill('마피아').concat(['의사','경찰']);
 if(mode==='special' && playerCount>=6){
   if(playerCount>=9)roles.push('스파이');
   const pool=['군인','정치인','기자','경호원','사립탐정','자경단원','영매']
     .filter(role=>role!=='기자'||playerCount>=8)
     .filter(role=>role!=='사립탐정'||playerCount>=9)
     .filter(role=>role!=='자경단원'||playerCount>=10)
     .filter(role=>role!=='영매'||playerCount>=10);
   for(let i=pool.length-1;i>0;i--){const j=randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
   // Preserve at least one ordinary citizen to keep claims and deductions meaningful.
   roles.push(...pool.slice(0,Math.min(pool.length,Math.max(0,playerCount-roles.length-1))));
 }
 while(roles.length<playerCount)roles.push('시민');
 for(let i=roles.length-1;i>0;i--){const j=randomInt(i+1);[roles[i],roles[j]]=[roles[j],roles[i]];}
 return roles;
}
export function createMafiaState(ids,mode='special'){
 const roles=generateMafiaRoles(ids.length,mode);
 return {
  mafiaMode:mode,roles:Object.fromEntries(ids.map((id,i)=>[id,roles[i]])),alive:[...ids],
  phase:'night',day:1,deadline:deadline(65),nightActions:{},investigations:{},
  votes:{},chat:[],mafiaChat:[],history:[{text:'첫 번째 밤입니다. 밤 직업은 대상을 선택하고 시민은 기다려 주세요.'}],
  used:{},publicReports:[],result:null,
 };
}
export function needsNightAction(s,id){
 if(!s.alive.includes(id))return false;
 const role=s.roles[id];
 if(role==='기자')return s.day>=2&&!s.used[`reporter:${id}`];
 if(role==='영매')return s.alive.length<Object.keys(s.roles).length;
 if(role==='자경단원')return !s.used[`vigilante:${id}`];
 return ['마피아','스파이','의사','경찰','경호원','사립탐정'].includes(role);
}
export function publicMafiaState(s,sid,finished=false){
 const role=s.roles[sid];
 const teammates=team(role)==='mafia'?Object.keys(s.roles).filter(id=>id!==sid&&team(s.roles[id])==='mafia'):[];
 return {
  mafiaMode:s.mafiaMode,alive:[...s.alive],phase:s.phase,day:s.day,deadline:s.deadline,
  votes:Object.keys(s.votes),nightSubmitted:has(s.nightActions,sid)?[sid]:[],nightSubmittedCount:Object.keys(s.nightActions).length,
  role,roleInfo:MAFIA_ROLES[role],teammates,mafiaChat:team(role)==='mafia'?s.mafiaChat.slice(-20):[],
  investigation:s.investigations[sid]||null,usedAbility:Boolean(s.used[`reporter:${sid}`]||s.used[`vigilante:${sid}`]),
  soldierShieldUsed:Boolean(s.used[`soldier:${sid}`]),
  canNightAct:needsNightAction(s,sid),history:s.history.slice(-14),publicReports:s.publicReports.slice(-7),chat:s.chat.slice(-30),
  allRoles:finished?{...s.roles}:undefined,result:s.result,
 };
}
function winningMessage(s){
 if(mafiaAlive(s)===0)return '시민 팀 승리! 마피아를 모두 찾아냈습니다.';
 if(factionAlive(s)>=s.alive.length-factionAlive(s))return '마피아 팀 승리! 마피아 세력이 과반을 차지했습니다.';
 return null;
}
function advanceNight(s,players){
 const mafia=s.alive.filter(id=>s.roles[id]==='마피아');
 const voted=mafia.map(id=>s.nightActions[id]).filter(id=>id&&id!=='skip'&&s.alive.includes(id));
 const counts={};voted.forEach(id=>counts[id]=(counts[id]||0)+1);
 const highest=Math.max(0,...Object.values(counts));
 const target=highest?rand(Object.keys(counts).filter(id=>counts[id]===highest)):(townTargets(s).length?rand(townTargets(s)):null);
 const doctor=s.alive.find(id=>s.roles[id]==='의사');
 const healed=s.nightActions[doctor];
 const guard=s.alive.find(id=>s.roles[id]==='경호원');
 const guarded=s.nightActions[guard];
 const attacks=[];
 if(target)attacks.push({victim:target,cause:'마피아'});
 const vig=s.alive.find(id=>s.roles[id]==='자경단원');
 if(vig&&s.nightActions[vig]&&s.nightActions[vig]!=='skip'){
  attacks.push({victim:s.nightActions[vig],cause:'자경단원'});
  s.used[`vigilante:${vig}`]=true;
 }
 for(const investigator of s.alive){
  const r=s.roles[investigator],tracked=s.nightActions[investigator];
  if(!tracked||tracked==='skip')continue;
  if(r==='경찰')s.investigations[investigator]=`${nicks(players,tracked)}: ${team(s.roles[tracked])==='mafia'?'마피아 팀 의심':'마피아 팀이 아님'}`;
  if(r==='스파이')s.investigations[investigator]=`${nicks(players,tracked)}: 직업은 ${s.roles[tracked]}`;
  if(r==='사립탐정'){
   const visit=s.nightActions[tracked];
   s.investigations[investigator]=`${nicks(players,tracked)}의 방문: ${visit&&visit!=='skip'?nicks(players,visit):'아무도 방문하지 않음'}`;
  }
  if(r==='영매')s.investigations[investigator]=`${nicks(players,tracked)}의 직업: ${s.roles[tracked]}`;
  if(r==='기자'&&s.day>=2&&!s.used[`reporter:${investigator}`]){
   s.used[`reporter:${investigator}`]=true;
   const story=`특종! ${nicks(players,tracked)}의 직업은 ${s.roles[tracked]}입니다.`;
   s.publicReports.push(story);compactHistory(s,story);
  }
 }
 const deaths=new Set();
 for(const {victim} of attacks){
  if(!s.alive.includes(victim)||deaths.has(victim))continue;
  if(victim===healed)continue;
  if(guard&&guarded===victim&&guard!==victim){deaths.add(guard);continue;}
  if(s.roles[victim]==='군인'&&!s.used[`soldier:${victim}`]){
   s.used[`soldier:${victim}`]=true;
   compactHistory(s,'총성이 울렸지만 누군가 방탄 장비로 공격을 막았습니다.');continue;
  }
  deaths.add(victim);
 }
 s.alive=s.alive.filter(id=>!deaths.has(id));
 if(deaths.size)compactHistory(s,`밤사이 ${[...deaths].map(id=>nicks(players,id)).join(', ')}님이 사망했습니다. (직업 비공개)`);
 else compactHistory(s,'밤사이 아무도 사망하지 않았습니다.');
 s.phase='discussion';s.votes={};s.nightActions={};s.deadline=deadline(120);
 return winningMessage(s);
}
function advanceVote(s,players){
 const totals={};
 for(const [voter,target] of Object.entries(s.votes)){
  const power=s.roles[voter]==='정치인'?2:1;
  totals[target]=(totals[target]||0)+power;
 }
 const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
 if(ranked.length&&ranked[0][0]!=='skip'&&ranked[0][1]>(ranked[1]?.[1]||0)){
  const victim=ranked[0][0];s.alive=s.alive.filter(id=>id!==victim);
  compactHistory(s,`${nicks(players,victim)}님이 투표로 추방됐습니다. (직업 비공개, ${ranked[0][1]}표)`);
 }else compactHistory(s,'투표 결과 기권 우세 또는 동점으로 아무도 추방되지 않았습니다.');
 const finish=winningMessage(s);
 if(finish)return finish;
 s.day++;s.phase='night';s.nightActions={};s.votes={};s.deadline=deadline(65);
 compactHistory(s,`${s.day}번째 밤이 찾아왔습니다.`);
 return null;
}
export function actMafia(s,sid,type,data,players,hostId){
 if(!s.alive.includes(sid))fail(403,'탈락한 플레이어는 행동할 수 없습니다.');
 const role=s.roles[sid];
 if(type==='mafiaWhisper'){
  if(s.phase!=='night'||team(role)!=='mafia')fail(403,'마피아 팀만 밤에 대화할 수 있습니다.');
  const message=String(data.text||'').replace(/[<>]/g,'').trim().slice(0,90);
  if(!message)return {message:null};
  s.mafiaChat.push({nick:nicks(players,sid),text:message});s.mafiaChat=s.mafiaChat.slice(-25);
  return {message:null};
 }
 if(type==='night'||type==='nightPass'){
  if(s.phase!=='night'||!needsNightAction(s,sid))fail(403,'현재 밤 행동을 사용할 수 없습니다.');
  if(has(s.nightActions,sid))fail(409,'이미 밤 행동을 제출했습니다.');
  if(type==='nightPass'){
   if(role==='마피아')fail(400,'마피아는 습격할 대상을 선택해야 합니다.');
   s.nightActions[sid]='skip';
  }else{
   const target=String(data.target||'');
   if(role==='영매' ? !has(s.roles,target)||s.alive.includes(target) : !s.alive.includes(target))fail(400,'유효한 대상을 선택하세요.');
   if(role==='마피아'&&team(s.roles[target])==='mafia')fail(400,'같은 마피아 팀을 습격할 수 없습니다.');
   if(['경호원','자경단원','기자','사립탐정','스파이','경찰'].includes(role)&&target===sid)fail(400,'이 직업은 자신을 지정할 수 없습니다.');
   s.nightActions[sid]=target;
  }
  if(s.alive.every(id=>!needsNightAction(s,id)||has(s.nightActions,id))){const finish=advanceNight(s,players);return {message:'새 아침이 밝았습니다.',finish};}
  return {message:'밤 행동이 접수되었습니다.'};
 }
 if(type==='discussionEnd'){
  if(s.phase!=='discussion'||hostId!==sid)fail(403,'낮 토론은 방장만 끝낼 수 있습니다.');
  s.phase='vote';s.deadline=deadline(60);
  return {message:'공개 투표가 시작되었습니다.'};
 }
 if(type==='vote'){
  if(s.phase!=='vote'||has(s.votes,sid))fail(400,'현재 투표할 수 없습니다.');
  const target=String(data.target||'');
  if(target!=='skip'&&!s.alive.includes(target))fail(400,'생존자 또는 기권을 선택하세요.');
  s.votes[sid]=target;
  if(s.alive.every(id=>has(s.votes,id))){const finish=advanceVote(s,players);return {message:'투표가 마감되었습니다.',finish};}
  return {message:'투표가 접수되었습니다.'};
 }
 fail(400,'가면단에서 사용할 수 없는 행동입니다.');
}
export function tickMafia(s,players,now=Date.now()){
 if(now<s.deadline)return null;
 if(s.phase==='night'){
  const mafia=s.alive.filter(id=>s.roles[id]==='마피아');
  for(const id of mafia)if(!has(s.nightActions,id)){const targets=townTargets(s);s.nightActions[id]=targets.length?rand(targets):'skip';}
  return {message:'밤 행동 마감: 미제출 행동을 자동 처리했습니다.',finish:advanceNight(s,players)};
 }
 if(s.phase==='discussion'){s.phase='vote';s.deadline=deadline(60);return {message:'토론 시간이 종료되어 투표를 시작합니다.'};}
 if(s.phase==='vote')return {message:'투표 시간이 끝났습니다.',finish:advanceVote(s,players)};
 return null;
}