# Fix validate-trace.ps1's discovery_approved false positive — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tvpf-s1`
**Worktree:** `.worktrees/tvpf-s1`
**Test command:** `node tests/check-p3.5-validate-trace.js` (single file); `npm test` (full suite)

---

## File map

```
Modify:
  tests/check-p3.5-validate-trace.js  — add 4 new tests (AC1-AC4)
  scripts/validate-trace.ps1          — fix Check-DiscoveryApproved to add approved-suppresses-draft logic
```

---

## Task 1: Write failing tests for the discovery_approved parity fix (AC1–AC4)

**Files:**
- Modify: `tests/check-p3.5-validate-trace.js`

- [ ] **Step 1: Add the failing tests**

Append these 4 new IIFE test blocks to `tests/check-p3.5-validate-trace.js`, immediately after the existing `test_check_names_match` IIFE (before the `// ── Summary ──` section):

```javascript
// ── Test: ps1 does not falsely flag an Approved feature (AC1) ─────────────────
(function test_ps1_approved_suppresses_false_positive_draft_match() {
  const name = 'ps1-discovery-approved-does-not-flag-approved-feature-with-status-draft-co-occurrence';
  const ps1 = path.join(root, 'scripts', 'validate-trace.ps1');
  if (!fs.existsSync(ps1)) {
    fail(name, 'scripts/validate-trace.ps1 not found — skip');
    return;
  }
  if (!hasPwsh()) {
    process.stdout.write('      pwsh not available in this environment — skip\n');
    skipped++;
    return;
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p3.5-ac1-test-'));
  try {
    fs.mkdirSync(path.join(tmpDir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'feat-approved-with-note'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'artefacts', 'feat-approved-with-note', 'discovery.md'),
      '# Discovery\n\n**Status:** Approved\n\nSome note: status corrected from stale "Draft" earlier.\n',
      'utf8'
    );
    const ps1Copy = path.join(tmpDir, 'scripts', 'validate-trace.ps1');
    fs.copyFileSync(ps1, ps1Copy);

    const result = cp.spawnSync(
      'pwsh',
      ['-NonInteractive', '-File', ps1Copy, '-check', 'discovery_approved'],
      { cwd: tmpDir, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' }
    );
    if (result.status === 0) {
      pass(name);
    } else {
      fail(name, 'expected exit 0 (no false positive), got ' + result.status + '. stdout: ' + (result.stdout || '').slice(-400));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: ps1 still flags a genuinely Draft feature (AC2) ─────────────────────
(function test_ps1_genuinely_draft_feature_still_flagged() {
  const name = 'ps1-discovery-approved-still-flags-genuinely-draft-feature';
  const ps1 = path.join(root, 'scripts', 'validate-trace.ps1');
  if (!fs.existsSync(ps1)) {
    fail(name, 'scripts/validate-trace.ps1 not found — skip');
    return;
  }
  if (!hasPwsh()) {
    process.stdout.write('      pwsh not available in this environment — skip\n');
    skipped++;
    return;
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p3.5-ac2-test-'));
  try {
    fs.mkdirSync(path.join(tmpDir, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'artefacts', 'feat-genuinely-draft'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'artefacts', 'feat-genuinely-draft', 'discovery.md'),
      '# Discovery\n\n**Status:** Draft\n',
      'utf8'
    );
    const ps1Copy = path.join(tmpDir, 'scripts', 'validate-trace.ps1');
    fs.copyFileSync(ps1, ps1Copy);

    const result = cp.spawnSync(
      'pwsh',
      ['-NonInteractive', '-File', ps1Copy, '-check', 'discovery_approved'],
      { cwd: tmpDir, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' }
    );
    const out = (result.stdout || '') + (result.stderr || '');
    if (result.status !== 0 && out.includes('feat-genuinely-draft')) {
      pass(name);
    } else {
      fail(name, 'expected exit non-zero naming feat-genuinely-draft, got exit ' + result.status + '. output: ' + out.slice(-400));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: real repo's 2 known false positives are resolved (AC3) ──────────────
(function test_ps1_real_repo_no_known_false_positives() {
  const name = 'ps1-real-repo-discovery-approved-has-no-known-false-positives';
  const ps1 = path.join(root, 'scripts', 'validate-trace.ps1');
  if (!fs.existsSync(ps1)) {
    fail(name, 'scripts/validate-trace.ps1 not found — skip');
    return;
  }
  if (!hasPwsh()) {
    process.stdout.write('      pwsh not available in this environment — skip\n');
    skipped++;
    return;
  }
  const result = cp.spawnSync(
    'pwsh',
    ['-NonInteractive', '-File', ps1, '-check', 'discovery_approved'],
    { cwd: root, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' }
  );
  const out = (result.stdout || '') + (result.stderr || '');
  if (out.includes('new-feature-2b74a292') || out.includes('new-feature-af17f555')) {
    fail(name, 'known false positive still present: ' + out.slice(-400));
  } else if (result.status === 0) {
    pass(name);
  } else {
    fail(name, 'discovery_approved failed for a different, unexpected reason: ' + out.slice(-400));
  }
})();

// ── Test: ps1 and sh produce the same discovery_approved verdict (AC4) ────────
(function test_ps1_sh_parity_discovery_approved() {
  const name = 'ps1-sh-parity-discovery-approved-same-verdict-on-real-repo';
  const sh = path.join(root, 'scripts', 'validate-trace.sh');
  if (!fs.existsSync(sh)) {
    fail(name, 'scripts/validate-trace.sh not found');
    return;
  }
  let bashAvailable = true;
  try {
    cp.execSync('bash -c "exit 0"', { stdio: 'ignore', timeout: 5000 });
  } catch (_) {
    bashAvailable = false;
  }
  if (!bashAvailable) {
    process.stdout.write('      bash not available in this environment — skip (CI runs validate-trace.sh independently)\n');
    skipped++;
    return;
  }
  if (!hasPwsh()) {
    process.stdout.write('      pwsh not available in this environment — skip\n');
    skipped++;
    return;
  }
  const shResult  = cp.spawnSync('bash', [sh, '--check', 'discovery_approved'], { cwd: root, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' });
  const ps1Result = cp.spawnSync('pwsh', ['-NonInteractive', '-File', path.join(root, 'scripts', 'validate-trace.ps1'), '-check', 'discovery_approved'], { cwd: root, timeout: PWSH_SPAWN_TIMEOUT_MS, encoding: 'utf8' });
  if (shResult.status === ps1Result.status) {
    pass(name);
  } else {
    fail(name, 'verdict mismatch: sh exit=' + shResult.status + ', ps1 exit=' + ps1Result.status);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-p3.5-validate-trace.js
```

