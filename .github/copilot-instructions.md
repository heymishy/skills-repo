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
git checkout <skills_upstream.remote>/master -- .github/skills/ .github/templates/ scripts/
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

<!-- FILL IN: One paragraph describing what this repo builds, for whom, and why.
     This is loaded into every agent interaction and frames all semantic decisions.
     
     Example:
     "This repo contains a lightweight prioritisation canvas tool for Westpac NZ 
     workshop facilitation. Teams use it to plot ideas on a configurable 2x2 grid 
     (Impact vs Effort by default), add cards, and export results as JSON or CSV.
     The tool is session-based with local persistence only — no server, no PII stored.
     Target users are internal Westpac facilitators running discovery and ideation sessions."
-->

[FILL IN BEFORE COMMITTING]

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
| Metric review | `.github/templates/metric-review.md` |
| Programme | `.github/templates/programme.md` |
| Implementation plan | `.github/templates/implementation-plan.md` |
| Implementation review | `.github/templates/implementation-review.md` |
| Compliance bundle | `.github/templates/compliance-bundle.md` |
| Verify completion | `.github/templates/verify-completion.md` |
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

### Ending a session

Before closing a session:
1. Confirm any artefacts produced during the session have been saved to `artefacts/`
2. Note the current pipeline stage in a brief comment on the relevant artefact
3. If you have uncommitted artefact files, commit them with a message that names the stage:
   e.g. `chore: add discovery artefact for [feature]` or `chore: add test plan for [story]`

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
