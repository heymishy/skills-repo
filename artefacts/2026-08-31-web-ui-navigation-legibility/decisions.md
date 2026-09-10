# Decisions: Web UI Navigation and Context Legibility

Per this repo's standing rule (`CLAUDE.md`, "decisions.md is mandatory for features with architectural choices"). Created at discovery/clarify time; appended as further decisions are made during delivery.

---

## Decision: Reuse existing UI patterns for all three MVP items

**Date:** 2026-08-31
**Context:** Whether the context-panel collapse, artefact browser, and persistent next-stage action need new design-system components or can reuse patterns already present in this codebase.
**Decision:** All three reuse existing patterns — the kanban board's styling, the reference-modal's expand/collapse mechanism, and sticky-positioning already used elsewhere in the web UI.
**Rationale:** No new design-system component work needed; keeps the MVP small and consistent with the codebase's existing "no new npm dependencies" constraint. Confirmed by the operator via `/clarify`, 2026-08-31.

---

## Decision: "Persistent next-stage action" is a sticky element, not a nav redesign

**Date:** 2026-08-31
**Context:** Whether "persistent next-stage action" means a small sticky/fixed-position element within the existing chat layout, or a shared persistent header/sidebar redesign across all skill sessions.
**Decision:** A sticky/fixed-position element within the existing chat layout.
**Rationale:** Smallest, most contained option — a shared-shell redesign would touch every skill session's template and expand scope well beyond this feature's MVP. Confirmed by the operator via `/clarify`, 2026-08-31.

---

## Decision: Artefact browser reads directly from disk, no new data store

**Date:** 2026-08-31
**Context:** Whether the per-feature artefact browser (epics, stories, test plans, DoR) needs a new data store or index, or can read directly from disk.
**Decision:** Direct disk reads, matching this codebase's existing ADR-023 "disk is canonical" pattern.
**Rationale:** Reuses an already-proven pattern used throughout this session's own fixes; no evidence yet that any feature has enough artefacts to need an index for performance — can revisit if that changes. Confirmed by the operator via `/clarify`, 2026-08-31.

---

## Decision: `wnl-s3`'s dashboard no-product entry point shows no numeric count

**Date:** 2026-09-10
**Context:** `/review` (Run 1) flagged a real design-consistency risk: the discovery's own "Minimum viable form" language described a "No product (N)" entry point, but `wnl-s3`'s own Out of Scope explicitly defers fixing the sidebar's separate, Postgres-only `noProductJourneyCount`. Showing a count on the new dashboard entry point (correctly including not-yet-backfilled CLI features) risked visibly disagreeing with the sidebar's own, still-undercounting number on the same page load.
**Decision:** The dashboard entry point indicates presence only (e.g. "No product work →"), no "(N)" count — a small, deliberate refinement of the discovery's literal MVP wording, not a scope change. Reachability (the actual capability this story and M3 exist to deliver) is unaffected.
**Rationale:** Avoids shipping a visible two-different-numbers-on-one-screen inconsistency without requiring the sidebar's own fix as a prerequisite for this story. Found and resolved during `/review` (finding 1-M1 on `wnl-s3`), not deferred silently.

---

## RISK-ACCEPT: `wnl-s1`/`wnl-s2`/`wnl-s3` verification scripts not yet reviewed by a separate domain expert

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (DoR Warning W4, all 3 stories)
**Context:** DoR for `wnl-s1`, `wnl-s2`, and `wnl-s3` each flagged W4 — none of the 3 AC verification scripts have been reviewed by a separate domain expert before sign-off.
**Decision:** Proceed without a separate pre-code review of any of the 3 scripts.
**Rationale:** All 3 stories are low-complexity (rating 1, 1, 2) reusing already-established, already-live patterns (native `<details>`, `.sw-imp-banner`'s sticky technique, `_mergeStateFeaturesIntoJourneyList` per ADR-028). Each story's ACs were independently scrutinised twice via `/review` (Run 1 finding real issues, Run 2 confirming clean). `wnl-s3`'s own test plan additionally names a specific test (`entry-point-shown-for-cli-only-unbackfilled-feature`) explicitly designed to catch a shallow/naive implementation by construction. Operator (Hamish King) directed all 3 stories through the pipeline directly in-session.

---

## RISK-ACCEPT: pre-existing iwu2-right-panel-layout.spec.js failures (7/7), confirmed unrelated to wnl-s1

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (verify-completion, mandatory route/handler E2E coverage check, wnl-s1)
**Context:** `wnl-s1` touches `src/web-ui/routes/skills.js`, triggering the mandatory route/handler E2E coverage check. `tests/e2e/iwu2-right-panel-layout.spec.js` exercises the same skill-session chat page and was run locally: all 7 tests fail with an identical `expect(sessionRes.status()).toBe(201)` (received 400) at session creation, before any HTML rendering occurs.
**Decision:** Acknowledge as pre-existing and proceed — do not fix as part of this story.
**Rationale:** Ran the identical spec at the pre-fix commit (`ef9bc0ff`, via a temporary worktree) before assuming this was unrelated. Result: the exact same 7 tests fail identically at the pre-fix baseline, same error, same line. This is a session-creation API failure unrelated to `buildContextManifestHtml()` or any HTML the context manifest renders. `tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js` (the other spec checked) passes its 2 local tests cleanly; its one failure is `@real-staging`-tagged and depends on live staging state, not locally verifiable by design. Fixing `iwu2`'s session-creation failure is out of scope for this story; worth its own follow-up.
