# Verification Script: p4-enf-decision

**Story:** Mechanism selection ADR
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-decision.js
```

Expected output:
```
T1 pass: architecture-guardrails.md has ADR-phase4-enforcement entry
T2 pass: ADR entry has all required sections
T3 pass: all four surface classes addressed
T4 pass: each surface class names specific mechanism
T5 pass: deferred surfaces explicit (or no deferred surfaces)
T6 pass: pipeline-state.json guardrails has ADR-phase4-enforcement
T7 pass: guardrails entry fields correct
T8 pass: ADR ID unique
T-NFR1 pass: no credentials in ADR
T-NFR2 pass: spike back-references present
```

## Manual verification

1. Open `.github/architecture-guardrails.md` and locate the `ADR-phase4-enforcement` block.
2. Confirm the five sections are present: Context, Options considered, Decision, Consequences, Revisit triggers.
3. Confirm the four surface classes (VS Code/Claude Code, CI/regulated, chat-native, non-git-native) are named.
4. Confirm any deferred surface has explicit reason + revisit trigger.
5. Open `.github/pipeline-state.json`; confirm `guardrails` array in the phase4 feature entry contains `{"id":"ADR-phase4-enforcement","file":".github/architecture-guardrails.md","status":"active"}`.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T3, T4 | Four surface classes + mechanisms mapped |
| AC2 | T1, T2, T8 | ADR in correct file, correct format, unique ID |
| AC3 | T6, T7 | guardrails entry present with correct fields |
| AC4 | T5 | Deferral explicit |
| NFR-security | T-NFR1 | No credentials |
| NFR-audit | T-NFR2 | Spike back-references |
