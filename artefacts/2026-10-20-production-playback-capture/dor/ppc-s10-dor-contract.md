# Contract Proposal — ppc-s10: Repo-freshness wiring for capture serving + Playback Evidence nav link

**What will be built:**
1. `src/web-ui/adapters/repo-freshness.js`'s existing `ensureRepoFresh(repoRoot)` is called from three places it is not currently called from, all in `src/web-ui/routes/playback-evidence.js`: the top of `handleGetPlaybackEvidence` (before `_finaliseInProgressCaptures`/the `acs` array is built, line ~546-555), the top of `handleGetCaptureScreenshot` (before `fs.existsSync`, line ~610-624), and the top of `handleGetCaptureVideo` (before `fs.existsSync`, line ~636-650). `getRepoRoot` is already imported in this file (line 16); `ensureRepoFresh` needs a new `require('../adapters/repo-freshness')` import, mirroring `journey.js`'s own existing import/call shape exactly (`journey.js:5255`).
2. `src/web-ui/routes/journey.js`'s `handleGetJourneyStageView` (starts line 873) renders a "Playback evidence" link into the DoD stage artefact view, gated on `stageName === 'definition-of-done' && journey.productId`. Link target: `/products/${journey.productId}/playback-evidence/${journey.featureSlug}`. Exact insertion point (the final HTML assembly, downstream of the `artefactContent`/`stageLabel` variables already read at the top of this function) is left to the coding agent's own judgment during `/implementation-plan` — the condition and link target are fixed by this contract, the exact line is not.

**What will NOT be built:**
- No change to `commitArtefact`, `checkCaptureArtifact`, `downloadCaptureArtifact`, or the GitHub Actions worker — all already confirmed working correctly in production.
- No change to `ensureRepoFresh`'s own internals (TTL, `--ff-only` safety, error-swallowing).
- No fix to `/playback/:featureSlug`'s (`playback.js`) matching gap — same root cause, different page/audience, tracked separately as a Follow-up Action in `decisions.md` rather than silently bundled in here.
- No redesign of the "Set capture target" / "Capture evidence" two-button flow — a separate, already-logged UX finding.
- No new styling beyond a plain `<a>` tag — no new color values, so no DESIGN.md token work beyond confirming `scripts/check-design-tokens.js` passes clean (it will, since zero hex values are introduced).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1: `handleGetPlaybackEvidence` refreshes before reading | Unit — `require.cache`-substituted mock of `repo-freshness.js`, asserting call order (T1-T3) | unit |
| AC2: media routes refresh before reading | Unit — same mocking technique against `handleGetCaptureScreenshot`/`handleGetCaptureVideo` (T4-T6); integration test (T10) seeds a real temp git repo + bare remote to prove the actual pull makes a previously-404ing file serve 200 | unit + integration |
| AC3: Playback evidence link rendered on DoD stage view | Unit — call `handleGetJourneyStageView` with `productId` set and `stageName='definition-of-done'`, assert HTML contains the expected `href` (T7); negative case for a non-DoD stage (T8); integration test (T11) cross-checks the rendered path against the real route table in `server.js` | unit + integration |
| AC4: no link when `productId` is unset | Unit — same handler, `productId` unset, assert no `/playback-evidence/` href present (T9) | unit |

**Assumptions:**
- `journey.productId` and `journey.featureSlug` are both reliably populated by the time `handleGetJourneyStageView` renders (true for any journey reached via this route — both are read earlier in the same function for other purposes).
- The route `server.js` registers for `playback-evidence.js`'s GET handler matches the `/products/:productId/playback-evidence/:featureSlug` shape used throughout this session's live validation (confirmed directly against production).
- `ensureRepoFresh`'s existing 2-minute TTL and silent-failure behaviour are acceptable as-is for this story's purposes — a slightly stale read (within the TTL window) is an acceptable tradeoff against calling `git pull` on every single request, consistent with `rclr-s1`'s own original design intent.

**Estimated touch points:**
Files: `src/web-ui/routes/playback-evidence.js`, `src/web-ui/routes/journey.js`, `tests/check-ppc-s10-*.js` (new)
Services: none (no new external calls — reuses the existing `ensureRepoFresh` adapter as-is)
APIs: none new

---

# Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs in `test-plans/ppc-s10-test-plan.md`. No mismatches found: each AC maps to a specific, nameable code change and a specific test approach already described in the test plan's Unit/Integration sections.
