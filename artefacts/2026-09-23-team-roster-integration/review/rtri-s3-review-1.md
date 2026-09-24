# Review Report: Render a real member list on /team/members — Run 1

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Date:** 2026-09-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** E — Architecture compliance. No AC or NFR requires the real identity string (and role, for tenants where role is rendered) to be rendered safely when the `/team/members` list is built. Same risk class as `rtri-s2`'s [1-H1]: `handleGetTeamMembers` currently only renders an add-teammate form (confirmed by direct read of `routes/team-management.js` lines 68-100) — this story adds the first real rendering of `person_identities.identity_key` values (externally-influenced: GitHub login, Google email, or email/password email) into this page. `ep4-s1`'s own recently-fixed Critical stored-XSS vulnerability (commit `6adfb5b2`) is the direct precedent, and MC-SEC-01 ("No user-supplied content in innerHTML without sanitisation") is a mandatory constraint in `.github/architecture-guardrails.md`.
  Fix: add an explicit AC (or NFR) requiring the member list to be rendered via safe DOM construction (`createElement`/`textContent`) if built client-side, or via the templating engine's own auto-escaping if rendered server-side — not raw string concatenation into HTML. Verify with a real test asserting on a payload identity string (e.g. containing `<`, `>`, `'`), not just a normal-looking one.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 2 | FAIL |

**Traceability (5):** Clean — epic/discovery/benefit-metric referenced; benefit linkage names metric 2 ("/team/members shows a real list") directly, mechanism is genuine (this story is the only one that populates that metric).
**Scope integrity (5):** Correctly scoped to rendering only — no invite/signup/auto-creation logic pulled in, matching the discovery's own Out of Scope items 1 and 2.
**AC quality (5):** All 4 ACs are Given/When/Then, independently testable; AC3's live-read proof (add-then-reload) is a genuinely strong test of real-data-not-fixture rendering; AC4 tenant isolation is explicit and testable.
**Completeness (5):** Every field populated; persona matches benefit-metric; NFRs correctly reference the existing unaudited-read-path precedent rather than inventing new audit requirements out of scope.
**Architecture compliance (2):** MC-SEC-01 (mandatory constraint) not addressed by any AC or NFR, despite this story being the first to render real identity strings on this specific page and `ep4-s1`'s own precedent for exactly this failure mode. Automatic FAIL per the scoring rule (any criterion below 3 fails the story) — see 1-H1.
