## Test Plan: Self-improving harness hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s4-self-improving-harness-hero-card.md
**Epic reference:** artefacts/2026-08-08-landing-page-hero-features/epics/epic-1-landing-page-hero-features.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Displays a real, non-invented count from workspace/learnings.md | 1 test | — | — | — | — | 🟢 |
| AC2 | Copy doesn't imply real-time live updating | 1 test | — | — | — | — | 🟢 |
| AC3 | Names the human-review gate explicitly | 1 test | — | — | — | — | 🟢 |
| AC4 | Readable at 320px and 1280px, no horizontal scroll | — | — | 1 test | — | CSS-layout-dependent | 🔴 |

---

## Coverage gaps

None — AC4 covered by a real Playwright E2E test.

---

## Test Data Strategy

**Source:** Synthetic — the learnings count is a real number pulled from `workspace/learnings.md` at implementation time (not hardcoded — per review finding 1-M1's fix), rendered into the static template at build time.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Current entry count in `workspace/learnings.md`, at implementation time | Count `## ` headings (or equivalent entry markers) in `workspace/learnings.md` | None | The test must assert "a real, parseable count greater than 0" — not a hardcoded literal number, since the real count changes over time |
| AC2 | The card's copy text | Static template content | None | |
| AC3 | The card's copy text | Static template content | None | |
| AC4 | Rendered page at 320px and 1280px | Live Playwright browser render | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### selfImprovingCard_displaysRealNonZeroLearningsCount

- **Verifies:** AC1 (reworded post-review, run 1, finding 1-M1)
- **Precondition:** `workspace/learnings.md` exists with at least 1 entry
- **Action:** Locate the self-improving-harness hero card; extract the displayed count
- **Expected result:** The displayed count is a real, parseable integer greater than 0 — the test asserts the number is correctly derived from `workspace/learnings.md` at build/render time, not a hardcoded literal (e.g. asserts equality against a freshly-counted value from the actual file, not against a fixed constant like `246`)
- **Edge case:** No

### selfImprovingCard_copyDoesNotImplyLiveUpdating

- **Verifies:** AC2
- **Precondition:** Landing page rendered
- **Action:** Inspect the card's copy text
- **Expected result:** Copy does not contain phrases implying real-time updating (e.g. "live," "right now," "updating as you read this") — text assertion for absence of these phrases
- **Edge case:** No

### selfImprovingCard_namesHumanReviewGateExplicitly

- **Verifies:** AC3
- **Precondition:** Landing page rendered
- **Action:** Inspect the card's copy text
- **Expected result:** Copy explicitly mentions human review/approval gating the improvement process (e.g. contains "human review" or "gated by")
- **Edge case:** No

---

## Integration Tests

None — static content card; the learnings-count extraction is a build-time step, not a runtime integration.

---

## E2E Tests

### selfImprovingCard_readableAt320And1280_noHorizontalScroll

- **Verifies:** AC4
- **Precondition:** Landing page loaded in a real browser
- **Action:** Set viewport to 320px, check `scrollWidth`; repeat at 1280px
- **Expected result:** No horizontal overflow at either size
- **Edge case:** No
- **Tool:** Playwright

---

## NFR Tests

None — same rationale as `lphf-s2`/`lphf-s3`.

---

## Out of Scope for This Test Plan

- Live-updating the count after launch — explicitly out of scope per the story (a follow-on).
- Testing the improvement-agent's actual SKILL.md-diff mechanism — this card describes it, doesn't re-verify it.

---

## Test Gaps and Risks

None identified.
