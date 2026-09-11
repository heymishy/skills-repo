# Definition of Ready Checklist

## Definition of Ready: A standalone organisation's admin can self-activate it as an Agency

**Story reference:** artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md
**Test plan reference:** artefacts/2026-09-11-agency-self-activation/test-plans/asa-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-11

---

## Contract Proposal

See `artefacts/2026-09-11-agency-self-activation/dor/asa-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (mirror `org-conversion.js`'s admin-gate + single-statement UPDATE pattern for the reverse direction) directly satisfies AC1-AC4; AC5 requires no new implementation, only an integration test composing this story's new handler with Story 3's already-shipped one. No mismatches between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "consultancy admin whose organisation is `org_type = 'standalone'`" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 6 unit tests + 1 integration test, all 5 ACs covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Agency-led client provisioning (`2026-07-30-agency-client-organisations`) — this story closes the gap preventing that metric from ever being measurable |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Story's Dependencies block names an upstream epic that is already DoD-complete (all 6 stories) — no incomplete-upstream block |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated — exact functions/files named, mirrors an already-shipped sibling pattern precisely. No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent ACs — server-side logic plus a minimal, non-visual-regression-risk form |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-11-agency-self-activation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as every prior short-track story in this repo** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("Write a new short-track story to add it"), following live Chrome reproduction of the gap and an exhaustive code-search confirmation shown to the operator before this story was written. Recorded transparently, matching the identical, already-logged H-GOV gap pattern used by every prior short-track story this session (`jasb-s1`, `jgls-s1`). |
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
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-09-11-agency-self-activation/decisions.md` — this story mirrors an already-shipped, already-reviewed sibling pattern (`org-conversion.js`) closely, keeping risk low despite touching the same security-sensitive boundary. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's one gap-table entry (no new Playwright E2E spec) is an explained design choice with stated mitigation (live smoke check), not an unresolved uncertainty | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: A standalone organisation's admin can self-activate it as an Agency — artefacts/2026-09-11-agency-self-activation/stories/asa-s1-standalone-org-can-self-activate-as-agency.md
Test plan: artefacts/2026-09-11-agency-self-activation/test-plans/asa-s1-test-plan.md
DoR contract: artefacts/2026-09-11-agency-self-activation/dor/asa-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. This is a security-
sensitive addition (touches org_type, the same boundary ADR-025 governs)
-- mirror the existing org-conversion.js pattern exactly, do not invent a
new permission mechanism.

(1) src/web-ui/modules/organisations.js: add activateOrganisationAsAgency(
pool, orgId, logger), mirroring convertOrganisationToStandalone's exact
shape:
  UPDATE organisations SET org_type = 'agency'
  WHERE org_id = $1 AND org_type = 'standalone'
  RETURNING org_id, name, org_type, created_at
Log an 'organisation_activated_as_agency' event (org_id, timestamp) when a
row is returned. Return null when no row matches (already agency/client).

(2) Create src/web-ui/routes/org-activation.js, mirroring
routes/org-conversion.js's structure:
  - createOrgActivationHandlers(pool) returning
    { handleGetBecomeAgencyForm, handlePostBecomeAgency }
  - Admin gate: reuse modules/user-roles.js's resolveRoleForPerson(pool,
    identityKey, orgId) DIRECTLY (identityKey = req.session.login ||
    req.session.userId || orgId), same as org-conversion.js's
    _isAdminOfOwnOrg -- reject 403 if role !== 'admin', audit the denial.
  - GET /organisations/become-agency: render a minimal, keyboard-navigable
    confirmation form (real <form>/<input>, matching org-conversion.js's
    _sendHtml convention) if admin; 403 JSON if not.
  - POST /organisations/become-agency: call activateOrganisationAsAgency.
    If it returns a row: audit 'organisation_activated_as_agency', respond
    200/success. If null: respond 400 "This organisation is not eligible
    for activation" (matching org-conversion.js's analogous 400 shape).

(3) Wire the new routes in src/web-ui/server.js, matching how
organisations/convert is already wired.

(4) Add tests (e.g. tests/check-asa-s1-agency-self-activation.js) covering
all 6 test-plan cases: AC1 (flip succeeds + audit), AC3 (no-op on
already-agency and already-client orgs), AC2 (non-admin rejected on both
GET and POST, denial audited), AC4 (unrelated relationship/grant rows
untouched), AC5 (activate then call Story 3's existing GET
/agency/clients/new handler directly -- confirms it now renders instead of
rejecting).

Constraints:
- Do NOT build reversal (agency -> standalone).
- Do NOT touch agency_client_relationships or shared_access_grants tables
  anywhere in this story's own code.
- Do NOT modify any of 2026-07-30-agency-client-organisations's own 6
  already-shipped files beyond what's needed to wire the new route in
  server.js.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs (ADR-025 in
  particular -- this touches the tenant-isolation boundary it governs).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — mirrors the original `2026-07-30-agency-client-organisations` epic's own stated rationale for its Story 2 (touches the tenant-isolation boundary ADR-025 governs), even though this story's own scope is narrow and closely mirrors an already-reviewed sibling pattern.
**Sign-off required:** Yes
**Signed off by:** Hamish King (operator) — confirmed the implementation plan (route/function shape, admin-gate reuse, one-way `standalone`-only transition) directly in-session, 2026-09-11.
