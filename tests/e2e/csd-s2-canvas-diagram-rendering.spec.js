// csd-s2-canvas-diagram-rendering.spec.js — Playwright E2E coverage for
// csd-s2's CSS-layout-dependent ACs, which jsdom cannot verify:
//
//   AC3: two diagram blocks of the same type ("As Designed" vs "As Built")
//        must be VISUALLY distinguishable, not just DOM-distinguishable
//        (real CSS layout/rendering).
//   AC4: a diagram block present on the page must not break existing
//        keyboard-navigation/focus order (real browser focus/tab-order
//        engine).
//
// Also extends csd-s1's own AC2-equivalent legibility pattern (real mermaid
// SVG render, entity/node labels visible and non-overlapping) to the two new
// diagram types (system-architecture, program-design), and adds a visual
// check for the malformed-diagram error box (AC2), per this story's DoR
// Coding Agent Instructions ("add new specs for system-architecture and
// program-design legibility, plus the malformed-diagram error-box visual
// check").
//
// artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
// artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md
// artefacts/2026-07-25-code-shape-diagrams/dor/csd-s2-dor-contract.md
//
// Runs against the LOCAL NODE_ENV=test webServer (playwright.config.js), same
// as csd-s1's own spec -- seeded directly via /test/seed-ideate-canvas-session
// (NODE_ENV=test only), no real/mocked LLM call needed since fixture content
// is hand-authored (out of scope for this story to generate via a skill).

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const {
  REALISTIC_SYSTEM_ARCHITECTURE_MERMAID,
  REALISTIC_ARCHITECTURE_NODE_NAMES
} = require('../fixtures/csd-s2/system-architecture-fixtures');
const {
  REALISTIC_PROGRAM_DESIGN_MERMAID,
  REALISTIC_PROGRAM_DESIGN_NODE_NAMES
} = require('../fixtures/csd-s2/program-design-fixtures');
const { MALFORMED_MERMAID_SYNTAX } = require('../fixtures/csd-s2/malformed-mermaid-fixture');
const { MINIMAL_DATA_MODEL_MERMAID } = require('../fixtures/csd-s1/data-model-fixtures');

function nonOverlappingLabelsCheck(boxes) {
  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(
        overlaps(boxes[i].box, boxes[j].box),
        'labels "' + boxes[i].name + '" and "' + boxes[j].name + '" must not visually overlap'
      ).toBe(false);
    }
  }
}

withAuth('AC1 (via E2E): a realistic System Architecture diagram renders as a legible mermaid SVG with all node labels visible and non-overlapping', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'system-architecture', title: 'System Architecture', content: { mermaid: REALISTIC_SYSTEM_ARCHITECTURE_MERMAID } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();
  expect(sessionId).toBeTruthy();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const block = page.locator('#canvas-panel .canvas-block[data-block-type="system-architecture"]');
  await expect(block).toBeAttached({ timeout: 10000 });
  await expect(block.locator('.cv-text')).toHaveCount(0);

  // AC1 — visible, human-readable type label.
  await expect(block.locator('.cv-diagram-type-label')).toHaveText('System Architecture');

  const svg = block.locator('.mermaid svg');
  await expect(svg).toBeVisible({ timeout: 15000 });

  const boxes = [];
  for (const name of REALISTIC_ARCHITECTURE_NODE_NAMES) {
    const label = svg.locator('.nodeLabel', { hasText: name }).first();
    await expect(label).toBeVisible();
    const box = await label.boundingBox();
    expect(box, 'expected a real bounding box for node label "' + name + '"').toBeTruthy();
    boxes.push({ name: name, box: box });
  }
  nonOverlappingLabelsCheck(boxes);

  await page.setViewportSize({ width: 1000, height: 1400 });
  await page.locator('#canvas-panel').screenshot({
    path: 'test-results/csd-s2-system-architecture-diagram.png'
  });
});

withAuth('AC1 (via E2E): a realistic Program Design diagram renders as a legible mermaid SVG with all stage labels visible and non-overlapping', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'program-design', title: 'Program Design', content: { mermaid: REALISTIC_PROGRAM_DESIGN_MERMAID } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();
  expect(sessionId).toBeTruthy();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const block = page.locator('#canvas-panel .canvas-block[data-block-type="program-design"]');
  await expect(block).toBeAttached({ timeout: 10000 });
  await expect(block.locator('.cv-text')).toHaveCount(0);

  await expect(block.locator('.cv-diagram-type-label')).toHaveText('Program Design');

  const svg = block.locator('.mermaid svg');
  await expect(svg).toBeVisible({ timeout: 15000 });

  const boxes = [];
  for (const name of REALISTIC_PROGRAM_DESIGN_NODE_NAMES) {
    const label = svg.locator('.nodeLabel', { hasText: name }).first();
    await expect(label).toBeVisible();
    const box = await label.boundingBox();
    expect(box, 'expected a real bounding box for stage label "' + name + '"').toBeTruthy();
    boxes.push({ name: name, box: box });
  }
  nonOverlappingLabelsCheck(boxes);

  await page.setViewportSize({ width: 1000, height: 1400 });
  await page.locator('#canvas-panel').screenshot({
    path: 'test-results/csd-s2-program-design-diagram.png'
  });
});

