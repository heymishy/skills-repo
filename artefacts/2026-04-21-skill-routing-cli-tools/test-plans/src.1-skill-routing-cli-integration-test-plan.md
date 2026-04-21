# Test Plan: src.1 — Integrate CLI observability tools into skill routing

**Story:** artefacts/2026-04-21-skill-routing-cli-tools/stories/src.1-skill-routing-cli-integration.md
**Feature:** 2026-04-21-skill-routing-cli-tools
**Test file:** tests/check-sro1-skill-routing.js

---

## Test Data Strategy

**Source:** The implementation targets are two existing SKILL.md files — `.github/skills/workflow/SKILL.md` and `.github/skills/improve/SKILL.md`. Both exist on disk at test time. No fixtures are required; tests read the actual files.

**TDD baseline:** All tests below fail before implementation because the strings they check (`generate-status-report.js`, `record-benefit-comparison.js`, `EXP-001` in the improve context, etc.) do not exist in either SKILL.md at the time this test plan is written. Tests pass only after the SKILL.md changes are merged to the branch under test.

**No browser, no external deps:** All tests use `fs.readFileSync` on local files. No HTTP, no DOM, no external modules beyond Node.js built-ins.

---

## AC Coverage Table

| AC | Summary | Test(s) | Type | Gap? |
|----|---------|---------|------|------|
| AC1 | `/workflow` session start includes `generate-status-report.js` callout | T1, T2 | Unit (file content check) | None |
| AC2 | `/workflow` includes `--daily` and `--weekly` flag variants with trigger routing | T3, T4 | Unit | None |
| AC3 | `/improve` completion section includes `record-benefit-comparison.js` with `--feature` flag and EXP-001 reference | T5, T6, T7 | Unit | None |
| AC4 | `/improve` benefit comparison is non-blocking — deferral acknowledged | T8 | Unit | None |
| AC5 | Both SKILL.md use `node scripts/` prefix in invocation strings | T-NFR1a, T-NFR1b | Unit | None |

---

## Unit Tests

### T1 — workflow SKILL.md contains generate-status-report.js

**AC:** AC1
**Precondition:** `.github/skills/workflow/SKILL.md` exists on disk
**Action:** Read file content; check for substring `generate-status-report.js`
**Expected:** String found
**Fails before implementation:** Yes — the string does not appear in workflow/SKILL.md today

---

### T2 — workflow SKILL.md references generate-status-report.js with --daily flag

**AC:** AC1
**Precondition:** `.github/skills/workflow/SKILL.md` exists
**Action:** Read file content; check for substring `--daily`
**Expected:** String found
**Fails before implementation:** Yes

---

### T3 — workflow SKILL.md references --weekly flag

**AC:** AC2
**Precondition:** `.github/skills/workflow/SKILL.md` exists
**Action:** Read file content; check for substring `--weekly`
**Expected:** String found
**Fails before implementation:** Yes

---

### T4 — workflow SKILL.md includes status report trigger routing phrases

**AC:** AC2
**Precondition:** `.github/skills/workflow/SKILL.md` exists
**Action:** Read file content; check for at least one of: `daily report`, `weekly report`, `status report` as a trigger phrase (case-insensitive)
**Expected:** At least one phrase found
**Fails before implementation:** Yes

---

### T5 — improve SKILL.md contains record-benefit-comparison.js

**AC:** AC3
**Precondition:** `.github/skills/improve/SKILL.md` exists
**Action:** Read file content; check for substring `record-benefit-comparison.js`
**Expected:** String found
**Fails before implementation:** Yes — the string does not appear in improve/SKILL.md today

---

### T6 — improve SKILL.md references --feature flag

**AC:** AC3
**Precondition:** `.github/skills/improve/SKILL.md` exists
**Action:** Read file content; check for substring `--feature`
**Expected:** String found
**Fails before implementation:** Yes

---

### T7 — improve SKILL.md references EXP-001 or Benefit Measurement

**AC:** AC3
**Precondition:** `.github/skills/improve/SKILL.md` exists
**Action:** Read file content; check for substring `EXP-001` OR `Benefit Measurement` (case-insensitive on the second)
**Expected:** At least one found
**Fails before implementation:** Yes

---

### T8 — improve SKILL.md benefit comparison is marked as non-blocking

**AC:** AC4
**Precondition:** `.github/skills/improve/SKILL.md` exists and contains `record-benefit-comparison.js`
**Action:** Read file content; within the section containing `record-benefit-comparison.js`, check for at least one of: `defer`, `skip`, `optional`, `non-blocking` (case-insensitive)
**Expected:** At least one found near the benefit comparison section
**Fails before implementation:** Yes (string not present at all)

---

## NFR Tests

### T-NFR1a — workflow SKILL.md uses correct node invocation prefix

**AC:** AC5
**Precondition:** `.github/skills/workflow/SKILL.md` contains `generate-status-report.js`
**Action:** Check for substring `node scripts/generate-status-report.js`
**Expected:** Exact string found (not just the filename alone)
**Fails before implementation:** Yes

---

### T-NFR1b — improve SKILL.md uses correct node invocation prefix

**AC:** AC5
**Precondition:** `.github/skills/improve/SKILL.md` contains `record-benefit-comparison.js`
**Action:** Check for substring `node scripts/record-benefit-comparison.js`
**Expected:** Exact string found
**Fails before implementation:** Yes

---

## Gap Table

| Gap | Type | Resolution |
|-----|------|------------|
| AC4 runtime deferral behaviour | Not directly verifiable from file content alone | T8 checks that non-blocking language (`defer`/`skip`/`optional`) is present in the SKILL.md near the benefit comparison. The skill author is responsible for correct runtime behaviour; this is the strongest structural guarantee available without executing the skill. Acknowledged as acceptable. |

---

## Integration Tests

None required. This story modifies instruction text in SKILL.md files; there are no component handoffs to test. The governance script (`tests/check-sro1-skill-routing.js`) covers all ACs via direct file-content inspection.
