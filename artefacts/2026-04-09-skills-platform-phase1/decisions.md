# Decision Log: 2026-04-09-skills-platform-phase1

**Feature:** Skills Platform — Phase 1 Foundation
**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Last updated:** 2026-04-09

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
**2026-04-09 | ASSUMPTION | discovery/clarify**
**Decision:** Adopt the `standards/index.yml` schema illustrated in `ref-skills-platform-standards-model.md` (`disciplines:` → `core:`, `policy-floor:`, `surface-variants:`) as the Phase 1 starting point, treated as provisional.
**Alternatives considered:** (A) Treat as final — foreclosed Phase 2 extensibility. (B) Design new schema from scratch as a task within P1.7 — slower, no upside over using the reference example as a starting point.
**Rationale:** The reference example is well-formed and covers the Phase 1 disciplines. Treating it as provisional with an explicit extensibility constraint is cheaper than a design task and honest about its status. The constraint — Phase 2 must be addable without a breaking schema change — is what matters, not whether the initial schema is "final".
**Made by:** Hamish, 2026-04-09
**Revisit trigger:** If Phase 2 discipline requirements (8 additional disciplines + domain-tier entries) cannot be accommodated without a breaking change to the Phase 1 schema. Revisit during P2.4 story decomposition.
---

---
**2026-04-09 | RISK-ACCEPT | discovery**
**Decision:** Accept the open S4 unit test compilation failure in the prototype (`assurance-validator.ts` does not export `computeEntryHash` or `detectEntryTampering`; the S4 unit test suite fails to compile against the current implementation). Phase 1 proceeds without fixing this first.
**Alternatives considered:** Fix before proceeding — adds scope and delay before Phase 1 planning is complete; the failure is in the test layer, not the runtime governance logic, which still operates correctly.
**Rationale:** The failure is a test/implementation sync gap introduced during S4 evolution, not a runtime fault in the assurance loop itself. The three-agent loop and hash verification operate correctly. The risk is limited to test coverage of `computeEntryHash` — not to the governance output. Phase 1 (P1.3 assurance CI gate) will need to resolve this before the assurance agent stories can be marked DoD-complete.
**Made by:** Hamish, 2026-04-09
**Revisit trigger:** Must be resolved before any Phase 1 story that builds on `assurance-validator.ts` passes DoR. Non-negotiable blocker at that point — not a permanent acceptance.
---

---
**2026-04-09 | RISK-ACCEPT | discovery**
**Decision:** Accept the open S2 integration test AC5 failure (`dev-agent-trace` integration test — dev agent exits with code 2 instead of 0 on a failing-criterion run; task expected to stay in inbox but exit code check fails).
**Alternatives considered:** Fix before proceeding — same as above; the failure does not affect the discovery or planning work.
**Rationale:** AC5 tests the failure path of the dev agent (task stays in inbox when criterion fails). The happy-path behaviour is confirmed passing. The AC5 failure is an exit-code contract mismatch, likely introduced during S7 changes. It does not affect the governance trace output or the assurance loop verdict. Must be resolved before P1.3 CI gate work reaches DoR.
**Made by:** Hamish, 2026-04-09
**Revisit trigger:** Must be resolved before P1.3 stories pass DoR. Non-negotiable blocker at that point.
---

---
**2026-04-09 | SCOPE | review-pre-check**
**Decision:** Remove Epic 1 (Prototype Test Suite Stabilisation) and its two stories (`prototype-fix-s4-compilation`, `prototype-fix-s2-exit-code`) from the Phase 1 plan. Mark files as VOID.
**Alternatives considered:** (A) Keep Epic 1 — would require fixing prototype failures that have no bearing on the skills repo's own test suite. Busywork with no metric trace. (B) Reframe Epic 1 as skills-repo stabilisation — there is no analogous failure in the skills repo; the epic has no valid target.
**Rationale:** P1.3 (assurance CI gate) targets the skills repo, not the prototype repo. The platform is dogfooding itself — the CI gate runs on skills repo PRs (SKILL.md changes, new skills, standards updates). The prototype is a proof-of-concept that validated the three-agent pattern; it is not the governed artefact. The prototype's S4 compilation failure and S2 exit code failure have zero impact on the skills repo's test suite or on P1.3 delivery. The two RISK-ACCEPT entries in decisions.md were recorded correctly at discovery time against the prototype context, but the definition phase should have validated the dependency chain before writing the stories. Both RISK-ACCEPTs remain valid as prototype-context records; they are not resolved — they are superseded as P1.3 prerequisites.
**Made by:** Hamish, 2026-04-09
**Revisit trigger:** Not applicable — Epic 1 is void.
---

