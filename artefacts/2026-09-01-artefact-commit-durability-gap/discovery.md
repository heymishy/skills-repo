# Discovery: Completed stages can silently lack durable git backing even when the product is correctly repo-connected

## Problem / Opportunity

`das-s1` (shipped 2026-08-07, PR #674) added a dual-write: when a journey stage completes, its artefact is committed to the product's connected GitHub repo in addition to the existing local-disk write, specifically so "Resume conversation" survives a redeploy. Its own AC2 requires that a commit failure block `completeStage()` and surface a clear operator-facing error — never a silently "completed" stage with no durable backing.

Investigating a real production feature (`new-feature-af17f555`, "Parity across Claude code started outer loop and skills-framework Web ui"), the operator's premise was that its 8 completed-stage artefacts (DoR, Review, Test Plan, and prior stages) had committed to `heymishy/skills-repo` as expected, since the feature is genuinely listed under the `skills-framework` product on `/products/:id`, and that product's GitHub repository is confirmed set to `heymishy/skills-repo`.

Directly checked: `gh api repos/heymishy/skills-repo/contents/artefacts/new-feature-af17f555` returns **404**. `gh pr list --search af17f555` and a branch-name search both return nothing. `git log --all` across every local ref (after `git fetch --all`) shows zero commits touching `artefacts/new-feature-af17f555/*`, ever. The artefacts are real and readable via the Postgres-backed journey (`test-plan · 8 artefacts` on the product page, individual DoR/Review/Test-Plan artefact content viewable and resumable via the UI) — but none of it exists in git.

This means: for at least this one real, currently-repo-connected feature, `das-s1`'s durability guarantee did not hold, and — per AC2's own contract — either (a) no error was ever surfaced despite that requirement, or (b) the commit was silently skipped as a designed no-op (AC4: "no connected repo... no error surfaced") under conditions that no longer hold true today.

## Investigation performed this session

- Confirmed via GitHub API (not local git) that `artefacts/new-feature-af17f555/` does not exist on `heymishy/skills-repo` at any commit, branch, or PR.
- Confirmed via `git log --follow` that `das-s1`'s commit mechanism (`artefact-commit-writer.js`, wired into `journey.js`'s stage-completion path) was live and deployed well before this feature's stages completed (das-s1 merged 2026-08-07; this feature's DoR/Review/Test-Plan stages completed 2026-08-31, per this session's earlier investigation of the same feature).
- Confirmed via the product page's own features list that `journeys.product_id` for this feature currently resolves to `skills-framework`, and that product's `repo_owner`/`repo_name` are set to `heymishy/skills-repo` — the exact fields `ownerRepoForFeature` (`export-data-source.js`) needs to succeed.
- Read `journey.js`'s actual call site: `ownerRepoForFeature` is wrapped in try/catch, and ANY failure (including a `journeys.product_id` that was null/different at the moment the query ran) is caught and silently treated identically to "no connected repo, proceed unchanged" (AC4's designed behavior) — there is no log line, no distinguishing signal, between "this product genuinely has no repo" and "the resolution failed/was different at this specific moment."
- **Not confirmed** (requires access this session did not have): the actual historical value of `journeys.product_id` and its `created_at`/updated timeline for this specific feature at the moment each of its 8 stages completed. No direct Postgres access was available (the `skills-repo-db` Fly app has zero running machines and is described elsewhere as unmanaged; the real DB is very likely Neon per `decisions.md` D3/D4, and no connection string was retrieved or used, deliberately, since that would mean handling production DB credentials directly). `flyctl logs` for `skills-framework` was checked but only returns a short recent window (machine-boot logs from a few hours ago) — nowhere near far enough back to cover 2026-08-31's actual stage-completion timestamps.

## Leading hypothesis (not yet proven)

The feature was most likely created (or briefly sat) without a product association — or under a different, repo-less product — at the time its stages actually completed, and was reassigned to `skills-framework` afterward (whether via an explicit "move to product" action or some other mechanism). `das-s1`'s commit-on-completion only ever uses the product association that exists **at the instant a stage completes** — it has no retroactive/backfill mechanism (explicitly out of scope in its own story, which only excludes *re-committing edited* artefacts, not this case). Under that hypothesis, every one of those 8 stage-completions correctly and silently took the AC4 "no connected repo" branch, exactly as designed, and the *current* correct-looking product link is a red herring for anything that already happened.

The competing, more concerning hypothesis is that the commit was actually *attempted* and *failed* (revoked token scope, rate limit, API error) — which per AC2 should have blocked `completeStage()` and shown the operator an error. If that's what happened, either AC2's guard has a live bug, or the operator saw and dismissed 8 separate error messages without recalling it (unlikely enough to treat as a lower-probability branch, but not ruled out).

## The gap that matters regardless of which hypothesis is true

Whichever explanation applies to this specific feature, the actual structural gap is the same: **there is currently no way to look at a completed stage and know, after the fact, whether it has durable git backing or not.** Both branches (genuine no-repo skip, and resolution failure) produce an identical, silent outcome today. An operator (or this agent) can only discover the gap by manually cross-checking GitHub — exactly what this session had to do by hand.

## Audience / Users

- Any operator running a real, repo-connected product's pipeline through the web UI, relying on "Resume conversation" and cross-redeploy durability as `das-s1` promises.
- Future incident investigation (this session's own experience is the first concrete case).

## Consequences of inaction

- Silent durability loss risk: work that looks safely committed can in fact only exist in Postgres + ephemeral container disk, discoverable only by manual, after-the-fact GitHub cross-checking.
- Erodes trust in `das-s1`'s own stated guarantee (AC2's "never a silently completed stage with no durable backing" is not actually verifiable today by anyone other than someone willing to do this session's manual investigation).

## Existing alternatives

None — this is the only stage-completion durability mechanism in the codebase (`das-s1` itself, superseding nothing).

## Desired outcome

At minimum: a durable, checkable signal (log line at minimum; a UI indicator would close the loop for operators) recorded at stage-completion time stating explicitly whether a git commit was attempted, succeeded, or was skipped as repo-less — so this class of gap is detectable without a manual cross-repo audit. Separately, and pending the operator's own confirmation of the historical root cause (which needs DB access this session did not have): decide whether a retroactive backfill/reconciliation mechanism (commit any already-completed stage's artefact to git once/if a product later gains a repo connection) is worth building.

## Immediate, separate action item (not blocked by this discovery)

The 8 artefacts for `new-feature-af17f555` should be manually committed to `heymishy/skills-repo` now to close the immediate durability gap for this one feature, independent of resolving the root cause. The operator deferred this in favor of investigating first — flagged here so it isn't lost.
