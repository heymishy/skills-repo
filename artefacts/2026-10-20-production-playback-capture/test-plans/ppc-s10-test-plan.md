# Test Plan: ppc-s10 — Repo-freshness wiring for capture serving + Playback Evidence nav link

**Track:** Short-track (bounded bug fix, found via live production validation of ppc-s9 — see `decisions.md`)
**Story reference:** N/A (short-track) — the ACs below are the bug reproduction steps + fix criteria, per `/workflow`'s short-track convention (same shape as `sob-s4-test-plan.md`'s own precedent in this repo).
**Test runner confirmed from `package.json`:** `node scripts/run-all-tests.js` (the `test` script) — all verification commands below use this, not an assumed framework.

## Bug reproduction (what was observed live in production, 2026-10-27)

1. Operator clicks "Capture evidence" on `/products/:productId/playback-evidence/:featureSlug`.
2. GitHub Actions workflow `ppc-capture-worker.yml` dispatches, exchanges its nonce, captures, and uploads a real artifact (confirmed: run `40467256540`, artifact `capture-result-13114e821191965a3fa571f34abf474c.zip`, 254064 bytes).
3. `_finaliseInProgressCaptures` (`src/web-ui/routes/playback-evidence.js`) downloads the artifact and commits the screenshot/video to GitHub via `commitArtefact` — confirmed via `gh api repos/.../contents/artefacts/.../screenshots/AC1.png` returning a real 83544-byte PNG on `master`.
4. Operator reloads the Playback Evidence page. The `<img>`/`<video>` tags 404 with `{"error":"not found"}` even though the file genuinely exists on GitHub `master`.
5. Root cause: `handleGetCaptureScreenshot`/`handleGetCaptureVideo` read `fs.existsSync`/`fs.readFileSync` directly off the Fly app's **local** git checkout (`getRepoRoot(req)`), which is never told to pull the commit `commitArtefact` just pushed. This repo already has exactly the mechanism for this — `ensureRepoFresh` (`src/web-ui/adapters/repo-freshness.js`, from `rclr-s1`) — but it is only ever invoked from `journey.js`'s `_readPipelineFeatures`. Confirmed by grep: zero references to `ensureRepoFresh`/`repo-freshness` anywhere in `playback-evidence.js`. Visiting `/journey` (which does call it) first and then re-checking the image URL still 404s, consistent with the serving routes never calling it regardless of any other page's refresh state.
6. Separately: there is no in-app link to `/products/:productId/playback-evidence/:featureSlug` anywhere in the product/journey UI — operators must hand-construct the URL. The nearest existing per-stage view (`handleGetJourneyStageView` in `journey.js`, reached by clicking a completed stage e.g. "definition-of-done") renders the raw DoD artefact content with no link onward to the capture-evidence page.

## Scope

1. **AC1 — `handleGetPlaybackEvidence` refreshes before reading.** Call `ensureRepoFresh(getRepoRoot(req))` at the top of `handleGetPlaybackEvidence` (`src/web-ui/routes/playback-evidence.js`), before `_finaliseInProgressCaptures`/the `acs` array is built, so a freshly-committed screenshot/video is reflected without an app redeploy or restart. Mirrors `journey.js`'s existing `_readPipelineFeatures` pattern — same adapter, same call shape, never throws.
2. **AC2 — media routes refresh before reading.** Call `ensureRepoFresh(getRepoRoot(req))` at the top of `handleGetCaptureScreenshot` and `handleGetCaptureVideo`, before their respective `fs.existsSync`/`fs.readFileSync` calls, so a direct `GET /screenshots/:acId` or `GET /video/:acId` (e.g. the `<img src>`/`<video src>` the browser issues) never 404s on a stale local checkout even when the HTML page itself wasn't the thing that triggered a refresh.
3. **AC3 — "Playback evidence" link on the DoD stage view.** In `handleGetJourneyStageView` (`src/web-ui/routes/journey.js`), when `stageName === 'definition-of-done'` and `journey.productId` is set, render a visible link to `/products/${journey.productId}/playback-evidence/${journey.featureSlug}` alongside the rendered DoD artefact content, so an operator no longer has to hand-construct the URL.
4. **AC4 — no dead link when there's no connected product.** Same view, when `journey.productId` is not set (no connected product for this feature), the "Playback evidence" link from AC3 is not rendered — avoids linking to a page that would itself 403/404 (`playback-evidence.js`'s own existing AC7 tenant-isolation gate).

## Out of Scope

- Any change to `commitArtefact`, `checkCaptureArtifact`, `downloadCaptureArtifact`, or the GitHub Actions worker itself — all confirmed working correctly in production (see Bug reproduction, steps 2-3).
- Any change to `ensureRepoFresh`'s own internals (TTL, `--ff-only` safety, error-swallowing) — reused as-is, already covered by `check-rclr-s1-repo-freshness.js`.
- The existing `/playback/:featureSlug` read-only walkthrough viewer (`src/web-ui/routes/playback.js`, from the `fpd-*` feature) — it has the same "no `ensureRepoFresh` call" gap (confirmed by the same grep method) but is a separate page serving a separate audience; out of scope for this story. Flagged as a Follow-up Action in `decisions.md`, not silently left unaddressed.
- Any UI/UX redesign of the "Set capture target" / "Capture evidence" two-button flow the Platform Owner flagged as unclear in this session — logged separately in `decisions.md`, not part of this fix.

