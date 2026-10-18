# NFR Profile: Real Playback Capture Automation

**Feature:** 2026-10-19-real-playback-capture-automation
**Created:** 2026-10-19
**Last updated:** 2026-10-19
**Status:** Active

---

## Performance

No performance SLOs defined — baseline measurement only. The CLI's own run time is not a named target; M2 (manual capture *human* time, not wall-clock CLI run time) is the relevant benefit metric instead.

**Source:** Not defined

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | `E2E_STAGING_AUTH_STUB_SECRET` read from `process.env` only — never hardcoded, printed, or logged | `product/constraints.md` #12; `auth-patterns.md` "no credentials in URLs or logs" | `rpca-s1` |
| Authentication | Reuses the existing `GET /test/session` route and `_isTestEndpointAllowed` mechanism unchanged — no new route, no widened blast radius | Confirmed at `/clarify`, 2026-10-19 | `rpca-s1` |
| Authorisation | Not applicable — the CLI operates with the same synthetic `e2e-`-prefixed tenant scoping the existing mechanism already enforces | — | `rpca-s1` |
| Input validation | CLI argument (feature slug) is used to construct a file path — must follow the existing path-traversal guard convention already established in `src/web-ui/routes/playback.js` | `web-ui-patterns.md` path traversal guard | `rpca-s1` |
| Audit logging | Not applicable — no new mutating action against the staging app itself; the capture run's own output is not a governed audit log | — | — |

**Data classification:**
- [x] Internal — non-public but low sensitivity (staging test/synthetic data only; production explicitly out of scope)

**Source:** `product/constraints.md` #12, #13; `.github/standards/auth/auth-patterns.md`

---

## Data residency

Not applicable — no data residency requirement; captured evidence is stored in this repo's own `artefacts/` directory, same as every existing playback capture.

**Source:** Not applicable

---

## Availability

No uptime SLA, RTO, or RPO applies — this is a developer-invoked CLI tool, not a hosted service.

**Source:** Not defined

---

## Compliance

No compliance framework applies. `regulated: false` per `.github/context.yml`.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-10-19.
