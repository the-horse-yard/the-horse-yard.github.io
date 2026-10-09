import {TOPICS, FORMATS, describeFile, fileType, filterMedia, adjacentIndex, validRecord} from './gallery-model.mjs';

const $ = id => document.getElementById(id);
const topicNames = {all:'All moments',horses:'Horses',sunday:'Sunday training',jumping:'Show jumping',farm:'Farm life'};
const state = {topic:'all',format:'all',horse:''};
let hosted = [], local = [], visible = [], viewerItems = [], viewerIndex = -1, shown = 24;
let opener = null, uid = 0, touchStart = null;
const importKeys = new Set();
const viewer = $('viewer');
const grid = $('media-grid');
const more = document.createElement('button');
more.type = 'button'; more.className = 'button load-more'; more.textContent = 'Show more moments'; more.hidden = true;
grid.after(more);
more.addEventListener('click', () => {shown += 24; renderGallery();});

function el(tag, className, text) {
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text !== undefined) node.textContent = text;
  return node;
}
function totalMedia() {return [...hosted, ...local];}
function setFilters(changes, scroll = false) {
  Object.assign(state, changes); shown = 24;
  renderGallery();
  if(scroll) $('gallery').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function renderGallery() {
  visible = filterMedia(totalMedia(), state);
  document.querySelectorAll('[data-topic]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === state.topic)));
  document.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === state.format)));
  $('horse-select').value = state.horse;
  const total = totalMedia().length;
  $('media-count').textContent = `${visible.length} ${visible.length === 1 ? 'moment' : 'moments'}${visible.length !== total ? ` / ${total}` : ''}`;
  grid.replaceChildren(...visible.slice(0,shown).map((item, i) => mediaCard(item,i)));
  more.hidden = visible.length <= shown;
  more.textContent = `Show more moments (${Math.max(0,visible.length-shown)})`;
  $('gallery-empty').hidden = visible.length > 0;
  $('reset-filters').hidden = total === 0;
  if(total) {
    $('empty-title').textContent = 'No moments in this view yet.';
    $('empty-copy').textContent = 'Try another collection or view all moments.';
  } else {
    $('empty-title').textContent = 'A place for your moments.';
    $('empty-copy').textContent = 'The farm’s photos and videos haven’t been added yet. Choose files above to explore your own collection.';
  }
}
function mediaCard(item, index) {
  const article = el('article','media-card');
  const button = el('button'); button.type = 'button';
  button.setAttribute('aria-label', `${item.type === 'video'?'Play video':'View photo'}: ${item.title}`);
  const frame = el('span','card-frame');
  let media;
  if(item.type === 'photo' || item.poster) {
    media = el('img'); media.src = item.poster || item.src;
    media.alt = item.alt || item.title; media.loading = 'lazy'; media.decoding = 'async';
  } else {
    media = el('video'); media.src = item.src; media.muted = true; media.playsInline = true; media.preload = 'metadata';
    media.setAttribute('aria-hidden','true'); media.tabIndex = -1;
  }
  media.addEventListener('error', () => {
    if(!frame.querySelector('.card-error')) frame.append(el('span','card-error',`${item.type === 'video'?'Video':'Photo'} preview unavailable. Open to try this file.`));
  }, {once:true});
  frame.append(media,el('span','media-kind',item.type === 'video'?'Video':'Photo'));
  if(item.type === 'video') {const play = el('span','play-mark'); play.setAttribute('aria-hidden','true'); play.append(el('span','', '▶')); frame.append(play);}
  const caption = el('span','card-caption');
  const info = el('span'); info.append(el('span','card-title',item.title));
  info.append(el('span','card-topic',[item.horse,topicNames[item.category]].filter(Boolean).join(' · ')));
  caption.append(info,el('span','card-index',String(index+1).padStart(2,'0')));
  button.append(frame,caption);
  button.addEventListener('click', () => openViewer(visible,index,button));
  article.append(button);
  return article;
}
function refreshContent() {
  const media = totalMedia();
  const names = [...new Set(media.map(item => item.horse).filter(Boolean))].sort();
  $('horse-filter').hidden = names.length === 0;
  const all = el('option','', 'All horses'); all.value = '';
  $('horse-select').replaceChildren(all,...names.map(name => {const option = el('option','',name); option.value=name; return option;}));
  if(!names.includes(state.horse)) state.horse = '';
  $('local-notice').hidden = local.length === 0;
  const photo = media.find(item=>item.type==='photo');
  const hero = $('hero-image');
  if(photo) {hero.src=photo.src; hero.hidden=false; hero.onerror=()=>{hero.hidden=true;};}
  else {hero.hidden=true; hero.removeAttribute('src');}
  renderGallery(); renderSessions();
}
function renderSessions() {
  const sessions = new Map();
  totalMedia().filter(item=>['sunday','jumping'].includes(item.category)).forEach(item => {
    const title = item.session || topicNames[item.category];
    const key = `${item.category}:${title}`;
    if(!sessions.has(key)) sessions.set(key,{title,category:item.category,date:item.date,items:[]});
    sessions.get(key).items.push(item);
  });
  const list = $('session-list');
  if(!sessions.size) {
    const empty = el('div','session-empty');
    empty.append(el('span','eyebrow','The training journal'),el('h3','', 'The next chapter starts here.'),el('p','', 'Sunday sessions and show-jumping updates will appear as they’re added.'));
    list.replaceChildren(empty); return;
  }
  list.replaceChildren(...[...sessions.values()].map(session => {
    const button = el('button','session-card'); button.type='button';
    const imageItem = session.items.find(item=>item.type==='photo'||item.poster);
    if(imageItem) {const img=el('img');img.src=imageItem.poster||imageItem.src;img.alt='';img.loading='lazy';button.append(img);}
    else button.append(el('span','session-tile',session.category==='sunday'?'S':'J'));
    const copy=el('span');copy.append(el('span','eyebrow',topicNames[session.category]),el('h3','',session.title),el('p','',`${session.items.length} ${session.items.length===1?'moment':'moments'}${session.date?` · ${session.date}`:''}`));
    button.append(copy);button.setAttribute('aria-label',`Browse ${session.title}`);
    button.addEventListener('click',()=>openViewer(session.items,0,button));return button;
  }));
}
function stopVideo() {
  const video=$('viewer-media').querySelector('video');
  if(video) {video.pause();video.removeAttribute('src');video.load();}
}
function renderViewer() {
  stopVideo();
  const item = viewerItems[viewerIndex];
  if(!item) return;
  $('viewer-title').textContent=item.title;
  $('viewer-category').textContent=[topicNames[item.category],item.horse].filter(Boolean).join(' · ');
  $('viewer-counter').textContent=`${viewerIndex+1} of ${viewerItems.length}`;
  $('previous-media').disabled=viewerItems.length<2;
  $('next-media').disabled=viewerItems.length<2;
  $('viewer-error').hidden=true;
  const media=el(item.type==='photo'?'img':'video');
  media.src=item.src;
  if(item.type==='photo') media.alt=item.alt||item.title;
  else {media.controls=true;media.playsInline=true;media.preload='metadata';if(item.poster)media.poster=item.poster;}
  media.addEventListener('error',()=>{$('viewer-error').hidden=false;},{once:true});
  $('viewer-media').replaceChildren(media);
}
function openViewer(items,index,source) {
  if(!items.length||index<0||index>=items.length) return;
  opener=source;viewerItems=items.slice();viewerIndex=index;renderViewer();
  document.body.classList.add('viewer-open');
  if(!viewer.open) viewer.showModal();
  $('close-viewer').focus();
}
function moveViewer(delta) {viewerIndex=adjacentIndex(viewerIndex,delta,viewerItems.length);renderViewer();}
function closeViewer() {viewer.close();}
viewer.addEventListener('close',()=>{stopVideo();$('viewer-media').replaceChildren();document.body.classList.remove('viewer-open');if(opener?.isConnected)opener.focus();});
viewer.addEventListener('click',event=>{if(event.target===viewer){const rect=viewer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeViewer();}});
viewer.addEventListener('keydown',event=>{
  if(event.target.closest('video')) return;
  if(event.key==='ArrowRight'){event.preventDefault();moveViewer(1);}
  else if(event.key==='ArrowLeft'){event.preventDefault();moveViewer(-1);}
});
$('viewer-stage').addEventListener('touchstart',event=>{if(event.target.closest('video'))return;touchStart=event.touches[0]?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
$('viewer-stage').addEventListener('touchend',event=>{if(!touchStart)return;const touch=event.changedTouches[0];if(touch){const dx=touch.clientX-touchStart.x,dy=touch.clientY-touchStart.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)moveViewer(dx<0?1:-1);}touchStart=null;},{passive:true});
$('close-viewer').addEventListener('click',closeViewer);
$('previous-media').addEventListener('click',()=>moveViewer(-1));
$('next-media').addEventListener('click',()=>moveViewer(1));
document.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>setFilters({topic:button.dataset.topic,horse:''})));
document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>setFilters({format:button.dataset.format})));
$('horse-select').addEventListener('change',event=>setFilters({horse:event.target.value}));
$('reset-filters').addEventListener('click',()=>setFilters({topic:'all',format:'all',horse:''}));
$('browse-training').addEventListener('click',()=>setFilters({topic:'sunday',format:'all',horse:''},true));
$('choose-files').addEventListener('click',()=>$('file-input').click());
$('choose-folder').addEventListener('click',()=>$('folder-input').click());
function importFiles(files) {
  const collection=$('import-collection').value;
  let added=0,unsupported=0,duplicate=0;
  for(const file of files) {
    if(!fileType(file.name)){unsupported++;continue;}
    const key=`${file.webkitRelativePath||file.name}:${file.size}:${file.lastModified}:${collection}`;
    if(importKeys.has(key)){duplicate++;continue;}
    importKeys.add(key);
    local.push({...describeFile(file,collection),id:`local-${++uid}`,src:URL.createObjectURL(file),key});added++;
  }
  if(added) {state.topic=collection;state.format='all';state.horse='';shown=24;}
  const messages=[];
  if(added)messages.push(`${added} ${added===1?'file':'files'} added to your local preview.`);
  if(unsupported)messages.push(`${unsupported} unsupported ${unsupported===1?'file was':'files were'} skipped. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM or MOV; convert HEIC photos to JPG first.`);
  if(duplicate)messages.push(`${duplicate} already-added ${duplicate===1?'file was':'files were'} skipped.`);
  if(!files.length)messages.push('No files selected.');
  $('import-feedback').textContent=messages.join(' ');refreshContent();
}
for(const id of ['file-input','folder-input']) $(id).addEventListener('change',event=>{importFiles([...event.target.files]);event.target.value='';});
$('clear-local').addEventListener('click',()=>{
  if(viewer.open)closeViewer();
  for(const item of local)URL.revokeObjectURL(item.src);
  local=[];importKeys.clear();state.topic='all';state.format='all';state.horse='';shown=24;
  $('import-feedback').textContent='Local preview cleared.';refreshContent();
});
window.addEventListener('pagehide',event=>{if(!event.persisted)for(const item of local)URL.revokeObjectURL(item.src);});

