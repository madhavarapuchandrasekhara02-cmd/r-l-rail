-- Run this SQL in your Supabase SQL Editor to support atomic batch manifestations
-- Project database: https://yynycqniddtlbbdxfidv.supabase.co

CREATE OR REPLACE FUNCTION save_shipments_and_update_status(
  p_shipments jsonb
) RETURNS jsonb AS $$
DECLARE
  shipment_record record;
  updated_count integer := 0;
BEGIN
  -- Iterates through the provided shipments array
  FOR shipment_record IN SELECT * FROM jsonb_to_recordset(p_shipments) AS x(
    order_id uuid,
    waybill text,
    tracking_url text,
    shipped_at text
  ) LOOP
    -- 1. Clean up old/stale shipment records for this order
    DELETE FROM shipments WHERE order_id = shipment_record.order_id;

    -- 2. Insert the new valid shipment record
    INSERT INTO shipments (
      order_id,
      waybill,
      tracking_status,
      tracking_url,
      shipped_at
    ) VALUES (
      shipment_record.order_id,
      shipment_record.waybill,
      'Manifested',
      shipment_record.tracking_url,
      shipment_record.shipped_at::timestamptz
    );

    -- 3. Update the parent order's status to Packed
    UPDATE orders 
    SET 
      status = 'Packed', 
      updated_at = NOW() 
    WHERE id = shipment_record.order_id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
