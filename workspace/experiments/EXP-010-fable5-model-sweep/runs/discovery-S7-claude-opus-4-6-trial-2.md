

# Discovery Document: Event Registration Web Application

## 1. Overview & Context

### 1.1 Background

The community banking team currently runs approximately 40 financial literacy events per year across New Zealand, including workshops, webinars, and in-branch seminars. Today, customers register by emailing a generic inbox or calling their branch. This process is manual, inconsistent, and creates administrative overhead for branch staff.

### 1.2 Objective

Build a greenfield, customer-facing event registration web application that allows customers to browse and register for upcoming events, and staff to manage events and attendee lists. The application will be hosted on Azure with a React frontend.

### 1.3 Scope Boundary

This application is a standalone system. It will **not** integrate with core banking systems or access any financial data. It collects limited personal information (name, email, phone, branch preference, existing customer status) solely for event registration and communication purposes.

---

## 2. Functional Requirements

### 2.1 Customer-Facing Features

| ID | Requirement | Detail |
|----|-------------|--------|
| F-C01 | Browse upcoming events | Customers can view a list of upcoming events with filtering by date, location/branch, and event type (workshop, webinar, in-branch seminar). Past events should not be displayed by default. |
| F-C02 | View event details | Each event displays: title, description, date/time, location (branch name or "Online" for webinars), available capacity, and event type. |
| F-C03 | Register for an event | Customer submits: full name, email address, phone number, preferred branch, and whether they are an existing customer (yes/no). Registration is confirmed immediately on-screen if capacity allows. |
| F-C04 | Receive confirmation email | Upon successful registration, the system sends an automated confirmation email with event details, date/time, location, and a link to manage the registration. |
| F-C05 | View own registrations | Customers can view their current and past registrations by entering their email address (with verification — see section 3). |
| F-C06 | Cancel a registration | Customers can cancel an upcoming registration. A cancellation confirmation email is sent, and the event capacity is freed. |
| F-C07 | Waitlist support | If an event reaches capacity, customers can join a waitlist. If a spot opens via cancellation, the next waitlisted customer is automatically registered and notified by email. |
| F-C08 | Reminder email | Customers receive an automated reminder email a configurable number of days before the event (default: 2 business days). |

### 2.2 Staff-Facing Features

| ID | Requirement | Detail |
|----|-------------|--------|
| F-S01 | Create / edit / cancel events | Staff can create new events specifying: title, description, date/time, location/branch, event type, and maximum capacity. Events can be edited or cancelled (with notification to all registered attendees). |
| F-S02 | View registrations per event | Staff can see the full attendee list for any event, including registration date/time, customer details, and registration status (confirmed, cancelled, waitlisted). |
| F-S03 | Export attendee list | Staff can export the attendee list for an event as a CSV file, containing all registration fields plus status. |
| F-S04 | Dashboard | Staff landing page shows: upcoming events with registration counts, events at or near capacity, and recent registrations across all events. |
| F-S05 | Manual registration | Staff can register a customer on their behalf (e.g., from a phone call), entering the same fields as the customer self-service form. |
| F-S06 | Event cancellation with notification | When staff cancel an event, all registered and waitlisted attendees receive a cancellation notification email. |

---

## 3. Non-Functional Requirements

### 3.1 Performance & Scale

| Attribute | Requirement |
|-----------|-------------|
| Expected volume | ~8,000 registrations/year (~40 events × ~200 registrations) |
| Concurrent users | Low. Peak expected during event promotion periods — estimated <50 concurrent users. |
| Response time | Page loads and form submissions should complete within 2 seconds under normal load. |
| Availability | 99.5% uptime during business hours (Mon–Fri, 8am–6pm NZT). Scheduled maintenance windows acceptable outside these hours. |

This is a low-volume system. The architecture should be right-sized accordingly — cost-efficiency matters more than horizontal scalability.

### 3.2 Security

| Attribute | Requirement |
|-----------|-------------|
| Staff authentication | Azure Active Directory (Entra ID) SSO for all staff access. No local staff accounts. |
| Customer identification | Customers are **not** required to create an account. Registration lookup uses email address with a one-time verification code sent to that email. This avoids password management while preventing unauthorised access to registrations. |
| Transport security | All traffic over HTTPS (TLS 1.2+). |
| Input validation | Server-side validation of all inputs. Protection against SQL injection, XSS, and CSRF. |
| Rate limiting | Rate limiting on registration and email verification endpoints to prevent abuse. |
| Data access | Staff access restricted by role (see section 3.4). No public API exposure beyond the customer-facing frontend. |

