# DoR Contract: Dockerfile production stage actually copies artefacts/ and .github/ into the image

**Story reference:** artefacts/2026-09-05-docker-artefacts-copy-fix/stories/dcfx-s1-dockerfile-copy-artefacts-and-github.md
**Test plan:** artefacts/2026-09-05-docker-artefacts-copy-fix/test-plans/dcfx-s1-test-plan.md
**Date:** 2026-09-05

---

## Scope

**MUST touch:**
- `Dockerfile` (production stage only -- two new `COPY` lines)
- `tests/check-dcfx-s1-dockerfile-copies-artefacts-and-github.js` (new)

**MUST NOT touch:**
- `.dockerignore` -- already correctly fixed by `daga-s1`; confirmed by direct reading (this session, 2026-09-05) that the bare `artefacts/`/`.github/` exclusion lines are still absent and `.github/scripts/` is still excluded.
- `src/web-ui/adapters/pipeline-state-writer.js` -- `daga-s1`'s own `.git/`-presence safety check is unaffected; this story's own `COPY` lines never target `.git/`.
- `tests/check-daga-s1-dockerignore-and-writer-safety.js` -- regression guard (AC4), confirmed to have zero references to `Dockerfile` at all, so zero collision risk.
- Any workflow file (`staging-deploy.yml`, etc.) -- the `promote-to-prod` missing-version-stamp finding is explicitly out of scope per the story's own scope section.

## Assumptions verified before sign-off

1. **The Dockerfile's `production` stage genuinely has no `COPY` line for `artefacts/` or `.github/`** -- confirmed by reading the entire file today (2026-09-05), not assumed from `daga-s1`'s own prior (incomplete) investigation. This is the entire premise of this story; verified first, before writing anything else.
2. **`.dockerignore`'s own `.github/scripts/` exclusion is still present and needs no companion change** -- `.dockerignore` patterns apply to the whole build context regardless of which stage's `COPY` command later draws from it, so `COPY .github/ ./.github/` will correctly omit `.github/scripts/` without any extra carve-out. Confirmed by re-reading `.dockerignore`'s current state directly.
3. **The size/secret-content vetting `daga-s1`'s own DoR already performed for `artefacts/`/`.github/` (~38MB combined, spot-checked for secrets, all false positives) remains valid** -- this story does not re-do that vetting from scratch, since nothing about the content of those directories has changed since `daga-s1`'s own investigation; it only re-confirms the Dockerfile-level gap that vetting didn't cover.
4. **`--chown=node:node` is the correct, already-established convention** for every other `COPY` line in the production stage (`skills/`, `product/`, `version.json`, `learnings-count.json`, the llm-gateway fixtures) -- the two new lines must match it for consistency with the non-root-user constraint already documented in the Dockerfile's own comments (`USER node`).

## Risk

**Rating: 2** (mechanical two-line addition, but to a production-critical Dockerfile, correcting a previously-shipped story whose own claim was wrong -- the change itself is simple; the stakes of getting the placement/verification wrong are not).

**RISK-ACCEPT:** AC5 (does this actually fix the live page) cannot be verified without a real production deploy -- accepted via mandatory post-merge live-page re-check, using the exact authenticated procedure already validated once today (not a new, unproven method). Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Add the two `COPY --chown=node:node artefacts/ ./artefacts/` and `COPY --chown=node:node .github/ ./.github/` lines to the Dockerfile's `production` stage, after the existing `skills/`/`product/` copy lines.
2. Write `tests/check-dcfx-s1-dockerfile-copies-artefacts-and-github.js` covering T1-T4.
3. Run `tests/check-daga-s1-dockerignore-and-writer-safety.js` directly to confirm T5 passes unmodified.
4. Run the full suite (`npm test`) before considering the task complete.
5. TDD RED-state verification: stash the Dockerfile change, re-run the new test file, confirm it fails against pre-fix content, then restore.
6. After merge and real production promotion, perform T6 (the live-page re-check) personally, using an authenticated browser session -- this is the one test in this story that actually proves the fix works; do not skip it or treat it as optional.

## Proceed: Yes
