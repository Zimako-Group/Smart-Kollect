-- University of Venda Master File Table
-- This script creates the table structure for University of Venda customer data

-- Create the univen_customers table
CREATE TABLE IF NOT EXISTS public.univen_customers (
    -- Standard customer fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id),
    
    -- Customer identification
    acc_number TEXT UNIQUE,
    initials TEXT,
    first_name TEXT,
    surname TEXT,
    surname_company_trust TEXT,
    id_number TEXT,
    date_of_birth DATE,
    gender TEXT,
    marital_status TEXT,
    title TEXT,
    
    -- Contact information
    telephone TEXT,
    cellphone TEXT,
    cellphone_2 TEXT,
    cellphone_3 TEXT,
    cellphone_4 TEXT,
    email_addr_1 TEXT,
    email_addr_2 TEXT,
    email_2 TEXT,
    email_3 TEXT,
    last_contact DATE,
    
    -- Address information
    street_address_1 TEXT,
    street_address_2 TEXT,
    street_address_3 TEXT,
    street_address_4 TEXT,
    street_addr TEXT,
    post_addr_1 TEXT,
    post_addr_2 TEXT,
    post_addr_3 TEXT,
    street_code TEXT,
    post_code TEXT,
    combined_street TEXT,
    
    -- Employment information
    occupation TEXT,
    employer_name TEXT,
    employer_contact TEXT,
    
    -- Account information
    current_balance NUMERIC,
    outstanding_balance NUMERIC,
    original_balance NUMERIC,
    account_load_date DATE,
    debtor_flags TEXT,
    account_flags TEXT,
    linked_account TEXT,
    bucket TEXT,
    campaign_exclusions TEXT,
    error TEXT,
    original_line TEXT,
    
    -- Metadata
    source_file TEXT,
    import_batch_id TEXT,
    notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_univen_customers_tenant_id ON public.univen_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_univen_customers_acc_number ON public.univen_customers(acc_number);
CREATE INDEX IF NOT EXISTS idx_univen_customers_id_number ON public.univen_customers(id_number);
CREATE INDEX IF NOT EXISTS idx_univen_customers_surname ON public.univen_customers(surname);
CREATE INDEX IF NOT EXISTS idx_univen_customers_cellphone ON public.univen_customers(cellphone);

-- Enable Row Level Security
ALTER TABLE public.univen_customers ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY "Users can only access their tenant's University of Venda customers" 
ON public.univen_customers 
FOR ALL 
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Admins can access all University of Venda customers" 
ON public.univen_customers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'super_admin')
));

-- Grant permissions
GRANT ALL ON public.univen_customers TO authenticated;

-- Create function to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION public.set_univen_customer_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := current_setting('app.current_tenant_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set tenant_id
CREATE TRIGGER set_univen_customer_tenant_id_trigger
    BEFORE INSERT ON public.univen_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_univen_customer_tenant_id();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_univen_customers_updated_at
    BEFORE UPDATE ON public.univen_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();