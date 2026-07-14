## Story: Rebuild the standards DB cache from git content

**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-3-standards-git-tracked.md
**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md

## User Story

As a **web UI operator running the outer loop**,
I want to **have the standards list/view in the web UI stay fast without hitting GitHub on every page load**,
So that **browsing standards feels the same as it does today, even though the source of truth moved to git**.

## Benefit Linkage

**Metric moved:** Metric 1 — Time from idea to DoR-ready, git-committed artefact
**How:** Without a cache, every standards page load would require live GitHub API calls, which would make the web UI noticeably slower and defeat the point of a smooth outer-loop experience — this story is what keeps the git-backed model practical, not just correct.

## Architecture Constraints

ADR-012: implement the cache-rebuild as an adapter-shaped module (injectable, testable independent of live GitHub calls), matching this codebase's existing pattern.

## Dependencies

- **Upstream:** prc-s3.1 (needs real git-backed standards to rebuild a cache from)
- **Downstream:** prc-s3.3 (routes read from this cache)

## Acceptance Criteria

**AC1:** Given a standard is written to git via prc-s3.1, When the write completes, Then the `standards` table row for that standard is updated to match the git content in the same request — cache stays in sync, not eventually-consistent via a separate job.

**AC2:** Given the `standards` table is deleted or corrupted, When a rebuild is triggered, Then it can be fully reconstructed by reading every product's repo's `standards/` directory — proving the DB truly is a cache, not an independent source.

**AC3:** Given a standard file is edited directly in git (e.g. by an engineer via IDE, bypassing the web UI), When the platform next reads that product's standards, Then the DB cache reflects the git content, not stale DB data — read-time reconciliation, not just write-time sync.

## Out of Scope

- Real-time push notification when git changes outside the web UI — AC3's reconciliation can be read-time/lazy, not a webhook-driven live sync (that's a real-time-collaboration-adjacent feature explicitly out of scope per discovery).

## NFRs

- **Performance:** Standards list/view must not regress from today's DB-only read latency — cache-read path stays fast; only writes and explicit rebuilds touch git.
- **Security:** None new.
- **Accessibility:** Not applicable.
- **Audit:** None new beyond git's own history.

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
