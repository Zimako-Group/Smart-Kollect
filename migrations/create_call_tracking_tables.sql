-- Create active_calls table for tracking ongoing calls
CREATE TABLE IF NOT EXISTS active_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    agent_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id UUID,
    call_type TEXT CHECK (call_type IN ('outbound', 'inbound')) NOT NULL DEFAULT 'outbound',
    status TEXT CHECK (status IN ('dialing', 'connected', 'on_hold', 'ended')) NOT NULL DEFAULT 'dialing',
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_queue table for tracking queued calls
CREATE TABLE IF NOT EXISTS call_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_id UUID,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) NOT NULL DEFAULT 'medium',
    wait_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call_history table for archiving completed calls
CREATE TABLE IF NOT EXISTS call_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL,
    agent_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id UUID,
    call_type TEXT CHECK (call_type IN ('outbound', 'inbound')) NOT NULL,
    status TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_calls_agent_id ON active_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_active_calls_status ON active_calls(status);
CREATE INDEX IF NOT EXISTS idx_active_calls_created_at ON active_calls(created_at);

CREATE INDEX IF NOT EXISTS idx_call_queue_priority ON call_queue(priority);
CREATE INDEX IF NOT EXISTS idx_call_queue_created_at ON call_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_call_history_agent_id ON call_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_history_archived_at ON call_history(archived_at);

-- Enable Row Level Security (RLS)
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for active_calls
CREATE POLICY "Users can view all active calls" ON active_calls
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own calls" ON active_calls
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own calls" ON active_calls
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own calls" ON active_calls
    FOR DELETE USING (true);

-- Create RLS policies for call_queue
CREATE POLICY "Users can view all queued calls" ON call_queue
    FOR SELECT USING (true);

CREATE POLICY "Users can manage call queue" ON call_queue
    FOR ALL USING (true);

-- Create RLS policies for call_history
CREATE POLICY "Users can view all call history" ON call_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert call history" ON call_history
    FOR INSERT WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on active_calls
CREATE TRIGGER update_active_calls_updated_at 
    BEFORE UPDATE ON active_calls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the tables
ALTER PUBLICATION supabase_realtime ADD TABLE active_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_queue;

-- Insert some sample data for testing (optional)
-- INSERT INTO call_queue (phone_number, customer_name, priority) VALUES
-- ('0123456789', 'John Doe', 'high'),
-- ('0987654321', 'Jane Smith', 'medium'),
-- ('0555123456', 'Bob Johnson', 'low');
