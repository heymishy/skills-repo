# Discovery Report: Financial Literacy Event Registration Application

## Community Banking — New Zealand

---

## 1. Executive Summary

This discovery covers a greenfield customer-facing web application to replace manual email and phone-based event registration for the Community Banking team's financial literacy programme. The scope is well-defined, the scale is modest, and the privacy position has been pre-cleared. This is a low-complexity build with a small number of meaningful decisions to make before development begins.

---

## 2. What We're Building

A two-sided web application serving two distinct user groups:

**Customers** can:
- Browse upcoming financial literacy events (workshops, webinars, in-branch seminars)
- Register for an event by submitting their details
- Receive a confirmation email
- View and cancel their own registrations

**Staff** can:
- Create and manage events
- View registrations per event
- Export attendee lists

There is no integration with core banking systems. No financial data is accessed or stored.

---

## 3. What We Know

| Area | Detail |
|---|---|
| Event volume | ~40 events per year |
| Registration volume | ~200 per event / ~8,000 per year |
| Data collected | Name, email, phone number, branch preference, existing customer flag |
| Privacy clearance | Confirmed — covered under existing Privacy Statement |
| Frontend preference | React |
| Backend/hosting preference | Azure |
| Starting point | Greenfield — no existing codebase |
| Banking system integration | None |
| Financial data | None accessed or stored |

---

## 4. What We Still Need to Establish

These are open questions that should be resolved before or early in delivery. They are grouped by the decision they affect.

---

### 4.1 Authentication and Access Control

**For customers:**

> Do customers need an account, or is registration managed via a tokenised link (e.g. a unique link emailed to them to view or cancel their registration)?

An account-based model adds friction at registration and requires password management. A tokenised link approach — where a customer receives a unique URL in their confirmation email to manage their registration — is simpler to build and simpler for customers to use, and is well-suited to a low-frequency-use application like this.

**For staff:**

> How should staff authenticate to the admin area?

Options include:
- **Azure Active Directory (AAD) / Entra ID** — likely already available within the enterprise, low overhead, no separate credentials to manage. This is the recommended default assumption.
- A separate username/password system — adds credential management overhead with no clear benefit.

> Are all staff equivalent, or do we need role separation? For example: event creator vs. read-only viewer vs. exporter.

For 40 events per year across a small team, a single "staff" role is likely sufficient, but this should be confirmed.

---

### 4.2 Email Confirmation

> Does the organisation have an existing email sending service, or do we need to provision one?

Azure Communication Services and SendGrid (available via Azure Marketplace) are both natural fits in an Azure environment. If the organisation already uses something (e.g. an internal SMTP relay or an existing SendGrid account), we should use that.

> Who owns the sending domain and what is the reply-to address?

Confirmation emails sent to customers should come from a recognisable bank domain. We need to confirm who controls DNS for the sending domain so we can set up SPF/DKIM correctly and avoid deliverability issues.

> What should the confirmation email contain?

Minimum expected content: event name, date, time, location or joining link (for webinars), customer's registered details, and a link to cancel or view their registration. Should it include a calendar invite attachment (.ics)? This is a small addition that meaningfully improves customer experience for in-person events.

---

### 4.3 Event Types and Data Model

The brief mentions three event formats: workshops, webinars, and in-branch seminars. These likely have different data requirements.

> For in-person events (workshops, in-branch seminars): is there a maximum capacity per event? If so, what happens when an event is full — waitlist, or simply closed registration?

> For webinars: is a joining link (e.g. Teams or Zoom) generated separately and then added to the event, or does the application need to integrate with a video platform?

We would recommend treating the joining link as a simple URL field on the event record — staff paste it in — rather than building a video platform integration. This keeps scope clean.

> Can a single event have multiple sessions or dates, or is each date a separate event record?

A flat model (one record per event date) is simpler to build and query. If some events recur on multiple dates and staff need to manage them together, a parent/child relationship may be worth the added complexity. This needs a concrete answer.

---

### 4.4 Registration Management for Customers

> If a customer cancels, does that free up a space for another customer (relevant if capacity limits apply)?

> If a customer wants to edit their registration details (e.g. corrects a phone number), should the application support this, or is cancel-and-re-register an acceptable flow?

> Is there a cutoff for cancellations? For example, no cancellations within 24 hours of an event?

These are small but real UX and business logic decisions. The answers do not significantly change the architecture but they need to be made before the relevant screens are built.

---

### 4.5 Staff Export

> What format should the export be in? CSV is the most portable assumption.

> What fields should be included in the export?

> Is the export simply a download triggered in the browser, or does it need to be emailed or deposited somewhere (e.g. a SharePoint folder)?

A direct browser download is simplest and most appropriate for this scale. If staff already have a workflow that expects a file delivered to a specific location, we should understand that before building.

> Is there any downstream use of the attendee data — for example, post-event follow-up emails or entry into a CRM?

If post-event communications are planned (e.g. survey, follow-up materials), this affects what data we collect and whether we need an unsubscribe mechanism on those communications. This is also relevant for re-confirming the privacy scope.

---

### 4.6 Azure Environment

> Has an Azure subscription and resource group been nominated for this application?

> Is there an existing Azure infrastructure pattern (IaC tooling, approved services list, naming conventions) that this application should conform to?

> Is there a preferred Azure database service?

Azure SQL (managed SQL Server) is the natural default for a relational workload of this scale and fits well with a .NET or Node.js backend. Azure Database for PostgreSQL is an equally valid alternative. The scale here — 8,000 records per year — is trivially small for either.

> Are there network or security policies that affect how the backend API is exposed? For example, must it sit behind Azure API Management or a specific Application Gateway configuration?

