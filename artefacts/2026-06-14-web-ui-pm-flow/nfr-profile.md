# NFR Profile: Web UI Product Management Flow

**Feature:** 2026-06-14-web-ui-pm-flow
**Created:** 2026-06-15
**Status:** Active

---

## Security

| NFR | Requirement | Standard | Applies to story |
|-----|-------------|----------|-----------------|
| HTML output escaping | All user-supplied content (idea titles, notes, feature slugs) HTML-escaped before DOM injection via `escHtml`. No `innerHTML` with unsanitised content. | OWASP A03 Injection | pmf.1, pmf.2, pmf.3 |
| ideas.json write safety | `handlePostIdea` validates title ≤120 chars, notes ≤500 chars. `handleDeleteIdea` matches by id string only — no file path involved. | OWASP A01 Broken Access Control | pmf.2 |
| Slug allowlist validation | pmf.3 POST `/journey/wizard` with `featureSlug` validates against pipeline-state.json allowlist before setting `session.activeFeatureSlug`. Existing behaviour from wucp.4. | OWASP A01 | pmf.3 |
| No credentials in ideas.json | ideas.json is committed to the repo. Operators must not capture credentials or PII in idea content — usage constraint, not a technical control. | Policy | pmf.2 |

**Data classification:** Public — no PII, no sensitive data. ideas.json captures developer-authored idea titles; not personal data. Session data in-memory only.

---

## Performance

| NFR | Target | Measurement | Applies to story |
|-----|--------|-------------|-----------------|
| Board render time | No perceptible regression from baseline `/features` list render | Manual smoke test | pmf.1 |
| handleGetWizard response | < 200ms for 15 features (inherited from wucp.4 NFR) | wucp.4 T4.19 existing test | pmf.3 |
| /api/ideas CRUD | No SLO — in-memory JSON file read/write; expect < 50ms under normal single-operator load | Not formally tested | pmf.2 |

---

## Availability

No SLA defined. Internal developer tooling — no uptime obligation.

---

## Compliance

No regulatory framework applies. Regulated: false. No named sign-off required.

---

## NFR gaps

| Gap | Owner | Due |
|-----|-------|-----|
| ideas.json concurrent write race (multi-tab, multi-user) | Hamish King | Post-MVP — acceptable for solo operator; revisit when team size reaches 2+ |
