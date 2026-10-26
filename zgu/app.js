(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const all = (s, root = document) => Array.from(root.querySelectorAll(s));
  const modal = $('#donation');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let focused, motion;
  const canAnimate = () => window.gsap && !reduce.matches && !document.body.classList.contains('accessible');
  all('[data-donate]').forEach(button => button.addEventListener('click', () => {
    focused = button;
    modal.showModal();
    document.body.classList.add('modal-open');
    if (canAnimate()) gsap.fromTo(modal, {y: 18, scale: .98, opacity: 0}, {y: 0, scale: 1, opacity: 1, duration: .28, ease: 'power2.out', clearProps: 'transform,opacity', overwrite: true});
  }));
  all('[data-close]').forEach(button => button.addEventListener('click', () => modal.close()));
  modal.addEventListener('click', event => {
    const r = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) modal.close();
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (window.gsap) gsap.set(modal, {clearProps: 'transform,opacity'});
    focused?.focus();
  });
  const menu = $('.menu-toggle'), nav = $('.navigation');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    if (open && canAnimate()) gsap.fromTo(all('a', nav), {y: -8, opacity: 0}, {y: 0, opacity: 1, stagger: .04, duration: .3, clearProps: 'transform,opacity', overwrite: true});
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus();
    }
  });
  const path = location.pathname.replace(/\/$/, '');
  all('.navigation a').forEach(link => {
    if (new URL(link.href).pathname.replace(/\/$/, '') === path) link.setAttribute('aria-current', 'page');
  });
  const access = $('[data-access]');
  access.addEventListener('click', () => {
    const on = document.body.classList.toggle('accessible');
    access.setAttribute('aria-pressed', String(on));
    if (motion) motion.revert();
    if (!on) initMotion();
  });
  const cleanups = [];
  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (motion) motion.revert();
    motion = gsap.matchMedia();
    motion.add({
      desktop: '(min-width: 900px)',
      fine: '(hover: hover) and (pointer: fine)',
      noMotion: '(prefers-reduced-motion: reduce)',
      standard: '(prefers-reduced-motion: no-preference)'
    }, context => {
      if (context.conditions.noMotion || document.body.classList.contains('accessible')) return;
      const {desktop, fine} = context.conditions;
      const listeners = [];
      const listen = (el, name, fn) => {el.addEventListener(name, fn); listeners.push(() => el.removeEventListener(name, fn));};
      const intro = gsap.timeline({defaults: {duration: .85, ease: 'power3.out'}});
      const hero = $('.hero');
      if (hero) {
        intro.from('.hero .eyebrow', {y: 15, opacity: 0}, 0)
          .from('.headline-line', {y: 48, opacity: 0, stagger: .1, clearProps: 'transform,opacity'}, .1)
          .from('.hero-copy > p', {y: 18, opacity: 0, clearProps: 'transform,opacity'}, .45)
          .from('.hero-actions', {y: 15, opacity: 0, clearProps: 'transform,opacity'}, .6)
          .from('.polar-compass', {scale: .9, opacity: 0, duration: 1.2, clearProps: 'transform,opacity'}, .2)
          .from('.hero-caption', {y: 20, opacity: 0, clearProps: 'transform,opacity'}, .85);
        if (desktop) {
          gsap.to('.orbit-outer', {rotation: 40, ease: 'none', scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom top', scrub: .7}});
          gsap.to('.orbit-inner', {rotation: -24, ease: 'none', scrollTrigger: {trigger: hero, start: 'top top', end: 'bottom top', scrub: .7}});
        }
        if (desktop && fine) {
          const emblem = $('.polar-emblem', hero);
          const xTo = gsap.quickTo(emblem, 'x', {duration: .6, ease: 'power3.out'});
          const yTo = gsap.quickTo(emblem, 'y', {duration: .6, ease: 'power3.out'});
          let bounds;
          listen(hero, 'pointerenter', () => {bounds = hero.getBoundingClientRect();});
          listen(hero, 'pointermove', e => {
            if (!bounds) return;
            xTo((e.clientX - bounds.left - bounds.width / 2) * .016);
            yTo((e.clientY - bounds.top - bounds.height / 2) * .016);
          });
          listen(hero, 'pointerleave', () => {xTo(0); yTo(0);});
        }
      } else {
        intro.from('.page-title .eyebrow, .page-title h1', {y: 25, opacity: 0, stagger: .08, clearProps: 'transform,opacity'}, 0);
      }
      const reveal = (targets, trigger, amount = .08) => {
        if (!targets.length) return;
        const tween = gsap.from(targets, {y: 30, opacity: 0, duration: .8, stagger: amount, ease: 'power3.out',
          clearProps: 'transform,opacity', scrollTrigger: {trigger, start: 'top 90%', once: true}});
        targets.forEach(el => listen(el, 'focusin', () => {tween.progress(1);}));
      };
      // Reveal in document order; no content is hidden unless GSAP is ready.
      all('main > section').filter(s => !s.matches('.hero, .page-title')).forEach(section => {
        const heading = all('.section-heading, .mission-grid, .intro-grid, .cta-inner', section);
        heading.forEach(el => reveal([el], el));
        const groups = all('.project-grid, .news-grid, .steps, .contact-grid', section);
        groups.forEach(group => reveal(all(':scope > article', group), group, desktop ? .09 : .04));
        if (section.matches('.community')) reveal(all('.community-inner > div', section), section, .12);
        all('.empty-state, .faq', section).forEach(el => reveal([el], el));
      });
      all('.steps').forEach(steps => {
        const bar = $('.steps-progress', steps);
        if (desktop && bar) gsap.fromTo(bar, {scaleX: 0}, {scaleX: 1, transformOrigin: 'left center', ease: 'none',
          scrollTrigger: {trigger: steps, start: 'top 85%', end: 'bottom 50%', scrub: .5}});
      });
      gsap.to('.reading-progress', {scaleX: 1, ease: 'none', scrollTrigger: {start: 0, end: 'max', scrub: .2}});
      if (fine) {
        all('.project-card').forEach(card => {
          const symbol = $('.project-symbol', card);
          listen(card, 'pointerenter', () => {if(symbol) gsap.to(symbol, {y: -6, rotation: -4, duration: .4, ease: 'power2.out', overwrite: 'auto'});});
          listen(card, 'pointerleave', () => {if(symbol) gsap.to(symbol, {y: 0, rotation: 0, duration: .4, ease: 'power2.out', overwrite: 'auto'});});
        });
        all('.button').forEach(button => {
          const arrow = $('span', button);
          if (!arrow) return;
          listen(button, 'pointerenter', () => gsap.to(arrow, {x: 3, y: -3, duration: .22, overwrite: 'auto'}));
          listen(button, 'pointerleave', () => gsap.to(arrow, {x: 0, y: 0, duration: .22, overwrite: 'auto'}));
        });
      }
      return () => {listeners.forEach(off => off());};
    });
    ScrollTrigger.refresh();
  }
  function boot() {
    try {initMotion();}
    catch (error) {if (motion) motion.revert(); console.error('Animation setup failed:', error);}
  }
  if (document.fonts?.ready) document.fonts.ready.then(boot);
  else boot();
  all('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => window.ScrollTrigger?.refresh(), {once: true});
  });
  window.addEventListener('pagehide', () => {if (motion) motion.revert();});
  window.addEventListener('pageshow', e => {if (e.persisted) boot();});
})();