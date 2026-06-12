Thank you for the detailed background! Here’s a structured discovery summary and guidance for your event registration application.

---

## 1. Core Use Cases

### Customer Features
- **Browse Events**: View a list of upcoming workshops/webinars/seminars (with details: date, time, location/branch, description, capacity).
- **Register for Event**: Submit name, email, phone, branch preference, and whether they’re an existing customer.
- **Confirmation Email**: Upon registration, send automated confirmation (with event details and a link to manage registration).
- **Manage My Registrations**: Access a page (via a secure/tokenized URL or login) to view, and cancel upcoming registrations.

### Staff Features (Admin Portal)
- **Create/Edit Events**: Ability to add and update event details.
- **View Registrations**: See a list of registrants for each event.
- **Export Attendee List**: Download CSV/Excel of attendees.
- **(Optional) Communication Tools**: E.g., send reminders or updates to registered attendees.

---

## 2. Non-functional & Technical Requirements

- **Tech Stack**: React frontend; Azure backend (App Service / Function Apps or similar); Azure SQL or Cosmos DB for storage.
- **Authentication**: 
  - Customers likely need email-based authentication for managing registrations (magic link or confirmation code).
  - Staff need secure login (Azure AD preferred).
- **Email Sending**: Integration with email service (e.g., SendGrid via Azure).
- **Privacy**: Collect only name, email, phone number, branch, existing customer status. No financial data or account linkage.
- **Capacity**: Support up to ~8,000 registrations/year; up to 200/event.
- **Accessibility/Mobile**: Responsive design, accessible forms.
- **Data Residency**: Ensure data stays in New Zealand (if applicable under bank policy).
- **Audit & Security**: Minimal PII, but adopt OWASP best practices (input validation, avoid direct enumeration, secure exports).

---

## 3. High-Level Architecture

```
[ React Frontend ]
      |
[ Azure API (App Service or Function App) ]
      |
[ Azure SQL or Cosmos DB ]
      |
[ Azure Email (SendGrid) ]
```

- **Frontend**: React app, SPA, public event listing, authenticated staff/admin section.
- **Backend**: REST API with endpoints for events, registrations, authentication.
- **DB**: Events, registrations, staff users.
- **Email Service**: Sends confirmations, links to manage registration.
- **Optional**: Azure Blob Storage for exporting/sending CSVs.

---

## 4. Example User Flows

### Customer

1. Visits event registration site.
2. Searches/browses upcoming events by date/location/type.
3. Selects event.
4. Fills out and submits registration form.
5. Receives confirmation email (with event summary and manage link).
6. Clicks link to view/cancel registration if needed.

### Staff

1. Log in as admin (Azure AD SSO or similar).
2. Create/edit events.
3. View attendee list per event; export list.
4. (Optional) Send communication to attendees.

---

## 5. Questions & Considerations

- **Authentication for customers:** Would you like frictionless “magic link” or simply an emailed confirmation (no login)?
- **Event capacity:** Should customer registrations be capped/event marked as “full” automatically?
- **Registration management:** Do you need waitlists or just first-come, first-served?
- **Export Format:** CSV sufficient, or do you need additional formats or integrations?
- **Branches:** Are branches a fixed list? Should be an enum in the DB.
- **Admin roles:** Should all staff access all events, or is there branch-specific access control?
- **Marketing opt-in:** Do you want to collect marketing consent as an extra checkbox?
- **Accessibility standards:** Any bank-specific accessibility requirements?
- **Branding:** Guidance/supplied assets for the UI?

---

## 6. MVP Feature List

|   | Customer | Staff |
|---|---|---|
| Browse/List Events | ✔️ | ✔️ |
| Event Details | ✔️ | ✔️ |
| Register for Event | ✔️ | |
| Confirmation Email | ✔️ | |
| Manage Registration (view/cancel) | ✔️ | |
| Create/Edit Events |  | ✔️ |
| View Event Registrations |  | ✔️ |
| Export Attendee Lists |  | ✔️ |
| Authentication | (Magic Link) | (AD SSO) |
| Email Integration | ✔️ | ✔️ |

---

## 7. Next Steps

1. **Confirm outstanding requirements** (see questions above).
2. **Sketch User Journey and Wireframes.**
3. **Decide on specifics (email service, DB, auth mechanism, admin controls).**
4. Develop technical design & sprint plan.

If you’d like, I can provide a sample data model, wireframes, or a more detailed breakdown of any component. Let me know your priorities!