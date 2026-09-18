## Epic: Future Stories Cannot Silently Bypass the Design System

**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Benefit-metric reference:** artefacts/2026-09-18-design-system-adoption/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

`DESIGN.md` is registered as the platform's canonical, referenced design artefact (per `product/constraints.md` #8 — referenced via `context.yml`, never embedded in SKILL.md files). A story tagged `design.system` in `context.yml` genuinely fails `/definition-of-ready` sign-off if its implementation bypasses the design system — hardcoded colors/fonts not in the token list are caught by an automated scan; structural/layout compliance is judged manually by the DoR reviewer. This closes the exact gap the discovery's own investigation found: `constraints.md` #9 already claims this hard block exists platform-wide, but no enforcement mechanism was ever built.

## Out of Scope

- **Retroactively enforcing `design.system` DoR compliance on already-in-flight or already-shipped stories** — the hard block applies going forward only.
- **WCAG 2.1 AA accessibility enforcement as a new mechanism** — `constraints.md` #9 already establishes it as a platform-wide hard floor; this epic does not duplicate that enforcement, it only adds the design-token-compliance check.
- **A fully automated structural/layout compliance checker** — the hybrid model (confirmed at `/clarify`) uses manual reviewer judgment for structural compliance; building an automated layout-compliance scanner is out of scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| `design.system` DoR gate is real and enforced | 0 — mechanism does not exist today | A deliberately-noncompliant tagged test story genuinely fails DoR sign-off | This epic's single story builds the automated token-scan half of the hybrid check and wires it into `/definition-of-ready` |

## Stories in This Epic

- [ ] `design.system` context tag triggers a real DoR hard block — dsa-s5

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This is new governance/enforcement logic affecting every future story tagged `design.system` — a bug here (false negative letting noncompliant work through, or false positive blocking compliant work) has platform-wide blast radius across all future design-system work, not just this feature. Human review at PR is warranted.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the token-scan mechanism itself is new (no direct precedent in this codebase for a diff-scanning DoR check), though DoR's own existing hard-block patterns (H-GOV, etc.) provide a structural template to extend rather than invent from scratch. -->

## Scope Stability

**Stability:** Stable
