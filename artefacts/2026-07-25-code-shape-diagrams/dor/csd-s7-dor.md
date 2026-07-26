## Definition of Ready: As-built System Architecture diagram generation via static service-call detection

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s7-as-built-system-architecture-diagram.md
**Test plan reference:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s7-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5), operator-directed
**Date:** 2026-07-26

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | Developer/engineer |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests, all 5 ACs covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage names a metric | ✅ | P1, P3 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Short-track — no /review pass run; see W-note below |
| H8 | No uncovered ACs | ✅ | |
| H9 | Architecture Constraints populated, no Cat E HIGH | ✅ | ADR-026, ADR-027 cited correctly (ordinary application code — corrected from an inconsistency csd-s5's own DoR carried; see DoD Observations in csd-s5-dod.md) |
| H-NFR | NFR profile exists | ✅ | Feature-level `nfr-profile.md` covers this story under existing Performance/Security rows (csd-s5, csd-s6 already listed — this story extends the same NFRs, no profile change needed) |
| H-NFR3 | Data classification not blank | ✅ | Internal (unchanged from feature-level profile) |
| H-GOV | Discovery Approved By populated | ✅ | Parent epic's discovery already approved; this is a follow-up story within that same approved scope, not new discovery |

**H-E2E not triggered** — no CSS-layout-dependent ACs in this story (static file analysis only, same as csd-s5).

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W3, W5 | ✅ | — | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Spec error could go unnoticed until post-merge smoke test | RISK-ACCEPT already logged in decisions.md, 2026-07-25 (epic-wide, covers all stories in this epic including follow-ups) |
| W-short-track | This story skipped a formal `/review` pass (short-track: closing an already-identified DoD gap within an already-approved epic, not new discovery) | ⚠️ | A story-authoring issue (vague AC, missed edge case) that `/review` might have caught could ship unnoticed | Acceptable — this story's scope was directly derived from csd-s5/csd-s6's own DoD artefacts (which already went through full discovery→review for the parent epic), and the ACs/test plan here were cross-checked against the real `drift-comparator.js` code before being written, not drafted from a vague intent |

---

## Coding Agent Instructions

```
Proceed: Yes
Story: csd-s7 — As-built System Architecture diagram generation via static service-call detection — artefacts/2026-07-25-code-shape-diagrams/stories/csd-s7-as-built-system-architecture-diagram.md
Test plan: artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s7-test-plan.md

Goal:
Make every test in the test plan pass. Build a static detector that scans
this repo's real committed src/ tree for require() calls to a fixed
allowlist of external-service packages (stripe, pg, ioredis/redis,
@octokit/*, @anthropic-ai/sdk, posthog-node), resolves each to a named
service label, and generates a mermaid flowchart diagram in the exact
shape src/modules/drift-comparator.js's parseFlowchartMermaid() already
expects -- no changes to drift-comparator.js.

Constraints:
- Depends on csd-s5 (established the as-built generation + versioned-
  artefact pattern -- REUSE writeAsBuiltDiagramArtefact() directly from
  src/modules/migration-schema-parser.js, do not reimplement it) and
  csd-s6 (drift-comparator.js's compareSystemArchitecture() already
  exists and must NOT be modified -- this story's job is to produce
  input that already fits its expected shape).
- Ground-truth method is fixed by decisions.md's 2026-07-26 ARCH entry:
  static require() allowlist scan only -- no live network calls, no APM
  instrumentation, no transitive D37-adapter-wiring resolution (that is
  explicitly out of scope for this story).
- Must NOT re-prompt an agent to describe from memory what it built --
  extraction must read real files directly via fs, same principle as
  call-graph-extractor.js and migration-schema-parser.js.
- Zero services found is a valid outcome (empty-edges flowchart), never
  an error.
- Generated diagram content must never include credential-shaped strings
  (SECRET, _KEY, token=, etc.) or surrounding code content -- only service
  names and requiring-file paths.
- This is ordinary application code (ADR-027) -- belongs in src/modules/
  (the detector) and src/web-ui/routes/ (a thin HTTP adapter following
  as-built-diagrams.js's exact existing pattern), NOT a SKILL.md change.
  Read src/web-ui/routes/as-built-diagrams.js and
  src/modules/migration-schema-parser.js in full before writing any code
  -- follow their exact conventions (injectable adapter seam for testing
  the error path, D37-style, versioned artefact writing, audit logging).
- Also read src/modules/call-graph-extractor.js in full -- this story's
  require-detection logic should follow the same "read real source text,
  regex-extract require() specifiers" approach, extended with an
  allowlist match instead of relative-path resolution.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Respect ADR-026 (reuse existing mechanisms, no parallel
  path) and ADR-027 (ordinary application code).
- Before finishing: git fetch origin master && git log HEAD..origin/master
  --oneline to check for divergence; if master moved, merge and resolve
  any .github/pipeline-state.json conflict by hand (keep both sides' real
  content), then grep -n "<<<<<<<\|=======\|>>>>>>>" .github/pipeline-state.json
  to confirm zero markers before committing. This has bitten multiple
  stories in this epic already.
- Run the full suite (node scripts/run-all-tests.js) SYNCHRONOUSLY and
  wait for it to finish before committing -- diff against
  tests/known-baseline-failures.json, zero new failures allowed. If you
  are running low on turns/context, prioritize a real commit + push +
  draft PR over one more verification pass -- a prior story in this epic
  (csd-s5) was cut off mid-task by a session limit while uncommitted; do
  not repeat that.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, flag it
  explicitly in the PR description and proceed with your best judgment
  rather than guessing silently -- this repo's convention throughout this
  epic has been to flag judgment calls transparently, not hide them.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness confirmed
**Signed off by:** Hamish King, Founder/Operator, 2026-07-26
