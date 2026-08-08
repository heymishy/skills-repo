## Story: Compute the learnings count at build/deploy time instead of reading a file absent from the deployed image

**Epic reference:** None — short-track (bounded follow-up, DoD-flagged gap)
**Discovery reference:** None — short-track skips discovery; scope is the DoD-confirmed gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui, deploy]

## User Story

As a **visitor to the public landing page**,
I want **the "learnings captured" hero card to show a real, accurate number**,
So that **the platform's own trust-building claim (real evidence, not marketing copy) is actually true when I see it, not silently wrong**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found during `/definition-of-done` for `lphf-s4` (2026-08-09): a live check against `https://wuce-staging.fly.dev/` shows the hero card rendering **"0 and counting"**, not a real count.

**How:** Direct investigation (already completed during the `lccf-s1` incident this same session) confirmed the root cause: `src/web-ui/content/learnings-count.js`'s `getLearningsCount()` reads `workspace/learnings.md` via `fs.readFileSync` at module-load time, but `Dockerfile` only ever copies `src/` into both the builder and production images — `workspace/` (a repo-management directory containing pipeline bookkeeping, not application code) is never part of the deployed artifact, in any environment, by design. `lccf-s1` (PR #688) correctly wrapped this read in a try/catch to stop the resulting crash from taking down the whole server, with an explicit fallback of `0` — the right emergency fix, but never intended as the permanent answer to "what number does this card show," and its own DoD said so directly. This story is that permanent answer.

## Architecture Constraints

- **`workspace/` must not be added to the deployed Docker image.** `lccf-s1`'s own story explicitly ruled this out (`workspace/` contains dev/pipeline-management content with no reason to ship inside the production application bundle), and this story does not revisit that decision — the fix is to stop depending on that file being present at runtime in production, not to make it present.
- **`lccf-s1`'s try/catch fail-open behaviour in `learnings-count.js` must remain** as a defensive backstop — even with a build-time-computed value, the function should not crash if that value is somehow missing (e.g. a future refactor accidentally removes the injection step). Defense in depth, not a replacement for the existing safety net.
- **No D37/adapter concern:** this is a build-step data-injection change, not an injectable external dependency.

## Dependencies

- **Upstream:** `lccf-s1` (already merged, PR #688) — this story replaces its fallback value with a real one; `lphf-s4` (already merged, PR #686) — this story fixes that story's own AC1.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given the Docker build process, When the production image is built, Then the real count of `## `-level entries in `workspace/learnings.md` (computed from the actual repo state at build time, the same logic `getLearningsCount()` already uses) is captured and made available to the running application — without requiring `workspace/` itself to be present in the deployed image.

**AC2:** Given the deployed application is running, When the landing page renders the "learnings captured" hero card, Then it displays the real, build-time-computed count — not `0`, not a hardcoded placeholder.

**AC3:** Given the existing local-dev/CI environment (where `workspace/learnings.md` genuinely is present on disk), When the application runs there, Then the displayed count is still computed correctly and matches the file's real, current entry count — this story must not regress the already-correct local/CI behaviour.

**AC4:** Given a future deploy where the build-time value is somehow missing or malformed (simulating an injection-step failure), When `getLearningsCount()` is called, Then it still fails open to a safe fallback (`0`) rather than crashing — `lccf-s1`'s existing try/catch safety net remains intact and is verified by a test, not just assumed still-present.

**AC5:** Given this fix is deployed, When the live landing page is checked directly, Then it shows the real learnings count, not `0` — confirmed via a manual post-deploy check (this repo's own established pattern for external-deploy-dependent ACs).

## Out of Scope

- **Live-updating the count without a redeploy.** `lphf-s4`'s own story already ruled this out (static-snapshot convention, no CMS) — this story computes a fresh value at each build/deploy, which is consistent with that convention, not a live-update mechanism.
- **Changing `workspace/learnings.md`'s own format or counting logic** (`## `-level heading count) — reused as-is from the existing, already-correct local implementation.
- **General-purpose build-time data injection tooling.** This story solves this one specific value; it does not build a reusable "bake arbitrary repo stats into the image" framework.

## NFRs

- **Performance:** Negligible — a build-time computation replaces a runtime file read; if anything, marginally faster (no per-startup file I/O attempt that currently always fails in production).
- **Security:** None identified — no new input handling, no secrets involved.
- **Accessibility:** Not applicable — no markup change.
- **Availability:** This IS an availability/correctness fix — closes the gap between `lccf-s1`'s crash-safety fix and the feature actually working as designed.

## Complexity Rating

**Rating:** 2 — the mechanism itself (compute a value at build time, inject it into the running app) is well-understood, but the exact injection method has real design choices (Dockerfile `ARG`/`ENV` at build time, a generated file copied into the image, or a build-step script writing a small JSON/JS constants file) that need picking based on how this repo's existing Docker build and deploy pipeline (`fly.staging.toml`, `scripts/deploy-staging.js`) already work — genuine, if bounded, ambiguity.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
