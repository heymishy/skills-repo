# Test Plan: wuce.5 — Personalised action queue

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.5-action-queue.md
**Epic:** wuce-e2
**Framework:** Jest + Node.js (backend unit + integration; DOM-state assertions for render functions)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | Action required section with feature name, artefact type, days-pending | Unit + integration | None |
| AC2 | Empty state — "No actions pending — you're up to date" | Unit + integration | None |
| AC3 | Signed-off artefact removed from queue after wuce.3 sign-off | Integration (wuce.3 dependency) | State-dependent on wuce.3; flow verified via unit mocks; end-to-end removal requires both stories running |
| AC4 | Artefact link goes to artefact view | Unit (DOM link href) | Browser navigation is runtime-only; link href tested |
| AC5 | Repo access failure → items omitted, banner shown | Unit + integration | None |

---

## Named shared fixtures

The following fixtures are **canonical for E2** — defined here, reused by wuce.6, wuce.7, and wuce.8. These are the E2 equivalents of the OAuth token exchange fixtures defined in wuce.1 for E1.

| Fixture path | Content | Purpose | Reused by |
|---|---|---|---|
| `tests/fixtures/markdown/artefact-pending-signoff.md` | Markdown artefact WITHOUT `## Approved by` section | Primary pending-detection fixture; `hasPendingSignOff` must return `true` | wuce.5, wuce.6, wuce.7, wuce.8 |
| `tests/fixtures/markdown/artefact-signed-off.md` | Same artefact structure WITH `## Approved by` block appended | Signed state fixture; `hasPendingSignOff` must return `false` | wuce.5, wuce.8 |
| `tests/fixtures/github/pipeline-state-feature.json` | Single feature object: `{ "slug": "2026-05-02-test-feature", "name": "Test Feature", "stage": "test-plan", "updatedAt": "2026-05-01T10:00:00Z", "stories": [{ "id": "tf.1", "prStatus": "none", "dorStatus": "signed-off", "traceStatus": "passed" }, { "id": "tf.2", "prStatus": "none", "dorStatus": "not-started", "traceStatus": "not-run" }] }` | Feature navigation and status tests | wuce.5, wuce.6, wuce.7 |

**`tests/fixtures/markdown/artefact-pending-signoff.md` canonical content:**
```markdown
## Story: Validate pipeline artefact

**Feature:** test-feature

## User Story

As a reviewer, I want to validate this artefact.

## Acceptance Criteria

**AC1:** The review is complete.

## Out of Scope

Post-MVP items.
```
*(No `## Approved by` section — `hasPendingSignOff` must return `true`)*

**`tests/fixtures/markdown/artefact-signed-off.md` canonical content:**
Same as above, plus at the end:
```markdown
## Approved by

**Jane Stakeholder** (Director of Product)
*2026-05-01T09:30:00Z*
```
*(Has `## Approved by` section — `hasPendingSignOff` must return `false`)*

**Additional fixtures (wuce.5 only):**

| Fixture path | Content |
|---|---|
| `tests/fixtures/github/contents-api-artefact-pending.json` | GitHub Contents API response wrapping `artefact-pending-signoff.md` as Base64 `content` field; `"sha": "abc123pendingsha"` |
| `tests/fixtures/github/repo-access-denied.json` | `{ "message": "Not Found", "documentation_url": "..." }` — 404 response from repo access validation endpoint |

---

## Unit tests

### T1 — `hasPendingSignOff(markdownContent: string): boolean` (AC1, AC2, AC3)

**T1.1 — pending: returns true when `## Approved by` is absent**
- Input: contents of `tests/fixtures/markdown/artefact-pending-signoff.md`
- Expected: `true`
- Rationale: core detection function; the absence of `## Approved by` defines pending state per story constraint

**T1.2 — signed: returns false when `## Approved by` is present**
- Input: contents of `tests/fixtures/markdown/artefact-signed-off.md`
- Expected: `false`

**T1.3 — edge: returns false for empty string**
- Input: `""`
- Expected: `false`
- Rationale: empty artefact is not a pending item

**T1.4 — case sensitivity: only matches exact `## Approved by` heading**
- Input: markdown with `## approved by` (lowercase) and no correctly-cased heading
- Expected: `true` (lowercase variant is not a valid sign-off — sign-offs are written by wuce.3 which produces the exact casing)
- Rationale: prevents false negatives from case variants

### T2 — `getPendingActions(userIdentity, token)` adapter (AC1, AC2, AC5)

