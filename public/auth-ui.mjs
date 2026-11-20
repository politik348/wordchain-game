// Login and registration UI shared by Moyeo multiplayer games.
// Single-player modes remain playable without an account.
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function request(route,payload){
 const res=await fetch(route,{method:payload===undefined?'GET':'POST',headers:payload===undefined?{}:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload),credentials:'same-origin'});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||'요청에 실패했습니다.');
 return data;
}
export function createMembershipUI({onAccountChanged,afterLogin}={}){
 let account=null,configured=false,invitesEnabled=false,regToken=null,tab='login',postLogin=null,adminMode=false,statusChecking=false,statusFailed=false;
 const node=document.createElement('dialog');node.id='membershipDialog';node.className='membership-dialog';
 node.innerHTML=`<div class="membership-shell"><button type="button" class="member-close" data-member="close" aria-label="닫기">×</button><header class="member-heading"><span class="member-cat">🐱</span><div><span class="member-kicker">MOYEO MEMBERS ONLY</span><h2 id="memberTitle">모여게임즈 로그인</h2><p id="memberDescription">고양이 대전은 자유롭게, 친구와의 온라인 대전은 회원 전용!</p></div></header><div id="memberContent"></div><p class="member-error" id="memberError" role="alert" hidden></p></div>`;
 document.body.append(node);
 const $=id=>node.querySelector('#'+id);
 function setError(message){const zone=$('memberError');zone.hidden=!message;zone.textContent=message||'';}
 function close(){node.close();regToken=null;postLogin=null;setError('');}
 function tabs(){return `<div class="member-tabs"><button type="button" class="${tab==='login'?'active':''}" data-member="tab-login">로그인</button><button type="button" class="${tab==='register'?'active':''}" data-member="tab-register">회원가입</button></div>`;}
 function content(){
  setError('');
  if(account){
   $('memberTitle').textContent='내 계정';
   $('memberDescription').textContent='등록한 드립대학 닉네임으로 게임에 참여합니다.';
   $('memberContent').innerHTML=`<div class="member-profile"><b>${escapeHtml(account.dripNickname)}</b><small>아이디: ${escapeHtml(account.username)}</small></div><button type="button" class="member-primary member-danger" data-member="logout">로그아웃</button>`;
  }else{
   $('memberTitle').textContent=tab==='register'?'드립대학 인증 후 가입':'모여게임즈 로그인';
   $('memberDescription').textContent='친구들과 온라인으로 플레이하려면 운영자가 발급한 인증번호로 가입해야 합니다.';
   if(statusChecking){
    $('memberContent').innerHTML=tabs()+'<p class="member-info">서버에서 회원가입 상태를 확인하고 있습니다...</p>';
    return;
   }
   const help=statusFailed?'<p class="member-warning">서버 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.</p>':!configured?'<p class="member-warning">회원 데이터베이스 연결 설정을 확인해주세요.</p>':!invitesEnabled?'<p class="member-warning">운영자 인증키 설정을 확인해주세요.</p>':'';
   if(tab==='login'){
    $('memberContent').innerHTML=tabs()+help+`<form id="memberLogin"><label>아이디<input name="username" type="text" minlength="4" maxlength="20" required autocomplete="username" autocapitalize="off"></label><label>비밀번호<input name="password" type="password" minlength="10" required autocomplete="current-password"></label><button class="member-primary" type="submit">로그인</button></form>`;
   }else if(regToken){
    $('memberContent').innerHTML=tabs()+`<p class="member-success">인증번호를 확인했습니다. 사용할 아이디와 비밀번호를 생성하세요.</p><form id="memberRegister"><label>사용할 아이디<input name="username" type="text" placeholder="영문 시작 · 4~20자" pattern="[A-Za-z][A-Za-z0-9_-]{3,19}" minlength="4" maxlength="20" autocomplete="username" required></label><label>비밀번호<input name="password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required placeholder="10자 이상"></label><label>비밀번호 확인<input name="passwordConfirm" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><button type="submit" class="member-primary">계정 만들기</button></form><button type="button" class="member-back" data-member="reset-register">닉네임 인증 다시 하기</button>`;
   }else{
    $('memberContent').innerHTML=tabs()+help+`<form id="memberVerify"><label>드립대학 닉네임<input name="dripNickname" type="text" maxlength="24" minlength="2" required autocomplete="off" placeholder="드립대학에서 사용하는 닉네임"></label><label>운영자가 알려준 4자리 번호<input name="code" type="text" minlength="4" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" autocomplete="one-time-code" placeholder="0000" required></label><p class="member-info">4자리 인증번호는 운영자가 닉네임별로 발급합니다. 한 번만 사용할 수 있습니다.</p><button class="member-primary" type="submit">닉네임·번호 확인</button></form>`;
   }
  }
 }
 function open(mode='login',callback=null){
  if(callback)postLogin=callback;
  if(!account){tab=mode;regToken=null;}
  if(!account)statusChecking=true;
  content();if(!node.open)node.showModal();
  if(!account)void refresh();
 }
 async function refresh(){
  statusChecking=true;
  try{
   const response=await request('/api/auth/me');
   account=response.account||null;
   configured=Boolean(response.storageConfigured);
   invitesEnabled=Boolean(response.invitesEnabled);
   statusFailed=false;
  }catch{
   account=null;configured=false;invitesEnabled=false;statusFailed=true;
  }finally{
   statusChecking=false;
   if(node.open)content();
  }
  onAccountChanged?.(account);return account;
 }
 async function completed(person){
  account=person;onAccountChanged?.(person);
  const callback=postLogin;close();
  if(typeof callback==='function')await callback();
  if(typeof afterLogin==='function')afterLogin(person);
 }
 node.addEventListener('click',async event=>{
  const command=event.target.closest('[data-member]')?.dataset.member;
  if(command==='close'){close();return;}
  if(command==='tab-login'){tab='login';regToken=null;content();return;}
  if(command==='tab-register'){
   tab='register';regToken=null;
   if(!configured||!invitesEnabled||statusFailed){statusChecking=true;content();void refresh();}
   else content();
   return;
  }
  if(command==='reset-register'){regToken=null;content();return;}
  if(command==='logout'){
   try{await request('/api/auth/logout',{});account=null;onAccountChanged?.(null);content();}
   catch(e){setError(e.message);}
  }
 });
 node.addEventListener('submit',async event=>{
  event.preventDefault();setError('');
  const form=event.target,values=Object.fromEntries(new FormData(form).entries());
  const submit=form.querySelector('button[type=submit]');if(submit)submit.disabled=true;
  try{
   if(form.id==='memberLogin'){
    const data=await request('/api/auth/login',{username:values.username,password:values.password});
    await completed(data.account);
   }else if(form.id==='memberVerify'){
    const data=await request('/api/auth/verify',{dripNickname:values.dripNickname,code:values.code});
    regToken=data.registrationToken;content();
   }else if(form.id==='memberRegister'){
    if(values.password!==values.passwordConfirm)throw Error('비밀번호 확인이 일치하지 않습니다.');
    const data=await request('/api/auth/register',{registrationToken:regToken,username:values.username,password:values.password});
    await completed(data.account);
   }
  }catch(e){setError(e.message);}finally{if(submit.isConnected)submit.disabled=false;}
 });
 node.addEventListener('cancel',event=>{event.preventDefault();close();});
 return {refresh,open,account:()=>account,hasAccount:()=>Boolean(account),requireLogin:async callback=>{
  if(account)return true;
  open('login',callback);return false;
 },register:()=>open('register'),login:()=>open('login')};
}
