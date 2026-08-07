# Implementation Plan: Give every product a UI path to connect or create a GitHub repo

**Story:** rpc-s1  
**Feature:** 2026-07-19-product-repo-connect-ux  

---

## File Map

| File | Purpose |
|------|---------|
| src/web-ui/routes/products.js | Modify _renderProductView and handler to fetch/pass repo fields; add Connect-repo UI |
| tests/check-rpc-s1-connect-repo.js | New test file for U1, U2, IT1, IT2, IT3 |

---

## Task Summary

- **Task 1:** U1 unit test + core implementation (signature, queries, form HTML, JS handlers)
- **Task 2:** U2 unit test (visibility toggling)
- **Task 3:** IT1 placeholder test
- **Task 4:** IT2 placeholder test
- **Task 5:** IT3 security test (escaping)

All implementation in Task 1; subsequent tasks add tests only.

---

## Key Changes

**src/web-ui/routes/products.js**

1. Line 104: Change signature to add repoOwner, repoName parameters
2. Line 408-410: Add repo_owner, repo_name to SELECT query
3. Line 211: Add conditional repoHtml (form when null, info when set)
4. Line 237: Add JavaScript functions for form handling
5. Line 438: Pass prodRow.repo_owner, prodRow.repo_name to _renderProductView

**tests/check-rpc-s1-connect-repo.js** (new)

- U1: Assert "Connect repo" affordance when no repo
- U2: Assert affordance hidden, repo info shown when connected
- IT1: Placeholder (skipped)
- IT2: Placeholder (skipped)
- IT3: Assert _escapeHtml escaping for malicious values

