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
        jp('td', word, 'vocab-word'), jp('td', kana, 'vocab-kana'), el('td', {}, meaning)))));
  }
  return slide(windowFrame(`Từ vựng · ${entry.han}`, heading(entry.glyph), table));
}

function renderLesson(lesson, words) {
  const slides = [];
  const targets = [];
  for (const entry of lesson.kanji) {
    targets.push(slides.length + 2);
    slides.push(slide(windowFrame(lesson.title,
      el('h2', { class: 'kanji-glyph', lang: 'ja' }, entry.glyph),
      el('p', { class: 'han-reading' }, entry.han),
      el('dl', { class: 'reading-grid' },
        step('div', 'reading-kun', el('dt', {}, 'Kunyomi'), jp('dd', entry.kun, 'reading-value')),
        step('div', 'reading-on', el('dt', {}, 'Onyomi'), jp('dd', entry.on, 'reading-value')),
        step('div', 'reading-meaning', el('dt', {}, 'Nghĩa'), el('dd', {}, entry.meaning))))));
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
