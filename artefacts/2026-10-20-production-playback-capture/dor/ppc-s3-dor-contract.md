# DoR Contract Proposal: Rate-limit the capture-trigger endpoint per tenant user

**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s3.md`
**Date:** 2026-10-21

---

## What will be built

- Apply the existing `createRateLimiter` middleware (from `src/web-ui/middleware/rate-limiter.js`, already used by `sign-off.js` at 10 req/user/min) to the capture-trigger endpoint(s) introduced by `ppc-s1`/`ppc-s2`, scoped per user id.
- An accessible rejection response (`role="alert"` or equivalent) for the rate-limited case.

## What will NOT be built

- A system-wide/global concurrency cap (explicitly fast-follow per `discovery.md`).
- Per-tenant (as opposed to per-user) limiting.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Second request within window rejected with a clear message | unit + integration |
| AC2 | Per-user scoping — two users in the same tenant tracked independently | unit + integration |
| AC3 | Request after window expiry allowed | unit |

## Assumptions

- `createRateLimiter`'s existing configuration shape (as used in `sign-off.js`) is directly reusable without modification for this new endpoint — confirmed by reading `src/web-ui/middleware/rate-limiter.js` and `sign-off.js`'s own usage during `/definition`.
- This is not a D37 adapter concern: rate limiting is pure in-memory logic, not an external I/O or model call, consistent with why `sign-off.js` itself never wrapped it in a D37 setX adapter either.

## Estimated touch points

**Files:** The route module from `ppc-s1`/`ppc-s2` (middleware applied to its endpoints), no new adapter module.
**Services:** None new — in-memory rate-limiter state only.
**APIs:** No new external API surface.

## Schema Dependencies

`schemaDepends: []`

Upstream dependency on `ppc-s1`/`ppc-s2` is at the application level (the endpoints this story wraps must exist) — not a `pipeline-state.json` field dependency.

---

## Contract Review

Checked against all 3 ACs and the test plan — no mismatches found.

✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | Tenant Product Owner |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage references a named metric | ✅ | Metric 1 — Self-service DoD validation adoption |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 1: 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — application-level dependency, not pipeline-state.json field |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | |
| H-E2E | CSS-layout-dependent AC gate | ✅ (N/A) | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ (N/A) | None identified |
| H-NFR3 | Data classification not blank | ✅ | Confidential (feature-level profile) |
| H-NFR-profile | NFR profile exists | ✅ | |
| H-GOV | Discovery `## Approved By` populated, non-engineering entry | ✅ | Same discovery artefact |
| H-ADAPTER | New adapter wiring AC | ✅ (N/A) | Not a D37 concern — pure in-memory logic, reuses existing middleware unchanged |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ (skipped) | All three track flags absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | |
| W2 | Scope stability declared | ✅ | — | |
| W3 | MEDIUM findings acknowledged | ✅ | — (0 MEDIUM) | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet walked through before coding starts | RISK-ACCEPT — Hamish King, 2026-10-22, see `decisions.md` |
| W5 | No UNCERTAIN gap-table items | ✅ | — | |

---

## Standards injection

Domain tags: `[web-ui, security]`
Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/security/security-standards.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Rate-limit the capture-trigger endpoint per tenant user — artefacts/2026-10-20-production-playback-capture/stories/ppc-s3.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules (require), matching this repo's existing src/web-ui/ convention.
- Reuse createRateLimiter exactly as sign-off.js already uses it — do not build a
  new rate-limiting mechanism.
- Per-user scoping only — do not add per-tenant or global limiting in this story.
- Rejection response must be accessible (role="alert" or equivalent), not a
  visual-only toast.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards

### From .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
[Full file content — no new adapter is introduced by this story, so the D37
section does not apply to new code here; other sections apply where relevant
to the routes this story touches.]

### From .github/standards/security/security-standards.md (domain: security)
[Full file content — OWASP Top 10 mitigations relevant to rate-limiting and
abuse-prevention; this story explicitly does not claim to prevent sophisticated
or distributed abuse, per discovery.md's own Constraints section.]
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Share the DoR artefact with the tech lead (operator awareness stands in).
**Signed off by:** Hamish King (Platform Owner), 2026-10-22

**Definition of ready: PROCEED**
