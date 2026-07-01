CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL UNIQUE,
  company TEXT,
  asset_name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date TEXT,
  purchase_price REAL,
  purchase_fund TEXT,
  vendor TEXT,
  department TEXT,
  user_branch TEXT,
  warranty_months INTEGER,
  warranty_expiry TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets (asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets (deleted_at);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets (created_at);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets (department);
CREATE INDEX IF NOT EXISTS idx_assets_user_branch ON assets (user_branch);
