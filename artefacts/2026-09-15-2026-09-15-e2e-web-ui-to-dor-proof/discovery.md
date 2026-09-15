# Discovery: End-to-End Web UI to DoR Proof

**Status:** Approved
**Feature slug:** 2026-09-15-e2e-web-ui-to-dor-proof
**Discovery start:** 2026-09-15

---

## Problem statement

This is a deliberately minimal technical verification feature with no real product outcome. Its sole purpose is to prove that the pipeline-state and per-story artefact-path fixes delivered in wsd-s1 through wsd-s5 and wsap-s1/wsap-s2 work correctly end-to-end in a production environment — from web UI discovery all the way through definition-of-ready — with real GitHub commits landing at each stage boundary.

There is no user-facing problem being solved. The "problem" is the risk of undetected regression: the fixes listed above were each verified in isolation, but no end-to-end run has been performed to confirm they compose correctly when all running together through the live web UI.

---

## Who it affects

**Primary persona: Hamish King — Operator**
The operator is the only user of this verification run. The operator needs confidence that the full outer loop is functional after the wsd/wsap fix series before committing to further feature delivery on top of it.

No other personas are affected. This feature produces no user-facing artefacts beyond its own pipeline chain.

---

## Why now

The wsd-s1 through wsd-s5 and wsap-s1/wsap-s2 fix series was completed on 2026-09-15. Before the next real feature begins, end-to-end verification confirms the fixes compose correctly under real conditions. Running this now prevents a compounding failure mode where a regression in the pipeline infrastructure is discovered mid-delivery on a real feature, making root-cause analysis harder.

---

## MVP scope

A single end-to-end outer loop run using this feature as the subject matter, producing:

1. A discovery artefact (this document) committed to `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/`
2. A benefit-metric artefact committed to the same folder
3. A definition artefact (epics + 2 minimal stories) committed to the same folder
4. A review artefact
5. A test-plan artefact
6. A definition-of-ready artefact with sign-off

Each artefact must be committed to GitHub via the web UI's commit mechanism, and `pipeline-state.json` must reflect the correct stage and artefact paths at each boundary.

The feature is complete when DoR sign-off is committed and `pipeline-state.json` shows `dorStatus: signed-off` for both stories.

---

## Out of scope

1. **Any real product functionality** — this feature delivers no code, no routes, no UI changes, and no user-facing behaviour. It is documentation and pipeline artefacts only.
2. **More than 2 stories** — additional stories would add verification time without adding coverage. 2 stories is sufficient to exercise the epic/story nesting and artefact-path resolution under the fixes.
3. **Inner loop execution** — no branch setup, no implementation plan, no coding agent dispatch. The verification ends at DoR sign-off.
4. **Automated regression test** — this is a manual end-to-end run, not a new automated test. A follow-up story may automate this pattern, but that is out of scope here.

---

## Assumptions and risks

[ASSUMPTION] All wsd-s1 through wsd-s5 and wsap-s1/wsap-s2 fixes are merged to master before this run begins — unconfirmed, but the operator indicated this is the intent.

**Risk:** If any fix is not yet merged, the end-to-end run will not produce clean results and will need to be re-run after the remaining fixes land. This is low-consequence (the feature can be re-run) but would delay confirmation.

**Risk:** The web UI's commit mechanism may produce artefact paths that do not match what `pipeline-state.json` expects, if any path-construction logic was not covered by the wsap fixes. This is the primary regression being tested for.

---

## Directional success indicators

**Indicator: All 6 artefacts committed to correct paths**
Baseline: [UNKNOWN BASELINE] — no prior end-to-end run has been performed with these fixes in place.
Target: 6/6 artefacts committed to `artefacts/2026-09-15-e2e-web-ui-to-dor-proof/<expected-path>` with no 404s or path mismatches.
Measured via: operator inspection of GitHub commit history and `pipeline-state.json` artefact path fields after each stage.

**Indicator: `pipeline-state.json` correctly reflects stage and dorStatus**
Baseline: [UNKNOWN BASELINE]
Target: `pipeline-state.json` shows `stage: definition-of-ready`, `dorStatus: signed-off` for both stories after DoR sign-off.
Measured via: operator inspection of `pipeline-state.json` on master after DoR commit.

---

## Constraints

- **Minimal time investment** — the operator has explicitly scoped this to 2 stories. No scope expansion during delivery.
- **No new code** — no `src/` changes, no new scripts, no SKILL.md changes. Artefacts and `pipeline-state.json` only.
- **Single session if possible** — the full outer loop should be completable in one operator session to avoid cross-session state complexity in the verification run itself.

---

## Attribution

**Contributors:**
- Hamish King — Operator — 2026-09-15

**Reviewers:**
- (none — solo operator)

**Approved By:**
- Hamish King — Operator — 2026-09-15

---
<!-- eval-mode: false -->