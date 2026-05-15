# Definition Output — T4 (CI/CD Dependency Scanning — No Regulated Constraints)
**Case ID:** T4-no-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Automated Dependency Security Scanning" — Status: Approved
✅ Benefit-metric artefact found: "Automated Dependency Security Scanning"
✅ Metrics with targets: 2 (M1: CVE exposure window < 7 days; M2: zero CVSS ≥7.0 merges without exception)

---

## Step 4a — Regulated constraint propagation check

**Constraint analysis:**

✅ **No regulated constraints detected in discovery**

1. **Constraint 1 (Technical):** Scanner must add no more than 3 minutes to PR pipeline execution time (current baseline: 12 minutes; ceiling: 15 minutes)
2. **Constraint 2 (Technical):** Tooling and infrastructure cost must not exceed £3,000 per year

**Result:** No C2 (process gate) or C3 (retention/compliance) constraints present. No external approval authority, certification, sign-off, or compliance gate mentioned anywhere in the discovery, narrative, or background sections.

**Constraint propagation plan:**
- Constraint 1 (pipeline timing) will be a non-functional requirement (likely recorded in Story 1 or as a delivery constraint, not as an AC)
- Constraint 2 (cost ceiling) will be recorded as a delivery constraint
- No regulated-constraint stories required
- No external approval gates required
- No compliance sign-off gates required

**Step 4a result:** No regulated constraints; proceed directly to decomposition.

---

## Step 2 — Slicing strategy

