# DoR Contract — CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Date:** 2026-10-19

---

**What will be built:**
- `authenticateStagingSession(baseUrl, secret)` in `scripts/playback-capture.js` — `GET ${baseUrl}/test/session` with header `x-e2e-test-endpoint-bypass: secret`, parses the `Set-Cookie` response, returns the session id. Reuses the existing route unchanged.
- A real CLI entrypoint (`require.main === module` block) — parses the feature-slug argument, checks `E2E_STAGING_AUTH_STUB_SECRET` is set (clear, named error if not), calls `authenticateStagingSession`, launches a real Playwright browser context with the session cookie set, navigates to one hand-picked AC's own URL, saves a real screenshot via the existing path convention.
- A path-construction helper reusing `captureAcScreenshots`'s own existing convention (`artefacts/[featureSlug]/playback/[storySlug]/screenshots/[acId].png`), called from this new site.

**What will NOT be built:**
- Generalised selector derivation from E2E specs — `rpca-s2`'s own scope. This story hardcodes one target AC/selector directly in code.
- Video capture — `rpca-s3`'s own scope.
- Any production auth-bypass mechanism — epic-level deferral, logged in `decisions.md`.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test against a local mock HTTP server standing in for `wuce-staging`'s own `GET /test/session`, proving request-construction/response-parsing logic; real-world claim covered by a manual scenario (🔴, RISK-ACCEPTed in `decisions.md`) | integration + manual |
| AC2 | Unit test on the path-construction helper (exact save-path string); real navigation/capture claim covered by the same manual scenario as AC1 | unit + manual |
| AC3 | Unit test — missing env var produces a clear, named error | unit |
| AC4 | Unit test — secret value never appears in captured console output across both success and failure paths | unit |

**Assumptions:**
- The operator (or a CI run with the secret configured) executes the manual scenario for AC1/AC2 — the coding agent does not retrieve or use the real secret itself.
- This story's own "one hand-picked AC" target uses a hardcoded selector directly in code, to be replaced by `rpca-s2`'s own generalised derivation in the next story — not a design decision this story needs to make reusable yet.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify)
- `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js` (new)

Services: None | APIs: None (reuses the existing `GET /test/session` route on `wuce-staging`)