withAuth('AC2: a malformed diagram shows a visually distinct, labelled error box — not a blank space, not raw mermaid error output', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'data-model', title: 'Data Model', content: { mermaid: MALFORMED_MERMAID_SYNTAX } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const block = page.locator('#canvas-panel .canvas-block[data-block-type="data-model"]');
  await expect(block).toBeAttached({ timeout: 10000 });

  const errorBox = block.locator('.cv-diagram-error-box');
  await expect(errorBox).toBeVisible({ timeout: 15000 });

  const errorText = await errorBox.innerText();
  expect(errorText.trim().length).toBeGreaterThan(0);
  expect(/data model/i.test(errorText)).toBe(true);
  expect(/failed to render/i.test(errorText)).toBe(true);

  // Never a successfully-rendered diagram alongside the error state.
  await expect(block.locator('.mermaid svg')).toHaveCount(0);

  // Visually distinct — a real, non-transparent border colour is present
  // (real CSS layout check; cannot be verified in jsdom).
  const borderColor = await errorBox.evaluate((el) => window.getComputedStyle(el).borderColor);
  expect(borderColor).not.toBe('');
  expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');

  await page.locator('#canvas-panel').screenshot({
    path: 'test-results/csd-s2-malformed-diagram-error-box.png'
  });
});

withAuth('AC3: an "As Designed" and an "As Built" diagram of the same type are visually distinguishable — separate, individually-labelled boxes', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'data-model', title: 'As Designed', content: { mermaid: MINIMAL_DATA_MODEL_MERMAID } },
        { type: 'data-model', title: 'As Built', content: { mermaid: MINIMAL_DATA_MODEL_MERMAID } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const blocks = page.locator('#canvas-panel .canvas-block[data-block-type="data-model"]');
  await expect(blocks).toHaveCount(2, { timeout: 10000 });

  const asDesigned = blocks.nth(0);
  const asBuilt     = blocks.nth(1);

  await expect(asDesigned.locator('.canvas-block-title')).toHaveText('As Designed');
  await expect(asBuilt.locator('.canvas-block-title')).toHaveText('As Built');

  await expect(asDesigned.locator('.mermaid svg')).toBeVisible({ timeout: 15000 });
  await expect(asBuilt.locator('.mermaid svg')).toBeVisible({ timeout: 15000 });

  // Real, non-overlapping bounding boxes — the two blocks occupy visually
  // separate regions of the page (stacked, not on top of one another).
  const designedBox = await asDesigned.boundingBox();
  const builtBox     = await asBuilt.boundingBox();
  expect(designedBox).toBeTruthy();
  expect(builtBox).toBeTruthy();
  const overlapsVertically = designedBox.y < builtBox.y + builtBox.height && designedBox.y + designedBox.height > builtBox.y;
  expect(overlapsVertically && designedBox.y === builtBox.y, 'the two blocks must not be rendered on top of one another').toBe(false);

  await page.locator('#canvas-panel').screenshot({
    path: 'test-results/csd-s2-as-designed-vs-as-built.png'
  });
});

withAuth('AC4: keyboard-only navigation still reaches every interactive element with a diagram block present on the page', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'system-architecture', title: 'System Architecture', content: { mermaid: REALISTIC_SYSTEM_ARCHITECTURE_MERMAID } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const block = page.locator('#canvas-panel .canvas-block[data-block-type="system-architecture"]');
  await expect(block).toBeAttached({ timeout: 10000 });
  await expect(block.locator('.mermaid svg')).toBeVisible({ timeout: 15000 });

  // The chat message input is the well-known, always-present interactive
  // element on this page (independent of any diagram content) — reachable
  // by direct focus() as a baseline sanity check before the Tab walk below.
  const messageInput = page.locator('#chat-form textarea, #chat-form input[type="text"]').first();
  await expect(messageInput).toBeAttached({ timeout: 10000 });

  // Walk forward via Tab from the top of the page, tracking each focused
  // element. A diagram block must not trap focus (the same element staying
  // focused across repeated Tab presses) and must not prevent the walk from
  // eventually reaching the chat message input — the same reachability bar
  // wuce18-keyboard-nav.spec.ts uses for nav links.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('Tab');

  const focusedTagsSeen = [];
  let reachedMessageInput = false;
  const MAX_TABS = 60;
  for (let i = 0; i < MAX_TABS; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, id: el.id || null, cls: el.className || null } : null;
    });
    focusedTagsSeen.push(info);

    const isMessageInput = await messageInput.evaluate((el) => el === document.activeElement).catch(() => false);
    if (isMessageInput) { reachedMessageInput = true; break; }

    await page.keyboard.press('Tab');
  }

  expect(reachedMessageInput, 'expected Tab-only navigation to eventually reach the chat message input with a diagram block present on the page (within ' + MAX_TABS + ' tab presses)').toBe(true);

  // No focus trap: the same element must not have been focused for more
  // than a couple of consecutive Tab presses in a row (a real trap would
  // repeat the identical element indefinitely).
  let maxConsecutiveRepeat = 1;
  let currentRun = 1;
  for (let i = 1; i < focusedTagsSeen.length; i++) {
    const prev = focusedTagsSeen[i - 1];
    const cur  = focusedTagsSeen[i];
    const same = prev && cur && prev.tag === cur.tag && prev.id === cur.id && prev.cls === cur.cls;
    currentRun = same ? currentRun + 1 : 1;
    maxConsecutiveRepeat = Math.max(maxConsecutiveRepeat, currentRun);
  }
  expect(maxConsecutiveRepeat, 'expected no focus trap (the same element repeatedly re-focused) while a diagram block is present').toBeLessThan(4);
});
