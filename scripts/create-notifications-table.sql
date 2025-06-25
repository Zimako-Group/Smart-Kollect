-- Create Notifications table
CREATE TABLE IF NOT EXISTS "Notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK (type IN ('info', 'warning', 'urgent')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "read" BOOLEAN DEFAULT FALSE,
  "agent_name" TEXT,
  "customer_id" UUID REFERENCES "Debtors"("id") ON DELETE CASCADE,
  "customer_name" TEXT,
  "action_type" TEXT,
  "action_id" TEXT,
  "details" JSONB,
  "target_role" TEXT NOT NULL CHECK (target_role IN ('admin', 'agent', 'all'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS notifications_target_role_idx ON "Notifications"("target_role");
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON "Notifications"("created_at" DESC);
CREATE INDEX IF NOT EXISTS notifications_agent_name_idx ON "Notifications"("agent_name");
CREATE INDEX IF NOT EXISTS notifications_read_idx ON "Notifications"("read");

-- Add RLS (Row Level Security) policies
ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert notifications
CREATE POLICY "Allow authenticated users to insert notifications"
  ON "Notifications"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to view notifications
CREATE POLICY "Allow authenticated users to view notifications"
  ON "Notifications"
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update notifications
CREATE POLICY "Allow authenticated users to update notifications"
  ON "Notifications"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete notifications
CREATE POLICY "Allow authenticated users to delete notifications"
  ON "Notifications"
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comment to the table for documentation
COMMENT ON TABLE "Notifications" IS 'Stores system notifications for admins and agents';
