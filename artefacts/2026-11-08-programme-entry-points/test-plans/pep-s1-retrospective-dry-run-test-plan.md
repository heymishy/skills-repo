## Test Plan: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
**Epic reference:** artefacts/2026-11-08-programme-entry-points/epics/pep-e1-validate-entry-points.md
**Test plan author:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Step 0 Q1-Q4 answered honestly against phase4's real profile; dry-run records actual verdict with the signals that did/didn't apply | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Steps 1-6 walked through against phase4's 205 real archived files; per-step verdict recorded (satisfied / adapted / gap) | 3 tests | 2 tests | — | 1 scenario | — | 🟢 |
| AC3 | A step whose assumptions don't fit phase4 (e.g. Step 5's consumer registry scoped to "service/library rewrite") is recorded as a scoping mismatch, not a false gap, with the best-fit initiative type noted | 2 tests | — | — | 1 scenario | — | 🟢 |
| AC4 | A single write-up artefact exists at the agreed path, listing per-step verdict and concrete actionable gaps | 1 test | 1 test | — | 1 scenario | — | 🟢 |

This story's own output (the write-up artefact) is the thing being tested — unit/integration tests here verify the *mechanism* that produces the write-up (reading the real fixture files, applying the real Step 0-6 scoring logic from `skills/programme/SKILL.md`), not a separate production code path. There is no new runtime module; the "system under test" is the dry-run procedure itself, executed by the coding agent and checked against the fixture data.

---

## Coverage gaps

None. All 4 ACs have direct automated coverage of their underlying mechanism (fixture-driven assertions) plus a manual verification scenario confirming the write-up artefact itself is faithful.

---

## Test Data Strategy

**Source:** Fixtures (real historical artefact directories already committed to this repo)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — both fixture directories exist in the repo today, confirmed directly:
- `artefacts/archived/2026-04-19-skills-platform-phase4/` — 205 files, including an `epics/` subdirectory with 5 epics (`e1`-`e5`), 2-day committed span.
- `artefacts/2026-07-09-team-identity-roles/` — 1 epic, 9 stories, 39-day span.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | phase4's real Step-0 profile: operator count, cross-team deps, phase gates, consumer migration, timeline span | Read directly from `artefacts/archived/2026-04-19-skills-platform-phase4/` git history and epic/story files | None | No synthetic substitute — the whole point is scoring the *real* history, not a hypothetical |
| AC2 | phase4's real epic/story/spike structure for Steps 1-6 | `artefacts/archived/2026-04-19-skills-platform-phase4/epics/`, `stories/` (or equivalent subfolders) | None | 205-file directory; test reads a representative, enumerated subset sufficient to answer each step's prompts, not all 205 files exhaustively |
| AC3 | phase4's initiative "type" classification per `skills/programme/SKILL.md` Step 1's 4 types | `skills/programme/SKILL.md` Step 1 text + phase4's own epic descriptions | None | |
| AC4 | The write-up artefact's own path and required sections | `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` | None | Artefact does not exist yet — created by this story's implementation, asserted by AC4's test |

### PCI / sensitivity constraints

None — this repo's own internal governance history, no customer or payment data.

### Gaps

None.

---

## Unit Tests

### computes Step 0 verdict as pass when phase4's real profile is scored against the current (pre-patch) scoring table

