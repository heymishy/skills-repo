# Copilot Instructions

<!--
  This file is always loaded into every Copilot interaction in this repository.
  It is the primary source of workflow configuration.
  
  To evolve: open a PR, tag engineering lead for review.
  Do not make ad-hoc changes — this file governs all agent behaviour in the repo.
-->

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
7     [coding agent]         DoR sign-off                         PR opened
8     /definition-of-done    PR merged                            AC coverage confirmed
9     /trace                 On-demand or CI on PR open           Chain health reported
```

**Short-track** (bugs, small fixes, bounded refactors): 
`/test-plan → /definition-of-ready → coding agent`

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

When a skill produces a structured artefact, it uses the relevant template.
When reviewing artefacts, check them against the template — missing fields are findings.

---

## Artefact storage

All pipeline artefacts are saved to `.github/artefacts/[feature-slug]/`:

```
.github/artefacts/[feature-slug]/
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
  dod/
    [story-slug]-dod.md
  trace/
    [date]-trace.md
```

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
1. Confirm any artefacts produced during the session have been saved to `.github/artefacts/`
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

## What the coding agent should NOT do

- Do not add scope beyond what the failing tests specify
- Do not modify files outside the scope stated in the DoR artefact
- Do not mark a PR as ready for review — open as draft
- Do not merge — PR merge is a human action
- Do not skip writing tests — implementation without failing tests is a pipeline violation
- If you encounter ambiguity not covered by the ACs: add a PR comment describing it, 
  do not assume
