# Discovery: Web UI Learnings and Improvements Integration

**Status:** Draft — pending approval
**Feature slug:** 2026-09-28-web-ui-learnings-and-improvements
**Discovery started:** 2026-09-28
**Skill:** /discovery

---

## Problem statement

The web UI skill launcher currently presents all skills as equally valid starting points, when in practice only a small subset are valid entry points to a new pipeline run (discovery, ideate, reverse-engineer, and similar — the rest are chained stages that require prior artefacts to exist). This creates a cluttered, misleading dashboard experience where operators must already know which skills are valid starts.

More critically, the platform's self-improvement loop — which accumulates signals in `workspace/capture-log.md`, `workspace/learnings.md`, improvement proposals, and other workspace artefacts — has no surfacing mechanism in the web UI. The improvement loop is a core platform promise: real delivery signal feeds back into the pipeline and seeds future work. Today this loop is only accessible via CLI or Claude Code sessions, making it effectively invisible to anyone using the web UI. A key differentiating feature of the platform is silently missed.

The two problems are related: the dashboard needs a clearer, more intentional UX that both rationalises the skill entry points and surfaces improvement signals as actionable seeds — a single integrated call to action rather than two separate flows.

---

## Who it affects

**Primary persona: Solo operator (you, today)**
Uses the web UI as the primary interface for pipeline sessions. Currently must context-switch to CLI or Claude Code to access the improvement loop. Knows the system well enough to work around the limitation, but the workaround adds friction and means improvement ideas are only captured when the operator happens to be in a CLI session.

**Primary persona: Future team members and tenants**
Will encounter the web UI as their primary or only interface. Will have no awareness that a self-improvement loop exists unless it is surfaced explicitly. The platform's core promise — that delivery signal feeds back into future work — will be invisible to them unless the web UI exposes it.

---

## Why now

The web UI is the primary delivery surface for Phase 5 and beyond. As the platform moves from solo-operator CLI usage toward multi-user, multi-tenant web delivery, any capability that is CLI-only becomes a hidden feature. The self-improving loop is not an optional enhancement — it is described in the product mission and roadmap as a core differentiator. Leaving it web-UI-invisible while positioning the platform for broader adoption creates a gap between the platform's promise and what users actually experience.

---

## MVP scope

A single integrated dashboard experience that:

1. **Rationalises the skill launcher** — surfaces only valid entry-point skills (discovery, ideate, reverse-engineer, and any others confirmed as standalone starts) rather than all skills. Chained skills are not shown as primary CTAs, or are visually distinguished as requiring a prior session.

2. **Surfaces improvement signals as seeds** — reads from at least two sources (`workspace/capture-log.md` and `workspace/learnings.md` as the first-pass candidates, with the design open to additional sources from the broader framework) and presents actionable items that can seed a new short-track or full pipeline run.

3. **Provides a clear call to action** — the improvement signal surfacing is not a passive read-only view. Each signal entry has a CTA that pre-populates or launches a new skill session (e.g. a capture log entry seeds a discovery session with that signal as the initial context).

The MVP is integrated into the existing dashboard UX — not a separate page or modal — with a clear, prominent entry point.

---

## Out of scope

- **Automated signal extraction or AI summarisation of workspace files** — the MVP reads and surfaces existing structured content; it does not run a model pass over workspace files to generate new improvement proposals.
- **Modification of the capture-log or learnings format** — the MVP consumes existing file formats as-is; format changes are a separate concern.
- **Full `/improve` skill execution via the web UI** — the MVP seeds a new session; it does not execute the full improvement agent loop from the browser.
- **Admin or tenant-level configuration of which signals are surfaced** — the MVP uses a fixed set of signal sources; per-tenant configuration is deferred.

---

## Assumptions and risks

[ASSUMPTION] `workspace/capture-log.md` and `workspace/learnings.md` are the primary signal sources to surface first — unconfirmed, the operator indicated there are other framework areas that surface learnings; full source inventory requires /clarify before scope is locked.

[ASSUMPTION] The valid entry-point skill list is stable and can be hardcoded or configured in `context.yml` — unconfirmed, the exact list of standalone-start skills vs chained skills needs explicit enumeration before implementation.

[ASSUMPTION] Signals are surfaced per-repo (i.e. for the workspace the web UI is connected to) — unconfirmed for multi-tenant deployments where workspace files may not be co-located with the repo root.

**Risk:** If the signal sources are not structured consistently (e.g. capture-log entries vary in format across sessions), parsing and presenting them cleanly may require normalisation work not anticipated in MVP scope.

**Risk:** The "clear CTA" design requires a UX decision about how a seed pre-populates a skill session — this is a design question that should be resolved before implementation begins.

---

## Directional success indicators

**Skill launcher clarity:** Baseline: all skills shown as equal CTAs (current state). Target: only valid entry-point skills shown as primary CTAs; chained skills visually distinguished or hidden. Measured via: visual inspection + E2E spec asserting entry-point skills are present and a representative chained skill is not shown as a primary CTA.

**Improvement signal surfacing:** Baseline: 0 workspace signals surfaced in web UI (current state). Target: ≥1 signal source surfaced with a working CTA that seeds a new session. Measured via: E2E spec asserting signal entries appear in the dashboard and CTA launches a pre-populated skill session.

**Self-improvement loop accessibility:** Baseline: improvement loop requires CLI or Claude Code access (current state). Target: an operator using only the web UI can surface a capture log entry and start a new pipeline run seeded by it, in a single browser session. Measured via: operator walkthrough in a real browser session without CLI access.

---

## Constraints

- **No new npm runtime dependencies** — per the web UI architecture constraint (tech-stack.md), the implementation must use built-in Node.js modules only for any server-side file reading.
- **Single-file HTML viz pattern is preserved** — if the dashboard UX changes touch `dashboards/pipeline-viz.html`, the single-file, no-build-step constraint (ADR-001) applies.
- **Artefact-first rule (ADR-011)** — any new `src/` modules, route handlers, or dashboard behavioural changes introduced by this feature require a story artefact before or alongside implementation.
- **Design system reference** — UI changes should align with the design system reference in `context.yml` (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`).

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] `workspace/capture-log.md` and `workspace/learnings.md` are the primary signal sources to surface first — the operator indicated there are other framework areas that surface learnings; full source inventory requires clarification.
- [ASSUMPTION] The valid entry-point skill list is stable and can be hardcoded or configured in `context.yml` — the exact list needs explicit enumeration.
- [ASSUMPTION] Signals are surfaced per-repo — unconfirmed for multi-tenant deployments.

---

## Attribution

**Contributors:**
- Hamish King — Operator / Product Owner — 2026-09-28

**Reviewers:**
- Pending

**Approved By:**
- Pending

---
*Status: Draft — awaiting operator approval before proceeding to /benefit-metric*