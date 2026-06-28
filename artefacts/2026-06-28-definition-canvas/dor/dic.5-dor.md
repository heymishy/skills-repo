# Definition of Ready: Canvas-edit dispatch and audit trail parity

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.5.md
**Test plan reference:** artefacts/2026-06-28-definition-canvas/test-plans/dic.5-test-plan.md
**Review reference:** artefacts/2026-06-28-definition-canvas/review/dic.5-review-1.md
**NFR profile:** artefacts/2026-06-28-definition-canvas/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want clicking 'Apply changes (N pending)' to batch all pending canvas edits into a single server request that the definition skill processes as real actions, producing a rewritten artefact and refreshing the canvas / So that my canvas edits are durably reflected in the definition artefact without requiring a separate chat instruction turn, and so that the audit trail produced by canvas edits is structurally identical to the audit trail produced by conversational-turn edits" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 9 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC9: 22 unit tests. AC1, AC3, AC6: 3 integration tests. NFR-PERF (M3): manual smoke test. NFR-AUDIT (M1): CI gate test check-dic5-audit-trail.js. All gaps acknowledged |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of scope: streaming rewrite progress, undo/redo, concurrent batches, cross-epic reorder |
| H5 | Benefit linkage field references a named metric | ✅ | M1 (audit trail parity — 100% CI gate), M2 (server-side phase guard — belt-and-braces), M3 (round-trip ≤3s P90) |
| H6 | Complexity is rated | ✅ | Complexity 3, Scope stability: Stable — the only complexity-3 story in this feature |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 2 LOW (M1 reference fixture location note; complexity-3 planning note — both addressed in test plan and coding agent instructions) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 9 ACs covered. Gaps: M3 P90 (requires real HTTP server — manual smoke test), real fs atomicity (integration test with tmp fixture covers this). M1 CI test specification included in test plan. All gaps acknowledged |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints: POST /api/skills/definition/sessions/:id/canvas-edit in skills.js, applyCanvasEdits injectable adapter (D37), req.session.accessToken canonical field, path traversal guard (ougl rule), disk canonicity write-then-read (ougl rule), race condition guard (streamActive check → 409), audit entry schema. No Category E HIGH findings |
| H-E2E | CSS-layout-dependent ACs: Apply button disabled/re-enable visual state | ✅ | RISK-ACCEPT: button disabled state is CSS-rendered. Automated test asserts `disabled` attribute; visual rendering is manual. See decisions.md |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs: Security (path traversal, req.session.accessToken, no raw path logged), Performance (M3 ≤3s P90), Audit correctness (M1 CI gate), Regression. NFR profile exists |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Data classification: Public |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public |
| H-NFR-profile | nfr-profile.md must exist | ✅ | Profile exists |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-28 |
| H-ADAPTER | Injectable adapter introduced without stub-throws + AC + wiring task | ✅ | `applyCanvasEdits` injectable adapter introduced. AC8 covers stub-throw default and production wiring. D37 rule satisfied: stub throws with named error; coding agent instructions name the wiring as a separate task |

**Required before implementation starts:** Confirm the conversational-turn audit entry schema from an existing session log or existing test. The M1 CI test (check-dic5-audit-trail.js) hardcodes a reference schema — that reference must match the actual audit entry shape before the CI test is merged. This pre-merge verification step must be documented in the PR description.

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes — with M1 reference schema verification before CI test merge.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Not triggered |
| W2 | Scope stability declared | ✅ | — | Not triggered |
| W3 | MEDIUM findings acknowledged | ✅ | — | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | M1 CI test depends on accurate reference schema; schema error would produce a false pass | Hamish King — 2026-06-28 — acknowledged; M1 reference schema must be verified from a real session log before the CI test is merged |
| W5 | No UNCERTAIN items in test plan | ⚠️ | M3 P90 is manual-only | Hamish King — 2026-06-28 — acknowledged; manual smoke test documented and required; results logged in DoD actuals |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Canvas-edit dispatch and audit trail parity — artefacts/2026-06-28-definition-canvas/stories/dic.5.md
Test plan: artefacts/2026-06-28-definition-canvas/test-plans/dic.5-test-plan.md

