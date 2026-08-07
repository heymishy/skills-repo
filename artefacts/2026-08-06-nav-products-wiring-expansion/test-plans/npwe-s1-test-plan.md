## Test Plan: Show the Products sidebar during skill chat sessions

**Story reference:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-06

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Products sidebar visible + active product highlighted on all 6 in-scope page types | 6 tests | — | — | — | — | 🟢 |
| AC2 | Product continuity across wired → newly-wired page transition | — | 1 test | — | — | — | 🟢 |
| AC3 | "No product" bucket highlighted correctly | 1 test | — | — | — | — | 🟢 |
| AC4 | ~50 out-of-scope call sites byte-for-byte unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are server-rendered HTML string assertions, testable without a browser — no CSS-layout dependence (matches AC1/AC4's own precedent classification from `mtrr-s2`'s test plan: DOM-state/string content, not visual rendering).

---

## Test Data Strategy

**Source:** Mocked Postgres pool via `setDbPool`/`getDbPool` (this story's own D37 wiring, per its Architecture Constraints)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture tenant with 2+ products, one active journey per skill-session page type | Synthetic (mocked pool) | None | |
| AC2 | Fixture journey + product, rendered first via `/journey/:id` then via a chat-session page for the same journey | Synthetic | None | |
| AC3 | Fixture journey with no `productId` set | Synthetic | None | |
| AC4 | Rendered HTML snapshot of each excluded call site, captured before and after this story's changes | Synthetic (diff against pre-change fixture) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### skillsListPage_showsProductsSidebar

- **Verifies:** AC1 (Run a Skill list)
- **Precondition:** Fixture tenant with 2+ products; `setDbPool` wired to the mocked pool
- **Action:** Render the Run a Skill list page (`handleGetSkillsHtml`)
- **Expected result:** Rendered HTML contains the Products sidebar section listing both fixture products
- **Edge case:** No

### questionPage_showsProductsSidebarWithActiveHighlight

- **Verifies:** AC1 (question page)
- **Precondition:** Fixture journey belonging to product A
- **Action:** Render a question page (`handleGetQuestionHtml`) for that journey's session
- **Expected result:** Rendered HTML contains the Products sidebar with product A marked active (`sw-product-nav-item--active` class present on A's row, absent on others)
- **Edge case:** No

### chatPage_showsProductsSidebarWithActiveHighlight

- **Verifies:** AC1 (live chat page)
- **Precondition:** Fixture journey belonging to product B
- **Action:** Render the chat page (`handleGetChatHtml`) for that journey's session
- **Expected result:** Rendered HTML contains the Products sidebar with product B marked active
- **Edge case:** No

### commitPreviewPage_showsProductsSidebar

- **Verifies:** AC1 (commit preview)
- **Precondition:** Fixture journey mid-commit-preview flow
- **Action:** Render `handleGetCommitPreviewHtml`
- **Expected result:** Rendered HTML contains the Products sidebar with the correct product active
- **Edge case:** No

### commitCompletePage_showsProductsSidebar

- **Verifies:** AC1 (commit complete)
- **Precondition:** Fixture journey post-commit
- **Action:** Render `handlePostCommitHtml`'s response
- **Expected result:** Rendered HTML contains the Products sidebar with the correct product active
- **Edge case:** No

### draftCompletePage_showsProductsSidebar

- **Verifies:** AC1 (draft complete)
- **Precondition:** Fixture journey at draft-complete state
- **Action:** Render `htmlGetCompletePage`
- **Expected result:** Rendered HTML contains the Products sidebar with the correct product active
- **Edge case:** No

### noProductJourney_showsNoProductRowActive

- **Verifies:** AC3
- **Precondition:** Fixture journey with `productId: null`
- **Action:** Render a skill-chat-session page (any of the 6 in-scope types) for that journey
- **Expected result:** Rendered HTML shows the pinned "No product" row with the active class, and no product row is marked active
- **Edge case:** Yes — the no-product boundary case

---

## Integration Tests

### productContinuity_journeyPageToChatSessionPage

- **Verifies:** AC2
- **Components involved:** `journey.js`'s `handleGetJourney` (already wired), one newly-wired `skills.js` handler, shared `getProductsNavSummary`
- **Precondition:** Fixture journey belonging to product C
- **Action:** Render `/journey/:id` for that journey, then render a chat-session page for the same journey's active stage
- **Expected result:** Both renders show product C as active — identical active-product resolution across the wired/newly-wired boundary

### excludedCallSites_remainByteForByteUnchanged

- **Verifies:** AC4
- **Components involved:** All ~50 out-of-scope `renderShell` call sites (journey sub-pages, artefact viewer, `features.js`, admin pages, settings)
- **Precondition:** HTML snapshot of each excluded call site captured against the pre-change codebase
- **Action:** Re-render each excluded call site after this story's changes are applied
- **Expected result:** Every snapshot is byte-for-byte identical to its pre-change capture — mirrors `pan-s1`'s own AC5 regression-guard test technique exactly

---

## NFR Tests

### productsSidebarQuery_noNPlusOne

- **NFR addressed:** Performance
- **Measurement method:** Assert `getProductsNavSummary` is called exactly once per page render across all 6 newly-wired page types (mocked pool call-count assertion)
- **Pass threshold:** Exactly 1 call per render, matching the 3 already-wired pages' existing cost
- **Tool:** Mocked pool call-count assertion

---

## Out of Scope for This Test Plan

- The ~50 excluded call sites' own functional behavior (unrelated to this story) — only their byte-for-byte-unchanged HTML output is asserted (AC4), not their business logic.
- `pan-s1`'s own 3 already-wired pages' existing test coverage — unchanged, not re-tested here.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
