# Discovery Document — Financial Literacy Event Registration App

**Status:** Draft for review
**Pipeline stage:** Discovery
**Application type:** Greenfield, customer-facing web application

---

## 1. Problem Statement

The community banking team runs ~40 financial literacy events per year (workshops, webinars, in-branch seminars). Registration is currently handled via a generic email inbox and branch phone calls, which means:

- No self-service for customers (no browsing, no cancellation, no confirmation)
- Manual effort for staff to collate attendee lists
- No single source of truth for event capacity or attendance
- Risk of lost or duplicated registrations

**Goal:** A simple, low-volume web application for event browsing, registration, and management.

---

## 2. Scope

### In scope
| Capability | User |
|---|---|
| Browse upcoming events (filter by type/location/date) | Customer |
| Register for an event | Customer |
| Receive confirmation email | Customer |
| View and cancel own registrations | Customer |
| Create / edit / cancel events | Staff |
| View registrations per event | Staff |
| Export attendee lists (CSV) | Staff |

### Explicitly out of scope
- Integration with core banking systems
- Access to any financial data
- Payment handling (events appear to be free — **confirm**)
- Marketing automation / CRM sync (flagged as a possible future phase)

---

## 3. Data Collected

| Field | Sensitivity |
|---|---|
| Customer name | Personal information |
| Email address | Personal information |
| Phone number | Personal information |
| Branch preference | Low |
| Existing-customer flag (Y/N) | Low, but note: this is a *customer relationship indicator* — see §7 |

Privacy team has confirmed collection is covered under the existing Privacy Statement for marketing and customer engagement. ✅ (Record the confirmation reference/date in the project record.)

**No financial data, no account numbers, no authentication against banking credentials.**

---

## 4. Scale & Non-Functional Profile

- ~200 registrations/event × 40 events/year ≈ **8,000 registrations/year**
- Low concurrency; possible small spikes when a popular event is announced
- This is firmly a **small-scale system** — architecture should be optimised for simplicity, low cost, and low operational burden, not throughput

Implied NFRs:
- **Availability:** Business-hours critical, best-effort otherwise (confirm)
- **Accessibility:** Public-facing bank property — WCAG 2.1 AA should be treated as mandatory
- **Data residency:** NZ customer data — confirm whether Azure Australia East (closest region pair) is acceptable per enterprise data residency policy, or whether Azure NZ North is required/available
- **Retention:** Define how long registration data is kept post-event (suggest a default, e.g. 12 months, then purge — confirm with privacy team)

---

## 5. Proposed Architecture (Indicative)

Aligned to stated preference (React + Azure):

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | React SPA on **Azure Static Web Apps** | Free/cheap tier, built-in CI/CD, custom domain + TLS |
| API | **Azure Functions** (HTTP-triggered) or App Service | Serverless suits low/spiky volume; near-zero idle cost |
| Database | **Azure SQL Database (serverless tier)** | Relational fits events/registrations naturally; auto-pause for cost |
| Email | **Azure Communication Services** or the enterprise's existing email gateway | Confirmation + cancellation emails; **must confirm** whether bank policy requires all customer email to go via an approved corporate gateway (likely) |
| Staff auth | **Microsoft Entra ID** (staff SSO) | Staff portal gated by existing corporate identity |
| Customer auth | **Open question — see §6.1** | |
| Secrets/config | Azure Key Vault + managed identities | Standard enterprise pattern |
| Monitoring | Application Insights | Sufficient at this scale |

---

## 6. Key Open Questions

These materially affect design and should be answered before solution design begins.

### 6.1 Customer identity model (most important decision)
How do customers "manage their registrations" without banking login?
- **Option A — No accounts (recommended for simplicity):** Confirmation email contains a signed, expiring "manage registration" link. No passwords, no account lifecycle, minimal PII surface.
- **Option B — Lightweight accounts:** Email + verification code (magic link/OTP). More friction, more to build.
- **Option C — Bank digital identity:** Explicitly out of scope per the brief (no core systems).

→ Recommend Option A unless there's a requirement for a persistent customer profile.

### 6.2 Capacity & waitlists
Do events have capacity limits? Is a waitlist needed when full? (200/event suggests yes to capacity.)

### 6.3 Webinars
Do webinar registrations need to deliver a joining link (Teams/Zoom)? Manual paste into event details, or integration?

### 6.4 Email channel
Must outbound email use the bank's approved email infrastructure (branding, DKIM/SPF, anti-phishing standards)? Banks almost always have constraints here — this is a common late-stage blocker; resolve early.

### 6.5 Staff roles
Single staff role, or split (e.g. event creators vs branch staff who only view their branch's events)?

### 6.6 Reminders & comms
Are reminder emails (e.g. 24h before) in scope? SMS reminders (phone number is collected — why)? If phone is only "nice to have," consider dropping it to minimise PII.

### 6.7 Data residency & classification
Confirm the enterprise's data classification for this dataset and the approved Azure region(s).

### 6.8 Existing-customer flag usage
What is this field used for? If it feeds marketing segmentation, confirm that downstream use is covered by the privacy assessment, not just collection.

---

## 7. Risks & Considerations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Phishing surface:** Bank-branded emails with links train customers to click — security team may have rules about link formats/domains | Engage security early; use official domain; follow bank email standards |
| 2 | **Existing-customer flag** is a relationship indicator; combined with name/email it confirms someone banks with the enterprise | Encrypt at rest (default in Azure SQL), restrict staff access, exclude from exports unless needed |
| 3 | Public form abuse (bots, bulk fake registrations) | CAPTCHA or rate limiting; email confirmation before registration is finalised |
| 4 | Data residency non-compliance | Confirm region with architecture/risk teams before any deployment |
| 5 | Indefinite PII retention | Define retention + automated purge in design phase |
| 6 | Scope creep toward CRM/marketing integration | Hold the "no core systems" line; log future-phase items separately |
| 7 | Internal governance: even simple apps at a bank typically require security review, privacy impact assessment sign-off, and architecture approval | Build these gates into the delivery timeline now |

---

## 8. Recommended Next Steps

1. **Resolve §6 open questions** with product owner, privacy, and security (one workshop should cover most).
2. **Confirm email delivery channel** — highest-risk external dependency.
3. **Produce solution design** (architecture decision record for identity model, data model for Events/Registrations, API surface).
4. **Privacy artefacts:** record privacy sign-off reference; define retention schedule.
5. **Estimate & plan:** at this scale, a thin-slice MVP (browse → register → confirm → cancel + staff CSV export) is achievable as a small first release, with waitlists/reminders as fast-follow.

---

**Discovery assessment:** Well-bounded, low-complexity greenfield build. No major technical risk at this scale; the main risks are **organisational** (email gateway approval, identity model decision, security/privacy gates). Ready to proceed to solution design once §6.1 and §6.4 are answered.