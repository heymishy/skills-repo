# Story: Dockerfile production stage actually copies artefacts/ and .github/ into the image

**Slug:** dcfx-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-05

---

## Problem

`daga-s1` (merged 2026-09-04, PR #828, DoD marked COMPLETE) removed the `artefacts/` and `.github/` blanket exclusion lines from `.dockerignore`, on the stated premise that this alone would make both directories available in the deployed production image. A live verification on production today (`skills-framework.fly.dev/features/2026-04-14-skills-platform-phase3`, real authenticated session) found this premise was wrong: the page still shows "No artefacts found for this feature", despite 165 real `.md` files existing locally under `artefacts/archived/2026-04-14-skills-platform-phase3/`.

Root cause, found by reading `Dockerfile` in full: the `production` build stage uses explicit, selective `COPY` commands, not a "copy everything the build context allows" pattern. It copies exactly `src/` (from the builder stage), `skills/`, `product/`, an optional `version.json`, an optional `learnings-count.json`, and `tests/e2e/fixtures/llm-gateway/`. **Neither `artefacts/` nor `.github/` has ever had a corresponding `COPY` line.** `.dockerignore` only governs what is available in the Docker build *context* for any stage's `COPY` commands to draw from -- it does not, by itself, put anything into the final image. `daga-s1`'s own fix was a necessary precondition (if the directories stayed `.dockerignore`-excluded, no `COPY` command could have picked them up at all) but not sufficient on its own, since the Dockerfile itself was never updated with the two missing `COPY` lines.

This means `daga-s1`'s own central claim -- that `aada-s1`'s archived-directory fallback and `fapg-s1`'s per-story accordion would now work in production -- was never actually true, despite its DoD being marked COMPLETE with (in hindsight) insufficiently rigorous real-world verification.

## As a / I want / So that

As the operator relying on this pipeline's own DoD process to mean what it says
I want the Dockerfile's production stage to actually copy `artefacts/` and `.github/` into the image, matching what `daga-s1` already established was safe to include (size and secret-content already vetted in that story's own DoR)
So that the archived-directory fallback and per-story accordion features that were supposedly already shipped actually work in production, and this pipeline's own artefact-serving/state-writing code has the real data it was written to read

## Acceptance Criteria

- **AC1:** `Dockerfile`'s `production` stage includes `COPY --chown=node:node artefacts/ ./artefacts/`, placed after the existing `skills/`/`product/` copy lines (matching their own established `--chown=node:node` convention).
- **AC2:** `Dockerfile`'s `production` stage includes `COPY --chown=node:node .github/ ./.github/`, same placement convention. `.dockerignore`'s own existing `.github/scripts/` exclusion (from `daga-s1`, AC2) already keeps that subpath out of the build context, so this COPY does not need any additional carve-out.
- **AC3 (regression guard):** `.git/` is never copied -- confirmed by inspection that `.dockerignore`'s own `.git/` exclusion (unrelated to and unaffected by this story) remains present, and that neither new `COPY` line targets it directly.
- **AC4 (regression guard):** The existing 5-AC test suite from `daga-s1` (`tests/check-daga-s1-dockerignore-and-writer-safety.js`) still passes unmodified -- this story only touches `Dockerfile`, not `.dockerignore` or `pipeline-state-writer.js`.
- **AC5 (real-world, RISK-ACCEPTed):** after merge and a real production promotion, the same live-page check performed today (`skills-framework.fly.dev/features/2026-04-14-skills-platform-phase3`, authenticated) shows real artefact content, not the empty state -- cannot be verified locally (no `docker build` available in this environment, same documented gap as `daga-s1`'s own test plan), only via a real deploy.

## Out of scope

- `promote-to-prod`'s own missing version-stamp step (a separate, real finding from the same investigation -- `GET /version` returns `{"sha":null,"shortSha":"dev",...}` because `write-version-file.js` only runs in the `deploy-staging` job, never in `promote-to-prod`). Tracked as a follow-up in this story's own DoD, not bundled here, since it is a different root cause (a missing CI step, not a missing Dockerfile COPY) with its own distinct fix and regression surface.
- Any change to `.dockerignore` itself -- already correctly fixed by `daga-s1`; this story only completes the other half of that story's own intent.
- Any change to `pipeline-state-writer.js`'s own `.git/`-presence safety check (`daga-s1`'s AC4/AC5) -- unaffected by this story, confirmed by AC3.

## Benefit linkage

Corrects a previously-shipped, DoD-marked-COMPLETE story whose central claim was not actually true in production -- directly closes the real gap `daga-s1` set out to close, for the two already-shipped features (`aada-s1`, `fapg-s1`) that have never actually worked since they merged. No formal benefit-metric artefact -- short-track story, consistent with every other short-track delivery this session.
