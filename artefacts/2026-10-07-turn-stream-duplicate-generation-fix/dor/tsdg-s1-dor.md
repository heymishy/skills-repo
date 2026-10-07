# Definition of Ready Checklist

## Definition of Ready: Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one

**Story reference:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/stories/tsdg-s1-broaden-inflight-turn-guard.md
**Test plan reference:** artefacts/2026-10-07-turn-stream-duplicate-generation-fix/test-plans/tsdg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator submitting a long-running skill turn whose SSE connection drops mid-generation" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1/AC2 unit tests, AC3 regression (existing suite), AC4 documented audit — per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (cost/correctness fix); direct benefit linkage stated in the story with real production evidence (duplicate `$ai_generation` billing, duplicate credit deduction, overwritten artefact), matching this session's own precedent for non-metric-moving short-track fixes |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as `dswf-s1`/`wswda-s1`/`spdr-s1`/`spdr-s2`/`splc-s1` this session. Logged in `decisions.md`, 2026-10-07 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `srar-s1` as upstream — code-level guard-logic dependency only, no `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed root cause (direct code read of `skills.js`'s existing `srar-s1` guard), live production correlation (Fly logs + PostHog `$ai_generation` cost/trace data), and a full "check elsewhere" audit with reproducible `grep` evidence; no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — pure server-side handler/concurrency-guard fix, no UI change |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings inline (Performance: net positive; Security/Accessibility: none/N/A; Audit/Cost: this fix IS the audit/cost correction) — no feature-level NFR profile required for a short-track story with no open NFR questions |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("Do proper fix, regardless of size") in response to a live-confirmed, cost-impacting production defect. Logged in `decisions.md`, 2026-10-07 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — this fixes the existing `handlePostTurnStreamHtml`'s own internal concurrency-guard logic, does not change `setSkillTurnExecutorStreamAdapter`'s shape or wiring |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS**, with H7 and H-GOV satisfied via the documented short-track exemption (not silently bypassed — both logged transparently in `decisions.md`, matching this session's own established precedent).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context; no standalone AC-verification-script artefact produced, matching `splc-s1`/`spdr-s1`/`spdr-s2`'s own precedent of folding verification into the test plan's AC Coverage table for short-track fixes | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table explains AC4's documentation-not-runtime nature, not left uncertain | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- **Concurrency/idempotency convention:** This fix brings `handlePostTurnStreamHtml`'s in-flight guard in line, in spirit, with `handlePostTurnHtml`'s own already-correct `turnInProgress`-before-any-work pattern — both now correctly block concurrent work for a session/journey regardless of which specific request identifier arrives second.
- No other section of this standards file applies — this is an internal concurrency-guard fix with no new route, view, or session-handling surface.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Streaming turn endpoint must block a new attemptId while any turn is already in-flight, not just a matching one — artefacts/2026-10-07-turn-stream-duplicate-generation-fix/stories/tsdg-s1-broaden-inflight-turn-guard.md
Test plan: artefacts/2026-10-07-turn-stream-duplicate-generation-fix/test-plans/tsdg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies
- Modify ONLY the srar-s1 in-flight/resume guard inside
  handlePostTurnStreamHtml() in src/web-ui/routes/skills.js (lines
  ~4948-4966 as of this story) — do not touch handlePostTurnHtml(), any
  other function, or any client-side script string
- Keep the "same attemptId + status complete -> resumed:true" branch
  requiring an exact attemptId match, unchanged
- Broaden ONLY the in-flight branch to check session._lastAttempt.status
  === 'in-flight' and non-stale (<60s), regardless of whether the
  incoming attemptId matches session._lastAttempt.attemptId
- Do NOT change the 60-second staleness threshold, the keepalive interval,
  the "still processing" error message text, or fly.toml
- Add new tests to the EXISTING tests/check-srar-s1-idempotent-turn-reconnect.js
  file — do not create a second test file for the same guard
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
