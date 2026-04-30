# Benefit Metric: Initiative 1 — Seamless Onboarding + Lockfile

<!--
  Produced by /benefit-metric skill — 2026-04-30.
  Initiative 1 is sequenced after Initiative 3 (governance prerequisite) is fully delivered.
  Scope: /orient concierge skill, platform:init/fetch/pin/verify CLI commands, platform-lock.json lockfile contract.
  Entry condition: Initiative 3 stories merged before any I1 implementation begins.
-->

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Date defined:** 2026-04-30
**Metric owner:** Hamish — Platform Maintainer
**Reviewers:** Hamish — Platform Maintainer

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

Initiative 1 delivers two things simultaneously: user-facing onboarding value (a first-time consumer reaches their first skill invocation without help) and platform infrastructure (lockfile contract, CLI stubs). It tests the hypothesis that one-command install plus a concierge orientation skill removes the engineering prerequisite barrier that is currently blocking non-engineering adoption. Both product and meta metrics are defined separately because the platform can succeed on meta metrics (lockfile implemented correctly, verify check works) even if the Tier 1 adoption target is not yet met within the measurement window.

---

## Tier 1: Product Metrics (User Value)

### M1: Time-to-first-skill-run for new consumers

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time from a first-time consumer running `npm run platform:init` in a new repo to their first successful skill invocation (any pipeline skill run that produces a saved artefact), measured on a fresh environment with no prior platform knowledge |
| **Baseline** | Not established. Current onboarding requires: reading README, cloning repo manually, understanding git submodule or copy approach, navigating pipeline docs to find starting skill. Observed range: 15–45 minutes based on existing adoption attempts that required platform-team support. Formal baseline measurement will be recorded in the first real consumer onboarding session post-I1 deployment. |
| **Target** | Under 2 minutes from `platform:init` to first skill invocation, on a machine with Node.js and npm already installed |
| **Minimum validation signal** | At least one new consumer completes `platform:init → /orient → first skill run` without requiring out-of-band help, in any amount of time |
| **Measurement method** | Platform maintainer observes or records one new consumer onboarding session within 30 days of I1 merge; wall-clock time from `platform:init` to first skill invocation recorded; result added to this metric's evidence field |
| **Feedback loop** | If minimum signal not met within 30 days: review /orient routing output for the specific step where the consumer got stuck; assess whether the stall is a skill clarity problem (fix /orient copy) or a CLI setup problem (fix platform:init error handling). If target (2 minutes) not met but minimum signal is met: acceptable — time improvement is iterative; record the actual time and add to a running average. At 90 days: if minimum signal still not met, escalate to platform team review — the hypothesis that /orient removes the engineering prerequisite barrier is not confirmed. |

### M2: Zero orientation contacts from teams that ran platform:init

| Field | Value |
|-------|-------|
| **What we measure** | Number of direct platform-team support requests (Slack DMs, emails, or GitHub issue questions) from teams that had successfully run `platform:init` in the measurement window, where the question would have been answered by running `/orient` |
| **Baseline** | 0 orientation contacts per measurement window — but this is because very few teams have attempted onboarding without engineering support. Baseline is effectively "all onboarding has required direct engineering support." Post-I1, any team that ran `platform:init` and still asks an orientation question is a signal that `/orient` is not sufficient. |
| **Target** | Zero orientation contacts from teams that ran `platform:init`, in any 30-day window, 90 days after I1 merge |
| **Minimum validation signal** | At least one team runs `platform:init` and reaches a real delivery decision point (e.g. runs `/discovery`, writes a story) without contacting the platform team |
| **Measurement method** | Platform maintainer tracks support requests manually; categorises each by whether the team had run `platform:init` and whether the question was orientation-class (answered by `/orient`) vs. configuration-class (not solvable by /orient). Logged as metric signal. |
| **Feedback loop** | Any orientation contact from a `platform:init` user is reviewed within 48 hours; the specific question is mapped to a gap in `/orient` routing or `platform:init` error output; gap is triaged as a bug fix or I2 scope item. If contacts exceed 2 in a 30-day window, the minimum signal is considered not met — hold I2 stories until I1 is demonstrably stable. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### MM1: platform:verify SHA mismatch produces specific, actionable error

