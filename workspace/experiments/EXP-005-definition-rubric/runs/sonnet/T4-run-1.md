# Definition Output — T4 (CI/CD Vulnerability Scanning — Negative Control)
**Case ID:** T4-negative-control
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "CI/CD Dependency Vulnerability Scanning" — Status: Approved
✅ Benefit-metric artefact found: "CI/CD Dependency Vulnerability Scanning"
✅ Metrics with targets: 2 (M1: CVE exposure window < 7 days from disclosure to remediation PR; M2: zero CVSS ≥7.0 vulnerabilities merged to main without documented exception)

---

## Step 4a — Regulated constraint propagation check

**Scanning all discovery sections for regulated constraints — including Background narrative...**

**Constraints section review:**
- "Pipeline timing limit: scanner must add ≤3 minutes to the existing 12-minute pipeline baseline" — technical performance constraint, not a process gate
- "Cost ceiling: scanning tooling must not exceed £3,000 per year in licensing/SaaS fees" — budget constraint, not a process gate

**Background narrative scan:**
Reviewing narrative for language indicating external compliance frameworks, regulatory obligations, legal obligations, contractual process gates, third-party assessment requirements, or sign-off language...

No regulatory frameworks mentioned (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, etc.)
No external approval requirements
No certification language
No "must obtain sign-off", "required before activation", "contractual obligation" language

**Result: No regulated constraints detected.**

This is an internal engineering quality improvement feature. The constraints are:
- A pipeline timing budget (technical)
- An annual cost ceiling (budget)

Neither is a regulated constraint, a process gate, or a legal obligation. No regulated constraint propagation is required. Step 4a is complete with no action.

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. Proceeding without guardrail check.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice
**Rationale:** CI/CD vulnerability scanning is a well-understood engineering tooling integration with no significant technical unknowns. Each story delivers a complete, independently testable capability that adds immediate value. Vertical slicing allows the highest-value capability (PR scan with merge block) to ship first and start measuring M2, while the weekly digest and auto-PR features are independent follow-on slices.

---

## Step 3 — Epic structure

**Single epic: CI/CD Dependency Vulnerability Scanning**
- **Stories:** 4 stories
- **Rationale:** Four tightly related engineering tooling stories — scan at PR, block on critical CVE, weekly digest for visibility, and auto-PR for automated remediation. Single epic; all within pipeline and dependency management scope.

---

## Stories

### Story 1: PR Dependency Vulnerability Scan

**Persona:** Platform Engineer
**Connects to:** Metric M1 (PR scan is the detection mechanism — scanning at PR time is the only way to achieve < 7-day exposure window from disclosure to remediation start)

**As a** Platform Engineer **I want** dependency vulnerabilities to be automatically scanned at pull request creation and report results in the PR **so that** developers receive immediate feedback on newly introduced vulnerabilities and the engineering team can begin remediation before merging

**MVP Scope items covered:** PR dependency vulnerability scan (scope item 1)

**Out of scope:**
- Repository-level scanning outside the PR flow (addressed by weekly digest — Story 3)
- Container image scanning
- SAST (static analysis) — separate tooling
- Scanning of transitive dependencies beyond 3 levels deep (post-MVP)

**Assumptions to test:**
- The chosen scanning tool integrates with the existing CI/CD pipeline without requiring a pipeline architecture change
- Scan time for the largest repository adds ≤3 minutes to pipeline run time

**Architecture Constraints:**
- Scanner must run within the existing CI/CD pipeline framework — no additional CI infrastructure required
- Scanner output must be parseable by downstream CI steps (merge block story) — standardised SARIF or JSON format
- Total pipeline time addition must not exceed 3 minutes at p95

**Acceptance Criteria:**

1. Given a pull request is opened or updated against the main branch, When the CI pipeline runs the vulnerability scan, Then the scan completes within 3 minutes, and the results (CVE IDs, severity scores, affected packages) are posted as a PR comment or CI check annotation visible to the reviewer