---
**2026-04-09 | ARCH | benefit-metric**
**Decision:** The `standardsInjected` array in the delivery trace is populated by the assurance agent at gate time, not by the dev agent at execution time.
**Alternatives considered:** (A) Dev agent self-reports: records which standards governed its execution at runtime. Rejected — the dev agent is the governed party; it cannot be the verifier of its own governance context. Self-reporting erodes the independence property the assurance loop exists to provide. (B) Assurance agent populates at gate time: the independent verifier records what standards were in effect at the commit SHA of the PR. Consistent with the assurance agent's role.
**Rationale:** The assurance agent is the independent verifier. Having it record what standards were in effect — at gate time, at the PR's commit SHA — is consistent with its role and preserves the independence property. In a single-PR inner loop the hashes will be identical either way, but the design principle matters for the trace schema and for Phase 2 when sessions may span commits.
**Made by:** Hamish, 2026-04-09
**Revisit trigger:** If the assurance agent cannot access the standards files at gate time in a given CI environment (e.g. a shallow clone). Revisit at P1.3 story decomposition.
---

---
**2026-04-10 | ARCH | p1.1 distribution model — pull model chosen**
**Decision:** Pull model chosen for skills distribution. Squad engineers run `bash scripts/assemble-copilot-instructions.sh` locally to regenerate their `copilot-instructions.md` from a versioned skills-repo reference. No CI scheduler required. No squad merge action required — regeneration is a deliberate operator action, not an automated push.
**Alternatives considered:** (A) Push model — skills-repo CI pushes assembled context to consuming squad repos on each commit. Rejected: requires write access to all consuming squad repos, introduces a CI scheduler dependency, and creates a hard coupling between skills-repo CI health and squad repo updates. (B) Pull model — squad runs the assembly script locally; update is available at the next session open. Chosen: no cross-repo write access required, no CI scheduler, consistent with the existing `install.sh` pull pattern already in this repo.
**Rationale:** Both models satisfy M1 (update channel latency). Pull model (≤ one session open) meets the target SLA and requires zero infrastructure beyond a local shell. It also eliminates the push model's security concern (no write tokens in CI for external repos). The dogfood context (GitHub Actions, single operator) makes the pull model the natural choice. No squad merge step is required — the squad engineer runs the script and the assembled file is updated in their working copy.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If a consuming squad requires fully automated updates with no operator action (e.g. enterprise onboarding at scale). At that point revisit push model as a Phase 2 distribution option.
---

---
**2026-04-10 | RISK-ACCEPT | review finding 1-M1 — p1.5**
**Decision:** Accept AC3 in p1.5 (workspace/state.json session continuity) as compound. The test plan author will split it into AC3a, AC3b, and AC3c in the test spec. The story file is not updated.
**Alternatives considered:** Split AC3 in the story file now — adds noise to the story without changing the deliverable; the story is already approved and the compound structure is clear enough for a human reader.
**Rationale:** Splitting at the story layer is cosmetic and risks review churn. The test plan is the correct layer for AC decomposition — that is where executable assertions are defined. The intent of AC3 is unambiguous; splitting it there is the right mechanical action.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If test plan author cannot cleanly decompose AC3 into three independent assertions, revisit the AC at that stage.
---

---
**2026-04-10 | SCOPE | review finding 1-M2 — p1.5**
**Decision:** Defer the `learnings.md` rendered view from p1.5 (workspace/state.json session continuity) MVP scope. The render layer for `learnings.md` is not implemented as part of p1.5.
**Alternatives considered:** Include in p1.5 scope — premature; the content model needs to stabilise through actual Phase 1 usage before investing in a render layer. The deferral allows learnings signal to accumulate before the display format is locked.
**Rationale:** Scope reduction from discovery MVP on grounds of sequencing. `workspace/learnings.md` is a human-readable log at Phase 1; a render layer adds value only once the signal format stabilises from real usage. No metric is impacted — MM3 (/checkpoint fidelity) measures write completeness, not presentation. Confirmed no metric impact.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** Phase 2 — once learnings signal format has stabilised through Phase 1 delivery. Candidate for P2 backlog.
---

