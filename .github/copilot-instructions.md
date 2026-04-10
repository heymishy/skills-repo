# Copilot Instructions

<!--
  This file is always loaded into every Copilot interaction in this repository.
  It is the primary source of workflow configuration.
  
  To evolve: open a PR, tag the tech lead for review.
  Do not make ad-hoc changes — this file governs all agent behaviour in the repo.
-->

## Active context

Active pipeline context: `.github/context.yml`

<!--
  context.yml holds toolchain settings (source control platform, test framework,
  roles, CI, ITSM, compliance frameworks, etc.) and is read by all skills.
  To switch profiles: cp contexts/personal.yml .github/context.yml
                   or: cp contexts/work.yml    .github/context.yml
  Available profiles: contexts/personal.yml | contexts/work.yml
-->

---

## Skills pipeline maintenance

Upstream skills sync configuration is stored in `.github/context.yml` under
`skills_upstream:`. When asked to check for or pull upstream skill updates,
read that block first — it contains the git remote name, repo URL, sync paths,
and strategy.

To sync skills from upstream:
```bash
git fetch <skills_upstream.remote>
git diff HEAD <skills_upstream.remote>/master -- .github/skills/
git checkout <skills_upstream.remote>/master -- .github/skills/ .github/templates/ scripts/ skill-pipeline-instructions.md
git diff --staged
git commit -m "chore: sync skills from skills-upstream [date]"
```

If `skills_upstream.remote` is `null` or `strategy` is `none`, no remote has
been configured. The user can add one with:
```bash
git remote add skills-upstream https://github.com/heymishy/skills-repo.git
```
Then update `skills_upstream.remote` and `skills_upstream.strategy` in `context.yml`.

---

## Product context

<!--
  DOGFOODING NOTE — revert after Phase 4 completes.
  This block contains real product context filled in for the 2026-04-09-skills-platform-phase1
  dogfood run. Once all 4 phases are delivered and DoD-signed, replace the prose below with
  the generic placeholder comment so the repo ships as a clean template for other teams:

  [FILL IN: brief description of what this product does and for whom.
   One paragraph is sufficient. Skills read this to frame problem scoping
   and metric relevance during /discovery and /benefit-metric.]

  Track via: artefacts/2026-04-09-skills-platform-phase1/ post-phase-4 cleanup task.
-->

The skills platform is an open-framework, governed software delivery pipeline that enables teams to deliver traceable, high-quality software across all contributing disciplines — from a single developer on a personal project to many teams and communities of practice across a regulated enterprise.

The platform works by encoding delivery standards, quality gates, compliance requirements, design standards, security controls, and discipline-specific practices as versioned, hash-verified instruction sets (SKILL.md files and standards files) that AI agents execute against. Teams run a structured outer loop — discovery through definition-of-ready — that builds complete, validated context drawing on standards from all relevant disciplines. An inner loop then executes that context, with the level of human involvement calibrated to the team's maturity and the risk profile of the work. Real production outcomes and delivery actuals feed back into the pipeline, creating an empirical improvement cycle grounded in actual usage rather than assumptions. Over time, the platform's harness — the SKILL.md files and evaluation suite — improves itself from its own delivery signal, with human approval retained at every change gate.

## SESSION START

At the start of every session, before doing anything else:

1. Check whether `workspace/state.json` exists in the repo root
2. If it exists:
   - Read it fully
   - Report to the operator: last completed phase, any in-progress 
     story execution, any pending improvement proposals or human 
     input items
   - Ask: "Resume from last session state, or start fresh?"
3. If it does not exist:
   - This is a new session with no prior state
   - Proceed normally — state.json will be created at the first 
     phase boundary

Do not proceed with any task until session start is complete and 
confirmed with the operator.

---

## Pipeline overview

All new features follow this sequence. Do not skip steps. Do not begin a step 
without its entry condition met. When in doubt, run `/workflow`.

```
Step  Skill                  Entry condition                     Exit condition
──────────────────────────────────────────────────────────────────────────────
1     /discovery             Raw idea or problem exists           Artefact approved
2     /benefit-metric        Discovery approved                   Metrics defined + active
3     /definition            Benefit-metric active                Epics + stories written
4     /review                Stories exist                        No HIGH findings
5     /test-plan             Review passed (per story)            Tests written (failing)
6     /definition-of-ready   Tests exist, review passed           Sign-off complete
6.5   /decisions             DoR complete (if warnings ack'd)     RISK-ACCEPTs logged
7     Inner coding loop      DoR sign-off                         Draft PR opened
        7a /branch-setup     DoR Proceed: Yes                     Isolated worktree + clean baseline
        7b /implementation-plan  Worktree ready                   Task plan saved
        7c /subagent-execution   Plan exists (or /tdd per task)   All tasks complete
        7d /verify-completion    Tasks done                       All ACs verified, 0 failures
        7e /branch-complete      Verified                         Draft PR opened
8     /definition-of-done    PR merged                            AC coverage confirmed
9     /trace                 On-demand or CI on PR open           Chain health reported
```

