# Decision Log: 2026-04-09-skills-platform-phase1

**Feature:** Skills Platform — Phase 1 Foundation
**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Last updated:** 2026-04-11 (Bitbucket environment ASSUMPTION added)

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

---
**2026-04-10 | ARCH | p1.1 distribution mechanism**
**Decision:** Adopt the pull model for skills distribution. Squad runs the assembly script locally (or during repo setup) to pull the platform layer from the skills-repo and generate `copilot-instructions.md`. No CI scheduler is required. No squad merge action is required.
**Alternatives considered:** (A) Push model — platform CI publishes new versions to consuming squad repos via automated PRs or direct commits. Rejected: requires CI credentials scoped to external repos, adds a scheduler dependency, and creates merge noise in squad repos whenever the platform updates. (B) Pull model (chosen) — squad explicitly runs the assembly script to fetch the latest platform layer and regenerate the assembled file locally.
**Rationale:** Simpler to implement and consistent with the existing `scripts/sync-from-upstream.sh` pattern already in the repo. No credentials required for CI jobs. The assembly script is a single-step operation that squads run at setup time or when they want a platform update. Satisfies M1 (assembled `copilot-instructions.md` present within one session) without any external scheduling dependency. The dogfood context (`heymishy/skills-repo`, `ci: github-actions`) has no multi-squad coordination requirement that would favour push.
**Made by:** Hamish, 2026-04-10
**Revisit trigger:** If Phase 2 introduces a multi-squad operator model where platform updates must propagate to 10+ repos simultaneously — reconsider push model with a dedicated platform CI job and PAT-scoped credentials strategy.
---

---
**2026-04-11 | ASSUMPTION | Phase 2 pre-discovery**
**Decision:** GitHub Actions is the only validated and in-scope CI surface for Phase 2 planning. Bitbucket Pipelines remains deferred (per the 2026-04-10 SCOPE decision on platform-neutral CI). Any Phase 2 story that references CI topology assumes GitHub Actions as the sole target until the enterprise Bitbucket environment is confirmed available.
**Alternatives considered:** (A) Treat Bitbucket as a Phase 2 target alongside GitHub Actions — no Bitbucket environment confirmed; writing against an unconfirmed target produces untestable stories (documented as anti-pattern 2026-04-10). (B) Treat CI topology as undecided — creates ambiguity in every Phase 2 story that touches CI; worse than an explicit scoped assumption.
**Rationale:** The Bitbucket deferral SCOPE decision (2026-04-10) already removed Bitbucket from Phase 1 on testability grounds. That rationale extends to Phase 2 until the target environment is confirmed. Recording this as an explicit ASSUMPTION before Phase 2 discovery prevents the CI topology question from being re-litigated story by story. Phase 2 discovery opening question: is the enterprise Bitbucket Pipelines environment now available? If yes, this assumption is superseded; if no, it remains in force.
**Made by:** Hamish, 2026-04-11
**Revisit trigger:** At Phase 2 discovery kick-off — ask operator whether a Bitbucket Pipelines environment is available and whether it is in scope for Phase 2. If confirmed in scope, log a superseding ASSUMPTION entry and reinstate the platform-neutral CI constraint deferred from Phase 1.
---

---
**2026-04-11 | ARCH | Phase 2 pre-discovery**
**Decision:** Agent instructions file format is an adapter concern resolved by `context.yml`, not a fixed platform output. The assembly script emits `.github/copilot-instructions.md` for GitHub-hosted environments and `AGENTS.md` for non-GitHub environments (Bitbucket/Jenkins). Content is identical; format is driven by `vcs.type` in `context.yml`.
**Alternatives considered:** Always emit `copilot-instructions.md` — forecloses non-GitHub inner loop tooling; not viable for enterprise fleet distribution.
**Rationale:** `AGENTS.md` is the vendor-neutral standard now under Linux Foundation AAIF governance. Any inner loop tooling (Copilot, Claude Code, Cursor, Codex) can consume it. The three-tier skill content is format-agnostic; the assembly script is the correct abstraction point.
**Made by:** Hamish, 2026-04-11
**Revisit trigger:** At Phase 2 p1.1-equivalent story (distribution mechanism) — add `agent_instructions.format` adapter to `context.yml` and update assembly script to branch on `vcs.type`.
---

---
**2026-04-11 | SCOPE | Phase 1 /levelup**
**Decision:** Defer the following Phase 1 pipeline evolution candidates to a Phase 2 deliberate evolution cycle. They require changes to skill files or artefact templates and must go through the full pipeline process (discovery → definition → DoR → coded PR), not a direct edit during /levelup.

