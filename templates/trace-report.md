# Trace Report: [Feature Name]

<!--
  USAGE: Produced by the /trace skill. Can run at any pipeline stage.
  Read-only — reports findings for humans to action, does not fix anything.

  Overall status:
  - HEALTHY       — all chains intact, no orphaned artefacts
  - WARNINGS      — non-critical gaps, no broken links
  - BROKEN LINKS  — at least one story has a broken upstream or downstream link

  To evolve: update this template, open a PR, tag engineering lead.
-->

**Date:** [YYYY-MM-DD] | **Pipeline stage:** [Current stage]
**Feature:** [Feature name]
**Triggered by:** [Manual / CI on PR open]
**Overall:** ✅ HEALTHY / ⚠️ WARNINGS / ❌ BROKEN LINKS

---

## Chain by Story

| Story | Upstream (→ discovery) | Downstream (→ shipped code) | Issues |
|-------|----------------------|----------------------------|--------|
| [title] | ✅ | ✅ | None |
| [title] | ✅ | ⚠️ DoD missing | DoD not yet run |
| [title] | ❌ Metric ref broken | — | Metric "X" not in benefit-metric |

---

## Artefact Inventory

| Artefact | Present? | Notes |
|----------|----------|-------|
| discovery.md | ✅ / ❌ | |
| benefit-metric.md | ✅ / ❌ | |
| decisions.md | ✅ / ❌ | |
| epics/*.md | ✅ [n found] / ❌ | |
| stories/*.md | ✅ [n found] / ❌ | |
| review/*.md | ✅ [n found] / ❌ | |
| test-plans/*.md | ✅ [n found] / ❌ | |
| verification-scripts/*.md | ✅ [n found] / ❌ | |
| dor/*.md | ✅ [n found] / ❌ | |
| dod/*.md | ✅ [n found] / ❌ | |

---

## Metric Coverage

| Metric | Stories covering it | DoD signal recorded |
|--------|--------------------|---------------------|
| [name] | [n stories] | ✅ / ⚠️ Not yet |

**Metric orphans** (metrics with no covering stories): [None / list]

---

## Scope Deviations

<!--
  Collected from all DoD artefacts. Where shipped code drifted from the plan.
-->

[None / table: story | PR | deviation description | status]

---

## AC Coverage Gaps

[None / list: story | AC | gap nature]

---

## Open Spikes

[None / spike title | days open | blocking what]

---

## Findings Requiring Action

| # | Severity | Finding | Owner |
|---|----------|---------|-------|
| 1 | HIGH / MEDIUM / LOW | [Description] | [Who needs to act] |

<!-- If chain is healthy: None. -->
