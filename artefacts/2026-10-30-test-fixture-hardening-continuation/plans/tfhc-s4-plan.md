# Classify the 5 journey-related E2E seed endpoints as redundant or legitimate — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify. This is a read-only investigation story — the deliverable is a classification artefact plus a small structural self-check script, not application code.
**Branch:** `feature/tfhc-s4`
**Worktree:** `.worktrees/tfhc-s4`
**Test command:** `npm test` (full suite) / `node tests/check-tfhc-s4-journey-seed-classification.js` (this story's own test, individually)

---

## File map

```
Create:
  tests/check-tfhc-s4-journey-seed-classification.js                                              — structural self-check verifying AC1-AC4 against the classification artefact's own text (and benefit-metric.md's Metric 4 reference)
  artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md — the classification artefact (AC1-AC3): records a redundant/legitimate verdict for each of the 5 endpoints, grounded in the real handler code (src/web-ui/server.js) and real E2E spec callers

Modify:
  artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md                       — Metric 4 gets a new Evidence row referencing the classification artefact's real path (AC4)
```

---

## Task 1: Write the structural self-check test (RED)

**Files:**
- Create: `tests/check-tfhc-s4-journey-seed-classification.js`

**Model routing:** fast/cheap (mechanical, deterministic text-structure assertions — no judgment call)

- [ ] **Step 1: Write the test**

```javascript
'use strict';
// tests/check-tfhc-s4-journey-seed-classification.js -- tfhc-s4
//
// Structural self-check for the journey-seed-endpoint classification
// artefact (read-only investigation story -- no production code changes).
// Verifies AC1-AC4 from
// artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md
// against the artefact's own text -- NOT the classification's substantive
// correctness, which is a human-review gap documented in that test plan's
// own Test Gaps and Risks table.

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var ARTEFACT_REPO_REL_PATH = 'artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md';
var ARTEFACT_PATH = path.resolve(__dirname, '..', ARTEFACT_REPO_REL_PATH);
var BENEFIT_METRIC_PATH = path.resolve(__dirname, '../artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md');

var ENDPOINTS = [
  'seed-approval-journey',
  'seed-board-journey',
  'seed-actr-s2-journey',
  'seed-ppc-s5-journey',
  'seed-journey-gate-session'
];

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS] ' + name); }
  catch (err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + err.message); }
}

function escapeRegExp(s) { return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

// Extracts the "### N. `endpoint-name` ..." heading block up to the next
// "### " or "## " heading (or end of file) -- this is the one block that
// must carry that endpoint's own explicit verdict.
function getEndpointBlock(text, name) {
  var re = new RegExp('###\\s*\\d+\\.[^\\n]*`[^`]*' + escapeRegExp(name) + '[^`]*`[\\s\\S]*?(?=\\n###\\s|\\n##\\s|$)');
  var m = text.match(re);
  return m ? m[0] : null;
}

var artefactText = fs.existsSync(ARTEFACT_PATH) ? fs.readFileSync(ARTEFACT_PATH, 'utf8') : null;

test('AC1: classification artefact exists', function() {
  assert.ok(artefactText !== null, 'expected ' + ARTEFACT_REPO_REL_PATH + ' to exist');
});

test('AC1: all 5 endpoints each have their own heading block with an explicit Redundant/Legitimately-different verdict', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  ENDPOINTS.forEach(function(name) {
    var block = getEndpointBlock(artefactText, name);
    assert.ok(block, 'expected a "### N. `' + name + '`" heading block in the artefact');
    assert.ok(/\*\*Verdict:\*\*\s*(Redundant|Legitimately different|Legitimate)/i.test(block),
      'expected endpoint "' + name + '" to carry an explicit **Verdict:** line, not just be named');
  });
});

test('AC2: any endpoint marked Redundant has a specific fast-follow (named other endpoint + caller count), never a vague note', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  var redundantEndpoints = ENDPOINTS.filter(function(name) {
    var block = getEndpointBlock(artefactText, name);
    return block && /\*\*Verdict:\*\*\s*Redundant\b/i.test(block);
  });
  if (redundantEndpoints.length === 0) {
    return; // trivially satisfied -- AC3's test covers the "zero redundant" branch instead
  }
  redundantEndpoints.forEach(function(name) {
    var block = getEndpointBlock(artefactText, name);
    var hasOtherEndpointNamed = ENDPOINTS.some(function(other) { return other !== name && block.indexOf(other) !== -1; });
    var hasCallerCount = /\b\d+\s*callers?\b/i.test(block);
    assert.ok(hasOtherEndpointNamed, 'redundant verdict for "' + name + '" must name the specific other endpoint it is redundant with');
    assert.ok(hasCallerCount, 'redundant verdict for "' + name + '" must name a real caller count, not a vague note');
  });
});

test('AC3: artefact explicitly closes the question when no endpoint is found redundant', function() {
  assert.ok(artefactText, 'artefact must exist for this check');
  var anyRedundant = ENDPOINTS.some(function(name) {
    var block = getEndpointBlock(artefactText, name);
    return block && /\*\*Verdict:\*\*\s*Redundant\b/i.test(block);
  });
  if (anyRedundant) {
    return; // AC2's test covers the "at least one redundant" branch instead
  }
  assert.ok(/no endpoint was found redundant/i.test(artefactText) && /no further action required/i.test(artefactText),
    'expected an explicit closing statement ("no endpoint was found redundant ... no further action required") when zero endpoints are marked redundant');
});

test('AC4: benefit-metric.md Metric 4 references the classification artefact\'s real path', function() {
  var benefitMetricText = fs.readFileSync(BENEFIT_METRIC_PATH, 'utf8');
  var metric4Match = benefitMetricText.match(/### Metric 4:[\s\S]*?(?=\n### |\n---|$)/);
  assert.ok(metric4Match, 'expected a "### Metric 4:" section in benefit-metric.md');
  assert.ok(metric4Match[0].indexOf(ARTEFACT_REPO_REL_PATH) !== -1,
    'expected Metric 4 to reference the exact artefact path: ' + ARTEFACT_REPO_REL_PATH);
  assert.ok(fs.existsSync(ARTEFACT_PATH), 'the referenced artefact must actually exist on disk');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tfhc-s4-journey-seed-classification.js
```

Expected output: `[FAIL] AC1: classification artefact exists -- ...` and `[FAIL] AC4: benefit-metric.md Metric 4 references the classification artefact's real path -- ...` (artefact does not exist yet, benefit-metric.md does not yet reference it). `0 passed, 4 failed` (AC2/AC3 trivially pass today since `artefactText` is null short-circuits their own `assert.ok(artefactText, ...)` into a failure too — confirm all 4 fail, not just AC1).

- [ ] **Step 3: Commit**

```bash
git add tests/check-tfhc-s4-journey-seed-classification.js
git commit -m "test(tfhc-s4): add failing structural self-check for journey-seed-endpoint classification artefact"
```

---

## Task 2: Write the classification artefact (GREEN for AC1-AC3)

**Files:**
- Create: `artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md`

**Model routing:** balanced (requires reading and synthesizing the real handler code/comments at `src/web-ui/server.js:2431,2598,2663,2852,2971` and their real E2E callers — already done once during planning; this task writes up that grounded finding, it does not re-derive it from scratch)

- [ ] **Step 1: Write the classification artefact**

```markdown
# Research: Journey-Seed-Endpoint Classification

**Story:** tfhc-s4 — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
**Date:** 2026-10-31
**Method:** Each of the 5 endpoints' real handler code was read directly in `src/web-ui/server.js`, together with every real Playwright E2E spec that calls it, before any verdict was recorded — per this story's own DoR instruction not to classify from endpoint names alone.

## Summary

All 5 journey-related `/test/seed-*` endpoints were read directly, together with every real E2E spec that calls each one. **No endpoint was found redundant with another — no further action required.** Two pairs looked structurally similar at first glance (`seed-board-journey`/`seed-approval-journey`, and `seed-ppc-s5-journey`/`seed-actr-s2-journey`) but in both cases a specific, load-bearing difference — confirmed empirically in the real code and comments, not assumed — makes them genuinely not interchangeable. Detailed below.

## Classification

### 1. `seed-approval-journey` (`src/web-ui/server.js:2663`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ep2-s3-approval.spec.js`, `tests/e2e/dsa-s2-dashboard-restyle.spec.js`, `tests/e2e/ep2-s4-concurrent-merge.spec.js`, `tests/e2e/fixtures/seed-journey.js` (a shared helper used by multiple specs).

**Reasoning:** Modelled closely on `seed-board-journey` (same journey-store.js-backed real-journey pattern) but with one deliberate, load-bearing difference: `productId` is never set on the journey it creates. `ep2-s3-approval.spec.js`'s own header comment (lines 18-46) documents the investigation that produced this: using `seed-board-journey` for the approval flow was tried first and empirically failed, because `handlePostGateConfirm`'s `acdg-s1` guard (`routes/journey.js`) hard-blocks with a 502 whenever `ownerRepoForFeature` throws (which it always does in this E2E environment, since `DATABASE_URL` is unset) AND `journey.productId` is truthy. `seed-board-journey` always defaults `productId` to a truthy string, so it trips this block; `seed-approval-journey` must omit `productId` entirely to land in `acdg-s1`'s "genuinely no product link" silent-skip branch instead, so gate-confirm completes for real. Swapping either endpoint in for the other would break the calling spec, for a reason unrelated to the spec's own intent — not redundant.

### 2. `seed-board-journey` (`src/web-ui/server.js:2598`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ep2-s1-signals-panel.spec.js`, `tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js`, `tests/e2e/s1.1-board-advance-action.spec.js`, `tests/e2e/s1.2-not-ready-explanation.spec.js`, `tests/e2e/s3.1-drag-to-advance.spec.js`, `tests/e2e/s3.2-within-column-reorder.spec.js` (6 real callers; `ep2-s3-approval.spec.js` references it only in a header-comment investigation note, not in its test body — see Investigation Note below).

**Reasoning:** The established, precedented mechanism (added for `s1.1`'s kanban board-advance story) for seeding a real journey + real HTML session with a controllable `done` state, used by 6 real specs covering the kanban board surface (drag-to-advance, reorder, not-ready explanation, signals panel, shell wrapping). Its `productId` defaulting to a truthy string is correct and intentional for this surface (the board itself is product-scoped) — that is exactly the feature that makes it unsuitable for `seed-approval-journey`'s purpose, per entry 1 above. Not redundant with `seed-approval-journey`: the two endpoints exist specifically because one could not be substituted for the other.

**Investigation Note:** `ep2-s3-approval.spec.js`'s header comment references `seed-board-journey` only to document the investigation that led to building `seed-approval-journey` instead — the spec's test body itself calls only `seed-approval-journey` (confirmed by grep against the spec file).

### 3. `seed-ppc-s5-journey` (`src/web-ui/server.js:2852`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ppc-s5-video-lazy-load.spec.js` (sole caller).

**Reasoning:** Seeds a journey that is already DoD-complete (via `completeStage('definition-of-done', ...)` plus a custom `setPgAdapterForTesting` stub serving fixed AC-coverage content), and optionally writes a real video + screenshot fixture file to disk. Purpose is narrow and specific: proving the video lazy-load / no-layout-shift behaviour of the playback-evidence page. No other spec needs a DoD-complete journey with a real on-disk video fixture.

### 4. `seed-actr-s2-journey` (`src/web-ui/server.js:2971`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/actr-s2-auto-resolve-live.spec.js` (sole caller).

**Reasoning:** The endpoint's own header comment (`server.js:2940-2970`) states it "mirrors `/test/seed-ppc-s5-journey` immediately above" — structurally the closest pair of the 5 — but it does three things `seed-ppc-s5-journey` does not: (1) creates a real `products` database row and links it via `repo_owner`/`repo_name`, (2) wires `playback-evidence.js`'s `setFetcherModule` test seam to serve seeded DoD content keyed by `featureSlug`, and (3) writes a real `test-plan.md` fixture directly onto the checkout's own `artefacts/` tree. These exist to drive a genuinely different code path — `_resolveAutoCaptureTarget`'s `storySlugs`-loop branch (via `pipelineStateStorySlugs`), not `ppc-s5`'s own video/screenshot capture-evidence path. Swapping in `seed-ppc-s5-journey` would not create a product row, wire the fetcher, or write a test-plan fixture, so `actr-s2-auto-resolve-live.spec.js` would fail. Not redundant.

### 5. `seed-journey-gate-session` (`src/web-ui/server.js:2431`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/wnl-s2-journey-gate-sticky.spec.js` (sole caller).

**Reasoning:** The only one of the 5 that does not create a real journey via `journey-store.js` at all — it seeds an HTML chat-session stub directly (via `_setHtmlSession`) with `session.done` and `session.journeyId` both set, parameterised on `skillName`/`turnCount` so the resulting page is taller than the viewport. Purpose is narrow: proving the journey-gate control's own sticky-scroll CSS behaviour on the chat page, unrelated to the kanban board, approval, or playback-evidence surfaces the other 4 endpoints serve. Distinct data shape (no real journey object at all) and distinct purpose.

## Closing statement

**No endpoint was found redundant with another — no further action required.** All 5 endpoints are legitimately different: each serves exactly one real E2E spec (or, for `seed-approval-journey`, a small family of specs sharing one real behavioural need), and the two structurally-closest pairs identified above (`seed-board-journey`/`seed-approval-journey`; `seed-ppc-s5-journey`/`seed-actr-s2-journey`) were each confirmed, by reading the real handler code and the real calling specs, to have a load-bearing difference that makes them genuinely not interchangeable. This closes the "13-endpoint sprawl" assumption's journey-related subset as investigated, not deferred.
```

- [ ] **Step 2: Run the self-check test — AC1-AC3 must now pass, AC4 still fails**

```bash
node tests/check-tfhc-s4-journey-seed-classification.js
```

Expected output: `[PASS] AC1: ...` ×2, `[PASS] AC2: ...`, `[PASS] AC3: ...`, `[FAIL] AC4: benefit-metric.md Metric 4 references the classification artefact's real path -- ...` (benefit-metric.md not yet updated). `4 passed, 1 failed`.

- [ ] **Step 3: Commit**

```bash
git add artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md
git commit -m "docs(tfhc-s4): classify all 5 journey-seed endpoints -- zero found redundant"
```

---

## Task 3: Reference the artefact from benefit-metric.md Metric 4 (GREEN for AC4)

**Files:**
- Modify: `artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md`

**Model routing:** fast/cheap (single-row table edit)

- [ ] **Step 1: Add an Evidence row to Metric 4's table**

In the `### Metric 4: Journey-seed-endpoint classification completeness` table, add one new row after the `**Feedback loop**` row:

```markdown
| **Evidence** | artefacts/2026-10-30-test-fixture-hardening-continuation/research/tfhc-s4-journey-seed-endpoint-classification.md |
```

- [ ] **Step 2: Run the self-check test — all 4 ACs must now pass**

```bash
node tests/check-tfhc-s4-journey-seed-classification.js
```

Expected output: `5 passed, 0 failed` (AC1 has 2 tests, AC2/AC3/AC4 have 1 each).

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, already-RISK-ACCEPTed `[C3]` pipeline-state-integrity flag for `tfhc-s1` (unrelated to this story) — no new or different failure.

- [ ] **Step 4: Commit**

```bash
git add artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
git commit -m "docs(tfhc-s4): reference the journey-seed classification artefact from benefit-metric.md Metric 4"
```

---

## Notes for the executing agent

- This is a read-only investigation story (per DoR Constraints) — do not consolidate, modify, or touch any of the 5 real endpoints, and do not classify the 8 non-journey-related `/test/seed-*` endpoints (out of scope).
- Open a draft PR when all tasks are done and `npm test` shows no new failures — do not mark ready for review (per DoR Coding Agent Instructions).
- If an ambiguity arises that isn't covered by the ACs or tests, add a PR comment describing it and do not mark ready for review.
