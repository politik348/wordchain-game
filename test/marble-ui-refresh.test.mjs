import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('public/marble/app.mjs');
const css=read('public/marble/ui-refresh.css');
const page=read('public/marble/index.html');

const markerStart=app.indexOf('function hasHumanDecision(s){');
const markerEnd=app.indexOf('function sidePanel(s){',markerStart);
assert.ok(markerStart>=0&&markerEnd>markerStart,'keep decision handling as separate reusable functions');
const decisionSource=app.slice(markerStart,markerEnd);
const createHarness=new Function('s','ctx',`
 const introActive=Boolean(ctx.introActive),scene=ctx.scene||null,onlineRoom=ctx.onlineRoom||null,SID='alice',inFlight=false;
 const TILES=[{kind:'start',name:'출발',emoji:'🏁'},{kind:'city',name:'서울',emoji:'🏙️',price:450,group:0}];
 const LEVEL_NAMES=['토지','별장','빌딩','호텔','랜드마크'];
 const BANK_LOAN=500,BANK_REPAY=650,BAIL_COST=300;
 const current=s=>s.players[s.turnIndex];
 const formatM=n=>n+'M',escapeHTML=v=>String(v);
 const toll=()=>50,buildingCost=()=>150,maxBuildLevel=()=>4,propertyValue=()=>550,upgradeCost=()=>200,olympicCost=()=>250;
 const button=(action,label,kind='mm-primary',disabled=false,attrs='')=>'<button class="mm-btn '+kind+'" data-action="'+action+'" '+(disabled?'disabled':'')+' '+attrs+'>'+label+'</button>';
 const buildButtons=()=>button('upgrade','건설 선택');
 const winnerRanking=()=>[],netWorth=()=>0;
 ${decisionSource}
 return {visible:hasHumanDecision(s),html:decisionModal(s)};
`);

