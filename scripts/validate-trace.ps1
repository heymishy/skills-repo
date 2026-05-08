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

# Safe property accessor for PSCustomObjects — avoids PropertyNotFoundException
# with Set-StrictMode -Version Latest on PowerShell 7 when a property is absent.
function Get-JsonProp {
    param([object]$Obj, [string]$Name, [object]$Default = $null)
    if ($null -eq $Obj) { return $Default }
    $prop = $Obj.PSObject.Properties[$Name]
    if ($null -ne $prop) { return $prop.Value }
    return $Default
}

# Reads a list section from trace-validation.yml (e.g. reference_dirs, tracks_without_discovery)
function Read-TraceConfigList {
    param([string]$Key)
    $configFile = Join-Path $GithubDir "trace-validation.yml"
    $result = [System.Collections.Generic.HashSet[string]]::new()
    if (-not (Test-Path $configFile)) { return ,$result }
    $inSection = $false
    foreach ($line in (Get-Content $configFile)) {
        if ($line -match ("^" + [regex]::Escape($Key) + ":")) {
            $inSection = $true
            continue
        }
        if ($inSection) {
            if ($line -match '^\s{2,}-\s+(.+)$') {
                $null = $result.Add($matches[1].Trim())
            } elseif ($line -match '^[a-zA-Z]') {
                break
            }
        }
    }
    return ,$result
}

# Reads feature slug → track map from pipeline-state.json
function Read-FeatureTracks {
    $tracks = @{}
    if (-not (Test-Path $StateFile)) { return $tracks }
    try {
        $state = Get-Content $StateFile -Raw | ConvertFrom-Json
        $features = Get-JsonProp $state 'features'
        if ($null -ne $features) {
            foreach ($feature in $features) {
                $slug  = Get-JsonProp $feature 'slug'
                $track = Get-JsonProp $feature 'track' 'standard'
                if ($slug) { $tracks[$slug] = $track }
            }
        }
    } catch {}
    return $tracks
}

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
    $referenceDirs          = Read-TraceConfigList 'reference_dirs'
    $tracksWithoutDiscovery = Read-TraceConfigList 'tracks_without_discovery'
    $featureTracks          = Read-FeatureTracks

    $missing = 0
    foreach ($featureDir in (Get-ChildItem -Path $Artefacts -Directory)) {
        $feature = $featureDir.Name
        if ($feature -match '^\.' ) { continue }
        if ($referenceDirs.Contains($feature)) {
            Write-Ok "Skipping reference dir: artefacts/$feature"
            continue
        }
        $track = if ($featureTracks.ContainsKey($feature)) { $featureTracks[$feature] } else { '' }
        if ($track -and $tracksWithoutDiscovery.Contains($track)) {
            Write-Ok "Skipping: artefacts/$feature (track: $track — discovery not required)"
            continue
        }
        $discoveryPath = Join-Path $featureDir.FullName "discovery.md"
        if (-not (Test-Path $discoveryPath)) {
            $hint = if ($track) { "track: $track" } else { 'not registered in pipeline-state — add to reference_dirs or pipeline-state with correct track' }
            Record-Fail "discovery_exists" "$feature is missing discovery.md ($hint)"
            Write-Fail "Missing: artefacts/$feature/discovery.md  [$hint]"
            $missing++
        }
    }
    if ($missing -eq 0) {
        Record-Pass "discovery_exists"
        Write-Ok "All standard-track features have discovery.md"
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
        $featureSlug = Get-JsonProp $feature 'slug' "unknown"

        # Collect story objects from feature.stories[] and epic.stories[]
        $stories = [System.Collections.Generic.List[object]]::new()
        if (Get-JsonProp $feature 'stories') {
            foreach ($s in $feature.stories) {
                if ($s -is [PSCustomObject]) { $stories.Add($s) }
            }
        }
        if ($stories.Count -eq 0 -and (Get-JsonProp $feature 'epics')) {
            foreach ($epic in $feature.epics) {
                if (Get-JsonProp $epic 'stories') {
                    foreach ($s in $epic.stories) {
                        if ($s -is [PSCustomObject]) { $stories.Add($s) }
                    }
                }
            }
        }

        foreach ($story in $stories) {
            $stage = Get-JsonProp $story 'stage' ""
            if ($stage -notin $stagesNeedingTestPlan) { continue }
            $artefact = Get-JsonProp $story 'artefact' ""
            $fileSlug  = if ($artefact) {
                [System.IO.Path]::GetFileNameWithoutExtension($artefact)
            } else {
                Get-JsonProp $story 'slug' "unknown"
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
        $featureSlug = Get-JsonProp $feature 'slug' "unknown"
        if ((Get-JsonProp $feature 'health') -eq 'red' -and -not (Get-JsonProp $feature 'blocker')) {
            Write-Host "UNRESOLVED BLOCKER: feature $featureSlug has health=red but no blocker recorded"
            $found = $true
        }
        if (Get-JsonProp $feature 'epics') {
            foreach ($epic in $feature.epics) {
                if (Get-JsonProp $epic 'stories') {
                    foreach ($story in $epic.stories) {
                        if ($story -isnot [PSCustomObject]) { continue }
                        $storySlug = Get-JsonProp $story 'slug' "unknown"
                        if ((Get-JsonProp $story 'health') -eq 'red' -and -not (Get-JsonProp $story 'blocker')) {
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
