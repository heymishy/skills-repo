## Test Plan: Add a dedicated self-test for the shared journey.js fixture module

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s2-fixture-module-self-test.md
**Epic reference:** artefacts/2026-10-29-test-suite-infra-refactor/epics/journey-js-shared-test-fixture.md
**Test plan author:** Copilot
**Date:** 2026-10-29

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js` (plain Node.js `assert` + this repo's `test(name, fn)` convention). Run individually via `node tests/check-journey-fixture-self-test.js`.

**Note on this story's own shape:** this story's deliverable (`tests/check-journey-fixture-self-test.js`) is itself a test file — so this plan specifies what that file must assert, plus one meta-level test that the self-test module structurally avoids the risks it exists to guard against (AC3).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Self-test asserts default shape matches real `req.session` reads | 1 | — | — | — | — | 🟢 |
| AC2 | Self-test actually fails when the shared module regresses (mutation-test proof) | — | — | — | Implementation-time manual verification | Untestable-by-nature | 🟡 |
| AC3 | Self-test completes in <1s, no network/fs/shared-state | 1 (structural, not timing-based) | — | — | — | — | 🟢 |
| AC4 | Self-test exercises the overrides-merge behaviour | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this suite | Handling |
|-----|----|----------|--------------------------|---------|
| Proving the self-test genuinely fails on a real regression | AC2 | Untestable-by-nature | A standing automated "test of the test" would require either require-cache manipulation to swap in a broken fixture module at runtime (fragile, adds complexity disproportionate to a one-time proof) or duplicating the self-test's assertion logic as a separately-callable function purely to re-invoke it against a bad object (over-engineering for a one-shot check). This repo's own established precedent (`.github/standards/testing/test-design-patterns.md`, res-s2/res-s4) treats this exact mutation-test discipline as a one-time manual verification performed during implementation/code-review, not a permanently-running CI test. | Manual verification step — see AC verification script Scenario 2 and gap note below. Record the before/after result in `decisions.md` or the story's own implementation notes once performed. |

---

## Test Data Strategy

**Source:** Synthetic — all test data is generated in test setup.
**PCI/sensitivity in scope:** No.
**Availability:** Available now (depends only on `tsir-s1`'s shared fixture module, already in this epic).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The real field list from `tsir-s1`'s test plan (`login`, `tenantId`, `accessToken`, `userId`, `role`) | Synthetic, hardcoded | None | Re-derive independently from `journey.js` source, not copy-pasted trust of `tsir-s1`'s own test — this test exists precisely to catch a regression `tsir-s1`'s own tests might miss |
| AC3 | Source text of `tests/helpers/journey-fixture.js` and the self-test file itself | Fixtures (real files) | None | |
| AC4 | An overrides object | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Self-test asserts default mockReq.session fields independently re-derived from journey.js source

- **Verifies:** AC1
- **Precondition:** `tests/helpers/journey-fixture.js` exists (from `tsir-s1`).
- **Action:** Re-run `grep -n "req\.session\." src/web-ui/routes/journey.js` independently (not trusting `tsir-s1`'s own field list) to confirm the field set, then assert `journeyFixture().session` has own properties for each of `login`, `tenantId`, `accessToken`, `userId`, `role`.
- **Expected result:** All five fields present and defined.
- **Edge case:** No.

### Self-test's override-handling test asserts correct merge semantics

- **Verifies:** AC4
- **Precondition:** None.
- **Action:** `journeyFixture({ session: { tenantId: 'override-value' } })`
- **Expected result:** `req.session.tenantId === 'override-value'` and every other default field (`login`, `accessToken`, `role`) still present and unchanged from the no-override case.
- **Edge case:** No.

### Self-test file itself makes no network, filesystem-write, or shared-module-state calls

- **Verifies:** AC3 (structural check, not a wall-clock timing assertion — this repo's own `pcr-s1` precedent found literal timing-based NFR tests are flaky under concurrent machine load; asserting the structural absence of the slow/flaky operations is the reliable equivalent)
- **Precondition:** None.
- **Action:** Read `tests/check-journey-fixture-self-test.js`'s own source text; assert it contains no `require('http')`, `require('https')`, `fs.writeFile`/`fs.writeFileSync`, or assignment to any `global.*`/module-level `let`/`var` outside its own function scopes.
- **Expected result:** None of the above patterns present.
- **Edge case:** No.

---

## Integration Tests

None — this story's self-test operates entirely against the shared fixture module in-process; there is no cross-component seam beyond that single dependency, already covered by the Unit tests above.

---

## NFR Tests

### Self-test completes in under 1 second

- **NFR addressed:** Performance (story AC3)
- **Measurement method:** Timed as part of the full `node scripts/run-all-tests.js` run, observationally — not asserted as a hard in-test threshold (per the `pcr-s1` flakiness precedent above, a literal `Date.now()` assertion inside the test itself is the wrong mechanism). The structural test above (no network/fs/global-state) is the reliable proxy; actual wall-clock time is confirmed once at implementation time via the full suite's own per-file timing output, not re-asserted on every run.
- **Pass threshold:** < 1 second, observed once at implementation.
- **Tool:** `node scripts/run-all-tests.js`'s own per-file timing output.

---

## Out of Scope for This Test Plan

- Testing every one of the 42 existing `journey.js`-touching consumer files individually — this story covers only the shared module itself.
- Automating AC2's mutation-test proof as a standing CI test — see Coverage gaps above; this is a one-time implementation-verification step by design.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2's mutation-test proof isn't a standing automated test | Would require fragile require-cache manipulation or over-engineered test-of-the-test scaffolding for a one-shot verification | Manual verification during implementation (see AC verification script Scenario 2), matching this repo's own established `res-s2`/`res-s4` precedent for the same discipline |
