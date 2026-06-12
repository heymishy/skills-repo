Got it. Below is a solid “/discovery” style plan for a greenfield event registration app that fits your requirements and scale, with a React frontend and an Azure-hosted backend + database.

---

## 1) Key outcomes (what we will build)

### Customer-facing
- Browse upcoming events (date/time/location/format)
- Register for an event with fields:
  - Full name
  - Email
  - Phone number
  - Branch preference
  - Existing enterprise customer (Yes/No)
- Receive an email confirmation after registration
- Manage registrations:
  - View my registrations
  - Cancel a registration

### Staff-facing
- Create/edit events
- View registrations per event
- Export attendee lists (CSV)

### Operational / non-functional
- Simple, secure, auditable admin actions
- Reasonable protections against duplicate bookings and abuse (lightweight since volume is low)
- Email delivery for confirmations
- Basic reporting/search

---

## 2) Recommended architecture (Azure)

### Frontend
- **React** SPA (or Next.js if you prefer SSR—either is fine)
- Hosted on **Azure Static Web Apps** or **Azure App Service**

### Backend (API)
Pick one of these (both common in Azure greenfield):
- **Option A: .NET (ASP.NET Core Web API)** + Azure SQL
- **Option B: Node.js (NestJS/Express)** + Azure SQL

**Recommendation:** .NET Web API + Azure SQL for fastest “enterprise-friendly” admin/auth patterns.

### Database
- **Azure SQL Database** (best fit for relational data + exports)
- Keep schema normalized for events + registrations

### Authentication / authorization
- Staff: **Microsoft Entra ID** (Azure AD) recommended
- Customers: since this is “manage my registrations,” we have two easy patterns:
  1. **Magic link / token emailed** (email-based, no password) → preferred for UX
  2. Use **email + OTP** or passwordless auth (also Entra-supported options)
  
Given your requirements and privacy constraints, **magic-link** style is usually simplest.

### Email
- **Azure Communication Services** or **SendGrid**
- Send confirmation on:
  - Successful registration
  - Cancellation (optional but commonly expected)

### Hosting & networking
- API on **Azure App Service** or **Azure Functions**
- Use **App Service Environment** only if needed (likely not for your scale)
- Use secrets via **Azure Key Vault**

---

## 3) Data model (core entities)

Relational tables (example):
1. **Events**
   - EventId (GUID/identity)
   - Title
   - Description
   - StartDateTime (with timezone handling)
   - EndDateTime (optional)
   - Format (Workshop/Webinar/In-branch)
   - Location/Branch code (if applicable)
   - Capacity (optional)
   - Status (Draft/Published/Cancelled)
   - CreatedBy/CreatedAt

2. **Registrations**
   - RegistrationId (GUID/identity)
   - EventId (FK)
   - CustomerName
   - Email
   - Phone
   - BranchPreference
   - IsExistingEnterpriseCustomer (bool)
   - RegistrationStatus (Active/Cancelled)
   - CancelledAt (nullable)
   - CancelledReason (optional)
   - CreatedAt

3. **CustomerAccessTokens** (for “manage registrations”)
   - TokenId
   - Email
   - TokenHash
   - ExpiresAt
   - UsedAt
   - CreatedAt

Optional but useful:
- **RegistrationEventsAudit** (who did what, especially for staff exports/cancels)
- **EventCapacityUsage** (derived, or computed via count)

**Uniqueness / duplicate handling (important):**
- Decide whether duplicates are allowed. Common approach:
  - Allow multiple registrations per email for different events
  - Prevent duplicate registration for the same event + email within a short window
- Enforce with a unique constraint like `(EventId, Email)` *if that matches policy*.

---

## 4) Key user flows

### Customer: browse events
1. GET `/events?status=upcoming`
2. UI lists cards with title, date/time, branch/location, “Register” button

### Customer: register
1. GET `/events/{eventId}`
2. POST `/events/{eventId}/registrations`
3. Backend validates input + checks event status
4. Save registration
5. Send confirmation email
6. Return success page with “Manage my registration” (magic link button)

