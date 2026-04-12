# Reference: Skills Platform — Phase 3 Discovery Reference

**Document type:** Discovery reference material — primary Phase 3 input
**Drop into:** `artefacts/2026-04-11-skills-platform-phase2/reference/`
**Last updated:** 2026-04-12
**Based on:** `artefacts/2026-04-09-skills-platform-phase1/reference/ref-skills-platform-phase3-4.md` (Phase 3 section only — Phase 4 content excluded from this document)

> **Note for the discovery skill:** This is the primary input for Phase 3 /discovery. Stories should be generated from this document. It incorporates Phase 1 and Phase 2 confirmed delivery actuals, open gaps, and eight governance-hardening amendments arising from an adversarial audit review conducted 2026-04-12. All amendments are integrated into the prose — they are not appended as a separate section. The original Phase 4 content is preserved in `ref-skills-platform-phase3-4.md` and is not reproduced here.

---

## Entry conditions

Phase 3 begins when the following are all true:

- Phase 2 stable: all 13 Phase 2 stories DoD-complete and merged to master.
- Improvement agent operational: p2.11 (improvement-agent trace proposals) and p2.12 (challenger skill) DoD-complete.
- Fleet registry delivered: p2.7 (fleet registry CI aggregation) DoD-complete.
- At least 6 trace files committed to `workspace/traces/` on master from real inner loop runs.
- ADR-001 through ADR-006 all active and recorded in the feature decision log.
- **T3M1 independent validation complete:** at least one T3M1 evaluation conducted by a genuine non-engineering reviewer outside the platform engineering reporting line, answering all 8 audit questions from the trace alone without engineering assistance. The result must be recorded in `MODEL-RISK.md` with reviewer name, role, date, and per-question verdict. This is a hard entry condition for any audit-readiness claim — the platform cannot be described as audit-ready until this condition is met and on record.

The first five conditions may be met while the T3M1 validation is still outstanding. The platform may continue internal use and Phase 3 design may begin. However, no adoption-readiness or audit-readiness claim may be stated externally or to any risk function until the independent T3M1 evaluation is complete.

**Current state as of 2026-04-12 (Phase 2 close):** The first five conditions are met. T3M1 is currently at 3/8 — Q2, Q5, Q6, Q7, and Q8 are open. Full 8/8 is required before any regulated-enterprise adoption (Westpac or equivalent). Phase 3 design begins now; audit-readiness claims are withheld until the hard entry condition is satisfied.

---

## Phase 2 → Phase 3 transition

This section records confirmed Phase 2 delivery and open items that Phase 3 must address. It is the handoff record from Phase 2, not a retrospective.

### Confirmed Phase 2 delivery

All 13 Phase 2 stories are DoD-complete and merged to master as of 2026-04-12.

| Story | Description | DoD status |
|-------|-------------|------------|
| p2.1 | /definition skill improvements (D1 dependency chain validation, D2 testability filter, D3 learnings exit step) | DoD-complete |
| p2.2 | /review incremental state write per story | DoD-complete |
| p2.3 | DoR/DoD template improvements | DoD-complete |
| p2.4 | AGENTS.md surface adapter | DoD-complete |
| p2.5a | IaC + SaaS-API surface adapters | DoD-complete |
| p2.5b | SaaS-GUI + M365-admin + manual surface adapters | DoD-complete |
| p2.6 | EA registry Path A resolver | DoD-complete |
| p2.7 | Fleet registry CI aggregation | DoD-complete |
| p2.8 | Persona routing and non-engineer approval (GitHub Issue channel, ADR-006) | DoD-complete |
| p2.9 | Discipline standards remaining (fintech, healthcare, ecommerce domain POLICY.md pilots) | DoD-complete |
| p2.10 | Bitbucket CI validation (Cloud + DC YAML validators; Docker Compose deliverable) | DoD-complete |
| p2.11 | Improvement agent trace proposals and anti-overfitting gate | DoD-complete |
| p2.12 | Improvement agent challenger skill | DoD-complete |

Active ADRs at Phase 2 close: ADR-001 (no hosted runtime), ADR-002 (no framework lock-in), ADR-003 (hash verification as audit signal), ADR-004 (cross-team registry architecture — resolved, see §Substantive governance checks), ADR-005 (AGENTS.md surface adapter), ADR-006 (approval_channel adapter pattern).

### Open items at Phase 2 close

**T3M1 at 3/8 — Phase 3 fill targets named.** Five of the eight MODEL-RISK audit questions are unanswered at Phase 2 close. Each has a named Phase 3 story target:

