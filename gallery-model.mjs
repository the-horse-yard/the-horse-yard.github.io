export const TOPICS = ['all', 'horses', 'sunday', 'jumping', 'farm'];
export const FORMATS = ['all', 'photo', 'video'];
const PHOTO = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
export function fileType(name) {
  return PHOTO.test(name) ? 'photo' : VIDEO.test(name) ? 'video' : null;
}
export function readable(value) {
  return value.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export function describeFile(file, collection = 'all') {
  const path = file.webkitRelativePath || file.name;
  const parts = path.split('/');
  const dirs = parts.slice(0, -1);
  const clues = path.toLowerCase();
  const horseFolder = dirs.find(p => /^horse[-_ ]/i.test(p));
  let category = TOPICS.includes(collection) ? collection : 'all';
  if (category === 'all') {
    if (/sunday|неділ|воскрес/.test(clues)) category = 'sunday';
    else if (/jump|конкур/.test(clues)) category = 'jumping';
    else if (/horse|кінь|коні|лошад/.test(clues)) category = 'horses';
    else if (/stable|farm|стайн/.test(clues)) category = 'farm';
  }
  return {
    type: fileType(file.name), title: readable(file.name),
    alt: readable(file.name), category,
    horse: horseFolder ? readable(horseFolder.replace(/^horse[-_ ]/i, '')) : null,
    session: (category === 'sunday' || category === 'jumping') ? readable(dirs.at(-1) || (category === 'sunday' ? 'Sunday training' : 'Show jumping')) : null,
    date: null, local: true
  };
}
export function filterMedia(media, state) {
  return media.filter(item =>
    (state.topic === 'all' || item.category === state.topic) &&
    (state.format === 'all' || item.type === state.format) &&
    (!state.horse || item.horse === state.horse)
  );
}
export function adjacentIndex(index, delta, length) {
  return length ? ((index + delta) % length + length) % length : -1;
}
export function validRecord(record) {
  return record && typeof record.id === 'string' && ['photo','video'].includes(record.type)
    && typeof record.src === 'string' && /^(?!\/\/)(?!.*\.\.)(?:\.\/)?[a-z0-9_/ .%-]+\.(jpe?g|png|webp|avif|gif|mp4|webm|mov|m4v)$/i.test(record.src)
    && typeof record.title === 'string' && typeof record.category === 'string' && TOPICS.includes(record.category);
}
