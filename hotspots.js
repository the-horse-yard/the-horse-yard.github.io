(()=>{
 const markers=[...document.querySelectorAll('.horse-stage .horse-marker')];
 const mobile=window.matchMedia('(max-width:760px)');
 const clear=()=>markers.forEach(m=>{m.classList.remove('is-revealed');m.setAttribute('aria-expanded','false')});
 markers.forEach((m,i)=>{m.setAttribute('aria-expanded','false');const label=m.querySelector('.marker-text');label.id=`horse-marker-label-${i+1}`;m.setAttribute('aria-describedby',label.id)});
 document.addEventListener('click',event=>{
  if(!mobile.matches)return;
  const marker=event.target.closest('.horse-stage .horse-marker');
  if(!marker){clear();return}
  if(!marker.classList.contains('is-revealed')){
   event.preventDefault();event.stopImmediatePropagation();clear();marker.classList.add('is-revealed');marker.setAttribute('aria-expanded','true');
  }else clear();
 },true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')clear()});
 mobile.addEventListener('change',clear);
})();
