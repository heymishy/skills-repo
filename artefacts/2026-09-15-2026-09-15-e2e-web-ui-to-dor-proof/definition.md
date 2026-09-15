Slicing strategy: vertical-slice

## Epic 1 — End-to-End Pipeline Infrastructure Verification

Goal: Confirm that the wsd/wsap pipeline-state and artefact-path fixes compose correctly through the web UI outer loop by running a complete discovery → definition stage sequence with real GitHub commits and correct state updates at each boundary.

Out of scope:
- Any real product functionality or code changes
- Inner loop execution, branch setup, or coding agent dispatch
- Automated regression test infrastructure
- More than 2 stories or additional verification runs

Oversight: High
Oversight rationale: This is a critical infrastructure verification run before further feature delivery. A regression in the pipeline state or artefact paths would compound into all future features.

Complexity: 1
Scope stability: Stable

### ep1-s1 — Verify discovery through definition pipeline stages

Persona: Hamish King — Operator

So that the operator can confirm the wsd/wsap pipeline-state and artefact-path fixes work end-to-end, I need the discovery → benefit-metric → definition stages to execute correctly through the web UI with real GitHub commits and correct `pipeline-state.json` updates at each boundary.

Benefit linkage: Metric 1 (Successful GitHub commits at all stage boundaries) — this story verifies that 3/6 stage commits succeed and appear in GitHub history under the operator's identity. Metric 2 (pipeline-state.json field accuracy) — this story verifies that stage, artefactPath, and feature-level fields are correct after definition.

Architecture constraints: ADR-022 (multi-skill journey via Option B — one session per skill stage), ADR-002 (gate logic uses evidence fields, not stage-proxy). Checked against .github/architecture-guardrails.md.

Given the operator has logged into the web UI and this feature's discovery artefact is approved,
When the operator runs the discovery skill → commits the discovery.md → runs benefit-metric skill → commits benefit-metric.md → runs definition skill → commits definition.md with 2 stories,
Then all three artefacts commit to GitHub under the operator's identity, `pipeline-state.json` on master shows `stage: definition` with correct artefactPath references, and both stories show `artefactPath` fields pointing to real files in `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/stories/`.

Out of scope:
- Review, test-plan, or DoR stages (covered in ep1-s2)
- Any modifications to the feature's discovery or benefit-metric artefacts
- Verification of DoD completeness

Dependencies: None (this is the first story)
NFR: All commits must land on master within the same session; `pipeline-state.json` must be valid JSON after each write.
Complexity: 1
Scope stability: Stable

### ep1-s2 — Verify review through definition-of-ready pipeline stages

Persona: Hamish King — Operator

So that the operator can confirm the full outer loop completes correctly, I need the review → test-plan → definition-of-ready stages to execute with real GitHub commits, correct state updates, and `dorStatus: signed-off` recorded for both stories.

Benefit linkage: Metric 1 (Successful GitHub commits at all stage boundaries) — this story verifies that 3/6 remaining stage commits succeed (review, test-plan, DoR). Metric 3 (Correct per-story artefact paths) — this story verifies that DoR artefacts land at the correct per-story paths and `pipeline-state.json` reflects them without 404s.

Architecture constraints: ADR-022 (multi-skill journey via Option B), ADR-002 (evidence fields for gate evaluation). DoR gate must check `dorStatus` field, not stage alone. Checked against .github/architecture-guardrails.md.

Given the operator has completed ep1-s1 (discovery through definition stages are committed),
When the operator runs the review skill → commits review.md → runs test-plan skill → commits test-plans for both stories → runs definition-of-ready skill → commits DoR artefacts for both stories and signs off,
Then all three artefacts commit to GitHub under the operator's identity, `pipeline-state.json` shows `stage: definition-of-ready` with `dorStatus: signed-off` for both stories, and all DoR artefact paths in `pipeline-state.json` point to real files in `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/dor/`.

Out of scope:
- Any inner loop execution or branch setup after DoR sign-off
- Modifications to any prior-stage artefacts
- Additional verification runs or automation

Dependencies: ep1-s1 (discovery through definition must complete first)
NFR: All commits must land on master; both stories must have `dorStatus: signed-off` recorded; no 404s on any artefactPath reference when resolved against actual committed files.
Complexity: 1
Scope stability: Stable