#Requires -Version 5.1
<#
.SYNOPSIS
    Skills Pipeline Installer for Windows (PowerShell)

.DESCRIPTION
    Installs the heymishy/skills-repo SDLC pipeline into a target repository.

.PARAMETER Target
    Path to the target repository root. Default: current directory.

.PARAMETER Profile
    Context profile to activate: personal | work. Default: personal.

.PARAMETER Overwrite
    Overwrite existing files. Default: skip existing files.

.PARAMETER DryRun
    Show what would be copied without writing anything.

.EXAMPLE
    # Run from inside the target repo:
    iex (irm 'https://raw.githubusercontent.com/heymishy/skills-repo/master/scripts/install.ps1')

    # Or with options:
    .\install.ps1 -Target C:\code\my-repo -Profile work

.EXAMPLE
    # Clone then run:
    git clone https://github.com/heymishy/skills-repo C:\Temp\skills-repo
    & C:\Temp\skills-repo\scripts\install.ps1 -Target C:\code\my-repo

.PARAMETER UpstreamStrategy
    How to stay in sync with future skills-repo updates:
      none   - One-time install only. Re-run with -Overwrite to update (default).
      remote - Add heymishy/skills-repo as a 'skills-upstream' git remote.
      fork   - Add a private fork as 'skills-upstream'. Requires -UpstreamUrl.

.PARAMETER UpstreamUrl
    Fork URL when using -UpstreamStrategy fork.
    Example: https://github.com/your-org/sdlc-skills.git
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string] $Target  = (Get-Location).Path,
    [ValidateSet('personal','work')]
    [string] $Profile  = 'personal',
    [switch] $Overwrite,
    [switch] $DryRun,
    [ValidateSet('none','remote','fork')]
    [string] $UpstreamStrategy = 'none',
    [string] $UpstreamUrl = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Constants ─────────────────────────────────────────────────────────────────
$OWNER  = 'heymishy'
$REPO   = 'skills-repo'
$BRANCH = 'master'
$BASE   = "https://raw.githubusercontent.com/$OWNER/$REPO/$BRANCH"

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceRoot = Split-Path -Parent $ScriptDir  # parent of scripts/ = repo root
$UseLocal   = Test-Path (Join-Path $SourceRoot '.github\skills')

# ── Helpers ───────────────────────────────────────────────────────────────────
function Write-Info    ($m) { Write-Host "[install] $m" -ForegroundColor Cyan }
function Write-OK      ($m) { Write-Host "  [✓] $m"    -ForegroundColor Green }
function Write-Warn    ($m) { Write-Host "  [!] $m"    -ForegroundColor Yellow }
function Write-Fail    ($m) { Write-Host "  [✗] $m"    -ForegroundColor Red }

