# NFR Profile: web-ui-navigation-legibility

**Feature:** 2026-08-31-web-ui-navigation-legibility
**Created:** 2026-09-10
**Last updated:** 2026-09-10
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new-request overhead (`wnl-s1`, `wnl-s2`) | None — CSS/markup-only changes, no new network requests | Code review | `wnl-s1`, `wnl-s2` |
| Dashboard load time not measurably regressed (`wnl-s3`) | No noticeable page-load regression from the added no-product count computation | Rough before/after timing check at implementation time — not a formal load test | `wnl-s3` |

**Source:** Story AC / Not defined (no formal performance SLO exists for this repo's web UI)

---

## Security

No new input surface, no new authentication/authorisation path, no new secrets handling. Existing `escHtml()`/`_escapeHtml()` conventions are reused unchanged across all three stories (explicit Architecture Constraint on each story).

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** Not defined — no named security standard applies beyond this repo's own existing escaping/CSRF conventions, reused unchanged.

---

## Data residency

Not applicable — no new data storage, no new data movement. All three stories read existing `pipeline-state.json`/Postgres data already stored where it is today.

**Source:** Not applicable

---

## Availability

No availability SLA changes — three small, additive UI changes to already-live production infrastructure. No new failure mode introduced; each story's own regression-guard ACs (`wnl-s1` AC5, `wnl-s2` AC4, `wnl-s3` AC5/AC6) exist specifically to confirm existing behaviour is preserved.

**Source:** Not defined — no formal availability SLA exists for this repo's web UI; "additive and non-disruptive" is a discovery-level constraint, not a measured target.

---

## Compliance

Not applicable — no regulated data, no named compliance framework, no external audit obligation touches this feature.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| `wnl-s3` dashboard-load timing | Only a rough before/after check is specified, not a formal measurement — acceptable given this repo has no formal performance SLO elsewhere, but worth tightening if `/journey`'s own disk-read cost (which `wnl-s3` adds once more to `/dashboard`) becomes a real bottleneck as feature count keeps growing (currently 270+) | Platform Owner (Hamish King) | Revisit if a real slowdown is reported post-ship |

_Otherwise: no NFR gaps identified at 2026-09-10._
