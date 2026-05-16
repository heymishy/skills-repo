# Context Injection — S7 Pipeline Configuration Excerpt
# Document type: Synthetic context.yml excerpt for EXP-003-pipeline-eval evaluation only
# Scenario: S7 — Greenfield React Web App (negative control — low-regulation)
# Purpose: Provides standard pipeline toolchain context without regulatory complexity.
#          Confirms Azure deployment targets, CI/CD platform, standard monitoring setup.
#          Does NOT surface any regulatory constraints — this is intentional for the negative control.

---

## context.yml — Standard Pipeline Configuration (Excerpt)

```yaml
# context.yml — the enterprise pipeline configuration
# Profile: Azure — Standard Web Application
# Last updated: 2026-Q1

toolchain:
  # CI/CD platform
  ci_platform: github-actions

  # Deployment target
  deployment_target: azure-app-service    # Primary: Azure App Service
  database: azure-sql                     # Database: Azure SQL Database
  cache: none                             # No caching layer (standard web app)

  # Frontend framework
  frontend: react                         # React SPA
  backend: node-express                   # Node.js with Express
  language: typescript                    # TypeScript

  # Infrastructure as Code
  iac: terraform                          # Standard Terraform modules available from cloud team
  iac_modules_path: internal/terraform    # Internal module registry

  # Monitoring and observability
  monitoring: azure-application-insights  # APM: Azure Application Insights
  log_aggregation: azure-monitor          # Centralised log aggregation
  alerting: azure-monitor-alerts          # On-call alerting via Azure Monitor

  # Authentication
  staff_auth: azure-ad-sso                # Staff-facing features use Azure AD SSO
  customer_auth: none                     # Customer-facing features are unauthenticated (guest)

  # Email
  transactional_email: sendgrid           # SendGrid for transactional email (confirmation emails)

  # Project management
  project_management: github-issues       # Issue tracking via GitHub Issues

architecture:
  # Primary cloud region — Australia East
  primary_region: australiaeast
  # DR region — Australia Southeast
  dr_region: australiasoutheast
  # Data residency constraint: NZ customer data must remain in NZ/AU Azure regions
  data_residency: nz-au

skills_upstream:
  remote: null
  strategy: none

instrumentation:
  enabled: false

change_management:
  platform: none
  required_for_production: false

tools:
  artifact_registry: none
  monitoring: azure-application-insights
  log_aggregation: azure-monitor
  alerting: azure-monitor-alerts
  ci_platform: github-actions
```

---

## Notes for pipeline operator

**Azure App Service:** The cloud team has standard Terraform modules for Azure App Service deployment. Use `internal/terraform/modules/app-service` as the base. The module provisions App Service Plan (Standard S1 by default) and App Service with managed identity configured.

**Azure SQL:** Standard Terraform module available at `internal/terraform/modules/azure-sql`. Provisions Azure SQL Server + database with Azure AD authentication enabled.

**Monitoring:** All new applications must be registered with Azure Application Insights. The Application Insights instance is provisioned per environment (dev, UAT, prod). The Terraform module configures the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable automatically.

**GitHub Actions:** CI pipeline template available at `.github/workflows/templates/azure-app-service-deploy.yml`. Requires Azure Service Principal configured in GitHub secrets.

**Approved regions:** `australiaeast` (primary) and `australiasoutheast` (DR) only. Any other region requires Architecture Review Board approval.
