## Test Plan: Governance check — validate capture block completeness

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.5-governance-check-capture-completeness.md
**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Script exists at `scripts/check-capture-completeness.js`; scans artefacts; reports expected vs found; exits 0 if ≥80% | 3 tests | — | — | — | — | 🟢 |
| AC2 | Script checks 6 required metadata fields and reports missing as warnings | 2 tests | — | — | — | — | 🟢 |
| AC3 | Artefacts without capture block listed by filename with missing-block message | 1 test | — | — | — | — | 🟢 |
| AC4 | Exits 0 immediately with skip message when instrumentation.enabled is false | 1 test | — | — | — | — | 🟢 |
| AC5 | Script NOT in `npm test` chain | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic fixtures — Markdown files created in-memory or as temp files during test runs to simulate artefacts with and without capture blocks.
**PCI/sensitivity in scope:** No
**Availability:** Self-contained — fixtures created in test setup.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 (≥80%) | 5 phase output artefacts, 4–5 with complete capture block | Synthetic temp files | None | |
| AC1 (<80%) | 5 phase output artefacts, fewer than 4 with capture block | Synthetic temp files | None | |
| AC2 | Artefact with capture block missing required fields (e.g. missing `skill_name`) | Synthetic temp file | None | |
| AC3 | Artefact file with no `## Capture Block` section | Synthetic temp file | None | |
| AC4 | Minimal `context.yml` with `instrumentation.enabled: false` | Inline string or temp file | None | |
| AC5 | `package.json` | Filesystem read | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests are plain Node.js. Test file: `tests/check-spc5-capture-completeness-script.js`. Tests run the actual script as a subprocess (`child_process.execSync` or `spawnSync`) with fixture inputs.

**T1 — AC5: script not in npm test chain (guard first)**
- Name: `package.json test script does not include check-capture-completeness.js`
- Covers: AC5
- Action: Read `package.json` test script; check it does NOT contain `check-capture-completeness`
- Expected result: string absent
- Fails before implementation: no — guard test preventing future accidental addition

**T2 — AC1: script file exists**
- Name: `scripts/check-capture-completeness.js exists`
- Covers: AC1
- Action: `fs.existsSync('scripts/check-capture-completeness.js')`
- Expected result: `true`
- Fails before implementation: yes

**T3 — AC1: exits 0 when ≥80% completeness (4 of 5 artefacts have capture blocks)**
- Name: `script exits 0 when 4 of 5 artefacts have complete capture blocks`
- Covers: AC1
- Precondition: Temp dir with 5 synthetic artefact .md files; 4 containing `## Capture Block` with all 6 required fields; 1 without any capture block
- Action: `node scripts/check-capture-completeness.js --artefact-dir [temp-dir]`
- Expected result: exit code 0; output contains count showing 4/5 or 80% found
- Fails before implementation: yes

**T4 — AC1: exits 1 when <80% completeness (2 of 5 artefacts have capture blocks)**
- Name: `script exits 1 when fewer than 80% of artefacts have capture blocks`
- Covers: AC1
- Precondition: Temp dir with 5 synthetic artefact .md files; only 2 with capture blocks
- Action: Run script against temp dir
- Expected result: exit code 1; output indicates completeness below threshold
- Fails before implementation: yes

**T5 — AC2: reports missing required fields as warnings**
- Name: `script reports missing metadata fields as warnings for incomplete capture blocks`
- Covers: AC2
- Precondition: Temp dir with 1 artefact containing `## Capture Block` but missing `skill_name` field value
- Action: Run script; capture stdout
- Expected result: Output contains a warning referencing `skill_name` as a missing field
- Fails before implementation: yes

**T6 — AC2: reports all 6 required fields by name**
- Name: `script validates presence of all 6 required metadata fields: experiment_id, model_label, cost_tier, skill_name, artefact_path, run_timestamp`
- Covers: AC2
- Precondition: Temp artefact with capture block missing all 6 required fields (block heading present but all field values absent)
- Action: Run script; capture stdout
- Expected result: All 6 field names appear in the output as missing-field warnings
- Fails before implementation: yes

**T7 — AC3: artefacts without capture block listed by file path**
- Name: `script lists missing-block artefacts by file path`
- Covers: AC3
- Precondition: Temp dir with 2 artefacts: one with capture block, one without
- Action: Run script; capture stdout
- Expected result: The filename of the artefact without a capture block appears in the output; the filename with a capture block does not appear as missing
- Fails before implementation: yes

**T8 — AC4: exits 0 immediately with skip message when instrumentation disabled**
- Name: `script exits 0 with skip message when context.yml has instrumentation.enabled: false`
- Covers: AC4
- Precondition: Temp context.yml with `instrumentation:\n  enabled: false` (or a YAML string equivalent); pass it to the script via flag or env variable
- Action: Run script with disabled context; capture stdout and exit code
- Expected result: exit code 0; stdout contains "Instrumentation not enabled" and "skipped" (or equivalent); no artefact scanning output
- Fails before implementation: yes

---

## Integration Tests

None. The script is self-contained — it reads Markdown files and context.yml. No inter-component handoffs to test beyond the filesystem interactions already covered in unit tests.

---

## NFR Tests

**NFR: Performance — completes in under 5 seconds for a typical artefact set**
- Name: `script completes in under 5000ms for a 15-file artefact set`
- Action: Create temp dir with 15 synthetic artefact files (mix of with/without capture blocks); time the script run
- Expected result: Total execution time < 5000ms
- Fails before implementation: no (trivially passes once the script exists and does its job)

**NFR: Security — script reads file contents for structure only, does not log raw content**
- Name: `script output does not include raw artefact file content — field presence only`
- Action: Create temp artefact with distinctive long content (e.g. a paragraph of text); run script; check that the paragraph text does not appear in stdout
- Expected result: stdout contains only field names, counts, and file paths — not raw artefact text
- Fails before implementation: yes — script does not yet exist

---

## Gap table

No gaps.
