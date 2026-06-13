-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,
  contact TEXT NOT NULL UNIQUE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('phone', 'email')),
  role TEXT NOT NULL CHECK (role IN ('homeowner', 'architect', 'contractor', 'interior_designer', 'vendor')),
  profile_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  city TEXT,
  avatar TEXT,
  -- Professional fields
  experience INTEGER,
  specializations TEXT[],
  price_range TEXT,
  consultation_fee DECIMAL(10,2),
  portfolio_images TEXT[],
  -- Vendor fields
  shop_name TEXT,
  owner_name TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_users_role_city ON users(role, city);
CREATE INDEX idx_users_contact ON users(contact);

-- RLS Policies for users
CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);