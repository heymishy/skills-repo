## Epic: A first-time visitor understands what governed AI delivery actually does before being asked to sign up

**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

A visitor arriving at `/` — typically via a warm referral, with only a vague understanding of how the platform works — sees four concrete, evidence-backed hero features (a real golden-trace demo, scope-contract enforcement, cryptographic instruction-set verification, and the self-improving harness) before reaching the existing sign-in panel, which is restyled to fit as the page's closing CTA rather than its only content. Each hero feature answers a specific objection a skeptical evaluator already has, using real, already-shipped evidence from this repo rather than marketing claims.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    SERVER[server.js]\n    ROUTE[routes/public.js\\nhandleRoot]\n    TEMPLATE[templates/landing.html]\n    POSTHOG[posthog-server.js]\n    SERVER -->|GET /| ROUTE\n    ROUTE -->|reads at module init| TEMPLATE\n    ROUTE -->|landing_page_viewed| POSTHOG\n    TEMPLATE -->|4 hero cards + swappable\\ngolden-trace demo content| TEMPLATE"}}---

## Out of Scope

- CMS integration, operator-editable content, or any content-management capability — copy and demo content are authored directly in the template, same as the existing landing page.
- Live, real-time querying of pipeline state or live LLM generation for the golden-trace demo — it is a curated, pre-baked snapshot.
- A/B testing of hero copy, layout, or the golden-trace demo candidate in production — the swappable-candidate mechanism is a pre-launch build-time comparison tool, not a live experiment.
- Any content beyond the single `/` route — no blog, docs, or additional marketing pages.
- New PostHog instrumentation beyond what already exists (`landing_page_viewed`, `cta_clicked`) — the time-on-page instrumentation this epic's Metric 2 depends on is explicitly a separate, later story, not part of this epic.
- Auth-panel mechanics (routes, providers, backend flow) — only its visual weight/positioning changes.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Signup conversion rate | Not yet pulled (to be pulled from existing PostHog data before implementation) | +20% relative | Four hero features answer the objections that currently cause a referred-but-unconvinced visitor to bounce before reaching the CTA |
| Time-on-page (unauthenticated) | Not yet established (depends on a separate instrumentation story) | +30% relative, once measurable | Real, concrete content (especially the golden-trace demo) gives visitors something worth engaging with beyond one paragraph |

## Stories in This Epic

- [ ] lphf-s1 — Golden trace demo (4-frame narrative, swappable candidate content)
- [ ] lphf-s2 — Scope-contract enforcement hero card
- [ ] lphf-s3 — Cryptographic instruction-set verification hero card
- [ ] lphf-s4 — Self-improving harness hero card
- [ ] lphf-s5 — Restyle the existing auth panel as the page's closing CTA

## Human Oversight Level

**Oversight:** Low
**Rationale:** Customer-facing but not PCI/regulated scope, no new backend surface, no live LLM calls, no auth mechanics changed. Bounded content/layout work with an already-clarified scope boundary.

## Complexity Rating

**Rating:** 2
**Rationale:** Individual stories are well-understood (complexity 1 each), but the epic carries one genuine ambiguity — which golden-trace candidate performs better — that isn't resolved until the swappable comparison is actually built and viewed.

## Scope Stability

**Stability:** Stable
