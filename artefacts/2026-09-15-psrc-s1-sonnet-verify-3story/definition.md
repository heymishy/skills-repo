# Definition: Route governance-critical skills to Sonnet by default

**Discovery reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/benefit-metric.md

---

## Step 1.5 — Architecture constraints scan

Read `.github/architecture-guardrails.md`. No active ADR governs model routing directly. `psrc-s1`'s own module header (`src/web-ui/config/model-routing.js`) documents the one binding safety invariant this feature must not touch: `HAIKU_BLOCKED_SKILLS` (EXP-021, `discovery`'s fabrication-risk guard) — unconditional, no override path may weaken it. This feature does not modify `HAIKU_BLOCKED_SKILLS` or any code in `model-routing.js` at all; it only sets configuration (Fly secrets) that the existing module already reads, plus one new small guard check.

Per **ADR-017**, this feature uses the flat `feature.stories[]` shape (no epic nesting) — matching the dominant, current convention in this repo's `pipeline-state.json` (confirmed directly, not assumed, during the `tab-s1` feature earlier in this session).

---

## Step 2 — Slicing strategy

**Risk-first.** Story 1 (verification) must run before Story 2 (deployment) can be trusted — deploying an override for a skill that turns out NOT to fix the problem would be worse than the current known-bad state (false confidence). Story 3 (drift guard) is lowest-risk and depends on Story 2's secrets actually existing to check against.

---

## Epic: Route governance-critical skills to Sonnet by default

**Goal:** Confirm Sonnet 4.6 resolves both known Haiku failure modes (artefact-marker emission, shallow single-turn completion) on `design`, `definition`, `review`, `test-plan`, and `definition-of-ready`, deploy the fix as real Fly secrets on both `wuce-staging` and production, and add a lightweight guard so a future silent drift back to Haiku-by-default is caught automatically rather than recurring a third time.

**Out of Scope:**
1. Changing `discovery`/`ideate`'s existing Sonnet default.
2. Any change to `HAIKU_BLOCKED_SKILLS` (EXP-021 safety invariant).
3. Retroactively repairing any artefact already produced under the bug (already manually corrected where it mattered, e.g. `tab-s1`).
4. General Sonnet-vs-Haiku cost/latency policy across the whole skill library.
5. New model-routing code — reuses `psrc-s1`'s existing `WUCE_MODEL_OVERRIDE_<SKILL>` mechanism exactly as built.

**Benefit Metrics Addressed:**
| Metric | Story |
|--------|-------|
| Governance-critical skill completion integrity | psrc-verify-s1 (confirms the fix), psrc-verify-s2 (deploys it) |
| Manual restart incidents | psrc-verify-s2 |
| Model-routing intent matches deployed reality (drift guard) | psrc-verify-s3 |

**Stories:**
1. `psrc-verify-s1` — Verify Sonnet 4.6 resolves both failure modes across all 5 skills
2. `psrc-verify-s2` — Deploy `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secrets to staging and production
3. `psrc-verify-s3` — Add a drift guard between intended and actual model routing

**Oversight:** Low (Hamish King is the sole operator/approver; this is an infra/config change with an already-built, already-code-reviewed mechanism, not new application logic)
**Complexity:** 1 (well understood — the routing mechanism already exists and is tested; this epic is verification + deployment + one small guard, not new feature development)
**Scope Stability:** Stable

---CANVAS-JSON: {"type":"program-design","title":"As designed: Sonnet routing for governance-critical skills","content":{"mermaid":"flowchart LR\n    CONFIG[model-routing.js\\nDEFAULT_SONNET_SKILLS]\n    SECRET[Fly secret\\nWUCE_MODEL_OVERRIDE_SKILL]\n    RESOLVE[getModelForSkill]\n    GUARD[drift-guard check]\n    CONFIG --> RESOLVE\n    SECRET --> RESOLVE\n    RESOLVE -.checked against.-> GUARD\n    SECRET -.set on.-> STAGING[wuce-staging]\n    SECRET -.set on.-> PROD[skills-framework]"}}---
