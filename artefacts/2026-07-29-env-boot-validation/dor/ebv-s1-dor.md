# Definition of Ready Checklist

## Definition of Ready: Warn at boot time for silently-misconfigured-but-optional env vars

**Story reference:** artefacts/2026-07-29-env-boot-validation/stories/ebv-s1-boot-time-env-var-warnings.md
**Test plan reference:** artefacts/2026-07-29-env-boot-validation/test-plans/ebv-s1-boot-time-env-var-warnings-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operational diagnosability, quantified with 4 confirmed incidents (1 already resolved, 3 in scope) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Extends existing `validate-env.js` (ADR-004), reuses existing boot call site |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI surface |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No data involved — env-var presence/absence only, no secret values logged |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No /review run (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Solo-operator posture, same basis as prior short-track stories this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap (operator actually reading logs) has an explicit, accepted mitigation | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Warn at boot time for silently-misconfigured-but-optional env vars — artefacts/2026-07-29-env-boot-validation/stories/ebv-s1-boot-time-env-var-warnings.md
Test plan: artefacts/2026-07-29-env-boot-validation/test-plans/ebv-s1-boot-time-env-var-warnings-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Read src/web-ui/config/validate-env.js in full before writing anything.
  Add a new exported function (e.g. warnOnOptionalEnvVars(envVars, logger))
  in that same file, following its existing style. Do NOT modify
  validateRequiredEnvVars() or REQUIRED_ENV_VARS.
- The function must be injectable (accept an envVars map and a logger,
  matching src/web-ui/modules/posthog-config.js's own established
  injection pattern for testability) rather than reading process.env
  directly inside the function body -- this is what makes it unit
  testable without mutating real process.env.
- The function must NEVER throw and NEVER call process.exit -- warnings
  only, via logger.warn (default to console if no logger injected).
- Cover exactly the 3 cases named in the story's ACs: PLATFORM_TENANT_ID,
  ADMIN_GITHUB_LOGINS (including the "present but empty-after-parsing"
  edge case), and the SKILL_EXECUTOR_PROVIDER/ANTHROPIC_API_KEY pairing
  (both the anthropic-missing-key case and the copilot-per-user-token
  caveat case) -- do not add a 4th check or generalise into a framework.
- Wire the new function into src/web-ui/server.js's existing startup
  block, called alongside (not replacing) validateRequiredEnvVars(),
  before server.listen(). No try/catch needed around it since it never
  throws.
- Write a static-analysis-free, pure unit test file (new file, e.g.
  tests/check-ebv-s1-boot-time-env-var-warnings.js) covering U1-U11
  exactly as described in the test plan, injecting synthetic env maps
  and a captured logger (an object with a warn() method that pushes
  messages to an array) -- do not spawn a real child process or mutate
  real process.env.
- Do not touch posthog-config.js -- confirmed already correct, out of
  scope per the story.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — additive-only, non-blocking (never throws/exits), extends an already-proven pattern (`validateRequiredEnvVars()`) with a second function covering 3 well-understood, already-diagnosed incidents. No existing behaviour is modified.
**Sign-off required:** No
**Signed off by:** Hamish King — Platform owner — requested this follow-up directly, 2026-07-29
