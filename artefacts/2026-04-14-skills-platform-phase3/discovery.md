# Discovery: Skills Platform — Phase 3

**Status:** Draft — awaiting approval
**Created:** 2026-04-14
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot
**Feature slug:** 2026-04-14-skills-platform-phase3
**Primary reference:** `artefacts/2026-04-11-skills-platform-phase2/reference/ref-skills-platform-phase3.md`
**Supporting references:** `artefacts/2026-04-09-skills-platform-phase1/reference/ref-skills-platform-phase3-4.md`, `ref-skills-platform-operating-model.md`, `ref-skills-platform-standards-model.md`, `workspace/phase3-backlog-trace-commit-observability.md`, `workspace/phase3-backlog-test-coverage-governance-gaps.md`

---

## Problem Statement

Phase 2 delivered a functional governance pipeline: 13 stories DoD-complete, improvement agent operational, fleet registry running, and the approval channel adapter pattern established. However, Phase 2 closed with five categories of identified gap that Phase 3 must address before the platform can make any audit-readiness or regulated-enterprise adoption claim.

**Gap 1 — Silent post-merge workflow failures (no operator visibility).** The trace-commit.yml workflow experienced four silent failures during Phase 2 (PRs #51, #52, #56). The root-cause bug was fixed in PR #55, but the observability gap remains: when a post-merge workflow fails, the operator has no alert, no governance check blocks the PR, and the delivery is silently incomplete. The absence of a trace goes unnoticed.

**Gap 2 — Assurance gate checks verify structure only, not governance substance.** The assurance gate runs on every PR but its four existing checks (`workspace-state-valid`, `pipeline-state-valid`, `artefacts-dir-exists`, `governance-gates-exists`) are file-existence and JSON-parseability checks. An empty repo with four minimal files passes all four identically to a correct delivery. Production traces show `completedAt` is 1–2ms after `startedAt` — there is nothing substantive being evaluated. A second-team adversarial review on 2026-04-12 identified five specific test integrity gaps across the suite.

**Gap 3 — T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) at 3/8, blocking all audit-readiness claims.** Five of the eight MODEL-RISK audit questions are unanswered because the required trace fields do not exist. No adoption-readiness or audit-readiness claim may be made to any risk function until T3M1 reaches 8/8. The five gaps are: `standardsInjected` hashes not in trace (Q2), watermark result not surfaced (Q5), `stalenessFlag` absent from trace schema (Q6), agent independence not evidenced by structurally distinct session entries (Q7), and traceHash not tamper-evident beyond the delivery repository itself (Q8).

**Gap 4 — Gate structural vulnerability: agent can propose changes to the script that governs it.** `run-assurance-gate.js` and all check scripts it invokes live in the same delivery repository as the delivery code they evaluate. A delivery agent with repository write access can, through the normal PR workflow, propose a change that weakens the gate — and an inattentive human reviewer can merge it before the gate itself detects the weakening. This is the "agent weakens its own gate" vulnerability. It is not theoretical at regulated-enterprise scale.

**Gap 5 — Platform not validated for enterprise scale.** The platform has been dogfooded in a single GitHub-native squad. No enterprise channel adapters exist (organisations use Jira, Teams, Confluence for approvals — not GitHub Issues). The AGENTS.md adapter has never been validated against a real non-GitHub inner loop tooling. The cross-team trace registry needed for multi-squad improvement agent operation has not been delivered. `scripts/validate-trace.sh` fails in PowerShell-only CI environments. These gaps prevent regulated-enterprise adoption.

---

## Who It Affects

**Platform maintainer** owns the gate scripts and governance infrastructure. They need the gate moved to a structurally independent repository so that delivery agents cannot weaken it, and they need the eval suite anti-gaming controls so the improvement agent cannot write self-serving scenarios.

**Squad tech lead** runs the platform daily. They need Windows-native tooling (`validate-trace.ps1`), reliable post-merge workflow observability, and substantive governance signals — not structural check theatre. They also need the T3M1 trace fields to be automatically populated so they are not manually maintaining audit evidence.

