(()=>{
 const video=document.getElementById('closing-ride'),button=document.getElementById('closing-play'),status=document.getElementById('closing-status');if(!video)return;
 const words={en:{title:'One more moment in the saddle.',eyebrow:'FROM THE ARENA',play:'▶ Play with sound',pause:'Pause',hint:'Full film · 1:53 · Sound on',failed:'Press play on the video controls to start.',unavailable:'The film could not load. Use the video link below.',link:'Open the film'},uk:{title:'Ще одна мить у сідлі.',eyebrow:'З МАНЕЖУ',play:'▶ Відтворити зі звуком',pause:'Пауза',hint:'Повне відео · 1:53 · Зі звуком',failed:'Натисніть кнопку відтворення на відео.',unavailable:'Не вдалося завантажити відео. Скористайтеся посиланням нижче.',link:'Відкрити відео'}};
 const t=k=>words[document.documentElement.lang==='uk'?'uk':'en'][k];
 function labels(){document.querySelectorAll('[data-film]').forEach(n=>n.textContent=t(n.dataset.film));button.textContent=t(video.paused?'play':'pause')}
 video.defaultMuted=false;video.muted=false;video.volume=1;
 button.onclick=async()=>{if(!video.paused){video.pause();return}video.muted=false;video.volume=1;status.textContent='';try{await video.play()}catch{status.textContent=t('failed')}};
 video.addEventListener('play',()=>{document.querySelectorAll('video').forEach(v=>{if(v!==video)v.pause()});labels()});video.addEventListener('pause',labels);video.addEventListener('ended',labels);video.addEventListener('error',()=>status.textContent=t('unavailable'));
 new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});labels();
})();
