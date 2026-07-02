CREATE TABLE IF NOT EXISTS asset_code_sequences (
  prefix TEXT PRIMARY KEY,
  next_value INTEGER NOT NULL DEFAULT 1
);