Goal:
Make every test in the test plan pass. The M1 CI test (check-dic5-audit-trail.js) is a blocking CI gate — it must pass on every PR.

Constraints:
- Language: JavaScript (Node.js). No new JS files. No new npm dependencies without approval.
- Route: POST /api/skills/definition/sessions/:id/canvas-edit registered in src/web-ui/routes/skills.js.
- applyCanvasEdits injectable adapter (D37 rule):
    let _applyCanvasEdits = () => { throw new Error('Adapter not wired: applyCanvasEdits. Call setApplyCanvasEdits() with a real implementation before use.'); };
    function setApplyCanvasEdits(fn) { _applyCanvasEdits = fn; }
  Wire setApplyCanvasEdits(realApplyCanvasEdits) at route initialisation. Wiring is a separate task from writing the handler.
- Request body validation: strict schema { pendingReorder: Array, pendingAdds: Array }. Return HTTP 400 for missing fields, extra fields, or wrong types. Use a schema check function, not try/catch on property access.
- Race condition guard: if session.streamActive === true, return HTTP 409 { error: 'A model turn is in progress — apply changes after the turn completes.' }. Do not call applyCanvasEdits.
- Phase guard (server-side): for each entry in pendingReorder and pendingAdds, verify phaseId matches the current phase from session.phaseModel. If any entry targets a non-current phase, return HTTP 400 { error: 'Canvas edit targets a non-current phase row.' }. No write, no audit entry.
- Path traversal guard (ougl rule): before any disk write, call path.resolve(artefactPath) and assert result.startsWith(repoRoot + path.sep). Return HTTP 400 if check fails. Do NOT log the raw path value in error responses or server logs.
- req.session.accessToken: use this canonical field name wherever the GitHub token is needed in this handler. Never req.session.token.
- Disk canonicity (ougl rule, write-then-read sequence): in applyCanvasEdits: (1) write updated definition.md to disk via fs.writeFileSync, (2) read back via fs.readFileSync, (3) use the disk content as handoff. Never use session.artefactContent directly as handoff after the disk write. completeStage() (or equivalent) must only be called after a successful disk write.
- Audit entries: write one entry per change record via writeAuditEntry(session, entry). Entry schema:
    { type: 'canvas-edit', action: 'reorder'|'add', subject: {epicId, storyId|null}, value: {newIndex|title}, origin: 'canvas', sessionId, timestamp: new Date().toISOString() }
- Client-side: Apply button disabled during POST; shows "Applying…"; re-enables on success or error. Success: clear pendingReorder and pendingAdds; reset count to 0; trigger canvas refresh. 409: show inline error; preserve pending state; re-enable button. Other errors: show generic error; preserve pending state; re-enable button.
- Write M1 CI test at tests/check-dic5-audit-trail.js. The test must assert field-by-field schema identity between a canvas-edit audit entry and the conversational-turn reference fixture. Confirm the reference schema from a real session log before writing the fixture. Add test to package.json test chain.
- Write governance tests at tests/check-dic5-canvas-edit-dispatch.js (route handler, path traversal, phase guard, race guard, schema validation). Add to package.json test chain.
- Dependency: dic.1, dic.2, dic.3, and dic.4 must be merged before implementing dic.5. Read all four in full before modifying. dic.5 is the terminal story.
- Architecture standards: read .github/architecture-guardrails.md before implementing.

Implementation order:
Task 1: Write the route handler (validation, guards, applyCanvasEdits call, audit write, response).
Task 2 (separate): Wire setApplyCanvasEdits(realApplyCanvasEdits) in the route initialisation block. Write the production wiring. Verify with AC8 wiring test.
Task 3: Write check-dic5-audit-trail.js M1 CI test. Confirm reference schema from a real session log first.
Task 4: Manual M3 smoke test (10 sequential apply-changes; record P50/P90; log in PR description).

- Open a draft PR when all automated tests pass AND M3 manual smoke test is completed. Do not mark ready for review until M1 reference schema is verified and documented in PR description.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Engineering lead sign-off required (complexity 3 story; M1 is a blocking CI gate)
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-28
