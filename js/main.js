gsap.registerPlugin(ScrollTrigger);

// ─── I18N STATE ───
window.currentLang = 'es';
let terminalTL = null;

// ─── I18N INIT ───
function initI18n() {
  const htmlLang = document.documentElement.lang || 'es';
  window.currentLang = htmlLang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === window.currentLang);
  });

  applyTranslations(window.currentLang);
}

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = window.i18nData?.[lang]?.[key];
    if (!val) return;
    // Use innerHTML for text containers, textContent for form elements
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.innerHTML = val;
    }
  });
}

window.changeLanguage = function (lang) {
  if (lang === window.currentLang) return;
  window.currentLang = lang;

  document.documentElement.lang = lang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Kill ALL GSAP instances and clear inline styles before touching DOM
  ScrollTrigger.getAll().forEach(st => st.kill());
  gsap.killTweensOf('*');
  if (heroSplit) { heroSplit.revert(); heroSplit = null; }
  if (heroDescSplit) { heroDescSplit.revert(); heroDescSplit = null; }
  if (terminalTL) { terminalTL.kill(); terminalTL = null; }

  // Clear GSAP inline styles from all known animated elements so they return to CSS state
  gsap.set([
    '.about__figure', '.contact__field', '.contact__submit',
    '.section__title .char', '.section-desc .reveal-line', '.section-desc .reveal-word',
    '.about__text .reveal-line', '.about__text .reveal-word',
    '.card__meta .reveal-line', '.card__meta .reveal-word',
    '.card__header', '.hero__title-inner .char', '.hero__desc .reveal-word', '.hero__sub',
    '.stack__card', '.project-card',
  ], { clearProps: 'all' });

  // Apply translations (clean innerHTML with highlight spans intact)
  applyTranslations(lang);

  // Re-render project cards with translated descriptions
  if (typeof window.reloadProjectCards === 'function') {
    window.reloadProjectCards();
  }

  // Re-init terminal
  initTerminalTypewriter();

  // Re-split titles (preserving highlights)
  document.querySelectorAll('.section__title').forEach(el => {
    if (typeof SplitText !== 'undefined') {
      try { new SplitText(el, { type: 'chars', charsClass: 'char' }); return; } catch (e) { }
    }
    splitChars(el);
  });

  // Re-split descs, about texts, card metas
  document.querySelectorAll('.section-desc, .about__text, .card__meta').forEach(el => {
    delete el.dataset.rawText;
    if (typeof SplitText !== 'undefined') {
      try { new SplitText(el, { type: 'lines', linesClass: 'reveal-line' }); return; } catch (e) { }
    }
    splitLines(el);
  });

  // Re-init hero title chars
  const heroTitle = document.querySelector('.hero__title-inner');
  if (heroTitle) {
    if (typeof SplitText !== 'undefined') {
      try { heroSplit = new SplitText(heroTitle, { type: 'chars', charsClass: 'char' }); } catch (e) { splitChars(heroTitle); }
    } else { splitChars(heroTitle); }
  }

  // Re-split hero desc words
  const heroDesc = document.querySelector('.hero__desc');
  if (heroDesc) {
    if (typeof SplitText !== 'undefined') {
      try { heroDescSplit = new SplitText(heroDesc, { type: 'words', wordsClass: 'reveal-word' }); } catch (e) { splitWords(heroDesc); }
    } else { splitWords(heroDesc); }
  }

  // Make all reveal elements immediately visible (they'll get animated on scroll)
  gsap.set('.section__title .char, .hero__title-inner .char', { opacity: 1, clipPath: 'inset(0 0 0 0)', yPercent: 0, clearProps: 'transform' });
  gsap.set('.section-desc .reveal-line, .section-desc .reveal-word, .about__text .reveal-line, .about__text .reveal-word, .card__meta .reveal-line, .card__meta .reveal-word', { opacity: 1, rotationX: 0, clearProps: 'transform' });
  gsap.set('.hero__desc .reveal-word', { opacity: 1, rotationX: 0, clearProps: 'transform' });
  gsap.set('.card__header, .hero__sub', { opacity: 1, y: 0, clearProps: 'transform' });
  gsap.set('.about__figure', { opacity: 1 });
  gsap.set('.contact__field, .contact__submit', { opacity: 1, y: 0 });

  // Re-init project cards reveal
  if (typeof window.animateProjectCards === 'function') {
    window.animateProjectCards();
  }

  // Re-init section reveal animations for future scroll interactions
  initSectionReveals();
  initSectionTextReveals();

  // Refresh ScrollTrigger
  ScrollTrigger.refresh();
};

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initIntroAnimation();
  initNavigation();
  initTerminalTypewriter();
  initProjectExpand();
  initHeaderScroll();
  initStackInteractions();
  initProjectReveal();
  initSectionReveals();
  initSectionTextReveals();
  initContactForm();
});

