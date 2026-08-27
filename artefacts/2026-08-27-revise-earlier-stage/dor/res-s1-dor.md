# Definition of Ready: Reopen a completed stage's live session from the step-nav

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
**Test plan reference:** artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s1-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-08-28

---

## Contract Proposal

See `res-s1-dor-contract.md`.

## Contract Review

**Mismatch found and resolved:** AC3 originally required `completedStages`, `stage`, and `stages[]` to be *fully* unchanged by any reopen. The proposed implementation's fresh-session path (AC2) needs to update the stage's `sessionId` in `completedStages` so a subsequent reopen doesn't keep re-creating fresh sessions forever — this directly contradicted AC3 as originally worded. Resolved by amending AC3 in the story artefact to permit `sessionId` to update on the fresh-session path only, while `skillName`, `artefactPath`, `completedAt`, `stage`, and `stages[]` remain unchanged in all cases. This matches the integration test already written in the test plan (`journeyStateShapeUnchangedAfterFreshSessionReopen`), which anticipated exactly this distinction.

✅ **Contract review passed** — proposed implementation aligns with all ACs (post-amendment).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Operator (solo product owner + engineer running the outer loop) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 11 tests across 4 ACs |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | "Earlier-stage revisions completed without a journey restart" |
| H6 | Complexity is rated | ✅ | 3 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 — 0 HIGH |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 5 constraints named (ADR-022/023/024/018 + kcrs-s1/adsr-s1 precedent); Run 1 Architecture compliance score 4, no HIGH |
| H-E2E | CSS-layout-dependent gate | ✅ | No AC typed CSS-layout-dependent — not applicable |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-27-revise-earlier-stage/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs with named regulatory clauses — not applicable |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By`: "Hamish King — Platform Owner — 2026-08-27" — non-blank, non-engineering title |
| H-ADAPTER | Injectable adapter wiring | ✅ | No new `setX()` adapter introduced — reuses existing `getGetHtmlSession()` |
| H-INF | Infra-plan gate | ✅ | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate | ✅ | `hasMigrationTrack` not set — skipped |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Unstable — declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | No MEDIUM findings (2 LOW only) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT logged in decisions.md (2026-08-28) — script will serve as the post-merge smoke test instead |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Gap table: None |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These will be appended to the coding agent instructions block.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Reopen a completed stage's live session from the step-nav — artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
Test plan: artefacts/2026-08-27-revise-earlier-stage/test-plans/res-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js/CommonJS, matches existing src/web-ui/routes/journey.js conventions
- Reuse getGetHtmlSession() (existing adapter) — do not introduce a new adapter or a parallel session-lookup mechanism
- Reuse frsr-s1's completedStages[].sessionId field — do not invent a second lookup path
- ADR-023 disk canonicity: priorArtefacts content must be read via fs.readFileSync at injection time, never from a cached/session value
- Do not touch the artefact-index page's "View" link or any entry point besides the step-nav — out of scope for this story
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)
Read this file directly before implementing — it documents this repo's web UI server patterns (raw http.createServer, injectable adapters, session handling) that this story's implementation must follow.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Hamish King — Platform Owner (confirmed aware, 2026-08-28)
