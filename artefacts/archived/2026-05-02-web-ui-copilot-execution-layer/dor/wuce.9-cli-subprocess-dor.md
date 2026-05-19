# Definition of Ready: CLI subprocess invocation with JSONL output capture

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.9 — CLI subprocess invocation with JSONL output capture
**Epic:** E3 — Phase 2 Execution Engine
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As the execution engine / I want to spawn the Copilot CLI as a subprocess with structured output flags and a per-user isolated environment / So that each skill invocation produces parseable JSONL output…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 23 tests in wuce.9 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Multi-step session progress streaming, WebSocket output delivery, retry-on-transient-error, request queue explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P6 — Skill execution success rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 3 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.9 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | No `shell: true`, token via env var only, skill name allowlist validation before spawn, hard timeout with SIGTERM+SIGKILL, ADR-009 (`executeSkill` as standalone module) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (token in env only, no shell: true, allowlist, no log leakage), Performance (configurable timeout, default 300s), Reliability (SIGTERM+SIGKILL sequence), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers token env-var isolation and log redaction for wuce.9 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | 1 MEDIUM finding (9-M1): JSON/JSONL parse strategy ambiguity in AC1/AC2. Resolved by AC2 explicit clarification in test plan: `stdout.split('\n').filter(Boolean).map(JSON.parse)`. Acknowledged in /decisions. |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W3 (9-M1 MEDIUM — resolved by AC2 clarification) and W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E3 (Phase 2 Execution Engine). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: CLI subprocess invocation with JSONL output capture — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.9-cli-subprocess.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.9-cli-subprocess-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- CRITICAL: spawn with `shell: false` — never use `shell: true` (injection vulnerability)
- CRITICAL: COPILOT_GITHUB_TOKEN must be passed via subprocess env var only — never via command-line arg, never logged
- CRITICAL: skill name must be validated against allowlist before spawn — shell metacharacters in skill name → reject with error before spawn (AC5: `[a-z0-9-]` pattern)
- JSONL parsing (AC2): use `stdout.split('\n').filter(Boolean).map(JSON.parse)` — this is the mandated strategy; do not use streaming JSON parser or line-by-line event listener
- Spawn flags: `--output-format=json --silent --no-ask-user --allow-all -p`
- Timeout: configurable via env var (default 300s) — SIGTERM first, then SIGKILL after 5s if still running
- Non-zero exit code: capture last N stderr lines (configurable, default 20) in error object — do not log stderr lines containing tokens
- ADR-009: `executeSkill(skillName, prompt, token, homeDir) -> Promise<ParsedOutput>` must be a standalone module — not inline in a route handler
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Do not implement streaming, WebSocket delivery, retry-on-transient-error, or request queue (out of scope)
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) shell: false, (2) token env-var-only, (3) allowlist validation before spawn, (4) SIGTERM/SIGKILL sequence
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.9-cli-subprocess-dor-contract.md