let heroSplit;
let heroDescSplit;

function initIntroAnimation() {
  const isMobile = window.innerWidth <= 768;

  const heroTitle = document.querySelector('.hero__title-inner');
  if (heroTitle && typeof SplitText !== 'undefined') {
    try {
      heroSplit = new SplitText(heroTitle, { type: 'chars' });
    } catch (e) {
      splitChars(heroTitle);
    }
  } else if (heroTitle) {
    splitChars(heroTitle);
  }
  document.querySelectorAll('.section__title').forEach(el => splitChars(el));
  document.querySelectorAll('.section-desc, .about__text, .card__meta').forEach(el => {
    if (typeof SplitText !== 'undefined') {
      try {
        new SplitText(el, { type: 'lines', linesClass: 'reveal-line' });
        return;
      } catch (e) { }
    }
    splitLines(el);
  });
  const heroDesc = document.querySelector('.hero__desc');
  if (heroDesc && typeof SplitText !== 'undefined') {
    try {
      heroDescSplit = new SplitText(heroDesc, { type: 'words' });
    } catch (e) {
      splitWords(heroDesc);
    }
  } else if (heroDesc) {
    splitWords(heroDesc);
  }

  // ─── CURTAIN ENTRANCE ───
  const tl = gsap.timeline();

  // Step 1: Curtain images slide in from off-screen
  tl.fromTo('.curtain__img--left',
    { xPercent: -100, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 1.5, ease: 'bounce.out' }
  )
    .fromTo('.curtain__img--right',
      { xPercent: 100, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 1.5, ease: 'bounce.out' },
      '<'
    )
    // Step 2: Panels slide away to reveal page
    .to('.curtain__panel--left',
      { xPercent: -100, duration: 1.8, ease: 'expo.inOut', delay: 1.0 }
    )
    .to('.curtain__panel--right',
      { xPercent: 100, duration: 1.8, ease: 'expo.inOut' },
      '<'
    )
    .set('#curtain', { display: 'none' })
    .set('body', { overflow: 'auto' });

  // Step 3: Header + hero entrance (start slightly after curtain begins opening)
  animateHeader(tl, '>-1.4');
  buildPageEntrance(tl, '>-0.15');
}

function animateHeader(tl, startAt = '>-0.2') {
  const isDesktop = window.innerWidth >= 768;

  if (isDesktop) {
    const allItems = document.querySelectorAll('.logo, .nav__links > li, .nav__lang .lang-btn');
    if (allItems.length) {
      tl.from(allItems, {
        y: -15, opacity: 0, duration: 0.4, stagger: 0.2, ease: 'power2.out',
      }, startAt);
    }
  } else {
    const toggle = document.querySelector('.nav__toggle');
    if (toggle && getComputedStyle(toggle).display !== 'none') {
      const items = document.querySelectorAll('.logo, .nav__toggle');
      tl.from(items, {
        y: -12, opacity: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out',
      }, startAt);
    }
  }
}

