# /discovery Pipeline Analysis: Event Registration Application

## Executive Summary
This is a **low-to-medium complexity greenfield project** with straightforward requirements, moderate scale, and manageable compliance scope. The technical architecture is well-defined, but success depends heavily on **planning for staff workflows and data governance** from the start.

---

## 1. DISCOVERY FINDINGS

### Confirmed Scope ✓
- **Users**: Customers (read/register) + Staff (CRUD events + export)
- **Core Features**: Browse → Register → Confirm → Manage (view/cancel)
- **Data**: Name, email, phone, branch preference, customer status (no financial data access)
- **Scale**: ~8,000 registrations/year (~17/day average, 200/event peak)
- **Compliance**: Privacy coverage confirmed; no regulated financial data involved

### Critical Unknowns ❌
Before committing to build, you **must** clarify:

| Question | Impact | Priority |
|----------|--------|----------|
| **Staff access model**: All staff can create events, or only "admins"? | Architecture & security | HIGH |
| **Multi-branch support**: Are events branch-specific or national? Do staff see only their branch's data? | Feature scope & access control | HIGH |
| **Email sending**: Use bank's existing system or third-party (SendGrid, etc.)? | Architecture & dependencies | HIGH |
| **Analytics needed**: Just attendee lists, or no-shows/engagement tracking? | Data model design | MEDIUM |
| **Cancellation policy**: When can customers/staff cancel? Refund/confirmation needed? | Business logic | MEDIUM |
| **Accessibility requirements**: WCAG 2.1 AA required? | Dev effort & testing | MEDIUM |
| **Mobile-first or desktop-first**: Expected device mix? | Design & testing scope | LOW |

---

## 2. RECOMMENDED TECHNICAL ARCHITECTURE

### Stack (Aligned with Preferences)
```
Frontend:  React 18 + TypeScript + Vite
Backend:   Node.js (Express) or .NET (C#)
Database:  Azure SQL Database (relational, structured data)
Hosting:   Azure App Service (backend) + Static Web Apps (frontend)
Auth:      Azure AD B2C (customer registration) or simple email-based
Email:     Azure Communication Services or SendGrid
Storage:   Azure Blob Storage (for attendee list exports)
```

**Why this stack:**
- ✓ React expertise likely available in NZ banking sector
- ✓ Azure integrates natively (cost, compliance auditing, identity)
- ✓ Low operational overhead; managed services reduce DevOps burden
- ✓ SQL Database handles relational data cleanly (events → registrations → attendees)

### Architecture Diagram (High-Level)
```
┌─────────────────────────────────────────────────────────────┐
│ CUSTOMER PORTAL              │ STAFF PORTAL                  │
│ (React SPA)                  │ (React SPA)                   │
│ - Browse events              │ - Create/edit events          │
│ - Register                   │ - View registrations          │
│ - Manage registrations       │ - Export attendee list        │
└──────────────┬───────────────┴──────────────┬────────────────┘
               │                              │
        ┌──────▼──────────────────────────────▼──────┐
        │  Azure API Management (optional)           │
        │  - Rate limiting, versioning               │
        └──────┬────────────────────────────────────┘
               │
        ┌──────▼─────────────────────────────┐
        │ Backend API (Node/C#)               │
        │ - /api/events (GET, POST)           │
        │ - /api/registrations (POST, DELETE) │
        │ - /api/attendees/export (GET CSV)   │
        └──────┬─────────────────────────────┘
               │
        ┌──────▴──────────────┬────────────────┐
        │                     │                │
    ┌───▼────┐         ┌──────▼────┐    ┌─────▴──────┐
    │ Azure   │         │ Azure AD  │    │ Azure      │
    │ SQL DB  │         │ B2C/AD    │    │ Comm       │
    │         │         │           │    │ Services   │
    └─────────┘         └───────────┘    └────────────┘
```

---

## 3. DATA MODEL (Relational)

