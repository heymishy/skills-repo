---
name: bootstrap
description: >
  Scaffolds the complete SDLC pipeline structure in a new repository. Creates all 
  skill files, templates, artefacts directory, copilot-instructions.md, PR template,
  and decision log template. Requires agent mode - creates files directly. 
  Use when setting up a new repo to use the agentic SDLC workflow, or when someone 
  says "set up the pipeline", "bootstrap this repo", "initialise the workflow", 
  "add the SDLC skills", or "set up Copilot skills". 
  Takes 5–10 minutes. Prompts for two required placeholders at the end.
triggers:
  - "set up the pipeline"
  - "bootstrap this repo"
  - "initialise the workflow"
  - "add the SDLC skills"
  - "set up Copilot skills"
  - "new repo setup"
---

# Bootstrap Skill

## Entry condition check

**Requires agent mode.** This skill creates files directly in the repository.
If running in chat mode, output the file list and instruct the user to switch 
to agent mode or run the PowerShell/bash script produced at the end.

Check whether `.github/skills/` already exists:
- If yes: ask "A `.github/skills/` directory already exists. Bootstrap will 
  add missing files and skip existing ones. Confirm to proceed?"
- If no: proceed directly.

---

## What bootstrap creates

```
.github/
  copilot-instructions.md         ← pipeline orchestration + session conventions
  pull_request_template.md        ← PR review checklist with AC and chain fields
  architecture-guardrails.md      ← pattern library, style guide, guardrails, repo-level ADRs
    discovery/SKILL.md            ← raw idea → structured artefact
    benefit-metric/SKILL.md       ← metrics definition + meta-benefit detection
    definition/SKILL.md           ← epics + stories with slicing strategy
    review/SKILL.md               ← quality gate + diff on re-runs
    test-plan/SKILL.md            ← technical test plan + verification script
    definition-of-ready/SKILL.md  ← pre-coding gate + coding agent instructions
    definition-of-done/SKILL.md   ← post-merge AC validation
    trace/SKILL.md                ← full chain traceability report
    decisions/SKILL.md            ← ADR + decision log writer
    ea-registry/SKILL.md          ← org-level app/interface registry query + update
    loop-design/SKILL.md          ← outer/inner loop model + swappable inner-loop contract
    token-optimization/SKILL.md   ← model routing and token budget policy
    org-mapping/SKILL.md          ← map pipeline to org language/governance
    scale-pipeline/SKILL.md       ← enterprise scaling operating model
    reverse-engineer/SKILL.md     ← legacy codebase rule extraction + vendor Q&A
    bootstrap/SKILL.md            ← this file
    spike/SKILL.md                ← timeboxed investigation for genuine unknowns
    programme/SKILL.md            ← programme-level navigator for multi-team work
    metric-review/SKILL.md        ← metric re-baselining at phase gates
    release/SKILL.md              ← release notes, change request, deployment checklist
    branch-setup/SKILL.md         ← isolated git worktree + clean baseline
    implementation-plan/SKILL.md  ← bite-sized task plan from DoR artefact
    tdd/SKILL.md                  ← RED-GREEN-REFACTOR enforcement
    subagent-execution/SKILL.md   ← dispatch subagent per task with two-stage review
    implementation-review/SKILL.md ← spec + quality review between task batches
    verify-completion/SKILL.md    ← evidence gate before claiming done
    systematic-debugging/SKILL.md ← 4-phase root cause debugging
    branch-complete/SKILL.md      ← branch completion + draft PR

  templates/
    epic.md                       ← canonical epic format (annotated)
    story.md                      ← canonical story format (annotated)
    benefit-metric.md             ← canonical metric format with tier model
    test-plan.md                  ← technical test plan format
    ac-verification-script.md     ← plain-language verification format
    definition-of-ready-checklist.md ← DoR gate checklist
    decision-log.md               ← decision log + ADR format
    reverse-engineering-report.md ← canonical reverse engineering report format
    vendor-qa-tracker.md          ← vendor capability Q&A tracker
    discovery.md                  ← canonical discovery artefact format
    review-report.md              ← review report + diff format
    definition-of-done.md         ← post-merge AC coverage report format
    trace-report.md               ← full chain traceability report format
    release-notes-technical.md    ← technical release notes format
    release-notes-plain.md        ← plain language release notes format
    change-request.md             ← change request body format
    deployment-checklist.md       ← deployment steps and verification checklist
    architecture-guardrails.md    ← architecture guardrails, pattern library, ADR register template
    reference-index.md            ← index template for feature-scoped source documents
    migration-story.md            ← migration / cutover / parallel-run story template
    consumer-registry.md          ← downstream consumer adoption tracker (library rewrites)
    loop-design.md                ← two-loop model and swappable inner-loop contract template
    token-optimization.md         ← token budget and model-routing plan template
    org-mapping.md                ← org language/governance mapping template
    scale-pipeline.md             ← multi-team scale operating model template

  artefacts/
    .gitkeep                      ← placeholder so directory is committed

  contexts/
    personal.yml                  ← context profile: GitHub-native, personal / small team
    work.yml                      ← context profile: enterprise Atlassian + regulated stack

  context.yml                     ← active context (copied from contexts/ during bootstrap)

  pipeline-state.json             ← live pipeline state (updated by all skills)
  pipeline-state.schema.json      ← JSON schema for pipeline-state.json
  pipeline-viz.html               ← interactive pipeline visualiser (open in browser)
```

