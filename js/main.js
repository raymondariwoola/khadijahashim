/* =============================================
   CONFIGURATION
   =============================================
   Set GITHUB_USERNAME to Khadija's GitHub account
   once created. Each public Gist with a .md file
   will automatically appear as a blog post.
   Convention: gist description = post title,
   created_at = publish date, first .md file = body.
   ============================================= */
const GITHUB_USERNAME = '';


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
  'People Strategy &amp; Engagement',
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
   To activate: set GITHUB_USERNAME above.
   Each public Gist with a .md file becomes a post.
   ============================================= */
const insightsGrid = document.getElementById('insightsGrid');
const insightsNote = document.getElementById('insightsNote');

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function renderGistCard(gist, delay) {
  const files  = Object.values(gist.files);
  const mdFile = files.find(f => f.filename.endsWith('.md')) || files[0];
  const title  = gist.description
    || (mdFile ? mdFile.filename.replace(/\.md$/, '') : 'Untitled');
  const link   = `https://gist.github.com/${GITHUB_USERNAME}/${gist.id}`;

  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  col.setAttribute('data-aos', 'fade-up');
  col.setAttribute('data-aos-delay', String(delay));
  col.innerHTML = `
    <div class="blog-card">
      <p class="blog-date">${formatDate(gist.created_at)}</p>
      <h4 class="blog-title">${title}</h4>
      <p class="blog-excerpt">
        Published as a public note — click to read the full piece on GitHub Gist.
      </p>
      <a href="${link}" target="_blank" rel="noopener" class="blog-read-link">
        Read <i class="fa-solid fa-arrow-right"></i>
      </a>
    </div>`;
  return col;
}

function renderPlaceholders() {
  const items = [
    'On Leading Cultures That Last',
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

    // Hide setup note when real posts exist
    if (insightsNote) insightsNote.style.display = 'none';

    mdGists.slice(0, 6).forEach((g, i) => {
      insightsGrid.appendChild(renderGistCard(g, i * 80));
    });

    AOS.refresh();
  } catch {
    renderPlaceholders();
  }
}

loadInsights();


/* =============================================
   INIT — runs after DOM is ready
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Restore and wire up theme toggle
  const saved = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
  applyTheme(saved);
  initThemeToggle();
});
