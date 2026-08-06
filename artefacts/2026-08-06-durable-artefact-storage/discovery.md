# Discovery: Durable Artefact Storage for SaaS-Hosted Journeys

**Status:** Clarified — awaiting approval
**Created:** 2026-08-06
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot (Claude Code)

---

## Problem Statement

On `wuce-staging` (and any SaaS-hosted deployment following the same pattern), stage artefacts (discovery.md, benefit-metric.md, review.md, etc.) are written only to the container's local ephemeral filesystem at `/app/artefacts/<feature-slug>/`. No persistent volume is attached. Every redeploy — which happens automatically via CI on essentially every merged PR — replaces the container with a fresh one and wipes that filesystem clean. The journey/session metadata (which stages are complete, what artefact path each one points to) lives durably in Postgres and survives redeploys fine, but the actual markdown files it references do not. The result: any journey whose artefacts were written before the most recent deploy becomes silently orphaned — its "Resume conversation" links and stage-view pages render correctly (routing, auth, UI all work) but show "No artefact content found" because the file is simply gone. This was discovered when Hamish clicked "Resume conversation" on a pre-existing staging journey (`new-feature-808781bb`) and got an empty artefact panel instead of the expected review.md content. It costs the operator (and any real SaaS user) the ability to trust that a completed stage's work is actually retrievable later — undermining the core "durable, traceable artefact" promise the whole pipeline is built on.

Note: in-progress conversation state (turns exchanged before a stage completes) is a separate, already-solved problem — `skill-session-redis.js` persists compact session state and turns to Redis (Upstash) with a 7-day TTL, purpose-built for exactly this "Fly disk gets wiped" scenario, and it is actively configured on `wuce-staging` today. This discovery is narrowly about the final artefact produced when a stage *completes*, which is written only to local disk with no durable backing at all.

## Who It Affects

**Real SaaS end users / operators** using the hosted `wuce-staging`-pattern product to run their own delivery pipeline — they lose the ability to resume or review a completed stage's conversation/artefact any time after the app has redeployed since that stage completed. Given this app auto-redeploys on nearly every merged PR, in practice this can mean losing access within hours.

**Hamish King / platform maintainers** doing manual exploratory QA on staging — hit this directly, and it undermines confidence in staging as a place to validate real user-facing behavior, since orphaned journeys look like they're broken even when the code is working correctly.

**The `dsh-s4` E2E spec itself** (`tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js`) — it asserts this exact "resume conversation survives restart" guarantee, but only simulates session loss via an in-memory eviction endpoint within a single deploy's lifetime. It never tests across a real redeploy, so it currently has a blind spot for the actual failure mode found here.

## Why Now

Discovered live today (2026-08-06) during manual staging testing, directly following two real merges (`mtrr-s1`, `mtrr-s2`) that each triggered a `wuce-staging` redeploy — the failure mode was demonstrated in real time, not hypothetically. This repo is in an active, high-frequency delivery cadence (multiple PRs merging per session, each auto-redeploying staging), so the exposure window isn't static — every deploy is a fresh chance to orphan more real journeys. It also connects directly to this session's broader theme: `mtrr-s1` just fixed the exact same "local disk isn't durable in a multi-tenant SaaS context" assumption for the `--from-saas` export endpoint (replacing an env-var-sourced single repo with a real per-tenant lookup); this discovery is the same underlying architectural gap showing up in a different read path (the journey/stage-view UI) that was never brought in scope for that fix.

## MVP Scope

