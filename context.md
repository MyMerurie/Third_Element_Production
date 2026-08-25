# Developer Context - Third Element Productions CRM Modifications

This document summarizes the modified files, their functionalities, and key code locations (line numbers) for the implemented features.

---

## 1. Dashboard Page

### File: [`src/pages/Dashboard.jsx`](file:///d:/Work_setup/Third_Element_Productions/src/pages/Dashboard.jsx)
- **Brief Functionality**:
  - Updates the **Vendor Outstanding** KPI metric to calculate the net total balance due (matching the Vendor Ledger).
  - Implements inline "+ Add New Account" selection and creation within the Quick Action modals (Client Payment, Vendor Payment, and Expense).
  - Resolves a database schema mismatch where the Client Payment quick action modal was inserting `account_id` instead of the expected `account` name string.
- **Key Line Numbers**:
  - **Lines 27-29**: Added `newAccountName` and `showNewAccountInput` React state variables.
  - **Lines 81-112**: Added `handleAddNewAccount` helper function to insert new accounts into `master_accounts` and update the local state list.
  - **Lines 334-345**: Fixed `handleRecordClientPayment` to insert `account: accountName` (the text name of the selected account) instead of `account_id`.
  - **Lines 810-850**: Updated **Record Client Payment** modal with account select dropdown and inline new account input.
  - **Lines 950-990**: Updated **Record Vendor Payment** modal with account select dropdown and inline new account input.
  - **Lines 1100-1140**: Updated **Record Expense** modal with account select dropdown and inline new account input.

---

## 2. Event Detail Page

### File: [`src/pages/EventDetail.jsx`](file:///d:/Work_setup/Third_Element_Productions/src/pages/EventDetail.jsx)
- **Brief Functionality**:
  - Integrates the inline "+ Add New Account" dropdowns and inputs for Client Payment, Vendor Payment, and Expense modals.
  - Changes the vendor ledger **Budgeted Cost** column calculation to sum `actual_cost` (instead of `estimated_cost`) for assigned budget items.
  - Improves negative balance display formatting (displays as `-₹X,XXX` instead of `₹-X,XXX`).
  - Implements drag-and-drop reordering for all budget items (including subheaders) in the Budget tab, saving the new order by updating their `created_at` timestamp in the database sequentially.
  - Sorts loaded vendors alphabetically by name so all vendor select inputs are sorted.
- **Key Line Numbers**:
  - **Lines 45-48**: Added `newAccountName`, `showNewAccountInput`, `draggedItemIndex`, `dragOverItemIndex`, and `draggedItemCatId` React state variables.
  - **Lines 120-151**: Added `handleAddNewAccount` helper function to insert new accounts into `master_accounts` and update the local state list.
  - **Line 213**: Sorted loaded vendors alphabetically on fetch in `loadData`.
  - **Lines 378-430**: Added drag-and-drop handlers `handleItemDragStart`, `handleItemDragEnter`, and `handleItemDragEnd` to update state and sequentially update item `created_at` timestamps in the database in parallel.
  - **Line 1006**: Updated vendor finances budgeted cost calculation to use `actual_cost`.
  - **Lines 1815-1940**: Updated Budget items table headers and rows to support grab handles and drag-and-drop events.
  - **Lines 1951-1953**: Formatted negative outstanding balances under the Vendors tab table to output cleanly as `-₹X,XXX`.
  - **Lines 2378-2415**: Updated **Expense** modal with account select dropdown and inline new account input.
  - **Lines 2515-2555**: Updated **Client Payment** modal with account select dropdown and inline new account input.
  - **Lines 2660-2700**: Updated **Vendor Payment** modal with account select dropdown and inline new account input.

---

## 3. Ledgers Page

### File: [`src/pages/More.jsx`](file:///d:/Work_setup/Third_Element_Productions/src/pages/More.jsx)
- **Brief Functionality**:
  - Calculates outstanding user receivables and payables from estimated budget item costs minus vendor payments.
  - Renames the vendor ledger "Total Purchases" KPI card to "Total Billing".
  - Integrates the inline "+ Add New Account" dropdowns and inputs for client/vendor payment collector forms and direct vendor expense forms.
  - Fixes negative currency running balances under the Vendor Ledger header to format cleanly.
- **Key Line Numbers**:
  - **Lines 34-36**: Added `newAccountName` and `showNewAccountInput` React state variables.
  - **Lines 98-129**: Added `handleAddNewAccount` helper function to insert new accounts into `master_accounts` and update local state list.
  - **Line 602**: Renamed "Total Purchases" to "Total Billing".
  - **Lines 737-739**: Formatted negative outstanding ledger running balance to output cleanly as `-₹X,XXX`.
  - **Lines 1070-1079**: Corrected outstanding vendor payments calculation to subtract vendor payments from `budgetItems` credits.
  - **Lines 1426-1515**: Updated client/vendor payment collection modal forms to use select dropdowns with inline new account input.
  - **Lines 1836-1875**: Updated direct vendor expense modal form to use account select dropdown with inline new account input.

---

## 4. Reports Page

### File: [`src/pages/Reports.jsx`](file:///d:/Work_setup/Third_Element_Productions/src/pages/Reports.jsx)
- **Brief Functionality**:
  - Fixes event profitability calculations to fetch actual event revenue and actual event expenses directly from the `events` table.
  - Corrects budget vs actual variance calculations to show `100.0%` (over budget) instead of `0.0%` when budgeted is zero but actual spent is positive.
  - Fixes currency formatting for negative differences, variance diff, and profit columns to format cleanly as `-₹X,XXX`.
- **Key Line Numbers**:
  - **Line 337**: Corrected `variancePercent` for zero budgeted items.
  - **Line 359**: Corrected `bvsVariancePercent` for zero total budgets.
  - **Lines 385-411**: Corrected Profitability Report calculation mapping to fetch `budget_actual` as revenue and `budget_actual_cost` as expenses.
  - **Lines 790-792**: Fixed `bvsTotalDiff` (Variance Diff) currency negative formatting.
  - **Lines 826-828**: Fixed `item.difference` (Difference) currency negative formatting.
  - **Lines 962-964**: Fixed `evt.profit` (Net Profit/Loss) currency negative formatting.
