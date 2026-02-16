/* ============================================
   Aeris Motorsport — Shared Functionality
   ============================================ */

const PAGES = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: 'drivers.html', label: 'Drivers' },
  { href: 'results.html', label: 'Results' },
  { href: 'championships.html', label: 'Championships' },
  { href: 'gallery.html', label: 'Gallery' },
];

function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  return file;
}

/* --- Navigation --- */
function buildNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const currentPage = getCurrentPage();

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-brand">
        <img src="images/Logo.webp" alt="Aeris Motorsport Logo">
        <span>Aeris</span>
      </a>
      <button class="nav-toggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links">
        ${PAGES.map(p => {
          const isActive = p.href === currentPage || (currentPage === '' && p.href === 'index.html');
          return `<a href="${p.href}"${isActive ? ' class="active"' : ''}>${p.label}</a>`;
        }).join('')}
      </div>
    </div>
    <div class="nav-overlay"></div>
  `;

  const toggle = nav.querySelector('.nav-toggle');
  const links = nav.querySelector('.nav-links');
  const overlay = nav.querySelector('.nav-overlay');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = links.classList.contains('open') ? 'hidden' : '';
  });

  overlay.addEventListener('click', () => {
    toggle.classList.remove('open');
    links.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  });
}

/* --- Footer --- */
function buildFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="images/Logo.webp" alt="Aeris Motorsport">
        <span>Aeris Motorsport</span>
      </div>
      <div class="footer-links">
        <a href="https://www.instagram.com/aeris_motorsport/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="about.html">About</a>
        <a href="drivers.html">Drivers</a>
        <a href="results.html">Results</a>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${year} Aeris Motorsport. All rights reserved. &bull; Powered by <a href="https://www.iracing.com" target="_blank" rel="noopener noreferrer">iRacing</a></p>
      </div>
    </div>
  `;
}

/* --- Data Fetching --- */
async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* --- Initialise --- */
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  buildFooter();
});
