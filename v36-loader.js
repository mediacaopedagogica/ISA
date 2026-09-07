if(!document.querySelector('link[href^="ui-fixes.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='ui-fixes.css?v=36';document.head.appendChild(l)}
import('./study-launcher.js?v=36').catch(e=>console.warn('Estudos:',e))
