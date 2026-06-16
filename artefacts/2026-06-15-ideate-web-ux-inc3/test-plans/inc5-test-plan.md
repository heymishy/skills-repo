# Test Plan: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md

**Story reference:** artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md
**Epic reference:** inc3-inc4 — Skill cadence + canvas output (`.github/pipeline-state.json` epics[inc3-inc4])
**Test plan author:** Claude Sonnet 4.6 (agent)
**Date:** 2026-06-16

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Lens A emits `cluster-tree` CANVAS-JSON marker | 1 test | — | — | Scenario 1 | Untestable-by-nature | 🔴 |
| AC2 | Lens D emits `table` CANVAS-JSON marker | 1 test | — | — | Scenario 2 | Untestable-by-nature | 🔴 |
| AC3 | Narrative lens output (C/E) emits `text` CANVAS-JSON marker | 1 test | — | — | — | — | 🟢 |
| AC4 | Markers comply with `parseCanvasBlock` schema (type/title/content), one example per type | 1 test | — | — | — | — | 🟢 |
| AC5 | Markers stripped from chat stream (no chat-bubble JSON) | — | — | — | — | — | 🟢 |
| AC6 | Exactly one CANVAS-JSON marker per lens output (cadence) | 1 test | — | — | Scenario 3 | Untestable-by-nature | 🔴 |

AC5 requires no new test in this story. inc4's existing automated test (`tests/check-inc4-canvas-panel.js`, T5) already verifies that any `---CANVAS-JSON:`-marked text is stripped from the `chunk` display stream. inc5 makes no code change to the stripping logic — it only adds instruction text that causes the model to emit markers the existing stripper already handles. Coverage of AC5 for this story is regression: confirm `check-inc4-canvas-panel.js` still passes unmodified after inc5's SKILL.md change.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest/Node | Handling |
|-----|----|----------|--------------------------------|---------|
| Whether the model actually emits a `cluster-tree` marker for Lens A in a real session | AC1 | Untestable-by-nature | Model output at inference time is non-deterministic; a static text check on SKILL.md can confirm the instruction exists but not that the model follows it | Manual scenario 1 — see verification script. Blocking DoD gate per story's Definition of done entry condition. 🔴 |
| Whether the model actually emits a `table` marker for Lens D in a real session | AC2 | Untestable-by-nature | Same as above | Manual scenario 2 — see verification script. Blocking DoD gate per story's Definition of done entry condition. 🔴 |
| Whether the model emits exactly one marker per lens step in practice (not zero, not duplicates) | AC6 | Untestable-by-nature | Cadence is a live-session behavioural property, not a property of the instruction text | Manual scenario 3 — see verification script. Not a DoD blocking gate (DoD note names only Lens A and Lens D), but recorded as an open verification point. |

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup/teardown

