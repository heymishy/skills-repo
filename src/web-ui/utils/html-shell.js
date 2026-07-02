'use strict';

// html-shell.js — shared HTML shell renderer and canonical XSS-escaping utility.
// Notion-calm design system inlined; consumed by every server-rendered route.
//
// Dark mode: [data-theme="dark"] on <html>. Anti-flash inline script in <head>
//   sets the attribute from localStorage before CSS renders; SHELL_JS wires the
//   toggle button and OS-preference listener at body end.
//
// Responsive: sidebar collapses to a fixed drawer at ≤768px, revealed by a
//   hamburger button added to the topbar. Overlay closes it on tap.
//
// Public API unchanged:
//   renderShell({ title, bodyContent, user, active, crumbs, headerActions })
//   escHtml(str)

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',        href: '/dashboard', icon: '⌂' },
  { id: 'journey',   label: 'Journeys',    href: '/journey',   icon: '◎' },
  { id: 'skills',    label: 'Run a Skill', href: '/skills',    icon: '✦' },
  { id: 'features',  label: 'Features',   href: '/features',  icon: '◫' },
  { id: 'actions',   label: 'Actions',    href: '/actions',   icon: '✓' },
  { id: 'status',    label: 'Status',     href: '/status',    icon: '◐' }
];

function renderSidebar(active, login) {
  const items = NAV_ITEMS.map(function(item) {
    const isActive = item.id === active;
    return [
      '<a href="' + escHtml(item.href) + '"',
      ' class="sw-nav-item' + (isActive ? ' sw-nav-item--active' : '') + '">',
      '<span class="sw-nav-icon">' + item.icon + '</span>',
      '<span>' + escHtml(item.label) + '</span>',
      '</a>'
    ].join('');
  }).join('');
  const initial = (login || '?').charAt(0).toUpperCase();
  return [
    '<aside class="sw-sidebar" id="sw-sidebar">',
      '<div class="sw-brand">',
        '<div class="sw-brand-mark">S</div>',
        '<span class="sw-brand-name">Skills</span>',
      '</div>',
      '<nav aria-label="Main navigation">' + items + '</nav>',
      '<button class="sw-nav-collapse-btn" id="sw-nav-collapse-btn" onclick="swCollapseNav()" title="Collapse navigation">◂</button>',
      '<div class="sw-user">',
        '<div class="sw-avatar">' + escHtml(initial) + '</div>',
        '<span>' + escHtml(login || 'signed in') + '</span>',
        '<a class="sw-signout" href="/auth/logout" title="Sign out">↗</a>',
      '</div>',
    '</aside>'
  ].join('');
}

function renderCrumbs(crumbs) {
  if (!crumbs || !crumbs.length) { return '<div class="sw-crumbs"></div>'; }
  const parts = crumbs.map(function(c, i) {
    const last = i === crumbs.length - 1;
    const sep  = i > 0 ? '<span class="sw-crumb-sep">›</span>' : '';
    const cls  = 'sw-crumb' + (last ? ' sw-crumb--last' : '');
    return sep + '<span class="' + cls + '">' + escHtml(String(c)) + '</span>';
  }).join('');
  return '<div class="sw-crumbs">' + parts + '</div>';
}

// ─── Anti-flash script (runs synchronously in <head> before CSS) ───────────
// Reads localStorage for a manual preference, then falls back to OS preference.
// Sets data-theme on <html> immediately so no flash occurs on page load.
const ANTI_FLASH_SCRIPT =
  '<script>(function(){' +
    'var t=localStorage.getItem(\'sw-theme\');' +
    'if(t){document.documentElement.setAttribute(\'data-theme\',t);}' +
    'else if(window.matchMedia&&window.matchMedia(\'(prefers-color-scheme: dark)\').matches){' +
      'document.documentElement.setAttribute(\'data-theme\',\'dark\');' +
    '}' +
  '})();<\/script>';

