## Contract Proposal — Web UI rendering alongside incident records

**What will be built:**
`_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`) — the same surface `itar-s3` extends — is extended a second time: deferred-item records (`type: "deferred-item"`, per `ddft-s1`'s schema) render in the same list as incident records, fetched via the same `fetchRepoPath` primitive `itar-s3` already established against `workspace/incidents.json`. Rendering distinguishes `type: "incident"` from `type: "deferred-item"` with a text label (not colour alone, per MC-A11Y-02), and shows `revisitCondition` inline without a click-through, matching how `itar-s3` already surfaces an incident's triage summary.

**What will NOT be built:**
Any filter or rollup UI specific to deferred items. Creating or resolving a deferred-item record from the web UI — read-only rendering only, same as `itar-s3`.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on the type-distinguishing render logic (text label present for both types); integration test rendering a mixed fixture (1 incident + 1 deferred-item) and asserting both appear, correctly labelled | unit + integration |
| AC2 | Unit test asserting `revisitCondition` text renders inline without requiring a click-through interaction | unit |
| AC3 | Integration test rendering `ddft-s1`'s 2 real seeded records (`tfhc-s1`, C1-vs-Option-C) and asserting both render without error | integration |
| AC4 | Unit + integration test with zero `type: "deferred-item"` records present, asserting the incident-only view renders normally with no regression (the case `itar-s3` already handles) | unit + integration |

**Assumptions:**
**This story has a hard, confirmed dependency on `itar-s3`** (a different feature's story — `2026-11-08-incident-triage-and-respond`), which must ship first since this story extends the exact same rendering surface and reuses its `fetchRepoPath` call pattern rather than introducing a second one. **As of this DoR run (2026-11-09), `itar-s3`'s own `/definition-of-ready` has not yet completed** — checked directly at `artefacts/2026-11-08-incident-triage-and-respond/dor/`, which contains only `itar-s1`'s DoR artefacts, not `itar-s3`'s, at the time this contract was written. This DoR run for `ddft-s5` proceeds on the strength of `ddft-s5`'s own story/test-plan/ACs being complete and correct — the cross-feature sequencing constraint is captured explicitly below and in Dependencies/H8-ext, not glossed over. The implementer must re-check `itar-s3`'s DoR/merge status before starting, not assume it from the time this contract was written.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (extended — `_renderConsolidatedFeaturesSection`).
Services: none.
APIs: none (reuses `fetchRepoPath`, no new API surface).
