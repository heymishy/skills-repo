# Definition of Ready: Wire tenant-level flag targeting via PostHog group analytics

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.4-tenant-level-targeting-test-plan.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.4-tenant-level-targeting-dor-contract.md
**Assessed by:** Copilot (definition-of-ready skill)
**Date:** 2026-07-10

---

## Contract Review

Contract Proposal checked against the story's 4 ACs and the test plan: no mismatches found. The proposed group-identification wiring, session-only `tenantId` sourcing, and no-special-casing-for-solo-tenants shape map directly onto AC1–AC4 and their unit/integration tests. No hard block from Contract Review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want a flag's state to be evaluated against the tenant..., So that every member of a tenant sees the same flag state..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 1 unit + 1 integration; AC2: 1 integration; AC3: 1 unit + 1 integration; AC4: 1 unit |
| H4 | Out-of-scope section is populated | ✅ | Per-team-member overrides; retroactive re-targeting |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 — Feature flags toggle without a redeploy |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 1 MEDIUM, 1 LOW. Outcome: PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan: "None. All 4 ACs are covered against a mocked PostHog adapter..." |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-025 cited and accurate — the story correctly ties the group key to the same `tenantId` used everywhere else (session, storage, rate limiting), matching ADR-025's application-layer tenant_id scoping definition exactly. D37 also correctly cited (group identification goes through S1.1's same adapter). Review Run 1: "Category E: no violations found (ADR-025 correctly and specifically cited)." |
| H-E2E | CSS-layout-dependent AC with no E2E tooling and no RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC in this story |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` includes the group-identification ≤100ms row and the session-derived `tenantId` security row, both applying to bri-s1.4 |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | Not regulated |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal" checked |
| H-ADAPTER | Injectable adapter wired by this story (D37) | ✅ (with forward note) | (a) No story AC explicitly scopes the real `posthog.group()` wiring into the production bootstrap flow as its own verified task — added explicitly to this DoR's Coding Agent Instructions below to satisfy D37 rule 2 at the DoR level. (b) No new adapter/default stub introduced — group identification goes through S1.1's existing adapter; the stub-throws behaviour is inherited, not restated (correctly, nothing new to restate). (c) Whether `/implementation-plan` names the group-identification wiring as a task distinct from the core targeting-logic task cannot be verified yet — forward requirement, not a block. |

**Hard block result: all PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs are identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 1 logged **1-M1**: Benefit Linkage misattributes its source — the phrase "'Consistent across all users in a tenant' is the AC discovery names for this metric" does not actually appear in discovery.md or benefit-metric.md; it originates in the epic's own Goal statement. This citation error is **not logged in `decisions.md`**. Risk: low — a future reader tracing the requirement back to discovery would not find the phrase there. Recommend correcting the citation to reference the epic, or a `/decisions` RISK-ACCEPT entry as a citation-hygiene issue. | Not yet acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | `bri-s1.4-tenant-level-targeting-verification.md` has not yet been reviewed by a human domain expert. Standard posture for this solo-operator repo (W4 expected, not exceptional) — still logged per instruction. | Not yet acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's Coverage gaps: "None." | — |

Note (LOW, non-blocking): review Run 1 also logged **1-L1** — `benefit-metric.md`'s Metric Coverage Matrix lists this story under both Metric 2 and Metric 3, but Benefit Linkage only addresses Metric 2. LOW severity, noted here for completeness only, not a warning-table item.

---

## READY / BLOCKED Determination

**READY.** All hard blocks pass. Review Run 1's 1 MEDIUM finding (citation error, W3) remains unacknowledged in `decisions.md` — does not block, flagged for operator attention.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire tenant-level flag targeting via PostHog group analytics — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.4-tenant-level-targeting-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules, consistent with existing src/web-ui/ conventions. Wire
  group identification through S1.1's existing injectable adapter — do not
  create a second, parallel adapter mechanism.
- tenantId MUST be read only from req.session.tenantId, never req.body or
  req.query, per ADR-025. A dedicated test must prove this (see test plan's
  Security NFR test).
- D37 wiring requirement (added at DoR since not present as a story AC): the
  real posthog.group('tenant', tenantId) call wiring into the actual
  session-bootstrap flow (server.js / journey.js integration) is a task
  distinct from this story's core group-targeting logic implementation — do
  not conflate the two into a single task.
- Do not implement per-team-member overrides or retroactive re-targeting —
  both explicitly out of scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular ADR-025 and D37.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — Medium oversight requires engineering-lead awareness, not formal sign-off. Share this DoR artefact with the tech lead for visibility before dispatch.
**Signed off by:** Not required
