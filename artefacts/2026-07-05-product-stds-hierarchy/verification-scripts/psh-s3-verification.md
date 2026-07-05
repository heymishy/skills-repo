# AC Verification Script: psh-s3 — Product creation flow (hybrid form + AI draft + review)

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s3.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s3-test-plan.md
**Date:** 2026-07-05

---

## Setup

Start the server with environment loaded:
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```
```bash
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Open a browser and log in with a test account. Navigate to "Create product".

---

## Scenario 1 — AI drafts 5 context files from the form (AC1, AC2)

1. On the "Create product" page, type a product name (e.g. "My Test Product").
2. Optionally fill in tech stack and constraints fields.
3. Click "Generate draft" (or submit the form).

**Expected:** After a moment (up to 30 seconds), you see five labelled panels appear on screen:
- Mission
- Roadmap
- Tech Stack
- Constraints
- Architecture Guardrails

Each panel has draft text in it. You can click into any panel and edit the text.

**Broken behaviour:** Only some panels appear, panels are empty, or the page shows an error.

---

## Scenario 2 — Confirm creates the product and redirects (AC3)

1. After the draft panels appear, click "Confirm" (without editing, or after editing one panel).

**Expected:** You are taken to the product dashboard or a product detail page. The product name you entered appears. A "product created" event should appear in PostHog (check PostHog Live Events).

**Broken behaviour:** Confirmation returns an error, or the product does not appear in the dashboard.

---

## Scenario 3 — Solo plan blocks second product (AC4)

1. Use a test account that already has one product (personal plan).
2. Attempt to create a second product (navigate to "Create product" and submit the form).

**Expected:** The server responds with an error. The UI shows "Upgrade to a team plan to create multiple products." No second product is created.

**Broken behaviour:** A second product is created despite the plan limit, or an error with no upgrade message is shown.

---

## Scenario 4 — Team plan allows multiple products (AC5)

1. Switch to a test account on a team plan that already has 2 products.
2. Create a third product.

**Expected:** Third product is created successfully. No plan-limit error shown.

**Broken behaviour:** Team-plan account is blocked at 1 product.

---

## Scenario 5 — XSS: product name is rendered as plain text (AC6)

1. In the product name field, type: `<script>alert("XSS")</script>`
2. Submit and confirm.

**Expected:** The product name appears on the dashboard as the literal text `<script>alert("XSS")</script>`. No alert dialog appears. No script is executed.

**Broken behaviour:** An alert dialog pops up, or the page HTML is broken by the injected script.

---

## Scenario 6 — Path traversal is blocked (AC7)

Using a REST client (e.g. curl or Postman), send a product creation request with a name containing `../../../`:

```bash
curl -X POST http://localhost:3000/products/confirm \
  -H "Cookie: <your-session-cookie>" \
  -d '{"name": "../../../etc/evil", ...}'
```

**Expected:** Server returns HTTP 400. No file is written outside the permitted directory. The error response does not include the raw path in the body.

**Broken behaviour:** HTTP 201, or a file appearing at an unexpected path on disk.