// ─── Theme + sidebar JS (injected at end of <body>) ────────────────────────
const SHELL_JS =
  '<script>(function(){' +
    // Theme toggle
    'var _html=document.documentElement;' +
    'window.swToggleTheme=function(){' +
      'var cur=_html.getAttribute(\'data-theme\')||\'light\';' +
      'var next=cur===\'dark\'?\'light\':\'dark\';' +
      '_html.setAttribute(\'data-theme\',next);' +
      'localStorage.setItem(\'sw-theme\',next);' +
    '};' +
    // Sidebar drawer (mobile)
    'window.swToggleSidebar=function(){' +
      'var s=document.getElementById(\'sw-sidebar\');' +
      'var o=document.getElementById(\'sw-overlay\');' +
      'var open=s&&s.classList.contains(\'sw-sidebar--open\');' +
      'if(s)s.classList.toggle(\'sw-sidebar--open\',!open);' +
      'if(o)o.classList.toggle(\'sw-overlay--active\',!open);' +
      'document.body.style.overflow=open?\'\':\' hidden\';' +
    '};' +
    'window.swCloseSidebar=function(){' +
      'var s=document.getElementById(\'sw-sidebar\');' +
      'var o=document.getElementById(\'sw-overlay\');' +
      'if(s)s.classList.remove(\'sw-sidebar--open\');' +
      'if(o)o.classList.remove(\'sw-overlay--active\');' +
      'document.body.style.overflow=\'\';' +
    '};' +
    // Nav collapse (desktop)
    'window.swCollapseNav=function(){' +
      'var s=document.getElementById(\'sw-sidebar\');' +
      'var btn=document.getElementById(\'sw-nav-collapse-btn\');' +
      'if(!s)return;' +
      'var c=s.classList.toggle(\'sw-sidebar--collapsed\');' +
      'if(btn)btn.textContent=c?\'▸\':\'◂\';' +
      'localStorage.setItem(\'sw-nav-collapsed\',c?\'1\':\'\');' +
    '};' +
    // Restore nav collapse state on load
    '(function(){' +
      'if(localStorage.getItem(\'sw-nav-collapsed\')===\'1\'){' +
        'var s=document.getElementById(\'sw-sidebar\');' +
        'var btn=document.getElementById(\'sw-nav-collapse-btn\');' +
        'if(s)s.classList.add(\'sw-sidebar--collapsed\');' +
        'if(btn)btn.textContent=\'▸\';' +
      '}' +
    '})();' +
    // OS preference change listener (only when no manual override in localStorage)
    'if(window.matchMedia){' +
      'window.matchMedia(\'(prefers-color-scheme: dark)\').addEventListener(\'change\',function(e){' +
        'if(!localStorage.getItem(\'sw-theme\')){' +
          '_html.setAttribute(\'data-theme\',e.matches?\'dark\':\'light\');' +
        '}' +
      '});' +
    '}' +
  '})();<\/script>';

function renderShell(opts) {
  opts = opts || {};
  const safeTitle    = escHtml(opts.title || '');
  const login        = (opts.user && opts.user.login) ? opts.user.login : '';
  const active       = opts.active || '';
  const crumbs       = opts.crumbs || [];
  const headerActions= opts.headerActions || '';
  const bodyContent  = opts.bodyContent || '';

  const themeToggle =
    '<button class="sw-theme-toggle" onclick="swToggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode">◑</button>';
  const hamburger =
    '<button class="sw-hamburger" onclick="swToggleSidebar()" aria-label="Open navigation" aria-expanded="false">☰</button>';

  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + safeTitle + '</title>\n' +
    ANTI_FLASH_SCRIPT + '\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n' +
    '<style>' + DESIGN_SYSTEM_CSS + '</style>\n' +
    '</head>\n<body>\n' +
    '<div class="sw-app">' +
      '<div class="sw-overlay" id="sw-overlay" onclick="swCloseSidebar()"></div>' +
      renderSidebar(active, login) +
      '<div class="sw-main">' +
        '<header>' +
          hamburger +
          renderCrumbs(crumbs) +
          '<div class="sw-topbar-actions">' + headerActions + themeToggle + '</div>' +
        '</header>' +
        '<main>' + bodyContent + '</main>' +
      '</div>' +
    '</div>\n' +
    SHELL_JS + '\n' +
    '</body>\n</html>';
}

