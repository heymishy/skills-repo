# Contract Proposal: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story reference:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

1. Read `src/web-ui/adapters/artefact-commit-writer.js` and `src/web-ui/adapters/export-data-source.js` in full (neither has been read yet this session — only the call site in `journey.js` has) to confirm which of the three candidate failure sub-modes is the actual root cause: (a) `commitArtefact` swallows a real failure internally instead of throwing, (b) `ownerRepoForFeature` throws for a genuinely-linked product, or (c) `ownerRepoForFeature` returns falsy without throwing for a genuinely-linked product.
2. Fix the confirmed failure path in `src/web-ui/routes/journey.js`'s `handlePostGateConfirm` (the stage-completion call site, ~lines 2424–2460) and/or the specific adapter file where the bug is found, so the failure blocks `completeStage()` and returns a clear, actionable error — restoring `das-s1`'s AC2 contract.
3. Preserve the existing AC4 behaviour (a genuinely repo-less product still skips the commit cleanly, no error) exactly as-is — verified by a dedicated regression test.
4. Write the 8 tests from the test plan: 4 unit (AC1, AC2, AC2a, AC3), 2 integration, 2 NFR.

## What will NOT be built

- Retroactive backfill of `new-feature-af17f555`'s own already-missing 8 artefacts — a separate, one-off data-repair task, not part of this story.
- A generic retry/backoff mechanism for commit failures.
- `acdg-s2`'s durability-signal logging — that is a separate, downstream story that depends on this one's confirmed root cause.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Monkey-patch `commitArtefact` to throw after a successful resolve; assert 502 response and `completeStage` not called | Unit + Integration |
| AC2 | Monkey-patch `ownerRepoForFeature` to throw for a genuinely-linked product; assert clear error and `completeStage` not called | Unit |
| AC2a | Monkey-patch `ownerRepoForFeature` to resolve falsy (no throw) for a genuinely-linked product; assert clear error and `completeStage` not called | Unit |
| AC3 | `ownerRepoForFeature` resolves `null` (real no-repo behaviour); assert no error and `completeStage` IS called (regression) | Unit + Integration |
| AC4 | Not a standalone test — verified at DoD by naming which of AC1/AC2/AC2a's tests actually failed on unmodified code (the confirmed real bug), per the test plan's own Coverage gaps row | Manual (DoD cross-reference) |

## Assumptions

- `commitArtefact` and `ownerRepoForFeature` are both plain `require()`'d module exports at call time (not injectable adapters) — the same monkey-patch technique already proven for `posthog-server.capture` in `ep1-s5`/`ep1-s6` applies directly; no new injectable-adapter pattern needs to be introduced for this story.
- `handlePostGateConfirm` is directly invokable in a test harness with a mock `req`/`res`, matching the `mockReq`/`mockRes` pattern already established in `check-ep1-s5-error-handling.js` and `check-ep1-s6-instrumentation.js`.
- The real root cause is one of the three named sub-modes (AC1/AC2/AC2a) — if implementation investigation reveals a fourth, structurally distinct sub-mode not covered by any current AC, that is a scope gap requiring a return to `/definition` before continuing, not a silent workaround.

## Estimated touch points

Files: `src/web-ui/routes/journey.js`, `src/web-ui/adapters/artefact-commit-writer.js` (if confirmed as root cause), `src/web-ui/adapters/export-data-source.js` (if confirmed as root cause), `tests/check-acdg-s1-*.js` (new).
Services: None new — reuses the existing GitHub API integration `das-s1` already wired.
APIs: None new.
