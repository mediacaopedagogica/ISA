// Cantinho da Isa — som urgente isolado para lembretes.
// O som personalizado toca quando o app está aberto; em segundo plano o volume final é controlado pelo aparelho.
(function(){
  'use strict'
  if(window.__ISA_URGENT_SOUND_V1__)return
  window.__ISA_URGENT_SOUND_V1__=true

  let ctx=null,unlocked=false
  const STORE='isa-urgent-sound-enabled'

  function audioContext(){
    if(ctx)return ctx
    const C=window.AudioContext||window.webkitAudioContext
    if(!C)return null
    try{ctx=new C()}catch{return null}
    return ctx
  }

  async function unlock(){
    const c=audioContext();if(!c)return false
    try{if(c.state==='suspended')await c.resume();unlocked=c.state==='running';if(unlocked)localStorage.setItem(STORE,'1');return unlocked}catch{return false}
  }

  function tone(c,start,freq,duration,gainValue,type='triangle'){
    const osc=c.createOscillator(),gain=c.createGain()
    osc.type=type;osc.frequency.setValueAtTime(freq,start)
    gain.gain.setValueAtTime(0.0001,start)
    gain.gain.exponentialRampToValueAtTime(gainValue,start+.012)
    gain.gain.exponentialRampToValueAtTime(0.0001,start+duration)
    osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(start+duration+.03)
  }

  async function play({urgent=true}={}){
    if(!unlocked&&localStorage.getItem(STORE)==='1')await unlock()
    const c=audioContext();if(!c||c.state!=='running')return false
    const now=c.currentTime+.025
    if(urgent){
      // Alerta mais forte e mais longo, sem tentar ultrapassar o volume definido no aparelho.
      const seq=[
        [0,880,.20,.28,'triangle'],[.23,1175,.20,.30,'triangle'],
        [.50,880,.20,.28,'triangle'],[.73,1175,.20,.30,'triangle'],
        [1.00,988,.24,.30,'square'],[1.29,1319,.30,.31,'triangle']
      ]
      for(const [offset,freq,dur,gain,type] of seq)tone(c,now+offset,freq,dur,gain,type)
      try{if(navigator.vibrate)navigator.vibrate([420,120,420,120,700])}catch{}
    }else{
      tone(c,now,659,.16,.18)
      tone(c,now+.21,784,.20,.20)
      try{if(navigator.vibrate)navigator.vibrate([160,80,160])}catch{}
    }
    return true
  }

  async function enable(){return unlock()}
  async function test(){await unlock();return play({urgent:true})}

  function onServiceWorkerMessage(event){
    const d=event?.data||{}
    if(d.type!=='isa-urgent-notification'||!d.sound)return
    play({urgent:d.urgent!==false})
  }

  function boot(){
    navigator.serviceWorker?.addEventListener?.('message',onServiceWorkerMessage)
    const warm=()=>unlock()
    window.addEventListener('pointerdown',warm,{once:true,passive:true})
    window.addEventListener('keydown',warm,{once:true})
  }

  window.__ISA_URGENT_SOUND__={boot,enable,test,play,isUnlocked:()=>unlocked}
  boot()
})();
