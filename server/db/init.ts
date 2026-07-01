import { getDatabase } from './sqlite.js';

export function initializeDatabase() {
  const db = getDatabase();

  db.exec(`
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
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS health_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
