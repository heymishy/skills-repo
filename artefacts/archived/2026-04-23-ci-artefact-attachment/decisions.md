# Decision Log: 2026-04-23-ci-artefact-attachment

**Feature:** CI-Native Artefact Attachment (WS0.6)
**Discovery reference:** artefacts/2026-04-23-ci-artefact-attachment/discovery.md
**Last updated:** 2026-04-23

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-04-23 | SLICE | /definition**
**Decision:** Feature decomposed into three walking-skeleton stories: caa.1 (collect flag), caa.2 (GitHub Actions adapter), caa.3 (context.yml gate), executed sequentially with each depending on the prior being DoD-complete.
**Alternatives considered:** Single monolithic story; two stories (collect + upload bundled); parallel implementation.
**Rationale:** Walking-skeleton order mirrors risk profile — caa.1 is Complexity 1 and zero-dependency, making it the safest first step. Sequential dependency chain gives each story a clean integration boundary and makes CI failures attributable. Monolithic story would have been too large to verify atomically.
**Made by:** Operator (heymishy) via /definition skill run.
**Revisit trigger:** If a future CI platform requires a fundamentally different collect shape (e.g. event-driven rather than CLI-flag).

---

**2026-04-23 | ARCH | /definition**
**Decision:** CI adapter interface (`upload`, `postComment`) placed in `scripts/ci-adapters/` with one file per platform, loaded by `ci_platform` key from `context.yml`.
**Alternatives considered:** Single monolithic adapter file with platform conditionals; adapter registered in `pipeline-state.json` rather than `context.yml`; external npm adapter packages.
**Rationale:** Additive pattern (ADR-012) — adding a new platform requires creating one file with no changes to existing code. Context.yml is already the config surface (ADR-004). Npm packages would violate the MM2 zero-dep constraint.
**Made by:** Operator (heymishy) via /definition + /review skill run.
**Revisit trigger:** If adapter interface diverges significantly across platforms (e.g. one platform needs streaming); or if the number of adapters grows beyond 5 and a registry pattern is needed.

---

**2026-04-23 | RISK-ACCEPT | /review — caa.1**
**Decision:** Accepted MEDIUM finding F-A1 (missing error path for unreadable artefact files) after resolving it in the story artefact (AC4 exit message spec). Did not log a /decisions entry at the time of review; logging retrospectively here.
**Alternatives considered:** Deferring resolution to implementation (risk: undefined behaviour); adding a seventh AC explicitly covering partial-read failure (risk: scope creep beyond MVP).
**Rationale:** The prescribed exit code 1 + stderr message in AC4 covers the observable failure path. The test plan includes a scenario for unreadable source. The unresolved behaviour is bounded to a single AC, not a systemic gap.
**Made by:** Operator (heymishy) at /review pass confirmation.
**Revisit trigger:** If AC4's error message spec proves insufficient during TDD (e.g. partial collection — some files copied, some not). In that case, raise as a blocker before implementation completes.

---

**2026-04-23 | RISK-ACCEPT | /review — caa.2**
**Decision:** Accepted MEDIUM finding F-A1 (idempotency language) and F-C1 (missing permissions constraint) after resolving both in the caa.2 story artefact. Logging retrospectively.
**Alternatives considered:** Reverting to a warning state and blocking DoR; treating as LOW and deferring.
**Rationale:** F-A1 was a wording issue — the NFR was updated to imperative language ("must update or post new comment"). F-C1 was a missing explicit constraint — added to Architecture Constraints as `contents: write` FORBIDDEN (ADR-009/PAT-08). Both are verifiable in the test plan (AC5 + NFR2). No behavioural gap remains.
**Made by:** Operator (heymishy) at /review pass confirmation.
**Revisit trigger:** If `gh pr comment` idempotency behaviour changes between GitHub Actions runner versions (gh CLI updates). Pin `gh` version in the workflow step if this becomes a concern.

---

**2026-04-23 | RISK-ACCEPT | /review — caa.3**
**Decision:** Accepted MEDIUM finding F-A1 (YAML parsing constraint not explicit in story) after resolving it in the story artefact (Architecture Constraints, NFR note). Logging retrospectively.
**Alternatives considered:** Adding `js-yaml` npm package for robust YAML parsing (violates MM2); writing a bespoke YAML parser in Node.js (over-engineering for a single-field read); blocking the story until a zero-dep YAML library is identified.
**Rationale:** The `yq` approach (GitHub-hosted runners include it by default) handles the single-field read with no npm dep. The test design decouples YAML parsing from config-reader logic so the Node.js test suite doesn't need to parse YAML at all. Risk is low: `yq` availability on GitHub-hosted runners is a stable guarantee documented by GitHub.
**Made by:** Operator (heymishy) at /review pass confirmation.
**Revisit trigger:** If GitHub removes `yq` from hosted runners (check the runner image changelog). Mitigation: add a `setup-yq` action step.

---

**2026-04-23 | RISK-ACCEPT | /definition-of-ready — W4 (all 3 stories)**
**Decision:** Proceeded without expert domain review of the AC verification scripts (W4 warning across caa.1, caa.2, caa.3).
**Alternatives considered:** Requesting external review before sign-off (would delay the inner loop); marking stories as blocked until a reviewer was available.
**Rationale:** Solo repository; no separate domain expert is available. Medium oversight is the mitigation — the human tech lead reviews the draft PR before merge. The verification scripts are mechanical (one scenario per AC) and were reviewed by the operator inline.
**Made by:** Operator (heymishy) at /definition-of-ready sign-off.
**Revisit trigger:** If the organisation adds a security/quality reviewer role. Route verification scripts through that role at DoR for future features.

---

**2026-04-23 | RISK-ACCEPT | /definition-of-ready — W5 (caa.2)**
**Decision:** Accepted test gap for AC1 and AC2 (live GitHub Actions runtime not testable in unit/integration suite) in caa.2.
**Alternatives considered:** Blocking until a GitHub Actions test runner is configured (e.g. act); removing AC1/AC2 and replacing with a looser testable proxy.
**Rationale:** The `act` tool adds Docker complexity that would itself violate the zero-dep and zero-friction constraints. Manual Scenario 5 in the verification script documents the live confirmation path. The risk is that the upload/comment integration breaks silently — mitigated by the fact that both `actions/upload-artifact` and `gh pr comment` are well-established and stable.
**Made by:** Operator (heymishy) at /definition-of-ready sign-off for caa.2.
**Revisit trigger:** If a live-runner CI test environment becomes available (e.g. a self-hosted runner with Docker). Promote Scenario 5 to an automated test at that point.

---

**2026-04-23 | ASSUMPTION | /definition**
**Decision:** Assumed `yq` (mikefarah/yq v4+) is available on GitHub-hosted runners without installation steps.
**Alternatives considered:** Installing yq via a setup step; using a js-yaml npm package; using grep/awk for YAML parsing.
**Rationale:** GitHub's ubuntu-latest runner image includes yq by default (confirmed in GitHub runner software changelog). grep/awk is a valid fallback but is fragile for nested YAML. js-yaml violates MM2.
**Made by:** Operator (heymishy) via /definition skill run.
**Revisit trigger:** GitHub runner image changelog shows yq removed or version changed. Add `uses: mikefarah/yq@v4` install step as mitigation.

---

## Architecture Decision Records

<!-- No new repo-level ADRs were required for this feature. All architectural constraints were captured via existing ADR references (ADR-003, ADR-004, ADR-009, ADR-010, ADR-011, ADR-012, PAT-08) in the story artefacts. -->
