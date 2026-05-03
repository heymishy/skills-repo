// annotation.spec.js — E2E tests for POST /api/artefacts/.../annotations (wuce.8)
//
// AC4: HTML/script content stripped server-side before commit (unit-tested; server-side sanitiser)
// AC5: >2000 chars → 400 rejection, no partial commit
// AC6: 409 conflict → retry once (integration-tested in unit suite)
// Auth gate: unauthenticated POST via authGuard → 302 redirect
//
// ACs requiring real GitHub write access are excluded:
//   AC1: annotation affordance DOM interaction (browser runtime, CSS hover)
//   AC2: committed annotation appears in file under ## Annotations section
//   AC3: existing annotations displayed below their section
// These remain in the manual verification script.
//
// The annotation-writer adapter calls the GitHub Contents API.
// With the fake test token, write calls fail at the network layer.
// Valid-payload tests assert JSON response shape rather than 200 status.

'use strict';

const { test, expect } = require('@playwright/test');
const { withAuth }     = require('./fixtures/auth');

// Any artefact path inside artefacts/ is structurally valid for route matching.
const ANNOTATION_URL =
  '/api/artefacts/artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md/annotations';

// ── Unauthenticated (authGuard → 302 redirect) ─────────────────────────────────

test('unauthenticated POST /api/artefacts/.../annotations returns 302', async ({ request }) => {
  // maxRedirects: 0 so we see the redirect directly rather than the redirected page
  const response = await request.post(ANNOTATION_URL, {
    data: {
      sectionHeading: 'Acceptance Criteria',
      annotationText: 'Test note.',
      artefactPath:   'artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md',
    },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(302);
});

// ── Authenticated — validation layer (runs before any GitHub API call) ─────────

withAuth('AC5: annotation text >2000 chars returns 400 with length error', async ({ page }) => {
  const longText = 'x'.repeat(2001);
  const response = await page.request.post(ANNOTATION_URL, {
    data: {
      sectionHeading: 'Acceptance Criteria',
      annotationText: longText,
      artefactPath:   'artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md',
    },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('2000');
});

withAuth('AC5: annotation text of exactly 2000 chars is accepted past length check', async ({ page }) => {
  // 2000 chars is the boundary — must NOT be rejected by length validation.
  // The subsequent GitHub write will fail (fake token) but the length check passes.
  const boundaryText = 'x'.repeat(2000);
  const response = await page.request.post(ANNOTATION_URL, {
    data: {
      sectionHeading: 'Acceptance Criteria',
      annotationText: boundaryText,
      artefactPath:   'artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md',
    },
  });
  // Must NOT be 400 from length validation; any other status is acceptable here
  expect(response.status()).not.toBe(400);
});

withAuth('missing sectionHeading returns 400 with descriptive error', async ({ page }) => {
  const response = await page.request.post(ANNOTATION_URL, {
    data: {
      annotationText: 'A note without a section heading.',
      artefactPath:   'artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md',
    },
  });
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.error).toContain('sectionHeading');
});

withAuth('valid annotation payload returns JSON response (not HTML)', async ({ page }) => {
  // GitHub write will fail with fake token; route must still return JSON not HTML
  const response = await page.request.post(ANNOTATION_URL, {
    data: {
      sectionHeading: 'Acceptance Criteria',
      annotationText: 'This looks correct.',
      artefactPath:   'artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md',
    },
  });
  const contentType = response.headers()['content-type'] || '';
  expect(contentType).toContain('application/json');
  // Response body must be parseable JSON
  const body = await response.json();
  expect(typeof body).toBe('object');
});
