# Discovery: Web UI Navigation and Context Legibility

**Status:** Clarified — awaiting approval
**Created:** 2026-08-31
**Approved by:** Pending
**Author:** Claude (agent, with Hamish King)

---

## Problem Statement

Across a single web-UI-driven feature session (the operator's first full end-to-end feature completed via the web UI rather than the CLI), three related legibility problems surfaced. First, the "Ref docs" context panel lists every loaded context file (SKILL.md, mission.md, tech-stack.md, constraints.md, roadmap.md) as its own always-visible row, with no way to collapse it to a single indicator and drill in only when needed. Second, there is no view where an operator can list and open a feature's own epics, stories, test plans, and DoR artefacts individually — outer-loop history is not independently browsable outside the linear chat session. Third, mid-session the operator sometimes loses track of where the "next stage / continue" action is and cannot find it — a navigation affordance gets lost in the chat scroll. The underlying thread connecting all three: once a session has run for a while (multiple stages completed, growing context, growing artefact history), the UI does not give the operator an at-a-glance way to see where they are and what exists — everything lives in one long chat scroll.

## Who It Affects

Operators running a full multi-stage outer-loop feature through the web UI specifically, not the CLI — the Developer/engineer and Platform maintainer personas from `product/mission.md`. The problem does not show up in a short, single-stage session; it emerges once a session has accumulated real history — several completed stages, a growing context panel, several artefacts on disk — and the operator needs to orient themselves (where am I, what has already been produced, what do I do next) rather than just react to the latest message. Both first-time web-UI users and experienced CLI users switching to the web UI are affected equally — this is not a first-time-only onboarding gap.

## Why Now

This is the first time this repo's own web UI outer loop was exercised end-to-end, for its full duration, by someone actually depending on it to get real work done, rather than short test sessions or CLI-driven work. The friction only shows up at that "full journey" scale, which nobody had reached before this session. It also directly threatens one of the platform's own stated success outcomes (`product/mission.md`): "Run the full outer loop unassisted — self-directed, single session, without help from the platform team." If an operator cannot tell where they are or find the next-stage action, that outcome fails specifically for web-UI users, even though the CLI path already meets it. Additionally, the platform is in active beta with real users providing feedback; this session (the operator's own usage, not yet an external report) is an early signal of exactly the kind of friction beta users are likely to hit too, ahead of broader feedback arriving.

## MVP Scope

A collapsed context indicator replacing the always-expanded file-by-file "Ref docs" list — a single summary state, clickable to expand and see what is loaded. A basic per-feature artefact browser — list a feature's epics, stories, test plans, and DoR artefacts, each individually openable as a read-only view, not inline editing. A persistent next-stage action — the "continue to next stage" control stays reachable regardless of scroll position or session length, so it is never lost in the chat. All three are small, related fixes to the same underlying problem (can't tell where I am / what exists) and are bundled into one MVP rather than split, since fixing only part of the problem would not validate the underlying theory.

## Out of Scope

- The feature summary page redesign — no specific defect named yet, just "needs a look"; too undefined to bound into this MVP, deserves its own scoping pass separately once specific defects are identified (captured in `workspace/capture-log.md`, 2026-08-31).
- Inline editing of artefacts from the browser view — MVP is view/open only, not an editing surface.
- Any redesign of the chat/streaming interaction model itself — this is about navigation and legibility around the chat, not replacing it.

## Assumptions and Risks

Confirmed via /clarify: all three (context-panel collapse, artefact browser, persistent next-stage action) reuse UI patterns already established elsewhere in this codebase — the kanban board's styling, the reference-modal's expand/collapse mechanism, and sticky-positioning already used elsewhere — no new design-system components required.
Confirmed via /clarify: "persistent next-stage action" means a sticky/fixed-position element within the existing chat layout — the smallest, most contained option, not a shared-shell navigation redesign.
Confirmed via /clarify: the artefact browser reads directly from disk, matching this codebase's existing ADR-023 "disk is canonical" pattern — no new data store or index.

Risks: if the artefact browser is a separate, disconnected view rather than integrated into the existing journey flow, it could add navigation complexity instead of reducing it — more places to look, not fewer. Making the next-stage button "always visible" risks visually cluttering the chat UI if not designed carefully — trading one legibility problem for another. This MVP is not worth building if beta user feedback, once it starts arriving, shows this friction is idiosyncratic to power-usage patterns rather than a common first-time-user experience.

## Directional Success Indicators

**Time-to-orientation after returning to a long-running session:** Baseline: [UNKNOWN BASELINE] — not currently measured. Target: an operator can identify current stage and next action within a few seconds of the page loading, without scrolling. Measured via: not yet defined — a candidate for `/benefit-metric` to turn into something concrete (e.g. a timed usability check, or a proxy like clicks-before-first-meaningful-action).

**Next-stage-action findability:** Baseline: this session, at least once, the operator could not find it. Target: zero "can't find next stage" reports across beta sessions. Measured via: beta feedback / support signal, once that channel exists.

**Web UI Session Start Share** (existing benefit metric from the `cross-channel-feature-continuity` feature, target greater than 50% web UI starts within 4 weeks): this feature is a plausible contributor to that pre-existing metric rather than a new metric of its own — worth linking rather than duplicating.

## Constraints

The web UI is an Express-less Node.js HTTP server with a "no new npm dependencies" constraint already established in this codebase (architecture guardrails / ADR-009) — any UI work should reuse existing rendering/CSS/vanilla-JS patterns already present (e.g. the kanban board, the reference-modal), not introduce a new frontend framework or dependency. This is live, in-beta production infrastructure — changes must be additive and non-disruptive to existing sessions and artefact history, consistent with how every fix shipped in the preceding session was scoped. Team capability is a solo operator plus AI agent — no dedicated design/UX team member for a formal design pass; the design work happens inside this same discovery-through-implementation loop. No hard deadline is named, but beta is actively running, so there is real pressure to not let this sit too long.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [Name — Role]

## Approved By

Pending

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

[2026-08-31] Clarified via /clarify:
- Q: Can the context-panel collapse, artefact browser, and persistent next-stage action all be built with existing UI patterns already in this codebase, or does any of them need something new?  A: All three reuse existing patterns (kanban board styling, the reference-modal's expand/collapse mechanism, sticky-positioning already used elsewhere) — no new design-system components.
- Q: Does "persistent next-stage action" mean a sticky/fixed-position element within the existing chat layout, or something closer to a full navigation redesign?  A: Sticky/fixed-position element within the existing chat layout — smallest, most contained option.
- Q: Should the artefact browser read directly from disk, or does it need a new data store/index?  A: Direct disk reads, matching ADR-023 — no new data store or index.
