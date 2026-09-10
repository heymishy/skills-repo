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

## RISK-ACCEPT: `wnl-s2` baseline — 2 pre-existing failures, both confirmed unrelated

**Date:** 2026-09-10
**Category:** RISK-ACCEPT (branch-setup/subagent-execution baseline, `wnl-s2`)
**Context:** Full `npm test` on the `wnl-s2` worktree (branch `feature/wnl-s2`) shows 2 of 633 files failing: `tests/check-p3.5-validate-trace.js` and `tests/check-pcr-s1-test-runner.js`.
**Decision:** Acknowledge both as pre-existing/environmental and proceed — neither is fixed as part of this story.
**Rationale:** `check-p3.5-validate-trace.js` is the same known, pre-existing baseline failure documented across every story this session (e.g. `jasb-s1`'s own decisions.md). `check-pcr-s1-test-runner.js` failed only under full-suite load (756.1ms/file vs. a 749.8ms/file threshold, 0.8% over) — re-run in isolation, it passes cleanly (14/14 checks). Neither file's own subject matter (trace validation, test-runner performance) has any relation to `wnl-s2`'s scope (`.sw-journey-gate` sticky positioning in `src/web-ui/routes/skills.js`). Separately, this worktree's initial checkout was found missing a tracked file (`workspace/learnings.md`, confirmed via `git status` showing it as locally-deleted despite being tracked) — restored via `git checkout HEAD -- workspace/learnings.md`; this was the actual cause of 4 further apparent failures (`check-lccf-s1`, `check-lcdf-s1`, `check-lphf-s4`, and a duplicate learnings-count assertion), all confirmed passing after the restore, not a code defect.

---

## RISK-ACCEPT: `wnl-s2` mandatory route/handler E2E coverage check — no cross-spec risk found

**Date:** 2026-09-10
**Category:** Verify-completion mandatory E2E coverage check (`wnl-s2`)
**Context:** `wnl-s2` modifies `src/web-ui/routes/skills.js`'s chat-page rendering (`.sw-journey-gate`'s `style` attribute only — a CSS positioning change, no markup restructure). Six existing E2E specs exercise this same `handleGetChatHtml` render path: `a4-ideate-session-resume.spec.js`, `b1-formed-idea-outer-loop-story-map.spec.js`, `bri-s3.2-signup-onboarding-journey.spec.js`, `dic-canvas.spec.js`, `dsh-s4-resume-conversation-survives-restart.spec.js`, `fjcv-s1-full-journey-core-flow-and-resume.spec.js`, plus `iwu2-right-panel-layout.spec.js` (already covered by `wnl-s1`'s own RISK-ACCEPT above, same pre-existing session-creation 400 failure, unrelated to any code in this feature).
**Decision:** No additional local E2E run required beyond the story's own new spec (`wnl-s2-journey-gate-sticky.spec.js`, 3/3 passing) and the existing `check-lsbm-s1-live-substep-injection.js` unit suite (12/12 passing, the one suite with a documented literal-string dependency on `.sw-journey-gate`).
**Rationale:** Grepped all `tests/e2e/*.spec.js` for the literal string `sw-journey-gate` — only the new `wnl-s2-journey-gate-sticky.spec.js` references it. None of the other six chat-page specs assert on this div's markup, class, or positioning, so a CSS-only `style` attribute change carries no risk of breaking their assertions.
