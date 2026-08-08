## Story: Golden trace demo — a real idea-to-shipped-code chain, walked in four frames

**Epic reference:** epics/epic-1-landing-page-hero-features.md
**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Domain:** [ui]

## User Story

As an **engineering/tech lead evaluating the platform for team adoption** (typically a warm referral, with only a vague understanding of how it works),
I want to **see a real, concrete example of a plain-English ask becoming shipped, working software through this pipeline**,
So that **I trust the governance mechanism is real rather than a claim, increasing the chance I click through to sign up (Metric 1 — signup conversion rate)**.

## Benefit Linkage

**M1** (Metric 1, benefit-metric.md — signup conversion rate): this is the signature/hero element of the redesign, specifically named in discovery as the demo most likely to convert a skeptical-but-referred visitor.

## Acceptance Criteria

**AC1:** Given the landing page is rendered, When the golden-trace hero section loads, Then it displays exactly 4 sequential frames — prompt, discovery.md snippet, DoR snippet, shipped feature — sourced from one real, already-shipped feature in this repo (not a fabricated example).

**AC2:** Given the build-time swappable-candidate mechanism, When a developer flips a config value between the two candidates (`interactive-kanban-boards`/`s3.1` and `code-shape-diagrams`/`csd-s2`), Then the rendered demo content changes to reflect the selected candidate's real content, with no other page behaviour affected.

**AC3:** Given the final candidate is locked before merge, When the PR is opened, Then the losing candidate's content has been deleted from the codebase entirely — no dead swappable-toggle mechanism, config flag, or unused content block ships to production.

**AC4:** Given the demo content is drawn from real repo artefacts, When each frame is inspected, Then its content matches the actual artefact file content (cosmetic truncation/formatting only) — no paraphrased or invented example content.

## Out of Scope

- Exact visual treatment or transition animation between the 4 frames — a design-execution detail, not this story's concern.
- Letting a visitor click through to the real GitHub repo/PR from this section — a reasonable follow-on, not required for MVP.
- Live regeneration of the demo from current repo state after launch — explicitly out of scope per discovery (static, curated snapshot only).
- Building the swappable-candidate comparison tooling as a reusable, general-purpose feature — it exists only to make this one decision, then one side is deleted (AC3).

## Architecture Constraints

- **Self-contained page identity preserved:** `templates/landing.html` has its own established, self-contained `<style>` block (dark theme, GitHub-style palette) — it does not use `html-shell.js`'s shared `DESIGN_SYSTEM_CSS` custom properties, and this story does not change that. New hero-section CSS extends the existing self-contained block, consistent with `lab-s1.2`'s original design. This is a deliberate scope boundary, not an oversight — see Decision note below.
- **No credentials or sensitive content** (CLAUDE.md §Security): confirmed via `/clarify` (2026-08-08) that both candidate folders contain nothing sensitive; re-verify at implementation time if the actual demo snapshot content differs from what was reviewed at discovery.
- **Artefact-first rule** (`.github/architecture-guardrails.md`): this story itself satisfies the requirement that any change to shared/public-facing content has a story artefact.

## NFRs

- **Performance:** Static, pre-baked content — no server-side computation or live query per page view.
- **Security:** No credentials, tokens, or PII in demo content (confirmed via discovery `/clarify`).
- **Accessibility:** All 4 frames must be reachable via keyboard navigation; frame transitions (if any) must not trap focus.
- **CSS-layout-dependent AC note:** none of this story's ACs require browser-rendered layout verification (AC1–AC4 are content/mechanism assertions, not visual-layout assertions) — no RISK-ACCEPT classification needed here (contrast with `lphf-s2`/`lphf-s5`, which do have a layout-dependent AC).

## Complexity Rating

**Rating:** 1 — well-understood, matches existing patterns (static content authored in the template, same as the rest of `landing.html`).
**Scope stability:** Stable
