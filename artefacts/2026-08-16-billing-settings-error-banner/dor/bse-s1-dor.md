## Definition of Ready: Show a visible error banner on Settings when a billing-portal redirect carries an error

**Story reference:** artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
**Test plan reference:** artefacts/2026-08-16-billing-settings-error-banner/test-plans/bse-s1-test-plan.md
**Review artefact:** artefacts/2026-08-16-billing-settings-error-banner/review/bse-s1-review-1.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "any signed-in wuce user who hits a billing-portal error" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 (6 tests total) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 6 exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track substitute: a validated, root-caused defect from `beta-006.md` signal 10, same pattern as `tmss-s1`/`pcr-s1`/`nia-s1`/`bpe-s1`/`bcf-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating: 1, justified (small, mechanical, existing-pattern reuse) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | 0 gaps — all 4 ACs fully covered, no RISK-ACCEPT needed |
| H8-ext | Cross-story schema dependency check | ✅ | schemaDepends: none — `bpe-s1` is named as an upstream dependency only for the two literal error-code strings it produces (`no_billing_account`, `billing_unavailable`), verified directly against `billing.js`; there is no shared database schema, field, or data-shape dependency between the two stories |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated with real reasoning (established `req.query` convention verified against 3 other files; existing `opts.errorMessage` → banner pattern reused; explicit security design decision); review ran C/D only (short-track), no Category E findings |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Scanned all 4 ACs — none require rendering a page in a browser; every claim is a response-body string assertion (see test plan's E2E detection section). No RISK-ACCEPT needed under CLAUDE.md's B2 rule since there is no gap to classify. |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | `artefacts/2026-08-16-billing-settings-error-banner/nfr-profile.md` created |
| H-NFR2 | Compliance NFR with named clause has documented sign-off | ✅ | No compliance NFR named — not applicable |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence check | ✅ | Story NFR section has real content (Security is a primary driver, with a specific reflected-content-avoidance design, not boilerplate) → profile created and populated |
| H-GOV | Governance approval check | ✅ (N/A) | No `discovery.md` exists — short-track deliberately skips discovery. Treated as not-applicable per the `tmss-s1`/`pcr-s1`/`nia-s1`/`bcf-s1` precedent; recorded as an ASSUMPTION entry in `decisions.md` (citing precedent rather than re-deriving) |
| H-ADAPTER | Injectable adapter wiring check | ✅ (N/A) | No new adapter (`setX()`) introduced by this story |
| H-INF | Infra-plan gate check | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | ✅ (N/A) | `hasMigrationTrack` not set |
| B1/D1 | DoR contract does not exclude a file the test plan requires | ✅ | Only `src/web-ui/routes/settings.js` and the new test file are touched; both explicitly in-scope. `billing.js` is out-of-scope and has zero test assertions against it in this story's test plan — no conflict (see DoR contract's Contract Review). |

**Result: 17/17 hard blocks passed (5 not-applicable, explicitly recorded as such; no CSS-layout-dependent AC gap to classify; no B1/D1 contract/test-plan conflict).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM findings) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | RISK-ACCEPTed — see `decisions.md`, citing `tmss-s1`/`nia-s1`/`bcf-s1`'s identical rationale (solo-operator repo, no separate domain-expert role available) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — (no gaps at all — all 4 ACs fully covered) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Show a visible error banner on Settings when a billing-portal redirect carries an error — artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
Test plan: artefacts/2026-08-16-billing-settings-error-banner/test-plans/bse-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Modify ONLY `src/web-ui/routes/settings.js` and the new test file
  `tests/check-bse-s1-billing-settings-error-banner.js`.
- Re-verify the exact two error-code strings with a fresh
  `grep -n "settings?error=" src/web-ui/routes/billing.js` before
  implementing — do not trust the story text's copied strings alone.
- Use `req.query && req.query.error` to read the error code — this
  codebase's already-established convention (see `server.js:1913`,
  `billing.js:219`, `products.js:1334`). Do NOT hand-roll a second
  `req.url`/`URLSearchParams` parser inside `settings.js`.
- Map the error code through a small fixed allowlist dictionary to one of
  the two hardcoded messages. An unrecognized or absent value MUST produce
  no banner — never a generic fallback message, and never a reflection of
  the raw query value into the response body (security-critical; see NFR
  profile and AC3).
- Reuse the existing `.sw-credits-error` CSS class verbatim — do NOT add a
  new CSS rule to `_TAB_CSS`.
- Give the new banner `id="billing-error"` (distinct from Credits' existing
  `id="credits-error"`) and render it only inside the `#tab-panel-billing`
  block.
- Do NOT modify `renderCreditsTab`, the `#credits-error` element, its
  `hidden` default, or the `creditsJs` script — byte-for-byte unchanged
  (AC4).
- Do NOT modify `src/web-ui/routes/billing.js` or any file other than the
  two named above.
- Before editing, run `grep -rn "renderBillingTab" src/ tests/` to confirm
  all existing call sites still work with the new optional third
  parameter (default: no banner).
- Architecture standards: read `.github/standards/web-ui/web-ui-patterns.md`
  and `.github/architecture-guardrails.md` before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory
  constraints or Active ADRs.
- Run the full suite (`npm test`) after every task and compare against the
  fresh baseline established at branch-setup — any new failure beyond that
  baseline must be root-caused and fixed (or documented as a CORRECTION in
  `decisions.md`) before committing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator (Hamish King) requested and is directly reviewing this work in-session; scope is bounded to one file (plus its test), one existing pattern extended by one optional parameter, no new adapters, no new routes, no new data flows, no CSS-layout-dependent AC gap. (Complexity 1 reflects a small, mechanical extension of an already-proven pattern; the one substantive judgment call made during authoring — behaviour for an unrecognized error code — is resolved and documented with reasoning in the story's Out of Scope and `decisions.md`, not left open.)
