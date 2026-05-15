# Definition Output — T4 (CI/CD Dependency Scanning — No Regulated Constraints) — Trial 2
**Case ID:** T4-no-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Trial:** 2
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Automated Dependency Security Scanning" — Status: Approved
✅ Benefit-metric artefact found: "Automated Dependency Security Scanning"
✅ Metrics with targets: 2 (M1: CVE exposure window < 7 days; M2: zero CVSS ≥7.0 merges without exception)

---

## Step 4a — Regulated constraint propagation check

**Constraint analysis:**

✅ **No regulated constraints detected**

1. **Constraint 1 (Technical):** Scanner adds no more than 3 minutes to PR pipeline (baseline 12 min; ceiling 15 min)
2. **Constraint 2 (Technical):** Tooling cost must not exceed £3,000 per year

**Result:** No C2 (process gate) or C3 (compliance/retention) constraints. No external approval authority, certification requirement, or compliance gate mentioned in discovery, narrative, or background.

**Step 4a result:** No regulated constraints; proceed directly to decomposition. No Step 5 (go-live gate story) required.

---

## Step 2 — Slicing strategy

**Strategy chosen:** User journey
**Rationale:** Dependency scanning follows the engineer's interaction path (commit → PR → scan → merge decision → digest); this sequence validates end-to-end value at each step.

---

## Step 3 — Epic structure

**Epic: Automated Dependency Vulnerability Scanning for CI/CD**
- **Stories:** 4 stories
- **Rationale:** Dependency scanning is cohesive through PR checks, policy enforcement, reporting, and auto-remediation; all stories are tightly coupled through the vulnerability detection infrastructure.

---

## Stories

### Story 1: PR Vulnerability Scan and Check Integration

**Persona:** Platform Engineer
**Connects to:** Metric M1 (faster CVE detection) + Metric M2 (block high-severity CVE merge)

**As a** Platform Engineer **I want** a GitHub Actions check that runs an automated dependency vulnerability scan on every PR and blocks merge if a CVSS ≥ 7.0 vulnerability is introduced **so that** high-severity CVEs cannot be merged to main

**MVP Scope covered:** PR vulnerability scan + CVSS ≥ 7.0 merge block

**Out of scope:** Container image scanning, custom CVE suppression rules, Jira integration, historical audit

**Architecture Constraints:**
- Scanner adds no more than 3 minutes to pipeline (total < 15 minutes)
- Scan on every PR; no false negatives acceptable
- Automatic merge block (no manual override for CVSS ≥ 7.0)

**Acceptance Criteria:**

1. Given a PR targets main, When PR workflows run, Then dependency vulnerability scan executes within 3 minutes; total pipeline does not exceed 15 minutes

2. Given a PR introduces a CVSS ≥ 7.0 vulnerability, When scan completes, Then GitHub check fails, PR is blocked from merging, and check includes link to CVE details

3. Given a PR updates a dependency to remove CVSS ≥ 7.0 vulnerability, When scan completes, Then check passes and PR can merge

---

### Story 2: Merge Block Policy and High-Severity CVE Reporting

**Persona:** Security Engineer
**Connects to:** Metric M1 (visibility into CVE risk) + Metric M2 (zero high-severity CVEs)

**As a** Security Engineer **I want** automatic merge block enforcement for CVSS ≥ 7.0 vulnerabilities and a daily summary report of blocked merges **so that** I have visibility into CVE risk and can track exposure trends

**MVP Scope covered:** CVSS ≥ 7.0 merge block enforcement

**Out of scope:** Custom suppression rules, manual override workflows, Jira integration

**Architecture Constraints:**
- Merge block enforced at GitHub branch protection rule level
- Policy applies to all branches targeting main
- Daily report delivered to security-alerts Slack

**Acceptance Criteria:**

1. Given a PR is blocked on CVSS ≥ 7.0, When a developer attempts merge, Then branch protection prevents it; no bypass without admin approval

2. Given multiple PRs are blocked on a day, When daily report is generated, Then report includes: number of blocked PRs, vulnerable packages, CVSS scores, link to each PR

3. Given a blocked PR is unblocked (vulnerability patched), When report generates next day, Then PR no longer listed as blocked; only currently-blocked PRs appear

---

### Story 3: Weekly Digest Report of All Dependency Vulnerabilities

**Persona:** Security Engineer
**Connects to:** Metric M1 (proactive CVE monitoring)

**As a** Security Engineer **I want** a weekly digest of all known vulnerabilities in the current dependency tree, grouped by severity **so that** I can identify dormant vulnerabilities and plan backlog mitigation

**MVP Scope covered:** Weekly digest report

**Out of scope:** Historical re-scanning, automated ticket creation, custom suppression

**Architecture Constraints:**
- Digest includes: package name, current version, available patched version, CVSS, advisory URL
- Grouped by CVSS severity (Critical, High, Medium, Low)
- Delivered to security-alerts Slack every Monday morning UTC

**Acceptance Criteria:**

1. Given the dependency tree contains known vulnerabilities, When weekly digest runs (Monday), Then report lists all vulnerabilities in current lockfile, sorted by CVSS (highest first)

2. Given a vulnerability has available patch version, When digest is generated, Then report includes patched version and changelog link

3. Given digest is sent to Slack, When team reads it, Then it distinguishes between: (a) actionable (patchable), (b) dev-only/pre-release (lower priority), (c) no patch available (accept risk or major upgrade)

---

### Story 4: Auto-Remediation Pull Requests for Dependency Patch Updates

**Persona:** Squad Tech Lead
**Connects to:** Metric M1 (automated patches reduce exposure window)

**As a** Squad Tech Lead **I want** automatic PR generation for patch-only dependency updates (no minor/major version bumps) **so that** engineers can review and merge patches without manual dependency management

**MVP Scope covered:** Auto-PR for patch-eligible updates

**Out of scope:** Minor/major version upgrades, multi-package coordination, Jira linkage

**Architecture Constraints:**
- Auto-generated PRs marked as "auto-generated" (label or commit convention)
- Patch-only updates only (X.Y.Z → X.Y.Z'; never X.Y.Z → X.Y+1.0)
- Auto-PR must pass the same PR checks as manual PRs (including dependency scanner)

**Acceptance Criteria:**

1. Given a patch-only dependency update is available, When weekly digest runs, Then a PR is created with: CVE reference in commit message, updated lockfile, summary in PR body

2. Given an auto-generated patch PR is opened, When PR workflows run, Then dependency scanner verifies patch removes vulnerability; PR check passes

3. Given auto-generated PR passes all checks, When engineer reviews it, Then engineer can merge directly; patch is applied to main and exposure window reduced

---

## Scope accumulator

**MVP scope coverage:**
1. ✅ PR vulnerability scan → Story 1
2. ✅ CVSS ≥ 7.0 merge block → Story 2
3. ✅ Weekly digest report → Story 3
4. ✅ Auto-PR for patch bumps → Story 4

**Technical constraints:**
- ✅ Pipeline timing (< 3 min scanner budget to stay within 15-min total) → Story 1 ACs
- ✅ Cost constraint (£3,000/year) → recorded as delivery constraint (not in story ACs)

**Out-of-scope correctly excluded:**
- Container image scanning ✅
- Custom CVE suppression rules ✅
- Jira integration ✅
- Historical re-scanning ✅

**Regulated constraints check:** ❌ None
- No process gate (sign-off, certification, approval authority) in discovery
- No compliance framework mentioned
- No external approval authority named
- Dependency scanning is technical tooling; no regulatory gate applies
- **Result:** No Story 5 (go-live gate) required; no regulated constraints in output

**Scope drift:** None
