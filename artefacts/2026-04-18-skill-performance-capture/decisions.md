# Decision Log: 2026-04-18-skill-performance-capture

**Feature:** Skill Performance Capture
**Discovery reference:** artefacts/2026-04-18-skill-performance-capture/discovery.md
**Last updated:** 2026-04-18

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M1 (spc.1 AC4 — Category C)
**Decision:** Accept that spc.1 AC4 ("When the outer loop runs, no capture blocks are expected") is not independently testable against spc.1's deliverable alone — it describes runtime behaviour that depends on spc.3 being implemented.
**Alternatives considered:** Rewrite AC4 to describe a purely static assertion about the `context.yml` schema shape (e.g. "When enabled is false, the field value is parseable as boolean false"). That would be independently testable but would narrow the AC to a YAML parsing assertion, losing the behavioural intent.
**Rationale:** The test plan author will scope this AC to what spc.1 can verify independently (schema shape, field presence in `contexts/personal.yml`). The runtime behaviour (no blocks produced when disabled) is the responsibility of spc.3's test plan. Cross-story AC dependencies are acceptable when the dependency is clearly named and the downstream story owns the runtime test. Risk is low; both stories proceed to /test-plan.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the spc.1 test plan cannot produce a meaningful failing test from AC4 alone, rewrite the AC at that stage.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M2 (spc.1 AC3 — Category C)
**Decision:** Accept that spc.1 AC3 ("missing experiment_id is detectable — confirmed by a governance check script in spc.5") defers its verification evidence to a downstream story.
**Alternatives considered:** Rewrite AC3 to assert only that the field is declared in the schema with an explicit type (string/required), making it verifiable by YAML inspection. This loses the "detectable at runtime by the check script" framing but would be independently testable.
**Rationale:** The schema declaration in spc.1 is independently verifiable (field presence and type in `contexts/personal.yml`). The verification by spc.5's script is additional evidence, not the only evidence. Test plan for spc.1 will focus on the YAML template inspection; spc.5's test plan will cover the detection behaviour. The cross-reference is clear and both stories are in scope.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If spc.5 is ever descoped or deferred, AC3 must be rewritten to be self-contained.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M3 (spc.2 Benefit Linkage — Category A)
**Decision:** Accept that spc.2's benefit linkage claims M1 as a metric moved, which is not reflected in the benefit-metric coverage matrix (matrix lists spc.1, spc.3, spc.5 for M1, not spc.2).
**Alternatives considered:** Update the benefit-metric coverage matrix to add spc.2 as an M1 contributor. Update spc.2's linkage to drop M1 and describe its role as "enabling infrastructure" only.
**Rationale:** spc.2 does enable M1 (by defining what "fully populated" means), but the mechanism that produces M1 evidence is spc.3 (instruction that causes blocks to be appended) and spc.5 (script that counts them). The matrix is the authoritative traceability record. The test plan for spc.2 will not write M1 tests — it will focus on template structure. The overclaim in the story benefits section is a documentation gap, not a testability problem.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the test plan author writes M1 tests against spc.2 deliverables, rewrite the benefit linkage to remove the M1 claim.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M4 (spc.2 AC3 — Category C)
**Decision:** Accept that spc.2 AC3 is framed as a runtime comparison scenario ("Given a capture block from one model run and a capture block from a second model run...") rather than a template inspection test.
**Alternatives considered:** Rewrite AC3 to: "Given the capture block template, When I inspect the fields files_referenced, constraints_inferred_count, and backward_references, Then each is declared as a numeric or list type that unambiguously supports delta calculation between two instances — no free-text fields where numeric comparison is expected."
**Rationale:** The static rewrite is the correct test-plan framing. The test plan author will implement AC3 as a template inspection test (are the declared field types unambiguous for numeric comparison?), not as a full experiment run. This is a test-plan concern; the AC intent is sound and the risk of incorrect implementation is low given the operator is also the test plan author.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the test plan cannot verify AC3 without running two actual model experiments, rewrite the AC.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M5 (spc.3 Benefit Linkage — Category A)
**Decision:** Accept that spc.3's benefit linkage only claims M1, while the benefit-metric coverage matrix also assigns spc.3 responsibility for MM1, MM2, and MM3 (the instruction populates files_referenced, constraints_inferred_count, and backward_references fields).
**Alternatives considered:** Update spc.3 benefit linkage to list M1, MM1, MM2, MM3 with individual justifications. Leave as-is and rely on the matrix as the authoritative record.
**Rationale:** The matrix is authoritative. The story's benefit linkage section is supplementary documentation. The test plan for spc.3 will be written against the matrix-authoritative scope, which includes the instruction's responsibility for populating MM1/MM2/MM3 fields. The underreporting is a documentation gap that does not affect testability if the test plan author reads both the story and the matrix.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the /test-plan author asks which metrics spc.3 covers, direct them to the benefit-metric coverage matrix as the authoritative source.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M6 (spc.3 Architecture Constraints — Category E)
**Decision:** Accept that spc.3's Architecture Constraints field does not explicitly state that changes to `copilot-instructions.md` require a PR under the Platform change policy. Record the constraint here and ensure it is named in the DoR artefact's Coding Agent Instructions block.
**Alternatives considered:** Update spc.3's Architecture Constraints field to add the PR requirement. Rely on this decisions log entry + DoR to communicate the constraint to the coding agent.
**Rationale:** Updating the story artefact would require a /review re-run. The constraint is clear and well-understood: `copilot-instructions.md` is a governed platform file; Platform change policy (Phase 2+) requires a PR. The DoR is the correct enforcement point — the Coding Agent Instructions block in the DoR must explicitly state: "Changes to `.github/copilot-instructions.md` must be made via a PR — do not commit directly to master." This note is the authoritative record of that requirement for this feature.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** Always — the DoR for spc.3 must include the PR requirement in the Coding Agent Instructions block. If it is absent, the DoR fails H9.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M7 (spc.4 Benefit Linkage — Category A)
**Decision:** Accept that spc.4 claims MM1/MM2/MM3 as metrics moved, while the benefit-metric coverage matrix does not list spc.4 under any metric row. spc.4 is enabling infrastructure (workspace directory structure and manifest format), not a metric-moving story.
**Alternatives considered:** Update spc.4 benefit linkage to read "Metric moved: None — enabling infrastructure for MM1/MM2/MM3 evaluation". Update the matrix to reflect spc.4 as infrastructure. Leave as-is and rely on the matrix as authoritative.
**Rationale:** The matrix is authoritative. The test plan for spc.4 will be written against the story's ACs (directory structure and manifest format), not against MM1/MM2/MM3 measurement criteria. The overclaim is a documentation gap; the ACs themselves are correctly scoped to the infrastructure deliverable.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the test plan author writes MM1/MM2/MM3 tests against spc.4 deliverables, rewrite the benefit linkage to remove the metric claims.

