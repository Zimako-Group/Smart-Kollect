-- Create payment_metrics table to track file upload statistics
CREATE TABLE IF NOT EXISTS payment_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  files_processed INTEGER DEFAULT 0,
  payments_processed INTEGER DEFAULT 0,
  payments_amount NUMERIC(15, 2) DEFAULT 0.00,
  pending_validations INTEGER DEFAULT 0,
  failed_uploads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create a unique index on the date field to ensure one record per day
CREATE UNIQUE INDEX IF NOT EXISTS payment_metrics_date_idx ON payment_metrics(date);

-- Create a function to initialize today's metrics if they don't exist
CREATE OR REPLACE FUNCTION initialize_todays_metrics()
RETURNS UUID AS $$
DECLARE
  metrics_id UUID;
BEGIN
  -- Check if we already have a record for today
  SELECT id INTO metrics_id FROM payment_metrics WHERE date = CURRENT_DATE;
  
  -- If no record exists for today, create one
  IF metrics_id IS NULL THEN
    INSERT INTO payment_metrics (date) VALUES (CURRENT_DATE) RETURNING id INTO metrics_id;
  END IF;
  
  RETURN metrics_id;
END;
$$ LANGUAGE plpgsql;

-- Create functions to update metrics
CREATE OR REPLACE FUNCTION increment_files_processed()
RETURNS VOID AS $$
DECLARE
  metrics_id UUID;
BEGIN
  metrics_id := initialize_todays_metrics();
  UPDATE payment_metrics 
  SET 
    files_processed = files_processed + 1,
    updated_at = NOW()
  WHERE id = metrics_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payments_processed(payment_count INTEGER, payment_total NUMERIC)
RETURNS VOID AS $$
DECLARE
  metrics_id UUID;
BEGIN
  metrics_id := initialize_todays_metrics();
  UPDATE payment_metrics 
  SET 
    payments_processed = payments_processed + payment_count,
    payments_amount = payments_amount + payment_total,
    updated_at = NOW()
  WHERE id = metrics_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pending_validations(count_change INTEGER)
RETURNS VOID AS $$
DECLARE
  metrics_id UUID;
BEGIN
  metrics_id := initialize_todays_metrics();
  UPDATE payment_metrics 
  SET 
    pending_validations = pending_validations + count_change,
    updated_at = NOW()
  WHERE id = metrics_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_failed_uploads()
RETURNS VOID AS $$
DECLARE
  metrics_id UUID;
BEGIN
  metrics_id := initialize_todays_metrics();
  UPDATE payment_metrics 
  SET 
    failed_uploads = failed_uploads + 1,
    updated_at = NOW()
  WHERE id = metrics_id;
END;
$$ LANGUAGE plpgsql;

-- Insert initial record for today if it doesn't exist
SELECT initialize_todays_metrics();

-- Create a view for summarizing metrics over time periods
CREATE OR REPLACE VIEW payment_metrics_summary AS
SELECT
  'today' as period,
  SUM(files_processed) as files_processed,
  SUM(payments_processed) as payments_processed,
  SUM(payments_amount) as payments_amount,
  SUM(pending_validations) as pending_validations,
  SUM(failed_uploads) as failed_uploads
FROM payment_metrics
WHERE date = CURRENT_DATE

UNION ALL

SELECT
  'week' as period,
  SUM(files_processed) as files_processed,
  SUM(payments_processed) as payments_processed,
  SUM(payments_amount) as payments_amount,
  SUM(pending_validations) as pending_validations,
  SUM(failed_uploads) as failed_uploads
FROM payment_metrics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT
  'month' as period,
  SUM(files_processed) as files_processed,
  SUM(payments_processed) as payments_processed,
  SUM(payments_amount) as payments_amount,
  SUM(pending_validations) as pending_validations,
  SUM(failed_uploads) as failed_uploads
FROM payment_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Create a view for calculating percentage changes
CREATE OR REPLACE VIEW payment_metrics_changes AS
WITH current_day AS (
  SELECT 
    COALESCE(SUM(files_processed), 0) as files_processed,
    COALESCE(SUM(failed_uploads), 0) as failed_uploads
  FROM payment_metrics 
  WHERE date = CURRENT_DATE
),
previous_day AS (
  SELECT 
    COALESCE(SUM(files_processed), 0) as files_processed,
    COALESCE(SUM(failed_uploads), 0) as failed_uploads
  FROM payment_metrics 
  WHERE date = CURRENT_DATE - INTERVAL '1 day'
),
current_week AS (
  SELECT 
    COALESCE(SUM(files_processed), 0) as files_processed,
    COALESCE(SUM(payments_processed), 0) as payments_processed,
    COALESCE(SUM(payments_amount), 0) as payments_amount
  FROM payment_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
),
previous_week AS (
  SELECT 
    COALESCE(SUM(files_processed), 0) as files_processed,
    COALESCE(SUM(payments_processed), 0) as payments_processed,
    COALESCE(SUM(payments_amount), 0) as payments_amount
  FROM payment_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '14 days' AND date < CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  CASE 
    WHEN previous_day.files_processed = 0 THEN 0
    ELSE ROUND((current_day.files_processed - previous_day.files_processed)::NUMERIC / GREATEST(previous_day.files_processed, 1) * 100, 1)
  END as files_processed_change,
  
  CASE 
    WHEN previous_week.payments_amount = 0 THEN 0
    ELSE ROUND((current_week.payments_amount - previous_week.payments_amount)::NUMERIC / GREATEST(previous_week.payments_amount, 1) * 100, 1)
  END as payments_amount_change,
  
  CASE 
    WHEN previous_day.failed_uploads = 0 THEN 0
    ELSE ROUND((current_day.failed_uploads - previous_day.failed_uploads)::NUMERIC / GREATEST(previous_day.failed_uploads, 1) * 100, 1)
  END as failed_uploads_change;
