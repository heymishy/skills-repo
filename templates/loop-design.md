# Loop Design

**Feature / programme:** [name]
**Date:** [YYYY-MM-DD]
**Owner:** [name/role]
**Status:** Draft | Approved

---

## 1. Two-loop model summary

- Outer loop name in this environment: [name]
- Inner loop mode: Default | Custom
- Trigger from outer -> inner: [condition]
- Trigger from inner -> outer feedback: [condition]

---

## 2. Outer loop definition

| Outer stage | Purpose | Entry condition | Exit condition | Owner |
|-------------|---------|-----------------|----------------|-------|
| Discover | [text] | [text] | [text] | [role] |
| Define | [text] | [text] | [text] | [role] |
| Deliver (invoke inner loop) | [text] | [text] | [text] | [role] |
| Release/Deploy | [text] | [text] | [text] | [role] |
| Monitor | [text] | [text] | [text] | [role] |
| Measure | [text] | [text] | [text] | [role] |
| Learn/Re-plan | [text] | [text] | [text] | [role] |

---

## 3. Inner loop slot contract (swappable)

| Slot | Required input contract | Required output contract | Minimum evidence |
|------|-------------------------|--------------------------|------------------|
| Setup | [text] | [text] | [text] |
| Plan | [text] | [text] | [text] |
| Build/Test | [text] | [text] | [text] |
| Quality review | [text] | [text] | [text] |
| Verify completion | [text] | [text] | [text] |
| Branch/PR complete | [text] | [text] | [text] |

---

## 4. Inner loop implementation mapping

### Option selected
- Default pack | Custom pack

### Slot mapping
| Slot | This repo default skill/tool | Custom equivalent | Compatible? | Notes |
|------|------------------------------|-------------------|-------------|-------|
| Setup | `/branch-setup` | [text] | Yes/No | [text] |
| Plan | `/implementation-plan` | [text] | Yes/No | [text] |
| Build/Test | `/subagent-execution` or `/tdd` | [text] | Yes/No | [text] |
| Quality review | `/implementation-review` | [text] | Yes/No | [text] |
| Verify completion | `/verify-completion` | [text] | Yes/No | [text] |
| Branch/PR complete | `/branch-complete` | [text] | Yes/No | [text] |

---

## 5. Feedback wiring (inner -> outer)

| Signal source | Consumed by outer stage | Cadence | Owner | Action trigger |
|---------------|-------------------------|---------|-------|----------------|
| Test failures | Define | [text] | [role] | [text] |
| Defect themes | Discover | [text] | [role] | [text] |
| Delivery velocity | Measure | [text] | [role] | [text] |
| Outcome signals | Learn/Re-plan | [text] | [role] | [text] |

---

## 6. Risks and mitigations

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| [text] | [text] | [text] | [role] |

---

## 7. Approval

- Approved by: [name/role]
- Date: [YYYY-MM-DD]
- Review cadence: [weekly/fortnightly/monthly]
