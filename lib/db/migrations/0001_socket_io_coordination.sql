CREATE TABLE IF NOT EXISTS socket_io_attachments (
  id bigserial UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload bytea NOT NULL
);

CREATE INDEX IF NOT EXISTS socket_io_attachments_created_idx
  ON socket_io_attachments(created_at);
