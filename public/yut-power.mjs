// Press-and-release Yut control. Charge modifies animation only, not the toss outcome.
// Works with mouse, touch/pen and Space/Enter; handlers are delegated to survive rerenders.
export function chargePower(elapsedMs){
 const phase=(Math.max(0,Number(elapsedMs)||0)%3200)/1600;
 return Math.round(100*(phase<=1?phase:2-phase));
}

export function installYutPowerControl({canThrow,onThrow}){
 let active=null,ignoreClickUntil=0;
 function stop(){
  if(!active)return;
  cancelAnimationFrame(active.frame);
  active.button.classList.remove('is-charging');
  active=null;
 }
 function tick(){
  if(!active)return;
  if(!active.button.isConnected){stop();return;}
  active.power=chargePower(performance.now()-active.started);
  active.button.style.setProperty('--yut-power',active.power+'%');
  const caption=active.button.querySelector('.yut-power-caption');
  if(caption)caption.textContent='POWER '+active.power+'%';
  active.frame=requestAnimationFrame(tick);
 }
 function start(button,mode,source,id){
  if(active||button.disabled||!canThrow(mode))return false;
  active={button,mode,source,id,power:0,started:performance.now(),frame:null};
  button.classList.add('is-charging');
  const label=button.querySelector('.yut-charge-label');
  if(label)label.textContent='힘을 모으는 중… 손을 떼세요!';
  tick();return true;
 }
 function release(){
  if(!active)return;
  const mode=active.mode,power=Math.max(5,chargePower(performance.now()-active.started));
  stop();
  ignoreClickUntil=Date.now()+1100;
  onThrow(mode,power);
 }
 function modeFor(button){
  return button?.dataset.action==='roll'?'room':button?.dataset.action==='soloYutRoll'?'solo':null;
 }
 document.addEventListener('pointerdown',event=>{
  const button=event.target.closest?.('[data-yut-hold]');
  const mode=modeFor(button);
  if(!mode||event.button!==0)return;
  if(start(button,mode,'pointer',event.pointerId)){
   event.preventDefault();
   try{button.setPointerCapture(event.pointerId);}catch{}
  }
 });
 document.addEventListener('pointerup',event=>{
  if(active?.source==='pointer'&&active.id===event.pointerId)release();
 });
 document.addEventListener('pointercancel',event=>{
  if(active?.source==='pointer'&&active.id===event.pointerId)stop();
 });
 document.addEventListener('keydown',event=>{
  const button=event.target.closest?.('[data-yut-hold]');
  const mode=modeFor(button);
  if(!mode||![' ','Enter'].includes(event.key))return;
  event.preventDefault();
  if(!event.repeat)start(button,mode,'keyboard',event.key);
 });
 document.addEventListener('keyup',event=>{
  if(active?.source==='keyboard'&&active.id===event.key){
   event.preventDefault();release();
  }
 });
 window.addEventListener('blur',stop);
 return {shouldIgnoreClick:()=>Date.now()<ignoreClickUntil,cancel:stop};
}
