# Test Plan: dsq.4 — Section-by-section artefact assembly

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.4-section-artefact-assembly.md
**Test file:** tests/check-dsq4-section-artefact-assembly.js
**Review report:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/review/dsq.4-review.md

---

## Test data strategy

**Type:** Synthetic + Mocked

All tests inject synthetic session data (questions, sections, answers, sectionDrafts) via `makeSession` overrides. `htmlGetPreview` is the only function under test. No real HTTP requests. No disk reads during assertions. Self-contained: `node tests/check-dsq4-section-artefact-assembly.js`.

---

## AC coverage

| AC | Description (brief) | Test(s) | Type | Status |
|----|----------------------|---------|------|--------|
| AC1 | Sectioned skill → H2 headings in artefactContent, no Q/A prefixes | T5.1 | Unit | ❌ fail before impl |
| AC2 | `sectionDrafts[i]` populated → section content = draft text | T5.2 | Unit | ❌ fail before impl |
| AC3 | `sectionDrafts[i]` absent → section content = concatenated answers | T5.3 | Unit | ❌ fail before impl |
| AC4 | Flat skill (no H2) → single section, skill name as heading | T5.4 | Unit | ❌ fail before impl |
| AC5 | Commit-preview page renders section-structured content (smoke) | T5.5 | Unit | ❌ fail before impl |
| AC6 | Regression: section order matches SKILL.md order | T5.6, T5.7 | Regression/Unit | ❌ fail before impl |

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|-----------|
| Mixed sections (some with drafts, some without) | MEDIUM — both paths could interfere | T5.2 + T5.3 test each path independently; one test could also test mixed (not required by AC) |
| Empty section (no answers, no draft) | LOW — no AC requires this; empty section stays empty | Not in AC; skip |
| `artefactPath` unchanged | LOW — AC6 explicitly states no change to path derivation | T5.7 includes assertion that artefactPath uses same derivation |

---

## Unit tests

### T5.1 — AC1: Sectioned skill → H2 headings, no Q/A prefixes

**Given** a session with 2 sections (`sections[]`) and answers for all questions, no sectionDrafts
**When** `htmlGetPreview(skillName, sessionId)` is called
**Then**
- `artefactContent` contains `## Background` and `## Constraints` (section headings) in that order
- `artefactContent` does NOT contain `Q1:` or `A:` or `## Q` (old-format prefixes)
- `artefactContent` contains the answer texts

---

### T5.2 — AC2: `sectionDrafts[i]` populated → section content = draft text

**Given** a session with 2 sections and `session.sectionDrafts[0] = 'Confirmed draft for Background.'`
**When** `htmlGetPreview` is called
**Then**
- The content under `## Background` equals `'Confirmed draft for Background.'`
- The draft text, not the raw answers, appears for section 0

---

### T5.3 — AC3: `sectionDrafts[i]` absent → answers concatenated under heading

**Given** a session with 2 sections, `session.sectionDrafts` is empty/undefined for section 0
**When** `htmlGetPreview` is called
**Then**
- The content under `## Background` includes the answers for section 0 (no Q/A label prefix)
- Each answer appears as a plain line without `Q1:`, `A:`, or `Q:` prefix

---

### T5.4 — AC4: Flat skill (no H2 sections) → skill name as heading, answers concatenated

**Given** a session with `session.sections = [{ heading: '', questions: [...] }]` (flat skill)
**When** `htmlGetPreview` is called
**Then**
- `artefactContent` contains the skill name as an H2 heading (e.g. `## discovery`)
- Answers are concatenated under that heading
- No Q/A label prefixes

---

### T5.5 — AC5 (smoke): `artefactContent` from `htmlGetPreview` is a non-empty string

**Given** a complete session with sections and answers
**When** `htmlGetPreview` is called
**Then**
- Returns `{ artefactContent, artefactPath }`
- `artefactContent` is a non-empty string
- `artefactPath` follows the existing derivation (unchanged — includes today's date and skill name)

---

### T5.6 — AC6: Section order preserved

**Given** a session with 3 sections: 'Alpha', 'Beta', 'Gamma'
**When** `htmlGetPreview` is called
**Then**
- `indexOf('## Alpha')` < `indexOf('## Beta')` < `indexOf('## Gamma')` in `artefactContent`

---

### T5.7 — AC6 regression: `artefactPath` derivation unchanged

**Given** any session
**When** `htmlGetPreview` is called
**Then**
- `artefactPath` matches the pattern `artefacts/YYYY-MM-DD-<skillName>/session-<sessionId>-output.md`
  (same format as before dsq.4 changes)

---

## NFR tests

T5.6 explicitly tests the section-order NFR ("Section order in the assembled artefact must match SKILL.md section order").

---

## Test execution

```
node tests/check-dsq4-section-artefact-assembly.js
```

All 7 tests must FAIL before implementation. All 7 must PASS after implementation.
