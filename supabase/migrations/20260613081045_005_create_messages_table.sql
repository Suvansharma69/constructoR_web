-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, read);

-- RLS Policies - Users can only see messages they're part of
CREATE POLICY "messages_select_own" ON messages FOR SELECT
  USING (sender_id::text = auth.uid()::text OR receiver_id::text = auth.uid()::text);

CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  WITH CHECK (sender_id::text = auth.uid()::text);

CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  USING (receiver_id::text = auth.uid()::text)
  WITH CHECK (receiver_id::text = auth.uid()::text);