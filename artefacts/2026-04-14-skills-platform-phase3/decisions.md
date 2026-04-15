# Decisions Log: Skills Platform — Phase 3

**Feature:** 2026-04-14-skills-platform-phase3
**Last updated:** 2026-04-14

---

## DEC-P3-001 — Bitbucket DC auth test resolution: Option B adopted

**Date:** 2026-04-14
**Story:** p3.1d — Resolve permanently-skipped Bitbucket DC auth tests
**Decision type:** Implementation path choice
**Status:** Accepted

**Context:** Story p3.1d (Acceptance Criterion 1 — Resolve permanently-skipped Bitbucket DC auth tests) offers two resolution paths for the four permanently-skipped auth tests (`app-password`, `OAuth`, `SSH key`, `PAT`) in `tests/check-bitbucket-dc.js`:

- Option A — Add a scheduled CI workflow (`.github/workflows/bitbucket-dc-auth.yml`) with a live Bitbucket DC Docker service container. Tests execute on a weekly schedule rather than on `pull_request`, satisfying Acceptance Criterion 2.
- Option B — Add dated manual test record entries to `tests/smoke-tests.md` and replace `// PREREQ-DOCKER` annotations with `// MANUAL: see smoke-tests.md`. Each entry records test name, last-run date (ISO 8601), result, runner identity, and Docker dependency rationale. Satisfies Acceptance Criterion 3.

**Decision:** Option B — manual test record in `tests/smoke-tests.md`.

**Rationale:** No Bitbucket DC Docker service is available in the CI environment at the time of Phase 3 implementation. Option A is architecturally preferred long-term but cannot be validated without the Docker infrastructure in place. Option B formalises the current skip as a documented, auditable coverage decision rather than leaving it as an unresolved gap. The four tests are no longer silently skipped — they carry an explicit annotation pointing to the dated manual record. Phase 4 infrastructure work can replace the smoke-tests.md entries with the scheduled workflow when the Docker service becomes available.

**Impact on ACs:**
- Acceptance Criterion 2 (Option A — scheduled CI workflow `bitbucket-dc-auth.yml`) is **OPTION-NOT-CHOSEN** for Phase 3. Not implemented.
- Acceptance Criterion 3 (Option B — `smoke-tests.md` entries with 5 required fields) **applies**. This is the active implementation path.
- Acceptance Criterion 4 (`npm test` shows `// MANUAL: see smoke-tests.md` annotation, not a permanent bare skip) **applies** under Option B.
- Acceptance Criterion 5 (decision logged in decisions.md with rationale) is **satisfied by this entry**.

**Alternatives considered:** Option A — deferred to Phase 4 pending Docker infrastructure provisioning.

**Reversibility:** Fully reversible. When a Bitbucket DC Docker service is provisioned in CI, Option A can be implemented by: creating `bitbucket-dc-auth.yml`, updating `tests/check-bitbucket-dc.js` to remove Manual annotations, and archiving or removing the `smoke-tests.md` entries for the four tests.

**Logged by:** Operator (tech lead), 2026-04-14

---

## DEC-P3-002 — Tamper-evidence registry type: Option A (GitHub Artifact Attestation) adopted

**Date:** 2026-04-15
**Story:** p3.2b — Implement tamper-evidence registry for traceHash (T3M1 Q8)
**Decision type:** ASSUMPTION-02 resolution — implementation path choice
**Status:** Accepted
**Owner:** Hamish

**Context:** Story p3.2b (Architecture Constraints, ASSUMPTION-02) specifies two implementation options for the tamper-evidence registry that publishes `traceHash` to an append-only external store the delivery team cannot modify:

- Option A — GitHub Artifact Attestation with OIDC-signed workflow identity. The preferred path when the repository is on GitHub. The CI workflow uses OIDC tokens to publish an attestation record; the attestation is cryptographically signed by the workflow identity and is immutable — no PAT or stored credential required.
- Option B — Dedicated read-only registry repository. The fallback for Bitbucket/Jenkins environments where GitHub Artifact Attestation is not available. Requires a CI service account with write access to the registry repo only.

