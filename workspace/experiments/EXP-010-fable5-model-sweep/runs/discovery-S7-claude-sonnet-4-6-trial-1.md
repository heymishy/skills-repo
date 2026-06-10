# Discovery Report: Community Banking Event Registration Application

---

## 1. Executive Summary

This document captures the outcomes of the discovery phase for a greenfield customer-facing event registration web application. The system will replace manual email and phone-based registration processes for approximately 40 financial literacy events per year across New Zealand.

The scope is well-defined, the data volumes are modest, and the privacy position has been pre-confirmed. The primary risks centre on email deliverability, staff adoption, and making appropriate technology choices that avoid over-engineering a fundamentally simple system.

---

## 2. What We Heard — Problem Statement

**Current state pain points:**
- Customers register via generic inbox email or branch phone calls — both are manual, error-prone, and create inconsistent experiences
- Staff have no centralised view of who has registered across events
- No automated confirmations — customers may be uncertain their registration was received
- Exporting attendee lists requires manual collation
- No self-service cancellation for customers

**Desired outcomes:**
- Customers can self-register without contacting a branch
- Customers receive immediate confirmation and can manage their own registrations
- Staff have a simple dashboard to manage events and attendees
- Attendee lists can be exported for event day check-in and follow-up

---

## 3. Scope Definition

### 3.1 In Scope

| Area | Capability |
|---|---|
| **Customer** | Browse upcoming events |
| **Customer** | Register for an event (name, email, phone, branch preference, existing customer flag) |
| **Customer** | Receive automated confirmation email |
| **Customer** | View their own registrations via a lookup (e.g. by email) |
| **Customer** | Cancel a registration |
| **Staff** | Create and edit events (title, date, time, location/URL, type, capacity) |
| **Staff** | View registrations per event |
| **Staff** | Export attendee list (CSV) |

### 3.2 Explicitly Out of Scope

- Integration with core banking systems
- Access to or display of any financial data
- Customer identity verification or authenticated accounts (customers use email-based lookup only)
- Payment processing (events are free)
- Waitlist management *(see open questions)*
- Automated reminders or post-event surveys *(could be phased)*
- Staff authentication beyond a simple protected route *(see risk section)*
- Mobile native applications — responsive web only

---

## 4. User Roles

```
┌─────────────────────────────────────────────────────────┐
│                    USER ROLES                           │
├──────────────────┬──────────────────────────────────────┤
│  Customer        │  No login required                   │
│  (Public)        │  Email used as identity key          │
│                  │  Self-service registration & cancel  │
├──────────────────┼──────────────────────────────────────┤
│  Staff           │  Authenticated (username/password    │
│  (Internal)      │  or Azure AD SSO — see open Qs)     │
│                  │  Event management + export           │
└──────────────────┴──────────────────────────────────────┘
```

---

## 5. Proposed System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER BROWSER                         │
│                    React SPA (Azure Static                      │
│                       Web Apps)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE API MANAGEMENT                         │
│              (optional at this scale — see note)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AZURE APP SERVICE                             │
│               Node.js / .NET REST API                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   Events     │  │Registrations │  │  Staff Management     │ │
│  │   API        │  │  API         │  │  API                  │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │                         │
                 ▼                         ▼
┌───────────────────────┐    ┌─────────────────────────────────┐
│  AZURE SQL DATABASE   │    │  AZURE COMMUNICATION SERVICES   │
│  (or PostgreSQL on    │    │  (Email confirmation delivery)  │
│   Azure)              │    └─────────────────────────────────┘
│                       │
│  - Events             │
│  - Registrations      │
│  - Staff Users        │
└───────────────────────┘
```

> **Note on API Management:** At 8,000 registrations per year this layer adds cost and complexity without meaningful benefit. Recommend omitting unless the bank has a standard architectural requirement to route all APIs through APIM.

### 5.2 Technology Recommendations

| Layer | Recommendation | Rationale |
|---|---|---|
| **Frontend** | React + TypeScript, Azure Static Web Apps | Meets stated preference; Static Web Apps includes free SSL, CDN, and CI/CD |
| **Backend** | Node.js (Express) or .NET 8 Minimal API on Azure App Service | Both are well-supported on Azure; choose based on team skill set |
| **Database** | Azure SQL Database (Basic/S0 tier) | Relational data fits well; low cost at this scale (~$7–15 NZD/month) |
| **Email** | Azure Communication Services (Email) | Native Azure service; avoids third-party dependency |
| **Auth (Staff)** | Azure AD / Entra ID SSO | Bank likely already has Entra ID; avoids building auth from scratch |
| **Hosting** | Azure Static Web Apps (frontend) + App Service B1 (backend) | Right-sized for volume |

### 5.3 Data Model (Simplified)

```
┌──────────────────────────────────────────────────────────┐
│  EVENTS                                                  │
│  ─────────────────────────────────────────────────────   │
│  event_id          PK                                    │
│  title             varchar                               │
│  description       text                                  │
│  event_type        enum (workshop, webinar, seminar)     │
│  event_date        datetime                              │
│  location          varchar  (address or URL)             │
│  branch            varchar                               │
│  capacity          integer                               │
│  is_published      boolean                               │
│  created_at        datetime                              │
└──────────────────────────────────────────────────────────┘
                         │
                         │ 1 : many
                         ▼
