Below is the **/discovery output** for the proposed customer-facing **Event Registration Web Application**.

---

# 1. Discovery Summary

## Problem statement
The community banking team currently manages event registrations manually via a generic inbox and branch phone calls. This creates administrative overhead, inconsistent customer experience, and limited visibility into registrations and attendance.

## Proposed solution
Build a simple web application that allows:
- **Customers** to:
  - Browse upcoming events
  - Register for events
  - Receive confirmation emails
  - View and cancel their registrations
- **Staff** to:
  - Create and manage events
  - View registrations
  - Export attendee lists

## Delivery context
- **Greenfield application**
- Preferred technology direction:
  - **Frontend:** React
  - **Backend/hosting/database:** Azure
- Low-volume workload:
  - ~40 events/year
  - ~200 registrations/event
  - ~8,000 registrations/year

## Initial assessment
This is a **small-to-medium, low-complexity line-of-business web application** with:
- straightforward CRUD workflows
- moderate privacy obligations due to personal information collection
- low technical scale risk
- moderate operational and compliance considerations around customer communications, access control, and data handling

This appears well-suited to a lightweight cloud-native architecture on Azure.

---

# 2. Business Outcomes

## Primary outcomes
- Reduce manual administration for branches and community banking staff
- Improve customer experience with self-service registration
- Standardise event management and attendance tracking
- Improve reporting and attendee list management

## Success measures
Suggested measurable outcomes:
- Reduction in manual registration handling via phone/email
- Percentage of events published digitally
- Registration completion rate
- Reduction in staff effort per event
- Accuracy/completeness of attendee records
- Confirmation email delivery success rate
- Export usage by staff

---

# 3. In Scope / Out of Scope

## In scope
- Public listing of upcoming events
- Event details page
- Customer event registration
- Confirmation email after registration
- Customer ability to view and cancel registrations
- Staff administration for event creation and management
- Staff access to registration lists
- Export attendee lists
- Azure-hosted backend and database
- Basic audit/logging for administration actions

## Out of scope
- Integration with core banking systems
- Integration with CRM/marketing automation unless later requested
- Payment processing
- Waitlists unless explicitly required
- SMS notifications
- Event check-in tooling
- Advanced analytics/dashboarding
- Multi-language support unless required
- Complex customer identity integration beyond simple registration management flow
- High-scale architecture patterns

---

# 4. Users and Personas

## Customer / Community attendee
Needs to:
- discover relevant events
- register quickly
- receive confirmation
- later review or cancel registration

## Community banking staff
Needs to:
- create and publish events
- monitor registrations
- export attendee lists
- potentially manage event capacity and updates

## Branch staff
May need to:
- view event registrations for their branch/events
- assist customers
- possibly create or manage local events depending on operating model

## Platform/support administrators
Need to:
- manage access
- monitor application health
- support incident resolution

---

# 5. Functional Requirements

## Customer-facing
### Event browsing
- View upcoming events
- Filter/search by:
  - date
  - location/branch
  - event type (optional)
- View event details:
  - title
  - description
  - date/time
  - branch/location
  - capacity (optional display)
  - registration status

### Registration
- Enter:
  - name
  - email
  - phone number
  - branch preference
  - existing customer flag
- Submit registration
- Validate required fields and format
- Prevent duplicate registrations where appropriate
- Respect event capacity if capacity is enforced

### Confirmation
- Send confirmation email on successful registration
- Include event details and cancellation/view instructions

### Manage registration
Possible approaches:
1. **Magic link via email**
2. **Registration reference + email lookup**
3. **Customer account/sign-in**

For a low-complexity app, **magic link** is likely best:
- user receives secure link in confirmation email
- can view/cancel registration without creating an account

## Staff-facing
### Event management
- Create draft/published events
- Edit event details
- Cancel or close registrations
- Set event capacity
- Set branch/location
- Set date/time and description

### Registration management
- View attendee list by event
- Search/filter registrations
- Cancel/remove registrations if needed
- Export attendee list to CSV/Excel-compatible format

### Administration/security
- Role-based access for staff users
- Audit key admin actions:
  - create/edit/cancel event
  - export attendee list
  - cancel attendee registration

---

# 6. Key Assumptions

- No financial data or core banking integration is required.
- Existing privacy statement is sufficient for stated data collection purpose.
- Email is an acceptable channel for confirmations and registration management.
- Customer self-service can be implemented without full customer authentication.
- Volumes are low and predictable.
- Staff identities can likely be handled through enterprise identity (e.g. Azure AD / Entra ID).
- Event registrations are not business-critical in the same category as banking transactions, so moderate availability is likely sufficient.

