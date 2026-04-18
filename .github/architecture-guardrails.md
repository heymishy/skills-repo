# Architecture Guardrails

<!--
  PURPOSE: Single source of truth for architectural standards, design constraints,
  and active repo-level ADRs that apply across all features in this repository.

  This file is READ by:
  - /definition skill (Step 1.5 — Architecture constraints scan before story decomposition)
  - /review skill (Category E — Architecture compliance check)
  - /definition-of-ready skill (H9 — Guardrail compliance hard block)
  - /trace skill (Architecture compliance check in chain validation)
  - Coding agent (Constraints block in DoR artefact — agent must not violate these)

  Per-feature decisions live in artefacts/[feature]/decisions.md
  Structural decisions that constrain future features are promoted to Active ADRs here.

  To evolve: update this file, open a PR, tag tech lead for review.
-->

**Last updated:** 2026-04-16
**Maintained by:** Repo owner (solo)

---

## What This Repo Is

This repository is a **skills-based SDLC pipeline library** — not an application.
It contains:
- `dashboards/pipeline-viz.html` — single-file HTML/CSS/JS pipeline visualisation tool
- `.github/skills/*/SKILL.md` — agent skill instruction files (Markdown)
- `.github/templates/*.md` — artefact templates (Markdown)
- `.github/pipeline-state.json` + `pipeline-state.schema.json` — live + schema state files
- `.github/scripts/` — Node.js pre-commit hooks and validators
- `artefacts/` — per-feature pipeline artefacts produced during delivery

Architecture guardrails apply to changes to the viz (`dashboards/pipeline-viz.html`), the schema (`pipeline-state.schema.json`), and any new scripts added under `.github/scripts/`.

Skill files and templates are content, not code — they are governed by pipeline process, not these guardrails.

---

## Pattern Library

**N/A** — no external component library. The viz is intentionally self-contained (no npm dependencies at runtime).

---

## Style Guide

**Viz (`dashboards/pipeline-viz.html`):**
- All styles live in the inline `<style>` block — no external CSS files
- CSS custom properties (`--var-name`) for all colours and spacing values
- No CSS frameworks (Bootstrap, Tailwind, etc.) — keep the file self-contained
- Class names use kebab-case (`.feature-card`, `.governance-gate`)

**Scripts (`.github/scripts/`):**
- Plain Node.js — no TypeScript, no transpilation
- No external npm dependencies in pre-commit hooks (must run with only `node` available)
- CommonJS modules (`require`) unless the whole repo adopts ESM (see ADR-001)

**Skill and template files (`.github/skills/`, `.github/templates/`):**
- Markdown only — no embedded HTML except HTML comments for instructions
- Follow the established section headings used in existing files
- No trailing whitespace; Unix line endings

---

## Reference Implementations

| Capability | Reference path | Notes |
|---|---|---|
| Feature card rendering | `dashboards/pipeline-viz.html` — `featureCardHTML()` | Pattern for how state fields map to UI elements |
| Governance gate evaluation | `dashboards/pipeline-viz.html` — `evaluateGate()` | Pattern for reading state fields and producing pass/warn/fail |
| JSON schema definition | `.github/pipeline-state.schema.json` | All new state fields must be added here before being used |
| Pre-commit validation | `.github/scripts/check-viz-syntax.js` | Pattern for adding new validators |
| Skill structural contracts | `.github/scripts/check-skill-contracts.js` | Defines required markers per skill; extend when adding structural invariants |
| Pipeline artefact path consistency | `.github/scripts/check-pipeline-artefact-paths.js` | Validates writer/reader path links across all skills; update PIPELINE_PATHS when a skill changes its output path |

---

## Approved Patterns

