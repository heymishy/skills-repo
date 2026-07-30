# Definition of Ready: Client-org dual-path authentication

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-4-dual-path-authentication-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-4-dual-path-authentication-dor-contract.md`. Summary: GitHub OAuth path confirmed unchanged; magic-link path shares Story 3's Passport.js/`passport-magic-login` mechanism; rate-limiting reuses `auth-email.js`'s existing limiter.

## Contract Review

Checked against all 5 ACs (including the AC5 wiring AC added 2026-07-31) and the test plan's 17 tests. Rate-limiting NFR (resolving review [1-M1]) is reflected in the contract via the reused `auth-email.js` limiter. No mismatch found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a Client org member (read-only)..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 5 ACs (AC5 added 2026-07-31 for D37 wiring) |
| H3 | Every AC has ≥1 test | ✅ | 17 tests across 5 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | "Agency-led client provisioning" |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 2 — PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: Story 3. `schemaDepends: [stage, reviewStatus]` — both present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025 + 2 ARCH decisions cited; Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Present, Story 4 rows populated (Security — Authentication, Secrets management) |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | AC5 (added 2026-07-31) requires throw-on-unwired stubs and a differentiating wiring test — same pattern as Story 3, shared mechanism |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | Review run 2 has 0 MEDIUM findings (rate-limiting NFR resolved run 1's [1-M1] directly) | — |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table names the External-dependency (real email delivery) with explicit manual-scenario handling | — |

---

## Oversight level

**Epic-level oversight: Medium.** This is a genuinely new auth surface (per the story's own Security NFR, "should receive equivalent security scrutiny to the existing GitHub OAuth flow at /review") — that scrutiny has already occurred (review run 2: 5/4/5/5/5, 0 findings).

> ⚠️ Medium oversight — share the DoR artefact with the tech lead before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Client-org dual-path authentication — artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-4-dual-path-authentication-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, existing raw http.createServer + pg adapter conventions
- Do NOT change GitHub OAuth for Agency/Standalone tenants in any way — confirm via a non-regression test, do not just assume
- Magic-link path uses the SAME Passport.js/passport-magic-login registration as Story 3 — do not duplicate the strategy registration in server.js; build/verify these two stories together or in immediate sequence
- Rate-limit the magic-link request endpoint per-IP and per-target-email, reusing auth-email.js's existing signup rate limiter implementation directly, not a new bespoke one
- Magic-links: single-use, time-limited (15-30 min), bound to the exact invited email — never log the raw token in plaintext
- Adapter stubs (verify()/send callbacks) MUST throw when unwired; server.js MUST wire both to real implementations (AC5)
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 applies directly.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards
Domain tags: [auth, security]
- .github/standards/auth/auth-patterns.md (authentication and authorisation)
- .github/standards/security/security-standards.md (OWASP, input validation, secrets)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31 (acknowledged)
