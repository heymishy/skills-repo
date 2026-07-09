## Test Plan: Create and wire the 3 initial flags across both projects

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Test plan author:** Copilot
**Date:** 2026-07-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `wizard-ui` flag off → wizard canvas element does not render; on → renders | — | 2 tests | — | 1 scenario (real staging+prod project existence) | External-dependency | 🟡 |
| AC2 | `product-kanban-view` off → `handleGetProductKanban` returns not-found/disabled; on → renders normally | 1 test | 2 tests | — | — | — | 🟢 |
| AC3 | `org-kanban-view` on for one tenant → `handleGetOrgKanban` renders for that tenant; other tenants get not-found/disabled | — | 2 tests | — | — | — | 🟢 |
| AC4 | All 3 flags exist by the same name in both staging and prod PostHog projects | 1 test | — | — | 1 scenario | External-dependency | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable pre-implementation | Handling |
|-----|----|----------|--------------------------------------|---------|
| Confirming the `wizard-ui` flag genuinely exists and behaves correctly in the real staging **and** real prod PostHog project independently (not just via a mocked adapter) | AC1 | External-dependency | No live PostHog projects are queried in this test plan per the confirmed synthetic/mocked test-data strategy; the automated tests below verify the *code's* on/off behaviour is correct given any adapter response, not that the real dashboard configuration matches | Manual scenario in the AC verification script — Hamish confirms flag existence/behaviour directly in both PostHog dashboards post-deploy |
| Confirming all 3 flags exist by the same name in both the real staging and real prod PostHog projects | AC4 | External-dependency | Comparing two live project's flag lists requires real PostHog dashboard/API access; explicitly named in the story's Out of Scope as "manual verification is sufficient for MVP" | Manual scenario in the AC verification script — Hamish visually compares the flag list in both PostHog project dashboards |

---

## Test Data Strategy

