# NFR Profile: 2026-05-02-state-file-authority-model

**Feature:** State File Authority Model
**Created:** 2026-05-02
**Data classification:** No user data — this feature creates a JSON Schema file and writes ADR documentation. No PII, no PCI scope, no sensitive fields.

---

## NFR Items

| ID | Category | Statement | Source | Status |
|----|----------|-----------|--------|--------|
| NFR-SFA1-COMPATIBILITY | Security/Correctness | The schema must not reject any `workspace/state.json` files produced by the current codebase. `additionalProperties` must not be set to `false`. | Story NFR-SFA1-COMPATIBILITY | Met when tests pass |
| NFR-SFA1-LIGHTWEIGHT | Correctness | The schema must use `"type": "string"` for `currentPhase` — not an enum. No enumeration of valid phase names. | Story NFR-SFA1-LIGHTWEIGHT | Met by design |
| NFR-SFA1-NODEPS | Dependencies | No new npm dependencies. Validation in the test file uses Node.js built-ins only (`fs`, `path`, `JSON.parse`). | Architecture Constraints / ADR-003 pattern | Met by design |

---

## Compliance

**Regulated:** false (`meta.regulated: false` in `context.yml`)
**Compliance frameworks:** None
**Sensitive data categories:** None

---

## Sign-off

NFR-SFA1-COMPATIBILITY is the load-bearing NFR — it ensures the schema introduction does not break existing session state. No separate human sign-off required for H-NFR2 (no regulatory clauses). H-NFR3: data classification above is not blank — "No user data. Not PCI scope. No PII."