- **Viz architecture:** Single-file HTML — all JS, CSS, and markup inline in `dashboards/pipeline-viz.html`. No build step. No external runtime dependencies.
- **State access in viz:** Read from the parsed `pipelineState` global — never fetch or import. State is loaded via `<script>` tag injection or `fetch('./pipeline-state.json')`.
- **Gate logic:** Gate pass/fail is determined by reading specific evidence fields from `pipeline-state.json` stories — not by checking `feature.stage` alone (see ADR-002).
- **Schema evolution:** Add new fields to `pipeline-state.schema.json` at the same time as adding them to any skill or viz code that reads or writes them. Schema and implementation stay in sync.
- **Config reading in skills:** Skills read `.github/context.yml` for org/tooling config. Never hardcode tool names, branch names, or org labels in skill instruction text — use `context.yml` fields.
- **Execution pre-condition gate on runtime artefact existence:** When a story requires a live-environment artefact to exist before it can be meaningfully implemented or tested (e.g. a real trace file in `workspace/traces/`), express this as a DoR PROCEED-BLOCKED condition keyed on artefact path existence — not as an AC caveat or a note. The story is dispatched only when the gate condition is met.
- **Group instruction-text-only changes at the same exit point into a single story:** When multiple pipeline gaps are all resolved by changes to the same SKILL.md at the same exit sequence, group them into one story. Separate review/DoR pass-through cycles for trivially co-located changes produce overhead without quality uplift. Exceptions: if grouped changes share an exit point but have independent failure modes, separate them.
- **Two-workflow CI audit pattern:** Governance gate fires on `pull_request` with `contents: read` — evaluates, uploads artifact, posts verdict comment, exits. A separate post-merge workflow fires on `push` to main with `contents: write` — downloads artifact, commits audit record to `workspace/traces/`. The two workflows have non-overlapping permission grants and separate trigger events. This structurally enforces maker/checker independence: the evaluator cannot modify its own evaluation target.
- **`git commit --allow-empty` to force required check re-run:** When a required check shows "Waiting for status" after a push (because GitHub did not generate a new `synchronize` event, or a bot commit moved the HEAD SHA without re-triggering the gate), use `git commit --allow-empty -m "ci: trigger <gate> on <sha>"` to create a minimal new SHA that produces a clean `synchronize` event. Never use "Re-run jobs" when a workflow YAML has itself been modified between the failure and the retry — re-running uses the old YAML.

---

## Anti-Patterns

| Anti-pattern | Reason | Approved alternative |
|---|---|---|
| Gate logic that only checks `feature.stage` | Stage can be manually set — produces false passes | Read specific evidence fields (`reviewStatus`, `dorStatus`, `dodStatus`, etc.) |
| Hardcoding org/tool names in skill files | Breaks when context changes; violates configurability | Use `context.yml` fields via the skill's config-reading step |
| External CDN dependencies in viz at runtime | Breaks offline use; supply chain risk | Bundle or inline, or omit |
| Adding fields used by viz/skills but not in schema | Schema becomes stale; validators miss them | Add to `pipeline-state.schema.json` simultaneously |
| Committing changes to `dashboards/pipeline-viz.html` without passing `check-viz-syntax.js` | Breaks the pre-commit gate silently | Run `node .github/scripts/check-viz-syntax.js` locally before committing |
| Deleting or mutating pipeline artefacts in `pipeline-state.json` directly | Can corrupt feature history | Use skills to write state; manual edits only for scaffolding |
| Bundling changes from story B into story A's PR | Makes root-cause traceability noisy; DoD evidence becomes ambiguous; violates ADR-008 | One PR per story; amend the DoR contract if scope genuinely expands |
| Committing runtime artefact churn (trace files, validation reports) in story branches | Non-functional CI side effects inflate diff noise and make PR review harder | Add generated runtime paths to `.gitignore`; do not commit `workspace/traces/` or `trace-validation-report.json` in story branches |
| Committing a new SKILL.md, `src/` module, or governance check script without a story artefact | Breaks the traceability claim the platform makes; creates BETWEEN-STORIES items with no reproducible spec. Evidenced by the 2026-04-16 artefact coverage audit (11 uncovered items, 2 HIGH-risk) | Create a story and DoR first (forward-looking) or a retrospective story using `.github/templates/retrospective-story.md` (if already committed). Use `# no-artefact: [reason]` in a governed exemption list for explicitly excluded low-risk items. |
| Required-check workflow committing back to the branch it evaluates | Fires a new `synchronize` event on every evaluation — gate re-triggers itself → infinite loop; the evaluator modifies its own evaluation target | Two-workflow pattern: evaluate on `pull_request` with `contents: read`, persist post-merge with `contents: write` on `push` to main |
| Using `[ci skip]` on a branch with required checks | Suppresses all workflow runs on that SHA, including required status reporters; the SHA is permanently stuck on "Waiting for status" with no way to recover without a new commit | Reserve `[ci skip]` for direct housekeeping commits to main where no required checks apply |

---

## Mandatory Constraints

### Correctness
- All new governance gate logic in the viz must read at least one evidence field from `pipeline-state.json` (not stage alone)
- Any field written to `pipeline-state.json` by a skill must exist in `pipeline-state.schema.json`
- Any field read by the viz from `pipeline-state.json` must exist in `pipeline-state.schema.json`

### Self-containment
- `dashboards/pipeline-viz.html` must open and render correctly without any build step, server, or network access
- No npm `devDependencies` may be added to `dashboards/pipeline-viz.html` at runtime; pre-commit scripts may use Node.js built-ins only

### Security
- No user-supplied content is ever injected into innerHTML without sanitisation
- No credentials, tokens, or personal data in `pipeline-state.json` or any committed artefact
- The viz reads local JSON only — no external fetch calls

