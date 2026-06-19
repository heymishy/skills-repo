# Organisation Mapping

**Organisation/team:** [name]
**Date:** [YYYY-MM-DD]
**Owner:** [name/role]
**Status:** Draft | Approved

---

## 1. Vocabulary mapping

| Pipeline term | Org term | Notes |
|---------------|----------|-------|
| Discovery | [text] | [text] |
| Definition | [text] | [text] |
| Review | [text] | [text] |
| Test plan | [text] | [text] |
| Definition of ready | [text] | [text] |
| Definition of done | [text] | [text] |
| Trace | [text] | [text] |

---

## 2. Skill-to-process matrix

| Skill | Org process step | Required artefact | Approver role | System of record | Control objective |
|-------|------------------|-------------------|---------------|------------------|------------------|
| `/discovery` | [text] | [text] | [role] | [tool] | [text] |
| `/definition` | [text] | [text] | [role] | [tool] | [text] |
| `/review` | [text] | [text] | [role] | [tool] | [text] |
| `/release` | [text] | [text] | [role] | [tool] | [text] |

---

## 3. Governance gate mapping

| Governance gate | Equivalent pipeline gate | Evidence required | Exception path |
|-----------------|--------------------------|------------------|----------------|
| [text] | [text] | [text] | [text] |

---

## 4. Unmapped items and gaps

| Unmapped org process | Impact | Proposed owner skill/artifact | Priority |
|----------------------|--------|-------------------------------|----------|
| [text] | [text] | [text] | High/Med/Low |

---

## 5. Context configuration updates

Proposed `context.yml` mapping section:
```yaml
mapping:
  stage_aliases:
    discovery: [org-name]
    definition: [org-name]
    review: [org-name]
  artefact_aliases:
    discovery.md: [org-doc-name]
    test-plan.md: [org-doc-name]
  governance:
    gates:
      - name: [gate-name]
        maps_to_skill: [skill]
        required_approval_role: [role]
```

---

## 6. Adoption decisions

- Approved by: [name/role]
- Date: [YYYY-MM-DD]
- Next review date: [YYYY-MM-DD]