| # | Question | Gap | Phase 3 fill target |
|---|----------|-----|---------------------|
| Q2 | `standardsInjected` hashes visible and verifiable in trace | Hash reconciliation not wired into CI trace write | p1.7/p2.1 gate enhancement story |
| Q5 | Watermark row visible in PR with pass/fail reason | Watermark gate does not emit result to PR comment | p1.4 PR reporting story |
| Q6 | `stalenessFlag` present in trace for current skill version | Staleness field absent from trace schema | Phase 3 schema story |
| Q7 | Agent independence evidenced by three structurally separate trace entries | CI does not validate entry count or cross-session independence | Phase 3 CI gate story |
| Q8 | Hash recomputation confirms no drift since approval | Hash drift check not wired into assurance gate | Phase 3 assurance story — links to tamper-evidence registry (see §Substantive governance checks) |

Q2 through Q8 are the Phase 3 delivery obligations that close the T3M1 gap. These five stories must be planned, DoR-gated, and DoD-confirmed before Phase 3 closes.

**p2.10 Docker DC tests deferred (3 tests).** AC3 (app-password), AC4 (OAuth), and AC5 (SSH) are deferred pending a Bitbucket DC Docker environment. The Docker Compose deliverable (`tests/fixtures/docker-compose.bitbucket-dc.yml`) is committed and reproducible; the deferral is environmental only. These tests close naturally when the environment is available — no Phase 3 story is required unless Westpac onboarding requires DC validation before that environment exists.

**D-batch pipeline evolution items pending (D10, D10a).** D10 (`/issue-dispatch` forward pointer at `/definition-of-ready` exit) and D10a (`Closes #[issue]` auto-close guidance in dispatch skill) are logged in `workspace/learnings.md` as Phase 3 implementation candidates. Neither is a blocking gap; both reduce operator memory load. Include as Phase 3 pipeline evolution stories.

**Windows-native trace validator pending.** `scripts/validate-trace.sh` requires bash and python3 and fails in PowerShell-only environments. Phase 3 should deliver `scripts/validate-trace.ps1` as a Windows-native equivalent with full parity (`--ci` output, non-zero exit on hard fail, identical check set). This closes the CI parity constraint (see §Design constraints, constraint 6) for Windows-based squad environments and Westpac desktop baselines.

---

## Gate structural independence

The Phase 2 assurance gate script (`run-assurance-gate.js`) lives in the delivery repository alongside the agent code it evaluates. A motivated or misconfigured delivery agent has, in principle, write access to the gate script through the same PR workflow it uses to deliver code. Even with branch protection in place, the gate's structural co-location with the delivery code it governs is a design vulnerability: an agent can propose, and an inattentive human reviewer can merge, a change that weakens the gate before the gate itself catches the weakening. This is the "agent weakens its own gate" vulnerability.

**Phase 3 requirement:** Move `run-assurance-gate.js` and all check scripts it invokes to a separate `platform-infrastructure` repository. The gate is fetched at CI time from a pinned, immutable ref — not a branch tip. The workflow validates the gate script's checksum against a known-good value before executing it. Delivery agents have no write access to the infrastructure repository. The gate author and the delivery agent are structurally separated: a change to the gate requires a PR to the infrastructure repository, reviewed by the platform team, not by the same agent and human reviewer who are also delivering the feature.

**Implementation sequence:**

