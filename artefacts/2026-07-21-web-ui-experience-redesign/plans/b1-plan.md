# Remove dead nav links and add the missing Org board and Home List/Board toggle — Implementation Plan

> **For agent execution:** /tdd per task, in this session.

**Goal:** Edit `NAV_ITEMS` in `html-shell.js` to remove Features/Actions/Status, add an Org board entry, and add a List/Board toggle sub-component under Home — matching AC1-AC4 exactly, no more.
**Branch:** `worktree-agent-ae17bfaeb95969688` (already isolated; no new worktree needed)
**Worktree:** `C:\Users\Hamis\code\skills repo\.claude\worktrees\agent-ae17bfaeb95969688`
**Test command:** `npm test` (runs `node scripts/run-all-tests.js`, which discovers `tests/check-*.js`)
**E2E test command:** `npx playwright test tests/e2e/b1-nav-toggle.spec.js` (not part of `npm test` — ADR-018 convention, matching `wuce18-keyboard-nav.spec.ts`)

---

## File map

```
Modify:
  src/web-ui/utils/html-shell.js       — remove features/actions/status from NAV_ITEMS,
                                          add org-kanban entry, export NAV_ITEMS, add
                                          renderHomeViewToggle() sub-markup + CSS
  tests/check-wuce18-html-shell.js     — T2/T3/T9 assert the exact 3 dead links this
                                          story removes; update to the new nav shape
                                          (collateral fix, not scope creep — AC1 directly
                                          contradicts these assertions)
  tests/e2e/wuce18-keyboard-nav.spec.ts — asserts keyboard-focus on the same 3 dead
                                          labels; update to the new nav shape (same
                                          collateral reason; not in npm test chain)

Create:
  tests/check-b1-nav-fix.js            — AC1, AC3, AC4 (+ AC4 validity) tests
  tests/e2e/b1-nav-toggle.spec.js       — AC2 Playwright E2E test
```

---

## Task 1: Remove the 3 dead nav entries (AC1)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`
- Test: `tests/check-b1-nav-fix.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-b1-nav-fix.js (new file, AC1 section)
const { NAV_ITEMS } = require('../src/web-ui/utils/html-shell');

console.log('\nAC1 — dead nav links removed');
{
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'features'; }), 'AC1.1: no features entry');
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'actions'; }),  'AC1.2: no actions entry');
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'status'; }),   'AC1.3: no status entry');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-b1-nav-fix.js
```

Expected output: fails — `html-shell.js` does not yet export `NAV_ITEMS`, and even once it does, the array still contains `features`/`actions`/`status`, so AC1.1–1.3 report `✗`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/utils/html-shell.js`, replace the `NAV_ITEMS` array and its export:

```javascript
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Home',        href: '/dashboard',  icon: '⌂' },
  { id: 'journey',    label: 'Journeys',    href: '/journey',    icon: '◎' },
  { id: 'skills',     label: 'Run a Skill', href: '/skills',     icon: '✦' },
  { id: 'org-kanban', label: 'Org board',   href: '/org/kanban', icon: '▦' }
];
```

And at the bottom of the file:

```javascript
module.exports = { renderShell, renderLoginPage, escHtml, NAV_ITEMS };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-b1-nav-fix.js
```

Expected output: AC1.1–1.3 all `✓`.

- [ ] **Step 5: Run full suite — no regressions (expected to show pre-existing failures from Task 4/5's collateral files — see those tasks)**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/html-shell.js tests/check-b1-nav-fix.js
git commit -m "feat(b1): remove dead Features/Actions/Status nav entries (AC1)"
```

---

## Task 2: Add the Org board nav entry (AC3)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js` (already added in Task 1's `NAV_ITEMS` edit)
- Test: `tests/check-b1-nav-fix.js`

- [ ] **Step 1: Write the failing test**

