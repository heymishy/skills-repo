# NFR Profile: Diagram Validation, Drift Accuracy, and Archify-Inspired Diagram Types

**Feature:** 2026-08-29-diagram-validation-and-types
**Created:** 2026-08-29
**Last updated:** 2026-08-29
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| No additional model/LLM call for diagnostic generation | Diagnostic generation and drift parsing add zero additional model/executor calls beyond the existing per-turn LLM call | Automated test (zero-added-call assertion, matching `drift-comparator.js`'s existing zero-latency design) | S1, S2, S3, S4, S5 |

**Source:** Story ACs — no stakeholder-specified SLO beyond the zero-added-latency target above.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Diagnostic text escaping | Structured diagnostic text (SSE payload, log record, or rendered error box) must be escaped before insertion — no raw model-output injection into logs, SSE, or the DOM | Existing `escHtmlClient`/escaping conventions in `skills.js` | S1, S2 |
| Mermaid sanitization coverage | The new Sequence type must be covered by mermaid's existing `securityLevel: "strict"` configuration, same as the 3 existing mermaid-based types | Precedent: `csd-s1` (MC-SEC-01) | S5 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (diagram structure/content only; no customer PII, no payment data)

**Source:** `.github/standards/web-ui/web-ui-patterns.md` / existing `csd-s1` precedent

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | — | — |

**Source:** Not applicable — discovery Constraints section identifies no regulated data or residency requirement; `context.yml` confirms `meta.regulated: false`.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Uptime SLA | Not defined | — | Matches existing platform-wide posture — no new SLA introduced by this feature |
| RTO / RPO | Not defined | — | No new persistence mechanism introduced (diagnostics are transient SSE/log events, not stored state) |

**Source:** Not defined — consistent with the rest of this repository's features.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | — | — | — |

**Named sign-off required?**
- [x] Not required

Discovery Constraints section records no regulatory obligation, and `context.yml` confirms `meta.regulated: false` — Step 4a (Regulated constraint propagation check) was skipped during `/definition`.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility | S1's diagnostic mechanism (marker-level failure) has no visual/accessible presentation of its own — it's a server-side/SSE-level event. Confirm at DoR whether the diagnostic needs a visible operator-facing surface beyond logs, or whether S2's `<details>` mechanism (which does have an accessibility NFR) is the only visible diagnostic surface operators actually see. | Hamish King — Platform Owner | Revisit at DoR for S1 |

No further NFR gaps identified at 2026-08-29.
