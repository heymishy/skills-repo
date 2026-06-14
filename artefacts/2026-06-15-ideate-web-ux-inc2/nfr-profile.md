# NFR Profile: /ideate Web UX — Increment 2 (Conditions Sidebar)

**Feature:** 2026-06-15-ideate-web-ux-inc2
**Created:** 2026-06-15
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Condition card append latency | Card visible in `#condition-items` within 500ms of `conditionItem` SSE event dispatch | Automated test: synthetic event dispatch → card presence assertion; time delta in test | inc2.1 |
| Right panel render time | No regression from Increment 1 baseline (three-section panel must not cause perceptible delay vs. two-section) | Manual smoke test on first run; no formal SLO | inc2.1 |

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| HTML output escaping — condition card text | Condition card `text` field HTML-escaped before DOM injection. No `innerHTML` with unsanitised model output. | OWASP A03 (Injection) — same constraint as iwu.3 | inc2.1 |
| HTML output escaping — condition card type/source | `type` and `source` fields HTML-escaped and validated against known enum values before rendering | OWASP A03 (Injection) | inc2.1 |
| No state mutation endpoint for conditions | Condition cards are read-only. No POST endpoint that modifies `session.conditionItems[]` from external input in inc2.1 scope. | OWASP A01 (Broken Access Control) — no new attack surface | inc2.1 |
| SKILL.md governed change | ideate/SKILL.md is a governed file. Modification requires its own story (inc2.2), PR, and human review and merge before it can take effect. | product/constraints.md Constraint 4 | inc2.2 |
| No credentials in SKILL.md | The condition marker example in SKILL.md must not include real operator names, API keys, or live repository paths. Use anonymised placeholders. | MC-SEC-02 | inc2.2 |

**Data classification:**
- [x] Public — condition text is user-generated ideation content. Not personal data. Not commercially sensitive at storage tier. In-memory only.

---

## Data Residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| No disk persistence | `session.conditionItems[]` held in-memory only; no disk writes; no external transmission | ADR-019 (session lifecycle TTL) | inc2.1 |

---

## Accessibility

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| Condition cards keyboard-navigable | `#condition-items` section must be reachable via Tab; condition card text must be readable by screen reader | inc2.1 |
| Type badge text not colour-only | Type badge must convey type via text (not only colour) — e.g. "constraint" label alongside any colour coding | inc2.1 |

**Source:** WCAG 2.1 SC 1.4.1 (Use of Colour), SC 2.1.1 (Keyboard).

---

## Regression

| NFR | Requirement | Applies to story |
|-----|-------------|-----------------|
| Increment 1 regression contract | All 62 existing iwu test assertions (check-iwu1 through check-iwu6) must pass unmodified after inc2.1 changes | inc2.1 |
| SKILL.md instruction additive only | inc2.2 SKILL.md change must not modify existing `---ASSUMPTION-JSON---` instruction or any existing SKILL.md behaviour; only adds new content | inc2.2 |

---

## Compliance

`regulated: false`. No compliance frameworks. No sensitive data categories.
