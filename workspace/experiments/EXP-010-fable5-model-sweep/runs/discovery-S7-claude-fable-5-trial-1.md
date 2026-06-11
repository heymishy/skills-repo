# Discovery Document: Community Event Registration Application

**Status:** Draft for review
**Pipeline stage:** Discovery
**Classification:** Greenfield, low-volume, customer-facing

---

## 1. Problem Statement

The community banking team runs ~40 financial literacy events per year, but registration is handled via a shared email inbox and branch phone calls. This creates:

- Manual effort collating registrations and producing attendee lists
- No self-service for customers to view, change, or cancel registrations
- No real-time view of capacity or uptake per event
- Inconsistent confirmation communications
- Risk of lost or duplicated registrations

## 2. Proposed Solution (One-liner)

A lightweight, customer-facing web application for browsing and registering for financial literacy events, with a staff portal for event management and attendee export.

---

## 3. Users & Personas

| Persona | Description | Key needs |
|---|---|---|
| **Customer / Public attendee** | Existing or prospective customers, all ages and digital confidence levels | Browse events, register quickly, receive confirmation, cancel easily |
| **Event coordinator (staff)** | Community banking team member | Create/edit events, monitor registrations, export attendee lists |
| **Branch staff** | May register customers on their behalf (phone/walk-in) | Quick registration entry — *needs confirmation whether in scope* |

---

## 4. Functional Scope

### In Scope (MVP)

**Customer-facing:**
- Browse/search upcoming events (filter by type: workshop, webinar, in-branch seminar; by location/branch; by date)
- Event detail page (description, date/time, location or webinar link, capacity remaining)
- Register: name, email, phone, branch preference, existing-customer flag
- Email confirmation on registration
- Manage registrations: view and cancel

**Staff-facing:**
- Create, edit, publish, and cancel events
- View registrations per event (live count vs. capacity)
- Export attendee list (CSV)

### Likely Needed — Confirm Before Build (currently ambiguous)

- **Capacity limits and waitlists** — does a full event close registration? Is a waitlist needed?
- **Reminder emails** (e.g., 48 hours before event) — high value, low cost; recommend including
- **Cancellation notifications to registrants** when staff cancel an event
- **Staff-assisted registration** for phone/walk-in customers

### Out of Scope (Confirmed)

- Integration with core banking systems
- Access to any financial data
- Payments (events assumed free — *confirm*)
- Marketing automation / CRM sync (*confirm — see open questions*)

---

## 5. Key Design Decision: Customer Authentication

This is the most consequential open decision. Options:

| Option | Pros | Cons |
|---|---|---|
| **A. No accounts — magic link** (email link to manage/cancel a registration) | Lowest friction, no password handling, minimal PII, simplest build | No persistent "my registrations" view across events without entering email |
| **B. Email + OTP code** | Lightweight identity, allows "my registrations" view | Slightly more build effort |
| **C. Full accounts (Azure AD B2C / Entra External ID)** | Standard auth, future extensibility | Overkill for 8,000 registrations/year; password reset burden; more PII |

**Recommendation:** Option A or B. For a low-volume, low-sensitivity system, avoid storing credentials entirely. Staff portal should use **Microsoft Entra ID (corporate SSO)** — non-negotiable for a bank-internal admin surface.

---

## 6. Proposed Architecture

Sized deliberately small — ~8,000 registrations/year is very low volume.

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | React SPA on **Azure Static Web Apps** | Stated preference; SWA gives free SSL, CDN, staging slots |
| API | **Azure Functions** (consumption or flex) or small App Service | Low, bursty traffic; serverless fits well and costs near-zero |
| Database | **Azure SQL Database (serverless tier)** | Relational fit (events ↔ registrations), familiar tooling, cheap at this scale |
| Email | **Azure Communication Services** or enterprise-approved SMTP relay | Confirmations, reminders, cancellations — *check bank's approved email channel* |
| Staff auth | **Microsoft Entra ID** | Corporate SSO, MFA inherited |
| Hosting environment | Bank's existing **Azure landing zone** | *Confirm tenancy, subscription, and network policy with platform team* |

