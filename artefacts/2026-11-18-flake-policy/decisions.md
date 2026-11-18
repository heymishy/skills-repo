# Decisions: a flake ledger and a rerun rule (flk-s1)

**2026-11-18 | DECISION | One ledger for flakes; quarantine stays in the capability matrix**
**Context:** quarantine (lpw-s2, lpw-s3) already records specs that are excluded from the core lane, with reasons and review dates. A flake is a test that is sometimes wrong, and it may be in the core lane.
**Decision:** `tests/e2e/flake-ledger.json` lists flakes. A quarantined spec is not also listed.
**Rationale:** two lists for the same test would drift; the matrix already answers "is this excluded, and until when".

**2026-11-18 | DECISION | A review date at most 14 days after the entry is first seen**
**Context:** every quarantined entry in the matrix carries the same review date, 2026-12-15, set when the lanes were introduced. Nothing checks it before that date, and nothing reviews the entries early.
**Decision:** a flake entry's reviewBy must be no more than 14 days after firstSeen, and `--check` fails once the date has passed.
**Rationale:** a flake that the operator reruns past for months is what this policy exists to stop.

**2026-11-18 | DECISION | The rerun rule is written and checked, not enforced by CI**
**Context:** CI does not rerun jobs on its own, and Playwright's retry setting is zero. A rule that a check cannot see cannot be enforced; a rule that the operator can see can be followed.
**Decision:** the policy requires a ledger entry before a passing rerun counts. `flake-check --report --strict` shows untracked flakes. No CI step enforces it yet.
**Rationale:** enforcing it needs a decision about CI reruns that this story does not make.
