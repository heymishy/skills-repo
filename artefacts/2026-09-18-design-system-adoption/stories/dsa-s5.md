## Story: `design.system` Context Tag Triggers a Real DoR Hard Block

**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/design-system-governance.md
**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Domain:** web-ui

## User Story

As a **Hamish King (Founder/Operator)**, acting in his role signing off `/definition-of-ready` for future stories,
I want **a story that bypasses the design system to be genuinely blocked at DoR sign-off, not just documented as a rule that nothing enforces**,
So that **the visual consistency this initiative establishes doesn't silently erode the first time a future story skips it**.

## Benefit Linkage

**Metric moved:** `design.system` DoR gate is real and enforced
**How:** This story builds the actual enforcement mechanism — a new DoR hard block, modeled on this repo's own existing hard-block pattern (`H-NFR-profile`, `H-ADAPTER`, `H-INF`, `H-MIG`) — moving the metric from 0 (mechanism doesn't exist) to a real, test-proven block.

## Architecture Constraints

- `product/constraints.md` #8: "Design artefacts are referenced, not embedded" — `DESIGN.md` must be referenced via `context.yml`, never embedded into any SKILL.md file's own content.
- `product/constraints.md` #9: "Design system compliance is structural, not advisory... a DoR hard block" — this story is the first real implementation of that already-documented (but previously unenforced) constraint.
- Real precedent confirmed via direct read of `skills/definition-of-ready/SKILL.md`: existing conditional hard blocks (`H-INF`, `H-MIG`) use the pattern "if the story's pipeline-state entry has `has<X>Track: true`, check [artefact/condition]; if absent or false, skip this check entirely — other hard blocks are unaffected." This story's new hard block (working name: `H-DESIGN`) must follow this exact same trigger-condition/skip-when-absent shape, not invent a different mechanism.
- Confirmed via `/clarify`: compliance is a hybrid check — automated scan for hardcoded color/font values not in `DESIGN.md`'s token list (the DoR-time-checkable half), plus manual reviewer judgment for structural/layout compliance (not automatable, remains a human DoR-sign-off judgment call, not a new automated check).

## Dependencies

- **Upstream:** None (this story's own governance mechanism doesn't depend on the visual restyle stories completing first — it can be built and tested independently, using its own deliberately-noncompliant test fixture rather than a real restyled screen).
- **Downstream:** Governs every future story tagged `design.system`, including any of `dsa-s1`–`dsa-s4` if they are re-touched after this story ships, and any story in any future feature.

## Acceptance Criteria

**AC1:** Given `context.yml`, When it is read, Then it contains a reference to `DESIGN.md`'s path (not its content embedded) as the platform's canonical design artefact — per `constraints.md` #8.

**AC2:** Given a story's pipeline-state entry has `hasDesignSystemTrack: true`, When `/definition-of-ready` runs its hard-block checks, Then a new `H-DESIGN` block scans the story's declared touched files for hardcoded color or font values not present in `DESIGN.md`'s token table, and fails with a specific message naming the offending file and value if any are found — matching the exact fail-message format convention of existing hard blocks (e.g. `H-ADAPTER FAIL: ...`).

**AC3:** Given a deliberately-noncompliant test story (a fixture, not a real production story) tagged `hasDesignSystemTrack: true` with a hardcoded, non-token color value in its declared touched files, When `/definition-of-ready` runs, Then `H-DESIGN` fires and `dorStatus` is set to `blocked` — proving the block is real, not documentation.

**AC4:** Given a compliant test story tagged `hasDesignSystemTrack: true` with only token-table color/font values in its declared touched files, When `/definition-of-ready` runs, Then `H-DESIGN` passes and does not block sign-off — proving no false positive.

**AC5:** Given a story's pipeline-state entry does NOT have `hasDesignSystemTrack: true` (the flag is absent or false), When `/definition-of-ready` runs, Then `H-DESIGN` is skipped entirely and every other existing hard block (`H1`–`H13`, `H-GOV`, `H-ADAPTER`, `H-INF`, `H-MIG`, `H-NFR-profile`) is unaffected — matching the exact "skip when absent" discipline `H-INF`/`H-MIG` already establish, confirmed by re-running this repo's own existing DoR test coverage for those blocks with no regression.

## Out of Scope

- **Retroactively enforcing `design.system` DoR compliance on already-in-flight or already-shipped stories** — including `dsa-s1`–`dsa-s4` in this same feature, which are not retroactively re-gated by this story.
- **An automated structural/layout compliance checker** — the hybrid model's manual-reviewer-judgment half stays manual; this story only automates the token-value-scan half.
- **WCAG 2.1 AA accessibility enforcement as a new mechanism** — already a separate, existing platform-wide hard floor per `constraints.md` #9, not duplicated here.

## NFRs

- **Performance:** The `H-DESIGN` scan must complete within `/definition-of-ready`'s existing overall gate-check budget — no material slowdown to the DoR sign-off flow.
- **Security:** None identified.
- **Accessibility:** None identified (this story is a governance/tooling mechanism, not user-facing UI).
- **Audit:** `H-DESIGN`'s pass/fail result and the specific offending file/value (on failure) must be recorded in the DoR artefact, matching every other hard block's own audit-trail convention.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: no direct precedent exists in this codebase for a diff-content-scanning DoR check (existing hard blocks check artefact presence/fields, not file content against a token list) — H-INF/H-MIG's trigger-condition/skip-when-absent shape is a solid structural template, but the actual token-scanning logic is new. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
