Great—here’s a solid “greenfield” blueprint for a simple event registration web app that fits your constraints (React frontend, Azure-hosted backend + database, ~8,000 registrations/year, manage registrations, staff CRUD for events, export attendee lists).

---

## 1) Goals & key features

### Customer-facing
- Browse upcoming events (date/time, format: workshop/webinar/in-branch, location/branch)
- Register for an event
- Receive confirmation email after successful registration
- View my registrations
- Cancel a registration
- (Optional but recommended) “Email/phone lookup” flow so customers can manage registrations without authentication, e.g.:
  - Enter email → show registrations tied to that email
  - Or “magic link” emailed after registration (still simple, but slightly more work)

### Staff-facing
- Create/edit events
- View registrations by event
- Export attendee list (CSV download)
- (Optional) Cancel/remove registrations if needed (with audit trail)

---

## 2) Proposed architecture (Azure)

### Recommended stack
- **Frontend:** React (hosted on **Azure Static Web Apps** or **Azure App Service**)
- **Backend:** **Azure Functions** (or **Azure App Service** if you prefer a more traditional API)
- **Database:** **Azure SQL Database** (or Postgres—SQL is fine for small/medium CRUD apps)
- **Email:** **SendGrid** (Azure provides first-class integration)

This is a good fit because your workload is low/moderate and CRUD-heavy.

### Why this design
- Easy to deploy, cost-effective at ~8k/year registrations
- Simple security model (role-based access for staff)
- Works well with CSV export, email confirmation, and auditing

---

## 3) Data model (tables)

### `events`
- `eventId` (GUID / identity)
- `title` (string)
- `description` (text)
- `eventType` (enum: Workshop/Webinar/InBranch)
- `startDateTime` (datetimeoffset)
- `endDateTime` (nullable)
- `location` (string, e.g., “In-branch: Auckland CBD”)
- `branchPreferenceRequired` (bool) or simply store branch mapping
- `maxCapacity` (int nullable)
- `isCancelled` (bool)
- `published` (bool)
- `createdAt`, `updatedAt`

### `registrations`
- `registrationId` (GUID / identity)
- `eventId` (FK -> events)
- `customerName` (string)
- `email` (string, indexed)
- `phone` (string)
- `branchPreference` (string) (or FK to a `branches` table)
- `isExistingEnterpriseCustomer` (bool)
- `createdAt` (datetimeoffset)
- `cancelledAt` (nullable)
- `cancelledBy` (nullable: user id or “customer”)
- `cancelReason` (optional)
- **Unique constraint suggestion:** `(eventId, email)` if it’s acceptable to limit duplicates by email. Otherwise allow duplicates and enforce with UI validation.

### `branches` (optional but clean)
- `branchId`
- `branchName`

### `audit_log` (recommended)
- `auditId`
- `actorType` (staff/customer/system)
- `actorId` (nullable)
- `action` (REGISTER/CANCEL/EXPORT/CREATE_EVENT/UPDATE_EVENT)
- `entityType` / `entityId`
- `timestamp`
- `metadata` (JSON)

---

## 4) Security & identity

### Staff authentication
- Use **Microsoft Entra ID (Azure AD)** for staff accounts.
- Protect staff endpoints with roles/groups like:
  - `EventManager` (create/edit events)
  - `EventStaff` (view registrations)
  - `EventAdmin` (export, cancel, etc.)

### Customer authentication (keep it simple)
You have a few options—most common for event registration apps:
1. **No login, lookup by email**
   - Customer enters email → system shows upcoming registrations for that email
   - Cancel action requires confirmation (email link) to prevent abuse
2. **Magic link**
   - Customer enters email, receives a login link, then can manage registrations
3. **Full auth**
   - Overkill for your volume unless you expect frequent future interactions.

**Recommendation:** email lookup + confirmation link for cancel/view is the simplest while staying safe.

---

## 5) Email confirmations

Use **SendGrid** and implement:
- On registration:
  - Confirmation email containing event details + “Cancel” link
- On cancellation:
  - Cancellation confirmation email (optional but recommended)

**Important:** cancellation links should be single-use + short-lived (e.g., 30 minutes / 24 hours), stored as a token table or encoded token with server-side verification.

---

## 6) API endpoints (example)

Customer:
- `GET /events?fromDate=...&toDate=...`
- `POST /registrations` (register)
- `GET /registrations/byEmail?email=...` (or a token-based variant)
- `POST /registrations/{id}/cancel` (via verified token)

Staff:
- `POST /events`
- `PUT /events/{id}`
- `GET /events`
- `GET /events/{id}/registrations`
- `GET /events/{id}/registrations/export?format=csv`

---

## 7) CSV export

For export:
- Generate CSV server-side from `registrations` where `eventId = ...`
- Include fields required by staff (name, email, phone, branch preference, enterprise flag, registration status)
- Return as file download (`Content-Type: text/csv`)

---

## 8) Frontend UX (React)

### Pages/components
- **Home / Events list**
  - Filter by date or branch (optional)
  - View event details modal/page
- **Event detail + Registration form**
  - Fields: name, email, phone, branch preference, enterprise customer yes/no
  - Client-side validation
- **My registrations**
  - Email lookup → display list
  - Cancel buttons per registration
- **Staff console**
  - Use a separate route with staff auth (or separate SPA “section”)
  - Event management: create/edit
  - Registrations list + CSV export

### Accessibility / validation basics
- Clear error messages
- Prevent double submission
- Basic bot protection for registration (see below)

---

## 9) Data protection & “greenfield” operational concerns

Even though volume is low, you should plan for:
- **Rate limiting** on registration endpoints (to prevent spam)
- **Bot protection** (e.g., reCAPTCHA/Turnstile—lightweight)
- **PII handling**
  - Encrypt at rest (Azure SQL default)
  - Restrict DB access (least privilege)
- **Retention policy**
  - How long you keep cancelled registrations and attendee data
  - Provide deletion/anonymization approach if required by your privacy policy

---

## 10) Non-functional requirements
- SLA: likely “best effort” initially
- Monitoring/logging:
  - App Insights for API + React error logging
- Backups:
  - Azure SQL automated backups
- Performance:
  - Fine with standard configuration; no special scaling expected

---

## 11) Development plan (phased)

### Phase 1 (MVP)
- Customer:
  - Events browse + event detail
  - Register (form + backend save)
  - Confirmation email
  - My registrations (email lookup + view)
  - Cancel (token/link or lookup-based confirm)
- Staff:
  - Create events
  - View registrations per event
  - Export CSV

### Phase 2 (hardening)
- Staff edit/delete flows, audit logs
- Capacity limit enforcement
- Better “My registrations” UX (magic link optional)
- Improved spam/bot handling

---

## 12) Clarifying questions (to finalize scope)
1. **Cancel rules:** Should customers be allowed to cancel any time, or only until event start time?
2. **Duplicate registrations:** Are multiple registrations per email for the same event allowed?
3. **Customer “manage registrations” method:** Do you prefer:
   - email lookup + cancel link, or
   - magic link login, or
   - require authentication?
4. **Branch data:** Do you already have a canonical list of branches for selection?
5. **Export fields:** What columns does the attendee list require (and any ordering/grouping)?

---

If you answer the 5 questions above, I can produce a concrete “next-step” deliverable: a recommended Azure architecture diagram + a finalized data schema (constraints/indexes) + an MVP user story list and endpoint contracts.