# Definition of Ready: Build the isEnabled() flag helper shared by API and UI

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.1-isenabled-helper-test-plan.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s1.1-isenabled-helper-dor-contract.md
**Assessed by:** Copilot (definition-of-ready skill)
**Date:** 2026-07-10

---

## Contract Review

Contract Proposal checked against the story's 4 ACs and the test plan: no mismatches found. The proposed module shape (`isEnabled`/`setPostHogFlagsAdapter`/stub-throws default) maps directly onto AC1–AC4 and the unit/integration tests in the test plan. No hard block from Contract Review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator), I want a single isEnabled(flagKey, context) helper..., So that flag state can never diverge..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2 unit; AC2: 1 unit; AC3: 1 integration; AC4: 1 unit |
| H4 | Out-of-scope section is populated | ✅ | Caching/memoization; percentage/multivariate values |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 — Feature flags toggle without a redeploy |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1 (2026-07-09): 0 HIGH, 1 MEDIUM, 0 LOW. Outcome: PASS |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Test plan's own "Coverage gaps" section: "None." |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | D37 (injectable adapter rule) cited and matches the canonical D37 wording (stub throws, real client wired in server.js as a separate task); zero-new-npm-dependencies relaxation cited accurately. Review Run 1: "Category E: no violations found (D37 correctly invoked)." |
| H-E2E | CSS-layout-dependent AC with no E2E tooling and no RISK-ACCEPT | ✅ (N/A) | No CSS-layout-dependent AC in this story — this is a server-side/shared helper, not a rendered element |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` exists and includes a dedicated row for `isEnabled()` latency (≤200ms) applying to bri-s1.1 |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | No regulated compliance NFRs apply to this feature (`context.yml` confirms not regulated) |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | NFR profile Security section: "Data classification: [x] Internal" |
| H-ADAPTER | Injectable adapter introduced by this story (D37) | ✅ (with forward note) | (b) Stub-throws pattern **is** stated in Architecture Constraints, matching D37 exactly. (a) No story AC explicitly scopes the real `server.js` wiring — since D37 requires the **DoR**, not necessarily the story, to carry this AC, it is added explicitly in this DoR's Coding Agent Instructions below to satisfy D37 rule 2. (c) Whether `/implementation-plan` names the wiring as a separate task cannot be verified yet (that skill hasn't run) — flagged as a forward requirement, not a block, per the task's own instruction. |

**Hard block result: all PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs are identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 1 logged **1-M1**: AC3's parenthetical ("same underlying function, not two separate implementations") mixes an implementation assertion into an observable-behaviour AC. This has **not** been logged in `decisions.md`. Risk: a future reviewer could misread AC3 as prescribing implementation rather than behaviour. Not resolved by this DoR pass (DoR cannot resolve warnings) — recommend either a quick AC3 rewrite or a `/decisions` RISK-ACCEPT entry before or shortly after implementation begins. | Not yet acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | `bri-s1.1-isenabled-helper-verification.md` has not yet been reviewed by a human domain expert (no reviewer name/date filled in). Risk: the coding agent's own verification pass may miss an edge case a human would have caught. Standard posture for this solo-operator repo per `.github/architecture-guardrails.md` "Operating Posture" (W4 is expected, not exceptional, in this context) — still logged here per instruction. | Not yet acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's Coverage gaps table: "None." No gap rows exist at all for this story, let alone UNCERTAIN ones. | — |

---

## READY / BLOCKED Determination

**READY.** All hard blocks pass. H-ADAPTER's (a) gap (no story-level AC for production wiring) is addressed at the DoR level per the note above and carried into the Coding Agent Instructions as an explicit constraint, consistent with D37's requirement that the DoR (not necessarily the story) states this. W3 and W4 are open warnings that do not block — noted for operator awareness.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the isEnabled() flag helper shared by API and UI — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.1-isenabled-helper-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CommonJS modules, consistent with existing src/web-ui/ conventions.
- New module: src/web-ui/modules/posthog-flags.js only. Do not modify server.js
  in this task — the real posthog-node client construction and
  setPostHogFlagsAdapter() wiring into server.js is D37's separate wiring task,
  out of scope for this handler task. (This is the explicit production-wiring
  requirement D37 mandates the DoR record, since the story itself does not
  carry it as a numbered AC.)
- Do not implement caching/memoization or percentage/multivariate flag values —
  both explicitly out of scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing, in particular D37 (injectable adapter rule, cited in this
  story's Architecture Constraints). Do not introduce a silent-stub default —
  the stub MUST throw the exact documented message.
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