function buildPageEntrance(tl, startOffset) {
  const hook = startOffset !== undefined ? startOffset : '>-0.15';

  const heroChars = heroSplit?.chars?.length
    ? heroSplit.chars
    : document.querySelectorAll('.hero__title-inner .char');

  if (heroChars.length) {
    gsap.set(heroChars, { clipPath: 'inset(0 0 100% 0)', opacity: 0, yPercent: 100 });
    tl.to(heroChars, {
      clipPath: 'inset(0% 0 0% 0)', opacity: 1, yPercent: 0,
      duration: 0.7, ease: 'power2.out',
      stagger: { each: 0.1, from: 'start' },
    }, hook);
  }

  tl.from('.hero__sub', { y: 25, opacity: 0, duration: 0.5, ease: 'power2.out' }, '>-0.15');

  const heroPhrases = heroDescSplit?.words?.length
    ? heroDescSplit.words
    : document.querySelectorAll('.hero__desc .reveal-word');
  if (heroPhrases?.length) {
    gsap.set(heroPhrases, {
      opacity: 0, rotationX: -100,
      transformOrigin: 'left center'
    });
    tl.to(heroPhrases, {
      duration: 1.4,
      opacity: 1,
      rotationX: 0,
      ease: 'power3.out',
      stagger: { each: 0.08, from: 'start' },
    }, '>-0.1');
  }

  tl.from('.hero__ctas .cta', { y: 15, opacity: 0, duration: 0.5, stagger: 0.2, ease: 'power2.out' }, '>-0.5');

}

function initProjectReveal() {
  const grid = document.getElementById('gridProjects');
  if (!grid) return;

  function setupCardsAnimation(cards) {
    gsap.set(cards, { opacity: 0, rotateY: -90, transformOrigin: 'left center', scale: 0.9, xPercent: -20 });

    const pagBtns = document.querySelectorAll('.pagination__btn');
    if (pagBtns.length) {
      gsap.set(pagBtns, { opacity: 0, y: 10 });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#projects',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    tl.to(cards, {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      xPercent: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power2.out',
      clearProps: 'transform',
    });

    if (pagBtns.length) {
      tl.to(pagBtns, {
        opacity: 1, y: 0, stagger: 0.07, duration: 0.4, ease: 'power2.out',
      }, 0.3);
    }

    ScrollTrigger.refresh();
  }

  const existingCards = grid.querySelectorAll('.project-card');
  if (existingCards.length) {
    setupCardsAnimation(existingCards);
  } else {
    const obs = new MutationObserver(() => {
      const cards = grid.querySelectorAll('.project-card');
      if (!cards.length) return;
      obs.disconnect();
      setupCardsAnimation(cards);
    });
    obs.observe(grid, { childList: true });
  }
}

window.animateProjectCards = function () {
  const cards = document.querySelectorAll('#gridProjects .project-card');
  if (!cards.length) return;

  gsap.killTweensOf(cards);
  gsap.set(cards, { opacity: 0, rotateY: -90, transformOrigin: 'left center', scale: 0.9, xPercent: -20 });
  gsap.to(cards, {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    xPercent: 0,
    duration: 1,
    stagger: 0.15,
    ease: 'power2.out',
    clearProps: 'transform',
  });
};

