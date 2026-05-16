# Architecture Guardrails — Standard Azure Web Application Patterns
## Synthetic excerpt for EXP-003-pipeline-eval context injection — S7

**Document type:** Synthetic context injection artefact — NOT a real architecture-guardrails.md file
**Experiment:** EXP-003-pipeline-eval
**Scenario:** S7 — Greenfield React Web App (negative control — low-regulation)
**Purpose:** Injected as context for Config C runs. Provides standard Azure deployment guardrails (region constraints, security standards, tagging policy) without regulatory-specific content. The C5 constraint in S7 (data retention policy for event registration PII) is NOT signalled by these guardrails — this is intentional. The test is whether the model surfaces C5 independently, without an architectural prompt.

---

## Section 3 — Azure Deployment Standards

### 3.1 — Approved Azure Regions

**ADR-AZURE-001 — NZ Data Residency Regions**

All Azure resources deployed by the enterprise must use one of the approved NZ data residency regions:

- **Primary region:** `australiaeast` (Australia East — Sydney)
- **Secondary / DR region:** `australiasoutheast` (Australia Southeast — Melbourne)

**Rationale:** The enterprise's NZ customer data must remain within the NZ/Australia zone in accordance with the enterprise's data residency policy and Privacy Act 2020 guidance from the Privacy Commissioner on overseas disclosure of personal information. The `australiaeast` and `australiasoutheast` regions are the approved Azure regions for NZ data residency compliance.

**Not permitted:** `eastus`, `westus`, `northeurope`, `westeurope`, or any other Azure region outside of `australiaeast` / `australiasoutheast` for any resource that stores or processes NZ customer personal information.

**Exception process:** Deployment to any non-approved region for any resource handling NZ customer PII requires Architecture Review Board (ARB) approval and a documented data residency risk assessment.

---

### 3.2 — Azure App Service Standards

**ADR-AZURE-002 — App Service Configuration Baseline**

All Azure App Service deployments must meet the following baseline configuration:

| Configuration item | Required setting | Notes |
|-------------------|-----------------|-------|
| HTTPS Only | Enabled | No HTTP traffic; redirect all HTTP to HTTPS |
| Minimum TLS version | TLS 1.2 | TLS 1.0 and 1.1 not permitted |
| Authentication | Managed Identity for service-to-service auth | No hardcoded credentials; no shared service accounts |
| Always On | Enabled (Standard and above) | Required for all non-development environments |
| Deployment slots | Use staging slot for production deployments | Blue-green deployment pattern |
| Health check | Configured on `/health` or equivalent | Required for traffic manager integration |
| Logging | Application Insights connection string configured via environment variable | APPLICATIONINSIGHTS_CONNECTION_STRING |

**ADR-AZURE-003 — App Service Plan Selection**

| Environment | App Service Plan | SKU | Notes |
|-------------|----------------|-----|-------|
| Development | Standard | S1 | Shared dev plan acceptable if team count is small |
| UAT | Standard | S1 | Separate plan from production |
| Production | Standard | S2 or above | Size based on expected concurrent users; scale-out enabled |

---

### 3.3 — Azure SQL Database Standards

**ADR-AZURE-004 — Azure SQL Configuration Baseline**

| Configuration item | Required setting |
|-------------------|-----------------|
| Authentication | Azure AD authentication enabled; SQL authentication disabled for application connections |
| Managed Identity | Application service must use managed identity to authenticate to Azure SQL |
| TDE (Transparent Data Encryption) | Enabled (default for Azure SQL — must not be disabled) |
| Backups | Automated backups enabled (default); geo-redundant backup storage for production |
| Firewall | No public network access; Azure services only; private endpoint for production |
| Auditing | SQL Auditing enabled and logs directed to Azure Monitor |

---

### 3.4 — Identity and Access Standards

**ADR-AZURE-005 — No Hardcoded Credentials**

No application code, configuration file, or infrastructure-as-code template may contain hardcoded credentials, connection strings, API keys, or service account passwords. Violation of this standard is a HIGH finding in architecture review.

