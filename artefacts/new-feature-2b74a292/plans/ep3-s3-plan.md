# Re-Sign-Off After Regression — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make the audit trail distinguish a re-approval following a regression from a first-time approval — the one real gap in this story's scope, since stage-advance behavior already works identically either way with zero new code.
**Branch:** `feature/ep3-s3`
**Worktree:** `.worktrees/ep3-s3`
**Test command:** `npm test` (full suite) / `node tests/<file>.js` (single file)

---

## Pre-verified findings (see `decisions.md` for the full investigation)

- **`ep3-s3`'s DoR/test-plan assume a fictional architecture**: `routes/approval.js`, a new `approval-recorder.js` module, a `feature_approvals` table with a `reApprovalOf` foreign key, `POST /api/features/{featureId}/approvals`. None exists.
- **AC2 needs zero new code.** `handlePostGateConfirm` operates purely on the current session's `done` state and `journey.activeSessionId` — it has no branching on approval history and doesn't need any. After a regression (`ep3-s1`) clears the target stage's `completedStages` entry, the normal revise→approve→gate-confirm flow advances the stage through the exact same code path as a first-time completion. Verified by reading `handlePostGateConfirm` directly — confirmed, not assumed.
- **AC1's literal `reApprovalOf` FK is impossible** (no table, no `id` to link to) — but its substance (the audit trail should show this follows a prior regression, not look identical to a first-time approval) is a real, currently-unmet gap in `handlePostJourneyApprove`'s decisions.md entry.
- **The fix**: detect, by reading `decisions.md` itself (the only persistent record), whether the most recent entry mentioning this exact stage was a `"Regressed to <stage>"` entry. If so, use a distinct title (`"<stage> re-approved by <user>"`, matching this codebase's own established title-pattern-as-type-marker convention) and reference the regression in the context text.
- **AC3's "distinct from, not overwriting" is trivially true** (append-only, already the case) — the fix above additionally makes the entry's *content* meaningfully distinct (different verb, explicit regression reference), not just positionally distinct.

---

## File map

```
Modify:
  src/web-ui/routes/journey.js — handlePostJourneyApprove: detect regression-then-approval and adjust the decisions.md entry's title/context/decision text accordingly

Create:
  tests/check-ep3-s3-reapproval.js — real regress → re-approve cycle, asserting the entry is distinctly marked and references the regression, plus a first-approval control case proving the detection doesn't false-positive
```

---

## Task 1: Re-approval detection in the decisions.md entry (AC1, AC3)

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-ep3-s3-reapproval.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(REPO_ROOT_ADAPTER_PATH)]; } catch (_) {}
  return { jStore: require(JOURNEY_STORE_PATH), j: require(JOURNEY_PATH) };
}

