# Test Plan: Upgrade command with diff and confirm flow

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upgrade.md
**Epic:** E2 — Distribution model
**Complexity:** 2 (Unstable — POLICY.md floor detection and rollback are complex)
**Test type:** Unit + integration (fixture-based)

---

## Test matrix

| ID | Description | Type | AC | Method | Pass condition |
|----|-------------|------|----|--------|----------------|
| T1 | upgrade module exists | Unit | — | `fs.existsSync` | `src/distribution/upgrade.js` present |
| T2 | `generateDiff` lists changed, added, removed skills | Unit | AC1 | Compare fixture lockfiles (old vs new) | Returns diff with correct categories |
| T3 | POLICY.md floor change marked with visual marker in diff | Unit | AC4 | Fixture diff with POLICY.md floor change | Diff entry contains "⚠ POLICY FLOOR CHANGE:" prefix |
| T4 | `performUpgrade` with abort (no confirm) leaves sidecar unchanged | Integration | AC3 | Run upgrade with `confirm: false`, check files | Sidecar and lockfile byte-for-byte identical to pre-upgrade |
| T5 | `performUpgrade` with confirm → lockfile updated with new `pinnedRef` | Integration | AC2 | Run upgrade with `confirm: true` against temp sidecar | Lockfile `pinnedRef` matches new upstream ref |
| T6 | Upgraded lockfile records `previousPinnedRef` | Integration | AC2 | Inspect lockfile after confirmed upgrade | `previousPinnedRef` field equals old `pinnedRef` |
| T7 | `performUpgrade` runs verify as final step after confirm | Integration | AC2 | Check verify is called in upgrade flow | `verify` invoked before `performUpgrade` returns success |
| T8 | C4 compliance — upgrade without confirm flag in non-interactive mode → error | Unit | AC1 | Call `performUpgrade({ interactive: false, confirm: false })` | Error: "Upgrade requires operator confirmation" |
| T-NFR1 | Upgrade diff output contains no credentials or session tokens | Security | NFR | Inspect diff output for credential patterns | No token, key, secret in diff text |
| T-NFR2 | Failed mid-upgrade → rollback restores pre-upgrade state | Correctness | Integration | Simulate upgrade failure mid-write; inspect files | Files identical to pre-upgrade state |

---

## Test descriptions

### T1 — Module exists
`src/distribution/upgrade.js` must exist. If absent, all remaining tests fail.

### T2 — Diff generation
`generateDiff(oldLockfile, newLockfile)` where the new lockfile adds one skill and modifies another must return an object with `added`, `modified`, and `removed` arrays, each containing the relevant skill IDs.

### T3 — POLICY.md floor change highlighted
Add a POLICY.md skill entry with a floor version bump to the new lockfile fixture. `generateDiff` or `formatDiff` must annotate the floor change with `"⚠ POLICY FLOOR CHANGE:"` at the start of the relevant diff line.

### T4 — Abort leaves sidecar unchanged
In a temp directory with an existing sidecar + lockfile, call `performUpgrade({ root: tmpDir, confirm: false })`. After the call, compare the sidecar directory and lockfile byte-for-byte to the pre-upgrade snapshot. No files must differ.

### T5 — Lockfile updated on confirm
After a confirmed upgrade, read the new lockfile's `pinnedRef`. It must equal the new upstream ref (not the old one).

### T6 — previousPinnedRef audit trail
After a confirmed upgrade, the new lockfile must contain `previousPinnedRef` equal to the old `pinnedRef`. This audit trail field must be present.

### T7 — Verify invoked after upgrade
Instrument `verifyLockfile` to track calls. After a confirmed upgrade, confirm it was called at least once and returned a passing result before `performUpgrade` resolved.

### T8 — C4 — no silent upgrade
`performUpgrade({ root: tmpDir, interactive: false, confirmFlag: false })` must return/throw an error containing "Upgrade requires operator confirmation". The sidecar must remain unchanged.

### T-NFR1 — No credentials in diff
Generate a diff using fixtures that include an upstream URL. Inspect the formatted diff string for credential patterns: no `token`, `Bearer`, `password`, `secret`, or UUID-shaped tenant IDs.

### T-NFR2 — Rollback on failure
Simulate failure by making the sidecar write throw an error mid-way. After the failure, the sidecar and lockfile must be identical to the pre-upgrade snapshot (no partial modification).

---

## Coverage

| AC | Tests |
|----|-------|
| AC1 | T2, T8 |
| AC2 | T5, T6, T7 |
| AC3 | T4 |
| AC4 | T3 |
| NFR: Security | T-NFR1 |
| NFR: Audit | T6 |
| NFR: Correctness | T-NFR2 |
