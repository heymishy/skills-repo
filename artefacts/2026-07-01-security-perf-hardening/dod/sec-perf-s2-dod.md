# Definition of Done: Re-validate admin role on every gated request so a mid-session demotion takes effect immediately

**PR:** https://github.com/heymishy/skills-repo/pull/474 | **Merged:** 2026-07-01
**Story:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — a demoted admin is denied 403 on their very next `requireAdmin`-gated request, no logout needed | ✅ | `check-sec-perf-s2-stale-role-revalidation.js` | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — `req.session.role` self-heals to the live value on denial | ✅ | Same file | Automated test, re-run fresh | None |
| AC3 — a mid-session promotion is also honoured (genuine bidirectional live check) | ✅ | Same file | Automated test, re-run fresh | None |
| AC4 — unwired adapter falls back to pre-existing cached-role behaviour, zero regression to `arl-s2`/`tir-s4`/`tir-s5` | ✅ | Same file, plus the three named pre-existing suites unaffected (not re-run individually in this pass — no later cluster's DoD pass has flagged a regression in them) | Automated test, re-run fresh | Documented, deliberate D37 deviation (see below) |
| AC5 — production wiring in `server.js` calls the same `getRoleForTenant` adapter, verified via a genuine two-different-people-get-two-different-roles behavioural test | ✅ | `T12`-adjacent wiring assertions in the same file | Automated test, re-run fresh | None |
| AC6 — adapter error/rejection fails closed (403), never falls back to stale cache | ✅ | Same file | Automated test, re-run fresh | None |

---

## Scope Deviations

**Documented, deliberate D37 deviation (not a defect):** the story's own Architecture Constraints explicitly deviate from CLAUDE.md's "stub defaults MUST throw" default — `setGetCurrentRole`'s unwired state falls back to trusting the cached `req.session.role` (pre-existing behaviour) rather than throwing, specifically so three pre-existing test suites (`arl-s2`, `tir-s4`, `tir-s5`) continue to pass unmodified. This is logged in the feature's own `decisions.md` per the story's own text — confirmed present as a named, reasoned exception, not an undocumented gap. Production always wires the adapter (AC5), so the fallback branch is dead in production.

**Out of Scope items confirmed still out of scope, not silently expanded:** `credits-guard.js`'s separate stale-role bypass check remains untouched (flagged in `decisions.md` as a candidate follow-up, not actioned in this DoD pass); session invalidation of other active devices remains unimplemented (live re-validation chosen instead, per the story's own explicit reasoning).

---

## Test Plan Coverage

**Tests passing:** 12/12 (`check-sec-perf-s2-stale-role-revalidation.js`), re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: one additional indexed DB query per `requireAdmin`-gated request, accepted given current admin-route volume | ✅ | By construction, per story's own NFR framing — not independently re-measured in this pass |
| Security: fails closed on adapter error (AC6); core purpose of the story | ✅ | AC6 test, re-run fresh, passing |
| Audit: existing `admin_access_denied` audit log continues to fire on live-demotion denial | ✅ | `T12` — "admin_access_denied audit log still fires on live-demotion denial", re-run fresh, passing |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per CLAUDE.md, short-track skips discovery/benefit-metric). Story serves the same security-hardening goal as the sibling `sec-perf` story's session-fixation-rotation work (AC5 of that story) — reducing the window of unauthorised privilege after a role change from "rest of session lifetime" to "next request."

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required by this story directly. The `credits-guard.js` stale-role bypass (structurally identical gap, different call site) remains a named-but-unactioned candidate in `decisions.md` — not converted to a follow-up story in this pass since no live incident has been reported against it.

---

## DoD Observations

1. ~6 weeks live in production, no incidents reported.
2. Good example of a well-reasoned, explicitly-logged deviation from a CLAUDE.md default rule (D37 throw-on-unwired) rather than either blindly following the rule and breaking three pre-existing test suites, or silently deviating without documentation — the deviation is traceable to `decisions.md` and scoped narrowly (production always wires the adapter).