### 3.3 Privacy & Data Handling

| Attribute | Requirement |
|-----------|-------------|
| Data collected | Customer name, email address, phone number, branch preference, existing customer flag. |
| Privacy coverage | The privacy team has confirmed collection is covered under the existing Privacy Statement for marketing and customer engagement activities. No additional Privacy Impact Assessment is required. |
| Data retention | Registration data retained for **24 months** after the event date, then automatically purged. *Note: This requires explicit confirmation from the privacy team — see open question OQ-03.* |
| Data residency | All data stored within the Australia East Azure region (nearest Azure region to New Zealand with full service availability). *Confirm acceptability — see OQ-04.* |
| Right to deletion | Customers can request deletion of their data via the existing privacy request process. The application should support an admin function to delete all records associated with a given email address. |
| No sensitive data | No financial data, account numbers, or banking information is collected or stored. |

### 3.4 Roles & Permissions

| Role | Permissions |
|------|-------------|
| Customer (unauthenticated) | Browse events, register, view/cancel own registrations (via email verification). |
| Event Coordinator (staff) | All customer permissions plus: create/edit/cancel events, view registrations, export attendee lists, manual registration. |
| Admin (staff) | All coordinator permissions plus: manage staff role assignments, delete customer data, configure system settings (e.g., reminder timing). |

Staff roles managed via Azure AD security groups mapped to application roles.

### 3.5 Email

| Attribute | Requirement |
|-----------|-------------|
| Email types | Registration confirmation, cancellation confirmation, event reminder, event cancellation (by staff), waitlist promotion notification, email verification code. |
| Sending service | Azure Communication Services (or SendGrid — see OQ-06). Must support a branded "from" address (e.g., events@enterprise.co.nz). |
| Compliance | Emails are transactional (not marketing) and do not require unsubscribe links under NZ Unsolicited Electronic Messages Act 2007. |

---

## 4. Proposed Technical Architecture

### 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                                                                  │
│  ┌────────────┐     ┌─────────────────┐     ┌────────────────┐  │
│  │   Azure     │     │  Azure App      │     │  Azure SQL     │  │
│  │   Static    │────▶│  Service        │────▶│  Database      │  │
│  │   Web Apps  │     │  (Node.js API)  │     │  (Basic/S0)    │  │
│  │  (React SPA)│     │                 │     │                │  │
│  └────────────┘     └────────┬────────┘     └────────────────┘  │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │                   │                         │
│              ┌─────▼──────┐  ┌────────▼─────────┐              │
│              │  Azure     │  │  Azure            │              │
│              │  Comms     │  │  Active Directory │              │
│              │  Services  │  │  (Entra ID)       │              │
│              │  (Email)   │  │  (Staff Auth)     │              │
│              └────────────┘  └──────────────────┘              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Choices

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React (TypeScript) + React Router | Client preference. Hosted as a static site on Azure Static Web Apps (free/low-cost tier). |
| UI framework | To be determined in design phase | Options include Fluent UI, Chakra UI, or Tailwind CSS. Should support accessibility requirements. |
| Backend API | Node.js with Express or Fastify (TypeScript) | Aligns with React/TypeScript frontend skill set. Deployed to Azure App Service (B1 tier — sufficient for this volume). |
| Database | Azure SQL Database (Basic or S0 tier) | Relational data model suits structured event/registration data. Low-cost tier appropriate for ~8K records/year. |
| ORM | Prisma or TypeORM | Type-safe database access from TypeScript. |
| Authentication (staff) | Microsoft Entra ID (Azure AD) via MSAL | Enterprise SSO. No custom auth for staff. |
| Authentication (customer) | Email-based one-time code | Lightweight verification without account creation. Codes expire after 10 minutes, limited to 5 attempts. |
| Email | Azure Communication Services | Native Azure integration, pay-per-email pricing suits low volume. |
| Hosting | Azure Static Web Apps (frontend) + Azure App Service (API) | Simple deployment model. No containerisation needed at this scale. |
| CI/CD | GitHub Actions | Assumed — confirm source control platform (see OQ-07). |

