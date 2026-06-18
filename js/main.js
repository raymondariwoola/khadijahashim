/* =============================================
   CONFIGURATION
   =============================================
   Set GITHUB_USERNAME to Khadija's GitHub account
   once created. Each public Gist with a .md file
   will automatically appear as a blog post.
   Convention: gist description = post title,
   created_at = publish date, first .md file = body.
   ============================================= */
const GITHUB_USERNAME = 'khadijahashim'; // e.g. 'khadijahashim' or '' to disable blog posts


/* =============================================
   THEME SWITCHER
   ============================================= */
const THEME_KEY     = 'kh-colour-scheme';
const DEFAULT_THEME = 'classic';

// Registry must match the [data-theme="…"] blocks in css/themes.css
// AND the data-theme attributes on .theme-swatch buttons in index.html.
const themes = {
  classic:    { name: 'Classic',    desc: 'Navy & Gold' },
  noir:       { name: 'Noir',       desc: 'Obsidian & Champagne' },
  sage:       { name: 'Sage',       desc: 'Forest & Gold' },
  rose:       { name: 'Rose',       desc: 'Mauve & Rose Gold' },
  azure:      { name: 'Azure',      desc: 'Royal & Platinum' },
  bordeaux:   { name: 'Bordeaux',   desc: 'Wine & Antique Gold' },
  midnight:   { name: 'Midnight',   desc: 'Aubergine & Platinum' },
  terracotta: { name: 'Terracotta', desc: 'Sienna & Warm Sand' },
};

function applyTheme(theme) {
  if (!themes[theme]) theme = DEFAULT_THEME;

  // Add transition class, swap theme, remove after animation
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
    btn.setAttribute('aria-checked', btn.dataset.theme === theme ? 'true' : 'false');
  });

  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 380);
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const panel     = document.getElementById('themePanel');
  if (!toggleBtn || !panel) return;

  // Open / close panel
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      panel.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.focus();
    }
  });

  // Swatch clicks
  document.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyTheme(btn.dataset.theme);
    });
  });
}

// Apply saved (or default) theme immediately on load — before first paint
(function () {
  const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', saved);
})();


/* =============================================
   AOS (Animate On Scroll)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({
    duration: 750,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
  });
});


/* =============================================
   NAVIGATION — transparent → navy on scroll
   ============================================= */
const mainNav = document.getElementById('mainNav');

function updateNav() {
  mainNav.classList.toggle('scrolled', window.scrollY > 50);
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();


/* =============================================
   NAVIGATION — active link scroll-spy
   ============================================= */
const navLinks = document.querySelectorAll('.nav-link-item');
const sections = document.querySelectorAll('section[id]');

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const isActive = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('active', isActive);
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => spyObserver.observe(s));


/* =============================================
   HERO — animated role text cycling
   ============================================= */
const heroRoles = [
  'People &amp; Culture Leadership',
  'CX &amp; Culture Transformation',
  'Building Experiences That Matter',
];
let heroRoleIdx = 0;
const heroRoleEl = document.getElementById('heroRole');

if (heroRoleEl) {
  setInterval(() => {
    heroRoleEl.classList.add('fade-out');
    setTimeout(() => {
      heroRoleIdx = (heroRoleIdx + 1) % heroRoles.length;
      heroRoleEl.innerHTML = heroRoles[heroRoleIdx];
      heroRoleEl.classList.remove('fade-out');
    }, 400);
  }, 3500);
}


/* =============================================
   IMPACT — animated counters
   Uses IntersectionObserver to trigger once
   when the #impact section enters the viewport.
   ============================================= */
function animateCounter(el, target, suffix, duration) {
  const start = performance.now();

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

let countersStarted = false;
const impactSection = document.getElementById('impact');

if (impactSection) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        document.querySelectorAll('.counter').forEach(el => {
          animateCounter(
            el,
            parseInt(el.dataset.target, 10),
            el.dataset.suffix || '',
            2200
          );
        });
      }
    });
  }, { threshold: 0.4 });

  counterObserver.observe(impactSection);
}


/* =============================================
   INSIGHTS — GitHub Gists blog loader
   =============================================
   Fetches public Gists, extracts real excerpts
   from the markdown content, and renders full
   articles on-site using marked.js.
   ============================================= */
