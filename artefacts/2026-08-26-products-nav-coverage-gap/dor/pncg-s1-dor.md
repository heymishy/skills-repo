# Definition of Ready: pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it

**Story reference:** `artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md`
**Test plan reference:** `artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-26
**Track:** Short-track (found while investigating a live operator report on `/org/kanban`; a full-codebase audit surfaced 21 more instances of the same defect)

---

## Contract review

Contract Proposal reviewed against pncg-s1's 4 ACs and the test plan (`artefacts/2026-08-26-products-nav-coverage-gap/dor/pncg-s1-dor-contract.md`): every AC maps to at least one test (structural, unit, or integration), no AC requires E2E/CSS-layout verification, and every proposed touch point is named in the story's Architecture Constraints. **✅ Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As any signed-in `wuce` user, on any page in the app" — role-based persona, same convention accepted for `bvnd-s1`/`fresc-s1` |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 3 unit; AC2: structural (all 22) + 4 integration; AC3: structural + 2 integration; AC4: existing per-page suites + full suite, explicitly named in the test plan |
| H4 | Out-of-scope section is populated | ✅ | 5 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-06-29-beta-entry-experience` (M1 activation) |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track skips discovery-through-review per `CLAUDE.md`'s routing table. Same treatment as `fresc-s1`'s DoR. |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section explicitly acknowledges a depth trade-off (15/22 sites covered only structurally, not also functionally) — not an absence of coverage, satisfies H8's "or gaps explicitly acknowledged" clause |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies field is "None" |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Detailed constraints in story (helper placement/circular-dependency reasoning, pool-threading requirement, activeProductId handling); no architecture-guardrails.md ADR concerns this file's routing/shell conventions |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent — confirmed in test plan |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section reads "NFRs: None — reviewed 2026-08-26" |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR named |
| H-NFR3 | Data classification field blank check | ✅ N/A | No NFR profile exists (not required) |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ N/A | Story's NFR section is explicit "None" |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact exists — short-track deliberately skips discovery. Same reasoning as `fresc-s1`'s DoR. |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced — this is DB-pool parameter threading, not a D37-style external/model-call adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 17/17.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No `/review` was run (short-track) | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | Given this story's larger blast radius (22 pages, 10 files, 6 handlers gaining a new `pool` parameter) versus `fresc-s1`, this warning was surfaced with elevated framing before the operator's decision, not defaulted to "recommended: proceed" | Hamish King (operator) — "Acknowledge and proceed" after being shown the elevated-risk framing; RISK-ACCEPT logged in `decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's gap-table entries are both explicitly explained (depth trade-off; per-file pool-mechanism uncertainty resolved by making the structural test's assertion outcome-based rather than mechanism-specific) — not left as open "UNCERTAIN" items | N/A — satisfied |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `artefacts/2026-08-26-products-nav-coverage-gap/decisions.md`.

---

## Oversight level

**Medium** — consistent with this repo's short-track precedent. Given the larger surface area than `fresc-s1`, the W4 decision was deliberately elevated (asked with explicit risk framing rather than defaulting silently) rather than escalating the whole story's oversight level to High — the operator's own explicit "Acknowledge and proceed" on that specific, flagged risk satisfies Medium's "share the DoR artefact, confirm you'll do this" requirement, since the operator is reviewing this artefact directly and made the elevated-risk call themselves.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Unlike `fresc-s1` (where only a small fraction of this file applied), most of the following sections are directly relevant here, since this story is specifically about the shared shell/nav mechanism itself:

**Applicable excerpts (from `.github/standards/web-ui/web-ui-patterns.md`):**

> **Shared shell module (line 84-95):** `src/web-ui/utils/html-shell.js` is the single canonical source for `renderShell()` and `escHtml()`. Every HTML route view must use both — never re-implement or duplicate. *(Directly governs this story's own new `renderShellWithNav` helper: it must call the real `renderShell()`, not reimplement any of its markup — confirmed as the design in the Contract Proposal.)*
>
> **Stack constraints (line 76-82):** No new npm dependencies — Node.js built-ins only. No Express — raw `http.createServer` only. All session state via `req.session.*`. *(This story adds zero dependencies and does not touch session/auth mechanics — only DB-pool parameter threading and a new same-file helper function.)*
>
> **HTML render function unit test pattern (line 99-117):** Assert on specific string fragments, never full-HTML snapshot equality. Minimum coverage per render function: happy path, XSS injection, empty/null data. *(This story's unit tests for `renderShellWithNav` follow this pattern — fragment assertions on `sw-product-nav-list` presence, not snapshots. XSS/escaping coverage is inherited from `renderShell`'s and `getProductsNavSummary`'s own existing, unchanged escaping — this story does not introduce any new unescaped interpolation.)*

The remaining sections of this file (injectable adapter pattern, session token access, silent fallback three-path coverage, progress display invariant, COPILOT_HOME isolation, skill name allowlist, wave sequencing, model turn history, multi-skill journey orchestration, disk canonicity, structured lifecycle log events, path traversal guard, artefact signal protocol, journey state GET response shape, blended aggregation) are not implicated — this story introduces no adapter, no session-field change, no disk write, no new API contract.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: pncg-s1 — Wrap the Products-nav fetch in a shared helper and wire it to every page that's currently missing it
  — artefacts/2026-08-26-products-nav-coverage-gap/stories/pncg-s1-shared-nav-wrapper-and-full-coverage.md
Test plan: artefacts/2026-08-26-products-nav-coverage-gap/test-plans/pncg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order (recommended, not mandatory — adjust if a different sequencing
proves cleaner once you're in the code, but keep the shared helper first):
1. Add renderShellWithNav(pool, tenantId, opts) to src/web-ui/routes/products.js,
   export it. Write and pass its 3 unit tests first (TDD) before touching any
   call site.
2. Wire products.js's own 5 call sites (all already have `pool` available) --
   the lowest-risk subset, since no signature/server.js changes are needed.
3. Wire journey.js's 6 handlers, threading `pool` through each handler's
   signature and its server.js call site (mirror handleGetJourney(req, res,
   _next, pool) exactly).
4. Wire settings.js and team-management.js (pool already available via their
   createXHandlers(pool) factory closures -- no signature change needed for
   these two, just the call-site swap).
5. Wire the remaining 5 files (admin-credits.js, admin-mock-gateway.js,
   artefact.js, billing.js, features.js) -- determine and apply the right
   pool-threading mechanism per file (none showed an existing pattern;
   default to direct-parameter threading matching journey.js's fix unless
   the file's own existing conventions suggest otherwise).
6. Write the structural test (everyConfirmedSiteCallsRenderShellWithNav) and
   the 4 functional integration tests.
7. Re-run every one of the 22 pages' own pre-existing test files individually
   to confirm zero regressions, then run the full suite.

Constraints:
- No new npm dependencies, no Express -- matches this repo's raw
  http.createServer conventions (see Applicable standards above).
- renderShellWithNav must call the real renderShell() -- never reimplement
  or duplicate its markup (Shared shell module standard, above).
- Do not touch any renderShell call site NOT in the story's 22-site list --
  including the 3 already-correct sites and every error/redirect/fragment
  render found during the audit.
- Do not change renderShell's own signature or html-shell.js's
  Products-section logic -- only add new callers of the existing logic.
- Do not attempt to optimise or cache getProductsNavSummary's query cost --
  explicitly out of scope per the story's NFR section.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests (e.g. a
  6th file's pool-access mechanism genuinely doesn't fit the
  direct-parameter or factory-closure pattern): add a PR comment describing
  the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed this DoR run directly, and made the elevated-risk W4 call explicitly)
**Signed off by:** Claude (agent), on explicit operator direction ("Yes please" — write up the story and take through /test-plan; "Yes please" — proceed to /definition-of-ready)
**Date:** 2026-08-26
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged (RISK-ACCEPT logged for W4)