### 4.3 Data Model (Conceptual)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    Event      │       │   Registration    │       │    Branch     │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ title        │──┐    │ event_id (FK)    │    ┌──│ name         │
│ description  │  │    │ customer_name    │    │  │ location     │
│ event_type   │  └───▶│ customer_email   │    │  │ is_active    │
│ date_time    │       │ customer_phone   │    │  └──────────────┘
│ location     │       │ branch_id (FK)───│────┘
│ branch_id(FK)│       │ is_existing_cust │
│ max_capacity │       │ status           │ ← confirmed|cancelled|waitlisted
│ status       │       │ registered_at    │
│ created_by   │       │ cancelled_at     │
│ created_at   │       └──────────────────┘
│ updated_at   │
└──────────────┘
```

### 4.4 Key API Endpoints (Illustrative)

**Public (customer-facing):**
- `GET /api/events` — List upcoming events (with filtering)
- `GET /api/events/:id` — Event detail
- `POST /api/registrations` — Register for an event
- `POST /api/registrations/lookup` — Request verification code for email
- `POST /api/registrations/verify` — Verify code and return registrations
- `DELETE /api/registrations/:id` — Cancel a registration (requires verification)

**Staff (authenticated):**
- `POST /api/admin/events` — Create event
- `PUT /api/admin/events/:id` — Update event
- `DELETE /api/admin/events/:id` — Cancel event
- `GET /api/admin/events/:id/registrations` — View registrations
- `GET /api/admin/events/:id/registrations/export` — Export CSV
- `POST /api/admin/registrations` — Manual registration

---

## 5. Assumptions

| ID | Assumption |
|----|------------|
| A-01 | The enterprise has an existing Azure tenancy with Entra ID configured for staff authentication. |
| A-02 | The enterprise has an existing domain (e.g., enterprise.co.nz) that can be configured for transactional email sending with appropriate SPF/DKIM records. |
| A-03 | No integration with any core banking system, CRM, or customer identity platform is required for the initial release. |
| A-04 | "Existing customer" is a self-declared field (yes/no checkbox) — the app will not verify this against any banking system. |
| A-05 | The application will be English-language only. No localisation requirement (e.g., Te Reo Māori) for the initial release. |
| A-06 | Staff will manually create events in the application. There is no integration with an existing calendar or event management system. |
| A-07 | No payment processing is required — all events are free of charge. |
| A-08 | The application does not need to support offline access or native mobile apps. A responsive web design is sufficient for mobile users. |
| A-09 | Duplicate registration prevention is based on email address per event — one registration per email per event. |
| A-10 | The privacy team's confirmation covers all data collection described in this document, and no separate Privacy Impact Assessment is required. |

---

## 6. Open Questions

| ID | Question | Impact | Suggested Default |
|----|----------|--------|-------------------|
| OQ-01 | What is the cancellation policy? Can customers cancel at any time, or is there a cutoff (e.g., 24 hours before the event)? | Affects cancellation logic and waitlist promotion timing. | Allow cancellation at any time up to the event start time. |
| OQ-02 | Should there be a limit on how many events a customer can register for simultaneously? | Affects registration validation. | No limit for initial release. |
| OQ-03 | What is the required data retention period for registration data? The privacy team has confirmed the data collection is covered, but we need a specific retention period. | Affects automated data purge implementation. | 24 months post-event, then automated purge. Requires privacy team sign-off. |
| OQ-04 | Is data residency in Azure Australia East acceptable, or is there a requirement for New Zealand-only data residency? Azure's New Zealand North region is now available. | Affects Azure region selection and potentially cost. | Australia East (most established region), but confirm with the enterprise's cloud and compliance teams. |
| OQ-05 | Are there accessibility requirements beyond standard best practice? (e.g., NZ Government Web Accessibility Standard, WCAG 2.1 AA compliance?) | Affects frontend design and testing scope. | Target WCAG 2.1 AA as a baseline. |
| OQ-06 | Is there an existing email sending service or preference within the enterprise? (e.g., SendGrid, existing SMTP relay) | Affects email infrastructure choice. | Use Azure Communication Services for native Azure integration. |
| OQ-07 | What is the enterprise's source control and CI/CD platform? (e.g., GitHub, Azure DevOps) | Affects pipeline configuration. | Assume GitHub with GitHub Actions; adjust if Azure DevOps. |
| OQ-08 | Is there an existing UI/brand style guide or design system that the application should conform to? | Affects frontend design phase. | If none exists, adopt a clean, accessible design with the enterprise's brand colours and logo. |
| OQ-09 | Who are the initial staff users, and how many Event Coordinator and Admin roles are anticipated? | Affects role configuration and onboarding. | Estimate 5–10 coordinators across branches plus 1–2 admins. |
| OQ-10 | Is there a requirement for event analytics or reporting beyond attendee lists (e.g., registration trends, no-show tracking, branch-level reporting)? | Affects