```javascript
console.log('\nAC3 — Org board nav entry present');
{
  const orgItem = NAV_ITEMS.find(function(i) { return i.href === '/org/kanban'; });
  ok(!!orgItem, 'AC3.1: an entry with href /org/kanban exists');
  ok(orgItem && /board/i.test(orgItem.label), 'AC3.2: its label mentions "board"');
}
```

- [ ] **Step 2: Run test — must fail**

Since Task 1 already added the `org-kanban` entry to `NAV_ITEMS` as part of the same array literal, this test is expected to pass immediately once Task 1's Step 3 lands — there is no separate RED state for this specific assertion in isolation. Run it standalone first to confirm the entry's exact shape (`href`, `label`) is correct:

```bash
node tests/check-b1-nav-fix.js
```

Expected output at this point: AC3.1 and AC3.2 already `✓` (verifying Task 1's array literal is correct, not introducing new production code).

- [ ] **Step 3: No new implementation needed** — covered by Task 1's array literal.

- [ ] **Step 4: Run test — confirm pass**

```bash
node tests/check-b1-nav-fix.js
```

Expected output: AC3.1, AC3.2 `✓`.

- [ ] **Step 5: Run full suite**

```bash
npm test
```

- [ ] **Step 6: Commit** — folded into Task 1's commit (same array literal edit); no separate commit needed.

---

## Task 3: Home List/Board toggle (AC2)

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`
- Test: `tests/e2e/b1-nav-toggle.spec.js`

- [ ] **Step 1: Write the failing E2E test**

```javascript
// tests/e2e/b1-nav-toggle.spec.js (new file)
// b1-nav-toggle.spec.js — E2E coverage for AC2 (Home List/Board toggle).
// NOT in npm test chain (ADR-018) — run with: npx playwright test tests/e2e/b1-nav-toggle.spec.js
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

// Note: only the List → Board direction is asserted, matching AC2's own wording
// and the verification script's Scenario 2. /dashboard?view=board renders a bare
// kanban fragment with no sidebar (kbc-s1's already-shipped, out-of-scope
// rendering) — there is no List link to click back from the board view, so a
// Board → List round trip is not part of this story's AC2.
withAuth('Board toggle under Home switches to the board view without a full nav click', async ({ page }) => {
  await page.goto('/dashboard');
  const board = page.locator('.sw-nav-subitem:text("Board")');
  await board.click();
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('view=board');
  const boardMarkup = await page.locator('.kb-board').count();
  expect(boardMarkup).toBeGreaterThan(0);
});

withAuth('List toggle under Home is present and points at /dashboard (no query string)', async ({ page }) => {
  await page.goto('/dashboard');
  const list = page.locator('.sw-nav-subitem:text("List")');
  await expect(list).toHaveAttribute('href', '/dashboard');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/b1-nav-toggle.spec.js
```

Expected output: fails — `.sw-nav-subitem` does not exist yet (no toggle markup rendered under Home).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/utils/html-shell.js`, add a small helper and call it from `renderSidebar` only for the `dashboard` item:

```javascript
function renderHomeViewToggle() {
  return [
    '<div class="sw-nav-subrow" role="group" aria-label="Home view">',
      '<a href="/dashboard" class="sw-nav-subitem">List</a>',
      '<a href="/dashboard?view=board" class="sw-nav-subitem">Board</a>',
    '</div>'
  ].join('');
}

function renderSidebar(active, login) {
  const items = NAV_ITEMS.map(function(item) {
    const isActive = item.id === active;
    const link = [
      '<a href="' + escHtml(item.href) + '"',
      ' class="sw-nav-item' + (isActive ? ' sw-nav-item--active' : '') + '">',
      '<span class="sw-nav-icon">' + item.icon + '</span>',
      '<span>' + escHtml(item.label) + '</span>',
      '</a>'
    ].join('');
    return item.id === 'dashboard' ? link + renderHomeViewToggle() : link;
  }).join('');
  // ...rest unchanged
```

Add CSS to `DESIGN_SYSTEM_CSS` (accessibility NFR: keyboard-operable — plain `<a>` tags are natively focusable; add a visible `:focus-visible` state):

```css
.sw-nav-subrow { display: flex; gap: 4px; padding: 0 10px 4px 34px; }
.sw-nav-subitem {
  font-size: 12px; color: var(--muted); text-decoration: none;
  padding: 2px 6px; border-radius: 4px;
}
.sw-nav-subitem:hover { background: var(--line-2); color: var(--ink-2); }
.sw-nav-subitem:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.sw-sidebar--collapsed .sw-nav-subrow { display: none; }
```

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/b1-nav-toggle.spec.js
```

Expected output: both tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/html-shell.js tests/e2e/b1-nav-toggle.spec.js
git commit -m "feat(b1): add List/Board toggle under Home nav item (AC2)"
```

---

## Task 4: Every remaining nav item resolves to a real route (AC4)

**Files:**
- Test: `tests/check-b1-nav-fix.js`

- [ ] **Step 1: Write the failing test**

```javascript
function pathRegisteredInServer(pathname, serverSrc) {
  return serverSrc.indexOf("pathname === '" + pathname + "'") !== -1 ||
         serverSrc.indexOf('pathname === "' + pathname + '"') !== -1;
}

console.log('\nAC4 — every NAV_ITEMS href resolves to a registered route in server.js');
{
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
  const unresolved = NAV_ITEMS.filter(function(item) {
    return !pathRegisteredInServer(item.href.split('?')[0], serverSrc);
  });
  ok(unresolved.length === 0, 'AC4.1: zero dangling NAV_ITEMS entries (unresolved: ' +
    unresolved.map(function(i) { return i.href; }).join(', ') + ')');
}

console.log('\nAC4 (test validity) — resolution check catches the pre-fix dead links');
{
  const preFixNavItems = [
    { id: 'dashboard', href: '/dashboard' },
    { id: 'journey',   href: '/journey' },
    { id: 'skills',    href: '/skills' },
    { id: 'features',  href: '/features' },
    { id: 'actions',   href: '/actions' },
    { id: 'status',    href: '/status' }
  ];
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
  const unresolved = preFixNavItems.filter(function(item) {
    return !pathRegisteredInServer(item.href, serverSrc);
  });
  eq(unresolved.length, 3, 'AC4.validity: pre-fix array has exactly 3 unresolved (dead) entries');
  ok(unresolved.every(function(i) { return ['features', 'actions', 'status'].indexOf(i.id) !== -1; }),
    'AC4.validity: the 3 unresolved entries are exactly features/actions/status');
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-b1-nav-fix.js
```

Expected output at this point (before Task 1/2/3 land): AC4.1 fails, since the current (pre-fix) array still contains `/features`, `/actions`, `/status`, which do not resolve. (If run after Task 1/2 already landed, AC4.1 already passes — this is fine; the meta-requirement is that the validity check below independently proves the test catches the bug when given the pre-fix shape.)

- [ ] **Step 3: No new production code** — this task is pure test-writing; AC4.1's pass depends on Task 1/2's `NAV_ITEMS` edit, already done.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-b1-nav-fix.js
```

Expected output: AC4.1 ✓ (zero dangling entries), AC4.validity ✓ ✓ (pre-fix array correctly flagged with exactly 3 unresolved: features/actions/status).

- [ ] **Step 5: Run full suite**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-b1-nav-fix.js
git commit -m "test(b1): add AC4 route-resolution check + pre-fix validity control"
```

---

## Task 5: Fix collateral tests broken by AC1 (dead-link assertions)

**Why this task exists:** `tests/check-wuce18-html-shell.js` (T2, T3, T9) and `tests/e2e/wuce18-keyboard-nav.spec.ts` assert the literal presence of `Features`/`Actions`/`Status` — the exact 3 entries AC1 removes. These are not new scope; they are pre-existing tests whose assertions directly contradict the story's own AC1. Leaving them unfixed would either (a) break `npm test` (for the `check-*.js` file, which is in the discovery glob), or (b) leave a stale, now-false E2E spec on disk asserting dead nav items exist.

**Files:**
- Modify: `tests/check-wuce18-html-shell.js`
- Modify: `tests/e2e/wuce18-keyboard-nav.spec.ts`

- [ ] **Step 1: Confirm these are the only two collateral references**

```bash
grep -rn "href=\"/features\"\|href=\"/actions\"\|href=\"/status\"\|>Features<\|>Actions<\|>Status<" tests/
```

Expected output: only `tests/check-wuce18-html-shell.js` and `tests/e2e/wuce18-keyboard-nav.spec.ts` match.

- [ ] **Step 2: Update `tests/check-wuce18-html-shell.js`**

Replace T2/T3/T9's dead-link assertions with the current real nav shape:

```javascript
// T2 — Unit: renderShell nav contains the real nav links
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
  ok(output.includes('href="/journey"'),    'T2.1: Journeys link href');
  ok(output.includes('href="/skills"'),     'T2.2: Run a Skill link href');
  ok(output.includes('href="/org/kanban"'), 'T2.3: Org board link href');
  ok(output.includes('aria-label="Main navigation"'), 'T2.4: nav aria-label');
}

// T3 — Unit: renderShell nav has descriptive link text
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
  ok(output.includes('>Journeys<'),    'T3.1: "Journeys" text');
  ok(output.includes('>Run a Skill<'), 'T3.2: "Run a Skill" text');
  ok(output.includes('>Org board<'),   'T3.3: "Org board" text');
}

// T9 — Integration: GET /dashboard (authenticated) returns 200 html with nav
{
  const req = mockReq();
  const res = mockRes();
  handleDashboard(req, res);
  eq(res.statusCode, 200, 'T9.1: status 200');
  ok(res.body.includes('<nav aria-label="Main navigation">'), 'T9.2: body has nav with aria-label');
  ok(res.body.includes('href="/journey"'),    'T9.3: Journeys link present');
  ok(res.body.includes('href="/skills"'),     'T9.4: Run a Skill link present');
  ok(res.body.includes('href="/org/kanban"'), 'T9.5: Org board link present');
}
```

- [ ] **Step 3: Update `tests/e2e/wuce18-keyboard-nav.spec.ts`**

```typescript
withAuth('keyboard user can reach all nav links via Tab', async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.goto('/dashboard');
  const labels = ['Journeys', 'Run a Skill', 'Org board'];
  for (const label of labels) {
    const link = page.locator(`nav a:text("${label}")`);
    await link.focus();
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused).toBe(label);
  }
});
```

(Second test in the file, `'focused nav link has visible outline'`, is unaffected — it only depends on the first nav link existing and receiving Tab focus, and does not name a specific label.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-wuce18-html-shell.js
npx playwright test tests/e2e/wuce18-keyboard-nav.spec.ts
```

Expected output: all tests pass (0 failures).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add tests/check-wuce18-html-shell.js tests/e2e/wuce18-keyboard-nav.spec.ts
git commit -m "test(b1): update wuce.18 nav assertions for the new NAV_ITEMS shape"
```

---

## Final task: full verification pass

- [ ] Run `npm test` — confirm 0 failures across the whole suite
- [ ] Run `npx playwright test tests/e2e/b1-nav-toggle.spec.js tests/e2e/wuce18-keyboard-nav.spec.ts` — confirm 0 failures
- [ ] Walk the AC verification script (`artefacts/2026-07-21-web-ui-experience-redesign/verification-scripts/b1-verification.md`) against the test evidence
- [ ] Proceed to `/verify-completion` then `/branch-complete` (draft PR only)
