(()=>{
 const native='https://the-horse-yard.jayahu19940507.chatgpt.site',external=location.hostname==='the-horse-yard.github.io',origin=external?native:'',brand=origin+'/assets/branding/mongolian-logo.svg';let counts={},mine={},noticeTimer,revision=0;
 const pendingLikes=new Set();let likedHere={},device=crypto.randomUUID();
 try{const saved=JSON.parse(localStorage.getItem("yard-likes")||"{}");if(saved&&typeof saved==="object"&&!Array.isArray(saved))likedHere=Object.fromEntries(Object.entries(saved).filter(([k,v])=>typeof k==="string"&&v===true));const stored=localStorage.getItem("yard-like-device");if(/^[a-f0-9-]{36}$/.test(stored||""))device=stored;else localStorage.setItem("yard-like-device",device)}catch{}
 const lang=()=>document.documentElement.lang==='uk',words=()=>lang()?{like:'Подобається',save:'Зберегти',share:'Поділитися',download:'Завантажити',saved:'Збережено',liked:'Подобається',collection:'Мої збережені миті →',copied:'Посилання скопійовано.'}:{like:'Like',save:'Save',share:'Share',download:'Download',saved:'Saved',liked:'Liked',collection:'My saved moments →',copied:'Link copied.'};
 function notice(s){let n=document.querySelector('.social-notice');if(!n){n=document.createElement('p');n.className='social-notice';n.setAttribute('role','status');document.body.append(n)}n.textContent=s;n.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>n.hidden=true,6500)}
 function watermark(frame){if(frame.querySelector(':scope > .media-watermark'))return;const logo=document.createElement('img');logo.className='media-watermark';logo.src=brand;logo.alt='';logo.loading='lazy';frame.append(logo)}
 function link(m){const url=new URL(location.pathname,location.origin);url.searchParams.set('moment',m.file);url.hash='gallery';return url.href}
 function socialLink(m,action){return origin+'/social.html?media='+encodeURIComponent(m.file)+(action?'&action='+action:'')}
 const icons={like:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',share:'<path d="M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',save:'<path d="M6 3h12v18l-6-4-6 4Z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'};
 function actionIcon(action){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.innerHTML=icons[action];return svg}
 function toolbar(m){
  const bar=document.createElement('div');bar.className='moment-actions';bar.dataset.media=m.file;
  const more=document.createElement('details');more.className='moment-more';const summary=document.createElement('summary');summary.append(actionIcon('more'));more.append(summary);
  const panel=document.createElement('div');panel.className='moment-more-panel';more.append(panel);
  more.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(more.open));if(more.open)document.querySelectorAll('.moment-more[open]').forEach(other=>{if(other!==more)other.open=false})});
  for(const action of ['like','share','save','download']){
   const control=document.createElement(['like','share'].includes(action)?'button':'a');control.dataset.action=action;
   if(control.tagName==='A'){control.href=socialLink(m,action);control.target='_blank';control.rel='noopener';control.addEventListener('click',()=>{more.open=false})}
   else if(action==='like'){control.type='button';control.onclick=()=>toggleLike(m.file)}
   else{control.type='button';control.onclick=async()=>{try{if(navigator.share)await navigator.share({title:m.title,url:link(m)});else{await navigator.clipboard.writeText(link(m));notice(words().copied)}}catch(e){if(e.name!=='AbortError'){let input=bar.querySelector('.share-link-copy');if(!input){input=document.createElement('input');input.className='share-link-copy';input.readOnly=true;input.setAttribute('aria-label','Share link — copy this address');bar.append(input)}input.value=link(m);input.select();notice('Copy the selected link.')}}}};
   (['save','download'].includes(action)?panel:bar).append(control);
  }
  bar.append(more);updateBar(bar);return bar;
 }
 function updateBar(bar){
  const key=bar.dataset.media,w=words(),state={...mine[key],liked:Boolean(likedHere[key])};
  bar.querySelectorAll('[data-action]').forEach(control=>{
   const action=control.dataset.action,label=action==='like'?(state.liked?w.liked:w.like):action==='save'?(state.saved?w.saved:w.save):w[action];
   const text=document.createElement('span');text.className='action-label';text.textContent=label;control.replaceChildren(actionIcon(action),text);
   control.setAttribute('aria-label',label+(action==='like'&&counts[key]?' · '+counts[key]:''));control.title=label;
   if(action==='like'){control.setAttribute('aria-pressed',String(state.liked));control.disabled=pendingLikes.has(key);control.setAttribute('aria-busy',String(pendingLikes.has(key)));if(counts[key]){const count=document.createElement('span');count.className='like-count';count.textContent=new Intl.NumberFormat(lang()?'uk':'en',{notation:'compact',maximumFractionDigits:1}).format(counts[key]);control.append(count)}}
   if(action==='download')control.title=lang()?'Потрібен вхід':'Sign in to download';
  });
  const summary=bar.querySelector('.moment-more summary');if(summary){const label=lang()?'Більше дій':'More actions';summary.setAttribute('aria-label',label);summary.title=label;summary.setAttribute('aria-expanded',String(summary.parentElement.open))}
 }
 document.addEventListener('click',event=>document.querySelectorAll('.moment-more[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false}));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.activeElement?.closest('.moment-more[open]');if(menu){event.preventDefault();event.stopPropagation();menu.open=false;menu.querySelector('summary').focus()}else document.querySelectorAll('.moment-more[open]').forEach(m=>m.open=false)}},true);
 function updateLikes(){document.querySelectorAll('.moment-actions').forEach(updateBar)}
 async function toggleLike(key){
  if(pendingLikes.has(key))return;
  const previous=Boolean(likedHere[key]),next=!previous,oldCount=counts[key]||0;
  pendingLikes.add(key);revision++;likedHere[key]=next;counts[key]=Math.max(0,oldCount+(next?1:-1));updateLikes();
  try{
   const r=await fetch(origin+'/api/social/like',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({device,media:key,liked:next})});
   const result=await r.json();if(!r.ok||typeof result.liked!=='boolean'||!Number.isFinite(result.likes))throw Error(r.status===429?'rate':'failed');
   likedHere[key]=result.liked;counts[key]=result.likes;
   try{const saved=JSON.parse(localStorage.getItem('yard-likes')||'{}');if(result.liked)saved[key]=true;else delete saved[key];localStorage.setItem('yard-likes',JSON.stringify(saved))}catch{}
  }catch(error){likedHere[key]=previous;counts[key]=oldCount;notice(lang()?(error.message==='rate'?'Зачекайте кілька хвилин і спробуйте ще раз.':'Не вдалося зберегти вподобання. Спробуйте ще раз.'):(error.message==='rate'?'Please wait a few minutes and try again.':'Could not save your like. Please try again.'))}
  finally{pendingLikes.delete(key);revision++;updateLikes()}
 }
 window.addEventListener('storage',e=>{if(e.key==='yard-likes'){try{const saved=JSON.parse(e.newValue||'{}');for(const key of new Set([...Object.keys(likedHere),...Object.keys(saved)]))if(!pendingLikes.has(key))likedHere[key]=saved[key]===true;updateLikes();refresh()}catch{}}});
 function decorate(){document.querySelectorAll('#gallery-grid>.media-card').forEach(b=>{const image=b.querySelector('img'),m=MEDIA.find(m=>image?.src.endsWith('/assets/'+m.thumb));if(!m)return;const article=document.createElement('article');article.className='moment-card';if(b.classList.contains('is-panorama'))article.classList.add('is-panorama');b.replaceWith(article);article.append(b,toolbar(m));watermark(b.querySelector('.media-frame'))});const frame=document.querySelector('#viewer-content'),media=frame?.querySelector(':scope>img,:scope>video');if(media){const m=MEDIA.find(m=>media.src.endsWith('/assets/'+m.file));if(m){const wrap=document.createElement('div');wrap.className='branded-media';media.replaceWith(wrap);wrap.append(media);watermark(wrap);let bar=document.querySelector('#viewer-actions');if(bar)bar.remove();bar=toolbar(m);bar.id='viewer-actions';frame.after(bar)}}}
 new MutationObserver(decorate).observe(document.querySelector('#gallery-grid'),{childList:true});new MutationObserver(decorate).observe(document.querySelector('#viewer-content'),{childList:true});decorate();
 const collection=document.createElement('a');collection.className='saved-collection-link';collection.href=origin+'/social.html';collection.textContent=words().collection;document.querySelector('#gallery .filter-bar').after(collection);
 const featured=MEDIA.find(m=>m.kind==='video'&&m.category==='training');if(featured){const area=document.querySelector('.featured-copy');if(area){const bar=toolbar(featured);bar.id='featured-actions';area.append(bar)}const frame=document.querySelector('.featured-image');if(frame){frame.classList.add('branded-media');watermark(frame)}}
 const comp=document.querySelector('#closing-ride');if(comp){const wrap=document.createElement('div');wrap.className='branded-media';comp.replaceWith(wrap);wrap.append(comp);watermark(wrap);const update=()=>{let src=comp.currentSrc||comp.src||comp.querySelector('source')?.src;if(!src)return;const path=new URL(src).pathname;const m={file:path.split('/assets/')[1],title:'The Horse Yard · Competition film',kind:'video'};if(!m.file)return;let bar=document.querySelector('#competition-actions');if(bar)bar.remove();bar=toolbar(m);bar.id='competition-actions';wrap.after(bar)};new MutationObserver(update).observe(comp,{attributes:true,attributeFilter:['src']});update()}
 new MutationObserver(()=>{document.querySelectorAll('.moment-actions').forEach(updateBar);collection.textContent=words().collection}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 async function refresh(){const started=revision;try{const r=await fetch(origin+'/api/social/counts',{credentials:'omit'});if(r.ok){const data=await r.json();if(started===revision&&!pendingLikes.size){counts=Object.fromEntries(data.items.map(x=>[x.media,x.likes]));updateLikes()}}}catch{}if(!external)try{const r=await fetch('/api/social/mine');if(r.ok){mine=Object.fromEntries((await r.json()).items.map(x=>[x.media,x]));document.querySelectorAll('.moment-actions').forEach(updateBar)}}catch{}}
 refresh();window.addEventListener('focus',refresh);
 const target=new URLSearchParams(location.search).get('moment');if(target){const index=MEDIA.findIndex(m=>m.file===target);if(index>=0)openItem(index);else if(target.startsWith('films/')){const names=['films/closing-ride.mp4','films/competition-portrait.mp4','films/competition-silent.mp4'];const track=names.indexOf(target);if(track>=0)document.querySelector('[data-track="'+track+'"]')?.click();document.querySelector('#competitions')?.scrollIntoView();}else if(target.startsWith('community:'))document.querySelector('#community-moments')?.scrollIntoView();}
 window.YardSocial={toolbar,watermark};
})();
