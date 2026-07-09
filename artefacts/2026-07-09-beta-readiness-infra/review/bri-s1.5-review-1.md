# Review Report: Create and wire the 3 initial flags across both projects — Run 1

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Date:** 2026-07-09
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** B — AC2 ("routes to the GLM-5.2 model path") and AC3 ("shows the v2 billing flow") both require gating a real, already-existing product feature — but a repo-wide search confirms **zero** matches for GLM-5.2/model-routing-glm52 anywhere in `src/`, and no "billing-v2" flow exists (only `src/web-ui/routes/billing.js`, a v1 flow). Verified independently: `grep -rli "glm-5\|glm52\|glm5\.2" src/` and `grep -rli "billing-v2\|billing_v2" src/` both return zero matches. As written, satisfying AC2/AC3 silently requires building two substantial, entirely unscoped product features (a new LLM provider integration and a new billing flow) under a "feature flags infrastructure" story.
  Fix: Either (a) descope AC2/AC3 to test the gating mechanism against a stub/mock behaviour rather than a real, not-yet-built feature, or (b) explicitly declare in this story's Out of Scope / Dependencies that `model-routing-glm52` and `billing-v2` are assumed to be built by separate, currently-unscoped features, and name those features (or note they don't exist yet and this story cannot reach DoD until they do).

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** B — The story's Out of Scope section does not acknowledge or bound the AC2/AC3 dependency on unbuilt functionality — it should either declare the underlying behaviours are assumed pre-built elsewhere (with a pointer) or narrow the ACs to test the gating mechanism against a stub.
  Risk if proceeding: the story reads as achievable when it is not, without significant unscoped work.
  To acknowledge: run /decisions, category SCOPE, documenting the dependency and the descope decision.
- **[1-M2]** E — Introducing routing to a new LLM provider/model (GLM-5.2) is the kind of architectural decision this repo normally records as an ADR (precedent: ADR-021 formally decided the model execution engine) — no ADR or Architecture Constraint addresses this, despite AC2 requiring it.
  Risk if proceeding: an undocumented, unreviewed model-provider decision embedded inside a test-flag story.
  To acknowledge: if GLM-5.2 routing is real future work, it needs its own ADR before this AC can be honestly written as testable.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 2 MEDIUM, 0 LOW.
**Outcome:** FAIL

Scores — A-Traceability: 5, B-ScopeIntegrity: 2 (automatic-fail threshold — ACs require unscoped, non-existent product functionality), C-ACQuality: 4, D-Completeness: 5.
