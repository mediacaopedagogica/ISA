let audioCtx=null
let sampleModulePromise=null
const decoded=new Map()
const NOTE_BASE={C:0,D:2,E:4,F:5,G:7,A:9,B:11}

function ctx(){
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)()
  if(audioCtx.state==='suspended')audioCtx.resume()
  return audioCtx
}
function midi(note){
  const m=/^([A-G])([#b]?)(-?\d)$/.exec(String(note||''))
  if(!m)return 60
  let s=NOTE_BASE[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)
  return (Number(m[3])+1)*12+s
}
async function samples(){
  if(!sampleModulePromise)sampleModulePromise=import('./alan-real-samples-v1.js?v=1-local')
  const mod=await sampleModulePromise
  return mod.ALAN_REAL_SAMPLES||{}
}
function nearest(pool,target){
  const keys=Object.keys(pool||{})
  if(!keys.length)return null
  if(pool[target])return target
  const tm=midi(target)
  return keys.sort((a,b)=>Math.abs(midi(a)-tm)-Math.abs(midi(b)-tm))[0]
}
async function decode(inst,sourceNote,uri){
  const key=`${inst}:${sourceNote}`
  if(decoded.has(key))return decoded.get(key)
  const arr=await (await fetch(uri)).arrayBuffer()
  const buf=await ctx().decodeAudioData(arr.slice(0))
  decoded.set(key,buf)
  return buf
}
export async function playRealInstrument(inst,targetNote,{gain=.82,delay=0,duration=0}={}){
  const all=await samples(),pool=all[inst]
  if(!pool)throw new Error(`Timbre real não instalado: ${inst}`)
  const sourceNote=nearest(pool,targetNote)
  if(!sourceNote)throw new Error(`Sem amostras reais para ${inst}`)
  const buffer=await decode(inst,sourceNote,pool[sourceNote])
  const C=ctx(),src=C.createBufferSource(),g=C.createGain(),t=C.currentTime+Math.max(0,Number(delay)||0)
  src.buffer=buffer
  src.playbackRate.value=Math.pow(2,(midi(targetNote)-midi(sourceNote))/12)
  g.gain.value=Math.max(0,Math.min(1.4,Number(gain)||.82))
  src.connect(g).connect(C.destination)
  src.start(t)
  if(duration>0)src.stop(t+duration)
  return {instrument:inst,targetNote,sourceNote}
}
export async function warmRealInstrument(inst){
  const all=await samples(),pool=all[inst]
  if(!pool)throw new Error(`Timbre real não instalado: ${inst}`)
  const first=Object.entries(pool)[0]
  if(first)await decode(inst,first[0],first[1])
  return true
}
