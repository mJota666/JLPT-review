import { strokes } from './kanji-data/strokes.js';

const readingTypes = {
  on: 'Onyomi',
  kun: 'Kunyomi',
  special: 'Cách đọc đặc biệt'
};

const roles = {
  topic: 'Chủ đề',
  subject: 'Chủ ngữ',
  object: 'Tân ngữ',
  predicate: 'Vị ngữ',
  time: 'Thời gian',
  place: 'Nơi chốn / vị trí',
  partner: 'Người cùng tham gia',
  target: 'Đối tượng'
};

const isText = value => typeof value === 'string' && value.trim().length > 0;
const hasTexts = (row, length) => Array.isArray(row) && row.length === length && row.every(isText);
const isKana = value => isText(value) && /^[\p{Script=Hiragana}ー、。・！？\s]+$/u.test(value);

export function validateLesson(lesson) {
  if (!isText(lesson?.title) || !/^N[1-5]$/.test(lesson.level) || lesson.kanji?.length !== 8 ||
      !Array.isArray(lesson.kanji) || !Array.isArray(lesson.flashcards) || !Array.isArray(lesson.sentences)) {
    throw new Error('Bài học cần tiêu đề, cấp độ, 8 Kanji và hai phần luyện tập.');
  }

  const words = new Map();
  const glyphs = new Set();
  for (const entry of lesson.kanji) {
    if (!entry || !/^\p{Script=Han}$/u.test(entry.glyph) || glyphs.has(entry.glyph) ||
        ![entry.han, entry.kun, entry.on, entry.meaning].every(isText) ||
        !Array.isArray(entry.vocab) || entry.vocab.length === 0) {
      throw new Error('Mục Kanji trùng hoặc thiếu thông tin.');
    }

    glyphs.add(entry.glyph);
    const localWords = new Set();
    for (const row of entry.vocab) {
      if (!hasTexts(row, 4)) throw new Error(`Từ vựng của ${entry.glyph} thiếu thông tin.`);
      const [type, word, kana, meaning] = row;
      const previous = words.get(word);
      if (!Object.hasOwn(readingTypes, type) || !word.includes(entry.glyph) || !isKana(kana) ||
          localWords.has(word) || (previous && (previous[2] !== kana || previous[3] !== meaning))) {
        throw new Error(`Kiểm tra loại âm, cách đọc hoặc nghĩa của ${word}.`);
      }
      localWords.add(word);
      words.set(word, row);
    }
  }

  if (!lesson.flashcards.length || new Set(lesson.flashcards).size !== lesson.flashcards.length ||
      !lesson.flashcards.every(word => words.has(word))) {
    throw new Error('Thẻ luyện tập phải dùng từ đã học và không được trùng.');
  }
  if (!lesson.sentences.length || !lesson.sentences.every(row =>
    Array.isArray(row) && row.length === 3 && isKana(row[0]) && isText(row[1]) &&
    Array.isArray(row[2]) && row[2].length > 0 &&
    row[2].every(part => hasTexts(part, 2) && Object.hasOwn(roles, part[0])) &&
    row[2].some(([role]) => role === 'predicate') &&
    [...glyphs].some(glyph => row[2].some(([, text]) => text.includes(glyph)))
  )) {
    throw new Error('Kiểm tra câu đọc, cách đọc hiragana và nhãn thành phần câu.');
  }
  return words;
}

function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  element.append(...children);
  return element;
}

const jp = (tag, text, className) => el(tag, { lang: 'ja', class: className }, text);
const step = (tag, className, ...children) => el(tag, { 'data-step': '', class: className }, ...children);
const jump = (number, ...children) => el('a', { href: `#${number}` }, ...children);
const windowFrame = (label, ...children) => el('div', { class: 'lesson-window' },
  el('div', { class: 'window-bar' }, label), el('div', { class: 'window-body' }, ...children));
const slide = (...children) => {
  const section = el('section', { class: 'slide' }, ...children);
  section.hidden = true;
  return section;
};
const heading = text => el('h2', {}, text);

