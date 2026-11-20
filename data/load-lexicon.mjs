import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
export function loadDictionary(){
 const data=JSON.parse(readFileSync(new URL('../public/words.json',import.meta.url),'utf8'));
 if(Array.isArray(data)) return data;
 if(data?.encoding!=='gzip-json-shards'||!Array.isArray(data.parts))throw new Error('Invalid dictionary manifest');
 const words=[];
 for(const part of data.parts){
  if(!/^dictionary\/part-\d{2}\.json\.gz$/.test(part)) throw new Error('Invalid dictionary shard path');
  const shard=JSON.parse(gunzipSync(readFileSync(new URL('../public/'+part,import.meta.url))).toString('utf8'));
  if(!Array.isArray(shard)) throw new Error('Invalid dictionary shard');
  words.push(...shard);
 }
 if(words.length!==data.count) throw new Error(`Dictionary size mismatch: ${words.length} vs ${data.count}`);
 return words;
}
