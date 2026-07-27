# Discovery: Durable Session History for Completed Pipeline Stages

**Status:** Approved
**Created:** 2026-07-28
**Approved by:** Hamish King — Platform owner — 2026-07-28
**Author:** Copilot

---

## Problem Statement

Once a pipeline stage's skill session completes, the conversation that produced its artefact is deliberately deleted from Redis (`routes/skills.js`, "Session complete — delete from Redis to reclaim space") and only ever lived in-memory otherwise. The final artefact *text* is durably saved to Postgres/disk, but the turn-by-turn conversation is not saved anywhere durable. As a result: (1) the "Resume conversation" link on a feature's artefact-index page 404s with "Session not found" once the server process has restarted since that stage completed (a deploy, or Fly suspending an idle app and restarting it) — the conversation is unrecoverable, only the artefact text remains; (2) the breadcrumb "view a completed stage" page was built as a workaround for this — it shows the artefact with an inline edit toggle, not the chat+artefact split view a user expects, because there was never a reliable way to show the original conversation for an older stage.

## Who It Affects

Any operator using the web-ui SaaS surface to run the outer loop (discovery → definition-of-ready) across multiple sessions — which is the normal usage pattern, since stages are often revisited days or weeks apart. Two concrete moments this bites: (1) returning to a feature after time has passed to check what was discussed at an earlier stage (e.g. why a scope decision was made) — clicking "Resume conversation" 404s once the server has restarted since; (2) reviewing/continuing a specific stage via breadcrumb navigation — expecting to see the original chat (as a reference, and eventually to send a follow-up message that regenerates the artefact), but instead landing on a bare artefact-plus-edit-toggle page with no conversation visible at all. This affects every persona named in `product/mission.md` who touches the outer loop via the web-ui surface (developer, tech lead, PM/BA) — it is a property of the surface itself, not role-specific.

## Why Now

Discovered directly through dogfooding: while testing the platform's own web-ui surface on staging (immediately after fixing a related routing bug, jsvr-s1), the operator hit both symptoms live. This is part of an active hardening pass on the web-ui SaaS surface this session — several other structural gaps were just fixed (a journey-slug collision bug, a missing delete capability, e2e-test-tenant cleanup, a missing route registration) — and this is the next one surfaced by the same "actually use the thing" testing approach, rather than a theoretical concern. The surface is being treated as production-facing now, so a page that silently discards the record of how an artefact was produced is no longer an acceptable gap.

## MVP Scope

1. **Durably persist session turns** (not just the final artefact) to a new `session_turns` table in Postgres when a stage completes, instead of deleting them from Redis (clarified: new table, not an extension of the existing `artefacts` table — keeps `artefacts`' schema/contract untouched for every other feature that depends on it).
2. **Rebuild the breadcrumb "view a completed stage" page** to render a read-only replay of that stage's chat alongside the artefact (matching the live chat page's chat-left/artefact-right layout), sourced from the durable store.
3. **Fix "Resume conversation"** to pull from the same durable store when Redis/memory are empty, landing on that same split view instead of 404ing.
4. **Explicitly close the data-governance gap for this data** (clarified: confirmed in scope, not exempt) via the 60-day archive/rehydrate retention policy and the existing tenant-isolation/FORBIDDEN-vs-NOT_FOUND access-control convention — `/definition` must carry this forward as a real AC, not an afterthought.

This MVP is explicitly **read-only history + the existing artefact edit-toggle** — live chat interactivity to regenerate the artefact is a deliberate fast-follow (see Out of Scope), not part of this slice.

## Out of Scope

- **Live chat interactivity to regenerate a completed stage's artefact** — deliberately deferred to a fast-follow story. This MVP is read-only history + the existing artefact edit-toggle only.
- **Retroactive recovery of already-lost conversation history** — any stage that completed *before* this fix ships had its turns already deleted from Redis with nothing durable behind them; those are permanently gone. This discovery only prevents *future* loss, it does not recover the past.
- **The active (in-progress, not-yet-completed) stage's live chat page** — unaffected and out of scope; it already works correctly. This is scoped to *completed* stages only.
- **Redis's 7-day TTL policy or the "compact strip" field-stripping design** — unrelated to the durability gap itself; not touched by this work.

