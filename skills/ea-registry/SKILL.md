---
name: ea-registry
description: >
  Reads, queries, and maintains an enterprise application and interface registry.
  Answers what applications exist, which interfaces connect them, what domain a
  system belongs to, and the blast radius of replacing a system. Supports query,
  contribution, audit, and feed modes. Use when someone says "what systems depend
  on X", "what interfaces does X have", "register this application", "update the
  registry", "blast radius", "audit the registry", or "interface inventory".
triggers:
  - "what systems depend on"
  - "what interfaces does"
  - "register this application"
  - "update the registry"
  - "blast radius"
  - "what depends on"
  - "add to the registry"
  - "audit the registry"
  - "stale entries"
  - "what's in the domain"
  - "dependency context"
  - "interface inventory"
---

# EA Registry Skill

## What this skill does

Four operating modes. Determine mode first and state it explicitly.

| Mode | When to use |
|------|-------------|
| **QUERY** | Answer questions about current registry state |
| **CONTRIBUTE** | Add or update application/interface/domain entries |
| **AUDIT** | Find stale, missing, unverified, or inconsistent entries |
| **FEED** | Provide dependency context to /discovery, /definition, /reverse-engineer |

---

## Entry condition check

Treat the EA registry as authoritative in the dedicated registry repository.
Default canonical repo:
- `https://github.com/heymishy/ea-registry`

If `context.yml` contains `architecture.ea_registry_repo`, use that value as the
authoritative target. If it also contains `architecture.ea_registry_local_path`,
use that local checkout for file operations.

Confirm the registry exists and is readable:
- `registry/applications/`
- `registry/interfaces/`
- `registry/CONVENTIONS.md`

If the current repository does not contain `registry/`, switch to the configured
EA registry repo/path and run QUERY/CONTRIBUTE/AUDIT there.

When `architecture.ea_registry_authoritative: true`:
- Never write registry YAML in a product repo
- Create/update entries only in the EA registry repo
- Feed delivery repos via FEED mode summaries and links

If missing or empty:
> "The EA registry is missing or not initialised yet. Share the first application
> details and I can scaffold an initial entry, or initialise the registry structure
> first and retry this skill."

---

## Mode: QUERY

### "What interfaces does [app] have?"

1. Read `registry/applications/[app-slug].yaml`
2. Search `registry/interfaces/` where app slug appears in `source.app` or `target.app`
3. Return interface name, direction, counterparty, type/subtype, criticality,
   modernisation disposition, and verification status
4. Group as inbound/outbound
5. Flag `unverified` and `stale`

Output format:

```markdown
## Interfaces for [App Name] ([app-slug])

### Inbound ([n])
| Interface | Counterparty | Type | Criticality | Status |
|-----------|--------------|------|-------------|--------|

### Outbound ([n])
| Interface | Counterparty | Type | Criticality | Status |
|-----------|--------------|------|-------------|--------|

Warnings:
- [n] unverified entries
- [n] stale entries (last reviewed >12 months)
```

### "What's the blast radius of replacing [app]?"

1. Find inbound interfaces where `target.app = [app-slug]`
2. Find outbound interfaces where `source.app = [app-slug]`
3. Build direct dependents list (systems that call this app)
4. Build preservation/rebuild list (interfaces this app calls)
5. Traverse one hop for indirect dependencies

Output format:

```markdown
## Blast Radius: [App Name]

### Direct impact (callers)
[list with interface criticality]

### Replacement obligations (outbound interfaces to preserve/rebuild)
[list with modernisation disposition]

### Indirect dependencies (one hop)
[list]

### Summary
Replacing [app] directly impacts [n] systems over [n] interfaces.
[n] interfaces are critical. [n] are marked changing/retiring.
```

### "What's in [domain]?"

1. Read `registry/domains/[domain-slug].yaml`
2. List domain applications with tier, lifecycle status, verification
3. Summarise internal interfaces and boundary interfaces

### "Do we have an interface between [A] and [B]?"

Search `registry/interfaces/` for both app slugs in source/target fields.
If none found, state that this may mean not registered yet.

---

## Mode: CONTRIBUTE

### Non-negotiable rule

Every contribution goes through a pull request.

When using a separate EA registry repository, the PR must be opened in that
repository (not in the delivery repo where the request originated).

Always:
1. Work on a branch
2. Create entries with `verification_status: unverified`
3. Set `source: skill-ea-registry` (or originating skill source)
4. Propose PR body with reviewer tags

Never:
- Commit directly to main
- Set `verification_status: verified`
- Overwrite a verified entry silently
- Delete entries; decommission them instead

### Add application entry

1. Check duplicates by name/alias/slug
2. Collect required minimum fields:
   `slug`, `name`, `owner`, `domain`, `business_capability`, `tier`, `lifecycle_status`
3. Create `registry/applications/[app-slug].yaml` from template
4. Set `verification_status: unverified`, `source`, `last_reviewed`
5. Draft PR description

### Add interface entry

1. Resolve source and target app slugs
2. Confirm interface type and direction
3. Create `registry/interfaces/[source]--[target]--[name].yaml`
4. Set verification/source metadata as unverified skill contribution
5. Draft PR description with both owners as reviewers

### Conflict handling

If proposed change conflicts with existing verified entry:
- Do not overwrite
- Mark as `disputed` in PR proposal and add evidence block
- Request owner review

---

## Mode: AUDIT

Run these checks and output a compact report:

1. Applications missing required minimum fields
2. Interfaces referencing unknown application slugs
3. Entries with `verification_status: unverified` older than threshold
4. Entries with review date older than 12 months (`stale`)
5. Domain references that do not exist
6. Duplicate interfaces with same source/target/name intent

Output format:

```markdown
## Registry Audit Report ([date])

### Summary
- Applications: [n]
- Interfaces: [n]
- Domains: [n]
- High-severity issues: [n]

### Findings
| Severity | Type | File | Issue | Action |
|----------|------|------|-------|--------|

### Suggested next actions
1. [action]
2. [action]
3. [action]
```

---

## Mode: FEED (for other skills)

When invoked from `/discovery`, `/definition`, or `/reverse-engineer`, return:

1. Relevant applications in scope
2. Known inbound/outbound interfaces
3. Direct dependency and blast-radius summary
4. Verification caveats (`unverified`, `stale`, `disputed`)
5. Suggested follow-up questions for unknowns

Use this compact handoff format:

```markdown
## EA Dependency Context - [scope]

Applications in scope: [list]
Direct inbound dependencies: [n]
Direct outbound dependencies: [n]
Critical interfaces: [n]
Unverified/stale entries: [n]

Open unknowns:
- [unknown]
- [unknown]

Planning impact:
- [impact on story slicing, migration order, test strategy]
```

---

## State update - mandatory final step

> **Mandatory.** Do not close without updating pipeline state and confirming in
> your closing message: "Pipeline state updated ✅"

When this skill is run in a delivery repository, update `.github/pipeline-state.json`:
- `features[].updatedAt = [now]`
- `features[].notes` append short registry action summary (query/contribute/audit/feed)
- If this run unblocks discovery/definition/reverse-engineer, set `health` accordingly
