// tiso-s1-reseed-keeps-csrf.spec.js -- story tiso-s1
// artefacts/2026-11-20-e2e-session-reseed-csrf/stories/tiso-s1-reseed-keeps-csrf-token.md
//
// Every withAuth spec shares one session, and each spec's setup re-seeds it with GET /test/session.
// A spec that is already part-way through a flow holds a CSRF token its page embedded; the next
// spec's re-seed must not invalidate it. This test is the deterministic form of the race: no second
// worker, just the same request the next spec's setup makes, between two POSTs with one token.
// NOT in the npm test chain (ADR-018) -- run with:
//   NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/tiso-s1-reseed-keeps-csrf.spec.js

'use strict';

const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueLabel(tag) {
  return tag + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
}

withAuth('AC4: a CSRF token held before another spec re-seeds the shared session still works afterwards (T-E1)', async ({ page }) => {
  const name = 'TISO Product ' + uniqueLabel('a');
  const draft = await page.request.post('/products/new', {
    data: { name: name, description: 'Product created by the tiso-s1 E2E spec.' },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(draft.status(), 'products/new should succeed').toBe(200);

  const token = await getCsrfToken(page.request, '/products/new', 'products/new page');

  const before = await page.request.post('/products/confirm', {
    form: { name: name, description: 'Product created by the tiso-s1 E2E spec.', _csrf: token },
    maxRedirects: 0
  });
  expect(before.status(), 'the token works before any re-seed').toBe(302);

  // exactly what the next spec's withAuth setup does
  const reseed = await page.request.get('/test/session');
  expect(reseed.status(), 'GET /test/session re-seeds the shared session').toBe(200);

  const name2 = 'TISO Product ' + uniqueLabel('b');
  const after = await page.request.post('/products/confirm', {
    form: { name: name2, description: 'Product created by the tiso-s1 E2E spec.', _csrf: token },
    maxRedirects: 0
  });
  expect(after.status(), 'the same token must still be accepted after the shared session is re-seeded (a 403 here is the race)').toBe(302);
});
