# Discovery: Completed Stages Can Silently Lack Durable Git Backing

**Status:** Approved
**Created:** 2026-09-01
**Approved by:** Hamish King — Platform Owner — 2026-09-02
**Author:** Claude (agent, with Hamish King)

---

## Problem Statement

`das-s1` (shipped 2026-08-07, PR #674) added a dual-write: when a journey stage completes, its artefact is committed to the product's connected GitHub repository in addition to the existing local-disk write, specifically so "Resume conversation" survives a redeploy. Its own AC2 requires that a commit failure block `completeStage()` and surface a clear operator-facing error — never a silently "completed" stage with no durable backing.

Investigating a real production feature (`new-feature-af17f555`) this session, the operator's premise was that its 8 completed-stage artefacts (Discovery, Benefit-Metric, Design, Definition, Review, Test Plan, DoR, and more) had committed to `heymishy/skills-repo` as expected, since the feature is genuinely listed under the `skills-framework` product and that product's GitHub repository is correctly set to `heymishy/skills-repo`. Direct checks (`gh api repos/heymishy/skills-repo/contents/artefacts/new-feature-af17f555` → 404; `gh pr list --search af17f555` → nothing; `git log --all` across every fetched ref → zero commits touching `artefacts/new-feature-af17f555/*`, ever) confirmed the artefacts never landed in git, despite being real, readable, and resumable via the Postgres-backed journey.

The root code-level cause is narrower than "the commit failed": `journey.js`'s stage-completion call site wraps `ownerRepoForFeature` resolution in a try/catch, and **any** failure — a genuinely repo-less product, a resolution error, a `journeys.product_id` that was different at that exact moment — is caught and silently treated identically to `das-s1`'s own designed "no connected repo, proceed unchanged" branch (AC4). There is no log line, no distinguishing signal, between "this product genuinely has no repo, so skipping is correct" and "resolution failed for a reason that should have surfaced an error." Per `das-s1`'s own AC2 contract, one of those two outcomes should never be silent — but today, from the outside, they are indistinguishable.

## Who It Affects

- **Developer / engineer** (per `product/mission.md`'s primary persona) running a real, repo-connected product's pipeline through the web UI, relying on `das-s1`'s own stated guarantee ("Resume conversation" survives a redeploy) without independently auditing GitHub after every stage completion.
- **Tech lead / squad lead**, who signs off on Definition of Ready and is accountable for the artefact chain being real and durable — currently has no way to confirm that without a manual cross-repo check.
- **Future incident investigation** (this session is the first concrete case): whoever investigates a "missing artefact" report next has no structural signal to consult, only the same manual GitHub cross-check performed this session.

## Why Now

This is a live, first-hand incident, not a hypothetical: it was found *during* dogfooding the very feature (`new-feature-af17f555`, Cross-Channel Feature Continuity) whose whole purpose was giving operators confidence that CLI and Web UI work stay in sync. A durability gap in the mechanism meant to back that confidence, discovered while building the feature that depends on it, is a direct trigger — not an abstract governance concern. `product/constraints.md` constraint #13 ("structural governance preferred over instructional... the test for any proposed governance requirement: can the CI gate verify this independently of what the agent says?") also applies directly here: today, nothing but a manual audit can verify durability held.

## MVP Scope

**Expanded via /clarify (2026-09-02):** with the "genuinely no-repo" hypothesis ruled out for a confirmed, continuously-linked feature, this is now scope-confirmed as a real bug fix, not just an observability gap. Two coherent parts, one fix:

1. **Root-cause and fix `das-s1`'s AC2 guard.** Determine which failure mode actually occurred — `ownerRepoForFeature` failing to resolve despite a valid product link, or `commitArtefact` itself failing silently after a successful resolution — by reading both functions' current implementations (not yet done this session), then fix whichever path let a failure through without blocking `completeStage()` or surfacing an operator-facing error, restoring AC2's original contract.
2. **Add a durable, checkable signal** at stage-completion time, stating explicitly whether a git commit was **attempted and succeeded**, **attempted and failed**, or **skipped because the product has no connected repo** — logged with enough context (`featureSlug`, `stageName`, `outcome`, `reason` when skipped/failed) to distinguish all three cases without a manual GitHub cross-check, so this class of gap is immediately detectable if it ever recurs despite the fix.

This does not, by itself, fix any already-missing artefacts or add a backfill mechanism (see Out of Scope).

## Out of Scope

- **Retroactive backfill/reconciliation** (committing already-completed stages' artefacts to git for features that already have this gap) — this discovery fixes the guard going forward; repairing already-affected features (including `new-feature-af17f555`'s own 8 artefacts) is a separate, bounded data-repair task, not a general backfill mechanism this discovery needs to build.
- **An operator-facing UI indicator** for durability status — the MVP scope is a checkable server-side signal (log line, and a corresponding field the CI/assurance layer can assert against); a dashboard or in-UI badge is a natural follow-on but not required to close the detectability gap.
- **Auditing or fixing every other stage-completion or artefact-write path** in the codebase for equivalent silent-failure patterns — this discovery is scoped to `das-s1`'s specific commit-on-completion mechanism, not a platform-wide error-handling audit.
- **The immediate, one-off fix of manually committing `new-feature-af17f555`'s 8 already-completed artefacts to git** — this is a real, separate action item (see the original investigation notes) but is a one-time data-repair task, not part of this discovery's own scope or MVP.

## Assumptions and Risks

**Resolved via /clarify (2026-09-02):** the operator confirmed `new-feature-af17f555` was linked to the `skills-framework` product for the entire period its 8 stages completed — it was never repo-less or linked to a different product. This **rules out** the "genuinely no-repo, correctly skipped" hypothesis and elevates the competing hypothesis to the leading explanation.

[ASSUMPTION] Given confirmed continuous product-linkage, the leading explanation is now that `ownerRepoForFeature` either (a) failed to resolve despite a valid link (e.g. a stale read, a timing/caching issue, or a genuine resolution bug), which `journey.js`'s current catch block treats identically to "no connected repo" (AC4's branch) rather than surfacing an error, or (b) resolved correctly but the subsequent `commitArtefact` call itself failed silently in a way that did not trigger AC2's block-and-error path. Either sub-case means `das-s1`'s own AC2 guard has a live bug — a failure occurred and did not block `completeStage()` or surface an operator-facing error, contrary to its own contract — unconfirmed which of (a) or (b), requires reading `ownerRepoForFeature`'s and `commitArtefact`'s actual implementations (not yet done this session) to narrow further.

**Risk if not addressed:** Silent durability loss continues undetected — work that looks safely committed can in fact only exist in Postgres plus ephemeral container disk, discoverable only by manual, after-the-fact GitHub cross-checking, exactly as this session had to do by hand. Given the "genuinely no-repo" explanation is now ruled out for at least this one confirmed case, this is stronger evidence than originally scoped that `das-s1`'s AC2 safety guard itself is not functioning as specified — this directly erodes `das-s1`'s own stated guarantee and, by extension, operator trust in "Resume conversation" surviving a redeploy.

## Directional Success Indicators

**Stage-completion durability signal coverage:** Baseline: `[UNKNOWN BASELINE]` — 0 of the 3 possible outcomes (attempted+succeeded, attempted+failed, skipped as repo-less) are currently distinguishable in any log or checkable record; today's true rate of each outcome across all stage completions is unknown precisely because nothing records it. Target: 100% of `completeStage()` calls that pass through `das-s1`'s commit mechanism emit one of the three distinguishable outcomes. Measured via: a dedicated test asserting the signal is emitted on every code path through the commit-on-completion call site (success, resolution failure, and genuine no-repo skip), plus a live grep of production logs post-deploy confirming real occurrences of at least the "skipped" and "succeeded" cases (the "failed" case may not occur in the observation window, which is acceptable — the assertion is that the code path exists and is tested, not that a failure occurs during initial monitoring).

**Manual-audit elimination:** Baseline: the only way to know whether a specific completed stage has durable git backing today is the manual process this session performed (GitHub API content check, PR search, full-ref git log search). Target: the same question is answerable directly from the new signal (a log line, or a queryable field) without touching the GitHub API. Measured via: operator/agent can answer "does stage X of feature Y have durable git backing?" using only the new signal, verified against a known case (this session's own `new-feature-af17f555` finding, once its root cause is confirmed) as a manual cross-check.

## Constraints

- **Reuse, don't duplicate, the just-shipped cross-channel instrumentation.** `new-feature-af17f555`'s `ep1-s6` (merged PR #812, 2026-09-02) built exactly this shape of mechanism for a different set of events: `_logCrossChannelEvent(eventType, context)` in `src/web-ui/routes/journey.js` — fire-and-forget, `[cross-channel]`-prefixed structured JSON to stdout, plus a PostHog capture with the same base fields (`featureSlug`, `stage`, `eventType`, `timestamp`, `operatorId` when available) plus event-specific details. The distinguishing signal this discovery needs (attempted+succeeded / attempted+failed / skipped-as-repo-less) is the same shape of problem `ep1-s5`/`ep1-s6` already solved for artefact-load and journey-backfill errors — implementation should add new event types (e.g. `artefact_commit_succeeded`, `artefact_commit_failed`, `artefact_commit_skipped`) through that same shared helper rather than building a second, parallel logging mechanism. `das-s1`'s call site is in `journey.js` itself, so no cross-file require is even needed (unlike `ep1-s6`'s own `skills.js` → `journey.js` lazy-require pattern for the same helper).
- No new npm dependencies (matches this repo's established pattern for logging/observability additions — see `ep1-s6`, `ep1-s5` in the just-shipped `new-feature-af17f555` epic, which added structured cross-channel logging with zero new dependencies).
- Must preserve `das-s1`'s existing AC4 behaviour (genuinely repo-less products still skip the commit, no error) exactly as-is — only the AC2 path (a failure that should block and error) is being fixed, not AC4's designed skip.
- `product/constraints.md` #13 (structural governance preferred over instructional) applies: the signal should be something a CI gate or automated check can assert against, not merely an instruction asking an agent to remember to check.
- No direct production database access was available or used during this discovery's own investigation (deliberate — avoids handling production DB credentials outside an approved channel); any implementation depending on historical DB state (e.g. confirming which hypothesis is correct) needs the operator's own access or an approved read path.

## Contributors

- Hamish King — Platform Owner
- Claude (agent) — investigation, discovery drafting

## Reviewers

- Hamish King — Platform Owner

## Approved By

- Hamish King — Platform Owner — 2026-09-02

---

## Clarification log

[2026-09-02] Clarified via /clarify:
- Q: Do you have any information about `new-feature-af17f555`'s product-linkage history around when its 8 stages completed? A: It was linked to `skills-framework` the whole time — rules out the "genuinely no-repo" hypothesis, elevates the AC2-guard-bug hypothesis to the leading explanation.
- Q: Given this now points to a live bug in `das-s1`'s AC2 guard rather than just a missing observability signal, should finding and fixing that bug be in this discovery's own scope? A: Yes — find and fix the bug. MVP scope expanded accordingly (see MVP Scope).

**One assumption remains open** (which of the two specific failure sub-modes — `ownerRepoForFeature` resolution failure vs. `commitArtefact` failure — actually occurred) — this requires reading the actual implementation code, not further operator clarification, and is deferred to `/definition`/implementation-plan investigation rather than blocking approval here.

---

**Next step:** Human review and approval → /benefit-metric
