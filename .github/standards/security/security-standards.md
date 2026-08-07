# Security Standards

<!-- Fill in your security rules. Examples below — replace with your own. -->

## Known gaps (tracked, not yet fixed)

- **`GET /features/:slug` has no tenant-ownership check.** Confirmed via direct code read during S3.4's route-investigation (2026-07-24) — unlike other journey/feature routes in this repo (e.g. `GET /journey/:id`), this route does not verify the requesting session's tenant owns the target feature before rendering it. Not exploited by S3.4 itself (S3.4 deliberately chose `/journey/:id`, which already had the guard, as its own destination specifically because of this gap) — but the route remains reachable directly by anyone who knows or guesses a `feature_slug`. Needs a follow-up story adding the same `requireJourneyAccess`/`POLICY.TENANT`-equivalent guard used elsewhere in this codebase.

## OWASP Top 10 mitigations

- **Injection:** Parameterised queries only. No string concatenation in queries.
- **Broken auth:** See auth-patterns.md. Token expiry enforced server-side.
- **Sensitive data exposure:** TLS 1.2+ only. Secrets in vault, not env files committed to git.
- **XXE:** XML parsing disabled or hardened. Prefer JSON.
- **Access control:** Deny by default. Permissions checked at service layer.
- **Security misconfiguration:** No default credentials. Debug mode off in production.
- **XSS:** Output encoding in all templates. CSP headers set.
- **Insecure deserialisation:** No deserialisation of untrusted data to objects.
- **Vulnerable components:** Dependency scanning in CI. No unpatched critical CVEs shipped.
- **Logging:** Security events logged (auth failures, access denials). No secrets in logs.

## Secrets management

[e.g. All secrets stored in Azure Key Vault / AWS Secrets Manager / HashiCorp Vault. No secrets in code, config files, or environment variables committed to git.]

## Dependency policy

[e.g. `npm audit` / `pip audit` runs in CI. Builds fail on critical CVEs. Review required for high CVEs before merge.]

## Security review triggers

[e.g. Any change to auth, payments, or PII handling requires a security review before merge.]
