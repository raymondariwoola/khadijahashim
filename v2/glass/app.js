/* Glass & Motion — interactions */
(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Theme toggle ----------
  const THEME_KEY = 'kh-glass-theme';
  const stored = localStorage.getItem(THEME_KEY);
  root.setAttribute('data-theme', stored === 'light' ? 'light' : 'dark');
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  });

  // ---------- Mobile nav ----------
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

  // ---------- Reveals ----------
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

  // ---------- Counter animation ----------
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
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

  // ---------- Portrait parallax (mouse-tracking 3D tilt) ----------
  const portrait = document.querySelector('[data-tilt]');
  if (portrait && !reduceMotion) {
    const max = 8; // degrees
    portrait.addEventListener('mousemove', (e) => {
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -2 * max;
      const ry = (px - 0.5) *  2 * max;
      portrait.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      portrait.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    });
    portrait.addEventListener('mouseleave', () => {
      portrait.style.setProperty('--rx', '0deg');
      portrait.style.setProperty('--ry', '0deg');
    });
  }

  // ---------- Spotlight on glass cards ----------
  if (!reduceMotion) {
    document.querySelectorAll('.bento-cell, .pillar, .impact-card, .award, .edu, .event-card, .insight').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  // ---------- Nav active link on scroll ----------
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

  // ---------- Year ----------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