```sql
-- Core tables
CREATE TABLE Events (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  title NVARCHAR(200) NOT NULL,
  description NVARCHAR(MAX),
  eventDate DATETIME NOT NULL,
  capacity INT NOT NULL,
  branch NVARCHAR(50), -- or FK to Branches table
  createdBy NVARCHAR(256), -- staff email
  createdAt DATETIME DEFAULT GETUTCDATE(),
  status NVARCHAR(20) -- 'draft', 'published', 'closed', 'cancelled'
);

CREATE TABLE Registrations (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  eventId UNIQUEIDENTIFIER NOT NULL,
  customerEmail NVARCHAR(256) NOT NULL,
  customerName NVARCHAR(200) NOT NULL,
  phoneNumber NVARCHAR(20),
  branchPreference NVARCHAR(50),
  isExistingCustomer BIT,
  registeredAt DATETIME DEFAULT GETUTCDATE(),
  status NVARCHAR(20), -- 'confirmed', 'cancelled', 'attended' (optional)
  confirmationSentAt DATETIME,
  FOREIGN KEY (eventId) REFERENCES Events(id) ON DELETE CASCADE,
  UNIQUE(eventId, customerEmail) -- prevent duplicate registrations
);

-- Audit table (optional, good practice)
CREATE TABLE RegistrationAudit (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  registrationId UNIQUEIDENTIFIER,
  action NVARCHAR(50), -- 'created', 'cancelled'
  timestamp DATETIME DEFAULT GETUTCDATE(),
  changedBy NVARCHAR(256)
);
```

**Key design decisions:**
- **No user accounts for customers**: Simple email-based registration (lower friction)
- **Unique constraint** on (eventId, customerEmail): Prevents double-booking
- **Status tracking**: Enables analytics without separate tables
- **Audit trail**: Supports compliance reviews if needed later

---

## 4. MVP FEATURE BREAKDOWN

### Phase 1: MVP (8–10 weeks)
**Minimum viable for launch:**

| Feature | Customer | Staff | Effort | Notes |
|---------|----------|-------|--------|-------|
| **Browse Events** | ✓ | — | 1 week | Filter by date, branch |
| **Register** | ✓ | — | 1.5 weeks | Form validation, email confirmation |
| **View/Cancel Registration** | ✓ | — | 1 week | Simple dashboard with auth link |
| **Create/Edit Events** | — | ✓ | 2 weeks | Form, date picker, capacity management |
| **View Registrations** | — | ✓ | 1 week | Table, basic search |
| **Export Attendee List** | — | ✓ | 1 week | CSV export |
| **Confirmation Emails** | ✓ | ✓ | 1.5 weeks | Template, transactional email |
| **Authentication/Auth** | ✓ | ✓ | 1.5 weeks | B2C for staff, email links for customers |
| **Testing + Deployment** | — | — | 2 weeks | Functional, integration, UAT |

**Phase 1 Delivery**: Core workflows, basic staff portal, customer registration loop.

### Phase 2: Polish & Scale (Weeks 11–16, post-launch)
- Reminder emails (1 week before event)
- No-show tracking & optional attendance confirmation
- Advanced search/filtering (past events, by topic)
- Staff role-based access (branch managers see only their branch)
- Analytics dashboard (registration trends, top events)
- Mobile-responsive design polish

---

## 5. KEY RISKS & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Scope creep**: Staff requests add reporting, integrations, CRM linking | HIGH | MEDIUM | Clear MVP; quarterly roadmap reviews |
| **Email deliverability**: Confirmation emails land in spam | MEDIUM | HIGH | Use Azure Comm. Services (authenticated); test with major providers |
| **Staff adoption low**: Manual event creation seen as burden | MEDIUM | MEDIUM | Simple UX; train 2–3 "champions"; measure usage monthly |
| **Capacity management**: Events fill up; no waitlist logic defined | MEDIUM | MEDIUM | Add waitlist feature in Phase 2; document current policy |
| **Data quality**: Duplicate/invalid emails cause issues | LOW | MEDIUM | Frontend validation + server-side sanitization; optional verification emails |
| **Privacy incident**: Data breach of registration list | LOW | HIGH | Encryption at rest/in transit; regular backups; document data retention policy |
| **Performance**: Slow load times at peak registration | LOW | MEDIUM | Caching (Redis), CDN for static assets, load testing before launch |

---

## 6. COMPLIANCE & DATA GOVERNANCE CHECKLIST

✓ **Already Cleared**
- Privacy Statement covers name/email/phone for marketing/engagement

⚠️ **Must Document**
- **Data Retention**: How long keep registration records? (Recommend: 2 years post-event)
- **Deletion**: Can customers request data removal before event? During event?
- **Third-party vendors**: If using SendGrid/Azure Comm Services, ensure Data Processing Agreements in place
- **Audit logging**: Capture who created/deleted events and registrations (for staff accountability)
- **Geographic storage**: Azure region(s) for database—ensure consistent with corporate policy

