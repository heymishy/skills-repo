# S7 — Greenfield React Web App — Customer-Facing Event Registration

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Negative control scenario: low-regulation, well-bounded greenfield application. Tests whether the pipeline correctly identifies a low-risk feature and does not over-engineer compliance gates. The hidden constraint is a minor Privacy Act gap (retention period for a new data type). The primary test is scope discipline and calibrated risk assessment.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our community banking team runs approximately 40 financial literacy events per year across New Zealand — workshops, webinars, and in-branch seminars. Currently customers register by emailing a generic inbox or calling their branch. We want to build a simple customer-facing event registration web application.

The app should allow customers to browse upcoming events, register for an event, receive a confirmation email, and manage their registrations (view, cancel). Staff should be able to create events, view registrations, and export attendee lists.

This is a greenfield application — no existing codebase to build on. The preference is for a React frontend with an Azure-hosted backend and database.

The app will collect: customer name, email address, phone number, branch preference, and whether they are an existing the enterprise customer. We will not be linking to core banking systems or accessing any financial data.

We expect approximately 200 registrations per event and 40 events per year — roughly 8,000 registrations per year total. This is not a high-volume system.

Our privacy team has confirmed that collecting name, email, and phone number for event registration is covered under our existing Privacy Statement for marketing and customer engagement activities.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **Azure hosting:** We use Azure as our primary cloud provider. The app should be deployed to Azure App Service. The database should be Azure SQL. Our cloud team has standard Terraform modules for both — the project can use these.
>
> **Authentication:** Staff-facing features should use Azure AD (Entra ID) SSO — all staff have the enterprise Azure AD accounts. Customer-facing registration does not require authentication — customers register as guests.
>
> **Email confirmation:** We use SendGrid for transactional email. An API key is available. The community banking team owns the email templates.
>
> **Existing customer flag:** The "are you an existing the enterprise customer" field is for event planning purposes only — it is not linked to any customer system and not used for any decisioning. It is optional.
>
> **Data residency:** Our Azure tenancy is configured for NZ data residency. The App Service and Azure SQL regions must be Australia East or Australia Southeast — these are our closest NZ-data-residency-compliant regions.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Privacy Act 2020 — PII collection (name, email, phone) covered by existing Privacy Statement; retention period for event registration data not defined | Regulatory (external law — partial) | Partial — brief says "covered" but retention unspecified |
| C2 | Azure data residency — deploy to Australia East or Australia Southeast only; no other regions acceptable | Technical/policy constraint | No — explicit in follow-up |
| C3 | Azure AD (Entra ID) SSO required for staff-facing features — no separate authentication system | Technical constraint | No — explicit in follow-up |
| C4 | No core banking integration — "existing the enterprise customer" flag is decorative; not linked to any customer system; not used for decisioning | Technical scope constraint | No — explicit |
| C5 | [Hidden] Event registration data retention period not defined — Privacy Act 2020 requires personal information not be retained longer than necessary for the purpose it was collected; no the enterprise policy covers this specific data type; a retention policy must be defined before go-live | Hidden regulatory gap (minor) | **Yes — hidden** |

**Regulated constraints:** C1 (Privacy Act — partial), C5 (Privacy Act — retention gap)
**Regulated CPF threshold:** 0.80

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — manual event registration process replaced by a simple self-service web app; low-regulation greenfield. The core challenge is delivering a functional, well-structured registration system with appropriate Privacy Act handling. NOT framed as a high-risk regulatory project.
2. **Personas** — the enterprise customers attending events (register, view, cancel), community banking staff (create events, view registrations, export lists), contact centre staff (redirected from phone-based registration).
3. **MVP scope** — all stated features (browse, register, confirm, manage registrations, staff event management, attendee export). No core banking integration. Azure App Service + Azure SQL. React frontend.
4. **Constraints** — C1 through C4 named; appropriate level of detail (no over-engineering). C5 surfaced as a lightweight assumption: "retention period for event registration data must be defined and confirmed with privacy team before go-live; existing Privacy Statement coverage does not define a retention period for this data type."
5. **Risk calibration** — this is a low-risk application. A model that adds elaborate security, AML, or regulatory compliance layers not supported by the brief has over-engineered the response. The evaluator should penalise false-positive constraint injection as well as false-negative constraint omission.

---

## CPF measurement notes for evaluator

- S7 is the negative control — it tests that the model calibrates correctly for a low-risk scenario. A model that adds constraints not present in the brief (e.g., CCCFA obligations for an event registration form, PCI DSS for a form with no payment data) is generating false positives. False positive injection is scored separately.
- C2 is easy to propagate at discovery but the propagation test is whether the Azure region constraint survives into Terraform/infrastructure stories at definition (e.g., "Azure SQL must be deployed to Australia East or Australia Southeast — no other region is acceptable").
- C5 — count as propagated only if the model names the retention period gap explicitly; not if the model merely says "privacy team has confirmed" and treats the brief's statement as resolving the question.
- **False positive scoring:** Count the number of constraints the model names that are NOT in C1–C5 and are not reasonably inferable from the brief. Each false positive deducts 0.05 from the CPF score for this scenario.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | Azure deployment standards, data residency requirements, Azure AD SSO integration pattern, Terraform module usage | ~6 KB |
| **Estimated total** | | **~8 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |

**Note:** No synthetic EA registry entry needed for S7 — this is a greenfield application with no existing system dependencies in scope.
