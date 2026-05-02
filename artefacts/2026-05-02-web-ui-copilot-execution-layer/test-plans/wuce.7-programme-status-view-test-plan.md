# Test Plan: wuce.7 — Programme manager pipeline status view

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.7-programme-status-view.md
**Epic:** wuce-e2
**Framework:** Jest + Node.js (backend unit + integration; DOM-state assertions for render functions)
**Test data strategy:** Static fixtures committed to `tests/fixtures/`

---

## AC coverage summary

| AC | Description | Coverage type | Gap |
|---|---|---|---|
| AC1 | `/status` shows portfolio board: feature name, stage, last-activity, blocker indicator, artefact link | Unit + integration | None |
| AC2 | `traceStatus: "has-findings"` → amber indicator + "Trace findings" label (not generic "blocked") | Unit + DOM-state | None |
| AC3 | `dorStatus: "signed-off"` + `prStatus: "none"` → "Awaiting implementation dispatch" | Unit | None |
| AC4 | "Export as Markdown" → `.md` file with status table | Unit (content) + integration (endpoint) | Browser file download trigger is runtime-only; markdown content tested |
| AC5 | Done condition: all stories `prStatus: "merged"` AND `traceStatus: "passed"` → "Done" group, visually separated | Unit + DOM-state | None |

---

## Named fixtures (from E2 shared set — defined in wuce.5 test plan)

| Fixture path | Purpose |
|---|---|
| `tests/fixtures/github/pipeline-state-feature.json` | Feature object with `slug`, `stage`, `updatedAt`, `stories[]` (with `prStatus`, `dorStatus`, `traceStatus`) — used by `getPipelineStatus` adapter |

**Additional fixtures (wuce.7 only):**

| Fixture path | Content |
|---|---|
| `tests/fixtures/github/pipeline-state-done-feature.json` | Feature object where ALL stories have `prStatus: "merged"` AND `traceStatus: "passed"`: `{ "slug": "2026-05-01-done-feature", "stories": [{ "id": "df.1", "prStatus": "merged", "traceStatus": "passed" }, { "id": "df.2", "prStatus": "merged", "traceStatus": "passed" }] }` |
| `tests/fixtures/github/pipeline-state-trace-findings.json` | Feature object with `traceStatus: "has-findings"` on at least one story; used for AC2 amber indicator test |
| `tests/fixtures/github/pipeline-state-awaiting-dispatch.json` | Feature object with `dorStatus: "signed-off"`, `prStatus: "none"` on at least one story; used for AC3 label test |

---

## Unit tests

### T1 — `getPipelineStatus(featureSlug, token)` adapter (AC1)

**T1.1 — returns correct fields from pipeline-state.json**
- Setup: mock SCM adapter reads `pipeline-state-feature.json`
- Expected: result contains `slug`, `stage`, `lastActivityDate`, `stories` array with `prStatus`, `dorStatus`, `traceStatus` per story
- Rationale: AC1 requires stage + last-activity; downstream derivation functions depend on story-level fields

**T1.2 — adapter validates repository read access before serving status**
- Setup: mock `validateRepositoryAccess` spy
- Action: `getPipelineStatus("2026-05-02-test-feature", token)`
- Expected: `validateRepositoryAccess` called; no data returned if access fails

### T2 — `deriveBlockerIndicator(feature)` (AC2)

**T2.1 — returns "Trace findings" for feature with `traceStatus: "has-findings"`**
- Input: feature from `pipeline-state-trace-findings.json`
- Expected: `"Trace findings"` (not `"blocked"`, not `"has-findings"`)
- Verifies AC2 exact label

**T2.2 — returns `null` for feature with `traceStatus: "passed"` and no other blockers**
- Input: feature with all stories `traceStatus: "passed"`
- Expected: `null`

**T2.3 — does not throw for feature with no `traceStatus` field**
- Input: feature with stories lacking `traceStatus`
- Expected: no thrown exception; returns `null` or a safe default

### T3 — `deriveFeatureStatusLabel(stories)` (AC3)

**T3.1 — returns "Awaiting implementation dispatch" when story has `dorStatus: "signed-off"` + `prStatus: "none"`**
- Input: stories from `pipeline-state-awaiting-dispatch.json`
- Expected: `"Awaiting implementation dispatch"`
- Verifies AC3 exact text label

