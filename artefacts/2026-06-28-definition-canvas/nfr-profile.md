# NFR Profile: Definition Story Map — Interactive Canvas

**Feature:** 2026-06-28-definition-canvas
**Created:** 2026-06-28
**Last updated:** 2026-06-28
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Canvas-edit round-trip (M3) | P90 ≤ 3s from "Apply changes" click to canvas refresh in local dev | Manual smoke test: 10 sequential apply-changes actions on 5 stories × 2 epics; record P50 and P90 | dic.5 |
| Drag-event frame-rate | No observable frame drops on up to 30 cards × 4 epic columns | Manual: Chrome DevTools Performance tab during drag sequence | dic.1 |
| parsePhaseModel parse-once | Phase model parsed once per session init, not per drag event | Unit test: call counter asserts parse count === 1 after N drags | dic.2 |

**Source:** benefit-metric.md (M3). Story NFR sections (dic.1 drag performance, dic.2 parse-once).

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| HTML output escaping — story titles | Operator-entered story titles HTML-escaped before DOM injection; no `innerHTML` with unsanitised input | OWASP A03 (Injection) | dic.3 |
| Path traversal guard — artefact writes | `path.resolve(artefactPath).startsWith(repoRoot + path.sep)` before any disk write; HTTP 400 on failure; raw path not logged in production | OWASP A01 (Broken Access Control), NFR-sec-pathtraversal (ougl rule), architecture-guardrails.md | dic.5 |
| Canonical session token field | All routes use `req.session.accessToken` — never `req.session.token` | CLAUDE.md coding standards | dic.5 |
| No raw path in error logs | On path traversal guard failure, the resolved path is not logged | OWASP A09 (Security Logging and Monitoring Failures) | dic.5 |

**Data classification:**
- [x] Public — no PII, no sensitive data in the canvas interaction layer itself. The definition.md artefact written to disk contains feature/story titles authored by the operator — not personal data.

**Rationale:** Canvas edits manipulate story ordering and titles in definition.md. The content is operator-created feature decomposition material, not personal data. Session tokens flow through `req.session.accessToken` and are not exposed in canvas-edit responses. Path traversal guard applies to any disk write derived from session/request data. Data classification: Public.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| No PII persisted to disk | definition.md written to local disk contains only feature/story title strings entered by the operator — no personal data | No regulatory obligation | dic.5 |
| artefact writes stay within repoRoot | Path traversal guard prevents writes outside the repository root | ougl rule (CLAUDE.md) | dic.5 |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| No SLA defined | N/A | N/A | Internal developer tooling; no uptime SLA required |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | N/A | N/A | All |

**Named sign-off required?**
- [x] Not required

**Rationale:** No regulatory framework applies. Data classification is Public. No PII, PCI, PHI, or audit obligation beyond standard code review. Session data is transient in-memory; disk writes are to local repository files only.

---

## Accessibility

| NFR | Requirement | Standard | Applies to story |
|-----|-------------|----------|-----------------|
| WCAG 2.1 AA — story card origin discriminators | Inherited (model) and new (operator) card states communicated by text tags ("model", "new") in addition to border style; colour is not the only discriminator | WCAG 2.1 SC 1.4.1 (Use of Colour) | dic.1 |
| WCAG 2.1 AA — keyboard reorder | Story card reorder accessible via up/down arrow keys when card has focus; not drag-only | WCAG 2.1 SC 2.1.1 (Keyboard) | dic.1 |
| WCAG 2.1 AA — epic rename tooltip | Tooltip carries `role="alert"` or `aria-live="polite"`; dismissed state announced | WCAG 2.1 SC 4.1.3 (Status Messages) | dic.1 |
| WCAG 2.1 AA — locked phase row | Lock overlay carries `role="note"` or `aria-label`; locked row cells not reachable as keyboard drop targets | WCAG 2.1 SC 2.1.1 (Keyboard), SC 1.3.1 (Info and Relationships) | dic.2 |
| WCAG 2.1 AA — add-story flow | + button keyboard-activatable (Tab, Space, Enter); inline input focus-trapped until submit/cancel; "new" tag carried by visible text | WCAG 2.1 SC 2.1.1 (Keyboard), SC 1.4.1 (Use of Colour) | dic.3 |
| WCAG 2.1 AA — touch selection | Selected card carries `aria-selected="true"`; deselect affordance accessible (via retap or keyboard) | WCAG 2.1 SC 4.1.2 (Name, Role, Value) | dic.4 |

**Source:** Story NFR sections (all dic.1–dic.4), architecture-guardrails.md accessibility guardrail.

---

## NFR gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Accessibility — AT announcement depth | axe-core tests cover structural WCAG AA compliance but cannot verify spoken announcement quality in real screen reader usage. Real AT testing (NVDA, VoiceOver) is manual and deferred to post-MVP. | Hamish King | Post-MVP |
| Performance — M3 round-trip P90 | Measured by manual smoke test only (real HTTP server + real definition.md rewrite required). If P90 > 5s in manual test, investigate before merge. | Implementer | At implementation |
| Touch — JSDOM cannot test TouchEvent | All touch handler tests exercise functions directly with synthetic objects; real touch device verification is manual. | Implementer | At DoR sign-off (must have completed manual smoke test on touch device) |

**No NFR gaps are blockers for DoR sign-off except:** The touch smoke test (manual, on real device or Playwright touch simulation) must be completed before dic.4 DoR sign-off.
