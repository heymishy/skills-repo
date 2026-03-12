---
name: bootstrap
description: >
  Scaffolds the complete SDLC pipeline structure in a new repository. Creates all 
  skill files, templates, artefacts directory, copilot-instructions.md, PR template,
  and decision log template. Requires agent mode — creates files directly. 
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
    reverse-engineer/SKILL.md     ← legacy codebase rule extraction + vendor Q&A
    bootstrap/SKILL.md            ← this file

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

  artefacts/
    .gitkeep                      ← placeholder so directory is committed
```

**Total: 12 skill files + 18 templates + 3 root files + artefacts directory**

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

### Step 3: Collect placeholders

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

Before first sprint:
  [ ] Share the verification script format with your BA/QA lead
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
- Does not configure Jira or Confluence integrations
- Does not create the first feature artefacts — run /workflow for that
- Does not install APM or any external tooling
- Does not modify existing skill files — only creates missing ones
