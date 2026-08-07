# Bootstrap an existing repo from a DoR-approved SaaS artefact — Implementation Plan

> **For agent execution:** Single-session /tdd per task (no subagent fan-out for this dispatch).

**Goal:** Let a consumer run `npx @heymishy/skills-repo@latest init . --from-saas <feature-slug>`, authenticate with a securely-prompted credential, and materialize a DoR-approved feature's artefact + pipeline-state entry from the hosted SaaS into their local repo — with a real export endpoint on the SaaS side, gated by a D37-compliant injectable adapter.
**Branch:** `feature/rb-s4-saas-connected-bootstrap`
**Worktree:** current session worktree (agent sandbox already isolated — no nested `git worktree add`, consistent with rb-s1/s2/s3)
**Test command:** `node tests/check-rb-s4-saas-connected-bootstrap.js`

---

## File map

```
Create:
  src/web-ui/adapters/export-data-source.js  — D37 adapter: real SaaS-side data access (artefact + pipeline-state), throw-on-unwired stub
  src/web-ui/routes/export.js                — GET /api/export/:slug route handler, calls the injectable adapter, maps errors to HTTP status
  cli/lib/credential-prompt.js               — masked, non-echoing stdin prompt for the SaaS credential (never env var, never CLI arg)
  cli/lib/saas-fetch.js                      — CLI-side fetch logic mirroring platform-fetch.js's "resolve source, copy/write content, log the fetch" shape, against the SaaS export endpoint
  tests/check-rb-s4-saas-connected-bootstrap.js — all AC1–AC5 tests from the test plan

Modify:
  src/web-ui/server.js   — register the export route; wire setExportDataSource(realExportDataSource) (separate task from the handler, per D37 rule 3)
  cli/lib/init.js         — accept opts.fromSaas / opts.saasBaseUrl; when set, call saas-fetch instead of (or in addition to) the fresh-repo path
  cli/bin/init.js         — parse `--from-saas <slug>` flag
```

---

## Task 1: Export data-source adapter (D37 stub + real implementation) — AC5

**Files:**
- Create: `src/web-ui/adapters/export-data-source.js`
- Test: `tests/check-rb-s4-saas-connected-bootstrap.js` (`stubExportDataSourceThrows_whenNotWired`, `wiredExportDataSource_returnsCorrectPayloadForCredential`, `twoDifferentFeaturesResolveToTwoDifferentCorrectPayloads`)