**Total: 32 skill files + 34 templates + 3 root files + 3 viz files + artefacts directory + 2 context profiles**

---

## Process

### Step 1: Confirm scope

Output the file list above and ask:

> "I'll create [N] files in `.github/`. This will set up the complete SDLC 
> pipeline for this repository.
>
> Existing files will not be overwritten — only missing files will be created.
>
> Two things I'll need from you at the end:
> 1. A one-paragraph description of what this repo builds and for whom
> 2. Your coding standards (language, framework, test framework, conventions)
>
> Ready to proceed?"

### Step 2: Create files

Create each file from its canonical content. 

**File creation order** (dependencies first):
1. Templates (no dependencies)
2. `copilot-instructions.md` (references templates)
3. `pull_request_template.md` (no dependencies)
4. Skill files in pipeline order (each may reference templates)
5. `artefacts/.gitkeep`

For each file, check if it exists before creating:
- Exists: skip and note it in the summary
- Missing: create with canonical content

Report progress as files are created:
> "Created: `.github/templates/epic.md`"
> "Skipped (exists): `.github/skills/discovery/SKILL.md`"

### Step 3: Configure context

After files are created, set up the active context so all skills know the repo's toolchain.

**3a — Agent runtime:**

> "Which agent runtime are you using?
>
> 1. GitHub Copilot (instruction file: `copilot-instructions.md`)
> 2. Claude Code / Codex (instruction file: `AGENTS.md`)
> 3. Cursor (instruction file: `.cursorrules`)
> 4. Other — I'll specify the file name
>
> Reply: 1, 2, 3, or 4"

Set `agent.instruction_file` in `context.yml` based on answer. If 4, ask for the filename.

**3b — Context profile:**

> "Which context profile fits this repo?
>
> 1. Personal / solo — GitHub-native, no ITSM, minimal process
> 2. Enterprise / regulated — multi-team, Atlassian toolchain, ITSM, compliance
> 3. I'll configure context manually after setup
>
> Reply: 1, 2, or 3"

- If 1: copy `contexts/personal.yml` to `context.yml`
- If 2: copy `contexts/work.yml` to `context.yml`
- If 3: copy `contexts/personal.yml` to `context.yml` and add a comment: `# TODO: configure this file before running /definition or /release`

Update `context.yml` with the `agent.instruction_file` selected in 3a.

**3c — Optional EA registry target:**

> "Do you maintain an organisation-level EA registry in a separate repo?
>
> 1. Yes — use default: `https://github.com/heymishy/ea-registry`
> 2. Yes — I'll provide a different URL/path
> 3. No
>
> Reply: 1, 2, or 3"

- If 1: set in `context.yml`:
  - `architecture.ea_registry_repo: https://github.com/heymishy/ea-registry`
  - `architecture.ea_registry_authoritative: true`
- If 2: ask for URL/path and set:
  - `architecture.ea_registry_repo: [provided value]`
  - `architecture.ea_registry_authoritative: true`
- If 3:
  - `architecture.ea_registry_repo: null`
  - `architecture.ea_registry_authoritative: false`

Write the active-context pointer into the agent instruction file at the top of the file
(or directly after any existing YAML frontmatter, before the first `##` heading):

```markdown
## Active context

Active pipeline context: `.github/context.yml`
```

Confirm:
> ✅ `context.yml` created from [personal/work] profile.
> Active context pointer written to `[instruction_file]`.
>
> Edit `.github/context.yml` to customise tools, roles, delivery settings,
> and sensitive data categories before running /release or /reverse-engineer.

---

### Step 4: Collect placeholders

