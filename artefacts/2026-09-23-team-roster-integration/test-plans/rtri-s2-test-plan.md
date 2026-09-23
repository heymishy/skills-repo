## Test Plan: Wire pod-manager.html's member picker to the real roster

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Test plan author:** Copilot
**Date:** 2026-09-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "Available" roster shows real members, no pod-role chip until assigned | 2 tests | — | — | — | — | 🟢 |
| AC2 | Real identity + selected pod role land in `pod_members` on save | — | 1 test | — | — | — | 🟢 |
| AC3 | Zero-member tenant renders an empty roster, not an error/fake names | 1 test | — | — | — | — | 🟢 |
| AC4 | Real members flow through unchanged to `feature_collaborators` via `ep4-s1` | — | 1 test | — | — | — | 🟢 |
| AC5 | Search-by-name regression guard; role-tab filter doesn't throw/mislabel | 2 tests | — | — | — | — | 🟢 |
| AC6 | Real identity strings rendered via safe DOM construction (MC-SEC-01) | 1 test | — | — | — | — | 🟢 |
| AC7 | Pod-role selector presented at add-time; selected value (not roster response) written to `role_id` | 2 tests | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 7 ACs are unit/integration testable — the picker's DOM logic runs in plain browser-API JS with no CSS-layout-dependent behaviour (no drag-drop, no coordinate/position assertions), so jsdom-style DOM tests are sufficient; nothing here requires a real rendered browser.

---

## Test Data Strategy

**Source:** Mixed — (a) client-side DOM/logic tests run against the real `pod-manager.html` inline script, loaded into a jsdom-style DOM test harness with a mocked `fetch` (matches this repo's convention for client-script testing without a real browser — no existing precedent file found for `pod-manager.html` itself, so this test file establishes it, modelled on jsdom usage patterns already present in this repo's `package.json` devDependencies); (b) server-side/data-layer tests (AC2, AC4) use the same narrow in-memory fake `pool` convention as `rtri-s1`'s test plan, extended with `pods`/`pod_members` fixtures matching `pod-store.js`'s real schema.
**PCI/sensitivity in scope:** No — synthetic identities only.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `fetch('/api/team/members')` response: `{ members: [{identity: 'alice@example.com', role: 'engineer'}, {identity: 'bob-gh', role: 'admin'}] }` | Synthetic | None | Asserts rendered rows show `alice@example.com`/`bob-gh` with no role chip/tab-group present |
| AC2 | Fake pool with an existing tenant; DOM driven to select 2 real members + pod roles, then `saveBtn` triggers `fetch('/api/pods/create', ...)` | Synthetic | None | Asserts `pod_members` rows in the fake pool contain the real identities + the selected (not fetched) role_id values |
| AC3 | Mocked `fetch` returning `{ members: [] }` | Synthetic | None | Asserts "Available" panel renders empty, no thrown error, no `ORG_ROSTER` fallback |
| AC4 | Fake pool seeded with a pod created via AC2's real identities, then a feature/pod assignment via `ep4-s1`'s existing `populateFeatureCollaboratorsFromPod` path | Synthetic | None | Asserts `feature_collaborators` rows match the real identities with zero new code touched in `ep4-s1`'s module |
| AC5 | Mocked roster fixture with 3+ members sharing overlapping name substrings; DOM driven via `rosterSearchInput` and `.role-tab` clicks | Synthetic | None | Asserts search still filters correctly; role-tab interaction never throws even with no pod-role-bearing "Available" entries |
| AC6 | Mocked roster fixture including one identity `'<img src=x onerror=alert(1)>'` | Synthetic (deliberately malicious-shaped, not real) | None | Asserts the rendered DOM has no injected `<img>` element — `textContent`/`createElement` path used, confirmed by DOM inspection, not string matching |
| AC7 | Mocked roster fixture (2 real members); DOM driven through the full "click Add → select pod role → confirm" flow | Synthetic | None | Asserts `selection` array's `roleId` for each added member equals the value chosen in the selector, and NOT any value present in the mocked roster response (proves the selector, not the response, is authoritative) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### "Available" panel renders real identities from a fetched roster, no pod-role chip

