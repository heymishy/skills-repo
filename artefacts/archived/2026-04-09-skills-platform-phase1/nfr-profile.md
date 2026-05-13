# NFR Profile: Skills Platform — Phase 1 Foundation

**Feature:** 2026-04-09-skills-platform-phase1
**Created:** 2026-04-09
**Last updated:** 2026-04-09
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| CI gate total run time | ≤ 10 minutes per gate run | CI log timestamp: gate trigger to gate verdict | p1.3-assurance-agent-ci-gate |
| Eval suite evaluation | ≤ 8 minutes as a component of the gate run | Subset of the 10-minute total gate budget | p1.6-living-eval-regression-suite |
| Watermark gate computation | ≤ 2 minutes (comparison and verdict) | Component of the 10-minute total gate budget | p1.4-watermark-gate |
| `/checkpoint` write | ≤ 60 seconds from invocation to clean session end | Operator observation; MM3 sub-condition 1 measurement | p1.5-workspace-state-session-continuity |
| Path B surface resolution | ≤ 1 second (read `context.yml`, select adapter) | Inline timing in gate run log | p1.2-surface-adapter-model-foundations |
| Standards injection (hash 3 files) | ≤ 30 seconds as a step in the gate run | Component of the 10-minute gate budget | p1.7-standards-model-phase1 |
| Assembled `copilot-instructions.md` base layer | ≤ 8,000 tokens at session-start (outer loop phase only) | Token count measurement of assembled file at Phase 1 delivery | p1.1-distribution-progressive-disclosure |

**Source:** Story NFR sections; product constraint #11 (no persistent agent runtime); gate-run budget derived from CI platform standard

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Credentials never in agent environment | PAT and OAuth tokens live in secrets store only; agent never handles credential values directly | Product constraint #12 | p1.1, p1.2, p1.3, p1.4 |
| No credential values in committed files | CI configuration and `context.yml` reference secret names only; no credential values in any tracked file | Product constraint #12 | p1.1, p1.2, p1.3 |
| `results.tsv` append-only | CI gate appends rows; deletion or overwrite is not permitted; CI gate validates file has grown, not shrunk | Product constraint #5 (two-layer model) | p1.4-watermark-gate |
| `suite.json` proposals model | Direct agent writes go to `workspace/proposals/`; human review required before merge to `suite.json` | Product constraint #5 (spec immutability + two-layer model) | p1.6-living-eval-regression-suite |
| No OWASP high/critical findings without accepted risk | Core security engineering POLICY.md floor — applies to all git-native inner loop stories | Product constraint #2; p1.7 POLICY.md floor | p1.7-standards-model-phase1 |
| Secrets never committed | Zero tolerance; secret scanning must not trigger on any committed file | Product constraint #12; security engineering POLICY.md floor | All stories |
| `MODEL-RISK.md` content classification | Document-level risk descriptions must not enumerate attack surfaces in operational detail | Security review at DoD | p1.8-model-risk-documentation |

**Data classification:**
- [x] Internal — non-public but low sensitivity

**Rationale:** All artefacts produced by this feature are platform governance files (skills, standards, state, traces). They contain no PII, no customer data, and no commercially sensitive business data. Source code and CI configuration are internal assets. `MODEL-RISK.md` is internal documentation. Classification: Internal.

**Source:** OWASP Top 10; product constraints #5, #12; security engineering POLICY.md floor (Phase 1 delivery)

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| Git repository storage | GitHub (dogfood context) — operator-controlled repository | No regulatory data residency requirement at Phase 1 dogfood context | All stories |
| CI run logs | GitHub Actions (dogfood), Bitbucket Pipelines (enterprise equivalent) | No regulated data processed by CI logs | p1.3, p1.4 |

**Note:** Phase 1 is a dogfood context with no regulated data. Data residency requirements must be assessed at each non-dogfood adoption.

---

## Availability

| Requirement | Target | Applies to story |
|-------------|--------|-----------------|
| CI gate availability | No SLA defined at Phase 1 — dependent on GitHub Actions / Bitbucket Pipelines availability | p1.3-assurance-agent-ci-gate |
| `workspace/state.json` durability | File persists across sessions; not deleted or overwritten by any automated process | p1.5-workspace-state-session-continuity |

**Source:** Product constraint #11 (standard CI/CD infrastructure — no availability SLA beyond what the CI platform provides)

---

## Compliance

| Framework | Requirement | Status | Applies to story |
|-----------|-------------|--------|-----------------|
| Platform-internal: spec immutability (constraint #3) | No automated agent may modify story specs, ACs, POLICY.md floors, or DoR/DoD criteria | Active | All stories |
| Platform-internal: human approval gate (constraint #4) | No change to SKILL.md, POLICY.md, or standards file merged without human review | Active | p1.7 |
| Platform-internal: versioned + hash-verified instructions (constraint #5) | Every instruction set delivered to an agent must produce a deterministic hash recorded in the trace | Active | p1.3, p1.7 |
| Platform-internal: structural governance preferred (constraint #13) | Gate verifies governance properties independently of agent self-reporting where possible | Active | p1.3, p1.4 |

**Sign-off required at DoR for:** Any story that modifies the trace schema must confirm T3M1 metric (trace readability for risk review) is not degraded before receiving DoR sign-off — per benefit-metric artefact, T3M1 section.

---

## Accessibility

Not applicable — this feature delivers platform infrastructure (CI gate, state files, standards, distribution), not user-facing UI. Accessibility requirements apply to consuming squad stories that deliver UI surfaces; this feature has none.

---

## No NFRs identified for:

- Internationalisation / localisation — platform files are English-only; no user-facing strings are introduced
- Data archival or retention beyond git history — no data beyond git-tracked files is produced; git is the audit trail

**Status:** Active — reviewed at definition, 2026-04-09.

