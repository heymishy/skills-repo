**Contract Proposal — Credits tab restyle**

**What will be built:** A Credits tab (admin-only) reusing `adminCreditsGet`/`adminCreditsPost` exactly, restyled with the shared design system's table/form components.

**What will NOT be built:** A deduct-credits capability. A tiered admin/reviewer model.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on restyled table rendering | unit |
| AC2 | Unit test on non-admin absence | unit |
| AC3 | Integration test on form payload/CSRF shape parity | integration |
| AC4 | Unit test on invalid-amount error surfacing | unit |

**Assumptions:** `adminCreditsPost`'s validation logic is unchanged — this story only changes presentation.

**Estimated touch points:**
Files: `src/web-ui/routes/settings.js` (from C1), `src/web-ui/routes/admin-credits.js` (reused, not modified beyond render wiring)
Services: None new
APIs: None new