function makeRes() {
  const res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

const CSRF_TOKEN = 'csrf-tok-ep3s3';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

function lastEntryTitle(content) {
  const entries = content.split(/\n## /).slice(1);
  return entries[entries.length - 1].split('\n')[0].trim();
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

async function main() {
  // --- Scenario A: first-time approval (control case -- must NOT be marked as a re-approval) ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s3-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s3-first-approval';
    const j = r.jStore.createJourney(featureSlug, 'default');
    r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'definition', tenantId: 'tenant-a', ownerId: 'susan' });

    const res = makeRes();
    await r.j.handlePostJourneyApprove(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, reason: 'Definition looks complete and matches the benefit-metric target.' }
    }), res, null);
    check('Scenario A: handler returns 200', res._code === 200);

    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    const content = fs.readFileSync(decisionsPath, 'utf8');
    const title = lastEntryTitle(content);
    check('Scenario A: first-time approval title has NO "re-approved" marker (control case)', title.indexOf('re-approved') === -1);
    check('Scenario A: first-time approval title uses the plain "approved by" wording', title.indexOf('definition approved by susan') === 0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Scenario B: real regress -> re-approve cycle ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s3-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s3-reapproval-cycle';
    const j = r.jStore.createJourney(featureSlug, 'default');

    // Step 1: seed the ORIGINAL approval (as if it happened in a real prior session)
    r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
    r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
    r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
    r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'review', tenantId: 'tenant-a', ownerId: 'susan' });
    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
    fs.writeFileSync(decisionsPath, '# Decisions — ' + featureSlug + '\n\n## definition approved by susan (engineer)\n\n**Date:** 2026-09-20\n**Context:** Approval recorded via Sign Off at the definition stage of feature ' + featureSlug + '.\n**Decision:** definition approved and advancing to review.\n**Rationale:** Original approval, pre-regression.\n', 'utf8');

    // Step 2: REAL regression back to definition (calls the actual ep3-s1 handler)
    const regressRes = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Definition needs revision for multi-tenancy.' }
    }), regressRes, null);
    check('Scenario B: regression returns 200', regressRes._code === 200);
    check('Scenario B: activeSkill reset to definition by the real regression handler', r.jStore.getJourney(j.journeyId).activeSkill === 'definition');

    // Step 3: REAL re-approval of definition (this is the behavior under test)
    const approveRes = makeRes();
    await r.j.handlePostJourneyApprove(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, reason: 'Revised for multi-tenancy, re-approving.' }
    }), approveRes, null);
    check('Scenario B: re-approval returns 200', approveRes._code === 200);

    const finalContent = fs.readFileSync(decisionsPath, 'utf8');
    const entries = finalContent.split(/\n## /).slice(1);
    check('Scenario B: decisions.md now has 3 entries (original approval + regression + re-approval)', entries.length === 3);
    const reapprovalEntry = entries[entries.length - 1];
    const reapprovalTitle = reapprovalEntry.split('\n')[0].trim();
    check('AC1/AC3 substance: re-approval entry is distinctly titled ("re-approved", not plain "approved")', reapprovalTitle.indexOf('definition re-approved by susan') === 0);
    check('AC1 substance: re-approval entry\'s context references the prior regression (decisions.md-native equivalent of reApprovalOf linking)', /regression/i.test(reapprovalEntry));
    check('AC3: original approval entry (entries[0]) is untouched', entries[0].indexOf('definition approved by susan') === 0 && entries[0].indexOf('Original approval, pre-regression.') !== -1);
    check('AC3: regression entry (entries[1]) is untouched and distinct from the re-approval entry', entries[1].indexOf('Regressed to definition by susan') === 0);

    // AC2 substance (no new code needed -- verified here only that this story's OWN
    // change doesn't disturb journey state; handlePostGateConfirm's own pre-existing,
    // already-tested mechanics are what actually performs the stage advance and are
    // deliberately NOT re-tested here, matching ep2-s3's own established precedent of
    // not re-covering handlePostGateConfirm's own already-covered ground).
    const journeyAfter = r.jStore.getJourney(j.journeyId);
    check('AC2 substance: handlePostJourneyApprove does not itself mutate completedStages/activeSkill (matches its own documented "does not advance the stage itself" contract, identical for first-time and re-approval)', journeyAfter.activeSkill === 'definition' && !journeyAfter.completedStages.some(function(cs) { return cs.skillName === 'definition'; }));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('\n[ep3-s3-reapproval] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep3-s3-reapproval.js
```

Expected output: Scenario A passes (no code change needed for the control case — the current, unmodified handler already never says "re-approved"), Scenario B's `AC1/AC3 substance` and `AC1 substance` checks FAIL (current entry always says `"definition approved by susan"`, never distinguishes the regression case, so `reapprovalTitle.indexOf('definition re-approved by susan') === 0` is false and the regression-reference check finds nothing).

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/journey.js`, inside `handlePostJourneyApprove`, immediately before the existing `var date = new Date()...` line (i.e., after the path-traversal guard, before entry construction), insert:

```javascript
  // ep3-s3 (AC1/AC3): detect whether this approval follows a regression to
  // this exact stage -- decisions.md is the only persistent record (no
  // feature_approvals table exists), so detection reads it directly: if the
  // most recent entry mentioning this stage is a "Regressed to <stage>"
  // entry (rather than an earlier "<stage> approved by" / "<stage>
  // re-approved by" entry, or no prior mention at all), this is a
  // re-approval. This is the decisions.md-native equivalent of the DoR's
  // imagined reApprovalOf foreign key -- linkage by content/adjacency in an
  // append-only log, not a structured field nothing in this codebase reads.
  var isReApproval = false;
  if (fs.existsSync(decisionsPath)) {
    var existingContent = fs.readFileSync(decisionsPath, 'utf8');
    var existingEntries = existingContent.split(/\n## /).slice(1);
    for (var i = existingEntries.length - 1; i >= 0; i--) {
      var priorTitle = existingEntries[i].split('\n')[0].trim();
      if (priorTitle.indexOf('Regressed to ' + stage + ' by ') === 0) {
        isReApproval = true;
        break;
      }
      if (priorTitle.indexOf(stage + ' approved by ') === 0 || priorTitle.indexOf(stage + ' re-approved by ') === 0) {
        break; // most recent mention of this stage was already an approval -- not currently in a regressed state
      }
    }
  }
```

Then replace the existing `title`/`context`/`decision` construction:

```javascript
  var date = new Date().toISOString().slice(0, 10);
  var title = stage + ' approved by ' + approverLogin + (approverRole ? ' (' + approverRole + ')' : '');
  var context = 'Approval recorded via Sign Off at the ' + stage + ' stage of feature ' + featureSlug + '.';
  var decision = stage + ' approved and advancing to ' + nextStage + '.';
```

with:

```javascript
  var date = new Date().toISOString().slice(0, 10);
  var title = stage + (isReApproval ? ' re-approved by ' : ' approved by ') + approverLogin + (approverRole ? ' (' + approverRole + ')' : '');
  var context = isReApproval
    ? 'Re-approval recorded via Sign Off at the ' + stage + ' stage of feature ' + featureSlug + ', following a prior regression to this stage.'
    : 'Approval recorded via Sign Off at the ' + stage + ' stage of feature ' + featureSlug + '.';
  var decision = stage + (isReApproval ? ' re-approved after revision and advancing to ' : ' approved and advancing to ') + nextStage + '.';
```

Everything else in the function (entry assembly, file write, response) stays unchanged.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep3-s3-reapproval.js
```

Expected output: `[ep3-s3-reapproval] 12 run, 12 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js` (acknowledged at `/branch-setup`). **Pay particular attention to `tests/check-ep2-s3-approval.js`** (the sibling test suite for the function being modified) — every one of its existing assertions about a FIRST-time approval's entry wording must still pass unchanged, since Scenario A above is specifically designed to prove the same thing from this story's own side.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-ep3-s3-reapproval.js
git commit -m "feat: distinguish re-approval-after-regression in the decisions.md audit trail (ep3-s3 AC1, AC3)"
```

---

## Notes for the implementing agent / reviewer

- **AC2 requires no code change and no dedicated test in this plan** — its substance was verified by direct code-reading during `/branch-setup` (see `decisions.md`): `handlePostGateConfirm` has no branching on approval/regression history. If you find any reason this claim is wrong while implementing, stop and report — do not silently add gate-confirm-related code without flagging it first, since the whole point of this scoped-down plan is that AC2 is already correct.
- **Do not add a `reApprovalOf` field, a `feature_approvals` table, or any new file** (`approval.js`, `approval-recorder.js`) — all three are the DoR's own fictional touch points, already corrected in `decisions.md`. The only file to modify is the existing `handlePostJourneyApprove` in `journey.js`.
- **The regression-detection loop's `break` on encountering a prior approval (not just a regression) is deliberate**, not an oversight: it ensures only the MOST RECENT mention of this stage determines re-approval status, so an old regression from long ago (already re-approved once) doesn't incorrectly mark a THIRD, unrelated approval as a re-approval too. Scenario A's control case and the loop's own scan-from-the-end direction both depend on this being correct — trace it carefully if you touch this logic.