- **Verifies:** AC1
- **Precondition:** `fetch` mocked to resolve `{ members: [{identity: 'alice@example.com', role: 'engineer'}, {identity: 'bob-gh', role: 'admin'}] }` for `GET /api/team/members`; modal opened
- **Action:** Call `openModal()` (or its real-roster-aware successor) and wait for the fetch to resolve
- **Expected result:** `#available-roster` contains 2 rows with text content `alice@example.com` and `bob-gh` (not `Hamish`/`Susan`/`Darren`); neither row contains a `.role-chip` element (no pod role exists yet for either)
- **Edge case:** No

### "Available" panel role-tabs do not throw when real entries carry no pod role

- **Verifies:** AC5, AC1
- **Precondition:** Same fixture as above; modal open
- **Action:** Click each `.role-tab` in turn (`All`, `conductor`, `engineer`, `architect`, `product`)
- **Expected result:** No exception thrown for any tab; `#available-roster`'s rendered content does not silently show a wrong/stale role for either real member (either the tabs render disabled/hidden for "Available", or clicking one simply yields the same content — whichever `/implementation-plan` decides per AC5 — but never a crash or a fabricated role)
- **Edge case:** Yes — this is the direct regression guard AC5 calls for

### Zero-member tenant renders an empty "Available" panel, not an error or fake names

- **Verifies:** AC3
- **Precondition:** `fetch` mocked to resolve `{ members: [] }`
- **Action:** Call `openModal()`, wait for fetch to resolve
- **Expected result:** `#available-roster` has zero `.roster-row` children; no error banner shown; `ORG_ROSTER`'s fake names never appear anywhere in the DOM
- **Edge case:** Yes — the story's own named empty-tenant edge case

### Real identity string with HTML-significant characters is never interpreted as markup

- **Verifies:** AC6
- **Precondition:** `fetch` mocked to resolve `{ members: [{identity: '<img src=x onerror=alert(1)>', role: 'engineer'}] }`
- **Action:** Call `openModal()`, wait for fetch to resolve
- **Expected result:** `document.querySelectorAll('#available-roster img').length === 0` — no `<img>` element was created from the payload string; the row's rendered text content contains the literal payload string as text (via `textContent`/`createElement`, matching `buildNameRoleSpan`'s existing safe-construction pattern, confirmed by reading `pod-manager.html` lines 103-119 directly)
- **Edge case:** Yes — the security-critical edge case from Run 1/2's [1-H1] finding

### Pod-role selector is presented on "Add"; the confirmed value — not the roster response's role — is stored on the selection

- **Verifies:** AC7
- **Precondition:** `fetch` mocked to resolve `{ members: [{identity: 'alice@example.com', role: 'admin'}] }` (note: `role: 'admin'` is a team-permission role, not a valid pod role — deliberately chosen so a bug that copies it straight through is caught)
- **Action:** Click "Add" for `alice@example.com`; in the presented pod-role selector, choose `engineer`; confirm
- **Expected result:** `selection` array contains one entry `{ userId/identity: 'alice@example.com', roleId: 'engineer' }` — `roleId` is `'engineer'` (the selected value), never `'admin'` (the roster response's team role, which is not even a member of `VALID_ROLES`)
- **Edge case:** Yes — directly proves the two role vocabularies are never conflated

### Cancelling the pod-role selector does not add the member

- **Verifies:** AC7 (implicit — a selector that can be confirmed must also be cancellable without side effects)
- **Precondition:** Same fixture as above
- **Action:** Click "Add" for `alice@example.com`; cancel/dismiss the pod-role selector without choosing a role
- **Expected result:** `selection` array is unchanged (still just the creator); `#your-team` shows no new row
- **Edge case:** Yes

---

## Integration Tests

### Saving with real members writes real identities and selected pod roles to `pod_members`

- **Verifies:** AC2
- **Components involved:** `pod-manager.html`'s save flow, `POST /api/pods/create` (`routes/pods.js`), `pod-store.js`'s `createPod`, the fake pool
- **Precondition:** Fake pool empty of pods; DOM driven through AC7's flow for 2 real members with 2 distinct selected pod roles
- **Action:** Trigger `saveBtn.onclick`, wait for the `fetch('/api/pods/create', ...)` promise chain to resolve
- **Expected result:** Fake pool's `pod_members` table has exactly 2 new rows (plus the creator's own row); `user_id` for each equals the real identity string; `role_id` for each equals the pod role selected in the UI — queried directly from the fake pool, not inferred from the UI's own success banner text
- **Edge case:** No