**Strategy chosen:** User journey (follow the engineer's interaction path through the CI/CD pipeline)
**Rationale:** Dependency scanning is primarily a developer experience feature. The user journey (commit → PR raises → scanner runs → merge allowed/blocked → digest received) is intuitive and validates end-to-end behaviour at each step.

---

## Step 3 — Epic structure

**Single epic: Automated Dependency Vulnerability Scanning for CI/CD**
- **Stories:** 4 stories
- **Rationale:** Dependency scanning is a cohesive feature spanning PR checks, policy enforcement, reporting, and auto-remediation. All stories are tightly coupled through the vulnerability detection and reporting infrastructure.

---

## Stories

### Story 1: PR Vulnerability Scan and Check Integration

**Persona:** Platform Engineer
**Connects to:** Metric M1 (faster CVE detection) + Metric M2 (block merge on high-severity CVE)

**As a** Platform Engineer **I want** a GitHub Actions check to run an automated dependency vulnerability scan on every PR targeting the main branch and block merge if any dependency introduces a CVSS ≥ 7.0 vulnerability **so that** high-severity CVEs cannot be merged into the main branch

**MVP Scope items covered:** Scope item 1 (PR vulnerability scan); Scope item 2 (CVSS ≥ 7.0 merge block)

**Out of scope:**
- Container image scanning (separate CIS hardening workstream)
- Custom CVE suppression rules (Phase 2)
- Jira ticket creation (Phase 2)
- Historical dependency audit

**Assumptions to test:**
- Dependency scanner (Dependabot or OSS equivalent) integrates with GitHub Actions without a paid tier upgrade; not yet verified

**Architecture Constraints:**
- Scanner must add no more than 3 minutes to PR pipeline (total pipeline must not exceed 15 minutes)
- Scan must run on every PR; false negatives are unacceptable
- Merge block must be automatic (no manual override required for CVSS ≥ 7.0)

**Acceptance Criteria:**

1. Given a PR is opened targeting the main branch, When the PR workflows run, Then a dependency vulnerability scan is executed within the first 3 minutes of the pipeline; total pipeline execution time does not exceed 15 minutes (3-minute scanner budget maintained)

2. Given a PR introduces a new dependency with a known CVSS ≥ 7.0 vulnerability, When the scan completes, Then a GitHub check is marked as "failed" and the PR is blocked from merging; the check includes a link to the CVE details

3. Given a PR updates a dependency to a patched version that removes the CVSS ≥ 7.0 vulnerability, When the scan completes, Then the check is marked as "passed" and the PR can be merged

---

### Story 2: Merge Block Policy and High-Severity CVE Reporting

**Persona:** Security Engineer
**Connects to:** Metric M1 (visibility into CVE risk) + Metric M2 (zero high-severity CVEs in main)

**As a** Security Engineer **I want** the merge block policy to be enforced automatically for CVSS ≥ 7.0 vulnerabilities, and I want to receive a daily summary report of all blocked merges and any exceptions **so that** I have visibility into CVE risk and can track exposure trends

**MVP Scope items covered:** Scope item 2 (CVSS ≥ 7.0 merge block)

**Out of scope:**
- Custom CVE suppression rules (Phase 2)
- Manual merge override workflows (Phase 2)
- Jira integration (Phase 2)

**Assumptions to test:**
- No valid use case for merging high-severity CVEs exists in practice (e.g. no emergency patches without workarounds)

**Architecture Constraints:**
- Merge block must be enforced at the GitHub branch protection rule level (no bypass without admin intervention)
- Policy must apply to all branches targeting main (no exceptions without explicit approval)
- Daily report must be sent to security-alerts Slack channel

**Acceptance Criteria:**

1. Given a PR is blocked due to CVSS ≥ 7.0 vulnerability, When a developer attempts to merge, Then the branch protection rule prevents the merge and displays the GitHub check failure; no bypass is possible without repository admin approval

2. Given multiple PRs are blocked on a given day, When the daily report is generated, Then the report includes: number of blocked PRs, vulnerable packages, CVSS scores, and a link to each PR for review

3. Given a blocked PR is unblocked (developer patches the vulnerability), When the report is generated the next day, Then the PR is no longer listed as blocked; only currently-blocked PRs appear in the report

---

### Story 3: Weekly Digest Report of All Dependency Vulnerabilities

**Persona:** Security Engineer
**Connects to:** Metric M1 (proactive CVE monitoring)

**As a** Security Engineer **I want** to receive a weekly digest of all known vulnerabilities in the current dependency tree (not just new PRs), grouped by severity, **so that** I can identify dormant vulnerabilities and plan mitigation for the backlog

**MVP Scope items covered:** Scope item 3 (weekly digest report)

**Out of scope:**
- Historical re-scanning of old commits
- Automated ticket creation for each vulnerability (Phase 2)
- Custom suppression rules (Phase 2)

**Assumptions to test:**
- Weekly vulnerability count will be manageable (< 50 total); if higher, digest format needs refinement

**Architecture Constraints:**
- Digest must include: vulnerability package name, current version, available patched version, CVSS score, and advisory URL
- Digest must be grouped by CVSS severity band (Critical, High, Medium, Low)
- Digest must be delivered to security-alerts Slack channel every Monday morning UTC

**Acceptance Criteria:**

1. Given the dependency tree contains known vulnerabilities, When the weekly digest job runs (every Monday), Then a report is generated listing all vulnerabilities in the current lockfile (package-lock.json or equivalent), sorted by CVSS score (highest first)

2. Given a vulnerability can be patched by a dependency version bump, When the digest is generated, Then the report includes the available patched version number and a link to the changelog or advisory

3. Given the digest is sent to Slack, When team members read it, Then the digest clearly distinguishes between: (a) vulnerabilities that can be patched (actionable), (b) vulnerabilities in pre-release or dev-only dependencies (lower priority), and (c) vulnerabilities with no available patch yet (accept risk or upgrade major version)

---

### Story 4: Auto-Remediation Pull Requests for Dependency Patch Updates

**Persona:** Squad Tech Lead
**Connects to:** Metric M1 (automated patch updates reduce exposure window)

**As a** Squad Tech Lead **I want** the system to automatically generate and open PRs that update vulnerable dependencies to their latest patch versions (patch-only; no minor or major version changes) **so that** the engineering team can review and merge patch updates without manual dependency management

**MVP Scope items covered:** Scope item 4 (auto-PR for patch bumps)

**Out of scope:**
- Minor or major version upgrades (require manual review)
- Multi-package coordination (each PR is independent)
- Jira ticket linkage (Phase 2)

**Assumptions to test:**
- Auto-generated patch-only PRs will number fewer than 20 per week; if higher, PR merge cadence may become bottleneck

**Architecture Constraints:**
- Auto-generated PRs must be marked as "auto-generated" (e.g. via PR label or commit convention) so engineers know the source
- Auto-PR must only update patch versions (e.g. 1.2.3 → 1.2.5; never 1.2.3 → 1.3.0)
- Auto-PR must pass the same PR checks as manual PRs (including the dependency scanner from Story 1)

**Acceptance Criteria:**

1. Given a vulnerability can be patched by updating a dependency from version X.Y.Z to version X.Y.Z' (patch-only), When the weekly digest job runs, Then a PR is automatically created with: commit message referencing the CVE, updated lockfile, and a body message summarizing the patched vulnerability

2. Given an auto-generated patch PR is opened, When the PR workflows run, Then the dependency scanner (Story 1) verifies that the patch removes the vulnerability; the PR check passes

3. Given the auto-generated PR passes all checks, When an engineer reviews it, Then the engineer can merge it directly; the patch update is applied to main and the exposure window is reduced

---

## Scope accumulator

**Discovery MVP scope items:**
1. ✅ PR vulnerability scan — covered by Story 1
2. ✅ CVSS ≥ 7.0 merge block — covered by Story 2
3. ✅ Weekly digest report — covered by Story 3
4. ✅ Auto-PR for patch bumps — covered by Story 4

**Technical constraints:**
- ✅ Pipeline timing (< 3 min added to 12-min baseline) — addressed in Story 1 ACs
- ✅ Cost constraint (£3,000/year) — recorded as delivery constraint (tooling plan required, not in story ACs)

**Out-of-scope items correctly excluded:**
- Container image scanning ✅
- Custom CVE suppression rules ✅
- Jira integration ✅
- Historical re-scanning ✅

**Regulated constraints check (Story 5 needed?):** ❌ None
- No process gate (sign-off, certification, approval authority) required in discovery
- No compliance framework mentioned (PCI DSS, AML, FMA, scheme rules, etc.)
- No external approval authority named in any constraint
- Dependency scanning is a technical tooling feature; no regulatory gate applies
- **Result:** No Story 5 (go-live gate) required; no regulated constraints propagated

**Scope drift:** None — all stories map directly to discovery MVP scope
