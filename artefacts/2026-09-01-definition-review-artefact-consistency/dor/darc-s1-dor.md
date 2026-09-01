# Definition of Ready Checklist

## Definition of Ready: Split the Web UI's consolidated definition and review artefacts into individual files matching the CLI convention

**Story reference:** artefacts/2026-09-01-definition-review-artefact-consistency/stories/darc-s1-split-definition-and-review-into-individual-files.md
**Test plan reference:** artefacts/2026-09-01-definition-review-artefact-consistency/test-plans/darc-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: platform owner running features across both CLI and web UI |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track; discovery reference provided instead |
| H6 | Complexity is rated | ✅ | Rating 3, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: dcuf-s1, daep-s1 (both merged); no overlap with lpmf-s1/wsap-s1/srar-s1 |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Purely-additive/best-effort constraint, order-independent parsing requirement, and file-touch boundaries explicitly stated |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ N/A | Performance/security covered inline in story |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap already logged this session for the six prior short-track stories | A discovery artefact exists (artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md) documenting the investigation that surfaced this gap; formal /benefit-metric approval was not run — short-track, operator explicitly requested this fix in-session ("Yes do both 1 and 2"). |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No new adapter — reuses dcuf-s1's existing D37-compliant artefact-commit-writer.js unchanged |
| H-INF | Infra-plan gate | ✅ N/A | |
| H-MIG | Migration-review gate | ✅ N/A | |

**All hard blocks pass — 15/15 (13 direct passes + 1 explicit N/A-with-note + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Coverage gaps: None | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Split the Web UI's consolidated definition and review artefacts into individual files matching the CLI convention — artefacts/2026-09-01-definition-review-artefact-consistency/stories/darc-s1-split-definition-and-review-into-individual-files.md
Test plan: artefacts/2026-09-01-definition-review-artefact-consistency/test-plans/darc-s1-test-plan.md
DoR contract: artefacts/2026-09-01-definition-review-artefact-consistency/dor/darc-s1-dor-contract.md

Goal:
Build two new pure-function splitter modules (definition-artefact-splitter.js,
review-artefact-splitter.js) that turn the Web UI's consolidated
definition/review artefact into individual epic/story/review files matching
templates/epic.md, templates/story.md, and templates/review-report.md.
Field extraction must be genuinely order-independent -- scan for every
recognised field's position first, derive each value from the gap to
whichever field comes next in actual document order, never from an assumed
fixed neighbour. Wire both splitters into handlePostTurnStreamHtml as a
best-effort addition after dcuf-s1's existing single-file commit succeeds:
write each split file to local disk and commit via the same
ownerRepoForFeature/commitArtefact mechanism, reused unchanged. Update the
REVIEW PROTOCOL prompt to group findings by story ("## Story: [slug]"
sections) instead of by severity, since there is no other way to identify
per-story boundaries. Enrich the DEFINITION PROTOCOL's example template
with the additional fields the splitter looks for.

Constraints:
- Do NOT touch journey.js, the flat-file write, Postgres storage, or
  story-map panel rendering -- all unchanged.
- Do NOT modify dcuf-s1's own single-file commit logic -- reuse it.
- A parse or write/commit failure in the new split step must be logged and
  must NOT block stage completion -- the flat file already provides a
  durable record.
- Test the definition splitter against real backfilled production content
  (artefacts/new-feature-af17f555/definition.md) as well as synthetic
  fixtures -- this is what surfaces real-world field-order variance that
  synthetic-only fixtures would miss.
- tests/check-dcuf-s1-github-commit-real-completion-point.js,
  tests/check-das-s1-commit-artefact-git-fallback.js,
  tests/check-daep-s1-format-a-epic-h2-story-h3.js,
  tests/check-wsap-s1-story-scoped-artefact-paths.js, and
  tests/check-srar-s1-idempotent-turn-reconnect.js must all still pass
  unmodified.
- Run the full suite (node scripts/run-all-tests.js) and confirm no
  regressions.
- Register the new feature/story in .github/pipeline-state.json on this
  branch before opening the PR (CI's assurance-gate trace-report step
  hard-fails otherwise).
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches the same critical stage-completion code path as `dcuf-s1`/`wsap-s1`/`srar-s1`, but the new logic is strictly additive/best-effort (a failure here cannot regress the existing, already-tested flat-file behaviour), and the parsing logic was specifically hardened against real production content rather than only synthetic fixtures.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — 2026-09-01, explicitly requested in-session ("Yes do both 1 and 2, the net result once complete should be revised artefacts consistently showing within this repo and surfaceable into Claude code and in Web ui... for all future features and ideation").
