# Relocate the theme toggle into Settings — Implementation Plan

> **For agent execution:** Executed directly (single session), following /tdd per task.

**Goal:** Move the dark/light mode toggle from the persistent topbar into Settings' Profile tab, reusing `swToggleTheme()` unchanged, and add a PostHog click-rate capture on the relocated control.
**Branch:** `feature/si-s1-relocate-theme-toggle`
**Worktree:** `.worktrees/si-s1-relocate-theme-toggle`
**Test command:** `npm test` (full suite via `node scripts/run-all-tests.js`); scoped file: `node tests/check-si-s1-theme-toggle-relocation.js`

---

## Pre-implementation note: DoR contract deviation (AC4)

The DoR contract's "Estimated touch points" lists `Services: none. APIs: none.` and does not
mention `src/web-ui/server.js`. However, AC4 requires a click on the relocated toggle to fire
`_posthog.capture` — and every existing `_posthog.capture` call site in this codebase
(`team-management.js`, `journey.js`, `products.js`) fires from inside a server-side route
handler that a client action already had to call over the network for its own primary purpose
(inviting a teammate, creating a journey, etc). The theme toggle has no such existing network
call — it is a zero-network, client-only DOM/localStorage flip by design (that is the point of
the feature). The NFR profile also explicitly forbids adding a new client-side dependency
("does not add new client-side dependencies"), which rules out loading the browser PostHog
snippet (as `landing.js`/`skills.js` do) just for this one control.

The only way to satisfy AC4 (using the real, testable `_posthog.capture` Node convention) without
violating the performance NFR is a small new fire-and-forget POST endpoint that the relocated
button's `onclick` calls via `fetch()` — mirroring the existing `swExitImpersonation()`
fetch-on-click pattern already in `html-shell.js`'s `SHELL_JS`. This necessarily touches
`server.js` (one new route, `authGuard`-gated, no new adapter, no CSRF — see Task 3 rationale)
which the contract's touch-point list did not anticipate.

Per `CLAUDE.md`'s B1/D1 contract-vs-test-plan rule ("when the two conflict, the contract is the
authoring defect: update the contract to match the ACs and test plan, not the other way around"),
this plan proceeds with the minimal endpoint needed to satisfy AC4 and the NFR simultaneously,
and flags the deviation explicitly here, in `decisions.md`, and in the PR description/comment —
per the DoR's own ambiguity-handling instruction — rather than blocking entirely on a Complexity-1,
Low-oversight story where a reasoned, precedent-matching resolution exists.

---

## File map

```
Create:
  tests/check-si-s1-theme-toggle-relocation.js  — AC1-AC4 + accessibility NFR tests

Modify:
  src/web-ui/utils/html-shell.js  — extract renderThemeToggle() (exported), remove the
                                     inline button from renderShell()'s topbar markup,
                                     add swCaptureThemeToggle() to SHELL_JS
  src/web-ui/routes/settings.js   — renderProfileTab() renders the toggle via
                                     _htmlShell.renderThemeToggle(); add
                                     handlePostThemeToggleClicked (AC4 capture endpoint)
  src/web-ui/server.js            — wire POST /settings/theme-toggle-clicked
```

---

## Task 1: Write the failing test file (AC1-AC4 + NFR)

**Files:**
- Create: `tests/check-si-s1-theme-toggle-relocation.js`

- [ ] **Step 1: Write the failing test file**

