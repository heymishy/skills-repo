## Test Plan: Install the full skill set with a lightweight outer/inner/ancillary registry

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Full skill set materialized, not a subset | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Registry categorizes every skill outer/inner/ancillary matching CLAUDE.md's diagram | 2 tests | — | — | — | — | 🟡 (accepted dependency on rb-s3, see decisions.md) |
| AC3 | Adding a new category requires only a registry entry change | 1 test | — | — | — | Untestable-by-nature (partial) | 🟡 |
| AC4 | Every registry category corresponds to a named diagram step | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Proving the *general* claim that any future category addition needs no code change | AC3 | Untestable-by-nature | A test can only demonstrate one concrete instance (add category X, confirm no code change needed); it cannot prove the claim holds for all possible future categories | Narrow test: add one new test-only category to the registry fixture, assert the file-copying code path is untouched by inspecting which functions were called — documented as a representative instance, not a proof, per the RISK-ACCEPT already logged in `decisions.md` |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture skills directory with a known file count | Synthetic | None | Small fixture set, not the full real `skills/` tree, to keep the test fast and deterministic |
| AC2 | A fixture instruction file containing a known pipeline diagram with named outer/inner/ancillary steps | Synthetic | None | Mirrors `rb-s1`'s seeded instruction file shape |
| AC3 | A registry fixture plus one new test-only category entry | Synthetic | None | |
| AC4 | Same fixture as AC2 | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### materializesFullSkillSet_notSubsetOrPlaceholder

- **Verifies:** AC1
- **Precondition:** Fresh init run against an empty target directory
- **Action:** Count files under the target's `.github/skills/` directory
- **Expected result:** File count matches the source fixture's full skill count exactly — not the reduced placeholder set `rb-s1` alone would produce
- **Edge case:** No

### registryListsEveryFixtureSkillWithValidCategory

- **Verifies:** AC2
- **Precondition:** Registry generated against the fixture skill set
- **Action:** Parse the registry manifest
- **Expected result:** Every skill in the fixture set appears exactly once, each with a `category` field whose value is exactly one of `outer-loop`, `inner-loop`, `ancillary` — no missing skills, no invalid category values
- **Edge case:** No

### registryCategoriesMatchFixtureDiagramSteps

- **Verifies:** AC2, AC4
- **Precondition:** Registry generated; fixture instruction file with a known diagram present
- **Action:** Cross-reference each `outer-loop`/`inner-loop` registry entry against the named steps in the fixture diagram
- **Expected result:** Every `outer-loop`/`inner-loop` entry corresponds to a named step; zero orphaned entries
- **Edge case:** Yes — a skill deliberately given a category with no matching diagram step should fail this test, proving it actually checks something

### addingNewCategoryRequiresOnlyRegistryEntry_representativeInstance

- **Verifies:** AC3 (documented as a representative instance, not a general proof — see Coverage gaps)
- **Precondition:** Existing registry fixture; file-copy function under test
- **Action:** Add one new category entry (`"programme-track"`) to the registry fixture only; re-run the file-copy function
- **Expected result:** File-copy function completes successfully with no code change, and the new category's skills (if any) are copied identically to any other category's skills
- **Edge case:** No

---

## Integration Tests

### fullSkillSetAndRegistry_buildOnRbS1Output

- **Verifies:** AC1, AC2
- **Components involved:** `rb-s1`'s init-wrapper output, this story's registry-generation step
- **Precondition:** `rb-s1`'s init command has already run against a target directory
- **Action:** Run this story's registry-generation step against that same target directory
- **Expected result:** The full skill set replaces `rb-s1`'s minimal/placeholder set, and the registry file is written alongside it — the two steps compose without requiring the target directory to be re-initialized from scratch

---

## NFR Tests

### registryAndFullSkillSetOverheadUnder5Seconds

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of the registry-generation step alone, isolated from `rb-s1`'s own init timing
- **Pass threshold:** < 5 seconds added versus `rb-s1`'s baseline
- **Tool:** `console.time`/`console.timeEnd` wrapper in the test

---

## Out of Scope for This Test Plan

- Testing the actual content/correctness of individual skill files — that's each skill's own concern, not this story's.
- Testing `rb-s3`'s instruction-file generation — this plan only uses a fixture standing in for its eventual output, per the accepted dependency finding in `decisions.md`.
- Proving AC3's general extensibility claim beyond one representative instance (see Coverage gaps).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC3's general claim | A single test can only demonstrate one instance, not prove a universal claim about all future categories | Already RISK-ACCEPTed in `decisions.md` — narrow representative test is the agreed handling |
| AC2's dependency on `rb-s3`'s real diagram content | `rb-s3` hasn't been implemented yet at test-plan time for this story | Test uses a fixture instruction file with a known diagram; re-verify against the real `rb-s3` output once implemented, per the RISK-ACCEPT in `decisions.md` |
