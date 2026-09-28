CREATE UNIQUE INDEX IF NOT EXISTS shipments_source_quote_uq
  ON shipments(source_quote_id);
