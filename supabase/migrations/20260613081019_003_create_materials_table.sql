-- Materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  stock INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE,
  images TEXT[],
  vendor_name TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_materials_vendor_id ON materials(vendor_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_in_stock ON materials(in_stock);

-- RLS Policies
CREATE POLICY "materials_select_all" ON materials FOR SELECT
  USING (in_stock = TRUE OR vendor_id::text = auth.uid()::text);

CREATE POLICY "materials_insert_own" ON materials FOR INSERT
  WITH CHECK (vendor_id::text = auth.uid()::text);

CREATE POLICY "materials_update_own" ON materials FOR UPDATE
  USING (vendor_id::text = auth.uid()::text)
  WITH CHECK (vendor_id::text = auth.uid()::text);

CREATE POLICY "materials_delete_own" ON materials FOR DELETE
  USING (vendor_id::text = auth.uid()::text);