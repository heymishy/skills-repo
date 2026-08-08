# Definition of Done: Cryptographic instruction-set verification hero card

**PR:** https://github.com/heymishy/skills-repo/pull/685 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s3-cryptographic-verification-hero-card.md
**Test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s3-test-plan.md
**DoR artefact:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s3-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (headline + supporting sentence + illustrative hash example) | ✅ | `.hero-card[data-hero="crypto-verification"]` renders the hash-vs-instruction-set example | automated test | None |
| AC2 ("recomputable"/"independently verifiable," no "trust us") | ✅ | `hasUnnegatedTrustUs` regex correctly allows the deliberate negated "not 'trust us'" contrastive copy while rejecting an un-negated claim — caught and fixed during implementation before this was reported as passing | automated test | None |
| AC3 (readable at 320px/1280px) | ✅ | `tests/e2e/lphf-s3-*.spec.js` — real Playwright E2E, passing on PR #685 before merge | E2E test (DoR: "covered by real E2E test") | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. No interactive hash-verification tool, no cryptography-algorithm explainer — both correctly excluded per Out of Scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 3 / 3
**Tests passing in CI:** 3 / 3

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent AC):** AC3 classified at DoR as automated E2E coverage, not RISK-ACCEPT. Consistent — no gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Static content |
| Security | ✅ | No credentials/PII; the illustrative hash value confirmed real/non-fabricated per the story's own Architecture Constraint |
| Accessibility | ✅ | AC3 closed via real E2E automation |

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

1. **AC2's contrastive-negation test bug, caught during implementation, not after.** The initial assertion (`!cardHtml.includes('trust us')`) incorrectly flagged the story's own deliberate "not 'trust us'" contrastive copy as a violation of itself. Fixed to a negation-aware regex before this was reported complete — worth noting as a reusable pattern: any AC requiring copy to explicitly *avoid* a phrase, where the natural way to write that copy is to *name and reject* the phrase, needs a negation-aware test, not a naive substring check.
