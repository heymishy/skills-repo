# Definition of Ready Checklist

## Definition of Ready: Signals panel must not render redundant/meaningless source and type labels on every card

**Story reference:** artefacts/2026-10-06-signals-panel-label-clarity/stories/splc-s1-collapse-redundant-source-type-labels.md
**Test plan reference:** artefacts/2026-10-06-signals-panel-label-clarity/test-plans/splc-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator reading the /signals panel" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1/AC2/AC3 unit tests, AC4 regression (existing suites) — per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (readability fix); direct benefit linkage stated in the story, matching `dswf-s1`/`wswda-s1`'s own precedent for non-metric-moving short-track fixes |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as `dswf-s1`/`wswda-s1`/`tvpf-s1`/`pcr-s1`. Logged in `decisions.md`, 2026-10-06 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `sptu-s2`/`sptu-s3` as upstream — code-level `data-signal-type` contract dependency only, no `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with real confirmed root cause (direct code read of `signals-panel-view.js`/`signals-aggregator.js`, live production verification against `skills-framework.fly.dev`); no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — pure server-rendered HTML string change, no rendered-position or drag/drop behaviour |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings inline ("None" for Performance/Security/Audit; Accessibility constraint stated and covered by AC1/AC2 unit tests) — no feature-level NFR profile required for a short-track story with no open NFR questions |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("Short-track fix now") in response to the live-confirmed UX defect. Logged in `decisions.md`, 2026-10-06 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced or touched |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this is a text/markup simplification, not a new design-system component |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption (not silently bypassed — both logged transparently in `decisions.md`, matching this session's own established precedent for `dswf-s1`/`wswda-s1`/`spdr-s1`/`spdr-s2`).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context; no standalone AC-verification-script artefact was produced for this story (matching `dswf-s1`/`wswda-s1`/`spdr-s1`/`spdr-s2`'s own established precedent of folding verification into the test plan's AC Coverage table for small short-track fixes) | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session; not re-logged separately given the tiny, purely-cosmetic scope of this fix |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "No gaps" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **View-layer convention:** `signals-panel-view.js` already follows the zero-client-JS, server-rendered-HTML-string convention used throughout `src/web-ui/views/` — this fix stays entirely within that convention, no new client JS introduced.
- No other section of this standards file applies — this is a pure view-function markup change with no route, session, or data-handling change.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention, though only the view-layer-convention section is directly applicable here.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Signals panel must not render redundant/meaningless source and type labels on every card — artefacts/2026-10-06-signals-panel-label-clarity/stories/splc-s1-collapse-redundant-source-type-labels.md
Test plan: artefacts/2026-10-06-signals-panel-label-clarity/test-plans/splc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies
- Modify ONLY _signalItem()'s own body inside
  src/web-ui/views/signals-panel-view.js — do not touch _filterBar(),
  _paginationBar(), _dismissControl(), _sortOrderLabel(), or any
  function signature/export shape
- Do NOT rename or remap any source/type value inside
  src/web-ui/modules/signals-aggregator.js
- Do NOT change the data-signal-type="..." attribute's value or position
  on the outer .signal-item card element — sptu-s2/sptu-s3's own tests
  depend on it exactly as-is
- Do NOT build a label-mapping dictionary — out of scope per the story
- Add new tests to the EXISTING tests/check-ep2-s1-signals-panel.js file —
  do not create a second test file for the same view module
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
