# Decisions: b1 story-map stage-sequence fix

## ARCH — Fix the test to match the real STAGE_SEQUENCE, not the other way around (2026-07-23)

**Context:** While re-verifying `b1-formed-idea-outer-loop-story-map.spec.js`'s AC3 against real `wuce-staging` (after fixing the missing `MOCK_LLM_GATEWAY` deploy-config gap), AC3 failed with a 404 on the `test-plan` turn submission, right after the `review` stage's own `gate-confirm` call.

**Decision:** Treat `journey-store.js`'s `STAGE_SEQUENCE` (which includes a `design` stage between `benefit-metric` and `definition`) as the correct, authoritative platform behaviour, and fix the test spec to match it — not the reverse.

**Rationale:** `design` is a real, intentional pipeline stage (matches `CLAUDE.md`'s documented pipeline and has its own mock fixture, `design.success.json`, already present and correctly served). `b1`'s spec's own header comment already claims a self-correcting design ("follows whatever gate-confirm's redirect Location names as the next stage") that the actual code never implemented — every `driveSkillToCompletion` call site hardcodes a literal stage-name string instead. The fix should make the code honor its own already-stated design intent (parse the real stage name from the redirect), which is also more robust to any future `STAGE_SEQUENCE` change, rather than adding another one-off hardcoded literal for `design` that would just as easily drift out of sync again.

**Consequences:** `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` needs a scoped rewrite of its stage-tracking logic (see `stories/bssm-s1.md` and `dor/bssm-s1-dor.md`). No server-side code changes. AC2's `completedStages` bookkeeping, currently silently wrong (recording `design` under a `'definition'` label), will self-correct once the test drives the real stage names.

## FINDING — Live-verified root cause (2026-07-23)

Real `GET /api/journey/:id` response, captured via temporary debug instrumentation against real `wuce-staging` (added to the spec file, then reverted — no debug code was committed):

```json
{
  "activeSkill": "definition",
  "activeSessionId": "06b319d9-efec-4649-80f1-ff4ee615a7c1",
  "stage": "definition",
  "completedStages": [
    {"skillName": "discovery", ...},
    {"skillName": "benefit-metric", ...},
    {"skillName": "design", ...}
  ]
}
```

captured immediately after the test had just driven what it called a `'definition'` turn to completion — proving the session it actually drove was, server-side, really `design`. The subsequent `gate-confirm` call (real transition out of `design`, into real `definition`) returned `{"nextLocation":"/journey/.../stories","sessionId":null}` — the `/stories` per-story-list redirect landing one step later than the test's hardcoded `/stories`-handling (written only for the `definition→review` call site) expected, producing the observed 404 on the next `driveSkillToCompletion(request, 'test-plan', ...)` call.

**Verification performed:** Direct, reproducing evidence via real-staging Playwright runs with temporary `console.log` instrumentation (not assumed from code reading alone). No code fix applied yet in this pass — root cause confirmed and DoR signed off; implementation deferred to a dispatched coding agent per this repo's short-track pipeline.
