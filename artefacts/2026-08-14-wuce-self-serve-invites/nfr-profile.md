# NFR Profile: wuce-self-serve-invites

**Feature:** 2026-08-14-wuce-self-serve-invites
**Created:** 2026-08-15
**Last updated:** 2026-08-15
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Invite creation / email send | No hard SLO — the admin's request does not wait synchronously for email delivery confirmation, only for the send API call to be accepted | Manual observation during beta | wsi-s1 |
| Member-count cap check | Single `COUNT(*)` query per acceptance attempt — negligible overhead at expected beta scale | Manual observation during beta | wsi-s4 |

**Source:** Story AC

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation / tenant scoping | An invite's `tenant_id` is set server-side at creation from the admin's own session, never from request input at any point (creation or acceptance) | ADR-025 | wsi-s1, wsi-s2 |
| Atomic single-use redemption | A second, concurrent accept attempt for the same invite token can never both succeed | Matches `client-invitations.js`'s established `UPDATE ... WHERE redeemed_at IS NULL RETURNING *` pattern | wsi-s2 |
| Secrets management | Reuses the existing `RESEND_API_KEY` environment-variable pattern already established for `2026-07-30-agency-client-organisations` — no new credential handling introduced | Existing D37 wiring convention (CLAUDE.md) | wsi-s1 |
| Audit logging | Invite creation, redemption, and cap-blocked attempts are logged with IDs/tenant/timestamp — never the raw invite token, never the invitee's raw email in event properties | Matches `client-invitations.js`'s established audit convention | wsi-s1, wsi-s2, wsi-s4, wsi-s5 |

**Data classification:**
- [x] Internal — the invitee's email address is PII-adjacent tenant data, handled the same way this codebase already handles teammate email addresses elsewhere (`team-management.js`'s `identityKey`); not public, not separately regulated
- [ ] Public
- [ ] Confidential
- [ ] Restricted

**Source:** ADR-025 / `.github/architecture-guardrails.md` / CLAUDE.md D37 injectable adapter rule

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Not applicable | — | `context.yml` sets `meta.regulated: false`; discovery Constraints section names no data-residency requirement | — |

**Source:** Not applicable

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Not defined | — | — | This feature depends on the existing Resend email service's own availability for invite delivery, and Postgres for `team_invitations`/`team_memberships` — no independent SLA target beyond those existing dependencies' own availability; an outage in either degrades this feature, an accepted external dependency, not a gap to close |

**Source:** Not defined

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| Not applicable | — | — | — |

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Accessibility

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Keyboard-accessible controls | Invite-creation form's email and role fields have labels; submit is a real, keyboard-accessible button | Mandatory Constraint pattern (`.github/architecture-guardrails.md`) | wsi-s1 |
| Readable error messages | "Invite expired" and "member limit reached" are real, readable text — not bare HTTP status codes | Mandatory Constraint pattern | wsi-s3, wsi-s4 |
| Reuses existing accessible auth flow | Invitee authenticates via the existing OAuth/email-password flow's own already-accessible UI — no new auth UI introduced | N/A — reuse, not new surface | wsi-s2 |

**Source:** Individual story Accessibility NFR bullets — this section is included by default in this feature's own profile (unlike `web-ui-guardrails-standards-surface`'s original profile, which was found missing this section entirely at `/trace` and had to be added retroactively — see that feature's trace report, 2026-08-14, Finding #6).

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Availability | No monitoring/alerting specifically for invite-email delivery failures (e.g. Resend outage) beyond the generic error surfaced to the admin at creation time (`wsi-s1` AC5) | Hamish King | Revisit if beta feedback shows invite emails silently failing to arrive with no clear admin-facing signal |
