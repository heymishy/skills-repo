## Test Plan: Close the real-capture loop — fix the two gaps blocking any real feature from using the viewer, and prove it end to end

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s5-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-18
**Test runner:** `node scripts/run-all-tests.js` (unit/integration, confirmed from `package.json`'s own `test` script)

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner (`node scripts/run-all-tests.js`), no stack deviation.
**Test data strategy:** Option 6 — Mixed. AC1–AC3 use synthetic fixtures (consistent with every prior `fpd-*` test file this cycle). AC4 is different in kind: its own claim ("a real package is visible live on staging") is not falsifiable by any synthetic fixture — it requires a real DoD-complete feature, a real deploy, and a real authenticated browser session. See AC4's own row below and Coverage gaps.

---

## Note on Step 3a (E2E / browser-layout detection)

AC4 does not trigger any of the listed CSS-layout-dependent patterns (no drag-drop, no coordinate/`getBoundingClientRect` dependency, no stacking-context claim) — it is a **live-deployment-dependent** claim instead, the same category `fpd-s3`'s and `fpd-s4`'s own DoDs already handled via RISK-ACCEPT + live observation, not via Playwright. A Playwright spec cannot assert "this specific push actually triggered a real deploy to a real fly.io machine" — that requires watching the real CI run and the real deployed instance, which this repo's own established convention (`fpd-s3`'s `[PARTIALLY RESOLVED]` decisions.md entry) already treats as manual/live verification, not E2E. AC4 is handled as **Manual, 🔴** (real-deployment-dependent, same higher-quality-bar standard as a CSS-layout gap) rather than routed through the E2E tooling question.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `parseDodAcCoverage` also parses `## AC Verification` tables | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Screenshot/video paths namespaced by story — no cross-story collision | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | `staging-deploy.yml` still deploys for an `artefacts/*/playback/**`-only push | 1 test | — | — | — | External-dependency (GitHub Actions path-filter evaluation happens outside this repo's own test runner) | 🟡 |
| AC4 | Real capture, real deploy, real live-observed rendering | — | — | — | 1 scenario | Untestable-by-nature (the claim IS a real external deployment event) | 🔴 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in this repo's own test runner | Handling |
|-----|----|----------|---------------------------------------------------|---------|
| GitHub Actions' own `paths-ignore` negation-pattern evaluation | AC3 | External-dependency | GitHub's path-filter engine runs outside any process this repo's test suite can invoke — a YAML-content assertion proves the *pattern is present and correctly ordered*, not that GitHub actually evaluates it as intended | Unit test asserts the YAML's own `paths-ignore` array (pattern presence + order); AC4's own real push is the actual behavioural proof |
| Real deploy + real live-observed rendering | AC4 | Untestable-by-nature | The claim is inherently about a real external event (a real fly.io deploy, a real authenticated browser session) — no fixture or mock can stand in for "this actually happened" | Manual scenario in the verification script, 🔴, executed and recorded as live evidence during `/verify-completion` |

---

## Test Data Strategy

**Source:** Mixed — Synthetic for AC1–AC3, real DoD-complete feature data for AC4
**PCI/sensitivity in scope:** No
**Availability:** AC1–AC3 available now. AC4 needs a real feature with a compatible DoD (after AC1 ships, `2026-06-14-web-ui-pm-flow`'s own `pmf.3-dod.md` — already using the `## AC Verification` shape — becomes a qualifying real target with zero additional setup)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture markdown using the `## AC Verification` heading and `AC \| Verified by \| Result` columns | Synthetic | None | Modelled directly on `pmf.3-dod.md`'s own real shape |
| AC2 | Fixture fake-fs with two stories, each with its own `AC1.png`/`AC1.webm` | Synthetic | None | Deliberately uses the same `acId` across both stories to prove no collision |
| AC3 | The real `staging-deploy.yml` file itself | Real (this repo's own file) | None | Not a fixture — reads the actual workflow file |
| AC4 | `pmf.3-dod.md` (real, already on disk) + a real authenticated Chrome session | Real, seeded data | None | Screenshots only — see story's own Out of Scope for why video is excluded |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC3/AC4's own noted external-dependency and untestable-by-nature gaps above — both acknowledged, not silently skipped.

---

## Unit Tests

### AC1 (unit): `parseDodAcCoverage` parses an `## AC Verification` table into the same shape

- **Verifies:** AC1
- **Precondition:** Fixture markdown with a `## AC Verification` heading and `| AC | Verified by | Result |` columns, modelled on `pmf.3-dod.md`
- **Action:** Call `parseDodAcCoverage(fixtureMarkdown)`
- **Expected result:** Returns an array of `{acId, description, satisfied, evidence, verificationMethod, deviation}` objects — `acId`/`description` split from the `AC` cell exactly as today; `evidence` sourced from the `Verified by` cell; `satisfied` sourced from the `Result` cell; `verificationMethod`/`deviation` default to `''` (no equivalent column in this table shape)
- **Edge case:** No

### AC2 (unit): screenshot path is namespaced by story — two stories' own same-numbered AC resolve to different files

- **Verifies:** AC2
- **Precondition:** Fake-fs with `artefacts/f1/playback/<storySlugA>/screenshots/AC1.png` and `artefacts/f1/playback/<storySlugB>/screenshots/AC1.png` both present, with distinguishable fixture content references
- **Action:** Call `resolveScreenshotPathForAc(repoRoot, featureSlug, storySlugA, 'AC1', fsImpl)` and the same call with `storySlugB`
- **Expected result:** The two calls return two different, independent paths — neither overwrites or is overwritten by the other
- **Edge case:** No

### AC2 (unit): video path is namespaced by story — same collision check for `resolveVideoPathForAc`

- **Verifies:** AC2
- **Precondition:** Fake-fs with two stories, each with its own `video/` directory containing a single `.webm` (the single-combined-walkthrough fallback case)
- **Action:** Call `resolveVideoPathForAc` for both stories
- **Expected result:** Each story's own single-combined-video fallback resolves to that story's own file, not the other story's
- **Edge case:** Yes — this specifically exercises the fallback path (not just the per-AC-named-file path), since that's the branch most likely to silently collide

### AC3 (unit): `staging-deploy.yml`'s own `paths-ignore` carves out `artefacts/*/playback/**`

- **Verifies:** AC3
- **Precondition:** None — reads the real file
- **Action:** Read `.github/workflows/staging-deploy.yml`, parse the `on.push.paths-ignore` array
- **Expected result:** The array still contains `'artefacts/**'` (other artefact bookkeeping still skips deploy) AND contains `'!artefacts/*/playback/**'` positioned after it (GitHub Actions evaluates path-filter patterns in order; a later `!pattern` re-includes a previously-excluded path) — confirms the negation is present and correctly ordered, not just present anywhere in the list
- **Edge case:** No

---

## Integration Tests

### AC1 (integration): a story using the `## AC Verification` shape renders real rows on the review page, not the empty branch

- **Verifies:** AC1
- **Components involved:** `buildFeaturePlaybackStructure`, `buildArtefactTrace`, `parseDodAcCoverage`, `renderPlaybackReviewHtml`
- **Precondition:** Real fake-fs fixture: a feature with one story whose only DoD file uses `## AC Verification`
- **Action:** Call `buildFeaturePlaybackStructure` then `renderPlaybackReviewHtml` on the result
- **Expected result:** That story's own AC rows appear in the rendered HTML with their real `description`/`evidence` text — not `"No AC Coverage data available for this story yet."`

### AC2 (integration): `buildFeaturePlaybackStructure` attaches independent, non-colliding media to two stories sharing a feature

- **Verifies:** AC2
- **Components involved:** `buildFeaturePlaybackStructure`, `resolveAcMedia`
- **Precondition:** Fake-fs fixture: one feature, two stories, each with its own DoD table restarting AC numbering at AC1, each with its own real screenshot file at the new, story-namespaced path
- **Action:** Call `buildFeaturePlaybackStructure`
- **Expected result:** `structure.stories[0].acRows[0].media.screenshotPath` and `structure.stories[1].acRows[0].media.screenshotPath` are both non-null and point to two different files

---

## NFR Tests

None — confirmed with story owner. The story's own NFR section states no new NFR beyond what `fpd-s1`–`fpd-s4` already established; this story only widens an existing parser, adds a path segment, and narrows an existing CI trigger — no new performance, security, accessibility, or audit surface.

---

## Out of Scope for This Test Plan

- Real video/caption/transcript capture — story's own Out of Scope item 1; no test written for it in this plan
- Any assertion on a *different* feature's own DoD content changing — AC1 only widens what the parser accepts, it is never expected to rewrite any feature's files, so no test asserts on `git diff` of another feature's artefacts
- Load/performance testing of the media-serving route — unchanged by this story, already covered by `fpd-s4`'s own test suite

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| GitHub Actions' own evaluation of the `paths-ignore` negation pattern | Runs outside this repo's own process boundary — no local simulation can prove GitHub itself honors the pattern as documented | AC4's own real push against the real repo is the actual behavioural proof, executed and recorded during `/verify-completion` |
| Real-browser visual confirmation that AC4's screenshot actually renders inline (not just that the file exists on disk) | Needs a real authenticated Chrome session against the real deployed staging instance | Manual scenario 🔴 in the verification script, same standard this cycle has used for every other live-render claim |
