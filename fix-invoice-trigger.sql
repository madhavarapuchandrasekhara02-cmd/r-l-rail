-- Run this SQL in the Supabase SQL Editor to auto-generate invoice numbers

-- 1. Create a sequence for invoices if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_val TEXT;
  seq_val TEXT;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year_val := to_char(CURRENT_DATE, 'YYYY');
    seq_val := lpad(nextval('invoice_seq')::text, 6, '0');
    NEW.invoice_number := 'RL-' || year_val || '-' || seq_val;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the orders table
DROP TRIGGER IF EXISTS trg_set_invoice_number ON orders;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();
