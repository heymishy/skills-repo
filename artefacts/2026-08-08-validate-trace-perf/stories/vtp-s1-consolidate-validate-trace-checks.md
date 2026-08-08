## Story: Consolidate validate-trace.sh's checks into a single Python pass

**Epic reference:** None — short-track (bounded refactor)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [platform/CI]

## User Story

As an **operator whose PR depends on `validate-trace.sh` passing in CI**,
I want **the script's runtime to stay roughly constant as the repo's artefact count grows, instead of degrading linearly**,
So that **CI checks stop intermittently timing out for reasons unrelated to the PR's own content**.

## Benefit Linkage

**Metric moved:** Direct CI-reliability fix (short-track, no formal benefit-metric artefact) — discovered live (2026-08-08) while diagnosing `tests/check-p4-enf-second-line.js`'s `T6` sub-check timing out on PR #688 (`lccf-s1`, an unrelated production hotfix). `T6`'s internal 15-second `spawnSync` timeout was bumped to 60s as an immediate unblock, but that only buys headroom — the underlying growth trend is still there and will eventually eat the new margin too.

**How:** Direct source inspection of `scripts/validate-trace.sh` confirms two independent sources of unscaled work, both growing linearly with `artefacts/`'s size (149 feature directories as of this date, up from far fewer when the script was first written):

1. **Repeated re-parsing of the same inputs.** At least 5 of the script's 9 `python3` invocations (`is_hard_fail`, `check_schema_valid`, `check_discovery_exists`, `check_discovery_approved` — twice, `check_test_plan_coverage`) each independently re-read and re-parse `pipeline-state.json` and/or `trace-validation.yml` from disk and pay a fresh Python interpreter cold-start, instead of loading each file once and sharing the result.
2. **A subprocess spawned per artefact directory.** `check_discovery_approved` (line 255) loops over every entry in `artefacts/` in bash and, for each one that has a `discovery.md`, spawns up to 2 `grep -qi` subprocesses to check its approval status (line 276–277). With 149 directories today, that is up to ~300 process spawns for a single check, and the count rises by 1–2 spawns for every new feature this repo ever adds. `check_no_eval_mode_artefacts` has a related but smaller version of the same pattern — one `grep -qF` subprocess per `.md` file found by `find`.

Neither pattern is a bug in the sense of wrong output — every check's logic is currently correct — but both are unbounded-growth cost centres inside a script that gates every PR's merge, and the T6 timeout incident is the first real symptom.

## Architecture Constraints

- **Preserve every check's exact pass/fail semantics.** This is a performance refactor, not a behaviour change: `check_schema_valid`, `check_discovery_exists`, `check_discovery_approved`, `check_test_plan_coverage`, `check_unresolved_blockers`, and `check_no_eval_mode_artefacts` must each produce identical PASS/WARN/FAIL verdicts (and identical `record_fail`/`record_pass` messages, since those flow into `trace-validation-report.json` and CI's rendered output) on the same repo state, before and after this change.
- **Keep `--check <name>` single-check mode working.** `validate-trace.sh --check discovery_exists` is used directly by `node bin/skills validate --story <slug> --ci` (per its own `Usage` comment) — the consolidated implementation must still support running one check in isolation without paying the cost of the other five, or must document/accept the cost tradeoff explicitly if full-context loading is now unavoidable for a single check.
- **Do not change `trace-validation.yml`'s schema or `pipeline-state.json`'s schema.** This story touches only `scripts/validate-trace.sh`'s internal implementation.
- **No D37/adapter concern:** this is not an injectable adapter — it is a CI gate script.

## Dependencies

- **Upstream:** None. Related to, but not blocking on, `lccf-s1`'s T6 timeout bump (already shipped as an immediate mitigation).
- **Downstream:** None known. `node bin/skills validate --story <slug> --ci` and `.github/workflows/*` that invoke `validate-trace.sh` are the only known callers — both must be re-verified against the consolidated script.

## Acceptance Criteria

**AC1:** Given the current repo state (149+ artefact directories, real `pipeline-state.json`), When `validate-trace.sh` (no args, full run) is executed before and after this change, Then the two runs produce byte-identical `trace-validation-report.json` output (same passed/warnings/failures arrays, same messages) — confirming zero behaviour drift.

**AC2:** Given the same repo state, When `validate-trace.sh` is timed before and after this change, Then the post-change wall-clock time is measurably lower (target: at most 1 `python3` process spawned for the full run's config/state loading, replacing today's 5+), and `check_discovery_approved` no longer spawns a subprocess per artefact directory.

**AC3:** Given `validate-trace.sh --check <name>` is invoked for each of the 6 check names individually, When compared against the pre-change single-check output, Then each produces the same verdict and message as before.

**AC4:** Given `tests/check-p4-enf-second-line.js`'s `T6` sub-check (which shells out to `validate-trace.sh --ci`), When re-run after this change, Then it still passes, and the effective margin between `validate-trace.sh`'s real runtime and T6's 60-second timeout is documented (informally, in the PR description) so future readers know how much growth headroom remains.

## Out of Scope

- **Rewriting the script in a different language.** Bash-orchestrating-Python is the existing pattern used throughout this file; this story consolidates within that pattern (one Python entry point loading shared state, called once) rather than replacing it.
- **Changing `trace-validation.yml`'s or `pipeline-state.json`'s schema.** Any future schema evolution is a separate story.
- **The broader script audit** (dispatched separately, in parallel, as a read-only investigation) — that audit's findings, if any require code changes, become their own follow-on stories. This story is scoped strictly to `validate-trace.sh`.
- **Increasing `T6`'s 60-second timeout further.** That was already done as the immediate `lccf-s1` mitigation; this story's job is to reduce the need for it, not to raise it again.

## NFRs

- **Performance:** This IS the performance fix — target is O(1) process-spawn count for config/state loading (down from 5+), and elimination of the O(n) subprocess-per-directory pattern in `check_discovery_approved`.
- **Security:** None identified — no new user input handling; same trusted local files read today.
- **Accessibility:** Not applicable (CI script, no UI).
- **Audit:** Improves, incidentally — a single consolidated Python pass is easier to reason about and extend than 9 scattered inline scripts.

## Complexity Rating

**Rating:** 2 — the refactor itself is mechanical, but correctness depends on preserving subtle existing behaviour across 6 checks (track exemptions, `reference_dirs` skip-list, discovery-stage skip, archived-path fallback for test plans, epic-nested vs flat story arrays) — real ambiguity is in verifying equivalence, not in writing new logic.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)

## Addendum (2026-08-08, during implementation)

While implementing, `check_no_eval_mode_artefacts` was measured standalone at **2m31s** on the implementation machine — it spawns one `grep -qF` subprocess per markdown file found by `find` across `artefacts/`, and this repo now has **3,691** such files. That is the single worst instance of the subprocess-per-item pattern this story exists to fix, worse than `discovery_approved`'s ~300 spawns. The DoR's own coding instructions already said the consolidated Python pass should "compute all 6 checks' verdicts," so this was folded into the same shared pass rather than deferred to a separate story: the marker-string scan now runs in-process via `os.walk` inside the existing consolidated Python invocation, with zero additional subprocess spawns. Measured result: 2m31s → 2.4s standalone, ~63x faster on the same machine, same repo state, same correct verdict ("No eval-mode artefacts found"). AC1/AC2/AC3 above cover this check the same as the other five — no new ACs were needed, since it was already in scope as one of the "6 checks," just not separately called out by name in the original AC text.

