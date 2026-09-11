# NFR Profile: agency-self-activation

**Feature:** 2026-09-11-agency-self-activation
**Created:** 2026-09-11
**Last updated:** 2026-09-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible added latency | Single indexed UPDATE by primary key, same cost profile as the already-shipped `convertOrganisationToStandalone` | Code review | asa-s1 |

---

## Security

Extends the same tenant-isolation boundary (ADR-025) the original `2026-07-30-agency-client-organisations` epic's Story 2 was given closer review for. This story's own scope is narrow (single-column, one-directional, precedent-mirroring), but is not treated as risk-free — server-side-only admin gate (AC2) and one-way `standalone`-only transition (AC3) are both hard ACs, not best-effort.

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

---

## Data residency

Not applicable — no new data storage or movement, single-column update to an existing table.

---

## Availability

None identified — additive action on already-live infrastructure; no change to existing routes' behaviour.

---

## Accessibility

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Keyboard-navigable form | Real `<form>`/`<input>` elements, matching `org-conversion.js`'s own established pattern | Code review | asa-s1 |

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None identified. Root cause (the missing precondition-setter in the original epic) was confirmed via exhaustive code search and live reproduction on staging (2026-09-11) before this story was written — not inferred.