---
**2026-04-18 | RISK-ACCEPT | /review Run 1**
**Finding:** 1-M8 (spc.4 AC1 — Category C)
**Decision:** Accept that AC1's Given clause is ambiguous between "feature documentation" (undefined location) and "a README in workspace/experiments/" (specific path). Resolve at test-plan time: the deliverable for spc.4 is a `README.md` at `workspace/experiments/README.md` documenting the structure — this is the single authoritative documentation source for AC1.
**Alternatives considered:** Rewrite AC1 before /test-plan to remove the ambiguity. Accept the ambiguity and resolve in the test plan.
**Rationale:** Rewriting requires a /review re-run (minor overhead). The resolution is clear: `workspace/experiments/README.md` is the concrete deliverable. The test plan author will write AC1's verification against inspection of that file. This decision record is the authoritative resolution of the ambiguity.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the DoR author writes spc.4's Coding Agent Instructions without naming `workspace/experiments/README.md` as the concrete deliverable, this decision has not been carried through.

---

---
**2026-04-18 | RISK-ACCEPT | /definition-of-ready spc.1**
**Finding:** DoR-W4-spc.1 — verification script for spc.1 (spc.1-verification.md) has not been reviewed by a domain expert before the story proceeds to implementation.
**Decision:** Accept and proceed. The verification script has 5 scenarios aligned directly to the 5 ACs and their test plan tests. The primary risk (script verifying wrong criteria) is low given the story scope is a single YAML block addition with fully automated unit tests for AC1–AC3 and AC5.
**Alternatives considered:** Pause and request a domain expert review of the verification script before DoR sign-off.
**Rationale:** Medium oversight story — the tech lead review of the DoR artefact before assignment provides a second check on criteria. The verification script scenarios derive directly from the test plan which has already been reviewed. Operator has elected to proceed.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the post-merge smoke test finds the verification script missed a defect, log the gap and update the script before the next experiment run.

