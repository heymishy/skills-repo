# NFR Profile: CSRF guard diagnostic logging

**Feature:** 2026-08-30-csrf-guard-diagnostic-logging
**Created:** 2026-08-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Negligible overhead | One extra `console.info`/`JSON.stringify` call per token generate/check, on a low-frequency path | Code review | csdl-s1 |

**Source:** Story ACs.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No full secret values logged | Only 8-hex-char prefixes of tokens and session ids are logged, never the full value | Story's own Architecture Constraints | csdl-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (truncated token/session-id prefixes and a Fly machine id only; no full secret ever logged)

**Source:** This story's own Architecture Constraints.

---

## Data residency

Not applicable.

---

## Availability

Not applicable — observability-only change, no behavioural or availability impact.

---

## Compliance

Not applicable.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

This logging is temporary by design — tracked in `decisions.md` as a required follow-up to remove once the root cause it is meant to surface is confirmed.
