## Test Plan: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md`
**Epic reference:** `artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md`
**Test plan author:** Claude (session)
**Date:** 2026-10-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Lists ACs scoped to requesting tenant/product, DoD-complete via `completedStages` | 2 | 1 | — | — | — | 🟢 |
| AC2 | Stores a capture target `{acId,url,selector}` in `journeys.data.captureTargets` | 2 | 1 | — | — | — | 🟢 |
| AC3 | Capture via session-reuse auth + stored target | 1 | 2 | — | — | — | 🟢 |
| AC4 | UI shows "capture target not set" when none stored | 1 | — | — | — | — | 🟢 |
| AC5 | Captured screenshot displays inline, no download step | 1 | 1 | — | — | — | 🟢 |
| AC6 | Tenant isolation on a `feature_slug` collision | — | 2 | — | — | — | 🟢 |
| AC7 | 403/not-found on direct cross-tenant access, no metadata leak | — | 1 | — | — | — | 🟢 |
| AC8 | New session-to-Playwright adapter: stub throws until wired, wiring verified by behavioural test (D37/H-ADAPTER) | 1 | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None — every AC has automated coverage. Accessibility (WCAG 2.1 AA) is manual-only because this repo has no automated accessibility tooling configured (confirmed absent — no `axe`/`pa11y` in `package.json` or `tests/`); tracked as a known, pre-existing repo-wide limitation, not a story-specific gap.

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No — all fixtures are synthetic, never real tenant data.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey row with `completedStages` containing a `definition-of-done` entry, scoped to a known `tenant_id`/`product_id` | Synthetic fixture | None | |
| AC2 | An empty `journeys.data.captureTargets` to write into | Synthetic fixture | None | |
| AC3 | A known fake `req.sessionId`; a mocked Playwright context/page object; a stored target from AC2 | Mocked | None | Mocked Playwright object per this repo's existing `captureAcScreenshots` injection convention |
| AC4 | A journey/AC combination with no `captureTargets` entry | Synthetic fixture | None | |
| AC5 | A persisted screenshot record for one AC | Synthetic fixture | None | |
| AC6 | Two tenants (A, B), each with a journey row sharing the same `feature_slug` | Seeded test DB | None | The real collision scenario `rpca`'s own `/playback` gap analysis was built on |
| AC7 | Tenant A's authenticated session; tenant B's known feature id | Seeded test DB | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Lists only the requesting tenant's own DoD-complete features

- **Verifies:** AC1
- **Precondition:** Three journey fixtures across two tenants; only one is DoD-complete and belongs to the requesting `tenant_id`/`product_id`.
- **Action:** Call the surface's query function with the requesting `tenantId`/`productId`.
- **Expected result:** Only the matching tenant+product's DoD-complete feature is returned; the other two are absent.
- **Edge case:** No.

### Determines DoD-complete via `completedStages`, not a new field

- **Verifies:** AC1
- **Precondition:** One journey fixture has `data.completedStages` containing `{skillName: 'definition-of-done', ...}`; another has `completedStages` with no such entry.
- **Action:** Call `isDodComplete(journey)` against both fixtures.
- **Expected result:** Returns `true` for the first, `false` for the second.
- **Edge case:** Yes — the "not complete" case.

### Stores a capture target keyed by AC id

- **Verifies:** AC2
- **Precondition:** A journey fixture with no `captureTargets` entry for the given AC id.
- **Action:** Call `setCaptureTarget(journey, acId, url, selector)`.
- **Expected result:** `journey.data.captureTargets` contains `{acId, url, selector}`; any other existing entries are untouched.
- **Edge case:** No.

### Re-entering a target for the same AC id replaces, not duplicates

- **Verifies:** AC2
- **Precondition:** A journey fixture already has a `captureTargets` entry for `acId`.
- **Action:** Call `setCaptureTarget(journey, acId, newUrl, newSelector)` with a different url/selector.
- **Expected result:** Exactly one entry exists for that `acId`, holding the new values — not two entries.
- **Edge case:** Yes.

### Reports "not set" state for an AC with no stored target

- **Verifies:** AC4
- **Precondition:** An AC with no corresponding `captureTargets` entry.
- **Action:** Call `getCaptureTargetState(ac)`.
- **Expected result:** Returns a `NOT_SET` marker, not `undefined`/`null`/a thrown error.
- **Edge case:** No.

### Renders a captured screenshot reference inline once a capture record exists

- **Verifies:** AC5
- **Precondition:** A persisted screenshot record exists for one AC.
- **Action:** Render that AC's row.
- **Expected result:** The rendered output contains an image reference for that AC; no separate download link or step is present.
- **Edge case:** No.

### Session-to-Playwright adapter stub throws until wired

- **Verifies:** AC8 (D37/H-ADAPTER)
- **Precondition:** The adapter module is loaded with no `setSessionPageAdapter()` (or equivalent) call having been made yet.
- **Action:** Call the adapter's default stub.
- **Expected result:** It throws an explicit `Error` naming the adapter and instructing the caller to wire it — never returns `null`/`undefined`/empty silently.
- **Edge case:** No.

---

## Integration Tests

### `GET` the playback-review surface returns only the requesting tenant's own ACs

- **Verifies:** AC1
- **Components involved:** Route handler, journey-store (Postgres), session middleware
- **Precondition:** Two tenants seeded, each with their own DoD-complete feature.
- **Action:** Authenticated request as tenant A's Product Owner.
- **Expected result:** Response contains only tenant A's ACs; tenant B's content never appears.

