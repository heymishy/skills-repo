## Test Plan: `design.system` Context Tag Triggers a Real DoR Hard Block

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/design-system-governance.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `context.yml` references `DESIGN.md`'s path | 1 test | — | — | — | — | 🟢 |
| AC2 | `H-DESIGN` scans touched files, fails with specific message naming offending file/value | 2 tests | — | — | — | — | 🟢 |
| AC3 | Deliberately-noncompliant test story genuinely blocked at DoR | — | 1 test | — | — | — | 🟢 |
| AC4 | Compliant test story passes DoR — no false positive | — | 1 test | — | — | — | 🟢 |
| AC5 | `hasDesignSystemTrack` absent → `H-DESIGN` skipped, other hard blocks unaffected | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. This story is pure Node-level governance logic (a DoR gate check + a config file reference) — no CSS layout, rendering, or browser-dependent behavior. Step 3a's E2E/browser-layout detection does not trigger on any of this story's ACs.

---

## Test Data Strategy

**Source:** Fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The real `context.yml` file | Fixture — read the real file directly, not a copy | None | |
| AC2 | A fixture file containing a hardcoded, non-token color value (e.g. `color: #123456`) | Fixture — created as part of this story's own test file, deleted after | None | |
| AC3 | A deliberately-noncompliant test story fixture, tagged `hasDesignSystemTrack: true`, with a hardcoded color in its declared touched files | Fixture | None | Not a real production story — a throwaway test fixture, matching this repo's own `check-*` test-file convention for exercising DoR-gate logic in isolation |
| AC4 | A compliant test story fixture, tagged `hasDesignSystemTrack: true`, with only token-table values | Fixture | None | |
| AC5 | A test story fixture with `hasDesignSystemTrack` absent/false | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### context-yml-references-design-md-path

- **Verifies:** AC1
- **Precondition:** Real `context.yml` file exists
- **Action:** Read `context.yml`, check for a `design` (or equivalent) key referencing `DESIGN.md`'s path
- **Expected result:** The path reference is present; `DESIGN.md`'s content is NOT embedded inline anywhere in `context.yml` or any SKILL.md file
- **Edge case:** No

### h-design-scan-detects-hardcoded-color-not-in-token-list

- **Verifies:** AC2
- **Precondition:** A fixture file with a hardcoded, non-token color value
- **Action:** Run the `H-DESIGN` token scan against the fixture
- **Expected result:** The scan flags the fixture, naming the specific file and the specific offending value
- **Edge case:** No

### h-design-scan-passes-token-only-values

- **Verifies:** AC2 (negative case)
- **Precondition:** A fixture file using only `DESIGN.md` token values
- **Action:** Run the `H-DESIGN` token scan against the fixture
- **Expected result:** No flag — confirms the scan doesn't false-positive on values that ARE in the token list
- **Edge case:** Yes — this is the negative-control counterpart to the positive-detection test above; both are needed to prove the scan is discriminating, not just always-failing or always-passing

---

## Integration Tests

### h-design-blocks-noncompliant-tagged-story-at-dor

- **Verifies:** AC3
- **Precondition:** A deliberately-noncompliant test story fixture, tagged `hasDesignSystemTrack: true`
- **Components involved:** `/definition-of-ready`'s hard-block runner, the new `H-DESIGN` check
- **Precondition:** Fixture story with a hardcoded color in its declared touched files
- **Action:** Run `/definition-of-ready`'s full hard-block sequence against the fixture
- **Expected result:** `H-DESIGN` fires, `dorStatus` is set to `blocked`

### h-design-passes-compliant-tagged-story-at-dor

- **Verifies:** AC4
- **Components involved:** Same as above
- **Precondition:** Fixture story with only token-table values in its declared touched files
- **Action:** Run `/definition-of-ready`'s full hard-block sequence against the fixture
- **Expected result:** `H-DESIGN` passes, does not block sign-off — proves no false positive

### h-design-skipped-when-flag-absent-other-blocks-unaffected

- **Verifies:** AC5
- **Components involved:** `/definition-of-ready`'s full hard-block sequence (`H1`–`H13`, `H-GOV`, `H-ADAPTER`, `H-INF`, `H-MIG`, `H-NFR-profile`, `H-DESIGN`)
- **Precondition:** Fixture story with `hasDesignSystemTrack` absent (or `false`)
- **Action:** Run the full hard-block sequence against the fixture; separately, re-run this repo's own existing test coverage for `H-INF`/`H-MIG`/other conditional blocks
- **Expected result:** `H-DESIGN` is skipped entirely (does not evaluate, does not block); every other existing hard block's own pre-existing test coverage still passes unchanged

---

## NFR Tests

### h-design-scan-completes-within-dor-budget

- **NFR addressed:** Performance
- **Measurement method:** Time the `H-DESIGN` scan's execution as part of a full DoR sign-off run
- **Pass threshold:** No material slowdown to the existing DoR sign-off flow's overall budget
- **Tool:** Manual timing comparison during implementation

### h-design-audit-trail-recorded

- **NFR addressed:** Audit
- **Measurement method:** Confirm the DoR artefact records `H-DESIGN`'s pass/fail result and, on failure, the specific offending file/value
- **Pass threshold:** Matches every other hard block's own audit-trail convention (visible in the DoR artefact output)
- **Tool:** Manual inspection of a real DoR artefact produced during implementation

---

## Out of Scope for This Test Plan

- An automated structural/layout compliance checker — the hybrid model's manual-reviewer-judgment half stays manual, not tested here.
- Testing any of the 4 visual restyle stories — each has its own test plan.
- Retroactive testing of already-in-flight stories against this new gate — the gate applies going forward only.

---

## Test Gaps and Risks

No gaps.
