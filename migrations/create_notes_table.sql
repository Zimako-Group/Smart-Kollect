-- Create notes table for storing customer notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public."Debtors"(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    category TEXT NOT NULL CHECK (category IN ('general', 'payment', 'contact', 'legal', 'other')),
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    is_private BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add RLS policies for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy for reading notes: agents can read all notes except private notes of other agents
CREATE POLICY "Agents can read all non-private notes" 
ON public.notes FOR SELECT 
USING (
    is_private = FALSE OR 
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND 
        (role = 'admin' OR role = 'supervisor' OR role = 'manager')
    )
);

-- Policy for inserting notes: authenticated users can create notes
CREATE POLICY "Authenticated users can create notes" 
ON public.notes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy for updating notes: users can update their own notes, admins/supervisors/managers can update any note
CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND 
        (role = 'admin' OR role = 'supervisor' OR role = 'manager')
    )
);

-- Policy for deleting notes: users can delete their own notes, admins/supervisors/managers can delete any note
CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND 
        (role = 'admin' OR role = 'supervisor' OR role = 'manager')
    )
);

-- Create index for faster retrieval
CREATE INDEX IF NOT EXISTS notes_customer_id_idx ON public.notes(customer_id);
CREATE INDEX IF NOT EXISTS notes_created_by_idx ON public.notes(created_by);
CREATE INDEX IF NOT EXISTS notes_category_idx ON public.notes(category);
