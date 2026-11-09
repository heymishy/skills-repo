# DoR Contract: Bottom-up programme-candidate detection script (epic-count primary signal)

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Date:** 2026-11-09

## Contract Proposal — Bottom-up programme-candidate detection script

**What will be built:**
A new, standalone, read-only CLI script under `scripts/` that scans `.github/pipeline-state.json`, computes per-feature epic count (primary signal, flattening both flat `stories[]` and legacy epic-nested `epics[].stories[]` shapes per ADR-017) and a `decisions.md` "depend"/"dependency" mention count (secondary signal), flags features with epic count ≥4, and produces a plain-text/markdown manual-review report.

**What will NOT be built:**
No automated escalation into a `programme.md` artefact or workstream registration — manual-review report only, per the story's own Out of Scope. No web-UI rendering of the report. No calendar/timeline-span signal — explicitly and deliberately excluded (confirmed inverted in this repo's real data).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests for epic-count computation (flat + legacy shapes), dependency-mention counting, the negative "never computes timeline span" assertion, and the ≥4 boundary | unit |
| AC2 | Integration test against phase4's real/fixture-equivalent 5-epic profile — true positive | integration |
| AC3 | Integration test against team-identity-roles' real 1-epic profile — true negative | integration |
| AC4 | Unit + integration tests for the manual-review report's disclaimer text and zero-candidate handling | unit, integration |

**Assumptions:**
- The ≥4-epic threshold is shared with pep-s2's AC1 by design (per the epic's Architecture Constraints on coordinated sequencing) — this story validates it independently against both known historical cases; it does not import or depend on pep-s2's own code.
- `skills-platform-phase4` may or may not still have a live corresponding entry in today's `.github/pipeline-state.json` (it is archived). If not present live, the integration test constructs a fixture matching phase4's real epic/story counts rather than failing for lack of a live entry — the script's job is to read this shape of data, not specifically today's live file.

**Estimated touch points:**
Files: new file under `scripts/` (exact filename TBD by implementation — e.g. `scripts/detect-programme-candidates.js`). Services: none. APIs: none.

**schemaDepends:** Not applicable — this story's Dependencies block lists "Upstream: None." (Its own Downstream note says pep-s2 reuses its validated threshold, but that is a value-level coordination recorded in `decisions.md`, not a schema-field dependency flowing into pep-s3 itself.)
