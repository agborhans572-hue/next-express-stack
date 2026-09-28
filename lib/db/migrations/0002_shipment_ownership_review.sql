ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS ownership_needs_review boolean NOT NULL DEFAULT false;

UPDATE shipments
SET customer_id = sender_id,
    ownership_needs_review = false
WHERE customer_id IS NULL
  AND sender_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = shipments.sender_id
      AND users.role = 'customer'
  );

UPDATE shipments
SET ownership_needs_review = true
WHERE customer_id IS NULL
  AND sender_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = shipments.sender_id
      AND users.role IN ('admin', 'operator', 'support')
  );
