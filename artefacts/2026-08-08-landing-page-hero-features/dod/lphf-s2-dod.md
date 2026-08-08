# Definition of Done: Scope-contract enforcement hero card

**PR:** https://github.com/heymishy/skills-repo/pull/684 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s2-scope-contract-enforcement-hero-card.md
**Test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s2-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (headline + supporting sentence + concrete example) | ✅ | `.hero-card[data-hero="scope-contract"]` renders the locked-file-list-vs-merged-diff example | automated test | None |
| AC2 (names the real mechanism, not generic marketing copy) | ✅ | Copy names the DoR scope contract + assurance gate concretely | automated test + code review | None |
| AC3 (readable at 320px/1280px, no horizontal scroll) | ✅ | `tests/e2e/lphf-s2-*.spec.js` — real Playwright E2E test, passing on PR #684 before merge (`Scenario A E2E`/Playwright smoke both green) | E2E test (classified at DoR as automated visual regression, not RISK-ACCEPT) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. No interactive/live demo, no external link, no full-pipeline explainer was added — all three correctly excluded per the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent AC):** AC3 was classified at DoR as covered by a real automated E2E test (`tests/e2e/lphf-s2-*.spec.js`), not RISK-ACCEPT + manual — confirmed via the DoR's own H-E2E row ("covered by a real E2E test, not blocked"). No RISK-ACCEPT entry needed or expected in `decisions.md`, and none was found — consistent, not a gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Static content, per `nfr-profile.md` |
| Security | ✅ | No credentials/PII — confirmed at discovery `/clarify` and review run 1 (guardrail `MC-SEC-02`, status `met`) |
| Accessibility | ✅ | AC3's responsive requirement closed via real E2E automation, not deferred |

---

## Metric Signal

**Metric 1 — Signup conversion rate**
Signal: not-yet-measured
Evidence note: No real-visitor traffic data reviewed yet since launch (2026-08-08); baseline pull and 4-week review not yet due.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding.

---

## DoD Observations

None material beyond what's already captured at review/DoR time.
