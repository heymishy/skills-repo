# NFR Profile: Unified Per-User Identity and Role-Based Access Model for Multi-Tenant Teams

**Feature:** 2026-07-09-team-identity-roles
**Created:** 2026-07-12
**Last updated:** 2026-07-12
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Role/team-membership lookup query time at ~100 members/tenant | Under 50ms | Load test with 100 synthetic `team_memberships` rows, query plan + timing assertion | tir-s6 |
| Bulk-add insert time for ~100 members | No timeout, no noticeable degradation vs. sequential inserts | Batch-insert timing test | tir-s5, tir-s6 |
| Schema migration startup time | No specific threshold set — monitor at implementation | Observed server startup time before/after this feature | tir-s1 |

**Source:** Story AC (tir-s6/AC2, operator-confirmed threshold, 2026-07-12) / Not defined (migration startup — monitor only)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Authorisation | Add-teammate/assign-role/bulk-add actions are scoped to the calling admin's own tenant only | ADR-025 (application-layer tenant scoping) | tir-s3, tir-s5 |
| Authorisation | Admin/credits panel access fails closed on any role ambiguity, not open | Internal convention (arl-s2) | tir-s4 |
| Authentication | Identity linking requires proving ownership of both identities via a real auth flow, not a single-sided claim | Internal convention, resolved via discovery /clarify | tir-s2 |
| Zero privilege change during migration | The `user_roles` → `people`/`team_memberships` schema swap must not change any existing user's effective role as a side effect | Internal convention | tir-s1 |
| Audit logging | Role assignment, identity linking, bulk-add, and denied access attempts are all logged with person/tenant IDs and timestamps (never raw tokens) | Internal convention (matches existing `_logger` usage in `auth.js`) | tir-s1, tir-s2, tir-s3, tir-s4, tir-s5 |

**Data classification:**
- [ ] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [x] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

Rationale: `people` rows carry cross-provider identity data (GitHub login, Google `sub`, email address) — the same classification as the existing `users`/session data this feature extends, not a new category.

**Source:** Internal convention (no named external security standard applies) / ADR-025

---

## Data residency

Not applicable — no data residency requirement identified in discovery or `product/constraints.md`. `product/constraints.md` addresses the skills-pipeline platform itself (POLICY.md floors, instruction-set hashing), not this web-ui application feature — reviewed and confirmed not applicable here.

**Source:** Not applicable

---

## Availability

No availability SLA identified for this feature specifically — inherits whatever uptime posture the existing web-ui application already operates under. Not a new NFR introduced by this feature.

**Source:** Not defined

---

## Compliance

Not applicable — `context.yml` confirms `meta.regulated: false` (also stated directly in discovery's Constraints section). No named compliance framework applies to this feature.

**Named sign-off required?**
- [x] Not required
- [ ] Yes — compliance / legal review needed before shipping

---

## Gaps and open questions

No NFR gaps identified at 2026-07-12. The one open threshold (tir-s6/AC2's query-time target) was resolved during story-writing (confirmed as under 50ms by the operator) rather than left open in this profile.
