## Benefit Metric: E2E Core Journey Coverage on Staging

**Discovery reference:** artefacts/2026-07-23-e2e-core-journey-coverage/discovery.md (Approved — Hamish King, Founder/Operator, 2026-07-23)
**Date defined:** 2026-07-23
**Metric owner:** Hamish King — Founder/Operator (solo-operator repo; no separate non-engineering role exists yet)
**Reviewers:** Hamish King — Founder/Operator

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a standard engineering-quality initiative closing a known CI coverage gap, not a hypothesis test about a new tool, process, or team capability. Product context files (`product/mission.md`, `product/roadmap.md`) describe the skills-platform framework itself rather than the wuce web-app product this feature tests; no direct roadmap horizon maps to this item, but it is directly justified by this session's own evidence (three real regressions reaching production undetected) rather than roadmap alignment, so no misalignment flag is raised.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: E2E CI gate on core signup/billing/creation journeys

| Field | Value |
|-------|-------|
| **What we measure** | Whether Scenario A (GitHub-OAuth-or-email signup → Stripe test-mode plan selection → product creation → first feature via rough-idea/`/ideate` → canvas renders/updates → artefacts saved → close/resume mid-SSE) and Scenario B (formed-idea → `/discovery`→…→DoR → `/definition` story-map canvas → close/resume mid-SSE) pass automatically in CI on every PR, running through real browser DOM against real deployed `wuce-staging` — and whether a failure blocks merge. |
| **Baseline** | 0 of these 2 journeys covered today. E2E is gated off entirely in CI (`audit.e2e_tests` absent from `.github/context.yml`), and even when run manually, `playwright.config.js` only ever exercises a local mocked harness — never real staging, real GitHub OAuth, or real Stripe. Confirmed by direct inspection of `.github/workflows/e2e.yml`, `.github/context.yml`, and `playwright.config.js`. |
| **Target** | Both Scenario A and Scenario B pass in CI on every PR against real `wuce-staging`, and a failure blocks merge (not merely visible/non-fatal as today). |
| **Minimum validation signal** | At least Scenario A runs in CI and blocks merge — it alone covers 2 of this session's 3 real regressions (OAuth callback forbidden, SSE session-state dropped on resume). Scenario B (outer-loop/story-map) may land one iteration later without the initiative being considered failed. |
| **Measurement method** | CI run status on the E2E workflow (pass/fail per PR), plus a documented spec → journey-step coverage mapping (which real user-facing step each assertion proves) maintained alongside the spec files. Reviewed by Hamish King (sole reviewer) at each PR, and auditable via `/trace`. |
| **Feedback loop** | If, after implementation, CI still doesn't block merge on failure (e.g. `continue-on-error` left in place) or a scenario is consistently flaky against real staging, Hamish King decides whether to: (a) fix the flake source before enabling blocking, (b) narrow the scenario's assertions, or (c) accept Scenario A only as the permanent minimum bar and re-scope Scenario B as a separate follow-on story. |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — meta-benefit flag is No. No hypothesis about tooling/process/capability is being tested here; this is closing a known, evidenced gap.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — E2E CI gate on core signup/billing/creation journeys | A1, A2, A3, A4, A5 (minimum validation signal), B1, B2 (target — both scenarios blocking); B3 protects the gate's long-term reliability (indirect) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
