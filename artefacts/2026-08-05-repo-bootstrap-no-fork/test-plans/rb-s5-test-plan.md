## Test Plan: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e2-saas-connected-bootstrap-and-outer-loop.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | --with-outer-loop installs outer-loop skills on fresh path | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | SaaS-connected without flag → inner-loop+ancillary only (default) | 1 test | — | — | — | — | 🟢 |
| AC3 | SaaS-connected with flag → outer-loop also installed | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Add-on mode documented for adding outer loop after initial bootstrap | 1 test | — | — | — | — | 🟡 (reconciliation with rb-s1 AC3 open, see decisions.md) |

---

## Coverage gaps

None — AC4's open reconciliation question (add-on mode vs. rb-s1 AC3's refusal behaviour) is a design question to resolve during implementation, not a testability gap; the test below asserts whichever resolution is chosen behaves consistently, not a specific unresolved behaviour.

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

### freshRepoWithFlag_installsOuterLoopSkillsOnTop

- **Verifies:** AC1
- **Precondition:** Registry fixture with known outer/inner/ancillary categorization; fresh init run with `--with-outer-loop`
- **Action:** Inspect installed skill set after init completes
- **Expected result:** Every skill categorized `outer-loop` in the registry is present, in addition to the inner-loop and ancillary skills already installed by default
- **Edge case:** No

### saasConnectedWithoutFlag_installsOnlyInnerLoopAndAncillary

- **Verifies:** AC2
- **Precondition:** SaaS-connected bootstrap run without `--with-outer-loop`
- **Action:** Inspect installed skill set
- **Expected result:** No `outer-loop`-categorized skill is present; inner-loop and ancillary skills are present
- **Edge case:** No

### saasConnectedWithFlag_installsOuterLoopToo

- **Verifies:** AC3
- **Precondition:** SaaS-connected bootstrap run with `--with-outer-loop`
- **Action:** Inspect installed skill set
- **Expected result:** Outer-loop skills present, matching the fresh-repo-with-flag behaviour from AC1's test exactly (same registry-driven logic, same result set)
- **Edge case:** No

### addOnModeInstallsOuterLoopWithoutDiscardingExistingBootstrap

- **Verifies:** AC4
- **Precondition:** A target directory already bootstrapped (inner-loop only, no flag used initially)
- **Action:** Re-run init in add-on mode with `--with-outer-loop`
- **Expected result:** Outer-loop skills are added; all pre-existing files (skills, registry, any fetched artefact content) remain unchanged (verified by checksum before/after) — the reconciliation with `rb-s1` AC3's refusal-to-overwrite behaviour must be explicit in the implementation: add-on mode adds new outer-loop files without touching anything `rb-s1` AC3 already protects
- **Edge case:** Yes — this test doubles as the reconciliation check flagged as an open finding in `decisions.md`

---

## Integration Tests

### freshRepoFlagBehaviour_consistentAcrossBothEntryPoints

- **Verifies:** AC1, AC3
- **Components involved:** Fresh-repo init path (`rb-s1`), SaaS-connected path (`rb-s4`), registry (`rb-s2`)
- **Precondition:** Both entry points available, same registry fixture
- **Action:** Run `--with-outer-loop` against both a fresh-repo bootstrap and a SaaS-connected bootstrap
- **Expected result:** Both produce the identical outer-loop skill set — the flag's behaviour does not diverge based on which entry point it's combined with

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

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Exact reconciliation semantics between add-on mode and `rb-s1` AC3's refusal behaviour | Not fully specified at story-writing time — flagged as an open design question in `decisions.md` | The `addOnModeInstallsOuterLoopWithoutDiscardingExistingBootstrap` test is written to assert the *outcome* (existing files untouched, new files added) regardless of which specific reconciliation mechanism the implementer chooses, so the test doesn't need to be rewritten once the design question resolves |
