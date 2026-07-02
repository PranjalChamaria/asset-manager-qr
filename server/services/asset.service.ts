import { getDatabase } from '../db/sqlite.js';
import { assetCodeGenerator } from './asset-code-generator.js';

export interface AssetRecord {
  id: number;
  asset_code: string;
  company: string | null;
  asset_name: string;
  category: string | null;
  brand: string | null;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_fund: string | null;
  vendor: string | null;
  department: string | null;
  user_branch: string | null;
  warranty_months: number | null;
  warranty_expiry: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AssetInput {
  asset_code?: string;
  company?: string | null;
  asset_name?: string;
  category?: string | null;
  brand?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  purchase_fund?: string | null;
  vendor?: string | null;
  department?: string | null;
  user_branch?: string | null;
  warranty_months?: number | null;
  warranty_expiry?: string | null;
  status?: string;
  remarks?: string | null;
}

class AssetService {
  listAssets(options: { search?: string; view?: 'active' | 'trash' | 'all' } = {}): AssetRecord[] {
    const db = getDatabase();
    const view = options.view ?? 'active';
    const search = options.search?.trim() ?? '';
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (view === 'trash') {
      whereClauses.push('deleted_at IS NOT NULL');
    } else if (view === 'active') {
      whereClauses.push('deleted_at IS NULL');
    }

    if (search) {
      whereClauses.push(`(
        asset_code LIKE ? OR
        asset_name LIKE ? OR
        category LIKE ? OR
        brand LIKE ? OR
        serial_number LIKE ? OR
        vendor LIKE ? OR
        department LIKE ? OR
        user_branch LIKE ?
      )`);
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM assets ${where} ORDER BY created_at DESC`;
    return db.prepare(sql).all(...params) as AssetRecord[];
  }

  getAssetById(id: string): AssetRecord | undefined {
    const db = getDatabase();
    return db.prepare(`
      SELECT *
      FROM assets
      WHERE id = ? AND deleted_at IS NULL
    `).get(id) as AssetRecord | undefined;
  }

  createAsset(input: AssetInput): AssetRecord {
    this.validateAssetInput(input);

    const db = getDatabase();
    const now = new Date().toISOString();
    const payload = this.buildPayload(input, now);

    const transaction = db.transaction(() => {
      const assetCode = assetCodeGenerator.reserveCodeInTransaction(db);
      const result = db.prepare(`
        INSERT INTO assets (
          asset_code,
          company,
          asset_name,
          category,
          brand,
          model_number,
          serial_number,
          purchase_date,
          purchase_price,
          purchase_fund,
          vendor,
          department,
          user_branch,
          warranty_months,
          warranty_expiry,
          status,
          remarks,
          created_at,
          updated_at
        ) VALUES (
          @asset_code,
          @company,
          @asset_name,
          @category,
          @brand,
          @model_number,
          @serial_number,
          @purchase_date,
          @purchase_price,
          @purchase_fund,
          @vendor,
          @department,
          @user_branch,
          @warranty_months,
          @warranty_expiry,
          @status,
          @remarks,
          @created_at,
          @updated_at
        )
      `).run({ ...payload, asset_code: assetCode } as Record<string, unknown>);

      return db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid) as AssetRecord;
    });

    return transaction();
  }

  updateAsset(id: string, input: AssetInput): AssetRecord | undefined {
    const existing = this.getAssetById(id);
    if (!existing) {
      return undefined;
    }

    this.validateAssetInput(input);

    const db = getDatabase();
    const now = new Date().toISOString();
    const payload = this.buildPayload(input, now, existing);

    db.prepare(`
      UPDATE assets
      SET
        asset_code = @asset_code,
        company = @company,
        asset_name = @asset_name,
        category = @category,
        brand = @brand,
        model_number = @model_number,
        serial_number = @serial_number,
        purchase_date = @purchase_date,
        purchase_price = @purchase_price,
        purchase_fund = @purchase_fund,
        vendor = @vendor,
        department = @department,
        user_branch = @user_branch,
        warranty_months = @warranty_months,
        warranty_expiry = @warranty_expiry,
        status = @status,
        remarks = @remarks,
        updated_at = @updated_at
      WHERE id = @id
    `).run({ ...payload, id });

    return this.getAssetById(id);
  }

  softDeleteAsset(id: string): boolean {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(id);
    if (!existing) {
      return false;
    }

    db.prepare(`
      UPDATE assets
      SET deleted_at = ?, updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), new Date().toISOString(), id);

    return true;
  }

  restoreAsset(id: string): boolean {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(id);
    if (!existing) {
      return false;
    }

    db.prepare(`
      UPDATE assets
      SET deleted_at = NULL, updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);

    return true;
  }

  permanentDeleteAsset(id: string): boolean {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM assets WHERE id = ?').get(id);
    if (!existing) {
      return false;
    }

    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
    return true;
  }

  private buildPayload(input: AssetInput, now: string, existing?: AssetRecord) {
    return {
      asset_code: existing?.asset_code ?? '',
      company: input.company ?? existing?.company ?? null,
      asset_name: input.asset_name ?? existing?.asset_name ?? '',
      category: input.category ?? existing?.category ?? null,
      brand: input.brand ?? existing?.brand ?? null,
      model_number: input.model_number ?? existing?.model_number ?? null,
      serial_number: input.serial_number ?? existing?.serial_number ?? null,
      purchase_date: input.purchase_date ?? existing?.purchase_date ?? null,
      purchase_price: input.purchase_price ?? existing?.purchase_price ?? null,
      purchase_fund: input.purchase_fund ?? existing?.purchase_fund ?? null,
      vendor: input.vendor ?? existing?.vendor ?? null,
      department: input.department ?? existing?.department ?? null,
      user_branch: input.user_branch ?? existing?.user_branch ?? null,
      warranty_months: input.warranty_months ?? existing?.warranty_months ?? null,
      warranty_expiry: input.warranty_expiry ?? existing?.warranty_expiry ?? null,
      status: input.status ?? existing?.status ?? 'Active',
      remarks: input.remarks ?? existing?.remarks ?? null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
  }

  private validateAssetInput(input: AssetInput) {
    if (!input.asset_name) {
      throw new Error('asset_name is required');
    }

    if (typeof input.asset_name === 'string' && input.asset_name.trim() === '') {
      throw new Error('asset_name cannot be empty');
    }
  }

}

export const assetService = new AssetService();
