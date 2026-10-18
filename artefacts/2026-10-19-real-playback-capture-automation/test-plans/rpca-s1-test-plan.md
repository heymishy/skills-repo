## Test Plan: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Review reference:** artefacts/2026-10-19-real-playback-capture-automation/review/rpca-s1-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s own `test` script)

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Option 6 — Mixed. AC3/AC4 (missing-secret error, no-secret-in-output) use fully synthetic fixtures. AC1/AC2 (real authentication, real screenshot) require a real `E2E_STAGING_AUTH_STUB_SECRET` value and real network access to `wuce-staging` — exactly the real-world claim review finding 1-M1 flagged. See Coverage gaps.

---

## Note on Step 3a (E2E / browser-layout detection)

No AC triggers a CSS-layout-dependent pattern (no drag-drop, no coordinate/`getBoundingClientRect` dependency, no stacking-context claim). AC1/AC2's gap is **external-dependency** (a real secret + a real deployed staging instance), the same category `fpd-s1` AC3 and `fpd-s5` AC4 already used — handled via RISK-ACCEPT + manual/operator-run verification, not routed through the E2E tooling question.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real authentication against `wuce-staging` | — | — | — | 1 scenario | External-dependency (needs real secret + real deployed instance) | 🔴 |
| AC2 | Real screenshot captured and saved | 1 test | — | — | 1 scenario | External-dependency (navigation/capture part only — the save-path construction is unit-tested) | 🔴 |
| AC3 | Missing env var fails with a clear error | 1 test | — | — | — | — | 🟢 |
| AC4 | Secret value never appears in output | 1 test | — | — | — | — | 🟢 |

Additionally: `authenticateStagingSession`'s own HTTP request-construction and response-parsing logic (the code AC1/AC2 depend on) is covered by 1 integration test against a local mock HTTP server standing in for `wuce-staging` — this proves the logic is correct without needing the real secret or real network, narrowing what AC1/AC2's own manual scenario actually has to prove.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's own test runner | Handling |
|-----|----|----------|---------------------------------------------------|---------|
| Real authentication against the real deployed `wuce-staging` | AC1 | External-dependency | Requires a real `E2E_STAGING_AUTH_STUB_SECRET` value, which this sandbox does not hold (deliberately not pulled ad hoc, per the operator's own earlier decision to scope this properly first) | Request-construction/response-parsing logic covered by a mock-server integration test; AC1's own real-world claim is a manual scenario, 🔴, run by the operator (who can retrieve the secret) or in CI with the secret as a configured env var |
| Real screenshot produced and saved from a real page | AC2 | External-dependency | Same root cause as AC1 — no real session without the real secret. (Narrower than AC1's own gap: the save-path construction itself is unit-tested; only the real navigation/capture step is gapped.) | Manual scenario, 🔴, same execution path as AC1 |

---

## Test Data Strategy

**Source:** Mixed — Synthetic for AC3/AC4 and the mock-server integration test; real staging + real secret for AC1/AC2
**PCI/sensitivity in scope:** No
**Availability:** AC3/AC4 available now. AC1/AC2 need the operator to either run the manual scenario directly, or configure `E2E_STAGING_AUTH_STUB_SECRET` as an environment variable in whatever context (CI or operator session) actually executes it
**Owner:** Self-contained for AC3/AC4; operator-provided secret for AC1/AC2

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Real `E2E_STAGING_AUTH_STUB_SECRET` value | Operator-provided, env var only | None (not a user credential — a staging-only service secret) | Never logged, never hardcoded (AC4 itself asserts this) |
| AC2 | Same as AC1, plus a real AC URL on `wuce-staging` to navigate to | Operator-provided / real staging state | None | |
| AC3 | Empty `process.env.E2E_STAGING_AUTH_STUB_SECRET` | Synthetic (test unsets the var) | None | |
| AC4 | A fixture env with the secret set, scanning all console output for the literal value | Synthetic | None (the fixture secret value itself is a test-only dummy string, never a real one) | |

### PCI / sensitivity constraints

None.

### Gaps

AC1/AC2 — see Coverage gaps above. Acknowledged, not silently skipped.

---

## Unit Tests

### AC2 (unit): the save path for a captured screenshot matches the existing convention exactly

- **Verifies:** AC2
- **Precondition:** None — pure function test
- **Action:** Call the path-construction function (reusing `captureAcScreenshots`'s own existing convention) with a fixture `featureSlug`, `storySlug`, and `acId`
- **Expected result:** Returns `artefacts/[featureSlug]/playback/[storySlug]/screenshots/[acId].png` — exactly the same shape `fpd-s1`'s and `fpd-s5`'s own existing tests already assert for this convention, confirming this new call site didn't diverge from it
- **Edge case:** No

### AC3 (unit): CLI fails immediately with a clear error when the secret env var is missing

- **Verifies:** AC3
- **Precondition:** `process.env.E2E_STAGING_AUTH_STUB_SECRET` unset
- **Action:** Invoke the CLI's own entrypoint function (not the full process spawn — call the exported function directly) with no secret in env
- **Expected result:** Throws/returns an error whose message names `E2E_STAGING_AUTH_STUB_SECRET` specifically — not a generic "auth failed" message
- **Edge case:** No

### AC4 (unit): secret value never appears in any console output

- **Verifies:** AC4
- **Precondition:** A fixture secret value set in `process.env.E2E_STAGING_AUTH_STUB_SECRET`; `console.log`/`console.error` spied
- **Action:** Run the CLI's own entrypoint through both a success path and a failure path (e.g. missing feature slug argument)
- **Expected result:** None of the captured console output strings contain the fixture secret value, in either path
- **Edge case:** Yes — specifically checks the failure path too, not just the happy path, since error messages are a common place secrets leak

---

## Integration Tests

### AC1/AC2 (integration): `authenticateStagingSession` constructs the right request and parses the right response against a local mock server

- **Verifies:** AC1, AC2 (the logic underpinning both, narrowing their own manual-scenario scope)
- **Components involved:** `authenticateStagingSession`, a local `http.createServer` test double standing in for `wuce-staging`'s own `GET /test/session`
- **Precondition:** A local mock server that asserts the incoming request carries the `x-e2e-test-endpoint-bypass` header with the expected secret value, and responds with a real `Set-Cookie: session_id=...` header
- **Action:** Call `authenticateStagingSession(mockServerUrl, fixtureSecret)`
- **Expected result:** Returns the parsed `session_id` value from the mock server's own `Set-Cookie` response — proves the request-construction and response-parsing logic is correct without needing the real secret or real network

---

## NFR Tests

### Security: secret never appears in logs

- **NFR addressed:** Security (secrets management)
- **Measurement method:** Same mechanism as AC4's own unit test — this NFR and AC4 are the same observable claim, not duplicated as a second test
- **Pass threshold:** Zero occurrences of the secret value in any captured console output
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- Real network/staging behaviour beyond what AC1/AC2's own manual scenario covers — no load testing, no retry-logic testing beyond what the story's own ACs require
- Generalising to every AC in a story — `rpca-s2`'s own scope, not tested here

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real authentication + real screenshot capture (AC1, AC2) | Requires a real staging secret this sandbox does not hold | Mock-server integration test proves the underlying logic; manual scenario (🔴) executed by the operator or a CI run with the secret configured, recorded as live evidence at `/verify-completion` |