After all files are created, prompt for the two required placeholders:

**Placeholder 1 — Product context:**

> "Almost done. I need a one-paragraph description of what this repo builds.
>
> This goes into `copilot-instructions.md` and is loaded into every Copilot 
> interaction in this repo — it frames all semantic decisions the skills make.
>
> Example: 'This repo contains a payments gateway service for Westpac NZ.
> It handles card authorisation, settlement, and dispute processing.
> Target consumers are internal systems — no direct end-user interfaces.'
>
> What's your product context?"

After receiving the response, insert it into `copilot-instructions.md` at the 
`[FILL IN BEFORE COMMITTING]` placeholder in the product context section.

**Placeholder 2 — Coding standards:**

> "One more: your coding standards for this repo.
>
> This tells the coding agent what language, framework, test framework, 
> linting rules, and conventions to follow.
>
> Example:
> - Language: TypeScript
> - Framework: React + Vite
> - Test framework: Vitest + Testing Library
> - Linting: ESLint with Airbnb config
> - No class components — functional only
>
> What are your standards? (A rough list is fine — you can refine later.)"

After receiving the response, insert it into `copilot-instructions.md` at the 
`[FILL IN BEFORE COMMITTING]` placeholder in the coding standards section.

**Placeholder 3 — Architecture guardrails:**

After filling coding standards, prompt:

> "One more optional step: fill in the architecture guardrails.
>
> The file was created at `.github/architecture-guardrails.md`.
> At minimum, fill in the Pattern Library URL, Style Guide URL, and Reference
> Implementation path so that /review Category E and /definition Step 1.5
> can reference them.
>
> You can fill this in now or later — it won't block /discovery or /definition,
> but /review Category E will skip without it.
>
> Want to fill it in now?
> Reply: yes — or skip for now"

### Step 4: Completion summary

Output:

```
## Bootstrap complete

Repository: [repo name]
Files created: [N]
Files skipped (already existed): [N]

## Pipeline is ready

Start your first feature:
1. Open Copilot in agent mode
2. Type: /workflow
3. Describe your first idea when prompted

## What to do next

Immediate (before first /discovery run):
  ✅ copilot-instructions.md — product context filled in
  ✅ copilot-instructions.md — coding standards filled in
  [ ] .github/architecture-guardrails.md — fill in pattern library URL,
      style guide URL, and reference implementation path
  [ ] Review templates/ — annotated comments explain each field;
      customise for your team's conventions before first use
  [ ] Commit .github/ to your repo

Before the first delivery cycle:
  [ ] Share the verification script format with your QA / analyst (see context.yml roles)
  [ ] Walk one engineer through the /workflow → /discovery flow
  [ ] Decide your default oversight level for this repo's epics

Reference:
  Pipeline overview:  .github/copilot-instructions.md
  Template formats:   .github/templates/
  Example artefacts:  .github/artefacts/ (empty until first /discovery run)
```

---

## Fallback: script output for chat mode

If not in agent mode, produce a PowerShell script that creates the full structure:

```powershell
# SDLC Pipeline Bootstrap Script
# Run from your repository root: .\bootstrap-pipeline.ps1

$files = @{
  ".github/copilot-instructions.md" = @"
[full file content]
"@
  # ... one entry per file
}

foreach ($path in $files.Keys) {
  $dir = Split-Path $path -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if (-not (Test-Path $path)) {
    $files[$path] | Out-File -FilePath $path -Encoding utf8
    Write-Host "Created: $path"
  } else {
    Write-Host "Skipped (exists): $path"
  }
}

Write-Host "`nBootstrap complete. Open copilot-instructions.md and fill in the two placeholders."
```

Include the full file contents inline in the script so it runs standalone.
Note: for very large file sets, split into multiple scripts if the output 
would exceed context limits.

---

## What this skill does NOT do

- Does not set up GitHub Actions or CI configuration
- Does not configure your issue tracker, documentation tool, or CI/CD pipeline — those are declared in `context.yml` for reference only
- Does not create the first feature artefacts — run /workflow for that
- Does not install APM or any external tooling
- Does not modify existing skill files — only creates missing ones

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Bootstrap creates the initial `.github/pipeline-state.json` in the **project repository** (not the skills repo) as part of scaffolding.

The seed file is an empty but valid structure:
```json
{
  "version": "1",
  "updated": "[now]",
  "programmes": [],
  "features": []
}
```

Do not pre-populate features — those are added by `/discovery` as features are defined.
If the file already exists, do not overwrite it.
