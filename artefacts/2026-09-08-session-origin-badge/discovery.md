# Discovery: Session-Origin Badge

**Status:** Approved
**Created:** 2026-09-08
**Approved by:** Hamish King — Platform Owner — 2026-09-08
**Author:** Copilot

---

## Problem Statement

Operators scanning a feature/story list (the product feature-list page, `/journey`, and the org kanban board) cannot tell, without opening each feature individually, whether a given completed stage was produced through a real interactive web session (which can be resumed — the conversation and its turn history revisited) or was authored directly by an agent/CLI writing artefacts and `pipeline-state.json` (no session ever existed, so "Resume conversation" structurally cannot appear). This gap surfaced today during a live investigation of a reported "resume link missing" issue: the resume mechanism itself was proven correct end-to-end (verified live on `wuce-staging` — created a real session-backed test feature, confirmed the resume link appeared and opened the real historical conversation, then deleted it and watched it revert to exactly the same "no resume affordance" signature that CLI-authored features show). The actual gap is visibility: an operator has to click into a feature's artefact page and check for a "Resume conversation" link (or its absence) to learn this, one feature at a time.

## Who It Affects

The operator (currently Hamish King, and any future team member) triaging or reviewing the feature backlog across the product list, `/journey` dashboard, and org kanban — anyone deciding whether a given feature/stage has a live conversation worth revisiting versus one that was CLI/agent-authored and has nothing to resume.

## Why Now

The underlying signal already exists in the data and was just proven reliable this session (`journey.completedStages[].sessionId` presence, keyed per stage, exposed via the existing `_journeyStore` journey lookup that `/features/:slug`'s own resume-link logic already uses). The cost of surfacing it as a small visual indicator is low, and the need was directly identified by the operator immediately after confirming the mechanism works — the right moment to close the loop before the finding is forgotten.

## MVP Scope

A small per-stage-aware indicator shown next to each feature row on three list surfaces:
1. The product feature-list page (`/products/:id`)
2. The `/journey` dashboard
3. The org kanban board (`/org/kanban`)

The indicator reflects a tri-state per feature, derived from that feature's real journey record (when one exists) and its `completedStages[].sessionId` values compared against its total completed-stage count:
- **Fully session-backed** — every completed stage has a real `sessionId` (a live web session produced it)
- **Mixed** — some completed stages have a `sessionId`, others don't
- **No session** — no real journey record exists at all, or none of its completed stages carry a `sessionId` (CLI/agent-authored)

**Stage scope (clarified 2026-09-08):** counts *every* completed stage — outer-loop (discovery through definition-of-ready) and inner-loop (branch-setup through definition-of-done) alike — not just outer-loop stages. Today's build never produces inner-loop stages via a live session (CLAUDE.md's pipeline model is CLI/agent-driven for those by design), so most fully-implemented features will show "mixed" or "no session" once inner-loop stages complete — this is expected and accurate for today's build, not a defect. The operator explicitly chose this over an outer-loop-only calculation because a future managed-agent inner loop driven from the web UI is plausible, and the indicator should keep reflecting real session presence rather than hard-coding today's outer/inner split as a permanent assumption.

Backed entirely by existing data (no new writes, no schema change) — a read-only derived signal computed from data these same pages already load or can load in one bulk pass.

## Out of Scope

- **Retroactively creating a session for a CLI-authored feature.** The existing lazy-session-creation-on-first-resume-click behavior (`/journey/:slug/resume`, `ep1-s3`) already covers this; this story only surfaces the current state, it does not change what happens when an operator clicks in.
- **Changing `/features/:slug`'s own "Resume conversation" per-artefact links.** Verified working correctly this session — out of scope for this story.
- **New telemetry or tracking.** No new data collection; this reads `journey.completedStages[].sessionId`, which is already recorded today.

## Assumptions and Risks

No unconfirmed assumptions requiring `/clarify` — the two open design questions from this session's discussion (indicator granularity: per-stage mix, not a single feature-level binary; and surface coverage: all three list pages, not just the product page) were both explicitly answered by the operator before this discovery was drafted. The main risk carried into `/design` and `/definition` is purely presentation: choosing an icon/visual treatment for three states (fully / mixed / none) that reads clearly at list-row density without adding visual noise, and confirming a bulk-lookup query pattern exists (or can be added cheaply) for the org kanban and product-list pages so this doesn't introduce a per-row N+1 query — `/features/:slug`'s own frsr-s1 precedent already solved this for the single-feature case with one lookup per page render; the list pages need the equivalent for many features at once.

## Directional Success Indicators

**Operator can identify a feature's session-origin state from the list view without opening it.** Baseline: 0% — today this requires opening each feature's artefact page and checking for a resume link. Target: 100% of rows on all three list surfaces show the indicator. Measured via: manual verification on staging (spot-check known session-backed vs. CLI-authored features) plus an automated test asserting the correct state renders for fixture journeys covering all three states (fully / mixed / none).

## Constraints

- Must use only existing data (`journey.completedStages[].sessionId`, and journey existence itself) — no new backend writes or schema changes.
- Must not introduce a per-row journey lookup on list pages that can show many features at once (product list, org kanban) — needs a single bulk lookup per page render, matching the existing `frsr-s1` NFR-Performance precedent on `/features/:slug`.
- Visual treatment must remain legible at the existing row/card density on all three surfaces — deferred to `/design`.

## Contributors

- Hamish King — Product Owner / Operator
- Claude (Sonnet 5) — Discovery drafting, informed directly by this session's live investigation and verification

## Reviewers

- None — approved directly by the Platform Owner without a separate review pass

## Approved By

Hamish King — Platform Owner — 2026-09-08

## Clarification log
[2026-09-08] Clarified via /clarify:
- Q: Should the tri-state count only outer-loop stages (discovery through definition-of-ready), or every completed stage including inner-loop (branch-setup through definition-of-done)?  A: Every completed stage (Option B) — today's build never puts inner-loop stages through a live session, but a future managed-agent inner loop driven from the web UI is plausible, and the indicator should reflect real session presence rather than assume today's outer/inner split permanently.

---

**Next step:** Human review and approval → /benefit-metric
