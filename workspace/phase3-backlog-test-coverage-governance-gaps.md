# Phase 3/4 Backlog — Test Coverage and Governance Chain Gaps

**Status:** Backlog (discovered 2026-04-13, second-team validation review)
**Origin:** Adversarial review of test suite and governance chain by 2nd team
**Review repo:** https://github.com/heymishy/skills-platform-val
**Component:** `tests/`, `.github/scripts/`, `.github/scripts/run-assurance-gate.js`, `workspace/watermark-gate.js`, `src/improvement-agent/failure-detector.js`

---

## Context

During Phase 2 sign-off, a second-team adversarial review of the full test suite and governance chain was conducted. The review distinguished between tests that exercise real source code with meaningful failure modes (*Tier A*) and tests that perform structural/text-presence checks (*Tier B*). All 500+ assertions pass, but the review identified specific gaps where the system can be shown to be passing its own tests while delivering no real governance assurance.

The review also identified the broader unverifiable claim: *does an agent actually follow the skills in practice, and does the governance chain hold under adversarial conditions?* That systemic gap (AC6) is designated Phase 4 work and is tracked separately.

---

## Problem Statement

The assurance gate CI job runs on every PR but its four checks (`workspace-state-valid`, `pipeline-state-valid`, `artefacts-dir-exists`, `governance-gates-exists`) are file-existence and JSON-parseability checks only. An empty repo with four minimal files passes all four. Production traces confirm `completedAt` is 1–2ms after `startedAt` — there is nothing substantive to evaluate.

Additionally:
- `tests/check-definition-skill.js` tests its own inline helper re-implementations, not the production code it purports to validate. If the `/definition` skill's parsing changed, these tests would still pass.
- The watermark gate accepts any first-run passRate (including 0.0) as a baseline with no minimum floor, allowing a low baseline to lock in low quality permanently.
- The anti-overfitting gate blocks removal of a passing check but permits a proposal that simultaneously removes one check and adds a new one — the net-change rule uses the combined diff.
- `check-workspace-state.js` validates `completedAt` with `=== undefined` rather than falsy, so `completedAt: null` (present in the committed clean-clone state) passes without warning.
- Bitbucket DC auth tests (app-password, OAuth, SSH key) are permanently skipped in CI with `PREREQ-DOCKER`. These four tests have never run in CI.

---

## Scope — Acceptance Criteria

### AC1 — Strengthen assurance gate checks beyond file existence

**Requirement:** `run-assurance-gate.js` must run at least three content-level checks in addition to the existing structural checks.

**Acceptance:**
- [ ] Gate validates `workspace/state.json` schema beyond parse: asserts `currentPhase` is non-empty string AND `lastUpdated` matches ISO 8601 regex (same checks as `check-workspace-state.js`)
- [ ] Gate validates `.github/pipeline-state.json` beyond parse: asserts `version` field exists and `features` is an array
- [ ] Gate validates that at least one artefact directory exists under `artefacts/` (not just that the directory itself exists)
- [ ] Gate validates `governance-gates.yml` beyond existence: asserts `gates:` key is present and list is non-empty
- [ ] `check-assurance-gate.js` is updated to cover these four new content checks
- [ ] Production traces show `completedAt` more than 5ms after `startedAt` (confirms real work was done)

**Why:** The current gate provides trace hygiene (inProgress→completed ordering) with no governance signal. A bad PR that correctly maintains file structure passes identically to a good one.

---

### AC2 — Fix `check-definition-skill.js` to use production code

**Requirement:** Remove inline re-implementations and import the actual helper functions used by the definition skill or its source modules.

**Acceptance:**
- [ ] `extractUpstreamSlugs`, `resolveSlug`, `validateExternalAnnotation`, and `D2` testability heuristic helpers are moved to `src/definition-skill/helpers.js` (or equivalent)
- [ ] `tests/check-definition-skill.js` imports those helpers from the production path rather than defining them inline
- [ ] Tests still pass after the refactor (no behaviour change)
- [ ] If the `/definition` SKILL.md or its helpers change, `check-definition-skill.js` would now catch it

**Why:** As currently written, a change to the definition skill's parsing logic would leave the test green while the production behaviour is broken. This gives false assurance.

---

### AC3 — Add minimum floor to watermark gate

**Requirement:** The watermark gate must enforce a minimum acceptable `passRate` floor on baseline creation, preventing a near-zero baseline from becoming the permanent reference.

**Acceptance:**
- [ ] `watermark-gate.js` reads a `minimum_floor` config from `workspace/suite.json` or a new `watermark-config.json` file (operator-settable, default 0.70)
- [ ] On first run (baseline creation), if `passRate < minimum_floor`, the gate writes `verdict: "below-floor"` and exits non-zero
- [ ] `check-watermark-gate.js` adds tests: `first-run-below-floor-rejects`, `first-run-at-floor-accepts`, `floor-default-is-0.70`
- [ ] Existing tests continue to pass