### Capture-target write persists through the real data layer

- **Verifies:** AC2
- **Components involved:** Route handler, Postgres `journeys.data` JSONB write
- **Precondition:** An existing journey row with no target for the given AC.
- **Action:** `POST` a target `{url, selector}` for that AC.
- **Expected result:** Re-fetching the journey row shows the new `captureTargets` entry persisted.

### Capture-trigger seeds the Playwright context cookie from `req.sessionId`, never a service credential or test bypass

- **Verifies:** AC3; NFR-SEC (session handling), ADR-018
- **Components involved:** Route handler, session middleware, injected (mocked) Playwright adapter
- **Precondition:** An authenticated session with a known `sessionId`; the AC has a stored target.
- **Action:** Trigger capture for that AC.
- **Expected result:** The mocked Playwright adapter's `context.addCookies` call is invoked with exactly `{name: 'session_id', value: req.sessionId, ...}`.

### Capture-trigger navigates to the stored target and persists the resulting screenshot

- **Verifies:** AC3, AC5
- **Components involved:** Route handler, injected (mocked) `captureAcScreenshots`
- **Precondition:** A stored target `{url, selector}` for the AC.
- **Action:** Trigger capture for that AC.
- **Expected result:** The mocked `captureAcScreenshots` call receives exactly the stored `{url, selector}`; a screenshot record is persisted and retrievable by the AC5 render path.

### Two tenants sharing a colliding `feature_slug` each see only their own content

- **Verifies:** AC6
- **Components involved:** Route handler, Postgres (seeded collision fixture)
- **Precondition:** Tenant A and tenant B both have a journey row with `feature_slug = 'duplicate-slug'`.
- **Action:** Tenant A's Product Owner requests the surface for that slug.
- **Expected result:** The response contains only tenant A's own ACs, capture targets, and screenshots; a response-body string search confirms tenant B's own content never appears anywhere in it.

### A guessed URL to another tenant's feature returns 403/not-found with no metadata leak

- **Verifies:** AC7
- **Components involved:** Route handler, session/authorisation check
- **Precondition:** Tenant A authenticated; tenant B's real feature id known to the test.
- **Action:** Tenant A requests tenant B's feature directly by id.
- **Expected result:** Response status is 403 or 404; response body contains no feature name, AC text, or any other metadata about tenant B's feature.

### Session-to-Playwright adapter is wired to a real implementation and behaves correctly for distinct sessions

- **Verifies:** AC8 (D37/H-ADAPTER)
- **Components involved:** `server.js` wiring, the new adapter, two distinct fake session fixtures
- **Precondition:** The adapter has been wired via its setter in `server.js` (not left at the default throwing stub).
- **Action:** Call the wired adapter with two different fake `sessionId` values.
- **Expected result:** Two distinct, correctly-isolated authenticated page objects are produced — one per session — not the same object reused, and not a wiring check that only asserts a function reference was assigned.

---

## NFR Tests

### `session_id` value never appears in any API response body

- **NFR addressed:** Security
- **Measurement method:** String search across every response body produced by this story's routes for the literal `sessionId` value used in the test.
- **Pass threshold:** Zero occurrences.
- **Tool:** Integration test assertion.

### Capture mechanism never invokes the `NODE_ENV=test` auth-bypass path

- **NFR addressed:** Security (ADR-018)
- **Measurement method:** Call-count assertion on the mocked `seedTestSession`/`/test/session` path during a capture-trigger test run.
- **Pass threshold:** Zero calls.
- **Tool:** Integration test assertion (kept separate from the AC3 functional test per the NFR test scope rule — this asserts only the negative-constraint property, not the correct-cookie-value functional outcome).

### New surface's interactive elements are keyboard-navigable and meet WCAG 2.1 AA

- **NFR addressed:** Accessibility
- **Measurement method:** Manual verification — this repo has no automated accessibility tooling configured.
- **Pass threshold:** All interactive elements reachable and operable via keyboard alone; colour is never the sole status indicator.
- **Tool:** Manual — see verification script.

### Audit — None identified

- **NFR addressed:** Audit
- **Measurement method:** Not applicable — no audit requirement identified for this story.
- **Pass threshold:** N/A
- **Tool:** N/A — stated explicitly per the story's own NFR section, no test written.

### Performance — no fixed SLA for this story

- **NFR addressed:** Performance
- **Measurement method:** Not applicable at this story's scope — real per-feature timing is measured and validated in `ppc-s2`, not here.
- **Pass threshold:** N/A
- **Tool:** N/A — stated explicitly, no test written.

---

## Out of Scope for This Test Plan

- Looping capture across all ACs of a feature in one action — covered by `ppc-s2`'s own test plan.
- Rate limiting the capture-trigger endpoint — covered by `ppc-s3`'s own test plan.
- Automatic AC→screen target derivation — explicitly deferred (see `decisions.md` 2026-10-21 DESIGN entry); not part of this story, nothing to test here.
- Video capture, automated redaction, ffmpeg presentation polish — epic-level out of scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Accessibility (WCAG 2.1 AA) has no automated check | This repo has no `axe`/`pa11y` or equivalent tooling configured — a pre-existing, repo-wide limitation, not introduced by this story | Manual verification scenario in the AC verification script, marked for explicit sign-off before DoR |
