## Test Plan: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Review reference:** artefacts/2026-10-19-real-playback-capture-automation/review/rpca-s4-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Option 1 — Synthetic/real-file. All 3 ACs are verified by reading the real `skills/feature-playback/SKILL.md` and `decisions.md` files this story itself modifies and asserting on their real content — not fixtures standing in for them.

---

## Note on Step 3a (E2E / browser-layout detection)

Not applicable — no rendered UI, no CSS layout. This story changes markdown documentation files only.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md Step 2/3 describe the real CLI accurately | 1 test | — | — | — | — | 🟢 |
| AC2 | "What this skill does NOT do" section accurately scoped | 1 test | — | — | — | — | 🟢 |
| AC3 | `decisions.md` has a new entry superseding the 5 original RISK-ACCEPTs | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All 3 ACs are content assertions against real files this story itself modifies.

---

## Test Data Strategy

**Source:** Real files (the actual `skills/feature-playback/SKILL.md` and `feature-playback-demo`'s own `decisions.md`, read fresh at test time — not fixtures)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The real `skills/feature-playback/SKILL.md` content, post-change | Real file | None | Asserts it contains the real CLI's own actual invocation syntax, e.g. `node scripts/playback-capture.js` |
| AC2 | Same file's own "What this skill does NOT do" section | Real file | None | |
| AC3 | `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md`, post-change | Real file | None | Asserts a new entry names all 5 original story slugs (`fpd-s1` through `fpd-s5`) as superseded |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately

- **Verifies:** AC1
- **Precondition:** None — reads the real file
- **Action:** Read `skills/feature-playback/SKILL.md`, extract the Step 2/3 sections
- **Expected result:** Contains the real invocation syntax (`node scripts/playback-capture.js`) and no longer contains language implying the capture mechanism is purely aspirational/unbuilt
- **Edge case:** No

### AC2 (unit): "What this skill does NOT do" is accurately scoped

- **Verifies:** AC2
- **Precondition:** None — reads the real file
- **Action:** Read the same file's own "What this skill does NOT do" section
- **Expected result:** States that production capture and bulk retrofitting remain manual/out of scope — does not imply the whole mechanism is still unautomated
- **Edge case:** No

### AC3 (unit): decisions.md closes the 5 original RISK-ACCEPT entries

- **Verifies:** AC3
- **Precondition:** None — reads the real file
- **Action:** Read `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md`
- **Expected result:** Contains a new entry (not a rewrite of the original 5) that names `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4`, `fpd-s5` and states they are superseded by this epic's own real mechanism, with a reference to `rpca-s1`-`rpca-s3`
- **Edge case:** No

---

## Integration Tests

None — all 3 ACs are direct content assertions against real files, no component interaction to test.

---

## NFR Tests

None — confirmed with story owner. This story is documentation-only, no new NFR surface.

---

## Out of Scope for This Test Plan

- Rewriting the original 5 RISK-ACCEPT entries — story's own Out of Scope item 1
- Updating any other SKILL.md file — story's own Out of Scope item 2

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 3 ACs are direct content assertions against real files this story itself modifies | N/A |
