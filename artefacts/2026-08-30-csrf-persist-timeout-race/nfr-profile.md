# NFR Profile: CSRF persist timeout race (session-persist timeout increase)

**Feature:** 2026-08-30-csrf-persist-timeout-race
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No perceptible latency change under normal conditions | Real Redis writes typically complete in well under 500ms; the new 8000ms cap only changes behaviour when a write is genuinely slow | AC1 test (2000ms injected delay case) | cptr-s1 |
| Bounded worst-case wait | A hung write must not delay the response beyond the new 8000ms cap | AC4 test | cptr-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| CSRF token durability | A minted CSRF token must be durably persisted before the response embedding it is sent, in the overwhelming majority of real-world conditions, closing the gap that produces a false-positive CSRF rejection | Follows on from `cpr-s1` (2026-08-27), same underlying guarantee | cptr-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (session/CSRF token metadata only; no new data category introduced)

**Source:** `cpr-s1`'s own precedent and this story's own Architecture Constraints.

---

## Data residency

Not applicable — no data storage location changes.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-----|
| Response never hangs indefinitely | A fully broken/hung Redis must not delay the response beyond the new 8000ms cap | AC4 | Matches `persistSession`'s own existing best-effort philosophy; only the bound's value changed, not the philosophy |

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

None.