---

# 7. Open Questions

## Business/process
- Do events have **capacity limits**?
- Should registrations close automatically at a cutoff time?
- Do staff need to record attendance/check-in?
- Should customers be able to register multiple attendees, or only themselves?
- Are cancellations allowed up until event start time?
- Should reminder emails be sent before events?
- Should past events remain visible?

## Customer experience
- Is customer account creation explicitly undesired?
- Is email-only management acceptable from a security/usability standpoint?
- Do customers need to modify registrations, or only cancel?
- Should duplicate registrations be blocked by email, phone, or a combined rule?

## Staff operations
- Who can create/manage events: central team only, or branch staff too?
- Are there distinct staff roles with different permissions?
- What export format is required: CSV only, Excel, PDF?
- Is there a requirement for approval before publishing events?

## Compliance/security
- What retention period applies to registration data?
- Are there records management obligations for attendee exports?
- Is explicit marketing consent needed anywhere beyond event communications?
- Are there accessibility compliance targets (e.g. WCAG 2.1 AA)?

## Technical
- What email service should be used in Azure?
- Is there an enterprise preference for Azure App Service vs Static Web Apps + Functions?
- Is there a preferred relational database platform in Azure?
- Should branch/location data come from a maintained source or be manually entered?

---

# 8. Non-Functional Requirements

## Availability
Given low criticality, target could be:
- **Business-appropriate availability**, not necessarily 24/7 mission-critical
- e.g. standard Azure managed service SLA is likely sufficient

## Performance
- Event pages should load quickly under normal public traffic
- Registration transaction should complete in a few seconds
- Export generation should complete promptly for small attendee lists

## Scalability
- Low volume; horizontal scale requirements are modest
- Architecture should support occasional peaks when an event is promoted

## Security
- Protect personal information in transit and at rest
- Staff admin restricted via enterprise authentication and RBAC
- Public forms protected from spam/abuse
- Audit logging for sensitive staff actions
- Secure token-based registration management if no customer login

## Privacy
- Collect only minimum required personal data
- Clear notice on event registration form
- Data retention and deletion processes should be defined
- Exports should be controlled and monitored

## Accessibility
- Should target **WCAG 2.1 AA** unless enterprise standard differs

## Maintainability
- Simple supportable architecture
- Clear separation between customer and staff functions
- Infrastructure-as-code preferred
- Basic automated deployment pipeline recommended

## Disaster recovery / backup
- Managed database backups
- Restore capability appropriate for low-volume operational system

---

# 9. Data Considerations

## Data collected
Per registration:
- Name
- Email address
- Phone number
- Branch preference
- Existing customer indicator
- Event identifier
- Registration status
- Timestamps

Per event:
- Title
- Description
- Date/time
- Location/branch
- Capacity
- Publish state
- Registration open/close status

## Data classification
While no financial/customer account data is involved, this still includes:
- **Personally identifiable information (PII)**:
  - name
  - email
  - phone number

Therefore privacy and access controls remain important.

## Likely retention considerations
Need confirmation from records/privacy teams, but likely:
- retain event and registration records for a defined operational/reporting period
- remove or anonymise stale customer registration data when no longer required

---

# 10. Security Considerations

## Customer side
- Input validation and sanitisation
- Anti-automation controls:
  - CAPTCHA or equivalent
  - rate limiting
- Secure confirmation/manage-registration links
  - signed, expiring tokens
- Avoid exposing attendee data publicly
- TLS enforced

## Staff side
- Entra ID authentication
- Role-based authorisation
- Least-privilege access
- Audit logging
- Export access limited to authorised staff

## Platform
- Secrets stored in Azure Key Vault
- Managed identities where possible
- Database/network security baselines
- Logging/monitoring enabled
- Vulnerability and dependency management in pipeline

---

# 11. Recommended High-Level Architecture

## Option A — Recommended lightweight Azure architecture
- **Frontend:** React app
  - Azure Static Web Apps or Azure App Service
- **Backend API:** Azure Functions or lightweight App Service API
- **Database:** Azure SQL Database
- **Email:** Azure Communication Services Email, SendGrid, or enterprise-approved mail service
- **Authentication for staff:** Microsoft Entra ID
- **Secrets/configuration:** Azure Key Vault
- **Monitoring:** Azure Application Insights / Log Analytics

