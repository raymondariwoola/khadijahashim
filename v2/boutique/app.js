/* Boutique Hospitality — interactions */
(function () {
  'use strict';

  const root = document.documentElement;

  // Theme toggle (manual, persisted, default dark)
  const THEME_KEY = 'kh-boutique-theme';
  const stored = localStorage.getItem(THEME_KEY);
  root.setAttribute('data-theme', stored === 'light' ? 'light' : 'dark');
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  });

  // Mobile nav
  const menuBtn = document.querySelector('[data-menu]');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // Reveals
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Counters — slow, elegant cadence
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const v = Math.floor(ease(t) * target);
      el.textContent = v.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          cIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-counter]').forEach(c => cIO.observe(c));
  }

  // Nav active link on scroll
  const sections = document.querySelectorAll('section[id], header[id]');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window && sections.length && links.length) {
    const map = new Map();
    links.forEach(l => map.set(l.getAttribute('href').slice(1), l));
    const nIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const link = map.get(e.target.id);
        if (!link) return;
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => nIO.observe(s));
  }

  // Live local time in top band
  const clockEl = document.querySelector('[data-clock]');
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      const opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai' };
      clockEl.textContent = new Intl.DateTimeFormat('en-GB', opts).format(d) + ' DXB';
    };
    tick();
    setInterval(tick, 30000);
  }

  // Year
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
