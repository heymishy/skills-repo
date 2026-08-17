# Definition of Done: Start an impersonation session (search, reason-gated, session swap)

**PR:** https://github.com/heymishy/skills-repo/pull/534 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/d1-start-impersonation-session.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d1-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/d1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1–AC6 (search by login/tenant, reason-gated, `/admin/impersonate` page, session swap) | ✅ | `check-d1-start-impersonation-session.js`, 23 assertions + live-verified 2026-08-17 | Automated test (fresh) + live Chrome check | None |

23/23 assertions pass fresh, including "no d1 file uses the banned `req.session.token` field" (canonical session-field NFR). **Live-verified 2026-08-17** as part of `d2`'s DoD live-check: searched/selected `tenant-demo-1`, entered a required reason, clicked "Act as →", session correctly swapped (confirmed via `/dashboard` and `/settings` both showing `tenant-demo-1`'s real identity/data, not `heymishy`'s).

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing in CI:** 23/23, re-run fresh 2026-08-17.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: canonical `req.session.accessToken`, never `req.session.token` | ✅ | Automated test, re-run fresh, passing |

---

## Metric Signal

**Impersonation audit completeness (Metric 4)**
Signal: not-yet-measured
Evidence note: This story is the entry point the metric depends on; live-verified working correctly today, but no aggregate usage/audit-completeness telemetry traced in this retroactive pass.
Date measured: null

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. ~4 weeks live in production. This is the ONE story in this batch with a genuine, real, same-session end-to-end live functional test (not just a spot-check) — the impersonation flow it built was actually exercised live today to investigate `d2`'s finding, and it worked correctly throughout (session swap, correct data isolation, clean exit).
