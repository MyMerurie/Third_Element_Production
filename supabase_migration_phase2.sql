-- Phase 2 additions: vendor old balance, quotations, rentals, inventory, overheads
-- Run in the Supabase SQL Editor (safe to re-run).

-- 0. CLEAN-UP of tables created by the wrong (earlier) script.
-- WARNING: this permanently deletes these tables and their data. Only run it if they are empty / disposable.
-- Delete this section if you have never run the other script.
DROP TABLE IF EXISTS rental_items CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS overheads CASCADE;
DROP TABLE IF EXISTS vendor_events CASCADE;
DROP POLICY IF EXISTS "quotations rw" ON storage.objects;
DROP POLICY IF EXISTS "inventory rw" ON storage.objects;

-- 1. Vendors: opening / old balance
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS old_balance NUMERIC DEFAULT 0;

-- 2. Events (customer section): Zoho quotation PDF
ALTER TABLE events ADD COLUMN IF NOT EXISTS quotation_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS quotation_name TEXT;

-- 3. Rentals
CREATE TABLE IF NOT EXISTS rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT,
  rental_address TEXT,
  pickup_date DATE,
  return_date DATE,
  labour_charges NUMERIC DEFAULT 0,
  transport_charges NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Booked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  particulars TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  available_qty NUMERIC DEFAULT 0,
  price NUMERIC DEFAULT 0,
  image_url TEXT,
  condition TEXT DEFAULT 'New',  -- New, Used, Repair, Refurbish, Discard
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Overheads / fixed expenses
CREATE TABLE IF NOT EXISTS overhead_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,   -- Godown Rent, Labour Room Rent, Water Bill, Electricity Bill, Wi-Fi, Miscellaneous, Partner Salary, Labour Salary, Compliance Fees, Partner Conveyance & Food, Other Office Expenses, ...
  payee TEXT,               -- partner / labour name for salaries
  description TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. File storage bucket (quotation PDFs + inventory images)
INSERT INTO storage.buckets (id, name, public) VALUES ('crm-files', 'crm-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "crm-files public read" ON storage.objects;
DROP POLICY IF EXISTS "crm-files anon write" ON storage.objects;
CREATE POLICY "crm-files public read" ON storage.objects FOR SELECT USING (bucket_id = 'crm-files');
CREATE POLICY "crm-files anon write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'crm-files');
