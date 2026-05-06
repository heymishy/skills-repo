'use strict';

// html-shell.js — shared HTML shell renderer and canonical XSS-escaping utility.
// Notion-calm design system inlined; consumed by every server-rendered route.
//
// Public API unchanged:
//   renderShell({ title, bodyContent, user, active, crumbs, headerActions })
//   escHtml(str)
//
// `active`, `crumbs`, `headerActions` are NEW optional props — existing callers
// that pass only { title, bodyContent, user } continue to work; they get a
// sensible default sidebar/topbar with no breadcrumbs and no header actions.

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home',            href: '/dashboard', icon: '⌂' },
  { id: 'skills',    label: 'Run a skill',     href: '/skills',    icon: '✦' },
  { id: 'features',  label: 'Features',        href: '/features',  icon: '◫' },
  { id: 'actions',   label: 'My actions',      href: '/actions',   icon: '✓' },
  { id: 'status',    label: 'Pipeline status', href: '/status',    icon: '◐' }
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
    '<aside class="sw-sidebar">',
      '<div class="sw-brand">',
        '<div class="sw-brand-mark">S</div>',
        '<span class="sw-brand-name">Skills</span>',
      '</div>',
      '<nav class="sw-nav" aria-label="Main navigation">' + items + '</nav>',
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

function renderShell(opts) {
  opts = opts || {};
  const safeTitle    = escHtml(opts.title || '');
  const login        = (opts.user && opts.user.login) ? opts.user.login : '';
  const active       = opts.active || '';
  const crumbs       = opts.crumbs || [];
  const headerActions= opts.headerActions || '';
  const bodyContent  = opts.bodyContent || '';

  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + safeTitle + ' · Skills</title>\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">\n' +
    '<style>' + DESIGN_SYSTEM_CSS + '</style>\n' +
    '</head>\n<body>\n' +
    '<div class="sw-app">' +
      renderSidebar(active, login) +
      '<div class="sw-main">' +
        '<header class="sw-topbar">' +
          renderCrumbs(crumbs) +
          '<div class="sw-topbar-actions">' + headerActions + '</div>' +
        '</header>' +
        '<main class="sw-content">' + bodyContent + '</main>' +
      '</div>' +
    '</div>\n' +
    '</body>\n</html>';
}

// ─── Design system CSS ─────────────────────────────────────────────────────
const DESIGN_SYSTEM_CSS = `
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
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  font-family: var(--sans); color: var(--ink); background: var(--bg);
  font-size: 14px; -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.sw-app { display: flex; min-height: 100vh; }

/* Sidebar */
.sw-sidebar {
  width: 220px; flex: 0 0 220px; border-right: 1px solid var(--line);
  background: var(--bg); padding: 20px 12px; display: flex; flex-direction: column;
  gap: 24px;
}
.sw-brand { display: flex; align-items: center; gap: 8px; padding: 0 8px; }
.sw-brand-mark {
  width: 24px; height: 24px; border-radius: 6px; background: var(--ink);
  color: white; display: grid; place-items: center; font-size: 13px; font-weight: 700;
}
.sw-brand-name { font-weight: 600; letter-spacing: -0.1px; }
.sw-nav { display: flex; flex-direction: column; gap: 2px; }
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

/* Main column */
.sw-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.sw-topbar {
  height: 48px; border-bottom: 1px solid var(--line);
  display: flex; align-items: center; padding: 0 24px; gap: 8px;
  background: var(--surface);
}
.sw-crumbs { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); flex: 1; }
.sw-crumb { color: var(--muted); }
.sw-crumb--last { color: var(--ink); font-weight: 500; }
.sw-crumb-sep { color: var(--muted-2); }
.sw-topbar-actions { display: flex; gap: 8px; align-items: center; }
.sw-content { flex: 1; padding: 32px 48px; }

/* Buttons */
.sw-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: inherit; text-decoration: none; border: 1px solid var(--line);
  background: transparent; color: var(--ink-2);
}
.sw-btn:hover { background: var(--line-2); }
.sw-btn--primary { background: var(--ink); color: #fff; border-color: var(--ink); }
.sw-btn--primary:hover { background: #000; }
.sw-btn--accent { background: var(--accent); color: #fff; border-color: var(--accent); }
.sw-btn--subtle { background: var(--line-2); color: var(--ink); border-color: transparent; }
.sw-btn-icon { font-size: 13px; }

/* Pills */
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

/* Cards & lists */
.sw-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 8px; padding: 16px;
}
.sw-card--lg { padding: 20px; border-radius: 10px; }
.sw-section-title {
  font-size: 13px; font-weight: 600; letter-spacing: 0.4px;
  text-transform: uppercase; color: var(--muted); margin: 0 0 14px;
}

/* Lists */
.sw-list { list-style: none; margin: 0; padding: 0; background: var(--surface);
  border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.sw-list li { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.sw-list li + li { border-top: 1px solid var(--line); }

/* Forms */
.sw-input, .sw-textarea {
  width: 100%; padding: 8px 10px; border: 1px solid var(--line);
  border-radius: 6px; background: var(--bg); font-family: inherit;
  font-size: 13px; color: var(--ink); resize: vertical;
}
.sw-input:focus, .sw-textarea:focus {
  outline: 2px solid var(--accent); outline-offset: -1px;
  border-color: var(--accent); background: var(--surface);
}

/* Generic page header */
.sw-page-h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; }
.sw-page-sub { margin: 4px 0 0; color: var(--muted); font-size: 14px; }

/* Document/artefact prose */
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

/* Empty state */
.sw-empty { max-width: 720px; margin: 40px auto 0; text-align: center; }
.sw-empty-icon {
  width: 80px; height: 80px; border-radius: 16px;
  background: var(--surface); border: 1px solid var(--line);
  display: grid; place-items: center; margin: 0 auto 20px;
  color: var(--muted-2); font-size: 26px;
}
.sw-empty h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.2px; }
.sw-empty p  { margin: 6px 0 24px; color: var(--muted); font-size: 14.5px; line-height: 1.6; }
`;

module.exports = { renderShell, escHtml };
