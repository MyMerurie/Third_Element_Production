# Ceremony-Wise Budget & Expense Tracking

This document outlines the proposed design, database changes, and UI updates to support breaking down budgets and expenses by individual ceremonies (e.g., Haldi, Mehendi, Wedding, Reception) within an event.

---

## 1. Database Schema Changes

To associate cost items with specific ceremonies, we need to add references to the `event_functions` table in both `budget_items` (estimations) and `expenses` (actual spend).

Run this SQL script in your Supabase SQL Editor:

```sql
-- 1. Add ceremony (function) reference to Budget Items
ALTER TABLE budget_items 
ADD COLUMN function_id UUID REFERENCES event_functions(id) ON DELETE SET NULL;

-- 2. Add ceremony (function) reference to Actual Expenses
ALTER TABLE expenses 
ADD COLUMN function_id UUID REFERENCES event_functions(id) ON DELETE SET NULL;
```

---

## 2. Proposed UI & Flow Changes

### A. Budget Estimation Sheet (Budget Tab)
* **Dropdown Selection**: Add a "Ceremony" selector column next to the "Description" or "Vendor" field in each row. The options will be populated dynamically from the list of ceremonies (`event_functions`) created for the event.
* **Ceremony Total Summary Card**: At the top of the **Budget** tab, display a small summary grid showing the sub-totals grouped by ceremony (e.g., *Wedding: ₹1,50,000*, *Haldi: ₹25,050*, *General Event Costs: ₹40,000*).

### B. Expense Recording (Expenses Tab & Ledger Modals)
* **Ceremony Selector in Modal**: Add an optional "Ceremony / Function" dropdown select field inside the **Add/Edit Expense** modal form.
* **Day Book / Reports**: Update the Master Day Book and expense logs to display which ceremony the expense was incurred for.

### C. Ceremony Dashboard Section
* On the **Overview** page, display a visual breakdown card of how the overall budget is distributed across the different ceremonies (e.g. Pie chart or percentage progress bars).

---

## 3. Benefits & Discussion Points

1. **Granular Cost Control**: Easy to track if decorative flowers for the *Reception* exceeded the estimated budget, even if the *Haldi* ceremony flowers were under-budget.
2. **Client Transparency**: Provides clients with a clear, ceremony-wise billing receipt showing exactly where their budget was spent.
3. **Vendor Allocations**: Allows identifying which vendor is working on which ceremony for better coordination.
