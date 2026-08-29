# Contract Proposal: Structured diagnostic for invalid mermaid syntax inside a diagram

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## What will be built

- Modify `markDiagramRenderError` in the shared `_CANVAS_RENDER_FN_LINES` array (`src/web-ui/routes/skills.js`) to accept the mermaid rejection/exception reason as a parameter, and include it as visible text in the rendered `.cv-diagram-error-box`.
- Update both call sites (the async `mermaid.run(...).catch(...)` path and the synchronous `try/catch` path, in both the live-session script and the read-only history script — both already share this function via `_CANVAS_RENDER_FN_LINES`) to pass the actual rejection reason/exception message through.
- Add a `console.error` call capturing the specific reason, for developer diagnosis.

## What will NOT be built

- The malformed-marker case (invalid JSON/disallowed type) — S1's scope.
- Any change to mermaid's own `securityLevel: "strict"` configuration.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Stub `mermaid.run()` to reject with a specific reason; assert the error box's text includes it, and a console log captures it | Unit |
| AC2 | Inspect the rendered error box's DOM; assert the reason is present as text content | Unit |
| AC3 | Two nodes, one stubbed to fail and one to succeed; assert the successful one is unaffected | Unit |
| AC4 | Render valid fixtures of all 3 mermaid-based types; assert no error UI appears | Unit |

## Assumptions

- **Contract clarification (not a blocking mismatch):** AC2's wording ("the same `<details>`/text-alternative mechanism") could be read as requiring the failure reason to be inserted into the pre-existing `<details class="cv-diagram-alt">` sibling element specifically. The simpler, equally-valid implementation: AC1's error box itself already renders the reason as visible text (not colour-only), which independently satisfies AC2's real requirement ("a text label, not colour or icon alone"). The pre-existing `<details>` element (showing the raw mermaid source) is untouched and continues serving its own separate purpose — it does not also need to carry the failure reason. Implementer should not over-build by duplicating the reason into two places.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` (`markDiagramRenderError`, its two call sites in both the live-session and read-only history scripts, all within the single shared `_CANVAS_RENDER_FN_LINES` array). Services: none. APIs: none — client-side only, no server-side contract change.