### Consistency
- When a skill adds or removes a pipeline stage, the `stage` enum in `pipeline-state.schema.json` is updated in the same commit
- When a governance gate is added or removed from `GOVERNANCE_GATES` in the viz, the corresponding skill's SKILL.md is reviewed to confirm the gate criteria matches the skill's actual checks

### Accessibility
- All interactive elements in the viz must be keyboard-accessible
- Colour alone must not be the only indicator of gate pass/fail/warn status (icons or labels must also be present)

---

## Active Repo-Level ADRs

| # | Status | Title | Constrains |
|---|---|---|---|
| ADR-001 | Active | Single-file viz, no build step | `dashboards/pipeline-viz.html` architecture |
| ADR-002 | Active | Gates must use evidence fields, not stage-proxy | All `evaluateGate()` implementations |
| ADR-003 | Active | Schema-first: fields defined before use | `pipeline-state.schema.json` evolution |
| ADR-004 | Active | `context.yml` is the single config source of truth | Skill files, viz config reading |
| ADR-005 | Active | Agent instructions format is a surface adapter concern driven by `vcs.type` | Assembly script, skill distribution |
| ADR-006 | Active | Approval-channel adapter pattern for non-engineer DoR sign-off | DoR routing workflows, state write path |
| ADR-007 | Active | EA registry surface-type mapping table — `technology.hosting` → platform surface type | EA registry resolver (p2.6), any future surface adapter consuming EA registry |
| ADR-008 | Active | DoR touch-point contract is binding at pre-merge — no silent scope bundling | All PRs, /verify-completion step, DoR contract amendment workflow |
| ADR-009 | Active | Evaluation and write-back workflows must be separate triggers with separate permission scopes | All CI/CD workflows that produce audit artefacts |
| ADR-010 | Active | CI audit records must be persisted to main post-merge, not to feature branches | assurance-gate.yml, trace-commit.yml, all future governance gates |
| ADR-011 | Active | Artefact-first: new SKILL.md files, src/ modules, governance check scripts, dashboard behavioural changes, copilot-instructions behavioural changes, and structural pipeline-state.json changes require a story artefact before or alongside the commit | All contributors; /definition-of-ready H9 check; coding agent |

---

### ADR-001: Single-file viz, no build step

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
The viz tool needs to be usable by anyone with a browser and a local clone — no Node, no npm install, no build step. It is a supporting tool for the pipeline, not a product.

#### Decision
`dashboards/pipeline-viz.html` is a single self-contained file. All JS, CSS, and markup are inline. No external runtime npm dependencies. No bundler (webpack, vite, esbuild).

#### Consequences
**Easier:** Zero setup to open and use. No dependency drift. No build pipeline to maintain.
**Harder / constrained:** No TypeScript, no CSS modules, no component framework. File will be long — acceptable for a tool, not a product.
**Off the table:** React, Vue, Angular. Any approach that requires `npm install` to render.

#### Revisit trigger
If the viz grows beyond ~3000 lines and maintainability is significantly impacted, introduce a simple build step that still produces a single deployable `.html` output.

---

### ADR-002: Governance gates must use evidence fields, not stage-proxy

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Early gate implementations checked only `feature.stage >= X` to infer a gate was passed. This allows false passes when a stage is manually set without running the corresponding skill.

#### Decision
Each governance gate's `evaluateGate()` function must read at least one evidence field from the story or feature in `pipeline-state.json` (e.g. `reviewStatus`, `dorStatus`, `dodStatus`). Stage-only checks are permitted as a fallback for gates where no evidence field exists yet, but must be marked with a `// TODO: replace with evidence field` comment.

#### Consequences
**Easier:** Gates accurately reflect skill execution, not just stage progression.
**Harder / constrained:** Skills must write evidence fields. Schema must define them.
**Off the table:** Pure stage-proxy gate logic for any gate that has a corresponding evidence field in the schema.

#### Revisit trigger
If the evidence field approach creates too much write overhead for skills, re-evaluate a hybrid model.

---

### ADR-003: Schema-first — fields defined before use

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Audit found multiple fields used by the viz and skills that are absent from `pipeline-state.schema.json`, making them invisible to validators and IDE tooling.

#### Decision
Any new field written to `pipeline-state.json` by a skill, or read by the viz, must be added to `pipeline-state.schema.json` in the same commit. Schema is the contract between skills and viz.

#### Consequences
**Easier:** IDE autocomplete, JSON validation, and audit tooling all work correctly.
**Harder / constrained:** Small additional overhead when adding new state fields.
**Off the table:** Fields used in production code (skills, viz) that are not in the schema.

#### Revisit trigger
If the schema validation tooling is replaced with something not relying on JSON Schema, re-evaluate the schema-first constraint.