---
**2026-04-18 | RISK-ACCEPT | /definition-of-ready spc.2**
**Finding:** DoR-W4-spc.2 — verification script for spc.2 (spc.2-verification.md) has not been reviewed by a domain expert before the story proceeds to implementation.
**Decision:** Accept and proceed. The verification script has 5 scenarios tied directly to the 5 ACs. All scenarios are read-only file inspections of a new Markdown template; risk of incorrect verification criteria is low.
**Alternatives considered:** Pause for domain expert review of the verification script.
**Rationale:** Same reasoning as DoR-W4-spc.1. Medium oversight story. Tech lead review at PR provides a second check. Operator has elected to proceed.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the post-merge smoke test finds the verification script missed a defect, update the script.

---
**2026-04-18 | RISK-ACCEPT | /definition-of-ready spc.3**
**Finding:** DoR-W4-spc.3 — verification script for spc.3 (spc.3-verification.md) has not been reviewed by a domain expert. This story has an elevated W4 risk: Scenarios 4 and 5 (AC2/AC3 manual live-session checks) are novel verification procedures with no prior precedent in this codebase.
**Decision:** Accept and proceed with elevated awareness. The three static scenarios (AC1, AC4, AC5) are standard file inspection checks. Scenarios 4 and 5 include detailed setup steps (enable/disable instrumentation, run a short skill, inspect output). The procedure is clear enough for an operator to follow without additional guidance.
**Alternatives considered:** Request domain expert review specifically of Scenarios 4 and 5 before coding begins. Rewrite Scenarios 4/5 to reduce ambiguity about "short outer loop run" definition.
**Rationale:** The operator is the domain expert for this codebase. The risk that Scenarios 4/5 have incorrect criteria is accepted. If the post-merge live session fails to confirm AC2/AC3, the scenarios can be revised without rewriting the story. Medium oversight story.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the post-merge live session (spc.3-verification.md Scenarios 4/5) produces an unexpected result, review whether the scenario criteria were correct before concluding the implementation is wrong.

---
**2026-04-18 | RISK-ACCEPT | /definition-of-ready spc.4**
**Finding:** DoR-W4-spc.4 — verification script for spc.4 (spc.4-verification.md) has not been reviewed by a domain expert.
**Decision:** Accept and proceed. All 5 scenarios are read-only file inspections of a new README and template. Risk is low; criteria derive directly from story ACs and RISK-ACCEPT 1-M8 (workspace/experiments/README.md as the specific deliverable).
**Alternatives considered:** Pause for domain expert review.
**Rationale:** Same reasoning as DoR-W4-spc.1. Operator has elected to proceed.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the post-merge smoke test finds missed criteria, update the script.

---
**2026-04-18 | RISK-ACCEPT | /definition-of-ready spc.5**
**Finding:** DoR-W4-spc.5 — verification script for spc.5 (spc.5-verification.md) has not been reviewed by a domain expert.
**Decision:** Accept and proceed. Scenarios 1–4 are direct script execution checks against fixture files. Scenario 5 is a package.json inspection. Risk is low; the script under test follows the same pattern as other governance check scripts in scripts/.
**Alternatives considered:** Pause for domain expert review.
**Rationale:** The script follows an established pattern (check-*.js files in scripts/). Operator has elected to proceed.
**Made by:** Hamish (operator direction, 2026-04-18)
**Revisit trigger:** If the post-merge smoke test finds the verification script missed edge cases, update it.

---

## Architecture Decision Records

<!-- No formal ADRs required for this feature at this pipeline stage. Feature-level risk acceptances recorded as log entries above. -->
