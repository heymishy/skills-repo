# Contract Proposal: Web UI rendering — first slice of initiative 1's visibility surface

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Date:** 2026-11-09

## What will be built

An extension to `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`) that fetches `workspace/incidents.json` via the existing `fetchRepoPath` adapter (`src/web-ui/adapters/artefact-fetcher.js`), parses the JSON array, and renders each incident record as a distinct item showing its status as a text label (MC-A11Y-02 — never colour alone) and, if present, its triage summary inline (no click-through). A missing `workspace/incidents.json` (`ArtefactNotFoundError`) degrades gracefully to zero incident items with no visible error, matching `urpv-s3`'s established pattern. All rendered content (status, tags, triage summary text) is HTML-escaped via `html-shell.js`'s `escHtml()` — never raw HTML.

## What will NOT be built

Rendering of short-track reactive-work tags or `decisions.md` RISK-ACCEPT/SCOPE entries (that is `urpv-s2`/`urpv-s3`). A load rollup or filter UI for incidents (`urpv-s4`'s pattern is not extended here). Any creation or editing of an incident record from the web UI — this is read-only rendering only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on the status-label render (text, not colour-alone); integration test on `_renderConsolidatedFeaturesSection` with a mocked `fetchRepoPath` resolving ≥2 records | unit + integration |
| AC2 | Unit test asserting triage summary renders inline, in the same block, no separate link/route | unit |
| AC3 | Integration test with mocked `fetchRepoPath` rejecting `ArtefactNotFoundError` — page renders normally, zero incident items, no thrown error | integration |
| AC4 | Integration test rendering the real migrated `tenant_admin_bootstrap_failed` fixture (with triage summary attached) end-to-end without error | integration |

## Assumptions

`fetchRepoPath` is reused exactly as `urpv-s3` already established — no new GitHub API code path. The fetch is scoped by the same per-product `repoOwner`/`repoName`/`accessToken` resolution already in place (ADR-025, multi-tenancy). Web UI fetch latency at scale is `[UNKNOWN BASELINE]` (flagged in `nfr-profile.md`, not solved speculatively here).

## Estimated touch points

Files: `src/web-ui/routes/products.js` (extend `_renderConsolidatedFeaturesSection`).
Services: GitHub Contents API (via the existing `fetchRepoPath` adapter — no new integration).
APIs: none new.

## Design-token compliance note (H-DESIGN)

`src/web-ui/routes/products.js` has ~40 pre-existing hardcoded, non-token color values unrelated to this story (confirmed via `node scripts/check-design-tokens.js`). This is RISK-ACCEPTed per the operator's decision, logged in full in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09) with a cross-reference in this feature's own `decisions.md` (2026-11-09). **This story's own new rendering code (the status label, the inline triage summary block) commits to using only real `DESIGN.md` tokens — no new hardcoded colors are introduced by this story's own changes.**
