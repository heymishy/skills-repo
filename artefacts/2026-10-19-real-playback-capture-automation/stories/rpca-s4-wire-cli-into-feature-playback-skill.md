## Story: Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Domain:** [none identified — documentation/SKILL.md change, not application code]

## User Story

As a **platform maintainer**,
I want **`skills/feature-playback/SKILL.md`'s own Step 2-3 to describe what the capture CLI actually does, and the repeated RISK-ACCEPT entries in `decisions.md` to be closed rather than left dangling**,
So that **the next person reading this skill, or this feature's own `decisions.md`, gets an accurate picture instead of the same aspirational description that caused this whole gap to go unnoticed across 5 prior stories**.

## Benefit Linkage

**Metric moved:** M1 — Real capture coverage on new DoD-complete features
**How:** This story doesn't move M1 by itself — it closes the documentation/audit-trail gap that let the underlying problem go unnoticed for 5 stories in a row. An accurate SKILL.md is what lets the next operator correctly invoke the real mechanism `rpca-s1`-`rpca-s3` built, rather than assuming (as every prior story did) that the aspirational description was already true.

## Architecture Constraints

- **Platform change policy (CLAUDE.md)** — `skills/feature-playback/SKILL.md` is a governed SKILL.md file; this change must merge via PR, not a direct push to master, same as every other SKILL.md change.
- **`decisions.md` is the canonical audit trail** — closing the 5 repeated RISK-ACCEPT entries means adding a `[RESOLVED]` or superseding entry, not deleting or rewriting the original entries (CLAUDE.md's own disk-canonicity/audit-trail principle).

## Dependencies

- **Upstream:** `rpca-s1`, `rpca-s2`, `rpca-s3` — this story describes their own real, shipped behaviour; it cannot be written accurately before they exist.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `rpca-s1` through `rpca-s3` are complete and merged, When `skills/feature-playback/SKILL.md`'s own Step 2 and Step 3 are read, Then they accurately describe the real CLI's own actual invocation (`node scripts/playback-capture.js [feature-slug]`), its real authentication mechanism, and its real screenshot/video output — not the aspirational description that predated this epic.

**AC2:** Given the skill's own "What this skill does NOT do" section, When reviewed, Then it is updated to accurately state that production capture and bulk retrofitting remain manual/out of scope — not implying the whole mechanism is still unautomated.

**AC3:** Given the 5 RISK-ACCEPT entries in `feature-playback-demo`'s own `decisions.md` that each stated the capture script was "only ever unit-tested against mocked Playwright" (`fpd-s1` AC3, `fpd-s2` AC1, `fpd-s3`, `fpd-s4` AC4, `fpd-s5` AC4), When this story ships, Then a single new `decisions.md` entry explicitly marks all 5 as superseded by the real mechanism this epic built, with a direct reference to `rpca-s1`-`rpca-s3`'s own real test evidence — not left as if the gap were still open.

## Out of Scope

- **Rewriting or re-authoring the original 5 RISK-ACCEPT entries themselves** — they stay as the accurate historical record of what was true at the time; only a new superseding entry is added, per CLAUDE.md's own audit-trail principle.
- **Updating every other SKILL.md file that might reference the capture mechanism** — scoped to `skills/feature-playback/SKILL.md` specifically, the one this epic's own problem statement names.
- **A retroactive capture pass against any existing feature** — epic-level Out of Scope, not revisited here.

## NFRs

- **Performance:** Not applicable — documentation change.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** Directly addressed by AC3 — this story's whole purpose is strengthening the audit trail, not just producing code.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
