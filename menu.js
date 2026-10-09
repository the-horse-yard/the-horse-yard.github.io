(()=>{
 const menu=document.querySelector('#site-menu'),toggle=menu.querySelector('.menu-toggle'),nav=menu.querySelector('nav');
 const setOpen=open=>{menu.classList.toggle('is-open',open);nav.hidden=!open;toggle.setAttribute('aria-expanded',String(open))};
 toggle.addEventListener('click',()=>setOpen(nav.hidden));
 menu.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>setOpen(false)));
 document.addEventListener('click',event=>{if(!nav.hidden&&!menu.contains(event.target))setOpen(false)});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!nav.hidden){setOpen(false);toggle.focus()}});
 setOpen(false);
})();
