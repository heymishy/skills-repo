## Test Plan: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | New ≥4-epic signal added to Step 0's scoring table | 2 tests | — | — | — | — | 🟢 |
| AC2 | Step 0 run against phase4 (5 epics) → verdict flips fail→pass via the ≥4 signal | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Step 0 run against team-identity-roles (1 epic) → verdict stays fail, no false positive | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | /workflow's inline pre-check rewritten to defer to /programme's Step 0 | 2 tests | 1 test | — | — | — | 🟢 |
| AC5 | /orient gets at least 1 cross-reference to /programme | 1 test | — | — | 1 scenario | — | 🟢 |
| AC6 | Any additional gap from pep-s1's findings traces explicitly to a named finding, or is logged RISK-ACCEPT | — | — | — | 1 scenario | Untestable-by-nature | 🟡 |

AC6 is conditional on what pep-s1 actually finds — if pep-s1 finds zero additional gaps beyond the two already known, AC6 is trivially satisfied (nothing to trace) and this is noted explicitly rather than silently skipped.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|----------|
| Whether a patch "traces explicitly" to a named finding is a judgment call about prose quality, not a mechanically checkable property | AC6 | Untestable-by-nature | No automated way to verify a citation is honest/accurate vs. fabricated-but-well-formatted | Manual scenario in verification script cross-checks each additional patch (if any) against pep-s1's write-up artefact by a human reader; decisions.md entries (per AC6's RISK-ACCEPT path) are reviewed the same way /decisions entries always are |

---

## Test Data Strategy

**Source:** Fixtures (the real `skills/programme/SKILL.md`, `skills/workflow/SKILL.md`, `skills/orient/SKILL.md` files, plus the same two historical cases used throughout this tranche)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Current (pre-patch) Step 0 scoring table text | `skills/programme/SKILL.md` lines 37-98 | None | Patch target |
| AC2 | phase4's real profile: 5 epics, 1 team, no other signals | `artefacts/archived/2026-04-19-skills-platform-phase4/epics/` (confirmed: 5 epics, `e1`-`e5`) | None | Same fixture pep-s1/pep-s3 use |
| AC3 | team-identity-roles' real profile: 1 epic, 9 stories | `artefacts/2026-07-09-team-identity-roles/` | None | Same fixture pep-s1/pep-s3 use |
| AC4 | Current `/workflow` inline pre-check text (lines ~164-189) | `skills/workflow/SKILL.md` | None | Patch target |
| AC5 | Current `/orient` routing text (confirmed zero `/programme` mentions via grep) | `skills/orient/SKILL.md` | None | Patch target |
| AC6 | pep-s1's write-up artefact | `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` | None | Upstream dependency — must exist before this story's AC6 can be tested |

### PCI / sensitivity constraints

None.

### Gaps

None — all data sources are real, already-committed repo files.

---

## Unit Tests

### Step 0 scoring table includes a new "epic count ≥4 within a single feature" signal row

- **Verifies:** AC1
- **Precondition:** Patched `skills/programme/SKILL.md` Step 0 text
- **Action:** Parse the scoring table structure
- **Expected result:** A new scoring row/criterion exists stating the threshold as "≥4 epics within a single feature" — not "a defined threshold" or any other unpinned placeholder language
- **Edge case:** No

### Epic-count signal alone is sufficient to flip an otherwise-failing Step 0 verdict to pass

