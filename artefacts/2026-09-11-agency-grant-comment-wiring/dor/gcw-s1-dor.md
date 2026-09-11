# Definition of Ready Checklist

## Definition of Ready: Wire the already-built shared-access grant and client-agency comment routes into live URLs

**Story reference:** artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md
**Test plan reference:** artefacts/2026-09-11-agency-grant-comment-wiring/test-plans/gcw-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-11

---

## Contract Proposal

See `artefacts/2026-09-11-agency-grant-comment-wiring/dor/gcw-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (wire 9 already-tested handlers using this codebase's existing dispatch pattern, add the existing `csrfGuard` pattern where missing) directly satisfies AC1-AC5; AC6 requires no new implementation, only an integration test chaining already-wired/already-built functionality end-to-end. No mismatches between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Agency admin who has provisioned a Client org" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 14 integration tests + 1 wiring regression, all 6 ACs covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Both of `2026-07-30-agency-client-organisations`'s own benefit metrics — this story is the actual missing link both require |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Story's Dependencies block names two upstream stories (Story 2/5, already DoD-complete) plus `asa-s1` (already merged) — no incomplete-upstream block |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — exact functions, exact new routes, exact security addition all named precisely. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent ACs — JSON API routes only |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-11-agency-grant-comment-wiring/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as every prior short-track story in this repo** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("Short track"), following live Chrome reproduction of the gap and an exhaustive code-search confirmation shown to the operator before this story was written. Recorded transparently, matching the identical, already-logged H-GOV gap pattern used by every prior short-track story this session (`jasb-s1`, `jgls-s1`, `asa-s1`). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced by this story |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 14/14 (10 direct passes + 4 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-09-11-agency-grant-comment-wiring/decisions.md` — all 9 wired handlers' own logic already covered by 2 existing, already-reviewed test suites; this story only adds dispatch coverage plus one already-reviewed security pattern applied where missing. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's gap table is empty (no gaps identified) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire the already-built shared-access grant and client-agency comment routes into live URLs — artefacts/2026-09-11-agency-grant-comment-wiring/stories/gcw-s1-wire-grant-and-comment-routes.md
Test plan: artefacts/2026-09-11-agency-grant-comment-wiring/test-plans/gcw-s1-test-plan.md
DoR contract: artefacts/2026-09-11-agency-grant-comment-wiring/dor/gcw-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Do NOT modify the internal
logic of any of the 9 handler functions named below -- wiring and CSRF
protection only.

(1) src/web-ui/server.js: add handleCreateGrant, handleListSharedProducts,
handleGetSharedProduct, handleMutateSharedProduct, handleRevokeGrant,
handleCreateSharedComment, handleListSharedComments,
handleCreateAgencyComment, handleListAgencyComments to the existing
require('./routes/products') destructure at the top of the file.

(2) Register these routes in the router (mirroring the existing
pathname.match(/^\/prefix\/[^/]+\/suffix$/) + pathname.split('/') pattern
already used throughout this file for dynamic segments), all wrapped in
authGuard:
  POST   /api/agency/grants                  -> handleCreateGrant
  POST   /api/agency/grants/:grantId/revoke   -> handleRevokeGrant
  POST   /api/agency/comments                 -> handleCreateAgencyComment
  GET    /api/agency/comments/:id             -> handleListAgencyComments
  GET    /client/shared-products              -> handleListSharedProducts
  GET    /client/shared-products/:id          -> handleGetSharedProduct
  PUT|POST|DELETE /client/shared-products/:id -> handleMutateSharedProduct
  POST   /client/comments                     -> handleCreateSharedComment
  GET    /client/comments/:id                 -> handleListSharedComments

For the 3 mutating routes (POST /api/agency/grants, POST /client/comments,
POST /api/agency/comments), add the EXACT existing csrfGuard preamble
already used elsewhere in products.js (e.g. handlePostGuardrailsForm):
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  req.body = await _readBody(req);
before calling the handler. Import _csrf (middleware/csrf.js) and a local
_readBody helper in server.js if not already available at this call site
(mirror org-conversion.js's own local _readBody convention if a shared one
isn't already imported).

Pass _pshPool as the pool argument to all 9 handlers (same pool already
used for every other products.js route in this file).

(3) Add tests (e.g. tests/check-gcw-s1-agency-grant-comment-wiring.js)
covering all 14 integration cases + 1 wiring regression per the test plan.
Reuse/extend the makeFakePool conventions already established in
tests/check-story2-relationship-grants-enforcement.js and
tests/check-story5-client-agency-comments.js.

Constraints:
- Do NOT modify modules/agency-client-grants.js, modules/agency-client-
  comments.js, or any of the 9 handler functions' own internal logic.
- Do NOT build any UI/page for these routes -- API only.
- Do NOT fix handleCreateAgencyComment/handleListAgencyComments's missing
  resource-ownership check -- out of scope, logged in decisions.md.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs (ADR-025 in
  particular -- this touches the tenant-isolation/grant boundary it governs).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — mirrors `asa-s1`'s own rationale (touches the tenant-isolation/grant boundary ADR-025 governs), even though this story's own scope is mechanical wiring of already-tested handlers plus one well-precedented security addition.
**Sign-off required:** Yes
**Signed off by:** Pending — operator directed short-track scoping ("Short track") but has not yet reviewed this specific implementation plan (9-route URL scheme, CSRF-addition scope, pool reuse). Confirm before `/branch-setup`.