2. Given a pull request introduces a dependency with a known CVE at any severity level, When the scan completes, Then the scan result includes the CVE ID, CVSS score, affected package and version, and a link to the CVE advisory

3. Given a pull request introduces no dependencies with known CVEs, When the scan completes, Then the CI check passes with a "No vulnerabilities found" status and the PR is not blocked

---

### Story 2: CVSS ≥7.0 Merge Block

**Persona:** Platform Engineer
**Connects to:** Metric M2 (merge block is the enforcement mechanism — M2 requires zero CVSS ≥7.0 merges without documented exception)

**As a** Platform Engineer **I want** pull requests that introduce dependencies with CVSS score ≥7.0 to be blocked from merging to main until the vulnerability is remediated or a documented exception is approved **so that** critical and high-severity vulnerabilities cannot enter the main branch without a deliberate decision, satisfying the M2 zero-tolerance target

**MVP Scope items covered:** CVSS ≥7.0 merge block (scope item 2)

**Out of scope:**
- Severity-tiered blocking below CVSS 7.0 (post-MVP policy extension)
- Automated exception approval workflow
- Cross-repository policy enforcement
- Waiver tracking dashboard

**Assumptions to test:**
- Branch protection rules can be configured to fail on the vulnerability scan CI check
- Exception process (what constitutes a "documented exception") is defined by the security team before Story 2 ships

**Architecture Constraints:**
- CVSS ≥7.0 block must be enforced at the repository branch protection level — not only by CI annotation
- Exception documentation must be a named artefact (PR comment with approver identity and rationale, or equivalent)
- The block threshold (CVSS 7.0) must be configurable without a code deployment

**Acceptance Criteria:**

1. Given a pull request introduces a dependency with CVSS score ≥7.0, When the vulnerability scan CI check completes, Then the CI check returns a failure status, the merge button is blocked by branch protection, and the PR comment includes the specific CVE ID, CVSS score, and remediation options

2. Given a pull request with a CVSS ≥7.0 finding has a documented exception (a PR comment from a designated approver with rationale), When the exception is recorded and the CI check is manually approved by the designated approver, Then the merge block is lifted for that specific PR and the exception record is preserved in the PR history

3. Given a pull request introduces a dependency with CVSS score 6.9 or below, When the vulnerability scan CI check completes, Then the CI check passes (no merge block), and the low/medium severity finding is reported as an informational annotation only

---

### Story 3: Weekly Vulnerability Digest

**Persona:** Engineering Lead
**Connects to:** Metric M1 (weekly digest surfaces CVE exposure window — identifies vulnerabilities present in the main branch beyond the 7-day target window)

**As an** Engineering Lead **I want** a weekly automated report of all dependencies with known CVEs currently present in the main branch, grouped by severity and age **so that** the engineering team can identify and prioritise remediation for vulnerabilities that entered before the PR scan was implemented, and track progress toward the < 7-day exposure window target

**MVP Scope items covered:** Weekly vulnerability digest (scope item 3)

**Out of scope:**
- Real-time vulnerability monitoring dashboard
- Per-developer vulnerability attribution
- Digest delivery to channels other than email/Slack (post-MVP)
- Trend analysis or SLA tracking dashboard

**Assumptions to test:**
- A digest delivery mechanism (email or Slack integration) is available without additional infrastructure
- Scanning the main branch weekly is sufficient for the exposure window measurement use case

**Architecture Constraints:**
- Digest generation must run as a scheduled CI job — no additional infrastructure
- Digest must include: CVE ID, CVSS score, affected package, time since CVE disclosure (exposure window metric input), and suggested remediation action
- Digest delivery must not fail silently — a delivery failure must create a CI alert

**Acceptance Criteria:**

1. Given the weekly digest CI job runs on schedule, When the main branch is scanned, Then a digest report is generated listing all CVEs present, grouped by CVSS severity band (critical ≥9.0, high 7.0–8.9, medium 4.0–6.9, low <4.0), with CVE ID, affected package, and days since CVE disclosure