**Support skills available throughout the inner loop:**
`/tdd` — RED-GREEN-REFACTOR enforcement per task
`/systematic-debugging` — 4-phase root cause process when a task is stuck
`/implementation-review` — spec + quality review between task batches

**Inner loop dispatch (step 6.9):**
`/issue-dispatch` — creates GitHub issues for DoR-signed-off stories to trigger the GitHub Copilot coding agent; supports `--target vscode` (minimal stub, default) and `--target github-agent` (rich inlined body); updates `pipeline-state.json` with dispatch record

**Cross-cutting architecture support:**
`/ea-registry` — organisation-level application/interface registry query,
contribution, audit, and dependency context feed to /discovery, /definition,
and /reverse-engineer

**Pipeline evolution support:**
`/loop-design` — define outer/inner loop model for evolving the whole skill library
`/token-optimization` — design library-wide model routing/token policy (consumed by core skills)
`/org-mapping` — map pipeline language/artefacts to organisation governance (policy consumed by core skills)
`/scale-pipeline` — design multi-team enterprise operating model for evolving the whole skill system

**Short-track** (bugs, small fixes, bounded refactors): 
`/test-plan → /definition-of-ready → coding agent`

**Programme track** (multi-team, multi-phase, migrations, rewrites):
`/programme → [per workstream: standard pipeline] → /metric-review at phase gates`

Migration, cutover, and consumer migration stories within any workstream use
`migration-story.md` instead of `story.md`. Use `/release` with compliance bundle
option for regulated or phase-gate releases.

---

## Templates

All structured artefacts conform to templates in `.github/templates/`.
Skills reference these templates — do not embed format definitions in skill files.

| Artefact | Template |
|----------|----------|
| Epic | `.github/templates/epic.md` |
| Story | `.github/templates/story.md` |
| Benefit metric | `.github/templates/benefit-metric.md` |
| Test plan | `.github/templates/test-plan.md` |
| Definition of ready | `.github/templates/definition-of-ready-checklist.md` |
| AC verification script | `.github/templates/ac-verification-script.md` |
| Decision log | `.github/templates/decision-log.md` |
| Reverse engineering report | `.github/templates/reverse-engineering-report.md` |
| Vendor Q&A tracker | `.github/templates/vendor-qa-tracker.md` |
| Discovery | `.github/templates/discovery.md` |
| Review report | `.github/templates/review-report.md` |
| Definition of done | `.github/templates/definition-of-done.md` |
| Trace report | `.github/templates/trace-report.md` |
| Release notes (technical) | `.github/templates/release-notes-technical.md` |
| Release notes (plain language) | `.github/templates/release-notes-plain.md` |
| Change request | `.github/templates/change-request.md` |
| Deployment checklist | `.github/templates/deployment-checklist.md` |
| Architecture guardrails | `.github/templates/architecture-guardrails.md` |
| Reference index | `.github/templates/reference-index.md` |
| Migration story | `.github/templates/migration-story.md` |
| Consumer registry | `.github/templates/consumer-registry.md` |
| Coverage map | `.github/templates/coverage-map.md` |
| Ideation | `.github/templates/ideation.md` |
| Spike outcome | `.github/templates/spike-outcome.md` |
| Spike output | `.github/templates/spike-output.md` |
| Metric review | `.github/templates/metric-review.md` |
| Programme | `.github/templates/programme.md` |
| Implementation plan | `.github/templates/implementation-plan.md` |
| Implementation review | `.github/templates/implementation-review.md` |
| Compliance bundle | `.github/templates/compliance-bundle.md` |
| Verify completion | `.github/templates/verify-completion.md` |
| NFR profile | `.github/templates/nfr-profile.md` |
| Loop design | `.github/templates/loop-design.md` |
| Token optimization | `.github/templates/token-optimization.md` |
| Org mapping | `.github/templates/org-mapping.md` |
| Scale pipeline | `.github/templates/scale-pipeline.md` |

When a skill produces a structured artefact, it uses the relevant template.
When reviewing artefacts, check them against the template — missing fields are findings.

---

## Artefact storage

All pipeline artefacts are saved to `artefacts/[feature-slug]/`:

