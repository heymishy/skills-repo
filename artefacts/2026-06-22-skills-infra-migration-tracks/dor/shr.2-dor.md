# Definition of Ready: shr.2 — Support `ops/` path prefix for standalone infra changes

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.2-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
The `scripts/check-pipeline-state-integrity.js` slug validator extended to accept feature slugs with an `ops/` prefix (e.g. `ops/2026-06-25-secrets-rotation`). The path-traversal guard verified to hold for `ops/`-prefixed artefact paths — `path.resolve(artefactPath).startsWith(path.resolve(repoRoot) + path.sep)` must evaluate true for valid ops paths and prevent escape for traversal sequences. Standard (non-ops) feature slugs are unaffected.

**What will NOT be built:**
Web UI journey or pipeline-state.json feature entry for ops changes. Automatic discovery of ops/ slugs from the filesystem. Any changes to STAGE_SEQUENCE, src/, or route handlers.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — ops/ slug accepted by integrity check | Unit: call the slug validator with `ops/2026-06-25-secrets-rotation`; assert no error | Unit |
| AC2 — artefact path under ops/ resolves within repoRoot | Unit: `node -e` or test file evaluates path.resolve for a valid ops artefact path; assert startsWith(repoRoot + sep) | Unit |
| AC3 — traversal guard holds for ops/ | Unit: construct traversal slug `ops/../../etc/passwd`; verify resolved path does NOT escape repoRoot | Unit |
| AC4 — standard slugs unaffected | Unit: run existing slug acceptance check for a standard feature slug; assert unchanged behaviour | Unit |

**Assumptions:**
The slug validator in `check-pipeline-state-integrity.js` uses a regex or string check that can be extended to include an `ops/YYYY-MM-DD-` prefix pattern. `path.resolve` + `startsWith` guard is already present for standard artefact paths or can be added as part of this story.

**Estimated touch points:**
Files: `scripts/check-pipeline-state-integrity.js`. Services: None. APIs: None.

**schemaDepends:** None — no upstream schema field dependencies.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. AC3 (traversal guard for ops/) is specifically addressed in the touch points and test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in GWT format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests covering all 4 ACs |
| H4 | Out-of-scope populated | ✅ | Web UI journey, auto-discovery excluded |
| H5 | Benefit linkage references named metric | ✅ | M1 — Infra track completion time |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | Path-traversal guard (ougl), ADR-012 — no HIGH findings |
| H-E2E | No CSS-layout ACs | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md exists |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR section present → nfr-profile exists | ✅ | nfr-profile.md exists |
| H-GOV | Approved By present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters | ✅ | N/A |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-----------------------|
| W1 | NFRs populated | ✅ | Security (path-traversal guard); Audit (no additional) |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder context; operator self-reviews — acknowledged |
| W5 | No UNCERTAIN items in test plan gap | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per shared-infrastructure.md — touches core pipeline machinery)
**Action:** Solo-founder context; Hamish King is operator and reviewer — awareness confirmed.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: shr.2 — Support ops/ path prefix for standalone infra changes
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/shr.2-test-plan.md
Test file: tests/check-shr2-ops-path.js
Test runner: node tests/check-shr2-ops-path.js

Goal:
Make every test in tests/check-shr2-ops-path.js pass. Extend the slug validator in check-pipeline-state-integrity.js to accept ops/ prefix slugs. Verify path-traversal guard holds for ops/ paths (traversal must not escape repoRoot). Standard slugs must remain unaffected.

Constraints:
- Touch: scripts/check-pipeline-state-integrity.js only
- Do NOT touch: src/, .github/skills/, pipeline-state.schema.json, bin/skills, any dashboard file
- Path-traversal guard is MANDATORY for ops/ paths: path.resolve(artefactPath).startsWith(path.resolve(repoRoot) + path.sep) must hold
- Script style: plain Node.js, CommonJS (require), no external npm dependencies
- ADR-012: platform-agnostic slug pattern — no assumption of specific VCS host or CI platform
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