---

### 4.7 The Backend

The brief specifies React for the frontend but does not specify a backend language or framework.

> Is there a preference or an existing team skill set for the API layer?

Common choices in an Azure context:
- **Azure Functions** (serverless) — well-suited to this scale, minimal infrastructure management, pay-per-execution cost model
- **Azure App Service with a .NET or Node.js API** — more conventional, easier to reason about for a small persistent application, likely more familiar to a typical team

For a small, low-traffic application with no real-time requirements, either works. Azure Functions adds some cold-start and local development complexity that may not be worth it here. We would lean toward a conventional App Service deployment unless there is a reason to go serverless.

---

### 4.8 Accessibility and Browser Support

> The application will be customer-facing. What accessibility standard applies?

New Zealand's Web Accessibility Standard 1.2 (based on WCAG 2.1 AA) applies to public-facing digital services from organisations covered by the standard. For a bank operating in New Zealand, WCAG 2.1 AA compliance should be the baseline assumption. This affects component choices and testing, not the architecture.

> Are there minimum browser or device support requirements?

Mobile responsiveness should be assumed as a baseline. Specific browser version floors (e.g. whether to support older IE versions) should be confirmed, though in practice this is unlikely to be a constraint in 2024.

---

### 4.9 Operational Considerations

> Who maintains the application after go-live?

> Is there an on-call or incident response process this application should be enrolled in?

> What are the uptime expectations? Given events are scheduled in advance and registration is not time-critical, a brief maintenance window would be acceptable. Is this assumption correct?

> Should the application send reminder emails to registered customers before an event? If so, how far in advance, and is this triggered manually by staff or automatically?

Automated reminders are a meaningful feature for reducing no-shows, but they add scheduling infrastructure (Azure Functions with a timer trigger, or a job scheduler). If this is wanted, it should be scoped explicitly.

---

## 5. Scope Boundaries — What We Are Confirming Out of Scope

The following items have either been confirmed out of scope or should be explicitly agreed as out of scope before delivery begins:

| Item | Status |
|---|---|
| Integration with core banking systems | Confirmed out of scope |
| Access to financial data | Confirmed out of scope |
| Payment processing (e.g. paid events) | Assumed out of scope — confirm |
| Integration with a CRM (e.g. Salesforce, Dynamics) | Assumed out of scope — confirm |
| Video platform integration (Teams, Zoom) | Recommend out of scope — URL field only |
| Multi-language support | Assumed out of scope — confirm |
| Mobile native application (iOS/Android) | Out of scope — responsive web only |

---

## 6. Recommended Architecture — Starting Point

Based on what is known, the following is a reasonable starting architecture. It should be validated against the open questions in Section 4 before being finalised.

```
┌─────────────────────────────────────────────────────────┐
│                        Azure                            │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │  Azure Static    │      │   Azure App Service   │    │
│  │  Web Apps        │─────▶│   (REST API)          │    │
│  │  (React SPA)     │      │   .NET or Node.js     │    │
│  └──────────────────┘      └──────────┬───────────┘    │
│                                        │                │
│                             ┌──────────▼───────────┐   │
│                             │   Azure SQL Database  │   │
│                             └──────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  Azure Communication Services / SendGrid     │      │
│  │  (Confirmation emails)                       │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  Azure Entra ID                              │      │
│  │  (Staff authentication)                      │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Customer registration flow:** tokenised link — no customer account required.
**Staff access:** Entra ID SSO — no separate credential store.
**Email:** single transactional service for confirmation emails.
**Database:** Azure SQL, one database, schema versioned via migrations.
**Frontend hosting:** Azure Static Web Apps — cost-effective, built-in CI/CD from a git repository.

---

## 7. Risks and Observations

| Risk | Likelihood | Impact | Note |
|---|---|---|---|
| Scope creep from staff wanting richer event management | Medium | Low–Medium | Features like recurring events, waitlists, and reminder emails are reasonable asks but each adds delivery time. Agree MVP scope explicitly. |
| Email deliverability issues on first send | Low | Medium | Requires DNS configuration (SPF, DKIM) before go-live. Allow time for this — it is not a development task but it can block testing. |
| Accessibility compliance not built in from the start | Low | Medium | Retrofitting WCAG 2.1 AA compliance is significantly more expensive than building to it from the outset. Agree this standard before development starts. |
| Azure environment not ready at development start | Medium | Medium | If no subscription or resource group is in place, development can begin locally, but integration testing will be delayed. Start the provisioning request now. |
| Ambiguity on customer data retention | Low | Low | The privacy position is cleared for collection. A data retention period (how long do we keep registration records after an event?) should be defined. |

---

## 8. Recommended Next Steps

1. **Answer the open questions in Section 4** — circulate this document to the Community Banking team, the Azure platform team, and the privacy team for a structured response. A 60-minute workshop with the right people present is more efficient than async back-and-forth.

2. **Define the MVP feature set explicitly** — separate what must be in the first release from what is desirable. A reasonable MVP candidate: customer browse/register/cancel, confirmation email, staff event creation, staff registration view, CSV export. Everything else is a candidate for a subsequent iteration.

3. **Confirm the Azure environment** — identify the subscription, resource group, and any platform-level constraints (networking, approved services, naming conventions). Engage the platform team now.

4. **Agree the data model for events** — specifically: capacity limits, session structure, and event types. This drives the database schema and several UI decisions.

5. **Confirm the sending domain and initiate DNS setup** — this has a lead time that is independent of development and should not be left until the end.

6. **Align on WCAG 2.1 AA** as the accessibility baseline before frontend development begins.

---

*Discovery completed. Pending resolution of open questions before detailed design and sprint planning.*