**Risk reviewer / audit function** cannot form a governance view until T3M1 is at 8/8. They need the five new trace fields present and verifiable, the tamper-evidence registry providing an independent attestation anchor not held inside the delivery repository, and the governance scope boundary documented explicitly in `MODEL-RISK.md`.

**Non-engineering approver** (business analyst, risk analyst, product owner) cannot use GitHub Issues as their approval channel in an enterprise context. They need adapters for the tools they already use: Jira, Microsoft Teams, Confluence, or Slack.

**Enterprise adopting organisation** needs the platform validated against non-GitHub inner loop tooling before committing to adoption, needs cross-team trace aggregation operational before the improvement agent can produce cross-squad impact-ranked proposals, and needs CI environment parity on both Windows and Linux before squad onboarding is practical at scale.

---

## Why Now

Phase 2 closed on 2026-04-12. That closure drew an adversarial second-team audit that produced eight governance-hardening amendments. The primary Phase 3 reference document (`ref-skills-platform-phase3.md`) designates the T3M1 fill targets (Q2–Q8) as Phase 3 delivery obligations explicitly: "These five stories must be planned, DoR-gated, and DoD-confirmed before Phase 3 closes." They are not optional backlog items.

The gate structural independence gap becomes urgent specifically now: as the platform moves toward multi-squad use, the probability that a misconfigured or misbehaving agent encounters the gate increases. Fixing this after an incident is a regulated-enterprise audit finding; fixing it before is a design decision.

The enterprise channel adapters are blocking the first Enterprise adoption conversation: the GitHub Issue channel is not available in a Bitbucket/Jenkins environment without additional plumbing. The Phase 3 adapter set must be identified before the Enterprise migration begins so the first Enterprise agent PR can use the correct channel from day one.

---

## MVP Scope

Priority order reflects the principle that governance integrity must be assured before scale is pursued. Test and governance hardening stories (Groups A–C) are first because they close known vulnerabilities in the platform's own assurance chain before it is asked to assure other teams' delivery.

### Priority 1 — Test and governance hardening (from adversarial audit)

**A. Trace-commit observability (4 ACs):**
`tests/check-trace-commit.js` added to `npm test` asserting `origin/traces` branch health and commit age; `/verify-completion` SKILL.md updated with post-merge workflow verification section including diagnostic commands; `/trace` SKILL.md updated to output a "Traces Branch Health" section when validating on master.

**B. Assurance gate substantive checks (2 ACs from backlog AC1 + AC5):**
`run-assurance-gate.js` extended from file-existence to content-level checks: `workspace/state.json` `currentPhase` non-empty + `lastUpdated` ISO 8601 validated; `pipeline-state.json` `version` field + `features` array asserted; at least one artefact subdirectory under `artefacts/` not just the directory; `governance-gates.yml` `gates:` key present and non-empty. `completedAt: null` with `status: "completed"` detected and failed by `check-workspace-state.js`.

**C. Test suite integrity (3 ACs from backlog AC2, AC3, AC4):**
`check-definition-skill.js` refactored to import from `src/` production path, not inline re-implementations. `watermark-gate.js` enforces minimum `passRate` floor on baseline creation (default 0.70; configurable). `failure-detector.js` anti-overfitting gate counts removals of passing checks separately from additions — a proposal that removes one passing check and adds one new check is blocked, not warned.

**D. Bitbucket DC auth tests resolved (1 AC from backlog AC7):**
The four permanently-skipped DC auth tests (app-password, OAuth, SSH key) resolved via Option A (scheduled `bitbucket-dc-auth.yml` workflow with Docker service container) or Option B (formal manual test record in `smoke-tests.md` with last-run date and result). Decision logged in decisions.md.

**E. Agent behaviour observability registered as Phase 4 (1 AC from backlog AC6):**
`docs/agent-behaviour-observability.md` produced with the three candidate approaches and effort estimates. Phase 4 story registered in `workspace/`. No implementation.

