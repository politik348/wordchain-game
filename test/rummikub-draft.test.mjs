import test from 'node:test';
import assert from 'node:assert/strict';
import {draftFor,visibleHand,moveTiles,bundleFor,locate,setSort,restore,reset,changedTable,clearLocalRummikub,canMove} from '../public/rummikub/draft.mjs';
function room(rack=['t-1-4-0','t-0-3-0','t-1-2-0','t-0-1-0']){
 return {id:'TEST',state:{matchId:'match-'+Math.random(),turnNumber:1,turn:'p',hand:[...rack],table:[]}};
}
test('Sorting is rack-only: draw confirmation is not needed',()=>{
 const r=room();const d=draftFor(r,'p');
 setSort(d,'color');assert.equal(changedTable(d),false);
 assert.deepEqual(d.rack,['t-0-1-0','t-0-3-0','t-1-2-0','t-1-4-0']);
});
test('Sorted rack survives a drawn tile and a full turn cycle',()=>{
 const r=room(),d=draftFor(r,'p');setSort(d,'color');
 r.state.turnNumber=3;r.state.hand.push('t-0-2-0');
 assert.deepEqual(draftFor(r,'p').rack,['t-0-1-0','t-0-2-0','t-0-3-0','t-1-2-0','t-1-4-0']);
 assert.deepEqual(visibleHand(r,'p'),draftFor(r,'p').rack);
});
test('Manual rack arrangement remains after draw; newly drawn tile follows it',()=>{
 const r=room(),d=draftFor(r,'p');
 assert.equal(moveTiles(d,['t-0-1-0'],'rack',0),true);
 r.state.turnNumber=3;r.state.hand.push('t-2-3-1');
 assert.deepEqual(draftFor(r,'p').rack,['t-0-1-0','t-1-4-0','t-0-3-0','t-1-2-0','t-2-3-1']);
});
test('Putting tiles on table requires confirmation only for table edits; undo and reset retain sorting',()=>{
 const r=room(['t-0-7-0','t-0-6-0','t-0-5-0','t-2-9-0']);const d=draftFor(r,'p');
 setSort(d,'color');
 const tiles=d.rack.slice(0,3);
 assert.equal(moveTiles(d,tiles,'new',undefined,false),true);assert.equal(changedTable(d),true);
 assert.deepEqual(d.groups[0],['t-0-5-0','t-0-6-0','t-0-7-0']);
 assert.equal(restore(d),true);assert.equal(changedTable(d),false);
 moveTiles(d,tiles,'new',undefined,false);reset(d);
 assert.equal(changedTable(d),false);assert.deepEqual(d.rack,['t-0-5-0','t-0-6-0','t-0-7-0','t-2-9-0']);
});
test('Long hold on rack selects the whole contiguous valid run',()=>{
 const r=room(['t-0-5-0','t-0-6-0','t-0-7-0','t-1-8-0']);const d=draftFor(r,'p');
 assert.deepEqual(bundleFor(d,'t-0-6-0',false),['t-0-5-0','t-0-6-0','t-0-7-0']);
 assert.deepEqual(bundleFor(d,'t-1-8-0',false),['t-1-8-0']);
});
test('Holding an existing table meld selects all tiles after opening, and blocks before opening',()=>{
 const rack=['t-0-5-0','t-0-6-0','t-0-7-0','t-1-8-0'];const r=room(rack);
 r.state.hand=['t-1-8-0'];r.state.table=[rack.slice(0,3)];
 const d=draftFor(r,'p');
 assert.deepEqual(bundleFor(d,'t-0-6-0',false),[]);
 assert.deepEqual(bundleFor(d,'t-0-6-0',true),rack.slice(0,3));
});
test('Complete bundle transfer is atomic, and individual tiles can reorder within meld',()=>{
 const r=room(['t-0-3-0','t-0-2-0','t-0-1-0','t-1-8-0']);const d=draftFor(r,'p');
 assert.equal(moveTiles(d,['t-0-1-0','t-0-2-0','t-0-3-0'],'new',undefined,false),true);
 assert.deepEqual(d.groups[0],['t-0-1-0','t-0-2-0','t-0-3-0']);
 assert.equal(moveTiles(d,['t-0-3-0'],0,0,false),true);
 assert.deepEqual(d.groups[0],['t-0-3-0','t-0-1-0','t-0-2-0']);
 assert.equal(moveTiles(d,['t-0-3-0'],0,3,false),true);
 assert.deepEqual(d.groups[0],['t-0-1-0','t-0-2-0','t-0-3-0']);
});
test('Existing table tiles cannot be moved until player opens, and no tile can duplicate',()=>{
 const r=room(['t-0-5-0']);r.state.table=[['t-0-3-0','t-0-4-0','t-0-6-0']];const d=draftFor(r,'p');
 assert.equal(canMove(d,['t-0-3-0'],false),false);
 assert.equal(moveTiles(d,['t-0-3-0'],'new',undefined,false),false);
 assert.equal(moveTiles(d,['t-0-5-0','t-0-5-0'],'new',undefined,true),false);
 assert.equal(moveTiles(d,['t-0-5-0'],0,0,true),true);
 assert.equal(new Set(d.groups.flat()).size,d.groups.flat().length);
});
test('Rack layout survives module state loss via sessionStorage fallback',()=>{
 const prior=globalThis.sessionStorage;
 const db=new Map();
 globalThis.sessionStorage={getItem:key=>db.get(key)??null,setItem:(key,val)=>db.set(key,val),removeItem:key=>db.delete(key)};
 try{
  const r=room(),d=draftFor(r,'p');setSort(d,'number');
  assert.ok(db.size>0);
  clearLocalRummikub();r.state.turnNumber=5;r.state.hand.push('t-0-2-0');
  assert.deepEqual(draftFor(r,'p').rack,['t-0-1-0','t-0-2-0','t-1-2-0','t-0-3-0','t-1-4-0']);
 }finally{clearLocalRummikub();if(prior===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=prior;}
});