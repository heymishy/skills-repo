# Definition of Ready Checklist

## Definition of Ready: Activate domain-tag standards injection at story authoring time

**Story reference:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Test plan reference:** artefacts/2026-07-18-domain-tag-activation/test-plans/dta-s1-test-plan.md
**Assessed by:** Claude (agent, autonomous, short-track)
**Date:** 2026-07-18

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | Standards-injection activation rate |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | References existing index.yml mechanism + ADR-026/027 |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-18-domain-tag-activation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry (2026-07-18)** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1`/`stis-s1`/`gav-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in never-before-exercised injection logic | **Acknowledged — proceed.** RISK-ACCEPT logged in `artefacts/2026-07-18-domain-tag-activation/decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap has an explicit manual-follow-up mitigation | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Activate domain-tag standards injection at story authoring time — artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
Test plan: artefacts/2026-07-18-domain-tag-activation/test-plans/dta-s1-test-plan.md
DoR contract: artefacts/2026-07-18-domain-tag-activation/dor/dta-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. First investigate whether
/definition-of-ready's existing "Standards injection" step (the one that
today prints "Story has no `domain` field — skipped silently" for every
story) already contains working domain-matching/injection logic that has
simply never been exercised, or whether that logic needs to be written from
scratch. Log which case it is in
artefacts/2026-07-18-domain-tag-activation/decisions.md before proceeding —
this materially changes the size of the remaining work.

Constraints:
- Read skills/definition/SKILL.md, skills/definition-of-ready/SKILL.md, and
  .github/standards/index.yml in full before writing anything.
- AC4 is a regression guard — the existing "no domain field" behaviour must
  be preserved byte-for-byte. Write U6/U7 first and confirm they pass
  against CURRENT (pre-change) behaviour before making any change, so you
  have a true baseline to regress against.
- Do not touch .github/standards/index.yml's domain taxonomy itself.
- Do not retroactively add a domain field to any of the 184 existing story
  artefacts across this repo — this story only changes behaviour for
  newly-authored stories going forward.
- IT1 must use a realistic fixture modelled on an actual past web-ui story
  (e.g. pr-s3 from the product-rollup epic) — not only a minimal synthetic
  fixture — to maximise the chance of catching a latent bug in logic that
  has never been exercised in this repo's history.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — this story activates an existing, already-designed mechanism (not introducing new architecture) and its blast radius is limited to future stories that opt in by setting a `domain` field; the AC4 regression guard specifically protects every story that doesn't.
**Sign-off required:** No
**Signed off by:** Hamish King (Founder/Operator) — requested this follow-up story directly via `/improve`, with full context of the gap already established, 2026-07-18
