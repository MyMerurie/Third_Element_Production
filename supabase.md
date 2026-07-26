# Supabase Database Schema
This document outlines the required table structures for the Third Element Productions CRM. 

## Master Tables (Configuration)

### `master_event_types`
- `id` (uuid, primary key)
- `name` (text, unique) - e.g., 'Wedding', 'Reception'
- `created_at` (timestamp)

### `master_lead_sources`
- `id` (uuid, primary key)
- `name` (text, unique) - e.g., 'Instagram', 'Referral'
- `created_at` (timestamp)

### `master_expense_categories`
- `id` (uuid, primary key)
- `name` (text, unique) - e.g., 'Flowers', 'Lighting'
- `created_at` (timestamp)

### `master_payment_methods`
- `id` (uuid, primary key)
- `name` (text, unique) - e.g., 'Cash', 'UPI'
- `created_at` (timestamp)

### `master_accounts`
- `id` (uuid, primary key)
- `name` (text, unique) - e.g., 'HDFC Current Account', 'Petty Cash'
- `created_at` (timestamp)

### `staff`
- `id` (uuid, primary key)
- `name` (text)
- `role` (text) - e.g., 'Sales', 'Operations'
- `created_at` (timestamp)

---

## Core Entities

### `clients`
- `id` (uuid, primary key)
- `name` (text, required)
- `phone` (text, required)
- `email` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `vendors`
- `id` (uuid, primary key)
- `name` (text, required)
- `category_id` (uuid, foreign key to `master_expense_categories`)
- `phone` (text)
- `email` (text)
- `status` (text) - e.g., 'Active', 'Inactive'
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `events` (Represents the overall Booking/Project)
- `id` (uuid, primary key)
- `event_id_serial` (text, unique) - Auto-generated string ID (e.g., EVT-001)
- `name` (text, required) - e.g., 'Rahul & Priya Wedding'
- `client_id` (uuid, foreign key to `clients`)
- `status` (text) - e.g., 'New Lead', 'Confirmed'
- `lead_source_id` (uuid, foreign key to `master_lead_sources`)
- `sales_executive_id` (uuid, foreign key to `staff`)
- `budget_estimated` (numeric, default 0)
- `budget_actual` (numeric, default 0)
- `amount_received` (numeric, default 0)
- `amount_outstanding` (numeric, default 0)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `event_functions` (Represents individual ceremonies/days)
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to `events`)
- `name` (text, required) - e.g., 'Haldi', 'Reception', 'Baarat'
- `function_date` (date, required)
- `venue` (text)
- `event_type_id` (uuid, foreign key to `master_event_types`)
- `created_at` (timestamp)

---

## Event Details & Finances

### `event_meetings`
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to `events`)
- `meeting_date` (date)
- `meeting_time` (time)
- `meeting_type` (text)
- `attended_by` (uuid, foreign key to `staff`)
- `notes` (text)
- `next_followup_date` (date)
- `created_at` (timestamp)

### `budget_items`
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to `events`)
- `category_id` (uuid, foreign key to `master_expense_categories`)
- `description` (text)
- `vendor_id` (uuid, foreign key to `vendors`)
- `quantity` (numeric)
- `unit` (text)
- `estimated_cost` (numeric)
- `notes` (text)
- `created_at` (timestamp)

### `expenses`
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to `events`)
- `date` (date)
- `category_id` (uuid, foreign key to `master_expense_categories`)
- `vendor_id` (uuid, foreign key to `vendors`)
- `amount` (numeric)
- `payment_method_id` (uuid, foreign key to `master_payment_methods`)
- `account_id` (uuid, foreign key to `master_accounts`)
- `remarks` (text)
- `created_at` (timestamp)

### `client_payments`
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to `events`)
- `client_id` (uuid, foreign key to `clients`)
- `date` (date)
- `amount_due` (numeric)
- `amount_received` (numeric)
- `payment_method_id` (uuid, foreign key to `master_payment_methods`)
- `account_id` (uuid, foreign key to `master_accounts`)
- `reference_number` (text)
- `created_at` (timestamp)

### `vendor_payments`
- `id` (uuid, primary key)
- `vendor_id` (uuid, foreign key to `vendors`)
- `event_id` (uuid, foreign key to `events`)
- `date` (date)
- `amount` (numeric)
- `payment_method_id` (uuid, foreign key to `master_payment_methods`)
- `account_id` (uuid, foreign key to `master_accounts`)
- `reference_number` (text)
- `created_at` (timestamp)
