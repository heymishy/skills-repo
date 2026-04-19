# Spike C Investigation Output — Distribution Model

**Story:** p4-spike-c
**Date:** 2026-04-20
**Investigator:** heymishy (operator)
**Support:** claude-sonnet-4-6 (agent, analysis support)
**Artefacts read:** `artefacts/2026-04-18-cli-approach/discovery.md` (Craig's CLI distribution approach: install, sync, MVP commands), `artefacts/2026-04-19-skills-platform-phase4/discovery.md`, `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`, `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md`, `.github/context.yml` (`skills_upstream` block)

---

## Overall Verdict: PROCEED

All four distribution sub-problems are resolved with specific, testable design decisions. The Phase 4 distribution implementation (E2 stories) has an unambiguous architecture to implement against. No REDESIGN or DEFER findings were raised. The authoritative source decision — the most consequential and irreversible choice — is made explicitly below and recorded in `decisions.md`.

---

## Sub-problem 1: Sidecar directory convention and collision avoidance — Decision: PROCEED

**Design decision:** The skills installation writes only to paths declared in the `managed_paths` array. The default managed paths are `.github/skills/`, `.github/templates/`, `standards/`, and `scripts/`. Consumer-owned content in `.github/` (GitHub Actions workflows, issue templates, dependabot configuration) lives outside these paths and is never touched by `install` or `upgrade`.

**Collision avoidance approach:** The sidecar model avoids repo structure collision by construction — managed paths are narrow, explicit, and enumerated in the pin manifest before any write occurs. If a consumer has added a file inside a managed path (indicating local customisation), the CLI detects the hash mismatch during `upgrade` (not `install`) and halts with an explicit diff report. The consumer must either accept the upstream version (`--force`) or exclude the file from the managed path list in their local `context.yml` override. The `init` command writes a minimal managed_paths list; consumers can extend it in `context.yml` to narrow the managed scope further.

**Sidecar directory:** `.github/skills/` is the canonical install target for SKILL.md files. Craig's sidecar model (`artefacts/2026-04-18-cli-approach/discovery.md` MVP scope item 1) aligns with this; no redesign of Craig's approach is required.

**Verdict for sub-problem 1:** PROCEED — collision avoidance is resolved by managed-paths enumeration in the pin manifest.

---

## Sub-problem 2: Commit provenance and zero-commit install — Decision: PROCEED

**Design decision (zero-commit install):** The `install` command writes skill files to managed paths without creating a git commit. The consumer's git working tree is modified but no commit is generated. The consumer decides when and how to commit the installed skills. This satisfies C1 (non-fork) and avoids polluting the consumer's commit history with automated commits.

**Optional `--commit` flag:** `skills install --commit` generates a single standardised commit after writing all managed files:
```
chore: install skills from heymishy/skills-repo@<pinned_ref> [skills-lock: v<lock_version>]
```

**Commit format validation (operator-configured):** The `skills_upstream` block in `context.yml` may include a `commit_format` field (regex) that the CLI validates before writing the commit. If `commit_format` is absent, the default format above is used without validation. If present, the CLI validates the generated commit message against the pattern and aborts if it does not match — surfacing the mismatch before any commit is written.

**Audit trail without a commit:** The `skills.lock` file records `installed_at` (ISO 8601) and `installed_by` (git `user.email` if available; empty string otherwise) at install time. This gives a lightweight audit record that does not require a commit to exist.

**context.yml `skills_upstream` unification (ADR-004):** Craig's CLI `init` config and heymishy's `skills_upstream` config unify under the same `context.yml` schema. The single schema is:
```yaml
skills_upstream:
  enabled: true
  remote: "skills-upstream"
  url: "https://github.com/heymishy/skills-repo.git"
  pinned_ref: null            # null = latest; set to tag/sha to pin
  commit_format: null         # null = use default format; regex string to validate
  sync_paths:
    - .github/skills/
    - .github/templates/
    - standards/
    - scripts/
    - docs/skill-pipeline-instructions.md
  strategy: merge
```

Craig's `init` command writes this block to the consumer's `context.yml` with `pinned_ref` set to the current HEAD of the upstream source at install time. heymishy's existing `skills_upstream` block in `.github/context.yml` is already compatible with this schema — no breaking change.

**Verdict for sub-problem 2:** PROCEED — zero-commit install and commit-format validation are both resolved under a unified context.yml schema.

---

## Sub-problem 3: Update channel, lockfile structure, and upgrade semantics — Decision: PROCEED

**Lockfile location:** `.github/skills.lock` (configurable via `context.yml:skills_upstream.lockfile_path`).

**Lockfile format (YAML):**
```yaml
lockfile_version: 1
upstream_source_url: https://github.com/heymishy/skills-repo.git
pinned_ref: "abc1234def5678"        # git commit SHA or semver tag
pinned_at: "2026-04-20T10:00:00Z"
installed_at: "2026-04-20T10:05:00Z"
installed_by: "heymishy@example.com"
managed_paths:
  - .github/skills/
  - .github/templates/
  - standards/
  - scripts/
skills:
  - path: ".github/skills/discovery/SKILL.md"
    content_hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    source_ref: "abc1234def5678"
  - path: ".github/skills/definition/SKILL.md"
    content_hash: "sha256:..."
    source_ref: "abc1234def5678"
policy_floor:
  source_path: ".github/skills/POLICY.md"
  content_hash: "sha256:..."
  pinned_ref: "abc1234def5678"
```

**Minimum required fields:** `upstream_source_url` (upstream source URL), `pinned_ref` (pinned ref/version), and per-skill `content_hash` (skill content hashes — satisfies C5). These three fields are the minimum the AC3 test checks against.

**Upgrade diff display for consumer review:** `skills upgrade` performs the following sequence before re-pinning:
1. Fetches the candidate upstream ref.
2. Computes content hashes for all files at the candidate ref.
3. Diffs the candidate hashes against the lockfile hashes.
4. Emits a structured diff report to stdout: added files, removed files, and changed files with a two-line summary of each changed SKILL.md (first line of old vs new content — not a raw patch, to keep the diff legible for non-engineers).
5. If any SKILL.md files changed, halts and requires `--approve-skill-changes` to proceed (C4: human sign-off for instruction-set changes).
6. If only non-SKILL.md files changed (templates, standards), prompts `Upgrade and re-pin? [y/N]` unless `--yes` is passed.
7. Re-pins the lockfile on confirmation.

**POLICY.md floor verification after upgrade:** After re-pinning, the CLI reads the new `policy_floor.content_hash` from the updated lockfile and verifies the consumer's active POLICY.md configuration satisfies the new floor. If the consumer's POLICY.md has been locally modified and the modification would violate the new floor constraint, the upgrade is rejected with an explicit error: "POLICY.md floor verification failed: new floor requires [constraint]; consumer POLICY.md has [violation]. Resolve before re-pinning." This satisfies C5 end-to-end through every upgrade cycle.

**Verdict for sub-problem 3:** PROCEED — lockfile structure is specified at AC-testable precision; upgrade diff and POLICY.md floor verification are both designed.

---

## Sub-problem 4: Upstream authority — Decision: PROCEED

**Decision:** `heymishy/skills-repo` (this repository) is the authoritative upstream source for SKILL.md files, POLICY.md, templates, and standards files. Craig's fork is a **downstream fork** — a consumer of `heymishy/skills-repo`, not a publishing layer.

**Rationale:** A productisation fork as a publishing layer would require Craig's teams to track two upstream sources (heymishy → Craig's fork → consumer), introducing a versioning split and a maintenance obligation on Craig that is not in Phase 4 scope. The non-fork distribution model (C1) is best served by a single authoritative source that all consumers configure directly.

