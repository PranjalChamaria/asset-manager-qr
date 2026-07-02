import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuredDataDir = process.env.ASSET_MANAGER_DATA_DIR;
const defaultDataDir = configuredDataDir || path.join(
  process.platform === 'win32'
    ? path.join(os.homedir(), 'AppData', 'Roaming', 'Asset Manager', 'data')
    : path.join(os.homedir(), '.config', 'Asset Manager', 'data')
);
const databaseDir = path.resolve(defaultDataDir);
const databaseFile = path.join(databaseDir, 'assets.db');

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