### Priority 2 — T3M1 audit gap closure (closes Q2, Q5, Q6, Q7, Q8)

Four new mandatory trace fields (`standardsInjected`, `watermarkResult`, `stalenessFlag`, `sessionIdentity`) added to the trace schema; gate blocks merge of regulated stories if any field is absent or null. Tamper-evidence registry implemented: at CI time, traceHash published to an append-only external store — either GitHub Artifact Attestation with OIDC-signed workflow identity, or a dedicated read-only registry repository. Delivery team has no write access to the attestation record. Auditors can recompute the hash independently and compare against the registry. Closes T3M1 Q8.

### Priority 3 — Gate structural independence

`run-assurance-gate.js` and all invoked check scripts moved to a separate `platform-infrastructure` repository. Delivery repository's CI workflow downloads the gate script via a pinned, immutable release ref and validates its SHA-256 checksum before execution. Delivery agents have no write access to the infrastructure repository. The "agent weakens its own gate" vulnerability is structurally closed.

### Priority 4 — Eval suite integrity anti-gaming controls

New scenario entries to `workspace/suite.json` (and future `platform/suite.json`) require: a `traceId` field referencing a real committed trace file, and a `failurePattern` field matching the trace record. Synthetic scenarios require maintainer justification. The improvement agent stages new scenario proposals to `workspace/proposals/suite-additions/` — a human maintainer commits approved entries. `platform/suite.json` held in the infrastructure repository under the same write-access restrictions as the gate scripts.

### Priority 5 — Windows-native trace validator

`scripts/validate-trace.ps1` delivered with full parity against `validate-trace.sh`: `--ci` flag, non-zero exit on hard failure, identical check set. CI environment parity constraint (constraint 6) confirmed satisfied: all governance checks pass on both Windows and Linux runners without OS-conditional workarounds.

### Priority 6 — Pipeline evolution items (D10, D10a)

`/issue-dispatch` SKILL.md updated with a forward-pointer section at `/definition-of-ready` exit reminding the operator that dispatched stories should close their linked issues. `Closes #[issue]` auto-close guidance added to dispatch output. Neither is a blocking gap; both reduce operator memory load.

### Priority 7 — Cross-team trace registry (ADR-004 resolved)

Git-based aggregation model: each squad commits `workspace/traces/` JSONL files to their delivery repository. A scheduled CI job aggregates trace files from all squad delivery repositories into `platform/traces/` using per-squad directory partitioning. 24-hour freshness SLA. No persistent server — ADR-004 preserved. OpenTelemetry adopted as trace wire format. `standards-composition` span added. Improvement agent upgraded to query via `getTraces(filter)` across squads.

### Priority 8 — Approval channel enterprise adapters (minimum 2)

Priority candidates for regulated-enterprise context: Microsoft Teams (Adaptive Card + Approve button webhook) and Jira (workflow transition or structured `/approve-dor` comment webhook). Each adapter must authenticate via service credentials/OAuth (not personal tokens), preserve the `pipeline-state.json` write contract without channel-specific fields, and be unit-testable against a mock channel API. GitHub Issue adapter remains valid and is not removed.

### Priority 9 — AGENTS.md enterprise validation

One complete end-to-end delivery run — branch-setup to merged PR — using a real non-GitHub inner loop tooling (Cursor, Claude Code, or enterprise-equivalent licensed tool). Surface resolution, instruction delivery, DoR handoff, and assurance trace generation must all operate end-to-end. Any adapter gaps discovered must be resolved before Phase 3 closes.

### Priority 10 — EA registry live integration

Phase 3 extends the Phase 2 registry integration from surface type classification to full live query at discovery time: blast radius, dependency graph, and platform target list. Cross-platform dependencies detected automatically with separate DoD gates per surface. Path B (`context.yml` explicit declaration) remains permanently valid — the registry is an enhancement, not a prerequisite.

### Priority 11 — Estimation calibration as eval dimension

