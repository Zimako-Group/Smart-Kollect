-- Add University of Venda tenant to the database

-- Insert University of Venda tenant
INSERT INTO tenants (name, subdomain, domain) VALUES 
  ('University of Venda', 'univen', 'univen.smartkollect.co.za')
ON CONFLICT (subdomain) DO NOTHING;

-- Add any additional University of Venda specific configurations here if needed