## Test Data Strategy

**Synthetic — generated in test setup, no real data involved.** Consistent with every other `ppc-s*` test file (`check-ppc-s9-*.js`) and `check-rclr-s1-repo-freshness.js`'s own precedent: `ensureRepoFresh` is mocked via `require.cache` substitution (same technique `check-rclr-s1-repo-freshness.js` T7/T8 already use against `journey.js`), never a real `git pull` or real GitHub API call. No PCI/sensitivity constraints — this is pipeline-tooling UI code with no payment or personal data in scope.

## Unit tests

| Test | Covers | Precondition | Action | Expected result | Edge case |
|---|---|---|---|---|---|
| T1: `handleGetPlaybackEvidence calls ensureRepoFresh before building the acs array` | AC1 | `repo-freshness` module mocked via `require.cache`, records call order | Call `handleGetPlaybackEvidence` with a journey that has `captureScreenshots.AC1` set | `ensureRepoFresh` was called, and called with `getRepoRoot(req)`'s return value, before any `fs.readFileSync`/response is produced | — |
| T2: `ensureRepoFresh is called even when journey.captureInProgress is empty` | AC1 | No in-progress captures | Call `handleGetPlaybackEvidence` | `ensureRepoFresh` still called (not gated behind `_finaliseInProgressCaptures` having work to do) | Edge: empty-state page load |
| T3: `a throw from ensureRepoFresh does not block the page render` | AC1 | Mocked `ensureRepoFresh` throws | Call `handleGetPlaybackEvidence` | Handler completes normally, 200 response, same as `_readPipelineFeatures`'s own existing swallow-and-continue behaviour | Edge case — adapter failure |
| T4: `handleGetCaptureScreenshot calls ensureRepoFresh before fs.existsSync` | AC2 | Mocked `repo-freshness` + mocked `fs` | `GET /screenshots/AC1` for a journey with `captureScreenshots.AC1` set | `ensureRepoFresh` called before `fs.existsSync` is called on the resolved path | — |
| T5: `handleGetCaptureVideo calls ensureRepoFresh before fs.existsSync` | AC2 | Same as T4, video route | `GET /video/AC1` | Same ordering assertion as T4, for the video handler | — |
| T6: `a throw from ensureRepoFresh does not block screenshot serving` | AC2 | Mocked `ensureRepoFresh` throws | `GET /screenshots/AC1` with the real file present on disk | 200, image bytes returned unchanged | Edge case — adapter failure must never turn a working request into a 500 |
| T7: `the DoD stage view renders a Playback evidence link when productId is set` | AC3 | `journey.productId = 'prod-123'`, `stageName = 'definition-of-done'`, DoD artefact content present | Call `handleGetJourneyStageView` | Response HTML contains an `<a>` with `href="/products/prod-123/playback-evidence/<featureSlug>"` and visible text identifying it as the playback/capture-evidence link | — |
| T8: `no Playback evidence link is rendered for a non-DoD stage` | AC3 (negative) | `stageName = 'discovery'` | Call `handleGetJourneyStageView` | Response HTML contains no `/playback-evidence/` href | Edge case — link must not leak onto unrelated stage views |
| T9: `no Playback evidence link is rendered when journey.productId is unset` | AC4 | `journey.productId = null \| undefined`, `stageName = 'definition-of-done'` | Call `handleGetJourneyStageView` | Response HTML contains no `/playback-evidence/` href | — |

## Integration tests

| Test | Covers | Seam |
|---|---|---|
| T10: `end-to-end: a freshly-committed screenshot becomes visible on next page load without a restart` | AC1, AC2 | `playback-evidence.js` → `repo-freshness.js` → disk read. Seeds a temp repoRoot with a `.git` dir and a committed screenshot added to a *bare remote* (not the local checkout) after the local checkout is created, mocks `exec` to simulate a real `git pull --ff-only` bringing the new file into the local working tree, then asserts `GET /screenshots/:acId` now returns 200 where it previously returned 404. This is the exact handoff that failed in production — covering it at the adapter-wiring level (not just "was `ensureRepoFresh` called") per CLAUDE.md's D37 rule-4 standard for behavioural correctness, not just reference/call assertion. |
| T11: `journey stage view → playback-evidence route: the rendered link resolves to a real, reachable route` | AC3 | `journey.js` render output → `server.js` route table. Asserts the exact path pattern rendered by T7 matches the route `server.js` actually registers for `playback-evidence.js`'s GET handler (string-match against the route table, not a live HTTP call) — prevents a link that LGTMs in review but 404s because the path shape drifted from the real route. |

## NFR tests

None — confirmed. This story touches no new NFR surface: `ensureRepoFresh` keeps its existing NFR characteristics (5s exec timeout, `--ff-only` safety, 2-minute TTL, never throws) unchanged; the nav-link addition is plain server-rendered HTML with no new NFR claim.

## Gap table

| AC | Gap type | Handling | Justification |
|---|---|---|---|
| None | — | — | No CSS-layout-dependent, drag-drop, or coordinate-based behaviour in this story's scope (AC1/AC2 are backend data-freshness fixes; AC3/AC4 are a plain anchor-tag link addition, verifiable by DOM/string assertion, not rendered layout) — Step 3a's trigger patterns were checked against all 4 ACs and none matched. |

**Test data gap:** None. All test data is synthetic/mocked per the strategy above.
