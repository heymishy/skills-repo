# Definition of Ready Checklist

## Definition of Ready: Harden all 3 SSE endpoints against idle-connection drops

**Story reference:** artefacts/2026-10-07-sse-connection-hardening/stories/sch-s1-shorten-keepalive-and-anti-buffer-headers.md
**Test plan reference:** artefacts/2026-10-07-sse-connection-hardening/test-plans/sch-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator whose SSE connection ... is vulnerable to being dropped by something upstream of our own server" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (defensive hardening, explicitly framed as mitigation not guaranteed fix); direct benefit linkage stated in the story with real session-observed evidence (6 incidents, 5.1s-51.8s spread) and an external, matched community bug report |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session. Logged in `decisions.md`, 2026-10-07 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete; one documented gap-type entry (AC1's source-regex evidence type) explained, not left uncertain |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names `tsdg-s1` as upstream — code-adjacency only (same handler family), no `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed current state of all 3 SSE endpoints, honest root-cause-status framing (mitigation, not fix), and the specific new-interval safety risk (test-hang) named and resolved via `.unref()`; no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — pure server-side header/interval change, no UI |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings inline (Performance negligible; Security N/A; Reliability covered by AC4/AC5; Accessibility N/A) — no feature-level NFR profile required |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("Hardening please"). Logged in `decisions.md`, 2026-10-07 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — pure header/interval literal changes to existing, non-adapter handler code |
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
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table explains AC1's evidence-type choice, not left uncertain | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No section of this standards file applies specifically — this is a defensive header/interval hardening change to 3 already-governed SSE handlers, not a new route/view/session pattern.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Harden all 3 SSE endpoints against idle-connection drops — artefacts/2026-10-07-sse-connection-hardening/stories/sch-s1-shorten-keepalive-and-anti-buffer-headers.md
Test plan: artefacts/2026-10-07-sse-connection-hardening/test-plans/sch-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies
- Modify ONLY: (1) handlePostTurnStreamHtml's keepalive interval literal
  and header object in src/web-ui/routes/skills.js; (2) the header object
  in handleGetJourneyPresenceStream in src/web-ui/routes/journey.js;
  (3) the header object AND the new keepalive interval + its close-handler
  clearInterval in handleGetArtefactMergeStream in
  src/web-ui/routes/journey.js. Do not touch any other function.
- The new merge-broadcast interval MUST be created with .unref() and MUST
  be cleared inside the handler's existing res.on('close', ...) callback
  alongside its pre-existing unsubscribe() call -- this is a hard
  correctness requirement, not a style preference (see story's own
  Architecture Constraints for why: a test file that does not call
  process.exit() would hang otherwise).
- Do NOT change fly.toml or any Dockerfile/deployment configuration
- Add new tests to the EXISTING 3 test files named in the test plan --
  do not create new test files for these handlers
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
