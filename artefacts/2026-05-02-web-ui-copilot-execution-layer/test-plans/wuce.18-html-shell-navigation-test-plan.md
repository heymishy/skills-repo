# Test Plan: HTML shell and navigation

**Story:** wuce.18 — HTML shell and navigation
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce18-html-shell.js`
**E2E test file:** `tests/e2e/wuce18-keyboard-nav.spec.ts`
**Total tests:** 20 (18 unit/integration + 2 E2E)
**Passing at plan-write time:** 0 (tests are written to fail — TDD discipline)
**Review artefact:** review/wuce.18-html-shell-navigation-review-1.md

---

## Test data strategy

All tests use in-memory mock data. No external API calls. The `user` object passed to `renderShell()` is a plain object `{ login: 'test-user', id: 1 }`. XSS tests use `{ login: '<script>alert(1)</script>' }`. The HTTP integration tests use the test server bootstrap pattern established in wuce.1–7 (require `server.js`, create a one-shot `http.Server`, call `.close()` in teardown). `NODE_ENV=test` disables real OAuth and enables auth bypass.

---

## Tests

### T1 — Unit: renderShell returns complete HTML document

**AC:** AC3
**Type:** Unit
**File:** `tests/check-wuce18-html-shell.js`

```
const { renderShell } = require('../src/web-ui/utils/html-shell');
const output = renderShell({ title: 'Test', bodyContent: '<p>hello</p>', user: { login: 'alice' } });
assert(output.includes('<!doctype html'), 'must start with doctype');
assert(output.includes('<title>Test</title>'), 'must contain title');
assert(output.includes('<main>'), 'must contain main element');
assert(output.includes('<p>hello</p>'), 'must inject bodyContent');
```

**Expected:** PASS when `renderShell` is implemented

---

### T2 — Unit: renderShell nav contains four correct links

**AC:** AC3, AC1
**Type:** Unit

```
assert(output.includes('href="/features"'), 'Features link');
assert(output.includes('href="/actions"'), 'Actions link');
assert(output.includes('href="/status"'), 'Status link');
assert(output.includes('href="/skills"'), 'Run a Skill link');
assert(output.includes('aria-label="Main navigation"'), 'nav aria-label');
```

**Expected:** PASS when nav is implemented

---

### T3 — Unit: renderShell nav has descriptive link text

**AC:** AC3
**Type:** Unit

```
assert(output.includes('>Features<'), 'Features text');
assert(output.includes('>Actions<'), 'Actions text');
assert(output.includes('>Status<'), 'Status text');
assert(output.includes('>Run a Skill<'), 'Run a Skill text');
```

---

### T4 — Unit: renderShell user login displayed in header

**AC:** AC3, AC1
**Type:** Unit

```
const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
assert(output.includes('<header>'), 'header element present');
assert(output.includes('alice'), 'user login visible');
```

---

### T5 — Unit: escHtml escapes all five special characters

**AC:** AC3
**Type:** Unit

```
const { escHtml } = require('../src/web-ui/utils/html-shell');
assert.strictEqual(escHtml('<'), '&lt;');
assert.strictEqual(escHtml('>'), '&gt;');
assert.strictEqual(escHtml('&'), '&amp;');
assert.strictEqual(escHtml('"'), '&quot;');
assert.strictEqual(escHtml("'"), '&#x27;');
assert.strictEqual(escHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
```

---

### T6 — Unit: XSS — script tag in user login is escaped

**AC:** AC4
**Type:** Unit

```
const output = renderShell({ title: 'T', bodyContent: '', user: { login: '<script>alert(1)</script>' } });
assert(!output.includes('<script>'), 'raw script tag must not appear');
assert(output.includes('&lt;script&gt;'), 'escaped version must appear');
```

---

### T7 — Unit: renderShell injects bodyContent inside main

**AC:** AC3
**Type:** Unit

```
const output = renderShell({ title: 'T', bodyContent: '<ul id="test-content"></ul>', user: { login: 'u' } });
const mainStart = output.indexOf('<main>');
const mainEnd = output.indexOf('</main>');
const mainContent = output.slice(mainStart, mainEnd);
assert(mainContent.includes('id="test-content"'), 'bodyContent inside main');
```

---

### T8 — Unit: renderShell title appears in <title> element

**AC:** AC3
**Type:** Unit

```
const output = renderShell({ title: 'My Dashboard', bodyContent: '', user: { login: 'u' } });
assert(output.includes('<title>My Dashboard</title>'));
```

---

### T9 — Integration: GET /dashboard returns text/html with nav

**AC:** AC1
**Type:** HTTP integration

Start test server with `NODE_ENV=test` and a mock authenticated session.

```
GET /dashboard
Accept: text/html

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">
  Body includes: href="/features"
  Body includes: href="/actions"
  Body includes: href="/status"
  Body includes: href="/skills"
```

---

### T10 — Integration: GET /dashboard unauthenticated → 302

**AC:** AC2
**Type:** HTTP integration

```
GET /dashboard (no session cookie)

Expected:
  Status: 302
  Location: /auth/github
```

---

### T11 — Integration: GET /dashboard shows user login

**AC:** AC1
**Type:** HTTP integration

With mock session `{ user: { login: 'testuser' } }`:

```
GET /dashboard
Accept: text/html

Expected:
  Status: 200
  Body includes: testuser
```

---

### T12 — Integration: GET /dashboard Content-Type is text/html; charset=utf-8

**AC:** AC1
**Type:** HTTP integration

```
Expected:
  Content-Type header: text/html; charset=utf-8
```

---

### T13 — Unit: renderShell produces valid HTML structure ordering

**AC:** AC3
**Type:** Unit — structural ordering

```
assert(output.indexOf('<!doctype') < output.indexOf('<html'));
assert(output.indexOf('<header>') > 0);
assert(output.indexOf('<nav') > 0);
assert(output.indexOf('<main>') > 0);
```

---

### T14 — Unit: escHtml handles empty string

**AC:** AC3
**Type:** Unit

```
assert.strictEqual(escHtml(''), '');
```

---

### T15 — Unit: escHtml handles string with no special chars unchanged

**AC:** AC3
**Type:** Unit

```
assert.strictEqual(escHtml('hello world'), 'hello world');
```

---

### T16 — Integration: dashboard renders without throwing when user.login is plain text

**AC:** AC1, AC3
**Type:** HTTP integration — smoke

```
GET /dashboard with session { user: { login: 'planeName' } }
Expected: 200 — no 500 errors
```

---

### T17 — Unit: exported escHtml is the same function (not duplicated)

**AC:** AC3 / NFR security
**Type:** Unit — module contract

```
const { escHtml: e1 } = require('../src/web-ui/utils/html-shell');
const { escHtml: e2 } = require('../src/web-ui/utils/html-shell');
assert.strictEqual(e1, e2, 'same export reference — not duplicated');
```

---

### T18 — Integration: login XSS in HTTP integration test

**AC:** AC4
**Type:** HTTP integration

With mock session `{ user: { login: '<b>bold</b>' } }`:

```
GET /dashboard Accept: text/html
Expected:
  Body does not include: <b>bold</b>
  Body includes: &lt;b&gt;bold&lt;/b&gt;
```

---

### T19 — E2E: keyboard navigation reaches all four nav links (Playwright)

**AC:** AC5
**File:** `tests/e2e/wuce18-keyboard-nav.spec.ts`
**Type:** Playwright E2E (layout-dependent — not in `npm test`)

```typescript
test('keyboard user can reach all four nav links via Tab', async ({ page }) => {
  await page.goto('/dashboard');
  // Tab through nav links
  for (const label of ['Features', 'Actions', 'Status', 'Run a Skill']) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused).toBe(label);
  }
});
```

---

### T20 — E2E: focused nav link has visible focus styling (Playwright)

**AC:** AC5
**File:** `tests/e2e/wuce18-keyboard-nav.spec.ts`
**Type:** Playwright E2E (layout-dependent)

```typescript
test('focused nav link has visible outline', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return window.getComputedStyle(el).outlineStyle;
  });
  expect(outline).not.toBe('none');
});
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| AC5 focus styling | AC5 | LOW | CSS-dependent; not assertable via jsdom | Playwright E2E tests T19–T20 cover this; flag at DoR for H-E2E |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T2, T3, T4, T9, T11, T12 |
| AC2 | T10 |
| AC3 | T1, T2, T3, T5, T7, T8, T13, T14, T15, T17 |
| AC4 | T6, T18 |
| AC5 | T19, T20 (E2E) |
