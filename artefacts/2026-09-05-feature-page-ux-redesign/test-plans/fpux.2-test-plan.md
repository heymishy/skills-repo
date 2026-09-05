## Test Plan: Audit and fix the navigation path into `/features/:slug`

**Story reference:** artefacts/2026-09-05-feature-page-ux-redesign/stories/fpux.2-audit-and-fix-nav-path.md
**Epic reference:** artefacts/2026-09-05-feature-page-ux-redesign/epics/page-and-nav-redesign.md
**Test plan author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-05

**Test runner confirmed from `package.json`:** `npm test` → `node scripts/run-all-tests.js`. `npm run test:e2e` → `playwright test`.

**E2E tooling check (Step 3a):** None of this story's ACs trigger the browser-layout-dependent pattern (no drag-drop, no coordinate/position assertions, no visual-rendering language) — this story is about routing/link correctness, not visual rendering. Category E2E tests below use Playwright for real navigation/link-following, which is standard E2E use, not the CSS-layout-dependent gate.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Exhaustive, documented list of real entry points into `/features/:slug` | — | — | — | 1 scenario | Untestable-by-nature | 🔴 |
| AC2 | Each of the 3 named entry points leads directly to the target page, no dead-end | — | — | 3 tests | — | — | 🟢 |
| AC3 | Any dead-end found is fixed and re-verified | — | — | 0 tests (see gap) | — | External-dependency | 🔴 |
| AC4 | `benefit-metric.md`'s M3 row updated with real baseline/target | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in the current suite | Handling |
|-----|----|----------|------------------------------------------|---------|
| Whether the documented entry-point list is genuinely exhaustive is a judgment call, not a machine-checkable property | AC1 | Untestable-by-nature | "Is this list complete?" cannot be verified by a test runner — it requires a human (or the coding agent, using judgment) to trace the actual route table in `src/web-ui` and confirm nothing was missed | Manual scenario in verification script 🔴 — the scenario asks the reviewer to independently `grep -rn` the route table and compare against the story's own documented list |
| AC3's exact regression test cannot be written until the AC1/AC2 audit identifies which (if any) hop is actually broken | AC3 | External-dependency (depends on this story's own audit outcome, unknown until AC1/AC2 run) | The specific defect, if any exists, is not yet known — writing a test now would either test nothing (if no defect exists) or guess at the wrong defect | The coding agent adds a regression test for the *specific* defect found, at implementation time — matching this repo's own established convention of test-per-fix (e.g. `pebd-s1`'s fixture fix, `stcs-s1`'s retry-exhaustion fix). If AC1/AC2's audit finds zero defects, AC3 is vacuously satisfied and this row is closed with "no defect found" recorded in the DoD. |

---

## Test Data Strategy

**Source:** Synthetic (no real user data; navigation is exercised via the existing auth-stub, `src/web-ui/routes/auth-stub.js`, per `product/constraints.md`-adjacent staging-safe auth convention already used by other E2E specs in this repo).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC2 | A test feature slug reachable via the dashboard/product-page/story-DoD routes | Existing E2E auth-stub + a fixture feature slug (matching `feature-navigation.spec.js`'s own `withAuth` convention) | None | |
| AC4 | The real `benefit-metric.md` file for this feature | Already exists in this repo (not synthetic — a real artefact file, but not sensitive data) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `benefit-metric.md`'s M3 row no longer contains placeholder baseline/target text

- **Verifies:** AC4
- **Precondition:** `artefacts/2026-09-05-feature-page-ux-redesign/benefit-metric.md` exists on disk.
- **Action:** Read the file and search the M3 row (Metric 3: Navigation path clarity) for the literal strings `"Not yet established"` and `"TBD"`.
- **Expected result:** Neither literal string is present in the M3 row after this story completes — both have been replaced with real, specific values established by the AC1 audit.
- **Edge case:** No.

---

## Integration Tests

None — no new component handoff is introduced by this story (routing/link fixes only, within existing route handlers).

---

## NFR Tests

None — confirmed. This story's NFRs (Performance: none identified; Security: existing auth-guard unchanged; Accessibility: existing `<a>` elements remain natively keyboard-navigable, no new custom control) require no dedicated test beyond the functional E2E tests already covering navigation itself.

---

## E2E Tests (Playwright, `npm run test:e2e`)

### E1 — Dashboard entry point leads directly to the target feature page (AC2)

- **Setup:** Authenticated session (`withAuth` fixture), a fixture feature visible on the dashboard.
- **Action:** `page.goto('/dashboard')`, click the fixture feature's row/link.
- **Expected result:** Final URL matches `/features/<fixture-slug>`, response status 200, no intermediate redirect to an error page or unauthenticated bounce.

### E2 — Product-page entry point leads directly to the target feature page (AC2)

- **Setup:** Same as E1, navigating via the feature's product page instead.
- **Action:** `page.goto('/products/<fixture-product-id>')`, click through to the fixture feature.
- **Expected result:** Same as E1 — direct arrival at `/features/<fixture-slug>`, 200, no dead-end.

### E3 — Story DoD "Resume conversation"/artefact link leads directly to the target feature page (AC2)

- **Setup:** Same fixture, with a story that has a resolvable journey (matching `_resolveResumeLinksForFeature`'s existing precondition).
- **Action:** From the story's own DoD/artefact link, follow it back to the parent feature's `/features/:slug` page (or confirm the existing "Resume conversation" link's own documented destination, per `dsh-s4`'s `/journey/:journeyId/stage/:stageName` route, correctly round-trips back to a reachable state).
- **Expected result:** No 404, no unauthenticated redirect loop, no dead page.

---

## Out of Scope for This Test Plan

- Verifying the *visual* appearance of the dashboard, product page, or breadcrumb — that's `fpux.1`'s scope (this page only). This test plan verifies routing/link correctness only.
- Any entry point not named in the discovery/clarify audit (AC1) — if AC1's own audit finds a new, previously-unknown entry point, this test plan will need a corresponding new E2E test added at that time, not written speculatively now.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's "is the list exhaustive" claim | Not machine-checkable — requires human/agent judgment against the real route table | Manual verification scenario 🔴 in the AC verification script, requiring an independent `grep -rn` cross-check, not just trusting the story's own prose |
| AC3's regression test doesn't exist yet | The specific defect (if any) isn't known until AC1/AC2's audit runs | Coding agent writes the regression test for whatever specific defect is found, at implementation time — or records "no defect found" if the audit is clean |