**Why:** A team could legitimately start with a 0% baseline if the first run is a scaffold. But a 30% passRate baseline permanently anchors the quality floor at 30%. Without a minimum floor the gate is only a regression detector, not a quality gate.

---

### AC4 — Harden anti-overfitting gate against combined-diff bypass

**Requirement:** The anti-overfitting gate must block a proposal that nets to removing passing checks even if new checks are added in the same diff.

**Acceptance:**
- [ ] `failure-detector.js` anti-overfitting logic counts removals of currently-passing checks separately from additions of new checks
- [ ] A proposal that removes 1 passing check and adds 1 new check is **blocked** with reason `"net-removal-of-passing-check"` (not merely warned)
- [ ] A proposal that removes 0 passing checks and adds 1 new check continues to pass
- [ ] A proposal that removes 1 failing check (not currently passing) and adds 1 new check continues to pass
- [ ] `check-improvement-agent.js` adds tests covering these four cases

**Why:** The current implementation's `anti-overfitting-passes-add-check-proposal` test explicitly documents that adding a check passes the gate regardless of simultaneous removals. This is exploitable.

---

### AC5 — Fix `completedAt: null` passing `check-workspace-state.js` schema check

**Requirement:** The schema validation for `cycle.discovery.completedAt` must treat `null` as distinct from a populated value and surface it appropriately.

**Acceptance:**
- [ ] `check-workspace-state.js` distinguishes `null` from `undefined` for `completedAt`: if `completedAt` is explicitly `null` AND `cycle.discovery.status === 'completed'`, the test fails with `"cycle.discovery.completedAt is null but status is completed — timestamp missing"`
- [ ] If `completedAt` is `null` and `status` is `'pending'` or `'in-progress'`, the test passes (null is valid for an incomplete discovery)
- [ ] The committed `workspace/state.json` is updated: `completedAt: null` with `status: "completed"` must be resolved — either set a real timestamp or change status to reflect the actual state
- [ ] Test added: `state-completed-discovery-with-null-completedAt-fails`

**Why:** `completedAt: null` + `status: "completed"` in the phase 2 checkpoint state is either a data quality bug or a schema design ambiguity. Either way the schema check should distinguish the two states.

---

### AC6 — Document and scope agent behaviour observability (Phase 4)

**Requirement:** Produce a one-page architectural note on what it would take to test agent skill adherence, and register it as a Phase 4 candidate story.

**Acceptance:**
- [ ] `docs/` contains `agent-behaviour-observability.md` describing: the claim being made (agent follows skills), how it is currently unverifiable, three candidate approaches (golden-path session replay fixtures, LLM-as-judge eval harness, adversarial injection test stories), and the effort estimate for each
- [ ] A Phase 4 story is registered in `workspace/` pointing to this document
- [ ] No implementation is required at this stage

**Why:** The honest gap — that the pipeline makes behavioural claims about AI agents that its test suite cannot verify — should be a first-class tracked item rather than an undisclosed assumption.

---

### AC8 — Lift platform invariants from README into architecture-guardrails.md and Coding Standards

**Requirement:** The core principles stated in README.md (spec immutability, spec as truth, artefact-first convention, pipeline step sequencing) must be promoted into machine-readable or agent-readable locations that are enforced at review or gate time, not just visible in human-browsable documentation.

**Acceptance:**
- [ ] `.github/architecture-guardrails.md` contains a **Platform Invariants** section listing at minimum: spec immutability (artefacts are read-only pipeline inputs), spec as truth (no implementation without a corresponding artefact chain), human approval at every merge gate, and gate structural independence
- [ ] `copilot-instructions.md` Coding Standards section (currently `[FILL IN BEFORE COMMITTING]`) is populated with those same invariants as active working constraints, not background reading
- [ ] README.md is updated to point to `.github/architecture-guardrails.md` as the canonical source — it becomes a pointer, not the source
- [ ] `check-governance-sync.js` or a new `check-platform-invariants.js` validates that the Platform Invariants section exists and is non-empty on every PR
- [ ] A test is added: `invariants-section-present-and-non-empty` — fails if the section is missing or contains only placeholder text
- [ ] The `/review` Category E check (architecture) references `architecture-guardrails.md` invariants — already the case per existing instructions, but a test scenario in `workspace/suite.json` confirms it

**Why:** A principle that only lives in README.md is advisory. Every agent session loads `copilot-instructions.md` before acting — if the invariants are not there, agents are making decisions without the constraints loaded. Any PR that removes a core invariant must fail the governance gate, not just fail human review. The spec-immutability learning (2026-04-14, `workspace/learnings.md`) identified this gap concretely: the `/estimation` skill was delivered without a full artefact chain because nothing in the gate suite required one.

