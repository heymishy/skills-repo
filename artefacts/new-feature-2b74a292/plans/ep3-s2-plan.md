# Auto-Generate decisions.md Entry on Regression — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Give `ep3-s2` its own explicit, traceable verification that `ep3-s1`'s already-shipped regression handler satisfies AC1/AC2/AC3's real substance — no new production code, since the handler already does this work.
**Branch:** `feature/ep3-s2`
**Worktree:** `.worktrees/ep3-s2`
**Test command:** `npm test` (full suite) / `node tests/<file>.js` (single file)

---

## Pre-verified findings (see `decisions.md` for the full investigation)

- **`ep3-s2`'s DoR and test-plan assume a fictional architecture**: a `src/regression-handler.js`, a new `src/modules/decisions-writer.js`, a `POST /api/features/{featureId}/regression` endpoint, and — most significantly — a YAML-like `decisions.md` entry format (`date:` / `session-phase: regression` / `decision:` / `reason:` / `actor:` / `stageReverted:`). None of this exists.
- **The story's entire substance already ships as part of `ep3-s1`** (merged, PR #915): `handlePostJourneyRegress` (`src/web-ui/routes/journey.js`) already appends a `decisions.md` entry on every regression, synchronously (`fs.appendFileSync`, same request/response cycle), using this codebase's real, established Markdown format:
  ```
  ## Regressed to <targetStage> by <requesterLogin>

  **Date:** <YYYY-MM-DD>
  **Context:** Regression requested via Request Regression at the <currentStage> stage of feature <featureSlug>.
  **Decision:** Feature stage reset to <targetStage>; downstream stages (<list>) marked incomplete.
  **Rationale:** <reason, verbatim from the request>
  ```
