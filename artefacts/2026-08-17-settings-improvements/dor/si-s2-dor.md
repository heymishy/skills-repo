## Definition of Ready: Add a timezone and date-format preference to Settings

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Test plan reference:** artefacts/2026-08-17-settings-improvements/test-plans/si-s2-test-plan.md
**Contract proposal:** artefacts/2026-08-17-settings-improvements/dor/si-s2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-17

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "regular team member" |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | 9 automated tests cover 6 ACs |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage names a metric | ✅ | "Locale preference adoption" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH (Run 1's 1-H1 resolved) |
| H8 | No uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated, no Cat. E HIGH | ✅ | `people`/`person_identities` reuse (corrected), ADR-025 tenant scoping; review Cat. E score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-17-settings-improvements/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By populated | ✅ | M1 signal recorded, not blocking |
| H-ADAPTER | New adapter wiring | ✅ N/A | Reuses existing `pool` injection and `resolvePersonForIdentity` — no new `setX` seam introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review Run 2 had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Higher-risk story (schema write, identity-resolution edge case) with an unreviewed script | Acknowledged — RISK-ACCEPT logged in `decisions.md`, 2026-08-17, by Hamish King (asked specifically given this story's risk profile) |
| W5 | No UNCERTAIN gap-table items | ✅ | No gaps | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a timezone and date-format preference to Settings — artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
Test plan: artefacts/2026-08-17-settings-improvements/test-plans/si-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, no framework (raw http.createServer), injectable-adapter conventions per this codebase's existing style
- Extend the `people` table via `ALTER TABLE people ADD COLUMN IF NOT EXISTS timezone TEXT` and `... date_format TEXT` in migrateTeamSchema() (src/web-ui/modules/user-roles.js) — idempotent pattern, matching product-repo.js's existing precedent. Do NOT touch the legacy `users` table.
- Resolve person_id via resolvePersonForIdentity(pool, identityKey), reusing the existing identityKey variable already computed in handleGetSettings (req.session.tenantId) — do not introduce a second identity-resolution path
- Server-side validate timezone against a real IANA timezone allowlist before any write — reject invalid/empty values with a 400 and a field-specific message, no partial write
- Currency/number-format, timestamp-reformatting elsewhere in the product, org-wide default/override, and browser auto-detect are explicitly OUT OF SCOPE — do not implement any of these
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Applicable standards (web-ui):
- Every HTML route view MUST import renderShell()/escHtml() from src/web-ui/utils/html-shell.js — never duplicate or reimplement either function
- escHtml() MUST be applied to every user-supplied or model-supplied string before injecting into an HTML response body, including any saved locale value re-displayed in the form
- req.session.accessToken is the canonical GitHub OAuth token field name — never req.session.token (not directly used by this story, but grep-check applies to any session code touched: `grep -rn "req\.session\.token[^A]" src/web-ui/` must return zero results)

Applicable standards (data):
- .github/standards/data/data-standards.md exists but contains only unfilled placeholder template text for this repo — no concrete data-domain rules to inject. Follow this codebase's own established conventions instead (idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS migrations, no raw SQL string interpolation — parameterised queries only).

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
