# Discovery Pipeline: Event Registration Application

I'll walk through key discovery questions to help scope and validate this project before building.

---

## 1. **User Workflows & Requirements**

### Customer Experience
- **Event discovery**: Should customers filter by date, location (branch), topic, or difficulty level?
- **Registration flow**: Should registration be instant, or require admin approval?
- **Cancellation**: How many days before an event can customers cancel? Should there be automatic confirmation reminders?
- **Re-registration**: If a customer cancels, can they re-register for the same event?

### Staff Experience
- **Event creation**: Do staff need a UI, or will you handle initial bulk uploads? Any recurring event templates?
- **Attendee lists**: Format preference for export (CSV, Excel)? Do you need attendance tracking at the event itself?
- **Notifications**: Should staff get notified of new registrations? Cancellations?
- **Permissions**: Do all staff create/edit events, or only certain roles? Branch-level or organization-wide visibility?

---

## 2. **Data & Privacy**

- **PII handling**: Will this data be retained after events complete, or deleted after a period? (Affects retention policies and storage decisions)
- **Customer consent**: Should the registration form include explicit opt-in for future marketing communications, or rely on existing Privacy Statement coverage?
- **Existing customer status**: Will you verify "existing customer" against a system, or trust customer self-declaration?
- **Accessibility**: Do you need to support customers with accessibility requirements (screen readers, captions for webinars)?

---

## 3. **Technical Scope**

### Backend Requirements
- **Event data**: Are all 40 events created upfront each year, or planned rolling (e.g., quarterly)?
- **Authentication**: Should this be public (no login), or authenticated (customer login via Azure AD or email link)?
- **Integrations**: 
  - Email service: Do you have a preference (SendGrid, Azure Communication Services, Office 365)?
  - Does "branch preference" link to a branch database, or is it a simple dropdown?
- **Capacity limits**: Should events have a max capacity? Waitlist functionality?

### Frontend Requirements
- **Devices**: Mobile-responsive only, or native mobile apps?
- **Languages**: English only, or multi-language support?
- **Performance**: Is this customer-facing (public-facing web), internal-only, or both?

---

## 4. **Operational & Success Metrics**

- **Success criteria**: What does success look like? (e.g., 80% of registrations via app vs. email/phone within 6 months)
- **Support**: Who supports users? Are there FAQ/help sections needed?
- **Reporting**: Beyond attendee lists, do you need dashboards showing registration trends, no-show rates, or event popularity?
- **Scalability**: Could this expand to other regions, products, or higher volumes in future?

---

## 5. **MVP vs. Future Features**

**Likely MVP:**
- Browse & register for events
- Confirmation email
- Manage registrations (view, cancel)
- Staff: create events, view registrations, export lists

**Consider deferring:**
- Waitlist management
- Attendance check-in at event
- Customer self-service password reset
- Multi-language support
- Advanced reporting/analytics
- Integration with email marketing platform

---

## 6. **Architecture Recommendation** *(Preliminary)*

Based on your brief, this stack makes sense:

| Layer | Tech | Notes |
|-------|------|-------|
| **Frontend** | React + TypeScript | Hosted on Azure Static Web Apps |
| **Auth** | Email link or passwordless (Azure AD B2C) | No login complexity needed |
| **API** | .NET / Node.js (Azure App Service) | Simple REST API, ~5-8 endpoints |
| **Database** | Azure SQL / Cosmos DB | Small data volume; SQL is simpler |
| **Email** | Azure Communication Services | Integrated with Azure ecosystem |
| **Hosting** | Azure Resource Group | Dev, Test, Prod environments |

**Estimated complexity:** Low-to-Medium | **Timeline:** 4-6 weeks (small team)

---

## Next Steps

1. **Clarify priorities**: Which of the above questions are blockers vs. nice-to-have?
2. **Stakeholder alignment**: Confirm with staff/privacy that MVP scope works
3. **Technical discovery**: Do you have an Azure subscription ready? Any existing Azure AD setup?
4. **Design**: Rough wireframes for customer & staff UIs before engineering starts

Would you like me to dive deeper on any of these areas, or shall we move to the **scoping** phase?