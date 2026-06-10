

# Discovery Document: Event Registration Web Application

## 1. Overview & Objectives

### 1.1 Problem Statement
The community banking team runs approximately 40 financial literacy events per year across New Zealand (workshops, webinars, and in-branch seminars). Currently, customers register by emailing a generic inbox or calling their branch — a manual, fragmented process that creates administrative overhead, lacks visibility into attendee numbers, and provides no self-service capability for customers.

### 1.2 Project Objective
Build a greenfield, customer-facing event registration web application that allows customers to browse upcoming events, register, receive confirmation emails, and manage their registrations. Staff require the ability to create and manage events, view registrations, and export attendee lists.

### 1.3 Expected Outcomes
- Eliminate manual email/phone registration workflows
- Give customers self-service registration and management capability
- Give staff a centralised tool for event administration and attendee tracking
- Provide a foundation that can be extended over time if needs grow

### 1.4 Scale & Volume Profile
| Metric | Value |
|---|---|
| Events per year | ~40 |
| Registrations per event | ~200 |
| Total registrations per year | ~8,000 |
| Concurrent peak users (estimated) | Low — likely < 50 |

This is a low-volume, low-throughput system. Architecture decisions should favour simplicity and cost-efficiency over horizontal scalability.

---

## 2. Functional Requirements

### 2.1 Customer-Facing Features

#### 2.1.1 Browse Upcoming Events
- Customers can view a list of upcoming events without logging in
- Each event displays: title, description, date/time, location (branch name or "Online"), event type (workshop / webinar / seminar), and available capacity
- Customers can filter or search by date, location/branch, and event type
- Past events are hidden from the default browse view

#### 2.1.2 Register for an Event
- Customers complete a registration form collecting:
  - Full name (required)
  - Email address (required)
  - Phone number (required)
  - Branch preference (selected from a predefined list, required)
  - Whether they are an existing customer of the enterprise (yes/no, required)
- No account creation or login is required to register
- Duplicate registration prevention: if the same email address is submitted for the same event, the system should reject it with a clear message
- Registration should be blocked once an event reaches capacity
- Upon successful registration, a confirmation is displayed on-screen and a confirmation email is sent

#### 2.1.3 Confirmation Email
- Sent immediately upon successful registration
- Contains: event title, date/time, location/format, and a unique link to manage the registration
- The manage-registration link serves as the lightweight authentication mechanism (tokenised URL)

#### 2.1.4 Manage Registration
- Via the tokenised link in the confirmation email, a customer can:
  - View their registration details and event information
  - Cancel their registration
- Cancellation triggers a cancellation confirmation email
- Cancelling a registration frees up the capacity slot for the event

### 2.2 Staff-Facing Features

#### 2.2.1 Authentication & Access
- Staff access is protected behind authentication (Azure Entra ID / the enterprise SSO, see Section 5)
- All staff-facing features sit behind this authenticated boundary
- Initial scope assumes a single "staff" role — no granular role-based permissions in v1

#### 2.2.2 Create & Manage Events
- Staff can create a new event with the following fields:
  - Title (required)
  - Description (required, rich text or plain text)
  - Date and time (required, NZ timezone)
  - Location — branch name (selected from predefined list) or "Online" (required)
  - Event type — workshop, webinar, seminar (required)
  - Maximum capacity (required)
- Staff can edit event details for upcoming events
- Staff can cancel an event — this should trigger notification emails to all registered attendees
- Staff can view a list of all events (upcoming and past)

#### 2.2.3 View Registrations
- For any event, staff can view the full list of registrations with all collected fields
- Display a count of registered vs. capacity

#### 2.2.4 Export Attendee Lists
- Staff can export the attendee list for a given event as a CSV file
- Export includes all collected registration fields plus registration date/time

### 2.3 Out of Scope for v1
- Customer accounts or login
- Integration with core banking systems
- Financial data access of any kind
- Payment processing
- Waitlist functionality (could be a future enhancement)
- Event reminders or follow-up emails beyond confirmation/cancellation
- Multi-language support
- Accessibility beyond standard WCAG 2.1 AA compliance (which is in scope — see NFRs)

---

## 3. Data Model (Logical)

### 3.1 Core Entities

#### Event
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| title | string | required |
| description | text | required |
| date_time | datetime (NZ tz) | required |
| location | string | required (branch name or "Online") |
| event_type | enum | workshop, webinar, seminar |
| max_capacity | integer | required, > 0 |
| status | enum | active, cancelled |
| created_at | datetime | system-generated |
| updated_at | datetime | system-generated |
| created_by | string | staff identifier |

#### Registration
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| event_id | UUID | FK → Event |
| full_name | string | required |
| email | string | required |
| phone | string | required |
| branch_preference | string | required (from predefined list) |
| is_existing_customer | boolean | required |
| status | enum | confirmed, cancelled |
| manage_token | string | unique, system-generated |
| created_at | datetime | system-generated |
| cancelled_at | datetime | nullable |

