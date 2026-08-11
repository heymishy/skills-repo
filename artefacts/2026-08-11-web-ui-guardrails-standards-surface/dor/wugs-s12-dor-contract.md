## Contract Proposal — Remove the `standards`/`standard_product_optouts` DB tables and their references

**What will be built:**
Removal of the two `DELETE FROM` cleanup lines in `handleDeleteProduct` referencing `standards`/`standard_product_optouts`. Migration script updated to drop both tables (`DROP TABLE IF EXISTS`) rather than create them.

**What will NOT be built:**
Any data-preservation/export mechanism.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual/CI check — repo-wide grep for table names | manual |
| AC2 | Unit test, mock pool tracking `.query()` calls during `handleDeleteProduct` | unit |
| AC3 | Unit test, migration script run against a test DB | unit |
| AC4 | Integration test — full `products.js` regression suite | integration |

**Assumptions:**
`wugs-s11` is merged and deployed first — no code references the tables by the time this story starts.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js` (`handleDeleteProduct` cleanup), `scripts/migrate-schema-pg.js`, `tests/check-wugs-s12-*.js` (new)
Services: None
APIs: None
