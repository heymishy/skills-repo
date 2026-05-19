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

## DEC-RETRO-001 — [0.5.18] Inline-chat repo reorganisation accepted as structural decision

**Date:** 2026-04-16
**Decision type:** Structural — affects repo layout and documentation entry points
**Trigger:** Retrospective artefact coverage audit (2026-04-16), classification category A (structural decision requiring permanent record)

**Context:** CHANGELOG entry [0.5.18] records an inline-chat project reorganisation — restructuring files and directories within the repository. This change was committed between story cycles without a formal story artefact and without a corresponding decision-log entry. The audit identified this as a BETWEEN-STORIES gap in category A: structural decisions that should be permanently recorded even when no formal story chain exists.

**Decision recorded:**
The [0.5.18] repo reorganisation was intentional and load-bearing. The layout established in that change is the canonical structure that subsequent stories (including `feat/repo-tidy` in p3.17) build on. The decision to reorganise was made by the platform tech lead and is not subject to reversal. Future contributors should not revert to the pre-[0.5.18] structure; any further reorganisation requires a short-track story.

**Alternatives considered:** Reverting to pre-reorganisation structure — rejected; the [0.5.18] layout is stable and has been in use for all Phase 2 and Phase 3 artefacts.

**Risk accepted:** MEDIUM — The reorganisation was not announced via a formal artefact chain. Any consumer of this repository who cached file paths may have been broken by the change. Remediation: ONBOARDING.md documents the canonical docs/ structure; no further action required.

**Reversibility:** Not warranted — the layout is stable and all active artefact paths reflect the [0.5.18] structure.

**Logged by:** Hamish (tech lead), 2026-04-16

---

## DEC-RETRO-002 — pipeline-viz.html enhancements [0.6.0, 0.6.1] accepted as p2.7 scope extension

**Date:** 2026-04-16
**Decision type:** UI/tooling — cosmetic visualisation enhancements
**Trigger:** Retrospective artefact coverage audit (2026-04-16), classification category B (intentional additive scope)

**Context:** CHANGELOG entries [0.6.0] and [0.6.1] record enhancements to `pipeline-viz.html` — a visualisation tool added under story p2.7. The enhancements were cosmetic improvements (display, layout, readability) committed beyond the explicit p2.7 AC scope. The audit classified these as category B: intentional additive scope that was a reasonable extension of the parent story but was not formally AC-tracked.

**Decision recorded:**
The [0.6.0] and [0.6.1] `pipeline-viz.html` enhancements are accepted as de facto extensions of p2.7 scope. They do not introduce new behaviour — they improve the readability of existing visualisation output. No retrospective story is required; this decision log entry is sufficient to establish permanent record. Future visualisation changes beyond cosmetic readability should be tracked as short-track stories.

**Alternatives considered:** Raising a retrospective story — not warranted at LOW risk for cosmetic UI changes; decision log entry is proportionate.

**Risk accepted:** LOW — Cosmetic changes only; no functional behaviour introduced. No consumer impact.

**Reversibility:** Reversible at any time by rolling back the specific commits; no dependencies on these cosmetic changes.

**Logged by:** Hamish (tech lead), 2026-04-16

---

## DEC-RETRO-003 — Standards D-batch seeding accepted as p1.7 scope extension

**Date:** 2026-04-16
**Decision type:** Content / artefact scope — standards catalogue addition
**Trigger:** Retrospective artefact coverage audit (2026-04-16), classification category B (intentional additive scope)

**Context:** The retrospective audit identified that the standards D-batch (a batch of domain standards seeded into the `standards/` directory) was committed during Phase 1 in the vicinity of story p1.7 but without explicit AC coverage in p1.7. The audit classified this as category B: intentional additive scope consistent with the p1.7 framework-scaffolding purpose.

**Decision recorded:**
The standards D-batch seeding is accepted as a scope extension of p1.7 (the story that established the `standards/` directory and indexing framework). Adding standards content to a framework that p1.7 set up is consistent with the spirit of p1.7 even if the specific batch was not AC-tracked. No retrospective story is required. Future standards batches of material size should be tracked as short-track stories to preserve audit trails as the catalogue grows.

**Alternatives considered:** Raising a retrospective story — not warranted at LOW risk for additive standards content; decision log entry is proportionate.

**Risk accepted:** LOW — Content addition only. Standards content is purely informational; no executable code, no consumer-breaking changes.

**Reversibility:** Reversible by removing the specific standards files; no downstream dependencies hard-coded to D-batch content.

**Logged by:** Hamish (tech lead), 2026-04-16

---

## DEC-P3-003 — ASSUMPTION-02 confirmation: Tamper-evidence registry type revised to Option B (portable)

**Date:** 2026-04-19
**Story:** p3.2b — Implement tamper-evidence registry for traceHash (T3M1 Q8)
**Decision type:** ASSUMPTION-02 resolution — updated from DEC-P3-002 on 2026-04-15
**Status:** Accepted (supersedes DEC-P3-002)
**Owner:** Operator
**ADR alignment:** ADR-012 (Platform-agnostic architecture via adapters)

