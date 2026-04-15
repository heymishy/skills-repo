# Enterprise Handoff: Skills Platform Phase 1 + Phase 2 + Phase 3 Init

**Document type:** Enterprise handoff bundle
**Prepared:** 2026-04-12
**Updated:** 2026-04-14 (enterprise operator notice + raw links added — see Section 4 notice)
**Prepared by:** Platform maintainer (Hamish)
**Status:** Phase 2 complete, Phase 3 initialised — PR `feat/phase3-init-rename-improve` open

---

## 1. What Was Delivered

### Phase 1 — Foundation (2026-04-09 → 2026-04-11)

8 stories delivered across 4 epics. All PRs merged (#1–#14 range). DoD-complete.

| Story | Title | Status |
|-------|-------|--------|
| p1.1 | Distribution infrastructure and progressive skill disclosure | DoD-complete |
| p1.2 | Surface adapter model — foundations (git-native, Path B) | DoD-complete |
| p1.3 | Assurance agent as automated CI gate | DoD-complete |
| p1.4 | Watermark gate | DoD-complete |
| p1.5 | `workspace/state.json` and session continuity | DoD-complete |
| p1.6 | Living eval regression suite (`workspace/suite.json`) | DoD-complete |
| p1.7 | Standards model — Phase 1 disciplines (software-eng, security-eng, QA) | DoD-complete |
| p1.8 | Model risk documentation (`MODEL-RISK.md`) | DoD-complete |

**Phase 1 outcome:** A governed, self-verifiable delivery pipeline operating at single-squad, git-native surface scope. Distribution via pull model. CI assurance gate live. Three anchor discipline standards in place. Model risk register signed and pre-read gating adoption.

### Phase 2 — Scale, Observability, and Self-Improving Harness (2026-04-11 → 2026-04-12)

13 stories delivered across 5 epics. All PRs merged (#28–#31, #38, #41–#48). DoD-complete.

| Story | Title | Epic | Status |
|-------|-------|------|--------|
| p2.1 | `/definition` skill improvements (D1/D2/D3) | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.2 | `/review` incremental state write | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.3 | DoR/DoD template improvements | E1 — Pipeline Evolution Foundation | DoD-complete |
| p2.4 | `AGENTS.md` adapter (non-GitHub inner loop support) | E2 — Full Surface Adapter Model | DoD-complete |
| p2.5a | IaC + SaaS-API surface adapters | E2 — Full Surface Adapter Model | DoD-complete |
| p2.5b | SaaS-GUI + M365-admin + manual surface adapters | E2 — Full Surface Adapter Model | DoD-complete |
| p2.6 | EA registry resolver (Path A, 3-field stub contract) | E2 — Full Surface Adapter Model | DoD-complete |
| p2.7 | Fleet registry CI aggregation | E3 — Fleet Observability and Personas | DoD-complete |
| p2.8 | Non-engineer approval interface (approval-channel adapter) | E3 — Fleet Observability and Personas | DoD-complete |
| p2.9 | 8 remaining discipline standards (POLICY.md floors) | E4 — Standards and CI Validation | DoD-complete |
| p2.10 | Bitbucket Pipelines CI topology validation | E4 — Standards and CI Validation | DoD-complete |
| p2.11 | Improvement agent — failure pattern detection and diff proposal | E5 — Self-Improving Harness | DoD-complete |
| p2.12 | Improvement agent — challenger pre-check and proposal review | E5 — Self-Improving Harness | DoD-complete |

**Phase 2 outcome:** Full surface adapter model (all 6 types). Non-engineer approval channel. Fleet observability. Bitbucket Pipelines topology validated. All 11 discipline POLICY.md floors live. Self-improving harness (improvement agent) operational. Non-GitHub inner loop (`AGENTS.md`) supported.

---

## 2. Architectural Decisions (ADR-001 through ADR-006)

All ADRs are maintained in the live guardrails file: [`.github/architecture-guardrails.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/architecture-guardrails.md)

### ADR-001 — Single-file viz, no build step (Active, 2026-03-22)

`pipeline-viz.html` is a self-contained single file. No build step, no runtime npm dependencies, no external CDN. Opens directly in any browser from a local clone. Revisit trigger: file grows beyond ~3,000 lines and maintainability is significantly impacted.

### ADR-002 — Gates must use evidence fields, not stage-proxy (Active, 2026-03-22)

Every governance gate in `evaluateGate()` must read at least one evidence field from `pipeline-state.json` (`reviewStatus`, `dorStatus`, `dodStatus`, etc.). Stage-only checks are permitted as a fallback only where no evidence field yet exists and must be marked with a `// TODO: replace with evidence field` comment. Prevents false-positive gate passes when a stage is manually set without running the corresponding skill.

### ADR-003 — Schema-first: fields defined before use (Active, 2026-03-22)

Any field written to `pipeline-state.json` by a skill, or read by the viz, must be added to `pipeline-state.schema.json` in the same commit. Schema is the contract between skills and viz. Prevents stale schema, broken validators, and silent field drift.

### ADR-004 — `context.yml` is the single config source of truth (Active, 2026-03-22)

`.github/context.yml` is the canonical config file. Skills read it for all org-specific labels, tool integrations, compliance frameworks, and regulated-flag status. Nothing org-specific is hardcoded in skill instruction text or viz JS constants. Enables same skill library to operate across GitHub personal, GitHub Enterprise, Bitbucket, Jenkins, and enterprise AAIF-compliant environments without modification.

### ADR-005 — Agent instructions format is a surface adapter concern (Active, 2026-04-11)

The assembly script emits `.github/copilot-instructions.md` when `context.yml` sets `vcs.type: github`, and `AGENTS.md` otherwise. Content is identical. `AGENTS.md` is the Linux Foundation AAIF vendor-neutral standard. This decision unlocks distribution to non-GitHub inner loop tooling (Bitbucket, Jenkins, Cursor, Claude Code) without per-platform forks. Delivered by p2.4.

### ADR-006 — Approval-channel adapter pattern for DoR sign-off (Active, 2026-04-12)

Channel wiring for DoR sign-off is selected from `.github/context.yml` and implemented in channel-specific adapters. The core write contract is channel-agnostic and always updates the same evidence fields: `dorStatus`, `dorApprover`, `dorChannel`. Phase 2 reference path: `approval_channel: github-issue` with `/approve-dor` event handling. Off the table: hardcoding one approval channel into DoR skill logic. Delivered by p2.8.

### DEC-P3-002 — Tamper-evidence registry: GitHub-only implementation (2026-04-15)

**Decision recorded in:** `artefacts/2026-04-14-skills-platform-phase3/decisions.md`

Story p3.2b (T3M1 Q8 — tamper-evidence registry) is implemented using **GitHub Artifact Attestation with OIDC-signed workflow identity** in this reference repository (`heymishy/skills-repo` on GitHub). This is Option A of ASSUMPTION-02, resolved 2026-04-15.

**Enterprise adopters on Bitbucket must implement Option B.** GitHub Artifact Attestation is not available outside GitHub.com / GHES. The required Option B path for Bitbucket environments:

| Requirement | Detail |
|---|---|
| Registry | Separate read-only registry repository (e.g. `[org]/trace-registry`) |
| Branch protection | No human write access; only the CI service account may push |
| Credential | CI service account token with write access to the registry repo only — not a personal access token |
| Publication step | One append-only commit per story merge; `tamperEvidence.registryRef` records the commit SHA |
| Auditor retrieval | `git log` on the registry repo is sufficient — no special tooling required |

This is a **known divergence between the dogfood instance and enterprise deployment.** Q8 evidence produced by the dogfood instance (Artifact Attestation records) is not directly portable to a Bitbucket deployment — the registry type and retrieval mechanism differ. The independent re-verification procedure (recompute SHA-256 of the trace file; compare to the registry entry) is identical for both options — only the retrieval step differs.

**Action required at enterprise pilot onboarding:** Implement Option B for the enterprise Bitbucket instance. Do not use the dogfood `tamperEvidence.registryRef` entries as enterprise audit evidence — they reference GitHub Artifact Attestation records retrievable only from GitHub.

---

## 3. Known Gaps

### 3.1 T3M1 — Trace readability for risk review: 3/8 audit questions satisfied

**What T3M1 is:** `MODEL-RISK.md` defines eight audit questions that a risk reviewer must be able to answer from a trace alone, without engineering assistance. This is the governance readability test for the assurance trace. Full 8/8 satisfies the adoption gate for non-dogfood use.

**Current state (recorded 2026-04-12):** T3M1 evaluated against the first real Phase 2 inner loop trace (`workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl`, story p2.4, PR #31). Result: **3/8 Y** — Q1 (model identity), Q3 (standards injected), Q4 (trace transition complete) satisfied. **5 questions unanswered:**

| # | Question | Gap | Phase 3 fill target |
|---|---|---|---|
| Q2 | `standardsInjected` hashes visible and verifiable | Hash reconciliation not wired into CI trace write | p1.7 / p2.1 gate enhancement |
| Q5 | Watermark row visible in PR (pass/fail reason) | Watermark gate does not emit to PR comment | p1.4 PR reporting story |
| Q6 | `stalenessFlag` present in trace | Skill-version staleness field absent from trace schema | Phase 3 schema story |
| Q7 | Agent independence evidenced (three separate trace entries) | CI does not validate entry count or cross-session independence | Phase 3 CI gate story |
| Q8 | Hash recomputation confirms no drift since approval | Hash drift check not wired into assurance gate CI step | Phase 3 assurance story |

**Required action before non-dogfood adoption:** Re-run T3M1 evaluation against a real Phase 3+ trace after all five gaps are resolved. Full 8/8 unlocks the `MODEL-RISK.md` adoption gate. The sign-off record in `MODEL-RISK.md` Section 4 carries this as a condition of approval.

**Artefact:** `MODEL-RISK.md` → Section 3 (T3M1 evidence block) and Section 4 (sign-off conditions).

### 3.2 Docker-gated tests skipped (p2.10 AC3/AC4/AC5)

**What was skipped:** p2.10 story (8 remaining discipline standards — POLICY.md floors) includes 3 tests marked `[PREREQ-DOCKER]` covering AC3 (standards composition under a Docker-isolated environment), AC4 (POLICY.md floor constraint enforcement via Docker-based runner emulation), and AC5 (CI pipeline integration with Docker daemon available).

**Why:** The standard GitHub Copilot coding agent runner does not have Docker daemon available. These 3 tests were accepted as deferred at DoD with the `[PREREQ-DOCKER]` marker. The 12 non-Docker tests in p2.10 all pass.

**Required action:** Execute the 3 deferred tests in a Docker-enabled runner or CI environment (e.g. self-hosted GitHub Actions runner with Docker, or `services: docker:dind` in a CI job). No code changes required — the tests exist and expect the Docker daemon path. Recommendation: create a separate CI job scoped to `tests/p2.10-docker/**` that requires `docker` service.

**Artefact:** [`artefacts/2026-04-11-skills-platform-phase2/dod/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-11-skills-platform-phase2/dod) — look for files prefixed `p2.10-`

### 3.3 D-batch pending skill-file writes (D10 + D10a)

Two pipeline evolution proposals were identified during internal delivery and logged in `workspace/learnings.md` (2026-04-12 D-batch entry). They have not been written to skill files because they require a proper story + DoR cycle.

**D10 — `/definition-of-ready` dispatch forward pointer:**
Add a forward pointer from the DoR all-PROCEED batch exit to `/issue-dispatch`, plus a mandatory `git push origin master` gate that must pass before dispatch. This closes a gap where DoR can sign off in state without the branch being pushed, causing the dispatch to fail with a "ref not found" error.
Target file: [`.github/skills/definition-of-ready/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/definition-of-ready/SKILL.md)

**D10a — `/issue-dispatch` PR body `Closes #[issue]` guidance:**
Add explicit guidance to the issue-dispatch SKILL.md instructing the PR body template to include `Closes #[issue-number]`. This enables automatic GitHub issue close on PR merge and completes the dispatch loop without a manual close step.
Target file: [`.github/skills/issue-dispatch/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/issue-dispatch/SKILL.md)

**Required action:** Create Phase 3 (or short-track) stories for D10 and D10a. Do not edit skill files directly without a test plan and DoR.

---

## 4. Enterprise Adaptation Path

This section documents the specific configuration and integration changes required to operate the platform in a Bitbucket/Jenkins enterprise environment (e.g. Bank or equivalent regulated financial-services org using non-GitHub tooling).

> **Enterprise operator notice — this reference repo is GitHub-native.**
> The `heymishy/skills-repo` reference operates on GitHub with GitHub Actions CI and the GitHub Copilot coding agent as the inner loop agent. If your enterprise instance runs Bitbucket, each of the following differences applies. Read this notice before Sections 4.1–4.5 to understand what must change in your fork before running any inner loop story.
>
> | Aspect | This reference repo | Your enterprise instance | Required action |
> |--------|---------------------|--------------------------|------------------|
> | VCS | GitHub | Bitbucket (Cloud or DC) | Set `vcs.type: bitbucket` in `.github/context.yml` before running any skill. |
> | Inner loop agent | GitHub Copilot coding agent | **Not available** — GitHub Copilot agent requires a GitHub.com or GHES repo | Use Cursor, Claude Code, or another AAIF-compliant tool that reads `AGENTS.md` at repo root. The inner loop instructions are identical — only the file name changes. |
> | Agent instructions file | `.github/copilot-instructions.md` | `AGENTS.md` at repo root | Run `scripts/assemble-copilot-instructions.sh` with `vcs.type: bitbucket` set; it emits `AGENTS.md`. Do not manually create `.github/copilot-instructions.md` — it will be ignored by non-GitHub tooling. |
> | Issue dispatch (`/issue-dispatch`) | Creates GitHub Issues to trigger coding agent | GitHub Issues not available | Skip `/issue-dispatch`. Trigger inner loop tasks manually in your chosen AAIF tool by pointing it at the DoR artefact. |
> | CI | GitHub Actions (`.github/workflows/`) | Bitbucket Pipelines (`bitbucket-pipelines.yml`) | Port the three workflow files (`assurance-gate.yml`, `trace-commit.yml`, `governance-sync.yml`) to Bitbucket Pipelines step syntax. The Node.js scripts they invoke are CI-agnostic — no changes to the scripts are required. |
> | Approval channel | `github-issue` (`/approve-dor` GitHub Actions workflow) | Not available | Set `approval_channel: jira`, `teams`, or `confluence` in `.github/context.yml`. Do **not** set `github-issue` — the GitHub Actions handler will not exist in a Bitbucket repo. |
> | Branch protection (`traces` branch) | GitHub branch ruleset: push allowed only from `trace-commit.yml` workflow identity | Bitbucket branch permissions | Create the `traces` branch and set a Bitbucket branch permission restricting pushes to the CI service account identity running the assurance gate step. The principle is identical; the mechanism is Bitbucket-specific. |
> | Raw artefact links in this document | `https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/[path]` | Bitbucket raw URL pattern | When distributing this handoff document internally, substitute: `https://bitbucket.org/[workspace]/[repo]/raw/master/[path]` for all raw links. |

### 4.1 VCS and CI topology: Bitbucket Pipelines

Set `vcs.type: bitbucket` in `.github/context.yml`. The assembly script (`scripts/assemble-copilot-instructions.sh`) will emit `AGENTS.md` at the repo root instead of `.github/copilot-instructions.md`. Content is identical — the format switch is the only change.

For CI: the Bitbucket Pipelines topology was validated in Phase 2 (p2.10). The CI gate triggers on `pull-request: opened, updated` events using the `bitbucket-pipelines.yml` equivalents of the GitHub Actions workflow defined in `.github/workflows/`. The same Node.js check scripts (`check-governance-sync.js`, `check-viz-syntax.js`, `check-skill-contracts.js`, `check-pipeline-artefact-paths.js`, `run-assurance-gate.js`) run identically — they are plain CommonJS with no GitHub-specific dependencies.

For Jenkins: set `tools.ci_platform: jenkins` in `.github/context.yml`. Adapt the pipeline definition to a `Jenkinsfile` using the same `npm test` entry point. The `validate-trace.sh` script requires Python 3 + `jsonschema` + `pyyaml` — these must be available on the Jenkins agent.

### 4.2 Agent instructions format: `AGENTS.md`

With `vcs.type: bitbucket` (or any non-`github` value), the assembled instructions file is written to `AGENTS.md` at the repo root. This is the Linux Foundation AAIF vendor-neutral standard consumed by Cursor, Claude Code, and other compliant inner loop tools. No content change is required — the format change is entirely driven by `vcs.type`.

For Cursor or Jetbrains AI Assistant: `AGENTS.md` at repo root is automatically picked up by both tools as the agent instruction file, provided the project is set to use agent mode.

### 4.3 Approval channel: enterprise adapters

The approval-channel adapter pattern (ADR-006) is configured in `.github/context.yml` under `approval_channel`. Available adapter values after Phase 2:

| `approval_channel` value | Mechanism | Required setup |
|---|---|---|
| `github-issue` | Approver posts `/approve-dor` as a comment on the linked GitHub issue; GitHub Actions workflow writes `dorStatus: signed-off` to `pipeline-state.json` | GitHub repo + Actions enabled |
| `jira` | Jira ticket status transitions to the configured approval status; webhook writes the dorStatus update | Jira webhook + pipeline-state write endpoint |
| `confluence` | Confluence page approval workflow; page macro writes dorStatus on approval | Confluence + REST API access |
| `slack` | Workspace slash command `/approve-dor [story-id]`; Slack app writes dorStatus | Slack app with write-back webhook |
| `teams` | Teams adaptive card approval; Power Automate flow writes dorStatus | Microsoft 365 + Power Automate |

For a Enterprise regulated environment: the recommended path is `approval_channel: jira` (where Jira Service Management is the change management tool) or `approval_channel: teams` (where Microsoft 365 is the standard approver surface). Both adapters write the same evidence fields (`dorStatus`, `dorApprover`, `dorChannel`) — the state contract and gate evaluation logic are unchanged.

**Enterprise RBAC note:** The write-back webhook or service account that updates `pipeline-state.json` must have repo write access scoped to the state file only. Do not grant broad repo write access to the approval adapter service account.

### 4.4 Regulated environment compliance flags

Set `governance.regulated: true` in `.github/context.yml` to enable the regulated-environment guardrail checks. This flag activates:
- Mandatory `/decisions` log entry for every story before DoR sign-off
- Stricter AC traceability requirements in `/review` (all ACs must map to a named compliance framework clause)
- PR body must include a change reference field (mapped to ServiceNow or Jira-SM ticket via `change_management.tool`)
- Audit NFR (traceable commit messages) is enforced as a CI gate check, not just a MUST standard

Set `change_management.tool: servicenow` (or `jira-sm`) and populate `change_management.base_url`, `change_management.assignment_group`, and `change_management.change_category` to enable the `/release` skill's automated change request body generation.

### 4.5 Standards extension: discipline tiers

The Phase 2 POLICY.md floor model is live for all 11 disciplines. For enterprise-specific domain extensions (e.g. APRA CPS 234 controls, internal security classification policy, RG 271 obligations), add entries under `standards/[discipline]/` using the established composition model:

```
standards/
  [discipline]/
    core.md           ← universal baseline MUST/SHOULD/MUST NOT requirements
    POLICY.md         ← minimum floor for this discipline; referenced at assurance gate time
```

Domain-tier extensions (squad-specific overrides) are declared in the squad's `context.yml` under `standards.domain_extensions`. The assurance agent's standards injection step reads `context.yml` and includes the declared domain extensions alongside the core standards in the trace's `standardsApplied` array.

---

## 5. Quick Reference

| Item | Path |
|------|------|
| Pipeline state (live) | [`.github/pipeline-state.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/pipeline-state.json) |
| Architecture guardrails + ADRs | [`.github/architecture-guardrails.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/architecture-guardrails.md) |
| Context configuration | [`.github/context.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/context.yml) |
| Model risk register | [`docs/MODEL-RISK.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/MODEL-RISK.md) |
| Onboarding | [`docs/ONBOARDING.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/docs/ONBOARDING.md) |
| Skills (all phases) | [`.github/skills/`](https://github.com/heymishy/skills-repo/tree/master/.github/skills) — one `SKILL.md` per subdirectory |
| Post-merge improvement skill | [`.github/skills/improve/SKILL.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/skills/improve/SKILL.md) (formerly `levelup/`) |
| Coding agent orientation | [`.github/instructions/agent-orientation.instructions.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/.github/instructions/agent-orientation.instructions.md) |
| Standards index | [`standards/index.yml`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/standards/index.yml) + [`standards/`](https://github.com/heymishy/skills-repo/tree/master/standards) |
| Phase 1 artefacts | [`artefacts/2026-04-09-skills-platform-phase1/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-09-skills-platform-phase1) |
| Phase 2 artefacts | [`artefacts/2026-04-11-skills-platform-phase2/`](https://github.com/heymishy/skills-repo/tree/master/artefacts/2026-04-11-skills-platform-phase2) |
| Estimation actuals | [`workspace/phase2-actuals.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/phase2-actuals.md) |
| State and checkpoint | [`workspace/state.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/state.json) |
| Eval regression suite | [`workspace/suite.json`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/suite.json) |
| Delivery traces | [`workspace/traces/`](https://github.com/heymishy/skills-repo/tree/master/workspace/traces) (files); `origin/traces` branch (permanent store) |
| Improvement proposals | [`workspace/proposals/`](https://github.com/heymishy/skills-repo/tree/master/workspace/proposals) |
| Adoption readiness (RAG) | [`workspace/adoption-readiness.md`](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/workspace/adoption-readiness.md) |

**`traces` branch — ruleset note:** The `traces` branch is a permanent append-only branch that holds all CI assurance trace JSONL files. It is written exclusively by the `trace-commit.yml` GitHub Actions workflow (github-actions bot push) after each inner loop PR merge. No human direct-push is permitted; no PR is required to write to this branch. The branch ruleset should allow pushes only from the `trace-commit.yml` workflow identity. **Fleet fork operators (GitHub):** recreate the `traces` branch and matching branch ruleset on your fork before running any inner loop story. Without the branch and ruleset in place, the `trace-commit.yml` post-merge step will fail silently and traces will be lost. **Bitbucket operators:** create the `traces` branch and restrict pushes via Bitbucket branch permissions to the CI service account; the GitHub Actions ruleset does not apply. The Bitbucket Pipelines equivalent of `trace-commit.yml` performs the same append-and-push step using the Bitbucket Pipelines OIDC identity.

---

## 6. Phase 3 Initialisation (2026-04-13)

### 6.1 Entry condition met

T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit) is on record in `MODEL-RISK.md` with Hamish sign-off 2026-04-12, outcome "approved with conditions", 3/8 Y baseline. Phase 3 /discovery is unblocked. The five T3M1 gap closures (Q2, Q5, Q6, Q7, Q8 — see Section 3.1) become Phase 3 story candidates.

**Raw artefact links for reconstruction** (use these if working from a fork, partial clone, or outside this repo):

| Artefact | Raw URL |
|----------|---------|
| MODEL-RISK.md (T3M1 evidence + sign-off) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/MODEL-RISK.md |
| Phase 1 discovery | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/discovery.md |
| Phase 1 benefit-metric | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md |
| Phase 1 decisions | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/decisions.md |
| Phase 1 p1.8 DoR (model risk story) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor.md |
| Phase 1 p1.8 DoR contract | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor-contract.md |
| Phase 2 discovery | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/discovery.md |
| Phase 2 benefit-metric | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md |
| Phase 2 decisions | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md |
| Phase 2 p2.4 DoR (T3M1 evaluation trace story) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor.md |
| Phase 2 p2.11 DoR (improvement agent) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.11-improvement-agent-trace-proposals-dor.md |
| T3M1 evaluation trace (p2.4 / PR #31) | https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/traces/workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl |

### 6.2 /levelup renamed to /improve

The post-merge learning extraction skill has been renamed from `/levelup` to `/improve`. The rename reflects iterative lean-improvement intent without requiring familiarity with gaming or level-up terminology. The skill directory moved from `.github/skills/levelup/` to `.github/skills/improve/`.

**Scope of rename:** SKILL.md frontmatter and body; `config.yml`; `.github/pipeline-state.json` (fields `lastImprove`, `improveNotes`); `workspace/suite.json` (task `s-improve`); `skill-pipeline-instructions.md`; `estimate/SKILL.md`; `bootstrap/SKILL.md`; `discovery/SKILL.md`; `README.md` (all 9 references); `workspace/adoption-readiness.md` (MM2, MM4); `.github/pull_request_template.md`; `.github/templates/definition-of-done.md`; `.github/architecture-guardrails.md`; `feature-additions.md`; `CHANGELOG.md`; `workspace/learnings.md` (forward-looking action items). Historical entries that record what ran at the time (e.g. session logs, Phase 2 /improve D-batch heading) retain the original `levelup` text as factual records.

### 6.3 D-batch: copilot-instructions.md slimmed

The `copilot-instructions.md` base layer has been slimmed from 473 lines to ~280 lines (D-batch items 1–5 from the 2026-04-12 learnings.md entry). Content removed:

| Item | What moved / removed | Where |
|------|---------------------|-------|
| D-batch 1 | Coding agent orientation (orient, structure, verify, PR-open steps; "What the coding agent should NOT do") | Extracted to `.github/instructions/agent-orientation.instructions.md` with `applyTo: "**"` |
| D-batch 2 | 34-row templates table (~49 lines) | Replaced with single sentence: "All artefact templates are in `.github/templates/` — each skill references its own template in its SKILL.md." |
| D-batch 3 | Artefact storage directory tree (~45 lines) | Replaced with 3-line naming convention statement |
| D-batch 4 | Context handoff protocol (~28 lines) | Replaced with 2-line instruction |
| D-batch 5 | Product context files table (~18 lines) | Replaced with 1-line pointer |

New `.github/instructions/agent-orientation.instructions.md` — scoped to GitHub Actions coding agent context. Contains: 4-step orientation (orient from artefacts, understand structure, verify baseline, open PRs as drafts), "When to stop" guidance, "What the coding agent should NOT do" (7 items, including: do not directly edit SKILL.md files, templates, or standards files).

### 6.4 Platform change PR policy (active from Phase 2 complete)

All changes to `.github/skills/`, `.github/templates/`, `standards/`, `.github/governance-gates.yml`, and `scripts/` must be merged via PR — not committed directly to the default branch. This policy is documented in `copilot-instructions.md` under "Platform change policy (Phase 2+)". It is a process control today, pending a CODEOWNERS rule for hard enforcement. The current branch (`feat/phase3-init-rename-improve`) is the first instance of this policy in practice.

### 6.5 Governed upward standards loop

When `/improve` identifies a pattern that warrants a SKILL.md update, the flow is:

1. `/improve` produces a `proposed-skill-update.md` diff in `workspace/proposals/` with rationale and confidence score.
2. Squad lead reviews the proposal and raises a PR against the fleet repo.
3. Platform team reviews and merges.
4. Consuming repos receive the update on their next skills sync (`.github/context.yml` `skills_upstream` configuration).

`/improve` does not edit SKILL.md files directly. The improvement agent's diff proposals follow the same path. This creates a single governed channel for all upward standards updates regardless of whether they originate from a human operator or the improvement agent.

### 6.6 README additions

Two new sections added to `README.md` in this Phase 3 init:

**"Current state vs structural controls"** — documents what is currently structural (artefact read-only instruction, DoR scope immutability, assurance gate CI, CODEOWNERS/branch protection, POLICY.md floors) vs what is currently process-assurance (DoR sign-off authority, T3M1 completeness, non-engineer approval channel, platform change governance). Clarifies the entitlements model: the platform validates the upstream chain; entitlements protect the act of merging. First explicit statement that "for the first time, the chain from story → feature → initiative → benefit hypothesis is machine-traversable."

**"Conceptual lineage"** — attribution table covering: tikalk agentic-sdlc-spec-kit, Karpathy autoresearch loop, Agent OS, BMAD Method, OpenHarness (HKUDS), NeoSigma auto-harness, AutoAgent (ThirdLayer), financial services maker/checker controls, IAM entitlements model. Novel (not derived) contributions listed explicitly: regulated-enterprise governance model, three-tier standards inheritance, surface-as-branching-dimension, benefit traceability at fleet scale, dog-fooding constraint as governance signal.

### 6.7 Adoption readiness current state

`workspace/adoption-readiness.md` is current as of 2026-04-13. Amber items:

- **M1** — requires a genuine second operator completing a full outer loop unassisted (enterprise pilot entry event).
- **MM2** — requires running `scripts/parse-session-timing.js` against Phase 2 transcripts to produce the E3 actuals row in `workspace/estimation-norms.md`. ~30-minute operator action, no new code required.
- **MM4** — closes at Phase 3 `/improve` when the third feature's actuals are ingested. Error bound until then: ±40%.

Red item: **M5** — non-engineer approval requires a live configured environment and a real approver. Requires scoping effort before ent. pilot can claim this outcome.

---

## 7. Story Implementation Reference (Upgrade-Path Agent Index)

This section is the entry point for an agent upgrading a working pre-Phase-1 baseline to the full Phase 1 + Phase 2 feature set. CHANGELOG.md and this document provide the architectural context and decision rationale; the DoR (Definition of Ready) artefacts and test plans are the authoritative implementation spec and acceptance criteria for each story.

### Pre-Phase-1 baseline state

Before applying p1.1, verify your repo is in this exact state. Applying stories to a repo that already has partial implementations will cause contract conflicts.

| File / path | Expected state before p1.1 |
|-------------|---------------------------|
| `workspace/state.json` | Does not exist |
| `.github/workflows/` | No `assurance-gate.yml`, no `trace-commit.yml`, no `governance-sync.yml` |
| `src/surface-adapter/` | Does not exist — no `execute()` interface |
| `standards/` | No `POLICY.md` files in any subdirectory |
| `config.yml` | No `skills` array |
| `workspace/suite.json` | Does not exist |
| `docs/MODEL-RISK.md` | Does not exist |
| `fleet-state.json` | Does not exist |

### Reading order for an upgrade-path agent

1. Read [CHANGELOG.md](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/CHANGELOG.md) in full for the "what" and "why" across all stories.
2. Verify the baseline state table above. If any file listed as "does not exist" is already present with a different shape, stop and reconcile before proceeding — do not assume story contracts will hold if structural files already exist.
3. Work through each story in the table below, in phase and story-ID order (p1.1 → p1.8, then p2.1 → p2.12). Respect the "Depends on" column — do not start a story until every listed dependency is DoD-complete and its tests pass.
4. For each story: read the DoR (scope contract + Coding Agent Instructions block), then the DoR contract (exact file touchpoints + out-of-scope constraints), then the test plan (failing tests you must make pass). For p2.6 onwards there is no separate contract file — the DoR contains the full spec, including a "What will be built / What will NOT be built" section equivalent to the contract.
5. **Manual-only ACs are not covered by `npm test`.** Several test plans contain ACs marked `Manual` only (e.g. p1.1 AC2 — live distribution cycle observation; p1.3 AC4 — reviewer inspects GitHub PR UI; p1.5 AC3a — stopwatch during live `/checkpoint` invocation). `npm test` covers only the automated unit/integration layer. Check each test plan's AC coverage table for rows where only `Manual` is ticked; those require operator validation after the automated layer passes.
6. **Do not run `npm test` mid-stream.** The 22-check suite validates structural completeness of the full repo (skill-contracts expects 37 skills; pipeline-paths expects 14 paths and 32 reader links; workspace-state requires both `cycle.discovery` and `cycle.benefitMetric` blocks). Running it after a single story will produce expected failures because downstream artefacts do not yet exist. Run `npm test` only at the two gate points: (a) after all Phase 1 stories are applied — must be 22/22 before starting Phase 2; (b) after all Phase 2 stories are applied — final gate.
7. **p2.6 requires a decisions log entry before any code is written.** Read [decisions.md — ASSUMPTION-02 and RESOLUTION-ASSUMPTION-02](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md) before implementing p2.6. The DoR was initially BLOCKED because the EA registry field names (`technology.hosting`, `owner`) had not been confirmed. ASSUMPTION-02 confirmed them from the live registry schema at `https://github.com/heymishy/ea-registry` (commit `7d9edae`). The field names in the DoR and test plan already reflect the resolved values — but reading the resolution ensures you understand why `surfaceType` and `teamId` do not appear in the test fixtures.

**Raw URL pattern for fork operators:**
- GitHub: `https://raw.githubusercontent.com/[owner]/[repo]/refs/heads/master/[path]`
- Bitbucket: `https://bitbucket.org/[workspace]/[repo]/raw/master/[path]`

### Phase 1 Stories

p1.3–p1.8 are independent of each other and can be applied in any order after p1.1 and p1.2. p1.2 must come after p1.1 due to the shared `context.yml` schema coordination point (explicitly stated in the p1.2 contract).

| Story | Title | Depends on | DoR | Contract | Test plan |
|-------|-------|-----------|-----|----------|-----------|
| p1.1 | Distribution infrastructure and progressive skill disclosure | — (start here) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.1-distribution-progressive-disclosure-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.1-distribution-progressive-disclosure-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.1-distribution-progressive-disclosure-test-plan.md) |
| p1.2 | Surface adapter model — foundations (git-native, Path B) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.2-surface-adapter-model-foundations-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.2-surface-adapter-model-foundations-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.2-surface-adapter-model-foundations-test-plan.md) |
| p1.3 | Assurance agent as automated CI gate | p1.1, p1.2 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.3-assurance-agent-ci-gate-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.3-assurance-agent-ci-gate-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.3-assurance-agent-ci-gate-test-plan.md) |
| p1.4 | Watermark gate | p1.2, p1.3 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.4-watermark-gate-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.4-watermark-gate-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.4-watermark-gate-test-plan.md) |
| p1.5 | `workspace/state.json` and session continuity | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.5-workspace-state-session-continuity-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.5-workspace-state-session-continuity-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.5-workspace-state-session-continuity-test-plan.md) |
| p1.6 | Living eval regression suite (`workspace/suite.json`) | p1.3 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.6-living-eval-regression-suite-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.6-living-eval-regression-suite-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.6-living-eval-regression-suite-test-plan.md) |
| p1.7 | Standards model — Phase 1 disciplines (software-eng, security-eng, QA) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.7-standards-model-phase1-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.7-standards-model-phase1-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.7-standards-model-phase1-test-plan.md) |
| p1.8 | Model risk documentation (`MODEL-RISK.md`) | p1.1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/dor/p1.8-model-risk-documentation-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-09-skills-platform-phase1/test-plans/p1.8-model-risk-documentation-test-plan.md) |