- **AC2's 6 field categories all have real substance in this entry** — see the mapping table in `decisions.md` (date → `**Date:**`; `session-phase: regression` → conveyed by the title pattern itself; decision → `**Decision:**`; reason → `**Rationale:**`; actor → embedded in the title; stageReverted → embedded in both the title and `**Decision:**`).
- **This plan adds exactly one task**: a dedicated test file that explicitly parses the real entry (not just substring-searches for presence, as `ep3-s1`'s own tests incidentally do) and asserts each of the 6 categories is populated with the real request's actual values — giving `ep3-s2` its own explicit AC coverage distinct from `ep3-s1`'s, per this repo's own DoD conventions.
- **If Task 1 finds a real gap** (a field present in substance but not cleanly re-derivable by a parser — which could matter for a future automated audit tool reading `decisions.md`), fix it as a narrow, additive change to the existing entry-construction code in `handlePostJourneyRegress` — never rewrite `ep3-s1`'s already-shipped, already-reviewed format wholesale.

---

## File map

```
Create:
  tests/check-ep3-s2-decisions-entry.js — parses the real regression decisions.md entry and asserts AC1/AC2/AC3 against real, non-placeholder values

Modify (only if Task 1 finds a real gap — not expected):
  src/web-ui/routes/journey.js — handlePostJourneyRegress's entry-construction code, narrow/additive only
```

---

## Task 1: Dedicated AC1/AC2/AC3 verification test for the regression decisions.md entry

**Files:**
- Create: `tests/check-ep3-s2-decisions-entry.js`

- [ ] **Step 1: Write the test**

Follows `tests/check-ep3-s1-integration.js`'s own established harness (`freshRequire`/`makeReq`/`makeRes`, `fs.mkdtempSync` + `setRepoRoot` for filesystem isolation) for this exact class of handler, but with its own explicit entry-parsing assertions instead of `ep3-s1`'s incidental substring checks.

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

const CSRF_TOKEN = 'csrf-tok-ep3s2';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

// Parses this codebase's real decisions.md entry format
// (## Title / **Date:** / **Context:** / **Decision:** / **Rationale:**)
// into a plain object -- the AC2 substance-mapping this test exists to verify.
function parseLastEntry(content) {
  const entries = content.split(/\n## /).slice(1); // drop the file header before the first "## "
  const last = entries[entries.length - 1];
  const title = last.split('\n')[0].trim();
  const date = (last.match(/\*\*Date:\*\*\s*(.+)/) || [])[1];
  const context = (last.match(/\*\*Context:\*\*\s*(.+)/) || [])[1];
  const decision = (last.match(/\*\*Decision:\*\*\s*(.+)/) || [])[1];
  const rationale = (last.match(/\*\*Rationale:\*\*\s*([\s\S]+?)\n*$/) || [])[1];
  const actorMatch = title.match(/by (\S+)$/);
  const stageMatch = title.match(/^Regressed to (\S+) by/);
  return {
    title, date, context, decision, rationale: rationale && rationale.trim(),
    actor: actorMatch && actorMatch[1],
    stageReverted: stageMatch && stageMatch[1],
    isRegressionEntry: /^Regressed to /.test(title)
  };
}

async function main() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s2-test-'));
  r.j.setRepoRoot(tmpDir);
  const featureSlug = 'ep3s2-decisions-entry';

  const j = r.jStore.createJourney(featureSlug, 'default');
  r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
  r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
  r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
  r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'review', tenantId: 'tenant-a', ownerId: 'susan' });

  const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
  const priorContent = '# Decisions — ' + featureSlug + '\n\n## Prior approval\n\n**Date:** 2026-01-01\n**Context:** seeded before this test.\n**Decision:** approved.\n**Rationale:** prior entry fixture.\n';
  fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
  fs.writeFileSync(decisionsPath, priorContent, 'utf8');
  const priorEntryCount = priorContent.split(/\n## /).length - 1;

  const reasonText = 'Definition is missing architecture details for multi-tenancy.';
  const startTime = Date.now();
  const res = makeRes();
  await r.j.handlePostJourneyRegress(makeReq({
    params: { journeyId: j.journeyId },
    body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: reasonText }
  }), res, null);
  const elapsedMs = Date.now() - startTime;

  check('Handler returns 200', res._code === 200);

  // AC1: entry appended, prior entry preserved
  const afterContent = fs.readFileSync(decisionsPath, 'utf8');
  const afterEntryCount = afterContent.split(/\n## /).length - 1;
  check('AC1: entry count increased by exactly 1', afterEntryCount === priorEntryCount + 1);
  check('AC1: prior entry content is an exact untouched prefix of the new content', afterContent.indexOf(priorContent) === 0);

  // AC2: all 6 field categories present and populated with REAL, non-placeholder values
  const entry = parseLastEntry(afterContent);
  const placeholderPattern = /\[TBD\]|\[FILL IN\]|^TBD$|^null$|^undefined$|^$/i;
  check('AC2: date is present and non-placeholder', !!entry.date && !placeholderPattern.test(entry.date));
  check('AC2: date is a valid YYYY-MM-DD date', /^\d{4}-\d{2}-\d{2}$/.test(entry.date || ''));
  check('AC2: entry is identifiable as a regression-type entry (title pattern, substance of "session-phase: regression")', entry.isRegressionEntry === true);
  check('AC2: decision is present, non-placeholder, and names the target stage', !!entry.decision && !placeholderPattern.test(entry.decision) && entry.decision.indexOf('definition') !== -1);
  check('AC2: reason (rationale) is present, non-placeholder, and matches the request exactly', entry.rationale === reasonText);
  check('AC2: reason length > 5 characters per story NFR', (entry.rationale || '').length > 5);
  check('AC2: actor is present, non-placeholder, and matches the requesting user', entry.actor === 'susan');
  check('AC2: stageReverted is present, non-placeholder, and matches the target stage exactly', entry.stageReverted === 'definition');

  // AC3: written to disk within 2 seconds, no delayed/batched write
  check('AC3: handler completed (and decisions.md was written) within 2000ms', elapsedMs <= 2000);
  check('AC3: entry is present on disk immediately after the handler returns (no polling/retry needed)', fs.readFileSync(decisionsPath, 'utf8').indexOf(entry.title) !== -1);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n[ep3-s2-decisions-entry] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must pass on the first run** (this is verification of already-shipped behavior, not new implementation — there is no RED step; if it fails, that means `ep3-s1`'s shipped entry format has a real gap, which is itself the finding this task exists to surface)

```bash
node tests/check-ep3-s2-decisions-entry.js
```

Expected output: `[ep3-s2-decisions-entry] 12 run, 12 passed, 0 failed`

**If it fails:** do not weaken the assertions to make it pass. Investigate whether the gap is in the test's own understanding of the real entry format (fix the test) or a genuine gap in `handlePostJourneyRegress`'s entry-construction code (fix that code narrowly — do not rewrite the format, only add what's missing).

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js` (acknowledged at `/branch-setup`)

- [ ] **Step 4: Commit**

```bash
git add tests/check-ep3-s2-decisions-entry.js
git commit -m "test: dedicated AC1/AC2/AC3 verification for the regression decisions.md entry (ep3-s2)"
```

---

## Notes for the implementing agent / reviewer

- **This is a verification-only task.** `ep3-s2`'s own Success Criteria explicitly asks for exactly this: "All 3 ACs passing (verified by manual test...)". There is deliberately no new production code planned — if the test passes on first run (expected), that IS the deliverable. Do not add speculative refactoring (e.g. extracting the DoR's imagined `decisions-writer.js` module) "for DRY-ness" — `handlePostJourneyRegress`'s inline entry-construction code was already reviewed twice during `ep3-s1` and works correctly; extracting it now with no second caller would be YAGNI.
- **AC2's `session-phase: regression` literal field does not exist and should not be added.** Its *substance* — that this entry is identifiable as a regression (not an approval or any other decision type) — is satisfied by the title pattern (`"Regressed to X by Y"`), matching this codebase's own established convention (every decisions.md writer in this codebase distinguishes entry types by title phrasing, not a structured type field). Do not add a literal `session-phase:` line to the entry format; that would be a real, unreviewed change to an already-shipped, already-tested format for a fictional AC requirement.
