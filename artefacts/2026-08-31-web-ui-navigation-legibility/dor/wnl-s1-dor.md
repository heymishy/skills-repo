# Definition of Ready Checklist

## Definition of Ready: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
**Test plan reference:** artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-10

---

## Contract Proposal

See `artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed wrap-in-`<details>` implementation directly satisfies AC1–AC6 with no other behaviour change, and each AC maps to a real, already-written test in the test plan. No mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Developer/engineer running a multi-stage feature session through the web UI" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC3/AC6 covered as structural + explicit manual scenarios (untestable-by-nature, correctly gap-typed) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — Time-to-orientation |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` Run 2 (`wnl-s1-review-2.md`) — 0 HIGH, 0 MEDIUM (both Run 1 MEDIUM findings resolved) |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered (2 as explicit manual/untestable-by-nature gaps, correctly typed, not silently skipped) |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" upstream — no `schemaDepends` declaration required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, correctly cites the reusable `<details>` pattern and (post-fix) the correct npm-dependency source; `/review` Category E clean at Run 2 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent ACs — native `<details>` semantics, not CSS layout |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-31-web-ui-navigation-legibility/nfr-profile.md` (feature-level) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ | "Hamish King — Platform Owner — 2026-08-31" present and substantive. M1 signal: role not clearly non-engineering — recorded, not a fail (per H-GOV's own AC4, only engineer-titled entries like "Lead Engineer"/"Tech Lead"/"Developer" fail; "Platform Owner" is not one of those) |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 13/13 (9 direct passes + 4 explicit N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | All Run 1 MEDIUM findings resolved before Run 2, not just acknowledged | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a separate person before implementation begins | **Acknowledged — proceed.** Low-risk, low-complexity story (rating 1); ACs were themselves scrutinised twice (initial write + `/review` Run 1/2), reducing the marginal value of a separate pre-code script review. RISK-ACCEPT logged in `decisions.md`. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names AC3/AC6 explicitly with a stated, reasoned handling (manual + structural check), not left silent | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Collapse the always-expanded "Ref docs" context manifest into a single summary indicator — artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s1-collapse-context-manifest.md
Test plan: artefacts/2026-08-31-web-ui-navigation-legibility/test-plans/wnl-s1-test-plan.md
DoR contract: artefacts/2026-08-31-web-ui-navigation-legibility/dor/wnl-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

(1) src/web-ui/routes/skills.js: modify buildContextManifestHtml()
(~line 2680) so its existing per-file chip output (unchanged) is
wrapped in a native <details> element, closed by default (no `open`
attribute). Add a <summary> line reading "Context loaded (N files) ✓"
when every file has status 'ok', or a distinct warning form (e.g.
"Context loaded (M of N files) ⚠") when at least one file has status
'warn'. Do NOT add custom JS toggle logic -- the native <details>
element provides open/close, keyboard activation, and screen-reader
semantics for free.

(2) Create tests/check-wnl-s1-context-manifest-collapse.js, following
the exact style of the pre-existing tests/check-iwu1-context-manifest.js
(direct function import, custom assert() helper, [wnl-s1]-prefixed
output). Implement all 7 unit tests named in the test plan's own Unit
Tests section.

(3) Run node tests/check-iwu1-context-manifest.js directly and confirm
all 9 of its existing tests still PASS -- do not assume from reading
the assertions, actually run it.

Constraints:
- Do NOT change which files are loaded into context, or the
  loaded/missing detection logic itself.
- Do NOT add a persistent cross-session "remember expanded" preference.
- Do NOT restructure buildContextManifestHtml()'s own per-file chip
  generation -- only wrap its existing output.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. Do not introduce patterns listed as
  anti-patterns or violate named mandatory constraints or Active ADRs.
- No new npm dependencies (product/tech-stack.md's runtime constraint,
  Mandatory Constraint MC-SELF-02 -- do not cite ADR-009, which governs
  an unrelated topic).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — small, low-risk UI change reusing an already-established native HTML pattern; no security, compliance, or data-model surface. Matches epic-level oversight.
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
