## Story: Section-by-section artefact assembly using skill template structure

**Epic reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/epics/dsq-epic-1.md
**Discovery reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/benefit-metric.md

## User Story

As a **web UI operator who has completed a skill session and is reviewing the commit preview**,
I want the **artefact to be structured using the skill's section headings rather than a flat Q&A dump**,
So that **the committed artefact matches the template format expected by the pipeline, making it immediately usable in the next skill step**.

## Benefit Linkage

**Metric moved:** P2 — Web UI share of outer loop artefacts (> 25% within 8 weeks)
**How:** Artefacts committed via the web UI that are structurally identical to VS Code artefacts (section headings, no "Q1: / A:" noise) are more likely to be accepted as valid pipeline artefacts by the next skill in the chain. This removes the current friction of web UI output requiring manual reformatting before it can be used, which in turn increases operator willingness to use the web UI as their primary surface.

**Secondary metric:** M3 — Context surfacing rate — when the artefact is structured by section, the model in subsequent skill calls has clearer template-grounded context to reference.

## Architecture Constraints

- **Section heading derivation:** Sections come from H2 headings (`## heading`) in SKILL.md, extracted the same way as question groupings. The output artefact uses those H2 headings directly as its section headers.
- **`htmlGetPreview` is the target function** — the change is isolated to how `htmlGetPreview` in `src/web-ui/routes/skills.js` assembles `content` from session data. No change to route handlers, session store shape, or commit flow.
- **`session.sectionDrafts`:** If dsq.2 is DoD-complete (section confirmation loop), `htmlGetPreview` uses confirmed drafts from `session.sectionDrafts[sectionIndex]` where present. If dsq.2 is not in the session (or no draft was confirmed), `htmlGetPreview` falls back to concatenating the Q&A pairs under each section heading.
- **No new npm dependencies** — Node built-ins only.
- **No Express** — raw `http.createServer` only.

## Dependencies

- **Upstream:** dsq.1 must be DoD-complete — `session.dynamicQuestions` is the source of question text used in the section assembly. dsq.2 is a soft dependency: if `session.sectionDrafts` is populated (dsq.2 complete), assembly uses drafts; otherwise it falls back to Q&A pairs. dsq.2 does not have to be complete for dsq.4 to ship.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a completed HTML skill session for a skill whose SKILL.md has H2 section structure, when `htmlGetPreview` is called, then the returned `artefactContent` contains one H2 heading per SKILL.md section, in the same order as the sections appear in the SKILL.md, with no "Q1:" / "A:" prefixes in the output.

**AC2:** Given `session.sectionDrafts[sectionIndex]` is populated for a section (dsq.2 was completed for that section), when `htmlGetPreview` assembles the artefact, then the content under that section heading is the confirmed draft text from `session.sectionDrafts[sectionIndex]`.

**AC3:** Given `session.sectionDrafts[sectionIndex]` is absent or null for a section (dsq.2 was not run, or API failed), when `htmlGetPreview` assembles the artefact, then the content under that section heading is the concatenation of all answers for questions in that section, separated by newlines — each answer on its own line without a Q/A label prefix.

**AC4:** Given a skill whose SKILL.md has no H2 section structure (all questions are top-level), when `htmlGetPreview` is called, then the artefact is assembled as a single section using the skill name as the heading, with answers concatenated — no regression from the pre-story behaviour for flat skills.

**AC5:** Given a completed session, when the commit-preview page renders the `artefactContent` returned by `htmlGetPreview`, then the rendered preview shows the section-structured content — what the operator sees in the preview matches what will be committed.

**AC6:** Given all tests passing before this story, when this story's implementation is merged, then all prior tests continue to pass with no regressions — in particular any test that asserts `artefactContent` shape from `htmlGetPreview` must be updated to expect the section-structured format.

## Out of Scope

- Matching every field and frontmatter detail of the SKILL.md template — the goal is section-level structural alignment, not byte-for-byte template conformance
- Model-generated section summaries (that is dsq.2's responsibility) — this story only handles assembly
- Reformatting artefacts produced by prior sessions — only new sessions benefit from this change

## NFRs

- **Correctness:** Section order in the assembled artefact must match SKILL.md section order — the assembly must not reorder sections.
- **Regression safety:** No change to artefact file path derivation or the commit call — only `content` inside `htmlGetPreview` changes.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