### Customer: manage registrations
Two common approaches:

**Approach 1 (recommended): Magic link**
- Customer enters email → POST `/registrations/manage/request-link`
- Email sent with token link: `/registrations/manage?token=...`
- On link open:
  - Validate token
  - Show list of upcoming/current registrations for that email
- Cancel registration:
  - POST `/registrations/{registrationId}/cancel` (with authorization tied to token/session)

**Approach 2: “View by email only” without auth**
- Customer enters email → system shows registrations
- Cancel action requires extra confirmation (email link)
- Slightly easier, but less secure unless you do careful tokenization

### Staff: create events
- Staff UI or admin API:
  - Create event (title, schedule, description, location)
  - Set to “Published” when ready

### Staff: view + export attendees
- Staff page:
  - Filter by event
  - View attendee list
  - Export CSV of active registrations (and/or include cancelled optionally)

---

## 5) Security & compliance considerations

Even though you’re covered by existing privacy statements, we still need practical safeguards:

- Store only required data
- HTTPS everywhere
- Role-based access for staff via Entra ID
- Customer “manage” access protected by magic links/tokens with short expiration (e.g., 30–60 minutes)
- Rate limiting:
  - Registration endpoint (per IP/email)
  - Magic link requests (per email)
- Data retention:
  - Decide how long to keep registration records (e.g., retain for X months/years for reporting)
- Audit trail for:
  - Staff export
  - Staff changes/cancellations

---

## 6) API surface (example)

Public customer APIs:
- `GET /api/events`
- `GET /api/events/{eventId}`
- `POST /api/events/{eventId}/registrations`
- `POST /api/registrations/manage/request-link`
- `GET /api/registrations/manage?token=...`
- `POST /api/registrations/{registrationId}/cancel`

Staff/admin APIs:
- `POST /api/staff/events`
- `PATCH /api/staff/events/{eventId}`
- `GET /api/staff/events/{eventId}/registrations`
- `GET /api/staff/events/{eventId}/registrations/export?format=csv`

---

## 7) Implementation plan (phased)

### Phase 1 — MVP (end-to-end, fastest value)
- Events listing + event detail
- Registration form + backend persistence
- Confirmation email
- Customer “manage registrations” via magic link
- Staff: create events + list registrations + basic CSV export

### Phase 2 — Hardening & operational polish
- Validation improvements + duplicate protection rules
- Capacity limits (optional)
- Better event search/filtering
- Admin UI improvements
- Logging/monitoring dashboards

### Phase 3 — Governance & enhancements
- Audit log viewer
- Scheduled cleanup/retention jobs
- Localization/timezone correctness

---

## 8) Effort & sizing (high-level)

Given the low volume and greenfield scope:
- MVP typically lands in a few sprints (exact depends on whether you already have Entra tenant setup, email infrastructure, and how polished the admin UI needs to be).
- Staff/admin UI can be done as:
  - A simple React admin area using Entra auth
  - Or a lighter approach (staff uses a set of pages + export buttons)

If you want, I can provide a more concrete sprint plan once you confirm your preferred backend language (.NET vs Node) and admin UX style.

---

## 9) Clarifying questions (to finalize design)

1. **Duplicate policy:** Should a customer be able to register multiple times for the *same* event (usually no)?
2. **Capacity:** Do events have limited seats? If yes, do we enforce capacity at registration time?
3. **Cancellation UX:** When a customer cancels, should they:
   - immediately see it reflected in their list only, or also get a cancellation email?
4. **Branch preference:** Is it a free-text value, or a controlled list (e.g., NZ branches)?
5. **Staff user experience:** Do staff need a full CRUD admin UI (React pages), or is an API + basic pages sufficient?
6. **Timezones:** Are all events in NZ local time (likely yes), and do you need daylight saving correctness?

---

If you answer the 6 questions above, I’ll turn this into a concrete deliverable: recommended tech choices (exact Azure services), a proposed database schema (tables + indexes), and an MVP sprint plan with acceptance criteria.