// ─── Design system CSS ─────────────────────────────────────────────────────
const DESIGN_SYSTEM_CSS = `
/* ── Light mode tokens (default) ──────────────────────────────────────────── */
:root {
  --bg: #FAFAF9; --surface: #FFFFFF; --ink: #18181B; --ink-2: #3F3F46;
  --muted: #71717A; --muted-2: #A1A1AA; --line: #E7E5E4; --line-2: #F4F4F5;
  --accent: #4F46E5; --accent-soft: #EEF2FF; --accent-ink: #3730A3;
  --green: #15803D; --green-soft: #DCFCE7;
  --amber: #B45309; --amber-soft: #FEF3C7;
  --red: #B91C1C; --red-soft: #FEE2E2;
  --serif: 'Source Serif 4', Charter, Georgia, serif;
  --sans: 'Inter', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* ── Dark mode tokens ──────────────────────────────────────────────────────
   Applied by [data-theme="dark"] (manual toggle) or via the anti-flash
   script when OS preference is dark and no manual override exists.
   The @media block is a no-JS fallback only.
─────────────────────────────────────────────────────────────────────────── */
[data-theme="dark"] {
  --bg: #111110; --surface: #1C1C1A; --ink: #F4F4F2; --ink-2: #C8C8C6;
  --muted: #808080; --muted-2: #505050; --line: #2C2C2A; --line-2: #1A1A18;
  --accent: #6366F1; --accent-soft: #1E1B4B; --accent-ink: #A5B4FC;
  --green: #4ADE80; --green-soft: #052E16;
  --amber: #FCD34D; --amber-soft: #451A03;
  --red: #F87171; --red-soft: #450A0A;
}
/* No-JS OS fallback */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --bg: #111110; --surface: #1C1C1A; --ink: #F4F4F2; --ink-2: #C8C8C6;
    --muted: #808080; --muted-2: #505050; --line: #2C2C2A; --line-2: #1A1A18;
    --accent: #6366F1; --accent-soft: #1E1B4B; --accent-ink: #A5B4FC;
    --green: #4ADE80; --green-soft: #052E16;
    --amber: #FCD34D; --amber-soft: #451A03;
    --red: #F87171; --red-soft: #450A0A;
  }
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--sans); color: var(--ink); background: var(--bg);
  font-size: 14px; -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.sw-app { display: flex; min-height: 100vh; }

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
.sw-sidebar {
  width: 220px; flex: 0 0 220px; border-right: 1px solid var(--line);
  background: var(--bg); padding: 20px 12px; display: flex; flex-direction: column;
  gap: 24px;
}
.sw-brand { display: flex; align-items: center; gap: 8px; padding: 0 8px; }
.sw-brand-mark {
  width: 24px; height: 24px; border-radius: 6px; background: var(--ink);
  color: var(--bg); display: grid; place-items: center; font-size: 13px; font-weight: 700;
}
.sw-brand-name { font-weight: 600; letter-spacing: -0.1px; }
.sw-sidebar nav { display: flex; flex-direction: column; gap: 2px; }
.sw-nav-item {
  display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 6px;
  text-decoration: none; color: var(--ink-2); font-size: 14px;
}
.sw-nav-item:hover { background: var(--line-2); }
.sw-nav-item--active {
  color: var(--ink); background: var(--surface);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px var(--line);
  font-weight: 500;
}
.sw-nav-icon { width: 16px; color: var(--muted-2); font-size: 13px; }
.sw-user {
  margin-top: auto; display: flex; align-items: center; gap: 8px;
  padding: 0 8px; font-size: 13px; color: var(--muted);
}
.sw-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent-soft); color: var(--accent-ink);
  display: grid; place-items: center; font-size: 11px; font-weight: 600;
}
.sw-signout { margin-left: auto; color: var(--muted-2); text-decoration: none; }
.sw-signout:hover { color: var(--ink-2); }

/* ── Overlay (mobile sidebar backdrop) ─────────────────────────────────────── */
.sw-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.45); z-index: 199;
  backdrop-filter: blur(2px);
}
.sw-overlay--active { display: block; }

/* ── Theme toggle button ────────────────────────────────────────────────────── */
.sw-theme-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  background: none; border: 1px solid var(--line); cursor: pointer;
  color: var(--muted); font-size: 13px; line-height: 1;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.sw-theme-toggle:hover { background: var(--line-2); color: var(--ink); }

/* ── Nav collapse button ────────────────────────────────────────────────────── */
.sw-nav-collapse-btn {
  display:flex; align-items:center; justify-content:center; width:100%;
  padding:5px 0; background:none; border:1px solid var(--line); border-radius:6px;
  cursor:pointer; color:var(--muted); font-size:11px; line-height:1;
  transition:background 0.15s, color 0.15s; flex-shrink:0;
}
.sw-nav-collapse-btn:hover { background:var(--line-2); color:var(--ink); }
/* ── Collapsed sidebar ──────────────────────────────────────────────────────── */
.sw-sidebar { transition:width 0.2s ease, flex 0.2s ease; overflow:hidden; }
.sw-sidebar--collapsed { width:52px !important; flex:0 0 52px !important; padding:20px 8px; }
.sw-sidebar--collapsed .sw-brand-name,
.sw-sidebar--collapsed nav .sw-nav-item > span:not(.sw-nav-icon),
.sw-sidebar--collapsed .sw-user > span,
.sw-sidebar--collapsed .sw-signout { display:none; }
.sw-sidebar--collapsed .sw-brand { justify-content:center; padding:0; }
.sw-sidebar--collapsed .sw-nav-item { justify-content:center; padding:8px 0; }
.sw-sidebar--collapsed .sw-nav-icon { width:auto; color:var(--muted); }
.sw-sidebar--collapsed .sw-user { justify-content:center; padding:0; }
.sw-sidebar--collapsed .sw-nav-collapse-btn { border-color:transparent; }

/* ── Hamburger (mobile only — hidden by default) ────────────────────────────── */
.sw-hamburger {
  display: none; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
  background: none; border: none; cursor: pointer;
  color: var(--muted); font-size: 17px; line-height: 1;
}
.sw-hamburger:hover { background: var(--line-2); color: var(--ink); }

/* ── Main column ────────────────────────────────────────────────────────────── */
.sw-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.sw-main > header {
  height: 48px; border-bottom: 1px solid var(--line);
  display: flex; align-items: center; padding: 0 24px; gap: 8px;
  background: var(--surface); flex-shrink: 0;
}
.sw-crumbs { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); flex: 1; min-width: 0; overflow: hidden; }
.sw-crumb { color: var(--muted); white-space: nowrap; }
.sw-crumb--last { color: var(--ink); font-weight: 500; }
.sw-crumb-sep { color: var(--muted-2); flex-shrink: 0; }
.sw-topbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.sw-main > main { flex: 1; padding: 32px 48px; }

/* ── Buttons ────────────────────────────────────────────────────────────────── */
.sw-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: inherit; text-decoration: none; border: 1px solid var(--line);
  background: transparent; color: var(--ink-2);
}
.sw-btn:hover { background: var(--line-2); }
.sw-btn--primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.sw-btn--primary:hover { opacity: 0.88; }
.sw-btn--accent { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.sw-btn--subtle { background: var(--line-2); color: var(--ink); border-color: transparent; }
.sw-btn-icon { font-size: 13px; }

/* ── Pills ──────────────────────────────────────────────────────────────────── */
.sw-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 4px;
  white-space: nowrap; line-height: 1.5;
}
.sw-pill::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: var(--muted-2);
}
.sw-pill--nodot::before { display: none; }
.sw-pill--neutral { background: var(--line-2); color: var(--ink-2); }
.sw-pill--neutral::before { background: var(--muted-2); }
.sw-pill--accent  { background: var(--accent-soft); color: var(--accent-ink); }
.sw-pill--accent::before { background: var(--accent); }
.sw-pill--green   { background: var(--green-soft); color: var(--green); }
.sw-pill--green::before { background: var(--green); }
.sw-pill--amber   { background: var(--amber-soft); color: var(--amber); }
.sw-pill--amber::before { background: var(--amber); }
.sw-pill--red     { background: var(--red-soft); color: var(--red); }
.sw-pill--red::before { background: var(--red); }

/* ── Cards & lists ──────────────────────────────────────────────────────────── */
.sw-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 8px; padding: 16px;
}
.sw-card--lg { padding: 20px; border-radius: 10px; }
.sw-section-title {
  font-size: 13px; font-weight: 600; letter-spacing: 0.4px;
  text-transform: uppercase; color: var(--muted); margin: 0 0 14px;
}

/* ── Lists ──────────────────────────────────────────────────────────────────── */
.sw-list { list-style: none; margin: 0; padding: 0; background: var(--surface);
  border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.sw-list li { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.sw-list li + li { border-top: 1px solid var(--line); }

/* ── Forms ──────────────────────────────────────────────────────────────────── */
.sw-input, .sw-textarea {
  width: 100%; padding: 8px 10px; border: 1px solid var(--line);
  border-radius: 6px; background: var(--bg); font-family: inherit;
  font-size: 13px; color: var(--ink); resize: vertical;
}
.sw-input:focus, .sw-textarea:focus {
  outline: 2px solid var(--accent); outline-offset: -1px;
  border-color: var(--accent); background: var(--surface);
}

/* ── Generic page header ─────────────────────────────────────────────────────── */
.sw-page-h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; }
.sw-page-sub { margin: 4px 0 0; color: var(--muted); font-size: 14px; }

/* ── Document/artefact prose ─────────────────────────────────────────────────── */
.sw-doc { font-family: var(--serif); color: var(--ink); }
.sw-doc h1 { font-size: 32px; font-weight: 600; letter-spacing: -0.5px; margin: 0 0 8px; line-height: 1.2; }
.sw-doc h2 { font-size: 19px; font-weight: 600; margin: 32px 0 10px; letter-spacing: -0.2px; }
.sw-doc h3 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; }
.sw-doc p, .sw-doc li { font-size: 16px; line-height: 1.65; color: var(--ink-2); }
.sw-doc p { margin: 0 0 14px; }
.sw-doc ul, .sw-doc ol { margin: 0 0 14px; padding-left: 22px; }
.sw-doc li { margin-bottom: 4px; }
.sw-doc code {
  font-family: var(--mono); font-size: 0.9em;
  background: var(--line-2); padding: 1px 5px; border-radius: 3px;
}
.sw-doc pre {
  font-family: var(--mono); font-size: 13px; background: var(--line-2);
  padding: 12px 14px; border-radius: 6px; overflow: auto; line-height: 1.55;
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.sw-empty { max-width: 720px; margin: 40px auto 0; text-align: center; }
.sw-empty-icon {
  width: 80px; height: 80px; border-radius: 16px;
  background: var(--surface); border: 1px solid var(--line);
  display: grid; place-items: center; margin: 0 auto 20px;
  color: var(--muted-2); font-size: 26px;
}
.sw-empty h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.2px; }
.sw-empty p  { margin: 6px 0 24px; color: var(--muted); font-size: 14.5px; line-height: 1.6; }

/* ── Responsive — sidebar drawer at ≤768px ───────────────────────────────────
   The sidebar becomes a position:fixed drawer, hidden off-screen left.
   The hamburger button in the topbar slides it in + shows the overlay.
─────────────────────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sw-sidebar {
    position: fixed; left: -240px; top: 0; bottom: 0; height: 100dvh;
    z-index: 200; transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
    box-shadow: none; border-right: 1px solid var(--line);
  }
  .sw-sidebar.sw-sidebar--open {
    left: 0;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
  }
  .sw-hamburger { display: inline-flex; }
  .sw-main > header { padding: 0 12px; gap: 6px; }
  .sw-main > main  { padding: 20px 16px; }
  /* Prevent background scroll when drawer open */
  body[style*="overflow"] .sw-main { pointer-events: none; }
}
`;

