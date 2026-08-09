# Definition of Ready: Validate findings-extraction signal quality on a real human-narrated recording

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s1-validate-extraction-signal-quality.md
**Test plan reference:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s1-test-plan.md
**Contract proposal:** artefacts/2026-08-09-rubber-duck-review-capture/dor/rdrc-s1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "developer/operator running the outer loop" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: integration+manual; AC2: unit; AC3: manual; AC4: unit+manual |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 named exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Meta Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1/AC3/AC4 gaps explicitly acknowledged in test plan's Coverage gaps table |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — no upstream story declared, schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D1 platform-availability note present; review Category E: 0 findings |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-09-rubber-duck-review-capture/nfr-profile.md |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance NFRs — Tier 3 not applicable per benefit-metric.md |
| H-NFR3 | Data classification field not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists at the path above |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | "Hamish King — Operator — 2026-08-09" — role not clearly non-engineering; **M1 signal recorded: role unverified for independent sign-off quality** |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | This story introduces no `setX()` injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | Unstable — flagged in story; epic already carries a "more frequent check-ins after Story 1" note | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — RISK-ACCEPT-1 logged in decisions.md (solo-operator context, same person implements and verifies) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Both gaps have explicit, non-"UNCERTAIN" handling decisions | — |

---

## Standards injection

Domain tags: none — this story has no `domain` field (it produces a standalone script, not a tagged-domain surface change). Skipped silently per the skill's own rule.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Validate findings-extraction signal quality on a real human-narrated recording — artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s1-validate-extraction-signal-quality.md
Test plan: artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js, CommonJS, matching this repo's existing script conventions
  (see scripts/write-version-file.js, scripts/write-learnings-count-file.js
  for the pure-function/main() split pattern).
- Select a speech-to-text vendor before writing AC1's integration test.
  Log the choice as a new decision entry in
  artefacts/2026-08-09-rubber-duck-review-capture/decisions.md (title, date,
  context, decision, rationale) before wiring the real API call — this is
  the platform-availability gap the story's own D1 decision already flagged.
- No UI, no skill invocation wrapper, no automatic capture-log.md write —
  this story is a standalone validation script only (Story 2 wires it into
  a real tool).
- Reuse this repo's existing LLM-invocation conventions for the extraction
  pass; any test exercising it must run through the mock-LLM-gateway safety
  net (mgar-s1) — never a real, billed LLM call in automated tests.
- Never persist the raw recording or full transcript beyond the immediate
  run (AC1/AC2's transient-data requirement) — no repo commit, no durable
  temp file left behind.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when automated tests pass — do not mark ready for review.
  AC3's manual scenario (operator judges ≥5 real findings) and AC1's real
  vendor round-trip happen after the automated tests are green, using the
  verification script at
  artefacts/2026-08-09-rubber-duck-review-capture/verification-scripts/rdrc-s1-verification.md.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead (operator) awareness required; DoR artefact shared as part of this session's own record.
**Signed off by:** N/A — proceed directly per Medium oversight rules.

**PROCEED: Yes**
