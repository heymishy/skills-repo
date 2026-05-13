## Test Plan: Define experiment workspace structure and manifest format

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.4-experiment-workspace-structure.md
**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `workspace/experiments/README.md` documents the required directory structure (resolved per RISK-ACCEPT 1-M8) | 4 tests | — | — | — | — | 🟢 |
| AC2 | Manifest template has 6 required fields including `runs[]` with sub-fields | 3 tests | — | — | — | — | 🟢 |
| AC3 | `npm test` does not fail or warn due to files in `workspace/experiments/` | 1 test | — | — | — | — | 🟢 |
| AC4 | `contexts/personal.yml` instrumentation comment references `workspace/experiments/[experiment-id]/` | 1 test | — | — | — | — | 🟢 |

Note: AC1 deliverable resolved to `workspace/experiments/README.md` per decisions.md RISK-ACCEPT 1-M8.

---

## Coverage gaps

No gaps.

---

## Test Data Strategy

**Source:** Synthetic — tests read committed files from the repo filesystem (`workspace/experiments/README.md`, `contexts/personal.yml`, and `package.json`).
**PCI/sensitivity in scope:** No
**Availability:** Available once spc.4 is implemented.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `workspace/experiments/README.md` | Filesystem read | None | README is the primary deliverable |
| AC2 | Manifest template (embedded in README.md or at a separate path `workspace/experiments/manifest-template.md`) | Filesystem read | None | Coding agent decides exact location; both should be checked |
| AC3 | `package.json` test script string | Filesystem read | None | Negative assertion — workspace/experiments/ path must not appear in test command |
| AC4 | `contexts/personal.yml` | Filesystem read | None | Checks the comment added by spc.1 (cross-story dependency, spc.1 must be implemented first) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests are plain Node.js. Test file: `tests/check-spc4-experiment-structure.js`.

**T1 — AC1: README exists**
- Name: `workspace/experiments/README.md exists`
- Covers: AC1
- Action: `fs.existsSync('workspace/experiments/README.md')`
- Expected result: `true`
- Fails before implementation: yes

**T2 — AC1: README documents [experiment-id]/ directory structure**
- Name: `workspace/experiments/README.md documents [experiment-id]/ subdirectory structure`
- Covers: AC1
- Action: Read README; check it contains text describing the `[experiment-id]/` or `[id]/` directory naming convention
- Expected result: text found
- Fails before implementation: yes

**T3 — AC1: README documents manifest.md location**
- Name: `workspace/experiments/README.md documents manifest.md within each experiment directory`
- Covers: AC1
- Action: Read README; check it references `manifest.md` as a file within each experiment directory
- Expected result: `manifest.md` reference found
- Fails before implementation: yes

**T4 — AC1: README documents per-model-run subdirectory structure**
- Name: `workspace/experiments/README.md documents per-model-run subdirectory with artefacts/ subfolder`
- Covers: AC1
- Action: Read README; check it references per-model-run directories and an `artefacts/` subfolder within each
- Expected result: both references found
- Fails before implementation: yes

**T5 — AC2: manifest template has experiment_id field**
- Name: `manifest template contains experiment_id field`
- Covers: AC2
- Action: Read manifest template file (README or separate template); check for `experiment_id`
- Expected result: field found
- Fails before implementation: yes

**T6 — AC2: manifest template has all 6 required top-level fields**
- Name: `manifest template contains all 6 required fields: experiment_id, scenario_description, runs[], comparison_notes, and run sub-fields`
- Covers: AC2
- Action: Check manifest template for all of: `experiment_id`, `scenario_description`, `runs`, `comparison_notes`, `model_label`, `run_date` (inside runs), `artefact_paths` (inside runs), `cost_tier` (inside runs)
- Expected result: all field names present
- Fails before implementation: yes

**T7 — AC2: manifest template credential warning present**
- Name: `manifest template contains comment warning against API keys and credentials`
- Covers: AC2 + NFR Security
- Action: Check manifest template for a comment stating that model_label and cost_tier are descriptive strings only — no credentials
- Expected result: warning comment found
- Fails before implementation: yes

**T8 — AC3: workspace/experiments/ not targeted by npm test chain**
- Name: `package.json test script does not reference workspace/experiments/`
- Covers: AC3
- Action: Read `package.json` test script string; check it does NOT contain `workspace/experiments`
- Expected result: string not found (negative assertion)
- Fails before implementation: no (workspace/experiments is not currently in the test chain) — this is a guard test preventing future regression
- Note: Also check `.gitignore` or equivalent exclusion mechanism exists for `workspace/experiments/`

**T9 — AC4: contexts/personal.yml instrumentation comment references workspace/experiments/**
- Name: `contexts/personal.yml instrumentation block comment references workspace/experiments/[experiment-id]/`
- Covers: AC4
- Action: Read `contexts/personal.yml`; check that the instrumentation block comment references `workspace/experiments/` as the output location
- Expected result: `workspace/experiments/` reference found in or near the instrumentation block
- Fails before implementation: yes (requires spc.1 to be implemented first — cross-story test)

---

## Integration Tests

None required. spc.4 is static documentation files with no inter-component handoffs.

---

## NFR Tests

**NFR: Security — manifest credential warning**
Covered by T7 above.

**NFR: Consistency — experiment_id three-way consistency note**
- Name: `manifest template documents three-way consistency requirement for experiment_id`
- Action: Read manifest template; check for a note or comment describing that experiment_id must match the directory name and the context.yml instrumentation.experiment_id value
- Expected result: consistency note found
- Fails before implementation: yes

---

## Gap table

No gaps.
