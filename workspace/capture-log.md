# Capture Log

Append-only. One entry per signal. Never truncate or overwrite prior entries.

---

- date: 2026-04-28
  session-phase: pre-discovery exploration
  signal-type: pattern
  signal-text: artefacts/baseline/ concept — a durable, versioned reference corpus that always represents the current known implementation state of all systems in scope. Distinct from in-flight feature artefacts (artefacts/[date]-[slug]/). Blank for greenfield; populated by /reverse-engineer runs for legacy systems; updated incrementally as implementation advances and DoD+release confirms new state. Stories pin to a baselineRef (ISO-8601 timestamp) so spec-drift is detectable. Applies to all repo types (general, not modernisation-only). Cross-repo: each framework repo maintains its own artefacts/baseline/ as a local projection; shared knowledge lives in the EA registry. baselineRef granularity: ISO-8601 timestamp (not just date — multiple runs per day must be distinguishable). Outer loop writes freely to artefacts/baseline/; inner loop updates after DoD+release confirmation. reference/ folder stays as feature-scoped raw input; baseline/ is the extracted, structured, cross-feature truth.
  source: operator-manual

- date: 2026-04-29
  session-phase: asd.1 post-merge bug sweep
  signal-type: pattern
  signal-text: "All four asd.1 bugs (ci_attachment gating, pipelineStories TDZ, epic-nested stories, wildcard slug) share the same root cause: inline JS inside github-script YAML actions is never executed by the test suite. Tests only grep YAML text for string presence — they cannot catch JS logic bugs, variable ordering bugs, or regex edge cases. Pattern: any logic inside a github-script action block is effectively untested. Structural fix needed: extract inline JS to a testable module (scripts/ci-audit-comment.js) that exports buildComment(inputs). Secondary finding: extractPRSlug must be tested against glob notation (artefacts/*/), multiple artefact path references in body, and backtick-wrapped paths — all occur in real agent-generated PR bodies."
  source: agent-auto

- date: 2026-04-29
  session-phase: sar.1 short-track
  signal-type: gap
  signal-text: Audit record slug resolution (sar.1) fixes the PR-blind heuristic but the ✅ ticks still mean "file exists and was hashable" not "correct artefacts for this story". Deferred idea — cross-check: after slug extraction, compare extracted slug against the slug recorded in .ci-artefact-staging/manifest.json at collect-time; if they differ, post a ⚠️ mismatch notice on the PR rather than silently showing potentially stale artefacts. This would close the remaining gap where a manual/hand-crafted PR body takes the first artefact path match which may be a "Related" reference rather than the primary feature. Also useful for detecting cases where the manifest was collected from a different feature branch. Candidate for a follow-on short-track story once sar.1 is merged and the manifest.json structure is confirmed stable.
  source: operator-manual

- date: 2026-04-30
  session-phase: rrc post-merge / integrity gate
  signal-type: pattern
  signal-text: "testPlan.passing lag — when a story is created, passing is initialised to 0 and never updated before the PR is opened. CI audit comment falls back to this stale value, displaying '0/N passing' and showing em-dash on every AC row. Fix: allPassingFallback in ci-audit-comment.js (display) + check-pipeline-state-integrity.js C1/C2/C3 checks (data). Prevention: always update testPlan.passing on master before or alongside opening/merging a PR."
  source: agent-auto

- date: 2026-04-30
  session-phase: rrc post-merge / integrity gate
  signal-type: gap
  signal-text: "Deferred scope leaves permanently failing governance checks. p3.3 (Gate structural independence) was partially implemented — AC2 and NFR depend on a skills-framework-infra repo that was never created. Two tests have been failing on every npm test run for multiple sessions. No mechanism exists to mark tests as known-deferred/SKIP without modifying check-assurance-gate.js (governed, needs story). Created known-deferred-checks.json as the data record; code change (read file + emit SKIP) requires a story. Prevention process rule: mark failing tests as pending in the same commit that records a deferral."
  source: agent-auto
- date: 2026-05-03
  session-phase: inner-loop wave 3 (wuce.9-12)
  signal-type: gap
  signal-text: "PR Governed Delivery Audit Record shows all feature stories' ACs (not just the story under review) because the issue-dispatch template renders the full feature audit view. This is noisy for reviewers who only care about the current story's ACs. UX improvement: scope the audit record to the specific story being reviewed, or add a collapsible section for the full feature view. Not blocking merge — candidate improvement story for a future wave."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "package.json conflict markers survive silently when the resolution one-liner is chained after Set-Location in PowerShell — node exits 0 without writing. All CI gates then crash with SyntaxError. Fix: always run the one-liner as a standalone terminal call, then immediately confirm with node -e 'require(./package.json)'. This is now D28."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "testPlan.status: 'verified' is not in the pipeline-state schema enum. Valid value is 'all-passing'. This caused schema_valid: FAILED on Trace Validation for all 4 Wave 3 stories. Prevention: run full schema scan locally before every pipeline-state commit. This is now D29."
  source: agent-auto

- date: 2026-05-03
  session-phase: inner-loop wave 3 post-merge / wave 4 dispatch
  signal-type: pattern
  signal-text: "pipeline-state.json rebase conflicts follow the same pattern as package.json cascading conflicts (D17/D30): multiple PR merges advance origin/master while local commits accumulate. Resolution one-liner: take origin/master as base, Object.assign only the changed story indices from REBASE_HEAD. Prevention: push pipeline-state commits immediately, never accumulate."
  source: agent-auto
- date: 2026-05-04
  session-phase: inner-loop wuce post-delivery bug triage
  signal-type: pattern
  signal-text: "Injectable adapter stubs that return null/empty silently mask production misconfiguration across wuce.23-25. Four adapters (getNextQuestion, submitAnswer, getCommitPreview, commitSession) were never wired in server.js; unit tests passed because they injected test doubles. The fix is threefold: stubs must throw not return empty, DoR must have explicit AC for production wiring, and implementation-plan must name the wiring task separately. This is now D37."
  source: agent-auto

- date: 2026-05-05
  session-phase: dsq inner-loop — post-PR-open investigation
  signal-type: gap
  signal-text: "Story check scripts written by implementation agent but not registered in npm test chain. All 5 dsq check scripts (tests/check-dsq*.js) existed and passed when run directly, but none were in package.json scripts.test. CI showed SUCCESS on all PRs because existing tests passed; the new tests were simply never run. Root cause: /implementation-plan tasks stop at 'write the test file' without an explicit 'register in package.json' step; DoR H5/H6 check test existence not registration; no governance check caught unregistered files. Structural fix: tests/check-test-registration.js governance check + known-deferred-checks.json pendingTestFiles for TDD pre-committed stubs. Also found 3 older check files (check-p4-obs-*.js) with the same gap. This is now D38."
  source: agent-auto
