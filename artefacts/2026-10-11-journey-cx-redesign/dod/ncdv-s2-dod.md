# Definition of Done: Stop forcing SSL on local Postgres connections

**PR:** https://github.com/heymishy/skills-repo/pull/979 | **Merged:** 2026-10-12
**Story:** artefacts/2026-10-11-journey-cx-redesign/dor/ncdv-s2-dor.md (short-track)
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/ncdv-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/ncdv-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| Local Postgres connects without a forced-SSL error, real Neon/staging/production behavior unchanged | ✅ | `check-ncdv-s2-local-postgres-ssl.js` (2/2) PLUS a real disposable `postgres:16-alpine` Docker container, `migrateSchema()`/`listJourneys()` both connecting and querying cleanly with no SSL error PLUS a real E2E spec re-run confirming the SSL error specifically is gone (it now fails at a different, separate, already-known gap) | `production-observed`-equivalent for local (a real local Postgres container, not staging/production, but a real external system nonetheless) + `unit` for the non-local-host-unchanged guarantee | None |

---

## Scope Deviations

None. Single-function fix, scoped narrowly as planned.

---

## Test Plan Coverage

**Tests from plan implemented:** N/A (short-track) — `check-ncdv-s2-local-postgres-ssl.js` written and passing
**Tests passing in CI:** 2/2, full repo suite green, also independently verified in a Linux/Node 24 Docker container before pushing

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| None applicable — infra fix, no new NFR surface | N/A | — |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None directly — this is a developer-experience/testing-infrastructure fix, not a product-facing feature contributing to any of this feature's own M1/M2/M3 metrics | N/A | N/A | Its real benefit is unblocking local E2E execution for `jcx-s3` and 4 other already-shipped stories, not a user-facing outcome of its own |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. **Owner: future session, separate story.** The dashboard's shared page shell (`html-shell.js`'s `renderShell`) embeds no page-wide CSRF token — confirmed still blocking full local E2E execution even after this fix (the same E2E spec now fails on this gap specifically, having gotten past the SSL error). Deliberately not attempted here (bigger, riskier shared-template change affecting every page using the shell) — needs its own dedicated short-track story with careful scoping around variable-naming collisions on pages that already declare their own local `csrfToken`.
2. **Owner: future session, optional.** `_sessionTurnsPool` (`server.js` line ~1449) has the same unconditional `ssl: { rejectUnauthorized: false }` pattern this fix just removed from `journey-store-pg.js` — not confirmed to actually block anything today (not named in any of this session's own E2E investigations), so not touched here, but worth the same fix if it's ever found to matter.

---

## DoD Observations

1. This story exists because the operator directly asked "do we need to solve that postgres gap first" rather than letting a known, previously-logged infra gap sit untouched through yet another story (`jcx-s3`) that would have hit it. Worth noting for `/improve`: a `pendingActions` item that blocks MULTIPLE stories across MULTIPLE sessions (this one had blocked `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4` already) is a stronger signal to actually schedule the fix than a single-story RISK-ACCEPT — the cost of re-explaining/re-RISK-ACCEPTing the same gap each time eventually exceeds the cost of just fixing it.
2. Confirmed, via direct investigation rather than assumption, that `_creditsPool`/`_userRolesPool` (the two pools in `server.js` that already omit the explicit `ssl` option) were the correct reference pattern — their own already-working production behavior (no reported SSL failures against real Neon) is what gave confidence the conditional-skip approach here is safe, rather than guessing.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ncdv-s2 (local Postgres SSL fix).
Check:
1. Is the evidence that real Neon/staging/production behavior is unchanged convincing (not just asserted)?
2. Is the real-Postgres-container verification strong enough, or should a DATABASE_URL-gated automated test be added to prevent regression?
3. Are the two follow-up actions (dashboard CSRF gap, _sessionTurnsPool parity) worth scheduling now or later?
Report findings as HIGH / MEDIUM / LOW.
```
