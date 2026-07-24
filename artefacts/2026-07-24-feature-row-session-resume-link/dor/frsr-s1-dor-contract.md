# Contract Proposal: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts

**What will be built:**
1. `journey-store.js`'s `completeStage()` extended to accept/record `sessionId` (sourced from `journey.activeSessionId` at call time, already in scope in `handlePostGateConfirm`) in each `completedStages` entry.
2. A small new lookup (e.g. in `features.js` or a shared module) resolving `featureSlug → journeyId → completedStages[]` (via the journey store's existing `featureSlug` field), used once per `/features/:slug` page render.
3. `renderArtefactIndexHtml`/`handleGetFeatureArtefacts` extended: for each artefact row whose stage has a resolvable `sessionId`, add a second "Resume conversation" link to `/skills/:skillName/sessions/:sessionId/chat`, alongside the existing "View" link.
4. `_renderPvcItemRow` (`products.js`) changed to wrap its card content in a real `<a href="/features/:slug">` link (or equivalent keyboard-activatable element).

**What will NOT be built:**
Any change to `handleGetChatHtml`'s own rendering/restore/eviction logic. Any new page beyond the existing `/features/:slug`. Wiring into the kanban board or org/tenant views.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: row renders as `<a>`; E2E: click/keyboard-activate navigates | Unit + E2E |
| AC2 | Unit: `completeStage()` records `sessionId` | Unit |
| AC3 | Integration: artefact-index page shows resume link when resolvable | Integration |
| AC4 | Integration: resume link reaches identical `handleGetChatHtml` output | Integration |
| AC5 | Integration: evicted session shows existing not-found message | Integration |

**Assumptions:**
`item.slug` (from `mergeFeatureSources`) and the real `artefacts/[slug]/` directory name are the same value — confirmed likely true since both derive from the same `feature_slug`/`featureSlug` field throughout this codebase, but the coding agent should verify this directly against real data before wiring the link, and document any mismatch found in `decisions.md`.

**Estimated touch points:**
Files: `src/web-ui/modules/journey-store.js` (`completeStage`), `src/web-ui/routes/features.js` (`renderArtefactIndexHtml`, `handleGetFeatureArtefacts`), `src/web-ui/routes/products.js` (`_renderPvcItemRow`), possibly a new small lookup module.
Services: journey store.
APIs: No new routes — enriches existing `/features/:slug` response.
