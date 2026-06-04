## Epic: /ideate skill emits assumption markers consistently across full multi-turn sessions

**Discovery reference:** artefacts/2026-05-21-ideate-web-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-05-21-ideate-web-ux/benefit-metric.md
**Slicing strategy:** User journey — single story; delivery is gated on Epic 1 being merged so the full card pipeline exists to observe markers in a real session.

## Goal

When this epic is complete, the `/ideate` SKILL.md contains an explicit instruction to emit `---ASSUMPTION-JSON: {...}---` markers for every assumption surfaced during Lens B, and this has been verified to produce ≥70% emission in a real multi-turn session (≥6 turns before Lens B). The `session.assumptionCardsEnabled` flag is set to `true` by default, activating assumption cards for all sessions. The delivery chain for this epic closes the loop between the model output and the web UI pipeline delivered in Epic 1.

## Out of Scope

- SKILL.md changes to any skill other than `ideate`
- Clusters 3, 5, 6 from discovery (deferred to post-MVP)
- Changes to `src/web-ui` server code — all server-side and browser-side changes are in Epic 1
- Automated CI verification of multi-turn emission rate — the DoD entry condition for AC3 is a human-in-the-loop real session (not CI-only)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Assumption card render reliability | 0% (no production SKILL.md tuning) | ≥95% of markers emit a visible card | iwu.6 is the upstream enabler: without SKILL.md instruction, markers are not emitted and M1 is structurally 0% in real sessions |
| MM1 — Marker emission rate in real multi-turn sessions | Unknown (only clean-context single-turn tested in Spike A2) | ≥70% emission rate at turn 6+ | iwu.6 AC3 is the DoD entry condition that measures this directly |

## Stories in This Epic

- [ ] iwu.6 — Add `---ASSUMPTION-JSON---` marker emission instruction to ideate/SKILL.md

## Human Oversight Level

**Oversight:** High
**Rationale:** `.github/skills/ideate/SKILL.md` is a governed file (ADR-011 / Platform change policy). Changes require a PR reviewed by the operator. Additionally, AC3 (multi-turn emission verification) is a DoD entry condition that requires a real operator session — the coding agent cannot complete this story autonomously. Human execution of AC3 is mandatory before DoD sign-off.

## Complexity Rating

**Rating:** 2
**Rationale:** The SKILL.md text change itself is straightforward. The complexity is in the delivery gate: AC3 requires a real multi-turn session, and model context drift at turn 6+ is a known risk (the reason Spike A2 only tested clean-context single-turn). If AC3 fails, the instruction text must be revised and re-tested before merge.

## Scope Stability

**Stability:** Stable
**Rationale:** Scope is a single bounded instruction block change in one SKILL.md. The DoD condition is explicit. Risk is in model behaviour (context drift), not scope.
