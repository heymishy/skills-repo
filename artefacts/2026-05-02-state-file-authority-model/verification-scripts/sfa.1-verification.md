# AC Verification Script: sfa.1 — State File Authority Model

**Story reference:** `artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md`
**Technical test plan:** `artefacts/2026-05-02-state-file-authority-model/test-plans/sfa.1-test-plan.md`
**Script version:** 1
**Verified by:** _______________ | **Date:** __________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone or pull the repository so you have the latest `master` branch.
2. You need access to the file system — a text editor or file explorer is sufficient.
3. No browser or server is required. All checks are file-based.

**Reset between scenarios:** Each scenario is independent. No reset needed.

---

## Scenarios

### Scenario 1 — Schema file exists and has the right shape (AC1 + AC2)

**What you're checking:** A file called `workspace/state.schema.json` exists in the repository root and declares that `currentPhase`, `lastUpdated`, and `checkpoint` are required fields.

**Steps:**
1. Open the repository root in your file explorer or editor.
2. Look for the file `workspace/state.schema.json`.
3. Open the file.
4. Confirm the file is valid JSON (no red squiggles, no parse errors).
5. Confirm the file contains a `"required"` array.
6. Confirm the `"required"` array includes all three of: `"currentPhase"`, `"lastUpdated"`, `"checkpoint"`.

**Expected outcome:** File exists, opens cleanly, and the `required` array names all three fields.

**Fail if:** File is absent, malformed JSON, or the required array is missing or incomplete.

---

### Scenario 2 — Schema does not reject extra fields (AC6)

**What you're checking:** The schema allows future skills to add extra fields without breaking validation.

**Steps:**
1. Open `workspace/state.schema.json`.
2. Look for a key called `"additionalProperties"`.
3. If present, confirm its value is NOT `false`.
4. If absent, that is also acceptable — absence means extra fields are allowed by default.

**Expected outcome:** Either `additionalProperties` is absent, or it is set to `true` or an object — never `false`.

**Fail if:** `"additionalProperties": false` is present.

---

### Scenario 3 — Current session state file passes the schema (AC1 — COMPATIBILITY)

**What you're checking:** The `workspace/state.json` file that the pipeline writes today is compatible with the new schema — it already has the three required fields.

**Steps:**
1. Open `workspace/state.json`.
2. Confirm it contains a `"currentPhase"` field.
3. Confirm it contains a `"lastUpdated"` field.
4. Confirm it contains a `"checkpoint"` field (an object, not a string).

**Expected outcome:** All three fields are present.

**Fail if:** Any of the three required fields is missing from `workspace/state.json`.

---

### Scenario 4 — ADR-016 explains which file to write to (AC3)

**What you're checking:** A contributor who opens `.github/architecture-guardrails.md` and searches for "ADR-016" gets an unambiguous answer to "which state file do I write to?"

**Steps:**
1. Open `.github/architecture-guardrails.md`.
2. Search for `ADR-016`.
3. Read the section.
4. Confirm it clearly states that `pipeline-state.json` is the delivery evidence store (governed by strict schema, read by the dashboard).
5. Confirm it clearly states that `workspace/state.json` is operator session state (written only by `/checkpoint`).
6. Confirm it states the viz (dashboard) reads `pipeline-state.json` only — not `workspace/state.json`.

**Expected outcome:** Three statements are clearly present: (a) pipeline-state is delivery evidence, (b) workspace/state is session state, (c) viz reads pipeline-state only.

**Fail if:** ADR-016 is absent, or any of the three statements is missing or ambiguous.

---

### Scenario 5 — ADR-017 explains the story nesting structure (AC4)

**What you're checking:** A contributor who searches for "ADR-017" understands: new features use the flat `stories[]` structure; Phase 1/2 nested structure is legacy and not being migrated.

**Steps:**
1. Open `.github/architecture-guardrails.md`.
2. Search for `ADR-017`.
3. Read the section.
4. Confirm it states that new features use flat `features[].stories[]` (Phase 3+ shape).
5. Confirm it states that the Phase 1/2 nested `epics[].stories[]` structure is legacy and NOT being migrated.
6. Confirm it mentions that tooling must handle both structures (check for `slug` and `id` fields).

**Expected outcome:** Three statements present: (a) flat structure for new features, (b) nested structure is legacy/not migrated, (c) tooling handles both.

**Fail if:** ADR-017 is absent, or any of the three statements is missing.

---

### Scenario 6 — /checkpoint SKILL.md references the schema (AC5)

**What you're checking:** When a skill runs `/checkpoint`, it can look at its SKILL.md and find the path to `workspace/state.schema.json` so it knows to validate the state file before confirming.

**Steps:**
1. Open `.github/skills/checkpoint/SKILL.md`.
2. Search for `workspace/state.schema.json`.
3. Confirm the text appears — ideally in a validation or confirmation step.

**Expected outcome:** The string `workspace/state.schema.json` appears in the checkpoint skill instructions.

**Fail if:** The string is absent from the checkpoint SKILL.md.

---

## Summary checklist

| Scenario | Description | Pass | Fail | Notes |
|----------|-------------|------|------|-------|
| 1 | Schema file exists + 3 required fields | [ ] | [ ] | |
| 2 | Schema tolerates additional properties | [ ] | [ ] | |
| 3 | Current state.json passes schema | [ ] | [ ] | |
| 4 | ADR-016 — two-file authority model | [ ] | [ ] | |
| 5 | ADR-017 — story nesting guidance | [ ] | [ ] | |
| 6 | /checkpoint references schema path | [ ] | [ ] | |
