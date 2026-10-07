# Definition of Ready Checklist

## Definition of Ready: Fix storyId drift in Web UI DoR/test-plan artefact saves, and prefer the last unambiguous verdict line in review-artefact-splitter

**Story reference:** artefacts/2026-10-08-web-ui-outer-loop-artefact-integrity/stories/wuai-s1-storyid-drift-and-verdict-splitter-fix.md
**Test plan reference:** artefacts/2026-10-08-web-ui-outer-loop-artefact-integrity/test-plans/wuai-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator running a multi-story feature's discovery-through-DoR outer loop entirely via the Web UI" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 7 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (short-track artefact-integrity fix); direct benefit linkage stated with a real, confirmed, concrete incident on `2026-10-05-customer-journey-as-first-class` |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session. Logged in `decisions.md`. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | No upstream story dependency; downstream note (missing ep1-s2 review file regeneration) is explicitly artefact-only, not a code dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with exact confirmed root causes (line references) for both bugs, and explicit rationale for the chosen fix shape over the alternative (fixing index-advancement) in `decisions.md` D1; no review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — server-side path resolution and string parsing only |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section fully populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery`, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("ensure any gaps or bugs fixed too"). Logged in `decisions.md`. |
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
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No section of this standards file applies specifically — this is a bugfix to existing artefact-save-path resolution and existing string-parsing logic, not a new route/view/session pattern.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix storyId drift in Web UI DoR/test-plan artefact saves, and prefer the last unambiguous verdict line in review-artefact-splitter — artefacts/2026-10-08-web-ui-outer-loop-artefact-integrity/stories/wuai-s1-storyid-drift-and-verdict-splitter-fix.md
Test plan: artefacts/2026-10-08-web-ui-outer-loop-artefact-integrity/test-plans/wuai-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies
- Modify ONLY: (1) a new helper function in src/web-ui/routes/skills.js
  (near computeArtefactSavePath, ~line 2390) that resolves the real
  storyId from artefact content, validated against the linked journey's
  storyList; (2) the two call sites that currently pass
  session.currentStoryId directly into computeArtefactSavePath (~line
  2696 and ~line 5494), updated to use the new helper's return value;
  (3) extractVerdict() in src/web-ui/utils/review-artefact-splitter.js
  (~line 60-68), changed from first-match to last-unambiguous-match
  semantics. Do not touch computeArtefactSavePath itself, linkSessionToJourney,
  advanceToNextStory, or any other function.
- Do NOT call advanceToNextStory() or otherwise modify
  journey.currentStoryIndex -- out of scope per the story's own Decision D1.
- The new storyId-resolution helper MUST validate a parsed Story field
  value against the linked journey's own storyList before trusting it --
  an unvalidated parse is not acceptable (AC2's "unknown story" case must
  still fall back safely).
- extractVerdict's fail-safe "return null when genuinely ambiguous, never
  guess" contract (asf-s1) MUST be preserved exactly -- AC6 is a hard
  correctness requirement, not optional.
- Add new tests to the EXISTING test files named in the test plan
  (tests/check-srar-s1-idempotent-turn-reconnect.js and
  tests/check-revs-s1-review-artefact-splitter.js) -- do not create new
  test files for this story.
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
