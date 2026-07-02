import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabase } from './sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveMigrationDirectory(): string {
  // In packaged Electron, migration files are placed in extraResources/db/migrations
  // (outside the ASAR archive) so they can be read at runtime.
  // ASSET_MANAGER_RESOURCES_DIR is set by electron/main.cjs in production.
  const candidates = [
    // Packaged Electron: extraResources lands next to the app resources
    process.env.ASSET_MANAGER_RESOURCES_DIR
      ? path.join(process.env.ASSET_MANAGER_RESOURCES_DIR, 'db', 'migrations')
      : null,
    // Development / compiled server: sibling to this file in dist/db/migrations
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '..', 'migrations'),
    // Source layout (ts-node / ts-node-esm)
    path.resolve(__dirname, '..', '..', 'db', 'migrations'),
    path.resolve(process.cwd(), 'server', 'db', 'migrations'),
    path.resolve(process.cwd(), 'server', 'dist', 'db', 'migrations'),
    path.resolve(process.cwd(), 'db', 'migrations'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate migration directory. Checked:\n  ${candidates.join('\n  ')}`);
}

export function runMigrations() {
  const db = getDatabase();
  const migrationsDir = resolveMigrationDirectory();

  console.log(`[sqlite] Migration directory: ${migrationsDir}`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[];
  const appliedNames = new Set(applied.map((row) => row.name));

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  console.log(`[sqlite] Migration files found: ${migrationFiles.length}`);

  let appliedCount = 0;

  for (const file of migrationFiles) {
    if (appliedNames.has(file)) {
      console.log(`[sqlite] Skipping already applied: ${file}`);
      continue;
    }

    console.log(`[sqlite] Applying migration: ${file}`);
    const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(migrationSql);
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
    appliedCount += 1;
  }

  console.log(`[sqlite] Migrations applied: ${appliedCount}`);
  console.log('[sqlite] Database initialization complete');
}