function writingTutorial(glyph) {
  const code = glyph.codePointAt(0).toString(16).padStart(5, '0');
  const rows = strokes[code];
  if (!rows) return null;

  function graphic(tag, attrs) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  }

  const board = graphic('svg', { class: 'stroke-board', viewBox: '0 0 109 109', 'aria-hidden': 'true' });
  const paths = rows.map(([d]) => graphic('path', { d, pathLength: '1', class: 'stroke-ink' }));
  const numbers = rows.map(([, x, y], index) => {
    const number = graphic('text', { x, y, class: 'stroke-number' });
    number.textContent = index + 1;
    return number;
  });
  board.append(...rows.map(([d]) => graphic('path', { d, class: 'stroke-guide' })), ...paths, ...numbers);

  const back = el('button', { type: 'button', class: 'nav-btn' }, 'Nét trước');
  const next = el('button', { type: 'button', class: 'nav-btn' }, 'Nét tiếp');
  const reset = el('button', { type: 'button', class: 'nav-btn' }, 'Bắt đầu lại');
  const status = el('output', { class: 'stroke-status' });
  let count = 0;

  function showStrokes(index, animate = false) {
    if (index < 0 || index > rows.length) return;
    count = index;
    for (let i = 0; i < paths.length; i++) {
      paths[i].classList.toggle('is-written', i < count);
      paths[i].classList.toggle('is-current', i === count - 1);
      paths[i].classList.toggle('is-drawing', animate && i === count - 1);
      numbers[i].classList.toggle('is-current', i === count - 1);
    }
    back.setAttribute('aria-disabled', String(count === 0));
    next.setAttribute('aria-disabled', String(count === rows.length));
    status.textContent = `Nét ${count}/${rows.length}`;
  }

  back.addEventListener('click', () => showStrokes(count - 1));
  next.addEventListener('click', () => showStrokes(count + 1, true));
  reset.addEventListener('click', () => showStrokes(0));
  showStrokes(0);
  return el('div', { class: 'writing-tutorial' },
    board,
    status,
    el('div', { class: 'stroke-controls' }, back, next, reset),
    el('p', { class: 'stroke-credit' },
      'Nét viết phỏng theo ',
      el('a', { href: 'https://kanjivg.tagaini.net/' }, 'KanjiVG (Ulrich Apel)'),
      ' · ',
      el('a', { href: 'https://creativecommons.org/licenses/by-sa/3.0/' }, 'CC BY-SA 3.0')));
}

function vocabulary(entry, types) {
  const table = el('table', { class: 'vocab-table' },
    el('thead', {}, el('tr', {}, ...['Từ vựng', 'Hiragana', 'Nghĩa tiếng Việt'].map(
      label => el('th', { scope: 'col' }, label)))));
  for (const type of types) {
    const rows = entry.vocab.filter(([kind]) => kind === type);
    if (!rows.length) continue;
    table.append(el('tbody', { class: `vocab-${type}` },
      el('tr', { 'data-step': '' }, el('th', { scope: 'rowgroup', colspan: '3' }, readingTypes[type])),
      ...rows.map(([, word, kana, meaning]) => el('tr', { 'data-step': '' },
        el('td', { lang: 'ja', class: 'vocab-word' }, ...Array.from(word, character =>
          character === entry.glyph ? el('mark', {}, character) : character)),
        jp('td', kana, 'vocab-kana'), el('td', {}, meaning)))));
  }
  const total = entry.vocab.filter(([type]) => types.includes(type)).length;
  return slide(windowFrame('Từ vựng',
    el('div', { class: 'vocab-study' },
      el('div', { class: 'vocab-heading' },
        jp('span', entry.glyph, 'vocab-glyph'),
        el('div', {}, heading(entry.han), el('span', {}, `${total} từ vựng`))),
      table)));
}

function reading(value) {
  const sounds = value.split('、');
  return el('dd', { lang: 'ja', class: 'reading-value' }, ...sounds.map((sound, index) =>
    el('span', {}, sound + (index < sounds.length - 1 ? '、' : ''))));
}

function characterDetails(entry, slideNumber) {
  const readings = el('dl', { class: 'reading-grid' },
    step('div', 'reading-kun', el('dt', {}, 'Kunyomi'), reading(entry.kun)),
    step('div', 'reading-on', el('dt', {}, 'Onyomi'), reading(entry.on)),
    step('div', 'reading-meaning', el('dt', {}, 'Nghĩa'), el('dd', {}, entry.meaning)));
  const writing = writingTutorial(entry.glyph);
  if (!writing) return readings;

  readings.id = `kanji-readings-${slideNumber}`;
  writing.id = `kanji-writing-${slideNumber}`;
  const readingButton = el('button', { type: 'button', 'aria-controls': readings.id }, 'Âm đọc và nghĩa');
  const writingButton = el('button', { type: 'button', 'aria-controls': writing.id }, 'Cách viết');

  function showWriting(enabled) {
    if (!enabled && writing.contains(document.activeElement)) readingButton.focus({ preventScroll: true });
    readings.inert = enabled;
    writing.inert = !enabled;
    readingButton.setAttribute('aria-pressed', String(!enabled));
    writingButton.setAttribute('aria-pressed', String(enabled));
  }

  readingButton.addEventListener('click', () => showWriting(false));
  writingButton.addEventListener('click', () => showWriting(true));
  readings.addEventListener('stepreveal', () => showWriting(false));
  showWriting(false);
  return el('div', { class: 'character-details' },
    el('div', { class: 'character-modes', role: 'group', 'aria-label': 'Nội dung Kanji' }, readingButton, writingButton),
    el('div', { class: 'character-views' }, readings, writing));
}

