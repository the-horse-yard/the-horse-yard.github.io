(()=>{
 const box=document.getElementById('closing-film'),video=document.getElementById('closing-ride');if(!box||!video)return;
 const tracks=[{file:'closing-ride',silent:false},{file:'competition-portrait',silent:false},{file:'competition-silent',silent:true}],buttons=[...box.querySelectorAll('[data-track]')];
 const play=document.getElementById('closing-play'),sound=document.getElementById('playlist-sound'),status=document.getElementById('closing-status');
 let index=0,visible=false,userPaused=false,soundEnabled=false,switching=false,autoPausing=false,started=false,attempt=0;
 const words={en:{note:'Three films · In sequence',play:'Play',pause:'Pause',enable:'Enable sound',mute:'Mute',silent:'This film is silent',blocked:'Tap Play to start the sequence.',audioBlocked:'Playback continues silently. Use the player’s sound control to listen.',error:'This film could not load. Try the next film or open it below.',open:'Open the film',film:'Film',previous:'Previous film',next:'Next film'},uk:{note:'Три відео · По черзі',play:'Відтворити',pause:'Пауза',enable:'Увімкнути звук',mute:'Вимкнути звук',silent:'Це відео без звуку',blocked:'Натисніть «Відтворити», щоб почати.',audioBlocked:'Відтворення триває без звуку. Увімкніть звук у програвачі.',error:'Не вдалося завантажити відео. Спробуйте наступне або відкрийте його нижче.',open:'Відкрити відео',film:'Відео',previous:'Попереднє відео',next:'Наступне відео'}};
 const t=k=>words[document.documentElement.lang==='uk'?'uk':'en'][k];
 function labels(){document.getElementById('playlist-note').textContent=t('note');play.textContent=t(video.paused?'play':'pause');sound.disabled=tracks[index].silent;sound.textContent=t(tracks[index].silent?'silent':video.muted?'enable':'mute');document.getElementById('playlist-count').textContent=`0${index+1} / 03`;document.getElementById('playlist-open').textContent=t('open');document.getElementById('playlist-prev').setAttribute('aria-label',t('previous'));document.getElementById('playlist-next').setAttribute('aria-label',t('next'));buttons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.querySelector('span').textContent=t('film')+' 0'+(i+1)+''})}
 async function run(){if(!visible||document.hidden||userPaused)return;const token=++attempt;try{await video.play()}catch{if(token!==attempt)return;if(!video.muted){video.muted=true;try{await video.play();status.textContent=t('audioBlocked')}catch{status.textContent=t('blocked')}}else status.textContent=t('blocked')}finally{if(token===attempt){switching=false;labels()}}}
 function choose(i){attempt++;switching=true;index=(i+tracks.length)%tracks.length;video.muted=tracks[index].silent||!soundEnabled;video.src=box.dataset.mediaBase+tracks[index].file+'.mp4';video.poster=box.dataset.mediaBase+tracks[index].file+'.jpg';document.getElementById('playlist-open').href=video.src;status.textContent='';video.load();labels();run()}
 function pauseOffscreen(){attempt++;if(!video.paused){autoPausing=true;video.pause()}}
 play.onclick=()=>{if(video.paused){userPaused=false;visible=true;started=true;run()}else{userPaused=true;video.pause()}};
 sound.onclick=()=>{if(tracks[index].silent)return;soundEnabled=video.muted;video.muted=!soundEnabled;if(soundEnabled)video.volume=1;status.textContent='';userPaused=false;visible=true;run();labels()};
 buttons.forEach(b=>b.onclick=()=>{userPaused=false;visible=true;started=true;choose(Number(b.dataset.track))});
 document.getElementById('playlist-prev').onclick=()=>{userPaused=false;choose(index-1)};document.getElementById('playlist-next').onclick=()=>{userPaused=false;choose(index+1)};
 video.addEventListener('ended',()=>{userPaused=false;choose(index+1)});
 video.addEventListener('play',()=>{switching=false;userPaused=false;document.querySelectorAll('video').forEach(v=>{if(v!==video)v.pause()});document.dispatchEvent(new Event('yard-playlist-start'));labels()});
 video.addEventListener('pause',()=>{if(autoPausing)autoPausing=false;else if(!switching&&!video.ended&&visible&&!document.hidden)userPaused=true;labels()});
 video.addEventListener('volumechange',()=>{if(!switching&&!tracks[index].silent)soundEnabled=!video.muted&&video.volume>0;labels()});
 video.addEventListener('error',()=>{status.textContent=t('error');switching=false;labels()});
 const sync=()=>{if(visible&&!document.hidden){if(!started){started=true;video.muted=true}run()}else pauseOffscreen()};
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.25}).observe(video);else{visible=true;sync()}
 document.addEventListener('visibilitychange',sync);new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});labels();
})();