**Source:** Mocked (PostHog adapter's `isEnabled()` mocked per flag/tenant combination; real handlers `handleGetProductKanban`/`handleGetOrgKanban`/`handleGetWizard` exercised directly with mocked `pool`/`posthog`/`isEnabled`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `isEnabled('wizard-ui', ...)` toggled true/false | Mocked | None | Exercised via `handleGetWizard` (`src/web-ui/routes/journey.js`) |
| AC2 | Mock `isEnabled('product-kanban-view', ...)` toggled true/false; fake `pool.query` returning a small fixed journeys result set | Mocked | None | Exercised via `handleGetProductKanban` (`src/web-ui/routes/products.js`) |
| AC3 | Mock `isEnabled('org-kanban-view', { tenantId })` returning true only for a targeted tenant; fake `pool.query` returning fixed product/journey rows scoped by `tenant_id` | Mocked | None | Exercised via `handleGetOrgKanban` (`src/web-ui/routes/products.js`) |
| AC4 | A shared flag-key constants module listing the 3 exact flag name strings | Synthetic | None | Guards against typo drift between code and the real PostHog dashboard entries |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the two External-dependency gaps logged above.

---

## Unit Tests

### Flag key constants match the exact 3 names required by this story

- **Verifies:** AC4 (code-side half — ensures the strings used in code are exactly right, even though comparing them against the live dashboard is a separate manual step)
- **Precondition:** A shared constants module (e.g. `src/web-ui/modules/flag-keys.js`) exports the 3 flag key strings used by every call site, per the D37 requirement in this story's Architecture Constraints that "each flag check goes through the shared `isEnabled()` helper — no flag-specific bespoke evaluation logic."
- **Action:** Assert the exported object equals `{ WIZARD_UI: 'wizard-ui', PRODUCT_KANBAN_VIEW: 'product-kanban-view', ORG_KANBAN_VIEW: 'org-kanban-view' }` (or equivalent naming).
- **Expected result:** Exact string match — no typos, no stray whitespace, no leftover reference to the superseded placeholder names (`model-routing-glm52`, `billing-v2`) from before this story's 2026-07-09 correction.
- **Edge case:** Yes — guards specifically against the corrected story's stale placeholder names leaking back in.

### handleGetProductKanban does not query the database when the product-kanban-view flag is off

- **Verifies:** AC2 (efficiency/gating shape — confirms the flag check gates before the expensive DB call, not just before the response)
- **Precondition:** Mock `isEnabled('product-kanban-view', ...)` resolves `false`; `pool.query` replaced with a spy.
- **Action:** Call `handleGetProductKanban(req, res, next, mockPool, mockPosthog)`.
- **Expected result:** `pool.query` spy is never called; the handler short-circuits directly to the not-found/disabled response.
- **Edge case:** Yes.

---

## Integration Tests

### wizard-ui flag off omits the wizard canvas gated element from handleGetWizard's response

- **Verifies:** AC1
- **Components involved:** `handleGetWizard` (`src/web-ui/routes/journey.js`), mocked `isEnabled()`.
- **Precondition:** Mock `isEnabled('wizard-ui', ...)` resolves `false`.
- **Action:** Call `handleGetWizard(req, res)`.
- **Expected result:** The rendered HTML does not contain the wizard-canvas gated element/marker.

### wizard-ui flag on includes the wizard canvas gated element in handleGetWizard's response

- **Verifies:** AC1
- **Components involved:** Same as above.
- **Precondition:** Mock `isEnabled('wizard-ui', ...)` resolves `true`.
- **Action:** Call `handleGetWizard(req, res)`.
- **Expected result:** The rendered HTML contains the wizard-canvas gated element/marker.

### product-kanban-view flag off returns a not-found/disabled response from handleGetProductKanban

- **Verifies:** AC2
- **Components involved:** `handleGetProductKanban` (`src/web-ui/routes/products.js`), mocked `isEnabled()`, mocked `pool`.
- **Precondition:** Mock `isEnabled('product-kanban-view', ...)` resolves `false`.
- **Action:** Call `handleGetProductKanban(req, res, next, mockPool, mockPosthog)` with a `req.params.id` set to a fake product id.
- **Expected result:** The response is a not-found/disabled shape (e.g. HTTP 404, or a JSON body indicating the feature is disabled) rather than the normal `{ columns: [...] }` board payload.

### product-kanban-view flag on returns the normal kanban board from handleGetProductKanban

- **Verifies:** AC2
- **Components involved:** Same as above.
- **Precondition:** Mock `isEnabled('product-kanban-view', ...)` resolves `true`; `pool.query` returns a small fixed set of journey rows.
- **Action:** Call `handleGetProductKanban(req, res, next, mockPool, mockPosthog)`.
- **Expected result:** The response contains the normal `{ columns: [...] }` kanban payload, matching the existing (pre-flag) behaviour of the handler.

### org-kanban-view flag on for the targeted tenant renders the org kanban board via handleGetOrgKanban

- **Verifies:** AC3
- **Components involved:** `handleGetOrgKanban` (`src/web-ui/routes/products.js`), mocked `isEnabled()` keyed by `context.tenantId`, mocked `pool`.
- **Precondition:** Mock `isEnabled('org-kanban-view', { tenantId: 'tenant-x' })` resolves `true`; `req.session.tenantId = 'tenant-x'`.
- **Action:** Call `handleGetOrgKanban(req, res, next, mockPool, mockPosthog)`.
- **Expected result:** The response contains the normal `{ groups: [...] }` org-kanban payload.

### org-kanban-view flag off for a non-targeted tenant returns not-found/disabled via handleGetOrgKanban, with no cross-tenant data leak

- **Verifies:** AC3; also exercises the ADR-025 tenant-isolation guard referenced in this story's Security NFR (see NFR note below on the stale "billing-v2" reference)
- **Components involved:** Same as above.
- **Precondition:** Mock `isEnabled('org-kanban-view', { tenantId: 'tenant-y' })` resolves `false`; `req.session.tenantId = 'tenant-y'`; `pool.query` seeded with rows belonging to `tenant-x` only.
- **Action:** Call `handleGetOrgKanban(req, res, next, mockPool, mockPosthog)` for `tenant-y`.
- **Expected result:** The response is a not-found/disabled shape; critically, it does not contain any of `tenant-x`'s product/journey data — confirming the flag-off path does not accidentally leak another tenant's board contents before the gate is applied.

---

## NFR Tests

### Performance

- **NFR addressed:** Performance — **None beyond S1.1/S1.3's existing budgets**, per story text. No separate test written.

### org-kanban-view's flag-off path never exposes another tenant's data, even transiently

- **NFR addressed:** Security
- **Measurement method:** The "org-kanban-view flag off for a non-targeted tenant" integration test above, asserting the disabled response body contains zero fields from the seeded `tenant-x` data.
- **Pass threshold:** Zero occurrences of `tenant-x`'s `product_id`/`journey_id`/`name` values anywhere in the flag-off response body for `tenant-y`.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-bri-s1.5-initial-flags-wired.js`.
- **Note on story text discrepancy:** the story's NFR section still reads "`billing-v2` gating must not expose billing data for a tenant it isn't targeted at" — `billing-v2` was one of the two illustrative placeholder flags removed by this story's 2026-07-09 correction (replaced with `product-kanban-view`/`org-kanban-view`) and the NFR line itself was not updated to match. This test plan applies the same tenant-isolation principle to `org-kanban-view` (the flag that actually exposes tenant-scoped board data per AC3) rather than silently dropping the NFR. Flagging this wording mismatch for `/definition-of-ready` to correct at the story level.

### Accessibility

- **NFR addressed:** Accessibility ("the `wizard-ui` gated element meets the same WCAG 2.1 AA bar... no new exemption introduced by flag-gating")
- **Measurement method:** No new automated scan is added by this story — the story's own framing is a *no-regression* claim, not a new accessibility surface. The gating mechanism (server-side omission of the whole element, per S1.3) is already verified by the "wizard-ui flag off omits the wizard canvas gated element" integration test above; since the element is either fully present (its existing markup, unmodified) or fully absent — never partially hidden via CSS/`aria-hidden` — there is no new accessibility failure mode introduced for this test plan to cover.
- **Pass threshold:** N/A — covered structurally by AC1's integration tests.
- **Tool:** N/A.

### Audit

- **NFR addressed:** Audit — **None identified beyond S1.1**, per story text. No test written.

---

## Out of Scope for This Test Plan

- A 4th flag beyond the 3 named — explicitly out of scope in the story.
- Automated flag-parity checking between the staging and prod PostHog projects (a CI check comparing flag lists) — explicitly out of scope in the story; "manual verification is sufficient for MVP."
- Verifying the real PostHog dashboard configuration (flag existence, per-project mirroring, real tenant targeting rules) — requires live PostHog project access; see Coverage gaps above.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real staging + prod PostHog project flag existence and mirroring (AC4) | Requires live dashboard/API access to both real projects; explicitly named as manual-only in the story's Out of Scope | Manual scenario in the AC verification script; Hamish performs the visual comparison post-setup |
| Real independent verification of `wizard-ui` behaviour in the actual staging vs. actual prod project (AC1's "verified in both environments independently") | No live staging environment exists yet (Epic 2 not complete); this test plan can only prove the code's on/off logic is correct given a mocked adapter, not that the real dashboards are configured correctly | Manual scenario in the AC verification script; re-verify once Epic 2's staging environment reaches DoD, consistent with the ADR-018/PAT-06 pattern used in bri-s1.2 |
