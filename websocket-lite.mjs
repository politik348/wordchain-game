// Small RFC 6455 text-only WebSocket implementation for first-party browser clients.
// No third-party runtime dependency; masked frames, size limits and origin are checked.
import {createHash} from 'node:crypto';
const MAGIC='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_FRAME=16*1024;
export function acceptWebSocket(req,socket,head,{message,close=()=>{}}){
 const key=req.headers['sec-websocket-key'];
 if(req.method!=='GET'||String(req.headers.upgrade||'').toLowerCase()!=='websocket'||
    !String(req.headers.connection||'').toLowerCase().split(',').some(s=>s.trim()==='upgrade')||
    req.headers['sec-websocket-version']!=='13'||typeof key!=='string'||
    !/^[A-Za-z0-9+/]{22}==$/.test(key)||Buffer.from(key,'base64').length!==16){
   socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');socket.destroy();return null;
 }
 const accept=createHash('sha1').update(key+MAGIC).digest('base64');
 socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
 socket.setNoDelay(true);
 let pending=Buffer.alloc(0),ended=false;
 function frame(opcode,payload=Buffer.alloc(0)){
  if(ended||socket.destroyed)return false;
  const bytes=Buffer.isBuffer(payload)?payload:Buffer.from(payload);
  const hdr=bytes.length<126?Buffer.from([0x80|opcode,bytes.length]):Buffer.from([0x80|opcode,126,bytes.length>>8,bytes.length&255]);
  if(socket.writableLength>1024*1024){terminate();return false;}
  socket.write(Buffer.concat([hdr,bytes]));return true;
 }
 function terminate(code=1000){if(ended)return;const payload=Buffer.from([code>>8,code&255]);frame(8,payload);ended=true;socket.end();}
 const transport={send(obj){return frame(1,Buffer.from(JSON.stringify(obj)));},close:terminate};
 socket.on('data',chunk=>{
  if(ended)return;
  pending=Buffer.concat([pending,chunk]);
  if(pending.length>MAX_FRAME*3){terminate(1009);return;}
  while(pending.length>=2){
   const op=pending[0]&15,fin=Boolean(pending[0]&0x80),reserved=pending[0]&0x70,masked=Boolean(pending[1]&0x80);
   let len=pending[1]&0x7f,offset=2;
   if(len===126){if(pending.length<4)return;len=pending.readUInt16BE(2);offset=4;}
   if(len===127){if(pending.length<10)return;const n=pending.readBigUInt64BE(2);if(n>BigInt(MAX_FRAME)){terminate(1009);return;}len=Number(n);offset=10;}
   if(!masked||reserved||!fin||![1,8,9,10].includes(op)){terminate(1002);return;}
   if(len>MAX_FRAME){terminate(1009);return;}
   if(pending.length<offset+4+len)return;
   const mask=pending.subarray(offset,offset+4),data=Buffer.from(pending.subarray(offset+4,offset+4+len));
   pending=pending.subarray(offset+4+len);
   for(let i=0;i<len;i++)data[i]^=mask[i%4];
   if(op===8){terminate();return;}
   if(op===9){frame(10,data);continue;}
   if(op===10)continue;
   try{
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(data);
    const obj=JSON.parse(raw);
    if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Invalid message');
    message(obj,transport);
   }catch(e){transport.send({type:'error',message:'그림 메시지를 처리할 수 없습니다.'});}
  }
 });
 socket.on('close',()=>{ended=true;close(transport);});
 socket.on('error',()=>{ended=true;socket.destroy();});
 if(head?.length)socket.emit('data',head);
 return transport;
}