📋 **Recommended Actions**
1. **Brief legal/compliance** on third-party email vendor choice
2. **Document data flow** (who accesses what, when)
3. **Define data retention policy** before launch
4. **Plan annual security review** (penetration testing, access audits)

---

## 7. EFFORT & COST ESTIMATE

### Timeline
- **Planning & design**: 2 weeks (wireframes, API design, DB schema review)
- **Development (MVP)**: 8–10 weeks (2–3 dev team, 1 QA)
- **Testing & UAT**: 2 weeks (parallel with final dev)
- **Total to launch**: ~12–14 weeks

### Rough Azure Costs (Annual, Production)
```
App Service (B2 tier):           ~$150/month
SQL Database (Standard S1):       ~$30/month
Static Web Apps (frontend):       ~$10/month (+ egress)
Azure Communication Services:     ~$0.05–0.15 per email
Blob Storage (exports):           ~$20/month
Data Transfer:                    ~$50–100/month
────────────────────────────────────────
Subtotal:                         ~$3,000–4,000/year
+ Support/licenses/monitoring:    ~$1,000–2,000/year
────────────────────────────────────────
**Total estimated**: $4,000–6,000/year
```
(Scales linearly with volume; this is good for 8,000 registrations/year.)

---

## 8. SUCCESS METRICS

**Define these before launch:**

- **Adoption**: X% of events registered online (vs. email/phone) by month 6
- **User satisfaction**: Staff NPS ≥ 7/10; customer feedback score ≥ 8/10
- **Operational**: Reduce event registration overhead by 50% (staff time)
- **Data quality**: <2% invalid email addresses in exports
- **Uptime**: 99.5% availability (acceptable for non-critical internal tool)
- **Performance**: Page load <2 seconds; export <5 seconds for 200+ attendees

---

## 9. NEXT STEPS (RECOMMENDED ORDER)

### Week 1–2: **Clarification**
- [ ] Schedule working session with stakeholder team to answer unknowns above
- [ ] Define staff access model (who can create events? See all data?)
- [ ] Confirm email vendor preference (Azure vs. SendGrid)
- [ ] Map out all event types and common fields

### Week 3: **Design**
- [ ] Wireframe customer portal (browse + register flow)
- [ ] Wireframe staff portal (event creation, attendee list)
- [ ] Finalize data model with DBA input
- [ ] API endpoint specification (OpenAPI/Swagger)

### Week 4: **Setup**
- [ ] Provision Azure resources (SQL, App Service, Static Web Apps)
- [ ] Set up CI/CD pipelines (GitHub Actions or Azure Pipelines)
- [ ] Choose and test email vendor
- [ ] Create project repository and coding standards guide

### Week 5+: **Development**
- [ ] Kick off iterative sprints (2-week cycles)
- [ ] Weekly stakeholder demos to validate assumptions
- [ ] Monthly risk reviews

---

## 10. ALTERNATIVES BRIEFLY CONSIDERED

| Option | Pros | Cons | Recommendation |
|--------|------|------|-----------------|
| **No-code platform** (e.g., Eventbrite) | Fast, low cost, proven | Less customization; external vendor; data export friction | Good for MVP *if* timeline critical; otherwise custom gives flexibility |
| **Headless CMS** (Contentful + Next.js) | Decoupled, flexible | Overkill for simple CRUD; higher complexity | Not recommended for this scope |
| **AWS instead of Azure** | Slightly cheaper | Inconsistent with "Azure preference"; more DevOps burden | Stick with Azure |
| **Monolithic vs. Microservices** | Monolith simpler to start | Harder to scale later | Start monolithic; refactor only if needed |

---

## CONCLUSION

**Green light to proceed** with caveats:

✅ **Clear requirements**: Simple CRUD app, well-defined scope  
✅ **Manageable scale**: 8K registrations/year is comfortable for proposed stack  
✅ **Compliance straightforward**: No financial data; privacy pre-cleared  
✅ **Proven tech stack**: React + Azure + SQL is standard for NZ financial sector  

⚠️ **Must-resolve before dev starts**:
1. **Staff access model** (who manages events?)
2. **Email vendor** choice
3. **Data retention** policy
4. **Analytics needs** (do you need no-show tracking?)

**Recommended approach**: Spend 2 weeks on clarification and design; build MVP in 10 weeks; plan Phase 2 post-launch based on real usage patterns.

---

**Ready to move to /options or /design phase?**