# Definition of Ready: Restore same-tenant journey access under POLICY.TENANT

**Story reference:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md`
**Test plan reference:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/test-plans/jatg-s1-test-plan.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract review

✅ **Contract review passed** — proposed implementation (see `jatg-s1-dor-contract.md`) aligns with all 5 ACs. No mismatches found between the proposed one-branch addition to `requireJourneyAccess()` and the story's stated ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a teammate sharing a journey within the same tenant" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC5 all have direct unit and/or integration test coverage |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions listed |
| H5 | Benefit linkage field references a named metric | ✅ | "Collaborative-session functional correctness (wsm.2's own delivered feature: concurrent multi-user journey viewing)" |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track story — `/review` is skipped per CLAUDE.md's documented short-track definition |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan's own Coverage gaps section states "None" |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies block states "Upstream: None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated: "`src/web-ui/middleware/journey-access.js` — this story fixes `requireJourneyAccess()` itself... Checked against `.github/architecture-guardrails.md` — no conflicting guardrail found." No review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No AC is CSS-layout-dependent — pure backend authorization logic |
| H-NFR | NFR profile exists, or story has explicit NFRs-None field | ✅ | Story's NFR section states "None identified" for Performance/Accessibility/Audit; Security is explicitly the fix itself, with its own regression guards (AC2, AC3) |
| H-NFR2 | Compliance NFR with regulatory clause has documented sign-off | ✅ N/A | No compliance NFRs in this story |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ N/A | No NFR profile required |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ N/A | Story's NFR section is effectively "None" beyond the fix-is-the-security-improvement statement — check skipped per its own trigger condition |
| H-GOV | Governance approval check (discovery `## Approved By`) | ✅ N/A | Short-track story — no discovery artefact exists |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This story introduces no injectable adapters — it adds one control-flow branch to an existing function |
| H-INF | Infra-plan gate check | ✅ N/A | `hasInfraTrack` not set on this story |
| H-MIG | Migration-review gate check | ✅ N/A | `hasMigrationTrack` not set on this story |

**All hard blocks pass — 11 evaluated, 0 failed (7 N/A given short-track scope and story shape).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Story states "None identified" for 3 categories; Security is the fix itself |
| W2 | Scope stability is declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | — | No `/review` ran (short-track) |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | Unreviewed script may miss an edge case in the access-control logic | Operator — RISK-ACCEPT logged in `artefacts/2026-08-22-journey-access-tenant-grant-gap/decisions.md`, 2026-08-22, asked explicitly given this story's security relevance |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | Test plan's Coverage gaps section states "None" |

---

## Standards injection

**Domain tags:** `[web-ui, security]`
**Matched standards files:** `.github/standards/security/security-standards.md`, `.github/standards/web-ui/web-ui-patterns.md`

Both files matched and are appended to the coding agent instructions block below. Note: `security-standards.md` has its own separately-tracked "Known gaps" entry (`GET /features/:slug` has no tenant-ownership check) — thematically related (both about tenant-ownership guards) but a different route and a different, already-separately-flagged gap. Out of scope for `jatg-s1` — not touched.

---

## Oversight level

**Medium** — no parent epic (short-track, standalone story), matching this session's established precedent for short-track security-relevant fixes (`rbg-s1`, `lrtc-s1`, `pisd-s1`).

> ⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restore same-tenant journey access under POLICY.TENANT — artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md
Test plan: artefacts/2026-08-22-journey-access-tenant-grant-gap/test-plans/jatg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js only — no test framework beyond what's already used
  elsewhere in this repo (assert, plain object literals). Configured
  test runner: `node scripts/run-all-tests.js` (glob-discovers
  tests/check-*.js).
- Fix scope: src/web-ui/middleware/journey-access.js's
  requireJourneyAccess() only. Do NOT touch requireGrantAccess or the
  agency-client-organisations relationship-grant extension in the same
  file (unrelated, explicitly out of scope).
- Do NOT weaken POLICY.OWNER semantics (AC3's own regression guard) —
  the two POLICY.OWNER call sites (handlePostJourneyRecommit,
  handlePostJourneyStageCommit) must remain owner-only.
- The story's own "Root cause" section includes a suggested fix shape --
  verify it against all 11 real POLICY.TENANT call sites in journey.js
  (lines 295, 736, 1456, 2790, 2865, 2917, 2944, 3208, 3256, 3313, 3460
  at time of writing) before finalizing; adjust if any call site reveals
  an assumption the suggested shape doesn't account for.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. No conflicting guardrail was found during DoR review.
- Security standards (.github/standards/security/security-standards.md,
  full text below) and web-ui standards
  (.github/standards/web-ui/web-ui-patterns.md, 374 lines — read the
  file directly given its length) both apply per this story's domain
  tags. Most relevant line from security-standards.md for this exact
  fix: "Access control: Deny by default. Permissions checked at service
  layer." -- the fix must not invert this (grant by default); it adds
  exactly one narrow, explicit grant condition
  (policy === POLICY.TENANT && isSameTenant(...)) to an
  already deny-by-default function.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a
  PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

### Applicable standards (full text)

#### `.github/standards/security/security-standards.md`

```
# Security Standards

## Known gaps (tracked, not yet fixed)

- **`GET /features/:slug` has no tenant-ownership check.** Confirmed via direct code read during S3.4's route-investigation (2026-07-24) — unlike other journey/feature routes in this repo (e.g. `GET /journey/:id`), this route does not verify the requesting session's tenant owns the target feature before rendering it. Not exploited by S3.4 itself — but the route remains reachable directly by anyone who knows or guesses a `feature_slug`. Needs a follow-up story adding the same `requireJourneyAccess`/`POLICY.TENANT`-equivalent guard used elsewhere in this codebase. (Note: unrelated to jatg-s1's own scope — a different route, a separately-tracked gap.)

## OWASP Top 10 mitigations

- **Injection:** Parameterised queries only. No string concatenation in queries.
- **Broken auth:** See auth-patterns.md. Token expiry enforced server-side.
- **Sensitive data exposure:** TLS 1.2+ only. Secrets in vault, not env files committed to git.
- **XXE:** XML parsing disabled or hardened. Prefer JSON.
- **Access control:** Deny by default. Permissions checked at service layer.
- **Security misconfiguration:** No default credentials. Debug mode off in production.
- **XSS:** Output encoding in all templates. CSP headers set.
- **Insecure deserialisation:** No deserialisation of untrusted data to objects.
- **Vulnerable components:** Dependency scanning in CI. No unpatched critical CVEs shipped.
- **Logging:** Security events logged (auth failures, access denials). No secrets in logs.
```

#### `.github/standards/web-ui/web-ui-patterns.md`

Not embedded here (374 lines) — read directly before implementing. Most relevant to this story: the file's own conventions for raw `http.createServer` route handlers and session-field access (`req.session.accessToken`, per CLAUDE.md's own canonical-field-name rule).