#### Branch (Reference Data)
| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | string | required, unique |
| is_active | boolean | default true |

### 3.2 Key Constraints
- Unique constraint on (event_id, email) where status = confirmed — prevents duplicate active registrations
- Registration count against max_capacity should be enforced at the application layer with appropriate concurrency handling (see Section 6.2)

---

## 4. Technical Architecture

### 4.1 High-Level Architecture

```
┌─────────────────┐         ┌──────────────────────┐        ┌─────────────────┐
│                  │  HTTPS  │                      │        │                 │
│  React SPA       ├────────►│  API (Azure App      ├───────►│  Azure SQL DB   │
│  (Static Web App)│◄────────┤  Service / Node.js)  │◄───────┤  or PostgreSQL  │
│                  │         │                      │        │  (Flexible Srv) │
└─────────────────┘         └──────────┬───────────┘        └─────────────────┘
                                       │
                                       │
                            ┌──────────▼───────────┐
                            │                      │
                            │  Azure Communication │
                            │  Services (Email)    │
                            │  or SendGrid         │
                            └──────────────────────┘
```

### 4.2 Frontend
| Decision | Detail |
|---|---|
| Framework | React (as per stated preference) |
| Hosting | Azure Static Web Apps |
| Routing | Client-side (React Router) |
| Styling | To be determined during design — recommend a lightweight component library (e.g., Radix + Tailwind) for speed |
| State management | Minimal — React Query or SWR for server state; local state for forms |

**Key views:**
- Public event listing (browse/filter)
- Event detail & registration form
- Registration confirmation page
- Manage registration page (accessed via token link)
- Staff: event list, event creation/edit form, registration viewer, CSV export

### 4.3 Backend API
| Decision | Detail |
|---|---|
| Runtime | Node.js with TypeScript (aligns with React frontend skill set) |
| Framework | Express.js or Fastify |
| Hosting | Azure App Service (B1 tier is sufficient at this scale) |
| API style | REST |
| Authentication (staff) | Azure Entra ID (OAuth 2.0 / OIDC) via MSAL |
| Authentication (customer) | None for browsing/registration; tokenised URLs for manage-registration |

**API Endpoints (indicative):**

*Public:*
- `GET /api/events` — list upcoming events (filterable)
- `GET /api/events/:id` — event detail
- `POST /api/events/:id/registrations` — register for event
- `GET /api/registrations/:token` — view registration by manage token
- `PATCH /api/registrations/:token/cancel` — cancel registration

*Staff (authenticated):*
- `POST /api/staff/events` — create event
- `PUT /api/staff/events/:id` — update event
- `PATCH /api/staff/events/:id/cancel` — cancel event
- `GET /api/staff/events/:id/registrations` — list registrations
- `GET /api/staff/events/:id/registrations/export` — CSV export

### 4.4 Database
| Decision | Detail |
|---|---|
| Engine | Azure Database for PostgreSQL — Flexible Server (recommended) or Azure SQL Database |
| Tier | Burstable B1ms (1 vCore, 2 GB RAM) — more than sufficient for this volume |
| Rationale for PostgreSQL | Lower cost at this tier, simpler licensing, strong ecosystem support with Node.js |

**Note:** Either PostgreSQL or Azure SQL is viable at this scale. If the enterprise has existing Azure SQL licensing or operational familiarity, Azure SQL is a reasonable alternative. This should be confirmed with the infrastructure/platform team.

### 4.5 Email Service
| Decision | Detail |
|---|---|
| Service | Azure Communication Services (Email) — recommended for Azure-native approach |
| Alternative | SendGrid (Azure marketplace integration available) if ACS Email is not provisioned |
| Volume | ~16,000 emails/year maximum (confirmation + cancellation) — well within free/low tiers |
| Sending address | To be confirmed — e.g., `events@[enterprise domain]` or a subdomain |

Emails should be sent asynchronously from the registration API call to avoid blocking the user response. At this volume, a simple fire-and-forget pattern with retry logic is sufficient — a full message queue is not warranted.

### 4.6 Infrastructure & Deployment
| Aspect | Approach |
|---|---|
| Infrastructure as Code | Bicep or Terraform (confirm enterprise preference) |
| CI/CD | Azure DevOps Pipelines or GitHub Actions |
| Environments | Development, Staging/UAT, Production (minimum) |
| Container vs. PaaS | Recommend direct App Service deployment (no containerisation needed at this scale) |
| DNS/Custom domain | To be confirmed with the enterprise |
| SSL/TLS | Managed certificates via Azure (enforced HTTPS) |

---

## 5. Security Considerations

