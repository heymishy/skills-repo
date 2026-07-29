# Definition of Done: Activate domain-tag standards injection at story authoring time

**PR:** https://github.com/heymishy/skills-repo/pull/636 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Test plan:** artefacts/2026-07-18-domain-tag-activation/test-plans/dta-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-18-domain-tag-activation/dor/dta-s1-dor.md
**Assessed by:** Copilot (autonomous)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `skills/definition/SKILL.md` (merged, on master) adds a domain-tag prompt step that reads `index.yml` keys dynamically, not a hardcoded list | Automated test (`node tests/check-dta-s1-domain-tag-activation.js`, U1-U2), re-run against merged master | None |
| AC2 | ✅ | `matchDomainsToStandards()`/`buildStandardsInjectionBlock()` resolve a single domain and inject the full file content, including the blended-aggregation rule text confirmed genuinely reachable | Automated test (U3-U4, IT1), re-run against merged master | None |
| AC3 | ✅ | Multiple domains (`web-ui`, `security`) both resolve and inject, each clearly attributed | Automated test (U5, IT2), re-run against merged master | None |
| AC4 | ✅ | `skills/definition-of-ready/SKILL.md` still contains the exact byte-for-byte "Story has no `domain` field — skipped silently." message; `matchDomainsToStandards([])`/`buildStandardsInjectionBlock([])` return the no-domain-field sentinel/`null` | Automated test (U6-U7), re-run against merged master | None |
| AC5 | ✅ | A typo'd domain (`web-uis`) surfaces a distinct warning naming the exact tag, never conflated with the no-domain-field message; a valid domain among a typo still resolves; whitespace/case variants normalise correctly | Automated test (U8-U10), re-run against merged master | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One deviation, already logged in `decisions.md` at implementation time and reaffirmed here: this story was scoped at DoR time (Complexity 2, Stable) on the assumption that the domain-matching/injection logic already existed as code and just needed confirming/fixing. Investigation found it was pure SKILL.md prose with no backing implementation at all — the operator's own pre-logged RISK-ACCEPT entry (2026-07-18) explicitly named this exact contingency in its "Revisit trigger" and pre-authorised proceeding without a fresh formal review, which is what happened. The resulting implementation is larger than a pure "activation" (a new `src/enforcement/standards-injection.js` module, not just a SKILL.md text tweak) but stays within the story's original 5 ACs and Out of Scope boundaries — no scope crept beyond what AC1-AC5 already specified.

No other scope deviations. `.github/standards/index.yml`'s domain taxonomy was not modified; no `domain` field was made mandatory; no historical stories were retroactively tagged — all confirmed untouched, matching the story's Out of Scope section.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12 (10 unit + 2 integration, several implemented as multiple assertions — 24 total)
**Tests passing in CI:** 12 / 12 (24 / 24 individual assertions)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1-U2 (AC1) | ✅ | ✅ | Re-run against merged master code today |
| U3-U5 (AC2/AC3) | ✅ | ✅ | Re-run against merged master code today |
| U4, IT1 (AC2) | ✅ | ✅ | Re-run against merged master code today |
| IT2 (AC3) | ✅ | ✅ | Re-run against merged master code today |
| U6-U7 (AC4) | ✅ | ✅ | Re-run against merged master code today |
| U8-U10 (AC5) | ✅ | ✅ | Re-run against merged master code today |

**Gaps (tests not implemented):** One, already documented in the test plan's own Coverage gaps table: whether a future `/definition` session actually follows the new domain-tag prompt in practice is untestable by an automated suite (a behavioural outcome of a future agent session, not this code). Tracked as a manual follow-up — confirm at the next real `/definition` run for a story that clearly touches a listed domain.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Audit — DoR artefact records which domain(s) matched and which files were injected | ✅ | Confirmed via U4/U5/IT1/IT2: `buildStandardsInjectionBlock()`'s output clearly attributes each included file to its source path and matched domain, and each unmatched tag to a named warning |

No other NFRs identified — confirmed with story owner at DoR time.

---

## Metric Signal

No metrics array entries reference this story (`2026-07-18-domain-tag-activation` has an empty `metrics: []` in `pipeline-state.json`). The story's Benefit Linkage section states the metric directly — "standards-injection activation rate: the fraction of newly-authored stories whose matching domain standards actually reach the coding-agent instructions, versus silently skipped." Baseline was 0/184 (mechanism never exercised); this story makes the mechanism genuinely functional and tested for the first time. First real measurement of the *rate* (not just capability) requires observing future story-authoring sessions — tracked as the same manual follow-up named in Test Plan Coverage above, not a separate metric action.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. One informal, already-named follow-up: confirm at the next real `/definition` run for a domain-matching story that the new prompt is actually followed and that injection produces a usable Coding Agent Instructions block in practice — log the outcome in this feature's `decisions.md` when it happens (per the test plan's own Coverage gaps table).

---

## DoD Observations

1. This is the second story this session (after `gav-s1`) where a DoR-time assumption ("this mechanism already exists, just needs confirming") turned out to be false on investigation, and both times the pre-logged decisions.md RISK-ACCEPT/revisit-trigger entries correctly anticipated the possibility and pre-authorised proceeding rather than blocking. Worth noting as a validated pattern: naming a specific "what if the assumption is wrong" contingency at DoR time, with pre-authorisation to proceed under it, let both stories move straight to implementation without a context-switching pause for fresh sign-off — while still producing a clear, logged decision trail rather than silently reinterpreting scope.
2. `src/enforcement/standards-injection.js` and `src/enforcement/cli-outer-loop.js` (gav-s1) now share the same architectural shape: a documented-but-previously-unenforced mechanism converted into a small, pure, tested module. A future `/improve` pass could note this as an emerging pattern worth naming explicitly (e.g. "convert prose-only pipeline mechanisms to tested code when first genuinely exercised") if a third instance of this shape appears.
