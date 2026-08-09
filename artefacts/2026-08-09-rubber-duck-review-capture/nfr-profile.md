# NFR Profile: Rubber-Duck Review Capture

**Feature:** 2026-08-09-rubber-duck-review-capture
**Created:** 2026-08-09
**Last updated:** 2026-08-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| CI job time budget | Bounded, matching the existing `scenario-a-staging-e2e`/`scenario-b-staging-e2e` `timeout-minutes: 10` precedent | CI job duration, reviewed if it regularly approaches the timeout | rdrc-s4 |

**Source:** Story AC (rdrc-s4 NFR section, following ADR-018's existing E2E job pattern)

For all other stories: No performance SLOs defined — these are manual/on-demand, operator-paced tools (rdrc-s1, rdrc-s2), a manual validation exercise (rdrc-s3), or a text-only conditional addition to skill output (rdrc-s5), not latency-sensitive production paths.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Secrets management | No credential (transcription API key, staging auth token) is hardcoded or handled in the agent's/tool's own context — must use the existing secrets-store pattern | `product/constraints.md` #12 | rdrc-s1, rdrc-s2, rdrc-s4 |
| Data handling — transient capture content | Raw recordings and transcripts are processed then discarded — no repo commit, no durable storage beyond the immediate run | Discovery Out of Scope ("Long-term storage or a playback/archive system") + Discovery Constraints ("Transient handling of recordings/screen content") | rdrc-s1, rdrc-s2 |
| Real-token-cost guard | Any real LLM call (transcription, extraction, or agent-driven review) must go through the existing mock-gateway safety net rather than being a new, unguarded cost path | `mgar-s1` (auto-revert TTL + CI force-on step) | rdrc-s3, rdrc-s4 |
| Credential mechanism reuse | The agent-driven CI job authenticates against real staging using the existing `e2e-test-admin` identity and `E2E_STAGING_*` secrets — no new credential mechanism | Story AC (rdrc-s4 AC2), `product/constraints.md` #12 | rdrc-s4 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

A screen recording or an agent's live browser session against real staging could incidentally show real tenant/user data mid-walkthrough, even though nothing is persisted long-term — classified Confidential on that basis, per discovery's Constraints section.

**Source:** `product/constraints.md` #12 / Discovery Constraints section

---

## Data residency

Not applicable. No data from this feature is persisted beyond the immediate run (transcribe-and-discard per discovery's explicit MVP scope and Out of Scope sections) — there is no durable data store for which a residency boundary would apply.

**Source:** Discovery Out of Scope

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | Not applicable | This is an internal delivery-quality tool (on-demand operator tool, or a CI job), not a customer-facing service with its own availability commitment. |

**Source:** Not defined — internal tooling, no SLA agreement exists or is needed.

---

## Compliance

Not applicable. No named regulatory framework or compliance obligation applies to this initiative — confirmed in `benefit-metric.md`'s Tier 3 section. Discovery's data-handling constraints (transient content, no long-term storage) are hygiene concerns addressed under Security above, not compliance obligations tied to an external framework.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

No NFR gaps identified at 2026-08-09.