**Decision:** Option A — GitHub Artifact Attestation with OIDC-signed workflow identity.

**Rationale:** The repository `heymishy/skills-repo` is hosted on GitHub — exactly the condition the story specifies triggers the preferred path. GitHub Artifact Attestation provides a cryptographically signed, OIDC-anchored record with no PAT or service account token required. Option B adds service-account token management overhead with no security or auditability benefit in this environment.

**Enterprise porting note — known divergence:** The enterprise deployment target uses Bitbucket. GitHub Artifact Attestation (Option A) is not available in Bitbucket/Jenkins environments. Enterprise adopters must implement Option B: a dedicated read-only registry repository with a CI service account token that has write access to the registry repo only (not the delivery repository). Option B requirements:
- A separate registry repository (e.g. `[org]/trace-registry`) with branch protection: no human write access; only the CI service account may push.
- A CI service account token with write access to the registry repo only — must not be a personal access token.
- The traceHash publication step commits one entry per story merge as an append-only commit to the registry repo's main branch.
- `tamperEvidence.registryRef` in the trace records the commit SHA of the registry repo entry.
- Auditor retrieval: `git log` on the registry repo is sufficient — no special tooling required.

This divergence must be revisited at enterprise pilot onboarding. The Q8 dogfood evidence (Artifact Attestation records) is not directly portable to a Bitbucket deployment — the registry type and retrieval mechanism differ.

**Impact on story p3.2b:**
- AC1: "published to Artifact Attestation" is the active implementation path.
- AC3: Artifact Attestation records are immutable by design — modification attempted by a delivery team member is denied by GitHub's attestation infrastructure.
- AC4: `tamperEvidence.registryType` = `"github-artifact-attestation"`, `registryRef` = attestation URL.

**Alternatives considered:** Option B — deferred to enterprise adoption. Option B is architecturally equivalent for regulated deployments; the difference is the platform and credential model.

**Reversibility:** Reversible at enterprise pilot onboarding by implementing Option B as an environment-specific alternate for non-GitHub deployments. The trace schema `tamperEvidence` object already accommodates both values for `registryType`.

**Logged by:** Hamish (tech lead), 2026-04-15

---

## DEC-P3-003 — W4 RISK-ACCEPT: verification script not pre-reviewed by a separate domain expert (p3.14)

**Date:** 2026-04-15
**Story:** p3.14 — Author framework concepts documentation suite for new-user onboarding
**Decision type:** RISK-ACCEPT — DoR Warning W4 acknowledgement
**Status:** Accepted
**Owner:** Operator (tech lead)

**Context:** DoR Warning W4 fires when the verification script has not been reviewed by a domain expert independently of the author before coding begins. For p3.14, the verification script was produced by the AI agent (GitHub Copilot) and reviewed only by the operator. The operator is also the tech lead and the only contributor on this repository. No independent domain expert is available.

**Decision:** Accept the risk and proceed. Content quality review (readability, completeness, AC7 self-contained check) will be conducted post-merge as part of the Definition of Done rather than pre-code.

**Rationale:** Solo project — tech lead and operator are the same person. The risk profile of p3.14 is low: it produces reference documentation only, creates no code paths, modifies no governance gates, and makes no changes to `.github/`, `src/`, or `artefacts/`. The worst-case outcome of an insufficiently reviewed verification script is a documentation file that passes automated tests but fails a readability/completeness spot-check — detectable and correctable at DoD with no downstream blast radius.

**Residual risk:** The three manual scenarios in the verification script (AC7, NFR-Readability, NFR-Completeness) require a human reader who can assess without prior context. The operator will perform this review at DoD as part of the standard post-merge validation. If the spot-check reveals a gap in the verification script's criteria, a follow-on documentation patch story can be raised without pipeline cost.

**Logged by:** Operator (tech lead), 2026-04-15
