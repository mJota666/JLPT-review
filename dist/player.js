const deck = document.querySelector('#deck');
const slides = [...deck.querySelectorAll('.slide')];
const steps = slides.map(slide => [...slide.querySelectorAll('[data-step]')]);
const prev = document.querySelector('#prev');
const next = document.querySelector('#next');
const counter = document.querySelector('#counter');
const progress = document.querySelector('#progress');

const offsets = [0];
for (const group of steps) offsets.push(offsets.at(-1) + group.length + 1);
progress.max = offsets.at(-1);

let current = -1;
let revealed = 0;

function show(slideIndex, stepIndex, animate = false) {
  const changedSlide = slideIndex !== current;
  const oldSlide = slides[current];
  const slide = slides[slideIndex];
  const focusWasInSlide = oldSlide?.contains(document.activeElement);
  current = slideIndex;
  revealed = stepIndex;

  slides.forEach((item, index) => { item.hidden = index !== current; });
  steps[current].forEach((step, index) => {
    const pending = index >= revealed;
    step.inert = pending;
    step.classList.toggle('pending', pending);
    step.classList.toggle('step-enter', animate && index === revealed - 1);
  });

  if (changedSlide) {
    deck.scrollTop = 0;
    if (focusWasInSlide) {
      const heading = slide.querySelector('h1, h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  if (animate && revealed > 0) {
    steps[current][revealed - 1].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  counter.textContent = `Slide ${current + 1}/${slides.length} · Ý ${revealed}/${steps[current].length}`;
  progress.value = offsets[current] + revealed + 1;
  prev.disabled = progress.value === 1;
  next.disabled = progress.value === progress.max;

  const hash = `#${current + 1}${revealed > 0 ? `.${revealed}` : ''}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function advance() {
  if (revealed < steps[current].length) {
    show(current, revealed + 1, true);
  } else if (current < slides.length - 1) {
    show(current + 1, 0);
  }
}

function back() {
  if (revealed > 0) {
    const step = steps[current][revealed - 1];
    if (step.contains(document.activeElement)) prev.focus();
    show(current, revealed - 1);
  } else if (current > 0) {
    show(current - 1, steps[current - 1].length);
  }
}

function readLocation() {
  const match = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
  const slide = Math.max(0, Math.min(slides.length - 1, Number(match?.[1] ?? 1) - 1));
  const step = Math.min(steps[slide].length, Number(match?.[2] ?? 0));
  show(slide, step);
}

prev.addEventListener('click', back);
next.addEventListener('click', advance);
window.addEventListener('hashchange', readLocation);

const keys = {
  ArrowRight: advance, PageDown: advance, ' ': advance,
  ArrowLeft: back, PageUp: back,
  Home: () => show(0, 0),
  End: () => show(slides.length - 1, steps.at(-1).length)
};

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (!Object.hasOwn(keys, event.key)) return;
  if (event.key === ' ' && event.target.closest('button, a')) return;
  event.preventDefault();
  keys[event.key]();
});

let touchStart;
deck.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 ? event.touches[0] : null;
}, { passive: true });
deck.addEventListener('touchend', event => {
  if (!touchStart || event.touches.length > 0) return;
  const touch = event.changedTouches[0];
  const x = touch.clientX - touchStart.clientX;
  const y = touch.clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(x) < 56 || Math.abs(x) < Math.abs(y) * 1.5) return;
  if (x < 0) advance();
  else back();
}, { passive: true });

deck.addEventListener('click', event => {
  const selected = event.target.closest('.quiz-option');
  if (!selected) return;
  const quiz = selected.closest('.slide');
  quiz.querySelectorAll('.quiz-option').forEach(option => {
    option.classList.toggle('correct', option === selected && option.hasAttribute('data-correct'));
    option.classList.toggle('wrong', option === selected && !option.hasAttribute('data-correct'));
    option.setAttribute('aria-pressed', String(option === selected));
  });
  quiz.querySelector('.quiz-result').textContent = selected.dataset.feedback;
});

deck.classList.add('step-mode');
readLocation();
