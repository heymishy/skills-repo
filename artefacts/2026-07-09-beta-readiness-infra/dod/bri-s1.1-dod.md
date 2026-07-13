# Definition of Done: Build the isEnabled() flag helper shared by API and UI

**PR:** https://github.com/heymishy/skills-repo/pull/444 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.1-isenabled-helper-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.1-isenabled-helper-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `isEnabled('wizard-ui', {tenantId:'acme'})` resolves `true` when the adapter resolves `true` | automated test (A1) | None |
| AC2 | ✅ | Unwired adapter throws exact D37 (injectable adapter rule) message: `Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.` — does not silently return `false` | automated test (A3) | None |
| AC3 | ✅ | Route call site and UI-render call site use the identical function reference and receive the identical result | automated test (A4) | None |
| AC4 (Acceptance Criterion 4) | ✅ | PostHog API failure (ECONNRESET-style) resolves `false`, does not throw an unhandled rejection | automated test (A5) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. PR #444 touched exactly its declared touchpoints (`posthog-flags.js`, new test file).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (pipeline-state.json currently records 8 total — see DoD Observation below; the test plan's own AC table lists exactly 5 unit tests (AC1: 2, AC2: 1, AC3: 1, AC4: 1) plus 2 NFR tests, matching the 7 tests in the actual file)
**Tests passing in CI:** 7 / 7 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| A1 (isEnabled returns true when adapter resolves true) | ✅ | ✅ | |
| A2 (isEnabled returns false, not hardcoded true) | ✅ | ✅ | |
| A3 (throws documented D37 error when unwired) | ✅ | ✅ | |
| A4 (route + UI call sites share identical reference/result) | ✅ | ✅ | |
| A5 (adapter failure resolves false, not a rejection) | ✅ | ✅ | |
| N1 (accessToken never forwarded to evaluateFlag) | ✅ | ✅ | |
| N2 (isEnabled adds ≤200ms of its own overhead) | ✅ | ✅ | |

**Gaps (tests not implemented):** None — the test file's own 7 tests are complete and all pass. `pipeline-state.json`'s recorded `totalTests: 8` is stale bookkeeping (it does not match the test plan's own AC-table count of 7, nor the 7 actual tests in the file) — this DoD corrects it to `totalTests: 7, passing: 7`.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| `isEnabled()` call latency ≤ 200ms | ✅ | N2 confirms total duration stays within adapter latency + 200ms budget |
| No `accessToken`/session token passed as flag-evaluation context | ✅ | N1 confirms context passed to `evaluateFlag` omits `accessToken` |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Feature flags toggle without a redeploy | ✅ (0) | Not yet — this story is the shared mechanism only; the metric becomes concretely measurable at bri-s1.5 (real flags wired to real behaviour) | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- **Bookkeeping-only, already corrected by this DoD:** `pipeline-state.json`'s `testPlan.totalTests` for bri-s1.1 is updated from 8 to 7 to match the actual test file and the test plan's own AC coverage table. No functional gap exists — this is a stale-count correction only, the same class of drift found and corrected for bri-s2.2 and bri-s2.5 elsewhere in this sweep.

---

## DoD Observations

1. **RISK-ACCEPT already on file for a cosmetic AC3 wording issue** (`decisions.md`, 2026-07-10, definition-of-ready): AC3 mixes an implementation-detail parenthetical into an observable-behaviour AC — accepted as a phrasing nitpick, not a testability defect. No action needed.
2. **This is the third instance in this DoD sweep of a `totalTests` count in `pipeline-state.json` not matching the actual test file** (see also bri-s2.2, bri-s2.5). **Tag: /improve candidate** — worth a dedicated pass across all merged stories' pipeline-state.json entries, or a CI check that a story's `testPlan.totalTests` matches the count of `[PASS]`/`[FAIL]`-style assertions actually present in its named test file, to catch this drift automatically rather than only at DoD time.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build the isEnabled() flag helper shared by API and UI" (bri-s1.1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