- [x] Step 1: Write failing tests asserting the unwired default throws the exact D37 message, and that (once a test double is wired) two distinct feature-slug fixtures resolve to two distinct, individually-correct payloads.
- [x] Step 2: Run — must fail (module doesn't exist yet).
- [x] Step 3: Implement `export-data-source.js`:
  - `_exportDataSource` default throws `Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.`
  - `setExportDataSource(fn)` / `getExportDataSource()` pair (mirrors `pipeline-state-fetch-adapter.js` and `repo-adapter.js` shape — same D37 convention already used twice in this codebase)
  - `realExportDataSource(slug, credential)`: fetches `.github/pipeline-state.json` via the same GitHub Contents API path as `pipeline-state-fetch-adapter.js`'s `realFetchPipelineState`, finds the feature by slug, finds the first story (flat or epic-nested) with `dorStatus === 'signed-off'`, resolves its `dorArtefact` path, and calls `fetchArtefact()` from `artefact-fetcher.js` **directly** (same function `handleArtefactRoute` calls) so AC4's "no divergent copy" is structurally guaranteed rather than asserted by convention.
  - Named errors: `ExportNotDorApprovedError`, `ExportNotFoundError`, `ExportAccessDeniedError`.
- [x] Step 4: Run — must pass.
- [x] Step 5: Commit — `feat(export): add D37 injectable export data-source adapter (rb-s4 AC5)`

---

## Task 2: Export route handler — AC4

**Files:**
- Create: `src/web-ui/routes/export.js`
- Test: `exportEndpointReturns200WithMatchingContent_forValidRequest`, `exportEndpointRejectsRequestForFeatureNotDorApproved`, `exportEndpointAuditLogsEachFetch`

- [x] Step 1: Write failing tests calling `handleExportRoute(req, res, slug)` with a mock `res` object, asserting status codes and audit log calls.
- [x] Step 2: Run — must fail.
- [x] Step 3: Implement `handleExportRoute`: reads `Authorization: Bearer <credential>` header (this is a machine credential, not a browser session — no `req.session` involved, unlike `artefact.js`), calls the currently-wired adapter, maps `ExportNotDorApprovedError` → 409, `ExportAccessDeniedError` → 403, `ExportNotFoundError` → 404, any other error → 502 (logged, never re-exposes the credential). On success, audit-logs `{ featureSlug, timestamp }` (never the credential) and returns 200 JSON `{ artefactContent, pipelineStateEntry }`.
- [x] Step 4: Run — must pass.
- [x] Step 5: Commit — `feat(export): add GET /api/export/:slug route handler (rb-s4 AC4)`

---

## Task 3: Wire into server.js — AC5 (production wiring half of D37)

**Files:**
- Modify: `src/web-ui/server.js`

- [x] Step 1: (No new failing test beyond Task 1/2's wiring test — behavioural correctness is already asserted against `realExportDataSource` directly, per D37 rule 4: a wiring-assignment-only test is insufficient, so the *real* proof point is that `realExportDataSource` itself is under test, not the `server.js` line.)
- [x] Step 2: n/a
- [x] Step 3: Add route dispatch for `GET /api/export/:slug` and call `setExportDataSource(realExportDataSource)` at startup, alongside the existing `setFetcher`/`setPipelineStateFetchAdapter` wiring calls.
- [x] Step 4: Run full suite — no regressions.
- [x] Step 5: Commit — `feat(export): wire real export data source into server.js (rb-s4 AC5)`

---

## Task 4: Credential prompt (never env var, never CLI arg, never logged) — AC1, Security NFR

**Files:**
- Create: `cli/lib/credential-prompt.js`
- Test: `cliPromptsForCredentialSecurely_neverViaEnvVar`, `credentialNeverLoggedOrWrittenToDisk`

- [x] Step 1: Write failing test asserting the module's exported prompt function is injectable/mockable in tests, and that `cli/lib/saas-fetch.js` never reads `process.env.SAAS_CREDENTIAL` (or any plain env var) and never accepts the credential as a positional CLI arg.
- [x] Step 2: Run — must fail.
- [x] Step 3: Implement `promptForCredential()` using Node's built-in `readline` in raw mode over `process.stdin`, masking each keystroke (no external npm dependency — consistent with `platform-fetch.js`'s zero-dependency style and `product/constraints.md` #12).
- [x] Step 4: Run — must pass.
- [x] Step 5: Commit — `feat(cli): add secure non-echoing credential prompt (rb-s4 AC1)`

---

## Task 5: CLI-side SaaS fetch logic — AC1, AC2, AC3

**Files:**
- Create: `cli/lib/saas-fetch.js`
- Test: `cliFetchesArtefactAndPipelineStateForValidCredential`, `fetchedContentWrittenToConventionalPaths`, `return403OnInvalidCredentialAccess_namesTheProblem`, `doesNotFallBackToFreshRepoBootstrapOn403`, `cliEndToEnd_fetchAndMaterializeAgainstMockedSaasApi`, `fetchAndMaterializeUnder15Seconds`

- [x] Step 1: Write failing tests with an injectable `fetchImpl` (mirrors this repo's `setFetcher`-style mock convention — mocked `fetch`, not a real network call) covering the 200 and 403 paths.
- [x] Step 2: Run — must fail.
- [x] Step 3: Implement `fetchFromSaas(targetDir, slug, credential, opts)` following `platform-fetch.js`'s exact shape: resolve source (SaaS base URL + `/api/export/:slug`, `opts.fetchImpl` injectable for tests) → on 200, write `artefactContent` to `artefacts/[slug]/...` and merge `pipelineStateEntry` into `.github/pipeline-state.json` → write a fetch-log entry to `workspace/saas-fetch-log.json` (mirrors `workspace/platform-fetch-log.json`). On non-200 (403 in particular), throw a named error with the SaaS's own message, write nothing, and leave the target directory untouched.
- [x] Step 4: Run — must pass.
- [x] Step 5: Commit — `feat(cli): add SaaS-connected fetch-and-materialize logic (rb-s4 AC1-AC3)`

---

## Task 6: Wire `--from-saas` into the CLI entry point — AC1, AC2

**Files:**
- Modify: `cli/bin/init.js`, `cli/lib/init.js`

- [x] Step 1: Write failing integration test invoking the CLI binary with `--from-saas` against a mocked SaaS endpoint (in-process require, not `execFileSync`, so the mock `fetchImpl`/credential-resolver can be injected).
- [x] Step 2: Run — must fail.
- [x] Step 3: `cli/bin/init.js` parses `--from-saas <slug>`; `runInit()` gains an `opts.fromSaas` branch: prompts for the credential, runs `fetchFromSaas`, still installs the full skill set + registry (rb-s2) and harness-agnostic instruction files (rb-s3) exactly as the fresh-repo path does, since `/branch-setup` needs both the skills **and** the fetched artefact/pipeline-state.
- [x] Step 4: Run full suite (rb-s1, rb-s2, rb-s3, rb-s4) — no regressions.
- [x] Step 5: Commit — `feat(cli): wire --from-saas into runInit() (rb-s4 AC1-AC2)`

---

## Self-review

- [x] Exact file paths, no placeholders
- [x] Complete code per task, not stubs
- [x] Failing test before implementation, every task
- [x] Expected output stated for every run command (test pass/fail)
- [x] Commit messages in imperative mood
- [x] No scope beyond the 5 ACs (no general-purpose public API, no rb-s5 outer-loop flag)
