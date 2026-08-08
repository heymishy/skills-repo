## Story: Scope-contract enforcement hero card

**Epic reference:** epics/epic-1-landing-page-hero-features.md
**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Domain:** [ui]

## User Story

As an **individual developer with existing agentic-coding scars** (has watched an AI coding agent quietly touch files outside the agreed scope before),
I want to **see, concretely, how this platform prevents an agent from expanding its own mandate mid-story**,
So that **my strongest existing objection to agentic coding tools is addressed before I'm asked to sign up (Metric 1 — signup conversion rate)**.

## Benefit Linkage

**M1** (signup conversion rate): named in discovery as answering "how do I stop the agent from quietly doing more than I asked?" — the most visceral objection identified for the individual-developer persona.

## Acceptance Criteria

**AC1:** Given the landing page is rendered, When the scope-contract-enforcement hero card loads, Then it displays a headline, one supporting sentence, and a concrete visual example illustrating a locked file-touchpoint list being checked against a merged diff.

**AC2:** Given the hero card describes a real, already-implemented mechanism (the DoR scope contract + assurance gate), When the copy is reviewed, Then it names the actual mechanism in concrete terms — not a generic "safe AI" or "guardrails" marketing claim — consistent with `README.md`'s "Problems this solves" framing ("AI agents widen scope without a mandate").

**AC3:** Given the page is viewed at 320px and 1280px widths, When the hero card renders, Then its content remains fully readable without horizontal scrolling at both widths. [CSS-layout-dependent — classification (automated visual regression vs. RISK-ACCEPT + manual smoke test) deferred to `/definition-of-ready` per CLAUDE.md's B2 rule.]

## Out of Scope

- An interactive or live demonstration of the scope-contract mechanism itself — that is `lphf-s1`'s (golden trace) job, not this card's.
- Linking out to the actual assurance-gate source code or a technical deep-dive page.
- Explaining the full DoR/DoD pipeline in this card — one concrete example is sufficient; the full pipeline is out of scope for a hero card.

## Architecture Constraints

- **Self-contained page identity preserved:** same as `lphf-s1` — this card's CSS extends `landing.html`'s existing self-contained `<style>` block, not `html-shell.js`'s shared tokens. Checked against `.github/architecture-guardrails.md` — no applicable mandatory constraint or Active ADR is violated by this approach.
- **No credentials or sensitive content** (CLAUDE.md §Security, `architecture-guardrails.md` guardrail `MC-SEC-02`).

## NFRs

- **Performance:** Static content, no server-side computation.
- **Security:** No credentials, tokens, or PII.
- **Accessibility:** AC3's responsive requirement is CSS-layout-dependent — must be explicitly classified (automated visual regression test or RISK-ACCEPT + manual smoke test) at DoR, per CLAUDE.md's mandatory rule. Not classified here — that is DoR's job, not `/definition`'s.

## Complexity Rating

**Rating:** 1 — static content card, matches an established pattern (the existing landing page's value-prop paragraph).
**Scope stability:** Stable
