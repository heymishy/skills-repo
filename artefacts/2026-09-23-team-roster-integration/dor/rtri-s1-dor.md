# Definition of Ready: Expose the real team roster as a read API

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Test plan reference:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s1-test-plan.md
**Contract:** artefacts/2026-09-23-team-roster-integration/dor/rtri-s1-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-09-24

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "product owner or feature lead" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 5/5 covered (3 unit, 2 integration) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | "Real pod membership; /team/members shows a real list" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 1: PASS, 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream "None" — check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025/ADR-026 + silent-omission rule; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ | No layout-dependent ACs — N/A |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-23-team-roster-integration/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance frameworks apply (nfr-profile.md) — N/A |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Story NFRs populated, profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Operator/Product Owner — 2026-09-23" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter introduced — `listTeamMembers` takes `pool` directly, matching `getRoleForPersonInTenant`'s established ADR-026 precedent (no I/O adapter, direct DB access) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | No MEDIUM findings in review | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-24 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: None | — |

---

## Standards injection

**Domain tags:** `web-ui`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the Coding Agent Instructions block below in full.

---

## Oversight level

**Epic oversight:** Low (per `epics/real-team-roster.md`) — no sign-off required. Proceeding directly to coding agent assignment.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Expose the real team roster as a read API — artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
Test plan: artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add `listTeamMembers(pool, tenantId)` to `src/web-ui/modules/team-management.js`
  (plain pool parameter, no injectable adapter — matches this module's own
  `getRoleForPersonInTenant` convention exactly).
- Add `handleGetTeamMembersApi(req, res, pool)` to `src/web-ui/routes/team-management.js`.
- Register `GET /api/team/members` in `src/web-ui/server.js`, wrapped in
  `authGuard(...)`, using `_pshPool` — matching `GET /api/pods`'s exact
  registration shape (server.js line ~4279).
- Response envelope: `{ members: [...] }` — matches this repo's `{ pods: [...] }`
  convention (routes/pods.js).
- Files out of scope for this story: `pod-manager.html`, `routes/team-management.js`'s
  existing `handleGetTeamMembers`/`handleAddTeammate` (those are rtri-s2/rtri-s3's
  and tir-3's own territory respectively) — do not modify them here.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Full text of this file's currently-relevant sections for this story:]

- **Injectable adapter pattern (D37/ADR-009):** N/A for this story — no model call or
  external I/O adapter introduced; `listTeamMembers` takes `pool` as a plain parameter,
  matching the existing `getRoleForPersonInTenant` precedent (direct DB access is not
  itself an "adapter" under this rule).
- **Session token access:** `req.session.accessToken` is canonical — not used directly
  by this story, but do not introduce any `req.session.token` reference.
- **Stack constraints:** No new npm dependencies — Node.js built-ins only. No Express —
  raw `http.createServer` routing only (matches every existing route in `server.js`).
- **HTML render function unit test pattern:** N/A — this story has no HTML rendering
  (pure JSON API), but the same fragment-assertion discipline (assert specific values,
  not full-object snapshot equality) applies to the JSON-shape assertions in this
  story's own tests.
- Full file: `.github/standards/web-ui/web-ui-patterns.md` (417 lines) — read in full
  before implementing; the excerpt above highlights only the sections directly
  applicable to this story's scope.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
