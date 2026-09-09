# Test Plan: sob-s4 — journey.js DRY completion + sw-pill--neutral tone

**Track:** Short-track (bounded refactor + small visual polish, both explicitly tracked follow-ups from sob-s2/sob-s3's own DoDs)
**Story reference:** N/A (short-track) — completes work assigned to sob-s3 in `decisions.md`'s "Deferred: extract `_sobLabelMap`/`_sobGlyphMap`..." decision, plus sob-s1's final reviewer's tone-modifier suggestion (`sob-s1-dod.md` follow-up #3)

## Scope

1. **DRY completion:** `journey.js`'s `_renderJourneyHome` still has its own inline `_sobLabelMap`/`_sobGlyphMap` copy, predating `features.js`'s now-merged `sessionOriginBadgeMeta` helper (only `products.js` and `kanban-view.js` were converted, by sob-s3). Swap it to use the shared helper — pure refactor, byte-identical output.
2. **Tone modifier:** All 3 session-origin badge call sites (`products.js`, `journey.js`, `kanban-view.js`) render `class="sw-pill sw-pill--nodot"` with no tone modifier. The base `.sw-pill` rule (`html-shell.js`) sets no background/color — only a tone modifier class (e.g. `sw-pill--neutral`, used elsewhere for "Not linked"/"In progress" states) actually paints the pill's background. Add `sw-pill--neutral` to all 3 call sites, matching this codebase's own established convention (confirmed via `features.js`'s `sw-pill sw-pill--nodot sw-pill--neutral` pattern).

## Out of Scope

- Any change to the tri-state derivation logic (`deriveSessionOrigin`) — unchanged.
- Any change to which glyph/label maps to which state — unchanged, only the CSS class list gains one token.

## Tests

- **T1 (regression):** `check-sob-s1-product-list-integration.js` and `check-sob-s1-session-origin-derivation.js` still pass unchanged (8/8, 6/6) — the DRY refactor and class addition must not change any assertion already covering these paths.
- **T2 (regression):** `check-sob-s2-journey-dashboard-integration.js` still passes unchanged (9/9) — journey.js's refactor must be behaviourally invisible to its own existing tests.
- **T3 (regression):** `check-sob-s3-org-kanban-integration.js` still passes unchanged (7/7).
- **T4 (new):** Add one assertion per call site (or a shared helper test) confirming the rendered badge's `class` attribute includes `sw-pill--neutral` alongside `sw-pill` and `sw-pill--nodot` — this is the one genuinely new, currently-uncovered behaviour this change introduces.

**NFR — CSS/visual (per CLAUDE.md's B2 rule):** This AC (T4) is layout-adjacent (a CSS class addition affecting visual background colour) but is fully verifiable via a DOM `class` attribute assertion, not actual pixel rendering — classified as **automated, not requiring Playwright visual regression**. A live visual smoke-check on `wuce-staging` post-merge is planned anyway (this session has direct Chrome browser access and just completed an equivalent walkthrough for the parent feature) — logged here as a RISK-ACCEPT-adjacent note, not a gap, since the check is genuinely available and will be executed.
