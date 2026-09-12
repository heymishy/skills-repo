## Story: Symmetric "As designed:" / "As-built:" diagram title prefixes

**Epic reference:** None — short-track cosmetic fix (closes `csd-s2`'s own follow-up recommendation, found during 2026-09-12 pipeline-state audit)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track

## User Story

As **an operator comparing an as-designed diagram (from `/design`) against its as-built counterpart (from `/verify-completion`, csd-s5)**,
I want both diagram titles to carry an equally explicit "As designed: " / "As-built: " prefix,
So that which diagram is which is unambiguous from the title alone, not just inferable from context.

## Benefit Linkage

**Metric moved:** Closes `csd-s2`'s own DoD-recorded AC3 deviation: "the 'As Designed' side has no explicit prefix, only the 'As Built' side does. Distinguishable, but not symmetric." The DoD itself explicitly recommended this exact fix: "have `/design`'s marker docs explicitly prefix 'As designed: '".
**How:** `src/modules/migration-schema-parser.js`, `src/modules/service-call-detector.js`, and `src/modules/call-graph-extractor.js` (csd-s5's as-built diagram generators) already default their titles to `"As-built: Data model"` / `"As-built: System architecture"` / `"As-built: Program design"`. `skills/design/SKILL.md`'s own marker instructions (csd-s3/csd-s4, the as-designed side) currently tell the model to emit a plain title like `"System Architecture"` / `"Data model"` with no equivalent prefix. Confirmed via direct code review (2026-09-12): the runtime renderer (`buildDiagramBodyHtml` in `src/web-ui/routes/skills.js`) displays `block.title` verbatim with no special-casing — this is purely a SKILL.md instruction-text change, no runtime code path is affected.

## Architecture Constraints

- Per this repo's own Platform Change Policy, `skills/design/SKILL.md` changes must be merged via PR, not committed directly to master.
- Do not touch the as-built title generation (`migration-schema-parser.js`/`service-call-detector.js`/`call-graph-extractor.js`) — already correct, out of scope.
- Do not touch the runtime renderer (`buildDiagramBodyHtml`) — it already displays whatever title string it's given verbatim; no code change is needed there.
- Match the as-built side's exact casing convention for the diagram-type noun phrase (sentence case: "System architecture", "Data model") — only the prefix wording itself ("As designed: " vs "As-built: ") differs between the two sides, by the DoD's own explicit recommendation.

## Dependencies

- **Upstream:** `csd-s2` (merged, DoD-complete, named this exact gap), `csd-s3`/`csd-s4` (merged, DoD-complete, own the instruction text being modified).
- **Downstream:** None. Future `/design` runs will emit the prefixed title going forward; this does not retroactively change already-generated content-blocks in existing artefacts (out of scope, see below).

## Acceptance Criteria

**AC1:** Given `skills/design/SKILL.md`'s System Architecture marker instructions (csd-s3), When a model follows them for a new feature, Then the emitted title is `"As designed: System architecture"` (or an equivalent feature-specific variant carrying the same prefix), not a bare `"System Architecture"`.

**AC2:** Given `skills/design/SKILL.md`'s Data Model marker instructions (csd-s4), When a model follows them for a new feature, Then the emitted title carries the same `"As designed: "` prefix (e.g. `"As designed: Data model"`).

**AC3:** Given `skills/definition/SKILL.md`'s Program Design marker instructions (csd-s3), When a model follows them for a new feature, Then the emitted title carries the same `"As designed: "` prefix (e.g. `"As designed: Program design"`). Confirmed during story preparation (2026-09-12) that `/definition`'s own instructions have the identical bare-title gap as `/design`'s — this is a real 3rd location, not a hypothetical.

**AC4:** Given the worked examples in all 3 marker sections (System Architecture, Data Model has none, Program Design), When a reader follows them literally, Then each example's own `title` field already shows the prefixed form — examples must not contradict the instruction text they illustrate.

## Out of Scope

- Retroactively updating already-generated CANVAS-JSON content-blocks in past sessions/artefacts to add the prefix — no backfill, forward-looking only.
- Any change to the as-built title convention itself (`migration-schema-parser.js`, `service-call-detector.js`, `call-graph-extractor.js`) — already correct.
- Any change to the runtime rendering code (`buildDiagramBodyHtml`) — already correctly title-agnostic.

## NFRs

- **Performance:** N/A — instruction-text-only change, no runtime code path affected.
- **Security:** N/A.
- **Accessibility:** N/A.
- **Audit:** N/A.

## Complexity Rating

**Rating:** 1 — a small, well-scoped instruction-text edit to a SKILL.md file already fully understood, with the exact fix already specified by the originating DoD.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