## Assumptions and Risks

**Resolved via /clarify:** Storing verbatim conversation text is subject to the same data-governance gap flagged in `product/constraints.md` #5 (no retention/access-control model previously designed for verbatim per-invocation text). This feature's scope explicitly closes that gap for this data rather than leaving it open — via (1) the 60-day archive/rehydrate retention policy (bounds how long verbatim text is retained), and (2) inheriting the existing tenant-isolation / FORBIDDEN-vs-NOT_FOUND access-control convention already applied to artefacts (bounds who can read it). No additional scope beyond what's already specified — `/definition` should carry this forward as a real AC.

**Resolved via /clarify:** The durable store is a **new table** (`session_turns`), not an extension of the existing `artefacts` table — keeps `artefacts`' schema/contract untouched; higher isolation, slightly more plumbing, judged cleaner than the alternative.

**Resolved during discovery:** Persisting every turn indefinitely with no pruning risked unbounded storage growth. Resolved: turns older than 60 days are archived (moved out of the hot table) and rehydrated on demand if an operator opens that specific historical stage — bounds storage growth without permanently losing anything, unlike Redis's outright delete. Given this design, Redis's existing delete-on-completion behaviour remains correct as a short-term warm cache only; Postgres (with the archive tier) is now the durable source of truth.

No open assumptions remain — all three were resolved during discovery/clarify.

## Directional Success Indicators

**1. "Resume conversation" success rate.** Baseline: `[UNKNOWN BASELINE]` — not currently measured, but functionally ~0% for any stage completed before the last server restart (which given Fly's redeploy/idle-suspend cadence is common). Target: 100% — the link always resolves to a real conversation view, never "Session not found". Measured via: a regression test asserting the route never 404s for a completed stage, plus a log-based count of the `Session not found` event on this route in production.

**2. Breadcrumb "view a completed stage" shows the real conversation.** Baseline: 0% — today it never shows the original chat, only the artefact. Target: 100% of completed stages render their actual historical turns in the chat-left/artefact-right layout. Measured via: regression test + manual QA pass across a few real staging features.

**3. Storage stays bounded.** Baseline: none today (turns are deleted at completion, so no growth — but also no history). Target: turns older than 60 days are moved to archive storage automatically, verified rehydration works when an operator opens an archived stage. Measured via: a scheduled check on the "hot" turns table row count / age distribution.

## Constraints

- **Existing architecture pattern:** must follow the "Postgres-first, disk/memory fallback" convention already used throughout this app (journeys, artefacts, credits) — not a new persistence pattern.
- **Existing security policy:** must preserve the established tenant-isolation and FORBIDDEN-vs-NOT_FOUND (404-not-403) access-control convention already applied to journeys/artefacts — a historical conversation is at least as sensitive as the artefact it produced.
- **No persistent agent runtime dependency** (`product/constraints.md` #11): the 60-day archive/rehydrate job must run on standard CI/cron infrastructure (e.g. a scheduled GitHub Actions job), not a bespoke long-running service.
- **D37 injectable adapter convention** (this repo's own coding standard): any new DB-writing module for turn persistence must follow the injectable-adapter pattern (stub throws, real wiring in server.js, wiring verified by a behavioural test).
- No hard budget/timeline constraint — this is internal platform hardening work, not a customer-facing deadline.

## Contributors

- Hamish King — Platform owner

## Reviewers

- None yet

## Approved By

Hamish King — Platform owner — 2026-07-28

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

[2026-07-28] Clarified via /clarify:
- Q: Does storing full conversation text here trigger the same data-governance gap already flagged in product/constraints.md #5?  A: Yes — same gap applies; this feature's scope must explicitly close it (via the 60-day archive/rehydrate policy + existing tenant-isolation access control), not leave it open.
- Q: Should the durable conversation history be a new table (session_turns) or an extension of the existing artefacts table?  A: New table — cleaner, keeps artefacts' schema untouched for every other feature that depends on it.
