// tests/e2e/fpux.1-visual-consistency-theme.spec.js
'use strict';
const { test, expect } = require('@playwright/test');
const { renderShell } = require('../../src/web-ui/utils/html-shell.js');

function fixtureHtml(theme) {
  const body = '<div class="sw-card" id="ref"></div>' +
    '<details class="sw-epic-group" id="epic" open><summary id="epic-summary">Epic</summary>' +
      '<details class="sw-story-row" id="story"><summary id="story-summary">Story</summary></details>' +
    '</details>';
  const html = renderShell({ title: 'fpux.1 fixture', bodyContent: body, user: { login: 'fixture' } });
  return html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`);
}

test('AC1: .sw-epic-group computed style matches .sw-card reference values', async ({ page }) => {
  await page.setContent(fixtureHtml('light'));
  const ref = await page.locator('#ref').evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, width: s.borderTopWidth, style: s.borderTopStyle, bg: s.backgroundColor };
  });
  const epic = await page.locator('#epic').evaluate((el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderRadius, width: s.borderTopWidth, style: s.borderTopStyle, bg: s.backgroundColor };
  });
  expect(epic).toEqual(ref);
});

test('AC2a: .sw-epic-group/.sw-story-row resolve to light-theme token values', async ({ page }) => {
  await page.setContent(fixtureHtml('light'));
  const epicBg = await page.locator('#epic').evaluate((el) => getComputedStyle(el).backgroundColor);
  const storyColor = await page.locator('#story-summary').evaluate((el) => getComputedStyle(el).color);
  expect(epicBg).toBe('rgb(255, 255, 255)'); // --surface light: #FFFFFF
  expect(storyColor).toBe('rgb(24, 24, 27)'); // --ink light: #18181B
});

test('AC2b: .sw-epic-group/.sw-story-row resolve to dark-theme token values, different from light', async ({ page }) => {
  await page.setContent(fixtureHtml('dark'));
  const epicBg = await page.locator('#epic').evaluate((el) => getComputedStyle(el).backgroundColor);
  const storyColor = await page.locator('#story-summary').evaluate((el) => getComputedStyle(el).color);
  expect(epicBg).toBe('rgb(28, 28, 26)'); // --surface dark: #1C1C1A
  expect(storyColor).toBe('rgb(244, 244, 242)'); // --ink dark: #F4F4F2
  expect(epicBg).not.toBe('rgb(255, 255, 255)');
});
