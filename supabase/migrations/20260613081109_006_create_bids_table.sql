-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  estimated_cost DECIMAL(12,2) NOT NULL,
  estimated_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, professional_id)
);

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_bids_project_id ON bids(project_id);
CREATE INDEX idx_bids_professional_id ON bids(professional_id);

-- RLS Policies
CREATE POLICY "bids_select_own" ON bids FOR SELECT
  USING (professional_id::text = auth.uid()::text);

CREATE POLICY "bids_insert_own" ON bids FOR INSERT
  WITH CHECK (professional_id::text = auth.uid()::text);

CREATE POLICY "bids_update_own" ON bids FOR UPDATE
  USING (professional_id::text = auth.uid()::text)
  WITH CHECK (professional_id::text = auth.uid()::text);