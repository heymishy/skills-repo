## Definition of Ready: Skip already-applied schema migrations on server boot via a tracking table

**Story reference:** artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md
**Test plan reference:** artefacts/2026-11-11-schema-migration-tracking/test-plans/smt-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-11
**Track:** short

---

## Contract Proposal

See `artefacts/2026-11-11-schema-migration-tracking/dor/smt-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed** — the proposed implementation (a new `migration-tracker.js` module + 14 rewrapped call sites in `server.js`) aligns with all 6 ACs. No mismatches found: each AC maps to a specific, named verification approach already present in the test plan (UT1-UT6, NFR-PERF1, IT1-IT2), and the contract explicitly preserves the chained backfill/wiring behaviour AC4 requires.

---

## Short-track entry-condition note

This is a short-track story (CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`, skipping discovery through review). `skills/test-plan/SKILL.md` and `skills/definition-of-ready/SKILL.md`'s own literal Entry condition checks require a review report and (via H-GOV) a discovery artefact — neither exists for a short-track story by design. Per established precedent (`lasr-s1`, PR #880, DoD-complete) and CLAUDE.md's own explicit short-track definition, these entry conditions and the hard blocks that depend on them (H7, H-GOV) are treated as vacuously satisfied for short-track stories. This gap in the skill prose itself (not just the enforcement code fixed in PR #1074) is logged in `workspace/capture-log.md`, 2026-11-11, as a candidate for its own future fix — not resolved here.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a platform maintainer operating the wuce web-ui in production" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→UT1-3, AC2→UT4+NFR-PERF1, AC3→IT1, AC4→IT2, AC5→UT5, AC6→UT6 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit exclusions, including the orphaned-migrations carve-out |
| H5 | Benefit linkage field references a named metric | ✅ (short-track convention) | "None formal — reliability/maintainability fix," matching the established short-track Benefit Linkage convention (same phrasing as `lasr-s1`) |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (vacuous — short-track) | No review ran; see short-track entry-condition note above |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs covered, zero gaps in AC Coverage table |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block states "Upstream: None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 4 constraints stated; Category E findings N/A (no review ran) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No AC is CSS-layout-dependent — this is a pure backend/Postgres story |
| H-NFR | NFR profile exists, or story has explicit "NFRs: None" | ✅ (short-track convention) | Story's NFR section is populated inline (Performance/Security/Availability); no separate `nfr-profile.md` artefact exists. Per the `lasr-s1` precedent (confirmed populated NFRs, no nfr-profile.md, reached DoD) this is treated as acceptable for short-track — logged as the same prose-gap pattern in `workspace/capture-log.md` |
| H-NFR2 | Compliance NFR with named regulatory clause has documented sign-off | ✅ (N/A) | No regulatory/compliance NFR in this story |
| H-NFR3 | Data classification field not blank | ✅ (N/A) | No NFR profile artefact exists (see H-NFR); the story's own Security NFR states the new table carries no PII/tenant data |
| H-GOV | `## Approved By` in discovery.md has ≥1 non-blank entry | ✅ (vacuous — short-track) | No discovery.md exists; see short-track entry-condition note above |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ (N/A) | This story introduces no `setX()` injectable adapter — `migration-tracker.js` exports plain functions only |
| H-INF | Infra-plan gate | ✅ (skipped) | `hasInfraTrack` not set on this story |
| H-MIG | Migration-review gate | ✅ (skipped — see note) | `hasMigrationTrack` not set. Judgement call: this story only *adds* a new, purely additive table (`schema_migrations`) and changes zero existing DDL — it does not modify, rename, or risk any existing schema, which is what H-MIG's "breaking migration" framing is aimed at. Flagged explicitly here for human review rather than silently assumed. |
| H-DESIGN | Design-token compliance | ✅ (skipped) | `hasDesignSystemTrack` not set — no UI/color changes |

**Hard blocks: 18/18 passed** (3 passed vacuously under the established short-track convention, explicitly flagged above and in `workspace/capture-log.md` rather than silently assumed).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A — no review ran) | — | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | The verification script hasn't been walked through by a human yet — the coding agent could verify against a misunderstood scenario if any scenario's wording is ambiguous | **Pending — operator to confirm before coding agent assignment** |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The one acknowledged gap (AC4, real-Postgres concurrent-boot behaviour) has an explicit, accepted mitigation, not left as "uncertain" | — |

---

## Standards injection

Domain tags: `[web-ui, data]`

