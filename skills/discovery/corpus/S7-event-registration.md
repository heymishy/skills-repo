# Corpus Case S7 — Greenfield React Web App (Customer Event Registration)

## Case metadata

```json
{
  "case_id": "S7",
  "label": "Greenfield event registration app — low regulation, scope discipline",
  "difficulty": "low-medium",
  "domain": "Front-end / Azure / Privacy Act (partial)",
  "regulated_constraint_count": 1,
  "hidden_constraint": "Event registration data retention period undefined (new data type)",
  "source": "workspace/handoffs/pipeline-corpus-S2-S7.md"
}
```

## Operator input

> /discovery — Our community banking team runs approximately 40 financial literacy
> events per year across New Zealand — workshops, webinars, and in-branch seminars.
> Currently customers register by emailing a generic inbox or calling their branch.
> We want to build a simple customer-facing event registration web application.
>
> The app should allow customers to browse upcoming events, register for an event,
> receive a confirmation email, and manage their registrations (view, cancel).
> Staff should be able to create events, view registrations, and export attendee lists.
>
> This is a greenfield application — no existing codebase to build on. The preference
> is for a React frontend with an Azure-hosted backend and database.
>
> The app will collect: customer name, email address, phone number, branch preference,
> and whether they are an existing the enterprise customer. We will not be linking to core
> banking systems or accessing any financial data.
>
> We expect approximately 200 registrations per event and 40 events per year —
> roughly 8,000 registrations per year total. This is not a high-volume system.
>
> Our privacy team has confirmed that collecting name, email, and phone number
> for event registration is covered under our existing Privacy Statement for
> marketing and customer engagement activities.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as a manual registration process that doesn't scale and creates staff overhead, with a bounded low-volume greenfield scope; the model should NOT over-engineer compliance gates for a genuinely low-risk scenario
- **Personas** — community banking staff (create events, manage registrations), bank customers (register for events), IT/cloud team (deployment platform owners)
- **MVP scope** — bounded to: customer event browsing and registration, email confirmation, registration management (view/cancel), staff event creation and attendee export; no core banking integration; no authentication for customers (guest registration)
- **Constraints** — C1 (Privacy Act 2020 — PII collection covered by existing Privacy Statement; but retention period for this new data type is not specified), C2 (Azure data residency — Australia East/Southeast only), C3 (Azure AD SSO for staff), C4 (no core banking integration)
- **Assumptions** — must flag: event registration data retention period undefined for this new data type — Privacy Act 2020 requires not retaining personal information longer than necessary; no policy currently covers this specific data type
- **Success indicators** — zero manual registration emails per event after launch, staff can create and manage events without IT involvement, 8,000 registrations/year capacity confirmed at Azure App Service tier selected

## Known failure modes for this case

- **Over-engineering compliance**: model adds excessive compliance gates that are not warranted for this low-risk scenario — treating it the same as a regulated financial product
- **Retention period gap missed**: model accepts "privacy is covered" without noting that retention period for this new data type remains undefined
- **Azure residency missed**: model does not surface the data residency constraint (Australia East/Southeast only)
- **Scope creep in MVP**: model adds features beyond the well-bounded brief (additional analytics, reporting, integrations)
