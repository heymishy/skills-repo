## Definition of Ready: avpf-s1 — Fall back to Postgres-durable content when the artefact viewer's GitHub fetch 404s

**Story:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/stories/avpf-s1-postgres-fallback-for-artefact-viewer.md
**Review artefact:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/review/avpf-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-artefact-viewer-postgres-fallback/test-plans/avpf-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/artefact.js` — add a `setJourneyStore` injectable (mirroring the existing `setFetcher`/`setLogger` pattern in this same file), and extend the `ArtefactNotFoundError` catch branch with the Postgres fallback + tenant check described below.
- `tests/check-avpf-s1-postgres-fallback.js` (new) — 5 integration tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/adapters/artefact-fetcher.js` — no change; GitHub fetch behaviour is unchanged, only the caller's handling of its `ArtefactNotFoundError` changes.
- `src/web-ui/modules/journey-store.js`, `src/web-ui/adapters/journey-store-pg.js` — `getJourneyByFeatureSlug` and `getArtefactsForJourney` already exist and already do exactly what this story needs; no change to either.
- `src/web-ui/routes/journey.js` — the resume-flow code path is explicitly out of scope per the story's Out of Scope section.

### Architecture Constraints

- **ADR-025 (multi-tenancy):** the Postgres fallback must apply the same tenant check `handleDeleteJourney` already uses (`journey.js` ~line 505): a journey whose `tenantId` is set and differs from `req.session.tenantId` is treated identically to "no journey found" — never served.
- **`mtrr-s1` precedent:** this is the same class of cross-tenant artefact-read defect that story fixed for `export-data-source.js`; do not reintroduce it via a new, unchecked code path.
- No other guardrail or ADR is implicated — this extends an existing, already-approved fallback pattern (`alrf-s4`) to a second call site.

### Human oversight

**Low** — bounded, single-file fix (plus one new test file) with the highest-risk element (tenant scoping) already identified and given a named, existing pattern to copy exactly. No sign-off required beyond this DoR artefact.

### Coding Agent Instructions

1. In `src/web-ui/routes/artefact.js`, add the injectable and import:
   ```javascript
   const _journeyStoreDefault = require('../modules/journey-store');
   let _journeyStore = _journeyStoreDefault;

   /** Replace the journey store (for testing). */
   function setJourneyStore(store) { _journeyStore = store; }
   ```
   Export `setJourneyStore` alongside the existing `setFetcher`/`setLogger` in `module.exports`.

2. In `handleArtefactRoute`'s `catch (err)` block, inside the existing `if (err.name === 'ArtefactNotFoundError')` branch, attempt the fallback **before** rendering the 404 page:
   ```javascript
   if (err.name === 'ArtefactNotFoundError') {
     let fallbackContent = null;
     try {
       const journey = _journeyStore.getJourneyByFeatureSlug(slug);
       const tenantId = req.session.tenantId;
       if (journey && !(journey.tenantId && journey.tenantId !== tenantId)) {
         const pgArtefacts = await _journeyStore.getArtefactsForJourney(journey.journeyId);
         const match = (pgArtefacts || []).find((a) => a.skill_name === artefactType);
         if (match && match.content) fallbackContent = match.content;
       }
     } catch (_fallbackErr) {
       fallbackContent = null; // AC4: best-effort -- any failure here falls through to the existing 404 page
     }

     if (fallbackContent) {
       const meta = extractMetadata(fallbackContent);
       const html = renderArtefactToHTML(fallbackContent, meta);
       _logger.info('artefact_read', {
         userId:       req.session.userId,
         featureSlug:  slug,
         artefactType,
         source:       'postgres-fallback',
         timestamp:    new Date().toISOString()
       });
       const bodyContent = `<div class="sw-doc">${html}</div>`;
       const page = renderShell({
         title:       `${shellEscHtml(artefactType)} — ${shellEscHtml(slug)}`,
         bodyContent,
         user:        { login: req.session.login || '' }
       });
       res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
       res.end(page);
       return;
     }

     // Existing 404 page — unchanged, reached only when the fallback found nothing (or was blocked by the tenant check)
     const page = renderShell({
       title:       'Artefact Not Found',
       bodyContent: '<p>artefact not found</p>',
       user:        { login: (req.session && req.session.login) || '' }
     });
     res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
     res.end(page);
   } else {
     // ... existing ArtefactFetchError / unexpected-error branch, unchanged
   }
   ```

3. Write the 5 new integration tests in `tests/check-avpf-s1-postgres-fallback.js` per the test plan, using a fake `journeyStore` double (plain object with `getJourneyByFeatureSlug`/`getArtefactsForJourney` functions) injected via `setJourneyStore`, following the exact `mockReq`/`mockRes` conventions already established in `tests/check-wuce2-read-render-artefact.js`.

4. Re-run `tests/check-wuce2-read-render-artefact.js` unchanged — all 18 existing tests must still pass (regression guard for AC2/AC3).

5. Follow TDD: write each failing test first, confirm RED, then implement, confirm GREEN — do not write the implementation before its test.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — this fix has no layout-dependent AC)

**PROCEED: Yes**
