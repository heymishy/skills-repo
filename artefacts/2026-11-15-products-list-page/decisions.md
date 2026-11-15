# Decisions - pls-s1 (products list page)

---
**2026-11-15 | FINDING | "See all products" links to /dashboard by design; there is no products list page**
**Evidence:** src/web-ui/utils/html-shell.js lines 106-114 render `<a href="/dashboard">See all products</a>` (pan-s1 comment: it "replaces Home's old role"); server.js has no bare `/products` route; `/dashboard` is handled by `handleGetDashboard` (routes/products.js line 2923), which shows the home page with product cards, pending actions and recent work. Clicked while already on /dashboard the link appears to do nothing, and error capture correctly sees nothing (a normal 200).
**Decision (operator, in chat):** option 1, a dedicated `/products` list page, and the link points to it.
**Open question, same report:** the operator no longer sees the skills-framework product in their product list. Every list (sidebar, dashboard) comes from `SELECT ... FROM products WHERE tenant_id = $1` with the session's tenant, so the likely cause is that the product's `tenant_id` no longer matches the tenant the login resolves to (production has `TENANT_ORG_ALLOWLIST` set, so the session tenant is resolved from the organisation allowlist). Needs a read-only production check of the products table, with the operator's explicit approval first; no production read has been run for this.
---

## Architecture Decision Records