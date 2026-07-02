# Definition of Ready — lab-s1.1 — Auth tech spike: ESM/CJS path recommendation

**Story:** lab-s1.1
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 9 tests covering 5 ACs
**Verification script:** 5 scenarios

---

## Contract Proposal

See `dor/lab-s1.1-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. Document-verification approach is appropriate for a spike story whose AC1 deliverable is an artefact, not executable code. No AC requires a browser or integration environment.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As the operator…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 5 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | PASS | T1.1–T2.2, NFR1 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 4 explicit exclusions |
| H5 | Benefit linkage references a named metric | PASS | M1 — self-serve signup conversion |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings from review | PASS | Review: PASS, 0 HIGH findings |
| H8 | Test plan has no uncovered ACs (or gaps acknowledged) | PASS | AC3/AC4 conditional — acknowledged in gap table |
| H8-ext | Cross-story schema dependency check | PASS | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | PASS | CJS-only, ADR-011, npm relaxation documented |
| H-E2E | CSS-layout-dependent ACs have RISK-ACCEPT | PASS | No CSS-layout ACs in this story |
| H-NFR | NFR profile exists at `artefacts/2026-07-01-landing-auth-billing/nfr-profile.md` | PASS | File confirmed present |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | PASS | No regulatory clauses — "None" per NFR profile |
| H-NFR3 | Data classification field in NFR profile is not blank | PASS | Public / Internal / Confidential / Restricted classified |
| H-NFR-profile | Story declares NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | `## Approved By` in discovery.md has ≥1 non-blank named entry | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | No new injectable adapters in this story |
| H-INF | Infra-plan gate | PASS | hasInfraTrack not set — skipped |
| H-MIG | Migration-review gate | PASS | hasMigrationTrack not set — skipped |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None — confirmed" | PASS — NFRs present (no credentials, time-boxed) |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | PASS — 4 MEDIUM findings resolved (recorded in review artefact, all marked resolved) |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator (Hamish King). W4 RISK-ACCEPT logged in `decisions.md` per ADR established at review phase. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | PASS — Conditional ACs (AC3/AC4) explicitly acknowledged in gap table |

---

## Oversight Level

**Low** — personal-scope project (context.yml: `scope: personal`). No second reviewer or tech lead required. Proceed directly to inner loop.

---

## Standards Injection

No `domain` field on this story — standards injection skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s1.1

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged (decisions.md)
Oversight: Low

---

## Coding Agent Instructions

**Story:** lab-s1.1 — Auth tech spike: ESM/CJS path recommendation
**Complexity:** 2 | **Oversight:** Low

### What to build

Conduct a time-boxed investigation (max 1 operator day) to choose between:
- **Path A** — dynamic `import()` wrapper to consume ESM-only Better Auth from CJS server
- **Path B** — full ESM migration of the web-ui server (`"type": "module"` in package.json)
- **Path C** — roll-your-own OAuth abstraction using `fetch()`, no Better Auth package

Produce `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` with all 5 required sections (AC1). Update `artefacts/2026-07-01-landing-auth-billing/decisions.md` ARCH-002 entry with the chosen path (AC5).

### Required touchpoints

- `artefacts/2026-07-01-landing-auth-billing/research/auth-spike-outcome.md` — CREATE (new spike outcome doc, all 5 AC1 sections required)
- `artefacts/2026-07-01-landing-auth-billing/decisions.md` — MODIFY ARCH-002 (replace "DEFERRED to spike exit" with chosen path + rationale)

### MUST NOT touch

- `src/web-ui/` — no implementation code in this story
- `package.json` — no committed package changes (local-only test installs are allowed but must not be staged)
- Any test files — no new test files; existing tests must still pass

### Test runner

`node tests/check-lab-s1.1-auth-spike.js` — verifies artefact completeness (document read, not code execution)

### AC verification order

1. Write spike outcome doc with all 5 sections
2. Update decisions.md ARCH-002
3. Run test runner — all checks should pass
4. If Path C: run proof-of-concept (AC3)
5. If Path A/B: confirm Neon adapter note in artefact (AC4)

### Architecture constraints

- CJS-only baseline: if Path B is recommended, the migration cost estimate is mandatory in the spike outcome doc
- No credentials in spike artefact: use placeholders only for any API keys or connection strings
- The spike exits with a decision regardless of remaining unknowns — exit time-box with a recommendation, not "needs more investigation"

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs required beyond W4 (already logged)
1. /branch-setup — create worktree
2. /implementation-plan — single-task plan (write spike outcome doc + update decisions.md)
3. /subagent-execution
4. /verify-completion — run test runner + manual spot-check of artefact sections
5. /branch-complete — draft PR
