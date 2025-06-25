-- Create flags table for storing customer account flags
CREATE TABLE IF NOT EXISTS public.flags (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public."Debtors"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Disable RLS for now to avoid the same issues we had with notes
-- You can enable it later with proper policies
ALTER TABLE public.flags DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to authenticated users
GRANT ALL PRIVILEGES ON TABLE public.flags TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for faster retrieval
CREATE INDEX IF NOT EXISTS flags_customer_id_idx ON public.flags(customer_id);
CREATE INDEX IF NOT EXISTS flags_created_by_idx ON public.flags(created_by);
CREATE INDEX IF NOT EXISTS flags_is_resolved_idx ON public.flags(is_resolved);
