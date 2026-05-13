# Discovery: Skills Platform — Phase 1 Foundation

**Status:** Approved
**Created:** 2026-04-09
**Approved by:** Hamish - April 9th 2026
**Author:** Copilot

---

## Problem Statement

Software delivery governance is retrospective and unverifiable. Policy lives in documents and is enforced by humans applying judgement under delivery pressure — with no closed loop between the standard that was supposed to govern a decision and the decision that was actually made. At scale, this produces architectural drift, audit gaps, and governance that is attested rather than evidenced. When AI agents enter the SDLC, the same gap compounds at machine speed: thousands of decisions per hour, each inheriting the same unverified governance context. The skills platform exists to close that loop — encoding delivery standards, quality gates, compliance requirements, and discipline-specific practices as versioned, hash-verified instruction sets that agents execute against, with every governed action producing an auditable trace. The goal is governance that can be demonstrated, not just asserted.

The skills platform prototype has proven the three-agent SDLC governance loop: falsifiable policy criteria, cryptographic prompt hash verification, and an append-only decision trace. Stories S1–S7 are complete with 66 passing tests across unit and integration suites. The core governance pattern is sound. Two known test failures remain open — an S4 unit test compilation failure (missing exports `computeEntryHash` and `detectEntryTampering` from `assurance-validator.ts`) and an S2 integration test AC5 failure (dev agent exit code 2 instead of 0 on a failing-criterion run) — both logged as accepted risks in `decisions.md`.

But the prototype cannot scale. It is single-tenant (operating from one personal GitHub repo), manually operated (the assurance agent runs on demand, not as a CI gate), and platform-coupled (CI logic and tracker calls are hardcoded to specific providers). It is non-distributable: any squad that wants to adopt the skills must fork the repository, which immediately severs their update channel from the platform as it evolves. The platform is not observable — traces exist only locally, with no cross-team registry or drift detection. The harness does not improve itself — failures are fixed manually with no systematic trace analysis or regression anchor. There is no context window management — sessions have no structured checkpoint pattern, relying entirely on compaction.

The result is a working proof of concept that cannot be adopted without forking and cannot be maintained without manual intervention at every failure. The next step is to make the platform distributable, automatable, observable, and self-improving at the foundations — while dogfooding the process using the platform's own pipeline.

---

## Who It Affects

**Platform maintainer** — currently fixes harness failures manually with no improvement loop, no distribution model, and no tooling to detect regression or staleness in the instruction set.

**Dev / engineer (consuming squad)** — cannot consume skills without forking. Once forked, any upstream skill improvement requires a manual pull and conflict resolution. The update channel is severed at fork time.

**Tech lead / squad lead** — no observable governance signal. No CI gate to enforce the assurance loop. No DoR enforcement at the pipeline layer.

**CoP leads and discipline SMEs** — standards for their disciplines are not yet codified in the tiered model. They have no structured entry point for contributing their governance requirements to the platform.

---

## Why Now

The prototype proved the pattern is sound. The next adoption attempt — whether from a second squad or a second project — will result in a fork, creating a divergent copy that cannot receive updates. If that happens before the distribution model exists, the divergence will compound at each update cycle.

The dogfood context is also the safest environment to validate Phase 1 deliverables: the platform team is the consumer, failures are directly visible, and iteration cost is lowest. Building the distribution model, CI gate, and state management infrastructure as the first two squads try to adopt — rather than before they do — creates exactly the adoption friction the platform is designed to remove.

Additionally, `workspace/state.json` and the progressive skill disclosure pattern (P1.1, P1.5) are prerequisites for Phase 2 work: the improvement agent needs a stable state model, a living eval suite, and a watermark gate before it can operate.

---

## MVP Scope

Phase 1 delivers the foundation required for at least two squads to consume the platform without forking, and for the improvement loop to be operational.

**P1.1 — Distribution infrastructure and progressive skill disclosure.** Versioned skill package model. Tribe/squad override model that does not require modifying platform files. `copilot-instructions.md` as the always-on base layer assembled from core + domain + squad layers. On-demand skill loading (`/load skill-name`). Formalised progressive skill disclosure pattern: base layer at session start → discovery skills at story context → implementation skills at implementation start → review/assurance skills at those phases. Phase declaration added as an authoring requirement on every SKILL.md.

**P1.2 — Surface adapter model (foundations).** `execute(surface, context) → result` interface contract between the brain and any delivery surface. Two-path surface type resolution: Path A (EA registry — Phase 2) and Path B (`context.yml` explicit declaration — Phase 1 and permanent). Multi-surface `context.yml` declaration support. DoD criteria variant by surface type. Git-native adapter as the reference implementation.

**P1.3 — Assurance agent as automated CI gate.** CI-triggered assurance agent on PR open/update. `inProgress`→`completed` trace emission during execution. Structural CI gate checks (agent independence audit, trace transition validation, watermark gate). Audit CI gate checks (hash verification against platform registry). Gate verdict and trace hash surfaced in PR.

