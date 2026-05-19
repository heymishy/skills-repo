# context.yml Schema Inspection

**Story:** wucp.1 — Pipeline context auto-loader at session start
**Purpose:** AC5 merge gate — confirm no credential values appear in context.yml before it is included in assembled system prompts.
**Date:** 2026-05-09
**Inspected file:** `.github/context.yml`

---

## Top-level fields and value types

| Field | Type | Description |
|-------|------|-------------|
| `meta` | object | Metadata about the pipeline config (name, scope, regulated flag) |
| `meta.name` | string | Human-readable name of the pipeline context |
| `meta.scope` | string (enum) | Scope level: `personal`, `team`, `enterprise` |
| `meta.regulated` | boolean | Whether the context operates under regulatory requirements |
| `source_control` | object | Source control platform settings |
| `source_control.platform` | string | SCM platform (e.g. `github`) |
| `source_control.base_branch` | string | Default base branch name |
| `source_control.merge_request_term` | string | Local term for merge requests |
| `source_control.pr_command` | string | CLI command used to open PRs |
| `source_control.artefact_root` | string | Root directory for pipeline artefacts |
| `agent` | object | Agent configuration |
| `agent.instruction_file` | string | Filename of the copilot instructions file |
| `architecture` | object | Architecture governance settings |
| `architecture.ea_registry_repo` | string | URL to the EA registry repository |
| `architecture.ea_registry_local_path` | string | Local filesystem path to EA registry checkout |
| `architecture.ea_registry_authoritative` | boolean | Whether EA registry is the authoritative source |
| `optimization` | object | Token and model routing optimisation policy |
| `optimization.token_policy` | object | Budget limits (per_turn_soft_budget, per_story_budget, per_feature_budget) — all integers |
| `optimization.routing` | object | Model routing defaults (default_model_class, escalation_model_class) — string labels only |
| `mapping` | object | Terminology mapping (stage_aliases, artefact_aliases, governance gates) |
| `scaling` | object | Team maturity and scaling settings |
| `scaling.maturity_level` | string | e.g. `team` |
| `scaling.target_team_count` | integer | Number of target teams |
| `scaling.state_strategy` | string | State management strategy |
| `skills_upstream` | object | Upstream skills sync configuration |
| `skills_upstream.enabled` | boolean | Whether upstream sync is active |
| `skills_upstream.remote` | string | Git remote name |
| `skills_upstream.url` | string | Public repository URL (no credentials) |
| `skills_upstream.sync_paths` | array of strings | Paths to sync from upstream |
| `skills_upstream.strategy` | string | Sync strategy (e.g. `merge`) |
| `instrumentation` | object | Skill performance capture settings |
| `instrumentation.enabled` | boolean | Whether instrumentation is active |
| `instrumentation.experiment_id` | string | Experiment label (non-sensitive identifier) |
| `instrumentation.model_label` | string | Human-readable model label |
| `instrumentation.cost_tier` | string | Cost tier label |
| `audit` | object | CI attachment and audit settings |
| `audit.ci_attachment` | boolean | Whether CI artefact attachment is enabled |
| `audit.ci_platform` | string | CI platform adapter name |
| `audit.artifact_retention_days` | integer | Days to retain CI artefact bundles |

---

## Credential and secret value assessment

**Finding: No credential values present.**

All field values in `context.yml` are one of:
- Booleans (`true` / `false`)
- Integers (budget numbers, counts)
- Short string labels or enum values (`"team"`, `"merge"`, `"fast"`, `"github"`)
- Public URLs (e.g. `https://github.com/heymishy/ea-registry`)
- Filesystem paths (local paths, no credentials embedded)
- Experiment/model identifier strings (non-sensitive)

No field contains: API keys, access tokens, passwords, secrets, private keys, or any value that resembles a credential.

---

## secretRef pattern confirmation

**Finding: No sensitive values requiring secretRef are present.**

The `context.yml` file does not contain any values that need to be protected via `secretRef`. All values are configuration labels, public references, or numeric budgets. The `secretRef` pattern is confirmed as not applicable for the current schema — there are no fields that should reference external secret stores.

If future fields are added that reference credentials (e.g. CI tokens, API keys), they MUST use the `secretRef` pattern and MUST NOT contain the credential value inline.

---

## Conclusion

`context.yml` is safe to include verbatim in assembled system prompts. No credential leakage risk identified. AC5 merge gate is satisfied.
