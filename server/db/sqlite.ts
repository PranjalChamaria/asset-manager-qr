import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In the packaged Electron app, ASSET_MANAGER_DATA_DIR is set by electron/main.cjs
// to app.getPath('userData')/data so the DB survives app updates.
// In development (npm run server), fall back to a sibling database/ directory.
const databaseDir = process.env.ASSET_MANAGER_DATA_DIR
  ? path.resolve(process.env.ASSET_MANAGER_DATA_DIR)
  : path.resolve(__dirname, '../../database');

const databaseFile = path.join(databaseDir, 'assets.db');

console.log(`[sqlite] Database directory: ${databaseDir}`);
console.log(`[sqlite] Database file: ${databaseFile}`);

if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const sqlite = new Database(databaseFile);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export function getDatabase() {
  return sqlite;
}

export function closeDatabase() {
  sqlite.close();
}
