## Story: Fix web-UI-to-CLI artefact splitter parity bugs (definition + review)

**Epic reference:** None — short-track (bounded bugfix in existing web-UI-only glue code, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator moving a feature between the web UI and Claude Code CLI on the same repo**,
I want **the web UI's split epic/story/review files to genuinely match what a CLI-driven session would produce, instead of silently corrupting or misrepresenting their content**,
So that **the artefact files I read and act on (in either channel) are trustworthy, whichever channel produced them**.

## Benefit Linkage

**Metric moved:** None formal — correctness/trust fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly follows from investigating a real feature (`new-feature-2b74a292`) created entirely through the web UI, where every one of its 13 split story files had a broken `As a / I want / So that` section (missing "I want" entirely; "So that" duplicated the Benefit Linkage text verbatim) and a duplicated, unlabeled Given/When/Then block wedged between `## Architecture Constraints` and `## Dependencies`. Separately, the split per-story review files (`review/ep*-review-1.md`) all recorded `**Outcome:** PASS` with zero findings, despite the underlying review content — when read directly — showing every story FAILED with `### Verdict: **FAIL**` and a documented HIGH finding (fewer than 3 ACs). Root-caused to two web-UI-only files: `src/web-ui/utils/definition-artefact-splitter.js` and `src/web-ui/utils/review-artefact-splitter.js`, both of which exist specifically (`defs-s1`/`revs-s1`) to give web-UI-produced artefacts the same on-disk shape a CLI-driven session already produces — i.e., this is a direct bug in the exact "seamless move between web UI and Claude Code" capability.

**Decision basis:** the flat, un-split artefact (`definition.md`, and the raw review turn content) is unaffected and remains a correct, durable record — only the *derived* per-file split is wrong. This is scoped as a bugfix to that derived layer, not a data-recovery task (the one real feature affected, `new-feature-2b74a292`, was already manually fixed in a prior session).

## Architecture Constraints

- **`src/web-ui/utils/definition-artefact-splitter.js`:**
  - The story-file template (`storyContent` array, current lines ~187-198) hardcodes only `As a **{persona}**,` then `So that {benefitMetric}.` — no `I want` line exists in the template at all, and `benefitMetric` (the same value written into the separate `## Benefit Linkage` section) is reused for `So that`, producing verbatim duplication.
  - `sectionFor()` (current lines ~73-86) computes a field's captured value as everything from that field's own line to the start of the *next recognized field* in document order — with no awareness that unlabeled prose (the raw `Given/When/Then` AC block, or the `So that [goal], I need [need].` sentence the DEFINITION PROTOCOL — `skills.js` ~line 2161 — actually instructs the model to write) can sit in that same gap and get silently absorbed into whichever labeled field happens to precede it in that particular document's field ordering (field order is explicitly *not* fixed — `skills.js` ~line 2143: "Field order within a section does not matter").
  - Fix must: (a) extract the real `So that [goal], I need [need].` sentence and use its two parts for the `So that`/`I want` clauses respectively (never reusing `benefitMetric` for this), and (b) prevent *any* unlabeled special-prose region (the AC block, and this sentence) from being absorbed into an adjacent labeled field's captured section, regardless of which field ends up next to it.
- **`src/web-ui/utils/review-artefact-splitter.js`:**
  - The REVIEW PROTOCOL (Web UI) system prompt (`skills.js` ~line 2088-2130) instructs the model to group findings under `## Story: [slug]` with `### HIGH findings` / `### MEDIUM findings` / `### LOW findings` and a flat `**Verdict:** PASS | FAIL` line. The splitter's regexes assume this exact shape.
  - Real model output for the affected feature deviated from that instructed shape and instead followed `skills/review/SKILL.md`'s own native Category A-E structure (`### Category C: AC Quality`, findings as inline `**Finding 1-H1:**` prose, `### Verdict: **FAIL** (Category C)` per story) — a heading-prefixed, suffix-decorated verdict line the current regex (`^\*{0,2}Verdict\*{0,2}:...`) does not match.
  - `extractField(storyBlock, 'Verdict', 'PASS')` (current line ~63) silently defaults to `'PASS'` whenever the regex fails to match — the single most dangerous line in this bug: a review that could not be parsed becomes an *apparent pass*, not a visible failure.
  - Fix must: (a) make the `Verdict` extraction tolerant of an optional heading prefix (`### `) and trailing parenthetical/suffix content, correctly resolving to PASS or FAIL from either the instructed flat format or this real-world deviation; (b) **never** default an unparseable verdict to `'PASS'` — when verdict truly cannot be determined, skip writing that story's split file entirely (matching `definition-artefact-splitter.js`'s own existing graceful-degradation contract: return nothing rather than write something wrong) and log a warning; (c) when the instructed `### HIGH findings` structure isn't present but a verdict was still resolved, do not present an empty findings list as if it were exhaustive — state plainly that per-severity findings could not be reliably extracted from this artefact's format and point at the source artefact.
