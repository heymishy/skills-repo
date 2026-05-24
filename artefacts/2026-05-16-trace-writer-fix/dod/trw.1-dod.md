# Definition of Done: trw.1 — CI Trace Writer: Guarantee One Fresh JSONL Record per Master Push

**PR:** https://github.com/heymishy/skills-repo/pull/359 | **Merged:** 2026-05-24
**Story:** artefacts/2026-05-16-trace-writer-fix/stories/trw.1-ci-trace-writer.md
**Test plan:** artefacts/2026-05-16-trace-writer-fix/test-plans/trw.1-ci-trace-writer-test-plan.md
**DoR artefact:** artefacts/2026-05-16-trace-writer-fix/dor/trw.1-dor.md
**Assessed by:** GitHub Copilot (/definition-of-done)
**Date:** 2026-05-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Fresh record per push | ✅ | T1 (file written to disk); T12 (write-ci-trace.js step precedes artifact download in trace-commit.yml); T13 (YAML parse confirms additive step) | Automated tests T1, T12, T13 — 17/17 passing, CI run 26355967564 | None |
| AC2 — Correct record content | ✅ | T3 (valid JSON per line); T4 (all 7 required fields: runId, commitSha, headRef, trigger, timestamp, verdict, surface); T5 (trigger="post-merge"); T6 (verdict="trace-committed"); T7 (surface="ci-trace-commit"); T8 (ISO 8601 UTC timestamp) | Automated tests T3–T8 | None |
| AC3 — Naming convention | ✅ | T2 — filename matches `{ISO-timestamp-with-colons-as-dashes}-ci-{8-char-sha}.jsonl` pattern | Automated test T2 | None |
| AC4 — Additive to existing traces | ✅ | T13 — YAML parse of trace-commit.yml confirms no delete/overwrite of existing traces; step is purely additive | Automated test T13 | None |
| AC5 — Improvement agent compatibility | ✅ | T3 (one JSON object per line, no trailing commas, `JSON.parse()` does not throw); T4 (required fields present and non-empty) | Automated tests T3, T4 | None |
| AC6 — No regression on assurance-gate | ✅ | T14 (actions/download-artifact step with name: assurance-trace still present in trace-commit.yml); CI run 26355967564 — both "Run assurance gate" and "Watermark Gate" checks passed | Automated test T14 + CI pass (2/2 checks green) | None |

**All 6 ACs satisfied. No deviations.**

---

## Scope Deviations

The trw.1 PR commit (`d1d5ef0`) modified `.github/workflows/assurance-gate.yml` to add `absArtPath` (GITHUB_WORKSPACE-aware path resolution) and `[ac-extract]` diagnostic logging for the AC extraction block. The story's out-of-scope excluded "assurance-gate.yml artifact generation or upload logic" — this change touched the AC extraction path-reading logic only, not artifact generation or upload steps. This is not a scope deviation per the contract definition.

The companion fix commit `df801e1` (`fix(trw.1): extract computeIssueAcCheck to testable module`) landed on master separately (not via the trw.1 PR) and addressed a governance bot annotation bug. It is logically associated with trw.1 but was not part of the PR scope — no scope deviation.

**Net: None** within the trw.1 PR boundary.

---

## Test Plan Coverage

**Tests from plan implemented:** 14/14 (T1–T14)
**Tests passing in CI:** 17/17 (14 plan tests + 3 additional sub-test assertions added during implementation)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 — Record written to disk | ✅ | ✅ | |
| T2 — Filename follows naming convention | ✅ | ✅ | |
| T3 — Record content is valid JSON | ✅ | ✅ | |
| T4 — All 7 required fields present | ✅ | ✅ | |
| T5 — trigger = "post-merge" | ✅ | ✅ | |
| T6 — verdict = "trace-committed" | ✅ | ✅ | |
| T7 — surface = "ci-trace-commit" | ✅ | ✅ | |
| T8 — timestamp is valid ISO 8601 UTC | ✅ | ✅ | |
| T9 — Creates output directory if absent | ✅ | ✅ | |
| T10 — Script exits 1 on write failure | ✅ | ✅ | |
| T11 — Script does not log GITHUB_TOKEN | ✅ | ✅ | Security constraint verified |
| T12 — trace-commit.yml invokes script before artifact download | ✅ | ✅ | |
| T13 — Additive: existing traces not deleted | ✅ | ✅ | |
| T14 — Artifact download step still present (no regression) | ✅ | ✅ | |

**Gaps:** None. All 14 plan test cases implemented. 3 additional sub-test assertions added (edge-case coverage beyond plan spec) — all passing.

---

## NFR Status

Story declares NFRs: None (reviewed 2026-05-16). Security constraints treated as implementation requirements and verified by tests.

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No credential logging (GITHUB_TOKEN must not appear in output) | ✅ | T11 passing — verified script does not write token to JSONL file or stdout |
| Hardcoded output path (no user-controlled input in path construction) | ✅ | Code review of `scripts/write-ci-trace.js` — output path is `workspace/traces/{timestamp}-ci-{sha8}.jsonl`, fully derived from CI env vars with no request/user input; OWASP path traversal not applicable |
| Additive-only writes (no delete of existing trace files) | ✅ | T13 passing; implementation uses `fs.writeFileSync` to a new filename only |

---

## Metric Signal

This is a short-track platform fix. No benefit-metric artefact was produced and no metrics array is defined in pipeline-state.json for this feature. The intended benefit — "platform trace freshness; improvement agent reads current traces" — is structural infrastructure and not tracked by a formal time-bound metric.

**Post-merge smoke check (pending — requires trace-commit.yml run to complete):**
After trace-commit.yml completes on the master push triggered by the PR #359 merge, verify:
```
git fetch origin traces
git show origin/traces:workspace/traces/ | Select-String (Get-Date -Format "yyyy-MM-dd")
```
Expected: at least one file listed with today's date (2026-05-24).

---

## Outcome

**COMPLETE ✅**

**ACs satisfied:** 6/6
**Deviations:** None
**Test gaps:** None

**Follow-up actions:**
1. Run post-merge smoke check (above) once trace-commit.yml completes — confirms AC1 in the live environment. No blocker; all unit and integration tests pass.
2. trw.1 is the only story in feature 2026-05-16-trace-writer-fix. Feature is delivery-complete.

---

## DoD Observations

- The governance bot "⚠️ ACs not found in issue or artefact" annotation that triggered this session was caused by two separate bugs: (a) `parseACs()` only supported bold `**AC1:**` format; trw.1 uses `### AC1 —` heading format; (b) the inline YAML JS `issueAcCheck` logic was untested and gated on `story.issueUrl` being set. Fix was extracted to `scripts/ci-audit-comment.js` (`computeIssueAcCheck`), covered by tests T29–T35 in `tests/check-ci-audit-comment.js`, and landed on master as commit `df801e1` before the trw.1 PR was merged.
- All 6 ACs appear correctly in the final governance bot comment on PR #359: `trw.1 · Issue #351 · ACs in artefact ✅` with trace hash `d8a1461de5eef13f`.
- PR #359 was marked ready for review and merged on 2026-05-24.
