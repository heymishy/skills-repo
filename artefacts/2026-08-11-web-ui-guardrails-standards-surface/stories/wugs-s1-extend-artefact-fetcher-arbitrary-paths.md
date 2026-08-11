## Story: Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead viewing their product's guardrails/standards**,
I want **the platform to be able to read any file or folder from my connected repo, not just the fixed `artefacts/<slug>/<type>.md` path the existing fetcher supports**,
So that **the view can eventually show me `.github/architecture-guardrails.md` and the whole `standards/` folder, not just pipeline artefacts**.

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI (indirectly — this is a technical foundation story)
**How:** This story alone renders nothing new to a user; it unblocks `wugs-s2`, `wugs-s3`, and `wugs-s4`, which are the stories that actually move the metric. Labelled as a technical dependency per the story template's own guidance, kept as a full story (not folded into `wugs-s2`) because it is independently testable and touches a shared adapter other future stories will also depend on.

## Architecture Constraints

- **Reuse, don't duplicate (ADR-012):** `src/web-ui/adapters/artefact-fetcher.js`'s `fetchArtefact()` already implements the GitHub Contents API read path this story needs (base64 decode, `ArtefactNotFoundError`/`ArtefactFetchError` named error classes, `repoOverride` for per-tenant repo resolution). This story extends that module with a new exported function for arbitrary paths and folder listings — it does not create a second, parallel GitHub-API-calling module. Per ADR-012's own stated rule: "All artefact fetching goes through this module — no inline GitHub API calls in route handlers."
- **Injectable adapter rule (D37, CLAUDE.md):** The new function must follow the same injectable-adapter pattern as `pipeline-state-fetch-adapter.js` (`_pipelineStateFetchAdapter` / `setPipelineStateFetchAdapter`) — stub default throws (`'Adapter not wired: fetchRepoPath. Call setFetchRepoPath() with a real implementation before use.'`), not a silent empty return.
- **Folder listing is new behaviour** — the existing `fetchArtefact()` only fetches a single known file path and expects `data.content` (base64) in the response. The GitHub Contents API returns an **array** when given a directory path (e.g. `standards/`) instead of an object with `content` — the new function must branch on response shape (array vs single-file object), not assume `fetchArtefact`'s existing single-file shape applies to folder reads. Verify this against a real GitHub API response before trusting a test mock (CLAUDE.md's Mock-shape verification rule) — do not assume the folder-listing shape from documentation alone without a live check.

## Dependencies

- **Upstream:** None
- **Downstream:** `wugs-s2` (product-level view), `wugs-s3` (org-level view), `wugs-s4` (no-repo fallback) — all three consume this story's new function.

## Acceptance Criteria

**AC1:** Given a valid `owner/repo` and a file path (e.g. `.github/architecture-guardrails.md`), When the new fetch function is called with a real GitHub token, Then it returns the decoded file content as a string, matching `fetchArtefact`'s existing decode behaviour.

**AC2:** Given a valid `owner/repo` and a folder path (e.g. `standards/`), When the new fetch function is called, Then it returns an array of entries (name, path, type) for that folder — not a single decoded string.

**AC3:** Given a path that does not exist in the repo, When the new fetch function is called, Then it throws `ArtefactNotFoundError` (reusing the existing error class from `artefact-fetcher.js`, not a new duplicate class).

**AC4:** Given a GitHub API error unrelated to 404 (e.g. rate limit, 500), When the new fetch function is called, Then it throws `ArtefactFetchError` with the underlying error message preserved.

**AC5:** Given the module is required fresh with no adapter wired, When the new function is called before `setFetchRepoPath()` is invoked, Then it throws an explicit "Adapter not wired" error rather than returning empty/undefined.

**AC6:** Given `server.js`'s real wiring, When two different, distinguishable repo paths are fetched, Then two different, individually-correct pieces of content are returned — the wiring test asserts this observable, differentiating outcome, not merely that a setter was called (D37 requirement 4, per CLAUDE.md's stated `tir-s1` precedent).

## Out of Scope

- **Any change to `fetchArtefact()`'s existing single-file behaviour or its callers** (`export-data-source.js`, the in-app artefact viewer) — untouched, this story is purely additive.
- **Caching of fetched content** — per `decisions.md`'s ARCH entry #4, this feature reads live on each view; no caching layer.
- **Write/PR-creation capability** — read-only adapter work; Epic 2's scope.

## NFRs

- **Performance:** None specific to this story beyond GitHub API's own response time — no new performance target introduced.
- **Security:** The OAuth token is passed through exactly as `fetchArtefact` already does (Authorization header, never logged, never persisted) — no new token-handling surface.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** None — read-only, no state-changing action to log.

## Complexity Rating

**Rating:** 2 — builds on a proven pattern but the folder-listing response shape is a genuine new unknown requiring live verification.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — noted as a technical dependency explicitly, per template guidance for enabling stories
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium)