**Naming convention:** Feature folders follow the pattern `YYYY-MM-DD-[feature-slug]`
where the date is the discovery start date. Example: `artefacts/2025-07-15-payments-fraud-detection/`.
This keeps features in chronological order. The convention is established during `/discovery`.

```
artefacts/[YYYY-MM-DD-feature-slug]/
  reference/
    reference-index.md            ← index of all uploaded source documents
    [scoping-doc.pdf / .pptx / .docx ...]
    [business-case.pdf / ...]
    [any other source materials]
  discovery.md
  benefit-metric.md
  decisions.md
  epics/
    [epic-slug].md
  stories/
    [story-slug].md
  review/
    [story-slug]-review-1.md
  test-plans/
    [story-slug]-test-plan.md
  verification-scripts/
    [story-slug]-verification.md
  dor/
    [story-slug]-dor.md
  plans/
    [story-slug]-plan.md
  dod/
    [story-slug]-dod.md
  trace/
    [date]-trace.md
  coverage/
    coverage-map.md
    coverage-map.html
  research/
    ideation.md                   ← produced by /ideate
```

---

## Context handoff protocol

Each skill writes its primary output to the feature artefact folder at `artefacts/{YYYY-MM-DD-feature-slug}/`. The canonical files are:

```
discovery.md                          ← /discovery output
benefit-metric.md                     ← /benefit-metric output
epics/[epic-slug].md                  ← /definition output
stories/[story-slug].md               ← /definition output
test-plans/[story-slug]-test-plan.md  ← /test-plan output
verification-scripts/[story-slug]-verification.md  ← /test-plan output
dor/[story-slug]-dor.md               ← /definition-of-ready output
dor/[story-slug]-dor-contract.md      ← /definition-of-ready contract proposal
trace/[date]-trace.md                 ← /trace output
dod/[story-slug]-dod.md               ← /definition-of-done output
```

**Coding agent resuming a feature:** your first action is to read the feature artefact folder in full before writing any code. Do not rely on conversation history for ACs, constraints, or scope decisions — read from the artefact files.

**If the feature artefact folder does not exist or is incomplete:** invoke `/workflow` before proceeding.

---

## Session conventions

### Starting a session

At the start of every session, run `/workflow` before beginning any work.
This surfaces the current pipeline state and prevents work starting at the wrong stage.

If you are picking up a feature after a break:
1. Run `/workflow` — it will tell you where you are and what's next
2. Read the most recent artefact for the current stage before starting
3. Do not assume you remember where you were — check the artefacts

### During a session

- Save artefact files as you go — do not leave outputs only in the chat window
- When a skill produces output, save it to the correct artefacts path immediately
- If a skill asks a clarifying question, answer it before proceeding — do not skip
- If you are unsure whether to proceed, run `/workflow` rather than guessing
- **`/checkpoint` threshold: invoke at 55%** for any file-read-heavy phase (definition, review, test-plan, trace, inner loop implementation). The 75% guideline applies only to conversation-only phases. File reads fill the Tool Results context bucket faster than the Messages bucket — by the time the hover indicator shows 55–60%, the Tool Results bucket may be near threshold. Invoke `/checkpoint` before reaching the compaction threshold — not at it. The write must complete before compaction fires; invoke with enough context headroom to allow that.

### Ending a session

Before closing a session:
1. Confirm any artefacts produced during the session have been saved to `artefacts/`
2. Note the current pipeline stage in a brief comment on the relevant artefact
3. If you have uncommitted artefact files, commit them with a message that names the stage:
   e.g. `chore: add discovery artefact for [feature]` or `chore: add test plan for [story]`

### `/checkpoint` convention

`/checkpoint` is the mid-session and end-of-session state write. Same operation, same file (`workspace/state.json`), serving both purposes: phase boundary continuity and session-end handoff.

**When to invoke:**
Invoke `/checkpoint` before reaching compaction pressure — not at it. At 55% context usage for file-read-heavy phases (definition, review, test-plan, trace, inner loop implementation), or at 75% for conversation-only phases. The write must complete before compaction fires; invoke with enough headroom that the agent can finish writing without being interrupted by context compaction.

**What is written:**
- `currentPhase` — the name of the current pipeline phase
- `lastUpdated` — ISO 8601 timestamp of the write (e.g. `2026-04-10T14:00:00Z`)
- The cycle block for the active phase, containing at minimum `status` and `artefact` path
- `checkpoint.writtenAt` — the date of the write
- `checkpoint.contextAtWrite` — a brief summary of what was in progress
- `checkpoint.resumeInstruction` — the instruction for the next session to resume from this point
- `checkpoint.pendingActions` — any actions that were pending at the time of the write

