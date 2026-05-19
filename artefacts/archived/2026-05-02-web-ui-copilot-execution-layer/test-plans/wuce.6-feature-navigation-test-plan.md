# Test Plan: wuce.6 — Multi-feature navigation and artefact browser

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.6-feature-navigation.md
**Epic:** wuce-e2
**Framework:** Jest + Node.js (backend unit + integration; DOM-state assertions for render functions)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | `/features` lists all features with slug, stage, last-updated, artefact link | Unit + integration | None |
| AC2 | Artefact index shows plain-language labels; no internal type identifiers rendered | Unit (label function) + integration | None |
| AC3 | Artefacts grouped by stage with stage label visible | Unit + DOM-state | None |
| AC4 | Artefact link opens wuce.2 artefact view | Unit (link href) + navigation tested in wuce.2 | Browser navigation runtime-only; link href verified |
| AC5 | Repository with no artefacts directory → "No artefacts found" | Integration | None |

---

## Named fixtures (from E2 shared set — defined in wuce.5 test plan)

| Fixture path | Purpose |
|---|---|
| `tests/fixtures/github/pipeline-state-feature.json` | Feature object with `slug`, `stage`, `updatedAt`, `stories[]` — used by `listFeatures` adapter test |

**Additional fixtures (wuce.6 only):**

| Fixture path | Content |
|---|---|
| `tests/fixtures/github/contents-api-artefact-list.json` | GitHub Contents API directory listing response: array of `{ "name": "discovery.md", "type": "file", "path": "artefacts/2026-05-02-test-feature/discovery.md", "sha": "abc001" }` entries spanning discovery, benefit-metric, story, test-plan, dor types |
| `tests/fixtures/github/contents-api-empty-artefacts.json` | GitHub Contents API 404 response for a repo with no `artefacts/` directory: `{ "message": "Not Found" }` |

---

## Unit tests

### T1 — `labelArtefactType(internalType: string): string` (AC2)

**T1.1 — `"dor"` → `"Ready Check"`**
- Input: `"dor"`
- Expected: `"Ready Check"`
- Rationale: AC2 specifies definition-of-ready artefacts must display as "Ready Check"; internal identifier must not appear

**T1.2 — `"benefit-metric"` → `"Benefit Metric"`**
- Input: `"benefit-metric"`
- Expected: `"Benefit Metric"`

**T1.3 — `"discovery"` → `"Discovery"`**
- Input: `"discovery"`
- Expected: `"Discovery"`

**T1.4 — `"test-plan"` → `"Test Plan"`**
- Input: `"test-plan"`
- Expected: `"Test Plan"`

**T1.5 — `"story"` → `"Stories"`**
- Input: `"story"`
- Expected: `"Stories"`

**T1.6 — unknown type returns non-empty fallback (no throw)**
- Input: `"unknown-internal-type"`
- Expected: a non-empty string (not `"unknown-internal-type"` itself); no thrown exception
- Rationale: new artefact types must not break the browser; internal names must never appear as rendered text

### T2 — `groupArtefactsByStage(artefacts: Artefact[]): GroupedArtefacts` (AC3)

**T2.1 — groups artefacts by stage with correct keys**
- Input: array with mixed types (discovery, benefit-metric, story, test-plan, dor)
- Expected: result object has keys corresponding to stage names; each key's value is the subset of artefacts for that stage

**T2.2 — no internal type identifier appears as a group key**
- Input: artefacts with internal types `"dor"`, `"benefit-metric"`
- Expected: group keys are display-label stage names (Discovery, Definition, Test Plan, DoR), not internal identifiers
- Verifies AC3 + AC2 constraint

**T2.3 — empty array returns empty groups without throwing**
- Input: `[]`
- Expected: empty object or empty groups; no thrown exception

### T3 — `listFeatures(token: string)` adapter (AC1)

