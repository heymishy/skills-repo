# Test Plan: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400 (csgc-s1)

**Story:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
**Track:** Short-track

---

## Test Cases

| Test | AC | Type | Description |
|------|----|------|-------------|
| AC1 | AC1 | Behavioural | `extractStoryIdsFromDefinitionArtefact`, run against the REAL `tests/e2e/fixtures/llm-gateway/definition.success.json` fixture (not a hand-crafted stand-in), returns `["mock-fixture.1"]` — codifies the manual verification already done at original merge time |
| AC2 | AC2 | Integration | `dtra-s1`'s auto-skip-to-review logic acts correctly on that real-fixture-extracted list: `handlePostGateConfirm` sets the full story list via `setStoryList` and redirects straight to a new `/skills/review/` session, not the manual `/journey/:id/stories` page |
| AC3 (T3a) | AC3 | Integration | Drive the REAL streaming handler (`handlePostTurnStreamHtml`) fully, then call `handlePostGateConfirm` — must NOT 400, confirming the correctly-sequenced real client path never reproduces the original observation |
| AC3 (T3b) | AC3 | Integration | Contrast case: force `session.done` back to false (simulating a premature/out-of-sequence gate-confirm call), then call `handlePostGateConfirm` — MUST 400, pinpointing the exact, sole mechanism |

## Investigation approach for AC3

Per the story's own Architecture Constraints, the 400 is reproduced via the real streaming path (`handlePostTurnStreamHtml`), not a JSON-API shortcut. `session.done` is set synchronously inside that handler and the whole handler is `await`ed before the SSE response ever ends — a real browser client only ever calls `gate-confirm` in response to that completion signal (via `showCommitLink()`'s Continue button), so it cannot reach `gate-confirm` before `session.done` is true. T3a/T3b together empirically confirm this: the correctly-sequenced path never 400s, and only a deliberately out-of-sequence call does. This closes AC3 via outcome (b) — confirmed as an artifact of the original debug script's own construction, not a real production bug — with direct empirical evidence rather than code-reading alone.

## Out of Scope (per story)

- Any change to the diagram-rendering behaviour itself (AC1/AC2 of the original `r-canvas-render-and-story-extraction-fix` story).
- Broader story-extraction feature work beyond closing this specific gap.

## NFR Test Coverage

None — story names no NFRs beyond "None identified".

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