---
**2026-04-10 | DESIGN | review finding 1-M3 — p1.2**
**Decision:** AC4 and AC5 in p1.2 (surface adapter model foundations) are verifiable by code review only, not by executable test. Both ACs are annotated with `[Verification: code review]` in the story file. The test plan will include a design review step rather than an executable test assertion for these two ACs.
**Alternatives considered:** (A) Write executable tests — not feasible without a mock EA registry or future Phase 2 adapters that don't yet exist; any executable test would be a fabrication of the future state, not a validation of the current design. (B) Remove the ACs — they encode important extensibility constraints that must be verified at some point; removing them eliminates the verification requirement entirely.
**Rationale:** AC4 and AC5 test interface extensibility and future-compatibility properties — they can only be evaluated by reading the design, not by running it. Code review is the correct verification mechanism for this class of AC. Annotating them is more honest than writing a nominal executable test that does not actually validate the property.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If Phase 2 adds Path A (EA registry) or a second surface adapter — at that point AC4 and AC5 can be verified against a real implementation and the code-review annotation can be retired.
---

---
**2026-04-10 | SCOPE | review finding 1-M4 — p1.8**
**Decision:** AC5 in p1.8 (MODEL-RISK.md) is reworded to test the artefact state rather than the future adoption event. Original: "when the platform is made available to a second squad… then the squad tech lead is directed to MODEL-RISK.md." Revised: "when the onboarding documentation for the platform is reviewed, then MODEL-RISK.md is listed as a required pre-read in that documentation — not an optional reference."
**Alternatives considered:** (A) Move AC5 to an adoption checklist outside the story — the requirement is real and belongs somewhere; removing it from the story scope entirely risks it being dropped. (B) Keep AC5 as-is and mark it as post-DoD — creates an uncloseable story AC; DoD cannot be signed without a verifiable AC. (C) Reword to test the artefact — the deliverable is the onboarding documentation that references MODEL-RISK.md; that is testable at DoD without waiting for a second squad to exist.
**Rationale:** The verifiable deliverable is the onboarding documentation content, not the adoption event. Rewording focuses the AC on what is within the story's control and verifiable at the time of DoD. The intent is preserved: any adopter encountering the platform must be directed to MODEL-RISK.md before using it. The story file is updated before /test-plan.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** Not applicable — intent is preserved in the reworded AC.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.5 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.5. The verification script has not been reviewed by an independent domain expert. Accepted on grounds that all six scenarios were derived directly from story ACs by the same operator who authored the story and test plan; agent and operator constitute the same single-person team in this dogfood context. Risk is accepted rather than resolved.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." In a solo operator context `roles.qa: "me"`, independent domain review is structurally unavailable. The verification script covers observable, concrete behaviours (session start output, file content, timing) that are low-regret to re-evaluate if gaps emerge post-merge.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC1 or AC3a fails during MM2/MM3 measurement — revisit verification script for that scenario before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.4 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.4. Same structural rationale as p1.5 and p1.3 W4 RISK-ACCEPTs (solo operator context, `roles.qa: "me"`). Scenario 5 (controlled acceptance test) is the most operationally sensitive check — it requires a git commit/revert cycle against the live suite. This will be observed directly during the M4 dogfood measurement run.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." No independent domain expert available in solo operator context.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If scenario 5 fails during M4 acceptance test — revisit verification script before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.3 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.3. Same structural rationale as p1.5 W4 RISK-ACCEPT (solo operator context, `roles.qa: "me"`). Additional note: scenarios 1 and 4 depend on live CI/GitHub PR behaviour — the most operationally novel checks in the feature set. These will be observed directly during the MM2/M2 dogfood measurement run, which constitutes the de facto domain review.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." No independent domain expert available in solo operator context.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC1 or AC4 fails during M2 acceptance test — revisit verification script Scenarios 1 and 4 before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.1 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.1. The verification script has not been reviewed by an independent domain expert. Accepted on the same structural grounds as p1.3, p1.4, and p1.5 W4 RISK-ACCEPTs: solo operator context, `roles.qa: "me"`, independent review structurally unavailable.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." Scenarios 2a/b/c and 6 (AC2 and AC6) require a live distribution cycle and are the most operationally novel checks in p1.1. These will be observed directly as part of the M1 dogfood measurement run, which constitutes the de facto domain review for this story.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC2 or AC6 fails during M1 acceptance test — revisit verification script scenarios 2a/b/c and 6 before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.2 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.2. The verification script has not been reviewed by an independent domain expert. Same structural rationale as p1.1, p1.3, p1.4, and p1.5 W4 RISK-ACCEPTs: solo operator context, `roles.qa: "me"`, independent review structurally unavailable.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." Scenarios 4 and 5 are design-review steps for AC4/AC5 extensibility properties — they require a developer reading the interface definition. In solo operator context this is self-review at DoD, which constitutes the available review mechanism.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC4 or AC5 design review fails at DoD (i.e. interface shape forecloses extensibility) — revisit interface design before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.6 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.6. The verification script has not been reviewed by an independent domain expert. Same structural rationale as all prior W4 RISK-ACCEPTs in this feature: solo operator context, `roles.qa: "me"`, independent review structurally unavailable.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." The most operationally novel scenarios in p1.6 are AC5 (M4 controlled acceptance test — dependency-blocked on p1.4 DoD) and AC6 (outcome-orientation diagnostic — human review at DoD time). Both will be observed directly during the M4 dogfood measurement run and P1.6 DoD review, which constitute the de facto domain review.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC5 fails during M4 acceptance test, or AC6 diagnostic reveals workaround-oriented scenarios — revisit verification script and suite authoring before marking DoD.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.7 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.7. The verification script has not been reviewed by an independent domain expert. Same structural rationale as all prior W4 RISK-ACCEPTs in this feature: solo operator context, `roles.qa: "me"`, independent review structurally unavailable.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." The most operationally sensitive manual checks in p1.7 are AC6 (outcome-orientation diagnostic on standards requirements) and the AC4/AC5 joint acceptance tests (hash recomputation) scheduled after P1.3 DoD. Both will be observed directly during the M3/T3M1 dogfood measurement run, which constitutes the de facto domain review.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If AC6 diagnostic reveals workaround-oriented requirements in the standards files, or if AC5 hash recomputation fails — revisit standards file authoring before marking DoD.
---