async function loadHostedContent() {
  try {
    const response=await fetch('./media.json');
    if(!response.ok)throw Error('Media could not be loaded');
    const data=await response.json();
    hosted=Array.isArray(data.media)?data.media.filter(validRecord):[];
    if(typeof data.ownerStory==='string'&&data.ownerStory.trim())$('owner-story').textContent=data.ownerStory;
    if(data.localText&&typeof data.localText.text==='string') {
      $('local-text').textContent=data.localText.text;
      if(typeof data.localText.lang==='string')$('local-text').lang=data.localText.lang;
      $('local-text').hidden=false;
    }
    refreshContent();
  } catch(error) {
    $('import-feedback').textContent='The saved collection is unavailable right now. You can still preview your files here.';
    refreshContent();
  }
}

const context=document.modelContext;
if(context?.registerTool) {
  const lifecycle=new AbortController();
  const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch(error){}};
  register({name:'filter_horse_gallery',title:'Filter horse gallery',description:'Set the gallery collection and media type. Returns the visible records; does not upload or save files.',inputSchema:{type:'object',properties:{topic:{type:'string',enum:TOPICS},format:{type:'string',enum:FORMATS}},required:['topic','format'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||!TOPICS.includes(input.topic)||!FORMATS.includes(input.format)||Object.keys(input).some(key=>!['topic','format'].includes(key)))throw Error('Choose a valid collection and media type.');setFilters({topic:input.topic,format:input.format,horse:''});return {topic:state.topic,format:state.format,count:visible.length,items:visible.map(item=>({id:item.id,title:item.title,type:item.type}))};}});
  register({name:'open_horse_gallery_item',title:'Open gallery item',description:'Open an existing gallery photo or video in the full-screen viewer. Videos do not autoplay.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input||typeof input.id!=='string'||Object.keys(input).some(key=>key!=='id'))throw Error('A gallery item ID is required.');const items=totalMedia(),index=items.findIndex(item=>item.id===input.id);if(index<0)throw Error('This item is not in the collection.');openViewer(items,index,$('gallery'));return {id:items[index].id,type:items[index].type,viewer:'open'};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
refreshContent();loadHostedContent();
