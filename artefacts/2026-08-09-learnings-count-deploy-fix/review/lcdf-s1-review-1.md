## Review: lcdf-s1 — Compute the learnings count at build/deploy time instead of reading a file absent from the deployed image

**Story:** artefacts/2026-08-09-learnings-count-deploy-fix/stories/lcdf-s1-build-time-learnings-count.md
**Reviewer:** Claude (agent), operator-directed
**Date:** 2026-08-09

---

### Category A: Traceability

PASS. Benefit linkage traces to a live-verified production defect (checked directly against wuce-staging), correctly attributes the emergency fail-open fix (`lccf-s1`) as necessary-but-not-sufficient, and cites that story's own DoD explicitly saying so.

### Category B: Scope discipline

PASS. Out of scope correctly excludes live-updating (already ruled out by `lphf-s4`'s own story), changing the counting logic itself (reused as-is), and building general-purpose injection tooling beyond this one value — each with a clear reason.

### Category C: AC quality

PASS. 5 ACs: AC1-AC2 cover the build-time computation and its use in production, AC3 explicitly guards against regressing the already-correct local/CI behaviour (a real risk if the fix naively replaces the direct file read everywhere rather than layering on top of it), AC4 explicitly re-verifies `lccf-s1`'s safety net still holds rather than assuming it. AC5 is a real, honest external-dependency AC (post-deploy manual check), not silently skipped.

### Category D: Completeness

PASS. NFRs correctly framed as an availability/correctness fix. Complexity rated 2 with specific, genuine justification (injection-mechanism design choice) — the DoR's own research (found and cited the `version.json`/`write-version-file.js` precedent already established in this exact codebase) substantially de-risks this ambiguity before implementation starts.

### Category E: Architecture compliance

PASS. Explicitly confirms `workspace/` will not be added to the deployed image, respecting `lccf-s1`'s own architecture constraint rather than reopening it. Follows an already-established, already-proven pattern in this codebase (`version.json`) rather than inventing a new build-time-injection mechanism — strong alignment with this repo's own precedent-reuse discipline.

---

### Verdict

**PASS — 0 HIGH findings.** Well-grounded fix that correctly identifies and reuses an existing, proven pattern in this exact codebase rather than designing a new mechanism from scratch. Cleared to proceed to `/test-plan`.
