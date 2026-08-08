## Story: Self-improving harness hero card

**Epic reference:** epics/epic-1-landing-page-hero-features.md
**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Domain:** [ui]

## User Story

As an **individual developer or tech lead deciding whether this is a one-time tool install or a compounding investment**,
I want to **see quantified evidence that the harness improves itself from real delivery failures, gated by human review**,
So that **I trust it gets better with use rather than being static tooling I have to maintain myself (Metric 1 — signup conversion rate)**.

## Metric Linkage

**M1** (signup conversion rate): named in discovery as answering "does this get better, or is it static tooling I have to maintain myself?"

## Acceptance Criteria

**AC1:** Given the landing page is rendered, When the self-improving-harness hero card loads, Then it displays a headline, one supporting sentence, and a real, current-as-of-launch count of entries in `workspace/learnings.md` (246 as of 2026-08-08) — not a rounded or invented figure.

**AC2:** Given the count is a snapshot authored at build/deploy time (per discovery's "no CMS/editable content" boundary), When the card is reviewed, Then the copy does not imply the number is live-updating in real time — it is accurate as of the most recent content update, consistent with the rest of this page's static-content convention.

**AC3:** Given the hero card describes `/improve` and the improvement-agent, When the copy is reviewed, Then it names the human-review gate explicitly ("every proposed change is gated by human review") — not just the automation, since the human-gate is what distinguishes this from an unsupervised self-modifying system.

**AC4:** Given the page is viewed at 320px and 1280px widths, When the hero card renders, Then its content remains fully readable without horizontal scrolling at both widths. [CSS-layout-dependent — classification deferred to `/definition-of-ready` per CLAUDE.md's B2 rule.]

## Out of Scope

- Live-updating the learnings count after launch — a follow-on, not required for MVP (matches the "no CMS" boundary already agreed in discovery).
- Displaying improvement-agent-specific metrics (e.g. number of SKILL.md diffs accepted) — no reliable current count was found for this at discovery/definition time; only the `workspace/learnings.md` count is used, since it's a real, verified number.

## Architecture Constraints

- **Self-contained page identity preserved:** same as other hero cards in this epic.
- **No credentials or sensitive content** (CLAUDE.md §Security).

## NFRs

- **Performance:** Static content, no server-side computation.
- **Security:** No credentials, tokens, or PII.
- **Accessibility:** AC4's responsive requirement is CSS-layout-dependent — classification deferred to DoR per CLAUDE.md's mandatory rule.

## Complexity Rating

**Rating:** 1 — static content card.
**Scope stability:** Stable
