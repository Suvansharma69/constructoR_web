-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL,
  timeline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  images TEXT[],
  documents TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_location_status ON projects(location, status);
CREATE INDEX idx_projects_project_type ON projects(project_type);

-- RLS Policies
CREATE POLICY "projects_select_own" ON projects FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "projects_insert_own" ON projects FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "projects_update_own" ON projects FOR UPDATE
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "projects_delete_own" ON projects FOR DELETE
  USING (user_id::text = auth.uid()::text);