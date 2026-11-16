# Contract Proposal - A short-track fix for a GitHub issue closes that issue as a matter of course

**What will be built:**
- `scripts/check-source-issue-closure.js` (new): exports `closingKeywordPresent(body, n)`, `findOpenSourceIssues(state, lookup)` and the thin read-only `gh` wrappers; command line: no arguments scans `.github/pipeline-state.json`, `--pr <number> --issue <N>` checks the PR's closing references; `GH_BIN` selects the binary; `gh` unavailable gives exit 0 and a "skipped" message.
- `skills/branch-complete/SKILL.md`: the draft-PR step (bash and PowerShell bodies) gains a source-issue instruction with `Fixes #N` and the closing-reference check before the PR URL is reported.
- `skills/definition-of-done/SKILL.md`: Step 1 runs the scan for the story and records closed, or a deviation with the offer to close.
- `templates/definition-of-done.md`: a `Source Issue Closure` section (added at build: the DoD output template is this file, a touchpoint the first draft of this contract missed).
- `.github/pipeline-state.schema.json`: `sourceIssue` (integer) in both story definitions.
- `tests/check-icf-s1-fix-pr-closes-issue.js` (new, T1 to T6).

**What will NOT be built:**
- No automatic closing of any issue by the agent; no change to the error bridge, issue creation, any CI workflow, `bin/skills` code (integer coercion already exists), the other skills, or any dependency. `sourceIssue` is not set on any existing story.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit (skill text) |
| AC2 | T2 | unit |
| AC3 | T3 | unit (injected lookup) |
| AC4 | T4 | unit (skill text) |
| AC5 | T5 | integration (schema, temporary-root integrity run) |
| AC6 | T6 | integration (spawned script) |
| AC7 | next real error-issue fix | live evidence |

**Assumptions:** `branch-complete` Option 2 has a bash body (`gh pr create ... --body "$(cat <<'EOF' ...`) and a PowerShell body (`$tmp`/`--body-file`) (read at lines 106 to 175); `definition-of-done` Step 1 is "Confirm the story and PR" (read at line 59); `cli-advance.js` coerces integer values for story fields (read at lines 130 to 235 area, `ENUM_FIELDS` only lists enum fields); the integrity script reads only `.github/pipeline-state.json` relative to its own location (as used by `check-bfl-s2-real-ci-failures.js`); any test that hash-pins SKILL.md files will be found by running the skill and governance tests after the edit and named in the evidence.

`schemaDepends: []`. **Estimated touch points:** Files: the five listed above. Services: none. APIs: none.
