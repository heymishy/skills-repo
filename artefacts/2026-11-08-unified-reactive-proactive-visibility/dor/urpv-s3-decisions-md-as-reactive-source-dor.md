## Definition of Ready: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "As a delivery engineer..." |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 2, AC2: 1, AC3: 2, AC4: 2 |
| H4 | Out-of-scope populated | ✅ | 3 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Reactive-work coverage on the surface" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 1, 2026-11-09 — 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | No AC-level gap. One NFR-level measurement gap exists (see H-NFR note and W5 below) — explicitly distinguished by the test plan itself as not an AC coverage gap |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream urpv-s1 declared; `schemaDepends: ["dorStatus"]`; field confirmed present in schema |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | `fetchRepoPath` reuse, `product/constraints.md` #9, ADR-025, prose-format tolerance note — all named; review Architecture compliance 5/5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | Test plan: no AC-level CSS-layout gap |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` present |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFR |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | Profile presence (story declares NFRs) | ✅ | Present |
| H-GOV | Approved By ≥1 named non-blank entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No new adapter — reuses existing `fetchRepoPath` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ⚠️ PASS-with-accepted-exception | `hasDesignSystemTrack: true`. Same `products.js` pre-existing debt as urpv-s2 (36 non-token colors, none introduced by this story) — RISK-ACCEPTed in `decisions.md` (2026-11-09). This story's own new rendering must use real tokens only. |

**All hard blocks PASS** (H-DESIGN with the logged pre-existing-debt exception). No BLOCKED state.

**H-NFR note (not a hard-block failure, but flagged for the record):** the feature's `nfr-profile.md` Gaps table records this story's `decisions.md` fetch-latency baseline as due "Before urpv-s3 reaches /definition-of-ready." That measurement has not been performed — H-NFR itself only checks profile *existence*, which passes, but the gap's own stated due date has been reached without the measurement happening. See W5 below — this is handled as an acknowledged warning, not silently ignored.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ N/A | None exist | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second contributor exists to independently review | RISK-ACCEPT in `decisions.md` (2026-11-09, covering all 4 urpv stories) |
| W5 | No UNCERTAIN gap-table items left unaddressed | ⚠️ | `decisions.md` fetch-latency-at-scale has no real baseline measurement, and the NFR profile's own "Before urpv-s3 reaches /definition-of-ready" due date has passed without it happening. Proceeding without a threshold means a real production latency problem at scale would not be caught by any automated test — it would surface as a live page-load slowness report instead. | **Resolved — not acknowledged as an open risk.** A dedicated RISK-ACCEPT entry is logged in `decisions.md` (2026-11-09) that explicitly re-targets the measurement to "once this repo itself (a real multi-feature connected product) has synced through urpv-s1, measure actual `decisions.md` fetch latency against it before merging urpv-s3's PR" — i.e. the due date moves from "before DoR" to "before PR merge," with the obligation made concrete and checkable rather than left open-ended. |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Most load-bearing for this story: **shared shell / `escHtml()`** — this story renders new, externally-sourced text (`decisions.md` decision-title text) into the page, so `escHtml()` MUST be applied (directly matches this story's own NFR and MC-SEC-01 citation, and the test plan's dedicated XSS-escaping NFR test).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source — artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only, no new npm dependencies, per .github/standards/web-ui/web-ui-patterns.md
- ALL decisions.md-sourced text (decision-title, any other extracted field) MUST pass through escHtml() (src/web-ui/utils/html-shell.js) before rendering — never inject raw fetched content into the HTML response. This is a hard requirement, not a style preference (MC-SEC-01).
- Reuse fetchRepoPath (artefact-fetcher.js) exactly as already proven by decisions-log-writer.js — do not introduce a second GitHub-contents read path.
- The decisions.md fetch must use the same repoOwner/repoName/accessToken already resolved per-product, per-tenant (ADR-025) — never a cross-tenant read.
- BEFORE opening a PR for this story: measure real decisions.md fetch latency against this repo's own connected product data (post urpv-s1) and record the result in nfr-profile.md, replacing the [UNKNOWN BASELINE] entry. This is a merge-blocking action item, not optional — see decisions.md 2026-11-09 RISK-ACCEPT entry.
- Files out of scope: no other decisions.md entry-code parsing; no write path to decisions.md.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)

- Shared shell module: escHtml() MUST be applied to every user- or model-supplied (here: repo-supplied) string before injecting it into an HTML response body. Never re-implement escaping inline.
- Stack constraints: Node.js built-ins only, no Express, no new npm dependencies.
- Full file: .github/standards/web-ui/web-ui-patterns.md (read in full before implementing).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead-equivalent awareness only (Hamish King, Platform Owner)
**Signed off by:** Not required — share the DoR artefact for awareness before assigning
