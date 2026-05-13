# Test Plan: sar.1 — Fix audit record slug resolution

**Story:** `artefacts/2026-04-29-audit-slug-resolution/stories/sar.1-audit-record-slug-fix.md`
**Feature:** `2026-04-29-audit-slug-resolution`
**Short-track:** Yes — no prior review run; complexity 1, bounded scope, no HIGH-risk ACs.

---

## Test Data Strategy

**Strategy:** Synthetic — all tests generate their own input strings and temporary files in setup. No external services, no real PRs, no real pipeline state read at test time.

**Responsibility:** Self-contained — tests generate all test data in setup/teardown.

---

## AC Coverage Table

| AC | Description | Test type | Test IDs |
|----|-------------|-----------|----------|
| AC1 | `extract-pr-slug.js` returns slug from PR body with artefact path | Unit | T1, T2, T3 |
| AC2 | `extract-pr-slug.js` returns empty string when no artefact path in body | Unit | T4, T5 |
| AC3 | `resolve_feature` step uses PR-body slug when available | Integration (workflow logic) | T6 |
| AC4 | Audit record header shows ⚠️ fallback notice when slug auto-resolved | Unit (comment builder) | T7 |
| AC5 | Audit record header shows `Source: PR body` when slug extracted from body | Unit (comment builder) | T8 |

---

## Unit Tests

### T1 — extracts slug from standard PR template chain references table
**AC:** AC1
**Precondition:** PR body string contains a markdown table row: `` | Discovery | `artefacts/2026-04-29-audit-slug-resolution/discovery.md` | ``
**Action:** Call `extractPRSlug(body)`
**Expected:** Returns `"2026-04-29-audit-slug-resolution"`
**Edge case:** No

### T2 — extracts first slug when multiple artefact paths appear in body
**AC:** AC1
**Precondition:** PR body contains two artefact paths: `artefacts/2026-04-29-audit-slug-resolution/` and `artefacts/2026-04-28-inflight-learning-capture/`
**Action:** Call `extractPRSlug(body)`
**Expected:** Returns `"2026-04-29-audit-slug-resolution"` (first match)
**Edge case:** Yes — multiple slugs present

### T3 — handles backtick-wrapped paths (standard PR template format)
**AC:** AC1
**Precondition:** PR body contains `` `artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1.md` ``
**Action:** Call `extractPRSlug(body)`
**Expected:** Returns `"2026-04-23-ci-artefact-attachment"`
**Edge case:** No

### T4 — returns empty string for body with no artefact paths
**AC:** AC2
**Precondition:** PR body is a minimal stub: `"Implements story p11.4\n\nSee issue #206"`
**Action:** Call `extractPRSlug(body)`
**Expected:** Returns `""`
**Edge case:** No

### T5 — returns empty string for empty/null body
**AC:** AC2
**Precondition:** PR body is `""` (empty string) or `null`
**Action:** Call `extractPRSlug(null)` and `extractPRSlug("")`
**Expected:** Both return `""` — no throw, no crash
**Edge case:** Yes — null input

### T6 — extraction logic invocable via Node.js CLI (enables shell step to call it)
**AC:** AC3
**Precondition:** `scripts/extract-pr-slug.js` exists and reads from `process.env.PR_BODY`
**Action:** Spawn child process: `PR_BODY='...<body with artefact path>...' node scripts/extract-pr-slug.js`
**Expected:** Process stdout is the extracted slug; exit code 0
**Edge case:** No

### T7 — audit record source note: fallback notice when slug is auto-resolved
**AC:** AC4
**Precondition:** `slugSource` is `"auto-resolved"`
**Action:** Call `buildSlugSourceNote("auto-resolved")` (exported from the script or inline logic extracted to a testable function)
**Expected:** Returns a string containing `"⚠️"` and `"auto-resolved"` and `"pipeline-state"`
**Edge case:** No

### T8 — audit record source note: PR body confirmation when slug extracted from body
**AC:** AC5
**Precondition:** `slugSource` is `"pr-body"`
**Action:** Call `buildSlugSourceNote("pr-body", "2026-04-29-audit-slug-resolution")`
**Expected:** Returns a string containing `"Source: PR body"` and `"Chain references"` and `"2026-04-29-audit-slug-resolution"`
**Edge case:** No

---

## Integration Tests

None required — AC3 is verified by the unit CLI invocation test (T6) and by CI running the full workflow on a real PR. The workflow step itself is not unit-testable without a CI environment.

---

## NFR Tests

**NFRs: None — confirmed.** Story declares no NFRs beyond "None identified."

---

## Gap Table

| AC | Gap | Type | Handling | Risk-accept |
|----|-----|------|----------|-------------|
| AC3 | `resolve_feature` bash step behaviour verified by T6 (CLI invocation) but not by a full end-to-end workflow run | Integration gap | Manual verification: open a test PR and confirm `[resolve_feature] Extracted from PR body` appears in the Actions log | No formal RISK-ACCEPT needed — gap is observable in CI on the first real PR after merge |
| AC4/AC5 | `buildSlugSourceNote` tested in isolation; integration with the comment-building JS block in the workflow is not unit-tested | Integration gap | Manual: verify the audit record comment on the first real PR after merge shows correct source label | No formal RISK-ACCEPT needed |