Covers, matching `artefacts/2026-08-17-settings-improvements/test-plans/si-s1-test-plan.md`:
- `rendersThemeToggleInProfileTab` (AC1)
- `themeToggleClickFlipsDataThemeAndLocalStorage` (AC2 — markup/onclick + unmodified-function source assertion)
- `themeToggleExistsInExactlyOneLocation` (AC3, edge case: absent from topbar, exactly one in Settings)
- `themeToggleClickFiresPostHogEvent` (AC4)
- `themeToggleRetainsAccessibilityAttributes` (NFR — Accessibility)
- `serverWiresThemeToggleCaptureRoute` (bonus source-inspection check, matches `check-c1-settings-shell-and-profile-tab.js`'s existing wiring-check convention)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-si-s1-theme-toggle-relocation.js
```

Expected output: multiple `[FAIL]` lines — `renderThemeToggle is not a function`, `handlePostThemeToggleClicked is not a function`, and markup assertions failing (button not yet in Profile tab, still in topbar).

---

## Task 2: `html-shell.js` — extract `renderThemeToggle()`, remove from topbar, add capture hook

**Files:**
- Modify: `src/web-ui/utils/html-shell.js`

- [ ] **Step 1: Extract the button markup into an exported function, called with the new capture hook**

Insert immediately before `function renderShell(opts) {`:

```javascript
/**
 * si-s1 — the dark/light mode toggle button, extracted as a shared render
 * function so callers outside the shell (Settings' Profile tab) can reuse
 * the exact same markup/classes/handler instead of duplicating the string
 * (Architecture Constraints: do not duplicate or reimplement toggle logic).
 * AC4: also fires swCaptureThemeToggle() (SHELL_JS, always loaded via
 * renderShell) for the click-rate PostHog event -- swToggleTheme() itself is
 * untouched; this only adds a second call alongside it in the onclick.
 * @returns {string}
 */
function renderThemeToggle() {
  return (
    '<button class="sw-theme-toggle" onclick="swToggleTheme();swCaptureThemeToggle()" aria-label="Toggle dark mode" title="Toggle dark/light mode">' +
      '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--light" aria-hidden="true">☀</span>' +
      '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--dark" aria-hidden="true">☾</span>' +
    '</button>'
  );
}
```

- [ ] **Step 2: Remove the inline `themeToggle` const and its use in `renderShell()`**

In `renderShell(opts)`, delete:

```javascript
  const themeToggle =
    '<button class="sw-theme-toggle" onclick="swToggleTheme()" aria-label="Toggle dark mode" title="Toggle dark/light mode">' +
      '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--light" aria-hidden="true">☀</span>' +
      '<span class="sw-theme-toggle-icon sw-theme-toggle-icon--dark" aria-hidden="true">☾</span>' +
    '</button>';
```

Change:

```javascript
      '<div class="sw-topbar-actions">' + headerActions + themeToggle + '</div>' +
```

to:

```javascript
      '<div class="sw-topbar-actions">' + headerActions + '</div>' +
```

- [ ] **Step 3: Add `swCaptureThemeToggle()` to `SHELL_JS`**

Immediately after the existing `window.swToggleTheme=function(){...};` block inside `SHELL_JS`, insert:

```javascript
    // si-s1 (AC4): fire-and-forget click-rate capture for the relocated
    // toggle -- POSTs to /settings/theme-toggle-clicked, which calls the
    // existing server-side _posthog.capture() convention (routes/settings.js).
    // Mirrors swExitImpersonation's existing fetch-on-click pattern below;
    // failures are swallowed silently -- analytics only, never blocks the
    // theme switch itself.
    'window.swCaptureThemeToggle=function(){' +
      'fetch(\'/settings/theme-toggle-clicked\',{method:\'POST\'}).catch(function(){});' +
    '};' +
```

- [ ] **Step 4: Export `renderThemeToggle`**

Change the final line:

```javascript
module.exports = { renderShell, renderLoginPage, escHtml, NAV_ITEMS, renderThemeToggle };
```

- [ ] **Step 5: Run the scoped test — AC1/AC3 markup assertions should now progress**

```bash
node tests/check-si-s1-theme-toggle-relocation.js
```

Expected output: AC3 topbar-absence assertion passes; AC1 still fails (Profile tab doesn't render it yet — Task 3).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/utils/html-shell.js
git commit -m "refactor: extract theme toggle markup from topbar into shared renderThemeToggle()"
```

---

## Task 3: `settings.js` — render the toggle in the Profile tab + AC4 capture endpoint

**Files:**
- Modify: `src/web-ui/routes/settings.js`

- [ ] **Step 1: Import `_posthog`**

Add near the other `require` lines at the top:

```javascript
var _posthog = require('../modules/posthog-server'); // si-s1 (AC4)
```

- [ ] **Step 2: Render the toggle inside `renderProfileTab()`**

Insert an "Appearance" section right after the existing `<ul class="sw-list">...</ul>` sign-in-methods block, still inside the `#tab-panel-profile` wrapper:

```javascript
      '<div class="sw-section-title">Appearance</div>' +
      '<div class="sw-card sw-card--lg" style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
        '<div>' +
          '<div style="font-weight:600;font-size:14px">Dark mode</div>' +
          '<div style="color:var(--muted);font-size:13px">Switch between light and dark theme</div>' +
        '</div>' +
        _htmlShell.renderThemeToggle() +
      '</div>' +
```

- [ ] **Step 3: Add the AC4 capture handler**

Add after `renderProfileTab`'s closing brace (or any convenient module-level spot before `createSettingsHandlers`):

```javascript
/**
 * si-s1 (AC4) — fire-and-forget capture endpoint for the relocated theme
 * toggle's click-rate metric. Called via fetch() from swCaptureThemeToggle()
 * (html-shell.js SHELL_JS) alongside the existing swToggleTheme() call --
 * this route never touches theme state itself, it only records the event.
 * No CSRF token: capture-only, no state mutation, gated by authGuard's
 * session check same as every other /settings route (see decisions.md for
 * the DoR contract touch-point deviation this route required).
 * @param {object} req
 * @param {object} res
 */
async function handlePostThemeToggleClicked(req, res) {
  var distinctId = (req.session && (req.session.login || req.session.tenantId)) || 'anonymous';
  _posthog.capture(distinctId, 'settings_theme_toggle_clicked', {
    tenant_id: req.session && req.session.tenantId
  });
  res.writeHead(204);
  res.end();
}
```

- [ ] **Step 4: Export the new handler**

Add to `module.exports`:

```javascript
  handlePostThemeToggleClicked: handlePostThemeToggleClicked
```

- [ ] **Step 5: Run the scoped test — AC1, AC2, AC4 should now pass; AC3/wiring pending Task 4**

```bash
node tests/check-si-s1-theme-toggle-relocation.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/settings.js
git commit -m "feat: render theme toggle in Settings Profile tab, add click-capture endpoint"
```

---

## Task 4: `server.js` — wire the capture route

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Import the new handler**

Change:

```javascript
const { createSettingsHandlers } = require('./routes/settings'); // c1
```

to:

```javascript
const { createSettingsHandlers, handlePostThemeToggleClicked } = require('./routes/settings'); // c1 / si-s1
```

- [ ] **Step 2: Register the route**

Immediately after the `/settings` GET block (before the `/settings/link-account` GET block), insert:

```javascript
  } else if (pathname === '/settings/theme-toggle-clicked' && req.method === 'POST') {
    // si-s1 (AC4) -- fire-and-forget click-rate capture for the relocated
    // theme toggle; see routes/settings.js's handlePostThemeToggleClicked.
    authGuard(req, res, () => handlePostThemeToggleClicked(req, res));

```

- [ ] **Step 3: Run the scoped test — all tests should now pass**

```bash
node tests/check-si-s1-theme-toggle-relocation.js
```

Expected output: `[si-s1] 6 passed, 0 failed` (or similar — all tests green).

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same count as baseline + 6 new).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire POST /settings/theme-toggle-clicked route"
```

---

## Task 5: Verification script walkthrough + decisions.md entry

- [ ] Walk `artefacts/2026-08-17-settings-improvements/verification-scripts/si-s1-verification.md` scenarios 1-3 + edge case against the test evidence (no live browser session available in this dispatch — mark verified-by-test-evidence, not manually clicked, and note this explicitly).
- [ ] Add a `decisions.md` entry documenting the AC4 contract deviation (new `server.js` route not in the original touch-point list).
