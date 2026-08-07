# NFR Profile: kanban-consolidation

**Feature:** 2026-07-19-kanban-consolidation
**Created:** 2026-07-19
**Last updated:** 2026-07-19
**Status:** Active

---

## Performance

Tenant-level board aggregation (AC4) queries across every product a tenant owns. No formal SLO defined; expected to reuse `handleGetDashboard`'s existing `Promise.all` per-product parallelisation pattern so per-product queries don't serialise. Realistic tenant product counts on this platform are small; no load-testing target set for this story.

---

## Security

**Data classification:**
- [x] Public — no PII, no sensitive data

**Source:** Any user-supplied or repo-supplied text rendered on a board (journey/feature names) must be escaped, consistent with both current implementations' existing behaviour. Covered by a dedicated escaping test across all 3 scopes.

---

## Data residency

Not applicable.

---

## Availability

Not defined — no runtime service component beyond the existing web-ui process.

---

## Compliance

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| External dependency on removed routes | Whether any script, bookmark, or external integration depends on `/features`, `/actions`, or `/status` cannot be exhaustively verified from code alone | Hamish King | Accepted risk, per operator's confirmed "remove outright" decision — no further action required unless something surfaces post-removal |
