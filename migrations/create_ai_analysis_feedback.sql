-- Create AI Analysis Feedback Table
-- This table tracks user feedback on AI analysis results
-- Includes tenant isolation and agent tracking

CREATE TABLE IF NOT EXISTS ai_analysis_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    agent_id UUID NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    analysis_session_id UUID DEFAULT gen_random_uuid(),
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('upvote', 'downvote')),
    suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_feedback_per_session UNIQUE (analysis_session_id, agent_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_feedback_tenant_id ON ai_analysis_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_agent_id ON ai_analysis_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_customer_id ON ai_analysis_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_analysis_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_analysis_feedback(feedback_type);

-- Enable Row Level Security
ALTER TABLE ai_analysis_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY "Users can only access feedback from their tenant" ON ai_analysis_feedback
    FOR ALL USING (tenant_id = current_setting('app.current_tenant')::text);

-- Create RLS policy for agents to see their own feedback
CREATE POLICY "Agents can manage their own feedback" ON ai_analysis_feedback
    FOR ALL USING (agent_id = auth.uid());

-- Grant permissions
GRANT ALL ON ai_analysis_feedback TO authenticated;
GRANT ALL ON ai_analysis_feedback TO service_role;

-- Add comments for documentation
COMMENT ON TABLE ai_analysis_feedback IS 'Stores feedback on AI analysis results with tenant isolation';
COMMENT ON COLUMN ai_analysis_feedback.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN ai_analysis_feedback.agent_id IS 'UUID of the agent providing feedback';
COMMENT ON COLUMN ai_analysis_feedback.customer_id IS 'Customer ID the analysis was performed on';
COMMENT ON COLUMN ai_analysis_feedback.analysis_session_id IS 'Unique identifier for each analysis session';
COMMENT ON COLUMN ai_analysis_feedback.feedback_type IS 'Type of feedback: upvote or downvote';
COMMENT ON COLUMN ai_analysis_feedback.suggestion IS 'Optional improvement suggestion for downvotes';
