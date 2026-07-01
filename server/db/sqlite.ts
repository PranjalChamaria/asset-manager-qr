import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseDir = path.resolve(__dirname, '../../database');
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
