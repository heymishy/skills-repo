# Sign-Off at a Stage (Approval Record & Advance) — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** A collaborator can click "Sign Off" on a completed stage, enter a reason, and have that approval recorded as a real decisions.md entry (approver, stage, reason) before the feature advances to the next stage via the existing, unmodified gate-confirm mechanism.
**Branch:** `feature/ep2-s3`
**Worktree:** `.worktrees/ep2-s3`
**Test command:** `npm test` (unit/integration), `npm run test:e2e -- ep2-s3` (E2E)

---

## Architecture correction (read before starting — see decisions.md, 2026-09-18, for full rationale)

This is the largest architecture correction in this feature so far. The DoR assumed a new `feature_approvals` table, a new `/api/features/{featureId}/approve` route, and stage-advance logic built from scratch. None of this is needed:

1. **`handlePostGateConfirm`** (`routes/journey.js`, `POST /api/journey/:journeyId/gate-confirm`) is the real, already-shipped, production-hardened "advance to next stage" mechanism — disk write, Postgres dual-write, git-repo commit, DoR validation, pipeline-state notification, PostHog capture, `completeStage()`. **Do not modify it.** It is triggered today by a plain "Continue to [nextStage] →" button rendered in `routes/skills.js` (the skill-session chat page), not `features.js`. **This is the real UI location for the new Sign Off button** — right next to the existing Continue button, not on the `features.js` artefact-listing page ep2-s1/ep2-s2 extended.
2. **`handlePostDecisions`** (`routes/journey.js`, `POST /api/journey/:journeyId/decisions`, story `owle.2`) is the real, already-shipped decisions.md-write mechanism — path-traversal-guarded, auto-creates the file, appends via `fs.appendFileSync`. Real entry format: `## {title}` / `**Date:**` / `**Context:**` / `**Decision:**` / `**Rationale:**` — not the AC3 text's own field list (`session-phase: discovery-approved` is `capture-log.md`'s schema, a different file/convention). **Note: `handlePostDecisions` itself has no CSRF guard — a pre-existing gap, unrelated to this story, not fixed here.**
3. **No `feature_approvals` table.** decisions.md is this repo's own established durable accountability record (per `CLAUDE.md`'s own stated convention). A new table would duplicate what `handlePostDecisions`'s pattern already durably records.
4. **The real 8-stage sequence and `getNextStage()` already exist** in `modules/journey-store.js` (`STAGE_SEQUENCE`, confirmed identical to `stage-visibility.js`'s own `ALL_STAGES` from `ep2-s2`) — reuse `getNextStage(currentStage)` directly, don't hardcode a third copy of the stage list.
5. **CSRF guard is mandatory on the new endpoint**, matching `handlePostGateConfirm`'s own convention (which has one) rather than `handlePostDecisions`'s apparent gap (which doesn't) — this codebase's own established rule (enforced and fixed as a real security gap in an earlier story, `ep1-s2`) is every mutating POST handler self-guards via `_csrf.csrfGuard()`.

**The real flow:** collaborator finishes a stage's artefact → skill-session chat page shows both "Continue to [nextStage] →" (existing, unchanged) and a new "Sign Off" button → clicking Sign Off opens a modal (reason field) → submitting POSTs to the new `/api/journey/:journeyId/approve` endpoint, which validates the reason, resolves the approver from session, and writes a decisions.md entry → on success, the client submits the **existing, unmodified** gate-confirm form to actually advance the stage.

---

## File map

```
Create:
  src/web-ui/public/approval-modal.js             — client-side: modal render/submit + chained gate-confirm call
  tests/check-ep2-s3-approval.js                  — unit + integration tests (AC1-3)
  tests/e2e/ep2-s3-approval.spec.js                — E2E tests (AC1-3)

Modify:
  src/web-ui/routes/journey.js                     — add 1 handler: POST /api/journey/:journeyId/approve
  src/web-ui/routes/skills.js                      — add the "Sign Off" button + modal container next to the existing "Continue to [nextStage]" button
  src/web-ui/server.js                              — wire the new route + the new /public/approval-modal.js static route (together, same task — learned from ep2-s1's missed-route bug, applied again in ep2-s2, applying a third time here)
```

---

## Task 1: journey.js — the approval endpoint

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-ep2-s3-approval.js` (Part 1)

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// tests/check-ep2-s3-approval.js — Part 1
const assert = require('assert');
const journeyRoute = require('../src/web-ui/routes/journey');

async function testApprovalHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handlePostJourneyApprove, 'function');
}
testApprovalHandlerExists()
  .then(() => console.log('  ok - approval handler exported'))
  .catch((err) => { console.error('  FAIL - testApprovalHandlerExists:', err.message); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s3-approval.js
```

Expected: `AssertionError: undefined !== 'function'`

- [ ] **Step 3: Write the implementation**

Read `handlePostDecisions` (search `routes/journey.js` for `async function handlePostDecisions`) in full first, to confirm the exact entry-writing logic and path-traversal guard you are reusing the pattern of — do not paraphrase from memory. Read `handlePostGateConfirm`'s own CSRF guard line (`var csrfOk = await _csrf.csrfGuard(req, res);`) to confirm the exact call shape.

Add this handler near `handlePostDecisions` (same subject-matter neighborhood — decisions.md writes):

```javascript
/**
 * POST /api/journey/:journeyId/approve — ep2-s3 AC1/AC2/AC3.
 * Records a Sign Off approval (approver, stage, reason) as a decisions.md
 * entry using the same real disk-write pattern handlePostDecisions already
 * establishes (owle.2) -- does NOT advance the stage itself; the client
 * calls the existing, unmodified gate-confirm endpoint separately for that,
 * per the architecture correction in decisions.md (2026-09-18).
 */
async function handlePostJourneyApprove(req, res, pool) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
    return;
  }
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  var body = req.body || {};
  var reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Reason cannot be empty' }));
    return;
  }
  if (reason.length > 500) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Reason must be 500 characters or fewer' }));
    return;
  }

  var stage = journey.activeSkill || '';
  var nextStage = _journeyStore.getNextStage(stage) || 'the next stage';
  var approverLogin = req.session.login || 'unknown';
  // ep2-s3: req.session has no roleId field -- confirmed absent anywhere in
  // this codebase (grepped before writing this plan). Role comes from
  // feature_collaborators, the same real source ep2-s1/ep2-s2 already
  // established: resolve the approver's own row by matching userId against
  // req.session.login. `_featureCollaboratorStore` is already required at
  // the top of this file from ep2-s1's own Task 2 (confirm, don't re-require).
  var approverRole = null;
  try {
    var _collaborators = await _featureCollaboratorStore.getFeatureCollaborators(pool, journeyId);
    var _me = _collaborators.find(function (c) { return c.userId === approverLogin; });
    approverRole = _me ? _me.roleId : null;
  } catch (_roleErr) {
    approverRole = null; // non-fatal: the entry is still written, just without a role label
  }

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot(req);
  var decisionsPath = path.resolve(repoRoot, 'artefacts', featureSlug, 'decisions.md');
  var guard = path.resolve(repoRoot, 'artefacts', featureSlug);
  if (!guard.startsWith(repoRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  var date = new Date().toISOString().slice(0, 10);
  var title = stage + ' approved by ' + approverLogin + (approverRole ? ' (' + approverRole + ')' : '');
  var context = 'Approval recorded via Sign Off at the ' + stage + ' stage of feature ' + featureSlug + '.';
  var decision = stage + ' approved and advancing to ' + nextStage + '.';
  var entry = '\n## ' + title + '\n\n'
    + '**Date:** ' + date + '\n'
    + '**Context:** ' + context + '\n'
    + '**Decision:** ' + decision + '\n'
    + '**Rationale:** ' + reason + '\n';

  try {
    var dir = path.dirname(decisionsPath);
    fs.mkdirSync(dir, { recursive: true });
    var header = '# Decisions — ' + featureSlug + '\n';
    if (!fs.existsSync(decisionsPath)) {
      fs.writeFileSync(decisionsPath, header, 'utf8');
    }
    fs.appendFileSync(decisionsPath, entry, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ written: decisionsPath, stage: stage, nextStage: nextStage, approver: approverLogin }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to write approval record', detail: err.message }));
  }
}
```

Add `handlePostJourneyApprove` to the existing `module.exports` block at the bottom of `journey.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s3-approval.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Foreground, wait for completion (~6-7 min). Expect only the one pre-existing documented failure.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-ep2-s3-approval.js
git commit -m "feat(ep2-s3): add approval endpoint recording Sign Off as a real decisions.md entry"
```

End with:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LRzhh2nSVKZkmhjhyJXtfN
```

---

## Task 2: server.js — wire the route + client component + its static route (together)

**Files:**
- Modify: `src/web-ui/server.js`
- Create: `src/web-ui/public/approval-modal.js`

Same lesson as `ep2-s2`'s own Task 3: pair the client script and its static route in the same commit as the route wiring, in one task, to avoid a repeat of `ep2-s1`'s missed-route bug.

- [ ] **Step 1: Wire the approval route**

Add `handlePostJourneyApprove` to the existing `require('./routes/journey')` destructure in `server.js` (do not duplicate the require). Find the existing `/api/journey/:journeyId/gate-confirm` route branch (search for `gate-confirm`) and add a sibling branch immediately after it, passing `_pshPool` (the same pool variable already confirmed correct at this exact point in the file for `ep2-s1`'s and `ep2-s2`'s own sibling `/api/journey/:journeyId/...` routes — verify it's still the right variable by reading the surrounding ~20 lines, don't assume it's unchanged):

```javascript
} else if (pathname.match(/^\/api\/journey\/([^/]+)\/approve$/) && req.method === 'POST') {
  req.params = { journeyId: pathname.split('/')[3] };
  await handlePostJourneyApprove(req, res, _pshPool);
```

- [ ] **Step 2: Write the client component**

```javascript
// src/web-ui/public/approval-modal.js — ep2-s3
// Sign Off modal: reason-capture form that (1) POSTs to the new
// /api/journey/:journeyId/approve endpoint to record the approval as a
// decisions.md entry, then (2) on success, submits the EXISTING,
// unmodified gate-confirm form to actually advance the stage -- see
// decisions.md (2026-09-18) for why this two-step client-side chain,
// rather than touching handlePostGateConfirm directly.
(function () {
  'use strict';

  function init() {
    var signOffBtn = document.getElementById('sign-off-btn');
    var modal = document.getElementById('sign-off-modal');
    if (!signOffBtn || !modal) return;

    var journeyId = signOffBtn.getAttribute('data-journey-id');
    var csrfToken = signOffBtn.getAttribute('data-csrf-token');
    var reasonInput = document.getElementById('sign-off-reason');
    var approveBtn = document.getElementById('sign-off-approve-btn');
    var cancelBtn = document.getElementById('sign-off-cancel-btn');
    var errorEl = document.getElementById('sign-off-error');
    var gateConfirmForm = document.querySelector('form[action^="/api/journey/"][action$="/gate-confirm"]');

    function showModal() {
      modal.style.display = 'block';
      errorEl.textContent = '';
      if (reasonInput) reasonInput.focus();
    }
    function hideModal() {
      modal.style.display = 'none';
    }

    signOffBtn.addEventListener('click', showModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    approveBtn.addEventListener('click', function () {
      var reason = reasonInput ? reasonInput.value.trim() : '';
      if (!reason) {
        errorEl.textContent = 'Reason cannot be empty';
        return;
      }
      fetch('/api/journey/' + encodeURIComponent(journeyId) + '/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason, _csrf: csrfToken })
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (body) { throw new Error(body.error || 'Approval failed'); });
          return r.json();
        })
        .then(function () {
          hideModal();
          // Chain into the existing, unmodified gate-confirm mechanism to
          // actually advance the stage -- same real form the plain
          // "Continue to [nextStage]" button already submits.
          if (gateConfirmForm) gateConfirmForm.submit();
        })
        .catch(function (err) {
          errorEl.textContent = err.message || 'Approval failed. Please try again.';
        });
    });
  }

  init();
})();
```

- [ ] **Step 3: Add the static route**

Find the existing `GET /public/stage-list.js` route (from `ep2-s2`) and add a sibling route immediately after it:

```javascript
} else if (pathname === '/public/approval-modal.js' && req.method === 'GET') {
  res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  res.end(require('fs').readFileSync(require('path').join(__dirname, 'public', 'approval-modal.js'), 'utf8'));

```

- [ ] **Step 4: Verify ci-typecheck.js already excludes this file**

```bash
node scripts/ci-typecheck.js
```

Expected: no error mentioning `approval-modal.js` — the existing `src/web-ui/public/` exclusion (added during `ep2-s1`) already covers it.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/public/approval-modal.js src/web-ui/server.js
git commit -m "feat(ep2-s3): add client-side Sign Off modal, its static route, and approval-endpoint wiring"
```

---

## Task 3: skills.js — inject the Sign Off button into the real skill-session chat page

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Test: `tests/check-ep2-s3-approval.js` (Part 2, smoke check only)

- [ ] **Step 1: Read the exact current state first**

Read `routes/skills.js` around the `ougl.4` journey-gate panel (search for `journey-aware gate-confirm button` — the block building `journeyPanel` with the existing "Continue to [nextStage] →" form). Confirm the exact current markup before editing — do not assume.

- [ ] **Step 2: Add the Sign Off button + modal markup**

In the same `else` branch that renders the "Continue to [nextStage] →" form (i.e. NOT the `definition-of-ready`/"View journey complete" branch — Sign Off applies to any in-progress stage transition, matching AC1's own "Hamish... is at the discovery stage" example), add a Sign Off button and modal container immediately before or after the existing form, inside the same `journeyPanel` string:

```javascript
'<button type="button" id="sign-off-btn" data-journey-id="' + safeJourneyId + '" data-csrf-token="' + escHtml(csrfToken) + '" class="sw-btn sw-btn--secondary">Sign Off</button>' +
'<div id="sign-off-modal" style="display:none;position:fixed;top:20%;left:50%;transform:translateX(-50%);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:20px;z-index:1000;min-width:320px">' +
  '<h3>Approve ' + escHtml(skillName) + '</h3>' +
  '<label for="sign-off-reason">Reason for approval</label>' +
  '<input type="text" id="sign-off-reason" placeholder="Reason for approval..." style="width:100%;margin:8px 0" maxlength="500">' +
  '<div id="sign-off-error" style="color:#dc2626;font-size:13px;margin-bottom:8px"></div>' +
  '<button type="button" id="sign-off-approve-btn" class="sw-btn sw-btn--primary">Approve</button>' +
  '<button type="button" id="sign-off-cancel-btn" class="sw-btn">Cancel</button>' +
'</div>' +
'<script src="/public/approval-modal.js"></script>'
```

Concatenate this onto the same string variable the existing "Continue to [nextStage]" form markup is built into (find the exact variable name from your Step 1 read — likely `journeyPanel` — and append, do not replace or reorder anything existing).

`csrfToken` should already be in scope in this function (the existing gate-confirm form already embeds a CSRF field via `_csrf.csrfField(csrfToken)` — confirm the exact variable name holding the raw token value, not just the pre-rendered hidden-field HTML, since the modal's JS needs the raw token string in a `data-` attribute, not a form-embedded hidden input).

- [ ] **Step 3: Smoke check**

```javascript
'use strict';
// tests/check-ep2-s3-approval.js — Part 2
function testSkillsHandlerStillExported() {
  const skillsRoute = require('../src/web-ui/routes/skills');
  assert.strictEqual(typeof skillsRoute, 'object');
}
testSkillsHandlerStillExported();
console.log('  ok - routes/skills.js still loads after Sign Off button injection');
```

(Append to `tests/check-ep2-s3-approval.js`. This is a minimal smoke check — real behavioral proof is Task 5's E2E test, matching the established pattern from `ep2-s1`/`ep2-s2`'s own equivalent "page-still-loads" checks for a heavily-tested existing file.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s3-approval.js
```

- [ ] **Step 5: Run full suite — no regressions (critical for this task)**

```bash
npm test
```

`routes/skills.js` is this codebase's single largest, most heavily-used file (6,000+ lines, the entire skill-session chat flow). Foreground, wait for completion. If ANY test touching `skills.js` fails, this edit broke existing behavior — investigate before committing. This must be a pure append to the existing `journeyPanel` string, never a reorder.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-ep2-s3-approval.js
git commit -m "feat(ep2-s3): inject Sign Off button and modal into the skill-session chat page"
```

---

## Task 4: Integration tests — full approval path, isolation

**Files:**
- Modify: `tests/check-ep2-s3-approval.js` (Part 3)

- [ ] **Step 1: Write the tests**

```javascript

// tests/check-ep2-s3-approval.js — Part 3
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testFullApprovalPathWritesDecisionsEntry() {
  // Build a minimal, real req/res harness against handlePostJourneyApprove,
  // using a real temp directory as repoRoot so the real fs.appendFileSync
  // path is genuinely exercised (matching this codebase's own established
  // pattern for testing disk-writing handlers -- do not mock fs itself).
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s3-test-'));
  const featureSlug = 'test-feature-approval';
  // ... construct a fake journey via _journeyStore, a fake req/res, call
  // handlePostJourneyApprove directly, then read back tmpRoot's
  // artefacts/test-feature-approval/decisions.md and assert its content
  // contains the expected title/date/context/decision/rationale fields.
  // Clean up tmpRoot afterward.
}
// NOTE TO IMPLEMENTER: fill in testFullApprovalPathWritesDecisionsEntry's
// body following handlePostDecisions's own existing test file's pattern
// for constructing a real journey + real req/res + real temp repoRoot --
// search tests/ for an existing test of handlePostDecisions itself (owle.2)
// and mirror its harness construction exactly, rather than inventing a new
// one. Then add a second test proving reason validation (empty reason ->
// 400, no file written) and a third proving the entry uses the REAL
// decisions.md field format (title/Date/Context/Decision/Rationale), not
// the DoR's own literal (and non-existent) session-phase field.
```

- [ ] **Step 2: Run — must pass, then full suite**

```bash
node tests/check-ep2-s3-approval.js
npm test
```

- [ ] **Step 3: Commit**

```bash
git add tests/check-ep2-s3-approval.js
git commit -m "test(ep2-s3): add integration tests for the full approval-to-decisions.md write path"
```

---

## Task 5: E2E and NFR tests

**Files:**
- Create: `tests/e2e/ep2-s3-approval.spec.js`

- [ ] **Step 1: Investigate before writing**

Read `tests/e2e/ep2-s1-presence-sidebar.spec.js` and `tests/e2e/ep2-s2-stage-visibility.spec.js` for this feature's established real E2E fixture pattern. **Important difference from those two stories**: ep2-s3's Sign Off button lives on the skill-session CHAT page (`/skills/:skillName/sessions/:sessionId/chat`), not `/features/:featureSlug`. Investigate the real flow to reach that page in a test: create a product → repo seed → pod → feature (as established), which redirects to a discovery chat session — that redirect IS the page this story's UI change lives on. You do not need to drive a full skill turn to completion first unless the Sign Off button's real guard (`session.done && session.journeyId`) requires it — check this condition in `skills.js` (confirmed present, per the plan's Task 3 investigation) and determine whether the E2E test needs to complete a turn (e.g. via a mocked/test-only turn-completion path, if one already exists in this codebase's E2E fixtures — check `tests/e2e/fixtures/` and sibling specs for a precedent) before the Sign Off button becomes visible. Do not guess; read the real gating condition and find or build the minimal real path to satisfy it.

- [ ] **Step 2: Write the E2E spec**

Cover:
- **AC1**: the Sign Off button and modal (reason field, Approve button) are visible once a stage session is `done`, without scrolling.
- **AC2**: entering a reason and clicking Approve results in the feature advancing to the next stage (assert via the same real mechanism `gate-confirm` already produces — e.g. `journey.completedStages` now includes the approved stage, or the resulting page state, matching how `ep1-s3`'s own E2E spec proved pod-inheritance via real DB state rather than trusting a redirect alone).
- **AC3**: after approval, `artefacts/<featureSlug>/decisions.md` contains a new entry with the real field format (title/Date/Context/Decision/Rationale) including the exact reason text entered — read this via a test-only endpoint if needed (matching the established `/test/pod-inheritance-state/:sessionId` precedent from `ep1-s3`), or directly via the approval endpoint's own 200 response body if it's sufficient proof (check what the endpoint returns before deciding whether a new test-only read endpoint is needed).

- [ ] **Step 3: Run the E2E spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/ep2-s3-approval.spec.js
```

Foreground, wait for it to actually finish. Investigate and fix real bugs found; do not weaken assertions to pass.

- [ ] **Step 4: NFR verification (documentation, not new test files)**

- **NFR: modal appears within 500ms** — RISK-ACCEPT, not automated (same reasoning as every prior story's NFR-latency RISK-ACCEPTs — pure client-side DOM show, no network call).
- **NFR: feature stage updates within 2s of approval** — covered by the E2E test's own real-time assertion if it waits for and confirms the actual advance within a bounded timeout.
- **NFR: keyboard-accessible modal** — add a cheap Playwright check (Tab to reason field, Enter or button-click to submit) if straightforward; otherwise RISK-ACCEPT and say so explicitly.
- **NFR: decisions.md entry visible within 2s** — covered by the AC3 E2E assertion itself.

- [ ] **Step 5: Run the Node suite too — no regressions**

```bash
node tests/check-ep2-s3-approval.js
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/ep2-s3-approval.spec.js
git commit -m "test(ep2-s3): add E2E coverage for Sign Off modal, approval advance, and decisions.md entry"
```

---

## Post-plan note for /verify-completion

This story's diff touches `routes/skills.js` — the single largest, most heavily-used file in this codebase. `/verify-completion`'s mandatory route/handler E2E coverage check will need to find and run every pre-existing `tests/e2e/*.spec.js` file that exercises the skill-session chat page, not just this story's own new spec — expect this to be a larger set than `ep2-s1`/`ep2-s2`'s own equivalent checks found. Budget real time for this.

Any RISK-ACCEPTs taken in Task 5 Step 4 must be logged in `artefacts/new-feature-2b74a292/decisions.md` before `/definition-of-done`.