/**
 * Render a standalone login page using the design system tokens but without the
 * sidebar nav (unauthenticated state has no user context).
 * @returns {string} full HTML page
 */
function renderLoginPage() {
  const loginCss = `
.sw-login-wrap {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg); padding: 24px;
}
.sw-login-card {
  width: 100%; max-width: 380px;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 12px; padding: 40px 32px; text-align: center;
}
.sw-login-brand { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 32px; }
.sw-login-brand-mark {
  width: 32px; height: 32px; border-radius: 8px; background: var(--ink);
  color: var(--bg); display: grid; place-items: center; font-size: 16px; font-weight: 700;
}
.sw-login-brand-name { font-size: 18px; font-weight: 600; letter-spacing: -0.2px; }
.sw-login-title { margin: 0 0 8px; font-size: 20px; font-weight: 600; letter-spacing: -0.2px; }
.sw-login-sub { margin: 0 0 28px; font-size: 14px; color: var(--muted); line-height: 1.55; }
.sw-login-btn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 10px 16px; border-radius: 8px;
  background: var(--ink); color: var(--bg); border: none;
  font-family: inherit; font-size: 14px; font-weight: 500;
  text-decoration: none; cursor: pointer;
}
.sw-login-btn:hover { opacity: 0.88; }
.sw-login-btn--google {
  background: var(--surface); color: var(--ink); border: 1px solid var(--line);
  margin-top: 10px;
}
.sw-login-btn--google:hover { background: var(--line-2); opacity: 1; }
.sw-login-divider {
  display: flex; align-items: center; gap: 10px;
  margin: 18px 0 8px; color: var(--muted); font-size: 12px;
}
.sw-login-divider::before, .sw-login-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--line);
}
.sw-login-input {
  display: block; width: 100%; padding: 10px 12px; margin-bottom: 8px;
  border-radius: 8px; border: 1px solid var(--line);
  background: var(--bg); color: var(--ink);
  font-family: inherit; font-size: 14px; outline: none;
  box-sizing: border-box;
}
.sw-login-input:focus { border-color: var(--ink); }
.sw-login-btn--secondary {
  background: var(--surface); color: var(--ink); border: 1px solid var(--line);
}
.sw-login-email-tabs {
  display: flex; gap: 0; margin-bottom: 14px; border: 1px solid var(--line);
  border-radius: 8px; overflow: hidden;
}
.sw-login-email-tab {
  flex: 1; padding: 8px; font-size: 13px; font-family: inherit; cursor: pointer;
  background: var(--surface); color: var(--muted); border: none;
  transition: background 0.1s, color 0.1s;
}
.sw-login-email-tab.active { background: var(--ink); color: var(--bg); }
`;
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>Sign in — Skills Platform</title>\n' +
    ANTI_FLASH_SCRIPT + '\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n' +
    '<style>' + DESIGN_SYSTEM_CSS + loginCss + '</style>\n' +
    '</head>\n<body>\n' +
    '<div class="sw-login-wrap">\n' +
      '<div class="sw-login-card">\n' +
        '<div class="sw-login-brand">' +
          '<div class="sw-login-brand-mark">S</div>' +
          '<span class="sw-login-brand-name">Skills Platform</span>' +
        '</div>\n' +
        '<h1 class="sw-login-title">Sign in to continue</h1>\n' +
        '<p class="sw-login-sub">Connect your account to run skills and manage pipeline artefacts.</p>\n' +
        '<a class="sw-login-btn" href="/auth/github">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
            '<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.09.682-.218.682-.482' +
            ' 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463' +
            '-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832' +
            '.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683' +
            '-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59' +
            ' 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699' +
            ' 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336' +
            '-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>' +
          '</svg>' +
          'Sign in with GitHub' +
        '</a>\n' +
        '<div class="sw-login-divider">or</div>\n' +
        '<a class="sw-login-btn sw-login-btn--google" href="/auth/google">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>' +
            '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>' +
            '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>' +
            '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>' +
          '</svg>' +
          'Continue with Google' +
        '</a>\n' +
        '<div class="sw-login-divider">or</div>\n' +
        '<div class="sw-login-email-tabs" role="tablist">' +
          '<button type="button" class="sw-login-email-tab active" id="tab-signin" role="tab" aria-selected="true" onclick="showEmailTab(\'signin\')">' +
            'Sign in' +
          '</button>' +
          '<button type="button" class="sw-login-email-tab" id="tab-signup" role="tab" aria-selected="false" onclick="showEmailTab(\'signup\')">' +
            'Sign up' +
          '</button>' +
        '</div>\n' +
        '<form id="email-signin-form" method="POST" action="/auth/email/login">' +
          '<input class="sw-login-input" type="email" name="email" placeholder="Email address" autocomplete="email" required aria-label="Email address">' +
          '<input class="sw-login-input" type="password" name="password" placeholder="Password" autocomplete="current-password" required aria-label="Password">' +
          '<button type="submit" class="sw-login-btn sw-login-btn--secondary">Sign in with email / password</button>' +
        '</form>\n' +
        '<form id="email-signup-form" method="POST" action="/auth/email/signup" style="display:none">' +
          '<input class="sw-login-input" type="email" name="email" placeholder="Email address" autocomplete="email" required aria-label="Email address">' +
          '<input class="sw-login-input" type="password" name="password" placeholder="Password (min 8 characters)" autocomplete="new-password" required aria-label="Password" minlength="8">' +
          '<button type="submit" class="sw-login-btn sw-login-btn--secondary">Create account</button>' +
        '</form>\n' +
        '<script>' +
          'function showEmailTab(tab) {' +
            'var signin = document.getElementById("email-signin-form");' +
            'var signup = document.getElementById("email-signup-form");' +
            'var tabSignin = document.getElementById("tab-signin");' +
            'var tabSignup = document.getElementById("tab-signup");' +
            'if (tab === "signin") {' +
              'signin.style.display = "";' +
              'signup.style.display = "none";' +
              'tabSignin.classList.add("active");' +
              'tabSignup.classList.remove("active");' +
            '} else {' +
              'signin.style.display = "none";' +
              'signup.style.display = "";' +
              'tabSignin.classList.remove("active");' +
              'tabSignup.classList.add("active");' +
            '}' +
          '}' +
        '</script>\n' +
      '</div>\n' +
    '</div>\n' +
    SHELL_JS + '\n' +
    '</body>\n</html>';
}

module.exports = { renderShell, renderLoginPage, escHtml };
