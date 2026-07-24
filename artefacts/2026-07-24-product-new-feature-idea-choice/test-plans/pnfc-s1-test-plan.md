## Test Plan: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**Story reference:** artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Choice presented before journey/session creation | — | — | 1 test | — | — | 🟢 |
| AC2 | Rough-idea path registers ideate, keeps productId | — | 1 test | — | — | — | 🟢 |
| AC3 | Formed-idea path registers discovery, keeps productId | — | 1 test | — | — | — | 🟢 |
| AC4 | New feature correctly attributed to product afterward | — | 1 test | — | — | — | 🟢 |
| AC5 | Existing /journey flow unregressed | — | — | — | — | — | 🟢 (existing tests re-run) |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC4 | A test product, a test tenant/session | Existing fixtures (mirrors `handlePostProductFeature`'s existing test setup, if any, or the fake-test-db pattern established this session) | None | |
| AC5 | Existing `/journey`-flow tests | Existing test suite, reused unmodified | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's logic is inherently request/response-level (form submission → session registration → redirect), best covered at Integration/E2E level; no isolated pure-function logic is introduced beyond what's already covered by `handlePostJourney`'s own existing tests (reused, not duplicated).

---

## Integration Tests

### roughIdeaChoiceRegistersIdeateSessionKeepsProductId

- **Verifies:** AC2
- **Components involved:** `handlePostProductFeature` (extended), journey store
- **Precondition:** A test product exists; operator submits the new-feature form with `startSkill=ideate`
- **Action:** POST to the product-scoped new-feature endpoint with `startSkill=ideate`
- **Expected result:** Created journey's registered session has `skillName === 'ideate'`; journey's `productId` matches the originating product; redirect targets `/skills/ideate/sessions/:id/chat`

### formedIdeaChoiceRegistersDiscoverySessionKeepsProductId

- **Verifies:** AC3
- **Components involved:** Same as above
- **Precondition:** Same product; operator submits with `startSkill=discovery` (or omits it, matching the existing default)
- **Action:** POST with `startSkill=discovery`
- **Expected result:** Created journey's registered session has `skillName === 'discovery'`; `productId` matches; redirect targets `/skills/discovery/sessions/:id/chat` — matches today's existing behaviour exactly

### newFeatureViaIdeatePathVisibleOnProductPage

- **Verifies:** AC4
- **Components involved:** `handlePostProductFeature`, `handleGetProductView` (or equivalent product-scoped feature-list query)
- **Precondition:** A journey created via the rough-idea path (AC2)
- **Action:** Fetch the product's own feature/journey list
- **Expected result:** The new journey appears, correctly attributed to the product — no regression versus the formed-idea path's existing correct attribution

### existingJourneyPageFlowUnregressed

- **Verifies:** AC5
- **Components involved:** `handlePostJourney`, `/journey` page's own existing tests
- **Precondition:** N/A — existing test suite
- **Action:** Run any existing tests covering `/journey`'s own new-feature form/`handlePostJourney` unmodified
- **Expected result:** All pass with zero changes to their own test code

---

## E2E Tests

### productPageNewFeatureButtonPresentsChoice

- **Verifies:** AC1
- **Precondition:** A logged-in test session viewing a product's page
- **Action:** Click "New feature" in a real browser (Playwright, local `NODE_ENV=test` harness)
- **Expected result:** A choice (radio buttons or equivalent) between rough-idea and formed-idea is shown before any journey/session is created — not an immediate redirect

---

## NFR Tests

### None — confirmed with story owner

No performance/security/audit NFRs beyond what's already covered above; this story reuses existing, already-tested session-registration and product-ownership logic.

---

## Out of Scope for This Test Plan

- Any new test for `/journey`'s own choice UI — already covered by its existing test suite, reused not duplicated.
- Any change to `/ideate`'s or `/discovery`'s own downstream skill behaviour — out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