- **Verifies:** AC1
- **Precondition:** A synthetic profile with epic count = 4, all other Q1-Q4 signals = no/none
- **Action:** Apply the patched scoring logic
- **Expected result:** Verdict = pass, triggered specifically by the epic-count signal (test asserts which signal fired, not just the aggregate verdict) — confirms the signal is a genuine independent qualifying path, not merely additive flavor text
- **Edge case:** Yes — boundary value exactly at 4 (the AC's own stated threshold) must pass; this directly operationalizes "≥4" as inclusive

### /workflow's rewritten pre-check section contains no duplicated Q1-Q4-equivalent questions, and explicitly routes to /programme's Step 0

- **Verifies:** AC4
- **Precondition:** Patched `skills/workflow/SKILL.md`
- **Action:** Parse the "If 5 — Programme track" branch section
- **Expected result:** The section's text instructs the operator/agent to invoke `/programme`'s Step 0 directly (e.g. "run /programme's Step 0 qualification now") rather than re-asking team count / cross-team dependency / phase gate / consumer migration questions inline
- **Edge case:** No

### /workflow's rewritten section no longer independently answers the qualification question — it defers

- **Verifies:** AC4
- **Precondition:** Same as above
- **Action:** Confirm no inline scoring/verdict logic remains in `/workflow`'s pre-check section
- **Expected result:** Zero inline pass/fail computation in `/workflow` for this gate — MC-CONSIST-02 is satisfied because there is now exactly one place (`/programme`'s Step 0) that computes this verdict
- **Edge case:** Yes — this is the specific duplication-drift risk MC-CONSIST-02 exists to catch; the test exists to prevent regression back to duplicated logic

### /orient's routing text contains at least one explicit cross-reference to /programme

- **Verifies:** AC5
- **Precondition:** Patched `skills/orient/SKILL.md`
- **Action:** grep the file for `/programme`
- **Expected result:** At least 1 match, placed under a transformative/multi-team/multi-phase framing signal (not an unrelated section) — matching the pattern already confirmed to exist in `/workflow`'s own Complex-track signal

---

## Integration Tests

### Step 0, patched, run end-to-end against phase4's real profile, flips fail → pass

- **Verifies:** AC2
- **Components involved:** Patched `skills/programme/SKILL.md` Step 0 ↔ phase4's real fixture data (git history + epic count)
- **Precondition:** phase4 profile: 1 team, 0 cross-team deps, 0 phase gates, 0 consumer migration, 5 epics, 2-day span
- **Action:** Run the full patched Step 0 scoring flow against this real profile
- **Expected result:** Verdict = pass, and the recorded reason names the epic-count signal specifically (≥4 epics, phase4 has 5) — satisfying Metric 1's stated target directly, not just a generic "pass"

### Step 0, patched, run end-to-end against team-identity-roles' real profile, stays fail (no false positive)

- **Verifies:** AC3
- **Components involved:** Patched `skills/programme/SKILL.md` Step 0 ↔ team-identity-roles' real fixture data
- **Precondition:** team-identity-roles profile: 1 team, unclear/no formal cross-team hard dependency (4 "depend" mentions in decisions.md, but this is the secondary signal pep-s3 uses, not Step 0's own signal set), 1 epic
- **Action:** Run the full patched Step 0 scoring flow against this real profile
- **Expected result:** Verdict = fail — 1 epic does not meet the ≥4 threshold, and no other signal in this real case independently qualifies it; the new signal introduces zero false positives on the one known normal-complexity comparison case

### /workflow's deferred routing, followed end-to-end, lands at the same verdict /programme's own Step 0 would produce directly

- **Verifies:** AC4
- **Components involved:** `/workflow`'s "If 5" branch → `/programme`'s Step 0 (the deferred target)
- **Precondition:** Any test profile (reuse phase4's, for consistency)
- **Action:** Enter via `/workflow`'s route-selector option 5, follow the deferred instruction into `/programme`'s Step 0, compare the resulting verdict to calling `/programme`'s Step 0 directly
- **Expected result:** Identical verdict both ways — confirms the deferral is a real routing change, not cosmetic text that still leaves two independently-computed answers

---

## NFR Tests

None — confirmed with story owner. The story's NFR section states Performance/Security/Accessibility as not applicable (skill-instruction text, no runtime characteristic); Audit is satisfied by the PR itself plus the `decisions.md` entries, which are reviewed as part of the PR process rather than via an automated NFR test.

---

## Out of Scope for This Test Plan

- Testing any patch beyond AC1-AC5 and whatever AC6 concretely yields — per the story's own Out of Scope, a full redesign of either skill is excluded even if pep-s1 finds something significant.
- Testing pep-s1's dry-run mechanism itself — covered by pep-s1's own test plan; this plan assumes pep-s1's write-up artefact as a fixed input.
- Testing pep-s3's detection script — covered by pep-s3's own test plan, even though both stories share the same ≥4-epic threshold value (by design, per the epic's Architecture Constraints on coordinated sequencing).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC6's scope is not fully known until pep-s1's write-up artefact exists | pep-s1 is upstream of this story; this test plan is written assuming pep-s1's two already-known findings are the only ones, per the story's current Architecture Constraints text | If pep-s1 surfaces additional named gaps, this test plan must be revisited before /definition-of-ready to add AC6 test cases for each named finding, per AC6's own tracing requirement |
