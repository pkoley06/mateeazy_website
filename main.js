// MateEazy landing page: mobile menu, app tour videos, match-score demo.

(() => {
  /* ---------- mobile menu ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- app tour: short app clips (demo data) in the phone ----------
     Plays each feature's clip in turn. Once someone picks a feature, that
     clip loops instead of moving on. Pauses when the phone is off screen.
     With reduced motion nothing plays until the play button is pressed. */
  const tourTabs = [...document.querySelectorAll('.tour-list [role="tab"]')];
  const tourList = document.querySelector('.tour-list');
  const stage = document.getElementById('tour-stage');
  const video = document.getElementById('tour-video');
  const still = document.getElementById('tour-still');
  const playBtn = document.getElementById('play-toggle');
  const stepSets = document.querySelectorAll('.steps-set');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STILL_MS = 6000; // how long a feature without a clip stays up

  let current = 0;
  let autoAdvance = !reduceMotion;
  let userPaused = reduceMotion;
  let inView = false;
  let stillStart = 0;
  let stillElapsed = 0;
  let stillRaf = 0;

  const progressOf = (i) => tourTabs[i].querySelector('.prog');
  const setProgress = (i, p) => progressOf(i).style.setProperty('--p', Math.min(1, Math.max(0, p)));

  function syncPlayButton() {
    const paused = video.paused;
    playBtn.classList.toggle('paused', paused);
    playBtn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
  }

  function tryPlay() {
    if (userPaused || !inView || video.hidden) return;
    video.play().catch(() => syncPlayButton());
  }

  function stopStillTimer() {
    cancelAnimationFrame(stillRaf);
    stillElapsed += stillStart ? performance.now() - stillStart : 0;
    stillStart = 0;
  }

  function runStillTimer() {
    if (!autoAdvance || !inView || still.hidden) return;
    stillStart = performance.now();
    const tick = (now) => {
      const p = (stillElapsed + now - stillStart) / STILL_MS;
      setProgress(current, p);
      if (p >= 1) { stillElapsed = 0; stillStart = 0; select(current + 1); return; }
      stillRaf = requestAnimationFrame(tick);
    };
    stillRaf = requestAnimationFrame(tick);
  }

  function keepChipVisible(tab) {
    // Horizontal chip row on small screens: scroll the row only, never the page.
    if (tourList.scrollWidth <= tourList.clientWidth) return;
    const left = tab.offsetLeft - (tourList.clientWidth - tab.offsetWidth) / 2;
    tourList.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function select(index, { byUser = false, focus = false } = {}) {
    current = (index + tourTabs.length) % tourTabs.length;
    if (byUser) autoAdvance = false;
    stopStillTimer();
    stillElapsed = 0;

    const tab = tourTabs[current];
    tourTabs.forEach((t, i) => {
      const on = i === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      setProgress(i, 0);
    });
    stage.setAttribute('aria-labelledby', tab.id);
    stepSets.forEach((s) => { s.hidden = s.dataset.for !== tab.dataset.key; });
    if (focus) tab.focus();
    keepChipVisible(tab);

    if (tab.dataset.video) {
      still.hidden = true;
      video.hidden = false;
      playBtn.hidden = false;
      if (!video.src.endsWith(tab.dataset.video)) {
        video.poster = tab.dataset.poster;
        video.src = tab.dataset.video;
      }
      video.currentTime = 0;
      tryPlay();
      syncPlayButton();
    } else {
      video.pause();
      video.hidden = true;
      playBtn.hidden = true;
      still.src = tab.dataset.poster;
      still.hidden = false;
      runStillTimer();
    }
  }

  video.addEventListener('timeupdate', () => {
    if (video.duration) setProgress(current, video.currentTime / video.duration);
  });
  video.addEventListener('ended', () => {
    if (autoAdvance) select(current + 1);
    else { video.currentTime = 0; tryPlay(); }
  });
  video.addEventListener('play', syncPlayButton);
  video.addEventListener('pause', syncPlayButton);

  playBtn.addEventListener('click', () => {
    if (video.paused) { userPaused = false; inView = true; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });

  tourTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { byUser: true }));
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) { e.preventDefault(); select(i + keys[e.key], { byUser: true, focus: true }); }
      if (e.key === 'Home') { e.preventDefault(); select(0, { byUser: true, focus: true }); }
      if (e.key === 'End') { e.preventDefault(); select(tourTabs.length - 1, { byUser: true, focus: true }); }
    });
  });

  document.querySelectorAll('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = tourTabs.findIndex((t) => t.dataset.key === btn.dataset.jump);
      if (i < 0) return;
      select(i, { byUser: true });
      if (window.matchMedia('(max-width: 700px)').matches) {
        stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) { tryPlay(); runStillTimer(); }
    else { if (!video.paused) video.pause(); stopStillTimer(); }
  }, { threshold: 0.35 }).observe(stage);

  syncPlayButton();

  /* ---------- match score ----------
     Same weights and scores as the backend's MatchingHeuristicEngine. */
  const W = { clean: 2.0, sleep: 1.5, guest: 1.2, diet: 1.0 };
  const MAX = W.clean + W.sleep + W.guest + W.diet; // 5.7
  const SCORE = {
    clean: { VERY_CLEAN: 1, MODERATE: 0.5, RELAXED: 0 },
    sleep: { EARLY_BIRD: 1, FLEXIBLE: 0.5, NIGHT_OWL: 0 },
    guest: { FREQUENT: 1, OCCASIONAL: 0.5, NEVER: 0 },
    diet: { VEGAN: 1, VEGETARIAN: 0.8, EGGETARIAN: 0.6, NO_PREFERENCE: 0.4, NON_VEGETARIAN: 0 },
  };
  const PRIYA = { sleep: 'EARLY_BIRD', clean: 'VERY_CLEAN', guest: 'OCCASIONAL', diet: 'VEGETARIAN', smoke: 'NON_SMOKER' };

  const SAME = {
    sleep: { EARLY_BIRD: 'Both early birds', FLEXIBLE: 'Similar sleep rhythm', NIGHT_OWL: 'Both night owls' },
    clean: { VERY_CLEAN: 'Both very tidy', MODERATE: 'Similarly tidy', RELAXED: 'Both easygoing about mess' },
    guest: { NEVER: 'Both like a quiet home', OCCASIONAL: 'Similar guest habits', FREQUENT: 'Both love hosting' },
    diet: { VEGAN: 'Both vegan', VEGETARIAN: 'Both vegetarian', EGGETARIAN: 'Both eggetarian', NON_VEGETARIAN: 'Both non-veg', NO_PREFERENCE: 'Easygoing about food' },
  };

  const form = document.getElementById('quiz');
  const dial = document.getElementById('dial');
  const pctEl = document.getElementById('pct');
  const verdict = document.getElementById('verdict');
  const list = document.getElementById('highlights');
  let shown = 0;
  let raf = 0;

  function evaluate(me, them) {
    const dealbreaker =
      (me.smoke === 'NON_SMOKER' && them.smoke === 'REGULAR_SMOKER') ||
      (them.smoke === 'NON_SMOKER' && me.smoke === 'REGULAR_SMOKER');
    if (dealbreaker) return { pct: 0, highlights: [], dealbreaker: true };

    let d = 0;
    for (const k of Object.keys(W)) d += W[k] * Math.abs(SCORE[k][me[k]] - SCORE[k][them[k]]);
    const pct = Math.max(0, Math.round(100 - (d / MAX) * 100));

    const highlights = [];
    if (me.smoke === 'NON_SMOKER' && them.smoke === 'NON_SMOKER') highlights.push('Both non-smokers');
    for (const k of ['sleep', 'clean', 'guest', 'diet']) {
      if (me[k] === them[k]) highlights.push(SAME[k][me[k]]);
    }
    return { pct, highlights, dealbreaker: false };
  }

  function animateTo(target) {
    cancelAnimationFrame(raf);
    if (reduceMotion) { shown = target; pctEl.textContent = target; return; }
    const from = shown;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      shown = Math.round(from + (target - from) * eased);
      pctEl.textContent = shown;
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function update() {
    const data = Object.fromEntries(new FormData(form));
    const r = evaluate(data, PRIYA);

    dial.style.setProperty('--p', r.pct);
    dial.classList.toggle('great', r.pct >= 80);
    dial.classList.toggle('good', r.pct >= 60 && r.pct < 80);
    animateTo(r.pct);

    verdict.textContent = r.dealbreaker
      ? 'Not a match: smoking is a dealbreaker'
      : r.pct >= 80 ? 'You two would get along well'
      : r.pct >= 60 ? 'A good match, worth a chat'
      : r.pct >= 40 ? 'Some differences to talk about'
      : 'Very different routines';

    list.replaceChildren(...(r.dealbreaker
      ? [Object.assign(document.createElement('li'), { className: 'bad', textContent: 'She doesn’t smoke, you smoke regularly' })]
      : r.highlights.map((h) => Object.assign(document.createElement('li'), { textContent: h }))));
  }

  form.addEventListener('change', update);
  update();

  /* ---------- footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
