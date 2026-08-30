# NFR Profile: Journey gate-confirm missing CSRF field

**Feature:** 2026-08-30-journey-gate-confirm-missing-csrf
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No new latency on the hot path | `generateCsrfToken` is idempotent; no new Redis write for a session that already has a token | Code review of the call site | jgcc-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| CSRF protection actually functions on this form | The gate-confirm button's form must carry a valid `_csrf` field so `csrfGuard` can do its job | Matches the already-correct sibling form in `journey.js` | jgcc-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (session/CSRF token metadata only; no new data category introduced)

**Source:** This story's own Architecture Constraints.

---

## Data residency

Not applicable.

---

## Availability

Not applicable — this fix restores availability of an existing action (advancing a journey stage), it does not introduce new availability concerns of its own.

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None.
