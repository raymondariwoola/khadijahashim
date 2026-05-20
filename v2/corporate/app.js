/* Quiet Corporate — interactions */
(function () {
  'use strict';

  // Theme toggle (manual, persisted, default dark)
  const THEME_KEY = 'kh-corporate-theme';
  const root = document.documentElement;
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
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Counters
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
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

  // Live clock in topbar
  const clockEl = document.querySelector('[data-clock]');
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GST`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // As-of date
  const asOf = document.querySelector('[data-asof]');
  if (asOf) {
    const d = new Date();
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    asOf.textContent = `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Year in footer
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
