## Story: Verify review through definition-of-ready pipeline stages
**Epic reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/epics/end-to-end-pipeline-infrastructure-verification.md
**Discovery reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md
## User Story
As a **Hamish King — Operator**,
I want **the review → test-plan → definition-of-ready stages to execute with real GitHub commits, correct state updates, and `dorStatus: signed-off` recorded for both stories**,
So that **the operator can confirm the full outer loop completes correctly**.
## Benefit Linkage
Metric 1 (Successful GitHub commits at all stage boundaries) — this story verifies that 3/6 remaining stage commits succeed (review, test-plan, DoR). Metric 3 (Correct per-story artefact paths) — this story verifies that DoR artefacts land at the correct per-story paths and `pipeline-state.json` reflects them without 404s.
## Architecture Constraints
ADR-022 (multi-skill journey via Option B), ADR-002 (evidence fields for gate evaluation). DoR gate must check `dorStatus` field, not stage alone. Checked against .github/architecture-guardrails.md.
## Dependencies
ep1-s1 (discovery through definition must complete first)
## Acceptance Criteria
Given the operator has completed ep1-s1 (discovery through definition stages are committed),
When the operator runs the review skill → commits review.md → runs test-plan skill → commits test-plans for both stories → runs definition-of-ready skill → commits DoR artefacts for both stories and signs off,
Then all three artefacts commit to GitHub under the operator's identity, `pipeline-state.json` shows `stage: definition-of-ready` with `dorStatus: signed-off` for both stories, and all DoR artefact paths in `pipeline-state.json` point to real files in `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/dor/`.
## Out of Scope
- Any inner loop execution or branch setup after DoR sign-off
- Modifications to any prior-stage artefacts
- Additional verification runs or automation
## NFRs
All commits must land on master; both stories must have `dorStatus: signed-off` recorded; no 404s on any artefactPath reference when resolved against actual committed files.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
