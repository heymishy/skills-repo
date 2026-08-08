## Story: Restyle the existing auth panel as the page's closing CTA

**Epic reference:** epics/epic-1-landing-page-hero-features.md
**Discovery reference:** artefacts/2026-08-08-landing-page-hero-features/discovery.md
**Benefit-metric reference:** artefacts/2026-08-08-landing-page-hero-features/benefit-metric.md
**Domain:** [ui]

## User Story

As **any visitor who has now read through four hero features and reached the bottom of the page**,
I want **the sign-in panel to feel like the natural, proportionate next step in a page that already made its case**,
So that **the CTA doesn't read as a visually mismatched leftover from a much shorter page, undermining conversion at the final step (Metric 1 — signup conversion rate)**.

## Metric Linkage

**M1** (signup conversion rate): the CTA is the conversion event itself — if it feels disproportionate or out of place after the new hero content, it risks suppressing exactly the outcome the rest of this epic is trying to improve.

## Acceptance Criteria

**AC1:** Given the redesigned page with four hero cards above it, When the auth panel renders, Then its visual weight (size, spacing, prominence) is reduced relative to today's version, appropriate to being the page's closing CTA among several sections rather than the only content on the page.

**AC2:** Given the auth panel's existing mechanics, When a visitor clicks GitHub sign-in, Google sign-in, or submits the email sign-in/sign-up form, Then exactly the same routes and backend behaviour as today's panel are triggered — `/auth/github`, `/auth/google`, `/auth/email/login`, `/auth/email/signup` (all in `routes/auth.js`) are unchanged, this story is visual/layout only. [Fixed 2026-08-08 per review finding 1-M1 — original wording named `handleGetLinkSettings`, the wrong handler (that's the account-linking settings page, unrelated to landing-page auth).]

**AC3:** Given the page is viewed at 320px and 1280px widths, When the auth panel renders, Then it remains fully functional (all buttons tappable/clickable, form fields usable) and readable at both widths. [CSS-layout-dependent — classification deferred to `/definition-of-ready` per CLAUDE.md's B2 rule; this AC overlaps with the existing landing page's own AC5 from `lab-s1.2`, which already has a RISK-ACCEPT precedent to reference.]

## Out of Scope

- Adding or removing auth providers.
- Any change to auth backend logic, session handling, or the `/auth/*` routes themselves.
- Redesigning the email sign-in/sign-up form fields or validation — only the panel's surrounding visual weight/positioning changes.

## Architecture Constraints

- **Self-contained page identity preserved:** same as other stories in this epic — CSS changes extend `landing.html`'s existing self-contained `<style>` block.
- **`req.session.accessToken` canonical field** (CLAUDE.md): not touched by this story (no session-reading logic changes), but noted since this story is adjacent to the auth surface.
- **No credentials or sensitive content** (CLAUDE.md §Security) — unchanged from today's panel, which already satisfies this (no `accessToken` or session values rendered in HTML).

## NFRs

- **Performance:** Static content/CSS changes only, no new server-side logic.
- **Security:** No change to the existing "no `accessToken` in HTML" guarantee (`lab-s1.2` AC6) — this story does not touch the handler that enforces it.
- **Accessibility:** AC3's responsive requirement is CSS-layout-dependent — classification deferred to DoR per CLAUDE.md's mandatory rule.

## Complexity Rating

**Rating:** 1 — pure visual/layout restyle of existing, unchanged functionality.
**Scope stability:** Stable
