## Epic: A SaaS-only user can convert a DoR-approved artefact into a real, executing repo

**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A user who has run discovery through DoR entirely in the hosted web-UI SaaS can point the same bootstrap command at their own existing repo, have it fetch their DoR-approved artefact and pipeline-state, and start the inner loop against real, already-approved scope — without ever forking or cloning the platform. Optionally, either bootstrap path (fresh or SaaS-connected) can also install the full outer loop, so future feature cycles beyond the one that triggered the bootstrap can run entirely locally.

## Out of Scope

- The fresh-repo bootstrap mechanism itself (skill copy, registry, harness-agnostic instructions) — delivered by `rb-e1`; this epic only adds the SaaS-fetch wiring and the outer-loop opt-in on top of it.
- Building the SaaS-side export API if it does not already exist — this epic assumes/validates that capability; if it turns out infeasible, this epic's stories should be re-scoped or descoped rather than the platform building a new SaaS feature under this epic's story budget.
- Ongoing update-sync after the SaaS-connected bootstrap completes — same deferral as `rb-e1`, applies here too.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| SaaS-to-inner-loop conversion rate | 0% | ≥ 30% within 7 days of DoR sign-off | This epic is the entire mechanism this metric measures — without it, conversion is definitionally zero |
| Bootstrap-to-first-inner-loop-run time | Not yet established | Under 10 minutes | Confirms the same speed target holds for the SaaS-connected path, not just the fresh-repo path |

## Stories in This Epic

- [ ] rb-s4: Bootstrap an existing repo from a DoR-approved SaaS artefact — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s4-saas-connected-bootstrap.md
- [ ] rb-s5: Optionally install the full outer loop during bootstrap — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Involves authenticating to the SaaS API and handling a real credential — not high-risk enough for full human implementation, but a human should review the credential-handling path before merge given `product/constraints.md` #12 (credentials are structural, never in the agent's environment).

## Complexity Rating

**Rating:** 3

<!-- High ambiguity: depends on an unconfirmed [ASSUMPTION] (does the SaaS have or can it build an export API), which is the single biggest open risk in the whole feature. -->

## Scope Stability

**Stability:** Unstable

<!-- Directly depends on resolving the SaaS-export-API assumption via /clarify; scope here is the most likely to shift of any part of this feature. -->
