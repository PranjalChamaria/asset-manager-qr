import { getDatabase } from '../db/sqlite.js';

const DEFAULT_PREFIX = 'AST';
const CODE_DIGITS = 6;

export class AssetCodeGenerator {
  constructor(private readonly prefix: string = DEFAULT_PREFIX) {}

  reserveCodeInTransaction(db: ReturnType<typeof getDatabase>): string {
    const prefix = this.prefix.toUpperCase();
    this.ensureSequenceTable(db);

    const existingMax = this.getHighestExistingNumber(db, prefix);
    const row = db
      .prepare('SELECT next_value FROM asset_code_sequences WHERE prefix = ?')
      .get(prefix) as { next_value: number } | undefined;

    const nextValue = Math.max(existingMax + 1, row?.next_value ?? 1);

    if (!row) {
      db.prepare('INSERT INTO asset_code_sequences (prefix, next_value) VALUES (?, ?)').run(prefix, nextValue + 1);
    } else {
      db.prepare('UPDATE asset_code_sequences SET next_value = ? WHERE prefix = ?').run(nextValue + 1, prefix);
    }

    return this.formatCode(nextValue);
  }

  formatCode(value: number): string {
    return `${this.prefix.toUpperCase()}-${String(value).padStart(CODE_DIGITS, '0')}`;
  }

  private ensureSequenceTable(db: ReturnType<typeof getDatabase>): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS asset_code_sequences (
        prefix TEXT PRIMARY KEY,
        next_value INTEGER NOT NULL DEFAULT 1
      );
    `);
  }

  private getHighestExistingNumber(db: ReturnType<typeof getDatabase>, prefix: string): number {
    const rows = db
      .prepare('SELECT asset_code FROM assets WHERE asset_code LIKE ?')
      .all(`${prefix}-%`) as Array<{ asset_code: string | null }>;

    let highest = 0;
    for (const row of rows) {
      if (!row.asset_code) continue;
      const match = row.asset_code.match(/^([A-Z0-9._-]+)-(\d+)$/i);
      if (!match) continue;
      if (match[1].toUpperCase() !== prefix) continue;
      const numeric = Number(match[2]);
      if (!Number.isNaN(numeric) && numeric > highest) {
        highest = numeric;
      }
    }

    return highest;
  }
}

export const assetCodeGenerator = new AssetCodeGenerator();
