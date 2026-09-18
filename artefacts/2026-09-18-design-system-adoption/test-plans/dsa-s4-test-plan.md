## Test Plan: Restyle the Skill-Session Chat Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Skill session" pattern and the real mock | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing chat/journey-gate/diagram behavior | — | — | 15 pre-existing specs re-run | — | — | 🟡 |

**Risk rationale for AC4 (🟡, not 🟢 like the other 3 screens' equivalent AC):** this is this codebase's single largest, most heavily-used file (`routes/skills.js`, `_renderChatPage`), with the widest functional surface area of any of the 4 restyled screens — 15 pre-existing E2E specs reference it, versus 1 (dashboard), 1 (landing), or 4 (artefact viewer). The regression-test surface is genuinely larger and riskier here, which the epic's own Complexity Rating (3, vs. 1–2 for the other screens) already reflects.

---

## Coverage gaps

None — same computed-style/layout E2E reasoning as `dsa-s1`/`dsa-s2`/`dsa-s3`. The size of AC4's regression surface is a *risk* to budget real implementation/review time for, not a coverage *gap* — every one of the 15 specs is genuinely re-runnable.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real skill-session chat page for any skill (dark mode active) | Synthetic — matches this session's own `ep2-s3` precedent for seeding a real chat session via test-only endpoints | None | |
| AC2 | Same as AC1, with light mode applied | Synthetic | None | |
| AC3 | Multiple skill-type sessions (generic, `/ideate`, `/definition`) to confirm each right-pane variant | Synthetic | None | The layout pattern varies by skill type — AC3's real verification needs at least one session of each named variant, not just one |
| AC4 | Pre-existing test fixtures already used by the 15 specs listed below | Existing fixtures | None | Reuse, do not duplicate |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — same reasoning as the other 3 restyle stories.

---

## Integration Tests

None — pure presentation change; the pure-append discipline (Architecture Constraints) governs implementation, not testing strategy.

---

## E2E Tests (Playwright)

### skill-session-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real skill-session chat page is open (dark mode default)
- **Action:** Read computed color custom-property values via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### skill-session-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same page, light mode toggled on
- **Action:** Same computed-style read
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### skill-session-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Sessions for a generic skill, `/ideate`, and `/definition`
- **Action:** Assert presence of the resizable two-pane layout, Focused/Chat segmented-control toggle, and the correct right-pane variant per skill type (Artefact draft + Diagrams generically; Conditions/Assumptions/Canvas for `/ideate`; Story map + Diagrams for `/definition`)
- **Expected result:** All named structural elements present and correctly varying by skill type
- **Edge case:** Yes — each skill-type variant is itself an edge case relative to the generic layout; do not test only the generic case

### skill-session-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run all 15 pre-existing specs unmodified: `b1-formed-idea-outer-loop-story-map.spec.js` (`@real-staging`), `bri-s3.2-signup-onboarding-journey.spec.js`, `csd-s1-data-model-diagram.spec.js`, `csd-s2-canvas-diagram-rendering.spec.js`, `design-definition-canvas-render.spec.js`, `dic-canvas.spec.js`, `dsh-s4-resume-conversation-survives-restart.spec.js` (`@real-staging`), `fjcv-s1-full-journey-core-flow-and-resume.spec.js`, `iwu2-right-panel-layout.spec.js`, `reference-upload.spec.js`, `skill-launcher.spec.js`, `wnl-s2-journey-gate-sticky.spec.js`, `wuce23-skill-launcher-landing.spec.js`, `wuce24-guided-question-form.spec.js`, `wuce25-session-commit-result.spec.js`. The 2 `@real-staging`-tagged specs (confirmed via this session's own `ep2-s3` investigation) cannot run locally, per this repo's established precedent — never attempted against real staging.
- **Expected result:** All 13 locally-runnable specs pass with no changes required; the 2 `@real-staging` specs are named as residual risk in the `/verify-completion` report, not silently skipped
- **Edge case:** No

---

## NFR Tests

### skill-session-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle
- **Pass threshold:** No measurable regression
- **Tool:** Manual timing comparison during implementation

### skill-session-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor)
- **Tool:** Manual comparison during implementation

---

## Out of Scope for This Test Plan

- Any functional/behavioral change to chat, journey-gate, sub-step, or diagram mechanisms — visual restyle only, pure-append/token-substitution.
- Testing any of the other 3 real screens — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| `b1-formed-idea-outer-loop-story-map.spec.js` and `dsh-s4-resume-conversation-survives-restart.spec.js` are `@real-staging`-tagged | Both depend on currently-deployed staging state, cannot be verified pre-merge by design | Named as residual risk in `/verify-completion`'s report, matching this repo's own established `ep2-s3` precedent for handling `@real-staging` specs — never attempted locally against real staging |
