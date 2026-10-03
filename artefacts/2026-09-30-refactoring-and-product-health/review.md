# Review Report

## Story: ep1-s1

### HIGH findings
None.

### MEDIUM findings
None.

### LOW findings
1-L1: AC quality — AC1 names `notes` and `reason` as required fields in the schema declaration but does not verify they are required (vs optional). The design.md spec correctly marks `notes` as optional; the AC conflates required-field listing with required-field enforcement. A validation run against a receipt omitting `notes` would still pass. Low impact; no rework needed.

**Verdict:** PASS

## Story: ep1-s2

### HIGH findings
None.

### MEDIUM findings
2-M1: Completeness — "I want" clause is a broken sentence fragment. The text begins "zero silent skips), I need the `/tdd` REFACTOR step…" — the benefit target leaked into the clause. The intended meaning is recoverable but the field is malformed. Fix: rewrite as "I want the `/tdd` REFACTOR step to require a structured receipt or an explicit skip reason, and the `/verify-completion` scope-creep check to allow structural-only file rewrites for files already in the DoR contract."

2-M2: AC quality — AC1 describes instruction text ("the SKILL.md instructs the agent to either (a)… or (b)…") rather than observable agent behaviour. The Then clause cannot be independently tested without running the agent against the SKILL.md. Fix: rewrite AC1 as an observable outcome — e.g. "Then the agent produces either a completed receipt (all required fields present in pipeline-state.json) or an explicit skip receipt (status: skipped, reason non-empty in pipeline-state.json) — and no task closes without one of these two records."

### LOW findings
2-L1: AC quality — AC5's Then clause tests a concept ("structural-only rewrites") that cannot be automatically detected per the out-of-scope declaration. The AC should make the actual verifiable condition explicit: the scope-creep check passes when the file is in the DoR contract and the test suite is green, regardless of the nature of the changes. The phrase "structural-only" is advisory, not testable.

**Verdict:** FAIL

## Story: ep2-s1

### HIGH findings
None.

### MEDIUM findings
3-M1: AC quality — AC1 describes process ("the review reads… and examines…") rather than observable output. The Then clause uses active verbs describing what Stage 3 does internally, not what it produces. The actual testable outcome is in AC2. Fix: rewrite AC1 as an entry condition or precondition clause (move to Given), and rewrite the Then to describe a produced record — e.g. "Then Stage 3 produces a finding section in the review artefact (or a 'No design findings' record) covering the four examination dimensions."

### LOW findings
3-L1: AC quality — AC2 requires the finding to include "a description, the affected task(s), and a recommended action" but no AC validates the finding record format or minimum required fields. A finding with only a description would satisfy AC2 loosely. Recommend adding a format note to the DoR contract or tightening the Then clause.

**Verdict:** FAIL

## Story: ep2-s2

### HIGH findings
None.

### MEDIUM findings
None.

### LOW findings
4-L1: AC quality — AC1 implies `designLensFindingsCount` is computed from the Stage 3 review artefact (ep2-s1 output), but the data path from review artefact to DoD computation is not explicit. If the DoD skill cannot find or parse the review artefact's Stage 3 section, this value is undefined. Recommend adding the source path to the DoR contract or the AC itself.

4-L2: AC quality — AC2 specifies `pipeline-state.json` is updated "via `bin/skills advance`" but does not name the dot-notation path (e.g. `feature.designHealth`). The coding agent should not have to infer this. Recommend adding the path to the AC or the DoR contract.

**Verdict:** PASS

## Story: ep2-s3

### HIGH findings
None.

### MEDIUM findings
None.

### LOW findings
5-L1: AC quality — AC1 specifies the exact warning message text inline. Exact-string matching creates a brittle test; any whitespace or punctuation change fails the AC. Confirm whether exact string matching is intended, or note the message as a "should include" pattern (task-id, "tddState record but no refactorReceipt", advance command reference) rather than a verbatim string.

**Verdict:** PASS

## Overall Verdict

**Verdict:** FAIL
0 HIGH, 3 MEDIUM, 5 LOW across 5 stories.
3 stories PASS (ep1-s1, ep2-s2, ep2-s3). 2 stories FAIL (ep1-s2, ep2-s1).
All MEDIUM findings are fixable without story rework — scope and intent are sound. Fix the "I want" clause (2-M1), rewrite AC1 as an observable outcome (2-M2), and rewrite ep2-s1 AC1 as an entry condition or output-producing Then (3-M1). Then re-run /review for the two failing stories only.