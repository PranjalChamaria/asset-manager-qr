import type { Asset } from "@/lib/asset-types";
import { apiFetch } from "@/lib/api";

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

export class LocalAssetDatabase implements AssetDatabase {
  async listAssets(): Promise<Asset[]> {
    return apiFetch<Asset[]>("/api/assets");
  }

  async getAssetByCode(code: string): Promise<Asset | null> {
    return apiFetch<Asset | null>(`/api/assets/${encodeURIComponent(code)}`);
  }

  async createAsset(payload: AssetPayload): Promise<void> {
    await apiFetch<void>("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async updateAsset(id: string, payload: AssetPayload): Promise<void> {
    await apiFetch<void>(`/api/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async softDeleteAsset(id: string): Promise<void> {
    await apiFetch<void>(`/api/assets/${id}`, { method: "DELETE" });
  }

  async restoreAsset(id: string): Promise<void> {
    await apiFetch<void>(`/api/assets/${id}/restore`, { method: "POST" });
  }

  async deleteAsset(id: string): Promise<void> {
    await apiFetch<void>(`/api/assets/${id}/permanent`, { method: "DELETE" });
  }
}

export const assetDatabase = new LocalAssetDatabase();
