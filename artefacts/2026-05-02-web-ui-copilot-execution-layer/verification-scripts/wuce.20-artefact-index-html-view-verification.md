# Verification Script: Feature artefact index HTML view

**Story:** wuce.20 — Feature artefact index HTML view
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- At least one feature with artefacts in `artefacts/` directory
- `tests/check-wuce20-artefact-index-html.js` committed

---

## AC1 — GET /features/:slug renders HTML artefact list

**Automated check:**
```bash
node tests/check-wuce20-artefact-index-html.js
```
T1–T3, T13, T14 must pass.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/features/[a-known-feature-slug]` in a browser (authenticated)
2. Confirm artefact list rendered; each item shows: artefact type label, date, link

---

## AC2 — Accept: application/json returns JSON unchanged

**Automated check:** T8, T9

**Manual smoke check:**
```bash
curl -s http://localhost:3000/features/[slug] -H "Accept: application/json" | python3 -m json.tool
```

**Pass criteria:** Valid JSON, no HTML in response

---

## AC3 — Artefact type labels are human-readable

**Automated check:** T4, T5, T6, T7, T15, T16

**Manual smoke check:**
1. Load feature artefact page in browser
2. Confirm you see "Discovery", "Benefit Metric", "Ready Check", "Test Plan" — not raw type codes
3. No raw strings like "dor" or "benefit-metric" visible as rendered text to the user

---

## AC4 — User-controlled values escaped

**Automated check:** T10

---

## AC5 — Empty artefacts → empty-state message

**Automated check:** T11

**Manual smoke check:**
1. Load `/features/[slug-with-no-artefacts]`
2. Confirm "No artefacts found" (or equivalent) shown — no empty `<ul>`

---

## AC6 — Unauthenticated → 302

**Automated check:** T12

---

## NFR checks

| NFR | Check |
|-----|-------|
| `artefact-labels.js` is a separate module (not inline switch in route) | `grep -r "Ready Check" src/web-ui/routes/` should return nothing; label lives in `src/web-ui/utils/artefact-labels.js` |
| Labels module returns fallback for unknown types | T16 automated |
| Audit log written with featureSlug | T17 automated |
