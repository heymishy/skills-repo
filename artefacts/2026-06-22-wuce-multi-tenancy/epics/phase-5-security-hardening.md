# Epic: Phase 5 — Security Hardening

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-5-security-hardening
**Status:** Not started
**Slicing strategy:** Risk-first — re-audit fires as soon as Phase 2 is complete, before Phase 3 introduces Postgres (Phase 3 doesn't change the path-traversal threat model but adds new write paths that would need their own audit)
**Guardrails availability:** Same as earlier phases. Critical: path-traversal guard standard (CLAUDE.md ougl) is the primary constraint; this epic validates it adversarially.

## Rationale

Phase 2 changes `repoRoot` from a static compile-time constant to a runtime value derived from `tenantId` — an externally-influenced input. The existing path-traversal guards were written and tested against a static root; they have not been exercised against a variable root supplied by an adversarial caller. A crafted `tenantId` of `../../etc/passwd`, `%2e%2e%2f`, a null byte, or a Unicode homoglyph could bypass the slugification and escape the tenant directory. Phase 5 verifies that every guard holds under adversarial conditions.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| p5.1 | tenantId validation; adversarial path-traversal test suite; re-audit all guards with variable repoRoot | 3 |

## Out of scope for this epic

- New application features — this epic is audit and test only
- Phase 3 Postgres/Redis write path audit — that audit runs in its own Phase 3 stories once vendor is selected
- User-visible changes

## Metric linkage

- **T3-M2** (Path-traversal guard validity under variable tenantId-derived repoRoot): p5.1 is the measurement and closure mechanism for T3-M2