**Indicative data model:** `Event` (title, type, datetime, location/branch, capacity, status) → `Registration` (name, email, phone, branch preference, existing-customer flag, status, timestamps). Two tables plus reference data covers the MVP.

---

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Privacy** | NZ Privacy Act 2020 applies. Privacy team has confirmed collection basis — **but data retention is unresolved**: define how long registration PII is kept post-event (recommend auto-purge or anonymise after a defined period, e.g., 90 days, unless analytics requires aggregates) |
| **Security** | Bank-branded public site = phishing-adjacent surface. Must follow enterprise web security standards, WAF/front-door policy, approved domain (e.g., `events.bank.co.nz`), pen test before launch |
| **Accessibility** | **WCAG 2.1 AA minimum** — essential given financial-literacy audience skews toward varied digital confidence; likely a hard requirement under bank accessibility policy |
| **Availability** | Business-hours criticality only; standard SLAs fine. No HA complexity warranted |
| **Performance** | Trivial at this scale; spike consideration only if events are promoted via mass email/social |
| **Rate limiting / abuse** | Public form collecting PII → needs bot protection (CAPTCHA or equivalent) and duplicate-registration handling |
| **Data residency** | Confirm whether bank policy requires NZ/Australia-region Azure hosting |

---

## 8. Risks & Assumptions

**Risks**
1. **Brand/phishing risk** — a bank-branded public site collecting PII will attract scrutiny from security; engage InfoSec early (likely the longest lead-time dependency)
2. **Email deliverability** — confirmations from a new sending domain may be filtered; use the bank's established email infrastructure if possible
3. **Scope creep toward CRM/marketing** — the privacy approval references "marketing and customer engagement"; if data later feeds marketing systems, the consent UX and privacy assessment may need revisiting
4. **"Existing customer" flag** — even unverified, this is customer-relationship data; confirm classification with privacy/security

**Assumptions (to validate)**
- Events are free; no payment processing
- English-only UI for MVP (*te reo Māori support worth asking*)
- One registration = one attendee (no group bookings)
- Webinar links are managed manually or pasted into event details (no Teams/Zoom integration in MVP)
- Bank has an existing Azure landing zone and DevOps tooling this can slot into

---

## 9. Open Questions for Stakeholders

1. Customer auth model — magic link vs. OTP vs. accounts? (Recommend magic link/OTP)
2. Capacity limits and waitlists — required for MVP?
3. Can a customer register multiple attendees (e.g., a couple)?
4. Reminder emails — in MVP?
5. Data retention period for registration PII post-event?
6. Which email-sending channel is enterprise-approved?
7. Domain/branding approval process and owner?
8. Does staff-assisted registration (phone/walk-in) need a UI path?
9. Any reporting beyond CSV export (e.g., attendance tracking, no-show rates)?
10. Who owns the system post-launch (support, content, ops)?
11. Is there an existing events/CMS capability in the bank this could reuse instead of building? *(Worth one conversation before committing to greenfield.)*

---

## 10. Indicative Sizing

| Workstream | Rough effort |
|---|---|
| Customer-facing app (browse, register, manage, emails) | 3–4 weeks |
| Staff portal (events CRUD, registrations view, export, Entra auth) | 2–3 weeks |
| Infrastructure, CI/CD, environments in bank landing zone | 1–2 weeks |
| Security review, pen test remediation, accessibility audit | 2–3 weeks (much of it elapsed/lead time) |
| **Total** | **~8–12 weeks** for a small team (1–2 engineers + part-time design/PO), heavily dependent on bank governance lead times |

The build itself is straightforward; **governance (InfoSec, brand, domain, privacy sign-off on retention) is the critical path**, not engineering.

---

## 11. Recommended Next Steps

1. Resolve auth model and capacity/waitlist questions with the community banking team
2. Engage InfoSec and the Azure platform team — confirm landing zone, domain, WAF, and pen-test scheduling
3. Confirm data retention policy with privacy team (the one privacy gap remaining)
4. Validate email channel with the enterprise messaging team
5. Proceed to **solution design / architecture stage** with the decisions above locked in

Would you like me to drill into any area — e.g., the data model, the auth flow comparison, or a draft architecture diagram?