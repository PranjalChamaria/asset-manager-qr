import { supabase } from "@/integrations/supabase/client";
import type { Asset } from "@/lib/asset-types";

export type AssetPayload = Record<string, unknown> & { id?: string };

export interface AssetDatabase {
  listAssets(): Promise<Asset[]>;
  getAssetByCode(code: string): Promise<Asset | null>;
  createAsset(payload: AssetPayload): Promise<void>;
  updateAsset(id: string, payload: AssetPayload): Promise<void>;
  softDeleteAsset(id: string): Promise<void>;
  restoreAsset(id: string): Promise<void>;
  deleteAsset(id: string): Promise<void>;
}

export class SupabaseAssetDatabase implements AssetDatabase {
  private get db() {
    return supabase as unknown as { from: (table: string) => any };
  }

  async listAssets(): Promise<Asset[]> {
    const { data, error } = await this.db.from("assets").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Asset[];
  }

  async getAssetByCode(code: string): Promise<Asset | null> {
    const { data, error } = await this.db.from("assets").select("*").eq("asset_code", code).maybeSingle();
    if (error) throw error;
    return data as Asset | null;
  }

  async createAsset(payload: AssetPayload): Promise<void> {
    const { error } = await this.db.from("assets").insert(payload);
    if (error) throw error;
  }

  async updateAsset(id: string, payload: AssetPayload): Promise<void> {
    const { error } = await this.db.from("assets").update(payload).eq("id", id);
    if (error) throw error;
  }

  async softDeleteAsset(id: string): Promise<void> {
    const { error } = await this.db.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  }

  async restoreAsset(id: string): Promise<void> {
    const { error } = await this.db.from("assets").update({ deleted_at: null }).eq("id", id);
    if (error) throw error;
  }

  async deleteAsset(id: string): Promise<void> {
    const { error } = await this.db.from("assets").delete().eq("id", id);
    if (error) throw error;
  }
}

export const assetDatabase = new SupabaseAssetDatabase();
