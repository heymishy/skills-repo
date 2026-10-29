## Contract Proposal — Classify the 5 journey-related E2E seed endpoints as redundant or legitimate

**What will be built:**
- A classification artefact (e.g. `artefacts/2026-10-30-test-fixture-hardening-continuation/research/journey-seed-endpoint-classification.md`) recording, for each of the 5 real endpoints (`seed-approval-journey`, `seed-board-journey`, `seed-actr-s2-journey`, `seed-ppc-s5-journey`, `seed-journey-gate-session`), a verdict of redundant or legitimately different, with reasoning grounded in a direct read of each endpoint's real handler code in `src/web-ui/server.js`.

**What will NOT be built:**
- Any consolidation or modification of the 5 endpoints themselves — classification only, per the story's own Out of Scope section.
- Classification of the other 8 non-journey-related `/test/seed-*` endpoints — out of this epic entirely.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test (structural) — artefact names all 5 endpoints with an explicit verdict each | unit |
| AC2 | Unit test (structural) — any redundant verdict has a correctly-sized fast-follow entry | unit |
| AC3 | Unit test (structural) — if zero redundant, artefact explicitly closes the question | unit |
| AC4 | Integration test — `benefit-metric.md`'s Metric 4 references the artefact's real saved path | integration |

**Assumptions:**
- All 5 named endpoints are real and currently present in `src/web-ui/server.js` — confirmed by grep (lines 2431, 2598, 2663, 2852, 2971) before this contract was written, not assumed from the story text alone.
- Whether a given endpoint is genuinely redundant is a human-domain judgment call, not something an automated test can assert — the automated tests here verify the artefact is complete and well-formed; the verification script requires a human reviewer to confirm the classification's substantive correctness.

**Estimated touch points:**
Files: One new classification artefact under `artefacts/2026-10-30-test-fixture-hardening-continuation/research/` (new); `benefit-metric.md` (modified — Metric 4 evidence field updated with the real path)
Services: None
APIs: None (read-only investigation of existing endpoint code)

**schemaDepends:** Not applicable — Dependencies block states "None"; no upstream story referenced.
