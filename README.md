# Third Element Productions CRM

React + Vite + Supabase CRM for event management, ledgers, rentals, inventory and overheads.

## Setup

```bash
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`. Run `supabase_schema.sql`, then `supabase_migration_phase2.sql`, in the Supabase SQL editor.

## Phase 2 additions

**Run `supabase_migration_phase2.sql` first.** It adds the columns and tables below and creates a public `crm-files` storage bucket (used for quotation PDFs and inventory images; anon uploads are allowed).

| Area | Where | What |
|---|---|---|
| Vendor old balance | More → Vendor Ledger | `vendors.old_balance` is set in the vendor add/edit form. It is added to total billed/outstanding and shown as an "Old Balance" row in the vendor's history. New event costs add on top. |
| Customer quotations | More → Client Ledger → client detail | "Events & Quotations" table: upload/replace a Zoho quotation PDF per event (`events.quotation_url`, `quotation_name`). |
| Rentals | `/rentals` | Customer, phone, rental address, pick-up/return dates, particulars (qty, rate, amount), labour, transport, status. Auto invoice number (`RENT-0001`) and a printable invoice (Print / Save PDF). Tables: `rentals`, `rental_items`. |
| Inventory | `/inventory` | Product code, name, description (expandable), available qty, price, image, condition (New / Used / Repair / Refurbish / Discard). Search and condition filter. Table: `inventory_items`. |
| Overheads | `/overheads` | Tabs: Calendar, Fixed Expenses, Partner Salaries, Labour Salaries (monthly). Categories: Godown Rent, Labour Room Rent, Water, Electricity, Wi-Fi, Miscellaneous, Compliance Fees, Partner Conveyance & Food, Other Office Expenses. Calendar also shows event functions and rental pick-ups/returns. Table: `overhead_expenses`. |

**Mobile:** all modals become bottom sheets with a sticky Save bar; inputs are 16px / 44px tall (no iOS zoom); phone and number fields open the right keypad; Rentals, Inventory and Overheads show cards instead of tables; inventory image upload can use the camera. Existing pages (ledgers, event workspace, reports) use the same treatment: every table becomes labelled stacked cards on phones (`src/lib/useStackedTables.js` copies header text onto cells; styles in `src/index.css`), KPI grids and filter rows stack, and header button rows wrap. Global rules live in `src/index.css`.

New pages are in the sidebar and under More (for mobile). Shared upload helper: `src/lib/storage.js`.

---

# React + Vite (template notes)

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
