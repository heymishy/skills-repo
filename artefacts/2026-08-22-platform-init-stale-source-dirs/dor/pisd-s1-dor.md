# Definition of Ready: Point platform-init.js at the real skills/ and templates/ source directories

**Story reference:** `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Test plan reference:** `artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md`
**Assessed by:** Copilot
**Date:** 2026-08-22

---

## Contract review

✅ **Contract review passed** — proposed implementation (see `pisd-s1-dor-contract.md`) aligns with all 6 ACs. No mismatches found between the proposed `COPY_DIRS` path correction and the story's stated ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator running `/bootstrap` (or `scripts/platform-init.js` directly) to onboard a new consumer repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4/AC6 have unit/integration tests; AC5 has a documented manual investigation scenario in the verification script |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions listed |
| H5 | Benefit linkage field references a named metric | ✅ | "Bootstrap correctness / new-consumer-repo onboarding success rate" |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track story — `/review` is skipped per CLAUDE.md's documented short-track definition |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC5's gap is explicitly documented in the test plan's Coverage Gaps table with a stated handling approach |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies block states "Upstream: None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated: "`scripts/platform-init.js`'s `COPY_DIRS` array... Checked against `.github/architecture-guardrails.md` — no conflicting guardrail found." No review ran (short-track), so no Category E findings exist to check |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No AC is CSS-layout-dependent — this story is CLI/filesystem tooling only |
| H-NFR | NFR profile exists, or story has explicit NFRs-None field | ✅ | Story's NFR section states "None identified" for Performance, Security, Accessibility, and Audit |
| H-NFR2 | Compliance NFR with regulatory clause has documented sign-off | ✅ N/A | No compliance NFRs in this story |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ N/A | No NFR profile required (NFRs are None) |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ N/A | Story's NFR section is effectively "None" — check skipped per its own trigger condition |
| H-GOV | Governance approval check (discovery `## Approved By`) | ✅ N/A | Short-track story — no discovery artefact exists (per CLAUDE.md's short-track definition, discovery is skipped) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This story introduces no injectable adapters (`setX()` functions) — it corrects two literal path constants |
| H-INF | Infra-plan gate check | ✅ N/A | `hasInfraTrack` not set on this story |
| H-MIG | Migration-review gate check | ✅ N/A | `hasMigrationTrack` not set on this story |

**All hard blocks pass — 11 evaluated, 0 failed (7 N/A given short-track scope and story shape).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Story states "None identified" for all four NFR categories |
| W2 | Scope stability is declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | — | No `/review` ran (short-track) |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | Unreviewed script may miss edge cases in the four scenarios or the AC5 investigation prompt | Operator — RISK-ACCEPT logged in `artefacts/2026-08-22-platform-init-stale-source-dirs/decisions.md`, 2026-08-22 |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | The one gap (AC5) has a clear, non-uncertain handling decision (manual investigation, resolved before DoD) |

---

## Standards injection

**Domain tags:** `[platform-tooling]`
**Matched standards files:** None

⚠️ Tag `platform-tooling` was not found in `.github/standards/index.yml` — no standards injected for that domain. (Checked keys: `api`, `auth`, `data`, `web-ui`, `payments`, `ui`, `security` — none match.)

---

## Oversight level

**Medium** — no parent epic (short-track, standalone story), so defaulting to Medium per this session's established precedent for short-track findings-driven fixes (`rbg-s1`, `lrtc-s1`). This story corrects the actual production installer used by every future `/bootstrap` run — warrants tech-lead awareness even though no named sign-off is strictly required.

> ⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Point platform-init.js at the real skills/ and templates/ source directories — artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md
Test plan: artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js only — no test framework beyond what's already used in
  tests/check-i1.2-platform-init-fetch.js (assert, execFileSync, fs, path, os).
  Configured test runner: `node scripts/run-all-tests.js` (glob-discovers
  tests/check-*.js).
- Fix scope: scripts/platform-init.js's COPY_DIRS array only. Do not touch
  src/adapters/skill-discovery.js's own default resolution (.github/skills/
  as the runtime default for a bootstrapped consumer repo) — that is
  explicitly out of scope (F15/csdg-s1's separate story).
- Before finalizing the fix, complete AC5's investigation: read
  `git log --follow -- .github/skills/infra-definition/SKILL.md` and run
  `git grep -n "infra-definition\|infra-plan\|infra-review\|schema-migration-plan\|schema-migration-review"`
  across the repo (excluding .github/skills and artefacts). Record the
  answer — dead leftover safe to ignore, still-depended-on, or must also be
  copied on bootstrap — in artefacts/2026-08-22-platform-init-stale-source-dirs/decisions.md
  as a new dated entry, BEFORE treating AC6's full-suite regression test as
  green. If the answer is "must also be copied," add a fourth COPY_DIRS
  entry (or equivalent merge) rather than silently dropping those 5 skills
  from bootstrap output.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs. No conflicting guardrail was
  found during DoR review.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (share with tech lead, no formal named sign-off required)
**Signed off by:** N/A — Medium oversight, awareness-only
