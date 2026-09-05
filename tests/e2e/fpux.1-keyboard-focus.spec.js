// tests/e2e/fpux.1-keyboard-focus.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

test('AC3: summary shows a visible focus ring and toggles open via keyboard', async ({ page }) => {
  const body = '<details class="sw-story-row" id="story"><summary id="story-summary" tabindex="0">Story</summary><p>content</p></details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  await page.setContent(html);

  await page.locator('#story-summary').focus();
  const outline = await page.locator('#story-summary').evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  // Chromium's own default UA focus ring reports outlineStyle "auto" (confirmed
  // directly: an unstyled <summary tabindex="0"> focuses with style:"auto",
  // width:"1px") -- asserting "not none" would pass on that default alone and
  // never actually exercise our own `outline: 2px solid var(--accent)` rule.
  // Assert the specific values our own CSS sets instead.
  expect(outline.style).toBe('solid');
  expect(outline.width).toBe('2px');

  const openBefore = await page.locator('#story').evaluate((el) => el.hasAttribute('open'));
  expect(openBefore).toBe(false);

  await page.keyboard.press('Enter');
  const openAfter = await page.locator('#story').evaluate((el) => el.hasAttribute('open'));
  expect(openAfter).toBe(true);
});
