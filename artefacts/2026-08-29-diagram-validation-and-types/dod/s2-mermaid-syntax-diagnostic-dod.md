# Definition of Done: Structured diagnostic for invalid mermaid syntax inside a diagram

**PR:** https://github.com/heymishy/skills-repo/pull/785 | **Merged:** 2026-08-29 (`59384c290ef5d5158556ea9e12e7712888e44a06`)
**Story:** artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
**Test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s2-mermaid-syntax-diagnostic-test-plan.md
**DoR artefact:** artefacts/2026-08-29-diagram-validation-and-types/dor/s2-mermaid-syntax-diagnostic-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `mermaidRenderFailureSurfacesMermaidsOwnReason`, `mermaidRenderFailureReasonLoggedToConsole` — error box shows mermaid's specific first-line reason; full reason logged via `console.error` | `tests/check-s2-mermaid-syntax-diagnostic.js`, re-run against merged `master` (7/7 passing); real-browser E2E (`csd-s2-canvas-diagram-rendering.spec.js`, malformed-diagram scenario) | See below — first-line-only, not full raw pass-through (deliberate, operator-approved) |
| AC2 | ✅ | `errorReasonAvailableViaTextAlternativeNotColourAlone` — reason present as real text content, not colour-only | Same test file, re-run against merged `master` | None |
| AC3 | ✅ | `siblingDiagramRendersSuccessfullyDespiteNeighbourFailure` — one diagram's failure doesn't affect a sibling's successful render | Same test file, re-run against merged `master` | None |
| AC4 | ✅ | `successfulRendersUnchangedAcrossAll3MermaidTypes` + full-suite regression (567/567) | Same test file + full suite, re-run against merged `master` | None |

**Deviation detail (AC1):** The story's own wording ("surfaces the specific reason mermaid reported") is satisfied by showing mermaid's rejection message's **first line only**, not the complete raw message. This was a deliberate, operator-approved narrowing made during implementation planning — not an implementation shortfall — after discovering the original literal-pass-through framing would have regressed an already-shipped test from a different feature (`code-shape-diagrams`/csd-s2, Unit 3) enforcing `MC-SEC-01` (no raw error/stack text in the error box). Recorded in full in `decisions.md` (ARCH, 2026-08-29).

---

## Scope Deviations

None beyond the declared AC1 narrowing above (which is a scope *clarification*, not an out-of-scope addition — the story's own DoR contract was corrected to match before code was written). `tests/check-csd-s2-canvas-diagram-rendering.js` (a different feature's test file) was modified as a required, declared consequence of AC1 — its Unit 3 test now asserts the new intentional behaviour (stack suppressed, first-line reason shown) rather than the old "suppress everything" behaviour. This is documented in `decisions.md` and named explicitly in the PR description, not a silent scope change.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8 named test-plan items (AC2's accessibility NFR shares AC2's own unit test, per the test plan's own text — 7 distinct test implementations)
**Tests passing in CI:** 7/7 story tests + 9/9 `csd-s2` tests (full repo suite: 567/567 files, 0 failures)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit ×2 | ✅ | ✅ | reason shown + logged |
| AC2 unit | ✅ | ✅ | text-content, not colour-only |
| AC3 unit | ✅ | ✅ | sibling isolation regression |
| AC4 unit | ✅ | ✅ | 3-type regression |
| NFR-Performance | ✅ | ✅ | call-count unchanged |
| NFR-Security | ✅ | ✅ | escaping verified |
| csd-s2 Unit 3 (updated) | ✅ | ✅ | matches new intentional behaviour |

**Gaps (tests not implemented):** None.

**Layout gap audit:** N/A — test plan's Gap type column is 🟢 for every AC; no CSS-layout-dependent scenarios in this story.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no added latency | ✅ | `mermaidRenderFailureAddsNoLatency` — `mermaid.run()` call count unchanged, passing |
| Security — reason text escaped before DOM insertion | ✅ | `errorReasonTextIsEscapedBeforeDomInsertion` — a script-like reason produces no real `<img>`/`<script>` element, passing |
| Accessibility — reason available as text, not colour alone | ✅ | Covered by AC2's own unit test, per the test plan's own design |
| Audit — N/A (client-only failure mode, no server-side event) | ✅ | Confirmed — no server-side event exists for this failure mode, matching the story's own NFR statement |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Diagram render-failure diagnosability | ✅ (0% before either S1 or S2) | Not yet — no real operator session has hit either failure mode in production since S1 merged (`ea51a4aa`) or S2 merged (`59384c29`) | Signal: `not-yet-measured`. With S2 now merged, M1's target (100% of render failures surface a structured diagnostic) is mechanically met for BOTH failure modes this metric covers (marker-parsing via S1, mermaid-syntax via S2) — the metric itself still awaits real production usage before it can be scored on-track/at-risk/off-track. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

One recorded deviation (AC1's first-line-only extraction, see above) — deliberate, operator-approved, and fully documented in `decisions.md`. Not a gap requiring follow-up; recorded here so `/trace` surfaces it accurately rather than this story appearing to have shipped a literal raw-reason pass-through.

**Follow-up actions:** None required for this story. S3 (labeled/multi-target edges in `drift-comparator.js`'s `parseFlowchartMermaid`) is next in the epic and has no dependency on S2's own output.

---

## DoD Observations

1. **A real pre-existing-test conflict was found and resolved during implementation planning, before any code was written** — worth feeding into `/improve`: this story's own DoR contract (written before implementation planning began) described a literal raw-error pass-through that would have silently regressed an already-shipped test from a *different* feature enforcing a mandatory security constraint (`MC-SEC-01`). Neither `/review` nor `/definition-of-ready` for this story caught the conflict, because neither step cross-checks a story's contract against *other features'* existing tests — only this story's own test plan. The conflict was only found because implementation planning read the actual current code (including nearby, related tests) rather than working from the DoR contract's text alone. This is the third time this session that reading real code before planning — rather than trusting an already-signed-off artefact — surfaced something a prior gate missed (see also S1's DoD Observations).
2. This was escalated to the operator directly (via a structured question) rather than resolved unilaterally, since it touched a mandatory guardrail constraint and changed an existing, already-merged security/UX decision — not just this story's own scope. Logged in `decisions.md` (ARCH, 2026-08-29) with full rationale and a revisit trigger.
3. `tests/check-p3.5-validate-trace.js` flaked in this story's branch-setup baseline — the 6th occurrence across 3 unrelated features/stories in this session. Flagged again in `decisions.md`; still not yet actioned as a dedicated root-cause story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Structured diagnostic for invalid mermaid syntax inside a diagram (S2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