const insightsGrid = document.getElementById('insightsGrid');
const insightsNote = document.getElementById('insightsNote');

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function extractExcerpt(markdown, maxLen = 180) {
  const plain = markdown
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const firstChunk = plain.split('\n').filter(l => l.trim().length > 20).slice(0, 3).join(' ');
  if (firstChunk.length <= maxLen) return firstChunk;
  return firstChunk.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function estimateReadTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function renderGistCard(gist, rawContent, delay) {
  const files  = Object.values(gist.files);
  const mdFile = files.find(f => f.filename.endsWith('.md')) || files[0];
  const title  = gist.description
    || (mdFile ? mdFile.filename.replace(/\.md$/, '') : 'Untitled');
  const excerpt  = extractExcerpt(rawContent);
  const readMins = estimateReadTime(rawContent);

  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  col.setAttribute('data-aos', 'fade-up');
  col.setAttribute('data-aos-delay', String(delay));
  col.innerHTML = `
    <div class="blog-card" role="button" tabindex="0">
      <p class="blog-date">${formatDate(gist.created_at)} · ${readMins} min read</p>
      <h4 class="blog-title">${title}</h4>
      <p class="blog-excerpt">${excerpt}</p>
      <span class="blog-read-link">
        Read Article <i class="fa-solid fa-arrow-right"></i>
      </span>
    </div>`;

  const card = col.querySelector('.blog-card');
  card.addEventListener('click', () => openArticle(title, gist.created_at, rawContent, gist.id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openArticle(title, gist.created_at, rawContent, gist.id);
    }
  });

  return col;
}

/* ── Article overlay ── */
const articleOverlay  = document.getElementById('articleOverlay');
const articleClose    = document.getElementById('articleClose');
const articleShare    = document.getElementById('articleShare');
const articleTitle    = document.getElementById('articleTitle');
const articleDate     = document.getElementById('articleDate');
const articleContent  = document.getElementById('articleContent');

function openArticle(title, date, markdown, gistId) {
  const body = markdown.replace(/^#\s+.*\n+/, '');
  articleTitle.textContent   = title;
  articleDate.textContent    = formatDate(date);
  articleContent.innerHTML   = marked.parse(body, { breaks: true });
  articleOverlay.classList.add('open');
  articleOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  articleOverlay.querySelector('.article-container').scrollTop = 0;
  if (gistId) history.pushState(null, '', '#article/' + gistId);
}

function closeArticle() {
  articleOverlay.classList.remove('open');
  articleOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (location.hash.startsWith('#article/')) history.pushState(null, '', location.pathname);
}

if (articleClose) articleClose.addEventListener('click', closeArticle);
if (articleOverlay) {
  articleOverlay.querySelector('.article-overlay-backdrop')
    .addEventListener('click', closeArticle);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && articleOverlay.classList.contains('open')) closeArticle();
  });
}

window.addEventListener('popstate', () => {
  if (!location.hash.startsWith('#article/') && articleOverlay.classList.contains('open')) {
    articleOverlay.classList.remove('open');
    articleOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
});

if (articleShare) {
  articleShare.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      const label = articleShare.querySelector('span');
      const icon  = articleShare.querySelector('i');
      label.textContent = 'Copied!';
      icon.className = 'fa-solid fa-check';
      setTimeout(() => {
        label.textContent = 'Copy Link';
        icon.className = 'fa-solid fa-link';
      }, 2000);
    });
  });
}

async function openArticleFromHash() {
  const match = location.hash.match(/^#article\/([a-f0-9]+)$/);
  if (!match || !GITHUB_USERNAME) return;
  const gistId = match[1];
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!res.ok) return;
    const gist = await res.json();
    const mdFile = Object.values(gist.files).find(f => f.filename.endsWith('.md'));
    if (!mdFile) return;
    const title = gist.description || mdFile.filename.replace(/\.md$/, '');
    const content = mdFile.content || await fetch(mdFile.raw_url).then(r => r.text());
    openArticle(title, gist.created_at, content, gistId);
  } catch { /* ignore — visitor sees the normal page */ }
}

/* ── Placeholders (when no username or no gists) ── */
function renderPlaceholders() {
  const items = [
    'Why Employee Experience and Customer Experience Are Inseparable',
    'What 20 Years in Banking Taught Me About People',
    'The Future of Employee Experience',
  ];
  items.forEach((title, i) => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.setAttribute('data-aos', 'fade-up');
    col.setAttribute('data-aos-delay', String(i * 80));
    col.innerHTML = `
      <div class="blog-placeholder">
        <div class="shimmer-line" style="height:11px;width:42%;"></div>
        <div class="shimmer-line" style="height:20px;width:88%;"></div>
        <div class="shimmer-line" style="height:20px;width:66%;margin-bottom:1.25rem;"></div>
        <div class="shimmer-line" style="height:11px;width:100%;"></div>
        <div class="shimmer-line" style="height:11px;width:90%;"></div>
        <div class="shimmer-line" style="height:11px;width:75%;margin-bottom:1rem;"></div>
        <p class="blog-coming-soon">${title}</p>
      </div>`;
    insightsGrid.appendChild(col);
  });
}

