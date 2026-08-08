## Test Plan: Scope-contract enforcement hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s2-scope-contract-enforcement-hero-card.md
**Epic reference:** artefacts/2026-08-08-landing-page-hero-features/epics/epic-1-landing-page-hero-features.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Headline + sentence + concrete example present | 1 test | — | — | — | — | 🟢 |
| AC2 | Copy names the real mechanism, not generic marketing | 1 test | — | — | — | — | 🟢 |
| AC3 | Readable at 320px and 1280px, no horizontal scroll | — | — | 1 test | — | CSS-layout-dependent | 🔴 |

---

## Coverage gaps

None. AC3 is CSS-layout-dependent but is fully covered by a real Playwright E2E test (E2E tooling is already configured in this repo) — not left as an untested gap.

---

## Test Data Strategy

**Source:** Synthetic — static hero-card copy authored directly in the template.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The hero card's rendered HTML | Static template content | None | |
| AC2 | The hero card's copy text | Static template content | None | |
| AC3 | Rendered page at 320px and 1280px viewport widths | Live Playwright browser render | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### scopeContractCard_rendersHeadlineSentenceAndExample

- **Verifies:** AC1
- **Precondition:** Landing page rendered
- **Action:** Locate the scope-contract-enforcement hero card in the response HTML
- **Expected result:** A headline element, exactly one supporting sentence, and a concrete visual/example element (e.g. an illustrative file-touchpoint list vs. diff comparison) are all present
- **Edge case:** No

### scopeContractCard_copyNamesRealMechanism_notGenericClaim

- **Verifies:** AC2
- **Precondition:** Landing page rendered
- **Action:** Inspect the card's copy text
- **Expected result:** Copy references the concrete mechanism (DoR scope contract / assurance gate / file-touchpoint check) — text assertion confirms absence of generic phrases like "safe AI" or "guardrails" used without concrete backing
- **Edge case:** No

---

## Integration Tests

None — static content card, no cross-component handoff.

---

## E2E Tests

### scopeContractCard_readableAt320And1280_noHorizontalScroll

- **Verifies:** AC3
- **Precondition:** Landing page loaded in a real browser
- **Action:** Set viewport to 320px width, check `document.body.scrollWidth`; repeat at 1280px
- **Expected result:** `scrollWidth` does not exceed the viewport width at either size; the hero card's text and example visual remain fully visible without horizontal scrolling
- **Edge case:** No
- **Tool:** Playwright

---

## NFR Tests

None — story NFRs (Performance, Security, Accessibility) are either covered by AC-level tests above or are "no server-side computation" claims not requiring a dedicated NFR test (Performance NFR is a design constraint, not a measurable threshold for this static card).

---

## Out of Scope for This Test Plan

- Testing the golden-trace demo mechanism itself — covered by `lphf-s1`'s own test plan.
- Visual regression / pixel-perfect comparison — the E2E test checks functional layout (no overflow), not exact visual appearance.

---

## Test Gaps and Risks

None identified.