**Dual-write, not a replacement.** Local disk keeps being written exactly as today — `journey.js` has 13 separate internal call sites that read artefact content synchronously mid-request (building next-stage handoff context, extracting story IDs from `definition.md`, etc.); none of these are touched, since those reads always happen within the same deploy's lifetime as the write and are never at risk. The fix is additive: (1) when a stage completes, *also* commit its artefact to the product's connected repo (reusing the owner/repo resolution `mtrr-s1` already built), alongside the existing local-disk write; (2) the one route that serves "Resume conversation" (`journey.js`'s `handleGetJourneyStageView`) gets a git-fallback — if the local file is missing (post-redeploy), fetch from git instead of showing "No artefact content found." Connecting a repo becomes a required step before a **new** product can start its first journey — surfaced via the picker UI `mtrr-s2` just shipped. Existing repo-less products are explicitly unaffected (see Clarification log) — they keep working exactly as today, with no retroactive migration or blocking. In-progress conversation turns are unaffected by this work — they are already durable via Redis/Postgres (`dsh-s1`–`dsh-s4`).

A Fly persistent volume was considered and explicitly rejected as the MVP direction: at ~$0.15/GB/month plus a $0.08/GB/month snapshot fee (added January 2026), cost is not prohibitive for a small staging volume, but it would make the platform's own shared storage the durable source of truth — the opposite of the direction this session's other work (`rb-s1`–`rb-s5`, `mtrr-s1`–`mtrr-s2`) has already committed to, which is the product's own connected repo being canonical.

## Out of Scope

- **Recovering already-orphaned journeys** (like `new-feature-808781bb`) — pre-launch staging data, not real customer artefacts, not worth the effort.
- **Attaching a persistent Fly volume** as an alternative or parallel durability layer — explicitly rejected in favor of git-as-source-of-truth, per the MVP decision above.
- **Multi-repo-per-product support** — stays out of scope, consistent with `mtrr-s1`/`mtrr-s2`.
- **Changing the in-progress conversation durability model** (Redis/Postgres via `dsh-s1`–`dsh-s4`) — already solved, not touched by this work.
- **Retrofitting this fix onto other SaaS-hosted deployment patterns** beyond the `wuce-staging` model, if any exist — deferred to a follow-on if this pattern is reused elsewhere.

## Assumptions and Risks

All 3 originally-flagged assumptions were resolved via `/clarify` — see Clarification log below. No open `[ASSUMPTION]` lines remain.

**Risk (a real design hazard, confirmed still open):** if the git commit at stage-completion fails (rate limit, revoked token, network), the stage must NOT be marked complete in Postgres until the commit actually succeeds — otherwise this recreates the exact bug being fixed (metadata says "done," content doesn't exist), just with git instead of local disk as the failure point. This needs the same write-then-verify sequencing already established for disk writes elsewhere in this codebase (ADR-023's "write-then-read precedes `completeStage()`" pattern). This discovery flags it as a hazard, not a fully worked design; `/definition` should turn it into an explicit AC.

**What could make this not worth building:** this condition no longer applies — the OAuth scope assumption was confirmed true (see Clarification log), so the originally-feared "need a materially different auth model" risk is resolved.

## Directional Success Indicators

**Cross-redeploy artefact durability.** Baseline: 0% (confirmed today — `new-feature-808781bb`'s `review.md`, and by extension every pre-existing journey's completed-stage artefacts, do not survive a redeploy). Target: 100% — any completed stage's artefact remains readable via "Resume conversation" after any number of subsequent redeploys. Measured via: a real E2E test that completes a stage, triggers an actual redeploy (not just the in-memory eviction `dsh-s4` currently simulates), and confirms the artefact still renders.

**Repo-connection-required coverage.** Baseline: 0% (a product can currently start a journey with no repo connected at all). Target: 100% of new products blocked from starting a first journey until a repo is connected. Measured via: a functional test asserting the journey-creation API rejects a repo-less product.

**Orphaned-journey rate going forward** (leading indicator). Baseline: `[UNKNOWN BASELINE]` — nothing currently instruments "journey metadata says a path exists but the file doesn't." Target: near-zero post-fix. Measured via: a lightweight staging health-check flagged here as a nice-to-have for `/benefit-metric` to formalize, not a hard MVP requirement.

## Constraints

- **Surface type**: this touches the `saas-gui` delivery surface (per constraint #6 in `product/constraints.md`) — DoD gates for this surface type apply.
- **Accessibility**: the new "connect a repo before starting" gate is a real UI addition — WCAG 2.1 AA is a hard floor (constraint #9), not optional.
- **Credential handling**: must reuse the existing `req.session.accessToken` pattern already established by `mtrr-s1`/`mtrr-s2` — no new credential storage or handling mechanism (per constraint #12, credentials are structural, never invented ad hoc).
- **Team capability**: solo maintainer, no dedicated infra/SRE support — the write-then-verify sequencing design should reuse the simple, already-established synchronous patterns in this codebase (ADR-023's disk-canonicity pattern), not introduce new distributed-transaction machinery.
- **Budget**: none — the git-based approach avoids the (small but real) ongoing cost of a Fly volume entirely.

## Contributors

- Hamish King — Platform maintainer / Product owner

## Reviewers

- [Name — Role]

## Approved By

[Name — Role — Date]

---

## Clarification log

[2026-08-06] Clarified via /clarify:
- Q: Does the existing OAuth token (used for `mtrr-s2`'s repo listing) carry write/push scope, or only read? A: Confirmed TRUE — `src/web-ui/auth/oauth-adapter.js:51` requests `scope=repo,read:user[,read:org]`. GitHub's `repo` scope covers both read and write (Contents API commits), not just listing. No new auth model needed; resolves the biggest scope risk.
- Q: Should the repo-required gate apply retroactively to existing repo-less products, or only new ones going forward? A: New products only (Option A). Existing repo-less products keep working exactly as today — no retroactive migration, no blocking of in-progress journeys. Only newly-created products are required to connect a repo before their first journey.
- Q: Can other code paths that read artefacts via local `fs.readFileSync` tolerate the write path moving to git-commit-first? A: Investigated directly — `journey.js` has 13 separate internal call sites reading artefact content synchronously mid-request (stage handoff context, story-ID extraction, etc.). Resolved by design: this is a **dual-write**, not a replacement — local disk keeps being written exactly as today (all 13 call sites untouched, safe since those reads always happen within the same deploy's lifetime as the write). Only the "Resume conversation" route (`handleGetJourneyStageView`) gets an added git-fallback for when the local file is missing post-redeploy. Narrows the actual engineering scope considerably — confirmed safe.

---

**Next step:** Human review and approval → /benefit-metric
