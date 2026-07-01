import type { Request, Response } from 'express';
import { assetService } from '../services/asset.service.js';

class AssetController {
  getAll = async (_req: Request, res: Response) => {
    try {
      const assets = await assetService.listAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assets', error: this.getErrorMessage(error) });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const asset = await assetService.getAssetById(id);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      return res.json(asset);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch asset', error: this.getErrorMessage(error) });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const asset = await assetService.createAsset(req.body);
      return res.status(201).json(asset);
    } catch (error) {
      if (this.isDuplicateAssetCodeError(error)) {
        return res.status(409).json({ message: 'Asset code already exists' });
      }
      return res.status(400).json({ message: 'Failed to create asset', error: this.getErrorMessage(error) });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const asset = await assetService.updateAsset(id, req.body);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      return res.json(asset);
    } catch (error) {
      if (this.isDuplicateAssetCodeError(error)) {
        return res.status(409).json({ message: 'Asset code already exists' });
      }
      return res.status(400).json({ message: 'Failed to update asset', error: this.getErrorMessage(error) });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deleted = await assetService.softDeleteAsset(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ message: 'Failed to delete asset', error: this.getErrorMessage(error) });
    }
  };

  private isDuplicateAssetCodeError(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'Unknown error';
  }
}

export const assetController = new AssetController();
