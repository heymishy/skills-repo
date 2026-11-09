# Definition of Ready: Handoff to short-track pipeline + post-fix confirmation

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s4-handoff-and-post-fix-confirmation-test-plan.md
**Assessed by:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Review

✅ Contract review passed — the proposed implementation (see `itar-s4-handoff-and-post-fix-confirmation-dor-contract.md`) aligns with all 4 ACs. The two confirmation paths are named, distinct branches as the story's Architecture Constraints require — no single assumed-automated path. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "delivery engineer responding to an alert" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 2 unit; AC2: 2 unit + 1 integration; AC3: 2 unit + 1 integration; AC4: 1 unit |
| H4 | Out-of-scope populated | ✅ | 3 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Handoff + post-fix confirmation" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review-1.md: PASS, 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps table: "None" |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream "itar-s1, itar-s2" — `schemaDepends: [id, status, triageSummary]` declared against itar-s1/itar-s2's `INCIDENT` data-model (not `pipeline-state.json`). Separately, AC2/AC3's genuine `pipeline-state.json` dependency on `dodStatus` is confirmed present and schema-valid (`"dodStatus": {"type": "string", "enum": ["not-started", "complete"]}` in `pipeline-state.schema.json`). |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 bullets incl. the dual-path requirement and `product/constraints.md` #12/#13; review found no Category E HIGH |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC in this story (no UI) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-incident-triage-and-respond/nfr-profile.md` |
| H-NFR2 | Compliance NFR w/ clause has sign-off | ✅ N/A | No compliance NFR with a named regulatory clause in this story |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in nfr-profile.md |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section is populated (not None); profile exists |
| H-GOV | Approved By ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" (M1: positive signal) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story introduces no injectable adapter (the Teams-credential note is forward-looking and not yet active, per the story's own Architecture Constraints) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set for itar-s4 |

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
Story: Handoff to short-track pipeline + post-fix confirmation — artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
Test plan: artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s4-handoff-and-post-fix-confirmation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Attach to the EXISTING, unmodified short-track pipeline (/test-plan -> /definition-of-ready -> coding agent -> /definition-of-done) — do not add new fix/test/promote mechanics
- The automated-vs-manual confirmation path MUST be two explicit, named, separate branches (e.g. a confirmationMethod field with values 'automated'/'manual') — never a single assumed-automated path with a manual fallback inferred from absence of error
- On a not-confirmed result, the incident record's top-level status MUST remain open/flagged — never set to closed. This is the exact "falsely-closed record" failure mode AC4 exists to prevent.
- product/constraints.md #13: assert the confirmationStatus field was actually updated on the persisted record when a linked story reaches dodStatus: complete — not just that a handoff instruction was followed
- The Teams-credential rule (product/constraints.md #12) is forward-looking only — do not build a Teams-posting path in this story; note it for whoever eventually wires that integration
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint)
**Signed off by:** Not required