function Copy-SkillFile {
    param([string]$SrcRel, [string]$DstAbs)

    $rel = $DstAbs.Replace($Target, '').TrimStart('\','/')

    if ($DryRun) {
        Write-Host "  DRY-RUN: $SrcRel → $rel"
        return
    }

    if ((Test-Path $DstAbs) -and -not $Overwrite) {
        Write-Warn "Skipping (exists): $rel"
        return
    }

    $dir = Split-Path -Parent $DstAbs
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    if ($UseLocal) {
        Copy-Item (Join-Path $SourceRoot $SrcRel) $DstAbs -Force
    } else {
        Invoke-WebRequest "$BASE/$SrcRel" -OutFile $DstAbs -UseBasicParsing
    }

    Write-OK "Copied: $rel"
}

# ── Validate target ────────────────────────────────────────────────────────────
if (-not (Test-Path $Target)) {
    Write-Fail "Target directory does not exist: $Target"
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Skills Pipeline Installer"
Write-Host "  Target : $Target"
Write-Host "  Profile: $Profile"
Write-Host "  Mode   : $(if ($DryRun) { 'DRY RUN' } else { 'INSTALL' })"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ((Test-Path (Join-Path $Target '.github\skills')) -and -not $Overwrite) {
    Write-Warn ".github\skills\ already exists. Existing files will be skipped."
    Write-Warn "Run with -Overwrite to replace them."
    Write-Host ""
}

# ── Step 1: Core .github files ─────────────────────────────────────────────────
Write-Info "Step 1/5: Core pipeline files"

@(
    '.github/copilot-instructions.md'
    '.github/pull_request_template.md'
    '.github/architecture-guardrails.md'
    '.github/pipeline-state.json'
    '.github/pipeline-state.schema.json'
    '.github/pipeline-viz.html'
) | ForEach-Object {
    Copy-SkillFile $_ (Join-Path $Target $_)
}

# ── Step 2: Context profiles ───────────────────────────────────────────────────
Write-Info "Step 2/5: Context profiles"

Copy-SkillFile 'contexts/personal.yml' (Join-Path $Target 'contexts/personal.yml')
Copy-SkillFile 'contexts/work.yml'     (Join-Path $Target 'contexts/work.yml')

if (-not $DryRun) {
    $src = Join-Path $Target "contexts/$Profile.yml"
    $dst = Join-Path $Target '.github/context.yml'
    Copy-Item $src $dst -Force
    Write-OK "Activated profile: $Profile → .github/context.yml"
}

# ── Step 3: Skills ─────────────────────────────────────────────────────────────
Write-Info "Step 3/5: Skill files"

$skills = @(
    'benefit-metric','bootstrap','branch-complete','branch-setup','clarify',
    'coverage-map','decisions','definition','definition-of-done','definition-of-ready',
    'discovery','ea-registry','ideate','implementation-plan','implementation-review',
    'levelup','loop-design','metric-review','org-mapping','programme',
    'record-signal','release','reverse-engineer','review','scale-pipeline',
    'spike','subagent-execution','systematic-debugging','tdd','test-plan',
    'token-optimization','trace','verify-completion','workflow'
)

foreach ($skill in $skills) {
    $rel = ".github/skills/$skill/SKILL.md"
    Copy-SkillFile $rel (Join-Path $Target $rel)
}

# ── Step 4: Templates ─────────────────────────────────────────────────────────
Write-Info "Step 4/5: Templates"

$templates = @(
    'ac-verification-script.md','architecture-guardrails.md','benefit-metric.md',
    'change-request.md','compliance-bundle.md','consumer-registry.md','coverage-map.md',
    'decision-log.md','definition-of-done.md','definition-of-ready-checklist.md',
    'deployment-checklist.md','discovery.md','epic.md','ideation.md',
    'implementation-plan.md','implementation-review.md','loop-design.md',
    'metric-review.md','migration-story.md','nfr-profile.md','org-mapping.md',
    'programme.md','reference-index.md','release-notes-plain.md',
    'release-notes-technical.md','reverse-engineering-report.md','review-report.md',
    'scale-pipeline.md','spike-outcome.md','spike-output.md','story.md','test-plan.md',
    'token-optimization.md','trace-report.md','vendor-qa-tracker.md','verify-completion.md'
)

foreach ($tmpl in $templates) {
    $rel = ".github/templates/$tmpl"
    Copy-SkillFile $rel (Join-Path $Target $rel)
}

# ── Step 5: Optional extras ────────────────────────────────────────────────────
Write-Info "Step 5/5: Optional extras"

# artefacts placeholder
if (-not $DryRun) {
    $artDir = Join-Path $Target 'artefacts'
    if (-not (Test-Path $artDir)) { New-Item -ItemType Directory -Path $artDir | Out-Null }
    $gk = Join-Path $artDir '.gitkeep'
    if (-not (Test-Path $gk)) { '' | Out-File $gk -Encoding utf8 }
    Write-OK "Created: artefacts/.gitkeep"
}

# standards scaffold
Copy-SkillFile '.github/standards/index.yml' (Join-Path $Target '.github/standards/index.yml')

# product context scaffold
foreach ($f in @('mission.md','roadmap.md','tech-stack.md','constraints.md')) {
    Copy-SkillFile ".github/product/$f" (Join-Path $Target ".github/product/$f")
}

Copy-SkillFile 'config.yml' (Join-Path $Target 'config.yml')

# GitHub Actions CI integration — only if target repo uses github-actions
$ContextYml = Join-Path $Target '.github/context.yml'
if ((Test-Path $ContextYml) -and (Select-String -Path $ContextYml -Pattern '\bci:\s+github-actions\b' -Quiet)) {
    Write-Info "GitHub Actions CI detected — copying trace-validation workflow"
    Copy-SkillFile '.github/workflows/trace-validation.yml' (Join-Path $Target '.github/workflows/trace-validation.yml')
} elseif (-not $DryRun) {
    $detectedCi = (Select-String -Path $ContextYml -Pattern 'ci:\s+(\S+)' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1)
    Write-Warn "CI platform is '$detectedCi' — skipping GitHub Actions workflow."
    Write-Warn "See .github/skills/trace/SKILL.md CI usage section for your platform's integration snippet."
}

# ── Placeholder prompts ───────────────────────────────────────────────────────
if (-not $DryRun) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "  Two required placeholders need filling:"
    Write-Host ""

    $productCtx    = Read-Host "  1. Product context (one sentence — what does this repo build?)"
    $codingStandards = Read-Host "  2. Coding standards (language + test framework, e.g. TypeScript + Vitest)"

    $instrFile = Join-Path $Target '.github/copilot-instructions.md'
    if (Test-Path $instrFile) {
        $content = Get-Content $instrFile -Raw
        $count = 0
        $replacements = @($productCtx, $codingStandards)
        $result = [regex]::Replace($content, '\[FILL IN BEFORE COMMITTING\]', {
            param($m)
            if ($count -lt $replacements.Count) {
                $val = $replacements[$count]
                $count++
                return $val
            }
            return $m.Value
        })
        Set-Content $instrFile $result -NoNewline
        Write-OK "Placeholders substituted in copilot-instructions.md"
    }

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-OK "Install complete."
    Write-Host ""
    Write-Host "  Next steps:"
    Write-Host "    1. Review .github\product\ and fill in your product context"
    Write-Host "    2. Review .github\standards\ and add your coding standards"
    Write-Host "    3. Open pipeline-viz.html in VS Code Live Preview"
    Write-Host "    4. Run /workflow in GitHub Copilot to start your first feature"
    Write-Host ""
}

# ── Upstream remote setup ─────────────────────────────────────────────────────
if (-not $DryRun -and $UpstreamStrategy -ne 'none') {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Info "Setting up skills-upstream remote ($UpstreamStrategy)"

    $remoteUrl = switch ($UpstreamStrategy) {
        'remote' { "https://github.com/$OWNER/$REPO.git" }
        'fork'   {
            if (-not $UpstreamUrl) {
                $UpstreamUrl = Read-Host "  Fork URL (e.g. https://github.com/your-org/sdlc-skills.git)"
            }
            $UpstreamUrl
        }
    }

    Push-Location $Target
    try {
        # Check if skills-upstream already exists
        $existingRemotes = git remote 2>$null
        if ($existingRemotes -contains 'skills-upstream') {
            Write-Warn "'skills-upstream' remote already exists — updating URL"
            git remote set-url skills-upstream $remoteUrl
        } else {
            git remote add skills-upstream $remoteUrl
        }
        git fetch skills-upstream --quiet
        Write-OK "'skills-upstream' remote added: $remoteUrl"
    } catch {
        Write-Warn "Could not add skills-upstream remote. Add it manually:"
        Write-Warn "  git remote add skills-upstream $remoteUrl"
    } finally {
        Pop-Location
    }

    # Write skills_upstream block to context.yml
    $ContextYml = Join-Path $Target '.github/context.yml'
    if (Test-Path $ContextYml) {
        $upstreamBlock = @"

skills_upstream:
  remote: skills-upstream
  repo: $remoteUrl
  sync_paths:
    - .github/skills/
    - .github/templates/
    - scripts/
  strategy: manual$(if ($UpstreamStrategy -eq 'fork') { "`n  fork_of: https://github.com/$OWNER/$REPO.git" } else { '' })
"@
        Add-Content -Path $ContextYml -Value $upstreamBlock
        Write-OK "skills_upstream block written to context.yml"
    }

    Write-Host ""
    Write-Host "  To pull future skills updates:" -ForegroundColor DarkGray
    Write-Host "    git fetch skills-upstream" -ForegroundColor DarkGray
    Write-Host "    git checkout skills-upstream/master -- .github/skills/ .github/templates/ scripts/" -ForegroundColor DarkGray
    Write-Host "    git diff --staged   # review changes" -ForegroundColor DarkGray
    Write-Host "    git commit -m `"chore: sync skills from skills-upstream [date]`"" -ForegroundColor DarkGray
    Write-Host ""
}