┌──────────────────────────────────────────────────────────┐
│  REGISTRATIONS                                           │
│  ─────────────────────────────────────────────────────   │
│  registration_id   PK                                    │
│  event_id          FK → Events                           │
│  full_name         varchar                               │
│  email             varchar                               │
│  phone             varchar                               │
│  branch_preference varchar                               │
│  is_existing_customer  boolean                           │
│  status            enum (confirmed, cancelled)           │
│  registered_at     datetime                              │
│  cancelled_at      datetime (nullable)                   │
│  cancellation_token  varchar  (unique, for self-service) │
└──────────────────────────────────────────────────────────┘
```

> **Cancellation token:** A unique token generated at registration time and included in the confirmation email as a link. This allows customers to cancel without requiring an account login — keeping the customer experience simple while preventing arbitrary cancellations.

---

## 6. Key User Journeys

### 6.1 Customer Registration Flow

```
Customer lands on event listing page
        │
        ▼
Browses upcoming events (filtered by date, type, branch)
        │
        ▼
Selects an event → views event detail page
        │
        ▼
Clicks "Register" → registration form
[name, email, phone, branch preference, existing customer Y/N]
        │
        ▼
Submits form
        │
   ┌────┴────┐
   │ Checks  │ Event at capacity?
   └────┬────┘
        │ No               │ Yes
        ▼                  ▼
Registration saved    Show "fully booked"
        │             message (waitlist
        ▼             out of scope v1)
Confirmation email
sent to customer
(includes cancellation link)
        │
        ▼
Confirmation page shown in browser
```

### 6.2 Customer Cancellation Flow

```
Customer clicks cancellation link in email
        │
        ▼
App validates cancellation token
        │
   ┌────┴────┐
   │ Token   │ Valid?
   └────┬────┘
        │ Yes                   │ No / expired
        ▼                       ▼
Show cancellation           Show error page
confirmation page           with support contact
        │
        ▼
Customer confirms cancellation
        │
        ▼
Registration status → cancelled
        │
        ▼
Cancellation confirmation email sent
```

### 6.3 Staff Event Management Flow

```
Staff logs in (Azure AD SSO)
        │
        ▼
Staff dashboard — list of events
        │
        ├── Create new event → form → save → event published
        │
        ├── Select event → view registrations list
        │       │
        │       └── Export CSV (name, email, phone, branch,
        │                       existing customer, registered at)
        │
        └── Edit event details (date, capacity, description)
