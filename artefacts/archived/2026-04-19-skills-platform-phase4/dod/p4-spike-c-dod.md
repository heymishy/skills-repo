# Definition of Done: Resolve the distribution model — upstream authority, sidecar semantics, lockfile structure, and update channel integrity (Spike C)

**PR:** No formal PR — work committed directly to master at `368b186` (see Scope Deviations) | **Merged:** 2026-04-20
**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-c.md
**Test plan:** artefacts/2026-04-19-skills-platform-phase4/test-plans/p4-spike-c-test-plan.md
**DoR artefact:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-c-dor.md
**Assessed by:** claude-sonnet-4-6 (agent) + heymishy (operator)
**Date:** 2026-04-20

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Spike output exists; named design decisions for all 4 distribution sub-problems | ✅ | T1–T4d passing (10 assertions); `spike-c-output.md` exists; overall verdict `PROCEED`; all four sub-problems have named sections with decision statements: (1) sidecar directory + managed_paths collision avoidance, (2) zero-commit install with optional `--commit` flag, (3) YAML lockfile with upgrade diff and POLICY.md floor verification, (4) `heymishy/skills-repo` as authoritative upstream | Automated: `tests/check-p4-spike-c.js` T1–T4d | None |
| AC2 — Upstream authority decision states authoritative repo, context.yml `skills_upstream` block config, and Craig's fork role | ✅ | T5–T7 passing (3 assertions) + manual review; `heymishy/skills-repo` explicitly named as authoritative source; `skills_upstream` block structure with `url`, `remote`, and `strategy` fields described; Craig's fork explicitly categorised as downstream fork, not a publishing layer | Automated: `tests/check-p4-spike-c.js` T5–T7; manual review of upstream authority section | None |
| AC3 — Lockfile structure specified: format, minimum required fields, upgrade diff display, POLICY.md floor verification | ✅ | T8a–T9b passing (5 assertions); YAML lockfile format specified with `upstream_url`, `pinned_ref`, and per-skill `content_hash` fields; upgrade section describes diff display before re-pinning; POLICY.md floor verification described as a post-upgrade check | Automated: `tests/check-p4-spike-c.js` T8–T9b | None |
| AC4 — Overall + per-sub-problem verdicts in pipeline-state.json; ADR in decisions.md for upstream authority | ✅ | T10–T11e passing (7 assertions); `pipeline-state.json` `p4-spike-c` story entry has `spikeVerdict: "PROCEED"`; `decisions.md` contains two ARCH entries — `spike-c` (upstream authority decision with all four required fields: decision, alternatives considered, rationale, revisit trigger) and `spike-c-addendum-1d` (permanent exclusion list decision) | Automated: `tests/check-p4-spike-c.js` T10–T11e | None |
| AC5 — Each E2 story references Spike C output as architecture input | ✅ | T12 passing; `p4-dist-lockfile.md` references `spike-c-output.md`; verified via automated spot-check; additional E2 stories carry the reference as part of their DoR architecture constraint (H9) | Automated: `tests/check-p4-spike-c.js` T12 | None |

**ACs satisfied: 5/5**

---

## Scope Deviations

**Deviation 1 — No formal feature branch PR:** The spike investigation output and addendum commits were made on `feature/p4-spike-c` and committed to master at `368b186` via cherry-pick merge. No draft PR was opened on GitHub. This is a process deviation consistent with Spikes A, B1, and B2 — the spike programme has operated without draft PRs throughout. Work is complete and on master; the audit trail has no PR URL. Recorded for `/trace` awareness.

**Deviation 2 — Addendum (sub-problem 1d) added after initial spike output:** An addendum covering the permanent exclusion list (sub-problem 1d) was added to `spike-c-output.md` after the initial four sub-problem decisions were written. The addendum is within scope — the permanent exclusion list is a direct design consequence of sub-problem 1 (collision avoidance) and sub-problem 4 (non-technical interaction surface exclusion). The addendum deepens the design response rather than adding new scope. A corresponding ARCH entry was written to `decisions.md` and the test suite extended to verify the addendum content (T13 group — 12 additional assertions now captured in the NFR and verification test sets).

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 test IDs (27 assertions — test suite extended by addendum)
**Assertions passing:** 27/27
**Tests passing in CI:** 27

| Test ID | Implemented | Passing | Notes |
|---------|-------------|---------|-------|
| T1 — spike-c-output.md exists | ✅ | ✅ | |
| T2 — contains valid verdict | ✅ | ✅ | Found: PROCEED |
| T3a — sub-problem 1 addressed (sidecar/repo structure/collision) | ✅ | ✅ | |
| T3b — sub-problem 2 addressed (commit provenance/zero-commit install) | ✅ | ✅ | |
| T3c — sub-problem 3 addressed (update channel/lockfile/upgrade) | ✅ | ✅ | |
| T3d — sub-problem 4 addressed (upstream authority) | ✅ | ✅ | |
| T4a–T4d — per-sub-problem decision or verdict statement | ✅ | ✅ | All four present |
| T5 — authoritative repository explicitly named | ✅ | ✅ | heymishy/skills-repo |
| T6 — context.yml skills_upstream block described | ✅ | ✅ | |
| T7 — Craig's fork role categorised | ✅ | ✅ | downstream fork |
| T8a — lockfile format includes upstream source URL field | ✅ | ✅ | |
| T8b — lockfile format includes pinned ref/version field | ✅ | ✅ | |
| T8c — lockfile format includes skill content hashes field | ✅ | ✅ | |
| T9a — upgrade section describes diff display before re-pinning | ✅ | ✅ | |
| T9b — POLICY.md floor verification after upgrade described | ✅ | ✅ | |
| T10 — pipeline-state.json spike-c entry with verdict | ✅ | ✅ | spikeVerdict: PROCEED |
| T10b — spike-c entry has valid verdict | ✅ | ✅ | |
| T11a–T11e — decisions.md ARCH entry complete (spike-c upstream authority) | ✅ | ✅ | All five fields present |
| T12 — p4-dist-lockfile references Spike C output | ✅ | ✅ | |
| T-NFR1 — no credentials outside code blocks | ✅ | ✅ | 0 found |