**P1.4 — Watermark gate.** `workspace/results.tsv` performance tracking file (timestamp, skill-set hash, surface type, eval suite pass rate, full test score, gate verdict). Two-check watermark gate logic: eval suite pass rate ≥ threshold AND full score ≥ best score for this skill/surface combination. Regression alert on score drop below watermark.

**P1.5 — `workspace/state.json` and `workspace/learnings.md`.** Cross-session continuity: structured record written at each phase boundary; new session reads and resumes. Mid-session checkpoint: written at phase boundaries, enabling clean resume after crash or intentional exit. `learnings.md` as a rendered view from `state.json` optimised for the agent's context window. `/checkpoint` is a documented operator convention (not a standalone SKILL.md): the 75% context threshold and clean-exit pattern are documented in `copilot-instructions.md` and the operating model; each phase-boundary skill already handles writing state and exiting cleanly when invoked at any point. Phase boundary ownership table implemented across all phase skills.

**P1.6 — Living eval regression suite (`workspace/suite.json`).** Living regression suite with entries covering: task ID, description, skill/surface combination, expected outcome, failure pattern guarded against. Suite growth mechanic: new failure pattern triggers proposed addition; platform team reviews and merges. Regression guarantee: a scenario once added must pass on every subsequent assurance gate run.

**P1.7 — Standards model — Phase 1 disciplines.** Three anchor disciplines at core tier: software engineering, security engineering, quality assurance. `standards/index.yml` routing table, adopting the schema illustrated in `ref-skills-platform-standards-model.md` (`disciplines:` → `core:`, `policy-floor:`, `surface-variants:`) as the Phase 1 starting point — treated as provisional and logged as a decision; the schema must be extensible to accommodate 8 additional disciplines and domain-tier entries in Phase 2 without a breaking change. POLICY.md floor pattern. Composition model: core → domain extension → squad specification → POLICY.md validation → injected as one composed standards document.

**P1.8 — Model risk documentation.** `MODEL-RISK.md` present and auditable before the platform is used beyond the dogfood context.

---

## Out of Scope

- **Phase 2 deliverables** — improvement agent (P2.2), full platform adapter model for non-git surfaces (P2.1), cross-team observability and drift detection (P2.3), remaining 8 discipline standards beyond the 3 anchor disciplines (P2.4), estimation calibration loop (P2.5). These are explicitly Phase 2 work and must not creep into Phase 1 stories.
- **EA registry integration (Path A surface type resolution)** — the EA registry query at Phase A start is a Phase 2 deliverable. Phase 1 delivers Path B (`context.yml` declaration) as the sole live path. Path A design constraints must not be foreclosed by Phase 1 decisions, but no registry integration is delivered.
- **Challenger pre-check automation** — requires the Phase 2 improvement agent and inter-session orchestration not available in the current Copilot Agent runtime. Phase 2 delivers a human-assisted pre-check; full automation is Phase 3.
- **Cross-team trace registry** — Phase 3. Phase 1 designs the queryable `workspace/traces/` interface to be promotable without schema changes; it does not implement the cross-team layer.
- **Adapter implementations for non-git surfaces** — IaC, SaaS-API, SaaS-GUI, M365-admin, manual adapters are Phase 2. Phase 1 establishes the interface only.
- **Agent identity layer** — Phase 4. Phase 1 records the skill-set hash in the trace; full cryptographic agent identity is deferred.
- **Phase 3 and Phase 4 strategic horizon deliverables** — autoresearch at enterprise scale, policy lifecycle management, adaptive governance, Azure AI Foundry runtime assessment.

---

## Assumptions and Risks

**Progressive skill disclosure depends on human authoring discipline.** The phase declaration requirement on every SKILL.md is enforced by PR review, not structurally. With 34 skills, authoring drift is likely. A skill that loads eagerly at session start rather than on-demand breaks the pattern without triggering any automated alert. The net context saving may be less than the pattern implies until enforcement is systematic.

**Checkpoint write is unreliable at high context pressure.** The write that matters most — at a session approaching its limit — is also the least likely to complete successfully. The 75% threshold for the `/checkpoint` override must be treated as a hard exit, not a warning level. Phase 1 cannot fully mitigate this; it is a documented operational risk.

**Three-agent independence is procedural, not structural.** The CI gate validates trace structure, not that the traces were produced in genuinely independent sessions. In a VS Code + Copilot Agent mode environment, all three agents are run by the same human in the same tooling. Nothing technically prevents running all three in one session. Independence is the operator's decision to start a new session.

**Hash verification is an audit signal, not tamper prevention.** The real protection is branch protection and required PR reviews. A hash mismatch warrants investigation; it does not prevent a determined actor with repo write access from making a change.

**Anti-overfitting gate is self-assessed.** The improvement agent (Phase 2) applies the self-reflection gate to its own proposals. A model that has drifted toward rubric-gaming will answer "yes" correctly even for rubric-specific changes. The human reviewer must apply the diagnostic test independently using the PR template checklist.