**T2.1 — returns pending items with required fields**
- Setup: mock `fetchArtefact` to return contents of `artefact-pending-signoff.md`; mock repo list from config; mock `validateRepositoryAccess` to return `true`
- Expected: returned array contains at least one item with `featureName`, `artefactType`, `daysPending` fields set
- Verifies AC1 data shape

**T2.2 — returns empty array when no artefact is pending**
- Setup: mock `fetchArtefact` to return contents of `artefact-signed-off.md` for all artefacts
- Expected: `[]`
- Verifies AC2 data source

**T2.3 — includes only artefacts user has read access to**
- Setup: mock `validateRepositoryAccess` to return `true` for repo-A, `false` for repo-B; both repos have pending artefacts
- Expected: result contains items from repo-A only; `bannerMessage` is set on the result
- Verifies AC5 filtering and banner flag

**T2.4 — repo access throws (network error) → treated as access failure, not exception propagation**
- Setup: mock `validateRepositoryAccess` to throw for repo-B
- Expected: no thrown exception; repo-B items omitted; `bannerMessage` set
- Rationale: fail-open behaviour — action queue must always respond

### T3 — `renderActionQueue(items, bannerMessage?)` DOM-state (AC1, AC2, AC4, AC5)

**T3.1 — renders pending items with AC1 fields**
- Input: array with one item `{ featureName: "Test Feature", artefactType: "Discovery", daysPending: 3, artefactUrl: "/features/test/discovery" }`
- Expected HTML contains: "Test Feature", "Discovery", "3", `/features/test/discovery` in a link `href`
- Verifies AC1 display and AC4 link href

**T3.2 — renders empty state with AC2 message**
- Input: `[]` (empty array), no bannerMessage
- Expected HTML contains: "No actions pending — you're up to date"
- Verifies AC2 exact text

**T3.3 — renders banner when bannerMessage is set (AC5)**
- Input: `[]`, `bannerMessage: "Some repositories could not be checked — re-authenticate if you believe items are missing."`
- Expected HTML contains the exact banner text
- Verifies AC5 display

**T3.4 — list items have descriptive link text (not "click here") — accessibility NFR**
- Input: one pending item
- Expected: link text is descriptive (e.g. contains artefact type and feature name), not generic

---

## Integration tests

### IT1 — `GET /api/actions` returns pending items for authenticated user (AC1)

- Setup: authenticated session (using `oauth-token-exchange-success.json` token from wuce.1 fixtures); mock GitHub Contents API to return `contents-api-artefact-pending.json`
- Request: `GET /api/actions` with session cookie
- Expected: `200`, body `{ items: [...], bannerMessage: null }` with at least one item with `featureName`, `artefactType`, `daysPending`

### IT2 — `GET /api/actions` returns empty state with correct response shape (AC2)

- Setup: authenticated session; mock GitHub API returns only signed-off artefacts
- Request: `GET /api/actions`
- Expected: `200`, body `{ items: [], bannerMessage: null }`

### IT3 — `GET /api/actions` with one repo returning 404 → omits items, sets banner (AC5)

- Setup: authenticated session; repo-A returns valid artefacts; repo-B returns `repo-access-denied.json`
- Request: `GET /api/actions`
- Expected: `200`; `items` contains only repo-A items; `bannerMessage` equals `"Some repositories could not be checked — re-authenticate if you believe items are missing."`

### IT4 — `GET /api/actions` requires authentication

- Setup: no session cookie
- Request: `GET /api/actions`
- Expected: `401`

---

## NFR tests

### NFR1 — Audit log entry on action queue load

- Setup: authenticated session; spy on audit logger
- Action: `GET /api/actions`
- Expected: audit log call with `userId`, `itemCount` fields; no token value logged

### NFR2 — Repository access validated server-side before items included

- Setup: mock `validateRepositoryAccess` spy
- Action: `getPendingActions(userIdentity, token)`
- Expected: `validateRepositoryAccess` called once per configured repository; no artefact from an unvalidated repo appears in the result

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC3 — item removed after sign-off | Requires wuce.3 to be running; cross-story integration test | Unit tests verify that a signed artefact is excluded from the queue (T1.2, T2.2); end-to-end removal is a manual verification step in the verification script |
| AC4 — browser navigation to artefact view | Runtime browser behaviour | Link `href` tested in T3.1; actual page load tested in wuce.2 verification |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 12 |
| Integration tests | 4 |
| NFR tests | 2 |
| **Total** | **18** |

**acTotal: 5**
