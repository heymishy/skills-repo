# Definition of Ready: Incident record mechanism

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s1-incident-record-mechanism-test-plan.md
**Assessed by:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Review

✅ Contract review passed — the proposed implementation (see `itar-s1-incident-record-mechanism-dor-contract.md`) aligns with all 4 ACs. Unit tests cover AC1/AC3's capture-time behaviour; integration tests cover AC2's append/create persistence and AC4's real-fixture migration. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "delivery engineer responding to an alert" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 4 unit; AC2: 2 integration; AC3: 1 unit; AC4: 1 integration |
| H4 | Out-of-scope populated | ✅ | 2 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Incident record mechanism" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | review-1.md: PASS, 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps table: "None" |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream "None" — no upstream dependencies declared, schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 5 bullets incl. ADR-026 reuse check; review found no Category E HIGH |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC in this story (no UI) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-incident-triage-and-respond/nfr-profile.md` |
| H-NFR2 | Compliance NFR w/ clause has sign-off | ✅ N/A | No compliance NFR with a named regulatory clause in this story |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in nfr-profile.md |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section is populated (not None); profile exists |
| H-GOV | Approved By ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" (M1: positive signal — clearly non-engineering) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story introduces no injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set for itar-s1 |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ N/A | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged via RISK-ACCEPT, see `decisions.md` 2026-11-09 entry (covers all 4 stories in this feature) |
| W5 | No UNCERTAIN gap-table items left | ✅ | — | Gap table: "None" |

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Incident record mechanism — artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s1-incident-record-mechanism.md
Test plan: artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s1-incident-record-mechanism-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only; follow this repo's existing CommonJS module conventions under scripts/lib/
- workspace/incidents.json is git-tracked (not gitignored) and append-only — never truncate or overwrite existing records (AC2)
- Normalize tags (trim, lowercase) at capture time inside createIncidentRecord — do not assume _jaccard or any downstream consumer will normalize (AC3)
- The bounded tag/summary length limit must be a named, exported constant (e.g. MAX_TAG_FIELD_LENGTH), never a hardcoded literal
- scripts/lib/incident-store.js's module code goes via branch + PR per CLAUDE.md's Platform change policy; workspace/incidents.json's own data writes do not require a standalone PR (non-governed per CLAUDE.md)
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint; no second engineering role exists to separately notify)
**Signed off by:** Not required
