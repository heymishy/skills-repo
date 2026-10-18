# Definition of Ready: CLI entrypoint authenticates against staging and captures one real screenshot end to end

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s1-dor-contract.md
**Date:** 2026-10-19

---

## Contract review

No mismatches between the Contract Proposal and the story's own ACs/test plan — the updated test plan (AC2's own unit test added after operator review) matches the contract exactly. ✅ **Contract review passed.**

---

## Checklist — Hard blocks

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| H1 | User story As/Want/So, named persona | ✅ | "operator/engineer" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1 integration+manual, AC2 unit+manual, AC3/AC4 unit |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | M1, M2 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH |
| H8 | No uncovered ACs | ✅ | AC1/AC2 gap acknowledged with explicit handling |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — no upstream story, first in epic |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints; review Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ (different gap category) | AC1/AC2's gap is external-dependency, not CSS-layout-dependent — RISK-ACCEPTed anyway for transparency (`decisions.md`, 2026-10-19), same convention every `fpd-*` story used |
| H-NFR | NFR profile exists | ✅ | `artefacts/.../nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | No compliance NFR |
| H-NFR3 | Data classification populated | ✅ | "Internal" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | "Hamish King — Platform Owner — 2026-10-19" |
| H-ADAPTER | D37 adapter wiring | ✅ (N/A) | `authenticateStagingSession` is a plain function called from a CLI script, not a route handler making an I/O call — D37 scopes to route handlers |
| H-INF / H-MIG / H-DESIGN | — | ✅ (N/A) | Track flags not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | ✅ No warning |
| W2 | Scope stability declared | ✅ No warning |
| W3 | MEDIUM review findings acknowledged | ✅ No warning — 1-M1 logged as a RISK-ACCEPT in `decisions.md`, 2026-10-19 |
| W4 | Verification script reviewed by a domain expert | ⚠️ Covered by the standing W4 RISK-ACCEPT posture already logged for this feature's own prior stories |
| W5 | No UNCERTAIN gap-table items | ✅ No warning — gap type is "External-dependency" with explicit handling, not "UNCERTAIN" |

---

## Standards injection

**Domain tags:** `[auth]`
**Matched standards files:** `.github/standards/auth/auth-patterns.md`

The load-bearing rule is "No credentials in URLs or logs" — directly enforced by AC4's own test. The file's other sections (session cookie flags, MFA, password rules) describe hypothetical examples not yet filled in for this repo and don't apply to a CLI script reusing an existing test-only session mechanism.

---

## Oversight level

**Oversight:** High (solo-operator repo-wide posture, per `architecture-guardrails.md`).

---

## Coding Agent Instructions

**Story:** CLI entrypoint authenticates against staging and captures one real screenshot end to end
**Contract:** artefacts/2026-10-19-real-playback-capture-automation/dor/rpca-s1-dor-contract.md
**Test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s1-test-plan.md
**Verification script:** artefacts/2026-10-19-real-playback-capture-automation/verification-scripts/rpca-s1-verification.md

**Touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify)
- `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js` (new)

**Goal:**
Make every automatable test in the test plan pass. AC1/AC2's own manual scenario is explicitly out of scope for the coding agent to execute (RISK-ACCEPTed, requires the operator's own secret) — do not attempt to retrieve or fabricate a secret value.

**Constraints:**
- No new npm dependencies — Playwright is already a devDependency.
- `E2E_STAGING_AUTH_STUB_SECRET` is read from `process.env` only — never hardcoded, printed, or logged. AC4's own test enforces this.
- Read `.github/architecture-guardrails.md` and `.github/standards/auth/auth-patterns.md` before implementing.
- Open a draft PR when the automatable tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.

**Implementation order:**
1. Path-construction helper + its unit test (AC2) — lowest-risk, no dependency on anything else
2. `authenticateStagingSession` + its mock-server integration test (AC1's own logic)
3. CLI entrypoint's own missing-env-var error handling + its unit test (AC3)
4. CLI entrypoint's own no-secret-in-output guarantee + its unit test (AC4) — write this test against both the success and failure paths built in steps 2-3

- Full regression suite must stay green throughout (`node scripts/run-all-tests.js`).
- AC1/AC2's own manual scenario happens at `/verify-completion`, run by the operator with the real secret — not something the coding agent automates.

Oversight level: High (solo-operator repo-wide posture)

---

## Sign-off

**Oversight level:** High — per `architecture-guardrails.md`'s solo-operator posture.
**Sign-off required:** Yes.
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.