---

### ADR-004: `context.yml` is the single config source of truth

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Governance audit found org/tool names hardcoded in skill files and the viz having its own governance config disconnected from `context.yml`. Multiple "regulated" signals existed with no bridge.

#### Decision
`.github/context.yml` is the canonical config file. Skills read it for all org-specific labels, tool integrations, compliance frameworks, and regulated-flag status. The viz reads `pipeline-state.json` for feature-level state but must not hardcode values that belong in `context.yml`. Bridges between `context.yml` and the viz state (e.g. regulated default) should be implemented via the pipeline-state write path, not by the viz fetching `context.yml` directly.

#### Consequences
**Easier:** Switching from personal to work context requires one file copy. All downstream config flows from one place.
**Harder / constrained:** Skills need a config-reading step. Viz cannot directly read `context.yml` (browser YAML parsing adds complexity).
**Off the table:** Hardcoded org names, tool URLs, or compliance framework names in skill instruction text or viz JS constants.

#### Revisit trigger
If the viz gains a server-side rendering layer, direct `context.yml` reading becomes feasible and should be adopted.

---

### ADR-005: Agent instructions format is a surface adapter concern

**Status:** Active
**Date:** 2026-04-11
**Source decision:** `artefacts/2026-04-09-skills-platform-phase1/decisions.md` — 2026-04-11 ARCH entry (Phase 1 /improve [formerly /levelup] promotion)
**Decided by:** Hamish

#### Context
The skills platform assembly script must emit agent instruction files that work across GitHub-hosted environments (GitHub Copilot, Codex) and non-GitHub environments (Bitbucket, Jenkins, Cursor, Claude Code). Two competing formats exist: `.github/copilot-instructions.md` (GitHub-specific) and `AGENTS.md` (vendor-neutral, Linux Foundation AAIF standard). A hardcoded output path breaks distribution to non-GitHub inner loop tooling.

#### Decision
Agent instructions file format is an adapter concern resolved by `context.yml`, not a fixed platform output. The assembly script emits `.github/copilot-instructions.md` when `vcs.type` is `github`, and `AGENTS.md` otherwise. Content is identical across formats. `AGENTS.md` is the vendor-neutral standard and any compliant inner loop tooling can consume it.

#### Consequences
**Easier:** Enterprise fleet distribution works without per-platform forks. Inner loop tooling can be swapped without changing skill content.
**Harder / constrained:** Assembly script must branch on `vcs.type`. The `context.yml` schema must expose an `agent_instructions.format` field (or derive it from `vcs.type`).
**Off the table:** Hardcoding `.github/copilot-instructions.md` as the sole assembly output path.

#### Revisit trigger
At Phase 2 p1.1-equivalent story (distribution mechanism) — implement the `agent_instructions.format` adapter in `context.yml` and update the assembly script to branch on `vcs.type`.

---

### ADR-006: Approval-channel adapter pattern for DoR sign-off

**Status:** Active
**Date:** 2026-04-12
**Source decision:** `artefacts/2026-04-11-skills-platform-phase2/decisions.md` — W3-p2.8 resolution entry
**Decided by:** Hamish

#### Context
DoR sign-off must work for non-engineer approvers outside the IDE. Channel-specific implementations (GitHub issue comments, Jira approvals, Confluence workflows, chat commands) should not require rewriting the core DoR state contract.

#### Decision
Adopt an approval-channel adapter pattern. Channel wiring is selected from `.github/context.yml` and implemented in channel-specific adapters. The core write contract remains channel-agnostic and updates `pipeline-state.json` evidence fields (`dorStatus`, `dorApprover`, `dorChannel`). Phase 2 reference path is `approval_channel: github-issue` with `/approve-dor` event handling.

#### Consequences
**Easier:** Add or swap approval channels without changing skill logic or state schema shape.
**Harder / constrained:** Adapter implementations must preserve the same state contract and audit fields across channels.
**Off the table:** Hardcoding one approval channel into DoR skills or workflow logic.

#### Revisit trigger
When adding a new approval surface, verify the adapter preserves the same evidence fields and audit semantics before enabling it in `context.yml`.

---

### ADR-007: EA registry surface-type mapping table

**Status:** Active
**Date:** 2026-04-12
**Source decision:** `artefacts/2026-04-11-skills-platform-phase2/decisions.md` — RESOLUTION-ASSUMPTION-02 (confirmed from live `heymishy/ea-registry` schema)
**Decided by:** Hamish

#### Context
The skills-platform surface adapter resolver (p2.6) requires a mapping from EA registry application fields to platform surface type identifiers. The initial assumption was a single `surfaceType` field. Live schema inspection revealed this field does not exist. The correct source is `technology.hosting`.

