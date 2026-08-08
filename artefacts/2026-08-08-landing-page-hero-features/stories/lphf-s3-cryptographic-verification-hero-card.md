## Story: Cryptographic instruction-set verification hero card

**Epic reference:** epics/epic-1-landing-page-hero-features.md
**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Domain:** [ui]

## User Story

As an **engineering/tech lead with compliance or risk-review responsibility as part of team adoption**,
I want to **see that every governed action commits an independently recomputable hash of the exact instruction set that governed it**,
So that **I can trust the governance claim is provable, not just attested — before I'm asked to sign up (Metric 1 — signup conversion rate)**.

## Benefit Linkage

**M1** (signup conversion rate): named in discovery as answering "prove which standard was actually in context when this was written" — the compliance/risk-lead objection.

## Acceptance Criteria

**AC1:** Given the landing page is rendered, When the cryptographic-verification hero card loads, Then it displays a headline, one supporting sentence, and a concrete example (e.g. an illustrative hash value alongside the instruction-set file it corresponds to) grounded in the real mechanism described in `README.md`'s "Core principles" ("Governance by demonstration").

**AC2:** Given the hero card makes a provability claim, When the copy is reviewed, Then it contains the word "recomputable" or "independently verifiable," and does not contain "trust us" or an equivalent unfalsifiable claim — the specific, checkable distinction discovery identifies as this feature's value, not a generic security-marketing claim. [Fixed 2026-08-08 per review finding 1-M1 — original wording ("distinguishes X from Y") was interpretive, not independently checkable by two reviewers.]

**AC3:** Given the page is viewed at 320px and 1280px widths, When the hero card renders, Then its content remains fully readable without horizontal scrolling at both widths. [CSS-layout-dependent — classification deferred to `/definition-of-ready` per CLAUDE.md's B2 rule.]

## Out of Scope

- An interactive hash-verification tool a visitor can actually run — this card illustrates the mechanism, it does not let a visitor execute it.
- Explaining the cryptographic algorithm used — the claim is "recomputable and independent," not a cryptography education page.

## Architecture Constraints

- **Self-contained page identity preserved:** same as `lphf-s1`/`lphf-s2`. Checked against `.github/architecture-guardrails.md` — no applicable mandatory constraint or Active ADR is violated.
- **No credentials or sensitive content** (CLAUDE.md §Security, `architecture-guardrails.md` guardrail `MC-SEC-02`) — the illustrative hash example must be a real, non-sensitive value (e.g. an actual instruction-set hash from this repo's own trace history) or clearly marked illustrative, not a fabricated-looking placeholder that undermines the "provable, not claimed" pitch this card exists to make.

## NFRs

- **Performance:** Static content, no server-side computation.
- **Security:** No credentials, tokens, or PII.
- **Accessibility:** AC3's responsive requirement is CSS-layout-dependent — classification deferred to DoR per CLAUDE.md's mandatory rule.

## Complexity Rating

**Rating:** 1 — static content card.
**Scope stability:** Stable
