# NFR Profile: journey-gate-live-completion-sticky-gap

**Feature:** 2026-09-11-journey-gate-live-completion-sticky-gap
**Created:** 2026-09-11
**Last updated:** 2026-09-11
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No material change | String-literal addition to an existing client-side function only — no new computation, request, or render pass | Code review | jgls-s1 |

---

## Security

None identified — no data handling, auth, or input-validation change.

**Data classification:**
- [ ] Public
- [x] Internal — non-public but low sensitivity
- [ ] Confidential
- [ ] Restricted

---

## Data residency

Not applicable.

---

## Availability

None identified — this is a client-side rendering behaviour fix on an already-live page; no change to server availability, error handling, or failure modes.

---

## Accessibility

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Keyboard operability preserved | Existing form/button markup unaffected — only positioning CSS added | AC2 (unit test) | jgls-s1 |

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None identified. Root cause was confirmed via live reproduction (direct DOM/JS inspection of both code paths on `wuce-staging.fly.dev`, 2026-09-11) before this story was written — not inferred.