#### Decision
EA registry surface type is derived from `technology.hosting` via a fixed mapping table:
- `saas` → `saas-api` (default; `saas-gui` and `m365-admin` specified via `context.yml adapter_override`)
- `cloud` → `iac`
- `on-prem` → `manual`
- `hybrid` → context-dependent (falls back to `context.yml` override or returns an error)

No `surfaceType` field exists in the EA registry schema. Any resolver consuming the EA registry must use `technology.hosting` and this mapping, not a direct field read.

#### Consequences
**Easier:** Mapping is explicit and testable with a fixture.
**Harder / constrained:** Adding a new surface type requires updating this mapping table and the EA registry `technology.hosting` enum negotiation.
**Off the table:** Direct field reads like `application.surfaceType` — this field does not exist.

#### Revisit trigger
If the EA registry schema adds a dedicated surface-type field in a future version, migrate to direct field read and retire this mapping table.

---

### ADR-008: DOr touch-point contract is binding at pre-merge

**Status:** Active
**Date:** 2026-04-12
**Source finding:** `artefacts/2026-04-11-skills-platform-phase2/dod/p2.1-definition-skill-improvements-dod.md` — DoD Observation #1 (contract drift); `dod/p2.5b-saas-gui-m365-manual-adapters-dod.md` — Scope Deviation (multi-story contamination)
**Decided by:** Hamish

#### Context
Two Phase 2 PRs shipped files outside the DoR contract touch-point list: p2.1 included test-harness files not named in the contract; p2.5b bundled unrelated p2.11 implementation. Both PRs satisfied their ACs, but the scope deviations introduced traceability noise and made root-cause analysis harder.

#### Decision
The DoR contract touch-point list is binding at pre-merge review. PRs must not include changes to files not named in the DoR contract. When additional scope is identified as genuinely necessary, the DoR contract must be amended before merge — not silently included. The /verify-completion step must check that all changed files are in the contract before declaring a PR ready.

#### Consequences
**Easier:** Scope deviations are caught at review, not documented post-merge in DoD artefacts.
**Harder / constrained:** Operator must amend the DoR contract (a 5-minute edit) rather than bundling silent scope.
**Off the table:** Accepting "ACs satisfied, scope violations noted" as the normal pattern.

#### Revisit trigger
If the DoR contract proves too granular for fast-moving stories, introduce a tiered contract model (declared files + an allowed-extras list).

---

### ADR-009: Evaluation and write-back workflows must be separate triggers with separate permission scopes

**Status:** Active
**Date:** 2026-04-13
**Source finding:** `workspace/learnings.md` — feat/repo-tidy architectural fix learnings (2026-04-13)
**Decided by:** Hamish

#### Context
`assurance-gate.yml` combined evaluation (checking pipeline artefacts) and write-back (committing the trace record to the feature branch) in a single workflow triggered on `pull_request`. When the workflow committed back to the branch, GitHub generated a new `synchronize` event, which re-triggered the same workflow — producing an infinite loop. The root cause was not the commit itself but the structural conflation of evaluation and write-back roles within a single permission scope and trigger event.

#### Decision
Evaluation workflows receive `contents: read` only and fire on `pull_request`. They may upload artifacts (using `actions/upload-artifact`) and post comments, but must never commit to the branch. Write-back workflows receive `contents: write` and fire on `push` to `main` (post-merge). They download the uploaded artifact and commit it to the permanent audit record on the default branch. The two workflows must be separate YAML files with non-overlapping trigger events and permission grants.

#### Consequences
**Easier:** Infinite loop is structurally impossible — the evaluator cannot trigger itself. Maker/checker independence is enforced by permission scope, not convention. Clear audit separation: gate output is immutable post-evaluation; the write-back is a separate, auditable action.
**Harder / constrained:** Two workflow files required per gate instead of one. The artifact handoff introduces a timing dependency (the write-back workflow must wait for the artifact to be available). Runtime artefacts reach `workspace/traces/` only after PR merge, not during the branch review period.
**Off the table:** Single workflow that both evaluates a PR and commits back to that PR's branch.

#### Revisit trigger
If GitHub Actions introduces a native mechanism to safely commit audit records from within a `pull_request` workflow without triggering `synchronize`, re-evaluate whether the two-workflow split is still necessary.

---

### ADR-010: CI audit records must be persisted to main post-merge, not to feature branches

**Status:** Active
**Date:** 2026-04-13
**Source finding:** `workspace/learnings.md` — feat/repo-tidy architectural fix learnings (2026-04-13)
**Decided by:** Hamish