| Field | Value |
|-------|-------|
| **Hypothesis** | The lockfile contract is only valuable if `platform:verify` fails loudly and specifically when skills drift from the pinned version — a generic failure or silent pass would make the lockfile a false-assurance mechanism |
| **What we measure** | Whether running `platform:verify` against a repo where one skill file has been modified since the last `platform:pin` produces an error that (a) names the specific file(s) that have drifted, (b) shows the expected SHA vs. actual SHA, and (c) tells the operator the exact command to re-pin or re-fetch |
| **Baseline** | Lockfile contract does not exist — no `platform:verify` command; skill drift is currently undetectable without manual diff |
| **Target** | 100% of `platform:verify` runs on drifted repos produce the three-part error message; zero false positives on clean repos |
| **Minimum signal** | A test scenario with a deliberately modified skill file runs `platform:verify` and produces a meaningful error (any error identifying the problem file) within 14 days of I1 merge |
| **Measurement method** | Platform maintainer runs `platform:verify` on a test repo with one modified skill file immediately post-merge; result recorded in evidence. Automated test suite (`check-i1.x-lockfile.js`) validates the three-part message format. |

### MM2: CLI commands init/fetch/pin/verify are implemented and complete their primary paths without error

| Field | Value |
|-------|-------|
| **Hypothesis** | The four CLI stubs (`platform:init`, `platform:fetch`, `platform:pin`, `platform:verify`) can be implemented using Node.js built-ins with zero new npm runtime dependencies, delivering the full lockfile contract without adding package weight or supply-chain risk |
| **What we measure** | Whether all four CLI commands complete their primary success paths — init bootstraps a new repo, fetch retrieves skill files, pin writes a lockfile, verify checks SHA — and whether the implementation contains zero new runtime npm dependencies beyond what was already in `package.json` before I1 |
| **Baseline** | Commands exist as unimplemented stubs (placeholder entries, no logic); lockfile schema does not exist |
| **Target** | All four commands complete primary success path; `npm install` diff between pre-I1 and post-I1 shows zero new `dependencies` entries in `package.json` |
| **Minimum signal** | `platform:init` and `platform:verify` are both functional (the two commands a new consumer runs first) within the I1 delivery |
| **Measurement method** | Automated test suites per command in `tests/check-i1.x-*.js`; `package.json` diff reviewed at PR time; manual walkthrough of `platform:init → /bootstrap → /orient` end-to-end path on a clean machine |

### MM3: /orient routing covers all supported pipeline entry states

| Field | Value |
|-------|-------|
| **Hypothesis** | `/orient` can read artefact state (presence/absence of discovery.md, benefit-metric.md, pipeline-state.json entries) and produce the correct "run /[skill] next" routing output for all supported entry states, without requiring a new pipeline stage or infrastructure beyond the existing skill execution context |
| **What we measure** | Whether `/orient` correctly identifies the expected next skill for each of these states: (1) empty repo — no artefacts, (2) discovery exists but not approved, (3) discovery approved, no benefit-metric, (4) benefit-metric active, no stories, (5) stories exist, no test-plan, (6) in-flight inner loop (branch-setup or later). All six must produce a correct, specific routing recommendation. |
| **Baseline** | No `/orient` skill exists; operator must consult `/workflow` or the pipeline documentation manually |
| **Target** | 100% correct routing for all six states; zero states where `/orient` produces an ambiguous, wrong, or empty routing recommendation |
| **Minimum signal** | States (1) and (3) — the two most common entry points for new consumers — produce correct routing in a real session within 14 days of I1 merge |
| **Measurement method** | Platform maintainer runs `/orient` manually against repos in each of the six states; result logged per state in evidence field; `tests/check-i1.x-orient.js` validates routing logic for all six states |

---

## Metric Coverage Matrix

<!--
  Populated by /definition after stories are created.
-->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Time-to-first-skill-run | i1.1 (/orient skill) | Pending — /definition not yet run |
| M2 — Zero orientation contacts | i1.1 (/orient skill), i1.2 (platform:init CLI) | Pending — /definition not yet run |
| MM1 — platform:verify SHA mismatch error | i1.3 (lockfile schema + verify) | Pending — /definition not yet run |
| MM2 — CLI commands implemented | i1.2 (platform:init CLI), i1.3 (lockfile schema + pin/verify) | Pending — /definition not yet run |
| MM3 — /orient routing coverage | i1.1 (/orient skill) | Pending — /definition not yet run |

---

## Measurement Evidence

<!--
  Populated post-implementation in /definition-of-done and /record-signal.
-->

### M1 Evidence

*Not yet measured. Formal baseline will be established in first real consumer onboarding session post-I1 deployment.*

### M2 Evidence

*Not yet measured. Measurement window opens 90 days after I1 merge.*

### MM1 Evidence

*Not yet measured. Lockfile contract does not exist — will be tested within 14 days of I1 merge.*

### MM2 Evidence

*Not yet measured. CLI stubs exist but are unimplemented.*

### MM3 Evidence

*Not yet measured. /orient skill does not yet exist.*

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on i1.x story artefacts
- Implementation approach for the CLI commands or lockfile schema
- WS4 lockfile synchronisation scope — that is a Phase 6 workstream; forward-compatibility is a constraint on I1, not an I1 deliverable