function renderLesson(lesson, words) {
  const slides = [];
  const targets = [];
  for (const entry of lesson.kanji) {
    const slideNumber = slides.length + 2;
    const character = el('div', { class: 'character-panel' },
      el('div', { class: 'character-grid' }, jp('h2', entry.glyph, 'kanji-glyph')),
      el('p', { class: 'han-reading' }, el('span', {}, 'Hán Việt'), entry.han));
    const study = el('div', { class: 'character-study' }, character, characterDetails(entry, slideNumber));
    targets.push(slideNumber);
    slides.push(slide(windowFrame(lesson.title, study)));
    if (entry.vocab.some(([type]) => type === 'on')) slides.push(vocabulary(entry, ['on']));
    if (entry.vocab.some(([type]) => type !== 'on')) slides.push(vocabulary(entry, ['kun', 'special']));
  }

  const practiceStart = slides.length + 2;
  slides.push(slide(windowFrame('Tự kiểm tra', heading('Luyện tập'),
    jp('p', '練習（れんしゅう）', 'practice-title'),
    el('p', {}, 'Đọc từ hoặc câu trước, rồi bấm Tiếp để hiện đáp án.'),
    el('p', { class: 'practice-links' }, jump(practiceStart + 1, 'Thẻ từ'),
      jump(practiceStart + 1 + lesson.flashcards.length, 'Luyện đọc câu')))));

  for (const word of lesson.flashcards) {
    const [, , kana, meaning] = words.get(word);
    slides.push(slide(windowFrame('Thẻ từ',
      jp('h2', word, 'practice-title'),
      step('div', 'practice-answer', jp('p', kana, 'answer-kana'), el('p', {}, meaning)))));
  }

  for (const [kana, meaning, parts] of lesson.sentences) {
    const sentence = parts.map(([, text]) => text).join('');
    slides.push(slide(windowFrame('Luyện đọc câu',
      jp('h2', sentence, 'sentential-prompt'),
      step('div', 'practice-answer', jp('p', kana, 'answer-kana'), el('p', {}, meaning)),
      step('div', 'annotated reading-breakdown', ...parts.map(([role, text]) =>
        el('span', { class: `part part-${role}` },
          jp('span', text, 'segment-jp'), el('span', { class: 'part-label' }, roles[role])))))));
  }

  return [slide(windowFrame(`JLPT ${lesson.level} · Kanji`, el('h1', {}, lesson.title),
    el('p', {}, 'Chọn chữ để bắt đầu, hoặc bấm Tiếp để học theo thứ tự.'),
    el('ul', { class: 'kanji-folders' }, ...lesson.kanji.map((entry, index) =>
      el('li', {}, jump(targets[index], jp('span', entry.glyph, 'folder-glyph'), el('span', {}, entry.han))))),
    el('p', { class: 'practice-links' }, jump(practiceStart, 'Đến phần luyện tập')))), ...slides];
}

async function start() {
  const status = document.querySelector('#loading');
  try {
    const id = new URLSearchParams(location.search).get('lesson') ?? '06a';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Mã bài học không hợp lệ.');
    const response = await fetch(new URL(`./kanji-data/${id}.json`, import.meta.url));
    if (!response.ok) throw new Error('Không tìm thấy bài học.');
    const lesson = await response.json();
    const slides = renderLesson(lesson, validateLesson(lesson));
    document.title = `${lesson.title} · JLPT Review`;
    document.querySelector('#lesson-title').textContent = `${lesson.title} · ${lesson.level}`;
    document.querySelector('#deck').replaceChildren(...slides);
    await import('../player.js');
    document.querySelector('.controls').hidden = false;
  } catch (error) {
    status.textContent = 'Không tải được bài học. Hãy tải lại trang hoặc quay về thư viện.';
    document.querySelector('#deck').replaceChildren(status);
    console.error(error);
  }
}

if (typeof document !== 'undefined') start();
