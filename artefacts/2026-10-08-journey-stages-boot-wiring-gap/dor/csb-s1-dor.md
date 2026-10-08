# Definition of Ready Checklist

## Definition of Ready: Wire customer_journey_stages boot-time table creation

**Story reference:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/stories/csb-s1-wire-customer-journey-stages-boot-creation.md
**Test plan reference:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/test-plans/csb-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator of this platform's production deployment" |
| H2 | ≥3 ACs in Given/When/Then | ⚠️→✅ | 2 ACs — below the usual 3 minimum, but this is a single-statement additive DDL fix with no behavioural branches to enumerate; a third AC would be artificial. Matches the proportionality already applied to `jcg-s1` (also kept tight for an equally narrow fix) |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope section populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | Short-track correctness fix — direct benefit (closes a real deployability gap) stated in place of a tracked metric, matching `jcg-s1`/`tpux-s1`/`tpux-s2`'s own precedent |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | This story's whole purpose IS fixing an unmet schema dependency — no further upstream dependency of its own |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ N/A | Short-track skips `/review`; Architecture Constraints populated directly in the story with the exact root cause and fix shape |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No UI change at all |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ N/A | Short-track skips discovery |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | **This story exists specifically because this check was answered incorrectly at `ep1-s2`'s own DoR.** Applying it correctly here: the table-creation SQL is additive/idempotent (`CREATE TABLE IF NOT EXISTS`, matching the `credits`/`customer_journeys` precedent exactly); this story's own AC1 names the boot-wiring explicitly; the fix is a standalone task (nothing else changes); the wiring test (AC1's own test) asserts the real statement is present, not merely that some migration call exists |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — no schema shape change, only a boot-sequence creation statement for an already-designed, already-reviewed table |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — no UI change |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track skips `/review` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- Boot-time inline migration block convention (`credits`/`stripe_events`/`tenant_plan`/`customer_journeys`) confirmed — this story adds one more table to the same pattern, introducing nothing new structurally.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire customer_journey_stages boot-time table creation -- artefacts/2026-10-08-journey-stages-boot-wiring-gap/stories/csb-s1-wire-customer-journey-stages-boot-creation.md
Test plan: artefacts/2026-10-08-journey-stages-boot-wiring-gap/test-plans/csb-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/server.js (add customer_journey_stages' own
  CREATE TABLE IF NOT EXISTS + its 2 indexes to the existing boot-time
  inline migration block, immediately after the customer_journeys block
  ep1-s1 added -- copy the SQL VERBATIM from
  scripts/migrate-schema-journeys.js lines 46-64, do not re-derive or
  alter it) and tests/check-ep1-s1-journey-create.js (add ONE new test
  asserting the customer_journey_stages statement is present, mirroring
  that file's own existing "(boot) customer_journeys..." test exactly --
  this is the natural home for it since it already has the "(boot)"
  test-naming convention and reads server.js's source the same way).
  Do NOT touch journeys.js, any route handler, or
  check-ep1-s2-journey-stage-create.js.
- Do NOT wire feature_customer_journey_stage_mappings -- explicitly out
  of scope (no consumer yet).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** Yes (short-track story, correctness/deployability fix)
**Signed off by:** Hamish King — Platform Owner — 2026-10-08 (per operator's own "Move to next story if we have validated on chrome" instruction, applied here as a prerequisite found while grounding ep1-s3's own schema dependency -- fixed first so ep1-s3 doesn't build on the same unwired foundation)
