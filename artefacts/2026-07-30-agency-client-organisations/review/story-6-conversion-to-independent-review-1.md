# Review Report: Client org self-service conversion to an independent paying account — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-6-conversion-to-independent.md
**Date:** 2026-07-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** Traceability — mirrors Story 3's [1-H2]. AC1 requires "a Client-org user with appropriate permissions," and the story's own Security NFR is explicit that this must not be "just any Client-org read-only viewer." But Story 3 (the only story in the epic that provisions Client-org users) only ever creates users "with a read-only role" (Story 3 AC3) — no story anywhere creates, upgrades, or defines a more-privileged Client-org role. As written, this story's own precondition (a privileged Client-org user existing) can never actually occur.
  Fix: same resolution as Story 3's 1-H2 — either add the missing role-provisioning mechanism (to Story 3 or a small follow-up), or determine that the *first* Client-org user invited via Story 3 is implicitly this privileged role (distinct from subsequent invitees, if Story 3's own out-of-scope "inviting more than one user" is ever extended) and state that explicitly here and in Story 3. This is one gap, visible from both stories — do not resolve it twice independently.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Traceability — this story's own Benefit Linkage field honestly frames its metric connection as indirect ("does not directly move either defined Tier 1 metric's measurement... removes a real adoption objection"), but `benefit-metric.md`'s own Metric Coverage Matrix does not list this story against either metric at all — the epic's own "Benefit Metrics Addressed" table also omits it. The story's self-assessment and the metric artefact's coverage table disagree on whether this story counts as covered.
  Risk if proceeding: at /definition-of-done, this story's metric-signal section will have nothing to report against, which is consistent with its own honest framing — but only if that's a deliberate, recorded decision rather than an oversight from `benefit-metric.md` simply forgetting to list it.
  To acknowledge: add a row to `benefit-metric.md`'s Metric Coverage Matrix explicitly marking Story 6 as "Indirect / risk-mitigation, not directly measured" rather than leaving it silently absent.

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — AC4's concurrency test requirement is good practice, but the story doesn't say what the *correct* resolution is when a grant-creation and a conversion race (e.g. does the grant creation simply complete against the org's new `standalone` type without issue, since Story 2/AC3 says relationships persist unchanged through conversion?) — AC4 as written tests that data isn't *corrupted*, but doesn't assert what the *correct final state* should look like. Worth tightening before /test-plan writes the concurrency test itself.

---

## Summary

1 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** FAIL

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 2 | FAIL |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (2 — FAIL):** 1-H1 above — the story's own stated precondition (a privileged Client-org user) is never created by any story in this epic, and 1-M1's metric-coverage inconsistency compounds the gap.

**Scope integrity (5):** Clean — explicitly excludes billing-model changes (deferred to the named follow-up discovery), reversal of conversion, and relationship changes. No overlap with any sibling story.

**AC quality (4):** 4 ACs, Given/When/Then, testable, and AC4's explicit "tested with a concurrency test, not just a manual check" is a genuinely good, specific requirement. LOW-1 notes a minor tightening opportunity.

**Completeness (4):** All fields populated with real content; the Benefit Linkage field is unusually honest about being an indirect metric connection rather than overstating it.

**Architecture compliance (5):** Correctly identifies conversion as a single-field update on the existing row (ADR-025-consistent, no new tenant boundary), and correctly cites the `decisions.md` entry constraining the implementation (same `org_id`, no data migration, reuse of the existing Stripe checkout mechanism per ADR-026).

**Verdict:** FAIL — 1 HIGH finding (the same role-model gap identified in Story 3's review, from the opposite side) must be resolved before /test-plan — likely as a single fix shared between both stories, not two separate ones.
