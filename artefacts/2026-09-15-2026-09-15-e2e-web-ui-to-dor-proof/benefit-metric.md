# Benefit Metric: End-to-End Web UI to DoR Proof

**Feature slug:** 2026-09-15-e2e-web-ui-to-dor-proof
**Metric owner:** Hamish King — Operator
**Reviewers:** (none — solo operator)
**Active:** Yes

---

## Tier 1: Pipeline Infrastructure Verification

### Metric 1: Successful GitHub commits at all stage boundaries

**What we're measuring:**
GitHub commit history reflects a real commit from the web UI's artefact-write mechanism at each of the 6 outer loop stage boundaries (discovery, benefit-metric, definition, review, test-plan, definition-of-ready).

**Baseline:**
Not yet established — first end-to-end run with wsd/wsap fixes in place.

**Target:**
6/6 stage boundaries have a real GitHub commit authored by the operator, visible in `git log --oneline` under the operator's GitHub identity, with commit message reflecting the stage advance (e.g., "chore: benefit-metric stage commit [feature-slug]").

**Minimum validation signal:**
At least 5/6 commits present; 1 missing commit is investigated but does not block the verification.

**Feedback loop:**
Operator inspection of GitHub commit history after DoR sign-off. If any commit is missing or attributed incorrectly (wrong author, wrong branch), the run is marked incomplete and re-run after root-cause analysis.

---

### Metric 2: `pipeline-state.json` field accuracy across stage boundaries

**What we're measuring:**
`pipeline-state.json` on master correctly reflects the feature's stage, story status, and artefact paths after each stage boundary commit.

**Baseline:**
Not yet established — first end-to-end run with wsd/wsap fixes.

**Target:**
After each stage boundary commit, `pipeline-state.json` shows:
- `feature.stage`: correct stage name (discovery → benefit-metric → definition → review → test-plan → definition-of-ready)
- `feature.stories[0].dorStatus` and `feature.stories[1].dorStatus`: both `signed-off` after DoR stage
- `feature.stories[0].artefactPath` and `feature.stories[1].artefactPath`: correct paths matching actual file locations

**Minimum validation signal:**
At least 5/6 stage boundaries have correct fields; 1 stage boundary field mismatch is investigated but does not block the verification.

**Feedback loop:**
Operator inspection of `pipeline-state.json` on master after each stage boundary commit, using `git show master:pipeline-state.json | jq '.features[] | select(.slug == "2026-09-15-e2e-web-ui-to-dor-proof")'` to verify the exact state.

---

### Metric 3: Correct per-story artefact paths

**What we're measuring:**
All 12 story artefacts (6 stage types × 2 stories) are committed to the correct filesystem paths and `pipeline-state.json` references point to those real paths without 404s or path mismatches.

**Baseline:**
Not yet established — first end-to-end run with wsap path fixes.

**Target:**
All 12 artefacts present at expected paths:
- `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/stories/<story-slug>-story.md` (definition stage)
- `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/test-plans/<story-slug>-test-plan.md` (test-plan stage)
- `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/dor/<story-slug>-dor.md` (DoR stage)
- (and corresponding discovery.md, benefit-metric.md, review.md at feature level)

And every `pipeline-state.json` artefactPath reference matches an actual committed file.

**Minimum validation signal:**
11/12 artefacts present at correct paths; 1 missing artefact is investigated but does not block the verification.

**Feedback loop:**
Operator runs `find artefacts/2026-09-15-e2e-web-ui-to-dor-proof -type f -name '*.md' | wc -l` (expect 12 story artefacts + 6 feature-level = 18 total), then spot-checks 3 random `pipeline-state.json` artefactPath references against `git ls-tree -r master -- artefacts/2026-09-15-e2e-web-ui-to-dor-proof/`.

---

## Meta-benefit: None

This feature is a pure infrastructure verification run with no meta-learning objective. The success indicators above are the complete measurement scope.

---

## Measurement and review schedule

**Initial measurement:** Upon DoR sign-off completion (target: 2026-09-15 or 2026-09-16, same session if possible).

**Reviewer action:** Operator inspects all three metrics and either (a) confirms all three are met, or (b) identifies which metrics failed and initiates root-cause analysis + re-run.

**Result recording:** Document the outcome (pass/fail, any gaps, any remediation) in a follow-up comment on this artefact or in `workspace/state.json` after the run completes.

---