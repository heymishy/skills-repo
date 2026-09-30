# Definition of Done: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema

**PR:** https://github.com/heymishy/skills-repo/pull/931 | **Merged:** 2026-09-30
**Story:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/stories/psir-s1.md
**Test plan:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/test-plans/psir-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/dor/psir-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — feature missing `name`/`health` → fail | ✅ | `C15`/`C16` self-tests; confirmed on master post-merge: `node scripts/check-pipeline-state-integrity.js` → 151 self-tests pass | `unit` | None |
| AC2 — invalid `health` enum (feature + epic-nested) → fail | ✅ | `C17` self-tests, both contexts | `unit` | None |
| AC3 — epic-nested story missing `name`/`stage`/`health` → fail | ✅ | `C18`/`C19`/`C20` self-tests | `unit` | None |
| AC4 — invalid `dorStatus`/`reviewStatus`/`verifyStatus` enum → fail | ✅ | `C21`/`C22`/`C23` self-tests | `unit` | None |
| AC5 — `guardrails[]` missing fields / invalid `category`/`status` enum → fail | ✅ | `C24`/`C25`/`C26` self-tests | `unit` | None |
| AC6 — `tasks[]` missing `id`/`name`; invalid `tddState` enum → fail | ✅ | `C4` extension + `C27` self-tests | `unit` | None |
| AC7 — `spikes[]` missing fields / invalid `verdict` enum → fail | ✅ | `C28`/`C29` self-tests | `unit` | None |
| AC8 — 0 new failures against real, current `pipeline-state.json` | ✅ | Confirmed on master post-merge: local checker reports 648 stories, 0 fail; independently cross-checked with `python -c "...jsonschema.Draft7Validator..."` — 0 violations, both agree | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

**Verification strength note:** all 8 ACs describe CLI-tooling correctness with no browser-observable component — the UI-evidence gate does not apply. `unit` (the embedded self-test harness) is the correct, sufficient tier for AC1–AC7; AC8 additionally required real-data cross-verification against an independent validator (not just the script being extended reporting on itself), which was performed directly.

---

## Scope Deviations

None. The merged PR is exactly what the DoR contract described: 15 new check codes in `scripts/check-pipeline-state-integrity.js` only, no new dependency, no new test-file wrapper, no changes to `validate-trace.sh`/`pipeline-state.schema.json`.

---

## Test Plan Coverage

**Tests from plan implemented:** 52 / 52 (new self-tests added this story; 99 pre-existing self-tests carried forward unchanged, for 151 total)
**Tests passing in CI:** 151 / 151

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| C15/C16 (feature name/health presence) | ✅ | ✅ | |
| C17 (health enum, both contexts) | ✅ | ✅ | |
| C18/C19/C20 (epic-nested name/stage/health presence) | ✅ | ✅ | |
| C21/C22/C23 (dorStatus/reviewStatus/verifyStatus enums) | ✅ | ✅ | |
| C24/C25/C26 (guardrails structure + enums) | ✅ | ✅ | |
| C4 extension + C27 (tasks id/name + tddState enum) | ✅ | ✅ | 2 pre-existing C4 self-tests needed their own fixtures updated (missing `id`) once C4 was extended — done as part of this story, not a gap |
| C28/C29 (spikes structure + verdict enum) | ✅ | ✅ | |
| AC8 real-data + cross-validator check | ✅ | ✅ | See DoD Observations for the real bug this surfaced |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| All 4 categories (Performance/Security/Accessibility/Audit) | ✅ N/A | Story's own NFR section states all 4 as Not Applicable — additive O(n) checks on already-parsed data, no new input surface, CLI tooling only |

---

## Metric Signal

This is a short-track hardening fix, not a metric-tracked feature (no `metrics[]` entries reference `psir-s1`). No metric signal applicable.

---

## Outcome

**COMPLETE**

---

## DoD Observations

1. **A genuine, previously-invisible real-data bug was found and fixed as a direct result of this story**, exactly matching the story's own motivating scenario. `tab-s3` (a fully merged, DoD-complete story from `2026-09-26-tenant-admin-bootstrap`) had a `tasks[]` array frozen at `tddState: "planned"` — a value that was never valid against the schema's own 5-value enum, invisible to the pre-existing `C4` check (presence-only, never validity) until this story's new `C27` check correctly flagged it. Fixed separately on master (commit `b1f55342`) by removing the tasks array entirely, per this same script's own documented remedy for a completed story ("remove the tasks array entirely... once a story reaches branch-complete") rather than guessing an updated `tddState` value for 7 tasks with no other evidence of their real end state. **/improve candidate:** none — this is the intended, correct outcome of the story; noting it here as the concrete proof the reconciliation work has real value, not just theoretical schema parity.
2. **A process near-miss during implementation**: while setting up the `tab-s3` bookkeeping fix, a `cd` to the main checkout did not persist across a subsequent tool invocation, and a short-lived branch was accidentally created *inside* the `psir-s1` worktree instead. Caught immediately via `pwd`/`git branch` before any commit was made; recovered cleanly by switching back to `feature/psir-s1` (uncommitted changes carried over safely) and deleting the stray branch — no data was lost, but it cost a diagnostic round-trip. **/improve candidate:** when operating across a main checkout and one or more worktrees in the same session, confirm `pwd` immediately after any `cd` to a different checkout and before the first `git checkout -b` in that new location, rather than assuming a prior `cd` in an earlier tool call persisted — this is the same class of gap CLAUDE.md already documents for worktree-vs-main-checkout confusion, extended here to main-checkout-vs-worktree confusion in the opposite direction.
3. Two Bash heredocs (`git commit -m "$(cat <<'EOF' ...)"`) failed with `unexpected EOF`/`syntax error` during this story's own bookkeeping commits, both containing pipe characters (`|`) inside enum-value lists in the commit message body (e.g. `not-started|committed|green|refactor|done`). Worked around each time by writing the message to a temp file and using `git commit -F <file>` instead, matching this session's own established `feedback_heredoc_backtick_corruption` lesson — extending it to note that pipe characters, not just backticks, can trigger the same class of shell-quoting failure in this environment.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for psir-s1 (Reconcile
check-pipeline-state-integrity.js's rules with the actual JSON schema).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
