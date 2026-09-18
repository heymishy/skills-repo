# Discovery: Design System Adoption

**Status:** Approved
**Created:** 2026-09-18
**Approved by:** Hamish King — Founder/Operator — 2026-09-18
**Author:** Claude (agent), synthesised from a live discovery conversation with the operator

---

## Problem Statement

The Skills Platform's current web-ui visual design — the "Notion-calm" system inlined in `src/web-ui/utils/html-shell.js`'s `DESIGN_SYSTEM_CSS` — is dated and visually inconsistent across screens, and does not project a modern SaaS product or a clear brand direction. This affects the dashboard, landing page, skill-session chat, and artefact viewer, the product's core real screens. A complete design system has already been produced to address this: `DESIGN.md` (typography, color tokens for both dark and light mode, spacing, component rules, a custom icon spec, and layout patterns per screen type) plus reworked mock screens (`.dc.html` files) for all 4 of those real surfaces, serving as the canonical reference for the restyle. These files already exist in this codebase, organised at `artefacts/2026-09-18-design-system-adoption/reference/`.

## Who It Affects

**Hamish King — Founder/Operator.** Day-to-day operator of the platform, and the person who commissioned this design system directly. Experiences the current visual inconsistency across every screen he uses.

**Two beta users** (not yet more specifically named). Onboarded recently, giving the platform real external users for the first time. Their first impression of the product's visual credibility as a modern SaaS tool now matters in a way it did not when Hamish was the platform's sole user.

## Why Now

Two things landed at the same time. Two beta users onboarded recently — real external users experiencing the product for the first time, at the exact moment their first impression is being formed. Simultaneously, a specific brand direction is being set for the product, and the current "Notion-calm" visual system predates that direction and doesn't reflect it.

## MVP Scope

1. **Restyle the product's real web-ui screens** to match `DESIGN.md` and the reworked mocks, by reusing and extending the existing CSS custom-property token architecture already in `src/web-ui/utils/html-shell.js` (`:root`/dark-mode blocks) rather than introducing a parallel styling mechanism — confirmed via code search that the real code already defines matching token names (`--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--line`) with different hex values, plus differently-named status tokens (`--green`/`--amber`/`--red` in the real code vs. `--success`/`--warn`/`--danger` in `DESIGN.md`, though the light-mode hex values are byte-identical between them) that need renaming. The 4 named screens (dashboard, landing, skill-session chat, artefact viewer) are the primary, concretely-mocked targets; the design system's tokens and components are applied more broadly where reasonable, not strictly limited to just those 4. At `/definition`, this item was deliberately split into 4 independently-demoable, per-screen vertical-slice stories (`dsa-s1`–`dsa-s4`), ordered smallest/lowest-risk first (artefact viewer, dashboard, landing, then the skill-session chat page last, since it is this codebase's single largest file) — a scope-accumulator ratio flag at `/definition` was reviewed and confirmed as intentional, not drift (see `decisions.md`).
2. **Implement both dark and light mode**, per `DESIGN.md`'s documented token tables for both. The underlying toggle mechanism already exists and works (`src/web-ui/routes/settings.js`) — this MVP applies the new token values to it, it does not build the toggle itself. Folded into each of the 4 per-screen stories above (`dsa-s1`–`dsa-s4`) rather than a separate story — every screen's restyle covers both modes together.
3. **Wire the design system into the platform's own governance layer.** Register `DESIGN.md` as the referenced design artefact per `product/constraints.md` #8 (referenced via `context.yml`, not embedded in SKILL.md files), and build the real `design.system` DoR hard-block described in `constraints.md` #9 — confirmed via code search that this enforcement mechanism does not exist yet today, so this is genuine new governance logic, not just a documentation/context.yml reference. Compliance is determined via a hybrid check: an automated scan for the obvious violations (hardcoded color/font values not in the token list — `DESIGN.md`'s own "Rules for agents extending this system" already implies this), plus manual reviewer judgment at DoR sign-off for structural/layout compliance the automated scan can't catch. One story at `/definition` (`dsa-s5`), modeled on this codebase's existing conditional hard-block pattern (`H-INF`/`H-MIG`).

## Out of Scope

- **Retroactively enforcing `design.system` DoR compliance on already-in-flight stories.** The new hard-block applies going forward only; stories already past DoR sign-off are not revisited.
- **Extending the design system further.** Inventing new tokens, components, or patterns beyond what `DESIGN.md` and the mocks already specify is a future initiative. This pass applies the existing, already-produced system — it does not grow it.

## Assumptions and Risks

Applying a full visual restyle across 4 real, already-shipped, in-production screens in one unit carries real regression risk to existing functionality if not carefully scoped per-screen during implementation — one of the 4 screens, the skill-session chat page (`routes/skills.js`), is this codebase's single largest, most heavily-used file. The light/dark toggle mechanism itself is confirmed real and already working, so no risk there. The `design.system` DoR hard-block was confirmed, via code search, not to exist yet — this was raised as an open question during this discovery and resolved: the operator confirmed building the real enforcement mechanism is included in this story's MVP, not split into a follow-on story.

## Directional Success Indicators

**Visual consistency across the 4 real screens.** Baseline: today's inconsistent "Notion-calm" system (qualitative — no scripted check exists yet). Target: all 4 screens match `DESIGN.md`'s token values. Measured via: manual/visual review against the mocks, or a scripted check comparing rendered CSS values to the token table.

**`design.system` DoR gate is real and enforced.** Baseline: 0 — the mechanism does not exist today. Target: a story tagged `design.system` in `context.yml` genuinely fails DoR sign-off if it bypasses the design system. Measured via: a real test that tags a deliberately-noncompliant test story and confirms DoR blocks it.

**Beta user feedback on visual quality.** Baseline: `[UNKNOWN BASELINE]` — no prior survey or structured feedback exists. Target: positive direct feedback from the 2 beta users on the restyled product, with no negative comments about visual inconsistency or dated appearance. Measured via: direct feedback (informal, not a structured survey).

## Constraints

None identified. `DESIGN.md` and the reworked design files already exist locally in the codebase (organised at `artefacts/2026-09-18-design-system-adoption/reference/` for this discovery) — no external dependency on producing them.

## Contributors

- Hamish King — Founder/Operator
- Claude — Agent (design system synthesis, discovery facilitation)

## Reviewers

- Pending

## Approved By

Hamish King — Founder/Operator — 2026-09-18

---

## Clarification log

[2026-09-18] Clarified via /clarify:
- Q: How should the DoR hard-block determine whether a story's UI change is "design-system compliant"?  A: Hybrid — automated scan for hardcoded color/font values not in the token list, plus manual reviewer judgment for structural/layout compliance at DoR sign-off.
- Q: Should WCAG 2.1 AA accessibility be an explicit constraint/AC-driver for this restyle, given `constraints.md` #9 already establishes it platform-wide?  A: No — already a platform-wide floor via `constraints.md`, redundant to restate per-feature.
- Q: Should the restyle reuse/extend the existing CSS custom-property token architecture already in `html-shell.js`, or introduce a different styling mechanism?  A: Reuse/extend the existing `:root` custom-property blocks — update hex values to match `DESIGN.md`, rename `--green`/`--amber`/`--red` to `--success`/`--warn`/`--danger`.

---

**Next step:** Human review and approval → /benefit-metric
