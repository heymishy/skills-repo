// csd-s1-data-model-diagram.spec.js — Playwright E2E coverage for csd-s1's
// AC2: a realistic 5+-entity Data Model diagram must be legible/distinguishable
// once rendered by mermaid in a real browser (jsdom cannot verify this --
// mermaid's actual SVG layout/measurement requires a real rendering engine,
// per this story's own test-plan gap-table entry).
//
// artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
// artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s1-test-plan.md
//
// Runs against the LOCAL NODE_ENV=test webServer (playwright.config.js),
// same as tests/e2e/dic-canvas.spec.js -- no @real-staging/@mocked tag,
// since it needs neither a deployed environment nor a real/mocked LLM call:
// the fixture content is hand-authored (out of scope for this story to
// generate via a skill), seeded directly into session.canvasBlocks via the
// new /test/seed-ideate-canvas-session endpoint (NODE_ENV=test only,
// src/web-ui/server.js), then rendered through the real initial-hydration
// path (canvasBlocksInitScript -> appendCanvasBlock -> mermaid.run()).
//
// AC2 verification approach (per the DoR contract's "Playwright screenshot
// assertion" classification):
//   1. mermaid actually renders real SVG (not raw text, not an error state).
//   2. every one of the 6 fixture entity names is visible as rendered text.
//   3. entity-name label bounding boxes don't overlap each other -- a real,
//      automated proxy for "legible/distinguishable" (no line/label reading
//      through another), backed by Chromium's real layout engine.
//   4. a screenshot of the rendered panel is saved for human visual review
//      (this repo has no existing toHaveScreenshot()/pixel-baseline
//      precedent, and OS/font-rendering differences make a pixel-diff
//      baseline fragile across machines -- captured for manual review
//      instead, matching AC2's own verification-script Scenario 2, which is
//      an explicit human pass/fail check).

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const {
  REALISTIC_DATA_MODEL_MERMAID,
  REALISTIC_ENTITY_NAMES
} = require('../fixtures/csd-s1/data-model-fixtures');

withAuth('AC2: a realistic 6-entity data-model diagram renders as a legible mermaid SVG with all entities visible and non-overlapping labels', async ({ page }) => {
  test.setTimeout(30000);

  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'data-model', title: 'Data model', content: { mermaid: REALISTIC_DATA_MODEL_MERMAID } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();
  expect(sessionId).toBeTruthy();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  // The block itself must be present, and it must NOT have fallen through to
  // the plain-text renderer (that would be raw, unrendered mermaid source --
  // the exact failure mode this story exists to de-risk).
  const block = page.locator('#canvas-panel .canvas-block[data-block-type="data-model"]');
  await expect(block).toBeAttached({ timeout: 10000 });
  await expect(block.locator('.cv-text')).toHaveCount(0);

  // mermaid.run() replaces the .mermaid container's raw-source text content
  // with a real, rendered <svg> once it completes -- wait for that.
  const svg = block.locator('.mermaid svg');
  await expect(svg).toBeVisible({ timeout: 15000 });

  // Every entity name must actually be visible as rendered text within the
  // diagram -- not merely present in the source string. Mermaid v11 renders
  // entity-box header labels as HTML inside an SVG <foreignObject>
  // (`<span class="nodeLabel"><p>NAME</p></span>`), not as SVG <text>
  // elements -- confirmed by inspecting a real render's DOM (see this
  // story's decisions.md / coding-agent report for how this was found).
  for (const name of REALISTIC_ENTITY_NAMES) {
    const label = svg.locator('.nodeLabel', { hasText: name });
    await expect(label.first()).toBeVisible();
  }

  // Legibility proxy: entity-name label bounding boxes must not overlap one
  // another. Real layout, computed by Chromium -- not achievable in jsdom.
  const boxes = [];
  for (const name of REALISTIC_ENTITY_NAMES) {
    const box = await svg.locator('.nodeLabel', { hasText: name }).first().boundingBox();
    expect(box, 'expected a real bounding box for entity label "' + name + '"').toBeTruthy();
    boxes.push({ name: name, box: box });
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(
        overlaps(boxes[i].box, boxes[j].box),
        'entity labels "' + boxes[i].name + '" and "' + boxes[j].name + '" must not visually overlap -- an operator must be able to read every table name without difficulty (AC2)'
      ).toBe(false);
    }
  }

  // Screenshot for human visual review (Scenario 2 of
  // csd-s1-verification.md is an explicit manual pass/fail check) -- saved
  // as a Playwright test artifact, not asserted against a pixel baseline.
  // #canvas-panel is a fixed-height, overflow-y:auto container -- a locator
  // screenshot at the default viewport height would clip whatever the
  // 6-entity diagram's real SVG height (~1000px) doesn't fit in the visible
  // scroll position. Widen the viewport for this one capture so every
  // entity is visible in the saved image without scrolling.
  await page.setViewportSize({ width: 1000, height: 1400 });
  await page.locator('#canvas-panel').screenshot({
    path: 'test-results/csd-s1-ac2-data-model-diagram.png'
  });
});

withAuth('AC1 (via E2E): a minimal data-model block renders a rendered diagram, not a wall of raw text', async ({ page }) => {
  const seedRes = await page.request.post('/test/seed-ideate-canvas-session', {
    data: {
      canvasBlocks: [
        { type: 'data-model', title: 'Data model', content: { mermaid: 'erDiagram\n    A ||--o{ B : "has"' } }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status()).toBe(200);
  const { sessionId } = await seedRes.json();

  await page.goto(`/skills/ideate/sessions/${sessionId}/chat`);

  const block = page.locator('#canvas-panel .canvas-block[data-block-type="data-model"]');
  await expect(block).toBeAttached({ timeout: 10000 });
  await expect(block.locator('.mermaid svg')).toBeVisible({ timeout: 15000 });

  // The raw "erDiagram" source text must never be shown as plain visible
  // body text once mermaid has rendered (it is preserved only inside the
  // collapsed text-alternative <details>, per the accessibility NFR).
  const bodyText = await block.locator('.canvas-block-body').innerText();
  expect(bodyText.startsWith('erDiagram')).toBe(false);
});
