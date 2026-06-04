# NFR Profile: /ideate Web UX — Structured Session Interface

**Feature:** 2026-05-21-ideate-web-ux
**Created:** 2026-06-04
**Last updated:** 2026-06-04
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Assumption card append latency | Card visible in `#assumption-cards` within 500ms of `assumptionCard` SSE event dispatch | Unit test: synthetic event dispatch → card presence assertion; time delta measured in test | iwu.3 |
| Session shell render time | No regression from pre-iwu baseline | Manual smoke test: session shell renders without perceptible delay | iwu.1, iwu.2 |
| Confirm/flag endpoint response | No specific SLO — in-memory write; expect < 100ms under normal load | Not formally tested; implicit from in-memory session store | iwu.4 |

**Source:** Story NFR sections (iwu.3 explicit 500ms target). No formal performance SLOs defined beyond the card latency target. Baseline measurement only for other endpoints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| HTML output escaping — artefact paths | Artefact path display values HTML-escaped before DOM injection; no `innerHTML` with unsanitised content | OWASP A03 (Injection) | iwu.1 |
| HTML output escaping — assumption card text | Assumption card `text` field HTML-escaped before DOM injection; raw model output must not be set via `innerHTML` | OWASP A03 (Injection) | iwu.3 |
| cardId path traversal guard | `cardId` URL parameter validated as 8-character hex string before any session lookup is performed; HTTP 400 returned on invalid format; raw path value not logged in production | OWASP A01 (Broken Access Control), architecture-guardrails.md path traversal guard | iwu.4 |
| Session state not in error bodies | Error response bodies (`404`, `400`) must not include `session.assumptionCards[]` or any other session state | OWASP A02 (Cryptographic Failures / data exposure) | iwu.4 |

**Data classification:**
- [x] Public — no PII, no sensitive data

**Rationale:** Session data is in-memory only (ADR-019, 30-min TTL). Assumption text is user-generated ideation content — not personal data under GDPR, not commercially sensitive at storage tier. No data written to disk. No external system receives session content. Classification: Public.

**Source:** OWASP Top 10, `.github/architecture-guardrails.md` path traversal guard (NFR-sec-pathtraversal), Story ACs (iwu.4 AC6).

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| No data persistence | Session data held in-memory only; no disk writes; no external transmission of assumption content | ADR-019 (session lifecycle TTL) | iwu.3, iwu.4, iwu.5 |

**Source:** ADR-019 (in-memory session store, 30-min TTL). No regulatory data residency obligation — data classification is Public.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| No SLA defined | N/A | N/A | Enhancement to a developer tool; no uptime SLA required |

**Source:** Not defined — this is an internal developer tooling enhancement, not a customer-facing service. No SLA, RTO, or RPO obligations.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | N/A | N/A | All |

**Named sign-off required?**
- [x] Not required

**Rationale:** No regulatory framework applies. Data classification is Public. No PII, no PCI, no PHI, no audit obligation beyond standard code review. Session data is transient in-memory only.

---

## Accessibility

| NFR | Requirement | Standard | Applies to story |
|-----|-------------|----------|-----------------|
| WCAG 2.1 AA — chip state discriminators | `chip-ok` and `chip-warn` states must each carry a non-colour discriminator (label, icon, or `aria-label`) in addition to colour | WCAG 2.1 SC 1.4.1 (Use of Colour) | iwu.1 |
| WCAG 2.1 AA — keyboard reachability | All chips in `#context-manifest` keyboard-reachable; accessible name announced via `aria-label` or visible label | WCAG 2.1 SC 2.1.1 (Keyboard) | iwu.1 |
| WCAG 2.1 AA — right panel sections | `#assumption-cards` and `#draft-content` keyboard-reachable as distinct sections; section boundaries announced to assistive technology | WCAG 2.1 SC 2.1.1 (Keyboard), SC 1.3.1 (Info and Relationships) | iwu.2 |
| WCAG 2.1 AA — card state discriminators | Card type and risk states communicated by text labels in addition to colour | WCAG 2.1 SC 1.4.1 (Use of Colour) | iwu.3 |
| WCAG 2.1 AA — confirm/flag button announcement | State change from confirm or flag button announced to assistive technology; result communicated beyond colour | WCAG 2.1 SC 1.4.1 (Use of Colour), SC 4.1.3 (Status Messages) | iwu.4 |
| WCAG 2.1 AA — nudge bar keyboard access | Nudge bar keyboard-activatable; "review now" button activatable by keyboard; appearance does not steal focus; scroll-to and focus transfer announced | WCAG 2.1 SC 2.1.1 (Keyboard), SC 3.2.2 (On Input) | iwu.5 |

**Source:** Story NFR sections (all iwu.1–iwu.5), architecture-guardrails.md accessibility guardrail, ADR-018 (accessibility requirement for non-colour discriminators on cards).

---

## NFR gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility — AT announcement depth | Automated axe-core tests cover structural WCAG AA compliance but cannot verify the quality of spoken announcements in real screen reader usage (NVDA, VoiceOver). Real AT testing is manual and deferred to post-MVP. | Hamish King | Post-MVP |
| Performance — 500ms card latency | The 500ms target is tested via synthetic unit test with `performance.now()`. Real-browser SSE dispatch latency varies. If the target is missed in E2E, revise the target before merge rather than skipping the test. | Implementer | At implementation |

**No NFR gaps are blockers for DoR sign-off.** The AT announcement depth gap is a known post-MVP item, not a delivery risk for the MVP verification surface. The 500ms target is unit-testable and the gap only materialises if E2E and unit diverge.
