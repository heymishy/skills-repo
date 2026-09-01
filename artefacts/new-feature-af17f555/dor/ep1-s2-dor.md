# Definition of Ready: ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population

**Feature:** Cross-Channel Feature Continuity (new-feature-af17f555)
**Story:** ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population
**Test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s2-test-plan.md
**Status:** SIGNED OFF
**Date:** 2026-09-01

---

## Contract Proposal → Contract Review

> ⚠️ **Contract revised 2026-09-02.** Investigation before `/implementation-plan` found the mechanism the original contract proposed to build already exists — see `dor/ep1-s2-dor-contract.md` for the revised contract and `decisions.md` for the full writeup. Original Contract Review below kept for the audit trail.

See `artefacts/new-feature-af17f555/dor/ep1-s2-dor-contract.md` for the full Contract Proposal (original + revised).

**Original contract review (superseded):** ✅ PASS — the proposed `resolveArtefacts(featureSlug, stage)` function directly implements the two ACs (single-file resolution without trusting a singular `*Artefact` field; multi-file resolution enumerating every file found), matches the revised `design.md` Component 2, and matches what `darc-s1` (PR #807, merged) actually writes on the other side of this same gap. No mismatch found.

**Revised contract review (2026-09-02):** ✅ PASS — the 2-item `_KEY_DIRS` addition directly closes the one confirmed gap (AC2's `epics/*.md` case) plus one adjacent related gap (`dor/`), without duplicating the already-working `stories/`/`review/`/`test-plans/` mechanism. No mismatch found.

---

## Hard Blocks Summary

| # | Check | Result |
|---|-------|--------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS |
| H2 | At least 3 ACs in Given / When / Then format | ⚠️ PASS (2 ACs present — up from 1 at review time, split by the 2026-09-01 design revision; design spec + test plan compensate, same mitigation as ep1-s1/ep1-s3–s6) |
| H3 | Every AC has test coverage in test plan | ✅ PASS (13 tests: 7 unit, 2 integration, 1 NFR — covering AC1 and AC2) |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS (Metric 3: Feature Continuity — Handoff Context Load Success, `benefit-metric.md`) |
| H6 | Complexity rated | ✅ PASS (Complexity: 2) |
| H7 | No unresolved HIGH findings from review | ✅ PASS (0 HIGH, 0 MEDIUM, 1 LOW-mitigated — `review/ep1-s2-review-1.md`) |
| H8 | Test plan has no uncovered ACs | ✅ PASS (both ACs covered; no gaps) |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies field lists `ep1-s1` (an implementation-order dependency: this story's API selection flow builds on ep1-s1's `/api/features`), and this story's own logic reads pipeline-state.json's `stage` field. `schemaDepends: [stage]` — confirmed present in `pipeline-state.schema.json` feature-level properties. |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS (ADR-023 referenced — both Active in `.github/architecture-guardrails.md`) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ PASS — not applicable; no AC in this story is CSS-layout-dependent (pure server-side artefact resolution) |
| H-NFR | NFR profile or explicit story NFR field | ✅ PASS (NFRs embedded in story; no separate profile required — matches ep1-s1 precedent) |
| H-NFR2 | Compliance sign-off | ✅ PASS (no compliance NFRs; not applicable) |
| H-NFR3 | Data classification | ✅ PASS (synthetic test data only) |
| H-NFR-profile | NFR profile presence | ✅ PASS (story NFR field populated, not "None" — no separate profile required per H-NFR-profile's own skip condition when NFRs are inline) |
| H-GOV | Approved By section | ✅ PASS (discovery.md's Approved By — same basis as ep1-s1) |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (no new injectable adapters introduced by this story) |
| H-INF | Infra-plan check | ✅ PASS (hasInfraTrack: false) |
| H-MIG | Migration-review check | ✅ PASS (hasMigrationTrack: false) |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated or explicitly "None" | ✅ ACKNOWLEDGED (populated) |
| W2 | Scope stability declared | ✅ ACKNOWLEDGED (Stable) |
| W3 | MEDIUM review findings | ✅ NOT APPLICABLE (none) |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED — not yet reviewed by a second person; operator (Hamish King) is both platform owner and sole reviewer in this dogfooding context. Logged as RISK-ACCEPT — see note below. |
| W5 | No UNCERTAIN gap-table items | ✅ ACKNOWLEDGED ("None" gap table) |

**RISK-ACCEPT (W4):** Verification script has not been reviewed by a domain expert distinct from the operator who wrote it. Accepted because this feature is a solo-operator dogfooding session on internal platform tooling with no external/regulated impact — same basis as W4 handling on other single-operator stories in this repo. Should be logged to `decisions.md` if one is created for this feature; none currently exists (no architectural-choice trigger per this repo's `decisions.md` mandatory rule — this story does not introduce a new architectural decision, it implements a decision already recorded in `design.md`'s Revision Log).

---

## Oversight Level

**Epic-declared oversight:** Medium (`epics/cross-channel-feature-continuity.md`)

**Note on discrepancy:** ep1-s1's own DoR (production, 2026-05-16) recorded "Oversight: LOW" rather than checking the epic's Medium field as the SKILL.md instructs. Rather than silently repeat that inconsistency or silently override the already-signed-off ep1-s1 record, this DoR follows the SKILL.md instruction literally for this and all subsequently-run DoRs in this epic (ep1-s3 through ep1-s6): **Medium**.

**Medium oversight action:** Tech lead awareness required. In this solo-operator dogfooding context, the operator (Hamish King) is both platform owner and de facto tech lead — self-acknowledged awareness of this DoR artefact before assigning to the coding agent. Confirmed via this session's explicit instruction to proceed through DoR for the whole feature.

---

## Standards Injection

Story has no `domain` field specified. Standards injection skipped.

---

## Coding Agent Instructions

> ⚠️ Superseded 2026-09-02 — kept for the audit trail. See revised instructions below, matching the revised contract at `dor/ep1-s2-dor-contract.md`.

```
[SUPERSEDED 2026-09-01 VERSION]
You will build a resolveArtefacts(featureSlug, stage) function...
-- Superseded: this mechanism already existed. Do not build it. See below.
```

### Revised Coding Agent Instructions (2026-09-02)

```
STORY: ep1-s2 — Artefact Resolution and HANDOFF CONTEXT Population (revised scope)

ACCEPTANCE CRITERIA (unchanged from story, revised understanding of what's
needed to satisfy them):
AC1 -- single-file stages already resolve correctly via the existing
priorArtefacts mechanism -- no change needed, verify with a regression test.
AC2 -- multi-file stages (definition -> epics/*.md + stories/*.md; review ->
review/*-review-*.md) must have every file injected into HANDOFF CONTEXT --
already true for stories/ and review/ via the pre-existing _KEY_DIRS disk-scan
in buildSystemPrompt() (skills.js ~line 1946-1982); epics/ is the one
confirmed gap.

SCOPE BOUNDARIES:
- Do NOT build a new resolveArtefacts() function or module -- confirmed
  unnecessary, see decisions.md (2026-09-02)
- Do NOT change priorArtefacts' own population logic in journey.js
- Do NOT change how artefacts are written (darc-s1, already merged)

You will make a 2-item change to _KEY_DIRS in buildSystemPrompt()
(src/web-ui/routes/skills.js):
1. Add 'epics' -- closes this story's own confirmed AC2 gap
2. Add 'dor' -- adjacent gap found in the same investigation: the CLI-backfill
   flow (ep1-s3) produces a bogus flat definition-of-ready.md priorArtefacts
   entry with no real backstop, unlike test-plans (already covered)

IMPLEMENTATION TASKS:
1. Task 1: Add 'epics' and 'dor' to _KEY_DIRS
2. Task 2: Regression test -- stories/, review/, test-plans/,
   verification-scripts/ behaviour unchanged
3. Task 3: New test -- epics/*.md and dor/*.md files now appear in HANDOFF
   CONTEXT for a fixture feature that has them

VERIFICATION:
Run the test suite (revised test plan --
artefacts/new-feature-af17f555/test-plans/ep1-s2-test-plan.md, revised
2026-09-02).

NFR TARGETS:
- 100% of present, readable artefacts in _KEY_DIRS directories injected
- No regression to existing stories/review/test-plans/verification-scripts
  behaviour

ARCHITECTURE CONSTRAINTS (ADR-023):
- Disk is canonical source; read fresh on every session start (unchanged --
  this is what the existing mechanism already does)

STANDARDS:
No domain-specific standards injected for this story.

NEXT STORY:
ep1-s4 -- Stage-Based Skill Routing and Navigation (independent of this
story's change)
```

---

## Ready / Blocked

✅ **Definition of Ready: PROCEED** — All hard blocks pass. Warnings acknowledged (W4 RISK-ACCEPT, W1/W2/W5 clean). Coding agent instructions provided above.

**Oversight:** Medium — tech lead awareness self-acknowledged (see above).

**Inner Loop Sequence:**
1. /branch-setup — create isolated worktree
2. /implementation-plan — break into bite-sized tasks
3. /subagent-execution (recommended) or /tdd per task
4. /verify-completion — run full test suite + verification script
5. /branch-complete — open draft PR

After PR merge: run `/definition-of-done` to record delivery trace.

---

## DoR Sign-Off

**Signed Off:** 2026-09-01
**Oversight Level:** Medium
**Reviewer:** Definition-of-ready SKILL.md gate, run by Claude Code on behalf of Hamish King (Platform Owner)
**Status:** Ready for coding agent assignment (queued behind ep1-s1, whose worktree/inner loop this session is starting first)
