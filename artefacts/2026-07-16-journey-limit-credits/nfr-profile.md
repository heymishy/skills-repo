# NFR Profile: jlc-s1 — Journey cap bypass for tenants with a positive credit balance

**Data classification:** Internal (tenant credit balances — not PII, not payment card data)
**Compliance:** None applicable
**Performance:** One additional indexed DB read (`credits` table by `tenant_id`) per journey-creation attempt when the adapter is wired — negligible
**Security:** Loosens a gate for paying tenants only; must fail open to pre-existing (not new-unlimited) behavior when credits isn't wired (AC4)
**Accessibility:** Not applicable — no UI change
**Audit:** None beyond existing logging
