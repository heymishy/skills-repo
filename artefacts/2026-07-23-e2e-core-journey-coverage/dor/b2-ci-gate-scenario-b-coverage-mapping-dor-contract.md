## Contract Proposal — Add Scenario B to the CI-blocking gate and publish the spec-to-journey-step coverage mapping

**What will be built:**
- An extension to A5's CI job (or a parallel job following the same pattern) running B1's spec, added to the required status checks list on `master`.
- A new artefact `artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md` listing all 11 journey steps from discovery's MVP scope (Scenario A's 7, Scenario B's 4) mapped to spec file + AC reference.
- A Node script that cross-checks each mapping row against the real spec file content (asserts the AC reference genuinely appears in the named file).

**What will NOT be built:**
- A third scenario or any additional journey coverage — this story completes exactly Scenario A + Scenario B, per discovery's MVP scope.
- A fully automated mapping-generation tool — the document is manually authored but code-verified.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual: broken-PR rehearsal (one-time) + Integration: static config assertion | Integration + Manual |
| AC2 | Manual: clean-PR rehearsal (one-time) + Integration: static config assertion | Integration + Manual |
| AC3 | Integration: parse discovery.md's MVP scope + the mapping doc, assert full coverage | Integration |
| AC4 | Integration: cross-check mapping doc rows against real spec file content | Integration |

**Assumptions:**
- A5's gate mechanism (config-driven via `context.yml`, required-status-check pattern) is directly reusable for Scenario B without a new mechanism design.
- B1's spec file exists and passes locally before this story implements the gate wiring.

**Estimated touch points:**
Files: `.github/workflows/e2e.yml`, `.github/context.yml`, `artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md`, `tests/check-b2-ci-gate-config.js`, `tests/check-b2-coverage-mapping-accuracy.js`
Services: GitHub Actions, GitHub branch protection API
APIs: `gh api repos/:owner/:repo/branches/master/protection`
