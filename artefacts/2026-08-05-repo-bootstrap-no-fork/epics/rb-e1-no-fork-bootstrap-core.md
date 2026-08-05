## Epic: A developer can start the inner loop in a real repo without forking or cloning the platform

**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A developer who has never touched this platform's own source runs one command against an empty or existing directory and, minutes later, has a working local repo — the full skill set, a lightweight registry declaring what's outer/inner/ancillary, and harness-agnostic instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, all generated from one source) — capable of running the inner loop end to end. No `git clone` or `git fork` of the upstream platform repository is required at any point.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    CLI[cli/bin/init.js\\n(new, rb-s1)]\n    PKG[npm package: @heymishy/skills-repo\\n(new, rb-s1)]\n    INIT[scripts/platform-init.js\\n(existing, wrapped by rb-s1)]\n    FETCH[scripts/platform-fetch.js\\n(existing, travels via INIT)]\n    PIN[scripts/platform-pin.js\\n(existing, travels via INIT)]\n    VERIFY[scripts/platform-verify.js\\n(existing, travels via INIT)]\n    FRESH[Fresh-repo path\\n(rb-s1)]\n    SAAS[SaaS-connected path\\n(rb-s4)]\n    REG[skills-registry.json\\n(new, rb-s2)]\n    ASM[scripts/assemble-copilot-instructions.sh\\n(existing, extended by rb-s3)]\n    DRIFT[scripts/check-instructions-drift.js\\n(new, rb-s3)]\n    SAASAPI[SaaS export endpoint\\n(new, rb-s4, follows platform-fetch.js's shape)]\n    OUTER[--with-outer-loop flag\\n(new, rb-s5)]\n    PKG --> CLI\n    CLI --> INIT\n    INIT --> FETCH\n    INIT --> PIN\n    INIT --> VERIFY\n    CLI --> FRESH\n    CLI --> SAAS\n    FRESH --> REG\n    SAAS --> SAASAPI\n    SAAS --> REG\n    REG --> ASM\n    ASM --> DRIFT\n    REG --> OUTER\n    OUTER --> FRESH\n    OUTER --> SAAS"}}---

## Out of Scope

- The "existing SaaS-connected repo" entry point (fetching a DoR-approved artefact from the hosted web UI) — separate epic (`rb-e2`), since it depends on an unconfirmed SaaS export capability and this epic must stand on its own regardless of that outcome.
- Ongoing update-sync for an already-bootstrapped repo — deferred past this initiative entirely (see discovery Out of Scope).
- The optional full-outer-loop install flag — belongs to `rb-e2` alongside the SaaS-connected path, since both are "flesh out beyond the skeleton" concerns.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Bootstrap-to-first-inner-loop-run time | Not yet established | Under 10 minutes | This epic delivers the entire mechanism that makes this metric measurable at all — there is no bootstrap path today |
| Fork/clone avoidance rate among new adopters | 100% (everyone forks/clones today) | > 50% within 3 months | This epic is what gives a new adopter an alternative to forking/cloning in the first place |

## Stories in This Epic

- [ ] rb-s1: Bootstrap a minimal fresh repo with one init command — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
- [ ] rb-s2: Install the full skill set with a lightweight outer/inner/ancillary registry — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
- [ ] rb-s3: Generate harness-agnostic instruction files from one source — artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s3-harness-agnostic-instructions.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Not customer-facing or regulated, but this is new distribution-mechanism architecture (npm publishing, a registry format, an extended assembly script) that other consumers will depend on — a human should review the PR before merge rather than let it proceed fully autonomously.

## Complexity Rating

**Rating:** 3

<!-- High ambiguity: no npm publishing pipeline exists today, no precedent in this repo for a packaged init command, and the walking-skeleton strategy was chosen specifically because this is new architecture. -->

## Scope Stability

**Stability:** Unstable

<!-- The exact packaging mechanism (npm vs. alternative) is an open [ASSUMPTION] from discovery — scope may shift once that's resolved via /clarify. -->
