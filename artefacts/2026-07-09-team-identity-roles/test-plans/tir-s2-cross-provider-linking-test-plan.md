## Test Plan: A logged-in user links a second auth provider to their identity

**Story reference:** artefacts/2026-07-09-team-identity-roles/stories/tir-s2.md
**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Linking two identities while authenticated into both records them as one person | — | 1 test | — | — | — | 🟢 |
| AC2 | Unauthenticated access to the link settings page redirects to login | — | 1 test | — | — | — | 🟢 |
| AC3 | Two separately-signed-up people with the same email stay separate — no auto-merge | — | 1 test | — | — | — | 🟢 |
| AC4 | Linking an already-linked identity is rejected, no data changes | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. Per ADR-018 (added to Architecture Constraints during /review Run 2), the "successfully authenticating" step in AC1/AC4 is exercised via the existing `NODE_ENV=test` auth-bypass fixture pattern — the same convention every other provider-login test in this codebase already uses — not a live OAuth round-trip.

---

## Test Data Strategy

**Source:** Mocked (existing provider adapters — `gitHubProviderAdapter`, `setGoogleUserInfoAdapter` — mocked to return known synthetic identities; `people` table state managed via the `fake-test-db.js` extension from tir-s1)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Two synthetic provider identities (a GitHub login, a Google `sub`) belonging to the same test session | Mocked | None | Provider adapters mocked, not real OAuth |
| AC2 | An unauthenticated request (no session) | Synthetic | None | |
| AC3 | Two synthetic identities from different providers sharing the same email string | Synthetic | None | Confirms no email-based auto-merge |
| AC4 | Two synthetic people, one already linked to a third identity | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's behaviour is inherently a multi-component handoff (session + provider adapter + `people` table), better exercised as integration tests than isolated unit tests.

---

## Integration Tests

### Linking Google to an already-logged-in GitHub session records both identities as one person

- **Verifies:** AC1
- **Components involved:** Link-settings route handler, mocked `gitHubProviderAdapter`/`setGoogleUserInfoAdapter`, `people` table (via `fake-test-db.js`), `NODE_ENV=test` auth-bypass fixture.
- **Precondition:** A session already authenticated as GitHub identity X (via the test-mode auth-bypass fixture); mocked Google adapter configured to return identity Y when the link flow completes.
- **Action:** Call the link-account action while authenticated as X, completing the mocked Google auth step for Y.
- **Expected result:** A single `people` row now maps both X and Y; a subsequent simulated login via either provider resolves to that same person.

### Unauthenticated request to the link-settings page redirects to login

- **Verifies:** AC2
- **Components involved:** Link-settings route handler.
- **Precondition:** No session cookie present.
- **Action:** Request the link-settings page/endpoint.
- **Expected result:** Redirect (or equivalent auth-required response) to the login flow — the link action is never reached.

### Two people who signed up separately with the same email remain separate, unlinked

- **Verifies:** AC3
- **Components involved:** Login handlers for two different providers, `people` table.
- **Precondition:** Person A signs up via email/password with `same@example.com`; Person B signs up via Google with a Google account whose email happens to also be `same@example.com`; no link action is ever taken.
- **Action:** Both log in via their own provider.
- **Expected result:** Two distinct `people` rows exist — logging in as A never resolves to B's person record, and vice versa.

### Linking an already-linked identity is rejected without changing any data

- **Verifies:** AC4
- **Components involved:** Link-settings route handler, `people` table pre-seeded with identity Y already linked to Person B.
- **Precondition:** A session authenticated as Person A (a different person than B) attempts to link identity Y, which is already linked to B.
- **Action:** Call the link-account action for Y while authenticated as A.
- **Expected result:** The action is rejected with a clear error; Person A's and Person B's `people` rows are unchanged — Y remains linked only to B.

---

## NFR Tests

### Linking requires proof of ownership of both identities before merging

- **NFR addressed:** Security
- **Measurement method:** Directly covered by AC1 (requires a completed second-provider auth step, not just a claimed identity) and AC4 (rejects linking an identity not provably owned by the requester) — no separate test needed beyond those two.
- **Pass threshold:** Zero linking paths that succeed without both identities' ownership being proven via a completed auth step.
- **Tool:** Hand-rolled Node.js assertion in `tests/check-tir-s2-cross-provider-linking.js`.

### Audit

- **NFR addressed:** Audit (link actions logged with both person IDs/identity hashes and a timestamp, never raw tokens)
- **Measurement method:** Assert the logger is called on a successful link with the two person identifiers and a timestamp field, and assert no raw token value ever appears in the logged payload.
- **Pass threshold:** Log entry present with required fields; zero occurrences of any token-shaped value in the log call arguments.
- **Tool:** Hand-rolled Node.js assertion (spy on the injected logger).

### Accessibility

- **NFR addressed:** Accessibility (link-account control meets WCAG 2.1 AA)
- **Measurement method:** No automated scan added by this test plan — this repo has no existing automated accessibility-scan tooling wired into unit/integration tests. Verified manually (see verification script).
- **Pass threshold:** N/A — manual.
- **Tool:** Manual.

---

## Out of Scope for This Test Plan

- Automatic email-based merging — explicitly excluded by the story; not tested because it must never happen (covered negatively by AC3).
- Unlinking a previously-linked provider — not built in this story, nothing to test.
- Real OAuth network calls to GitHub/Google — per ADR-018, always exercised via the auth-bypass fixture, never a live call.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real end-to-end OAuth completion for both providers in the same browser session | No live OAuth round-trip is used in CI (ADR-018) | Manual verification scenario against a real (non-production) GitHub/Google app once available, before this ships to real users |
