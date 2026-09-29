# NFR Profile: Web UI Learnings and Improvements Integration

**Feature:** 2026-09-28-weeb-ui-learnings-and-improvements
**Created:** 2026-09-30
**Last updated:** 2026-09-30
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Signal aggregation latency | <200ms for solo operator scale (<2MB workspace), on-demand parsing | Wall-clock timing, `getSignals()` invocation to return | `ep1-s1` |
| `/api/signals` endpoint latency | <250ms (aggregator <200ms + route overhead <50ms) | HTTP request arrival to response transmission | `ep1-s2` |
| Skill launcher render time | <100ms | Playwright navigation timing | `ep1-s3` |

**Source:** Story ACs / NFRs, each independently specific and measurable.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new attack surface | Aggregator reads local workspace files only (fs/path built-ins); `/api/signals` is read-only, returns no user-supplied content unsanitised; launcher introduces no new npm dependencies | Tech-stack.md constraint | `ep1-s1`, `ep1-s2`, `ep1-s3` |
| Graceful failure, no data leakage on error | Parse errors and aggregator exceptions are caught and surfaced as structured signals/error responses — never a raw stack trace or file-path leak to the client | Story ACs (AC3 in both `ep1-s1` and `ep1-s2`) | `ep1-s1`, `ep1-s2` |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Signal content is drawn from this repo's own workspace/delivery artefacts (capture-log, learnings, decisions, etc.) — internal engineering process data, not customer or regulated data.

**Source:** Discovery/benefit-metric artefacts' own stated scope.

---

## Data residency

**Not applicable** — no new data storage; signals are read on-demand from existing local files, nothing persisted beyond the existing workspace.

---

## Availability

**Not applicable** — no new infrastructure; entirely within the existing web-ui process.

---

## Compliance

**No compliance frameworks apply.** Confirmed against `benefit-metric.md`'s own Tier 3 assessment — no named regulatory clause or audit finding applies to this repo's current deployment context.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Accessibility

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| Keyboard navigation | All CTA buttons (primary and advanced) are keyboard-navigable (Tab order, Enter/Space to activate) | `ep1-s3` |
| Screen reader support | Button labels and primary/advanced distinction are announced; colour is not the sole indicator of visual hierarchy | `ep1-s3` |
| Not applicable | `ep1-s1` (server-side only, no rendered UI); `ep1-s2` (JSON-only endpoint, no rendered UI) | `ep1-s1`, `ep1-s2` |

---

## Gaps and open questions

No NFR gaps identified at 2026-09-30.
