# Story: acc.1 — Artefact-first governance gate

**Story ID:** acc.1
**Feature:** 2026-04-21-artefact-coverage-gate
**Epic:** Governance hardening
**Type:** Governance gate (short-track)
**Complexity:** 1 — well understood, clear path
**Scope stability:** Stable
**Human oversight:** Low

---

## User story

As a platform maintainer,
I want a CI governance gate that fails when a skill or source module has no corresponding DoR artefact,
So that the artefact-first rule (ADR-011) is enforced structurally rather than relying on human review.

---

## Acceptance criteria

**AC1 — Skill enumeration:** `tests/check-artefact-coverage.js` reads all subdirectory names under `.github/skills/` as skill slugs.

**AC2 — Module enumeration:** The check reads all subdirectory names under `src/` as module slugs.

**AC3 — DoR coverage check:** For each slug, the check searches `artefacts/` recursively for any file whose name contains the slug (case-insensitive, hyphen-normalised — hyphens treated equivalently to underscores and spaces).

**AC4 — UNCOVERED reporting:** Any slug with no matching artefact file is reported as an `UNCOVERED` finding with the slug and search path. The check exits non-zero if at least one UNCOVERED finding exists and is not in the exemption list.

**AC5 — Exemption list:** The check reads `artefact-coverage-exemptions.json` from the repo root. Each exemption entry must have both a `slug` field and a `reason` field (non-empty string). An exemption without a `reason` is treated as UNCOVERED (fails). Exempted slugs are reported as `EXEMPT` (not UNCOVERED) and do not cause non-zero exit.

**AC6 — package.json integration:** `package.json` test script is extended to run `node tests/check-artefact-coverage.js` as the last entry in the chain.

**AC7 — Baseline exemption list committed:** `artefact-coverage-exemptions.json` is committed alongside the script with all currently-uncovered skills and modules pre-exempted with reasons. The gate must pass (`npm test` green) immediately after the script is added.

**AC8 — Tests:** `tests/check-artefact-coverage.js` includes inline self-tests for: `uncovered-slug-fails`, `covered-slug-passes`, `exempted-slug-passes`, `exemption-without-reason-fails`.

---

## Out of scope

- Retroactive story creation for exempted slugs (tracked separately in exemption file)
- Checking for discovery.md, story, or test-plan files — only DoR files are checked
- Deep content validation of DoR files
