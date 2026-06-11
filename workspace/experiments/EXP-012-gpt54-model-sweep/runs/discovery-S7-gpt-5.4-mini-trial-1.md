## Discovery summary

You want a **simple customer-facing event registration web app** for community banking, supporting about **40 events/year** and roughly **8,000 registrations/year**. Customers should be able to:

- browse upcoming events
- register for an event
- receive a confirmation email
- manage registrations (view, cancel)

Staff should be able to:

- create events
- view registrations
- export attendee lists

## Confirmed scope

### In scope
- Greenfield build
- React frontend
- Azure-hosted backend and database
- Customer registration workflow
- Email confirmation
- Customer self-service registration management
- Staff event management
- Staff registration viewing/export

### Data collected
- customer name
- email address
- phone number
- branch preference
- whether they are an existing enterprise customer

### Confirmed exclusions
- No linkage to core banking systems
- No access to financial data

### Privacy
- Privacy team has confirmed this data collection is covered by the existing Privacy Statement for marketing/customer engagement activities

## Initial assessment

This looks like a **low-to-moderate complexity** application from a scale perspective:
- modest volume
- no financial integrations
- straightforward CRUD + email workflow
- clear role split between customer and staff

That said, because it is customer-facing and collects personal information, it will still need appropriate:
- authentication/authorization
- auditability
- privacy/security controls
- secure email handling
- retention/deletion rules

## Likely functional areas

1. **Public event catalogue**
   - list upcoming events
   - event details page
   - capacity / seats remaining
   - location format support for workshop/webinar/branch seminar

2. **Customer registration**
   - form capture
   - confirmation email
   - duplicate registration prevention rules
   - optional waitlist logic if capacity matters

3. **Customer registration management**
   - view current registrations
   - cancel registration
   - likely via magic link or secure accountless lookup, unless you want login

4. **Staff portal**
   - create/edit/publish events
   - see attendees per event
   - export attendee list
   - possibly mark attendance or status

5. **Notifications**
   - registration confirmation
   - cancellation confirmation
   - maybe reminder emails later if desired

## Key questions to resolve next

To shape the solution properly, I’d want answers to these:

### Customer access model
- Should customers **log in**, or should registration management be done via **secure emailed links / one-time access codes**?
- Do you want customers to create an account, or keep it **accountless and lightweight**?

### Event rules
- Is there a **capacity limit** per event?
- Do you need **waitlists** when an event is full?
- Can customers register for **multiple events at once**, or only one at a time?

### Staff roles
- What staff roles are needed?
  - event creator
  - event approver
  - viewer/exporter
  - admin
- Should staff authenticate via **Microsoft Entra ID (Azure AD)**?

### Event management details
- What fields define an event?
  - title
  - description
  - event type
  - date/time
  - timezone
  - venue / webinar link
  - capacity
  - branch
  - published/draft status

### Email
- What email service should be used?
  - Azure Communication Services
  - SendGrid
  - Microsoft 365 relay
- Do you need branded templates?

### Data retention and compliance
- How long should registration data be retained?
- Should cancelled registrations be soft-deleted or retained for audit?
- Do you need an audit trail of staff actions?

### Accessibility and language
- Must the app meet a specific accessibility standard?
- Is English sufficient, or do you need multilingual support?

## Recommended next step

I recommend we move into a short **solution discovery** phase to define:
1. user journeys
2. security/auth model
3. data model
4. Azure reference architecture
5. MVP scope vs future enhancements

If you want, I can produce the next discovery artifact as one of these:

- **user stories and acceptance criteria**
- **high-level solution architecture**
- **data model / entity list**
- **MVP scope proposal**
- **risk and assumptions register**

If you'd like, I can start with a **proposed MVP and architecture** now.