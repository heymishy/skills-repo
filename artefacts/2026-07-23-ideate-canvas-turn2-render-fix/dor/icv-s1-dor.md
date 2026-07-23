# Definition of Ready: icv-s1 — Stop /ideate's unbounded "continue" chain

## Summary

Short-track bug fix (`/test-plan → /definition-of-ready → coding agent`). Story: `artefacts/2026-07-23-ideate-canvas-turn2-render-fix/stories/icv-s1.md`. Test plan: `artefacts/2026-07-23-ideate-canvas-turn2-render-fix/test-plans/icv-s1-test-plan.md`.

## Root Cause (independently confirmed)

`_renderChatPage`'s inline client script (`src/web-ui/routes/skills.js`, `sendTurn` function) auto-fires a hidden "continue" turn whenever a turn's streamed text has no literal "?" character AND no `---ARTEFACT-START---`/`---ARTEFACT-END---` marker (added in commit `a10b32a3`, "artefact generation — no hold turns + auto-nudge client when model announces without asking"). That heuristic is correct for artefact-generating skills (discovery/definition/benefit-metric/test-plan/definition-of-ready/branch-setup/branch-complete/review), whose system prompt (`buildSystemPrompt`'s "ARTEFACT GENERATION" instruction) guarantees every turn ends in either the artefact or a literal question.

`/ideate` has neither guarantee: it is a standalone, conversational, per-turn exchange that never emits `---ARTEFACT-START---`/`---ARTEFACT-END---` and can legitimately end a turn with a suggestion/statement instead of a literal "?" — exactly the shape of `tests/e2e/fixtures/llm-gateway/ideate.success.json`'s own fixture text ("Let me know if any of these resonate, or if there's a different angle you would like to explore next." — no "?"). Applying the heuristic to ideate anyway fires an unbounded chain of hidden "continue" turns against the same static/deterministic turn content: each iteration re-parses the identical `---CANVAS-JSON:---` marker and pushes another `.canvas-block` (no de-duplication exists or is expected — canvas blocks are meant to accumulate turn-over-turn, per design), while the submit button stays disabled indefinitely (it is only re-enabled by the "done" branch or the "has a literal '?'" branch, neither of which the ideate fixture ever satisfies).

This exactly reproduces the real, CI-blocking failure: PR #568's "Scenario A E2E (staging)" run (29996127983 / job 89170114731) recorded `tests/e2e/a3-product-feature-ideate-canvas.spec.js`'s AC3 failing with `Expected: > 30, Received: 30` — i.e. turn 1 alone produced 30 duplicate canvas blocks via the runaway chain, and turn 2's own genuine submission produced no further growth within the 20s poll window.

**This is a real, production-affecting client-code defect (case (c) in the investigation framing) — not a mock/fixture-authoring gap.** Any real (non-mocked) `/ideate` model turn that happens not to end in a literal "?" character (plausible for a conversational, suggestion-style turn) would trigger the exact same unbounded hidden-turn chain in production, against the real Anthropic API, silently burning real turn-credits and tokens while leaving the real user's input disabled.

## The Fix

One conditional gate added to the existing heuristic in `sendTurn`'s "done" handling (`src/web-ui/routes/skills.js`):

```js
} else if (!IS_IDEATE && streamText && streamText.indexOf("?") === -1) {
  // ... existing auto-continue nudge, now ideate-exempt ...
} else {
  // ... re-enable input branch, now ALSO the path ideate always takes ...
}
```

`IS_IDEATE` is an existing, already-computed, server-set boolean already in scope in this exact script (used elsewhere for `updateDraftPanel`'s ideate-specific rendering branch) — no new flag, no new session field, no server-side change.

## Acceptance Criteria Coverage

| AC | Verified by |
|----|-------------|
| AC1 | `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` T1 (behavioural, jsdom) |
| AC2 | `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` T2 |
| AC3 | `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` T3 |
| AC4 | `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` T4 (contrast case) |
| AC5 | Full `npm test` run, diffed against `tests/known-baseline-failures.json` |
| AC6 | Manual real-staging re-verification dispatch, reported in `decisions.md` |

## Coding Agent Instructions

1. Apply the single conditional gate described above to `src/web-ui/routes/skills.js`'s `sendTurn` inline script (already applied and verified in this session — see `decisions.md`).
2. Do not touch `mock-llm-gateway.js`, `skill-turn-executor.js`, or any fixture file.
3. Run `node tests/check-icv-s1-ideate-canvas-turn2-render-fix.js` and confirm all 4 assertions pass.
4. Run `npm test` and diff against `tests/known-baseline-failures.json` — confirm zero new regressions.
5. If `flyctl` is available and authenticated, check `flyctl releases --app wuce-staging` for concurrent deploy activity from another agent (a4's own investigation may be deploying independently) before deploying; deploy and re-run the real `a3` E2E spec's AC3 against staging; report the real, observed result.
6. Update `.github/pipeline-state.json` with a new flat `feature.stories[]` entry for `icv-s1` (per cdg.6/cdg.7 — use `node bin/skills advance` / `node bin/skills gate-advance`, not a direct JSON write).
7. Append a `workspace/capture-log.md` entry (source: agent-auto) documenting the root cause and fix.
8. Commit, push to a new branch (`fix-forward-ideate-canvas-turn2-render`), open a **draft PR** against `master` (not PR #568's branch — independent, both must merge).

## Definition of Ready Sign-off

- [x] Story exists and is complete (`stories/icv-s1.md`)
- [x] Test plan exists and is complete (`test-plans/icv-s1-test-plan.md`)
- [x] Root cause independently confirmed (real CI log + direct code inspection + reproducing/de-reproducing regression test)
- [x] Fix implemented and verified GREEN against the new test (RED confirmed pre-fix first — TDD discipline)
- [x] No contradiction between DoR contract and test plan required touchpoints (single file touched: `src/web-ui/routes/skills.js`; test touches only the new test file)
- [x] Conflict-marker scan not applicable (no merge/rebase/cherry-pick performed)
- [x] Human oversight level: Low (single-file, single-conditional bug fix with a reproducing regression test; short-track)

**Proceed:** Yes