**T3.2 — returns non-empty string for other story state combinations (no throw)**
- Input: stories with `prStatus: "draft"`, `dorStatus: "not-started"`
- Expected: a non-empty string; no thrown exception

### T4 — `isFeatureDone(feature)` (AC5)

**T4.1 — returns `true` when ALL stories have `prStatus: "merged"` AND `traceStatus: "passed"`**
- Input: feature from `pipeline-state-done-feature.json`
- Expected: `true`
- Verifies AC5 done condition; explicitly confirms this uses only existing pipeline-state.json fields (no new fields)

**T4.2 — returns `false` when any story has `prStatus !== "merged"`**
- Input: feature where one story has `prStatus: "open"`, rest have `prStatus: "merged"` + `traceStatus: "passed"`
- Expected: `false`

**T4.3 — returns `false` when any story has `traceStatus !== "passed"`**
- Input: feature where all stories have `prStatus: "merged"` but one has `traceStatus: "has-findings"`
- Expected: `false`

**T4.4 — returns `false` for feature with no stories**
- Input: feature with `stories: []`
- Expected: `false` (no stories = not done)

### T5 — `exportStatusAsMarkdown(features)` (AC4)

**T5.1 — returns string containing a markdown table header**
- Input: array with one feature from `pipeline-state-feature.json`
- Expected: returned string starts with or contains `| Feature |` or equivalent markdown table header row

**T5.2 — includes feature name and stage in the output table**
- Input: feature with `slug: "2026-05-02-test-feature"`, `stage: "test-plan"`
- Expected: output string contains `"2026-05-02-test-feature"` and `"test-plan"` (or display equivalent)
- Verifies AC4 content suitability for steering committee report

**T5.3 — handles empty features array without throwing**
- Input: `[]`
- Expected: non-empty string (e.g. table header with "No features" row); no thrown exception

### T6 — `renderStatusBoard(features)` DOM-state (AC1, AC2, AC5)

**T6.1 — row with `traceStatus: "has-findings"` contains amber indicator AND "Trace findings" text label**
- Input: feature from `pipeline-state-trace-findings.json`
- Expected HTML contains: an element with amber indicator class AND text `"Trace findings"` in the same row
- Verifies AC2: colour is NOT the sole indicator (text label present alongside colour)

**T6.2 — done features are in a visually separated "Done" group**
- Input: one in-progress feature + one done feature (from `pipeline-state-done-feature.json`)
- Expected HTML: done feature appears under a "Done" heading/section that is a separate DOM element from the in-progress section
- Verifies AC5 visual separation

---

## Integration tests

### IT1 — `GET /status` returns portfolio status board data (AC1)

- Setup: authenticated session; mock `getPipelineStatus` using `pipeline-state-feature.json`
- Request: `GET /status`
- Expected: `200`; body contains array of feature status objects with `slug`, `stage`, `lastActivityDate`, `blockerLabel`

### IT2 — `GET /status/export` returns markdown-formatted status table (AC4)

- Setup: authenticated session; mock feature data
- Request: `GET /status/export`
- Expected: `200`; `Content-Type: text/markdown` (or `text/plain`); body contains markdown table with feature rows

### IT3 — `GET /status` requires authentication

- Setup: no session cookie
- Request: `GET /status`
- Expected: `401`

---

## NFR tests

### NFR1 — Audit log on status board access

- Setup: authenticated session; spy on audit logger
- Action: `GET /status`
- Expected: audit log call with `userId`, `featureCount`, `timestamp`

### NFR2 — Colour not sole status indicator (WCAG 2.1 AA)

- Setup: render status board with a feature that has a blocker
- Expected DOM: blocker indicator element has both a colour class AND a non-empty text label (icon character or text)
- Verifies NFR accessibility constraint (colour + text, not colour alone)

---

## Coverage gaps

| Gap | Reason | Mitigation |
|---|---|---|
| AC4 — browser file download trigger | Runtime browser behaviour (`Blob` + `URL.createObjectURL`) | Markdown content verified in T5.1–T5.3; download endpoint tested in IT2; download trigger is manual verification step |

---

## Test count

| Category | Count |
|---|---|
| Unit tests | 14 |
| Integration tests | 3 |
| NFR tests | 2 |
| **Total** | **19** |

**acTotal: 5**
