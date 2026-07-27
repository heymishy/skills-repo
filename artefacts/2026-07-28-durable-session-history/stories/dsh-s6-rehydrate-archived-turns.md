## Story: Transparently rehydrate an archived stage's turns on read

**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Discovery reference:** artefacts/2026-07-28-durable-session-history/discovery.md
**Benefit-metric reference:** artefacts/2026-07-28-durable-session-history/benefit-metric.md

## User Story

As a **pipeline operator opening a stage that completed more than 60 days ago**,
I want to **still see its full conversation, even though it's been moved to archive storage**,
So that **the archive/bounded-storage design (dsh-s5) never costs me visibility into old history — archiving is invisible plumbing, not a data-loss trade-off**.

## Benefit Linkage

**Metric moved:** Turn storage stays bounded
**How:** This story is the second half of the storage-bounding metric's target ("rehydration succeeds when an operator opens an archived stage") — dsh-s5 alone would bound storage but silently break dsh-s3/dsh-s4 for any stage older than 60 days; this story closes that gap so the bound is achieved without any loss of operator-visible functionality.

## Architecture Constraints

- **ADR-025** (multi-tenancy): the same tenant-ownership guard applies to archive-table reads as hot-table reads — archiving must never create a weaker-guarded read path.
- **ADR-027** (live SaaS mechanisms are ordinary application code): extends dsh-s2's function, itself ordinary `src/web-ui/` code — not a governed SKILL.md skill.
- **Reuse, don't duplicate:** extends dsh-s2's existing shared read function with a second fallback tier (archive table), rather than introducing a parallel "archived stage view" function or route — dsh-s3 and dsh-s4 require zero changes to benefit from this story.
- **CLAUDE.md D37:** reuses the same injectable adapter already wired in dsh-s1/dsh-s2 — no new adapter.

## Dependencies

- **Upstream:** dsh-s2 (extends its function), dsh-s5 (the `session_turns_archive` table this story reads from)
- **Downstream:** None — dsh-s3/dsh-s4 automatically benefit without modification, since they already call dsh-s2's function

## Acceptance Criteria

**AC1:** Given a stage's turns have been moved to `session_turns_archive` by dsh-s5, When dsh-s2's read function is called for that stage, Then it falls back to querying the archive table and returns those turns in the same shape as a hot-table read — the caller (dsh-s3 or dsh-s4) requires no special-case handling.

**AC2 (edge case):** Given a stage's turns exist in the hot table (not yet archived), When the read function is called, Then the hot-table copy is returned and the archive table is never queried — no unnecessary extra query on the common case.

**AC3:** Given a stage's turns exist in neither the hot nor archive table, When the read function is called, Then it returns `null`, unchanged from dsh-s2's existing AC3 behaviour.

**AC4:** Given an archived stage is opened via dsh-s3's breadcrumb page, When the page renders, Then the operator sees the identical chat+artefact split view as a non-archived stage — no visible indication that a fallback path was used, confirming archiving is fully transparent.

**AC5 (edge case, tenant isolation):** Given a request for an archived stage belonging to a different tenant, When the read function is called, Then it returns `null` (mapped to 404 by the caller) — the same tenant guard applies to archive reads as hot reads, not a weaker check.

## Out of Scope

- Moving archived data back into the hot table permanently ("promotion") — this story only reads from archive transparently; it does not re-promote rows, avoiding the hot table re-growing from repeated views of old stages.
- Any UI indicator showing "this stage was archived" — deliberately invisible per AC4; not a feature of this MVP.

## NFRs

- **Performance:** An archive-tier read is allowed to be slower than a hot-tier read (it's the less-common path), but must still complete within a reasonable page-load budget (~500ms) rather than degrading to a noticeably slow page.
- **Security:** No new security surface — identical tenant-scoping guard as dsh-s2's hot-table read.
- **Accessibility:** None new — the rendered page is identical to dsh-s3's existing output.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
