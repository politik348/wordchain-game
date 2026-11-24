const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/kof97/group-17-23-art.js'),'utf8');
function setup(){
  const original={draw:()=> 'fallback',portrait:d=>'original:'+d.key,preload:()=>Promise.resolve()};
  const window={KOFArt:original};
  vm.runInNewContext(source,{window,URL,document:{currentScript:{src:'https://example.org/kof97/group-17-23-art.js'},querySelectorAll:()=>[]},fetch:async()=>({ok:false})});
  return window;
}
const actions=['idle','walk','jump','crouch','guard','hit','ko','win','evade','punch','kick','grab','special','alt','super'];
function attack(key,artIntent,t=10){return {hp:100,y:451,attack:{key,artIntent,t,start:5,end:15,total:25}}}
test('route every target character through each attack intent',()=>{
  const w=setup(),g=w.KOFGroup1723;
  assert.deepEqual(Object.keys(g.profiles),['17','18','19','20','21','22','23']);
  for(const [k,p] of Object.entries(g.profiles)){
    const d={key:+k};
    for(const [key,intent,expected] of [['punch','normal','punch'],['kick','normal','kick'],['grab','normal','grab'],[p.primary,'special','special'],[p.alternate,'alt','alt'],['upper','alt','alt'],['super','super','super']]){
      assert.equal(g.pose(d,attack(key,intent),0,'fight',false)[0],expected);
    }
    assert.equal(g.pose(d,{hp:0,y:451},0,'fight',false)[0],'ko');
    assert.equal(g.pose(d,{hp:100,y:451,guard:true},0,'fight',false)[0],'guard');
  }
});
test('asset validation and safe fallback',async()=>{
  const w=setup(),g=w.KOFGroup1723;
  const rect={x:0,y:0,w:30,h:40,ax:15,ay:38};
  const m={version:1,pixelsPerBody:38,frames:[rect,{...rect,x:30}],actions:Object.fromEntries(actions.map(a=>[a,[0,1]]))};
  const im={naturalWidth:60,naturalHeight:40};
  assert.equal(g.valid(m,im),true);
  assert.equal(g.valid({...m,actions:{...m.actions,kick:[0,0]}},im),false);
  assert.equal(g.valid({...m,frames:[rect,{...rect,x:31}]},im),false);
  assert.equal(w.KOFArt.portrait({key:0}),'original:0');
  assert.equal(w.KOFArt.draw(null,{key:0}),'fallback');
  assert.equal(await g.load({key:17}).promise,false);
  assert.equal(w.KOFArt.draw(null,{key:17}),'fallback');
});
