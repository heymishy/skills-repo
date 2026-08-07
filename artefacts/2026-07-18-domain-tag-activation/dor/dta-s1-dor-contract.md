# DoR Contract: Activate domain-tag standards injection at story authoring time

**Story reference:** artefacts/2026-07-18-domain-tag-activation/stories/dta-s1.md
**Test plan reference:** artefacts/2026-07-18-domain-tag-activation/test-plans/dta-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `skills/definition/SKILL.md`, add an instruction step (during story authoring) that reads `.github/standards/index.yml`'s domain keys and prompts the author to consider setting `domain: [...]` on the story when its scope clearly matches one or more existing domains (e.g. touches `src/web-ui/`, handles auth, touches payment code).
2. In `skills/definition-of-ready/SKILL.md` (or its underlying implementation, wherever the "Standards injection" step currently lives), confirm and — if needed — fix the existing domain-matching/injection logic so that a populated `domain` field on a story actually results in the matching standards file(s)' content being included in the Coding Agent Instructions block, with clear attribution of source file per included block.
3. Add a warning path for an unmatched domain value (typo or non-existent key) — surfaced distinctly from the existing "no domain field" message.
4. New test file `tests/check-dta-s1-*.js` covering all 10 unit tests + 2 integration tests from the test plan.

**What will NOT be built:**
- No retroactive tagging of any existing story artefact.
- No change to `.github/standards/index.yml`'s domain taxonomy itself.
- No change making `domain` a mandatory DoR hard block.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | U1-U2 (SKILL.md mentions domain, doesn't hardcode a stale list) | unit |
| AC2 | U3-U4, IT1 (matching resolves path, content actually injected, real fixture end-to-end) | unit + integration |
| AC3 | U5, IT2 (multiple domains resolve and inject all) | unit + integration |
| AC4 | U6-U7 (regression: no-domain behaviour byte-for-byte preserved) | unit |
| AC5 | U8-U10 (unmatched domain warns distinctly, partial-match still injects valid ones, case/whitespace handling) | unit |

**Assumptions:**
- The domain-matching logic described in `index.yml`'s own header comment ("When a story has a domain tag matching a key here, `/definition-of-ready` will include all standards files for that domain") already exists somewhere in the DoR implementation, given the DoR artefacts for product-rollup's 7 stories explicitly print "Story has no `domain` field — skipped silently" (implying an `if (domain) {...} else {print skip message}` branch already exists) — this story's job is to confirm the `if` branch actually works, not necessarily to write it from scratch. If investigation finds the `if` branch doesn't exist at all, this becomes new logic rather than a fix, and the coding agent should log that finding in decisions.md before proceeding.
- Case/whitespace normalisation (U10) is an implementation choice left to the coding agent, as long as it's one deliberate behaviour (not a third silent failure mode) and is documented in the DoR artefact this story itself produces once implemented.

**Estimated touch points:**
Files: `skills/definition/SKILL.md`, `skills/definition-of-ready/SKILL.md` (or its implementation module, TBD by investigation), `tests/check-dta-s1-*.js` (new)
Services: None
APIs: None

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ built via a new `/definition` prompt step, verified by U1-U2 — ✅ aligned.
- AC2 ↔ built via confirming/fixing the existing injection logic, verified by U3-U4 + IT1 — ✅ aligned.
- AC3 ↔ built via the same logic extended to multiple domains, verified by U5 + IT2 — ✅ aligned.
- AC4 ↔ verified by explicit regression tests U6-U7 — ✅ aligned.
- AC5 ↔ built via a new warning path, verified by U8-U10 — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator authoring a new story via /definition" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Standards-injection activation rate, quantified 0/184 |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | References existing index.yml mechanism + ADR-026/027 pattern |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-18-domain-tag-activation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design, same precedent as `pcr-s1`/`stis-s1`/`gav-s1` |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass**, with the H-GOV note recorded transparently.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case in never-before-exercised injection logic | **Acknowledged — proceed.** Same rationale as prior precedent. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's one gap (AC1's real-world-adoption check) has an explicit manual-follow-up mitigation | — |
