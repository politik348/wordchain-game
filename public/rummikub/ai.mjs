/** Fair, heuristic "Cat" opponent: combinatorial hand search + table extensions. */
import {COLORS, meldInfo, tileFromId} from './engine.mjs';

function enumerateMelds(hand, limit=3500) {
  const tiles=hand.map(tileFromId), jokerIds=hand.filter(id=>tileFromId(id).joker);
  const byColorNumber=new Map(), result=new Map();
  for(const t of tiles)if(!t.joker){const key=`${t.color}:${t.value}`;const a=byColorNumber.get(key)||[];a.push(t.id);byColorNumber.set(key,a);}
  const emit=ids=>{if(result.size>=limit)return;if(ids.length<3||ids.length>13)return;const info=meldInfo(ids);if(info.valid){const key=ids.join(',');if(!result.has(key))result.set(key,{ids,score:info.score});}};
  for(let n=1;n<=13;n++){
    const available=COLORS.map(c=>byColorNumber.get(`${c}:${n}`)||[]);
    for(let mask=1;mask<16;mask++){
      const selected=COLORS.map((_,i)=>i).filter(i=>mask&(1<<i));
      if(selected.length>4)continue;
      const recur=(p,chosen)=>{
        if(p===selected.length){for(let j=0;j<=Math.min(jokerIds.length,4-chosen.length);j++){
          if(chosen.length+j>=3)emit(chosen.concat(jokerIds.slice(0,j)));
        }return;}
        for(const id of available[selected[p]])recur(p+1,chosen.concat(id));
      };
      recur(0,[]);
    }
  }
  for(const color of COLORS){
    for(let start=1;start<=11;start++){
      for(let end=start+2;end<=13;end++){
        if(result.size>=limit)break;
        const len=end-start+1;let combos=0;
        const recur=(n,chosen,usedJokers)=>{
          if(combos>80 || result.size>=limit)return;
          if(n>end){combos++;emit(chosen);return;}
          for(const id of (byColorNumber.get(`${color}:${n}`)||[]))recur(n+1,chosen.concat(id),usedJokers);
          if(usedJokers<jokerIds.length)recur(n+1,chosen.concat(jokerIds[usedJokers]),usedJokers+1);
        };
        recur(start,[],0);
      }
    }
  }
  return [...result.values()];
}

const effort = (ids) => ids.length*240 + ids.reduce((sum,id)=>{
  const t=tileFromId(id);return sum+(t.joker?-35:t.value);
},0);

/** Bounded beam search favors the most rack tiles played; no hidden information. */
function bestOwnMelds(hand,{opened=false,limit=280,beamWidth=80,maxGroups=6}={}) {
  const candidates=enumerateMelds(hand).sort((a,b)=>effort(b.ids)-effort(a.ids)).slice(0,limit);
  const indexed=new Map(hand.map((id,i)=>[id,BigInt(i)]));
  const a=candidates.map(c=>({ ...c, mask:c.ids.reduce((m,id)=>m|(1n<<indexed.get(id)),0n)}));
  let beam=[{groups:[],used:0n,score:0,points:0}];let best=null;
  const evaluate=(s)=>{if(s.groups.length && (opened||s.points>=30) && (!best||s.score>best.score))best=s;};
  for(let depth=0;depth<Math.min(maxGroups,Math.floor(hand.length/3));depth++){
    const next=[];const seen=new Set();
    for(const state of beam){
      for(const c of a){
        if((state.used&c.mask)!==0n)continue;
        const mask=state.used|c.mask;if(seen.has(mask.toString()))continue;
        seen.add(mask.toString());
        const proposal={groups:[...state.groups,c.ids],used:mask,score:state.score+effort(c.ids),points:state.points+c.score};
        evaluate(proposal);next.push(proposal);
      }
    }
    if(!next.length)break;
    beam=next.sort((x,y)=>y.score-x.score).slice(0,beamWidth);
  }
  return best?{groups:best.groups,score:best.score,ids:best.groups.flat()}:null;
}

/** Search additions to existing melds, then independently pack remaining rack tiles. */
export function chooseCatMove(state,catId,{maxExtensions,difficulty='beginner'}={}){
  const profiles={
   beginner:{ownLimit:280,beamWidth:80,maxGroups:6,extensions:70,pairLimit:32},
   intermediate:{ownLimit:440,beamWidth:140,maxGroups:7,extensions:135,pairLimit:44},
   advanced:{ownLimit:760,beamWidth:240,maxGroups:8,extensions:240,pairLimit:60}
  };
  const profile=profiles[difficulty]||profiles.beginner;
  maxExtensions=maxExtensions??profile.extensions;
  const hand=state.hands[catId];if(!hand?.length)return null;
  let best=null;
  const consider=(groups,used)=>{
    const remaining=hand.filter(id=>!used.has(id));
    const own=bestOwnMelds(remaining,{opened:true,limit:profile.ownLimit,beamWidth:profile.beamWidth,maxGroups:profile.maxGroups});
    const proposalGroups=groups.concat(own?.groups||[]);
    const allUsed=[...used,...(own?.ids||[])];
    if(!allUsed.length)return;
    const score=effort(allUsed);
    if(!best||score>best.score)best={groups:proposalGroups,score,used:allUsed.length};
  };
  if(!state.opened[catId]){
    const own=bestOwnMelds(hand,{opened:false,limit:profile.ownLimit,beamWidth:profile.beamWidth,maxGroups:profile.maxGroups});
    return own?{groups:state.table.map(g=>[...g]).concat(own.groups),used:own.ids.length,score:own.score}:null;
  }
  consider(state.table.map(g=>[...g]),new Set());
  // Add up to two rack tiles to a pre-existing set, including runs and groups.
  const extensions=[];
  for(let gi=0;gi<state.table.length;gi++){
    const group=state.table[gi];
    for(const id of hand){
      for(let at=0;at<=group.length;at++){
        const newGroup=[...group.slice(0,at),id,...group.slice(at)];
        if(meldInfo(newGroup).valid)extensions.push({gi,ids:[id],newGroup,score:effort([id])});
      }
    }
  }
  extensions.sort((a,b)=>b.score-a.score);
  for(const ext of extensions.slice(0,maxExtensions)){
    const groups=state.table.map(g=>[...g]);groups[ext.gi]=ext.newGroup;
    consider(groups,new Set(ext.ids));
  }
  // Pair of extensions to different groups; look ahead to the possible follow-up melds.
  for(let i=0;i<Math.min(profile.pairLimit,extensions.length);i++)for(let j=i+1;j<Math.min(profile.pairLimit,extensions.length);j++){
    const a=extensions[i],b=extensions[j];if(a.gi===b.gi||a.ids[0]===b.ids[0])continue;
    const groups=state.table.map(g=>[...g]);groups[a.gi]=a.newGroup;groups[b.gi]=b.newGroup;
    consider(groups,new Set([a.ids[0],b.ids[0]]));
  }
  return best;
}