**T3.1 — returns feature list with required fields**
- Setup: mock SCM adapter `listFeatures`; mock `validateRepositoryAccess` returns `true`; uses `pipeline-state-feature.json` fixture
- Expected: array contains items with `slug`, `stage`, `lastUpdated`, `artefactIndexUrl` fields
- Verifies AC1 data shape

**T3.2 — validates read access before listing features**
- Setup: mock `validateRepositoryAccess` spy
- Action: call `listFeatures(token)`
- Expected: `validateRepositoryAccess` called for each configured repository before any feature from that repo is returned

### T4 — `listArtefacts(featureSlug, token)` adapter (AC2, AC4)

**T4.1 — returns artefacts with display-label `type` field, not internal type**
- Setup: mock SCM adapter returning `contents-api-artefact-list.json`
- Expected: each artefact has `type` set to a plain-language label (e.g. "Discovery", not "discovery")
- Verifies AC2

**T4.2 — each artefact includes a `viewUrl` pointing to the wuce.2 artefact view**
- Expected: `viewUrl` field is set per artefact; format matches `/artefacts/:path`
- Verifies AC4 link href

### T5 — `renderFeatureList(features)` DOM-state (AC1)

**T5.1 — renders feature slug, stage, last-updated, and artefact index link**
- Input: one feature `{ slug: "2026-05-02-test-feature", stage: "test-plan", lastUpdated: "2026-05-01", artefactIndexUrl: "/features/2026-05-02-test-feature" }`
- Expected HTML contains: `"2026-05-02-test-feature"`, `"test-plan"` (or display equivalent), `"2026-05-01"`, link with `href="/features/2026-05-02-test-feature"`

**T5.2 — artefact index renders plain-language labels, not internal types**
- Input: one artefact `{ type: "Ready Check", name: "wuce.1-dor.md", viewUrl: "/artefacts/..." }`
- Expected HTML contains: `"Ready Check"` and does NOT contain `"dor"` as visible text

---

## Integration tests

### IT1 — `GET /features` returns feature list with correct shape (AC1)

- Setup: authenticated session; mock `listFeatures` adapter using `pipeline-state-feature.json`
- Request: `GET /features`
- Expected: `200`; response body contains array with `slug`, `stage`, `lastUpdated`, `artefactIndexUrl` per feature

### IT2 — `GET /features/:slug` returns artefact index with display labels (AC2, AC3)

- Setup: authenticated session; mock `listArtefacts` adapter using `contents-api-artefact-list.json`
- Request: `GET /features/2026-05-02-test-feature`
- Expected: `200`; response contains artefacts with `type` values "Discovery", "Benefit Metric", "Stories", "Test Plan", "Ready Check"; no internal type identifier in response body

### IT3 — `GET /features/:slug` for repo with no artefacts directory → "No artefacts found" (AC5)

- Setup: authenticated session; mock GitHub API returns `contents-api-empty-artefacts.json` (404)
- Request: `GET /features/2026-05-02-no-artefacts-repo`
- Expected: `200`; response body contains `{ "message": "No artefacts found" }` (or equivalent); no error page / 500

### IT4 — `GET /features` requires authentication

- Setup: no session cookie
- Request: `GET /features`
- Expected: `401`

---

## NFR tests

### NFR1 — Audit log on feature list access

- Setup: authenticated session; spy on audit logger
- Action: `GET /features`
- Expected: audit log call with `userId`, `featureCount`, `timestamp`; no token logged

### NFR2 — Private repo not enumerated for unauthorised user

- Setup: mock `validateRepositoryAccess` returns `false` for repo-B
- Action: `listFeatures(token)` where repo-B is in the configured list
- Expected: repo-B features absent from result; no exception thrown; no 403 propagated to client

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC4 — artefact view loads on click | Runtime browser navigation | Link `href` tested in T4.2, T5.2; actual render tested in wuce.2 integration tests |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 13 |
| Integration tests | 4 |
| NFR tests | 2 |
| **Total** | **19** |

**acTotal: 5**
