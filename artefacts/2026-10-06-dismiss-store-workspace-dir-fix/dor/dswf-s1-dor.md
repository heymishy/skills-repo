# Definition of Ready Checklist

## Definition of Ready: dismissed-signals-store's _persist() must create its parent directory before writing

**Story reference:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/stories/dswf-s1-create-parent-dir-before-persist.md
**Test plan reference:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/test-plans/dswf-s1-test-plan.md
**Contract proposal:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/dor/dswf-s1-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator (or any real user) clicking 'Dismiss' on a signal in a real deployed environment" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1/AC2 unit tests, AC3 regression (existing suite), AC4 manual/live — all covered per the test plan's own stated approach for each |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Metric 3 — Dismiss retention (`artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md`) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as `tvpf-s1`/`pcr-s1`. Logged in `decisions.md`, 2026-10-06 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `sptu-s4` as the upstream story this fixes — no `pipeline-state.schema.json` field dependency, a code-ownership dependency only |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed root cause (live `fly logs` stack trace), real line numbers, and 2 real precedent call sites in this same codebase; no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — pure Node module fix |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings ("None identified" for Security/Accessibility/Audit, "Negligible" for Performance) — no feature-level NFR profile required for a short-track story with no open NFR questions |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("Fix now as a short-track story") in response to the live-confirmed production bug. Logged in `decisions.md`, 2026-10-06 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — this fixes the existing `createFsDismissedSignalsStoreAdapter`'s own internal write behaviour, does not change its public shape or wiring |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption (not silently bypassed — both logged transparently in `decisions.md`, matching `tvpf-s1`'s own established precedent for this exact gap, which itself followed `pcr-s1`'s precedent).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every other story this session; not re-logged separately given the tiny, mechanical scope of this fix |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table item (AC4's manual-only nature) is explained/mitigated by design, not "UNCERTAIN" — the whole point of this story is that purely-automated verification already failed to catch the original bug once | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Stack constraints:** No new npm dependency — `path` is a Node built-in, already used elsewhere in this codebase (`server.js`'s own `_path` alias).
- No other section of this standards file applies — this is an internal module fix with no route, view, or session-handling change.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention, though only the stack-constraints section is directly applicable here.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dismissed-signals-store's _persist() must create its parent directory before writing — artefacts/2026-10-06-dismiss-store-workspace-dir-fix/stories/dswf-s1-create-parent-dir-before-persist.md
Test plan: artefacts/2026-10-06-dismiss-store-workspace-dir-fix/test-plans/dswf-s1-test-plan.md
Contract: artefacts/2026-10-06-dismiss-store-workspace-dir-fix/dor/dswf-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies (path is a Node built-in)
- Modify ONLY _persist()'s own body inside src/web-ui/modules/dismissed-signals-store.js
  — do not touch isDismissed/dismiss/undismiss's public signatures, _load(),
  or any D37 wiring/export shape
- Do NOT modify the Dockerfile — explicitly rejected approach, see this
  story's own Architecture Constraints and decisions.md
- Add new tests to the EXISTING tests/check-sptu-s4-signals-dismiss.js file —
  do not create a second test file for the same module
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