- **Out of scope for the splitter's own regex work:** strengthening the REVIEW PROTOCOL (Web UI) system-prompt instructions so the model is less likely to deviate from the requested format in the first place. That is a prompt-engineering change, not a parsing fix, and belongs to a separate story if pursued (noted in `decisions.md`).
- Both files' existing "gracefully degrade — return `[]`/`{epics:[],stories:[]}` rather than throw" contract for a *completely* unrecognized artefact shape is preserved unchanged; this story only changes behaviour for artefacts that are *partially* recognized today but produce wrong content.

## Dependencies

- **Upstream:** None.
- **Downstream:** None known. `new-feature-2b74a292`'s own 13 stories and review files were already manually corrected in a prior session and are not touched by this story.

## Acceptance Criteria

**AC1:** Given a definition artefact whose story block contains the instructed `So that [goal], I need [need].` sentence, When `splitDefinitionArtefact` runs, Then the generated story file's `## User Story` section contains three distinct lines — `As a **[persona]**,`, `I want **[need]**,`, `So that **[goal]**.` — with `[need]` and `[goal]` taken from that sentence, not from the Benefit Linkage field.

**AC2:** Given a definition artefact whose `Architecture constraints` field is immediately followed (in document order, before the next recognized field) by the unlabeled `Given/When/Then` AC block, When `splitDefinitionArtefact` runs, Then the generated story file's `## Architecture Constraints` section contains only the architecture-constraints text — no AC/Given-When-Then content — and the AC block still appears exactly once, under `## Acceptance Criteria`.

**AC3:** Given a definition artefact story block where the `So that [goal], I need [need].` sentence is missing entirely, When `splitDefinitionArtefact` runs, Then the generated `I want`/`So that` lines use an explicit placeholder (not the Benefit Linkage field's text) — no silent duplication in this fallback path either.

**AC4:** Given a review artefact story block whose verdict line is `### Verdict: **FAIL** (Category C)` (heading-prefixed, with a trailing parenthetical), When `splitReviewArtefact` runs, Then the generated review file's `**Outcome:**` is `FAIL`.

**AC5:** Given a review artefact story block whose verdict cannot be confidently determined as PASS or FAIL under any recognized pattern, When `splitReviewArtefact` runs, Then no split file is written for that story (the function does not fall back to `'PASS'`), and a warning is logged identifying the unparseable story slug.

**AC6:** Given a review artefact story block that resolves a verdict but does not contain the instructed `### HIGH findings` heading structure, When `splitReviewArtefact` runs, Then the generated file's findings sections state plainly that per-severity findings could not be reliably extracted from this artefact's format (not an empty list presented as exhaustive), while the `**Outcome:**` line remains accurate.

## Out of Scope

- Strengthening the REVIEW PROTOCOL (Web UI) system-prompt instructions to reduce model deviation from the requested format (separate story if pursued).
- Retroactively re-splitting or re-writing any already-affected feature's files (all confirmed instances already manually corrected).
- Any change to the flat, un-split artefact save path (`definition.md`, the raw review-turn save) — unaffected and out of scope.

## NFRs

- **Correctness:** primary purpose of this story.
- **Safety:** a parse failure must never present as a false success (AC5) — this is the most important NFR given the review splitter's role in gating `/test-plan`.
- **Performance:** negligible — same best-effort, in-process string parsing, no new I/O.

## Complexity Rating

**Rating:** 2 — two related but independent parsing-logic fixes, each well-understood and testable in isolation; no new architecture.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
