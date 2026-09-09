# NFR Profile: journey-autofocus-scroll-trap

**Feature:** 2026-09-10-journey-autofocus-scroll-trap
**Created:** 2026-09-10
**Last updated:** 2026-09-10
**Status:** Draft — DoR preparation

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No material change | Attribute-conditional change only (`autofocus` moves from unconditional to gated on `showNewForm`) — no new computation, request, or render pass added | Code review | jasb-s1 |

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

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|--------------------|-------------------|-----------------|
| Not applicable | — | — | — |

---

## Availability

None identified — this is a client-side rendering behaviour fix on an already-live page; no change to server availability, error handling, or failure modes.

---

## Accessibility

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Keyboard operability preserved | The "Feature name" input remains reachable via Tab or click when not autofocused; the form's own submit flow is unchanged | AC3 (E2E test) | jasb-s1 |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-------------------------|---------------------|-------------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None identified. Root cause was confirmed via live reproduction (direct JS inspection of `window.scrollY`/`document.activeElement` on `wuce-staging.fly.dev`, 2026-09-10) before this story was written — not inferred.
