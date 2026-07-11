-- Run this SQL in your Supabase SQL Editor to create the transactional order creation procedure
-- Project database: https://yynycqniddtlbbdxfidv.supabase.co

CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_invoice_number text;
  item record;
BEGIN
  -- 1. Insert order
  INSERT INTO orders (
    customer_name,
    customer_phone,
    customer_email,
    address,
    city,
    state,
    pincode,
    status,
    payment_method,
    total,
    delivery_charge,
    total_taxable,
    total_cgst,
    total_sgst,
    total_igst,
    total_gst
  ) VALUES (
    (p_order->>'customer_name'),
    (p_order->>'customer_phone'),
    (p_order->>'customer_email'),
    (p_order->>'address'),
    (p_order->>'city'),
    (p_order->>'state'),
    (p_order->>'pincode'),
    (p_order->>'status'),
    (p_order->>'payment_method'),
    (p_order->>'total')::numeric,
    (p_order->>'delivery_charge')::numeric,
    (p_order->>'total_taxable')::numeric,
    (p_order->>'total_cgst')::numeric,
    (p_order->>'total_sgst')::numeric,
    (p_order->>'total_igst')::numeric,
    (p_order->>'total_gst')::numeric
  )
  RETURNING id, order_number, invoice_number INTO v_order_id, v_order_number, v_invoice_number;

  -- 2. Insert items
  FOR item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id uuid,
    variant_id uuid,
    product_name text,
    variant_label text,
    quantity integer,
    price numeric,
    hsn_code text,
    gst_rate numeric,
    taxable_value numeric,
    cgst_amount numeric,
    sgst_amount numeric,
    igst_amount numeric
  ) LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_label,
      quantity,
      price,
      hsn_code,
      gst_rate,
      taxable_value,
      cgst_amount,
      sgst_amount,
      igst_amount,
      status
    ) VALUES (
      v_order_id,
      item.product_id,
      item.variant_id,
      item.product_name,
      item.variant_label,
      item.quantity,
      item.price,
      item.hsn_code,
      item.gst_rate,
      item.taxable_value,
      item.cgst_amount,
      item.sgst_amount,
      item.igst_amount,
      'Pending'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'invoice_number', v_invoice_number
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
