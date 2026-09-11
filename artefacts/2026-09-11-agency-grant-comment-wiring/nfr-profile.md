# NFR Profile: agency-grant-comment-wiring

**Feature:** 2026-09-11-agency-grant-comment-wiring
**Created:** 2026-09-11
**Last updated:** 2026-09-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No material change | Wiring only, no new queries beyond what the already-tested handler functions already issue | Code review | gcw-s1 |

---

## Security

**Load-bearing NFR for this story.** Three newly-wired mutating routes (`POST /api/agency/grants`, `POST /client/comments`, `POST /api/agency/comments`) must be CSRF-protected — they currently are not, at the handler-function level, and wiring them into live URLs without adding `csrfGuard` would ship 3 new CSRF-vulnerable endpoints. AC5 is the hard AC for this.

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

---

## Data residency

Not applicable — no new data storage or movement, wiring only.

---

## Availability

None identified — additive wiring on already-live infrastructure; no change to existing routes' behaviour.

---

## Accessibility

Not applicable — API routes only, no UI in this story (matches the original epic's own explicit deferral of visual design).

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None identified. Root cause (deferred wiring, each of Stories 2/3 assuming the other owned it) was confirmed by reading both stories' own text and exhaustive grep across `src/web-ui/`, and by live reproduction on staging (2026-09-11) — not inferred.