**Completion expectation:**
The entire `/checkpoint` write — from invocation to closing confirmation message — must complete within 60 seconds. If it does not, the session likely ran out of context headroom before the write finished. Invoke earlier next time.

**After writing:**
The closing confirmation message must include "Pipeline state updated ✅". A new session reading `workspace/state.json` will resume from the checkpoint without verbal priming.

---

## Artefact writing standards

**Do not hard-wrap prose paragraphs.** When writing markdown artefacts to disk, write each paragraph as a single unbroken line. Do not insert line breaks mid-sentence to fit a column width. Hard line breaks in prose look broken in VS Code and editors that do not soft-wrap.

Rules:
- Paragraphs: one line per paragraph, no mid-sentence `\n`
- Lists: one item per line (that is intentional)
- Tables: one row per line (that is intentional)
- Headings: one line
- Code blocks: fenced, content may wrap naturally
- User story format (`As a … / I want … / So that …`): each clause on its own line is acceptable

---

## Coding standards

<!-- FILL IN: Repository-specific coding standards, architecture patterns, 
     naming conventions, test framework, linting rules, etc.
     
     Example:
     - Language: TypeScript
     - Framework: React + Vite
     - Test framework: Vitest + Testing Library
     - Linting: ESLint with Airbnb config
     - Component pattern: functional components, no class components
     - State management: Zustand for global, useState for local
     - No direct DOM manipulation — use React refs
-->

[FILL IN BEFORE COMMITTING]

---

## Product context files

The `product/` directory (repo root) holds standing context that skills read automatically.
Bootstrap creates placeholder versions of all four files — fill them in before running the pipeline.

| File | Read by | Purpose |
|------|---------|---------|
| `product/mission.md` | `/discovery`, `/benefit-metric`, `/clarify` | What the product does and for whom. Frames problem scoping and metric relevance. |
| `product/roadmap.md` | `/benefit-metric` | Strategic priorities and horizon. Used to assess whether a proposed metric aligns with the current direction. |
| `product/tech-stack.md` | `/definition` | Current technology decisions and constraints. Informs story architecture choices and NFR defaults. |
| `product/constraints.md` | `/discovery`, `/definition` | Hard limits: budget, regulatory, team capability. Surfaced during scope discussions and story ACs. |

**Format:** each file is free-form markdown. A single paragraph plus bullet list is sufficient.
Skills read the files as-is — no special syntax required.
Update these files when the product context changes (new regulatory requirement, stack migration, etc.).

---

## Architecture standards

<!--
  Architecture governance for this repository.
  The /definition skill (Step 1.5), /review skill (Category E),
  /definition-of-ready skill (H9), and /trace skill read this section.
  The coding agent reads it via the DoR instructions block.

  Live file: .github/architecture-guardrails.md
  Template:  .github/templates/architecture-guardrails.md

  Run bootstrap to create the live file from the template.
  Keep it updated — it is the source of truth for all guardrail checks.
-->

**Architecture guardrails:** `.github/architecture-guardrails.md`
**EA registry repo (optional):** `https://github.com/heymishy/ea-registry`
**Pattern library:** [FILL IN — URL or path to your pattern / component library]
**Style guide:** [FILL IN — URL or path to your style guide]
**Reference implementation:** [FILL IN — path in repo, e.g. `src/reference/`]
**Repo-level ADR register:** `.github/architecture-guardrails.md` (Active ADRs section)

When `context.yml` sets `architecture.ea_registry_authoritative: true`, keep
application/interface/domain entries in the EA registry repo and use `/ea-registry`
to feed dependency context into delivery repos.

> Per-feature decisions are recorded by /decisions and live in
> `artefacts/[feature]/decisions.md`.
> Structural decisions that constrain future features should also be added to
> `.github/architecture-guardrails.md` as a repo-level ADR.

---

## Estimation model

This pipeline does not use story points or sprint velocity.
The relevant signals are:

- **Complexity (1/2/3):** confidence and clarity, set at definition
  - 1 = Well understood, clear path
  - 2 = Some ambiguity, known unknowns
  - 3 = High ambiguity — consider a spike before committing
- **Scope stability (Stable/Unstable):** boundary confidence, set at definition
- **Human oversight (Low/Medium/High):** set at epic level

Do not introduce points or sizing unless explicitly asked.

---

## Pipeline state file — mandatory writes

Every skill has a `## State update — mandatory final step` section. **Completing that write is the final required action of every skill run — without exception.**

