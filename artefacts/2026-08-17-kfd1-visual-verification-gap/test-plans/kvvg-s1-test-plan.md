# Test Plan: Execute kfd1's unexecuted manual visual-verification scenarios, or log an explicit RISK-ACCEPT (kvvg-s1)

**Story:** artefacts/2026-08-17-kfd1-visual-verification-gap/stories/kvvg-s1-execute-or-risk-accept-kfd1-visual-checks.md
**Track:** Short-track, verification-only — no source code change (backfilled 2026-09-11, retroactively, after `/trace`'s traceability-chain check flagged this file's absence as a hard failure; the story's own DoD already documented this as intentionally lightweight ceremony, but a real test-plan artefact is still required by this repo's own `test_plan_coverage` check regardless of scope, and was incorrectly omitted)

---

## Test Cases

Per the story's own AC1, this story's entire scope was executing 3 already-written manual verification scenarios (5, 6, 7 from `artefacts/2026-06-17-kanban-feature-detail-cx/verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md`) and recording the real result — no new automated test file was written, since there was no code to test.

| Test | AC | Type | Description |
|------|----|------|-------------|
| Scenario 5 (feature detail page design system) | AC1 | Manual, `getComputedStyle`-verified | Executed live against `wuce-staging.fly.dev` — real sidebar/topbar/`.sw-card`/`.sw-section-title` confirmed with resolved styles |
| Scenario 6 (artefact page design system + markdown rendering) | AC1 | Manual, `getComputedStyle`-verified | Executed live — real serif body font, heading, table, and (via a synthetic injected element) monospace code-block styling all confirmed with resolved styles |
| Scenario 7 (404 path still uses shell) | AC1 | Manual, live HTTP + DOM check | Executed live — real 404 status, shell-wrapped "Artefact Not Found" page confirmed |
| No real defect found (AC2) | AC2 | N/A | All three scenarios passed; nothing to document separately |
| Decision record (AC3) | AC3 | Artefact check | `artefacts/2026-06-17-kanban-feature-detail-cx/decisions.md` created with a RISK-ACCEPT-RESOLVED entry |

Full evidence and results: `artefacts/2026-08-17-kfd1-visual-verification-gap/dod/kvvg-s1-dod.md` and `artefacts/2026-06-17-kanban-feature-detail-cx/dod/kfd1-dod.md` (DoD Observation #2).

## Out of Scope (per story)

- Redesigning or expanding the kanban/detail page UI itself.
- Any other feature's similar unexecuted-verification gaps.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
