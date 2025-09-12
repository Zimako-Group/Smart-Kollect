-- University of Venda Master File Table
-- This script creates the table structure for University of Venda customer data

-- Drop the table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.univen_customers CASCADE;

-- Create the univen_customers table
CREATE TABLE public.univen_customers (
    -- Standard customer fields
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id),
    
    -- Client Information
    "Client Reference" TEXT,
    "Interest rate" NUMERIC,
    "Interest date" DATE,
    "In Duplum" TEXT,
    "Masked Client Reference" TEXT,
    "Client" TEXT,
    "Client Group" TEXT,
    "Status" TEXT,
    "Status Date" DATE,
    "Debtor under DC?" TEXT,
    "Debtor Status Date" DATE,
    "Days Overdue" INTEGER,
    "Client Division" TEXT,
    "Old Client Ref" TEXT,
    "Client Profile Account" TEXT,
    "EasyPay Reference" TEXT,
    
    -- Financial Information
    "Original Cost" NUMERIC,
    "Capital on Default" NUMERIC,
    "Date Opened" DATE,
    "Hand Over Date" DATE,
    "Hand Over Amount" NUMERIC,
    "Payments To Date" NUMERIC,
    "Interest To Date" NUMERIC,
    "Adjustments To Date" NUMERIC,
    "Fees & Expenses" NUMERIC,
    "Collection Commission" NUMERIC,
    "FCC (excl VAT)" NUMERIC,
    "Current Balance" NUMERIC,
    "Capital Amount" NUMERIC,
    
    -- Payment Information
    "Last Payment Method" TEXT,
    "Days since Last Payment" INTEGER,
    "Last Payment Date" DATE,
    "Last Payment Amount" NUMERIC,
    
    -- Call Information
    "Outbound Phone Call Outcome" TEXT,
    "Outbound Phone Call Comment" TEXT,
    "Last Inbound Phone Call Date" DATE,
    "Inbound Phone Call Outcome" TEXT,
    
    -- Contact Information
    "Cellphone" TEXT,
    "Cellphone 2" TEXT,
    "Cellphone 3" TEXT,
    "Cellphone 4" TEXT,
    "Email" TEXT,
    "Email 2" TEXT,
    "Email 3" TEXT,
    
    -- Address Information
    "Street Address 1" TEXT,
    "Street Address 2" TEXT,
    "Street Address 3" TEXT,
    "Street Address 4" TEXT,
    "Street Code" TEXT,
    "Combined Street" TEXT,
    
    -- Personal Information
    "Gender" TEXT,
    "Occupation" TEXT,
    "Employer Name" TEXT,
    "Employer Contact" TEXT,
    "Last Contact" DATE,
    "ID Number" TEXT,
    "Title" TEXT,
    "Initials" TEXT,
    "First Name" TEXT,
    "Second Name" TEXT,
    "Surname" TEXT,
    
    -- Account Information
    "Account Load Date" DATE,
    "Debtor Flags" TEXT,
    "Account Flags" TEXT,
    "Linked Account" TEXT,
    "Bucket" TEXT,
    "Campaign Exclusions" TEXT,
    "Original Line" TEXT,
    
    -- Error field for import issues
    "error" TEXT,
    
    -- Metadata
    source_file TEXT,
    import_batch_id TEXT,
    notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_univen_customers_tenant_id ON public.univen_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_univen_customers_client_reference ON public.univen_customers("Client Reference");
CREATE INDEX IF NOT EXISTS idx_univen_customers_id_number ON public.univen_customers("ID Number");
CREATE INDEX IF NOT EXISTS idx_univen_customers_surname ON public.univen_customers("Surname");
CREATE INDEX IF NOT EXISTS idx_univen_customers_cellphone ON public.univen_customers("Cellphone");

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
DROP TRIGGER IF EXISTS set_univen_customer_tenant_id_trigger ON public.univen_customers;
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

DROP TRIGGER IF EXISTS set_univen_customers_updated_at ON public.univen_customers;
CREATE TRIGGER set_univen_customers_updated_at
    BEFORE UPDATE ON public.univen_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();