## Definition of Ready: rdac-s1 — Lock in "resuming a completed stage shows diagrams, artefact, and conversation together" with a real browser E2E test

**Story:** artefacts/2026-08-10-resume-diagrams-artefact-conversation-e2e/stories/rdac-s1-lock-in-resume-scenario-with-e2e.md
**Review artefact:** artefacts/2026-08-10-resume-diagrams-artefact-conversation-e2e/review/rdac-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-resume-diagrams-artefact-conversation-e2e/test-plans/rdac-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- New E2E spec: `tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js`.

**Files explicitly out of scope (must not be touched):**
- Any production code (`journey.js`, `skills.js`, `chat-view.js`, `server.js`) — this story is pure test-coverage addition, no fix needed.
- `design-definition-canvas-render.spec.js` — read for its proven pattern, not modified.

### Architecture Constraints

No new architectural decision — reuses an existing, already-proven E2E driving pattern. No ADR required.

### Human oversight

**Low** — a single new test file, no production code touched, no new mechanism invented.

### Coding Agent Instructions

1. Write `tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js` per the test plan's single E2E scenario.
2. Run it standalone at least 2x to confirm no flakiness before considering this story done (this is a real turn + real SSE stream + real page render — worth the extra confirmation given no CI gate runs it automatically).
3. Clean up any local `artefacts/<date>-<feature-name>/` directories the test run itself creates on disk (a real, expected side effect of driving a real journey/turn against the local harness) before committing — these are test-run byproducts, not artefacts this story intends to ship.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — content-presence and read-only-control assertions only)

**PROCEED: Yes**
