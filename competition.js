(()=>{
 const section=document.querySelector('#competitions'),status=document.querySelector('#competition-status');
 let player=null,ready=false,visible=false,started=false,ended=false;
 const report=message=>{status.dataset.message=message;status.textContent=t(message);status.hidden=false};
 const sync=()=>{if(!ready||!player)return;if(visible&&!document.hidden&&!ended){player.mute();player.playVideo()}else player.pauseVideo()};
 function load(){if(started)return;started=true;
  window.onYouTubeIframeAPIReady=()=>{
   player=new YT.Player('competition-player',{width:'100%',height:'100%',videoId:'6nXQnlqFi2c',playerVars:{start:0,end:30,autoplay:0,controls:1,playsinline:1,rel:0,origin:location.origin},events:{
    onReady:event=>{ready=true;event.target.mute();const frame=event.target.getIframe();frame.title=t('Past horse yard competition · 00:00–00:30');frame.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');sync()},
    onStateChange:event=>{if(event.data===YT.PlayerState.ENDED)ended=true},
    onAutoplayBlocked:()=>report('Tap the play button to watch the 30-second excerpt.'),
    onError:()=>report('This film cannot play here. Use “Watch on YouTube” below.')
   }});
  };
  if(window.YT?.Player){window.onYouTubeIframeAPIReady();return}
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>report('The film could not load. Use “Watch on YouTube” below.');document.head.append(script);
 }
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)load();sync()},{threshold:0.25}).observe(document.querySelector('.competition-player-wrap'))}else{visible=true;load()}
 document.addEventListener('visibilitychange',sync);
})();
