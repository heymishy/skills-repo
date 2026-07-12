## Epic: Teams can share a tenant with individually assigned roles

**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md
**Slicing strategy:** Walking skeleton — Story 1 establishes the thinnest end-to-end path (a person/team-membership schema replacing today's tenant-wide role lookup, with zero behaviour change for solo tenants), then each subsequent story adds one real capability on top of that foundation: cross-provider identity linking, a real shared-tenant admin/teammate/role scenario, role-based feature gating, GitHub-org bulk-add convenience, and finally schema-scale validation.

## Goal

A team admin can add teammates to their shared tenant by identity (regardless of which auth provider each person uses), assign each one an individually-scoped role (admin, engineer, product, or viewer), and have at least one in-app feature respect that per-person role rather than treating everyone in the tenant as equally privileged. A person who logs in via more than one provider (GitHub, Google, email/password) can deliberately link those identities together instead of appearing as two disconnected accounts. None of this changes behaviour for today's solo tenants — the existing one-person-per-tenant model continues to work exactly as it does now, with zero migration required.

## Out of Scope

- **Self-serve team/org creation and invite flow.** This epic assumes an admin (already provisioned) adds teammates via an admin-only mechanism — it does not build a public "create your team" signup surface. That is a distinct product surface for a future epic.
- **Per-seat or usage-based Stripe billing.** Today's single-plan-per-tenant billing (`credits` table, Stripe checkout) is unchanged by this epic. Seat-based pricing is a separate finance/pricing decision requiring its own discovery.
- **A complete feature-access matrix across every screen.** This epic proves the per-person role-gating mechanism on one feature (the admin/credits panel). It does not enumerate and gate every existing UI surface by role — that should be shaped by real usage once the mechanism exists.
- **Multi-team switching UX.** The schema supports a person belonging to more than one team, but no "switch active team" control is built — v1 UI surfaces exactly one active team per session.
- **Live GitHub-org membership sync.** GitHub org membership is used only as a one-time bulk-add convenience at team setup (Story 5) — this epic does not build an ongoing sync that auto-adds/removes members as live org membership changes.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Per-person role assignment exists | 0% — role is tenant-wide only | 100% of team members in a shared tenant have a distinct, individually assigned role | Stories 1 and 3 replace the tenant-wide `user_roles` table with a person/team-membership schema and the first real add-teammate-with-a-role flow |
| Cross-provider identity collision is resolved, not silently fragmented | Not yet established — no detection mechanism exists today | An explicit, tested link action exists for at least one provider pair | Story 2 builds the manual link action and its test coverage |
| At least one feature is gated by per-person role, not tenant membership | 0 — `requireAdmin` only checks tenant-wide role | Admin/credits panel denies a non-admin team member sharing the tenant | Story 4 extends `requireAdmin` to check the per-person role from Story 1's schema |
| Schema holds up at ~100 members per tenant | Unverified beyond 1 member per tenant | Indexed lookup query time within an agreed threshold at 100 synthetic members | Story 6 load-tests the schema built in Story 1 |
| Zero regression for existing solo tenants | 100% of current auth/billing/tenancy tests pass | Same 100% pass rate, unchanged | Every story in this epic is checked against the existing solo-tenant test suite before being marked complete |

## Stories in This Epic

- [ ] tir-s1: Person and team-membership schema replaces tenant-wide role lookup
- [ ] tir-s2: A logged-in user links a second auth provider to their identity
- [ ] tir-s3: An admin adds a teammate by identity and assigns a role
- [ ] tir-s4: The admin/credits panel is gated by per-person role, not tenant membership
- [ ] tir-s5: An admin bulk-adds teammates from their connected GitHub org
- [ ] tir-s6: Team-membership lookups stay indexed at ~100 members per tenant

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This epic replaces a security-relevant table (`user_roles`) that every login path reads from, and Story 4 changes what `requireAdmin` allows through. A schema or gating mistake here has a real access-control blast radius (a non-admin gaining admin access, or an admin locked out), so PRs in this epic warrant a human review pass before merge — not fully autonomous merge, per the W4 solo-operator posture in `.github/architecture-guardrails.md`.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity (cross-provider linking UX, exact scale-test threshold), but no unknown unknowns — the target schema shape and gating mechanism are already well understood from discovery's /clarify pass. -->

## Scope Stability

**Stability:** Stable

<!-- Discovery went through a full /clarify pass resolving the open questions (role list, team-membership model, multi-team schema, cross-provider linking approach) before this epic was written — boundaries are unlikely to shift during implementation. -->
