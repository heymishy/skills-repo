## Definition of Ready: Close the E2E verification blind spot in /verify-completion and /branch-complete

**Story reference:** artefacts/2026-08-24-e2e-verification-coverage-gap/stories/evcg-s1-verify-completion-route-e2e-check.md
**Test plan reference:** artefacts/2026-08-24-e2e-verification-coverage-gap/test-plans/evcg-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "coding agent running /verify-completion before opening a PR" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC5 each have exactly 1 dedicated test, plus 3 additional tests (integration, NFR, out-of-scope guard, non-regression) — 9 total |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — matches this session's own `rcfc-s1`/`sec-perf-s2/s3` precedent |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — `/review` explicitly skipped per `CLAUDE.md`'s short-track flow |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; explicitly scopes out the full unscoped `test:e2e` suite as a rejected alternative, with reasoning |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs — this story changes agent instruction text only |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | Story's own NFR section populated, all "Not applicable" with reasoning — no dedicated `nfr-profile.md` needed, matching `rcfc-s1`'s sibling short-track precedent where NFRs are genuinely trivial |
| H-GOV | Governance approval | ✅ N/A | No discovery artefact exists for this short-track feature — operator directly reviewing in-session |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new injectable adapter introduced |
| H-INF / H-MIG | Infra-plan / migration-review gates | ✅ N/A | Neither track flag set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review report exists (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | This story has no manual AC verification script — every AC is closed entirely by the automated content-assertion test suite (`check-evcg-s1-verify-completion-e2e-check.js`), which itself includes an integration test that runs the real governance script end-to-end. No human-in-the-loop manual scenario exists to review. | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | — | — |

---

## Oversight level

**Medium** — matches this session's established precedent for solo-operator short-track stories. Operator confirmed awareness of this DoR artefact before assignment (explicit instruction: "let's close this gap").

---

## Standards injection

**Domain tags:** `pipeline-infrastructure`, `testing`
**Matched standards files:** None — neither domain tag has an entry in `.github/standards/index.yml`. No standards text is injected below; this is expected for a pipeline-infrastructure-only change with no application-code surface.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Close the E2E verification blind spot in /verify-completion and /branch-complete
  — artefacts/2026-08-24-e2e-verification-coverage-gap/stories/evcg-s1-verify-completion-route-e2e-check.md
Test plan: artefacts/2026-08-24-e2e-verification-coverage-gap/test-plans/evcg-s1-test-plan.md

Goal:
Make every test in tests/check-evcg-s1-verify-completion-e2e-check.js pass.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- This is a SKILL.md instruction-text change to skills/verify-completion/SKILL.md
  and skills/branch-complete/SKILL.md, plus a matching entry update in
  .github/scripts/check-skill-contracts.js — no application code, no new
  dependencies, no CI workflow changes
- Do NOT make /verify-completion or /branch-complete run the full, unscoped
  `npm run test:e2e` suite unconditionally — scope the new check to only the
  specific matched spec file(s) for routes the diff actually touches
- The check must be conditional: stories that touch no route/handler file
  must explicitly state "N/A" and skip it, not run it unconditionally
- branch-complete's own Step 1 addition must reference verify-completion's
  check by name, not duplicate its full instruction text
- Update check-skill-contracts.js's CONTRACTS entries for both skills so a
  future edit cannot silently strip this step without failing governance
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech-lead awareness (no separate tech lead in this solo-operator repo — operator confirmed awareness directly via explicit instruction to proceed, 2026-08-24)
**Signed off by:** Hamish King (Founder/Operator), 2026-08-24
