## Definition of Ready: Real telemetry signal feed

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s3-real-telemetry-signal-feed-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

**Review:** PASS — Run 1, 2026-11-09 (0 HIGH, 0 MEDIUM, 0 LOW)
**Test plan:** 9 tests covering 4 ACs (4 unit, 4 integration, 1 NFR — security)
**Verification script:** 4 scenarios

---

## Contract Review

✅ **Contract review passed** — proposed implementation (PostHog enrichment of `ddft-s2`'s scan output, mocked in tests per External-dependency gap handling) aligns with all 4 ACs. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a delivery engineer / platform owner reviewing what's been deferred" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | "Real telemetry signal feed quality" |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | PostHog mocking is an explicitly-acknowledged External-dependency gap type, not a silent skip |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `ddft-s2` (not "None"). `schemaDepends: ["dorStatus"]` declared, gating on `ddft-s2.dorStatus === "signed-off"`. Field present — PASS. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (real-volume citation, credential-handling constraint, keying rule, self-application note); no Category E findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC typed `CSS-layout-dependent` |
| H-NFR | NFR profile exists | ✅ | Exists |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR with a named regulatory clause applies — the credential-storage NFR (`product/constraints.md` #12) is a mandatory constraint, not a named regulatory clause |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" checked |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section populated; feature profile exists |
| H-GOV | Governance approval check | ✅ | Same as ddft-s1 — PASS, M1 positive |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This story reads an existing PostHog integration already available to the repo; it does not introduce a new `setX()`-style injectable adapter of its own |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent/false |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent/false |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent/false |

**All hard blocks: 18/18 passed (4 N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No independent reviewer exists in this project | Acknowledged — same RISK-ACCEPT in `decisions.md` covering all 5 of this feature's stories |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | — |

**1 warning acknowledged (W4), 4 passed cleanly.**

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Real telemetry signal feed — artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
Test plan: artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s3-real-telemetry-signal-feed-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do not add any new PostHog instrumentation — consume existing events only.
- Treat PostHog data as supplementary signal only — never an input to an automated decision or action.
- If this ever runs as a CI-scheduled script rather than this interactive session, the PostHog API key must live in a secrets store, never the agent's own environment (product/constraints.md #12). Never log the API key.
- AC4 requires this story's own sparse-telemetry finding to be registered as a new deferred-item record on first real run via ddft-s1's mechanism — do not skip this as "just a note," it is a tested acceptance criterion.
- This story requires ddft-s2 to have shipped first — do not begin until ddft-s2's PR has merged.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint; no second engineering role exists to separately notify)
**Signed off by:** Not required