When a skill set consistently underestimates by >30% across three or more features in `workspace/results.tsv`, the improvement agent generates a calibration adjustment proposal for E1/E2 estimation guidance. Maintainer approves via the same PR review process as any SKILL.md change. Historical actuals from `workspace/estimation-norms.md` form the baseline corpus.

### Priority 12 — Squad-to-platform skill contribution flow

Governed contribution process: a squad opens a PR to the platform repository containing the SKILL.md file, an EVAL.md scenarios file covering the skill's failure modes, performance evidence from at least one real delivery run, and a rationale for core-tier inclusion. Review threshold is higher than platform engineer publish flow; same human approval gate applies.

### Priority 13 — Compliance monitoring report

An audit agent samples the trace backend across squads and produces a periodic attestation report confirming that the control model operated as designed. Recommended cadence: monthly at Phase 3 scale. Platform team and risk function review. Scope bounded to: traces written, gate verdicts present, no gap pattern exceeding the threshold in platform governance policy.

---

## Out of Scope

- **Phase 4 items** — agent identity layer (signed per-execution identity), policy lifecycle management (governed POLICY.md floor change process), operational domain standards (incident response, change management, capacity planning), and the four Phase 4 open ADRs (improvement agent governance model at scale, Azure AI Foundry as enterprise runtime, cross-squad agent coordination model, real-time cross-team trace access). All require Phase 3 operational data before they can be decided responsibly and are explicitly deferred in the reference documents.
- **T3M1 enforcement at Phase 3 entry** — T3M1 is currently at 3/8. Phase 3 design begins while the hard entry condition (T3M1 at 8/8) for audit-readiness claims is outstanding. Phase 3 delivers the stories that close Q2–Q8; it does not wait for an external reviewer to complete the evaluation before work begins. The external T3M1 review remains a separate, human-gated action and is not in scope as a delivery story.
- **Real-time cross-team trace access** — if the 24-hour git-based aggregation SLA proves insufficient at enterprise scale, a hosted store may be reconsidered at Phase 4 with a formal ADR-004 revision process. Point-in-time freshness beyond 24h is out of scope for Phase 3.
- **Bitbucket/GitLab-native pipeline state** — `pipeline-state.json` write mechanics remain GitHub Actions-native for Phase 3. Enterprise environments on Bitbucket/Jenkins are addressed via the approval channel adapters (Priority 8) and AGENTS.md validation (Priority 9), not by rewriting the state write architecture.
- **Automated agent skill adherence testing** — verifying that an agent actually follows skills in practice under adversarial conditions is Phase 4 (AC6 from `workspace/phase3-backlog-test-coverage-governance-gaps.md`). The architectural note in `docs/agent-behaviour-observability.md` (Priority 1E) frames the problem but does not implement a solution.

---

## Assumptions and Risks

**ASSUMPTION-01:** The gate structural independence work (Priority 3) requires creating a new `platform-infrastructure` repository. This assumes the operator has permission to create a new repository in the target Git host. If a separate repo is not feasible (e.g. enterprise policy restricts new repo creation), an alternative is a protected branch with enforced code ownership rules — but this is a weaker control that does not fully close the structural vulnerability. This assumption must be validated before the Priority 3 story reaches DoR.

**ASSUMPTION-02:** The tamper-evidence registry (Priority 2, T3M1 Q8) uses GitHub Artifact Attestation with OIDC-signed workflow identity as the preferred implementation. This assumes the target environment supports GitHub Actions OIDC tokens. For Bitbucket/Jenkins environments, the read-only registry repo option is the fallback. The choice must be confirmed before the T3M1 Q8 story is written.

**ASSUMPTION-03:** The enterprise adapter minimum viable set is Teams + Jira (Priority 8). This assumes the primary Enterprise adopter is in the Australian banking sector where Teams penetration is high and Jira is the standard project management tool. If the first Enterprise adopter uses different tooling, the adapter priority order should be revised before the Priority 8 epic is defined.

**ASSUMPTION-04:** AGENTS.md enterprise validation (Priority 9) can be conducted against Cursor or Claude Code as a representative non-GitHub tooling. This assumes either tooling is available to the operator for a genuine end-to-end delivery run. If neither is available, the validation story must specify an alternative before reaching DoR.

