## Story: Backfill already-completed stage artefacts to a repo at the moment it's connected

**Epic reference:** artefacts/2026-08-06-durable-artefact-storage (das-s1, das-s2)
**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-durable-artefact-storage/benefit-metric.md
**Domain:** [web-ui, data]

## User Story

As an **operator who connects a repo to a product after that product's journey has already completed one or more stages**,
I want to **have those already-completed stages' artefacts committed to the repo at the moment I connect it**,
So that **a later redeploy doesn't silently erase content that was written to local disk before a repo existed to back it up**.

## Benefit Linkage

**Metric moved:** Extends `das-s1`/`das-s2`'s existing durability guarantee to a real gap found live on staging (2026-08-07): a journey (`new-feature-5a4e59db`) completed 5 stages (discovery through definition) before its product's repo was connected; a subsequent redeploy wiped the local-disk copies of all 5, and `das-s1`'s dual-write never had a chance to run retroactively, leaving all 5 artefacts permanently unrecoverable (confirmed via GitHub API 404 on the connected repo).

**How:** This is distinct from the original discovery's "recovering already-orphaned journeys" out-of-scope item (which was about rescuing pre-launch staging data not worth the effort) — this story is forward-looking: it prevents the SAME class of loss from happening to any future product between "repo connected" and "next redeploy," which matters once real (non-staging) customers exist. Confirmed via direct root-cause investigation: `das-s1`'s dual-write only fires on new stage completions going forward; nothing currently runs at the moment a repo is connected to check for and commit already-completed, not-yet-backed-up stages sitting on local disk.

## Architecture Constraints

- **Reuse `das-s1`'s existing commit mechanism** (`artefact-commit-writer.js`'s `commitArtefact`) — this story is a new call site (triggered on repo-connection), not a new commit mechanism.
- **D37 (injectable adapter rule):** if a new adapter function is introduced for "find already-completed stages needing backfill," it follows the same stub-throws convention as every other adapter in this epic.
- **Time-boxed by design:** this only helps for content still present on local disk at the moment of repo connection — it explicitly does not attempt any form of data recovery for content already lost to a prior redeploy (that class of loss, for already-orphaned journeys, remains out of scope per the original discovery's own decision).

## Dependencies

- **Upstream:** `das-s1` (merged, PR #674), `das-s2` (merged, PR #678) — this story extends both.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product with a journey that has completed one or more stages with no repo connected, When an operator connects a repo to that product, Then every already-completed stage whose artefact still exists on local disk is committed to the newly-connected repo, using the same commit mechanism `das-s1` already uses for new stage completions.

**AC2:** Given the backfill runs at repo-connection time, When a stage's local-disk artefact no longer exists (already wiped by a prior redeploy), Then that specific stage is skipped without failing the others — the backfill is best-effort per-stage, not all-or-nothing.

**AC3:** Given the backfill completes (fully, partially, or finds nothing to backfill), When the operator views the product afterward, Then a clear indication exists of which stages were successfully backfilled and which (if any) could not be recovered — no silent partial success.

**AC4:** Given a product connects a repo with zero completed stages yet (the common case — most products connect a repo before starting, per `das-s2`'s own gate), When the connection completes, Then no backfill work is attempted at all (nothing to backfill) — this story adds no overhead to the already-correct, already-tested common path.

## Out of Scope

- Recovering `new-feature-5a4e59db`'s (or any other already-orphaned journey's) specific lost content — that content is already gone; this story is preventative, not restorative.
- Any change to `das-s1`'s own forward-going dual-write trigger (on stage completion) — unchanged.
- A UI flow for manually re-uploading lost artefact content — out of scope; if AC3's indication shows unrecoverable stages, the operator's own options are outside this story.

## NFRs

- **Performance:** Backfill runs synchronously at repo-connection time (a rare, deliberate operator action, not a hot path) — a brief added delay is acceptable and should be reported honestly if measured.
- **Security:** Uses the same authenticated-user-token Contents API pattern as `das-s1` — no new credential handling.
- **Accessibility:** AC3's indication follows this repo's existing UI patterns for success/partial-success/failure states.
- **Audit:** Each backfill attempt (success or skip) is logged with the feature slug and stage name.

## Complexity Rating

**Rating:** 2 — reuses existing commit mechanism, but the "connect repo" flow and its own AC3 UI indication are new surface area.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
