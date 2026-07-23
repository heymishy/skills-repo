## Test Plan: Style the admin credits page with the shared design system shell

**Story reference:** artefacts/2026-07-24-admin-credits-page-styling/stories/acps-s1.md
**Test plan author:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Page wrapped in renderShell, shared nav/tokens present | 1 test | — | — | — | — | 🟢 |
| AC2 | Tenant table data/fields unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 | Existing CSRF/adjust flow unaffected | — | 1 test | — | — | — | 🟢 |
| AC4 | Navigation path back to dashboard exists | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — pure server-rendered HTML change, fully testable via existing Node test conventions (no CSS-layout/visual dependency; `renderShell`'s own token application is already proven elsewhere in this repo, not re-verified here).

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A rendered `adminCreditsGet` response | Direct handler call with mock req/res | None | |
| AC2 | Mock `getAllTenantBalances()` returning 2+ tenant rows | Existing test mocking pattern from `check-arl-s3-admin-credits.js` | None | |
| AC3 | Existing `check-sec-perf-s3-admin-credits-csrf.js` test suite | Unmodified, reused | None | |
| AC4 | Same rendered response as AC1 | Same | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### adminCreditsGetWrapsInRenderShell

- **Verifies:** AC1
- **Precondition:** Mock `getAllTenantBalances()` returns 1+ rows
- **Action:** Call `adminCreditsGet(req, res)` directly, capture the response HTML
- **Expected result:** Response HTML contains markers confirming `renderShell` was used (e.g. the shared nav's known class names/structure, not a bare `<!DOCTYPE html>`/`<h1>` with no shell) — assert absence of the OLD bare markup pattern and presence of the shell's known structure
- **Edge case:** No

### adminCreditsGetPreservesTableData

- **Verifies:** AC2
- **Precondition:** Mock `getAllTenantBalances()` returns 2 known tenant rows with specific IDs/balances
- **Action:** Call `adminCreditsGet(req, res)`, parse the response HTML
- **Expected result:** Both tenant IDs and balances appear correctly (still `escapeHtml`'d), and each row's adjust form (CSRF field, hidden tenantId, amount input, submit button) is present and unchanged in structure
- **Edge case:** No

### adminCreditsGetHasNavigationBack

- **Verifies:** AC4
- **Precondition:** Same as AC1
- **Action:** Parse the response HTML
- **Expected result:** A link/nav element pointing back to the dashboard (`/dashboard` or equivalent) is present — via `renderShell`'s own nav, not a page-specific back-link

---

## Integration Tests

### existingCsrfAndAdjustFlowUnaffected

- **Verifies:** AC3
- **Components involved:** `adminCreditsPost`, `csrfGuard`, `adjustBalanceWithAudit`
- **Precondition:** N/A — this test IS the existing `tests/check-sec-perf-s3-admin-credits-csrf.js` and `tests/check-arl-s5-credit-audit-log.js` suites, run unmodified
- **Action:** Run both existing test files
- **Expected result:** Both pass with zero changes to their own test code — this story's restyle of `adminCreditsGet` does not require touching `adminCreditsPost` at all

---

## NFR Tests

### None — confirmed with story owner

No performance/security/audit NFRs beyond what's already covered by the existing, unmodified `adminCreditsPost` test suites (AC3). Accessibility NFR is inherited from `renderShell`'s own existing, already-tested accessibility properties — no new test needed since this story doesn't modify `renderShell` itself.

---

## Out of Scope for This Test Plan

- Any test of `renderShell()`'s own internal correctness — already covered by its own existing test suite elsewhere in this repo.
- `adminCreditsPost`'s own logic — untouched, covered by existing tests reused as-is.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
