# Definition of Ready Checklist

## Definition of Ready: GitHub-API-backed pipeline-state writer for the production container, wired by environment, with failure visibility

**Story reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s2.md
**Test plan reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s2-test-plan.md
**Review reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/review/wsd-s2-review-1.md (PASS)
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-15

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "the operator moving a feature between the production web UI and Claude Code CLI on the same repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test/verification method | ✅ | T1-T9 map onto AC1-AC5, several with 2 tests each |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | Both benefit-metric.md metrics, with baseline/target values |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH; 1 MEDIUM resolved in-pass (see review) |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated in detail, including the two-independent-GETs race-condition reasoning; Category E scored 5 |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Not a UI/layout change |
| H-NFR | NFR profile or explicit "None" field | ✅ | Concurrency safety, Observability, Performance, Security addressed |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ | Hamish King — Operator — 2026-09-15 |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ | New `pipeline-state-github-writer.js` factory, selected alongside the existing `pipelineStateWriterFactory` at `server.js` startup — same `setPipelineStateWriter()` seam `journey.js` already has, D37's four requirements assessed below |
| H-INF | Infra-plan gate | ✅ N/A | Application code change; no new infra provisioning (explicitly no local git checkout added to the container, per decisions.md) |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

### D37 injectable-adapter assessment (H-ADAPTER)

This story adds a second *factory* selected at startup, not a new bare stub-then-wire seam on the existing `pipelineStateWriter` — the existing `setPipelineStateWriter()`/throw-on-unwired-stub pattern in `journey.js` already satisfies D37 rule 1 (stub throws). Applying D37's remaining rules to the new selection logic:
- Rule 2 (DoR AC for production wiring): AC1/AC2 cover both selected implementations' correctness.
- Rule 3 (wiring named as a separate task from the handler): the `server.js` selection logic is explicitly its own implementation task, distinct from `pipeline-state-github-writer.js`'s own internal logic — named separately in the Coding Agent Instructions below.
- Rule 4 (wiring test asserts behavioural correctness, not just that a function was assigned): AC2/T3/T4 assert which factory is genuinely *invoked* for each environment, not merely that a reference was set — satisfies the `tir-s1` lesson this repo's own CLAUDE.md cites.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | Concurrency behaviour not testable end-to-end against a real live conflict | ✅ | AC3's real-world conflict scenario is verified via mocked sequential calls (T5/T6), not a genuine parallel-request race — judged sufficient given the mechanics (GET+sha+PUT) are deterministic and the retry logic itself is what's under test, not GitHub's own concurrency guarantees (already trusted, already relied on by `artefact-commit-writer.js` in production). | Claude Sonnet 5 (orchestrating agent) |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Test plan mirrors established mocking conventions already used and proven in this repo | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ N/A | No gap table — all ACs directly covered | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: GitHub-API-backed pipeline-state writer for the production
       container, wired by environment, with failure visibility
       -- artefacts/2026-09-15-web-ui-pipeline-state-durability/stories/wsd-s2.md
Test plan: artefacts/2026-09-15-web-ui-pipeline-state-durability/test-plans/wsd-s2-test-plan.md

Goal:
New src/web-ui/adapters/pipeline-state-github-writer.js implementing
pipelineStateWriter(featureSlug, storyId, stateUpdate) via the GitHub
Contents API instead of local fs, wired at server.js startup alongside
the existing local-fs factory, selected by the same isRealCheckout
signal pipeline-state-writer.js already computes.

Tasks (separate, per D37 rule 3):
1. Handler task: pipeline-state-github-writer.js itself -- GET (content
   + sha in one request), apply feature-level fields (mirror
   pipeline-state-writer.js's existing validateStateUpdate() +
   featureLevelKeys.forEach() logic exactly), apply story-level fields
   via wsd-s1's applyAdvance(), PUT with the captured sha, retry-on-409
   up to 3 attempts (150ms/400ms backoff), PostHog capture on
   exhausted retry or any other unrecoverable failure (reuse
   posthog-server.js's existing capture mechanism, same pattern as
   ltd-s1's $ai_is_error/$ai_error fields).
2. Wiring task (separate from task 1): server.js startup -- select
   between the existing pipelineStateWriterFactory and this new
   GitHub-API factory based on isRealCheckout. Expose or duplicate the
   isRealCheckout check (fs.existsSync(path.join(repoRoot, '.git')))
   so server.js can choose without pipeline-state-writer.js needing to
   change its own internal logic.

Constraints:
- Do NOT call artefact-commit-writer.js's commitArtefact/
  realCommitArtefact for the PUT step -- that function does its own
  internal GET-for-sha, which would race against this module's own
  GET (see Architecture Constraints in the story for the exact
  failure mode). Write the PUT directly in the new module using the
  sha this module's own GET already captured.
- Reuse req.session.accessToken for auth -- no new credential.
- journey.js's existing call site (line 2577) and its existing
  console.error on failure (lines 2579-2581) are UNCHANGED -- this
  story adds a PostHog capture in addition to that log line, not
  instead of it.
- New test file tests/check-wsd-s2-github-pipeline-state-writer.js
  per the test plan, mocking fetch directly. Re-run
  tests/check-pla-s2-posthog-wiring.js,
  tests/check-defs-s1-definition-artefact-splitter.js,
  tests/check-revs-s1-review-artefact-splitter.js,
  tests/check-asf-s1-splitter-parity-bugs.js, and wsd-s1's own test
  file -- all must pass unchanged.
- Depends on wsd-s1 (applyAdvance()) already being merged.
- This is a governed src/ change (CLAUDE.md Artefact-first rule) --
  route through the normal worktree -> PR -> merge path, open a draft
  PR, then mark it ready immediately per established practice.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No further sign-off — the operator explicitly requested this feature go through the full standard-track outer loop directly in conversation on 2026-09-15, following a live-verified root-cause investigation.
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-15 — operator approval: heymishy, 2026-09-15 (in-conversation)

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
