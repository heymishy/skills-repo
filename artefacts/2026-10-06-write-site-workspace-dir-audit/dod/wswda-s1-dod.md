# Definition of Done: Create the target directory before writing strategy-metrics and file-backed ideas data

**PR:** https://github.com/heymishy/skills-repo/pull/944 | **Merged:** 2026-10-05
**Story:** artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md
**Test plan:** artefacts/2026-10-06-write-site-workspace-dir-audit/test-plans/wswda-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-06-write-site-workspace-dir-audit/dor/wswda-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — strategy-metrics write succeeds when its directory doesn't exist | ✅ | Two tests: `writeFileEnsuringDir` directly against a real nested, not-yet-existing temp directory (`tests/check-wswda-s1-mkdir-before-write.js`), and `recordMetrics` called directly with a missing `workspaceDir` (`tests/check-sdg6-metrics-recording.js` T11) — both reproduce the exact real production failure mode | `integration-real-code` (real fs I/O, no mocking) | None |
| AC2 — features.js ideas write succeeds when its directory doesn't exist | ✅ | Covered via the identical shared code path (`writeFileEnsuringDir`'s own direct test) plus a source-level assertion that `_writeIdeasFile` actually delegates to it rather than raw `fs.writeFileSync` — logged as a deliberate RISK-ACCEPT in `decisions.md` rather than a direct missing-directory test against the real hardcoded `IDEAS_PATH` (would require touching this repo's real `workspace/` directory) | `integration-real-code` (helper) + source-assertion | None — covered per the documented RISK-ACCEPT, not silently uncovered |
| AC3 — write behaviour unchanged when the directory already exists | ✅ | `writeFileEnsuringDir` tested against an already-existing temp path; `features.js`'s real `_writeIdeasFile` call site re-exercised end-to-end against the real (already-existing) `workspace/ideas.json`, content restored after; all 11 pre-existing `check-sdg6-metrics-recording.js` tests and all 6 `check-idp-s1-persist-ideas-in-postgres.js` tests pass unchanged | `integration-real-code` (regression) | None |
| AC4 — all pre-existing strategy-metrics/features tests still pass | ✅ | `tests/check-sdg6-metrics-recording.js`: 11/11 (10 pre-existing + T11). `tests/check-idp-s1-persist-ideas-in-postgres.js`: 6/6. Full suite: 717 files, only the pre-existing unrelated `discovery_approved` failure (same baseline as every other story this session) | `integration-real-code` (regression) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. The 3 existing precedent call sites (`server.js`, `reference-validator.js`, `dismissed-signals-store.js`) were left untouched, as scoped. `skills.js:2907`'s canvas-edit write and the approval-channel/CLI-tooling write sites were audited and confirmed out of scope (see story's own Out of Scope section) — no fix applied there, correctly.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (new file) + 1 / 1 (extension to existing suite) = 5 new tests
**Tests passing in CI:** 5 / 5, plus full regression (717 files, only the pre-existing unrelated failure)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| writeFileEnsuringDir creates a missing nested directory (AC1) | ✅ | ✅ | |
| writeFileEnsuringDir behaves identically when directory exists (AC3) | ✅ | ✅ | |
| features.js's _writeIdeasFile delegates to writeFileEnsuringDir, not raw fs.writeFileSync (AC2) | ✅ | ✅ | |
| features.js's _writeIdeasFile still writes correctly when directory exists (AC3, real call site) | ✅ | ✅ | |
| recordMetrics succeeds when workspaceDir does not exist yet (AC1, direct) | ✅ | ✅ | Added to `check-sdg6-metrics-recording.js` as T11 |

**Gaps (tests not implemented):** None — AC2's partial-coverage gap (see AC Coverage table) was planned and logged as a RISK-ACCEPT, not an unplanned gap.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` — pure backend module fix, no rendered UI change.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — mkdirSync adds no measurable overhead | ✅ | Documented Node.js behaviour (fast no-op on an existing directory); no change to full-suite run time pattern |
| Security — no new attack surface | ✅ | No new input surface; directories created with inherited default permissions, matching the 3 existing precedent call sites |

---

## Metric Signal

No formal benefit-metric is moved by this story (reliability fix, not user-facing behaviour change) — matching the story's own stated Benefit Linkage. The practical benefit: `strategy-metrics.js`'s callout-rate metric (owned by the `strategy-and-data-hub` feature, `sdg.6`) can now actually record data in any real deployed environment for the first time — previously silently failing (caught + `console.error`'d) on every `/ideate`/`/discovery` completion outside a local dev checkout. This is a precondition for that metric to ever produce a real signal, not a signal itself.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Standing, named in the story's own Out of Scope: any future write site added under `src/web-ui/**` should use `writeFileEnsuringDir` as a matter of course rather than requiring a fresh audit each time this root-cause class recurs.

---

## DoD Observations

1. **This story's own CI run hit a real process gap, not a code defect**: the initial PR push failed `Validate traceability chain` because the new short-track feature/story was never registered in `.github/pipeline-state.json` — a mandatory-write step that was skipped when the story artefacts were first created. Fixed by registering `wswda-s1` directly (initial story creation, per `CLAUDE.md`'s permitted exception), validated via `check-pipeline-state-integrity.js`, and pushed. Logged here as a reminder that artefact creation and the pipeline-state write are both mandatory, not just the former.
2. **A separate, unrelated GitHub Actions hosted-runner capacity issue** then caused every check (including the now-fixed trace validation) to fail with "the job was not acquired by Runner... after multiple attempts" across the whole repo (confirmed via an unrelated scheduled `Fleet Aggregation` job on `master` failing identically at the same time). Not caused by this story's changes. Resolved by retrying with fresh commits until hosted runners became available again — all 8 required checks passed cleanly on the retry that landed.
3. A first attempt at automating the CI-retry loop via a background `Monitor` silently stalled because `jq` is not installed in that shell environment (it is available in the interactive `Bash` tool's environment, which masked the gap until the monitor's own output was inspected) — reported to the user directly rather than left as a silent no-op; fixed by rewriting the check with `node` instead of `jq`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Create the target directory before writing strategy-metrics and file-backed ideas data" (wswda-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
