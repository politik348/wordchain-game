/** Simple, local move suggestions. No AI services, no access to opponent hands. */
import {COLORS, meldInfo, tileFromId} from './engine.mjs';

// Generate valid runs and groups available entirely within this rack. Physical tile
// IDs, rather than values, are tracked so duplicate copies cannot be reused.
export function findRackMelds(hand) {
  const byColor=Array.from({length:4},()=>new Map()), jokers=[];
  for(const id of hand){
    const t=tileFromId(id);if(!t)continue;
    if(t.joker)jokers.push(id);
    else {const bucket=byColor[COLORS.indexOf(t.color)];
      if(!bucket.has(t.value))bucket.set(t.value,[]);
      bucket.get(t.value).push(id);
    }
  }
  const seen=new Set(),out=[];
  function add(g){
    const info=meldInfo(g);if(!info.valid)return;
    const key=[...g].sort().join('|');if(seen.has(key))return;
    seen.add(key);out.push({tiles:[...g],score:info.score});
  }
  // Same value, distinct colours, with a joker filling an unused colour.
  for(let value=1;value<=13;value++){
    for(let mask=1;mask<16;mask++){
      const colors=[0,1,2,3].filter(c=>mask&(1<<c));
      for(let total=3;total<=4;total++){
        const gap=total-colors.length;
        if(gap<0||gap>jokers.length)continue;
        if(!colors.every(c=>byColor[c].has(value)))continue;
        const take=(ix,ids)=>{
          if(ix===colors.length){add(ids.concat(jokers.slice(0,gap)));return;}
          for(const id of byColor[colors[ix]].get(value))take(ix+1,[...ids,id]);
        };
        take(0,[]);
      }
    }
  }
  // Consecutive values in one colour; a joker can bridge any gap.
  for(let color=0;color<4;color++)for(let start=1;start<=11;start++){
    for(let length=3;length<=14-start;length++){
      function walk(offset,ids,available){
        if(offset===length){add(ids);return;}
        const value=start+offset;
        const real=byColor[color].get(value)||[];
        for(const id of real)walk(offset+1,[...ids,id],available);
        if(available.length)for(const joker of available)walk(offset+1,[...ids,joker],available.filter(v=>v!==joker));
      }
      walk(0,[],jokers);
    }
  }
  return out;
}

/** Choose a set of non-overlapping rack melds. Returns null if minScore unreachable. */
export function bestRackMelds(hand,{minScore=0,maxNodes=18000}={}){
  const candidates=findRackMelds(hand);
  if(!candidates.length)return null;
  const pos=new Map(hand.map((id,i)=>[id,BigInt(i)]));
  for(const c of candidates)c.mask=c.tiles.reduce((mask,id)=>mask|(1n<<pos.get(id)),0n);
  candidates.sort((a,b)=>b.tiles.length-a.tiles.length||b.score-a.score);
  let best=null, explored=0;
  // A branch-and-bound DFS over the playable groups. Keep it responsive for
  // large racks by bounding states; in normal 14-22-tile racks it is exhaustive.
  function search(index,mask,groups,score,count){
    if(++explored>maxNodes)return;
    if(score>=minScore&&count>0&&(!best||count>best.count||(count===best.count&&score>best.score))){
      best={groups:groups.map(g=>[...g]),count,score};
      if(count===hand.length)return;
    }
    if(index>=candidates.length||count+(hand.length-count)<=0)return;
    for(let i=index;i<candidates.length;i++){
      const c=candidates[i];if((mask&c.mask)!==0n)continue;
      search(i+1,mask|c.mask,[...groups,c.tiles],score+c.score,count+c.tiles.length);
      if(best?.count===hand.length||explored>maxNodes)return;
    }
  }
  search(0,0n,[],0,0);
  return best;
}

/** Easy additions to existing board melds, only after the initial 30 points. */
export function easyExtensions(table,hand){
  const groups=table.map(g=>[...g]);const remaining=[...hand];const additions=[];
  let changed=true;
  while(changed){
    changed=false;
    outer:for(let gi=0;gi<groups.length;gi++){
      const g=groups[gi];
      for(let ix=0;ix<remaining.length;ix++){
        const id=remaining[ix];
        for(const side of ['start','end']){
          const proposed=side==='start'?[id,...g]:[...g,id];
          if(meldInfo(proposed).valid){groups[gi]=proposed;remaining.splice(ix,1);additions.push(id);changed=true;break outer;}
        }
      }
    }
  }
  return {groups,remaining,additions};
}

export function recommendMove(hand,table=[],opened=false){
  if(!opened){
    const found=bestRackMelds(hand,{minScore:30});
    if(!found)return null;
    return {groups:[...table.map(g=>[...g]),...found.groups],used:found.groups.flat(),score:found.score};
  }
  const first=easyExtensions(table,hand);
  const rackMelds=bestRackMelds(first.remaining,{minScore:0});
  const extra=rackMelds?.groups||[];
  const used=[...first.additions,...extra.flat()];
  if(!used.length)return null;
  return {groups:[...first.groups,...extra],used,score:rackMelds?.score||0};
}