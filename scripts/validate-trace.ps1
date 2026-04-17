# validate-trace.ps1
# Windows-native trace validator with full parity to validate-trace.sh
#
# Usage:
#   pwsh -File scripts/validate-trace.ps1            # interactive output
#   pwsh -File scripts/validate-trace.ps1 --ci       # machine-readable JSON report + exit code
#   pwsh -File scripts/validate-trace.ps1 --check discovery_exists  # run single check
#
# Exit codes:
#   0 = all hard-fail checks passed (warnings may exist)
#   1 = one or more hard-fail checks failed
#
# PowerShell 5.1+ only — zero external module dependencies.

param(
    [switch]$ci,
    [string]$check = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Setup ──────────────────────────────────────────────────────────────────────
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot   = Split-Path -Parent $ScriptDir
$Artefacts  = Join-Path $RepoRoot "artefacts"
$GithubDir  = Join-Path $RepoRoot ".github"
$StateFile  = Join-Path $GithubDir "pipeline-state.json"
$SchemaFile = Join-Path $GithubDir "pipeline-state.schema.json"
$ReportFile = Join-Path $RepoRoot "trace-validation-report.json"

$CiMode     = $ci.IsPresent
$SingleCheck = $check

# ── Result tracking ────────────────────────────────────────────────────────────
$Failures = [System.Collections.Generic.List[string]]::new()
$Warnings = [System.Collections.Generic.List[string]]::new()
$Passes   = [System.Collections.Generic.List[string]]::new()

function Record-Pass  { param([string]$name) $Passes.Add($name) }
function Record-Warn  { param([string]$name, [string]$msg) $Warnings.Add("${name}: ${msg}") }
function Record-Fail  { param([string]$name, [string]$msg) $Failures.Add("${name}: ${msg}") }

# ── Output helpers ─────────────────────────────────────────────────────────────
function Write-Info { param([string]$msg) Write-Host "[trace] $msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── Check: pipeline-state.json exists and is valid JSON ──────────────────────
function Check-SchemaValid {
    Write-Info "Checking: pipeline-state.json is schema-valid"
    if (-not (Test-Path $StateFile)) {
        Record-Fail "schema_valid" "pipeline-state.json not found at $StateFile"
        return
    }
    try {
        $null = Get-Content $StateFile -Raw | ConvertFrom-Json
        Record-Pass "schema_valid"
        Write-Ok "pipeline-state.json is valid JSON"
    }
    catch {
        Record-Fail "schema_valid" "pipeline-state.json is not valid JSON: $_"
    }
}

# ── Check: discovery artefacts exist for all active features ──────────────────
function Check-DiscoveryExists {
    Write-Info "Checking: discovery artefacts exist"
    if (-not (Test-Path $Artefacts -PathType Container)) {
        Record-Pass "discovery_exists"
        Write-Ok "artefacts/ is empty — no features to check"
        return
    }
    $missing = 0
    foreach ($featureDir in (Get-ChildItem -Path $Artefacts -Directory)) {
        $feature = $featureDir.Name
        if ($feature -match '^\.' ) { continue }
        $discoveryPath = Join-Path $featureDir.FullName "discovery.md"
        if (-not (Test-Path $discoveryPath)) {
            Record-Fail "discovery_exists" "$feature is missing discovery.md"
            Write-Fail "Missing: artefacts/$feature/discovery.md"
            $missing++
        }
    }
    if ($missing -eq 0) {
        Record-Pass "discovery_exists"
        Write-Ok "All features have discovery.md"
    }
}

# ── Check: discovery artefacts are Approved ───────────────────────────────────
function Check-DiscoveryApproved {
    Write-Info "Checking: discovery artefacts are Approved"
    if (-not (Test-Path $Artefacts -PathType Container)) {
        Record-Pass "discovery_approved"
        Write-Ok "artefacts/ is empty — nothing to check"
        return
    }
    $unapproved = 0
    foreach ($featureDir in (Get-ChildItem -Path $Artefacts -Directory)) {
        $feature = $featureDir.Name
        if ($feature -match '^\.' ) { continue }
        $discoveryPath = Join-Path $featureDir.FullName "discovery.md"
        if (-not (Test-Path $discoveryPath)) { continue }
        $content = Get-Content $discoveryPath -Raw
        if ($content -match '(?i)status.*draft') {
            Record-Fail "discovery_approved" "${feature}: discovery.md status is still Draft"
            Write-Fail "${feature}: discovery.md is still Draft"
            $unapproved++
        }
    }
    if ($unapproved -eq 0) {
        Record-Pass "discovery_approved"
        Write-Ok "All discoveries are Approved (or not yet at approval stage)"
    }
}

# ── Check: test plan coverage ─────────────────────────────────────────────────
function Check-TestPlanCoverage {
    Write-Info "Checking: all stories have test plans"
    if (-not (Test-Path $StateFile)) {
        Record-Pass "test_plan_coverage"
        Write-Ok "No pipeline-state.json — skipping"
        return
    }
    try {
        $state = Get-Content $StateFile -Raw | ConvertFrom-Json
    }
    catch {
        Record-Fail "test_plan_coverage" "pipeline-state.json could not be parsed: $_"
        return
    }

    $stagesNeedingTestPlan = @('test-plan','definition-of-ready','implementation','done','definition-of-done')
    $missing = [System.Collections.Generic.List[string]]::new()

    foreach ($feature in $state.features) {
        $featureSlug = if ($feature.slug) { $feature.slug } else { "unknown" }

        # Collect story objects from feature.stories[] and epic.stories[]
        $stories = [System.Collections.Generic.List[object]]::new()
        if ($feature.stories) {
            foreach ($s in $feature.stories) {
                if ($s -is [PSCustomObject]) { $stories.Add($s) }
            }
        }
        if ($stories.Count -eq 0 -and $feature.epics) {
            foreach ($epic in $feature.epics) {
                if ($epic.stories) {
                    foreach ($s in $epic.stories) {
                        if ($s -is [PSCustomObject]) { $stories.Add($s) }
                    }
                }
            }
        }

        foreach ($story in $stories) {
            $stage = if ($story.stage) { $story.stage } else { "" }
            if ($stage -notin $stagesNeedingTestPlan) { continue }
            $artefact = if ($story.artefact) { $story.artefact } else { "" }
            $fileSlug  = if ($artefact) {
                [System.IO.Path]::GetFileNameWithoutExtension($artefact)
            } else {
                if ($story.slug) { $story.slug } else { "unknown" }
            }
            $testPlanPath = Join-Path $RepoRoot "artefacts" $featureSlug "test-plans" "${fileSlug}-test-plan.md"
            if (-not (Test-Path $testPlanPath)) {
                $rel = "artefacts/$featureSlug/test-plans/${fileSlug}-test-plan.md"
                Write-Host "MISSING: $rel"
                $missing.Add($rel)
            }
        }
    }

    if ($missing.Count -eq 0) {
        Record-Pass "test_plan_coverage"
        Write-Ok "All in-flight stories have test plans"
    }
    else {
        Record-Fail "test_plan_coverage" "One or more stories are missing test plans — see output above"
    }
}

# ── Check: unresolved blockers ────────────────────────────────────────────────
function Check-UnresolvedBlockers {
    Write-Info "Checking: no unresolved blockers"
    if (-not (Test-Path $StateFile)) {
        Record-Pass "unresolved_blockers"
        Write-Ok "No pipeline-state.json — skipping"
        return
    }
    try {
        $state = Get-Content $StateFile -Raw | ConvertFrom-Json
    }
    catch {
        Record-Fail "unresolved_blockers" "pipeline-state.json could not be parsed: $_"
        return
    }

    $found = $false
    foreach ($feature in $state.features) {
        $featureSlug = if ($feature.slug) { $feature.slug } else { "unknown" }
        if ($feature.health -eq 'red' -and -not $feature.blocker) {
            Write-Host "UNRESOLVED BLOCKER: feature $featureSlug has health=red but no blocker recorded"
            $found = $true
        }
        if ($feature.epics) {
            foreach ($epic in $feature.epics) {
                if ($epic.stories) {
                    foreach ($story in $epic.stories) {
                        if ($story -isnot [PSCustomObject]) { continue }
                        $storySlug = if ($story.slug) { $story.slug } else { "unknown" }
                        if ($story.health -eq 'red' -and -not $story.blocker) {
                            Write-Host "UNRESOLVED BLOCKER: $featureSlug/$storySlug has health=red but no blocker recorded"
                            $found = $true
                        }
                    }
                }
            }
        }
    }

    if (-not $found) {
        Record-Pass "unresolved_blockers"
        Write-Ok "No unresolved blockers found"
    }
    else {
        Record-Fail "unresolved_blockers" "Stories have red health with no blocker recorded — see output above"
    }
}

# ── Main ───────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Info "Trace Validation — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

if ($SingleCheck) {
    switch ($SingleCheck) {
        "schema_valid"          { Check-SchemaValid }
        "discovery_exists"      { Check-DiscoveryExists }
        "discovery_approved"    { Check-DiscoveryApproved }
        "test_plan_coverage"    { Check-TestPlanCoverage }
        "unresolved_blockers"   { Check-UnresolvedBlockers }
        default {
            Write-Host "Unknown check: $SingleCheck" -ForegroundColor Red
            exit 1
        }
    }
}
else {
    Check-SchemaValid
    Check-DiscoveryExists
    Check-DiscoveryApproved
    Check-TestPlanCoverage
    Check-UnresolvedBlockers
}

Write-Host ""
Write-Info "Results: $($Passes.Count) passed, $($Warnings.Count) warnings, $($Failures.Count) failed"

foreach ($w in $Warnings) { Write-Warn $w }
foreach ($f in $Failures) { Write-Fail $f }

# ── JSON report ───────────────────────────────────────────────────────────────
if ($CiMode) {
    $report = @{
        passed   = @($Passes)
        warnings = @($Warnings)
        failures = @($Failures)
    }
    $report | ConvertTo-Json -Depth 3 | Set-Content -Path $ReportFile -Encoding UTF8
    Write-Host "Report written to $ReportFile"
}

# Exit with failure if any hard-fail checks failed
if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Fail "Trace validation FAILED — $($Failures.Count) hard-fail check(s) did not pass."
    exit 1
}

Write-Host ""
Write-Ok "Trace validation passed."
exit 0
