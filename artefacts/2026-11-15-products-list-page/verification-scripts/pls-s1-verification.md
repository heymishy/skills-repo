# AC Verification Script: products list page

**Story:** artefacts/2026-11-15-products-list-page/stories/pls-s1-products-list-page.md

## Setup
Scenarios 1 to 6: terminal in the project folder, run `node tests/check-pls-s1-products-list-page.js` (one line per check; failures must be 0) and `node tests/check-jcn-s1-journey-page-nav-products.js`. Scenario 7 needs the change merged and deployed and your normal signed-in browser.

### Scenario 1: the page lists your products (AC1)
Find the T1 line. **Expected:** pass; every product has its name, feature count and a link to its page. **Result:** [ ] Pass [ ] Fail
### Scenario 2: no products gives a clear next step (AC2)
Find T2. **Expected:** pass; "No products yet" and a "Create your first product" link. **Result:** [ ] Pass [ ] Fail
### Scenario 3: you never see another tenant's products (AC3)
Find T3. **Expected:** pass; none of the other tenant's names or ids appear anywhere on the page. **Result:** [ ] Pass [ ] Fail
### Scenario 4: the link goes to the new page, the toggles do not move (AC4)
Find T5 and the edited line in the journey-nav test. **Expected:** pass; "See all products" goes to `/products`; List and Board still go to the dashboard. **Result:** [ ] Pass [ ] Fail
### Scenario 5: the page is only for signed-in people (AC5)
Find T8. **Expected:** pass; the route is wrapped in the sign-in check. **Result:** [ ] Pass [ ] Fail
### Scenario 6: the sidebar is there and names are safe (AC6, NFR)
Find T4, T6, T7. **Expected:** all pass; the Products list is in the sidebar, special characters in names are shown as text, and no fixed colours are used. **Result:** [ ] Pass [ ] Fail
### Scenario 7: your click opens your products (AC7, after deploy)
Sign in as usual on https://skills-framework.fly.dev, click "See all products" in the left sidebar. **Expected:** a page titled with your products opens, listing skills-framework, lending app, name, List aoo and New product (the five in your tenant), each clickable. **Broken looks like:** you land on the dashboard again. **Result:** [ ] Pass [ ] Fail