2. Given the digest report is generated, When it is delivered to the configured channel (email or Slack), Then delivery is confirmed with a delivery receipt, and a failure to deliver creates a CI failure notification within 10 minutes

3. Given the same CVE appears in the digest for more than 7 consecutive days, When the weekly digest runs, Then the CVE is flagged with an "exposure window exceeded" label in the digest report (for manual action — not an automated block)

---

### Story 4: Automated Patch Pull Request

**Persona:** Platform Engineer
**Connects to:** Metric M1 (automated patch PR reduces exposure window — a bot-created PR reduces time from CVE detection to remediation start from days to hours)

**As a** Platform Engineer **I want** the vulnerability scanning system to automatically create a pull request proposing a dependency version upgrade when a CVE is detected in the weekly scan **so that** the engineering team's remediation lead time is reduced from discovery to open PR, shortening the exposure window toward the < 7-day target

**MVP Scope items covered:** Automated patch pull request (scope item 4)

**Out of scope:**
- Automated merging of patch PRs (human review required — not in scope)
- Major version upgrade automation (minor and patch versions only)
- Multi-package coordinated upgrade (e.g. cascading transitive dependency updates — post-MVP)
- Patch PR for CVEs with no available fix version

**Assumptions to test:**
- The package manager (npm/pip/maven etc.) provides a programmatic way to identify the nearest non-vulnerable version for a given package and CVE
- Automated patch PRs will not be blocked by the CVSS ≥7.0 merge block (they are remediation PRs — scan should detect that the patch resolves the CVE)

**Architecture Constraints:**
- Automated patch PRs must be opened by a dedicated bot account — not a developer account
- PR title and body must include: CVE ID, current version, proposed version, CVSS score, and a link to the advisory
- Automated patch PRs must target the main branch and follow existing branch protection rules (PR scan + CVSS block apply)

**Acceptance Criteria:**

1. Given the weekly vulnerability scan detects a CVE with a available remediation version, When the automated patch job runs, Then a pull request is created within 2 hours of scan completion, with the title format "fix(deps): patch [package-name] [current] → [fixed] (CVE-XXXX-XXXXX)" and the body containing CVE ID, CVSS score, and link to advisory

2. Given an automated patch PR is created for a CVE, When the PR's own vulnerability scan runs, Then the scan confirms the patched version resolves the CVE and the CI check passes (no blocking finding for the same CVE)

3. Given a CVE has no available fix version in the package registry, When the weekly scan detects the CVE, Then no automated patch PR is created, and the CVE is flagged in the weekly digest as "no fix available" for manual tracking

---

## Step 4a verification — no regulated constraints

**Result:** No regulated constraints detected in any discovery section. No Architecture Constraints related to regulated process gates. No process gate ACs in any story. Step 4a confirmed clean.

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: CVE exposure window < 7 days | Story 1 (PR scan detects at introduction), Story 3 (weekly digest measures window in main branch), Story 4 (auto-PR reduces remediation lead time) |
| M2: Zero CVSS ≥7.0 merges without exception | Story 2 (merge block enforces this directly) |

No metric gaps detected. All stories trace to at least one metric.

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. PR dependency vulnerability scan — Story 1 ✅
2. CVSS ≥7.0 merge block — Story 2 ✅
3. Weekly vulnerability digest — Story 3 ✅
4. Automated patch pull request — Story 4 ✅

**Stories written:** 4
**Coverage:** 4/4 MVP items covered
**Scope additions:** 0
**Scope ratio:** 4/4 = 1.0 — exact coverage, no additions, no unexplained stories

✅ **Scope check passed** — 4 stories covering 4 MVP items exactly. No scope additions.

---

## Definition complete ✅

Epics: 1
Stories: 4
Slicing strategy: Vertical slice
Scope check: ✅ Perfect 1:1 coverage
Regulated constraint check: ✅ No regulated constraints detected — Step 4a returned clean. No process gates, sign-off requirements, or compliance ACs fabricated. All ACs are technical and observable.
