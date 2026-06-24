# Definition of Ready: inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.4-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25 (re-run after shr.1 merged — H8-ext block resolved)

---

## Contract Proposal

**What will be built:**
The `/definition-of-ready` SKILL.md is extended with a new hard block **H-INF** that fires when a story entry in `pipeline-state.json` carries `hasInfraTrack: true`. H-INF checks that `infraPlanPath` is set and that the artefact at that path contains a status PASS line. If the check fails, the DoR cannot reach sign-off. If `hasInfraTrack` is absent or false, H-INF does not appear — existing H1-H9, H-E2E, H-NFR, H-GOV blocks are completely unaffected.

**What will NOT be built:**
Automatic setting of `hasInfraTrack` based on story content. H-MIG (that is mig.3). Any UI changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — H-INF appears when hasInfraTrack true | Unit: SKILL.md instruction text contains H-INF block with hasInfraTrack trigger condition | Unit |
| AC2 — FAIL when infraPlanPath absent or no PASS | Unit: instruction text specifies FAIL condition for absent/no-PASS path | Unit |
| AC3 — PASS when infraPlanPath points to PASS artefact | Unit: instruction text specifies PASS condition for valid sign-off path | Unit |
| AC4 — H-INF absent when hasInfraTrack false/absent | Unit: instruction text specifies conditional trigger; AC4 scenario documented in out-of-scope section | Unit |

**Assumptions:**
The DoR SKILL.md is instruction text executed by Claude — tests assert text content, not runtime behaviour. The SKILL.md addition follows the existing H-block format in the DoR SKILL.md.

**Estimated touch points:**
Files: `.github/skills/definition-of-ready/SKILL.md`. Services: None. APIs: None.

**schemaDepends:** [hasInfraTrack, infraPlanPath] — BOTH PRESENT in `pipeline-state.schema.json` (added by shr.1 ✅)

---

## Contract Review

✅ **Contract review passed** — all ACs covered; no contradiction with test plan; no out-of-scope creep.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Agent |
| H2 | ≥3 ACs in GWT format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9 tests covering all 4 ACs |
| H4 | Out-of-scope populated | ✅ | auto-setting hasInfraTrack, H-MIG excluded |
| H5 | Benefit linkage references named metric | ✅ | M2 — DoR gate enforcement correctness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends [hasInfraTrack, infraPlanPath] — BOTH present in schema (shr.1 merged 2026-06-25) |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-003 met (shr.1 merged), ADR-011 (PR required — acknowledged), C7 constraint (additive only) — no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — SKILL.md text change only |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md; Audit NFR: finding text must name expected path |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters introduced | ✅ | N/A — instruction text only |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs populated | ✅ | Audit NFR present |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | None |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder context — operator self-reviews; acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

W4 acknowledged: Solo-founder repo, no separate domain expert. Hamish King self-reviews.

---

## Oversight

**Level:** Medium (inf.4 modifies the DoR SKILL.md — a governing artefact; Medium oversight per infra-track epic)
**Action:** Share DoR artefact with tech lead before assigning. Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

**Note on delivery dependency:** inf.4 should be implemented AFTER inf.3 (infra-plan SKILL.md) exists, per story dependencies. This DoR signs off the readiness of the story artefacts — timing of implementation is a scheduling concern.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: inf.4 — Add H-INF hard block to /definition-of-ready SKILL.md
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.4-test-plan.md
Test file: tests/check-inf4-h-inf-gate.js
Test runner: node tests/check-inf4-h-inf-gate.js

Goal:
Make every test in tests/check-inf4-h-inf-gate.js pass. Add H-INF hard block instruction text to .github/skills/definition-of-ready/SKILL.md. The block must: (1) trigger when hasInfraTrack: true; (2) FAIL when infraPlanPath is absent or the artefact at that path has no status PASS line; (3) PASS when infraPlanPath points to a PASS artefact; (4) not appear at all when hasInfraTrack is absent or false.

Constraints:
- Touch: .github/skills/definition-of-ready/SKILL.md ONLY
- Do NOT touch: src/, other SKILL.md files, tests/ (other than the test file for this story), pipeline-state.json
- H-INF is purely additive — existing H1-H9, H-E2E, H-NFR, H-GOV, H-ADAPTER blocks are unchanged
- Finding text for H-INF FAIL must name the expected infraPlanPath value
- ADR-004: instruction text must not hardcode tool names (Terraform, Pulumi, etc.)
- Platform change policy: this SKILL.md change must be merged via PR
- Open a draft PR when tests pass — do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (share this artefact)
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
