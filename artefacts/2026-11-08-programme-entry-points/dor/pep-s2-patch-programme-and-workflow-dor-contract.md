# DoR Contract: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Date:** 2026-11-09

## Contract Proposal — Patch /programme and /workflow for the gaps story 1 found

**What will be built:**
Three governed-file patches, each via its own branch + PR: (1) `skills/programme/SKILL.md` Step 0's scoring table (lines 37-98) gets a new row — "epic count within a single feature ≥4"; (2) `skills/workflow/SKILL.md`'s informal pre-check at its "If 5 — Programme track" branch (lines ~164-189) is rewritten to defer to `/programme`'s Step 0 rather than re-asking the same Q1-Q4 questions inline; (3) `skills/orient/SKILL.md`'s routing logic gets at least one explicit `/programme` cross-reference under its transformative/multi-team/multi-phase framing signal.

**What will NOT be built:**
No redesign of either skill's broader structure. No patch beyond what traces to pep-s1's write-up artefact or the two discovery-time corrections already logged in `decisions.md` — AC6 explicitly requires any additional patch to cite a named finding, and anything judged out-of-bounds is logged as a RISK-ACCEPT or new-discovery referral, never silently absorbed.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test parsing the patched Step 0 scoring table for the new "≥4 epics" row (not placeholder language) | unit |
| AC2 | Integration test running patched Step 0 against phase4's real profile (5 epics) — verdict flips fail→pass | unit + integration |
| AC3 | Integration test running patched Step 0 against team-identity-roles' real profile (1 epic) — verdict stays fail | unit + integration |
| AC4 | Unit + integration tests confirming `/workflow`'s pre-check section routes to `/programme`'s Step 0 with zero duplicated inline scoring logic | unit, integration |
| AC5 | Unit test (grep) confirming `/orient` contains ≥1 `/programme` cross-reference under the correct framing signal | unit + manual scenario |
| AC6 | Manual scenario cross-checking any additional patch against pep-s1's named findings | manual (Untestable-by-nature — judgment call on citation honesty) |

**Assumptions:**
- pep-s1's write-up artefact (`artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md`) does **not** yet exist — confirmed by checking the filesystem directly (`artefacts/2026-11-08-programme-entry-points/reference/` is not yet created). This is expected and correct at DoR time: pep-s1 is upstream and has not been implemented yet either. The coding agent assigned to pep-s2 must confirm pep-s1's PR has merged and the write-up artefact is present and populated (not a stub) *before* starting AC6 work specifically — AC1-AC5 do not depend on it and may proceed regardless of pep-s1's implementation status.
- If pep-s1, once implemented, found zero additional concrete gaps beyond the two already-known patches, AC6 is trivially satisfied (nothing to trace) and this is stated explicitly in the PR rather than silently skipped.

**Estimated touch points:**
Files: `skills/programme/SKILL.md`, `skills/workflow/SKILL.md`, `skills/orient/SKILL.md`. Services: none. APIs: none.

**schemaDepends:** `[]` — this story's Dependencies block lists an upstream story (pep-s1), so a declaration is required per H8-ext, but the handoff from pep-s1 is a markdown artefact (`reference/pep-s1-dry-run-findings.md`), not a `pipeline-state.json` field. No schema field is depended on; the empty array is the honest declaration, not an omission.