- Write to `.github/pipeline-state.json` in the **project repository** (the repo the user is working in), never the skills repo
- The skill is not considered complete until the write is done
- Confirm the write in your closing message: include "Pipeline state updated ✅"
- If the state file does not exist yet, create it first using the seed structure (see `/bootstrap`)
- If the write is skipped for any reason, state this explicitly so the user can run `/workflow` to reconcile

`/workflow` is the reconciliation safety net and will catch missed writes — but do not rely on it as a substitute.

---

## GitHub Copilot coding agent — project orientation

You are running in a GitHub Actions container with no IDE context, no prior conversation history, and no access to the operator's local environment. This section tells you everything you need to start.

### Step 1 — Orient from artefacts

Your work specification lives in the repository, not in the issue body alone. Before writing any code:

1. Read `workspace/state.json` — current pipeline phase, active story ID, and resumption instruction.
2. Read `artefacts/[feature-slug]/dor/[story-slug]-dor.md` — your Coding Agent Instructions block, the scope contract, and the AC list.
3. Read `artefacts/[feature-slug]/test-plans/[story-slug]-test-plan.md` — the tests you must make pass; they are written to fail before you start.
4. Read `artefacts/[feature-slug]/dor/[story-slug]-dor-contract.md` — exact file touchpoints and out-of-scope constraints.

The issue body tells you which story to pick up. The artefact files are the authoritative source — do not rely on the issue body alone for AC details.

### Step 2 — Understand the structure

```
.github/
  skills/              ← SKILL.md files — do not modify
  scripts/             ← governance check scripts (run via npm test)
  templates/           ← artefact templates — do not modify
  pipeline-state.json  ← pipeline state — update only when DoR instructs
  copilot-instructions.md
artefacts/             ← pipeline inputs — DO NOT MODIFY (see pipeline.instructions.md)
workspace/
  state.json           ← session state and checkpoint
scripts/
  validate-trace.sh    ← trace validation (requires Python + jsonschema + pyyaml)
package.json           ← test script entry point
```

### Step 3 — Verify the baseline before making any changes

```bash
npm test                              # 5 governance checks — zero external deps
bash scripts/validate-trace.sh --ci  # trace chain validation
```

Both must pass on a clean checkout. If either fails before you have changed anything, add a PR comment describing the failure and stop — this is a pre-existing problem, not yours to fix.

### Step 4 — Open PRs as drafts only

Always open PRs as drafts. Never mark ready for review. Never merge.

### When to stop and leave a PR comment

If you encounter ambiguity that cannot be resolved from the artefact files — a missing AC, a contradictory constraint, an unmet prerequisite dependency — add a PR comment describing the specific blocker and stop. Do not improvise a workaround. The operator will resolve the blocker and re-trigger you.

---

## What the coding agent should NOT do

- Do not add scope beyond what the failing tests specify
- Do not modify files outside the scope stated in the DoR artefact
- Do not mark a PR as ready for review — open as draft
- Do not merge — PR merge is a human action
- Do not skip writing tests — implementation without failing tests is a pipeline violation
- If you encounter ambiguity not covered by the ACs: add a PR comment describing it, 
  do not assume

---

## Tool integrations

<!-- SUPERSEDED: Tool configuration has moved to .github/context.yml (tools.* and
     change_management.* fields). The /release skill reads context.yml directly.
     This table is kept for reference only — context.yml is the canonical source.
     
     To configure tools, edit .github/context.yml:
       tools.project_management: jira | linear | github-issues | ...
       tools.monitoring:         dynatrace | datadog | newrelic | ...
       tools.log_aggregation:    splunk | elk | cloudwatch | ...
       tools.alerting:           pagerduty | opsgenie | ...
       tools.ci_platform:        github-actions | jenkins | gitlab-ci | ...
       tools.artifact_registry:  nexus | artifactory | github-packages | ...
       change_management.tool:   servicenow | jira-sm | none
       change_management.base_url, assignment_group, change_category
-->

| Tool | Purpose | Configuration |
|------|---------|---------------|
| ServiceNow | Change management | Set in `context.yml: change_management.*` |
| CI/CD platform | Build + deploy | Set in `context.yml: tools.ci_platform` |
| Monitoring / APM | Observability | Set in `context.yml: tools.monitoring` |
| Log aggregation | Log querying | Set in `context.yml: tools.log_aggregation` |
| On-call alerting | Incident response | Set in `context.yml: tools.alerting` |
| Issue tracking | Project management | Set in `context.yml: tools.project_management` |
| Artefact repository | Build artefacts | Set in `context.yml: tools.artifact_registry` |
