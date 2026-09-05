// tests/e2e/fpux.1-contrast-ratio.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

function relLuminance([r, g, b]) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function parseRgb(str) {
  const m = str.match(/\d+/g).map(Number);
  // A transparent/unset background (rgba(0, 0, 0, 0)) must fail loudly, not
  // silently parse as opaque black -- that bug let this test pass before any
  // real CSS existed (black-on-transparent still "computed" a passing ratio).
  if (m.length === 4 && m[3] === 0) {
    throw new Error(`background is transparent (${str}) -- no real .sw-epic-group background is applied`);
  }
  return [m[0], m[1], m[2]];
}
function contrastRatio(fg, bg) {
  const l1 = relLuminance(parseRgb(fg));
  const l2 = relLuminance(parseRgb(bg));
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function checkTheme(page, theme) {
  const body = '<details class="sw-epic-group" open><details class="sw-story-row" id="story" open><summary id="story-summary">Story</summary></details></details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  await page.setContent(html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`));
  const { fg, bg } = await page.locator('#story-summary').evaluate((el) => {
    const s = getComputedStyle(el);
    const bgEl = el.closest('.sw-story-row').parentElement;
    const bgColor = getComputedStyle(bgEl).backgroundColor;
    return { fg: s.color, bg: bgColor };
  });
  return contrastRatio(fg, bg);
}

test('AC4: contrast ratio >= 4.5:1 in light theme', async ({ page }) => {
  const ratio = await checkTheme(page, 'light');
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test('AC4: contrast ratio >= 4.5:1 in dark theme', async ({ page }) => {
  const ratio = await checkTheme(page, 'dark');
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
