# AC Verification Script: Define experiment workspace structure and manifest format

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.4-experiment-workspace-structure.md
**Technical test plan:** artefacts/2026-04-18-skill-performance-capture/test-plans/spc.4-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Pre-code** [ ] Post-merge  [ ] Demo

**RISK-ACCEPT 1-M8 in effect:** AC1 deliverable is `workspace/experiments/README.md` specifically. Any file at a different path does not satisfy this AC.

---

## Setup

**Before you start:**
1. Open the repository in a file browser.
2. Navigate to `workspace/experiments/`.
3. Have `package.json` open in a second tab for Scenario 4.
4. Have `contexts/personal.yml` open in a third tab for Scenario 5.

**Reset between scenarios:** Not needed — all scenarios are read-only inspections.

---

## Scenarios

---

### Scenario 1: `workspace/experiments/README.md` exists and describes the directory structure

**Covers:** AC1 (per RISK-ACCEPT 1-M8: deliverable is `workspace/experiments/README.md`)

**Steps:**
1. Navigate to `workspace/experiments/README.md`.
2. Confirm the file exists.
3. Read it.

**Expected outcome:**
> The file exists. It describes a directory structure where each experiment is stored in a sub-directory named after its `experiment_id` (e.g. `workspace/experiments/[experiment-id]/`). The structure shows what goes inside each experiment directory — at minimum the manifest file.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Manifest template describes all required fields

**Covers:** AC2

**Steps:**
1. In `workspace/experiments/README.md` (or a separate template linked from it), find the manifest format description.
2. Check that all of the following fields are described or templated: `experiment_id`, `scenario_description`, `runs` (an array/list), `comparison_notes`.
3. Within the `runs` entries, check that each run item documents: `model_label`, `cost_tier`, `run_date`, `artefact_paths` (an array/list).

**Expected outcome:**
> All four manifest-level fields and all four per-run fields are present. The format of `runs` makes clear it is a list — either by example, array notation, or explicit description. A reader can fill in a manifest from scratch using only this documentation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Manifest lists artefact paths, not artefact content

**Covers:** AC2 (path references, not inline content)

**Steps:**
1. Review the manifest template's `artefact_paths` field.
2. Check whether the template shows paths like `artefacts/2026-04-18-feature/stories/spc.1.md` — relative paths to files — not embedded file content.

**Expected outcome:**
> `artefact_paths` is a list of relative file paths to artefacts, not a field that embeds artefact content inline. This keeps manifests compact and the actual artefacts at their canonical locations.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: `workspace/experiments/` is not scanned by `npm test`

**Covers:** AC3

**Steps:**
1. Open `package.json` at the repository root.
2. Read the `test` script and any test glob patterns.
3. Check whether `workspace/experiments/` is excluded (either by not being included or by explicit exclusion).
4. Open `tests/` and check if any test file explicitly scans `workspace/experiments/`.

**Expected outcome:**
> `package.json`'s test command does not include `workspace/experiments/` in its glob pattern. The `tests/` directory has no test file that scans or imports from `workspace/experiments/`. Running `npm test` will not fail because of content in experiment directories.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: `contexts/personal.yml` instrumentation comment references `workspace/experiments/`

**Covers:** AC4

**Steps:**
1. Open `contexts/personal.yml`.
2. Read the comment in the `instrumentation:` block, especially the description for `experiment_id`.

**Expected outcome:**
> The comment or example value for `experiment_id` in `contexts/personal.yml` references or is consistent with the `workspace/experiments/[experiment-id]/` path convention. An operator reading the YAML comment can infer where their experiment data will be stored without consulting additional documentation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
