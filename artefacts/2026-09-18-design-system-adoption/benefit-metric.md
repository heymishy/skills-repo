## Benefit Metric: Design System Adoption

**Discovery reference:** artefacts/2026-09-18-design-system-adoption/discovery.md
**Date defined:** 2026-09-18
**Metric owner:** Hamish King — Founder/Operator
<!-- Solo-operator platform: no separate non-engineering role exists today. Noted explicitly rather than fabricating a role that doesn't exist. -->
**Reviewers:** Hamish King — Founder/Operator
<!-- Same constraint as above — no second reviewer currently exists on this platform. -->

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a standard product-value initiative — no hypothesis about tooling, process, or team capability is being tested. It aligns with the Commercialisation track (wuce SaaS beta path)'s own stated outcome: "wuce operates safely as a real product with paying, external teams — not just a solo-operator tool," at the exact point the platform's first 2 beta customers have onboarded.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Visual consistency across the 4 real screens

| Field | Value |
|-------|-------|
| **What we measure** | Whether the dashboard, landing page, skill-session chat, and artefact viewer render using `DESIGN.md`'s token values (color, typography, spacing) rather than the current inconsistent "Notion-calm" system |
| **Baseline** | 0 of 4 screens match `DESIGN.md`'s token values today — confirmed via code read: `html-shell.js`'s `DESIGN_SYSTEM_CSS` uses different hex values and different status-token names (`--green`/`--amber`/`--red` vs. `DESIGN.md`'s `--success`/`--warn`/`--danger`) |
| **Target** | 4 of 4 screens match `DESIGN.md`'s token values exactly, confirmed by a scripted check comparing rendered CSS custom-property values against the token table |
| **Minimum validation signal** | 2 of 4 screens converted and matching — if only 2 land, the initiative still delivered real, verifiable value even if the full 4-screen unit isn't complete in one pass |
| **Measurement method** | A scripted check (new, part of this initiative's own delivery) comparing the live `:root`/dark-mode CSS custom-property values in `html-shell.js` against `DESIGN.md`'s token table, run manually or in CI. Owner: Hamish King. Frequency: at merge of each contributing story, then spot-checked post-deployment. |
| **Feedback loop** | If the scripted check finds a mismatch post-merge, it is a regression — file a short-track fix story immediately, matching this repo's own standing DoD-triage pattern. If the full 4-screen target isn't reached in this initiative's own delivery window, the operator (Hamish King) decides whether to extend scope or close at the minimum-signal level and revisit later. |

### Metric 2: `design.system` DoR gate is real and enforced

| Field | Value |
|-------|-------|
| **What we measure** | Whether a story tagged `design.system` in `context.yml` genuinely fails `/definition-of-ready` sign-off when it bypasses the design system (hardcoded colors/fonts not in the token list, or a manual reviewer-judged structural violation) |
| **Baseline** | 0 — confirmed via code search that no `design.system` DoR-gate mechanism exists anywhere in `skills/definition-of-ready/SKILL.md` or elsewhere today |
| **Target** | A deliberately-noncompliant test story, tagged `design.system`, is genuinely blocked at DoR sign-off by the automated token-scan half of the hybrid check |
| **Minimum validation signal** | The automated token-scan half works and blocks correctly; the manual-reviewer-judgment half for structural/layout compliance can be process-only (a documented reviewer checklist) rather than automated, and still count as meeting this metric's intent |
| **Measurement method** | A real test that tags a deliberately-noncompliant test story and confirms DoR blocks it (this initiative's own delivery includes writing this test). Owner: Hamish King. Frequency: once at delivery, then re-run as part of this repo's own regression suite going forward. |
| **Feedback loop** | If the gate can be bypassed (false negative — a noncompliant story passes DoR), this is a governance defect — fix before this initiative is considered done, not deferred. If the gate over-blocks compliant stories (false positive), the operator tunes the token-scan rules. |

### Metric 3: Beta user feedback on visual quality

| Field | Value |
|-------|-------|
| **What we measure** | Direct feedback from the 2 onboarded beta users on the restyled product's visual quality and credibility as a modern SaaS product |
| **Baseline** | Not yet established. Will establish by asking both beta users for their impression of the current ("Notion-calm") visual design before the restyle ships, so there is a genuine before/after comparison rather than only a post-restyle read. |
| **Target** | Positive direct feedback from both beta users, with no unprompted negative comments about visual inconsistency or dated appearance |
| **Minimum validation signal** | No negative feedback volunteered by either beta user — silence or neutral feedback still counts as not-invalidated, since 2 users is too small a sample to expect enthusiastic unprompted praise |
| **Measurement method** | Direct, informal feedback (not a structured survey) — the operator asks both beta users directly after the restyle ships. Owner: Hamish King. Frequency: once, within 2 weeks of the restyle shipping to production. |
| **Feedback loop** | If either beta user volunteers negative feedback, the operator triages it directly — either a quick follow-up fix story, or a note that the feedback reflects a scope decision already made deliberately (e.g. an out-of-scope item) rather than a defect. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Visual consistency across the 4 real screens | TBD — populated at /definition | Gap (expected — stories not yet written) |
| `design.system` DoR gate is real and enforced | TBD — populated at /definition | Gap (expected — stories not yet written) |
| Beta user feedback on visual quality | TBD — populated at /definition | Gap (expected — stories not yet written) |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
