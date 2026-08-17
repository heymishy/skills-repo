# Definition of Done: Feed as-built Data Model / System Architecture into /design system prompt

**PR:** https://github.com/heymishy/skills-repo/pull/620 (bundled with `alrf-s8`) | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-25-code-shape-diagrams/stories/alrf-s9-design-as-built-context-injection.md
**Test plan:** `tests/check-alrf-s9-design-as-built-context.js` (no separate test-plan.md — retrospective story convention)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `/design` system prompt includes the real product's as-built Data Model | ✅ | `check-alrf-s9-design-as-built-context.js` AC1, verified against this repo's own real migrations | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — `/design` system prompt includes the real product's as-built System Architecture | ✅ | Same file, AC2 | Automated test, re-run fresh | None |
| AC3 — scoped to `/design` only; other skills unaffected | ✅ | Same file, AC3 | Automated test, re-run fresh | None |
| AC4 — a product with no migrations yet degrades gracefully (no throw, session still builds) | ✅ | Same file, AC4 | Automated test, re-run fresh | None |
| AC5 — read-only: building a `/design` system prompt never writes a new versioned artefact as a side effect | ✅ | Same file, "AC5: no diagrams/ artefact directory created as a side effect" | Automated test, re-run fresh | None |
| AC6 — no regression to existing `buildSystemPrompt` behaviour for other skills/scenarios | ✅ | 7 named regression suites cited by the story at merge time, all unchanged; 2 pre-existing failures (`ougl1` T1.6, `wucp1` 4 failures) confirmed via `git stash` to be identical with/without this change | Not re-run individually in this pass — see Test Plan Coverage | None |

---

## Scope Deviations

**Bundled PR with sibling story `alrf-s8`:** merged together in PR #620 ("fix(alrf-s8): journey slug priority + mock-gateway nav; feat(alrf-s9): design as-built context"). `alrf-s8` already has its own DoD written in an earlier session pass (`artefacts/2026-07-26-function-level-audit/dod/alrf-s8-dod.md`) — the two stories are unrelated in scope (different features entirely: `alrf-s8` is a `function-level-audit` fix, `alrf-s9` is this `code-shape-diagrams` epic's context-injection story) bundled into one commit/PR despite belonging to two different feature artefact trees. This is the same "bundling changes from story B into story A's PR" anti-pattern flagged repeatedly in this DoD backlog pass (`alrf-s8`+other-feature-story, `dic.1-5`), here notably crossing feature boundaries, not just story boundaries within one feature. Not re-litigated — both stories' own tests independently confirm correctness.

Story's own `wucp1` reference (4 pre-existing failures) matches this session's own tracked `tests/known-baseline-failures.json` entry exactly — confirms consistency across this whole DoD backlog pass.

---

## Test Plan Coverage

**Tests passing:** 8/8 (`check-alrf-s9-design-as-built-context.js`), re-run fresh 2026-08-17 — matches the story's originally-cited "8 ACs, all passing" exactly, no drift.
**Story-cited regression suites at merge** (`check-icv-s1-...` 3/3, `check-iwu5-...`, `check-iwu6-skillmd.js` 15/15, `check-psh-s10-...` 8/8, `check-psh-s5-...` 9/9, `check-sdg2-...` 8/8, `check-wucp3-...` 21/21) — not individually re-run in this pass.
**Gaps:** None identified.

---

## NFR Status

No dedicated NFRs named beyond the correctness ACs above. Risk classification LOW (additive, read-only, falls back to no-op) per the story's own framing — confirmed consistent with AC4/AC5's graceful-degradation and read-only guarantees.

---

## Metric Signal

Closes the loop between two halves of `csd-e1` that already existed but didn't talk to each other — `/design`'s as-designed diagram can now be grounded in the real current product state rather than model memory, serving P1/P2 from `csd-e1`'s own benefit-metric.md (a diagram drawn from real context is less likely to omit or misrepresent an existing entity the feature actually touches).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required. Story's own Out of Scope items (feeding as-built context into `/definition` or other skills; a UI affordance showing what was injected) remain explicitly deferred, not gaps — scoped narrowly to answering the operator's specific `/design`-only question.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. Closes the 2-story `2026-07-25-code-shape-diagrams` gap (`csd-s7`/`alrf-s9`, both DoDs written in this same session pass) — the epic's remaining 6 stories (`csd-s1`-`s6`) already had DoDs from an earlier session.
3. Cross-feature PR bundling (this story bundled with an unrelated `function-level-audit` fix) is a new variant of the recurring bundling pattern worth naming if `/improve` is ever run against this repo's own PR hygiene.
