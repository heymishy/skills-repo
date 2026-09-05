# Definition of Ready: Fix artefact detail links so nested and archived artefacts resolve instead of 404ing

**Story reference:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/stories/adlr-s1-fix-artefact-detail-link-resolution.md
**Test plan reference:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/test-plans/adlr-s1-test-plan.md
**Review artefact:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/review/adlr-s1-review-1.md
**Contract:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/dor/adlr-s1-dor-contract.md
**Track:** Short-track (test-plan → DoR → coding agent; discovery through review skipped per `CLAUDE.md`)
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Contract review:** ✅ Passed — the proposed fix directly addresses the traced root cause (link generation discards the real relative path; the fetch adapter never checks the archived prefix), with two adjacent-looking but genuinely separate defects (the dead `/artefacts/:path` route, `commit-view.js`'s unwired-adapter issue) explicitly and correctly excluded rather than absorbed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Operator (persona from `product/mission.md`), named |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 3, AC2: 2, AC3: 2, AC4: 1, AC5: 2, AC6: 1 manual scenario |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | References the confirmed, quantified 93.5% blast radius |
| H6 | Complexity is rated | ✅ | 2 (root cause fully traced pre-story, bounded fix), Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` intentionally skipped (short-track) — 0 HIGH, honestly documented |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1–AC5 fully covered by unit tests; AC6 explicitly gap-typed as `Untestable-by-nature` with a manual verification scenario |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No "Dependencies" section — no upstream dependencies |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, states the new resolution-order invariant this fix adds |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | No AC is CSS-layout-dependent — URL construction and fetch-resolution logic |
| H-NFR | NFR profile exists | ✅ N/A | One informal NFR (bounded worst-case latency) covered directly in the test plan's own NFR Tests section, no formal profile needed for a short-track bug fix |
| H-NFR2 | Compliance NFR sign-off documented | ✅ N/A | No compliance NFR applies |
| H-NFR3 | Data classification field not blank | ✅ N/A | No NFR profile required |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ N/A | Short-track — no discovery artefact exists |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new injectable adapter introduced — `fetchArtefact` is an existing, already-wired adapter whose internal resolution order is being changed, not its wiring |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | Bounded worst-case latency documented and covered by a call-count assertion | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM (review skipped) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | The known-subdirectory list and resolution order were derived from direct code/convention reading, not independently domain-reviewed | Hamish King (Platform Owner) — same solo-operator rationale as this session's other RISK-ACCEPTs; logged in `decisions.md` |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ | Two genuinely adjacent-but-different defects (dead plural route, unwired commit-view adapter) were explicitly carved out, not guessed at | — |

---

## Standards Injection

No `domain` field set on this story — pure routing/adapter fix, no new UI, security, or auth surface. Skipped silently per the DoR skill's own instruction.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix artefact detail links so nested and archived artefacts resolve instead of 404ing — artefacts/2026-09-06-artefact-detail-link-resolution-fix/stories/adlr-s1-fix-artefact-detail-link-resolution.md
Test plan: artefacts/2026-09-06-artefact-detail-link-resolution-fix/test-plans/adlr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/web-ui/routes/features.js's _renderArtefactListByType, replace the
  bare-basename fileSlug extraction with a helper that derives the path
  relative to the feature (strip any "artefacts/" and "archived/" prefix
  and the feature slug itself, then the .md suffix). Encode it with
  encodeURIComponent when building the /artefact/<slug>/<path> URL.
- In src/web-ui/adapters/artefact-fetcher.js's fetchArtefact, change the
  resolution order to: (1) direct decoded path against artefacts/<slug>/,
  (2) direct decoded path against artefacts/archived/<slug>/, (3) ONLY if
  the input has no "/", probe each known subdirectory (stories, epics,
  test-plans, verification-scripts, dor, plans, dod, trace, coverage,
  reference, research) under both prefixes with a shorter timeout.
- In src/web-ui/server.js, decode parts[2] via decodeURIComponent (in a
  try/catch) before passing it as artefactType to handleArtefactRoute.
- Do NOT change the route regex -- encodeURIComponent already keeps the
  path within one URL segment.
- Do NOT touch the dead /artefacts/:path route, listArtefacts itself, or
  commit-view.js/skills.js's unrelated unwired-adapter issue -- all three
  are explicitly out of scope.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low (no security/auth/data-model surface; root cause fully traced and two adjacent defects correctly excluded before this DoR was written; the fix is a well-understood, bounded resolution-order change with a documented latency tradeoff)
**Sign-off required:** No
**Signed off by:** Not required