**Token budget may constrain delivery pace.** Dogfooding at GitHub Copilot Pro+ (~1,500 requests/month) puts Phase 1+2 at approximately 26 weeks at moderate pace. Sustained context pressure or large assurance gate runs could exhaust the budget faster.

**Copilot Agent mode inter-session limitation.** One session cannot spawn another session. The challenger pre-check in Phase 2 requires a human-assisted step rather than full automation. Phase 1 must not design Phase 2 structures that assume automated inter-session orchestration.

---

## Directional Success Indicators

- A platform maintainer (this repo, dogfood context) can run the full outer loop — discovery through DoR — for a new story in a single session, without platform team assistance, resuming cleanly from `workspace/state.json` across sessions.
- At least one story completes the full inner loop with a valid CI-triggered assurance gate, producing a `inProgress`→`completed` trace visible in the PR without opening a separate tool.
- Three anchor discipline standards are live, composable, and injected correctly into at least one inner loop story.
- The living eval suite (`workspace/suite.json`) has at least one scenario per core skill, with at least one regression caught and surfaced by the watermark gate before human review.
- A consuming squad can load skills from the versioned package without forking the platform repository and without losing the update channel.
- `MODEL-RISK.md` exists, is complete, and has been reviewed before any non-dogfood adoption.

---

## Constraints

**Solo delivery, dogfood context.** One engineer. This is a feature of the dogfood pattern — validation that sole adoption is viable — but it means no parallel workstream execution and no second reviewer available for all decisions.

**GitHub Copilot Pro+ token budget.** Approximately 1,500 requests/month. Phase 1+2 estimated at ~26 weeks at moderate pace. Large context runs (full assurance gate, large implementation plan) must be scoped to stay within this.

**No persistent agent runtime.** The platform must operate on standard CI/CD infrastructure. No hosted agent service, persistent message queue, or proprietary orchestration platform. (Product constraint #11.)

**GitHub Actions for Phase 1 dogfood.** The Phase 1 dogfood context uses GitHub Actions for CI gate implementation (P1.3) and distribution trigger (P1.1). The requirement to document a Bitbucket Pipelines equivalent is deferred to Phase 2 — authoring untested Bitbucket configuration without a live Bitbucket environment produces unreliable documentation. The platform-neutral portability constraint is reinstated as a concrete, testable requirement when enterprise Bitbucket becomes the delivery target. See decisions.md SCOPE entry 2026-04-10.

**Credentials are structural — never in the agent's environment.** PAT and OAuth tokens must live in a secrets store. The agent never handles a credential directly. The `context.yml` MCP section references secret names, not values. (Product constraint #12.)

**Copilot Agent mode inter-session constraint.** One session cannot spawn another. Any Phase 1 design that would require the inner loop to orchestrate sessions programmatically must be replaced with a human-assisted step.

**Update channel integrity.** Any distribution model that requires a squad to fork the platform repository is not a valid solution. The update channel must survive squad customisation intact. (Product constraint #1.)

**Repository context — two repos, two roles.** Phase 1 work spans two repositories. This repository (`heymishy/skills-repo`) is the platform: the SKILL.md library, templates, pipeline artefacts, and governance instruction sets. The prototype (`heymishy/agentic-dev`, local path `C:\Users\Hamis\code\agentic dev loop 30-03-2026`) is the TypeScript three-agent loop reference implementation — the working proof of concept that Phase 1 builds on top of. Phase 1 deliverables (P1.1–P1.8) are changes to this skills-repo. The prototype is a stable reference; it is not the delivery target.

---

**Feature slug:** `2026-04-09-skills-platform-phase1`
**Artefacts path:** `artefacts/2026-04-09-skills-platform-phase1/`

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

2026-04-09 — Clarified via /clarify:
- Q: Is `/checkpoint` a new standalone SKILL.md or a documented operator convention? A: Convention, not a skill — the 75% threshold and clean-exit pattern are documented in `copilot-instructions.md` and the operating model; each phase-boundary skill handles writing state and exiting cleanly; no new SKILL.md needed. P1.5 updated accordingly.
- Q: Is the `standards/index.yml` schema already decided or does it need design as part of P1.7? A: Adopt the reference doc example as the Phase 1 starting point, treated as provisional; schema must be extensible for Phase 2 (8 more disciplines, domain-tier entries) without a breaking change. P1.7 updated accordingly; schema decision to be logged in decisions.md.

2026-04-09 — Prototype audit against `C:\Users\Hamis\code\agentic dev loop 30-03-2026`:
- Verified: three-agent loop, TypeScript, S1–S7 merged, Docker queue board, SHA-256 trace hash. All consistent with reference documents.
- Corrected: problem statement updated from "S1–S5, 57+ tests" to "S1–S7, 66 passing tests".
- Found: 2 open test failures (S4 unit compilation gap, S2 integration AC5 exit-code mismatch). Both logged as RISK-ACCEPT in decisions.md — not runtime governance failures, must be resolved before P1.3 DoR.
- Added: repository context constraint identifying the two-repo structure (skills-repo = platform; agentic-dev = prototype reference implementation).
