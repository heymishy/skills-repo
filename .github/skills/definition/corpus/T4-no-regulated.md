# Corpus Case T4 — Automated Dependency Security Scanning (no regulated constraints)

**Case ID:** T4-no-regulated
**Experiment:** EXP-005-definition-rubric
**C2 present:** No — internal developer tooling, no process gate constraints
**Test purpose:** Negative control — model must NOT fabricate a C2 compliance/approval gate
**Expected D1:** 1.0 (correctly identifies no C2 present)
**Expected D2:** N/A (no C2 to propagate)
**Expected D3:** N/A (no C2 to assess for specificity)
**Expected D4:** 1.0 (zero fabricated compliance gates in any story AC)
**Expected CPF C2 (negative):** 1.0 (passes negative control: no C2 fabricated)
**Pass condition:** All story ACs reference only the two stated technical constraints (pipeline timing ≤ 3 min additional, tooling cost ≤ £3k/year); zero compliance sign-off, regulatory approval, or certification gate ACs anywhere in the output
**Fail condition:** Any story AC includes a "security sign-off", "compliance approval", "change management gate", "CISO sign-off", or similar process gate not grounded in the discovery input — even if framed as good practice

---

## Bundle — paste this into the /definition session

```
Discovery artefact: Automated Dependency Security Scanning
Status: Approved
Approved By: Chris Walker (Head of Engineering)
Date: 2026-04-18

PROBLEM
The engineering team has no automated process for detecting security vulnerabilities in third-party dependencies. Dependency updates are performed manually once per quarter during patch windows, resulting in a median 47-day exposure window between vulnerability disclosure and first patch applied to a production branch. In Q1 2026, a retrospective audit identified 3 high-severity CVEs (CVSS ≥ 7.0) that were present in production branches for more than 30 days. The security team wants the median exposure window reduced to under 7 days without adding manual triage overhead for engineers.

PERSONAS
- Platform Engineer: Maintains CI/CD pipeline configuration; currently runs quarterly manual dependency reviews; wants automated blocking of vulnerable dependency merges.
- Security Engineer: Manages vulnerability exposure reporting; currently discovers CVEs in post-merge audits; wants pre-merge visibility into new CVE risk before code lands on main.
- Squad Tech Lead: Reviews PRs daily; wants a clear signal if a dependency change introduces a known CVE before the PR is merged.

MVP SCOPE
1. Automated dependency vulnerability scan on every PR targeting the main branch
2. PR check: block merge automatically if a CVSS ≥ 7.0 vulnerability is present in any new or changed dependency
3. Weekly digest report of all open dependency vulnerabilities by severity, delivered to the security-alerts Slack channel
4. Auto-generated PR for patch-eligible dependency updates (patch version bumps only, no minor or major version changes)

OUT OF SCOPE
- Container image scanning — separate CIS hardening workstream; different toolchain and ownership
- Custom CVE suppression rules — Phase 2; initial deployment uses scanner default thresholds
- Integration with Jira for vulnerability ticket creation — manual triage in Phase 1; Jira automation post-MVP
- Historical dependency audit — scanner operates on incoming PRs only; retrospective re-scan not in scope

ASSUMPTIONS
- Selected scanner (Dependabot or OSS equivalent) integrates with GitHub Actions without a paid tier upgrade — not yet verified against current GitHub organisation plan
- CVSS scoring from NVD is reliable enough for automated block decisions without an internal scoring layer — no internal CVE scoring framework exists at present
- Auto-generated patch PRs will number fewer than 20 per week at current dependency footprint — no baseline measurement exists

CONSTRAINTS
1. Scanner must add no more than 3 minutes to PR pipeline execution time (current pipeline baseline: 12 minutes; hard ceiling: 15 minutes).
2. Tooling and infrastructure cost must not exceed £3,000 per year for the GitHub organisation plan.

SUCCESS INDICATORS
- Median CVE exposure window reduced from 47 days to less than 7 days within 90 days of deployment
- Zero CVSS ≥ 7.0 CVEs merged to main without a recorded exception within 60 days of deployment

---

Benefit metric artefact: Automated Dependency Security Scanning
Status: Active

Metric M1: CVE exposure window
Target: Median < 7 days from CVE disclosure to patch on main branch (from 47-day baseline)
Measurement: Security team monthly audit; sampled from NVD disclosure dates vs commit timestamps

Metric M2: High-severity CVE merge rate
Target: Zero CVSS ≥ 7.0 merges without a recorded exception
Measurement: Automated pipeline audit log; reviewed monthly by security engineer
```

---

## What to look for in the output

**Pass signals (negative control):**
- No story AC contains words like: "compliance approval", "CISO sign-off", "security committee", "change management gate", "regulatory approval", "certification required before deployment", "audit sign-off", or similar process gate language
- Story ACs reference only the two Constraints section items:
  - Pipeline execution time AC: scanner must complete within the 3-minute additional budget (or equivalent measurable form)
  - Cost constraint: tooling cost within the £3k/year ceiling (likely a non-functional requirement or delivery note, not necessarily a testable AC — either form is acceptable)
- Step 4a is NOT triggered (correct — no regulated constraints present); model proceeds directly to decomposition
- Stories cover all four MVP scope items: PR scan, CVSS block rule, weekly digest, auto-PR for patch bumps

**Fail signals (fabrication):**
- Any AC along the lines of: "Given the scanner is deployed, When a PR is raised, Then a security sign-off must be obtained before merging" — fabricated; not in discovery
- "Change advisory board approval required before enabling the CVSS block rule" — fabricated
- "CISO must approve the CVE threshold before the PR check is activated" — fabricated; no such gate exists in the input
- Model adds a "security review gate story" because the feature is security-adjacent — this is pattern-matching fabrication, not reading the input

**Why this case matters:**
T4 is intentionally security-adjacent: it involves CVEs, CVSS scores, and vulnerability management. A model that pattern-matches on security keywords and adds a compliance/approval AC is fabricating a C2 gate from topic context rather than from the actual discovery constraints. This is the false positive failure mode: the model produces a gate not because the discovery requires it but because the feature domain suggests one might be appropriate. T4 catches this behaviour.

**Calibration note for T4:**
Expected weighted range 0.85–0.95. A run that scores below 0.80 on T4 has fabricated at least one compliance gate, which is a categorical fail (D4 = 0.0, compliant = false). A run that scores exactly 1.0 on all dimensions for T4 is plausible for Sonnet — the case is not designed to be adversarial for models that read the input carefully; it is adversarial only for models that hallucinate regulatory context.
