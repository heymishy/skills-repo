## Test Plan: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Test plan author:** Copilot
**Date:** 2026-11-01

**Test runner confirmed from `package.json`:** `"test": "node scripts/run-all-tests.js"` — plain Node, no framework, same convention as every other test file in this repo.

**Test data strategy:** Synthetic/real-code — the only new test needs no synthetic fixture (it reads the production module's own exported value); the manual verifications run the real, already-existing NFR test files directly. No PCI/sensitive data, no external services.

**E2E / browser-layout scan:** None of this story's 5 ACs mention drag-drop, pointer coordinates, CSS position, or visual rendering — pure Node process/timing concern. N/A.

---

## Honest scoping note (read before judging the AC Coverage table below)

Investigated directly during test-plan writing: `check-cat-s1-core-trace-builder.js` and `check-cat-s4-features-page-integration.js` both measure a real, in-process, synchronous filesystem walk over the real 205-file `phase4-scale` directory via `buildArtefactTrace` — no subprocess spawn, pure CPU-scheduling sensitivity. `check-rb-s3-harness-agnostic-instructions.js` spawns a real subprocess (`runAssembly`) plus `checkDrift()` against a 2000ms budget. All 3 are sensitive to *real* contention from *real* sibling processes under the *real* full-suite discovery — a synthetic mini-batch of mock CPU-load fixtures would not genuinely reproduce the actual production scenario these NFRs are measuring, and this repo already has a standing precedent (`tfhc-s9`'s own AC4) for treating a true full-scale wall-clock claim as a manual, real-environment verification rather than a synthetic unit test. Only AC2 (the cap *value* itself) is honestly unit-testable without faking the thing under test.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Each of the 3 fragile files passes consistently across 5+ real full-suite runs at the new cap | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC2 | Production concurrency cap re-tuned upward, replacing the old formula | 1 test | — | — | — | — | 🟢 |
| AC3 | No unrelated file shows a new/different failure at the new cap | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC4 | Real CI `Unit test chain` step duration measurably reduces below 124s | — | — | — | 1 scenario | External-dependency | 🔴 |
| AC5 | A file needing an unsafe fix is deferred and logged, not force-merged | — | — | — | 1 scenario | Untestable-by-nature | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in CI | Handling |
|-----|----|----------|--------------------------|---------|
| Real full-suite timing/stability claims (AC1, AC3, AC4) | AC1, AC3, AC4 | External-dependency | These ACs claim something about the *real* 816+-file suite's behaviour under *real* machine/CI load — the actual thing being measured, not a proxy. A synthetic mini-batch would test a different, easier scenario and prove nothing about the real one. Same precedent as `tfhc-s9`'s own AC4 (RISK-ACCEPT 1-M1, that story's own `/review`). | Manual, run during `/subagent-execution`'s own Step 6 (repeated full-suite runs) and re-confirmed fresh at `/definition-of-done` with real `gh api` CI job-step timing, exactly as `tfhc-s9` already proved out. |
| Deferral-on-unsafe-fix (AC5) | AC5 | Untestable-by-nature | Whether a given fix is "unsafe" (a threshold that would never fail) is a human/implementer judgment call on the real investigation findings, not a checkable condition before the investigation happens. | Verified by reading `decisions.md` for this story at `/definition-of-done` — if AC5's condition was triggered, a logged entry must exist; if not triggered, this AC is trivially satisfied (nothing to defer). |

---

## Test Data Strategy

**Source:** Synthetic/real-code
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The real `rb-s3`/`cat-s4`/`cat-s1` files, run for real, repeatedly | Real repo files | None | Manual, not synthetic — see Honest scoping note above |
| AC2 | The production module's own exported concurrency-cap value | `scripts/run-all-tests.js` | None | Direct code read |
| AC3, AC4 | The real full discovered file set | Real repo | None | Manual, same as AC1 |
| AC5 | `decisions.md` for this story, if triggered | Real artefact | None | Manual, conditional |

### PCI / sensitivity constraints

None.

### Gaps

None — all data needed already exists in the real repo; nothing to source.

---

## Unit Tests

### `getPoolConcurrency()` returns a value higher than the old formula

- **Verifies:** AC2
- **Precondition:** `scripts/run-all-tests.js` exports a new function `getPoolConcurrency()` that computes and returns the production concurrency value `runAll()`'s pool phase uses (extracted out of the inline `Math.max(1, Math.ceil(os.cpus().length / 3))` expression into its own named, testable function — this is the one small refactor this story's fix requires, so AC2 doesn't rely on a fragile whole-file source-text regex match, which this repo's own testing standard warns against).
- **Action:** `const { getPoolConcurrency } = require('../scripts/run-all-tests.js'); const newCap = getPoolConcurrency();`
- **Expected result:** `newCap > Math.ceil(os.cpus().length / 3)` (strictly greater than the old formula's own output on this same machine) and `newCap <= os.cpus().length` (never exceeds the real core count — a sanity ceiling).
- **Edge case:** No.

---

## Integration Tests

None — this story's one unit-testable AC (AC2) is a direct function-level check; the rest are real-environment manual verifications per the Coverage gaps table above.

---

## NFR Tests

### Performance — production concurrency cap increases, real CI duration measurably reduces

- **NFR addressed:** Performance
- **Measurement method:** Manual — repeated real full-suite runs during implementation (AC1/AC3), then a real `gh api` CI job-step-timing measurement on this story's own PR (AC4), same technique proven at `tfhc-s9`'s own DoD.
- **Pass threshold:** New cap > 3 (the current value); real CI `Unit test chain` step duration measurably below the confirmed 124s baseline; 0 new/different failures beyond the already-accepted residual-flake category.
- **Tool:** Manual — `node scripts/run-all-tests.js` timed locally, `gh api repos/heymishy/skills-repo/actions/jobs/<id>` for the real CI measurement.

### Security — None identified

No new production code path beyond the small `getPoolConcurrency()` refactor itself (still test-tooling, not application code). No NFR test written — confirmed with story owner (the story itself states "None identified").

### Accessibility — N/A

No UI. No NFR test written.

### Audit — N/A

No audit-relevant surface. No NFR test written.

---

## Out of Scope for This Test Plan

- Testing a synthetic/mocked reproduction of the real contention scenario — deliberately rejected, see Honest scoping note above; it would test a different, easier problem than the one AC1/AC3/AC4 actually claim.
- Any test of `rb-s3`/`cat-s4`/`cat-s1`'s own unrelated assertions (the 25+ other tests in each of those files) — out of scope per the story's own Out of Scope section.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1/AC3/AC4's real-environment timing/stability claims | Testing the real thing, not a proxy, by design — see Honest scoping note | Manual verification at `/subagent-execution` Step 6 and `/definition-of-done`, same proven precedent as `tfhc-s9`'s own AC4 |
| AC5's conditional deferral | A human judgment call on investigation findings not yet made | Checked at `/definition-of-done` via `decisions.md`; trivially satisfied if never triggered |
