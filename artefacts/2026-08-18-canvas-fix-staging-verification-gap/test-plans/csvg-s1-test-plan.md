# Test Plan: Close icrh-s1's and icv-s1's unconfirmed real-staging E2E verification (csvg-s1)

**Story:** artefacts/2026-08-18-canvas-fix-staging-verification-gap/stories/csvg-s1-close-icrh-s1-and-icv-s1-staging-verification.md
**Track:** Short-track, verification-only — no source code change (backfilled 2026-09-11, retroactively, after `/trace`'s traceability-chain check flagged this file's absence as a hard failure; the story's own DoD already documented this as intentionally lightweight ceremony, but a real test-plan artefact is still required by this repo's own `test_plan_coverage` check regardless of scope, and was incorrectly omitted)

---

## Test Cases

Per the story's own ACs, this story's scope was investigating and closing two staging-verification gaps — no new automated test file was written, since there was no code to test; the real evidence is a live-verification session, recorded in the resulting DoD and `decisions.md` entries.

| Test | AC | Type | Description |
|------|----|------|-------------|
| `icrh-s1` AC6 precondition-gate identification + manual verification | AC1 | Live investigation + browser verification | Identified the CI precondition gate (credits top-up + turn-1 render) and the deeper `srmw-s1` real-API-cost root cause; performed manual verification with a recorded result instead |
| `icv-s1` AC6 real-result recording | AC2 | Live investigation + browser verification | Real result recorded (partial — AC1/AC2 sub-cases closed, AC3 sub-case explicitly left open, not force-closed) |
| No new defect found (AC3) | AC3 | N/A | The blocker found (`srmw-s1`'s real-API-cost gap) was already a known, separately-tracked story before this investigation, not newly discovered |

Full evidence: `artefacts/2026-08-18-canvas-fix-staging-verification-gap/dod/csvg-s1-dod.md`, `artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/dod/icrh-s1-dod.md` (DoD Observation #2), `artefacts/2026-07-23-ideate-canvas-turn2-render-fix/dod/icv-s1-dod.md` (DoD Observation #2). One real, operator-authorized `/ideate` turn against `wuce-staging.fly.dev` was the only cost-incurring action taken (see `csvg-s1-dod.md`'s own DoD Observation #2 for the full authorization record).

## Out of Scope (per story)

- Any change to the diagram-rendering behaviour itself (`icrh-s1`/`icv-s1`'s underlying fixes are already confirmed correct).
- Broader investigation into whether other stories have similar unconfirmed staging ACs.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
