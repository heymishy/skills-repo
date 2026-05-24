# Contributing

## Reporting issues

Open a GitHub issue describing what you found, what you expected, and steps to reproduce.

## Contributing to the Skills Platform

If you want to propose a new SKILL.md file, a new standards addition, or a new eval suite scenario for the central skills platform library, read the full contribution guide first:

**[docs/squad-contribution-guide.md](docs/squad-contribution-guide.md)**

The guide covers: feature branch process, required PR contents (SKILL.md, EVAL.md with `traceId` + `failurePattern`, performance evidence), human approval gate, and merge path.

> **Note:** Changes to your own delivery-repo artefacts — stories under `artefacts/`, `workspace/` files, your pipeline state — do not require this process. This process applies only to changes that affect the shared platform library consumed by all squads.

## Governance Standards

Before implementing any story that touches enforcement code, consult the governance trace contract:

- [`standards/governance/trace-contract.md`](standards/governance/trace-contract.md) — canonical reference for all 15 design principles (P01-P15) governing the enforcement path.

## Code of conduct

Be direct and constructive. The platform team will respond to all PRs and issues.