1. Create a `platform-infrastructure` repository (or the equivalent within the enterprise's git host topology — a Bitbucket project with distinct permissions is a valid substitute).
2. Publish `run-assurance-gate.js` and its dependencies as a versioned, immutable release artefact in that repository.
3. Update the assurance gate workflow to download the gate script via a pinned release ref and validate its SHA-256 checksum before invoking `node run-assurance-gate.js`.
4. Remove `run-assurance-gate.js` from the delivery repository; replace it with a thin workflow shim that downloads, verifies, and executes the infrastructure script.
5. Restrict write access to the infrastructure repository to the platform engineering team. Delivery agents and squads are granted no write access.

Until this is implemented, the gate's integrity depends on branch protection and diligent human code review — controls that are sound but not structurally enforced at the level of the gate code itself. This gap must be closed before Phase 3 adoption at regulated-enterprise scale.

---

## Governance scope and human backstop

This section states the bounded governance claim the platform makes and the structural controls that enforce it. It must be read alongside `MODEL-RISK.md` — together they constitute the platform's risk disclosure for any risk reviewer, enterprise adoption assessment, or regulatory inquiry. This section must be kept current; any change to the inner loop model or the gate architecture that alters the governance claim requires a corresponding update here and in `MODEL-RISK.md`.

**What the platform verifies:** The platform verifies that a defined governance process was applied to agent output. It does not verify agent intent or instruction faithfulness. An agent that correctly follows a process and an agent that merely passes the process's structural checks are indistinguishable to the gate. The gate's signal is: "this process ran and produced these structured outputs in the expected form." It is not: "this agent understood and faithfully executed the intent behind the instruction." This distinction is not a weakness to be apologised for — it is the honest scope of what an automated governance gate can claim, and it must be stated clearly to any risk reviewer.

**Human PR review is the mandatory backstop for intent verification:** All agent PRs are opened as drafts and require human approval before merge. This is structurally enforced — no agent PR in the current platform architecture can be self-merged. Human review is the control that bridges the gap between structural process compliance (which the gate measures) and substantive intent verification (which requires human judgment). This requirement is not advisory; it is an architectural constraint of the inner loop model and must remain so at every scale up to and including Phase 4. Any platform evolution that removes or degrades the mandatory human approval step must be treated as a control reduction requiring formal risk acceptance.

**Passing tests are the primary signal for substantive correctness:** Tests that exercise real runtime behaviour — not file existence checks or schema validation alone — are the primary evidence that agent output is substantively correct. The `/test-plan` skill is required to produce executable tests that fail when an AC is not met and pass when it is. Structural checks (file presence, schema validity, linting, import resolution) are necessary but not sufficient for substantive correctness claims. Stories whose test plans consist exclusively of structural checks should be flagged as insufficient at DoR.

**The improvement agent loop surfaces systematic instruction-following failures:** When an agent consistently produces outputs that pass structural checks but fail in real usage, those failures appear as a recurring pattern across delivery traces. The improvement agent aggregates these patterns and surfaces them for human review. This closes the feedback loop between structural governance compliance and real-world instruction-following quality — but it closes it retrospectively, not preventively. Human review at each PR is the preventive control; the improvement loop is the retrospective signal. The presence of a retrospective signal does not reduce the requirement for preventive human review.

**Scope boundary for MODEL-RISK.md and risk reviewers:** The platform makes a bounded governance claim: that a defined, auditable process was applied to agent output; that human review was conducted at defined gates before any output was merged; and that the assurance trace is a tamper-evident record of what ran and what was checked. The platform does not claim to guarantee agent output quality beyond what the process and tests verify, does not claim to prevent agent hallucination, and does not claim to verify agent intent or instruction faithfulness beyond what the test suite exercises. Any risk reviewer assessing this platform for regulated-enterprise use must be given this scope boundary explicitly in writing before they form a governance view. Governance claims that exceed this boundary are not supportable by the current architecture and must not be stated by any platform team member in any review or assessment context.

---

## Autoresearch loop at enterprise scale

Phase 2 introduced the improvement agent operating within a single squad's `workspace/` context. Phase 3 elevates this to cross-team scale, using the cross-team trace registry established in §Substantive governance checks as the data source.

**Cross-team failure pattern aggregation:** The improvement agent reads traces not just from local `workspace/traces/` but from the cross-team trace registry. A failure pattern in one squad's traces may be isolated noise. The same pattern across five squads is a platform-level harness gap. Phase 3 makes this aggregation systematic: the improvement agent queries the registry by `failurePattern` across all squads, counts co-occurrences, and ranks improvement proposals by their cross-team impact.

**Impact-ranked improvement proposals:** The improvement agent ranks proposed SKILL.md diffs by the number of squads whose failure patterns the change would address. High-impact proposals — those affecting three or more squads — are escalated with cross-team trace evidence attached. Low-impact proposals (one or two squads) are routed to the affected squads' platform representatives rather than the platform core review queue.

**Staleness detection at scale:** Staleness signals that appear across multiple squads' traces indicate model-capability improvements that have outpaced platform harness updates. Cross-team staleness aggregation surfaces these faster than any single squad's signal would. At Phase 3 scale, a staleness signal from five or more squads in the same domain is treated as a platform-priority update proposal, not a squad-level recommendation.

**Anti-overfitting at scale:** The self-reflection gate is enforced at both local and cross-team level. The cross-team eval suite (`platform/suite.json`, distinct from squad-level `workspace/suite.json`) is the regression anchor. Anti-gaming controls for both suite files are specified in §Eval suite integrity.

---

## Standards autoresearch

The autoresearch loop extends beyond SKILL.md files to discipline standards. Recurring standards exceptions across squads — patterns of waived POLICY.md floors, consistent standards-not-met findings in specific surface types, or repeated structured clarifications of a standard's intent — surface as proposed standards adjustments to CoP co-owners. The proposal is not a floor weakening; it is surface-variant codification: a recognition that the standard requires additional specificity for a particular delivery context.

CoP co-owners review and approve; the improvement agent proposes and supplies cross-team evidence. The standards co-owner is not required to accept — rejection is a valid outcome and the improvement agent records it with the co-owner's stated rationale. Accepted changes follow the same governed lifecycle as skill changes: PR, EVAL.md scenario, evidence, rationale, human approval.

---

## Estimation calibration as an eval dimension

Real delivery records — actual versus estimated per story, per skill set, per surface type — are recorded in `workspace/estimation-norms.md` and `workspace/results.tsv` as a structured corpus. Phase 3 adds an estimation accuracy dimension to the eval suite. When a skill set consistently underestimates by more than 30% across three or more features (as measured in `workspace/results.tsv`), the improvement agent proposes a calibration adjustment to the skill's E1/E2 estimation guidance. The platform maintainer approves or rejects the adjustment using the same PR review process as any other SKILL.md change.

---

## Substantive governance checks and tamper-evidence

Phase 3 upgrades the assurance gate from structural checks to substantive checks, and upgrades the traceHash control from an in-repo audit anchor to a genuinely tamper-evident external attestation.

### Telemetry — cross-team trace registry

Phase 3 upgrades the squad-level `workspace/traces/` queryable interface — designed in Phase 1, implemented in Phase 2 — to a cross-team trace registry accessible to the improvement agent and audit agent across all participating squads.

**Interface promoted:** The squad-level filter interface (`getTraces(filter)`) promotes to a platform-level query with additional dimensions: squad, tribe, domain, surface type, date range, failure pattern, staleness flag. No schema changes are required in traces already conforming to the Phase 2 schema — the Phase 1 interface was explicitly designed to be promotable to this shape.

**Registry architecture — ADR-004 resolved:** ADR-004's cross-team registry tension (cross-team store vs no-hosted-service principle) is resolved as follows. The git-based aggregation model is adopted for Phase 3. Each squad commits `workspace/traces/` JSONL files to their delivery repository. A scheduled CI job — implemented in Jenkins or Bitbucket Pipelines for enterprise contexts — aggregates trace files from all squad delivery repositories into a platform-level `platform/traces/` store using per-squad directory partitioning. This model preserves ADR-004: there is no persistent agent runtime and no hosted web service. The aggregation job is a scheduled batch, not a server-bound process. A 24-hour freshness SLA is acceptable for the improvement-agent cycle time at Phase 3 scale. If real-time cross-squad trace access proves necessary at Phase 4, a hosted store may be reconsidered at that point with a formal ADR-004 revision process.

**Improvement agent upgrade:** The improvement agent reads cross-team traces via `getTraces(filter)` — it does not scan a flat directory. At 50-team scale, full directory scans are impractical and sensitive to repo structure changes. The queryable interface is what makes cross-team aggregation tractable at scale.

**OpenTelemetry standard:** Traces adopt OpenTelemetry as the standard trace wire format in Phase 3. A new `standards-composition` span records which standards files were composed at time of injection, at which content version, and whether any POLICY.md floor was applied or waived. This span is the mechanism by which T3M1 Q2 (`standardsInjected` hashes) is answered — see §Substantive gate checks below.

**Compliance monitoring report:** An audit agent samples the trace backend across squads and produces a periodic attestation report confirming that the control model operated as designed: that traces were written, that gate verdicts are present, that no gap pattern exceeds the threshold defined in the platform governance policy. Platform team and risk function review the compliance monitoring report on the defined cadence (recommended: monthly at Phase 3 scale, quarterly at Phase 4 steady state).

### Tamper-evidence registry — closes T3M1 Q8

In Phase 1 and Phase 2, the traceHash is computed and stored within the delivery repository. It is an audit anchor — it records what ran at the time of the CI job — but its integrity depends on the same repository that the delivery team writes to. A team with repository write access can, in principle, modify a trace file and update the hash to match. This is not a realistic threat in the dogfood context, but it is an unacceptable control gap at regulated-enterprise scale.

**Phase 3 requirement:** At CI time, after the assurance gate writes the trace file, the traceHash is published to an append-only external registry that the delivery team cannot write to. Two implementation options are acceptable:

1. **GitHub artifact attestation with OIDC-signed workflow identity:** The CI workflow uses its GitHub Actions OIDC token to sign an attestation record binding the traceHash to the specific workflow run ID, repository ref, and timestamp. The attestation is published to the GitHub Artifact Attestation service and is publicly queryable by anyone with the repository URL and trace hash value.
2. **Separate read-only registry repository:** A dedicated registry repository to which only the platform's CI workflow job (via its OIDC token or a limited-scope deploy key) has write access. At CI time, the workflow appends a one-line JSON record (traceHash, runId, repoRef, timestamp) to the registry. Delivery teams, agents, and squad engineers have read access only.

**Verification path:** An auditor recomputes the hash from the trace file's fields using the documented hash algorithm and compares it against the registry record. A match confirms that the trace has not been modified since the CI run that produced and attested it. A mismatch is a tamper signal requiring investigation. The delivery team cannot retrospectively alter an attested trace — this is the control property that Phase 1's in-repo hash did not provide. This closes T3M1 Q8.

### Substantive gate checks — closes T3M1 Q2, Q5, Q6, Q7

Phase 3 extends the assurance gate beyond structural checks (are the required files present and schema-valid?) to substantive checks (do the required fields contain values traceable to real governance decisions made during delivery?).

**New required trace fields for Phase 3:**

| Field | What it captures | T3M1 question closed |
|-------|-----------------|----------------------|
| `standardsInjected` | Array of objects: each entry names the standards file loaded, its content hash at injection time, and whether a POLICY.md floor was applied or waived | Q2 — standardsInjected hashes visible and verifiable in trace |
| `watermarkResult` | Object: pass/fail verdict from the watermark gate, with a reason string identifying which watermark check triggered the verdict | Q5 — watermark row visible in PR with pass/fail surface |
| `stalenessFlag` | Boolean: true if the current skill version is flagged as stale by a cross-team signal in the platform registry at time of gate execution | Q6 — stalenessFlag present in trace for current skill version |
| `sessionIdentity` | Object with three entries: dev-agent session ID (or equivalent unique token), assurance-agent session ID, and gate-run ID — each must be distinct, confirming structural independence | Q7 — agent independence evidenced by three separate, distinguishable entries |

For regulated stories — those whose ACs touch POLICY.md floors, compliance-framework guardrails, or audit-mandatory constraints — merge is blocked if any of these four fields is absent from the trace or contains a null value. Non-regulated stories produce a warning and may proceed; the warning is surfaced in the PR comment by the gate so that the human reviewer sees it explicitly.

---

## Eval suite integrity

The living eval suite — `workspace/suite.json` at squad level and `platform/suite.json` at cross-team level — is the regression anchor that prevents the improvement agent from gaming its own improvement loop. Without controls, an improvement agent could propose a SKILL.md change and simultaneously propose an eval scenario that the changed skill passes, producing a closed self-assessment loop with no external validity. Phase 3 applies the following anti-gaming controls.

**New scenario entry requirements:** Any new scenario added to either suite file must include a `traceId` field referencing a real, committed trace file in which the failure occurred, and a `failurePattern` field whose value matches the `failurePattern` string in that trace record. Synthetic scenarios constructed without a real-trace reference are not permitted. This requirement grounds the eval suite in actual delivery history — scenarios document what has already failed in the field, not what the improvement agent predicts might fail.

**Human approval mandatory:** The improvement agent may propose new scenarios but may not autonomously add them to a suite file. Every new scenario addition requires explicit approval from the platform maintainer, recorded as a PR review comment on the PR that adds the scenario. The improvement agent writes its proposals to `workspace/proposals/suite-additions/` — a staging area that the maintainer reviews on a defined cadence. Approved entries are committed by the platform maintainer, not by an agent.

**Outcome-oriented, not implementation-prescriptive:** Scenarios must describe a real delivery outcome that failed — for example, "definition skill wrote a prerequisite story without validating the dependency chain, resulting in a zero-metric-trace story in the submitted batch." They must not describe an implementation instruction — for example, "definition skill must call `validateDependencyChain()` before writing any story." Implementation-prescriptive scenarios constrain the platform's implementation freedom, reward compliance with the letter of the instruction rather than its intent, and are a form of premature structural lock-in that the anti-overfitting gate is specifically designed to prevent.

**Integrity of the cross-team suite:** The platform-level `platform/suite.json` is held in the `platform-infrastructure` repository (the same repository as the gate scripts, with the same write-access restrictions). This ensures that the cross-team eval suite is under the same structural independence controls as the gate itself — a delivery agent cannot weaken the suite for the same reason it cannot weaken the gate.

---

## EA registry live integration

Phase 3 extends the Phase 2 EA registry integration from surface type classification to full live querying at discovery time.

**Phase 2 established:** Surface type queried from the EA registry at Path A start. The resolver uses the `technology.hosting` field (`saas` → `saas-api`, `cloud` → `iac`, `on-prem` → `manual`) with `adapter_override` in `context.yml` for granular type selection (`saas-gui`, `m365-admin`). Cross-platform dependency detection is available for stories whose EA registry entries span multiple surface types. Squads using `context.yml` Path B continue operating without change.

**Phase 3 extends to:** Live query at discovery time for the full platform target list, blast radius estimate, and dependency graph — not just surface type. Cross-platform dependencies are detected automatically and tracked in the decision trace, with separate DoD gates produced per surface when a story spans multiple surfaces. This removes a class of human error that Path B requires the squad to catch themselves: the squad being unaware that their story touches multiple surfaces because they only see the `context.yml` they authored.

Path B (`context.yml` explicit declaration) remains valid in Phase 3 and beyond for squads that prefer explicit over dynamic surface resolution. The registry integration is an enhancement that eliminates manual steps, not a prerequisite for the platform to function. No squad should be blocked from using the platform while the Phase 3 registry integration is in progress.

---

## Approval channel enterprise adapters

The approval channel adapter pattern established in p2.8 and formalised as ADR-006 defines the channel-agnostic contract: a designated approver posts `/approve-dor` in the configured channel, triggering a workflow that writes `dorStatus: signed-off` to `pipeline-state.json`. The channel-specific plumbing lives in a swappable adapter module. Changing the approval channel requires updating `context.yml` `approval_channel` and deploying the corresponding adapter — no skill edits and no change to the pipeline state contract.

**Phase 2 dogfood implementation:** GitHub Issue channel. A linked GitHub Issue is created for each story at dispatch time. The designated approver posts `/approve-dor` as a comment. A GitHub Actions workflow triggers on the issue comment event and writes the sign-off record to `pipeline-state.json`.

**Phase 3 delivery — enterprise channel adapters:** The target channels are those used by non-engineering approvers in regulated enterprise contexts. Phase 3 must deliver at least two enterprise adapters from the following candidates, prioritised by Westpac relevance:

- **Jira:** Approval triggered by a Jira workflow transition (e.g. a "Approved for Development" status change on the linked Jira ticket) or a structured comment containing `/approve-dor`. The adapter listens via Jira webhook and writes the sign-off to `pipeline-state.json` on the correct event.
- **Microsoft Teams:** An Adaptive Card is sent to the designated approver containing the story summary and an Approve button. The button click fires a webhook that triggers the pipeline-state write. Priority candidate for Westpac given Teams penetration in Australian banking.
- **Confluence:** Approval via a structured Confluence approval macro or approval page status change. Relevant for teams that use Confluence as their primary artefact review surface.
- **Slack:** Interactive message with an Approve action; click triggers the sign-off webhook.

Each adapter must: authenticate using enterprise service credentials or OAuth, not personal tokens; preserve the channel-agnostic `pipeline-state.json` write contract without introducing channel-specific fields; be unit-testable in isolation against a mock channel API; and not store approval state outside `pipeline-state.json` — the pipeline state file is the authoritative system of record for all sign-off events.

**Westpac migration note:** The GitHub Issue adapter is not available in a Bitbucket/Jenkins environment without additional GitHub-to-Bitbucket integration plumbing. The Westpac adapter set should be identified as a Phase 3 deliverable before the Westpac migration begins, so that the first Westpac agent PR can use the correct channel from day one.

---

## AGENTS.md enterprise validation

The AGENTS.md surface adapter (ADR-005, delivered in p2.4) established that the platform's inner loop can be operated by non-GitHub agent tooling. The adapter reads the AGENTS.md file in the repository root, resolves the toolchain name, and routes inner loop instructions to the correct surface-specific format without requiring any change to the core skill files.

**Phase 2 scope and gap:** The AGENTS.md adapter was implemented and tested against the GitHub Copilot agent as the primary — and only live — inner loop surface. Non-GitHub paths were exercised through unit tests using fixture mocks. No testing against a real non-GitHub agent tooling was conducted during Phase 2 because the dogfood context is GitHub-native. This means the adapter's non-GitHub routing logic has not been validated under real delivery conditions.

**Phase 3 validation requirement:** The AGENTS.md adapter must be validated against at least one real non-GitHub inner loop tooling in a genuine delivery context — not a fixture mock. Target candidates for Phase 3 validation are:

- **Cursor:** VS Code-based AI coding agent with file-edit and terminal execution capabilities. Widely used in teams that prefer a VS Code-native experience outside the GitHub Copilot subscription model.
- **Claude Code:** Anthropic's terminal-first agent with strong code generation and file manipulation capabilities. Increasingly common in enterprises that use Anthropic's API directly.
- **Enterprise equivalent:** Any enterprise-licensed AI agent tooling that the adopting organisation deploys as their inner loop standard. At Westpac, this is most likely to be a procured tool under the bank's AI usage policy rather than a consumer product.

The validation is a DoD-gated Phase 3 story. The surface resolution, instruction delivery format, DoR handoff, and assurance trace generation must all operate end-to-end with the target non-GitHub tooling as a genuine delivery run — at minimum one story delivered from branch-setup to merged PR using the non-GitHub agent. Any adapter gaps discovered during validation must be resolved before Phase 3 closes. This is particularly important for Westpac, where the enterprise tooling choice is highly likely to diverge from the GitHub Copilot dogfood context and where assuming adapter compatibility without validation is an unacceptable adoption risk.

---

## Squad-to-platform skill contribution flow

Squads propose skills upstream via a governed contribution process: a PR to the platform repository containing the SKILL.md file, an EVAL.md scenarios file covering the skill's failure modes, performance evidence from at least one real delivery run, and a rationale for core-tier inclusion. This is distinct from the platform engineer publish flow — a squad contribution goes through a higher evidence threshold and a separate review bracket, but the same human approval gate. The contribution process is the primary mechanism by which enterprise learnings cycle back into the platform core and make it more valuable to the entire adopter population over time.

---

## Design constraints

All Phase 1–2 design constraints carry forward unchanged. Phase 3 adds a sixth constraint.

1. **Trace schema extensibility:** Phase 3 adds the `standards-composition` span and the four substantive governance fields (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`). Phase 4 adds agent identity fields. The trace schema must accommodate all additions without breaking existing traces conforming to the Phase 2 schema.
2. **`workspace/suite.json` promotable:** Squad-level suite files must be mergeable into the platform-level `platform/suite.json` without schema changes. The anti-gaming controls in §Eval suite integrity must not require schema divergence between squad and platform suites.
3. **`workspace/results.tsv` cross-team comparable:** Schema must include sufficient context — skill-set hash, surface type, feature slug — for cross-squad comparison without additional data collection.
4. **Queryable trace interface designed for promotion:** The squad-level `getTraces(filter)` interface uses the same filter dimensions as the Phase 3 cross-team registry. The Phase 1 implementation was explicitly designed to this specification and no schema changes are required for Phase 3 promotion.
5. **Improvement agent proposal format:** Plain Markdown plus diff, readable in any git host's PR UI without platform tooling. This constraint ensures that improvement proposals are legible to human reviewers on any git platform, including Bitbucket and GitLab, without requiring a GitHub-specific PR rendering context.
6. **CI environment parity:** All Phase 3 governance checks — including `validate-trace.sh` / `validate-trace.ps1`, `npm test`, and all check scripts invoked by the assurance gate — must pass on both Windows and Linux CI runners without environment-specific workarounds or conditional logic branching by OS. A Docker-based developer environment aligned with the CI baseline must be provided as part of squad onboarding materials. Windows/Linux portability gaps — including shell-specific syntax in workflow steps, `__dirname`-based absolute paths in check scripts that resolve differently across environments, Python launcher variations, and tool availability differences — are treated as test-environment control failures and must be resolved before the affected check is counted as operational. This includes delivery of `scripts/validate-trace.ps1` with demonstrated parity against `validate-trace.sh` on the same repo state.

---

## Open ADRs deferred to Phase 4

These require Phase 3 operational evidence before they can be decided responsibly.

1. **Improvement agent governance model at scale:** At what point does the improvement agent's track record justify a lighter-touch human review process? What evidence threshold qualifies a proposed diff for reduced review scrutiny? Current answer: never — all improvement proposals require human approval regardless of the improvement agent's historical accuracy. This ADR revisits at Phase 4 based on Phase 3 operational data.
2. **Azure AI Foundry as enterprise runtime:** Feasibility assessment for Azure AI Foundry as a hosted inner loop runtime option. Decision depends on Azure posture and licensing constraints at Phase 4; requires Phase 3 operational experience with non-GitHub inner loop tooling before the comparison is meaningful.
3. **Cross-squad improvement agent coordination:** Shared improvement proposal queue versus independent agents per squad with cross-team aggregation at platform level. The git-based aggregation model adopted for the trace registry is a candidate pattern here but requires Phase 3 operational evidence on proposal volume and review throughput before the coordination model can be specified.
4. **Real-time cross-team trace access:** If the git-based aggregation model (24-hour SLA) proves insufficient for improvement agent cycle time at enterprise scale — for example, if squads require same-day staleness signals — a hosted store may be reconsidered at Phase 4 with a formal ADR-004 revision process. Phase 3 must produce operational data on actual improvement agent cycle time before this decision is made.

---

## What stays human in Phase 4

Included here as a forward-looking constraint on Phase 3 designs. Phase 3 designs must not assume away any of these, even where agent capability improvements might make partial automation technically feasible.

- Authoring story specs and acceptance criteria.
- Setting POLICY.md floors.
- Merging SKILL.md changes.
- Risk function attestation and compliance sign-off.
- Benefit metric definition and outcome interpretation.
- Cross-squad priority decisions.
- T3M1 independent evaluation — must always be conducted by a named non-engineering reviewer outside the platform engineering reporting line, with no engineering assistance during the review. This requirement cannot be automated or delegated to a second AI session.

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-04-12 | Document created as primary Phase 3 /discovery input from ref-skills-platform-phase3-4.md Phase 3 section. Phase 4 content excluded from this document. | All |
| 2026-04-12 | Amendment 1 — Tamper-evidence registry: traceHash upgraded to append-only external attestation via GitHub artifact attestation or read-only registry repo. Closes T3M1 Q8. | §Substantive governance checks — Tamper-evidence registry |
| 2026-04-12 | Amendment 2 — Gate structural independence: run-assurance-gate.js moved to platform-infrastructure repo; pinned immutable fetch; checksum validation before execution; delivery agents have no write access. Closes "agent weakens its own gate" vulnerability. | §Gate structural independence |
| 2026-04-12 | Amendment 3 — Substantive gate checks: standardsInjected, watermarkResult, stalenessFlag, sessionIdentity required fields added; merge blocked for regulated stories if absent. Closes T3M1 Q2, Q5, Q6, Q7. | §Substantive governance checks — Substantive gate checks |
| 2026-04-12 | Amendment 4 — ADR-004 resolved: git-based aggregation model adopted; per-squad partitioning; 24h SLA; hosted store deferred to Phase 4 with formal ADR-004 revision gate. | §Substantive governance checks — Telemetry, ADR-004 resolution |
| 2026-04-12 | Amendment 5 — T3M1 independent validation as hard entry condition for Phase 3 audit-readiness claims. | §Entry conditions |
| 2026-04-12 | Amendment 6 — CI environment parity: Windows and Linux CI runners required; Docker baseline; portability gaps treated as control failures; validate-trace.ps1 included. | §Design constraints — constraint 6 |
| 2026-04-12 | Amendment 7 — Eval suite integrity: anti-gaming controls; traceId + failurePattern required for new scenarios; human approval mandatory; outcome-oriented not implementation-prescriptive; platform/suite.json in infrastructure repo. | §Eval suite integrity |
| 2026-04-12 | Amendment 8 — Governance scope and human backstop: bounded governance claim stated; human PR review structurally enforced and non-advisory; tests as primary substantive signal; improvement loop as retrospective instruction-following signal; MODEL-RISK.md disclosure obligation. | §Governance scope and human backstop |
| 2026-04-12 | Phase 2 delivery actuals integrated: 13 stories DoD-complete, ADR-001–006 active, T3M1 at 3/8 with five named Phase 3 fill targets, Docker DC tests deferred, D10/D10a pending, Windows validator pending. | §Entry conditions, §Phase 2 → Phase 3 transition |
| 2026-04-12 | New sections added: Phase 2 → Phase 3 transition, Gate structural independence, Governance scope and human backstop, Eval suite integrity, Approval channel enterprise adapters, AGENTS.md enterprise validation. | New sections |
| 2026-04-12 | Estimation calibration as eval dimension added (from original). | §Estimation calibration |
| 2026-04-09 | Telemetry section expanded — queryable cross-team trace registry as Phase 3 upgrade from Phase 1/2 interface; OpenTelemetry; staleness detection at scale. | §Substantive governance checks — Telemetry |
| 2026-04-09 | Design constraints: queryable trace interface promotion added as constraint 4. | §Design constraints |
| 2026-04-07 | Autoresearch loop cross-team aggregation; standards autoresearch; initial Phase 4 ADR set. | All |
