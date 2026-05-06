'use strict';

// components.js — small HTML-string helpers used by the view builders.
// Pure functions, no side effects, no I/O. Single source of truth for
// pill/button/card markup so route-level views stay readable.

const { escHtml } = require('../utils/html-shell');

function pill(tone, label, opts) {
  opts = opts || {};
  const cls = 'sw-pill sw-pill--' + (tone || 'neutral') + (opts.dot === false ? ' sw-pill--nodot' : '');
  return '<span class="' + cls + '">' + escHtml(label) + '</span>';
}

function btn(variant, label, opts) {
  opts = opts || {};
  const cls = 'sw-btn' + (variant && variant !== 'ghost' ? ' sw-btn--' + variant : '');
  const icon = opts.icon ? '<span class="sw-btn-icon">' + opts.icon + '</span>' : '';
  if (opts.href) {
    return '<a class="' + cls + '" href="' + escHtml(opts.href) + '">' + icon + escHtml(label) + '</a>';
  }
  const type = opts.type ? ' type="' + escHtml(opts.type) + '"' : '';
  const form = opts.form ? ' form="' + escHtml(opts.form) + '"' : '';
  return '<button class="' + cls + '"' + type + form + '>' + icon + escHtml(label) + '</button>';
}

function avatar(login, opts) {
  opts = opts || {};
  const initial = (login || '?').charAt(0).toUpperCase();
  const size = opts.size || 22;
  return '<div class="sw-avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' +
    Math.round(size * 0.5) + 'px">' + escHtml(initial) + '</div>';
}

module.exports = { pill, btn, avatar };
