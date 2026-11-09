## Definition of Ready: Auto-sync a product's pipeline-state.json immediately on repo connection

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s1-auto-sync-on-repo-connect-test-plan.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | "As a delivery engineer... I want... So that..." |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 3 tests, AC2: 1, AC3: 1, AC4: 1 |
| H4 | Out-of-scope section populated | ✅ | 2 items named with rationale |
| H5 | Benefit linkage references a named metric | ✅ | "Reactive-work coverage on the surface" |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from review | ✅ | Run 1, 2026-11-09 — 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: "None" — all 4 ACs covered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 3 constraints named (ADR-025, no-new-adapter clarification, fire-and-forget pattern); review Architecture compliance score 5/5 |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC — test plan confirms backend-only, 0 gaps |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-unified-reactive-proactive-visibility/nfr-profile.md` |
| H-NFR2 | Compliance NFR with named clause has sign-off | ✅ N/A | NFR profile Compliance section: "None"; sign-off "Not required" checked |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ | Story has substantive NFR section; profile exists |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" — non-engineering role (M1 positive signal) |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new adapter introduced — reuses existing, already-wired `pipelineStateFetchAdapter` (epic Architecture constraints scan explicitly calls this out) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — this story is backend-only, no rendering change (per epic's own Architecture constraints scan) |

**All hard blocks PASS. No BLOCKED state.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Story: "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings exist for this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second contributor exists in this personal-scope project to independently review the verification script; the story author and reviewer are the same person | Acknowledged via RISK-ACCEPT — see `decisions.md` (2026-11-09, single entry covering all 4 urpv stories) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | Gap table: "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the Coding Agent Instructions block below. Most load-bearing for this story: the **session token canonical field name** rule (this story's own NFR already states `req.session.accessToken` is used — standards confirm this is the repo-wide rule, not a story-specific choice) and the **structured lifecycle log events** convention (relevant to the sync-failure logging in AC3).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Auto-sync a product's pipeline-state.json immediately on repo connection — artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s1-auto-sync-on-repo-connect-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only, raw http.createServer (no Express, no new npm dependencies) per .github/standards/web-ui/web-ui-patterns.md "Stack constraints"
- Use req.session.accessToken as the canonical field name — never req.session.token. DoR grep check: `grep -rn "req\.session\.token[^A]" src/web-ui/` must return zero results after this change.
- Sync failures logged via console.error/_posthog.captureException using JSON.stringify({event: ...}) structured format per "Structured lifecycle log events" — do not log the accessToken value.
- Files out of scope: no change to handlePostProductSync (manual Refresh) or its own behaviour; no scheduled/periodic resync mechanism.
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate ADR-025 (multi-tenancy — all calls stay productId/tenantId-scoped).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)

- Session token access: `req.session.accessToken` is canonical; never `req.session.token`.
- Structured lifecycle log events: use `console.log(JSON.stringify({event: 'snake_case_name', ...context}))`, never template literals; never log sensitive values (access tokens).
- Stack constraints: Node.js built-ins only, no Express, no new npm dependencies.
- Full file: .github/standards/web-ui/web-ui-patterns.md (read in full before implementing — this excerpt covers only the sections directly load-bearing for this story).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead-equivalent awareness only (Hamish King, Platform Owner, acting as this personal-scope project's own awareness checkpoint; no second engineering role exists)
**Signed off by:** Not required — share the DoR artefact for awareness before assigning, per Medium oversight