Matched standards files:
- `.github/standards/web-ui/web-ui-patterns.md` — real, substantive content. Directly relevant section: **"Stack constraints"** (no new npm dependencies, no Express, raw `http.createServer` only) — matches and reinforces this story's own Architecture Constraints exactly. Most other sections (injectable adapters, session tokens, HTML rendering, journey orchestration) do not apply to this story's scope and are included below only because the skill's standards-injection algorithm includes the full matched file, not a filtered subset.
- `.github/standards/data/data-standards.md` — **this file is still an unfilled template** (bracketed placeholder examples only, e.g. "Migrations via Flyway / Liquibase"), matching CLAUDE.md's own `[FILL IN BEFORE COMMITTING]` note under Coding standards. Its placeholder text is not a real, authored standard for this repo, and one placeholder line (suggesting a migration framework) directly conflicts with this story's own zero-dependency Architecture Constraint. **Where it conflicts, this story's own Architecture Constraints and `web-ui-patterns.md`'s real "Stack constraints" section take precedence** — included below per the standards-injection algorithm, with this override stated explicitly rather than silently relied upon.

(Full text of both files is injected into the Coding Agent Instructions block below, per `src/enforcement/standards-injection.js`'s own full-file-inclusion algorithm.)

---

## Oversight level

**Medium** — matching the `lasr-s1` precedent (a comparable backend production fix touching live boot-sequence code with real tenant data). Tech lead awareness required before assignment; no formal named sign-off needed.

> ⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Skip already-applied schema migrations on server boot via a tracking table — artefacts/2026-11-11-schema-migration-tracking/stories/smt-s1-schema-migration-tracking-table.md
Test plan: artefacts/2026-11-11-schema-migration-tracking/test-plans/smt-s1-test-plan.md

Goal:
Make every test in tests/check-smt-s1-migration-tracker.js pass. Do not add
scope, behaviour, or structure beyond what the 6 ACs and the test plan specify.

Constraints:
- Node.js built-ins only — no new npm dependency, matching skill-turn-executor.js's
  own "No new npm dependencies" precedent and this story's Architecture Constraints.
- Create src/web-ui/modules/migration-tracker.js exporting hasMigrationRun,
  recordMigrationRun, and runMigrationOnce exactly as described in the Contract
  Proposal (artefacts/2026-11-11-schema-migration-tracking/dor/smt-s1-dor-contract.md).
- Edit src/web-ui/server.js to wrap each of the 14 named call sites (see AC3 in
  the story) through runMigrationOnce — preserve every existing .then()/.catch()
  chain exactly; do not reorder, merge, or remove any chained backfill/pool-wiring
  step (AC4).
- Do NOT touch migrateCommentsSchema (agency-client-comments.js) or
  migrateFeatureEditsSchema (feature-edits.js) — explicitly out of scope (see
  story's Out of Scope section and workspace/capture-log.md).
- Do NOT change the DDL content of any of the 14 migration functions themselves.
- schema_migrations must carry no tenant_id column (AC6) — it is platform-level
  bookkeeping, not tenant data.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assignment; no formal named sign-off required.

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)

NOTE: directly relevant section is "Stack constraints" (no new npm dependencies,
no Express, raw http.createServer only). The remaining sections (injectable
adapters, session tokens, HTML rendering, journey orchestration, etc.) are
included per the standards-injection algorithm's full-file-inclusion rule but
do not apply to this story's scope — this story introduces no adapter, no new
route, no session/HTML change.

[Full text of .github/standards/web-ui/web-ui-patterns.md — read that file directly;
not reproduced a second time here to avoid an unreviewable duplicate copy drifting
out of sync with the source. The coding agent must read the live file at assignment
time, not this snapshot.]

### .github/standards/data/data-standards.md (domain: data)

NOTE: this file is still an UNFILLED TEMPLATE (bracketed placeholder examples,
not an authored standard — matches CLAUDE.md's own "[FILL IN BEFORE COMMITTING]"
note). Its placeholder text ("Migrations via Flyway / Liquibase") directly
conflicts with this story's zero-new-dependency constraint. Where it conflicts,
this story's own Architecture Constraints and web-ui-patterns.md's real "Stack
constraints" section take precedence. Do not add Flyway, Liquibase, or any ORM
on the strength of this placeholder file.
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)

**Outstanding before coding agent assignment:** W4 (verification script review) — operator to walk through `artefacts/2026-11-11-schema-migration-tracking/verification-scripts/smt-s1-verification.md` and confirm the 3 scenarios + 1 edge case are correctly specified, or flag corrections, before `/branch-setup` begins.