---
**2026-04-10 | SCOPE | Phase 1 platform-neutral CI constraint**
**Decision:** Defer the Bitbucket Pipelines equivalent documentation requirement from Phase 1 to Phase 2. Phase 1 CI gate (P1.3) and distribution trigger (P1.1) are implemented using GitHub Actions for the dogfood context only — no Bitbucket equivalent is authored, required, or tested as a Phase 1 AC. AC6 is removed from P1.3; the Bitbucket equivalent clause is removed from P1.1 and P1.3 Architecture Constraints and from discovery.md.
**Alternatives considered:** (A) Keep the Bitbucket equivalent requirement as written — authoring Bitbucket YAML in a dogfood context where no Bitbucket environment is available produces untestable documentation; quality and correctness cannot be verified. (B) Write a "best effort" Bitbucket section without testing — indistinguishable from a placeholder and creates false assurance with no real validation path.
**Rationale:** Untestable documentation written against a platform not available in the dogfood context is unreliable. A Bitbucket equivalent authored without a live Bitbucket environment to run it against is informed speculation, not verified configuration. The platform-neutral portability principle remains valid and important; the constraint is reinstated as a concrete, testable requirement when the enterprise Bitbucket target environment is available.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** When enterprise Bitbucket Pipelines becomes the delivery target (expected Phase 2 or Phase 3 depending on enterprise onboarding timeline). At that point: reinstate AC6 in P1.3, add a Bitbucket equivalent clause back into P1.1 Architecture Constraints, and author both against a live Bitbucket environment.
---

---
**2026-04-10 | RISK-ACCEPT | DoR W4 — p1.8 verification script not reviewed by independent domain expert**
**Decision:** Accept the W4 warning for p1.8. The verification script has not been reviewed by an independent domain expert. Same structural rationale as all prior W4 RISK-ACCEPTs in this feature: solo operator context, `roles.qa: "me"`, independent review structurally unavailable.
**Rationale:** "Mechanisms validated through live dogfood observation during outer loop sessions 2026-04-10." The most operationally sensitive manual checks in p1.8 are Scenario 3 (AC3: T3M1 evidence record completeness — dependency-gated on P1.3 + P1.7 DoD-complete and a real trace existing) and Scenario 4 (AC4: sign-off record sign-off action at DoD). Both will be observed directly during the T3M1/MM1 dogfood measurement run, which constitutes the de facto domain review.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If Scenario 3 (T3M1 evidence record) fails when evaluated against the first real inner loop trace, or if AC4 sign-off record is structurally incomplete at DoD — revisit verification script and MODEL-RISK.md authoring before marking DoD.
---
