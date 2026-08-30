# NFR Profile: CSRF field on the live-injected gate-confirm form

**Feature:** 2026-08-30-show-commit-link-missing-csrf
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible overhead | One additional JS variable and one string fragment in an existing template | Code review | sccf-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| CSRF protection actually functions on this form | The live-injected gate-confirm form must carry a valid `_csrf` field so `csrfGuard` can do its job, matching the already-fixed server-rendered sibling form | `jgcc-s1`'s own precedent | sccf-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (CSRF token metadata only; no new data category introduced)

**Source:** This story's own Architecture Constraints.

---

## Data residency

Not applicable.

---

## Availability

Not applicable — this fix restores availability of an existing action (advancing a journey stage) for the common case of a session completing its first turn live; it does not introduce new availability concerns.

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None.
