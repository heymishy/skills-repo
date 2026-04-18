#!/usr/bin/env pwsh
# sync-from-upstream.ps1
# Pulls the latest skills, templates, viz, and tooling from skills-upstream.
# Leaves untouched: artefacts/, contexts/, .github/context.yml,
#                   .github/pipeline-state.json, config.yml

param(
  [string]$Remote   = "skills-upstream",
  [string]$Branch   = "master",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# ── 1. Verify remote exists ───────────────────────────────────────────────────
$remotes = git remote | Where-Object { $_ -eq $Remote }
if (-not $remotes) {
  Write-Error "Remote '$Remote' not found. Add it with:`n  git remote add $Remote https://github.com/heymishy/skills-repo.git"
  exit 1
}

# ── 2. Fetch ──────────────────────────────────────────────────────────────────
Write-Host "Fetching $Remote/$Branch..." -ForegroundColor Cyan
git fetch $Remote

# ── 3. Show diff summary before applying ─────────────────────────────────────
$changed = git diff --name-only HEAD "$Remote/$Branch" -- `
  .github/skills/ .github/templates/ dashboards/pipeline-viz.html `
  .github/copilot-instructions.md .github/pipeline-state.schema.json `
  .github/architecture-guardrails.md .github/pull_request_template.md `
  .github/standards/ .github/workflows/ `
  skill-pipeline-instructions.md CHANGELOG.md

if (-not $changed) {
  Write-Host "Already up to date." -ForegroundColor Green
  exit 0
}

Write-Host "`nFiles that will change:" -ForegroundColor Yellow
$changed | ForEach-Object { Write-Host "  $_" }

if ($DryRun) {
  Write-Host "`n--DryRun: no changes applied." -ForegroundColor Yellow
  exit 0
}

# ── 4. Apply ──────────────────────────────────────────────────────────────────
Write-Host "`nApplying..." -ForegroundColor Cyan
git checkout "$Remote/$Branch" -- `
  .github/skills/ .github/templates/ dashboards/pipeline-viz.html `
  .github/copilot-instructions.md .github/pipeline-state.schema.json `
  .github/architecture-guardrails.md .github/pull_request_template.md `
  .github/standards/ .github/workflows/ `
  skill-pipeline-instructions.md CHANGELOG.md

# ── 5. Commit ─────────────────────────────────────────────────────────────────
$date = Get-Date -Format "yyyy-MM-dd"
git commit -m "chore: sync skills from skills-upstream $date"

Write-Host "`nDone. Skills synced from $Remote/$Branch." -ForegroundColor Green
