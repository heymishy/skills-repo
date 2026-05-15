# Definition Output — T4 (CI/CD Vulnerability Scanning — Negative Control) — Trial 2
**Case ID:** T4-negative-control
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "CI/CD Dependency Vulnerability Scanning — Automated Supply Chain Security" — Status: Approved
✅ Benefit-metric artefact found: "CI/CD Dependency Scanning"
✅ Metrics with targets: 2 (M1: mean time from CVE publication to merge block < 48 hours; M2: zero high/critical CVEs in dependencies reaching production undetected)

---

## Step 4a — Regulated constraint propagation check

**Scanning all discovery sections — Constraints section and Background narrative...**

**Constraints section:**
- "Scanner must not introduce build latency exceeding 90 seconds" — technical engineering constraint, not a regulatory or contractual gate
- "False positive rate must remain below 5% — suppress known non-exploitable findings" — technical quality threshold, not a process gate

**Background narrative scan:**
Background narrative describes internal engineering motivation: reducing dependency on manual security reviews, improving developer experience, and reducing CVE exposure window. Language is entirely technical. No references to regulatory frameworks, standards bodies, external approving authorities, scheme certification requirements, contractual obligations, or activation gates requiring third-party sign-off.

**Regulated constraint check result:**

**No regulated constraints detected.**

No regulatory, legal, or contractual process gate was identified in either the Constraints section or the Background narrative. The feature is a pure technical implementation. All stories will have technical ACs only.

**NFRs noted (non-regulated):**
- Build latency: scanner must not add > 90 seconds to CI pipeline duration
- False positive rate: suppress known non-exploitable findings, false positive rate < 5%

These are implementation quality thresholds, not process gates. No constraint propagation required.

✅ **Step 4a complete — no regulated constraints detected**

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. No guardrails applicable.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Vertical slice
**Rationale:** The scanning feature is fully additive — it does not modify existing build behaviour and has no external dependencies. A vertical slice delivers working scanner integration as early as possible (Story 1), adds the merge-blocking enforcement layer (Story 2), and completes the workflow with the weekly digest (Story 3) and auto-PR remediation (Story 4). Each story delivers independent, observable CI value.

---

## Step 3 — Epic structure

**Single epic: CI/CD Dependency Vulnerability Scanning**
- **Stories:** 4 stories
- **Rationale:** Small, self-contained CI feature. Single epic with clean story boundaries — scan, enforce, report, remediate.

---

## Stories

### Story 1: Dependency Vulnerability Scan on Every PR

**Persona:** Developer
**Connects to:** Metric M2 (scan on every PR ensures no CVE reaches production without being surfaced during review)

**As a** Developer **I want** the CI pipeline to run a dependency vulnerability scan on every pull request and report scan findings in the PR check results **so that** I can see which dependencies carry known CVEs before merging, and the security team has a consistent scan baseline across all changes

**MVP Scope items covered:** Dependency scanning per PR (scope item 1)

**Out of scope:**
- Container image scanning
- SAST (static analysis)
- License compliance scanning
- Scanning on push to branch without a PR
- Results storage / scan history

**Assumptions to test:**
- CI runner has network access to the CVE database the scanner uses
- The chosen scanner produces machine-readable output (JSON) that can be parsed for merge block logic in Story 2

**Architecture Constraints:**
- Scanner must not add more than 90 seconds to the total CI pipeline wall-clock duration
- Scanner must produce a machine-readable output file (JSON format) alongside the PR check report
- Scanner version must be pinned in CI configuration — no floating version tags

**Acceptance Criteria:**

1. Given a pull request is opened or updated, When the CI pipeline runs, Then the dependency scanner executes as part of the CI checks, completes within 90 seconds, and the scan result (pass, findings summary) appears in the PR checks UI

2. Given the scanner runs on a PR, When findings are generated, Then a machine-readable scan report is written to the CI artefact store with: dependency name, CVE ID, CVSS score, severity level, fixed-in version (if available) — one entry per finding

3. Given a pull request contains a dependency that has no known CVEs, When the scan completes, Then the PR check shows "Scan passed — no vulnerabilities detected" and the CI pipeline continues without blocking

---

### Story 2: Merge Block on High and Critical CVEs

**Persona:** Developer
**Connects to:** Metric M1 (merge block is the enforcement mechanism — without it, CVEs are surfaced but not acted on within the 48-hour window)

**As a** Developer **I want** the CI pipeline to block merges on any pull request that introduces a new high or critical CVSS severity CVE in a direct dependency **so that** high and critical vulnerabilities cannot reach the main branch without an explicit security review exception

**MVP Scope items covered:** Merge block on high/critical CVE (scope item 2)

**Out of scope:**
- Blocking on transitive dependency CVEs (MVP: direct dependencies only)
- Blocking on medium/low severity CVEs
- Auto-closing PRs
- Real-time CVE database push notification
- Merge block override with expiry

**Assumptions to test:**
- CI platform supports required checks as blocking merge requirements
- CVSS score is reliably available in the scanner's machine-readable output

**Architecture Constraints:**
- Merge block must use CI platform's required status check mechanism — no workarounds (e.g. PR labels) that can be bypassed
- Block reason must be surfaced in the PR check UI with CVE ID, CVSS score, and affected dependency
- A security team maintainer exception path must be available (explicit override with audit log entry)

**Acceptance Criteria:**

1. Given a pull request introduces a dependency with a CVE with CVSS score ≥ 7.0 (high or critical), When the CI scan completes, Then the merge button is disabled, the blocking check shows the CVE ID, CVSS score, and affected dependency name, and no reviewer can merge the PR until the exception path is used or the dependency is updated

