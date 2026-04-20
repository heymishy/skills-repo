# Definition of Done: Consumer-configurable commit format regex validation for distribution commands (p4-dist-commit-format)

**PR:** No formal PR — work committed directly to master at `a3b2cd1` | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-commit-format.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-dist-commit-format-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-dist-commit-format-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Non-matching commit message → non-zero exit with SHA, excerpt, and regex named in error | ✅ | T1 passing (`src/distribution/commit-format.js` exists); T2 passing (non-matching returns error); T3a passing (error includes 8-char SHA prefix); T3b passing (error includes message excerpt); T3c passing (error includes the regex string) | Automated: `tests/check-p4-dist-commit-format.js` T1–T3c | None |
| AC2 — Absent `commit_format_regex` → no validation; command proceeds | ✅ | T5 passing (`validateCommitFormat` with null regex returns null) | Automated: T5 | None |
| AC3 — Matching commit message → returns null (no error); sub-millisecond | ✅ | T4 passing (matching message returns null) | Automated: T4 | None |
| AC4 — Invalid regex → named error identifying `distribution.commit_format_regex` and `context.yml` line; no raw SyntaxError | ✅ | T6 passing (invalid regex does not propagate raw SyntaxError); T6b passing (returns an error object); T7a passing (error mentions `distribution.commit_format_regex`); T7b passing (error mentions `context.yml`) | Automated: T6, T6b, T7a, T7b | None |

**ACs satisfied: 4/4**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** Work committed at `a3b2cd1` without a standalone draft PR.

---

## Test Plan Coverage

**Tests from plan implemented:** 14/14 assertions passing
**Assertions passing:** 14/14
**Tests passing in CI (npm test):** 14

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — commit-format.js exists | ✅ | ✅ | |
| T2 — non-matching commit returns error | ✅ | ✅ | |
| T3a — error includes 8-char SHA prefix | ✅ | ✅ | |
| T3b — error includes message excerpt | ✅ | ✅ | |
| T3c — error includes regex string | ✅ | ✅ | |
| T4 — matching message returns null | ✅ | ✅ | |
| T5 — null regex returns null | ✅ | ✅ | |
| T6 — invalid regex does not throw raw SyntaxError | ✅ | ✅ | |
| T6b — invalid regex returns an error object | ✅ | ✅ | |
| T7a — error mentions distribution.commit_format_regex | ✅ | ✅ | |
| T7b — error mentions context.yml | ✅ | ✅ | |
| T8a — regex not sourced from process.argv | ✅ | ✅ | ADR-004 compliance |
| T8b — regex not sourced from process.env | ✅ | ✅ | ADR-004 compliance |
| T-NFR1 — no outbound HTTP/HTTPS/fetch call | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| ADR-004 — config exclusively from context.yml; no CLI args or env vars | ✅ | T8a/T8b passing; regex sourced only from context.yml `distribution.commit_format_regex` field |
| MC-SEC-02 — commit message not sent externally | ✅ | T-NFR1 passing; no outbound HTTP/HTTPS/fetch call in module source |
| Opt-in by design — no default format imposed | ✅ | T5 passing; absent config means no validation runs |