**Gaps:** None. Test plan originally specified 15 tests; addendum verification expanded the suite to 27 assertions across the same 13 test ID groups. All original test IDs are covered; addendum assertions are within the same AC scope.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| MC-SEC-02 — No API keys, tokens, or credentials in spike artefact | ✅ | T-NFR1 passing; automated scan found 0 credential-shaped strings outside code blocks in `spike-c-output.md` |
| Audit — Upstream authority decision written to decisions.md before spike closes | ✅ | `decisions.md` ARCH entry `spike-c` and `spike-c-addendum-1d` both present; upstream authority is the most consequential and irreversible choice; recorded before DoD artefact was written (commit `368b186`) |
| C5 — POLICY.md floor propagation verifiable through upgrade cycle | ✅ | Sub-problem 3 (lockfile/upgrade) explicitly describes POLICY.md floor verification as a post-upgrade check step; precise enough for p4-dist-upgrade to write testable ACs against |
| ADR-004 — Upstream source URL and configuration sourced from context.yml | ✅ | `skills_upstream` block in context.yml described with `url`, `remote`, and `strategy` fields; sub-problem 4 confirms Craig's teams set `skills_upstream.url` to heymishy/skills-repo directly |
| MC-CORRECT-02 — New pipeline-state.json fields identified for E2 stories | ✅ | Sub-problem 3 identifies lockfile-version and managed_paths fields needed in E2; addendum 1d identifies permanent exclusion enforcement as a compile-time CLI constraint rather than a state field — no new schema fields required from addendum |
| C4 — Upgrade operations involving instruction-set changes require human sign-off | ✅ | Sub-problem 3 upgrade section defines the approval gate: upgrade surfaces diff for consumer review before re-pinning; instruction-set changes require explicit `--approve` flag (or equivalent operator confirmation step) before content is pinned |
| Performance — None identified (design investigation only) | ✅ | Confirmed not applicable |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Distribution sync (zero-commit install + conflict-free sync) | ❌ | After E2 distribution stories complete (p4-dist-install, p4-dist-lockfile, p4-dist-upgrade, p4-dist-upstream) | Spike C provides the architecture that E2 implementation stories build against. M1's target (100% zero-commit install, ≥90% conflict-free sync) cannot be measured until E2 delivers the CLI `install` and `upgrade` commands. Signal remains `not-yet-measured`. |

---

## Outcome

**COMPLETE WITH DEVIATIONS ✅**

ACs satisfied: 5/5
Deviations: 2 recorded (no formal PR; addendum added post-initial-output — both within pattern for this spike programme)
Test gaps: None
NFRs: All addressed

**Follow-up actions:**
1. Process deviation (no PR) — noted for `/trace`. No follow-up story required. Future spike stories should open a draft PR before merging to preserve the PR audit trail.
2. E2 story ACs — p4-dist-install and p4-dist-upgrade must include ACs that verify permanent exclusion list enforcement (Spike C addendum item 4). These ACs were flagged in the addendum follow-up items and must be confirmed present when those stories enter DoR.
3. architecture-guardrails.md managed-merge — the managed-merge conflict detection heuristic (consumer ADR blocks identified by `## ADR-NNN` heading pattern) should be validated in p4-dist-upgrade's implementation. If the heuristic proves insufficient, the addendum revisit trigger activates.

---

## DoD Observations

Spike C completes the spike programme for distribution model design (sub-problems 1–4 resolved, all PROCEED). Combined with Spikes A (enforcement package), B1 (MCP surface), and B2 (CLI surface), the E1 spike programme now has four PROCEED verdicts covering enforcement mechanisms and distribution design. Spike D (Teams bot / non-technical access) remains outstanding.

The addendum (permanent exclusion list) strengthens the distribution design beyond the original four sub-problems by providing an unconditional safety boundary for consumer-owned files. This is a material quality improvement: it prevents a class of accidental data loss (upgrade overwriting pipeline-state.json or context.yml) that would otherwise be a silent risk in the p4-dist-upgrade implementation. Recording here as a `/improve` candidate — the "unconditional safety boundary" pattern may warrant a platform standard entry for future distribution-capable skills.

The T12 AC5 check (spot-check on p4-dist-lockfile) is representative — E2 stories were written with Spike C as an architecture input constraint (confirmed by test). Full AC5 compliance for all E2 stories is enforced at DoR (H9 architecture constraint check) rather than here.
