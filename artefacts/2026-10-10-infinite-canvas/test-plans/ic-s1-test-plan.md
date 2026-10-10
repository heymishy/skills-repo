## Test Plan: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stages render as drawflow nodes, left-to-right in position order, auto-connected | 2 tests | — | — | — | — | 🟢 |
| AC2 | Node preserves Edit stage link, Map feature button, health indicator | 3 tests | — | — | — | — | 🟢 |
| AC3 | Moment-of-truth badge still renders | 1 test | — | — | — | — | 🟢 |
| AC4 | 0-stage empty state unchanged | 1 test | — | — | — | — | 🟢 |
| AC5 | `/vendor/drawflow.min.js`/`.css` served correctly, zero bundler | — | 2 tests | — | — | — | 🟢 |
| AC6 | `window.Drawflow` load guard, fails loudly | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, self-contained mock pools (this feature's own established convention, same as `ep1-s4`/`ep5-s2`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey with 3 stages at known `position` values | Synthetic mock pool | None | Mirrors `check-ep1-s4-stage-reorder.js`'s own `makeCanvasMockPool` pattern |
| AC2 | A stage with a real feature mapping and a health state | Synthetic mock pool | None | Mirrors `ep3-s2`'s own `buildHealthIndicator` test fixtures |
| AC3 | A stage with `moment_of_truth: true` | Synthetic mock pool | None | |
| AC4 | A journey with 0 stages | Synthetic mock pool | None | |
| AC5 | None — pure server asset-route test | N/A | None | |
| AC6 | Rendered page's own `<script>` block | Extracted from rendered HTML (same `extractScript`/`extractFunctionBody` helpers as `check-ep1-s4-stage-reorder.js`) | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renders stages as drawflow nodes in position order

- **Verifies:** AC1
- **Precondition:** Mock pool returns a journey with 3 stages at `position` 0, 1, 2
- **Action:** Call `handleGetJourneyCanvas(req, res, null, pool)`
- **Expected result:** `res._b.bodyContent` contains 3 drawflow `addNode`/node-data entries (one per stage), with each successive stage's initial `x` coordinate greater than the previous (left-to-right)
- **Edge case:** No

### auto-connects sequential stages

- **Verifies:** AC1
- **Precondition:** Same 3-stage journey as above
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** The rendered script contains exactly 2 connection entries: stage1→stage2 and stage2→stage3 — never a connection skipping a stage, never a connection the operator didn't implicitly request via sequence
- **Edge case:** Yes — a journey with exactly 1 stage renders 0 connections, not an error

### preserves Edit stage link on each node

- **Verifies:** AC2
- **Precondition:** A stage node renders
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Each node's markup contains an "Edit stage" link/control targeting that exact stage id, identical in behaviour to the pre-canvas list view's own link
- **Edge case:** No

### preserves Map feature button on each node

- **Verifies:** AC2
- **Precondition:** A stage node renders
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Each node's markup contains a "Map feature" button targeting that exact stage id
- **Edge case:** No

### preserves health indicator on each node

- **Verifies:** AC2
- **Precondition:** Stages with "none"/"partial"/"covered" health states (reusing `ep3-s2`'s own `computeStageHealth` fixtures)
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Each node shows the exact same ✅/⚠️/❌ indicator the prior list view showed for that stage's health state
- **Edge case:** No

### renders moment-of-truth badge on flagged stage

- **Verifies:** AC3
- **Precondition:** One stage has `moment_of_truth: true`, another `false`
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Only the flagged stage's node shows the 🚩 badge
- **Edge case:** No

### renders empty state for zero stages

- **Verifies:** AC4
- **Precondition:** Mock pool returns a journey with 0 stages
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** `res._b.bodyContent` contains "No stages yet. Add your first stage." — no drawflow canvas markup at all
- **Edge case:** Yes — this IS the edge case for AC1

### client-side load guard fails loudly when window.Drawflow is undefined

- **Verifies:** AC6
- **Precondition:** Rendered page's `<script>` block extracted via `extractScript()`
- **Action:** Inspect the extracted script for a guard checking `typeof window.Drawflow === 'function'` (or equivalent) before any node-rendering call, matching `csd-s1`'s own `window.mermaid` guard convention
- **Expected result:** The guard exists and, on failure, logs/throws visibly (not a silent no-op) — assert the guard's own source text contains an explicit error path, not just an `if` with an empty branch
- **Edge case:** No

---

## Integration Tests

### serves drawflow.min.js from node_modules with gzip

- **Verifies:** AC5
- **Components involved:** `src/web-ui/routes/public.js`'s new asset handler, `node_modules/drawflow/dist/drawflow.min.js`
- **Precondition:** Request with `Accept-Encoding: gzip`
- **Action:** Call the handler directly with a mock `req`/`res`
- **Expected result:** `res` status 200, `Content-Type: application/javascript`, `Content-Encoding: gzip`, body matches the gzip-compressed real file read from `node_modules` — mirroring the existing `handleMermaidAsset` test shape (if one exists, reuse its structure; otherwise this is the first such test, written as a template for any future vendored asset)

### serves drawflow.min.css correctly

- **Verifies:** AC5
- **Components involved:** Same handler, `node_modules/drawflow/dist/drawflow.min.css`
- **Precondition:** None
- **Action:** Call the handler directly
- **Expected result:** `res` status 200, `Content-Type: text/css`, body matches the real file read from `node_modules`

---

## NFR Tests

### Performance — no automated threshold test

- **NFR addressed:** Performance
- **Measurement method:** Manual observation during DoD live-browser confirmation (no formal SLO defined in `nfr-profile.md` — informal target only, consistent with this journey's own current scale)
- **Pass threshold:** N/A — see AC verification script
- **Tool:** Manual

### Security — no dedicated test, validated by design

- **NFR addressed:** Security
- **Measurement method:** Code inspection — this story introduces no new input surface; the `/vendor/` routes serve static, session/tenant-data-free assets (same trust level as the existing `/vendor/mermaid.min.js`)
- **Pass threshold:** N/A
- **Tool:** Code review (Category E of `/review`, already passed)

### Accessibility — no regression, validated by AC2's own tests

- **NFR addressed:** Accessibility
- **Measurement method:** AC2's own unit tests directly confirm every existing per-stage action remains reachable; no separate NFR test needed
- **Pass threshold:** N/A
- **Tool:** Unit tests above

### Audit — None, confirmed with story owner

No new mutating action in this story — no audit NFR test applicable.

---

## Out of Scope for This Test Plan

- Free node dragging/repositioning — `ic-s2-test-plan.md`
- Canvas pan/zoom — `ic-s3-test-plan.md`
- Keyboard-accessible movement — `ic-s4-test-plan.md`
- Manual connection-drawing — never in scope for this feature (epic-level exclusion)

---

## Test Gaps and Risks

None.