function initSectionReveals() {

  const aboutEls = document.querySelectorAll('.about__figure');
  if (aboutEls.length) {
    gsap.from(aboutEls, {
      opacity: 0,
      duration: 1.2,
      ease: 'power1.out',
      scrollTrigger: {
        trigger: '#about',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }

  const contactEls = document.querySelectorAll('.contact__field, .contact__submit');
  if (contactEls.length) {
    gsap.from(contactEls, {
      opacity: 0, y: 20, stagger: 0.08, duration: 0.5, ease: 'power2.out',
      scrollTrigger: {
        trigger: '#contact',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }
}

function initSectionTextReveals() {
  document.querySelectorAll('.card-section').forEach(section => {
    const isStack = section.id === 'stack';
    const isProjects = section.id === 'projects';
    const isLong = isStack || isProjects;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: isLong ? 'top 70%' : 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    const cardHeader = section.querySelector('.card__header');
    if (cardHeader) tl.from(cardHeader, { opacity: 0, y: -12, duration: 0.3, ease: 'power2.out' }, 0);

    const titleChars = section.querySelectorAll('.section__title .char');
    if (titleChars.length) {
      gsap.set(titleChars, { clipPath: 'inset(0 0 100% 0)', opacity: 0, yPercent: 100 });
      tl.to(titleChars, {
        clipPath: 'inset(0% 0 0% 0)', opacity: 1, yPercent: 0,
        duration: 0.2, ease: 'power2.out',
        stagger: { each: 0.05, from: 'start' },
      }, 0.1);
    }

    let metaWords = section.querySelectorAll('.card__meta .reveal-line');
    if (!metaWords.length) metaWords = section.querySelectorAll('.card__meta .reveal-word');
    if (metaWords.length) {
      gsap.set(metaWords, { opacity: 0, rotationX: 100, transformOrigin: 'left center' });
      tl.to(metaWords, {
        duration: 1.0,
        opacity: 1,
        rotationX: 0,
        ease: 'power3.out',
        stagger: { each: 0.1, from: 'start' },
      }, 0.15);
    }

    let descWords = section.querySelectorAll('.section-desc .reveal-line');
    if (!descWords.length) descWords = section.querySelectorAll('.section-desc .reveal-word');
    if (descWords.length) {
      gsap.set(descWords, { opacity: 0, rotationX: 100, transformOrigin: 'left center' });
      tl.to(descWords, {
        duration: 1.2,
        opacity: 1,
        rotationX: 0,
        ease: 'power3.out',
        stagger: { each: 0.15, from: 'start' },
      }, 0.25);
    }

    let aboutWords = section.querySelectorAll('.about__text .reveal-line');
    if (!aboutWords.length) aboutWords = section.querySelectorAll('.about__text .reveal-word');
    if (aboutWords.length) {
      gsap.set(aboutWords, { opacity: 0, rotationX: 100, transformOrigin: 'left center' });
      tl.to(aboutWords, {
        duration: 1.2,
        opacity: 1,
        rotationX: 0,
        ease: 'power3.out',
        stagger: { each: 0.12, from: 'start' },
      }, 0.25);
    }

    const stackCards = section.querySelectorAll('.stack__card');
    if (stackCards.length) {
      gsap.set(stackCards, { opacity: 0, rotateY: -90, transformOrigin: 'left center', scale: 0.9 });
      tl.to(stackCards, {
        duration: 1.2,
        opacity: 1,
        rotateY: 0,
        scale: 1,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform',
      }, '>-0.2');
    }
  });
}

function initStackInteractions() {
  const cards = document.querySelectorAll('.stack__card');
  if (!cards.length) return;

  cards.forEach(card => {
    const bar = card.querySelector('.stack__bar');
    const pct = card.querySelector('.stack__pct');
    const icon = card.querySelector('.stack__icon');
    const pctValue = card.getAttribute('data-pct');

    const onEnter = () => {
      gsap.to([bar, pct], { opacity: 1, duration: 0.25, overwrite: 'auto' });
      gsap.to(bar, { height: pctValue + '%', duration: 0.7, ease: 'power2.out' });
      gsap.to(pct, { bottom: pctValue + '%', y: '50%', duration: 0.7, ease: 'power2.out' });
      gsap.to(icon, { scale: 1.15, duration: 0.35, ease: 'power2.out', filter: 'drop-shadow(0 0 12px rgba(56,203,248,0.4))' });
    };

    const onLeave = () => {
      gsap.to([bar, pct], { opacity: 0, duration: 0.35, overwrite: 'auto' });
      gsap.to(bar, { height: '0%', duration: 0.45, ease: 'power2.in' });
      gsap.to(pct, { bottom: '0%', y: '0%', duration: 0.45, ease: 'power2.in' });
      gsap.to(icon, { scale: 1, duration: 0.35, ease: 'power2.in', filter: 'drop-shadow(0 0 6px rgba(56,203,248,0.15))' });
    };

    let touchTriggered = false;

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('touchstart', () => { touchTriggered = true; onEnter(); }, { passive: true });
    card.addEventListener('touchend', () => { touchTriggered = false; onLeave(); }, { passive: true });
  });
}

function initContactForm() {
  const form = document.querySelector('.contact__form');
  if (!form) return;

  const statusEl = form.querySelector('.contact__status');
  const submitBtn = form.querySelector('.contact__submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) return;

    const originalText = submitBtn.textContent;
    const sendingText = window.currentLang === 'ca' ? 'Enviant…' : window.currentLang === 'en' ? 'Sending…' : 'Enviando…';
    submitBtn.textContent = sendingText;
    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'contact__status';

    const data = {
      name: form.querySelector('#contact-name').value.trim(),
      email: form.querySelector('#contact-email').value.trim(),
      company: form.querySelector('#contact-company').value.trim(),
      message: form.querySelector('#contact-message').value.trim(),
    };

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
      statusEl.textContent = window.i18nData[window.currentLang]?.['contact.status.ok'] || '✓ Mensaje enviado. Gracias por contactarme.';
      statusEl.className = 'contact__status contact__status--ok';
        form.querySelectorAll('input, textarea').forEach(el => { if (el.type !== 'hidden') el.value = ''; });
      } else {
        const err = await res.json();
        throw new Error(err.error?.message || 'Error del servidor');
      }
    } catch (err) {
      statusEl.textContent = window.i18nData[window.currentLang]?.['contact.status.err'] || '✗ Hubo un error. Escribime directo a paucb.dev@gmail.com';
      statusEl.className = 'contact__status contact__status--err';
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });
}

function splitChars(element) {
  const temp = document.createElement('div');
  temp.innerHTML = element.innerHTML;
  let html = '';

  temp.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      html += node.textContent.split('').map(c =>
        `<span class="char" style="display:inline-block;transform-style:preserve-3d">${c === ' ' ? '&nbsp;' : c}</span>`
      ).join('');
    } else if (node.nodeType === 1) {
      const cls = node.classList.contains('highlight') ? 'char highlight' : 'char';
      html += node.textContent.split('').map(c =>
        `<span class="${cls}" style="display:inline-block;transform-style:preserve-3d">${c === ' ' ? '&nbsp;' : c}</span>`
      ).join('');
    }
  });

  element.innerHTML = html;
}

function splitWords(element, wordClass = 'reveal-word') {
  const temp = document.createElement('div');
  temp.innerHTML = element.innerHTML;
  const words = [];

  temp.childNodes.forEach(node => {
    if (node.nodeType === 3) {
      node.textContent.split(/(\s+)/).forEach(w => {
        if (w.trim()) {
          const span = document.createElement('span');
          span.className = wordClass;
          span.textContent = w;
          words.push(span);
        } else if (w.length > 0) {
          words.push(document.createTextNode(w));
        }
      });
    } else if (node.nodeType === 1) {
      const originalClasses = node.className;
      node.textContent.split(/(\s+)/).forEach(w => {
        if (w.trim()) {
          const span = document.createElement('span');
          span.className = `${wordClass} ${originalClasses}`.trim();
          span.textContent = w;
          words.push(span);
        } else if (w.length > 0) {
          words.push(document.createTextNode(w));
        }
      });
    }
  });

  element.innerHTML = '';
  words.forEach(f => element.appendChild(f));
}

function splitLines(element, lineClass = 'reveal-line') {
  const text = element.dataset.rawText || element.textContent.trim();
  if (!element.dataset.rawText) {
    element.dataset.rawText = text;
  }
  const wordsArray = text.split(/\s+/).filter(w => w.length > 0);
  if (!wordsArray.length) return;

  const isHidden = window.getComputedStyle(element).display === 'none';
  let originalStyles = {};
  if (isHidden) {
    originalStyles = {
      display: element.style.display,
      position: element.style.position,
      visibility: element.style.visibility,
      height: element.style.height,
      overflow: element.style.overflow
    };
    element.style.display = 'block';
    element.style.position = 'relative';
    element.style.visibility = 'hidden';
    element.style.height = '0';
    element.style.overflow = 'hidden';
  }

  element.innerHTML = wordsArray
    .map(w => `<span class="temp-word" style="display:inline-block">${w}</span>`)
    .join(' ');

  const spans = element.querySelectorAll('.temp-word');
  const lines = [];
  let currentLine = [];
  let lastTop = -1;

  spans.forEach(span => {
    const top = span.offsetTop;
    if (lastTop !== -1 && Math.abs(top - lastTop) > 5) {
      lines.push(currentLine.join(' '));
      currentLine = [span.textContent];
    } else {
      currentLine.push(span.textContent);
    }
    lastTop = top;
  });

  if (currentLine.length) {
    lines.push(currentLine.join(' '));
  }

  element.innerHTML = '';
  lines.forEach(lineText => {
    const lineSpan = document.createElement('span');
    lineSpan.className = lineClass;
    lineSpan.style.display = 'block';
    lineSpan.textContent = lineText;
    element.appendChild(lineSpan);
  });

  if (isHidden) {
    for (const key in originalStyles) {
      element.style[key] = originalStyles[key];
    }
  }
}

function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.changeLanguage(btn.dataset.lang);
    });
  });
}

