## Test Plan: Cryptographic instruction-set verification hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s3-cryptographic-verification-hero-card.md
**Epic reference:** artefacts/2026-08-08-landing-page-hero-features/epics/epic-1-landing-page-hero-features.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Headline + sentence + illustrative hash example | 1 test | — | — | — | — | 🟢 |
| AC2 | Copy contains "recomputable"/"independently verifiable", not "trust us" | 1 test | — | — | — | — | 🟢 |
| AC3 | Readable at 320px and 1280px, no horizontal scroll | — | — | 1 test | — | CSS-layout-dependent | 🔴 |

---

## Coverage gaps

None — AC3 covered by a real Playwright E2E test.

---

## Test Data Strategy

**Source:** Synthetic — the illustrative hash value is a real, non-sensitive value drawn from this repo's own trace history (or clearly marked illustrative), per the story's Architecture Constraints.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An illustrative instruction-set hash + the SKILL.md file it corresponds to | A real hash from this repo's trace history, or a clearly-labelled illustrative example | None | Must not look like a fabricated placeholder — see story's Architecture Constraints |
| AC2 | The card's copy text | Static template content | None | |
| AC3 | Rendered page at 320px and 1280px | Live Playwright browser render | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### cryptoVerificationCard_rendersHeadlineSentenceAndHashExample

- **Verifies:** AC1
- **Precondition:** Landing page rendered
- **Action:** Locate the cryptographic-verification hero card
- **Expected result:** A headline, one supporting sentence, and an illustrative hash value paired with its corresponding instruction-set file name are present
- **Edge case:** No

### cryptoVerificationCard_copyAssertsRecomputable_notUnfalsifiableClaim

- **Verifies:** AC2 (reworded post-review, run 1, finding 1-M1)
- **Precondition:** Landing page rendered
- **Action:** Inspect the card's copy text
- **Expected result:** Copy contains the word "recomputable" or "independently verifiable"; copy does not contain "trust us" or an equivalent unfalsifiable phrase
- **Edge case:** No

---

## Integration Tests

None — static content card.

---

## E2E Tests

### cryptoVerificationCard_readableAt320And1280_noHorizontalScroll

- **Verifies:** AC3
- **Precondition:** Landing page loaded in a real browser
- **Action:** Set viewport to 320px, check `scrollWidth`; repeat at 1280px
- **Expected result:** No horizontal overflow at either size; card content fully visible
- **Edge case:** No
- **Tool:** Playwright

---

## NFR Tests

None — same rationale as `lphf-s2` (static content, no dedicated measurable threshold beyond the AC-level assertions above).

---

## Out of Scope for This Test Plan

- Verifying the actual cryptographic algorithm's correctness — this card illustrates the mechanism, it doesn't implement or re-verify the hash function itself (that's covered elsewhere in this repo's existing assurance-gate tests).

---

## Test Gaps and Risks

None identified.
