## Story: Verify discovery through definition pipeline stages
**Epic reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/epics/end-to-end-pipeline-infrastructure-verification.md
**Discovery reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md
## User Story
As a **Hamish King — Operator**,
I want **the discovery → benefit-metric → definition stages to execute correctly through the web UI with real GitHub commits and correct `pipeline-state.json` updates at each boundary**,
So that **the operator can confirm the wsd/wsap pipeline-state and artefact-path fixes work end-to-end**.
## Benefit Linkage
Metric 1 (Successful GitHub commits at all stage boundaries) — this story verifies that 3/6 stage commits succeed and appear in GitHub history under the operator's identity. Metric 2 (pipeline-state.json field accuracy) — this story verifies that stage, artefactPath, and feature-level fields are correct after definition.
## Architecture Constraints
ADR-022 (multi-skill journey via Option B — one session per skill stage), ADR-002 (gate logic uses evidence fields, not stage-proxy). Checked against .github/architecture-guardrails.md.
## Dependencies
None (this is the first story)
## Acceptance Criteria
Given the operator has logged into the web UI and this feature's discovery artefact is approved,
When the operator runs the discovery skill → commits the discovery.md → runs benefit-metric skill → commits benefit-metric.md → runs definition skill → commits definition.md with 2 stories,
Then all three artefacts commit to GitHub under the operator's identity, `pipeline-state.json` on master shows `stage: definition` with correct artefactPath references, and both stories show `artefactPath` fields pointing to real files in `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/stories/`.
## Out of Scope
- Review, test-plan, or DoR stages (covered in ep1-s2)
- Any modifications to the feature's discovery or benefit-metric artefacts
- Verification of DoD completeness
## NFRs
All commits must land on master within the same session; `pipeline-state.json` must be valid JSON after each write.
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
