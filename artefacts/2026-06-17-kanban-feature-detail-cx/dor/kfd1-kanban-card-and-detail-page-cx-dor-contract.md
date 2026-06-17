# DoR Contract: Kanban Card and Detail Page CX (kfd1)

**Story reference:** `artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md`
**Assessed by:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-17

---

## Contract Proposal

**What will be built:**

1. **`src/web-ui/views/kanban-view.js` — title truncation, tooltip, badge, ideation-lane fix:**
   - `featureCard(f)` updated: truncate `title` to 48 characters with `…` suffix; add `title="<full title>"` attribute to the card root element; add a `<span class="kb-artefact-badge">` showing `"N artefacts"` when `artefactCount > 0` or `"No artefacts yet"` when `artefactCount === 0`.
   - `LANES` discovery entry updated: `stages` array extended with `'ideation'` so ideation-stage features render in the Discovery lane.

2. **`.github/pipeline-state.json` — mojibake data correction:**
   - `name` fields for `2026-04-19-skills-platform-phase4-opus`, `2026-04-14-skills-platform-phase3`, and `2026-04-23-non-technical-channel` corrected from garbled double-encoded byte sequences (`ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â` etc.) to a real em dash (`—`).

3. **`src/web-ui/adapters/artefact-list.js` — new `listLocalArtefacts` export:**
   - New exported function `listLocalArtefacts(repoRoot, featureSlug)`: walks `<repoRoot>/artefacts/<featureSlug>/` recursively, returning a flat array of `{ path, type: 'file' }` for every `.md` file found in the directory tree. Returns `null` when the target directory does not exist (caller uses this to fall back to the GitHub API).

4. **`src/web-ui/routes/features.js` — artefact-count wiring + grouped detail page:**
   - `handleGetFeatures` board-view branch: for each feature, call `_listArtefacts(feature.slug, token)` and set `artefactCount` to the count of returned artefacts before passing to `renderKanban`.
   - `renderArtefactIndexHtml(artefacts, featureSlug)`: rewritten to group artefacts by `getLabel(a.type)` using `groupArtefactsByStage()` (from `plain-language-labels.js`), rendering each group as a `<div class="sw-card">` with a `<h2 class="sw-section-title">` heading and the existing `renderArtefactItem(a)` items inside. `renderArtefactItem()` itself is NOT modified.

5. **`src/web-ui/routes/artefact.js` — wrap all three response paths in `renderShell`:**
   - Success path: wrap `<div class="sw-doc">${html}</div>` in `renderShell({ title: ..., bodyContent: ..., user: req.session })`.
   - 404 path: wrap in `renderShell` while preserving the exact `'artefact not found'` lowercase substring (for `check-wuce2-read-render-artefact.js` T4.2).
   - 503 path: wrap in `renderShell` while preserving the exact `'Unable to load artefact'` substring (for `check-wuce2-read-render-artefact.js` T4.3).

6. **`src/web-ui/server.js` — local-first artefact listing:**
   - `setFetchArtefactDirectory` callback updated: before calling the GitHub Contents API, check whether `listLocalArtefacts(COPILOT_REPO_PATH, slug)` returns a non-null result; if yes, return that instead (matching the local-first pattern already used for pipeline-state).

7. **`src/web-ui/utils/html-shell.js` — CSS additions:**
   - Append new rules to `DESIGN_SYSTEM_CSS`: `.sw-doc table/th/td` prose styling; `.metadata-bar`/`.meta-*` legibility; `.artefact-list*` cleaned-up list styling; `.feature-detail__groups` grouping layout. All additive — no existing token changes.

**What will NOT be built:**

- Next-best-action determination and surfacing from the detail page — deferred to a separate future `/discovery` session per explicit operator instruction (2026-06-16).
- Triggering skill/pipeline actions from the Kanban board or detail page — same deferral.
- In-place markdown editing from the detail page — same deferral.
- Drag-and-drop stage transitions — unchanged from pmf.1's render-only constraint.
- Any change to the `/features` flat-list view (non-board) — unchanged.
- Changes to `renderArtefactItem()` (tested public contract per `check-wuce6-feature-navigation.js` T5.2).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1a-e: Title truncation + tooltip | `kanban-view.renderKanban()` with a >48-char title, assert span ≤49 chars + ellipsis + `title=` attribute | Unit (integration in test file) |
| AC1f-h: Mojibake fix | Read `.github/pipeline-state.json` from disk, assert no `Ã`/`â€` fragments, assert `—` present | Data-integrity (direct file read) |
| AC2a-c: Badge unit | `renderKanban()` with `artefactCount: 4` and `artefactCount: 0`, assert badge class + text | Unit |
| AC2d-f: Count wiring integration | Mock `setListArtefacts` + board-view `handleGetFeatures`, assert count text in rendered HTML | Integration |
| AC3a-h: Grouped detail page | `handleGetFeatureArtefacts()` with mocked artefacts, assert `class="sw-card"` + `class="sw-section-title"` as actual element attributes (not just CSS definitions) | Integration |
| AC4a-h: Shell-wrapped artefact page | `handleArtefactRoute()` mocked success + 404, assert `<!doctype html`, nav, `class="sw-doc"`, heading, error text | Integration |
| AC5a-b: Ideation lane | `LANES.find('discovery').stages.includes('ideation')` + `renderKanban()` with ideation feature, assert inside Discovery lane slice | Unit + integration |
| AC6a-g: Recursive listing | `listLocalArtefacts()` against temp fixture tree, assert all nested files included; missing dir returns null | Unit |

**Assumptions:**

- `COPILOT_REPO_PATH` env var (or its absence) is handled correctly by the existing server.js local-first pattern; `listLocalArtefacts` only needs to handle the "path exists" and "path missing" cases.
- `groupArtefactsByStage()` from `plain-language-labels.js` already groups by the label returned by `getLabel(a.type)` — this is confirmed by reading the file in prior investigation.
- The existing `check-wuce2-read-render-artefact.js` assertions require preserving exact lowercase substrings `'artefact not found'` and `'Unable to load artefact'` — confirmed by reading the test file.
- `renderArtefactItem()` must be called unchanged as the inner item renderer within the new grouping logic (confirmed by `check-wuce6-feature-navigation.js` T5.2 testing it directly).

**Estimated touch points:**

Files:
- `src/web-ui/views/kanban-view.js` (featureCard, LANES)
- `src/web-ui/adapters/artefact-list.js` (new listLocalArtefacts export)
- `src/web-ui/routes/features.js` (handleGetFeatures board branch, renderArtefactIndexHtml)
- `src/web-ui/routes/artefact.js` (renderShell wrapping)
- `src/web-ui/server.js` (setFetchArtefactDirectory local-first wiring)
- `src/web-ui/utils/html-shell.js` (DESIGN_SYSTEM_CSS additions)
- `.github/pipeline-state.json` (3 mojibake name corrections)
- `tests/check-kfd1-kanban-card-and-detail-page-cx.js` (NEW — already written)
- `package.json` (add new test to chain)

Services: None
APIs: No new external APIs; GitHub Contents API fallback preserved