- **Verifies:** AC1
- **Precondition:** `skills/programme/SKILL.md`'s Step 0 scoring table as it exists before pep-s2's patch; phase4's real profile (1 operator, 0 cross-team deps, 0 phase gates, 0 consumer migration, 2-day span)
- **Action:** Apply the Step 0 scoring logic to phase4's real signal values
- **Expected result:** Verdict is `fail` — none of the pre-patch signals apply to phase4's honest history, confirming the discovery's claim that /programme "fails by construction" for this case is correct in outcome even though the originally-cited mechanism (`context.yml`'s `scaling.target_team_count`) was wrong
- **Edge case:** No

### records specific signals that did and did not apply for phase4 (not an assumed outcome)

- **Verifies:** AC1
- **Precondition:** Same as above
- **Action:** Capture the per-signal boolean/value breakdown used to reach the verdict
- **Expected result:** Output structure lists each of Q1-Q4 (team count, cross-team deps, phase gates, consumer migration) plus the Timeline signal with phase4's actual value against each — not a single aggregate pass/fail with no breakdown
- **Edge case:** No

### classifies Step 5 (consumer registry) as a scoping mismatch, not a gap, for phase4

- **Verifies:** AC3
- **Precondition:** `skills/programme/SKILL.md` Step 5 text (scoped to "service/library rewrite" consumer migration); phase4's real epic descriptions
- **Action:** Walk Step 5's prompts against phase4's real epic/story content
- **Expected result:** Result is tagged `scoping-mismatch`, with an explicit note naming which of Step 1's 4 initiative types phase4 best matches — result is NOT tagged `gap` (a gap implies the step's own design is broken; a scoping mismatch implies the step doesn't apply to this case)
- **Edge case:** Yes — distinguishes "step doesn't apply" from "step is broken," the exact ambiguity AC3 exists to resolve

### write-up artefact contains one entry per step (7 total) with verdict and gap/mismatch classification

- **Verifies:** AC4
- **Precondition:** All 7 steps (Step 0 + Steps 1-6) have been dry-run
- **Action:** Parse the generated write-up artefact's structure
- **Expected result:** Exactly 7 step entries, each with a verdict field populated (not blank, not a placeholder string like "TBD")
- **Edge case:** No

---

## Integration Tests

### Step 0 dry-run reads phase4's real git-committed history, not a hand-typed summary of it

- **Verifies:** AC1
- **Components involved:** `skills/programme/SKILL.md` Step 0 logic ↔ `artefacts/archived/2026-04-19-skills-platform-phase4/` on-disk fixture ↔ git log for that directory's commit span
- **Precondition:** Fixture directory present (confirmed: 205 files)
- **Action:** Compute the operator count and timeline span directly from the fixture's git history (`git log --follow` or equivalent) rather than from a cached/asserted number in the test itself
- **Expected result:** Computed timeline span is 2 days (consistent with the already-established "2-day git-committed span" fact used elsewhere in this tranche's artefacts); computed operator count is 1
- **Expected result (design intent):** The test fails if someone later hand-types a different number into the dry-run write-up without it actually matching the fixture's real git history — this is the seam between "documentation claim" and "real data," which is exactly where this story's own credibility depends on being correct

### Steps 1-6 walked sequentially, each step's output feeding the next (per /programme's own Step 0→6 flow)

- **Verifies:** AC2
- **Components involved:** Steps 1 (Basic identity) → 2 (Timeline and phases) → 3 (Workstream registration) → 4 (Cross-workstream dependencies) → 5 (Consumer registry) → 6 (Programme artefact)
- **Precondition:** Step 0 has already produced its verdict (from the unit test above)
- **Action:** Run each step against phase4's real fixture data in sequence, confirming each step's own required inputs are present from the prior step's output (matching `/programme`'s real Step 0-6 dependency chain as documented in `skills/programme/SKILL.md`)
- **Expected result:** No step is skipped; no step's dry-run silently invents an input value that the prior step didn't actually produce

### Write-up artefact's gap entries are concrete and actionable, not narrative-only

- **Verifies:** AC4
- **Components involved:** Write-up artefact ↔ pep-s2 (downstream consumer of this artefact's findings)
- **Precondition:** Write-up artefact generated
- **Action:** For each entry classified as a genuine gap (not a scoping mismatch), confirm it includes a specific, named mechanism or file reference a patch could act on
- **Expected result:** Every `gap`-classified entry names a specific skill section, file, or mechanism — not a vague statement like "could be clearer." This is what pep-s2's AC6 depends on ("traces explicitly to that named finding")

---

## NFR Tests

None — confirmed with story owner. This story's NFR section states Performance/Security/Accessibility as "Not applicable" and Audit is satisfied structurally by the write-up artefact itself (verified under AC4's tests above, not a separate NFR test).

---

## Out of Scope for This Test Plan

- Testing `/programme`'s Step 0-6 logic against any case other than `skills-platform-phase4` — `team-identity-roles` is used elsewhere in this tranche (pep-s2, pep-s3) as the comparison "normal complexity" case, but this story's own scope is phase4 only.
- Testing the *patched* version of `/programme`/`/workflow` — that's pep-s2's test plan. This plan tests the dry-run *against the current, pre-patch* skill files, since that is what AC1/AC2 ask for (finding gaps in what exists today).
- Any automated enforcement or CI gate based on this dry-run's findings — this story is analysis-only per its own Out of Scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No way to automatically verify the write-up's prose is "actionable" vs. "narrative" beyond checking for a named file/mechanism reference | "Actionable" has a textual-quality dimension a test can't fully capture | The integration test above checks for the structural proxy (a named reference); final human judgment on actionability happens at the AC verification script's manual scenario and at pep-s2's own AC6 cross-check |
