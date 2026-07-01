import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase } from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveMigrationDirectory(): string {
  const candidates = [
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '..', 'migrations'),
    path.resolve(__dirname, '..', '..', 'db', 'migrations'),
    path.resolve(process.cwd(), 'server', 'db', 'migrations'),
    path.resolve(process.cwd(), 'server', 'dist', 'db', 'migrations'),
    path.resolve(process.cwd(), 'db', 'migrations'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate migration directory. Checked: ${candidates.join(', ')}`);
}

export function runMigrations() {
  const db = getDatabase();
  const migrationsDir = resolveMigrationDirectory();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[];
  const appliedNames = new Set(applied.map((row) => row.name));

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of migrationFiles) {
    if (appliedNames.has(file)) continue;

    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(migrationSql);
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
  }
}
