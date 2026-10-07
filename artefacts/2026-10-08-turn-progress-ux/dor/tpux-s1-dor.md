# Definition of Ready Checklist

## Definition of Ready: Show visible progress during hidden continuation turns, and auto-recover from the in-flight "still processing" guard

**Story reference:** artefacts/2026-10-08-turn-progress-ux/stories/tpux-s1-visible-progress-and-inflight-autorecover.md
**Test plan reference:** artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator running a content-heavy skill turn ... that triggers a hidden auto-continuation" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (short-track UX fix); direct benefit linkage stated in the story with real, same-day operator-observed evidence across 3 named skills |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session (`splc-s1`, `tsdg-s1`, `sch-s1`, `imd-s1`). Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; one documented gap-type entry (structural source-text vs. runtime DOM evidence, explained in Coverage gaps) — not left uncertain |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tsdg-s1` and `sch-s1` as upstream — code-adjacency only (same handler, same guard, same error-event shape); `inFlight` is a new additive field on an existing event, not a `pipeline-state.schema.json` dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed root cause for both compounding bugs (exact line references), and the specific fix shape chosen with rationale for reusing existing mechanisms rather than inventing new ones; no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — this is JS control-flow (when a DOM element is removed, when a retry is scheduled) and a server SSE field, not rendering/layout |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings inline (Performance negligible; Security none identified; Reliability covered by AC4's bounded-retry requirement; Accessibility no regression) — no feature-level NFR profile required |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session bug report (2026-10-08) describing the exact symptom this story fixes. Logged in `decisions.md`. |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context; no standalone AC-verification-script artefact produced, matching this session's own established precedent | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table explains the structural-vs-runtime evidence choice, not left uncertain | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No section of this standards file applies specifically — this is a client-script control-flow fix plus one additive field on an existing SSE event, not a new route/view/session pattern.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Show visible progress during hidden continuation turns, and auto-recover from the in-flight "still processing" guard instead of dead-ending — artefacts/2026-10-08-turn-progress-ux/stories/tpux-s1-visible-progress-and-inflight-autorecover.md
Test plan: artefacts/2026-10-08-turn-progress-ux/test-plans/tpux-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies, no new test infrastructure
  (no jsdom/browser harness) -- verification for the client-script changes
  is via source-text structural assertions, matching this repo's own
  existing convention (see sch-s1 AC1).
- Modify ONLY: (1) the three thinkingDiv-removal conditions inside
  sendTurn's reasoningChunk/chunk/draftChunk handlers in
  src/web-ui/routes/skills.js (client script string literals, ~line
  3923-4109); (2) the evt.error handling block in the same function
  (~line 4075-4084) to add the evt.inFlight quiet-retry/reload branch;
  (3) sendTurn's own parameter list to thread a retry-count through the
  recursive calls; (4) the single res.write call in the server-side
  in-flight guard in handlePostTurnStreamHtml (~line 4976) to add
  inFlight: true to the JSON payload. Do not touch any other function or
  any other SSE event type.
- The quiet-retry loop MUST be capped at exactly 12 attempts (12 x 5000ms
  = 60000ms), matching the server's own 60s staleness window from tsdg-s1
  -- this is a hard correctness requirement (AC4), not a tunable default.
  On reaching the cap, call window.location.reload() -- do not schedule a
  13th retry and do not fall back to the old red-message behaviour.
- A non-inFlight evt.error (AC5) must remain byte-for-byte unchanged --
  do not refactor that branch while adding the new one.
- Reuse the SAME attemptId across quiet retries (the existing _attId
  closure), exactly like the existing single network-retry at ~line 4100
  already does -- do not generate a new attemptId per retry.
- Add new tests to the EXISTING test file
  tests/check-srar-s1-idempotent-turn-reconnect.js for AC2 (server-side,
  behavioural, extends the existing mockRes()/res._events harness). For
  AC1/AC3/AC4/AC5 (client-script structural checks), create ONE new test
  file following this repo's naming convention
  (tests/check-tpux-s1-turn-progress-ux.js) since no existing file
  touches the client script's source text -- do not scatter these across
  multiple files.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
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