### A pod created with real members flows unchanged into `feature_collaborators` via `ep4-s1`

- **Verifies:** AC4
- **Components involved:** `pod-store.js` (pod created per AC2), `pod-assignment-store.js`/`feature-collaborator-store.js` (`ep4-s1`, unmodified), the fake pool
- **Precondition:** A pod exists in the fake pool with 2 real-identity `pod_members` rows (from AC2's fixture); a feature exists with no prior pod assignment
- **Action:** Call `ep4-s1`'s existing pod-assignment write path directly (the same function the "Assign pods" UI calls — no new code path introduced by this story) to assign the real-member pod to the feature
- **Expected result:** `feature_collaborators` rows for that feature contain the same 2 real identity strings — proving `ep4-s1`'s own collaborator-sourcing logic required zero changes, confirming this story's own Architecture Constraints claim rather than assuming it
- **Edge case:** No — this is the story's own explicitly named cross-story verification requirement

### Search-by-name continues to filter real identities correctly

- **Verifies:** AC5
- **Components involved:** `pod-manager.html`'s `rosterSearchInput`/`renderRoster`, the mocked-fetch roster
- **Precondition:** Roster fixture with 3 real identities, at least 2 sharing a substring (e.g. `alice@example.com`, `alison@example.com`, `bob-gh`)
- **Action:** Type `ali` into `#roster-search`
- **Expected result:** `#available-roster` shows exactly `alice@example.com` and `alison@example.com`, not `bob-gh` — search continues to work against real identity strings exactly as it did against `ORG_ROSTER`'s `name` field

---

## NFR Tests

### Roster fetch completes within the modal's existing performance budget

- **NFR addressed:** Performance
- **Measurement method:** Manual timing during live validation (matches `rtri-s1`'s own established RISK-ACCEPT pattern per `nfr-profile.md`) — no dedicated automated timing assertion.
- **Pass threshold:** N/A — not automated; live-validated at DoD.
- **Tool:** Manual (live Chrome timing at DoD).

### No new data exposure beyond the already-tenant-scoped roster

- **NFR addressed:** Security
- **Measurement method:** Covered by `rtri-s1`'s own AC3 tenant-isolation test — this story consumes that endpoint unmodified and adds no new data-exposure surface of its own.
- **Pass threshold:** N/A — no dedicated test in this story's own plan; relies on `rtri-s1`'s coverage by design (Architecture Constraints: no new auth/scoping logic introduced here).
- **Tool:** N/A

### Real identity strings never interpreted as markup

- **NFR addressed:** Security (MC-SEC-01)
- **Measurement method:** Covered directly by the AC6 unit test above (payload-string DOM assertion).
- **Pass threshold:** Zero injected elements from any payload identity string.
- **Tool:** `node scripts/run-all-tests.js`

### AC7's pod-role selector is a native, labelled control

- **NFR addressed:** Accessibility
- **Measurement method:** Manual check at DoD — confirm the selector is a real `<select>` with an associated `<label>`, keyboard-operable (matches this app's own established native-controls convention; no automated axe-scan configured in this repo per `nfr-profile.md`'s own precedent).
- **Pass threshold:** N/A — not automated.
- **Tool:** Manual (live Chrome + keyboard-only pass at DoD).

---

## Out of Scope for This Test Plan

- `/team/members`'s own listing — covered by `rtri-s3`'s test plan.
- Any test of `rtri-s1`'s read function itself — already covered by `rtri-s1`'s own test plan; this story's tests treat `/api/team/members` as an already-verified black box (mocked at the `fetch` boundary for client-side tests).
- Editing a pod role after add-time — explicitly Out of Scope in the story (no such capability exists).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC5's exact role-tab-filter treatment for "Available" (hidden/disabled/repurposed) is not pinned down at test-plan time | The story itself (per Run 3 review, LOW finding [3-L1]) deliberately defers this cosmetic decision to `/implementation-plan` | The AC5 unit test above asserts only the hard constraint (no throw, no wrong/stale role) — once `/implementation-plan` records the chosen treatment, add one more specific assertion for it before `/verify-completion` |
