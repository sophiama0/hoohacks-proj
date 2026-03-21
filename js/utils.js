/**
 * utils.js — shared Rally utilities
 * Provides: toast(), openModal(), closeModal(), gc()
 * Include this before any page-specific scripts.
 */

let toastTmr;

/** Returns a color hex for a given gait % */
function gc(g){
  return g>=95?'#ef4444':g>=80?'#f97316':g>=60?'#f59e0b':g>=40?'#3b82f6':'#10b981';
}

/** Show a toast notification */
function toast(ic, t, s){
  document.getElementById('tic').textContent = ic;
  document.getElementById('tt').textContent  = t;
  document.getElementById('ts').textContent  = s;
  const el = document.getElementById('toastEl');
  if(toastTmr) clearTimeout(toastTmr);
  el.classList.add('show');
  toastTmr = setTimeout(()=>el.classList.remove('show'), 3200);
}

/** Open a modal by id */
function openModal(id){ document.getElementById(id).classList.add('open'); }

/** Close a modal by id */
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

/** Close any modal when its backdrop is tapped (event delegation) */
document.addEventListener('click', e=>{
  if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});
