// Cantinho da Isa — som urgente isolado para lembretes.
// Não altera layout, chat, roteamento ou dados. Som customizado toca somente com o app aberto;
// em segundo plano o som da notificação é controlado pelo navegador/sistema operacional.
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

  function tone(c,start,freq,duration,gainValue){
    const osc=c.createOscillator(),gain=c.createGain()
    osc.type='sine';osc.frequency.setValueAtTime(freq,start)
    gain.gain.setValueAtTime(0.0001,start)
    gain.gain.exponentialRampToValueAtTime(gainValue,start+.018)
    gain.gain.exponentialRampToValueAtTime(0.0001,start+duration)
    osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(start+duration+.03)
  }

  async function play({urgent=true}={}){
    if(!unlocked&&localStorage.getItem(STORE)==='1')await unlock()
    const c=audioContext();if(!c||c.state!=='running')return false
    const now=c.currentTime+.025
    // Curto e perceptível, sem volume agressivo.
    tone(c,now,urgent?784:659,.14,.11)
    tone(c,now+.19,urgent?988:784,.14,.12)
    tone(c,now+.38,urgent?1175:880,.22,.13)
    try{if(urgent&&navigator.vibrate)navigator.vibrate([180,80,180,80,320])}catch{}
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