**RISK-01:** T3M1 external review (8/8) is a human-gated action outside the delivery pipeline. Phase 3 can close Q2–Q8 programmatically, but the external reviewer must still conduct the audit. If the reviewer is unavailable, audit-readiness claims remain blocked even after the Phase 3 stories close. No delivery story can mitigate this risk — it must be managed as an external dependency.

**RISK-02:** Gate structural independence (Priority 3) is a significant architectural change. Moving `run-assurance-gate.js` to a separate repository changes the CI workflow dependency model and requires the infrastructure repository to be operational before any squad can run the gate. A migration period where both the co-located and remote gate are operational will be required. The migration sequence must be planned carefully to avoid breaking existing squad CI pipelines.

**RISK-03:** The adversarial audit (Priority 1C, AC2) revealed that `check-definition-skill.js` tests its own inline re-implementations rather than importing production code. Fixing this requires source code in `src/definition-skill/` that does not currently exist. If the definition skill's parsing logic is not easily extractable into testable module exports, the refactor scope may be larger than a single story. This risk should be assessed at the story-writing phase.

---

## Directional Success Indicators

- T3M1 reaches 8/8: an independent non-engineering reviewer can answer all eight MODEL-RISK audit questions from the trace alone without engineering assistance. The result is on record in `MODEL-RISK.md` with reviewer name, role, and per-question verdict.
- `npm test` asserts post-merge workflow health: the `check-trace-commit.js` script exits 1 when the traces branch is stale, surfacing any recurrence of the Phase 2 silent failure pattern within the next `npm test` run.
- Assurance gate produces a production trace where `completedAt` is meaningfully after `startedAt` (more than 5ms): structural check theatre is replaced by real governance signal.
- An enterprise approval workflow completes end-to-end without a GitHub Issue: a non-engineering approver uses a Teams or Jira adapter to write `dorStatus: signed-off` to `pipeline-state.json`.
- At least one story is delivered end-to-end (branch-setup to merged PR) using a non-GitHub inner loop agent: AGENTS.md adapter validated in a genuine delivery context, not a fixture mock.
- `scripts/validate-trace.ps1` passes `--ci` on the current repo state in a Windows PowerShell environment with no bash dependency.
- The improvement agent generates at least one cross-squad impact-ranked proposal drawing from traces in more than one squad's `workspace/traces/`: cross-team aggregation operational.

---

## Constraints

**From product/constraints.md (all carry forward unchanged):**
- Update channel must never be severed — consuming squads must receive skill updates without forking the platform repository.
- POLICY.md floors are non-negotiable — no squad or domain configuration may weaken a floor defined at a higher tier.
- Spec immutability — no automated process may modify story specs, ACs, DoR/DoD criteria, or POLICY.md floors.
- Human approval gate is non-negotiable for instruction set changes — no SKILL.md, POLICY.md, or standards file change may be merged without human review.
- Instruction sets are versioned and hash-verified — every SKILL.md delivered to an agent must produce a deterministic hash recorded in the assurance trace.

**Phase 3-specific constraints:**
- T3M1 independent evaluation is permanently human-gated: the external audit cannot be automated or delegated to a second AI session, regardless of model capability improvements. This constraint is non-negotiable through Phase 4 and beyond.
- Gate structural independence (Priority 3) must not break existing squad CI pipelines during migration — a dual-mode migration period is required.
- Enterprise channel adapters must authenticate via service credentials or OAuth only — personal tokens are not permitted for any adapter regardless of convenience.
- All Phase 3 governance checks must pass on both Windows and Linux CI runners without OS-conditional workarounds (constraint 6 from `ref-skills-platform-phase3.md`).
- ADR-004 (no persistent agent runtime, no hosted service) is preserved for Phase 3. The git-based aggregation model with 24h SLA is the adopted architecture. Any deviation requires a formal ADR-004 revision at Phase 4.

---

**Next step:** Human review and approval → /benefit-metric
