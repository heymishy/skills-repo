## Discovery summary

You want a **greenfield customer-facing event registration application** for community banking literacy events in New Zealand.

### Business goals
- Let customers:
  - browse upcoming events
  - register for an event
  - receive confirmation email
  - manage registrations:
    - view
    - cancel
- Let staff:
  - create events
  - view registrations
  - export attendee lists

### Expected scale
- ~40 events/year
- ~200 registrations/event
- ~8,000 registrations/year
- Low-volume system

### Preferred technology
- **React frontend**
- **Azure-hosted backend**
- **Database in Azure**

### Data to collect
- Customer name
- Email address
- Phone number
- Branch preference
- Whether they are an existing enterprise customer

### Constraints / dependencies
- No existing codebase
- No integration to core banking systems
- No access to financial data
- Privacy team has confirmed name/email/phone collection is covered under the existing Privacy Statement for marketing/customer engagement

---

## Key observations
- This is a **simple CRUD + notification** application with moderate security/privacy requirements.
- The data is **personal information**, but not financial or highly sensitive.
- The system needs:
  - authentication/authorization for staff
  - email delivery
  - basic auditability for registrations and cancellations
- Because customers can manage their registrations, you’ll likely need:
  - a secure “magic link” or registration token flow, or
  - customer account login, if desired later
- Since this is greenfield, you can keep the architecture lean and avoid over-engineering.

---

## Recommended MVP scope
### Customer-facing
- Event listing page
- Event detail page
- Registration form
- Confirmation screen
- Email confirmation
- Manage registration via secure link
- Cancel registration

### Staff-facing
- Admin login
- Create/edit/publish events
- View registrations by event
- Export attendee list CSV

### Core non-functional requirements
- Secure authentication for staff
- Privacy-conscious handling of customer data
- Email delivery reliability
- Audit trail for create/update/cancel actions
- Responsive UI for desktop and mobile

---

## Suggested initial architecture
Given your preference, a straightforward Azure-native setup would be:

- **Frontend:** React SPA
- **Backend API:** Azure App Service or Azure Functions
- **Database:** Azure SQL Database or Azure PostgreSQL
- **Email service:** Azure Communication Services or SendGrid
- **Authentication for staff:** Microsoft Entra ID
- **Hosting/CDN:** Azure Static Web Apps or Azure Front Door + App Service
- **Secrets:** Azure Key Vault

If you want, I can next produce:
1. a **solution architecture**
2. a **MVP requirements list**
3. a **data model**
4. a **user journey map**
5. a **delivery plan / backlog**