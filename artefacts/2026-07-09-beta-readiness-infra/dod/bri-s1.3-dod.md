# Definition of Done: Bootstrap flags server-side on session start to avoid UI flicker

**PR:** https://github.com/heymishy/skills-repo/pull/452 | **Merged:** 2026-07-10
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.3-server-side-bootstrap-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.3-server-side-bootstrap-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | All relevant flag states resolved and included in the initial HTML response — no client-side flag fetch before first paint | automated integration test (IT1) | None |
| AC2 | ✅ | Mid-session PostHog toggle does not apply until next session-start (no live mid-session updates implemented, matching the AC's own stated non-goal) | automated test | None |
| AC3 | ✅ | Slow/timing-out flag resolution during bootstrap falls back to the S1.1 AC4 safe default rather than blocking session start indefinitely | automated test | None |
| AC4 (Acceptance Criterion 4) | ✅ (descoped, per plan) | Integration tests (IT1/IT2) assert the gated element's presence/absence directly against `handleGetWizard`'s raw returned HTML string — the same observable a Playwright spec would check | automated integration test, not a live-browser Playwright spec | **Descoped from a Playwright spec to IT1/IT2**, per an explicit test-plan allowance and DoR Coding Agent Instructions — see below |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md` (2026-07-11, SCOPE, inner loop):** the AC4 belt-and-braces Playwright spec under `tests/e2e/` was descoped in favour of the existing integration tests IT1/IT2, which inspect the exact same observable (initial-HTML presence/absence of the gated element) a Playwright spec would check, without the added maintenance cost and CI runtime of a browser-driven spec for a server-rendering concern with no CSS-layout or client-hydration component. The test plan's own note and the DoR Coding Agent Instructions explicitly allowed this descope "if judged unnecessary at implementation time." Per ADR-018, this keeps the descope consistent with the rule that a Playwright spec should exist only where a real browser is genuinely needed.

**Disclosed and reasoned in `decisions.md` (2026-07-11, DESIGN, inner loop):** the pre-existing, exported `handleGetWizard(req, res)` was kept synchronous (converting it to `async` in place would have silently broken 28 passing, unrelated tests that call it synchronously). A new, separate async function `handleGetWizardBootstrapped(req, res, deps)` was added instead, which awaits `bootstrapFlags()` then delegates to the unchanged synchronous `handleGetWizard`. At the time of this story's own merge, `handleGetWizardBootstrapped` was not yet wired to any live HTTP route (the route wiring is a downstream task) — **this gap was closed by bri-s1.5**, which registered `GET /journey/wizard` against it (see bri-s1.5-dod.md).

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| IT1/IT2 (gated element present/absent in raw initial HTML) | ✅ | ✅ | Also stands in for AC4's descoped Playwright spec |
| N1 (bootstrap adds ≤200ms over adapter latency) | ✅ | ✅ | |
| Remaining unit/integration tests | ✅ | ✅ | |

**Gaps (tests not implemented):** None. AC4's descope from a live-browser spec to an equivalent integration test is disclosed above, not a silent gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Flag bootstrap adds ≤200ms to session-start latency | ✅ | N1 confirms bootstrap total time stays within adapter latency + 200ms budget |
| No-flicker also benefits assistive-technology users (accessibility) | ✅ | Structural — server-side resolution means no rapidly-changing DOM for AT to announce; not independently instrumented, but a direct consequence of AC1's mechanism |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 2 — Feature flags toggle without a redeploy | ✅ (0) | Not yet — this story ensures a clean render, not the toggle mechanism itself; concretely measurable at bri-s1.5 | |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- None blocking. The AC4 descope and the sync/async design split are both disclosed, reasoned, and the route-wiring gap the DESIGN entry flagged as a revisit trigger was already closed by bri-s1.5 (confirmed via that story's own decisions.md SCOPE entry). Recorded here for the audit trail per this story's Medium oversight level.

---

## DoD Observations

1. **A RISK-ACCEPT is already on file for two low-severity wording issues** (`decisions.md`, 2026-07-10, definition-of-ready): AC2's hedge phrasing and the Benefit Linkage's indirect metric-connection sentence. No action needed — cosmetic only.
2. This story is a good example of the "leave an explicit revisit trigger rather than force a downstream story to rediscover the gap" pattern: the DESIGN decisions.md entry named exactly which future story (whichever wired a live route to the bootstrapped handler) needed to confirm the wiring, and bri-s1.5 did exactly that and closed the loop.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Bootstrap flags server-side on session start to avoid UI flicker" (bri-s1.3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Was the AC4 Playwright-to-integration-test descope legitimate given ADR-018's own scoping intent?
Report findings as HIGH / MEDIUM / LOW.
```