#### Context
The original `assurance-gate.yml` committed trace files to the feature branch. Feature branches are ephemeral — they are deleted after PR merge. A trace record written only to a branch may be lost when the branch is pruned. More importantly, `master` is the canonical permanent ledger; audit records on feature branches are second-class citizens that cannot be reliably queried from the main history.

#### Decision
All CI audit records (assurance gate traces, validation reports, verification artefacts) are committed to `main` post-merge by a dedicated write-back workflow. The evaluation workflow uploads the record as a GitHub Actions artifact during the PR phase. The write-back workflow, triggered by `push` to `main`, downloads the artifact and commits it to `workspace/traces/`. Feature branches never receive audit commits.

#### Consequences
**Easier:** Audit records live in main history permanently. They survive branch deletion. They can be queried chronologically from `workspace/traces/`. The trace commit does not appear in PR diffs.
**Harder / constrained:** A short window exists between PR merge and trace commit where the trace is in GitHub Actions artifact storage but not yet in `workspace/traces/`. The write-back workflow must use `[ci skip]` (or equivalent) so its commit does not itself trigger required checks on main.
**Off the table:** Committing audit artefacts to feature branches. Writing `workspace/traces/` files from within PR evaluation workflows.

#### Revisit trigger
If the two-workflow artifact handoff proves unreliable at scale (e.g. artifact expiry before write-back runs), consider alternative persistence mechanisms (e.g. writing directly to a separate audit branch or using GitHub Releases as an artifact store).

---

### ADR-011: Artefact-first — new skills, modules, governance scripts, dashboard logic, instructions, and structural state changes require a story artefact

**Status:** Active
**Date:** 2026-04-18 (scope extended from 2026-04-16 original)
**Source finding:** `workspace/retrospective-audit-2026-04-16.md` — Finding 2 (11 BETWEEN-STORIES items, 2 HIGH-risk); `workspace/learnings.md` D8 — empty-PR pattern caused by agent context budget exhaustion from oversized pipeline-state.json
**Decided by:** Hamish

#### Context
The retrospective artefact coverage audit (2026-04-16) found that 45% of post-pipeline CHANGELOG items had no covering story — including two HIGH-risk functional primitives (the `/estimate` and `/issue-dispatch` skills) added directly between story cycles. The platform's core traceability claim — that every behavioural change has a discoverable chain from problem statement to tested implementation — was violated for these items. The root cause was the absence of a structural constraint that made the violation visible before commit.

**2026-04-18 scope extension:** The D8 learning (empty-PR pattern) revealed that the original ADR-011 scope was too narrow. Dashboard behavioural changes (`dashboards/*.js`, `dashboards/*.html` logic), copilot-instructions.md behavioural changes, and structural changes to `pipeline-state.json` (schema evolution, file splitting, archive mechanisms) all change the rules by which agents and operators work, and all carry the same risk of silent divergence between codebase-as-delivered and codebase-as-specified. Data-only updates to dashboard static arrays (story phase/state changes reflecting pipeline-state.json) and pipeline bookkeeping updates (stage transitions, metric signals) remain exempt.

#### Decision
Any new or behaviourally modified file in the following categories committed to master must have a corresponding story artefact (discovery → benefit-metric → story → test-plan → DoR) committed to `artefacts/` before or alongside the implementation:

1. **SKILL.md files** under `.github/skills/`
2. **Modules** under `src/`
3. **Governance check scripts** under `tests/` or `scripts/`
4. **Dashboard behavioural changes** — new JS logic, new rendering functions, structural changes to `dashboards/pipeline-viz.html` or `dashboards/*.js` (NOT data-only updates to static arrays reflecting pipeline state)
5. **copilot-instructions.md behavioural changes** — new rules, guardrail additions, or workflow modifications that change agent behaviour (NOT typo fixes or clarifications of existing intent)
6. **Structural pipeline-state.json changes** — schema evolution, file splitting, archive mechanisms, new top-level fields (NOT pipeline bookkeeping: stage transitions, metric signals, dispatch records)

**Exemptions** (do not require a full artefact chain):
- Documentation-only changes (README, CHANGELOG, `workspace/` notes)
- Typo or configuration fixes that make no behavioural difference
- Changes explicitly recorded in the governed exemption register (`# no-artefact: [reason]` marker in the affected file)

**Retrospective path:** For work already committed without a chain, use `.github/templates/retrospective-story.md` to create a lightweight retrospective story. Retrospective stories close the traceability gap without requiring a full pre-implementation chain.

#### Consequences
**Easier:** Future audits will not find BETWEEN-STORIES items for functional primitives. The traceability claim the platform makes is substantiated by its own delivery history.
**Harder / constrained:** Lightweight between-cycle improvements (a quick skill tweak, a one-line script addition) now require at minimum a retrospective story to stay in compliance. This adds modest overhead for small improvements.
**Off the table:** Committing a new SKILL.md, `src/` module, or governance check script to master without either (a) a pre-existing story artefact or (b) a simultaneous retrospective story commit.