/* ── Main loader ── */
async function loadInsights() {
  if (!insightsGrid) return;

  if (!GITHUB_USERNAME) {
    renderPlaceholders();
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/gists`);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);

    const gists   = await res.json();
    const mdGists = gists.filter(g =>
      Object.keys(g.files).some(f => f.endsWith('.md'))
    );

    if (!mdGists.length) {
      renderPlaceholders();
      return;
    }

    if (insightsNote) insightsNote.style.display = 'none';

    const selected = mdGists.slice(0, 6);
    const contentPromises = selected.map(g => {
      const mdFile = Object.values(g.files).find(f => f.filename.endsWith('.md'));
      return mdFile ? fetch(mdFile.raw_url).then(r => r.text()) : Promise.resolve('');
    });
    const contents = await Promise.all(contentPromises);

    selected.forEach((g, i) => {
      insightsGrid.appendChild(renderGistCard(g, contents[i], i * 80));
    });

    AOS.refresh();
  } catch {
    renderPlaceholders();
  }
}

loadInsights();


/* =============================================
   RECOMMENDED BOOKS
   ============================================= */
const BOOKS_PREVIEW_COUNT = 6;

function renderBookCard(book, delay, includeDesc) {
  const col = document.createElement('div');
  col.className = includeDesc ? 'col-6 col-sm-4 col-lg-3' : 'col-6 col-sm-4 col-lg-2';
  col.setAttribute('data-aos', 'fade-up');
  col.setAttribute('data-aos-delay', String(delay));

  const cardClass = includeDesc ? 'book-card-full' : 'book-card';
  const descHtml = includeDesc && book.description
    ? `<p class="book-desc">${book.description}</p>` : '';

  col.innerHTML = `
    <div class="${cardClass}">
      <div class="book-cover-wrap">
        <span class="book-spine"></span>
        <img class="book-cover" src="${book.coverUrl}" alt="${book.title}" loading="lazy"
             onerror="this.outerHTML='<div class=\\'book-cover-fallback\\'><i class=\\'fa-solid fa-book\\'></i><span>${book.title}</span></div>'">
      </div>
      <h4 class="book-title">${book.title}</h4>
      <p class="book-author">${book.author}</p>
      ${descHtml}
    </div>`;
  return col;
}

function initBooks() {
  const grid = document.getElementById('booksGrid');
  const viewAllWrap = document.getElementById('booksViewAll');
  if (!grid || typeof RECOMMENDED_BOOKS === 'undefined' || !RECOMMENDED_BOOKS.length) return;

  const preview = RECOMMENDED_BOOKS.slice(0, BOOKS_PREVIEW_COUNT);
  preview.forEach((book, i) => {
    grid.appendChild(renderBookCard(book, i * 60, false));
  });

  if (RECOMMENDED_BOOKS.length > BOOKS_PREVIEW_COUNT) {
    viewAllWrap.style.display = '';
    document.getElementById('booksViewAllBtn').addEventListener('click', openBooksOverlay);
  }

  AOS.refresh();
}

function openBooksOverlay() {
  const overlay = document.getElementById('booksOverlay');
  const grid = document.getElementById('booksOverlayGrid');
  const count = document.getElementById('booksOverlayCount');
  if (!overlay) return;

  grid.innerHTML = '';
  count.textContent = RECOMMENDED_BOOKS.length + ' books';
  RECOMMENDED_BOOKS.forEach((book, i) => {
    grid.appendChild(renderBookCard(book, i * 40, true));
  });

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.books-overlay-container').scrollTop = 0;
}

function closeBooksOverlay() {
  const overlay = document.getElementById('booksOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

(function () {
  const overlay = document.getElementById('booksOverlay');
  if (!overlay) return;
  const closeBtn = document.getElementById('booksOverlayClose');
  if (closeBtn) closeBtn.addEventListener('click', closeBooksOverlay);
  overlay.querySelector('.books-overlay-backdrop')
    .addEventListener('click', closeBooksOverlay);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeBooksOverlay();
  });
})();


/* =============================================
   INIT — runs after DOM is ready
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  applyTheme(saved);
  initThemeToggle();
  openArticleFromHash();
  initBooks();
});