**Required approach:**
- **Service-to-service authentication:** Managed Identity (no credentials required)
- **Third-party API keys (e.g., SendGrid API key):** Azure Key Vault secret, referenced via managed identity
- **Database connections:** Connection string from environment variable (injected at deployment from Key Vault reference); no username/password in application code

**ADR-AZURE-006 — Least Privilege Access**

Application managed identities must be granted the minimum permissions required for the application's function. Review permissions at each major version release.

---

### 3.5 — Resource Tagging Policy

**ADR-AZURE-007 — Mandatory Resource Tags**

All Azure resources must be tagged with the following mandatory tags:

| Tag key | Value format | Example |
|---------|-------------|---------|
| `project` | Project or feature name | `event-registration` |
| `environment` | `dev` / `uat` / `prod` | `prod` |
| `owner` | Team or squad name | `community-banking` |
| `cost-centre` | Internal cost centre code | `CC-4421` |
| `data-classification` | `public` / `internal` / `restricted` | `internal` |

Resources without mandatory tags will be flagged in the monthly cloud governance review.

---

### 3.6 — Security Baseline

**ADR-AZURE-008 — Dependency Vulnerability Scanning**

All application dependencies must be scanned for known vulnerabilities as part of the CI/CD pipeline. Use `npm audit` (Node.js) or equivalent for the chosen runtime. Build must fail on HIGH or CRITICAL vulnerabilities without an approved exception.

**ADR-AZURE-009 — OWASP Top 10 Baseline**

All web applications must address the OWASP Top 10 at a minimum. The architecture review will verify:
- Input validation and output encoding (XSS prevention)
- Authentication and session management (Azure AD SSO for staff)
- Sensitive data exposure (no PII in URLs, no PII in logs)
- Security misconfiguration (App Service defaults reviewed per ADR-AZURE-002)
- Dependency vulnerabilities (ADR-AZURE-008)

---

### 3.7 — Monitoring and Observability

**ADR-AZURE-010 — Application Insights Integration**

All production applications must be instrumented with Azure Application Insights. The minimum telemetry set:
- Request traces (automatic via SDK)
- Dependency traces (HTTP, SQL)
- Exception tracking
- Custom events for key business flows (registration created, cancellation processed)
- Availability ping test (at minimum one per environment)

**ADR-AZURE-011 — Alerting Baseline**

At minimum, alerts must be configured for:
- Application error rate spike (>1% error rate, 5-minute window)
- Response time degradation (P95 >2 seconds, 5-minute window)
- Resource health events (App Service plan or SQL outage)

---

### 3.8 — SendGrid Integration Pattern

**ADR-AZURE-012 — Transactional Email via SendGrid**

For projects using SendGrid for transactional email:
- API key stored in Azure Key Vault; never in code or config files
- Application reads API key via managed identity (Key Vault reference)
- SendGrid domain authentication must be configured before go-live (DKIM/SPF)
- Email templates owned by the requesting business team; engineering owns the API integration only
- Bounce and unsubscribe handling must be configured in the SendGrid account settings

---

## Section 4 — Standard Reference Architecture: Greenfield React Web Application

```
[Customer Browser]
     │ HTTPS
     ▼
[Azure App Service — React/Node.js]
     │ Managed Identity
     ├─────────────────────────────► [Azure SQL Database]
     │ Managed Identity              (event registrations, attendee data)
     ├─────────────────────────────► [Azure Key Vault]
     │                              (SendGrid API key, configuration secrets)
     │ SendGrid API key (from Key Vault)
     └─────────────────────────────► [SendGrid]
                                    (confirmation emails)

[Staff Browser]
     │ HTTPS + Azure AD SSO
     ▼
[Azure App Service — same application, staff routes]
```

**Infrastructure provisioned via:** Terraform (internal modules)
**CI/CD:** GitHub Actions (template available)
**Monitoring:** Azure Application Insights (Application Insights resource per environment)
**Regions:** australiaeast (production), australiasoutheast (DR)