**Phase 1 gate:** Run `npm test` (22/22 expected) before proceeding to Phase 2. If any check fails, fix it before starting p2.1 — Phase 2 stories build on top of Phase 1 structural files and will behave incorrectly if the Phase 1 baseline is broken.

### Phase 2 Stories

Stories p2.1–p2.5b each have a separate DoR contract file. Stories p2.6–p2.12 were delivered under a streamlined DoR process — the DoR file is the complete spec; no separate contract file was produced. All Phase 2 stories depend on all Phase 1 stories being DoD-complete; the "Depends on" column lists cross-Phase-2 dependencies only.

| Story | Title | Depends on | DoR | Contract | Test plan |
|-------|-------|-----------|-----|----------|-----------|
| p2.1 | `/definition` skill improvements (D1/D2/D3) | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.1-definition-skill-improvements-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.1-definition-skill-improvements-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.1-definition-skill-improvements-test-plan.md) |
| p2.2 | `/review` incremental state write | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.2-review-incremental-write-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.2-review-incremental-write-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.2-review-incremental-write-test-plan.md) |
| p2.3 | DoR/DoD template improvements | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.3-dor-dod-template-improvements-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.3-dor-dod-template-improvements-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.3-dor-dod-template-improvements-test-plan.md) |
| p2.4 | `AGENTS.md` adapter (non-GitHub inner loop support) | p1.1 (assembly script), p1.2 (surface adapter) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.4-agents-md-adapter-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.4-agents-md-adapter-test-plan.md) |
| p2.5a | IaC + SaaS-API surface adapters | p1.2 (`execute()` interface) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5a-iac-saas-api-adapters-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5a-iac-saas-api-adapters-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.5a-iac-saas-api-adapters-test-plan.md) |
| p2.5b | SaaS-GUI + M365-admin + manual surface adapters | p1.2 (`execute()` interface), p2.5a | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5b-saas-gui-m365-manual-adapters-dor.md) | [Contract](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.5b-saas-gui-m365-manual-adapters-dor-contract.md) | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.5b-saas-gui-m365-manual-adapters-test-plan.md) |
| p2.6 ¹ | EA registry resolver (Path A) | p1.2 (`execute()` interface), p2.5a, p2.5b | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.6-ea-registry-path-a-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.6-ea-registry-path-a-test-plan.md) |
| p2.7 | Fleet registry CI aggregation | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.7-fleet-registry-ci-aggregation-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.7-fleet-registry-ci-aggregation-test-plan.md) |
| p2.8 | Non-engineer approval interface (approval-channel adapter) | All Phase 1 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.8-persona-routing-non-engineer-approval-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.8-persona-routing-non-engineer-approval-test-plan.md) |
| p2.9 | 8 remaining discipline standards (POLICY.md floors) | p1.7 (Phase 1 standards model) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.9-discipline-standards-remaining-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.9-discipline-standards-remaining-test-plan.md) |
| p2.10 | Bitbucket Pipelines CI topology validation | p1.3 (CI gate exists to port) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.10-bitbucket-ci-validation-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.10-bitbucket-ci-validation-test-plan.md) |
| p2.11 | Improvement agent — failure pattern detection and diff proposal | p1.3 (CI gate trace files), p1.6 (suite.json) | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.11-improvement-agent-trace-proposals-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.11-improvement-agent-trace-proposals-test-plan.md) |
| p2.12 | Improvement agent — challenger pre-check and proposal review | p2.11 | [DoR](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/dor/p2.12-improvement-agent-challenger-skill-dor.md) | — | [Test plan](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/test-plans/p2.12-improvement-agent-challenger-skill-test-plan.md) |

**¹ p2.6 — ASSUMPTION-02 resolution required before implementation.** The DoR was initially BLOCKED because the EA registry field names had not been confirmed. Read [decisions.md — ASSUMPTION-02 and RESOLUTION-ASSUMPTION-02](https://raw.githubusercontent.com/heymishy/skills-repo/refs/heads/master/artefacts/2026-04-11-skills-platform-phase2/decisions.md) before writing any code. The resolved field mapping is: `technology.hosting` (enum `saas`/`cloud`/`on-prem`/`hybrid`) → surface type; `owner` → squad identifier; `adapter_override` in `context.yml` (not in registry schema) → granular surface type override for `saas-gui` and `m365-admin`. The DoR and test plan fixtures already reflect these resolved values — reading the resolution log explains why `surfaceType` and `teamId` do not appear anywhere in the implementation.

**Phase 2 gate:** Run `npm test` (22/22 expected). All checks must pass before claiming Phase 2 complete. Note: the 3 `[PREREQ-DOCKER]` tests in p2.10 are deferred — they require a Docker-enabled runner (see Section 3.2). The remaining 19 automated checks will all pass without Docker.
