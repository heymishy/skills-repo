# Review Report: CLI subprocess invocation with JSONL output capture — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.9-cli-subprocess-invocation.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[9-M1]** [C — AC quality] — AC1 specifies the flag `--output-format=json` and AC2 expects "each line is parsed as a separate JSON object". The flag name `json` implies a single-document JSON payload (`JSON.parse(stdout)`), while the expected parse strategy in AC2 is JSONL (line-by-line `stdout.split('\n').map(JSON.parse)`). If the Copilot CLI produces newline-delimited JSON objects via this flag, an implementing agent reading AC1 literally may use the wrong parse strategy and produce a runtime failure on multi-line output.
  Fix: Clarify the output format in AC1 — either confirm the flag produces JSONL and add a parenthetical "(the output is newline-delimited JSON; each line is a separate JSON object)", or correct the flag name to `--output-format=jsonl` if that is the correct value. AC2 should then be redundant to confirm "each line is parsed separately."

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 4 | PASS | All references present. Benefit linkage traces to M1 spike PROCEED verdict with explicit spike-to-production-code mechanism sentence. Score reflects that M1 is an internal feasibility metric rather than a direct end-user metric — the path to P2 is implicit. |
| B — Scope integrity | 5 | PASS | Out of scope precisely bounded: ACP path deferred to wuce.10/wuce.16, streaming to a progressive enhancement, `--no-ask-user` scenarios to the UI layer. No discovery out-of-scope violations. |
| C — AC quality | 3 | PASS | AC1–AC5 in Given/When/Then. Strong security ACs (AC3 timeout/kill, AC4 non-zero exit handling, AC5 metacharacter allowlist). MEDIUM on json/JSONL parse strategy ambiguity between AC1 flag name and AC2 parsing expectation (9-M1). |
| D — Completeness | 5 | PASS | All template fields populated. Named persona (platform operator). NFRs across 3 categories. Complexity 3 (highest in the feature — appropriate for the primary execution path). Audit NFR explicitly excludes prompt content and token values from logs — correct. |
| E — Architecture | 5 | PASS | ADR-009 (module separation) and no-shell constraint explicitly named. Security constraints are the strongest in E3: env-var-only token injection, no `shell: true`, allowlist validation, hard timeout with SIGTERM/SIGKILL sequence. All applicable guardrails referenced. |

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome: PASS** — Resolve 9-M1 before /test-plan: the json/JSONL format ambiguity is a concrete implementor confusion risk on the primary subprocess output path. This story is complexity 3 and is the execution engine foundation for wuce.13–16 — the AC must be unambiguous.
