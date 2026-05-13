# NFR Profile — Platform Onboarding and Distribution (P11)

**Feature:** `2026-04-24-platform-onboarding-distribution`
**Created at:** /definition phase, 2026-04-28
**Discovery reference:** `artefacts/2026-04-24-platform-onboarding-distribution/discovery.md`

---

## Regulatory / Compliance

- **Regulated:** false
- No GDPR, HIPAA, PCI, or SOC2 data handling concerns. All data processed is repository file content (Markdown, JSON), which is classified as Internal.
- No audit trail requirements for this feature.

## Data Classification

- **Classification:** Internal
- Skill SKILL.md file content is hashed but not stored. The lockfile stores only file paths and SHA-256 digests — no credentials, personal data, or sensitive configuration values.
- `context.yml` remote URLs are read at runtime; they are not echoed to outputs beyond confirmation messages.

## Performance

- `pin()` and `verify()` in `cli-adapter.js` must complete within 5 seconds for a repository with up to 50 SKILL.md files. Current repository has ~39 skills; this is a headroom target, not a hard SLA.
- `init()` must complete within 1 second.
- `/start` SKILL.md must produce actionable output within a single conversational turn (the sub-2-minute design constraint).
- `fetch()` completion time is network-dependent; no hard timeout at MVP.

## Security

- No new npm dependencies introduced in `src/enforcement/cli-adapter.js` — Node.js built-ins (`crypto`, `fs`, `path`, `child_process`) only. This constraint eliminates supply-chain risk from transitive npm dependencies.
- Lockfile (`skill-lockfile.json`) stores no credentials, tokens, or instruction text — SHA-256 digests of file content only.
- The `fetch()` remote URL is read from `context.yml`, not from any user-controlled input at runtime. No injection surface.
- Attribution fields added to `/discovery` and `/benefit-metric` templates contain contributor names (Internal classification). No email addresses, IDs, or system credentials.

## Accessibility

- Not applicable — this feature delivers SKILL.md instructions, a JSON lockfile, and a CLI adapter. No UI surfaces.

## Availability / Reliability

- Not applicable at MVP. Skills are instruction files loaded by the IDE; they have no uptime requirement.
- The lockfile schema includes `schemaVersion` to enable non-breaking forward evolution when WS4.3 integrates. Version `"1.0.0"` is the initial version.

## Internationalisation

- Not applicable. All artefacts and SKILL.md content are English-only at MVP.

## Monitoring / Observability

- No runtime monitoring required at MVP. The benefit metrics (M1–M4, MM1–MM3) are measured via operator-reported signal at periodic review points, not via automated telemetry.

## Backwards Compatibility

- Stories p11.1 and p11.2 add optional fields to `/discovery` and `/benefit-metric` SKILL.md and templates. Existing artefacts do not need to be retroactively updated. The fields are additive.
- The lockfile schema `schemaVersion: "1.0.0"` field is designed to support non-breaking migration if the schema evolves in a future release.

## Architecture Guardrails Compliance

| Guardrail | Status | Notes |
|-----------|--------|-------|
| ADR-011 — Artefact-first (SKILL.md changes require story chain) | Not-assessed | Addressed by design — each story in this feature IS the artefact chain for its corresponding SKILL.md change |
| ADR-004 — context.yml is single config source of truth | Not-assessed | `fetch()` reads `skills_upstream.remote` from `context.yml` per ADR-004 |
| ADR-003 — Schema-first (new JSON fields defined in schema before use) | Not-assessed | lockfile schema defined in `docs/skill-lockfile.schema.json` before pin/verify writes to it |
| No-npm-deps constraint (from WS0.6 pattern) | Not-assessed | All new code uses Node.js built-ins only |