```

---

## 7. Privacy & Compliance

### 7.1 Data Collected and Basis

| Field | Purpose | Privacy Basis |
|---|---|---|
| Full name | Event registration identity | Confirmed covered by existing Privacy Statement |
| Email address | Confirmation, cancellation comms, self-service lookup | Confirmed covered |
| Phone number | Branch contact if event changes | Confirmed covered |
| Branch preference | Route customer to relevant branch team | Confirmed covered |
| Existing customer flag | Audience segmentation for event reporting | Confirmed covered |

**Privacy team has confirmed** collection is covered under the existing Privacy Statement for marketing and customer engagement activities. No changes to Privacy Statement required.

### 7.2 Privacy Design Considerations

These items should be implemented regardless of the confirmed coverage:

- [ ] **Retention policy:** Define how long registration data is retained after an event. Recommend a defined period (e.g. 12 months post-event) with automated or manual purge process.
- [ ] **Data minimisation:** Phone number should be marked optional if it is not strictly required for event delivery — review with the community banking team.
- [ ] **Access control:** Staff admin area must be authenticated. Registration data should not be publicly queryable beyond the cancellation token flow.
- [ ] **Customer lookup:** The "view my registrations" flow uses email address as a lookup key. Consider whether this is sufficient or whether a one-time verification code to that email is needed to prevent someone looking up another person's registrations.
- [ ] **No financial data:** Explicitly confirmed out of scope — the system must not store or display any account or transaction information.

### 7.3 Open Privacy Questions

> **Q1:** Should a privacy/consent checkbox be presented at registration, or is display of a link to the Privacy Statement sufficient? The bank's legal/privacy team should confirm the preferred approach.

> **Q2:** Who is the data controller for registrations submitted by customers of other branches? Likely the same entity, but worth confirming with privacy team.

---

## 8. Open Questions

The following questions require input from stakeholders before architecture is finalised or development begins.

| # | Question | Owner | Impact |
|---|---|---|---|
| 1 | Will staff authenticate via Azure AD / Entra ID SSO, or is a separate username/password sufficient? | IT / Security | Authentication design |
| 2 | Is there a waitlist requirement when an event reaches capacity? The current brief says no, but this is a common request once the system is live. | Community Banking | Data model, UX |
| 3 | Should customers receive a reminder email before the event (e.g. 24–48 hrs)? This is not in scope but is low-effort to add. | Community Banking | Email service design |
| 4 | Is phone number mandatory or optional? Data minimisation principle suggests optional unless operationally required. | Privacy / Community Banking | Form design, data model |
| 5 | What is the required retention period for registration data after an event concludes? | Privacy / Legal | Data retention policy, possible purge job |
| 6 | Does the bank have an existing Azure subscription and tenant for this application to be deployed into, or does a new one need to be provisioned? | IT | Infrastructure setup time |
| 7 | Is there an existing email domain / Azure Communication Services instance, or does one need to be created? Sender domain (e.g. `noreply@events.bankname.co.nz`) will need DNS setup. | IT | Email delivery timeline |
| 8 | Are there specific accessibility requirements (WCAG 2.1 AA is the NZ government standard and recommended baseline)? | Product / Legal | Frontend development effort |
| 9 | Should the customer-facing event list be publicly accessible (no login), or accessible only to customers with an online banking session? | Product | Authentication scope |
| 10 | Who owns staff user provisioning — will staff accounts be managed via Azure AD groups, or does an admin need to manually add staff within the app? | IT / Community Banking | Staff auth design |

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Email confirmations land in spam / not delivered | Medium | High — customers think registration failed | Use Azure Communication Services with a properly configured sending domain (SPF, DKIM, DMARC). Test across common NZ email providers (Gmail, Xtra/Yahoo, Outlook). |
| Staff adopt the new system slowly — continue using inbox/phone | Medium | Medium | Keep the staff UI extremely simple. Involve 1–2 branch staff in UAT. Consider a short parallel-run period. |
| Capacity enforcement race condition (two customers registering simultaneously for the last spot) | Low | Low | Use a database-level transaction or optimistic locking on capacity check. At this scale this is manageable but should be designed correctly from the start. |
| Cancellation token guessed or misused | Very Low | Low | Use a cryptographically random UUID v4 token. Tokens are unguessable in practice. |
| Over-engineering the solution | Medium | Medium | The system is simple. Resist pressure to add microservices, event queues, or complex auth for what is a CRUD application at low volume. A single App Service and a SQL database is the right fit. |
| Scope creep (waitlists, reminders, surveys, CRM integration) | Medium | Medium | Lock scope for v1 clearly. Capture future requests as a backlog for v2. |

---

## 10. Recommended Phasing

### Phase 1 — MVP (Recommended initial delivery)

- Public event listing and event detail pages
- Customer registration form and confirmation email
- Email-based cancellation via token link
- Staff login, event creation/editing, registration list view, CSV export

**Estimated data throughput at MVP:** ~8,000 registrations/year. No scaling concerns.

### Phase 2 — Enhancements (Post-launch backlog)

- Automated pre-event reminder emails (24–48 hrs)
- Waitlist functionality
- Post-event feedback/survey link in follow-up email
- Staff reporting dashboard (registration trends, event fill rates)
- Customer "view my registrations" page (email lookup + optional OTP verification)

> Phase 2 items should not delay Phase 1 delivery. They are enhancements, not requirements.

---

## 11. What Good Looks Like — Definition of Done for Discovery

Before moving to design and build, the following should be confirmed:

- [ ] All open questions (Section 8) answered and documented
- [ ] Azure subscription and tenant confirmed, with deployment environment agreed