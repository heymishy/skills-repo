# Test Plan: cdg.7 — Gated advance and web UI adapter wiring

**Story:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.7.md
**Test file:** `tests/check-cdg7-gate-advance.js`
**Created:** 2026-05-24

---

## Tests

### T1 — AC1: validate non-zero blocks gate-advance; state is not modified
**Type:** Unit
**Given:** A minimal pipeline-state fixture written to a temp dir. A stub artefact file that will cause `validate()` to return exit code 1.
**When:** `gateAdvance(featureSlug, storyId, 'definition-of-ready', artefactPath, ['stage=dor-signed-off'], repoRoot)` is called.
**Then:**
- Return value `exitCode` is 1 (same as validate's exit code)
- pipeline-state fixture is not modified (no `stage` field written)

### T2 — AC1: validate exit code is propagated faithfully (exit 4)
**Type:** Unit
**Given:** A stub validate that returns exit code 4.
**When:** `gateAdvance` is called with any field pairs.
**Then:** Return value `exitCode` is 4.

### T3 — AC2: validate exit 0 → field is written, gate-advance exits 0
**Type:** Unit + Integration (temp dir)
**Given:** A minimal pipeline-state fixture. A stub artefact that causes `validate()` to return exit 0.
**When:** `gateAdvance(featureSlug, storyId, 'definition-of-ready', artefactPath, ['stage=dor-signed-off'], repoRoot)` is called.
**Then:**
- Return value `exitCode` is 0
- Re-reading the fixture file shows the target story has `stage: 'dor-signed-off'`

### T4 — AC2: validate exit 0 + multiple field pairs → all written
**Type:** Unit
**Given:** A story fixture with validate returning 0.
**When:** `gateAdvance` is called with `['stage=dor-signed-off', 'prStatus=draft', 'dorStatus=signed-off']`.
**Then:** All three fields are written; exit code is 0.

### T5 — AC3: missing artefact-path arg (3 positional args) → exit 8 with usage
**Type:** Unit
**Given:** `gateAdvance` called with `featureSlug`, `storyId`, `gateName` but `artefactPath` is undefined or absent.
**When:** Function runs.
**Then:** `exitCode` is 8; `stderr` contains the 4 required positional arg names.

### T6 — AC3: missing gate-name and artefact-path (2 positional args) → exit 8
**Type:** Unit
**Given:** `gateAdvance` called with only `featureSlug` and `storyId`.
**When:** Function runs.
**Then:** `exitCode` is 8.

### T7 — AC4: gate-map.js exports all 7 gated stage values
**Type:** Governance
**Given:** `require('../../src/enforcement/gate-map')` is called.
**When:** The exported object's keys are enumerated.
**Then:** The following 7 keys are all present: `discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`.

### T8 — AC4: each gate-map entry has a `gate` string property
**Type:** Governance
**Given:** The gate-map object.
**When:** Each value is inspected.
**Then:** Every entry has a `gate` property that is a non-empty string.

### T9 — AC5: pipeline-state-writer delegates story write to advance(); field is written
**Type:** Integration (temp dir)
**Given:** A minimal pipeline-state fixture in a temp dir. The factory is created with the temp dir as repoRoot.
**When:** The writer is called with `featureSlug`, `storyId='s1'`, `stateUpdate: { prStatus: 'draft' }`.
**Then:**
- No error is thrown
- Re-reading the fixture shows story `s1` has `prStatus: 'draft'`

### T10 — AC5: pipeline-state-writer with invalid prStatus rejects via advance() validation
**Type:** Unit
**Given:** A pipeline-state fixture in a temp dir.
**When:** The writer is called with `stateUpdate: { prStatus: 'INVALID' }`.
**Then:** An error is thrown with a message referencing the invalid prStatus value.

### T11 — AC5: pipeline-state-writer with `__proto__` key in stateUpdate throws (proto guard)
**Type:** Unit
**Given:** A pipeline-state fixture.
**When:** The writer is called with a stateUpdate object that has `__proto__` as a key (constructed via `Object.assign({}, base, {'__proto__': 'x'})`).
**Then:** An error is thrown before any state write occurs.

### T12 — AC5: pipeline-state-writer correctly updates an epic-nested story (advance() lookup fix)
**Type:** Integration (temp dir)
**Given:** A pipeline-state fixture where the target story exists only in `feature.epics[0].stories[0]` (not in `feature.stories[]`).
**When:** The writer is called for that story with `stateUpdate: { prStatus: 'merged' }`.
**Then:**
- No error is thrown
- Re-reading the fixture shows the epic-nested story has `prStatus: 'merged'`
- `feature.stories` remains empty (no phantom flat entry)

### T13 — AC6: copilot-instructions.md contains gate-advance mandate text
**Type:** Governance
**Given:** `.github/copilot-instructions.md` is read.
**When:** Its content is checked.
**Then:** It contains the string `gate-advance` and a reference to the 7 gated stage values (or a reference to the gate-map).

### T14 — Governance: npm test chain includes cdg.7 test file
**Type:** Governance
**Given:** `package.json` on the implementation branch.
**When:** The `test` script is read.
**Then:** It contains `node tests/check-cdg7-gate-advance.js`.

---

## AC coverage matrix

| AC | Test(s) |
|----|---------|
| AC1 — validate non-zero blocks write | T1, T2 |
| AC2 — validate 0 → state written | T3, T4 |
| AC3 — missing args → exit 8 usage | T5, T6 |
| AC4 — gate-map.js registry | T7, T8 |
| AC5 — pipeline-state-writer uses advance() | T9, T10, T11, T12 |
| AC6 — copilot-instructions.md mandate | T13 |
| Governance — npm chain | T14 |