**Batch: Phase 1 pipeline evolution — deferred to Phase 2**

| # | Item | Target | Source |
|---|------|--------|--------|
| D1 | `/definition`: add 3-question dependency chain validation before writing any prerequisite story | `.github/skills/definition/SKILL.md` | Phase 1 `workspace/learnings.md` |
| D2 | `/definition`: add testability-filter check — before writing any AC/constraint requiring an external environment, verify it is testable in the delivery context | `.github/skills/definition/SKILL.md` | Phase 1 `workspace/learnings.md` |
| D3 | `/definition`: add explicit learnings-write step to skill exit sequence | `.github/skills/definition/SKILL.md` | Phase 1 `workspace/learnings.md` |
| D4 | `/review`: change state-write instruction from post-run batch to incremental-write-per-story (write state before loading the next story) | `.github/skills/review/SKILL.md` | Phase 1 `workspace/learnings.md` |
| D7 | DoD template: add "cross-story runtime failure" as a named observation type in the Observations section | `.github/templates/definition-of-done.md` | p1.6 DoD Obs 3 + `workspace/learnings.md` |
| D8 | DoR skill / template: consuming story must document exact field names and types required from any file written by another story, in the DoR contract | `.github/skills/definition-of-ready/SKILL.md` | p1.6 learnings entry — cross-story schema dependency |
| D9 | DoD template: add a "verification prompt" field — a canned prompt the operator can run in a second session to spot-check the DoD output | `.github/templates/definition-of-done.md` | Phase 1 `workspace/learnings.md` |
| B1-enforce | DoR / branch-setup: add a check that `NFR-[story-id]-*` guardrail entries exist in `pipeline-state.json` before the branch is considered set up. The `standards/quality-assurance/core.md` MUST now exists; this is the skill-side enforcement companion. | `.github/skills/definition-of-ready/SKILL.md` or DoR contract template | Phase 1: p1.3 delivered with no NFR-p1.3-* entries in pipeline-state.json; B1 standard written 2026-04-11 |

**Entry condition for Phase 2 evolution cycle:** Treat this log entry as the canonical list of pipeline debt inherited from Phase 1. Each item requires its own story with a test plan before implementation. Suggested grouping: D1/D2/D3 → one `/definition` improvement story; D4 → one `/review` improvement story; D7/D8/D9 + B1-enforce → one template/DoR improvement story.
**Made by:** Hamish, 2026-04-11 (via Phase 1 /levelup pattern extraction)
**Revisit trigger:** Phase 2 pipeline evolution story planning kick-off.
---

---
**2026-04-11 | ASSUMPTION | Phase 2 pre-discovery**
**Decision:** For Phase 2 CI gate adapter stories, two Bitbucket deployment models are treated as distinct testing targets: (1) Bitbucket Cloud — adequate for YAML syntax validation and pipeline-shape tests; available today via a free tier trial account. (2) Bitbucket Data Center (self-hosted, Docker) — required for full auth topology tests (app passwords, OAuth, SSH key validation) that differ structurally from Cloud. Docker-based DC is the recommended local validation path for story ACs that depend on real credential resolution. Phase 2 planning treats these as two separate environment tiers, not interchangeable.
**Alternatives considered:** (A) Cloud-only — validates YAML structure and basic run behaviour but cannot test auth topology differences (app passwords vs OAuth 2.0 vs SSH); deferred ACs would remain perpetually unvalidated. (B) DC self-hosted on shared infra — blocks on IT provisioning; not unblockable before Phase 2 kicks off. (C) Treat both as equivalent — records a false assumption; auth flows differ between Cloud and DC and any story that conflates them will produce a broken integration.
**Rationale:** The split approach (Cloud for syntax/shape, Docker DC for auth/topology) lets Phase 2 write testable ACs against environment tiers that are actually available rather than deferring all Bitbucket work to an unconfirmed shared environment. Docker DC can be stood up locally with no IT dependency — it is the correct unblocking path for auth-dependent ACs. This assumption supersedes the blanket Bitbucket-deferred assumption only for the Cloud/syntax-validation tier; the full enterprise Data Center environment remains deferred until confirmed.
**Made by:** Hamish, 2026-04-11
**Revisit trigger:** At Phase 2 CI gate adapter story planning — confirm Docker DC is available locally and record the specific Bitbucket DC version and auth topology variants to be tested. If a shared DC environment is confirmed available before that point, log a superseding ASSUMPTION entry and remove the Docker-only constraint.
---
