# Definition of Ready Checklist

## Definition of Ready: Extend the quiet-retry budget to network-level turn failures, not just the in-flight guard

**Story reference:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s2-extend-quiet-retry-to-network-level-failures.md
**Test plan reference:** artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s2-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator whose browser loses its connection to a long-running skill turn, including the client's own single automatic reconnect attempt" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (short-track UX fix, continuing tpux-s1); direct benefit linkage stated with a real, same-day live incident |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review`, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tpux-s1` as upstream — reuses its own `_inFlightRetryCount` parameter and retry cap, no `pipeline-state.schema.json` dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed root cause (exact line reference), the live incident that surfaced it, and explicit rationale for NOT reusing tpux-s1's auto-reload-on-exhaustion treatment here |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section fully populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery`. Satisfied via the operator's own direct in-session instruction ("Yes please") following the investigation this story is scoped from. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption, matching this session's own established precedent.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No section applies specifically — this is a small client-script control-flow extension of an already-governed retry mechanism.
- Full file read in full per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend the quiet-retry budget to network-level turn failures, not just the in-flight guard — artefacts/2026-10-08-turn-progress-ux/stories/tpux-s2-extend-quiet-retry-to-network-level-failures.md
Test plan: artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies, no new test infrastructure
- Modify ONLY: the .catch(function(err) {...}) block inside sendTurn() in
  src/web-ui/routes/skills.js (client script string literals, ~line
  4121-4138). Do not touch the evt.inFlight branch (tpux-s1's own scope),
  computeArtefactSavePath, or any other function.
- Preserve the first retry's existing 2000ms delay exactly -- do not
  change its timing. Only retries AFTER the first one use 5000ms.
- The retry cap is 12 total attempts, reusing the SAME _inFlightRetryCount
  parameter tpux-s1 already threads through sendTurn's signature -- do not
  introduce a second counter.
- On exhausting the cap, fall through to the EXISTING dead-end message
  code unchanged -- do NOT call window.location.reload() anywhere in this
  block (see story's own Architecture Constraints for why this differs
  from tpux-s1's evt.inFlight treatment).
- The session-expired check and its message must remain completely
  unchanged and unaffected by the retry-count logic.
- Add new tests to the EXISTING test file
  tests/check-tpux-s1-turn-progress-ux.js -- do not create a new test file.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, short-track, DoR PROCEED: Yes)
