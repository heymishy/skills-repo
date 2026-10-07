# Definition of Ready Checklist

## Definition of Ready: /improve must default to Sonnet, matching the same conservative-absent-evidence precedent already applied to /ideate

**Story reference:** artefacts/2026-10-07-improve-skill-model-default/stories/imd-s1-default-improve-to-sonnet.md
**Test plan reference:** artefacts/2026-10-07-improve-skill-model-default/test-plans/imd-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator clicking 'Review' on a signal (or otherwise launching /improve)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1/AC2/AC3 unit tests, AC4 regression (existing suite) — per test plan's AC Coverage table |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | No formal metric moved (routing-correctness fix); direct benefit linkage stated in the story, matching this session's own precedent for non-metric-moving short-track fixes (`dswf-s1`, `wswda-s1`, `spdr-s1`/`spdr-s2`, `splc-s1`, `tsdg-s1`) |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ⚠️ **Short-track exemption** | No review report exists — short-track skips `/review` by design, per `CLAUDE.md`. Same documented exemption pattern as every other short-track story this session. Logged in `decisions.md`, 2026-10-07 entry. |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No dependencies on other stories; no `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with the real confirmed current state (direct code read of `model-routing.js`'s two skill lists) and a precedent-based justification quoting this codebase's own existing eval-evidence comments (EXP-021/006-038/044); no review ran (short-track), so no Category E findings exist to check — N/A by the same exemption as H7 |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — pure config/data change, no UI |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states specific per-category findings inline (None for Performance/Security; N/A for Accessibility; Cost is an explicit, deliberate, acknowledged tradeoff matching `/ideate`'s own precedent) — no feature-level NFR profile required |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ N/A | Story's NFR section is fully populated inline — check skipped per its own stated condition |
| H-GOV | Discovery `## Approved By` non-blank | ⚠️ **Short-track exemption** | No discovery artefact exists — short-track skips `/discovery` by design, per `CLAUDE.md`. Satisfied via the operator's own direct in-session instruction ("Let's fix improve defaults"). Logged in `decisions.md`, 2026-10-07 entry. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced or touched — `getModelForSkill` is a pure function, not an injectable adapter |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context; no standalone AC-verification-script artefact produced, matching this session's own established precedent for tiny short-track fixes | RISK-ACCEPT — same standing acknowledgement as every other short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table states "No gaps" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No section of this standards file applies specifically — this is a one-line data change to an existing, already-governed config module (`model-routing.js`), not a new route/view/session pattern.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full before implementing per this repo's own convention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /improve must default to Sonnet, matching the same conservative-absent-evidence precedent already applied to /ideate — artefacts/2026-10-07-improve-skill-model-default/stories/imd-s1-default-improve-to-sonnet.md
Test plan: artefacts/2026-10-07-improve-skill-model-default/test-plans/imd-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS — no new npm dependencies
- Modify ONLY the DEFAULT_SONNET_SKILLS array literal in
  src/web-ui/config/model-routing.js — add 'improve', do not touch
  HAIKU_BLOCKED_SKILLS, DRIFT_GUARD_SONNET_SKILLS, or any function body
- Do NOT touch src/improvement-agent/ -- confirmed unrelated, out of scope
- Add new tests to the EXISTING tests/check-psrc-s1-model-routing-config.js
  file — do not create a second test file for the same module
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
