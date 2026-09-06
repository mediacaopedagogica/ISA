import { evaluate } from 'https://cdn.jsdelivr.net/npm/mathjs@14/+esm'

export function initStudyCalculator({onSendResult}){
  const $=id=>document.getElementById(id)
  let expression='',result='0',history=[],scientific=false
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))

  function renderHistory(){
    const box=$('calcHistory');if(!box)return
    box.innerHTML=history.map((h,i)=>`<div class="calc-history-row"><span>${esc(h.expression)} = <strong>${esc(h.result)}</strong></span><button type="button" data-send-calc="${i}">Enviar ao caderno</button></div>`).join('')
    box.querySelectorAll('[data-send-calc]').forEach(b=>b.onclick=()=>onSendResult?.(history[Number(b.dataset.sendCalc)]))
  }
  function render(){if($('calcExpression'))$('calcExpression').textContent=expression||' ';if($('calcResult'))$('calcResult').textContent=result;renderHistory()}
  function setMode(value){scientific=value;$('calcNormalBtn')?.classList.toggle('active',!value);$('calcScientificBtn')?.classList.toggle('active',value);document.querySelectorAll('.calc-key.scientific').forEach(x=>x.classList.toggle('sci-hidden',!value))}
  function calculate(){
    if(!expression)return
    try{let exp=expression.replaceAll('×','*').replaceAll('÷','/').replaceAll('π','pi').replaceAll('ln(','log(');const value=evaluate(exp);if(typeof value!=='number'||!Number.isFinite(value))throw new Error();result=Number.isInteger(value)?String(value):String(Number(value.toPrecision(12)));history.unshift({expression,result});history=history.slice(0,12)}catch{result='Erro'}render()
  }
  function handle(btn){
    const value=btn.dataset.calc,action=btn.dataset.action
    if(value){expression+=value;render();return}
    if(action==='clear'){expression='';result='0'}
    else if(action==='backspace')expression=expression.slice(0,-1)
    else if(action==='equals')return calculate()
    else if(action==='negative')expression=expression?`-(${expression})`:'-'
    else if(action==='square')expression=expression?`(${expression})^2`:''
    else if(action==='inverse')expression=expression?`1/(${expression})`:''
    else if(action==='factorial')expression=expression?`factorial(${expression})`:''
    else if(action==='percent')expression=expression?`(${expression})/100`:''
    render()
  }
  $('calcNormalBtn')?.addEventListener('click',()=>setMode(false));$('calcScientificBtn')?.addEventListener('click',()=>setMode(true))
  document.querySelectorAll('#calcKeys [data-calc],#calcKeys [data-action]').forEach(b=>b.addEventListener('click',()=>handle(b)))
  setMode(scientific);render()
  return {render,setMode}
}
