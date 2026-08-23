# Definition of Done: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**PR:** https://github.com/heymishy/skills-repo/pull/755 | **Merged:** 2026-08-23
**Story:** artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md
**Test plan:** artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-21-viewer-role-no-enforcement/dor/vrne-s1-dor.md
**Assessed by:** Claude (agent) + Hamish King (Founder/Operator)
**Date:** 2026-08-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 15/15 Products-group routes return 403 for a viewer-role session | `tests/check-vrne-s1-server-wiring.js` (AC1 loop, real seeded identity), integration test via real `server.js` dispatch | None |
| AC2 | ✅ | 18/18 Features/journeys-group routes return 403 for a viewer-role session | `tests/check-vrne-s1-server-wiring.js` (AC2 loop, real seeded identity), integration test via real `server.js` dispatch | None |
| AC3 | ✅ | `admin`/`engineer`/`product` roles proceed with no regression | `tests/check-vrne-s1-require-non-viewer.js` (allowed-roles table) | None |
| AC4 | ⚠️ | Missing/null/genuinely-unrecognised role state is denied (fail-closed) | `tests/check-vrne-s1-require-non-viewer.js` (fail-closed table: missing-role, null-role, unrecognised-role, no-session) | See below |
| AC5 | ✅ | Denial logged with `personId`, `tenantId`, `timestamp`, `route` | `tests/check-vrne-s1-require-non-viewer.js` (denial-logged test), integration test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**AC4 deviation:** AC4's literal text names exactly 4 "known" roles (`'admin'`/`'engineer'`/`'product'`/`'viewer'`) and treats any other value — implicitly including `'user'` — as ambiguous/unrecognised, therefore fail-closed-denied. The story's own authoring (and its test plan's `unrecognised-role-denied` test comment, "a value outside the 4 valid roles") borrowed this 4-role list from `team-management.js`'s `VALID_ROLES`, which is scoped to invited multi-person-tenant team members — not the full set of real role values the system actually issues. `modules/user-roles.js`'s `getRoleForTenant` is documented to fall back to the literal string `'user'` when no `team_memberships` row exists yet, which is exactly what every single-person self-signup tenant's first session receives (`routes/auth-email.js`). Under AC4 as literally written, every brand-new signup would be fail-closed-denied on every write route — which is what actually shipped in the first version of this PR, and was caught by CI (`Cross-tenant isolation spec — 20x repeat, zero-tolerance`, 20/20 failures, `POST /products/new` returning 403 instead of 200) before merge. Fixed by adding `'user'` to `require-non-viewer.js`'s `ALLOWED_ROLES`. The gate's actual security intent — deny truly ambiguous/unknown role state — is still fully satisfied (AC4's fail-closed tests for `missing`/`null`/genuinely-unrecognised values like `'contractor'` still pass); this deviation is a gap in the AC's own role enumeration, not a functional weakening of the fail-closed guarantee. Full root-cause writeup: `artefacts/2026-08-21-viewer-role-no-enforcement/decisions.md`, 2026-08-23 ARCH entry.

---

## Scope Deviations

None. No behaviour outside the story's declared scope (Products + Features/journeys write routes) was implemented.

---

## Test Plan Coverage

**Tests from plan implemented:** 54 / 54 (53 planned + 1 added post-merge-CI-catch for the `'user'`-role case; see AC4 deviation above)
**Tests passing in CI:** 54 / 54, plus all 8 PR #755 CI checks green (including `Cross-tenant isolation spec — 20x repeat, zero-tolerance` and `Run assurance gate`)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — 15 Products-group route tests | ✅ | ✅ | `tests/check-vrne-s1-server-wiring.js` |
| AC2 — 18 Features/journeys-group route tests | ✅ | ✅ | `tests/check-vrne-s1-server-wiring.js` |
| AC3 — 4 allowed-role tests (`admin`/`engineer`/`product`/`user`) | ✅ | ✅ | `tests/check-vrne-s1-require-non-viewer.js`; `'user'` case added post-CI-catch |
| AC4 — 4 fail-closed tests | ✅ | ✅ | `tests/check-vrne-s1-require-non-viewer.js` |
| AC5 — denial logging (unit + integration) | ✅ | ✅ | `tests/check-vrne-s1-require-non-viewer.js`, `tests/check-vrne-s1-server-wiring.js` |
| Integration — real `server.js` dispatch | ✅ | ✅ | `tests/check-vrne-s1-server-wiring.js` |
| Resolver-reuse-not-duplicated (Architecture Constraint) | ✅ | ✅ | `tests/check-arl-s2-admin-middleware.js` (`T-resolveRole`) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query pattern beyond `requireAdmin`'s existing adapter call | ✅ | Reuses `resolveRole(req)`, no new DB call shape introduced |
| Security — deny by default; fail-closed on ambiguous role | ✅ | AC1/AC2/AC4 tests; the one real gap found (missing `'user'` role) was caught by CI's zero-tolerance E2E gate before merge, not shipped to production |
| Audit — every denial logged with person ID, tenant ID, timestamp, route | ✅ | AC5 tests, log schema matches `requireAdmin`'s existing `admin_access_denied` convention |
| Data residency | N/A | No new persisted data; reads existing `req.session.role` |
| Availability | N/A | Synchronous in-process check, no new external dependency |
| Accessibility | N/A | Server-side authorization change, no UI surface of its own |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 (Metric 1 — Viewer role actually enforces read-only access) | ✅ | 2026-08-23 | Partial: 33/33 Products + Features/journeys write routes now return a real denial for a viewer-role session (up from 0%). Epic-wide target (100% across Products, Features/journeys, Skill sessions, Credits/billing, edge-case routes) not yet reached — `vrne-s2`/`vrne-s3`/`vrne-s4` still pending. Signal: **on-track**. |
| M2 (Metric 2 — Enumerated viewer-role write actions blocked, Tier 3 risk-reduction) | ✅ | 2026-08-23 | Same evidence as M1: 33 of the epic's total enumerated routes moved from unenforced to enforced. Epic-wide target of 0 remaining unenforced routes not yet reached. Signal: **on-track**. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Before `/definition` or `/review` sign-off on `vrne-s2`/`vrne-s3`/`vrne-s4` (same epic, same role-gate pattern), explicitly re-verify their own AC3/AC4-equivalent role enumerations against BOTH `team-management.js`'s `VALID_ROLES` AND `modules/user-roles.js`'s documented default-role fallback (`'user'`) — do not assume the 4-role list from this story's own AC text is complete. Owner: whoever runs `/definition`/`/review` for those stories.
2. Consider amending `vrne-s1`'s own AC3/AC4 text (or adding a story addendum) to name `'user'` explicitly, so `/trace` and future readers see the AC text matching shipped behaviour rather than a stale 4-role enumeration. Owner: operator, low priority (decisions.md already carries the authoritative record).

---

## DoD Observations

1. **Real regression caught by CI, not by design-time review — `/improve` candidate.** `vrne-s1`'s own `/review`, `/test-plan`, and `/definition-of-ready` sign-off all missed that `'user'` is the actual, documented default role for every single-person self-signup tenant (the majority real-world case) — the story's AC3/AC4 borrowed team-management.js's 4-role team-member list without checking it against the signup-flow's real default. The gap was caught only by PR #755's `Cross-tenant isolation spec — 20x repeat, zero-tolerance` CI gate (20/20 failures, `POST /products/new` → 403 instead of 200), exactly the kind of defense-in-depth catch that gate exists for — no production impact, since the PR was never merged with the gap present. Signal for `/improve`: any future role-gate story should have an explicit DoR check enumerating every real role-producing code path (team-management assignment AND signup-flow default), not just one of them.
2. **A second, masked pre-existing test-fixture bug was found and fixed in the same pass — `/improve` candidate.** `tests/check-vrne-s1-server-wiring.js`'s 33 AC1/AC2 tests used an unseeded fake identity (`tenantId: 't1'`, `login: 'viewer@test'`); because `server.js`'s bootstrap wires a real (fake-backed) live-role adapter process-wide, even these "isolated" gate calls triggered a real DB-shaped lookup that silently fell through to the same `'user'` default for an unrelated reason. These 33 tests were passing before this fix only by coincidence (`'viewer'` and the unresolvable-identity fallback were both denied for the same reason) — they never actually exercised a real `'viewer'`-role resolution until fixed to seed a genuine `e2e-viewer` identity via the existing `/test/seed-multi-user-roles` route. This is a live instance of this repo's own documented "mock-shape verification when reusing an adapter for a new purpose" standard (CLAUDE.md coding standards) — worth citing as a concrete example if that standard is ever revised.
3. Full root-cause analysis and remediation for both findings above is recorded in `artefacts/2026-08-21-viewer-role-no-enforcement/decisions.md` (2026-08-23 ARCH entry).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes" (vrne-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
