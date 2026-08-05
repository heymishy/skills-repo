## Test Plan: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e2-saas-connected-bootstrap-and-outer-loop.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | --with-outer-loop enables outerLoop.enabled signal on fresh path, all files still present | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Without flag → signal disabled (default), all files still present | 1 test | — | — | — | — | 🟢 |
| AC3 | SaaS-connected with flag → same signal behaviour as fresh path | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Add-on mode flips signal without touching any other file | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. The design was revised at implementation time (2026-08-06, see `decisions.md`) from file-presence filtering to an enablement-signal mechanism, specifically to avoid conflicting with `rb-s2`'s already-shipped, unconditional AC1 guarantee that every skill file is always present. This removes the reconciliation question that previously existed against `rb-s1` AC3 — since no skill file's presence ever changes state, there's nothing to reconcile.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1-AC4 | Registry fixture from `rb-s2` categorizing skills outer/inner/ancillary | Synthetic | None | Reused across all four ACs' tests |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### freshRepoWithFlag_enablesOuterLoopSignal_allFilesStillPresent

- **Verifies:** AC1
- **Precondition:** Registry fixture with known outer/inner/ancillary categorization; fresh init run with `--with-outer-loop`
- **Action:** Inspect `context.yml` and the generated instruction file's session-start section after init completes; separately confirm every skill file (outer-loop included) still exists on disk
- **Expected result:** `context.yml` contains `outerLoop.enabled: true`; the instruction file lists outer-loop skills as active; every skill file is present regardless of the flag (rb-s2's AC1 unconditional guarantee is never touched by this story)
- **Edge case:** No

### withoutFlag_outerLoopSignalDisabled_allFilesStillPresent

- **Verifies:** AC2
- **Precondition:** Either bootstrap path run without `--with-outer-loop`
- **Action:** Inspect `context.yml` and the instruction file's session-start section; confirm every skill file (including outer-loop) still exists on disk
- **Expected result:** `context.yml` contains `outerLoop.enabled: false` (or the field absent); the instruction file names outer-loop skills as installed-but-not-enabled with the exact flag to enable them; no skill file is missing
- **Edge case:** No

### saasConnectedWithFlag_sameSignalBehaviourAsFreshRepo

- **Verifies:** AC3
- **Precondition:** SaaS-connected bootstrap run with `--with-outer-loop`
- **Action:** Inspect `context.yml` and instruction file
- **Expected result:** Identical `outerLoop.enabled: true` signal and instruction-file presentation as the fresh-repo path — the flag's effect does not depend on entry point
- **Edge case:** No

### addOnModeFlipsSignalWithoutTouchingAnyOtherFile

- **Verifies:** AC4
- **Precondition:** A target directory already bootstrapped without the flag (`outerLoop.enabled: false`)
- **Action:** Re-run init with just `--with-outer-loop` (no `--force`)
- **Expected result:** `context.yml`'s `outerLoop.enabled` flips to `true` and the instruction file regenerates its session-start section; every other file's content and mtime are unchanged (verified by checksum before/after) — no reconciliation with `rb-s1` AC3's refusal-to-overwrite logic is even needed, since no skill file ever changes state
- **Edge case:** Yes — proves add-on mode touches only `context.yml` and the instruction file, nothing else

---

## Integration Tests

### freshRepoFlagBehaviour_consistentAcrossBothEntryPoints

- **Verifies:** AC1, AC3
- **Components involved:** Fresh-repo init path (`rb-s1`), SaaS-connected path (`rb-s4`), registry (`rb-s2`), instruction assembly (`rb-s3`)
- **Precondition:** Both entry points available, same registry fixture
- **Action:** Run `--with-outer-loop` against both a fresh-repo bootstrap and a SaaS-connected bootstrap
- **Expected result:** Both produce identical `context.yml` `outerLoop.enabled: true` and identical instruction-file session-start presentation — the flag's effect does not diverge based on entry point. Both also produce the identical, complete skill-file set on disk (unaffected by the flag either way).

---

## NFR Tests

### outerLoopFlagOverheadUnder3Seconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing delta between a bootstrap run with vs. without the flag
- **Pass threshold:** < 3 seconds added
- **Tool:** `console.time`/`console.timeEnd` wrapper

---

## Out of Scope for This Test Plan

- Any mechanism for *removing* the outer loop after installation — not requested, not tested.
- The underlying outer-loop skills' own content/behaviour — only whether they're installed.

---

## Test Gaps and Risks

None — the revised enablement-signal design (2026-08-06) removes the reconciliation risk that existed under the original file-presence-filtering design, since no skill file's on-disk presence ever changes across any of the four ACs.