function state(phase,kind,opts={}){
 return {
  players:[{id:opts.id||'alice',name:'동물친구',ai:Boolean(opts.ai),cash:2100,laps:1,loanUsed:false}],
  turnIndex:0,phase,pending:{kind,index:1},properties:kind==='upgrade'?{1:{owner:'alice',level:0}}:{},
  doubles:0,events:[],lastRoll:null
 };
}
test('new stylesheet is actually loaded AFTER existing marble CSS, with cache-busted UI code',()=>{
 assert.match(page,/ui-refresh\.css\?v=20261123marble5/);
 assert.match(page,/app\.mjs\?v=20261123cardchoice1/);
 assert.ok(page.indexOf('ui-refresh.css')>page.indexOf('gameplay-upgrades.css'));
 assert.match(css,/\.mm-gamewrap \.mm-sidebar\{grid-column:1;grid-row:1/);
 assert.match(css,/@media\(max-width:940px\)/);
 assert.match(css,/\.mm-decision-overlay\{position:fixed/);
});
test('JavaScript syntax remains valid after the UI refresh',()=>{
 assert.doesNotThrow(()=>new Function(app.replace(/^import .*$/gm,'')));
});
test('purchase and upgrade dialogs expose original engine action buttons',()=>{
 const purchase=createHarness(state('choice','purchase'),{});
 assert.equal(purchase.visible,true);
 assert.match(purchase.html,/mm-decision-dialog/);
 assert.match(purchase.html,/서울/);
 assert.match(purchase.html,/data-action="buy"/);
 assert.match(purchase.html,/data-level="0"/);
 assert.match(purchase.html,/data-action="pass"/);
 const upgrade=createHarness(state('choice','upgrade'),{});
 assert.equal(upgrade.visible,true);
 assert.match(upgrade.html,/data-action="upgrade"/);
});
test('chance cards use the same action dispatcher inside the popup',()=>{
 const out=createHarness(state('chance','fortune'),{});
 assert.equal(out.visible,true);
 assert.equal((out.html.match(/data-action="pickCard"/g)||[]).length,3);
});
test('never show interactive decision dialog to AI or online spectators or during movement effects',()=>{
 assert.equal(createHarness(state('choice','purchase',{ai:true}),{}).visible,false);
 assert.equal(createHarness(state('choice','purchase',{id:'bob'}),{onlineRoom:{state:{}}}).visible,false);
 assert.equal(createHarness(state('choice','purchase'),{scene:{event:{}}}).visible,false);
 assert.equal(createHarness(state('choice','purchase'),{introActive:true}).visible,false);
});
test('dice actions, travel actions, loans, and liquidation remain connected',()=>{
 assert.match(app,/mm-dice-console/);
 assert.match(app,/button\('roll','🎲 주사위 굴리기'/);
 assert.match(app,/decisionModal\(s\)/);
 assert.match(app,/liquidationPopup\(s\)/);
 assert.match(app,/mm-action-ribbon/);
 assert.match(app,/data-land=/);
 assert.match(app,/marbleCatResult\(s\)/);
});

test('premium cityscape, dice art and purchase cards load in visual polish layer',()=>{
 const theme=read('public/marble/visual-polish.css');
 assert.match(page,/visual-polish\.css\?v=20261123cardchoice1/);
 assert.ok(page.indexOf('visual-polish.css')>page.indexOf('ui-refresh.css'));
 assert.match(app,/mm-stage-skyline/);
 assert.match(app,/mm-turn-badge/);
 assert.match(app,/mm-decision-art-inner/);
 assert.match(app,/mm-dice-flourish/);
 assert.match(theme,/\.mm-stage-skyline\{/);
 assert.match(theme,/\.mm-gamewrap \.mm-board-frame\{/);
 assert.match(theme,/\.mm-decision-actions \.mm-center-actions:has\(\[data-action="buy"\]\)/);
 assert.match(theme,/prefers-reduced-motion:reduce/);
});

test('salary amount and net payout are visible on start tile, top bar and action result',()=>{
 const theme=read('public/marble/visual-polish.css');
 const engine=read('public/marble/engine.mjs');
 assert.match(engine,/PASS_BONUS=220/);
 assert.match(engine,/salaryLaps=Math\.max/);
 assert.match(engine,/salaryRepayment=/);
 assert.match(engine,/moneyChanges,salary,message/);
 assert.match(app,/mm-salary-chip/);
 assert.match(app,/mm-start-salary/);
 assert.match(app,/mm-salary-reward/);
 assert.match(app,/mm-action-salary/);
 assert.match(app,/PASS_BONUS/);
 assert.match(theme,/\.mm-start-salary/);
 assert.match(theme,/\.mm-salary-reward/);
});

test('human can pick which protective toll card to spend at the decision dialog',()=>{
 const stateWithCards=state('tollDefense','tollDefense');
 stateWithCards.pending.charge=550;
 stateWithCards.players[0].angel=1;
 stateWithCards.players[0].discountCards=2;
 const out=createHarness(stateWithCards,{});
 assert.equal(out.visible,true);
 assert.match(out.html,/DEFENSE CHOICE/);
 assert.match(out.html,/mm-toll-defense-actions/);
 assert.match(out.html,/data-action="payToll"/);
 assert.match(out.html,/data-action="useAngel"/);
 assert.match(out.html,/data-action="useDiscount"/);
 assert.match(out.html,/550M/);
 assert.equal(createHarness(stateWithCards,{scene:{event:{}}}).visible,false);
 assert.equal(createHarness(stateWithCards,{onlineRoom:{}}).visible,true);
});
test('fortune cards reveal their full effect and await explicit confirmation in local matches',()=>{
 const theme=read('public/marble/visual-polish.css');
 assert.match(app,/const fortuneReveal=card/);
 assert.match(app,/card\.title/);
 assert.match(app,/card\.amount/);
 assert.match(app,/card\?'확인하고 계속/);
 assert.match(app,/const hold=ev\.ai\?3000:onlineRoom\?5000:null/);
 assert.match(app,/if\(hold!==null\)sceneTimer=setTimeout/);
 assert.match(theme,/\.mm-fortune-detail/);
 assert.match(theme,/\.mm-toll-defense-actions/);
});
