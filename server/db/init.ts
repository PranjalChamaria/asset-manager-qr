import { runMigrations } from './migrate.js';

export function initializeDatabase() {
  runMigrations();
}
