-- Third Element Productions CRM - Supabase SQL Script
-- Run this script in the Supabase SQL Editor to generate all tables and seed data

-- Master Tables

CREATE TABLE master_lead_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE master_expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE master_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE master_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Core Entities
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES master_expense_categories(id),
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id_serial TEXT UNIQUE,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'New Lead',
  lead_source_id UUID REFERENCES master_lead_sources(id),
  sales_executive_id UUID REFERENCES staff(id),
  budget_estimated NUMERIC DEFAULT 0,
  budget_actual NUMERIC DEFAULT 0,
  amount_received NUMERIC DEFAULT 0,
  amount_outstanding NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE event_functions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  function_date DATE NOT NULL,
  venue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Details & Finances
CREATE TABLE event_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  meeting_date DATE,
  meeting_time TIME,
  meeting_type TEXT,
  attended_by UUID REFERENCES staff(id),
  notes TEXT,
  next_followup_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES master_expense_categories(id),
  description TEXT,
  vendor_id UUID REFERENCES vendors(id),
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  notes TEXT,
  function_id UUID REFERENCES event_functions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  date DATE,
  category_id UUID REFERENCES master_expense_categories(id),
  vendor_id UUID REFERENCES vendors(id),
  amount NUMERIC DEFAULT 0,
  payment_method_id UUID REFERENCES master_payment_methods(id),
  account_id UUID REFERENCES master_accounts(id),
  remarks TEXT,
  function_id UUID REFERENCES event_functions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE client_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE,
  amount_due NUMERIC DEFAULT 0,
  amount_received NUMERIC DEFAULT 0,
  payment_method_id UUID REFERENCES master_payment_methods(id),
  account TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE vendor_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  date DATE,
  amount NUMERIC DEFAULT 0,
  payment_method_id UUID REFERENCES master_payment_methods(id),
  account_id UUID REFERENCES master_accounts(id),
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ----------------------------------------------------
-- Seed Data for Master Tables
-- ----------------------------------------------------


INSERT INTO master_lead_sources (name) VALUES 
('Instagram'), ('Facebook'), ('Google'), ('Website'), ('Referral'), ('Walk-In'), ('Existing Client')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_expense_categories (name) VALUES 
('Flowers'), ('Lighting'), ('Fabric & Draping'), ('Furniture'), ('Sound & AV'), ('Labour'), ('Transport'), ('Accommodation'), ('Printing'), ('Food & Catering'), ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_payment_methods (name) VALUES 
('Cash'), ('UPI'), ('Bank Transfer'), ('Cheque'), ('Credit Card')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_accounts (name) VALUES 
('Cash in Hand'), ('HDFC Current Account'), ('ICICI Current Account'), ('Petty Cash')
ON CONFLICT (name) DO NOTHING;