#### H9 enforcement
`/definition-of-ready` H9 (Architecture Constraints) checks that new SKILL.md and script additions referenced by a story do not already exist on master without a story artefact. Any violation is a H9 finding. The coding agent must read this ADR at DoR time and confirm compliance.

#### Revisit trigger
If a `check-artefact-coverage.js` CI governance gate is implemented (Phase 3 exit criterion — proposed in `workspace/retrospective-audit-2026-04-16.md` Finding 5, Prevention mechanism 3), this ADR transitions from a voluntary constraint to a CI-enforced constraint. Re-evaluate the exemption register mechanism at that point.

---

## Operating Posture

### Solo operator / W4 RISK-ACCEPT posture

This repository is operated by a single engineer. The following posture applies to all delivery within this context and is applied uniformly — it is not a per-story judgment:

- **W4 RISK-ACCEPT is the standard posture.** The W4 warning (no second reviewer) is acknowledged and risk-accepted for every story in every phase. No individual story decision entry is required beyond the first W4 log per feature.
- **The single-operator constraint is a feature context, not an exception.** Skills and DoR checklists should treat W4 as expected, not flagged.
- **Human oversight level defaults to High.** Not because complexity demands it, but because the operator is also the reviewer and final approver — the oversight is implicit in the operating model.

**If the operating context changes** (second operator onboards, regulated enterprise adoption), this section must be updated and W4 handling revisited before the next feature begins.

---

## Guardrails Registry

<!--
  GUARDRAILS_REGISTRY — Machine-parseable guardrail index.
  
  This block is read by:
  - dashboards/pipeline-viz.html (Guardrails Compliance sub-panel in governance view)
  - /review skill (Category E checklist)
  - /definition-of-ready (H9 guardrail compliance check)
  - /trace (architecture compliance check)
  
  Each guardrail has a unique ID, category, and short label.
  Skills evaluate each applicable guardrail and write the result to
  feature.guardrails[] in pipeline-state.json.
  
  Categories:
    mandatory-constraint  — from Mandatory Constraints section above
    adr                   — from Active Repo-Level ADRs above
    pattern               — from Approved Patterns above
    anti-pattern          — from Anti-Patterns above
  
  NFR and compliance-framework items are NOT listed here — they come from
  artefacts/[feature]/nfr-profile.md and config.governance.complianceFrameworks
  respectively, and are added dynamically per feature.
  
  Format: YAML block fenced with ```yaml guardrails-registry / ```.
  The viz parses this block from the fetched .md file at runtime.
  
  IMPORTANT: Keep this registry in sync with the prose sections above.
  When you add a new mandatory constraint, ADR, pattern, or anti-pattern
  to the prose sections, add a matching entry here. When you remove or
  supersede one, remove or update the entry here. If this block is stale,
  the Guardrails Compliance Matrix in the pipeline visualiser will not
  reflect the actual guardrails in effect.
  
  The /trace skill can flag mismatches as LOW findings (e.g. an ADR-NNN
  in the ADR table with no matching id: ADR-NNN in this block).
-->

