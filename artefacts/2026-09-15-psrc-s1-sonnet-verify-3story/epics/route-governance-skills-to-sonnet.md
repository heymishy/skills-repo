# Epic: Route governance-critical skills to Sonnet by default

**Definition reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/definition.md
**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/benefit-metric.md

**Goal:** Confirm Sonnet 4.6 resolves both known Haiku failure modes (artefact-marker emission, shallow single-turn completion) on `design`, `definition`, `review`, `test-plan`, and `definition-of-ready`, deploy the fix as real Fly secrets on both `wuce-staging` and production, and add a lightweight guard so a future silent drift back to Haiku-by-default is caught automatically rather than recurring a third time.

## Out of Scope

1. Changing `discovery`/`ideate`'s existing Sonnet default.
2. Any change to `HAIKU_BLOCKED_SKILLS` (EXP-021 safety invariant).
3. Retroactively repairing any artefact already produced under the bug (already manually corrected where it mattered, e.g. `tab-s1`).
4. General Sonnet-vs-Haiku cost/latency policy across the whole skill library.
5. New model-routing code — reuses `psrc-s1`'s existing `WUCE_MODEL_OVERRIDE_<SKILL>` mechanism exactly as built.

## Benefit Metrics Addressed

| Metric | Story |
|--------|-------|
| Governance-critical skill completion integrity | psrc-verify-s1 (confirms the fix), psrc-verify-s2 (deploys it) |
| Manual restart incidents | psrc-verify-s2 |
| Model-routing intent matches deployed reality (drift guard) | psrc-verify-s3 |

## Stories

1. `psrc-verify-s1` — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s1.md
2. `psrc-verify-s2` — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s2.md
3. `psrc-verify-s3` — artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md

**Oversight:** Low
**Complexity:** 1
**Scope Stability:** Stable

---CANVAS-JSON: {"type":"program-design","title":"As designed: Sonnet routing for governance-critical skills","content":{"mermaid":"flowchart LR\n    CONFIG[model-routing.js\\nDEFAULT_SONNET_SKILLS]\n    SECRET[Fly secret\\nWUCE_MODEL_OVERRIDE_SKILL]\n    RESOLVE[getModelForSkill]\n    GUARD[drift-guard check]\n    CONFIG --> RESOLVE\n    SECRET --> RESOLVE\n    RESOLVE -.checked against.-> GUARD\n    SECRET -.set on.-> STAGING[wuce-staging]\n    SECRET -.set on.-> PROD[skills-framework]"}}---
