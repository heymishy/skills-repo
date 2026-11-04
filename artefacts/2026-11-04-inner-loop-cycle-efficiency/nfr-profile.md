# NFR Profile: Inner Loop Cycle Efficiency

**Feature:** 2026-11-04-inner-loop-cycle-efficiency
**Created:** 2026-11-04
**Last updated:** 2026-11-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Timing-record write overhead | Adds no more than ~100ms to any skill's completion step | Direct timing comparison before/after instrumentation | ilce-s1 |
| Freshness-guard skip path | Completes well under 1 second (a flag check), vs. the multi-minute full-suite run it replaces | `pipeline-timings.jsonl` skip/ran flag timestamps | ilce-s2 |
| Review-dispatch active time per task | Sustained ≥10% reduction vs. 22.0 min/task baseline (Metric 1) | `pipeline-timings.jsonl` before/after comparison | ilce-s3 |
| `/workflow` reconciliation check latency | Adds no more than a few seconds to session-start report | Manual observation of `/workflow` run time | ilce-s4 |

**Source:** Story AC (all four — no stakeholder SLA or `constraints.md` performance clause applies to this platform-internal feature)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | No secrets, tokens, or session content written to `pipeline-timings.jsonl` — only skill name, story slug, stage, timestamp, counts | `product/constraints.md` #12 (credentials are structural, never in agent environment) | ilce-s1 |
| Authentication | `gh pr list` cross-reference uses the operator's own existing `gh` CLI authentication — no new credentials introduced | `product/constraints.md` #12 | ilce-s4 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [x] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Source:** `product/constraints.md` — no PII involved; timing/metadata only

---

## Data residency

Not applicable. No regulated data, no data residency requirement — confirmed via `context.yml` (`meta.regulated: false`).

---

## Availability

Not defined. This is a platform-internal developer-tooling feature with no uptime SLA, RTO, or RPO target — the instrumentation log and reconciliation check are best-effort session-time mechanisms, not a hosted service.

---

## Compliance

Not applicable. `context.yml` shows `meta.regulated: false`, no compliance frameworks configured, and discovery's Constraints section names no regulatory obligation.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

No NFR gaps identified at 2026-11-04.
