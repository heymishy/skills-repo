# Definition of Ready: GitHub issue opened by PostHog for each new production error issue (native destination)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
**Verification script:** artefacts/2026-11-08-cicd-observability-hardening-automation/verification-scripts/coha-s6-alert-to-github-issue-bridge-verification.md
**Review:** PASS, run 4 (artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s6-review-4.md), 0 HIGH, 3 MEDIUM (resolved in revision), 2 LOW
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-13
**Status:** SIGNED OFF by Hamish King, Platform Owner, 2026-11-13 (hard blocks 19/19; W3, W4 and the AC6 RISK-ACCEPT acknowledged)

---

## Contract Proposal

See `coha-s6-alert-to-github-issue-bridge-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed.** Each AC maps to a live check at the strength the AC needs, and the contract states which are live-verified, which is production-observed and deferred, and which is only half observed (AC1). The contract's exclusions (`src/`, `scripts/`, `.github/workflows/`) have no test assertions against them; the only assertion about them is AC7's "nothing changed there", so the contract does not contradict the test plan (B1/D1). The injectable-adapter and CSS-layout rules do not apply.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer ..." |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 7 ACs |
| H3 | Every AC has at least one test | ✅ | 7 checks (T1 to T7), each AC mapped in the coverage table. They are live checks, not coded tests, because the story ships no code (explained in the test plan) |
| H4 | Out-of-scope populated | ✅ | Seven explicit exclusions |
| H5 | Benefit linkage names a metric | ✅ | Production-defect detection latency (Metric 4) |
| H6 | Complexity rated | ✅ | Rating 1, scope stability Unstable until AC3 |
| H7 | No unresolved HIGH review findings | ✅ | review-4: 0 HIGH |
| H8 | No uncovered ACs | ✅ | Gaps are classified, none uncovered; AC4 conditional, AC6 deferred |
| H8-ext | Cross-story schema dependency | ✅ | Upstream coha-s5 is merged; no `schemaDepends` field is used by this story, so the schema check is not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Constraints cover ADR-012, credentials and the fallback; no Category E HIGH in run 4 |
| H-E2E | No CSS-layout-dependent AC | ✅ N/A | `hasLayoutDependentGaps: false` |
| H-NFR | NFR profile exists | ✅ | Rows for coha-s6 rewritten 2026-11-13 to match the native design (privacy, isolation, reliability, security) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | "Internal" |
| H-NFR-profile | Profile present | ✅ | Present |
| H-GOV | Approved By in discovery | ✅ | "Hamish King — Platform Owner — 2026-11-08"; M1 signal: role unverified for independent sign-off quality, as for the other stories in this feature |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | The story introduces no adapter and no `setX()` function |
| H-INF | `hasInfraTrack` not set | ✅ N/A | |
| H-MIG | `hasMigrationTrack` not set | ✅ N/A | |
| H-DESIGN | `hasDesignSystemTrack` not set | ✅ N/A | No UI |

**Result: 19/19 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Security, privacy, isolation, reliability, audit stated; performance and accessibility N/A |
| W2 | Scope stability declared | ✅ | — | "Unstable until AC3" |
| W3 | MEDIUM findings acknowledged | ⚠️ | 4-M1 to 4-M3 were fixed in the same session by the reviewer who is also the author | Acknowledged by Hamish King on 2026-11-13: the fixes were made by the same agent that wrote the story and were not independently checked; logged in decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | An unreviewed script may miss edge cases; here the script is the only test evidence, as no code ships | Re-acknowledged by Hamish King on 2026-11-13 now that the script exists and is the sole evidence; logged as a RISK-ACCEPT in decisions.md. Not an independent review. |
| W5 | No UNCERTAIN gap-table items | ✅ | — | All gap-table entries have a stated handling |

**Decisions logged 2026-11-13 (decisions.md):** W3, W4 and a RISK-ACCEPT in `decisions.md` classifying AC6 (production-observed, may not occur before merge) with a post-merge action in `workspace/state.json`, as the story and review 4-M2 require.

---

## Oversight

Parent epic: **Medium**. The tech lead must be shown this DoR artefact; the operator is the only contributor and the tech lead in this repo, so this artefact and the operator's sign-off are that step.

**Sign-off:** Hamish King — Platform Owner — 2026-11-13, given in the session together with the three acknowledgements below.

**Operator confirmations given 2026-11-13 ("Confirm all 4"):**
1. Sign off this DoR (Proceed: Yes).
2. Acknowledge W3 (the review-4 fixes were made by the same agent that wrote them).
3. Re-acknowledge W4 for coha-s6's verification script as a RISK-ACCEPT.
4. Agree the AC6 RISK-ACCEPT and the post-merge action.

**Open facts the implementer must not assume away (recorded, not blocking):**
1. The GitHub integration is not connected (PostHog integrations list was empty on 2026-11-13). The agent cannot start the live scenarios until the operator does that.
2. The operator states staging and production share one PostHog key; unverified, and AC5 re-opens it if the staging event does not show in this project.
3. Scenarios 3 and 4 open real issues in a public repo; each needs fresh approval immediately before it runs.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (operator sign-off and acknowledgements recorded 2026-11-13)
Story: GitHub issue opened by PostHog for each new production error issue (native destination) — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
Contract: artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s6-alert-to-github-issue-bridge-dor-contract.md

Goal:
Complete checks T1 to T7 of the test plan and record the evidence. There is no application code to write.

Constraints:
- No file under src/, scripts/ or .github/workflows/ may change. If a gap in PostHog's native GitHub destination appears to need code, stop and report it; do not improvise a bridge (the run-3 design at git commit 6e16356c7 is the fallback, reinstated only through /definition and /review).
- Never create, print, log or commit a credential, token or installation id. The operator connects the GitHub integration; the agent only reads the integrations list.
- Each action that opens an issue in the public repo (T3 test-function run, T4 extra issue) needs explicit operator approval immediately before, covers one run, and is followed by closing the issue.
- Create the alert with trigger "issue created" only and the filter environment = production; read it back from PostHog and record the read-back without secrets.
- If AC3 or AC4 shows tenant text or anything beyond the fixed code and src/ or node_modules/ frames in an issue, disable the alert and report.
- Production reads need explicit approval each time.
- Record evidence strength per AC (live-verified, production-observed) for the DoD; AC6 stays pending until a real production error occurs.
- Open a draft PR only if a tracked change outside artefacts/ and bookkeeping is ever needed; otherwise bookkeeping goes to master by the short-lived-branch path.
```