### Why this fits
- Low cost
- Fast to deliver
- Supports simple CRUD and email workflows
- Good fit for low-volume workloads
- Managed services reduce operational overhead

## Option B — Slightly more traditional web app
- React frontend on App Service
- Backend REST API on Azure App Service
- Azure SQL Database
- Same supporting services

### Why choose this
- More straightforward if team prefers conventional always-on API hosting
- Easier if business logic grows beyond serverless simplicity

## Recommended preference
For this use case, either is viable, but I would lean toward:

### Preferred stack
- **React frontend**
- **Azure Static Web Apps** for frontend
- **Azure Functions** for API
- **Azure SQL Database**
- **Entra ID for staff**
- **Magic-link flow for customer registration management**

This is likely the most efficient and proportionate option.

---

# 12. Conceptual Data Model

## Event
- EventId
- Title
- Description
- StartDateTime
- EndDateTime
- BranchId / Location
- Capacity
- Status (Draft, Published, Closed, Cancelled)
- RegistrationOpenDate
- RegistrationCloseDate
- CreatedBy
- CreatedAt
- UpdatedAt

## Registration
- RegistrationId
- EventId
- Name
- Email
- Phone
- BranchPreference
- ExistingCustomerFlag
- Status (Registered, Cancelled)
- ConfirmationSentAt
- CreatedAt
- UpdatedAt

## StaffUserRole
- StaffUserId
- Role
- BranchScope (optional)

## AuditLog
- AuditLogId
- Actor
- Action
- TargetType
- TargetId
- Timestamp
- Metadata

## Optional reference tables
- Branch
- EventType

---

# 13. Delivery Risks

## Low/Moderate risks
### Requirements ambiguity
Because the app is simple, the biggest risks are not scale or technology, but unclear business rules such as:
- capacity handling
- duplicate registrations
- cancellation rules
- staff role boundaries

### Privacy/retention ambiguity
Even though privacy statement coverage is confirmed, retention and export handling still need definition.

### Email deliverability
Confirmation and magic-link emails are essential to the customer journey, so chosen email service and domain configuration matter.

### Abuse/spam
Public registration forms can attract spam or automated misuse without basic protections.

### Staff operating model
If many branches need delegated administration, role design may become more complex than initially assumed.

---

# 14. Delivery Approach Recommendation

## Suggested phased delivery
### Phase 1 — MVP
- Public event listing
- Event details
- Customer registration
- Confirmation email
- Customer cancel/view via magic link
- Staff event creation/editing
- Registration list view
- CSV export
- Basic audit logging
- Basic spam protection

### Phase 2 — Enhancements
- Reminder emails
- Capacity/waitlist logic
- Attendance/check-in
- Richer reporting
- Role scoping by branch
- Event templates
- Improved search/filtering

This phased approach keeps the first release small and valuable.

---

# 15. Indicative Delivery Size

## Relative sizing
This looks like a:
- **Small-to-medium project**
- likely suitable for a compact cross-functional delivery team

## Main work areas
- UX/UI design
- React frontend
- API/backend development
- database schema and admin tooling
- email workflow
- authentication/authorisation for staff
- cloud infrastructure and CI/CD
- security/privacy review
- testing/accessibility

Because the app is greenfield but relatively simple, effort is driven more by governance, security, and enterprise deployment standards than by application complexity itself.

---

# 16. Recommended Next Steps

## Immediate next activities
1. Confirm business rules for:
   - capacities
   - duplicate registrations
   - cancellations
   - staff roles
2. Confirm customer registration management approach
   - magic link recommended
3. Confirm retention and records-management requirements
4. Confirm accessibility and design standards
5. Confirm preferred Azure hosting pattern and email service
6. Produce:
   - solution architecture diagram
   - user journeys
   - MVP backlog
   - data classification/security assessment
   - delivery estimate

---

# 17. Discovery Conclusion

This initiative is a strong candidate for a **lightweight Azure-hosted web application** with a **React frontend** and **managed backend services**. The functional scope is clear, the expected volumes are low, and there are no core banking integrations or financial data dependencies.

The main discovery focus should now shift from feasibility to **clarifying business rules, privacy/retention obligations, staff access model, and customer registration management design**.

If you want, I can next turn this into one of the following:

1. **A structured discovery report with sections for stakeholders**
2. **An MVP feature backlog with epics and user stories**
3. **A high-level solution architecture**
4. **A delivery estimate with team shape and phases**