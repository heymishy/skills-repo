# Discovery: Web UI Pipeline-State Durability

**Status:** Approved
**Created:** 2026-09-15
**Approved by:** Hamish King — Operator — 2026-09-15
**Author:** Claude Sonnet 5 (agent)

---

## Problem Statement

Every feature created or progressed through the production web UI (`skills-framework.fly.dev`) is invisible to `.github/pipeline-state.json` — the file `/workflow`, `bin/skills advance`, `bin/skills gate-advance`, and every CLI-driven governance check read from. Root cause, confirmed by direct investigation on 2026-09-15: `src/web-ui/adapters/pipeline-state-writer.js`'s own safety check (`isRealCheckout = fs.existsSync(path.join(repoRoot, '.git'))`) is correct in intent — it refuses to write against a checkout that isn't genuinely git-backed, since such a write would never be durable — but `.dockerignore` deliberately excludes `.git/` from the production image, so `isRealCheckout` is `false` on every production request, on every call, unconditionally. `src/web-ui/routes/journey.js` catches the resulting thrown error and only logs it server-side (`pipeline_state_write_failed`) — never surfaced to the operator. This was directly reproduced live: a throwaway test feature was created and driven through discovery → benefit-metric → design → definition → review in production on 2026-09-14/15, and confirmed absent from `origin/master`'s `.github/pipeline-state.json` (286 features tracked, the new one not among them) despite completing every one of those stages successfully. A second, independently-created real feature (`new-feature-2b74a292`, a 13-story role-based-collaboration feature) showed the identical gap.

## Who It Affects

**Operator moving a feature between the web UI and Claude Code CLI on the same repo** — the exact capability this session set out to validate. Cannot resume a web-UI-created feature from Claude Code via the normal `/workflow` path; must instead manually browse `artefacts/` to discover it exists, then manually reconstruct a pipeline-state.json entry — exactly the recovery work this session performed twice this week, for two independent features.

**Any future automated tooling or dashboard reading `.github/pipeline-state.json` as the source of truth** (the pipeline visualiser, `/trace`, governance gate checks, guardrail-compliance reporting) — all silently blind to every web-UI-originated feature's real progress.

## Why Now

This session (2026-09-14/15) fixed two related web-UI-to-CLI parity bugs in the artefact-splitting layer (`asf-s1`, merged and live-verified in production) specifically to make web-UI-produced files match CLI-produced files. That fix is necessary but not sufficient: the files now match, but the *state tracking* that makes those files discoverable and actionable through this repo's own governed workflow remains completely disconnected for every production-created feature. Fixing the artefact shape without also fixing the state bridge leaves the "seamless move between web UI and Claude Code" goal half-done — files are right, but nothing points at them.

## MVP Scope

- A pipeline-state write path that works from the production web UI container (no local `.git` required) — durable, authenticated as the operator, and safe under multiple concurrent container instances/requests.
- The existing local-filesystem write path stays exactly as-is for CLI/local-dev use (where a real `.git` checkout genuinely exists) — this MVP adds a second implementation of the same `pipelineStateWriter(featureSlug, storyId, stateUpdate)` contract `journey.js` already calls, selected by environment at server startup, not a rewrite of the call sites.
- A write failure must be visibly surfaced (at minimum: a real, findable log/capture signal an operator would actually see) instead of silently logged and forgotten — closing the same class of "silent failure looks like success" gap this session already found and fixed once this week (`ltd-s1`, the LLM truncation story).

## Out of Scope

- Retroactively backfilling `.github/pipeline-state.json` entries for `new-feature-2b74a292` or the throwaway test feature created this session — both are edge cases already handled manually; this feature fixes the mechanism going forward, not historical data.
- Splitting `pipeline-state.json` into smaller per-feature files to reduce per-write payload size — a real, separate architectural question or this repo, out of scope here; this feature works within the existing single-file shape.
- A queue-and-background-drain architecture (considered and explicitly rejected during design discussion — trades a hard, visible failure for silent eventual-consistency staleness, and adds new infrastructure this MVP doesn't need).
- Re-provisioning the production container with a real local `.git` checkout (also considered and rejected — reintroduces exactly the multi-instance divergent-local-state problem the original `isRealCheckout` safety check exists to prevent).

## Assumptions and Risks

[ASSUMPTION] The GitHub Contents API's `sha`-based optimistic concurrency (reject a PUT whose base `sha` no longer matches HEAD) is sufficient to keep concurrent writes safe without a stronger lock — unconfirmed at scale, but this repo's own CLI-side `bin/skills advance` already accepts the equivalent risk for local git writes (a similar read-modify-write race exists there too, mitigated only by low real-world write concurrency), so this is judged an acceptable, consistent risk posture, not a new one.

[ASSUMPTION] Reusing the operator's own `req.session.accessToken` (the same credential `artefact-commit-writer.js` already uses for artefact commits) is both sufficient permission and the correct identity for pipeline-state commits — unconfirmed only in the sense that it hasn't been exercised for this specific file before; the permission scope is identical to the artefact-write path already in production use.

**Risk:** a large (1.5MB+) monolithic `pipeline-state.json`, rewritten in full on every single field-level update via a remote API call rather than a local filesystem write, adds real per-write latency (network round-trip) and contributes to git history growth over time. Judged acceptable for this MVP: the write is already off the user-visible response path (fire-and-forget, matching today's behaviour), and full-file rewrite-per-update is the existing, accepted pattern for the CLI's own local writes too — this feature does not make that characteristic worse, only extends it to a second write path.

## Directional Success Indicators

- A feature created and progressed through the production web UI appears in `.github/pipeline-state.json` on `origin/master` without any manual intervention.
- `/workflow`, run from Claude Code against a freshly-pulled `origin/master`, correctly reports a web-UI-originated feature's real stage.
- A simulated write failure (e.g. a stale `sha` after a genuine concurrent edit) produces a signal an operator would actually see — not just a server log line.

## Constraints

- Must not require any new secret or credential beyond what's already available per-request (`req.session.accessToken`).
- Must not change the `pipelineStateWriter(featureSlug, storyId, stateUpdate)` function signature `journey.js` already calls — this is a new implementation behind the existing D37 injectable-adapter seam, not a call-site rewrite.
- Must not touch `src/web-ui/utils/definition-artefact-splitter.js` or `review-artefact-splitter.js` (already fixed, live, and verified this session — `asf-s1`) — this feature is scoped to the separate pipeline-state write path only.

## Contributors

- Claude Sonnet 5 (agent) — Investigation, design, engineering
- Hamish King — Operator, direction, approval

## Reviewers

- Hamish King — Operator

## Approved By

Hamish King — Operator — 2026-09-15

---

**Next step:** Human review and approval → /benefit-metric
