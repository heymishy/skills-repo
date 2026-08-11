## Epic: Tech leads can add or edit a guardrail/standard from the web UI, gated by PR review

**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A tech lead can write a new guardrail or standard, or edit an existing one, directly from the web UI — the platform creates a branch, commits the change, and opens a PR against the tenant's connected repo, surfacing pending/merged state back in the UI. This closes the gap `smug-s1` deliberately deferred ("create one via the API"), and does so consistent with this platform's own governance model (PR review, not direct-commit).

## Out of Scope

- **Promotion to org level** — Epic 3. This epic only covers editing within the repo the content already belongs to (product repo or org repo, whichever the operator is editing).
- **Merging the PR from within the web UI** — the PR is opened and its state surfaced; actually approving/merging happens on GitHub (or wherever the tenant's PR review process lives), not inside this platform's UI.
- **Direct-commit fallback for any tenant** — rejected in `decisions.md`'s ARCH entry #3; PR-gated only, no configurable bypass in this epic.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Guardrail/standard visibility in the web UI | 0% | 100% of active products render a populated view | Indirectly — a populated view is more likely once tenants can actually add content through the UI rather than only via a pre-existing repo state |

## Stories in This Epic

- [ ] Create/edit form for a guardrail or standard — story-slug: `wugs-s5`
- [ ] Branch + PR creation adapter against the tenant's repo — story-slug: `wugs-s6`
- [ ] Surface pending/merged PR state in the guardrails/standards view — story-slug: `wugs-s7`

## Human Oversight Level

**Oversight:** High
**Rationale:** This epic writes to a tenant's real, external GitHub repo on their behalf (creating branches, committing files, opening PRs) — the highest-consequence capability in this feature. A coding agent should not proceed autonomously through this epic's write-path stories without human review at each PR.

## Complexity Rating

**Rating:** 3 — genuinely new GitHub API write surface (branch creation, file commit with SHA-based update handling, PR creation) with no existing adapter to extend (unlike Epic 1's read path); `repo-bootstrap.js` is the closest precedent but writes directly to `master`, which this epic must NOT do.

## Scope Stability

**Stability:** Stable
