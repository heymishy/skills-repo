# Definition of Done: Structured diagnostic for a malformed canvas diagram marker

**PR:** https://github.com/heymishy/skills-repo/pull/784 | **Merged:** 2026-08-29 (`ea51a4aa2a9b9c619fdf731e8d3c4ac0ae9c0725`)
**Story:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s1-diagram-marker-diagnostic-test-plan.md
**DoR artefact:** artefacts/2026-08-29-diagram-validation-and-types/dor/s1-diagram-marker-diagnostic-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: a canvasDiagnostic SSE event is written for a malformed marker` — a distinct `canvasDiagnostic` SSE event fires for invalid JSON, not folded into `chunk`/`canvasBlock` | `tests/check-s1-diagram-marker-diagnostic.js`, re-run against merged `master` (22/22 passing) | None |
| AC2 | ✅ | `AC2: the diagnostic names the disallowed type and the allowlist` — payload names `not-a-real-type` and lists `table, drift-signal, …` | Same test file, re-run against merged `master` | None |
| AC3 | ✅ | `AC3 (same-turn)` ×2, `AC3 (next-turn)` — a corrected marker for the same diagram identity renders normally, both within-turn and across turns | Same test file, re-run against merged `master` | None |
| AC4 | ✅ | `AC4: … still fires diagnostic`, `AC4: … terminal` — second consecutive failure carries `terminal:true`, distinct from AC3's retry outcome | Same test file, re-run against merged `master` | None |
| AC5 | ✅ | 3 unit assertions + `check-inc4-canvas-panel.js` (26/26) + `tests/e2e/design-definition-canvas-render.spec.js` (5/5, real mermaid SVG render) — all 7 existing types and `parseCanvasBlock`'s contract (incl. `extractCanvasBlocksFromTurns`'s caller) unchanged | Unit + regression suite + real-browser E2E, all re-confirmed against merged `master` | None |

---

## Scope Deviations

None shipped. One was caught and corrected **before** merge, not after: the implementation plan's Task 1 draft had mistakenly added `'sequence'` to `TYPE_ALLOW` (explicitly out of scope for this story per its own Out of Scope section — that's S5's job). Found during subagent-execution verification, reverted, logged in `decisions.md` (SCOPE, 2026-08-29). The merged code's `TYPE_ALLOW` is the original 7 types.

---

## Test Plan Coverage

**Tests from plan implemented:** 12/12 named test cases (22 underlying assertions — some cases needed >1 assertion to verify properly)
**Tests passing in CI:** 22/22 (full repo suite: 566/566 files, 0 failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit + integration | ✅ | ✅ | |
| AC2 unit ×2 | ✅ | ✅ | |
| AC3 integration ×2 | ✅ | ✅ | same-turn and next-turn paths both covered |
| AC4 unit + integration | ✅ | ✅ | |
| AC5 regression | ✅ | ✅ | plus `check-inc4-canvas-panel.js` (26/26) and a real-browser E2E spec |
| NFR-Security (diagnosticTextIsEscapedBeforeSsePayload) | ✅ | ✅ | found failing on first implementation attempt; fixed before merge (see DoD Observations) |
| NFR-Performance (zero added executor calls) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Layout gap audit:** N/A — test plan's Gap type column is 🟢 for every AC; no CSS-layout-dependent scenarios in this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no additional model/LLM call for diagnostic generation | ✅ | `NFR-Performance: exactly one executor call for the turn` — passing |
| Security — diagnostic text escaping before SSE/log/DOM insertion | ✅ | `NFR-Security: the diagnostic payload escapes raw <script> content` — passing, via `_escSseDiagnosticText()` applied at the SSE-write call site (audit log intentionally keeps raw text for debugging fidelity) |
| Accessibility gap (nfr-profile.md, flagged for DoR) — does the diagnostic need a visible operator-facing surface beyond logs? | ✅ | Resolved at DoR: a minimal client-side `console.warn` listener added for `evt.canvasDiagnostic` (ARCH decision, 2026-08-29), confirmed present and wired to `reason`/`detail`/`terminal` in the merged code |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Diagram render-failure diagnosability | ✅ (0% — no structured diagnostic mechanism existed before this story) | Not yet — no real operator session has hit a malformed marker in production since merge (`ea51a4aa`, 2026-08-29) | Signal: `not-yet-measured`. M1's target (100% of render failures surface a structured diagnostic) is now mechanically met for the marker-parsing failure mode this story covers; the mermaid-syntax failure mode (S2) still contributes to the same metric before it can be assessed as a whole. |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story. S2 (mermaid-syntax diagnostic) reuses this story's diagnostic object shape and is the next story in the epic.

---

## DoD Observations

1. **Two real defects were found and fixed during subagent-execution, both before merge** — worth feeding into `/improve` as evidence that independent re-verification of subagent output (rather than trusting a subagent's own passing self-report) catches real regressions a plan's own Step 4 self-review checklist does not:
   - The implementation plan's own Task 1 code had drifted out of the story's declared scope (`'sequence'` added to `TYPE_ALLOW` prematurely). This was a plan-authoring defect, not a subagent error — worth noting for `/implementation-plan`'s own Step 4 self-review checklist, which currently checks "No scope beyond the relevant AC" but did not catch this because the plan author (this session) was the one who introduced the drift while drafting Task 1's code, and Step 4 as currently written doesn't cross-check a task's actual TYPE_ALLOW/allowlist values against the story's Out of Scope section line-by-line.
   - The plan's Task 2 code did not satisfy its own Task 2 Step 1 test (`diagnosticTextIsEscapedBeforeSsePayload`, an NFR-Security requirement named in the test plan). The dispatched subagent correctly reported the literal failure rather than silently patching around it or claiming success — this is the behaviour `/verify-completion`'s "Trusting a subagent's self-report without independent verification" red flag exists to catch, and in this case the subagent itself did the right thing by reporting rather than improvising a fix that might have collided with Task 3's own edit to the same code block.
2. Both fixes are logged in `artefacts/2026-08-29-diagram-validation-and-types/decisions.md` (two entries, 2026-08-29) with full rationale and revisit triggers.
3. Sequencing note for S2: S2 reuses this story's diagnostic object shape (`{ok, reason, detail}` / `{ok, block}`) — confirmed still exactly as designed in the merged code, no changes needed before S2 begins.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Structured diagnostic for a malformed canvas diagram marker (S1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
