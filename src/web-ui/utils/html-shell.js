'use strict';

// html-shell.js — shared HTML shell renderer and canonical XSS-escaping utility
// renderShell({ title, bodyContent, user }) — returns a complete HTML document string
// escHtml(str)                              — canonical XSS prevention; import from here,
//                                            do NOT define locally in other modules

/**
 * Escape a string for safe insertion into HTML.
 * Converts &, <, >, ", ' to their HTML entities.
 * This is the single canonical XSS-prevention function for all server-rendered HTML
 * in the web-ui module. All other modules must import from this file.
 *
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Render a complete HTML shell document.
 * Pure rendering utility — no API calls, no session access.
 * Callers are responsible for passing user context as arguments.
 *
 * @param {{ title: string, bodyContent: string, user: { login: string } }} opts
 * @returns {string} Complete HTML document string
 */
function renderShell({ title, bodyContent, user }) {
  const userLogin = (user && user.login) ? escHtml(user.login) : '';
  const safeTitle = escHtml(title || '');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
header { background: #f4f4f4; padding: 0.5rem 1rem; display: flex; align-items: center; justify-content: space-between; }
nav { background: #222; padding: 0.5rem 1rem; }
nav a { color: #fff; text-decoration: none; margin-right: 1.25rem; }
nav a:hover { text-decoration: underline; }
nav a:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; }
main { padding: 1rem; max-width: 860px; }
</style>
</head>
<body>
<header>
<span class="user-login">${userLogin}</span>
</header>
<nav aria-label="Main navigation">
<a href="/features">Features</a>
<a href="/actions">Actions</a>
<a href="/status">Status</a>
<a href="/skills">Run a Skill</a>
</nav>
<main>
${bodyContent}
</main>
</body>
</html>`;
}

module.exports = { renderShell, escHtml };
