# Migration Guide: Adopting the Skills Platform Distribution Model

This guide covers how to migrate an existing repository (or a new repository) onto the Skills Platform distribution model introduced in Phase 4. Follow the steps in order. The final step confirms the installation by running a hash verification check across all pinned skills.

For architectural decisions that informed the sidecar path and lockfile design, see `artefacts/2026-04-19-skills-platform-phase4/decisions.md` (Spike C ADR).

---

## Pre-Migration Checklist

Before starting the migration, confirm each of the following:

- [ ] You have write access to the target repository.
- [ ] You have a GitHub or Azure DevOps account with permission to create branches and open pull requests.
- [ ] You have Node.js 18+ installed (required for the `skills-repo` CLI).
- [ ] You know your upstream skills repository URL (the `skills_upstream.repo` value you will add to `.github/context.yml`).
- [ ] You have reviewed the Spike C output (`artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md`) to understand the sidecar path decision.
- [ ] You have decided what to do with any custom or locally modified SKILL.md files — see the [Custom Content Decision](#custom-content-decision) section below.

---

## Step 1: Configure `skills_upstream` in context.yml

Open `.github/context.yml` in your repository (create it if it does not exist) and add the `skills_upstream` block:

```yaml
skills_upstream:
  repo: https://github.com/your-org/skills-repo.git
  paths:
    - .github/skills
  strategy: copy
```

Replace `https://github.com/your-org/skills-repo.git` with your actual upstream URL. The `skills_upstream` config key is read by the `skills-repo` CLI — it must be present before running `init`.

---

## Step 2: Run `skills-repo init`

From the root of your repository, run:

```bash
skills-repo init
```

This command:
1. Creates the sidecar directory (`.skills-repo/`) in your repository root.
2. Adds `.skills-repo` to your `.gitignore` (the sidecar is not committed to the consumer repo).
3. Writes an initial `skills-lock.json` inside the sidecar with `upstreamSource`, `pinnedRef`, `pinnedAt`, `platformVersion`, and an empty `skills` array.

The sidecar directory is the local copy of the skills platform. It is gitignored so that consumers do not accidentally commit the managed skills content.

---

## Step 3: Pin the skills

Run:

```bash
skills-repo pin
```

This fetches the SKILL.md files from the configured upstream at `skills_upstream.repo`, computes a SHA-256 content hash for each, and writes the hash entries into `skills-lock.json`. The lockfile records `upstreamSource`, `pinnedRef` (the commit ref or tag), `pinnedAt` (ISO timestamp), and a `skills` array with one entry per pinned skill.

---

## Step 4: Custom Content Decision

If your repository has any **custom SKILL.md files** (locally modified or team-specific skills not present in the upstream), you must decide before completing the migration:

- **Keep as-is (fork decision):** If the custom skill diverges significantly from the upstream version, treat it as a fork. Record the fork decision in `decisions.md` and do not include that skill in the pinned lockfile. Maintain the custom skill manually outside the sidecar.
- **Abandon the custom version:** If upstream has a suitable replacement, delete the local custom SKILL.md and allow the upstream version to be pinned. Record the abandonment decision in `decisions.md`.
- **Submit upstream:** If the custom content is generally useful, open a PR to the upstream skills repository. Once merged, pin the canonical upstream version.

Do not silently overwrite custom content with upstream content. Make the decision explicitly and record it in `decisions.md`.

---

## Step 5: Verify the installation

Run:

```bash
skills-repo verify
```

This reads `skills-lock.json`, computes the SHA-256 hash of each pinned skill file in the sidecar, and compares it against the recorded hash. If all hashes match, the verification passes. If any hash mismatches are detected, the CLI reports which skill was tampered with and exits with a non-zero code.

A passing `verify` run confirms that:
- The sidecar is correctly installed.
- The pinned skills have not been modified since pinning.
- The `upstreamSource` in the lockfile matches the configured `skills_upstream.repo`.

---

## Step 6: Register in the fleet registry (optional)

If your organisation uses the fleet registry to track consumer adoption, run:

```bash
skills-repo register
```

This writes an entry to the fleet registry (`fleet-state.json`) with your `consumerSlug`, `lockfileVersion`, `upstreamSource`, `lastSyncDate`, and computed `syncStatus`. See `scripts/update-fleet-registry.js` for the registry schema.

---

## Upgrading After Initial Install

To upgrade the pinned skills to a newer upstream version:

```bash
skills-repo fetch          # fetches the latest from upstream
skills-repo upgrade --confirm  # applies the upgrade (requires --confirm flag)
skills-repo verify         # confirms hashes match after upgrade
```

The upgrade command writes `previousPinnedRef` to the lockfile as an audit trail. In CI/CD pipelines, pass `--confirm` explicitly. Without `--confirm`, the upgrade command will error with "Upgrade requires operator confirmation."

---

## Spike C Reference

The sidecar path (`.skills-repo`) and lockfile design were decided in Spike C. The key decisions:
- The sidecar is gitignored at the consumer level to avoid committing managed content.
- The lockfile uses SHA-256 content hashes (not Git object hashes) so that hash verification works without a Git checkout.
- `heymishy/skills-repo` is the canonical upstream; consumers pin via `skills-lock.json` and do not maintain their own distribution mirror.

For the full Spike C rationale, see `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md` and the Spike C ADR in `decisions.md`.

---

## Troubleshooting

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `No upstream source configured` | `skills_upstream.repo` missing from context.yml | Add the `skills_upstream` block to `.github/context.yml` |
| `Hash mismatch for skill "X"` | Skill file was modified after pinning | Re-pin with `skills-repo pin` or restore the original file |
| `Upgrade requires operator confirmation` | Running upgrade in CI without `--confirm` | Add `--confirm` to the CI command or confirm interactively |
| `Sidecar already installed` | Running `init` on an already-initialized repo | Run `skills-repo verify` instead; re-init only if sidecar is corrupted |

---

## Recording Decisions

All migration decisions (custom skill fate, fork decisions, sidecar path choices) should be recorded in your repository's `decisions.md` file (typically at `artefacts/[feature-slug]/decisions.md` or at repo root for standing decisions). This ensures the rationale is preserved for future operators who upgrade or audit the installation.
