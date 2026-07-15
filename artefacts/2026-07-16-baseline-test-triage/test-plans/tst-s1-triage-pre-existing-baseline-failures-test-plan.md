## Test Plan: Triage the pre-existing baseline test failures

**Story reference:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-16

---

## AC Coverage

| AC | Description | Unit/Meta | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|-----------|-------------|-----|--------|----------|------|
| AC1 | Every one of the 69 failures categorized (a/b/c) in a written triage report | 3 | — | — | — | — | 🟢 |
| AC2 | Category (a) fixed files pass standalone + zero new regressions | 2 | 1 | — | — | — | 🟢 |
| AC3 | `check-md-3-adr.js` specifically investigated and classified | 2 | — | — | — | — | 🟢 |
| AC4 | `known-baseline-failures.json` refreshed and internally accurate | 3 | — | — | — | — | 🟢 |
| AC5 | `ci-test-regression-check.js` reports zero unaccounted regressions post-refresh | — | 1 | — | — | — | 🟢 |

---

## Test Data Strategy

**Source:** The real, current test suite state (`node scripts/run-all-tests.js` output), a new triage report artefact this story produces, and the existing `tests/known-baseline-failures.json`.
**PCI/sensitivity in scope:** No
**Availability:** Available now — no external dependency.
**Owner:** tst-s1 coding agent.

---

## Unit / Meta Tests (`tests/check-tst-s1-baseline-triage.js`)

**U1 (AC1):** A triage report artefact exists at `artefacts/2026-07-16-baseline-test-triage/triage-report.md` (or equivalent, path fixed by the implementer and referenced in this test) and, for each of the 69 files named in the story's "Current, freshly-verified state" section, contains an entry naming that file and one of the three categories (a/Fixed, b/Deferred, c/Investigated-and-classified).

**U2 (AC1):** No file in the story's 69-file list is missing from the triage report (a completeness check: every named file appears at least once).

**U3 (AC1):** Every category-(b) entry in the triage report includes a one-sentence root cause and a named follow-up trigger (not a blank or "TBD" placeholder).

**U4 (AC2):** For every file the triage report marks category (a) Fixed, `node <file>` (run as a child process) exits 0.

**U5 (AC3):** The triage report's entry for `tests/check-md-3-adr.js` explicitly states one of "genuinely new regression" or "pre-existing gap, previously unsnapshotted" and is not left as an open question.

**U6 (AC4):** `tests/known-baseline-failures.json`'s `files` array does not contain any of the 5 confirmed-now-passing files (`check-bri-s3.5-nfr-stripe-keys.js`, `check-gpa-sc06-source-path-guard.js`, `check-lab-s3.2-stripe-checkout.js`, `check-lab-s3.4-stripe-webhook.js`, `run-gpa-tests.js`).

**U7 (AC4):** `tests/known-baseline-failures.json`'s `files` array does not contain any file the triage report marks category (a) Fixed.

**U8 (AC4):** Every file remaining in `tests/known-baseline-failures.json`'s `files` array is one this story's triage report marks category (b) or (c)-deferred (internal consistency between the two artefacts).

---

## Integration Tests

**IT1 (AC2, AC5):** Run the full suite (`node scripts/run-all-tests.js`) to a fresh log file, then run `node scripts/ci-test-regression-check.js` against that log and the refreshed `tests/known-baseline-failures.json`. Assert the regression checker's exit code is 0 and its output reports zero files failing that are not in the refreshed baseline.

---

## NFR Tests

### Regression-gate accuracy

- **NFR addressed:** Operational efficiency / signal quality (see story's Benefit Linkage)
- **Measurement method:** IT1 above.
- **Pass threshold:** Zero unaccounted-for regressions.
- **Tool:** `scripts/ci-test-regression-check.js` (existing, from pcr-s1).

### Suite runtime

- **NFR addressed:** Performance
- **Measurement method:** Compare total `node scripts/run-all-tests.js` wall-clock time before and after this story's fixes.
- **Pass threshold:** Not slower than the pre-story baseline by more than a trivial margin (fixing files should not meaningfully add runtime; if any fixed file adds a slow real integration/DB-backed test, note it in the triage report).
- **Tool:** The runner's own reported total (already printed in its summary line).

---

## Out of Scope for This Test Plan

- Testing the *content correctness* of every individual production-code fix beyond "the specific file's own tests now pass" — each fixed file's own existing test assertions are the source of truth for its own correctness; this test plan does not re-derive per-file domain assertions.
- Testing category (b)/(c) files' *underlying* defects — by definition, those are deferred, not fixed, in this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The exact number/identity of category (a) vs (b) files is unknown until AC1's investigation happens | This is an inherent property of a triage story (Complexity 3, Scope Unstable per the story itself) | U1-U3 verify the *process* (completeness, no placeholders) rather than asserting a fixed count of "fixed" files in advance |
| Some of the 69 files may turn out to require a real product/architecture decision (e.g. a missing `.github/skills/definition/SKILL.md`, per bri-s1.2/bri-s2.2's existing decisions.md entries) | Confirmed already true for at least one file from prior sessions' investigation | Category (b) exists precisely for this; RISK-ACCEPT logged per file, not silently dropped |
