-- Function to get all accounts allocated to a specific agent
CREATE OR REPLACE FUNCTION get_agent_allocated_accounts(agent_id_param UUID)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', d.id,
      'acc_number', d.acc_number,
      'name', d.name,
      'surname_company_trust', d.surname_company_trust,
      'cell_number', d.cell_number,
      'email_addr_1', d.email_addr_1,
      'outstanding_balance', d.outstanding_balance,
      'last_payment_date', d.last_payment_date,
      'last_payment_amount', d.last_payment_amount,
      'account_status_description', d.account_status_description,
      'allocation_id', aa.id,
      'allocation_date', aa.allocation_date,
      'allocation_status', aa.status
    )
  FROM 
    "AccountAllocations" aa
  JOIN 
    debtors d ON aa.account_id = d.id
  WHERE 
    aa.agent_id = agent_id_param
    AND aa.status = 'active';
END;
$$;