Expected output (new tests only — existing 5 tests still behave as before, with the known pre-fix failure still present):
```
  ✗ ps1-discovery-approved-does-not-flag-approved-feature-with-status-draft-co-occurrence
      expected exit 0 (no false positive), got 1. stdout: ...
  ✓ ps1-discovery-approved-still-flags-genuinely-draft-feature
  ✗ ps1-real-repo-discovery-approved-has-no-known-false-positives
      known false positive still present: ...new-feature-2b74a292...
  ✓ ps1-sh-parity-discovery-approved-same-verdict-on-real-repo
```
(AC1 and AC3 fail pre-fix, as expected — the bug is still present. AC2 passes trivially since genuine-Draft detection already worked before this fix. AC4 may pass trivially pre-fix too, if `.sh` is ALSO currently reporting the same 2 false-positive-adjacent features as failed for an unrelated reason — or fail, if `.sh`'s correct behaviour already diverges from `.ps1`'s buggy one. Either outcome is informative; do not treat AC4 passing pre-fix as a sign something is wrong with the test.)

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/check-p3.5-validate-trace.js
git commit -m "test: add failing AC1-AC4 tests for validate-trace.ps1 discovery_approved parity fix (tvpf-s1)"
```

---

## Task 2: Fix Check-DiscoveryApproved to add approved-suppresses-draft logic

**Files:**
- Modify: `scripts/validate-trace.ps1`

- [ ] **Step 1: Write the implementation**

In `scripts/validate-trace.ps1`, replace the `Check-DiscoveryApproved` function (currently lines 157-187) with:

```powershell
# ── Check: discovery artefacts are Approved ───────────────────────────────────
function Check-DiscoveryApproved {
    Write-Info "Checking: discovery artefacts are Approved"
    if (-not (Test-Path $Artefacts -PathType Container)) {
        Record-Pass "discovery_approved"
        Write-Ok "artefacts/ is empty — nothing to check"
        return
    }
    $referenceDirs          = Read-TraceConfigList 'reference_dirs'
    $tracksWithoutDiscovery = Read-TraceConfigList 'tracks_without_discovery'
    $featureTracks          = Read-FeatureTracks
    $unapproved = 0
    foreach ($featureDir in (Get-ChildItem -Path $Artefacts -Directory)) {
        $feature = $featureDir.Name
        if ($feature -match '^\.' ) { continue }
        if ($referenceDirs.Contains($feature)) { continue }
        $track = if ($featureTracks.ContainsKey($feature)) { $featureTracks[$feature] } else { '' }
        if ($track -and $tracksWithoutDiscovery.Contains($track)) { continue }
        $discoveryPath = Join-Path $featureDir.FullName "discovery.md"
        if (-not (Test-Path $discoveryPath)) { continue }
        # tvpf-s1: per-line scan (not -Raw whole-file) matching validate-trace.sh's
        # own exact semantics (lines 268-269: `for l in lines`). An `approved` match
        # anywhere in the file suppresses a `draft` match, mirroring .sh's verdict
        # logic (lines 474-480: draft only fails when approved_flag != "1"). Without
        # this suppression, an already-Approved feature whose discovery.md contains
        # an unrelated sentence where "status" and "Draft" co-occur (e.g. a
        # retrospective note like `status corrected from stale "Draft"`) is falsely
        # flagged — confirmed live against new-feature-2b74a292/af17f555, 2026-10-04.
        $lines    = Get-Content $discoveryPath
        $approved = $false
        $draft    = $false
        foreach ($line in $lines) {
            if ($line -match '(?i)status.*approved') { $approved = $true }
            if ($line -match '(?i)status.*draft')    { $draft    = $true }
        }
        if ($draft -and -not $approved) {
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
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-p3.5-validate-trace.js
```

Expected output: all 9 tests pass (5 pre-existing + 4 new), 0 failed:
```
  ✓ validate-trace.ps1-file-exists
  ✓ ps1-exits-0-on-valid-repo-with-ci-flag
  ✓ ps1-exits-nonzero-on-missing-required-field
  ✓ sh-script-unmodified-when-ps1-present
  ✓ ps1-check-set-matches-sh-check-set-enumerated
  ✓ ps1-discovery-approved-does-not-flag-approved-feature-with-status-draft-co-occurrence
  ✓ ps1-discovery-approved-still-flags-genuinely-draft-feature
  ✓ ps1-real-repo-discovery-approved-has-no-known-false-positives
  ✓ ps1-sh-parity-discovery-approved-same-verdict-on-real-repo

check-p3.5-validate-trace: 9 passed, 0 failed
```

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: 712 files, **0 failed** (down from the known 1 pre-existing failure this story exists to fix — `tests/check-p3.5-validate-trace.js` itself now passes, so `[run-all-tests]` should report `0 failed`, not `1 failed`).

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-trace.ps1
git commit -m "fix: validate-trace.ps1 discovery_approved suppresses false positive on Approved features (tvpf-s1)"
```
