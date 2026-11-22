import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,applyAction,saleValue,propertyValue,toll} from '../public/marble/engine.mjs';

const players=[{id:'human',name:'사람'},{id:'other',name:'상대'}];
const fresh=()=>createGame({players,maxRounds:8});
const rollTwo=()=>0;

test('매각가 70%: 내 소유 부동산만 선택 매각할 수 있다',()=>{
 let s=fresh();s.properties[1]={owner:'human',level:0};s.properties[2]={owner:'other',level:0};
 const cash=s.players[0].cash,price=saleValue(s,1);
 assert.equal(price,Math.round(propertyValue(1,0)*.7/5)*5);
 assert.throws(()=>applyAction(s,'human','sellProperty',{index:2}),/내가 보유한 부동산/);
 s=applyAction(s,'human','sellProperty',{index:1});
 assert.equal(s.players[0].cash,cash+price);
 assert.equal(s.properties[1],undefined);
 assert.equal(s.properties[2].owner,'other');
 assert.equal(s.lastEvent.type,'sellProperty');
 assert.equal(s.lastEvent.propertyChanges[0].kind,'sale');
});

test('세금이 부족하면 자동 매각하지 않고 직접 고를 때까지 결제를 보류한다',()=>{
 let s=fresh();
 s.players[0].position=7; s.players[0].cash=0;
 s.properties[1]={owner:'human',level:0};
 s.properties[2]={owner:'human',level:0};
 s=applyAction(s,'human','roll',{},rollTwo); // lands on tax at 9
 assert.equal(s.phase,'liquidation');
 assert.equal(s.pending.context.kind,'tax');
 assert.equal(s.players[0].cash,0);
 assert.ok(s.properties[1]&&s.properties[2],'no property sold automatically');
 assert.throws(()=>applyAction(s,'human','roll',{},rollTwo),/매각/);
 const price=saleValue(s,2),due=s.pending.amount;
 s=applyAction(s,'human','sellProperty',{index:2});
 assert.equal(s.properties[1].owner,'human');
 assert.equal(s.properties[2],undefined);
 assert.equal(s.players[0].cash,price-due);
 assert.notEqual(s.phase,'liquidation');
});

test('통행료 부족 시 매각 순서를 플레이어가 정하고 전액 지불 후 재개한다',()=>{
 let s=fresh();
 s.players[0].cash=0;s.players[0].position=2;
 s.properties[4]={owner:'other',level:4};
 for(const i of [1,2,7,8])s.properties[i]={owner:'human',level:i===2?1:0};
 const owed=toll(s,4),before=s.players[1].cash;
 s=applyAction(s,'human','roll',{},rollTwo);
 assert.equal(s.phase,'liquidation');
 assert.equal(s.pending.amount,owed);
 assert.equal(s.players[1].cash,before,'opponent must not receive an unpaid toll');
 // Deliberately sell the second-most valuable city first.
 s=applyAction(s,'human','sellProperty',{index:2});
 assert.equal(s.properties[2],undefined);
 assert.ok(s.properties[1], 'not forcibly selling the cheapest city first');
 for(const i of [8,1,7]){
  if(s.phase!=='liquidation')break;
  s=applyAction(s,'human','sellProperty',{index:i});
 }
 assert.notEqual(s.phase,'liquidation');
 assert.equal(s.players[1].cash,before+owed);
 assert.ok(s.players.every(p=>p.cash>=0));
});

test('보유 부동산을 전부 팔아도 세금을 못 내면 기존 파산 규칙 적용',()=>{
 let s=fresh();
 s.players[0].position=7;s.players[0].cash=0;
 s.properties[1]={owner:'human',level:0};
 // Property itself is cheap, but other property values may force a large tax.
 s.properties[2]={owner:'human',level:4};
 s.properties[4]={owner:'human',level:4};
 s.properties[7]={owner:'human',level:4};
 // Shortage created via expensive opponent toll; enforce far larger than all sale values.
 s.properties[5]={owner:'other',level:4};
 s.players[0].position=3; // +2 => expensive opponent's city
 s=applyAction(s,'human','roll',{},rollTwo);
 assert.equal(s.phase,'liquidation');
 let guard=0;
 while(s.phase==='liquidation'&&guard++<8){
  const index=Object.keys(s.properties).map(Number).find(i=>s.properties[i].owner==='human');
  assert.notEqual(index,undefined);
  s=applyAction(s,'human','sellProperty',{index});
 }
 assert.notEqual(s.phase,'liquidation');
 assert.ok(s.players.every(p=>p.cash>=0));
});

test('고양이 AI는 기존대로 자금 부족 시 자동 매각한다',()=>{
 let s=createGame({players:[{id:'cat',name:'고양이',ai:true},{id:'other',name:'상대'}],maxRounds:8});
 s.players[0].position=7;s.players[0].cash=0;s.properties[1]={owner:'cat',level:0};
 s=applyAction(s,'cat','roll',{},rollTwo);
 assert.notEqual(s.phase,'liquidation');
 assert.equal(s.properties[1],undefined);
});

test('모여마블 오프닝·매각창 UI가 연결되어 있다',()=>{
 const app=readFileSync(new URL('../public/marble/app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/marble/index.html',import.meta.url),'utf8');
 assert.match(app,/function beginMarbleIntro/);
 assert.match(app,/function liquidationPopup/);
 assert.match(app,/data-action="sellProperty"/);
 assert.match(html,/gameplay-upgrades\.css/);
});