This story is instruction-only: it adds text to `.github/skills/ideate/SKILL.md` and adds no new runtime code path. There is no database, no external service call, and no user-supplied data involved. The only "data" the tests need is literal example marker strings (e.g. `---CANVAS-JSON: {"type":"cluster-tree","title":"...","content":{...}}---`) used to assert that the instruction text documents the correct schema and includes a concrete example per type. These strings are written inline in the test file itself — no fixtures, seeded DB, or mocks are needed.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Literal substrings expected in SKILL.md (`cluster-tree`, Lens A heading text) | Synthetic — inline in test | None | |
| AC2 | Literal substrings expected in SKILL.md (`table`, Lens D heading text) | Synthetic — inline in test | None | |
| AC3 | Literal substrings expected in SKILL.md (`text`, narrative-lens reference) | Synthetic — inline in test | None | |
| AC4 | Example marker strings for all three types, schema field names | Synthetic — inline in test | None | |
| AC6 | Literal cadence-guidance substring (e.g. "exactly one" / "one ... per lens") | Synthetic — inline in test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — test data is fully available now (it is the test file's own source code).

---

## Unit Tests

### SKILL.md contains a cluster-tree CANVAS-JSON instruction tied to Lens A

- **Verifies:** AC1
- **Precondition:** `.github/skills/ideate/SKILL.md` is read from disk as a UTF-8 string
- **Action:** Search the string for `CANVAS-JSON` and for `cluster-tree` in proximity to a Lens A reference
- **Expected result:** Both substrings are present, and a `cluster-tree` example/instruction appears within the same instruction block as the Lens A reference (not just anywhere in the file)
- **Edge case:** No — currently fails because no such instruction exists in SKILL.md yet (TDD red state)

### SKILL.md contains a table CANVAS-JSON instruction tied to Lens D

- **Verifies:** AC2
- **Precondition:** Same file read as above
- **Action:** Search for `table` type marker instruction in proximity to a Lens D reference
- **Expected result:** A `table` example/instruction appears within the same instruction block as the Lens D reference
- **Edge case:** No — currently fails (TDD red state)

### SKILL.md contains a text CANVAS-JSON instruction for narrative lens output

- **Verifies:** AC3
- **Precondition:** Same file read as above
- **Action:** Search for a `text` type marker instruction associated with narrative/prose lens output (e.g. Lens C, Lens E, or a general "non-structured output" fallback statement)
- **Expected result:** A `text` example/instruction is present and is explicitly scoped to narrative/prose lens output, not structured data
- **Edge case:** No — currently fails (TDD red state)

### SKILL.md documents the full CANVAS-JSON schema with one example per type

- **Verifies:** AC4
- **Precondition:** Same file read as above
- **Action:** Check for the literal field names `type`, `title`, `content` in a schema/marker-format description, and for one complete `---CANVAS-JSON: {...}---` example per type (`cluster-tree`, `table`, `text`)
- **Expected result:** All three field names are documented, and three distinct, well-formed example markers are present (one per type), each matching the regex `---CANVAS-JSON:\s*\{[^}]+\}---` or an equivalent multi-line-safe pattern
- **Edge case:** Yes — must confirm the examples are well-formed JSON inside the marker delimiters, not just that the word "CANVAS-JSON" appears

### SKILL.md states a one-marker-per-lens-output cadence rule

- **Verifies:** AC6
- **Precondition:** Same file read as above
- **Action:** Search for explicit cadence language (e.g. "exactly one", "a single CANVAS-JSON marker per lens", "do not emit more than one")
- **Expected result:** Cadence guidance is present and unambiguous — it must rule out both zero and multiple markers per lens step, not just describe the marker format
- **Edge case:** No — currently fails (TDD red state)

---

## Integration Tests

None. This story changes a single file (`.github/skills/ideate/SKILL.md`, instruction text only) and introduces no new component handoff. The marker-consuming pipeline (`parseCanvasBlock`, `canvasBlock` SSE event, `#canvas-panel` render) already exists from inc4 and is unmodified by this story — its integration tests already exist in `tests/check-inc4-canvas-panel.js` and are exercised as a regression check (see AC5 above), not written fresh here.

---

## NFR Tests

None — confirmed. The story's NFRs section states "None identified — instruction text only, no new runtime path, no client/server code touched." (`artefacts/2026-06-15-ideate-web-ux-inc3/stories/inc5.md`).

---

## Out of Scope for This Test Plan

- Verifying inc4's `parseCanvasBlock`, SSE pipeline, or `#canvas-panel` rendering logic — already covered by inc4's own test plan and test file (`tests/check-inc4-canvas-panel.js`), unmodified by this story
- New canvas block types beyond `cluster-tree`, `table`, `text` — out of scope per the story's own "Out of scope" section
- Any change to canvas panel layout, CSS, or renderer — inc4, not this story
- Full end-to-end browser automation of a live `/ideate` session — no E2E tooling requirement is triggered (see Step 3a determination below); covered by manual scenarios instead

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Model may not reliably follow the new instruction in every session | LLM instruction-following is probabilistic, not deterministic — no unit test can prove behavioural compliance | Manual verification scenarios 1–3 in the verification script; scenarios 1 and 2 are a blocking DoD gate per the story's "Definition of done entry condition" |
| Cadence (AC6) verified only by instruction-text presence, not enforced at the code level | inc4 built no server-side dedup/limit logic for canvas markers — cadence is purely a model-instruction concern | Accepted for this story (Complexity Rating 1, instruction-only); if repeat violations are observed in practice, a follow-up story to add server-side dedup would be the correct fix, not a retroactive change to this story |

---

## Step 3a — E2E / browser-layout detection

None of inc5's ACs mention drag-and-drop, pointer/click coordinates, `getBoundingClientRect`/`offsetTop`/`scrollTop`, CSS-positioned on-screen verification, or visual rendering (font, colour, z-index). All six ACs concern either (a) static text content of `SKILL.md`, or (b) live-session model behaviour observable directly in the existing `#canvas-panel` (already rendered correctly per inc4's own tests — this story does not touch that rendering path).

**Determination: no AC is CSS-layout-dependent. `hasLayoutDependentGaps: false`, `e2eToolingRequired: false`.**
