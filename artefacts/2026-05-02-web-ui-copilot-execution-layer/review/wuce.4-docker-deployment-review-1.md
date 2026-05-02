# Review Report: Self-hosted deployment support (Docker + environment-variable config injection) — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.4-docker-deployment.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[4-M1]** [B — Scope integrity] — AC7 creates scope tension with the Out of Scope section. The Out of Scope section explicitly states: "Kubernetes Helm chart, Terraform module, or cloud-provider-specific deployment templates — acceptable as post-launch additions; Docker + docker-compose is the scope of this story." AC7 references "a container platform that supports replica configuration" and "a deployment manifest" — language that implies Container Apps, AKS, or Kubernetes, all of which fall under "cloud-provider-specific deployment templates" already deferred. The intent of AC7 (prevent cold-start UX degradation via min-replica=1 guidance) is sound and was explicitly added pre-review; the framing as a testable AC for a docker-compose-scoped story creates a testing gap.
  Fix (either option): (a) Add a scope note in the Out of Scope section — "Container Apps / Kubernetes minimum-replica guidance (AC7) is included as deployment configuration guidance for container-orchestration targets; it is not a docker-compose-testable AC and must be verified manually against the target platform." Or (b) Move AC7 to the NFRs section as "Deployment platform guidance: when deploying to a container platform with scale-to-zero capability, the deployment manifest must specify minimum replica = 1; recommended default, operator may override."

---

## LOW findings — note for retrospective

- **[4-L1]** [C — AC quality] — AC7's Given/When/Then is conditionally framed ("Given the application is deployed to a container platform that supports replica configuration") — this makes automated verification impossible within the docker-compose scope of this story. If 4-M1 is resolved by moving AC7 to NFRs, this LOW dissolves. If AC7 remains as an AC with an updated scope note, the test plan must flag it as manual-verification-only.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 4 | PASS | All references present. Benefit Linkage names M2 with mechanism sentence (enterprise deployment blocker — organisational adoption pre-condition). "So that…" is feature-functional; fully compensated by Benefit Linkage. |
| B — Scope integrity | 3 | PASS | AC7 creates scope tension with the deferred out-of-scope list (MEDIUM above). All other ACs (AC1–AC6) are squarely within docker-compose scope. No other violations. |
| C — AC quality | 4 | PASS | AC1–AC6 are in Given/When/Then format with observable, testable outcomes. Security ACs cover layer inspection (AC4), non-root (AC5), missing env var (AC2), and Enterprise Server URL override (AC3). AC7 conditional framing caveat (LOW above). |
| D — Completeness | 5 | PASS | All mandatory fields. Named persona (platform operator / DevOps engineer), mechanism sentence, complexity 1, scope stability Stable. Accessibility explicitly "Not applicable" with rationale — correct for a deployment infrastructure story. |
| E — Architecture | 5 | PASS | ADR-004 correctly applied (environment variables, not context.yml — this is the correct formulation that wuce.1 should align to). ADR-012 (Enterprise Server hostname configurable via env var). Mandatory security constraints: non-root user, no secrets in build args or image layers. No CDN/external issues (N/A). |

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome: PASS** — No HIGH findings. Proceed to /test-plan after resolving or acknowledging 4-M1 via /decisions. Note that 4-M1 resolution also dissolves 4-L1.

Category E is the strongest aspect of this story — ADR-004 is applied correctly (environment variables) and provides the reference pattern that wuce.1 must match (see 1-M1 in wuce.1 review).
