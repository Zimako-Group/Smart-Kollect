-- Create webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON public.webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON public.webhooks(created_by);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can manage webhooks (check if user_profiles table exists first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Create policies that reference user_profiles
        CREATE POLICY "Admin users can view all webhooks" ON public.webhooks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );

        CREATE POLICY "Admin users can insert webhooks" ON public.webhooks
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );

        CREATE POLICY "Admin users can update webhooks" ON public.webhooks
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );

        CREATE POLICY "Admin users can delete webhooks" ON public.webhooks
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.role = 'admin'
                )
            );
    ELSE
        -- Create temporary policies that allow authenticated users (to be updated later)
        CREATE POLICY "Authenticated users can manage webhooks" ON public.webhooks
            FOR ALL USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_webhooks_updated_at 
    BEFORE UPDATE ON public.webhooks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