2. Given a pull request has triggered a merge block and a security team maintainer applies the exception override, When the override is applied, Then an audit log entry is created with: overrider identity, timestamp, CVE IDs exempted, and justification — and the PR is allowed to merge

3. Given a pull request introduces only medium or low severity CVEs (CVSS < 7.0), When the CI scan completes, Then findings are reported in the scan artefact and the PR check shows a warning annotation — but the merge button remains enabled and the PR is not blocked

---

### Story 3: Weekly CVE Digest for Active Dependencies

**Persona:** Security Engineer
**Connects to:** Metric M1 (weekly digest surfaces CVEs that were not caught at PR time — e.g. newly-published CVEs for dependencies that merged before the CVE was listed)

**As a** Security Engineer **I want** an automated weekly report of all CVEs newly published against the project's current direct dependency set since the last digest, delivered to the security review channel **so that** the security team can act on post-merge CVE disclosures without waiting for a code change to trigger a PR scan

**MVP Scope items covered:** Weekly CVE digest (scope item 3)

**Out of scope:**
- Per-developer CVE notification
- SLA auto-enforcement from digest findings
- Digest delivery to channels other than the configured security review channel
- CVE trend analysis or historical comparison

**Assumptions to test:**
- Scheduled CI job is available on the CI platform for weekly digest trigger
- CVE database query is feasible for the full direct dependency set within the CI job timeout

**Architecture Constraints:**
- Digest job is triggered by CI schedule (cron expression), not by a code push
- Digest must be idempotent — running twice in the same week produces a single report
- Digest delivery failure (channel unavailable) must not silently succeed — a failed delivery must produce a CI job failure alert

**Acceptance Criteria:**

1. Given the weekly scheduled digest job runs, When the CVE database is queried for all direct dependencies, Then a digest report is generated listing: CVE ID, affected dependency, CVSS score, severity, published date — for every CVE newly published since the prior digest run, and the report is delivered to the configured security review channel

2. Given no new CVEs have been published for the project's direct dependencies since the last digest, When the scheduled job runs, Then a "no new CVEs this week" summary is delivered to the channel — no empty message or silent success

3. Given the digest report is generated and channel delivery fails, When the delivery attempt times out or returns an error, Then the CI scheduled job exits with a non-zero status code, triggering a CI failure alert — no silent delivery failure

---

### Story 4: Automated Dependency Update PR on New High/Critical CVE

**Persona:** Developer
**Connects to:** Metric M1 (automated PR creation reduces the time between CVE publication and merge block resolution — if a fix version exists, the team does not need to manually author the update)

**As a** Developer **I want** the dependency scanner to automatically open a pull request proposing an update to a patched version when a new high or critical CVE is detected in a current dependency and a fixed version exists **so that** the remediation path is ready for review within the 48-hour CVE-to-merge-block target, with no manual triage step required

**MVP Scope items covered:** Automated remediation PR (scope item 4)

**Out of scope:**
- Automated merge of the remediation PR (human review required)
- Remediation PR for transitive dependencies
- Remediation PR when no fixed version is available
- Multiple remediations batched into a single PR
- Dependency update testing (beyond passing CI on the PR itself)

**Assumptions to test:**
- The package ecosystem's fixed-version metadata is reliably present in the scanner output for the majority of CVEs
- One CVE per PR is the correct granularity (alternative: batch per-dependency)

**Architecture Constraints:**
- Automated PRs must be created with a machine identity (bot account), not a personal developer token
- Each automated PR must include: CVE ID, CVSS score, affected version, proposed fix version, and link to CVE detail — in the PR description
- No PR is created when no patched version is available — scanner must check before attempting PR creation

**Acceptance Criteria:**

1. Given a new high or critical CVE is detected in a direct dependency during a scheduled or PR-triggered scan, When a fixed version for the affected dependency is available in the package registry, Then an automated PR is created within 2 hours of CVE detection, proposing the update to the fixed version, with the CVE ID, CVSS score, affected version, and fixed version in the PR description

2. Given the automated PR is created, When the CI pipeline runs against the automated PR, Then the scan result on the automated PR shows the CVE is resolved in the proposed fix version, and the merge block (from Story 2) is not triggered for the fixed dependency

3. Given a high or critical CVE is detected but no fixed version is available, When the scanner evaluates the finding, Then no automated PR is created, and the finding is recorded in the next weekly digest (Story 3) as an unresolvable CVE pending a patched release

---

## Step 4a final verification

No regulated constraints were present in the discovery artefact. All stories have technical ACs only. No compliance gate, certification requirement, regulatory sign-off, or external approving authority appears in any story. Step 4a result confirmed: clean.

✅ **Regulated constraint check: no constraints detected — correct negative result**

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: mean time CVE publication to merge block < 48h | Story 2 (merge block — enforcement mechanism), Story 4 (automated PR — reduces manual triage time) |
| M2: zero high/critical CVEs reaching production undetected | Story 1 (per-PR scan — detection mechanism), Story 2 (merge block — prevention mechanism), Story 3 (weekly digest — post-merge detection) |

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. Per-PR dependency scan — Story 1 ✅
2. Merge block on high/critical CVE — Story 2 ✅
3. Weekly CVE digest — Story 3 ✅
4. Automated remediation PR — Story 4 ✅

**Stories written:** 4
**Coverage:** 4/4 MVP items
**Scope additions:** 0
**Scope ratio:** 4/4 = 1.0 — clean 1:1 match

✅ **Scope check passed** — all 4 MVP scope items mapped 1:1 to stories. No scope additions. No regulated constraints. Zero compliance gates.

---

## Definition complete ✅

Epics: 1
Stories: 4
Slicing strategy: Vertical slice
Scope check: ✅ Clean (4/4)
Regulated constraint check: ✅ No regulated constraints detected — correct negative result confirmed for both Constraints section and Background narrative