### 5.1 Authentication & Authorisation
| Concern | Approach |
|---|---|
| Customer browsing/registration | No authentication required — public-facing |
| Customer managing registration | Tokenised URL (cryptographically random token, ≥ 32 bytes, URL-safe). Not guessable. Tokens should not encode any PII. |
| Staff access | Azure Entra ID (enterprise SSO). Backend validates JWT tokens issued by Entra ID. Staff routes are protected by middleware. |
| Authorisation | v1: single staff role. All authenticated staff users can perform all staff actions. Granular RBAC can be added in a future iteration if required. |

### 5.2 Data Protection
- All data in transit: TLS 1.2+ enforced
- All data at rest: encrypted via Azure platform-level encryption (enabled by default on Azure SQL/PostgreSQL and App Service)
- Manage-registration tokens: stored hashed or as opaque random values — never derived from PII
- No financial data is collected or stored
- No integration with core banking systems

### 5.3 Input Validation & API Security
- Server-side validation on all inputs (name, email format, phone format, enum values)
- Rate limiting on the registration endpoint to prevent abuse (e.g., 10 requests per minute per IP)
- Rate limiting on the manage-registration token endpoint to prevent enumeration
- CORS configured to allow only the frontend origin
- Standard security headers (CSP, X-Frame-Options, etc.) on the frontend

### 5.4 Privacy
- The enterprise privacy team has confirmed that the data collected (name, email, phone) for event registration is covered under the existing Privacy Statement for marketing and customer engagement activities
- A link to the Privacy Statement should be displayed on the registration form
- Data retention policy should be defined: recommend retaining registration data for a defined period (e.g., 12–24 months) after the event, then archiving or purging — **this needs confirmation from the privacy/legal team**
- Customer cancellation removes the registration from active views but should soft-delete (retain for audit) — confirm retention requirements

---

## 6. Key Design Decisions & Assumptions

### 6.1 No Customer Accounts
Customers do not create accounts or log in. Registration is form-based. The manage-registration flow uses a tokenised link sent via email. This keeps the system simple and reduces the data footprint. The tradeoff is that a customer who loses the email cannot self-service their registration (staff can assist).

### 6.2 Capacity Enforcement
At ~200 registrations per event and low concurrency, race conditions on capacity are unlikely but should be handled. Recommended approach: use a database-level transaction that checks current confirmed registration count against max_capacity before inserting. This is sufficient — no distributed locking or queue-based approach is needed.

### 6.3 Time Zones
All event times should be stored in UTC and displayed in NZ time (Pacific/Auckland, including daylight saving handling). The frontend is responsible for display formatting.

### 6.4 Branch List Management
The branch list is reference data. For v1, this can be seeded via a database migration or a simple staff admin endpoint. A full branch management UI is not in scope unless requested.

### 6.5 No Waitlist in v1
If an event is full, the customer sees a clear message that registration is closed. Waitlist functionality is a candidate for a future iteration.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Availability** | 99.5% uptime is acceptable. This is not a business-critical transaction system. Azure App Service SLA (99.95%) exceeds this. |
| **Performance** | Page load < 2 seconds. API response < 500ms for standard operations. Easily achievable at this scale. |
| **Scalability** | System is designed for ~8,000 registrations/year. No auto-scaling needed. Single App Service instance is sufficient. |
| **Accessibility** | WCAG 2.1 AA compliance. This is customer-facing for a New Zealand bank — accessibility is a regulatory and reputational expectation. |
| **Browser support** | Last 2 major versions of Chrome, Firefox, Safari, Edge. Mobile-responsive design. |
| **Monitoring** | Azure Application Insights for API logging, error tracking, and basic dashboards. Alerts on 5xx error rates and availability. |
| **Backup & Recovery** | Azure-managed database backups with 7-day point-in-time restore (default on Azure PostgreSQL Flexible Server). |
| **Disaster Recovery** | Given the low criticality: single-region deployment is acceptable. RTO of 4 hours, RPO of 1 hour. |

---

## 8. Open Questions & Items Requiring Confirmation

| # | Question | Owner / Audience | Impact |
|---|---|---|---|
| 1 | Does the enterprise have an existing Azure Entra ID tenant and app registration process for staff authentication? | Infrastructure / Identity team | Blocks staff auth implementation |
| 2 | PostgreSQL or Azure SQL — does the enterprise have a preference or existing licensing? | Infrastructure / DBA team | Database selection |
| 3 | Is Azure Communication Services (Email) available, or should we plan for SendGrid or another provider? | Infrastructure / Platform team | Email implementation |
| 4 | What is the required data retention period for registration data after an event? | Privacy / Legal team | Data lifecycle implementation |
| 5 | What sending email address should be used for confirmation emails? Does the domain require SPF/DKIM configuration? | Marketing / Infrastructure team | Email deliverability |