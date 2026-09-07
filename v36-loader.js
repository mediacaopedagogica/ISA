function addCss(href){if(document.querySelector(`link[href^="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=`${href}?v=37`;document.head.appendChild(l)}
addCss('ui-fixes.css')
addCss('ui-v36.css')
import('./realtime-presence.js?v=37').catch(e=>console.warn('Presença:',e))
import('./study-launcher.js?v=37').catch(e=>console.warn('Estudos:',e))
