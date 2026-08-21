# Definition of Ready Checklist

## Definition of Ready: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial

**Story reference:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
**Test plan reference:** artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/test-plans/rbg-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform maintainer relying on automated regression coverage" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3/3 |
| H4 | Out-of-scope section is populated | ✅ | 3 items, including the corrected viewer-enforcement exclusion |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track — no formal metric; real explanation given (standard short-track pattern used throughout this repo) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — upstream dependency (`bri-s3.3`) is a shared test file, not a `pipeline-state.schema.json` field |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated, includes the 2026-08-21 scope-correction note |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — this is HTTP-status-code testing, not rendered-DOM/position behaviour |
| H-NFR | NFR profile or explicit "None" field | ✅ | Inline NFR section populated (Security is the substantive NFR) |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track (see H-NFR-profile note) |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — remediation path is `/definition` Step 7, which short-track never runs by design; consistent with every other short-track story in this repo's history |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters introduced — pure test-file edit |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ **Resolved** | Reviewed and confirmed by the operator (2026-08-21) before proceeding — no RISK-ACCEPT needed | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The one gap table entry (missing viewer-write-blocking enforcement) has a clear resolution — tracked separately, not "uncertain" | — |

---

## Standards injection

**Domain tags:** `[web-ui, security]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`

These are injected below per the standard matching algorithm. Note: this story only edits `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` — no application code — so most of `web-ui-patterns.md`'s server-pattern content (raw `http.createServer`, injectable adapters, session handling internals) is not directly load-bearing here, but is included per the documented matching rule rather than skipped by judgement call.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix bri-s3.3's role-boundary regression guard so it actually asserts denial — artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/stories/rbg-s1-fix-role-boundary-regression-guard.md
Test plan: artefacts/2026-08-18-bri-s3-3-role-boundary-guard-gap/test-plans/rbg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- The ENTIRE change is scoped to one file: tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js. Do NOT touch any file under src/web-ui/ — the underlying requireAdmin/role-resolution mechanism is already confirmed correct and is explicitly out of scope.
- AC1: rewrite the existing "AC1: admin (alice) succeeds on role-gated feature, engineer (bob) is denied" test. Replace its current body (which only checks both alice and bob get 200 on GET /products/:productId — a shared, non-admin-gated route) with: alice.ctx.get('/admin/credits') expects 200; bob.ctx.get('/admin/credits') expects 403. Keep the existing real-LLM-call-count before/after assertions unchanged.
- AC2: implement the existing "AC3: viewer-role write attempt is denied" test's currently-empty placeholder body (it currently just re-checks the LLM-call counter with a comment "For now, this is a placeholder that demonstrates the structure"). Log in as 'e2e-viewer' using the existing githubLogin() helper (already defined in this file). Assert viewer.ctx.get('/admin/credits') returns 403. Do NOT rename this test's title away from referencing AC3/viewer unless you also update the story's own AC numbering references — prefer keeping the existing test name and just filling in its real body, to minimise churn.
- Do NOT add any new enforcement code, new middleware, or new role-checking logic anywhere. If you find yourself wanting to add a check for role === 'viewer' outside this test file, stop — that is explicitly out of scope (tracked separately at artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md, not yet approved).
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Applicable standards (see Standards injection section above): .github/standards/web-ui/web-ui-patterns.md, .github/standards/security/security-standards.md — read both before implementing, even though this story only touches a test file.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — operator is directly reviewing this DoR live)
**Signed off by:** Hamish King (2026-08-21) — reviewed and approved the verification script (W4) and this DoR in the same session
