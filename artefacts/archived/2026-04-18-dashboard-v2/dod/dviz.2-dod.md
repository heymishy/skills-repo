# Definition of Done: dviz.2 — GitHub Pages deployment workflow

**PR:** #159 (initial) + #160 (fix: remove invalid administration permission) | **Merged:** 2026-04-21
**Story:** artefacts/2026-04-18-dashboard-v2/stories/dviz.2-pages-workflow.md
**Test plan:** artefacts/2026-04-18-dashboard-v2/test-plans/dviz.2-test-plan.md
**DoR artefact:** artefacts/2026-04-18-dashboard-v2/dor/dviz.2-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1 (.github/workflows/pages.yml exists), T2 (no tab-indentation issues — valid YAML), T3 (dashboards/** trigger present), T4 (pipeline-state.json trigger present). | Automated: tests/check-dviz2-pages-workflow.js T1, T2, T3, T4 | None |
| AC2 | ✅ | T5 implicitly — deploy-pages step present (T8). configure-pages + upload-pages-artifact + deploy-pages pattern used; no PAT or gh-pages branch. | Automated: T8 + code inspection | None |
| AC3 | ✅ | T5 (permissions block contains pages:write and id-token:write). | Automated: T5 | None |
| AC4 | ✅ | T6 (upload-pages-artifact step uses dashboards/ as artifact path). | Automated: T6 | None |
| AC5 | ✅ | T7 (no hardcoded PAT or secret references found — MC-SEC-02 ✓). Workflow uses GITHUB_TOKEN only. | Automated: T7 | None |

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8/8
**Tests passing in CI:** 8/8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — .github/workflows/pages.yml exists | ✅ | ✅ | |
| T2 — pages.yml has no tab-indentation issues | ✅ | ✅ | |
| T3 — workflow trigger includes dashboards/** path | ✅ | ✅ | |
| T4 — workflow trigger includes .github/pipeline-state.json path | ✅ | ✅ | |
| T5 — permissions block contains pages:write and id-token:write | ✅ | ✅ | |
| T6 — upload-pages-artifact step uses dashboards/ as artifact path | ✅ | ✅ | |
| T7 — no hardcoded PAT or secret references found (MC-SEC-02) | ✅ | ✅ | |
| T8 — deploy-pages step is present in workflow | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — no credentials in workflow YAML | ✅ | T7 automated check passes |

---

## Metric Signal

No metrics defined for this story.

---

## Outcome

**COMPLETE**

Follow-up actions: None.

---

## DoD Observations

1. **PR #160 hotfix:** PR #159 originally included `administration: read` in the permissions block. PR #160 removed it (not required by Pages deployment). Both PRs merged same day. No functional impact; Pages deployment works correctly.