function initNavigation() {
  initLangSwitcher();
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    const nextState = String(!isOpen);
    toggle.setAttribute('aria-expanded', nextState);
    links.setAttribute('aria-expanded', nextState);
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.setAttribute('aria-expanded', 'false');
    });
  });
}

function initProjectExpand() {
  const grid = document.getElementById('gridProjects');
  if (!grid) return;

  let activeInterval = null;

  function getCards() {
    return document.querySelectorAll('.project-card');
  }

  function collapseCard(expandEl, cb) {
    const isDesktop = window.innerWidth >= 1024;
    const card = expandEl?.closest('.project-card');

    if (isDesktop) {
      getCards().forEach(c => {
        c.style.cssText = '';
        c.style.display = '';
      });
    }

    if (expandEl && !isDesktop) {
      gsap.to(expandEl, {
        height: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          card?.classList.remove('is-expanded');
          gsap.set(expandEl, { clearProps: 'height' });
          if (cb) cb();
        }
      });
    } else {
      card?.classList.remove('is-expanded');
      if (cb) cb();
    }

    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      requestAnimationFrame(() => {
        const sectionTop = projectsSection.getBoundingClientRect().top + window.scrollY;
        const offset = 80;
        window.scrollTo({
          top: sectionTop - offset,
          behavior: 'smooth'
        });
      });
    }
  }

  function expandCard(expandEl, card) {
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
      card.style.cssText = 'width: 100% !important; flex: 0 0 auto; order: -1; transition: none !important;';
      card.classList.add('is-expanded');

      const all = Array.from(getCards());
      const idx = all.indexOf(card);
      const distances = all
        .map((c, i) => ({ card: c, dist: Math.abs(i - idx) }))
        .filter((_, i) => i !== idx)
        .sort((a, b) => a.dist - b.dist);
      const keepVisible = [card, ...distances.slice(0, 3).map(d => d.card)];
      all.forEach(c => {
        c.style.display = keepVisible.includes(c) ? '' : 'none';
      });
    } else {
      card.classList.add('is-expanded');
      if (expandEl) {
        gsap.set(expandEl, { height: 0 });
        expandEl.offsetHeight;
        gsap.to(expandEl, {
          height: expandEl.scrollHeight,
          duration: 0.4,
          ease: 'power3.out',
          onComplete: () => gsap.set(expandEl, { height: 'auto' })
        });
      }
    }

    const descEl = card.querySelector('.expand__desc');
    if (descEl) {
      if (typeof SplitText !== 'undefined') {
        try {
          new SplitText(descEl, { type: 'lines', linesClass: 'reveal-line' });
        } catch (e) {
          splitLines(descEl);
        }
      } else if (typeof splitLines === 'function') {
        splitLines(descEl);
      }
    }

    const descLines = card.querySelectorAll('.expand__desc .reveal-line');
    if (descLines.length) {
      gsap.killTweensOf(descLines);
      gsap.set(descLines, { opacity: 0, rotationX: 100, transformOrigin: 'left center' });
      gsap.to(descLines, {
        duration: 1.2,
        opacity: 1,
        rotationX: 0,
        ease: 'power3.out',
        stagger: { each: 0.15, from: 'start' },
        delay: isDesktop ? 0.15 : 0.35
      });
    }
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    if (e.target.closest('a')) return;
    if (e.target.closest('.pagination')) return;

    const isExpanded = card.classList.contains('is-expanded');
    const expandEl = card.querySelector('.project-card__expand');

    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }

    if (isExpanded) {
      collapseCard(expandEl);
      return;
    }

    getCards().forEach(other => {
      if (other.classList.contains('is-expanded')) {
        collapseCard(other.querySelector('.project-card__expand'));
      }
    });

    expandCard(expandEl, card);

    const track = card.querySelector('.carousel__track');
    if (track) {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
    }

    if (track && track.children.length > 4) {
      let step = 0;
      const N = track.children.length / 4;

      requestAnimationFrame(() => {
        activeInterval = setInterval(() => {
          step++;
          track.style.transform = 'translateX(-' + (step * 100) + '%)';
          track.style.transition = 'transform 0.30s ease';

          if (step === N) {
            setTimeout(() => {
              track.style.transition = 'none';
              track.style.transform = 'translateX(0)';
              step = 0;
            }, 300);
          }
        }, 2000);
      });
    }
  });

  document.addEventListener('click', (e) => {
    const expanded = document.querySelector('.project-card.is-expanded');
    if (!expanded) return;
    if (e.target.closest('.project-card')) return;

    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }

    collapseCard(expanded.querySelector('.project-card__expand'));
  });
}

