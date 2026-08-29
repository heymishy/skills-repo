# Contract Proposal: Structured diagnostic for a malformed canvas diagram marker

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

- In `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` canvas-marker scan loop (~line 4900-4919): when `parseCanvasBlock(_cvMarkerFull)` returns `null`, emit a new, distinct SSE event (e.g. `canvasDiagnostic`) carrying `{ reason: "invalid-json" | "disallowed-type", detail: string }` instead of silently continuing the loop with no signal.
- Extend `parseCanvasBlock` (or wrap its call site) to return a richer failure shape distinguishing invalid-JSON from a disallowed `type` value, and to extract the specific detail (the JSON parse error message, or the disallowed value plus the current `TYPE_ALLOW` list) needed to populate the diagnostic.
- Add retry-state tracking on the session (e.g. a small map keyed by a diagram identity such as `skillName + type + title`) implementing the one-bounded-retry rule: first failure → diagnostic fires, retry state set; a corrected marker for the same identity succeeds → retry state cleared, normal render; a second consecutive failure for the same identity → diagnostic fires again but is marked terminal, no further retry attempted.
- Add an audit/log call on diagnostic emission, following `drift-comparator.js`'s existing injectable-logger convention (`setLogger`/`_logEvent`) rather than inventing a new logging mechanism.
- **Added at contract review:** a minimal client-side listener for the new `canvasDiagnostic` SSE event that logs it to the browser console. Without this, the SSE event reaches the client but nothing consumes it — an operator watching the chat UI would see nothing, which contradicts the story's own stated purpose ("so that I understand exactly what went wrong instead of the diagram silently never appearing at all"). This is deliberately minimal (console only, no rendered UI element) to stay within this story's scope — a rendered UI treatment is S2's job for the mermaid-syntax failure mode; S1 only needs SOME observable signal to exist for the malformed-marker case, not a matching visual treatment.

## What will NOT be built

- No changes to `markDiagramRenderError` or any client-side mermaid rendering — entirely S2's scope.
- No new diagram type or `TYPE_ALLOW` changes — S5's scope.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Feed a malformed-JSON marker through the scan loop; assert a `canvasDiagnostic` SSE event is captured | Unit + Integration |
| AC2 | Feed a marker with a disallowed `type`; assert the diagnostic names the value and the allowlist | Unit |
| AC3 | Feed a failure then a corrected marker for the same identity, both same-turn and next-turn setups; assert normal render on the corrected attempt | Unit |
| AC4 | Feed two consecutive failures for the same identity; assert the second is marked terminal and distinguishable from AC3's success case | Unit + Integration |
| AC5 | Run all 7 existing canvas-type fixtures through the updated scan loop; assert unchanged behaviour | Unit |

## Assumptions

- "Same diagram" identity for retry-tracking purposes is `skillName + type + title` (or an equivalent stable composite) — the story doesn't mandate an exact key; this is an implementation-discretion assumption within the AC's stated intent.
- **Resolved at contract review (was flagged as an open NFR-profile gap):** S1's diagnostic needs a minimal observable client-side signal (console log), not a full rendered UI treatment — the latter remains S2's scope for the mermaid-syntax failure mode. This resolves the ambiguity `nfr-profile.md` flagged ("confirm whether the diagnostic needs a visible operator-facing surface beyond logs") before implementation begins, per ADR-008.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` (`parseCanvasBlock`, `handlePostTurnStreamHtml`'s scan loop). Services: none. APIs: none — internal SSE protocol extension only (new event type, no external contract change).