**Origin:** Learning signal from 2026-04-14 HANDOFF.md porting session. Recorded in `workspace/learnings.md` under "Pipeline gap — spec immutability principle broken by out-of-band feature delivery".

---

### AC9 — Artefact-first governance gate (`check-artefact-coverage.js`)

**Requirement:** A governance gate check must enforce the artefact-first rule: every SKILL.md file in `.github/skills/` and every source module in `src/` must have a corresponding DoR artefact file committed to `artefacts/`. A PR that adds or modifies a skill or source module without a linked DoR story must be flagged by the gate, not just by human code review.

**Acceptance:**
- [ ] `tests/check-artefact-coverage.js` (or `.github/scripts/check-artefact-coverage.js`) enumerates all SKILL.md files in `.github/skills/` and all top-level module directories in `src/`
- [ ] For each skill/module, the check verifies that at least one DoR file exists in `artefacts/` whose filename contains the skill slug or module name (case-insensitive, hyphen-normalised)
- [ ] Skills or modules with no matching DoR file are reported as `UNCOVERED` findings with their paths
- [ ] The check exits non-zero if any UNCOVERED finding exists AND the finding is not in an explicit exemption list in `package.json` or a `artefact-coverage-exemptions.json` config file
- [ ] `package.json` test chain is updated to include this check
- [ ] **Baseline audit:** Before the gate is enforced, a one-time audit lists all current UNCOVERED skills and modules. Known gaps (e.g. `/estimation` skill, `/decisions` skill) are added to the exemption list with a comment explaining the gap and the owner. The exemption list is not a permanent waiver — it is a tracked technical debt register. Each item must have a Phase 3 story to close it.
- [ ] The gate passes on a clean Phase 1+2 repo (all Phase 1 and Phase 2 skills and src/ modules have artefacts)
- [ ] A test is added: `uncovered-skill-fails-gate`, `covered-skill-passes-gate`, `exempted-skill-passes-gate`, `exempted-skill-requires-comment`

**Why:** The pipeline's spec-immutability principle states that artefacts are the authoritative spec for everything in the repo. Without a gate check, this principle is aspirational. The `/estimation` skill is the concrete evidence of the failure mode: it exists in `.github/skills/` with no discovery, story, test-plan, or DoR, making it untraceable, unportable, and unverifiable by any upgrade-path agent reading Section 7 of HANDOFF.md. This check closes the structural gap. The exemption list makes the technical debt visible rather than hidden.

**Origin:** Learning signal from 2026-04-14 HANDOFF.md porting session. Recorded in `workspace/learnings.md` under "Pipeline gap — spec immutability principle broken by out-of-band feature delivery".

---

### AC7 — Resolve Bitbucket DC auth test gap

**Requirement:** The four permanently-skipped Bitbucket DC auth tests become either (a) runnable in CI via a GitHub Actions service container, or (b) explicitly documented as requiring local Docker pre-condition with a manual test record on file.

**Acceptance:**
- Option A: `.github/workflows/` contains a `bitbucket-dc-auth.yml` workflow that runs a Bitbucket DC container as a service and executes the skipped tests on a schedule (weekly)
- Option B: `tests/smoke-tests.md` contains a formal manual test record section for DC auth tests with last-run date, runner, and pass/fail
- [ ] Either option is implemented; the other is removed as an open gap
- [ ] `check-bitbucket-dc.js` is updated to reflect whichever option is taken

**Why:** The auth paths (app-password, OAuth, SSH key) are precisely the security-critical flows most likely to have silent regressions. They have never run in CI and the skip condition is permanently true in the standard repo environment.

---

## Gap not in scope (governance process — not automatable)

**Pipeline step sequencing is unenforceable at the code level.** The governance chain relies on the agent reading and following copilot-instructions.md. `pipeline-state.json` is agent-written; a compliant agent and a non-compliant agent produce the same structural output. This is a trust model constraint, not a test gap. The correct mitigation is AC6 (agent behaviour observability) and human review at DoR sign-off, which is already required.

---

## Recommended priority order for Phase 3

| Priority | AC | Effort | Impact |
|---|---|---|---|
| 1 | AC1 — Strengthen assurance gate | Small | High — closes the "gate checks nothing" gap |
| 2 | AC5 — Fix null completedAt | Trivial | Low — data quality |
| 3 | AC2 — Fix definition skill test | Small | Medium — test integrity |
| 4 | AC3 — Watermark floor | Medium | High — prevents baseline gaming |
| 5 | AC4 — Anti-overfitting harden | Medium | Medium — closes bypass path |
| 6 | AC7 — Bitbucket DC tests | Medium | Medium — security regression risk |
| 7 | AC6 — Agent observability doc | Small | High (strategic) — Phase 4 framing |
| 8 | AC8 — Lift platform invariants from README to guardrails | Small | High — makes spec-immutability principle enforceable |
| 9 | AC9 — Artefact-first governance gate | Medium | High — prevents out-of-band feature delivery |