function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;

  const toggle = () => header.classList.toggle('header--scrolled', window.scrollY > 0);
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

function initTerminalTypewriter() {
  const target = document.querySelector('.js-terminal-type');
  if (!target || typeof gsap === 'undefined') return;

  const messages = window.i18nData?.[window.currentLang]?.['terminal.messages'] || [
    'Inicializando perfil: Desarrollador Web Full Stack',
    'Ejecutando animaciones... Especialista en interfaces dinámicas y GSAP.',
    'Analizando arquitectura: Lógica de negocio segura con Symfony y JWT.',
    'Optimizando proceso: Metodología SDD (Spec-Driven Development) activa.',
    'Desplegando soluciones: Integración B2B, B2C, Odoo ERP y rendimiento web.',
    'Estado del sistema: Aprendizaje continuo, resiliencia y eficiencia al 100%.',
    'Variables de entorno cargadas: Código estructurado, buena cocina, cine y fútbol.',
  ];

  if (terminalTL) terminalTL.kill();
  terminalTL = gsap.timeline({ repeat: -1 });

  messages.forEach((msg) => {
    terminalTL.to(target, {
      text: msg,
      duration: 1.8,
      ease: 'none',
      delay: 0.8,
    })
      .to(target, {
        text: '',
        duration: 0.6,
        ease: 'none',
        delay: 2.5,
      });
  });
}
