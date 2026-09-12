# Test Plan: Symmetric "As designed:" / "As-built:" diagram title prefixes (aldl-s1)

**Story:** artefacts/2026-09-12-as-designed-label-symmetry/stories/aldl-s1-symmetric-as-designed-as-built-labels.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| U1 | AC1 | Unit (static content) | `skills/design/SKILL.md`'s System Architecture marker field docs instruct a title prefixed `"As designed: "` |
| U2 | AC1, AC4 | Unit (static content) | `skills/design/SKILL.md`'s System Architecture worked example's own `title` field is `"As designed: System architecture"` |
| U3 | AC2 | Unit (static content) | `skills/design/SKILL.md`'s Data Model marker field docs instruct a title prefixed `"As designed: "` |
| U4 | AC3 | Unit (static content) | `skills/definition/SKILL.md`'s Program Design marker field docs instruct a title prefixed `"As designed: "` |
| U5 | AC3, AC4 | Unit (static content) | `skills/definition/SKILL.md`'s Program Design worked example's own `title` field is `"As designed: Program design"` |

## Regression coverage

- `tests/check-csd-s3-design-definition-diagram-instructions.js` (36/36) re-run unmodified — must still pass; if it asserts the exact pre-fix title strings, it will need updating as part of this story (see plan).
- `tests/check-csd-s4-data-model-diagram-instruction.js` re-run unmodified — same consideration.

## Out of Scope (per story)

- Retroactive backfill of already-generated content-blocks.
- As-built title generation code (`migration-schema-parser.js`, `service-call-detector.js`, `call-graph-extractor.js`).
- The runtime renderer (`buildDiagramBodyHtml`).

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
