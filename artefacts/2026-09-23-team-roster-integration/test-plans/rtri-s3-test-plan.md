## Test Plan: Render a real member list on /team/members

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Test plan author:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Rendered HTML contains a row per real member, showing identity + role | 1 test | — | — | — | — | 🟢 |
| AC2 | Zero-member tenant shows an explicit empty state | 1 test | — | — | — | — | 🟢 |
| AC3 | Newly-added member appears on reload — live data, not stale snapshot | — | 1 test | — | — | — | 🟢 |
| AC4 | Tenant isolation — only the viewing tenant's members shown | 1 test | — | — | — | — | 🟢 |
| AC5 | Real identity strings passed through `escHtml()` before concatenation (MC-SEC-01) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. This story is entirely server-side (no client script), so every AC is testable by calling `handleGetTeamMembers` directly against a fake pool and asserting on the returned HTML string — no browser rendering required.

---

## Test Data Strategy

**Source:** Mocked — the same narrow in-memory fake `pool` convention as `rtri-s1`'s test plan (extends `people`/`team_memberships`/`person_identities` fixtures), reused directly since this story's data shape is identical to what `rtri-s1`'s `listTeamMembers` already returns.
**PCI/sensitivity in scope:** No — synthetic identities only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake pool with 2 resolvable `team_memberships`/`person_identities` pairs for `tenant-a` | Synthetic | None | Asserts response HTML contains both real identities and roles |
| AC2 | Fake pool with zero `team_memberships` rows for `tenant-a` | Synthetic | None | Asserts response HTML contains an explicit "No team members yet" (or equivalent) string, not a blank list |
| AC3 | Fake pool starting empty; a member added via the existing `addOrUpdateTeammate` write path mid-test, then `handleGetTeamMembers` called again | Synthetic | None | Two sequential calls in one test — proves no caching between them |
| AC4 | Fake pool with members split across `tenant-a` and `tenant-b` | Synthetic | None | Asserts calling for `tenant-a` never includes `tenant-b`'s identity string anywhere in the response |
| AC5 | Fake pool with one `person_identities.identity_key` set to `'<img src=x onerror=alert(1)>'` | Synthetic (deliberately malicious-shaped, not real) | None | Asserts the raw `<img` substring never appears unescaped in the response HTML |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### `handleGetTeamMembers` renders a row for each real member with identity and role

- **Verifies:** AC1
- **Precondition:** Fake pool has 2 resolvable members for `tenant-a`: (`alice@example.com`, `engineer`), (`bob-gh`, `admin`)
- **Action:** Call `handleGetTeamMembers(mockReq({session: {tenantId: 'tenant-a'}}), mockRes())` with the fake pool
- **Expected result:** `res.body` (the rendered HTML) contains both `alice@example.com` and `bob-gh`, each adjacent to their real role (`engineer`, `admin`) — asserted via a parsed-row check (e.g. matching a `<li>`/`<tr>` per member), not a loose substring match alone
- **Edge case:** No

### `handleGetTeamMembers` shows an explicit empty state for a tenant with no members

- **Verifies:** AC2
- **Precondition:** Fake pool has zero `team_memberships` rows for `tenant-a`
- **Action:** Call `handleGetTeamMembers` as above
- **Expected result:** `res.body` contains an explicit empty-state string (e.g. "No team members yet") — response is not blank, not an error page, and still renders the existing add-teammate form (Architecture Constraints: form unaffected)
- **Edge case:** Yes — the story's own named empty-state edge case

### Real identity string with HTML-significant characters is never interpreted as markup

- **Verifies:** AC5
- **Precondition:** Fake pool has 1 resolvable member for `tenant-a` with `identity_key: '<img src=x onerror=alert(1)>'`
- **Action:** Call `handleGetTeamMembers` as above
- **Expected result:** `res.body` does NOT contain the raw substring `<img src=x onerror=alert(1)>` — it contains the `escHtml()`-encoded form (`&lt;img src=x onerror=alert(1)&gt;`), confirmed by checking the response never parses (via a lightweight HTML parse, e.g. `jsdom`) into an actual `<img>` element when the response body is loaded into a DOM
- **Edge case:** Yes — the security-critical edge case from Run 1's [1-H1] finding, now Run 2-closed at the AC level; this test proves it at the implementation level

### `handleGetTeamMembers` never includes another tenant's members

- **Verifies:** AC4
- **Precondition:** Fake pool has a resolvable member for `tenant-a` (`alice@example.com`) and a separate one for `tenant-b` (`carol@example.com`)
- **Action:** Call `handleGetTeamMembers` with `session: {tenantId: 'tenant-a'}`
- **Expected result:** `res.body` contains `alice@example.com` but never contains `carol@example.com` anywhere in the response
- **Edge case:** Yes — cross-tenant leakage is the story's own named security-critical edge case

---

## Integration Tests

### A newly-added teammate appears in the list on the very next render — no stale snapshot

- **Verifies:** AC3
- **Components involved:** `team-management.js`'s real `addOrUpdateTeammate` (existing, unmodified write path), `handleGetTeamMembers` (this story's new read wiring), the fake pool
- **Precondition:** Fake pool starts with zero `team_memberships` rows for `tenant-a`; a resolvable person already exists in `people`/`person_identities` (matches `addOrUpdateTeammate`'s own precondition — the identity must have logged in at least once)
- **Action:** (1) Call `handleGetTeamMembers` — expect the empty state (AC2). (2) Call the real `addOrUpdateTeammate(pool, 'tenant-a', 'alice@example.com', 'engineer', ...)`. (3) Call `handleGetTeamMembers` again against the SAME fake pool instance (no re-seeding, no cache-clearing step)
- **Expected result:** The second call's response contains `alice@example.com`/`engineer`; the first call's response did not — proving the read path queries live data on every call rather than caching a snapshot from server startup or first render
- **Edge case:** No — this is the story's own explicitly required live-data proof (AC3)

---

## NFR Tests

### Page render time is not meaningfully affected by the new query

- **NFR addressed:** Performance
- **Measurement method:** Manual timing during live validation, matching `rtri-s1`'s and `rtri-s2`'s own established RISK-ACCEPT pattern per `nfr-profile.md` — a single additional indexed JOIN query is not expected to be observable against this page's existing render time.
- **Pass threshold:** N/A — not automated; live-validated at DoD.
- **Tool:** Manual (live Chrome timing at DoD).

### Real identity strings are always escaped before concatenation

- **NFR addressed:** Security (MC-SEC-01)
- **Measurement method:** Covered directly by the AC5 unit test above.
- **Pass threshold:** Zero unescaped payload substrings in the rendered response for any test fixture.
- **Tool:** `node scripts/run-all-tests.js`

### The member list uses real, semantic markup

- **NFR addressed:** Accessibility
- **Measurement method:** Manual check at DoD (no automated axe-scan configured in this repo, per `nfr-profile.md`'s own precedent) — confirm the list is a real `<ul>`/`<table>`, not `<div>`-as-row.
- **Pass threshold:** N/A — not automated.
- **Tool:** Manual (live Chrome + screen-reader spot-check at DoD, matching this page's existing bar).

---

## Out of Scope for This Test Plan

- Any test of `rtri-s1`'s read function itself, called directly (not mocked) — this story reuses it server-side, so these tests exercise the real function via the fake pool rather than mocking it at a boundary, but do not re-test `listTeamMembers`'s own AC1-AC3 coverage (already fully covered by `rtri-s1`'s own test plan).
- The add-teammate form's own write-path tests — already covered by `tir-s3`'s existing test suite; unmodified by this story.
- Removing a team member — no such capability exists; explicitly Out of Scope in the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