**Context:** Decision DEC-P3-002 (logged 2026-04-15) selected **Option A** — GitHub Artifact Attestation with OIDC-signed workflow identity. Rationale: the repository is on GitHub, so the native path is preferred.

However, the platform's architectural foundation (ADR-003, ADR-004, ADR-006) and its roadmap for enterprise adoption require platform neutrality: the skills pipeline must operate identically across GitHub, Bitbucket, GitLab, and on-premise Git environments. The first Enterprise adopter is on Bitbucket. Selecting Option A as the Phase 3 dogfood would create a GitHub-specific implementation that must be entirely rewritten for Bitbucket (or left as-is and create a deployment impedance).

**Revised decision:** **Option B** — Portable read-only registry repository. The tamper-evidence registry is a portable Git-based append-only store, not a GitHub Actions primitive. When the Enterprise adopter targets Bitbucket or on-premise Git, the same implementation works without core changes. GitHub-specific optimizations (OIDC verification, Artifact Attestation integration) land in adapter implementations, not the core registry.

**Rationale for revision:**
1. **Platform neutrality is a core principle** (ADR-003, ADR-004, ADR-006) — not a secondary concern. The T3M1 Q8 implementation must demonstrate this principle, not contradict it.
2. **Enterprise adopter context** — the first real adopter is on Bitbucket. Dogfooding on GitHub-only technology would delay or disable that adoption.
3. **Adapter pattern is load-bearing** — the platform commits to adapters as the mechanism for host-specific features. Core infrastructure (gates, traces, registries) must be portable; adapters enable host-specific optimization. Reversing this (making core GitHub-specific, adapters for fallbacks) violates the architecture.
4. **Option B is not a downgrade** — immutability-by-design (append-only storage, access control) provides equivalent tamper-evidence to cryptographic signing for audit purposes. The difference is in how the immutability is enforced, not in the audit value delivered.

**Impact on story p3.2b:**
- AC1: "published to tamper-evidence registry" remains the same. The registry implementation changes from GitHub Artifact Attestation to a portable read-only repository.
- AC2: Registry is append-only. Immutability enforced by access control (delivery agents have no write access, only a CI service account or bot can push entries). Branch protection enforces the policy.
- AC3: Modification attempted by a delivery team member is denied by branch protection and access control, not by GitHub attestation infrastructure.
- AC4: `tamperEvidence.registryType` = `"read-only-registry"`, `registryRef` = commit SHA of the registry repo entry.

**Implementation pattern:**
- Separate repository (e.g. `[org]/trace-registry`) under the same org as the delivery repo.
- Branch protection: main branch accepts pushes from CI service account only. No human write access.
- CI service account: PAT or GitHub App token with write-only access to the registry repo; no access to the delivery repo or any other repo.
- Post-merge workflow: downloads trace artifact, computes hash, writes a dated line to `traces/[feature-slug]/[story-slug].jsonl`, commits to registry main with message format: `audit: publish trace for [feature-slug] [story-slug] [ISO-8601-datetime]`.
- Auditor retrieval: `git log origin/traces/` or inspection of the registry repo. `git show [commit-SHA]:traces/[feature-slug]/[story-slug].jsonl` to retrieve the record.
- **Platform neutrality:** This pattern works identically on GitHub, Bitbucket, GitLab, and on-premise Git. Only the PAT provisioning and CI integration differ per platform.

**Alternatives considered:**
- **Option A (GitHub Artifact Attestation):** Rejected on this revision because it creates GitHub-specific implementation that must be rewritten for Bitbucket.
- **Hybrid (Option B now, add OIDC adapter later):** Considered. Rationale for rejection: the adapter layer would need to be added later, creating a backlog item. Platform-neutral implementations are simpler to get right the first time than to retrofit post-dogfood.

**Reversibility:** Fully reversible. When enterprise adoption is complete and a second adopter joins the platform on GitHub, a GitHub-specific adapter layer can be added (optional OIDC verification, optional Artifact Attestation fallback). The portable Option B core remains unchanged.

**Enterprise porting implication (reversed from DEC-P3-002):**
The same registry implementation (Option B) is used on **all** platforms — GitHub, Bitbucket, GitLab, and on-premise Git. No divergence at enterprise pilot onboarding. The trace schema `tamperEvidence` object carries a single `registryType` value across all deployments: `"read-only-registry"`. GitHub-specific optimizations (attestation signing, OIDC verification) are optional enhancements, not required implementations.

**Impact on Phase 4 decisions:**
- OIDC-signed attestation becomes a GitHub-specific adapter feature (Phase 4, not Phase 3).
- The portable Option B core is the Phase 3 deliverable. ADR-012 (Platform-agnostic architecture via adapters) now applies in full force to infrastructure features.

**Logged by:** Operator (2026-04-19). Confirms ASSUMPTION-02 as portable architecture, supersedes DEC-P3-002 GitHub-specific selection.