**context.yml `skills_upstream` configuration for Craig's teams:**
```yaml
skills_upstream:
  enabled: true
  remote: "skills-upstream"
  url: "https://github.com/heymishy/skills-repo.git"
  pinned_ref: "<tag or sha>"
  strategy: merge
```
Craig's teams run `skills init` which writes this block automatically. The `url` field is set to `heymishy/skills-repo.git` by default. Teams that need to pin to a different upstream (e.g. a regulated mirror) override `url` in their `context.yml`.

**Craig's fork relationship:** Craig's fork is a **downstream fork** — it may hold Craig's team-specific customisations (product/, context.yml overrides, local POLICY.md configuration) but it does not publish SKILL.md files to other consumers. Craig's fork's `skills_upstream.url` points to `heymishy/skills-repo.git` for upgrades. If Craig's fork accumulates SKILL.md changes that he wants to contribute back, the path is a pull request to `heymishy/skills-repo` — not a fork-to-fork sync.

**Publishing layer scope (Phase 5+):** A productisation fork acting as a publishing layer for enterprise consumers is an explicit out-of-scope deferral for Phase 4. If it becomes necessary (e.g. Craig's org has firewall policies preventing direct access to `heymishy/skills-repo.git`), the upgrade design supports it: changing `skills_upstream.url` to point to a mirror or publishing fork requires no code changes — only a `context.yml` update. The decision to introduce a publishing layer is a Phase 5 or Phase 6 scope decision requiring its own discovery.

**Verdict for sub-problem 4:** PROCEED — `heymishy/skills-repo` is authoritative; Craig's fork is a downstream fork; configuration is via `context.yml skills_upstream.url`.

---

## AC5 compliance note

Each E2 implementation story (p4-dist-install, p4-dist-no-commits, p4-dist-commit-format, p4-dist-lockfile, p4-dist-upgrade, p4-dist-upstream, p4-dist-migration, p4-dist-registry) must reference this spike output as its architecture input in its Architecture Constraints section before entering DoR. Any E2 story entering DoR without a reference to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md` fails the H9 architecture constraint check.

---

## New pipeline-state.json fields identified for E2

The following fields will be written by E2 implementation stories. They must be added to the schema before E2 stories begin implementation (MC-CORRECT-02):

| Field path | Type | Purpose |
|-----------|------|---------|
| `features[n].lockfileVersion` | integer | Active lockfile schema version for the feature's consumer |
| `features[n].skills[*].contentHash` | string | Per-skill SHA-256 content hash at pinned ref |
| `features[n].distributionUpstreamUrl` | string | Canonical upstream source URL from context.yml |
| `features[n].policyFloorHash` | string | SHA-256 of POLICY.md at pinned ref |

---

## Follow-up required before E2 can proceed

1. **Schema update (MC-CORRECT-02):** Add the four new fields above to the pipeline-state.json schema before any E2 story writes them. Story p4-dist-lockfile is the gating story.
2. **heymishy approval gate (C4):** This Spike C verdict requires explicit heymishy approval before E2 stories enter DoR — consistent with the approval gate applied to Spike A.
3. **Craig's PR #155:** The PR merge decision is a separate entry. This spike verdict does not merge or close the PR; it establishes that Craig's artefacts (`artefacts/2026-04-18-cli-approach/`) are valid reference inputs for p4-enf-cli in E3.
