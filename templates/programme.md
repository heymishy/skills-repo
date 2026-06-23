# Programme: [name]

<!--
  USAGE: Produced by the /programme skill when a programme is registered.
  Updated by /programme at phase gate reviews and on-demand health checks.
  
  Save to: artefacts/[programme-slug]/programme.md
  
  To evolve: update templates/programme.md and open a PR.
-->

**Type:** [Platform migration / Feature programme / Rewrite / Multi-team initiative]
**Status:** Active / On hold / Complete
**Overall timeline:** [start] → [end]
**Phase gates:** [list phases with target dates and current status]
**Artefact path:** `artefacts/[programme-slug]/programme.md`

---

## Workstreams

| Slug | Team | Pipeline stage | Phase target | Status |
|------|------|---------------|-------------|--------|
| [slug] | [team] | [step N — skill name] | [phase name / date] | ✅ Moving / ⚠️ Stalled / 🔴 Blocked |

---

## Cross-workstream dependencies

| Upstream workstream | Delivers | Downstream workstream | Blocked at |
|--------------------|----------|-----------------------|------------|
| [workstream] | [what it must deliver before downstream can proceed] | [dependent workstream] | [pipeline stage blocked] |

---

## Consumer registry

[Link to `consumer-registry.md` — applicable for library/service rewrite programmes]
[Not applicable — state "N/A" for non-library programmes]

---

## /metric-review schedule

| Phase gate | Target date | Review status |
|-----------|-------------|---------------|
| [phase name] | [YYYY-MM-DD] | ✅ Complete [date] / ⏳ Scheduled / ❌ Missed |

---

## Health snapshot

*Updated by running `/programme` — do not edit manually*

| Workstream | Team | Stage | Status | Blocker |
|-----------|------|-------|--------|---------|
| [slug] | [team] | [step N] | ✅ Moving | — |
| [slug] | [team] | [step N] | ⚠️ Stalled | [summary] |
| [slug] | [team] | [step N] | 🔴 Blocked | [dependency or finding] |

### Dependency health

| Upstream | Downstream | Gate | Status |
|---------|-----------|------|--------|
| [workstream: what it delivers] | [workstream: what it needs] | [stage] | ✅ Met / ⚠️ At risk / 🔴 Blocking |
