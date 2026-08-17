# Definition of Done: Session restore from Redis carries forward ALL session state, not a hardcoded 8-field allowlist

**PR:** #550 (`716367a8` — "wusl-s2: full skill-session state restore from Redis (allowlist -> denylist) (#550)") | **Merged:** 2026-07-23 (git commit timestamp `2026-07-23 07:01:33 +1200`)
**Story:** `artefacts/2026-07-23-skill-session-full-restore/stories/wusl-s2-full-session-state-restore.md`
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|----------------------|-----------|
| AC1 (all previously-missing fields restore correctly) | Yes | `check-wusl-s2-full-session-state-restore.js` test "mergeRedisSessionData restores canvasBlocks, conditionItems, and the definition story-map fields (AC1)" — asserts `canvasBlocks`, `conditionItems`, `dynamicQuestions`, `sectionDrafts`, `pendingConfirmation`, `pendingSectionDraft`, `currentSectionIndex`, `modelResponses`, `auditLog` all restore with real values | Unit test | None |
| AC2 (original 8 allowlisted fields still restore, no regression) | Yes | Test "mergeRedisSessionData still restores the original 8 allowlisted fields correctly (AC2)" — asserts `turns`, `artefactContent`, `artefactPath`, `done`, `usage`, `_artefactBuffer`, `_artefactInProgress`, `_slugBuffer`, `assumptionCards` all restore unchanged | Unit test | None |
| AC3 (never-persisted fields never overwritten, even adversarially) | Yes | Test "...never overwrites the freshly-built systemPrompt/contextFiles/precomputedStep1, even if adversarially present in redisData (AC3)" — asserts sentinel values for `systemPrompt`/`contextFiles`/`precomputedStep1`/`accessToken` are rejected by the denylist | Unit test | None |
| AC4 (a genuinely novel field restores automatically) | Yes | Test "...restores a field that does not exist anywhere in today's codebase, proving this is not another allowlist (AC4)" — asserts `_futureFieldNotYetInvented` restores | Unit test | None |

Implementation confirmed by direct code read at `src/web-ui/routes/skills.js`: `_REDIS_RESTORE_DENYLIST = ['accessToken', 'systemPrompt', 'contextFiles', 'precomputedStep1']` (line 168) and `mergeRedisSessionData` (line 193) iterates `Object.keys(redisData)`, skipping only denylisted keys — matching the Architecture Constraints section of the story exactly (allowlist replaced with denylist-based copy).

## Scope Deviations

None. The three Out of Scope items named in the story (no change to `skill-session-redis.js` write side, no change to the 9 `wusl-s1` handler call sites, no live SSE-connection continuation across page reload) were respected — confirmed by direct code read showing `skill-session-redis.js` untouched by this change and `mergeRedisSessionData`'s internals as the sole modification site.

## Test Plan Coverage

`check-wusl-s2-full-session-state-restore.js`: 4 passed, 0 failed (freshly re-run 2026-08-17), covering AC1-AC4 1:1. Per `decisions.md`, regression suites were also re-verified at merge time: `check-wusl-s1-session-redis-fallback.js` (7/7), `check-p3.2-redis-session-adapter.js` (17/17), `check-wusl2-progressive-live-draft.js` (8/8), `check-iwu5-lens-complete.js` (17/17), plus one pre-existing unrelated baseline failure (`check-wusl1-chat-streaming.js`) noted as unchanged. Full suite at merge time: 37 failed, identical to documented baseline (no new failures introduced).

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | `Object.keys()` iteration over same/similar-sized Redis payload replacing an 8-item allowlist loop — no new I/O, confirmed by code read |
| Maintainability | Met | This was the primary NFR target; denylist-based restore is self-maintaining (AC4 proves it structurally, without requiring future allowlist updates) |
| Security | Met | `accessToken` remains excluded via the denylist; AC3 test explicitly proves this defensively even with an adversarial fixture |

## Metric Signal

No `benefit-metric` artefact is referenced — this is a short-track story (discovery and benefit-metric skipped per the story header). Benefit linkage is stated directly in the story text ("every piece of accumulated session state... comes back exactly as I left it") and confirmed structurally correct by AC4's proof that the fix generalizes to fields not yet invented.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Implementation matches the story's Architecture Constraints exactly (denylist at `src/web-ui/routes/skills.js:168`, `mergeRedisSessionData` at line 193); no drift found between story intent and shipped code. No incidents or regressions traced to this change since merge.