```yaml guardrails-registry
- id: MC-SEC-01
  category: mandatory-constraint
  label: "No user-supplied content in innerHTML without sanitisation"
  section: Security

- id: MC-SEC-02
  category: mandatory-constraint
  label: "No credentials, tokens, or personal data in committed files"
  section: Security

- id: MC-SEC-03
  category: mandatory-constraint
  label: "Viz reads local JSON only — no external fetch calls"
  section: Security

- id: MC-CORRECT-01
  category: mandatory-constraint
  label: "Gate logic reads evidence fields from pipeline-state.json (not stage alone)"
  section: Correctness

- id: MC-CORRECT-02
  category: mandatory-constraint
  label: "Fields written to pipeline-state.json must exist in schema"
  section: Correctness

- id: MC-CORRECT-03
  category: mandatory-constraint
  label: "Fields read by viz from pipeline-state.json must exist in schema"
  section: Correctness

- id: MC-SELF-01
  category: mandatory-constraint
  label: "dashboards/pipeline-viz.html renders without build step, server, or network"
  section: Self-containment

- id: MC-SELF-02
  category: mandatory-constraint
  label: "No npm devDependencies in dashboards/pipeline-viz.html runtime"
  section: Self-containment

- id: MC-CONSIST-01
  category: mandatory-constraint
  label: "Stage enum in schema updated when skill adds/removes stage"
  section: Consistency

- id: MC-CONSIST-02
  category: mandatory-constraint
  label: "Gate add/remove synced with SKILL.md criteria"
  section: Consistency

- id: MC-A11Y-01
  category: mandatory-constraint
  label: "Interactive elements keyboard-accessible"
  section: Accessibility

- id: MC-A11Y-02
  category: mandatory-constraint
  label: "Colour not sole indicator of gate status (icons/labels present)"
  section: Accessibility

- id: ADR-001
  category: adr
  label: "Single-file viz, no build step"
  section: Active ADRs

- id: ADR-002
  category: adr
  label: "Gates must use evidence fields, not stage-proxy"
  section: Active ADRs

- id: ADR-003
  category: adr
  label: "Schema-first: fields defined before use"
  section: Active ADRs

- id: ADR-004
  category: adr
  label: "context.yml is the single config source of truth"
  section: Active ADRs

- id: ADR-005
  category: adr
  label: "Agent instructions format driven by vcs.type (surface adapter concern)"
  section: Active ADRs

- id: ADR-006
  category: adr
  label: "Approval-channel adapter pattern for DoR sign-off"
  section: Active ADRs

- id: ADR-007
  category: adr
  label: "EA registry surface-type mapping table (technology.hosting → platform surface type)"
  section: Active ADRs

- id: ADR-008
  category: adr
  label: "DoR touch-point contract is binding at pre-merge"
  section: Active ADRs

- id: PAT-01
  category: pattern
  label: "Single-file HTML viz architecture"
  section: Approved Patterns

- id: PAT-02
  category: pattern
  label: "State access via parsed pipelineState global"
  section: Approved Patterns

- id: PAT-03
  category: pattern
  label: "Gate pass/fail by evidence fields"
  section: Approved Patterns

- id: PAT-04
  category: pattern
  label: "Schema evolution: add fields simultaneously"
  section: Approved Patterns

- id: PAT-05
  category: pattern
  label: "Config reading via context.yml"
  section: Approved Patterns

- id: PAT-06
  category: pattern
  label: "Execution pre-condition gate on runtime artefact existence (DoR PROCEED-BLOCKED)"
  section: Approved Patterns

- id: PAT-07
  category: pattern
  label: "Group instruction-text-only changes at the same SKILL.md exit point into one story"
  section: Approved Patterns

- id: AP-01
  category: anti-pattern
  label: "Gate logic checking feature.stage only"
  section: Anti-Patterns

- id: AP-02
  category: anti-pattern
  label: "Hardcoded org/tool names in skill files"
  section: Anti-Patterns

- id: AP-03
  category: anti-pattern
  label: "External CDN dependencies in viz at runtime"
  section: Anti-Patterns

- id: AP-04
  category: anti-pattern
  label: "Fields used by viz/skills but not in schema"
  section: Anti-Patterns

- id: AP-05
  category: anti-pattern
  label: "Committing viz changes without passing check-viz-syntax.js"
  section: Anti-Patterns

- id: AP-06
  category: anti-pattern
  label: "Directly mutating pipeline-state.json outside skills"
  section: Anti-Patterns

- id: AP-07
  category: anti-pattern
  label: "Bundling changes from story B into story A's PR (multi-story contamination)"
  section: Anti-Patterns

- id: AP-08
  category: anti-pattern
  label: "Committing runtime artefact churn (traces, validation reports) in story branches"
  section: Anti-Patterns

- id: ADR-009
  category: adr
  label: "Evaluation and write-back workflows must be separate triggers with separate permission scopes"
  section: Active ADRs

- id: ADR-010
  category: adr
  label: "CI audit records must be persisted to main post-merge, not to feature branches"
  section: Active ADRs

- id: PAT-08
  category: pattern
  label: "Two-workflow CI audit pattern: evaluate on pull_request (contents:read) + persist post-merge to main (contents:write)"
  section: Approved Patterns

- id: PAT-09
  category: pattern
  label: "git commit --allow-empty to force synchronize event when required check has not re-run"
  section: Approved Patterns

- id: AP-09
  category: anti-pattern
  label: "Required-check workflow committing back to the branch it evaluates (synchronize loop)"
  section: Anti-Patterns

- id: AP-10
  category: anti-pattern
  label: "[ci skip] on a branch with required checks (suppresses status reporting)"
  section: Anti-Patterns

- id: AP-11
  category: anti-pattern
  label: "Committing a new SKILL.md, src/ module, governance check script, dashboard behavioural change, copilot-instructions behavioural change, or structural pipeline-state change without a story artefact (artefact-first violation)"
  section: Anti-Patterns

- id: ADR-011
  category: adr
  label: "Artefact-first: new SKILL.md files, src/ modules, governance check scripts, dashboard behavioural changes, copilot-instructions behavioural changes, and structural pipeline-state.json changes require a story artefact before or alongside the commit"
  section: Active ADRs
```
