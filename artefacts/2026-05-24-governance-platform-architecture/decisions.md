# Decisions Log: Governance Platform Architecture — Close Structural Gaps

**Feature slug:** 2026-05-24-governance-platform-architecture

---

## D1 — SC-07 scope addition: inline JS extraction promoted from R2 to story candidate

**Date:** 2026-05-24
**Context:** The original discovery identified 6 story candidates (SC-01 through SC-06). R2 in the risk section noted that inline JS in `github-script` steps is never tested by `npm test`, but R2 was not promoted to a story candidate in the initial discovery artefact.
**Decision:** SC-07 (Extract inline workflow JS to tested modules) promoted from R2 to an explicit story candidate during the benefit-metric stage.
**Rationale:** The benefit-metric analysis revealed SC-07 is load-bearing — it is referenced as a prerequisite for both M3 (closes the inline-JS blind-spot category, the root cause of 4 asd.1 bugs) and M5 (extracts `sourceIntegrity` so SC-06 can add the path traversal guard with test coverage). SC-06 without SC-07 would add a guard to a still-untested inline block — patching without closing the structural blind spot. SC-07 is the root-cause fix; SC-06 is the OWASP A01 closure.
**Scope ratio:** 7 stories / 6 original candidates = 1.17x — within the 1.5x threshold. No scope drift.
**Approval:** Operator (Hamis) — 2026-05-24.

---

## D2 — Slicing strategy: risk-first with explicit wave gates

**Date:** 2026-05-24
**Context:** The 7 stories have a clear dependency structure: documentation prerequisites (Wave 1) must land before CI wiring (Wave 2), and Wave 2 must be stable before the ADR-013 unification (Wave 3). Two slicing strategies were considered: walking skeleton (thin end-to-end slice early) vs. risk-first (highest-risk story gated behind prerequisites).
**Decision:** Risk-first slicing with 3 explicit wave gates. Wave 1 (SC-01, SC-04, SC-05) → Wave 2 (SC-07, SC-03, SC-06) → Wave 3 (SC-02). Wave ordering is dependency-driven first; within each wave, stories are ordered by complexity escalation.
**Rationale:** SC-02 (complexity 3) touches two high-churn files (governance-package.js, run-assurance-gate.js). Attempting SC-02 while Wave 2 PRs are open creates rebase conflict risk. The wave-gate structure ensures SC-02 operates on a known-stable codebase. The walking skeleton alternative would push SC-02 earlier, but there is no thin slice available — SC-02's value is only realised once the full evaluation path is in place.
**Wave gate conditions:**
- Wave 1 → Wave 2: SC-01 DoD-complete (H9 meaningfully evaluatable); no other formal gate
- Wave 2 → Wave 3: SC-07, SC-03, SC-06 all DoD-complete; A2 gate (execution-boundary scope excludes run-assurance-gate.js and governance-package.js) confirmed

---

## D3 — SC-02 DoR hard-block: evaluateGate interface contract review

**Date:** 2026-05-24
**Context:** SC-02 refactors `run-assurance-gate.js` to call `governance-package.evaluateGate`. The exact input/output shape of `evaluateGate` for the `structural` gate type is not fully specified in existing documentation.
**Decision:** The `evaluateGate` interface contract (input shape, verdict shape, error contract) must be reviewed with the platform maintainer (Hamis) before SC-02 implementation begins. This is an explicit hard-block in the SC-02 DoR pre-check.
**Rationale:** Writing SC-02 against an assumed interface and then discovering the interface is different creates rework that is more costly than a 30-minute interface review at DoR time. Functional equivalence (AC2) is only verifiable if both parties agree on the expected verdict shape before coding starts.

---

## D4 — SC-03 AC1 slug resolution mechanism (RISK-ACCEPT)

**Date:** 2026-05-24
**Context:** SC-03 review run-2 carried forward MEDIUM 2-M1: AC1 states CI calls `node bin/skills validate --story <story-slug> --ci` for each story in the PR's feature, but does not specify how CI identifies which feature and stories are associated with the PR. The feature slug resolution mechanism is not named in AC1.
**Decision:** RISK-ACCEPT. The intended mechanism is the existing `extractPRSlug` function in `scripts/extract-pr-slug.js`. The test plan for SC-03 will assert that `extractPRSlug` output is used to locate the DoR artefact path before validate is called. No story change required.
**Approved by:** Hamis — 2026-05-24.
