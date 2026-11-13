# Definition of Ready: Alert-to-GitHub-issue bridge for new production error issues

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
**Verification script:** artefacts/2026-11-08-cicd-observability-hardening-automation/verification-scripts/coha-s6-alert-to-github-issue-bridge-verification.md
**Review:** PASS, run 5 (artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s6-review-5.md), 0 HIGH, 2 MEDIUM (resolved in revision), 3 LOW
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-13
**Status:** SIGNED OFF by Hamish King, Platform Owner, 2026-11-13 (hard blocks 20/20 applicable; W3, W4 and the AC9 RISK-ACCEPT acknowledged)

---

## Contract Proposal

See `coha-s6-alert-to-github-issue-bridge-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed.** Each AC maps to named tests at the type it needs: AC1 to AC5 and AC8 through the real handler (with a fake adapter or a local fake GitHub API over real HTTP), AC7 through the real `server.js` startup in a child process, AC6 and AC9 as live and production-observed scenarios stated as such. The contract's exclusions (`error-capture.js`, `posthog-config.js`, `posthog-server.js`, `routes/billing.js`) have no test assertions against them, and the files the tests do assert against (`server.js`, the new route, store and adapter modules) are all in the touch list, so the contract does not contradict the test plan (B1/D1). Mock-shape check: the fixture is rendered by PostHog from a sample event we supplied, so it proves our template and route agree, not that a real event fills the fields; the contract says so, adds the field-name logging, and leaves the real-event proof to AC9. The Stripe route is a pattern, not a reused adapter.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer ..." |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 9 ACs |
| H3 | Every AC has at least one test | ✅ | 37 automated tests (30 always-run, 7 real-Postgres gated) plus 2 manual live scenarios; every AC mapped in the coverage table |
| H4 | Out-of-scope populated | ✅ | Seven explicit exclusions |
| H5 | Benefit linkage names a metric | ✅ | Production-defect detection latency (Metric 4) |
| H6 | Complexity rated | ✅ | Rating 2, scope stability Unstable until the live check |
| H7 | No unresolved HIGH review findings | ✅ | review-5: 0 HIGH |
| H8 | No uncovered ACs | ✅ | AC6 and AC9 are manual by nature and covered by scenarios; gaps classified in the test plan |
| H8-ext | Cross-story schema dependency | ✅ | Upstream coha-s5 declared; contract carries `schemaDepends: [prStatus, dodStatus]`, both present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Constraints cover D37, ADR-012, credentials, CSRF exemption; no Category E HIGH in run 5 |
| H-E2E | No CSS-layout-dependent AC | ✅ N/A | No UI; `hasLayoutDependentGaps: false` |
| H-NFR | NFR profile exists | ✅ | Rows for coha-s6 restored to the bridge design on 2026-11-13 (privacy, isolation, reliability, security) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | "Internal" |
| H-NFR-profile | Profile present | ✅ | Present |
| H-GOV | Approved By in discovery | ✅ | "Hamish King — Platform Owner — 2026-11-08". M1 signal: role unverified for independent sign-off quality, as for the other stories in this feature |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | `setGithubIssueAdapter` is an injectable adapter: the stub throws the exact "Adapter not wired" message (U23), AC7 scopes the production wiring in `server.js` and P6/P7 assert observable outcomes (right token and body; two ids give two issues), and the contract names the wiring as its own task separate from the handler task |
| H-INF | `hasInfraTrack` not set | ✅ N/A | |
| H-MIG | `hasMigrationTrack` not set | ✅ N/A | The `CREATE TABLE IF NOT EXISTS` is an additive boot migration like `credit_audit_log`; no existing table changes |
| H-DESIGN | `hasDesignSystemTrack` not set | ✅ N/A | No UI |

**Result: 20/20 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Performance, security, audit, reliability stated; accessibility N/A |
| W2 | Scope stability declared | ✅ | — | "Unstable until the live check" |
| W3 | MEDIUM findings acknowledged | ⚠️ | 5-M1 and 5-M2 were fixed in the same session by the agent that wrote the story | Acknowledged by Hamish King on 2026-11-13; logged in decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | An unreviewed script may miss edge cases | Acknowledged by Hamish King on 2026-11-13 as a RISK-ACCEPT in decisions.md; the 7 database-backed tests and the live scenarios limit what an unreviewed script can get wrong. Not an independent review. |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Every gap-table entry has a stated handling |

**Decisions logged 2026-11-13 (decisions.md):** W3 and W4 acknowledgements; the AC9 RISK-ACCEPT; the bridge token type; the deferral of a CI Postgres service.

---

## Oversight

Parent epic: **Medium**. The tech lead must be shown this DoR artefact; the operator is the only contributor and the tech lead in this repo, so this artefact and the operator's sign-off are that step.

**Sign-off:** Hamish King — Platform Owner — 2026-11-13, given in the session by replying "Agree" to five stated recommendations (token type, Postgres evidence, W3 and W4, the AC9 RISK-ACCEPT, and the coha-s7 delivery option).

**Open facts the implementer must not assume away (recorded, not blocking):**
1. The label `production-error` did not exist in `heymishy/skills-repo` on 2026-11-13, and whether an issues-only token can create it is unverified; the operator creates it first.
2. A real Postgres is needed at `/verify-completion` for AC2, AC5 and AC7 evidence; Docker must be running.
3. The operator creates the fine-grained token (single repo, Issues read and write only, 90-day expiry) and sets `ERROR_BRIDGE_SECRET` and `ERROR_BRIDGE_GITHUB_TOKEN` as Fly secrets without printing them; the agent never sees either value.
4. Scenario 6 opens a real issue in a public repo and needs approval immediately before the one run.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (operator sign-off, W3 and W4 acknowledgements and the AC9 RISK-ACCEPT recorded 2026-11-13)
Story: Alert-to-GitHub-issue bridge for new production error issues — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md
Contract: artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s6-alert-to-github-issue-bridge-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions; test runner is node scripts/run-all-tests.js; the new check is node tests/check-coha-s6-error-bridge.js. The 7 real-Postgres tests (P1 to P7) run only when COHA_S6_TEST_DATABASE_URL is set and must print SKIPPED, never a pass, when it is not.
- New files: src/web-ui/routes/error-bridge.js, src/web-ui/modules/error-bridge-store.js, src/web-ui/modules/error-bridge-github.js. Do not change error-capture.js, posthog-config.js, posthog-server.js or routes/billing.js. Follow the /webhook/stripe route in server.js (around line 4237) as a pattern only.
- Injectable adapter rule (D37): the unwired stub MUST throw "Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use."; the handler must contain that throw and return 503; the implementation plan must list the production wiring in server.js as a separate task from the handler task; the wiring test (P6, P7) asserts an observable outcome against a local fake GitHub API.
- Shared secret compared with crypto.timingSafeEqual, guarding unequal lengths; request body capped at 16 KB and rejected before parsing; body must carry schema coha-s6/v1 and string fields only; the PostHog link must start with https://us.posthog.com/project/.
- Issue content is fixed fields only: title is the code (no newline, at most 120 characters); body holds first-seen time, environment, the PostHog link and a marker line with the PostHog issue id; label production-error. No message beyond the code, no stack, no other payload text.
- Act only on environment = production. Staging and a missing environment return 200 with no issue and no row, each with its own distinct log line; an unexpected value is treated as not production.
- Duplicate state: table production_error_issues with a unique PostHog issue id, status pending or created, claim window 2 minutes, takeover by one conditional update, marker search on GitHub before creating on takeover.
- Credentials: ERROR_BRIDGE_SECRET and ERROR_BRIDGE_GITHUB_TOKEN come from the environment; never log, print, write or commit them; tests use generated values and assert they never appear in any log line.
- Never send test traffic to the real GitHub or PostHog; tests use a local fake GitHub API and generated values only. Do not re-require server.js more than once in one test process; start it in a child process.
- Never touch workspace/incidents.json.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.
```
